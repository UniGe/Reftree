using MagicFramework.Helpers;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OfficeOpenXml;
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading;
using System.Web;
using System.Web.Http;

namespace MagicFramework.Controllers
{
    public class Magic_DocumentModelController : ApiController
    {
        private const string documentFillFolder = "DocumentFill";
        private const string zipComment = "Zipped by MagicFramework";
        private string exportdir = MagicFramework.Helpers.Utils.retcompletepath(ApplicationSettingsManager.GetRootdirforupload() ?? HttpContext.Current.Server.MapPath("~"));
        private static readonly Dictionary<int, BuildTask> buildTasks = new Dictionary<int, BuildTask>();

        [HttpPost]
        public HttpResponseMessage BuildExcel(excelBuilderData data)
        {
            HttpResponseMessage result = new HttpResponseMessage(HttpStatusCode.OK);
            try
            {
                dynamic inputData = Newtonsoft.Json.JsonConvert.DeserializeObject(data.data);
                ExcelDocumentFiller docfiller = new ExcelDocumentFiller();
                string filename = String.IsNullOrEmpty(data.fileName) ? "excel_built_" + DateTime.Now.Ticks.ToString() : data.fileName;
                filename = filename + ".xlsx";
                string wherecondition = null;
                var req = new Models.Request();

                if (data.filter != null)
                {
                    dynamic filter = Newtonsoft.Json.JsonConvert.DeserializeObject(data.filter);
                    JObject jfilter = JObject.FromObject(filter);
                    req.filter = filter.ToObject<Models.Filters>();
                    var rp = new MagicFramework.Helpers.RequestParser(req);
                    wherecondition = rp.BuildWhereCondition(true);
                }
                string storedProcedure = data.storedProcedure;
                string storedProcedureAfter = data.storedProcedureAfter;
                if (String.IsNullOrEmpty(data.storedProcedure) || String.IsNullOrEmpty(data.storedProcedureAfter))
                {
                    if (String.IsNullOrEmpty(data.tipmodId))
                        return Utils.GetErrorMessageForDownload("Model Id or stored procedure have to be specified!!!");
                    var dbutils = new DatabaseCommandUtils();
                    JObject tipmodID = JObject.FromObject(new { tipmodId = data.tipmodId });
                    DataSet ds = dbutils.GetDataSetFromStoredProcedure("dbo.Magic_GetModelById", tipmodID);
                    if (String.IsNullOrEmpty(storedProcedure))
                        storedProcedure = ds.Tables[0].Rows[0]["Stored_GetData"].ToString();
                    if (string.IsNullOrEmpty(storedProcedureAfter))
                        storedProcedureAfter = ds.Tables[0].Rows[0]["Stored_Output"].ToString();
                }
                FileStream stream = docfiller.fillDocument(storedProcedure,storedProcedureAfter, inputData, Path.Combine(ApplicationSettingsManager.GetRootdirforupload(), filename), wherecondition);
                result.Content = new StreamContent(stream);
                result.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                result.Content.Headers.Add("Content-Disposition", "attachment; filename=" + Path.GetFileName(docfiller.outputFileName));
                var cookie = new CookieHeaderValue("fileDownload", "true");
                cookie.Expires = DateTimeOffset.Now.AddDays(1);
                cookie.Path = "/";
                result.Headers.AddCookies(new CookieHeaderValue[] { cookie });
            }
            catch (Exception ex)
            {
                return Utils.GetErrorMessageForDownload(ex.Message);
            }
            return result;
        }
        [HttpPost]
        public HttpResponseMessage BuildDocumentsFromModel(documentsData data)
        {
            try
            {
                dynamic formData = JsonConvert.DeserializeObject(data.formData);
               

                MagicFramework.Data.MagicDBDataContext magicDBContext = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                MagicFramework.Data.Magic_DocumentFillSessions documentFillSession = new MagicFramework.Data.Magic_DocumentFillSessions
                {
                    InputData = formData.ToString(),
                    User_ID = SessionHandler.IdUser,
                    StartDate = DateTime.Now
                };
                magicDBContext.Magic_DocumentFillSessions.InsertOnSubmit(documentFillSession);
                magicDBContext.SubmitChanges();

                WordDocumentFiller docfiller = new WordDocumentFiller(data.tipmodId, formData, documentFillSession.ID);
                docfiller.FillDictionariesAndMetaData();

                bool isMSSQLFileActive = ApplicationSettingsManager.getMSSQLFileTable();
                string directory = Path.Combine(exportdir, documentFillFolder, documentFillSession.ID.ToString());
                string output_directory = docfiller.Output_Directory;

                //if !getMSSQLFileTable so add root dir to get an absolute path (checked in WordDocumentFiller->Savefile)
                if (output_directory != null && !isMSSQLFileActive)
                    output_directory = Path.Combine(exportdir, output_directory);

                Directory.CreateDirectory(directory);
                if (!Directory.Exists(directory))
                    return Utils.retInternalServerError("Error on creating directory: " + directory);

                bool isBatch = docfiller.Flag_Batch;
                DateTime expirationDate = DateTime.Now.AddDays(-30);

                foreach (string dir in Directory.GetDirectories(Path.Combine(exportdir, documentFillFolder)))
                {
                    if (Directory.GetLastWriteTime(dir) <= expirationDate)
                        Directory.Delete(dir, true);
                }

                OutputFilesData OutputFilesData = new OutputFilesData
                {
                    magicDBContext = magicDBContext,
                    documentFillSession = documentFillSession,
                    zipName = "Export_" + Utils.DateimeForFileName() + ".zip",
                    directory = directory,
                    docfiller = docfiller,
                    //templateFile = templateFile,
                    saveAsPdf = docfiller.OutCode == "pdf",
                    dbutils = new DatabaseCommandUtils(),
                    Stored_Output = docfiller.Stored_Output,
                    createZip = !isBatch,
                    copyResultsToDirectory = output_directory,
                    targetConnection = DBConnectionManager.GetTargetConnection()
                };

                int? taskID = null;
                OutputFilesSessionData OutputFilesSessionData = new OutputFilesSessionData {
                    idUser = SessionHandler.IdUser, //in the separate Thread the session is not available
                    idUserGroup = SessionHandler.UserVisibilityGroup,
                    connectionString = DBConnectionManager.GetTargetConnection()
                };
                if (formData["synch"] == true)
                {
                    MFLog.LogInFile("buildOutputFiles starts...",MFLog.logtypes.INFO);
                    buildOutputFiles(OutputFilesData, OutputFilesSessionData, isMSSQLFileActive);
                    MFLog.LogInFile("buildOutputFiles ends...", MFLog.logtypes.INFO);

                }
                else
                {
                    ManualResetEventSlim pauseEvent = new ManualResetEventSlim(true);
                    CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();
                    System.Threading.Tasks.Task task = new System.Threading.Tasks.Task(() => buildOutputFiles(OutputFilesData, OutputFilesSessionData, isMSSQLFileActive, null, cancellationTokenSource, pauseEvent), cancellationTokenSource.Token);
                    buildTasks.Add(task.Id, new BuildTask { userID = SessionHandler.IdUser, task = task, cancellationTokenSource = cancellationTokenSource, pauseEvent = pauseEvent });
                    taskID = task.Id;
                    task.Start();
                }
               
                JObject json = new JObject();
                json.Add("taskID", taskID);
                json.Add("documentFillSessionId", documentFillSession.ID);
                json.Add("fileCount", docfiller.getFilesToProduceCount()); //1 for each RootBo + combine + zip
                json.Add("zipName", Path.GetFileName(OutputFilesData.zipName));

                HttpResponseMessage r = new HttpResponseMessage();
                r.StatusCode = HttpStatusCode.OK;
                if (!isBatch)
                    r.Content = new StringContent(json.ToString());
                return r;
                
            }
            catch (Exception ex)
            {
                return Utils.retInternalServerError(ex.Message);
            }
        }

        [HttpPost]
        public HttpResponseMessage StopTask(int taskID)
        {
            HttpResponseMessage r = new HttpResponseMessage();
            if (!buildTasks.ContainsKey(taskID))
                r.StatusCode = HttpStatusCode.NotFound;
            else if (buildTasks[taskID].userID != SessionHandler.IdUser)
                r.StatusCode = HttpStatusCode.BadRequest;
            else
            {
                buildTasks[taskID].cancellationTokenSource.Cancel();
                buildTasks.Remove(taskID);
                r.StatusCode = HttpStatusCode.OK;
            }
            return r;
        }

        [HttpPost]
        public HttpResponseMessage PauseTask(int taskID)
        {
            HttpResponseMessage r = new HttpResponseMessage();
            if (!buildTasks.ContainsKey(taskID))
                r.StatusCode = HttpStatusCode.NotFound;
            else if (buildTasks[taskID].userID != SessionHandler.IdUser)
                r.StatusCode = HttpStatusCode.BadRequest;
            else
            {
                buildTasks[taskID].pauseEvent.Reset();
                r.StatusCode = HttpStatusCode.OK;
            }
            return r;
        }

        [HttpPost]
        public HttpResponseMessage ResumeTask(int taskID)
        {
            HttpResponseMessage r = new HttpResponseMessage();
            if (!buildTasks.ContainsKey(taskID))
                r.StatusCode = HttpStatusCode.NotFound;
            else if (buildTasks[taskID].userID != SessionHandler.IdUser)
                r.StatusCode = HttpStatusCode.BadRequest;
            else
            {
                buildTasks[taskID].pauseEvent.Set();
                r.StatusCode = HttpStatusCode.OK;
            }
            return r;
        }

        [HttpGet]
        public HttpResponseMessage GetFirstFile(int documentFillSessionId)
        { 
            HttpResponseMessage r = new HttpResponseMessage();
            string directory = Path.Combine(exportdir, documentFillFolder, documentFillSessionId.ToString());
            string[] files = Directory.GetFiles(directory, "*.pdf", SearchOption.TopDirectoryOnly);
            if (files.Length < 1)
                r.StatusCode = HttpStatusCode.NotFound;
            else
            {
                r.StatusCode = HttpStatusCode.OK;
                byte[] buffer;
                using (FileStream stream = new FileStream(files[0], FileMode.Open))
                {
                    using (BinaryReader br = new BinaryReader(stream))
                    {
                        buffer = br.ReadBytes((int)stream.Length);
                    }

                }
                string contentType = Utils.GetMimeType(files[0]);
                //contentType = "application/octet-stream";
                r.Content = new ByteArrayContent(buffer);
                r.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
                r.Content.Headers.Add("Content-Disposition", string.Format("inline;FileName=\"{0}\"", Path.GetFileName(files[0])));
            }
            return r;

        }

        private void buildOutputFiles(OutputFilesData data, OutputFilesSessionData sessionData, bool isMSSQLFileActive, string PDFNetServiceDirectory = null, CancellationTokenSource cancellationTokenSource = null, ManualResetEventSlim pauseEvent = null, bool pauseAfterFirstFile = false)
        {

            foreach (var cultureid in data.docfiller.TemplateData.Keys)
            {
                data.docfiller.BuildOutputFiles(data.directory, data.documentFillSession, data.magicDBContext, data.dbutils, data.targetConnection, sessionData.idUser, sessionData.idUserGroup, data.docfiller.templateIsPdf() ? false : data.saveAsPdf, data.copyResultsToDirectory, cultureid, isMSSQLFileActive, null, false, PDFNetServiceDirectory, cancellationTokenSource, pauseEvent, pauseAfterFirstFile);
                pauseAfterFirstFile = false;
            }

            if (cancellationTokenSource != null)
            {
                if (pauseEvent != null)
                    pauseEvent.Wait(cancellationTokenSource.Token);
                try
                {
                    cancellationTokenSource.Token.ThrowIfCancellationRequested();
                }
                catch (Exception e)
                {
                    File.WriteAllText(Path.Combine(data.directory, "error.txt"), "Wordfill: " + e.Message);
                    return;
                }
            }
            if (!string.IsNullOrEmpty(data.Stored_Output))
            {
                JObject storedData = new JObject();
                storedData.Add("documentFillSessionID", data.documentFillSession.ID);
                //because i'm inside a thread the session is not available, user and usergroup are passed as parameters
                data.dbutils.GetDataSetFromStoredProcedure(data.Stored_Output, storedData, sessionData.connectionString, null, sessionData.idUser, sessionData.idUserGroup);
            }

            if (data.createZip)
            {
                Ionic.Zip.ZipFile zip = new Ionic.Zip.ZipFile();
                zip.AddDirectory(data.directory);
                zip.Comment = zipComment;
                zip.Save(Path.Combine(data.directory, data.zipName));
                zip.Dispose();
            }

            data.documentFillSession.EndDate = DateTime.Now;
            data.magicDBContext.SubmitChanges();
        }

        [HttpGet]
        public HttpResponseMessage GetExportProgress(int documentFillSessionId, int fileCount, string zipName)
        {
            string directory = Path.Combine(exportdir, documentFillFolder, documentFillSessionId.ToString());
            string errorFile = Path.Combine(directory, "error.txt");

                if (fileCount == 0)
            {
                float complete = 100;
                return Utils.retOkMessage(complete.ToString(System.Globalization.CultureInfo.InvariantCulture));
            }

            if (File.Exists(errorFile))
            {
                string error = File.ReadAllText(errorFile);
                File.Delete(errorFile);
                return Utils.retInternalServerError(error);
            }

            float percent = 100;
            int count = Directory.GetFiles(directory, "*", SearchOption.TopDirectoryOnly).Length;

            percent = count > 0 ? Math.Min(((float)count / (float)fileCount) * 100, 100) : 0;
            if (percent >= 100 && !File.Exists(Path.Combine(directory, zipName)))
                percent = 99;

            return Utils.retOkMessage(percent.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        [HttpGet]
        public HttpResponseMessage GetExportedFile(int documentFillSessionId, string zipName, int? taskID = null)
        {
            HttpResponseMessage result = new HttpResponseMessage(HttpStatusCode.OK);
            string zipPath = Path.Combine(exportdir, documentFillFolder, documentFillSessionId.ToString(), zipName);
            byte[] buffer;
            try
            {

                if (taskID != null && buildTasks.ContainsKey((int)taskID))
                    buildTasks.Remove((int)taskID);
                using (FileStream stream = new FileStream(zipPath, FileMode.Open))
                {
                    using (BinaryReader br = new BinaryReader(stream))
                    {
                        buffer = br.ReadBytes((int)stream.Length);
                    }

                }
                File.Delete(zipPath);
                string contentType = Utils.GetMimeType(zipName);
                contentType = "application/octet-stream";
                result.Content = new ByteArrayContent(buffer);
                result.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
                result.Content.Headers.Add("Content-Disposition", string.Format("inline;FileName=\"{0}\"", zipName));
            }
            catch (Exception ex)
            {
                result = Utils.GetErrorMessageForDownload("Error during file export '" + zipName + "': " + ex.Message);
            }
            return result;
        }

        public class documentsData
        {
            public int tipmodId { get; set; }
            public string formData { get; set; }
            public bool? pauseAfterFirstFile { get; set; }
        }

        public class OutputFilesData
        {
            public MagicFramework.Data.MagicDBDataContext magicDBContext { get; set; }
            public MagicFramework.Data.Magic_DocumentFillSessions documentFillSession { get; set; }
            public string zipName { get; set; }
            public string directory { get; set; }
            public WordDocumentFiller docfiller { get; set; }
            public FileInfo templateFile { get; set; }
            public DatabaseCommandUtils dbutils { get; set; }
            public string Stored_Output { get; set; }
            public bool saveAsPdf { get; set; }
            public bool createZip { get; set; }
            public string copyResultsToDirectory { get; set; }
            public string targetConnection { get; set; }
            
        }
        public class OutputFilesSessionData
        {
            public int idUser { get; set; }
            public int idUserGroup { get; set; }
            public string connectionString { get; set; }
        }

        public class excelBuilderData
        {
            public string tipmodId { get; set; }
            public string fileName { get; set; }
            public string storedProcedure { get; set; }
            public string storedProcedureAfter { get; set; }
            public string data { get; set; }
            /// <summary>
            /// The kendo filter stringified
            /// </summary>
            public string filter { get; set; }
        }

        private class BuildTask
        {
            public int userID { get; set; }
            public System.Threading.Tasks.Task task { get; set; }
            public CancellationTokenSource cancellationTokenSource { get; set; }
            public ManualResetEventSlim pauseEvent { get; set; }

        }

        [HttpGet]
        public HttpResponseMessage CompareTwoExcelFiles(string file1, string file2, string sheetName, [FromUri] string[] keyColumns)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            string folder = ApplicationSettingsManager.GetRootdirforupload();

            string filePath1 = Path.Combine(folder, file1);
            string filePath2 = Path.Combine(folder, file2);

            if (!File.Exists(filePath1) || !File.Exists(filePath2))
            {
                return CreateErrorResponse(HttpStatusCode.BadRequest, "File not found.");
            }

            string resultFileName = $"ExcelComparison{GetUnixTimestamp()}.xlsx";
            string exportFilePath = Path.Combine(folder, resultFileName);

            ExcelDocumentComparer comparer = new ExcelDocumentComparer(filePath1, filePath2, sheetName, keyColumns);
            string status = comparer.Compare();

            if (status != "ok")
            {
                return CreateErrorResponse(HttpStatusCode.BadRequest, status);
            }

            ExcelPackage excelFile = comparer.GenerateResultXLSX(exportFilePath, out status);
            if (excelFile == null)
            {
                return CreateErrorResponse(HttpStatusCode.InternalServerError, "Failed to generate Excel file.");
            }

            return GenerateFileResponse(excelFile, resultFileName);
        }

        private int GetUnixTimestamp()
        {
            return (int)DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1)).TotalSeconds;
        }

        private HttpResponseMessage CreateErrorResponse(HttpStatusCode statusCode, string message)
        {
            return new HttpResponseMessage
            {
                StatusCode = statusCode,
                Content = new StringContent(message)
            };
        }

        private HttpResponseMessage GenerateFileResponse(ExcelPackage excelFile, string resultFileName)
        {
            try
            {
                using (var stream = new MemoryStream())
                {
                    excelFile.SaveAs(stream);
                    var response = new HttpResponseMessage(HttpStatusCode.OK)
                    {
                        Content = new ByteArrayContent(stream.ToArray())
                    };
                    response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment")
                    {
                        FileName = resultFileName
                    };
                    response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                    response.Content.Headers.Add("Set-Cookie", "fileDownload=true; path=/");
                    return response;
                }
            }
            catch (Exception)
            {
                HandleLargeFileError(excelFile);
                return GenerateFileResponse(excelFile, resultFileName);
            }
        }

        private void HandleLargeFileError(ExcelPackage excelFile)
        {
            const string tooLargeToProcess = "The original file was too large to provide a copy.";
            excelFile.Workbook.Worksheets.Delete("File1");
            excelFile.Workbook.Worksheets.Delete("File2");
            var ws1 = excelFile.Workbook.Worksheets.Add("File1");
            ws1.Cells[1, 1].Value = tooLargeToProcess;
            var ws2 = excelFile.Workbook.Worksheets.Add("File2");
            ws2.Cells[1, 1].Value = tooLargeToProcess;
        }

    }
}

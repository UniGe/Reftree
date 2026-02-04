using System;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using MagicFramework.Helpers;
using System.IO;
using System.Data.SqlClient;
using System.Data;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Threading.Tasks;
using Ionic.Zip;
using OfficeOpenXml;
using System.Web.UI.HtmlControls;
using System.Diagnostics;
using System.Web;
using MagicFramework.MemberShip.Filters;
using MagicFramework.Models;
using MagicFramework.Controllers.ActionFilters;
using MagicFramework.Controllers;
using System.Web.UI;
using System.Configuration;
using System.Collections.Generic;
using System.Xml;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using System.Linq;
using System.Web.UI.WebControls;
using System.Runtime.Remoting.Contexts;
using System.Text;

namespace Ref3.Controllers
{

    

    public class ReftreeFileGenerator {

        public static void FileManagement(int eventID, string targetDBConnectionString, string magicDBConnectionString)
        {
            string sStoreProcedureEventName = "config.SRV_SP_GET_REFTREE_SERVICE_EVENT";


            string sError = "";
            string sessionGUID = Guid.NewGuid().ToString();
            Event ev = new Event(eventID, sessionGUID);
            string infos = Newtonsoft.Json.JsonConvert.SerializeObject(ev);
            var xml = JsonUtils.Json2Xml(infos, "read", sStoreProcedureEventName, "0", "0", 0, 1000000, -1, null, null, null, -1, null, null, null, null, -1, -1);
            DataSet ds = new DataSet();

            try
            {
                ds = DataBaseUtils.FillDataSet(targetDBConnectionString, String.Format(@"EXEC {0} '{1}'", sStoreProcedureEventName, xml.InnerXml));
                InfoFile oInfoFile = new InfoFile(ds);
                if (string.IsNullOrEmpty(oInfoFile.FileName) || string.IsNullOrEmpty(oInfoFile.PathFile) || oInfoFile.Dati.Count == 0)
                {
                    throw new Exception("Non sono presenti alcuni dati del file.");
                }

                if (oInfoFile.ToWrite)
                {
                    oInfoFile.FileWriteLine();
                }

                if (!string.IsNullOrEmpty(oInfoFile.StoredReturn))
                {
                    DataBaseUtils.FillDataSet(targetDBConnectionString, String.Format(@"EXEC {0} '{1}'", oInfoFile.StoredReturn, xml.InnerXml));
                }
            }
            catch (Exception ex)
            {
                sError = ex.Message.ToString();
                throw new Exception(ex.Message.ToString());
            }
            finally
            {
                ds.Dispose();
            }
        }

        public static void StartServiceFromModelByProcess(int eventID, string targetDBConnectionString, string magicDBConnectionString)
        {
            string sStoreProcedureName = "config.SRV_SP_GET_REFTREE_SERVICE_EVENT";

            string sError = "";
            string sessionGUID = Guid.NewGuid().ToString();
            Event ev = new Event(eventID, sessionGUID);
            string infos = Newtonsoft.Json.JsonConvert.SerializeObject(ev);
            var xml = JsonUtils.Json2Xml(infos, "read", sStoreProcedureName, "0", "0", 0, 1000000, -1, null, null, null, -1, null, null, null, null, -1, -1);
            DataSet ds = new DataSet();
            HttpResponseMessage r = new HttpResponseMessage();

            try
            {
                ds = DataBaseUtils.FillDataSet(targetDBConnectionString, String.Format(@"EXEC {0} '{1}'", sStoreProcedureName, xml.InnerXml));

                InfoService oInfoService = new InfoService(ds.Tables.Count > 0 ? ds.Tables[0] : null);

                if (string.IsNullOrEmpty(oInfoService.Guidid) || (!string.IsNullOrEmpty(oInfoService.ErrorId) && oInfoService.ErrorId != "0"))
                {                    
                    throw new Exception("Errore nel recupero del servizio");
                }

                if (oInfoService.IsApplicationConsole)
                {
                    r = RunExecutable(oInfoService.EndPoint);
                }

                if (!oInfoService.IsApplicationConsole)
                {
                    using (HttpClient client = new HttpClient())
                    {
                        r = client.GetAsync(oInfoService.EndPoint).Result;
                    }
                }

                if (r.StatusCode == HttpStatusCode.OK)
                {
                    if (!string.IsNullOrEmpty(oInfoService.StoredReturn))
                    {
                        xml = JsonUtils.Json2Xml(infos, "read", oInfoService.StoredReturn, "0", "0", 0, 1000000, -1, null, $"SRV_CFGREF_GUIDID=''{oInfoService.Guidid}''", null, -1, null, null, null, null, -1, -1);
                        ds = DataBaseUtils.FillDataSet(targetDBConnectionString, String.Format(@"EXEC {0} '{1}'", oInfoService.StoredReturn, xml.InnerXml));
                        oInfoService.InfoResponse = new InfoServiceResponse(ds.Tables.Count > 0 ? ds.Tables[0] : null);
                    }
                }
                else
                {
                    sError = "Errore nella chiamata al servizio";
                    throw new Exception(sError);
                }
            }
            catch (Exception ex)
            {
                sError = ex.Message.ToString();
                throw new Exception(sError);
            }
            finally
            {
                if (ds != null)
                {
                    ds.Dispose();
                }
            }
        }

        public static HttpResponseMessage RunExecutable(string executablePathParameter)
        {
            HttpResponseMessage r = new HttpResponseMessage();

            try
            {
                Process process = new Process();
                process.StartInfo.FileName = executablePathParameter;
                process.StartInfo.UseShellExecute = false;
                process.StartInfo.RedirectStandardOutput = true;
                process.StartInfo.CreateNoWindow = true;
                process.Start();
                string output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();

                r.StatusCode = HttpStatusCode.OK;
                r.Content = new StringContent(output);

            }
            catch (Exception ex)
            {
                r.StatusCode = HttpStatusCode.InternalServerError;
                r.Content = new StringContent(ex.Message);
            }

            return r;

        }

    }

    [ExceptionFilter]
    public class RefTreeServicesController : ApiController
    {        
        private string sStoreProcedureName = "config.SRV_SP_GET_REFTREE_SERVICE";
        private const string zipcomment = "Zipped by Reftree";
        public string modelexportdir { get; set; } = MagicFramework.Helpers.Utils.retcompletepath(ApplicationSettingsManager.GetRootdirforupload());

        [HttpPost]
        public HttpResponseMessage FileManagement(dynamic data)
        {
            string sError = "";           
            HttpResponseMessage r = new HttpResponseMessage();
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            DataSet ds = new DataSet();

            try
            {
                ds = dbutils.GetDataSetFromStoredProcedure(sStoreProcedureName, data);
                InfoFile oInfoFile = new InfoFile(ds);
                if (string.IsNullOrEmpty(oInfoFile.FileName) || string.IsNullOrEmpty(oInfoFile.PathFile) || oInfoFile.Dati.Count == 0)
                {
                    throw new Exception("Non sono presenti alcuni dati del file.");
                }

                if (oInfoFile.ToWrite)
                {
                    oInfoFile.FileWriteLine();
                    r.StatusCode = HttpStatusCode.OK;
                    r.Content = new StringContent(oInfoFile.FileName);
                }

                if (!string.IsNullOrEmpty(oInfoFile.StoredReturn))
                {
                    ds = dbutils.GetDataSetFromStoredProcedure(oInfoFile.StoredReturn, data);
                }
            }
            catch (Exception ex)
            {
                sError = ex.Message.ToString();
                throw new Exception(ex.Message.ToString());
            }
            finally
            {
                ds.Dispose();
            }

            //r = Utils.retOkJSONMessage("OK");

            return r;
        }

        [HttpPost]
        public HttpResponseMessage FileManagementJson(JObject data)
        {
            HttpResponseMessage r = new HttpResponseMessage();
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            DataSet ds = new DataSet();
            JArray storedsToReturn = new JArray();
            JsonResponse jr = new JsonResponse();
             

            try
            {
                ds = dbutils.GetDataSetFromStoredProcedure(sStoreProcedureName, data);
                InfoFiles oInfoFiles = new InfoFiles(ds);
                jr.Status = "OK";

                foreach (InfoFile oInfoFile in oInfoFiles.Files)
                {
                    if (string.IsNullOrEmpty(oInfoFile.FileName) || (oInfoFile.Dati.Count == 0 && oInfoFile.ToWrite))
                    {
                        if (!string.IsNullOrEmpty(oInfoFile.ErrorRequest)) {
                            throw new Exception(oInfoFile.ErrorRequest);
                        }

                        throw new Exception("Non sono presenti alcuni dati del file.");
                    }

                    if (oInfoFile.ToWrite)
                    {
                        oInfoFile.FileWriteLine();

                        if (oInfoFile.ToDownload)
                        {
                            oInfoFiles.FilesToDownload.Add(oInfoFile);
                        }
                    }

                    if (oInfoFile.ToRead)
                    {
                        oInfoFile.FileReadLine();                        
                    }

                    if (!string.IsNullOrEmpty(oInfoFile.StoredReturn))
                    {
                        var obj = storedsToReturn.Children<JObject>().Select(jo => (JObject)jo).Where(s => s["StoredName"].ToString() == oInfoFile.StoredReturn).FirstOrDefault();
                        if (obj != null)
                        {
                            ((JArray)((JObject)obj)["FileToElab"]).Add(new JObject(
                                new JProperty("TableCreated", oInfoFile.TableCreated),
                                new JProperty("SessionGuidId", oInfoFile.SessionGuidId),
                                new JProperty("FileName", oInfoFile.FileName)
                                ));
                        }
                        else
                        {
                            JObject sp = new JObject();
                            JArray ja = new JArray();

                            ja.Add(new JObject(
                                new JProperty("TableCreated", oInfoFile.TableCreated),
                                new JProperty("SessionGuidId", oInfoFile.SessionGuidId),
                                new JProperty("FileName", oInfoFile.FileName)
                                ));

                            sp["StoredName"] = oInfoFile.StoredReturn;
                            sp["FileToElab"] = ja;

                            storedsToReturn.Add(sp);
                        }
                    }
                }

                foreach (JObject sp in storedsToReturn) {
                    data.Add("FileToElab", sp["FileToElab"]);
                    ds = dbutils.GetDataSetFromStoredProcedure(sp["StoredName"].ToString(), data);
                    
                    if (ds.Tables.Count > 0)
                    {
                        jr = new JsonResponse(ds.Tables[0].Rows[0]);

                        if (jr.Status == "OK") {

                            //implementare spostamento file 

                            foreach (JObject file in sp["FileToElab"]) {
                                InfoFile o = oInfoFiles.GetInfoFile(file["FileName"].ToString());

                                if (!string.IsNullOrEmpty(o.FileNameDestination)) {
                                    File.Copy(o.PathFileName,Path.Combine(o.PathFileDestination,o.FileNameDestination), true);
                                }
                            }
                        }
                    }
                }


                if (oInfoFiles.FilesToDownload.Count == 1)
                {
                    jr.FileName = Path.Combine(oInfoFiles.FilesToDownload[0].PathFile , oInfoFiles.FilesToDownload[0].FileName);
                    jr.Download = true;
                }
                else {
                    jr.FileName = FileZip(oInfoFiles);
                    jr.Download = true;
                }

                jr.ResponseMessage = string.IsNullOrEmpty(jr.ResponseMessage) ? "Operazione eseguita con successo." : jr.ResponseMessage;

            }
            catch (Exception ex)
            {                                               
                jr.Status = "KO";
                jr.ErrorMessage = ex.Message.ToString();
                //throw new Exception(ex.Message.ToString());
            }
            finally
            {
                ds.Dispose();
            }

            return ResponseService(jr);
        }

        [HttpPost]
        public HttpResponseMessage StartServiceFromModel(dynamic data)
        {
            string sError = "";
            Boolean bResponce = false;
            HttpResponseMessage r = new HttpResponseMessage();
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            /*dataset che recupera il servizio da lanciare, eseguendo la stored procedure impostata*/
            DataSet dsService = new DataSet();
            /*dataset che recupera il ritorno della stored procedure di ritorno impostata*/
            DataSet dsResponce = new DataSet();

            try
            {
                dsService = dbutils.GetDataSetFromStoredProcedure(sStoreProcedureName, data);                

                if (dsService.Tables.Count != 0)
                {
                    if (dsService.Tables[0].Rows.Count > 0)
                    {
                        foreach (DataRow rw in dsService.Tables[0].Rows)
                        {
                            r3Service oService = new r3Service(rw);

                            if (oService.errorId == "0")
                            {
                                if (oService.applicationConsole)
                                {
                                    r = RunExecutable(oService.endPoint);
                                }
                                else
                                {
                                    using (HttpClient client = new HttpClient())
                                    {
                                        r = client.GetAsync(oService.endPoint).Result;
                                    }
                                }

                                if (r.StatusCode == HttpStatusCode.OK)
                                {
                                    if (!string.IsNullOrEmpty(oService.spReturn))
                                    {
                                        dsResponce = dbutils.GetDataSetFromStoredProcedure(oService.spReturn, data, null, $"SRV_CFGREF_GUIDID='{oService.guidid}'");

                                        if (dsResponce.Tables.Count >= 0)
                                        {
                                            r3ReturnService oReturn = new r3ReturnService(dsResponce.Tables[0].Rows[0]);

                                            if (oReturn.response != "" && oReturn.status == "OK")
                                            {
                                                string strJson = Newtonsoft.Json.JsonConvert.SerializeObject(oReturn);
                                                r = new HttpResponseMessage();
                                                r.StatusCode = HttpStatusCode.OK;
                                                r.Content = new StringContent(strJson);
                                                bResponce = true;
                                            }
                                            else
                                            {
                                                sError = oReturn.errorMessage.ToString();
                                            }
                                        }
                                        else
                                        {
                                            sError = "Procedura di ritorno non corretta: " + oService.spReturn;

                                        }
                                    }
                                }
                                else
                                {
                                    sError = "Chiamata al servizio non corretta: " + r.Content;
                                }
                            }
                            else
                            {
                                sError = oService.errorMessage;
                            }
                        }
                    }
                    else {

                        sError = "Nessun servizio trovato.";
                    }
                }
                else
                {
                    sError = "Errore nel recupero del servizio.";
                }
            }
            catch (Exception ex)
            {
                r.StatusCode = HttpStatusCode.InternalServerError;
                r.Content = new StringContent(ex.Message);
                sError = ex.Message.ToString();
            }

            if (dsService != null) {
                dsService.Dispose();
            }

            if (dsResponce != null) {
                dsResponce.Dispose();
            }
            
            if (!string.IsNullOrEmpty(sError)) {            
                return Utils.retInternalServerError("SRV_ERR", sError);                
            }

            if (!bResponce)
                r = Utils.retOkJSONMessage("OK");

            return r;
        }

        [HttpPost]
        public HttpResponseMessage StartServiceFromModelNew(dynamic data)
        {
            string sError = "";            
            HttpResponseMessage r = new HttpResponseMessage();
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            DataSet ds = new DataSet();

            try
            {
                ds = dbutils.GetDataSetFromStoredProcedure(sStoreProcedureName, data);
                InfoService oInfoService = new InfoService(ds.Tables.Count > 0 ? ds.Tables[0] : null);

                if (string.IsNullOrEmpty(oInfoService.Guidid) || (!string.IsNullOrEmpty(oInfoService.ErrorId) && oInfoService.ErrorId != "0"))
                {
                    if (!string.IsNullOrEmpty(oInfoService.ErrorMessage) && oInfoService.Status == "KO")
                    {
                        sError = oInfoService.ErrorMessage;

                        throw new Exception(sError);
                    }
                    else {

                        if (ds != null)
                        {
                            ds.Dispose();
                        }

                        r = new HttpResponseMessage();
                        r.StatusCode = HttpStatusCode.OK;
                        r.Content = new StringContent(oInfoService.ErrorMessage);

                        return r;
                    }

                    throw new Exception("Errore nel recupero del servizio");
                }

                if (oInfoService.IsApplicationConsole)
                {
                    r = RunExecutable(oInfoService.EndPoint);
                }

                if (!oInfoService.IsApplicationConsole)
                {
                    using (HttpClient client = new HttpClient())
                    {
                        r = client.GetAsync(oInfoService.EndPoint).Result;
                    }
                }

                if (r.StatusCode == HttpStatusCode.OK)
                {
                    if (!string.IsNullOrEmpty(oInfoService.StoredReturn))
                    {
                        ds = dbutils.GetDataSetFromStoredProcedure(oInfoService.StoredReturn, data, null, $"SRV_CFGREF_GUIDID='{oInfoService.Guidid}'");
                        oInfoService.InfoResponse = new InfoServiceResponse(ds.Tables.Count > 0 ? ds.Tables[0] : null);

                        if (oInfoService.InfoResponse.Status == "OK")
                        {
                            if (string.IsNullOrEmpty(oInfoService.InfoResponse.Response))
                            {
                                r = Utils.retOkJSONMessage("OK");
                            }
                            else
                            {
                                string strJson = Newtonsoft.Json.JsonConvert.SerializeObject(oInfoService.InfoResponse);
                                r = new HttpResponseMessage();
                                r.StatusCode = HttpStatusCode.OK;
                                r.Content = new StringContent(strJson);
                            }
                        }
                        else
                        {
                            sError = oInfoService.InfoResponse.ErrorMessage.ToString();
                            throw new Exception(sError);
                        }
                    }
                    else {
                        oInfoService.InfoResponse = new InfoServiceResponse();
                        oInfoService.InfoResponse.Status = "OK";
                        oInfoService.InfoResponse.Response = "Elaborazione effettuata con successo";
                        oInfoService.InfoResponse.message = "Elaborazione effettuata con successo";

                        string strJson = Newtonsoft.Json.JsonConvert.SerializeObject(oInfoService.InfoResponse);
                        r = new HttpResponseMessage();
                        r.StatusCode = HttpStatusCode.OK;
                        r.Content = new StringContent(strJson);
                    }
                }
                else
                {
                    sError = "Errore nella chiamata al servizio";
                    throw new Exception(sError);
                }
            }
            catch (Exception ex)
            {
                sError = ex.Message.ToString();
                throw new Exception(sError);
            }
            finally {
                if (ds != null) {
                    ds.Dispose();
                }
            }

            return r;
        }
         
        public HttpResponseMessage RunExecutable(string executablePathParameter) {
            HttpResponseMessage r = new HttpResponseMessage();

            try { 
                Process process = new Process(); 
                process.StartInfo.FileName = executablePathParameter;                     
                process.StartInfo.UseShellExecute = false; 
                process.StartInfo.RedirectStandardOutput = true; 
                process.StartInfo.CreateNoWindow = true; 
                process.Start(); 
                string output = process.StandardOutput.ReadToEnd();
                process.WaitForExit();

                r.StatusCode = HttpStatusCode.OK;
                r.Content = new StringContent(output);

                } 
                catch (Exception ex) {
                r.StatusCode = HttpStatusCode.InternalServerError;
                r.Content = new StringContent(ex.Message);
            }

            return r;

         }

        public string FileZip(InfoFiles oInfoFiles) {
            JObject fileInfo = new JObject();
            JArray outfiles = new JArray();

            bool trackOperation = ApplicationSettingsManager.trackFiles();
            HttpResponseMessage result = new HttpResponseMessage(HttpStatusCode.OK);

            ZipFile zip = new ZipFile();                        
            string filename = GetFileNameForZip(true);
            string fname = GetFileNameForZip(false);
            Dictionary<int, List<string>> documentFiles = new Dictionary<int, List<string>>();

            foreach (InfoFile oInfoFile in oInfoFiles.FilesToDownload)
            {
                List<string> outFilesOfThisDoc = new List<string>();
                 
                bool check = AddDocumentToZip(oInfoFile, ref zip, ref outfiles, outFilesOfThisDoc);
                if (!check)
                {
                    if (trackOperation)
                    {
                        fileInfo["files"] = new JArray { outfiles.Last() };
                        MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("downloadError", fileInfo);
                    }                    
                }
            }
            zip = CloseAndReleaseZip(zip, filename);

            // scarica lo zip

            //fg.AddDownloadToResponse(ref result, filename, fname, false, documentFiles);
            //if (trackOperation)
            //{
            //    fileInfo["files"] = outfiles;
            //    MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("download", fileInfo);
            //}

            return filename;
        }

        public bool AddDocumentToZip(InfoFile oInfoFile, ref ZipFile zipfile, ref JArray outfiles, List<string> outFilesOfThisDoc)
        {
            if (!zipfile.Any(x => x.FileName.EndsWith(oInfoFile.FileName)))   //DB non aggiunto due volte lo stesso file anche se c'è nel result
            {
                string filetoadd = oInfoFile.PathFileName;
               
                  
                outfiles.Add(filetoadd);
                //of the input doc only
                outFilesOfThisDoc.Add(filetoadd);

                if (File.Exists(filetoadd))
                {
                    ZipEntry e = zipfile.AddFile(filetoadd, oInfoFile.PathFile);
                    e.Comment = zipcomment;
                }
                else
                {
                    return false;
                }
            }

            return true;
        }

        public ZipFile CloseAndReleaseZip(ZipFile zip, string filename)
        {
            zip.Comment = zipcomment;
            zip.Save(filename);
            zip.Dispose();
            return zip;
        }
        
        public string GetFileNameForZip(bool complete)
        {
            string fname = "Export_" + Utils.DateimeForFileName() + FileExtensions.zip;                       
            return complete ? Path.Combine(modelexportdir, fname) : fname;
        }
 
        private string GetSafePath(string path)
        {
            return path.Replace('\\', '_');
        }
        
        public class r3ReturnService
        {
            public string status { get; set; }
            public string response { get; set; }
            public string errorMessage { get; set; }
            public string errorId { get; set; }
            public string message { get; set; }


            public r3ReturnService(DataRow row) {
                DataColumnCollection coll = row.Table.Columns;
                status = coll.Contains("status") ? row["status"].ToString() : "";
                response = coll.Contains("response") ? row["response"].ToString() : "";
                errorMessage = coll.Contains("errorMessage") ? row["errorMessage"].ToString() : "";
                errorId = coll.Contains("errorId") ? row["errorId"].ToString() : "";
                message = coll.Contains("message") ? row["message"].ToString() : "";
            }
        }
        
        public class r3Service {

            public string guidid { get; set; }
            public string connessione { get; set; }
            public string endPoint { get; set; }
            public string spReturn { get; set; }
            public string status { get; set; }
            public string errorMessage { get; set; }
            public string errorId { get; set; }
            public string pathService { get; set; }
            public Boolean downloadable { get; set; }
            public Boolean applicationConsole { get; set; }

            public r3Service(DataRow row) {
                DataColumnCollection coll = row.Table.Columns;
                guidid = coll.Contains("guidid") ?  row["guidid"].ToString() : "";
                connessione = coll.Contains("connessione") ? row["connessione"].ToString() : "";
                endPoint = coll.Contains("endPoint") ? row["endPoint"].ToString() : "";
                spReturn = coll.Contains("spReturn") ? row["spReturn"].ToString() : "";
                status = coll.Contains("status") ? row["status"].ToString() : "";
                errorMessage = coll.Contains("errorMessage") ? row["errorMessage"].ToString() : "";
                errorId = coll.Contains("errorId") ? row["errorId"].ToString() : "";
               //pathService = $"{endPoint}ID={guidid}&{connessione}";
                downloadable = coll.Contains("downloadable") ? (Boolean)row["downloadable"] : false ;
                applicationConsole = coll.Contains("applicationConsole") ? (Boolean)row["applicationConsole"] : false;
            }

        }

        public HttpResponseMessage ResponseService(JsonResponse jr)
        {
            HttpResponseMessage r = new HttpResponseMessage();
            r.StatusCode = HttpStatusCode.OK;

            if (jr.Status == "KO") {
                r.StatusCode = HttpStatusCode.BadRequest;
                r.Content = new StringContent(jr.ErrorMessage);
                return r;
            }

            jr.message = jr.ResponseMessage;
            r.Content = new StringContent(JsonConvert.SerializeObject(jr));
            return r;

        }
    }

    public static class FileExtensions
    {
        public static string xlsx { get { return ".xlsx"; } }
        public static string zip { get { return ".zip"; } }
        public static string docx { get { return ".docx"; } }
        public static string txt { get { return ".txt"; } }
        public static string xml { get { return ".xml"; } }
    }

    public class JsonResponse {
        public string FileName { get; set; }
        public string Status { get; set; }
        public string ErrorMessage { get; set; }
        public string ResponseMessage { get; set; }
        public Boolean Download { get; set; }
        public string message { get; set; }
        public string msgtype { get; set; }


        public JsonResponse() { 
        
        }

        public JsonResponse(DataRow dr)
        {
            DataColumnCollection coll;
            coll = dr.Table.Columns;

            FileName = coll.Contains("FileName") ? dr["FileName"].ToString() : "";
            Status = coll.Contains("Status") ? dr["Status"].ToString() : "OK";
            ErrorMessage = coll.Contains("ErrorMessage") ? dr["ErrorMessage"].ToString() : "";
            ResponseMessage = coll.Contains("ResponseMessage") ? dr["ResponseMessage"].ToString() : "";
            Download = coll.Contains("Download") ? (Boolean)dr["Download"] : false;
            message = coll.Contains("message") ? dr["message"].ToString() : "";
            msgtype = coll.Contains("msgtype") ? dr["msgtype"].ToString() : "";
            
    }
    }

    public class InfoFiles {

        public List<InfoFile> Files { get; set; } = new List<InfoFile>();

        public List<InfoFile> FilesToDownload { get; set; } = new List<InfoFile>();

        public List<JObject> FilesToUpdate { get; set; } = new List<JObject>();

        public InfoFiles(DataSet ds)
        {
            foreach (DataTable dt in ds.Tables)
            {
                if (ds.Tables.IndexOf(dt) == 0) {
                    DataColumnCollection coll;
                    coll = dt.Columns;

                    foreach (DataRow Row in dt.Rows)
                    {
                        InfoFile oInfoFile = new InfoFile(Row);
                        Files.Add(oInfoFile);
                    }
                };

                if (ds.Tables.IndexOf(dt) == 1)
                {
                    DataColumnCollection coll;
                    coll = dt.Columns;

                    if (coll.Contains("Dati") && coll.Contains("FileName")) {
                        foreach (DataRow Row in dt.Rows)
                        {
                            InfoFile oInfoFile = Files.AsEnumerable().FirstOrDefault(tt => tt.FileName == Row["FileName"].ToString());
                            oInfoFile.Dati.Add(Row["Dati"].ToString());
                        }
                    }
                };
            }
        }

        public InfoFile GetInfoFile(string fileName)
        {
            InfoFile oInfoFile = new InfoFile();

            foreach (InfoFile o in Files) {
                if (o.FileName == fileName) {
                    oInfoFile = o;
                    break;
                }
            }

            return oInfoFile;
        }
    }

    public class InfoFile
    {

        private string exportdir = Utils.retcompletepath(ApplicationSettingsManager.GetRootdirforupload() ?? HttpContext.Current.Server.MapPath("~"));
        public string PathFile { get; set; }
        public string FileName { get; set; }
        public Boolean ToReplace { get; set; }
        public Boolean ToWrite { get; set; }
        public Boolean ToRead { get; set; }
        public string StoredReturn { get; set; }
        public string PathFileDestination { get; set; }
        public string FileNameDestination { get; set; }
        public Boolean ToDownload { get; set; }
        public Boolean ToZip { get; set; }
        public List<string> Dati { get; set; } = new List<string>();
        public string PathFileName { get; set; }
        public string SessionGuidId { get; set; }
        public string TableCreated { get; set; }
        public Boolean IsTemponary { get; set; }
        public string ErrorRequest { get; set; }

        public InfoFile()
        { 
        
        }

            public InfoFile(DataRow dr)
        {
            DataColumnCollection coll;
            coll = dr.Table.Columns;

            PathFile = coll.Contains("PathFile") ? dr["PathFile"].ToString() : "";
            FileName = coll.Contains("FileName") ? dr["FileName"].ToString() : "";
            ToReplace = coll.Contains("ToReplace") ? (Boolean)dr["ToReplace"] : false;
            ToWrite = coll.Contains("ToWrite") ? (Boolean)dr["ToWrite"] : false;
            ToRead = coll.Contains("ToRead") ? (Boolean)dr["ToRead"] : false;
            IsTemponary = coll.Contains("IsTemponary") ? (Boolean)dr["IsTemponary"] : false;
            StoredReturn = coll.Contains("StoredReturn") ? dr["StoredReturn"].ToString() : "";
            PathFileDestination = coll.Contains("PathFileDestination") ? dr["PathFileDestination"].ToString() : "";
            FileNameDestination = coll.Contains("FileNameDestination") ? dr["FileNameDestination"].ToString() : "";
            ToDownload = coll.Contains("ToDownload") ? (Boolean)dr["ToDownload"] : false;
            ToZip = coll.Contains("ToZip") ? (Boolean)dr["ToZip"] : false;
            ErrorRequest = coll.Contains("ErrorRequest") ? dr["ErrorRequest"].ToString() : "";

            //PathFile = JoinUriSegments(exportdir, PathFile);
            PathFileName = JoinUriSegments(IsTemponary ? HttpContext.Current.Server.MapPath("~") : exportdir, PathFile, FileName);
            SessionGuidId = coll.Contains("SessionGuidId") ? dr["SessionGuidId"].ToString() : Guid.NewGuid().ToString();

        }
         
        public InfoFile(DataSet ds) {
            
            DataColumnCollection coll;

            //if (ds.Tables.Count == 2) {
            using (DataTable tb = ds.Tables[0])
            {
                coll = tb.Columns;

                foreach (DataRow Row in tb.Rows)
                {
                    PathFile = coll.Contains("PathFile") ? Row["PathFile"].ToString() : "";
                    FileName = coll.Contains("FileName") ? Row["FileName"].ToString() : "";
                    ToReplace = coll.Contains("ToReplace") ? (Boolean)Row["ToReplace"] : false;
                    ToWrite = coll.Contains("ToWrite") ? (Boolean)Row["ToWrite"] : false;
                    ToRead = coll.Contains("ToRead") ? (Boolean)Row["ToRead"] : false;
                    StoredReturn = coll.Contains("StoredReturn") ? Row["StoredReturn"].ToString() : "";
                    PathFileDestination = coll.Contains("PathFileToDestination") ? Row["PathFileDestination"].ToString() : "";
                    FileNameDestination = coll.Contains("FileNameDestination") ? Row["FileNameDestination"].ToString() : "";
                    ToDownload = coll.Contains("ToDownload") ? (Boolean)Row["ToDownload"] : false;
                    ToZip = coll.Contains("ToZip") ? (Boolean)Row["ToZip"] : false;

                    //PathFile = JoinUriSegments(exportdir, PathFile);
                    PathFileName = JoinUriSegments(exportdir,PathFile, FileName);

                    if (ToWrite)
                    {
                        using (DataTable tbr = ds.Tables[1])
                        {
                            coll = tbr.Columns;

                            if (coll.Contains("Dati"))
                            {
                                foreach (DataRow RowData in tbr.Rows)
                                {
                                    string Data = RowData["Dati"].ToString();

                                    if (!string.IsNullOrEmpty(Data))
                                    {
                                        Dati.Add(Data);
                                    }
                                }
                            }
                        }
                    }
                }
                //}
            }
        }

        public HttpResponseMessage FileDownload()
        {
            MAGIC_SAVEFILEController MsFile = new MAGIC_SAVEFILEController();

            return MsFile.GetFile(PathFileName, false);
        }

        public void FileWriteLine()
        {
           
            if (!Directory.Exists(Path.Combine(exportdir, PathFile)))
            {
                Directory.CreateDirectory(Path.Combine(exportdir, PathFile));
            }

            //se impostata la replace elimino il file esistente
            if (File.Exists(PathFileName) && ToReplace)
            {
                File.Delete(PathFileName);
            }

            //Utilizziamo lo StreamWriter perchè è molto più performante rispetto alla scrittura riga per riga
            using (StreamWriter sw = new StreamWriter(File.OpenWrite(PathFileName), Encoding.ASCII))
            {

                // LS 05/05/2025 Eliminata la WriteLine per evitare l'ultimo ritorno a capo all fine del file

                //foreach (string riga in Dati)
                //{
                //    sw.WriteLine(riga);
                //}

                sw.Write(string.Join(Environment.NewLine, Dati));

            }

            //string sToWrite = "";

            //foreach (string riga in Dati)
            //{
            //    sToWrite += riga;

            //}


            //File.AppendAllText(PathFileName, sToWrite, System.Text.Encoding.ASCII);


        }

        public void FileReadLine() {
            if (File.Exists(PathFileName))
            {
                using (StreamReader file = new StreamReader(PathFileName))
                {
                    
                    //if (file.ReadLine().Length == 0)
                    //{
                    //    file.Close();
                    //    file.Dispose();
                    //    System.GC.Collect();
                    //    GC.WaitForPendingFinalizers();
                    //    throw new Exception("Nessuna riga presente nel file.");
                    //}
                    
                    var dataTableCustom = new DataTable();


                    DataColumn idColumn = dataTableCustom.Columns.Add("ID", typeof(Int32));
                    idColumn.AutoIncrement = true;
                    idColumn.AutoIncrementSeed = 1;
                    idColumn.AutoIncrementStep = 1;

                    dataTableCustom.Columns.Add("DESCRIPTION", typeof(String));
                    dataTableCustom.Columns.Add("SESSIONGUIDID", typeof(String));
                    dataTableCustom.Columns.Add("FILENAME", typeof(String));
                    int counter = 0;
                    string ln;

                    while ((ln = file.ReadLine()) != null)
                    {
                        DataRow r;
                        r = dataTableCustom.NewRow();
                        r["DESCRIPTION"] = ln.ToString();
                        r["SESSIONGUIDID"] = SessionGuidId;
                        r["FILENAME"] = FileName;
                        dataTableCustom.Rows.Add(r);
                        counter++;
                    }

                    file.Close();
                    file.Dispose();

                    System.GC.Collect();
                    GC.WaitForPendingFinalizers();

                    if (counter == 0) {
                        throw new Exception("Nessuna riga presente nel file.");
                    }


                    TableCreated = "CUSTOM.TB_" + DateTime.Now.Ticks.ToString();
                    string sql = CreateTABLE(TableCreated, dataTableCustom);
                    var dbutils = new DatabaseCommandUtils().buildAndExecDirectCommandNonQuery(sql, new Object[] { });

                    CreateTableFile(TableCreated, dataTableCustom);
                }
            }
            else
            {
                throw new Exception("Nessun file da leggere.");
            }
        }

        public void CreateTableFile(string customTable,DataTable dataCustomTable) {
            DataTable table = new DataTable();
            table.TableName = "TXT_FILIMP_read_file_import_tables";

            // Declare DataColumn and DataRow variables.
            DataColumn column;
            DataRow row;

            // Create new DataColumn, set DataType, ColumnName and add to DataTable.
            column = new DataColumn();
            column.DataType = System.Type.GetType("System.Int32");
            column.ColumnName = "TXT_FILIMP_ID";
            table.Columns.Add(column);

            column = new DataColumn();
            column.DataType = System.Type.GetType("System.String");
            column.ColumnName = "TXT_FILIMP_TABLE";
            table.Columns.Add(column);

            column = new DataColumn();
            column.DataType = System.Type.GetType("System.String");
            column.ColumnName = "guidIdentifier";
            table.Columns.Add(column);

            column = new DataColumn();
            column.DataType = System.Type.GetType("System.DateTime");
            column.ColumnName = "TXT_FILIMP_DATE_IMPORT";
            table.Columns.Add(column);

            column = new DataColumn();
            column.DataType = System.Type.GetType("System.String");
            column.ColumnName = "TXT_FILIMP_FILE_NAME";
            table.Columns.Add(column);


            column = new DataColumn();
            column.DataType = System.Type.GetType("System.Int32");
            column.ColumnName = "TXT_FILIMP_USER_ID";
            table.Columns.Add(column);


            row = table.NewRow();

            row["TXT_FILIMP_TABLE"] = customTable;
            row["guidIdentifier"] = SessionGuidId;
            row["TXT_FILIMP_DATE_IMPORT"] = DateTime.Now;
            row["TXT_FILIMP_FILE_NAME"] = FileName;
            row["TXT_FILIMP_USER_ID"] = 13;

            table.Rows.Add(row);

            SqlBulkCopy sbc = new SqlBulkCopy(DBConnectionManager.GetTargetConnection());
            sbc.DestinationTableName = "custom.TXT_FILIMP_read_file_import_tables";
            sbc.BulkCopyTimeout = 300;
            sbc.WriteToServer(table);
            sbc.Close();

            SqlBulkCopy sbc2 = new SqlBulkCopy(DBConnectionManager.GetTargetConnection());
            sbc2.DestinationTableName = customTable;
            sbc2.BulkCopyTimeout = 300;
            sbc2.WriteToServer(dataCustomTable);
            sbc2.Close();
        }

        private static string CreateTABLE(string tableName, DataTable table)
        {
            string sqlsc;
            sqlsc = "CREATE TABLE " + tableName + "(";
            for (int i = 0; i < table.Columns.Count; i++)
            {
                sqlsc += "\n [" + table.Columns[i].ColumnName + "] ";
                string columnType = table.Columns[i].DataType.ToString();
                switch (columnType)
                {
                    case "System.Int32":
                        sqlsc += " int ";
                        break;
                    case "System.Int64":
                        sqlsc += " bigint ";
                        break;
                    case "System.Int16":
                        sqlsc += " smallint";
                        break;
                    case "System.Byte":
                        sqlsc += " tinyint";
                        break;
                    case "System.Decimal":
                        sqlsc += " decimal ";
                        break;
                    case "System.DateTime":
                        sqlsc += " datetime ";
                        break;
                    case "System.String":
                    default:
                        sqlsc += string.Format(" nvarchar({0}) ", table.Columns[i].MaxLength == -1 ? "max" : table.Columns[i].MaxLength.ToString());
                        break;
                }
                if (table.Columns[i].AutoIncrement)
                    sqlsc += " IDENTITY(" + table.Columns[i].AutoIncrementSeed.ToString() + "," + table.Columns[i].AutoIncrementStep.ToString() + ") ";
                if (!table.Columns[i].AllowDBNull)
                    sqlsc += " NOT NULL ";
                sqlsc += ",";
            }
            return sqlsc.Substring(0, sqlsc.Length - 1) + "\n)";
        }
        
        public static bool IsAbsolutePath(string path)
        {
            // return new Regex(@"^[A-Za-z]{1}:").Match(path).Success;
            //D.t: modified regex in order to consider as absolute the network paths e.g \\mynetworkplace\folder\something... or \\192.168.2.100\mything
            return new Regex(@"^[A-Za-z]{1}:|^[\\]{2}(\w)").Match(path).Success;
        }

        public string JoinUriSegments(string uri, params string[] segments)
        {
            if (string.IsNullOrWhiteSpace(uri))
                return null;

            if (segments == null || segments.Length == 0)
                return uri;

            return segments.Aggregate(uri, (current, segment) => $"{current.TrimEnd('/')}/{segment.TrimStart('/')}");
        }
    }

    public class DataBaseUtils
    {
        public static int sqlCommandTimeout = ConfigurationManager.AppSettings["SqlCommandTimeout"] == null ? 30 : int.Parse(ConfigurationManager.AppSettings["SqlCommandTimeout"].ToString());

        public static DataSet FillDataSet(string DBConnectionString, string cmdToExecute)
        {
            DataSet ds = new DataSet();

            using (SqlConnection conn = new SqlConnection(DBConnectionString))
            {
                using (SqlCommand cmd = new SqlCommand(cmdToExecute, conn))
                {
                    cmd.Connection.Open();
                    cmd.CommandTimeout = sqlCommandTimeout;
                    SqlDataAdapter da = new SqlDataAdapter();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                    cmd.Connection.Close();
                }
            }

            return ds;
        }    
    }

    public class Event{

        public Int32 Event_id { get; set; }
        public string GuidId { get; set; }

        public Event(Int32 event_id ,string guidId)
        {
            Event_id = event_id;
            GuidId = guidId;
        }
    }

    public class InfoService {
        public string Guidid { get; set; }
        public string ConnectionDb { get; set; }
        public string EndPoint { get; set; }
        public string StoredReturn { get; set; }
        public string Status { get; set; }
        public string ErrorMessage { get; set; }
        public string ErrorId { get; set; }
        public Boolean IsDownloadable { get; set; }
        public Boolean IsApplicationConsole { get; set; }
        public InfoServiceResponse InfoResponse { get; set; }

        public InfoService(DataTable tb)
        {
            if (tb == null || tb.Rows.Count == 0)
            {
                return;
            }

            DataRow row = tb.Rows[0];
            DataColumnCollection coll = tb.Columns;
 
            Guidid = coll.Contains("Guidid") ? row["Guidid"].ToString() : "";
            ConnectionDb = coll.Contains("ConnectionDb") ? row["ConnectionDb"].ToString() : "";
            EndPoint = coll.Contains("EndPoint") ? row["EndPoint"].ToString() : "";
            StoredReturn = coll.Contains("StoredReturn") ? row["StoredReturn"].ToString() : "";
            Status = coll.Contains("Status") ? row["Status"].ToString() : "";
            ErrorMessage = coll.Contains("ErrorMessage") ? row["ErrorMessage"].ToString() : "";  
            ErrorId = coll.Contains("ErrorId") ? row["ErrorId"].ToString() : "";
            IsDownloadable = coll.Contains("IsDownloadable") ? (Boolean)row["IsDownloadable"] : false;
            IsApplicationConsole = coll.Contains("IsApplicationConsole") ? (Boolean)row["IsApplicationConsole"] : false;
            InfoResponse = new InfoServiceResponse(null);
        }

    }

    public class InfoServiceResponse
    {
        public string Status { get; set; } 
        public string Response { get; set; } 
        public string ErrorMessage { get; set; } 
        public string ErrorId { get; set; }
        public string message { get; set; }

        public InfoServiceResponse() { 
        
        }

        public InfoServiceResponse(DataTable tb)
        {
            if (tb == null || tb.Rows.Count == 0) {
                return;
            }

            DataRow row = tb.Rows[0];
            DataColumnCollection coll = tb.Columns;

            Status = coll.Contains("Status") ? row["Status"].ToString() : "";
            Response = coll.Contains("Response") ? row["Response"].ToString() : "";
            ErrorMessage = coll.Contains("ErrorMessage") ? row["ErrorMessage"].ToString() : "";
            ErrorId = coll.Contains("ErrorId") ? row["ErrorId"].ToString() : "";
            message = coll.Contains("message") ? row["message"].ToString() : "";
        }


    }

}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Dynamic;
using System.Linq.Dynamic;
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
using Ref3.BL;
using static Ref3.BL.FileGenerator;
using System.Threading;

namespace Ref3.Controllers
{
    [ExceptionFilter]
    public class DocumentaleController : ApiController
    {

        private const string documentFillFolder = "DocumentFill";
        private const string genericError = "Errore durante l' operazione";
        private static readonly Dictionary<int, BuildTask> buildTasks = new Dictionary<int, BuildTask>();

        public static class functioncaller
        {
            public static string DO_V_DOCUME { get { return "DO_V_DOCUME"; } }
            public static string DO_V_DOCUME_ENTITY { get { return "DO_V_DOCUME_ENTITY"; } }
        }

        // the linq to sql context that provides the data access layer	  
        //private Data.RefTreeEntities _context = DBConnectionManager.GetEFManagerConnection() != null ? new Data.RefTreeEntities(DBConnectionManager.GetEFManagerConnection()) : new Data.RefTreeEntities();
        //static string groupVisibilityField = ApplicationSettingsManager.GetVisibilityField().ToUpper();
        //PropertyInfo propertyInfo = typeof(Data.DO_V_DOCUME).GetProperty(groupVisibilityField);

        #region Images
        private string MakeThumbnail(int documeID, string path, MagicFramework.Models.FileUploaded file)
        {
            string linkedthumbnail = String.Empty;
            BL.FileGenerator fg = new BL.FileGenerator();
            linkedthumbnail = fg.CreateThumbnail(documeID, path, file);
            return linkedthumbnail;
        }
        private string MakeThumbnail(int documeID, MagicFramework.Models.FileUploaded file)
        {
            string linkedthumbnail = String.Empty;
            BL.FileGenerator fg = new BL.FileGenerator();
            linkedthumbnail = fg.CreateThumbnail(documeID, file);
            return linkedthumbnail;
        }
        private void CreateDocumeThumbs(int id)
        {
            var dbutils = new DatabaseCommandUtils();
            var ds = dbutils.GetDataSet("SELECT DO_DOCVER_ID,DO_DOCVER_LINK_FILE FROM core.DO_V_DOCFIL where DO_CLADOC_FLAG_PHOTO = 1 AND DO_DOCFIL_DO_DOCUME_ID=" + id.ToString() + " AND DO_DOCVER_THUMBNAIL is null", DBConnectionManager.GetTargetConnection());
            var drows = ds.Tables[0].Rows;
            foreach (DataRow m in drows)
            {
                MagicFramework.Models.FileUploaded f = Newtonsoft.Json.JsonConvert.DeserializeObject<List<MagicFramework.Models.FileUploaded>>(m["DO_DOCVER_LINK_FILE"].ToString()).First();
                string tl = this.MakeThumbnail(id, f);
                MFLog.LogInFile("Thumb created", MFLog.logtypes.INFO, "ThumbnailCreation.txt");
                dbutils.buildAndExecDirectCommandNonQuery("UPDATE core.DO_DOCVER_versions set DO_DOCVER_THUMBNAIL_LINK='" + tl.Replace("'", "''") + "' where DO_DOCVER_ID=" + m["DO_DOCVER_ID"].ToString());
            }
        }
        [HttpGet]
        public HttpResponseMessage CreateThumbs(int id)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                this.CreateDocumeThumbs(id);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile(ex.Message, MFLog.logtypes.ERROR, "ThumbnailCreation.txt");
                response = MagicFramework.Helpers.Utils.retInternalServerError("Error on creating thumbnail for document");
                return response;
            }
            response = MagicFramework.Helpers.Utils.retOkMessage();
            return response;
        }
        [HttpGet]
        public HttpResponseMessage CreateAssetThumbs(int id)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                //List<int> docIds = (from e in _context.DO_DOCREL_document_relation where e.DO_DOCREL_TABLE_NAME == "AS_ASSET_asset" && e.DO_DOCREL_ID_RECORD == id select e.DO_DOCREL_DO_DOCUME_ID ?? 0).ToList();

                var dbutils = new DatabaseCommandUtils();
                string connString = DBConnectionManager.GetTargetConnection();
                var ds = dbutils.GetDataSet(String.Format("SELECT isnull(DO_DOCREL_DO_DOCUME_ID,0) as Id from core.DO_DOCREL_document_relation where DO_DOCREL_TABLE_NAME='AS_ASSET_asset' and DO_DOCREL_ID_RECORD = {0}", id.ToString()), connString);
                foreach (DataRow dId in ds.Tables[0].Rows)
                    this.CreateDocumeThumbs(int.Parse(dId["Id"].ToString()));
            }
            catch (Exception ex)
            {
                MFLog.LogInFile(ex.Message, MFLog.logtypes.ERROR, "ThumbnailCreation.txt");
                response = MagicFramework.Helpers.Utils.retInternalServerError("Error on creating thumbnails for asset");
                return response;
            }
            response = MagicFramework.Helpers.Utils.retOkMessage();
            return response;
        }
        #endregion
        [HttpPost]
        public HttpResponseMessage MoveFilesToPath(dynamic data)
        {
            string extension = data.extension;
            string filename = "";
            string destpath = "";
            string startpath = MagicFramework.Helpers.ApplicationSettingsManager.GetRootdirforupload();
            string connectionString = null;
            try
            {
                connectionString = MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
            }
            catch (System.Exception e)
            {
                MFLog.LogInFile("Error retreiving connection string in MoveFilesToPath to save the delete file log inn db: " + e.Message, MFLog.logtypes.ERROR);
            }

            string applicationName = null;

            try
            {
                applicationName = ApplicationSettingsManager.GetAppInstanceName();
            }
            catch (System.Exception e)
            {
                MFLog.LogInFile("Error retreiving applicationName in MoveFilesToPath to save the delete file log inn db: " + e.Message, MFLog.logtypes.ERROR);
            }
            HttpResponseMessage response = Utils.retOkJSONMessage("Files have been moved!");
            try
            {
                foreach (var file in data.files)
                {
                    filename = file.filename;
                    if (Path.GetExtension(filename) != extension)
                        filename = Path.GetFileNameWithoutExtension(filename) + extension;
                    destpath = file.path;
                    Directory.CreateDirectory(destpath);
                    
                    Files.CopyInTrash(Path.Combine(startpath, filename), connectionString, applicationName, Path.Combine(destpath, filename));
                    File.Move(Path.Combine(startpath, filename), Path.Combine(destpath, filename));
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response = Utils.retInternalServerError(genericError);
            }
            return response;
        }

        private void defaultDynamicDocumentIDs(dynamic data)
        {
            if (data.OBJECT_ID == null)
                data.OBJECT_ID = 0;
            if (data.OBJECT_TYPE_ID == null)
                data.OBJECT_TYPE_ID = 0;
        }
        /// <summary>
        /// removes timestamp form filenames
        /// </summary>
        /// <param name="note"></param>
        /// <returns>the note without timestamp</returns>
        private string cleanFileNote(string note)
        {
            if (String.IsNullOrEmpty(note) || String.IsNullOrWhiteSpace(note))
                return "";
            string res = note;
            int index = note.IndexOf('-');
            if (index >= 0)
            {
                res = note.Substring(index + 1);
            }
            return Utils.SurroundWith(res, " (", ")");
        }
        private DatabaseCommandUtils.updateresult updateDocumeDataBase(dynamic data, string operation, ref List<MagicFramework.Models.FileUploaded> files, out string dirdest)
        {
            var dbutils = new DatabaseCommandUtils();
            //Get path for the given input
            dirdest = new BL.FileGenerator().getCompletePath(data, dbutils);

            if (!String.IsNullOrEmpty(data.fakeforlink.ToString()))
            {
                files = Newtonsoft.Json.JsonConvert.DeserializeObject<List<MagicFramework.Models.FileUploaded>>(data.fakeforlink.ToString());
                //moves files to destinations..
                movefiletopath(dirdest, files);
            }
            var xmlInput = JsonUtils.DynamicToXmlInput_ins_upd_del(data, operation, data.cfgEntityName.ToString());
            DatabaseCommandUtils.updateresult res = dbutils.callStoredProcedurewithXMLInputwithOutputPars(xmlInput, "core.usp_upd_ins_del_docume");
            return res;
        }

        private DatabaseCommandUtils.updateresult updateDocFileDataBase(dynamic data, string operation, ref List<MagicFramework.Models.FileUploaded> files, out string dirdest)
        {
            var dbutils = new DatabaseCommandUtils();
            //Get path for the given input
            dirdest = new BL.FileGenerator().getCompletePath(data, dbutils);
            if (!String.IsNullOrEmpty(data.DO_DOCVER_LINK_FILE.ToString()))
            {
                files = Newtonsoft.Json.JsonConvert.DeserializeObject<List<MagicFramework.Models.FileUploaded>>(data.DO_DOCVER_LINK_FILE.ToString());
              
                //moves files to destinations..
                movefiletopath(dirdest, files);
            }
            var xmlInput = JsonUtils.DynamicToXmlInput_ins_upd_del(data, operation, data.cfgEntityName.ToString());
            DatabaseCommandUtils.updateresult res = dbutils.callStoredProcedurewithXMLInputwithOutputPars(xmlInput, "core.usp_upd_ins_del_docfil");
            return res;
        }
        [GridObjectsFilter]
        [HttpPost]
        public HttpResponseMessage PostU(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();
            if (data.cfgGridName != null)
                Magic_Grids.addGridPropertiesForCreateUpdatedDeleteOperations(data);
            List<MagicFramework.Models.FileUploaded> files = new List<MagicFramework.Models.FileUploaded>();
            //converto il modello in un oggetto dinamico in modo da poter accedere per nome colonna
            MagicFramework.Models.GridModelParser modelp = new MagicFramework.Models.GridModelParser(data);
            string dirdest = String.Empty;
            //Fills xml container fields with their xml data
            modelp.FillXMLValues();
            DatabaseCommandUtils.updateresult res = updateDocumeDataBase(data, "update", ref files, out dirdest);
            if (res.errorId != "0")
                throw new System.ArgumentException(res.message);
            //thumbnail for images
            foreach (MagicFramework.Models.FileUploaded file in files)
                MakeThumbnail(id, dirdest, file);
            response = Utils.retOkJSONMessage(res.message);
            // return the HTTP Response.
            return response;
        }
        //The grid will call this method in insert mode
        [GridObjectsFilter]
        [HttpPost]
        public MagicFramework.Models.Response PostI(dynamic data)
        {
            int id = 0;

            // create a response message to send back
            var response = new HttpResponseMessage();
            if (data.cfgGridName != null)
                Magic_Grids.addGridPropertiesForCreateUpdatedDeleteOperations(data);
            List<MagicFramework.Models.FileUploaded> files = new List<MagicFramework.Models.FileUploaded>();
            //converto il modello in un oggetto dinamico in modo da poter accedere per nome colonna
            MagicFramework.Models.GridModelParser modelp = new MagicFramework.Models.GridModelParser(data);
            //Fills xml container fields with their xml data
            modelp.FillXMLValues();
            string dirdest = String.Empty;
            //Get path for the given input
            var res = updateDocumeDataBase(data, "create", ref files, out dirdest);
            if (res.errorId != "0")
                throw new System.ArgumentException(res.message);
            id = int.Parse(res.pkValue);
            //thumbnail for images
            try
            {
                foreach (MagicFramework.Models.FileUploaded file in files)
                    MakeThumbnail(id, dirdest, file);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("MakeThumbnail: " + ex.Message, MFLog.logtypes.ERROR);
                throw new System.ArgumentException("Errore nella creazione dei thumbnail");
            }
            // return the HTTP Response.
            var dbres = new DatabaseCommandUtils().GetDataSet("SELECT * FROM core.DO_V_DOCUME WHERE DO_DOCUME_ID=" + id.ToString(), DBConnectionManager.GetTargetConnection()).Tables[0].Rows[0];
            return new MagicFramework.Models.Response(dbres.ItemArray, 1);
        }

        [HttpPost]
        public List<BL.DossierItem> GetList(MagicFramework.Models.Request request)
        {
            // get inputs from client s
            var f = request.filter;
            string filter = f.filters[0].value;
            // create data for stored parameters
            dynamic inputdata = new ExpandoObject();
            inputdata.user = MagicFramework.Helpers.SessionHandler.IdUser;
            inputdata.usergroup = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
            inputdata.filter = filter;

            var dbutils = new DatabaseCommandUtils();
            DataSet dbresult = dbutils.GetDataSetFromStoredProcedure("core.usp_do_fascicolo_GetList", inputdata);

            List<BL.DossierItem> res = new List<BL.DossierItem>();
            foreach (DataRow dr in dbresult.Tables[0].Rows)
                res.Add(new BL.DossierItem(dr));

            return res;


        }

        [HttpPost]
        public List<BL.BoType> GetObjList(MagicFramework.Models.Request request)
        {
            // get inputs from client ss
            var f = request.filter;
            string filter = f.filters[0].value;
            // create data for stored parameters
            dynamic inputdata = new ExpandoObject();
            inputdata.user = MagicFramework.Helpers.SessionHandler.IdUser;
            inputdata.usergroup = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
            inputdata.filter = filter;

            var dbutils = new DatabaseCommandUtils();
            DataSet dbresult = dbutils.GetDataSetFromStoredProcedure("core.usp_do_botypes_GetList", inputdata);

            List<BL.BoType> res = new List<BL.BoType>();
            foreach (DataRow dr in dbresult.Tables[0].Rows)
                res.Add(new BL.BoType(dr));

            return res;
        }



        private void movefiletopath(string dirdest, List<MagicFramework.Models.FileUploaded> files)
        {
            string diruploaded = ApplicationSettingsManager.GetRootdirforupload();
            if (String.IsNullOrEmpty(dirdest))
                throw new System.ArgumentException("movefiletopath: the destination path is null or empty");
            //Bug #6482 -  security issue, uploadable extensions MUST be limited and checked at back end side. No session in this async call therefore it's using Web.config 
            List<string> allowedExtensionsList = MAGIC_SAVEFILEController.getAllowedExtensions();
            foreach (var f in files)
            {
                if (!MAGIC_SAVEFILEController.isExtensionAllowed(allowedExtensionsList, f.name))
                    throw new ArgumentException("Extension forbidden");
            }

            if (!Directory.Exists(dirdest))
            {
                try
                {
                    Directory.CreateDirectory(dirdest);
                }
                catch (Exception ex)
                {
                    throw new System.ArgumentException("movefiletopath create dir:" + ex.Message);
                }
            }
            try
            {
                JObject fileInfo = new JObject();
                JArray movedFiles = new JArray();
                bool trackOperation = ApplicationSettingsManager.trackFiles();

                foreach (MagicFramework.Models.FileUploaded f in files)
                {
                    string filefrom = Path.Combine(diruploaded, f.name);
                    string fileto = Path.Combine(dirdest, f.name);

                    try
                    {
                        //rimossa move perchè spostava solo il file e non aggiornava la tabella taget magic_files
                        //File.Move(filefrom, fileto);
                        Files.Register(f.name, filefrom, fileto, null, DBConnectionManager.GetTargetConnection(), false);
                        movedFiles.Add(fileto);
                    }
                    catch (Exception ex)
                    {
                        MagicFramework.Helpers.MFLog.LogInFile(ex.Message, MFLog.logtypes.ERROR);
                        if (trackOperation)
                        {
                            fileInfo["files"] = new JArray { fileto };
                            fileInfo["errorMessage"] = ex.Message;
                            MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("systemMoveError", fileInfo);
                        }
                        return;
                    }

                }

                if (trackOperation && movedFiles.Count > 0)
                {
                    fileInfo["files"] = movedFiles;
                    MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("systemMove", fileInfo);
                }
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("movefiletopath:" + ex.Message);
            }

        }
        private bool movefiletopath(int DOCUME_ID, List<MagicFramework.Models.FileUploaded> files)
        {
            string diruploaded = ApplicationSettingsManager.GetRootdirforupload();

            Data.DO_DOCUME_documents d = new Data.DO_DOCUME_documents();
            string dirdest = d.getPathComplete(DOCUME_ID);

            if (dirdest != null && !Directory.Exists(dirdest))
            {
                try
                {
                    Directory.CreateDirectory(dirdest);
                }
                catch (Exception ex)
                {
                    MagicFramework.Helpers.MFLog.LogInFile(ex.Message, MFLog.logtypes.ERROR);
                    return false;
                }
            }

            JObject fileInfo = new JObject();
            JArray movedFiles = new JArray();
            bool trackOperation = ApplicationSettingsManager.trackFiles();
            string connectionString = null;

            try
            {
                connectionString = MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
            }
            catch (System.Exception e)
            {
                MFLog.LogInFile("Error retreiving connection string in movefiletopath to save the delete file log inn db: " + e.Message, MFLog.logtypes.ERROR);
            }

            string applicationName = null;

            try
            {
                applicationName = ApplicationSettingsManager.GetAppInstanceName();
            }
            catch (System.Exception e)
            {
                MFLog.LogInFile("Error retreiving applicationName in movefiletopath to save the delete file log inn db: " + e.Message, MFLog.logtypes.ERROR);
            }


            foreach (MagicFramework.Models.FileUploaded f in files)
            {
                string filefrom = Path.Combine(diruploaded, f.name);
                string fileto = Path.Combine(dirdest, f.name);

                try
                {
                    Files.CopyInTrash(filefrom, connectionString, applicationName, fileto);
                    File.Move(filefrom, fileto);
                    movedFiles.Add(fileto);
                }
                catch (Exception ex)
                {
                    MagicFramework.Helpers.MFLog.LogInFile(ex.Message, MFLog.logtypes.ERROR);
                    if (trackOperation)
                    {
                        fileInfo["files"] = new JArray { fileto };
                        fileInfo["errorMessage"] = ex.Message;
                        MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("systemMoveError", fileInfo);
                    }
                    return false;
                }

            }

            if (trackOperation && movedFiles.Count > 0)
            {
                fileInfo["files"] = movedFiles;
                MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("systemMove", fileInfo);
            }

            return true;
        }

        [GridObjectsFilter]
        [HttpPost]
        public MagicFramework.Models.Response PostIFile(dynamic data)
        {
            if (data.cfgGridName != null)
                Magic_Grids.addGridPropertiesForCreateUpdatedDeleteOperations(data);

            List<MagicFramework.Models.FileUploaded> files = new List<MagicFramework.Models.FileUploaded>();
            if (files == null)
                return new MagicFramework.Models.Response("Nessun file caricato");
            string dirdest = String.Empty;

            var res = updateDocFileDataBase(data, "create", ref files, out dirdest);
            if (res.errorId != "0")
                throw new System.ArgumentException(res.message);
            int id = int.Parse(res.pkValue);

            Data.DO_DOCVER_versions v = new Data.DO_DOCVER_versions();
            string thumbnaillink = String.Empty;
            try
            {
                this.MakeThumbnail(id, dirdest, files.First());
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("create thumbnail: " + ex.Message, MFLog.logtypes.ERROR);
            }
            var dbres = new DatabaseCommandUtils().GetDataSet("SELECT * FROM core.DO_V_DOCFIL WHERE DO_DOCFIL_ID=" + id.ToString(), DBConnectionManager.GetTargetConnection()).Tables[0].Rows[0];
            return new MagicFramework.Models.Response(dbres.ItemArray, 1);
        }

        [GridObjectsFilter]
        [HttpPost]
        public HttpResponseMessage PostUFile(int id, dynamic data)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            if (data.cfgGridName != null)
                Magic_Grids.addGridPropertiesForCreateUpdatedDeleteOperations(data);

            List<MagicFramework.Models.FileUploaded> files = new List<MagicFramework.Models.FileUploaded>();
            if (files == null)
                return Utils.retInternalServerError("Nessun file caricato");
            string dirdest = String.Empty;

            var res = updateDocFileDataBase(data, "update", ref files, out dirdest);
            if (res.errorId != "0")
                throw new System.ArgumentException(res.message);
            try
            {
                this.MakeThumbnail(id, dirdest, files.First());
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("create thumbnail: " + ex.Message, MFLog.logtypes.ERROR);
            }
            response = Utils.retOkJSONMessage(res.message);
            return response;
        }


        public class documentsData
        {
            public int tipmodId { get; set; }
            public string formData { get; set; }
        }

        public class post
        {
            public List<documents> list { get; set; }
        }

        public class documents
        {
            public int DO_DOCUME_ID { get; set; }
            public int OBJECT_ID { get; set; }
        }
        public class docfil
        {
            public int DO_DOCFIL_DO_DOCUME_ID { get; set; }
            public string DO_DOCVER_LINK_FILE { get; set; }
        }

        [HttpPost]
        public HttpResponseMessage ExportzipforDocument(Data.DO_V_DOCUME data)
        {
            JObject fileInfo = new JObject();
            bool trackOperation = ApplicationSettingsManager.trackFiles();
            HttpResponseMessage result = new HttpResponseMessage(HttpStatusCode.OK);
            try
            {
                int DO_DOCUME_ID = data.DO_DOCUME_ID;

                ZipFile zip = new ZipFile();

                BL.FileGenerator fg = new BL.FileGenerator();
                string filename = fg.GetFileNameForZip(true);
                string fname = fg.GetFileNameForZip(false);
                JArray outfiles = new JArray();
                Dictionary<int, List<string>> documentFiles = new Dictionary<int, List<string>>();
                List<string> outFilesOfThisDoc = new List<string>();
                bool check = fg.AddDocumentToZip(DO_DOCUME_ID, ref zip, ref outfiles, outFilesOfThisDoc,null,null);
                if (!check)
                {
                    if (trackOperation)
                    {
                        fileInfo["files"] = new JArray { outfiles.Last() };
                        MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("downloadError", fileInfo);
                    }
                    return MagicFramework.Helpers.Utils.GetErrorMessageForDownload("File Mancate: " + Path.GetFileName(outfiles.Last().ToString()));
                }
                zip = fg.CloseAndReleaseZip(zip, filename);
                if (!documentFiles.ContainsKey(DO_DOCUME_ID))
                    documentFiles.Add(DO_DOCUME_ID, new List<string>());
                documentFiles[DO_DOCUME_ID] = BL.FileGenerator.getFileNamesFromOutFiles(outFilesOfThisDoc);
                // scarica lo zip                
                fg.AddDownloadToResponse(ref result, filename, fname, false, documentFiles);
                if (trackOperation)
                {
                    fileInfo["files"] = outfiles;
                    MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("download", fileInfo);
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Errore nella produzione del file: " + ex.Message, MFLog.logtypes.ERROR);
                result = MagicFramework.Helpers.Utils.GetErrorMessageForDownload("Errore nella produzione del file");
            }
            return result;
        }

        [HttpPost]
        public HttpResponseMessage ExportzipforDocumentList(post data)
        {
            var rabbitMQService = new Helpers.RabbitMQService();

            if (rabbitMQService.isActive())
            {
                return ExportzipforDocumentList_async(data);
            }

            JObject fileInfo = new JObject();
            bool trackOperation = ApplicationSettingsManager.trackFiles();
            HttpResponseMessage result = new HttpResponseMessage(HttpStatusCode.OK);
            ZipFile zip = new ZipFile();
            BL.FileGenerator fg = new BL.FileGenerator(true, DBConnectionManager.GetTargetConnection());
            string filename = fg.GetFileNameForZip(true);
            string fname = fg.GetFileNameForZip(false);

            string excelname = fg.GetFileNameForExcel();
            FileInfo path = new FileInfo(excelname);
            ExcelPackage package = new ExcelPackage(path);
            JArray outfiles = new JArray();

            Dictionary<int, List<string>> documentFiles = new Dictionary<int, List<string>>();
            foreach (documents d in data.list)
            {
                List<string> outFilesOfThisDoc = new List<string>();
                bool check = fg.AddDocumentToZip(d.DO_DOCUME_ID, ref zip, ref outfiles, outFilesOfThisDoc, null,null);
                if (!check)
                {
                    if (trackOperation)
                    {
                        fileInfo["files"] = new JArray { outfiles.Last() };
                        MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("downloadError", fileInfo);
                    }
                    return MagicFramework.Helpers.Utils.GetErrorMessageForDownload("File Mancante:" + Path.GetFileName(outfiles.Last().ToString()));
                }
                package = fg.AddDocumentToExcelList(package, d.DO_DOCUME_ID, d.OBJECT_ID,null);
                if (!documentFiles.ContainsKey(d.DO_DOCUME_ID))
                    documentFiles.Add(d.DO_DOCUME_ID, new List<string>());
                documentFiles[d.DO_DOCUME_ID] = BL.FileGenerator.getFileNamesFromOutFiles(outFilesOfThisDoc);
            }

            package.Save();

            if (File.Exists(excelname))
                zip = fg.AddFileToZip(excelname, zip);
            zip = fg.CloseAndReleaseZip(zip, filename);
            // scarica lo zip

            fg.AddDownloadToResponse(ref result, filename, fname, false, documentFiles);
            if (trackOperation)
            {
                fileInfo["files"] = outfiles;
                MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("download", fileInfo);
            }

            return result;
        }

        [HttpPost]
        [RateLimitUserSession(MaxRequest = 6, PerSeconds = 60)]
        public HttpResponseMessage ExportzipforDocumentList_async(post data)
        {
            HttpResponseMessage result = Utils.retOkMessage("Document list export started");
            try
            {
                var rabbitMQService = new Helpers.RabbitMQService();
                if (!rabbitMQService.IsConnectionAvailable())
                {
                    throw new ApplicationException("Servizio temporaneamente non disponibile. Si prega di riprovare più tardi. Se il problema persiste, contattare l'assistenza tecnica.");
                }

                // Get current user ID
                int userId = SessionHandler.IdUser;

                // Create a reference object for this document list
                string referenceType = ReferenceTypes.DOCUMENT_LIST;
                int referenceId = data.list.Count > 0 ? data.list[0].DO_DOCUME_ID : 0;

                // Try to delete any existing job from RabbitMQ directly
                string deletedJobId = rabbitMQService.DeleteJobFromQueue(userId, referenceId, referenceType);

                // Check if there are any processing jobs for this user and reference
                if (FileGenerator.HasProcessingZipJobs(referenceId, userId, new DatabaseCommandUtils(), referenceType))
                {
                    // Return a response indicating that a job is already being processed
                    result = Utils.retOkMessage("Un documento è già in fase di elaborazione. Si prega di attendere il completamento dell'operazione corrente.");

                    // Add the fileDownload cookie (this was already there)
                    var cookie = new CookieHeaderValue("fileDownload", "true");
                    cookie.Path = "/";
                    cookie.Expires = DateTimeOffset.Now.AddMinutes(1);

                    // Add a new status cookie to indicate job is already processing
                    var statusCookie = new CookieHeaderValue("fileDownloadJobStatus", "alreadyProcessing");
                    statusCookie.Path = "/";
                    statusCookie.Expires = DateTimeOffset.Now.AddMinutes(1);

                    // Add both cookies to the response
                    result.Headers.AddCookies(new[] { cookie, statusCookie });

                    return result;
                }

                // Init the file generator
                BL.FileGenerator fg = new BL.FileGenerator(true, DBConnectionManager.GetTargetConnection());
                string filename = fg.GetFileNameForZip(true);
                string fname = fg.GetFileNameForZip(false);

                // Create Excel file for document list
                string excelname = fg.GetFileNameForExcel();
                FileInfo path = new FileInfo(excelname);
                ExcelPackage package = new ExcelPackage(path);
                JArray outfiles = new JArray();

                Dictionary<int, List<string>> documentFiles = new Dictionary<int, List<string>>();
                List<string> filesToZip = new List<string>();
                Dictionary<string, string> pathMapping = new Dictionary<string, string>();
                Dictionary<string, string> watermarkedFiles = new Dictionary<string, string>();

                // Process each document
                foreach (documents d in data.list)
                {
                    List<string> outFilesOfThisDoc = new List<string>();

                    // Add document to queue instead of to zip using the existing method
                    bool check = fg.AddDocumentToZipQueue(d.DO_DOCUME_ID, ref outfiles, outFilesOfThisDoc,
                        ref filesToZip, ref pathMapping, ref watermarkedFiles, null, d.OBJECT_ID);

                    if (check)
                    {
                        package = fg.AddDocumentToExcelList(package, d.DO_DOCUME_ID, d.OBJECT_ID, null);
                        if (!documentFiles.ContainsKey(d.DO_DOCUME_ID))
                            documentFiles.Add(d.DO_DOCUME_ID, new List<string>());
                        documentFiles[d.DO_DOCUME_ID] = BL.FileGenerator.getFileNamesFromOutFiles(outFilesOfThisDoc);
                    }
                    else if (outfiles.Count > 0)
                    {
                        // Handle missing file error
                        JObject fileInfo = new JObject();
                        fileInfo["files"] = new JArray { outfiles.Last() };
                        MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("downloadError", fileInfo);
                        return MagicFramework.Helpers.Utils.GetErrorMessageForDownload("File Mancante:" + Path.GetFileName(outfiles.Last().ToString()));
                    }
                }

                try
                {
                    package.Save();
                }
                catch (Exception ex)
                {
                    string error = "Error saving Excel: " + ex.Message;
                    if (ex.InnerException != null)
                        error += " " + ex.InnerException;
                    throw new System.ArgumentException(error);
                }

                // Add Excel file to zip queue
                filesToZip.Add(excelname);
                pathMapping.Add(excelname, Path.GetFileName(excelname));

                // Generate a new job ID
                Guid jobId = Guid.NewGuid();

                // Set up callback URL
                string authority = HttpContext.Current.Request.Url.Authority;
                string scheme = HttpContext.Current.Request.Url.Scheme;
                string callbackUrl = $"{scheme}://{authority}/api/Documentale/ZipCallback";
                string applicationName = ApplicationSettingsManager.GetAppInstanceName() ?? "/";

                // Create the message for RabbitMQ
                var zipMessage = new BL.FileGenerator.ZipMessage
                {
                    files = filesToZip,
                    path_mapping = pathMapping,
                    watermarked_files = watermarkedFiles,
                    destination = filename,
                    job_id = jobId.ToString(),
                    callback_endpoint = callbackUrl,
                    application_name = applicationName,
                    user_id = userId,
                    reference_type = referenceType,
                    reference_id = referenceId
                };

                // Serialize the message to JSON
                string messageJson = JsonConvert.SerializeObject(zipMessage);

                // Track the job in the database
                FileGenerator.TrackZipJob(referenceId, filename, userId, jobId, messageJson, referenceType);

                // If we had a job that we deleted from RabbitMQ, mark it as overwritten now
                if (deletedJobId != null)
                {
                    MFLog.LogInFile($"Marking previously deleted job {deletedJobId} as overwritten by new job {jobId}", MFLog.logtypes.INFO);
                    FileGenerator.MarkJobAsOverwritten(deletedJobId, jobId.ToString());
                }

                // Send message to RabbitMQ
                rabbitMQService.SendMessage(zipMessage);

                // Return a response indicating the process has started
                result = Utils.retOkMessage($"Document list processing started with job ID: {jobId}. You will be notified when the file is ready for download.");

                // Add cookies for the jQuery plugin
                var jobCookie = new CookieHeaderValue("fileDownload", "true");
                jobCookie.Path = "/";
                jobCookie.Expires = DateTimeOffset.Now.AddMinutes(1);
                var jobTypeCookie = new CookieHeaderValue("fileDownloadJobType", "rabbitmq");
                jobTypeCookie.Path = "/";
                jobTypeCookie.Expires = DateTimeOffset.Now.AddMinutes(1);

                result.Headers.AddCookies(new[] { jobCookie, jobTypeCookie });

                // Add the job ID as a header
                result.Headers.Add("X-JobId", jobId.ToString());

                // Track file operation if needed
                bool trackOperation = ApplicationSettingsManager.trackFiles();
                if (trackOperation && outfiles.Count > 0)
                {
                    JObject fileInfo = new JObject();
                    fileInfo["files"] = outfiles;
                    fileInfo["jobId"] = jobId;
                    MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("download_request", fileInfo);
                }
            }
            catch (ApplicationException ex)
            {
                // RabbitMQ connection issues or other application-specific errors
                MFLog.LogInFile("Application error in ExportzipforDocumentList: " + ex.Message, MFLog.logtypes.ERROR);
                result = MagicFramework.Helpers.Utils.retInternalServerError("Service unavailable: " + ex.Message);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Error in ExportzipforDocumentList: " + ex.Message, MFLog.logtypes.ERROR);
                result = MagicFramework.Helpers.Utils.retInternalServerError(ex.Message);
            }
            return result;
        }


        [HttpPost]
        public HttpResponseMessage ZipCallback([FromBody] BL.FileGenerator.ZipResponse response)
        {
            try
            {
                // Log the response including application name
                MFLog.LogInFile($"Received zip callback: JobId={response.JobId}, Status={response.Status}, " +
                    $"Destination={response.Destination}, SuccessfulFiles={response.SuccessfulFiles}/{response.TotalFiles}, " +
                    $"ApplicationName={response.ApplicationName ?? "unknown"}", MFLog.logtypes.INFO);

                string currentHost = HttpContext.Current.Request.Url.Authority;
                var cfg = new MFConfiguration().GetApplicationInstanceByInstanceName(currentHost, response.ApplicationName);

                // If there's an error, log it
                if (!string.IsNullOrEmpty(response.ErrorMessage))
                {
                    MFLog.LogInFile($"Zip error: {response.ErrorMessage}", MFLog.logtypes.ERROR);
                }

                // Update job status in database based on the response status
                switch (response.Status.ToLower())
                {
                    case "success":
                        // Update job status to complete
                        FileGenerator.UpdateZipJobStatus(response.JobId, "complete", response.Destination, null, cfg);
                        break;

                    case "processing":
                        // Update job status to processing
                        FileGenerator.UpdateZipJobStatus(response.JobId, "processing", null, null, cfg);
                        break;

                    case "failure":
                    case "failed":
                    default:
                        // Update job status to failed
                        FileGenerator.UpdateZipJobStatus(response.JobId, "failed", null, response.ErrorMessage, cfg);
                        break;
                }

                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile($"Error processing zip callback: {ex.Message}", MFLog.logtypes.ERROR);
                return Request.CreateResponse(HttpStatusCode.InternalServerError, ex.Message);
            }
        }

        [HttpPost]
        public HttpResponseMessage ExportzipforRefTreeGrid(GenericZipRequest data)
        {
            HttpResponseMessage result = new HttpResponseMessage(HttpStatusCode.OK);
            ZipFile zip = new ZipFile();
            BL.FileGenerator fg = new BL.FileGenerator();
            var dbutils = new DatabaseCommandUtils();
            string fname;
            string filename;
            try
            {
                DataSet filenameds = dbutils.GetDataSetFromStoredProcedure(data.zipSP, data);
                fname = filenameds.Tables[0].Rows[0]["zipFile"].ToString();
                filename = Path.Combine(ApplicationSettingsManager.GetRootdirforupload(), fname);
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException(data.zipSP + " -- " + ex.Message);
            }
            fg.AddDownloadToResponse(ref result, filename, fname);

            return result;
        }


        [HttpPost]
        public HttpResponseMessage ViewFile(docfil data, string fname = null)
        {
            bool trackOperation = ApplicationSettingsManager.trackFiles();
            HttpResponseMessage result = new HttpResponseMessage();
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            BL.FileGenerator fg = new BL.FileGenerator();
            // path in cui sono contenuti i file del corrente DO_DOCUME_ID                
            string rootdirfordoc = fg.getCompletePath(data, dbutils);
            if (fname == null)
                fname = BL.FileGenerator.GetFilenameFromJson(data.DO_DOCVER_LINK_FILE);
            string pathcomplete = Path.Combine(rootdirfordoc, fname);

            JObject fileInfo = new JObject();
            fileInfo["files"] = new JArray { pathcomplete };
            if (File.Exists(@pathcomplete))
            {
                Dictionary<int, List<string>> documentList = new Dictionary<int, List<string>>();
                documentList.Add(data.DO_DOCFIL_DO_DOCUME_ID, new List<string>() { fname });
                fg.AddDownloadToResponse(ref result, pathcomplete, fname, false, documentList);
                result.StatusCode = HttpStatusCode.OK;
                if (trackOperation)
                    MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("download", fileInfo);
            }
            else
            {
                result = MagicFramework.Helpers.Utils.GetErrorMessageForDownload("File mancante:" + fname);
                if (trackOperation)
                    MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("downloadError", fileInfo);
                return result;
            }

            var cookie = new CookieHeaderValue("fileDownload", "true");
            cookie.Expires = DateTimeOffset.Now.AddDays(1);
            if (HttpContext.Current.Request.IsSecureConnection)
                cookie.Secure = true;
            cookie.Domain = Request.RequestUri.Host;
            cookie.Path = "/";
            result.Headers.AddCookies(new CookieHeaderValue[] { cookie });

            return result;
        }

        private DataRow getUserDataWithoutSession(int userid, MFConfiguration.ApplicationInstanceConfiguration config)
        {
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils(true);
            DataSet ds = dbutils.GetDataSet("SELECT * FROM Magic_mmb_Users where UserID = " + userid.ToString(), config.TargetDBconn);
            return ds.Tables[0].Rows[0];
        }

        [HttpGet]
        public HttpResponseMessage PublicGetFile(string instanceId, string token, int DO_DOCFIL_DO_DOCUME_ID, string fileName)
        {
            try
            {
                SessionHandler.ApplicationInstanceId = instanceId;
                DataRow row = MagicFramework.Models.Tokens.GetValidToken(token, "PublicGetFile");
                if (row != null)
                {
                    MFConfiguration.ApplicationInstanceConfiguration config = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, instanceId);
                    int uid = (int)row["user_id"];
                    SessionHandler.IdUser = uid;
                    SessionHandler.ApplicationInstanceName = config.appInstancename;
                    DataRow udata = getUserDataWithoutSession(uid, config);
                    SessionHandler.UserFirstName = udata["FirstName"].ToString();
                    SessionHandler.UserLastName = udata["LastName"].ToString();
                    SessionHandler.Username = udata["Username"].ToString();
                    return ViewFile(
                        new docfil
                        {
                            DO_DOCFIL_DO_DOCUME_ID = DO_DOCFIL_DO_DOCUME_ID
                        }
                        , fileName
                    );
                }
                else
                {
                    return new HttpResponseMessage()
                    {
                        StatusCode = HttpStatusCode.Forbidden
                    };
                }
            }
            catch (Exception e)
            {
                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.InternalServerError
                };
            }
        }
        //D.T 20/10/2020 Commented !!! very dangerous
        //[HttpGet]
        //public HttpResponseMessage GetDocumentPaths(string documentIDs)
        //{
        //    var res = new HttpResponseMessage();
        //    res.StatusCode = HttpStatusCode.OK;
        //    try
        //    {
        //        res.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(Data.DO_DOCUME_documents.GetFilePathByDocumentIDs(documentIDs.Split(',').ToList().Select(int.Parse).ToList())));
        //    }
        //    catch(Exception e)
        //    {
        //        res.StatusCode = HttpStatusCode.InternalServerError;
        //        res.Content = new StringContent(e.Message);
        //    }
        //    return res;
        //}

        [HttpPost]
        public string GetTabStrip(dynamic data)
        {
            HtmlGenericControl div = HtmlControlsBuilder.GetHtmlControl(HtmlControlTypes.div, null, null, null, "tabstrip");
            HtmlGenericControl ul = HtmlControlsBuilder.GetHtmlControl(HtmlControlTypes.ul, null, null, null, null);

            try
            {
                // vista per Tabstrip elements                                        
                //var res = _context.DO_GET_UI_ELEMENTS(SessionHandler.IdUser, SessionHandler.UserVisibilityGroup).ToList();
                var dbutils = new DatabaseCommandUtils();
                string cstmFiltervalue = data.actionfilter;
                if (cstmFiltervalue == null)
                    cstmFiltervalue = String.Empty;
                dynamic filter = JObject.FromObject(new
                {
                    actionfilter = cstmFiltervalue
                });
                var res = dbutils.GetDataSetFromStoredProcedure("core.DO_GET_UI_ELEMENTS_FILTER", filter).Tables[0].Rows;


                bool first = true;
                foreach (DataRow t in res)
                {
                    string label = Utils.FirstCharToUpper(t["DO_CLADOC_DESCRIPTION"].ToString()); //+ " (<b>" + t.qtadoc.ToString() + "</b>/<font color='red'><b>" + t.qtasca.ToString() + "</b></font>)";
                    HtmlGenericControl li = HtmlControlsBuilder.GetHtmlControl(HtmlControlTypes.li, first ? "k-state-active" : null, "background-color: " + t["DO_CLADOC_COLOR"].ToString(), label, null);
                    li.Attributes.Add("data-DO_CLADOC_ID", t["DO_CLADOC_ID"].ToString());
                    first = false;
                    ul.Controls.Add(li);
                }
                div.Controls.AddAt(0, ul);
            }
            catch (Exception ex)
            {
                return (string.Format("Failed with message -{0}", ex.Message));
            }
            return HtmlControlsBuilder.HtmlControlToText(div);
        }

        /// <summary>
        /// This api can be called from an external application 
        /// </summary>
        /// <param name="token">token to be found in Magic_Mmb_Tokens</param>
        /// <param name="appname">the application instance name to work on</param>
        /// <param name="tipmodid">the model</param>
        /// <param name="formdata">The JSON containing the payload that will be converted to XML in stored procedures</param>
        /// <param name="arevisid">The arevis that will be passed to stored procedures</param>
        /// <returns></returns>
        [HttpGet]
        public HttpResponseMessage GetBuildDocumentsFromModel(string token, string appname, int tipmodid, string formdata, int arevisid)
        {
            HttpResponseMessage response = new HttpResponseMessage();

            dynamic formData = JsonConvert.DeserializeObject(formdata);
            string host = HttpContext.Current.Request.Url.Host;
            string connection = new MFConfiguration(host).GetApplicationInstanceByInstanceName(host, appname).TargetDBconn;
            string rootDirForUpload = new MFConfiguration(host).GetApplicationInstanceByInstanceName(host, appname).Rootdirforupload;
            string pdfExtConverter = new MFConfiguration(host).GetApplicationInstanceByInstanceName(host, appname).PDFNetServiceDirectory;
            if (String.IsNullOrEmpty(pdfExtConverter))
                pdfExtConverter = null;
            
            using (SqlConnection PubsConn = new SqlConnection(connection))
            {
                PubsConn.Open();
                DataSet tokends = new DataSet();
                SqlCommand tokencmd = new SqlCommand(@"SELECT [user_id] from Magic_mmb_Tokens where token=@token and Active=1", PubsConn);
                SqlParameter tokenpar = new SqlParameter("@token", SqlDbType.VarChar);
                tokenpar.Value = token;
                tokencmd.Parameters.Add(tokenpar);
                SqlDataAdapter da = new SqlDataAdapter();
                da.SelectCommand = tokencmd;
                da.Fill(tokends);
                da.Dispose();

                if (tokends.Tables[0].Rows.Count == 0)
                    throw new System.ArgumentException("Access denied");

                int userid = int.Parse(tokends.Tables[0].Rows[0]["user_id"].ToString());
                SessionHandler.CreateUserSession(appname, userid, Request.RequestUri.Authority);
                TIPMOD tipmod = GetTipModData(tipmodid);
               

                FileInfo templateFile = new FileInfo(tipmod.PS_TIPMOD_LINK_FILE.ToString());
                if (!File.Exists(templateFile.FullName))
                    return Utils.retInternalServerError("File '" + templateFile.FullName + "' not exists", genericError);

                MagicFramework.Data.MagicDBDataContext magicDBContext = new MagicFramework.Data.MagicDBDataContext(connection);
                MagicFramework.Data.Magic_DocumentFillSessions documentFillSession = new MagicFramework.Data.Magic_DocumentFillSessions
                {
                    InputData = formData.ToString(),
                    User_ID = userid,
                    StartDate = DateTime.Now
                };
                magicDBContext.Magic_DocumentFillSessions.InsertOnSubmit(documentFillSession);
                magicDBContext.SubmitChanges();

                formData.DocumentFillSession_ID = documentFillSession.ID;


                DatabaseCommandUtils dbutils = new DatabaseCommandUtils(true);
                DataSet ds = dbutils.GetDataSetFromStoredProcedure(tipmod.PS_TIPMOD_STORED_EXT.ToString(), formData, connection, null, userid, arevisid);
                WordDocumentFiller docfiller = new WordDocumentFiller(templateFile.FullName, ds, formData);
                docfiller.FillDictionariesAndMetaData();

                if (docfiller.getRootBoCount() == 0)
                    return Utils.retInternalServerError(tipmod.PS_TIPMOD_STORED_EXT.ToString() + " did not return any item", genericError);



                BL.FileGenerator fileGenerator = new BL.FileGenerator(true);
                string directory = Path.Combine(rootDirForUpload, documentFillFolder, documentFillSession.ID.ToString());

                Directory.CreateDirectory(directory);
                if (!Directory.Exists(directory))
                    return Utils.retInternalServerError("Errore nella creazione directory: " + directory, genericError);

                bool isBatch = tipmod.PS_TIPMOD_FLAG_BATCH as bool? ?? false;

                OutputFilesData OutputFilesData = new OutputFilesData
                {
                    magicDBContext = magicDBContext,
                    documentFillSession = documentFillSession,
                    fileGenerator = fileGenerator,
                    zipName = fileGenerator.GetFileNameForZip(false, rootDirForUpload, true),
                    directory = directory,
                    docfiller = docfiller,
                    templateFile = templateFile,
                    saveAsPdf = tipmod.PS_TIPOUT_CODE.ToString() == "pdf",
                    dbutils = dbutils,
                    STORED_RET = tipmod.PS_TIPMOD_STORED_RET.ToString(),
                    createZip = !isBatch,
                    targetConnection = connection,
                    isPublicSite = false,
                    skipMergeFile = tipmod.PS_TIPMOD_SKIP_MERGE_FILE??false

                };

                try
                {
                    if (OutputFilesData.isPublicSite == false)
                        OutputFilesData.isPublicSite = bool.Parse(formData["isPublic"].ToString());
                }
                catch (Exception ex)
                {
                    Debug.WriteLine(ex.Message);
                }

                OutputFilesSessionData OutputFilesSessionData = new OutputFilesSessionData
                {
                    idUser = userid, //in the separate Thread the session is not available
                    idUserGroup = arevisid,
                    connectionString = connection
                };
                
                buildOutputFiles(OutputFilesData, OutputFilesSessionData, false, pdfExtConverter);
            }
            response.StatusCode = HttpStatusCode.OK;
            return response;
        }

        private static bool checkConfigurationForTemplate(FileInfo templateFile)
        {
            if (templateFile.Extension == ".pdf")
            {
                bool PDFNetServiceIsConfigured = false;
                string PDFNetServiceDirectory = ApplicationSettingsManager.GetPDFNetServiceDirectory();
                if (!string.IsNullOrEmpty(PDFNetServiceDirectory))
                {
                    PDFNetServiceIsConfigured = true;
                }
                return PDFNetServiceIsConfigured;
            }
            return true;
        }
        private static string PDFExternalConverter()
        {
            string PDFNetServiceDirectory = ApplicationSettingsManager.GetPDFNetServiceDirectory();
            if (!string.IsNullOrEmpty(PDFNetServiceDirectory))
            {
                return PDFNetServiceDirectory;
            }
            return null;
        }
        public class TIPMOD
        {
            public string PS_TIPMOD_STORED_EXT { get; set; }
            public string PS_TIPMOD_STORED_RET { get; set; }
            public string PS_TIPMOD_LINK_FILE { get; set; }
            public bool PS_TIPMOD_FLAG_BATCH { get; set; }
            public string PS_TIPOUT_CODE { get; set; }
            public bool PS_TIPMOD_MERGE_ONLY_ZIP { get; set; }
            public bool? PS_TIPMOD_SKIP_MERGE_FILE { get; set; }

            public bool? PS_TIPMOD_FLAG_PREVIEW { get; set; }

			public TIPMOD(SqlDataReader reader)
            {
                this.PS_TIPMOD_LINK_FILE = reader["PS_TIPMOD_LINK_FILE"].ToString();
                this.PS_TIPMOD_STORED_EXT = reader["PS_TIPMOD_STORED_EXT"] != null ? reader["PS_TIPMOD_STORED_EXT"].ToString() : null;
                this.PS_TIPMOD_STORED_RET = reader["PS_TIPMOD_STORED_RET"] != null ? reader["PS_TIPMOD_STORED_RET"].ToString() : null;
                this.PS_TIPMOD_FLAG_BATCH = reader["PS_TIPMOD_FLAG_BATCH"] as bool? ?? false;
                this.PS_TIPOUT_CODE = reader["PS_TIPOUT_CODE"].ToString();
                var conf = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);

                
                try
                {
                    this.PS_TIPMOD_MERGE_ONLY_ZIP = reader["PS_TIPMOD_MERGE_ONLY_ZIP"] as bool? ?? false;
                }
                catch (Exception ex) {
                    this.PS_TIPMOD_MERGE_ONLY_ZIP = false;
                }
                try
                {
                    this.PS_TIPMOD_SKIP_MERGE_FILE = reader["PS_TIPMOD_SKIP_MERGE_FILE"] as bool?;
                }
                catch (Exception ex)
                {
                    this.PS_TIPMOD_SKIP_MERGE_FILE = null;
                }
				try
				{
					this.PS_TIPMOD_FLAG_PREVIEW = reader["PS_TIPMOD_FLAG_PREVIEW"] as bool? ?? false;
				}
				catch (Exception ex)
				{
					this.PS_TIPMOD_FLAG_PREVIEW = false;
				}

			}
        }
        private static TIPMOD GetTipModData(int tipModId)
        {
            TIPMOD tipMod = null;
            string connection = DBConnectionManager.GetConnectionFor("core.PS_GRIMOD_model_grid");

            // Check if the new fields exist to be retro-compatible
            string checkNewFieldsSql = @"SELECT COLUMN_NAME 
                                 FROM INFORMATION_SCHEMA.COLUMNS 
                                 WHERE TABLE_NAME = 'PS_TIPMOD_type_model' 
                                 AND COLUMN_NAME IN ('PS_TIPMOD_MERGE_ONLY_ZIP', 'PS_TIPMOD_SKIP_MERGE_FILE', 'PS_TIPMOD_FLAG_PREVIEW')";

            var dbutils = new DatabaseCommandUtils();
            var dscheck = dbutils.GetDataSet(checkNewFieldsSql);

            bool mergeOnlyZipFieldIsThere = false;
            bool skipMergeFileFieldIsThere = false;
			bool showPreviewFieldIsThere = false;


			foreach (DataRow row in dscheck.Tables[0].Rows)
            {
                if (row["COLUMN_NAME"].ToString() == "PS_TIPMOD_MERGE_ONLY_ZIP")
                {
                    mergeOnlyZipFieldIsThere = true;
                }
                if (row["COLUMN_NAME"].ToString() == "PS_TIPMOD_SKIP_MERGE_FILE")
                {
                    skipMergeFileFieldIsThere = true;
                }
				if (row["COLUMN_NAME"].ToString() == "PS_TIPMOD_FLAG_PREVIEW")
				{
					showPreviewFieldIsThere = true;
				}
			}

            string sql = @"SELECT
                    PS_TIPMOD_STORED_EXT,  
                    PS_TIPMOD_STORED_RET,
                    PS_TIPMOD_LINK_FILE,
                    PS_TIPMOD_FLAG_BATCH,
                    PS_TIPOUT_CODE{0}{1}{2}
                    FROM core.PS_TIPMOD_type_model
                    INNER JOIN core.PS_TIPOUT_type_output ON PS_TIPMOD_PS_TIPOUT_ID = PS_TIPOUT_ID
                    WHERE PS_TIPMOD_ID = @tipModId";

            string mergeOnlyZipField = mergeOnlyZipFieldIsThere ? ", PS_TIPMOD_MERGE_ONLY_ZIP" : "";
            string skipMergeFileField = skipMergeFileFieldIsThere ? ", PS_TIPMOD_SKIP_MERGE_FILE" : "";
			string showPreviewsField = showPreviewFieldIsThere ? ", PS_TIPMOD_FLAG_PREVIEW" : "";


			sql = String.Format(sql, mergeOnlyZipField, skipMergeFileField, showPreviewsField);

            using (SqlConnection PubsConn = new SqlConnection(connection))
            {
                PubsConn.Open();
                SqlCommand command = new SqlCommand(sql, PubsConn);
                command.Parameters.Add(new SqlParameter("@tipModId", tipModId));
                SqlDataReader reader = command.ExecuteReader();
                reader.Read();
                tipMod = new TIPMOD(reader);
            }

            return tipMod;
        }

        private static string buildPdfExternalCommandLinePars(int sessionID,bool mergeOnlyInZip, OutputFilesData outputData) {
            string applicationKey = ApplicationSettingsManager.GetAppInstanceName();            
            string onCreateStoredProcedure = ApplicationSettingsManager.GetOnDocumentCreateStoredProcedure();

            if(onCreateStoredProcedure.Length == 0)
            {
                onCreateStoredProcedure = "sp_not_configured";
            }

            string mergeOnly = mergeOnlyInZip ? "true" : "false";
            string args = 
                "create" + " " +                                        //0
                sessionID.ToString() + " " +                            //1
                applicationKey + " " +                                  //2
                SessionHandler.IdUser.ToString() + " " +                //3
                SessionHandler.UserVisibilityGroup.ToString() + " " +   //4
                onCreateStoredProcedure;                                //5

            if (outputData.createZip == true)
            {
                args += " " + 
                    Path.GetFileName(outputData.zipName) + " " +        //6
                    mergeOnly;                                          //7
            }
            return args;
        }
        private static int getCounterForPdfExternalCommand(int documentFillSessionId,bool includeMergeOnly,bool createZip) {
            string sql = "select count(*) from [dbo].[Magic_PDFFormSessionInput] where DocumentFillSession_ID = " + documentFillSessionId;
            if (includeMergeOnly)
                sql = "SELECT COUNT(DISTINCT MergeFileName) FROM [dbo].Magic_PDFFormSessionInput WHERE DocumentFillSession_ID = " + documentFillSessionId;

            object countField = new DatabaseCommandUtils().GetDataSet(sql, DBConnectionManager.GetTargetConnection()).Tables[0].Rows[0][0];

            int fCount = Convert.ToInt32(countField.ToString());
            if (createZip)
            {
                fCount++;
            }
            return fCount;
        }

        [HttpPost]
        public HttpResponseMessage BuildDocumentsFromRowModel(JObject data)
        {            
            dynamic rowData = data["rowdata"];
            dynamic actionCommand = data["actioncommand"];
            bool saveAsPdf = actionCommand["saveAsPdf"];

            MagicFramework.Data.MagicDBDataContext magicDBContext = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            MagicFramework.Data.Magic_DocumentFillSessions documentFillSession = new MagicFramework.Data.Magic_DocumentFillSessions
            {
                InputData = rowData.ToString(),
                User_ID = SessionHandler.IdUser,
                StartDate = DateTime.Now
            };
            magicDBContext.Magic_DocumentFillSessions.InsertOnSubmit(documentFillSession);
            magicDBContext.SubmitChanges();
            rowData.DocumentFillSession_ID = documentFillSession.ID;
            
            string storedProcedure = ApplicationSettingsManager.GetRowDocStoredProcedure();

            if (storedProcedure == null || storedProcedure.Length <= 0)
            {
                string errMsg = "<RowDocStoredProcedure> is not configured correctly!";
                MFLog.LogInFile(errMsg, MFLog.logtypes.ERROR);
                throw new System.ArgumentException(errMsg);
            }

            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();            
            DataSet ds = dbutils.GetDataSetFromStoredProcedure(storedProcedure, rowData);
            
            JArray modelFiles = JsonConvert.DeserializeObject(rowData.row_model_file.Value);
            JObject modelFile = (JObject) modelFiles[0];

            string rootDirForUpload = ApplicationSettingsManager.GetRootdirforupload();
            string modelFileName = (string) modelFile["name"];
            string modelPath = Path.Combine(rootDirForUpload, modelFileName);

            WordDocumentFiller docfiller = new WordDocumentFiller(modelPath, ds, rowData);
            FileInfo templateFile = new FileInfo(modelPath);

            if (templateFile.Extension.ToLower() != ".docx")
            {
                string errMsg = "Currently only .docx models are supported!";
                MFLog.LogInFile(errMsg, MFLog.logtypes.ERROR);
                throw new System.ArgumentException(errMsg);
            }

            docfiller.FillDictionariesAndMetaData();
            if (docfiller.getRootBoCount() == 0)
                return Utils.retInternalServerError(storedProcedure + " did not return any item", genericError);
            

            BL.FileGenerator fileGenerator = new BL.FileGenerator();
            string directory = Path.Combine(fileGenerator.modelexportdir, documentFillFolder, documentFillSession.ID.ToString());
            MFLog.LogInFile("check directory starts..", MFLog.logtypes.INFO);

            Directory.CreateDirectory(directory);
            if (!Directory.Exists(directory))
                return Utils.retInternalServerError("Errore nella creazione directory: " + directory, genericError);
            MFLog.LogInFile("check directory ends..", MFLog.logtypes.INFO);
                        
            string zipName = fileGenerator.GetFileNameForZip(false, true);

            var conf = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
            OutputFilesData OutputFilesData = new OutputFilesData
            {
                magicDBContext = magicDBContext,
                documentFillSession = documentFillSession,
                fileGenerator = fileGenerator,
                zipName = zipName,
                directory = directory,
                docfiller = docfiller,
                templateFile = templateFile,
                saveAsPdf = saveAsPdf,
                dbutils = dbutils,
                STORED_RET = null,
                createZip = true,
                targetConnection = DBConnectionManager.GetTargetConnection(),
                isPublicSite = conf.includePDFOnly,
                skipMergeFile = conf.skipMergeFile
            };
            MFLog.LogInFile("check public site starts..", MFLog.logtypes.INFO);


            OutputFilesSessionData OutputFilesSessionData = new OutputFilesSessionData
            {
                idUser = SessionHandler.IdUser, //in the separate Thread the session is not available
                idUserGroup = SessionHandler.UserVisibilityGroup,
                connectionString = DBConnectionManager.GetTargetConnection()
            };

            bool isMSSQLFileActive = ApplicationSettingsManager.getMSSQLFileTable();
            string pdfExtConverter = PDFExternalConverter();
            MFLog.LogInFile("buildOutputFiles starts...", MFLog.logtypes.INFO);
            buildOutputFiles(OutputFilesData, OutputFilesSessionData, isMSSQLFileActive, pdfExtConverter);
            MFLog.LogInFile("buildOutputFiles ends...", MFLog.logtypes.INFO);

            HttpResponseMessage r = new HttpResponseMessage();
            
            string zipPath = Path.Combine(directory, zipName);
            byte[] file = File.ReadAllBytes(zipPath);
            string contentType = Utils.GetMimeType(@zipPath);
            r.Content = new ByteArrayContent(file);
            r.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            r.Content.Headers.Add("Content-Disposition", string.Format("inline;FileName=\"{0}\"", zipName));
            r.Content.Headers.Add("Set-Cookie", string.Format("fileDownload=true; path=/"));
            r.StatusCode = HttpStatusCode.OK;
            return r;
        }

        [HttpPost]
        public HttpResponseMessage BuildDocumentsFromModel(documentsData data)
        {

            dynamic formData = JsonConvert.DeserializeObject(data.formData);
            string connection = DBConnectionManager.GetConnectionFor("core.PS_GRIMOD_model_grid");
            TIPMOD tipModData = GetTipModData(int.Parse(data.tipmodId.ToString()));
            if (tipModData == null)
                return Utils.retInternalServerError("TIPMOD_ERR", genericError);

            FileInfo templateFile = new FileInfo(tipModData.PS_TIPMOD_LINK_FILE);
            if (!File.Exists(templateFile.FullName))
                return Utils.retInternalServerError("File '" + templateFile.FullName + "' not exists", genericError);

            if (!checkConfigurationForTemplate(templateFile))
                return Utils.retInternalServerError("Configuration not set", genericError);


            MagicFramework.Data.MagicDBDataContext magicDBContext = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            MagicFramework.Data.Magic_DocumentFillSessions documentFillSession = new MagicFramework.Data.Magic_DocumentFillSessions
            {
                InputData = formData.ToString(),
                User_ID = SessionHandler.IdUser,
                StartDate = DateTime.Now
            };
            magicDBContext.Magic_DocumentFillSessions.InsertOnSubmit(documentFillSession);
            magicDBContext.SubmitChanges();

            formData.DocumentFillSession_ID = documentFillSession.ID;


            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            DataSet ds = dbutils.GetDataSetFromStoredProcedure(tipModData.PS_TIPMOD_STORED_EXT, formData);
            WordDocumentFiller docfiller = new WordDocumentFiller(templateFile.FullName, ds, formData);
            if (templateFile.Extension != ".pdf")
            {
                docfiller.FillDictionariesAndMetaData(); //don't exec if PDFFORMFILLER-case
                if (docfiller.getRootBoCount() == 0)
                    return Utils.retInternalServerError(tipModData.PS_TIPMOD_STORED_EXT + " did not return any item", genericError);
            }

            BL.FileGenerator fileGenerator = new BL.FileGenerator();
            string directory = Path.Combine(fileGenerator.modelexportdir, documentFillFolder, documentFillSession.ID.ToString());
            MFLog.LogInFile("check directory starts..", MFLog.logtypes.INFO);

            Directory.CreateDirectory(directory);
            if (!Directory.Exists(directory))
                return Utils.retInternalServerError("Errore nella creazione directory: " + directory, genericError);
            MFLog.LogInFile("check directory ends..", MFLog.logtypes.INFO);

            bool isBatch = tipModData.PS_TIPMOD_FLAG_BATCH;

            //MFLog.LogInFile("deleting old files ends...", MFLog.logtypes.INFO);
            var conf = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
            OutputFilesData OutputFilesData = new OutputFilesData
            {
                magicDBContext = magicDBContext,
                documentFillSession = documentFillSession,
                fileGenerator = fileGenerator,
                zipName = fileGenerator.GetFileNameForZip(false, true),
                directory = directory,
                docfiller = docfiller,
                templateFile = templateFile,
                saveAsPdf = tipModData.PS_TIPOUT_CODE == "pdf",
                dbutils = dbutils,
                STORED_RET = tipModData.PS_TIPMOD_STORED_RET,
                createZip = !isBatch,
                targetConnection = DBConnectionManager.GetTargetConnection(),
                isPublicSite = conf.includePDFOnly,
                skipMergeFile = tipModData.PS_TIPMOD_SKIP_MERGE_FILE ?? conf.skipMergeFile
            };
            MFLog.LogInFile("check public site starts..", MFLog.logtypes.INFO);
            bool showPreview = false;

            try
            {
                if (OutputFilesData.isPublicSite == false)
                    OutputFilesData.isPublicSite = bool.Parse(formData["isPublic"].ToString());
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
            MFLog.LogInFile("check public site ends..", MFLog.logtypes.INFO);

            OutputFilesSessionData OutputFilesSessionData = new OutputFilesSessionData
            {
                idUser = SessionHandler.IdUser, //in the separate Thread the session is not available
                idUserGroup = SessionHandler.UserVisibilityGroup,
                connectionString = DBConnectionManager.GetTargetConnection()
            };
            bool isMSSQLFileActive = ApplicationSettingsManager.getMSSQLFileTable();

            int? taskID = null;
            string pdfExtConverter = PDFExternalConverter();
            //If the conversion has to be made with an external tool it will alway be async
            if (templateFile.Extension == ".pdf")
            {
                //start #PDFNetService
                string args = buildPdfExternalCommandLinePars(documentFillSession.ID, tipModData.PS_TIPMOD_MERGE_ONLY_ZIP, OutputFilesData);

                ProcessStartInfo startInfo = new ProcessStartInfo
                {
                    FileName = pdfExtConverter,
                    Arguments = args,
                    UseShellExecute = false,
                };

                
                Process.Start(startInfo);
            }
            else if (formData["synch"] == true) //force synch 
            {
                MFLog.LogInFile("buildOutputFiles starts...", MFLog.logtypes.INFO);
                buildOutputFiles(OutputFilesData, OutputFilesSessionData, isMSSQLFileActive, pdfExtConverter);
                MFLog.LogInFile("buildOutputFiles ends...", MFLog.logtypes.INFO);
            }
            else  //internal PDF conversion (if needed 
            {
                if (OutputFilesData.saveAsPdf & tipModData.PS_TIPMOD_FLAG_PREVIEW ?? false)
                    showPreview = true;
                ManualResetEventSlim pauseEvent = new ManualResetEventSlim(true);
                CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();
                Task task = new Task(() => buildOutputFiles(OutputFilesData, OutputFilesSessionData, isMSSQLFileActive, pdfExtConverter, cancellationTokenSource, pauseEvent, showPreview), cancellationTokenSource.Token);
                buildTasks.Add(task.Id, new BuildTask { userID = SessionHandler.IdUser, task = task, cancellationTokenSource = cancellationTokenSource, pauseEvent = pauseEvent });
                taskID = task.Id;
                task.Start();
            }



            int summaryAddendum = (docfiller.getRootBoCount() == 1 || OutputFilesData.skipMergeFile ? 1 : 2);//if the item count is 1 i won't produce the summary file

            JObject json = new JObject();
            json.Add("taskID", taskID);
            json.Add("documentFillSessionId", documentFillSession.ID);

            if (templateFile.Extension == ".pdf")
            {
                int fCount = getCounterForPdfExternalCommand(documentFillSession.ID, tipModData.PS_TIPMOD_MERGE_ONLY_ZIP, OutputFilesData.createZip);
                json.Add("fileCount", fCount);
            }
            else
            {
                json.Add("fileCount", docfiller.getRootBoCount() + summaryAddendum); //1 for each RootBo + combine + zip
            }
            json.Add("zipName", Path.GetFileName(OutputFilesData.zipName));
            json.Add("showPreview", showPreview);

            HttpResponseMessage r = new HttpResponseMessage();
            r.StatusCode = HttpStatusCode.OK;
            if (!isBatch)
                r.Content = new StringContent(json.ToString());
            return r;

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
            BL.FileGenerator fileGenerator = new BL.FileGenerator();
            string directory = Path.Combine(fileGenerator.modelexportdir, documentFillFolder, documentFillSessionId.ToString());
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


        //[HttpPost]
        //public HttpResponseMessage BuildDocumentsFromModel(documentsData data)
        //{

        //    dynamic formData = JsonConvert.DeserializeObject(data.formData);
        //    string connection = DBConnectionManager.GetConnectionFor("core.PS_GRIMOD_model_grid");
        //    using (SqlConnection PubsConn = new SqlConnection(connection))
        //    {
        //        //EXT is launched after generation has completed (per document) and RET is launched in load 
        //        SqlCommand command = new SqlCommand(@"SELECT
        //            PS_TIPMOD_STORED_EXT,  
        //            PS_TIPMOD_STORED_RET,
        //            PS_TIPMOD_LINK_FILE,
        //            PS_TIPMOD_FLAG_BATCH,
        //            PS_TIPOUT_CODE
        //            FROM core.PS_TIPMOD_type_model
        //            INNSER JOIN core.PS_TIPOUT_type_output ON PS_TIPMOD_PS_TIPOUT_ID = PS_TIPOUT_ID
        //            WHERE PS_TIPMOD_ID = " + data.tipmodId, PubsConn);
        //        PubsConn.Open();
        //        SqlDataReader reader = command.ExecuteReader();
        //        reader.Read();

        //        FileInfo templateFile = new FileInfo(reader["PS_TIPMOD_LINK_FILE"].ToString());
        //        if(!File.Exists(templateFile.FullName))
        //            return Utils.retInternalServerError("File '" + templateFile.FullName + "' not exists",genericError);

        //        if (!checkConfigurationForTemplate(templateFile))
        //            return Utils.retInternalServerError("Configuration not set", genericError);


        //        MagicFramework.Data.MagicDBDataContext magicDBContext = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
        //        MagicFramework.Data.Magic_DocumentFillSessions documentFillSession = new MagicFramework.Data.Magic_DocumentFillSessions
        //        {
        //            InputData = formData.ToString(),
        //            User_ID = SessionHandler.IdUser,
        //            StartDate = DateTime.Now
        //        };
        //        magicDBContext.Magic_DocumentFillSessions.InsertOnSubmit(documentFillSession);
        //        magicDBContext.SubmitChanges();

        //        formData.DocumentFillSession_ID = documentFillSession.ID;


        //        DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
        //        DataSet ds = dbutils.GetDataSetFromStoredProcedure(reader["PS_TIPMOD_STORED_EXT"].ToString(), formData);
        //        WordDocumentFiller docfiller = new WordDocumentFiller(templateFile.FullName, ds, formData);                
        //        if (templateFile.Extension != ".pdf")
        //        {
        //            docfiller.FillDictionariesAndMetaData(); //don't exec if PDFFORMFILLER-case
        //            if (docfiller.getRootBoCount() == 0)
        //                return Utils.retInternalServerError(reader["PS_TIPMOD_STORED_EXT"].ToString() + " did not return any item", genericError);
        //        }

        //        BL.FileGenerator fileGenerator = new BL.FileGenerator();
        //        string directory = Path.Combine(fileGenerator.modelexportdir, documentFillFolder, documentFillSession.ID.ToString());
        //        MFLog.LogInFile("check directory starts..", MFLog.logtypes.INFO);

        //        Directory.CreateDirectory(directory);
        //        if (!Directory.Exists(directory))
        //            return Utils.retInternalServerError("Errore nella creazione directory: " + directory,genericError);
        //        MFLog.LogInFile("check directory ends..", MFLog.logtypes.INFO);

        //        bool isBatch = reader["PS_TIPMOD_FLAG_BATCH"] as bool? ?? false;
        //        //DateTime expirationDate = DateTime.Now.AddDays(-30);
        //        //MFLog.LogInFile("deleting old files starts...", MFLog.logtypes.INFO);
        //        //foreach (string dir in Directory.GetDirectories(Path.Combine(fileGenerator.modelexportdir, documentFillFolder)))
        //        //{
        //        //    if (Directory.GetLastWriteTime(dir) <= expirationDate)
        //        //        Directory.Delete(dir, true);
        //        //}
        //        //MFLog.LogInFile("deleting old files ends...", MFLog.logtypes.INFO);
        //        var conf = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
        //        OutputFilesData OutputFilesData = new OutputFilesData
        //        {
        //            magicDBContext = magicDBContext,
        //            documentFillSession = documentFillSession,
        //            fileGenerator = fileGenerator,
        //            zipName = fileGenerator.GetFileNameForZip(false,true),
        //            directory = directory,
        //            docfiller = docfiller,
        //            templateFile = templateFile,
        //            saveAsPdf = reader["PS_TIPOUT_CODE"].ToString() == "pdf",
        //            dbutils = dbutils,
        //            STORED_RET = reader["PS_TIPMOD_STORED_RET"].ToString(),
        //            createZip = !isBatch,
        //            targetConnection = DBConnectionManager.GetTargetConnection(),
        //            isPublicSite = conf.includePDFOnly,
        //            skipMergeFile = conf.skipMergeFile
        //        };
        //        MFLog.LogInFile("check public site starts..", MFLog.logtypes.INFO);

        //        try
        //        {
        //            if (OutputFilesData.isPublicSite == false)
        //                OutputFilesData.isPublicSite = bool.Parse(formData["isPublic"].ToString());
        //        }
        //        catch (Exception ex) {
        //            Debug.WriteLine(ex.Message);
        //        }
        //        MFLog.LogInFile("check public site ends..", MFLog.logtypes.INFO);

        //        OutputFilesSessionData OutputFilesSessionData = new OutputFilesSessionData {
        //            idUser = SessionHandler.IdUser, //in the separate Thread the session is not available
        //            idUserGroup = SessionHandler.UserVisibilityGroup,
        //            connectionString = DBConnectionManager.GetTargetConnection()
        //        };
        //        bool isMSSQLFileActive = ApplicationSettingsManager.getMSSQLFileTable();

        //        string pdfExtConverter = PDFExternalConverter();
        //        //If the conversion has to be made with an external tool it will alway be async
        //        if (templateFile.Extension == ".pdf")
        //        {
        //            //start #PDFNetService
        //            string applicationKey = ApplicationSettingsManager.GetAppInstanceName();
        //            string args = "create" + " " + documentFillSession.ID.ToString() + " " + applicationKey + " " + SessionHandler.IdUser.ToString() + " " + SessionHandler.UserVisibilityGroup.ToString();

        //            if (OutputFilesData.createZip == true)
        //            {
        //                args += " " + Path.GetFileName(OutputFilesData.zipName);
        //            }

        //            ProcessStartInfo startInfo = new ProcessStartInfo
        //            {
        //                FileName = pdfExtConverter,
        //                Arguments = args,
        //            };
        //            Process.Start(startInfo);
        //        }                 
        //        else if (formData["synch"] == true) //force synch 
        //        {
        //            MFLog.LogInFile("buildOutputFiles starts...", MFLog.logtypes.INFO);
        //            buildOutputFiles(OutputFilesData, OutputFilesSessionData, isMSSQLFileActive, pdfExtConverter);
        //            MFLog.LogInFile("buildOutputFiles ends...", MFLog.logtypes.INFO);
        //        }
        //        else  //internal PDF conversion (if needed 
        //        {
        //            Task task = new Task(() => buildOutputFiles(OutputFilesData, OutputFilesSessionData, isMSSQLFileActive, pdfExtConverter));
        //            task.Start();
        //        }               



        //        int summaryAddendum = (docfiller.getRootBoCount() == 1 ? 1 : 2);//if the item count is 1 i won't produce the summary file

        //        JObject json = new JObject();
        //        json.Add("documentFillSessionId", documentFillSession.ID);

        //        if(templateFile.Extension == ".pdf")
        //        {
        //            object countField = new DatabaseCommandUtils().GetDataSet("select count(*) from [dbo].[Magic_PDFFormSessionInput] where DocumentFillSession_ID = " + documentFillSession.ID, DBConnectionManager.GetTargetConnection()).Tables[0].Rows[0][0];

        //            int fCount = Convert.ToInt32(countField.ToString());
        //            if(OutputFilesData.createZip)
        //            {
        //                fCount++;
        //            }
        //            json.Add("fileCount", fCount);
        //        } else
        //        {
        //            json.Add("fileCount", docfiller.getRootBoCount() + summaryAddendum); //1 for each RootBo + combine + zip
        //        }
        //        json.Add("zipName", Path.GetFileName(OutputFilesData.zipName));

        //        HttpResponseMessage r = new HttpResponseMessage();
        //        r.StatusCode = HttpStatusCode.OK;
        //        if(!isBatch)
        //            r.Content = new StringContent(json.ToString());
        //        return r;
        //    }
        //}

        [HttpGet]
        public HttpResponseMessage GetExportProgress(int documentFillSessionId, int fileCount, string zipName)
        {
            BL.FileGenerator fileGenerator = new BL.FileGenerator();
            string directory = Path.Combine(fileGenerator.modelexportdir, documentFillFolder, documentFillSessionId.ToString());

            if (File.Exists(Path.Combine(directory, "error.txt")))
                return Utils.retInternalServerError(File.ReadAllText(Path.Combine(directory, "error.txt")), genericError);

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
            try
            {
                if (taskID != null && buildTasks.ContainsKey((int)taskID))
                    buildTasks.Remove((int)taskID);
                BL.FileGenerator fileGenerator = new BL.FileGenerator();
                fileGenerator.AddDownloadToResponse(ref result, Path.Combine(fileGenerator.modelexportdir, documentFillFolder, documentFillSessionId.ToString(), zipName), zipName, true);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Errore nel export del file '" + zipName + "': " + ex.Message, MFLog.logtypes.ERROR);
                result = Utils.GetErrorMessageForDownload("Errore nel export del file '" + zipName);
            }
            return result;
        }

        private void buildOutputFiles(OutputFilesData data, OutputFilesSessionData sessionData, bool isMSSQLFileActive, string PDFNetServiceDirectory, CancellationTokenSource cancellationTokenSource = null, ManualResetEventSlim pauseEvent = null, bool pauseAfterFirstFile = false)
        {

            DataSet oReturn = new DataSet();

            data.docfiller.BuildOutputFiles(data.directory, data.documentFillSession, data.magicDBContext, data.dbutils, data.targetConnection, sessionData.idUser, sessionData.idUserGroup, data.saveAsPdf, null, 76, isMSSQLFileActive, data.templateFile, data.skipMergeFile, PDFNetServiceDirectory, cancellationTokenSource, pauseEvent, pauseAfterFirstFile);

            if (cancellationTokenSource != null)
            {
                if (pauseEvent != null)
                    pauseEvent.Wait(cancellationTokenSource.Token);
                try
                {
                    cancellationTokenSource.Token.ThrowIfCancellationRequested();
                } catch (Exception e)
                {
                    File.WriteAllText(Path.Combine(data.directory, "error.txt"), "Wordfill: " + e.Message);
                    return;
                }
            }

            if (!string.IsNullOrEmpty(data.STORED_RET))
            {
                JObject storedData = new JObject();
                storedData.Add("documentFillSessionID", data.documentFillSession.ID);

                oReturn = data.dbutils.GetDataSetFromStoredProcedure(data.STORED_RET, storedData, sessionData.connectionString, null, sessionData.idUser, sessionData.idUserGroup);

                //spsotato per gestire prima il download dello zip e susscessivamente lo spostamento dei file in un altra directoy
                //S.M 31/01/2024

                //Files.HandleLocationWithPath(oReturn, false, sessionData.connectionString,data.directory);
            }

            if (data.createZip)
            {
                ZipFile zip = new ZipFile();
                //Se la richiesta viene da un public site e devo produrre PDF zippo solo i PDF
                if (data.saveAsPdf && data.isPublicSite)
                {
                    string[] files = Directory.GetFiles(data.directory, "*.pdf");
                    zip.AddFiles(files, "");
                }
                else
                    zip.AddDirectory(data.directory);

                zip = data.fileGenerator.CloseAndReleaseZip(zip, Path.Combine(data.directory, data.zipName));
            }

            Files.HandleLocationWithPath(oReturn, false, sessionData.connectionString, data.directory);

            oReturn.Dispose();

            data.documentFillSession.EndDate = DateTime.Now;
            data.magicDBContext.SubmitChanges();
        }

        [HttpPost]
        public HttpResponseMessage MoveFiles(dynamic data)
        {
            var response = new HttpResponseMessage();
            try
            {
                JObject files = data.filesToSave;
                string fileDir = ApplicationSettingsManager.GetRootdirforupload();
                string rootDirForCustomer = ApplicationSettingsManager.GetRootdirforcustomer();
                string connectionString = null;
                try
                {
                    connectionString = MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
                }
                catch (System.Exception e)
                {
                    MFLog.LogInFile("Error retreiving connection string in AddDownloadToResponse to save the delete file log inn db: " + e.Message, MFLog.logtypes.ERROR);
                }

                string applicationName = null;

                try
                {
                    applicationName = ApplicationSettingsManager.GetAppInstanceName();
                }
                catch (System.Exception e)
                {
                    MFLog.LogInFile("Error retreiving applicationName in movefiletopath to save the delete file log inn db: " + e.Message, MFLog.logtypes.ERROR);
                }

                string fileToDir = (string)data.moveTo;

                foreach (JProperty prop in (JToken)files)
                {
                    JToken file = prop.Value;
                    string fileName = (string)file["name"];
                    string destPath = rootDirForCustomer + "\\" + fileToDir;
                    Directory.CreateDirectory(destPath);
                    Files.CopyInTrash(Path.Combine(fileDir, fileName), connectionString, null, Path.Combine(destPath, fileName));
                    File.Move(Path.Combine(fileDir, fileName), Path.Combine(destPath, fileName));
                }

                response.StatusCode = HttpStatusCode.OK;
                response.Content = new StringContent("Files moved to custom folder!");
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("Error while moving files to Rootdirforcustomer: " + ex.Message));
            }
            return response;
        }

        [HttpGet]
        public HttpResponseMessage DownloadChunked(string filename)
        {
            string folderpath = ApplicationSettingsManager.GetRootdirforupload();
            string filepath = Path.Combine(folderpath, filename);
            BL.FileGenerator fileGen = new BL.FileGenerator();
            return fileGen.GetChunkedHttpResponseMessage(filepath, filename);
        }

        [HttpPost]
        public HttpResponseMessage ExportzipforRefTreeSp(dynamic data)
        {
            JArray models = data.models;

            if (models.Count == 0) {
                //verificare come andare per lingua
                HttpResponseMessage resultKo = Utils.retOkMessage("Nessun record selezionato");
                resultKo.StatusCode = HttpStatusCode.NotFound;
                return resultKo;
            }

            HttpResponseMessage result = Utils.retOkMessage("Document list export started");
            try
            {
                var rabbitMQService = new Helpers.RabbitMQService();

                if (!rabbitMQService.IsConnectionAvailable())
                {
                    throw new ApplicationException("Servizio temporaneamente non disponibile. Si prega di riprovare più tardi. Se il problema persiste, contattare l'assistenza tecnica.");
                }

                var dbutils = new DatabaseCommandUtils();
                DataSet filenameds = dbutils.GetDataSetFromStoredProcedure("core.usp_zip_job_event", data);

                if (filenameds.Tables.Count == 0) {
                    throw new ApplicationException("Servizio non trovato. Se il problema persiste, contattare l'assistenza tecnica.");
                }
                
                var oRows = filenameds.Tables[0].AsEnumerable().ToList();

                foreach (DataRow oRow in oRows)
                {

                    // Get current user ID
                    int userId = (Int32)oRow["userId"];
                    int referenceId = (Int32)oRow["referenceId"];                    
                    string additionalData = oRow["additionalData"].ToString();
                    
                    // Create a reference object for this document list
                    string referenceType = ReferenceTypes.DOCUMENT_LIST;

                    // Try to delete any existing job from RabbitMQ directly
                    string deletedJobId = rabbitMQService.DeleteJobFromQueue(userId, referenceId, referenceType);

                    // Check if there are any processing jobs for this user and reference
                    if (FileGenerator.HasProcessingZipJobs(referenceId, userId, new DatabaseCommandUtils(), referenceType))
                    {
                        // Return a response indicating that a job is already being processed
                        result = Utils.retOkMessage("Un documento è già in fase di elaborazione. Si prega di attendere il completamento dell'operazione corrente.");

                        // Add the fileDownload cookie (this was already there)
                        var cookie = new CookieHeaderValue("fileDownload", "true");
                        cookie.Path = "/";
                        cookie.Expires = DateTimeOffset.Now.AddMinutes(1);

                        // Add a new status cookie to indicate job is already processing
                        var statusCookie = new CookieHeaderValue("fileDownloadJobStatus", "alreadyProcessing");
                        statusCookie.Path = "/";
                        statusCookie.Expires = DateTimeOffset.Now.AddMinutes(1);

                        // Add both cookies to the response
                        result.Headers.AddCookies(new[] { cookie, statusCookie });

                        return result;
                    }
 
                    // Init the file generator
                    BL.FileGenerator fg = new BL.FileGenerator(true, DBConnectionManager.GetTargetConnection());
                    string filename = fg.GetFileNameForZip(true);
                    string fname = fg.GetFileNameForZip(false);
                     
                    JArray outfiles = new JArray();
                    Dictionary<int, List<string>> documentFiles = new Dictionary<int, List<string>>();
                    List<string> filesToZip = new List<string>();
                    Dictionary<string, string> pathMapping = new Dictionary<string, string>();
                    Dictionary<string, string> watermarkedFiles = new Dictionary<string, string>();
                    
                    filesToZip = JObject.Parse(oRow["filesToZip"].ToString())["files"].ToObject<List<string>>();
                    pathMapping = JsonConvert.DeserializeObject<Dictionary<string, string>>(oRow["pathMapping"].ToString());
                     
                    foreach (string f in filesToZip) {
                        outfiles.Add(f);
                    }
                     
                    //decidere se aggiungere excel
                    Boolean excel = false;
                    if (excel) { 
                    
                    // Create Excel file for document list
                    string excelname = fg.GetFileNameForExcel();
                    FileInfo path = new FileInfo(excelname);
                    ExcelPackage package = new ExcelPackage(path);

                    //package = fg.AddDocumentToExcelList(package, d.DO_DOCUME_ID, d.OBJECT_ID, null);
                    //if (!documentFiles.ContainsKey(d.DO_DOCUME_ID))
                    //    documentFiles.Add(d.DO_DOCUME_ID, new List<string>());
                    //documentFiles[d.DO_DOCUME_ID] = BL.FileGenerator.getFileNamesFromOutFiles(outFilesOfThisDoc);

                    try
                    {
                        package.Save();
                    }
                    catch (Exception ex)
                    {
                        string error = "Error saving Excel: " + ex.Message;
                        if (ex.InnerException != null)
                            error += " " + ex.InnerException;
                        throw new System.ArgumentException(error);
                    }

                    //Add Excel file to zip queue
                    filesToZip.Add(excelname);
                    pathMapping.Add(excelname, Path.GetFileName(excelname));

                    }


                    // Generate a new job ID
                    Guid jobId = Guid.NewGuid();

                    // Set up callback URL
                    string authority = HttpContext.Current.Request.Url.Authority;
                    string scheme = HttpContext.Current.Request.Url.Scheme;
                    string callbackUrl = $"{scheme}://{authority}/api/Documentale/ZipCallback";
                    string applicationName = ApplicationSettingsManager.GetAppInstanceName() ?? "/";

                    // Create the message for RabbitMQ
                    var zipMessage = new BL.FileGenerator.ZipMessage
                    {
                        files = filesToZip,
                        path_mapping = pathMapping,
                        watermarked_files = watermarkedFiles,
                        destination = filename,
                        job_id = jobId.ToString(),
                        callback_endpoint = callbackUrl,
                        application_name = applicationName,
                        user_id = userId,
                        reference_type = referenceType,
                        reference_id = referenceId,
                        additionalData = additionalData
                    };

                    // Serialize the message to JSON
                    string messageJson = JsonConvert.SerializeObject(zipMessage);

                    // Track the job in the database
                    FileGenerator.TrackZipJob(referenceId, filename, userId, jobId, messageJson, referenceType);

                    // If we had a job that we deleted from RabbitMQ, mark it as overwritten now
                    if (deletedJobId != null)
                    {
                        MFLog.LogInFile($"Marking previously deleted job {deletedJobId} as overwritten by new job {jobId}", MFLog.logtypes.INFO);
                        FileGenerator.MarkJobAsOverwritten(deletedJobId, jobId.ToString());
                    }

                    // Send message to RabbitMQ
                    rabbitMQService.SendMessage(zipMessage);

                    var responseObj = new { message = $"Il processo di download documentale con job ID: {jobId} è stato attivato. Via email saranno notificati i riferimenti per il download." };
                    //var responseObj = new { message = $"Document list processing started with job ID: {jobId}. You will be notified when the file is ready for download." }; 
                    result = Request.CreateResponse(HttpStatusCode.OK, responseObj);

                    // Add cookies for the jQuery plugin
                    var jobCookie = new CookieHeaderValue("fileDownload", "true");
                    jobCookie.Path = "/";
                    jobCookie.Expires = DateTimeOffset.Now.AddMinutes(1);
                    var jobTypeCookie = new CookieHeaderValue("fileDownloadJobType", "rabbitmq");
                    jobTypeCookie.Path = "/";
                    jobTypeCookie.Expires = DateTimeOffset.Now.AddMinutes(1);

                    result.Headers.AddCookies(new[] { jobCookie, jobTypeCookie });

                    // Add the job ID as a header
                    result.Headers.Add("X-JobId", jobId.ToString());

                    // Track file operation if needed
                    bool trackOperation = ApplicationSettingsManager.trackFiles();
                    if (trackOperation && outfiles.Count > 0)
                    {
                        JObject fileInfo = new JObject();
                        fileInfo["files"] = outfiles;
                        fileInfo["jobId"] = jobId;
                        MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("download_request", fileInfo);
                    }
                }
            }
            catch (ApplicationException ex)
            {
                // RabbitMQ connection issues or other application-specific errors
                MFLog.LogInFile("Application error in ExportzipforDocumentList: " + ex.Message, MFLog.logtypes.ERROR);
                result = MagicFramework.Helpers.Utils.retInternalServerError("Service unavailable: " + ex.Message);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Error in ExportzipforDocumentList: " + ex.Message, MFLog.logtypes.ERROR);
                result = MagicFramework.Helpers.Utils.retInternalServerError(ex.Message);
            }


            return result;
        }

        private class BuildTask
        {
            public int userID { get; set; }
            public System.Threading.Tasks.Task task { get; set; }
            public System.Threading.CancellationTokenSource cancellationTokenSource { get; set; }
            public System.Threading.ManualResetEventSlim pauseEvent { get; set; }

        }
    }

    public class GridIds
    {
        public int id { get; set; }
    }
    public class GenericZipRequest
    {
        public string gridname { get; set; }
        public GridIds[] ids { get; set; }
        public string zipSP { get; set; }
    }

    public class OutputFilesData
    {
        public MagicFramework.Data.MagicDBDataContext magicDBContext { get; set; }
        public MagicFramework.Data.Magic_DocumentFillSessions documentFillSession { get; set; }
        public BL.FileGenerator fileGenerator { get; set; }
        public string zipName { get; set; }
        public string directory { get; set; }
        public WordDocumentFiller docfiller { get; set; }
        public FileInfo templateFile { get; set; }
        public DatabaseCommandUtils dbutils { get; set; }
        public string STORED_RET { get; set; }
        public bool saveAsPdf { get; set; }
		public bool showPreview { get; set; }
		public bool createZip { get; set; }
        public string targetConnection { get; set; }
        public bool isPublicSite { get; set; }
        public bool skipMergeFile { get; set; }
    }
    public class OutputFilesSessionData
    {
        public int idUser { get; set; }
        public int idUserGroup { get; set; }
        public string connectionString { get; set; }
    }

    public class assets_return_values
    {
        public int AS_ASSET_ID { get; set; }
        public string AS_ASSET_CODE { get; set; }
        public string AS_ASSET_DESCRIZIONE { get; set; }
        public string DESCR_FOR_SEARCH { get; set; }
    }


}
using MagicFramework.Controllers.ActionFilters;
using MagicFramework.Helpers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Linq.Dynamic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Web;
using System.Web.Configuration;
using System.Web.Http;
using Winista.Mime;
using Winista.MimeDetect;

namespace MagicFramework.Controllers
{
    public class MAGIC_SAVEFILEController : ApiController
    {

        public static Func<FileInfo, string, string, FileInfo> CustomFileUpload { get; set; } = null;
        public static Func<string, string, string, FileInfo> CustomFileDownload { get; set; } = null;
        // gets called when the client indicates that a file is referenced in another dataset
        public static Func<FileReferences, string, string, HttpStatusCode> CustomOnFileReference { get; set; } = null;

   
        #region security
        public static List<string> getAllowedExtensions()
        {
            List<string> allowedExtensionsList = new List<string>();
            //Bug #6482 -  security issue, uploadable extensions MUST be limited and checked at back end side. No session in this async call therefore it's using Web.config 
            string allowedExtensions = ConfigurationManager.AppSettings["allowedExtensionsForFileUpload"];
            if (!String.IsNullOrEmpty(allowedExtensions))
                allowedExtensionsList = allowedExtensions.Split(',').ToList();

            return allowedExtensionsList;
        }

        public static bool isExtensionAllowed(List<string> allowedExtensionsList, string fileName)
        {
            //if a list of allowed extensions has been configured for security purposes i test the current file extension against it 
            if (allowedExtensionsList.Count > 0)
            {
                if (!allowedExtensionsList.Contains(Path.GetExtension(fileName), StringComparer.OrdinalIgnoreCase))
                    return false;
            }
            return true;
        }

        public static void checkMimeTypeFromByteCode(string filePath, string fileName, string connectionString = null)
        {
            MimeTypes mimeTypes = new MimeTypes();
            MimeType mimeType = mimeTypes.GetMimeTypeFromFile(filePath);
            compareMimeTypes(mimeType, fileName, connectionString);
        }

        public static void checkMimeTypeFromByteCode(byte[] bytes, string fileName, string connectionString = null)
        {
            MimeTypes mimeTypes = new MimeTypes();
            MimeType mimeType = mimeTypes.GetMimeType(bytes);
            compareMimeTypes(mimeType, fileName, connectionString);
        }

        private static void compareMimeTypes(MimeType mimeType, string fileName, string connectionString)
        {
            string[] zipMimeTypes = { ".zip", ".xlsx", ".docx", ".pdf" };
            if (
                mimeType.Name != MimeMapping.GetMimeMapping(fileName) &&
                (mimeType.Name != "application/zip" || !zipMimeTypes.Any(ext => Path.GetExtension(fileName).ToLower().Equals(ext)))
            )
            {
                bool isAllowed = false;

                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    connection.Open();

                    using (SqlCommand command = new SqlCommand("dbo.Magic_CheckOrInsertMimeTypePair", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;

                        command.Parameters.Add("@DetectedMimeType", SqlDbType.NVarChar).Value = mimeType.Name;
                        command.Parameters.Add("@FileExtension", SqlDbType.NVarChar).Value = Path.GetExtension(fileName).ToLower();

                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                isAllowed = Convert.ToBoolean(reader["IsActive"]);
                            }
                        }
                    }
                }

                if (!isAllowed)
                {
                    throw new ArgumentException("Wrong extension");
                }
            }
        }
        /// <summary>
        /// Checks for security issues the local folders if the path is local. If it' s not local it checks that the path includes rootDirForUpload or rootDirForCustomer
        /// </summary>
        /// <param name="filePath">the requested file path</param>
        /// <returns>true if the access is allowed, false otherwise</returns>
        private static bool canGetFile(string filePath)
        {
            //Get file can access the content of these local folders by default. To access other local folders the whitelist must be extended via config file  (application  Instance)  
            List<string> localFoldersWhiteList = new List<string>(new[]
            {
                 @"Views\AccountImages\"
                ,@"Views\Images\"
                ,@"documents\"
                ,@"TemporaryFiles\"
            });

            bool canget = false;
            //if it's a local path i restrict browsable directories to the whitelist 
            string dirOfPath = Path.GetDirectoryName(filePath) + @"\";
            //it's a local file...
            List<string> configuredFoldersWhitelist = ApplicationSettingsManager.getLocalFoldersWhiteList();
            string localFolder = HttpContext.Current.Server.MapPath("~");
            if (dirOfPath.StartsWith(localFolder, true, null))
            {
                //deny access to the root of the application to the GetFile method... they could read web.config for example
                if (dirOfPath.Length == localFolder.Length)
                    canget = false;
                else
                {
                    string relativePath = dirOfPath.Substring(HttpContext.Current.Server.MapPath("~").Length);
                    if (localFoldersWhiteList.Concat(configuredFoldersWhitelist).Contains(relativePath, StringComparer.OrdinalIgnoreCase))
                        canget = true;
                }
            }
            else
            {
                //not a local file...in this case the path should have as root one of the configurable values (<Rootdirforupload>,<Rootdirforcustomer>) or be whitelisted in <PublicFoldersWhiteList>
                string rootDirForUpload = ApplicationSettingsManager.GetRootdirforupload();
                string rootDirForCustomer = ApplicationSettingsManager.GetRootdirforcustomer();
                List<string> publicFoldersWhiteList = ApplicationSettingsManager.getPublicFoldersWhiteList();
                if (String.IsNullOrEmpty(rootDirForCustomer))
                    rootDirForCustomer = rootDirForUpload;
                string p = sanitizePath(@filePath);
                rootDirForUpload = sanitizePath(@rootDirForUpload);
                rootDirForCustomer = sanitizePath(rootDirForCustomer);
                if (p.StartsWith(rootDirForUpload, true, null) || p.StartsWith(rootDirForCustomer, true, null))
                {
                    canget = true;
                }
                else
                {
                    foreach (string dirPath in publicFoldersWhiteList)
                    {
                        if (p.StartsWith(sanitizePath(dirPath), true, null))
                            canget = true;
                    }
                }
            }

            return canget;
        }
        #endregion
        [HttpPost]
        public string PostUploadTimeStamp(dynamic data)
        {
            if (HttpContext.Current.Session["nextprefixforfileupload"] != null)
            {
                return HttpContext.Current.Session["nextprefixforfileupload"].ToString();
            }
            else
            {
                return "";
            }
        }


        [HttpPost]
        public HttpResponseMessage PostFileUploadParametersInSession(dynamic data)
        {
            var response = new HttpResponseMessage();

            HttpContext.Current.Session["nextprefixforfileupload"] = DateTime.UtcNow.Ticks.ToString();
            if (data.path != null)
            {
                HttpContext.Current.Session["uploadpath"] = data.path.ToString();
            }
            else
            {
                HttpContext.Current.Session["uploadpath"] = "";
            }

            response.StatusCode = HttpStatusCode.OK;

            return response;

        }

        public HttpResponseMessage upload(HttpPostedFileBase file)
        {
            var response = new HttpResponseMessage();
            // Code to save in DB

            // Return an empty string to signify success
            response.StatusCode = HttpStatusCode.OK;
            return response;
        }

        private JObject HandleCustomUploadFile(string fileName, Stream fileStream, string domainURL, string applicationInstanceID)
        {
            FileInfo uploadInfo = CustomFileUpload(new FileInfo
            {
                Filename = fileName,
                Filestream = fileStream,
            }, domainURL, applicationInstanceID);
            return new JObject
            {
                ["name"] = uploadInfo.Filename,
                ["tmpFile"] = uploadInfo.Id,
                ["id"] = uploadInfo.Id,
            };
        }

        private async Task<JArray> HandleCustomUpload(JArray fileInfos, string domainURL, string applicationInstanceID)
        {
            if (Request.Content.IsMimeMultipartContent("form-data"))
            {
                var provider = await Request.Content.ReadAsMultipartAsync();

                foreach (var httpContent in provider.Contents)
                {
                    var fileName = httpContent.Headers.ContentDisposition.FileName;
                    if (string.IsNullOrWhiteSpace(fileName))
                    {
                        continue;
                    }
                    using (Stream fileContents = await httpContent.ReadAsStreamAsync())
                    {
                        fileInfos.Add(HandleCustomUploadFile(fileName.Replace("\"", ""), fileContents, domainURL, applicationInstanceID));
                    }
                }
            }
            else
            {
                var fileStream = await Request.Content.ReadAsStreamAsync();
                fileInfos.Add(HandleCustomUploadFile(Request.Headers.GetValues("File-Name").First(), fileStream, domainURL, applicationInstanceID));
            }
            return fileInfos;
        }

        /// <summary>
        /// opera l' upload di un file considerando come root quella dell' applicazione IIS 
        /// </summary>
        /// <returns></returns>
        [HttpPost]
        public async Task<HttpResponseMessage> SaveApplication()
        {
            JArray fileInfos = new JArray();
            try
            {
                string connectionString = MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
                if (CustomFileUpload != null)
                {
                    fileInfos = await HandleCustomUpload(fileInfos, SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
                    return Request.CreateResponse(HttpStatusCode.OK, fileInfos.ToString(), "application/json");
                }

                string tmpPath = HttpContext.Current.Server.MapPath("~") + "/TemporaryFiles/";
                if (!Directory.Exists(tmpPath))
                {
                    Directory.CreateDirectory(tmpPath);
                }

                List<string> allowedExtensionsList = getAllowedExtensions();

                if (Request.Content.IsMimeMultipartContent("form-data"))
                {
                    var provider = new MultipartFormDataStreamProvider(tmpPath);

                    // Read the form data.
                    //VS2012: await Request.Content.ReadAsMultipartAsync(provider);
                    await Request.Content.ReadAsMultipartAsync(provider);

                    JObject fileNames = JObject.Parse(provider.FormData.Get("fileNames"));
                    Regex reg = new Regex(@"(BodyPart_[0-9a-z\-]+)$");

                    //Bug #6482 -  security issue, uploadable extensions MUST be limited and checked at back end side. No session in this async call therefore it's using Web.config 

                    // This illustrates how to get the file names.
                    foreach (MultipartFileData file in provider.FileData)
                    {
                        JObject fileInfo = new JObject();
                        string fileName = (string)fileNames.GetValue(file.Headers.ContentDisposition.FileName.Replace(@"""", ""));
                        fileInfo["name"] = fileName;
                        //if a list of allowed extensions has been configured for security purposes i test the current file extension against it 
                        if (!isExtensionAllowed(allowedExtensionsList, fileName))
                            throw new ArgumentException("Extension forbidden");

                        if(!ConfigurationManager.AppSettings["disableMimeTypeControl"].Equals("true"))
                            checkMimeTypeFromByteCode(file.LocalFileName, fileName, connectionString);
                        string tempFilename = reg.Match(file.LocalFileName).Groups[1].Value + Path.GetExtension(fileName);
                        string tempFilePath = $"{Path.Combine(tmpPath, tempFilename)}";
                        fileInfo["tmpFile"] = tempFilename;
                        string currentPath = Path.Combine(tmpPath, reg.Match(file.LocalFileName).Groups[1].Value);

                        long length = new System.IO.FileInfo(currentPath).Length;

                        if (length == 0) {
                            throw new ArgumentException("File length 0");
                        }


                        Files.Register(fileName, currentPath, tempFilePath, null, connectionString);
                        fileInfos.Add(fileInfo);
                    }

                    return Request.CreateResponse(HttpStatusCode.OK, fileInfos.ToString(), "application/json");
                }
                else
                {
                    string extension = Path.GetFileName(Request.Headers.GetValues("File-Name").First());
                    string fileName = "BodyPart_" + Guid.NewGuid() + extension;
                    if (!isExtensionAllowed(allowedExtensionsList, fileName))
                        throw new ArgumentException("Extension forbidden");
                    byte[] bytes = await Request.Content.ReadAsByteArrayAsync();
                    if(!ConfigurationManager.AppSettings["disableMimeTypeControl"].Equals("true"))
                        checkMimeTypeFromByteCode(bytes, Request.Headers.GetValues("File-Name").First(), connectionString);
                    string currentPath = Path.Combine(tmpPath, fileName);
                    File.WriteAllBytes(currentPath, bytes);
                    Files.Register(fileName, currentPath, null, null, connectionString);

                    JObject fileInfo = new JObject();
                    fileInfo["name"] = Request.Headers.GetValues("File-Name").First();
                    fileInfo["tmpFile"] = fileName;
                    fileInfos.Add(fileInfo);

                    return Request.CreateResponse(HttpStatusCode.OK, fileInfos.ToString(), "application/json");
                }
            }
            catch (System.Exception e)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, e);
            }
        }

        [HttpGet]
        public HttpResponseMessage RemoveApplication()
        {
            return Request.CreateResponse(HttpStatusCode.OK);
        }

        public static bool deleteFilesOfRow(dynamic data)
        {
            try
            {
                JArray filesToDelete = new JArray();
                foreach (var field in data.cfgModel.fields.Children())
                {
                    if ((field.Value.dataRole == "applicationupload" || field.Value.dataRole == "adminareaupload") && !string.IsNullOrEmpty(data[field.Name].Value))
                    {
                        Match match = new Regex(@"^\[{").Match(data[field.Name].Value);
                        if (match.Success)
                        {
                            JArray files = JArray.Parse(@data[field.Name].Value);
                            foreach (var file in files.Children())
                            {
                                JObject fileToDelete = new JObject();
                                fileToDelete.Add("savePath", field.Value.savePath);
                                fileToDelete.Add("name", file["name"]);
                                filesToDelete.Add(fileToDelete);
                            }
                        }
                        else
                        {
                            JObject fileToDelete = new JObject();
                            if (field.Value.dataRole == "adminareaupload")
                            {
                                fileToDelete.Add("adminAreaUpload", true);
                            }

                            fileToDelete.Add("savePath", field.Value.savePath);
                            fileToDelete.Add("name", data[field.Name].Value);
                            filesToDelete.Add(fileToDelete);
                        }

                    }
                }

                if (filesToDelete.Count > 0)
                {
                    JObject requestParams = new JObject();
                    requestParams.Add("filesToSave", new JArray());
                    requestParams.Add("filesToDelete", filesToDelete);
                    return StaticManageUploadedFiles(requestParams);
                }

                return true;
            }
            catch (System.Exception e)
            {
                MFLog.LogInFile("deleteFilesOfRow in MAGIC_SAVEFILEController with error: " + e.Message, MFLog.logtypes.ERROR);
                return false;
            }
        }

        private static void CheckPathForForbiddenSymbols(string path)
        {
            if (path.Contains(".."))
            {
                throw new Exception("Path cannot contain ..");
            }
        }
        private static void CheckFileForForbiddenSymbols(string path)
        {
            if (Path.GetFileName(path).StartsWith(".."))
            {
                throw new Exception("file cannot start with ..");
            }
        }

        /// <summary>
        /// Moves the uploaded files in the destination dirs: if the data role is "applicationupload" the file is moved in Rootdirforupload (from config) + column path 
        /// --> if column path is not defined the MagicFileTypeUpload proper field will be used (ApplicationSavePath) for the given extension
        /// if the data role is adminareaupload the file is moved into the application directory + column path
        /// --> if column path is not defined the MagicFileTypeUpload proper field (AdminAreaSavePath) will be used for the given extension
        /// path is added if present (otherwise the file will be put in the application root) 
        /// </summary>
        /// <param name="data">file definition as a JSON</param>
        /// <returns>false if errors occured</returns>
        public static bool StaticManageUploadedFiles(dynamic data)
        {
            try
            {
                JObject fileInfo = new JObject();
                JArray files;
                bool trackOperation = ApplicationSettingsManager.trackFiles();
                string root = HttpContext.Current.Server.MapPath("~");
                string tmpPath = root + "/TemporaryFiles/";
                DateTime expirationDate = DateTime.Now.AddDays(-10);
                DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                string connectionString = null;

                try
                {
                    connectionString = MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
                }
                catch (System.Exception e)
                {
                    MFLog.LogInFile("Error retreiving connection string in StaticManageUploadedFiles to save the delete file log inn db: " + e.Message, MFLog.logtypes.ERROR);
                }
                string applicationName = null;

                try
                {
                    applicationName = ApplicationSettingsManager.GetAppInstanceName();
                }
                catch (System.Exception e)
                {
                    MFLog.LogInFile("Error retreiving applicationName in StaticManageUploadedFiles to save the delete file log inn db: " + e.Message, MFLog.logtypes.ERROR);
                }
                //move temporary saved files to destination path
                files = new JArray();
                //Bug #6482 -  security issue, uploadable extensions MUST be limited and checked at back end side. No session in this async call therefore it's using Web.config 
                List<string> allowedExtensionsList = getAllowedExtensions();

                foreach (var file in data.filesToSave.Children())
                {
                    bool isSqlServerFile = false;
                    string fileDir = GetFileDestinationDir(file.savePath.ToString(), file.name.ToString(), out isSqlServerFile, file.adminAreaUpload == null ? false : file.adminAreaUpload.Value);
                    string fileName = file.name;
                    string filePath = fileDir + "\\" + fileName;
                    string tempFileName = Path.GetFileName((string)file.tmpFile);
                    if (!tempFileName.StartsWith("BodyPart_"))
                    {
                        throw new Exception("Access denied, trying to move non temporary file");
                    }
                    //if a list of allowed extensions has been configured for security purposes i test the current file extension against it 
                    if (!isExtensionAllowed(allowedExtensionsList, fileName))
                        throw new ArgumentException("Extension forbidden");

                    try
                    {
                        if (!isSqlServerFile)
                        {
                            if (!canGetFile(filePath))
                                throw new System.ArgumentException("Access to resource denied");

                            if (File.Exists(filePath))
                            {
                                Files.CopyInTrash(filePath, connectionString, applicationName);
                                 
                                File.Delete(filePath);
                            }

                            if (!Directory.Exists(fileDir))
                            {
                                Directory.CreateDirectory(fileDir);
                            }

                            string currentFilePath = tmpPath + tempFileName;
                            Files.Register(fileName, currentFilePath, filePath);
                            files.Add(sanitizePath(filePath));
                        }
                        else
                        {
                            using (FileStream stream = new FileStream(tmpPath + tempFileName, FileMode.Open))
                            {
                                SaveFileInDBTable(stream, filePath);
                            }
                            File.Delete(tmpPath + tempFileName);
                        }
                    }
                    catch (Exception e)
                    {
                        MFLog.LogInFile("StaticManageUploadedFiles in MAGIC_SAVEFILEController with error: " + e.Message, MFLog.logtypes.ERROR);
                        if (trackOperation)
                        {
                            fileInfo["files"] = new JArray { sanitizePath(filePath) };
                            fileInfo["errorMessage"] = e.Message;
                            trackFileOperation("uploadError", fileInfo);
                        }
                        return false;
                    }
                }

                if (trackOperation && files.Count > 0)
                {
                    fileInfo["files"] = files;
                    trackFileOperation("upload", fileInfo);
                }

                //delete deleted files in destination path
                bool enablePermissionCheck = ConfigurationManager.AppSettings["enablePermissionCheckForFileDeletion"] == "true";
                Uri referrerUri = HttpContext.Current.Request.UrlReferrer;
                // Check if the Referrer is not null
                string referrerUrl = referrerUri != null ? referrerUri.ToString() : string.Empty;
                files = new JArray();
                JArray errorFiles = new JArray();
                foreach (var file in data.filesToDelete.Children())
                {
                    bool isSqlServerFile = false;
                    string filePath = GetFileDestinationDir(file.savePath.ToString(), file.name.ToString(), out isSqlServerFile, file.adminAreaUpload == null ? false : file.adminAreaUpload.Value) + "\\" + file.name;

                    if (enablePermissionCheck && !CheckPermissionForFileDeletion(data, file, dbutils))
                    {
                        errorFiles.Add(sanitizePath(filePath));
                        continue; // Skip deletion if no permission
                    }

                    if (!isSqlServerFile)
                    {
                        Files.File f = Files.DeleteByName(file.name.ToString(), connectionString, applicationName);
                        if (f != null)
                        {
                            files.Add(sanitizePath(f.Path));
                        }
                        else if (trackOperation)
                        {
                            errorFiles.Add(sanitizePath(filePath));
                        }
                    }
                    else
                    {
                        DeleteFileFromDBTable(filePath);
                    }
                }

                if (trackOperation)
                {
                    if (files.Count > 0)
                    {
                        fileInfo["files"] = files;
                        trackFileOperation("delete", fileInfo);
                    }
                    if (errorFiles.Count > 0)
                    {
                        fileInfo["files"] = errorFiles;
                        trackFileOperation("deleteError", fileInfo);
                    }
                }

                //delete +10days old temporary files -> clean temporary folder
                foreach (var path in Directory.EnumerateFiles(tmpPath, "BodyPart_*"))
                {
                    if (File.GetLastWriteTime(path) <= expirationDate)
                    {
                        string fileName = Path.GetFileName(path);
                        Files.DeleteByName(fileName, connectionString, applicationName);
                    }
                }

                return true;
            }
            catch (System.Exception e)
            {
                MFLog.LogInFile("StaticManageUploadedFiles in MAGIC_SAVEFILEController with error: " + e.Message, MFLog.logtypes.ERROR);
                return false;
            }
        }


        private static bool CheckPermissionForFileDeletion(dynamic data, dynamic file, DatabaseCommandUtils dbutils = null)
        {
            if (dbutils == null)
            {
                dbutils = new DatabaseCommandUtils();
            }

            // Prepare the data to pass to the stored procedure
            string gridcode = data.gridcode != null ? data.gridcode.ToString() : string.Empty;
            var dataToPass = new
            {
                FileName = file.name.ToString(),
                RequestPath = data.referrerUrl, // Include the path
                GridCode = gridcode, // Include the gridcode

            };

            // Call the stored procedure and get the result
            DataSet resultDataSet = dbutils.GetDataSetFromStoredProcedure(
                "Magic_CheckFileDeletionPermission",
                dataToPass,
                dbutils.connection
            );

            // Interpret the result
            if (resultDataSet != null && resultDataSet.Tables.Count > 0 && resultDataSet.Tables[0].Rows.Count > 0)
            {
                var result = resultDataSet.Tables[0].Rows[0][0];
                return result != null && result.ToString() == "1";
            }
            return false;
        }

        public static string GetFileDestinationDir(string dir, string fileName, out bool isSqlServerFile, bool isAdminAreaUpload)
        {
            CheckPathForForbiddenSymbols(dir);
            CheckFileForForbiddenSymbols(fileName);

            // support removed this is always false
            isSqlServerFile = false;

            string fileTypeSpecificPath = getDestinationFileDir(dir, fileName, isAdminAreaUpload);
            if (fileTypeSpecificPath != null)
            {
                dir = fileTypeSpecificPath;
            }

            string rootDir = ApplicationSettingsManager.GetRootdirforupload();
            if (rootDir == null || isAdminAreaUpload)
            {
                rootDir = HttpContext.Current.Server.MapPath("~");
            }

            if (IsAbsolutePath(dir))
            {
                if (!canGetFile(dir))
                {
                    throw new Exception("handed in path not allowed (canGetFile)");
                }
            }
            else
            {
                dir = rootDir + "\\" + dir;
            }

            return dir;
        }
        /// <summary>
        /// Checks if the path has to be considered as absolute and must not be altered
        /// </summary>
        /// <param name="path"></param>
        /// <returns>true if the path is of type c:\folder\..  or \\networkfolder\...</returns>
        public static bool IsAbsolutePath(string path)
        {
            // return new Regex(@"^[A-Za-z]{1}:").Match(path).Success;
            //D.t: modified regex in order to consider as absolute the network paths e.g \\mynetworkplace\folder\something... or \\192.168.2.100\mything
            return new Regex(@"^[A-Za-z]{1}:|^[\\]{2}(\w)").Match(path).Success;
        }

        public static void SaveFileInDBTable(Stream stream, string filePath, DatabaseCommandUtils dbutils = null, int? userID = null, int? userGroupID = null)
        {
            if (dbutils == null)
            {
                dbutils = new DatabaseCommandUtils();
            }

            using (System.Data.SqlClient.SqlConnection connection = new System.Data.SqlClient.SqlConnection(dbutils.connection))
            {
                connection.Open();
                System.Data.SqlClient.SqlCommand cmd = null;
                string fileDir = SanitizeDirectory(Path.GetDirectoryName(filePath));

                if (String.IsNullOrEmpty(fileDir))
                {
                    cmd = new System.Data.SqlClient.SqlCommand("INSERT INTO dbo.Magic_DocumentStore(name, file_stream) VALUES(@param1, @param2)", connection);
                }
                else
                {
                    string path_locator = dbutils.GetDataSetFromStoredProcedure(
                        "dbo.GetNewPathLocator",
                        new { path = fileDir },
                        dbutils.connection,
                        null,
                        userID,
                        userGroupID
                    ).Tables[0].Rows[0][0].ToString();

                    cmd = new System.Data.SqlClient.SqlCommand("INSERT INTO dbo.Magic_DocumentStore(name, file_stream, path_locator) VALUES(@param1, @param2, '" + path_locator + "')", connection);
                }

                cmd.Parameters.Add("@param1", SqlDbType.NVarChar, 255).Value = Path.GetFileName(filePath);
                cmd.Parameters.Add("@param2", SqlDbType.VarBinary).Value = stream;
                cmd.CommandType = CommandType.Text;
                cmd.ExecuteNonQuery();
            }
        }

        public static byte[] GetFileBytesFromDBTable(string filePath, string connectionString = null)
        {
            filePath = SanitizeDirectory(filePath);
            string readquery = String.Format("SELECT file_stream FROM {0} WHERE file_stream.GetFileNamespacePath(1) = FileTableRootPath('{0}') + '\\{1}'", "dbo.Magic_DocumentStore", filePath);

            var query = new MagicFramework.Helpers.Sql.DBQuery(readquery);
            query.connectionString = connectionString ?? DBConnectionManager.GetTargetConnection();
            DataTable result = query.Execute();
            if (result != null)
            {
                return (byte[])result.Rows[0]["file_stream"];
            }

            return null;
        }

        public static void DeleteFileFromDBTable(string filePath)
        {
            filePath = SanitizeDirectory(filePath);
            new DatabaseCommandUtils().GetDataSet(String.Format("DELETE FROM {0} WHERE file_stream.GetFileNamespacePath(1) = FileTableRootPath('{0}') + '\\{1}'", "dbo.Magic_DocumentStore", filePath), DBConnectionManager.GetTargetConnection());
        }

        public static string SanitizeDirectory(string dir)
        {
            char[] charsToTrim = { '\\' };
            return Regex.Replace(dir.Replace(@"/", "\\"), @"\\{1,}", "\\").Trim(charsToTrim);
        }

        [HttpPost]
        public HttpResponseMessage ManageUploadedFiles(dynamic data)
        {
            if (CustomOnFileReference != null)
            {
                return new HttpResponseMessage() { StatusCode = CustomOnFileReference(((JObject)data).ToObject<FileReferences>(), SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId) };
            }

            if (StaticManageUploadedFiles(data))
            {
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            else
            {
                return new HttpResponseMessage() { StatusCode = HttpStatusCode.InternalServerError };
            }
        }

        [HttpPost]
        public string CreateCopyUploadedFile(dynamic data)
        {
            bool isSqlServerFile = false;
            string fileDir = GetFileDestinationDir(data.savePath.ToString(), data.fileName.ToString(), out isSqlServerFile, false);
            string fileName = fileDir + data.fileName.ToString();
            HttpResponseMessage res = new HttpResponseMessage();

            if (File.Exists(fileName))
            {
                string fileNameCompressed = fileDir + "compressed_" + data.fileName.ToString();
                byte[] compressedImage = CompressImage.Compress(File.ReadAllBytes(fileName));
                File.WriteAllBytes(fileNameCompressed, compressedImage);

                if (File.Exists(fileNameCompressed))
                {
                    return fileNameCompressed;
                }
                else
                {
                    return string.Empty;
                }
            }

            return string.Empty;
        }

        private readonly Regex F2_UID = new Regex(@"F2_FILE_(?<uid>[0-9]{16}_[A-z0-9]{10})");
        private HttpWebResponse F2HandleFile(string relativeFilePath)
        {
            if (relativeFilePath.Contains(F2.F2_FILE_PREFIX))
            {
                string uid = F2_UID.Match(relativeFilePath).Groups["uid"].Value.Replace("_", "-");
                var response = F2.CallAPI($"/api/files/{uid}");
                return response;
            }
            return null;
        }

        /// <summary>
        /// Gets a file from the file system directly or from Sql server fileTables if the option is enabled and AdminAreaUpload is false
        /// </summary>
        /// <param name="path">The path or the streamid in case of SqlServer FileTable</param>
        /// <param name="adminAreaUpload">True if the datarole used to upload is the adminareaupload</param>
        /// <returns>the file content as HttpResponseMessage</returns>
        [HttpGet]
        [RateLimitUserSession(MaxRequest = 60, PerSeconds = 60)]
        public HttpResponseMessage GetFile(string path, bool adminAreaUpload = false)
        {
            if (CustomFileDownload != null)
            {
                FileInfo fileInfo = CustomFileDownload(path, SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
                var res = new HttpResponseMessage();
                res.StatusCode = HttpStatusCode.OK;
                res.Content = new StreamContent(fileInfo.Filestream);
                res.Content.Headers.Add("Content-Disposition", $"inline;FileName=\"{fileInfo.Filename}\"");
                res.Content.Headers.ContentType = new MediaTypeHeaderValue(Utils.GetMimeType(fileInfo.Filename));
                return res;
            }

            HttpResponseMessage Response = new HttpResponseMessage();

            var f2Response = F2HandleFile(path);
            if (f2Response != null)
            {
                Response.StatusCode = HttpStatusCode.OK;
                Response.Content = new StreamContent(f2Response.GetResponseStream());
                Response.Content.Headers.ContentType = new MediaTypeHeaderValue(f2Response.Headers.Get("content-type"));
                return Response;
            }

            bool trackOperation = ApplicationSettingsManager.trackFiles();
            string filePath = null;
            string fileName = null;
            bool isFileFound = false;

            Files.File f = Files.GetByName(Path.GetFileName(path));

            try
            {
                if (f != null)
                {
                    if (f.DeletedAt != null)
                    {
                        Response.StatusCode = HttpStatusCode.NotFound;
                        return Response;
                    }
                    fileName = f.Name;
                    filePath = f.Path;
                    if (File.Exists(filePath))
                    {
                        isFileFound = true;
                    }
                }
                if (!isFileFound)
                {
                    Match match = new Regex(@"^(BodyPart_[^|]+)\|(.+)$").Match(path);
                    if (match.Success)
                    {
                        trackOperation = false;
                        fileName = match.Groups[2].Value;
                        filePath = HttpContext.Current.Server.MapPath("~") + "TemporaryFiles\\" + match.Groups[1].Value;
                    }
                    else
                    {
                        fileName = Path.GetFileName(@path);
                        filePath = GetFileDestinationDir(Path.GetDirectoryName(@path), Path.GetFileName(@path), out bool isSqlServerFile, adminAreaUpload) + "\\" + fileName;
                    }
                    if (File.Exists(filePath))
                    {
                        isFileFound = true;
                    }
                }

                JObject fileInfo = new JObject();
                fileInfo["files"] = new JArray { sanitizePath(filePath) };

                if (!canGetFile(filePath))
                {
                    Response.StatusCode = HttpStatusCode.Forbidden;
                    Response.Content = new StringContent("canGetFile::Forbidden");
                    return Response;
                }

                if (isFileFound)
                {
                    if (trackOperation)
                    {
                        trackFileOperation("download", fileInfo);
                    }

                    
                        return GetChunkedHttpResponseMessage(filePath, fileName);
                }
                else
                {
                    Response.StatusCode = HttpStatusCode.NotFound;
                    if (trackOperation)
                    {
                        trackFileOperation("downloadError", fileInfo);
                    }
                }
            }
            catch (Exception ex)
            {
                Response.StatusCode = HttpStatusCode.NotFound;
                MFLog.LogInFile($"Error in GetFile: {ex.Message}", MFLog.logtypes.ERROR);
            }

            return Response;
        }

    
       
        private HttpResponseMessage GetChunkedHttpResponseMessage(string filepath, string filename)
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK);

            var contentType = Utils.GetMimeType(filename);

            // Get file size
            var fileInfo = new System.IO.FileInfo(filepath);

            response.Content = new PushStreamContent(async (outputStream, httpContext, transportContext) =>
            {
                try
                {
                    const int bufferSize = 81920; // 80 KB buffer

                    using (var fileStream = new FileStream(filepath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite, bufferSize, true))
                    {
                        var buffer = new byte[bufferSize];
                        int bytesRead;

                        while ((bytesRead = await fileStream.ReadAsync(buffer, 0, buffer.Length)) > 0)
                        {
                            await outputStream.WriteAsync(buffer, 0, bytesRead);
                            await outputStream.FlushAsync();
                        }
                    }
                }
                catch (Exception ex)
                {
                    MFLog.LogInFile($"Error streaming file {filepath}: {ex.Message}", MFLog.logtypes.ERROR);
                }
                finally
                {
                    outputStream.Close();
                }
            }, new MediaTypeHeaderValue(contentType));

            // Set Content-Length header
            response.Content.Headers.ContentLength = fileInfo.Length;

            response.Content.Headers.ContentDisposition = new ContentDispositionHeaderValue("attachment")
            {
                FileName = filename
            };

            var cookie = new CookieHeaderValue("fileDownload", "true");
            cookie.Path = "/";
            response.Headers.AddCookies(new CookieHeaderValue[] { cookie });

            return response;
        }
        [HttpGet]
        [RateLimitIP(MaxRequest = 120, PerSeconds = 60, InstanceIDParam = "instanceId")]
        public HttpResponseMessage PublicGetFile(string instanceId, string token, string path, bool adminAreaUpload = false)
        {
            try
            {
                SessionHandler.ApplicationInstanceId = instanceId;
                if (Models.Tokens.GetValidToken(token, "PublicGetFile") != null)
                {
                    Models.Tokens.InvalidateToken(token);
                    return GetFile(path, adminAreaUpload);
                }
                else if (Models.Tokens.GetValidToken(token, "APIKey") != null)
                {
                    return GetFile(path, adminAreaUpload);
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
        /// <summary>
        /// Gets a file by applicationInstanceName from an ext5ernal app
        /// </summary>
        /// <param name="applicationName">the application Instance name in the magic framework config</param>
        /// <param name="purpose">will be checked against magic_mmb_tokens</param>
        /// <param name="token">will be checked against magic_mmb_tokens</param>
        /// <param name="path">relative or absolute path. If relative it will be completed with configuration parameters</param>
        /// <returns></returns>
        [HttpGet]
        public HttpResponseMessage PublicGetFileByApplicationName(string applicationName, string purpose, string token, string path)
        {
            try
            {
                string currentHost = HttpContext.Current.Request.Url.Authority;
                var cfg = new Helpers.MFConfiguration(currentHost).GetApplicationInstanceByInstanceName(currentHost, applicationName);
                SessionHandler.ApplicationInstanceId = cfg.id;

                var valid_token = Models.Tokens.GetValidToken(token, purpose);
                if (valid_token != null)
                {
                    Models.Tokens.CheckToken(token, applicationName, purpose);
                    return GetFile(path, false);
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
                    StatusCode = HttpStatusCode.InternalServerError,
                    Content = new StringContent(e.Message)
                };
            }
        }

        [HttpPost]
        public async Task<HttpResponseMessage> Save()
        {
            if (!Request.Content.IsMimeMultipartContent("form-data"))
            {
                throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
            }

            //TODO: verificare come passare path di destinazione in header
            string root = HttpContext.Current.Server.MapPath("~");

            var provider = new MultipartFormDataStreamProvider(root);

            try
            {
                // Read the form data.
                //VS2012: await Request.Content.ReadAsMultipartAsync(provider);
                await Request.Content.ReadAsMultipartAsync(provider);
                Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

                // This illustrates how to get the file names.
                foreach (MultipartFileData file in provider.FileData)
                {
                    //Trace.WriteLine(file.Headers.ContentDisposition.FileName);                    
                    //string savepath = GetNameHeaderValue(file.Headers.ContentDisposition.Parameters, "savepath");
                    //Trace.WriteLine("Server file path: " + file.LocalFileName);
                    var res = (from e in _context.Magic_FileTypeUpload
                               select e);
                    string savepath = String.Empty;
                    bool allowed = false;
                    foreach (var x in res)
                    {
                        var vet = x.MagicUploadExtensions.Split('@');
                        if (vet.Contains(file.Headers.ContentDisposition.FileName.Split('.')[file.Headers.ContentDisposition.FileName.Split('.').Length - 1].Replace("\"", "")))
                        {
                            savepath = x.AdminAreaSavePath;
                            allowed = true;
                            break;
                        }
                    }

                    string destinationfile = root + savepath + "\\" + file.Headers.ContentDisposition.FileName.Replace(@"&(\#\d+|\w+);|[^A-z\d\.-]", "");
                    //TODO: verificare se dare un timestamp al nomefile per evitare sovrascritture 
                    if (File.Exists(destinationfile))
                    {
                        File.Delete(destinationfile);
                    }
                    if (allowed)
                    {
                        File.Move(file.LocalFileName, destinationfile);
                    }
                    else
                    {
                        throw new HttpResponseException(HttpStatusCode.UnsupportedMediaType);
                    }
                }
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (System.Exception e)
            {
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, e);
            }
        }

        public static string getDestinationFileDir(string savePath, string fileName, bool isAdminAreaSavePath = false)
        {
            try
            {
                Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
                if (savePath == String.Empty)
                {
                    var res = (from e in _context.Magic_FileTypeUpload
                               select e);
                    foreach (var x in res)
                    {
                        var vet = x.MagicUploadExtensions.Split('@');
                        if (vet.Contains(fileName.Split('.')[fileName.Split('.').Length - 1].Replace("\"", "").ToLower()))
                        {
                            return savePath = isAdminAreaSavePath ? x.AdminAreaSavePath : x.ApplicationSavePath;
                        }
                    }
                }

                return null;
            }
            catch (System.Exception)
            {
                return null;
            }
        }

        private static string GetNameHeaderValue(ICollection<NameValueHeaderValue> headerValues, string name)
        {
            if (headerValues == null)
            {
                return null;
            }

            var nameValueHeader = headerValues.FirstOrDefault(x => x.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
            return nameValueHeader != null ? nameValueHeader.Value : null;
        }


		/// <summary>
		/// Unified endpoint for secure public download with email and code verification
		/// Handles three scenarios based on parameters:
		/// 1. Token only - Returns verification page
		/// 2. Token + Email - Sends verification code
		/// 3. Token + Email + Code - Validates and returns download link
		/// </summary>
		[HttpGet]
		[RateLimitIP(MaxRequest = 60, PerSeconds = 60, InstanceIDParam = "instanceId")]
		public HttpResponseMessage DownloadPublicZip(string instanceId, string token, string email = null, string codice = null)
		{
			try
			{
				SessionHandler.ApplicationInstanceId = instanceId;

				// Get connection string for database operations
				string connectionString = MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
				DatabaseCommandUtils dbUtils = new DatabaseCommandUtils();

				// ============================================
				// CASE 1: Only token provided - validate token and return HTML page
				// ============================================
				if (string.IsNullOrEmpty(email) && string.IsNullOrEmpty(codice))
				{
					// Check if token exists and is valid in core.DO_ZipJobs
					DataSet tokenCheck = dbUtils.GetDataSetFromStoredProcedure(
						"core.DO_CheckZipJobToken",
						new { TokenId = token },
						connectionString
					);

					if (tokenCheck == null || tokenCheck.Tables.Count == 0 || tokenCheck.Tables[0].Rows.Count == 0)
					{
						return new HttpResponseMessage()
						{
							StatusCode = HttpStatusCode.NotFound,
							Content = new StringContent("Token non valido o scaduto", System.Text.Encoding.UTF8, "text/plain")
						};
					}

					// Check Errore field
					DataRow row = tokenCheck.Tables[0].Rows[0];
					bool hasError = row["Errore"] != DBNull.Value && Convert.ToBoolean(row["Errore"]);

					if (hasError)
					{
						string errorMessage = row["ErrorMessage"]?.ToString() ?? "Token non valido o scaduto";
						return new HttpResponseMessage()
						{
							StatusCode = HttpStatusCode.Forbidden,
							Content = new StringContent(errorMessage, System.Text.Encoding.UTF8, "text/plain")
						};
					}

					// Return the HTML page for email verification
					string htmlPath = HttpContext.Current.Server.MapPath("~/Views/3/SecureDownload.html");
					if (File.Exists(htmlPath))
					{
						string htmlContent = File.ReadAllText(htmlPath);
						return new HttpResponseMessage()
						{
							StatusCode = HttpStatusCode.OK,
							Content = new StringContent(htmlContent, System.Text.Encoding.UTF8, "text/html")
						};
					}
					else
					{
						// If HTML file doesn't exist, return a basic response
						return new HttpResponseMessage()
						{
							StatusCode = HttpStatusCode.OK,
							Content = new StringContent(
								JsonConvert.SerializeObject(new { status = "ready", message = "Token valido" }),
								System.Text.Encoding.UTF8,
								"application/json"
							)
						};
					}
				}

				// ============================================
				// CASE 2: Token + Email provided - verify email and send code
				// ============================================
				if (!string.IsNullOrEmpty(email) && string.IsNullOrEmpty(codice))
				{
					// Verify email and send verification code
					DataSet emailVerification = dbUtils.GetDataSetFromStoredProcedure(
						"core.DO_CheckZipJobToken",
						new
						{
							TokenId = token,
							Email = email
						},
						connectionString
					);

					if (emailVerification == null || emailVerification.Tables.Count == 0 || emailVerification.Tables[0].Rows.Count == 0)
					{
						return new HttpResponseMessage()
						{
							StatusCode = HttpStatusCode.InternalServerError,
							Content = new StringContent(
								"Errore durante la verifica dell'email",
								System.Text.Encoding.UTF8,
								"text/plain"
							)
						};
					}

					// Check Errore field
					DataRow row = emailVerification.Tables[0].Rows[0];
					bool hasError = row["Errore"] != DBNull.Value && Convert.ToBoolean(row["Errore"]);

					if (hasError)
					{
						string errorMessage = row["ErrorMessage"]?.ToString() ?? "Email non corretta per scaricare il file";
						return new HttpResponseMessage()
						{
							StatusCode = HttpStatusCode.Forbidden,
							Content = new StringContent(errorMessage, System.Text.Encoding.UTF8, "text/plain")
						};
					}

					// Success - code has been sent
					string successMessage = row["Message"]?.ToString() ?? "Codice inviato via email";
					return new HttpResponseMessage()
					{
						StatusCode = HttpStatusCode.OK,
						Content = new StringContent(
							JsonConvert.SerializeObject(new
							{
								success = true,
								message = successMessage
							}),
							System.Text.Encoding.UTF8,
							"application/json"
						)
					};
				}

				// ============================================
				// CASE 3: Token + Email + Code provided - verify and return download link
				// ============================================
				if (!string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(codice))
				{
					// SP will verify email, code, generate download token, and return the complete download link
					DataSet result = dbUtils.GetDataSetFromStoredProcedure(
						"core.DO_CheckZipJobToken",
						new
						{
							TokenId = token,
							Email = email,
							TemporaryCode = codice
						},
						connectionString
					);

					if (result == null || result.Tables.Count == 0 || result.Tables[0].Rows.Count == 0)
					{
						return new HttpResponseMessage()
						{
							StatusCode = HttpStatusCode.InternalServerError,
							Content = new StringContent(
								"Errore durante la verifica del codice",
								System.Text.Encoding.UTF8,
								"text/plain"
							)
						};
					}

					// Check Errore field
					DataRow row = result.Tables[0].Rows[0];
					bool hasError = row["Errore"] != DBNull.Value && Convert.ToBoolean(row["Errore"]);

					if (hasError)
					{
						string errorMessage = row["ErrorMessage"]?.ToString() ?? "Codice non valido o scaduto";
						return new HttpResponseMessage()
						{
							StatusCode = HttpStatusCode.Forbidden,
							Content = new StringContent(errorMessage, System.Text.Encoding.UTF8, "text/plain")
						};
					}

					// Get the download link directly from the SP result
					string downloadUrl = row["DownloadUrl"]?.ToString();

					if (string.IsNullOrEmpty(downloadUrl))
					{
						return new HttpResponseMessage()
						{
							StatusCode = HttpStatusCode.NotFound,
							Content = new StringContent(
								"Link di download non disponibile",
								System.Text.Encoding.UTF8,
								"text/plain"
							)
						};
					}

					string successMessage = row["Message"]?.ToString() ?? "Verifica completata con successo";

					return new HttpResponseMessage()
					{
						StatusCode = HttpStatusCode.OK,
						Content = new StringContent(
							JsonConvert.SerializeObject(new
							{
								success = true,
								downloadUrl = downloadUrl,
								message = successMessage
							}),
							System.Text.Encoding.UTF8,
							"application/json"
						)
					};
				}

				// Invalid parameter combination
				return new HttpResponseMessage()
				{
					StatusCode = HttpStatusCode.BadRequest,
					Content = new StringContent(
						"Combinazione di parametri non valida",
						System.Text.Encoding.UTF8,
						"text/plain"
					)
				};
			}
			catch (Exception ex)
			{
				MFLog.LogInFile($"Error in DownloadPublicZip: {ex.Message}", MFLog.logtypes.ERROR);
				return new HttpResponseMessage()
				{
					StatusCode = HttpStatusCode.InternalServerError,
					Content = new StringContent(
						"Si è verificato un errore durante l'elaborazione della richiesta",
						System.Text.Encoding.UTF8,
						"text/plain"
					)
				};
			}
		}
		public static bool trackFileOperation(string operationType, JObject fileInfo)
        {
            try
            {
                if (Regex.Match(operationType, @"\w+Error$").Success && fileInfo["errorMessage"] == null)
                {
                    fileInfo["errorMessage"] = "File not found";
                }

                using (System.Data.SqlClient.SqlConnection connection = new System.Data.SqlClient.SqlConnection(DBConnectionManager.GetConnectionFor("dbo.Magic_FileTracking")))
                {
                    System.Data.SqlClient.SqlCommand cmd = new System.Data.SqlClient.SqlCommand("INSERT INTO dbo.Magic_FileTracking(UserId, OperationType, FileInfo) VALUES(@UserId, @OperationType, @FileInfo)", connection);
                    cmd.Parameters.AddWithValue("@UserId", SessionHandler.IdUser);
                    cmd.Parameters.AddWithValue("@OperationType", operationType);
                    cmd.Parameters.AddWithValue("@FileInfo", fileInfo.ToString());
                    connection.Open();
                    return cmd.ExecuteNonQuery() > 0;
                }
            }
            catch
            {
                return false;
            }
        }

        public static string sanitizePath(string path)
        {
            return Regex.Replace(Regex.Replace(path, @"\/+", "\\\\"), @"\\{2,}", "\\");
        }

        public class FileInfo
        {
            public string Id { get; set; }
            public string Filename { get; set; }
            public Stream Filestream { get; set; }
        }

        public class FileReferenceInfo
        {
            [JsonProperty("tmpFile")]
            public string Id { get; set; }
            [JsonProperty("name")]
            public string Name { get; set; }
        }

        public class FileReferences
        {
            [JsonProperty("filesToSave")]
            public FileReferenceInfo[] FilesToSave { get; set; }
            [JsonProperty("filesToDelete")]
            public FileReferenceInfo[] FilesToDelete { get; set; }
        }

    }

}
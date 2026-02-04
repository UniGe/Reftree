using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Reflection;
using System.Net.Http;
using System.Net.Http.Headers;
using MagicFramework.Helpers;
using OfficeOpenXml;
using Ionic.Zip;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using PdfSharp.Drawing;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;
using Newtonsoft.Json.Linq;
using System.Text.RegularExpressions;
using System.Data;
using System.Diagnostics;
using System.Data.SqlClient;
using System.Configuration;
using Newtonsoft.Json;

namespace Ref3.BL
{




    public class XmlColumnDefinition
    { 
        public string ColumnName {get;set;} 
        public string ColumnLabels {get;set;}

        public int? VirtualTable_ID { get; set; }

        public XmlColumnDefinition(string columnname,string columnlabels,int? virtualtable_id)
        {
            this.ColumnLabels = columnlabels;
            this.ColumnName = columnname;
            this.VirtualTable_ID = virtualtable_id;
        }
    }
    public class BoType {
        public int ID { get; set; }
        public string Description { get; set; }

        public BoType(DataRow dr)
        {
            this.ID = int.Parse(dr["ID"].ToString());
            this.Description = dr["Description"].ToString();
        }
    }
    public  class DossierItem
    {
        public int DO_DOSSIE_ID { get; set; }
        public string DO_DOSSIE_DESCRIPTION { get; set; }
        public Nullable<int> DO_Magic_BusinessObjectType_ID { get; set; }

        public DossierItem(DataRow dr) {
            this.DO_DOSSIE_ID = int.Parse(dr["DO_DOSSIE_ID"].ToString());
            this.DO_DOSSIE_DESCRIPTION = dr["DO_DOSSIE_DESCRIPTION"].ToString();
            if (dr.IsNull("DO_Magic_BusinessObjectType_ID"))
                this.DO_Magic_BusinessObjectType_ID = null;
            else
                this.DO_Magic_BusinessObjectType_ID = int.Parse(dr["DO_Magic_BusinessObjectType_ID"].ToString());
        }
    }
    public class WaterMarkForUser
    {
        public bool US_ROLDEP_WATERMARK { get; set; }
        public string US_ROLDEP_WATERMARK_PRE { get; set; }
        public string US_ROLDEP_WATERMARK_POST { get; set; }

        public WaterMarkForUser() {
        }
        public WaterMarkForUser(DataRow watermarkdr) {

            if (watermarkdr != null)
            {
                this.US_ROLDEP_WATERMARK = bool.Parse(watermarkdr["US_ROLDEP_WATERMARK"].ToString());
                this.US_ROLDEP_WATERMARK_POST = watermarkdr["US_ROLDEP_WATERMARK_POST"].ToString();
                this.US_ROLDEP_WATERMARK_PRE = watermarkdr["US_ROLDEP_WATERMARK_PRE"].ToString();
            }
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
    public class FileGenerator
    {
        public static class ReferenceTypes
        {
            // Constants for reference types
            public const string DOSSIER = "dossier";
            public const string DOCUMENT_LIST = "documentlist";

            // Add any validation or utility methods here
            public static bool IsValidReferenceType(string referenceType)
            {
                return referenceType == DOSSIER ||
                       referenceType == DOCUMENT_LIST;
            }

            // Get a list of all valid reference types
            public static List<string> GetAllReferenceTypes()
            {
                return new List<string> { DOSSIER, DOCUMENT_LIST };
            }
        }

        public const int xlsSummaryRelationalColumns = 15; // relational cols 
        private const string zipcomment = "Zipped by Reftree";
        public string exportdir { get; set; }
        public string modelexportdir { get; set; }
        private string siteImgGallerydir { get; set; }
        private const string invalidWSheetCharsRegex = @"[/\\*'?[\]:]+";
        private const int WSheetmaxLength = 31;
        private string sCustomPathFascicolo = "";


        // the linq to sql context that provides the data access layer	  
        // private Data.RefTreeEntities _context = DBConnectionManager.GetEFManagerConnection() != null ? new Data.RefTreeEntities(DBConnectionManager.GetEFManagerConnection()) : new Data.RefTreeEntities();
        static string groupVisibilityField { get; set; }
        PropertyInfo propertyInfo { get; set; }

        public Dictionary<int, List<XmlColumnDefinition>> documentTypeXmlColumns = new Dictionary<int, List<XmlColumnDefinition>>();
        public Dictionary<int, List<XmlColumnDefinition>> documentClassXmlColumns = new Dictionary<int, List<XmlColumnDefinition>>();

        public FileGenerator(bool loadXmlFields,string conn)
        {
            this.modelexportdir = MagicFramework.Helpers.Utils.retcompletepath(ApplicationSettingsManager.GetRootdirforupload());
            this.exportdir = Path.Combine(MagicFramework.Helpers.Utils.retcompletepath(ApplicationSettingsManager.GetRootdirforupload()), "ZZ_RefTreeDossierStage");
            this.siteImgGallerydir = "Views\\ImageThumbnailGallery\\" + SessionHandler.ApplicationInstanceName;
            groupVisibilityField = ApplicationSettingsManager.GetVisibilityField().ToUpper();
            this.propertyInfo = typeof(Data.DO_V_DOCUME).GetProperty(groupVisibilityField);
            var dbutils = new DatabaseCommandUtils();
            DataSet xmlFieldsDS = dbutils.GetDataSet(@"
				    select distinct ef.CF_BOEXFI_KEY_VALUE as id,ef.CF_BOEXFI_ENTITY_NAME,u.ColumnName,u.ColumnLabels,u.VirtualTable_ID ,u.iOrder
				  from config.CF_BOEXFI_bo_extended_fields ef
				  inner join USERFIELDS.Magic_UserColumnsDetails u on u.id = ef.CF_BOEXFI_COLUMN_ID
				   where CF_BOEXFI_ENTITY_NAME in ('core.DO_TIPDOC_document_type','core.DO_CLADOC_document_class')
				   order by u.iOrder,columnName"
             , conn);
            
            int key;
            string colname, collab;
            int? virtabid;
            if (xmlFieldsDS.Tables.Count > 0)
            {
                foreach (DataRow xmlField in xmlFieldsDS.Tables[0].Rows)
                {
                    key = int.Parse(xmlField["id"].ToString());
                    colname = xmlField["ColumnName"].ToString();
                    collab = xmlField["ColumnLabels"].ToString();
                    virtabid = null;
                    if (xmlField["VirtualTable_ID"] != DBNull.Value)
                        virtabid = int.Parse(xmlField["VirtualTable_ID"].ToString());
                  
                    if (xmlField["CF_BOEXFI_ENTITY_NAME"].ToString() == "core.DO_TIPDOC_document_type")
                    {
                        
                        if (!this.documentTypeXmlColumns.ContainsKey(key))
                            this.documentTypeXmlColumns.Add(key, new List<XmlColumnDefinition>());

                           this.documentTypeXmlColumns[key].Add(new XmlColumnDefinition(colname, collab, virtabid));
                    }
                    else
                    {
                        if (!this.documentClassXmlColumns.ContainsKey(key))
                            this.documentClassXmlColumns.Add(key, new List<XmlColumnDefinition>());

                        this.documentClassXmlColumns[key].Add(new XmlColumnDefinition(colname, collab, virtabid));
                    }
                }
            }
                     
        }
        public FileGenerator()
        {
            this.modelexportdir = MagicFramework.Helpers.Utils.retcompletepath(ApplicationSettingsManager.GetRootdirforupload());
            this.exportdir = Path.Combine(MagicFramework.Helpers.Utils.retcompletepath(ApplicationSettingsManager.GetRootdirforupload()), "ZZ_RefTreeDossierStage");
            this.siteImgGallerydir = "Views\\ImageThumbnailGallery\\" + SessionHandler.ApplicationInstanceName;
            groupVisibilityField = ApplicationSettingsManager.GetVisibilityField().ToUpper();
            this.propertyInfo = typeof(Data.DO_V_DOCUME).GetProperty(groupVisibilityField);
        }
        public FileGenerator(bool noSession)
        {
        }
        #region images
        /// <summary>
        /// Check wether a file is a recognised image or not for system.Drawing library. It implies that uploaded files must have an extension!!!
        /// </summary>
        /// <param name="fileName"></param>
        /// <returns></returns>
        private bool IsRecognisedImageFile(string fileName)
        {
            string targetExtension = System.IO.Path.GetExtension(fileName);
            if (String.IsNullOrEmpty(targetExtension))
                return false;
            else
                targetExtension = "*" + targetExtension.ToLowerInvariant();

            List<string> recognisedImageExtensions = new List<string>();

            foreach (System.Drawing.Imaging.ImageCodecInfo imageCodec in System.Drawing.Imaging.ImageCodecInfo.GetImageEncoders())
                recognisedImageExtensions.AddRange(imageCodec.FilenameExtension.ToLowerInvariant().Split(";".ToCharArray()));

            foreach (string extension in recognisedImageExtensions)
            {
                if (extension.Equals(targetExtension))
                {
                    return true;
                }
            }
            return false;
        }
        /// <summary>
        /// Creates a thumbnail and saves it to a given path
        /// </summary>
        /// <param name="frompath">where the original image is located</param>
        /// <param name="topath">where the thumbnail should be located</param>
        /// <param name="width">desired width</param>
        /// <param name="height">desired height</param>
        private string CreateProportionedThumbnailFromImage(string originalfile,string topath, int width, int height,int? documeid)
        {
            Bitmap srcBmp = new Bitmap(originalfile);
            float ratio = (float)srcBmp.Width / (float)srcBmp.Height;
            SizeF newSize = new SizeF(width, (int) (height * ratio));
            Bitmap target = new Bitmap((int)newSize.Width, (int)newSize.Height);
            string filename = Path.GetFileNameWithoutExtension(originalfile);
            string thumbnailname = String.Empty;
            if (documeid!=null)
                 thumbnailname = Path.Combine(this.siteImgGallerydir,documeid.ToString(), filename + ".png");
            using (Graphics graphics = Graphics.FromImage(target))
            {
                graphics.CompositingQuality = CompositingQuality.HighSpeed;
                graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                graphics.CompositingMode = CompositingMode.SourceCopy;
                graphics.DrawImage(srcBmp, 0, 0, newSize.Width, newSize.Height);
                
                using (MemoryStream memoryStream = new MemoryStream())
                {
                    target.Save(memoryStream, ImageFormat.Png);
                    using (FileStream file = new FileStream(Path.Combine(topath,filename+".png"), FileMode.Create, FileAccess.Write))
                    {
                        memoryStream.WriteTo(file);
                    }
                    memoryStream.Flush();
                    memoryStream.Dispose();
                }
                graphics.Dispose();
            }
            srcBmp.Dispose();
            return thumbnailname;
        }
        /// <summary>
        /// non usa EF per ottenere il path
        /// </summary>
        /// <param name="DOCUME_ID"></param>
        /// <param name="diruploaded"></param>
        /// <param name="f"></param>
        /// <returns></returns>
        public string CreateThumbnail(int DOCUME_ID,string diruploaded, MagicFramework.Models.FileUploaded f)
        {
            var currentAppDir = HttpContext.Current.Server.MapPath("~");
            string destinationLocalPath = Path.Combine(currentAppDir, this.siteImgGallerydir, DOCUME_ID.ToString());
            string thumbnaillink = null;
            if (this.IsRecognisedImageFile(f.name))
            {
                //create thumbnail in local site
                Directory.CreateDirectory(destinationLocalPath);
                string originalfile = Path.Combine(diruploaded, f.name);
                thumbnaillink = this.CreateProportionedThumbnailFromImage(originalfile, destinationLocalPath, 100, 100, DOCUME_ID);
            }
            return thumbnaillink;
        }
        public string CreateThumbnail(int DOCUME_ID, MagicFramework.Models.FileUploaded f)
        {
            var currentAppDir =  HttpContext.Current.Server.MapPath("~");
            Data.DO_DOCUME_documents d = new Data.DO_DOCUME_documents();
            string diruploaded = d.getPathComplete(DOCUME_ID);
            string destinationLocalPath = Path.Combine(currentAppDir,this.siteImgGallerydir, DOCUME_ID.ToString());
            string thumbnaillink = null;
            if (this.IsRecognisedImageFile(f.name))
                {
                    //create thumbnail in local site
                    Directory.CreateDirectory(destinationLocalPath);
                    string originalfile = Path.Combine(diruploaded, f.name);
                    thumbnaillink = this.CreateProportionedThumbnailFromImage(originalfile, destinationLocalPath, 100, 100,DOCUME_ID);                
                }
            return thumbnaillink;
        }
        #endregion
        private static JArray convertDocumentsDictToJArray(Dictionary<int, List<string>> documents) {
            JArray docs = new JArray();
            if (documents == null)
                return docs;
            foreach (var docId in documents.Keys)
            {
                foreach (var filename in documents[docId]) {
                    JObject o = JObject.FromObject(new { DOCUME_ID = docId, FileName = filename });
                    docs.Add(o); 
                }
            }
            return docs;
        }
        /// <summary>
        /// Returns the path of a docfil or docume
        /// </summary>
        /// <param name="data">the grid content for documents and document files</param>
        /// <returns>the complete path as a string</returns>
        public string getCompletePath(dynamic data,DatabaseCommandUtils dbutils)
        {
            //Get path for the given input
            DataSet pathDS = dbutils.GetDataSetFromStoredProcedure("core.usp_get_Document_path", data);
            return  Path.Combine(ApplicationSettingsManager.GetRootdirforcustomer(),pathDS.Tables[0].Rows[0]["document_path"].ToString());
        }
        public ZipFile AddFileToZip(string filename, ZipFile zipfile)
        {
            ZipEntry e = zipfile.AddFile(filename, "/");
            e.Comment = zipcomment;
            return zipfile;
        }

        public static string GetFilenameFromJson(string jsonfiledefinition)
        {
            List<MagicFramework.Models.FileUploaded> fdes = Newtonsoft.Json.JsonConvert.DeserializeObject<List<MagicFramework.Models.FileUploaded>>(jsonfiledefinition); // in DOCFIL sicuramente è singolo
            return fdes[0].name;
        }
        public static List<string> GetFilenamesFromJson_all(string jsonfiledefinition)
        {
            List<MagicFramework.Models.FileUploaded> fdes = Newtonsoft.Json.JsonConvert.DeserializeObject<List<MagicFramework.Models.FileUploaded>>(jsonfiledefinition); // in DOCFIL sicuramente è singolo
            return fdes.Select(f => f.name).ToList();
        }
        public static List<string> getFileNamesFromOutFiles(List<string> files) {

            List<string> fileNames = new List<string>();
            if (files == null)
                return fileNames;
            foreach (var f in files) {
                fileNames.Add(Path.GetFileName(f));
            }
            return fileNames;
        }

        public bool AddDocumentToZip(int DO_DOCUME_ID, ref ZipFile zipfile, ref JArray outfiles,List<string> outFilesOfThisDoc, int? DOSSIE_ID, int? OBJECT_ID)
        {
            // path in cui sono contenuti i file del corrente DO_DOCUME_IDa
            string filedir = ApplicationSettingsManager.GetRootdirforcustomer();
            Data.DO_DOCUME_documents d = new Data.DO_DOCUME_documents();
            string rootdirfordoc = Path.Combine(filedir, d.getPathComplete(DO_DOCUME_ID));

            var connString = DBConnectionManager.GetTargetConnection();
            var dbutils = new DatabaseCommandUtils();

            //DataSet ds = dbutils.GetDataSet("SELECT * FROM core.DO_V_DOCFIL WHERE DO_DOCFIL_DO_DOCUME_ID = " + DO_DOCUME_ID.ToString(),connString);
            //Security enforcement prevent File enumeration
            JObject data = JObject.FromObject(new { documentId = DO_DOCUME_ID , dossieID = DOSSIE_ID, objectId = OBJECT_ID });
            DataSet ds = dbutils.GetDataSetFromStoredProcedure("core.DO_USP_DOCFIL_SELECT",data);


            // recupera i file da aggiungere allo zip
            DataSet watermarks = dbutils.GetDataSet(String.Format("EXEC core.GetWaterMarkForUser {0},{1}", SessionHandler.IdUser.ToString(), SessionHandler.UserVisibilityGroup.ToString()), connString);
            DataRow watermarkdr = watermarks.Tables[0].Rows.Count > 0 ?  watermarks.Tables[0].Rows[0] : null;
            WaterMarkForUser watermark = new WaterMarkForUser(watermarkdr);
            if (ds.Tables[0].Rows.Count > 0)
           // if (files.Count>0)
            {
                var files = ds.Tables[0].Rows;
                //foreach (var f in files.Where(x => x.DO_DOCVER_LINK_FILE != null))
                foreach (DataRow f in files)
                {
                    string path = GetSafePath(f["DO_CLADOC_DESCRIPTION"].ToString()) + "\\" + GetSafePath(f["DO_TIPDOC_CODE"].ToString());
                    var realfilenames = GetFilenamesFromJson_all(f["DO_DOCVER_LINK_FILE"].ToString());
                    foreach (string realfilename in realfilenames)
                    {
                       // string realfilename = GetFilenameFromJson(f["DO_DOCVER_LINK_FILE"].ToString());
                        
                        if (f.Table.Columns.Contains("custom_path"))
                        {
                            sCustomPathFascicolo = f["custom_path"].ToString();
                        }

                        path = string.IsNullOrEmpty(sCustomPathFascicolo) ? path : sCustomPathFascicolo;
                        string checkFile = string.IsNullOrEmpty(sCustomPathFascicolo) ? realfilename : Path.Combine(path, realfilename).Replace("\\", "/");

                        if (!zipfile.Any(x => x.FileName.EndsWith(checkFile)))   //DB non aggiunto due volte lo stesso file anche se c'è nel result
                        {
                            string filetoadd = Path.Combine(rootdirfordoc, realfilename);


                            outfiles.Add(filetoadd);
                            //of the input doc only
                            outFilesOfThisDoc.Add(filetoadd);

                            if (File.Exists(filetoadd))
                            {
                                if (watermark != null)
                                {

                                    //D.T: Porcheria per ovviare a problema #4302  
                                    try
                                    {
                                        if (Path.GetExtension(filetoadd).ToLower() == ".pdf")
                                        {
                                            PdfDocument doc = PdfReader.Open(filetoadd, PdfDocumentOpenMode.Modify);
                                            doc.Dispose();
                                        }
                                    }
                                    catch (Exception ex)
                                    {
                                        MFLog.LogInFile("cannot apply watermark on :" + filetoadd + ".Exception says:" + ex.Message, MFLog.logtypes.WARN);
                                        watermark.US_ROLDEP_WATERMARK = false;
                                    }


                                    if (watermark.US_ROLDEP_WATERMARK && Path.GetExtension(filetoadd).ToLower() == ".pdf")
                                    {
                                        MemoryStream stream = addWatermarkToPdf(watermark, filetoadd);
                                        ZipEntry e = zipfile.AddEntry(path + "\\" + realfilename, stream);
                                        e.Comment = zipcomment;
                                    }
                                    else
                                    {
                                        ZipEntry e = zipfile.AddFile(filetoadd, path);
                                        e.Comment = zipcomment;
                                    }
                                }
                                else
                                {
                                    ZipEntry e = zipfile.AddFile(filetoadd, path);
                                    e.Comment = zipcomment;
                                }
                            }
                            else
                            {
                                return false;
                            }
                        }
                    }
                }                
            }
            return true;
        }
        

        public string CheckAndAddWatermark(string filePath, WaterMarkForUser watermark)
        {
            // If watermark is null or not applicable, return the original file path
            if (watermark == null || !watermark.US_ROLDEP_WATERMARK || Path.GetExtension(filePath).ToLower() != ".pdf")
            {
                return filePath;
            }

            // Check if PDF can be opened (as done in the original code)
            try
            {
                PdfDocument doc = PdfReader.Open(filePath, PdfDocumentOpenMode.Modify);
                doc.Dispose();
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("cannot apply watermark on :" + filePath + ".Exception says:" + ex.Message, MFLog.logtypes.WARN);
                return filePath; // Return original file if watermark can't be applied
            }

            // Create a directory for temporary watermarked files if it doesn't exist
            string tempDir = Path.Combine(ApplicationSettingsManager.GetRootdirforupload(), "TempWatermarked");
            if (!Directory.Exists(tempDir))
            {
                Directory.CreateDirectory(tempDir);
            }

            // Generate a unique filename while preserving the original filename
            string originalFileName = Path.GetFileName(filePath);
            string uniqueId = Guid.NewGuid().ToString("N").Substring(0, 8);
            string tempFile = Path.Combine(tempDir, $"{Path.GetFileNameWithoutExtension(originalFileName)}_{uniqueId}.pdf");

            // Apply watermark and save to the temporary file
            MemoryStream stream = addWatermarkToPdf(watermark, filePath);

            using (FileStream fs = new FileStream(tempFile, FileMode.Create))
            {
                stream.Position = 0;
                stream.CopyTo(fs);
            }

            return tempFile;
        }
        public class ZipMessage
        {
            public List<string> files { get; set; }
            public Dictionary<string, string> path_mapping { get; set; }
            public Dictionary<string, string> watermarked_files { get; set; }
            public string destination { get; set; }
            public string job_id { get; set; }
            public string callback_endpoint { get; set; }
            public string application_name { get; set; }
            public int user_id { get; set; }
            public string reference_type { get; set; }
            public int reference_id { get; set; }
            public string additionalData { get; set; } = string.Empty;
        }

        public class ZipResponse
        {
            [JsonProperty("request_id")]
            public string JobId { get; set; }

            [JsonProperty("success")]
            public bool Success { get; set; }

            [JsonProperty("destination")]
            public string Destination { get; set; }

            [JsonProperty("error_message")]
            public string ErrorMessage { get; set; }

            [JsonProperty("successful_files")]
            public int SuccessfulFiles { get; set; }

            [JsonProperty("failed_files")]
            public int FailedFiles { get; set; }

            [JsonProperty("total_files")]
            public int TotalFiles { get; set; }

            [JsonProperty("processing_time_ms")]
            public long ProcessingTimeMs { get; set; }

            [JsonProperty("timestamp")]
            public long Timestamp { get; set; }

            [JsonProperty("application_name")]
            public string ApplicationName { get; set; }

            // Directly map the status field from JSON
            [JsonProperty("status")]
            public string Status { get; set; }

            // Backward compatibility property that can be removed later
            public bool IsProcessing
            {
                get { return Status?.ToLower() == "processing"; }
            }
        }

        public static void UpdateZipJobStatus(string jobId, string status, string filePath = null, string errorMessage = null, MFConfiguration.ApplicationInstanceConfiguration cfg = null)
        {
            try
            {
                // Implement database update for the job status
                DatabaseCommandUtils dbutils = new DatabaseCommandUtils(true);

                // Create a JObject with the parameters
                JObject jobData = new JObject
                {
                    ["JobId"] = jobId,
                    ["Status"] = status
                };

                if (!string.IsNullOrEmpty(filePath))
                    jobData["FilePath"] = filePath;

                if (!string.IsNullOrEmpty(errorMessage))
                    jobData["ErrorMessage"] = errorMessage;

                // Execute stored procedure
                dbutils.GetDataSetFromStoredProcedure("core.usp_update_zip_job_status", jobData, cfg?.TargetDBconn);

                MFLog.LogInFile($"Updated zip job status: JobId={jobId}, Status={status}", MFLog.logtypes.INFO);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile($"Failed to update zip job status: {ex.Message}", MFLog.logtypes.ERROR);
            }
        }
        /// <summary>
        /// Tracks a zip job in the database
        /// </summary>
        /// <param name="referenceId">The reference ID (dossier ID, document ID, etc.)</param>
        /// <param name="filePath">The destination file path</param>
        /// <param name="userId">The user ID</param>
        /// <param name="jobId">The job ID</param>
        /// <param name="messageJson">The JSON message sent to RabbitMQ</param>
        /// <param name="referenceType">The type of reference (dossier, documentlist, etc.)</param>
        /// <returns>The job ID</returns>
        public static Guid TrackZipJob(int referenceId, string filePath, int userId, Guid jobId, string messageJson, string referenceType = "dossier")
        {
            try
            {
                // Add a record to the database table to track the zip job
                var dbutils = new DatabaseCommandUtils();

                // Create reference JSON based on reference type and ID
                string referenceJson = $"{{\"type\":\"{referenceType}\",\"id\":{referenceId}}}";

                JObject jobData = new JObject
                {
                    ["JobId"] = jobId.ToString(),
                    ["ReferenceJson"] = referenceJson,
                    ["FilePath"] = filePath,
                    ["UserId"] = userId,
                    ["Status"] = "pending",
                    ["RequestedAt"] = DateTime.Now,
                    ["MessageJson"] = messageJson
                };

                // Use the existing stored procedure to insert the job
                dbutils.GetDataSetFromStoredProcedure("core.DO_USP_ZipJob_INSERT", jobData);

                // Log success
                MFLog.LogInFile($"Created zip job: JobId={jobId}, ReferenceType={referenceType}, ReferenceId={referenceId}", MFLog.logtypes.INFO);

                return jobId;
            }
            catch (Exception ex)
            {
                MFLog.LogInFile($"Failed to create zip job: {ex.Message}", MFLog.logtypes.ERROR);
                return jobId; // Return the original jobId even if tracking failed
            }
        }

        /// <summary>
        /// Updates job status to overwritten with reference to the new job
        /// </summary>
        /// <param name="jobId">The job ID to update</param>
        /// <param name="newJobId">The ID of the job that replaces this one</param>
        /// <returns>True if update succeeded</returns>
        public static bool MarkJobAsOverwritten(string jobId, string newJobId)
        {
            try
            {
                // Create a database utility
                var dbutils = new DatabaseCommandUtils();

                // Create parameters for the stored procedure
                JObject jobData = new JObject
                {
                    ["JobId"] = jobId,
                    ["Status"] = "overwritten",
                    ["StatusReason"] = $"Replaced by job {newJobId}",
                    ["OverwrittenByJobId"] = newJobId
                };

                // Execute stored procedure to update job status
                dbutils.GetDataSetFromStoredProcedure("core.usp_update_zip_job_status", jobData);

                MFLog.LogInFile($"Marked job {jobId} as overwritten by {newJobId}", MFLog.logtypes.INFO);
                return true;
            }
            catch (Exception ex)
            {
                MFLog.LogInFile($"Failed to mark job as overwritten: {ex.Message}", MFLog.logtypes.ERROR);
                return false;
            }
        }

        /// <summary>
        /// Checks if there are any zip jobs in 'processing' or 'pending' status for the specified reference and user
        /// </summary>
        /// <param name="referenceId">The reference ID to check (dossier ID, document ID, etc.)</param>
        /// <param name="userId">The user ID to check</param>
        /// <param name="dbutils">The existing DatabaseCommandUtils instance to use</param>
        /// <param name="referenceType">The type of reference (dossier, documentlist, etc.)</param>
        /// <returns>True if processing jobs exist, false otherwise</returns>
        public static bool HasProcessingZipJobs(int referenceId, int userId, DatabaseCommandUtils dbutils, string referenceType = "dossier")
        {
            try
            {
                    // For other reference types, use the new stored procedure
                    JObject jobData = new JObject
                    {
                        ["ReferenceType"] = referenceType,
                        ["ReferenceId"] = referenceId,
                        ["UserId"] = userId
                    };

                    // Execute new stored procedure to check for processing jobs by type
                    var result = dbutils.GetDataSetFromStoredProcedure("core.usp_check_processing_zip_jobs", jobData);

                    // Check if any processing jobs were found
                    bool hasProcessingJobs = false;

                    if (result != null && result.Tables.Count > 0 && result.Tables[0].Rows.Count > 0)
                    {
                        hasProcessingJobs = true;
                        MFLog.LogInFile($"Found existing processing jobs for userId={userId}, referenceType={referenceType}, referenceId={referenceId}", MFLog.logtypes.INFO);
                    }

                    return hasProcessingJobs;
            }
            catch (Exception ex)
            {
                MFLog.LogInFile($"Error checking for processing zip jobs: {ex.Message}", MFLog.logtypes.ERROR);
                return false; // Assume no processing jobs if there's an error
            }
        }
        
        public bool AddDocumentToZipQueue(int DO_DOCUME_ID, ref JArray outfiles, List<string> outFilesOfThisDoc,
              ref List<string> filesToZip, ref Dictionary<string, string> pathMapping,
              ref Dictionary<string, string> watermarkedFiles, int? DOSSIE_ID, int? OBJECT_ID)
        {
            // Path where the current document files are stored
            string filedir = ApplicationSettingsManager.GetRootdirforcustomer();
            Data.DO_DOCUME_documents d = new Data.DO_DOCUME_documents();
            string rootdirfordoc = Path.Combine(filedir, d.getPathComplete(DO_DOCUME_ID));

            var connString = DBConnectionManager.GetTargetConnection();
            var dbutils = new DatabaseCommandUtils();

            // Get document files
            JObject data = JObject.FromObject(new { documentId = DO_DOCUME_ID, dossieID = DOSSIE_ID, objectId = OBJECT_ID });
            DataSet ds = dbutils.GetDataSetFromStoredProcedure("core.DO_USP_DOCFIL_SELECT", data);

            // Get watermark info if needed
            DataSet watermarks = dbutils.GetDataSet(String.Format("EXEC core.GetWaterMarkForUser {0},{1}",
                SessionHandler.IdUser.ToString(), SessionHandler.UserVisibilityGroup.ToString()), connString);
            DataRow watermarkdr = watermarks.Tables[0].Rows.Count > 0 ? watermarks.Tables[0].Rows[0] : null;
            WaterMarkForUser watermark = new WaterMarkForUser(watermarkdr);

            bool hasFiles = false;
            string sCustomPathFascicolo = string.Empty;

            if (ds.Tables[0].Rows.Count > 0)
            {
                var files = ds.Tables[0].Rows;
                foreach (DataRow f in files)
                {
                    List<string> realfilenames = GetFilenamesFromJson_all(f["DO_DOCVER_LINK_FILE"].ToString());
                    
                    string path = GetSafePath(f["DO_CLADOC_DESCRIPTION"].ToString()) + "\\" + GetSafePath(f["DO_TIPDOC_CODE"].ToString());
                    if (f.Table.Columns.Contains("custom_path"))
                    {
                        sCustomPathFascicolo = f["custom_path"].ToString();
                    }

                    path = string.IsNullOrEmpty(sCustomPathFascicolo) ? path : sCustomPathFascicolo;

                    foreach (var realfilename in realfilenames)
                    {
                        string checkFile = string.IsNullOrEmpty(sCustomPathFascicolo) ? realfilename : Path.Combine(path, realfilename).Replace("\\", "/");

                        string filetoadd = Path.Combine(rootdirfordoc, realfilename);
                        outfiles.Add(filetoadd);
                        outFilesOfThisDoc.Add(filetoadd);

                        if (File.Exists(filetoadd))
                        {
                            // Apply watermark if needed
                            string fileToZip = CheckAndAddWatermark(filetoadd, watermark);

                            // If the file was watermarked (i.e., a new file was created)
                            if (fileToZip != filetoadd)
                            {
                                watermarkedFiles.Add(fileToZip, realfilename); // Store mapping of temp file to original filename
                            }

                            // Add to list and mapping - using the original filename in the zip path
                            filesToZip.Add(fileToZip);
                            pathMapping.Add(fileToZip, Path.Combine(path, realfilename));
                            hasFiles = true;
                        }
                        else
                        {
                            return false;
                        }
                    }
                }
            }

            return hasFiles;
        }
        public HttpResponseMessage GetChunkedHttpResponseMessage(string filepath, string filename)
        {
            if (!CanRead(filepath, filename, new Dictionary<int, List<string>>()))
                throw new System.ArgumentException("Access denied");

            var response = new HttpResponseMessage(System.Net.HttpStatusCode.OK)
            {
                Content = new PushStreamContent(async (stream, context, transportContext) =>
                {
                    try
                    {
                        using (var fileStream = File.OpenRead(filepath))
                        {
                            await fileStream.CopyToAsync(stream);
                        }
                    }
                    finally
                    {
                        stream.Close();
                    }
                }, "application/octet-stream"),
            };
            response.Headers.TransferEncodingChunked = true;
            response.Content.Headers.ContentDisposition = new System.Net.Http.Headers.ContentDispositionHeaderValue("attachment")
            {
                FileName = filename
            };
            var cookie = new CookieHeaderValue("fileDownload", "true");
            cookie.Expires = DateTimeOffset.Now.AddDays(1);
            cookie.Path = "/";
            response.Headers.AddCookies(new CookieHeaderValue[] { cookie });
            return response;
        }
        private bool CanRead(string filenamepathcomplete, string filenameonly, Dictionary<int, List<string>> documentFiles)
        {
            var dbutils = new DatabaseCommandUtils();
            //Check user rights for the required file
            var data = JObject.FromObject(new { Filenamepathcomplete = filenamepathcomplete, Filename = filenameonly, Documents = convertDocumentsDictToJArray(documentFiles) });
            var dsrights = dbutils.GetDataSetFromStoredProcedure("core.DO_PATH_IS_DOWNLOADABLE", data);
            bool canread = false;
            canread = bool.Parse(dsrights.Tables[0].Rows[0]["canread"].ToString());
            return canread;
        }

        public ZipFile CloseAndReleaseZip(ZipFile zip, string filename) 
        {
            zip.Comment = zipcomment;
            zip.Save(filename);
            zip.Dispose();
            return zip;
        }
        private MemoryStream addWatermarkToPdf(string US_ROLDEP_WATERMARK_PRE,string US_ROLDEP_WATERMARK_POST, string filetoadd)
        {
            MemoryStream stream = new MemoryStream();
            try
            {
                PdfDocument doc = PdfReader.Open(filetoadd, PdfDocumentOpenMode.Modify);
                string text;
                int testSize = 10;
                double width = 0;
                string fontFamily = "Verdana";
                XBrush brush = new XSolidBrush(XColor.FromArgb(128, 255, 0, 0));
                DateTime date = DateTime.Now;

                if (!string.IsNullOrEmpty(MagicFramework.Helpers.SessionHandler.UserFirstName) && !string.IsNullOrEmpty(MagicFramework.Helpers.SessionHandler.UserLastName))
                    text = string.Format("{0} {1} - {2} {3}", MagicFramework.Helpers.SessionHandler.UserFirstName, MagicFramework.Helpers.SessionHandler.UserLastName, date.ToShortDateString(), date.ToShortTimeString());
                else
                    text = string.Format("{0} - {1} {2}", MagicFramework.Helpers.SessionHandler.Username, date.ToShortDateString(), date.ToShortTimeString());

                foreach (PdfPage page in doc.Pages)
                {
                    // Get an XGraphics object for drawing beneath the existing content
                    XGraphics gfx = XGraphics.FromPdfPage(page, XGraphicsPdfPageOptions.Append);

                    //get dimensions of text with size 10
                    if (width == 0)
                    {
                        width = gfx.MeasureString(text, new XFont(fontFamily, testSize)).Width;
                        if (!string.IsNullOrEmpty(US_ROLDEP_WATERMARK_PRE))
                        {
                            double w = gfx.MeasureString(US_ROLDEP_WATERMARK_PRE, new XFont(fontFamily, testSize)).Width;
                            if (w > width)
                                width = w;
                        }
                    }

                    // Create a graphical path
                    XGraphicsPath xPath = new XGraphicsPath();

                    //calculate font size
                    double pageDiagonal = Math.Sqrt(page.Width * page.Width + page.Height * page.Height);
                    double fontSize = ((pageDiagonal / width) / testSize) * 70; // 70% of page diagonal
                    double bottomFontSize = fontSize / 3;
                    XPoint center = new XPoint(page.Width / 2, page.Height / 2);
                    XPoint bottomRight = new XPoint(center.X + page.Width / 2 - bottomFontSize, center.Y + page.Height / 2 - bottomFontSize);

                    if (page.Elements.ContainsKey("/MediaBox"))
                    {
                        if (page.Rotate % 180 == 0)
                        {
                            center = new XPoint(center.X - page.MediaBox.X1, center.Y - page.MediaBox.Y1);
                            if (page.Rotate == 180)
                                bottomRight = new XPoint(center.X - bottomFontSize, center.Y + page.MediaBox.Y1 - bottomFontSize);
                        }
                        else if (page.Rotate % 90 == 0)
                        {
                            page.MediaBox = new PdfRectangle(new XPoint(page.MediaBox.X1, page.MediaBox.Y1), new XPoint(page.Width + page.MediaBox.X1, page.Height + page.MediaBox.Y1));
                            center = new XPoint(center.Y - page.MediaBox.Y1, center.X - page.MediaBox.X1);
                            bottomRight = new XPoint(center.Y - bottomFontSize, center.X - bottomFontSize);
                        }
                    }

                    //rotate gfx if, page is rotated
                    if (page.Rotate != 0)
                    {
                        gfx.TranslateTransform(center.X, center.Y);
                        gfx.RotateTransform(-page.Rotate);
                    }

                    if (!string.IsNullOrEmpty(US_ROLDEP_WATERMARK_POST))
                        gfx.DrawString(US_ROLDEP_WATERMARK_POST, new XFont(fontFamily, bottomFontSize), brush, bottomRight, XStringFormats.BottomRight);

                    // Define a rotation transformation at the center of the page
                    if (page.Rotate == 0)
                        gfx.TranslateTransform(center.X, center.Y);
                    gfx.RotateTransform(-Math.Atan(page.Rotate % 180 != 0 && page.Rotate % 90 == 0 ? page.Width / page.Height : page.Height / page.Width) * 180 / Math.PI);
                    gfx.TranslateTransform(-center.X, -center.Y);

                    // Create a string format
                    XStringFormat format = new XStringFormat();
                    format.Alignment = XStringAlignment.Center;
                    format.LineAlignment = XLineAlignment.Center;

                    if (!string.IsNullOrEmpty(US_ROLDEP_WATERMARK_PRE))
                    {
                        format.LineAlignment = XLineAlignment.Near;
                        xPath.AddString(US_ROLDEP_WATERMARK_PRE, new XFontFamily(fontFamily), new XFontStyle(), fontSize, center, format);
                        format.LineAlignment = XLineAlignment.Far;
                    }
                    xPath.AddString(text, new XFontFamily(fontFamily), new XFontStyle(), fontSize, center, format);
                    gfx.DrawPath(brush, xPath);
                }
                doc.Save(stream, false);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }

            return stream;
        }
        private MemoryStream addWatermarkToPdf(WaterMarkForUser watermarks, string filetoadd)
        {
            MemoryStream stream = new MemoryStream();
            try
            {
                PdfDocument doc = PdfReader.Open(filetoadd, PdfDocumentOpenMode.Modify);
                string text;
                int testSize = 10;
                double width = 0;
                string fontFamily = "Verdana";
                XBrush brush = new XSolidBrush(XColor.FromArgb(128, 255, 0, 0));
                DateTime date = DateTime.Now;

                if (!string.IsNullOrEmpty(MagicFramework.Helpers.SessionHandler.UserFirstName) && !string.IsNullOrEmpty(MagicFramework.Helpers.SessionHandler.UserLastName))
                    text = string.Format("{0} {1} - {2} {3}", MagicFramework.Helpers.SessionHandler.UserFirstName, MagicFramework.Helpers.SessionHandler.UserLastName, date.ToShortDateString(), date.ToShortTimeString());
                else
                    text = string.Format("{0} - {1} {2}", MagicFramework.Helpers.SessionHandler.Username, date.ToShortDateString(), date.ToShortTimeString());

                foreach (PdfPage page in doc.Pages)
                {
                    // Get an XGraphics object for drawing beneath the existing content
                    XGraphics gfx = XGraphics.FromPdfPage(page, XGraphicsPdfPageOptions.Append);

                    //get dimensions of text with size 10
                    if (width == 0)
                    {
                        width = gfx.MeasureString(text, new XFont(fontFamily, testSize)).Width;
                        if (!string.IsNullOrEmpty(watermarks.US_ROLDEP_WATERMARK_PRE))
                        {
                            double w = gfx.MeasureString(watermarks.US_ROLDEP_WATERMARK_PRE, new XFont(fontFamily, testSize)).Width;
                            if (w > width)
                                width = w;
                        }
                    }

                    // Create a graphical path
                    XGraphicsPath xPath = new XGraphicsPath();

                    //calculate font size
                    double pageDiagonal = Math.Sqrt(page.Width * page.Width + page.Height * page.Height);
                    double fontSize = ((pageDiagonal / width) / testSize) * 70; // 70% of page diagonal
                    double bottomFontSize = fontSize / 3;
                    XPoint center = new XPoint(page.Width / 2, page.Height / 2);
                    XPoint bottomRight = new XPoint(center.X + page.Width / 2 - bottomFontSize, center.Y + page.Height / 2 - bottomFontSize);

                    if (page.Elements.ContainsKey("/MediaBox"))
                    {
                        if (page.Rotate % 180 == 0)
                        {
                            center = new XPoint(center.X - page.MediaBox.X1, center.Y - page.MediaBox.Y1);
                            if (page.Rotate == 180)
                                bottomRight = new XPoint(center.X - bottomFontSize, center.Y + page.MediaBox.Y1 - bottomFontSize);
                        }
                        else if (page.Rotate % 90 == 0)
                        {
                            page.MediaBox = new PdfRectangle(new XPoint(page.MediaBox.X1, page.MediaBox.Y1), new XPoint(page.Width + page.MediaBox.X1, page.Height + page.MediaBox.Y1));
                            center = new XPoint(center.Y - page.MediaBox.Y1, center.X - page.MediaBox.X1);
                            bottomRight = new XPoint(center.Y - bottomFontSize, center.X - bottomFontSize);
                        }
                    }

                    //rotate gfx if, page is rotated
                    if (page.Rotate != 0)
                    {
                        gfx.TranslateTransform(center.X, center.Y);
                        gfx.RotateTransform(-page.Rotate);
                    }

                    if (!string.IsNullOrEmpty(watermarks.US_ROLDEP_WATERMARK_POST))
                        gfx.DrawString(watermarks.US_ROLDEP_WATERMARK_POST, new XFont(fontFamily, bottomFontSize), brush, bottomRight, XStringFormats.BottomRight);

                    // Define a rotation transformation at the center of the page
                    if (page.Rotate == 0)
                        gfx.TranslateTransform(center.X, center.Y);
                    gfx.RotateTransform(-Math.Atan(page.Rotate % 180 != 0 && page.Rotate % 90 == 0 ? page.Width / page.Height : page.Height / page.Width) * 180 / Math.PI);
                    gfx.TranslateTransform(-center.X, -center.Y);

                    // Create a string format
                    XStringFormat format = new XStringFormat();
                    format.Alignment = XStringAlignment.Center;
                    format.LineAlignment = XLineAlignment.Center;

                    if (!string.IsNullOrEmpty(watermarks.US_ROLDEP_WATERMARK_PRE))
                    {
                        format.LineAlignment = XLineAlignment.Near;
                        xPath.AddString(watermarks.US_ROLDEP_WATERMARK_PRE, new XFontFamily(fontFamily), new XFontStyle(), fontSize, center, format);
                        format.LineAlignment = XLineAlignment.Far;
                    }
                    xPath.AddString(text, new XFontFamily(fontFamily), new XFontStyle(), fontSize, center, format);
                    gfx.DrawPath(brush, xPath);
                }
                doc.Save(stream, false);
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }

            return stream;
        }

        public void AddDownloadToResponse(ref HttpResponseMessage result, string filenamepathcomplete, string filenameonly, bool deleteFile = false, Dictionary<int,List<string>> documentFiles = null)
        {
            //Ref3.Data.GetWaterMarkForUser_Result watermarks = (from e in _context.GetWaterMarkForUser(SessionHandler.IdUser, SessionHandler.UserVisibilityGroup)
            //                                                   select e).FirstOrDefault();

           

            var dbutils = new DatabaseCommandUtils();
            //Check user rights for the required file            
            if(!CanRead(filenamepathcomplete, filenameonly, documentFiles))
                throw new System.ArgumentException("Access denied");
            string connectionString = null;

            try
            {
                connectionString = DBConnectionManager.GetTargetConnection();
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
                MFLog.LogInFile("Error retreiving applicationName in StaticManageUploadedFiles to save the delete file log inn db: " + e.Message, MFLog.logtypes.ERROR);
            }
            var ds = dbutils.GetDataSet(String.Format("exec core.GetWaterMarkForUser {0},{1}", SessionHandler.IdUser, SessionHandler.UserVisibilityGroup), connectionString);

            bool US_ROLDEP_WATERMARK = false;
            string US_ROLDEP_WATERMARK_PRE = String.Empty;
            string US_ROLDEP_WATERMARK_POST = String.Empty;
            try {
                US_ROLDEP_WATERMARK = bool.Parse(ds.Tables[0].Rows[0]["US_ROLDEP_WATERMARK"].ToString());
                US_ROLDEP_WATERMARK_PRE = ds.Tables[0].Rows[0]["US_ROLDEP_WATERMARK_PRE"].ToString();
                US_ROLDEP_WATERMARK_POST = ds.Tables[0].Rows[0]["US_ROLDEP_WATERMARK_POST"].ToString();
            }
            catch {}
            //D.T: Porcheria per ovviare a problema #4302  
            try
            {
                if (Path.GetExtension(filenamepathcomplete).ToLower() == ".pdf")
                {
                    PdfDocument doc = PdfReader.Open(filenamepathcomplete, PdfDocumentOpenMode.Modify);
                    doc.Dispose();
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("cannot apply watermark on :" + filenamepathcomplete + ".Exception says:" + ex.Message, MFLog.logtypes.WARN);
                US_ROLDEP_WATERMARK = false;
            }
            byte[] buffer;

            //if (watermarks != null && watermarks.US_ROLDEP_WATERMARK && Path.GetExtension(filenamepathcomplete).ToLower() == ".pdf")
            if (US_ROLDEP_WATERMARK && Path.GetExtension(filenamepathcomplete).ToLower() == ".pdf")
            {
                using (MemoryStream stream = addWatermarkToPdf(US_ROLDEP_WATERMARK_PRE,US_ROLDEP_WATERMARK_POST, filenamepathcomplete))
                {
                    using (BinaryReader br = new BinaryReader(stream))
                    {
                        buffer = br.ReadBytes((int)stream.Length);
                    }
                }
            }
            else
            {
                result = GetChunkedHttpResponseMessage(filenamepathcomplete, filenameonly);
                return;
            }

            if (deleteFile)
            {
                Files.CopyInTrash(filenamepathcomplete, connectionString, applicationName);
                File.Delete(filenamepathcomplete);
            }
            string contentType = String.Empty; //Utils.GetMimeType(filenameonly);
            //if (IsRecognisedImageFile(filenameonly))
            contentType = "application/octet-stream"; //grants file download instead of preview
            result.Content = new ByteArrayContent(buffer);
            result.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            result.Content.Headers.Add("Content-Disposition", string.Format("attachment;FileName=\"{0}\"", filenameonly));
            //Add cookie for jquery download promise resolution otherwise it will undefinetly check for end...
            var cookie = new CookieHeaderValue("fileDownload", "true");
            cookie.Expires = DateTimeOffset.Now.AddDays(1);
            cookie.Path = "/";
            result.Headers.AddCookies(new CookieHeaderValue[] { cookie });
        }

        public string GetFileNameForDossier(string filename, bool complete)
        {   
            filename = Utils.CleanFileName(filename) + Utils.DateimeForFileName() + FileExtensions.zip;
            Directory.CreateDirectory(exportdir);
            return complete ? Path.Combine(exportdir, filename) : filename;
        }

        public string GetFileNameForFileToAdd(string filename)
        {
            filename = Utils.CleanFileName(filename) + Utils.DateimeForFileName() + FileExtensions.txt;
            Directory.CreateDirectory(exportdir);
            filename = Path.Combine(exportdir, filename);
            return filename;            
        }
        public string GetXmlFileNameForFileToAdd(string filename)
        {
            filename = Utils.CleanFileName(filename) + FileExtensions.xml;
            Directory.CreateDirectory(exportdir);
            filename = Path.Combine(exportdir, filename);
            return filename;
        }
        public string GetFileNameForZip(bool complete,bool isDocumentBuilder = false) 
        {
            string fname = "Export_" + Utils.DateimeForFileName() + FileExtensions.zip;
            string dir = isDocumentBuilder == true ? modelexportdir : exportdir;
            Directory.CreateDirectory(dir);
            return complete ? Path.Combine(dir, fname) : fname;
        }
        public string GetFileNameForZip(bool complete, string dir, bool noSession)
        {
            string fname = "Export_" + Utils.DateimeForFileName() + FileExtensions.zip;
            Directory.CreateDirectory(MagicFramework.Helpers.Utils.retcompletepath(dir));
            return complete ? Path.Combine(dir, fname) : fname;
        }
        public string GetFileNameForZip(bool complete, string prefix)
        {
            string fname = prefix + Utils.DateimeForFileName() + FileExtensions.zip;
            Directory.CreateDirectory(exportdir);
            return complete ? Path.Combine(exportdir, fname) : fname;
        }
        public string GetFileNameForExcel()
        {           
            string fname = "Riepilogo_" + DateTime.UtcNow.Ticks.ToString() + FileExtensions.xlsx;
            Directory.CreateDirectory(exportdir);
            string filename = Path.Combine(exportdir, fname);
            return filename;
        }

        public ExcelPackage AddDocumentToExcelList(ExcelPackage package, int DO_DOCUME_ID, int? OBJECT_ID, int? DOSSIE_ID)
        {
            var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();
            DataSet fileDs = new DataSet();


            //non ho un fascicolo e quindi rimango alla vecchia modalita
            if (DOSSIE_ID == null) 
            {
                string conn = DBConnectionManager.GetTargetConnection();
                fileDs = dbutils.GetDataSet(@"SELECT 
                    df.DO_CLADOC_CODE
                    ,df.DO_DOCUME_NUM
	                ,df.DO_TIPDOC_DESCRIPTION
	                ,df.DO_DOCUME_CODE
	                ,df.DO_DOCUME_DESCRIPTION
                    ,ISNULL(df.DO_DOCFIL_NOTE,'') DO_DOCFIL_NOTE
	                ,df.DO_DOCVER_LINK_FILE
	                ,df.DO_CLADOC_DESCRIPTION
	                ,df.DO_DOCUME_NUM_PROT
	                ,df.DO_DOCUME_DATA_PROT
	                ,df.DO_DOCUME_ISSUE_DATE
	                ,df.DO_DOCUME_EXPIRY_DATE
	                ,df.DO_DOCUME_XML_CAMASS_VALUES
	                ,dd.DO_DOCUME_FLAG_FATHER
	                ,dd.DO_DOCUME_CODE_PADRE
	                ,dd.DO_STADOC_DESCRIPTION
	                ,ISNULL(a.AS_ASSET_CODE, 'NN') AS_ASSET_CODE
	                ,ISNULL(a.AS_ASSET_DESCRIZIONE, 'Asset non trovato') AS_ASSET_DESCRIPTION
                    ,dd.DO_TIPDOC_DO_CLADOC_ID
                    ,dd.DO_DOCUME_DO_TIPDOC_ID
                    ,df.DO_TIPDOC_CODE
                FROM core.DO_V_DOCFIL df
                LEFT JOIN core.DO_V_DOCUME dd
                ON dd.DO_DOCUME_ID = df.DO_DOCFIL_DO_DOCUME_ID " +
                    (OBJECT_ID == null || OBJECT_ID == 0 ? @"LEFT JOIN core.DO_DOCREL_document_relation e
                ON e.DO_DOCREL_TABLE_NAME = 'AS_ASSET_asset'
                AND e.DO_DOCREL_DO_DOCUME_ID = dd.DO_DOCUME_ID
                LEFT JOIN core.AS_ASSET_asset a
                ON a.AS_ASSET_ID = e.DO_DOCREL_ID_RECORD" :
                    ("LEFT JOIN core.AS_ASSET_asset a ON a.AS_ASSET_ID=" + OBJECT_ID)) +
                    " WHERE df.DO_DOCFIL_DO_DOCUME_ID=" + DO_DOCUME_ID +
                    " AND df.DO_DOCVER_LINK_FILE IS NOT NULL", conn);

            }
            else
            {

                JObject data = JObject.FromObject(new { documentId = DO_DOCUME_ID, objectId = OBJECT_ID, dossieId = DOSSIE_ID });
                fileDs = dbutils.GetDataSetFromStoredProcedure("core.DO_USP_DOCFIL_SELECT_FOR_EXCEL", data);

            }

            

            /*
            string conn = DBConnectionManager.GetTargetConnection();
            DataSet fileDs = dbutils.GetDataSet(@"SELECT 
                    df.DO_CLADOC_CODE
                    ,df.DO_DOCUME_NUM
	                ,df.DO_TIPDOC_DESCRIPTION
	                ,df.DO_DOCUME_CODE
	                ,df.DO_DOCUME_DESCRIPTION
                    ,ISNULL(df.DO_DOCFIL_NOTE,'') DO_DOCFIL_NOTE
	                ,df.DO_DOCVER_LINK_FILE
	                ,df.DO_CLADOC_DESCRIPTION
	                ,df.DO_DOCUME_NUM_PROT
	                ,df.DO_DOCUME_DATA_PROT
	                ,df.DO_DOCUME_ISSUE_DATE
	                ,df.DO_DOCUME_EXPIRY_DATE
	                ,df.DO_DOCUME_XML_CAMASS_VALUES
	                ,dd.DO_DOCUME_FLAG_FATHER
	                ,dd.DO_DOCUME_CODE_PADRE
	                ,dd.DO_STADOC_DESCRIPTION
	                ,ISNULL(a.AS_ASSET_CODE, 'NN') AS_ASSET_CODE
	                ,ISNULL(a.AS_ASSET_DESCRIZIONE, 'Asset non trovato') AS_ASSET_DESCRIPTION
                    ,dd.DO_TIPDOC_DO_CLADOC_ID
                    ,dd.DO_DOCUME_DO_TIPDOC_ID
                    ,df.DO_TIPDOC_CODE
                FROM core.DO_V_DOCFIL df
                LEFT JOIN core.DO_V_DOCUME dd
                ON dd.DO_DOCUME_ID = df.DO_DOCFIL_DO_DOCUME_ID " +
                (OBJECT_ID == null || OBJECT_ID == 0 ? @"LEFT JOIN core.DO_DOCREL_document_relation e
                ON DO_DOCREL_TABLE_NAME = 'AS_ASSET_asset'
                AND e.DO_DOCREL_DO_DOCUME_ID = dd.DO_DOCUME_ID
                LEFT JOIN core.AS_ASSET_asset a
                ON a.AS_ASSET_ID = e.DO_DOCREL_ID_RECORD" :
                ("LEFT JOIN core.AS_ASSET_asset a ON a.AS_ASSET_ID=" + OBJECT_ID)) +
                " WHERE df.DO_DOCFIL_DO_DOCUME_ID=" + DO_DOCUME_ID +
                " AND df.DO_DOCVER_LINK_FILE IS NOT NULL", conn);
            */
 
            List<XmlColumnDefinition> xmlFieldsDs = new List<XmlColumnDefinition>();
            string xmlFKQuery = @"SELECT ID
                                ,VirtualTable_ID
                                ,isnull(Fk_TextLabel,Code) AS Label
                                FROM USERFIELDS.Magic_UserVirtualTablesData WHERE VirtualTable_ID = {0} and ID = {1}";
            //Column,VirtualTable_ID
            Dictionary<string, int> virtualTables = new Dictionary<string, int>();
            //Virtual table recordID, description
            Dictionary<string, string> loadedValues = new Dictionary<string, string>();

            if (fileDs.Tables.Count > 0)
            {
                int row = 1;                
                int headersrow = 4;
                Dictionary<int, string> xmlFields = new Dictionary<int, string>();

                foreach (DataRow f in fileDs.Tables[0].Rows)
                {
                    int cladocid = int.Parse(f["DO_TIPDOC_DO_CLADOC_ID"].ToString());
                    int tipdocid = int.Parse(f["DO_DOCUME_DO_TIPDOC_ID"].ToString());
                    
                    if (this.documentClassXmlColumns.ContainsKey(cladocid) && this.documentTypeXmlColumns.ContainsKey(tipdocid))
                            xmlFieldsDs = this.documentClassXmlColumns[int.Parse(f["DO_TIPDOC_DO_CLADOC_ID"].ToString())].Union(this.documentTypeXmlColumns[int.Parse(f["DO_DOCUME_DO_TIPDOC_ID"].ToString())]).ToList();
                        else if (this.documentClassXmlColumns.ContainsKey(cladocid))
                            xmlFieldsDs = this.documentClassXmlColumns[int.Parse(f["DO_TIPDOC_DO_CLADOC_ID"].ToString())];
                        else if (this.documentTypeXmlColumns.ContainsKey(tipdocid))
                        xmlFieldsDs = this.documentTypeXmlColumns[int.Parse(f["DO_DOCUME_DO_TIPDOC_ID"].ToString())];
                    
                    //check if sheet exists
                    string wsname = "{0} - {1}";
                    wsname = string.Format(wsname, f["DO_CLADOC_CODE"], f["DO_CLADOC_DESCRIPTION"]);

                    string safeName = Regex.Replace(wsname, invalidWSheetCharsRegex, " ")
                                            .Replace("  ", " ")
                                            .Trim();
                    wsname = safeName;
                    //fix 31 caratteri
                    if (wsname.Length > WSheetmaxLength)
                        wsname = wsname.Substring(0, WSheetmaxLength);

                    ExcelWorksheet ws = package.Workbook.Worksheets[wsname];
                    int col = xlsSummaryRelationalColumns + 1;
                    if (xmlFieldsDs.Count > 0)
                    {
                        foreach (XmlColumnDefinition xmlField in xmlFieldsDs)
                        {
                            try
                            {
                                if (!xmlFields.ContainsKey(col))
                                {
                                    xmlFields.Add(col, xmlField.ColumnName);
                                    //management of virtual FK
                                    if (!(xmlField.VirtualTable_ID == null))
                                        if (!virtualTables.ContainsKey(xmlField.ColumnName))
                                            virtualTables.Add(xmlField.ColumnName, (int)xmlField.VirtualTable_ID);
                                }
                                col++;
                            }
                            catch (Exception ex) {
                                MFLog.LogInFile("AddDocumentToExcelList - "+ex.Message, MFLog.logtypes.ERROR);
                            }
                        }
                    }
                    if (ws == null)
                    {
                        ws = package.Workbook.Worksheets.Add(wsname);
                        ws.Cells[1, 1].Value = "Data aggiornamento";
                        ws.Cells[2, 1].Value = "Tipologia documenti";

                        ws.Cells[1, 2].Value = DateTime.Now;
                        ws.Cells[1, 2].Style.Numberformat.Format = "dd/mm/yyyy";
                        ws.Cells[2, 2].Value = wsname;
                        ws.Cells[1, 1, 2, 2].Style.Font.Bold = true;
                        ws.Column(1).AutoFit();

                        //riga di intestazione
                        row = headersrow;
                        ws.Cells[row, 1].Value = "Numero";
                        ws.Cells[row, 2].Value = "Codice immobile";
                        ws.Cells[row, 3].Value = "Descrizione immobile";
                        ws.Cells[row, 4].Value = "Tipo documento";
                        ws.Cells[row, 5].Value = "Codice documento";
                        ws.Cells[row, 6].Value = "Descrizione";
                        ws.Cells[row, 7].Value = "Descrizione file";
                        ws.Cells[row, 8].Value = "Link";
                        ws.Cells[row, 9].Value = "Protocollo";
                        ws.Cells[row, 10].Value = "Data Protocollo";
                        ws.Cells[row, 11].Value = "Data documento";
                        ws.Cells[row, 12].Value = "Data scadenza";
                        ws.Cells[row, 13].Value = "Relazione";
                        ws.Cells[row, 14].Value = "Doc principale";
                        ws.Cells[row, 15].Value = "Status";
                        
                        col = xlsSummaryRelationalColumns + 1;
                        // ad xml defined columns
                        if (xmlFieldsDs.Count > 0)
                        {
                            foreach (XmlColumnDefinition xmlField in xmlFieldsDs)
                            {
                                try
                                {
                                    JObject labels = Newtonsoft.Json.JsonConvert.DeserializeObject<JObject>(xmlField.ColumnLabels);
                                    ws.Cells[row, col].Value = labels["it"];
                                    ws.Column(col).AutoFit();
                                    col++;
                                } catch(Exception e){
                                    Debug.WriteLine(e.Message);
                                }
                            }
                        }
                        ws.Cells[row, 1, row, col].Style.Font.Bold = true;

                    }      

                    // get last cell in sheet
                    
                    string location = "";
                    string DisplayText = "Link";

                    var realfilenames = new List<string>();
                    if (f["DO_DOCVER_LINK_FILE"].ToString() == "")
                        realfilenames.Add(""); //???? from previous logic...
                    else
                        realfilenames = GetFilenamesFromJson_all(f["DO_DOCVER_LINK_FILE"].ToString());

                    foreach (var realfilename in realfilenames)
                    {
                        row = ws.Dimension.End.Row;
                        row++;
                        ws.Cells[row, 1].Value = f["DO_DOCUME_NUM"];
                        ws.Cells[row, 2].Value = f["AS_ASSET_CODE"];
                        ws.Cells[row, 3].Value = f["AS_ASSET_DESCRIPTION"];
                        ws.Cells[row, 4].Value = f["DO_TIPDOC_DESCRIPTION"];
                        ws.Cells[row, 5].Value = f["DO_DOCUME_CODE"];
                        ws.Cells[row, 6].Value = f["DO_DOCUME_DESCRIPTION"];
                        ws.Cells[row, 7].Value = f["DO_DOCFIL_NOTE"];
                        ws.Cells[row, 8].Value = realfilename;

                        if (string.IsNullOrEmpty(sCustomPathFascicolo))
                        {
                            location = ".\\{0}\\{1}\\{2}";
                            location = string.Format(location, GetSafePath(f["DO_CLADOC_DESCRIPTION"].ToString()), GetSafePath(f["DO_TIPDOC_CODE"].ToString()), realfilename);
                        }
                        else
                        {
                            location = ".\\{0}\\{1}";
                            location = string.Format(location, sCustomPathFascicolo, realfilename);
                        }

                        ws.Cells[row, 8].Formula = realfilename != "" ? "HYPERLINK(\"" + location + "\",\"" + DisplayText + "\")" : "";
                        ws.Cells[row, 8].Style.Font.Color.SetColor(System.Drawing.Color.Blue);
                        ws.Cells[row, 8].Style.Font.UnderLine = true;

                        ws.Cells[row, 9].Value = f["DO_DOCUME_NUM_PROT"];
                        ws.Cells[row, 10].Value = f["DO_DOCUME_DATA_PROT"]; // GetSafeDateString(f.DO_DOCUME_DATA_PROT);
                        ws.Cells[row, 10].Style.Numberformat.Format = "dd/mm/yyyy";
                        ws.Cells[row, 11].Value = f["DO_DOCUME_ISSUE_DATE"]; // GetSafeDateString(f.DO_DOCUME_ISSUE_DATE);
                        ws.Cells[row, 11].Style.Numberformat.Format = "dd/mm/yyyy";
                        ws.Cells[row, 12].Value = f["DO_DOCUME_EXPIRY_DATE"]; // GetSafeDateString(f.DO_DOCUME_EXPIRY_DATE);
                        ws.Cells[row, 12].Style.Numberformat.Format = "dd/mm/yyyy";
                        ws.Cells[row, 13].Value = f["DO_DOCUME_FLAG_FATHER"];
                        ws.Cells[row, 14].Value = f["DO_DOCUME_CODE_PADRE"];
                        ws.Cells[row, 15].Value = f["DO_STADOC_DESCRIPTION"];

                        if (xmlFields.Count > 0 && !(f["DO_DOCUME_XML_CAMASS_VALUES"] is System.DBNull))
                        {
                            System.Xml.XmlDocument xmldoc = new System.Xml.XmlDocument();
                            xmldoc.InnerXml = f["DO_DOCUME_XML_CAMASS_VALUES"].ToString();
                            if (xmldoc["DO_DOCUME_XML_CAMASS_VALUES"] != null)
                            {
                                foreach (KeyValuePair<int, string> xmlField in xmlFields)
                                {
                                    if (xmldoc["DO_DOCUME_XML_CAMASS_VALUES"][xmlField.Value] != null)
                                    {
                                        string value = xmldoc["DO_DOCUME_XML_CAMASS_VALUES"][xmlField.Value].InnerText;
                                        //chek if it's a virtual FK and has a value
                                        try
                                        {
                                            if (virtualTables.ContainsKey(xmlField.Value.ToString()) && !String.IsNullOrEmpty(value))
                                            {
                                                if (loadedValues.ContainsKey(value))
                                                    value = loadedValues[value];
                                                else
                                                {
                                                    var dsfk = dbutils.GetDataSet(String.Format(xmlFKQuery, virtualTables[xmlField.Value.ToString()], value), DBConnectionManager.GetTargetConnection());
                                                    if (dsfk.Tables.Count > 0)
                                                    {
                                                        if (dsfk.Tables[0].Rows.Count > 0)
                                                        {
                                                            loadedValues.Add(value, dsfk.Tables[0].Rows[0]["Label"].ToString());
                                                            value = dsfk.Tables[0].Rows[0]["Label"].ToString();

                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        catch (Exception ex)
                                        {
                                            MFLog.LogInFile("Problems while looking up virtual data values.Check for wrong XML content for Virtual Tables items. Error says:" + ex.Message, MFLog.logtypes.WARN, "AddDocumentToExcelList.txt");
                                        }
                                        ws.Cells[row, xmlField.Key].Value = value;
                                    }
                                }
                            }
                        }
                    }

                    // autofit delle column
                    ws.Cells[ws.Dimension.Address].AutoFitColumns();
                 
                }
            }

            fileDs.Dispose();

            return package;
        }

        private string GetSafePath(string path) {
            return path.Replace('\\', '_');
        }

        private DateTime? GetSafeDateString(object date) {   
            return date != null ? (DateTime)date : DateTime.Now;
        }

    }
    /// <summary>
    /// Class whose methods are called by reflection from Chron jobs... 
    /// </summary>
    public class EventFileGenerator
    {
        public static void GenerateExcelModels(int eventID, string targetDBConnectionString, string magicDBConnectionString)
        {
            string sessionGUID = Guid.NewGuid().ToString();
            int sqlCommandTimeout = 60 * 40; //40 mins as requested by P.Vari 22/05/2025
                
                //ConfigurationManager.AppSettings["SqlCommandTimeout"] == null ? 30 : int.Parse(ConfigurationManager.AppSettings["SqlCommandTimeout"].ToString());
            DataSet ds = new DataSet();
            using (SqlConnection conn = new SqlConnection(targetDBConnectionString))
            {
                using (SqlCommand cmd = new SqlCommand(String.Format(@"EXEC core.ExcelScheduledlModelsGet '{0}',{1}", sessionGUID,eventID.ToString()), conn))
                {
                    cmd.Connection.Open();
                    DataTable table = new DataTable();
                    //value read from web.config if null it's considered 30 (default) 
                    cmd.CommandTimeout = sqlCommandTimeout;
                    table.Load(cmd.ExecuteReader());
                    ds.Tables.Add(table);
                    cmd.Connection.Close();
                }
                //iterate through tipmod , the list of excel models given by the stored 
                int tipmodid;
                int? arevisid = -1;
                int? deprolid = -1;
                JObject inputData;
                ExcelDocumentFiller docfiller = new ExcelDocumentFiller(sqlCommandTimeout);
                foreach (DataRow dr in ds.Tables[0].Rows)
                {
                    tipmodid =  dr.Field<int>("ID"); //first colum has to contain the excel model Id 
                    if (dr.Table.Columns.Contains("US_AREVIS_ID"))
                        arevisid = dr.Field<int?>("US_AREVIS_ID");
                    if (dr.Table.Columns.Contains("US_DEPROL_ID"))
                        deprolid = dr.Field<int?>("US_DEPROL_ID");
                    inputData = JObject.FromObject(new { tipmodId = tipmodid, jobSessionGUID = sessionGUID, US_AREVIS_ID = arevisid , US_DEPROL_ID = deprolid });
                    var f =  docfiller.fillDocument(dr.Field<string>("StoredProcedure"), dr.Field<string>("StoredProcedureAfter"), inputData, dr.Field<string>("FilePath"),null, targetDBConnectionString,-1,-1);
                    f.Close();
                    f.Dispose();
                }
                //call the final SP 
                using (SqlCommand cmd = new SqlCommand(String.Format(@"EXEC core.ExcelScheduledlModelsEnd '{0}',{1}", sessionGUID, eventID.ToString()), conn))
                {
                    cmd.Connection.Open();
                    //value read from web.config if null it's considered 30 (default) 
                    cmd.CommandTimeout = sqlCommandTimeout;
                    cmd.ExecuteNonQuery(); 
                    cmd.Connection.Close();
                }

            }
        
        }
        public static void MoveDownloadedFilesEvent(int eventID, string targetDBConnectionString, string magicDBConnectionString)
        {
            string path;
            string sqlScript = String.Format(@"select TOP 1 Local_Path FROM  
                                   dbo.Magic_GetEventChainBottomUp({0}) 
                                   WHERE Event_ID != {0} and Is_Upload=0 and ScriptType = 'ftp'", eventID.ToString());
            using (System.Data.SqlClient.SqlConnection sqlConn = new System.Data.SqlClient.SqlConnection(magicDBConnectionString))
            {
                sqlConn.Open();
                System.Data.SqlClient.SqlCommand sqlCommand = new System.Data.SqlClient.SqlCommand(sqlScript, sqlConn);
                path = (string)sqlCommand.ExecuteScalar();
                sqlConn.Close();
            }
            //Search for data in the targetDBConnectionString if not found. Requested by S.Mariani 11/11/2022
            if (String.IsNullOrEmpty(path))
            {

                using (System.Data.SqlClient.SqlConnection sqlConn = new System.Data.SqlClient.SqlConnection(targetDBConnectionString))
                {
                    sqlConn.Open();
                    //Get the Parent FTP download task's local_path 
                    System.Data.SqlClient.SqlCommand sqlCommand = new System.Data.SqlClient.SqlCommand(sqlScript, sqlConn);
                    path = (string)sqlCommand.ExecuteScalar();
                    sqlConn.Close();
                }
            }
            if (path != null)
            {
                using (System.Data.SqlClient.SqlConnection sqlConn = new System.Data.SqlClient.SqlConnection(targetDBConnectionString))
                {
                    sqlConn.Open();
                    int TIPFILE_ID = (int)new System.Data.SqlClient.SqlCommand(string.Format("SELECT TIPFILE_ID FROM dbo.TIPFILE_type_file WHERE TIPFILE_PATH = '{0}'", path), sqlConn).ExecuteScalar();
                    Dictionary<string, string> files = new Dictionary<string, string>();
                    foreach (string file in Directory.EnumerateFiles(path, "*"))
                    {
                        System.Data.SqlClient.SqlCommand sqlCommand = new System.Data.SqlClient.SqlCommand("INSERT INTO dbo.FilesToMove(GUID,createdate,filename,tipfile_id,elaborated,error) VALUES(@guid,@date,@filename,@tipfile_id,@elaborated,@error)", sqlConn);
                        Guid guid = Guid.NewGuid();
                        files.Add(guid.ToString(), file);
                        sqlCommand.Parameters.AddWithValue("@guid", guid);
                        sqlCommand.Parameters.AddWithValue("@date", DateTime.Now);
                        sqlCommand.Parameters.AddWithValue("@filename", Path.GetFileName(file));
                        sqlCommand.Parameters.AddWithValue("@tipfile_id", TIPFILE_ID);
                        sqlCommand.Parameters.AddWithValue("@elaborated", false);
                        sqlCommand.Parameters.AddWithValue("@error", false);
                        sqlCommand.ExecuteNonQuery();
                    }

                    System.Data.SqlClient.SqlCommand cmd = new System.Data.SqlClient.SqlCommand("CORE.DO_DP_CARICA_FILES", sqlConn);
                    cmd.CommandTimeout = 300; //5 mins
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.ExecuteNonQuery();

                    if (files.Keys.Count > 0) 
                    {
                        DataSet filesToMoveSet = new DataSet();
                        new System.Data.SqlClient.SqlDataAdapter(String.Format("SELECT * FROM dbo.FilesToMove WHERE GUID IN ('{0}') AND error != 1", string.Join("','", files.Keys)), sqlConn).Fill(filesToMoveSet);
                        if (filesToMoveSet.Tables.Count > 0)
                        {
                            foreach (DataRow fileToMove in filesToMoveSet.Tables[0].AsEnumerable())
                            {
                                bool success = true;
                                System.Data.SqlClient.SqlCommand updateCommand = new System.Data.SqlClient.SqlCommand("UPDATE dbo.FilesToMove SET elaborated = @elaborated, error = @error WHERE GUID = @guid", sqlConn);
                                updateCommand.Parameters.AddWithValue("@guid", fileToMove["GUID"].ToString());
                                //Modifica richiesta da S. Mariani 26/10/2017 --> se il path e' nullo allora e' un errore, se = a '' invece significa che lo spostamento non serve.
                                if (fileToMove["pathfile"] == DBNull.Value)
                                    success = false;
                                else
                                {
                                    try
                                    {
                                        string filePath = files[fileToMove["GUID"].ToString()];
                                        string destPath = fileToMove["pathfile"].ToString();
                                        string destFile = Path.Combine(destPath, Path.GetFileName(filePath));

                                        if (!String.IsNullOrEmpty(filePath) && !String.IsNullOrEmpty(destPath))
                                        {
                                            if (!Directory.Exists(destPath))
                                                Directory.CreateDirectory(destPath);
                                            else if (File.Exists(destFile))
                                                File.Delete(destFile);

                                            Files.CopyInTrash(filePath, targetDBConnectionString, null, destFile);

                                            File.Move(filePath, destFile);
                                            success = File.Exists(destFile);
                                        }
                                    }
                                    catch (Exception e) {
                                        Debug.WriteLine(e.Message);
                                        success = false;
                                    }
                                }
                                updateCommand.Parameters.AddWithValue("@elaborated", success);
                                updateCommand.Parameters.AddWithValue("@error", !success);
                                updateCommand.ExecuteNonQuery();
                            }
                        }
                     }
                    sqlConn.Close();
                     
                }
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="eventID"></param>
        /// <param name="targetDBConnectionString"></param>
        /// <param name="magicDBConnectionString"></param>
        public static void RunABatchFile(int eventID, string targetDBConnectionString, string magicDBConnectionString) {
            string fullBatPath = String.Empty;
            using (SqlConnection sqlConn = new SqlConnection(targetDBConnectionString))
            {
                sqlConn.Open();
                fullBatPath = new SqlCommand($"SELECT BatchPath FROM config.ExecutableListEvent WHERE Event_ID = {eventID}", sqlConn).ExecuteScalar().ToString();
                if (String.IsNullOrEmpty(fullBatPath))
                    throw new ArgumentException($"BatchPath not found for event {eventID} !!!");
                var process = new Process()
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = $"cmd /C \"{fullBatPath}\"",
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    }
                };
                process.Start();
            }
        }
    }
}
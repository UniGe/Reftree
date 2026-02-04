using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;

namespace MagicFramework.Helpers
{
    public class DocumentTraceManager
    {
        public string Filename { get; set; }
        public string Format { get; set; }
        public Byte[] FileContent { get; set; }
        public string BusinessObjectID { get; set; }
        public string BusinessObjectType { get; set; }
        public int DocumentTypeID { get; set; }
        public string Tags { get; set; }
       
        public DocumentTraceManager(string format, Byte[] downloadBytes, string businessObjectID, string businessObjectType, string doctype,string tags)
        {
            this.Filename = DateTime.UtcNow.Ticks.ToString() + "."+format;
            this.Format = format;
            this.FileContent = downloadBytes;
            this.BusinessObjectID = businessObjectID;
            this.BusinessObjectType = businessObjectType;
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            int doctypeID = (from e in _context.Magic_DocumentRepositoryType where e.Code == doctype select e.ID).FirstOrDefault();
            this.DocumentTypeID = doctypeID;
            this.Tags = tags;
        }

        public static int LogFile(DocumentLogFile data)
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());

            var insertionDate = DateTime.UtcNow;
            var newdocument = new Data.Magic_DocumentRepository();
            newdocument.BusinessObject_ID = data.BOId;
            newdocument.BusinessObjectType = data.BOType;
            newdocument.CreatorUser_ID = Helpers.SessionHandler.IdUser;
            newdocument.DocumentFile = data.File;
            if (data.DocumentTypeID != 0)
                newdocument.DocumentType_ID = data.DocumentTypeID;
            newdocument.InsertionDate = insertionDate;
            newdocument.UserGroupVisibility_ID = Helpers.SessionHandler.UserVisibilityGroup;
            newdocument.Transmitted = true;
            newdocument.TransmissionDate = insertionDate;
            newdocument.TransmissionReceiptReceived = false;
            newdocument.DocumentJSONTags = "";
            newdocument.TransmissionMode = data.TransmissionMode;
            _context.Magic_DocumentRepository.InsertOnSubmit(newdocument);
            _context.SubmitChanges();
            return newdocument.ID;
        }

        public void WriteToTable()
        {
            string path = String.Empty;
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            var paths  = (from e in _context.Magic_FileTypeUpload where e.MagicUploadExtensions.Contains(this.Format) select e);
            foreach (var p in paths)
            {
                var splitted = p.MagicUploadExtensions.Split('@').ToList();
                foreach (var s in splitted)
                {
                    if (s == this.Format)
                    {
                        path = p.ApplicationSavePath;
                        break;
                    }
                }
            }
            string root = HttpContext.Current.Server.MapPath("~").Substring(0,HttpContext.Current.Server.MapPath("~").Length-1);
            using (BinaryWriter writer = new BinaryWriter(File.Open(root + path +"\\"+ this.Filename, FileMode.Create)))
            {
                writer.Write(this.FileContent);
                writer.Flush();
            }
            var newdocument = new Data.Magic_DocumentRepository();
            newdocument.BusinessObject_ID = this.BusinessObjectID;
            newdocument.BusinessObjectType = this.BusinessObjectType;
            newdocument.CreatorUser_ID = Helpers.SessionHandler.IdUser;
            newdocument.DocumentFile = path + "\\" + this.Filename;
            newdocument.DocumentType_ID = this.DocumentTypeID;
            newdocument.InsertionDate = DateTime.UtcNow;
            newdocument.UserGroupVisibility_ID = Helpers.SessionHandler.UserVisibilityGroup;
            newdocument.Transmitted = false;
            newdocument.TransmissionReceiptReceived = false;
            newdocument.DocumentJSONTags = "{ tags:\""+Tags+"\"}";
            _context.Magic_DocumentRepository.InsertOnSubmit(newdocument);
            _context.SubmitChanges();
        }

    }

    public class DocumentLogFile
    {
        public string File { get; set; }
        public string BOId { get; set; }
        public string BOType { get; set; }
        public int DocumentTypeID { get; set; }
        public string TransmissionMode { get; set; }
    }
}
using DevExpress.Office.Utils;
using MagicFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Mail;
using System.Reflection;
using System.Web;
using System.Xml.Serialization;

namespace MagicSolution
{
    public static class CustomAppStart
    {
        public class Attachment
        {
            public string FileName { get; set; }
            public string Base64Attachment { get; set; }
        }

        public class Mail
        {
            public string Subject { get; set; }
            public List<string> MailAddresses { get; set; }
            public List<string> MailAddressesCC { get; set; }
            public List<string> MailAddressesCCN { get; set; }
            public string HtmlBody { get; set; }
            //public string EmailTypeName { get; set; }
            //public string SendGridCategoryName { get; set; }
            public List<Attachment> Attachment { get; set; }

            public Mail (System.Net.Mail.MailMessage m)
            {
                this.Subject = m.Subject;
                this.MailAddresses = m.To?.Select(t => t.Address).ToList();
                this.MailAddressesCC = m.CC?.Select(t => t.Address).ToList();
                this.MailAddressesCCN = m.Bcc?.Select(t => t.Address).ToList();
                this.HtmlBody = m.Body;

                if (m.Attachments == null)
                {
                    return;
                }
                this.Attachment = new List<Attachment>();
                foreach (var a in m.Attachments)
                {
                    using (StreamReader r = new StreamReader(a.ContentStream))
                    {
                        this.Attachment.Add(new Attachment
                        {
                            FileName = a.Name,
                            Base64Attachment = r.ReadToEnd(),
                        });
                    }
                }
            }
        }

        public class FileUpload
        {
            public string File { get; set; }
            public PhysicsMetadata Metadata { get; set; }
        }

        public partial class PhysicsMetadata
        {
            public Guid Id { get; set; }
            public string FileName { get; set; }
            public string Extension { get; set; }
            public long Weight { get; set; }
            public int? Width { get; set; }
            public int? Height { get; set; }
            public string RepoCode { get; set; }
            public bool Versioning { get; set; }
            public int? VersionNumber { get; set; }
            public Guid? MasterGuid { get; set; }
            public bool? LogicDelete { get; set; }
            public DateTime CreationDate { get; set; }
            public string CreationUser { get; set; }
            public DateTime LastModifyDate { get; set; }
            public string LastModifyUser { get; set; }
            public DateTime? LogicDeleteDate { get; set; }
            public string LogicDeleteUser { get; set; }
            public DateTime? LastDownloadDate { get; set; }
            public DateTime? ArchiveDate { get; set; }
        }

        public class TokenResponse
        {
            public string AccessToken { get; set; }
        }

        public static Func<string> FetchAPITokenFunction (string url, string instanceID)
        {
            return () => { 
                var settings = new MagicFramework.Helpers.MFConfiguration().GetApplicationInstanceByID(url, instanceID)
                        .CustomSettings
                        .Where(s => s.Key.StartsWith("FERCAM_FILES_"));
                string body = settings.Where(s => s.Key.Contains("TOKEN_REQUEST_BODY")).FirstOrDefault().Value;
                string endpointURL = settings.Where(s => s.Key.Contains("TOKEN_REQUEST_URL")).FirstOrDefault().Value;

                var response = MagicFramework.Helpers.HTTP.POSTFormURLEncoded(endpointURL, body);
                return "Bearer " + Newtonsoft.Json.JsonConvert.DeserializeObject<TokenResponse>(
                    MagicFramework.Helpers.HTTP.ContentToString(response),
                    new Newtonsoft.Json.JsonSerializerSettings { 
                        ContractResolver = new Newtonsoft.Json.Serialization.DefaultContractResolver {
                            NamingStrategy = new Newtonsoft.Json.Serialization.SnakeCaseNamingStrategy()
                        }
                    }
                ).AccessToken;
            };
        }

        public static Func<bool, string> GetToken(string url, string instanceID)
        {
            return (bool isRefresh) =>
            {
                return MagicFramework.Helpers.HTTP.InstanceCache("FERCAM_FILES_API_TOKEN", FetchAPITokenFunction(url, instanceID), isRefresh, url, instanceID);
            };
        }

        public static void OnStart()
        {
            AddCustomEmailSender();
        }


        public static void AddCustomEmailSender()
        {
            MagicFramework.Helpers.Mailer.CustomSendMail = (System.Net.Mail.MailMessage message, string url, string instanceID) =>
            {
                // Generate a unique file name using a GUID
                string uniqueFileName = $"mailMessage_{Guid.NewGuid()}.xml";
                string xmlFilePath = Path.Combine(Path.GetTempPath(), uniqueFileName);

                // Serialize the mail message to XML
                SerializableMailMessage serializableMailMessage = new SerializableMailMessage(message);
                using (FileStream fileStream = new FileStream(xmlFilePath, FileMode.Create))
                {
                    XmlSerializer xmlSerializer = new XmlSerializer(typeof(SerializableMailMessage));
                    xmlSerializer.Serialize(fileStream, serializableMailMessage);
                }

                // Determine the application root directory
                var batFilePath = new MagicFramework.Helpers.MFConfiguration().GetApplicationInstanceByID(url, instanceID)
                                         .CustomEmailSenderPath;
                

                // Ensure the batch file exists
                if (!File.Exists(batFilePath))
                {
                    throw new FileNotFoundException("Batch file not found", batFilePath);
                }

                // Call the batch file with the XML file path as an argument
                string arguments = $"\"{xmlFilePath}\"";
                var processInfo = new ProcessStartInfo(batFilePath, arguments)
                {
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                };

                using (var process = Process.Start(processInfo))
                {
                    string processOutput = process.StandardOutput.ReadToEnd();
                    string processError = process.StandardError.ReadToEnd();
                    process.WaitForExit();
                    if (process.ExitCode != 0 || !string.IsNullOrEmpty(processError))
                    {
                        string xmlContent = File.ReadAllText(xmlFilePath);

                        // Delete the XML file
                        if (File.Exists(xmlFilePath))
                        {
                            File.Delete(xmlFilePath);
                        }
                        throw new Exception($"Batch file execution failed with error: {processError}\nOutput: {processOutput}\nXML Content (to debug save the xml on file message.xml and execute ./processMail.bat message.xml):\n{xmlContent}");
                    }
                }
                // Delete the XML file after processing
                if (File.Exists(xmlFilePath))
                {
                    File.Delete(xmlFilePath);
                }
            };
        }
    }



    [Serializable]
    public class SerializableMailMessage
    {
        public string From { get; set; }
        public List<string> To { get; set; }
        public List<string> Cc { get; set; }
        public List<string> Bcc { get; set; }
        public string Subject { get; set; }
        public string Body { get; set; }
        public bool IsBodyHtml { get; set; }
        public List<SerializableAttachment> Attachments { get; set; }

        public SerializableMailMessage()
        {
            To = new List<string>();
            Cc = new List<string>();
            Bcc = new List<string>();
            Attachments = new List<SerializableAttachment>();
        }

        public SerializableMailMessage(MailMessage mailMessage) : this()
        {
            From = mailMessage.From?.Address;
            To = mailMessage.To.Select(a => a.Address).ToList();
            Cc = mailMessage.CC.Select(a => a.Address).ToList();
            Bcc = mailMessage.Bcc.Select(a => a.Address).ToList();
            Subject = mailMessage.Subject;
            Body = mailMessage.Body;
            IsBodyHtml = mailMessage.IsBodyHtml;
            Attachments = mailMessage.Attachments.Select(a => new SerializableAttachment(a)).ToList();
        }

        public MailMessage ToMailMessage()
        {
            MailMessage mailMessage = new MailMessage();
            if (!string.IsNullOrEmpty(From))
                mailMessage.From = new MailAddress(From);
            foreach (var to in To)
                mailMessage.To.Add(to);
            foreach (var cc in Cc)
                mailMessage.CC.Add(cc);
            foreach (var bcc in Bcc)
                mailMessage.Bcc.Add(bcc);
            mailMessage.Subject = Subject;
            mailMessage.Body = Body;
            mailMessage.IsBodyHtml = IsBodyHtml;
            foreach (var attachment in Attachments)
                mailMessage.Attachments.Add(attachment.ToAttachment());

            return mailMessage;
        }
    }
    [Serializable]
    public class SerializableAttachment
    {
        public string Name { get; set; }
        public byte[] Content { get; set; }
        public string ContentType { get; set; }

        public SerializableAttachment() { }

        public SerializableAttachment(Attachment attachment)
        {
            Name = attachment.Name;
            ContentType = attachment.ContentType.MediaType;
            using (var memoryStream = new MemoryStream())
            {
                attachment.ContentStream.CopyTo(memoryStream);
                Content = memoryStream.ToArray();
            }
        }

        public Attachment ToAttachment()
        {
            var memoryStream = new MemoryStream(Content);
            var attachment = new Attachment(memoryStream, Name, ContentType);
            return attachment;
        }
    }

}
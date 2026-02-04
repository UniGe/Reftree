using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Net.Mail;
using System.Text.RegularExpressions;
using System.Web;
using RazorEngine;
using RazorEngine.Templating; // For extension methods.
using RazorEngine.Configuration;
using RazorEngine.Text;
using PreMailer.Net;
using Newtonsoft.Json;
using System.Dynamic;
using System.IO;
using MagicFramework.Data;

namespace MagicFramework.Helpers
{
    public class DefaultSmtpCredentials
    {
        public string Address { get; set; }
        public string FromName { get; set; }
        public string Password { get; set; }
        public int Port { get; set; }
        public bool SSL { get; set; }
        public string ServerURL { get; set; }
        public string domainUrl { get; set; }
        public string instanceId { get; set; }
        public bool IsPec { get; set; }
        public string SMTPAccountName { get; set; }
    }

    public interface IRazorTemplateBuffer
    {
        string getCache(string aTemplateKey);
        void setCache(string aTemplateKey, string aContent);
        string getHash(string aContent);
    }

    public class MailParseResult
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
        public MailParseErrorType ErrorType { get; set; }
        public string FailedComponent { get; set; }
        public Dictionary<string, string> FailedAttachments { get; set; }

        public MailParseResult()
        {
            Success = true;
            FailedAttachments = new Dictionary<string, string>();
        }

        public static MailParseResult CreateSuccess()
        {
            return new MailParseResult { Success = true };
        }

        public static MailParseResult CreateError(string message, MailParseErrorType errorType, string component)
        {
            return new MailParseResult
            {
                Success = false,
                ErrorMessage = message,
                ErrorType = errorType,
                FailedComponent = component
            };
        }
    }

    public enum MailParseErrorType
    {
        AttachmentNotFound,
        AttachmentAccessError,
        InvalidRecipient,
        TemplateError,
        GeneralError
    }

    public class AttachmentResult
    {
        public bool Success { get; set; }
        public string ErrorMessage { get; set; }
        public string Path { get; set; }
    }
 
    public class Mailer : IDisposable
    {
        private string domainUrl;
        private string instanceId;
        private DefaultSmtpCredentials credentials;

        public static Action<System.Net.Mail.MailMessage, string, string> CustomSendMail { get; set; } = null;

        private string template;
        private string translatedTemplate;
        private System.Net.Mail.MailMessage message = new MailMessage();
        System.Web.Mail.MailMessage pecMessage;
        System.Web.Mail.SmtpMail pecServer;
        List<string> pecAttachmentPathsToDeleteAfterSend;
        private SmtpClient smtp;

        public Mailer()
        {
            this.domainUrl = SessionHandler.ApplicationDomainURL;
            this.instanceId = SessionHandler.ApplicationInstanceId;
            SetSMTPClient(GetDefaultSmtpCredentials(this.domainUrl, this.instanceId));
        }

        public Mailer(string domainUrl, string instanceId)
        {
            this.domainUrl = domainUrl;
            this.instanceId = instanceId;
            SetSMTPClient(GetDefaultSmtpCredentials(this.domainUrl, this.instanceId));
        }

        public Mailer(string domainUrl, string instanceId, DefaultSmtpCredentials credentials)
        {
            this.domainUrl = domainUrl;
            this.instanceId = instanceId;
            SetSMTPClient(credentials);
        }

        public Mailer(bool noInit)
        {
        }

        public Mailer(bool noInit, string domainUrl, string instanceId)
        {
            this.domainUrl = domainUrl;
            this.instanceId = instanceId;
        }

        public void SetSMTPClient(DefaultSmtpCredentials credentials)
        {
            this.credentials = credentials;
            if (credentials.IsPec)
            {
                pecMessage = new System.Web.Mail.MailMessage();
                pecMessage.Fields.Add("http://schemas.microsoft.com/cdo/configuration/smtpserver", credentials.ServerURL);
                pecMessage.Fields.Add("http://schemas.microsoft.com/cdo/configuration/smtpserverport", credentials.Port);
                pecMessage.Fields.Add("http://schemas.microsoft.com/cdo/configuration/sendusing", "2"); //Send the message using the network (SMTP over the network)
                pecMessage.Fields.Add("http://schemas.microsoft.com/cdo/configuration/smtpauthenticate", "1");      // questo va bene hardcoded
                pecMessage.Fields.Add("http://schemas.microsoft.com/cdo/configuration/sendusername", credentials.SMTPAccountName ?? credentials.Address);
                pecMessage.Fields.Add("http://schemas.microsoft.com/cdo/configuration/sendpassword", credentials.Password);
                pecMessage.Fields.Add("http://schemas.microsoft.com/cdo/configuration/smtpusessl", credentials.SSL ? "true" : "false");
                pecMessage.From = credentials.Address;
                pecMessage.Priority = System.Web.Mail.MailPriority.High;
                System.Web.Mail.SmtpMail.SmtpServer = credentials.ServerURL + ":" + credentials.Port;
                pecAttachmentPathsToDeleteAfterSend = new List<string>();
            }
            else
            {
                smtp = new SmtpClient(credentials.ServerURL, credentials.Port);
                smtp.UseDefaultCredentials = false;
                smtp.Credentials = new System.Net.NetworkCredential(credentials.SMTPAccountName ?? credentials.Address, credentials.Password);
                smtp.DeliveryMethod = SmtpDeliveryMethod.Network;
                smtp.EnableSsl = credentials.SSL;
                smtp.Port = credentials.Port;
                smtp.Timeout = 18000;
                this.message.From = new MailAddress(credentials.Address, credentials.FromName);
            }
        }

        public void SetSMTPClient(Data.Magic_MailAccounts mailAccount, string decryptedPassword)
        {
            SetSMTPClient(new DefaultSmtpCredentials()
            {
                ServerURL = mailAccount.uri,
                Port = mailAccount.port,
                Address = mailAccount.email,
                Password = decryptedPassword,
                SSL = mailAccount.tls_or_ssl,
                FromName = mailAccount.from_name,
                IsPec = mailAccount.is_pec,
                SMTPAccountName = string.IsNullOrEmpty(mailAccount.smtp_account_name) ? null : mailAccount.smtp_account_name
            });
        }

        public void SetSMTPClient(Data.Magic_MailAccounts mailAccount)
        {
            SetSMTPClient(mailAccount, MagicFramework.Controllers.GenericSqlCommandController.DecryptPassword(mailAccount.password));
        }

        public void SetBody(string body, bool isBodyHtml = true)
        {
            this.translatedTemplate = body;
            if (credentials.IsPec)
            {
                pecMessage.BodyFormat = isBodyHtml ? System.Web.Mail.MailFormat.Html : System.Web.Mail.MailFormat.Text;
                pecMessage.Body = body;
            }
            else
            {
                message.IsBodyHtml = isBodyHtml;
                message.Body = body;
            }
        }

        public void SetSubject(string subject)
        {
            if (credentials.IsPec)
                pecMessage.Subject = subject;
            else
                message.Subject = subject;
        }

        public string GetSubject()
        {
            if (credentials.IsPec)
                return pecMessage.Subject;
            return message.Subject;
        }
        public void AddReplyToList(string emails)
        {
            string[] addresses = emails.Split(',');
            foreach (var a in addresses)
            {
                if (Utils.IsValidEmail(a))
                    message.ReplyToList.Add(new MailAddress(a));
            }
        }

        public void AddReplyTo(MailAddress mail)
        {
            if (!credentials.IsPec)
                message.ReplyToList.Add(mail);
        }

        public bool LoadTemplate(string templateName)
        {
            this.template = null;
            this.translatedTemplate = null;
            if (credentials.IsPec)
                pecMessage.BodyFormat = System.Web.Mail.MailFormat.Html;
            else
                message.IsBodyHtml = true;
            string basePath = Utils.GetBasePath();
            string defaultPath = basePath + @"Magic\Views\Templates\Mail\" + templateName;
            string customPath = basePath + @"Views\" + SessionHandler.ApplicationInstanceId + @"\Templates\Mail\" + templateName;
            this.template = Utils.ReturnFirstFileThatExists(customPath, defaultPath);
            if (this.template != null)
            {
                if (credentials.IsPec)
                    this.pecMessage.Body = this.template;
                else
                    this.message.Body = this.template;
                return true;
            }
            return false;
        }

        public bool LoadTemplateFromDb(string code)
        {
            int cultureid = 0;
            bool defaultLanguage = false;
            if (!int.TryParse(HttpContext.Current.Session["UserCultureID"].ToString(), out cultureid))
            {
                cultureid = GetDefaultLanguageId();
                defaultLanguage = true;
            }
            if (LoadTemplateFromDb(code, cultureid))
                return true;
            else
            {
                Data.MagicDBEntities context = new Data.MagicDBEntities(DBConnectionManager.GetTargetEntityConnectionString());
                var dbMessages = context.Magic_SystemMessages.Where(_ => _.Code.Equals(code)).ToList();
                if (dbMessages.Count != 0)
                {
                    Data.Magic_SystemMessages message;
                    if (!defaultLanguage)
                    {
                        cultureid = GetDefaultLanguageId();
                        message = dbMessages.Where(_ => _.CultureId == cultureid).FirstOrDefault();
                        if (message != null)
                            return ParseDbMessage(message).Success;
                    }
                    message = dbMessages.FirstOrDefault();
                    if (message != null)
                        return ParseDbMessage(message).Success;
                }
                MFLog.LogInFile("MagicFramework.Helpers.Mailer@LoadTemplateFromDb: No template in db for code: " + code, MFLog.logtypes.WARN);
                return false;
            }
        }

        public static int GetDefaultLanguageId()
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            return (from e in _context.Magic_Cultures where e.Magic_CultureLanguage == "it-IT" select e.Magic_CultureID).First();
        }

        public bool LoadTemplateFromDb(string code, int cultureId, bool useDefaultIfNotFound = false)
        {
            Data.MagicDBEntities context = new Data.MagicDBEntities(DBConnectionManager.GetTargetEntityConnectionString());
            this.template = null;
            this.translatedTemplate = null;
            var dbMessage = context.Magic_SystemMessages.Where(_ => _.Code.Equals(code)).Where(_ => _.CultureId == cultureId).FirstOrDefault();
            if (dbMessage != null && !String.IsNullOrEmpty(dbMessage.Body))
            {
                return ParseDbMessage(dbMessage).Success;
            }
            if (useDefaultIfNotFound)
                return LoadTemplateFromDb(code);
            return false;
        }


        private void AddTo(string emailAddress)
        {
            emailAddress = emailAddress.Trim();
            if (credentials.IsPec)
            {
                if (pecMessage.To == null)
                    pecMessage.To = "";
                pecMessage.To += ";" + emailAddress;
                pecMessage.To = pecMessage.To.TrimStart(';');
            }
            else
                this.message.To.Add(GetMailAddress(emailAddress));
        }

        private void AddCC(string emailAddress)
        {
            emailAddress = emailAddress.Trim();
            if (credentials.IsPec)
            {
                if (pecMessage.Cc == null)
                    pecMessage.Cc = "";
                pecMessage.Cc += ";" + emailAddress;
                pecMessage.Cc = pecMessage.Cc.TrimStart(';');
            }
            else
                this.message.CC.Add(GetMailAddress(emailAddress));
        }

        private void AddBCC(string emailAddress)
        {
            emailAddress = emailAddress.Trim();
            if (credentials.IsPec)
            {
                if (pecMessage.Bcc == null)
                    pecMessage.Bcc = "";
                pecMessage.Bcc += ";" + emailAddress;
                pecMessage.Bcc = pecMessage.Bcc.TrimStart(';');
            }
            else
                this.message.Bcc.Add(GetMailAddress(emailAddress));
        }

        public static string GetAttachmentPath(MFConfiguration.ApplicationInstanceConfiguration config, bool createDirectoryIfNotExists = true)
        {
            string directory = string.IsNullOrEmpty(config.directorylog) ? Utils.GetBasePath() : config.directorylog;
            directory = Path.Combine(directory, "MSSQLFileTableAttachments");
            if (createDirectoryIfNotExists)
                Directory.CreateDirectory(directory);
            return directory;
        }

        private AttachmentResult AddAttachment(string attachmentPath)
        {
    

            try
            {
                if (!credentials.IsPec)
                {
                    if (!System.IO.File.Exists(attachmentPath))
                    {
                        return new AttachmentResult
                        {
                            Success = false,
                            Path = attachmentPath,
                            ErrorMessage = "File not found on disk"
                        };
                    }

                    // Read the file into memory and close the file immediately
                    var attachment = new System.Net.Mail.Attachment(attachmentPath);
                    attachment.ContentDisposition.DispositionType = System.Net.Mime.DispositionTypeNames.Attachment;
                    attachment.ContentDisposition.FileName = Path.GetFileName(attachmentPath);
                    this.message.Attachments.Add(attachment);
                }
                else
                {
                    if (!System.IO.File.Exists(attachmentPath))
                    {
                        return new AttachmentResult
                        {
                            Success = false,
                            Path = attachmentPath,
                            ErrorMessage = "File not found on disk (PEC)"
                        };
                    }
                    pecMessage.Attachments.Add(new System.Web.Mail.MailAttachment(attachmentPath));
                }

                return new AttachmentResult { Success = true, Path = attachmentPath };
            }
            catch (Exception ex)
            {
                return new AttachmentResult
                {
                    Success = false,
                    Path = attachmentPath,
                    ErrorMessage = $"Error processing attachment: {ex.Message}"
                };
            }
        }
        public MailParseResult ParseDbMessage(IMessageTemplate dbMessage)
        {
            var result = new MailParseResult();

            try
            {
                this.template = dbMessage.Body;
                if (!String.IsNullOrEmpty(dbMessage.Subject))
                {
                    SetSubject(dbMessage.Subject);
                }

                if (!String.IsNullOrEmpty(dbMessage.To))
                {
                    try
                    {
                        foreach (string address in dbMessage.To.Split(','))
                        {
                            if (!Utils.IsValidEmail(address.Trim()))
                            {
                                return MailParseResult.CreateError(
                                    $"Invalid 'To' email address: {address}",
                                    MailParseErrorType.InvalidRecipient,
                                    "To"
                                );
                            }
                            AddTo(address);
                        }
                    }
                    catch (Exception ex)
                    {
                        return MailParseResult.CreateError(
                            $"Error processing 'To' addresses: {ex.Message}",
                            MailParseErrorType.InvalidRecipient,
                            "To"
                        );
                    }
                }
                if (!String.IsNullOrEmpty(dbMessage.cc))
                {
                    try
                    {
                        foreach (string address in dbMessage.cc.Split(','))
                        {
                            if (!Utils.IsValidEmail(address.Trim()))
                            {
                                return MailParseResult.CreateError(
                                    $"Invalid 'CC' email address: {address}",
                                    MailParseErrorType.InvalidRecipient,
                                    "CC"
                                );
                            }
                            AddCC(address);
                        }
                    }
                    catch (Exception ex)
                    {
                        return MailParseResult.CreateError(
                            $"Error processing 'CC' addresses: {ex.Message}",
                            MailParseErrorType.InvalidRecipient,
                            "CC"
                        );
                    }
                }
                // Handle BCC addresses
                if (!String.IsNullOrEmpty(dbMessage.ccn))
                {
                    try
                    {
                        foreach (string address in dbMessage.ccn.Split(','))
                        {
                            if (!Utils.IsValidEmail(address.Trim()))
                            {
                                return MailParseResult.CreateError(
                                    $"Invalid 'BCC' email address: {address}",
                                    MailParseErrorType.InvalidRecipient,
                                    "BCC"
                                );
                            }
                            AddBCC(address);
                        }
                    }
                    catch (Exception ex)
                    {
                        return MailParseResult.CreateError(
                            $"Error processing 'BCC' addresses: {ex.Message}",
                            MailParseErrorType.InvalidRecipient,
                            "BCC"
                        );
                    }
                }
                // Handle attachments
                if (!String.IsNullOrEmpty(dbMessage.Attachments))
                {
                    foreach (string attachmentPath in dbMessage.Attachments.Split(','))
                    {
                        var attachmentResult = AddAttachment(attachmentPath.Trim());
                        if (!attachmentResult.Success)
                        {
                            result.FailedAttachments.Add(attachmentPath, attachmentResult.ErrorMessage);
                        }
                    }

                    if (result.FailedAttachments.Any())
                    {
                        result.Success = false;
                        result.ErrorType = MailParseErrorType.AttachmentNotFound;
                        result.FailedComponent = "Attachments";
                        result.ErrorMessage = $"Failed to process {result.FailedAttachments.Count} attachment(s): " +
                            string.Join("; ", result.FailedAttachments.Select(x => $"{x.Key}: {x.Value}"));
                        return result;
                    }
                }
                try
                {
                    SetBody(dbMessage.Body, dbMessage.IsHtml);
                }
                catch (Exception ex)
                {
                    return MailParseResult.CreateError(
                        $"Error setting email body: {ex.Message}",
                        MailParseErrorType.TemplateError,
                        "Body"
                    );
                }
                return MailParseResult.CreateSuccess();
            }
            catch (Exception ex)
            {
                return MailParseResult.CreateError(
                    $"Unexpected error during message parsing: {ex.Message}",
                    MailParseErrorType.GeneralError,
                    "General"
                );
            }
        }
        public int GetAttachmentCount()
        {
            if (credentials.IsPec)
                return pecMessage.Attachments.Count;
            else
                return message.Attachments.Count;
        }
        private MailAddress GetMailAddress(string mailAddress)
        {
            return new MailAddress(mailAddress);
        }

        private string EncodeSpecialChars(string tagValue)
        {
            if (Regex.Match(tagValue, @"<(\s*[(\/?)\w+]*)").Success)
                return tagValue;
            else
                return HttpUtility.HtmlEncode(tagValue);
        }

        private Dictionary<string, string> SanitizeHtmlTags(Dictionary<string, string> tags)
        {
            Dictionary<string, string> ret = new Dictionary<string, string>(tags.Count, tags.Comparer);

            foreach (KeyValuePair<string, string> k in tags)
            {
                ret.Add(k.Key, EncodeSpecialChars(k.Value));
            }
            return ret;
        }

        public bool ReplaceTags(Dictionary<string, string> tags, string openTag = "-#", string closeTag = "#-")
        {
            if (this.template == null)
                return false;
            this.translatedTemplate = null;
            if ((!credentials.IsPec && this.message.IsBodyHtml) || (credentials.IsPec && this.pecMessage.BodyFormat == System.Web.Mail.MailFormat.Html))
                tags = this.SanitizeHtmlTags(tags);
            this.translatedTemplate = Utils.ReplaceTags(this.template, tags, openTag, closeTag);
            if (!String.IsNullOrEmpty(GetSubject()))
                SetSubject(Utils.ReplaceTags(GetSubject(), tags, openTag, closeTag));
            if (this.translatedTemplate != null)
            {
                SetBody(this.translatedTemplate);
                return true;
            }
            return false;
        }


        public bool ParseRazor(IRazorTemplateBuffer buffer, string templateCode, Newtonsoft.Json.Linq.JObject razorData)
        {
            if (this.template == null)
                return false;

            this.translatedTemplate = null;

            string isRazorCached = buffer.getCache(templateCode);

            if (isRazorCached == null || isRazorCached != this.template)
            {
                this.translatedTemplate = Engine.Razor.RunCompile(this.template, buffer.getHash(this.template), null, razorData);
                buffer.setCache(templateCode, this.template);
            }
            else
            {
                this.translatedTemplate = Engine.Razor.Run(buffer.getHash(this.template), null, razorData);
            }

            if (this.translatedTemplate != null)
            {

                //check if actual subject is redefined by razor way...
                if (this.GetSubject().StartsWith("@"))
                {
                    String s = this.GetSubject();
                    //Strip first char... in order to get the right object key in razorData           
                    String sKey = s.Substring(1, s.Length - 1);
                    Newtonsoft.Json.Linq.JToken tSubject = razorData[sKey];
                    bool redefinedSubject = (tSubject != null) ? true : false;
                    if (redefinedSubject)
                        this.SetSubject(razorData[sKey].ToString());
                }

                var inlinedCss = PreMailer.Net.PreMailer.MoveCssInline(this.translatedTemplate);
                SetBody(inlinedCss.Html);
                if (credentials.IsPec)
                {
                    pecMessage.BodyEncoding = System.Text.Encoding.UTF8;
                }
                else
                {
                    this.message.BodyEncoding = System.Text.Encoding.UTF8;
                }
                return true;
            }

            return false;

        }

        public string GetTemplate()
        {
            if (this.translatedTemplate != null)
                return this.translatedTemplate;
            if (this.template != null)
                return this.template;
            return null;
        }

        public void SetFrom(string from, string fromName = "")
        {
            if (Utils.IsValidEmail(from))
            {
                if (credentials.IsPec)
                    this.pecMessage.From = from;
                else
                    this.message.From = new MailAddress(from, fromName);
            }
        }

        public void SetTo(string to, string toName = "")
        {
            if (credentials.IsPec)
            {
                pecMessage.To = to;
            }
            else
            {
                int tos = this.message.To.Count;
                if (tos > 0)
                {
                    for (int i = 0; i < tos; i++)
                    {
                        this.message.To.RemoveAt(0);
                    }
                }
                this.message.To.Add(new System.Net.Mail.MailAddress(to, toName));
            }
        }

        public bool IsMailReadyToSend()
        {
            if (!IsMailHaveTo() || String.IsNullOrEmpty(this.GetTemplate()))
                return false;
            return true;
        }

        public bool IsMailHaveTo()
        {
            if (credentials.IsPec)
            {
                if (string.IsNullOrEmpty(pecMessage.To))
                    return false;
            }
            else
            {
                if (message.To.Count <= 0)
                    return false;
            }
            return true;
        }

        public bool SendAsync(Action<object, AsyncCompletedEventArgs> callback = null, object callbackInfo = null)
        {
            if (this.IsMailReadyToSend())
            {
                if (IsCustomEmailSender(this.domainUrl, this.instanceId))
                {
                    try
                    {
                        CustomSendMail(message, this.domainUrl, this.instanceId);
                        callback?.Invoke(new object { }, new AsyncCompletedEventArgs(null, false, callbackInfo));
                        return true;
                    }
                    catch (Exception e)
                    {
                        if (callback != null)
                        {
                            callback.Invoke(new object { }, new AsyncCompletedEventArgs(e, false, callbackInfo));
                        }
                        else
                        {
                            MFLog.LogInFile("MagicFramework.Helpers.Mailer@SendAsync: Error while sending mail: " + this.domainUrl + " InstanceId: " + this.instanceId + " Exception Message: " + e.Message, MFLog.logtypes.WARN);
                        }
                        return false;
                    }
                }
                else if (credentials.IsPec)
                {
                    return Send();
                }
                else
                {
                    if (callback != null)
                        smtp.SendCompleted += new
                        SendCompletedEventHandler(callback);
                    else
                    {
                        smtp.SendCompleted += new
                        SendCompletedEventHandler(DefaultSendCompleteCallback);
                        callbackInfo = message.To.First().Address;
                    }
                    //Debug.WriteLine("Send: " + message.Body);
                    smtp.SendAsync(message, callbackInfo);
                    return true;
                }
            }
            return false;
        }

        public bool Send()
        {
            if (this.IsMailReadyToSend())
            {
                if (IsCustomEmailSender(this.domainUrl, this.instanceId))
                {
                    try
                    {
                        CustomSendMail(this.message, this.domainUrl, this.instanceId);
                        return true;
                    }
                    catch (Exception e)
                    {
                        MFLog.LogInFile(e, MFLog.logtypes.ERROR);
                        return false;
                    }
                }
                else if (credentials.IsPec)
                {
                    System.Web.Mail.SmtpMail.Send(pecMessage);
                    if (pecAttachmentPathsToDeleteAfterSend.Any())
                    {
                        foreach (string filePath in pecAttachmentPathsToDeleteAfterSend)
                        {
                            try
                            {
                                File.Delete(filePath);
                            }
                            catch (Exception e)
                            {
                                MFLog.LogInFile(e, MFLog.logtypes.WARN);
                            }
                        }
                    }
                }
                else
                {
                    try
                    {
                        this.smtp.Send(message);
                    }
                    catch (Exception e)
                    {
                        MFLog.LogInFile(e, MFLog.logtypes.ERROR);
                        return false;
                    }
                }
                return true;
            }
            return false;
        }

        public static bool IsCustomEmailSender(string url,string instanceId) {
            try
            {
                var CustomEmailSenderActive = new MagicFramework.Helpers.MFConfiguration().GetApplicationInstanceByID(url, instanceId)
                          .CustomEmailSenderPath;
                return CustomSendMail != null && !String.IsNullOrEmpty( CustomEmailSenderActive);
            }
			catch (Exception ex)
			{
                return false;
            }
        }

        public static bool isDefaultMailAccountSet(string domainUrl, string instanceId)
        {
            return new MFConfiguration(domainUrl).GetApplicationInstanceByID(domainUrl, instanceId).defaultSendMail != null;
        }

        public static DefaultSmtpCredentials GetDefaultSmtpCredentials(string domainUrl, string instanceId)
        {
            try
            {
                return GetDefaultSmtpCredentialsSilent(domainUrl, instanceId);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("MagicFramework.Helpers.Mailer@GetDefaultSmtpCredentials: Error while parsing defaultSendMail from Configuration File: " + domainUrl + " InstanceId: " + instanceId + " Exception Message: " + ex.Message, MFLog.logtypes.WARN);
                return null;
            }
        }

        public static DefaultSmtpCredentials GetDefaultSmtpCredentialsSilent(string domainUrl, string instanceId)
        {
            String[] cred = new MFConfiguration(domainUrl).GetApplicationInstanceByID(domainUrl, instanceId).defaultSendMail.Split(',');
           
            MFLog.LogInFile($"Reading default send mail for {domainUrl} appInstance {instanceId}: {Newtonsoft.Json.JsonConvert.SerializeObject(cred)}",MFLog.logtypes.INFO);

            DefaultSmtpCredentials credentials = new DefaultSmtpCredentials();
            credentials.FromName = cred[0];
            credentials.Address = cred[1];
            credentials.ServerURL = cred[2];
            credentials.Password = cred[3];
            credentials.SSL = cred[4].Equals("true");
            credentials.Port = Int32.Parse(cred[5]);
            credentials.domainUrl = domainUrl;
            credentials.instanceId = instanceId;
            if (cred.Length == 7 && !string.IsNullOrEmpty(cred[6]))
            {
                credentials.SMTPAccountName = cred[6];
            }
            return credentials;
        }

        public static DefaultSmtpCredentials GetDefaultSmtpCredentials()
        {
            return GetDefaultSmtpCredentials(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
        }

        /// <summary>
        /// DONT USE THIS FUNCTION, THIS FUNCTION ONLY EXISTS FOR BACKWARDS COMPATIBILITY, use SendMail without warning in comment instead
        /// </summary>
        /// <param name="domainUrl"></param>
        /// <param name="instanceId"></param>
        /// <param name="message"></param>
        /// <param name="callback"></param>
        /// <param name="callbackInfo"></param>
        public static void SendMailFromDefaultMailAccount(string domainUrl, string instanceId, MailMessage message, Action<object, AsyncCompletedEventArgs> callback = null, object callbackInfo = null)
        {
            DefaultSmtpCredentials credentials = GetDefaultSmtpCredentials(domainUrl, instanceId);
            if (credentials != null)
                SendMail(credentials, message, callback, callbackInfo);
        }

        /// <summary>
        /// DONT USE THIS FUNCTION, THIS FUNCTION ONLY EXISTS FOR BACKWARDS COMPATIBILITY, use SendMail without warning in comment instead
        /// </summary>
        /// <param name="message"></param>
        /// <param name="callback"></param>
        /// <param name="callbackInfo"></param>
        public static void SendMailFromDefaultMailAccount(MailMessage message, Action<object, AsyncCompletedEventArgs> callback = null, object callbackInfo = null)
        {
            DefaultSmtpCredentials credentials = GetDefaultSmtpCredentials(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
            if (credentials != null)
                SendMail(credentials, message, callback, callbackInfo);
        }

        /// <summary>
        /// DONT USE THIS FUNCTION, THIS FUNCTION ONLY EXISTS FOR BACKWARDS COMPATIBILITY, use SendMail without warning in comment instead
        /// </summary>
        /// <param name="message"></param>
        /// <returns></returns>
        public static bool SendSyncMailFromDefaultMailAccount(MailMessage message)
        {
            DefaultSmtpCredentials credentials = GetDefaultSmtpCredentials(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
            if (credentials != null)
                return SendSyncMail(credentials, message);
            return false;
        }

        /// <summary>
        /// DONT USE THIS FUNCTION, THIS FUNCTION ONLY EXISTS FOR BACKWARDS COMPATIBILITY, use SendMail without warning in comment instead
        /// </summary>
        /// <param name="credentials"></param>
        /// <param name="message"></param>
        /// <param name="callback"></param>
        /// <param name="callbackInfo"></param>
        /// <returns></returns>
        public static bool SendMail(DefaultSmtpCredentials credentials, MailMessage message, Action<object, AsyncCompletedEventArgs> callback = null, object callbackInfo = null)
        {
            if (IsCustomEmailSender(credentials.domainUrl, credentials.instanceId))
            {
                try
                {
                    CustomSendMail(message, credentials.domainUrl, credentials.instanceId);
                    callback?.Invoke(new object { }, new AsyncCompletedEventArgs(null, false, callbackInfo));
                    return true;
                }
                catch (Exception e)
                {
                    if (callback != null)
                    {
                        callback.Invoke(new object { }, new AsyncCompletedEventArgs(e, false, callbackInfo));
                    }
                    else
                    {
                        MFLog.LogInFile("MagicFramework.Helpers.Mailer@SendMail: Error while sending mail: " + credentials.domainUrl + " InstanceId: " + credentials.instanceId + " Exception Message: " + e.Message, MFLog.logtypes.WARN);
                    }
                    return false;
                }
            }

            try
            {
                var smtpClient = new SmtpClient(credentials.ServerURL, credentials.Port);
                smtpClient.UseDefaultCredentials = false;
                smtpClient.Credentials = new System.Net.NetworkCredential(credentials.SMTPAccountName ?? credentials.Address, credentials.Password);
                smtpClient.DeliveryMethod = SmtpDeliveryMethod.Network;
                smtpClient.EnableSsl = credentials.SSL;
                smtpClient.Port = credentials.Port;
                smtpClient.Timeout = 18000;
                if (callback != null)
                    smtpClient.SendCompleted += new
                    SendCompletedEventHandler(callback);
                else
                {
                    smtpClient.SendCompleted += new
                    SendCompletedEventHandler(DefaultSendCompleteCallback);
                    callbackInfo = message.To.First().Address;
                }

                smtpClient.SendAsync(message, callbackInfo);
                return true;
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("MagicFramework.Helpers.Mailer@SendMail: Error while sending mail from Configuration File: " + credentials.domainUrl + " InstanceId: " + credentials.instanceId + " Exception Message: " + ex.Message, MFLog.logtypes.WARN);
                return false;
            }
        }

        /// <summary>
        /// DONT USE THIS FUNCTION, THIS FUNCTION ONLY EXISTS FOR BACKWARDS COMPATIBILITY, use SendMail without warning in comment instead
        /// </summary>
        /// <param name="credentials"></param>
        /// <param name="message"></param>
        /// <returns></returns>
        public static bool SendSyncMail(DefaultSmtpCredentials credentials, MailMessage message)
        {
            try
            {
                var smtpClient = new SmtpClient(credentials.ServerURL, credentials.Port);
                smtpClient.UseDefaultCredentials = false;
                smtpClient.Credentials = new System.Net.NetworkCredential(credentials.SMTPAccountName ?? credentials.Address, credentials.Password);
                smtpClient.DeliveryMethod = SmtpDeliveryMethod.Network;
                smtpClient.EnableSsl = credentials.SSL;
                smtpClient.Port = credentials.Port;
                smtpClient.Timeout = 18000;

                smtpClient.Send(message);
                return true;
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("MagicFramework.Helpers.Mailer@SendMail: Error while sending mail from Configuration File: " + credentials.domainUrl + " InstanceId: " + credentials.instanceId + " Exception Message: " + ex.Message, MFLog.logtypes.WARN);
                return false;
            }
        }

        public static System.Net.Mail.MailMessage FormatCalendarNotificationMail(Data.Magic_Calendar calendarEvent, DefaultSmtpCredentials credentials, string email, string subjectPrefix = "Reminder")
        {
            System.Net.Mail.MailMessage mailMessage = new System.Net.Mail.MailMessage();
            mailMessage.To.Add(new System.Net.Mail.MailAddress(email));
            mailMessage.From = new System.Net.Mail.MailAddress(credentials.Address, credentials.FromName);
            mailMessage.Subject = subjectPrefix + ": " + calendarEvent.title + " (" + calendarEvent.start + ")";
            string body = calendarEvent.title;
            body += "<br>Start: " + calendarEvent.start;
            if (calendarEvent.end.HasValue)
                body += "<br>End: " + calendarEvent.end.Value;
            if (!String.IsNullOrEmpty(calendarEvent.description))
                body += "<br>Description: " + calendarEvent.description;
            mailMessage.Body = body;
            mailMessage.IsBodyHtml = true;
            return mailMessage;
        }

        public static void DefaultSendCompleteCallback(object sender, AsyncCompletedEventArgs e)
        {
            string address = (string)e.UserState;
            if (e.Cancelled)
            {
                MFLog.LogInFile("MagicFramework.Helpers.Mailer: Sending mail cancelled: " + address, MFLog.logtypes.WARN);
            }
            else if (e.Error != null)
            {
                MFLog.LogInFile("MagicFramework.Helpers.Mailer: Error while sending mail to " + address, MFLog.logtypes.WARN);
            }
        }
        public void Dispose()
        {
            if (message != null)
            {
                foreach (var attachment in message.Attachments)
                {
                    attachment.Dispose();
                }
                message.Dispose();
            }

            if (smtp != null)
            {
                smtp.Dispose();
            }
        }
    }
}
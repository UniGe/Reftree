using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using AE.Net.Mail;
using System.Net.Mail;
using Newtonsoft.Json.Linq;
using System.IO;
using HttpUtils;
using MagicFramework.Helpers;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web.SessionState;
using DocumentFormat.OpenXml.Drawing;

namespace MagicFramework.Controllers
{
    public class MailAccountCredentials{
        public string Protocol {get; set;}
        public string Address {get; set;}
        public string AccountName { get; set; }
        public string FromName {get; set;}
        public string Password {get; set;}
        public int Port {get; set;}
        public bool SSL {get; set;}
        public string ServerURL {get; set;}

        public string SMTPServerURL {get; set;}
        public string SMTPAccountName { get; set;}
        public string SMTPPassword {get; set;}
        public int SMTPPort {get; set;}
        public bool SMTPSSL {get; set;}
        public bool isValidForReceive ()
        {
            bool result;
            if (string.IsNullOrEmpty(ServerURL) || (string.IsNullOrEmpty(Address) && string.IsNullOrEmpty(AccountName)) || string.IsNullOrEmpty(Password))
                result = false;
            else
                result = true;

            return result;
        }
    }

    public class MailController : ApiController
    {
        private const int mailsPerPage = 10;

        private enum ErrorTypes { MissingConfiguartion, ConnectionFailed };

        private static string GetConfigErrorMessage(ErrorTypes t)
        {
            string error = String.Empty;
            if (t == ErrorTypes.MissingConfiguartion)
            {
                //Default inglese con gestione per italiano.
                error = "Email account not set up. Go to the personal data form and insert the correct settings.";
                if (SessionHandler.UserCultureCode.ToLower().StartsWith("it"))
                    error = "Account email non configurato o configurazione errata. Vai nei tuoi dati personali per definire le impostazioni.";
            }
            if (t == ErrorTypes.ConnectionFailed)
            {
                error = "Error on connecting to mailbox. (Maybe your credentials are wrong or the mailserver is down)";
                if (SessionHandler.UserCultureCode.ToLower().StartsWith("it"))
                    error = "Errore durante la connessione al server di posta (Controlla le tue impostazioni nei dati personali o verifica che il server sia operativo)";
            }
            return error;
        }

        protected override void Initialize(System.Web.Http.Controllers.HttpControllerContext controllerContext)
        {
            if (!ApplicationSettingsManager.GetMailActive())
                throw new HttpResponseException(System.Net.HttpStatusCode.Forbidden);
            base.Initialize(controllerContext);
        }

        public static MailAccountCredentials GetAccountCredentials()
        {
            try
            {
                Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());

                Data.Magic_Mmb_Users_Extensions userext = (from e in _context.Magic_Mmb_Users_Extensions where e.UserID == MagicFramework.Helpers.SessionHandler.IdUser select e).FirstOrDefault();
                MailAccountCredentials credentials = new MailAccountCredentials();
                credentials.Protocol = userext.MailProtocol ?? "IMAP";
                credentials.Address = userext.Magic_Mmb_Users.Email;
                credentials.AccountName = userext.MailAccountName;
                credentials.Port = !String.IsNullOrEmpty(userext.MailPort) ? int.Parse(userext.MailPort) : 993;
                credentials.ServerURL = userext.MailServerURL;
                credentials.SSL = userext.MailSSL ?? true;
                credentials.SMTPServerURL = userext.SMTPServerURL;
                credentials.SMTPAccountName = string.IsNullOrEmpty(userext.SMTPAccountName) ? null : userext.SMTPAccountName;
                credentials.SMTPPassword = StringCipher.Decrypt(userext.SMTPPassword ?? "xyz", "xyz");
                credentials.SMTPSSL = userext.SMTPSSL ?? true;
                credentials.SMTPPort = !String.IsNullOrEmpty(userext.SMTPPort) ? int.Parse(userext.SMTPPort) : 587;
                credentials.Password = StringCipher.Decrypt(userext.MailPassword ?? "xyz", "xyz");
                return credentials;
            }
            catch
            {
                return null;
            }
        }

        //public class Test {
        //    public string Greetings { get; set; }
        //}

        //[HttpGet]
        //public void TestSend()
        //{
        //    var mailer = new Mailer("magicsolution", "0");
        //    mailer.SetTo("florian.pattis@ilosgroup.com");
        //    mailer.SetBody("hi");
        //    mailer.SetSubject("hi");
        //    mailer.AddAttachment(@"C:\Users\zocke\Pictures\immortal mountains.jpg");
        //    mailer.SendAsync((object sender, System.ComponentModel.AsyncCompletedEventArgs e) =>
        //    {
        //        var t = (Test)e.UserState;

        //    }, new Test { Greetings = "hoila" });
        //}

        #region IMAP

        public static AE.Net.Mail.MailMessage[] IMAPGetMails(MailAccountCredentials credentials, int page, int mailsPerPage, string box = "INBOX")
        {
            ImapClient c = null;
            AE.Net.Mail.MailMessage[] mm = null;
            try
            {
                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;

                c.SelectMailbox(box);

                int mailsInBox = c.GetMessageCount();
                if (mailsInBox == 0)
                    return null;
                int startIndex = mailsInBox - (mailsPerPage * page);
                int endIndex = startIndex + mailsPerPage - 1;
                if (startIndex < 0)
                    startIndex = 0;
                if (endIndex < 0)
                    return null;
                mm = c.GetMessages(startIndex, endIndex, false, false);
            }
            finally
            {
                if(c != null)
                    c.Disconnect();
            }

            return mm;
        }

        public static int IMAPCountMails(MailAccountCredentials credentials, string box = "INBOX")
        {
            ImapClient c = null;
            int mailsInBox = -1;
            try
            {
                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;

                c.SelectMailbox(box);

                mailsInBox = c.GetMessageCount();
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }

            return mailsInBox;
        }

        public static string IMAPSearchMessages(MailAccountCredentials credentials, string searchTerm)
        {
            ImapClient c = null;
            Lazy<AE.Net.Mail.MailMessage>[] searchResult = null;
            JObject o = new JObject();
            try
            {
                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;

                searchResult = c.SearchMessages(
                        SearchCondition.Undeleted()
                            .And(SearchCondition.Text(searchTerm))
                , true);
                List<AE.Net.Mail.MailMessage> initMessages = new List<AE.Net.Mail.MailMessage>();
                int messagesCount = 0;
                foreach (var message in searchResult)
                {
                    initMessages.Add(message.Value);
                    messagesCount++;
                }
                o["messages"] = new JRaw(Newtonsoft.Json.JsonConvert.SerializeObject(initMessages));
                o["messagesCount"] = messagesCount;
                o["messagesPerPage"] = messagesCount;
            }
            catch
            {
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
            return o.ToString();
        }

        public static string IMAPStartInfo(MailAccountCredentials credentials)
        {
            ImapClient c = null;
            AE.Net.Mail.Imap.Mailbox[] boxes = null;
            AE.Net.Mail.MailMessage[] mm = null;
            int mailsPerPage = MailController.mailsPerPage;
            int mailsInBox;
            JObject o = new JObject();
            try
            {

                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;
                
                boxes = c.ListMailboxes("", "*");
                c.SelectMailbox("INBOX");
                mailsInBox = c.GetMessageCount();
                if (mailsInBox > 0)
                {
                    int startIndex = mailsInBox - mailsPerPage;
                    int endIndex = mailsInBox - 1;
                    if (startIndex < 0)
                        startIndex = 0;
                    if (endIndex > -1)
                        mm = c.GetMessages(startIndex, endIndex);
                }
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
            o["protocol"] = "IMAP";
            JArray b = new JArray();
            for(int i = 0; i < boxes.Length; i++)
            {
                JObject boxinfo = new JObject();
                boxinfo["name"] = boxes[i].Name;
                boxinfo["flags"] = new JArray(boxes[i].Flags);
                b.Add(boxinfo);
            }
            o["boxes"] = b;
            o["messages"] = new JRaw(Newtonsoft.Json.JsonConvert.SerializeObject(mm));
            o["messagesCount"] = mailsInBox;
            o["messagesPerPage"] = mailsPerPage;
            return o.ToString();
        }

        public static string IMAPGetMailPage(MailAccountCredentials credentials, int page, string box = "INBOX")
        {
            ImapClient c = null;
            AE.Net.Mail.MailMessage[] mm = null;
            int mailsPerPage = MailController.mailsPerPage;
            int mailsInBox;
            JObject o = new JObject();
            try
            {

                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;

                c.SelectMailbox(box);
                mailsInBox = c.GetMessageCount();
                if (mailsInBox > 0)
                {
                    int startIndex = mailsInBox - (mailsPerPage * page);
                    int endIndex = startIndex + mailsPerPage - 1;
                    if (startIndex < 0)
                        startIndex = 0;
                    if (endIndex > -1)
                        mm = c.GetMessages(startIndex, endIndex);
                }
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
            o["messages"] = new JRaw(Newtonsoft.Json.JsonConvert.SerializeObject(mm));
            o["messagesCount"] = mailsInBox;
            o["messagesPerPage"] = mailsPerPage;
            return o.ToString();
        }

        public static string IMAPGetMail(MailAccountCredentials credentials, string uid, string box = "INBOX")
        {
            ImapClient c = null;
            AE.Net.Mail.MailMessage[] mm = null;
            try
            {
                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;
                c.SelectMailbox(box);
                mm = c.GetMessages(uid, uid, true, false, false);
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
            return Newtonsoft.Json.JsonConvert.SerializeObject(mm);
        }

        public static void IMAPMarkMessagesReadFor(MailAccountCredentials credentials, String[] uids, string box = "INBOX")
        {
            ImapClient c = null;
            try
            {
                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;
                c.SelectMailbox(box);
                foreach (var uid in uids)
                    c.Store("UID " + uid, false, "\\Seen");
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
        }

        public static void IMAPSetFlags(MailAccountCredentials credentials, MailFlag flag, string box = "INBOX")
        {
            ImapClient c = null;
            try
            {
                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;
                c.Store("UID " + flag.uid, true, string.Join(" ", flag.flags));
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
        }

        public static void IMAPDeleteMessagesFor(MailAccountCredentials credentials, String[] uids, string box = "INBOX")
        {
            ImapClient c = null;
            try
            {
                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;
                c.SelectMailbox(box);
                foreach (var uid in uids)
                    c.DeleteMessage(uid);
                c.Expunge();
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
        }

        public static void IMAPMoveMessagesTo(MailAccountCredentials credentials, String[] uids, string folderTo, string folderFrom = "INBOX")
        {
            ImapClient c = null;
            try
            {
                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;
                c.SelectMailbox(folderFrom);
                foreach (var uid in uids)
                {
                    try
                    {
                        c.MoveMessage(uid, folderTo);
                    }
                    catch { }
                }
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
        }

        public static void IMAPCreateMessage(MailAccountCredentials credentials, AE.Net.Mail.MailMessage message, string flag = "\\Sent")
        {
            ImapClient c = null;
            string box = "";
            AE.Net.Mail.Imap.Mailbox[] boxes = null;
            try
            {
                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;
                boxes = c.ListMailboxes("", "*");

                box = boxes.Where(_ => _.Flags.Contains(flag)).Select(_ => _.Name).First();
                if(box != "")
                    c.AppendMail(message, box);
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
        }

        #endregion
        #region POP3

        public static AE.Net.Mail.MailMessage[] POP3GetMails(MailAccountCredentials credentials, int page, int mailsPerPage)
        {
            Pop3Client c = null;
            AE.Net.Mail.MailMessage[] mm = null;
            try
            {
                c = new Pop3Client(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, credentials.Port, credentials.SSL);

                int mailsInBox = c.GetMessageCount();
                int startIndex = mailsInBox - (mailsPerPage * page);
                int endIndex = startIndex + mailsPerPage - 1;
                if (startIndex < 0)
                    startIndex = 0;
                if (endIndex < 0)
                    return null;
                mm = new AE.Net.Mail.MailMessage[endIndex - startIndex + 1];
                for (int i = startIndex; i <= endIndex; i++)
                    mm[i - startIndex] = c.GetMessage(i, false);
            }
            finally
            {
                if(c != null)
                    c.Disconnect();
            }

            return mm;
        }

        public static int POP3CountMails(MailAccountCredentials credentials)
        {
            Pop3Client c = null;
            int mailsInBox = -1;
            try
            {
                c = new Pop3Client(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, credentials.Port, credentials.SSL);

                mailsInBox = c.GetMessageCount();
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }

            return mailsInBox;
        }

        public static string POP3StartInfo(MailAccountCredentials credentials)
        {
            Pop3Client c = null;
            AE.Net.Mail.Imap.Mailbox[] boxes = null;
            AE.Net.Mail.MailMessage[] mm = null;
            int mailsPerPage = MailController.mailsPerPage;
            int mailsInBox;
            JObject o = new JObject();
            try
            {

                c = new Pop3Client(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, credentials.Port, credentials.SSL);

                mailsInBox = c.GetMessageCount();
                int startIndex = mailsInBox - mailsPerPage;
                int endIndex = mailsInBox - 1;
                if (startIndex < 0)
                    startIndex = 0;
                if (endIndex > -1)
                {
                    mm = new AE.Net.Mail.MailMessage[endIndex - startIndex + 1];
                    for (int i = startIndex; i <= endIndex; i++)
                        mm[i - startIndex] = c.GetMessage(i, false);
                }
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
            o["protocol"] = "POP3";
            o["boxes"] = new JArray(boxes);
            o["messages"] = new JArray(mm);
            o["messagesCount"] = mailsInBox;
            o["messagesPerPage"] = mailsPerPage;
            return o.ToString();
        }

        #endregion
        #region Send

        public static string SendMailFrom(MailAccountCredentials credentials, System.Net.Mail.MailMessage message)
        {
            string answer = "success";
            SmtpClient smtpClient = null;
            try
            {
                message.IsBodyHtml = true;

                smtpClient = new SmtpClient(credentials.SMTPServerURL, credentials.SMTPPort);
                smtpClient.UseDefaultCredentials = false;
                string email = credentials.SMTPAccountName ?? credentials.Address;
                smtpClient.Credentials = new System.Net.NetworkCredential(email, credentials.SMTPPassword, email.Substring(email.IndexOf('@')+1));
                smtpClient.DeliveryMethod = SmtpDeliveryMethod.Network;
                smtpClient.EnableSsl = credentials.SMTPSSL;
                smtpClient.Port = credentials.SMTPPort;
                smtpClient.Timeout = 18000;

                smtpClient.Send(message);
            }
            catch (Exception e)
            {
                answer = e.Message.ToString();
            }
            finally
            {
                if(smtpClient != null)
                    smtpClient.Dispose();
            }
            return answer;
        }

        #endregion
        #region API

        [HttpGet]
        public string Search(string id)
        {
            var credentials = GetAccountCredentials();
            string response = IMAPSearchMessages(credentials, id);
            return response;
        }

        [HttpPost]
        public string List(MailRequest r)
        {
            int page = r.number;
            if (page < 0)
                return "";

            var credentials = GetAccountCredentials();
            string answer = "";
            if(credentials.Protocol.Equals("IMAP"))
                answer = IMAPGetMailPage(credentials, page, r.box);

            return answer;
        }

        [HttpPost]
        public string GetMail(Post p)
        {
            var credentials = GetAccountCredentials();
            return IMAPGetMail(credentials, p.uids.First(), p.box);
        }

        [HttpPost]
        public string GetUnread(MailRequest r)
        {
            ImapClient c = null;
            JObject answer = new JObject();
            try
            {
                int choice = r.number;
                var credentials = GetAccountCredentials();
                if (credentials == null)
                {
                    answer["error"] = GetConfigErrorMessage(ErrorTypes.MissingConfiguartion);
                    return answer.ToString();
                }
                if (!credentials.isValidForReceive())
                {
                    answer["error"] = GetConfigErrorMessage(ErrorTypes.MissingConfiguartion);
                    return answer.ToString();
                }
                if (credentials.Protocol.Equals("IMAP"))
                {
                    c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;
                    c.SelectMailbox(r.box);
                    List<AE.Net.Mail.MailMessage> initMessages = new List<AE.Net.Mail.MailMessage>();
                    Lazy<AE.Net.Mail.MailMessage>[] unreadMessages = c.SearchMessages(
                        SearchCondition.Undeleted().And(
                            SearchCondition.Unseen(),
                            SearchCondition.SentSince(DateTime.Now.AddDays(-5))
                        )
                    , true);

                    if (unreadMessages == null)
                    {
                        answer["error"] = GetConfigErrorMessage(ErrorTypes.ConnectionFailed);
                    }
                    else
                    {
                        if (choice == 1)
                        {
                            answer["protocol"] = "IMAP";
                        }
                        foreach (Lazy<AE.Net.Mail.MailMessage> message in unreadMessages.Reverse().Take(10))
                        {
                            initMessages.Add(message.Value);
                        }
                        answer["unreadMessages"] = new JRaw(Newtonsoft.Json.JsonConvert.SerializeObject((from m in initMessages
                                                                                                     select new
                                                                                                     {
                                                                                                         Uid = m.Uid,
                                                                                                         From = m.From,
                                                                                                         Subject = m.Subject,
                                                                                                         Date = m.Date
                                                                                                     })));

                    }
                }
            }
            catch (Exception e)
            {
                answer["error"] = e.Message;
                MFLog.LogInFile("MagicFramework.Controllers.MailController@GetUnread: Error Message: " + e.Message, MFLog.logtypes.ERROR);
            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
            return answer.ToString();
        }

        [HttpPost]
        public string GetUnreadCount(MailRequest r)
        {
            JObject answer = new JObject();
            var credentials = GetAccountCredentials();
            try
            {
                int choice = r.number;
                if (credentials == null)
                {
                    answer["error"] = GetConfigErrorMessage(ErrorTypes.MissingConfiguartion);
                    return answer.ToString();
                }
                if (!credentials.isValidForReceive())
                {
                    answer["error"] = GetConfigErrorMessage(ErrorTypes.MissingConfiguartion);
                    return answer.ToString();
                }
                if (credentials.Protocol.Equals("IMAP"))
                {
                    var result = GetAmountUnreadMessages(credentials, r.box);

                    if (result[0] == null)
                    {
                        answer["error"] = GetConfigErrorMessage(ErrorTypes.ConnectionFailed);
                    }
                    else
                    {
                        if (choice == 1)
                        {
                            //answer["totalMessages"] = IMAPCountMails(credentials, r.box);
                            answer["protocol"] = "IMAP";
                        }
                        answer["unreadMessagesCount"] = result[0];

                        //mails of the last 5 days
                        answer["unreadLastDaysMessagesCount"] = result[1];
                    }
                }
                else if (credentials.Protocol.Equals("POP3"))
                {
                    answer["totalMessages"] = POP3CountMails(credentials);
                    if (choice == 1)
                    {
                        answer["protocol"] = "POP3";
                    }
                }
            }
            catch (Exception e)
            {
                answer["error"] = e.Message;
                MFLog.LogInFile("MagicFramework.Controllers.MailController@GetUnreadCount: Error Message: " + e.Message, MFLog.logtypes.ERROR);
            }
            return answer.ToString();
        }

        private int?[] GetAmountUnreadMessages(MailAccountCredentials credentials, string box)
        {
            ImapClient c = null;
            int?[] result = new int?[2];
            try
            {
                c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;
                c.SelectMailbox(box);
                Lazy<AE.Net.Mail.MailMessage>[] unreadMessages = c.SearchMessages(
                    SearchCondition.Undeleted().And(
                        SearchCondition.Unseen()
                    )
                , true);

                if (unreadMessages != null)
                    result[0] = unreadMessages.Length;
                try
                {
                    unreadMessages = c.SearchMessages(
                                SearchCondition.Undeleted().And(
                                    SearchCondition.Unseen(),
                                    SearchCondition.SentSince(DateTime.Now.AddDays(-5))
                                )
                    , true);

                    if (unreadMessages != null)
                        result[1] = unreadMessages.Length;
                }
                catch (Exception e)
                {
                    MFLog.LogInFile("MagicFramework.Controllers.MailController@GetAmountUnreadMessages: Error Message: " + e.Message, MFLog.logtypes.ERROR);
                }

            }
            finally
            {
                if (c != null)
                    c.Disconnect();
            }
            return result;
        }

        public HttpResponseMessage Send()
        {
            string error = "error";
            try
            {
                Stream stream = HttpContext.Current.Request.InputStream;
                HttpMultipartParser parser = new HttpMultipartParser(stream);
                if (parser.Success)
                {
                    System.Net.Mail.MailMessage mail = new System.Net.Mail.MailMessage();
                    AE.Net.Mail.MailMessage m = new AE.Net.Mail.MailMessage();
                    string subject = HttpUtility.UrlDecode(parser.Parameters["subject"]);
                    mail.Subject = subject;
                    m.Subject = subject;
                    var mailTo = HttpUtility.UrlDecode(parser.Parameters["to"]).Split(',');
                    string mailCC = parser.Parameters.ContainsKey("cc") ? HttpUtility.UrlDecode(parser.Parameters["cc"]) : "";
                    string mailBCC = parser.Parameters.ContainsKey("bcc") ? HttpUtility.UrlDecode(parser.Parameters["bcc"]) : "";
                    var body = HttpUtility.UrlDecode(parser.Parameters["body"]);
                    mail.Body = body;
                    m.Body = body;
                    string headerTime = parser.Parameters.ContainsKey("return-message") ? DateTime.Now.ToString() : null;

                    MailAccountCredentials credentials = GetAccountCredentials();
                    mail.From = new MailAddress(credentials.Address, credentials.FromName ?? credentials.Address);
                    m.From = new MailAddress(credentials.Address, credentials.FromName ?? credentials.Address);
                    foreach (var to in mailTo)
                    {
                        mail.To.Add(new MailAddress(to));
                        m.To.Add(new MailAddress(to));
                    }
                    if (mailCC != "")
                    {
                        foreach (var cc in mailCC.Split(','))
                        {
                            mail.CC.Add(new MailAddress(cc));
                            m.Cc.Add(new MailAddress(cc));
                        }
                    }
                    if (mailBCC != "")
                    {
                        foreach (var bcc in mailBCC.Split(','))
                        {
                            mail.Bcc.Add(new MailAddress(bcc));
                            m.Bcc.Add(new MailAddress(bcc));
                        }
                    }

                    foreach (var file in parser.FileContents)
                    {
                        mail.Attachments.Add(new System.Net.Mail.Attachment(new MemoryStream(file.Value.File), file.Value.Filename, file.Value.ContentType));
                        m.Attachments.Add(new AE.Net.Mail.Attachment(file.Value.File, file.Value.Filename, file.Value.ContentType));
                    }

                    if (parser.Parameters.ContainsKey("attachments"))
                    {
                        foreach (String attachment in parser.Parameters["attachments"].Split(','))
                        {
                            try
                            {
                                FileInfo fileInfo = new FileInfo(attachment);
                                if (fileInfo.Exists)
                                {
                                    byte[] bytes = File.ReadAllBytes(attachment);
                                    String mimeType = Utils.GetMimeType(attachment);
                                    mail.Attachments.Add(new System.Net.Mail.Attachment(new MemoryStream(bytes), fileInfo.Name, mimeType));
                                    m.Attachments.Add(new AE.Net.Mail.Attachment(bytes, fileInfo.Name, mimeType));
                                }
                            }
                            catch { }
                        }
                    }

                    if (headerTime != null)
                        mail.Headers.Add("X-Magic-SendTime", headerTime);

                    string answer = SendMailFrom(credentials, mail);
                    if (answer.Equals("success"))
                    {
                        //IMAPCreateMessage(credentials, m);
                        if (headerTime != null)
                        {
                            try
                            {
                                ImapClient c = new ImapClient(credentials.ServerURL, credentials.AccountName ?? credentials.Address, credentials.Password, AuthMethods.Login, credentials.Port, credentials.SSL);;
                                AE.Net.Mail.Imap.Mailbox[] boxes = c.ListMailboxes("", "*");
                                string box = boxes.Where(_ => _.Flags.Contains("\\Sent")).Select(_ => _.Name).FirstOrDefault();
                                if (box != null)
                                {
                                    c.SelectMailbox(box);
                                    Lazy<AE.Net.Mail.MailMessage>[] messages = c.SearchMessages(SearchCondition.Header("X-Magic-SendTime", headerTime));
                                    if (messages.Count() > 0)
                                    {
                                        AE.Net.Mail.MailMessage message = messages.First().Value;
                                        HttpResponseMessage response = Utils.ResponseMessage(JObject.FromObject(new
                                        {
                                            Attachments = message.Attachments,
                                            AlternateViews = message.AlternateViews,
                                            Body = message.Body,
                                            From = message.From,
                                            RawFlags = message.RawFlags,
                                            Subject = message.Subject,
                                            To = message.To,
                                            Uid = message.Uid
                                        }).ToString(), HttpStatusCode.OK, true);
                                        return response;
                                    }
                                }
                            } catch (Exception e) { }
                        }
                        return Utils.ResponseMessage(answer, HttpStatusCode.OK);
                    }
                    else
                        return Utils.ResponseMessage(answer, HttpStatusCode.BadRequest);
                }
            }
            catch (Exception e) {
                error = e.Message;
            }
            return Utils.ResponseMessage(error, HttpStatusCode.InternalServerError);
        }
        private static string getUserMail(DatabaseCommandUtils dbutils) {
            return dbutils.GetDataSet(String.Format("SELECT Email FROM dbo.Magic_Mmb_Users where UserID = {0}", SessionHandler.IdUser)).Tables[0].Rows[0]["Email"].ToString();
        }
        public HttpResponseMessage SendThroughQueue()
        {
            string error = "error";
            try
            {
                Stream stream = HttpContext.Current.Request.InputStream;
                HttpMultipartParser parser = new HttpMultipartParser(stream);
                var dbutils = new DatabaseCommandUtils();
                if (parser.Success)
                {
                    string mailSubject = HttpUtility.UrlDecode(parser.Parameters["subject"]);
                    var mailTo = parser.Parameters.ContainsKey("to") ? HttpUtility.UrlDecode(parser.Parameters["to"]) : "";
                    string mailCC = parser.Parameters.ContainsKey("cc") ? HttpUtility.UrlDecode(parser.Parameters["cc"]) : "";
                    string mailBCC = parser.Parameters.ContainsKey("bcc") ? HttpUtility.UrlDecode(parser.Parameters["bcc"]) : "";
                    int userId = SessionHandler.IdUser;
                    string userMailReplyTo = getUserMail(dbutils);
                    var mailBody = HttpUtility.UrlDecode(parser.Parameters["body"]);
                    string mailAttachments = String.Empty;
                    string rootDirForUpload = ApplicationSettingsManager.GetRootdirforupload();   

                    foreach (var file in parser.FileContents)
                    {
                        string directory = System.IO.Path.Combine(rootDirForUpload, "mailClientUpload");
                        Directory.CreateDirectory(directory);
                        string thePath = System.IO.Path.Combine(directory, file.Value.Filename);
                        //write the stream into fs so that MailJob will attach it later
                        System.IO.File.WriteAllBytes(thePath, file.Value.File);
                        mailAttachments += mailAttachments + thePath;
                    }
                    JObject o = JObject.FromObject(new {
                        from_name = SessionHandler.UserFirstName + " " +SessionHandler.UserLastName ,
                        replyto = userMailReplyTo,
                        cc = mailCC,
                        bcc=  mailBCC,
                        subject = mailSubject,
                        body = mailBody,
                        attachments = mailAttachments,
                        to = mailTo
                    });

                    dbutils.GetDataSetFromStoredProcedure("dbo.Magic_PushClientMailToQueue", o);
                    return Utils.ResponseMessage("Email inserted in queue", HttpStatusCode.OK);

                }
                else throw new ArgumentException("Invalid content");
            }
            catch (Exception e)
            {
                error = e.Message;
                return Utils.ResponseMessage(error, HttpStatusCode.BadRequest);
            }
        }
        public string SaveDraft()
        {
            try
            {
                Stream stream = HttpContext.Current.Request.InputStream;
                HttpMultipartParser parser = new HttpMultipartParser(stream);
                if (parser.Success)
                {
                    AE.Net.Mail.MailMessage m = new AE.Net.Mail.MailMessage();
                    string subject = HttpUtility.UrlDecode(parser.Parameters["subject"]);
                    m.Subject = subject;
                    string mailTo = parser.Parameters.ContainsKey("to") ? HttpUtility.UrlDecode(parser.Parameters["to"]) : "";
                    string mailCC = parser.Parameters.ContainsKey("cc") ? HttpUtility.UrlDecode(parser.Parameters["cc"]) : "";
                    string mailBCC = parser.Parameters.ContainsKey("bcc") ? HttpUtility.UrlDecode(parser.Parameters["bcc"]) : "";
                    var body = HttpUtility.UrlDecode(parser.Parameters["body"]);
                    m.Body = body;

                    MailAccountCredentials credentials = GetAccountCredentials();
                    m.From = new MailAddress(credentials.Address, credentials.FromName);
                    if (mailTo != "")
                    {
                        foreach (var to in mailTo.Split(','))
                        {
                            m.To.Add(new MailAddress(to));
                        }
                    }
                    if (mailCC != "")
                    {
                        foreach (var cc in mailCC.Split(','))
                        {
                            m.Cc.Add(new MailAddress(cc));
                        }
                    }
                    if (mailBCC != "")
                    {
                        foreach (var bcc in mailBCC.Split(','))
                        {
                            m.Bcc.Add(new MailAddress(bcc));
                        }
                    }

                    foreach (var file in parser.FileContents)
                    {
                        m.Attachments.Add(new AE.Net.Mail.Attachment(file.Value.File, file.Value.ContentType, file.Value.Filename));
                    }

                    IMAPCreateMessage(credentials, m, "\\Drafts");
                    return "success";
                }
            }
            catch { return "error"; }

            return "error";
        }

        [HttpPost]
        public string Forward(MailJSON p)
        {
            try
            {
                System.Net.Mail.MailMessage mail = new System.Net.Mail.MailMessage();
                AE.Net.Mail.MailMessage m = new AE.Net.Mail.MailMessage();
                byte[] f;
                mail.Subject = p.Subject;
                m.Subject = p.Subject;
                mail.Body = p.Body;
                m.Body = p.Body;

                MailAccountCredentials credentials = GetAccountCredentials();
                mail.From = new MailAddress(credentials.Address, credentials.FromName);
                m.From = new MailAddress(credentials.Address, credentials.FromName);
                foreach (var to in p.To)
                {
                    mail.To.Add(new MailAddress(to));
                    m.To.Add(new MailAddress(to));
                }
                if (p.CC != null)
                {
                    foreach (var cc in p.CC)
                    {
                        mail.CC.Add(new MailAddress(cc));
                        m.Cc.Add(new MailAddress(cc));
                    }
                }
                if (p.BCC != null)
                {
                    foreach (var bcc in p.BCC)
                    {
                        mail.Bcc.Add(new MailAddress(bcc));
                        m.Bcc.Add(new MailAddress(bcc));
                    }
                }

                foreach (var file in p.Files)
                {
                    f = null;
                    try
                    {
                        f = GetEncodedFile(file.body, file.encoding);
                        if (f != null)
                        {
                            mail.Attachments.Add(new System.Net.Mail.Attachment(new MemoryStream(f), file.fileName, file.contentType));
                            m.Attachments.Add(new AE.Net.Mail.Attachment(f, file.contentType, file.fileName));
                        }
                    }
                    catch { }
                }

                string answer = SendMailFrom(credentials, mail);
                if (answer.Equals("success"))
                    IMAPCreateMessage(credentials, m);
                return "success";
            }

            catch { return "error"; }
        }

        [HttpPost]
        public HttpResponseMessage SaveBO(BOPost p)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.InternalServerError;
            string content = p.body;
            string path, directory, uri, fileName;
            byte[] file;
            try
            {
                uri = ApplicationSettingsManager.GetMailAttachmentUploadDirectory();
                directory = HttpContext.Current.Server.MapPath(uri);
                if (!Directory.Exists(directory))
                    Directory.CreateDirectory(directory);
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
                return res;
            }
            foreach (var attachment in p.files)
            {
                file = null;
                try
                {
                    file = GetEncodedFile(attachment.body, attachment.encoding);
                    if (file != null)
                    {
                        fileName = DateTime.Now.ToString("yyyyMMddHHmmssffff") + attachment.fileName;
                        path = directory + "\\" + fileName;
                        File.WriteAllBytes(path, file);
                        content += "<br><a href='" + uri + "/" + fileName + "'>" + attachment.fileName + "</a>";
                    }
                }
                catch {}
            }
            if (content != "")
            {
                try
                {
                    Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                    List<BOTag> alreadyTaggedDocuments = new List<BOTag>();
                    Dictionary<string, BOTag> documentIdsToDelete = new Dictionary<string, BOTag>();
                    Regex r = new Regex(@"<!--([\d]+)-([\w]+)-([\d]+)-->");
                    foreach(var oldFlag in p.flags.flags){
                        Match m = r.Match(oldFlag);
                        if (m.Success)
                        {
                            var bo = new BOTag { Id = m.Groups[1].Value, DocumentRepositoryId = Int32.Parse(m.Groups[3].Value), Type = m.Groups[2].Value };
                            alreadyTaggedDocuments.Add(bo);
                            if (p.tags.Where(_ => _.Id.Equals(bo.Id) && _.Type.Equals(bo.Type)).Count() == 0)
                            {
                                documentIdsToDelete.Add(oldFlag, bo);
                            }
                        }
                    }
                    p.flags.flags.RemoveAll(_ => documentIdsToDelete.ContainsKey(_));
                    foreach(var doc in documentIdsToDelete.Values){
                        foreach (var document in _context.Magic_DocumentRepository.Where(_ => _.ID == doc.DocumentRepositoryId && _.BusinessObject_ID.Equals(doc.Id) && _.BusinessObjectType.Equals(doc.Type) && _.TransmissionMode.Equals("mail")))
                            _context.Magic_DocumentRepository.DeleteOnSubmit(document);
                    }
                    _context.SubmitChanges();
                    try
                    {
                        p.DocumentTypeID = _context.Magic_DocumentRepositoryType.Where(t => t.Code.Equals("M")).FirstOrDefault().ID;
                    }
                    catch
                    {
                        MFLog.LogInFile("DocumentRepositoryType for MAIL is missing in table.", MFLog.logtypes.WARN);
                        p.DocumentTypeID = 0;
                    }
                    foreach (var tag in p.tags.Where(_ => alreadyTaggedDocuments.Where(a => a.Id.Equals(_.Id) && a.Type.Equals(_.Type)).Count() == 0))
                        p.flags.flags.Add(tag.Description.Replace(' ', '_') + "<!--" + tag.Id + "-" + tag.Type.Replace(' ', '_') + "-" + MagicFramework.Helpers.DocumentTraceManager.LogFile(new Helpers.DocumentLogFile { BOId = tag.Id, BOType = tag.Type, File = content, TransmissionMode = "mail", DocumentTypeID = p.DocumentTypeID }).ToString() + "-->");
                    try
                    {
                        IMAPSetFlags(GetAccountCredentials(), p.flags);
                    }
                    catch (Exception ex) {
                        MFLog.LogInFile("Error with flags setting:" + ex.Message, MFLog.logtypes.WARN);
                    }
                    res.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(p.flags.flags));
                    res.StatusCode = HttpStatusCode.OK;
                    return res;
                }
                catch (Exception e){
                    res.Content = new StringContent(e.Message);
                    return res;
                }
            }

            return res;
        }

        [HttpPost]
        public void SetFlags(MailFlag p)
        {
            var credentials = GetAccountCredentials();
            IMAPSetFlags(credentials, p);
        }

        [HttpPost]
        public void Seen(Post p)
        {
            var credentials = GetAccountCredentials();
            IMAPMarkMessagesReadFor(credentials, p.uids, p.box);
        }

        [HttpPost]
        public void Delete(Post p)
        {
            var credentials = GetAccountCredentials();
            IMAPDeleteMessagesFor(credentials, p.uids, p.box);
        }

        [HttpGet]
        public string InitialData(string id)
        {
            string error = GetConfigErrorMessage(ErrorTypes.MissingConfiguartion);

            //SendTestMail();
            var credentials = GetAccountCredentials();
            JObject answer = new JObject();
            if (credentials == null)
            {
                answer["error"] = error;
                return answer.ToString();
            }
            if (credentials.Protocol.Equals("IMAP"))
            {
                return IMAPStartInfo(credentials);
            }
            else if (credentials.Protocol.Equals("POP3"))
            {
                return POP3StartInfo(credentials);
            }
            return answer.ToString();
        }

        [HttpPost]
        public void Move(Post p)
        {
            var c = GetAccountCredentials();
            IMAPMoveMessagesTo(c, p.uids, p.toFolder, p.box);
        }
        #endregion

        public static byte[] GetEncodedFile(string fileString, string encoding)
        {
            switch (encoding)
            {
                case "base64":
                    return Convert.FromBase64String(fileString);
                default:
                    return System.Text.Encoding.Unicode.GetBytes(fileString);
            }
        }

        public class MailRequest
        {
            public int number { get; set; }
            public string box { get; set; }
        }

        public class Post
        {
            public String[] uids { get; set; }
            public string box { get; set; }
            public string toFolder { get; set; }
        }

        public class BOPost
        {
            public BOFile[] files { get; set; }
            public string body { get; set; }
            public List<BOTag> tags { get; set; }
            public int DocumentTypeID { get; set; }
            public MailFlag flags { get; set; }
        }

        public class BOFile
        {
            public string fileName { get; set; }
            public string contentType { get; set; }
            public string body { get; set; }
            public string encoding { get; set; }
        }

        public class BOTag
        {
            public string Id { get; set; }
            public string Type { get; set; }
            public string Description { get; set; }
            public int DocumentRepositoryId { get; set; }
        }

        public class MailJSON
        {
            public String[] To { get; set; }
            public String[] CC { get; set; }
            public String[] BCC { get; set; }
            public string Subject { get; set; }
            public string Body { get; set; }
            public BOFile[] Files { get; set; }
        }

        public class MailFlag
        {
            public string uid { get; set; }
            public List<string> flags { get; set; }
        }
    }  
}
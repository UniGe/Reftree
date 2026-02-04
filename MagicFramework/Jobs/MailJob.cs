using MagicFramework.Helpers;
using Newtonsoft.Json.Linq;
using Quartz;
using Quartz.Impl;
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using RazorEngine;
using RazorEngine.Templating; // For extension methods.
using RazorEngine.Configuration;
using RazorEngine.Text;
using System.Text;
using System.Security.Cryptography;
using MagicFramework.Data;

namespace MagicFramework.Jobs
{
    public class MailJob : IJob,IRazorTemplateBuffer
    {
        private static Dictionary<string, string> RazorTemplateBuffer;
        private static bool prepared = false;

        public const int MAX_SEND_ATTEMPTS = 5;
        public const int MAX_MAILS_PROCESSED_PER_CALL = 10;
        public const string LOG_FILE_NAME = "MailLog.txt";

        public void prepareOneTime()
        {
            if (!prepared)
            {
                var razorConfig = new TemplateServiceConfiguration();
                razorConfig.Language = Language.CSharp;
                razorConfig.EncodedStringFactory = new HtmlEncodedStringFactory();
                razorConfig.DisableTempFileLocking = true; // this seems to be the relevant part
                var service = RazorEngineService.Create(razorConfig);
                Engine.Razor = service;
                RazorTemplateBuffer = new Dictionary<string, string>();
                prepared = true;
            }
        }
        public void Execute(IJobExecutionContext context)
        {
            try
            {
                prepareOneTime();
                //loop trough all config files
                var configs = new MFConfiguration().LoadConfigurations();
                foreach (var config in configs)
                {
                    //loop trough all instances
                    foreach (var instance in config.Value.listOfInstances.Where(i => i.mailJobActive == true))
                    {
                        string id = config.Value.applicationDomain + instance.id;
                        Data.MagicDBDataContext dbmlContext;
                        Data.MagicDBEntities entityContext;
                        try
                        {
                            dbmlContext = new Data.MagicDBDataContext(instance.TargetDBconn);
                            entityContext = new Data.MagicDBEntities(instance.registrationEntityConnectionString);
                            try
                            {
                                //check for not sent notifications for this instance, we try max 2 times to send the notification
                                var notifications = dbmlContext.Magic_Calendar_Notifications.Where(n => n.notify_at <= context.FireTimeUtc.Value.LocalDateTime.AddMinutes(1) && n.notified.Equals(false) && n.notify_via.Equals("mail") && n.send_attempts < MAX_SEND_ATTEMPTS).ToList();
                                if (notifications.Any())
                                {
                                    DefaultSmtpCredentials credentials = null;
                                    try
                                    {
                                        credentials = Mailer.GetDefaultSmtpCredentialsSilent(config.Key, instance.id);
                                    }
                                    catch (Exception e)
                                    {
                                        MFLog.LogInFile("MagicFramework.Jobs.MailJob@Execute: (InstanceName: " + instance.appInstancename + ") Notifications pending, but error while parsing defaultSendMail from Configuration File: " + config.Key + " InstanceId: " + instance.id + " Exception Message: " + e.Message, MFLog.logtypes.WARN, LOG_FILE_NAME,instance.directorylog);
                                    }
                                    if (credentials != null)
                                    {
                                        notifications.ForEach(delegate (Data.Magic_Calendar_Notifications n) {
                                            n.notified = true;
                                        });
                                        dbmlContext.SubmitChanges();
                                        //compose the messages and send them
                                        foreach (var noti in notifications)
                                        {
                                            try
                                            {
                                                var mailMessage = Mailer.FormatCalendarNotificationMail(noti.Magic_Calendar, credentials, noti.Magic_Mmb_Users.Email);
                                                HelpObject userState = new HelpObject { notificationId = noti.id, contextId = id, instance = instance };
                                                if (!Mailer.SendMail(credentials, mailMessage, SendCompleteCallback, userState))
                                                    noti.notified = false;
                                            }
                                            catch
                                            {
                                                noti.notified = false;
                                            }
                                            finally
                                            {
                                                noti.send_attempts++;
                                            }
                                        }
                                        dbmlContext.SubmitChanges();
                                    }
                                }
                            }
                            catch (Exception ex) {
                                MFLog.LogInFile("MagicFramework.Jobs.MailJob@Execute@Magic_Calendar_Notifications: (InstanceName: " + instance.appInstancename + ") " + ex.Message, MFLog.logtypes.DEBUG, LOG_FILE_NAME,instance.directorylog);
                            }
                            //send mails of Magic_MailQueue
                            try
                            {
                                var messagesToSend = entityContext.Magic_MailQueue.Where(m => m.send_time == null && m.send_attempts < MAX_SEND_ATTEMPTS && m.is_in_process == false).OrderBy(m => m.last_attempt).ThenBy(m => m.created).Take(MAX_MAILS_PROCESSED_PER_CALL).ToList();
                                if (messagesToSend.Any())
                                {
                                    try
                                    {
                                        DateTime now = DateTime.Now;
                                        messagesToSend.ForEach(delegate (Data.Magic_MailQueue m)
                                        {
                                            m.is_in_process = true;
                                        });
                                        entityContext.SaveChanges();

                                        List<int?> messagesIds = messagesToSend.Where(x => x.edited_messages_id == null).Select(m => m.system_messages_id).Where(y => y.HasValue).ToList();
                                        var templates = entityContext.Magic_SystemMessages.Where(s => messagesIds.Contains(s.Id)).ToList();

                                        List<int?> editedmessagesIds = messagesToSend.Where(x => x.edited_messages_id != null).Select(m => m.edited_messages_id).Where(y => y.HasValue).ToList();
                                        var editedtemplates = entityContext.Magic_SystemEditedMessages.Where(s => editedmessagesIds.Contains(s.Id)).ToList();

                                        List<int?> accountIds = messagesToSend.Select(m => m.mail_account_id).ToList();
                                        var credentials = entityContext.Magic_MailAccounts.Where(a => accountIds.Contains(a.id)).ToList();
                                        Dictionary<int, string> decryptedPasswords = new Dictionary<int, string>();
                                        foreach (var cred in credentials)
                                        {
                                            decryptedPasswords.Add(cred.id, cred.password != null ? MagicFramework.Controllers.GenericSqlCommandController.DecryptPassword(cred.password) : null);
                                        }

                                        var allTemplates = new List<(IMessageTemplate Template, bool IsEdited)>();
                                        allTemplates.AddRange(templates.Select(t => ((IMessageTemplate)t, false)));
                                        allTemplates.AddRange(editedtemplates.Select(t => ((IMessageTemplate)t, true)));

                                        foreach (var (template, isEdited) in allTemplates)
                                        {
                                            var messagesWithSameTemplate = isEdited
                                                ? messagesToSend.Where(m => m.edited_messages_id == template.Id)
                                                : messagesToSend.Where(m => m.system_messages_id == template.Id);

                                            foreach (var message in messagesWithSameTemplate)
                                            {
                                                try
                                                {
                                                    var mailer = new Mailer(true, config.Value.applicationDomain, instance.id);


                                                        var cred = credentials.FirstOrDefault(c => c.id == message.mail_account_id);
                                                        if (cred == null)
                                                        {
                                                            mailer.SetSMTPClient(Mailer.GetDefaultSmtpCredentialsSilent(config.Value.applicationDomain, instance.id));
                                                        }
                                                        else
                                                        {
                                                            mailer.SetSMTPClient(cred, decryptedPasswords[cred.id]);
                                                        }

                                                        var parseResult = mailer.ParseDbMessage(template);
                                                        if (!parseResult.Success)
                                                        {
                                                            message.error_counter++;
                                                            message.send_attempts++;
                                                            message.error_messages += $"{parseResult.ErrorType} in {parseResult.FailedComponent}: {parseResult.ErrorMessage} - ";

                                                            if (parseResult.FailedAttachments.Any())
                                                            {
                                                                message.error_messages += $"Failed attachments: {string.Join(", ", parseResult.FailedAttachments.Select(x => $"{x.Key}: {x.Value}"))} - ";
                                                            }

                                                            message.last_attempt = DateTime.Now;
                                                            message.send_time = null;
                                                            message.is_in_process = false;
                                                            entityContext.SaveChanges();
                                                            continue;
                                                        }

                                                        var requiredAttachmentCount = 0;
                                                        if (!string.IsNullOrEmpty(template.Attachments))
                                                        {
                                                            requiredAttachmentCount += template.Attachments.Split(',').Count(x => !string.IsNullOrEmpty(x?.Trim()));
                                                        }

                                                        // Check actual attachments in the mailer
                                                        var actualAttachmentCount = mailer.GetAttachmentCount();

                                                        if (actualAttachmentCount < requiredAttachmentCount)
                                                        {
                                                            message.error_counter++;
                                                            message.send_attempts++;
                                                            message.error_messages += $"Not all attachments were successfully added to the mail. Expected {requiredAttachmentCount} but got {actualAttachmentCount} - ";
                                                            message.last_attempt = DateTime.Now;
                                                            message.send_time = null;
                                                            message.is_in_process = false;
                                                            entityContext.SaveChanges();
                                                            continue;
                                                        }

                                                        if (!string.IsNullOrEmpty(message.taglist))
                                                        {
                                                            try
                                                            {
                                                                // Handle tags differently based on template type
                                                                if (!isEdited && message.taglist.Contains("RAZOR"))
                                                                {
                                                                    var tags = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, Newtonsoft.Json.Linq.JObject>>(message.taglist);
                                                                    mailer.ParseRazor(this, template.Code, tags["RAZOR"]);
                                                                }
                                                                else
                                                                {
                                                                    var tags = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(message.taglist);
                                                                    mailer.ReplaceTags(tags);
                                                                }
                                                            }
                                                            catch (Exception e)
                                                            {
                                                                string errorMessage = e.Message;
                                                                if (e.InnerException != null)
                                                                    errorMessage = errorMessage + " - " + e.InnerException.Message;

                                                                MFLog.LogInFile("MagicFramework.Jobs.MailJob@Execute1: (InstanceName: " + instance.appInstancename + ") Mail not sent: " + errorMessage, MFLog.logtypes.WARN, LOG_FILE_NAME, instance.directorylog);
                                                                throw;
                                                            }
                                                        }

                                                        // Handle SendTo differently based on template type
                                                        if (!isEdited)
                                                        {
                                                            mailer.SetTo(message.send_to);
                                                        }
                                                        else if (isEdited && !mailer.IsMailHaveTo())
                                                        {
                                                            mailer.SetTo(message.send_to);
                                                        }

                                                        if (!string.IsNullOrEmpty(message.reply_to) && !string.IsNullOrWhiteSpace(message.reply_to))
                                                            mailer.AddReplyToList(message.reply_to);

                                                        message.send_attempts++;
                                                        message.last_attempt = DateTime.Now;
                                                        try
                                                        {
                                                            mailer.SendAsync(LogMailResult, new LogData
                                                            {
                                                                connectionId = id,
                                                                mailQueueId = message.id,
                                                                instance = instance,
                                                                mailer = mailer  // Pass the mailer instance

                                                            });

                                                            if (cred != null && cred.is_pec)
                                                            {
                                                                message.send_time = DateTime.Now;
                                                            }
                                                        }
                                                        catch (Exception e)
                                                        {
                                                            if (cred != null && cred.is_pec)
                                                            {
                                                                message.error_counter++;
                                                                message.error_messages += e + " - ";
                                                                message.send_time = null;
                                                            }
                                                        }

                                                        if (cred != null && cred.is_pec)
                                                        {
                                                            message.is_in_process = false;
                                                        }

                                                        entityContext.SaveChanges();
                                                }
                                                catch (Exception e)
                                                {
                                                    MFLog.LogInFile("MagicFramework.Jobs.MailJob@ExecuteUnified: (InstanceName: " + instance.appInstancename + ") Mail not sent: " + e.Message, MFLog.logtypes.DEBUG, LOG_FILE_NAME, instance.directorylog);
                                                }

                                            }
                                        }
                                    }
                                    catch (Exception e)
                                    {
                                        MFLog.LogInFile("MagicFramework.Jobs.MailJob@Execute1: (InstanceName: " + instance.appInstancename + ") Error: " + e.Message, MFLog.logtypes.WARN, LOG_FILE_NAME,instance.directorylog);
                                    }
                                }
                            }
                            catch (Exception e)
                            {
                                MFLog.LogInFile("MagicFramework.Jobs.MailJob@Execute3: (InstanceName: " + instance.appInstancename + ") " + e.Message, MFLog.logtypes.DEBUG, LOG_FILE_NAME,instance.directorylog);
                            }
                        }
                        catch (Exception e)
                        {
                            MFLog.LogInFile("MagicFramework.Jobs.MailJob@Execute4: (InstanceName: " + instance.appInstancename + ") " + e.Message, MFLog.logtypes.DEBUG, LOG_FILE_NAME,instance.directorylog);
                        }
                    }
                }
            }
            catch (Exception e)
            {
                MFLog.LogInFile("MagicFramework.Jobs.MailJob@Execute5: " + e.Message, MFLog.logtypes.DEBUG, LOG_FILE_NAME);
            }
        }

        public class LogData
        {
            public string connectionId { get; set; }
            public int mailQueueId { get; set; }
            public MFConfiguration.ApplicationInstanceConfiguration instance { get; set; }
            public Mailer mailer { get; set; }
        }

        public static void LogMailResult(object sender, AsyncCompletedEventArgs e)
        {
            try
            {
                LogData data = (LogData)e.UserState;
                using (var entities = new Data.MagicDBEntities(data.instance.registrationEntityConnectionString))
                {
                    var rec = entities.Magic_MailQueue.Where(q => q.id == data.mailQueueId).First();
                    if (e.Cancelled || e.Error != null)
                    {
                        rec.error_counter++;
                        if (e.Cancelled)
                            rec.error_messages = "canceled - ";
                        else
                            rec.error_messages += e.Error.Message + " - ";
                        rec.send_time = null;
                    }
                    else
                    {
                        rec.send_time = DateTime.Now;
                    }
                    rec.is_in_process = false;
                    entities.SaveChanges();
                }
                if (data.mailer != null)
                {
                    data.mailer.Dispose();
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR, LOG_FILE_NAME);
            }
        }

        public static void SendCompleteCallback(object sender, AsyncCompletedEventArgs e)
        {
            HelpObject data = (HelpObject)e.UserState;

            //if something goes wrong we'll retry to send this notification
            if (e.Cancelled || e.Error != null)
            {
                using (var entities = new Data.MagicDBDataContext(data.instance.TargetDBconn))
                {
                    var notification = entities.Magic_Calendar_Notifications.Where(_ => _.id.Equals(data.notificationId)).FirstOrDefault();
                    if (notification != null)
                    {
                        notification.notified = false;
                        entities.SubmitChanges();
                    }
                }
            }
        }

        //init this job, we'll check for notifications to send every minute
        public static void InitJob()
        {
            ISchedulerFactory schedFact = new StdSchedulerFactory();

            // get a scheduler
            IScheduler sched = schedFact.GetScheduler();
            sched.Start();
            // define the job and tie it to our job class
            IJobDetail job = JobBuilder.Create<MailJob>()
                .WithIdentity("SchedulerNotificationMailJob", "SchedulerJobs")
                .Build();

            // Trigger the job to run now, and then every 60 seconds
            ITrigger trigger = TriggerBuilder.Create()
              .WithIdentity("SchedulerNotificationMailJobTrigger", "SchedulerJobs")
              .StartNow()
              .WithSimpleSchedule(x => x
                  .WithIntervalInSeconds(60)
                  .RepeatForever())
              .Build();
                        
            sched.ScheduleJob(job, trigger);
        }

        public class HelpObject
        {
            public int notificationId { get; set; }
            public string contextId { get; set; }
            public MFConfiguration.ApplicationInstanceConfiguration instance { get; set; }
        }

        #region IRazorTemplateBuffer
        public string getCache(string aTemplateKey) {

            string result = null;
            lock (RazorTemplateBuffer) {
                if (RazorTemplateBuffer.ContainsKey(aTemplateKey))
                    result=RazorTemplateBuffer[aTemplateKey];
            }

            return result;
        }

        public void setCache(string aTemplateKey, string aContent) {          
            lock (RazorTemplateBuffer) {
                RazorTemplateBuffer[aTemplateKey] = aContent;
            }
        }

        public string getHash(string aContent)
        {
            var md5 = MD5.Create();
            var inputBytes = System.Text.Encoding.UTF8.GetBytes(aContent);
            var hash = md5.ComputeHash(inputBytes);
            var sb = new StringBuilder();
            foreach (byte t in hash)
            {
                sb.Append(t.ToString("X2"));
            }
            return sb.ToString();
        }
        #endregion
    }
}
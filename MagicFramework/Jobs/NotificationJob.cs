using MagicFramework.Helpers;
using Quartz;
using Quartz.Impl;
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using MagicFramework.Jobs.SMSProviders;
using Newtonsoft.Json.Linq;

namespace MagicFramework.Jobs
{
    public class NotificationJob : IJob
    {
        public const int MAX_SEND_ATTEMPTS = 2;
        /// <summary>
        /// Job per l' invio di notifiche "real time" intra-applicativo o a numeri mobile via SMS  
        /// </summary>
        /// <param name="context"></param>
        public void Execute(IJobExecutionContext context)
        {
            try {
                //loop trough all config files
                var configs = new MFConfiguration().LoadConfigurations();
                foreach (var config in configs)
                {
                    //loop trough all instances
                    foreach (var instance in config.Value.listOfInstances.Where(i => i.notificationJobActive == true))
                    {
                        try
                        {
                            Data.MagicDBEntities _context = new Data.MagicDBEntities(instance.registrationEntityConnectionString);

                            var notifications = (from e in _context.V_Magic_NotificationQueue where e.notified == false && e.send_attempts < MAX_SEND_ATTEMPTS select e).ToList();
                            foreach (var n in notifications)
                            {
                                switch (n.notificationType)
                                {
                                    case "SMS":
                                        Hashtable result = new Hashtable();
                                        // implement provider dependent call to Web services (es. skebby)
                                        try
                                        {
                                            if (String.IsNullOrEmpty(n.mobile))
                                                throw new System.ArgumentException("Mobile not provided");
                                            switch (n.providercode)
                                            {
                                                case "skebby":
                                                    var skebby = new SkebbySMS(n.Credential_user, n.Credential_pwd, n.mobile.Split(','), n.message, "", n.Server_url);
                                                    result = skebby.skebbyGatewaySendSMS();
                                                    if ((string)result["status"] == "failed")
                                                    {
                                                        throw new System.ArgumentException("Code: " + result["code"] + ", Message: " + result["message"]);
                                                    }
                                                    break;
                                                default:
                                                    break;
                                            }
                                            updateDeliveredNotification(n.id, instance.registrationEntityConnectionString);
                                        }
                                        catch (Exception ex)
                                        {
                                            updateNotificationError(ex.Message, n.id, instance.registrationEntityConnectionString);
                                        }
                                        break;
                                    case "UI":
                                        try
                                        {
                                            //refresh means that when this message will be shipped to the UI the notification will be refreshed instead of saving them into mongo 
                                            JObject message = JObject.FromObject(new { content = n.message, refresh = true, from = n.sender_user, threadmembers = n.ThreadMembers });
                                            MagicHub.SendTo(instance.appInstancename, n.Username, Newtonsoft.Json.JsonConvert.SerializeObject(message));
                                            updateDeliveredNotification(n.id, instance.registrationEntityConnectionString);
                                            //var notific = new Models.Notification();
                                            //notific.Message = n.message;
                                            //notific.Type = "info";
                                            //notific.PushMessageToMongo(n.Username, instance.appInstancename);
                                        }
                                        catch (Exception ex)
                                        {
                                            updateNotificationError(ex.Message, n.id, instance.registrationEntityConnectionString);
                                        }
                                        break;
                                    default:
                                        break;
                                }
                            }
                        }
                        catch (Exception e)
                        {
                            MFLog.LogInFile($"MagicFramework.Jobs.NotificationJobInner@Execute: {instance.appInstancename} - {e.Message}", MFLog.logtypes.ERROR);
                        }
                    }
              }
            }
            catch (Exception e)
            {
                MFLog.LogInFile("MagicFramework.Jobs.NotificationJob@Execute: " + e.Message, MFLog.logtypes.DEBUG);
            }
          
        }
        private void updateDeliveredNotification(int notificationid,string connection)
        {
            Data.MagicDBEntities _context = new Data.MagicDBEntities(connection);
            var notification = (from e in _context.Magic_NotificationQueue where e.id == notificationid select e).FirstOrDefault();
            notification.notified = true;
            notification.send_attempts += 1;
            notification.notified_at = DateTime.Now;
            notification.error = null;
            _context.SaveChanges();
        }
        private void updateNotificationError(string error, int notificationid,string connection)
        {
            Data.MagicDBEntities _context = new Data.MagicDBEntities(connection);
            var notification = (from e in _context.Magic_NotificationQueue where e.id == notificationid select e).FirstOrDefault();
            notification.notified = false;
            notification.send_attempts += 1;
            notification.last_attempt = DateTime.Now;
            notification.error = error;
            notification.notified_at = null;
            _context.SaveChanges();
        }

        //init this job, we'll check for notifications to send every minute
        public static void InitJob()
        {
            ISchedulerFactory schedFact = new StdSchedulerFactory();

            // get a scheduler
            IScheduler sched = schedFact.GetScheduler();
            sched.Start();
            // define the job and tie it to our job class
            IJobDetail job = JobBuilder.Create<NotificationJob>()
                .WithIdentity("SchedulerNotificationJob", "SchedulerJobs")
                .Build();

            // Trigger the job to run now, and then every 60 seconds
            ITrigger trigger = TriggerBuilder.Create()
              .WithIdentity("SchedulerNotificationJobTrigger", "SchedulerJobs")
              .StartNow()
              .WithSimpleSchedule(x => x
                  .WithIntervalInSeconds(60)
                  .RepeatForever())
              .Build();

            sched.ScheduleJob(job, trigger);
        }


    }
}
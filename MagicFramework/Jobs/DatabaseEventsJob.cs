using MagicFramework.Helpers;
using Quartz;
using Quartz.Impl;
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using MagicEventsManager;
using System.Data.SqlClient;

namespace MagicFramework.Jobs
{
    public class DatabaseEventsJob : IJob
    {
        public const string LOG_FILE_NAME = "MagicEventsManagerLog.txt";
        public void Execute(IJobExecutionContext context)
        {
            try {
                //loop trough all config files
                var configs = new MFConfiguration().LoadConfigurations();
                foreach (var config in configs)
                {
                    //loop trough all instances
                    foreach (var instance in config.Value.listOfInstances.Where(i => i.dBEventsJobActive == true))
                    {
                        Scheduler s = new Scheduler(instance.TargetDBconn, instance.MagicDBConnectionString, instance.appInstancename, 0,instance.directorylog);
                        s.EventExecuted += new Scheduler.EventExecutedEventHandler(s_EventExecuted);
                        s.Run();
                    }
                }
            }
            catch (Exception e)
            {
                MFLog.LogInFile("MagicFramework.Jobs.DatabaseEventsJob@Execute: " + e.Message, MFLog.logtypes.DEBUG, LOG_FILE_NAME);
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
            IJobDetail job = JobBuilder.Create<DatabaseEventsJob>()
                .WithIdentity("SchedulerDBEventsJob", "SchedulerJobs")
                .Build();

            // Trigger the job to run now, and then every 60 seconds
            ITrigger trigger = TriggerBuilder.Create()
              .WithIdentity("SchedulerDBEventsJobTrigger", "SchedulerJobs")
              .StartNow()
              .WithSimpleSchedule(x => x
                  .WithIntervalInSeconds(90)
                  .RepeatForever())
              .Build();

            sched.ScheduleJob(job, trigger);
        }
        void s_EventExecuted(object sender, AlertEventArgs e)
        {
            SqlConnection connection = new SqlConnection(e.ConnectionString);
            string database = connection.Database.ToString();


            //Setta il testo da aggiungere al log
            string text = "[" + e.Evento.TsExecutionEnd.ToString(Resources.Resource.FORMAT_DATETIME) +
                "] --> DBName: " + database +
                ", " + Resources.Resource.LBL_ATTIVITA + ": " + e.Evento.IDPlannedEvent +
                ", " + Resources.Resource.LBL_EVENTO + ": " + e.Evento.EventID + ", " + Resources.Resource.LBL_ESITO + ": " +
                (e.Esito ? Resources.Resource.LBL_OK : Resources.Resource.LBL_KO);

            if (e.ExecutionException != null)
            {
                text += "[Eccezione" + e.ExecutionException.ToString() + "]\n";
                if (e.ExecutionException is SqlException)
                {
                    SqlException sqlEx = (SqlException)e.ExecutionException;
                    for (int i = 0; i < sqlEx.Errors.Count; i++)
                    {
                        text += "\nDettagli SQLException:\n" +
                            "Index #" + i + "\n" +
                            "Message: " + sqlEx.Errors[i].Message + "\n" +
                            "LineNumber: " + sqlEx.Errors[i].LineNumber + "\n" +
                            "Source: " + sqlEx.Errors[i].Source + "\n" +
                            "Procedure: " + sqlEx.Errors[i].Procedure + "\n";
                    }
                }
                MFLog.LogInFile(text, MFLog.logtypes.ERROR, LOG_FILE_NAME,e.directoryLog);
            }
            else
                MFLog.LogInFile(text, MFLog.logtypes.INFO, LOG_FILE_NAME,e.directoryLog);


        }
       
    }
}
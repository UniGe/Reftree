using MagicFramework.Helpers;
using Quartz;
using Quartz.Impl;
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace MagicFramework.Jobs
{
    public class SessionCheckJob : IJob
    {
        private static string connectionString;
        private static string suffix;
        private static System.Web.Configuration.SessionStateSection sessionSettings;
        private static Hashtable loggedSessions;
        private static Action<string[]> removeSessionIds;

        public void Execute(IJobExecutionContext context)
        {
            if (loggedSessions.Count > 0)
            {
                string[] sessionIds = loggedSessions.Keys.Cast<string>().ToArray();
                List<string> activeSessions = new List<string>();
                try
                {
                    using (SqlConnection connection = new SqlConnection(connectionString))
                    {
                        if (suffix == null)
                        {
                            using (SqlCommand command = new SqlCommand("SELECT SessionId FROM ASPStateTempSessions WHERE SessionId LIKE '" + sessionIds.First() + "%'", connection))
                            {
                                connection.Open();
                                using (SqlDataReader reader = command.ExecuteReader())
                                {
                                    while (reader.Read())
                                    {
                                        string id = reader["SessionId"].ToString();
                                        suffix = id.Replace(sessionIds.First(), "");
                                    }
                                }
                                connection.Close();
                            }
                        }
                        string sqlCommand = "SELECT SessionId FROM ASPStateTempSessions WHERE SessionId IN ('" + String.Join(suffix + "','", sessionIds) + suffix + "')";
                        //AND Expires > '" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "'"; additional expiration check which causes problems due to lazy update management
                        using (SqlCommand command = new SqlCommand(sqlCommand, connection))
                        {
                            connection.Open();
                            using (SqlDataReader reader = command.ExecuteReader())
                            {
                                while (reader.Read())
                                {
                                    activeSessions.Add(reader["SessionId"].ToString().Replace(suffix, ""));
                                }
                            }
                            connection.Close();
                        }
                    }
                }
                catch (Exception e)
                {
                    MFLog.LogInFile("MagicFramework.Jobs.SessionCheckJob@Execute: Error message " + e.Message, MFLog.logtypes.ERROR);
                    return;
                }
                sessionIds = sessionIds.Where(_ => !activeSessions.Contains(_)).ToArray();
                if(sessionIds.Length > 0)
                {
                    removeSessionIds(sessionIds);
                }
            }
            var configs = new MFConfiguration().LoadConfigurations();
            foreach (var config in configs)
            {
                if(config.Value.Redirects != null)
                {
                    foreach(var appInstance in config.Value.listOfInstances)
                    {
                        try
                        {
                            var db = new Data.MagicDBDataContext(appInstance.TargetDBconn);
                            db.Magic_Mmb_UsersExternalApiAuthorizations.DeleteAllOnSubmit(db.Magic_Mmb_UsersExternalApiAuthorizations.Where(a => a.expires < DateTime.Now.AddHours(-1 * Models.Magic_Mmb_UsersExternalApiAuthorizations.tokenValidityInHours)).ToList());
                            db.SubmitChanges();
                        }
                        catch(Exception e)
                        {
                            MFLog.LogInFile("MagicFramework.Jobs.SessionCheckJob@Execute2: " + config.Value.applicationDomain + " - " + appInstance.appInstancename + ": Error message " + e.Message, MFLog.logtypes.ERROR);
                        }
                    }
                }
            }
        }

        //init this job, we'll check for notifications to send every minute
        public static void InitJob(System.Web.Configuration.SessionStateSection sessionSettings, Hashtable loggedSessions, Action<string[]> removeSessionIds)
        {
            SessionCheckJob.sessionSettings = sessionSettings;
            SessionCheckJob.loggedSessions = loggedSessions;
            SessionCheckJob.removeSessionIds = removeSessionIds;
            connectionString = sessionSettings.SqlConnectionString;
            if (!sessionSettings.AllowCustomSqlDatabase)
                connectionString = connectionString.Trim(';') + ";Initial Catalog=ASPState;";

            ISchedulerFactory schedFact = new StdSchedulerFactory();

            // get a scheduler
            IScheduler sched = schedFact.GetScheduler();
            sched.Start();

            // define the job and tie it to our job class
            IJobDetail job = JobBuilder.Create<SessionCheckJob>()
                .WithIdentity("SessionCheckJob", "SessionJobs")
                .Build();

            // trigger set to 4:00
            ITrigger trigger = TriggerBuilder.Create()
              .WithIdentity("SessionCheckJobTrigger", "SessionJobs")
              .WithCronSchedule("0 0 4 * * ?")
              .Build();

            sched.ScheduleJob(job, trigger);
        }
    }
}
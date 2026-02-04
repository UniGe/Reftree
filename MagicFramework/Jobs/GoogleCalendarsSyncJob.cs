using MagicFramework.Helpers;
using Quartz;
using Quartz.Impl;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MagicFramework.Jobs
{
    [DisallowConcurrentExecution]
    public class GoogleCalendarsSyncJob : IJob
    {
        public void Execute(IJobExecutionContext context)
        {
            try
            {
                var configs = new MFConfiguration().LoadConfigurations();
                foreach (var config in configs)
                {
                    try
                    {
                        foreach (var applicationConfig in config.Value.listOfInstances)
                        {
                            try
                            {
                                if (string.IsNullOrWhiteSpace(applicationConfig.GoogleCalenderOAuthConfig))
                                    continue;
                                GoogleCalendarsSyncher syncer = new GoogleCalendarsSyncher(applicationConfig);
                                syncer.PullAllUsersEvents();
                                //write all the events with start date minor < -2 days  which have been not been synced for some reason e.g workflow activities which are created via SP
                                syncer.PushAllUnsyncedEvents();
                            }
                            catch(Exception e)
                            {
                                LogException(e);
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        LogException(e);
                    }
                }
            }
            catch(Exception e)
            {
                LogException(e);
            }
        }

        private void LogException(Exception e)
        {
            MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
        }

        public static void InitJob()
        {
            ISchedulerFactory schedFact = new StdSchedulerFactory();

            // get a scheduler
            IScheduler sched = schedFact.GetScheduler();
            sched.Start();
            // define the job and tie it to our job class
            IJobDetail job = JobBuilder.Create<GoogleCalendarsSyncJob>()
                .WithIdentity("GoogleCalendarsSyncJob", "SchedulerJobs")
                .Build();

            // Trigger the job to run now, and then every 1 minutes
            ITrigger trigger = TriggerBuilder.Create()
              .WithIdentity("GoogleCalendarsSyncJobTrigger", "SchedulerJobs")
              .StartNow()
              .WithSimpleSchedule(x => x
                  .WithIntervalInMinutes(1)
                  .RepeatForever())
              .Build();

            sched.ScheduleJob(job, trigger);
        }
    }
}

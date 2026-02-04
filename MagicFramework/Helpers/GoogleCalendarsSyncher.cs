using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using System.IO;
using System.Threading;
using System.Web;
using System.Net;
using System.Data.SqlClient;
using System.Dynamic;

namespace MagicFramework.Helpers
{
    public class GoogleCalendarsSyncher : GoogleCalendar
    {
        public const string IMPORT_STORED_PROCEDURE_NAME = "EXEC dbo.Magic_ImportGoogleEvents";

        string credentialsPath;
        const string ApplicationName = "MagicCalendar";
        Data.MagicDBDataContext context;
        Data.Magic_Mmb_Users_Extensions currentUserExtension;

        public GoogleCalendarsSyncher()
        {
            config = MFConfiguration.GetApplicationInstanceConfiguration();
            credentialsPath = System.Environment.GetFolderPath(
                    System.Environment.SpecialFolder.MyVideos);
            credentialsPath = Path.Combine(credentialsPath, ".credentials/GoogleOAuth/");
        }

        public GoogleCalendarsSyncher(MFConfiguration.ApplicationInstanceConfiguration config)
        {
            this.config = config;
            credentialsPath = System.Environment.GetFolderPath(
                    System.Environment.SpecialFolder.MyVideos);
            credentialsPath = Path.Combine(credentialsPath, ".credentials/GoogleOAuth/");
        }

        public Google.Apis.Auth.OAuth2.Responses.TokenResponse ExchangeCodeForTokenAndWriteTokenToUserExtension(string code, Data.Magic_Mmb_Users_Extensions userExtension)
        {
            Google.Apis.Auth.OAuth2.Responses.TokenResponse tokenResponse = null;
            using (var stream = new MemoryStream(Encoding.UTF8.GetBytes(config.GoogleCalenderOAuthConfig)))
            {
                var flow = new Google.Apis.Auth.OAuth2.Flows.GoogleAuthorizationCodeFlow(
                        new Google.Apis.Auth.OAuth2.Flows.GoogleAuthorizationCodeFlow.Initializer
                        {
                            ClientSecrets = GoogleClientSecrets.Load(stream).Secrets,
                            Scopes = Scopes
                        }
                    );
                tokenResponse = flow.ExchangeCodeForTokenAsync(userExtension.GoogleCalendarEmail, code, GetRedirectUri(), CancellationToken.None).Result;
            }
            userExtension.GoogleCalendarToken = tokenResponse.RefreshToken + "," + tokenResponse.AccessToken;
            return tokenResponse;
        }

        public static string GetAuthorizationUrl()
        {
            //Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            //var user = context.Magic_Mmb_Users.Where(u => u.Username == HttpContext.Current.User.Identity.Name).FirstOrDefault().Magic_Mmb_Users_Extensions;
            Newtonsoft.Json.Linq.JObject o = Newtonsoft.Json.Linq.JObject.Parse(MFConfiguration.GetApplicationInstanceConfiguration().GoogleCalenderOAuthConfig);
            StringBuilder url = new StringBuilder();
            url.Append(o["web"]["auth_uri"]);
            url.Append("?response_type=code");
            url.Append("&client_id=" + o["web"]["client_id"]);
            url.Append("&redirect_uri=" + GetRedirectUriUrlEncoded());
            url.Append("&scope=" + string.Join(",", Scopes));
            url.Append("&access_type=offline");
            //url.Append("&login_hint=" + user.GoogleCalendarEmail);
            return url.ToString();
            //var httpWebRequest = WebRequest.Create(url.ToString()) as HttpWebRequest;
            //return httpWebRequest.GetResponseAsync();
        }

        public static string GetRedirectUriUrlEncoded()
        {
            return HttpUtility.UrlEncode(GetRedirectUri());
        }

        public static string GetRedirectUri()
        {
            return "http" + (HttpContext.Current.Request.IsSecureConnection ? "s" : "") + "://" + HttpContext.Current.Request.Url.Authority + "/api/Magic_Mmb_Users/AuthorizeGoogleCalendar";
        }

        public CalendarService GetUserCalendar(Data.Magic_Mmb_Users_Extensions userExtension)
        {
            return GetUserCalendar(userExtension.GoogleCalendarToken, userExtension.GoogleCalendarEmail, userExtension);
        }

        public CalendarService GetUserCalendar(string concatedTokens, string googleCalendarEmail, Data.Magic_Mmb_Users_Extensions userExtension = null)
        {
            UserCredential credential;
            currentUserExtension = userExtension;
            using (var stream = new MemoryStream(Encoding.UTF8.GetBytes(config.GoogleCalenderOAuthConfig)))
            {
                GoogleClientSecrets secrets = GoogleClientSecrets.Load(stream);
                var flow = new Google.Apis.Auth.OAuth2.Flows.GoogleAuthorizationCodeFlow(
                        new Google.Apis.Auth.OAuth2.Flows.GoogleAuthorizationCodeFlow.Initializer
                        {
                            ClientSecrets = secrets.Secrets,
                            Scopes = Scopes
                        }
                    );
                string[] tokenData = concatedTokens.Split(',');
                credential = new UserCredential(
                    flow,
                    googleCalendarEmail,
                    new Google.Apis.Auth.OAuth2.Responses.TokenResponse
                    {
                        AccessToken = tokenData[1],
                        RefreshToken = tokenData[0]
                    }
                );
            }

            return new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = ApplicationName,
            });
        }

        public CalendarService GetUserCalendar(Google.Apis.Auth.OAuth2.Responses.TokenResponse tokenResponse, string userEmail)
        {
            UserCredential credential;
            using (var stream = new MemoryStream(Encoding.UTF8.GetBytes(config.GoogleCalenderOAuthConfig)))
            {
                GoogleClientSecrets secrets = GoogleClientSecrets.Load(stream);
                var flow = new Google.Apis.Auth.OAuth2.Flows.GoogleAuthorizationCodeFlow(
                        new Google.Apis.Auth.OAuth2.Flows.GoogleAuthorizationCodeFlow.Initializer
                        {
                            ClientSecrets = secrets.Secrets,
                            Scopes = Scopes
                        }
                    );
                credential = new UserCredential(
                    flow,
                    userEmail,
                    tokenResponse
                );
            }

            return new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = ApplicationName,
            });
        }

        public void SyncEventAsync(dynamic data, string eventId, List<int> userIds, bool insert = false)
        {
            Data.Magic_Mmb_Users_Extensions user = null;
            if (data.ownerId != null)
                user = GetConfiguredGoogleCalendar((int)data.ownerId);
            //if (user == null && data.ownerId != data.creatorId)
            //    user = GetConfiguredGoogleCalendar((int)data.creatorId);
            if (user != null)
            {
                try
                {
                    calendar = GetUserCalendar(user);
                    SaveEventAsync(data, eventId, user.GoogleCalendarId, insert, userIds);
                }
                catch(Exception e)
                {
                    MFLog.LogInFile("MagicFramework.Helpers.GoogleCalendarsSyncherUser@SyncEventAsync: CalendarEmail: " + user.GoogleCalendarEmail + " Message: " + e.Message, MFLog.logtypes.ERROR);
                }
            }
        }

        public Task DeleteEventAsync(string eventId, int userId)
        {
            var c = GetConfiguredGoogleCalendar(userId);
            if (c != null)
            {
                try
                {
                    calendar = GetUserCalendar(c);
                    return DeleteEventAsync(eventId, c.GoogleCalendarId);
                }
                catch (Exception e)
                {
                    MFLog.LogInFile("MagicFramework.Helpers.GoogleCalendarsSyncherUser@DeleteEventAsync: CalendarEmail: " + c.GoogleCalendarEmail + " Message: " + e.Message, MFLog.logtypes.ERROR);
                }
            }
            return null;
        }

        public string CreateCalendarIfNotExists()
        {
            return CreateCalendarIfNotExists(config.appInstancename);
        }

        public string RecreateCalendarIfExists()
        {
            return RecreateCalendarIfExists(config.appInstancename); 
        }

        string GetUserCredentialPath(string email)
        {
            return credentialsPath + email + ".json";
        }

        public List<Data.Magic_Calendar> GetAllUsersEvents()
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            return context.Magic_Calendar.Where(
                e => e.ownerId == SessionHandler.IdUser
            ).ToList();
        }
        /// <summary>
        /// Gets events that should be synced (owners have configured gcal and start date is max. 2 days old or end is in the future)
        /// </summary>
        /// <param name="daysInPast">the number of days in the past for event start</param>
        /// <returns></returns>
        public List<Data.Magic_Calendar> GetRecentUnsyncedEvents(Data.MagicDBDataContext context,int daysInPast = -2)
        {
           
            return context.Magic_Calendar.Where(
                e =>
                    (e.start >= DateTime.Now.AddDays(daysInPast) || e.end > DateTime.Now)
                    && e.GoogleEventId == null  
                    && e.Magic_Mmb_Users1.Magic_Mmb_Users_Extensions.GoogleCalendarToken != null
                    && e.Magic_Mmb_Users1.Magic_Mmb_Users_Extensions.GoogleCalendarId != null
                    && e.Magic_Mmb_Users1.Magic_Mmb_Users_Extensions.GoogleCalendarEmail != null
            ).Take(20).ToList();
        
        }
        /// <summary>
        /// gets all the events which have been updated directly from Db and inserted in the google update queue
        /// </summary>
        /// <param name="daysInPast"></param>
        /// <returns></returns>
        public List<Data.Magic_Calendar_Google_UpdateQueue> GetUnsyncedEventsFromUpdateQueue(Data.MagicDBDataContext context)
        {
           
            return context.Magic_Calendar_Google_UpdateQueue.Where(
                e => e.got_pushed == false && e.is_in_process == false && e.deleted == false
            ).Take(20).ToList();

        }

        public List<Data.Magic_Calendar_Google_UpdateQueue> GetUnsyncedEventsFromUpdateQueueToDelete(Data.MagicDBDataContext context)
        {

            return context.Magic_Calendar_Google_UpdateQueue.Where(
                e => e.got_pushed == false && e.is_in_process == false && e.deleted == true
            ).Take(20).ToList();

        }

        public List<Data.Magic_Calendar> GetRecentUsersEvents()
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            return context.Magic_Calendar.Where(
                e =>
                    e.start >= DateTime.Now.AddMonths(-1)
                    && e.ownerId == SessionHandler.IdUser
            ).ToList();
        }

        public System.Data.DataTable GetAllRecentGoogleEventsWhereUserIsAttendee()
        {
            var query = new Sql.DBQuery(@"SELECT *
                            FROM [dbo].[Magic_Calendar] c
                            INNER JOIN dbo.Magic_Calendar_Relations r
                            ON r.Calendar_ID = c.taskId AND r.AttendeeUser_ID = " + SessionHandler.IdUser + @" AND r.[UserGroupVisibility_ID] IS NOT NULL
                            INNER JOIN [dbo].[Magic_Mmb_Users_Extensions] e
                            ON e.UserID = c.ownerId AND e.GoogleCalendarId IS NOT NULL AND e.GoogleCalendarEmail IS NOT NULL");
            query.AddWhereCondition("start >= @time", DateTime.Now.AddMonths(-1));
            return query.Execute();
        }

        public System.Data.DataTable GetAllRecentUnsyncedGoogleEventsWhereUserIsAttendee(int userId,int daysInPast = -2)
        {
            var query = new Sql.DBQuery(@"SELECT *
                            FROM [dbo].[Magic_Calendar] c
                            INNER JOIN dbo.Magic_Calendar_Relations r
                            ON r.Calendar_ID = c.taskId AND r.AttendeeUser_ID = " + userId + @" AND r.[UserGroupVisibility_ID] IS NOT NULL
                            INNER JOIN [dbo].[Magic_Mmb_Users_Extensions] e
                            ON e.UserID = c.ownerId AND e.GoogleCalendarId IS NOT NULL AND e.GoogleCalendarEmail IS NOT NULL");
            query.AddWhereCondition("start >= @time", DateTime.Now.AddDays(daysInPast));
            return query.Execute();
        }

        public async void PushAllEventsOfUser(Data.Magic_Mmb_Users_Extensions userExtension)
        {
            try
            {
                List<Data.Magic_Calendar> events;
                events = GetRecentUsersEvents();
                calendar = GetUserCalendar(userExtension);
                if (events.Any())
                {
                    foreach (var e in events)
                    {
                        try
                        {
                            if (e.GoogleEventId == null)
                            {
                                e.GoogleEventId = GetNewId();
                            }
                            //add creator as attendee
                            //only use owner to sync events - ok
                            //remove events from google calender if owner removes his calender - ok

                            //if user adds his cal and is attendee somewhere add him as attendee to this calendar

                            //add field google_calendar_user_email and google_calendar_id to magic_calendar_google_events to check if we need to recreate event in order to make local owner to owner on google
                            //add also in pushing to google an entry in magic_calendar_google_events in order to track user and calendar
                            //add a method where to remove events from old calendar before adding new google calendar acc for user - ok
                            //if an email gets removed we need to call a method to get all events for this user and recreate them for the remaining users - nope
                            //check attendees and remove and add - ok
                            await SaveEventAsync(e, e.GoogleEventId, userExtension.GoogleCalendarId, true);
                        }
                        catch (Exception ex)
                        {
                            MFLog.LogInFile(ex, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                        }
                    }
                    context.SubmitChanges();
                }
                var result = GetAllRecentGoogleEventsWhereUserIsAttendee();
                if (result == null || result.Rows.Count < 1)
                    return;
             //   config = MFConfiguration.GetApplicationInstanceConfiguration();
                foreach (System.Data.DataRow e in result.Rows)
                {
                    try
                    {
                        calendar = GetUserCalendar((string)e["GoogleCalendarToken"], (string)e["GoogleCalendarEmail"]);
                        await UpdateAttendees((string)e["GoogleEventId"], (int)e["taskId"], (string)e["GoogleCalendarId"]);
                    }
                    catch (Exception ex)
                    {
                        MFLog.LogInFile(ex, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                    }
                }
            }
            catch(Exception e)
            {
                MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
            }
        }
        public async void PushAllUnsyncedEvents()
        {
            try
            {
                List<Data.Magic_Calendar> events;
                List<Data.Magic_Calendar_Google_UpdateQueue> events_to_update;
                List<Data.Magic_Calendar_Google_UpdateQueue> events_to_delete;

                var dbcontext = new Data.MagicDBDataContext(config.TargetDBconn);
                events = GetRecentUnsyncedEvents(dbcontext);
                events_to_update = GetUnsyncedEventsFromUpdateQueue(dbcontext);
                events_to_delete = GetUnsyncedEventsFromUpdateQueueToDelete(dbcontext);
                //get the owners
                var userExtensions = events.Select(l => l.Magic_Mmb_Users1.Magic_Mmb_Users_Extensions).Distinct().ToList();
                //book events to avoid syncing twice...
                foreach (var etu in events_to_update)
                     etu.is_in_process = true;
                 dbcontext.SubmitChanges();

                 foreach (var etu in events_to_delete)
                     etu.is_in_process = true;
                 dbcontext.SubmitChanges();
                
                foreach (var etd in events_to_delete)
                {
                    try
                    {
                       var c = context.Magic_Mmb_Users_Extensions.Where(e => e.UserID == etd.prevOwnerId && e.GoogleCalendarEmail != null && e.GoogleCalendarId != null).FirstOrDefault();
                        if (c != null)
                        {
                            calendar = GetUserCalendar(c);
                            await DeleteEventAsync((string)etd.google_event_id, c.GoogleCalendarId);
                        }
                        etd.got_pushed = true;
                        etd.syncDate = DateTime.Now;
                        etd.is_in_process = false;
                        dbcontext.SubmitChanges();
                        
                    }
                    catch (Exception ex)
                    {
                        MFLog.LogInFile(ex, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                    }
                }


                foreach (var etu in events_to_update)
                {
                    try
                    {
                        bool insert = false;
                        string guid = (string)etu.Magic_Calendar.GoogleEventId;
                        
                        if ((etu.prevOwnerId != null && etu.prevOwnerId != etu.Magic_Calendar.ownerId)|| etu.deleted )
                        {
                            var c= context.Magic_Mmb_Users_Extensions.Where(e => e.UserID == etu.prevOwnerId && e.GoogleCalendarEmail != null && e.GoogleCalendarId != null).FirstOrDefault();
                            if (c != null)
                            {
                                calendar = GetUserCalendar(c);
                                await DeleteEventAsync((string)etu.Magic_Calendar.GoogleEventId, c.GoogleCalendarId);
                            }
                            insert = true;
                            guid = GetNewId();
                        }
                       
                        Data.Magic_Mmb_Users_Extensions user = null;

                        if (etu.Magic_Calendar.ownerId != null)
                            user = context.Magic_Mmb_Users_Extensions.Where(e => e.UserID == etu.Magic_Calendar.ownerId && e.GoogleCalendarEmail != null && e.GoogleCalendarId != null).FirstOrDefault();
                   
                        if (user != null)
                        {
                           
                             calendar = GetUserCalendar(user);
                             await SaveEventAsync(etu.Magic_Calendar, guid, user.GoogleCalendarId, insert);
                             etu.Magic_Calendar.GoogleEventId = guid;
                             etu.got_pushed = true;
                             etu.syncDate = DateTime.Now;
                             etu.is_in_process = false;
                             dbcontext.SubmitChanges();
                         }
                    }
                    catch (Exception ex) {
                        MFLog.LogInFile(ex, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                    }
                }

                foreach (var u in userExtensions)
                {
                    calendar = GetUserCalendar(u);
                    var userEvents = events.Where(x => x.ownerId == u.UserID);
                    if (userEvents.Any())
                    {
                        foreach (var e in userEvents)
                        {
                            try
                            {
                                if (e.GoogleEventId == null)
                                {
                                    e.GoogleEventId = GetNewId();
                                    //book the event so it won't be synced anymore
                                    var data = new Dictionary<string, object>();
                                    data.Add("GoogleEventId", e.GoogleEventId);
                                    var writer = new Sql.DBWriter("dbo.Magic_Calendar", data, e.taskId,"taskId");
                                    writer.connectionString = config.TargetDBconn;
                                    writer.Write();
                                }
                                await SaveEventAsync(e, e.GoogleEventId, u.GoogleCalendarId, true);
                            }
                            catch (Exception ex)
                            {
                                MFLog.LogInFile(ex, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                            }
                        }
                 
                    }
                    //update owners' calendar with the user as an attendee
                    var result = GetAllRecentUnsyncedGoogleEventsWhereUserIsAttendee(u.UserID);
                    if (result!=null)
                        foreach (System.Data.DataRow e in result.Rows)
                        {
                            try
                            {
                                calendar = GetUserCalendar((string)e["GoogleCalendarToken"], (string)e["GoogleCalendarEmail"]);
                                await UpdateAttendees((string)e["GoogleEventId"], (int)e["taskId"], (string)e["GoogleCalendarId"]);
                            }
                            catch (Exception ex)
                            {
                                MFLog.LogInFile(ex, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                            }
                        }
                }
            }
            catch (Exception e)
            {
                MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
            }
        }

        public async Task DeleteAllEventsOfUserAsync(Data.Magic_Mmb_Users_Extensions userExtension)
        {
            try
            {
                List<Data.Magic_Calendar> events;
                List<Task> deleteTasks = new List<Task>();
                events = GetAllUsersEvents();
                if (events.Any()) {
                    calendar = GetUserCalendar(userExtension);
                    foreach (var e in events)
                    {
                        try
                        {
                            if (e.GoogleEventId == null)
                            {
                                continue;
                            }
                            deleteTasks.Add(DeleteEventAsync(e.GoogleEventId, userExtension.GoogleCalendarId));
                        }
                        catch (Exception ex)
                        {
                            MFLog.LogInFile(ex, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                        }
                    }
                    await Task.WhenAll(deleteTasks);
                }
            }
            catch (Exception e)
            {
                MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
            }
        }

        public void RevokeAppAccess(Data.Magic_Mmb_Users_Extensions userExtension)
        {
            try
            {
                using (var client = new System.Net.Http.HttpClient())
                {
                    client.GetAsync("https://accounts.google.com/o/oauth2/revoke?token=" + userExtension.GoogleCalendarToken.Split(',')[1]).Wait();
                }
            }
            catch (Exception e)
            {
                MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
            }
        }

        public void PullAllUsersEvents()
        {
            try
            {
                context = new Data.MagicDBDataContext(config.TargetDBconn);
                var calendarsToUpdate = context.Magic_Mmb_Users_Extensions.Where(e => e.GoogleCalendarEmail != null && e.GoogleCalendarId != null && e.GoogleCalendarToken != null).ToList();
                if (calendarsToUpdate.Any())
                {
                    foreach (var c in calendarsToUpdate)
                    {
                        try
                        {
                            PullUsersEvents(c);
                        }
                        catch (Exception e)
                        {
                            MFLog.LogInFile("MagicFramework.Helpers.GoogleCalendarsSyncherUser@SyncEventAsync: CalendarEmail: " + c.GoogleCalendarEmail + " Message: " + e.Message, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                        }
                    }
                    context.SubmitChanges();
                    //run the import stored procedure
                    context.ExecuteCommand(IMPORT_STORED_PROCEDURE_NAME);
                }
            }
            catch(Exception e)
            {
                MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
            }
        }

        private void PullUsersEvents(Data.Magic_Mmb_Users_Extensions c)
        {
            calendar = GetUserCalendar(c);
            string[] tokens = c.GoogleCalendarToken.Split(',');
            EventsResource.ListRequest request = calendar.Events.List(c.GoogleCalendarId);

            // Load the sync token stored from the last execution, if any.
            String syncToken = tokens.Length != 3 ? null : tokens[2];
            if (syncToken == null)
            {
                //System.out.println("Performing full sync.");

                // Set the filters you want to use during the full sync. Sync tokens aren't compatible with
                // most filters, but you may want to limit your full sync to only a certain date range.
                // In this example we are only syncing events up to a year old.
                DateTime dateFrom = DateTime.Now.AddMonths(-1);
                request.TimeMin = dateFrom;
                request.ShowDeleted = true;
            }
            else
            {
                //System.out.println("Performing incremental sync.");
                request.SyncToken = syncToken;
            }

            // Retrieve the events, one page at a time.
            String pageToken = null;
            Events events = null;
            do
            {
                request.PageToken = pageToken;

                try
                {
                    events = request.Execute();
                }
                catch (Google.GoogleApiException e)
                {
                    if (e.HttpStatusCode == HttpStatusCode.Gone)
                    {
                        c.GoogleCalendarToken = tokens[0] + "," + tokens[1];
                        PullUsersEvents(c);
                    }
                    else
                    {
                        throw e;
                    }
                }
                catch (HttpException e)
                {
                    if (e.GetHttpCode() == 410)
                    {
                        // A 410 status code, "Gone", indicates that the sync token is invalid.
                        //System.out.println("Invalid sync token, clearing event store and re-syncing.");
                        c.GoogleCalendarToken = tokens[0] + "," + tokens[1];
                        //eventDataStore.clear(); clear all events
                        PullUsersEvents(c);
                    }
                    else
                    {
                        throw e;
                    }
                }

                var items = events.Items;
                if (items.Count != 0)
                {
                    foreach (Event ev in items) {
                        StoreEvent(ev);
                    }
                }

                pageToken = events.NextPageToken;

            } while (pageToken != null);

            // Store the sync token from the last request to be used during the next execution.
            c.GoogleCalendarToken = tokens[0] + "," + tokens[1] + "," + events.NextSyncToken;
        }

        public bool PullUsersEvents(DateTime dateFrom, DateTime dateTo)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            var extension = context.Magic_Mmb_Users_Extensions.Where(e => e.UserID == SessionHandler.IdUser && e.GoogleCalendarToken != null && e.GoogleCalendarId != null && e.GoogleCalendarEmail != null).FirstOrDefault();
            if (extension == null)
                return false;
            PullUsersEvents(extension, dateFrom, dateTo);
            context.ExecuteCommand(IMPORT_STORED_PROCEDURE_NAME);
            return true;
        }

        public void PullUsersEvents(Data.Magic_Mmb_Users_Extensions c, DateTime dateFrom, DateTime dateTo)
        {
            calendar = GetUserCalendar(c);
            EventsResource.ListRequest request = calendar.Events.List(c.GoogleCalendarId);
            request.TimeMin = dateFrom;
            request.TimeMax = dateTo;
            request.ShowDeleted = true;

            String pageToken = null;
            Events events = null;
            do
            {
                request.PageToken = pageToken;
                events = request.Execute();

                var items = events.Items;
                if (items.Count != 0)
                {
                    foreach (Event ev in items)
                    {
                        StoreEvent(ev);
                    }
                }

                pageToken = events.NextPageToken;

            } while (pageToken != null);
        }

        private void StoreEvent(Event ev, bool secondTry = false)
        {
            try
            {
                string googleEventId = ev.Id;
                var getEvent = new Sql.DBQuery("SELECT * FROM dbo.Magic_Calendar_Google_Events");
                getEvent.connectionString = config.TargetDBconn;
                getEvent.AddWhereCondition("google_event_id = @gId", googleEventId);
                var events = getEvent.Execute();
                int id = 0;
                int magicCalendarId = 0;
                if (events != null)
                {
                    foreach (System.Data.DataRow row in events.Rows)
                    {
                        if (row["user_id"] != DBNull.Value && currentUserExtension != null && (int)row["user_id"] == currentUserExtension.UserID)
                        {
                            id = (int)row["id"];
                        }
                        if (magicCalendarId == 0 && row["magic_calendar_id"] != DBNull.Value)
                        {
                            magicCalendarId = (int)row["magic_calendar_id"];
                        }
                    }
                }

                if (ev.Status == "cancelled" && id != 0)
                {
                    if (ev.Start == null)
                    {
                        if (currentUserExtension != null && !secondTry)
                        {
                            try
                            {
                                var task = base.GetEvent(currentUserExtension.GoogleCalendarEmail, ev.Id);
                                task.Wait();
                                StoreEvent(task.Result, true);
                                return;
                            }
                            catch (Exception e)
                            {
                                if (e.InnerException != null && e.InnerException.GetType() == typeof(Google.GoogleApiException))
                                {
                                    Google.GoogleApiException ex = (Google.GoogleApiException)e.InnerException;
                                    if (ex.HttpStatusCode != HttpStatusCode.NotFound)
                                        return;
                                }
                                else
                                {
                                    MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                                    return;
                                }
                            }
                        }
                        else if (currentUserExtension == null)
                        {
                            MFLog.LogInFile("strange event - currentUserExtension is null - googleEventId: " + googleEventId + ", event: " + Newtonsoft.Json.JsonConvert.SerializeObject(ev, Newtonsoft.Json.Formatting.Indented), MFLog.logtypes.WARN, "GoogleCalendarSyncLog.txt", config.directorylog);
                            return;
                        }
                        else
                        {
                            MFLog.LogInFile("strange event info from google at second try: " + googleEventId + ", event: " + Newtonsoft.Json.JsonConvert.SerializeObject(ev, Newtonsoft.Json.Formatting.Indented), MFLog.logtypes.WARN, "GoogleCalendarSyncLog.txt", config.directorylog);
                            return;
                        }
                    }
                    var deletionWriter = new Sql.DBWriter("dbo.Magic_Calendar_Google_Events", new Dictionary<string, object> {
                        { "deleted", true },
                        { "got_imported", false },
                        { "event_xml", Utils.ObjectToXml(new { @event = ev }).InnerXml }
                    }, id);
                    deletionWriter.connectionString = config.TargetDBconn;
                    deletionWriter.Write();
                    return;
                }

                if (magicCalendarId == 0)
                {
                    getEvent = new Sql.DBQuery("SELECT taskId FROM dbo.Magic_Calendar");
                    getEvent.connectionString = config.TargetDBconn;
                    getEvent.AddWhereCondition("GoogleEventId = @eventId", googleEventId);
                    events = getEvent.Execute();
                    if (events != null)
                        magicCalendarId = (int)events.Rows[0]["taskId"];
                }

                var data = new Dictionary<string, object>();
                if (magicCalendarId != 0)
                    data.Add("magic_calendar_id", magicCalendarId);

                data.Add("google_event_id", googleEventId);
                data.Add("event_xml", Utils.ObjectToXml(new { @event = ev }).InnerXml);
                data.Add("deleted", ev.Status == "cancelled");
                data.Add("got_imported", false);
                if (currentUserExtension != null)
                    data.Add("user_id",  currentUserExtension.UserID);
                else
                    data.Add("user_id", null);

                var writer = new Sql.DBWriter("dbo.Magic_Calendar_Google_Events", data, id);
                writer.connectionString = config.TargetDBconn;
                writer.Write();

                if (currentUserExtension == null)
                    MFLog.LogInFile("currentUserExtension is null - googleEventId: " + googleEventId + ", event: " + Newtonsoft.Json.JsonConvert.SerializeObject(ev, Newtonsoft.Json.Formatting.Indented), MFLog.logtypes.WARN, "GoogleCalendarSyncLog.txt", config.directorylog);
            }
            catch(Exception e)
            {
                MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
            }
        }
    }
}

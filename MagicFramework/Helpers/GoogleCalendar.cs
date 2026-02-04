using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using Google.Apis.Util.Store;
using System.Threading;
using System.Security.Cryptography.X509Certificates;

namespace MagicFramework.Helpers
{
    public class GoogleCalendar
    {
        protected static string[] Scopes = { CalendarService.Scope.Calendar };
        protected const string GoogleApplicationName = "MagicCalendar";
        public CalendarService calendar;
        protected MFConfiguration.ApplicationInstanceConfiguration config;

        public Task<Event> SaveEventAsync(dynamic data, string eventId, string calendarId, bool insert = false, List<int> attendees = null)
        {
            EventDateTime start = new EventDateTime();
            EventDateTime end = new EventDateTime();
            if (Utils.IsPropertyExist(data, "isAllDay") && data.isAllDay == true)
            {
                start.Date = ((DateTime)data.start).ToString("yyyy-MM-dd");
                end.Date = ((DateTime)data.end).ToString("yyyy-MM-dd");
            }
            else
            {
                start.DateTime = (DateTime)(Utils.IsPropertyExist(data, "startUTC") ? data.startUTC : data.start);
                end.DateTime = (DateTime)(Utils.IsPropertyExist(data, "endUTC") ? data.endUTC : data.end);
            }
            Event eve = new Event()
            {
                Id = eventId,
                Description = (string)data.description,
                Summary = (string)data.title,
                Start = start,
                End = end,
                Location = data.address
            };
            if (attendees != null)
            {
                eve.Attendees = new List<EventAttendee>();
                foreach(var user in GetConfiguredGoogleCalendarUsers(attendees)) //we could use the user email if calendar is not configured
                {
                    eve.Attendees.Add(new EventAttendee {
                        Email = user.GoogleCalendarEmail
                    });
                }
            }
            if (insert)
                return InsertEventAync(eve, calendarId);
            else
                return UpdateEventAync(eventId, eve, calendarId);
        }

        private Task<Event> InsertEventAync(Event eve, string calendarId)
        {
            EventsResource.InsertRequest req = calendar.Events.Insert(eve, calendarId);
            string connectionString = DBConnectionManager.GetTargetConnection();
            var task = req.ExecuteAsync();
            //task.ContinueWith(e => LogInsertResult(connectionString, e));
            return task;
        }

        public async Task<Event> UpdateAttendees(string eventId, int taskId, string calendarId)
        {
            var query = new Sql.DBQuery(@"SELECT GoogleCalendarEmail FROM dbo.Magic_Calendar_Relations r
	                                            INNER JOIN dbo.Magic_Mmb_Users_Extensions u
		                                            ON u.UserId = r.AttendeeUser_ID AND GoogleCalendarEmail IS NOT NULL
	                                            WHERE r.[UserGroupVisibility_ID] IS NOT NULL AND Calendar_ID = " + taskId);
            query.connectionString = config.TargetDBconn;
            var attendees = await query.ExecuteAsync();
            var eve = new Event();
            if (attendees.HasRows)
            {
                eve.Attendees = new List<EventAttendee>();
                while (attendees.Read())
                {
                    eve.Attendees.Add(new EventAttendee {
                        Email = (string)attendees["GoogleCalendarEmail"]
                    });
                }
            }
            return await PatchEventAync(eventId, eve, calendarId);
        }

        private void LogInsertResult(string connectionString, Task<Event> eve)
        {
            //eve.i
        }

        private Task<Event> PatchEventAync(string eventId, Event eve, string calendarId)
        {
            EventsResource.PatchRequest req = calendar.Events.Patch(eve, calendarId, eventId);
            return req.ExecuteAsync();
        }

        private Task<Event> UpdateEventAync(string eventId, Event eve, string calendarId)
        {
            EventsResource.UpdateRequest req = calendar.Events.Update(eve, calendarId, eventId);
            return req.ExecuteAsync();
        }

        public Task DeleteEventAsync(string eventId, string calendarId)
        {
            //eventId = EncodeId(eventId);
            EventsResource.DeleteRequest req = calendar.Events.Delete(calendarId, eventId);
            return req.ExecuteAsync();
        }

        public string CreateCalendarIfNotExists(string name)
        {
            var cl = GetCalendar(name);
            if(cl == null)
            {
                var ca = CreateCalendar(name);
                return ca.Id;
            }
            return cl.Id;
        }

        public Calendar CreateCalendar(string name)
        {
            CalendarsResource.InsertRequest req2 = calendar.Calendars.Insert(new Calendar
            {
                Summary = name,
            });
            return req2.Execute();
        }

        public void DeleteCalendar(string calendarId)
        {
            calendar.Calendars.Delete(calendarId).ExecuteAsync();
        }

        public string RecreateCalendarIfExists(string name)
        {
            var cl = GetCalendar(name);
            if (cl != null)
                DeleteCalendar(cl.Id);
            return CreateCalendar(name).Id;
        }

        public CalendarListEntry GetCalendar(string name)
        {
            CalendarListResource.ListRequest req = calendar.CalendarList.List();
            var calendarList = req.Execute();
            return calendarList.Items.Where(c => c.Summary.Equals(name)).FirstOrDefault();
        }

        public Task<CalendarList> CalendarList()
        {
            CalendarListResource.ListRequest req = calendar.CalendarList.List();
            return req.ExecuteAsync();
        }

        public static string EncodeId(string id)
        {
            return Utils.Base32Encode(id).ToLower();
        }

        public static string GetNewId()
        {
            return EncodeId(Guid.NewGuid().ToString());
        }

        protected static string DecodeId(string id)
        {
            return Utils.Base32Decode(id);
        }

        protected bool TryGetLocalId(ref string id)
        {
            id = DecodeId(id);
            if (id.StartsWith(config.appInstancename + "::"))
            {
                id = id.Substring(config.appInstancename.Length + 2);
                return true;
            }
            return false;
        }

        public Task<Events> GetEvents(string calendarId)
        {
            EventsResource.ListRequest request = calendar.Events.List(calendarId);
            request.TimeMin = DateTime.Now;
            request.ShowDeleted = false;
            request.SingleEvents = true;
            request.MaxResults = 10;
            request.OrderBy = EventsResource.ListRequest.OrderByEnum.StartTime;

            return request.ExecuteAsync();
        }

        public Task<Event> GetEvent(string calendarId, string eventId)
        {
            EventsResource.GetRequest request = calendar.Events.Get(calendarId, eventId);
            return request.ExecuteAsync();
        }

        public static List<Data.Magic_Mmb_Users_Extensions> GetConfiguredGoogleCalendarUsers(List<int> userIds)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            return context.Magic_Mmb_Users_Extensions.Where(e => userIds.Contains(e.UserID) && e.GoogleCalendarEmail != null && e.GoogleCalendarId != null).ToList();
        }

        public static Data.Magic_Mmb_Users_Extensions GetConfiguredGoogleCalendar(int userId)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            return context.Magic_Mmb_Users_Extensions.Where(e => e.UserID == userId && e.GoogleCalendarEmail != null && e.GoogleCalendarId != null).FirstOrDefault();
        }

        class SqlDataStore : IDataStore
        {
            public Task ClearAsync()
            {
                throw new NotImplementedException();
            }

            public Task DeleteAsync<T>(string key)
            {
                throw new NotImplementedException();
            }

            public Task<T> GetAsync<T>(string key)
            {
                throw new NotImplementedException();
            }

            public Task StoreAsync<T>(string key, T value)
            {
                throw new NotImplementedException();
            }
        }
    }
}
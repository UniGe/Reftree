using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;

namespace MagicFramework.Helpers
{
    public class GoogleCalendarSyncher : GoogleCalendar
    {
        private string applicationName;
        private string CalendarId { get; set; }

        public class DataServiceAccountCredentials
        {
            public string client_user_email { get; set; }
            public string calendar_id { get; set; }
            public string private_key_id { get; set; }
            public string private_key { get; set; }
            public string client_email { get; set; }
            public string client_id { get; set; }
            public string type { get; set; }
        }

        public GoogleCalendarSyncher()
        {
            var instanceConfig = MFConfiguration.GetApplicationInstanceConfiguration();
            applicationName = instanceConfig.appInstancename;
            if (instanceConfig.GoogleCalendarConfig == null)
                throw new Exception("GoogleCalendarConfig is null");
            try
            {
                DataServiceAccountCredentials credentials = Newtonsoft.Json.JsonConvert.DeserializeObject<DataServiceAccountCredentials>(instanceConfig.GoogleCalendarConfig);
                InitCalendar(credentials);
            }
            catch (Exception e)
            {
                MFLog.LogInFile("MagicFramework.Helpers.GoogleCalendar@Constructor Error: " + e.Message, MFLog.logtypes.ERROR);
                throw new Exception("Error on setting up GoogleCalendar", e);
            };
        }

        public GoogleCalendarSyncher(DataServiceAccountCredentials credetnials)
        {
            InitCalendar(credetnials);
        }

        private void InitCalendar(DataServiceAccountCredentials credentials)
        {
            ServiceAccountCredential serviceCredentials;
            CalendarId = credentials.calendar_id;
            //var certificate = new X509Certificate2(System.AppDomain.CurrentDomain.BaseDirectory + @"\bin\key.p12", "notasecret", X509KeyStorageFlags.Exportable);

            serviceCredentials = new ServiceAccountCredential(
                new ServiceAccountCredential.Initializer(credentials.client_email)
                {
                    Scopes = Scopes,
                    User = credentials.client_user_email,
                }
                .FromPrivateKey(credentials.private_key)
            //.FromCertificate(certificate)
            );

            calendar = new CalendarService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = serviceCredentials,
                ApplicationName = GoogleApplicationName
            });
        }

        public Task<Event> SaveEventAsync(dynamic data, string eventId, bool insert = false)
        {
            return SaveEventAsync(data, eventId, CalendarId, insert);
        }

        public Task DeleteEventAsyn(string eventId)
        {
            return DeleteEventAsync(eventId, CalendarId);
        }
    }
}

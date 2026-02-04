using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using MagicFramework.Helpers;
using MagicFramework.Models;
using System.Data;
using System.Diagnostics;

namespace MagicFramework.Controllers
{

    public class StaticNotificationsController : ApiController
    {
        public readonly int numberOfNotificationsToRetrieveAtOnce = Int32.Parse(System.Configuration.ConfigurationManager.AppSettings["numberOfNotificationsToRetrieveAtOnce"]);

        [HttpGet]
        public string Get()
        {
            bool enableNotificationsByDefault = System.Configuration.ConfigurationManager.AppSettings["enableNotificationsByDefault"].Equals("true");
        
            UserConfigHandler UCH = new UserConfigHandler();

            var NH = new NotificationsHandler();
            List<Helpers.Notification> notificFromDb = NH.GetNotifications(numberOfNotificationsToRetrieveAtOnce);
            //retrieve static notifications
            JObject ndata = new JObject();
            ndata["notifications"] = new JRaw(JsonConvert.SerializeObject(notificFromDb));
            ndata["unreadNotificationsCount"] = NH.GetUnreadNotificationsCount();

            //retrieve scheduler event notifications
            MagicFramework.Data.MagicDBDataContext _context = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            DateTime time = DateTime.Now;
            var events = _context.Magic_Calendar_Notifications
                .Where(_ =>
                    _.user_id.Equals(SessionHandler.IdUser) &&
                    _.notify_via.Equals("popup") &&
                    _.notify_at >= time.AddHours(-12) &&
                    _.notify_at <= time.AddHours(12) &&
                    _.notified == false)
                .OrderBy(_ => _.notify_at)
                .Select(_ =>
                    new
                    {
                        id = _.id,
                        notify_at = _.notify_at,
                        event_start = _.Magic_Calendar.start,
                        title = _.Magic_Calendar.title
                    })
                .ToList();
            ndata["events"] = new JRaw(JsonConvert.SerializeObject(events));

            var settings = UCH.GetUserSettings();
            string enableNotifications;
            if (settings != null && settings.TryGetValue("enableNotifications", out enableNotifications))
                ndata["enableNotifications"] = enableNotifications.Equals("true");
            else
                ndata["enableNotifications"] = enableNotificationsByDefault;

          
            return ndata.ToString();
        }

        [HttpGet]
        public string GetByOffset(int offset)
        {
            var NH = new NotificationsHandler();
            List<Helpers.Notification> notificFromDb = NH.GetNotifications(numberOfNotificationsToRetrieveAtOnce, offset);
            return JsonConvert.SerializeObject(notificFromDb);
        }

        [HttpPost]
        public string Post(MagicFramework.Models.Notification notification)
        {
            var NH = new NotificationsHandler();

            var username = System.Web.HttpContext.Current.User.Identity.Name;
            return JsonConvert.SerializeObject(NH.SaveNotification(username, notification.Type, notification.Message));
        }
        /// <summary>
        /// Marks notification as read
        /// </summary>
        /// <param name="notification"></param>
        [HttpPost]
        public HttpResponseMessage Read(MagicFramework.Models.Notification notification)
        {
            var response = new HttpResponseMessage();
            try
            {

                string id = notification.Message;
                if (id == null)
                {
                    response.StatusCode = HttpStatusCode.OK;
                    response.Content = new StringContent("Id not specified, nothing happened!");
                    return response;
                }
                var username = System.Web.HttpContext.Current.User.Identity.Name;
                if (notification.Type.Equals("event"))
                {
                    MagicFramework.Data.MagicDBDataContext _context = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                    var eventNotification = _context.Magic_Calendar_Notifications.Where(_ => _.id.Equals(id) && _.user_id.Equals(SessionHandler.IdUser)).FirstOrDefault();
                    if (eventNotification != null)
                    {
                        eventNotification.notified = true;
                        _context.SubmitChanges();
                    }
                }
                else //that's a notification
                {
                    var dbutils = new DatabaseCommandUtils();
                    string sqlnotificationsquery = "UPDATE nq set nq.readByUser = 1  from  dbo.Magic_NotificationQueue nq  inner join dbo.Magic_NotificationTypes t on t.ID = nq.notificationType_ID where t.Code = 'UI'";
                    //databaseId is evaluated only when the notification is stored in the queue
                    if (id.Equals("all"))
                        //mark all the notifications as read
                        dbutils.GetDataSet(sqlnotificationsquery + " AND nq.user_id=" + SessionHandler.IdUser.ToString(), DBConnectionManager.GetTargetConnection());
                    else //update the notifications queue by id
                        dbutils.GetDataSet(sqlnotificationsquery + " AND  nq.id=" + notification.DatabaseId, DBConnectionManager.GetTargetConnection());
                }
                response.StatusCode = HttpStatusCode.OK;
                response.Content = new StringContent("{ \"message\":\"Notifications successfully updated\"}");
            }
            catch (Exception ex) {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(ex.Message);
            }
            return response;
        }

        [HttpPost]
        public void Delete(string id)
        {
            var NH = new NotificationsHandler();
            NH.DeleteNotification(id);
        }

        [HttpPost]
        public void SaveSettings([FromBody] string id)
        {
            var username = System.Web.HttpContext.Current.User.Identity.Name;
            Dictionary<string, string> settings = new Dictionary<string, string>();
            settings.Add("enableNotifications", id);
            UserConfigHandler UCH = new UserConfigHandler();
            UCH.SaveUserSettings(username, settings);
        }

      
    }
}
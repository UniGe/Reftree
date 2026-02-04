using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using AttributeRouting.Web.Http;
using System.Linq.Dynamic;
using System.Configuration;
using System.Net.Mail;
using System.Xml;
using System.Diagnostics;
using MagicFramework.Helpers;
using MagicFramework.MemberShip;
using System.Dynamic;
using System.Data;

namespace MagicFramework.Controllers 
{


    public class SchedulerController : ApiController
    {
        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
        private System.IO.DirectoryInfo directory = new System.IO.DirectoryInfo(ApplicationSettingsManager.GetDirectoryForLog());
     
        [HttpPost]
        public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
        {
            MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);

            string order = "start";
            String sqlwherecondition = "1=1";
            if (request.filter != null)
            {
                //crea una where condition che posso applicare in una stored procedure TSQL
                sqlwherecondition = "(" + rp.BuildWhereCondition(typeof(Models.Magic_Calendar), true) + ")";
                sqlwherecondition = sqlwherecondition.Replace("end", " [end] ");
                sqlwherecondition = sqlwherecondition.Replace("description", " c.[description] ");
                sqlwherecondition = sqlwherecondition.Replace("==", "=");
            }
            //manage data visibility for the userID in the session           
            var userid = MagicFramework.Helpers.SessionHandler.IdUser;

            // Un utente vede gli eventi del proprio group e dei suoi figli
            sqlwherecondition = "(" + sqlwherecondition + ")";

            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderCondition();

            return new MagicFramework.Models.Response(GetCurrentUsersEvents(sqlwherecondition, order).ToArray(), 0);
        }

        public static List<Models.Magic_Calendar> GetCurrentUsersEvents(string sqlwherecondition = "1=1", string order = "start")
        {
            var listofgroups = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet();

            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
           
            var xml =  Models.Magic_Calendar.createSelectionPayload(listofgroups, sqlwherecondition, order);

            MagicFramework.Helpers.DatabaseCommandUtils.readresult dbres = dbhandler.callStoredProcedurewithXMLInput(xml, "dbo.Magic_AppendBOEventsToCalendar");
            List<Models.Magic_Calendar> retobjlist = new List<Models.Magic_Calendar>();
            DataRowCollection dbappendedevent = dbres.table.Rows;

            //List<int> eventids = new List<int>();

            foreach (DataRow u in dbappendedevent)
            {

                int taskid = int.Parse(u[0].ToString());
                //eventids.Add(taskid);

                string title = u["title"].ToString();
                DateTime start = Convert.ToDateTime(u["start"].ToString());
                DateTime end = Convert.ToDateTime(u["end"].ToString());
                string startTimezone = u["startTimezone"].ToString();
                string endTimezone = u["endTimezone"].ToString();
                string description = u["description"].ToString();
                int? recurrenceId = u["recurrenceId"].ToString() == "" ? (int?)null : int.Parse(u["recurrenceId"].ToString());
                string recurrenceRule = u["recurrenceRule"].ToString();
                string recurrenceException = u["recurrenceException"].ToString();
                int? ownerId = u["ownerId"].ToString() == "" ? (int?)null : int.Parse(u["ownerId"].ToString());
                bool isAllDay = Boolean.Parse(u["isAllDay"].ToString());
                int taskType_ID = int.Parse(u["taskType_ID"].ToString());
                int creatorId = int.Parse(u["creatorId"].ToString());
                string OwnerName = u["OwnerName"].ToString();
                int? BusinessObject_ID = u["BusinessObject_ID"].ToString() == "" ? (int?)null : int.Parse(u["BusinessObject_ID"].ToString());
                string BusinessObjectType = u["BusinessObjectType"].ToString();
                int? LinkedModelActivity_ID = u["LinkedModelActivity_ID"].ToString() == "" ? (int?)null : int.Parse(u["LinkedModelActivity_ID"].ToString());
                bool taskActivityCompleted = Boolean.Parse(u["taskActivityCompleted"].ToString() == "" ? "false" : u["taskActivityCompleted"].ToString());
                int? LinkedModelWorkflow_ID = u["LinkedModelWorkflow_ID"].ToString() == "" ? (int?)null : int.Parse(u["LinkedModelWorkflow_ID"].ToString());
                int? LinkedActualWorkflow_ID = u["LinkedActualWorkflow_ID"].ToString() == "" ? (int?)null : int.Parse(u["LinkedActualWorkflow_ID"].ToString());
                string BusinessObjectDescription = u["BusinessObjectDescription"].ToString();
                int? TaskStatusId = u["TaskStatusId"].ToString() == "" ? (int?)null : int.Parse(u["TaskStatusId"].ToString());
                string Notes = u["Notes"].ToString();
                bool Editable = Boolean.Parse(u["Editable"].ToString() == "" ? "false" : u["Editable"].ToString());
                int? LinkedSourceObject_ID = u["LinkedSourceObject_ID"].ToString() == "" ? (int?)null : int.Parse(u["LinkedSourceObject_ID"].ToString());
                string LinkedSourceObjectEntity_ID = u["LinkedSourceObjectEntity_ID"].ToString();
                int? Function_ID = u["Function_ID"].ToString() == "" ? (int?)null : int.Parse(u["Function_ID"].ToString());
                int? location_ID = u["location_ID"].ToString() == "" ? (int?)null : int.Parse(u["location_ID"].ToString());
                string LocationDescription = u["LocationDescription"].ToString();
                string LocationColor = u["LocationColor"].ToString();
                string LocationCode = u["LocationCode"].ToString();
                string att = u["Attendees"].ToString();
                bool alert = bool.Parse(u["Alert"].ToString());
                bool alertsent = bool.Parse(u["AlertSent"].ToString());
                DateTime? alertsentlastdate = u["AlertLastDate"].ToString() == "" ? (DateTime?)null : DateTime.Parse(u["AlertLastDate"].ToString());
                bool has_notifications = bool.Parse(u["has_notifications"].ToString());
                string address =  u.Table.Columns.Contains("address") ? u["address"].ToString() : null;
                string GoogleEventId = u["GoogleEventId"].ToString();

                decimal temp;
                decimal? longitude = u.Table.Columns.Contains("longitude") && decimal.TryParse(u["longitude"].ToString(), out temp) ? temp : (decimal?)null;
                decimal? latitude = u.Table.Columns.Contains("latitude") && decimal.TryParse(u["latitude"].ToString(), out temp) ? temp : (decimal?)null;

                List<int?> attendees = new List<int?>();
                if (att.Length > 0)
                    foreach (var a in att.Split(','))
                        attendees.Add(int.Parse(a));

                retobjlist.Add(new Models.Magic_Calendar(taskid, title, start, end, startTimezone, endTimezone, description, recurrenceId, recurrenceRule,
                    recurrenceException, ownerId, isAllDay, null, taskType_ID, creatorId,
                    OwnerName, BusinessObject_ID, BusinessObjectType, LinkedModelActivity_ID, taskActivityCompleted, LinkedModelWorkflow_ID, LinkedActualWorkflow_ID,
                    BusinessObjectDescription, TaskStatusId, Notes, Editable, attendees, LinkedSourceObject_ID, LinkedSourceObjectEntity_ID, Function_ID,
                    location_ID, LocationDescription, LocationColor, LocationCode, alert, alertsent, alertsentlastdate, has_notifications, address, longitude, latitude, GoogleEventId));
            }

            return retobjlist;
        }

        //aggiornamenti attivita' legate a task di calendario
        public void updateLinkedSourceObject(int taskId, DateTime? start, DateTime? end,string  LinkedSourceObjectEntity_ID, int? LinkedSourceObject_ID, bool eventiscomplete)
        {
            if (LinkedSourceObjectEntity_ID != null)
            {
                var handler = new MagicFramework.Helpers.DatabaseCommandUtils();
                dynamic input = new System.Dynamic.ExpandoObject();
                input.taskid = taskId;
                input.start = start;
                input.end = end;
                input.linkedsourceentityid = LinkedSourceObjectEntity_ID;
                input.linkedsourceobjectid = LinkedSourceObject_ID;
                input.eventiscomplete = eventiscomplete;
                XmlDocument xml = MagicFramework.Helpers.JsonUtils.Json2Xml(Newtonsoft.Json.JsonConvert.SerializeObject(input));
                handler.callStoredProcedurewithXMLInput(xml, "dbo.Magic_UpdateCalendarSourceObject");
            }
            return;
        }

        [HttpPost]
        public HttpResponseMessage PostU(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
              
                if (!(SystemRightsChecker.isSchedulerUser() || data.ownerId == SessionHandler.IdUser))
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    string dbmessage =  Utils.getUIMessage("CALRIG");
                    string errormessage = dbmessage == null ? "operazione non consentita" : dbmessage;
                    response.Content = new StringContent(errormessage);
                    return response;
                }
                Models.Magic_Calendar cal = new Models.Magic_Calendar();
                cal.updateCalendar(data, id, dbutils);
                response = Utils.retOkMessage();
            }
            catch (Exception ex)
            {
                response = Utils.retInternalServerError(ex.Message);  
            }

            return response;
            
        }


        //The grid will call this method in insert mode

        [HttpPost]
        public HttpResponseMessage PostI(dynamic data)
        {
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            Models.Magic_Calendar cal = new Models.Magic_Calendar();

            //google calendar synch
            try
            {
               string taskId =  cal.insertCalendar(data, dbutils);
                // return the HTTP Response.
                return Utils.retOkMessage(taskId);

            }
            catch (Exception ex)
            {
                return Utils.retInternalServerError(ex.Message);
            }
        }

        [HttpPost]
        public HttpResponseMessage PostD(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            try
            {
                    if (!(SystemRightsChecker.isSchedulerUser() || data.ownerId == SessionHandler.IdUser))
                    {
                        response.StatusCode = HttpStatusCode.InternalServerError;
                        string dbmessage = Utils.getUIMessage("CALRIG");
                        string errormessage = dbmessage == null ? "operazione non consentita" : dbmessage;
                        response.Content = new StringContent(errormessage);
                        return response;
                    }

                    Models.Magic_Calendar cal = new Models.Magic_Calendar();
                    cal.deleteCalendar(id, data, dbutils);

                //         SendMails(entitytodestroy, "ANNULLATO::",entitytodestroy.BusinessObjectDescription);
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(ex.Message);
                return response;
            }

            // return the HTTP Response.
            response = Utils.retOkMessage();
            return response;
        }

        [HttpGet]
        public HttpResponseMessage TriggerTaskStatus(int id)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                // select the item from the database where the id

                var task = (from e in _context.Magic_Calendar
                                       where e.taskId == id
                                       select e).FirstOrDefault();

                if (task != null)
                {
                    bool eventiscomplete = false;
                    var status = (from e in _context.Magic_Calendar_TaskStatus where e.Code == "End" select e).FirstOrDefault();
                    var inprog = (from e in _context.Magic_Calendar_TaskStatus where e.Code == "InProg" select e).FirstOrDefault();
                    //Se l' evento in modifica e' in corso lo metto come completato (End) altrimenti lo rimetto inprogress
                    if (task.TaskStatusId != status.taskStatusID)
                    {
                        task.TaskStatusId = status.taskStatusID;
                        eventiscomplete = true;
                    }
                    else
                        task.TaskStatusId = inprog.taskStatusID;

                    _context.SubmitChanges();

                    updateLinkedSourceObject(task.taskId, task.start, task.end, task.LinkedSourceObjectEntity_ID, task.LinkedSourceObject_ID, eventiscomplete);

                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(string.Format("The item with id {0} in Magic_Calendar was not found in the database", id.ToString()));
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("Magic_Calendar:The database update failed with message -{0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }

        [HttpPost]
        public HttpResponseMessage updateTaskAssignToUser(dynamic data)
        {
            int task = data.taskid;
            int user = data.userid;

            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                var evt = (from e in _context.Magic_Calendar where e.taskId == task select e).ToList().FirstOrDefault();
                evt.ownerId = user;
                _context.SubmitChanges();
                response.StatusCode = HttpStatusCode.OK;

            }
            catch (Exception ex) {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(ex.Message);
            }
            
            return response;
        }

        [HttpGet]
        public HttpResponseMessage GetNotifications(int id)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            var notifications = _context.Magic_Calendar_Notifications.Where(_ => _.calendar_task_id.Equals(id) && _.user_id.Equals(SessionHandler.IdUser)).Select(_ =>
            new
            {
                id = _.id,
                unit = _.unit,
                value = _.value,
                notify_via = _.notify_via
            }).ToList();
            response.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(notifications));
            return response;
        }

        private void SendNotificationMails(int taskId, List<string> mailAddresses)
        {
            var calendarEvent = _context.Magic_Calendar.Where(_ => _.taskId == taskId).FirstOrDefault();
            if (calendarEvent == null)
                return;
            var credentials = Mailer.GetDefaultSmtpCredentials(Request.RequestUri.Authority, SessionHandler.ApplicationInstanceId);
            foreach (var mailAddress in mailAddresses)
            {
                try
                {
                    var mailMessage = Mailer.FormatCalendarNotificationMail(calendarEvent, credentials, mailAddress, "Event has been moved");
                    Mailer.SendMail(credentials, mailMessage);
                }
                catch (Exception e)
                {
                }
            }
        }

        [HttpGet]
        public HttpResponseMessage GetGoogleEvents(DateTime from, DateTime to)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            GoogleCalendarsSyncher g = new GoogleCalendarsSyncher();
            try
            {
                if (g.PullUsersEvents(from, to))
                    res.StatusCode = HttpStatusCode.OK;
                else
                {
                    res.StatusCode = HttpStatusCode.NotFound;
                    res.Content = new StringContent("User has no configured google calendar!");
                }
            }
            catch (Exception e)
            {
                res.StatusCode = HttpStatusCode.InternalServerError;
                res.Content = new StringContent(e.ToString());
            }
            return res;
        }

    }
}
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
using System.Xml;
using System.Diagnostics;
using MagicFramework.Helpers;
using MagicFramework.MemberShip;
using System.Dynamic;
using System.Data;
using Newtonsoft.Json.Linq;

namespace MagicFramework.Models
{
    
    
    public partial class Magic_Calendar
    {
        public Magic_Calendar()
        { 
        
        }
        public void deleteCalendar(int id,dynamic data, DatabaseCommandUtils dbutils)
        { 
            try
            {
                //check if the event has a relation with a source object (es. PROAKT). If yes then launch the alignment query which is stored in the database 
                if (data.LinkedSourceObject_ID != null)
                {

                    int soid = int.Parse(data.LinkedSourceObject_ID.ToString());
                    DataRow so = dbutils.GetDataSet("SELECT DeleteQuery from dbo.Magic_CalendarSourceObjects where SourceObject_ID =" + soid.ToString(), null).Tables[0].Rows[0];
                    string commandtext = so[0].ToString();
                    object[] args2 = new object[] { id };
                    dbutils.buildAndExecDirectCommandNonQuery(commandtext, args2);
                }
                List<int> teammembersattendees = new List<int>();
                if (data.teammembersattendees != null)
                foreach (var aid in data.teammembersattendees)
                    teammembersattendees.Add(int.Parse(aid.ToString()));

                data.teammembersattendees = Newtonsoft.Json.JsonConvert.SerializeObject(data.teammembersattendees);
                XmlDocument xml = JsonUtils.DynamicToXmlInput_ins_upd_del(data, "destroy", "dbo.Magic_Calendar", id.ToString());
                MagicFramework.Helpers.DatabaseCommandUtils.updateresult updres = dbutils.callStoredProcedurewithXMLInputwithOutputPars(xml, "dbo.Magic_Calendar_upd_ins_del");

                // MagicFramework.Helpers.DatabaseCommandUtils.updateresult ret = dbutils.execUpdateInsertDirect("dbo.Magic_Calendar", "UPDATE", data, id.ToString());
                if (updres.errorId != "0")
                    throw new ArgumentException(Newtonsoft.Json.JsonConvert.SerializeObject(updres));
           

                try
                {
                    var instanceConfig = MFConfiguration.GetApplicationInstanceConfiguration();
                    if (!string.IsNullOrEmpty(instanceConfig.GoogleCalendarConfig))
                    {
                        GoogleCalendarSyncher gcal = new GoogleCalendarSyncher();
                        try
                        {
                            var result = gcal.DeleteEventAsyn((string)data.GoogleEventId);
                        }
                        catch (Exception e)
                        {
                            MFLog.LogInFile("MagicFramework.Controllers.SchedulerController@PostU Error: " + e.Message, MFLog.logtypes.ERROR);
                        }
                    }
                    if (!string.IsNullOrEmpty(instanceConfig.GoogleCalenderOAuthConfig))
                    {
                        GoogleCalendarsSyncher gcals = new GoogleCalendarsSyncher();
                        gcals.DeleteEventAsync((string)data.GoogleEventId, (int)data.ownerId);
                    }
                }
                catch { }

            }
            catch (Exception ex) {
                throw new ArgumentException(ex.Message);
            }
        }
      
        /// <summary>
        /// aggiorna un evento di calendario
        /// </summary>
        /// <param name="data"></param>
        /// <param name="id"></param>
        /// <param name="dbutils"></param>
        public List<string> updateCalendar(dynamic data, int id,DatabaseCommandUtils dbutils)
        {
            List<string> mailingList = new List<string>();
            try
            {
                List<int> teammembersattendees = new List<int>();
                if (data.teammembersattendees != null)
                foreach (var aid in data.teammembersattendees)
                    teammembersattendees.Add(int.Parse(aid.ToString()));

                if (data.Editable != false)
                    data.Editable = true;

                var instanceConfig = MFConfiguration.GetApplicationInstanceConfiguration();
                if (!string.IsNullOrEmpty(instanceConfig.GoogleCalenderOAuthConfig))
                {
                    try
                    {
                        Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                        var eventToBeUpdated = context.Magic_Calendar.Where(e => e.taskId == id).FirstOrDefault();
                        if (eventToBeUpdated != null)
                        {
                            GoogleCalendarsSyncher gcals = new GoogleCalendarsSyncher();
                            if (eventToBeUpdated.ownerId != null && (int)eventToBeUpdated.ownerId != (int)data.ownerId)
                            {
                                gcals.DeleteEventAsync((string)data.GoogleEventId, (int)eventToBeUpdated.ownerId);
                                data.GoogleEventId = GoogleCalendar.GetNewId();
                                gcals.SyncEventAsync(data, (string)data.GoogleEventId, teammembersattendees, true);
                            }
                            else
                            {
                                gcals.SyncEventAsync(data, (string)data.GoogleEventId, teammembersattendees);
                            }
                        }
                    }
                    catch (Exception e)
                    {
                        MFLog.LogInFile("MagicFramework.Models.Magic_Calendar@updateCalendar1: Message: " + e.Message, MFLog.logtypes.ERROR);
                    }
                }

                data.teammembersattendees = Newtonsoft.Json.JsonConvert.SerializeObject(data.teammembersattendees);
                XmlDocument xml = JsonUtils.DynamicToXmlInput_ins_upd_del(data, "update", "dbo.Magic_Calendar", id.ToString());
                MagicFramework.Helpers.DatabaseCommandUtils.updateresult updres = dbutils.callStoredProcedurewithXMLInputwithOutputPars(xml, "dbo.Magic_Calendar_upd_ins_del");
             
               // MagicFramework.Helpers.DatabaseCommandUtils.updateresult ret = dbutils.execUpdateInsertDirect("dbo.Magic_Calendar", "UPDATE", data, id.ToString());
                if (updres.errorId != "0")
                        throw new ArgumentException(Newtonsoft.Json.JsonConvert.SerializeObject(updres));

                //google calendar synch
                try
                {
                    if (!string.IsNullOrEmpty(instanceConfig.GoogleCalendarConfig))
                    {
                        GoogleCalendarSyncher gcal = new GoogleCalendarSyncher();
                        try
                        {
                            gcal.SaveEventAsync(data, (string)data.GoogleEventId);
                        }
                        catch (Exception e)
                        {
                            MFLog.LogInFile("MagicFramework.Controllers.SchedulerController@PostU Error: " + e.Message, MFLog.logtypes.ERROR);
                        }
                    }
                }
                catch (Exception e){
                    MFLog.LogInFile("MagicFramework.Models.Magic_Calendar@updateCalendar2: Message: " + e.Message, MFLog.logtypes.ERROR);
                }

                if (data.ownerId != null)
                    teammembersattendees.Add((int)data.ownerId);
                if (data.creatorId != null)
                    teammembersattendees.Add((int)data.creatorId);

                mailingList = AddNotifications(data, teammembersattendees);

                //check if the event has a relation with a source object (es. PROAKT). If yes then launch the alignment query which is stored in the database 
                if (data.LinkedSourceObject_ID != null)
                {
                    string soid = data.LinkedSourceObject_ID.ToString();

                    DataRow so = dbutils.GetDataSet("SELECT UpdateQuery from dbo.Magic_CalendarSourceObjects where SourceObject_ID =" + soid, null).Tables[0].Rows[0];
                    string commandtext = so[0].ToString();
                    object[] args2 = new object[] { id };
                    dbutils.buildAndExecDirectCommandNonQuery(commandtext, args2);
                }
            }
            catch (Exception ex) {
                throw new ArgumentException(ex.Message);
            }
            return mailingList;
        }
        /// <summary>
        /// aggiunge un evento 
        /// </summary>
        /// <param name="data"></param>
        /// <param name="dbutils"></param>
        /// <returns>i dati dell' evento inserito</returns>
        public string insertCalendar(dynamic data,  DatabaseCommandUtils dbutils)
        {
            try
            {
                List<int> teammembersattendees = new List<int>();
                if (data.teammembersattendees != null)
                foreach (var aid in data.teammembersattendees)
                    teammembersattendees.Add(int.Parse(aid.ToString()));

                data.Editable = true;
                data.creatorId = SessionHandler.IdUser;

                data.GoogleEventId = GoogleCalendar.GetNewId();

                data.teammembersattendees = Newtonsoft.Json.JsonConvert.SerializeObject(data.teammembersattendees);
                XmlDocument xml = JsonUtils.DynamicToXmlInput_ins_upd_del(data, "create", "dbo.Magic_Calendar");
                MagicFramework.Helpers.DatabaseCommandUtils.updateresult updres = dbutils.callStoredProcedurewithXMLInputwithOutputPars(xml, "dbo.Magic_Calendar_upd_ins_del");

                if (updres.errorId != "0")
                    throw new ArgumentException(Newtonsoft.Json.JsonConvert.SerializeObject(updres));

                data.taskId = Int32.Parse(updres.pkValue);
                AddNotifications(data);
     
                //google calendar synch
                try
                {
                    var instanceConfig = MFConfiguration.GetApplicationInstanceConfiguration();
                    if (!string.IsNullOrEmpty(instanceConfig.GoogleCalendarConfig))
                    {
                        GoogleCalendarSyncher gcal = new GoogleCalendarSyncher();
                        try
                        {
                            gcal.SaveEventAsync(data, (string)data.GoogleEventId, true);
                        }
                        catch (Exception e)
                        {
                            MFLog.LogInFile("MagicFramework.Controllers.SchedulerController@PostU Error: " + e.Message, MFLog.logtypes.ERROR);
                        }
                    }
                    if (!string.IsNullOrEmpty(instanceConfig.GoogleCalenderOAuthConfig))
                    {
                        try
                        {
                            if (data.ownerId == null)
                                data.ownerId = data.creatorId;

                            GoogleCalendarsSyncher gcals = new GoogleCalendarsSyncher();
                            gcals.SyncEventAsync(data, (string)data.GoogleEventId, teammembersattendees, true);
                        }
                        catch(Exception e)
                        {
                            MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                        }
                    }
                }
                catch { }
                return updres.pkValue;
            }
            catch (Exception ex)
            {
                throw new ArgumentException(ex.Message);
            }

            
        }

        public List<string> AddNotifications(dynamic data, List<int> attendeesIds = null)
        {
            List<string> mailingList = new List<string>();
            try
            {
                Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                string toDelete = data.notifications_to_delete;
                if (!String.IsNullOrEmpty(toDelete))
                {
                    foreach (string id in toDelete.Split(',')) {
                        int parsedId;
                        if (Int32.TryParse(id, out parsedId))
                        {
                            var noti = _context.Magic_Calendar_Notifications.Where(_ => _.user_id.Equals(SessionHandler.IdUser) && _.id.Equals(parsedId)).FirstOrDefault();
                            if(noti != null)
                                _context.Magic_Calendar_Notifications.DeleteOnSubmit(noti);

                        }
                    }
                }
                DateTime start = data.start;
                DateTime oldStart = data.old_start;
                DateTime end = data.end;
                DateTime oldEnd = data.old_end;
                int taskId = data.taskId;
                if (start != oldStart || end != oldEnd)
                {
                    var notificationsToRecalc = _context.Magic_Calendar_Notifications.Where(_ => _.calendar_task_id.Equals(taskId));
                    RecalcNotifications(start, notificationsToRecalc);
                    if (data.inform == true)
                    {
                        var mailInfo = notificationsToRecalc.Where(_ => !_.Magic_Mmb_Users.Email.Equals(null)).Select(_ => new { mail = _.Magic_Mmb_Users.Email, id = _.user_id }).Distinct().ToList();
                        attendeesIds.RemoveAll(id => mailInfo.Select(_ => _.id).Contains(id));
                        if (attendeesIds.Count > 0)
                        {
                            mailInfo.AddRange(_context.Magic_Mmb_Users.Where(_ => attendeesIds.Contains(_.UserID) && !_.Email.Equals(null)).Select(_ => new { mail = _.Email, id = _.UserID }).ToList());
                        }
                        if (mailInfo.Count > 0)
                        {
                            mailingList = mailInfo.Select(_ => _.mail).ToList();
                        }
                    }

                }
                foreach (var notification in data.notifications)
                {
                    var noti = new Data.Magic_Calendar_Notifications();
                    noti.calendar_task_id = taskId;
                    noti.unit = notification.unit;
                    noti.value = notification.value;
                    noti.user_id = SessionHandler.IdUser;
                    noti.notified = false;
                    noti.notify_via = notification.notify_via;
                    string unit = notification.unit;
                    string stringValue = notification.value;
                    int value = int.Parse(stringValue);
                    noti.notify_at = NotifyAt(start, unit, value);
                    _context.Magic_Calendar_Notifications.InsertOnSubmit(noti);
                }
                _context.SubmitChanges();
            }
            catch
            {
            }
            return mailingList;
        }

        public static IQueryable<Data.Magic_Calendar_Notifications> RecalcNotifications(DateTime eventStart, IQueryable<Data.Magic_Calendar_Notifications> notificationsToRecalc)
        {
            DateTime now = DateTime.Now;
            foreach(var noti in notificationsToRecalc)
            {
                noti.notify_at = NotifyAt(eventStart, noti.unit, noti.value);
                if (noti.notify_at >= now)
                {
                    noti.notified = false;
                    noti.send_attempts = Jobs.MailJob.MAX_SEND_ATTEMPTS - 1;
                }
            }
            return notificationsToRecalc;
        }
        public static XmlDocument createSelectionPayload(string listofgroups, string sqlwherecondition, string order)
        {

            JObject inputpar = JObject.FromObject(new
            {
                userid = MagicFramework.Helpers.SessionHandler.IdUser,
                listofgroups = listofgroups,
                wherecondition = sqlwherecondition,
                order = order
            });
            try
            {
                var nvc = HttpContext.Current.Request.UrlReferrer.ParseQueryString();
                var allkeys = nvc.AllKeys;
                foreach (var k in allkeys)
                    inputpar.Add(k, JToken.Parse(@"'" + HttpContext.Current.Server.HtmlDecode(nvc.Get(k)) + "'"));
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
            var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(Newtonsoft.Json.JsonConvert.SerializeObject(inputpar));
            return xml;
        }
        public static DateTime NotifyAt(DateTime eventStart, string unit, int value)
        {
            switch (unit)
            {
                case "m":
                    return eventStart.AddMinutes(value * -1);
                case "h":
                    return eventStart.AddHours(value * -1);
                case "d":
                    return eventStart.AddDays(value * -1);
                case "w":
                    return eventStart.AddDays(value * -1 * 7);
            }
            return eventStart;
        }

        public Magic_Calendar(int taskid,string title, DateTime start, DateTime? end, string starttimezone, string endtimezone, string description, int? recurrenceid, string recurrencerule, string recurrenceexception, int? ownerid, bool? isallday,
            string tasktypedescription, int? tasktypeid, int? creatorid, string ownername, int? bunitobjectid, string bunitobjecttype, int? workflowactivityid, bool? taskactivitycompleted, int? linkedmodelworkflow, int? linkedactualworkflow, string businessobjectdescription,
            int? TaskStatusId, string notes, bool editable, List<int?> attendeees, int? bosourceid, string bosourceentityid, int? functionid, int? location_ID, string LocationDescription, string LocationColor, string LocationCode, bool alert, bool? alertsent, DateTime? alertlastdate, bool has_notifications, string address = "", decimal? longitude = null, decimal? latitude = null, string GoogleEventId = "")

        {
            this.taskId = taskid;
            this.title = title;
            this.start = start;
            this.end = end;
            this.startTimezone = starttimezone;
            this.endTimezone = endtimezone;
            this.description = description;
            this.recurrenceId = recurrenceid;
            this.recurrenceRule = recurrencerule;
            this.recurrenceException = recurrenceexception;
            this.ownerId = ownerid;
            this.isAllDay = isallday;
            this.taskTypeDescription =tasktypedescription;
            this.taskType_ID = tasktypeid;
            this.creatorId = creatorid;
            this.ownerName = ownername;
            this.LinkedModelActivity_ID = workflowactivityid;
            this.teammembersattendees = attendeees;
            this.LinkedModelWorkflow_ID = linkedmodelworkflow;
            this.LinkedActualWorkflow_ID = linkedactualworkflow;
            this.taskActivityCompleted = taskactivitycompleted;
            // Questo e' l' oggetto di business associato all' evento es. un cliente (Type = 'CUSTOMER')
            this.BusinessObject_ID = bunitobjectid;
            this.BusinessObjectType = bunitobjecttype;
            this.BusinessObjectDescription = businessobjectdescription;
            this.TaskStatusId = TaskStatusId;
            this.Notes = notes;
            this.Editable = editable;
            this.Function_ID = functionid;
            this.LinkedSourceObject_ID = bosourceid;
            this.LinkedSourceObjectEntity_ID = bosourceentityid;
            this.location_ID = location_ID;
            this.LocationDescription = LocationDescription;
            this.LocationColor = LocationColor;
            this.LocationCode = LocationCode;
            this.currentUserID = MagicFramework.Helpers.SessionHandler.IdUser;
            this.Alert = alert;
            this.AlertSent = alertsent;
            this.AlertLastDate = alertlastdate;
            this.has_notifications = has_notifications;
            this.address = address;
            this.longitude = longitude;
            this.latitude = latitude;
            this.GoogleEventId = GoogleEventId;
        }

        public Magic_Calendar(int taskid, string title, DateTime start, DateTime? end, string starttimezone, string endtimezone, string description, int? recurrenceid, string recurrencerule, string recurrenceexception, int? ownerid, bool? isallday,
    string tasktypedescription, int? tasktypeid, int? creatorid, string ownername, int? bunitobjectid, string bunitobjecttype, int? workflowactivityid, bool? taskactivitycompleted, int? linkedmodelworkflow, int? linkedactualworkflow, string businessobjectdescription,
    int? TaskStatusId, string notes, bool editable, List<int?> attendeees, int? bosourceid, string bosourceentityid, int? functionid, int? location_ID, string LocationDescription, string LocationColor, string LocationCode, bool alert, bool? alertsent, DateTime? alertlastdate,int? ugvi,DateTime? workflowestimatedEnd,bool has_notifications)
        {
            this.taskId = taskid;
            this.title = title;
            this.start = start;
            this.end = end;
            this.startTimezone = starttimezone;
            this.endTimezone = endtimezone;
            this.description = description;
            this.recurrenceId = recurrenceid;
            this.recurrenceRule = recurrencerule;
            this.recurrenceException = recurrenceexception;
            this.ownerId = ownerid;
            this.isAllDay = isallday;
            this.taskTypeDescription = tasktypedescription;
            this.taskType_ID = tasktypeid;
            this.creatorId = creatorid;
            this.ownerName = ownername;
            this.LinkedModelActivity_ID = workflowactivityid;
            this.teammembersattendees = attendeees;
            this.LinkedModelWorkflow_ID = linkedmodelworkflow;
            this.LinkedActualWorkflow_ID = linkedactualworkflow;
            this.taskActivityCompleted = taskactivitycompleted;
            // Questo e' l' oggetto di business associato all' evento es. un cliente (Type = 'CUSTOMER')
            this.BusinessObject_ID = bunitobjectid;
            this.BusinessObjectType = bunitobjecttype;
            this.BusinessObjectDescription = businessobjectdescription;
            this.TaskStatusId = TaskStatusId;
            this.Notes = notes;
            this.Editable = editable;
            this.Function_ID = functionid;
            this.LinkedSourceObject_ID = bosourceid;
            this.LinkedSourceObjectEntity_ID = bosourceentityid;
            this.location_ID = location_ID;
            this.LocationDescription = LocationDescription;
            this.LocationColor = LocationColor;
            this.LocationCode = LocationCode;
            this.currentUserID = MagicFramework.Helpers.SessionHandler.IdUser;
            this.Alert = alert;
            this.AlertSent = alertsent;
            this.AlertLastDate = alertlastdate;
            this.UserGroupVisibility_ID = ugvi;
            this.WorkflowEstimatedEnd = workflowestimatedEnd;
            this.has_notifications = has_notifications;
        }

        public Magic_Calendar(Data.Magic_Calendar A)
        {
            this.taskId = A.taskId;
            this.title = A.title;
            this.start = A.start;
            this.end = A.end;
            this.startTimezone = A.startTimezone;
            this.endTimezone = A.endTimezone;
            this.description = A.description;
            this.recurrenceId = A.recurrenceId;
            this.recurrenceRule = A.recurrenceRule;
            this.recurrenceException = A.recurrenceException;
            this.ownerId = A.ownerId;
            this.isAllDay = A.isAllDay;
            if (A.Magic_Calendar_TaskTypes != null)
                this.taskTypeDescription = A.Magic_Calendar_TaskTypes.Description;
            this.LinkedModelActivity_ID = A.LinkedModelActivity_ID;
            this.taskType_ID = A.taskType_ID;
            this.creatorId = A.creatorId;
            if (A.Magic_Mmb_Users != null)
                this.ownerName = A.Magic_Mmb_Users.Username + "-mailTo:: " + A.Magic_Mmb_Users.Email;
            this.taskActivityCompleted = A.taskActivityCompleted;
            this.LinkedActualWorkflow_ID = A.LinkedActualWorkflow_ID;
            this.LinkedModelWorkflow_ID = A.LinkedModelWorkflow_ID;
           
            List<int?> eventattendees = (from e in A.Magic_Calendar_Relations where e.Calendar_ID == A.taskId && e.AttendeeUser_ID != null select e.AttendeeUser_ID).ToList();
            //L' owner e' sempre presente tra gli invitati
            eventattendees.Add(A.ownerId);

            this.teammembersattendees = eventattendees;
            // Questo e' l' oggetto di business associato all' evento es. un cliente (Type = 'CUSTOMER')
            this.BusinessObject_ID = A.BusinessObject_ID;
            this.BusinessObjectType = A.BusinessObjectType;
            this.BusinessObjectDescription = A.BusinessObjectDescription;
            this.TaskStatusId = A.TaskStatusId;
            this.Notes = A.Notes;
            this.Editable = true;
            this.LinkedSourceObject_ID = A.LinkedSourceObject_ID;
            this.LinkedSourceObjectEntity_ID = A.LinkedSourceObjectEntity_ID;
            this.location_ID = A.location_ID;
            this.currentUserID = MagicFramework.Helpers.SessionHandler.IdUser;
        }
    

        //Creator e' l' utente che ha creato un evento, owner e' colui a cui l' evento e' stato assegnato (possono essere la stessa persona). 
        //I teammemberattendees sono utenti partecipanti all' evento

        
        public int taskId { get; set; }
        public string title { get; set; }
        public System.DateTime start { get; set; }
        public Nullable<System.DateTime> end { get; set; }
        public string startTimezone { get; set; }
        public string endTimezone { get; set; }
        public string description { get; set; }
        public Nullable<int> recurrenceId { get; set; }
        public string recurrenceRule { get; set; }
        public string recurrenceException { get; set; }
        public Nullable<int> ownerId { get; set; }
        public Nullable<bool> isAllDay { get; set; }
        public string taskTypeDescription { get; set; }
        public Nullable<int> taskType_ID { get; set; }
        public Nullable<int> LinkedModelActivity_ID { get; set; }
        public string ownerName { get; set; }
        public Nullable<int> creatorId { get; set; }
        public Nullable<int> BusinessObject_ID {get;set;}
        public string BusinessObjectType {get;set;}
        // indica se l' attivita' si e' conclusa 
        public Nullable<bool> taskActivityCompleted { get; set; }
        //Questo e' l' ID di un processo "standard"  le cui attivita' sono generiche
        public Nullable<int> LinkedModelWorkflow_ID { get; set; }
        // ID di un processo misurabile e attivato 
        public Nullable<int> LinkedActualWorkflow_ID { get; set; }
        public List<int?> teammembersattendees { get; set; }
        public String BusinessObjectDescription { get; set; }
        public int? TaskStatusId { get; set; }
        public string Notes { get; set; }
        public bool Editable { get; set; }
        public int? Function_ID { get; set; }
        public int? LinkedSourceObject_ID { get; set; }
        public string LinkedSourceObjectEntity_ID { get; set; }
        public int? location_ID { get; set; }
        public string LocationColor { get; set; }
        public string LocationDescription { get; set; }
        public string LocationCode { get; set; }
        public int currentUserID { get; set; }
        public bool? Alert { get; set; }
        public bool? AlertSent { get; set; }
        public DateTime? AlertLastDate { get; set; }
        public DateTime? WorkflowEstimatedEnd { get; set; }
        public int? UserGroupVisibility_ID { get; set; }   //the portfolio associated to the event
        public bool? has_notifications { get; set; }
        public string address { get; set; }
        public decimal? longitude { get; set; }
        public decimal? latitude { get; set; }
        public string GoogleEventId { get; set; }
    }
}

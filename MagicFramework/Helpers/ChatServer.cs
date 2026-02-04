using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Data;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Data.SqlClient;
using MagicFramework.Helpers.Sql;


namespace MagicFramework.Helpers
{
    public class ChatServer {
        private MongoHandler MDB;

        public readonly static String[] STATUS = System.Configuration.ConfigurationManager.AppSettings["status"].Split(',');
        internal readonly int STATUS_MESSAGE_MAX_LENGTH = Int32.Parse(System.Configuration.ConfigurationManager.AppSettings["maxlenghtOfStatusMessage"]);
        private readonly string defaultStatusMessage = System.Configuration.ConfigurationManager.AppSettings["defaultStatusMessage"];
        private readonly string defaultStatus = System.Configuration.ConfigurationManager.AppSettings["defaultStatus"];
        private MFConfiguration.ApplicationInstanceConfiguration config;
        private string applicationName;

        public ChatServer(string applicationDomainUrl, string applicationName)
        {
            this.applicationName = applicationName;

            var globalConfig = new MFConfiguration(applicationDomainUrl);
            this.config = globalConfig.GetApplicationInstanceByInstanceName(applicationDomainUrl, applicationName);
            this.MDB = new MongoHandler(globalConfig.appSettings.MongoDBconn, applicationName, config.mongoDBName);

        }
        private SqlConnection openConnection(string connectionString)
        {
            //Crea l'oggetto connection
            SqlConnection sqlConn = new SqlConnection(connectionString);

            try
            {
                sqlConn.Open();
            }
            catch (Exception ex)
            {
                ex.ToString();
            }
            return sqlConn;
        }
        private void HandleCallback(IAsyncResult result)
        {
            // Retrieve the original command object, passed
            // to this procedure in the AsyncState property
            // of the IAsyncResult parameter.
            SqlCommand command = (SqlCommand)result.AsyncState;
            SqlConnection conn = command.Connection;
            try
            {
                int rowCount = command.EndExecuteNonQuery(result);
            }
            catch (Exception ex)
            {
                throw new Exception("Chat Server - Problems during async call of:" + command.CommandText + ". Exception says:" + ex.Message);
            }
            finally
            {
                if (conn != null)
                {
                    conn.Close();
                    conn.Dispose();
                }

            }
        }
        public void sendMailToUsers(string userName,List<string> users,string message)
        {
            if (users.Count == 0 || String.IsNullOrEmpty(message) || !this.config.chatOfflineMail)
                return;

            string connectionString = this.config.TargetDBconn;
            SqlConnection sqlConn = openConnection(connectionString);
            SqlCommand cmd = new SqlCommand();

            SqlParameter paramFrom = new SqlParameter("userFrom", SqlDbType.NVarChar);
            paramFrom.Value = userName;
            SqlParameter paramTo = new SqlParameter("usersTo", SqlDbType.NVarChar);
            paramTo.Value = String.Join(",", users);
            SqlParameter paramMessage = new SqlParameter("message", SqlDbType.NVarChar);
            paramMessage.Value = message;

            cmd.Parameters.Add(paramFrom);
            cmd.Parameters.Add(paramTo);
            cmd.Parameters.Add(paramMessage);

            cmd.CommandText = "dbo.Magic_Chat_Offline_Mail";
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Connection = sqlConn;
            try
            {
                AsyncCallback callback = new AsyncCallback(HandleCallback);
                cmd.BeginExecuteNonQuery(callback, cmd);

            }
            catch (ArgumentException exAE)
            {
                throw new Exception("Chat Server - Error launching async: " + cmd.CommandText + " " + exAE.Message);
            }
        }
        public User Login(string username)
        {
            var user = MDB.GetUser(username);
            var query = new DBQuery("SELECT * FROM dbo.Magic_Mmb_Users WHERE Username='" + username + "'");
            var result = query.Execute().Rows[0];

            if (user == null)
            {
                user = new User
                {
                    User_id = Int64.Parse(result.ItemArray[1].ToString()),
                    Username = result.ItemArray[4].ToString().ToLower(),
                    Name = result.ItemArray[5].ToString(),
                    Surname = result.ItemArray[6].ToString(),
                    Status_message = this.defaultStatusMessage,
                    Last_status = this.defaultStatus,
                    Img = result.ItemArray[25].ToString(),
                    First_login = DateTime.Now,
                };
            }
            else
            {
                user.User_id = Int64.Parse(result.ItemArray[1].ToString());
                user.Name = result.ItemArray[5].ToString();
                user.Surname = result.ItemArray[6].ToString();
                user.Img = result.ItemArray[25].ToString();
                user.Last_login = DateTime.Now;
            }

            user.Business_unit = GetBusinessUnitsForUser(user.User_id.ToString());
            MDB.SaveUser(user);
            return user;
        }

        public List<BusinessUnit> GetBusinessUnitsForUser(string userId)
        {
            List<BusinessUnit> bu = new List<BusinessUnit>();
            string procedure = this.config.chatVisibilityStoredProcedureName;
            if (!String.IsNullOrEmpty(procedure))
            {
                try {
                    JObject data = new JObject();
                    data["userId"] = userId;
                    System.Xml.XmlDocument xml = MagicFramework.Helpers.JsonUtils.Json2Xml(data.ToString());
                    var botaggeditems = new MagicFramework.Helpers.DatabaseCommandUtils().callStoredProcedurewithXMLInput(xml, procedure);
                    foreach (var r in botaggeditems.table.Rows)
                    {
                        var row = (System.Data.DataRow)r;
                        bu.Add(new BusinessUnit() { Buid = row[0].ToString(), Group_id = null, Description = row[1].ToString() });
                    }
                }
                catch (Exception e)
                {
                    MFLog.LogInFile("MagicFramework.Helpers.ChatServer@GetBusinessUnitsForUser: Error while retrieving Visibility Groups for User. Stored Procedure: " + procedure + "Exception: " + e.Message, MFLog.logtypes.ERROR);
                }
            }
            else
            {
                var business_unit = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserAllGroupsVisibiltyChildrenSet(userId).Split(',');
                foreach (var unit in business_unit.Distinct())
                {
                    bu.Add(new BusinessUnit() { Buid = unit, Group_id = null, Description = GetGroupDescription(unit) });
                }
            }
            return bu;
        }

        public User GetUser(string username)
        {
            return MDB.GetUser(username);
        }

        public void SaveStatus(string username, string status)
        {
            MDB.SaveLastStatusFromUser(username, status);
        }

        public string SaveStatusMessageFromUser(string username, string statusmessage) {
            if (statusmessage.Length > STATUS_MESSAGE_MAX_LENGTH)
                statusmessage = statusmessage.Substring(0, STATUS_MESSAGE_MAX_LENGTH);
            MDB.SaveStatusMessageFromUser(username, statusmessage);
            return statusmessage;
        }

        public string SaveMessage(string from, List<string> usernames, string message)
        {
            var m = JsonConvert.DeserializeObject<ReceivedMessage>(message);
            if (String.IsNullOrWhiteSpace(m.Text))
                return null;
            var M = MDB.SaveSimpleMessage(from, usernames, m);
            message = ParseMessage(M);
            return message;
        }

        public string SaveGroupMessage(string from, string groupname, string message)
        {
            var m = JsonConvert.DeserializeObject<ReceivedMessage>(message);
            if (String.IsNullOrWhiteSpace(m.Text))
                return null;
            var M = MDB.SaveGroupMessage(from, groupname, m);
            message = ParseMessage(M);
            return message;
        }

        public static string ParseMessage(Message M)
        {
            return JsonConvert.SerializeObject(M);
        }

        public static string ParseMessages(List<Message> M)
        {
            return JsonConvert.SerializeObject(M);
        }

        public string GetLastMessagesFor(List<string> usernames, string date)
        {
            try
            {
                DateTime d;
                if (date == "")
                    d = DateTime.MaxValue;
                else
                    d = DateTime.Parse(date);
                var messages = ParseMessages(MDB.GetLastMessagesFor(usernames, d));
                return messages;
            }
            catch {
                return "";
            }
        }

        public List<Message> UserReadMessages(String[] messageIds, string username, out List<string> readInfo)
        {
            readInfo = new List<string>();
            var messages = MDB.UpdateReadByForMessages(messageIds, username);
            foreach (var m in messages)
            {
                JObject i = new JObject();
                i["Id"] = m.Id.ToString();
                i["For"] = new JArray(m.For);
                readInfo.Add(i.ToString());
            }
            return messages;
        }

        public String GetUserDataJSON(User User, Hashtable userstatus, out string user_status, out string user_data)
        {
            user_status = User.Last_status;
            var Users = MDB.GetUsersByBusinessUnitsFromUser(User);
            List <string> businessunits = new List<string>();
            JObject groups = new JObject();
            foreach (var bu in User.Business_unit)
                businessunits.Add(bu.Buid);
            var messagesNotRead = MDB.GetUnreadMessagesFor(User.Username, businessunits);
            foreach (var bu in User.Business_unit)
            {
                JObject groupData = new JObject();
                groupData["description"] = bu.Description;
                var notread = messagesNotRead.Where(x => x.For.Count == 1).Where(x => x.For.Contains(bu.Buid));
                if(notread.Any())
                    groupData["unreadMessages"] = notread.First().Count;
                else
                    groupData["unreadMessages"] = "";
                groups.Add(bu.Buid, groupData);
            }
            JObject userdata = new JObject();
            userdata["name"] = User.Name;
            userdata["surname"] = User.Surname;
            userdata["username"] = User.Username;
            userdata["status"] = User.Last_status;
            userdata["status_message"] = User.Status_message;
            userdata["img"] = User.Img;
            userdata["session_start"] = DateTime.Now;

            user_data = userdata.ToString();

            JObject constants = new JObject();
            constants["status"] = new JArray(STATUS);
            constants["numberOfMessagesToRetrieveAtOnce"] = MDB.numberOfMessagesToRetrieveAtOnce;

            JObject JUsers = new JObject();
            foreach (var U in Users) {
                string status = "offline";
                if (userstatus.ContainsKey(U.Username + "-" + applicationName)){
                    status = userstatus[U.Username + "-" + applicationName].ToString();
                }
                JObject JUser = new JObject();
                JUser.Add("username", U.Username);
                JUser.Add("name", U.Name);
                JUser.Add("surname", U.Surname);
                JUser.Add("status_message", U.Status_message);
                //JUser.Add("settings", new JObject(U.Settings));
                JUser.Add("img", U.Img);
                var bu = new JArray(U.Business_unit.Where(x => businessunits.Contains(x.Buid)).Select(x => x.Buid));
                JUser.Add("group", bu); //come selezionare la lista nella quale il contatto viene visualizzato
                JUser.Add("status", status);

                var notread = messagesNotRead.Where(x => x.For.Count == 2).Where(x => x.For.Contains(U.Username));
                if(notread.Any())
                    JUser.Add("unreadMessages", notread.First().Count);
                else
                    JUser.Add("unreadMessages", "");
                if (JUsers[U.Username] == null) 
                    JUsers.Add(U.Username, JUser);
            }

            JObject data = new JObject();
            data["contacts"] = JUsers;
            data["user"] = userdata;
            data["constants"] = constants;
            data["groups"] = groups;

            return data.ToString();
        }

        public string GetGroupDescription(string id) {
            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var entityupdate = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(id, "GROUPBYID", dbhandler).FirstOrDefault();
            string retpar = null;
            try
            {
                retpar = entityupdate[2].ToString();
            }
            catch (Exception ex) {
                MFLog.LogInFile("GetGroupDescription in ChatServer :the user is not attached to a Business unit err:" + ex.Message,MFLog.logtypes.ERROR);
                retpar = "N/A";
            }
            return retpar;
        }

        public string GetUserId(string username) {
            long id = MDB.GetUserID(username);
            if (id == -1)
                return "";
            return id.ToString();
        }

        public List<string> GetUserBusinessUnits(string username)
        {
            var businessUnits = MDB.GetUserBusinessUnits(username);
            List<string> bus = new List<string>();
            foreach (var bu in businessUnits)
                bus.Add(bu.Buid);
            return bus;
        }

        public List<string> GetUserBusinessUnits(User user)
        {
            var businessUnits = user.Business_unit;
            List<string> bus = new List<string>();
            foreach (var bu in businessUnits)
                bus.Add(bu.Buid);
            return bus;
        }
    }
}
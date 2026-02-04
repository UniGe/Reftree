using System;
using System.Web;
using Microsoft.AspNet.SignalR;
using System.Collections.Generic;
using System.Collections;
using System.Linq;
using System.Threading.Tasks;
using MagicFramework.Helpers;

namespace MagicFramework
{
    //[Authorize]
    public class MagicHub : Hub
    {
        private readonly static ConnectionMapping<string> _connections = new ConnectionMapping<string>();
        private static Hashtable _status = new Hashtable();
        public static Hashtable ActiveSessions = new Hashtable();
        private static IHubContext hubContext = GlobalHost.ConnectionManager.GetHubContext<MagicHub>();


        private ChatServer CS;

        internal const int CHAT_MESSAGE = 1;
        internal const int STATUS_UPDATE = 2;
        internal const int STATUS_MESSAGE_UPDATE = 3;
        internal const int CONTACT_DATA = 4;
        internal const int MESSAGE_READ = 5;

        internal readonly bool CHAT_ACTIVE = System.Configuration.ConfigurationManager.AppSettings["chatActive"].Equals("true") ? true : false;

        public MagicHub()
        {
            if (!CHAT_ACTIVE)
                throw new Exception("Chat not active!");
        }

        

        #region chat

        internal List<string> SendTo(List<string> user, int typeOfMessage, string message)
        {

            string name = this.GetCurrentUsersName();
            HashSet<string> sentTo = new HashSet<string>();

            foreach (var username in user)
            {
                foreach (var connectionId in GetConnections(username))
                {
                    switch (typeOfMessage)
                    {
                        case CHAT_MESSAGE:
                            Clients.Client(connectionId).pushMessage(message);
                            break;
                        case STATUS_UPDATE:
                            Clients.Client(connectionId).updateStatusFor(name, message);
                            break;
                        case STATUS_MESSAGE_UPDATE:
                            Clients.Client(connectionId).updateStatusMessageFor(name, message);
                            break;
                        case MESSAGE_READ:
                            if (username == name)
                                continue;
                            Clients.Client(connectionId).messageRead(username, message);
                            break;
                        default:
                            break;
                    }
                    sentTo.Add(username);
                }
            }
            return sentTo.ToList();
        }

        internal void SendToGroup(string groupname, int typeOfMessage, string message)
        {
            string username = this.GetCurrentUsersName();
            switch (typeOfMessage)
            {
                case CHAT_MESSAGE:
                    Clients.Group(AddApplicationNameToString(groupname)).pushMessage(message);
                    break;
                case STATUS_UPDATE:
                    Clients.Group(AddApplicationNameToString(groupname), GetConnections(username)).updateStatusFor(username, message);
                    break;
                case STATUS_MESSAGE_UPDATE:
                    Clients.Group(AddApplicationNameToString(groupname), GetConnections(username)).updateStatusMessageFor(username, message);
                    break;
                case CONTACT_DATA:
                    Clients.Group(AddApplicationNameToString(groupname), GetConnections(username)).addContact(groupname, message);
                    break;
                //case MESSAGE_READ:
                //    Clients.Group(groupname).messageRead(groupname, message);
                //    break;
                default:
                    break;
            }
        }

        internal void SendToAllGroupsOfConnectedUser(int typeOfMessage, string message)
        {
            string username = this.GetCurrentUsersName();
            CS = GetChatServer();
            var business_units = CS.GetUserBusinessUnits(username).Select(_ => AddApplicationNameToString(_)).ToList();

            switch (typeOfMessage)
            {
                case CHAT_MESSAGE:
                    Clients.Groups(business_units, GetConnections(username)).pushMessage(message);
                    break;
                case STATUS_UPDATE:
                    Clients.Groups(business_units, GetConnections(username)).updateStatusFor(username, message);
                    break;
                case STATUS_MESSAGE_UPDATE:
                    Clients.Groups(business_units, GetConnections(username)).updateStatusMessageFor(username, message);
                    break;
                default:
                    break;
            }
        }

        public void SendMessageTo(List<string> users, string message)
        {
            if (!CHAT_ACTIVE)
                return;

            CS = GetChatServer();

            

            if (String.IsNullOrWhiteSpace(message))
                return;
            int length = users.Count;
            if (length == 0)
                return;


            string username = this.GetCurrentUsersName();
            List<string> offlineUsers = this.getOfflineUsers(users);

            CS.sendMailToUsers(username,offlineUsers, message);

            int groupid;

            if (length == 2 && users.First().Equals("#GROUPMESSAGE") && Int32.TryParse(users.ElementAt(1), out groupid))
            {
                users.RemoveAt(0);
                string id = groupid.ToString();
                //var business_units = CS.GetUserBusinessUnits(username);
                //if (!business_units.Contains(id))
                //    return;
                message = CS.SaveGroupMessage(username, id, message);
                if (message == null)
                    return;
                this.SendToGroup(id, CHAT_MESSAGE, message);
            }
            else
            {
                if (!users.Contains(username))
                    users.Add(username);
                message = CS.SaveMessage(username, users, message);
                if (message == null)
                    return;
                this.SendTo(users, CHAT_MESSAGE, message);
            }
        }

        public void UpdateStatus(string newstatus)
        {
            if (!CHAT_ACTIVE)
                return;

            CS = GetChatServer();

            if (ChatServer.STATUS.Contains(newstatus) && GetStatus() != newstatus)
            {
                SetStatus(newstatus);
                CS.SaveStatus(GetCurrentUsersName(), newstatus);
                this.SendToAllGroupsOfConnectedUser(STATUS_UPDATE, newstatus);
            }
        }

        public void UpdateStatusMessage(string newstatusmessage)
        {
            if (!CHAT_ACTIVE)
                return;

            string username = this.GetCurrentUsersName();
            CS = GetChatServer();

            newstatusmessage = CS.SaveStatusMessageFromUser(username, newstatusmessage);
            this.SendToAllGroupsOfConnectedUser(STATUS_MESSAGE_UPDATE, newstatusmessage);
        }

        public void UserReadMessages(String[] messageIds)
        {
            if (!CHAT_ACTIVE)
                return;

            CS = GetChatServer();

            List<string> readInfo;
            var messagesRed = CS.UserReadMessages(messageIds, GetCurrentUsersName(), out readInfo);
            for (int i = 0; i < messagesRed.Count; i++)
            {
                //if (message.For.Count == 1)
                //    this.SendToGroup(message.For.First(), MESSAGE_READ, message.Id.ToString());
                //else
                if (messagesRed[i].For.Count > 1)
                {
                    this.SendTo(messagesRed[i].For, MESSAGE_READ, readInfo[i]);
                }
            }
        }

        public void GetMessagesFor(List<string> usernames, string date)
        {
            if (!CHAT_ACTIVE)
                return;

            string username = this.GetCurrentUsersName();
            CS = GetChatServer();

            int id;
            if (usernames.Count == 1 && Int32.TryParse(usernames.First(), out id))
            {
                var business_units = CS.GetUserBusinessUnits(username);
                if (!business_units.Contains(id.ToString()))
                    return;
            }
            else
            {
                if (!usernames.Contains(username))
                    usernames.Add(username);
            }
            var messages = CS.GetLastMessagesFor(usernames, date);
            Clients.Caller.unShiftMessages(messages);
        }

        internal static List<string> ConnectedUsers
        {
            get
            {
                return _connections.Keys;
            }
        }

        internal static Hashtable UserStatus
        {
            get
            {
                return _status;
            }
        }

        #endregion

        public override Task OnConnected()
        {
            string username = this.GetCurrentUsersName();

            AddConnection(username, Context.ConnectionId);

            #region chat

            if (CHAT_ACTIVE)
            {
                CS = GetChatServer();
                bool isNewUser = false;
                string status, userdata;

                var user = CS.GetUser(username);
                if (user.Last_login == DateTime.MinValue)
                    isNewUser = true;
                var chat_data = CS.GetUserDataJSON(user, MagicHub.UserStatus, out status, out userdata);
                var business_units = CS.GetUserBusinessUnits(user);

                foreach (var bu in business_units)
                {
                    Groups.Add(Context.ConnectionId, AddApplicationNameToString(bu));
                    if (status != "offline" && isNewUser)
                    {
                        this.SendToGroup(bu, CONTACT_DATA, userdata);
                    }
                }

                SetStatus(status);

                Clients.Caller.populateChat(chat_data);

                if (status != "offline" && !isNewUser)
                    this.SendToAllGroupsOfConnectedUser(STATUS_UPDATE, status);
            }

            #endregion

            return base.OnConnected();
        }

        public override Task OnDisconnected(bool stopCalled)
        {
            string username = this.GetCurrentUsersName();

            RemoveConnection(username, Context.ConnectionId);

            #region chat

            if (CHAT_ACTIVE)
            {
                CS = GetChatServer();

                string status = GetStatus();

                var userconnections = GetConnections(username);
                if (!userconnections.Any())
                {
                    if (status != "offline")
                        this.SendToAllGroupsOfConnectedUser(STATUS_UPDATE, "offline");
                    Hashtable syncedstatus = Hashtable.Synchronized(_status);
                    syncedstatus.Remove(AddApplicationNameToString(username));
                }
            }

            #endregion

            return base.OnDisconnected(stopCalled);
        }

        public override Task OnReconnected()
        {
            string username = this.GetCurrentUsersName();

            if (!GetConnections(username).Contains(Context.ConnectionId))
            {
                AddConnection(username, Context.ConnectionId);
            }

            //#region chat

            //if (CHAT_ACTIVE)
            //{

            //}

            //#endregion

            return base.OnReconnected();
        }

        private string[] GetConnections(string username)
        {
            return _connections.GetConnections(AddApplicationNameToString(username)).ToArray();
        }

        private static string[] GetConnections(string username,string applicationInstanceName)
        {
            return _connections.GetConnections(username+"-"+applicationInstanceName).ToArray();
        }

        private void AddConnection(string username, string connectionId)
        {
            _connections.Add(AddApplicationNameToString(username), connectionId);
        }

        private void RemoveConnection(string username, string connectionId)
        {
            _connections.Remove(AddApplicationNameToString(username), connectionId);
        }

        private string AddApplicationNameToString(string s)
        {
            return s + "-" + GetCurrentUsersApplicationName();
        }

        internal string GetCurrentUsersName()
        {
            return Context.User.Identity.Name.ToLower();
        }

        private string GetCurrentUsersSessionId()
        {
            return Context.QueryString["id"];
        }

        private string GetCurrentUsersApplicationName()
        {
            if (MagicHub.ActiveSessions.Contains(GetCurrentUsersSessionId()))
            {
                return (string)MagicHub.ActiveSessions[GetCurrentUsersSessionId()];
            }
            MFLog.LogInFile("MagicHub@GetChatServer: SessionId for " + GetCurrentUsersName() + " not found.", MFLog.logtypes.ERROR,"chatLog.txt");
            throw new Exception();
        }

        public static void AddLoggedSessionId(string sessionId, string applicationName)
        {
            Hashtable syncedSessions = Hashtable.Synchronized(ActiveSessions);
            {
                syncedSessions[sessionId] = applicationName;
            }
        }

        public static void RemoveSessionId(string sessionId)
        {
            Hashtable syncedSessions = Hashtable.Synchronized(ActiveSessions);
            {
                if (syncedSessions.ContainsKey(sessionId))
                    syncedSessions.Remove(sessionId);
            }
        }

        public static void RemoveSessionIds(string[] sessionIds)
        {
            Hashtable syncedSessions = Hashtable.Synchronized(ActiveSessions);
            {
                foreach (var sessionId in sessionIds)
                {
                    if (syncedSessions.ContainsKey(sessionId))
                        syncedSessions.Remove(sessionId);
                }
            }
        }

        private ChatServer GetChatServer()
        {
            string applicationName = GetCurrentUsersApplicationName();
            string applicationDomainUrl = Context.QueryString["url"];
            return new ChatServer(applicationDomainUrl, applicationName);
        }

        internal string GetStatus()
        {
            string username = AddApplicationNameToString(GetCurrentUsersName());
            if (_status.ContainsKey(username))
                return _status[username].ToString();
            else
                return "offline";
        }

        internal void SetStatus(string status)
        {
            string username = AddApplicationNameToString(GetCurrentUsersName());
            Hashtable syncedstatus = Hashtable.Synchronized(_status);
            {
                if (!syncedstatus.ContainsKey(username))
                    syncedstatus.Add(username, status);
                else
                    syncedstatus[username] = status;
            }
        }
        /// <summary>
        /// static method for message shipment from C# to JS console with the HUB
        /// </summary>
        /// <param name="applicationInstanceName"></param>
        /// <param name="username"></param>
        /// <param name="message"></param>
        public static void SendTo(string applicationInstanceName, string username, string message)
        {
            var conns = GetConnections(username, applicationInstanceName);
            foreach (var c in conns)
                hubContext.Clients.Client(c).pushConsoleMessage(message);
            //D.T always write to mongo , i need to have an history
            //if (conns.Length == 0) //user off-line
            //{
                //var notific = new Models.Notification();
                //notific.Message = message;
                //notific.Type = "info";
                //notific.PushMessageToMongo(username, applicationInstanceName);
            //}
        }
        public List<string> getOfflineUsers(List<string> users)
        {
            List<string> offlineUsers = new List<string>();
            foreach (var u in users)
            {
                var conns = GetConnections(u);
                if (conns.Length == 0) //user off-line
                    offlineUsers.Add(u);
            }
            return offlineUsers;
        }
    }

   
       
  
    #region chat class ConnectionMapping

    public class ConnectionMapping<T>
    {
        private readonly Dictionary<T, HashSet<string>> _connections = new Dictionary<T, HashSet<string>>();

        public int Count
        {
            get
            {
                return _connections.Count;
            }
        }

        public List<T> Keys
        {
            get
            {
                return new List<T>(_connections.Keys);
            }
        }

        public void Add(T key, string connectionId)
        {
            lock (_connections)
            {
                HashSet<string> connections;
                if (!_connections.TryGetValue(key, out connections))
                {
                    connections = new HashSet<string>();
                    _connections.Add(key, connections);
                }

                lock (connections)
                {
                    connections.Add(connectionId);
                }
            }
        }

        public IEnumerable<string> GetConnections(T key)
        {
            HashSet<string> connections;
            if (_connections.TryGetValue(key, out connections))
            {
                return connections;
            }

            return Enumerable.Empty<string>();
        }

        public void Remove(T key, string connectionId)
        {
            lock (_connections)
            {
                HashSet<string> connections;
                if (!_connections.TryGetValue(key, out connections))
                {
                    return;
                }

                lock (connections)
                {
                    connections.Remove(connectionId);

                    if (connections.Count == 0)
                    {
                        _connections.Remove(key);
                    }
                }
            }
        }
    }

    #endregion
}
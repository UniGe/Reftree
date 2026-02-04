using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using MongoDB.Driver.Builders;
using System.Data;
using System.Collections;

namespace MagicFramework.Helpers
{

    #region Models

    public class User : MongoConnector.MongoEntity {

        public User() {
            Business_unit = new List<BusinessUnit>();
        }

        public long User_id { get; set; }
        public string Username { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Status_message { get; set; }
        public DateTime Last_login { get; set; }
        public DateTime First_login { get; set; }
        public string Last_status { get; set; }
        public List<BusinessUnit> Business_unit { get; set; }
        [BsonDictionaryOptions(DictionaryRepresentation.ArrayOfDocuments)]
        public Dictionary<string, string> Settings { get; set; }
        public string Img { get; set; }
        public string Application_name { get; set; }
    }

    public class Message : MongoConnector.MongoEntity {

        public Message()
        {
            For = new List<string>();
            ReadBy = new Dictionary<string, DateTime>();
        }

        public string From { get; set; }
        public DateTime Received { get; set; }
        public string Text { get; set; }
        public List<string> For { get; set; }
        [BsonElement("ReadBy")]
        [BsonDictionaryOptions(DictionaryRepresentation.ArrayOfDocuments)]
        public Dictionary<string, DateTime> ReadBy { get; set; }
        public string Application_name { get; set; }
        [BsonIgnoreIfNull]
        public string File { get; set; }
        [BsonIgnoreIfNull]
        public string BusinessObjectType { get; set; }
        [BsonIgnoreIfNull]
        public string BusinessObjectId { get; set; }
    }

    public class ReceivedMessage
    {
        public string Text { get; set; }
        public string File { get; set; }
        public string BOType { get; set; }
        public string BOId { get; set; }
    }

    public class MessageCount {
        public MessageCount()
        {
            For = new List<string>();
        }

        public int Count { get; set; }
        public List<string> For { get; set; }
    }


    //[BsonIgnoreExtraElements]
    public class BusinessUnit {

        public BusinessUnit() {
            Group_id = new List<long>();
        }

        public String Buid { get; set; }
        public String Description { get; set; }
        public List<long> Group_id { get; set; }
    }

  

    #endregion

    public class MongoHandler : MongoConnector
    {
        public readonly int numberOfMessagesToRetrieveAtOnce = Int32.Parse(System.Configuration.ConfigurationManager.AppSettings["numberOfMessagesToRetrieveAtOnce"]);
        public readonly int numberOfUnreadMessagesToRetrieveAtOnce = Int32.Parse(System.Configuration.ConfigurationManager.AppSettings["numberOfUnreadMessagesToRetrieveAtOnce"]);
        public readonly int numberOfMessagesToCheckIfUnread = Int32.Parse(System.Configuration.ConfigurationManager.AppSettings["numberOfMessagesToCheckIfUnread"]);

        //        private readonly string applicationName = System.Web.Security.Membership.ApplicationName; //

        public MongoHandler() : base()
        {
            if (!String.IsNullOrEmpty(this.connectionString))
                SetIndexes();
        }

        public MongoHandler(string connectionString, string applicationName, string dbName) : base(connectionString, applicationName, dbName)
        {
            if (!String.IsNullOrEmpty(this.connectionString))
                SetIndexes();
        }

        private void SetIndexes()
        {
            var usersCollection = this.Database.GetCollection<User>("users");
            //usersCollection.DropIndex(IndexKeys<User>.Ascending(_ => _.Username));
            //usersCollection.DropIndex(IndexKeys<User>.Ascending(_ => _.Application_name));
            var keys = new IndexKeysBuilder<User>();
            keys.Ascending(_ => _.Username);
            keys.Ascending(_ => _.Application_name);
            usersCollection.CreateIndex(keys, IndexOptions.SetUnique(true));

            var messagesCollection = this.Database.GetCollection<Message>("messages");
            messagesCollection.CreateIndex(IndexKeys<Message>.Descending(_ => _.Received));
            messagesCollection.CreateIndex(IndexKeys<Message>.Ascending(_ => _.For));
            messagesCollection.CreateIndex(IndexKeys<Message>.Ascending(_ => _.Application_name));

            var notifactionsCollection = this.Database.GetCollection<Notification>("notifications");
            notifactionsCollection.CreateIndex(IndexKeys<Notification>.Ascending(_ => _.Username));
            notifactionsCollection.CreateIndex(IndexKeys<Notification>.Ascending(_ => _.Application_name));
        }

        #region basicUserFunctions

        public void SaveUser(User U)
        {
            if (this.Database == null)
                return;
            U.Username = U.Username.ToLower();
            U.Application_name = applicationName;
            try
            {
                var Collection = this.Database.GetCollection<User>("users");
           
                Collection.Save(U, WriteConcern.Acknowledged);
            }
            catch (WriteConcernException e)
            {
                MFLog.LogInFile("MongoDB: Trying to write user with duplicate username: " + U.Username + " Application: " + applicationName + "\nMessage: " + e.Message, MFLog.logtypes.WARN);
            }
        }


        public User GetUser(string username) {
            User U = null;
            if (this.Database == null)
                return U;
         
            try
            {
                username = username.ToLower();
                var Collection = this.Database.GetCollection<User>("users");
                var Q = Query.And(Query<User>.EQ(e => e.Username, username), Query<User>.EQ(e => e.Application_name, applicationName));
                U = Collection.FindOne(Q);
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex);
            }
            return U;
        }

        public void DeleteUser(int userID)
        {
            var Collection = this.Database.GetCollection<User>("users");
            Collection.Remove(Query.And(Query<User>.EQ(_ => _.User_id, userID), Query<User>.EQ(_ => _.Application_name, applicationName)));
        }

        #endregion

        #region chat

        public List<User> GetUsers(List<string> usernames){
            usernames = usernames.ConvertAll(d => d.ToLower());
            var Collection = this.Database.GetCollection<User>("users");
            var Q = Query.And(Query<User>.In(u => u.Username, usernames), Query<User>.EQ(e => e.Application_name, applicationName));
            var U = Collection.Find(Q);
            return U.ToList();
        }

        public long GetUserID(string username) {
            username = username.ToLower();
            var Collection = this.Database.GetCollection<User>("users");
            var Q = Query.And(Query<User>.EQ(e => e.Username, username), Query<User>.EQ(e => e.Application_name, applicationName));
            var U = Collection.FindOne(Q);
            if (U != null)
                return U.User_id;
            return -1;
        }

        public List<BusinessUnit> GetUserBusinessUnits(string username)
        {
            username = username.ToLower();
            var Collection = this.Database.GetCollection<User>("users");
            var Q = Query.And(Query<User>.EQ(e => e.Username, username), Query<User>.EQ(e => e.Application_name, applicationName));
            var U = Collection.FindOne(Q);
            if (U != null)
                return U.Business_unit;
            return null;
        }

        public List<User> GetUsersByBusinessUnitsFromUser(string username)
        {
            username = username.ToLower();
            var Collection = this.Database.GetCollection<User>("users");
            var Q = Query.And(Query<User>.EQ(e => e.Username, username), Query<User>.EQ(e => e.Application_name, applicationName));
            var U = Collection.FindOne(Q);
            Q = Query.And(
                Query<User>.EQ(e => e.Application_name, applicationName),
                Query<User>.In(e => e.Business_unit, U.Business_unit),
                Query<User>.NE(e => e.Id, U.Id)
                );
            var Usr = Collection.Find(Q);
            return Usr.ToList();
        }

        public List<User> GetUsersByBusinessUnitsFromUser(User U)
        {
            U.Username = U.Username.ToLower();
            var Collection = this.Database.GetCollection<User>("users");
            var Q = Query.And(
                Query<User>.EQ(e => e.Application_name, applicationName),
                Query<User>.In(e => e.Business_unit, U.Business_unit),
                Query<User>.NE(e => e.Id, U.Id)
                );
            var Usr = Collection.Find(Q).OrderBy(o => o.Name);
            return Usr.ToList();
        }

        public void SaveLastStatusFromUser(string username, string status)
        {
            username = username.ToLower();
            var Collection = this.Database.GetCollection<User>("users");
            var Q = Query.And(Query<User>.EQ(e => e.Username, username), Query<User>.EQ(e => e.Application_name, applicationName));
            var U = Collection.FindOne(Q);
            U.Last_status = status;
            Collection.Save(U);
        }

        public void SaveStatusMessageFromUser(string username, string statusmessage)
        {
            username = username.ToLower();
            var Collection = this.Database.GetCollection<User>("users");
            var Q = Query.And(Query<User>.EQ(e => e.Username, username), Query<User>.EQ(e => e.Application_name, applicationName));
            var U = Collection.FindOne(Q);
            U.Status_message = statusmessage;
            Collection.Save(U);
        }

        public List<Message> GetLastMessagesFor(List<string> usernames, DateTime date)
        {
            usernames = usernames.ConvertAll(d => d.ToLower());
            usernames.Sort();
            var Collection = this.Database.GetCollection<Message>("messages");
            var Q = Query.And(Query<Message>.Where(e => e.For.Equals(usernames)), Query<Message>.LT(e => e.Received, date), Query<User>.EQ(e => e.Application_name, applicationName));
            return Collection.Find(Q).OrderByDescending(e => e.Received).Take(numberOfMessagesToRetrieveAtOnce).ToList();
        }

        public List<MessageCount> GetUnreadMessagesFor(string username, List<string> messagesFor)
        {
            username = username.ToLower();
            var Collection = this.Database.GetCollection<Message>("messages");
            List<string> mF = new List<string>(messagesFor);
            mF.Add(username);
            var match0 = new BsonDocument 
            {
                { 
                    "$match",
                    new BsonDocument
                    {
                        { "For",
                            new BsonDocument
                            {
                                {"$in", new BsonArray(mF)}
                            }
                        }
                    }
                }
            };
            var match1 = new BsonDocument 
            {
                { 
                    "$match",
                    new BsonDocument
                    {
                        { "Application_name", applicationName }
                    }
                }
            };
            var match2 = new BsonDocument
                {
                    {
                        "$match",
                        new BsonDocument
                        { 
                            {
                            "From",
                                new BsonDocument
                                {
                                    { "$ne", username }
                                }
                            }
                        }
                    }
                };
            var match3 = new BsonDocument
                {
                    {
                        "$match",
                        new BsonDocument
                        {
                            {
                                "ReadBy.k",
                                    new BsonDocument
                                    {
                                        { "$ne", username }
                                    }
                             }
                        }
                    }
                };
            var sort = new BsonDocument
            {
                { "$sort",
                    new BsonDocument
                    {
                        { "Received", -1 }
                    }
                }
            };
            var limit = new BsonDocument
            {
                { "$limit", numberOfMessagesToCheckIfUnread } 
            };
            var group = new BsonDocument 
                { 
                    { "$group",
                        new BsonDocument 
                            { 
                                {
                                    "_id",
                                    new BsonDocument 
                                    { 
                                        { 
                                            "For","$For"
                                        } 
                                    } 
                                }, 
                                { 
                                    "Count",
                                    new BsonDocument 
                                    { 
                                        { 
                                            "$sum", 1
                                        } 
                                    } 
                                } 
                            } 
                  } 
                };
            var project = new BsonDocument 
                { 
                    { 
                        "$project", 
                        new BsonDocument 
                            { 
                                {"_id", 0}, 
                                {"For","$_id.For"}, 
                                {"Count", 1}, 
                            } 
                    } 
                };
            var pipeline = new[] { match0, match1, match2, match3, sort, limit, group, project };
            var args = new AggregateArgs { Pipeline = pipeline, OutputMode = AggregateOutputMode.Inline };
            var result = Collection.Aggregate(args);

            var matchingExamples = result.Select(BsonSerializer.Deserialize<MessageCount>).ToList();
            return matchingExamples;
        }

        public Message SaveSimpleMessage(string from, List<string> forUsers, ReceivedMessage message)
        {
            from = from.ToLower();
            forUsers = forUsers.ConvertAll(d => d.ToLower());
            var u = GetUsers(forUsers).Select(e => e.Username).ToList();
            if (!u.Any())
                return null;
            var ordered = u.OrderBy(x => x).ToList();
            var Collection = this.Database.GetCollection<Message>("messages");
            return this.SaveMessage(from, ordered, message);
        }

        public Message SaveGroupMessage(string from, string id, ReceivedMessage message)
        {
            from = from.ToLower();
            var bus = this.GetUserBusinessUnits(from);
            var bu = bus.Where(e => e.Buid == id);
            if (bu == null)
                return null;
            return this.SaveMessage(from, new List<string>() { id }, message);
        }

        private Message SaveMessage(string from, List<string> forUsers, ReceivedMessage message)
        {
            from = from.ToLower();
            forUsers = forUsers.ConvertAll(d => d.ToLower());
            var Collection = this.Database.GetCollection<Message>("messages");
            Message M = new Message();
            M.Received = DateTime.Now;
            M.Text = message.Text;
            M.For = forUsers;
            M.From = from;
            M.Application_name = applicationName;
            if (message.File != null) {
                M.File = message.File;
                if (message.BOId != null && message.BOType != null)
                {
                    M.BusinessObjectType = message.BOType;
                    M.BusinessObjectId = message.BOId;
                }
            }
            Collection.Save(M);
            return M;
        }

        public List<Message> UpdateReadByForMessages(String[] messageIds, string username)
        {
            username = username.ToLower();
            List<ObjectId> ids = new List<ObjectId>();
            var bu = GetUserBusinessUnits(username);
            List<string> businessUnits = new List<string>();
            foreach (var b in bu)
            {
                businessUnits.Add(b.Buid);
            }
            businessUnits.Add(username);
            var message = new Message() {
                For = businessUnits
            };
            foreach (var id in messageIds)
                ids.Add(ObjectId.Parse(id));
            var C = this.Database.GetCollection<Message>("messages");
            var Q = Query.And(Query<Message>.In(e => e.Id, ids), Query<Message>.EQ(e => e.Application_name, applicationName), Query<Message>.In(e => e.For, message.For), Query<Message>.NE(e => e.From, username));
            var M = C.Find(Q);
            List<Message> messagesRed = new List<Message>();
            foreach (var m in M)
            {
                if (!m.ReadBy.ContainsKey(username))
                {
                    m.ReadBy.Add(username, DateTime.Now);
                    messagesRed.Add(m);
                    C.Save(m);
                }
            }
            return messagesRed;
        }

        //public List<Message> UpdateReadByForMessages(String[] messageIds, string username)
        //{
        //    var bu = GetUserBusinessUnits(username);
        //    string ids = "";
        //    string bunits = "";
        //    foreach (var id in messageIds){
        //        ids += "ObjectId(\"" + id + "\"), ";
        //    }
        //    foreach (var b in bu){
        //        bunits += "\"" + b.Buid + "\", ";
        //    }
        //    bunits += "\"" + username + "\"";
        //    ids = ids.Trim(new char[] {',', ' '});
        //    var C = this.Database.GetCollection<Message>("messages");
        //    string json = "{ \"_id\" : { \"$in\" : [" + ids + "] }, \"Application_name\" : \"" + this.applicationName + "\", \"From\" : { \"$ne\" : \"" + username + "\" }, \"For\" : { \"$in\" : [" + bunits + "] } }";
        //    BsonDocument query = MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BsonDocument>(json);
        //    QueryDocument queryDoc = new QueryDocument(query);
        //    var M = C.FindAs<Message>(queryDoc);
        //    List<Message> messagesRed = new List<Message>();
        //    foreach (var m in M)
        //    {
        //        if (!m.ReadBy.ContainsKey(username))
        //        {
        //            m.ReadBy.Add(username, DateTime.Now);
        //            messagesRed.Add(m);
        //            C.Save(m);
        //        }
        //    }
        //    return messagesRed;
        //}

        #endregion

  
    }
}
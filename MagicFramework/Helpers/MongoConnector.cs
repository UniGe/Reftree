using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDB.Driver.Builders;
using MongoDB.Bson.Serialization.Attributes;
using System.Web.ModelBinding;
using System.IO;
using Newtonsoft.Json;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace MagicFramework.Helpers
{

    public class MongoConnector
    {
        protected string connectionString;
        protected string applicationName;
        protected string databaseName = "Magic";
        protected MongoClient Client;
        protected MongoServer Server;
        protected MongoDatabase Database;


        public MongoConnector(string mongoconnectionString, string applicationName, string dbName = null)
        {
            if (String.IsNullOrEmpty(mongoconnectionString))
                return;
            this.BasicSetup(mongoconnectionString, applicationName, dbName);
        }

        public MongoConnector()
        {
            var applicationConfig = new MFConfiguration(SessionHandler.ApplicationDomainURL);
            var selectedconfig = applicationConfig.GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
            this.BasicSetup(applicationConfig.appSettings.MongoDBconn, selectedconfig.appInstancename, selectedconfig.mongoDBName);
        }

        protected virtual void BasicSetup(string mongoconnectionString, string applicationName, string dbName = null)
        {
            if (String.IsNullOrEmpty(mongoconnectionString))
                return;

            this.connectionString = mongoconnectionString;
            this.applicationName = applicationName;

            this.databaseName = dbName ?? this.databaseName;
            this.Client = new MongoClient(this.connectionString);
            this.Server = Client.GetServer();
            this.Database = Server.GetDatabase(this.databaseName);
        }

        #region modelBinding and conversion

        public class ObjectIdConverter : JsonConverter
        {
            public override object ReadJson(
                JsonReader reader,
                Type objectType,
                object existingValue,
                JsonSerializer serializer)
            {
                return ObjectId.Parse(reader.Value.ToString());
            }

            public override void WriteJson(
                JsonWriter writer, object value, JsonSerializer serializer)
            {
                throw new NotImplementedException();
            }

            public override bool CanConvert(Type objectType)
            {
                return typeof(ObjectId).IsAssignableFrom(objectType);
            }

            public override bool CanWrite
            {
                get { return false; }
            }
        }

        #endregion

        #region Models

        public interface IMongoEntity
        {
            ObjectId Id { get; set; }
        }

        public class MongoEntity : IMongoEntity
        {
            [JsonConverter(typeof(MongoConnector.ObjectIdConverter))]
            [BsonId]
            public ObjectId Id { get; set; }
        }

        #endregion

        public static BsonDocument StringToBsonDocument(string stringDocument)
        {
            if (string.IsNullOrWhiteSpace(stringDocument) || stringDocument == "null")
                return null;
            return MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BsonDocument>(stringDocument);
        }

        public static BsonArray StringToBsonArray(string stringArray)
        {
            if (string.IsNullOrWhiteSpace(stringArray) || stringArray == "null")
                return null;
            return MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BsonArray>(stringArray);
        }

        protected List<MongoDB.Driver.IMongoQuery> ParseKendoFilterFlat(Models.Kendo.Filter[] filters)
        {
            List<MongoDB.Driver.IMongoQuery> lq = new List<MongoDB.Driver.IMongoQuery>();
            foreach (var filter in filters)
            {
                lq.Add(ParseFilterObjectKendoToMongo(filter));
            }
            return lq;
        }

        protected List<MongoDB.Driver.IMongoQuery> ParseKendoFilterRecursively(Models.Kendo.Filter[] filters)
        {
            List<MongoDB.Driver.IMongoQuery> lq = new List<MongoDB.Driver.IMongoQuery>();
            foreach (var filter in filters)
            {
                if (filter.filters != null) {
                    if (filter.logic == "and")
                        lq.Add(Query.And(ParseKendoFilterRecursively(filter.filters)));
                    else
                        lq.Add(Query.Or(ParseKendoFilterRecursively(filter.filters)));
                }
                else
                    lq.Add(ParseFilterObjectKendoToMongo(filter));
            }
            return lq;
        }

        protected MongoDB.Driver.IMongoQuery ParseKendoFilterRecursively(Models.Kendo.Filter filter)
        {
            if (filter.filters != null)
            {
                if (filter.logic == "or")
                    return Query.Or(ParseKendoFilterRecursively(filter.filters));
                else
                    return Query.And(ParseKendoFilterRecursively(filter.filters));
            }
            else
                return ParseFilterObjectKendoToMongo(filter);
        }

        protected MongoDB.Driver.IMongoQuery ParseFilterObjectKendoToMongo(Models.Kendo.Filter filter)
        {
            MongoDB.Driver.IMongoQuery q;
                switch (filter.Operator)
                {
                    case "eq":
                        q = Query.EQ(filter.field, filter.value);
                        break;
                    case "neq":
                        q = Query.NE(filter.field, filter.value);
                        break;
                    case "lt":
                        q = Query.LT(filter.field, filter.value);
                        break;
                    case "lte":
                        q = Query.LTE(filter.field, filter.value);
                        break;
                    case "gt":
                        q = Query.GT(filter.field, filter.value);
                        break;
                    case "gte":
                        q = Query.GTE(filter.field, filter.value);
                        break;
                    case "startswith":
                        BsonRegularExpression r = new BsonRegularExpression(@"^" + filter.value, "i");
                        q = Query.Matches(filter.field, r);
                        break;
                    case "endswith":
                        BsonRegularExpression rr = new BsonRegularExpression(filter.value + @"$", "i");
                        q = Query.Matches(filter.field, rr);
                        break;
                    case "contains":
                    default:
                        BsonRegularExpression rrr = new BsonRegularExpression(filter.value, "i");
                        q = Query.Matches(filter.field, rrr);
                        break;
                }
            return q;
        }

        public List<BsonDocument> QueryCollection(string collectionName, Models.Kendo.GridRequest request)
        {
            var c = Database.GetCollection(collectionName);
            MongoDB.Driver.IMongoQuery q;
            if (request.filter != null)
                q = ParseKendoFilterRecursively(request.filter);
            else
                q = new QueryDocument(new BsonDocument());
            var res = c.Find(q);
            if (request.skip > 0)
                res.Skip(request.skip);
            if (request.take > 0)
                res.Take(request.take);
            if(request.sort != null)
            {
                SortByBuilder sort = new SortByBuilder();
                foreach(Models.Kendo.Sort s in request.sort)
                {
                    if (s.dir == "desc")
                        sort.Descending(s.field);
                    else
                        sort.Ascending(s.field);
                }
                res.SetSortOrder(sort);
            }
            return res.ToList();
        }

        public void DeleteFromCollectionById(string collectionName, string id)
        {
            var c = Database.GetCollection(collectionName);
            c.Remove(new QueryDocument(new BsonDocument { { "_id", ObjectId.Parse(id) }}));
        }
    }
}
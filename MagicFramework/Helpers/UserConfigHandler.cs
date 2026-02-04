using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MagicFramework.Helpers
{
    public class UserConfigHandler 
    {
        public static class DocumentType {
            public static string UserConfig = "Magic_Mmb_UsersConfigs";
            public static string GridOverWrite = "MagicGrids_Overwrites";
            public static string UserExtension = "Magic_Mmb_Users_Extensions";
        }

        public enum ConfigType
        {
            GridConfig,
            CalendarConfig,
            PivotConfig,
            More
        }

        #region Models

     

        public class UserDBEntity {
            public int User_ID  {get;set;}
            public int ID { get; set; }
        }
        public class UserConfig: UserDBEntity 
        {
            public Dictionary<string, dynamic> gridConfigs { get; set; }
         
            public dynamic calendarConfig { get; set; }
          
            public dynamic pivotConfig { get; set; }
           
            public dynamic more { get; set; }

            public UserConfig(DataRow dataRow)
            {
                dynamic config = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(dataRow["Configuration"].ToString());
                this.User_ID = int.Parse(dataRow["User_ID"].ToString());
                this.ID = int.Parse(dataRow["ID"].ToString());
                if (config["calendarConfig"]!=null)
                    this.calendarConfig = Newtonsoft.Json.JsonConvert.DeserializeObject(config["calendarConfig"].ToString());
                if (config["pivotConfig"] != null)
                    this.pivotConfig = Newtonsoft.Json.JsonConvert.DeserializeObject(config["pivotConfig"].ToString());
                if (config["gridConfigs"] !=null)
                    this.gridConfigs = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string,dynamic>>(config["gridConfigs"].ToString());
                if (config["more"] != null)
                    this.more = Newtonsoft.Json.JsonConvert.DeserializeObject(config["more"].ToString());
            }
            public UserConfig()
            {
                this.User_ID = SessionHandler.IdUser;
                this.ID = 0;
            }
        }

        //public class GridOverwrite 
        //{
        //    public string grid_name { get; set; }
        //    public List<string> for_application_names { get; set; }
        //    public bool used_for_all_applications { get; set; }
        //    public dynamic overwrite { get; set; }
        //    public dynamic original { get; set; }
        //    public dynamic diff { get; set; }
        //    public string modified_by { get; set; }
        //    public DateTime modified_at { get; set; }
        //    public string culture { get; set; }
        //}

        #endregion

        public UserConfigHandler()
        {
        }


        #region grid overwrite
        //public void SaveGridOverwrite(GridOverwrite overwrite)
        //{
        //    var c = this.Database.GetCollection<GridOverwrite>(DocumentType.GridOverWrite);
        //    c.Save(overwrite);
        //}

        //public BsonDocument GetGridOverwrite(string gridName, string cultureCode)
        //{
        //    var c = this.Database.GetCollection(DocumentType.GridOverWrite);
        //    var q = Query.And(
        //                Query<GridOverwrite>.EQ(o => o.grid_name, gridName),
        //                Query<GridOverwrite>.EQ(o => o.culture, cultureCode),
        //                Query.Or(
        //                    Query<GridOverwrite>.Where(o => o.for_application_names.Contains(applicationName)),
        //                    Query<GridOverwrite>.EQ(o => o.used_for_all_applications, true)
        //                )
        //            );
        //    return c.Find(q).SetSortOrder(SortBy<GridOverwrite>.Ascending(o => o.used_for_all_applications).Descending(o => o.modified_at)).FirstOrDefault();
        //}

        //public List<GridOverwrite> SearchGridOverwrites(string searchValue)
        //{
        //    var c = this.Database.GetCollection<GridOverwrite>(DocumentType.GridOverWrite);
        //    var containsSearchValue = new BsonRegularExpression("/"+ searchValue +"/i");
        //    var q = Query.Or(
        //                Query<GridOverwrite>.Matches(o => o.grid_name, containsSearchValue),
        //                Query<GridOverwrite>.Matches(o => o.for_application_names, containsSearchValue)
        //            );
        //    return c.Find(q).SetFields(Fields<GridOverwrite>.Exclude(o => o.diff, o => o.original, o => o.overwrite)).SetSortOrder(SortBy<GridOverwrite>.Descending(o => o.modified_at)).ToList();
        //}

        //public List<BsonDocument> GetGridOverwritesByGridName(string gridName)
        //{
        //    var c = this.Database.GetCollection(DocumentType.GridOverWrite);
        //    var q = Query<GridOverwrite>.EQ(o => o.grid_name, gridName);
        //    return c.Find(q).SetFields(Fields<GridOverwrite>.Exclude(o => o.diff, o => o.original, o => o.overwrite)).SetSortOrder(SortBy<GridOverwrite>.Descending(o => o.modified_at)).ToList();
        //}

        //public BsonDocument GetGridOverwriteById(string id)
        //{
        //    var c = this.Database.GetCollection(DocumentType.GridOverWrite);
        //    var q = Query<GridOverwrite>.EQ(o => o.Id, ObjectId.Parse(id));
        //    return c.FindOne(q);
        //}

        #endregion

        #region user config

        public Dictionary<string,string> GetUserSettings()
        {
            string SQL = "SELECT Settings From " + DocumentType.UserExtension + " Where [UserID] = @userid";
            string settings;
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(SQL, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(new SqlParameter("@userid", SessionHandler.IdUser));
                    settings = cmd.ExecuteScalar().ToString();
                    cmd.Connection.Close();
                }
            }

            if (String.IsNullOrEmpty(settings))
                return null;

            Dictionary<string, string> settingsDict = JsonConvert.DeserializeObject<Dictionary<string, string>>(settings);
            return settingsDict;
        }

        public bool SaveUserSettings(string username, Dictionary<string, string> settings)
        {
            Dictionary<string, string> currentSettings = GetUserSettings();

            if (currentSettings == null)
                currentSettings = new Dictionary<string, string>();
            foreach (var setting in settings)
                if (currentSettings.ContainsKey(setting.Key))
                    currentSettings[setting.Key] = setting.Value;
                else
                    currentSettings.Add(setting.Key, setting.Value);

      
            string userSql = "SELECT UserID from Magic_mmb_Users where Username = @username";
            string updateSql = "UPDATE Magic_Mmb_Users_Extensions set Settings = @settings where UserID=@userid";
            int userid = 0;
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(userSql, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(new SqlParameter("@username", username));
                    userid = int.Parse(cmd.ExecuteScalar().ToString());
                    cmd.Connection.Close();
                }

                using (SqlCommand cmdupd = new SqlCommand(updateSql, conn))
                {
                    cmdupd.Connection.Open();
                    cmdupd.Parameters.Add(new SqlParameter("@userid", userid));
                    cmdupd.Parameters.Add(new SqlParameter("@settings", JsonConvert.SerializeObject(currentSettings, Formatting.None,
                            new JsonSerializerSettings
                            {
                                NullValueHandling = NullValueHandling.Ignore
                            })));
                    cmdupd.ExecuteNonQuery();
                    cmdupd.Connection.Close();
                }
                

            }

            return true;
        }
        public UserConfig GetUserConfig()
        {
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            DataSet ds = dbutils.GetDataSet("SELECT ID,User_ID,Configuration FROM " + DocumentType.UserConfig + " where User_ID=" + SessionHandler.IdUser.ToString());
            if (ds.Tables[0].Rows.Count == 0)
                return null;
            return new UserConfig(ds.Tables[0].Rows[0]);
        }

        public void SaveUserConfig(UserConfig uc)
        {
            string SQL = "UPDATE " + DocumentType.UserConfig + " set Configuration=@configuration where ID = @id";
            bool isupdate = true;
            if (uc.ID == 0)
            {
                isupdate = false;
                SQL = "INSERT INTO " + DocumentType.UserConfig + "(User_ID,Configuration) VALUES (@userid,@configuration)";
            }
            JObject config = JObject.FromObject(new { gridConfigs = uc.gridConfigs, calendarConfig = uc.calendarConfig , pivotConfig = uc.pivotConfig , more = uc.more }); 

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(SQL, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(new SqlParameter("@configuration", JsonConvert.SerializeObject(config, Formatting.None,
                            new JsonSerializerSettings
                            {
                                NullValueHandling = NullValueHandling.Ignore
                            })));
                    if (!isupdate)
                        cmd.Parameters.Add(new SqlParameter("@userid", SessionHandler.IdUser));
                    else
                        cmd.Parameters.Add(new SqlParameter("@id", uc.ID));
                    cmd.ExecuteNonQuery();
                    cmd.Connection.Close();
                }
            }

        }

        public void SetUserConfig(ConfigType configType, string doc ,string key = null)
        {
            var document = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(doc);
            UserConfig config =  this.GetUserConfig();
            if(config == null)
            {
                config = new UserConfig();
            }
            switch (configType)
            {
                case ConfigType.GridConfig:
                    if (config.gridConfigs == null)
                        config.gridConfigs = new Dictionary<string, dynamic>();
                    if (!config.gridConfigs.ContainsKey(key))
                        config.gridConfigs.Add(key, document);
                    else
                        config.gridConfigs[key] = document;
                    break;
                case ConfigType.CalendarConfig:
                    config.calendarConfig = document;
                    break;
                case ConfigType.PivotConfig:
                    config.pivotConfig = document;
                    break;
                case ConfigType.More:
                    config.more = document;
                    break;
            }
            this.SaveUserConfig(config);
        }

        public bool DeleteUserConfig(ConfigType configType, string key)
        {

            UserConfig uc = this.GetUserConfig();

            switch (configType)
            {
                case ConfigType.GridConfig:
                    break;
                default:
                    return false;
            }
            if (uc == null)
                return false;
            switch (configType)
            {
                case ConfigType.GridConfig:
                    uc.gridConfigs.Remove(key);
                    break;
            }
            SaveUserConfig(uc);
            return true;
        }

        public UserConfig SetUserConfigDefaultToFalse(string gridKey, string settingsName)
        {
            UserConfig uc = this.GetUserConfig();
            JObject job = JObject.FromObject(uc);
            JObject gridConfigs = (JObject) job["gridConfigs"];
            JArray gridConfig = (JArray)gridConfigs[gridKey];

            foreach(JObject cfg in gridConfig)
            {
                if((string)cfg["settingsName"] == settingsName)
                {
                    cfg["isDefaultSetting"] = false;
                }
            }

            this.UpdateUserConfig(uc.ID, job.ToString());
            return this.GetUserConfig();
        }
        public UserConfig SetUserConfigDefaultToTrue(string gridKey, string settingsName)
        {
            UserConfig uc = this.GetUserConfig();
            JObject job = JObject.FromObject(uc);
            JObject gridConfigs = (JObject) job["gridConfigs"];
            JArray gridConfig = (JArray)gridConfigs[gridKey];

            foreach(JObject cfg in gridConfig)
            {
                if((string)cfg["settingsName"] == settingsName)
                {
                    cfg["isDefaultSetting"] = true;
                } else
                {
                    cfg["isDefaultSetting"] = false;
                }
            }

            this.UpdateUserConfig(uc.ID, job.ToString());
            return this.GetUserConfig();
        }

        public bool UpdateUserConfig(int id, string configuration)
        {
            string updateSql = "UPDATE [dbo].[Magic_Mmb_UsersConfigs] SET [Configuration] = @cfg where ID=@id";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(updateSql, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(new SqlParameter("@id", id));
                    cmd.Parameters.Add(new SqlParameter("@cfg", configuration));
                    cmd.ExecuteNonQuery();
                    cmd.Connection.Close();
                }
            }
            return true;
        }

        #endregion

        //public bool InsertDocument(string doc, string collection)
        //{
        //    try
        //    {
        //        return InsertDocument(StringToBsonDocument(doc), collection);
        //    }
        //    catch
        //    {
        //        return false;
        //    }
        //}

        //public bool InsertDocument(BsonDocument document, string collection)
        //{
        //    try
        //    {
        //        if (!document.Contains("name") || String.IsNullOrEmpty(document["name"].ToString()))
        //            return false;
        //        var C = this.Database.GetCollection(collection);
        //        document["applicationName"] = applicationName;
        //        document["creationDate"] = DateTime.Now;
        //        C.Insert(document);
        //        return true;
        //    }
        //    catch
        //    {
        //        return false;
        //    }
        //}

        //public BsonDocument SaveDocument(string doc, string collection)
        //{
        //    try
        //    {
        //        return SaveDocument(StringToBsonDocument(doc), collection);
        //    }
        //    catch
        //    {
        //        return null;
        //    }
        //}

        //public BsonDocument SaveDocument(BsonDocument document, string collection)
        //{
        //    try
        //    {
        //        var C = this.Database.GetCollection(collection);
        //        document["applicationName"] = applicationName;
        //        document["modified"] = DateTime.Now;
        //        C.Save(document);
        //        return document;
        //    }
        //    catch
        //    {
        //        return null;
        //    }
        //}

        //public bool DeleteOldVersionsOfDocumentByName(string name, string collection)
        //{
        //    try
        //    {
        //        var docs = GetAllVersionsOfADocumentByName(name, collection);
        //        if (docs.Length > 10)
        //        {
        //            var olderThan = docs[9]["creationDate"];
        //            var Q = Query.And(Query.EQ("name", name), Query.EQ("applicationName", applicationName), Query.LT("creationDate", olderThan));
        //            var C = this.Database.GetCollection(collection);
        //            C.Remove(Q);
        //        }
        //        return true;
        //    }
        //    catch
        //    {
        //        return false;
        //    }
        //}

        //public BsonDocument[] GetAllVersionsOfADocumentByName(string name, string collection)
        //{
        //    try
        //    {
        //        var C = this.Database.GetCollection(collection);
        //        var Q = Query.And(Query.EQ("name", name), Query.EQ("applicationName", applicationName));
        //        return C.Find(Q).SetSortOrder(SortBy.Descending("creationDate")).ToArray();
        //    }
        //    catch
        //    {
        //        return null;
        //    }
        //}

        //public BsonDocument GetDocumentByName(string name, string collection)
        //{
        //    try
        //    {
        //        var q = "{ $query: {name: \"" + name + "\", applicationName: \"" + applicationName + "\"}, $orderby: { creationDate: -1 }}";
        //        BsonDocument query = MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BsonDocument>(q);
        //        QueryDocument queryDoc = new QueryDocument(query);
        //        var C = this.Database.GetCollection(collection);
        //        var doc = C.FindOne(queryDoc);
        //        return doc;
        //    }
        //    catch
        //    {
        //        return null;
        //    }
        //}

        //public BsonDocument GetDocument(string query, string collection)
        //{
        //    try
        //    {
        //        BsonDocument q = MongoDB.Bson.Serialization.BsonSerializer.Deserialize<BsonDocument>(query);
        //        QueryDocument queryDoc = new QueryDocument(q);
        //        var C = this.Database.GetCollection(collection);
        //        var doc = C.FindOne(queryDoc);
        //        return doc;
        //    }
        //    catch
        //    {
        //        return null;
        //    }
        //}

        //public List<BsonDocument> GetAllDocuments(string collection)
        //{
        //    try
        //    {
        //        var match0 = new BsonDocument 
        //        {
        //            { 
        //                "$match",
        //                new BsonDocument
        //                {
        //                    { "applicationName", applicationName }
        //                }
        //            }
        //        };
        //        var sort = new BsonDocument
        //        {
        //            { "$sort",
        //                new BsonDocument
        //                {
        //                    { "creationDate", -1 }
        //                }
        //            }
        //        };
        //        var group = new BsonDocument 
        //        { 
        //            { "$group",
        //                new BsonDocument 
        //                    { 
        //                        {
        //                            "_id",
        //                            new BsonDocument 
        //                            { 
        //                                { 
        //                                    "name","$name"
        //                                } 
        //                            } 
        //                        }, 
        //                    } 
        //            } 
        //        };
        //        var C = this.Database.GetCollection(collection);
        //        var pipeline = new[] { match0, sort, group };
        //        var args = new AggregateArgs { Pipeline = pipeline, OutputMode = AggregateOutputMode.Inline };
        //        return C.Aggregate(args).ToList();
        //    }
        //    catch
        //    {
        //        return null;
        //    }
        //}

        //public static string OverwriteGridObject(string gridObjectAsString, string overwriteAsString, bool derhunziAgain = true)
        //{
        //    JObject JSONGrid = (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(gridObjectAsString);
        //    JArray magicGridColumns = (JArray)Newtonsoft.Json.JsonConvert.DeserializeObject(Utils.dehunzi(JSONGrid["MagicGridColumns"].ToString()));
        //    JSONGrid["MagicGridModel"] = (JArray)Newtonsoft.Json.JsonConvert.DeserializeObject(Utils.dehunzi(JSONGrid["MagicGridModel"].ToString()));
        //    JObject JSONOverwrite = (JObject)Newtonsoft.Json.JsonConvert.DeserializeObject(overwriteAsString);
        //    Utils.NewtonsoftRecursiveMerge(JSONGrid, JSONOverwrite);
        //    //JSONGrid.Merge(JSONOverwrite, new JsonMergeSettings { MergeArrayHandling = MergeArrayHandling.Merge }); //analog to the line above
        //    if (JSONOverwrite["MagicGridColumns"] != null)
        //    {
        //        JSONGrid["overwrittenColumns"] = JSONOverwrite["MagicGridColumns"];
        //        List<JToken> columnsToRemove = new List<JToken>();
        //        foreach (JToken token in magicGridColumns)
        //        {
        //            if (token["field"] != null && JSONOverwrite["MagicGridColumns"][token["field"].ToString()] != null)
        //            {
        //                if (JSONOverwrite["MagicGridColumns"][token["field"].ToString()]["hide"] != null && (bool)JSONOverwrite["MagicGridColumns"][token["field"].ToString()]["hide"] == true)
        //                    columnsToRemove.Add(token);
        //                else
        //                    Utils.NewtonsoftRecursiveMerge((JObject)token, (JObject)JSONOverwrite["MagicGridColumns"][token["field"].ToString()]);
        //                JSONOverwrite["MagicGridColumns"][token["field"].ToString()].Parent.Remove();
        //            }
        //        }
        //        columnsToRemove.ForEach(delegate (JToken token) {
        //            token.Remove();
        //        });
        //        foreach (KeyValuePair<string, JToken> token in (JObject)JSONOverwrite["MagicGridColumns"])
        //        {
        //            magicGridColumns.Add(token.Value);
        //        }
        //    }
        //    if (derhunziAgain)
        //    {
        //        JSONGrid["MagicGridColumns"] = Utils.derhunzi(magicGridColumns.ToString(Newtonsoft.Json.Formatting.None));
        //        JSONGrid["MagicGridModel"] = Utils.derhunzi(JSONGrid["MagicGridModel"].ToString(Newtonsoft.Json.Formatting.None));
        //    }
        //    else
        //        JSONGrid["MagicGridColumns"] = magicGridColumns;

        //    return JSONGrid.ToString();
        //}

        //public static void Overwrite(dynamic doc, IEnumerable<BsonElement> overwrite)
        //{
        //    foreach (BsonElement token in overwrite)
        //    {
        //        if (token.Value is System.Collections.IEnumerable)
        //        {
        //            if (doc[token.Name].GetType().Name == "JArray" && doc[int.Parse(token.Name)] != null)
        //                Overwrite(doc[int.Parse(token.Name)], (IEnumerable<BsonElement>)token);
        //            else if(doc[token.Name] != null)
        //                Overwrite(doc[token.Name], (IEnumerable<BsonElement>)token);
        //            else
        //                doc[token.Name] = token.Value.ToJson();
        //        }
        //        else
        //            doc[token.Name] = token.Value.ToJson();
        //    }
        //}

        //public static void DoOverwrites(BsonDocument doc, Dictionary<string, string> overwriteArguments)
        //{
        //    foreach (var v in doc)
        //    {
        //        if (v.Value.IsBsonDocument)
        //        {
        //            var subDoc = (BsonDocument)v.Value;
        //            if (subDoc.Contains("_overwriteBy"))
        //            {
        //                if (overwriteArguments.ContainsKey(subDoc["_overwriteBy"].ToString()) && subDoc.Contains(overwriteArguments[subDoc["_overwriteBy"].ToString()]))
        //                {
        //                     v.Value = (BsonValue)subDoc[overwriteArguments[subDoc["_overwriteBy"].ToString()].ToString()];
        //                }
        //                else if (subDoc.Contains("default"))
        //                {
        //                    v.Value = (BsonValue)subDoc["default"];
        //                }
        //                else v.Value = "";
        //            }
        //            else
        //                DoOverwrites((BsonDocument)v.Value, overwriteArguments);
        //        }
        //        else if (v.Value.IsBsonArray)
        //        {
        //            DoOverwrites((BsonArray)v.Value, overwriteArguments);
        //        }
        //    }
        //}

        //public static void DoOverwrites(BsonArray doc, Dictionary<string, string> overwriteArguments)
        //{
        //    foreach (var v in doc)
        //    {
        //        if (v.IsBsonDocument)
        //        {
        //            DoOverwrites((BsonDocument)v, overwriteArguments);
        //        }
        //        else if (v.IsBsonArray)
        //        {
        //            DoOverwrites((BsonArray)v, overwriteArguments);
        //        }
        //    }
        //}

    }
}
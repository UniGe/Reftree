using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace MagicFramework.Helpers
{
    public class HelpHandler 
    {
        #region models
        public class ModalHelp
        {
            public ModalHelp(DataRow dataRow)
            {
                this.ID = (int)dataRow["ID"];
                this.GUID = (Guid)dataRow["GUID"];
                this.Type = (string)dataRow["type"];
                this.Configuration = JObject.Parse((string)dataRow["Configuration"]);
                this.Description = (string)this.Configuration["description"];
            }

            public int ID { get; set; }
            public JObject Configuration { get; set; }
            public Guid GUID { get; set; }
            public string Description { get; set; }
            public string Type { get; set; }
        }

        public class HelpTarget
        {
            public int ID { get; set; }
            public string Type { get; set; }
        }

        public class HelpDBEntity
        {
            public int? ID { get; set; }
            public string object_id { get; set; }
            public string type { get; set; }
            public int? ModifiedUser_ID { get; set; }

        }
        public class HelpObject : HelpDBEntity
        {
            public HelpObject()
            {
                usedFor = new For();
                support = new List<List<Advice>>();
            }

            public HelpObject(DataRow dr) {
                string configuration = dr["Configuration"].ToString();
                var configurationObj = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(configuration);
                this.ID = int.Parse(dr["ID"].ToString());
                this.ModifiedUser_ID = dr.Field<int?>("ModifiedUser_ID"); 
                this.object_id = dr["object_id"].ToString();
                this.type = dr["type"].ToString();
                this.active = bool.Parse(configurationObj["active"].ToString());
                this.application_name = configurationObj["application_name"];
                this.description = configurationObj["description"];
                this.usedFor = Newtonsoft.Json.JsonConvert.DeserializeObject<For>(JsonConvert.SerializeObject(configurationObj["usedFor"]));
                this.support = Newtonsoft.Json.JsonConvert.DeserializeObject<List<List<Advice>>>(JsonConvert.SerializeObject(configurationObj["support"]));
            }

            public For usedFor { get; set; }
            public string description { get; set; }
            public bool active { get; set; }
            public List<List<Advice>> support { get; set; }
            public string application_name { get; set; }
        }

        public class For {
            public string type { get; set; }
            public string id { get; set; }
        }

        public sealed class Advice
        {
            public Advice()
            {
                //conditions = new Dictionary<string, object>();
                Id = Guid.NewGuid().ToString();
            }
            public string Id { get; set; }
            public string selector { get; set; }
            public List<Translation> translations { get; set; }
            public int? duration { get; set; }
            public string position { get; set; }
            public string showOn { get; set; }
            public string autoplay { get; set; }
            public int? width { get; set; }
            public int? remindXTimes { get; set; }
            public bool keepOnChecking { get; set; }
        }

        public class Translation
        {
            public string culture { get; set; }
            public string text { get; set; }
        }

        public class GotHelp 
        {
            public int User_ID { get; set; }
            public string advice_id { get; set; }
            public int remindedXTimes { get; set; }
            public int? ID { get; set; }

            public GotHelp() { }
            public GotHelp(DataRow dr) {
                this.ID = dr.Field<int>("ID"); 
                this.User_ID = dr.Field<int>("User_ID");
                this.advice_id = dr["advice_id"].ToString();
                this.remindedXTimes = dr.Field<int>("remindedXTimes");
            }
        }

        #endregion

        private string helpCollection = "Magic_Help";
        private string gotHelpCollection = "Magic_Help_UserStatus";

        public const int SAVE_SUCCESS = 0;
        public const int SAVE_DUPLICATE_KEY_ERROR = 1;
        public const int SAVE_OTHER_ERROR = 1;

        private readonly Dictionary<string, string> TARGET_HELP_OBJECT_ID_MAPPING =
        new Dictionary<string, string> {
            { "Function", "FunctionID" },
            { "Grid", "MagicGridID" },
            { "DashBoardTab", "ID" },
        };

        public HelpHandler()
        {
        }

        public HelpObject GetHelpObject(string type, string id)
        {
            Sql.DBQuery q = new Sql.DBQuery(@"SELECT TOP 1  [ID]
                                                          ,[type]
                                                          ,[object_id]
                                                          ,[Configuration]
                                                          ,[CreationDate]
                                                          ,[ModifiedDate]
                                                          ,[ModifiedUser_ID] FROM " + helpCollection);
            q.AddWhereCondition("[type] = @type", type);
            q.AddWhereCondition("[object_id] = @id", id);
            var ds = q.Execute();
            if (ds.Rows.Count == 0)
                return null;
            var ho = new HelpObject(ds.Rows[0]);

            if (ho.active)
                return ho;

            return null;
        }

        public DataTable GetHelpTarget(string helpGUID = null, bool isHelpGUIDNotNull = false, string name = null)
        {
            Sql.DBQuery q = new Sql.DBQuery(@"SELECT * FROM dbo.HelpObjects");
            if (isHelpGUIDNotNull)
            {
                q.AddWhereCondition("HelpGUID IS NOT NULL");
            }
            if (!string.IsNullOrEmpty(helpGUID))
            {
                q.AddWhereCondition("[HelpGUID] = @guid", helpGUID);
            }
            if (!string.IsNullOrEmpty(name))
            {
                q.AddWhereCondition("[Name] LIKE @name", $"%{name}%");
            }
            var t = q.Execute();
            var config = MFConfiguration.GetApplicationInstanceConfiguration();
            if (!string.Equals(config.TargetDBconn, config.MagicDBConnectionString))
            {
                q.connectionString = config.MagicDBConnectionString;
                q.BuildQuery();
                var t2 = q.Execute();
                if (t == null)
                {
                    return t2;
                }
                if (t2 == null)
                {
                    return t;
                }
                t = t.AsEnumerable()
                        .Union(t2.AsEnumerable())
                        .CopyToDataTable();
            }
            return t;
        }

        public ModalHelp GetModalHelpObject(string guid)
        {
            Sql.DBQuery q = new Sql.DBQuery(@"SELECT TOP 1  [ID]
                                                          ,[type]
                                                          ,[object_id]
                                                          ,[Configuration]
                                                          ,[CreationDate]
                                                          ,[ModifiedDate]
                                                          ,[GUID]
                                                          ,[ModifiedUser_ID] FROM " + helpCollection);
            q.AddWhereCondition("[GUID] = @guid", guid);
            var ds = q.Execute();
            if (ds.Rows.Count == 0)
                return null;
            return new ModalHelp(ds.Rows[0]);
        }

        public ModalHelp[] GetAllModalHelpObjects()
        {
            Sql.DBQuery q = new Sql.DBQuery(@"SELECT [ID]
                                                          ,[type]
                                                          ,[object_id]
                                                          ,[Configuration]
                                                          ,[CreationDate]
                                                          ,[ModifiedDate]
                                                          ,[GUID]
                                                          ,[ModifiedUser_ID] FROM " + helpCollection);
            q.AddWhereCondition("[type] = @type", "modal");
            var result = q.Execute();
            return ToModalHelp(result);
        }

        private ModalHelp[] ToModalHelp(DataTable t)
        {
            if (t == null)
            {
                return new ModalHelp[] { };
            }
            return t.AsEnumerable()
                .Select(r => new ModalHelp(r))
                .ToArray();
        }

        private DataSet GetAllHelpObjects()
        {
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            DataSet ds = dbutils.GetDataSet(@"SELECT [ID]
                                                          ,[type]
                                                          ,[object_id]
                                                          ,[Configuration]
                                                          ,[CreationDate]
                                                          ,[ModifiedDate]
                                                          ,[ModifiedUser_ID] FROM " + helpCollection);
            return ds;
        }

        public HelpObject[] GetAllTooltipHelpObjects()
        {
            Sql.DBQuery q = new Sql.DBQuery(@"SELECT [ID]
                                                          ,[type]
                                                          ,[object_id]
                                                          ,[Configuration]
                                                          ,[CreationDate]
                                                          ,[ModifiedDate]
                                                          ,[GUID]
                                                          ,[ModifiedUser_ID] FROM " + helpCollection);
            q.AddWhereCondition("[type] != @type", "modal");
            var result = q.Execute();
            if (result == null)
            {
                return new HelpObject[] { };
            }
            return result.AsEnumerable()
                .Select(r => new HelpObject(r))
                .ToArray();
        }

        public void HandleTargetObjects(Guid helpGuid, HelpTarget[] helpTargets)
        {
            var existingTargets = GetHelpTarget(helpGuid.ToString());
            if (existingTargets != null)
            {
                var existingEnumerable = existingTargets.AsEnumerable();
                var toDelete = existingEnumerable
                    .Where(r => !helpTargets.Where(t => t.Type.Equals((string)r["Type"]) && t.ID == (int)r["ID"]).Any());
                var toCreate = helpTargets
                    .Where(t => !existingEnumerable.Where(r => t.Type.Equals((string)r["Type"]) && t.ID == (int)r["ID"]).Any());
                SetTargetObjectNull(helpGuid, toDelete);
                SetTargetObject(helpGuid, toCreate);
            }
            else
            {
                SetTargetObject(helpGuid, helpTargets);
            }
        }

        public void SetTargetObjectNull(Guid helpGuid, EnumerableRowCollection<DataRow> targetObjects)
        {
            foreach (var group in targetObjects.GroupBy(r => (string)r["Type"]))
            {
                string targetObjectType = group.Key;
                if (!TARGET_HELP_OBJECT_ID_MAPPING.ContainsKey(targetObjectType))
                {
                    continue;
                }

                int[] ids = group.Select(r => (int)r["ID"]).ToArray();
                string primaryKeyColumn = TARGET_HELP_OBJECT_ID_MAPPING[targetObjectType];
                Sql.DBQuery q = new Sql.DBQuery($"UPDATE dbo.Magic_{targetObjectType}s SET HelpGUID = null");
                if (!targetObjectType.Equals("DashBoardTab"))
                {
                    q.connectionString = MFConfiguration.GetApplicationInstanceConfiguration().MagicDBConnectionString;
                }
                q.AddWhereCondition($"[{primaryKeyColumn}] IN (@id)", ids);
                q.AddWhereCondition("[HelpGUID] = @helpGUID", helpGuid.ToString());
                q.ExecuteNonQuery();
            }
        }

        public void SetTargetObject(Guid helpGuid, IEnumerable<HelpTarget> targetObjects)
        {
            foreach (var group in targetObjects.GroupBy(r => r.Type))
            {
                string targetObjectType = group.Key;
                if (!TARGET_HELP_OBJECT_ID_MAPPING.ContainsKey(targetObjectType))
                {
                    continue;
                }

                int[] ids = group.Select(r => r.ID).ToArray();
                string primaryKeyColumn = TARGET_HELP_OBJECT_ID_MAPPING[targetObjectType];
                Sql.DBQuery q = new Sql.DBQuery($"UPDATE dbo.Magic_{targetObjectType}s");
                if (!targetObjectType.Equals("DashBoardTab"))
                {
                    q.connectionString = MFConfiguration.GetApplicationInstanceConfiguration().MagicDBConnectionString;
                }
                q.AddParameterizedPart($"SET HelpGUID = @helpGUID WHERE [{ primaryKeyColumn}] IN(@id)", new List<object> { helpGuid.ToString(), ids });
                q.ExecuteNonQuery();
            }
        }

        public dynamic SaveHelpObject(dynamic h)
        {
            bool isupdate = h.ID == null ? false : true;
            string query = isupdate ? 
                            @"UPDATE " + helpCollection + 
                            @" set Configuration = @config, type=@type, object_id =@objectid,ModifiedUser_ID=@userid,ModifiedDate=getdate() 
                            WHERE ID=@ID_; 
                            SELECT @ID_ as ID;"
            : @"INSERT INTO " + helpCollection + @"
                                   ([type]
                                   ,[object_id]
                                   ,[Configuration]
                                   ,[ModifiedUser_ID])
                             VALUES
                                   (@type
                                   ,@objectid
                                   ,@config
                                   ,@userid); 
                            SELECT SCOPE_IDENTITY() AS ID;";

            try
            {

                using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
                {
                    DataSet Idds = new DataSet();
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        cmd.Connection.Open();
                        cmd.Parameters.Add(new SqlParameter("@type", (string)h.usedFor.type));
                        cmd.Parameters.Add(new SqlParameter("@objectid", (string)h.usedFor.id));
                        cmd.Parameters.Add(new SqlParameter("@config",JsonConvert.SerializeObject(h)));
                        cmd.Parameters.Add(new SqlParameter("@userid", SessionHandler.IdUser));
                        if (isupdate)
                            cmd.Parameters.Add(new SqlParameter("@ID_", (int)h.ID));

                        DataTable table = new DataTable();
                        table.Load(cmd.ExecuteReader());
                        Idds.Tables.Add(table);
                        cmd.Connection.Close();
                    }

                    h.ID = int.Parse(Idds.Tables[0].Rows[0]["ID"].ToString());

                    if (h.targets != null)
                    {
                        Sql.DBQuery q = new Sql.DBQuery(@"SELECT [GUID] FROM " + helpCollection);
                        q.AddWhereCondition("ID = @id", (int)h.ID);
                        var r = q.Execute();
                        HandleTargetObjects((Guid)r.Rows[0]["GUID"], ((JArray)h.targets).ToObject<HelpTarget[]>());
                    }
                }
                return h;
            }
            catch (Exception e)
            {
                MFLog.LogInFile("MagicFramework.Helpers.MongoHelpHandler: Error while saving Object: Application: " + h.application_name + " Id: " + h.usedFor.id + " Type: " + h.usedFor.type + " Message: " + e.Message, MFLog.logtypes.ERROR);
                throw e;
            }
        }

        public void DeleteHelpObject(string id)
        {
            string query = @"DELETE " + helpCollection +
                           " WHERE ID=@ID;";
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(new SqlParameter("@ID",int.Parse(id)));
                    cmd.ExecuteNonQuery();
                    cmd.Connection.Close();
                }

            }
        }

        public void GotHelpFor(string username, string adviceId, int remindedXTimes = 1)
        {
            var help = this.GotAlreadyHelpFor(username, new List<string>() { adviceId }).FirstOrDefault();
            if (help == null)
                help = new GotHelp { User_ID = SessionHandler.IdUser, advice_id = adviceId, remindedXTimes = remindedXTimes };
            else
                help.remindedXTimes += remindedXTimes;

            bool isupdate = help.ID == null ? false : true;
            string query = isupdate ?
                            @"UPDATE " + gotHelpCollection +
                            @" set remindedXTimes = @remindedXTimes, ModifiedDate=getdate() 
                            WHERE ID=@ID_;"
            : @"INSERT INTO " + gotHelpCollection + @"
                                   ([advice_id]
                                  ,[User_ID]
                                  ,[remindedXTimes])
                             VALUES
                                   (@adviceId
                                   ,@userid
                                    ,@remindedXTimes); ";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(new SqlParameter("@adviceId", help.advice_id));
                    cmd.Parameters.Add(new SqlParameter("@remindedXTimes", help.remindedXTimes));
                    cmd.Parameters.Add(new SqlParameter("@userid", SessionHandler.IdUser));
                    if (isupdate)
                        cmd.Parameters.Add(new SqlParameter("@ID_", help.ID));
                    cmd.ExecuteNonQuery();
                    cmd.Connection.Close();
                }
            }
        }

        public List<GotHelp> GotAlreadyHelpFor(string username, List<string> adviceIds)
        {
            List<GotHelp> ghs = new List<GotHelp>();
            string query = @"SELECT * FROM " + gotHelpCollection +
                          " WHERE advice_id in ({0});";

            List<string> listForIn = new List<string>();
            for (var i = 0; i< adviceIds.Count; i++)
            {
                listForIn.Add("@advice_" + i.ToString());
            }
            query = query.Replace("{0}", String.Join(",", listForIn));

            DataSet advicesds = new DataSet();
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Connection.Open();
                    for (var i= 0;i < listForIn.Count;i++) 
                        cmd.Parameters.Add(new SqlParameter(listForIn.ElementAt(i),adviceIds.ElementAt(i)));
                    DataTable table = new DataTable();
                    table.Load(cmd.ExecuteReader());
                    advicesds.Tables.Add(table);
                    cmd.Connection.Close();
                }

            }

            foreach (DataRow dr in advicesds.Tables[0].Rows)
            {
                ghs.Add(new GotHelp(dr));
            }
            return ghs;
        }
    }
}
using System;
using System.Collections.Generic;
using System.Web.Http;
using System.Net.Http;
using System.Net;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;
using MagicFramework.Helpers.Sql;
using Newtonsoft.Json.Linq;
using System.Linq.Dynamic;
using System.Data;
using System.Data.SqlClient;
using Newtonsoft.Json;

namespace MagicFramework.Controllers
{
    public class DocumentRepositoryController : ApiController
    {

        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
        private string customparamdefault = ApplicationSettingsManager.GetDefaultCustomJsonParameter();
        private MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());

        private string AddVisibility(string condition, List<object> parameters, int docrepoid = -1)
        {
            condition += @" AND d.Parent_ID is null AND
            (
                d.CreatorUser_ID = @creator
	            OR (d.IsPublic = 1
		            AND
		            d.UserGroupVisibility_ID = @visibility) 
                OR  (CASE  drt.Code
                        WHEN 'GM' THEN CASE WHEN drr.ID is not null then 1 else 0 end 
                    ELSE 1 END) = 1
            )";
            parameters.Add(SessionHandler.IdUser);
            parameters.Add(SessionHandler.UserVisibilityGroup);

            parameters.Add(docrepoid);
            return condition;
        }


        [HttpPost]
        public Models.Response GetDocumentRepository(dynamic data)
        {
            return mfApi.GetDocumentRepository(data.BusinessObjectType.Value, data.BusinessObject_ID.Value, data.TransmissionMode.Value);
        }

        [HttpPost]
        public Models.Response GetDocumentRepositoryTags(dynamic data)
        {
            return mfApi.GetDocumentRepositoryTags(data.Name.Value);
        }

        [HttpPost]
        public Models.Response GetBusinessObjectTypes(dynamic data)
        {
            return mfApi.GetBusinessObjectTypes(data.IDs);
        }

        [HttpPost]
        public Models.Response GetDocumentRepositoryType(dynamic data)
        {
            return mfApi.GetDocumentRepositoryType(data.Description.Value);
        }

        /// <summary>
        /// Get workflow activities for a certain workflow
        /// </summary>
        /// <param name="id">Workflow_ID</param>
        /// <returns>Response instance</returns>
        public Models.Response GetWorkflowActivities(int id)
        {
            string table = "dbo.Magic_WorkFlowActivities";
            //generic request for credential related tables
            string order = "8";
            string where = "isnull(Active,0)<>0 AND Workflow_ID =" + id.ToString();

            var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(table, ApplicationSettingsManager.GetVisibilityField());
            var dbres = readercmd.getGenericControllerReader(table, 0, 0, 100000, ApplicationSettingsManager.GetDefaultCustomJsonParameter(), where, order, 0, null, null, false, null, null);

            var result = dbres.table.AsEnumerable().ToArray();
            if (result.Length > 0)
                result = result.Take(1).ToArray();
            return new Models.Response(result, dbres.counter);
        }
        [HttpPost]
        public Models.Response GetWorkflowPrecedences(dynamic data)
        {
            return mfApi.GetWorkflowPrecedences(data.table.Value, data.Workflow_ID.Value);
        }

        [HttpGet]
        public Models.Response GetWorkflows()
        {
            return mfApi.GetWorkflows();
        }

        [HttpPost]
        public Models.Response GetSystemMessages(dynamic data)
        {
            return mfApi.GetSystemMessages(data.templateCodes);
        }

        [HttpGet]
        public HttpResponseMessage GetMessagesForBO(
            string BOId = null
            , string BOType = null
            , string messageType = null
            , string q = null
            , string LikeBOType = null
            , bool getBODescription = false
            , string BODescription = null
        )
        {
            try
            {
                var query = new DBQuery(@"
                SELECT
                    d.[ID]
                    , d.[BusinessObject_ID]
                    , d.[BusinessObjectType]
                    , isnull(d.[TransmissionMode],drt.Description) as TransmissionMode
                    , d.[InsertionDate]
                    , d.[DocumentJSONTags]
                    , CASE WHEN drt.Code = 'GM' then dbo.Magic_GetGridMessageThread(d.ID) else  d.[DocumentFile] end as DocumentFile
                    , d.[DueDate]
                    , ISNULL(dr.[is_read], CAST(0 AS bit)) AS is_read
                    , dr.[read_at]
                    , CAST(
			                CASE d.CreatorUser_ID
				                WHEN " + SessionHandler.IdUser + @"
					                THEN 1
				                ELSE 0
			                END
			                AS bit) AS is_owner
                    ,CASE WHEN drt.Code = 'GM' then  dbo.Magic_GetGridMessageReceivers(d.ID) else '[]' end as ThreadMembers
                FROM Magic_DocumentRepository AS d", "d.[InsertionDate] DESC");
                                string sql = @"
                LEFT JOIN Magic_DocumentRepositoryReadConfirmation AS dr
                    ON d.ID = dr.document_repository_id
                        AND dr.user_id = @userId
                LEFT JOIN Magic_DocumentRepositoryUsersRestriction drr
                on drr.DocumentRepository_ID = d.ID and drr.User_ID =  " + SessionHandler.IdUser + @"
                INNER JOIN Magic_DocumentRepositoryType drt
                on drt.ID = d.DocumentType_ID
                WHERE
                (
                   1=1 ";
                List<object> parameters = new List<object>();
                parameters.Add(SessionHandler.IdUser);
                if (BOId != null)
                {
                    sql += " AND [BusinessObject_ID] = @BOId";
                    parameters.Add(BOId);
                }
                if (BOType != null)
                {
                    sql += " AND [BusinessObjectType] = @BOType";
                    parameters.Add(BOType);
                }
                if (LikeBOType != null)
                {
                    sql += " AND [BusinessObjectType] LIKE @LikeBOType";
                    parameters.Add("%" + LikeBOType + "%");
                }
                if (messageType != null)
                {
                    sql += " AND [TransmissionMode] = @messageType";
                    parameters.Add(messageType);
                }
                if (q != null)
                {
                    sql += " AND ([DocumentFile] LIKE @q1 OR [DocumentJSONTags] LIKE @q2)";
                    parameters.Add("%" + q + "%");
                    parameters.Add("%" + q + "%");
                }
                sql += ")";
                sql = AddVisibility(sql, parameters);
                query.connectionString = DBConnectionManager.GetConnectionFor("Magic_DocumentRepository");
                query.orderBy = "InsertionDate DESC";
                query.AddParameterizedPart(sql, parameters);
                var result = query.Execute();
                if (getBODescription)
                {
                    result = AddBODesctiption(result, BODescription);
                }
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK
                    ,
                    Content = new StringContent(result != null ? JsonConvert.SerializeObject(result) : "[]")
                };
            }
            catch (Exception e)
            {
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.InternalServerError
                    ,
                    Content = new StringContent(e.ToString())
                };
            }
        }

        internal DataTable AddBODesctiption(DataTable documents, string filter = null)
        {
            if (documents == null)
            {
                return documents;
            }
            // get docs with defined BOType and BOID
            List<DataRow> docsWithBo = documents.AsEnumerable()
                .Where(d =>
                    d["BusinessObjectType"].GetType() != typeof(DBNull)
                    && d["BusinessObject_ID"].GetType() != typeof(DBNull)
                )
                .ToList();

            if (!docsWithBo.Any())
            {
                return documents;
            }

            // query for BO description queries
            string connectionString = DBConnectionManager.GetConnectionFor("Magic_BusinessObjectTypes");
            var queriesQuery = new DBQuery(@"SELECT
                BusinessObjectType
                , BODescriptionQuery
            FROM Magic_BusinessObjectTypes");
            queriesQuery.AddWhereCondition("BODescriptionQuery IS NOT NULL");
            queriesQuery.AddWhereCondition("BusinessObjectType IN ('')", docsWithBo.GroupBy(d => d["BusinessObjectType"]).Select(d => (string)d.Key).ToList());
            queriesQuery.connectionString = connectionString;
            var queries = queriesQuery.Execute().AsEnumerable();

            if (!queries.Any())
            {
                return documents;
            }

            documents.Columns.Add("BODescription", typeof(String));
            foreach (DataRow row in docsWithBo)
            {
                // get query for description
                var queryRow = queries.Where(d => (string)d["BusinessObjectType"] == (string)row["BusinessObjectType"]).FirstOrDefault();
                if (queryRow == null)
                {
                    continue;
                }
                string query = (string)queryRow["BODescriptionQuery"];

                // get BODescription
                var descriptionQuery = new DBQuery(string.Format(query.Replace("@", ""), row["BusinessObject_ID"]));
                descriptionQuery.connectionString = connectionString;
                var description = descriptionQuery.Execute();
                if (description != null)
                {
                    row.BeginEdit();
                    row["BODescription"] = description.Rows[0]["outvar"];
                    row.EndEdit();
                }
            }

            if (filter != null)
            {
                filter = filter.ToLower();
                var filteredDocuments = documents.AsEnumerable()
                    .Where(d => d["BODescription"].GetType() != typeof(DBNull) && ((string)d["BODescription"]).ToLower().Contains(filter));
                if (filteredDocuments.Any())
                {
                    return filteredDocuments.CopyToDataTable();
                }
                return null;
            }

            return documents;
        }

        [HttpPost]
        public HttpResponseMessage MarkRead(dynamic data)
        {
            try
            {
                var writer = new DBWriter(
                    "Magic_DocumentRepositoryReadConfirmation"
                    , new Dictionary<string, object> {
                        { "user_id", SessionHandler.IdUser }
                        , { "document_repository_id", (int)data.ID }
                    });
                writer.connectionString = DBConnectionManager.GetMagicConnection();
                writer.retrieveIdOnInsert = false;
                writer.Write();
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK
                };
            }
            catch(Exception e)
            {
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.InternalServerError
                    , Content = new StringContent(e.ToString())
                };
            }
        }

        [HttpGet]
        public HttpResponseMessage GetBoTypes()
        {
            try
            {
                var query = new DBQuery(@"
SELECT [BusinessObjectType] as id
      ,[Description] as description
    FROM [Magic_BusinessObjectTypes]
    WHERE active = 1 AND [VisibleForBOSelector] = 1
    ORDER BY Description
");
                query.connectionString = DBConnectionManager.GetMagicConnection();
                List<object> parameters = new List<object>();
                var result = query.Execute();
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK
                    , Content = new StringContent(JsonConvert.SerializeObject(result))
                };
            }
            catch(Exception e)
            {
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.InternalServerError
                    , Content = new StringContent(e.ToString())
                };
            }
        }

        [HttpGet]
        public HttpResponseMessage Count(string BOIds, string BOType)
        {
            try
            {
                var query = new DBQuery(@"
SELECT
    count(*) as total_messages
    , sum(ISNULL(CAST(is_read AS int), 0)) as read_messages
	, d.BusinessObject_ID
FROM Magic_DocumentRepository AS d
LEFT JOIN Magic_DocumentRepositoryReadConfirmation AS dr
    ON d.ID = dr.document_repository_id
                ");
                string sql = @"AND
dr.user_id = @userId
 LEFT JOIN Magic_DocumentRepositoryUsersRestriction drr
                on drr.DocumentRepository_ID = d.ID and drr.User_ID = @userId_
                INNER JOIN Magic_DocumentRepositoryType drt
                on drt.ID = d.DocumentType_ID
WHERE
(
    BusinessObjectType = @type
    AND BusinessObject_ID in @ids
)";
                query.connectionString = DBConnectionManager.GetConnectionFor("Magic_DocumentRepository");
                List<object> parameters = new List<object>();
                parameters.Add(SessionHandler.IdUser);
                parameters.Add(SessionHandler.IdUser);
                parameters.Add(BOType);
                parameters.Add(BOIds.Split(','));
                sql = AddVisibility(sql, parameters);
                query.SetGroupBy("BusinessObjectType, BusinessObject_ID");
                query.AddParameterizedPart(sql, parameters);
                var result = query.Execute();
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK
                    ,
                    Content = new StringContent(JsonConvert.SerializeObject(result))
                };
            }
            catch (Exception e)
            {
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.InternalServerError
                    ,
                    Content = new StringContent(e.ToString())
                };
            }
        }

        [HttpGet]
        public HttpResponseMessage Delete(int documentId)
        {
            try
            {
                var query = new DBQuery(@"
SELECT
    ID
    FROM Magic_DocumentRepository
");
                query.AddWhereCondition("[CreatorUser_ID] = @id", SessionHandler.IdUser);
                query.AddWhereCondition("[ID] = @docId", documentId);
                if(query.Execute() == null)
                {
                    return new HttpResponseMessage
                    {
                        StatusCode = HttpStatusCode.Forbidden,
                        Content = new StringContent("no permission to delete file"),
                    };
                }
                query = new DBQuery(@"
DELETE
    Magic_DocumentRepository
");
                query.AddWhereCondition("[ID] = @docId", documentId);
                query.ExecuteNonQuery();
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK
                };
            }
            catch (Exception e)
            {
                return new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.InternalServerError
                    ,
                    Content = new StringContent(e.ToString())
                };
            }
        }

        // POST api/<controller>
        /// <summary>
        /// Opera il Count di chat e messaggi di un certo BO alla pressione del "tasto" history
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage GetCount(dynamic data)
        {
            try
            {
                int bOId = (int)data.bOId;
                string bOType = (string)data.bOType;
                var bos = (from dr in _context.Magic_DocumentRepository
                           join dt in _context.Magic_DocumentRepositoryType on dr.DocumentType_ID equals dt.ID
                           where (dr.UserGroupVisibility_ID == SessionHandler.UserVisibilityGroup && dr.IsPublic == true || dr.CreatorUser_ID == SessionHandler.IdUser && dr.IsPublic == false)
                           && dr.BusinessObject_ID.Equals(bOId) && dr.BusinessObjectType.Equals(bOType)
                           group dt by dt.Code into g
                           select new { Code = g.Key, Count = g.Count() }).ToList();
                return Request.CreateResponse(HttpStatusCode.OK, Newtonsoft.Json.JsonConvert.SerializeObject(bos));
            }
            catch
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest);
            }
            
        }
        /// <summary>
        /// Popola la lista di mail / chats che lo user puo' vedere nella history
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        public Models.Response GetWithFilter(dynamic data)
        {
            if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
            {
                throw new Exception("GetWithFilter disabled. Use Select method of GenericSQLCommandController instead");
            }

            try
            {
                string table = data.table;
                string order = data.order;
                string where = data.where;
                if (where.Contains("{ugvi}"))
                    where = where.Replace("{ugvi}", SessionHandler.UserVisibilityGroup.ToString());
                if (where.Contains("{idUser}"))
                    where = where.Replace("{idUser}", SessionHandler.IdUser.ToString());
                string customstoredprocedure = data.storedprocedure;
                string jsonparam = customparamdefault;
                if (customstoredprocedure != null)
                    jsonparam = "{read:{ type:\"StoredProcedure\",Definition:\"" + customstoredprocedure + "\"  }}";
                //Essendo il campo di visibilita' su Magic_DocumentRepository UserGroupVisibility_ID by design devo imporlo da client con un placeholder senza leggere da config (es. per RefTree contiene AREVIS_ID come valori ma si chiama sempre UserGroup...)
                var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(table, "aaa");
                var dbres = readercmd.getGenericControllerReader(table, 0, 0, 100000, jsonparam, where, order, 0, null, null, false, null, null);

                var result = dbres.table.AsEnumerable().ToArray();
                if (result.Length > 0)
                    result = result.Take(1).ToArray();
                return new Models.Response(result, dbres.counter);

            }
            catch (Exception ex)
            {
                return new MagicFramework.Models.Response(ex.Message);
            }

        }
        /// <summary>
        /// Adds notifications, Documents for one or more boIds
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage AddGridMessage(dynamic data)
        {
            try
            {
                var dbutils = new DatabaseCommandUtils();
                dbutils.GetDataSetFromStoredProcedure("dbo.Magic_GridMessageAdd", data);
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception e)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, e.Message);
            }

        }
        /// <summary>
        /// Adds notifications, Documents for one or more boIds
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage ReplyToGridMessage(dynamic data)
        {
            try
            {
                var dbutils = new DatabaseCommandUtils();
                dbutils.GetDataSetFromStoredProcedure("dbo.Magic_GridMessageReply", data);
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception e)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, e.Message);
            }

        }
        [HttpPost]
        public HttpResponseMessage AddNotes(dynamic data)
        {
            try
            {
                string note = (string)data.note;
                DateTime? dueDate = (DateTime?)data.dueDate;
                bool isPrivate = (bool)data.isPrivate;
                string BOType = (string)data.BOType;

                if (data.BOIds != null)
                {
                    JArray BOIds = (JArray)data.BOIds;
                    int DocumentType_ID = _context.Magic_DocumentRepositoryType.Where(x => x.Code.Equals("ME")).FirstOrDefault().ID;
                    List<Data.Magic_DocumentRepository> BOs = new List<Data.Magic_DocumentRepository>();

                    foreach (var BOId in BOIds)
                    {
                        BOs.Add(new Data.Magic_DocumentRepository
                        {
                            BusinessObjectType = BOType,
                            BusinessObject_ID = (string)BOId,
                            DocumentFile = note,
                            DocumentType_ID = DocumentType_ID,
                            CreatorUser_ID = SessionHandler.IdUser,
                            UserGroupVisibility_ID = SessionHandler.UserVisibilityGroup,
                            InsertionDate = DateTime.Now,
                            TransmissionMode = "memo",
                            DueDate = dueDate,
                            IsPublic = !isPrivate,
                            DocumentJSONTags = data.DocumentJSONTags != null ? Newtonsoft.Json.JsonConvert.SerializeObject(data.DocumentJSONTags) : null
                        });
                    }
                    _context.Magic_DocumentRepository.InsertAllOnSubmit(BOs);
                    _context.SubmitChanges();
                    _context.Connection.Close();
                    return Request.CreateResponse(HttpStatusCode.OK, BOs);
                }
                else if (data.Id != null)
                {
                    int Id = (int)data.Id;
                    Data.Magic_DocumentRepository BO = _context.Magic_DocumentRepository.Where(x => x.ID.Equals(Id) && x.TransmissionMode.Equals("memo") && x.CreatorUser_ID.Equals(SessionHandler.IdUser)).FirstOrDefault();
                    BO.DocumentFile = note;
                    BO.DueDate = dueDate;
                    BO.IsPublic = !isPrivate;
                    BO.BusinessObject_ID = data.BOId ?? BO.BusinessObject_ID;
                    BO.BusinessObjectType = data.BOType ?? BO.BusinessObjectType;
                    BO.DocumentJSONTags = data.DocumentJSONTags != null ? Newtonsoft.Json.JsonConvert.SerializeObject(data.DocumentJSONTags) : null;
                    _context.SubmitChanges();
                }

                if (data.DocumentJSONTags != null)
                    this.saveTags(data.DocumentJSONTags);

                _context.Connection.Close();
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch(Exception e)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, e.Message);
            }

        }

        private void saveTags(JArray tags)
        {
            foreach (string tag in tags)
            {
                try
                {
                    var writer = new Helpers.Sql.DBWriter("dbo.Magic_DocumentRepositoryTags", new Dictionary<string, object>() {
                        { "Name",  tag },
                        { "CreatorUser_ID",  SessionHandler.IdUser }
                    });
                    writer.connectionString = DBConnectionManager.GetTargetConnection();
                    writer.retrieveIdOnInsert = false;
                    writer.Write();
                }
                catch (Exception e) { }
            }
        }

        [HttpPost]
        public HttpResponseMessage DeleteNote(int id)
        {
            try
            {
                Data.Magic_DocumentRepository BO = _context.Magic_DocumentRepository.Where(x => x.ID.Equals(id) && x.TransmissionMode.Equals("memo") && x.CreatorUser_ID.Equals(SessionHandler.IdUser)).FirstOrDefault();
                _context.Magic_DocumentRepository.DeleteOnSubmit(BO);
                _context.SubmitChanges();
                _context.Connection.Close();
                return Request.CreateResponse(HttpStatusCode.OK);
            }
            catch (Exception e)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, e.Message);
            }
        }

        [HttpGet]
        public HttpResponseMessage GetNotes()
        {
            try
            {
                List<Data.Magic_DocumentRepository> BOs = _context.Magic_DocumentRepository.Where(x =>
                    x.TransmissionMode.Equals("memo") &&
                    (x.CreatorUser_ID.Equals(SessionHandler.IdUser) && x.IsPublic.Equals(false) ||
                    x.UserGroupVisibility_ID.Equals(SessionHandler.UserVisibilityGroup) && x.IsPublic.Equals(true)))
                    .ToList();

                JArray result = new JArray();
                string connection = DBConnectionManager.GetTargetConnection();
                Dictionary<string, string> BOTypes = new Dictionary<string, string>();
                using (SqlConnection PubsConn = new SqlConnection(connection))
                {
                    PubsConn.Open();
                    using (SqlCommand CMD = new SqlCommand("SELECT BusinessObjectType, BODescriptionQuery FROM dbo.Magic_BusinessObjectTypes", PubsConn))
                    {
                        using (IDataReader reader = CMD.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                BOTypes.Add(reader["BusinessObjectType"].ToString(), reader["BODescriptionQuery"].ToString());
                            }
                        }
                    }

                    foreach (Data.Magic_DocumentRepository BO in BOs)
                    {
                        if (BOTypes.ContainsKey(BO.BusinessObjectType))
                        {
                            using (SqlCommand CMD = new SqlCommand(string.Format(BOTypes[BO.BusinessObjectType].Replace("@", ""), BO.BusinessObject_ID), PubsConn))
                            {
                                using (IDataReader reader = CMD.ExecuteReader())
                                {
                                    while (reader.Read())
                                    {
                                        JObject bo = JObject.FromObject(BO);
                                        bo.Add("BusinessObjectDescription", reader["outvar"].ToString());
                                        string creator = null;
                                        if (BO.CreatorUser_ID != SessionHandler.IdUser)
                                        {
                                            Data.Magic_Mmb_Users user = _context.Magic_Mmb_Users.Where(u => u.UserID.Equals(BO.CreatorUser_ID)).FirstOrDefault();
                                            if (user != null)
                                                creator = user.FirstName + " " + user.LastName;
                                        }
                                        bo.Add("Creator", creator);
                                        result.Add(bo);
                                    }
                                }
                            }
                        }
                    }
                    PubsConn.Close();
                }

                _context.Connection.Close();
                return Request.CreateResponse(HttpStatusCode.OK, result);
            }
            catch (Exception e)
            {
                return Request.CreateResponse(HttpStatusCode.BadRequest, e.Message);
            }
        }
    }
}
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
using System.Data;
using System.IO;
using System.Net.Http.Headers;
using System.Text;
using MagicFramework.Models;
using System.Diagnostics;
using System.Xml;
using MagicFramework.Helpers;
using Newtonsoft.Json.Linq;
using MagicFramework.MemberShip;
using MagicFramework.MemberShip.Filters;
using RazorEngine.Compilation.ImpromptuInterface.Dynamic;
using System.Web.Configuration;
using MagicFramework.Controllers.ActionFilters;
using Newtonsoft.Json;
using MagicFramework.Helpers.Sql;
using OpenXmlPowerTools;
using DevExpress.Data.Helpers;

namespace MagicFramework.Controllers
{
    public class GenericSqlCommandController : ApiController
    {
        private string exportdirectory = System.Configuration.ConfigurationManager.AppSettings["exportdirectory"];
        private string groupVisibilityField = ApplicationSettingsManager.GetVisibilityField();
        private string attributesGroupListField = ApplicationSettingsManager.GetBOAttributeGroupVisibilityField();
        private string customparamdefault = ApplicationSettingsManager.GetDefaultCustomJsonParameter();
        private bool compressToXMLpars = ApplicationSettingsManager.GetCompressInputparameterstoXML();
        private const string genericError = "Problems Querying the database";
        private const string PW_VEIL = "***";


        public static bool IsManagedException(Exception ex, out string content)
        {
            string message = ex.Message;
            JObject o;
            if (ex.Message.StartsWith("{") && ex.Message.EndsWith("}"))
            {
                o = JObject.Parse(ex.Message);
                if (o["type"] != null && o["type"].ToString() == "MANAGED_EXCEPTION")
                {
                    content = o["content"].ToString();
                    return true;
                }
            }
            content = ex.Message;
            return false;
        }
        //is POSTI and read methods
        public static Models.Response ManageErrors(Exception ex)
        {
            if (SessionHandler.UserIsDeveloper)
                return new MagicFramework.Models.Response(ex.Message);
            else
            {
                MFLog.LogInFile(ex);
                string content = "";
                bool ismanaged = IsManagedException(ex, out content);
                if (!ismanaged) 
                    return new MagicFramework.Models.Response(genericError);
                else
                    return new MagicFramework.Models.Response(content);
            }
        }
        //is for buttons and write methods
        private HttpResponseMessage ManageWriteErrors(Exception ex) {
            HttpResponseMessage response = new HttpResponseMessage();
            if (SessionHandler.UserIsDeveloper)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(ex.Message);
                return response;
            }

            MFLog.LogInFile(ex);
            string content = "";
            bool ismanaged = IsManagedException(ex, out content);
            if (!ismanaged)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(genericError);
                return response;
            }
            else
            {
                response.StatusCode = HttpStatusCode.BadRequest;
                response.Content = new StringContent(content);
                return response;
            }

        }
        /// <summary>
        /// This GET method returns the translated messages contained in Magic_Messages
        /// </summary>
        /// <param name="id">"id" is the message code. the param name is id 'cause the API strategy is defined like this in global.asax</param>
        /// <returns></returns>
        [HttpGet]
        public HttpResponseMessage GetMessagesFromDB(string id)
        {
            var response = new HttpResponseMessage();
            try
            {
                string themessagetext = Helpers.Utils.getUIMessage(id);
                response.StatusCode = HttpStatusCode.OK;
                response.Content = new StringContent(themessagetext == null ? id : themessagetext);
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(String.Format("Error during message load...{0}", ex.Message));
            }
            return response;
        }
        private void checkExportRights(Models.Request request)
        {
            string message = String.Empty;
            var dbutils = new DatabaseCommandUtils();
            string storedprocedure = String.Empty;
            if (String.IsNullOrEmpty(ConfigurationManager.AppSettings["checkUserRightsStoredProcedure"]))
            {
                return;
            }
            else
            {
                storedprocedure = ConfigurationManager.AppSettings["checkUserRightsStoredProcedure"].ToString();
            }
            if (String.IsNullOrEmpty(storedprocedure))
                return;
            bool isauthorized = dbutils.checkGridRights(request.GridName, "export", request.EntityName, storedprocedure, JObject.FromObject(new { GridName= request.GridName }), out message);
            if (!isauthorized)
                throw new ArgumentException("SP_BLK_EXP:" + message);
        }
        [HttpPost]
        public HttpResponseMessage ExportTofile(ExportSpecs data)
        {
           //tracking init
            bool trackOperation = ApplicationSettingsManager.trackFiles();
            Newtonsoft.Json.Linq.JObject fileInfo = new Newtonsoft.Json.Linq.JObject();
            fileInfo["request"] = new Newtonsoft.Json.Linq.JObject();
            fileInfo["request"]["layer"] = data.layer;
            fileInfo["request"]["filter"] = new Newtonsoft.Json.Linq.JRaw(Newtonsoft.Json.JsonConvert.SerializeObject(data.filter));
            fileInfo["request"]["gridname"] = data.gridname;
            //init end

            HttpResponseMessage result = new HttpResponseMessage(HttpStatusCode.OK);
            try
            {
                Models.Request request = new Models.Request();

                request.Columns = data.select.Where(c => String.IsNullOrEmpty(c) == false).Distinct().ToArray();

                if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
                    request.Columns = request.Columns.Select(c => RequestParser.GetField(c)).ToArray();

                request.GridName = data.gridname;
                request.skip = 0;
                request.take = 10000000;
                request.page = 1;
                request.layerID = data.layer;
                request.filter = data.filter;
                request.sort = data.sort;
                int functionid = -1;
                request.functionID= functionid;
                if (!String.IsNullOrEmpty(data.functionID))
                    request.functionID = int.Parse(data.functionID);

                String wherecondition = "1=1";
                Helpers.RequestParser rp = new Helpers.RequestParser(request);

                //is user authorized to export ? 
                checkExportRights(request);


                if (rp.req.DataSourceCustomParam == null) // uso il metodo generico di export
                {
                    if (compressToXMLpars)
                        request.DataSourceCustomParam = "{ export: { Definition:\"dbo.Magic_XMLCommands_usp_exp_stmt\" } }";
                    else
                        request.DataSourceCustomParam = "{ export: { Definition:\"dbo.Magic_Commands_usp_exp_stmt\" } }";
                }
              

                //Costruzione del dataTable con i dati 
                if (request.filter != null && request.filter.filters != null)
                    wherecondition = rp.BuildWhereCondition(true);
                string jsonfilter = Newtonsoft.Json.JsonConvert.SerializeObject(request.filter);
                var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(request.EntityName, groupVisibilityField);
                string orderBy = rp.BuildOrderCondition();
                var dbres = readercmd.getGenericControllerReader(request.EntityName, request.layerID, request.skip, request.take, request.DataSourceCustomParam, wherecondition, orderBy, request.functionID, String.Join(",", request.Columns), jsonfilter, true, null, null);
                DataTable dt = dbres.table;

                if (dt.Columns.Count == 0)
                    return Utils.GetErrorMessageForDownload("No data available!");

                //file creation
                //nome tabella / entita'  
                string fileid = request.EntityName.Split('.')[request.EntityName.Split('.').Length - 1];// +"_" + DateTime.UtcNow.Ticks.ToString();
                string filename = MagicFramework.Helpers.SessionHandler.IdUser + "_" + fileid + "." + data.format;

                var path = Path.Combine(exportdirectory, filename);
                if (!Directory.Exists(exportdirectory))
                    Directory.CreateDirectory(exportdirectory);
                GridToFileExporter fe = new GridToFileExporter(data, filename, path, dt);
                FileStream stream = fe.Export();

                result.Content = new StreamContent(stream);
                result.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
                result.Content.Headers.Add("Content-Disposition", "attachment; filename=" + filename);
                //enable waiting for $.fileDownload
                var cookie = new CookieHeaderValue("fileDownload", "true");
                cookie.Expires = DateTimeOffset.Now.AddDays(1);
                cookie.Path = "/";
                result.Headers.AddCookies(new CookieHeaderValue[] { cookie });
                //result.Content.Headers.ContentDisposition.FileName = filename;
                if (trackOperation)
                {
                    //tracking info
                    fileInfo["files"] = new Newtonsoft.Json.Linq.JArray { path };
                    MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("export", fileInfo);
                }
            }
            catch (Exception ex)
            {
                if (trackOperation)
                {
                    //tracking info
                    fileInfo["errorMessage"] = ex.Message;
                    MagicFramework.Controllers.MAGIC_SAVEFILEController.trackFileOperation("exportError", fileInfo);
                }
                if (SessionHandler.UserIsDeveloper)
                    return Utils.GetErrorMessageForDownload(ex.Message);
                else
                    return Utils.GetErrorMessageForDownload(genericError);
            }
            return result;
        }

        [GridObjectsFilter]
        [HttpPost]
        public Models.Response GetWithFilter(dynamic data)
        {
            if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
            {
                throw new Exception("GetWithFilter disabled. Use Select method of this controller instead");
            }

            try
            {
                string table = data.table;
                string customstoredprocedure = data.storedprocedure;

                //generic request for credential related tables
                bool isreserved = DBConnectionManager.IsCredentialInfo(table);
                if (isreserved == true)
                {
                    //asks the database if the user is authorized to browse credential infos. Default enabled users are developer and admin profiles.
                    SystemRightsChecker.checkSystemRights("selectCredentials");
                }
                string order = data.order;
                string where = data.where;
                var dbutils = new DatabaseCommandUtils();

                //cannot contain reserved words and if stored procedure is unspecified has to be a table or view
                if (RequestParser.checkWhereConditionForSQLInjectionReservedWords(table) || (String.IsNullOrEmpty(customstoredprocedure) && !dbutils.CheckTableOrViewExists(table)))
                    throw new ArgumentException("Illegal SQL Injected");

                if (!String.IsNullOrEmpty(where) && RequestParser.checkWhereConditionForSQLInjectionReservedWords(where))
                    throw new ArgumentException("Illegal SQL Injected");

                if (!String.IsNullOrEmpty(order) && RequestParser.checkWhereConditionForSQLInjectionReservedWords(order))
                    throw new ArgumentException("Illegal SQL Injected");
                //if stored procedure is specified it has to exist in the routines list 
                if (!String.IsNullOrEmpty(customstoredprocedure) && (RequestParser.checkWhereConditionForSQLInjectionReservedWords(customstoredprocedure) || !dbutils.CheckProcedureExists(customstoredprocedure)))
                    throw new ArgumentException("Illegal SQL Injected");

                //prevents sql injection analysing parenthesis
                RequestParser.CheckWhereConditionFromClient(where);
                if (data.parse != null && (bool)data.parse == true)
                    where = where.Replace("{userId}", SessionHandler.IdUser.ToString()).Replace("{cultureId}", SessionHandler.UserCulture.ToString());
                string jsonparam = customparamdefault;
                if (customstoredprocedure != null)
                    jsonparam = "{read:{ type:\"StoredProcedure\",Definition:\"" + customstoredprocedure + "\"  }}";

                var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(table, groupVisibilityField);
                var dbres = readercmd.getGenericControllerReader(table, 0, 0, 100000, jsonparam, where, order, 0, null, null, false, null, null);

                var result = dbres.table.AsEnumerable().ToArray();
                if (result.Length > 0)
                    result = result.Take(1).ToArray();
                return new Models.Response(result, dbres.counter);

            }
            catch (Exception ex)
            {
                return ManageErrors(ex);
            }

        }
        [GridAutocompletesFilter]
        [HttpPost]
        public Response SelectA(Models.RequestAutocomplete request)
        {
            Request req = new Request(request);
            return Select(req);
        }
        private string AddGridNameToData(string data, string gridName, string MergedScenario = null) {
            try
            {
                if (!String.IsNullOrEmpty(data))
                {
                    JObject o_ = JObject.Parse(data);
                    o_.Add("Grid__Name__", gridName);
                    o_.Add("MergedScenario", MergedScenario);
                    data = JsonConvert.SerializeObject(o_);
                }
                else if (!String.IsNullOrEmpty(gridName))
                {
                    data = JsonConvert.SerializeObject(new { Grid__Name__ = gridName, MergedScenario = MergedScenario });
                }
            }
            catch(Exception ex)
            {
                MFLog.LogInFile(ex);
            }
            return data;
        }
        //The grid will call this method in read mode
        [GridObjectsFilter]
        [HttpPost]
        public Models.Response Select(Models.Request request)
        {
            try
            {
                Helpers.RequestParser rp = new Helpers.RequestParser(request);
                string order = "1";
                String wherecondition = "1=1";
                String columnlist = String.Empty;
                if (request.filter != null)
                    wherecondition = rp.BuildWhereCondition(true);

                string jsonfilter = Newtonsoft.Json.JsonConvert.SerializeObject(request.filter);

                if (request.sort != null && request.sort.Count > 0)
                    order = rp.BuildOrderCondition();
                if (request.Columns != null)
                    columnlist = rp.BuildColumnList();

                var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(request.EntityName, groupVisibilityField, attributesGroupListField);
                //deserialize model if present

                string pkname = String.Empty;
                List<string> pwFields = new List<string>();
                try
                {
                    //dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject<object>(request.Model);
                    pwFields = GetPasswordFields(rp.DataModel[0]);
                    //get pkname
                    pkname = rp.DataModel[0].id;
                }
                catch (Exception ex)
                {
                    MFLog.LogInFile("PK has not been defined for grid GENERICSQLCOMMANDCONTROLLER Select err: " + ex.Message, MFLog.logtypes.ERROR);
                }

                //paolo's request to have gridname in select
                string data = AddGridNameToData(request.data,request.GridName, request.MergedScenario);
                var dbres = readercmd.getGenericControllerReader(request.EntityName, request.layerID, request.skip, request.take, request.DataSourceCustomParam, wherecondition, order, request.functionID, columnlist, jsonfilter, false, pkname, data, request.groupBy, request.aggregations);

                var result = dbres.table.AsEnumerable().ToArray();
                if (result.Length > 0)
                {
                    HidePasswortData(result, pwFields);
                    result = result.Take(1).ToArray();
                }
                return new Models.Response(result, dbres.counter);

            }
            catch (Exception ex)
            {
                return ManageErrors(ex);
            }

        }

        /// <summary>
        /// richiama una stored procedure con input XML e output un recordset (SELECT FROM) ed una variabile di @count
        /// </summary>
        /// <param name="request"></param>
        /// <returns>MagicFramework.Models.Response</returns>
        [HttpPost]
        public Models.Response SelectFromXMLStoredProcedure(Models.Request request)
        {
            try
            {
                Helpers.RequestParser rp = new Helpers.RequestParser(request);

                var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(request.EntityName, groupVisibilityField, attributesGroupListField);

                var dbres = readercmd.getGenericControllerReader(request.EntityName, 0, 0, 0, request.DataSourceCustomParam, "1=1", null, -1, "*", null, false, null, request.data);

                var result = dbres.table.AsEnumerable().ToList().ToArray();
                if (result.Length > 0)
                    result = result.Take(1).ToArray();
                return new Models.Response(result, dbres.counter);

            }
            catch (Exception ex)
            {
                return ManageErrors(ex);
            }
        }
        /// <summary>
        /// allows multiple tables load 
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage SelectDataSetFromXMLStoredProcedure(dynamic data)
        {
            var response = new HttpResponseMessage();
            DataSet outputs;
            try
            {
                Models.Request req = new Models.Request();
                string wherecondition = null;
                if (data.filter != null)
                {
                    req.filter = Newtonsoft.Json.JsonConvert.DeserializeObject<Models.Filters>(data.filter.ToString());
                    wherecondition = new RequestParser(req).BuildWhereCondition(true);
                } 
                string storedprocedure = data.storedprocedure;
                data.cultureID = SessionHandler.UserCulture;
                outputs = new DatabaseCommandUtils().GetDataSetFromStoredProcedure(storedprocedure, data, null, wherecondition);
                response.StatusCode = HttpStatusCode.OK;
                response.Content = new StringContent(JsonUtils.convertDataSetToJsonString(outputs, data.xmlToJson != null ? ((JArray)data.xmlToJson).ToObject<List<string>>() : null));
            }
            catch (Exception ex)
            {
                response = Utils.retInternalServerError(ex.Message);
                return response;
            }
            return response;
        }
        [GridObjectsFilter]
        [HttpPost]
        public HttpResponseMessage ActionButtonSPCall(dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                //based on form name i get the target (default) or magic connection
                string form = data.form;
                var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(form);
                var retval = readercmd.execUpdateInsertController(data);
                string jsonreturnmsg = MagicFramework.Helpers.JsonUtils.buildJSONreturnHttpMessage(retval.msgType, retval.message);
                response.Content = new StringContent(jsonreturnmsg);
                response.StatusCode = HttpStatusCode.OK;

            }
            catch (Exception ex)
            {
                response = ManageWriteErrors(ex);
            }

            // return the HTTP Response.
            return response;
        }

        private void primaryKeysAreCoherent(int id, dynamic data, string pkname)
        {
            int pkfromdata = int.Parse(data[pkname].ToString());
            if (id != pkfromdata)
                throw new ArgumentException("BLK_ROW_PK");
        }
        private void checkRecordIsEditableOverwrite(dynamic data,int id)
        {
            if (!(WebConfigurationManager.AppSettings["checkRecordEditableValue"] != null && WebConfigurationManager.AppSettings["checkRecordEditableValue"].Equals("true")))
                return;

            if (id <= 0) //caso delle many to many con id fittizi, in questo caso il controllo non potrà essere effettuato.
                return;

            string commandname = data.cfgDataSourceCustomParam;
            string entityname = data.cfgEntityName;
            int functionid = data.cfgfunctionID;
            int layer = 0;
            int.TryParse(data.cfglayerID.ToString(), out layer);
            var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(data.cfgEntityName.ToString());
            string pkname = data.cfgpkName;
            if (String.IsNullOrEmpty(pkname))
                throw new ArgumentException("BLK_ROW_PK_UND");
            primaryKeysAreCoherent(id, data, pkname);
            List<string> columns = new List<string>();
                    foreach (var c in data.cfgColumns)
                        columns.Add(c.ToString());
                    String columnlist = String.Join(",", columns.ToArray());
            string pkvalue = id.ToString();
            string whereconditionid = buildwhereconditionid(pkvalue, pkname);
            var dbres = readercmd.getGenericControllerReader(entityname, layer, 0, pkvalue.Split(',').Length, commandname, whereconditionid, null, functionid, columnlist, null, false, pkname, null);
            var result = dbres.table.AsEnumerable().ToArray();
            if (result.Count() == 0)
                throw new System.ArgumentException("BLK_ROW_NF");
            var row = result[0];
            if (row.Table.Columns.Contains("Editable"))
            {
                try
                {
                    bool editable = row.Field<bool>("Editable");
                    if (editable == false)
                        throw new ArgumentException("BLK_ROW_EDIT");
                }
                catch (Exception ex) {
                    if (ex.Message == "BLK_ROW_EDIT")
                        throw new ArgumentException(ex.Message);
                    throw new ArgumentException("BLK_ROW_EDIT_NOT_BOOL");
                }
            }
        }

        //The grid will call this method in update mode
        [GridObjectsFilter]
        [HttpPost]
        public HttpResponseMessage PostU(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {

                if (data.cfgGridName != null)
                    Magic_Grids.addGridPropertiesForCreateUpdatedDeleteOperations(data);

                if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
                {
                    data = EscapeHTML(data, data["cfgModel"]);
                }

                if (data.UpdateUser_ID == null || data.UpdateUser_ID.ToString() == "0") //MagicFramework popola automaticamente un campo chiamato cosi' se nullo 
                    data.UpdateUser_ID = MagicFramework.Helpers.SessionHandler.IdUser;
                // select the item from the database where the id
                F2HandleFiles(data);
                var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(data.cfgEntityName.ToString());
                //verifico l' esistenza ed invoco automatismi data l' entita' e i dati dal browser
                var automations = new MagicFramework.Helpers.DatabaseEntityAutomations(data, data.cfgEntityName.ToString());
                try
                {
                    automations.InvokeAutomation();
                }
                catch (Exception ex)
                {
                    MFLog.LogInFile("Automation failed: " +ex.Message, MFLog.logtypes.ERROR);
                }
                GridModelParser gp = new GridModelParser(data);
                RemovePasswordIfUnchanged(data, true);

                //Fills xml container fields with their xml data
                gp.FillXMLValues();
                //check overwritten rights at record level.Throws an exception if Editable is 0 or record is not found
                checkRecordIsEditableOverwrite(data, id);
                var retval = readercmd.execUpdateInsertController(data);
                string jsonreturnmsg = MagicFramework.Helpers.JsonUtils.buildJSONreturnHttpMessage(retval.msgType, retval.message, retval.isValidation);
                response.Content = new StringContent(jsonreturnmsg);
                bool managedWarningFromValidation = retval.isValidation && retval.msgType == "WARN";

				response.StatusCode = managedWarningFromValidation ? HttpStatusCode.BadRequest:  HttpStatusCode.OK;

				Helpers.CacheHandler.MagicCacheManager(data);
                var snapshot = new Magic_GridDataSnapShot(data);
                snapshot.InsertSnapShot();
            }
            catch (Exception ex)
            {
                response = ManageWriteErrors(ex);
            }

            // return the HTTP Response.
            return response;
        }
        private bool hasLayer(dynamic data)
        {
            if (data.cfglayerID != null && data.cfglayerID != 0)
                return true;
            if (data.MagicBOLayerID != null && data.MagicBOLayerID != 0)
                return true;
            return false;
        }

        private static DataRow GetCurrentRecord (JObject data, JObject cfgModel, string cfgEntityName, string cfgDataSourceCustomParam)
        {
            string field = (string)cfgModel["id"];
            string value = (string)data[field];
            if (string.IsNullOrEmpty(value) || value.Equals("0"))
            {
                return null;
            }
            var c = new GenericSqlCommandController();
            Models.Request r = new Models.Request();
            r.EntityName = cfgEntityName;
            r.filter = new Models.Filters
            {
                field = field,
                Operator = "eq",
                value = value,
            };
            r.skip = 0;
            r.take = 1;
            r.DataSourceCustomParam = cfgDataSourceCustomParam;
            var res = c.Select(r);
            return ((System.Data.DataRow[])res.Data)[0];
        }

        private static JArray GetRemovedFiles (JArray newFiles, string oldFiles)
        {
            JArray o = JArray.Parse(oldFiles);
            if (o == null)
            {
                return null;
            }
            return new JArray(
                o
                    .Where(of => !newFiles.Where(nf => ((string)of["name"]).Equals((string)nf["name"])).Any())
            );
        }

        public static void F2HandleFiles(dynamic data)
        {

            JObject d = (JObject)data;

            // handle grids inside wizards
            if (d["wizardCode"] != null)
            {
                MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());
                Array wizards = mfApi.GetWizard(d["wizardCode"].ToString()).Data;
                if (wizards.Length > 0)
                {
                    DataRow wizard = (DataRow)wizards.GetValue(0);
                    JObject settings = JObject.Parse(wizard["Settings"].ToString());
                    foreach (JObject step in settings["steps"])
                    {
                        string stepKey = step["stepKey"].ToString();
                        // only if fields are defined
                        if (
                            step["fields"] != null
                            && d["data"] != null
                            && d["data"].SelectToken(stepKey) != null
                        )
                        {
                            foreach (JObject field in step["fields"])
                            {
                                if (field["MagicTemplateDataRole"].ToString() == "detailgrid")
                                {
                                    string columnName = field["ColumnName"].ToString();
                                    if (
                                        d["data"][stepKey].SelectToken(stepKey) != null
                                        && ((JArray)d["data"][stepKey][columnName]).Count > 0
                                    )
                                    {
                                        string gridName = (string)field["searchGrid"]["SearchGridName"];
                                        string alternativeGrid = Magic_Grids.GetAltenativeGridForApplication(gridName);
                                        if (String.IsNullOrEmpty(alternativeGrid))
                                            alternativeGrid = gridName;
                                        JObject wizardGridsData = new JObject
                                        {
                                            ["cfgGridName"] = alternativeGrid,
                                            ["cfgfunctionID"] = d["cfgfunctionID"],
                                            ["cfglayerID"] = null,
                                            ["models"] = d["data"][stepKey][columnName]
                                        };
                                        Magic_Grids.addGridPropertiesForCreateUpdatedDeleteOperations(wizardGridsData);
                                        F2HandleFiles(wizardGridsData);
                                        d["data"][stepKey][columnName] = wizardGridsData["models"];
                                    }
                                }
                            }

                        }
                    }
                }
            }

            // handle grids inside edit modal -> angular Magic_GridPopupChildGridsFormController
            if (d["childGridsData"] != null)
            {
                foreach (JProperty p in d["childGridsData"])
                {
                    string gridName = (string)p.Name;
                    string alternativeGrid = Magic_Grids.GetAltenativeGridForApplication(gridName);
                    if (String.IsNullOrEmpty(alternativeGrid))
                        alternativeGrid = gridName;
                    JObject childGridsData = new JObject
                    {
                        ["cfgGridName"] = alternativeGrid,
                        ["cfgfunctionID"] = d["cfgfunctionID"],
                        ["cfglayerID"] = null,
                        ["models"] = p.Value
                    };
                    Magic_Grids.addGridPropertiesForCreateUpdatedDeleteOperations(childGridsData);
                    F2HandleFiles(childGridsData);
                    d["childGridsData"][p.Name] = childGridsData["models"];
                }
            }

            if (data.MagicGridExtension == null)
            {
                return;
            }
            MagicGridExtension gridExtension = ((JObject)data.MagicGridExtension).ToObject<MagicGridExtension>();

            if (
                gridExtension?.F2FileColumns == null
                || d["cfgModel"] == null
                || d["cfgModel"]["fields"] == null
                || gridExtension.F2FileColumns.Length == 0
                || MFConfiguration.InstanceSettings().F2APIKey == null
            )
            {
                return;
            }

            // models comes from batch: true DataSource setting and emulated from childGridsData above
            JArray models = d["models"] != null ? (JArray)d["models"] : new JArray { d };
            foreach (var columnInfos in gridExtension.F2FileColumns)
            {
                if (d["cfgModel"]["fields"][columnInfos.F2Column] == null)
                {
                    continue;
                }
                foreach (JObject model in models)
                {
                    JArray f1FileColumn = model[columnInfos.F1Column] != null && !string.IsNullOrEmpty(model[columnInfos.F1Column].ToString()) ? JArray.Parse((string)model[columnInfos.F1Column]) : new JArray();
                    JArray f2FileColumn = model[columnInfos.F2Column] != null && !string.IsNullOrEmpty(model[columnInfos.F2Column].ToString()) ? JArray.Parse((string)model[columnInfos.F2Column]) : new JArray();

                    // remove f2File when f1File gets removed
                    DataRow record = GetCurrentRecord(model, (JObject)d["cfgModel"], (string)d["cfgEntityName"], (string)d["cfgDataSourceCustomParam"]);
                    if (record != null && f2FileColumn.Count > 0)
                    {
                        JArray removedFiles = GetRemovedFiles(f1FileColumn, (string)record[columnInfos.F1Column]);
                        if (removedFiles?.Count > 0)
                        {
                            f2FileColumn = new JArray(
                                f2FileColumn.Where(f2F => !removedFiles.Where(rf => ((string)f2F).Equals((string)rf["f2UID"])).Any())
                            );
                        }
                    }

                    // add f1 files to f2 files column
                    foreach (var f1File in f1FileColumn)
                    {
                        if (f1File["f2UID"] != null)
                        {
                            continue;
                        }
                        var f2FileInfo = F2.PostFileInfo((string)f1File["name"], (int)f1File["size"], JsonConvert.DeserializeObject<F2FileAccessPost[]>(MFConfiguration.InstanceSettings().F2DefaultFileRoleUIDJSONArray));
                        f2FileColumn.Add(f2FileInfo.Uid);
                        f1File["f2UID"] = f2FileInfo.Uid;
                    }
                    model[columnInfos.F1Column] = f1FileColumn.ToString(Newtonsoft.Json.Formatting.None);
                    model[columnInfos.F2Column] = f2FileColumn.ToString(Newtonsoft.Json.Formatting.None);
                }
            }
        }

        private static JObject EscapeHTML (JObject jsonObject, JObject model = null)
        {
            JObject fields = (JObject)model?["fields"];
            foreach (KeyValuePair<string, JToken> element in jsonObject)
            {
                if (
                    !element.Key.StartsWith("cfg")
                    && element.Value.Type == JTokenType.String
                    
                )
                {
                    if (
                        fields?[element.Key] != null
                        && (
                            (fields[element.Key]["databasetype"] != null && fields[element.Key]["databasetype"].ToString().Equals("xml"))
                            || (fields[element.Key]["dataRole"] != null && fields[element.Key]["dataRole"].ToString().Equals("editor"))
                        )
                    )
                    {
                        continue;
                    }
                    jsonObject[element.Key] = Utils.EscapeHTML((string)element.Value);
                }
            }
            return jsonObject;
        }

        //The grid will call this method in insert mode
        [GridObjectsFilter]
        [ExceptionFilter]
        [HttpPost]
        public HttpResponseMessage PostI(dynamic data)
        {
            //try
            //{
                if (data.cfgGridName != null)
                    Magic_Grids.addGridPropertiesForCreateUpdatedDeleteOperations(data);

         
                if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
                {

                    data = EscapeHTML(data, data["cfgModel"]);
                }
              

                if (data.CreationUser_ID == null || data.CreationUser_ID.ToString() == "0") //MagicFramework popola automaticamente un campo chiamato cosi' se nullo 
                    data.CreationUser_ID = MagicFramework.Helpers.SessionHandler.IdUser;
                F2HandleFiles(data);
                var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(data.cfgEntityName.ToString());
                //verifico l' esistenza ed invoco automatismi data l' entita' e i dati dal browser
                var automations = new MagicFramework.Helpers.DatabaseEntityAutomations(data, data.cfgEntityName.ToString());
                try
                {
                    automations.InvokeAutomation();
                }
                catch (Exception ex)
                {
                    MFLog.LogInFile("Automation failed: " + ex.Message, MFLog.logtypes.ERROR);
                }
                string commandname = data.cfgDataSourceCustomParam;
                GridModelParser gp = new GridModelParser(data);
                List<string> pwFields = CheckForPasswordAndEncrypt(data);
                //Fills xml container fields with their xml data
                gp.FillXMLValues();
                var retval = readercmd.execUpdateInsertController(data);
                string operation = data.cfgoperation;
                string entityname = data.cfgEntityName;
                int functionid = data.cfgfunctionID;
                int userid = MagicFramework.Helpers.SessionHandler.IdUser;
                int layer = 0;
                int.TryParse(data.cfglayerID.ToString(), out layer);
                int businessunit = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;

                string pkname = data.cfgpkName;
                List<string> columns = new List<string>();
                foreach (var c in data.cfgColumns)
                    columns.Add(c.ToString());
                String columnlist = String.Join(",", columns.ToArray());
                string resultpk = retval.pkValue.ToString();
                string whereconditionid = buildwhereconditionid(resultpk, pkname);
                var dbres = readercmd.getGenericControllerReader(entityname, layer, 0, resultpk.Split(',').Length, commandname, whereconditionid, null, functionid, columnlist, null, false, pkname, null);
                var result = dbres.table.AsEnumerable().ToArray();
                HidePasswortData(result, pwFields);
                Helpers.CacheHandler.MagicCacheManager(data);
                //se non specificato assumo l' ok 
                string msgType = retval.msgType == null ? "OK" : retval.msgType.ToString();
                if (msgType == "OK" || msgType == "WARN")
                {
                    data[pkname] = resultpk;
                    var snapshot = new Magic_GridDataSnapShot(data);
                    snapshot.InsertSnapShot();
                }
                if (msgType == "WARN")
                {
                    return Request.CreateResponse(HttpStatusCode.BadRequest, new Models.Response(result, result.Length, retval.message));
                }
                else
                    return Request.CreateResponse(HttpStatusCode.OK, new Models.Response(result, result.Length));
            //}
            //catch (Exception ex)
            //{
            //    return ManageErrors(ex);
            //}
        }

        [GridObjectsFilter]
        [HttpPost]
        public HttpResponseMessage Validate(dynamic data)
        {
            HttpResponseMessage response = new HttpResponseMessage(HttpStatusCode.OK);
            if (data.cfgGridName != null)
                Magic_Grids.addGridPropertiesForCreateUpdatedDeleteOperations(data);
            DatabaseCommandUtils readercmd = new DatabaseCommandUtils(data.cfgEntityName.ToString());
            DatabaseCommandUtils.CMDresult result = readercmd.Validate(data);
            if (result.errorId != "0" && !String.IsNullOrEmpty(result.errorId))
            {
                response.StatusCode = HttpStatusCode.BadRequest;
                response.Content = new StringContent(String.IsNullOrEmpty(result.message) ? result.errorId : result.message);
            }
            return response;
        }

        public string buildwhereconditionid(string retval, string pkname)
        {
            string result = String.Empty;
            List<string> list = new List<string>();
            foreach (var x in retval.Split(','))
            {
                list.Add("'" + x + "'"); //TODO:tratto numerici e stringhe allo stesso modo , da capire con Oracle
            }
            result = String.Join(" OR " + pkname + " = ", list);
            return ("(" + pkname + "=" + result + ")");
        }
        [GridObjectsFilter]
        [HttpPost]
        public HttpResponseMessage PostD(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                if (data.cfgGridName != null)
                    Magic_Grids.addGridPropertiesForCreateUpdatedDeleteOperations(data);
                //check overwritten rights at record level.Throws an exception if Editable is 0 or record is not found
                checkRecordIsEditableOverwrite(data, id);
                var readercmd = new MagicFramework.Helpers.DatabaseCommandUtils(data.cfgEntityName.ToString());
                var retval = readercmd.execUpdateInsertController(data);
                Helpers.CacheHandler.MagicCacheManager(data);
                response.StatusCode = HttpStatusCode.OK;
                string jsonreturnmsg = MagicFramework.Helpers.JsonUtils.buildJSONreturnHttpMessage(retval.msgType, retval.message);
                response.Content = new StringContent(jsonreturnmsg);
                var snapshot = new Magic_GridDataSnapShot(data);
                snapshot.InsertSnapShot();
            }
            catch (Exception ex)
            {
                response = ManageWriteErrors(ex);
            }

            // return the HTTP Response.
            return response;
        }

        

        public Models.Response SelectTaggedElements(dynamic data)
        {
            try
            {
                var handler = new MagicFramework.Helpers.DatabaseCommandUtils();

                var business_unit = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserAllGroupsVisibiltyChildrenSet(MagicFramework.Helpers.SessionHandler.IdUser.ToString());
                data["businessUnitList"] = business_unit;
                data["userID"] = SessionHandler.IdUser;
                data["ugvi"] = SessionHandler.UserVisibilityGroup;
                XmlDocument xml = MagicFramework.Helpers.JsonUtils.Json2Xml(data.ToString());
                var botaggeditems = handler.callStoredProcedurewithXMLInput(xml, data.storedProcedure.ToString());
                var result = botaggeditems.table.Rows;
                BO[] res = new BO[result.Count];
                int i = 0;
                foreach (var r in result)
                {
                    var row = (System.Data.DataRow)r;
                    if (row.ItemArray.Length == 5) //se l' EntityName non viene passato
                        res[i++] = new BO { Type = r[0].ToString(), Image = r[1].ToString(), Description = r[2].ToString(), Id = r[3].ToString(), EntityName = r[4].ToString() };
                    else
                        res[i++] = new BO { Type = r[0].ToString(), Image = r[1].ToString(), Description = r[2].ToString(), Id = r[3].ToString(), EntityName = null };
                }
                return new Models.Response(res, result.Count);
            }
            catch (Exception ex)
            {
                return new MagicFramework.Models.Response(ex.Message);
            }
        }

        private static List<string> CheckForPasswordAndEncrypt(dynamic data)
        {
            List<string> pwFields = new List<string>();
            if (data.cfgModel != null && data.cfgModel.fields != null)
            {
                pwFields = GetPasswordFields(data.cfgModel);
                foreach (string field in pwFields)
                {
                    data[field] = EncryptPassword((string)data[field]);
                }
            }
            return pwFields;
        }

        private static string EncryptPassword(string unencryptedPasswort)
        {
            return StringCipher.Encrypt(unencryptedPasswort, "s3cr3TTp4SSw0rT");
        }

        public static string DecryptPassword(string encryptedPasswort)
        {
            return StringCipher.Decrypt(encryptedPasswort, "s3cr3TTp4SSw0rT");
        }

        private static List<string> GetPasswordFields(dynamic model)
        {
            List<string> pwFields = new List<string>();
            foreach (Newtonsoft.Json.Linq.JProperty field in model.fields)
            {
                if (field.Value["type"] != null && field.Value["type"].ToString().Equals("password"))
                {
                    pwFields.Add(field.Name);
                }
            }
            return pwFields;
        }

        private static void RemovePasswordIfUnchanged(dynamic data, List<string> pwFields, bool encryptOhterwise = false)
        {
            foreach (var pwColumn in pwFields)
            {
                if (data[pwColumn].ToString().Equals(PW_VEIL))
                    data.Remove(pwColumn);
                else if (encryptOhterwise)
                    data[pwColumn] = EncryptPassword((string)data[pwColumn]);
            }
        }

        private static void RemovePasswordIfUnchanged(dynamic data, bool encryptOhterwise = false)
        {
            if(data.cfgModel != null)
                RemovePasswordIfUnchanged(data, GetPasswordFields(data.cfgModel), encryptOhterwise);
        }

        private static void HidePasswortData(DataRow[] result, List<string> pwFields)
        {
            if (pwFields.Count > 0)
            {
                foreach (var row in result)
                {
                    foreach (string field in pwFields)
                    {
                        row[field] = PW_VEIL;
                    }
                }
            }
        }
    }

    public class BO
    {
        public string Type { set; get; }
        public string Image { set; get; }
        public string Description { set; get; }
        public string Id { set; get; }
        public string EntityName { get; set; }
    }
}
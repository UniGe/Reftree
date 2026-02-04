using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using System.Linq.Dynamic;
using Newtonsoft.Json;
using MagicFramework.Helpers;
using MagicFramework.MemberShip;
using Newtonsoft.Json.Linq;
using System.Data;
using MagicFramework.Helpers.Sql;
using System.Xml;
using MagicFramework.Models;
using System.Threading.Tasks; 

namespace MagicFramework.Controllers
{
    public class Magic_GridsController : ApiController
    {
        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
        private const string  genericError = "An error has occured";
        /// <summary>
        /// This updates all the fields which are involved when the underlying table or view of a grid changes
        /// </summary>
        /// <param name="gridname"></param>
        /// <param name="FromTableNew"></param>
        /// <returns></returns>
        [HttpGet]
        public HttpResponseMessage SwitchEntity(string gridname, string FromTableNew)
        {
            var respone = new HttpResponseMessage();
            var mg = _context.Magic_Grids.Where(x => x.MagicGridName == gridname).FirstOrDefault();

            if (mg == null)
                return Utils.retInternalServerError("Grid not found...");
            mg.FromTable = FromTableNew;

            string schema = FromTableNew.Split('.')[0];
            string entityname = FromTableNew.Split('.')[1];

            mg.MagicGridEntity = entityname;

            string editableTemplateCode = mg.EditableTemplate;
            var mt = _context.Magic_Templates.Where(x => x.MagicTemplateName == editableTemplateCode).FirstOrDefault();
            if (mt != null)
                mt.BaseCUDTable = entityname;

            _context.SubmitChanges();

            return Utils.retOkMessage("Switch completed!!!");
        }

        private bool isFromTableValid(string fromTable)
        {
            if (fromTable.Split('.').Length < 2)
                return false;

            return true;
        }
        private string retSchema(string fromTable)
        {
            return fromTable.Split('.')[0];
        }
        private string retTableName(string fromTable)
        {
            return fromTable.Split('.')[1];
        }
        /// <summary>
        /// It refreshes the grid's layer with the information schema  of a certain database
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage RefreshLayerGridToDb(dynamic data)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            var dbutils = new DatabaseCommandUtils();
            dbutils.connection = DBConnectionManager.GetMagicConnection();
            try
            {
                string appName = data.appName;
                string targetDBName = String.Empty;
                //loop trough all config files
                var configs = new MFConfiguration().LoadConfigurations();
                foreach (var config in configs)
                {
                    //loop trough all instances
                    foreach (var instance in config.Value.listOfInstances.Where(i => i.appInstancename == appName))
                        targetDBName = DBConnectionManager.getDBNameFromConnectionString(instance.TargetDBconn);
                }
                //stndard refresh forcing a diffente target based on the selected app name when refreshing the grid
                RefreshGridToDb(data, targetDBName);
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex);
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent("Error while refreshing grid. Contact the system administrator!");
                return response;
            }
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent("{ \"msg\":\"The grid's layer has been refreshed!\" }");
            return response;
        }
        [HttpGet]
        public HttpResponseMessage GetApplicationsAndLayersForAlternativeGrid(string gridName)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            List<string> appNames = Magic_Grids.GetApplicationsAndLayersForAlternativeGrid(gridName);
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent(JsonConvert.SerializeObject(appNames));
            return response;
        }

        [HttpGet]
        public HttpResponseMessage EmptyFunctionAndGridsCache()
        {
            var respone = new HttpResponseMessage();
            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);
            return Utils.retOkMessage("Cache is now empty!!!");
        }
        [HttpGet]
        public HttpResponseMessage CleanScriptBuffer()
        {
            var respone = new HttpResponseMessage();
            var dbutils = new DatabaseCommandUtils();
            dbutils.buildAndExecDirectCommandNonQuery(DBConnectionManager.GetMagicConnection(), "EXEC dbo.CLEANSCRIPTBUFFER", null);
            return Utils.retOkMessage("Template buffer is now empty!!!");
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="data"></param>
        /// <param name="outerCatalogue"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage RefreshGridToDb(dynamic data,string outerTargetDbName = null)
        {
            var response = new HttpResponseMessage();
            try
            {
                string gridname = data.GridName;
                string stringToSplit = data.Schema;

                if (stringToSplit.Split('.').Length < 2)
                    throw new ArgumentException("Please check FromTable property. The schema is mandatory e.g: dbo.table");

                string schema = stringToSplit.Split('.')[0];
                string tableName = stringToSplit.Split('.')[1];
                string targetDB = String.IsNullOrEmpty(outerTargetDbName) ? DBConnectionManager.getTargetDBName() : outerTargetDbName;
                string catalog = targetDB  + "." + schema; //passo anche il nome del DB es. MagicDB.dbo in modo da poter far riferimento all' INFORMATION SCHEMA giusto in fase di creazione
                _context.RefreshMagicGrids(gridname, tableName, catalog);

                //se la griglia ha un edit template collegato lo aggiorno
                var gridref = (from e in _context.Magic_Grids where e.MagicGridName == gridname select e).FirstOrDefault();
                var template = (from e in _context.Magic_Templates where e.MagicTemplateName == gridref.EditableTemplate select e).FirstOrDefault();
                if (template != null && gridref.FromTable != null)
                    _context.RefreshMagicTemplates(template.MagicTemplateID, template.MagicTemplateLayout_ID, template.MagicTemplateType_ID, template.BaseGrid_ID, template.BaseCUDTable, catalog);
                
                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                string appName = data.appName != null ? data.appName.ToString() : ApplicationSettingsManager.GetAppInstanceName();
                Magic_Grids.InsertRefreshHistory(gridref.MagicGridID, targetDB, appName);
                response.StatusCode = HttpStatusCode.OK;
                response.Content = new StringContent("{ \"msg\":\"OK\" }");
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(genericError);
            }

            return response;
        }

        [HttpPost]
        public HttpResponseMessage RefreshLayerOverrides(dynamic data)
        {
            var response = new HttpResponseMessage();
            try
            {
                int gridid = data.baseGridID;
                string targetentity = data.targetEntity;
                targetentity = targetentity.Split('.')[1];
                int targetLayerID = data.targetLayerID;
                string schema = data.targetSchema;
                bool useGenController = data.useGenController;
                string catalog = DBConnectionManager.getTargetDBName() + "." + schema; //passo anche il nome del DB es. MagicDB.dbo in modo da poter far riferimento all' INFORMATION SCHEMA giusto in fase di creazione
                _context.Magic_RefreshLayerOverrides(gridid, targetentity, targetLayerID, catalog, useGenController);

                var gridref = (from e in _context.Magic_Grids where e.MagicGridID == gridid select e).FirstOrDefault();
                var template = (from e in _context.Magic_Templates where e.MagicTemplateName == gridref.EditableTemplate select e).FirstOrDefault();
                _context.RefreshMagicTemplates(template.MagicTemplateID, template.MagicTemplateLayout_ID, template.MagicTemplateType_ID, gridid, targetentity, catalog);



                response.StatusCode = HttpStatusCode.OK;
                response.Content = new StringContent("{ \"msg\":\"OK\" }");

            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(genericError);
            }

            return response;
        }

        //get all elements of an entity
        [HttpGet]
        public List<Models.Magic_Grids> GetAll()
        {
            bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
            string wherecondition = "1=1";

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Grids
                          .Where(wherecondition)
                          .Where(f => f.isSystemGrid == isSystem)
                         select new Models.Magic_Grids(e)).ToList();

            return resdb.OrderBy(h => h.MagicGridName).ToList();

        }

        [HttpGet]
        public List<int> GetLayerList(string id)
        {
            if (id == "null")
                return null;
            Models.GridModelParser gp = new Models.GridModelParser();
            return gp.getParentLayerList(int.Parse(id));
        }
        private static HttpResponseMessage addUserFieldstoGrid(string gridName, string cachekey, string masterGridName = null)
        {
            var result = new HttpResponseMessage();
            result.StatusCode = HttpStatusCode.OK;
            dynamic gridObj = Newtonsoft.Json.JsonConvert.DeserializeObject(HttpContext.Current.Cache[cachekey].ToString());
            var gridObjwithUserFields = Models.Magic_Grids.AddGridUserFields(gridName, gridObj, masterGridName);
            result.Content = new ByteArrayContent(Helpers.Utils.CompressString(gridObjwithUserFields));
            result.Content.Headers.Add("Content-Encoding", "gzip");
            return result;
        }

        private string replaceGridNameWithLayerGrid(string gridName) {
            string alternativeGrid = Magic_Grids.GetAltenativeGridForApplication(gridName);
            if (String.IsNullOrEmpty(alternativeGrid))
                return gridName;
            return alternativeGrid;
        }

        [HttpPost]
        public HttpResponseMessage GetByName(dynamic data)
        {
            MagicFramework.Helpers.SessionHandler.CheckAbortSessionAndRedirect();

            var result = new HttpResponseMessage();

            try
            {
                #region init
                //Se il layer e' popolato mostro solo le colonne del layer se showlayeronly e'  a true 
                //(griglia di estensione che non e' root), se e' false le mostro tutte (colonne con layer a null + colonne del layer specifiche)
                bool? showlayeronly = (bool?)data.showlayeronly;
                if (showlayeronly == null)
                    showlayeronly = false;
                string requestedGridName = data.id.ToString();
                string id = replaceGridNameWithLayerGrid(requestedGridName); //check if this grid for this application has to be replaced by another
                //if a replacement occured i will add a new property to grid the config
                string masterGridName = requestedGridName != id ? requestedGridName : null;
                string function = data.functionname == "" ? 0 : data.functionname;
                int? functionid;
                Guid functionGUID;
                if (Guid.TryParseExact(data.functionid.ToString(), "D", out functionGUID))
                    functionid = Models.Magic_Functions.GetIDFromGUID(functionGUID);
                else
                    functionid = data.functionid;
                //gets the layer in case of function or application layer. If it returns 0 it means there's no layer defined anywhere at a definition level.  this is not the AlternativeLayer implementation (reftree master grid concept)
                int layerid = Models.Magic_Grids.setLayerId(id, data);
                string cachekey = MagicFramework.Helpers.CacheHandler.getGridKey(id,functionid.ToString(),layerid.ToString());
                #endregion
                List<Data.Magic_ColumnsFunctionOverrides> coloverrides = (from e in _context.Magic_ColumnsFunctionOverrides where e.Function_ID == functionid && e.Magic_Columns.Magic_Grids.MagicGridName == id select e).ToList();
                if (HttpContext.Current.Cache[cachekey] != null)
                {
                    return addUserFieldstoGrid(id, cachekey, masterGridName);
                }


                //caso in cui la API di creazione delle griglie getrootgrid sia stata chiamata programmaticamente (fuori dalla getrootfunction)
                if (functionid == -1 && function != "standard")
                {
                    functionid = (from e in _context.Magic_Functions where e.FunctionName == function select e.FunctionID).FirstOrDefault();
                    if (functionid == null)
                    {
                        functionid = (from e in _context
                                          .Magic_FunctionsLabels
                                      where e.Magic_Culture_ID == MagicFramework.Helpers.SessionHandler.UserCulture && e.FunctionName == function
                                      select e.Function_ID).FirstOrDefault();
                    }
                }

                string jsongrid = String.Empty;
                Data.Magic_TemplateScriptsBuffer info;
                //se la griglia e' gia' risolta la prendo in formato JSON la deserializzo e ritorno al client senza ricostruirla
                if (function == "standard")
                {
                    info = (from e in _context.Magic_TemplateScriptsBuffer
                            where e.Magic_Grids.MagicGridName == id
                                    && e.Magic_Culture_ID == MagicFramework.Helpers.SessionHandler.UserCulture
                                    && e.Magic_Layer_ID == layerid
                            select e)
                                            .Where(d => d.Magic_Function_ID == null)
                                            .FirstOrDefault();
                    jsongrid = info != null ? info.Magic_Script : null;
                }
                else
                {
                    info = (from e in _context.Magic_TemplateScriptsBuffer
                            where e.Magic_Grids.MagicGridName == id
                                    && e.Magic_Culture_ID == MagicFramework.Helpers.SessionHandler.UserCulture
                                    && e.Magic_Layer_ID == layerid
                            select e)
                                            .Where(d => d.Magic_Function_ID == functionid)
                                            .FirstOrDefault();
                    jsongrid = info != null ? info.Magic_Script : null;
                }
                if (jsongrid != null)
                {
                    Models.v_Magic_Grids gridfromjson = new Models.v_Magic_Grids(jsongrid);

                    //add GUID to Magic_Script if missing
                    if (gridfromjson.GUID == null)
                    {
                        gridfromjson.GUID = info.Magic_Grids.GUID;
                        jsongrid = Newtonsoft.Json.JsonConvert.SerializeObject(gridfromjson);
                        info.Magic_Script = jsongrid;
                        _context.SubmitChanges();
                    }

                    HttpContext.Current.Cache.Insert(cachekey, jsongrid);
                    //handles target info of the grid (user columns and columnsOverwrites)
                    return addUserFieldstoGrid(id, cachekey, masterGridName);
                }

                var overriddengrid = (from e in _context.Magic_FunctionsGrids where e.Magic_Grids.MagicGridName == id && e.Magic_Functions.FunctionID == functionid select e).FirstOrDefault();


                var resobj = (from e in _context.v_Magic_Grids.Where(x => x.MagicGridName == id)
                              select new Models.v_Magic_Grids(e)).ToList();

                //cerco datasource specifici dato il layer 
                Models.Magic_Grids.ManageLayerDataSource(resobj, layerid, _context);

                if (overriddengrid != null)
                    Models.Magic_Grids.ManageOverrideProperties(resobj, overriddengrid);

                //Builds the buttons of grid's toolbar and rows
                Models.Magic_Grids.BuildCommands(resobj, id, functionid);

                Dictionary<int, string> managedCultures = _context.Magic_ManagedCultures.ToDictionary(_ => _.Magic_CultureID, _ => _.Magic_Cultures.Magic_CultureLanguage);
                List<int> applicationCultureIds = managedCultures.Select(_ => _.Key).ToList();
                var labels = (from e in _context.Magic_ColumnLabels
                                    .Where(x =>
                                        x.Magic_Grids.MagicGridName == id
                                        && applicationCultureIds.Contains(x.MagicCulture_ID))
                              select e).ToList();

                Dictionary<int, Dictionary<string, string>> cultureLabels = new Dictionary<int, Dictionary<string, string>>();
                foreach (var x in labels)
                {
                    if (!cultureLabels.ContainsKey(x.MagicCulture_ID))
                        cultureLabels[x.MagicCulture_ID] = new Dictionary<string, string>();
                    cultureLabels[x.MagicCulture_ID][x.Magic_Columns.ColumnName] = x.ColumnLabel;
                }

                //Build Transport string if necessary
                if (resobj[0].MagicGridTransport == null)
                    resobj[0].MagicGridTransport = Models.Magic_Grids.BuildTransport(resobj, overriddengrid);
                //Build Schema from MagicColumns if necessary
                var r = (from e in _context.v_Magic_Mmb_GridColumns.Where(x => x.MagicGridName == id)
                         select e).ToList();
                if (resobj[0].MagicGridModel == null)
                    resobj[0].MagicGridModel = Models.Magic_Grids.BuildModel(r, coloverrides);

                Dictionary<int, string> cultureIdmagicGridColumns = new Dictionary<int, string>();
                //Build Columns from MagicColumns if necessary
                if (resobj[0].MagicGridColumns == null)
                {
                    foreach (var cultureId in applicationCultureIds)
                    {
                        cultureIdmagicGridColumns[cultureId] = Models.Magic_Grids.BuildColumns(r, cultureLabels.ContainsKey(cultureId) ? cultureLabels[cultureId] : new Dictionary<string, string>(), resobj[0].MagicGridColumnsCommand, layerid, coloverrides, showlayeronly);
                    }
                }

                DateTime now = DateTime.Now;
                foreach (var cultureId in applicationCultureIds)
                {
                    resobj[0].MagicGridColumns = cultureIdmagicGridColumns.ContainsKey(cultureId) ? cultureIdmagicGridColumns[cultureId] : resobj[0].MagicGridColumns;
                    Data.Magic_TemplateScriptsBuffer sb = new Data.Magic_TemplateScriptsBuffer();
                    sb.Magic_Script = Newtonsoft.Json.JsonConvert.SerializeObject(resobj[0]);
                    sb.Magic_Template_ID = null;
                    sb.Magic_Grid_ID = resobj[0].MagicGrid_ID;
                    sb.Magic_Layer_ID = layerid;
                    if (function == "standard")
                        sb.Magic_Function_ID = null;
                    else
                        sb.Magic_Function_ID = functionid;
                    sb.Magic_Culture_ID = cultureId;
                    sb.Created = now;
                    _context.Magic_TemplateScriptsBuffer.InsertOnSubmit(sb);

                    jsongrid = Newtonsoft.Json.JsonConvert.SerializeObject(resobj[0]);

                    HttpContext.Current.Cache.Insert(MagicFramework.Helpers.CacheHandler.Grids + "Name:" + id + "_FunctionID:" + functionid.ToString() + "_CultureID:" + cultureId.ToString() + "_LayerID:" + layerid.ToString(), jsongrid);
                }
                //aggiungo nel buffer la griglia creata come JSON
                _context.SubmitChanges();

                return addUserFieldstoGrid(id, cachekey, masterGridName);
            }
            catch (Exception e)
            {
                result.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(e, MFLog.logtypes.ERROR);
                result.Content = new StringContent(genericError);
                return result;
            }
        }

        //[HttpPost]
        //public HttpResponseMessage GetByNameNew(dynamic data)
        //{
        //    MagicFramework.Helpers.SessionHandler.CheckAbortSessionAndRedirect();

        //    var result = new HttpResponseMessage();

        //    try
        //    {
        //        Dictionary<string, string> args = new Dictionary<string, string>();
        //        string id = data.id;
        //        //string function = data.functionname == "" ? 0 : data.functionname;
        //        int? functionid = data.functionid;
        //        if (functionid > 0)
        //            args.Add("functionID", functionid.ToString());
        //        if (data.layerid != null)
        //        {
        //            int? layerid = data.layerid;
        //            args.Add("layerID", layerid.ToString());
        //        }

        //        int culture = MagicFramework.Helpers.SessionHandler.UserCulture;
        //        args.Add("cultureID", culture.ToString());

        //        string applicationName = new MFConfiguration().GetApplicationNameFromFile(SessionHandler.ApplicationDomainURL);
        //        MongoConfigHandler mch = new MongoConfigHandler();
        //        var doc = mch.GetDocumentByName(id, "grids");

        //        MongoConfigHandler.DoOverwrites((BsonDocument)doc["data"], args);
        //        result.StatusCode = HttpStatusCode.OK;
        //        result.Content = new ByteArrayContent(Helpers.Utils.CompressString(doc["data"].ToJson(new MongoDB.Bson.IO.JsonWriterSettings { OutputMode = MongoDB.Bson.IO.JsonOutputMode.Strict })));
        //        result.Content.Headers.Add("Content-Encoding", "gzip");

        //        return result;
        //    }
        //    catch
        //    { return null; }
        //}
        //get a single object 
        [HttpGet]
        public List<Models.Magic_Grids> Get(int id)
        {
            var resobj = (from e in _context.Magic_Grids.Where(x => x.MagicGridID == id)
                          select new Models.Magic_Grids(e)).ToList();
            return resobj;
        }
        //The grid will call this method in read mode     
        [HttpPost]
        public Models.Response Select(Models.Request request)
        {
            try
            {
                Helpers.RequestParser rp = new Helpers.RequestParser(request);

                string order = "MagicGridName";
                string wherecondition = "1=1";
                if (request.filter != null)
                    wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Grids));

                if (String.IsNullOrEmpty(wherecondition))
                    wherecondition = "1=1";

                if (request.sort != null && request.sort.Count > 0)
                    order = rp.BuildOrderConditionForEF();
                bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
                var dbres = (from e in _context.Magic_Grids
                                                   .Where(wherecondition)
                                                   .Where(e => e.isSystemGrid == isSystem)
                                                   .OrderBy(order.ToString())
                                                   .Skip(request.skip)
                                                   .Take(request.take)
                             select new Models.Magic_Grids(e)).ToArray();


                return new Models.Response(dbres, _context.Magic_Grids.Where(wherecondition).Where(e => e.isSystemGrid == isSystem).Count());

            }
            catch (Exception ex) {
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                throw new ArgumentException(genericError);
            }
        }
        //The grid will call this method in update mode
        [HttpPost]
        public HttpResponseMessage PostU(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                SystemRightsChecker.checkSystemRights();
                // select the item from the database where the id

                var entityupdate = (from e in _context.Magic_Grids
                                    where e.MagicGridID == id
                                    select e).FirstOrDefault();

                if (entityupdate != null)
                {
                    if (data.EditableTemplate == "" || data.EditableTemplate == null)
                    {
                        data.EditJSFunction = null;

                    }
                    else
                    {
                        string nameedit = data.EditableTemplate;
                        var templateedit = (from e in _context.Magic_Templates where e.MagicTemplateName == nameedit select e).FirstOrDefault();
                        if (templateedit == null)
                            throw new System.ArgumentException("The inserted Editable Template does not exist");
                    }
                    if (data.DetailTemplate == "" || data.DetailTemplate == null)
                    {
                        data.DetailInitJSFunction = null;
                    }
                    else
                    {
                        string namedet = data.DetailTemplate;
                        var templatedet = (from e in _context.Magic_Templates where e.MagicTemplateName == namedet select e).FirstOrDefault();
                        if (templatedet == null)
                            throw new System.ArgumentException("The inserted Detail Template does not exist");

                    }
                    data.cfgModel = null;
                    var updID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Grids", false);

                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(entityupdate.Magic_TemplateScriptsBuffer);
                    Helpers.CacheHandler.EmptyCacheForPrefix(Helpers.CacheHandler.Grids);

                    _context.SubmitChanges();
                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(genericError);
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(genericError);
            }

            // return the HTTP Response.
            return response;
        }
        //The grid will call this method in insert mode
        [HttpPost]
        public Models.Response PostI(dynamic data)
        {
            try
            {
                int id = -1;

                if (data.EditableTemplate == null)
                    data.EditJSFunction = null;
                if (data.DetailTemplate == null)
                    data.DetailJSFunction = null;
                bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
                data.isSystemGrid = isSystem;
                data.cfgModel = null;
                var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Grids", false);
                int inserted = -1;
                foreach (var item in insID)
                {
                    inserted = int.Parse(item.modID.ToString());
                }

                var dbres = (from e in _context.Magic_Grids
                                                .Where("MagicGridID == " + inserted.ToString())
                             select new Models.Magic_Grids(e)).ToArray();

                var grid = (from e in _context.Magic_Grids
                                              .Where("MagicGridID == " + inserted.ToString())
                            select e).FirstOrDefault();

                _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(grid.Magic_TemplateScriptsBuffer);
                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                _context.SubmitChanges();

                // return the HTTP Response.
                return new Models.Response(dbres, dbres.Length);
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                throw new ArgumentException(genericError);
            }
        }
        [HttpPost]
        public HttpResponseMessage PostD(int id)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                SystemRightsChecker.checkSystemRights();
                // select the item from the database where the id
                var entitytodestroy = (from e in _context.Magic_Grids
                                       where e.MagicGridID == id
                                       select e).FirstOrDefault();

                if (entitytodestroy != null)
                {

                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(entitytodestroy.Magic_TemplateScriptsBuffer);
                    _context.Magic_Grids.DeleteOnSubmit(entitytodestroy);
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                    _context.SubmitChanges();
                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(genericError);
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(genericError);
            }

            // return the HTTP Response.
            return response;
        }
        [HttpGet]
        public HttpResponseMessage GetGUIDByName(string id)
        {
            var response = new HttpResponseMessage();
            try
            {
                response.StatusCode = HttpStatusCode.OK;
                var guid = Models.Magic_Grids.GetGUIDFromGridName(id);
                if (guid != null)
                    response.Content = new StringContent(guid.ToString());
                else
                    response.Content = new StringContent("");
            }
            catch (Exception e)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(genericError);
            }
            return response;
        }

        [HttpGet]
        public Models.Response GetImportableGrids()
        {
            try
            {
                MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());
                return mfApi.GetImportableGrids();
            }
            catch (Exception ex)
            {
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                throw new ArgumentException(genericError);
            }
        }

        [HttpGet]
        public HttpResponseMessage GetEditPage(string code)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                DataRow dr = Models.Magic_Grids.GetEditPage(code);
                JObject rowObj = JObject.FromObject(new { Code = dr["Code"].ToString(), Description = dr["Description"].ToString(), JsonDefinition = dr["JsonDefinition"].ToString() });
                response.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(rowObj));
                response.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(genericError);
            }
            return response;
        }

        [HttpPost]
        public HttpResponseMessage RefreshFormEditPagesData(dynamic data)
        {
            var response = new HttpResponseMessage();
            try
            {
                var gridId = data.MagicGridId;
                string gridName = data.MagicGridName;
                var layoutData = data.LayoutData;

                DataTable formDataTable = Models.Magic_Grids.GetEditFormData(gridName);

                for (int i = 0; i < formDataTable.Rows.Count; i++)
                {
                    DataRow row = formDataTable.Rows[i];
                    string rowName = row.Field<string>("ColumnName");
                    string unparsedMfExtension = row.Field<string>("MagicFormExtension");
                    
                    foreach (var field in layoutData)
                    {
                        if (string.Equals(rowName, field.name.Value))
                        {
                            JObject mfExtension = new JObject();               
                            mfExtension["row"] = field.row;
                            mfExtension["x"] = field.x;
                            mfExtension["bootstrapClass"] = field.bootstrapClass;
                            mfExtension["isApplied"] = field.isApplied;
                            mfExtension["isMagicFormLayout"] = field.isMagicFormLayout;
                            mfExtension["isKendoPopupLayout"] = field.isKendoPopupLayout;

                            bool hasCustomCSS = false;
                            if(field.numberOfRows != null)
                            {
                                mfExtension["numberOfRows"] = field.numberOfRows;
                            }
                            if (field.fontSize != null)
                            {
                                mfExtension["fontSize"] = field.fontSize;
                                hasCustomCSS = true;
                            }
                            if (field.fontWeight != null)
                            {
                                mfExtension["fontWeight"] = field.fontWeight;
                                hasCustomCSS = true;
                            }
                            if (field.fontStyle != null)
                            {
                                mfExtension["fontStyle"] = field.fontStyle;
                                hasCustomCSS = true;
                            }
                            if (field.fontVariantCaps != null)
                            {
                                mfExtension["fontVariantCaps"] = field.fontVariantCaps;
                                hasCustomCSS = true;
                            }
                            if (field.color != null)
                            {
                                mfExtension["color"] = field.color;
                                hasCustomCSS = true;
                            }
                            if (field.backgroundColor != null)
                            {
                                mfExtension["backgroundColor"] = field.backgroundColor;
                                hasCustomCSS = true;
                            }
                            if (field.shadow != null)
                            {
                                mfExtension["shadow"] = field.shadow;
                                hasCustomCSS = true;
                            }
                            if (field.textDecorationLine != null)
                            {
                                mfExtension["textDecorationLine"] = field.textDecorationLine;
                                mfExtension["textDecorationStyle"] = field.textDecorationStyle;
                                mfExtension["textDecorationColor"] = field.textDecorationColor;
                                hasCustomCSS = true;
                            }

                            mfExtension["hasCustomCSS"] = hasCustomCSS;
                            string parsedMfExtension = mfExtension.ToString();
                            Models.Magic_Grids.UpdateEditFormData((int)gridId.Value, field.name.Value, parsedMfExtension);
                        }
                    }
                }
                response.StatusCode = HttpStatusCode.OK;
                response.Content = new StringContent("{ \"msg\":\"OK\" }");
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(genericError);
            }
            return response;
        }
        [HttpGet]
        public HttpResponseMessage GetEditFormData(string magicgridname)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                DataTable dt = Models.Magic_Grids.GetEditFormData(magicgridname);
                if(dt.Rows.Count > 0) { 
                    response.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(dt.Rows[0].Table));
                } else
                {
                    response.Content = new StringContent("{ \"msg\":\"No FormEdit-Layout available.\" }");
                }
                response.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(genericError);
            }
            return response;
        }

        [HttpGet]
        public HttpResponseMessage GetGridLayoutData(int magicGridId)
        {

            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                DataTable dt = Models.Magic_Grids.GetGridLayoutData(magicGridId);
                response.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(dt.Rows[0].Table));
                response.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(genericError);
            }
            return response;
        }

        [HttpPost]
        public HttpResponseMessage SetColumnsOverwriteConfiguration(dynamic data) {
            var response = new HttpResponseMessage();
            try
            {
                var userID = MagicFramework.Helpers.SessionHandler.IdUser;
                switch(data.action.Value)
                {
                    case "insert":
                        Models.Magic_Grids.InsertColumnsOverwriteConfiguration(data.gridname.Value,data.configuration.Value, (int)data.active.Value, userID);
                            break;
                    case "update":
                        Models.Magic_Grids.UpdateColumnsOverwriteConfiguration(data.gridname.Value, data.configuration.Value, (int)data.active.Value, userID);
                        break;
                }
                response.StatusCode = HttpStatusCode.OK;
                response.Content = new StringContent("{ \"msg\":\"OK\" }");
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(genericError);
            }
            return response;
        }

        [HttpGet]
        public HttpResponseMessage GetColumnsOverwrites() {
            var response = new HttpResponseMessage();
            try
            {
                DataTable allOverwrites = Models.Magic_Grids.GetColumnsOverwriteConfigurations();
                if (allOverwrites.Rows.Count > 0)
                {
                    response.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(allOverwrites.Rows[0].Table));
                }
                else
                {
                    response.Content = new StringContent("{ \"msg\":\"No ColumnOverwrites available.\" }");
                }
                response.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                response.Content = new StringContent(genericError);
            }
            return response;
        }

        //[HttpPost]
        //public HttpResponseMessage PostDLayer(int id,dynamic data)
        //{
        //    // create a response message to send back
        //    var response = new HttpResponseMessage();

        //    try
        //    {
        //        SystemRightsChecker.checkSystemRights();
        //        // select the item from the database where the id
        //        var dbutils = new DatabaseCommandUtils("dbo.Magic_ApplicationLayers");
        //        XmlDocument xml = JsonUtils.DynamicToXmlInput_ins_upd_del(data, "destroy", "dbo.Magic_ApplicationLayers", id.ToString());
        //        MagicFramework.Helpers.DatabaseCommandUtils.updateresult updres = dbutils.callStoredProcedurewithXMLInputwithOutputPars(xml, "dbo.Magic_DeleteLayer_dml");
        //        MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
        //        response.StatusCode = HttpStatusCode.OK;
        //    }
        //    catch (Exception ex)
        //    {
        //        response.StatusCode = HttpStatusCode.InternalServerError;
        //        MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
        //        response.Content = new StringContent(genericError);
        //    }

        //    // return the HTTP Response.
        //    return response;
        //}
        
        [HttpGet]
        public Models.Response GetGridsForGridOverwrites(string gridname)
        {
            return Models.Magic_Grids.GetGridsByName(gridname);
        }

        [HttpGet]
        public async Task<IHttpActionResult> GetGridNavigationTabs(string id) {

            DataTable dt = Models.Magic_Grids.GetNavigationTabs(id);

            // Check if the DataTable is null or has no rows
            if (dt == null || dt.Rows.Count == 0)
            {
                return NotFound(); // Returns 404 Not Found if there are no results
            }

            // Return the DataTable directly
            return Ok(dt);

        }
    }
}
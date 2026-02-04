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
using MagicFramework.Helpers;
using MagicFramework.MemberShip;


namespace MagicFramework.Controllers
{
    public class Magic_TemplatesController : ApiController
    {


        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

        [HttpGet]
        public List<Models.Magic_Templates> GetCustomTemplates()
        {
            var resdb = (from e in _context.Magic_Templates where e.Magic_TemplateTypes.MagicTemplateType == "OTHERS" select new Models.Magic_Templates(e)).ToList();

            return resdb;
        }
        [HttpGet]
        public List<Models.Magic_Templates> GetDetailTemplates()
        {
            var resdb = (from e in _context.Magic_Templates where e.Magic_TemplateTypes.MagicTemplateType == "NAVIGATION" select new Models.Magic_Templates(e)).ToList();

            return resdb;
        }
        [HttpGet]
        public List<Models.Magic_Templates> GetEditableTemplates()
        {
            var resdb = (from e in _context.Magic_Templates where e.Magic_TemplateTypes.MagicTemplateType == "POPUPEDITOR" select new Models.Magic_Templates(e)).ToList();

            return resdb;
        }
        /// <summary>
        /// gets the templates associated to the request path if corresponding to Magic_Functions URL
        /// </summary>
        /// <param name="id">The window.location of the page hosting the function</param>
        /// <returns>x-kendo-template scripts to be appended to templatecontainerbuilder div</returns>
        [HttpGet]
        public string GetTemplateForUrl()
        {
            try
            {
                string templates = new Helpers.TemplateContainerBuilder().Filltemplatecontainer(HttpContext.Current.Request.UrlReferrer.LocalPath);
                return templates;

            }
            catch (Exception)
            {
                return null;
            }
        }

        [HttpGet]
        public string GetTemplateForFunction(int id)
        {
            try
            {
                string templates = new Helpers.TemplateContainerBuilder().FilltemplatecontainerForFunction(id);
                return templates;

            }
            catch (Exception)
            {
                return null;
            }
        }

        [HttpPost]
        public string GetTemplateByID(dynamic data)
        {
            int id = data.templateid;
            int? layerid = data.layerid;
            try
            {
                string template = new Helpers.TemplateContainerBuilder().FilltemplatecontainerByID(id, layerid);
                return template;

            }
            catch (Exception)
            {
                return null;
            }
        }

        [HttpPost]
        public HttpResponseMessage GetTemplateByName(dynamic data)
        {
            HttpResponseMessage res = new HttpResponseMessage { StatusCode = HttpStatusCode.OK };
            try
            {
                string templateName = (string)data.templateName;
                int? layerId = (int?)data.layerId;
                int functionId;
                int templateId = _context.Magic_Templates.Where(t => t.MagicTemplateName.Equals(templateName)).FirstOrDefault().MagicTemplateID;
                string template = new Helpers.TemplateContainerBuilder().FilltemplatecontainerByID(templateId, layerId);
                if(data.functionId != null && (int)data.functionId != 0)
                {
                    functionId = (int)data.functionId;
                    var function = _context.Magic_Functions.Where(_ => _.FunctionID.Equals(functionId)).FirstOrDefault();
                    if(function != null
                    && function.Magic_FunctionsTemplates
                        .Where(t =>
                            t.MagicFunction_ID.Equals(functionId)
                            && t.MagicTemplate_ID.Equals(templateId))
                        .FirstOrDefault() == null)
                    {
                        var functionTemplate = new Data.Magic_FunctionsTemplates();
                        functionTemplate.MagicFunction_ID = functionId;
                        functionTemplate.MagicTemplate_ID = templateId;
                        _context.Magic_FunctionsTemplates.InsertOnSubmit(functionTemplate);
                        _context.SubmitChanges();
                    }
                }
                res.Content = new StringContent(template);
            }
            catch (Exception e)
            {
                res.StatusCode = HttpStatusCode.InternalServerError;
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [HttpPost]
        public HttpResponseMessage RefreshTemplateToDb(dynamic data)
        {
            var response = new HttpResponseMessage();

            int grid = data.grid;
            int templateid = data.templateid;
            int layoutid = data.layoutid;
            int typeid = data.typeid;
            string table = data.table;

            string gridschema = (from e in _context.Magic_Grids where e.MagicGridID == grid select e).First().FromTable.Split('.')[0];

            try
            {
                string catalog = DBConnectionManager.getTargetDBName() + "." + gridschema; //passo anche il nome del DB es. MagicDB.dbo in modo da poter far riferimento all' INFORMATION SCHEMA giusto in fase di creazione
                _context.RefreshMagicTemplates(templateid, layoutid, typeid, grid, table, catalog);
                response.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("Failed with message -{0}", ex.Message));
            }
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent("{\"msg\":\"OK\" }");
            return response;
        }
        //get all elements of an entity
        [HttpGet]
        public List<Models.Magic_Templates> GetAll()
        {
            bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
            string wherecondition = "1=1";

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Templates
                          .Where(wherecondition)
                          .Where(e => e.isSystemTemplate == isSystem)
                         select new Models.Magic_Templates(e)).ToList();

            return resdb;

        }

        //get a single object 
        [HttpGet]
        public List<Models.Magic_Templates> Get(int id)
        {
            var resobj = (from e in _context.Magic_Templates.Where(x => x.MagicTemplateID == id)
                          select new Models.Magic_Templates(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode

        [HttpPost]
        public Models.Response Select(Models.Request request)
        {

            Helpers.RequestParser rp = new Helpers.RequestParser(request);

            string order = "MagicTemplateID";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Templates));


            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderConditionForEF();

            bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
            var dbres = (from e in _context.Magic_Templates
                                               .Where(wherecondition)
                                               .Where(e => e.isSystemTemplate == isSystem)
                                               .OrderBy(order.ToString())
                                               .Skip(request.skip)
                                               .Take(request.take)
                         select new Models.Magic_Templates(e)).ToArray();


            return new Models.Response(dbres, _context.Magic_Templates.Where(wherecondition).Where(e => e.isSystemTemplate == isSystem).Count());

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

                var entityupdate = (from e in _context.Magic_Templates
                                    where e.MagicTemplateID == id
                                    select e).FirstOrDefault();

                if (entityupdate != null)
                {
                    bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
                    data.isSystemTemplate = isSystem;
                    var updID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Templates", false);

                    var template = entityupdate.Magic_TemplateScriptsBuffer;
                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                    _context.SubmitChanges();


                    response.StatusCode = HttpStatusCode.OK;

                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(string.Format("The item with id Magic_Templates was not found in the database", id.ToString()));
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("The database updated failed: Magic_Templates", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }


        //The grid will call this method in insert mode

        [HttpPost]
        public Models.Response PostI(dynamic data)
        {

            int id = -1;
            bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
            data.isSystemTemplate = isSystem;
            var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Templates", false);
            int inserted = -1;
            foreach (var item in insID)
            {
                inserted = int.Parse(item.modID.ToString());
            }

            var dbres = (from e in _context.Magic_Templates
                                            .Where("MagicTemplateID == " + inserted.ToString())
                         select new Models.Magic_Templates(e)).ToArray();

            var entityinsert = (from e in _context.Magic_Templates
                                              .Where("MagicTemplateID == " + inserted.ToString())
                                select e).FirstOrDefault();
            var template = entityinsert.Magic_TemplateScriptsBuffer;
            _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

            _context.SubmitChanges();

            // return the HTTP Response.
            return new Models.Response(dbres, dbres.Length);

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

                var entitytodestroy = (from e in _context.Magic_Templates
                                       where e.MagicTemplateID == id
                                       select e).FirstOrDefault();

                if (entitytodestroy != null)
                {
                    _context.Magic_Templates.DeleteOnSubmit(entitytodestroy);

                    var template = entitytodestroy.Magic_TemplateScriptsBuffer;
                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);


                    _context.SubmitChanges();
                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(string.Format("The item with id {0} in Magic_Templates was not found in the database", id.ToString()));
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("Magic_Templates:The database delete failed with message -{0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }

    }
}
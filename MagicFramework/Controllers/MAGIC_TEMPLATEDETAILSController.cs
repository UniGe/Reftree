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
using System.Text.RegularExpressions;
using MagicFramework.Helpers.Sql;

namespace MagicFramework.Controllers
{
    public class Magic_TemplateDetailsController : ApiController
    {


        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

        [HttpPost]
        public Models.Response GetTempDetails_Culture(dynamic data)
        {
            //forms are loaded in general by v_Magic_TempDetails_Culture which is read with the magic connection. As an exception the form 
            //could have different sources with eventually different connections
            string tableName = "dbo.v_Magic_TempDetails_Culture";
            string tableNameFromView = data.table.Value;
            if (String.IsNullOrEmpty(tableNameFromView))
            {
                tableNameFromView = tableName;
            }
            MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetConnectionFor(tableNameFromView));
            return mfApi.GetTempDetails_Culture(tableNameFromView, data.MagicGridName.Value);
        }

        [HttpPost]
        public HttpResponseMessage PostMakeDetailVisible(dynamic data)
        {
            var response = new HttpResponseMessage();

            int functionid = data.functionid;
            int detailid = data.templatedetailid;
            bool visible = data.visible;

            var thedetail = (from e in _context.Magic_TemplateDetails where e.MagicTemplateDetailID == detailid select e).FirstOrDefault();
            bool? standardvisible = thedetail.Detailisvisible;
            var entity = (from e in _context.Magic_TemplateDetailsFunctionOverrides where e.MagicTemplateDetail_ID == detailid && e.Function_ID == functionid select e).FirstOrDefault();

            if (entity == null && standardvisible != visible)
            {
                var over = new Data.Magic_TemplateDetailsFunctionOverrides();
                over.Function_ID = functionid;
                over.MagicTemplateDetail_ID = detailid;
                over.IsvisibleforFunction = visible;
                _context.Magic_TemplateDetailsFunctionOverrides.InsertOnSubmit(over);
            }
            else
            {
                entity.IsvisibleforFunction = visible;
            }

            _context.SubmitChanges();
            MagicFramework.Helpers.TemplateContainerBuilder.setOverrideFlag((int)data.Function_ID, (int)thedetail.MagicTemplate_ID);


            response.StatusCode = HttpStatusCode.OK;

            return response;
        }

        [HttpPost]
        public HttpResponseMessage PostUpdateDetail(dynamic data)
        {
            var response = new HttpResponseMessage();

            int id = data.templatedetailid;

            var entity = (from e in _context.Magic_TemplateDetails where e.MagicTemplateDetailID == id select e).FirstOrDefault();
            entity.MagicDataSource = data.datasource;
            entity.MagicDataSourceTextField = data.textfield;
            entity.MagicDataSourceValueField = data.valuefield;
            string domid = data.datasource + "dd";
            entity.DetailDOMID = domid;

            var template = entity.Magic_Templates.Magic_TemplateScriptsBuffer;
            _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);




            int dataroleid = data.dataroleid;
            entity.MagicDataRole_ID = dataroleid;
            //int functionid = data.functionid;
            //var over = (from e in _context.Magic_TemplateDetailsFunctionOverrides where e.Function_ID == functionid && e.MagicTemplateDetail_ID == id select e).FirstOrDefault();


            //if (over == null)
            //{
            //    Data.Magic_TemplateDetailsFunctionOverrides ov = new Data.Magic_TemplateDetailsFunctionOverrides();
            //    ov.IsvisibleforFunction = true;
            //    ov.MagicTemplateDataRole_ID = dataroleid;
            //    ov.MagicTemplateDetail_ID = id;
            //    ov.Function_ID = functionid;
            //    _context.Magic_TemplateDetailsFunctionOverrides.InsertOnSubmit(ov);
            //}
            //else
            //{
            //        over.MagicTemplateDataRole_ID = dataroleid;
            //}

            _context.SubmitChanges();

            response.StatusCode = HttpStatusCode.OK;
            return response;
        }

        //Get Details by templateID
        [HttpGet]
        public List<Models.Magic_TemplateDetails> GetAllDetailsByTemplateID(int id)
        {

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_TemplateDetails.Where(x => x.MagicTemplate_ID == id)
                         select new Models.Magic_TemplateDetails(e)).ToList();

            return resdb;

        }

        //get all elements of an entity
        [HttpGet]
        public List<Models.Magic_TemplateDetails> GetAll()
        {
            string wherecondition = "1=1";

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_TemplateDetails
                          .Where(wherecondition)
                         select new Models.Magic_TemplateDetails(e)).ToList();

            return resdb;

        }

        //get a single object 
        [HttpGet]
        public List<Models.Magic_TemplateDetails> Get(int id)
        {
            var resobj = (from e in _context.Magic_TemplateDetails.Where(x => x.MagicTemplateDetailID == id)
                          select new Models.Magic_TemplateDetails(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode

        [HttpPost]
        public Models.Response Select(Models.Request request)
        {

            Helpers.RequestParser rp = new Helpers.RequestParser(request);

            string order = "MagicTemplateDetailID";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_TemplateDetails));


            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderCondition();

            var dbres = (from e in _context.Magic_TemplateDetails
                                               .Where(wherecondition)
                                               .OrderBy(order.ToString())
                                               .Skip(request.skip)
                                               .Take(request.take)
                         select new Models.Magic_TemplateDetails(e)).ToArray();


            return new Models.Response(dbres, _context.Magic_TemplateDetails.Where(wherecondition).Count());

        }
        //The grid will call this method in update mode
        [HttpPost]
        public HttpResponseMessage PostU(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                // select the item from the database where the id

                var entityupdate = (from e in _context.Magic_TemplateDetails
                                    where e.MagicTemplateDetailID == id
                                    select e).FirstOrDefault();

                if (entityupdate != null)
                {
                    if (data.MagicDataSource != null && data.MagicDataSource != "")
                        if (data.DetailDOMID == null || data.DetailDOMID == "")
                            data.DetailDOMID = data.MagicDataSource + "dd";

                    //se il widget e' la searchgrid forzo il DOMID a NOMECAMPO_binder in modo da avere coerenza con il datarole di magicframework 
                    if (data.MagicDataRole_ID != null && data.MagicDataRole_ID != 0)
                    {
                        int dataroleid = (int)data.MagicDataRole_ID;
                        var drole = (from e in _context.Magic_TemplateDataRoles where e.MagicTemplateDataRoleID == dataroleid select e).FirstOrDefault();
                        if (drole != null)
                        {
                            int colid = (int)data.DetailInheritsFromColumn_ID;

                            if (drole.MagicTemplateDataRole == "searchgrid" || drole.MagicTemplateDataRole == "searchgrid_multiselect")
                            {

                                var col = (from e in _context.Magic_Columns where e.MagicColumnID == colid select e).FirstOrDefault();

                                if (col != null)
                                    data.DetailDOMID = col.ColumnName + "_binder";
                            }
                            //if (drole.MagicTemplateDataRole.Contains("searchgrid"))
                            //{
                            //    string fileName = @"Incell\" + drole.MagicTemplateDataRole + ".html";
                            //    string filePath = TemplateContainerBuilder.GetCustomDatarolesPath() + fileName;
                            //    if (!System.IO.File.Exists(filePath))
                            //    {
                            //        filePath = TemplateContainerBuilder.GetDefaultDatarolesPath() + fileName;
                            //        if (!System.IO.File.Exists(filePath))
                            //            filePath = null;
                            //        else
                            //            filePath = TemplateContainerBuilder.GetDefaultDatarolesPath("/") + fileName;
                            //    }
                            //    else
                            //    {
                            //        filePath = TemplateContainerBuilder.GetCustomDatarolesPath("/") + fileName;
                            //    }
                            //    if (filePath != null)
                            //    {
                            //        var tcb = new Helpers.TemplateContainerBuilder(true);
                            //        Dictionary<string, string> tags = new Dictionary<string, string>
                            //            {
                            //                { "data", RemoveEmptyStringFormatPlaceHolders(tcb.CreateDetailTemplate(entityupdate, "", CreateFakePlaceholderJSArray(11))) },
                            //                { "templatePath", filePath.Replace("\\", "/") }
                            //            };
                            //        entityupdate.Magic_Columns.Columns_EditorFunction = GetStandardColumnJSFunctionString(tags);
                            //    }
                            //}
                            if (drole.MagicTemplateDataRole.Contains("upload"))
                            {

                                var col = (from e in _context.Magic_Columns where e.MagicColumnID == colid select e).FirstOrDefault();

                                if (col != null)
                                {
                                    col.Columns_template = "uploadColumnTemplate(\"" + col.ColumnName + "\", model)";
                                    col.Columns_EditorFunction = "kendoUploadInCellEditor";
                                }
                            }
                        }
                    }

                    var updID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateDetails", false);
                    var template = entityupdate.Magic_Templates.Magic_TemplateScriptsBuffer;
                    var grid = entityupdate.Magic_Columns.Magic_Grids.Magic_TemplateScriptsBuffer;
                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(grid);
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                    _context.SubmitChanges();
                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(string.Format("The item with id Magic_TemplateDetails was not found in the database", id.ToString()));
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("The database updated failed: Magic_TemplateDetails", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }

        public static string GetStandardColumnJSFunctionString(Dictionary<string, string> tags, string fileName = "DefaultColumnEdit.js")
        {
            return Utils.ReplaceTags(System.IO.File.ReadAllText(TemplateContainerBuilder.GetDefaultDatarolesPath() + @"Incell\" + fileName), tags);
        }

        public static string CreateFakePlaceholderJSArray(int length)
        {
            string array = "[";
            for (int i = 0; i < length; i++)
            {
                array += "\"{" + i + "}\"";
                if (i != length - 1)
                    array += ",";
            }
            return array + "]";
        }

        public static string RemoveEmptyStringFormatPlaceHolders(string JSArrayString)
        {
            return Regex.Replace(JSArrayString, @"{[\d]+}", "");
        }

        //The grid will call this method in insert mode

        [HttpPost]
        public Models.Response PostI(dynamic data)
        {

            int id = -1;

            if (data.MagicDataSource != null && data.MagicDataSource != "")
                if (data.DetailDOMID == null || data.DetailDOMID == "")
                    data.DetailDOMID = data.MagicDataSource + "dd";

            var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateDetails", false);
            int inserted = -1;
            foreach (var item in insID)
            {
                inserted = int.Parse(item.modID.ToString());
            }

            var dbres = (from e in _context.Magic_TemplateDetails
                                            .Where("MagicTemplateDetailID == " + inserted.ToString())
                         select new Models.Magic_TemplateDetails(e)).ToArray();
            var entityinsert = (from e in _context.Magic_TemplateDetails
                                              .Where("MagicTemplateDetailID == " + inserted.ToString())
                                select e).FirstOrDefault();
            var template = entityinsert.Magic_Templates.Magic_TemplateScriptsBuffer;
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

                var entitytodestroy = (from e in _context.Magic_TemplateDetails
                                       where e.MagicTemplateDetailID == id
                                       select e).FirstOrDefault();

                if (entitytodestroy != null)
                {
                    _context.Magic_TemplateDetails.DeleteOnSubmit(entitytodestroy);
                    var template = entitytodestroy.Magic_Templates.Magic_TemplateScriptsBuffer;
                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                    _context.SubmitChanges();
                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(string.Format("The item with id {0} in Magic_TemplateDetails was not found in the database", id.ToString()));
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("Magic_TemplateDetails:The database delete failed with message -{0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }


    }
}
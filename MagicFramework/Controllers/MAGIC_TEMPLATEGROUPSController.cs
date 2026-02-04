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
    public class Magic_TemplateGroupsController : ApiController
    {


        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

        //get all the groups belonging to a certain TemplateID

        [HttpGet]
        public List<Models.Magic_TemplateGroups> GetAllGroupsByTemplateID(int id)
        {

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_TemplateGroups.Where(x => x.MagicTemplate_ID == id)
                         select new Models.Magic_TemplateGroups(e)).ToList();

            return resdb;

        }
        //get all the groups belonging to a certain navigation Template given the Edit Template

        [HttpGet]
        public List<Models.Magic_TemplateGroups> GetAllNavGroupsByTemplateID(int id)
        {

            var edittemplate = (from e in _context.Magic_Templates.Where(x => x.MagicTemplateID == id) select e).FirstOrDefault();

            var detailtemplate = (from e in _context.Magic_Grids where e.EditableTemplate == edittemplate.MagicTemplateName select e.DetailTemplate).FirstOrDefault();

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_TemplateGroups.Where(x => x.Magic_Templates.MagicTemplateName == detailtemplate)
                         select new Models.Magic_TemplateGroups(e)).ToList();

            return resdb;

        }



        //get all elements of an entity
        [HttpGet]
        public List<Models.Magic_TemplateGroups> GetAll()
        {
            string wherecondition = "1=1";

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_TemplateGroups
                          .Where(wherecondition)
                         select new Models.Magic_TemplateGroups(e)).ToList();

            return resdb;

        }

        //get a single object 
        [HttpGet]
        public List<Models.Magic_TemplateGroups> Get(int id)
        {
            var resobj = (from e in _context.Magic_TemplateGroups.Where(x => x.MagicTemplateGroupID == id)
                          select new Models.Magic_TemplateGroups(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode

        [HttpPost]
        public Models.Response Select(Models.Request request)
        {

            Helpers.RequestParser rp = new Helpers.RequestParser(request);

            string order = "MagicTemplateGroupID";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_TemplateGroups));


            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderCondition();


            var dbres = (from e in _context.Magic_TemplateGroups
                                               .Where(wherecondition)
                                               .OrderBy(order.ToString())
                                               .Skip(request.skip)
                                               .Take(request.take)
                         select new Models.Magic_TemplateGroups(e)).ToArray();


            return new Models.Response(dbres, _context.Magic_TemplateGroups.Where(wherecondition).Count());

        }
        /// <summary>
        /// This method recusively updates the list of templates linked to the functions when a new Grid is appended to a Tab inside a navigation template (i.e: if i add the orders grid to the customer 
        /// Grid in the MagicTemplateGroups section of the Customer's Navigation Template i will append the Orders' templates to all the functions containing the customer grid.
        /// </summary>
        public void rebuildalltemplatefunctions(int templateID)
        {

            bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();

            var functions = (from e in _context.Magic_FunctionsTemplates
                             where e.Magic_Functions.isSystemFunction == isSystem && e.MagicTemplate_ID == templateID
                             select e.MagicFunction_ID).Distinct();
            var builder = new BUILDFUNCTIONTREEController();

            foreach (var f in functions)
            {
                var json = builder.RefreshFunctionTemplateList((int)f, "create", null);
            }
        }
        [HttpPost]
        public HttpResponseMessage PostInsertGroupFunctionOverride(dynamic data)
        {
            var response = new HttpResponseMessage();

            int functionid = data.functionid;
            int groupid = data.templategroupid;
            bool visible = true;
            if (data.visible != null)
                visible = (bool)data.visible;
            string filter = data.filterforgrid;

            var thegroup = (from e in _context.Magic_TemplateGroups where e.MagicTemplateGroupID == groupid select e).FirstOrDefault();


            if (filter != "N/A")
                thegroup.BindedGridFilter = filter;

            if (functionid != -1)
            {
                bool? standardvisible = thegroup.Groupisvisible;
                var entity = (from e in _context.Magic_TemplateGroupsFunctionOverrides where e.MagicTemplateGroup_ID == groupid && e.Function_ID == functionid select e).FirstOrDefault();

                if (entity == null && standardvisible != visible)
                {
                    var over = new Data.Magic_TemplateGroupsFunctionOverrides();
                    over.Function_ID = functionid;
                    over.IsvisibleforFunction = visible;
                    over.MagicTemplateGroup_ID = groupid;
                    _context.Magic_TemplateGroupsFunctionOverrides.InsertOnSubmit(over);
                }
                else if (entity != null && entity.IsvisibleforFunction != visible)
                {
                    entity.IsvisibleforFunction = visible;
                }

                var template = thegroup.Magic_Templates.Magic_TemplateScriptsBuffer;
                _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

            }

            _context.SubmitChanges();
            MagicFramework.Helpers.TemplateContainerBuilder.setOverrideFlag((int)data.functionid, (int)thegroup.MagicTemplate_ID);


            response.StatusCode = HttpStatusCode.OK;

            return response;
        }
        [HttpPost]
        public HttpResponseMessage PostLinkDetailToGroup(dynamic data)
        {
            var response = new HttpResponseMessage();

            int detid = data.templatedetailid;
            int groupid = data.templategroupid;

            var entity = (from e in _context.Magic_TemplateDetails where e.MagicTemplateDetailID == detid select e).FirstOrDefault();

            entity.MagicTemplateGroup_ID = groupid;

            var template = entity.Magic_Templates.Magic_TemplateScriptsBuffer;
            _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);



            _context.SubmitChanges();

            response.StatusCode = HttpStatusCode.OK;

            return response;

        }

        [HttpPost]
        public int PostLinkGroupToTemplate(dynamic data)
        {
            string tabname = data.tabname;
            int templateid = data.templateid;
            string contenttype = data.contenttype;

            int contentid = (from e in _context.Magic_TemplateGroupContent where e.MagicTemplateGroupContentType == contenttype select e).FirstOrDefault().MagicTemplateGroupContentID;

            Data.Magic_TemplateGroups newg = new Data.Magic_TemplateGroups();

            newg.MagicTemplateGroupLabel = tabname;
            newg.MagicTemplate_ID = templateid;
            newg.MagicTemplateGroupContent_ID = contentid;
            newg.Groupisvisible = true;
            newg.BindedGrid_ID = data.gridid == "" ? null : data.gridid;
            newg.BindedGridHideFilterCol = true;
            newg.BindedGridFilter = data.filter.ToString();

            _context.Magic_TemplateGroups.InsertOnSubmit(newg);
            _context.SubmitChanges();
            if (contenttype == "GRID")
            {
                rebuildalltemplatefunctions(templateid);
            }
            int id = newg.MagicTemplateGroupID;

            var template = newg.Magic_Templates.Magic_TemplateScriptsBuffer;
            _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

            _context.SubmitChanges();

            return id;
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

                var entityupdate = (from e in _context.Magic_TemplateGroups
                                    where e.MagicTemplateGroupID == id
                                    select e).FirstOrDefault();

                if (entityupdate != null)
                {
                    int? oldgrid = entityupdate.BindedGrid_ID;
                    int? newgrid = (data.BindedGrid_ID == 0) ? null : (int?)data.BindedGrid_ID;

                    _context.MagicServerSideCheck("Magic_TemplateGroups", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "UPDATE", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);

                    var updID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateGroups", false);

                    Models.Magic_Grids.DeleteTemplateScritpsBuffersOnChangeTemplateGroup(id);

                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);


                    if (oldgrid != newgrid)
                    {
                        int templateid = (int)entityupdate.MagicTemplate_ID;
                        rebuildalltemplatefunctions(templateid);
                    }
                    _context.SubmitChanges();
                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(string.Format("The item with id Magic_TemplateGroups was not found in the database", id.ToString()));
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format(ex.Message));
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
                _context.MagicServerSideCheck("Magic_TemplateGroups", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
                var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateGroups", false);
                int inserted = -1;
                foreach (var item in insID)
                {
                    inserted = int.Parse(item.modID.ToString());
                }

                var dbres = (from e in _context.Magic_TemplateGroups
                                                .Where("MagicTemplateGroupID == " + inserted.ToString())
                             select new Models.Magic_TemplateGroups(e)).ToArray();
                var entityinsert = (from e in _context.Magic_TemplateGroups
                                                    .Where("MagicTemplateGroupID == " + inserted.ToString())
                                    select e).FirstOrDefault();
                
                int? newgrid = entityinsert.BindedGrid_ID;

               
                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                Models.Magic_Grids.DeleteTemplateScritpsBuffersOnChangeTemplateGroup(inserted);

                if (newgrid != null)
                {
                    int templateid = (int)entityinsert.MagicTemplate_ID;
                    rebuildalltemplatefunctions(templateid);
                    
                }
               
                _context.SubmitChanges();
                // return the HTTP Response.
                return new Models.Response(dbres, dbres.Length);
            }
            catch (Exception ex)
            {
                return new MagicFramework.Models.Response(ex.Message);
            }
        }

        public void DeleteNavigationTabIntoEditTemplateAsField(int id)
        {
            var templatemodified = (from e in _context.Magic_TemplateGroups where e.MagicTemplateGroupID == id select e.Magic_Templates).FirstOrDefault();
            if (templatemodified.Magic_TemplateTypes.MagicTemplateType == "NAVIGATION")
            {
                var editabletemplates = (from e in _context.Magic_Grids where e.DetailTemplate == templatemodified.MagicTemplateName select e.EditableTemplate);
                foreach (var editabletemplate in editabletemplates)
                {
                    var editabletemplateobj = (from e in _context.Magic_Templates where e.MagicTemplateName == editabletemplate select e).FirstOrDefault();
                    if (editabletemplateobj != null)
                        if ((editabletemplateobj.Magic_TemplateDetails.Where(x => x.DetailInheritsFromGroup_ID == id).Count() > 0))
                        {
                            //cancello tutte le colonne ed i dettagli dei templates di edit relativi al Tab di navigabilita' indicato (DetailInheritsFromGroup_ID) 
                            var details = editabletemplateobj.Magic_TemplateDetails.Where(x => x.DetailInheritsFromGroup_ID == id);


                            foreach (var d in details)
                            {
                                var c = d.Magic_Columns;
                                _context.Magic_TemplateDetails.DeleteOnSubmit(d);
                                _context.Magic_Columns.DeleteOnSubmit(c);

                            }
                        }
                }
            }

            _context.SubmitChanges();

        }

        public void UpdateNavigationTabIntoEditTemplateAsField(int id)
        {
            var templatemodified = (from e in _context.Magic_TemplateDetails where e.DetailInheritsFromGroup_ID == id select e.Magic_Templates).ToList();
            foreach (var t in templatemodified)
            {
                var templatebuffer = t.Magic_TemplateScriptsBuffer;
                _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(templatebuffer);
            }
            _context.SubmitChanges();
        }
        public void InsertNavigationTabIntoEditTemplateAsField(int id)
        {
            Data.Magic_TemplateGroups navigationtab = (from e in _context.Magic_TemplateGroups where e.MagicTemplateGroupID == id select e).FirstOrDefault();
            Data.Magic_Templates templatemodified = navigationtab.Magic_Templates;

            if (templatemodified.Magic_TemplateTypes.MagicTemplateType == "NAVIGATION")
            {
                var editabletemplates = (from e in _context.Magic_Grids where e.DetailTemplate == templatemodified.MagicTemplateName select e.EditableTemplate);
                foreach (var editabletemplate in editabletemplates)
                {

                    var editabletemplateobj = (from e in _context.Magic_Templates where e.MagicTemplateName == editabletemplate select e).FirstOrDefault();
                    if ((editabletemplateobj.Magic_TemplateDetails.Where(x => x.DetailInheritsFromGroup_ID == id).Count() == 0))
                    {
                        Data.Magic_Columns c = new Data.Magic_Columns();
                        c.ColumnName = "VirtualColumn";
                        c.Columns_label = "VirtualColumn";
                        c.Columns_OrdinalPosition = 1000;
                        c.Columns_visibleingrid = false;
                        c.Layer_ID = null;
                        c.MagicGrid_ID = (int)editabletemplateobj.BaseGrid_ID;
                        c.Schema_editable = true;
                        c.Schema_type = "text";


                        Data.Magic_TemplateDetails td = new Data.Magic_TemplateDetails();
                        td.DetailInheritsFromGroup_ID = id;
                        td.MagicTemplateGroup_ID = editabletemplateobj.Magic_TemplateGroups.FirstOrDefault().MagicTemplateGroupID;
                        td.Magic_Columns = c;
                        td.MagicTemplate_ID = editabletemplateobj.MagicTemplateID;
                        td.Detailisvisible = true;
                        string gridname = (from e in _context.Magic_Grids where e.MagicGridID == navigationtab.BindedGrid_ID select e.MagicGridName).FirstOrDefault();
                        td.DetailDOMID = gridname + "_binder";

                        int? dataroleid = (from e in _context.Magic_TemplateDataRoles where e.MagicTemplateDataRole == "DETAILGRID" select e.MagicTemplateDataRoleID).FirstOrDefault();
                        if (dataroleid != null)
                        {
                            td.MagicDataRole_ID = dataroleid;
                            _context.Magic_Columns.InsertOnSubmit(c);
                            _context.Magic_TemplateDetails.InsertOnSubmit(td);
                            var template = editabletemplateobj.Magic_TemplateScriptsBuffer;
                            _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                        }
                    }
                }
            }

            _context.SubmitChanges();
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

                var entitytodestroy = (from e in _context.Magic_TemplateGroups
                                       where e.MagicTemplateGroupID == id
                                       select e).FirstOrDefault();

                if (entitytodestroy != null)
                {
                    int? grid = entitytodestroy.BindedGrid_ID;

                    //se il tab e' anche visibile in popup 
                    if (entitytodestroy.IsVisibleInPopUp == true)
                    {
                        var dets = (from e in _context.Magic_TemplateDetails where e.DetailInheritsFromGroup_ID == entitytodestroy.MagicTemplateGroupID select e).ToList();
                        var cols = dets.Select(c => c.DetailInheritsFromColumn_ID).ToList();
                        //cancello le colonne virtuali e pulisco i buffer del template di edit in modo che lo ricostruisca
                        foreach (var c in cols)
                        {
                            //cancello la colonna 
                            var col = (from e in _context.Magic_Columns where e.MagicColumnID == c select e).FirstOrDefault();
                            _context.Magic_Columns.DeleteOnSubmit(col);
                        }
                        _context.Magic_TemplateDetails.DeleteAllOnSubmit(dets);
                        //cancello i buffer del template di edit
                        var edittemplatestoclear = dets.Select(h => h.MagicTemplate_ID).Distinct();
                        foreach (var et in edittemplatestoclear)
                        {
                            var tsb = (from e in _context.Magic_TemplateScriptsBuffer where e.Magic_Template_ID == et select e).FirstOrDefault();
                            _context.Magic_TemplateScriptsBuffer.DeleteOnSubmit(tsb);
                        }
                    }

                    _context.Magic_TemplateGroups.DeleteOnSubmit(entitytodestroy);
                    var template = entitytodestroy.Magic_Templates.Magic_TemplateScriptsBuffer;
                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                    if (grid != null)
                    {
                        int templateid = (int)entitytodestroy.MagicTemplate_ID;
                        rebuildalltemplatefunctions(templateid);
                    }
                    _context.SubmitChanges();
                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(string.Format("The item with id {0} in Magic_TemplateGroups was not found in the database", id.ToString()));
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("Magic_TemplateGroups:The database delete failed with message -{0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }

    }
}
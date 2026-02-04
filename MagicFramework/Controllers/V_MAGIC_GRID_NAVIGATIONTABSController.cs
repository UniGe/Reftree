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
using System.Reflection;
using MagicFramework.Helpers;
using MagicFramework.Helpers.Sql;

namespace MagicFramework.Controllers
{
    public class v_Magic_Grid_NavigationTabsController : ApiController
    {


        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
        static string groupVisibilityField = ApplicationSettingsManager.GetVisibilityField();
        PropertyInfo propertyInfo = typeof(Models.v_Magic_Grid_NavigationTabs).GetProperty(groupVisibilityField);

        //get all elements of an entity
        [HttpGet]
        public List<Models.v_Magic_Grid_NavigationTabs> GetAll()
        {
            string wherecondition = "1=1";

            if (propertyInfo != null)
            {
                wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.getWhereCondition("v_Magic_Grid_NavigationTabs", wherecondition);
            }


            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.v_Magic_Grid_NavigationTabs
                            .Where(wherecondition)
                         select new Models.v_Magic_Grid_NavigationTabs(e)).ToList();

            return resdb;

        }

        //get a single object 
        [HttpGet]
        public List<Models.v_Magic_Grid_NavigationTabs> Get(int id)
        {
            var resobj = (from e in _context.v_Magic_Grid_NavigationTabs.Where(x => x.MagicTemplateGroupID == id)
                          select new Models.v_Magic_Grid_NavigationTabs(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode

        [HttpPost]
        public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
        {

            MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);
            string order = "MagicTemplateGroupID";
            String wherecondition = "1=1";


            if (propertyInfo != null)
            {
                if (request.filter != null)
                {
                    wherecondition = rp.BuildWhereCondition(typeof(Data.v_Magic_Grid_NavigationTabs));
                }
                wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.getWhereCondition("v_Magic_Grid_NavigationTabs", wherecondition);
            }
            else {
                if (request.filter != null)
                {
                    wherecondition = rp.BuildWhereCondition(typeof(Models.v_Magic_Grid_NavigationTabs));
                }
            }

            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderCondition();

            var dbres = (from e in _context.v_Magic_Grid_NavigationTabs
                                               .Where(wherecondition)
                                               .OrderBy(order.ToString())
                                               .Skip(request.skip)
                                               .Take(request.take)
                         select new Models.v_Magic_Grid_NavigationTabs(e)).ToArray();

            return new MagicFramework.Models.Response(dbres, _context.v_Magic_Grid_NavigationTabs.Where(wherecondition).Count());
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
                        var mtgc = new Magic_TemplateGroupsController();
                        mtgc.rebuildalltemplatefunctions(templateid);
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
        public MagicFramework.Models.Response PostI(dynamic data)
        {

            try
            {
                int id = -1;
                _context.MagicServerSideCheck("Magic_TemplateGroups", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
                //cerco il template id sulla griglia di riferimento
                int? grid = data.MagicGridID;
                int? gridtemplateid = (from e in _context.v_Magic_Grids where e.MagicGridID == grid select e.NavigationTemplate_ID).FirstOrDefault();

                data.MagicTemplate_ID = gridtemplateid;

                if (gridtemplateid == null)
                    throw new System.ArgumentException("A Navigation Template must be assigned to the grid in order to add tabs. Edit the grid and fill the field DetailTemplate with the MagicTemplateName of the desired Template.");

                var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateGroups", false);
                int inserted = -1;
                foreach (var item in insID)
                {
                    inserted = int.Parse(item.modID.ToString());
                }

                if (data.Layer_ID != null && data.Layer_ID != "0")
                {
                    AltLayersQueries aq = new AltLayersQueries();
                    //insert data in AltLayers
                    aq.insertAltLayerTemplateGroup(inserted, data);
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
                    var mtgc = new Magic_TemplateGroupsController();
                    mtgc.rebuildalltemplatefunctions(templateid);
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



    }
}
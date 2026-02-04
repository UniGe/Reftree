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


namespace MagicFramework.Controllers
{
    public class V_MAGIC_MMB_MODULEMENULABELSController : ApiController
    {


        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());


        //get all elements of an entity
        [HttpGet]
        public List<Models.v_Magic_UIComponentsLabels> GetAll()
        {
            string wherecondition = "1=1";

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.v_Magic_UIComponentsLabels
                          .Where(wherecondition)
                         select new Models.v_Magic_UIComponentsLabels(e)).ToList();

            return resdb;

        }

        //get a single object 
        [HttpGet]
        public List<Models.v_Magic_UIComponentsLabels> Get(int id)
        {
            var resobj = (from e in _context.v_Magic_UIComponentsLabels.Where(x => x.ID == id)
                          select new Models.v_Magic_UIComponentsLabels(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode

        [HttpPost]
        public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
        {

            MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);

            string order = "defaultlabel";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Models.v_Magic_UIComponentsLabels));


            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderConditionForEF();
            bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
            var dbres = (from e in _context.Magic_GetModMenuLabels(isSystem)
                                               .Where(wherecondition)
                                               .OrderBy(order.ToString())
                                               .Skip(request.skip)
                                               .Take(request.take)
                         select e).ToArray();


            return new MagicFramework.Models.Response(dbres, _context.Magic_GetModMenuLabels(isSystem).Where(wherecondition).Count());

        }
        //The grid will call this method in update mode
        /// <summary>
        /// The postU method receives the data from the client and verifies if the translated labels are already present;
        /// if they are then the data is overwritten
        /// </summary>
        /// <param name="id">The ID associated to the GRID sending the data</param>
        /// <param name="data">The data which the GRID is sending to the server</param>
        /// <returns></returns>

        [HttpPost]
        public HttpResponseMessage PostU(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                String objectType = data.ObjectType.ToString().Split('|')[0];
                int ObjectID = (int)data.ObjectID;
                int CultureID = (int)data.Magic_CultureID;
                int? LayerID = null;
                if (data.Layer_ID != null)
                    LayerID = int.Parse(data.Layer_ID.ToString());
                int? Label_ID = null;
                if (data.Label_ID != null)
                    Label_ID = int.Parse(data.Label_ID.ToString());

                if (LayerID == 0) //front-end defaults to 0 for some reason
                    LayerID = null;

                switch (objectType.Trim())
                {

                    case "Type::Module":
                        if (Label_ID != null)
                        {
                            int labId = (int)Label_ID;
                            var moduleUpdate = (from e in _context.Magic_Mmb_ModuleLabels
                                                where e.ModuleLabel_ID == labId
                                                select e).FirstOrDefault();


                            string translation = data.translation;
                            if (String.IsNullOrEmpty(translation) || String.IsNullOrWhiteSpace(translation))
                            {
                                _context.Magic_Mmb_ModuleLabels.DeleteOnSubmit(moduleUpdate);
                            }
                            else
                                moduleUpdate.ModuleLabel = data.translation;
                            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
                            response.StatusCode = HttpStatusCode.OK;

                        }
                        else
                        {
                            Data.Magic_Mmb_ModuleLabel moduleLabelContext = new MagicFramework.Data.Magic_Mmb_ModuleLabel();
                            moduleLabelContext.Module_ID = ObjectID;
                            moduleLabelContext.Magic_Culture_ID = CultureID;
                            moduleLabelContext.ModuleLabel = data.translation;
                            moduleLabelContext.Layer_ID = LayerID;
                            _context.Magic_Mmb_ModuleLabels.InsertOnSubmit(moduleLabelContext);
                        }

                        break;

                    case "Type::Menu":
                        if (Label_ID != null)
                        {
                            int labId = (int)Label_ID;
                            var menuUpdate = (from e in _context.Magic_Mmb_MenuLabels
                                              where e.MenuLabelID == labId
                                              select e).FirstOrDefault();

                            string translation = data.translation;
                            if (String.IsNullOrEmpty(translation) || String.IsNullOrWhiteSpace(translation))
                            {
                                _context.Magic_Mmb_MenuLabels.DeleteOnSubmit(menuUpdate);
                            }
                            else
                                menuUpdate.MenuLabel = data.translation;
                            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
                            response.StatusCode = HttpStatusCode.OK;
                        }
                        else
                        {
                            Data.Magic_Mmb_MenuLabel menuLabelContext = new Data.Magic_Mmb_MenuLabel();
                            menuLabelContext.Menu_ID = ObjectID;
                            menuLabelContext.Magic_Culture_ID = CultureID;
                            menuLabelContext.MenuLabel = data.translation;
                            menuLabelContext.Layer_ID = LayerID;
                            _context.Magic_Mmb_MenuLabels.InsertOnSubmit(menuLabelContext);
                        }
                        break;
                    default:
                        break;
                }

                String defaultlabel = data.defaultlabel;


                switch (objectType.Trim())
                {


                    case "Type::Module":
                        var moduleTrans = (from e in _context.Magic_Mmb_ModuleLabels
                                           where ((e.ModuleLabel == null) && e.Magic_Culture_ID == CultureID && e.Magic_Mmb_Modules.ModuleName == defaultlabel)
                                           select e);

                        foreach (var y in moduleTrans)
                        {
                            y.ModuleLabel = data.translation;
                        }
                        MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);

                        break;

                    case "Type::Menu":
                        var menuTrans = (from e in _context.Magic_Mmb_MenuLabels
                                         where ((e.MenuLabel == null) && e.Magic_Culture_ID == CultureID && e.Magic_Mmb_Menus.MenuLabel == defaultlabel)
                                         select e);

                        foreach (var y in menuTrans)
                        {
                            y.MenuLabel = data.translation;
                        }

                        MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);

                        break;

                }


                _context.SubmitChanges();
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("The database updated failed: {0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }

    }
}
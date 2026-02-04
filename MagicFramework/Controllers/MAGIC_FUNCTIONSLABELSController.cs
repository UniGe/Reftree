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
    public class Magic_FunctionsLabelsController : ApiController
    {


        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
        //get all elements of an entity
        [HttpGet]
        public List<Models.Magic_FunctionsLabels> GetAll()
        {
            string wherecondition = "1=1";

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_FunctionsLabels
                          .Where(wherecondition)
                         select new Models.Magic_FunctionsLabels(e)).ToList();

            return resdb;

        }

        //get a single object 
        [HttpGet]
        public List<Models.Magic_FunctionsLabels> Get(int id)
        {
            var resobj = (from e in _context.Magic_FunctionsLabels.Where(x => x.FunctionLabel_ID == id)
                          select new Models.Magic_FunctionsLabels(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode

        [HttpPost]
        public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
        {
            bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
            MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);

            string order = "ID";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Data.getManagedCulturesFunctionsResult));


            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderConditionForEF();

            var dbres = (from e in _context.getManagedCulturesFunctions(isSystem)
                                              .Where(wherecondition)
                                              .OrderBy(order.ToString())
                                              .Skip(request.skip)
                                              .Take(request.take)
                         select e).ToArray();


            return new MagicFramework.Models.Response(dbres, _context.getManagedCulturesFunctions(isSystem).Where(wherecondition).Count());

        }
        //The grid will call this method in update mode
        [HttpPost]
        public HttpResponseMessage PostU(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                int FunctionID = (int)data.FunctionID;
                int CultureID = (int)data.FunctionCultureID;
                int? Label_ID = null;
                if (data.Label_ID != null)
                    Label_ID = int.Parse(data.Label_ID.ToString());
                int? LayerID = null;
                if (data.Layer_ID != null)
                    LayerID = int.Parse(data.Layer_ID.ToString());
                if (LayerID == 0) //front-end defaults to 0 for some reason
                    LayerID = null;

                string functionNameTranslation = data.FunctionNameTrans;
                string functionDescriptionTranslation = data.FunctionDescriptionTrans;
                string functionHelpTranslation = data.FunctionHelpTrans;

                if (Label_ID != null)
                {
                    var functionUpdate = (from e in _context.Magic_FunctionsLabels
                                          where e.FunctionLabel_ID == Label_ID
                                          select e).FirstOrDefault();

                    if (String.IsNullOrEmpty(functionNameTranslation)
                        && String.IsNullOrEmpty(functionDescriptionTranslation)
                        && String.IsNullOrEmpty(functionHelpTranslation))
                        _context.Magic_FunctionsLabels.DeleteOnSubmit(functionUpdate);
                    else
                    {
                        functionUpdate.FunctionName = functionNameTranslation;
                        functionUpdate.FunctionDescription = functionDescriptionTranslation;
                        functionUpdate.FunctionHelp = functionHelpTranslation;
                        functionUpdate.Layer_ID = LayerID;
                    }
                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    Data.Magic_FunctionsLabel funcionLabelContext = new Data.Magic_FunctionsLabel();
                    funcionLabelContext.Function_ID = FunctionID;
                    funcionLabelContext.Magic_Culture_ID = CultureID;
                    funcionLabelContext.FunctionName = functionNameTranslation;
                    funcionLabelContext.FunctionDescription = functionDescriptionTranslation;
                    funcionLabelContext.FunctionHelp = functionHelpTranslation;
                    funcionLabelContext.Layer_ID = LayerID;
                    _context.Magic_FunctionsLabels.InsertOnSubmit(funcionLabelContext);
                }
                _context.SubmitChanges();
                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("The database updated failed: {0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }


        //The grid will call this method in insert mode

        //[HttpPost]
        //public MagicFramework.Models.Response PostI(dynamic data)
        //{
        //    try
        //    {
        //        _context.MagicServerSideCheck("Magic_FunctionsLabels", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
        //        int id = -1;
        //        var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_FunctionsLabels", false);
        //        int inserted = -1;
        //        foreach (var item in insID)
        //        {
        //            inserted = int.Parse(item.modID.ToString());
        //        }

        //        var dbres = (from e in _context.Magic_FunctionsLabels
        //                                        .Where("FunctionLabel_ID == " + inserted.ToString())
        //                     select new Models.Magic_FunctionsLabels(e)).ToArray();

        //        MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);
        //        return new MagicFramework.Models.Response(dbres, dbres.Length);
        //    }
        //    catch (Exception ex)
        //    {
        //        return new MagicFramework.Models.Response(ex.Message);
        //    }

        //}

        [HttpPost]
        public HttpResponseMessage PostD(int id)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                // select the item from the database where the id

                var entitytodestroy = (from e in _context.Magic_FunctionsLabels
                                       where e.FunctionLabel_ID == id
                                       select e).FirstOrDefault();

                if (entitytodestroy != null)
                {
                    _context.Magic_FunctionsLabels.DeleteOnSubmit(entitytodestroy);
                    _context.SubmitChanges();
                    response.StatusCode = HttpStatusCode.OK;
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);
                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(string.Format("The item with id {0} in Magic_FunctionsLabels was not found in the database", id.ToString()));
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("Magic_FunctionsLabels:The database delete failed with message -{0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }

    }
}
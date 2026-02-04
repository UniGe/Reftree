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
    public class Magic_FunctionsGridsController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_FunctionsGrids> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_FunctionsGrids
                          .Where(wherecondition)
                          select new Models.Magic_FunctionsGrids(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_FunctionsGrids> Get(int id)
        {
            var resobj = (from e in _context.Magic_FunctionsGrids.Where(x=> x.ID == id)
                          select new Models.Magic_FunctionsGrids(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           
          MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);

          string order = "ID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_FunctionsGrids));

       
          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderCondition();
       
          var dbres= (from e in _context.Magic_FunctionsGrids
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select new Models.Magic_FunctionsGrids(e)).ToArray();                       


           return new MagicFramework.Models.Response(dbres, _context.Magic_FunctionsGrids.Where(wherecondition).Count());
     
      }
          //The grid will call this method in update mode
      [HttpPost]
      public HttpResponseMessage PostU(int id,dynamic data)
      {         
          // create a response message to send back
          var response = new HttpResponseMessage();
        
                try
              {
                  // select the item from the database where the id
                  
                  var entityupdate = (from e in _context.Magic_FunctionsGrids
                                      where e.ID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                      data.cfgModel = null;
                      string detover = data.DetailTemplateOverride == null ? null : data.DetailTemplateOverride.ToString();
                      string editover = data.EditTemplateOverride == null ? null : data.EditTemplateOverride.ToString();

                      int dettempid = checkTemplateExistance(detover);
                      int edittempid = checkTemplateExistance(editover);

				     _context.MagicServerSideCheck("Magic_FunctionsGrids", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "UPDATE",MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_FunctionsGrids",false);
                     int functionid = (int)data.MagicFunction_ID;
                      if (dettempid!=-1)
                        insertOverridenAssociations(id, dettempid, functionid);
                      if (edittempid != -1)
                        insertOverridenAssociations(id, edittempid, functionid);
                     //svuoto il buffer di funzione 
                     var funct = (from e in _context.Magic_Functions where e.FunctionID == functionid select e).First();
                     _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(funct.Magic_TemplateScriptsBuffer);
                     MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                     MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);
                     //vado a inserire le associazioni dei template overridden se mancano  
                     _context.SubmitChanges();
                      response.StatusCode = HttpStatusCode.OK;
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id {0} Magic_FunctionsGrids was not found in the database", id.ToString()));
                  }
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
   
      [HttpPost]
      public MagicFramework.Models.Response PostI(dynamic data)
      {
           try
          {
              string detover = data.DetailTemplateOverride == null ? null : data.DetailTemplateOverride.ToString();
              string editover = data.EditTemplateOverride == null ? null : data.EditTemplateOverride.ToString();

              int dettempid = checkTemplateExistance(detover);
              int edittempid = checkTemplateExistance(editover);

              data.cfgModel = null;
	            _context.MagicServerSideCheck("Magic_FunctionsGrids", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "INSERT",MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
		        int id = -1;
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_FunctionsGrids",false);
                  
                  int functionid = (int)data.MagicFunction_ID;
                  //inserisco manualmente le associazioni tra i template in override e la funzione  
                  if (dettempid != -1)
                    insertOverridenAssociations(insID, dettempid, functionid);
                  if (edittempid != -1)
                    insertOverridenAssociations(insID, edittempid, functionid);
                    
                  var builder = new BUILDFUNCTIONTREEController();   
                  var json = builder.RefreshFunctionTemplateList(functionid,"create",null);
                 
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
        
                  var dbres  = (from e in _context.Magic_FunctionsGrids
                                                   .Where("ID == "+ inserted.ToString())
                                 select new Models.Magic_FunctionsGrids(e)).ToArray();
                  
               var funct = (from e in _context.Magic_Functions where e.FunctionID == functionid select e).First();
               _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(funct.Magic_TemplateScriptsBuffer);
               MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
               MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);
               _context.SubmitChanges();
               
        return new MagicFramework.Models.Response(dbres, dbres.Length);
		}
		catch (Exception ex) {
					return new MagicFramework.Models.Response(ex.Message);
		}
 
      }
     
       [HttpPost]
      public HttpResponseMessage PostD(int id)
      {
          // create a response message to send back
          var response = new HttpResponseMessage();

          try
          {
              // select the item from the database where the id

              var entitytodestroy = (from e in _context.Magic_FunctionsGrids
                                     where e.ID == id
                                     select e).FirstOrDefault();
              
              if (entitytodestroy != null)
              {
                  _context.Magic_FunctionsGrids.DeleteOnSubmit(entitytodestroy);
                  var builder = new BUILDFUNCTIONTREEController();
                  int functionid =(int)entitytodestroy.MagicFunction_ID;
                  var json = builder.RefreshFunctionTemplateList(functionid,"create",entitytodestroy.MagicGrid_ID);
                  _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(entitytodestroy.Magic_Grids.Magic_TemplateScriptsBuffer.Where(x=>x.Magic_Function_ID==functionid));
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_FunctionsGrids was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_FunctionsGrids:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }

       public int checkTemplateExistance(string templatename)
       {
           if (templatename == null || templatename.Trim() == "")
               return -1;

           int? templid = (from e in _context.Magic_Templates where e.MagicTemplateName == templatename select e.MagicTemplateID).FirstOrDefault();
           if (templid == null || templid == 0)
               throw new System.ArgumentException("Template Not Found:: " + templatename);
           else 
               return (int)templid;
       }

       public void insertOverridenAssociations(int id, int templateid, int functionid)
       {
           var currentfunctiongrid = (from e in _context.Magic_FunctionsGrids where e.ID == id select e).FirstOrDefault();
           if (currentfunctiongrid != null)
           {

               int associd = (from e in _context.Magic_FunctionsTemplates where e.MagicFunction_ID == functionid && e.MagicTemplate_ID == templateid select e.ID).Count();
               if (associd == 0)
               {
                   var assocdet = new Data.Magic_FunctionsTemplates();
                   assocdet.MagicTemplate_ID = templateid;
                   assocdet.MagicFunction_ID = functionid;
                   assocdet.ManualInsertion = true;
                   _context.Magic_FunctionsTemplates.InsertOnSubmit(assocdet);
               }
               
           }
       }      
    }
}
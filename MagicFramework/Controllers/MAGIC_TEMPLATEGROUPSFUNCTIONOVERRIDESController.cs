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
    public class Magic_TemplateGroupsFunctionOverridesController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
      
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_TemplateGroupsFunctionOverrides> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_TemplateGroupsFunctionOverrides
                          .Where(wherecondition)
                          select new Models.Magic_TemplateGroupsFunctionOverrides(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_TemplateGroupsFunctionOverrides> Get(int id)
        {
            var resobj = (from e in _context.Magic_TemplateGroupsFunctionOverrides.Where(x=> x.ID == id)
                          select new Models.Magic_TemplateGroupsFunctionOverrides(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           
          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "ID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_TemplateGroupsFunctionOverrides));

       
          if (request.sort != null)
              order = rp.BuildOrderCondition();
       
          var dbres= (from e in _context.Magic_TemplateGroupsFunctionOverrides
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select new Models.Magic_TemplateGroupsFunctionOverrides(e)).ToArray();                       


           return new Models.Response(dbres, _context.Magic_TemplateGroupsFunctionOverrides.Where(wherecondition).Count());
     
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
                  
                  var entityupdate = (from e in _context.Magic_TemplateGroupsFunctionOverrides
                                      where e.ID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateGroupsFunctionOverrides",false);
                     var template = entityupdate.Magic_TemplateGroups.Magic_Templates.Magic_TemplateScriptsBuffer;
                     _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                     MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                     _context.SubmitChanges();
                     MagicFramework.Helpers.TemplateContainerBuilder.setOverrideFlag((int)data.Function_ID, (int)entityupdate.Magic_TemplateGroups.MagicTemplate_ID);
                     
                      response.StatusCode = HttpStatusCode.OK;
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id {0} was not found in the database", id.ToString()));
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
      public Models.Response PostI(dynamic data)
      {
          
          int id = -1;
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateGroupsFunctionOverrides",false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
        
                  var dbres  = (from e in _context.Magic_TemplateGroupsFunctionOverrides
                                                   .Where("ID == "+ inserted.ToString())
                                 select new Models.Magic_TemplateGroupsFunctionOverrides(e)).ToArray();
                  var entityinsert = (from e in _context.Magic_TemplateGroupsFunctionOverrides
                                                        .Where("ID == " + inserted.ToString())
                                      select e).FirstOrDefault();
                  var template = entityinsert.Magic_TemplateGroups.Magic_Templates.Magic_TemplateScriptsBuffer;
                  _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                  _context.SubmitChanges();
                  MagicFramework.Helpers.TemplateContainerBuilder.setOverrideFlag((int)data.Function_ID, (int)entityinsert.Magic_TemplateGroups.MagicTemplate_ID);
                 
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
              // select the item from the database where the id

              var entitytodestroy = (from e in _context.Magic_TemplateGroupsFunctionOverrides
                                     where e.ID == id
                                     select e).FirstOrDefault();

              int functionID = (int)entitytodestroy.Function_ID;
              int templateID = (int)entitytodestroy.Magic_TemplateGroups.MagicTemplate_ID;

              if (entitytodestroy != null)
              {
                  _context.Magic_TemplateGroupsFunctionOverrides.DeleteOnSubmit(entitytodestroy);
                  var template = entitytodestroy.Magic_TemplateGroups.Magic_Templates.Magic_TemplateScriptsBuffer;
                  _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                  _context.SubmitChanges();
                  MagicFramework.Helpers.TemplateContainerBuilder.setOverrideFlag(functionID, templateID);
                 
                  
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_TemplateGroupsFunctionOverrides was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_TemplateGroupsFunctionOverrides:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
     
   
                
    }
}
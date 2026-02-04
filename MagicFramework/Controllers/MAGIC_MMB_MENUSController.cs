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
    public class Magic_Mmb_MenusController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
      
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_Mmb_Menus> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Mmb_Menus
                          .Where(wherecondition)
                          select new Models.Magic_Mmb_Menus(e)).ToList();

            return resdb;

        }


    [HttpGet]
    public List<Models.Magic_Mmb_Menus> GetAllParents()
    {
        string wherecondition = "1=1";

        // select from the database, skipping and taking the correct amount
        var resdb = (from e in _context.Magic_Mmb_Menus
                      .Where(wherecondition).Where(x => x.MenuIsParent == true)
                     select new Models.Magic_Mmb_Menus(e)).ToList();

        return resdb;

    }

    [HttpGet]
    public List<Models.Magic_Mmb_Menus> GetAllParentsOfModule(int id)
    {
        string wherecondition = "1=1";

        // select from the database, skipping and taking the correct amount
        var resdb = (from e in _context.Magic_Mmb_Menus
                      .Where(wherecondition).Where(x => x.MenuIsParent == true  && x.Magic_Mmb_Modules.ModuleID == id)  
                     select new Models.Magic_Mmb_Menus(e)).ToList();

        return resdb;

    }
	
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_Mmb_Menus> Get(int id)
        {
            var resobj = (from e in _context.Magic_Mmb_Menus.Where(x=> x.MenuID == id)
                          select new Models.Magic_Mmb_Menus(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           
          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "MenuID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Mmb_Menus));


          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderConditionForEF();
       
          var dbres= (from e in _context.Magic_Mmb_Menus
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select new Models.Magic_Mmb_Menus(e)).ToArray();                       


           return new Models.Response(dbres, _context.Magic_Mmb_Menus.Where(wherecondition).Count());
     
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
                  
                  var entityupdate = (from e in _context.Magic_Mmb_Menus
                                      where e.MenuID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                      _context.MagicServerSideCheck("Magic_Mmb_Menus", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "UPDATE", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
                      var updID = _context.Mmb_MenuFunctions_Save(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.IdUser, "Magic_Mmb_Menus", false);
                     response.StatusCode = HttpStatusCode.OK;
                     MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id Magic_Mmb_Menus was not found in the database", id.ToString()));
                  }
                  
              }
              catch (Exception ex)
              {
                   response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The database updated failed: Magic_Mmb_Menus", ex.Message));
              }
       
          // return the HTTP Response.
          return response;
      }


      //The grid will call this method in insert mode
   
      [HttpPost]
      public Models.Response PostI(dynamic data)
      {
          
          int id = -1;
          _context.MagicServerSideCheck("Magic_Mmb_Menus", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Mmb_Menus",false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
        
                  var dbres  = (from e in _context.Magic_Mmb_Menus
                                                   .Where("MenuID == "+ inserted.ToString())
                                 select new Models.Magic_Mmb_Menus(e)).ToArray();

                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
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

              var entitytodestroy = (from e in _context.Magic_Mmb_Menus
                                     where e.MenuID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.Magic_Mmb_Menus.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
                  //MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_Mmb_Menus was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_Mmb_Menus:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
                
    }
}
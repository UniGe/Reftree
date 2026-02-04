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
    public class Magic_Mmb_UsersProfilesController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
      
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_Mmb_UsersProfiles> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Mmb_UsersProfiles
                          .Where(wherecondition)
                          select new Models.Magic_Mmb_UsersProfiles(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_Mmb_UsersProfiles> Get(int id)
        {
            var resobj = (from e in _context.Magic_Mmb_UsersProfiles.Where(x=> x.ID == id)
                          select new Models.Magic_Mmb_UsersProfiles(e)).ToList();
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
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Mmb_UsersProfiles));


          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderCondition();
       
          var dbres= (from e in _context.Magic_Mmb_UsersProfiles
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select new Models.Magic_Mmb_UsersProfiles(e)).ToArray();                       


           return new Models.Response(dbres, _context.Magic_Mmb_UsersProfiles.Where(wherecondition).Count());
     
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
                  
                  var entityupdate = (from e in _context.Magic_Mmb_UsersProfiles
                                      where e.ID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Mmb_UsersProfiles",false);
                     response.StatusCode = HttpStatusCode.OK;
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id Magic_Mmb_UsersProfiles was not found in the database", id.ToString()));
                  }
              }
              catch (Exception ex)
              {
                   response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The database updated failed: Magic_Mmb_UsersProfiles", ex.Message));
              }
       
          // return the HTTP Response.
          return response;
      }


      //The grid will call this method in insert mode
   
      [HttpPost]
      public Models.Response PostI(dynamic data)
      {
          
          int id = -1;
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Mmb_UsersProfiles",false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
        
                  var dbres  = (from e in _context.Magic_Mmb_UsersProfiles
                                                   .Where("ID == "+ inserted.ToString())
                                 select new Models.Magic_Mmb_UsersProfiles(e)).ToArray();  
        
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

              var entitytodestroy = (from e in _context.Magic_Mmb_UsersProfiles
                                     where e.ID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.Magic_Mmb_UsersProfiles.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_Mmb_UsersProfiles was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_Mmb_UsersProfiles:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
     
                
    }
}
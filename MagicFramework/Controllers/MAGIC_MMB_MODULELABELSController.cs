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
    public class Magic_Mmb_ModuleLabelsController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
      
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_Mmb_ModuleLabels> GetAll()
        {
            string wherecondition = "1=1";
            wherecondition = "(" + wherecondition + ")";
			
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Mmb_ModuleLabels
                          .Where(wherecondition)
                          select new Models.Magic_Mmb_ModuleLabels(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_Mmb_ModuleLabels> Get(int id)
        {
            var resobj = (from e in _context.Magic_Mmb_ModuleLabels.Where(x=> x.ModuleLabel_ID == id)
                          select new Models.Magic_Mmb_ModuleLabels(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           
          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "ModuleLabel_ID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Mmb_ModuleLabels));

          //manage data visibility for the userID in the session           

          string groupFilterField = ApplicationSettingsManager.GetVisibilityField();
          wherecondition = "(" + wherecondition + ")";
     
          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderCondition();
       
          var dbres= (from e in _context.Magic_Mmb_ModuleLabels
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select new Models.Magic_Mmb_ModuleLabels(e)).ToArray();                       


           return new Models.Response(dbres, _context.Magic_Mmb_ModuleLabels.Where(wherecondition).Count());
     
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
                  
                  var entityupdate = (from e in _context.Magic_Mmb_ModuleLabels
                                      where e.ModuleLabel_ID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
					 _context.MagicServerSideCheck("Magic_Mmb_ModuleLabels", Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "UPDATE",Helpers.SessionHandler.UserVisibilityGroup);
                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Mmb_ModuleLabels",true);
                     response.StatusCode = HttpStatusCode.OK;
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id Magic_Mmb_ModuleLabels was not found in the database", id.ToString()));
                  }
              }
              catch (Exception ex)
              {
                   response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The database updated failed: Magic_Mmb_ModuleLabels", ex.Message));
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
				  _context.MagicServerSideCheck("Magic_Mmb_ModuleLabels", Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "INSERT",Helpers.SessionHandler.UserVisibilityGroup);
				  int id = -1;
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Mmb_ModuleLabels",true);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
        
                  var dbres  = (from e in _context.Magic_Mmb_ModuleLabels
                                                   .Where("ModuleLabel_ID == "+ inserted.ToString())
                                 select new Models.Magic_Mmb_ModuleLabels(e)).ToArray();  
        
          // return the HTTP Response.
        return new Models.Response(dbres, dbres.Length);
		}
		catch (Exception ex) {
					return new Models.Response(ex.Message);
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

              var entitytodestroy = (from e in _context.Magic_Mmb_ModuleLabels
                                     where e.ModuleLabel_ID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.Magic_Mmb_ModuleLabels.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_Mmb_ModuleLabels was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_Mmb_ModuleLabels:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
                
    }
}
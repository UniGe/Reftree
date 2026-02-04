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
using MagicFramework.Helpers.Sql;

namespace MagicFramework.Controllers
{
    public class Magic_Calendar_TaskTypesController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());

    [HttpPost]
        public Models.Response GetActionTaskTypeByActivityID(dynamic data)
        {
            MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());
            return mfApi.GetActionTaskType(data.ActivityID.Value);
        }

        //get all elements of an entity
    [HttpGet]
        public List<Models.Magic_Calendar_TaskTypes> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Calendar_TaskTypes
                          .Where(wherecondition)
                          select new Models.Magic_Calendar_TaskTypes(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_Calendar_TaskTypes> Get(int id)
        {
            var resobj = (from e in _context.Magic_Calendar_TaskTypes.Where(x=> x.taskTypeID == id)
                          select new Models.Magic_Calendar_TaskTypes(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
      {
           
          MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);

          string order = "taskTypeID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Calendar_TaskTypes));

       
          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderCondition();
       
          var dbres= (from e in _context.Magic_Calendar_TaskTypes
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take == 0 ? 2000 : request.take)                                            
                            select new Models.Magic_Calendar_TaskTypes(e)).ToArray();                       


           return new MagicFramework.Models.Response(dbres, _context.Magic_Calendar_TaskTypes.Where(wherecondition).Count());
     
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
                  
                  var entityupdate = (from e in _context.Magic_Calendar_TaskTypes
                                      where e.taskTypeID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
				     _context.MagicServerSideCheck("Magic_Calendar_TaskTypes", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "UPDATE",MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_Calendar_TaskTypes",false);
                     response.StatusCode = HttpStatusCode.OK;
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id Magic_Calendar_TaskTypes was not found in the database", id.ToString()));
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
	_context.MagicServerSideCheck("Magic_Calendar_TaskTypes", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "INSERT",MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
		int id = -1;
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_Calendar_TaskTypes",false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
        
                  var dbres  = (from e in _context.Magic_Calendar_TaskTypes
                                                   .Where("taskTypeID == "+ inserted.ToString())
                                 select new Models.Magic_Calendar_TaskTypes(e)).ToArray();  
        
      
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

              var entitytodestroy = (from e in _context.Magic_Calendar_TaskTypes
                                     where e.taskTypeID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.Magic_Calendar_TaskTypes.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_Calendar_TaskTypes was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_Calendar_TaskTypes:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
                
    }
}
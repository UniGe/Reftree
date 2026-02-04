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
using System.Data;

namespace MagicFramework.Controllers
{
    public class MAGIC_CALENDAR_TASKSTATUSController : ApiController
    {

      
      // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection()); 
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_Calendar_TaskStatus> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Calendar_TaskStatus
                          .Where(wherecondition)
                         select new Models.Magic_Calendar_TaskStatus(e)).ToList();

            return resdb;

        }
        [HttpGet]
        public List<ReturnFKitem> GetAvailableStatusesFK()
        {
            var dbutils = new DatabaseCommandUtils();
            DataSet ds = dbutils.GetDataSet(@"select CONVERT(VARCHAR(30),s.taskStatusID) as value, isnull(sl.Description,s.[Description]) as [text],s.*
                                                from[dbo].[Magic_Calendar_TaskStatus] s
                                                left join[dbo].[Magic_Calendar_TaskStatus_L] sl
                                                on sl.[Magic_Calendar_TaskStatus_ID] = s.taskStatusID
                                                and sl.[Culture_ID] = "+ SessionHandler.UserCulture.ToString() + @"
                                                ORDER BY [taskStatusID]");

            List<ReturnFKitem> fkitems = new List<ReturnFKitem>();
            foreach (DataRow r in ds.Tables[0].Rows)
            {
                fkitems.Add(new ReturnFKitem(r["value"].ToString(), r["text"].ToString(), null));
            }
            return fkitems;
        }
        [HttpGet]
        public DataRowCollection GetAvailableLocations()
        {
            var dbutils = new DatabaseCommandUtils();
            DataSet ds = dbutils.GetDataSet("SELECT * FROM Magic_CalendarLocations ORDER BY [Description]");
            return ds.Tables[0].Rows;
        }
        [HttpGet]
        public DataRowCollection GetAvailableStatuses()
        {
            var dbutils = new DatabaseCommandUtils();
            DataSet ds = dbutils.GetDataSet("SELECT * FROM Magic_Calendar_TaskStatus ORDER BY [taskStatusID]");
            return ds.Tables[0].Rows;
        }
        [HttpGet]
        public List<ReturnFKitem> GetAvailableLocationsFK()
        {
            var dbutils = new DatabaseCommandUtils();
            DataSet ds = dbutils.GetDataSet("SELECT CONVERT(VARCHAR(30),ID) as value, Description as [text],* FROM v_Magic_CalendarLocations ORDER BY [Description]");
            List<ReturnFKitem> fkitems = new List<ReturnFKitem>();
            foreach (DataRow r in ds.Tables[0].Rows)
            {
                fkitems.Add(new ReturnFKitem(r["value"].ToString(), r["text"].ToString(), null));
            }
            return fkitems;
        }

        //get a single object 
        [HttpGet]
    public List<Models.Magic_Calendar_TaskStatus> Get(int id)
        {
            var resobj = (from e in _context.Magic_Calendar_TaskStatus.Where(x => x.taskStatusID == id)
                          select new Models.Magic_Calendar_TaskStatus(e)).ToList();
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
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Calendar_TaskStatus));

       
          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderCondition();

          var dbres = (from e in _context.Magic_Calendar_TaskStatus
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take == 0 ? 2000 : request.take)
                       select new Models.Magic_Calendar_TaskStatus(e)).ToArray();                       


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

                  var entityupdate = (from e in _context.Magic_Calendar_TaskStatus
                                      where e.taskStatusID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                      _context.MagicServerSideCheck("Magic_Calendar_TaskStatus", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "UPDATE", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
                      var updID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_Calendar_TaskStatus", false);
                     response.StatusCode = HttpStatusCode.OK;
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                       response.Content = new StringContent(string.Format("The item with id Magic_Calendar_TaskStatus was not found in the database", id.ToString()));
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
              _context.MagicServerSideCheck("Magic_Calendar_TaskStatus", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
		int id = -1;
        var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_Calendar_TaskStatus", false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }

                  var dbres = (from e in _context.Magic_Calendar_TaskStatus
                                                   .Where("taskStatusID == "+ inserted.ToString())
                               select new Models.Magic_Calendar_TaskStatus(e)).ToArray();  
        
      
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

              var entitytodestroy = (from e in _context.Magic_Calendar_TaskStatus
                                     where e.taskStatusID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.Magic_Calendar_TaskStatus.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_Calendar_TaskStatus was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_Calendar_TaskStatus:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
                
    }
}
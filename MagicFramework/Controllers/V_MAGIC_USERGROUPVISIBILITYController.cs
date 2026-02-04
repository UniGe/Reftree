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
    public class v_Magic_UserGroupVisivilityController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
      
      //get all elements of an entity
	[HttpGet]
        public List<Models.v_Magic_UserGroupVisibility> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.v_Magic_UserGroupVisibility
                          .Where(wherecondition)
                          select new Models.v_Magic_UserGroupVisibility(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.v_Magic_UserGroupVisibility> Get(int id)
        {
            var resobj = (from e in _context.v_Magic_UserGroupVisibility.Where(x=> x.ID == id)
                          select new Models.v_Magic_UserGroupVisibility(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
      {

          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "ID";
          String wherecondition = "1=1";
          if (request.filter != null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.v_Magic_UserGroupVisibility));
          
          int network = MagicFramework.Helpers.SessionHandler.UserVisibilityNetwork;
          
          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderCondition();

          var dbres = (from e in _context.v_Magic_UserGroupVisibility
                                             .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                             .Skip(request.skip)
                                             .Take(request.take)
                            where (e.Network_ID == network)
                       select new Models.v_Magic_UserGroupVisibility(e)).ToArray();


          return new Models.Response(dbres, (from e in _context.v_Magic_UserGroupVisibility.Where(wherecondition) where (e.Network_ID == network) select e).Count());
     }

      public void updatelink(int groupid, int user)
      {
          var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
          var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(groupid.ToString() + ";" + user.ToString(), "GROUPHASUSER", dbhandler);

          if (result.Count > 0)  // relazione presente: la elimino
          {
              var result2 = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(groupid.ToString() + ";" + user.ToString(), "DELETEUSERFROMGROUP", dbhandler);
          }
          else   // relazione assente la inserisco
          {
              var result3 = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(groupid.ToString() + ";" + user.ToString(), "INSERTUSERINTOGROUP", dbhandler);
          }
      }

        //The grid will call this method in update mode
      [HttpPost]
      public HttpResponseMessage PostU(int id,dynamic data)
      {         
          // create a response message to send back
          var response = new HttpResponseMessage();
          int groupid = id;
          int userid = data.UserID;
        
                try
              {
                  updatelink(groupid, userid);
                  response.StatusCode = HttpStatusCode.OK;
              }
              catch (Exception ex)
              {
                   response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The database updated failed in User to Groups with error: {0}", ex.Message));
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
	_context.MagicServerSideCheck("v_Magic_UserGroupVisivility", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "INSERT",MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
		int id = -1;
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "v_Magic_UserGroupVisivility",false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
        
                  var dbres  = (from e in _context.v_Magic_UserGroupVisibility
                                                   .Where("selected == "+ inserted.ToString())
                                 select new Models.v_Magic_UserGroupVisibility(e)).ToArray();  
        
      
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

              var entitytodestroy = (from e in _context.v_Magic_UserGroupVisibility
                                     where e.ID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.v_Magic_UserGroupVisibility.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in v_Magic_UserGroupVisivility was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("v_Magic_UserGroupVisivility:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
                
    }
}
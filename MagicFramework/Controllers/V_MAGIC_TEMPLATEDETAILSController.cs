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
    public class v_Magic_TemplateDetailsController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
      //get a single object 
      [HttpGet]
      public List<Models.v_Magic_TemplateDetails> GetbyTemplateID(int id)
      {
          var resobj = (from e in _context.v_Magic_TemplateDetails.Where(x => x.MagicTemplate_ID == id)
                        select new Models.v_Magic_TemplateDetails(e)).ToList();
          return resobj;
      }
      //get all elements of an entity
	[HttpGet]
        public List<Models.v_Magic_TemplateDetails> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.v_Magic_TemplateDetails
                          .Where(wherecondition)
                          select new Models.v_Magic_TemplateDetails(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.v_Magic_TemplateDetails> Get(int id)
        {
            var resobj = (from e in _context.v_Magic_TemplateDetails.Where(x=> x.MagicTemplateDetailID == id)
                          select new Models.v_Magic_TemplateDetails(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           
          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "MagicTemplateDetailID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.v_Magic_TemplateDetails));


          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderConditionForEF();
       
          var dbres= (from e in _context.v_Magic_TemplateDetails
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select new Models.v_Magic_TemplateDetails(e)).ToArray();                       


           return new Models.Response(dbres, _context.v_Magic_TemplateDetails.Where(wherecondition).Count());
     
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
                  
                  var entityupdate = (from e in _context.v_Magic_TemplateDetails
                                      where e.MagicTemplateDetailID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "v_Magic_TemplateDetails",false);
                     response.StatusCode = HttpStatusCode.OK;
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id v_Magic_TemplateDetails was not found in the database", id.ToString()));
                  }
              }
              catch (Exception ex)
              {
                   response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The database updated failed: v_Magic_TemplateDetails", ex.Message));
              }
       
          // return the HTTP Response.
          return response;
      }


      //The grid will call this method in insert mode
   
      [HttpPost]
      public Models.Response PostI(dynamic data)
      {
          
          int id = -1;
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "v_Magic_TemplateDetails",false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
        
                  var dbres  = (from e in _context.v_Magic_TemplateDetails
                                                   .Where(" == "+ inserted.ToString())
                                 select new Models.v_Magic_TemplateDetails(e)).ToArray();  
        
          // return the HTTP Response.
        return new Models.Response(dbres, dbres.Length);
 
      }
     
   
                
    }
}
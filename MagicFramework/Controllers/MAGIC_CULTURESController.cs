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
    public class Magic_CulturesController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
      [HttpGet]
      public string getSessionCulture()
      {
          //Data.MagicDBDataContext context = new Data.MagicDBDataContext(MagicFramework.Helpers.SessionHandler.MagicDBConnectionString);
          //var cid = MagicFramework.Helpers.SessionHandler.UserCulture;
          string culture = String.Empty;
          //if (cid != 0)
          //{
              culture = Helpers.SessionHandler.UserCultureCode;
              //culture = (from e in context.Magic_Cultures.Where(w => w.Magic_CultureID == cid) select e.Magic_CultureLanguage).FirstOrDefault().ToString();
          //}
          return culture;
      }

      [HttpGet]
      public HttpResponseMessage switchCulture(int id)
      {
          try
          {
              Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
              Data.Magic_ManagedCultures culture = context.Magic_ManagedCultures.Where(c => c.Magic_CultureID.Equals(id)).FirstOrDefault();

              if (culture != null)
              {
                  Data.Magic_Mmb_Users_Extensions userExtensions = context.Magic_Mmb_Users_Extensions.Where(u => u.UserID.Equals(Helpers.SessionHandler.IdUser)).FirstOrDefault();
                  if (userExtensions != null)
                  {
                      userExtensions.Culture_ID = id;
                  }
                  else
                  {
                      userExtensions = new Data.Magic_Mmb_Users_Extensions
                      {
                          UserID = Helpers.SessionHandler.IdUser,
                          Culture_ID = id
                      };
                      context.Magic_Mmb_Users_Extensions.InsertOnSubmit(userExtensions);
                  }
                  context.SubmitChanges();
                  context.Connection.Close();

                  Helpers.SessionHandler.UserCultureCode = culture.Magic_Cultures.Magic_CultureLanguage;
                  Helpers.SessionHandler.UserCulture = id;
                  return Helpers.Utils.ResponseMessage("", HttpStatusCode.OK);
              }
          }
          catch (Exception e)
          {
              return Helpers.Utils.retInternalServerError(e.Message);
          }

          return Helpers.Utils.ResponseMessage("Invalid culture ID", HttpStatusCode.BadRequest);
      }


      [HttpGet]
      public List<Models.Magic_Cultures> GetAllManagedCultureLanguages()
      {
          var managedculres = (from e in _context.Magic_ManagedCultures select new Models.Magic_Cultures(e.Magic_Cultures)).ToList();


          return managedculres;

      }
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_Cultures> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Cultures
                          .Where(wherecondition)
                          select new Models.Magic_Cultures(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_Cultures> Get(int id)
        {
            var resobj = (from e in _context.Magic_Cultures.Where(x=> x.Magic_CultureID == id)
                          select new Models.Magic_Cultures(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           
          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "Magic_CultureID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Cultures));

       
          if (request.sort != null)
              order = rp.BuildOrderCondition();
       
          var dbres= (from e in _context.Magic_Cultures
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select new Models.Magic_Cultures(e)).ToArray();                       


           return new Models.Response(dbres, _context.Magic_Cultures.Where(wherecondition).Count());
     
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
                  
                  var entityupdate = (from e in _context.Magic_Cultures
                                      where e.Magic_CultureID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Cultures",false);
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
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Cultures",false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
        
                  var dbres  = (from e in _context.Magic_Cultures
                                                   .Where("Magic_CultureID == "+ inserted.ToString())
                                 select new Models.Magic_Cultures(e)).ToArray();  
        
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

              var entitytodestroy = (from e in _context.Magic_Cultures
                                     where e.Magic_CultureID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.Magic_Cultures.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_Cultures was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_Cultures:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
     
   
                
    }
}
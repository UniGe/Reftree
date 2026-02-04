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
    public class v_Mmb_Profiles_Modules_ViewController : ApiController
    {

      
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
      
      //The grid will call this method in read mode
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           
          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "";
          String wherecondition = "1=1";
          //if (request.filter!=null)
          //    wherecondition = rp.BuildWhereCondition(typeof(Models.Mmb_Profiles_Modules_View));

          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderCondition();
          
          var f = request.filter;
          int profileID = Convert.ToInt32(f.filters[0].value);

          var dbres = _context.Mmb_Profiles_Modules_View(profileID).ToArray();

          return new Models.Response(dbres, _context.v_Magic_Mmb_Profiles_Modules_View.Where(wherecondition).Count());
     
      }
          //The grid will call this method in update mode
        //public Models.Response PostU(dynamic data)
            
      [HttpPost]
      public HttpResponseMessage PostU(dynamic data)
      {         
          // create a response message to send back
          var response = new HttpResponseMessage();
        
              try
              {
                  string output = "";
                  // TODO: newid non serve, modificare stored e DAl
                  int? newid = 0;
                   _context.Mmb_Profiles_Modules_Save(data.ToString().Replace("'","''"), ref output, ref newid);                  
                  response.StatusCode = HttpStatusCode.OK;
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
                  
              }
              catch (Exception ex)
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;                  
                  response.Content = new StringContent(string.Format("The database updated failed: v_Mmb_Profiles_Modules_View {0}", ex.Message));                  
              }

            // return the HTTP Response.
            return response;
      }
                
    }
}
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
using System.Reflection;
using System.Xml;
using System.Xml.Linq;
using MagicFramework.Helpers;

namespace MagicFramework.Controllers
{
    public class V_Magic_SqlDocController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
         static string groupVisibilityField = ApplicationSettingsManager.GetVisibilityField();
	  PropertyInfo propertyInfo = typeof(Data.Magic_v_SqlDocResult).GetProperty(groupVisibilityField); 
      
      //get all elements of an entity
	[HttpGet]
      public List<Data.Magic_v_SqlDocResult> GetAll()
        {
			string wherecondition = "1=1";

			if (propertyInfo != null){
			    wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.getWhereCondition("Magic_v_SqlDocResult", wherecondition);
			}


			// select from the database, skipping and taking the correct amount
			var resdb = (from e in _context.Magic_v_SqlDoc(null)
							.Where(wherecondition)
							select e).ToList();
							  
            return resdb;  
  
        }
	
        //The grid will call this method in read mode

    [HttpGet]
    public List<Data.Magic_GetDbSchemaResult> GetDbSchema() {
        var res = (from e in _context.Magic_GetDbSchema()
                   select e).ToList();
        return res;
    }
     
      [HttpPost]
      public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
      {
             
			  MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);
			  string order = "tablename";
			  String wherecondition = "1=1";			  

			  if (propertyInfo != null){
				    if (request.filter!=null){
						wherecondition = rp.BuildWhereCondition(typeof(Data.Magic_v_SqlDocResult));
					}
					wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.getWhereCondition("Magic_v_SqlDocResult", wherecondition);
				}
				else{
					if (request.filter!=null){
						wherecondition = rp.BuildWhereCondition(typeof(Data.Magic_v_SqlDocResult));
					}
				}
	  
			  if (request.sort != null && request.sort.Count > 0)
				  order = rp.BuildOrderCondition();

              string schemaname = rp.recurinfilters(typeof(Data.Magic_v_SqlDocResult), request.filter, "schemaname");

              var dbres = (from e in _context.Magic_v_SqlDoc(schemaname)   
												.Where(wherecondition)
												.OrderBy(order.ToString())
												.Skip(request.skip)
												.Take(request.take)                                            
								select e).ToArray(); 

			  return new MagicFramework.Models.Response(dbres, _context.Magic_v_SqlDoc(null).Where(wherecondition).Count());
		   }

          //The grid will call this method in update mode
      [HttpPost]
      public HttpResponseMessage PostU(string id, dynamic data)
      {
          // create a response message to send back
          var response = new HttpResponseMessage();

          try
          {
              // select the item from the database where the id

              string schemaname = data.schemaname;

              var entityupdate = (from e in _context.Magic_v_SqlDoc(schemaname).Where(x => x.tablename == id)                                  
                                  select e).FirstOrDefault();

              if (entityupdate != null)
              {
                  System.Xml.XmlDocument xmlinput = Helpers.JsonUtils.Json2Xml(data.ToString());
                  XDocument doc = XDocument.Load(new XmlNodeReader(xmlinput));
                  var upd = _context.Magic_SqlDoc_sp(doc.Root, "UPDATE");
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

 
	}
}
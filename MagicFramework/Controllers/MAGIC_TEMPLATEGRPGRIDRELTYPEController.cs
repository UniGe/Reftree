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
using MagicFramework.Helpers;

namespace MagicFramework.Controllers
{
    public class Magic_TemplateGrpGridRelTypeController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
         static string groupVisibilityField = ApplicationSettingsManager.GetVisibilityField();
	  PropertyInfo propertyInfo = typeof(Models.Magic_TemplateGrpGridRelType).GetProperty(groupVisibilityField); 
      
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_TemplateGrpGridRelType> GetAll()
        {
			string wherecondition = "1=1";

			if (propertyInfo != null){
			    wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.getWhereCondition("Magic_TemplateGrpGridRelType", wherecondition);
			}


			// select from the database, skipping and taking the correct amount
			var resdb = (from e in _context.Magic_TemplateGrpGridRelType
							.Where(wherecondition)
							select new Models.Magic_TemplateGrpGridRelType(e)).ToList();
							  
            return resdb;  
  
        }
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_TemplateGrpGridRelType> Get(int id)
        {
            var resobj = (from e in _context.Magic_TemplateGrpGridRelType.Where(x=> x.ID == id)
                          select new Models.Magic_TemplateGrpGridRelType(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
      {
			  
			  MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);
			  string order = "ID";
			  String wherecondition = "1=1";
			  

				if (propertyInfo != null){
				    if (request.filter!=null){
						wherecondition = rp.BuildWhereCondition(typeof(Data.Magic_TemplateGrpGridRelType));
					}
					wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.getWhereCondition("Magic_TemplateGrpGridRelType", wherecondition);
				}
				else{
					if (request.filter!=null){
						wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_TemplateGrpGridRelType));
					}
				}
	  
			  if (request.sort != null && request.sort.Count > 0)
				  order = rp.BuildOrderCondition();
       
			  var dbres= (from e in _context.Magic_TemplateGrpGridRelType
												.Where(wherecondition)
												.OrderBy(order.ToString())
												.Skip(request.skip)
												.Take(request.take)                                            
								select new Models.Magic_TemplateGrpGridRelType(e)).ToArray(); 

			  return new MagicFramework.Models.Response(dbres, _context.Magic_TemplateGrpGridRelType.Where(wherecondition).Count());
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
                  
                  var entityupdate = (from e in _context.Magic_TemplateGrpGridRelType
                                      where e.ID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
					 _context.MagicServerSideCheck("Magic_TemplateGrpGridRelType", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "UPDATE",MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
					 if (propertyInfo != null) {
						var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateGrpGridRelType",true);
					 }
					 else{
						var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateGrpGridRelType",false);
					 }
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
      public MagicFramework.Models.Response PostI(dynamic data)
      {

			try
			  {
					  _context.MagicServerSideCheck("Magic_TemplateGrpGridRelType", MagicFramework.Helpers.SessionHandler.UserCulture, data.ToString().Replace("'", "''"), "INSERT",MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);
					  int id = -1;
					  int inserted = -1;

					  if (propertyInfo != null) {
						var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateGrpGridRelType",true);
						foreach (var item in insID)
					    {
							inserted = int.Parse(item.modID.ToString());
					    }
					  }
					  else{
						var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_TemplateGrpGridRelType",false);
						foreach (var item in insID)
					    {
							inserted = int.Parse(item.modID.ToString());
					    }
					  }
  
					  var dbres  = (from e in _context.Magic_TemplateGrpGridRelType
													   .Where("ID == "+ inserted.ToString())
									 select new Models.Magic_TemplateGrpGridRelType(e)).ToArray();  
        
      
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

              var entitytodestroy = (from e in _context.Magic_TemplateGrpGridRelType
                                     where e.ID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.Magic_TemplateGrpGridRelType.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_TemplateGrpGridRelType was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_TemplateGrpGridRelType:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
	}
}
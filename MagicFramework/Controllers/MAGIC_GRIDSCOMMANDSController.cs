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
using MagicFramework.Helpers.Sql;

namespace MagicFramework.Controllers
{
    public class Magic_GridsCommandsController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
        static string groupVisibilityField = ApplicationSettingsManager.GetVisibilityField();
	  PropertyInfo propertyInfo = typeof(Models.Magic_GridsCommands).GetProperty(groupVisibilityField); 
      
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_GridsCommands> GetAll()
        {
			string wherecondition = "1=1";

			if (propertyInfo != null){
			    wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.getWhereCondition("Magic_GridsCommands", wherecondition);
			}


			// select from the database, skipping and taking the correct amount
			var resdb = (from e in _context.Magic_GridsCommands
							.Where(wherecondition)
							select new Models.Magic_GridsCommands(e)).ToList();
							  
            return resdb;  
  
        }
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_GridsCommands> Get(int id)
        {
            var resobj = (from e in _context.Magic_GridsCommands.Where(x=> x.MagicCommandID == id)
                          select new Models.Magic_GridsCommands(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
      [Obsolete]
      [HttpPost]
      public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
      {
			  
			  MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);
			  string order = "MagicCommandID";
			  String wherecondition = "1=1";
			  

				if (propertyInfo != null){
				    if (request.filter!=null){
						wherecondition = rp.BuildWhereCondition(typeof(Data.Magic_GridsCommands));
					}
					wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.getWhereCondition("Magic_GridsCommands", wherecondition);
				}
				else{
					if (request.filter!=null){
						wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_GridsCommands));
					}
				}
	  
			  if (request.sort != null && request.sort.Count > 0)
				  order = rp.BuildOrderCondition();
       
			  var dbres= (from e in _context.Magic_GridsCommands
												.Where(wherecondition)
												.OrderBy(order.ToString())
												.Skip(request.skip)
												.Take(request.take)                                            
								select new Models.Magic_GridsCommands(e)).ToArray(); 

			  return new MagicFramework.Models.Response(dbres, _context.Magic_GridsCommands.Where(wherecondition).Count());
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
                  
                  var entityupdate = (from e in _context.Magic_GridsCommands
                                      where e.MagicCommandID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
					var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_GridsCommands",false);
                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(entityupdate.Magic_Grids.Magic_TemplateScriptsBuffer);
                     MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                      _context.SubmitChanges();
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
					int id = -1;
					int inserted = -1;
					var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", MagicFramework.Helpers.SessionHandler.UserVisibilityGroup, "Magic_GridsCommands",false);
					foreach (var item in insID)
					{
						inserted = int.Parse(item.modID.ToString());
					}
                if (data.Layer_ID != null && data.Layer_ID != "0")
                {
                    AltLayersQueries aq = new AltLayersQueries();
                    //insert data in AltLayers
                    aq.insertAltLayerCommand(inserted, data);
                }

                var dbres  = (from e in _context.Magic_GridsCommands
													.Where("MagicCommandID == "+ inserted.ToString())
									select new Models.Magic_GridsCommands(e)).ToArray();


                var grid = (from e in _context.Magic_Grids
                                                                .Where("MagicGridID == " + dbres[0].MagicGrid_ID.ToString())
                                select e).FirstOrDefault();

                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(grid.Magic_TemplateScriptsBuffer);
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                    _context.SubmitChanges();

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

              var entitytodestroy = (from e in _context.Magic_GridsCommands
                                     where e.MagicCommandID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(entitytodestroy.Magic_Grids.Magic_TemplateScriptsBuffer);
                  _context.Magic_GridsCommands.DeleteOnSubmit(entitytodestroy);
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                  _context.SubmitChanges();
                  
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_GridsCommands was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_GridsCommands:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
	}
}
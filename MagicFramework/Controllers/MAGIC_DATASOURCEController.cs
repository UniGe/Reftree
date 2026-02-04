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
using MagicFramework.MemberShip;
using System.Data;


namespace MagicFramework.Controllers
{
    public class Magic_DataSourceController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection()); 
      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_DataSource> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_DataSource
                          .Where(wherecondition)
                          select new Models.Magic_DataSource(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_DataSource> Get(int id)
        {
            var resobj = (from e in _context.Magic_DataSource.Where(x=> x.MagicDataSourceID == id)
                          select new Models.Magic_DataSource(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
      [Obsolete]
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           
          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "MagicDataSourceID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_DataSource));


          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderConditionForEF();
       
          var dbres= (from e in _context.Magic_DataSource
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select new Models.Magic_DataSource(e)).ToArray();                       


           return new Models.Response(dbres, _context.Magic_DataSource.Where(wherecondition).Count());
     
      }
          //The grid will call this method in update mode
      [HttpPost]
      public HttpResponseMessage PostU(int id,dynamic data)
      {         
          // create a response message to send back
          var response = new HttpResponseMessage();
        
                try
              {
                  SystemRightsChecker.checkSystemRights();
                  // select the item from the database where the id
                  
                  var entityupdate = (from e in _context.Magic_DataSource
                                      where e.MagicDataSourceID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                      int layerid = 0;
                      if (data.Layer_ID != null)
                          layerid = data.Layer_ID;
                      int coregridid = 0;
                      if (data.CoreGrid_ID != null)
                          coregridid = data.CoreGrid_ID;
                  
                      // se il layer di riferimento del datasource e' cambiato significa che, se diverso da 0 o null, per il nuovo layer 
                      //le griglie del buffer gia' presenti vanno cancellate
                      if ((entityupdate.Layer_ID ?? 0) != layerid)
                      {
                          if (coregridid == 0) 
                            throw new ArgumentException("If the Layer is specified,the Core Grid selection is mandatory");
                          var tsb = (from e in _context.Magic_TemplateScriptsBuffer where e.Magic_Grid_ID == coregridid  select e);
                          _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(tsb);
                          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                      }

                      if (entityupdate.CoreGrid_ID == null)
                      {
                          foreach (var g in entityupdate.Magic_Grids)
                          {
                              _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(g.Magic_TemplateScriptsBuffer);
                          }
                          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);

                      }

                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_DataSource",false);
                     _context.SubmitChanges();
                      response.StatusCode = HttpStatusCode.OK;
                     
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id {0} Magic_DataSource was not found in the database", id.ToString()));
                  }
              }
              catch (Exception ex)
              {
                   response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("Magic_DataSource:", ex.Message));
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
              int layerid = 0;
              if (data.Layer_ID != null)
                  layerid = data.Layer_ID;
              int coregridid = 0;
              if (data.CoreGrid_ID != null)
                  coregridid = data.CoreGrid_ID;

              if (layerid != 0)
              {
                  if (coregridid == 0)
                      throw new ArgumentException("If the Layer is specified,the Core Grid selection is mandatory");
                  var tsb = (from e in _context.Magic_TemplateScriptsBuffer where e.Magic_Grid_ID == coregridid select e);
                  _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(tsb);
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

              }

              int id = -1;
              var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_DataSource", false);
              int inserted = -1;
              foreach (var item in insID)
              {
                  inserted = int.Parse(item.modID.ToString());
              }

              var dbres = (from e in _context.Magic_DataSource
                                              .Where("MagicDataSourceID == " + inserted.ToString())
                           select new Models.Magic_DataSource(e)).ToArray();

              // return the HTTP Response.
              _context.SubmitChanges();
              return new Models.Response(dbres, dbres.Length);
          }
          catch (Exception ex)
          {
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
              SystemRightsChecker.checkSystemRights();
              // select the item from the database where the id

              var entitytodestroy = (from e in _context.Magic_DataSource
                                     where e.MagicDataSourceID == id
                                     select e).FirstOrDefault();



              if (entitytodestroy != null)
              {
                  if (entitytodestroy.Layer_ID != null && entitytodestroy.Layer_ID!=0)
                  {
                      int layerid = entitytodestroy.Layer_ID ?? 0;
                      int coregridid = entitytodestroy.CoreGrid_ID ?? 0;
                      var tsb = (from e in _context.Magic_TemplateScriptsBuffer where e.Magic_Grid_ID == coregridid select e);
                      _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(tsb);
                      MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                  }

                  _context.Magic_DataSource.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_DataSource was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_DataSource:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
      [HttpPost]
      public HttpResponseMessage GenerateSetCustomStoredProcedure(int id,dynamic data)
      {
          // create a response message to send back
          var response = new HttpResponseMessage();

          try
          {
              SystemRightsChecker.checkSystemRights();
              // select the item from the database where the id
              var datasource = (from e in _context.Magic_Grids
                                     where e.MagicGridID == id
                                     select e.Magic_DataSource).FirstOrDefault();



              if (datasource != null)
              {

                  var dbutils = new DatabaseCommandUtils();
                  DataSet ds = dbutils.GetDataSetFromStoredProcedure("dbo.Magic_Build_Entity_Script", data);
                  string storedprocedurename = ds.Tables[0].Rows[0][0].ToString();

                  dynamic customjson = Newtonsoft.Json.JsonConvert.DeserializeObject(datasource.CustomJSONParam);
                  customjson.update.Definition = storedprocedurename;
                  customjson.create.Definition = storedprocedurename;
                  customjson.destroy.Definition = storedprocedurename;

                  string newcustomjson = Newtonsoft.Json.JsonConvert.SerializeObject(customjson);
                  datasource.CustomJSONParam = newcustomjson;

                  var tsb = (from e in _context.Magic_TemplateScriptsBuffer where e.Magic_Grid_ID == id select e);
                  _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(tsb);
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                  _context.SubmitChanges();
                  response = Utils.retOkJSONMessage("Custom script and datasource settings generated");

              }
          }
          catch (Exception ex)
          {
              response = Utils.retInternalServerError("Problems generating custom script: " + ex.Message);
          }

          // return the HTTP Response.
          return response;
      }
                
    }
}
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
using MagicFramework.Helpers.Sql;

namespace MagicFramework.Controllers
{
    public class Magic_ColumnsController : ApiController
    {

      
      // the linq to sql context that provides the data access layer
      private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

      [HttpPost]
      public Models.Response GetColumns(dynamic data)
      {
          MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetMagicConnection());
          return mfApi.GetColumns(data.MagicGrid_ID.Value);
      }

      [HttpPost]
      public HttpResponseMessage PostMakeColumnVisible(dynamic data)
      {
          var response = new HttpResponseMessage();
          
          int id = data.columnid;

          var entity = (from e in _context.Magic_Columns where e.MagicColumnID == id select e).FirstOrDefault();
          entity.Columns_visibleingrid = (bool)data.visible;

          _context.SubmitChanges();

          response.StatusCode = HttpStatusCode.OK;
          return response;
      }
      [HttpPost]
      public HttpResponseMessage PostUpdateColumn(dynamic data)
      {
          var response = new HttpResponseMessage();

          int id = data.columnid;

          var entity = (from e in _context.Magic_Columns where e.MagicColumnID == id select e).FirstOrDefault();
          entity.Schema_editable = (bool)data.editable;
          entity.Schema_nullable  = data.nullable;
          entity.Schema_required = data.required;
          entity.Isprimary = data.isprimary;
          entity.Columns_template = data.template;

          _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(entity.Magic_Grids.Magic_TemplateScriptsBuffer);
          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

          _context.SubmitChanges();

          response.StatusCode = HttpStatusCode.OK;
          return response;
      }
        //get column,grid couples with names
      [HttpGet]
      public List<Models.v_Magic_ColumnGridName> GetColumnNamewithGridName()
      {

        var resobj = (from e in _context.v_Magic_ColumnGridName
                        select new Models.v_Magic_ColumnGridName(e)).ToList();
          return resobj;
      }



      //get all elements of an entity
	[HttpGet]
        public List<Models.Magic_Columns> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Columns
                          .Where(wherecondition)
                          select new Models.Magic_Columns(e)).ToList();

            return resdb;

        }

    [HttpGet]
    public List<Models.Magic_ColumnsTranslations> GetColumnsWithTranslations(int id)
        {
            var resobj = (from e in _context.Magic_Columns.Where(x => x.MagicGrid_ID == id)
                          select new Models.Magic_ColumnsTranslations(e)).ToList();
            return resobj;
        }

	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_Columns> Get(int id)
        {
            var resobj = (from e in _context.Magic_Columns.Where(x=> x.MagicColumnID == id)
                          select new Models.Magic_Columns(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           
          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "MagicColumnID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Columns));


          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderCondition();
       
          var dbres= (from e in _context.Magic_Columns
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select new Models.Magic_Columns(e)).ToArray();                       


           return new Models.Response(dbres, _context.Magic_Columns.Where(wherecondition).Count());
     
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
                  
                  var entityupdate = (from e in _context.Magic_Columns
                                      where e.MagicColumnID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                      SystemRightsChecker.checkSystemRights();

                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Columns",false);


                     _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(entityupdate.Magic_Grids.Magic_TemplateScriptsBuffer);
                     MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                      var templates = entityupdate.Magic_TemplateDetails;
                     foreach (var b in templates)
                     {
                         var template = b.Magic_Templates.Magic_TemplateScriptsBuffer;
                         _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                     }
                     _context.SubmitChanges();
                      response.StatusCode = HttpStatusCode.OK;
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id Magic_Columns was not found in the database", id.ToString()));
                  }
              }
              catch (Exception ex)
              {
                   response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The database updated failed: Magic_Columns {0}", ex.Message));
              }
       
          // return the HTTP Response.
          return response;
      }


      //The grid will call this method in insert mode
   
      [HttpPost]
      public Models.Response PostI(dynamic data)
      {
          
          int id = -1;
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Columns",false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
        
                  var dbres  = (from e in _context.Magic_Columns
                                                   .Where("MagicColumnID == "+ inserted.ToString())
                                 select new Models.Magic_Columns(e)).ToArray();

                  var entitytoinsert = (from e in _context.Magic_Columns
                                                   .Where("MagicColumnID == "+ inserted.ToString())
                                                   select e).FirstOrDefault();

                  _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(entitytoinsert.Magic_Grids.Magic_TemplateScriptsBuffer);
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                  var templates = entitytoinsert.Magic_TemplateDetails;
                  foreach (var b in templates)
                  {
                      var template = b.Magic_Templates.Magic_TemplateScriptsBuffer;
                      _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                  }
                  _context.SubmitChanges();
        
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

              var entitytodestroy = (from e in _context.Magic_Columns
                                     where e.MagicColumnID == id
                                     select e).FirstOrDefault();



              if (entitytodestroy != null)
              {
                  SystemRightsChecker.checkSystemRights();
                  _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(entitytodestroy.Magic_Grids.Magic_TemplateScriptsBuffer);
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                  _context.Magic_Columns.DeleteOnSubmit(entitytodestroy);

                  var templates = entitytodestroy.Magic_TemplateDetails;
                  foreach (var b in templates)
                  {
                      var template = b.Magic_Templates.Magic_TemplateScriptsBuffer;
                      _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                  }
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_Columns was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_Columns:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
        [HttpPost]
        public HttpResponseMessage GetLabels(LabelsRequest req)
        {
            HttpResponseMessage res = new HttpResponseMessage {
                StatusCode = HttpStatusCode.InternalServerError
            };
            var grid = _context.Magic_Grids.Where(g => g.MagicGridName.Equals(req.gridCode)).FirstOrDefault();
            if(grid != null)
            {
                var columns = grid.Magic_Columns.Where(l => req.columnNames.Contains(l.ColumnName));
                var cultureColumns = grid.Magic_ColumnLabels.Where(l => columns.Select(c => c.MagicColumnID).ToList().Contains(l.Magic_Column_ID) && l.MagicCulture_ID.Equals(SessionHandler.UserCulture)).ToList();
                Dictionary<string, string> labels = columns.ToDictionary(c => c.ColumnName, c => c.Columns_label);
                cultureColumns.ForEach(delegate(Data.Magic_ColumnLabels column) {
                    labels[column.Magic_Columns.ColumnName] = column.ColumnLabel;
                });

                res.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(labels));
                res.StatusCode = HttpStatusCode.OK;
            }
            return res;
        }

        public class LabelsRequest
        {
            public string gridCode { get; set; }
            public List<string> columnNames { get; set; }
        }
    }
}
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
    public class v_Magic_UIComponentsLabelsController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
      
      
      //get all elements of an entity
	[HttpGet]
        public List<Models.v_Magic_UIComponentsLabels> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.v_Magic_UIComponentsLabels
                          .Where(wherecondition)
                          select new Models.v_Magic_UIComponentsLabels(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.v_Magic_UIComponentsLabels> Get(int id)
        {
            var resobj = (from e in _context.v_Magic_UIComponentsLabels.Where(x=> x.ID == id)
                          select new Models.v_Magic_UIComponentsLabels(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
      {
           
          MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);

          string order = "defaultlabel";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.v_Magic_UIComponentsLabels));

       
          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderConditionForEF();

          bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();  
          var dbres= (from e in _context.getManagedCultures(isSystem)
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select e).ToArray();


          return new MagicFramework.Models.Response(dbres, _context.getManagedCultures(isSystem).Where(wherecondition).Count());
     
      }
          //The grid will call this method in update mode
       /// <summary>
       /// The postU method receives the data from the client and verifies if the translated labels are already present;
       /// if they are then the data is overwritten
       /// </summary>
       /// <param name="id">The ID associated to the GRID sending the data</param>
       /// <param name="data">The data which the GRID is sending to the server</param>
       /// <returns></returns>
 
      [HttpPost]
      public HttpResponseMessage PostU(int id,dynamic data)
      {         
          // create a response message to send back
          var response = new HttpResponseMessage();
        
                try
              {
                  String objectType = data.ObjectType.ToString().Split('|')[0];
                  int ObjectID = (int)data.ObjectID;
                  int CultureID = (int)data.Magic_CultureID;

                  switch (objectType.Trim())
                  {
                      case "Type::Column":
                          var columnUpdate = (from e in _context.Magic_ColumnLabels
                                              where e.Magic_Column_ID == ObjectID && e.MagicCulture_ID == CultureID
                                              select e).FirstOrDefault();

                          var gridID = (from e in _context.Magic_Columns
                                        where e.MagicColumnID == ObjectID
                                        select e.MagicGrid_ID).FirstOrDefault();

                          if (columnUpdate != null)
                          {
                              string translation = data.translation;
                              if (String.IsNullOrEmpty(translation) || String.IsNullOrWhiteSpace(translation))
                              {
                                  _context.Magic_ColumnLabels.DeleteOnSubmit(columnUpdate);
                              }
                              else 
                                columnUpdate.ColumnLabel = data.translation;
                              response.StatusCode = HttpStatusCode.OK;
                              var grid = (from e in _context.Magic_Grids where e.MagicGridID == gridID select e).FirstOrDefault();
                              _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(grid.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                              if (grid.EditableTemplate != null)
                              {
                                  var edittemplate = (from e in _context.Magic_Templates where e.MagicTemplateName == grid.EditableTemplate select e).FirstOrDefault();
                                  _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(edittemplate.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                              } 
                              MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                          }
                          else
                          {
                              Data.Magic_ColumnLabels columnLabelContext = new Data.Magic_ColumnLabels();
                              columnLabelContext.Magic_Column_ID = ObjectID;
                              columnLabelContext.MagicCulture_ID = CultureID;
                              columnLabelContext.ColumnLabel = data.translation;
                              columnLabelContext.MagicGrid_ID = gridID;
                              _context.Magic_ColumnLabels.InsertOnSubmit(columnLabelContext);
                              var grid = (from e in _context.Magic_Grids where e.MagicGridID == gridID select e).FirstOrDefault();
                              _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(grid.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                              if (grid.EditableTemplate != null)
                              {
                                  var edittemplate = (from e in _context.Magic_Templates where e.MagicTemplateName == grid.EditableTemplate select e).FirstOrDefault();
                                  _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(edittemplate.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                              } 
                              MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                          }
                          break;
                      case "Type::TemplateGroup":
                          var tgroupUpdate = (from e in _context.Magic_TemplateGroupLabels
                                              where e.MagicTemplateGroup_ID == ObjectID && e.MagicCulture_ID == CultureID
                                              select e).FirstOrDefault();

                          var templateID = (from e in _context.Magic_TemplateGroups
                                            where e.MagicTemplateGroupID == ObjectID
                                            select e.MagicTemplate_ID).FirstOrDefault();

                          if (tgroupUpdate != null)
                          {
                              string translation = data.translation;
                              if (String.IsNullOrEmpty(translation) || String.IsNullOrWhiteSpace(translation))
                              {
                                  _context.Magic_TemplateGroupLabels.DeleteOnSubmit(tgroupUpdate);
                              }
                              else 
                                tgroupUpdate.MagicTemplateGroupLabel = data.translation;
                              response.StatusCode = HttpStatusCode.OK;
                              var template = (from e in _context.Magic_Templates where e.MagicTemplateID == templateID select e).FirstOrDefault();
                              _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                              MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                          }
                          else
                          {
                              Data.Magic_TemplateGroupLabels tgrouplabelsContext = new Data.Magic_TemplateGroupLabels();
                              tgrouplabelsContext.MagicTemplateGroup_ID = ObjectID;
                              tgrouplabelsContext.MagicCulture_ID = CultureID;
                              tgrouplabelsContext.MagicTemplateGroupLabel = data.translation;
                              tgrouplabelsContext.MagicTemplate_ID = (int)templateID;
                              _context.Magic_TemplateGroupLabels.InsertOnSubmit(tgrouplabelsContext);
                              var template = (from e in _context.Magic_Templates where e.MagicTemplateID == templateID select e).FirstOrDefault();
                              _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                              MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                          }
                          break;
                    case "Type::TemplateTabGroup":
                        var tabgroupUpdate = (from e in _context.Magic_TemplateTabGroupLabels
                                            where e.MagicTemplateTabGroup_ID == ObjectID && e.MagicCulture_ID == CultureID
                                            select e).FirstOrDefault();

                        var tempID = (from e in _context.Magic_TemplateTabGroups
                                          where e.MagicTemplateTabGroupID == ObjectID
                                          select e.MagicTemplate_ID).FirstOrDefault();

                        if (tabgroupUpdate != null)
                        {
                            string translation = data.translation;
                            if (String.IsNullOrEmpty(translation) || String.IsNullOrWhiteSpace(translation))
                            {
                                _context.Magic_TemplateTabGroupLabels.DeleteOnSubmit(tabgroupUpdate);
                            }
                            else
                                tabgroupUpdate.MagicTemplateTabGroupLabel = data.translation;
                            response.StatusCode = HttpStatusCode.OK;
                            var template = (from e in _context.Magic_Templates where e.MagicTemplateID == tempID select e).FirstOrDefault();
                            _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                        }
                        else
                        {
                            Data.Magic_TemplateTabGroupLabels tabgrouplabelsContext = new Data.Magic_TemplateTabGroupLabels();
                            tabgrouplabelsContext.MagicTemplateTabGroup_ID = ObjectID;
                            tabgrouplabelsContext.MagicCulture_ID = CultureID;
                            tabgrouplabelsContext.MagicTemplateTabGroupLabel = data.translation;
                            tabgrouplabelsContext.MagicTemplate_ID = (int)tempID;
                            _context.Magic_TemplateTabGroupLabels.InsertOnSubmit(tabgrouplabelsContext);
                            var template = (from e in _context.Magic_Templates where e.MagicTemplateID == tempID select e).FirstOrDefault();
                            _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                        }
                        break;

                    default:
                          break;
                  }

                  String defaultlabel = data.defaultlabel;

                 
                    switch (objectType.Trim())
                    {
                        case "Type::Column":
                            var columnTrans = (from e in _context.Magic_ColumnLabels
                                                where ((e.ColumnLabel == null) && e.MagicCulture_ID == CultureID && e.Magic_Columns.Columns_label == defaultlabel)
                                                select e);
                            string translation = data.translation;
                            if (!String.IsNullOrWhiteSpace(translation) && !String.IsNullOrEmpty(translation) )
                                foreach (var y in columnTrans)
                                {
                                    y.ColumnLabel = data.translation;
                                    var grid = (from e in _context.Magic_Grids where e.MagicGridID == y.Magic_Grids.MagicGridID select e).FirstOrDefault();
                                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(grid.Magic_TemplateScriptsBuffer);
                                    if (grid.EditableTemplate != null)
                                    {
                                        var edittemplate = (from e in _context.Magic_Templates where e.MagicTemplateName == grid.EditableTemplate select e).FirstOrDefault();
                                        if (edittemplate != null)
                                            _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(edittemplate.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                                    } 
                                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                                }

                            break;
                            case "Type::TemplateGroup":
                            var tgroupTrans = (from e in _context.Magic_TemplateGroupLabels
                                                where ((e.MagicTemplateGroupLabel == null) && e.MagicCulture_ID == CultureID && e.Magic_Templates.MagicTemplateName == defaultlabel)
                                                select e);
                            string translationg = data.translation;
                            if (!String.IsNullOrWhiteSpace(translationg) && !String.IsNullOrEmpty(translationg))
                                foreach (var y in tgroupTrans)
                                {
                                    y.MagicTemplateGroupLabel = data.translation;
                                    var template = (from e in _context.Magic_Templates where e.MagicTemplateID == y.MagicTemplate_ID select e).FirstOrDefault();
                                    _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                                }
                            break;
                        case "Type::TemplateTabGroup":
                        var tabgroupTrans = (from e in _context.Magic_TemplateTabGroupLabels
                                           where ((e.MagicTemplateTabGroupLabel == null) && e.MagicCulture_ID == CultureID && e.Magic_Templates.MagicTemplateName == defaultlabel)
                                           select e);
                        string translationtab = data.translation;
                        if (!String.IsNullOrWhiteSpace(translationtab) && !String.IsNullOrEmpty(translationtab))
                            foreach (var y in tabgroupTrans)
                            {
                                y.MagicTemplateTabGroupLabel = data.translation;
                                var template = (from e in _context.Magic_Templates where e.MagicTemplateID == y.MagicTemplate_ID select e).FirstOrDefault();
                                _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template.Magic_TemplateScriptsBuffer.Where(x => x.Magic_Culture_ID == CultureID));
                                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                            }
                        break;
                }
                  

                  _context.SubmitChanges();
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
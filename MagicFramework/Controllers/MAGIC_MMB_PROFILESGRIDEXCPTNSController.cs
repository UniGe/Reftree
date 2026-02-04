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
    public class MAGIC_MMB_PROFILESGRIDEXCPTNSController : ApiController
    {
      // the linq to sql context that provides the data access layer
      private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
  
      //The grid will call this method in update mode
      [HttpPost]
      public HttpResponseMessage PostU(int id, dynamic data)
      {
          // create a response message to send back
          var response = new HttpResponseMessage();

          try
          {
              // select the item from the database where the id

              var entityupdate = (from e in _context.Magic_Mmb_ProfilesGridExcptns
                                  where e.ID == id
                                  select e).FirstOrDefault();

              if (entityupdate != null)
              {
                  data.cfgModel = null;
                  //recupera il GUID della griglia dal MagicDB (il db delle configurazioni)
                  Guid? gridguid = null;
                  if (data.MagicGrid_ID != null)
                      gridguid = Models.Magic_Grids.GetGUIDFromID(int.Parse(data.MagicGrid_ID.ToString()));
                  if (gridguid != null)
                      data.GridGUID = gridguid.ToString();
                  var updID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.IdUser, "Magic_Mmb_ProfilesGridExcptns", false);
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} Magic_Mmb_ProfilesGridExcptns was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format(ex.Message));
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
              data.cfgModel = null;
              int id = -1;
              //recupera il GUID della griglia dal MagicDB (il db delle configurazioni)
              Guid? gridguid = null;
              if (data.MagicGrid_ID != null)
                  gridguid = Models.Magic_Grids.GetGUIDFromID(int.Parse(data.MagicGrid_ID.ToString()));
              if (gridguid != null)
                  data.GridGUID = gridguid.ToString();
              var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.IdUser, "Magic_Mmb_ProfilesGridExcptns", false);
              int inserted = -1;
              foreach (var item in insID)
              {
                  inserted = int.Parse(item.modID.ToString());
              }
              var dbres = (from e in _context.Magic_Mmb_ProfilesGridExcptns
                                             .Where("ID == " + inserted.ToString())
                           select new Models.Magic_Mmb_ProfilesGridExcptns(e)).ToArray();

              // return the HTTP Response.
              return new Models.Response(dbres, dbres.Length);
          }
          catch (Exception ex)
          {
              return new MagicFramework.Models.Response(ex.Message);
          }
      }            
    }
}
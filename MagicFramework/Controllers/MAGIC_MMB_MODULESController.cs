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
using System.Diagnostics;
using MagicFramework.MemberShip;
using System.Data;

namespace MagicFramework.Controllers
{
    public class Magic_Mmb_ModulesController :ApiController
    {

      
      // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());

        public enum profiletypes {MENU,COMPONENTS};

        public class ApplicationArea
        {
            public int ID { get; set; }
            public string Description { get; set; }
            public string Solver { get; set; }
            public string ProfileSettingsType { get; set; }
            public int? MagicFrameworkModuleId { get; set; }
            public string Color { get; set; }
            public bool IsHidden { get; set; }
            public string ModuleImg { get; set; }
        }

        [HttpGet]
        public List<ApplicationArea> GetAllApplicationAreas()
        {
            //string listofchildren = UserVisibility.UserVisibiltyInfo.GetUserAllGroupsVisibiltyChildrenSet(Helpers.SessionHandler.IdUser.ToString());
            string pars = MagicFramework.Helpers.SessionHandler.IdUser.ToString() + ";" + MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString()+";"+MagicFramework.Helpers.SessionHandler.UserCulture.ToString() ;

            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(pars, "VISIBLEAPPAREFROMUSERANDGROUP", dbhandler);
            //0=uaaa.US_APPARE_ID, 1=uaaa.US_APPARE_DESCRIPTION
            List<ApplicationArea> resdb = new List<ApplicationArea>();
            //il modulo System e' accessibile solo da admin e developer
            if (SystemRightsChecker.isSystemUser())
            {
                ApplicationArea mbase = new ApplicationArea(); //il modulo base e' quello standard che fa si che venga richiamata la dbo.GetMenuTree 
                mbase.ID = 0;
                mbase.Description = "System";
                mbase.Solver = "dbo.Magic_GetMenuTree";
                //l' area "SYSTEM" e' disciplinata dalla dbo.Magic_GetMenuTree e i diritti sono a livello max MENU
                mbase.ProfileSettingsType = profiletypes.MENU.ToString();
                mbase.IsHidden = false;
                mbase.Color = defaultModuleColor;
                resdb.Add(mbase);
            }
            foreach (var area in result)
            {
                ApplicationArea m = new ApplicationArea();
                m.ID = int.Parse(area[0].ToString());
                m.Description = area[1].ToString();
                m.Solver = area[2].ToString();
                try
                {
                    m.MagicFrameworkModuleId = int.Parse(area[4].ToString());
                }
                catch { }
                //Se la colonna non e' popolata di default assegno all' area la configurazione per Menu
                try {
                    if (area[3].ToString() == "MENU")
                        m.ProfileSettingsType = profiletypes.MENU.ToString();
                    else
                        if (area[3].ToString() == "COMPONENTS")
                            m.ProfileSettingsType = profiletypes.COMPONENTS.ToString();
                }
                catch (Exception ex) {
                    m.ProfileSettingsType = profiletypes.MENU.ToString();
                    MFLog.LogInFile("no profile Menu Defined, Magic_Mmb_ModulesController GetAllApplicationAreas with err::" + ex.Message, MFLog.logtypes.ERROR);
                }

                addReftreeSpecialProperties(area, m);

                resdb.Add(m);
            } 
            

            return resdb;
        }

        const string defaultModuleColor = "#0090d9"; //blue by default
        const bool defaultModuleIsHidden = false; //visible if column not specified
        private void addReftreeSpecialProperties(DataRow row, ApplicationArea area)
        {
            if (row.Table.Columns.Contains("US_APPARE_COLOR"))
            {
                area.Color = !row.IsNull("US_APPARE_COLOR") ? row.Field<string>("US_APPARE_COLOR") : defaultModuleColor;
            } else
            {
                area.Color = defaultModuleColor;
            }

            if (row.Table.Columns.Contains("US_APPARE_HIDE_DSH"))
            {
                area.IsHidden = Convert.ToBoolean(row["US_APPARE_HIDE_DSH"]) || defaultModuleIsHidden;
            } else
            {
                area.IsHidden = defaultModuleIsHidden;
            }

            if (row.Table.Columns.Contains("ModuleImg"))
            {
                area.ModuleImg = row["ModuleImg"].ToString() != null ? row["ModuleImg"].ToString() : "";
            }
        }

        //get all elements of an entity
        [HttpGet]
        public List<Models.Magic_Mmb_Modules> GetAll()
        {
            string wherecondition = "1=1";
           
            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.Magic_Mmb_Modules
                          .Where(wherecondition)
                          select new Models.Magic_Mmb_Modules(e)).ToList();

            return resdb;

        }
	
	//get a single object 
	[HttpGet]
        public List<Models.Magic_Mmb_Modules> Get(int id)
        {
            var resobj = (from e in _context.Magic_Mmb_Modules.Where(x=> x.ModuleID == id)
                          select new Models.Magic_Mmb_Modules(e)).ToList();
            return resobj;
        }


        //The grid will call this method in read mode
     
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
           
          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "ModuleID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Mmb_Modules));


          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderConditionForEF();
       
          var dbres= (from e in _context.Magic_Mmb_Modules
                                            .Where(wherecondition)
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)                                            
                            select new Models.Magic_Mmb_Modules(e)).ToArray();                       


           return new Models.Response(dbres, _context.Magic_Mmb_Modules.Where(wherecondition).Count());
     
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
                  
                  var entityupdate = (from e in _context.Magic_Mmb_Modules
                                      where e.ModuleID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Mmb_Modules",false);
                     MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
                      response.StatusCode = HttpStatusCode.OK;
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent(string.Format("The item with id Magic_Mmb_Modules was not found in the database", id.ToString()));
                  }
              }
              catch (Exception ex)
              {
                   response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The database updated failed: Magic_Mmb_Modules", ex.Message));
              }
       
          // return the HTTP Response.
          return response;
      }


      //The grid will call this method in insert mode
   
      [HttpPost]
      public Models.Response PostI(dynamic data)
      {
          
          int id = -1;
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Mmb_Modules",false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }
                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
                  var dbres  = (from e in _context.Magic_Mmb_Modules
                                                   .Where("ModuleID == "+ inserted.ToString())
                                 select new Models.Magic_Mmb_Modules(e)).ToArray();  
        
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

              var entitytodestroy = (from e in _context.Magic_Mmb_Modules
                                     where e.ModuleID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  _context.Magic_Mmb_Modules.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} in Magic_Mmb_Modules was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("Magic_Mmb_Modules:The database delete failed with message -{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }
   
                
    }
}
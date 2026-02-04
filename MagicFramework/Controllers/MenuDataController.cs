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
using System.Data;
using System.IO;
using System.Net.Http.Headers;
using System.Text;
using MagicFramework.Models;
using Newtonsoft.Json.Linq;
using MagicFramework.Helpers;
using System.Web.Security;
using System.Dynamic;
using System.Diagnostics;
using System.Web.Configuration;

namespace MagicFramework.Controllers
{
     
    public class MenuDataController : ApiController
    {
           
        #region searchmenu
        public class MenuSearch
        {
            public string ObjectKey { get; set; }
            public string ObjectType { get; set; }
            public string objectPictureRef { get; set; }
            public string ObjectRelevantInfo { get; set; }
            public string ObjectName { get; set; }
            public string ObjectContainer { get; set; }
            public string ObjectContainerID { get; set; }
        }
        public class Labels
        {
            public int itemid { get; set; }
            public string label { get; set; }
            public string type { get; set; }
        }

        [HttpGet]
        public HttpResponseMessage Menu(string id)
        {
            var res = new HttpResponseMessage();
            try
            {
                string[] nameFragments = id.Split('-');
                id = "";
                for (int i = 0; i < nameFragments.Length; i++)
                {
                    if (nameFragments[i].Length > 1)
                    {
                        if (id != "")
                        {
                            id += " AND ";
                        }
                        id += "FunctionName LIKE '%" + nameFragments[i] + "%'";
                    }
                }
                Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
                var functionList = _context.ExecuteQuery<Data.Magic_Functions>(@"SELECT * FROM [dbo].[Magic_Functions] WHERE " + id)
                    .ToList();
                var shortestItem = functionList.Aggregate(functionList.FirstOrDefault(), (shortest, current) =>
                        shortest.FunctionName.Length > current.FunctionName.Length ?
                        current : shortest);

                int moduleId = -1;
                string functionName = "";
                try
                {
                    functionName = shortestItem.FunctionName;
                    moduleId = shortestItem.Magic_Mmb_FunctionsMenus.FirstOrDefault().Magic_Mmb_Menus.Module_ID;
                }
                catch {}
                if (functionName == "")
                {
                    res.StatusCode = HttpStatusCode.NotFound;
                    return res;
                }

                //shortestItem.Magic_Mmb_FunctionsMenus.
                //var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(pars, "VISIBLEAPPAREFROMUSERANDGROUP", dbhandler);


                res.Content = new StringContent("{\"moduleId\": \"" + moduleId + "\", \"functionName\": \"" + functionName + "\"}");
                res.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception e)
            {
                res.StatusCode = HttpStatusCode.InternalServerError;
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [HttpPost]
        public Models.Response PostPerformMenuResearch(Models.Request request, string funcGuid = "", int funcId = 0)
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());

            var menulabels = (from e in _context.Magic_Mmb_MenuLabels where e.Magic_Culture_ID == SessionHandler.UserCulture select e).ToList();
            var modulelabels = (from e in _context.Magic_Mmb_ModuleLabels where e.Magic_Culture_ID == SessionHandler.UserCulture select e).ToList();

            List<Labels> labs = new List<Labels>();

            foreach (var x in menulabels)
            {
                Labels lab = new Labels();
                lab.itemid = x.Menu_ID;
                lab.label = x.MenuLabel;
                lab.type = "MENU";
                labs.Add(lab);
            }

            foreach (var x in modulelabels)
            {
                Labels lab = new Labels();
                lab.itemid = x.Module_ID;
                lab.label = x.ModuleLabel;
                lab.type = "MODULE";
                labs.Add(lab);
            }

            string id = request == null ? "" : request.filter.filters[0].value;
            funcGuid = funcGuid.ToLower();

            var ret = new List<MenuSearch>();

            
            #region callmenusp

            var modscontroller = new Magic_Mmb_ModulesController();

            var mods = modscontroller.GetAllApplicationAreas();

            foreach (var m in mods)
            {
                
                dynamic data = new ExpandoObject();

                data.applicationareaid = m.ID;
                data.storedProcedure = m.Solver;

                List<MenuItem> menus = this.GetMenu(data);

                foreach (var men in menus)
                {
                    if (!string.IsNullOrEmpty(funcGuid))
                    {
                        if (men.ITEM_GUID.Equals(funcGuid))
                        {
                            var label = labs.Where(x => x.itemid.ToString() == men.ITEM_ID && x.type == "MENU").FirstOrDefault();
                            string stringLabel = label == null ? men.ITEM_LABEL : label.label;
                            object item = new
                            {
                                menuID = men.ITEM_ID,
                                moduleID = men.ITEM_PATH.Split('|')[0],
                                label = stringLabel
                            };
                            return new Models.Response(new object[] { item }, ret.Count());
                        }
                        continue;
                    }
                    else if (funcId != 0)
                    {
                        if (men.ITEM_ID == funcId.ToString())
                        {
                            var label = labs.Where(x => x.itemid.ToString() == men.ITEM_ID && x.type == "MENU").FirstOrDefault();
                            string stringLabel = label == null ? men.ITEM_LABEL : label.label;
                            object item = new
                            {
                                menuID = men.ITEM_ID,
                                moduleID = men.ITEM_PATH.Split('|')[0],
                                label = labs.Where(x => x.itemid.ToString() == men.ITEM_ID && x.type == "MENU").FirstOrDefault()
                            };
                            return new Models.Response(new object[] { item }, ret.Count());
                        }
                        continue;
                    }

                    bool menusearchdefault = true;
                    Labels lab;
                    if (men.ITEM_TYPE == "MODULE")
                        lab = labs.Where(x=> x.itemid.ToString() == men.ITEM_ID && x.type == "MODULE").FirstOrDefault();
                    else 
                        lab = labs.Where(x=> x.itemid.ToString() == men.ITEM_ID && x.type == "MENU").FirstOrDefault();


                    if (lab != null)
                    {
                        menusearchdefault = false;
                        if (lab.label.ToLower().Contains(id))
                        {
                            var item = new MenuSearch();
                            item.ObjectKey = men.ITEM_ID.ToString();
                            item.objectPictureRef = men.ITEM_HREF;
                            item.ObjectRelevantInfo = m.ProfileSettingsType;
                            item.ObjectName = lab.label;
                            if (men.ITEM_TYPE == "MODULE")
                                item.ObjectType = "module";
                            else
                                if (men.ITEM_JSFUNC == "")
                                    item.ObjectType = "menuParent";
                                else item.ObjectType = "menu";
                            item.ObjectContainer = m.Description;
                            item.ObjectContainerID = m.ID.ToString();
                            ret.Add(item);
                        }


                    }
                    else
                        if (men.ITEM_LABEL.ToLower().Contains(id) && menusearchdefault)
                        {
                            var itemin = new MenuSearch();
                            itemin.ObjectKey = men.ITEM_ID.ToString();
                            itemin.objectPictureRef = men.ITEM_HREF;
                            itemin.ObjectRelevantInfo = m.ProfileSettingsType;
                            itemin.ObjectName = men.ITEM_LABEL;
                            if (men.ITEM_TYPE == "MODULE")
                                itemin.ObjectType = "module";
                            else
                                if (men.ITEM_JSFUNC == "")
                                    itemin.ObjectType = "menuParent";
                                else itemin.ObjectType = "menu";
                            itemin.ObjectContainer = m.Description; 
                            itemin.ObjectContainerID = m.ID.ToString();
                            ret.Add(itemin);
                        }
                }
            }
            #endregion

            Models.Response resp = new Models.Response(ret.ToArray(), ret.Count());
            return resp;

        }

        #endregion

        public class MenuItem {

           public string ITEM_ID {get;set;} 
           public string ITEM_LABEL {get;set;}
           public string ITEM_TYPE {get;set;} 
           public string ITEM_JSFUNC {get;set;}
           public string ITEM_HREF {get;set;}
           public string ITEM_LEVEL {get;set;}
		   public string ITEM_FUNCTIONID {get;set;} //function GUID
		   public string ITEM_CHECKSUM {get;set;} //userrights - user rights
           public string ITEM_PATH {get;set;}
           public string ITEM_PARENTID { get; set;}
           public string ITEM_LABEL_ORIG { get; set; }
           public string ITEM_ICON { get; set; }
           public string ITEM_MODULE { get; set; }
            public string ITEM_GUID { get; set; }
        }

        [HttpGet]
        public HttpResponseMessage AbandonSession()
        {
            try
            {
                if (ApplicationSettingsManager.getLogToDatabase() == true)
                    MFLog.LogToDatabase(MFLog.dblogevents.USERLOGOUT, SessionHandler.Username.ToString(), HttpContext.Current.Request.UserHostAddress.ToString());
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Problems while tracking logout: " + ex.Message, MFLog.logtypes.ERROR);
            }


            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.InternalServerError;
            HttpContext.Current.Session.Abandon();
            FormsAuthentication.SignOut();

            // clear session and form cookies
            HttpCookie cookie1 = new HttpCookie(FormsAuthentication.FormsCookieName, "");
            cookie1.Expires = DateTime.Now.AddYears(-1);
            HttpContext.Current.Response.Cookies.Add(cookie1);
            SessionStateSection sessionStateSection = (SessionStateSection)WebConfigurationManager.GetSection("system.web/sessionState");
            HttpCookie cookie2 = new HttpCookie(sessionStateSection.CookieName, "");
            cookie2.Expires = DateTime.Now.AddYears(-1);
            HttpContext.Current.Response.Cookies.Add(cookie2);

            res.Content = new StringContent(SessionHandler.LoginPoint ?? "/login");
            res.StatusCode = HttpStatusCode.OK;
            return res;
        }


        [HttpGet]
        public HttpResponseMessage GetBreadCrumbs(int id)
        {
            HttpResponseMessage response = new HttpResponseMessage();

            if (!MagicFramework.Helpers.SessionHandler.CheckActiveSession()) return null;

            if (id == -1)
            {
                response.Content = new StringContent("");
                response.StatusCode = HttpStatusCode.OK;
            }
            //if (!Helpers.License.CheckValidLicence())
            //{
            //    response.Content = new StringContent("<p style='color:#FF0000'>Invalid Licence</p>");
            //    response.StatusCode = HttpStatusCode.InternalServerError;
            //    return response;
            //}

            string returnBreadCrumbs = "";
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

            // TODO: viene lanciato 2 volte ogni pagina, sia sul getmenu che per generare il BreadCrumb. ottimizzare
            var menu = (from e in _context.Magic_Mmb_Menus
                         //  .Where(X => X.User_ID == MagicFramework.Helpers.SessionHandler.IdUser)
                        select new Models.Magic_Mmb_Menus(e)).ToList();

            var modulename = (from e in _context.Magic_Mmb_Menus where e.MenuID == id select e.Magic_Mmb_Modules.ModuleName).FirstOrDefault();
            var i = menu.FirstOrDefault(X => X.MenuID == id);

            returnBreadCrumbs = i.MenuLabel;

            while (i.MenuParentID != 0)
            {   
                i = menu.FirstOrDefault(X => X.MenuID == i.MenuParentID);
                returnBreadCrumbs = i.MenuLabel + "|" + returnBreadCrumbs;
            }

             // attacco il modulo
            returnBreadCrumbs = "Dashboard|" + modulename + "|" + returnBreadCrumbs;

            response.Content = new StringContent(returnBreadCrumbs);
            response.StatusCode = HttpStatusCode.OK;
            
            return response;
        }
        //get all elements of an entity
        [HttpPost]
        public List<MenuItem> GetMenu(dynamic data)
        {

            int appareid = data.applicationareaid;
            string sp = data.storedProcedure;
            int ug = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
            string apparedescr = "SYSTEM";

            if (!Helpers.SessionHandler.CheckActiveSession()) return null;

            try
            {
                if (appareid == -1) //se non e' ancora stata fatta una selezione esplicita del modulo procedo a cercare il default module dello user, se non c'e' del profilo 
                {

                    string pars = MagicFramework.Helpers.SessionHandler.IdUser.ToString() + ";" + MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString() + ";" + MagicFramework.Helpers.SessionHandler.UserCulture.ToString();

                    var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
                    var defmod = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(pars, "DEFAULTMODULE", dbhandler);
                    //default moduleid per utente / profilo / system (se nn trova utente lo cerca per profilo, se non c'e' lo mette a 0 che e' il system)
                    if (defmod.Count > 0)
                    {
                        appareid = int.Parse((defmod[0][0]).ToString());
                        sp = defmod[0][1].ToString();
                        try
                        {
                            apparedescr = defmod[0][2].ToString();
                        }
                        catch (Exception ex)
                        {
                            Debug.WriteLine("problems while getting deafult module, check Magic_VsbltyQueries, DEFAULTMODULE 3rd field is missing?:" + ex.Message, MFLog.logtypes.WARN);
                        }

                    }
                    else
                    {
                        appareid = 0;
                        sp = "dbo.Magic_GetMenuTree";
                    }
                }
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("Error searching menu defaults:" + ex.Message);
            }

            if (appareid != 0 && apparedescr == "SYSTEM")
            {
                try
                {
                    string pars = appareid.ToString() + ";" + MagicFramework.Helpers.SessionHandler.IdUser.ToString() + ";";
                    var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
                    var appdescrds = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(pars, "MODULEDESCRIPTION", dbhandler);
                    apparedescr = appdescrds[0][0].ToString();
                }
                catch (Exception ex)
                {
                    MFLog.LogInFile("problems while getting deafult module, check Magic_VsbltyQueries, MODULEDESCRIPTION is missing?:" + ex.Message, MFLog.logtypes.WARN);
                }

            }

            List<MenuItem> returnmenu = new List<MenuItem>();
            try
            {
                var jsonpar = "{\"usergroupvisibility_id\":" + ug.ToString() + ",\"us_appare_id\":" + appareid.ToString() + ",\"userid\":" + MagicFramework.Helpers.SessionHandler.IdUser.ToString() + ",\"cultureid\":" + MagicFramework.Helpers.SessionHandler.UserCulture + ",\"isMobile\":" + (Utils.IsMobile() ? "true" : "false") + "}";
                var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();
                var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(jsonpar);
                //var dbres = dbutils.callStoredProcedurewithXMLInput(xml, "dbo.Magic_GetMenuTree");
                var dbres = dbutils.callStoredProcedurewithXMLInput(xml, sp);
                var result = dbres.table.AsEnumerable().ToList();
                foreach (var item in result)
                {
                    MenuItem mi = new MenuItem();
                    mi.ITEM_ID = item[0].ToString();
                    mi.ITEM_LABEL = item[1].ToString();
                    mi.ITEM_TYPE = item[2].ToString();
                    mi.ITEM_JSFUNC = item[3].ToString();
                    mi.ITEM_HREF = item[4].ToString();
                    mi.ITEM_LEVEL = item[5].ToString();
                    mi.ITEM_FUNCTIONID = item[6].ToString();
                    mi.ITEM_CHECKSUM = Utils.Base64Encode(item[7].ToString());
                    mi.ITEM_PATH = item[8].ToString();
                    mi.ITEM_PARENTID = item[9].ToString();
                    mi.ITEM_LABEL_ORIG = item[11].ToString();
                    mi.ITEM_ICON = item[12].ToString();
                    mi.ITEM_MODULE = apparedescr;
                    mi.ITEM_GUID = item[13] != null ? item[13].ToString(): "";
                    returnmenu.Add(mi);
                }
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("Problems calling the menu load sp:" + ex.Message);
            }
            return returnmenu;
        }

        [HttpGet]
        public Models.ResponseString IsValidSession()
        {
            UserInfo userInfo = new UserInfo
            {
                Username = SessionHandler.Username,
                UserID = SessionHandler.IdUser,
                ApplicationName = SessionHandler.ApplicationInstanceName,
                IsDeveloper = SessionHandler.UserIsDeveloper,
                UserVisibilityGroup = SessionHandler.UserVisibilityGroup,
                UserCultureCode = SessionHandler.UserCultureCode,
            };
            Models.ResponseString rep = new Models.ResponseString();
            rep.isvalidsession = true;
            rep.userInfo = userInfo;
            if (!MagicFramework.Helpers.SessionHandler.CheckActiveSession())
            {
                HttpContext.Current.Session.Abandon();
                rep.isvalidsession = false;
            }
            return rep;
        }

        //[HttpPost]
        //public void PostUserRightsinSession(dynamic data)
        //{
        //    Helpers.SessionHandler.CurrentRights = data.userrights.ToString();
        //}


        //[HttpGet]
        //public HttpResponseMessage GetUserRightsFromSession()
        //{
        //    HttpResponseMessage res = new HttpResponseMessage();
        //    res.Content = new StringContent("{ \"msg\":\"" + Helpers.SessionHandler.CurrentRights + "\"}");
        //    return  res;
        //}

    }
}
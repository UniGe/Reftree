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


namespace MagicFramework.Controllers
{
    public class APPInstanceUIController : ApiController
    {

        public class DomainSettings
        {
            public string applicationName { get; set; }
            public string MongoConnection { get; set; }
        }

        public class UISettings
        {
            public string id { get; set; }
            public string appLogo { get; set; }
            public string appMainURL { get; set; }
            public string appTitle { get; set; }
            public string appLeftTitle { get; set; }
            public string appRightTitle { get; set; }
            //public string appAuthor { get; set; }
            public List<string> LoginBG { get; set; }
            public bool showDashBoardOnMenu { get; set; }
            public bool showDashBoardTabMenu { get; set; }
            public bool showChangeUserGroup { get; set; }
            public bool showChangeAppAreas { get; set; }
            public bool showFilterExternalGroup { get; set; }
            public string AppAreasOverrideLabelKey { get; set; }
            public string UserGroupOverrideLabelKey { get; set; }
            public bool mailActive { get; set; }
            public bool vocalCommandsActive { get; set; }
            public bool jsonFieldValidationActive { get; set; }
            public bool magnifyGridActive { get; set; }
            public bool menuOnTop { get; set; }
            public bool hideUserProfile { get; set; }
            public bool hideScheduler { get; set; }
            public bool hideNotes { get; set; }
            public bool hideLanguagesButton { get; set; }

            public UISettings(string applogo, string appmainurl, string apptitle, string applefttitle, string apprighttitle, string bg1, string bg2, string bg3, string bg4, bool showdashboardonmenu, bool showdasboardtabmenu, bool showchangeusergroup,bool showchangeappareas,string arealabelkey,string usergrouplabelkey, bool mailActive, bool vocalCommandsActive, bool jsonFieldValidationActive, bool magnifyGridActive, bool menuOnTop, bool showFilterExternalGroup,bool hideuserprofile,bool hidescheduler,bool hidenotes, bool hideLanguagesButton)
            {
                this.appLogo = applogo;
                this.appLeftTitle = applefttitle;
                this.appRightTitle = apprighttitle;
                //this.appAuthor = appauthor;
                this.appMainURL = appmainurl;
                this.appTitle = apptitle;
                this.showChangeUserGroup = showchangeusergroup;
                this.showDashBoardOnMenu = showdashboardonmenu;
                this.showDashBoardTabMenu = showdasboardtabmenu;
                this.showChangeAppAreas = showchangeappareas;
                this.LoginBG = new List<string>();
                this.LoginBG.Add(bg1);
                this.LoginBG.Add(bg2);
                this.LoginBG.Add(bg3);
                this.LoginBG.Add(bg4);
                this.AppAreasOverrideLabelKey = arealabelkey;
                this.UserGroupOverrideLabelKey = usergrouplabelkey;
                this.mailActive = mailActive;
                this.vocalCommandsActive = vocalCommandsActive;
                this.jsonFieldValidationActive = jsonFieldValidationActive;
                this.magnifyGridActive = magnifyGridActive;
                this.menuOnTop = menuOnTop;
                this.showFilterExternalGroup = showFilterExternalGroup;
                this.hideUserProfile = hideuserprofile;
                this.hideScheduler = hidescheduler;
                this.hideNotes = hidenotes;
                this.hideLanguagesButton = hideLanguagesButton;
            }
        }
        [HttpGet]
        public DomainSettings GetMongoIPAndInstanceName()
        {
            string url = Request.RequestUri.Authority;
            MFConfiguration mfc = new MFConfiguration(url);
            string appname = ApplicationSettingsManager.GetAppInstanceName();
            string mongoconn = mfc.GetApplicationConnectionToMongoFromFile(url);
            DomainSettings dom = new DomainSettings();
            dom.applicationName = appname;
            dom.MongoConnection = mongoconn;
            return dom;

        }
        /// <summary>
        /// Restuituisce i setting di dominio Mongo connection e nome Applicazione
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public DomainSettings GetDomain()
        {
            string url = Request.RequestUri.Authority;
            MFConfiguration mfc = new MFConfiguration(url);
            string appname = mfc.GetApplicationNameFromFile(url);
            string mongoconn = mfc.GetApplicationConnectionToMongoFromFile(url);
            DomainSettings dom = new DomainSettings();
            dom.applicationName = appname;
            dom.MongoConnection = mongoconn;
            return dom;

        }

        /// <summary>
        /// Restuituisce i setting inerenti la UI dal file di configurazione dell' istanza di applicazione
        /// </summary>
        /// <returns></returns>
      	[HttpGet]
        public UISettings Get()
        {
            MFConfiguration mfc = new MFConfiguration(Request.RequestUri.Authority);
            MFConfiguration.ApplicationInstanceConfiguration allsettings = mfc.appSettings.listOfInstances.Where(x=> x.id == SessionHandler.ApplicationInstanceId).FirstOrDefault();

            UISettings uis = new UISettings(allsettings.getAppLogo(), allsettings.appMainURL, allsettings.appTitle, allsettings.appLeftTitle, allsettings.appRightTitle, allsettings.LoginBG1, allsettings.LoginBG2, allsettings.LoginBG3, allsettings.LoginBG4, allsettings.showDashBoardOnMenu, allsettings.showDashBoardTabMenu, allsettings.showChangeUserGroup,allsettings.showChangeAppAreas,allsettings.AppAreasOverrideLabelKey,allsettings.UserGroupOverrideLabelKey, allsettings.mailActive, allsettings.vocalCommandsActive, allsettings.jsonFieldValidationActive, allsettings.magnifyGridActive, allsettings.menuOnTop, allsettings.showFilterExternalGroup,allsettings.hideUserProfile,allsettings.hideScheduler,allsettings.hideNotes, allsettings.hideLanguagesButton);
            uis.id = SessionHandler.ApplicationInstanceId;
            return uis;
        }

        [HttpGet]
        public HttpResponseMessage GetApplicationInstances()
        {
            HttpResponseMessage res = new HttpResponseMessage();

            MFConfiguration mfc = new MFConfiguration(Request.RequestUri.Authority);
            List<MFConfiguration.ApplicationInstanceConfiguration> allsettings = mfc.appSettings.listOfInstances;

            List<string> instanceNames = new List<string>();
            foreach (var config in allsettings)
            {
                instanceNames.Add(config.appInstancename);
            }

            string json = Newtonsoft.Json.JsonConvert.SerializeObject(instanceNames);

            res.Content = new StringContent(json);
            res.StatusCode = HttpStatusCode.OK;
            return res;
        }
	
    }
}
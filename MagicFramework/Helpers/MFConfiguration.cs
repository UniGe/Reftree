using System;
using System.Collections;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Xml;
using System.Xml.Serialization;

namespace MagicFramework.Helpers
{
    public class MFConfiguration
    {
        static string appconfigurationpath = System.Configuration.ConfigurationManager.AppSettings["appconfigurationpath"];
        public static int DefaultCultureId = 76;
        public string URL { get; set; }
        public Application appSettings { get;set; }
        public MFConfiguration(string domainURL)
        {
            //var app = this.LoadConfigurations();//inserisce le config in cache (se la cache e' vuota) o torna le config in cache
           // this.appSettings = app[domainURL];
			this.appSettings = GetAppSettings(domainURL);

		}

		public MFConfiguration()
        { 
            
        }

        public MFConfiguration(bool rebuildcache)
        {
            this.LoadConfigurations();//inserisce le config in cache (se la cache e' vuota) o torna le config in cache
        }

        private string getGridFunctionID(DatabaseCommandUtils dbhandler)
        {
            var gridfuntable = dbhandler.GetDataSet(@"Select m.MenuID, m.Module_ID from dbo.Magic_Mmb_Menus m
                                                            where GUID = '0172C028-74B7-4836-94D3-C014670D1589'", DBConnectionManager.GetTargetConnection());
            //funzione di configurazione delle griglie
            string fungridid = gridfuntable.Tables[0].Rows[0][0].ToString() + "-" + gridfuntable.Tables[0].Rows[0][1].ToString();

            return fungridid;
        }
		public string tryRetrievingAppInstanceId()
		{
			// Fallback to configuration lookup - use already loaded appSettings
			try
			{
				if (this.appSettings?.listOfInstances != null && this.appSettings.listOfInstances.Count == 1)
				{
					string appInstanceId = this.appSettings.listOfInstances.First().id;
					return appInstanceId;
				}

				throw new Exception("No instances found in loaded configuration");
			}
			catch (Exception configEx)
			{
				throw new Exception($"Failed to retrieve appInstanceId from configuration. Config error: {configEx.Message}");
			}
		}

		private string getUserGroup(DatabaseCommandUtils dbhandler)
        {
            var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(SessionHandler.UserVisibilityGroup.ToString(), "GROUPBYID", dbhandler).AsEnumerable().ToList();
            //Descrizione usergroup / arevis
            string ugdescr = "";
            if (result.Count>0)
                 ugdescr = result[0][2].ToString();
            return ugdescr;
        }
        public class EnvironmentUISettings
        {
            public string JSEnvironmentVars { get; set; }
            public MagicFramework.Controllers.APPInstanceUIController.UISettings UISettings { get; set; }
        }

        // New MergedGridsDS class to hold database operations
        public class MergedGridsDS
        {
            public string read { get; set; }
            public string export { get; set; }
            public string create { get; set; }
            public string update { get; set; }
            public string delete { get; set; }
        }

        public EnvironmentUISettings setUpPageEnvironmentVars(ApplicationInstanceConfiguration allsettings)
        {
            SessionHandler.CheckAbortSessionAndRedirect();
            int cultureid = SessionHandler.UserCulture;
            string culture = SessionHandler.UserCultureCode;
            bool userisdeveloper = SessionHandler.UserIsDeveloper;
            bool userpasswordhasexpired = SessionHandler.UserPasswordHasExpired;
            int ug = SessionHandler.UserVisibilityGroup;
            string userappprofiles = SessionHandler.UserApplicationProfiles;
            string usercompanyroles = SessionHandler.UserCompanyRoles;

            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            string ugdescr = this.getUserGroup(dbhandler);
            string fungridid = this.getGridFunctionID(dbhandler);
            string fileUploadRootDir = ApplicationSettingsManager.GetRootdirforupload();
            int? appLayerId = ApplicationSettingsManager.GetApplicationLayerId();
            string mapProvider = ApplicationSettingsManager.GetMapProvider();
            string mapApiKey = ApplicationSettingsManager.GetMapApiKey();
            string appName = ApplicationSettingsManager.GetAppInstanceName();
            string bimAPIWebSocketUrl = ApplicationSettingsManager.GetBIMApiWebsocketUrl();
            string supportURL = ApplicationSettingsManager.GetSupportURL();
            string emailListStoredProcedure = ApplicationSettingsManager.GetEmailListStoredProcedure();
            string synchCallsApiPrefix = ApplicationSettingsManager.GetServiceWorkerUrlPathPrefix();
            MagicFramework.Controllers.APPInstanceUIController.UISettings uis = new MagicFramework.Controllers.APPInstanceUIController.UISettings(allsettings.getAppLogo(), allsettings.appMainURL, allsettings.appTitle, allsettings.appLeftTitle, allsettings.appRightTitle, allsettings.LoginBG1, allsettings.LoginBG2, allsettings.LoginBG3, allsettings.LoginBG4, allsettings.showDashBoardOnMenu, allsettings.showDashBoardTabMenu,allsettings.showChangeUserGroup, allsettings.showChangeAppAreas, allsettings.AppAreasOverrideLabelKey, allsettings.UserGroupOverrideLabelKey, allsettings.mailActive, allsettings.vocalCommandsActive, allsettings.jsonFieldValidationActive, allsettings.magnifyGridActive, allsettings.menuOnTop, allsettings.showFilterExternalGroup,allsettings.hideUserProfile,allsettings.hideScheduler,allsettings.hideNotes, allsettings.hideLanguagesButton);
            uis.id = SessionHandler.ApplicationInstanceId;

            //create environment UISettings variable in JS
            string settings = "window.AppAreasOverrideLabelKey=\"{0}\";window.UserGroupOverrideLabelKey=\"{1}\";window.mailActive={2};window.ApplicationCustomFolder=\"{3}\";document.title=\"{4}\";";
            settings += "window.SessionCultureID={5};window.ApplicationInstanceId={6};window.culture=\"{7}\";window.LoginTimestamp={8};window.UserIsDeveloper=\"{10}\";window.UserGroupVisibilityID={11};window.Username=\"{9}\";";
            settings += "window.UserAppProfiles=\"{12}\";window.UserCompanyRoles=\"{13}\";window.UserGroupDescription=\"{14}\";window.GridConfigurationFunctionID=\"{15}\";window.applicationVersion=\"{16}\";window.includesVersion=\"{17}\";";
            settings += "window.ChatActive={18};window.NotificationsActive={19};window.GoogleCalendarsSynchActive={20};window.Cultures={21};window.MaxRequestLength={22};window.ApplicationInstanceName=\"{23}\";window.UserPasswordHasExpired=\"{24}\";window.vocalCommandsActive={25};window.jsonFieldValidationActive={26};window.magnifyGridActive={27};";
            if (fileUploadRootDir != null)
                settings += "window.FileUploadRootDir=\"/\";";
            if (ApplicationSettingsManager.getMSSQLFileTable())
                settings += "window.getMSSQLFileTable=true;";
            if (appLayerId!=null)
                settings += String.Format("window.ApplicationLayerId=\"{0}\";", appLayerId.ToString());
            if (mapProvider != null)
                settings += String.Format("window.mapProvider=\"{0}\";", mapProvider.ToString());
            if (mapApiKey != null)
                settings += String.Format("window.mapAK =\"{0}\";", mapApiKey.ToString());
            if (!String.IsNullOrEmpty(bimAPIWebSocketUrl))
                settings += String.Format("window.bimAPIWebSocketUrl =\"{0}\";", bimAPIWebSocketUrl);
            if (!String.IsNullOrEmpty(supportURL))
                settings += String.Format("window.supportURL=\"{0}\";", supportURL);
            if (!String.IsNullOrEmpty(emailListStoredProcedure))
                settings += String.Format("window.emailListStoredProcedure=\"{0}\";", emailListStoredProcedure);
            if (!String.IsNullOrEmpty(synchCallsApiPrefix))
                settings += String.Format("window.synchCallsApiPrefix=\"{0}\";", synchCallsApiPrefix);

            var section = System.Configuration.ConfigurationManager.GetSection("system.web/httpRuntime") as System.Web.Configuration.HttpRuntimeSection;

            string settingsscirptcontent = String.Format(settings,
                uis.AppAreasOverrideLabelKey,
                uis.UserGroupOverrideLabelKey,
                allsettings.mailActive.ToString().ToLower(),
                allsettings.customFolderName != null ? allsettings.customFolderName : uis.id,
                uis.appTitle,
                cultureid.ToString(),
                uis.id,
                culture,
                SessionHandler.LoginTimestamp,
                SessionHandler.Username,
                userisdeveloper.ToString(),
                ug.ToString(),
                userappprofiles,
                usercompanyroles,
                ugdescr,
                fungridid,
                Utils.version(),
                Utils.getIncludesVersion(),
                System.Configuration.ConfigurationManager.AppSettings["chatActive"] ?? "false",
                System.Configuration.ConfigurationManager.AppSettings["notificationsActive"] ?? "false",
                string.IsNullOrEmpty(allsettings.GoogleCalenderOAuthConfig) ? "false" : "true",
                Newtonsoft.Json.JsonConvert.SerializeObject(new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection()).Magic_ManagedCultures.Select(e => new
                {
                    id = e.Magic_CultureID,
                    name = e.Magic_Cultures.Magic_LanguageDescription
                })),
                section.MaxRequestLength,
                appName,
                userpasswordhasexpired.ToString(),
                allsettings.vocalCommandsActive.ToString().ToLower(),
                allsettings.jsonFieldValidationActive.ToString().ToLower(),
                allsettings.magnifyGridActive.ToString().ToLower()
            );

            String cstext = "<script class=\"MFessentialTag\" type=\"text/javascript\">" + settingsscirptcontent + "</script>";
            
            EnvironmentUISettings es = new EnvironmentUISettings();
            
            es.JSEnvironmentVars = cstext;
            es.UISettings = uis;

            return es;
        }

        public class Application
        {
            public string appId { get; set; }
            public string applicationDomain { get; set; }
            public string applicationName { get; set; }
            public ApplicationInfo appInfo { get; set; }
            public string MongoDBconn { get; set; }
            public List<ApplicationInstanceConfiguration> listOfInstances { get; set; }
            public List<Redirect> Redirects { get; set; }
            [XmlElement("MergedGridsDS")]
            public MergedGridsDS MergedGrids { get; set; }

            public Application()
            {}
            public Application(string xmlstring)
            {

                XmlSerializer xmlSerializer = new XmlSerializer(typeof(Application));
                using (StringReader stringReader = new StringReader(xmlstring))
                {
                    Application A = new Application();
                    A = (Application)xmlSerializer.Deserialize(stringReader);
                    this.appId = A.appId;
                    this.applicationDomain = A.applicationDomain;
                    this.applicationName = A.applicationName;
                    this.appInfo = A.appInfo ?? new ApplicationInfo();
                    this.MongoDBconn = A.MongoDBconn;
                    this.listOfInstances = A.listOfInstances;
                    this.Redirects = A.Redirects;
                    this.MergedGrids = A.MergedGrids; // Ensure MergedGrids is properly initialized
                }

            }
        }

        public class ApplicationInfo
        {
            public string author { get; set; }
            public string link { get; set; }

            public ApplicationInfo()
            {
                if (string.IsNullOrEmpty(author))
                    author = "ILOS";
                if (string.IsNullOrEmpty(link))
                    link = "http://www.ilosgroup.com";
            }
        }


        public class ApplicationInstanceConfiguration
        {
            public string appLogo { get; set; }
            public string appLogoLoginPage { get; set; }
            public string appEmail { get; set; }
            public string appMainURL { get; set; }
            public string dashboardStoredProcedureName { get; set; }
            [System.ComponentModel.DefaultValue(false)]
            public bool dashboardIsCustomizable { get; set; }
            public string id { get; set; }
            public string appInstancename { get; set; }
            public string dbtype { get; set; }
            public string appTitle { get; set; }
            public string appLeftTitle { get; set; }
            public string appRightTitle { get; set; }
            //public string appAuthor { get; set; }
            [XmlArray("LoginBGS")]
            [XmlArrayItem("LoginBG")]
            public List<string> LoginBGS = new List<string>();
            public string LoginBG1 { get; set; }
            public string LoginBG2 { get; set; }
            public string LoginBG3 { get; set; }
            public string LoginBG4 { get; set; }
            public bool showDashBoardOnMenu { get; set; }
            public bool showDashBoardTabMenu { get; set; }
            public bool showChangeUserGroup { get; set; }
            public bool showChangeAppAreas { get; set; }
            public bool showFilterExternalGroup { get; set; }
            public bool hideUserProfile { get; set; }
            public bool hideScheduler { get; set; }
            public bool hideNotes { get; set; }
            public bool hideLanguagesButton { get; set; }
            public string AppAreasOverrideLabelKey { get; set; }
            public string UserGroupOverrideLabelKey { get; set; }
            public string MasterPage { get; set; }
            public string MasterPageMobile { get; set; }
            public string MagicDBConnectionString { get; set; }
            public string TargetEntityFrameworkDBconn { get; set; }
            public string TargetDBconn { get; set; }
            public bool compressinputparameterstoXML { get; set; }
            public bool generategenericdatasource { get; set; }
            public string customJSONparameter { get; set; }
            public string groupVisibilityField { get; set; }
            public string attributesGroupListField { get; set; }
            public string businessObjectsVisibilitySolverFunction { get; set; }
            public bool WorkonSystemSettings { get; set; }
            public string directorylog { get; set; }
            public string mailAttachmentUploadDirectory { get; set; }
            public bool mailActive { get; set; }
            public bool vocalCommandsActive { get; set; }
            [System.ComponentModel.DefaultValue(false)]
            public bool magnifyGridActive { get; set; }
            [System.ComponentModel.DefaultValue(false)]
            public bool jsonFieldValidationActive { get; set; }
            [System.ComponentModel.DefaultValue(false)]
            public bool menuOnTop { get; set; }
            [System.ComponentModel.DefaultValue(false)]
            public bool showChangeLog { get; set; }
            public string registrationEntityConnectionString { get; set; }
            public string Rootdirforupload { get; set; }
            public string defaultSendMail { get; set; }
            public string Rootdirforcustomer { get; set; }
            public bool useExternalMailService { get; set; }
            public string externalMailServiceApiKey { get; set; }
            public string externalMailService { get; set; }
            public bool completeProfileInsideApplication { get; set; }
            public string chatVisibilityStoredProcedureName { get; set; }
            public string customFolderName { get; set; }
            public string mongoDBName { get; set; }
            [XmlArray("OAuth2Clients")]
            [XmlArrayItem("client")]
            public List<OAuth2Client> OAuth2Clients = new List<OAuth2Client>();
            public string GoogleCalendarConfig { get; set; }
            public string GoogleCalenderOAuthConfig { get; set; }
            public bool dumpConfigToTargetDB { get; set; }
            public bool setContextInfo { get; set; }
            public ReportCredentials Report { get; set; }
            [System.ComponentModel.DefaultValue(false)]
            public bool fileTracking { get; set; }
            public UserApproval UserApproval { get; set; }
            [System.ComponentModel.DefaultValue(false)]
            public string getAppLogo()
            {
                return string.IsNullOrEmpty(SessionHandler.userGroupLogo) ? appLogo : SessionHandler.userGroupLogo;
            }
            public bool dBEventsJobActive { get; set; }
            public bool mailJobActive { get; set; }
            public bool sameEmailMultipleAccountsUpdatePassword { get; set; }
            public bool notificationJobActive { get; set; }
            public ActionSettings ActionSettings { get; set; }
            public ImportStoredProcedures ImportStoredProcedures { get; set; }
            public IISForSSASConfig SsasHttp { get; set; }
            public int? appLayerId { get; set; }
            public MapSettings MapSettings { get; set; }
            public SisenseSettings SisenseSettings { get; set; }
            public BIMServer BIMServer { get; set; }
            public bool chatOfflineMail { get; set; }
            public bool logToDataBase { get; set; }
            public bool disableRateLimitAccountEdit { get; set; }
            public bool MSSQLFileTable { get; set; }
            public string CustomConfig { get; set; }

            public UserLicenseConfig userLicense { get; set; }

            public ApplicationInstanceConfiguration()
            {
                userLicense = new UserLicenseConfig();
            }
            public bool membershipProviderPasswordValidation { get; set; }
            public string membershipProviderPasswordNotValidMessage { get; set; }
            public string kendoStyle { get; set; } //kendo styles name 
            public string SDICOOPURIAuthority { get; set; }
            public string SDICOOPAPIKey { get; set; }
            public string AccessSDICOOPAPIKey { get; set; }
            public string FattureElettronicheStored { get; set; }
            public string passwordExpirationDays { get; set; }
            [System.ComponentModel.DefaultValue(false)]
            public bool includePDFOnly { get; set; }
            public bool skipMergeFile { get; set; } //Worddocumentfiller avoid building merge ...
            public string RefDWGAESKey { get; set; }
            // supported values: "GoogleAuthenticator","EMail"
            public string TwoFactorAuthTool { get; set; }
            [XmlArray("LocalFoldersWhiteList")]
            [XmlArrayItem("LocalFolder")]
            public List<string> LocalFoldersWhiteList = new List<string>();

            [XmlArray("PublicFoldersWhiteList")]
            [XmlArrayItem("PublicFolder")]
            public List<string> PublicFoldersWhiteList = new List<string>();//{ get; internal set; }
            
            public string PowerBiServiceUrl { get; set; }
            public string PowerBiServiceApiKey { get; set; }
            public string PowerBiFilterTable { get; set; }

            public string IdentityModelAuthURL { get; set; }
            public string IdentityModelUserInfoURL { get; set; }
            public string IdentityModelUserInfoJSONEmailPropertyName { get; set; }
            [XmlArray("CustomSettings")]
            [XmlArrayItem("CustomSetting")]
            public List<CustomSetting> CustomSettings { get; set; } = new List<CustomSetting>();
            public string F2URLAuthority { get; set; }
            public string F2APIKey { get; set; }
            public string F2DefaultFileRoleUIDJSONArray { get; set; }
            public bool SQLEscapeClientInput { get; set; }
            public bool EnableRateLimits { get; set; }
            public string supportURL { get; set; }
            public string TargetAuthDatasourceSP { get; set; }
            public bool DBMigrationActive { get; set; }
            public string GridUserFieldsStored { get; set; }
            public string PDFNetServiceDirectory { get; set; }
            public string RowDocStoredProcedure { get; set; }
            public string OnDocumentCreateStoredProcedure { get; set; }
            [XmlArray("CallOnStartUpByReflection")]
            [XmlArrayItem("Item")]
            public List<string> CallOnStartUpByReflection = new List<string>();
            public string EmailListStoredProcedure { get; set; }
            public string CustomEmailSenderPath { get; set; }
            public string VersionLogAlternativeView { get; set; }
            public string VersionLogYearsAlternativeView { get; set; }
            /// <summary>
            /// allows to add dynamically a sub path at the beginnning of "async:false" ajax api calls (e.g to work together with service workers for comune di Roma) 
            /// </summary>
            public string SyncCallsApiUrlPathPrefix { get; set; }
            public F2ChatBot F2ChatBot { get; set; }
            public RabbitMQConfig RabbitMQ { get; set; }

        }
        public class ImportStoredProcedures
        {
            public string importStoredProcedureAppend { get; set; }
            public string importStoredProcedurePreserveIds { get; set; }

        }
        public class RabbitMQConfig
        {
            public bool isActive { get; set; }
            public string Host { get; set; }
            public int Port { get; set; } = 5672; // Default port
            public string Username { get; set; }
            public string Password { get; set; }
            public string VirtualHost { get; set; } = "/"; // Default virtual host
                                                           // Optional settings
            public int ConnectionTimeout { get; set; } = 30; // Seconds
            public int Heartbeat { get; set; } = 60; // Seconds
        }
        public class UserApproval
        {
            public string approveUserStoredProcedure { get; set; }
            public string contentStoredProcedure { get; set; }
        }
        public class MapSettings
        {
            public string provider { get; set; }
            public string apiKey { get; set; }

        }
        public class SisenseSettings
        {
            public string SisenseUrl { get; set; }
            public string SisenseSecret { get; set; }
        }
        
    	public class ReportCredentials
        { 
             public string reportserver {get;set;}
             public string reportuser {get;set;}
             public string reportpassword { get; set; }
             public string reportdomain { get; set; }
             public string reportinstance { get; set; } //The when i have more than 1 Reporting services instance installed i 1 machine (default = ReportServer)
             public string reportfolder { get; set; } //this is appended to the report name dynamically
        }

        public class UserLicenseConfig
        {
            public bool check { get; set; }
            public string url { get; set; }
            public string template { get; set; }
            public string spUserLicenseIsValid { get; set; }

            public string checkedUsers { get; set; }

            public string bypassUrlList { get; set; }

            public bool isaCheckedUser(int aUserId)
            {
                bool result=check;
                if (checkedUsers != null)
                {
                    if (checkedUsers.Length > 0)
                    {
                        List<int> lu = checkedUsers.Split(',').Select(int.Parse).ToList();
                        result = lu.Contains(aUserId);
                    }
                }
                return result;
            }
            
            public bool isaBypassedUrl(string aUrl)
            {
                bool result = false;
                if (bypassUrlList != null)
                {
                    if (bypassUrlList.Length > 0)
                    {
                        List<string> lu = bypassUrlList.Split(',').ToList<string>();
                        result = lu.Contains(aUrl);
                    }
                }
                return result;
            } 
        }
        public class BIMServer
        {
            /// <summary>
            /// Url for Web api http calls
            /// </summary>
            public string baseurl { get; set; }
            /// <summary>
            /// Endpoint for web JS WebSocket 
            /// </summary>
            public string websocketurl { get; set; }
            public string userName { get; set; }
            public string password { get; set; }
        }
        public class ActionSettings
        {
            public string recordActionsStoredProcedure { get; set; } //colonna Actions
            //public string checkGridActionRulesStoredProcedure { get; set; }
            public string recordFunctionGridActionsStoredProcedure { get; set; } //actions da BUTGRI (refTree) 
        }

        public class CustomSetting
        {
            public string Key { get; set; }
            public string Value { get; set; }
        }

        public class Redirect
        {
            public string label { get; set; }
            public string url { get; set; }
        }

        public class OAuth2Client
        {
            [XmlAttribute("clientType")]
            public string clientType { get; set; }

            [XmlAttribute("enabled")]
            public bool enabled { get; set; }

            [XmlAttribute("clientId")]
            public string clientId { get; set; }

            [XmlAttribute("clientSecret")]
            public string clientSecret { get; set; }

            [XmlAttribute("ClientPublic")]
            public string ClientPublic { get; set; }

            [XmlAttribute("scope")]
            public string scope { get; set; }
        }
        //Configurazione per l' accesso ad OLAP tramite http
        public class IISForSSASConfig
        {
            public string IISOLAPUrl { get; set; }
            public string OLAPUserName { get; set; }
            public string OLAPPassword { get; set; }
        }
        public class F2ChatBot
        {
            public string URL { get; set; }
            public string DBConnectionString { get; set; }
            public string DropDataDBConnectionString { get; set; }

        }

        public static ApplicationInstanceConfiguration InstanceSettings()
        {
            return new MFConfiguration().GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
        }

        public ApplicationInstanceConfiguration GetApplicationInstanceByID(string domainURL,string instanceid)
        {
            //Se la sessione non e' valida l' instanceid sara' -1. Se sono in questo caso devo distruggere la Sessione per sicurezza e 
            // far rieffettuare un login
            if (instanceid == "-1")
                SessionHandler.CheckAbortSessionAndRedirect();

            var appSettings = GetAppSettings(domainURL);

            if (appSettings == null)
            {
                return null;
            }

            return appSettings.listOfInstances.Where(x => x.id == instanceid).FirstOrDefault();
        }

        public ApplicationInstanceConfiguration GetApplicationInstanceByInstanceName(string domainUrl, string instanceName)
        {
            var appSettings = GetAppSettings(domainUrl);
            if (appSettings == null)
            {
                return null;
            }
            return appSettings.listOfInstances.Where(_ => _.appInstancename.Equals(instanceName)).FirstOrDefault();
        }

        public Application GetAppSettings(string domainURL)
        {
            var app = this.LoadConfigurations();
            var appSettings = app[domainURL];
            return appSettings;
        }

        public Application GetAppSettings()
        {
            var app = this.LoadConfigurations();
            var appSettings = app[HttpContext.Current.Request.Url.Authority];
            return appSettings;
        }

        //Usata in MongoHandler per  essere STATE LESS se chiamato da SignalR
        public string GetApplicationNameFromFile(string domainURL)
        {
            string pathConfigurations = AppDomain.CurrentDomain.BaseDirectory + appconfigurationpath;
            if (Directory.Exists(pathConfigurations))
            {
                foreach (string file in Directory.GetFiles(pathConfigurations))
                {
                    try
                    {
                        using (StreamReader sr = File.OpenText(file))
                        {
                            string s = sr.ReadToEnd();

                            Application A = new Application(s);
                            if (A.applicationDomain.Split('#').Contains(domainURL))
                            {
                                return A.applicationName;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.Write("Load of application name from file failed:" + ex.Message);
                    }
                }

            }
            return "-1";
        }

        //Usata in MongoHandler per  essere STATE LESS se chiamato da SignalR
        public string GetApplicationConnectionToMongoFromFile(string domainURL)
        {
            string pathConfigurations = AppDomain.CurrentDomain.BaseDirectory + appconfigurationpath;
            if (Directory.Exists(pathConfigurations))
            {
                foreach (string file in Directory.GetFiles(pathConfigurations))
                {
                    try
                    {
                        using (StreamReader sr = File.OpenText(file))
                        {
                            string s = sr.ReadToEnd();

                            Application A = new Application(s);
                            if (A.applicationDomain.Split('#').Contains(domainURL))
                            {
                                return A.MongoDBconn;
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Debug.Write("Load of Mongo DB connection string from file failed:" + ex.Message);
                    }
                }

            }
            return "-1";
        }
        private bool MFbuildAndExecDirectCommandNonQuery(string connectionDb, string commandtext, object[] args)
        {
           try { 
                    using (SqlConnection PubsConn = new SqlConnection(connectionDb))
                    {
                        using (SqlCommand CMD = new SqlCommand
                          (String.Format(commandtext, args), PubsConn))
                        {
                            CMD.CommandType = CommandType.Text;
                            PubsConn.Open();
                            CMD.ExecuteNonQuery();
                        }
                    }
                
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("buildAndExecDirectCommandNonQuery in MFConfiguration with error: " + ex.Message, MFLog.logtypes.ERROR);
                return false;
            }
            return true;
        }
        private void DumpConfigToDB(Application A,string file)
        {
            //se la tabella non esiste la crea
            string cmd = @"IF NOT EXISTS (SELECT 1 
                               FROM INFORMATION_SCHEMA.TABLES 
                               WHERE TABLE_TYPE='BASE TABLE' 
                               AND TABLE_NAME='Magic_AppInstanceConfs')
                        CREATE TABLE [dbo].[Magic_AppInstanceConfs](
	                        [domain] [nvarchar](200) NOT NULL,
	                        [name] [nvarchar](500) NULL,
	                        [id] [nvarchar](50) NOT NULL,
	                        [Config] xml NOT NULL,
	                        [ConfigFile] [nvarchar](1000) NULL,
                         CONSTRAINT [PK_Magic_Magic_AppInstanceConfs] PRIMARY KEY CLUSTERED 
                        (
	                        [domain] ASC,
	                        [id] ASC
                        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
                        ) ON [PRIMARY];
                        IF NOT EXISTS (SELECT * from dbo.Magic_AppInstanceConfs where id='{2}' and domain='{0}')
                            INSERT INTO dbo.Magic_AppInstanceConfs(domain,name,id,Config,ConfigFile) VALUES ('{0}','{1}','{2}',N'{3}','{4}')
                        else 
                            UPDATE dbo.Magic_AppInstanceConfs set Config = N'{3}', name = '{1}' , ConfigFile='{4}' where id='{2}' and domain='{0}'";

            string domain = String.Empty; string name = String.Empty; string id = String.Empty; string Config = String.Empty;string connection = String.Empty;
            domain = A.applicationDomain;
            foreach (var instance in A.listOfInstances)
            {
                //check se questo site deve aggiornare il DB: in prod mettere true , in sviluppo solo se serve. Default = false
                bool overwrite = instance.dumpConfigToTargetDB;
                if (overwrite)
                {
                        using (StringWriter stringwriter = new System.IO.StringWriter())
                        {
                      
                            var serializer = new XmlSerializer(instance.GetType());
                            serializer.Serialize(stringwriter, instance);
                            name = instance.appInstancename;
                            id = instance.id;
                            Config = stringwriter.ToString().Replace("'","''");
                            connection = instance.TargetDBconn;
                            if (!this.MFbuildAndExecDirectCommandNonQuery(connection, cmd, new string[] { domain, name, id, Config, file }))
                                MFLog.LogInFile(String.Format("Error dumping configs in {0}-{1}",domain,name),MFLog.logtypes.ERROR);
                        }
                }
            }
                     
        }
        public Dictionary<string, Application> LoadConfigurations()
        {
            Dictionary<string, Application> Configlist = new Dictionary<string, Application>();

            string pathConfigurations = Path.Combine(AppDomain.CurrentDomain.BaseDirectory,appconfigurationpath);
            string cachekey = Helpers.CacheHandler.Configurations;
            if (Directory.Exists(pathConfigurations))
            {
                if (HttpRuntime.Cache.Get(cachekey) == null)  // la cache del pool e' vuota: la ricreo inserendo tutti i file trovati
                {
                    lock (Configlist)
                    {
                        Configlist.Clear();
                        {
                            foreach (string file in Directory.GetFiles(pathConfigurations).Where(s => s.EndsWith(".config",StringComparison.OrdinalIgnoreCase)))
                            {
                                try
                                {
                                    using (StreamReader sr = new StreamReader(File.Open(file,FileMode.Open,FileAccess.Read,FileShare.ReadWrite)))
                                    {
                                        string s = sr.ReadToEnd();
                                        
                                        Application A = new Application(s);
                                        List<string> domains = A.applicationDomain.Split('#').ToList();
                                        foreach (var d in domains)
                                        {
                                            //se ho piu' di un file per lo stesso dominio appendo le istanze all' URL nell' HASH
                                            if (Configlist.ContainsKey(d))
                                            {
                                                Application current = Configlist[d];
                                                current.listOfInstances.AddRange(A.listOfInstances);
                                            }
                                            else
                                            {
                                                A.applicationDomain = d;
                                                Configlist.Add(d, A); 
                                            }
                                        }
                                        DumpConfigToDB(A, Path.Combine(pathConfigurations, file));
                                    }
                                }
                                catch (Exception ex) { throw new Exception("file "+ file +" deserialization err: " + ex.Message); }
                            }
                        }
                    }
                    if (Configlist.Count > 0)
                        HttpRuntime.Cache.Insert(cachekey, Configlist);
                }
                else
                    Configlist = (Dictionary<string, Application>)HttpRuntime.Cache.Get(cachekey);            
            }
            return Configlist;
           
        }

        public static MFConfiguration.ApplicationInstanceConfiguration GetApplicationInstanceConfiguration()
        {
            if (SessionHandler.ApplicationInstanceId == "-1" || HttpContext.Current.Request.Url.Authority == null)
                return null;
            return new MFConfiguration().GetApplicationInstanceByID(HttpContext.Current.Request.Url.Authority, SessionHandler.ApplicationInstanceId);
        }
    }
}
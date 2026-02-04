using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Security;

namespace MagicFramework.Helpers
{
    public static class ApplicationSettingsManager
    {
        public static string GetAppInstanceName()
        {
            try
            {
                string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).appInstancename;
                return conn;
            }
            catch { return "-1"; }
        
        }
        public static string GetMasterPage()
        {
            try
            {
                string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).MasterPage;
                return conn;
            }
            catch { return "-1"; }
        }
        public static string GetLandingPage()
        {
            string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).appMainURL;
            return conn;
        }

        public static string GetVisibilityField()
        {
            string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).groupVisibilityField;
            return conn;
        }
        public static string GetBOAttributeGroupVisibilityField()
        {
            string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).attributesGroupListField;
            return conn;
        }
        public static string GetBOAttributeVisibilitySolverFunction()
        {
            string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).businessObjectsVisibilitySolverFunction;
            return conn;
        }
        public static string GetDefaultCustomJsonParameter()
        {
            string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).customJSONparameter;
            return conn;
        }
        public static string GetMailAttachmentUploadDirectory()
        {
            string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).mailAttachmentUploadDirectory;
            return conn;
        }
        public static bool GetMailActive()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).mailActive;
        }
        public static bool GetMenuOnTop()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).menuOnTop;
        }
        public static bool GetCompressInputparameterstoXML()
        {
            try
            {
                bool conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).compressinputparameterstoXML;
                return conn;
            }
            catch 
            {
                return false;
            }
        }
        public static bool GetGenerateGenericDs()
        {
            bool conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).generategenericdatasource;
            return conn;
        }
        public static bool GetWorkOnSystemSettings()
        {
            bool conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).WorkonSystemSettings;
            return conn;
     
        }

        public static string GetDirectoryForLog()
        {
            string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).directorylog;
            return conn;     
        }

        public static string GetRootdirforupload()
        {
            string s = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).Rootdirforupload;
            return s;
        }

        public static string GetRootdirforcustomer() 
        {
            string s = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).Rootdirforcustomer;
            return s;
        }

        public static bool GetSetContextInfo()
        {
            bool conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).setContextInfo;
            return conn;
        }
        public static string GetBIMServerBaseUrl()
        {
            MagicFramework.Helpers.MFConfiguration.BIMServer BIM = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).BIMServer;
            if (BIM != null)
                return BIM.baseurl;
            return null;
        }
        public static string GetBIMApiWebsocketUrl()
        {
            MagicFramework.Helpers.MFConfiguration.BIMServer BIM = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).BIMServer;
            if (BIM != null)
                return BIM.websocketurl;
            return null;
        }
        public static string GetBIMUserName()
        {
            MagicFramework.Helpers.MFConfiguration.BIMServer BIM = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).BIMServer;
            if (BIM != null)
                return BIM.userName;
            return null;
        }
        public static string GetBIMPassword()
        {
            MagicFramework.Helpers.MFConfiguration.BIMServer BIM = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).BIMServer;
            if (BIM != null)
                return BIM.password;
            return null;
        }
        public static string GetReportServer()
        {
            MagicFramework.Helpers.MFConfiguration.ReportCredentials report = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).Report;
            if (report != null)
                return report.reportserver;
            else
                return ConfigurationManager.AppSettings["reportserver"];
        }

        public static string GetReportDomain()
        {
            MagicFramework.Helpers.MFConfiguration.ReportCredentials report = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).Report;
            if (report != null && !String.IsNullOrEmpty(report.reportdomain))
                return report.reportdomain;
            else
                return ConfigurationManager.AppSettings["reportdomain"];
        }

        public static string GetReportUser()
        {
            MagicFramework.Helpers.MFConfiguration.ReportCredentials report = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).Report;
            if (report != null)
                return report.reportuser;
            else
                return ConfigurationManager.AppSettings["reportuser"];
        }

        public static string GetReportPassword()
        {
            MagicFramework.Helpers.MFConfiguration.ReportCredentials report = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).Report;
            if (report != null)
                return report.reportpassword;
            else
                return ConfigurationManager.AppSettings["reportpassword"];
        }

        public static string GetReportServerInstance()
        {
            MagicFramework.Helpers.MFConfiguration.ReportCredentials report = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).Report;
            if (report != null && !String.IsNullOrEmpty(report.reportinstance))
                return report.reportinstance;
            else
                return @"/ReportServer/";
       
        }

        public static string GetReportFolder()
        {
            MagicFramework.Helpers.MFConfiguration.ReportCredentials report = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).Report;
            if (report != null && !String.IsNullOrEmpty(report.reportfolder))
                return report.reportfolder;
            else
                return "";

        }

        public static bool trackFiles()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).fileTracking;
        }
        public static string GetRecordActionsStoredProcedure()
        {
            MagicFramework.Helpers.MFConfiguration.ActionSettings actsettings = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).ActionSettings;
            if (actsettings != null && !String.IsNullOrEmpty(actsettings.recordActionsStoredProcedure))
                return actsettings.recordActionsStoredProcedure;
            else
                return "core.usp_ev_get_action_constraint"; //defaulto a quella usata da refTree per retro compatibilita'
        }
        public static string GetRecordSelectionCustomActionsStoredProcedure()
        {
            MagicFramework.Helpers.MFConfiguration.ActionSettings actsettings = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).ActionSettings;
            if (actsettings != null && !String.IsNullOrEmpty(actsettings.recordFunctionGridActionsStoredProcedure))
                return actsettings.recordFunctionGridActionsStoredProcedure;
            else
                return "core.ev_usp_get_action_but_grid"; //defaulto a quella usata da refTree per retro compatibilita'
        }

        //public static string GetActionCheckRulesStoredProcedure()
        //{
        //    MagicFramework.Helpers.MFConfiguration.ActionSettings actsettings = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).ActionSettings;
        //    if (actsettings != null && !String.IsNullOrEmpty(actsettings.checkGridActionRulesStoredProcedure))
        //        return actsettings.checkGridActionRulesStoredProcedure;
        //    else
        //        return "core.usp_ev_check_rules_exist"; //defaulto a quella usata da refTree per retro compatibilita'
        //}
        public static string GetdeployImportAppendSP()
        {
            MFConfiguration.ImportStoredProcedures sp = new MagicFramework.Helpers.MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).ImportStoredProcedures;
            if (sp == null || String.IsNullOrEmpty(sp.importStoredProcedureAppend))
                return "DEPLOY.Magic_Deploy_Import";
            else
                return sp.importStoredProcedureAppend;
        }
        public static string GetdeployImportPreserveIdsSP()
        {
            MFConfiguration.ImportStoredProcedures sp = new MagicFramework.Helpers.MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).ImportStoredProcedures;
            if (sp == null || String.IsNullOrEmpty(sp.importStoredProcedurePreserveIds))
                return "DEPLOY.Magic_Deploy_Import"; //if a specific procedure is not set i will always use the append mode
            else
                return sp.importStoredProcedurePreserveIds;
        }
        public static string GetIISOLAPUrl()
        {
            MFConfiguration.IISForSSASConfig SSASconfig = new MagicFramework.Helpers.MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).SsasHttp;
            if (SSASconfig == null || String.IsNullOrEmpty(SSASconfig.IISOLAPUrl))
                return null;
            else
                return SSASconfig.IISOLAPUrl;
        }
        public static string GetIISOLAPUserName()
        {
            MFConfiguration.IISForSSASConfig SSASconfig = new MagicFramework.Helpers.MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).SsasHttp;
            if (SSASconfig == null || String.IsNullOrEmpty(SSASconfig.OLAPUserName))
                return GetAppInstanceName(); //if a specific userName is not set i use the instance name 
            else
                return SSASconfig.OLAPUserName;
        }
        public static string GetIISOLAPUserPassword()
        {
            MFConfiguration.IISForSSASConfig SSASconfig = new MagicFramework.Helpers.MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).SsasHttp;
            if (SSASconfig == null || String.IsNullOrEmpty(SSASconfig.OLAPPassword))
                return null;
            else
                return SSASconfig.OLAPPassword;
        }
        public static bool GetDashboardIsCustomizable()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).dashboardIsCustomizable;
        }
        public static int? GetApplicationLayerId()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).appLayerId;
        }

        public static string GetMapProvider()
        {
            MagicFramework.Helpers.MFConfiguration.MapSettings mapsettings = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).MapSettings;
            if (mapsettings != null && !String.IsNullOrEmpty(mapsettings.provider))
                return mapsettings.provider;
            else
                return "";
        }
        public static string GetMapApiKey()
        {
            MagicFramework.Helpers.MFConfiguration.MapSettings mapsettings = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).MapSettings;
            if (mapsettings != null && !String.IsNullOrEmpty(mapsettings.apiKey))
                return mapsettings.apiKey;
            else
                return "";
        }
        public static string GetSisenseUrl()
        {
            MagicFramework.Helpers.MFConfiguration.SisenseSettings sisenseSettings = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).SisenseSettings;
            if (sisenseSettings != null && !String.IsNullOrEmpty(sisenseSettings.SisenseUrl))
                return sisenseSettings.SisenseUrl;
            else
                return "";
        }
        public static string GetSisenseSecret()
        {
            MagicFramework.Helpers.MFConfiguration.SisenseSettings sisenseSettings = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).SisenseSettings;
            if (sisenseSettings != null && !String.IsNullOrEmpty(sisenseSettings.SisenseSecret))
                return sisenseSettings.SisenseSecret;
            else
                return "";
        }
        public static bool getChatOfflineMail()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).chatOfflineMail;
        }
        public static bool getLogToDatabase()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).logToDataBase;
        }
        public static bool getDisableRateLimitAccountEditSetting()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).disableRateLimitAccountEdit;
        }
        public static bool getMSSQLFileTable()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).MSSQLFileTable;
        }
        public static string getCustomConfig()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).CustomConfig;
        }
        public static bool getMembershipProviderPasswordValidation()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).membershipProviderPasswordValidation;
        }
        public static string getMembershipProviderPasswordNotValidMessage()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).membershipProviderPasswordNotValidMessage;
        }

        public static MFConfiguration.UserLicenseConfig getUserLicense()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).userLicense;
        }

        public static string getKendoStyle()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).kendoStyle;
        }
        public static string getPasswordExpirationDays()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).passwordExpirationDays;
        }
        public static List<string> getLocalFoldersWhiteList()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).LocalFoldersWhiteList;
        }
        public static List<string> getPublicFoldersWhiteList()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).PublicFoldersWhiteList;
        }
        public static string GetSupportURL()
        {
            return new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).supportURL;
        }
        public static string GetTargetAuthDatasourceSP()
        {
            string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).TargetAuthDatasourceSP;
            return conn;
        }

        public static string GetPDFNetServiceDirectory()
        {
            string s = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).PDFNetServiceDirectory;
            return s;
        }

        public static string GetRowDocStoredProcedure()
        {
            string s = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).RowDocStoredProcedure;
            return s;
        }
        public static string GetOnDocumentCreateStoredProcedure()
        {
            string s = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).OnDocumentCreateStoredProcedure;
            return s;
        }

        public static string GetEmailListStoredProcedure()
        {
            string EmailListStoredProcedure = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).EmailListStoredProcedure;
            return EmailListStoredProcedure;
        }

        public static bool showDashBoardTabMenu()
        {
            bool show = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).showDashBoardTabMenu;
            return show;
        }
        public static string GetVersionLogAlternativeView() {
            string versionLogAlternativeView = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).VersionLogAlternativeView;
            return versionLogAlternativeView;

        }
        public static string GetVersionLogYearsAlternativeView()
        {
            string versionLogYearsAlternativeView = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).VersionLogYearsAlternativeView;
            return versionLogYearsAlternativeView;

        }
        public static MFConfiguration.RabbitMQConfig GetRabbitMQConfig()
        {
            MFConfiguration.RabbitMQConfig rabbitMQConfig = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).RabbitMQ;
            return rabbitMQConfig;

        }
        // Method to ensure that all required queues exist in RabbitMQ
       
        public static string GetServiceWorkerUrlPathPrefix()
        {
            string prefix = ConfigurationManager.AppSettings.Get("ServiceWorkerUrlPathPrefix");
            return prefix ?? "";

        }
    }

}
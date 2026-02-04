using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Helpers
{
    public class DBConnectionManagerBuilder
    {
        public Data.MagicDBDataContext _magidbcontext { get; set; }
        
        public DBConnectionManagerBuilder(string conn)
        {
            if (conn == null)
                this._magidbcontext = null;
            else
                this._magidbcontext = new Data.MagicDBDataContext(conn);
        }
    }

    public static class DBConnectionManager
    {
        public static readonly List<string> writeGenericStoredProcedure = new List<string>() { "MAGIC_CMNDS_INS_UPD_DEL_STMT", "MAGIC_XMLCOMMANDS_USP_INS_UPD_DEL_STMT" };
        public static readonly List<string> readGenericStoredProcedure = new List<string>() { "MAGIC_XMLCOMMANDS_USP_SEL_STMT", "MAGIC_XMLCOMMANDS_USP_EXP_STMT", "MAGIC_COMMANDS_USP_EXP_STMT", "MAGIC_COMMANDS_USP_SEL_STMT" };

        private static readonly HashSet<string> ConfigTables = new HashSet<string>
        {
            "dbo.Magic_ApplicationLayers",
            "dbo.Magic_AppNamesAltLayers",
            "dbo.v_Magic_ApplicationAltLayers",
            "dbo.Magic_GridsAltLayers",
            "dbo.v_Magic_GridsAltLayers",
            "dbo.Magic_AppLayersTypes",
            "v_MagicAltLayer_SelForm", //form name , needed to launch its submit stored procedure with the magicdb connection 
            "dbo.Magic_ColumnLabels",
            "dbo.Magic_Columns",
            "dbo.Magic_ColumnsFunctionOverrides",
            "dbo.Magic_DataSource",
            "dbo.Magic_DataSourceType",
            "dbo.Magic_EditPages",
           // "dbo.Magic_FileTracking", removed cause it refers to Users who are a target object
            "dbo.Magic_Functions",
            "dbo.Magic_FunctionsGrids",
            "dbo.Magic_FunctionsLabels",
            "dbo.Magic_FunctionsTemplates",
            "dbo.Magic_FunctionTrees",
            "dbo.Magic_Grids",
            "dbo.Magic_GridsCmdDataFormatType",
            "dbo.Magic_GridsCmdGroups",
            "dbo.Magic_GridsCmdLocations",
            "dbo.Magic_GridsCommands",
            "dbo.v_Magic_GridsCommands",
            "dbo.Magic_ProfilationType",
            "dbo.Magic_TemplateDataRoles",
            "dbo.Magic_TemplateDetails",
            "dbo.Magic_TemplateDetailsFunctionOverrides",
            "dbo.Magic_TemplateGroupContent",
            "dbo.Magic_TemplateGroupLabels",
            "dbo.Magic_TemplateGroups",
            "dbo.Magic_TemplateTabGroups",
            "dbo.Magic_TemplateGroupLayers",
            "dbo.Magic_TemplateGroupsFunctionOverrides",
            "dbo.Magic_TemplateGrpGridRelType",
            "dbo.Magic_TemplateLayouts",
            "dbo.Magic_Templates",
            "dbo.Magic_TemplateScriptsBuffer",
            "dbo.Magic_TemplateTypes",
            "dbo.Magic_Trees",
            "dbo.v_Magic_ColumnGridName",
            "dbo.v_Magic_Columns_Search",
            "dbo.V_Magic_FunctionGrids",
            "dbo.v_Magic_FunctionLabels",
            "dbo.v_Magic_Functions_Templates",
            "dbo.v_Magic_Grid_NavigationTabs",
            "dbo.v_Magic_Grids",
            "dbo.v_Magic_Grids_Search",
            "dbo.v_Magic_Mmb_GridColumns",
            "dbo.v_Magic_TempDetails_Culture",
            "dbo.v_Magic_TempDetails_FilterableCulture",
            "dbo.v_Magic_TemplateDetails",
            "dbo.v_Magic_UIComponentsLabels",
            "dbo.v_Magic_RelationalAppLayers",
            "dbo.Magic_GetTabsForGrid",
            "dbo.Magic_GetTemplateLinkedColumns",
            "dbo.Magic_GetTemplateLinkedGroups",
            "dbo.Magic_GetGridNavTabsAndLabels"
        };
        public static bool IsGenericWriteStoredProcedure(string storedProcedure)
        {
            string storeCleaned = String.Empty;
            var sp = storedProcedure.Split('.');
            if (sp.Length > 1)
                storeCleaned = DBConnectionManager.UnescapeObjectName(sp[1]);
            else
                storeCleaned = DBConnectionManager.UnescapeObjectName(sp[0]);
            if (DBConnectionManager.writeGenericStoredProcedure.Contains(storeCleaned.ToUpper()))
                return true;
            return false;
        }
        public static bool IsGenericReadStoredProcedure(string storedProcedure)
        {
            string storeCleaned = String.Empty;
            var sp = storedProcedure.Split('.');
            if (sp.Length > 1)
                storeCleaned = DBConnectionManager.UnescapeObjectName(sp[1]);
            else
                storeCleaned = DBConnectionManager.UnescapeObjectName(sp[0]);
            if (DBConnectionManager.readGenericStoredProcedure.Contains(storeCleaned.ToUpper()))
                return true;
            return false;
        }
        public static string UnescapeObjectName(string oname)
        {
            return oname.Replace("[", string.Empty).Replace("]", string.Empty);
        }
        public static bool IsConfigTable(string tableName)
        {
            bool isconfigtable = false;
            isconfigtable =  ConfigTables.Contains(tableName);
            //check external assemblies' list
            if (!isconfigtable)
                isconfigtable =  new DatabaseEntityAutomations(null,tableName).lookUpForExternalConfigTables();
            return isconfigtable;
        }

        public static bool IsCredentialInfo(string tableName)
        {
            string t = tableName.ToLower();
            //RefTree views are included...
            string[] reserved = new string[] { "US_V_users", "US_V_users_applicativi", "US_users", "v_Magic_UserGroupVisibility", "Magic_Mmb_User", "Magic_Mmb_Tokens", "Magic_MailAccounts", "USN_VI_USER_L_LOCKED", "USN_VI_USER_L", "US_V_users_light", "TXN_VI_USER_L" };
            bool isreservedtable = false;
            foreach (string s in reserved)
            {
                if (t.Contains(s.ToLower()))
                    isreservedtable = true;
            }
            return isreservedtable;
        }
        public static bool IsSystemTable(string tableName)
        {
            return tableName.IndexOf("INFORMATION_SCHEMA", StringComparison.OrdinalIgnoreCase) >= 0 ||
                tableName.IndexOf("sys.", StringComparison.OrdinalIgnoreCase) >= 0 || tableName.IndexOf("master.", StringComparison.OrdinalIgnoreCase) >= 0
                || tableName.IndexOf("tempdb.", StringComparison.OrdinalIgnoreCase) >= 0 || tableName.IndexOf("model.", StringComparison.OrdinalIgnoreCase) >= 0 || tableName.IndexOf("msdb.", StringComparison.OrdinalIgnoreCase) >= 0;
                
        }
        public static bool IsMagicTable(string tableName)
        {
            return tableName.IndexOf("Magic", StringComparison.OrdinalIgnoreCase) >= 0;
        }
        public static string GetConnectionFor(string tableName)
        {
            if(IsConfigTable(tableName))
            {
                return GetMagicConnection();
            }
            else
            {
                return GetTargetConnection();
            }
        }

        public static string GetMagicConnection()
        {
            try
            {
                string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).MagicDBConnectionString;
                return conn;
            }
            catch (Exception )
            {
                return null;
            }
        }

        public static string GetTargetConnection(string url, int id)
        {
            try
            {
                string conn = new MFConfiguration(url).GetApplicationInstanceByID(url, id.ToString()).TargetDBconn;
                return conn;
            }
            catch (Exception )
            {
                return null;
            }
        }

        public static string GetTargetConnection(string url, string applicationName)
        {
            try
            {
                string conn = new MFConfiguration(url).GetApplicationInstanceByInstanceName(url, applicationName).TargetDBconn;
                return conn;
            }
            catch (Exception)
            {
                return null;
            }
        }

        public static string GetTargetConnection()
        {
            try
            {
                string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).TargetDBconn;
                return conn;
            }
            catch (Exception )
            {
                return null;
            }
        }
        public static string GetEFManagerConnection()
        {
            try
            {
                string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).TargetEntityFrameworkDBconn;
                return conn;
            }
            catch (Exception )
            {
                return null;
            }
        }
        public static string GetTargetEntityConnectionString()
        {
            try
            {
                string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).registrationEntityConnectionString;
                return conn;
            }
            catch (Exception ex)
            {
                return null;
            }
        }

        public static string GetRelationalDataBaseType()
        {
            try
            {
                string conn = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).dbtype;
                return conn;
            }
            catch (Exception ex)
            {
                return "SqlServer";
            }
        }

        public static string getTargetDBName()
        {
            System.Data.SqlClient.SqlConnectionStringBuilder builder = new System.Data.SqlClient.SqlConnectionStringBuilder();
            builder.ConnectionString = DBConnectionManager.GetTargetConnection();
            //string server = builder.DataSource;
            string catalog = builder.InitialCatalog;
            return catalog;
        }

        public static string getDBNameFromConnectionString(string targetConnection)
        {
            System.Data.SqlClient.SqlConnectionStringBuilder builder = new System.Data.SqlClient.SqlConnectionStringBuilder();
            builder.ConnectionString = targetConnection;
            //string server = builder.DataSource;
            string catalog = builder.InitialCatalog;
            return catalog;

        }

    }
}
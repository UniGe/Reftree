// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------

namespace AppOwnsData.Services
{
    using MagicFramework.Helpers;
    using Newtonsoft.Json.Linq;
    using System;
    using System.Configuration;
    using System.Data;

    public class ConfigValidatorService
    {
        //public static readonly string ApplicationId = ConfigurationManager.AppSettings["applicationId"];
        //public static readonly Guid WorkspaceId = GetParamGuid(ConfigurationManager.AppSettings["workspaceId"]);
        //public static readonly Guid ReportId = GetParamGuid(ConfigurationManager.AppSettings["reportId"]);
        //public static readonly string AuthenticationType = ConfigurationManager.AppSettings["authenticationType"];
        //public static readonly string ApplicationSecret = ConfigurationManager.AppSettings["applicationSecret"];
        //public static readonly string Tenant = ConfigurationManager.AppSettings["tenant"];
        //public static readonly string Username = ConfigurationManager.AppSettings["pbiUsername"];
        //public static readonly string Password = ConfigurationManager.AppSettings["pbiPassword"];
        //public static readonly string ObjectId = ConfigurationManager.AppSettings["objectId"];
        //public static readonly string Role = ConfigurationManager.AppSettings["pbiRole"];
        //TODO@IDEARE read from database!!!
        public string ApplicationId { get; set; } //= "3ee4a497-ce73-4aee-b671-a4e47103dff5";
        //public   Guid WorkspaceId = GetParamGuid("3d9acf79-a652-4e60-8f52-c7e2846aa85b");
        //public   Guid ReportId = GetParamGuid("a48d8d9b-5e87-4784-901e-3cd00a89469f");
        public string AuthenticationType { get; set; }// = "ServicePrincipal";
        public string ApplicationSecret { get; set; }// = "9fP8Q~zuOLcRvbBCnRanbTNfBh6h7t1ZHTHqvc8I";
        public string Tenant { get; set; }//= "761de76f-3d5c-4174-917c-5ad4d06360cb";
        public string Username { get; set; }//= ""; //only for master user mode
        public string Password { get; set; }//=""; //only for master user mode
        public string ObjectId { get; set; } //= "9d574b2b-d54d-4299-8638-cf0aebb04502";
     //   public static readonly string Role = "Utenti AreaImmobiliare";

        public string AuthorityUrl { get; set; }
        public string ScopeBase { get; set; }
        public string PowerBiUrl { get; set; }
        public string Role { get; set; }
        public string SessionUsername { get; set; }
        public string TestUsername { get; set; } //Tobe used only to test the integration , the user will taken from the session otherwise
        public string CustomDataStoredProcedure { get; set; }
        public int UserId { get; set; }
        public int UserGroupVisibilityId { get; set; }
        public string ConnectionString { get; set; }//will be userd to call the db later in async
        public ConfigValidatorService() { 
            //Get config from database 
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            var ds = dbutils.GetDataSet($@"SELECT ConfigData from dbo.Magic_App_ExtConnections ec
                                    INNER JOIN dbo.Magic_App_ExtConnTypes ct
                                    on ct.ID = ec.ExtConnType_ID 
                                where ec.ApplicationInstanceName='{SessionHandler.ApplicationInstanceName}' and ct.Code = 'POWERBI'");

            if (ds.Tables[0].Rows.Count == 0)
                throw new ArgumentException($"PowerBI connection not defined in Magic_App_ExtConnections for instance {SessionHandler.ApplicationInstanceName}");
            string configData = ds.Tables[0].Rows[0].Field<string>("ConfigData");

            try
            {
                JObject o = JObject.Parse(configData);


                this.AuthenticationType = o["authenticationType"].ToString();
                this.ApplicationSecret = o["applicationSecret"]?.ToString();
                this.ApplicationId = o["applicationId"]?.ToString();
                this.Tenant = o["tenant"]?.ToString();
                this.Username = o["username"]?.ToString();
                this.Password = o["password"]?.ToString();
                this.ObjectId = o["objectId"]?.ToString();
                this.AuthorityUrl = o["authorityUrl"]?.ToString();
                this.ScopeBase = o["scopeBase"]?.ToString();
                this.PowerBiUrl = o["powerBiApiUrl"]?.ToString();
                this.CustomDataStoredProcedure = o["customDataStoredProcedure"]?.ToString();

                this.Role = o["role"]?.ToString();
                if (String.IsNullOrEmpty(this.Role))
                    this.Role = SessionHandler.UserVisibilityGroup.ToString(); //when role is not predefined the Id of the current AREVIS is used by default
                this.TestUsername = o["testUsername"]?.ToString();
                this.SessionUsername = String.IsNullOrEmpty(TestUsername) ? SessionHandler.Username : TestUsername; //for test purposes overwrite the session user...
                this.ConnectionString = DBConnectionManager.GetTargetConnection();
            }
            catch (Exception ex)
            {
                throw new Exception($"Invalid powerBi config for instance  {SessionHandler.ApplicationInstanceName}: {ex.Message}");
            }
        } 

        /// <summary>
        /// Check if web.config embed parameters have valid values.
        /// </summary>
        /// <returns>Null if web.config parameters are valid, otherwise returns specific error string.</returns>
        public  string GetWebConfigErrors()
        {
            string message = null;
            Guid result;

            // Application Id must have a value.
            if (string.IsNullOrWhiteSpace(ApplicationId))
            {
                message = "ApplicationId is empty. please register your application as Native app in https://dev.powerbi.com/apps and fill client Id in web.config.";
            }
            // Application Id must be a Guid object.
            else if (!Guid.TryParse(ApplicationId, out result))
            {
                message = "ApplicationId must be a Guid object. please register your application as Native app in https://dev.powerbi.com/apps and fill application Id in web.config.";
            }
            // Workspace Id must have a value.
            //else if (WorkspaceId == Guid.Empty)
            //{
            //    message = "WorkspaceId is empty or not a valid Guid. Please fill its Id correctly in web.config";
            //}
            //// Report Id must have a value.
            //else if (ReportId == Guid.Empty)
            //{
            //    message = "ReportId is empty or not a valid Guid. Please fill its Id correctly in web.config";
            //}
            else if (AuthenticationType.Equals("masteruser", StringComparison.InvariantCultureIgnoreCase))
            {
                // Username must have a value.
                if (string.IsNullOrWhiteSpace(Username))
                {
                    message = "Username is empty. Please fill Power BI username in web.config";
                }

                // Password must have a value.
                if (string.IsNullOrWhiteSpace(Password))
                {
                    message = "Password is empty. Please fill password of Power BI username in web.config";
                }
            }
            else if (AuthenticationType.Equals("serviceprincipal", StringComparison.InvariantCultureIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(ApplicationSecret))
                {
                    message = "ApplicationSecret is empty. please register your application as Web app and fill appSecret in web.config.";
                }
                // Must fill tenant Id
                else if (string.IsNullOrWhiteSpace(Tenant))
                {
                    message = "Invalid Tenant. Please fill Tenant ID in Tenant under web.config";
                }
            }
            else
            {
                message = "Invalid authentication type";
            }

            return message;
        }

        public static Guid GetParamGuid(string param)
        {
            Guid paramGuid = Guid.Empty;
            Guid.TryParse(param, out paramGuid);
            return paramGuid;
        }
    }
}

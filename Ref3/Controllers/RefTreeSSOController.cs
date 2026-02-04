using MagicFramework.Controllers.ActionFilters;
using MagicFramework.Helpers;
using MagicFramework.MemberShip;
using Ref3.Helpers;
using System;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Web.Security;

namespace Ref3.Controllers
{
    [ExceptionFilter]
    public class RefTreeSSOController : ApiController
    {
        /// <summary>
        /// login of a user via token verified at target db
        /// </summary>
        /// <param name="token">a token of tokens table in target</param>
        /// <param name="app">instanceName</param>
        /// <param name="ReturnUrl">optional return url if not default</param>
        /// 
        private string ServiceWorkerUrlPathPrefix = ConfigurationManager.AppSettings.Get("ServiceWorkerUrlPathPrefix");

        [HttpGet]
        public void LoginByTokenAndTargetConnectionUserId(string token, string app, string ReturnUrl = null)
        {
            LoginByTokenAndMFConnectionUserId(token, app, ReturnUrl, true);
        }
        /// <summary>
        /// Logins a user which is present in a Magic_mmb_Users of a central database with a certain Name-ApplicationName which is corresponding to a target user by Name == Name - and ApplicationName == ApplicationName
        /// </summary>
        /// <param name="token">a unique token present in Magic_mmb_Tokens of the central db</param>
        /// <param name="app">the target app instance</param>
        /// <returns></returns>
        [HttpGet]
        public void LoginByTokenAndMFConnectionUserId(string token, string app, string ReturnUrl = null,bool forceTarget = false)
        {
           
            try
            {
                MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
                MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(app)).FirstOrDefault();
                //Get the the data from the central db
                MagicFramework.Helpers.Sql.DBQuery query = new MagicFramework.Helpers.Sql.DBQuery("SELECT * FROM dbo.Magic_Mmb_Tokens");
                query.AddWhereCondition("Token = @token", token);
                query.AddWhereCondition("active=1",null);
                //default connection in the magicdb
                string tokenCheckConnectionString = config.MagicDBConnectionString;
                if (forceTarget == true)
                    tokenCheckConnectionString = config.TargetDBconn;
                query.connectionString = tokenCheckConnectionString;
                System.Data.DataTable result = query.Execute();
                string uname = String.Empty;

                if (ServiceWorkerUrlPathPrefix != null)
                {
                    AddMagicFrameworkHeader();
                }

                if (result != null && result.Rows.Count > 0)
                {
                    //Get the username from central DB 
                    string uid = result.Rows[0]["user_id"].ToString();
                    MagicFramework.Helpers.Sql.DBQuery queryUser = new MagicFramework.Helpers.Sql.DBQuery("SELECT * FROM dbo.Magic_Mmb_Users");
                    queryUser.AddWhereCondition("UserID = @uid", uid);
                    queryUser.connectionString = tokenCheckConnectionString;
                    System.Data.DataTable result2 = queryUser.Execute();
                    uname = result2.Rows[0]["Username"].ToString();
                    if (result2.Rows.Count == 0 || result2 == null)
                        HttpContext.Current.Server.Transfer("/error.aspx?e=userNotFoundMagicDB");
                    //Token is found and consumed...
                    using (SqlConnection conn = new SqlConnection(tokenCheckConnectionString))
                    {
                        using (SqlCommand cmd = new SqlCommand("UPDATE Magic_Mmb_Tokens set active=0,updated_at=getdate() where token='"+ token +"'", conn))
                        {
                            cmd.Connection.Open();
                            cmd.ExecuteNonQuery();
                            cmd.Connection.Close();
                        }
                    }

                    //now let's get the target user 
                    int targetUserId = 0;
                    MagicFramework.Helpers.Sql.DBQuery queryUserTarget = new MagicFramework.Helpers.Sql.DBQuery("SELECT * FROM dbo.Magic_Mmb_Users");
                    queryUserTarget.AddWhereCondition("[Username] = @uname", uname);
                    queryUserTarget.AddWhereCondition("[ApplicationName] = @app", app);
                    queryUserTarget.connectionString = config.TargetDBconn;
                    System.Data.DataTable result2target = queryUserTarget.Execute();
                    if (result2target.Rows.Count == 0 || result2target==null)
                        HttpContext.Current.Server.Transfer("/error.aspx?e=userNotFoundTargetDB");
                    targetUserId = int.Parse(result2target.Rows[0]["UserID"].ToString());
                    this.loginUser(app, targetUserId, ReturnUrl);
                }
                else
                    HttpContext.Current.Server.Transfer("/error.aspx?e=tokenNotFound");
         
            }
            catch (Exception ex) {
                MagicFramework.Helpers.MFLog.LogInFile(ex.ToString(), MFLog.logtypes.ERROR);
                HttpContext.Current.Server.Transfer("/error.aspx?e=checkAppLog");
            }
        }
  

        private void loginUser(string applicationInstance, int userId, string ReturnUrl)
        {
            SessionHandler.CreateUserSession(applicationInstance, userId, Request.RequestUri.Authority);

            MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
            MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(applicationInstance)).FirstOrDefault();

            string absoluteUrl = "/" + config.appMainURL;

            if (ConfigurationManager.AppSettings["SSOUrlPathAbsolute"] != null)
            {
                absoluteUrl = ConfigurationManager.AppSettings["SSOUrlPathAbsolute"];
            }

            HttpContext.Current.Response.Redirect(String.IsNullOrEmpty(ReturnUrl) ? absoluteUrl : ReturnUrl);
            return;
        }

        [HttpGet]
        public void LoginToSisense(string dashboardGUID = null, bool header = false, bool toolbar = false, bool navigation = false, bool filter = false)
        {
            string currentapplication = ApplicationSettingsManager.GetAppInstanceName();
            EFMembershipProvider member = (MagicFramework.MemberShip.EFMembershipProvider)Membership.Providers[currentapplication];
            var user = member.GetUser(SessionHandler.Username, true);

            string baseUrl = ApplicationSettingsManager.GetSisenseUrl();
            string secret = ApplicationSettingsManager.GetSisenseSecret();
            string token = JWTHelper.GenerateSisenseJWT(secret, user.Email);

            if (!baseUrl.EndsWith("/"))      //add a slash to url if not present
            {
                baseUrl += "/";
            }

            string embedParam = "embed=true";
            string tokenParam = "jwt?jwt=" + token;
            string showHeaderParam = "h=";
            showHeaderParam += header.ToString().ToLower();

            string showToolbarParam = "t=";
            showToolbarParam += toolbar.ToString().ToLower();

            string showNavigationParam = "l=";
            showNavigationParam += navigation.ToString().ToLower();

            string showFilterParam = "r=";
            showFilterParam += filter.ToString().ToLower();

            string returnToParam = String.Empty;
            if (dashboardGUID == null)
            {
                returnToParam = "&return_to=" + baseUrl + "app/main#/dashboards?" + showHeaderParam + "&" + showToolbarParam + "&" + showNavigationParam + "&" + showFilterParam;
            } else
            {
                returnToParam = "&return_to=" + baseUrl + "app/main#/dashboards/" + dashboardGUID + "?" + embedParam + "&" + showHeaderParam + "&" + showToolbarParam + "&" + showNavigationParam + "&" + showFilterParam;
            }

            if (String.IsNullOrEmpty(returnToParam)) {
                string err = "Error while building return_to url.";
                throw new System.ArgumentException(err);
            }

            string redirectUrl = "";
            redirectUrl += baseUrl;
            redirectUrl += tokenParam;
            redirectUrl += returnToParam;
            HttpContext.Current.Response.Redirect(redirectUrl);
        }
                
        [HttpGet]
        public HttpResponseMessage GetSisenseLogoutURL()
        {
            var response = new HttpResponseMessage();

            string baseUrl = ApplicationSettingsManager.GetSisenseUrl();
            
            if (!baseUrl.EndsWith("/"))      //add a slash to url if not present
            {
                baseUrl += "/";
            }

            string logoutUrl = "";
            logoutUrl += baseUrl;
            logoutUrl += "api/auth/logout";

            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent(logoutUrl);
            return response;
        }

        private void AddMagicFrameworkHeader()
        {
            if (HttpContext.Current.Request.Cookies["X-Reftree-MagicSolution"] == null)
            {
                HttpCookie customCookie = new HttpCookie("X-Reftree-MagicSolution", "true");
                customCookie.HttpOnly = false; // Set to true if the cookie should not be accessible via JavaScript
                customCookie.Secure = true; // Set to true if using HTTPS
                // Add the cookie to the response
                HttpContext.Current.Response.Cookies.Add(customCookie);
            }
        }
    }
}

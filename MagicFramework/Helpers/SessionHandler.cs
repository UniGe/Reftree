using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Text.RegularExpressions;
using MagicFramework.MemberShip;
using System.Configuration;
using System.Web.UI.HtmlControls;
using MagicFramework.Helpers;
using System.Collections;
using System.Web.Script.Serialization;
using System.Diagnostics;

namespace MagicFramework.Helpers
{

    public static class SessionHandler
    {
        #region userRelatedData
        public static string LoginPoint
        {
            get { return (string)HttpContext.Current.Session["LoginPoint"]; }
            set { HttpContext.Current.Session["LoginPoint"] = value; }
        }

        public static string UserCultureCode
        {
            get { return (checkNullSessionValue(HttpContext.Current.Session["UserCultureCode"])); }
            set { HttpContext.Current.Session["UserCultureCode"] = value; }
        }
        public static int IdUser
        {
            get
            {
                if (!SessionHandler.CheckActiveSession())
                {
                    return -1;
                }
                else
                    return int.Parse(HttpContext.Current.Session["idUser"].ToString());
            }
            set { HttpContext.Current.Session["idUser"] = value; }
        }
        public static string Username
        {
            get { return HttpContext.Current.Session["Username"].ToString(); }
            set { HttpContext.Current.Session["Username"] = value; }
        }
        public static string UserFirstName
        {
            get { return HttpContext.Current.Session["UserFirstName"].ToString(); }
            set { HttpContext.Current.Session["UserFirstName"] = value; }
        }
        public static string UserLastName
        {
            get { return HttpContext.Current.Session["UserLastName"].ToString(); }
            set { HttpContext.Current.Session["UserLastName"] = value; }
        }
        public static string LoginTimestamp
        {
            get { return HttpContext.Current.Session["LoginTimestamp"].ToString(); }
            set { HttpContext.Current.Session["LoginTimestamp"] = value; }
        }
        public static string userGroupLogo
        {
            get { return HttpContext.Current.Session["userGroupLogo"] == null ? null : HttpContext.Current.Session["userGroupLogo"].ToString(); }
            set { HttpContext.Current.Session["userGroupLogo"] = value; }
        }
        public static int CurrentModule
        {
            get
            {
                if (HttpContext.Current.Session["CurrentModule"] == null)
                { return 0; }
                else
                { return int.Parse(HttpContext.Current.Session["CurrentModule"].ToString()); }
            }

            set { HttpContext.Current.Session["CurrentModule"] = value; }
        }
        public static int CurrentFunction
        {
            get
            {
                if (HttpContext.Current.Session["CurrentFunction"] == null)
                { return 0; }
                else
                { return int.Parse(HttpContext.Current.Session["CurrentFunction"].ToString()); }
            }

            set { HttpContext.Current.Session["CurrentFunction"] = value; }
        }
        public static string CurrentRights
        {
            get { return HttpContext.Current.Session["CurrentRights"].ToString(); }
            set { HttpContext.Current.Session["CurrentRights"] = value; }
        }
        public static int UserCulture
        {
            get
            {
                if (!CheckActiveSession()) return 0;
                return int.Parse(HttpContext.Current.Session["UserCultureID"].ToString());
            }
            set { HttpContext.Current.Session["UserCultureID"] = value; }
        }
        public static int UserVisibilityGroup
        {
            get
            {
                if (HttpContext.Current.Session["UserVisibilityGroup"] == null)
                {
                    return -1;
                }
                else
                    return int.Parse(HttpContext.Current.Session["UserVisibilityGroup"].ToString());

            }
            set { HttpContext.Current.Session["UserVisibilityGroup"] = value; }
        }
        //il Business Object (es.Azienda) che possiede il gruppo a cui appartiene l' utente (da lui selezionato via UI) 
        public static int UserVisibilityGroupOwner
        {
            get { return int.Parse(HttpContext.Current.Session["UserVisibilityGroupOwner"].ToString()); }
            set { HttpContext.Current.Session["UserVisibilityGroupOwner"] = value; }
        }
        // Il Network a cui l' utente e' loggato
        public static int UserVisibilityNetwork
        {
            get { return int.Parse(HttpContext.Current.Session["UserVisibilityNetwork"].ToString()); }
            set { HttpContext.Current.Session["UserVisibilityNetwork"] = value; }
        }
        //il Business Object (es.Azienda) che possiede il network a cui appartiene l' utente (dipende dal gruppo da lui selezionato via UI). 
        //Se differisce da GroupOwner l' utente e' "esterno" rispetto al BO  proprietario del network
        public static int UserVisibilityNetworkOwner
        {
            get { return int.Parse(HttpContext.Current.Session["UserVisibilityNetworkOwner"].ToString()); }
            set { HttpContext.Current.Session["UserVisibilityNetworkOwner"] = value; }
        }
        public static bool UserIsDeveloper
        {
            get { return checkBoolSessionValue(HttpContext.Current.Session["UserIsDeveloper"]); }
            set { HttpContext.Current.Session["UserIsDeveloper"] = value; }
        }
        public static bool UserPasswordHasExpired
        {
            get { return checkBoolSessionValue(HttpContext.Current.Session["UserPasswordHasExpired"]); }
            set { HttpContext.Current.Session["UserPasswordHasExpired"] = value; }
        }
        public static bool UserIsApproved
        {
            get { return checkBoolSessionValue(HttpContext.Current.Session["UserIsApproved"]); }
            set { HttpContext.Current.Session["UserIsApproved"] = value; }
        }
        public static string UserApplicationProfiles
        {
            get  { return checkNullSessionValue( HttpContext.Current.Session["UserApplicationProfiles"]);}
            set { HttpContext.Current.Session["UserApplicationProfiles"] = value; }
        }
        public static string UserCompanyRoles
        {
            get   { return  checkNullSessionValue(HttpContext.Current.Session["UserCompanyRoles"]); }
            set { HttpContext.Current.Session["UserCompanyRoles"] = value; }
        }
        #endregion
        #region filters
        public static string Filters
        {
            get {
                if (HttpContext.Current.Session["Filters"] == null)
                    return "{}";
                else
                    return HttpContext.Current.Session["Filters"].ToString(); }
            set { HttpContext.Current.Session["Filters"] = value; }
        }
        #endregion
        #region application

        public static string ApplicationInstanceId
        {
            get
            {
                if (HttpContext.Current.Session["ApplicationInstanceId"] == null)
                {
                      return "-1";
                }
                else 
                return HttpContext.Current.Session["ApplicationInstanceId"].ToString(); }
            set { HttpContext.Current.Session["ApplicationInstanceId"] = value; }
        }

        public static string ApplicationInstanceName
        {
            get{ return HttpContext.Current.Session["ApplicationInstanceName"].ToString(); }
            set { HttpContext.Current.Session["ApplicationInstanceName"] = value; }
        }

        public static string ApplicationDomainURL
        {
            get
            {
                return HttpContext.Current.Request.Url.Authority.ToString();
            }
            set { HttpContext.Current.Session["ApplicationDomainURL"] = value; }
        }

        public static string PowerBiServiceUrl
        {
            get { return HttpContext.Current.Session["PowerBiServiceUrl"].ToString(); }
            set { HttpContext.Current.Session["PowerBiServiceUrl"] = value; }
        }

        public static string PowerBiServiceApiKey
        {
            get { return HttpContext.Current.Session["PowerBiServiceApiToken"].ToString(); }
            set { HttpContext.Current.Session["PowerBiServiceApiToken"] = value; }
        }
        public static string PowerBiFilterTable
        {
            get { return HttpContext.Current.Session["PowerBiFilterTable"].ToString(); }
            set { HttpContext.Current.Session["PowerBiFilterTable"] = value; }
        }

        public static bool isPageActive()
        {
            if (HttpContext.Current == null)
                return false;
            else
                return true;
        }
        public static string CustomFolderName
        {
            get { return HttpContext.Current.Session["ApplicationCustomFolderName"].ToString(); }
            set { HttpContext.Current.Session["ApplicationCustomFolderName"] = value; }
        }

        #endregion
        #region sessionhelpers
        public static bool IsMobile
        {
            get
            {
                if (HttpContext.Current.Session["isMobile"] == null)
                {
                    HttpContext.Current.Session["isMobile"] = Utils.IsMobile();
                    return (bool)HttpContext.Current.Session["isMobile"];
                }
                else
                {
                    return (bool)HttpContext.Current.Session["isMobile"];
                }
            }
            set { HttpContext.Current.Session["isMobile"] = value; }
        }

        public static void CreateUserSession(string applicationInstance, int userId, string Authority)
        {
            MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
            MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(applicationInstance)).FirstOrDefault();
            if (config == null)
                HttpContext.Current.Server.Transfer("/error.aspx?e=noAppConfig");


            SessionHandler.ApplicationInstanceId = config.id;
            SessionHandler.ApplicationInstanceName = config.appInstancename;
            SessionHandler.CustomFolderName = config.customFolderName != null ? config.customFolderName : config.id;
            SessionHandler.ApplicationDomainURL = Authority;

            EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[config.appInstancename];
            if (member == null)
                HttpContext.Current.Server.Transfer("/error.aspx?e=webConfigMembership");
            MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(config.TargetDBconn);
            MagicFramework.Data.Magic_Mmb_Users user = context.Magic_Mmb_Users.Where(u => u.UserID.Equals(userId) && u.ApplicationName.Equals(applicationInstance)).FirstOrDefault();
            if (user == null)
                HttpContext.Current.Server.Transfer("/error.aspx?e=userNotFound");
            member.SetUserInfosSession(user, context);
            FormsAuthentication.SetAuthCookie(user.Username, true);
            HttpCookie authCookie = HttpContext.Current.Response.Cookies[System.Web.Security.FormsAuthentication.FormsCookieName];
            HttpContext.Current.Cache.Insert(authCookie.Value.ToString(), config.id, null, authCookie.Expires, System.Web.Caching.Cache.NoSlidingExpiration);

            EFMembershipProvider.ActivateChatAndNotifications(config, user.Username);
            try
            {
                if (ApplicationSettingsManager.getLogToDatabase() == true)
                    MFLog.LogToDatabase(MFLog.dblogevents.USERACCESSOK, user.Email, HttpContext.Current.Request.UserHostAddress.ToString());
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Problems while tracking user login: " + ex.Message, MFLog.logtypes.ERROR);
            }
        }
        public static bool CheckActiveSession()
        {
            try
            {
                if (HttpContext.Current.Session.Keys.Count == 0 || HttpContext.Current.Session["idUser"] == null)
                {
                    return false;
                }
                else
                    return true;
            }
            catch
            {
                return false;
            }
        }

        public static void CheckAbortSessionAndRedirect()
        {
            if (!CheckActiveSession())
            {
                bool redirect = true;
                //idUser is not in session but user is authenticated
                if (System.Web.HttpContext.Current.User.Identity.IsAuthenticated)
                {
                    try
                    {
                        HttpCookie authCookie = System.Web.HttpContext.Current.Request.Cookies[FormsAuthentication.FormsCookieName];
                        string domainURL = System.Web.HttpContext.Current.Request.Url.Authority;
						//string appInstanceId = HttpContext.Current.Cache.Get(authCookie.Value.ToString()).ToString();
						string appInstanceId = "";

						// Try to get appInstanceId from cache first
						try
						{
							appInstanceId = HttpContext.Current.Cache.Get(authCookie.Value.ToString()).ToString();
						}
						catch (Exception cacheEx)
						{
							// Cache miss or error - fallback to configuration lookup
							MFConfiguration config = new MFConfiguration(domainURL);
							appInstanceId = config.tryRetrievingAppInstanceId();
						}


						MagicFramework.Helpers.MFConfiguration.ApplicationInstanceConfiguration selectedConfig = new MFConfiguration(domainURL).GetApplicationInstanceByID(domainURL, appInstanceId);
                        EFMembershipProvider.SetConfigSessionAttributes(selectedConfig, System.Web.HttpContext.Current.Request);
                        MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                        MagicFramework.Data.Magic_Mmb_Users user = context.Magic_Mmb_Users.Where(u => u.Username.Equals(System.Web.HttpContext.Current.User.Identity.Name) && u.ApplicationName.Equals(selectedConfig.appInstancename)).FirstOrDefault();
                        EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[selectedConfig.appInstancename];
                        member.SetUserInfosSession(user, context, false);
                        try
                        {
                            string filtersInThisSession = HttpContext.Current.Cache.Get(authCookie.Value.ToString() + "_FILTER").ToString();
                            if (String.IsNullOrEmpty(filtersInThisSession))
                                SessionHandler.Filters = "{}";
                            else
                                SessionHandler.Filters = filtersInThisSession;
                        }
                        catch (Exception ex) {
                            Debug.WriteLine(ex.Message);
                        }
                        EFMembershipProvider.ActivateChatAndNotifications(selectedConfig, System.Web.HttpContext.Current.User.Identity.Name);
                        redirect = false;
                    }
                    catch (Exception e)
                    {
                        //could not restore user session vars, so sign the user out
                        FormsAuthentication.SignOut();
                    }
                }

                if (redirect)
                {
                    HttpContext.Current.Session.Abandon();
					string loginUrl = FormsAuthentication.LoginUrl;
					HttpContext.Current.Response.Redirect(loginUrl);
				}              
            }
        }

        public static string checkNullSessionValue(dynamic obj)
        {
            if (obj == null)
                return "";
            else
                return obj.ToString();
        }

        public static bool checkBoolSessionValue(dynamic obj)
        {
            bool retval = false;
            if (obj == null)
                return retval;
            else
            {
                string val = obj.ToString();
                if (bool.TryParse(val, out retval))
                    return retval;

                else
                    return false;
            }
        }

        #endregion
        public static string SessionID
        {
            get
            {
                return HttpContext.Current.Session.SessionID;
            }
        }

        public static string ToJson()
        {
            Dictionary<string, string> result = new Dictionary<string, string>();                    
            foreach (string s in HttpContext.Current.Session.Contents)
            {     
                result.Add(s, (HttpContext.Current.Session[s] == null) ? "null": HttpContext.Current.Session[s].ToString());
            }                
            var json = new JavaScriptSerializer().Serialize(result);
            return json;
        }
    }
}
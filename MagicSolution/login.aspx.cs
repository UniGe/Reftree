using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.Security;
using System.Text.RegularExpressions;
using MagicFramework.MemberShip;
using System.Configuration;
using System.Web.UI.HtmlControls;
using MagicFramework.Helpers;
using System.Collections.Specialized;
using MagicFramework.Models;
using System.IO;

namespace MagicSolution
{
    public partial class login : MagicFramework.Helpers.TranslateablePage
    {
        private string logdirenctory = ConfigurationManager.AppSettings["logpath"];
        private string ServiceWorkerUrlPathPrefix = ConfigurationManager.AppSettings.Get("ServiceWorkerUrlPathPrefix"); 
        protected string templateDirectory;
        protected string userCameFrom;
        private string[] registrationOpen;
        protected bool registerButton = false;
        protected string message;
        protected MFConfiguration.ApplicationInstanceConfiguration selectedconfig;
        protected bool isloginpage = false;
        public class dblist
        {
            public string id { get; set; }
            public string appInstancename { get; set; }
        }

        public MFConfiguration applicationConfig;

      
        private string manageQsMessage()
        {
            string msg = String.Empty;
            //security enhancement - don't write directly what comes from QS
            string queryStringMessageCode = Request.QueryString["message"];
            if (!String.IsNullOrEmpty(queryStringMessageCode))
            {
                if (isloginpage)
                    base.translationFileName = "Login";
                msg = base.FindTranslation(queryStringMessageCode);
                if (String.IsNullOrEmpty(msg) || msg == queryStringMessageCode)
                    msg = "";
            }
            return msg;
        }
        private void RegisterSyncCallsPrefix() {
            string script = $"<script>var serviceWorkerUrlPathPrefix = '{ServiceWorkerUrlPathPrefix}';</script>";
            // Find or create a placeholder control in the head section
            var placeholder = Page.Header.FindControl("HeadPlaceholder") as PlaceHolder;
            if (placeholder == null)
            {
                placeholder = new PlaceHolder();
                placeholder.ID = "HeadPlaceholder";
                Page.Header.Controls.Add(placeholder);
            }

            // Add the script tag to the placeholder control
            placeholder.Controls.Add(new LiteralControl(script));
        }
        protected void Page_Load(object sender, EventArgs e)
        {
            //register the synchCallsApiPrefix to call the service worker e-g in the comune di roma context....
            if (ServiceWorkerUrlPathPrefix != null)
            {
                RegisterSyncCallsPrefix();
            }
            if (Request.Url.AbsolutePath.Contains("login"))  //eredita da questa pagina anche la generatepassword.aspx
            {
                isloginpage = true;
            }

            try
            {
                applicationConfig = new MFConfiguration(Request.Url.Authority);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Configuration loading: " + ex.Message, MFLog.logtypes.ERROR);
            }
            try
            {
                registrationOpen = ConfigurationManager.AppSettings["registrationOpenFor"].Split(',');
            }
            catch
            {
                registrationOpen = null;
            }
            //security enhancement - don't write directly what comes from QS, it must be a resource code
            string msg = manageQsMessage();
            if (!String.IsNullOrEmpty(msg))
                message = msg;
            
            templateDirectory = Request.PhysicalApplicationPath + @"Magic\HtmlTemplates\login\";
            userCameFrom = Request.QueryString["from"];
            if (!MagicFramework.Helpers.License.CheckValidLicence())
            {
                Server.Transfer("/error.aspx?e=l");
            }

            applogopic.Visible = false;

            if (userCameFrom != null && (applicationConfig == null || applicationConfig.appSettings == null))
            {
                MFLog.LogInFile("Configuration app settings are null: check if a valid configuration file exists for the specified domain (tag ApplicationDomain).", MFLog.logtypes.ERROR);
                Server.Transfer("/error.aspx?e=c");
            }

            if (userCameFrom != null && applicationConfig.appSettings.listOfInstances.Where(i => i.id == userCameFrom).FirstOrDefault() == null)
                userCameFrom = null;

            DropDownList DropDownList1 = null;
            if (isloginpage)
            {
                DropDownList1 = (DropDownList)LoginUser.FindControl("dbdrop");
            }  

            if (userCameFrom == null)
            {
                List<dblist> dbs = new List<dblist>();
                if (applicationConfig == null || applicationConfig.appSettings == null)
                {
                    MFLog.LogInFile("Configuration app settings are null: check if a valid configuration file exists for the specified domain (tag ApplicationDomain).", MFLog.logtypes.ERROR);
                    Server.Transfer("/error.aspx?e=c");
                }
                //throw new Exception("No .config File has been found for the requested domain in path:: " + ConfigurationManager.AppSettings["appconfigurationpath"]);
                foreach (var db in applicationConfig.appSettings.listOfInstances)
                {
                    dblist d = new dblist();
                    d.id = db.id;
                    d.appInstancename = db.appInstancename;
                    dbs.Add(d);
                }
                if (!IsPostBack)
                {
                    DropDownList1.DataSource = dbs.OrderBy(x => x.appInstancename);
                    DropDownList1.DataBind();
                }
                if (dbs.Count == 1)
                {
                    userCameFrom = dbs.First().id;
                }
            }

            string headerFilePath;

            if (userCameFrom != null && System.IO.File.Exists(templateDirectory + userCameFrom + "_header.html"))
            {
                headerFilePath = templateDirectory + userCameFrom + "_header.html";
            }
            else
            {
                headerFilePath = Server.MapPath("~/Magic/HtmlTemplates/login/default_header.html");
            }
            if (HeaderContent != null)
            {
                HeaderContent.Text = ApplyPrefixToScripts(headerFilePath);
            }

            if (userCameFrom != null)
            {
                if (isloginpage)
                    DropDownList1.Visible = false;

                this.selectedconfig = applicationConfig.appSettings.listOfInstances.Where(i => i.id == userCameFrom).First();

                if (Request.QueryString["noSSO"] == null && !string.IsNullOrEmpty(selectedconfig.IdentityModelAuthURL))
                {
                    var state = Guid.NewGuid().ToString("N");
                    var nonce = Guid.NewGuid().ToString("N");
                    Response.Redirect(selectedconfig.IdentityModelAuthURL.Replace("{state}", state).Replace("{nonce}", nonce));
                    return;
                }

                if (registrationOpen != null && registrationOpen.Contains(userCameFrom))
                {
                    registerButton = true;
                }
                spansx.InnerText = selectedconfig.appLeftTitle;
                spandx.InnerText = selectedconfig.appRightTitle;

                if (!String.IsNullOrEmpty(selectedconfig.appLogoLoginPage))
                {
                    applogopic.Src = selectedconfig.appLogoLoginPage;
                    applogopic.Visible = true;
                    spandx.Visible = false;
                    spansx.Visible = false;
                }
            }

            //redirect drop
            if (!IsPostBack && applicationConfig.appSettings.Redirects != null && applicationConfig.appSettings.Redirects.Count > 0 && isloginpage)
            {
                DropDownList redirectDrop = (DropDownList)LoginUser.FindControl("RedirectDrop");

                redirectDrop.DataSource = new List<MFConfiguration.Redirect>
                { new MFConfiguration.Redirect
                    {
                        url = "",
                        label = applicationConfig.appSettings.applicationName
                    }
                }.Union(applicationConfig.appSettings.Redirects);
                redirectDrop.DataBind();
                redirectDrop.Visible = true;
            }

            //translation
            if (isloginpage)
            {
                if (SessionHandler.ApplicationInstanceId == "-1")
                    SessionHandler.ApplicationInstanceId = userCameFrom != null ? userCameFrom : applicationConfig.appSettings.listOfInstances.First().id;
                base.translationFileName = "Login";
                Button loginButton = (Button)LoginUser.FindControl("LoginButton");
                Button submitButton = (Button)form1.FindControl("SubmitButton");

                if (submitButton != null)
                    submitButton.Text = base.FindTranslation("submit", "Submit");

                loginButton.Text = base.FindTranslation("login", "Login");

                if (loginButton != null)
                {
                    Page.Form.DefaultButton = loginButton.UniqueID;
                }

                //Warn that IE is not fully supported 
                if (String.IsNullOrEmpty(message)  && (Request.Browser.Type.ToUpper().Contains("IE") 
                    || Request.Browser.Type.ToLower().Contains("internetexplorer"))) // replace with your check
                {
                    message = "WARNING - This browser is not fully supported. Google chrome(™)  is suggested.";


                }

            }
            else
            {
                base.translationFileName = "generatepassword";
            }
        }

        protected void Page_PreRender(object sender, EventArgs e)
        {
            if (!Page.IsPostBack)
            {
                HtmlHead h = (HtmlHead)Page.Header.FindControl("Head1");
                if (h != null)
                {
                    Utils.ReplaceHeadersRef(h);
                }
            }
        }

        protected void Login_Validate(object sender, EventArgs e)
        {
            DropDownList DropDownList1 = (DropDownList)LoginUser.FindControl("dbdrop");
            DropDownList redirectDrop = (DropDownList)LoginUser.FindControl("RedirectDrop");
            string id = userCameFrom != null ? userCameFrom : DropDownList1.SelectedValue;
            string redirectUrl = redirectDrop.SelectedValue;
            var selectedconfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, id);

            if (!login.Login(selectedconfig, LoginUser.UserName, LoginUser.Password, LoginUser.RememberMeSet, selectedconfig.appMainURL, Request, Response, null, redirectUrl))
            {
                LoginUser.FailureText = base.FindTranslation("loginFailed", "Your login attempt was not successful. Please try again.");

                //OM 14/04 #7153: introduced a check on blocked users
                EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[selectedconfig.appInstancename];
                bool flag = false;
                
                if (member.isUserLockedOut(LoginUser.UserName) && Boolean.TryParse(System.Configuration.ConfigurationManager.AppSettings["sendRecoveryMailIfBlocked"], out flag))
                {
                    SendRecoveryMail(sender,e,true);
                }

                // Does there exist a User account for this user?
                MembershipUser usrInfo = Membership.GetUser(LoginUser.UserName);
                if (usrInfo != null)
                {
                    if (!usrInfo.IsApproved)
                    {
                        LoginUser.FailureText = base.FindTranslation("notApproved", "Your account has not yet been approved. You cannot login until an administrator has approved your account.");
                    }
                }
            }
        }

        static bool IsValidEmail(string strIn)
        {
            // Return true if strIn is in valid e-mail format.
            //return Regex.IsMatch(strIn, @"^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$");
            //https://gitlab.ilosgroup.com/ilos/bug-fixing/-/issues/275  fails with mails ending with extensions like .bnpparibas
            return Regex.IsMatch(strIn, @"^([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,63}|[0-9]{1,3})(\]?)$");

        }


        protected void SendRecoveryMail(object sender, EventArgs e)
        {
            SendRecoveryMail(sender, e, false);
        }

            protected void SendRecoveryMail(object sender, EventArgs e, bool userBlocked)
        {
            //penetration test , rate limit for change password functionality. The tentative to change password are tracked into the database the logToDatabase setting has to be true
            bool verifyLimit = ApplicationSettingsManager.getLogToDatabase();

           
            string usernameOrEmail = ((TextBox)form1.FindControl("UserNameRecovery")).Text;

            if (usernameOrEmail == "" && userBlocked)
            {
                usernameOrEmail = LoginUser.UserName;
            }
            
            if (verifyLimit)
            {
               bool canDoIt =  MFLog.LogChangePasswordAttemptToDataBase(usernameOrEmail, HttpContext.Current.Request.UserHostAddress.ToString());
                if (canDoIt == false)
                {
                    message = base.FindTranslation("tooManyPasswordChangesPerHour");
                    return;
                }
            }

            DropDownList DropDownList1 = (DropDownList)LoginUser.FindControl("dbdrop");
            string id = userCameFrom != null ? userCameFrom : DropDownList1.SelectedValue;
            var selectedconfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, id);
            SessionHandler.ApplicationInstanceId = selectedconfig.id;
            SessionHandler.ApplicationDomainURL = Request.Url.Authority;
            EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[selectedconfig.appInstancename];
            MagicFramework.Data.MagicDBEntities c = DBConnectionManager.GetTargetEntityConnectionString() != null ? new MagicFramework.Data.MagicDBEntities(DBConnectionManager.GetTargetEntityConnectionString()) : new MagicFramework.Data.MagicDBEntities();
            MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            if (member.PasswordFormat == MembershipPasswordFormat.Hashed)
            {
                MagicFramework.Data.Magic_Mmb_Users user;
                if (IsValidEmail(usernameOrEmail))
                {
                    user = (from v in context.Magic_Mmb_Users.Where(x => x.Email == usernameOrEmail)
                            select v).FirstOrDefault();
                }
                else
                {
                    user = (from v in context.Magic_Mmb_Users.Where(x => x.Username == usernameOrEmail)
                            select v).FirstOrDefault();
                }

                if (user == null)
                {
                    if (ApplicationSettingsManager.getLogToDatabase() == true)
                        MFLog.LogToDatabase(MFLog.dblogevents.CHGPWD_WRONGMAIL, usernameOrEmail, HttpContext.Current.Request.UserHostAddress.ToString());
                    message = base.FindTranslation("pwdrec", "Ok");
                    return;
                }
                user.FailedPasswordAnswerAttemptWindowStart = DateTime.Now;
                context.SubmitChanges();
                try
                {
                    var tokenInfo = Tokens.Create(generatepassword.PW_TOKEN_PURPOSE, DateTime.Now.AddHours(8), user.UserID);
                    Mailer m = new Mailer();
                    m.SetTo(user.Email);
                    m.LoadTemplateFromDb("PWDREH", culture, true);
                    m.ReplaceTags(new Dictionary<string, string> {
                    { "0", SessionHandler.ApplicationDomainURL },
                    { "1", (string)tokenInfo["token"] },
                    { "2", "" },
                    { "3", id.ToString() }
                }, "{", "}");

                    if (m.Send())
                        message = base.FindTranslation("pwdrec", "Ok");
                    else
                        message = base.FindTranslation("errorMail", "Error on sending mail.");
					if (userBlocked)
					{

						Mailer blockedUserMail = new Mailer();
						blockedUserMail.SetTo(user.Email);
						blockedUserMail.LoadTemplateFromDb("USRBLK", culture, true);
						blockedUserMail.ReplaceTags(new Dictionary<string, string> {
					        { "Username", user.Username },
					        { "ApplicationName", SessionHandler.ApplicationDomainURL },
				        }, "{", "}");

                        if (blockedUserMail.Send())
                        {
                            message = "Controllare email per indicazioni!";

                        }
                        else
                            MFLog.LogInFile("Problems while sending email @SendRecoveryMail() , Blocked user email: " + user.Email, MFLog.logtypes.ERROR);



                    }
                }
                catch (Exception ex) {
                    Server.Transfer("/error.aspx?e=pwResetError");
                }
            }
        }

        protected void PasswordRecovery1_UserLookUpError(object sender, EventArgs e)
        {
            return;
        }
        private string ApplyPrefixToScripts(string filePath)
        {
            string htmlContent = File.ReadAllText(filePath);

            if (!string.IsNullOrEmpty(ServiceWorkerUrlPathPrefix))
            {
                // Updated regex to match any src or href attribute value that starts with "/"
                string patternSrc = "(src=\")(/[^\" ]+)";
                string patternHref = "(href=\")(/[^\" ]+)";
                string replacementSrc = $"$1{ServiceWorkerUrlPathPrefix}$2";
                string replacementHref = $"$1{ServiceWorkerUrlPathPrefix}$2";

                htmlContent = Regex.Replace(htmlContent, patternSrc, replacementSrc, RegexOptions.IgnoreCase);
                htmlContent = Regex.Replace(htmlContent, patternHref, replacementHref, RegexOptions.IgnoreCase);
            }

            return htmlContent;
        }
        static Dictionary<string, string> NvcToDictionary(NameValueCollection nvc)
        {
            var result = new Dictionary<string, string>();
            foreach (string key in nvc.Keys)
            {
                result.Add(key, nvc[key]);
            }

            return result;
        }
        /// <summary>
        /// Login of a user set in PublicSession
        /// </summary>
        public static bool LoginPublicUser(HttpRequest request, HttpResponse response)
        {
            string confs = System.Configuration.ConfigurationManager.AppSettings["publicSession"];
            string currentdomain = request.Url.GetLeftPart(UriPartial.Authority);
            string[] current = new string[4];
            bool found = false;
            foreach (var c in confs.Split(';'))
            {
                string[] cc = c.Split(',');
                if (currentdomain.Contains(cc[0]))
                {
                    current = cc;
                    found = true;
                }
            }
            if (!found)
                response.Redirect("/error.aspx?e=publicSessionWebConfig");
            var applicationConfig = new MFConfiguration(request.Url.Authority);
            var selectedconfig = applicationConfig.GetApplicationInstanceByID(request.Url.Authority, current[1]);

            EFMembershipProvider.SetConfigSessionAttributes(selectedconfig, request);
            EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[selectedconfig.appInstancename];
            if (member == null)
                response.Redirect("/error.aspx?e=webConfigMembership");

            string username = current[2];
            string pwd = current[3];

            if (member.ValidateUser(username, pwd))
            {
                FormsAuthentication.SetAuthCookie(username, false);
                return true;
            }
            else
                return false;
        
        }

        public static bool Login(
            MFConfiguration.ApplicationInstanceConfiguration config,
            string usernameOrEmail,
            string pw,
            bool remember,
            string landingpage,
            HttpRequest request,
            HttpResponse response,
            MagicFramework.Data.Magic_Mmb_Users userThatEntersWithoutPassword = null,
            string redirectToWithAuthorizationToken = "",
            string query = "?",
            string twoFactorAuthCode = null
        )
        {
            EFMembershipProvider.SetConfigSessionAttributes(config, request);
            EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[config.appInstancename];
            if (member == null)
                response.Redirect("/error.aspx?e=webConfigMembership");

            string username;

            if (userThatEntersWithoutPassword != null)
            {
                member.SetUserInfosSession(userThatEntersWithoutPassword, new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection()));
            }

            if (
                userThatEntersWithoutPassword != null
                || member.ValidateUser(usernameOrEmail, pw)
            )
            {
                //utente validato

                if (userThatEntersWithoutPassword == null && !IsTwoFactorAuthCodeValid(response, config, usernameOrEmail, request))
                {
                    return false;
                }

                try
                {
                    if (ApplicationSettingsManager.getLogToDatabase() == true)
                        MFLog.LogToDatabase(MFLog.dblogevents.USERACCESSOK, usernameOrEmail, HttpContext.Current.Request.UserHostAddress.ToString());
                }
                catch (Exception ex)
                {
                    MFLog.LogInFile("Problems while tracking user login: " + ex.Message, MFLog.logtypes.ERROR);
                }

                username = SessionHandler.Username;
                FormsAuthentication.SetAuthCookie(username, remember);
                if (remember)
                {
                    //insert auth cookie value in server cache with appInstanceId to restore user session -> check in MagicFramework.Helpers.SessionHandler.CheckAbortSessionAndRedirect
                    HttpCookie authCookie = response.Cookies[FormsAuthentication.FormsCookieName];
                    HttpContext.Current.Cache.Insert(authCookie.Value.ToString(), config.id, null, authCookie.Expires, System.Web.Caching.Cache.NoSlidingExpiration);
                }

                if (!string.IsNullOrEmpty(redirectToWithAuthorizationToken))
                {
                    string authToken = new MagicFramework.Models.Magic_Mmb_UsersExternalApiAuthorizations().CreateAuthToken(SessionHandler.IdUser, redirectToWithAuthorizationToken);
                    //Bug #5706 D.T force end of current response
                    response.Redirect(redirectToWithAuthorizationToken + "?auth=" + authToken + "&applicationName=" + config.appInstancename + "&origin=" + request.Url.Authority, true);
                }

                EFMembershipProvider.ActivateChatAndNotifications(config, username);

                //persist certain elements of the query
                if (query == "?")
                {
                    Dictionary<string, string> g = NvcToDictionary(request.QueryString);
                    foreach (var kv in g)
                    {
                        if (!kv.Key.Equals("token") && !kv.Key.Equals("from") && !kv.Key.Equals("ReturnUrl") && !kv.Key.Equals("code") && !kv.Key.Equals("state") && !kv.Key.Equals("oauth_token") && !kv.Key.Equals("oauth_verifier"))
                        {
                            query += kv.Key + "=" + kv.Value + "&";
                        }
                    }
                }
                query = query.Length == 1 ? "" : query.TrimEnd('&');
                if (request.QueryString["ReturnUrl"] != null && request.QueryString["ReturnUrl"] != "/")
                {
                    string completeReturnUrl = request.QueryString["ReturnUrl"];
                    if (request.Form["actualFragment"] !=null)
                    {
                        completeReturnUrl = completeReturnUrl + request.Form["actualFragment"];
                    }
                    var requestExtension = new MagicFramework.Helpers.RequestExtensions();
                    if (requestExtension.IsLocalUrl(completeReturnUrl))
                    {
                        string redirectTo = !(completeReturnUrl.Contains(query)) ? (completeReturnUrl + query) : completeReturnUrl;
                        response.Redirect(redirectTo, false);
                    }
                    else
                        return false;
                }
                else if (!String.IsNullOrEmpty(landingpage))
                {
                    response.Redirect(landingpage + query, false);
                }
                else
                    FormsAuthentication.RedirectFromLoginPage(username, false);
                return true;
            }
            else
            {
                try
                {
                    if (ApplicationSettingsManager.getLogToDatabase() == true)
                        MFLog.LogToDatabase(MFLog.dblogevents.USERACCESSKO, usernameOrEmail, HttpContext.Current.Request.UserHostAddress.ToString());
                }
                catch (Exception ex)
                {
                    MFLog.LogInFile("Problems while tracking user login: " + ex.Message, MFLog.logtypes.ERROR);
                }
                return false;
            }
        }

        private static bool IsTwoFactorAuthCodeValid(HttpResponse response, MFConfiguration.ApplicationInstanceConfiguration config, string usernameOrEmail, HttpRequest request)
        {
            if (!string.IsNullOrEmpty(config.TwoFactorAuthTool))
            {
                EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[config.appInstancename];
                var user = member.GetUser(usernameOrEmail);
                string token = (string)MagicFramework.Models.Tokens.Create("TwoFactorAuth", DateTime.Now.AddMinutes(5), user.UserID)["token"];
                string redirectUrl = config.TwoFactorAuthTool.ToLower() == "email" ? "twoFactorAuthMail.aspx" : "twoFactorAuth.aspx";
                if (request.QueryString["ReturnUrl"] != null && request.QueryString["ReturnUrl"] != "/")
                {  
                    string  returnUrl = request.QueryString["ReturnUrl"];
                    response.Redirect($"/{redirectUrl}?token=" + HttpUtility.UrlEncode(token) + "&ReturnUrl=" + returnUrl);
                    return false;
                }

                    response.Redirect($"/{redirectUrl}?token=" + HttpUtility.UrlEncode(token));
                return false;
            }
            else
            {
                return true;
            }
        }
    }
}
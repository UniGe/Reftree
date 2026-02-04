using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MagicFramework.MemberShip;
using System.Web.Security;
using System.Configuration;
using MagicFramework.Helpers;
using OAuth2.Client;
using System.Data.SqlClient;
using System.Net;
using System.Net.Http;
using IdentityModel.Client;

namespace MagicSolution
{
    public partial class auth : System.Web.UI.Page
    {
        private const string ProviderNameKey = "providerName";
        private const string UserCameFromKey = "userCameFrom";
        public  MFConfiguration applicationConfig;
        private string[] registrationOpen;
        private IClient Client;
        protected MFConfiguration.ApplicationInstanceConfiguration selectedconfig;
        public string message = "";

        private bool UserCameFromGlobalLogin()
        {
            if (Request.QueryString["token"] != null && Request.QueryString["host"] != null && Request.QueryString["user"] != null && Request.QueryString["application_name"] != null)
                return true;
            return false;

        }
        protected void Page_Load(object sender, EventArgs e)
        {
            try
            {
                applicationConfig = new MFConfiguration(Request.Url.Authority);

                if (Request.QueryString["applicationInstanceName"] != null)
                {
                    LoginUser();
                    return;
                }

                if (applicationConfig.appSettings.listOfInstances.Count == 1)
                    UserCameFrom = applicationConfig.appSettings.listOfInstances[0].id;
                else if (Request.QueryString["from"] != null)
                    UserCameFrom = Request.QueryString["from"];

                if (UserCameFrom != null)
                {
                    selectedconfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, UserCameFrom);
                }

                if (selectedconfig != null && !string.IsNullOrEmpty(selectedconfig.IdentityModelAuthURL))
                {
                    if (Request.QueryString["access_token"] == null)
                    {
                        return;
                    }
                    var userInfoClient = new UserInfoClient(new Uri(selectedconfig.IdentityModelUserInfoURL), Request.QueryString["access_token"]);
                    var userInfoResponseTask = userInfoClient.GetAsync();
                    userInfoResponseTask.Wait();
                    var userInfoResponse = userInfoResponseTask.Result;
                    string email = userInfoResponse.JsonObject.Property(selectedconfig.IdentityModelUserInfoJSONEmailPropertyName).Value.ToString();

                    MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(selectedconfig.TargetDBconn);
                    MagicFramework.Data.Magic_Mmb_Users user = context.Magic_Mmb_Users.Where(u => u.Email.Equals(email)).FirstOrDefault();
                    if (user == null)
                    {
                        message = "user not found";
                    }
                    else
                    {
                        login.Login(selectedconfig, user.Email, null, true, selectedconfig.appMainURL, Request, Response, user);
                        HttpContext.Current.Session["access_token"] = Request.QueryString["access_token"];
                    }
                    return;
                }
                else if (UserCameFrom != null && !UserCameFromGlobalLogin())
                {
                    registrationOpen = ConfigurationManager.AppSettings["registrationOpenFor"].Split(',');
                    selectedconfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, UserCameFrom);

                    if (selectedconfig.OAuth2Clients == null || !selectedconfig.OAuth2Clients.Any() || (!registrationOpen.Contains("All") && !registrationOpen.Contains(UserCameFrom)))
                        Server.Transfer("/error.aspx?e=registrationNotOpenForThisApp");

                    if (Request.QueryString["provider"] != null && ClientExists(Request.QueryString["provider"]))
                    {
                        ProviderName = Request.QueryString["provider"];
                        string loginUri = Client.GetLoginLinkUri();
                        try
                        {
                            Response.Redirect(loginUri);
                        }
                        catch (Exception ex)  {
                            MFLog.LogInFile("OAuth error: " + ex.Message, MFLog.logtypes.ERROR);
                        }
                    }
                    else if (ProviderName != null && ClientExists(ProviderName))
                    {
                        OAuth2.Models.UserInfo userInfo = Client.GetUserInfo(Request.QueryString);
                        applicationConfig = new MFConfiguration(Request.Url.Authority);
                        selectedconfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, UserCameFrom);

                        MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                        //get user by: UserSocialEmail in Magic_Mmb_UsersOAuth OR UserSocialId and ProviderName in Magic_Mmb_UsersOAuth OR Email in Magic_Mmb_Users (with current ApplicationName)
                        MagicFramework.Data.Magic_Mmb_Users user = null;
                        MagicFramework.Data.Magic_Mmb_UsersOAuth oauth = context.Magic_Mmb_UsersOAuth.Where(u => (u.UserSocialEmail.Equals(userInfo.Email) || u.UserSocialId == userInfo.Id && u.ProviderName.Equals(userInfo.ProviderName) || u.Magic_Mmb_Users.Email.Equals(userInfo.Email)) && u.Magic_Mmb_Users.ApplicationName == selectedconfig.appInstancename).FirstOrDefault();
                        if (oauth != null)
                            user = oauth.Magic_Mmb_Users;

                        if (user == null)
                        {
                            //create new user with provider
                            string errorMessage = "";
                            EFMembershipProvider.CreateUserData newUser = new EFMembershipProvider.CreateUserData();
                            newUser.Firstname = userInfo.FirstName;
                            newUser.Lastname = userInfo.LastName;
                            newUser.Email = userInfo.Email;
                            newUser.Name = newUser.Firstname + " " + newUser.Lastname;
                            newUser.Username = EFMembershipProvider.GetUniqueUserName(userInfo.Email.Substring(0, userInfo.Email.IndexOf("@")));
                            newUser.SocialId = userInfo.Id;
                            newUser.SocialProvider = userInfo.ProviderName;
                            newUser.SocialEmail = userInfo.Email;
                            newUser.Password = "";

                            if (!string.IsNullOrEmpty(userInfo.PhotoUri))
                                newUser.UserImg = saveFile(userInfo);

                            if (EFMembershipProvider.CreateUser(newUser, out errorMessage) != null)
                            {
                                user = context.Magic_Mmb_Users.Where(u => u.Email.Equals(userInfo.Email) && u.ApplicationName == selectedconfig.appInstancename).FirstOrDefault();

                                Mailer mailer = new Mailer(Request.Url.Authority, selectedconfig.id);
                                mailer.SetSubject("New registration on "  + selectedconfig.appInstancename);
                                mailer.SetBody(string.Format("New registration on {0} via OAuth\nOauth provider: {1}\nUser email: {2}\nUser id: {3}\n", selectedconfig.appInstancename, ProviderName, user.Email, user.UserID.ToString()), false);
                                mailer.SetTo(selectedconfig.appEmail);
                                try
                                {
                                    mailer.Send();
                                }
                                catch { }
                            }
                        }
                        else
                        {
                            EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[selectedconfig.appInstancename];
                            MagicFramework.Data.Magic_Mmb_UsersOAuth provider = user.Magic_Mmb_UsersOAuth.Where(oa => oa.ProviderName.Equals(userInfo.ProviderName) && oa.UserSocialId.Equals(userInfo.Id)).FirstOrDefault();
                            if (provider == null)
                            {
                                //set UserImg if available and not set
                                if (string.IsNullOrEmpty(user.UserImg) && !string.IsNullOrEmpty(userInfo.PhotoUri))
                                    user.UserImg = saveFile(userInfo);

                                //user exists but first login with current provider -> add provider in Magic_Mmb_UsersOAuth
                                MagicFramework.Data.Magic_Mmb_UsersOAuth oa = new MagicFramework.Data.Magic_Mmb_UsersOAuth();
                                oa.ProviderName = userInfo.ProviderName;
                                oa.UserSocialId = userInfo.Id;
                                oa.UserSocialEmail = userInfo.Email;
                                oa.Magic_Mmb_Users = user;
                                context.Magic_Mmb_UsersOAuth.InsertOnSubmit(oa);
                                context.SubmitChanges();
                            }
                            else if (provider.UserSocialEmail == null)
                            {
                                provider.UserSocialEmail = userInfo.Email;
                                context.SubmitChanges();
                            }
                        }

                        if (user != null)
                        {
                            try
                            {
                                login.Login(selectedconfig, user.Email, null, true, selectedconfig.appMainURL, Request, Response, user);
                            }
                            catch { }
                        }
                    }
                }
                else if (UserCameFromGlobalLogin())
                {
                    LoginGlobalUser();
                    return;
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("OAuth error: " + ex.Message, MFLog.logtypes.ERROR);
            }
            //DB 29/12 Tolto per problemi con social plugin
            //Response.Redirect("/login.aspx");
        }

        private void LoginUser()
        {
            try
            {
                string[] authorization = Request.Headers["Authorization"].Split(' ');
                string[] usernamePassword = MagicFramework.Helpers.Utils.Base64Decode(authorization[1]).Split(':');
                string username = usernamePassword[0];
                string password = usernamePassword[1];

                var applicationInstanceConfig = applicationConfig.GetApplicationInstanceByInstanceName(applicationConfig.appSettings.applicationDomain, Request.QueryString["applicationInstanceName"].ToString());

                if (!login.Login(applicationInstanceConfig, username, password, true, applicationInstanceConfig.appMainURL, Request, Response))
                {
                    Response.StatusCode = 403;
                }
                else
                {
                    Response.StatusCode = 200;
                    Response.Write(Response.Cookies.ToString());
                    HttpContext.Current.ApplicationInstance.CompleteRequest();
                }
            }
            catch (Exception e)
            {
                message = e.ToString();
                Response.StatusCode = 500;
            }
        }

        #region Global Users

        private void LoginGlobalUser()
        {
            string token = Request.QueryString["token"];
            string host = Request.QueryString["host"];
            string username = Request.QueryString["user"];
            string applicationName = Request.QueryString["application_name"];
            var config = new MFConfiguration().GetApplicationInstanceByInstanceName(Request.Url.Authority, applicationName);
            if(config != null)
            {
                try
                {
                    string query = @"SELECT
                                     user_id,
                                     auth_host
                                FROM dbo.Magic_Mmb_GlobalUsers
                                WHERE
                                    active = 1
                                    AND global_username = @username
                                    AND auth_host = @auth_host";
                    using (SqlConnection connection = new SqlConnection(config.TargetDBconn))
                    {
                        SqlCommand command = new SqlCommand(query, connection);
                        command.Parameters.AddWithValue("@username", username);
                        command.Parameters.AddWithValue("@auth_host", host);
                        connection.Open();
                        SqlDataReader reader = command.ExecuteReader();
                        if(!reader.HasRows)
                            message = "Not authorized for this application. Please contact an administrator.";
                        reader.Read();
                        int userId = (int)reader["user_id"];
                        host = (string)reader["auth_host"];
                        if(userId > 0)
                        {
                            string response;
                            string protocol = "https://";
                            if (System.Web.Configuration.WebConfigurationManager.AppSettings["disableHTTPS"] != null  && System.Web.Configuration.WebConfigurationManager.AppSettings["disableHTTPS"].Equals("true"))
                                protocol = "http://";
                            using (var client = new HttpClient())
                            {
                                var task = client.GetStringAsync(protocol + host + "/api/Auth/CheckToken?token=" + token + "&application_name=" + applicationName + "&username=" + username);
                                task.Wait();
                                response = task.Result;
                            }
                            if (response.Equals(username)) {
                                MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(config.TargetDBconn);
                                var user = context.Magic_Mmb_Users.Where(u => u.UserID == userId && u.ApplicationName == config.appInstancename).FirstOrDefault();
                                if (login.Login(config, user.Username, null, true, config.appMainURL, Request, Response, user, "", ""))
                                    SessionHandler.LoginPoint = protocol + host + "/global_login.aspx";
                            }
                        }
                    }
                }
                catch (Exception e)
                {
                    message = e.Message;
                    return;
                }
            }
            else
            {
                message = "Application not found";
            }
        }

        #endregion

        private string saveFile(OAuth2.Models.UserInfo userInfo)
        {
            try
            {
                Uri uri = new Uri(userInfo.PhotoUri);
                string filename = System.IO.Path.GetFileName(uri.LocalPath);
                Int32 timestamp = (Int32)(DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1))).TotalSeconds;
                string rootdir = ApplicationSettingsManager.GetRootdirforupload();
                string root = HttpContext.Current.Server.MapPath("~");

                if (rootdir == null)
                    rootdir = root;
                if (!System.Text.RegularExpressions.Regex.IsMatch(filename, @"\.[a-zA-Z]{3,5}$"))
                    filename = filename + ".jpg";

                string filepath = string.Format("\\Views\\AccountImages\\{0}-{1}", timestamp, filename);

                using (System.Net.WebClient client = new System.Net.WebClient())
                {
                    client.DownloadFile(userInfo.ProviderName == "Facebook" ? "https://graph.facebook.com/" + userInfo.Id + "/picture?type=large" : userInfo.PhotoUri, rootdir + filepath);
                    return filepath.Replace("\\", "/");
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Save File error in auth.aspx: " + ex.Message, MFLog.logtypes.ERROR);
            }
            return userInfo.PhotoUri;
        }

        private bool ClientExists(string provider)
        {
            Client = new MagicAuthorizationRoot(selectedconfig, Request.Url.Scheme + "://" + Request.Url.Authority).Clients.First(c => c.Name.ToLower().Equals(provider.ToLower()));
            return Client != null;
        }

        private string ProviderName
        {
            get { return (string)Session[ProviderNameKey]; }
            set { Session[ProviderNameKey] = value; }
        }

        private string UserCameFrom
        {
            get { return (string)Session[UserCameFromKey]; }
            set { Session[UserCameFromKey] = value; }
        }

        public static string GetOAuthLinks(MFConfiguration.ApplicationInstanceConfiguration selectedconfig, string title, System.Web.HttpRequest Request)
        {
            int i = 0;
            string links = string.Empty;
            MFConfiguration applicationConfig = new MFConfiguration(Request.Url.Authority);
            IEnumerable<LoginInfoModel> models = new MagicAuthorizationRoot(selectedconfig, Request.Url.Scheme + "://" + Request.Url.Authority).Clients.Select(client => new LoginInfoModel
            {
                ProviderName = client.Name
            });

            if (!models.Any())
                return "";

            string userCameFromQueryParam = applicationConfig.appSettings.listOfInstances.Count == 1 ? string.Empty : string.Format("?from={0}", selectedconfig.id);
            foreach (LoginInfoModel loginInfo in models)
            {
                i++;
                links += string.Format("<a class='btn {1}' href='/auth/{1}{3}' title='{0}'>{2}</a>", loginInfo.ProviderName, loginInfo.ProviderName.ToLower(), GetOauthProviderIcon(loginInfo.ProviderName), userCameFromQueryParam);
            }
            return string.Format("{2}<div class='social-login-links'><h4>{0}</h4>{1}</div><p>&nbsp;</p>", title, links, GetOauthLinksCSS());
        }

        private static string GetOauthLinksCSS()
        {
            return "<style>.social-login-links .btn>i{font-size:1.5em;line-height:1;width:1em;}.social-login-links .btn:hover{box-shadow:rgba(255,255,255,0.8) 0 0 4px 1px;}.social-login-links .btn,.social-login-links i{color:#fff;}.social-login-links .btn{margin:0 5px;line-height:initial;padding:7px 8px;}.social-login-links .btn:first-of-type{margin-left:0;}.social-login-links .btn:last-of-type{margin-right:0;}.btn.facebook{background:#3b5998;}.btn.twitter{background:#00aced;}.btn.google{background:#DC4E41;}.btn.linkedin{background:#007bb5;}.btn.vkontakte{background:#45668e;}.btn.yandex{background:#f00;}.btn.mailru{background:#168de2;}.btn.foursquare{background:#2d5be3;}.btn.windowslive{background:#0072c6;}.btn.instagram{background:#125688;}.btn.xing{background:#126567;}.btn.odnoklassniki{background:#ed812b;}.btn.digitalocean{background:#288feb;}.btn.github{background:#333;}.btn.asana{background:#1f8dd6;}</style>";
        }

        private static string GetOauthProviderIcon(string providerName)
        {
            switch (providerName)
            {
                case "Vkontakte":
                    return "<i class='fa fa-vk'></i>";
                case "WindowsLive":
                    return "<i class='fa fa-windows'></i>";
                //todo: fix if available in FA
                case "Yandex":
                    return "<i class='fa fa-yahoo'></i>";
                case "DigitalOcean":
                    return "<i class='fa fa-cloud'></i>";
                case "MailRu":
                    return "<i style='color:#ffa930'>@</i>";
                case "Asana":
                    return "<i>a</i>";
                default:
                    return string.Format("<i class='fa fa-{0}'></i>", providerName.ToLower());
            }
        }

        public class LoginInfoModel
        {
            public string ProviderName { get; set; }
        }
    }
}
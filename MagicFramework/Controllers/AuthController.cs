using MagicFramework.Controllers.ActionFilters.Access;
using MagicFramework.Helpers;
using MagicFramework.MemberShip;
using MagicFramework.Models;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Web;
using System.Web.Http;
using System.Web.Security;

namespace MagicFramework.Controllers
{
    public class AuthController : ApiController
    {
        const int DEFAULT_TOKEN_VALIDITY_DAYS = ValidToken.DEFAULT_TOKEN_VALIDITY_DAYS;
        const int DEFAULT_REFRESH_TOKEN_VALIDITY_DAYS = 30;

        #region External Auth

        [HttpPost]
        public HttpResponseMessage ExternalLogin(dynamic data)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.Content = new StringContent("Wrong credentials");
            res.StatusCode = HttpStatusCode.Forbidden;

            string username = data.username.ToString();
            string password = data.password.ToString();
            string applicationInstanceName = data.applicationInstanceName.ToString();

            MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
            MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.FirstOrDefault(a => a.appInstancename.Equals(applicationInstanceName));

            if (config != null)
            {

                SessionHandler.ApplicationInstanceId = config.id;
                SessionHandler.ApplicationInstanceName = config.appInstancename;
                SessionHandler.ApplicationDomainURL = Request.RequestUri.Authority;
                try
                {
                    EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[config.appInstancename];

                    if (member.ValidateUser(username, password)) {
                        var user = member.GetUser(username);
                        return LoginUserWithoutRedirect(applicationInstanceName, user.UserID);                    
                    }
                }
                catch (Exception e)
                {
                    res.Content = new StringContent(e.Message);
                } 
            }
            
            return res;
        }

        private HttpResponseMessage LoginUserWithoutRedirect(string applicationInstanceName, int userId)
        {
            MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
            MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(applicationInstanceName)).FirstOrDefault();
            if (config == null)
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, "No app configuration found.");

            SessionHandler.ApplicationInstanceId = config.id;
            SessionHandler.ApplicationInstanceName = config.appInstancename;
            SessionHandler.ApplicationDomainURL = Request.RequestUri.Authority;

            EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[config.appInstancename];
            if (member == null)
                return Request.CreateErrorResponse(HttpStatusCode.InternalServerError, "Membership provider not found.");

            MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(config.TargetDBconn);
            MagicFramework.Data.Magic_Mmb_Users user = context.Magic_Mmb_Users.Where(u => u.UserID.Equals(userId) && u.ApplicationName.Equals(applicationInstanceName)).FirstOrDefault();
            if (user == null)
                return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "User not found.");

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

            UserInfo userInfo = new UserInfo
            {
                Username = SessionHandler.Username,
                UserID = SessionHandler.IdUser,
                ApplicationName = SessionHandler.ApplicationInstanceName,
                IsDeveloper = SessionHandler.UserIsDeveloper,
                UserVisibilityGroup = SessionHandler.UserVisibilityGroup,
                UserCultureCode = SessionHandler.UserCultureCode,
            };
            string userInfoJson = Newtonsoft.Json.JsonConvert.SerializeObject(userInfo);

            HttpResponseMessage r = new HttpResponseMessage();
            r.StatusCode = HttpStatusCode.OK;
            r.Content = new StringContent(userInfoJson);
            return r;
        }

        #endregion

        #region User Token Auth

        [HttpGet]
        public void TokenLogin(string token, string applicationInstanceName, string ReturnUrl = null)
        {
            try
            {
                MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
                MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(applicationInstanceName)).First();

                var dbToken = Tokens.GetValidToken(token, "SSO", config.TargetDBconn);

                if (dbToken != null)
                {
                    int userID = dbToken.Field<int>("user_id");
                    MagicFramework.Helpers.Sql.DBQuery queryUser = new MagicFramework.Helpers.Sql.DBQuery("SELECT * FROM dbo.Magic_Mmb_Users");
                    queryUser.AddWhereCondition("UserID = @uid", userID);
                    queryUser.AddWhereCondition("[ApplicationName] = @app", applicationInstanceName);
                    queryUser.connectionString = config.TargetDBconn;
                    System.Data.DataTable result2target = queryUser.Execute();
                    if (result2target.Rows.Count == 0 || result2target == null)
                        HttpContext.Current.Server.Transfer("/error.aspx?e=userNotFoundTargetDB");

                    Tokens.InvalidateToken(token, config.TargetDBconn);

                    this.LoginUser(applicationInstanceName, userID, ReturnUrl);
                }
                else
                    HttpContext.Current.Server.Transfer("/error.aspx?e=tokenNotFound");
            }
            catch (Exception ex)
            {
                MagicFramework.Helpers.MFLog.LogInFile(ex.ToString(), MFLog.logtypes.ERROR);
                HttpContext.Current.Server.Transfer("/error.aspx?e=checkAppLog");
            }
        }

        private void LoginUser(string applicationInstanceName, int userId, string ReturnUrl)
        {
            MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
            MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(applicationInstanceName)).FirstOrDefault();
            if (config == null)
                HttpContext.Current.Server.Transfer("/error.aspx?e=noAppConfig");

            SessionHandler.ApplicationInstanceId = config.id;
            SessionHandler.ApplicationInstanceName = config.appInstancename;
            SessionHandler.CustomFolderName = config.customFolderName != null ? config.customFolderName : config.id;
            SessionHandler.ApplicationDomainURL = Request.RequestUri.Authority;

            EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[config.appInstancename];
            if (member == null)
                HttpContext.Current.Server.Transfer("/error.aspx?e=webConfigMembership");
            MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(config.TargetDBconn);
            MagicFramework.Data.Magic_Mmb_Users user = context.Magic_Mmb_Users.Where(u => u.UserID.Equals(userId) && u.ApplicationName.Equals(applicationInstanceName)).FirstOrDefault();
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
            HttpContext.Current.Response.Redirect(String.IsNullOrEmpty(ReturnUrl) ? "/" + config.appMainURL : ReturnUrl);
        }

        #endregion

        #region API Token Auth

        [HttpGet]
        public HttpResponseMessage Token(string instanceName, string purpose)
        {
            try
            {
                ValidToken.SetSessionData(instanceName);
                IEnumerable<string> headerValues;
                string apiKey = null;
                if (Request.Headers.TryGetValues("API_KEY", out headerValues))
                {
                    apiKey = headerValues.First();
                }
                if (string.IsNullOrEmpty(apiKey))
                {
                    return ResponseHelper.Error("no API_KEY header provided", System.Net.HttpStatusCode.BadRequest, true);
                }

                string configApiKey = MFConfiguration.GetApplicationInstanceConfiguration().CustomSettings
                    .Where(s => s.Key.Equals($"APIKey{purpose}") && s.Value.Equals(apiKey))
                    .FirstOrDefault()?.Value;
                if (string.IsNullOrEmpty(configApiKey))
                {
                    return ResponseHelper.Error($"custom configuration setting \"APIKey{purpose}\" not found or API_KEY not found", System.Net.HttpStatusCode.Unauthorized, true);
                }

                return CreateTokensAndReturnData(purpose);
            }
            catch (Exception e)
            {
                MFLog.LogInFile("Token api exception " + e.ToString(), MFLog.logtypes.INFO);
                return ResponseHelper.Error(e, HttpStatusCode.InternalServerError, true);
            }
        }

        private static HttpResponseMessage CreateTokensAndReturnData(string purpose, int tokenValidDays = DEFAULT_TOKEN_VALIDITY_DAYS, int refreshTokenValidDays = DEFAULT_REFRESH_TOKEN_VALIDITY_DAYS)
        {
            var tokenExpires = DateTime.Now.AddDays(tokenValidDays);
            var token = Tokens.Create($"AuthToken{purpose}", tokenExpires);
            var refreshToken = Tokens.Create($"RefreshToken{purpose}", DateTime.Now.AddDays(refreshTokenValidDays));

            return ResponseHelper.JSON(new
            {
                Token = token["token"],
                RefreshToken = refreshToken["token"],
                Expires = tokenExpires,
            });
        }

        [HttpGet]
        public HttpResponseMessage RefreshToken(string refreshToken, string instanceName, string purpose)
        {
            try
            {
                ValidToken.SetSessionData(instanceName);
                var token = Tokens.GetValidToken(refreshToken, $"RefreshToken{purpose}");

                if (token == null)
                {
                    return ResponseHelper.Error("refreshToken not found", System.Net.HttpStatusCode.Unauthorized, true);
                }

                Tokens.InvalidateToken(refreshToken);

                return CreateTokensAndReturnData(purpose);
            }
            catch (Exception e)
            {
                return ResponseHelper.Error(e, HttpStatusCode.InternalServerError, true);
            }
        }

        #endregion

        #region Login Redirect

        [RestricedToRedirectDomains]
        [HttpPost]
        public HttpResponseMessage UserData(dynamic data)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            string applicationName;
            string token;
            try
            {
                applicationName = data.applicationName.ToString();
                token = data.token.ToString();
            }
            catch
            {
                res.StatusCode = HttpStatusCode.Forbidden;
                res.Content = new StringContent("At least one of the required data is missing or in the wrong format");
                return res;
            }
            var authService = new Models.Magic_Mmb_UsersExternalApiAuthorizations(Request.RequestUri.Authority, applicationName);
            var authObject = authService.GetValidAuthObject(token);
            if(authObject == null)
            {
                res.StatusCode = HttpStatusCode.Forbidden;
                res.Content = new StringContent("Invalid Token");
                return res;
            }
            res.StatusCode = HttpStatusCode.OK;
            string displayName = authObject.Magic_Mmb_Users.FirstName + " " + authObject.Magic_Mmb_Users.LastName;
            displayName = displayName.Trim();
            if (string.IsNullOrEmpty(displayName))
                displayName = authObject.Magic_Mmb_Users.Username;
            res.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(
                new
                {
                    userID = authObject.user_id,
                    displayName = displayName
                }
            ));
            return res;
        }

        #endregion

        #region Global Users
        
        [HttpGet]
        public HttpResponseMessage CheckToken(string token, string application_name, string username)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.Forbidden;
            username = ConsumeToken(token, application_name, username);
            if(username != null)
            {
                res.Content = new StringContent(username);
                res.StatusCode = HttpStatusCode.OK;
            }
            return res;
        }

        public HttpResponseMessage LoginGlobalUser(GlobalUserLoginData userData)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.Forbidden;
            try
            {
                var user = GetGlobalUserByName(userData.username);
                bool authorized = MagicFramework.Helpers.Crypto.CheckPassword(userData.password, new Helpers.Crypto.HashAndSalt {
                    salt = user.salt,
                    hash = user.password
                });
                if (authorized)
                {
                    string token = GetGlobalUserToken(user.id);
                    if(token != null)
                    {
                        JObject resData = new JObject();
                        resData["token"] = token;
                        resData["applications"] = JArray.FromObject(GetGlobalUserApplications(user.id));
                        res.StatusCode = HttpStatusCode.OK;
                        res.Content = new StringContent(resData.ToString());
                    }
                }
            }
            catch (Exception e) {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        private List<ApplicationInfo> GetGlobalUserApplications(int userId)
        {
            try
            {
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                List<ApplicationInfo> userApplications = new List<ApplicationInfo>();
                string query = @"SELECT
                                    application_name,
                                    host,
                                    a.path as application_path,
                                    p.path
                                FROM dbo.user_applications a
                                INNER JOIN dbo.user_permissions p
                                    ON a.id = p.user_application_id
		                            AND p.user_id = @user_id
                                WHERE
                                    p.active = 1
                                    AND a.active = 1";
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    SqlCommand command = new SqlCommand(query, connection);
                    command.Parameters.AddWithValue("@user_id", userId);
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        userApplications.Add(new ApplicationInfo {
                            application_name = (string)reader["application_name"],
                            path = (reader["path"] != System.DBNull.Value ? (string)reader["path"] : reader["application_path"] != System.DBNull.Value ? (string)reader["application_path"] : ""),
                            host = (string)reader["host"]
                        });
                    }
                    return userApplications;
                }
            }
            catch (Exception e)
            {
                return null;
            }
        }

        public class ApplicationInfo
        {
            public string path { get; set; }
            public string application_name { get; set; }
            public string host { get; set; }
        }

        private string ConsumeToken(string token, string applicationName, string username)
        {
            try
            {
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                string query = @"SELECT
                                     t.id,
                                     token
                                FROM dbo.auth_tokens t
                                INNER JOIN dbo.users u
                                    ON
                                        t.user_id = u.id
                                        AND u.username = @username
                                WHERE
                                    t.token = @token
                                    AND t.created > @tenMinsInPast
                                    AND t.used_at IS NULL";
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    int id;
                    SqlCommand command = new SqlCommand(query, connection);
                    command.Parameters.AddWithValue("@token", token);
                    command.Parameters.AddWithValue("@tenMinsInPast", DateTime.Now.AddMinutes(-10));
                    command.Parameters.AddWithValue("@username", username);
                    connection.Open();
                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        reader.Read();
                        token = (string)reader["token"];
                        id = (int)reader["id"];
                    }
                    if (!string.IsNullOrWhiteSpace(token))
                    {
#if DEBUG
                        string update = @"UPDATE dbo.auth_tokens
                                            SET
                                                user_application_id =
                                                    (SELECT TOP 1
                                                            id
                                                        FROM dbo.user_applications
                                                        WHERE
                                                            application_name = @application_name),
                                                used_at = @now
                                            WHERE id = @id";
#else
                        string update = @"UPDATE dbo.auth_tokens
                                            SET
                                                user_application_id =
                                                    (SELECT TOP 1
                                                            id
                                                        FROM dbo.user_applications
                                                        WHERE
                                                            host = @host
                                                            AND application_name = @application_name),
                                                used_at = @now
                                            WHERE id = @id";
#endif
                        SqlCommand updateCommand = new SqlCommand(update, connection);
#if !DEBUG
                        updateCommand.Parameters.AddWithValue("@host", HttpContext.Current.Request.ServerVariables["REMOTE_HOST"]);
#endif
                        updateCommand.Parameters.AddWithValue("@application_name", applicationName);
                        updateCommand.Parameters.AddWithValue("@now", DateTime.Now);
                        updateCommand.Parameters.AddWithValue("@id", id);
                        updateCommand.ExecuteNonQuery();
                        return username;
                    }
                }
            }
            catch (Exception e)
            {
                MFLog.LogInFile(e.Message, MFLog.logtypes.ERROR, "GlobalUserErrors.txt");
            }
            return null;
        }

        private int GetApplicationId(string applicationName)
        {
            string host = HttpContext.Current.Request.ServerVariables["REMOTE_HOST"];
            if (!string.IsNullOrWhiteSpace(host))
            {
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                string query = @"SELECT
                                     id,
                                     token
                                FROM dbo.auth_tokens t
                                INNER JOIN dbo.users u
                                    ON
                                        t.user_id = u.id
                                WHERE
                                    u.username = @username
                                    AND t.token = @token
                                    AND t.created > @tenMinsInPast";
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    SqlCommand command = new SqlCommand(query, connection);
                    command.Parameters.AddWithValue("@tenMinsInPast", DateTime.Now.AddMinutes(-10));
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();
                    reader.Read();
                }
            }
            return 0;
        }

        private string GetGlobalUserToken(int userId)
        {
            try
            {
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                string token = MagicFramework.Helpers.Crypto.RandomString(111);
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    string deleteOldTokensStatement = @"DELETE FROM dbo.auth_tokens
                                                        WHERE
                                                            user_id = @user_id
                                                            AND used_at IS NULL";
                    using (SqlCommand command = new SqlCommand(deleteOldTokensStatement, connection))
                    {
                        command.Parameters.AddWithValue("@user_id", userId);
                        connection.Open();
                        command.ExecuteNonQuery();
                    }
                    string statement = @"INSERT INTO dbo.auth_tokens
                                            (
                                                token,
                                                user_id,
                                                created
                                            )
                                        VALUES (
                                                @token,
                                                @user_id,
                                                @created
                                        )";
                    using (SqlCommand command = new SqlCommand(statement, connection))
                    {
                        command.Parameters.AddWithValue("@token", token);
                        command.Parameters.AddWithValue("@user_id", userId);
                        command.Parameters.AddWithValue("@created", DateTime.Now);
                        command.ExecuteNonQuery();
                        return token;
                    }
                }
            }
            catch (Exception e)
            {
                return null;
            }
        }

        private GlobalUser GetGlobalUserByName(string username)
        {
            try
            {
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                string query = @"SELECT
                                     [username]
                                    ,[password]
                                    ,[salt]
                                    ,[id]
                                FROM dbo.users
                                WHERE
                                    username = @username";
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    SqlCommand command = new SqlCommand(query, connection);
                    command.Parameters.AddWithValue("@username", username);
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();
                    reader.Read();
                    return new GlobalUser
                    {
                        password = (byte[])reader["password"],
                        salt = (byte[])reader["salt"],
                        username = username,
                        id = (int)reader["id"]
                    };
                }
            }
            catch (Exception e)
            {
                return null;
            }
        }

        private int CreateGlobalUserOrUpdatePassword(GlobalUserData userData)
        {
            int id = 0;
            if(string.IsNullOrWhiteSpace(userData.username))
                throw new Exception("Username must be set");
            string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
            if (userData.id < 1)
            {
                if (string.IsNullOrWhiteSpace(userData.password))
                    throw new Exception("Password must be set");
                if (GetGlobalUserByName(userData.username) != null)
                    throw new Exception("Username already in use");
                var hashAndSalt = MagicFramework.Helpers.Crypto.CreatePasswordHashAndSalt(userData.password);
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    string statement = @"INSERT INTO dbo.users
                                    (
                                        username,
                                        password,
                                        salt
                                    )
                                OUTPUT INSERTED.ID
                                VALUES (
                                        @username,
                                        @password,
                                        @salt
                                )";
                    using (SqlCommand command = new SqlCommand(statement, connection))
                    {
                        command.Parameters.AddWithValue("@username", userData.username);
                        command.Parameters.AddWithValue("@password", hashAndSalt.hash);
                        command.Parameters.AddWithValue("@salt", hashAndSalt.salt);
                        connection.Open();
                        id = (int)command.ExecuteScalar();
                    }
                }
            }
            else if (!string.IsNullOrWhiteSpace(userData.password))
            {
                var hashAndSalt = MagicFramework.Helpers.Crypto.CreatePasswordHashAndSalt(userData.password);
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    string statement = @"UPDATE dbo.users
                                                SET password = @password,
                                                salt = @salt
                                                WHERE id = @user_id";
                    using (SqlCommand command = new SqlCommand(statement, connection))
                    {
                        command.Parameters.AddWithValue("@user_id", userData.id);
                        command.Parameters.AddWithValue("@password", hashAndSalt.hash);
                        command.Parameters.AddWithValue("@salt", hashAndSalt.salt);
                        connection.Open();
                        command.ExecuteNonQuery();
                    }
                }
            }
            return userData.id;
        }

        [OnlyGlobalUserManagingApplication]
        [HttpGet]
        public HttpResponseMessage GlobalUsersList(string q = "", int take = 20, int page = 1)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.InternalServerError;
            try
            {
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                string where = string.IsNullOrWhiteSpace(q) ? "" : " WHERE username LIKE @searchcondition";
                string query = @"SELECT
                                     [username]
                                    ,[id]
                                FROM dbo.users"
                                + where +
                                @" 
                                ORDER BY
                                    username
                                    OFFSET @page ROWS
                                    FETCH NEXT @take ROWS ONLY";
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    SqlCommand command = new SqlCommand(query, connection);
                    if(where != "")
                        command.Parameters.AddWithValue("@searchcondition", "%" + q + "%");
                    command.Parameters.AddWithValue("@page", --page * take);
                    command.Parameters.AddWithValue("@take", take);
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();
                    JArray usersArray = new JArray();
                    while (reader.Read())
                    {
                        usersArray.Add(
                            new JObject
                                {
                                    {"id", (int)reader["id"]  },
                                    {"username", (string)reader["username"]  }
                                }
                        );
                    }
                    res.Content = new StringContent(usersArray.ToString());
                    res.StatusCode = HttpStatusCode.OK;
                }
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [OnlyGlobalUserManagingApplication]
        [HttpGet]
        public HttpResponseMessage GlobalUserApplicationsList()
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.InternalServerError;
            try
            {
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                string query = @"SELECT
                                    id,
                                    host,
                                    [path] AS application_path,
                                    active AS application_active,
                                    application_name
                                FROM dbo.user_applications
                                ORDER BY
                                    application_name,
                                    host";
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    SqlCommand command = new SqlCommand(query, connection);
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();
                    res.Content = new StringContent(DBUtils.GetJArrayFromReader(reader).ToString());
                    res.StatusCode = HttpStatusCode.OK;
                }
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [OnlyGlobalUserManagingApplication]
        [HttpGet]
        public HttpResponseMessage GlobalUserPermissions(int id)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.InternalServerError;
            try
            {
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                string query = @"SELECT
                                    id,
                                    host,
                                    a.[path] AS application_path,
                                    p.[path],
                                    a.active AS application_active,
                                    p.active,
                                    application_name
                                FROM dbo.user_applications a
                                INNER JOIN
                                    dbo.user_permissions p
                                    ON a.id = p.user_application_id
                                WHERE user_id = @id
                                ORDER BY
                                    application_name,
                                    host";
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    SqlCommand command = new SqlCommand(query, connection);
                    command.Parameters.AddWithValue("@id", id);
                    connection.Open();
                    SqlDataReader reader = command.ExecuteReader();
                    res.Content = new StringContent(DBUtils.GetJArrayFromReader(reader).ToString());
                    res.StatusCode = HttpStatusCode.OK;
                }
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [OnlyGlobalUserManagingApplication]
        [HttpDelete]
        public HttpResponseMessage DeleteGlobalUser(int id)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.InternalServerError;
            try
            {
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    string statement = @"DELETE from dbo.users
                                        WHERE id = @id";
                    using (SqlCommand command = new SqlCommand(statement, connection))
                    {
                        command.Parameters.AddWithValue("@id", id);
                        connection.Open();
                        command.ExecuteNonQuery();
                        res.StatusCode = HttpStatusCode.OK;
                    }
                }
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [OnlyGlobalUserManagingApplication]
        [HttpDelete]
        public HttpResponseMessage DeleteApplication(int id)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.InternalServerError;
            try
            {
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    string statement = @"DELETE from dbo.user_applications
                                        WHERE id = @id";
                    using (SqlCommand command = new SqlCommand(statement, connection))
                    {
                        command.Parameters.AddWithValue("@id", id);
                        connection.Open();
                        command.ExecuteNonQuery();
                        res.StatusCode = HttpStatusCode.OK;
                    }
                }
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [OnlyGlobalUserManagingApplication]
        public HttpResponseMessage SaveGlobalUser(GlobalUserData userData)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.InternalServerError;
            try
            {
                userData.id = CreateGlobalUserOrUpdatePassword(userData);

                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    string statement = @"DELETE FROM dbo.user_permissions
                                                WHERE user_id = @user_id";
                    using (SqlCommand command = new SqlCommand(statement, connection))
                    {
                        command.Parameters.AddWithValue("@user_id", userData.id);
                        connection.Open();
                        command.ExecuteNonQuery();
                    }
                    string insertPermissionStatement = @"
                                        INSERT INTO dbo.user_permissions
                                            (
                                                user_id,
                                                user_application_id,
                                                active,
                                                path
                                            )
                                            VALUES
                                            (
                                                @user_id,
                                                @user_application_id,
                                                @active,
                                                @path
                                            )";
                    foreach(var permission in userData.applications)
                    {
                        using (SqlCommand command = new SqlCommand(insertPermissionStatement, connection))
                        {
                            command.Parameters.AddWithValue("@user_id", userData.id);
                            command.Parameters.AddWithValue("@user_application_id", permission.id);
                            command.Parameters.AddWithValue("@active", permission.active);
                            if (!string.IsNullOrWhiteSpace(permission.path))
                                command.Parameters.AddWithValue("@path", permission.path);
                            else
                                command.Parameters.AddWithValue("@path", DBNull.Value);
                            command.ExecuteNonQuery();
                        }
                    }
                }
                res.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        [OnlyGlobalUserManagingApplication]
        public HttpResponseMessage SaveApplication(GlobalUserApplicationData applicationData)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.StatusCode = HttpStatusCode.InternalServerError;
            try
            {
                if (string.IsNullOrWhiteSpace(applicationData.host))
                    throw new Exception("Host must be set");
                if (string.IsNullOrWhiteSpace(applicationData.application_name))
                    throw new Exception("Application name must be set");
                string connectionString = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserConnectionString"];
                if (applicationData.id < 1)
                {
                    using (SqlConnection connection = new SqlConnection(connectionString))
                    {
                        string statement = @"INSERT INTO dbo.user_applications
                                    (
                                        application_name,
                                        host,
                                        path,
                                        active
                                    )
                                OUTPUT INSERTED.ID
                                VALUES (
                                        @application_name,
                                        @host,
                                        @path,
                                        @active
                                )";
                        using (SqlCommand command = new SqlCommand(statement, connection))
                        {
                            command.Parameters.AddWithValue("@application_name", applicationData.application_name);
                            command.Parameters.AddWithValue("@host", applicationData.host);
                            if (!string.IsNullOrWhiteSpace(applicationData.application_path))
                                command.Parameters.AddWithValue("@path", applicationData.application_path);
                            else
                                command.Parameters.AddWithValue("@path", DBNull.Value);
                            command.Parameters.AddWithValue("@active", applicationData.application_active);
                            connection.Open();
                            applicationData.id = (int)command.ExecuteScalar();
                        }
                    }
                }
                else
                {
                    using (SqlConnection connection = new SqlConnection(connectionString))
                    {
                        string statement = @"UPDATE dbo.user_applications
                                                SET application_name = @application_name,
                                                host = @host,
                                                path = @path,
                                                active = @active
                                                WHERE id = @id";
                        using (SqlCommand command = new SqlCommand(statement, connection))
                        {
                            command.Parameters.AddWithValue("@id", applicationData.id);
                            command.Parameters.AddWithValue("@application_name", applicationData.application_name);
                            command.Parameters.AddWithValue("@host", applicationData.host);
                            if(!string.IsNullOrWhiteSpace(applicationData.application_path))
                                command.Parameters.AddWithValue("@path", applicationData.application_path);
                            else
                                command.Parameters.AddWithValue("@path", DBNull.Value);
                            command.Parameters.AddWithValue("@active", applicationData.application_active);
                            connection.Open();
                            command.ExecuteNonQuery();
                        }
                    }
                }
                res.Content = new StringContent("" + applicationData.id);
                res.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
            }
            return res;
        }

        public class GlobalUserApplicationData
        {
            public int id { get; set; }
            public string application_name { get; set; }
            public string host { get; set; }
            public string application_path { get; set; }
            public bool application_active { get; set; }
        }

        public class GlobalUserData
        {
            public int id { get; set; }
            public string username { get; set; }
            public string password { get; set; }
            public List<GlobalUserPermission> applications { get; set; }
        }

        public class GlobalUserPermission
        {
            public int id { get; set; }
            public string path { get; set; }
            public bool active { get; set; }
        }

        public class GlobalUserApplication
        {
            public string id { get; set; }
            public string host { get; set; }
            public string path { get; set; }
            public bool active { get; set; }
        }

        public class GlobalUserLoginData
        {
            public string username { get; set; }
            public string password { get; set; }
        }

        public class GlobalUser
        {
            public int id { get; set; }
            public string username { get; set; }
            public byte[] password { get; set; }
            public byte[] salt { get; set; }
        }

#endregion
    }
}

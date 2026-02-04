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
using MagicFramework.MemberShip;
using System.Web.Security;
using System.Data;
using MagicFramework.Helpers;
using System.Collections;
using System.Net.Http.Headers;
using System.IO;
using MagicFramework.Helpers.Sql;
using System.Text.RegularExpressions;
using System.Xml;
using Newtonsoft.Json;

namespace MagicFramework.Controllers
{
    public class Magic_Mmb_UsersController : ApiController
    {
        readonly Regex CHECK_INTERNALFILE_URL = new Regex(@"^/api/MAGIC_SAVEFILE/GetFile\?path=[%\d\w\-]+(.gif|.jpg|.jpeg|.png)$");

        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
        private MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());
        public class models { public string model { get; set; } }
        public class fk
        {
            public string value { get; set; }
            public string text { get; set; }
        }

        [HttpPost]
        public Models.Response GetUserColumnDataTypes(dynamic data)
        {            
            return mfApi.GetUserColumnDataTypes(data.OnlyForDeveloper.Value);
        }

        [HttpGet]
        public Models.Response GetUserVirtualTables()
        {
            return mfApi.GetUserVirtualTables();
        }
        private bool IsEmailUnique(int userId, string newEmail)
        {
            // Get the current user's email
            var currentUser = _context.Magic_Mmb_Users.FirstOrDefault(u => u.UserID == userId);
            if (currentUser == null)
            {
                // If the user is not found, we consider the email as not unique for safety
                return false;
            }

            // If the email hasn't changed, it's considered unique
            if (currentUser.Email.Equals(newEmail, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Check if the new email is used by any other user
            var emailExists = _context.Magic_Mmb_Users.Any(u => u.Email.Equals(newEmail, StringComparison.OrdinalIgnoreCase) && u.UserID != userId);

            // Return true if the email doesn't exist for any other user (i.e., it's unique), false otherwise
            return !emailExists;
        }

        [HttpPost]
        public Models.Response GetBOTypeGridUserTabs(dynamic data)
        {
            return mfApi.GetBOTypeGridUserTabs(data.BoType_ID.Value);
        }

        private HttpResponseMessage CheckValidFileURL (XmlDocument xml, string property)
        {
            if (!string.IsNullOrEmpty(xml["SQLP"].FirstChild.Attributes[property].InnerText))
            {
                var match = CHECK_INTERNALFILE_URL.Match(xml["SQLP"].FirstChild.Attributes[property].InnerText);
                if (!match.Success)
                {
                    var response = new HttpResponseMessage();
                    response.Content = new StringContent("User image (" + property + ") has to be a MagicSolution file controller link");
                    response.StatusCode = HttpStatusCode.BadRequest;
                    return response;
                }
            }
            return null;
        }

        [HttpPost]
        public HttpResponseMessage UpdateAccount(models data)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                string json = data.model;
                var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);
                int userId = SessionHandler.IdUser;
                string email = xml["SQLP"].FirstChild.Attributes["Email"].InnerText;
                if (!String.IsNullOrEmpty(email))
                {
                    bool verifyLimit = ApplicationSettingsManager.getLogToDatabase();
                    bool rateLimitDisabled = ApplicationSettingsManager.getDisableRateLimitAccountEditSetting();

                    if (verifyLimit && !rateLimitDisabled)
                    {
                        bool canDoIt = MFLog.LogUpdateAccountAttemptToDataBase(userId, HttpContext.Current.Request.UserHostAddress.ToString());
                        if (canDoIt == false)
                        {
                            return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Too many attempts");
                        }
                    }
                    
                    if (!Utils.IsValidEmail(email))
                    {
                        response.Content = new StringContent("Email not valid.");
                        response.StatusCode = HttpStatusCode.BadRequest;
                        return response;
                    }
                    else if (!IsEmailUnique(userId, email))
                    {
                        return Request.CreateErrorResponse(HttpStatusCode.BadRequest, "Error - email empty or already used");
                    }
                }

                //xml["SQLP"].FirstChild.Attributes["UserID"].InnerText = SessionHandler.IdUser.ToString();
                //xml["SQLP"].FirstChild.Attributes["MailPassword"].InnerText = StringCipher.Encrypt(xml["SQLP"].FirstChild.Attributes["MailPassword"].InnerText, "xyz");
                //xml["SQLP"].FirstChild.Attributes["SMTPPassword"].InnerText = StringCipher.Encrypt(xml["SQLP"].FirstChild.Attributes["SMTPPassword"].InnerText, "xyz");
                var res = CheckValidFileURL(xml, "UserImg");
                if (res != null)
                {
                    return res;
                }
                res = CheckValidFileURL(xml, "UserSymbolImg");
                if (res != null)
                {
                    return res;
                }

                var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();
                dbutils.callStoredProcedurewithXMLInput(xml, "dbo.Magic_XMLCommands_updateaccount");

                try {
                    var config = MFConfiguration.GetApplicationInstanceConfiguration();
                    if (!string.IsNullOrEmpty(config.GoogleCalenderOAuthConfig))
                    {
                        var user = _context.Magic_Mmb_Users_Extensions.Where(ue => ue.UserID == userId).FirstOrDefault();
                        if (user != null) {
                            if (string.IsNullOrEmpty(xml["SQLP"].FirstChild.Attributes["GoogleCalendarMail"].InnerText) && !string.IsNullOrEmpty(user.GoogleCalendarEmail)){
                                try
                                {
                                    GoogleCalendarsSyncher gcals = new GoogleCalendarsSyncher();
                                    gcals.RevokeAppAccess(user);
                                }
                                catch (Exception e)
                                {
                                    MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");

                                }
                                user.GoogleCalendarEmail = null;
                                _context.SubmitChanges();
                            }
                            else if (user.GoogleCalendarEmail != xml["SQLP"].FirstChild.Attributes["GoogleCalendarMail"].InnerText) {
                                if (!string.IsNullOrEmpty(user.GoogleCalendarEmail))
                                {
                                    try
                                    {
                                        GoogleCalendarsSyncher gcals = new GoogleCalendarsSyncher();
                                        gcals.RevokeAppAccess(user);
                                    }
                                    catch (Exception e)
                                    {
                                        MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");

                                    }
                                }
                                user.GoogleCalendarEmail = xml["SQLP"].FirstChild.Attributes["GoogleCalendarMail"].InnerText;
                                _context.SubmitChanges();
                            }
                        }
                    }
                }
                catch (Exception e) {
                    MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                }

                response.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception e)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent("Error");
            }

            return response;
        }

        [HttpGet]
        public HttpResponseMessage GetGoogleCalendarAuthorizationLink()
        {
            HttpResponseMessage res = new HttpResponseMessage();
            res.Content = new StringContent(GoogleCalendarsSyncher.GetAuthorizationUrl());
            res.StatusCode = HttpStatusCode.OK;
            return res;
        }

        [HttpGet]
        public HttpResponseMessage AuthorizeGoogleCalendar(string code = "", string error = "")
        {
            HttpResponseMessage res = new HttpResponseMessage();
            if (!string.IsNullOrEmpty(error))
            {
                res.StatusCode = HttpStatusCode.Unauthorized;
                res.Content = new StringContent(error);
                return res;
            }
            res.StatusCode = HttpStatusCode.OK;

            try
            {
                GoogleCalendarsSyncher g = new GoogleCalendarsSyncher();
                Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                var userExtension = context.Magic_Mmb_Users.Where(u => u.Username == HttpContext.Current.User.Identity.Name).FirstOrDefault().Magic_Mmb_Users_Extensions;
                g.calendar = g.GetUserCalendar(g.ExchangeCodeForTokenAndWriteTokenToUserExtension(code, userExtension), userExtension.GoogleCalendarEmail);
                context.SubmitChanges();

                var getCalendarList = g.CalendarList();
                getCalendarList.Wait();
                var calendarList = getCalendarList.Result;

                string instanceName = MFConfiguration.GetApplicationInstanceConfiguration().appInstancename;
                string options = "";

                foreach (var calendar in calendarList.Items)
                {
                    options += "<option>" + calendar.Summary + "</option>";
                }

                if (calendarList.Items.Where(i => i.Summary == instanceName).FirstOrDefault() == null)
                    options = "<option>" + instanceName + "</option>" + options;

                res.Content = new StringContent(
                    Utils.ReplaceTags(
                        File.ReadAllText(
                            Path.Combine(
                                Utils.GetBasePath(),
                                @"Magic\Views\AuthorizeGoogleCalendar.html"
                            )
                        ),
                        new Dictionary<string, string>
                        {
                            { "language", SessionHandler.UserCultureCode.Substring(0, 2) },
                            { "options", options }
                        }
                    )
                );
                res.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
            }
            catch(Exception e)
            {
                res.StatusCode = HttpStatusCode.InternalServerError;
                res.Content = new StringContent("Error");
            }
            return res;
        }

        public class GooglePickCalendarFormData
        {
            public string GoogleCalendarName { get; set; }
        }

        [HttpPost]
        public HttpResponseMessage AuthorizeGoogleCalendar([FromBody]GooglePickCalendarFormData data)
        {
            HttpResponseMessage res = new HttpResponseMessage();
            try
            {
                GoogleCalendarsSyncher g = new GoogleCalendarsSyncher();
                Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                var userExtension = context.Magic_Mmb_Users.Where(u => u.Username == HttpContext.Current.User.Identity.Name).FirstOrDefault().Magic_Mmb_Users_Extensions;

                g.calendar = g.GetUserCalendar(userExtension);
                userExtension.GoogleCalendarId = g.CreateCalendarIfNotExists(data.GoogleCalendarName);
                context.SubmitChanges();
                //gets last month's events
                //D.T: commented after implementation of the push events Cron Job
                //g.PushAllEventsOfUser(userExtension);
            }
            catch (Google.Apis.Auth.OAuth2.Responses.TokenResponseException e)
            {
                if (e.Error.ErrorDescription.Contains("refresh_token"))
                {
                    res.StatusCode = HttpStatusCode.OK;
                    res.Content = new StringContent("Please visit https://myaccount.google.com/u/0/permissions revoce access for this application and try again");
                    return res;
                }
                else
                {
                    res.Content = new StringContent(e.Message);
                    res.StatusCode = HttpStatusCode.InternalServerError;
                    MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                    return res;
                }
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.Message);
                res.StatusCode = HttpStatusCode.InternalServerError;
                MFLog.LogInFile(e, MFLog.logtypes.ERROR, "GoogleCalendarSyncLog.txt");
                return res;
            }
            res.StatusCode = HttpStatusCode.OK;
            res.Content = new StringContent("Ok");
            res.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
            return res;
        }

        public class UserPics
        {
            public string avatar { get; set; }
            public string symbol { get; set; }
        }

        [HttpGet]
        public UserPics GetUserPics()
        {
            UserPics up = new UserPics();

            var user = (from e in _context.Magic_Mmb_Users where e.UserID == MagicFramework.Helpers.SessionHandler.IdUser select e).FirstOrDefault();
            up.avatar = user.UserImg;
            up.symbol = user.Magic_Mmb_Users_Extensions.UserSymbolImg;

            return up;
        }


        [HttpPost]
        public HttpResponseMessage resetPassword(dynamic data)
        {
            string username = data.user;

            HttpResponseMessage response = new HttpResponseMessage();
            string currentapplication = ApplicationSettingsManager.GetAppInstanceName();
            EFMembershipProvider member = (MagicFramework.MemberShip.EFMembershipProvider)Membership.Providers[currentapplication];
            var user = member.GetUser(username, true);

            string newpwd = String.Empty;
            try
            {
                newpwd = user.ResetPassword();
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(ex.Message);
                return response;
            }

            string message = Utils.getUIMessage("RSTPWD");

            if (message != null)
                message = String.Format(message, newpwd);
            else
                message = "Password reset ok, new password is: " + newpwd;

            return Utils.retOkJSONMessage(message);
        }

        [HttpGet]
        public HttpResponseMessage RandomPassword()
        {
            //bool isDeveloper = SessionHandler.UserIsDeveloper;

            HttpResponseMessage response = new HttpResponseMessage();
            //if (!isDeveloper)
            //{
            //    response.StatusCode = HttpStatusCode.InternalServerError;
            //    response.Content = new StringContent("Only developers can generate a password");
            //    return response;
            //}

            string currentapplication = ApplicationSettingsManager.GetAppInstanceName();
            EFMembershipProvider member = (MagicFramework.MemberShip.EFMembershipProvider)Membership.Providers[currentapplication];

            var passwordInfo = member.RandomPassword();
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(passwordInfo));
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            return response;
        }

        [HttpPost]
        public HttpResponseMessage changePassword(dynamic data)
        {
            string old = data.oldp;
            string newpwd = data.newpwd;
            string confirmednewpwd = data.confirmednewpwd;
            string username = data.Username.ToString();

            HttpResponseMessage response = new HttpResponseMessage();
            if (newpwd != confirmednewpwd)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent("New and Confirmed Passwords mismatch");
                return response;
            }

            bool isDeveloper = SessionHandler.UserIsDeveloper;
            bool isChangingOwnPassword = string.Equals(username, SessionHandler.Username);
            if (!isDeveloper && !isChangingOwnPassword)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent("Only developers can change the password of other users");
                return response;
            }

            try
            {
                string currentapplication = ApplicationSettingsManager.GetAppInstanceName();
                EFMembershipProvider member = (MagicFramework.MemberShip.EFMembershipProvider)Membership.Providers[currentapplication];

                int userID = 0;
                if (isDeveloper)
                {
                    var user = member.ChangePassword(username, newpwd);
                    userID = user.UserID;
                }
                else
                {

                    //change password
                    Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                    Data.Magic_Mmb_Users user = member.GetUser(username, context);
                    if (user == null)
                    {
                        throw new Exception(
                           "AUTH001"
                       );
                    }

                    if (!member.CheckPassword(old, user.Password))
                    {
                        member.UpdateFailureCount(user.Username, "password");
                        throw new Exception(
                            "AUTH002"
                        );
                    }

                    if (member.AccountIsExpired(user.UserID))
                    {
                        member.UpdateFailureCount(user.Username, "accountExpired");
                        throw new Exception(
                            "AUTH003"
                        );
                    }

                    member.SetUserInfosSession(user, context);

                    member.ChangePassword(username, newpwd);
                    userID = SessionHandler.IdUser;
                }

                CacheHandler.UserLastChangedPassword(userID, DateTime.Now);

                if (isChangingOwnPassword)
                {
                    HttpCookie authCookie = HttpContext.Current.Request.Cookies[FormsAuthentication.FormsCookieName];
                    FormsAuthenticationTicket authTicket = FormsAuthentication.Decrypt(authCookie.Value);
                    FormsAuthentication.SetAuthCookie(username, authTicket.IsPersistent);
                }
            }
            catch (MembershipPasswordException mpe) {
                StringContent errorMsg = new StringContent(mpe.Message);
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = errorMsg;
                return response;
            }
            catch (Exception ex)
            {
                StringContent errorMsg = new StringContent("Password change failed");
                if (ex.Message.StartsWith("AUTH"))
                {
                    errorMsg = new StringContent(JsonConvert.SerializeObject(new { code = ex.Message }));
                }
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = errorMsg;
                return response;
            }
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent("{\"msg\":\"Password Changed!\"}");
            return response;
        }
        //get all elements of an entity
        [HttpGet]
        public List<Models.Magic_Mmb_Users> GetAll()
        {
            string wherecondition = "1=1";

            // select from the database, skipping and taking the correct amount
            var resdb = (from e in _context.v_Magic_Mmb_UserExtended
                          .Where(wherecondition)
                         select new Models.Magic_Mmb_Users(e)).ToList();

            return resdb;

        }

        //Get All the users whose hierachy is under the logged user
        [HttpGet]
        public List<Models.Magic_Mmb_Users> GetLeafs()
        {

            var groupids = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet();


            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var extendedusers = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(groupids, "USEREXTENSION", dbhandler);
            List<Models.Magic_Mmb_Users> resdb = new List<Models.Magic_Mmb_Users>();
            foreach (var u in extendedusers)
            {
                var mod = new Models.Magic_Mmb_Users(u);
                resdb.Add(mod);
            }

            return resdb;

        }


        //Get All the users whose hierachy is under the logged user
        [HttpGet]
        public List<Models.Magic_Mmb_Users> GetSchedulableUsers()
        {

            var groupids = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet();


            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var extendedusers = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(groupids, "USEREXTENSION", dbhandler);
            List<Models.Magic_Mmb_Users> resdb = new List<Models.Magic_Mmb_Users>();


            foreach (var u in extendedusers)
            {
                var mod = new Models.Magic_Mmb_Users(u);
                resdb.Add(mod);
            }

            //ritorno gli altri utenti solo se l'utente  chiamante e' un resource scheduler, altrimenti puo' schedulare solo se stesso
            if (MemberShip.SystemRightsChecker.isSchedulerUser())
                return resdb;
            else
                return resdb.Where(x => x.UserID == SessionHandler.IdUser).ToList();

        }

        [HttpPost]
        public List<fk> PostSchedulableUsers(dynamic data)
        {

            var groupids = MagicFramework.UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet();

            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var extendedusers = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(groupids, "USEREXTENSION", dbhandler);
            List<fk> resdb = new List<fk>();


            foreach (var u in extendedusers)
            {
                var mod = new Models.Magic_Mmb_Users(u);
                string name = mod.FirstName + " " + mod.LastName;
                if (name == null)
                    name = mod.Username;

                fk el = new fk();
                el.text = name;
                el.value = mod.UserID.ToString();
                resdb.Add(el);
            }

            //ritorno gli altri utenti solo se l'utente  chiamante e' un resource scheduler, altrimenti puo' schedulare solo se stesso
            if (MemberShip.SystemRightsChecker.isSchedulerUser())
                return resdb;
            else
                return resdb.Where(x => x.value == SessionHandler.IdUser.ToString()).ToList();

        }

        //get the users under a certain Group id 
        [HttpGet]
        public List<Models.Magic_Mmb_Users> GetUsersUnderGroup(int id)
        {
            var resobj = (from e in _context.Magic_Mmb_Users.Where(x => x.Magic_Mmb_UserGroupVisibilityUsers.FirstOrDefault().UserGroupVisibility_ID == id)
                          select new Models.Magic_Mmb_Users(e)).ToList();
            return resobj;
        }
        //get a single object 
        [HttpGet]
        public List<Models.Magic_Mmb_Users> Get(int id)
        {
            var resobj = (from e in _context.v_Magic_Mmb_UserExtended.Where(x => x.UserID == id)
                          select new Models.Magic_Mmb_Users(e)).ToList();
            return resobj;
        }
        //get a single object 
        [HttpGet]
        public List<Models.Magic_Mmb_Users> GetSessionUser(int id)
        {
            var resobj = (from e in _context.v_Magic_Mmb_UserExtended.Where(x => x.UserID == SessionHandler.IdUser)
                          select new Models.Magic_Mmb_Users(e)).ToList();
            if (resobj != null && resobj.Count > 0)
            {
                resobj[0].Password = "";
                resobj[0].PasswordAnswer = "";
                resobj[0].PasswordQuestion = "";
                resobj[0].MailPassword = "";
                resobj[0].SMTPPassword = "";
            }
            return resobj;
        }
        //Used in main.js in order to get the filters set for a particular session (e.g set from an external application after SSO) 
        [HttpGet]
        public HttpResponseMessage GetSessionGridFiltersForLoggedUser()
        {
            HttpResponseMessage response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent(MagicFramework.Helpers.SessionHandler.Filters);
            return response;
        }
        //[HttpPost]
        //public HttpResponseMessage ResetSessionGridFiltersForLoggedUser(dynamic data)
        //{
        //    HttpResponseMessage response = new HttpResponseMessage();
        //    try
        //    {
        //        string dom = "grid";
        //        if (data.gridDOM != null)
        //            dom = data.gridDOM.ToString();

        //        string key = data.functionname.ToString() + "_" + data.gridname.ToString() + "_" + dom;
        //        string filter = Newtonsoft.Json.JsonConvert.SerializeObject(data.filter);
        //        if (MagicFramework.Helpers.SessionHandler.Filters == null)
        //            MagicFramework.Helpers.SessionHandler.Filters = new Dictionary<string, string>();
        //        var dict = MagicFramework.Helpers.SessionHandler.Filters;
        //        if (dict.ContainsKey(key))
        //            dict.Remove(key);

        //    }
        //    catch (Exception ex)
        //    {
        //        response.StatusCode = HttpStatusCode.InternalServerError;
        //        response.Content = new StringContent("Problems during session Filters reset:" + ex.Message);
        //    }
        //    response.StatusCode = HttpStatusCode.OK;
        //    return response;
        //}

        //[HttpPost]
        //public HttpResponseMessage SetSessionGridFiltersForLoggedUser(dynamic data)
        //{
        //    HttpResponseMessage response = new HttpResponseMessage();
        //    try
        //    {
        //        string dom = "grid";
        //        if (data.gridDOM != null)
        //            dom = data.gridDOM.ToString();

        //        string key = data.functionname.ToString() + "_" + data.gridname.ToString() + "_" + dom;
        //        string filter = Newtonsoft.Json.JsonConvert.SerializeObject(data.filter);
        //        if (MagicFramework.Helpers.SessionHandler.Filters == null)
        //            MagicFramework.Helpers.SessionHandler.Filters = new Dictionary<string, string>();
        //        var dict = MagicFramework.Helpers.SessionHandler.Filters;
        //        if (dict.ContainsKey(key))
        //            dict[key] = filter;
        //        else
        //            dict.Add(key, filter);

        //    }
        //    catch (Exception ex)
        //    {
        //        response.StatusCode = HttpStatusCode.InternalServerError;
        //        response.Content = new StringContent("Problems during session Filters saving:" + ex.Message);
        //    }
        //    response.StatusCode = HttpStatusCode.OK;
        //    return response;
        //}

        [HttpGet]
        public int GetSessionUser()
        {
            return MagicFramework.Helpers.SessionHandler.IdUser;
        }
        /// <summary>
        /// Login as another user for developers 
        /// </summary>
        /// <param name="id">the id of the user i want to be</param>
        /// <returns>an http message</returns>
        [HttpGet]
        public HttpResponseMessage SetSessionUser(string id)
        {
            var response = new HttpResponseMessage();
            int userid = int.Parse(id);
            try
            {
                if (!SystemRightsChecker.isSystemUser())
                    throw new ArgumentException("insufficient rights to perform the operation!!!");

                Data.Magic_Mmb_Users u = (from e in _context.Magic_Mmb_Users where e.UserID == userid select e).First();
                EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[SessionHandler.ApplicationInstanceName];
                member.SetUserInfosSession(u, _context);
            }
            catch (Exception ex) {
                response = Utils.retInternalServerError("problems while setting session vars: "+ex.Message);
            }
            response = Utils.retOkJSONMessage("logged in!");
            return response;
        }
        //The grid will call this method in read mode
        [HttpPost]
        public Models.Response Select(Models.Request request)
        {

            Helpers.RequestParser rp = new Helpers.RequestParser(request);

            string order = "UserID";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Mmb_Users));


            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderConditionForEF();

            var dbres = (from e in _context.v_Magic_Mmb_UserExtended
                                               .Where(wherecondition)
                                               .OrderBy(order.ToString())
                                               .Skip(request.skip)
                                               .Take(request.take)
                         select new Models.Magic_Mmb_Users(e)).ToArray();


            return new Models.Response(dbres, _context.v_Magic_Mmb_UserExtended.Where(wherecondition).Count());

        }
        class UserComparer : IEqualityComparer<Models.Magic_Mmb_Users>
        {
            public bool Equals(Models.Magic_Mmb_Users u1, Models.Magic_Mmb_Users u2)
            {
                if (u1.UserID == u2.UserID)
                {
                    return true;
                }
                else
                {
                    return false;
                }
            }


            public int GetHashCode(Models.Magic_Mmb_Users u)
            {
                int hCode = u.UserID;
                return hCode.GetHashCode();
            }
        }

        [HttpPost]
        public Models.Response SelectChildren(Models.Request request)
        {

            Helpers.RequestParser rp = new Helpers.RequestParser(request);

            string order = "UserID";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Mmb_Users));


            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderCondition();

            UserComparer uc = new UserComparer();
            var allowedusers = this.GetLeafs().Distinct(uc);

            var dbres = (from e in _context.Magic_Mmb_Users
                                               .Where(wherecondition)
                                               .OrderBy(order.ToString())
                         select new Models.Magic_Mmb_Users(e)).ToList();


            List<Models.Magic_Mmb_Users> result = dbres.Intersect(allowedusers, uc).Skip(request.skip).Take(request.take).ToList();


            return new Models.Response(result.ToArray(), allowedusers.Count());

        }
        //The grid will call this method in update mode
        [HttpPost]
        public HttpResponseMessage PostU(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                SystemRightsChecker.checkSystemRights("updateUser");

                // select the item from the database where the id
                EFMembershipProvider.CreateUserData userData = new EFMembershipProvider.CreateUserData
                {
                    Email = (string)data.Email,
                    Username = (string)data.Username,
                    Password = (string)data.Password
                };
                var user = (from e in _context.Magic_Mmb_Users
                            where e.UserID == id
                            select e).FirstOrDefault();

                if (user != null)
                {
                    response.StatusCode = HttpStatusCode.Conflict;
                    string userDataError = EFMembershipProvider.ValidateCreateUserData(userData);
                    if (userDataError != "")
                    {
                        response.Content = new StringContent(userDataError);
                        return response;
                    }
                    else if (userData.Email != user.Email && _context.Magic_Mmb_Users.Where(u => u.Email.Equals(userData.Email) && !u.UserID.Equals(id)).FirstOrDefault() != null)
                    {
                        response.Content = new StringContent("Email already in use.");
                        return response;
                    }

                    var updID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Mmb_Users", false);

                    var dbres = (from e in _context.Magic_Mmb_Users_Extensions where e.UserID == id select e).FirstOrDefault();
                    dbres.Culture_ID = Int32.Parse(data.Culture_ID.ToString());
                    _context.SubmitChanges();

                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(string.Format("The item with id Magic_Mmb_Users was not found in the database id:{0}", id.ToString()));
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("The database update failed: Magic_Mmb_Users: {0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }


        //The grid will call this method in insert mode

        [HttpPost]
        public Models.Response PostI(dynamic data)
        {
            string errorMessage = "";
            EFMembershipProvider.CreateUserData userData = new EFMembershipProvider.CreateUserData();
            userData.Username = data.Username.ToString();
            userData.Email = data.Email.ToString();
            userData.Password = data.Password.ToString();
            userData.CultureId = Convert.ToInt32(data.Culture_ID.ToString());
            userData.Firstname = data.FirstName.ToString();
            userData.Lastname = data.LastName.ToString();
            if (string.IsNullOrEmpty(data.Name.ToString()))
            {
                if (!string.IsNullOrEmpty(userData.Firstname) && !string.IsNullOrEmpty(userData.Lastname))
                    userData.Name = userData.Lastname + " " + userData.Firstname;
                else
                    userData.Name = userData.Username;
            }
            else
                userData.Name = data.Name.ToString();
            userData.UserIsApproved = data.IsApproved;

            var user = EFMembershipProvider.CreateUser(userData, out errorMessage);

            if (errorMessage != "")
            {
                return new Models.Response(errorMessage);
            }

            // return the HTTP Response.
            return new Models.Response(new Data.v_Magic_Mmb_UserExtended[] { user }, 1);

        }
        [HttpPost]
        public HttpResponseMessage PostD(int id)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            try
            {
                SystemRightsChecker.checkSystemRights("deleteUser");
                // select the item from the database where the id

                var entitytodestroy = (from e in _context.Magic_Mmb_Users
                                       where e.UserID == id
                                       select e).FirstOrDefault();

                if (entitytodestroy != null)
                {
                    //Stored per generare l'ANAGRA di tipo Opposto nel ugvi dell'invitato (se è un produttore gli viene generato un mandante)
                    dynamic input = new System.Dynamic.ExpandoObject(); //creo un oggetto dinamicamente
                    input.ID = entitytodestroy.Id;
                    input.UserID = entitytodestroy.UserID;
                    string json = Newtonsoft.Json.JsonConvert.SerializeObject(input);
                    var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);
                    var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();
                    var dbres = dbutils.callStoredProcedurewithXMLInput(xml, "dbo.Magic_Mmb_Users_delete");
                    //List<System.Data.DataRow> result = dbres.table.AsEnumerable().ToList();

                    //_context.Magic_Mmb_Users.DeleteOnSubmit(entitytodestroy);
                    //_context.SubmitChanges();
                    response.StatusCode = HttpStatusCode.OK;
                    try
                    {
                        if (System.Configuration.ConfigurationManager.AppSettings["chatActive"].Equals("true") || System.Configuration.ConfigurationManager.AppSettings["enableNotificationsByDefault"].Equals("true"))
                        {
                            MongoHandler mh = new MongoHandler();
                            mh.DeleteUser(id);
                        }
                    }
                    catch { }

                }
                else
                {
                    response.StatusCode = HttpStatusCode.InternalServerError;
                    response.Content = new StringContent(string.Format("The item with id {0} in Users was not found in the database", id.ToString()));
                }
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("Magic_Mmb_Users:The database delete failed with message -{0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }


    }
}
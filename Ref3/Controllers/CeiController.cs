using MagicFramework.Controllers.ActionFilters;
using MagicFramework.Helpers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Ref3.Helpers;
using Ref3.Models;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Web;
using System.Web.Configuration;
using System.Web.Http;
using System.Web.Security;
using System.Xml;
 
namespace Ref3.Controllers
{
    [ExceptionFilter]
    public class CeiController : ApiController
    {
        const string IAMLog = "IAMLog.txt";
        [HttpGet]
        public void login(string user, string pwd, string token, string app)
        {
            try { 
                MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
                MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(app)).FirstOrDefault();

                string check = "";
                if (config == null)
                    check = "noAppConfig";
                if (String.IsNullOrEmpty(pwd))
                    check = "emptyPassword";
                      if (String.IsNullOrEmpty(token))
                    check = "emptyToken";

                if (!String.IsNullOrEmpty(check))
                    HttpContext.Current.Server.Transfer("/error.aspx?e="+ check);


                if(config != null && !String.IsNullOrEmpty(pwd) && !String.IsNullOrEmpty(token))
                {
                    MagicFramework.MemberShip.EFMembershipProvider.SetConfigSessionAttributes(config, HttpContext.Current.Request);
                    MagicFramework.MemberShip.EFMembershipProvider member = (MagicFramework.MemberShip.EFMembershipProvider)System.Web.Security.Membership.Providers[app];
                    if (member == null)
                        HttpContext.Current.Server.Transfer("/error.aspx?e=webConfigMembership");

                    if (member != null)
                    {
                        MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(config.TargetDBconn);
                        MagicFramework.Data.Magic_Mmb_Users User = context.Magic_Mmb_Users.Where(u => u.Username.Equals(user) && u.ApplicationName.Equals(app) && u.IsLockedOut == false).FirstOrDefault();

                        if (User == null)
                            HttpContext.Current.Server.Transfer("/error.aspx?e=userNotFound");
                        if (!(pwd.StartsWith(token) && pwd.EndsWith(token)))
                            HttpContext.Current.Server.Transfer("/error.aspx?e=TokenPositionOrIncoherent");
                      
                        
                        if (User != null && pwd.StartsWith(token) && pwd.EndsWith(token))
                         {
                                string alreadyEncryptedPwdWithoutToken = pwd.Replace(token, "");
                                if (User.Password.Equals(alreadyEncryptedPwdWithoutToken))
                                {
                                    MagicFramework.Helpers.Sql.DBQuery query = new MagicFramework.Helpers.Sql.DBQuery("SELECT * FROM Custom.UsedLoginTokens");
                                    query.AddWhereCondition("Token = @token", token);
                                    query.AddWhereCondition("UserId = @userId", User.UserID);
                                    query.connectionString = config.TargetDBconn;
                                    System.Data.DataTable result = query.Execute();

                                    if (result == null || result.Rows.Count == 0)
                                    {
                                        MagicFramework.Helpers.Sql.DBWriter writer = new MagicFramework.Helpers.Sql.DBWriter("Custom.UsedLoginTokens", new Dictionary<string, object> {
                                            { "Token", token },
                                            { "UserId", User.UserID },
                                        });
                                        writer.connectionString = config.TargetDBconn;
                                        writer.Write();

                                        //set session vars
                                        member.SetUserInfosSession(User, context, true);

                                        //set auth cookie
                                        System.Web.Security.FormsAuthentication.SetAuthCookie(SessionHandler.Username, true);
                                        HttpCookie authCookie = HttpContext.Current.Response.Cookies[System.Web.Security.FormsAuthentication.FormsCookieName];
                                        HttpContext.Current.Cache.Insert(authCookie.Value.ToString(), config.id, null, authCookie.Expires, System.Web.Caching.Cache.NoSlidingExpiration);

                                        MagicFramework.MemberShip.EFMembershipProvider.ActivateChatAndNotifications(config, SessionHandler.Username);

                                        HttpContext.Current.Response.Redirect("/" + config.appMainURL);
                                        return;
                                    }
                                    else
                                        HttpContext.Current.Server.Transfer("/error.aspx?e=TokenAlreadyUsed");
                                }
                                else
                                    HttpContext.Current.Server.Transfer("/error.aspx?e=pwdiswrong");
                        }
                    }
                }
            } catch(Exception ex) {
                MagicFramework.Helpers.MFLog.LogInFile(ex.InnerException.ToString(), MFLog.logtypes.ERROR);
                MagicFramework.Helpers.MFLog.LogInFile(ex.ToString(), MFLog.logtypes.ERROR);
                HttpContext.Current.Server.Transfer("/error.aspx?e=checkAppLog");
            }

            HttpContext.Current.Response.Redirect("/login");
        }
        [HttpGet]
        public void loginFromBce(string ID_UTENTE_BCEWEB, string ID_SESSIONE_SU_BCEWEB,string TIPO_CONTESTO_HS, string ID_IMMOBILE_SU_CEIIMMOBILI = null,string TIPO_IMMOBILE = null) {
            try {
                string sender = "BCE";
                string remoteEndPoint = System.Configuration.ConfigurationManager.AppSettings[TIPO_CONTESTO_HS + "_endpoint"];
                //get th sessionData for this user to BCEWEB and punt its contextData in SessionHandler. This data will affect grid filters in session
                var req = (HttpWebRequest)WebRequest.Create(String.Format("{0}?idutente={1}&pass={2}", remoteEndPoint, ID_UTENTE_BCEWEB.ToString(),ID_SESSIONE_SU_BCEWEB.ToString()));
                HttpWebResponse resp = null;
                try
                {
                    resp = (HttpWebResponse)req.GetResponse();
                }
                catch (WebException we)  //if we got a valid http response, just pass it on to the client
                {
                    resp = (HttpWebResponse)we.Response;
                    if (resp == null)
                        throw we;
                }
       
                Stream response_stream = resp.GetResponseStream();

                StreamReader reader = new StreamReader(response_stream);
                string serialnumberJSON = reader.ReadToEnd();
                reader.Close();

                dynamic serialnumberOBJ = Newtonsoft.Json.JsonConvert.DeserializeObject(serialnumberJSON);
                string ser_number = serialnumberOBJ.serial_number;
                if (String.IsNullOrEmpty(ser_number))
                    HttpContext.Current.Server.Transfer("/error.aspx?e=serialEmpty");
                //get the connection string from web.config 
                string connectionString = System.Configuration.ConfigurationManager.ConnectionStrings[TIPO_CONTESTO_HS].ConnectionString;
                //ask the db for applicationInstance, URL of the function , filters to set  
                JObject data = JObject.FromObject(new
                {
                    id_utente_bce_web = ID_UTENTE_BCEWEB,
                    id_session_su_bce_web = ID_SESSIONE_SU_BCEWEB,
                    tipocontestohs = TIPO_CONTESTO_HS,
                    id_immobile_su_ceiimmobili = ID_IMMOBILE_SU_CEIIMMOBILI,
                    serial_number = ser_number,
                    Sender = sender,
                    tipo_immobile = TIPO_IMMOBILE
                });

                XmlDocument doc = (XmlDocument)Newtonsoft.Json.JsonConvert.DeserializeXmlNode(Newtonsoft.Json.JsonConvert.SerializeObject(data), "SQLP");
                DataSet tables = new DataSet();
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    using (SqlCommand CMD = new SqlCommand("CUSTOM.CEI_LOGIN_FROM_EXTERNAL", connection))
                    {
                        CMD.CommandType = CommandType.StoredProcedure;
                        CMD.Parameters.Add("@XmlInput", SqlDbType.Xml).Value = doc.InnerXml;
                        SqlDataAdapter da = new SqlDataAdapter();
                        connection.Open();
                        da.SelectCommand = CMD;
                        da.Fill(tables);
                        da.Dispose();
                    }
                }

                //get the JSON from stored procedures
                string JSONstring = tables.Tables[0].Rows[0]["sessionData"].ToString();
                loginUser(JSONstring);
                return;
            }
            catch (Exception ex) {
                MagicFramework.Helpers.MFLog.LogInFile(ex.InnerException.ToString(), MFLog.logtypes.ERROR);
                MagicFramework.Helpers.MFLog.LogInFile(ex.ToString(), MFLog.logtypes.ERROR);
                HttpContext.Current.Server.Transfer("/error.aspx?e=checkAppLog");
            }


        }
        [HttpGet]
        public void loginFromScrivania(string idutente, string tmppassword, string tipocontestosso)
        {
                string sender = "SCRIVANIA";
                string remoteEndPoint = System.Configuration.ConfigurationManager.AppSettings[sender + "_" + tipocontestosso + "_endpoint"];
                //get th sessionData for this user to BCEWEB and punt its contextData in SessionHandler. This data will affect grid filters in session
                var req = (HttpWebRequest)WebRequest.Create(String.Format("{0}?idutente={1}&password={2}", remoteEndPoint, idutente.ToString(), tmppassword.ToString()));
                HttpWebResponse resp = null;
                try
                {
                    resp = (HttpWebResponse)req.GetResponse();
                }
                catch (WebException we)  //if we got a valid http response, just pass it on to the client
                {
                    resp = (HttpWebResponse)we.Response;
                    if (resp == null)
                        throw we;
                }

                Stream response_stream = resp.GetResponseStream();

                StreamReader reader = new StreamReader(response_stream);
                string ser_number = reader.ReadToEnd();
                reader.Close();

                if (String.IsNullOrEmpty(ser_number))
                    HttpContext.Current.Server.Transfer("/error.aspx?e=serialEmpty");
                //get the connection string from web.config 
                string connectionString = System.Configuration.ConfigurationManager.ConnectionStrings[sender + "_" + tipocontestosso].ConnectionString;
                //ask the db for applicationInstance, URL of the function , filters to set  
                JObject data = JObject.FromObject(new
                {
                    IdUtente = idutente,
                    TmpPassword = tmppassword,
                    TipoContestoSso = tipocontestosso,
                    serial_number = ser_number,
                    Sender = sender
                });

                XmlDocument doc = (XmlDocument)Newtonsoft.Json.JsonConvert.DeserializeXmlNode(Newtonsoft.Json.JsonConvert.SerializeObject(data), "SQLP");
                DataSet tables = new DataSet();
                using (SqlConnection connection = new SqlConnection(connectionString))
                {
                    using (SqlCommand CMD = new SqlCommand("CUSTOM.CEI_LOGIN_FROM_EXTERNAL", connection))
                    {
                        CMD.CommandType = CommandType.StoredProcedure;
                        CMD.Parameters.Add("@XmlInput", SqlDbType.Xml).Value = doc.InnerXml;
                        SqlDataAdapter da = new SqlDataAdapter();
                        connection.Open();
                        da.SelectCommand = CMD;
                        da.Fill(tables);
                        da.Dispose();
                    }
                }

                //get the JSON from stored procedures
                string JSONstring = tables.Tables[0].Rows[0]["sessionData"].ToString();
                loginUser(JSONstring);
                return;
        }
        /// <summary>
        /// An endpoint which allows to enter a functionality in reftree with a certain list of assets as filter
        /// </summary>
        /// <param name="token">the token to look for in mmb_tokens in target database</param>
        /// <param name="function">a code which will be resolved in database with a certain functionUrl</param>
        /// <param name="assetid">a list of assetids to be used in the function</param>
        /// <param name="source">a code which corresponds to a connection string  in the web config. This is the database that contains user and token</param>
        /// 
        [HttpGet]
        public void LoginTarget(string token, string function, [FromUri]string[] assetid, string source)
        {
            string connectionString = System.Configuration.ConfigurationManager.ConnectionStrings[source].ConnectionString;
            JObject data = JObject.FromObject(new
            {
                Token = token,
                Function = function,
                AssetIds = String.Join(",", assetid),
                Source = source
            });
            XmlDocument doc = (XmlDocument)Newtonsoft.Json.JsonConvert.DeserializeXmlNode(Newtonsoft.Json.JsonConvert.SerializeObject(data), "SQLP");
            DataSet tables = new DataSet();
            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                using (SqlCommand CMD = new SqlCommand("CUSTOM.CEI_LOGIN_FROM_EXTERNAL", connection))
                {
                    CMD.CommandType = CommandType.StoredProcedure;
                    CMD.Parameters.Add("@XmlInput", SqlDbType.Xml).Value = doc.InnerXml;
                    SqlDataAdapter da = new SqlDataAdapter();
                    connection.Open();
                    da.SelectCommand = CMD;
                    da.Fill(tables);
                    da.Dispose();
                }
            }

            //get the JSON from stored procedures
            string JSONstring = tables.Tables[0].Rows[0]["sessionData"].ToString();
            loginUser(JSONstring);

        }
        protected bool areCookiesForcedToBeUnsecure()
        {
            bool forced = false;
            string makeCookiesUnsecure = ConfigurationManager.AppSettings["makeCookiesUnsecure"] != null ? ConfigurationManager.AppSettings["makeCookiesUnsecure"].ToString() : "";
            if (String.IsNullOrEmpty(makeCookiesUnsecure))
                return forced;
            forced = bool.Parse(makeCookiesUnsecure);
            return forced;
        }

        private void loginUser(string JSONFromDB) {
            dynamic dataFromDb = Newtonsoft.Json.JsonConvert.DeserializeObject(JSONFromDB);
            string applicationInstance = dataFromDb.applicationInstance;
            string functionURL = dataFromDb.functionURL;
            //string filters = String.Empty;
            int userId = int.Parse(dataFromDb.userid.ToString());
            //if (dataFromDb.filters != null)
            //    filters = Newtonsoft.Json.JsonConvert.SerializeObject(dataFromDb.filters);
            //Ok that's it let him enter the application 
            MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
            MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(applicationInstance)).FirstOrDefault();

            if (config == null)
                HttpContext.Current.Server.Transfer("/error.aspx?e=noAppConfig");
      
     
            SessionHandler.ApplicationInstanceId = config.id;
            SessionHandler.ApplicationInstanceName = config.appInstancename;
            SessionHandler.CustomFolderName = config.customFolderName != null ? config.customFolderName : config.id;
            SessionHandler.ApplicationDomainURL = Request.RequestUri.Authority;

            MagicFramework.MemberShip.EFMembershipProvider member = (MagicFramework.MemberShip.EFMembershipProvider)Membership.Providers[config.appInstancename];
            if (member == null)
                HttpContext.Current.Server.Transfer("/error.aspx?e=webConfigMembership");
            MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(config.TargetDBconn);
            MagicFramework.Data.Magic_Mmb_Users user = context.Magic_Mmb_Users.Where(u => u.UserID.Equals(userId) && u.ApplicationName.Equals(applicationInstance) && u.IsLockedOut == false).FirstOrDefault();
            if (user == null)
                HttpContext.Current.Server.Transfer("/error.aspx?e=userNotFound");
            member.SetUserInfosSession(user, context);
            FormsAuthentication.SetAuthCookie(user.Username, true);
            HttpCookie authCookie = HttpContext.Current.Response.Cookies[System.Web.Security.FormsAuthentication.FormsCookieName];
            //D.T Unicredit Penetration test SSO cookie is unsecure
            if (!areCookiesForcedToBeUnsecure())
                authCookie.Secure = true;
            HttpContext.Current.Cache.Insert(authCookie.Value.ToString(), config.id, null, authCookie.Expires, System.Web.Caching.Cache.NoSlidingExpiration);
            //HttpContext.Current.Cache.Insert(authCookie.Value.ToString() + "_FILTER", filters, null, authCookie.Expires, System.Web.Caching.Cache.NoSlidingExpiration);

            MagicFramework.MemberShip.EFMembershipProvider.ActivateChatAndNotifications(config, user.Username);
            //MagicFramework.Helpers.SessionHandler.Filters = filters;
            HttpContext.Current.Response.Redirect("/" + functionURL != null ? functionURL : config.appMainURL);
        }

        [HttpGet]
        public HttpResponseMessage aFakeBceWeb(string idutente, string pass)
        {
            HttpResponseMessage resp = new HttpResponseMessage();
            resp.StatusCode = HttpStatusCode.OK;
            resp.Content = new StringContent("{\"serial_number\":1234123}");
            return resp;

        }

        [HttpGet]
        public HttpResponseMessage aFakeScrivania(string idutente, string password)
        {
            HttpResponseMessage resp = new HttpResponseMessage();
            resp.StatusCode = HttpStatusCode.OK;
            resp.Content = new StringContent("1234123");
            return resp;

        }

        [HttpGet]
        public HttpResponseMessage GetGridFiltersForLoggedUser()
        {
            HttpResponseMessage response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            try
            {
                DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                dynamic data = JObject.FromObject(new { sessionId = SessionHandler.SessionID });
                var ds = dbutils.GetDataSetFromStoredProcedure("CUSTOM.Magic_GetUserFilter", data);
                var dt = ds.Tables[0];
                response.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(dt));

            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.NotFound;
                response.Content = new StringContent(ex.Message);
            }
            return response;
        }
        /// <summary>
        /// logins poste's IAM users into reftree. This must be an exception to FormsAuthentication in Web.Config and requires a connectionString with key "POSTE" and an appsetting "PosteLoginApi" to be there too
        /// </summary>
        [HttpGet]
        public void posteLogin()
        {
            bool deb = false;
            string testRaiseException = null;
            if (ConfigurationManager.AppSettings["posteRaiseException"] != null)
            {
                testRaiseException = ConfigurationManager.AppSettings["posteRaiseException"].ToString();
               
            }
            try
            {
                if (testRaiseException == "0")
                    throw new System.ArgumentException("FORCED RAISE ERROR 0!!!");
            
                if (ConfigurationManager.AppSettings["posteDebug"] != null)
                {
                    if (ConfigurationManager.AppSettings["posteDebug"] == "true")
                        deb = true;
                }

                if (testRaiseException == "10")
                    throw new System.ArgumentException(String.Format("FORCED RAISE ERROR {0}!!!",testRaiseException));


                if (deb || !String.IsNullOrEmpty(testRaiseException))
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog),DateTime.Now.ToLongTimeString() +  " - Called!" + Environment.NewLine);

                if (testRaiseException == "20")
                    throw new System.ArgumentException(String.Format("FORCED RAISE ERROR {0}!!!", testRaiseException));


                IAM_Manager iam = new IAM_Manager(null,deb);



                if (testRaiseException == "30")
                    throw new System.ArgumentException(String.Format("FORCED RAISE ERROR {0}!!!", testRaiseException));

                List<string> instancesposte = iam.checkInstances();
                if (testRaiseException == "40")
                    throw new System.ArgumentException(String.Format("FORCED RAISE ERROR {0}!!!", testRaiseException));

                if (instancesposte.Count == 0)
                    throw new System.ArgumentException("User not found");

                if (testRaiseException == "50")
                    throw new System.ArgumentException(String.Format("FORCED RAISE ERROR {0} Before reading server variables!!!", testRaiseException));
               

                string username = iam.UserName;

                if (testRaiseException == "60")
                {
                    if (String.IsNullOrEmpty(username))
                        username = String.Empty;
                    throw new System.ArgumentException(String.Format("FORCED RAISE ERROR {0} After reading server variables!!! {1} ", testRaiseException, username));
                }
                string dbinstance = instancesposte.First();

                if (testRaiseException == "70")
                    throw new System.ArgumentException(String.Format("FORCED RAISE ERROR {0}!!!", testRaiseException));
               
                if (instancesposte.Count >= 1)
                    IAM_Manager.LogInRefTreeByToken(username,dbinstance,deb,testRaiseException);

                return;
            }
            catch (Exception ex)
            {
                if (deb || !String.IsNullOrEmpty(testRaiseException))
                {
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,IAMLog), DateTime.Now.ToLongTimeString() + " - " + ex.Message + Environment.NewLine);
                    if (ex.InnerException != null)
                        File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - " + ex.InnerException.Message + Environment.NewLine);
                }
                HttpContext.Current.Server.Transfer("/error.aspx?e=accessForbidden");
            }

        }

        /// <summary>
        /// logins poste's IAM users into reftree. This must be an exception to FormsAuthentication in Web.Config and requires a connectionString with key "POSTE" and an appsetting "PosteLoginApi" to be there too
        /// </summary>
        [HttpGet]
        public void InailLogin()
        {
            bool deb = false;

            string[] usernamesVars = new string[] { "SM_USER", "HTTP_SM_USER" };
            try
            {
           
                if (ConfigurationManager.AppSettings["posteDebug"] != null)
                {
                    if (ConfigurationManager.AppSettings["posteDebug"] == "true")
                        deb = true;
                }


                if (deb)
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory,IAMLog), DateTime.Now.ToLongTimeString() + " - Called!" + Environment.NewLine);
             
                //fills UserName prop with the first non-empty / null value for the given var names (in order)
                IAM_Manager iam = new IAM_Manager(usernamesVars,deb);
                List<string> instancesinail = iam.checkInstancesInail();

                string APP_NAME_USR = iam.getServerVariable("HTTP_APP_NAME_USR");
                string APP_LASTNAME_USR = iam.getServerVariable("HTTP_APP_LASTNAME_USR");
                string APP_EMAIL_USR = "";

                try
                {
                    APP_EMAIL_USR = iam.getServerVariable("HTTP_APP_EMAIL_USR");
                }
                catch (Exception ex)
                {
                    APP_EMAIL_USR = "";
                }

                string username = iam.UserName;
                string http_cookie = iam.getServerVariable("HTTP_COOKIE");
                string SMSESSION_coockie = "";
                string sErrore = "";


                if (deb)
                {
                    string foundValues = DateTime.Now.ToLongTimeString() + $" username: {username} | HTTP_COOKIE:{http_cookie}" + Environment.NewLine;
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), foundValues);
                }




                foreach (string oVal in http_cookie.Split(';'))
                {
                    if (oVal.ToString().Contains("SMSESSION"))
                    {
                        SMSESSION_coockie = oVal.ToString();
                    }
                }

                if (!String.IsNullOrEmpty(SMSESSION_coockie))
                {
                    //TODO call here external service to get info from INAIL SITEMINDER, inputs are username and http_cookie

                    /*imposto i parametri da passare al servizio*/
                    /*username 0*/
                    /*SMSSESSION cookie 1 */
                    /*fasle ritrono del servizio 2 out*/
                    /*risultato del servizio 3 out*/
                    object[] oParameter = { username, SMSESSION_coockie, false, "" };
                    ssoConfiguration oConfig = new ssoConfiguration("inailDllPath", "inailDllToAdd", oParameter, "inailGetMethod");                    
                    /*lancio i servizi*/
                    startDll(oConfig,deb);
                                        
                    if (oConfig.parameters[2].ToString().ToUpper() == "true".ToUpper())
                    {
                        JObject data = new JObject();

                        if (!string.IsNullOrEmpty(oConfig.parameters[3].ToString())) {
                            data = JObject.Parse(oConfig.parameters[3].ToString());

                            data["APP_NAME_USR"] = APP_NAME_USR;
                            data["APP_LASTNAME_USR"] = APP_LASTNAME_USR;
                            data["APP_EMAIL_USR"] = APP_EMAIL_USR;
                        }
                        //SP di paolo
                        if (iam.chekUserProfile("config.usp_create_user_profile", JsonConvert.SerializeObject(data))) {
                            string dbinstance = instancesinail.First();

                            if (instancesinail.Count >= 1)
                            {

                                if (deb)
                                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - Calling LogInRefTreeByToken!" + Environment.NewLine);

                                IAM_Manager.LogInRefTreeByToken(username, dbinstance, deb,null,Request.RequestUri.Authority);
                            }
                            else
                            {
                                sErrore = "Nessun utente trovato per l'instanza";

                                if (deb)
                                {
                                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " " + sErrore + Environment.NewLine);
                                }
                                throw new ApplicationException(sErrore);
                            }
                        }
                        else
                        {
                            sErrore = "Errore nella SP creazione utente";

                            if (deb)
                            {
                                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " " + Environment.NewLine);
                            }
                            throw new ApplicationException(sErrore);
                        }
                    }
                    else
                    {
                        sErrore = "Errore servizio recupero ruoli e attributi" + oConfig.parameters[3].ToString();

                        if (deb)
                        {
                            File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " " + sErrore + Environment.NewLine);
                        }
                        throw new ApplicationException(sErrore);
                    }
                }
                else {
                    sErrore = "Cookie SMSESSION non trovato";

                    if (deb)
                    {
                        File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " " + sErrore + Environment.NewLine);
                    }
                    
                    throw new ApplicationException(sErrore);
                }

                //string dbinstance = instancesinail.First();
                ////TODO call here external service to get info from INAIL SITEMINDER, inputs are username and http_cookie            
                //if (instancesinail.Count >= 1)
                //    IAM_Manager.LogInRefTreeByToken(username, dbinstance, deb);

                return;
            }
            catch (Exception ex)
            {
                if (deb)
                {
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - " + ex.Message + Environment.NewLine);
                    if (ex.InnerException != null)
                        File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - " + ex.InnerException.Message + Environment.NewLine);
                }
                HttpContext.Current.Server.Transfer("/error.aspx?e=accessForbidden");
            }

        }

  //      //UNCOMMENT FOR TESTING - NEVER DEPLOY IN PRODUCTION!!
		//[HttpGet]
		//public HttpResponseMessage DummyInailLogin()
		//{
		//	try
		//	{
		//		string username = "developer";
		//		string dbinstance = "MagicSolution";
		//		bool deb = false;

		//		// Call the existing method with your parameters
		//		IAM_Manager.LogInRefTreeByToken(username, dbinstance, deb, null, Request.RequestUri.Authority);

		//		// Return success response
		//		var result = new
		//		{
		//			success = true,
		//			message = "Login successful",
		//			username = username,
		//			instance = dbinstance
		//		};

		//		return Request.CreateResponse(HttpStatusCode.OK, result);
		//	}
		//	catch (Exception ex)
		//	{
		//		var errorResult = new
		//		{
		//			success = false,
		//			message = ex.Message
		//		};

		//		return Request.CreateResponse(HttpStatusCode.InternalServerError, errorResult);
		//	}
		//}
		/// <summary>
		/// logins poste's IAM users into reftree. This must be an exception to FormsAuthentication in Web.Config and requires a connectionString with key "POSTE" and an appsetting "PosteLoginApi" to be there too
		/// </summary>
		[HttpGet]
        public void RcAuthLogin()
        {
            bool deb = false;

            string[] usernamesVars = new string[] { "HTTP_IV_CODFIS"};
            try
            {
              

                if (ConfigurationManager.AppSettings["posteDebug"] != null)
                {
                    if (ConfigurationManager.AppSettings["posteDebug"] == "true")
                        deb = true;
                }


                if (deb)
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - Called!" + Environment.NewLine);

                //fills UserName prop with the first non-empty / null value for the given var names (in order)
                IAM_Manager iam = new IAM_Manager(usernamesVars, deb);
                List<string> instancesRc = iam.checkInstances();
                if (deb)
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - instancesRc!" + Environment.NewLine);

                string dbinstance = instancesRc.First();
                if (deb)
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - dbinstance!" + Environment.NewLine);
                string username = iam.UserName;

                if (deb)
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - username!" + Environment.NewLine);

                if (instancesRc.Count >= 1)
                    IAM_Manager.LogInRefTreeByToken(username, dbinstance, deb, null);

                return;


                //if (!String.IsNullOrEmpty(username))
                //{
                //    //TODO call here external service to get info from INAIL SITEMINDER, inputs are username and http_cookie

                //    /*imposto i parametri da passare al servizio*/
                //    /*username 0*/
                //    /*SMSSESSION cookie 1 */
                //    /*fasle ritrono del servizio 2 out*/
                //    /*risultato del servizio 3 out*/


                //    object[] oParameter = { username, SMSESSION_coockie, false, "" };
                //    ssoConfiguration oConfig = new ssoConfiguration("inailDllPath", "inailDllToAdd", oParameter, "inailGetMethod");
                //    /*lancio i servizi*/
                //    startDll(oConfig, deb);

                //    if (oConfig.parameters[2].ToString().ToUpper() == "true".ToUpper())
                //    {
                //        //SP di paolo
                //        if (iam.chekUserProfile("config.usp_create_user_profile", oConfig.parameters[3].ToString()))
                //        {
                //            string dbinstance = instancesinail.First();

                //            if (instancesinail.Count >= 1)
                //            {
                //                IAM_Manager.LogInRefTreeByToken(username, dbinstance, deb);
                //            }
                //            else
                //            {
                //                sErrore = "Nessun utente trovato per l'instanza";

                //                if (deb)
                //                {
                //                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " " + sErrore + Environment.NewLine);
                //                }
                //                throw new ApplicationException(sErrore);
                //            }
                //        }
                //        else
                //        {
                //            sErrore = "Errore nella SP creazione utente";

                //            if (deb)
                //            {
                //                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " " + Environment.NewLine);
                //            }
                //            throw new ApplicationException(sErrore);
                //        }
                //    }
                //    else
                //    {
                //        sErrore = "Errore servizio recupero ruoli e attributi" + oConfig.parameters[3].ToString();

                //        if (deb)
                //        {
                //            File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " " + sErrore + Environment.NewLine);
                //        }
                //        throw new ApplicationException(sErrore);
                //    }
                //}
                //else
                //{
                //    sErrore = "Cookie SMSESSION non trovato";

                //    if (deb)
                //    {
                //        File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " " + sErrore + Environment.NewLine);
                //    }

                //    throw new ApplicationException(sErrore);
                //}

                //string dbinstance = instancesinail.First();
                ////TODO call here external service to get info from INAIL SITEMINDER, inputs are username and http_cookie            
                //if (instancesinail.Count >= 1)
                //    IAM_Manager.LogInRefTreeByToken(username, dbinstance, deb);


            }
            catch (Exception ex)
            {
                if (deb)
                {
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - " + ex.Message + Environment.NewLine);
                    if (ex.InnerException != null)
                        File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - " + ex.InnerException.Message + Environment.NewLine);
                }
                HttpContext.Current.Server.Transfer("/error.aspx?e=accessForbidden");
            }

        }

        public void startDll(ssoConfiguration oConfig,bool deb)
        {
            try
            {
                string sDll = ConfigurationManager.AppSettings.Get(oConfig.dll);
                string sReference = ConfigurationManager.AppSettings.Get(oConfig.reference);
                string sMethod = ConfigurationManager.AppSettings.Get(oConfig.method);

                if (String.IsNullOrEmpty(sDll) || String.IsNullOrEmpty(sMethod))
                {
                    if (deb)
                    {
                        File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - " + "Controllare le chiavi per la chiamata nel web.config [DLL,reference,metodo]" + Environment.NewLine);
                    }
                    
                    return;
                }

                var DLL = Assembly.LoadFile(sDll);


                

                if (!String.IsNullOrEmpty(sReference)) {
                    string[] dlls = { sReference };

                    foreach (string dll in dlls)
                    {
                        using (FileStream dllFileStream = new FileStream(dll, FileMode.Open, FileAccess.Read))
                        {
                            BinaryReader asmReader = new BinaryReader(dllFileStream);
                            byte[] asmBytes = asmReader.ReadBytes((int)dllFileStream.Length);
                            AppDomain.CurrentDomain.Load(asmBytes);
                        }
                    }

                    AppDomain.CurrentDomain.AssemblyResolve += CurrentDomain_AssemblyResolve;
                }
                

                var theType = ((System.Type[])DLL.ExportedTypes)[0];
                var c = Activator.CreateInstance(theType);
                var method = theType.GetMethod(sMethod);
                var o = method.Invoke(c, oConfig.parameters);

                 
            }
            catch (Exception ex)
            {
                if (deb)
                {
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + " - " + ex.Message.ToString() + Environment.NewLine);
                }

                return;
            }

        }

        private static Assembly CurrentDomain_AssemblyResolve(object sender, ResolveEventArgs args)
        {
            
            AppDomain domain = (AppDomain)sender;
            foreach (Assembly asm in domain.GetAssemblies())
            {
                
                if (asm.FullName == args.Name)
                {
                    return asm;
                }
            }

            File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, IAMLog), DateTime.Now.ToLongTimeString() + $"Can't find assembly {args.Name}" + Environment.NewLine);

            throw new ApplicationException($"Can't find assembly {args.Name}");
        }

        [HttpGet]
        public HttpResponseMessage healthCheck(string app)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;
            try
            {
                MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
                MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(app)).FirstOrDefault();

                MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(config.TargetDBconn);
                MagicFramework.Helpers.Sql.DBProcedure query = new MagicFramework.Helpers.Sql.DBProcedure("CUSTOM.Magic_GethealthCheck");
              
                query.connectionString = config.TargetDBconn;
                System.Data.DataTable result = query.ExecuteAndGetDataTable("");

                response.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(result));               
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent("Connessione non attiva");              
                //throw new HttpException("500");
                return response;
            }

            return response;
        }

        [HttpPost]
        public HttpResponseMessage refPointLogin(dynamic data)
        {

            HttpResponseMessage response = new HttpResponseMessage();
            response.StatusCode = HttpStatusCode.OK;

            return response;
        }

    }

    public class ssoConfiguration
    {
        public string dll;
        public string reference;
        public object[] parameters;
        public string method;

        public ssoConfiguration(string sDll, string sReference, object[] sParameter, string sMethod)
        {
            dll = sDll;
            reference = sReference;
            parameters = sParameter;
            method = sMethod;
        }

        public ssoConfiguration()
        {

        }
    }

}

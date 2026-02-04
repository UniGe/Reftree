using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.SessionState;
using System.Web.Routing;
using System.Web.Http;
using System.Web.Http.WebHost;
using System.Web.Configuration;
using Newtonsoft.Json;
using System.Web.UI;
using System.IO;
using MagicFramework.Helpers;
using MagicFramework;
using System.Net;
using System.Configuration;

namespace MagicSolution
{
    public class Global : System.Web.HttpApplication
    {
        public SessionStateSection sessionSettings;

        public class MyHttpControllerHandler : HttpControllerHandler, IRequiresSessionState
        {
            public MyHttpControllerHandler(RouteData routeData)
                : base(routeData)
            {
            }
        }
        public class MyHttpControllerRouteHandler : HttpControllerRouteHandler
        {
            protected override IHttpHandler GetHttpHandler(RequestContext requestContext)
            {
                return new MyHttpControllerHandler(requestContext.RouteData);
            }
        }

        private static bool BypassAllCertificateStuff(object sender, System.Security.Cryptography.X509Certificates.X509Certificate cert, System.Security.Cryptography.X509Certificates.X509Chain chain, System.Net.Security.SslPolicyErrors error)
        {
            return true;
        }
        protected void Application_BeginRequest(object sender, EventArgs e)
        {
            string filePath = HttpContext.Current.Request.Path;

            if (filePath.Contains("RefTreeServiceWorker"))
            {
                // Route the request to the controller action that returns the service worker file
                HttpContext.Current.RewritePath("/api/InOutFile/GetServiceWorker");
            }
        }

        void Application_Start(object sender, EventArgs e)
        {
            sessionSettings = (SessionStateSection)WebConfigurationManager.GetSection("system.web/sessionState");


            // Check if the application settings dictate to use TLS 1.2 as a default or attempt higher protocols
            if (bool.TryParse(WebConfigurationManager.AppSettings["securityPointToTls12"], out bool useTls12AndAbove) && useTls12AndAbove)
            {
                try
                {
                    // Attempt to set the security protocol to TLS 1.3, 1.2 (and optionally 1.1 if absolutely necessary)
                    ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls13
                                                            | SecurityProtocolType.Tls12
                                                            | SecurityProtocolType.Tls11;
                }
                catch (Exception ex)
                {
                    // Fallback to TLS 1.2 only, and consider logging the exception as it might indicate an unsupported environment
                    ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                }
            }
            else // Default to TLS 1.2 if the setting is not true or not present
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            }

#if DEBUG
            System.Net.ServicePointManager.ServerCertificateValidationCallback += new System.Net.Security.RemoteCertificateValidationCallback(BypassAllCertificateStuff);
#endif

            // Code that runs on application startup
            // intialize the default routing configuration
            //var config = GlobalConfiguration.Configuration;
            ////solve circular 
            //config.Formatters.JsonFormatter.SerializerSettings.ReferenceLoopHandling
            //    = Newtonsoft.Json.ReferenceLoopHandling.Serialize;
            //config.Formatters.JsonFormatter.SerializerSettings.PreserveReferencesHandling
            //    = Newtonsoft.Json.PreserveReferencesHandling.Objects;
 

            var route = RouteTable.Routes.MapHttpRoute(
                name: "DefaultApi",
                routeTemplate: "api/{controller}/{action}/{id}",
                defaults: new { id = System.Web.Http.RouteParameter.Optional }
            );
            route.RouteHandler = new MyHttpControllerRouteHandler();

            RouteConfig.RegisterRoutes(RouteTable.Routes);

            //GlobalConfiguration.Configuration.Formatters.JsonFormatter.SerializerSettings.DateTimeZoneHandling = DateTimeZoneHandling.Utc;

            CreateWatcher();
            InitJobs();   // decommentare per testare l'invio di notifiche via mail su calendario

            // migrate DB
            MagicFramework.Helpers.Sql.Migrate.Do();

            CustomAppStart.OnStart();

            CallCustomCodeByReflection();
        }

        void Application_End(object sender, EventArgs e)
        {
            //  Code that runs on application shutdown
        }

        //void Application_Error(object sender, EventArgs e)
        //{
        //    // Code that runs when an unhandled error occurs

        //}

        void Session_Start(object sender, EventArgs e)
        {
            // Code that runs when a new session is started
        }

        void Session_End(object sender, EventArgs e)
        {
            if (sessionSettings == null)
                return;
            // Code that runs when a session ends. 
            // Note: The Session_End event is raised only when the sessionstate mode
            // is set to InProc in the Web.config file. If session mode is set to StateServer 
            // or SQLServer, the event is not raised.
            if (sessionSettings.Mode.ToString().Equals("InProc"))
                MagicHub.RemoveSessionId(this.Session.SessionID);
        }

        public void CreateWatcher()
        {
            //Create a new FileSystemWatcher.
            FileSystemWatcher watcher = new FileSystemWatcher();

            //Set the filter to only catch TXT files.
            watcher.Filter = "*.config";

            //Subscribe to the Created event.
            watcher.Changed += new FileSystemEventHandler(watcher_Changed);

            //Set the path to C:\Temp\
            //            string dir = Path.Combine(HttpRuntime.AppDomainAppPath, "Configuration");
            watcher.Path = Path.Combine(HttpRuntime.AppDomainAppPath, "Configuration");

            //Enable the FileSystemWatcher events.
            watcher.EnableRaisingEvents = true;
        }

        private void watcher_Changed(object sender, FileSystemEventArgs e)
        {
            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Configurations);
            try
            {
                //rebuild cache
                MagicFramework.Helpers.MFConfiguration applicationConfig = new MagicFramework.Helpers.MFConfiguration(true);
            }
            catch (Exception ex)
            {
                MagicFramework.Helpers.MFLog.LogInFile("watcher_Changed/Global.asax.cs: " + ex.Message, MagicFramework.Helpers.MFLog.logtypes.ERROR);
            }
            return;
        }

        private void InitJobs()
        {
            MagicFramework.Jobs.MailJob.InitJob();
            MagicFramework.Jobs.DatabaseEventsJob.InitJob();
            MagicFramework.Jobs.NotificationJob.InitJob();
            MagicFramework.Jobs.GoogleCalendarsSyncJob.InitJob();
            if (sessionSettings.Mode.ToString().Equals("SQLServer"))
                MagicFramework.Jobs.SessionCheckJob.InitJob(sessionSettings, MagicHub.ActiveSessions, MagicHub.RemoveSessionIds);
        }

        protected void Application_PostAuthorizeRequest()
        {
            if (IsSessionReadOnlyController())
            {
                HttpContext.Current.SetSessionStateBehavior(SessionStateBehavior.ReadOnly); //this state enables parallel elaboration of requests, only change if u do not have to modify the session
            }
        }

        private bool IsSessionReadOnlyController()
        {
            return HttpContext.Current.Request.AppRelativeCurrentExecutionFilePath.StartsWith("~/api/Mail") 
                || HttpContext.Current.Request.AppRelativeCurrentExecutionFilePath.Contains("BuildDocumentsFromModel")
                || HttpContext.Current.Request.AppRelativeCurrentExecutionFilePath.Contains("PublicGetFile");
        }

        protected void Application_AcquireRequestState(object sender, EventArgs e)
        {
            if (User.Identity.IsAuthenticated && SessionHandler.IdUser > 0)
            {
                var lastPwChange = MagicFramework.Helpers.CacheHandler.UserLastChangedPassword(SessionHandler.IdUser);
                HttpCookie authCookie = Request.Cookies[FormsAuthentication.FormsCookieName];
                FormsAuthenticationTicket authTicket = FormsAuthentication.Decrypt(authCookie.Value);

                if (authTicket.IssueDate < lastPwChange)
                {
                    new MagicFramework.Controllers.MenuDataController().AbandonSession();
                    return;
                }
            }
        }
        protected bool areCookiesForcedToBeUnsecure() {
            bool forced = false;
            string makeCookiesUnsecure =  ConfigurationManager.AppSettings["makeCookiesUnsecure"] != null ? ConfigurationManager.AppSettings["makeCookiesUnsecure"].ToString() : "" ;
            if (String.IsNullOrEmpty(makeCookiesUnsecure))
                return forced;
            forced = bool.Parse(makeCookiesUnsecure);
            return forced;
        }
        protected void Application_EndRequest(object sender, EventArgs e)
        {
            //if (!Request.IsSecureConnection || areCookiesForcedToBeUnsecure())
                if (areCookiesForcedToBeUnsecure())
                    return;
            // this code will mark the forms authentication cookie and the
            // session cookie as Secure.
            if (Response.Cookies.Count > 0)
            {
                foreach (string s in Response.Cookies.AllKeys)
                {
                    if (s == FormsAuthentication.FormsCookieName || s.ToLower() == "asp.net_sessionid")
                    {
                        Response.Cookies[s].Secure = true;
                    }
                }
            }
        }

        private void CallCustomCodeByReflection()
        {
            try
            {
                var callsOnStartup = new MFConfiguration().LoadConfigurations()
                    .SelectMany(c => c.Value.listOfInstances)
                    .Where(l => l.CallOnStartUpByReflection.Any())
                    .SelectMany(l => l.CallOnStartUpByReflection)
                    .Distinct()
                    .Select(i => i.Trim());

                if (!callsOnStartup.Any())
                {
                    return;
                }

                var assemblies = AppDomain.CurrentDomain.GetAssemblies();
                foreach (var nameInfo in callsOnStartup)
                {
                    try
                    {
                        string[] names = nameInfo.Split('.');
                        string assemblyName = names[0];
                        string className = names[1];
                        string methodName = names[2];
                        assemblies
                            .Where(a => a.FullName.StartsWith(assemblyName))
                            .First()
                            .GetTypes()
                            .Where(t => t.Name.Equals(className))
                            .First()
                            .GetMethod(methodName)
                            .Invoke(null, null);

                    }
                    catch(Exception e)
                    {
                        MFLog.LogInFile($"Error while calling reflection method on startup '{nameInfo}': {e}", MFLog.logtypes.ERROR);
                    }
                }
            }
            catch (Exception e)
            {
                MFLog.LogInFile($"Error while loading configs for CallCustomCodeByReflection on startup: {e}", MFLog.logtypes.ERROR);
            }
            
        }
    }
}

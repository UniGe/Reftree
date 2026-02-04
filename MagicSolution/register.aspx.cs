using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Configuration;
using MagicFramework.Helpers;
using MagicFramework.Controllers;
using MagicFramework.Data;
using System.Collections.Specialized;
using MagicFramework.MemberShip;
using System.Web.Security;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.UI.HtmlControls;
using System.Reflection;
using System.Diagnostics;

namespace MagicSolution
{
    public partial class register : MagicFramework.Helpers.TranslateablePage
    {

        public MFConfiguration applicationConfig;
        private string[] registrationOpen;
        protected string templateDirectory;
        protected string userCameFrom;
        protected string token;
        protected string message;
        protected bool error;
        protected MagicDBEntities context;
        protected MFConfiguration.ApplicationInstanceConfiguration selectedconfig;

        protected void Page_Load(object sender, EventArgs e)
        {
            try
            {
                registrationOpen = ConfigurationManager.AppSettings["registrationOpenFor"].Split(',');
                applicationConfig = new MFConfiguration(Request.Url.Authority);
                if (applicationConfig.appSettings.listOfInstances.Count == 1)
                    userCameFrom = applicationConfig.appSettings.listOfInstances[0].id;
                else if (Request.QueryString["from"] != null)
                    userCameFrom = Request.QueryString["from"];
                selectedconfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, userCameFrom);
                SessionHandler.ApplicationInstanceId = selectedconfig.id;
                SessionHandler.ApplicationDomainURL = Request.Url.Authority;
                var connectionString = DBConnectionManager.GetTargetEntityConnectionString();
                context = new MagicDBEntities(connectionString);
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Configuration loading: " + ex.Message, MFLog.logtypes.ERROR);
                MFLog.LogInFile("Configuration app settings are null or some settings for the registration are missing!", MFLog.logtypes.ERROR);
                Server.Transfer("/error.aspx?e=c");
            }
            if(!registrationOpen.Contains("All") && !registrationOpen.Contains(userCameFrom))
                Server.Transfer("/error.aspx?e=registrationNotOpenForThisApp");
            token = Request.QueryString["token"];
            MagicFramework.Helpers.SessionHandler.UserCulture = culture;
            base.translationFileName = selectedconfig.appInstancename + "Subscription";
            templateDirectory = Request.PhysicalApplicationPath + @"Magic\HtmlTemplates\register\";
            if (token != null)
            {
                var pr = context.Magic_Mmb_PendingRegistrations.Where(r => r.token == token).FirstOrDefault();
                if (pr != null)
                {
                    if (pr.completed_registration == true)
                    {
                        message = this.FindTranslation("alreadyRegistered", "You are already registered, please login!");
                        HttpContext.Current.RewritePath("/login?from=" + userCameFrom + "&culture=" + culture + "&message=" + message);
                    }
                }
                else
                    token = null;
            }
            if (!String.IsNullOrEmpty(selectedconfig.appLogoLoginPage))
            {
                applogopic.Src = selectedconfig.appLogoLoginPage;
                spandx.Visible = false;
                spansx.Visible = false;
            }
            else
                applogopic.Visible = false;

            string filePath = "";
            if (token != null && selectedconfig.completeProfileInsideApplication)
            {
                this.RegistrationStep2();
            }
            else
            {
                if (token != null)
                {
                    filePath = "complete_registration.inc";
                }
                else
                {
                    filePath = "registration.inc";
                }
                if (System.IO.File.Exists(templateDirectory + selectedconfig.appInstancename + "\\" + filePath))
                    filePath = templateDirectory + selectedconfig.appInstancename + "\\" + filePath;
                else
                    filePath = templateDirectory + "default_" + filePath;
                RegisterButton.Text = FindTranslation("submit", "Submit");
                string file = System.IO.File.ReadAllText(filePath);
                Control c = ParseControl(this.Translate(file));
                content.Controls.Add(c);
            }
        }

        protected void Submit(object sender, EventArgs e)
        {
            if (token == null)
            {
                this.RegistrationStep1();
            }
            else
            {
                this.RegistrationStep2();
            }
        }

        private void RegistrationStep1()
        {
            try
            {
                NameValueCollection nvc = Request.Form;
                Magic_Mmb_PendingRegistrations pr;
                string email = nvc["Email"];
                if (!Utils.IsValidEmail(email))
                {
                    message = this.FindTranslation("emailNotValid", "Email address not valid.");
                    return;
                }
                EFMembershipProvider member = (MagicFramework.MemberShip.EFMembershipProvider)Membership.Providers[selectedconfig.appInstancename];
                string username = member.GetUserNameByEmail(email);
                if (username != "")
                {
                    message = this.FindTranslation("alreadyRegistered", "You are already registered, please login!");
                    Server.Transfer("/login?from=" + userCameFrom + "&message=" + message);
                }
                var pendingUsers = context.Magic_Mmb_PendingRegistrations.Where(r => r.email == email).Where(r => r.completed_registration == false);
                if (pendingUsers.Count() == 0)
                {
                    //D.T: validate password before adding to the pending regs...
                    ValidatePasswordEventArgs args = new ValidatePasswordEventArgs(username, nvc["Password"].ToString(), true);
                    member.OnValidatePassword(this,args);
                    if (args.Cancel)
                    {
                        if (args.FailureInformation != null)
                        {
                            message = args.FailureInformation.Message;
                            throw args.FailureInformation;
                        }
                    }

                    pr = new Magic_Mmb_PendingRegistrations();
                    pr.created_at = DateTime.Now;
                    pr.email = email;
                    pr.password = StringCipher.Encrypt(nvc["Password"], "asdfa9");
                    pr.token = Crypto.RandomString(100);
                    pr.completed_registration = false;
                    context.Magic_Mmb_PendingRegistrations.Add(pr);
                    context.SaveChanges();
                    message = this.FindTranslation("checkYourMail", "Success! Please check your emails to complete the Registration!");
                }
                else
                {
                    pr = pendingUsers.First();
                    message = this.FindTranslation("alreadyPending", "You have already a registration pending. We have resent you the activation mail. Please check your mail account!");
                }
                var uri = new Uri(Request.Url.ToString());
                string query = uri.Query.Length == 0 ? "?" : uri.Query + "&";
                string link = query + "token=" + pr.token;
                try
                {
                    bool success = false;
                    if (!selectedconfig.useExternalMailService)
                    {
                        link = Request.Url.Scheme + "://" +  Request.Url.Authority + "/register.aspx" + link;
                        var mailer = new Mailer();
                        if (mailer.LoadTemplateFromDb("comple"))
                        {
                            Dictionary<string, string> tagInfo = new Dictionary<string, string>();
                            tagInfo.Add("EMAIL", pr.email);
                            tagInfo.Add("USER", pr.email);
                            tagInfo.Add("PASSWORD", nvc["Password"]);
                            tagInfo.Add("BASE_URL", Request.Url.Authority);
                            tagInfo.Add("COMPLETE_REGISTRATION_LINK", link);
                            mailer.ReplaceTags(tagInfo);
                        }
                        else
                        {  
                            mailer.SetSubject("Confirmation");
                            mailer.SetBody("<a href=\"" + link + "\">Complete Registration!</a>");
                        }
                        mailer.SetTo(pr.email);
                        MFLog.LogInFile($"Going to send mail to: {pr.email}", MFLog.logtypes.INFO);
                        success = mailer.Send();
                    }
                    else
                    {
                        string method = "SendConfirmationMail";
                        var methodArguments = new[] { pr.email, link };
                        success = InvokeMailServiceMethod(method, methodArguments);
                    }
                    if (!success)
                    {
                        MFLog.LogInFile("Registration-1: Error on sending email!", MFLog.logtypes.ERROR);
                        message = this.FindTranslation("errorMail", "Error on sending mail, please contact the system administrator!");
                    }

                    try
                    {
                        Mailer notificationsMailer = new Mailer(Request.Url.Authority, selectedconfig.id);
                        notificationsMailer.SetSubject("New registration on " + selectedconfig.appInstancename);
                        notificationsMailer.SetBody(string.Format("New registration on {0}\nUser email: {1}\n", selectedconfig.appInstancename, pr.email), false);
                        notificationsMailer.SetTo(selectedconfig.appEmail);
                        notificationsMailer.Send();
                    }
                    catch { }
                }
                catch (Exception e)
                {
                    MFLog.LogInFile("Registration-1.2: Message: " + e.Message, MFLog.logtypes.ERROR);
                    message = this.FindTranslation("errorMail", "Error on sending mail, please contact the system administrator!");
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Registration: " + ex.Message, MFLog.logtypes.ERROR);
                if (String.IsNullOrEmpty(message))
                 message = this.FindTranslation("errorOperation", "Errors while performing the operation, please contact the system administrator!");
            }
        }

        private void RegistrationStep2()
        {
            try
            {
                NameValueCollection nvc = Request.Form;
                string errorMessage = "";
                var pr = context.Magic_Mmb_PendingRegistrations.Where(r => r.token == token).FirstOrDefault();
                EFMembershipProvider.CreateUserData user = new EFMembershipProvider.CreateUserData();
                if (!selectedconfig.completeProfileInsideApplication)
                {
                    user.Firstname = nvc["FirstName"];
                    user.Lastname = nvc["LastName"];
                    user.Name = user.Firstname + " " + user.Lastname;
                }
                user.Username = EFMembershipProvider.GetUniqueUserName(pr.email.Substring(0, pr.email.IndexOf("@")));
                user.Password = StringCipher.Decrypt(pr.password, "asdfa9");
                user.Email = pr.email;
                user.CultureId = culture;
                var createdUser = EFMembershipProvider.CreateUser(user, out errorMessage);
                if (errorMessage != "")
                {
                    message = errorMessage;
                }
                else
                {
                    Mailer mailer = new Mailer(Request.Url.Authority, selectedconfig.id);
                    mailer.SetSubject("New account verification on " + selectedconfig.appInstancename);
                    mailer.SetBody(string.Format("New account verification on {0}\nUser email: {1}\nUser id: {2}\n", selectedconfig.appInstancename, createdUser.Email, createdUser.UserID.ToString()), false);
                    mailer.SetTo(selectedconfig.appEmail);
                    try
                    {
                        mailer.Send();
                    }
                    catch { }

                    if (!selectedconfig.completeProfileInsideApplication)
                    {
                        pr.password = "";
                    }
                    pr.completed_registration = true;
                    context.SaveChanges();

                    if (!selectedconfig.completeProfileInsideApplication)
                    {
                        var d = new Dictionary<string, string>();
                        string extendedInfo;
                        MFLog.LogInFile("Register.RegistrationStep2: CompleteUserProfile called now...", MFLog.logtypes.INFO);
                        if (CompleteUserProfile(createdUser.UserID, pr.email, Request, context, out d, out extendedInfo))
                            this.SendWelcomeMail(pr.email, d);
                        else
                        {
                            MFLog.LogInFile("Register.CompleteUserProfile error: " + extendedInfo, MFLog.logtypes.ERROR);
                            message = extendedInfo;
                            error = true;
                            return;
                        }
                    }

                    //Login user
                    try
                    {
                        login.Login(selectedconfig, user.Username, user.Password, false, selectedconfig.appMainURL, Request, Response);
                    }
                    catch(Exception e)
                    {
                        Debug.WriteLine(e.Message);
                        var uri = new Uri(Request.Url.ToString());
                        string query = uri.Query.Length == 0 ? "?" : uri.Query + "&";
                        Server.Transfer("/login" + uri.Query + "message=" + this.FindTranslation("pleaseLogin", "Please login!"));
                    }
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("Register.RegistrationStep2 error: " + ex.Message, MFLog.logtypes.ERROR);
                if (ex.InnerException != null)
                    MFLog.LogInFile("Register.RegistrationStep2 inner exception: " + ex.InnerException.Message, MFLog.logtypes.ERROR);

                message = this.FindTranslation("ups", "Uuuuuups, something went wrong!");
            }
        }

        public static bool CompleteUserProfile(int userid, string email, HttpRequest Request, MagicDBEntities context, out Dictionary<string, string> d, out string extendedInfo)
        {
            d = NvcToDictionary(Request.Form);
            Dictionary<string, string> g = NvcToDictionary(Request.QueryString);
            d.Add("UserId", userid.ToString());
            d.Add("Email", email);
            foreach (var kv in g)
            {
                if (!d.ContainsKey(kv.Key))
                    d.Add(kv.Key, kv.Value);
            }
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(d);

            MFLog.LogInFile("Register.RegistrationStep2: will complete user profile now...with data:"+json, MFLog.logtypes.INFO);
            var xml = JsonUtils.Json2Xml(json);
            var insertedSuccesfully = new System.Data.Entity.Core.Objects.ObjectParameter("registered", typeof(bool));
            var message = new System.Data.Entity.Core.Objects.ObjectParameter("message", typeof(string));
            context.Magic_Mmb_UserRegistration(xml.OuterXml, insertedSuccesfully, message);
            extendedInfo = message.Value.ToString();
            MFLog.LogInFile("Register.RegistrationStep2: dbo.Magic_Mmb_UserRegistration is complete now with status:" + insertedSuccesfully.Value.ToString(), MFLog.logtypes.INFO);
            return Convert.ToBoolean(insertedSuccesfully.Value);
        }

        public void SendWelcomeMail(string emailAddress, Dictionary<string, string> profileData)
        {
            if (selectedconfig.useExternalMailService)
            {
                try
                {
                    string method = "SendWelcomeMail";
                    var methodArguments = new object[] { emailAddress, profileData };
                    InvokeMailServiceMethod(method, methodArguments);
                }
                catch { }
            }
            else
            {
                // check if classInfo name = GetResponse
                if (String.IsNullOrEmpty(selectedconfig.externalMailService))
                    return;
                string[] classInfo = selectedconfig.externalMailService.Split('-');
                if (classInfo[0] == "GetResponse")
                {
                    MagicFramework.Helpers.GetReponseHandler gr = new MagicFramework.Helpers.GetReponseHandler();
                    string Name = "";
                    foreach (KeyValuePair<string, string> kvp in profileData)
                    {
                        if ((kvp.Key  == "FirstName") || (kvp.Key == "LastName") || (kvp.Key == "RagioneSociale"))
                        {
                            Name += kvp.Value + " ";
                        }                        
                    }
             
                   bool subscribed = gr.AddContactToList("iscritti_app", Name, emailAddress); // TODO: chiedere anche name in form di iscrizione
                }
            }
        }

        public static void SendWelcomeMail(string emailAddress, Dictionary<string, string> profileData, MFConfiguration.ApplicationInstanceConfiguration selectedConfig)
        {
            if (selectedConfig.useExternalMailService)
            {
                try
                {
                    string method = "SendWelcomeMail";
                    var methodArguments = new object[] { emailAddress, profileData };
                    InvokeMailServiceMethod(method, methodArguments, selectedConfig);
                }
                catch { }
            }
            else
            {
                // check if classInfo name = GetResponse
                string[] classInfo = selectedConfig.externalMailService.Split('-');
                if (classInfo[0] == "GetResponse")
                {
                    MagicFramework.Helpers.GetReponseHandler gr = new MagicFramework.Helpers.GetReponseHandler();
                    string Name = "";
                    foreach (KeyValuePair<string, string> kvp in profileData)
                    {
                        if ((kvp.Key == "FirstName") || (kvp.Key == "LastName") || (kvp.Key == "RagioneSociale"))
                        {
                            Name += kvp.Value + " ";
                        }
                    }
                    bool subscribed = gr.AddContactToList("iscritti_app", Name, emailAddress); // TODO: chiedere anche name in form di iscrizione
                }
            }
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

        private bool InvokeMailServiceMethod(string method, object[] methodArguments){
            string[] classInfo = selectedconfig.externalMailService.Split('-');
            string apiKey = selectedconfig.externalMailServiceApiKey;
            Assembly a = Assembly.Load(classInfo[0]);
            Type TypeMailService = a.GetType(classInfo[1]);
            Object MailService;
            if(apiKey != null)
                MailService = Activator.CreateInstance(TypeMailService, new[] { apiKey });
            else
                MailService = Activator.CreateInstance(TypeMailService);
            return (bool)TypeMailService.InvokeMember(method, BindingFlags.InvokeMethod, null, MailService, methodArguments);
        }

        public static bool InvokeMailServiceMethod(string method, object[] methodArguments, MFConfiguration.ApplicationInstanceConfiguration selectedConfig)
        {
            string[] classInfo = selectedConfig.externalMailService.Split('-');
            string apiKey = selectedConfig.externalMailServiceApiKey;
            Assembly a = Assembly.Load(classInfo[0]);
            Type TypeMailService = a.GetType(classInfo[1]);
            Object MailService;
            if(apiKey != null)
                MailService = Activator.CreateInstance(TypeMailService, new[] { apiKey });
            else
                MailService = Activator.CreateInstance(TypeMailService);
            return (bool)TypeMailService.InvokeMember(method, BindingFlags.InvokeMethod, null, MailService, methodArguments);
        }
    }
}
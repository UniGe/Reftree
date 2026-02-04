using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using MagicFramework.Helpers;
using MagicFramework.Models;
using Google.Authenticator;
using MagicFramework.Data;
using System.Threading.Tasks;
using System.Net.Mail;
 

namespace MagicSolution
{
    public partial class syncTwoFactorAuthMail : MagicFramework.Helpers.TranslateablePage
    {
        protected MFConfiguration.ApplicationInstanceConfiguration config;
        protected string message = null;
        protected bool error = false;
        private int userID;
        MagicFramework.Data.MagicDBDataContext context;
        private MagicFramework.Data.Magic_Mmb_Users_Extensions userExtension;
        private string appMainUrl = HttpContext.Current.Request.QueryString["ReturnUrl"];


        private void SendEmail(string email, string code)
        {
            try
            {
                Mailer mailer = new Mailer();
                mailer.SetTo(email);

                if (mailer.LoadTemplateFromDb("AUTHCD", culture, true))
                {
                    mailer.ReplaceTags(new Dictionary<string, string> {
                { "1", code }
                    }, "{", "}");

                    if (!mailer.Send())
                    {
                        error = true;
                        message = "Error sending email: Failed to send mail";
                    }
                }
                else
                {
                    // Fall back to previous method if template not found
                    var domainUrl = SessionHandler.ApplicationDomainURL;
                    var instanceId = SessionHandler.ApplicationInstanceId;
                    var credentials = Mailer.GetDefaultSmtpCredentialsSilent(domainUrl, instanceId);

                    string body = base.FindTranslation("mailauthbody", "Ciao, </br> Questo è il tuo codice di accesso {0}: <b>{1}</b></br> Se hai ricevuto questa mail ma non stai effettuando il login contatta l' amministratore.");
                    MailMessage mail = new MailMessage();
                    mail.From = new MailAddress(credentials.Address);
                    mail.To.Add(email);
                    mail.Subject = "Accesso 2FA";
                    mail.IsBodyHtml = true;
                    mail.Body = string.Format(body, SessionHandler.ApplicationInstanceName, code);

                    var smtpClient = new SmtpClient(credentials.ServerURL, credentials.Port);
                    smtpClient.UseDefaultCredentials = false;
                    smtpClient.Credentials = new System.Net.NetworkCredential(credentials.SMTPAccountName ?? credentials.Address, credentials.Password);
                    smtpClient.DeliveryMethod = SmtpDeliveryMethod.Network;
                    smtpClient.EnableSsl = credentials.SSL;
                    smtpClient.Port = credentials.Port;
                    smtpClient.Timeout = 18000;
                    smtpClient.Send(mail);
                }
            }
            catch (Exception ex)
            {
                error = true;
                message = "Error sending email: " + ex.Message;
            }
        }
        private void GenerateAndSendCode()
        {
            // Generate a unique 6-digit code
            string code = new Random().Next(100000, 999999).ToString();

            // Store it in the database
            if (userExtension == null)
            {
                userExtension = new Magic_Mmb_Users_Extensions
                {
                    UserID = userID,
                    TwoFactorAuthCode = code 
                };
                context.Magic_Mmb_Users_Extensions.InsertOnSubmit(userExtension);
            }
            else
            {
                userExtension.TwoFactorAuthCode = code; 
            }
            context.SubmitChanges();

            // Send the code via email
            var user = context.Magic_Mmb_Users.FirstOrDefault(u => u.UserID == userID);
            if (user != null && !string.IsNullOrEmpty(user.Email))
            { 
                SendEmail(user.Email, code);
            }

            // Show the form for entering the code
            CodeLabel.Text = base.FindTranslation("twoFactorAuthCode", "Inserisci il codice che ti è stato inviato via e-mail:");
            CodeLabel.Visible = true;
            Code.Visible = true;
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            base.translationFileName = "Login";
            config = new MFConfiguration().GetApplicationInstanceByID(HttpContext.Current.Request.Url.Authority, SessionHandler.ApplicationInstanceId);
            try
            {
                userID = GetUserIDFromToken();
            }
            catch (Exception ex)
            {
                error = true;
                message = ex.Message;
                return;
            }
            context = new MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            userExtension = context.Magic_Mmb_Users_Extensions.Where(ue => ue.UserID == userID).FirstOrDefault();
            if (!this.IsPostBack)
            {
                GenerateAndSendCode();
                if (!String.IsNullOrEmpty(config.appLogoLoginPage))
                {
                    applogopic.Src = config.appLogoLoginPage;
                }
                else
                {
                    applogopic.Visible = false;
                }
            }
        }

        private int GetUserIDFromToken()
        {
            var tokenInfo = Tokens.GetValidToken(HttpContext.Current.Request.QueryString.Get("token"), "TwoFactorAuth");
            if (tokenInfo == null)
            {
                throw new Exception(base.FindTranslation("invalidToken", "the provided token is invalid"));
            }
            return (int)tokenInfo["user_id"];
        }

        protected void Submit(object sender, EventArgs e)
        {
            try
            {
                // case user needs to sync app
                if (userExtension == null || string.IsNullOrEmpty(userExtension.TwoFactorAuthCode))
                {
                        throw new Exception(base.FindTranslation("loginFailed", "Login failed"));
                }
                else // case user needs to enter code
                {
                    
                    if (userExtension.TwoFactorAuthCode != Code.Text)
                    {
                        throw new Exception(base.FindTranslation("wrongCode", "Codice errato"));
                    }
                }
                var user = context.Magic_Mmb_Users.Where(ue => ue.UserID == userID).FirstOrDefault();
                Tokens.InvalidateToken(HttpContext.Current.Request.QueryString.Get("token"));
                userExtension.TwoFactorAuthCode = null;
                context.SubmitChanges();
                login.Login(config, null, null, false, string.IsNullOrEmpty(appMainUrl) ? config.appMainURL : appMainUrl, Request, Response, user);
            }
            catch (Exception ex)
            {
                error = true;
                message = ex.Message;
            }
        }
    }
}
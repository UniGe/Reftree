using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using MagicFramework.Helpers;
using MagicFramework.Models;
using Google.Authenticator;

namespace MagicSolution
{
    public partial class syncTwoFactorAuthSecret : MagicFramework.Helpers.TranslateablePage
    {
        protected MFConfiguration.ApplicationInstanceConfiguration config;
        protected string message = null;
        protected bool error = false;
        private int userID;
        MagicFramework.Data.MagicDBDataContext context;
        private MagicFramework.Data.Magic_Mmb_Users_Extensions userExtension;
        private string appMainUrl = HttpContext.Current.Request.QueryString["ReturnUrl"];


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
            context = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            userExtension = context.Magic_Mmb_Users_Extensions.Where(ue => ue.UserID == userID).FirstOrDefault();
            if (!this.IsPostBack)
            {
                // case user needs to sync app
                if (userExtension == null || string.IsNullOrEmpty(userExtension.TwoFactorAuthCode))
                {
                    TwoFactorAuthenticator tfa = new TwoFactorAuthenticator();
                    string secret = Crypto.RandomString(10);
                    HttpContext.Current.Session["syncTwoFactorAuthSecret"] = secret;
                    var setupInfo = tfa.GenerateSetupCode(config.appInstancename, "MagicFramework", secret, 300, 300);
                    Description.Text = base.FindTranslation("enterCodeGoogleAuthenticator", "please sync this code with your Google Authenticator app and click submit");
                    Description.Visible = true;

                    ManualEntryKey.Text = setupInfo.ManualEntryKey;
                    ManualEntryKey.Visible = true;

                    QRCode.ImageUrl = setupInfo.QrCodeSetupImageUrl;
                    QRCode.Visible = true;
                }
                else // case user needs to enter code
                {
                    CodeLabel.Text = base.FindTranslation("googleAuthenticatorCode", "please insert your google authenticator code. App info: ") + config.appInstancename + " MagicFramework";
                    CodeLabel.Visible = true;
                    Code.Visible = true;
                }

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
                    string secret = (string)HttpContext.Current.Session["syncTwoFactorAuthSecret"];
                    if (string.IsNullOrEmpty(secret))
                    {
                        throw new Exception(base.FindTranslation("secretNullOrEmpty", "the secret is null or empty"));
                    }
                    if (userExtension == null)
                    {
                        userExtension = new MagicFramework.Data.Magic_Mmb_Users_Extensions();
                        userExtension.UserID = userID;
                        context.Magic_Mmb_Users_Extensions.InsertOnSubmit(userExtension);
                    }
                    userExtension.TwoFactorAuthCode = secret;
                    context.SubmitChanges();
                }
                else // case user needs to enter code
                {
                    TwoFactorAuthenticator tfa = new TwoFactorAuthenticator();
                    if (!tfa.ValidateTwoFactorPIN(userExtension.TwoFactorAuthCode, Code.Text))
                    {
                        throw new Exception(base.FindTranslation("wrongCode", "you have inserted a wrong code"));
                    }
                }
                var user = context.Magic_Mmb_Users.Where(ue => ue.UserID == userID).FirstOrDefault();
                Tokens.InvalidateToken(HttpContext.Current.Request.QueryString.Get("token"));
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
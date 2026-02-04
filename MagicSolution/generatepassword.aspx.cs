using System;
using System.Linq;
using MagicFramework.MemberShip;
using System.Web.Security;
using System.Net.Mail;
using MagicFramework.Helpers;
using MagicFramework.Models;

namespace MagicSolution
{
    public partial class generatepassword : login
    {

        public const string PW_TOKEN_PURPOSE = "PW_RESET";

        protected void Page_PreInit(object sender, EventArgs e)
        {
            base.translationFileName = "generatepassword";
            validatepassword.ErrorMessage = base.FindTranslation("passwordnotmatch", "passwordnotmatch");
        }

        private bool CheckValidChange(bool checkonly, out string error_message)
        {
            error_message = String.Empty;
            var applicationConfig = new MFConfiguration(Request.Url.Authority);
            var selectedconfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, Request["from"]);
            EFMembershipProvider.SetConfigSessionAttributes(selectedconfig, Request);
            EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[selectedconfig.appInstancename];
            MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
            var config = MFConfiguration.GetApplicationInstanceConfiguration();
            bool sameEmailMultipleAccountsUpdatePassword = config.sameEmailMultipleAccountsUpdatePassword;
            string token = Request["g"];
            var tokenInfo = Tokens.GetValidToken(token, PW_TOKEN_PURPOSE);
            if (tokenInfo == null)
            {
                error_message = base.FindTranslation("invalidToken");
                return false;
            }
            else
            {
                var user = (from u in context.Magic_Mmb_Users.Where(x => x.UserID == (int)tokenInfo["user_id"])
                            select u).FirstOrDefault();

                DateTime windowStart = Convert.ToDateTime(user.FailedPasswordAnswerAttemptWindowStart);
                DateTime windowEnd = windowStart.AddMinutes(member.PasswordAttemptWindow);

                if (DateTime.Now < windowEnd)
                {
                    if (!checkonly)
                    {
                        try
                        {
                            bool flag = false;
                            if (Boolean.TryParse(System.Configuration.ConfigurationManager.AppSettings["sendRecoveryMailIfBlocked"], out flag))
                            {
                                member.UnlockUser(user.Username);
                            }
                            string newpwd = member.ResetPassword(user.Username, null);
                            if (member.ValidateUser(user.Username, newpwd))
                            {
                                member.ChangePassword(user.Username, newpwd, chg_password.Text);
                                //SendNewPassword(user.Email,newpwd);
                                SendConfirmNewPassword(user.Email);
                                return true;
                            }
                        }
                        catch (Exception ex)
                        {
                            error_message = ex.Message;
                            MFLog.LogInFile(string.Format("Error in EFMemershipProvider during change password: {0}", ex.Message), MFLog.logtypes.ERROR);
                        }
                    }

                }
            }

            return false;
        }

        private void SendConfirmNewPassword(string email)
        {
            try
            {
                Mailer m = new Mailer();
                m.SetTo(email);
                m.LoadTemplateFromDb("SNDPWD", culture, true);


                if (m.Send())
                    message = base.FindTranslation("checkMails", "Mail sent. Please check your mail box.");
                else
                    message = base.FindTranslation("errorMail", "Error on sending mail.");
            }
            catch (Exception ex)
            {
                MFLog.LogInFile(string.Format("Error in sending mail: {0}", ex.Message), MFLog.logtypes.ERROR);
                throw;
            }

        }

        protected void but_submit_Click(object sender, EventArgs e)
        {
            string error_message = String.Empty;
            bool goBackToLogin = true;
            if (CheckValidChange(false, out error_message))
            {
                lbl_message.Text = base.FindTranslation("passwordchanged", "passwordchanged");
                lbl_message.Visible = true;
            }
            else
            {
                if (String.IsNullOrEmpty(error_message))
                    lbl_message.Text = base.FindTranslation("passwordnotchanged", "passwordnotchanged");
                else
                {//managed exception with a proper message stay there...
                    goBackToLogin = false;
                    lbl_message.Text = error_message;
                }

                lbl_message.CssClass = "failureNotification";
                lbl_message.Visible = true;
            }
            divmessage.Visible = true;

            //redirect to login page
            if (goBackToLogin)
                Response.AppendHeader("Refresh", "5;url=login");

        }
    }
}
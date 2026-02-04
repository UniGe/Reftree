using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace MagicSolution
{
    public partial class error : System.Web.UI.Page
    {
        public static readonly Dictionary<string, string> ERROR_MESSAGES = new Dictionary<string, string> {
            { "registrationNotOpenForThisApp", "registration not open for this app" },
            { "pwResetError", "Error while sending password reset mail. Default Credentials or mail body PWDREH missing." },
            { "publicSessionWebConfig", "please add a correct value for the key publicSession to the web config" },
            { "webConfigMembership", "please add the membership provider to the web config" },
            { "accessForbidden", "Utente non autorizzato all'accesso" },
            { "errorInitTestCulture", "Error initializing the test culture" },
            { "noQuestion", "Error: this  test does not contain any question." },
            { "noAppConfig", "app config not found" },
            { "emptyPassword", "Password empty" },
            { "emptyToken", "Token empty" },
            { "tokenNotFound", "Token not found" },
            { "userNotFound", "User not found" },
            { "userNotFoundMagicDB", "User not found in MagicDBConnection" },
            { "userNotFoundTargetDB", "User not found in TargetDBConnection" },
            { "TokenPositionOrIncoherent", "TokenPositionOrIncoherent" },
            { "TokenAlreadyUsed", "Token already used" },
            { "pwdiswrong", "Wrong password" },
            { "checkAppLog", "check app log (APPLog.tx) for error details" },
            { "serialEmpty", "serial number is null or empty!!!!" },
        };

        protected void Page_Load(object sender, EventArgs e)
        {
            if (!string.IsNullOrEmpty(Request["e"]))
            {
                if (Request["e"] == "l") {
                    lbl_error.Text = "Invalid licence";
                }
                else if (Request["e"] == "c")
                {
                    lbl_error.Text = "Problems in configuration file check APPLog.txt in log directory for further info";
                }
                else if(Request["e"] != null)
                {
                    string errorCode = Request["e"];
                    if (ERROR_MESSAGES.ContainsKey(errorCode))
                    {
                        lbl_error.Text = ERROR_MESSAGES[errorCode];
                    }
                    else
                    {
                        lbl_error.Text = "Invalid error code";
                    }
                }
           
            }

        }
    }
}
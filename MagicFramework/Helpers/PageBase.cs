using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Configuration;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Data.SqlClient;
using System.Data;
using System.Text;
using System.IO;
using MagicFramework.MemberShip;
using System.Diagnostics;

namespace MagicFramework.Helpers
{
    public class PageBase : System.Web.UI.Page
    {
        protected MFConfiguration.ApplicationInstanceConfiguration selectedconfig;

        protected void Page_PreRender(object sender, EventArgs e)
        {
            HtmlGenericControl h = (HtmlGenericControl)Page.Header.FindControl("Head1");
            if (h != null) {
                StringBuilder content = new StringBuilder();
                StringWriter sWriter = new StringWriter(content);
                HtmlTextWriter htmlWriter = new HtmlTextWriter(sWriter);
                h.RenderControl(htmlWriter);
                h.InnerHtml = Utils.HeaderReplace(content.ToString());
            }
        }

        protected void page_PreInit(object sender, EventArgs e)
        {
            SessionHandler.CheckAbortSessionAndRedirect();
            string masterpage;
            MFConfiguration applicationConfig = new MFConfiguration(Request.Url.Authority);
            selectedconfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, SessionHandler.ApplicationInstanceId);
            if (!string.IsNullOrWhiteSpace(selectedconfig.MasterPageMobile) && SessionHandler.IsMobile)
            {
                masterpage = selectedconfig.MasterPageMobile;
            }
            else
            {
                masterpage = ApplicationSettingsManager.GetMasterPage();
            }
            if (masterpage != "-1") //significa che la sessione e' down
            {
                Page p = this.Context.Handler as Page;
                if (p.MasterPageFile != null)
                    p.MasterPageFile = masterpage;
            }
        }

        protected override void OnLoad (EventArgs e)
        {
            if (!Helpers.License.CheckValidLicence())
            {
                Context.Server.Transfer("error.aspx?e=l");
                return;
            }

            if (!SessionHandler.CheckActiveSession())
            {
                MFLog.LogInFile("Session is not valid!!! Will abandon and redirect to login",MFLog.logtypes.WARN);
                HttpContext.Current.Session.Abandon();
                FormsAuthentication.RedirectToLoginPage();
                return;
            }
            
            var userIsOnCompleteProfileSite = false;
            if (selectedconfig.completeProfileInsideApplication)
            {
                if (Request.CurrentExecutionFilePath != "/Views/" + SessionHandler.CustomFolderName + "/individual_complete_profile.aspx" && Request.CurrentExecutionFilePath != "/complete_profile.aspx")
                {
                    if (SessionHandler.UserVisibilityGroup <= 0)
                    {
                        var queryString = Request.QueryString.ToString();
                        if (queryString != "")
                            queryString = "?" + queryString;
                        if (System.IO.File.Exists(Request.PhysicalApplicationPath + "Views/" + SessionHandler.CustomFolderName + "/individual_complete_profile.aspx"))
                            Context.Response.Redirect("/Views/" + SessionHandler.CustomFolderName + "/individual_complete_profile.aspx" + queryString);
                        else
                            Context.Response.Redirect("/complete_profile.aspx" + queryString);
                        return;
                    }
                }
                else if (Request.CurrentExecutionFilePath == "/complete_profile.aspx" && System.IO.File.Exists(Request.PhysicalApplicationPath + "Views/" + SessionHandler.CustomFolderName + "/individual_complete_profile.aspx"))
                {
                    var queryString = Request.QueryString.ToString();
                    if (queryString != "")
                        queryString = "?" + queryString;
                    Context.Response.Redirect("/Views/" + SessionHandler.CustomFolderName + "/individual_complete_profile.aspx" + queryString);
                }
                else
                    userIsOnCompleteProfileSite = true;
            }
            if(!userIsOnCompleteProfileSite && !SessionHandler.UserIsApproved && Request.CurrentExecutionFilePath != "/approve.aspx")
            {
                Context.Response.Redirect("/approve.aspx");
            }

            if (selectedconfig.userLicense.check)
            {
                if (!Request.CurrentExecutionFilePath.Contains(selectedconfig.userLicense.url))
                {
                    if (!Helpers.UserLicense.isValid(SessionHandler.IdUser) && selectedconfig.userLicense.isaCheckedUser(SessionHandler.IdUser) && !selectedconfig.userLicense.isaBypassedUrl(Request.CurrentExecutionFilePath))
                    {
                        //Se la licenza commerciale non è valida o non esiste, allora re-indirizza sulla pagina della licenza
                        Context.Response.Redirect(selectedconfig.userLicense.url);
                    }
                }

            }
            try
            {
                SessionHandler.UserPasswordHasExpired = false;
                if (SystemRightsChecker.isPasswordExpired())
                    SessionHandler.UserPasswordHasExpired = true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }

            base.OnLoad(e);          
        }

    }
}
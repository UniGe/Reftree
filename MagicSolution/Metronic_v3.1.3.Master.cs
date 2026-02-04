using System;
using System.Linq;
using System.Web;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using System.Web.Security;
using MagicFramework.Helpers;

namespace MagicSolution
{

    public partial class Metronic : System.Web.UI.MasterPage
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            try
            {
                this.templatecontainer.InnerHtml += new MagicFramework.Helpers.TemplateContainerBuilder().Filltemplatecontainer(Request.RawUrl); // Riempie il container dei template
            }
            catch
            {
                this.templatecontainer.InnerHtml += "";
            }
            #region applicationUISettings
            //Get config and session vars
            var loginnam = (LoginName)LoginView1.FindControl("LoginName1");
            string unametodisplay = HttpUtility.HtmlEncode(SessionHandler.UserFirstName) + " " + HttpUtility.HtmlEncode(SessionHandler.UserLastName);
            loginnam.FormatString = unametodisplay;
            MFConfiguration mfc = new MFConfiguration(HttpContext.Current.Request.Url.Authority);
            var allsettings = mfc.appSettings.listOfInstances.Where(x => x.id == SessionHandler.ApplicationInstanceId).FirstOrDefault();
            var uiEnvironment = mfc.setUpPageEnvironmentVars(allsettings);

            MagicFramework.Controllers.APPInstanceUIController.UISettings uis = uiEnvironment.UISettings;
            uis.id = SessionHandler.ApplicationInstanceId;

            //ClientScriptManager cs = Page.ClientScript;
            //cs.RegisterStartupScript(GetType(), "applicationUISettings", uiEnvironment.JSEnvironmentVars);

            HtmlImage img1 = (HtmlImage)LoginView1.FindControl("userselectedpic");
            HtmlControl img1wrapper = (HtmlControl)LoginView1.FindControl("userselectedpicwrapper");
            
            var usercontroller = new MagicFramework.Controllers.Magic_Mmb_UsersController();
            var userpic = usercontroller.GetUserPics();

            string useravatar = userpic.avatar;
            string symbol = userpic.symbol;

            //deactivate controls, manage pictures
            if (!string.IsNullOrEmpty(useravatar))
            {
                img1.Src = useravatar;
                img1.Style.Add("visibility", "hidden");
                img1wrapper.Style.Add("background-image", string.Format("url('{0}')", useravatar));
            }

            var changeusergroup = (HtmlControl)LoginView1.FindControl("changeusergroup");
            var changeappareli = (HtmlControl)LoginView1.FindControl("changeappareli");
            var areagroupchangedivider = (HtmlControl)LoginView1.FindControl("areagroupchangedivider");
            var userprofilelinkli = (HtmlControl)LoginView1.FindControl("userprofilelinkli");
            var maillinkli = (HtmlControl)LoginView1.FindControl("maillinkli");
            var schedulerlinkli = (HtmlControl)LoginView1.FindControl("schedulerlinkli");
    

            if (uis.showDashBoardOnMenu == false)
                InitialLi.Visible = false;
            if (uis.showChangeUserGroup == false)
                changeusergroup.Visible = false;
            if (uis.showChangeAppAreas == false)
                changeappareli.Visible = false;
            if (uis.showChangeUserGroup == false && uis.showChangeAppAreas == false)
                areagroupchangedivider.Visible = false;

            userprofilelinkli.Visible = !uis.hideUserProfile;
            schedulerlinkli.Visible = !uis.hideScheduler;
            maillinkli.Visible = false;

            if (!String.IsNullOrEmpty(uis.appRightTitle))
                logoDxInt.InnerText = uis.appRightTitle;
            if (!String.IsNullOrEmpty(uis.appLeftTitle))
                logoSxInt.InnerText = uis.appLeftTitle;

            dshb1m.HRef = uis.appMainURL;
            dshb2m.HRef = uis.appMainURL;
            dshb3m.HRef = uis.appMainURL;
            
            #endregion
        }

        /// <summary>
        /// Il path completo di parametri Querystring della funzione
        /// </summary>
        /// <returns>
        /// Url della funzione e parametri di Querystring
        /// </returns>
        private string GetFunctionPath(string FunctionBaseUrl, string FunctionQsParameters)
        {
            string pathcomplete = FunctionBaseUrl;
            if (!string.IsNullOrEmpty(FunctionQsParameters))
            {
                pathcomplete += "?" + FunctionQsParameters;
            }
            return pathcomplete;
        }

        /// <summary>
        /// La funzione corrente richiamata in Request
        /// </summary>  
        protected MagicFramework.Data.v_Magic_Mmb_UserFunctionRights GetCurrentFunction()
        {
            MagicFramework.Data.MagicDBDataContext context = new MagicFramework.Data.MagicDBDataContext();
            if (Request.QueryString["j"] != null)
            {
                var v = (from f in context.v_Magic_Mmb_UserFunctionRights.Where(x => x.User_ID == MagicFramework.Helpers.SessionHandler.IdUser)
                         .Where(x => x.FunctionQsParameters.Contains(Request.QueryString["j"]))
                         select f).FirstOrDefault();
                return v;
            }
            else
            {
                var v = (from f in context.v_Magic_Mmb_UserFunctionRights.Where(x => x.User_ID == MagicFramework.Helpers.SessionHandler.IdUser)
                          .Where(x => x.FunctionBaseUrl == Request.Path)
                         select f).FirstOrDefault();
                return v;
            }
        }

        protected void a_ServerClick(object sender, EventArgs e)
        {
            HtmlControl a = (HtmlControl)sender;
            MagicFramework.Helpers.SessionHandler.CurrentModule = Convert.ToInt32(a.ID.Split(new string[] { "_" }, StringSplitOptions.None).GetValue(1));
            Response.Redirect("/app");
        }


        //protected void LoginStatus1_LoggingOut(Object sender, System.Web.UI.WebControls.LoginCancelEventArgs e)
        protected void LoginStatus1_LoggingOut(Object sender, EventArgs e)
        {
            Session.Abandon();
            Response.Redirect(FormsAuthentication.LoginUrl);
        }
    }
}
using System;
using System.Linq;
using System.Web;
using System.Web.UI.HtmlControls;
using System.Configuration;
using MagicFramework.Helpers;

namespace MagicSolution
{

    public partial class Webarch : System.Web.UI.MasterPage
    {
        public string ServiceWorkerUrlPathPrefix = ConfigurationManager.AppSettings["ServiceWorkerUrlPathPrefix"];
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
            //encode for security reasons Xss prevention
            string unametodisplay = HttpUtility.HtmlEncode(SessionHandler.UserFirstName) + " " + HttpUtility.HtmlEncode(SessionHandler.UserLastName);
            LoginName1.FormatString = LoginName2.FormatString = unametodisplay;

            var applicationConfig = new MFConfiguration(Request.Url.Authority);
            var selectedconfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, SessionHandler.ApplicationInstanceId);
            if(!selectedconfig.completeProfileInsideApplication)
                profilecompleteness.Visible = false;

            #region applicationUISettings

            MFConfiguration mfc = new MFConfiguration(HttpContext.Current.Request.Url.Authority);
            var allsettings = mfc.appSettings.listOfInstances.Where(x => x.id == SessionHandler.ApplicationInstanceId).FirstOrDefault();
            var uiEnvironment = mfc.setUpPageEnvironmentVars(allsettings);

            MagicFramework.Controllers.APPInstanceUIController.UISettings uis = uiEnvironment.UISettings;
            uis.id = SessionHandler.ApplicationInstanceId;

            //ClientScriptManager cs = Page.ClientScript;
            //cs.RegisterStartupScript(GetType(), "applicationUISettings", uiEnvironment.JSEnvironmentVars);

            var usercontroller = new MagicFramework.Controllers.Magic_Mmb_UsersController();
            var userpic = usercontroller.GetUserPics();

            string useravatar = userpic.avatar;
            string symbol = userpic.symbol;
            HtmlImage userselectedpic = (HtmlImage)LoginView1.FindControl("userselectedpic");
            HtmlControl userselectedpicwrapper = (HtmlControl)LoginView1.FindControl("userselectedpicwrapper");

            //deactivate controls, manage pictures
            if (!string.IsNullOrEmpty(useravatar))
            {
                string prefixedAvatar = !string.IsNullOrEmpty(ServiceWorkerUrlPathPrefix) ? ServiceWorkerUrlPathPrefix + useravatar : useravatar;

                UpdateImageAttributes(userselectedpic, prefixedAvatar);
                UpdateImageAttributes(userselectedpicprof, prefixedAvatar);

                userselectedpicwrapper.Style.Add("background-image", string.Format("url('{0}')", prefixedAvatar));
                userselectedpicprofwrapper.Style.Add("background-image", string.Format("url('{0}')", prefixedAvatar));

            }

            if (uis.showDashBoardOnMenu == false)
                InitialLi.Visible = false;

            var changeusergroup = (HtmlControl)LoginView1.FindControl("changeusergroup");
            var changeappareli = (HtmlControl)LoginView1.FindControl("changeappareli");
            var areagroupchangedivider = (HtmlControl)LoginView1.FindControl("areagroupchangedivider");
            var filteroutervisibilityli = (HtmlControl)LoginView1.FindControl("filteroutervisibility");
            var userprofilelinkli = (HtmlControl)LoginView1.FindControl("userprofilelinkli");
            var maillinkli = (HtmlControl)LoginView1.FindControl("maillinkli");
            var schedulerlinkli = (HtmlControl)LoginView1.FindControl("schedulerlinkli");
            HtmlControl languagelinkli = LoginView1.FindControl("languageLinks") as HtmlControl;

            string isChatActive = ConfigurationManager.AppSettings["chatActive"];

            if (isChatActive == "false")
                chtoggler.Visible = false;

            if (uis.showChangeUserGroup == false)
                changeusergroup.Visible = false;

            if (uis.showChangeAppAreas == false)
                changeappareli.Visible = false;
            if (uis.showChangeUserGroup == false && uis.showChangeAppAreas == false)
                areagroupchangedivider.Visible = false;
            languagelinkli.Visible = !uis.hideLanguagesButton;

            userprofilelinkli.Visible = !uis.hideUserProfile;
            schedulerlinkli.Visible = !uis.hideScheduler;
            maillinkli.Visible = false;

            filteroutervisibilityli.Visible = uis.showFilterExternalGroup;

            if (uis.appLogo != null && uis.appLogo != "")
            {
                logo.Src = uis.appLogo;
                logo.Attributes.Add("data-src", uis.appLogo);
                logo.Attributes.Add("data-src-retina", uis.appLogo);
            }

            dshb1.HRef = uis.appMainURL;
            dshb2.HRef = uis.appMainURL;
            //dshb3.HRef = uis.appMainURL;


        #endregion
        }
        private void UpdateImageAttributes(HtmlImage image, string avatarUrl)
        {
            image.Src = avatarUrl;
            image.Style.Add("visibility", "hidden");
            image.Attributes.Add("data-src", avatarUrl);
            image.Attributes.Add("data-src-retina", avatarUrl);
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
            Response.Redirect("/login");
        }
    }
}
using MagicFramework.Data;
using MagicFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Newtonsoft.Json;

namespace MagicSolution
{
    public partial class complete_profile : MagicFramework.Helpers.PageBase
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        new protected void page_PreInit(object s, EventArgs e){
            if (Request.HttpMethod == "POST") {           
                try {
                    processPostRequest(s, e);
                }
                catch (Exception exc) {
                    sendResponse(new { action = "showMessage", message = "Errore interno del server, prego riprovare", details = exc.Message });
                    MFLog.LogInFile(exc);                    
                }
                Response.End();
            }
        }

        protected void sendResponse(dynamic data, int statusCode = 200)
        {
            Response.ClearContent();
            Response.ClearHeaders();
            Response.StatusCode = statusCode;
            Response.Write(JsonConvert.SerializeObject(data));            
        }

        protected void processPostRequest(object s, EventArgs e)
        {
            string redirectLink;

            int id = SessionHandler.IdUser;
            MagicFramework.Controllers.Magic_Mmb_UsersController uc = new MagicFramework.Controllers.Magic_Mmb_UsersController();
            var user = uc.Get(id);
            string email = user.FirstOrDefault().Email;
            var connectionString = DBConnectionManager.GetTargetEntityConnectionString();
            var context = new MagicDBEntities(connectionString);
            MFConfiguration applicationConfig = new MFConfiguration(Request.Url.Authority);
            MFConfiguration.ApplicationInstanceConfiguration selectedConfig = applicationConfig.GetApplicationInstanceByID(Request.Url.Authority, SessionHandler.ApplicationInstanceId);
            var d = new Dictionary<string, string>();
            string extendedInfo;
            if (!register.CompleteUserProfile(id, email, Request, context, out d, out extendedInfo)) {
                MFLog.LogInFile("complete_profile.processPostRequest error: " + extendedInfo, MFLog.logtypes.ERROR);
                sendResponse(new { action = "showMessage", message = extendedInfo });
                return;
            }

            //set some flag that profile is completed?
            register.SendWelcomeMail(email, d, selectedConfig);
            var pUser = context.Magic_Mmb_PendingRegistrations.Where(p => p.email == email).FirstOrDefault();
            string password = StringCipher.Decrypt(pUser.password, "asdfa9");
            pUser.password = "";
            context.SaveChanges();
            redirectLink = selectedConfig.appMainURL;
            login.Login(selectedConfig, email, password, false, "", Request, Response);

            sendResponse(new { action = "redirect", link = redirectLink });
            return;
            
        }


        }
}
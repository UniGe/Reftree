using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http.Filters;
using System.Web;
using System.Net.Http;
using System.Web.Http.Controllers;

namespace MagicFramework.Controllers.ActionFilters.Access
{
    public class RestricedToRedirectDomains : ActionFilterAttribute
    {
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            var config = new Helpers.MFConfiguration().GetAppSettings(actionContext.Request.RequestUri.Authority);
            if(config == null || config.Redirects == null || config.Redirects.Where(r => r.url.Contains(HttpContext.Current.Request.ServerVariables["REMOTE_HOST"])).FirstOrDefault() == null)
            {
                actionContext.Response = new HttpResponseMessage()
                {
                    StatusCode = System.Net.HttpStatusCode.Forbidden,
                    Content = new StringContent("Not authorized Origin")
                };
            }
        }
    }

    public class OnlyGlobalUserManagingApplication : ActionFilterAttribute
    {
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            string allowedApplication = System.Web.Configuration.WebConfigurationManager.AppSettings["globalUserManagingApplicationId"];
            if (allowedApplication != MagicFramework.Helpers.SessionHandler.ApplicationInstanceId)
            {
                actionContext.Response = new HttpResponseMessage()
                {
                    StatusCode = System.Net.HttpStatusCode.Forbidden,
                    Content = new StringContent("Not global-user-managing application")
                };
            }
        }
    }
}

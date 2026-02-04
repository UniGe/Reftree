using MagicFramework.Helpers;
using MagicFramework.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;

namespace MagicFramework.Controllers.ActionFilters.Access
{
    public class ValidToken : ActionFilterAttribute
    {
        public const int DEFAULT_TOKEN_VALIDITY_DAYS = 1;
        public string TokenPurpose { get; set; } = "DefaultValidToken";
        public int TokenValidForXDays { get; set; } = DEFAULT_TOKEN_VALIDITY_DAYS;
        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            string instanceName = null;
            try
            {
                instanceName = actionContext.Request.GetQueryNameValuePairs().Where(p => p.Key == "instanceName").FirstOrDefault().Value;
            }
            catch
            {
                actionContext.Response = ResponseHelper.Error("no clientName in url query-segment provided", System.Net.HttpStatusCode.Unauthorized, true);
                return;
            }

            try
            {
                SetSessionData(instanceName);
            }
            catch (Exception e)
            {
                actionContext.Response = ResponseHelper.Error(e, System.Net.HttpStatusCode.Unauthorized, true);
                return;
            }

            var authHeader = actionContext.Request.Headers.Authorization;

            if (authHeader == null || string.IsNullOrEmpty(authHeader.Parameter))
            {
                actionContext.Response = ResponseHelper.Error("no Authorization header provided", System.Net.HttpStatusCode.Unauthorized, true);
                return;
            }

            var token = Tokens.GetValidToken(authHeader.Parameter, $"AuthToken{TokenPurpose}");

            if (token == null)
            {
                actionContext.Response = ResponseHelper.Error("invalid token", System.Net.HttpStatusCode.Unauthorized, true);
            }
        }

        public static void SetSessionData(string instanceName)
        {
            var config = new MagicFramework.Helpers.MFConfiguration(HttpContext.Current.Request.Url.Authority);
            var instanceConfig = config.appSettings.listOfInstances.Where(i => i.appInstancename.Equals(instanceName)).FirstOrDefault();
            if (instanceConfig != null)
            {
                SessionHandler.ApplicationInstanceId = instanceConfig.id;
                return;
            }
            throw new Exception("was not able to find appInstancename.Equals(instanceName) " + instanceName);
        }
    }
}
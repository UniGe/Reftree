using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http.Filters;
using System.Web;
using System.Net.Http;
using System.Web.Http.Controllers;

namespace MagicFramework.Controllers.ActionFilters
{

    public abstract class RateLimitBase : ActionFilterAttribute
    {
        public void Limit(HttpActionContext actionContext, string cacheKey, int maxRequests, int perSeconds)
        {
            var config = Helpers.MFConfiguration.GetApplicationInstanceConfiguration();
            if (config.EnableRateLimits)
            {
                var valid = Helpers.CacheHandler.Increment(cacheKey, perSeconds);
                if (valid.Counter > maxRequests)
                {
                    actionContext.Response = new HttpResponseMessage()
                    {
                        StatusCode = (System.Net.HttpStatusCode)429,
                        Content = new StringContent($"Too Many Requests - retry after {valid.ValidUntil}")
                    };
                }
            }
        }

        public string BaseKey(HttpActionContext actionContext)
        {
            return "sessionRateLimit" + Helpers.CacheHandler.AuthorityApplicationInstanceKeyPrefix()
                    + actionContext.ActionDescriptor.ControllerDescriptor.ControllerName
                    + actionContext.ActionDescriptor.ActionName;
        }
    }

    public class RateLimitUserSession : RateLimitBase
    {
        public int MaxRequest { get; set; }
        public int PerSeconds { get; set; }

        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            string cacheKey = BaseKey(actionContext)
                    + HttpContext.Current.Session.SessionID;
            Limit(actionContext, cacheKey, MaxRequest, PerSeconds);
        }
    }

    public class RateLimitIP : RateLimitBase
    {
        public int MaxRequest { get; set; }
        public int PerSeconds { get; set; }

        public string InstanceIDParam { get; set; }

        public override void OnActionExecuting(HttpActionContext actionContext)
        {
            System.Web.HttpContext context = System.Web.HttpContext.Current;
            string ipAddress = context.Request.ServerVariables["HTTP_X_FORWARDED_FOR"];

            if (!string.IsNullOrEmpty(ipAddress))
            {
                string[] addresses = ipAddress.Split(',');
                if (addresses.Length != 0)
                {
                    ipAddress = addresses[0];
                }
            }
            if (string.IsNullOrEmpty(ipAddress))
            {
                ipAddress = context.Request.ServerVariables["REMOTE_ADDR"];
            }

            if (InstanceIDParam != null)
            {
                Helpers.SessionHandler.ApplicationInstanceId = HttpContext.Current.Request.Params[InstanceIDParam];
            }
            string cacheKey = BaseKey(actionContext)
                    + ipAddress;
            Limit(actionContext, cacheKey, MaxRequest, PerSeconds);
        }
    }
}
using MagicFramework.Helpers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web;
using System.Web.Http.Filters;

namespace MagicFramework.Controllers.ActionFilters
{
    public class ExceptionFilter : ExceptionFilterAttribute
    {
        private readonly string[] MODEL_RESPONSE_ENDPOINTS =
        {
            "/select",
            "/getwithfilter",
            "/selectfromxmlstoredprocedure",
            "/posti"
        };

        public override void OnException(HttpActionExecutedContext actionContext)
        {
            string content;
            if (SessionHandler.UserIsDeveloper)
            {
                content = actionContext.Exception.Message;
            }
            else
            {
                var isManaged = GenericSqlCommandController.IsManagedException(actionContext.Exception, out content);
                if (!isManaged)
                {
                    MFLog.LogInFile(actionContext.Exception);
                    content = "An error occured, please contact the system admin to check the logs.";
                }
            }
            content = GetContenValueJSON(content);
            try
            {
                string URLPath = actionContext.Request.RequestUri.AbsolutePath.ToLower();
                if (MODEL_RESPONSE_ENDPOINTS.Where(p => URLPath.Contains(p)).FirstOrDefault() != null)
                {
                    content = GetContenValueJSON(content);
                    content = Newtonsoft.Json.JsonConvert.SerializeObject(new Models.Response(content));
                }
            }
            catch { }
            actionContext.Response = new HttpResponseMessage()
            {
                StatusCode = System.Net.HttpStatusCode.BadRequest,
                Content = new StringContent(content)
            };
        }

        private string GetContenValueJSON(string content)
        {
            if (!string.IsNullOrEmpty(content) && content.StartsWith("{"))
            {
                try
                {
                    JObject o = JObject.Parse(content);
                    if (o["content"] != null)
                    {
                        content = (string)o["content"];
                    }
                }
                catch { }
            }
            return content;
        }
    }
}
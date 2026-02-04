using MagicFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http.Filters;

namespace MagicFramework.MemberShip.Filters
{
    public class UnmanagedExceptionPostProcess : ExceptionFilterAttribute
    {
        

        /// <summary>
        /// Manages Unhandled exceptions for controllers. If the user is a developer the message is returned as it is to the caller, otherwise it's logged to file and 
        /// returned as a generic "Error".
        /// </summary>
        /// <param name="context"></param>
        public override void OnException(HttpActionExecutedContext context)
        {
            string endUserErrorMessage = "An error has occured";
            string errorMessage = context.Exception.Message;
            string retError = endUserErrorMessage;
            if (!SessionHandler.UserIsDeveloper)
                MFLog.LogInFile(errorMessage, MFLog.logtypes.ERROR);
            else
                retError = errorMessage;
            context.Response = new HttpResponseMessage(HttpStatusCode.BadRequest);
            context.Response.Content = new StringContent(retError);

        }

        
    
    }
}
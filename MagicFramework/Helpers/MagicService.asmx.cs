using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Script.Services;
using System.Web.Services;
using Newtonsoft.Json.Linq;

namespace MagicFramework.Helpers
{
    /// <summary>
    /// Summary description for MagicService
    /// </summary>
    [WebService(Namespace = "http://microsoft.com/webservices/")]
    [WebServiceBinding(ConformsTo = WsiProfiles.BasicProfile1_1)]
    //[System.ComponentModel.ToolboxItem(false)]
    // To allow this Web Service to be called from script, using ASP.NET AJAX, uncomment the following line. 
    [System.Web.Script.Services.ScriptService]
    public class MagicService : System.Web.Services.WebService
    {   
        //[WebMethod(EnableSession = true)]
        //public void setSessionUserVisibilityGroup(int id)
        //{
        //    MagicFramework.Helpers.SessionHandler.UserVisibilityGroup = id;            
        //}                 
    }
}

using System;
using System.Web;
using System.Web.Configuration;
using System.Web.SessionState;


namespace MagicFramework.MemberShip
{ 
/// <summary>
/// HttpModule to verify that only subscribers can view resources.
/// Because of an asp buglet, HttpModules and subfolders (web.config location) doesn't work
/// so the authorization stuff uses an appsetting to check Request.Path for the subfolder.
/// </summary>
    public class SubscriptionModule : IHttpModule
{
    #region IHttpModule Members

    ///<summary>
    ///Initializes a module and prepares it to handle requests.
    ///</summary>
    ///<param name="context">An <see cref="T:System.Web.HttpApplication"></see> that provides access to the methods, properties, and events common to all application objects within an ASP.NET application </param>
    public void Init(HttpApplication context)
    {
        //if the handler doesn't have session, swap in a temp handler that does have session
        context.PostMapRequestHandler += PostMapRequestHandler;
        //swap out the temp handler if we used it
        context.PostAcquireRequestState += PostAcquireRequestState;
        //the authorization code, using session
        context.PreRequestHandlerExecute += context_PreRequestHandlerExecute;
    }

    private static void PostMapRequestHandler(object sender, EventArgs e)
    {
        HttpContext context = ((HttpApplication)sender).Context;
        //don't care about images
        if (!IsRestrictedFolder(context.Request)) return;
        // no need to replace the current handler
        if (context.Handler is IReadOnlySessionState || context.Handler is IRequiresSessionState)
            return;
        // swap the current handler
        context.Handler = new MyHttpHandler(context.Handler);
    }

    private static void PostAcquireRequestState(object sender, EventArgs e)
    {
        HttpContext context = ((HttpApplication)sender).Context;
        MyHttpHandler resourceHttpHandler = context.Handler as MyHttpHandler;
        if (resourceHttpHandler != null)
            // set the original handler back
            context.Handler = resourceHttpHandler.OriginalHandler;
    }

    static void context_PreRequestHandlerExecute(object sender, EventArgs e)
    {
        HttpContext context = ((HttpApplication)sender).Context;
        if (!IsRestrictedFolder(context.Request)) return;

        //if they are not subscribed, redirect to login
        //if (!SessionManager.IsSubscribed())
        if (context.Session == null)
            context.Response.Redirect("~/login");
    }

    private static bool IsRestrictedFolder(HttpRequest request)
    {
        //if Request Path subfolder (after application path) is our restricted folder
        string dir = string.Format("{0}/{1}", request.ApplicationPath, WebConfigurationManager.AppSettings["subFolders"]);        
        return request.Path.StartsWith(dir, StringComparison.OrdinalIgnoreCase);      
    }

    ///<summary>
    ///Disposes of the resources (other than memory) used by the module that implements <see cref="T:System.Web.IHttpModule"></see>.
    ///</summary>
    public void Dispose()
    {
    }

    #endregion

    /// <summary>
    /// Temp handler used to force the SessionStateModule to load session state.
    /// From Tomasz Jastrzebski http://forums.asp.net/p/1098574/1664675.aspx
    /// </summary>
    public class MyHttpHandler : IHttpHandler, IReadOnlySessionState
    {
        internal readonly IHttpHandler OriginalHandler;

        public MyHttpHandler(IHttpHandler originalHandler)
        {
            OriginalHandler = originalHandler;
        }

        public void ProcessRequest(HttpContext context)
        {
            // do not worry, ProcessRequest() will not be called, but let's be safe
            throw new InvalidOperationException("MyHttpHandler cannot process requests.");
        }

        public bool IsReusable // IsReusable must be set to false since class has a member!
        {
            get { return false; }
        }
    }
}
}
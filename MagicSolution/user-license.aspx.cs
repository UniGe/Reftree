using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.IO;
using MagicFramework.Helpers;

namespace MagicSolution
{
    public partial class user_license : MagicFramework.Helpers.PageBase
    {
        private string basePath;
        protected void Page_Load(object sender, EventArgs e)
        {
            basePath = Utils.GetBasePath();
            string path = basePath + @"Views\" + SessionHandler.CustomFolderName + @"\Templates\Directives\";
            string HtmlUrl = selectedconfig.userLicense.template;

            if (!string.IsNullOrEmpty(HtmlUrl) && File.Exists(Path.Combine(path, HtmlUrl)))
                licContainer.InnerHtml = File.ReadAllText(Path.Combine(path, HtmlUrl));
            else
                Context.Response.Redirect(selectedconfig.appMainURL);
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;

namespace MagicSolution.Views._3
{
    public partial class publicCdp : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            if (!login.LoginPublicUser(Request, Response))
                Response.Redirect("/error.aspx?e=accessForbidden");
        }
    }
}
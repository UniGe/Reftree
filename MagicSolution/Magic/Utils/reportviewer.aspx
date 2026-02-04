<%@ Page Language="C#" Culture="it-IT" %>
<%@ Import Namespace="Microsoft.Reporting.WebForms" %>
<%@ Import Namespace="System.Collections.Generic" %>
<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="System.Data" %>
<script runat="server">
    
    /* modifica del web.config	
     <httpHandlers>
      <add path="Reserved.ReportViewerWebControl.axd" verb="*" type="Microsoft.Reporting.WebForms.HttpHandler, Microsoft.ReportViewer.WebForms, Version=8.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a"
         validate="false" />
    </httpHandlers> 
     */ 
    public string ServerURL
    {
        get
        {
            return "http://" + @ConfigurationManager.AppSettings["reportserver"] + @"/ReportServer/";
        }
    }
    public string ReportPath
    {
        get
        {
            string ret = (Request["report"]);
            return @ret;
        }
    }
  
        
    protected void Page_Init(object sender, EventArgs e)
    {

        if (!Page.IsPostBack)
        {
            ReportViewer1.Visible = true;
            error.Visible = !ReportViewer1.Visible;
            try
            {

                if (true) //Server
                {
                    loadServerReport();
                }
                //else //Local
                //{
                //    loadLocalReport();
                //}
            }
            catch (Exception ex)
            {
                ReportViewer1.Visible = false;
                error.Visible = !ReportViewer1.Visible;
                
                error.Text = "<pre>" + ex.Message + "\n\r" + ex.StackTrace + "</pre>"; 
            }
           

           
        }
        
    }

    protected void Page_Load(object sender, EventArgs e)
    {   
        if(ReportViewer1.Visible && !string.IsNullOrEmpty(Request["format"]))
        {
            ExportFormat(Request["format"]);
        }
    }

    protected List<ReportParameter> loadParameter()
    {
        List<ReportParameter> list = new List<ReportParameter>();
        NameValueCollection col = Request.QueryString;
        foreach (string myKey in col.AllKeys)
        {
            if (
                myKey.ToLower() != "report"
                && myKey.ToLower() != "format"
                && myKey != ".ASPXAUTH"
                && myKey.ToLower() != "fc"
                && myKey.ToLower() != "adduser"
				&& myKey.ToLower() != "tree"
                )
            {

                foreach (string myValue in col.GetValues(myKey))
                {
                    //la key removeugvi serve per disabilitare l'  aggiunta automatica del UserGroupVisibility_ID
                    if (myKey != "removeugvi" && myKey!="adduserID")
                    {
                        ReportParameter param = new ReportParameter();
                        param.Name = myKey;
                        param.Values.Add(myValue);
                        list.Add(param);
                    }
                }
            }
        }

        if (Request.QueryString["adduser"] != null)
        {
            string addUser = Request.QueryString["adduser"];
            if (addUser == "true")
            {
                ReportParameter param = new ReportParameter();
                //param.Name = "idUser";
				param.Name = "ugvi";
                //param.Values.Add(SessionVars.UserApplicationID.ToString());
				param.Values.Add(1.ToString());
                param.Visible = true;
                list.Add(param);
            }
        }
	    if (Request.QueryString["adduserID"] != null)
        {
            
                ReportParameter param = new ReportParameter();
                param.Name = "idUser";
				//param.Name = "ugvi";
                param.Values.Add(MagicFramework.Helpers.SessionHandler.IdUser.ToString());
				//param.Values.Add(1.ToString());
                param.Visible = true;
                list.Add(param);
            
        }
        //la key removeugvi serve per disabilitare l'  aggiunta automatica del UserGroupVisibility_ID. Se non c'e' procedo con l' aggiunta del parametro 
        if (Request.QueryString["removeugvi"] == null)
        {
            // setto parametro di visibilità parziale del dato fisso
            ReportParameter visibilityparam = new ReportParameter();
            visibilityparam.Name = "ugvi";
            visibilityparam.Values.Add(MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString());
            visibilityparam.Visible = true;
            list.Add(visibilityparam);        
        }
        return list;
         
    }

    protected void loadServerReport()
    {
        List<ReportParameter> list = loadParameter();
        ReportViewer1.ProcessingMode = ProcessingMode.Remote;
        ReportViewer1.ServerReport.ReportServerUrl = new Uri(ServerURL);
        ReportViewer1.ServerReport.ReportPath = ReportPath;

        if(!string.IsNullOrEmpty(ConfigurationManager.AppSettings["reportuser"]))
            ReportViewer1.ServerReport.ReportServerCredentials = new CustomReportCredentials();
        
        
        if (list.Count > 0)
            ReportViewer1.ServerReport.SetParameters(list);
    }

    protected void ExportFormat(string format)
    {
        string encoding;
        string mimeType;
        Warning[] warnings;
        string[] streamIds;
        string fileNameExtension; //"." + format;
        //string fileName = AdHoc.Web.SessionState.DocumentGenerator.PrefixDateTimeFileName() + "report" + fileNameExtension;
        //string path = SessionVars.ConfigTargetSettings.dbDocPath + @"\" + fileName ;
        //string fileName = fileNameExtension;
        //string path = "C:\\Temp";

        byte[] data = ReportViewer1.ServerReport.Render(format, "", out mimeType, out encoding, out fileNameExtension, out streamIds, out warnings);

        Response.Clear();
        System.IO.MemoryStream ms = new System.IO.MemoryStream(data);
        Response.ContentType = "application/octet-stream";
        string fileName = "Document." + fileNameExtension;
        Response.AddHeader("content-disposition", "attachment;filename="+ fileName);
        Response.Buffer = true;
        ms.WriteTo(Response.OutputStream);
        Response.End();
        
        //System.IO.File.WriteAllBytes(path, data);
        //AdHoc.Web.SessionState.DocumentGenerator.AttachToWeb(Page, path, fileName);         
    }

    

	[Serializable]
    public class CustomReportCredentials : Microsoft.Reporting.WebForms.IReportServerCredentials
    {

        #region IReportServerCredentials Members
        
        public System.Security.Principal.WindowsIdentity ImpersonationUser
        {
            get
            {
                return null;  // not use ImpersonationUser
            }
        }
        public System.Net.ICredentials NetworkCredentials
        {
            get
            {
                System.Net.NetworkCredential reportCredentials = null;
                try
                {
                    string reportuser = ConfigurationManager.AppSettings["reportuser"];
                    string reportpassword = ConfigurationManager.AppSettings["reportpassword"];
                    string reportdomain = ConfigurationManager.AppSettings["reportdomain"];
                    if (!string.IsNullOrEmpty(reportuser))
                        reportCredentials = new System.Net.NetworkCredential(reportuser, reportpassword, reportdomain);

                }
                catch { }

                return reportCredentials;

            }
        }       

        public bool GetFormsCredentials(out System.Net.Cookie authCookie, out string userName, out string password, out string authority)
        {
            authCookie = null;
            userName = password = authority = null;
            return false;
        }
      

        #endregion
    }
    
</script>


<div >
<form id="form1" runat="server">
    <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>
    <asp:Label ID="error" runat="server"  Font-Size="Medium"  Text=""></asp:Label>
    <rsweb:ReportViewer ID="ReportViewer1" runat="server" width="100%" height="600px" Font-Names="Verdana" Font-Size="8pt"  >
    </rsweb:ReportViewer>
</form>
</div>











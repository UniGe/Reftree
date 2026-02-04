using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using Microsoft.Reporting.WebForms;

namespace MagicSolution.Helpers
{
    public partial class DownloadReport : System.Web.UI.Page
    {

        

        protected void Page_Load(object sender, EventArgs e)
        {
            string report = Request["report"].ToString();
            string format = Request["format"].ToString();
            downloadreport(report, format, GetParameter());        
        }

        protected List<ReportParameter> GetParameter() {
            List<ReportParameter> list = new List<ReportParameter>();
            NameValueCollection col = Request.QueryString;
            foreach (string myKey in col.AllKeys)
            {
                if (
                    myKey.ToLower() != "report"
                    && myKey.ToLower() != "format"
                    && myKey != ".ASPXAUTH"
                    && myKey.ToLower() != "ugvi"
                    )
                {
                    foreach (string myValue in col.GetValues(myKey))
                    {
                        //la key removeugvi serve per disabilitare l'  aggiunta automatica del UserGroupVisibility_ID
                        if (myKey != "removeugvi")
                        {
                            ReportParameter param = new ReportParameter();
                            param.Name = myKey;
                            param.Values.Add(myValue);
                            list.Add(param);
                        }
                    }
                    
                }
            }

            // setto parametro di visibilità parziale del dato fisso
                    //la key removeugvi serve per disabilitare l'  aggiunta automatica del UserGroupVisibility_ID. Se non c'e' procedo con l' aggiunta del parametro 
            if (Request.QueryString["removeugvi"] == null)
            {
                ReportParameter visibilityparam = new ReportParameter();
                visibilityparam.Name = "ugvi";
                visibilityparam.Values.Add(MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString());
                visibilityparam.Visible = true;
                list.Add(visibilityparam);
            }
            return list;
        }

        protected void downloadreport(string nome, string format,List<ReportParameter> list ) {
            Helpers.ReportServiceWrapper rs = new Helpers.ReportServiceWrapper(nome, format, list);
            HttpContext.Current.Response.SetCookie(new HttpCookie("fileDownload", "true") { Path = "/" });

            byte[] downloadBytes = rs.Output;
            System.Web.HttpResponse response = System.Web.HttpContext.Current.Response;
            response.Clear();
            response.ContentType = "application/octet-stream";
            response.AddHeader("Content-Disposition", "attachment; filename=filename."+ (String.IsNullOrEmpty(rs.Extension) ? format : rs.Extension) +"; size=" + downloadBytes.Length.ToString());
            //response.Flush();
            response.BinaryWrite(downloadBytes);
            //Document Management
                string boid = String.Empty;
                string botype = String.Empty;
                string doctype = String.Empty; 
                string tags = String.Empty;
                
                foreach (var l in list)
                {  
                    if (l.Name.Equals("docmngmnt_businessobjectId"))
                        boid = l.Values[0];
                    else
                    if (l.Name.Equals("docmngmnt_businessobjecttype"))
                        botype = l.Values[0];
                    else 
                       if (l.Name.Equals("docmngmnt_businessobjecttags"))
                        tags = l.Values[0];
                       else
                           if (l.Name.Equals("docmngmnt_documenttype"))
                               doctype = l.Values[0]; 
                        
                }
                if (boid != String.Empty)
                {
                    MagicFramework.Helpers.DocumentTraceManager dtm = new MagicFramework.Helpers.DocumentTraceManager(format,downloadBytes,boid, botype, doctype, tags);
                    dtm.WriteToTable();
                }

            
            //response.Flush();
            response.End();
        
        }

        protected void ManageReportDocument(string nome, string format, List<ReportParameter> list)
        { 
            
        
        }
    }
}
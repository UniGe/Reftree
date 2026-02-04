using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Web;
using System.Configuration;
using Microsoft.Reporting.WebForms;
using System.Net;
using MagicFramework.Helpers;
using System.IO;

namespace MagicSolution.Helpers
{
    public class ReportServiceWrapper
    {

        public string ServerURL
        {
            get
            {
                return "http://" + ApplicationSettingsManager.GetReportServer() + ApplicationSettingsManager.GetReportServerInstance();
            }
        }

        public string ReportName { get; set; }
        public string Format { get; set; }
        public string Extension { get; set; }
        public byte[] Output { get; set; }

        ReportViewer ReportViewer1 = new ReportViewer();

        public string  completeWithSubFolder(string reportname)
        {
            string folder = ApplicationSettingsManager.GetReportFolder();
            if (!String.IsNullOrEmpty(folder))
            {
                folder = folder.TrimStart('/');
                folder = folder.TrimEnd('/');
                folder = Utils.SurroundWith(folder, "/", "/");
                reportname = reportname.TrimStart('/');
            }
            return folder + reportname;
        }
        public ReportServiceWrapper(string reportName, string format, List<ReportParameter> list)
        {
            this.ReportName = completeWithSubFolder(reportName);
            this.Format = format;
            loadServerReport(list);

            if (format != null) {
                ExportFormat(format);            
            }

            
            
        }
        protected void loadServerReport(List<ReportParameter> list)
        {
            //List<ReportParameter> list = loadParameter();
            ReportViewer1.ProcessingMode = ProcessingMode.Remote;
            ReportViewer1.ServerReport.ReportServerUrl = new Uri(ServerURL);
            ReportViewer1.ServerReport.ReportPath = ReportName;

            if (!string.IsNullOrEmpty(ApplicationSettingsManager.GetReportUser()))
                ReportViewer1.ServerReport.ReportServerCredentials = new CustomReportCredentials();

            //Escludo dal report i parametri relativi alla gestione documentale
            List<ReportParameter> listtoprocess = new List<ReportParameter>();
            foreach (var l in list)
            {
                // se parametri multipli, gestisco la chiamata con multiple params
                if (l.Values[0].IndexOf(",") != -1)
                {
                    ReportParameter p = new ReportParameter(l.Name);
                    string[] pars = l.Values[0].Split(',');
                    p.Values.AddRange(pars);
                    listtoprocess.Add(p);
                    continue;
                }


                if (!l.Name.Contains("docmngmnt_"))
                    listtoprocess.Add(l);                     
            }

            

            if (listtoprocess.Count > 0)
                ReportViewer1.ServerReport.SetParameters(listtoprocess);
        }

        protected void ExportFormat(string format)
        {
            string encoding;
            string mimeType;
            Warning[] warnings;
            string[] streamIds;
            string extension;
            //string fileNameExtension = "." + format;
            //string fileName = fileNameExtension;
            //string path = "C:\\Temp";
            
            try
            {
                //formats: XML, NULL, CSV, IMAGE, PDF, HTML4.0, HTML3.2, MHTML, EXCEL
                Output = ReportViewer1.ServerReport.Render(format, "", out mimeType, out encoding, out extension, out streamIds, out warnings);
                this.Extension = extension;
            }
            catch (Exception)
            {                
                throw;
            }
     
        }         

        public sealed class CustomReportCredentials : IReportServerCredentials
        {
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
                        string reportuser = ApplicationSettingsManager.GetReportUser();
                        string reportpassword = ApplicationSettingsManager.GetReportPassword();
                        string reportdomain = ApplicationSettingsManager.GetReportDomain();
                        if (!string.IsNullOrEmpty(reportuser))
                            reportCredentials = new System.Net.NetworkCredential(reportuser, reportpassword, reportdomain);

                    }
                    catch { }

                    return reportCredentials;

                }
            }

            public bool GetFormsCredentials(out Cookie authCookie,
               out string userName, out string password,
               out string authority)
            {
                authCookie = null;
                userName = null;
                password = null;
                authority = null;

                // Not using form credentials
                return false;
            }
        }

    }

}
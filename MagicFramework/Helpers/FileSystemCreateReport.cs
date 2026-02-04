using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Web;
using Microsoft.Reporting.WebForms;

namespace MagicFramework.Helpers
{
    public class FileSystemCreateReport
    {
        public string FilePath { get; set; }
        public bool UseMSSQLFileTable { get; set; }

        public FileSystemCreateReport(string format, string report, List<KeyValuePair<string, string>> pars, string path, string filename, bool addUserGroupVisibilityCondition)
        {
            UseMSSQLFileTable = ApplicationSettingsManager.getMSSQLFileTable();
            string workingpath = path;

            if (!UseMSSQLFileTable)
            {
                string root = MagicFramework.Helpers.Utils.retcompletepath(ApplicationSettingsManager.GetRootdirforupload() ?? HttpContext.Current.Server.MapPath("~"));
                workingpath = Path.Combine(root, path);
            }

            createReportInServerFileSystem(format, report, GetParameter(pars, addUserGroupVisibilityCondition), workingpath, filename);
        }
        public void createReportInServerFileSystem(string format, string report, List<ReportParameter> list, string workingpath, string filename)
        {
            
            Helpers.ReportServiceWrapper rs = new Helpers.ReportServiceWrapper(report, format, list);
            
            byte[] downloadBytes = rs.Output;
            string filepath = Path.Combine(workingpath, filename + "." + (String.IsNullOrEmpty(rs.Extension) ?  format : rs.Extension));

            if(UseMSSQLFileTable)
            {
                Controllers.MAGIC_SAVEFILEController.SaveFileInDBTable(new MemoryStream(downloadBytes), filepath);
            }
            else
            {
                DirectoryInfo di = Directory.CreateDirectory(workingpath);
                File.WriteAllBytes(filepath, downloadBytes);
            }

            this.FilePath = filepath;
            #region Document Management
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
                MagicFramework.Helpers.DocumentTraceManager dtm = new MagicFramework.Helpers.DocumentTraceManager(format, downloadBytes, boid, botype, doctype, tags);
                dtm.WriteToTable();
            }
        #endregion

        }

        protected List<ReportParameter> GetParameter(List<KeyValuePair<string,string>> pars,bool addUserGroupVisibilityCondition)
        {
            List<ReportParameter> list = new List<ReportParameter>();
            
            foreach (var par in pars)
            {
                string myKey = par.Key;

                string value = par.Value;

                if (
                    myKey.ToLower() != "report"
                    && myKey.ToLower() != "format"
                    && myKey != ".ASPXAUTH"
                    && myKey.ToLower() != "ugvi"
                    )
                   {

                        ReportParameter param = new ReportParameter();
                        param.Name = myKey;
                        param.Values.Add(value);
                        list.Add(param);

                    }
                
            }

            if (addUserGroupVisibilityCondition)
            {
                ReportParameter visibilityparam = new ReportParameter();
                visibilityparam.Name = "ugvi";
                visibilityparam.Values.Add(MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString());
                visibilityparam.Visible = true;
                list.Add(visibilityparam);
            }
            return list;
        }

    }
}
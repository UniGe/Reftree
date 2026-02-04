using MagicFramework.Helpers;
using MagicFramework.Models;
using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Web;

namespace Ref3.Helpers
{

    public class IAMDatabaseCommandUtils
    {
        public string connection { get; set; }
        public IAMDatabaseCommandUtils(string name)
        {
            this.connection = ConfigurationManager.ConnectionStrings[name].ConnectionString;
        }

        public DataSet GetDataSet(string sqlCommand)
        {
            DataSet ds = new DataSet();

            using (SqlConnection conn = new SqlConnection(this.connection))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Connection.Open();
                    DataTable table = new DataTable();
                    table.Load(cmd.ExecuteReader());
                    ds.Tables.Add(table);
                    cmd.Connection.Close();
                }
            }

            return ds;
        }

        public bool executeSP(string storedprocedure, string data)
        {

            bool bReturn = false;

            using (SqlConnection con = new SqlConnection(this.connection))
            {
                using (SqlCommand cmd = new SqlCommand(storedprocedure, con))
                {
                    cmd.CommandType = CommandType.StoredProcedure;

                    cmd.Parameters.Add("@data", SqlDbType.NVarChar).Value = data;
                    SqlParameter result = cmd.Parameters.Add("@result", SqlDbType.Bit);
                    result.Direction = ParameterDirection.Output;

                    con.Open();

                    cmd.ExecuteNonQuery();

                    bReturn = Convert.ToBoolean(result.Value.ToString());

                    if (con.State == ConnectionState.Open) {
                        con.Close();
                    }
                }
            }

            return bReturn;
        }
    }
    public class IAM_Manager
    {

        public string UserName { get; set; }
        const string ServerVariablesDumpLog = "ServerVariablesIAMlog.txt";
        public string Authority { get; set; }
        /// <summary>
        /// ctor which gets username from server vars
        /// </summary>
        /// <param name="usernameVars">if specified looks for username in the given order, if null the value will be read in HTTP_USERID</param>
        /// <param name="deb">debug mode</param>
        public IAM_Manager(string[] usernameVars,bool deb = false) {

            if (deb)
            {
                this.DumpAllServerVariables();
            }


            if (usernameVars == null)
                this.UserName = this.getUserName();
            else
            {
                foreach (var unameVar in usernameVars) {
                    string uname = this.getUserName(unameVar);
                    if (!String.IsNullOrEmpty(uname))
                    {
                        this.UserName = uname;
                        break;
                    }
                }
            }
            if (String.IsNullOrEmpty(this.UserName))
                throw new System.ArgumentException("CTOR::Username not found");
        }

        public void DumpAllServerVariables() {
            try
            {
                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog), DateTime.Now.ToLongTimeString() +"DUMPING SERVER VARS BEGIN" + Environment.NewLine);
                
                var coll = HttpContext.Current.Request.ServerVariables;
                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog), "KEYS:" + Environment.NewLine);
                foreach (string v in coll.AllKeys)
                {
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog), v + Environment.NewLine);
                }
                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog), "VALUES:" + Environment.NewLine);
                foreach (string v in coll.AllKeys)
                {
                    if (coll.GetValues(v).Count() > 0)
                        File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog), coll.GetValues(v)[0] + Environment.NewLine);
                }
                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog), "HEADERS:" + Environment.NewLine);
                var hks = HttpContext.Current.Request.Headers;
                foreach (string v in hks.AllKeys)
                {
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog), v + Environment.NewLine);
                }
                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog), "HEADERVALUES:" + Environment.NewLine);

                foreach (string v in hks.AllKeys)
                {
                    if (hks.GetValues(v).Count() > 0)
                        File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog), hks.GetValues(v)[0] + Environment.NewLine);
                }

                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog), DateTime.Now.ToLongTimeString() + "DUMPING SERVER VARS END" + Environment.NewLine);

            }
            catch (Exception ex)
            {
                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ServerVariablesDumpLog),"Could not read server vars:" + ex.Message + Environment.NewLine);
            }

            
        }

        public string getServerVariable(string variableName)
        {
            NameValueCollection coll;
            string uname;
            // Load ServerVariable collection into NameValueCollection object.
            try
            {
                coll = HttpContext.Current.Request.ServerVariables;
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("Reading server variables: " + ex.Message);
            }



            if (!coll.AllKeys.Contains(variableName))
                throw new System.ArgumentException($" {variableName} not found in SV");

            try
            {
                uname = coll.GetValues(variableName)[0];
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException($"Reading {variableName}:" + ex.Message);
            }
            return uname;

        }

        private string getUserName()
        {
            NameValueCollection coll;
            string uname;
            // Load ServerVariable collection into NameValueCollection object.
            try
            {
                coll = HttpContext.Current.Request.ServerVariables;
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("Reading server variables: " + ex.Message);
            }
           


            if (!coll.AllKeys.Contains("HTTP_USERID"))
                throw new System.ArgumentException("User is not authorized, key not found in SV");

            try
            {
                uname = coll.GetValues("HTTP_USERID")[0];
                //File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "log.txt"), "UNAME: " + uname);
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("Reading HTTP_USERID:" + ex.Message);
            }
            return uname;

        }

        private string getUserName(string varName)
        {
            NameValueCollection coll;
            string uname;
            // Load ServerVariable collection into NameValueCollection object.
            try
            {
                coll = HttpContext.Current.Request.ServerVariables;
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("Reading server variables: " + ex.Message);
            }


            File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "log.txt"), "varName: " + varName);
            if (!coll.AllKeys.Contains(varName))
                return "";

            try
            {
                uname = coll.GetValues(varName)[0];
                //File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "log.txt"), "UNAME: " + uname);
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException($"Reading { varName }:" + ex.Message);
            }
            return uname;

        }

        public List<string> checkInstances()
        {
            //File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "log.txt"), "CheckInstances");
            List<string> instances = new List<string>();
            string uname = this.UserName;
            try
            {
                var dbutils = new IAMDatabaseCommandUtils("POSTE");
                DataSet ds = dbutils.GetDataSet("SELECT ApplicationName FROM dbo.Magic_mmb_Users where [username] ='" + uname + "'");

                if (ds.Tables[0].Rows.Count == 0)
                    throw new ArgumentException("USER_NOT_FOUND , searching for username " + uname);

                foreach (DataRow dr in ds.Tables[0].Rows)
                {
                    instances.Add(dr["ApplicationName"].ToString());
                }
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("User matching failed: "+ ex.Message);
            }
            return instances;
        }

        public List<string> checkInstancesInail()
        {
            //File.WriteAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "log.txt"), "CheckInstances");
            List<string> instances = new List<string>();
            string uname = this.UserName;
            try
            {
                var dbutils = new IAMDatabaseCommandUtils("POSTE");
                DataSet ds = dbutils.GetDataSet("SELECT distinct ApplicationName FROM dbo.Magic_mmb_Users");

                if (ds.Tables[0].Rows.Count == 0)
                    throw new ArgumentException("USER_NOT_FOUND , searching for username " + uname);

                foreach (DataRow dr in ds.Tables[0].Rows)
                {
                    instances.Add(dr["ApplicationName"].ToString());
                }
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("User matching failed: " + ex.Message);
            }
            return instances;
        }

        public static void LogInRefTreeByToken(string uname, string applicationInstanceName,bool deb = false,string testRaiseException = null,string authority = null)
        {
           
            string ServiceWorkerUrlPathPrefix = ConfigurationManager.AppSettings.Get("ServiceWorkerUrlPathPrefix");

            string token = Guid.NewGuid().ToString(); //36 chars
            string reftreeLoginService = ConfigurationManager.AppSettings["PosteLoginApi"];
            //Connection to the "Magic" central database 
            var dbutils = new IAMDatabaseCommandUtils("POSTE");
            if (deb)
                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "PosteIAMlog.txt"), DateTime.Now.ToLongTimeString() + " - LogInRefTreeByToken: Will query for users...");
     
            DataSet ds = dbutils.GetDataSet(@"SELECT UserID from dbo.Magic_Mmb_Users where [username] = '" + uname + "' AND applicationName='" + applicationInstanceName + "'");
            if (ds.Tables[0].Rows.Count == 0)
                throw new System.ArgumentException("user not found in central database");

        
            string userid = ds.Tables[0].Rows[0]["UserID"].ToString();

            //token is useful only when a further end point is called...
            if (!String.IsNullOrEmpty(reftreeLoginService))
            {
                if (deb)
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "PosteIAMlog.txt"), DateTime.Now.ToLongTimeString() + " - LogInRefTreeByToken: Inserting token...");


                dbutils.GetDataSet(@"INSERT INTO [dbo].[Magic_Mmb_Tokens] 
                                ([token] 
                                ,[created_at]
                                ,[updated_at]
                                ,[purpose]
                                ,[user_id]
                                ,[active]
                                ,[appName])
                            VALUES
                                ('" + token + "', getdate() ,getdate()   ,'SSO' ," + userid + ",1,'" + applicationInstanceName + "')");
            }
       
            HttpContext.Current.Response.BufferOutput = true;

            if (deb) 
                File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "IAMlog.txt"), DateTime.Now.ToLongTimeString() + " - LogInRefTreeByToken: Will redirect to " + String.Format("{0}?token={1}&app={2}", reftreeLoginService, token, applicationInstanceName));

            if (ServiceWorkerUrlPathPrefix != null)
            {

                if (deb)
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "IAMlog.txt"), DateTime.Now.ToLongTimeString() + " - LogInRefTreeByToken: found ServiceWorkerUrlPathPrefix value,managing service worker");


                AddMagicFrameworkHeader();
            }

            //Se viene specificato un ulteriore end-point viene chiamato quello (per customizzazioni etc..) altrimenti si procede al login
            if (!String.IsNullOrEmpty(reftreeLoginService))
            {
                if (deb)
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "IAMlog.txt"), DateTime.Now.ToLongTimeString() + " - LogInRefTreeByToken: going to redirect to further end point");

                HttpContext.Current.Response.Redirect(String.Format("{0}?token={1}&app={2}", reftreeLoginService, token, applicationInstanceName));
            }
            else //use this for load balancer
            {
                if (deb)
                    File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "IAMlog.txt"), DateTime.Now.ToLongTimeString() + " - LogInRefTreeByToken: creating the session!");

                SessionHandler.CreateUserSession(applicationInstanceName, int.Parse(userid), authority);

                    string finalRedirectUrl = "";
                if (ConfigurationManager.AppSettings["SSOUrlPathAbsolute"] != null)
                {
                    if (deb)
                        File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "IAMlog.txt"), DateTime.Now.ToLongTimeString() + " - LogInRefTreeByToken:SSOUrlPathAbsolute NOT found, now getting app settings to build redirect link!");
  
                    MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
                    MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(applicationInstanceName)).FirstOrDefault();

                    finalRedirectUrl = "/" + config.appMainURL;
                }
                else
                {
                    if (deb)
                        File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "IAMlog.txt"), DateTime.Now.ToLongTimeString() + " - LogInRefTreeByToken: SSOUrlPathAbsolute found, will redirect there!");

                    finalRedirectUrl = ConfigurationManager.AppSettings["SSOUrlPathAbsolute"];
                }

                HttpContext.Current.Response.Redirect(finalRedirectUrl);
                return;

            }



        }
        private static void AddMagicFrameworkHeader()
        {
            if (HttpContext.Current.Request.Cookies["X-Reftree-MagicSolution"] == null)
            {
                HttpCookie customCookie = new HttpCookie("X-Reftree-MagicSolution", "true");
                customCookie.HttpOnly = false; // Set to true if the cookie should not be accessible via JavaScript
                customCookie.Secure = true; // Set to true if using HTTPS
                // Add the cookie to the response
                HttpContext.Current.Response.Cookies.Add(customCookie);
            }
        }
        public bool chekUserProfile(string storedProcedure, string data) {
            bool bReturn = false;

            try
            {
                var dbutils = new IAMDatabaseCommandUtils("POSTE");
                bReturn = dbutils.executeSP(storedProcedure, data);
            }
            catch (Exception ex)
            {
                throw new System.ArgumentException("User matching failed: " + ex.Message);
            }

            return bReturn;
        }
    }
}
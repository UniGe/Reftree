using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using AttributeRouting.Web.Http;
using System.Linq.Dynamic;
using System.Configuration;
using System.Reflection;
using System.Xml;
using System.Xml.Linq;
using MagicFramework.Helpers;
using System.Data;
using System.IO;
using System.Text;
using System.Dynamic;
using System.Data.SqlClient;
using MagicFramework.Helpers.Sql;

namespace MagicFramework.Controllers
{
    public class Magic_PivotController :ApiController
    {
        public class PivotCFG
        {
            public DataRow config { get; set; }
            public string data { get; set; }
            public string dataSourceConfig { get; set; }
        }

        private DataRow getPivotcfg(string code)
        {
            DataSet ds = new DataSet();
            int tout = ConfigurationManager.AppSettings["SqlCommandTimeout"] == null ? 30 : int.Parse(ConfigurationManager.AppSettings["SqlCommandTimeout"].ToString());
            string sqlCommand = "SELECT p.OnLoadFieldsLayout,p.OLTPDataQuery,d.Code as DataSourceType,p.OLAPDataSource,p.Description,p.OLTPStoredProcedure FROM dbo.Magic_Pivot p inner join dbo.Magic_PivotDataSourceTypes d on d.ID = p.DataSourceType_ID WHERE p.Code = @code";
            string connectionString = DBConnectionManager.GetTargetConnection();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Connection.Open();
                    DataTable table = new DataTable();
                    cmd.Parameters.AddWithValue("code", code);
                    //value read from web.config if null it's considered 30 (default) 
                    cmd.CommandTimeout = tout;
                    table.Load(cmd.ExecuteReader());
                    ds.Tables.Add(table);
                    cmd.Connection.Close();
                }
            }
            if (ds.Tables[0].Rows.Count == 0)
                throw new System.ArgumentException("pivot config not found");

            return ds.Tables[0].Rows[0];
        }
        /// <summary>
        /// gets the magic config of a pivot
        /// </summary>
        /// <param name="code"></param>
        /// <returns></returns>
        public PivotCFG loadPivot(string code,dynamic inputData  = null)
        {
            PivotCFG pcfg = new PivotCFG();
            string conn = DBConnectionManager.GetTargetConnection();
            var dbutils = new DatabaseCommandUtils();
            DataRow pivotcfg = getPivotcfg(code);
            pcfg.config = pivotcfg;
            switch (pivotcfg["DataSourceType"].ToString())
            {
                case "OLTP": 
                    string query = pivotcfg["OLTPDataQuery"].ToString();
                    string sp = pivotcfg["OLTPStoredProcedure"].ToString(); 
                    string data = String.Empty;
                    if (String.IsNullOrEmpty(sp))
                    //statement is executed with {0} as UserID and {1} as UserVisiblityGroupID.
                    {
                        query = String.Format(query, SessionHandler.IdUser.ToString(), SessionHandler.UserVisibilityGroup.ToString());
                        data = JsonUtils.convertDataSetToJsonString(dbutils.GetDataSet(query, conn));
                    }
                    else
                    {
                        dynamic spInput = new ExpandoObject();
                        spInput.PIVOT = code;
                        string wherecondition = String.Empty;
                        if (inputData != null)
                        {
                            if (inputData.filterFormData != null)
                            {
                                spInput.FilterFormData = inputData.filterFormData;
                            }
                            //se la pivot e' legata ad un grid passo anche il filtro della griglia se esistente
                            if (inputData.outerGrid != null)
                            {
                                if (inputData.outerGrid.filter != null)
                                {
                                    Models.Request rq = new Models.Request();
                                    rq.filter = new MagicFramework.Models.Filters(inputData.outerGrid.filter);
                                    RequestParser rp = new RequestParser(rq);
                                    wherecondition = rp.BuildWhereCondition(true);
                                }
                                if (inputData.outerGrid.selected != null)
                                {
                                    spInput.GridSelected = inputData.outerGrid.selected;
                                }
                            }
                        }
                        var ds = dbutils.GetDataSetFromStoredProcedure(sp, spInput, null, wherecondition);
                        data = JsonUtils.convertDataSetToJsonString(ds);
                    }
                        pcfg.data = data;
                    break;
                case "OLAP":
                    if (pivotcfg["OLAPDataSource"] == null)
                        throw new System.ArgumentException("DataSource definition is mandatory for OLAP");
                    pcfg.dataSourceConfig = pivotcfg["OLAPDataSource"].ToString();
                    break;
            }
     
            //implement olap which builds a dataSourceConfig 
            return pcfg;
        }
      //gets the data for the front end pivot builder (JS) 
	    [HttpGet]
        public HttpResponseMessage Get(string id)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                PivotCFG cfg = this.loadPivot(id);
                response.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(cfg));
            }
            catch (Exception ex) {
                response = Utils.retInternalServerError("PivotCfg error:" + ex.Message);
            }
            return response;
        }

        [HttpPost]
        public HttpResponseMessage Post(string id,dynamic data)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                PivotCFG cfg = this.loadPivot(id,data);
                response.Content = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(cfg));
            }
            catch (Exception ex)
            {
                response = Utils.retInternalServerError("PivotCfg error:" + ex.Message);
            }
            return response;
        }

        [HttpPost]
        public Models.Response GetPivots(dynamic data)
        {
            MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());
            return mfApi.GetPivots(data.Codes);
        }

        #region IHttpHandler Members

        static bool alwaysParseRequest = System.Diagnostics.Debugger.IsAttached;
        [HttpPost]
        public void ProcessCubeRequest()
        {
            HttpContext context = HttpContext.Current;
            //var req = (HttpWebRequest)WebRequest.Create("https://demos.devexpress.com/Services/OLAP/msmdpump.dll");
            string cubeUrl = ApplicationSettingsManager.GetIISOLAPUrl(); //e.g: http://192.168.2.100/OLAP/msmdpump.dll
            var req = (HttpWebRequest)WebRequest.Create(cubeUrl);
            //set the credentials to connect to the SSAS datapump in IIS
            //Needs to be set in the properties of the Anonymous Authentication module 
            //and no other Authenticaion protocol should be enabled in IIS
            req.UseDefaultCredentials = true;

            req.Method = context.Request.HttpMethod;
            bool hasSSASSessionIdHeader = false;
            context.Response.DisableKernelCache();


            //Authentication at this level is not required, i'm inside the MagicFramework solution
            #region Handle HTTP Basic Auth and Session
            //if (context.Session.Contents["customData"] == null)
            //{
            //    var auth = context.Request.Headers["Authorization"];
            //    if (auth == null || !auth.ToLower().StartsWith("basic "))
            //    {
            //        context.Response.StatusCode = 401;
            //        context.Response.AddHeader("WWW-Authenticate", "Basic realm=cube");
            //        context.Response.End();
            //        return;
            //    }
            //    auth = auth.Substring("Basic ".Length);
            //    var authString = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(auth));
            //    var aa = authString.Split(':');
            //    var user = aa[0];
            //    var pwd = aa[1];

            //    if (!ValidateCredentials(user, pwd))
            //    {
            //        context.Response.StatusCode = 401;
            //        context.Response.AddHeader("WWW-Authenticate", "Basic realm=cube");
            //        context.Response.End();
            //        return;
            //    }

            //    //save the user's identity for pushing into the BeginSession request
            //    //Here we're just setting the user name as the CustomData.  Custom cube security
            //    //would then consume that.
            //    context.Session.Add("customData", user);
            //}
            #endregion

            #region Process Request Headers

            foreach (string h in context.Request.Headers.Keys)
            {
                if (h.Equals("Content-Type", StringComparison.OrdinalIgnoreCase))
                {
                    req.ContentType = context.Request.Headers[h];
                }
                else if (h.Equals("Content-Length", StringComparison.OrdinalIgnoreCase))
                {
                    req.ContentLength = int.Parse(context.Request.Headers[h]);
                }
                else if (h.Equals("Connection", StringComparison.OrdinalIgnoreCase))
                {
                    req.KeepAlive = (context.Request.Headers[h].Equals("Keep-Alive", StringComparison.OrdinalIgnoreCase));
                }
                else if (h.Equals("Accept", StringComparison.OrdinalIgnoreCase))
                {
                    req.Accept = context.Request.Headers[h];
                }
                else if (h.Equals("User-Agent", StringComparison.OrdinalIgnoreCase))
                {
                    req.UserAgent = context.Request.Headers[h];
                }
                else if (h.Equals("SOAPAction", StringComparison.OrdinalIgnoreCase))
                {
                    req.Headers.Add(h, context.Request.Headers[h]);
                }
                else if (h.Equals("X-Transport-Caps-Negotiation-Flags", StringComparison.OrdinalIgnoreCase))
                {
                    req.Headers.Add(h, context.Request.Headers[h]);
                }
                else if (h.Equals("X-AS-GetSessionToken", StringComparison.OrdinalIgnoreCase))
                {
                    // hasGetSessionTokenHeader = true;
                    req.Headers.Add(h, context.Request.Headers[h]);
                }
                else if (h.Equals("X-AS-SessionID", StringComparison.OrdinalIgnoreCase))
                {
                    hasSSASSessionIdHeader = true;
                    req.Headers.Add(h, context.Request.Headers[h]);
                }
                //Se e' presente la password nel .config vengono passate le credenziali nella richiesta ad IIS che poi vengono usate per gestire la security sul Cubo
                //Il nome utente deve essere un utente Windows. Nel caso di Anonymous Auth bisogna autorizzare l' utente IIS per accedere al Cubo...
                SetBasicAuthHeader(req);
            }
            #endregion

            #region Process Request Body


            if (context.Request.HttpMethod == "POST" || context.Request.HttpMethod == "PUT")
            {
                using (var ss = context.Request.GetBufferlessInputStream())
                {
                    if (!hasSSASSessionIdHeader || alwaysParseRequest)
                    {
                        XDocument doc = XDocument.Load(ss);

                        //For a BeginSesion request remove any security-related properties sent by the client
                        //and push the session's customData string into the CustomData property on the BeginSession request
                        if (IsBeginSessionRequest(doc.Root))
                        {
                            ScrubSecrityProperties(doc.Root);
                            //SetCustomData(doc.Root, context.Session["customData"].ToString());
                            string userName = ApplicationSettingsManager.GetIISOLAPUserName();
                            string userPassword = ApplicationSettingsManager.GetIISOLAPUserPassword();
                            if (!String.IsNullOrEmpty(userPassword))
                                SetCustomData(doc.Root,userName +","+ userPassword);
                        }

                        var ms = new MemoryStream();
                        var xw = XmlWriter.Create(ms, new XmlWriterSettings() { Encoding = context.Request.ContentEncoding });
                        doc.Save(xw);
                        xw.Flush();
                        ss.Close();
                        doc = null;

                        var bytes = ms.Length;
                        ms.Position = 0;
                        req.ContentLength = bytes;
                        using (var ds = req.GetRequestStream())
                        {
                            ms.CopyTo(ds);
                        }

                    }
                    else //just copy the incoming request stream to the data pump request
                    {
                        using (var ds = req.GetRequestStream())
                        {
                            ss.CopyTo(ds);
                        }
                    }
                }
            }
            #endregion

            //Forward the request to SSAS
            HttpWebResponse resp = null;
            try
            {  
                resp = (HttpWebResponse)req.GetResponse();
            }
            catch (WebException we)  //if we got a valid http response, just pass it on to the client
            {
                resp = (HttpWebResponse)we.Response;
                if (resp == null)
                    throw we;
            }

            context.Response.StatusCode = (int)resp.StatusCode;
            context.Response.StatusDescription = resp.StatusDescription;
     
            #region Process Response Headers

            foreach (string h in resp.Headers.Keys)
            {
                if (h.Equals("Content-Type", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.ContentType = resp.Headers[h];
                }
                else if (h.Equals("Transfer-Encoding", StringComparison.OrdinalIgnoreCase))
                {
                    //skip.  ASP.NET will add this if necessary
                }
                else if (h.Equals("WWW-Authenticate", StringComparison.OrdinalIgnoreCase))
                {
                    //skip
                }
                else if (h.Equals("Persistent-Auth", StringComparison.OrdinalIgnoreCase))
                {
                    //skip
                }
                else if (h.Equals("X-Transport-Caps-Negotiation-Flags", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.AddHeader(h, resp.Headers[h]);
                }

            }
            #endregion

            //Copy the SSAS respons body to the client



            using (var ss = resp.GetResponseStream())
            using (var ds = context.Response.OutputStream)
            {
                ss.CopyTo(ds);
            }
            context.Response.End();
        }


        /*
         * 
         * Sample BeginSession request
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Header>
    <BeginSession xmlns="urn:schemas-microsoft-com:xml-analysis" />
    <Version xmlns="http://schemas.microsoft.com/analysisservices/2008/engine/100" Sequence="400" />
    </soap:Header>
    <soap:Body>
    <Execute xmlns="urn:schemas-microsoft-com:xml-analysis">
      <Command>
        <Statement xmlns="urn:schemas-microsoft-com:xml-analysis" />
      </Command>
      <Properties>
        <PropertyList>
          <SafetyOptions>2</SafetyOptions>
          <MdxMissingMemberMode>Error</MdxMissingMemberMode>
          <DbpropMsmdOptimizeResponse>1</DbpropMsmdOptimizeResponse>
          <LocaleIdentifier>1033</LocaleIdentifier>
          <DbpropMsmdMDXCompatibility>1</DbpropMsmdMDXCompatibility>
          <DbpropMsmdSubqueries>2</DbpropMsmdSubqueries>
        </PropertyList>
      </Properties>
    </Execute>
    </soap:Body>
    </soap:Envelope>
         * */
        static XNamespace xmla = "urn:schemas-microsoft-com:xml-analysis";
        static XNamespace soap = "http://schemas.xmlsoap.org/soap/envelope/";
        /**
         * Read the SOAP envelope to determine if this request is the XMLA BeginSession request.
         * If so we will need to rewrite it.
         */
        bool IsBeginSessionRequest(XElement soapEnvelope)
    {
        var e = soapEnvelope.Element(soap + "Header") == null ? soapEnvelope.Element(xmla + "BeginSession") : soapEnvelope.Element(soap + "Header");
      return e != null;

    }
        void ScrubSecrityProperties(XElement soapEnvelope)
        {
            var propertyList = soapEnvelope.Element(soap + "Body")
                               .Element(xmla + "Execute")
                               .Element(xmla + "Properties")
                               .Element(xmla + "PropertyList");

            var elementsToRemove = new List<XElement>();
            var elementNamesToRemove = new HashSet<XName>() 
                { 
                    xmla+"DataSourceInfo", 
                    xmla+"EffectiveRoles",
                    xmla+"EffectiveUserName",
                    xmla+"Roles",
                    xmla+"CustomData"
                };

            foreach (var pe in propertyList.Elements())
            {
                if (elementNamesToRemove.Contains(pe.Name))
                {
                    elementsToRemove.Add(pe);
                }
            }
            foreach (var pe in elementsToRemove)
            {
                pe.Remove();
            }
        }
        /**
         * Push a custom string into the customData field on the SOAP request.  Typically this will be the 
         * user's identity.  The cube would then use this to implement custom security.
         */
        void SetCustomData(XElement soapEnvelope, string customData)
        {
            var propertyList = soapEnvelope.Element(soap + "Body")
                                           .Element(xmla + "Execute")
                                           .Element(xmla + "Properties")
                                           .Element(xmla + "PropertyList");

            var customDataElement = propertyList.Element(xmla + "CustomData");
            if (customDataElement == null)
            {
                customDataElement = new XElement(xmla + "CustomData");
                propertyList.Add(customDataElement);
            }

            //customDataElement.Value = customData;
            customDataElement.Value = customData;
        }
        public void SetBasicAuthHeader(WebRequest request)
        {
            String userName; String userPassword;
            userName = ApplicationSettingsManager.GetIISOLAPUserName();
            userPassword = ApplicationSettingsManager.GetIISOLAPUserPassword();
            if (userPassword != null)
            {
                string authInfo = userName  + ":" + userPassword;
                authInfo = Convert.ToBase64String(Encoding.Default.GetBytes(authInfo));
                request.Headers["Authorization"] = "Basic " + authInfo;
            }
        }
        /**
         * This is the custom credential validation procedure.  Check the credentials
         * against some credential store. 
         */
        //bool ValidateCredentials(string userName, string password)
        //{
        //    return true;
        //    //return (password == "P@ssword");
        //}

        #endregion
 
	}
}
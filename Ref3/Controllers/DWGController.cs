using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Web;
using System.Web.Http;
using System.Xml.Linq;
using MagicFramework.Helpers;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Net;
using MagicFramework.Controllers.ActionFilters;

namespace Ref3.Controllers
{
    [ExceptionFilter]
    public class DWGController : ApiController
    {
        const string SESSION_INSTANCE_NAME_KEY = "RefDWGInstanceName";
        const string CONFIG_STORED_NAME = "[core].[DWG_Cad_config]";
        const string TOOLTIP_STORED_NAME = "[core].[DWG_GetTreeToolTip]";

         [HttpGet]
        public HttpResponseMessage Viewer (string q, string instanceName)
        {
            var res = new HttpResponseMessage();
            try
            {
               
                var config = new MFConfiguration().GetApplicationInstanceByInstanceName(HttpContext.Current.Request.Url.Authority, instanceName);

                string key = config.RefDWGAESKey;
                  
                if (string.IsNullOrEmpty(key)) {
                    throw new Exception("missing settings application config");
                }

                HttpContext.Current.Session[SESSION_INSTANCE_NAME_KEY] = instanceName;

                var dwgConfig = GetConfigFromStored(config);

                byte[] byteKey = Convert.FromBase64String(key);
                string decryptetJSON = Encoding.UTF8.GetString(Crypto.AESCBCDecryptByteArray(Convert.FromBase64String(q), byteKey));

                JObject info = JObject.Parse(decryptetJSON);

                if (info["files"] == null)
                {
                    res.StatusCode = System.Net.HttpStatusCode.NotFound;
                    return res;
                }
                string includesVersion = "/version" + ConfigurationManager.AppSettings["includesVersion"];
                string applicationVersion = Utils.version();

                string html = File.ReadAllText(Utils.GetBasePath() + "/Views/3/dxf-viewer.html");

                // building header
                var header = "<script>window.refDXFFileURI='" + dwgConfig.RootForDxf + "';window.dxfViewerInfo = " + decryptetJSON + "; window.includesVersion = '" + includesVersion + "'; window.applicationVersion = '" + applicationVersion + "'</script>";
                header += "<script src='" + includesVersion + "/Magic/v/" + applicationVersion + "/Scripts/require.js'></script>";
                header += "<script src='" + includesVersion + "/Magic/v/" + applicationVersion + "/Scripts/config.js'></script>";
                header += "<script src='" + includesVersion + "/Custom/3/Scripts/config.js'></script>";
                header += "<link href='" + includesVersion + "/Magic/v/" + applicationVersion + "/Styles/3rd-party/font-awesome.min.css' rel='stylesheet' />";
                html = html.Replace(
                    "<!--{header}-->"
                    , header
                );
                res.Content = new StringContent(html);
                res.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("text/html");
            }
            catch (Exception e)
            {
                res.Content = new StringContent(e.ToString());
            }

            return res;
        }

        [HttpGet]
        public HttpResponseMessage GetConfig ()
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                MFConfiguration applicationConfig = new MFConfiguration(SessionHandler.ApplicationDomainURL);
                MFConfiguration.ApplicationInstanceConfiguration config = applicationConfig.GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
                Config dwgConfig = GetConfigFromStored(config);
                response.Content = new StringContent(JsonConvert.SerializeObject(dwgConfig));
                response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");
                response.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception e)
            {
                response.Content = new StringContent(e.Message);
                response.StatusCode = HttpStatusCode.InternalServerError;
            }
            return response;
        }

        private Config GetConfigFromStored(MFConfiguration.ApplicationInstanceConfiguration config)
        {
            var proc = new MagicFramework.Helpers.Sql.DBProcedure(CONFIG_STORED_NAME);
            proc.connectionString = config.TargetDBconn;

            var p = new XElement("P");
            p.SetAttributeValue("ApplicationInstanceId", config.id);
            var xml = new XDocument(new XElement("SQLP", p));
            var result = proc.ExecuteAndGetDataTable(xml.ToString());
            if (result.Rows == null || result.Rows.Count == 0 || result.Rows[0].Table.Rows == null || result.Rows[0].Table.Rows.Count == 0)
            {
                throw new Exception(CONFIG_STORED_NAME + " returned no result for ApplicationInstanceId " + config.id);
            }
            return JsonConvert.DeserializeObject<Config>((string)result.Rows[0].Table.Rows[0]["RSN_CADCFG_JSON_CONFIG"]);
        }

        [HttpGet]
        public HttpResponseMessage Tooltip(string fileName, string handle)
        {
            string instanceName = null;
            try
            {
                instanceName = SessionHandler.ApplicationInstanceName;
            }
            catch { }
            if (string.IsNullOrEmpty(instanceName))
            {
                instanceName = (string)HttpContext.Current.Session[SESSION_INSTANCE_NAME_KEY];
            }
            if (string.IsNullOrEmpty(instanceName))
            {
                return new HttpResponseMessage
                {
                    StatusCode = System.Net.HttpStatusCode.Unauthorized,
                    Content = new StringContent("Session does not contain instanceName")
                };
            }

            var config = new MFConfiguration().GetApplicationInstanceByInstanceName(HttpContext.Current.Request.Url.Authority, instanceName);

            var proc = new MagicFramework.Helpers.Sql.DBProcedure(TOOLTIP_STORED_NAME);
            proc.connectionString = config.TargetDBconn;

            var p = new XElement("P");
            p.SetAttributeValue("ApplicationInstanceId", config.id);
            p.SetAttributeValue("handle", handle);
            p.SetAttributeValue("fileName", fileName);
            var xml = new XDocument(new XElement("SQLP", p));
            var result = proc.ExecuteAndGetDataTable(xml.ToString());
            if (result.Rows == null || result.Rows.Count == 0 || result.Rows[0].Table.Rows == null || result.Rows[0].Table.Rows.Count == 0)
            {
                throw new Exception(TOOLTIP_STORED_NAME + " returned no result for handle " + handle + " and fileName " + fileName);
            }
            return new HttpResponseMessage {
                Content = new StringContent(JsonConvert.SerializeObject(result.Rows[0].Table), Encoding.UTF8, "application/json"),
                StatusCode = System.Net.HttpStatusCode.OK
            };
        }

        private class Config
        {
            public string RootForDxf { get; set; }
        }
    }
}
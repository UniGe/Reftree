using MagicFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Ref3.Helpers;
using Newtonsoft.Json.Linq;
using System.Data;
using MagicFramework.Controllers.ActionFilters;
using MagicFramework.Controllers.ActionFilters.Access;
using Ref3.Helpers.Sql;
using System.Threading.Tasks;
using System.Web;

namespace Ref3.Controllers
{
    [ExceptionFilter]
    public class IntegrationController : ApiController
    {
        private string logFilePath = "DataExportLog.txt";

        /// <summary>
        /// Gets the body content of a request and puts its contente according to a fileimport setting
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        [ValidToken(TokenPurpose = "ReftreeImportExport")]
        public HttpResponseMessage Import(string interfaceName, string instanceName, dynamic data)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                if (instanceName == null)
                    return GetErrorMessage("queryParam 'instanceName' not specified", HttpStatusCode.BadRequest);
                if (data == null)
                    return GetErrorMessage("body is null or empty", HttpStatusCode.BadRequest);
                if (interfaceName == null)
                    return GetErrorMessage("queryParam 'interfaceName' not specified", HttpStatusCode.BadRequest);

                string instancename = instanceName;
                string content;
                if (data.GetType().Name == "JObject")
                    content = Newtonsoft.Json.JsonConvert.SerializeObject(data);
                else
                    content = data;

                MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
                MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(instancename)).FirstOrDefault();
                var integrationHelper = new IntegrationFileImportManager(interfaceName, config, content);
                integrationHelper.import();
                response.StatusCode = HttpStatusCode.NoContent;
            }
            catch (Exception ex) {
                return GetErrorMessage(ex.Message, HttpStatusCode.InternalServerError);
            }
            return response;
        }

        [HttpPost]
        [ValidToken(TokenPurpose = "ReftreeImportExport")]
        public HttpResponseMessage Export(string guid, string instanceName, dynamic data)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                //1 valid appInstance
                MFConfiguration.Application configs = new MFConfiguration().GetAppSettings();
                MFConfiguration.ApplicationInstanceConfiguration config = configs.listOfInstances.Where(a => a.appInstancename.Equals(instanceName)).FirstOrDefault();
                if (config == null)
                {
                    return GetErrorMessage("No MagicFrameworkConfiguration found for provided appInstance.", HttpStatusCode.NotFound);
                }
                DataExportQueries exportQueries = new DataExportQueries(config.TargetDBconn);

                string disabledWhitelistString = MFConfiguration.GetApplicationInstanceConfiguration().CustomSettings
                    .FirstOrDefault(s => s.Key.Equals("APIKeyReftreeImportExportDisableWhiteList"))?.Value;

                bool disabledWhitelist;
                bool isParsed = Boolean.TryParse(disabledWhitelistString, out disabledWhitelist);

                // Check the condition
                if (!isParsed || !disabledWhitelist)
                {
                    //2 ip-whitelist
                    string clientIP = GetClientIP();
                    DataTable whitelist = exportQueries.GetExportWhitelist();
                    if (whitelist.Rows.Count > 0)
                    {
                        bool isNotFoundIP = true;
                        foreach (DataRow row in whitelist.Rows)
                        {
                            string ip = row["IP"].ToString();
                            if (ip.Equals(clientIP))
                            {
                                isNotFoundIP = false;
                                break;
                            }
                        }
                        if (isNotFoundIP)
                        {
                            return GetErrorMessage(clientIP + " not found in dbo.Magic_ExportWhitelist.", HttpStatusCode.Unauthorized);
                        }
                    }
                    else      //list is empty -> accept only same origin
                    {
                        string serverIP = GetServerIP();
                        if (serverIP != clientIP)
                        {
                            return GetErrorMessage(clientIP + " not found in dbo.Magic_ExportWhitelist (list is empty).", HttpStatusCode.Unauthorized);
                        }
                    }
                }
                //3 valid guid
                if (!Guid.TryParse(guid, out var newGuid))
                {
                    return GetErrorMessage("Invalid GUID provided (violating sql-datatype uniqueidentifier).", HttpStatusCode.BadRequest);
                }

                //4 export setting exists
                DataRow exportSetting = exportQueries.GetExportSetting(guid);
                if (exportSetting == null)
                {
                    return GetErrorMessage("No setting was found for the provided GUID.", HttpStatusCode.NotFound);
                }

                string spName = exportSetting.Field<string>("StoredProcedure");
                string contentType = exportSetting.Field<string>("ResultContentType");
                DataRow exportLog;
                int exportLogID;
                try
                {
                    string body = data.ToString();
                    exportLog = exportQueries.CreateExportLog(guid, body);
                    exportLogID = exportLog.Field<int>("ID");
                }
                catch (Exception ex)
                {
                    string errMsg = "Request-Body is not a string.";
                    exportLog = exportQueries.CreateExportLog(guid, "");
                    exportLogID = exportLog.Field<int>("ID");

                    exportQueries.WriteErrorToExportLog(exportLogID, errMsg);
                    return GetErrorMessage(errMsg, HttpStatusCode.BadRequest);
                }

                DataSet spResult = exportQueries.ExecuteStoredProcedure(spName, config.TargetDBconn, exportLogID);
                string exportData = spResult.Tables[0].Rows[0][0].ToString();
                response.StatusCode = HttpStatusCode.OK;
                if (spResult.Tables[0].Columns.Count >= 2)
                {
                    int statusCode = spResult.Tables[0].Rows[0].Field<int>(1);
                    response.StatusCode = (HttpStatusCode)statusCode;
                }
                response.Content = new StringContent(exportData);
                response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
            }
            catch (TaskCanceledException taskCanceledEx)
            {
                MFLog.LogInFile(taskCanceledEx, MFLog.logtypes.ERROR, logFilePath); //log but don't throw
            }
            catch (Exception ex)
            {
                return GetErrorMessage(ex.Message, HttpStatusCode.InternalServerError);
            }
            return response;
        }

        private String GetClientIP()
        {
            String ip = HttpContext.Current.Request.ServerVariables["HTTP_X_FORWARDED_FOR"];

            if (string.IsNullOrEmpty(ip))
            {
                ip = HttpContext.Current.Request.ServerVariables["REMOTE_ADDR"];
            }

            return ip;
        }
        private string GetServerIP()
        {
            IPHostEntry ipHostInfo = Dns.GetHostEntry(Dns.GetHostName()); // `Dns.Resolve()` method is deprecated.
            IPAddress ipAddress = ipHostInfo.AddressList[0];

            return ipAddress.ToString();
        }

        private HttpResponseMessage GetErrorMessage(string message, HttpStatusCode statusCode)
        {
            return ResponseHelper.GetErrorMessage(message, statusCode);
        }

    }
}

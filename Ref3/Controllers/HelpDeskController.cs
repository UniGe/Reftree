using MagicFramework.Controllers.ActionFilters;
using MagicFramework.Helpers;
using MagicFramework.MemberShip;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Web.Security;

namespace Ref3.Controllers
{
    [ExceptionFilter]
    public class HelpDeskController : ApiController
    {
        private static List<string> getAllowedExtensions()
        {
            List<string> allowedExtensionsList = new List<string>();
            //Bug #6482 -  security issue, uploadable extensions MUST be limited and checked at back end side. No session in this async call therefore it's using Web.config 
            string allowedExtensions = ConfigurationManager.AppSettings["allowedExtensionsForFileUpload"];
            if (!String.IsNullOrEmpty(allowedExtensions))
                allowedExtensionsList = allowedExtensions.Split(',').ToList();

            return allowedExtensionsList;
        }
        private static bool isExtensionAllowed(List<string> allowedExtensionsList, string fileName)
        {
            //if a list of allowed extensions has been configured for security purposes i test the current file extension against it 
            if (allowedExtensionsList.Count > 0)
            {
                if (!allowedExtensionsList.Contains(Path.GetExtension(fileName), StringComparer.OrdinalIgnoreCase))
                    return false;
            }
            return true;
        }
        [HttpPost]
        public HttpResponseMessage Insert()
        {
            HttpResponseMessage response = new HttpResponseMessage();

            try
            {
                string ipAddress = HttpContext.Current.Request.ServerVariables["HTTP_X_FORWARDED_FOR"];
                if (string.IsNullOrEmpty(ipAddress))
                {
                    ipAddress = HttpContext.Current.Request.UserHostAddress;
                }
                if (!CheckAllowedIPs(ipAddress))
                {
                    response.StatusCode = HttpStatusCode.NotAcceptable;
                    string directoryLog = ConfigurationManager.AppSettings["logpath"];
                    MFLog.LogInFile("The following unauthorized IP tried to call api/HelpDesk/Insert:" + ipAddress, MFLog.logtypes.ERROR, "ACCESS_VIOLATIONS.txt", Path.Combine(directoryLog, "HELPDESK_API"));
                    return response;
                }
                SessionHandler.ApplicationDomainURL = HttpContext.Current.Request.Url.Authority;
                MFConfiguration.ApplicationInstanceConfiguration applicationInstance = new MFConfiguration(SessionHandler.ApplicationDomainURL).appSettings.listOfInstances[0];
                SessionHandler.ApplicationInstanceId = applicationInstance.id;
                EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[applicationInstance.appInstancename];
                if (member == null)
                {
                    response.StatusCode = HttpStatusCode.BadRequest;
                    response.Content = new StringContent("Membership provider not found");
                }
                byte[] body = default(byte[]);
                using (var memstream = new System.IO.MemoryStream())
                {
                    HttpContext.Current.Request.InputStream.CopyTo(memstream);
                    body = memstream.ToArray();
                }
                Data data = JsonConvert.DeserializeObject<Data>(Encoding.UTF8.GetString(Crypto.AESCBCDecryptByteArray(body, GetByteKey())));
                MagicFramework.Data.Magic_Mmb_Users user = member.GetUser(!string.IsNullOrEmpty(data.Email) ? data.Email : data.Username);
                if (user == null)
                {
                    response.StatusCode = HttpStatusCode.BadRequest;
                    response.Content = new StringContent("User not found");
                }
                else
                {
                    member.SetUserInfosSession(user, new MagicFramework.Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection()), false);
                    if (data.Files != null)
                    {
                        List<string> allowedExtensionsList = getAllowedExtensions();
                        foreach (File file in data.Files)
                        {
                            try
                            {
                                if (!string.IsNullOrEmpty(file.Base64Content))
                                {
                                    bool isSqlServerFile = false;
                                    string fileDir = MagicFramework.Controllers.MAGIC_SAVEFILEController.GetFileDestinationDir("", file.name, out isSqlServerFile, false);
                                    string filePath = fileDir + "\\" + file.name;

                                    if (!isExtensionAllowed(allowedExtensionsList,file.name))
                                        throw new ArgumentException("Extension forbidden");


                                    if (!isSqlServerFile)
                                    {

                                        System.IO.File.WriteAllBytes(filePath, Convert.FromBase64String(file.Base64Content));
                                    }
                                    else
                                    {
                                        byte[] bytes = Convert.FromBase64String(file.Base64Content);
                                        using (System.IO.MemoryStream stream = new System.IO.MemoryStream(bytes))
                                        {
                                            MagicFramework.Controllers.MAGIC_SAVEFILEController.SaveFileInDBTable(stream, filePath);
                                        }
                                    }
                                }
                            }
                            catch (Exception fileException)
                            {
                            }
                            finally
                            {
                                file.Base64Content = null;
                            }
                        }
                    }
                    JObject json = new JObject();
                    json["Useremail"] = user.Email;
                    json["UserID"] = user.UserID;
                    json["SG_REQUES_SG_TIPREQ_ID"] = data.TypeID;
                    json["description"] = data.Description;
                    json["url"] = data.Url;
                    json["gridname"] = data.GridName;
                    json["ApplicationInstanceName"] = data.ApplicationInstanceName;
                    json["files"] = null;
                    if (data.Files != null && data.Files.Count > 0)
                    {
                        JArray filesArray = JArray.FromObject(data.Files);
                        foreach (JObject file in filesArray)
                        {
                            file.Remove("Base64Content");
                        }
                        json["files"] = filesArray.ToString(Formatting.None);
                    }
                    DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                    dbutils.callStoredProcedurewithXMLInput(JsonUtils.Json2Xml(json.ToString()), "CORE.SG_SP_SEGREF_INS_FROM_WORD");
                    response.StatusCode = HttpStatusCode.OK;
                }
            }
            catch (Exception e)
            {
                //standard message
                string message = "Problemi durante l' inserimento della segnalazione. Contattare l' help desk";
                //check managed exceptions
                if (e.Message.StartsWith("{") && e.Message.EndsWith("}"))
                {
                    response.Content = new StringContent(e.Message);
                    var o = JObject.Parse(e.Message);
                    if (o["type"] != null && o["type"].ToString() == "MANAGED_EXCEPTION")
                    {
                        message = o["content"].ToString();
                   
                    }
                }
                
                response.Content = new StringContent(message);
                response.StatusCode = HttpStatusCode.BadRequest;
            }

            return response;
        }

        [HttpPost]
        async public Task<HttpResponseMessage> Post([FromBody] Data data)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            string currentapplication = ApplicationSettingsManager.GetAppInstanceName();
            EFMembershipProvider member = (EFMembershipProvider)Membership.Providers[currentapplication];
            MembershipUser user = member.GetUser(SessionHandler.Username, true);
            data.Email = user.Email;
            data.Username = SessionHandler.Username;
            data.ApplicationInstanceName = SessionHandler.ApplicationInstanceName;
            if (data.Files != null)
            {
                string root = HttpContext.Current.Server.MapPath("~");
                string tmpPath = root + "/TemporaryFiles/";
                foreach (File file in data.Files)
                {
                    try
                    {
                        RawFile rawFile = data.RawFiles.Find(f => f.Name.Equals(file.name));
                        string tempFileName = System.IO.Path.GetFileName(System.IO.Path.GetFileName(rawFile.TmpFile));
                        Byte[] bytes = System.IO.File.ReadAllBytes(tmpPath + tempFileName);
                        System.IO.File.Delete(tmpPath + tempFileName);
                        file.Base64Content = Convert.ToBase64String(bytes);
                    }
                    catch (Exception fileException)
                    {
                    }
                }
            }
            data.RawFiles = null;
            HttpClient httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/octet-stream"));
            ByteArrayContent content = new ByteArrayContent(Crypto.AESCBCEncryptByteArray(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(data)), GetByteKey()));
            HttpResponseMessage responseFromRemote = await httpClient.PostAsync(ApplicationSettingsManager.GetSupportURL() + "/api/HelpDesk/Insert", content);
            var contents = await responseFromRemote.Content.ReadAsStringAsync();
            var status =  responseFromRemote.StatusCode;
            response.StatusCode = status;
            response.Content = new StringContent(contents);
            return response;
        }

        [HttpGet]
        public HttpResponseMessage Types()
        {
            HttpResponseMessage response = new HttpResponseMessage();
            //try
            //{
                DataTable resultTable = new DataTable();
                using (SqlConnection connection = new SqlConnection(DBConnectionManager.GetTargetConnection()))
                {
                    using (SqlCommand command = new SqlCommand("SELECT * FROM config.REFTREE_SEGREF_VI_TIPSEG_L", connection))
                    {
                        command.Connection.Open();
                        resultTable.Load(command.ExecuteReader());
                        command.Connection.Close();
                    }
                }
                response.Content = new StringContent(JsonConvert.SerializeObject(resultTable), Encoding.UTF8, "application/json");
                response.StatusCode = HttpStatusCode.OK;
            //}
            //catch (Exception ex)
            //{
            //    response.Content = new StringContent(ex.Message);
            //    response.StatusCode = HttpStatusCode.InternalServerError;
            //}
            return response;
        }

        public bool CheckAllowedIPs (string ip)
        {
            string AllowedServerIPsForHelpdesk = ConfigurationManager.AppSettings["AllowedServerIPsForHelpdesk"];
            if (AllowedServerIPsForHelpdesk == null)
            {
                return false;
            }
            if (ip.Contains(","))
                ip = ip.Split(',')[0].TrimEnd();

            string[] allowedIPsToCheck = AllowedServerIPsForHelpdesk.ToString().Split('|');
            foreach (string allowedIPToCheck in allowedIPsToCheck)
            {
                if (allowedIPToCheck == ip)
                {
                    return true;
                }
            }

            return false;
        }

        public byte[] GetByteKey()
        {
            MFConfiguration.ApplicationInstanceConfiguration config = new MFConfiguration().GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
            return Convert.FromBase64String(config.RefDWGAESKey); ;
        }

        public class Data
        {
            public string Email { get; set; }
            public string Username { get; set; }
            public int TypeID { get; set; }
            public string Description { get; set; }
            public string Url { get; set; }
            public string GridName { get; set; }
            public string ApplicationInstanceName { get; set; }
            public List<File> Files { get; set; }
            public List<RawFile> RawFiles { get; set; }
        }

        public class File
        {
            public string name { get; set; }
            public string ext { get; set; }
            public int size { get; set; }
            public string Base64Content { get; set; }
        }

        public class RawFile
        {
            public string Name { get; set; }
            public string TmpFile { get; set; }
        }
    }
}
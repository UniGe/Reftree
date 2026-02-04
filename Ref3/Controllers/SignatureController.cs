using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;
using MagicFramework.Helpers;
using System.Data;
using System.Net;
using System.IO;
using Ref3.Models;
using System.Diagnostics;
using Newtonsoft.Json.Linq;
using System.Web;
using System.Configuration;
using MagicFramework.Controllers.ActionFilters;

namespace Ref3.Controllers
{
    [ExceptionFilter]
    public class SignatureController : ApiController
	{
        // POST api/<controller>

        private static string CreatePermanentJobUrl = ConfigurationManager.AppSettings["SignatureCreatePermanentJobUrl"];
        private static string ClientId = ConfigurationManager.AppSettings["SignatureClientId"].ToString(); //"idsign-coll-ideare";
        private static string ClientSecret = ConfigurationManager.AppSettings["SignatureClientSecret"].ToString(); // "idsign-coll-ideare";
        private static string IdSignBaseUrl = ConfigurationManager.AppSettings["IdSignBaseUrl"].ToString(); //"https://idsign-collaudo.aliaslab.net/";
        private static string BaseUrl = IdSignBaseUrl + "IDSign.Snap.Integration/";
        private const string Scopes = "ids-sessionlifecycle ids-provisioning ids-webhooks ids-pdfservices ids-datarelay ids-web ids-fdq ids-scbroker ids-scheduler ids-integration";
        private const string CreateJobUrlPath = "api/Interaction/createJobUrl";
        private const string TokenPath = "IDSign.IdP/connect/token";
        private const string CreateJobPath = "api/Interaction/createJob";
        private const string GetJobsInfoPath = "api/interaction/getJobsInfo";
        private const string GetJobStructurePath = "api/interaction/getJobStructure";
        private const string CreateSessionStored = "Custom.usp_writeSignatureLog";
        private const string WebHookStored = "Custom.usp_writeSignatureLog";
        private const string GetSignedDocsStored = "Custom.usp_writeSignatureLog";
        private const string getSignedDocumentsPath = "api/interaction/getSignedDocuments";
        private const string ArchiveJobsPath = "api/interaction/archiveJob";
        private const string PermanentJobUrl = "api/interaction/createPermanentJobUrl";

        // const string FiscalCode = "UUUUMO00A00A001A";
        const string viewSuite = "default";
		const string viewTheme = "default";

        /// <summary>
        /// Called from Alias lab when an event occurs on their side ... 
        /// </summary>
        /// <param name="id">it's the applicationInstanceName</param>
        /// <param name="data">{ “id”: “7957709c - f682 - e911 - 80c9 - 005056a946e0”,“jobId”: “7957709c - f682 - e911 - 80c9 - 005056a946e0”,“eventType”: “OnSigningCompletion”}</param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage AliasWebHook(string id,dynamic data)
        {
            HttpResponseMessage response = new HttpResponseMessage();
            string logpath = ConfigurationManager.AppSettings["logpath"];

            try
            {
                //{
                //“id”: “7957709c - f682 - e911 - 80c9 - 005056a946e0”,
                //“jobId”: “7957709c - f682 - e911 - 80c9 - 005056a946e0”,
                //“eventType”: “OnSigningCompletion”
                //}
                MFLog.LogInFile(DateTime.Now.ToShortTimeString() +" called for application: "+ id +" with data: " +  Newtonsoft.Json.JsonConvert.SerializeObject(data), MFLog.logtypes.INFO, "AliasWebHook.txt", logpath);

                string jobId = data.jobId;
                List<string> jobIds = new List<string>();
                jobIds.Add(jobId);
                string token = GetToken(ClientId, ClientSecret, Scopes);
                using (HttpClient client = new HttpClient())
                {
                    // Setting request header
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);


                    // Serializing object
                    string jsonBody = JsonConvert.SerializeObject(jobIds);

                    StringContent content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

                    // Executing request
                    UriBuilder uriBuilder = new UriBuilder(BaseUrl + GetJobsInfoPath);

                    MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " calling " + GetJobsInfoPath, MFLog.logtypes.INFO, "AliasWebHook.txt", logpath);

                    HttpResponseMessage result = client.PostAsync(uriBuilder.ToString(), content).Result;

                    MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " called " + GetJobsInfoPath, MFLog.logtypes.INFO, "AliasWebHook.txt", logpath);

                    // Throwing exception if result is not OK
                    if (result.StatusCode != HttpStatusCode.OK)
                    {
                        MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " - KO! " + GetJobsInfoPath, MFLog.logtypes.ERROR, "AliasWebHook.txt", logpath);
                        throw new HttpRequestException($"{result.StatusCode.ToString()} {result.Content.ReadAsStringAsync().Result}");
                    }
                    string resJobInfo = result.Content.ReadAsStringAsync().Result;

                    MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " " + GetJobsInfoPath + " successfully responded with result: " + resJobInfo, MFLog.logtypes.INFO, "AliasWebHook.txt", logpath);

                    //Getting response body
                    dynamic jobInfo = JsonConvert.DeserializeObject(resJobInfo);

                    MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " - OK, deserialized result of " + GetJobsInfoPath, MFLog.logtypes.INFO, "AliasWebHook.txt", logpath);

                    //call for structure 
                    ReturnInfos returnInfoRequest = new ReturnInfos()
                    {
                        withActors = true
                    };

                    // Constructing query
                    jsonBody = JsonConvert.SerializeObject(returnInfoRequest);

                    content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

                    // Executing request
                    uriBuilder = new UriBuilder(BaseUrl + GetJobStructurePath)
                    {
                        Query = $"jobId={jobId}"
                    };

                    MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " calling " + GetJobStructurePath, MFLog.logtypes.INFO, "AliasWebHook.txt", logpath);


                    HttpResponseMessage resultStructure = client.PostAsync(uriBuilder.ToString(), content).Result;

                    // Throwing exception if result is not OK
                    if (resultStructure.StatusCode != HttpStatusCode.OK)
                    {
                        MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " - KO! " + GetJobStructurePath, MFLog.logtypes.ERROR, "AliasWebHook.txt", logpath);
                        throw new HttpRequestException($"{resultStructure.StatusCode.ToString()} {resultStructure.Content.ReadAsStringAsync().Result}");
                    }
                    //Getting response body
                    string responseBody = resultStructure.Content.ReadAsStringAsync().Result;

                    MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " " + GetJobStructurePath + " successfully responded with result: " + responseBody, MFLog.logtypes.INFO, "AliasWebHook.txt", logpath);

                    // Deserializing
                    dynamic objResult = JsonConvert.DeserializeObject(responseBody);

                    MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " - OK, deserialized result of " + GetJobStructurePath, MFLog.logtypes.INFO, "AliasWebHook.txt", logpath);


                    string currentHost = HttpContext.Current.Request.Url.Authority;
                    var conf = new MFConfiguration(currentHost).GetApplicationInstanceByInstanceName(currentHost, id);
                    DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                    var o = JObject.FromObject(new { JobID = jobId, actorsData= jobInfo, jobStruture = objResult, eventData = data, logAction = "ExternalEvent", Status = "TOBEPROCESSED" });

                    try
                    {
                        o["jobStruture"]["parametersValue"] = "overwritten_from_signaturecontroller";
                        o["jobStruture"]["attributesValue"] = "overwritten_from_signaturecontroller";
                    }
                    catch (Exception ex) {
                        MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " -Error overwriting attribute from jobStructure: " + ex.Message, MFLog.logtypes.INFO, "AliasWebHook.txt", logpath);
                    }

                    MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " - going to convert in XML: " + JsonConvert.SerializeObject(o), MFLog.logtypes.INFO, "AliasWebHook.txt", logpath);

                    DataSet ds = dbutils.GetDataSetFromStoredProcedure(WebHookStored, o, conf.TargetDBconn);

                    if (ds.Tables.Count > 0)
                    {
                        if (ds.Tables[0].Rows.Count > 0)
                        {
                            bool hastoarchive = bool.Parse(ds.Tables[0].Rows[0]["Archive"].ToString());
                            if (hastoarchive)
                            {
                                // Executing request
                                UriBuilder uriBuilderArchive = new UriBuilder(BaseUrl + ArchiveJobsPath)
                                {
                                    Query = $"jobId={jobId}"
                                }; ;


                                HttpResponseMessage resultArchive = client.PostAsync(uriBuilderArchive.ToString(),new StringContent("")).Result;

                                var oarch = JObject.FromObject(new { JobID = jobId, logAction = "Archived", Status = "SUCCESS" });
                                // Throwing exception if result is not OK
                                if (resultArchive.StatusCode != HttpStatusCode.OK)
                                {
                                    oarch["Status"] = "ERROR";
                                    dbutils.GetDataSetFromStoredProcedure(WebHookStored, oarch, conf.TargetDBconn);
                                    throw new HttpRequestException($"{resultArchive.StatusCode.ToString()} {resultArchive.Content.ReadAsStringAsync().Result}");
                                }
                                dbutils.GetDataSetFromStoredProcedure(WebHookStored, oarch, conf.TargetDBconn);
                            }
                        }
                    }

                }

                    response.StatusCode = HttpStatusCode.OK;
                    response.Content = new StringContent("Successfully called");
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(ex.Message);
                MFLog.LogInFile(DateTime.Now.ToShortTimeString() + " called for application: " + id + " with data: " + Newtonsoft.Json.JsonConvert.SerializeObject(data) + " with error: " + ex.Message, MFLog.logtypes.ERROR, "AliasWebHook.txt", logpath);

            }
            return response;
        }


        [HttpPost]
        public HttpResponseMessage GetSignedDocsFromAliasLab(dynamic data)
        {
            var response = new HttpResponseMessage();
            try
            {
                string token = GetToken(ClientId, ClientSecret, Scopes);

                // Upload resources on microservice IDSign.DataRelay

                using (HttpClient client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/octet-stream"));
                    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);

                    //XML retrival
                    DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                    DataSet ds = dbutils.GetDataSetFromStoredProcedure("Custom.usp_getSignedJobsToDownload", data);

                    List<string> jobIds = new List<string>();
                    foreach (DataRow dr in ds.Tables[0].Rows)
                    {
                        jobIds.Add(dr["JobID"].ToString());
                    }
                    foreach (var jobid in jobIds)
                    {
                        var uriBuilder = new UriBuilder(BaseUrl + getSignedDocumentsPath)
                        {
                            Query = $"jobId={jobid}&withAttachments=true"
                        };
                        var result = client.GetAsync(uriBuilder.ToString()).Result;
                        if (result.StatusCode != HttpStatusCode.OK)
                        {
                            throw new HttpRequestException($"{result.StatusCode.ToString()} {result.Content.ReadAsStringAsync().Result}");
                        }
                        //Getting response body
                        string responseBody = result.Content.ReadAsStringAsync().Result;
                        // Deserializing
                        dynamic objResult = JsonConvert.DeserializeObject(responseBody);

                        string rootdir = ApplicationSettingsManager.GetRootdirforupload();
                        List<string> docs = new List<string>();
                        List<string> atts = new List<string>();
                        if (objResult != null && objResult.documents != null)
                            foreach (var doc in objResult.documents)
                            {
                                string filename = DateTime.Now.Ticks.ToString() + "_" + doc.filename;
                                if (!Path.HasExtension(filename))
                                    filename = filename + ".pdf";
                                docs.Add(filename);
                                string base64file = doc.dataBase64;
                                byte[] filecontent = Convert.FromBase64String(base64file);
                                File.WriteAllBytes(Path.Combine(rootdir, filename), filecontent);
                            }

                        if (objResult != null && objResult.attachments != null)
                            foreach (var att in objResult.attachments)
                            {
                                string filename = DateTime.Now.Ticks.ToString() + "_" + att.filename;
                                if (!Path.HasExtension(filename))
                                    filename = filename + ".pdf";
                                atts.Add(filename);
                                string base64file = att.dataBase64;
                                byte[] filecontent = Convert.FromBase64String(base64file);
                                File.WriteAllBytes(Path.Combine(rootdir, filename), filecontent);
                            }
                        var o = JObject.FromObject(new { JobID = jobid, Documents = docs, Attachments= atts, logAction = "GotSignedDocuments", Status = "SUCCESS" });
                        dbutils.GetDataSetFromStoredProcedure(GetSignedDocsStored, o);
                    }
                
                }
            }
            catch (Exception ex) {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(ex.Message);
                return response;
            }
            response.StatusCode = HttpStatusCode.OK;
            response.Content = new StringContent("{ \"message\":\"Lo scarico dei documenti è avvenuto con successo\", \"msgtype\":\"info\"}");
            return response;
        }

		[HttpPost]
		public HttpResponseMessage SignWithAliasLab(dynamic data)
		{
			// Get access token from microservice IDSign.Idp
			var response = new HttpResponseMessage();
			List<String> responseList = new List<String>();
			try
			{
				string token = GetToken(ClientId, ClientSecret, Scopes);

                // Upload resources on microservice IDSign.DataRelay

                using (HttpClient client = new HttpClient())
                {
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/octet-stream"));
                    client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);

                    //XML retrival
                    DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                    DataSet ds = dbutils.GetDataSetFromStoredProcedure("Custom.usp_getSignatureXMLConfig", data);

                    if (ds.Tables.Count < 2)
                    {
                        throw new ArgumentException("Stored procedure data incomplete (must return 2 data tables)");
                    }

                    List<ActorsData> actors = new List<ActorsData>();

                    foreach (DataRow dr in ds.Tables[1].Rows)
                    {
                        ActorsData ad = new ActorsData();
                        ad.ID = int.Parse(dr["ID"].ToString());
                        ad.actorId = int.Parse(dr["actorId"].ToString());
                        ad.FiscalCode = dr["FiscalCode"].ToString();
                        ad.SigningMode = dr["SigningMode"].ToString();
                        if (ds.Tables[1].Columns.Contains("BackMode"))
                            ad.BackMode = dr.Field<string>("BackMode");
                        if (ds.Tables[1].Columns.Contains("PhoneNumber"))
                            ad.PhoneNumber = dr.Field<string>("PhoneNumber");
                        if (ds.Tables[1].Columns.Contains("AuthType"))
                            ad.AuthenticationType = dr.Field<int>("AuthType");//0,1,3
                        actors.Add(ad);
                    }

                    for (var i= 0; i < ds.Tables[0].Rows.Count; i++) {
                        string db_id = ds.Tables[0].Rows[i]["ID"].ToString();
                        string configurationXML = ds.Tables[0].Rows[i]["XMLConfig"].ToString();
                        string filenames = ds.Tables[0].Rows[i]["FilesNames"].ToString();
                        string signaturetype = ds.Tables[0].Rows[i]["SignatureType"].ToString();
                        //ds.Tables[0].Rows
                        string output_path = ApplicationSettingsManager.GetRootdirforupload();
                        //string fileNameXML = "xml_descriptor.xml";
                        //string finalPathXML = Path.Combine(output_path, fileNameXML);


                        //byte[] fileXML = File.ReadAllBytes(finalPathXML);

                        byte[] fileXML = Encoding.ASCII.GetBytes(configurationXML);


                        string[] fnames = filenames.Split(',');
                        List<string> fcontents = new List<string>();
                        //Files must be converted to pdf if they are word docs, placeholders in pdf will be replaced by signature fields and finally will be converted to BASE64
                        foreach (var f in fnames)
                        {
                            string fileNamePDF = Path.Combine(output_path, f);
                            if (Path.GetExtension(f) != ".pdf")
                                fileNamePDF = PdfHelper.generatePdfFromWord(Path.Combine(output_path, f));
                            //   string pdfWithSignatureFields = Path.Combine(output_path, DateTime.Now.Ticks.ToString() + "_" + Path.GetFileNameWithoutExtension(fileNamePDF) + "_tobesigned.pdf");
                            
                            //replace placeholders with signature fields
                            //PdfHelper ph = new PdfHelper(fileNamePDF, pdfWithSignatureFields);
                            //ph.replaceStringWithSignatureField('§');
                            //string finalPathPDF = Path.Combine(output_path, fileNamePDF);
                            byte[] filePDF = File.ReadAllBytes(fileNamePDF);
                            fcontents.Add(Convert.ToBase64String(filePDF));
                        }
                        string currentHost = HttpContext.Current.Request.Url.Authority;

                        string currentProtocol = ConfigurationManager.AppSettings["SignatureProtocolWebhook"]
                            ?? HttpContext.Current?.Request?.Url?.Scheme
                            ?? "http";

                        string applicationInstanceName = ApplicationSettingsManager.GetAppInstanceName();
                        UriBuilder ubWhook = new UriBuilder(currentProtocol, currentHost + "/api/Signature/AliasWebHook/" + applicationInstanceName);
                       
                        // Constructing request body
                        ALAB_CreateJobRequest createRequest = new ALAB_CreateJobRequest
                        {
                            XmlDescriptorBase64 = Convert.ToBase64String(fileXML),
                            DocumentsBase64 = fcontents.ToArray(),
                            Freeze = true,
                            WebHooks = new WebHooks()
                            {
                                  SubscriptionUrl = ubWhook.ToString()   ,
                                  LossLess = true
                            }
                        };

                        // Serializing body
                        string jsonBody = JsonConvert.SerializeObject(createRequest);

                        // Constructing request
                        StringContent content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
                        UriBuilder uriBuilder = new UriBuilder(BaseUrl + CreateJobPath);

                        // Executing request
                        HttpResponseMessage result = client.PostAsync(uriBuilder.ToString(), content).Result;

                        // Throwing exception if result is not OK
                        if (result.StatusCode != HttpStatusCode.OK)
                        {
                            throw new HttpRequestException($"{result.StatusCode.ToString()} {result.Content.ReadAsStringAsync().Result}");
                        }

                        // Extracting response
                        dynamic response_ = JsonConvert.DeserializeObject(result.Content.ReadAsStringAsync().Result);
                        string jobId = response_["jobId"];

                        //ALAB_ViewRequest viewReq = new ALAB_ViewRequest
                        //{
                        //    ViewSuite = viewSuite,
                        //    ViewTheme = viewTheme,
                        //    SigningMode = signaturetype
                        //};

                        //string url = CreateJobUrl(jobId, viewReq, token);
                        //TODO write urls and jobId into database 
                        List<ActorsData> sessionActors = actors.FindAll(x => x.ID == int.Parse(db_id));
                        AddJobUrltoActors(IdSignBaseUrl, jobId, token, sessionActors, viewTheme, viewSuite,ClientId);

                        try {
                            var o = JObject.FromObject(new { ID= db_id, JobID= jobId , actors= sessionActors , logAction = "OpenSession" , Status = "SUCCESS"});
                            dbutils.GetDataSetFromStoredProcedure(CreateSessionStored, o);
                        }
                        catch (Exception err) {
                            Debug.WriteLine(err.Message);
                        }

                    }
                }
             }


			catch (Exception ex)
			{
				response.StatusCode = HttpStatusCode.InternalServerError;
				response.Content = new StringContent(ex.Message);
               
                return response;
			}
			//String[] responseArray = responseList.ToArray();
			//var json = JsonConvert.SerializeObject(responseArray);
			response.StatusCode = HttpStatusCode.OK;
			response.Content = new StringContent("{ \"message\":\"Il processo di firma è stato inizializzato con successo\", \"msgtype\":\"info\"}");
            return response;
		}



        /// <summary>
        /// Gets authorization token from IDSign.IDP
        /// </summary>
        /// <param name="clientId">clientId</param>
        /// <param name="clientSecret">clientSecret</param>
        /// <param name="scopes">list of scopes</param>
        /// <returns>string token with format "Bearer <TOKEN>"</returns>
        private static string GetToken(string clientId, string clientSecret, string scopes)
        {
            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                // Adding credentials and scopes
                var content = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type", "client_credentials"),
                    new KeyValuePair<string, string>("client_id", clientId),
                    new KeyValuePair<string, string>("client_secret", clientSecret),
                    new KeyValuePair<string, string>("scope", scopes)
                });

                UriBuilder uriBuilder = new UriBuilder(IdSignBaseUrl + TokenPath);

                // Executing request
                HttpResponseMessage result = client.PostAsync(uriBuilder.ToString(), content).Result;

                // Throwing exception if result is not OK
                if (result.StatusCode != HttpStatusCode.OK)
                {
                    throw new HttpRequestException($"{result.StatusCode.ToString()} {result.Content.ReadAsStringAsync().Result}");
                }

                // Deserializing
                dynamic objResult = JsonConvert.DeserializeObject(result.Content.ReadAsStringAsync().Result);

                // Returning token
                return $"{objResult["token_type"]} {objResult["access_token"]}";
            }
        }

       /// <summary>
       /// Fills the urls for actors 
       /// </summary>
       /// <param name="baseurl">alias lab base url</param>
       /// <param name="jobId">their joibid</param>
       /// <param name="token">their token</param>
       /// <param name="actors">the list of actors for this session</param>
       /// <param name="viewTheme">Css applied</param>
       /// <param name="viewSuite">Front end setting</param>
        public static void AddJobUrltoActors(string baseurl,string jobId, string token, List<ActorsData> actors,string viewTheme, string viewSuite,string clientId)
        {
            //https://idsign-collaudo.aliaslab.net/IDSign.Web/WebApp/Mobile?idsign_config=
            // "{0}/IDSign.Web/WebApp/Mobile?idsign_config={1}&access_token={2}#/operation/{3}";
            //https://idsign-collaudo.aliaslab.net/IDSign.Site.Extensions/Access/Open?lang=it&clientId=idsign-coll-ideare&jobId=<jobId>&idsign_config=<idsign_config>
            foreach (var a in actors)
            {
                ALAB_ViewRequest vr = new ALAB_ViewRequest();
                vr.FiscalCode = a.FiscalCode;
              //  vr.SigningMode = a.SigningMode;
                vr.userInterface = new ALAB_UserInterface();
                vr.userInterface.ViewSuite = viewSuite;
                vr.userInterface.ViewTheme = viewTheme;
         
                string conf = HttpUtility.UrlEncode(Newtonsoft.Json.JsonConvert.SerializeObject(vr, Formatting.None,
                                                              new JsonSerializerSettings // Ignoring null members
                                                              {
                                                                  NullValueHandling = NullValueHandling.Ignore
                                                              }));
                //string tokenWithoutBearer = token.Replace("Bearer ","");
                //with auth
                //a.url = String.Format("{0}IDSign.Web/WebApp/Mobile/?access_token={2}&idsign_config={1}#/operation/{3}", baseurl, conf, tokenWithoutBearer, jobId);
                //without auth, token is always renewed
                bool createPermanent = false;
                if (!string.IsNullOrEmpty(CreatePermanentJobUrl))  
                    createPermanent = bool.Parse(CreatePermanentJobUrl);
                
                if (createPermanent) {
                    PermanentUrlData purl = new PermanentUrlData(a.FiscalCode, a.PhoneNumber, clientId, jobId,a.BackMode,a.SigningMode,a.AuthenticationType);
                    a.url = CreatePermanentJobUrlApi(purl, token);
                }
                else
                    a.url = String.Format("{0}IDSign.Site.Extensions/Access/Open?lang=it&clientId={1}&jobId={2}&idsign_config={3}", baseurl, clientId, jobId,conf);
            }
        }

        /// <summary>
        /// Getting signing view URL from createJobUrl method in IDSign.Snap.Integration
        /// </summary>
        /// <param name="jobId">Job Id</param>
        /// <param name="viewReq">View request parameters</param>
        /// <param name="token">Authorization token</param>
        /// <returns>Signing view URL</returns>
        private static string CreateJobUrl(string jobId, ALAB_ViewRequest viewReq, string token)
        {
            using (HttpClient client = new HttpClient())
            {
                // Setting request header
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);

                // Serializing object
                string jsonBody = JsonConvert.SerializeObject(viewReq,
                                                              Formatting.None,
                                                              new JsonSerializerSettings // Ignoring null members
                                                              {
                                                                  NullValueHandling = NullValueHandling.Ignore
                                                              });

                StringContent content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

                // Executing request
                UriBuilder uriBuilder = new UriBuilder(BaseUrl + CreateJobUrlPath)
                {
                    Query = $"jobId={jobId}"
                };

                HttpResponseMessage result = client.PostAsync(uriBuilder.ToString(), content).Result;

                // Throwing exception if result is not OK
                if (result.StatusCode != HttpStatusCode.OK)
                {
                    throw new HttpRequestException($"{result.StatusCode.ToString()} {result.Content.ReadAsStringAsync().Result}");
                }

                //Getting response body
                dynamic response = JsonConvert.DeserializeObject(result.Content.ReadAsStringAsync().Result);
                return response["jobUrl"];
            }
        }

        /// <summary>
        /// Getting signing view URL from createJobUrl method in IDSign.Snap.Integration
        /// </summary>
        /// <param name="jobId">Job Id</param>
        /// <param name="viewReq">View request parameters</param>
        /// <param name="token">Authorization token</param>
        /// <returns>Signing view URL</returns>
        private static string CreatePermanentJobUrlApi(PermanentUrlData viewReq, string token)
        {
            using (HttpClient client = new HttpClient())
            {
                // Setting request header
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", token);

                // Serializing object
                string jsonBody = JsonConvert.SerializeObject(viewReq,
                                                              Formatting.None,
                                                              new JsonSerializerSettings // Ignoring null members
                                                              {
                                                                  NullValueHandling = NullValueHandling.Ignore
                                                              });

                StringContent content = new StringContent(jsonBody, Encoding.UTF8, "application/json");

                // Executing request
                UriBuilder uriBuilder = new UriBuilder(BaseUrl + PermanentJobUrl);
                

                HttpResponseMessage result = client.PostAsync(uriBuilder.ToString(), content).Result;

                // Throwing exception if result is not OK
                if (result.StatusCode != HttpStatusCode.OK)
                {
                    throw new HttpRequestException($"{result.StatusCode} {result.Content.ReadAsStringAsync().Result}");
                }

                //Getting response body
                dynamic response = JsonConvert.DeserializeObject(result.Content.ReadAsStringAsync().Result);
                return response["jobUrl"];
            }
        }

    }
}
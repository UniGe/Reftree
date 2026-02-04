using MagicFramework.Helpers;
using System;
using System.Data;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Web.Http;

namespace MagicFramework.Controllers
{
    public class PowerBiController : ApiController
    {
        [HttpPost]
        public HttpResponseMessage GetEmbedLink(dynamic data)
        {
            var response = new HttpResponseMessage();

            try
            {               
                var dbutils = new DatabaseCommandUtils();
                DataSet ds = new DataSet();

                ds = dbutils.GetDataSetFromStoredProcedure("dbo.Magic_GetPowerBI_GUIDs", data);
                DataTable spTable = ds.Tables[0];

                if (spTable.Rows.Count > 0)
                {
                    DataRow spRow = spTable.Rows[0];

                    bool hasFilterData = Convert.ToBoolean(spRow["FilterData"].ToString());
                    string filterTable = SessionHandler.PowerBiFilterTable;

                    string workspaceId = spRow["workspaceId"].ToString();
                    string reportId = spRow["reportId"].ToString();
                    string client = SessionHandler.ApplicationInstanceName;
                    client = client.ToLower();

                    string url = "/client/"+client+"/workspace/"+workspaceId+"/report/"+reportId+"/oneTimeAccessToken";

                    if(hasFilterData && (filterTable != null && filterTable.Length >0)) {
                        
                        int userID = SessionHandler.IdUser;
                        int userGroupVisibilityID = SessionHandler.UserVisibilityGroup;
                       // string filter = "?filter=" + filterTable + "/UserID eq " + userID + " and " + filterTable + "/UserGroupVisibilityID eq " + userGroupVisibilityID;
                        string filter = "?filter=" + filterTable + "%2FUserID%20eq%20" + userID + "%20and%20" + filterTable + "/UserGroupVisibilityID%20eq%20" + userGroupVisibilityID;
                        url += filter;
                    }

                    HttpWebResponse apiTokenCall = HTTP.CallAPI(GetURL(url), GetToken, null, "POST");

                    Stream receiveStream = apiTokenCall.GetResponseStream();
                        
                    Encoding encode = System.Text.Encoding.GetEncoding("utf-8");
                    StreamReader readStream = new StreamReader(receiveStream,encode);

                    string oneTimeAccessToken = null;

                    oneTimeAccessToken = readStream.ReadToEnd();                   

                    apiTokenCall.Close();
                    readStream.Close();

                    response.StatusCode = HttpStatusCode.OK;
                    response.Content = new StringContent(oneTimeAccessToken);
                }
                else
                {
                    throw new Exception("No matching PowerBI-ids found in tables [Magic_PowerBIWorkspace], [Magic_PowerBIReport].");
                }
                
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("Magic_Templates: GetPowerBiFrame failed with message -{0}", ex.Message));
            }

            return response;
        }

        const string CACHE_TOKEN_PREFIX = "POWER_BI_SERVICE_TOKEN";
        const double TOKEN_VALID_FOR_MINUTES = 10;
        readonly static string[] SCOPES = new string[] { "ALL_ALLOWED" };
        private static string GetToken(bool isRefreshToken)
        {
            return HTTP.InstanceCache(CACHE_TOKEN_PREFIX, RequestAccessToken, isRefreshToken);
        }

        private static string RequestAccessToken()
        {
            string client = SessionHandler.ApplicationInstanceName;
            client = client.ToLower();

            var httpWebRequest = (HttpWebRequest)WebRequest.Create(GetURL("/client/" + client + "/apiToken"));
            httpWebRequest.ContentType = "application/json";
            httpWebRequest.Method = "POST";
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(new
            {
                apiKey = GetApiKey(),
                scopes = SCOPES,
                validUntil = DateTime.Now.AddMinutes(TOKEN_VALID_FOR_MINUTES),
            });

            using (var streamWriter = new StreamWriter(httpWebRequest.GetRequestStream()))
            {
                streamWriter.Write(json);
            }

            HttpWebResponse httpResponse;
            try
            {
                httpResponse = (HttpWebResponse)httpWebRequest.GetResponse();
                if (httpResponse.StatusCode == HttpStatusCode.OK)
                {
                    using (var streamReader = new StreamReader(httpResponse.GetResponseStream()))
                    {
                        return Newtonsoft.Json.JsonConvert.DeserializeObject<TokenResponse>(streamReader.ReadToEnd()).Token;
                    }
                }
            }
            catch (WebException e)
            {
                httpResponse = e.Response as HttpWebResponse;
                throw HTTPException.New(e, httpWebRequest, httpResponse);
            }

            throw HTTPException.New(httpWebRequest, httpResponse);
        }

        private static string GetURL(string path)
        {
            string authority = SessionHandler.PowerBiServiceUrl;
            
            if (string.IsNullOrEmpty(authority))
            {
                throw new Exception("PowerBiServiceUrl is null or empty - please set it in the application instance configuration.");
            }

            return authority + path;            
        }

        private static string GetApiKey()
        {
            string apiKey = SessionHandler.PowerBiServiceApiKey;
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new Exception("PowerBiServiceApiKey is null or empty - please set it in the application instance configuration.");
            }
            return apiKey;
        }

        private class TokenResponse
        {
            public string Token { get; set; }
        }

    }

}

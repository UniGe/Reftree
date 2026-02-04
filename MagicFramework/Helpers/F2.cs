using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Caching;

namespace MagicFramework.Helpers
{
    public static class F2
    {
        const string CACHE_TOKEN_PREFIX = "F2_TOKEN";
        const double TOKEN_VALID_FOR_DAYS = 1.5;
        public const string F2_FILE_PREFIX = "F2_FILE_";

        readonly static string[] SCOPES = new string[] { "ALL_ALLOWED" };

        public static HttpWebResponse CallAPI(string path, object data = null)
        {
            if (!SessionHandler.CheckActiveSession())
            {
                throw new Exception("session expired, please login again");
            }

            return HTTP.CallAPI(GetURL(path), GetToken, data);
        }

        public static F2FileInfo PostFileInfo(string name, int size, F2FileAccessPost[] access)
        {
            var result = CallAPI("/api/files", new { name, size_in_bytes = size, access });
            return JsonConvert.DeserializeObject<F2FileInfo>(HTTP.ContentToString(result));
        }

        public static F2FileInfo[] GetFileInfo(string[] fileUIDs)
        {
            F2Filter filter = new F2Filter { Logic = "or" };
            List<F2Filter> uids = new List<F2Filter>();
            foreach (string uid in fileUIDs)
            {
                uids.Add(new F2Filter { Value = uid, Field = "uid", });
            }
            filter.Filters = uids.ToArray();
            var result = CallAPI($"/api/files?q={GetFilterParamValue(filter)}");
            string content = HTTP.ContentToString(result);
            return JsonConvert.DeserializeObject<F2FileInfo[]>(content, new JsonSerializerSettings { ContractResolver = new DefaultContractResolver { NamingStrategy = new SnakeCaseNamingStrategy() } });
        }

        private static string GetFilterParamValue(F2Filter filter)
        {
            return Utils.Base64Encode(
                $"{{\"where\":{ JsonConvert.SerializeObject(filter, new JsonSerializerSettings { ContractResolver = new DefaultContractResolver { NamingStrategy = new CamelCaseNamingStrategy() } })}}}"
            );
        }

        private static string GetURL(string path)
        {
            string authority = new MFConfiguration().GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).F2URLAuthority;
            if (string.IsNullOrEmpty(authority))
            {
                throw new Exception("F2 F2URLAuthority is null or empty - please config it in the application instance configuration");
            }
            if (!authority.StartsWith("http"))
            {
                authority = "https://" + authority;
            }
            return authority + path;
        }

        private static string GetApiKey()
        {
            string apiKey = new MFConfiguration().GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId).F2APIKey;
            if (string.IsNullOrEmpty(apiKey))
            {
                throw new Exception("F2 F2APIKey is null or empty - please config it in the application instance configuration");
            }
            return apiKey;
        }

        private static string GetToken(bool isRefreshToken)
        {
            return HTTP.InstanceCache(CACHE_TOKEN_PREFIX, RequestAccessToken, isRefreshToken);
        }

        private static string RequestAccessToken()
        {
            var httpWebRequest = (HttpWebRequest)WebRequest.Create(GetURL("/api/tokens"));
            httpWebRequest.ContentType = "application/json";
            httpWebRequest.Method = "POST";
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(new
            {
                apiKey = GetApiKey(),
                scopes = SCOPES,
                validUntil = DateTime.Now.AddDays(TOKEN_VALID_FOR_DAYS),
            });

            using (var streamWriter = new StreamWriter(httpWebRequest.GetRequestStream()))
            {
                streamWriter.Write(json);
            }

            HttpWebResponse httpResponse;
            try {
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

    }

    public class TokenResponse
    {
        public string Token { get; set; }
    }

    public class F2FileAdditionalInfo
    {
        public string ApiTokenUid { get; set; }
        public string Origin { get; set; }
    }

    public class F2FileInfo
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string MimeType { get; set; }
        public int SizeInBytes { get; set; }
        public DateTime? DeletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsPublic { get; set; }
        public string Uid { get; set; }
        public F2FileAdditionalInfo AdditionalInfo { get; set; }
    }

    public class F2FileAccessPost
    {
        [JsonProperty("roleUID")]
        public string RoleUID { get; set; }
        [JsonProperty("read")]
        public bool Read { get; set; }
        [JsonProperty("delete")]
        public bool Delete { get; set; }
    }

    public class F2Filter
    {
        public string Operator { get; set; }
        public string Logic { get; set; }
        public string Field { get; set; }
        public string Value { get; set; }
        public F2Filter[] Filters { get; set; }
    }

}
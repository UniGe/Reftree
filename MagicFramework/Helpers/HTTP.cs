using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;

namespace MagicFramework.Helpers
{
    public static class HTTP
    {
        public static string InstanceCacheKey(string prefix, string instanceURL = null, string instanceID = null)
        {
            return prefix + "_" + instanceURL ?? SessionHandler.ApplicationDomainURL + "_" + instanceID ?? SessionHandler.ApplicationInstanceId + "_";
        }

        /// <summary>
        /// Calls an url with AUTHORIZATION header set to the result of "getAccessToken(false)" function, if "data" is passed, the HTTP method is a POST otherwise a GET.
        /// The "data" is converted to a JSON body. If the first call returns HTTP status code Unauthorized a second call is made with token obtained from "getAccessToken(true)"
        /// </summary>
        /// <param name="url"></param>
        /// <param name="getAccessToken"></param>
        /// <param name="data"></param>
        /// <returns></returns>
        public static HttpWebResponse CallAPI(string url, Func<bool, string> getAccessToken, object data = null, string method = null, string contentType = null, string headers = null)
        {
            var call = Call(url, data, getAccessToken(false), method, contentType);
            if (call.Response.StatusCode == HttpStatusCode.Unauthorized)
            {
                call = Call(url, data, getAccessToken(true), method, contentType);
            }
            if (call.Response.StatusCode >= HttpStatusCode.OK && call.Response.StatusCode < HttpStatusCode.MultipleChoices)
            {
                return call.Response;
            }

            throw HTTPException.New(call.Request, call.Response);
        }

        private static RequestResponse Call(string url, object data = null, string token = null, string method = null, string contentType = null)
        {
            var httpWebRequest = (HttpWebRequest)WebRequest.Create(url);
            httpWebRequest.ContentType = "application/json";
            if (method != null)
            {
                httpWebRequest.Method = method;
            }
            else if (data == null)
            {
                httpWebRequest.Method = "GET";
            }
            else
            {
                httpWebRequest.Method = "POST";
            }
            if (token != null)
            {
                httpWebRequest.Headers.Add("AUTHORIZATION", token);
            }
            if (data != null)
            {
                string stringData;
                if (contentType != null)
                {
                    stringData = (string)data;
                    httpWebRequest.ContentType = contentType;
                }
                else
                {
                    stringData = Newtonsoft.Json.JsonConvert.SerializeObject(data);
                }
                using (var streamWriter = new StreamWriter(httpWebRequest.GetRequestStream()))
                {
                    streamWriter.Write(stringData);
                }
            }
            else
            {
                httpWebRequest.ContentLength = 0;
            }
            HttpWebResponse httpResponse;
            try
            {
                httpResponse = (HttpWebResponse)httpWebRequest.GetResponse();
            }
            catch (WebException e)
            {
                httpResponse = e.Response as HttpWebResponse;
            }
            return new RequestResponse
            {
                Request = httpWebRequest,
                Response = httpResponse,
            };
        }

        public static HttpWebResponse POSTFormURLEncoded(string url, string body, string token = null)
        {
            var httpWebRequest = (HttpWebRequest)WebRequest.Create(url);
            httpWebRequest.ContentType = "application/x-www-form-urlencoded";
            httpWebRequest.Method = "POST";
            if (token != null)
            {
                httpWebRequest.Headers.Add("AUTHORIZATION", token);
            }
            if (body != null)
            {
                using (var streamWriter = new StreamWriter(httpWebRequest.GetRequestStream()))
                {
                    streamWriter.Write(body);
                }
            }
            HttpWebResponse httpResponse;
            try
            {
                httpResponse = (HttpWebResponse)httpWebRequest.GetResponse();
                return httpResponse;
            }
            catch (WebException e)
            {
                httpResponse = e.Response as HttpWebResponse;
                throw HTTPException.New(httpWebRequest, httpResponse);
            }
        }

        public static string ContentToString(HttpWebResponse httpResponse)
        {
            using (var streamReader = new StreamReader(httpResponse.GetResponseStream()))
            {
                return streamReader.ReadToEnd();
            }
        }

        public static string InstanceCache(string cachePrefix, Func<string> getCacheValue = null, bool isRefresh = false, string instanceURL = null, string instanceID = null)
        {
            string cacheKey = InstanceCacheKey(cachePrefix, instanceURL, instanceID);
            if (getCacheValue == null)
            {
                return HttpRuntime.Cache.Get(cacheKey) as string;
            }

            if (isRefresh)
            {
                string value = getCacheValue();
                HttpRuntime.Cache.Remove(cacheKey);
                HttpRuntime.Cache.Insert(cacheKey, value);
                return value;
            }
            else
            {
                string value = HttpRuntime.Cache.Get(cacheKey) as string;
                if (string.IsNullOrEmpty(value))
                {
                    value = getCacheValue();
                    HttpRuntime.Cache.Insert(cacheKey, value);
                }
                return value;
            }
        }

    }

    public class HTTPException : Exception
    {
        public HttpWebResponse Response { get; set; }
        public HttpWebRequest Request { get; set; }

        public HTTPException(string message, HttpWebRequest req, HttpWebResponse res) : base(message)
        {
            this.Request = req;
            this.Response = res;
        }

        public HTTPException(Exception innerException, string message, HttpWebRequest req, HttpWebResponse res) : base(message, innerException)
        {
            this.Request = req;
            this.Response = res;
        }

        public static HTTPException New(HttpWebRequest req, HttpWebResponse res)
        {
            string message = $"URL: {req.RequestUri}";
            if (res != null)
            {
                message += $"\nStatusCode: {res.StatusCode}\n";
                message += "\nResponseBody:\n";
                using (var streamReader = new StreamReader(res.GetResponseStream()))
                {
                    message += streamReader.ReadToEnd();
                }
            }
            return new HTTPException(message, req, res);
        }

        public static HTTPException New(Exception innerException, HttpWebRequest req, HttpWebResponse res)
        {
            string message = $"URL: {req.RequestUri}";
            if (res != null)
            {
                message += $"\nStatusCode: {res.StatusCode}\n";
                message += "\nResponseBody:\n";
                using (var streamReader = new StreamReader(res.GetResponseStream()))
                {
                    message += streamReader.ReadToEnd();
                }
            }
            return new HTTPException(innerException, message, req, res);
        }

    }

    public class RequestResponse
    {
        public HttpWebResponse Response { get; set; }
        public HttpWebRequest Request { get; set; }
    }
}
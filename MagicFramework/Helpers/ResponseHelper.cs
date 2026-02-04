using Newtonsoft.Json;
using System;
using System.Net;
using System.Net.Http;

namespace MagicFramework.Helpers
{
    public static class ResponseHelper
    {
        public static HttpResponseMessage JSON(object objectToJsonSerialize, HttpStatusCode code = HttpStatusCode.OK)
        {
            var response = new HttpResponseMessage();
            response.StatusCode = code;
            response.Content = new StringContent(JsonConvert.SerializeObject(objectToJsonSerialize));
            response.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");
            return response;
        }

        public static HttpResponseMessage Status(HttpStatusCode code = HttpStatusCode.OK)
        {
            var response = new HttpResponseMessage();
            response.StatusCode = code;
            return response;
        }

        public static HttpResponseMessage Error(Exception ex, HttpStatusCode code = HttpStatusCode.InternalServerError, bool isJsonResponse = false)
        {
            return Error(ex.ToString(), code, isJsonResponse);
        }

        public static HttpResponseMessage Error(string message, HttpStatusCode code = HttpStatusCode.InternalServerError, bool isJsonResponse = false)
        {
            var response = new HttpResponseMessage();
            if (isJsonResponse)
            {
                response = GetErrorMessage(message, code);
            }
            else
            {
                response.StatusCode = code;
                response.Content = new StringContent(message);
            }
            return response;
        }

        public static HttpResponseMessage GetErrorMessage(string message, HttpStatusCode statusCode)
        {
            return new HttpResponseMessage
            {
                Content = new StringContent(
                    Newtonsoft.Json.JsonConvert.SerializeObject(new
                    {
                        Message = message,
                    }),
                    System.Text.Encoding.UTF8,
                    "application/json"
                ),
                StatusCode = statusCode,
            };
        }
    }
}
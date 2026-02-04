using JWT;
using JWT.Algorithms;
using JWT.Serializers;
using Newtonsoft.Json.Linq;
using System;
using System.Linq;

namespace Ref3.Helpers
{
    public class JWTHelper
    {
        public static string GenerateSisenseJWT(string secret, string email)
        {
            TimeSpan unixTime = (DateTime.UtcNow - new DateTime(1970, 1, 1));
            int unixSeconds = (int)unixTime.TotalSeconds;

            JObject payload = JObject.FromObject(new { sub = email, jti = RandomString(36), iat = unixSeconds });

            IJwtAlgorithm algorithm = new HMACSHA256Algorithm();
            IJsonSerializer serializer = new JsonNetSerializer();
            IBase64UrlEncoder urlEncoder = new JwtBase64UrlEncoder();
            IJwtEncoder encoder = new JwtEncoder(algorithm, serializer, urlEncoder);

            string token = encoder.Encode(payload, secret);
            return token;
        }

        private static Random random = new Random();
        private static string RandomString(int length)
        {
            const string chars = "-abcdefghijklmnopqrstuvwxyz0123456789";
            return new string(Enumerable.Repeat(chars, length)
              .Select(s => s[random.Next(s.Length)]).ToArray());
        }
    }
}
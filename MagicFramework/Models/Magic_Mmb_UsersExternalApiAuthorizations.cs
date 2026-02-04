using MagicFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{
    public class Magic_Mmb_UsersExternalApiAuthorizations
    {
        private Data.MagicDBDataContext db;
        public const int tokenValidityInHours = 12;

        public Magic_Mmb_UsersExternalApiAuthorizations()
        {
            db = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
        }

        public Magic_Mmb_UsersExternalApiAuthorizations(string url, string applicationName)
        {
            db = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection(url, applicationName));
        }

        public string RefreshOrCreateAuthToken(int userID, string redirect, string scope = "")
        {
            var auth = GetValidAuthObject(userID);
            if(!RefreshToken(auth))
            {
                return CreateAuthToken(userID, redirect, scope);
            }
            return auth.token;
        }

        public string CreateAuthToken(int userID, string redirect, string scope = "")
        {
            DateTime now = DateTime.Now;
            var auth = new Data.Magic_Mmb_UsersExternalApiAuthorizations
            {
                created = now,
                expires = now.AddHours(tokenValidityInHours),
                user_id = userID,
                scope = scope,
                redirect = redirect,
                token = Crypto.RandomString(111)
            };
            db.Magic_Mmb_UsersExternalApiAuthorizations.InsertOnSubmit(auth);
            db.SubmitChanges();
            return auth.token;
        }

        public bool IsValidToken(int userID, string token)
        {
            return GetAuthToken(userID) == token;
        }

        public int GetUserID(string token)
        {
            var auth = GetValidAuthObject(token);
            if (auth != null)
                return auth.user_id;
            return 0;
        }

        public bool RefreshTokenIfNotExpired(string token)
        {
            var auth = GetValidAuthObject(token);
            return RefreshToken(auth);
        }

        public bool RefreshToken(string token)
        {
            var auth = GetAuthObject(token);
            return RefreshToken(auth);
        }

        private bool RefreshToken(Data.Magic_Mmb_UsersExternalApiAuthorizations authObject)
        {
            if (authObject != null)
            {
                authObject.expires = DateTime.Now.AddHours(tokenValidityInHours);
                db.SubmitChanges();
                return true;
            }
            return false;
        }

        private string GetAuthToken(int userID)
        {
            var auth = GetValidAuthObject(userID);
            if (auth != null)
                return auth.token;
            return "";
        }

        public Data.Magic_Mmb_UsersExternalApiAuthorizations GetValidAuthObject(string token)
        {
            return db.Magic_Mmb_UsersExternalApiAuthorizations.Where(a => a.token == token && a.expires > DateTime.Now).FirstOrDefault();
        }

        private Data.Magic_Mmb_UsersExternalApiAuthorizations GetValidAuthObject(int userID)
        {
            return db.Magic_Mmb_UsersExternalApiAuthorizations.Where(a => a.user_id == userID && a.expires > DateTime.Now).OrderByDescending(a => a.expires).FirstOrDefault();
        }

        private Data.Magic_Mmb_UsersExternalApiAuthorizations GetAuthObject(string token)
        {
            return db.Magic_Mmb_UsersExternalApiAuthorizations.Where(a => a.token == token).FirstOrDefault();
        }
    }
}
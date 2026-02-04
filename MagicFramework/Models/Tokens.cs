using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using MagicFramework.Helpers.Sql;

namespace MagicFramework.Models
{
    public static class Tokens
    {
        public const string TOKENS_TABLE_NAME = "[dbo].[Magic_Mmb_Tokens]";

        public static Dictionary<string, object> Create(string purpose, DateTime? expires = null, int userID = 0, string token = null)
        {
            var data = new Dictionary<string, object> {
                { "token", token == null ? Helpers.Crypto.RandomString(255) : token },
                { "purpose", purpose },
                { "active", true },
            };

            if (userID > 0)
            {
                data["user_id"] = userID;
            }

            if (expires != null)
            {
                data["expires"] = expires;
            }

            var writer = new DBWriter(
                TOKENS_TABLE_NAME,
                data,
                0
            );
            writer.connectionString = Helpers.MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
            writer.retrieveIdOnInsert = false;
            writer.Write();
            return data;
        }

        public static System.Data.DataRow GetValidToken(string token, string purpose, string connectionString = null)
        {
            var query = new DBQuery($"SELECT TOP 1 * FROM {TOKENS_TABLE_NAME}");
            query.AddWhereCondition("token = @token", token);
            query.AddWhereCondition("purpose = @purpose", purpose);
            query.AddWhereCondition("active = @a", true);
            query.AddWhereCondition("(expires IS NULL OR expires >= @now)", DateTime.Now.AddMinutes(2));
            query.connectionString = connectionString ?? Helpers.MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
            var result = query.Execute();
            if (result != null && result.Rows != null)
            {
                return result.Rows[0];
            }
            return null;
        }
     
        public static System.Data.DataRow GetMostRecentValidTokenByPurpose(string purpose)
        {
            var query = new DBQuery($"SELECT TOP 1 * FROM {TOKENS_TABLE_NAME}");
            query.AddWhereCondition("purpose = @purpose", purpose);
            query.AddWhereCondition("active = @a", true);
            query.AddWhereCondition("(expires IS NULL OR expires >= @now)", DateTime.Now.AddMinutes(2));             
            query.connectionString = Helpers.MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
            var result = query.Execute();
            if (result != null && result.Rows != null)
            {
                return result.Rows[0];
            }
            return null;
        }

        /// <summary>
        /// Checks the token and invalidates if it´s expired
        /// </summary>
        /// <param name="token"></param>
        /// <param name="applicationInstanceName"></param>
        /// <param name="purpose"></param>
        public static void CheckToken(string token, string applicationInstanceName,string purpose)
        {
            string currentHost = HttpContext.Current.Request.Url.Authority;
            var cfg = new Helpers.MFConfiguration(currentHost).GetApplicationInstanceByInstanceName(currentHost, applicationInstanceName);
            
            string updateSQL = @"UPDATE [dbo].[Magic_Mmb_Tokens] SET [active]= @active WHERE [purpose]=@purpose AND [active] = 1 AND [expires] < GETDATE()";
            using (SqlConnection conn = new SqlConnection(cfg.TargetDBconn))
            {                  
                using (SqlCommand updateCMD = new SqlCommand(updateSQL, conn))
                {
                    updateCMD.Parameters.Add("@active", SqlDbType.Bit);
                    updateCMD.Parameters["@active"].Value = false;

                    updateCMD.Parameters.Add("@purpose", SqlDbType.VarChar);
                    updateCMD.Parameters["@purpose"].Value = purpose;

                    updateCMD.Connection.Open();
                    updateCMD.ExecuteNonQuery();
                    updateCMD.Connection.Close();
                }                                                          
            }
        }
        public static void InvalidateToken(string token, string connectionString = null)
        {
            Dictionary<string, object> data = new Dictionary<string, object>
            {
                { "active", false }
            };

            var writer = new DBWriter(
                TOKENS_TABLE_NAME,
                data,
                token,
                "token"
            );
          
            writer.connectionString = connectionString ?? Helpers.MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
            writer.retrieveIdOnInsert = false;
            writer.Write();
        }

        public static void DeleteTokensByPurpose(params string[] purpose)
        {
            var delete = new DBQuery($"DELETE FROM {TOKENS_TABLE_NAME}");
            delete.AddWhereCondition("purpose IN @purpose", purpose.ToList());
            delete.connectionString = Helpers.MFConfiguration.GetApplicationInstanceConfiguration().TargetDBconn;
            delete.ExecuteNonQuery();
        }
    }
}
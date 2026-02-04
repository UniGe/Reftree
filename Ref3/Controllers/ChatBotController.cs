using MagicFramework.Controllers.ActionFilters;
using MagicFramework.Data;
using MagicFramework.Helpers;
using MagicFramework.MemberShip;
using Microsoft.PowerBI.Api.Models;
using Newtonsoft.Json;
using System;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Web;
using System.Web.Http;
using System.Web.Security;
using System.Web.UI.WebControls;
using static MagicFramework.Helpers.MFConfiguration;
using Magic_Mmb_Users = MagicFramework.Data.Magic_Mmb_Users;

namespace Ref3.Controllers
{
    public class ChatBotController : ApiController
    {
        [HttpPost]
        public HttpResponseMessage Init()
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                ApplicationInstanceConfiguration config = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
                if (config.F2ChatBot != null)
                {
                    MagicDBDataContext context = new MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                    Magic_Mmb_Users user = context.Magic_Mmb_Users.Where(u => u.UserID == SessionHandler.IdUser).FirstOrDefault();
                    using (SqlConnection connection = new SqlConnection(config.F2ChatBot.DBConnectionString))
                    {

                        MagicFramework.Helpers.Sql.DBQuery queryUser = new MagicFramework.Helpers.Sql.DBQuery("SELECT * FROM users");
                        queryUser.AddWhereCondition("username = @username", user.Username);
                        queryUser.connection = connection;
                        DataTable result = queryUser.Execute();

                        // F2 user not exists
                        if (result == null || result.Rows.Count == 0)
                        {
                            string statement = @"INSERT INTO users
                                                (
                                                    uid,
                                                    email,
                                                    username,
                                                    password,
                                                    active,
                                                    is_superuser
                                                )
                                            VALUES (
                                                    @uid,
                                                    @email,
                                                    @username,
                                                    @password,
                                                    1,
                                                    0
                                            )";
                            using (SqlCommand command = new SqlCommand(statement, connection))
                            {
                                command.Parameters.AddWithValue("@uid", GetF2Uid());
                                command.Parameters.AddWithValue("@email", user.Email);
                                command.Parameters.AddWithValue("@username", user.Username);
                                command.Parameters.AddWithValue("@password", BCrypt.Net.BCrypt.HashPassword(user.Password, 13));
                                connection.Open();
                                command.ExecuteNonQuery();
                            }
                        }
                        // F2 user has wrong password
                        else if (!BCrypt.Net.BCrypt.Verify(user.Password, result.Rows[0]["password"].ToString()))
                        {
                            string statement = @"UPDATE users SET password = @password WHERE username = @username";
                            using (SqlCommand command = new SqlCommand(statement, connection))
                            {
                                command.Parameters.AddWithValue("@password", BCrypt.Net.BCrypt.HashPassword(user.Password, 13));
                                command.Parameters.AddWithValue("@username", user.Username);
                                connection.Open();
                                command.ExecuteNonQuery();
                            }
                        }
                    }

                    WebRequest httpWebRequest = (HttpWebRequest)WebRequest.Create(config.F2ChatBot.URL + "/api/users/login");
                    httpWebRequest.ContentType = "application/json";
                    httpWebRequest.Method = "POST";
                    using (StreamWriter streamWriter = new StreamWriter(httpWebRequest.GetRequestStream()))
                    {
                        string json = JsonConvert.SerializeObject(new
                        {
                            username = user.Username,
                            password = user.Password,
                            setCookie = false
                        });
                        streamWriter.Write(json);
                    }
                    using (HttpWebResponse responseApi = (HttpWebResponse)httpWebRequest.GetResponse())
                    {
                        response.StatusCode = responseApi.StatusCode;
                        using (var reader = new StreamReader(responseApi.GetResponseStream()))
                        {
                            string objText = reader.ReadToEnd();
                            response.Content = new StringContent(objText, Encoding.UTF8, "application/json");
                        }
                    }
                }
                else
                {
                    response.StatusCode = HttpStatusCode.NotFound;
                }
            }
            catch (Exception e)
            {
                response.Content = new StringContent(e.Message);
                response.StatusCode = HttpStatusCode.InternalServerError;
            }

            return response;
        }

        [HttpGet]
        public HttpResponseMessage Areas()
        {
            return GetDropResponse();
        }

        [HttpGet]
        public HttpResponseMessage Processes(string code)
        {
            return GetDropResponse(code);
        }

        private HttpResponseMessage GetDropResponse(string code = "")
        {
            HttpResponseMessage response = new HttpResponseMessage();
            try
            {
                ApplicationInstanceConfiguration config = new MFConfiguration(SessionHandler.ApplicationDomainURL).GetApplicationInstanceByID(SessionHandler.ApplicationDomainURL, SessionHandler.ApplicationInstanceId);
                if (config.F2ChatBot != null)
                {
                    DataSet tables = new DataSet();
                    using (SqlConnection con = new SqlConnection(config.F2ChatBot.DropDataDBConnectionString))
                    {
                        using (SqlCommand cmd = new SqlCommand("core.usp_cb_ret_area_process_code", con))
                        {
                            cmd.CommandType = CommandType.StoredProcedure;
                            cmd.Parameters.Add("@xmlInput", SqlDbType.Xml).Value = String.Format("<SQLP><P code=\"{0}\"/></SQLP>", code);
                            SqlDataAdapter da = new SqlDataAdapter(); con.Open();
                            da.SelectCommand = cmd;
                            da.Fill(tables);
                            da.Dispose();
                        }
                    }
                    response.StatusCode = HttpStatusCode.OK;
                    response.Content = new StringContent(JsonConvert.SerializeObject(tables.Tables[0]), Encoding.UTF8, "application/json");
                }
                else
                {
                    response.StatusCode = HttpStatusCode.NotFound;
                }
            }
            catch (Exception e)
            {
                response.Content = new StringContent(e.Message);
                response.StatusCode = HttpStatusCode.InternalServerError;
            }

            return response;
        }

        public static string GetF2Uid(int length = 27)
        {
            string UID_ALPHABET = "abcdefghijklmonpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            string uid = DateTimeOffset.Now.ToUnixTimeMilliseconds().ToString() + "-";
            Random rnd = new Random();
            Byte[] b = new Byte[length - 17];
            rnd.NextBytes(b);
            for (int i = 0; i <= b.GetUpperBound(0); i++)
            {
                uid += UID_ALPHABET[b[i] % UID_ALPHABET.Length];
            }
            while (uid.Length < length)
                uid = "0" + uid;
            return uid;
        }
    }
}
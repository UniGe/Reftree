using System;
using System.Collections.Generic;
using System.Linq;
using System.Data;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Data.SqlClient;

namespace MagicFramework.Helpers
{

    #region Models

  

    public class Notification 
    {
        public string Text { get; set; }
        public string Type { get; set; }
        public DateTime Date { get; set; }
        public string Username { get; set; }
        public bool Read { get; set; }
        public DateTime ReadAt { get; set; }
        public string Application_name { get; set; }
        //For Magic_NotificationsQueue items
        public int? DatabaseId { get; set; }
        public string FunctionLink { get; set; }
        public string FunctionFilter { get; set; }
        public bool CanReply { get; set; }
        public string SenderUser { get; set; }
        public string Tags { get; set; } 
        public string ThreadMembers { get; set; }
        public int? DocumentRepositoryId { get; set; }
        public string AttachmentPath { get; set; }
        public bool? display_modal_unread { get; set; }

        public Notification() { }

        //Should be used only for UI messages which are errors...
        public static void Delete(int id) {
            string SQL = @"DELETE [dbo].[Magic_NotificationQueue] where id=@id";
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(SQL, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(new SqlParameter("@id", id));
                    cmd.ExecuteNonQuery();
                    cmd.Connection.Close();
                }
            }
        }
        public int Save() {
            int id = 0;
            int userid = 0;
            int notificationType_ID = 0;
            string sqlUser = "SELECT UserID from Magic_mmb_Users where UserName=@username";
            string notificationTypeSQL = "SELECT ID FROM Magic_NotificationTypes where Code = 'UI'";
            string text = this.Text;
            bool notified = false;
            DateTime? notifiedat = null;
            //for database schema compatibility introduced optional JSON format for errors in SQL database (prevously on mongo)...
            if (this.Type == "error")
            {
                //errors are already shown as they happen , store the as notified
                notified = true;
                notifiedat = DateTime.Now;
                text = "{\"type\":\"error\",\"message\":\"{0}\"}".Replace("{0}", this.Text);
            }
            string SQL = @"INSERT INTO [dbo].[Magic_NotificationQueue]
           ([user_id]
           ,[notificationType_ID]
           ,[notified]
           ,[notified_at]
           ,[send_attempts]
           ,[last_attempt]
           ,[message]
           ,[error]
           ,[provider_ID]
           ,[mobile]
           ,[readByUser]
           ,[notes]
           ,[DocumentRepository_ID]
           ,[function_link]
           ,[function_filter]
           ,[can_reply]
           ,[sender_user_id])
            VALUES
           (@userid
           ,@notificationType_ID
           ,@notified
           ,@notified_at
           ,0
           ,null
           ,@text
           ,null
           ,null
           ,null
           ,0
           ,null
           ,null
           ,null
           ,null
           ,0
           ,null);
            select SCOPE_IDENTITY() AS ID";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmdnotificationtype = new SqlCommand(notificationTypeSQL, conn))
                {
                    cmdnotificationtype.Connection.Open();
                    notificationType_ID = int.Parse(cmdnotificationtype.ExecuteScalar().ToString());
                    cmdnotificationtype.Connection.Close();
                }
                using (SqlCommand cmduser = new SqlCommand(sqlUser, conn))
                {
                    cmduser.Connection.Open();
                    cmduser.Parameters.Add(new SqlParameter("@username", this.Username));
                    userid = int.Parse(cmduser.ExecuteScalar().ToString());
                    cmduser.Connection.Close();
                }

                using (SqlCommand cmd = new SqlCommand(SQL, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(new SqlParameter("@userid", userid));
                    cmd.Parameters.Add(new SqlParameter("@notificationType_ID", notificationType_ID));
                    cmd.Parameters.Add(new SqlParameter("@text", text));
                    if (notifiedat != null)
                    {
                        cmd.Parameters.Add(new SqlParameter("@notified_at", notifiedat));
                    }
                    else {
                        cmd.Parameters.Add(new SqlParameter("@notified_at", DBNull.Value));
                    }
                    
                    cmd.Parameters.Add(new SqlParameter("@notified", notified));

                    id = int.Parse(cmd.ExecuteScalar().ToString());
                    cmd.Connection.Close();
                }
            }
            return id;

        }
        public static bool isError(string messageFromDB) {
            try
            {
                dynamic message = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(messageFromDB);
                if (message.type == "error")
                    return true;
                return false;
            }
            catch  {
                return false;
            }
        }

        public static string getMessage(string messageFromDB)
        {
            try
            {
                dynamic message = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(messageFromDB);
                if (message.message != null)
                    return message.message;
                return messageFromDB;
            }
            catch
            {
                return messageFromDB;
            }
        }

       
    }

    #endregion

    public class NotificationsHandler 
    {
        public readonly int numberOfNotificationsToRetrieveAtOnce = Int32.Parse(System.Configuration.ConfigurationManager.AppSettings["numberOfNotificationsToRetrieveAtOnce"]);
    
        public NotificationsHandler() 
        {

        }

        #region Notifications

        public  List<Helpers.Notification> GetNotifications(int take, int skip = 0, bool unreadOnly = false)
        {
             var dbutils = new DatabaseCommandUtils();
            List<Helpers.Notification> notificFromDb = new List<Helpers.Notification>();
            string conditionOnErrors = SessionHandler.UserIsDeveloper ? "  AND isAnError in (0,1) " : " AND isAnError = 0 ";
            string conditionOnRead = !unreadOnly ? "  AND readByUser is not null " : " AND readByUser = 0 ";
            string SQL = @"SELECT              [dbo].[v_Magic_NotificationQueue].[id]
                                              ,[creationDate]
                                              ,[user_id]
                                              ,[Username]
                                              ,[notificationType_ID]
                                              ,[notificationType]
                                              ,[message]
                                              ,readByUser
                                              ,can_reply
                                              ,DocumentRepository_ID
                                              ,function_filter
                                              ,function_link
                                              ,sender_user_id
                                              ,tags
                                              ,sender_user
                                              ,ThreadMembers
                                              ,isAnError
                                              ,display_modal_unread
                                              ,docRep.AttachmentPath
                                          FROM [dbo].[v_Magic_NotificationQueue]
                                            left join [dbo].[Magic_DocumentRepository] docRep on docRep.ID = DocumentRepository_ID
                                            where notificationType = 'UI'  AND user_id = @userid " + conditionOnErrors+ conditionOnRead + @" 
                                            Order by creationDate desc 
                                            OFFSET    @skip ROWS       
                                            FETCH NEXT @take ROWS ONLY;";
            DataSet ds = new DataSet();
            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(SQL, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(new SqlParameter("@userid", SessionHandler.IdUser));
                    cmd.Parameters.Add(new SqlParameter("@skip", skip));
                    cmd.Parameters.Add(new SqlParameter("@take", take));
                    DataTable table = new DataTable();
                    table.Load(cmd.ExecuteReader());
                    ds.Tables.Add(table);
                    cmd.Connection.Close();
                }
            }


            foreach (DataRow dr in ds.Tables[0].Rows)
            {
                var noti = new Helpers.Notification();
                noti.Read = bool.Parse(dr["readByUser"].ToString());
                noti.Text = Helpers.Notification.getMessage(dr["message"].ToString());
                noti.Type = Helpers.Notification.isError(dr["message"].ToString()) == true ? "error" : "info";
                noti.Date = DateTime.Parse(dr["creationDate"].ToString());
                noti.DatabaseId = int.Parse(dr["id"].ToString());
                noti.CanReply = bool.Parse(dr["can_reply"].ToString());
                noti.SenderUser = dr["sender_user"].ToString();
                noti.FunctionLink = dr["function_link"].ToString();
                noti.FunctionFilter = dr["function_filter"].ToString();
                noti.Tags = dr["tags"].ToString();
                noti.ThreadMembers = dr["ThreadMembers"].ToString();
                noti.AttachmentPath = dr["AttachmentPath"].ToString();
                if (!dr.IsNull("DocumentRepository_ID"))
                {
                    noti.DocumentRepositoryId = int.Parse(dr["DocumentRepository_ID"].ToString());
                }
                if (dr.Table.Columns.Contains("display_modal_unread"))
                    noti.display_modal_unread = dr.Field<bool>("display_modal_unread");
                else
                    noti.display_modal_unread = false;

                notificFromDb.Add(noti);
            }


            return notificFromDb;

        }

        public List<Notification> GetUnreadNotifications()
        {
            return this.GetNotifications(numberOfNotificationsToRetrieveAtOnce, 0, true);
        }

        public long GetUnreadNotificationsCount()
        {
            long counter = 0;
            string conditionOnErrors = SessionHandler.UserIsDeveloper ? "  AND isAnError in (0,1) " : " AND isAnError = 0 ";

            string SQL = @"SELECT count(0) as unreadnotifications
                            FROM [dbo].[v_Magic_NotificationQueue] 
                            where notificationType = 'UI'  AND user_id = @userid " + conditionOnErrors + @" AND readByUser = 0 ;";

            using (SqlConnection conn = new SqlConnection(DBConnectionManager.GetTargetConnection()))
            {
                using (SqlCommand cmd = new SqlCommand(SQL, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(new SqlParameter("@userid", SessionHandler.IdUser));
                    DataTable table = new DataTable();
                    counter = int.Parse(cmd.ExecuteScalar().ToString());
                    cmd.Connection.Close();
                }
            }

            return counter;

        }

        public Notification SaveNotification(string username, string type, string text)
        {
            username = username.ToLower();
            Notification N = new Notification();
            N.Username = username;
            N.Text = text;
            N.Type = type;
            N.Date = DateTime.Now;
            N.Read = false;
            int id = N.Save();
            N.DatabaseId = id;
            return N;
        }

        public void DeleteNotification(string id)
        {
            Notification.Delete(int.Parse(id));
        }

        #endregion
    }
}
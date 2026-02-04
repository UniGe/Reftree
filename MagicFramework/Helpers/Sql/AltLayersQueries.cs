using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace MagicFramework.Helpers.Sql
{
    public class AltLayersQueries
    {
        private string connectionString;
        public AltLayersQueries() {
            this.connectionString = DBConnectionManager.GetMagicConnection();
        }
        public void deleteAltLayerCommand(int commandid)
        {
            string sqlCommand = @"DELETE [dbo].[Magic_GridsCommandsAltLayers]
                                               WHERE [MagicCommand_ID]= @commandId;";
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Connection.Open();
                    cmd.ExecuteNonQuery();
                    cmd.Connection.Close();
                }
            }
        }
        public void insertAltLayerCommand(int commandid,dynamic data)
        {
            string sqlCommand = @"INSERT INTO [dbo].[Magic_GridsCommandsAltLayers]
                                                       ([MagicCommand_ID]
                                                       ,[Layer_ID]
                                                       ,[ModifiedUser_ID]
                                                       )
                                                 VALUES
                                                       (@commandId
                                                       ,@layerId
                                                       ,@userId
                                                       )";

            int layerId = int.Parse(data.Layer_ID.ToString());

            SqlParameter CommandId = new SqlParameter("@commandId", commandid);
            SqlParameter LayerId = new SqlParameter("@layerId", layerId);
            SqlParameter UserId = new SqlParameter("@userId", SessionHandler.IdUser);
       
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(CommandId);
                    cmd.Parameters.Add(UserId);
                    cmd.Parameters.Add(LayerId);

                    cmd.ExecuteNonQuery();
                    cmd.Connection.Close();
                }
            }
        }
        public void insertAltLayerTemplateGroup(int templategroupid, dynamic data)
        {
            string sqlCommand = @"INSERT INTO [dbo].[Magic_TemplateGroupsAltLayers]
                                                       ([MagicTemplateGroup_ID]
                                                       ,[Layer_ID]
                                                       ,[ModifiedUser_ID]
                                                       )
                                                 VALUES
                                                       (@templategroupId
                                                       ,@layerId
                                                       ,@userId
                                                       )";

            int layerId = int.Parse(data.Layer_ID.ToString());
    
            SqlParameter CommandId = new SqlParameter("@templategroupId", templategroupid);
            SqlParameter LayerId = new SqlParameter("@layerId", layerId);
            SqlParameter UserId = new SqlParameter("@userId", SessionHandler.IdUser);
   
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Connection.Open();
                    cmd.Parameters.Add(CommandId);
                    cmd.Parameters.Add(UserId);
                    cmd.Parameters.Add(LayerId);

                    cmd.ExecuteNonQuery();
                    cmd.Connection.Close();
                }
            }
        }
        
    }
}
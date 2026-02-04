using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MagicEventsManager.DB
{
    public class Tracking
    {
        public Tracking(string connection) {
            this.connectionString = connection;
        }
        private string connectionString { get; set; }

        public int insertNewTrack(int plannedEventId) {

            DataSet ds = new DataSet();
            string command = @"INSERT INTO [dbo].[Magic_Eve_Track]
           (
            [PlannedEventID]
           ,[tsExecutionStart]
           ,[tsExecutionEnd]
           ,[AlertMessage]
           ,[DbMessage])
             VALUES
                   ( @plannedEventId
                   ,@executionStart
                   ,NULL
                   ,NULL
                   ,NULL);
            SELECT SCOPE_IDENTITY() as ID;";

            using (SqlConnection con = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(command, con))
                {
                    cmd.CommandTimeout = 300; //5 minutes
                    cmd.CommandType = CommandType.Text;
                    cmd.Parameters.Add("@plannedEventId", SqlDbType.Int).Value = plannedEventId;
                    cmd.Parameters.Add("@executionStart", SqlDbType.DateTime).Value = DateTime.Now;
                    SqlDataAdapter da = new SqlDataAdapter(); con.Open();
                    da.SelectCommand = cmd;
                    da.Fill(ds);
                    da.Dispose();
                }
            }

            return int.Parse(ds.Tables[0].Rows[0]["ID"].ToString());
            
        }

        public void updateEndTrack(int trackId,string error = null) {
            string command = @"UPDATE dbo.Magic_Eve_Track set tsExecutionEnd = @executionEnd , DbMessage = @message where TrackID = @trackId";
            using (SqlConnection con = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(command, con))
                {
                    cmd.CommandTimeout = 300; //5 minutes
                    cmd.CommandType = CommandType.Text;
                    cmd.Parameters.Add("@trackId", SqlDbType.Int).Value = trackId;
                    if (String.IsNullOrEmpty(error))
                        cmd.Parameters.Add("@message", SqlDbType.NVarChar).Value = DBNull.Value;
                    else
                        cmd.Parameters.Add("@message", SqlDbType.NVarChar).Value = error;
                    cmd.Parameters.Add("@executionEnd", SqlDbType.DateTime).Value = DateTime.Now;

                    con.Open();
                    cmd.ExecuteNonQuery();
                }
            }
        }

        public bool AreThereRunningEvents(int plannedEventId)
        {
            bool isRunning = false;
            string command = @"SELECT COUNT(*) 
                       FROM dbo.Magic_Eve_Track 
                       WHERE PlannedEventID = @plannedEventId 
                       AND tsExecutionEnd IS NULL 
                       AND CAST(tsExecutionStart AS DATE) = CAST(GETDATE() AS DATE)";

            using (SqlConnection con = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(command, con))
                {
                    cmd.CommandTimeout = 300; //5 minutes
                    cmd.CommandType = CommandType.Text;
                    cmd.Parameters.Add("@plannedEventId", SqlDbType.Int).Value = plannedEventId;

                    con.Open();
                    int eventCount = (int)cmd.ExecuteScalar();  // Execute the scalar query to get the count

                    // If the count is greater than 0, there are running events for today
                    isRunning = eventCount > 0;
                }
            }

            return isRunning;
        }

    }
}

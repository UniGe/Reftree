using System.Configuration;
using System.Data;
using System.Data.SqlClient;

namespace Ref3.Helpers.Sql
{
    public class DataExportQueries
    {
        private string connectionString;
        int sqlCommandTimeout = ConfigurationManager.AppSettings["SqlCommandTimeout"] == null ? 300 : int.Parse(ConfigurationManager.AppSettings["SqlCommandTimeout"].ToString());

        public DataExportQueries(string conn)
        {
            connectionString = conn;
        }

        internal DataTable GetExportWhitelist()
        {
            DataTable table = new DataTable();
            string sqlCommand = "SELECT * FROM [dbo].[Magic_ExportWhitelist]";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Connection.Open();
                    table.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            return table;
        }
        
        internal DataRow GetExportSetting(string guid)
        {
            DataTable table = new DataTable();
            string sqlCommand = "SELECT * FROM [dbo].[Magic_ExportSettings] WHERE [GUID] = @guidParam";

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.AddWithValue("@guidParam", guid);
                    cmd.Connection.Open();
                    table.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            if (table.Rows.Count > 0)
            {
                return table.Rows[0];
            }
            else
            {
                return null;
            }
        }

        internal DataRow CreateExportLog(string guid, string jsonBody)
        {
            string sqlCommand = "INSERT INTO [dbo].[Magic_ExportLog] ([ExportSettings_GUID] ,[Body] ,[Error]) VALUES (@guidParam, @bodyParam, null); SELECT * FROM [dbo].[Magic_ExportLog] WHERE ID = SCOPE_IDENTITY()";            
            DataTable table = new DataTable();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.AddWithValue("@guidParam", guid);
                    cmd.Parameters.AddWithValue("@bodyParam", jsonBody);
                    cmd.Connection.Open();
                    table.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            if(table.Rows.Count > 0)
            {
                return table.Rows[0];
            } else
            {
                return null;
            }
        }

        internal DataRow WriteErrorToExportLog(int exportLogID, string errorMessage)
        {
            string sqlCommand = "UPDATE [dbo].[Magic_ExportLog] SET [Error] = @errorParam WHERE ID = @idParam; SELECT * FROM [dbo].[Magic_ExportLog] WHERE ID = @idParam;";
            DataTable table = new DataTable();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.Parameters.AddWithValue("@errorParam", errorMessage);
                    cmd.Parameters.AddWithValue("@idParam", exportLogID);
                    cmd.Connection.Open();
                    table.Load(cmd.ExecuteReader());
                    cmd.Connection.Close();
                }
            }
            if (table.Rows.Count > 0)
            {
                return table.Rows[0];
            }
            else
            {
                return null;
            }
        }

        internal DataSet ExecuteStoredProcedure(string spName, string connectionString, int exportLog_ID)
        {
            DataSet ds = new DataSet();
            string sqlCommand = "EXEC " + spName + " @exportLog_ID = "+exportLog_ID;
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
                {
                    cmd.CommandTimeout = sqlCommandTimeout;
                    SqlDataAdapter da = new SqlDataAdapter(cmd);
                    da.Fill(ds);

                    cmd.Connection.Close();
                }
            }
            return ds;
        }

    }
}
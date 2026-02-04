using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MagicDeployDBManager.Helpers
{
    public class DAL
    {
        public static DataSet GetDataSet(string sqlCommand, string connectionString)
        {

            DataSet ds = new DataSet();
            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(
                      sqlCommand, conn))
                {
                    cmd.Connection.Open();
                    DataTable table = new DataTable();
                    table.Load(cmd.ExecuteReader());
                    ds.Tables.Add(table);
                    cmd.Connection.Close();
                }
            }

            return ds;
        }

        public static bool buildAndExecDirectCommandNonQuery(string connectionDb, string commandtext, object[] args)
        {
            try
            {
                    using (SqlConnection PubsConn = new SqlConnection(connectionDb))
                    {
                        using (SqlCommand CMD = new SqlCommand
                          (String.Format(commandtext, args), PubsConn))
                        {
                            CMD.CommandType = CommandType.Text;
                            CMD.CommandTimeout = 300; //5 mins 
                            PubsConn.Open();
                            CMD.ExecuteNonQuery();
                            PubsConn.Close();
                        }
                    }
            }
            catch (Exception ex)
            {
                 throw new System.ArgumentException(ex.Message);
            }
            return true;
        }

    }
}

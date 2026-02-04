using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MagicEventsManager.DB
{
    public static class Utils
    {
        public static void buildAndExecDirectCommandNonQuery(string connectionDb, string commandtext, object[] args = null)
        {
            if (args != null)
                commandtext = String.Format(commandtext, args);
              
            using (SqlConnection PubsConn = new SqlConnection(connectionDb))
                {
                    using (SqlCommand CMD = new SqlCommand
                        (commandtext, PubsConn))
                    {
                        CMD.CommandType = CommandType.Text;
                        PubsConn.Open();
                        CMD.ExecuteNonQuery();
                        PubsConn.Close();
                    }
                }
        }
        public static DataSet GetDataSet(string sqlCommand, string connectionString)
        {

            DataSet ds = new DataSet();

            using (SqlConnection conn = new SqlConnection(connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(sqlCommand, conn))
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
        private class SingleRowCollection
        {
            public DataRow[] drows { get; set; }
            public SingleRowCollection()
            { }
        }
        public static string convertDataSetToJsonString(DataSet ds)
        {
            var r = new List<SingleRowCollection>();
            foreach (DataTable t in ds.Tables)
            {
                SingleRowCollection sr = new SingleRowCollection();
                sr.drows = t.AsEnumerable().ToArray().Take(1).ToArray();
                r.Add(sr);

            }
            return Newtonsoft.Json.JsonConvert.SerializeObject(r.ToArray());
        }
    }
}

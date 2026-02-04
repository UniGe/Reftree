using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MagicFramework.Helpers.Sql
{
    public class DBProcedure : DBTools
    {
        public class StandardResult
        {
            public string statusID { get; set; }
            public string message { get; set; }
            public string result { get; set; }
        }

        public string name { get; set; }

        public DBProcedure(string name)
        {
            this.name = name;
        }

        public StandardResult Execute(string dataXML)
        {
            using (connection)
            {
                using (SqlCommand CMD = CreateCommand(name))
                {
                    CMD.CommandType = CommandType.StoredProcedure;
                    SqlParameter xmlinput = CMD.Parameters.Add
                    ("@xmlInput", SqlDbType.Xml);
                    xmlinput.Value = dataXML;
                    SqlParameter output1 = CMD.Parameters.Add
                    ("@pkValueOut", SqlDbType.VarChar, 50);
                    output1.Direction = ParameterDirection.Output;
                    SqlParameter output2 = CMD.Parameters.Add
                    ("@msg", SqlDbType.VarChar, 4000);
                    output2.Direction = ParameterDirection.Output;
                    SqlParameter output3 = CMD.Parameters.Add
                    ("@errId", SqlDbType.Int);
                    output3.Direction = ParameterDirection.Output;

                    connection.Open();
                    CMD.ExecuteNonQuery();
                    return new StandardResult
                    {
                        statusID = output3.Value.ToString(),
                        message = output2.Value.ToString(),
                        result = output1.Value.ToString()
                    };
                }
            }
        }

        public DataTable ExecuteAndGetDataTable(string dataXML, SqlTransaction transaction = null)
        {

            UseTransaction(command, transaction);
            try
            {
                OpenConnection();
                using (SqlCommand CMD = CreateCommand(name))
                {
                    CMD.CommandType = CommandType.StoredProcedure;
                    SqlParameter xmlinput = CMD.Parameters.Add
                    ("@xmlInput", SqlDbType.Xml);
                    xmlinput.Value = dataXML;

                    DataTable dt = new DataTable();
                    dt.Load(CMD.ExecuteReader());
                    return dt;
                }
            }
            finally
            {
                CloseConnection(transaction);
            }
        }

        public DataTable ExecuteAndGetDataTable(JObject JSON)
        {
            string xml = DefaultMFStoredXML(JSON);
            return ExecuteAndGetDataTable(xml);
        }

        private static string JSONToMagicAttributes(JObject JSON)
        {
            string data = "";
            foreach (KeyValuePair<string, JToken> t in JSON)
            {
                data += t.Key + "=\"" + t.Value.ToString().Replace("\"", "\\\"") + "\" ";
            }
            return data;
        }

        public static string DefaultMFStoredXML(JObject JSON, string action = "create")
        {
            string xml = "<SQLP><P ";
            xml += JSONToMagicAttributes(JSON);
            xml += "/>";
            xml += "<ACTION TYPE=\""+ action + "\" TABLE =\"\" ID =\"0\" IDOLD =\"0\" LAYERID=\"0\" FUNCTIONID=\"0\" />";
            xml += "<SESSIONVARS iduser=\"0\" idbusinessunit=\"0\" Rootdirforcustomer=\"\" Rootdirforupload=\"\"/>";
            xml += "<QUERYBUILDER WHERE=\"\" ORDERBY=\"\" SKIP=\"0\" TAKE=\"0\" SELECT=\"\" FILTER=\"\" />";
            xml += "</SQLP>";
            return xml;
        }
    }
}

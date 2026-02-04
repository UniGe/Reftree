using Newtonsoft.Json.Linq;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

namespace MagicFramework.Helpers
{
    public class DBUtils
    {
        public class AdvancedSqlReader {
            string[] columns;
            SqlDataReader reader;
            JArray resultArray = null;

            public AdvancedSqlReader(SqlDataReader reader)
            {
                this.reader = reader;
                columns = GetColumnsFromReader(reader);
            }

            public JObject GetRowObject(DataRow row)
            {
                return GetObjectFromRow(row, columns);
            }

            public JArray ResultArray
            {
                get
                {
                    if (resultArray == null)
                        resultArray = GetJArrayFromReader(reader, columns);
                    return resultArray;
                }
            }
        }

        public static string[] GetColumnsFromReader(SqlDataReader reader, HashSet<string> ignoreColumns = null)
        {
            List<string> columns = new List<string>();
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if(ignoreColumns == null || !ignoreColumns.Contains(reader.GetName(i)))
                    columns.Add(reader.GetName(i));
            }
            return columns.ToArray();
        }

        public static string[] GetColumnsFromRow(DataRow row)
        {
            return GetColumnsFromTable(row.Table);
        }

        public static string[] GetColumnsFromTable(DataTable table, HashSet<string> ignoreColumns = null)
        {
            List<string> columns = new List<string>();
            foreach (DataColumn column in table.Columns)
            {
                if(ignoreColumns == null || !ignoreColumns.Contains(column.ColumnName))
                    columns.Add(column.ColumnName);
            }
            return columns.ToArray();
        }

        public static JObject GetObjectFromRow(DataRow row, string[] columns)
        {
            JObject jobject = new JObject();
            foreach (string column in columns)
            {
                jobject.Add(column, JToken.FromObject(row[column]));
            }
            return jobject;
        }

        public static JArray GetJArrayFromReader(SqlDataReader reader, string[] columns = null, HashSet<string> ignoreColumns = null)
        {
            JArray jarray = new JArray();
            if(columns == null)
                columns = GetColumnsFromReader(reader, ignoreColumns);
            while (reader.Read())
            {
                JObject jobject = new JObject();
                foreach(string column in columns)
                {
                    jobject.Add(column, JToken.FromObject(reader[column]));
                }
                jarray.Add(jobject);
            }
            return jarray;
        }
    }
}

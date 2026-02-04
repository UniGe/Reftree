using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Data.SqlClient;
using System.Data;

namespace MagicFramework.Helpers.Sql
{
    public class DBWriter : DBQuery
    {
        object id;
        string table;
        string primaryKeyColumn;
        public bool retrieveIdOnInsert = true;

        Dictionary<string, object> Data { get; set; }


        public DBWriter(string table, Dictionary<string, object> Data, object id = null, string primaryKeyColumn = "id")
        {
            this.Data = Data;
            this.id = id;
            this.table = table;
            this.primaryKeyColumn = primaryKeyColumn;
        }

        private string GetValuesString(bool isInsert = false)
        {
            string keyValueString;
            if (isInsert)
            {
                string keys = "";
                string values = "";
                keys += "(";
                values += "(";
                foreach (var data in Data)
                {
                    keys += data.Key + ",";
                    values += "@" + data.Key + ",";
                }
                keys = keys.TrimEnd(',');
                values = values.TrimEnd(',');
                keys += ")";
                values += ")";
                keyValueString = keys + (retrieveIdOnInsert ? " output INSERTED.ID VALUES " : " VALUES ") + values;
            }
            else
            {
                keyValueString = "SET ";
                foreach (var data in Data)
                {
                    keyValueString += data.Key + " = @" + data.Key + ", ";
                }
                keyValueString = keyValueString.TrimEnd(' ').TrimEnd(',');
            }
            return keyValueString;
        }

        public object Write(SqlTransaction trans = null)
        {
            string sql = "";
            object whereValue = null;
            if (id == null || id.GetType() == typeof(int) && (int)id == 0)
                sql += "INSERT INTO " + table + " " + GetValuesString(true);
            else
            {
                sql += "UPDATE " + table + " " + GetValuesString() + " WHERE " + primaryKeyColumn + " = @primaryKeyValue";
                whereValue = id;
            }

            using (var command = CreateCommand(sql))
            {
                if (whereValue != null)
                {
                    command.Parameters.AddWithValue("@primaryKeyValue", whereValue);
                }
                foreach (var data in Data)
                {
                    command.Parameters.AddWithValue("@" + data.Key, data.Value ?? DBNull.Value);
                }
                OpenConnection();
                UseTransaction(command, trans);
                try
                {
                    if (id == null && retrieveIdOnInsert)
                    {
                        return (int)command.ExecuteScalar();
                    }
                    else
                    {
                        command.ExecuteNonQuery();
                    }
                }
                finally
                {
                    CloseConnection(trans);
                }
            }
            return id;
        }
    }
}

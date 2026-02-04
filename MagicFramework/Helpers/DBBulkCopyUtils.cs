using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Xml;


namespace MagicFramework.Helpers
{
    public static class DBBulkCopyUtils
    {

        public static DataTable ToDataTable<T>(this IList<T> data)
        {
            PropertyInfo[] props = data[0].GetType().GetProperties();
          
            DataTable table = new DataTable();
            for (int i = 0; i < props.Length; i++)
            {
               //xml cols are treated as strings 
                table.Columns.Add(props[i].Name, props[i].PropertyType == typeof(XmlDocument) ? typeof(string) : props[i].PropertyType);
            }
            object[] values = new object[props.Length];
            foreach (T item in data)
            {
                for (int i = 0; i < values.Length; i++)
                {
                    if (props[i].PropertyType == typeof(XmlDocument))
                    {
                        if (props[i].GetValue(item) != null)
                        {
                            XmlDocument xml = (XmlDocument)props[i].GetValue(item);
                            values[i] = xml.OuterXml;
                        }
                        else
                            values[i] = null;
                    }
                    else
                    if (props[i].PropertyType == typeof(DateTime))
                    {
                        DateTime currDT = (DateTime)props[i].GetValue(item);
                        values[i] = currDT.ToUniversalTime();
                    }
                    else
                    {
                        values[i] = props[i].GetValue(item);
                    }
                }
                table.Rows.Add(values);
            }
            return table;
        }
        public static void ExecBulkCopyList<T>(this IList<T> listItems,string destinationTableName,string connectionString = null)
        {
          
            if (connectionString == null)
                connectionString = MagicFramework.Helpers.DBConnectionManager.GetTargetConnection();

            SqlBulkCopy sbc = new SqlBulkCopy(connectionString);
            sbc.DestinationTableName = destinationTableName;
            DataTable dt = ToDataTable(listItems);
            foreach (DataColumn c in dt.Columns)
            {
                sbc.ColumnMappings.Add(c.ColumnName, c.ColumnName);
            }
            sbc.BulkCopyTimeout = 300;
            try
            {
                sbc.WriteToServer(ToDataTable(listItems));
            }
            catch (Exception ex) {
                throw ex;
            }
            sbc.Close();
        }
    }
}
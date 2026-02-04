using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.IO;
using System.Linq;
using System.Text;
using System.Web;
using MagicFramework.Models;
using OfficeOpenXml;

namespace MagicFramework.Helpers
{
    public class ExportSpecs
    {
        public string columns { get; set; }
        public List<string> select { get; set; }
        public string gridname { get; set; }
        public int layer { get; set; }
        public string format { get; set; }
        public string functionID { get; set; }
        public Filters filter { get; set; }
        public List<Sort> sort { get; set; }

    }
    public class GridToFileExporter
    {
        private ExportSpecs data { get; set; }
        private string filename { get; set; }
        private string path { get; set; }
        private DataTable dt { get; set; }
        private string encoding {get;set;} 
        private string separator {get;set;}
        //0 means no Autofit 
        private int autoFitLimitRows { get; set; } = 0;
        private Dictionary<string, List<KeyValuePair<string, string>>> foreignkeys { get; set; }
        private Dictionary<string, string> labels { get; set; }

      
    
        public GridToFileExporter(ExportSpecs expspec,string filename,string temppath, DataTable dt)
        {
            this.filename = filename;
            this.data = expspec;
            this.path = temppath;
            this.dt = dt;
            this.encoding = ConfigurationManager.AppSettings["textencoding"];
            this.separator = ConfigurationManager.AppSettings["separator"]; 
            this.autoFitLimitRows = ConfigurationManager.AppSettings["ExcelAutofitLimitRows"] != null 
                ? int.Parse(ConfigurationManager.AppSettings["ExcelAutofitLimitRows"].ToString()) : 0;

        }

        public FileStream Export()
        {
            FileStream stream;
            this.foreignkeys = buildForeignKeysDict();
            this.labels = buildLabelsDict();
            removeReorderCols(dt);
            List<string> header = buildHeader(dt);
            ////build the file
            StringBuilder sb = new StringBuilder();
           // sb.AppendLine(string.Join(separator, columnNames));
            switch (data.format)
            {
                case "csv":
                    sb.AppendLine(String.Join(separator, header));
                    foreach (DataRow row in dt.Rows)
                    {
                        sb.AppendLine(buildLineForCSV(row,foreignkeys,separator));
                    }
                    //encoding e'  presa dal Web.Config "textencoding"
                    File.WriteAllText(path, sb.ToString(), System.Text.Encoding.GetEncoding(encoding));
                    stream = new FileStream(path, FileMode.Open);
                    break;
                case "xlsx":
                    File.Delete(this.path);
                    FileInfo finfo = new FileInfo(this.path);
                    ExcelPackage package = new ExcelPackage(finfo);
                    buildSheetXLSX(package, dt, foreignkeys, header);
                    package.Save();
                    stream = new FileStream(this.path, FileMode.Open);
                    break;
                default: 
                    stream = null; 
                    break;
            }
            return stream;
               
        }
        private List<string> buildHeader(DataTable dt)
        {
            List<string> header = new List<string>();
            var cols = dt.Columns;
            foreach (DataColumn c in cols)
                if (this.labels.ContainsKey(c.ColumnName))
                    header.Add(this.labels[c.ColumnName]);
            return header;
        }
        private Dictionary<string,string> buildLabelsDict()
        {
            string columns = data.columns;
            Dictionary<string, string> labels = new Dictionary<string, string>();
            if (columns != null)
            {
                List<dynamic> cols = Newtonsoft.Json.JsonConvert.DeserializeObject<List<dynamic>>(columns);
                foreach (var c in cols)
                {
                    if (c.field != null)
                    {
                        string title = c.field.ToString();
                        string fieldname = c.field.ToString();
                        if (c.title != null)
                            title = c.title.ToString();
                           
                                if (!labels.ContainsKey(fieldname))
                                {
                                    labels.Add(fieldname, title);
                                }
                                else
                                {
                                    labels[fieldname] = title;
                                }
                            }
                    }
             }
            return labels;
        }
        private Dictionary<string, List<KeyValuePair<string, string>>> buildForeignKeysDict()
        {
            string columns = data.columns;
             Dictionary<string, List<KeyValuePair<string, string>>> foreignkeys = new Dictionary<string, List<KeyValuePair<string, string>>>();
            //0 = field name , 1 = key , 2= description
            if (columns != null)
            {
                List<dynamic> cols = Newtonsoft.Json.JsonConvert.DeserializeObject<List<dynamic>>(columns);
                foreach (var c in cols)
                {
                    if (c.field != null)
                    {
                        string fieldname = c.field.ToString();
                        if (c.values!=null)
                        foreach (var v in c.values)
                        {
                            string value = v.value.ToString();
                            string text = v.text.ToString();
                            List<KeyValuePair<string, string>> element = new List<KeyValuePair<string, string>>();
                            if (!foreignkeys.ContainsKey(fieldname))
                            {
                                element.Add(new KeyValuePair<string, string>(value, text));
                                foreignkeys.Add(fieldname, element);
                            }
                            else
                            {
                                foreignkeys[fieldname].Add(new KeyValuePair<string, string>(value, text));
                            }
                        }
                    }
                }
            }
            return foreignkeys;
        }
        private void buildSheetXLSX(ExcelPackage package, DataTable dt, Dictionary<string, List<KeyValuePair<string, string>>> foreignkeys,List<string> header)
        {
            ExcelWorksheet ws = package.Workbook.Worksheets.Add("info");
            int c = 1;
            foreach (string h in header)
            {
                ws.Cells[1, c].Value = h;
                c++;
            }
            Dictionary<int, string> fieldFormats = new Dictionary<int, string>();
            //get field  formats 
            int columnPosition = 0;
            string dateformat = "yyyy-mm-dd"; //ISO default format
            if (System.Configuration.ConfigurationManager.AppSettings["dateFormatGridExportXlsx"] != null)
                dateformat = System.Configuration.ConfigurationManager.AppSettings["dateFormatGridExportXlsx"].ToString();
            foreach (DataColumn col in dt.Columns)
            {
                //ISO Date Format
                if (col.DataType == typeof(DateTime))
                    fieldFormats.Add(columnPosition, dateformat);
                if (col.DataType == typeof(Int32) && !foreignkeys.ContainsKey(col.ColumnName))
                    fieldFormats.Add(columnPosition, "0");
                if (col.DataType == typeof(Decimal) || col.DataType == typeof(Double) || col.DataType == typeof(float))
                    fieldFormats.Add(columnPosition, "0.00");

                columnPosition++;
            }

            ws.Cells[1, 1, 1, c - 1].Style.Font.Bold = true;
            int rownum = 2;
            foreach (DataRow row in dt.Rows)
            {
               buildLineForXLSX(row, foreignkeys,rownum,ws);
               rownum++;
            }
            try
            { 
                //set formats 
                foreach (var f in fieldFormats.Keys)
                    ws.Column(f + 1).Style.Numberformat.Format = fieldFormats[f];
                
                if (this.autoFitLimitRows > 0 && rownum <=  this.autoFitLimitRows)
                    ws.Cells[ws.Dimension.Address].AutoFitColumns();
            }
            catch { }
        }
        /// <summary>
        /// Remove the columns which are not part of the visible cols in grid from the datatable 
        /// </summary>
        /// <param name="dt"></param>
        private void removeReorderCols(DataTable dt)
        {
            var cols = dt.Columns;
            List<string> colsToRemove = new List<string>();
            foreach (DataColumn c in cols)
            {
                if (!labels.ContainsKey(c.ColumnName))
                    colsToRemove.Add(c.ColumnName);
            }
            foreach (var cr in colsToRemove)
            {
                dt.Columns.Remove(cr);
            }
            int skip = 0;
            foreach (string colName in labels.Keys)
            {
                if (!dt.Columns.Contains(colName))// se la select ha una colonna in meno rispetto alle visibili in grid 
                    skip++;
                if (dt.Columns.Contains(colName))
                    if (dt.Columns.Count <= labels.Keys.ToList().IndexOf(colName)) // se sono out of bound significa che la colonna/e mancante era precedente e quindi devo abbassare l' indice
                        dt.Columns[colName].SetOrdinal(labels.Keys.ToList().IndexOf(colName) - skip);
                    else
                        dt.Columns[colName].SetOrdinal(labels.Keys.ToList().IndexOf(colName));
            }
        }
        private void buildLineForXLSX(DataRow row, Dictionary<string, List<KeyValuePair<string, string>>> foreignkeys, int rownum, ExcelWorksheet ws)
        {
            for (var j = 0; j < row.Table.Columns.Count; j++)
            {
                var columnName =row.Table.Columns[j].ColumnName;
                if (foreignkeys.ContainsKey(columnName))
                {
                    var values = foreignkeys[columnName];
                    var thevalue = values.Where(t => t.Key == row[columnName].ToString()).FirstOrDefault();
                    if (thevalue.Key != null)
                        ws.Cells[rownum, j + 1].Value = thevalue.Value;
                    else
                        ws.Cells[rownum, j + 1].Value = row[columnName];
                }
                else
                {
                    if (row.Table.Columns[columnName].DataType == typeof(Int32))
                        ws.Cells[rownum, j + 1].Value = row.Field<Int32?>(columnName);
                    else if (row.Table.Columns[columnName].DataType == typeof(Decimal))
                        ws.Cells[rownum, j + 1].Value = row.Field<Decimal?>(columnName);
                    else if (row.Table.Columns[columnName].DataType == typeof(Double))
                        ws.Cells[rownum, j + 1].Value = row.Field<Double?>(columnName);
                    else if (row.Table.Columns[columnName].DataType == typeof(float))
                        ws.Cells[rownum, j + 1].Value = row.Field<float?>(columnName);
                    else if (row.Table.Columns[columnName].DataType == typeof(DateTime))
                        ws.Cells[rownum, j + 1].Value = row.Field<DateTime?>(columnName);
                    else 
                        ws.Cells[rownum, j + 1].Value = preventMacroInjection(row[columnName].ToString());
                }
            }

        }
       
        private static string preventMacroInjection(string fieldContent)
        {
            var match = fieldContent.IndexOfAny(new char[] { '@', '+', '-', '=', '|', '%' }) != -1;
            if (match)
                fieldContent = fieldContent.Replace("|", "\\|");
            return fieldContent;
        }
        private static string buildLineForCSV(DataRow row, Dictionary<string, List<KeyValuePair<string, string>>> foreignkeys, string separator)
        {
            IEnumerable<string> fields = row.ItemArray.Select(field =>
                            field.ToString());
            Dictionary<int,string> positionCol = new Dictionary<int,string>();
            int j;
            for (j=0;j < row.Table.Columns.Count;j++)
            {
                positionCol.Add(j,row.Table.Columns[j].ColumnName);
            }
            int i = 0;
            var fieldarrayUnsafe = fields.ToArray();
            string[] fieldarray = fieldarrayUnsafe.Select(x => SanitizeValuesForCSV(x,separator)).ToArray();
            for (i = 0; i < fields.Count(); i++)
            {
                if (foreignkeys.ContainsKey(positionCol[i]))
                {
                    var values = foreignkeys[positionCol[i]];
                    var thevalue = values.Where(t => t.Key == fieldarray[i]).FirstOrDefault();
                    if (thevalue.Key != null)
                        fieldarray[i] = string.Concat("\"", thevalue.Value.Replace("\"", "\"\""), "\"");
                }
                else
                    fieldarray[i] = string.Concat("\"", preventMacroInjection(fieldarray[i]).Replace("\"", "\"\""), "\"");
            }
            return string.Join(separator, fieldarray);
        }
        private static string SanitizeValuesForCSV(object value, string delimeter)
        {
            string output;

            if (value == null) return "";

            if (value is DateTime)
            {
                output = ((DateTime)value).ToLongDateString();
            }
            else
            {
                output = value.ToString();
            }

            if (output.Contains(delimeter) || output.Contains("\""))
                output = '"' + output.Replace("\"", "\"\"") + '"';

            output = output.Replace("\n", " ");
            output = output.Replace("\r", "");

            return output;
        }
    }
}
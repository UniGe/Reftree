using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using MagicEventsManager.DB;
using OfficeOpenXml;


namespace MagicEventsManager.Logic
{
    public class DatabaseImportInfo
    {
        public string ImportEndStoredProcedure { get; set; }
        public string ImportTablePrefix { get; set; }
        public string ImportTableColumnPrefix { get; set; }
        public bool CreateTable { get; set; }
       
    }
    public class FileStructureInfo
    {
        public string TextFileSeparator { get; set; }
        public int ExcelSheetNumber { get; set; }
        public int SkipRows { get; set; }
        public int TakeRows { get; set; }
        public bool HasHeader { get; set; }
    }
    public class Magic_FileImportSetting
    {
        public int ID { get; set; }
        public string Code { get; set; }
        public string FilePath { get; set; }
        public string MoveImportedToPath { get; set; }
        public DatabaseImportInfo DBInfo { get; set; }
        public FileStructureInfo FileStructureInfo { get; set; }

        public Magic_FileImportSetting()
        { }
        public  Magic_FileImportSetting(DataSet ds)
        {
            var row = ds.Tables[0].Rows[0];
            this.Code = row["Code"].ToString();
            this.ID = int.Parse(row["ID"].ToString());
            this.FilePath = row["FilePath"].ToString();
            this.MoveImportedToPath = row["MoveImportedToPath"].ToString();
            this.FileStructureInfo = new FileStructureInfo();
            this.FileStructureInfo.ExcelSheetNumber = int.Parse(row.IsNull("ExcelSheetNumber") ? "0" : row["ExcelSheetNumber"].ToString());
            this.FileStructureInfo.SkipRows = int.Parse(row.IsNull("SkipRows")  ? "0" : row["SkipRows"].ToString());
            this.FileStructureInfo.TakeRows = int.Parse(row.IsNull("TakeRows")  ? "1000000" : row["TakeRows"].ToString());
            this.FileStructureInfo.TextFileSeparator = row["TextFileSeparator"].ToString();
            this.FileStructureInfo.HasHeader = Boolean.Parse(row["FileHasHeaderRow"].ToString());
            this.DBInfo = new DatabaseImportInfo();
            this.DBInfo.ImportEndStoredProcedure = row["ImportEndStoredProcedure"].ToString();
            this.DBInfo.ImportTableColumnPrefix = row["ImportTableColumnPrefix"].ToString();
            this.DBInfo.ImportTablePrefix = row["ImportTablePrefix"].ToString();
            this.DBInfo.CreateTable = bool.Parse(row["CreateTable"].ToString());
        }
        private static string CreateTABLE(string tableName, DataTable table, string extension)
        {
            string schema = "dbo";
            string tablename = tableName;
            if (tableName.Contains("."))
            {
                schema = tableName.Split('.')[0];
                tableName = tableName.Split('.')[1];
            }
            string sqlsc;
            sqlsc = @"IF (NOT EXISTS (SELECT * 
                            FROM INFORMATION_SCHEMA.TABLES 
                        WHERE TABLE_SCHEMA = '{0}' 
                        AND  TABLE_NAME = '{1}'))
                CREATE TABLE {0}.{1}(";

            sqlsc = String.Format(sqlsc, schema, tableName);
            for (int i = 0; i < table.Columns.Count; i++)
            {
                sqlsc += "\n [" + table.Columns[i].ColumnName + "] ";
                string columnType = extension == ".xml" && table.Columns[i].ColumnName == "Content" ? "System.Data.SqlTypes.SqlXml" : table.Columns[i].DataType.ToString();
                switch (columnType)
                {
                    case "System.Int32":
                        sqlsc += " int ";
                        break;
                    case "System.Int64":
                        sqlsc += " bigint ";
                        break;
                    case "System.Int16":
                        sqlsc += " smallint";
                        break;
                    case "System.Byte":
                        sqlsc += " tinyint";
                        break;
                    case "System.Decimal":
                        sqlsc += " decimal ";
                        break;
                    case "System.DateTime":
                        sqlsc += " datetime ";
                        break;
                    case "System.Data.SqlTypes.SqlXml":
                        sqlsc += " xml ";
                        break;
                    case "System.String":
                    default:
                        sqlsc += string.Format(" nvarchar({0}) ", table.Columns[i].MaxLength == -1 ? "max" : table.Columns[i].MaxLength.ToString());
                        break;
                }
                if (table.Columns[i].AutoIncrement)
                    sqlsc += " IDENTITY(" + table.Columns[i].AutoIncrementSeed.ToString() + "," + table.Columns[i].AutoIncrementStep.ToString() + ") ";
                if (!table.Columns[i].AllowDBNull)
                    sqlsc += " NOT NULL ";
                sqlsc += ",";
            }
            return sqlsc.Substring(0, sqlsc.Length - 1) + "\n)";
        }
        private DataTable ToDataTable(ExcelWorksheet ws, int skip, int take, int takecols, bool hasHeaderRow = true)
        {
            var tbl = new DataTable();

            if (take > ws.Dimension.Rows)
                take = ws.Dimension.Rows;
            if (takecols > ws.Dimension.Columns)
                takecols = ws.Dimension.Columns;
            int firstRowidx = 1;
            if (skip != 0)
                firstRowidx = skip;

            foreach (var firstRowCell in ws.Cells[firstRowidx, 1, firstRowidx, takecols]) tbl.Columns.Add(hasHeaderRow ? normalizeColumnName(firstRowCell.Text) : string.Format("EXCEL_C{0}", firstRowCell.Start.Column));


            var startRow = hasHeaderRow ? 2 + skip : 1 + skip;
            for (var rowNum = startRow; rowNum <= take; rowNum++)
            {
                var wsRow = ws.Cells[rowNum, 1, rowNum, takecols];
                var row = tbl.NewRow();
                foreach (var cell in wsRow)
                {                    
                    row[cell.Start.Column - 1] = cell.Text;
                }
                tbl.Rows.Add(row);
            }
            return tbl;
        }
        private DataTable ToDataTable(string file, int skip, int take, bool hasHeaderRow = true)
        {
            var tbl = new DataTable();
            var lines = File.ReadLines(file);
            char separator = this.FileStructureInfo.TextFileSeparator == null ? ';' : this.FileStructureInfo.TextFileSeparator.ToCharArray().First();
            if (take > lines.Count())
                take = lines.Count();
          
            int firstRowidx = 1;
            if (skip != 0)
                firstRowidx = skip;
            string firstline = lines.First();
            var cols = firstline.Split(this.FileStructureInfo.TextFileSeparator.ToCharArray().First());
            int colnum = 1;
            foreach (var s in lines.First().Split(separator))
            {
                tbl.Columns.Add(hasHeaderRow ? normalizeColumnName(s) : string.Format(this.DBInfo.ImportTableColumnPrefix + "{0}", colnum));
                colnum++;
            }

            var startRow = hasHeaderRow ? 2 + skip : 1 + skip;
            int currRow = 1;
            foreach (var line in lines)
            {
                if (currRow >= startRow)
                {
                    
                    var row = tbl.NewRow();
                    var vals = line.Split(separator);
                    int col = 0;
                    foreach (var value in vals)
                    {
                        row[col] = value;
                        col++;
                    }
                    tbl.Rows.Add(row);
                }
                currRow++;
            }
            return tbl;
        }
        public static string normalizeColumnName(string colname)
        {
            colname = Regex.Replace(colname, "/[&\\/\\#,+()$~%.'\":*?<>{}]/g", "");
            colname = Regex.Replace(colname, "/\\s+/g", "");
            colname = Regex.Replace(colname, "/^[0-9]/g", "");
            return colname;
        }
        /// <summary>
        /// Text files
        /// </summary>
        /// <param name="path"></param>
        /// <param name="filename"></param>
        /// <param name="skip"></param>
        /// <param name="take"></param>
        /// <param name="key"></param>
        /// <returns></returns>
        public DataTable ReadFileAndPushInTable(string path, string filename,int skip, int take, string key)
        {
                DataTable dt = ToDataTable(Path.Combine(path,filename), skip, take, this.FileStructureInfo.HasHeader);
                return dt;
        }
        /// <summary>
        /// XLSX files
        /// </summary>
        /// <param name="path"></param>
        /// <param name="filename"></param>
        /// <param name="worksheetidx"></param>
        /// <param name="skip"></param>
        /// <param name="take"></param>
        /// <param name="takecols"></param>
        /// <param name="key"></param>
        /// <returns></returns>
        public DataTable ReadFileAndPushInTable(string path, string filename, int worksheetidx, int skip, int take, int takecols, string key)
        {
            DirectoryInfo d = new DirectoryInfo(path);

            FileInfo f = new FileInfo(Path.Combine(path, filename));

            using (var package = new ExcelPackage(f))
            {
                //ExcelWorkbook workBook = package.Workbook;                    
                // per ogni foglio di lavoro nel file excel 
                //foreach (ExcelWorksheet ws in workBook.Worksheets)

                ExcelWorksheet ws = package.Workbook.Worksheets[worksheetidx];
                int maxrows = ws.Dimension.Rows;
                int maxcols = ws.Dimension.Columns;
                int limitrows = maxrows;
                if (skip > maxrows)
                    throw new ArgumentException("skip is greater than number of rows in the worksheet");
                if (takecols > maxcols)
                    takecols = maxcols;
                if ((skip + take) <= maxrows)
                    limitrows = skip + take;
                DataTable dt = ToDataTable(ws, skip, take, takecols, this.FileStructureInfo.HasHeader);
                return dt;

            }

        }
        internal class tempData {
            internal string key { get; set; }
            internal DataTable data { get; set; }
        }
        private tempData importXlsx(string path)
        { 
            string key = System.Guid.NewGuid().ToString();
            var dt = this.ReadFileAndPushInTable(Path.GetDirectoryName(path), Path.GetFileName(path), this.FileStructureInfo.ExcelSheetNumber, this.FileStructureInfo.SkipRows, this.FileStructureInfo.TakeRows, 50, key);
            return new tempData { key = key , data = dt };
        }
        private tempData importTextFile(string path)
        {
            string key = System.Guid.NewGuid().ToString();
            var dt = this.ReadFileAndPushInTable(Path.GetDirectoryName(path), Path.GetFileName(path), this.FileStructureInfo.SkipRows, this.FileStructureInfo.TakeRows, key);
            return new tempData { key = key, data = dt };
      
        }
        private tempData importXml(string path)
        {
            string key = System.Guid.NewGuid().ToString();
            DataTable dt = new DataTable();

            DataColumn idColumn = new DataColumn("ID", typeof(System.Int32));
            idColumn.AllowDBNull = false;
            idColumn.AutoIncrement = true;
            idColumn.AutoIncrementSeed = 1;
            idColumn.AutoIncrementStep = 1;
            dt.Columns.Add(idColumn);

            dt.Columns.Add(new DataColumn("Content", typeof(System.String)));

            DataRow row = dt.NewRow();
            //row["ID"] = 1;
            row["Content"] = new System.Data.SqlTypes.SqlXml(new System.Xml.XmlTextReader(path)).Value;

            dt.Rows.Add(row);

            return new tempData { key = key, data = dt };
        }
        public string ImportFile(string path, string connectionString)
        {
            tempData td = null;
            string extension = Path.GetExtension(path).ToLower();
            if (extension == ".xlsx")
                td = this.importXlsx(path);
            else if (extension == ".xml")
                td = this.importXml(path);
            else
                td = this.importTextFile(path);

            string tableprefix = this.DBInfo.ImportTablePrefix == null ? "dbo.Magic_ImportedFile_Staging" : this.DBInfo.ImportTablePrefix;
            string tablename = tableprefix;
            //add GUID as a further field in the data table 
            DataColumn newColumn = new System.Data.DataColumn("FileImport_GUID", typeof(System.String));
            newColumn.DefaultValue = td.key;
            td.data.Columns.Add(newColumn);

            if (extension != ".xml")
            {
                DataColumn newColumn_rn = new System.Data.DataColumn("RowNumber", typeof(System.Int32));
                td.data.Columns.Add(newColumn_rn);
                int i = 1;
                foreach (DataRow r in td.data.Rows)
                {
                    r["RowNumber"] = i; i++;
                }
            }
            string sql = String.Empty;
            //creation of the staging table if it does not exists
            if (this.DBInfo.CreateTable == true)
            {
                tablename += "_" + DateTime.Now.Ticks.ToString();
                Utils.buildAndExecDirectCommandNonQuery(connectionString, CreateTABLE(tablename, td.data, extension), new Object[] { });
            }
                //insert into the import master data. It starts with the flag error to true 
            sql = String.Format("INSERT INTO dbo.Magic_FileImports(GUID,TableName,ImportSettings_ID,OrigFilePath,Flag_Error) VALUES ('{0}','{1}',{2},'{3}',1)", td.key, tablename, this.ID.ToString(),path);
            Utils.buildAndExecDirectCommandNonQuery(connectionString,sql,new Object[] { });
            //Bulk copy into data table
            SqlBulkCopy sbc2 = new SqlBulkCopy(connectionString);
            sbc2.DestinationTableName = tablename;
            sbc2.BulkCopyTimeout = 300;
            sbc2.WriteToServer(td.data);
            sbc2.Close();
            //Ok the bulk has been performed, let's put the error flag to 0
            sql = String.Format("UPDATE dbo.Magic_FileImports set Flag_Error=0 where GUID= '{0}'", td.key);
            Utils.buildAndExecDirectCommandNonQuery(connectionString, sql, new Object[] { });
            return td.key;
        }
    }

}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data;
using MagicFramework.Helpers;
using OfficeOpenXml;
using System.IO;
using DevExpress.Xpo.DB;
using iTextSharp.text.pdf.codec.wmf;
using System.Data.Entity;

namespace MagicFramework.Models
{
   
    public class ExcelDocument
    {
        public List<string> orderedSheets { get; set; }
        public Dictionary<string, Dictionary<string, ExcelTable>> sheets { get; set; }
        public Dictionary<string, List<string>> orderedTables { get; set; }
        public List<string> fnames { get; set; } //output files to produce... if more than 1 a zip will be made.
        const string sheetPlaceHolder = "@";
        const string fileNameColum = "file_name";
        public string model_path { get; set; }
        public DataTable ReplaceInfo = null; 

        private string storedProcedure_ {  get; set; }
        private dynamic inputData_ { get; set; }
        private string connectionString_ { get; set; }
        private string whereCondition_ {  get; set; }
        private string stdFileName_ { get; set; }
        private int? idUser_ { get; set; }
        private int? idUserGroup_ { get; set; }


        /// <summary>
        /// constructor
        /// </summary>
        /// <param name="storedprocedure">gets data</param>
        /// <param name="inputData">contains front end data, tipmodId property required </param>
        /// <param name="whereCondition">filters</param>
        /// <param name="connectionString">optional connection string, to be evaluated when session is off e.g. Chron job</param>
        public ExcelDocument(string storedprocedure, dynamic inputData,string stdFileName, string whereCondition = null,string connectionString = null,int? idUser = null,int? idUserGroup = null )
        {
            this.storedProcedure_ = storedprocedure;
            this.inputData_ = inputData;
            this.stdFileName_ = stdFileName;
            this.whereCondition_ = whereCondition;
            this.connectionString_ = connectionString;
            this.idUser_ = idUser;
            this.idUserGroup_ = idUserGroup;
            this.fnames = new List<string>();

        }

        public void FillExcelFromStoredProcedure(int? sqlCommandTimeout = null) {
            var dbutils = new DatabaseCommandUtils();

            if (sqlCommandTimeout != null)
                dbutils.sqlCommandTimeout = (int)sqlCommandTimeout;

            //calls the database script which will provide the data for the ExcelDocument class
            DataSet ds = dbutils.GetDataSetFromStoredProcedure(storedProcedure_, inputData_, connectionString_, whereCondition_, idUser_, idUserGroup_);
            //1st table contains the model path (if any) , 2nd is the Tables List, 2nd contains columns definition for each table, the 3rd and following tables will be mapped as data in the same order of the tables defined in the 1st query

            Dictionary<string, List<DataRow>> data = new Dictionary<string, List<DataRow>>();
          
            this.model_path = ds.Tables[0].Rows[0]["excel_model_path"].ToString();

            /*inserito per la gestione del nome dei file da SP. S.M 10/04/2024*/
            if (ds.Tables[0].Columns.Contains("excel_file_name") && ds.Tables[0].Rows[0]["excel_file_name"] != null)
            {
                String name = DateTime.Now.Ticks.ToString() + "_" + ds.Tables[0].Rows[0]["excel_file_name"].ToString();
                stdFileName_ = string.IsNullOrEmpty(name) ? stdFileName_ : Path.Combine(Path.GetDirectoryName(stdFileName_), name);
                File.Delete(stdFileName_);
            }



            this.ReplaceInfo = ds.Tables[0];
            DataTable allSheets = ds.Tables[1];
            DataTable columnsdefinition = ds.Tables[2];

            //get columns an map them to tables
            Dictionary<string, List<DataRow>> columnsoftable = new Dictionary<string, List<DataRow>>();
            foreach (DataRow c in columnsdefinition.Rows)
            {
                string tablename = GetCompositeKey(columnsdefinition, c, c["table_name"].ToString(), stdFileName_);
                if (!columnsoftable.ContainsKey(tablename))
                    columnsoftable.Add(tablename, new List<DataRow>());
                columnsoftable[tablename].Add(c);
            }
            //get sheets and tables definition and data
            int tableIdx = 0;//data starts from the 4th table returned from the stored procedure
            this.sheets = new Dictionary<string, Dictionary<string, ExcelTable>>();
            this.orderedSheets = new List<string>();
            this.orderedTables = new Dictionary<string, List<string>>();

            //build a dictionary with all the data 
            string iterationtab = String.Empty;
            foreach (DataTable dtab in ds.Tables)
            {
                if (tableIdx > 2) //data starts from the 4th table returned from the stored procedure --> index 3
                {
                    foreach (DataRow r in ds.Tables[tableIdx].Rows)
                    {
                        iterationtab = GetCompositeKey(ds.Tables[tableIdx], r, r["table_name"].ToString(), stdFileName_);
                        if (!data.ContainsKey(iterationtab) && !String.IsNullOrEmpty(iterationtab))
                            data.Add(iterationtab, new List<DataRow>());
                        data[iterationtab].Add(r);
                    }
                }
                tableIdx++;
            }

            foreach (DataRow t in allSheets.Rows)
            {
                string sheetname = t["sheet"].ToString();
                string tablename = t["table_name"].ToString();
                bool isprotected = false;

                if (t.Table.Columns.Contains("is_protected"))
                    isprotected = t.Field<bool>("is_protected");

                string fname = stdFileName_;
                if (t.Table.Columns.Contains(fileNameColum))
                {
                    var fnameFromDb = t.Field<string>(fileNameColum);
                    if (!String.IsNullOrEmpty(fnameFromDb))
                    {
                        fname = GetWholeFileName(stdFileName_, fnameFromDb);
                        File.Delete(fname);
                    }
                }

                sheetname = GetCompositeSheetName(sheetname, fname);
                tablename = GetCompositeKey(allSheets, t, tablename, stdFileName_);
                //list of the files to produce
                if (!this.fnames.Contains(fname))
                    this.fnames.Add(fname);

                if (fnames.Count > 50)
                    throw new ArgumentException("Quota of 50 excel files exceeded!");

                if (!this.sheets.ContainsKey(sheetname))
                {
                    this.sheets.Add(sheetname, new Dictionary<string, ExcelTable>());
                    this.orderedSheets.Add(sheetname);
                    this.orderedTables.Add(sheetname, new List<string>());
                }
                if (!this.sheets[sheetname].ContainsKey(tablename))
                {

                    List<DataRow> tabledata = new List<DataRow>();
                    if (data.ContainsKey(tablename))
                        tabledata = data[tablename];

                    this.sheets[sheetname].Add(tablename, new ExcelTable(columnsoftable[tablename], tabledata, t, isprotected));
                    this.orderedTables[sheetname].Add(tablename);
                }
                tableIdx++;
            }
        }
        public string CreateZip(string outputpath)
        {
            Ionic.Zip.ZipFile zip = new Ionic.Zip.ZipFile();
            zip.AddFiles(this.fnames,"");
            zip.Comment = "MagicFramework excel generation Zip output";
            string outputroot = Path.GetDirectoryName(outputpath);
            string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(outputpath);
            string zipOutput = Path.Combine(outputroot,fileNameWithoutExtension + ".zip");
            zip.Save(zipOutput);
            zip.Dispose();
            return zipOutput;    
        }
        /// <summary>
        /// resolves which filename to choose depending on the fact that the get stored procedure has returned the file_name field or not...
        /// </summary>
        /// <param name="standardFileName">generated automatically</param>
        /// <param name="dbFileName">got from db stored as an input</param>
        /// <returns></returns>
        private string GetWholeFileName(string standardFileName,string dbFileName)
        {
            if (String.IsNullOrEmpty(dbFileName))
                return standardFileName;
            string dir = Path.GetDirectoryName(standardFileName);
            return Path.Combine(dir, dbFileName);
        }
        private string GetCompositeSheetName(string sheetName, string stdFileName)
        {
            //multifile management
            if (String.IsNullOrEmpty(this.model_path))
                return stdFileName + sheetPlaceHolder + sheetName;
            return sheetName;
        }
        private string GetCompositeKey(DataTable dt, DataRow dr, string key,string stdFileName)
        {
            //multifile management occurs only on excel created from scratch (without the model) 
            if (String.IsNullOrEmpty(this.model_path))
            {
                if (dt.Columns.Contains(fileNameColum))
                    return dr[fileNameColum] + sheetPlaceHolder + key;
                return stdFileName + sheetPlaceHolder + key;
            }
            return key;
        }
    }
    public enum ColumnTypes
    {
        STRING,
        DATE,
        NUMBER,
        IMAGEREMOTE,
        IMAGELOCAL,
        HYPERLINK,
        FORMULA
    }

    public enum RemoteHTTPCallTypes
    {
        GET,
        POST
    }
    public class ImageSettings
    {
        public int maxwidth { get; set; }
        public int maxheight { get; set; }
        public bool fitToCell { get; set; }
    }

    public class Columnspecification
    {
        public string label { get; set; }
        public string format { get; set; }
        public string color { get; set; }
        public ColumnTypes type { get; set; }
        public bool boldInHeader { get; set; }
        public bool boldInBody { get; set; }
        public bool textVerticalCentered { get; set; }
        public bool textHorizontalCentered { get; set; }
        public string subtotal { get; set; }
        public RemoteHTTPCallTypes remote_call_type { get; set; }
        public List<Formula> formulas { get; set; }
        public ImageSettings imageSettings { get; set; }
        public bool wrapText { get; set; }
        public  int? width { get; set; }
        public bool isProtected { get; set; }
        public ExcelAddInConfig ExcelAddInConfig { get; set; }
        public string getSubTotal(int startrow, int endrow)
        {
            if (String.IsNullOrEmpty(this.subtotal))
                return null;
            else
                return String.Format(this.subtotal, startrow.ToString(), endrow.ToString());
        }
    }

    public class ExcelAddInConfig
    {
        public string CascadeToColumn { get; set; }
        public bool IsF2DataSource { get; set; }
    }

    public class TableHeader {
        /// <summary>
        /// key is column name , value is the label
        /// </summary>
        public Dictionary<string, Columnspecification> columns { get; set; }
        public string mergedCols { get; set; }
        public string color { get; set; }
        public bool textVerticalCentered { get; set; }
        public bool textHorizontalCentered { get; set; }
        /// <summary>
        /// 1,1  one empty row below prev element and start from B col
        /// </summary>
        public string offset { get; set; }
        public List<string> orderedColumns { get; set; }

    }

    public class Formula {
        public string expression { get; set; }
        public string type { get; set; }
        public string command { get; set; }
        public string range { get; set; }//form columns' formulas it's the relative (From 1st table row) starting - end row where the formula should be applied
        public string formatExpression(string topleft)
        {
            return String.Format(this.expression, topleft);
        }
    }
    public class ExcelTable
    {
        public string sheet { get; set; }
        public string tablename { get; set; }
        public TableHeader header { get; set; }
        public bool skipHeader { get; set; }
        public bool createBorders { get; set; }
        public int? rowsHeight { get; set; } 
        /// <summary>
        /// key is the column which determines the calculation of a subtotal. Values are list of subtotals e.g SUBTOTAL(9,I$:I$)  
        /// </summary>
        public string groupby { get; set; }
        /// <summary>
        /// the list of DataRow which are in the "body" of the table
        /// </summary>
        public List<DataRow> rows { get; set; }
        /// <summary>
        /// the list of formulas applied in the table range
        /// </summary>
        public List<Formula> formulas { get; set; }
        public bool isProtected { get; set; }
        /// <summary>
        /// Builds an ExcelTable instance with data and configuration
        /// </summary>
        /// <param name="columns"></param>
        /// <param name="data"></param>
        /// <param name="table"></param>
        public ExcelTable(List<DataRow> columns, List<DataRow> data, DataRow table,bool isProtected = false)
        {
            this.isProtected = isProtected;
            TableHeader th = new TableHeader();
            th.columns = new Dictionary<string, Columnspecification>();
            th.orderedColumns = new List<string>();
            foreach (DataRow c in columns)
            {
                var cs = new Columnspecification();
                //If the sheet is protected columns are protected by default, they will be editable only if an explicit false configuration is given. 
                //This is Excel and  EPPlus  behaviour...if you don't like it write to them and don't complain with Dario Tortone! Thanks 
                if (this.isProtected && c.Table.Columns.Contains("is_protected"))
                    cs.isProtected = c.Field<bool>("is_protected");
                
                cs.boldInBody = bool.Parse(c["column_bold"].ToString());
                cs.boldInHeader = bool.Parse(c["header_bold"].ToString());
                cs.subtotal = c["subtotals"].ToString();
                cs.color = c["color"].ToString();
                cs.format = c["format"].ToString();
                cs.label = c["label"].ToString();
                cs.textHorizontalCentered = bool.Parse(c["text_horizontal_center"].ToString());
                cs.textVerticalCentered = bool.Parse(c["text_vertical_center"].ToString());
                cs.imageSettings = new ImageSettings();

                if (c.Table.Columns.Contains("width"))
                    if (!c.IsNull("width"))
                        cs.width = int.Parse(c["width"].ToString());

                if (c.Table.Columns.Contains("wraptext"))
                    if (!c.IsNull("wraptext"))
                        cs.wrapText = bool.Parse(c["wraptext"].ToString());

                if (c.Table.Columns.Contains("image_settings"))
                    cs.imageSettings = Newtonsoft.Json.JsonConvert.DeserializeObject<ImageSettings>(c["image_settings"].ToString());

                if (c.Table.Columns.Contains("excel_add_in_config"))
                    cs.ExcelAddInConfig = Newtonsoft.Json.JsonConvert.DeserializeObject<ExcelAddInConfig>(c["excel_add_in_config"].ToString());

                cs.formulas = new List<Formula>();
                if (!c.IsNull("column_formulas"))
                {
                    string formulas = c["column_formulas"].ToString();
                    dynamic formula_obj = Newtonsoft.Json.JsonConvert.DeserializeObject(formulas);
                    foreach (var f in formula_obj)
                    {
                        Formula formula_ = new Formula();
                        formula_.command = f.command;
                        formula_.expression = f.expression;
                        formula_.type = f.type;
                        formula_.range = f.range;
                        cs.formulas.Add(formula_);
                    }
                }
                th.columns.Add(c["column_name"].ToString(), cs);
                th.orderedColumns.Add(c["column_name"].ToString());

                string column_type = c["column_type"].ToString();
                ColumnTypes ctps = ColumnTypes.STRING;
                if (!String.IsNullOrEmpty(column_type))
                {
                    if (Enum.TryParse(column_type, true, out ctps))
                        cs.type = ctps;
                }
                else
                    cs.type = ctps;

                RemoteHTTPCallTypes http_call_type = RemoteHTTPCallTypes.GET;

                if (c.Table.Columns.Contains("remote_call_type"))
                {
                    string http_call_type_val = c["remote_call_type"].ToString();
                    if (Enum.TryParse(http_call_type_val, true, out http_call_type))
                        cs.remote_call_type = http_call_type;
                }
                else
                    cs.remote_call_type = http_call_type;
             
            }
            th.mergedCols = table["header_merged_columns"].ToString();
            th.color = table["header_color"].ToString();
            th.offset = table["header_offset"].ToString();
            th.textHorizontalCentered = bool.Parse(table["header_text_horizontal_center"].ToString());
            th.textVerticalCentered = bool.Parse(table["header_text_vertical_center"].ToString());
            this.formulas = new List<Formula>();
            if (!table.IsNull("table_formulas"))
            {
                string formulas = table["table_formulas"].ToString();
                dynamic formula_obj = Newtonsoft.Json.JsonConvert.DeserializeObject(formulas);
                foreach (var f in formula_obj)
                {
                    Formula formula_ = new Formula();
                    formula_.command = f.command;
                    formula_.expression = f.expression;
                    formula_.type = f.type;
                    formula_.range = f.range;
                    this.formulas.Add(formula_);
                }

                    
            }
            this.createBorders = bool.Parse(table["createborders"].ToString());
            this.header = th;
            this.groupby = table["groupby"].ToString();
            this.rows = data;
            if (table.Table.Columns.Contains("rows_height"))
                if (!table.IsNull("rows_height"))
                    this.rowsHeight = int.Parse(table["rows_height"].ToString());
            if (table.Table.Columns.Contains("skip_header"))
                if (!table.IsNull("skip_header"))
                    this.skipHeader = table.Field<Boolean>("skip_header");
        }
        /// <summary>
        /// returns the tableRange for current table
        /// </summary>
        /// <param name="headerrow">The row where the header is supposed to be</param>
        /// <param name="lastrow">The last row of the table including subtotals and totals</param>
        /// <returns></returns>
        public ExcelAddress getTableRange(int headerrow,int lastrow,bool excludeHeader = false,bool excludeFooter = false)
        {
            int coloffset = 0;
            int fromRow = excludeHeader == true ? 1 + headerrow : headerrow;
            int toRow = excludeFooter == true ?   (lastrow - 1) : lastrow;
            if (!String.IsNullOrEmpty(this.header.offset))
             coloffset = int.Parse(this.header.offset.Split(',')[1].ToString());
            ExcelAddress a = new ExcelAddress(fromRow, 1 + coloffset, toRow, 1+ coloffset + this.header.columns.Count - 1);
            return a;
        }
    }
}
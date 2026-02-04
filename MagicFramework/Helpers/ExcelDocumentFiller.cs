using Ionic.Zip;
using MagicFramework.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OfficeOpenXml;
using OfficeOpenXml.DataValidation;
using OfficeOpenXml.DataValidation.Contracts;
using OfficeOpenXml.Drawing;
using OfficeOpenXml.Style;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI.WebControls;
using System.Xml;
using System.Xml.Linq;

namespace MagicFramework.Helpers
{
    public class ExcelDocumentFiller
    {
        const string sheetPlaceHolder = "@";
        const string fileNameColum = "file_name";
        public string outputFileName { get; set; }
        public static Regex ExcelAddressComponentsRegex = new Regex(@"(?<column>[A-Z]+)(?<row>\d+)");
        private int? SqlCommandTimeout_ { get; set; } = null;

        public ExcelDocumentFiller(int? sqlCommandTimeout = null) { 
            if (sqlCommandTimeout != null)
                this.SqlCommandTimeout_ = sqlCommandTimeout;
        }
        private static string ColumnIndexToColumnLetter(int colIndex)
        {
            int div = colIndex;
            string colLetter = String.Empty;
            int mod = 0;

            while (div > 0)
            {
                mod = (div - 1) % 26;
                colLetter = (char)(65 + mod) + colLetter;
                div = (int)((div - mod) / 26);
            }
            return colLetter;
        }
        private string getCellRangeFromIndexes(int startrow, int startcolumn, int endrow, int columncount)
        {
            //char topleft_ = (Char)(64 + startcolumn);
            //string topleft = topleft_.ToString() + (startrow).ToString() + ":";
            string topleft = ColumnIndexToColumnLetter(startcolumn) + (startrow).ToString() + ":";
            //char bottomright_ = (Char)(64 + startcolumn + (columncount - 1));
            //string bottomright = bottomright_.ToString() + (endrow).ToString();
            string bottomright = ColumnIndexToColumnLetter(startcolumn + (columncount - 1)) + (endrow).ToString();
            string modelRange = topleft + bottomright;
            return modelRange;
        }
        private void CreateProportionedThumbnailFromImage(System.Drawing.Image originalfile, ImageSettings imageSettings, ExcelWorksheet ws, int row, int column, string columnName)
        {
            try
            {
                MFLog.LogInFile("EXCELIMAGE::Openning bitmap from originalFile", MFLog.logtypes.INFO);
                Bitmap srcBmp = new Bitmap(originalfile);
                //i have to change the picture size mantaining ratio...
                if (srcBmp.Height > imageSettings.maxheight || srcBmp.Width > imageSettings.maxwidth)
                {
                    MFLog.LogInFile("EXCELIMAGE::creating proportioned thumbnail", MFLog.logtypes.INFO);
                    float ratio = (float)srcBmp.Width / (float)srcBmp.Height;

                    MFLog.LogInFile("EXCELIMAGE::creating proportioned thumbnail with height:" + (imageSettings.maxheight * ratio).ToString(), MFLog.logtypes.INFO);
                    SizeF newSize = new SizeF(imageSettings.maxheight * ratio, imageSettings.maxheight);

                    MFLog.LogInFile("EXCELIMAGE::creating proportioned thumbnail target", MFLog.logtypes.INFO);
                    Bitmap target = new Bitmap((int)newSize.Width, (int)newSize.Height);
                    using (Graphics graphics = Graphics.FromImage(target))
                    {
                        MFLog.LogInFile("EXCELIMAGE::opened image", MFLog.logtypes.INFO);
                        graphics.CompositingQuality = CompositingQuality.HighSpeed;
                        graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
                        graphics.CompositingMode = CompositingMode.SourceCopy;
                        graphics.DrawImage(srcBmp, 0, 0, newSize.Width, newSize.Height);

                        using (MemoryStream memoryStream = new MemoryStream())
                        {
                            MFLog.LogInFile("EXCELIMAGE::Saving into stream", MFLog.logtypes.INFO);
                            target.Save(memoryStream, ImageFormat.Png);
                            System.Drawing.Image newimage = System.Drawing.Image.FromStream(memoryStream);
                            MFLog.LogInFile("EXCELIMAGE::Setting in cell", MFLog.logtypes.INFO);
                            setImageInCell(newimage, ws, row, column, columnName, imageSettings);
                        }
                        graphics.Dispose();
                    }
                }
                else
                {
                    MFLog.LogInFile("EXCELIMAGE::Setting in cell resizing skipped", MFLog.logtypes.INFO);
                    setImageInCell(originalfile, ws, row, column, columnName, imageSettings);
                }
                MFLog.LogInFile("EXCELIMAGE::Disposing srcBmp", MFLog.logtypes.INFO);
                srcBmp.Dispose();
            }
            catch (Exception ex) {
                throw ex;
            }

        }
        /// <summary>
        /// Calculates and resizes the % an image should be resized in order to stay under max bounds. The ratio is preserved by the resize routine.
        /// </summary>
        /// <param name="maxHeight"></param>
        /// <param name="realHeight"></param>
        /// <returns></returns>
        private void setImageInCell(System.Drawing.Image img, ExcelWorksheet ws, int row, int column, string columnName, ImageSettings imageSettings)
        {
            //  ws.Row(row).Height = img.Size.Height;
            //  ws.Column(column).Width =img.Size.Width;
            //  ws.Row(row).CustomHeight = true;
            MFLog.LogInFile("EXCELIMAGE::setImageInCell begins", MFLog.logtypes.INFO);
            string tempPath = Path.Combine(Path.GetTempPath(), getImageName(columnName) + ".png");
            img.Save(tempPath, System.Drawing.Imaging.ImageFormat.Png);

            // Add picture using path
            ExcelPicture pic = ws.Drawings.AddPicture(getImageName(columnName), tempPath);
            File.Delete(tempPath);
            MFLog.LogInFile("EXCELIMAGE::set position", MFLog.logtypes.INFO);
            pic.SetPosition(row - 1, 0, column - 1, 0);
            MFLog.LogInFile("EXCELIMAGE::fit to cell", MFLog.logtypes.INFO);
            if (imageSettings.fitToCell)
            {
                MFLog.LogInFile("EXCELIMAGE::fit to cell", MFLog.logtypes.INFO);
                pic.EditAs = eEditAs.TwoCell;
            }
            MFLog.LogInFile("EXCELIMAGE::setImageInCell ends", MFLog.logtypes.INFO);

            //pic.SetSize(100);
        }

        /// <summary>
        /// returns the filestream of the generated Excel file
        /// </summary>
        /// <param name="storedprocedure">Gets the model placeholders data</param>
        /// <param name="storedprocedureAfter">To be launched after the document is ready</param>
        /// <param name="data">a set of parameters from the UI. tipmodId is mandatory</param>
        /// <param name="path">path of the output file. If the generation has no model and the database provides filenames it will be used as the name of the resulting ZIP file</param>
        /// <param name="wherecondition">a filter</param>
        /// <param name="connectionString">the connection when session is off</param>
        /// <returns></returns>
        public FileStream fillDocument(string storedprocedure, string storedprocedureAfter, dynamic data, string path, string wherecondition = null, string connectionString = null, int? idUser = null, int? idUserGroup = null)
        {
            File.Delete(path);
            string outputpath = path;
            ExcelDocument ed = new ExcelDocument(storedprocedure, data, path, wherecondition, connectionString, idUser, idUserGroup);
            ed.FillExcelFromStoredProcedure(this.SqlCommandTimeout_);
            //build without model
            if (String.IsNullOrEmpty(ed.model_path))
            {
                foreach (var f in ed.fnames)
                {
                    buildDocument(ed, f);
                }
            }
            else //build with model
            {
                outputpath = Path.Combine(Path.GetDirectoryName(ed.model_path), "FillSessions", Path.GetFileNameWithoutExtension(ed.model_path) + "_" + DateTime.Now.Ticks.ToString() + ".xlsx");
                fillDocument_(ed, outputpath, storedprocedure);
            }

            // replacing values

            //multiple files creation is managed only if the model is not specified 
            if (String.IsNullOrEmpty(ed.model_path))
            {
                if (ed.fnames.Count > 1)
                {
                    outputpath = ed.CreateZip(outputpath);
                }
                else
                    outputpath = ed.fnames[0];
            }
            //call a stored when finished if the Stored_Output has a value
            if (!String.IsNullOrEmpty(storedprocedureAfter))
            {
                //https://gitlab.ilosgroup.com/ilos/operations/-/issues/350
                data.Outputpath = outputpath;
                JObject o = JObject.FromObject(data);
                AfterfillDocument_(storedprocedureAfter, o, connectionString, wherecondition, idUser, idUserGroup);
            }

            this.outputFileName = outputpath;

            var stream = new FileStream(outputpath, FileMode.Open);
            return stream;
        }
        private string getImageName(string name)
        {
            return DateTime.Now.Ticks.ToString() + "_" + name;
        }
        internal class PostRemoteCall
        {
            internal string url { get; set; }
            internal string payload { get; set; }

            internal PostRemoteCall(string jsondata)
            {
                dynamic prc = Newtonsoft.Json.JsonConvert.DeserializeObject(jsondata);
                this.url = prc.url;
                this.payload = prc.payload.ToString();
            }
        }
        private void setCellValue(Columnspecification columnSpecification, DataRow dr, string columnName, int row, int column, ExcelWorksheet ws)
        {
            try
            {
                int maxWidth = columnSpecification.imageSettings != null ? columnSpecification.imageSettings.maxwidth : 0;
                int maxHeight = columnSpecification.imageSettings != null ? columnSpecification.imageSettings.maxheight : 0;

                switch (columnSpecification.type)
                {
                    //url;link text e.g https://myurl.mydomain.it/...;Click here
                    case ColumnTypes.HYPERLINK:
                        var splitString = dr[columnName].ToString().Split(';');
                        string linktext = "Click here";
                        if (splitString.Length > 1)
                            linktext = dr[columnName].ToString().Split(';')[1];
                        string url = splitString[0];
                        ws.Cells[row, column].Hyperlink = new Uri(url);
                        ws.Cells[row, column].Value = linktext;
                        break;
                    case ColumnTypes.IMAGEREMOTE:
                    case ColumnTypes.IMAGELOCAL:
                        if (!dr.IsNull(columnName))
                        {
                            System.Drawing.Image img;
                            if (columnSpecification.type == ColumnTypes.IMAGEREMOTE)
                            {
                                using (var client = new HttpClient())
                                {
                                    //using (StringContent payload = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(data.requestObject), System.Text.Encoding.UTF8, "application/json"))
                                    //{
                                    if (columnSpecification.remote_call_type == RemoteHTTPCallTypes.GET)
                                    {
                                        var bArray = client.GetByteArrayAsync(dr[columnName].ToString()).Result;
                                        using (MemoryStream ms = new MemoryStream(bArray))
                                        {
                                            img = System.Drawing.Image.FromStream(ms);
                                            CreateProportionedThumbnailFromImage(img, columnSpecification.imageSettings, ws, row, column, columnName);
                                        }
                                    }
                                    if (columnSpecification.remote_call_type == RemoteHTTPCallTypes.POST)
                                    {
                                        var prc = new PostRemoteCall(dr[columnName].ToString());
                                        using (StringContent payload = new StringContent(prc.payload, System.Text.Encoding.UTF8, "application/json"))
                                        {
                                            var bArray = client.PostAsync(prc.url, payload).Result;
                                            using (MemoryStream ms = new MemoryStream(bArray.Content.ReadAsByteArrayAsync().Result))
                                            {
                                                img = System.Drawing.Image.FromStream(ms);
                                                CreateProportionedThumbnailFromImage(img, columnSpecification.imageSettings, ws, row, column, columnName);
                                            }
                                        }

                                    }
                                    //}
                                }
                            }
                            else
                            {
                                try
                                {
                                    img = System.Drawing.Image.FromFile(dr[columnName].ToString());
                                    CreateProportionedThumbnailFromImage(img, columnSpecification.imageSettings, ws, row, column, columnName);
                                }
                                catch (Exception ex) {
                                    MFLog.LogInFile("IMAGELOCAL::" + ex.Message, MFLog.logtypes.ERROR);
                                    MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                                }
                            }

                        }
                        break;
                    case ColumnTypes.FORMULA:
                        if (!dr.IsNull(columnName))
                        {
                            ws.Cells[row, column].Formula = String.Format(dr[columnName].ToString(), row);
                        }
                            break;
                    default:
                        ws.Cells[row, column].Value = dr[columnName];
                        if (dr.IsNull(columnName))
                        {
                            ws.Cells[row, column].Value = null;
                        }
                        break;
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
        }
        private void setSubTotalFormula(Dictionary<string, int> columnlastSubtotalsRow, int groupbyindex, int coloffset, int row, ExcelWorksheet ws, ExcelTable tab, string prefix)
        {
            bool isfirstsubtotal = true;
            List<string> columnsWithSubtotals = columnlastSubtotalsRow.Keys.ToList();
            foreach (var c in columnsWithSubtotals)
            {
                int colindex = tab.header.orderedColumns.IndexOf(c) + 1;
                string subtotalFormat = tab.header.columns[c].getSubTotal(columnlastSubtotalsRow[c], row - 1);
                ws.Cells[row, colindex + coloffset].Formula = subtotalFormat;
                //unifiy cells which have the same data in case of group by column
                if (groupbyindex != 0)
                {
                    ws.Cells[columnlastSubtotalsRow[c], groupbyindex + coloffset, row - 1, groupbyindex + coloffset].Style.VerticalAlignment = ExcelVerticalAlignment.Center;
                    ws.Cells[columnlastSubtotalsRow[c], groupbyindex + coloffset, row - 1, groupbyindex + coloffset].Merge = true;
                }
                if (!String.IsNullOrEmpty(tab.header.columns[c].format))
                    ws.Cells[row, colindex + coloffset].Style.Numberformat.Format = tab.header.columns[c].format;
                ws.Cells[row, colindex + coloffset].Style.Font.Bold = true;
                if (isfirstsubtotal)
                {
                    int prefixColumn = groupbyindex == 0 ? colindex + coloffset - 1 : groupbyindex + coloffset;
                    ws.Cells[row, prefixColumn].Value = groupbyindex == 0 ? prefix : prefix + ws.Cells[row - 1, groupbyindex + coloffset].Value.ToString();
                    ws.Cells[row, prefixColumn].Style.Font.Bold = true;
                    ws.Cells[row, prefixColumn].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
                    ws.Cells[row, prefixColumn].Style.VerticalAlignment = ExcelVerticalAlignment.Center;
                    isfirstsubtotal = false;
                }
                if (groupbyindex != 0)
                    for (var i = columnlastSubtotalsRow[c]; i <= row - 1; i++)
                        ws.Row(i).OutlineLevel = 1;
                columnlastSubtotalsRow[c] = row + 1;
            }
        }
        /// <summary>
        /// Applies conditional formatting to a certain range of cells 
        /// </summary>
        /// <param name="formula">the conditional formatting formula</param>
        /// <param name="ws">the sheet where formula is applied</param>
        /// <param name="range">the range of cells where to apply</param>
        private void applyFormula(Formula formula, ExcelWorksheet ws, string range, int priority = 1)
        {
            if (string.IsNullOrEmpty(formula.expression) && !string.IsNullOrEmpty(formula.range))
            {//no expression with a specific range
                switch (formula.type)
                {
                    case "fontName":
                        ws.Cells[formula.range].Style.Font.Name = formula.command;
                        break;
                    case "fontColor":
                        var color_ = ColorTranslator.FromHtml(formula.command);
                        ws.Cells[formula.range].Style.Font.Color.SetColor(color_);
                        break;
                    case "fontSize":
                        ws.Cells[formula.range].Style.Font.Size = float.Parse(formula.command) ;
                        break;
                    case "italic":
                        ws.Cells[formula.range].Style.Font.Italic = string.Equals(formula.command, "true");
                        break;
                    case "bold":
                        ws.Cells[formula.range].Style.Font.Bold = string.Equals(formula.command, "true");
                        break;
                    case "numberFormat":
                        ws.Cells[formula.range].Style.Numberformat.Format = formula.command;
                        break;
                    case "align":
                        switch (formula.command)
                        {
                            case "center":
                                ws.Cells[formula.range].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                                break;
                            case "right":
                                ws.Cells[formula.range].Style.HorizontalAlignment = ExcelHorizontalAlignment.Right;
                                break;
                            case "left":
                                ws.Cells[formula.range].Style.HorizontalAlignment = ExcelHorizontalAlignment.Left;
                                break;
                        }
                        break;
                }
            }
            else
            {
                //get the first top left cell
                string topleft = range.Split(':')[0];
                var _cond = ws.ConditionalFormatting.AddExpression(new ExcelAddress(range));
                switch (formula.type)
                {
                    case "color":
                        _cond.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                        _cond.Style.Fill.BackgroundColor.Color = System.Drawing.ColorTranslator.FromHtml(formula.command);
                        break;
                    case "fontColor":
                        var color_ = ColorTranslator.FromHtml(formula.command);
                        _cond.Style.Font.Color.Color = color_;
                        break;
                    case "italic":
                        _cond.Style.Font.Italic = string.Equals(formula.command, "true"); ;
                        break;
                    case "bold":
                        _cond.Style.Font.Bold = string.Equals(formula.command, "true");
                        break;
                    case "numberFormat":
                        _cond.Style.NumberFormat.Format = formula.command;
                        break;
                    default:
                        _cond.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                        _cond.Style.Fill.BackgroundColor.Color = System.Drawing.ColorTranslator.FromHtml(formula.command);
                        break;
                }
                _cond.Formula = formula.formatExpression(topleft);
                _cond.Priority = priority;
            }
        }
        /// <summary>
        /// Arrnges column according to fomulas and layout
        /// </summary>
        /// <param name="tab"></param>
        /// <param name="ws"></param>
        /// <param name="startrow"></param>
        /// <param name="column"></param>
        /// <param name="endrow"></param>
        /// <param name="autofit"></param>
        /// <returns>true/false if autofit should or not be performed</returns>
        private bool manageColumns(ExcelTable tab, ExcelWorksheet ws, int startrow, int column, int endrow)
        {
            bool autofit = true;
            int columnIndex = 1;
            foreach (var col in tab.header.orderedColumns)
            {
                string columnRange = getCellRangeFromIndexes(startrow, column + columnIndex, endrow, 1);
                if (tab.header.columns[col].formulas.Count() > 0)
                {
                    foreach (var f in tab.header.columns[col].formulas)
                    {
                        //check wether a subrange has been specified 
                        if (!String.IsNullOrEmpty(f.range))
                        {
                            int sub_startrow = startrow + int.Parse(f.range.Split(',')[0]);
                            int sub_endrow = startrow + int.Parse(f.range.Split(',')[1]);
                            string sub_columnrange = getCellRangeFromIndexes(sub_startrow, column + columnIndex, sub_endrow, 1);
                            //columns' formulas have higher priority than table ...
                            applyFormula(f, ws, sub_columnrange, 1);
                        }
                        else
                            //columns' formulas have higher priority than table ...
                            applyFormula(f, ws, columnRange, 1);
                    }
                }
                if (tab.header.columns[col].wrapText)
                    ws.Cells[columnRange].Style.WrapText = true;
                if (tab.header.columns[col].width != null)
                {
                    autofit = false;
                    ws.Column(column + columnIndex).Width = (double)tab.header.columns[col].width;
                }
                columnIndex++;
            }
            return autofit;
        }
        /// <summary>
        /// Adds rows after a certain row index and shifts down the other rows 
        /// </summary>
        /// <param name="row"></param>
        /// <param name="count"></param>
        /// <param name="ws"></param>
        private void InsertTableRowsAfter(int row, int count, ExcelWorksheet ws)
        {
            //insert rows copying the styles of the bookmark row
            ws.InsertRow(row + 1, count, row);
            //ws.DeleteRow(row);
        }
        /// <summary>
        /// launches a SP after the document has beeen built 
        /// </summary>
        private void AfterfillDocument_(string storedprocedure, dynamic data, string connectionString = null,string whereCondition = null,int? idUser = null,int? idUserGroup = null)
        {
            var dbutils = new DatabaseCommandUtils();

            if (this.SqlCommandTimeout_ != null)
                dbutils.sqlCommandTimeout = (int)this.SqlCommandTimeout_;

            dbutils.GetDataSetFromStoredProcedure(storedprocedure, data, connectionString,whereCondition,idUser,idUserGroup);
        }
        private void fillDocument_(ExcelDocument document, string outputpath, string storedProcedureName)
        {

#if DEBUG
            document.model_path = "C:\\temp\\Modello_estrazione_finale_conguagli.xlsx";
            outputpath = "C:\\temp\\FillSession\\Modello_estrazione_finale_conguagli.xlsx";
            if (File.Exists(outputpath)) 
                File.Delete(outputpath);
#endif


            Directory.CreateDirectory(Path.GetDirectoryName(outputpath));
            File.Copy(document.model_path, outputpath);
            FileInfo finfo = new FileInfo(outputpath);
            ExcelPackage package = new ExcelPackage(finfo);
            F2ExcelConfig f2ExcelConfig = new F2ExcelConfig(storedProcedureName);
            List<ListValidationInfo> listValidationInfos = new List<ListValidationInfo>();

            foreach (var ws in package.Workbook.Worksheets)
            {
                //  var dim = ws.Dimension;
                if (document.sheets.ContainsKey(ws.Name))
                    //loop through tables of a certain sheet
                    foreach (var t in document.sheets[ws.Name])
                    {
                        string tablename = t.Key;
                        ExcelTable tab = t.Value;
                        string lookForChangeColumn = tab.groupby;

                        string subtotalprefix = "Subtotal of ";
                        int groupbyindex = tab.header.orderedColumns.IndexOf(tab.groupby) + 1;
                        bool isfirstbodyrow = true;
                        int row;
                        Dictionary<string, int> columnlastSubtotalsRow = new Dictionary<string, int>();
                        // first loop through all non-merged cells
                        var dim = ws.Dimension;
                        bool autofit = true;
                        for (int r = dim.Start.Row; r <= dim.End.Row; ++r)
                            for (int c = dim.Start.Column; c <= dim.End.Column; ++c)
                            {
                                if (ws.Cells[r, c].Merge || ws.Cells[r, c].Value == null) continue;
                                string s = ws.Cells[r, c].Value.ToString();
                                if (string.IsNullOrEmpty(s)) continue;
                                if (s.StartsWith("%%" + tablename))
                                {

                                    var worksheetXDocument = XDocument.Parse(ws.WorksheetXml.OuterXml);
                                    row = r;

                                    foreach (var col in tab.header.columns)
                                    {
                                        if (!String.IsNullOrEmpty(col.Value.subtotal))
                                            columnlastSubtotalsRow.Add(col.Key, row);
                                    }

                                    int rowsCount = tab.rows.Count;

                                    InsertTableRowsAfter(r, rowsCount, ws);
                                    var listValidationFirstRowAdresses = ListValidationFirstRowAddresses(ws, ws.Cells[r, c], tab.header.columns.Count);
                                    listValidationInfos.Add(new ListValidationInfo
                                    {
                                        FirstRowAddresses = listValidationFirstRowAdresses,
                                        WorksheetName = ws.Name,
                                        RowsCount = rowsCount,
                                    });

                                    bool isFirstRow = true;

                                    foreach (DataRow dr in tab.rows)
                                    {
                                        if (!String.IsNullOrEmpty(lookForChangeColumn))
                                            //Manage subtotal based on a groupby column 
                                            if (!dr[lookForChangeColumn].Equals(ws.Cells[row - 1, groupbyindex + c - 1].Value) && !isfirstbodyrow)
                                            {
                                                setSubTotalFormula(columnlastSubtotalsRow, groupbyindex, c - 1, row, ws, tab, subtotalprefix);
                                                row++;
                                                ws.InsertRow(row, 1, row - 2);
                                            }

                                        for (var j = 1; j < dr.Table.Columns.Count; j++)
                                        {
                                            var columnName = dr.Table.Columns[j].ColumnName;
                                            int columnIndex = j + c - 1;

                                            setCellValue(tab.header.columns[columnName], dr, columnName, row, columnIndex, ws);
                                            //ws.Cells[row, j + c - 1].Value = dr[columnName];
                                            if (!String.IsNullOrEmpty(tab.header.columns[columnName].format))
                                                ws.Cells[row, columnIndex].Style.Numberformat.Format = tab.header.columns[columnName].format;

                                            if (isFirstRow)
                                            {
                                                ExcelAddInConfig addInConfig = tab.header.columns[columnName].ExcelAddInConfig;
                                                if (addInConfig == null)
                                                {
                                                    continue;
                                                }

                                                var cell = ws.Cells[row, columnIndex];

                                                if (addInConfig.IsF2DataSource)
                                                {
                                                    string formula = GetColumnListValidationFormula(cell.Address, worksheetXDocument);
                                                    var actionCoordinates = CoordinatesFromFormula(formula, ws.Name);
                                                    var a = Action.Create(tablename, columnName, actionCoordinates.Worksheet, actionCoordinates.Address);
                                                    f2ExcelConfig.Actions.Add(a);
                                                }

                                                if (!string.IsNullOrEmpty(addInConfig.CascadeToColumn))
                                                {
                                                    int cascadingColumnIndex = dr.Table.Columns.IndexOf(addInConfig.CascadeToColumn);
                                                    string cascadingCellColumnName = dr.Table.Columns[cascadingColumnIndex].ColumnName;
                                                    int columnIndexDifference = cascadingColumnIndex - j;
                                                    string cascadingCellRelativeAddress = $"+{columnIndexDifference}:0";

                                                    string eventStartAddress = cell.Address;
                                                    Match m = ExcelAddressComponentsRegex.Match(eventStartAddress);
                                                    string eventEndAddress = $"{m.Groups["column"].Value}{int.Parse(m.Groups["row"].Value) + rowsCount - 1}";
                                                    var cascadingTargetCell = ws.Cells[row, columnIndex + columnIndexDifference];
                                                    string formula = GetColumnListValidationFormula(cascadingTargetCell.Address, worksheetXDocument);
                                                    var afterActionCoordinates = CoordinatesFromFormula(formula, ws.Name);
                                                    Event e = new Event
                                                    {
                                                        Worksheet = ws.Name,
                                                        Address = $"{eventStartAddress}:{eventEndAddress}",
                                                    };
                                                    e.Actions.Add(Action.Create(tablename, cascadingCellColumnName, afterActionCoordinates.Worksheet, afterActionCoordinates.Address, ws.Name, cascadingCellRelativeAddress));
                                                    f2ExcelConfig.Events.Add(e);
                                                }
                                            }
                                        }
                                        row++;
                                        isFirstRow = false;
                                        isfirstbodyrow = false;
                                    }
                                    if (!String.IsNullOrEmpty(lookForChangeColumn) && !isfirstbodyrow)
                                    {
                                        ws.InsertRow(row, 1);
                                        setSubTotalFormula(columnlastSubtotalsRow, groupbyindex, c - 1, row, ws, tab, subtotalprefix);
                                        row++;
                                    }
                                    string tableBodyRange = getCellRangeFromIndexes(r, c, row - 1, tab.header.columns.Count());
                                    foreach (var f in tab.formulas)
                                    {
                                        applyFormula(f, ws, tableBodyRange, 2);
                                    }
                                    //apply formulas to single columns 
                                    //int columnIndex = 1;
                                    //foreach (var col in tab.header.orderedColumns)
                                    //{
                                    //    if (tab.header.columns[col].formulas.Count() > 0)
                                    //    {
                                    //        string columnRange = getCellRangeFromIndexes(r, c + columnIndex, row - 1, 1);
                                    //        foreach (var f in tab.header.columns[col].formulas)
                                    //        {
                                    //            //columns have higher priority than table ...
                                    //            applyFormula(f, ws, columnRange, 1);
                                    //        }
                                    //        if (tab.header.columns[col].wrapText)
                                    //            ws.Cells[columnRange].Style.WrapText = true;
                                    //        if (tab.header.columns[col].width != null)
                                    //        {
                                    //            autofit = false;
                                    //            ws.Column(c + columnIndex).Width = (int)tab.header.columns[col].width;
                                    //        }
                                    //        columnIndex++;
                                    //    }
                                    //}
                                    autofit = manageColumns(tab, ws, r, c - 1, row - 1);
                                    if (tab.rowsHeight != null)
                                        for (int i = r; i < row; i++)
                                        {
                                            ws.Row(i).CustomHeight = true;
                                            ws.Row(i).Height = (double)tab.rowsHeight;
                                        }
                                    //Total at Footer level if subtotals have been set
                                    if (!isfirstbodyrow && columnlastSubtotalsRow.Keys.Count() > 0)
                                    {
                                        List<string> columnlastSubtotalsRowKeys = columnlastSubtotalsRow.Keys.ToList();
                                        foreach (var col in columnlastSubtotalsRowKeys)
                                            columnlastSubtotalsRow[col] = r;
                                        ws.InsertRow(row, 1);
                                        setSubTotalFormula(columnlastSubtotalsRow, 0, c - 1, row, ws, tab, "Total ");
                                        row++;
                                    }

                                }
                            }
                        try
                        {
                            if (autofit)
                                ws.Cells[ws.Dimension.Address].AutoFitColumns();
                        }
                        catch { }
                    }
            }
            ReplaceValues(document, package);
            if (f2ExcelConfig.IsAddConfig())
            {
                var worksheet = package.Workbook.Worksheets.Add("ILOSExcelAddInConfig");
                worksheet.Cells["A1"].Value = JsonConvert.SerializeObject(f2ExcelConfig, new JsonSerializerSettings
                {
                    NullValueHandling = NullValueHandling.Ignore
                });
            }
            package.Save();
            ExtendListValidations(outputpath, listValidationInfos);
        }

        private static string GetColumnListValidationFormula(string address, XDocument d)
        {
            var columnNode = d.Descendants()
                .Where(n =>
                    n.Name.LocalName.Equals("dataValidation")
                        && (
                            n.Attributes().Where(a => a.Name.LocalName.Equals("sqref") && a.Value.StartsWith(address)).Any()
                            || n.Descendants().Where(nn => nn.Name.LocalName.EndsWith("sqref") && nn.Value.StartsWith(address)).Any()
                        )
                )
                .FirstOrDefault();
            if (columnNode != null)
            {
                return columnNode.Value;
            }
            return null;
        }

        private static string[] ListValidationFirstRowAddresses(ExcelWorksheet ws, ExcelRange startCell, int columnsCount)
        {
            List<string> firstRowAddresses = new List<string>();
            for (int columnIndex = startCell.Start.Column; columnIndex < startCell.Start.Column + columnsCount; columnIndex++)
            {
                var firstRowCell = ws.Cells[startCell.Start.Row, columnIndex];
                firstRowAddresses.Add(firstRowCell.Address);
            }
            return firstRowAddresses.ToArray();
        }

        private static void ExtendListValidations(string filePath, List<ListValidationInfo> listValidationInfos)
        {
            string xml = null;
            using (ZipFile archive = new ZipFile(filePath))
            {
                var workbook = archive["xl/workbook.xml"];
                using (Stream s = workbook.OpenReader())
                {
                    StreamReader reader = new StreamReader(s);
                    xml = reader.ReadToEnd();
                }
                XDocument workbookXDocument = XDocument.Parse(xml);
                foreach (var worksheetNode in workbookXDocument.Descendants().Where(n => n.Name.LocalName.Equals("sheet")))
                {
                    string sheetName = worksheetNode.Attribute("name").Value;
                    string sheetArchivePath = $"xl/worksheets/sheet{worksheetNode.Attribute("sheetId").Value}.xml";
                    var workBookListInfo = listValidationInfos.Where(l => l.WorksheetName.Equals(sheetName)).FirstOrDefault();
                    if (workBookListInfo == null)
                    {
                        continue;
                    }
                    var worksheet = archive[sheetArchivePath];
                    using (Stream s = worksheet.OpenReader())
                    {
                        StreamReader reader = new StreamReader(s);
                        xml = reader.ReadToEnd();
                    }
                    XDocument d = XDocument.Parse(xml);
                    ExtendListValidationsUntilTableEnd(d, workBookListInfo.FirstRowAddresses, workBookListInfo.RowsCount);
                    archive.UpdateEntry(sheetArchivePath, d.ToString(SaveOptions.DisableFormatting));
                }
                archive.Save(filePath);
            }
        }

        private static XDocument ExtendListValidationsUntilTableEnd(XDocument d, string[] listValidationFirstRowAddresses, int rowsCount)
        {
            foreach (string firstRowAddress in listValidationFirstRowAddresses)
            {
                var dataValidationNode = d.Descendants()
                    .Where(n =>
                        n.Name.LocalName.Equals("dataValidation")
                        && n.Attributes().Where(a => a.Name.LocalName.Equals("sqref") && a.Value.StartsWith(firstRowAddress)).Any()
                    )
                    .FirstOrDefault();
                if (dataValidationNode != null)
                {
                    var address = dataValidationNode.Attributes().Where(a => a.Name.LocalName.Equals("sqref")).First();
                    address.Value = EndRangeSameColumn(address.Value, rowsCount);
                    continue;
                }
                dataValidationNode = d.Descendants()
                    .Where(n =>
                        n.Name.LocalName.Equals("dataValidation")
                        && n.Descendants().Where(nn => nn.Name.LocalName.EndsWith("sqref") && nn.Value.StartsWith(firstRowAddress)).Any()
                    )
                    .FirstOrDefault();
                if (dataValidationNode != null)
                {
                    var address = dataValidationNode.Descendants().Where(nn => nn.Name.LocalName.EndsWith("sqref")).First();
                    address.Value = EndRangeSameColumn(address.Value, rowsCount);
                }
            }
            return d;
        }

        private static string EndRangeSameColumn(string address, int rowsCount)
        {
            var a = new ExcelCellAddress(address.Split(':')[0]);
            var m = Regex.Match(address, @"\d");
            string column = address.Substring(0, m.Index);
            //int startRow = 
            return $"{a.Address}:{column}{a.Row + rowsCount - 1}";
        }

        private int getCurrentRow(int startRow, int relativeRow)
        {
            return startRow + relativeRow - 1;
        }
        //removes the addition of filename + -@- from the sheetlabel
        private string getSheetLabel(string wholeSheetName)
        {
            if (!wholeSheetName.Contains(sheetPlaceHolder))
                return wholeSheetName;

            return wholeSheetName.Split(sheetPlaceHolder.ToCharArray())[1];
        }
        private void buildDocument(ExcelDocument document, string path)
        {
            FileInfo finfo = new FileInfo(path);
            ExcelPackage package = new ExcelPackage(finfo);

            //get the sheets for current file....
            foreach (var sheetlabel in document.orderedSheets.Where(s => s.Contains(path + sheetPlaceHolder)))
            {
                var tables = document.sheets[sheetlabel];
                ExcelWorksheet ws = package.Workbook.Worksheets.Add(getSheetLabel(sheetlabel));

                //first row of the table
                int startrow = 1;
                //table relative index
                int row = 1;
                bool autofit = true;
                foreach (var tablename in document.orderedTables[sheetlabel])
                {
                    bool hasTotal = false;
                    int startcolumn = 1;
                    int column = 1;
                    row = 1;
                    ExcelTable tab = tables[tablename];

                    //managing protection
                    if (tab.isProtected)
                        ws.Protection.IsProtected = true;

                    int rowoffset = 0;
                    int coloffset = 0;
                    if (!String.IsNullOrEmpty(tab.header.offset))
                    {
                        rowoffset = int.Parse(tab.header.offset.Split(',')[0]);
                        coloffset = int.Parse(tab.header.offset.Split(',')[1]);
                    }

                    row = row + rowoffset;
                    column = column + coloffset;
                    //write the header
                    if (!tab.skipHeader)
                    {
                        foreach (string h in tab.header.orderedColumns)
                        {
                            ws.Cells[getCurrentRow(startrow, row), column].Value = tab.header.columns[h].label;
                            if (tab.header.columns[h].boldInHeader)
                                ws.Cells[getCurrentRow(startrow, row), column].Style.Font.Bold = true;
                            if (tab.header.textHorizontalCentered)
                                ws.Cells[getCurrentRow(startrow, row), column].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                            if (tab.header.textVerticalCentered)
                                ws.Cells[getCurrentRow(startrow, row), column].Style.VerticalAlignment = ExcelVerticalAlignment.Center;
                            column++;
                        }
                        if (!string.IsNullOrEmpty(tab.header.color))
                        {
                            ws.Cells[startrow + rowoffset, startcolumn + coloffset, startrow + rowoffset, column - 1].Style.Fill.PatternType = ExcelFillStyle.Solid;
                            ws.Cells[startrow + rowoffset, startcolumn + coloffset, startrow + rowoffset, column - 1].Style.Fill.BackgroundColor.SetColor(System.Drawing.ColorTranslator.FromHtml(tab.header.color));
                        }
                        //e.g from 1 to 6  --> 1,6
                        if (!String.IsNullOrEmpty(tab.header.mergedCols))
                        {
                            int idxstart = int.Parse(tab.header.mergedCols.Split(',')[0]);
                            int idxend = int.Parse(tab.header.mergedCols.Split(',')[1]);
                            ws.Cells[getCurrentRow(startrow, row), idxstart, getCurrentRow(startrow, row), idxend].Merge = true;
                        }
                        row++;
                    }
                    bool isfirstbodyrow = true;
                    string lookForChangeColumn = tab.groupby;
                    int groupbyindex = tab.header.orderedColumns.IndexOf(tab.groupby) + 1;

                    //init the dictionary which tarces the last row where a SUBTOTAL has been evaluated
                    Dictionary<string, int> columnlastSubtotalsRow = new Dictionary<string, int>();
                    foreach (var c in tab.header.columns)
                    {
                        if (!String.IsNullOrEmpty(c.Value.subtotal))
                            columnlastSubtotalsRow.Add(c.Key, getCurrentRow(startrow, row));
                    }
                    string subtotalprefix = "Subtotal of ";
                    //the 0 column is the table name
                    foreach (DataRow dr in tab.rows)
                    {
                        if (!String.IsNullOrEmpty(lookForChangeColumn))
                            //Manage subtotal based on a groupby column 
                            if (!dr[lookForChangeColumn].Equals(ws.Cells[getCurrentRow(startrow, row) - 1, groupbyindex + coloffset].Value) && !isfirstbodyrow)
                            {
                                setSubTotalFormula(columnlastSubtotalsRow, groupbyindex, coloffset, getCurrentRow(startrow, row), ws, tab, subtotalprefix);
                                row++;
                            }

                        for (var j = 1; j < dr.Table.Columns.Count; j++)
                        {

                            var columnName = dr.Table.Columns[j].ColumnName;

                            if (columnName == fileNameColum)
                                continue;

                            //ws.Cells[row, j + coloffset].Value = dr[columnName];
                            setCellValue(tab.header.columns[columnName], dr, columnName, getCurrentRow(startrow, row), j + coloffset, ws);

                            if (!String.IsNullOrEmpty(tab.header.columns[columnName].format))
                                ws.Cells[getCurrentRow(startrow, row), j + coloffset].Style.Numberformat.Format = tab.header.columns[columnName].format;
                            if (tab.header.columns[columnName].textHorizontalCentered)
                                ws.Cells[getCurrentRow(startrow, row), j + coloffset].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                            if (tab.header.columns[columnName].textVerticalCentered)
                                ws.Cells[getCurrentRow(startrow, row), j + coloffset].Style.VerticalAlignment = ExcelVerticalAlignment.Center;

                            if (tab.header.columns[columnName].boldInBody)
                                ws.Cells[getCurrentRow(startrow, row), j + coloffset].Style.Font.Bold = true;

                            if (tab.isProtected)
                            {
                                bool isprotected = tab.header.columns[columnName].isProtected;
                                ws.Cells[getCurrentRow(startrow, row), j + coloffset].Style.Locked = isprotected;
                            }
                            if (!String.IsNullOrEmpty(tab.header.columns[columnName].color))
                            {
                                ws.Cells[getCurrentRow(startrow, row), j + coloffset].Style.Fill.PatternType = ExcelFillStyle.Solid;
                                ws.Cells[getCurrentRow(startrow, row), j + coloffset].Style.Fill.BackgroundColor.SetColor(System.Drawing.ColorTranslator.FromHtml(tab.header.columns[columnName].color));
                            }
                        }
                        row++;
                        isfirstbodyrow = false;
                    }
                    if (!String.IsNullOrEmpty(lookForChangeColumn) && !isfirstbodyrow)
                    {
                        setSubTotalFormula(columnlastSubtotalsRow, groupbyindex, coloffset, getCurrentRow(startrow, row), ws, tab, subtotalprefix);
                        row++;
                    }
                    //Total at Footer level if subtotals have been set
                    if (!isfirstbodyrow && columnlastSubtotalsRow.Keys.Count() > 0)
                    {
                        List<string> columnlastSubtotalsRowKeys = columnlastSubtotalsRow.Keys.ToList();
                        foreach (var c in columnlastSubtotalsRowKeys)
                            columnlastSubtotalsRow[c] = startrow + rowoffset + 1;
                        setSubTotalFormula(columnlastSubtotalsRow, 0, coloffset, getCurrentRow(startrow, row), ws, tab, "Total ");
                        row++;
                        hasTotal = true;
                    }
                    if (tab.createBorders)
                    {
                        //table is built apply borders 
                        ExcelAddress modelRange = tab.getTableRange(startrow + rowoffset, getCurrentRow(startrow, row) - 1, false, hasTotal);
                        var modelTable = ws.Cells[modelRange.Address];

                        // Assign borders
                        modelTable.Style.Border.Top.Style = ExcelBorderStyle.Thin;
                        modelTable.Style.Border.Left.Style = ExcelBorderStyle.Thin;
                        modelTable.Style.Border.Right.Style = ExcelBorderStyle.Thin;
                        modelTable.Style.Border.Bottom.Style = ExcelBorderStyle.Thin;
                    }
                    //the table range without the header...execute only if there the header is not the only row
                    if (tab.rows.Count > 0)
                    {
                        string tableBodyRange = tab.getTableRange(startrow + rowoffset, getCurrentRow(startrow, row) - 1, true, hasTotal).Address;
                        foreach (var f in tab.formulas)
                        {
                            applyFormula(f, ws, tableBodyRange, 2);
                        }
                    }
                    //apply formulas to single columns 
                    //int columnIndex = 1;
                    //foreach (var col in tab.header.orderedColumns)
                    //{
                    //    if (tab.header.columns[col].formulas.Count() > 0)
                    //    {   
                    //        string columnRange = getCellRangeFromIndexes(startrow + rowoffset + 1, startcolumn + coloffset + columnIndex, getCurrentRow(startrow, row) - 1, 1);
                    //        foreach (var f in tab.header.columns[col].formulas)
                    //        {
                    //            //columns have higher priority than table ...
                    //            applyFormula(f, ws, columnRange,1);
                    //        }
                    //        columnIndex++;
                    //    }
                    //}
                    autofit = manageColumns(tab, ws, startrow + rowoffset + 1, startcolumn + coloffset - 1, getCurrentRow(startrow, row) - 1);
                    if (tab.rowsHeight != null)
                        for (int i = startrow + rowoffset + 1; i < getCurrentRow(startrow, row); i++)
                        {
                            ws.Row(i).CustomHeight = true;
                            ws.Row(i).Height = (double)tab.rowsHeight;
                        }
                    startrow = startrow + row - 1;
                }
                try
                {
                    if (autofit)
                        ws.Cells[ws.Dimension.Address].AutoFitColumns();
                }
                catch { }

            }
            ReplaceValues(document, package);
            package.Save();
        }

        private static void ReplaceValues(ExcelDocument document, ExcelPackage package)
        {
            var replaceInfo = document.ReplaceInfo;
            if (!replaceInfo.Columns.Contains("replace_value"))
            {
                return;
            }

            foreach (DataRow DBrow in replaceInfo.Rows)
            {
                string value = DBrow.Field<string>("replace_value");
                string sheetName = DBrow.Field<string>("replace_sheet");
                if (string.IsNullOrEmpty(value) || string.IsNullOrEmpty(sheetName))
                {
                    continue;
                }
                var sheet = package.Workbook.Worksheets.Where(w => w.Name.Equals(sheetName)).FirstOrDefault();
                if (sheet == null)
                {
                    continue;
                }

                // handling placeholder
                string placeholder = DBrow.Field<string>("replace_placeholder");
                if (!string.IsNullOrEmpty(placeholder))
                {
                    var cells = sheet.Cells.Where(c => string.Equals(c.Value, placeholder));
                    if (cells == null)
                    {
                        continue;
                    }
                    foreach (var cell in cells)
                    {
                        cell.Value = value;
                    }
                }
                // writing to specific cell
                else
                {
                    string cellID = (string)DBrow["replace_cell"];
                    sheet.Cells[cellID].Value = value;
                }
            }
        }

        private static ExcelCoordinates CoordinatesFromFormula(string formula, string defaultWorksheet)
        {
            string worksheet = defaultWorksheet;
            if (formula.Contains("!"))
            {
                string[] fragments = formula.Split('!');
                worksheet = fragments[0].Replace("'", "");
                formula = fragments[1];
            }
            string startAddresss = formula
                .Replace("$", "")
                .Split(':')[0];
            return new ExcelCoordinates
            {
                Worksheet = worksheet,
                Address = startAddresss,
            };
        }

        public class ExcelCoordinates
        {
            [JsonProperty("worksheet")]
            public string Worksheet { get; set; }

            [JsonProperty("address")]
            public string Address { get; set; }
        }

        public class Source
        {
            [JsonProperty("path")]
            public string Path { get; set; }

            [JsonProperty("fields")]
            public Dictionary<string, ExcelCoordinates> Fields { get; set; }
            [JsonProperty("body")]
            public Dictionary<string, object> Body { get; set; }
        }

        public class Data
        {
            [JsonProperty("source")]
            public Source Source { get; set; }
        }

        public class ActionDefinition
        {
            [JsonProperty("worksheet")]
            public List<string> Worksheet { get; set; }

            [JsonProperty("address")]
            public List<string> Address { get; set; }

            [JsonProperty("type")]
            public string Type { get; set; }

            [JsonProperty("data")]
            public Data Data { get; set; }

            [JsonProperty("after")]
            public List<Action> After { get; set; }
        }

        public class Action
        {
            [JsonProperty("type")]
            public string Type { get; set; }

            [JsonProperty("definition")]
            public ActionDefinition Definition { get; set; }

            public static Action Create(string tableName, string columnName, string listSourceWorkheet, string listSourceStartAddress, string cascadingCellWorksheet = null, string cascadingCellRelativeCoordinates = null)
            {
                var action = new Action
                {
                    Type = "data",
                    Definition = new ActionDefinition
                    {
                        Data = new Data
                        {
                            Source = new Source
                            {
                                Path = "/excel",
                                Body = new Dictionary<string, object>
                                {
                                    { "tablename", tableName },
                                    { "columnName", columnName},
                                },
                            }
                        },
                        After = new List<Action>
                        {
                            {
                                new Action
                                {
                                    Type = "excel",
                                    Definition = new ActionDefinition
                                    {
                                        Type = "excelWriteResult",
                                        Worksheet = new List<string>
                                        {
                                            { listSourceWorkheet },
                                        },
                                        Address = new List<string>
                                        {
                                            { listSourceStartAddress },
                                        },
                                    },
                                }
                            }
                        },
                    }
                };
                if (cascadingCellRelativeCoordinates != null)
                {
                    action.Definition.After[0].Definition.Worksheet.Add(cascadingCellWorksheet);
                    action.Definition.After[0].Definition.Address.Add(cascadingCellRelativeCoordinates);
                }
                return action;
            }
        }

        public class Event
        {
            [JsonProperty("type")]
            public string Type { get; set; }

            [JsonProperty("worksheet")]
            public string Worksheet { get; set; }

            [JsonProperty("address")]
            public string Address { get; set; }

            [JsonProperty("actions")]
            public List<Action> Actions { get; set; }

            public Event()
            {
                Type = "onChanged";
                Actions = new List<Action>();
            }
        }

        public class F2ExcelConfig
        {
            [JsonProperty("f2BaseURL")]
            public string F2BaseURL { get; set; }

            [JsonIgnore]
            public string F2ConfigURL { get; set; }

            [JsonProperty("applicationKey")]
            public string ApplicationKey { get; set; }

            [JsonProperty("additionalPOSTData")]
            public Dictionary<string, object> AdditionalPOSTData { get; set; }

            [JsonProperty("events")]
            public List<Event> Events { get; set; }

            [JsonProperty("actions")]
            public List<Action> Actions { get; set; }

            public F2ExcelConfig(string storedProcedureName)
            {
                var instanceConfig = MFConfiguration.GetApplicationInstanceConfiguration();
                string f2ConfigURL = ConfigurationManager.AppSettings["f2ConfigURL"];
                string f2BaseURL = ConfigurationManager.AppSettings["f2BaseURL"];
                AdditionalPOSTData = new Dictionary<string, object>();
                AdditionalPOSTData.Add("excelCreationStoredProcedureName", storedProcedureName);

                ApplicationKey = instanceConfig.appInstancename;
                F2ConfigURL = f2ConfigURL;
                F2BaseURL = f2BaseURL;
                Events = new List<Event>();
                Actions = new List<Action>();
            }

            public bool IsAddConfig()
            {
                if (Events.Count == 0)
                {
                    return false;
                }
                //if (string.IsNullOrEmpty(F2ConfigURL))
                //{
                //    throw new Exception("F2ExcelConfig: \"f2ConfigURL\" not set in web.config");
                //}
                if (string.IsNullOrEmpty(F2BaseURL))
                {
                    throw new Exception("F2ExcelConfig: \"f2BaseURL\" not set in web.config");
                }

                return true;
            }
        }

        public class ListValidationInfo
        {
            public string WorksheetName { get; set; }
            public string[] FirstRowAddresses { get; set; }
            public int RowsCount { get; set; }
        }

    }
}
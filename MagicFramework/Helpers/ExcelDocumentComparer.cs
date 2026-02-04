using OfficeOpenXml;
using OfficeOpenXml.Style;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Web;

namespace MagicFramework.Helpers
{
    public class ExcelDocumentComparer
    {
        private string File_1;
        private string File_2;
        private string SheetName;
        private string[] KeyColumns;

        private Dictionary<int, string> columnHeaders_1;
        private Dictionary<int, string> columnHeaders_2;
        private Dictionary<string, ExcelNumberFormat> columnFormats_1;
        private Dictionary<string, ExcelNumberFormat> columnFormats_2;
        private Dictionary<string, List<object>> keyValues_1;
        private Dictionary<string, List<object>> keyValues_2;

        private Dictionary<string, List<object>> added;
        private Dictionary<string, List<object>> deleted;
        private Dictionary<string, List<object>> changed;
        private Dictionary<string, List<object>> changedTo;
        private Dictionary<string, List<object>> unchanged;

        private const char KEY_SEPARATOR ='~';
        private const string KEY_SUFFIX = " (key)";
        private const string FILE_SUFFIX_1 = " (file 1)";
        private const string FILE_SUFFIX_2 = " (file 2)";
                
        ExcelWorksheet File_1Clone = null;
        ExcelWorksheet File_2Clone = null;

        private Dictionary<int, string> OUTPUT_SHEETS = new Dictionary<int, string>() {
            { 1,"SoloSuFile1" },
            { 2,"SoloSuFile2" },
            { 3,"RigheModificate" },
            { 4,"RigheUguali" },
            { 5,"File1" },
            { 6,"File2" }
        };

        internal ExcelDocumentComparer(string file_1, string file_2, string sheetName, string[] keyColumns)
        {
            File_1 = file_1;
            File_2 = file_2;
            SheetName = sheetName.ToLower();
            KeyColumns = keyColumns;

            added = new Dictionary<string, List<object>>();
            deleted = new Dictionary<string, List<object>>();
            changed = new Dictionary<string, List<object>>();
            changedTo = new Dictionary<string, List<object>>();
            unchanged = new Dictionary<string, List<object>>();

            keyValues_1 = new Dictionary<string, List<object>>();
            keyValues_2 = new Dictionary<string, List<object>>();
        }

        internal string Compare()
        {
            string statusSheet1, statusSheet2;
            ExcelWorksheet worksheet_1 = getSheet(File_1, SheetName, out statusSheet1, out File_1Clone);
            ExcelWorksheet worksheet_2 = getSheet(File_2, SheetName, out statusSheet2, out File_2Clone);

            if(statusSheet1 != "ok" || statusSheet2 != "ok")
            {
                return statusSheet1.Length > 0 ? statusSheet1 : statusSheet2;
            }

            if (worksheet_1 == null || worksheet_2 == null)
            {
                return "Worksheet '" + SheetName + "' not found!";
            }

            
            Dictionary<string, List<object>> dict_1 = getDict(worksheet_1, KeyColumns, out columnHeaders_1, out columnFormats_1, ref keyValues_1);
            Dictionary<string, List<object>> dict_2 = getDict(worksheet_2, KeyColumns, out columnHeaders_2, out columnFormats_2, ref keyValues_2);

            foreach (KeyValuePair<string, List<object>> entry_1 in dict_1)
            {
                string key = entry_1.Key;
                List<object> value_1 = entry_1.Value;

                List<object> value_2;
                if (dict_2.TryGetValue(key, out value_2))
                {
                    //row exists in other file
                    if (twoRowsAreEqual(value_1, value_2))
                    {
                        unchanged.Add(key, value_1);
                    }
                    else
                    {
                        changed.Add(key, value_1);
                        changedTo.Add(key, value_2);
                    }
                }
                else
                {
                    //row does not exist in other file
                    deleted.Add(key, value_1);
                }
            }

            foreach (KeyValuePair<string, List<object>> entry_2 in dict_2)
            {
                string key = entry_2.Key;
                List<object> value_2 = entry_2.Value;

                List<object> value_1;
                if (!dict_1.TryGetValue(key, out value_1))
                {
                    added.Add(key, value_2);
                }
            }

            return "ok";
        }

        internal ExcelPackage GenerateResultXLSX(string exportFilePath, out string status)
        {

            if (File.Exists(exportFilePath))
            {
                File.Delete(exportFilePath);
            }
            if (!File.Exists(exportFilePath))
            {
                FileInfo fileInfo = new FileInfo(exportFilePath);
                ExcelPackage excel = new ExcelPackage(fileInfo);

                ExcelWorksheet deletedSheet = excel.Workbook.Worksheets.Add(OUTPUT_SHEETS[1]);
                ExcelWorksheet addedSheet = excel.Workbook.Worksheets.Add(OUTPUT_SHEETS[2]);
                ExcelWorksheet changedSheet = excel.Workbook.Worksheets.Add(OUTPUT_SHEETS[3]);
                ExcelWorksheet unchangedSheet = excel.Workbook.Worksheets.Add(OUTPUT_SHEETS[4]);                

                if(File_1Clone != null)
                {
                    excel.Workbook.Worksheets.Add(OUTPUT_SHEETS[5],File_1Clone);
                }
                if(File_2Clone != null)
                {
                    excel.Workbook.Worksheets.Add(OUTPUT_SHEETS[6],File_2Clone);
                }

                //WRITE HEADERS SHEETS #ADDED #DELETED #UNCHANGED
                int row = 1;
                for (int keyIndex = 0; keyIndex< KeyColumns.Length; keyIndex++)
                {
                    int col = keyIndex + 1;
                    string key = KeyColumns[keyIndex];
                    
                    addedSheet.Cells[row, col].Value = key + KEY_SUFFIX;
                    deletedSheet.Cells[row, col].Value = key + KEY_SUFFIX;
                    unchangedSheet.Cells[row, col].Value =  key + KEY_SUFFIX;
                }
 
                int headerCol = KeyColumns.Length + 1;
                foreach (KeyValuePair<int, string> header in columnHeaders_1)
                {

                    ExcelNumberFormat format = columnFormats_1[header.Value];
                    
                    string val = "" + header.Value;
                    if (!KeyColumns.Contains(val))
                    {
                        deletedSheet.Cells[row, headerCol].Value = val;
                        deletedSheet.Column(headerCol).Style.Numberformat.Format = format.Format;
                        unchangedSheet.Cells[row, headerCol].Value = val;
                        headerCol++;
                    }                 
                }
                //WRITE HEADERS SHEET#ADDED
                headerCol = KeyColumns.Length + 1;
                foreach (KeyValuePair<int, string> header in columnHeaders_2)
                {
                    ExcelNumberFormat format = columnFormats_2[header.Value];
                    string val = "" + header.Value;
                    if (!KeyColumns.Contains(val))
                    {
                        addedSheet.Cells[row, headerCol].Value = val;
                        headerCol++;
                    }                 
                }                                

                //WRITE HEADERS SHEET#CHANGED
                for (int keyIndex = 0; keyIndex< KeyColumns.Length; keyIndex++)
                {
                    int col = keyIndex + 1;
                    string key = KeyColumns[keyIndex];
                    changedSheet.Cells[row, col].Value = key + KEY_SUFFIX;
                }
                headerCol = KeyColumns.Length + 1;
                foreach (KeyValuePair<int, string> header in columnHeaders_2)
                {
                    if (!KeyColumns.Contains(header.Value))
                    {
                        changedSheet.Cells[row, headerCol].Value = header.Value + FILE_SUFFIX_1;
                        headerCol += 2;
                    }
                }
                headerCol = KeyColumns.Length + 1;
                foreach (KeyValuePair<int, string> header in columnHeaders_2)
                {
                    if (!KeyColumns.Contains(header.Value))
                    {
                        changedSheet.Cells[row, headerCol + 1].Value = header.Value + FILE_SUFFIX_2;
                        headerCol += 2;
                    }
                }

                //WRITE VALUES SHEET#ADDED
                row = 2;
                foreach (KeyValuePair<string, List<object>> entry in added)
                {
                    List<object> keys = keyValues_2[entry.Key];
                    for (int i = 0; i<keys.Count; i++)
                    {
                        addedSheet.Cells[row, i+1].Value = keys[i];
                    }                    

                    int col = keys.Count + 1;
                    foreach (object val in entry.Value)
                    {
                        addedSheet.Cells[row, col].Value = val;
                        col++;
                    }
                    row++;
                }

                //WRITE VALUES SHEET#DELETED
                row = 2;
                foreach (KeyValuePair<string, List<object>> entry in deleted)
                {
                    List<object> keys = keyValues_1[entry.Key];
                    for (int i = 0; i<keys.Count; i++)
                    {
                        deletedSheet.Cells[row, i+1].Value = keys[i];
                    }

                    int col = keys.Count + 1;
                    foreach (object val in entry.Value)
                    {
                        deletedSheet.Cells[row, col].Value = val;
                        col++;
                    }
                    row++;
                }

                //WRITE VALUES SHEET#CHANGED
                row = 2;
                foreach (KeyValuePair<string, List<object>> entry in changed)
                {
                    string key = entry.Key;
                    List<object> vals_1 = entry.Value;
                    List<object> vals_2;


                    List<object> keys = keyValues_1[entry.Key];

                    for (int i = 0; i<keys.Count; i++)
                    {
                        changedSheet.Cells[row, i+1].Value = keys[i];
                    }
                   
                    if (changedTo.TryGetValue(key, out vals_2))
                    {
                        int startCol_1 = keys.Count + 1;
                        int startCol_2 = keys.Count + 2;
                        for (int i = 0; i < vals_1.Count; i++)
                        {
                            object val1 = vals_1[i];
                            changedSheet.Cells[row, startCol_1+(i*2)].Value = val1;

                            object val2 = vals_2[i];
                            changedSheet.Cells[row, startCol_2+(i*2)].Value = val2;
                            
                            if (val1.ToString() != val2.ToString())
                            {
                                Color green = System.Drawing.ColorTranslator.FromHtml("#00A933");
                                Color red = System.Drawing.ColorTranslator.FromHtml("#FF0000");

                                changedSheet.Cells[row, startCol_1+(i*2)].Style.Font.Color.SetColor(green);
                                changedSheet.Cells[row, startCol_2+(i*2)].Style.Font.Color.SetColor(red);
                            }
                        }

                    }
                    row++;
                }

                //WRITE VALUES SHEET#UNCHANGED
                row = 2;
                foreach (KeyValuePair<string, List<object>> entry in unchanged)
                {
                    List<object> keys = keyValues_1[entry.Key];

                    for(int i = 0; i<keys.Count; i++)
                    {
                        unchangedSheet.Cells[row, i+1].Value = keys[i];
                    }

                    int col = keys.Count + 1;

                    foreach (object val in entry.Value)
                    {
                        unchangedSheet.Cells[row, col].Value = val;
                        col++;
                    }
                    row++;
                }


                for (int i = 1; i<=addedSheet.Dimension.Columns; i++) //SHEET#ADDED, SHEET#DELETED, SHEET#UNCHANGED, same number of cols
                {
                    addedSheet.Cells[1, i].AutoFitColumns();
                    deletedSheet.Cells[1, i].AutoFitColumns();
                    unchangedSheet.Cells[1, i].AutoFitColumns();

                    string val1 = ""+ addedSheet.Cells[1, i].Value.ToString().Replace(KEY_SUFFIX, "").Replace(FILE_SUFFIX_1, "").Replace(FILE_SUFFIX_2, "");
                    string val2 = ""+ deletedSheet.Cells[1, i].Value.ToString().Replace(KEY_SUFFIX, "").Replace(FILE_SUFFIX_1, "").Replace(FILE_SUFFIX_2, "");
                    string val3 = ""+ unchangedSheet.Cells[1, i].Value.ToString().Replace(KEY_SUFFIX, "").Replace(FILE_SUFFIX_1, "").Replace(FILE_SUFFIX_2, "");

                    if(!columnFormats_2[val1].Format.ToLower().Contains("red"))
                    {
                        addedSheet.Column(i).Style.Numberformat.Format = columnFormats_2[val1].Format;
                    }

                    if(!columnFormats_1[val2].Format.ToLower().Contains("red"))
                    {
                        deletedSheet.Column(i).Style.Numberformat.Format = columnFormats_1[val2].Format;
                    }
                    if(!columnFormats_1[val3].Format.ToLower().Contains("red"))
                    {
                        unchangedSheet.Column(i).Style.Numberformat.Format = columnFormats_1[val3].Format;
                    }
                }
                for (int i = 1; i<=changedSheet.Dimension.Columns; i++)
                {
                    changedSheet.Cells[1, i].AutoFitColumns();
                    string val = ""+ changedSheet.Cells[1, i].Value.ToString().Replace(KEY_SUFFIX, "").Replace(FILE_SUFFIX_1, "").Replace(FILE_SUFFIX_2, "");
                    if(!columnFormats_1[val].Format.ToLower().Contains("red"))
                    {
                        changedSheet.Column(i).Style.Numberformat.Format = columnFormats_1[val].Format;
                    }
                }

                status = "ok";
                return excel;
            }
            status = "error";
            return null;
        }
        
        private ExcelWorksheet getSheet(string FilePath, string SheetName, out string status, out ExcelWorksheet clone)
        {
            try
            {
                FileInfo file = new FileInfo(FilePath);
                ExcelPackage package = new ExcelPackage(file);

                for (int i = 1; i <= package.Workbook.Worksheets.Count; i++)   //start with 1: <=
                {
                    ExcelWorksheet worksheet = package.Workbook.Worksheets[i];
                    string name = worksheet.Name;

                    if (name.ToLower() == SheetName)
                    {
                        clone = package.Workbook.Worksheets.Copy(SheetName, SheetName+"_clone");
                        status = "ok";
                        return worksheet;
                    }

                }
                clone = null;
                status = "No matching sheet found for '" + SheetName + "'";
                return null;
            } catch(Exception exc)
            {
                clone = null;
                status = "Process can't access the file because it is being used by another process.";
                return null;
            }
        }

        private Dictionary<string, List<object>> getDict(ExcelWorksheet Worksheet, string[] KeyColumns, out Dictionary<int,string> columnHeaders, out Dictionary<string, ExcelNumberFormat> columnFormats, ref Dictionary<string, List<object>> keyValues)
        {            
            Dictionary<string, List<object>> dict = new Dictionary<string, List<object>>();
            List<int> keyColumnIndices = new List<int>();
            List<string> keyColumnsSorted = new List<string>();
            columnHeaders = new Dictionary<int, string>();
            columnFormats = new Dictionary<string, ExcelNumberFormat>();

            int colCount = Worksheet.Dimension.End.Column;  //get Column Count
            int rowCount = Worksheet.Dimension.End.Row;     //get row count

            // iterate columns, find key columns indices
            int firstRow = 1;
            int lastRow = -1;
            for (int i = 1; i <= colCount; i++)
            {
                var headerCell = Worksheet.Cells[firstRow, i];
                var val = headerCell.Text.Trim();                

                if(!columnHeaders.ContainsKey(i))
                {
                    columnHeaders.Add(i, val);
                }
                if (KeyColumns.Contains(val))
                {
                    keyColumnIndices.Add(i);
                    keyColumnsSorted.Add(val);
                }
                
                //take format from fifth row
                int fifthRow = 5;
                var cellWithFormat =  Worksheet.Cells[fifthRow, i];
                var format = cellWithFormat.Style.Numberformat;
                
                if(!columnFormats.ContainsKey(val))
                {
                    columnFormats.Add(val, format);
                }
            }
            this.KeyColumns = keyColumnsSorted.ToArray();

            if (keyColumnIndices.Count > 0)
            {
                //first row is header, start with second
                for (int row = 2; row <= rowCount; row++)
                {
                    if ((lastRow > 0) && (row > lastRow))    //end loop after 5 null rows
                    {
                        break;
                    }

                    List<object> keyVals = new List<object>();
                    List<object> values = new List<object>();
                    for (int col = 1; col <= colCount; col++)
                    {
                        if (keyColumnIndices.Contains(col))
                        {
                            continue;   //take later
                        }

                        var cell = Worksheet.Cells[row, col];
                        var val = cell.Value;

                        if (val != null)
                        {
                            values.Add(val);
                        } else
                        {
                            values.Add("null");
                        }
                    }

                    
                    if (values.Count > 0)
                    {
                        string combinedKey = "";
                        foreach (int k in keyColumnIndices)
                        {
                            var keyCell = Worksheet.Cells[row, k];
                            var keyValue = keyCell.Value;
                            keyVals.Add(keyValue);

                            if(keyCell.Value != null)
                            {
                                var key = keyCell.Value.ToString();
                                combinedKey += key.Trim() + KEY_SEPARATOR;                                
                            } else
                            {
                                combinedKey += "null" + KEY_SEPARATOR;
                            }
                        }

                        if (combinedKey.Length > 0)
                        {
                            combinedKey = combinedKey.Remove(combinedKey.Length - 1);
                            if (!dict.ContainsKey(combinedKey))
                            {
                                dict.Add(combinedKey, values);
                                keyValues.Add(combinedKey, keyVals);
                            }
                            else
                            {
                                //"DUPLICATE KEY FOUND"
                            }
                        }                        
                    } else
                    {
                        int maxMoreIterations = 5;                        
                        if (lastRow < 0)
                        {
                            lastRow = row + maxMoreIterations;
                        }
                    }
                }
            }

            return dict;
        }

        private bool twoRowsAreEqual<T>(IEnumerable<T> list1, IEnumerable<T> list2)
        {
            var cnt = new Dictionary<T, int>();
            foreach (T s in list1)
            {
                if (cnt.ContainsKey(s))
                {
                    cnt[s]++;
                }
                else
                {
                    cnt.Add(s, 1);
                }
            }
            foreach (T s in list2)
            {
                if (cnt.ContainsKey(s))
                {
                    cnt[s]--;
                }
                else
                {
                    return false;
                }
            }
            return cnt.Values.All(c => c == 0);
        }

    }
}
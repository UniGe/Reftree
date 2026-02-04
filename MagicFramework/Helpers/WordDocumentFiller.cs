using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using DevExpress.XtraRichEdit;
using DevExpress.Spreadsheet;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Bibliography;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using DocumentFormat.OpenXml.Drawing.Charts; 
using MagicFramework.Controllers;
using A = DocumentFormat.OpenXml.Drawing;
using DW = DocumentFormat.OpenXml.Drawing.Wordprocessing;
using PIC = DocumentFormat.OpenXml.Drawing.Pictures;
using CHA = DocumentFormat.OpenXml.Drawing.Charts;
using SS = DocumentFormat.OpenXml.Spreadsheet;
using Newtonsoft.Json.Linq;
using DevExpress.BarCodes;
using System.Diagnostics;
using PdfSharp.Drawing;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;
using DevExpress.Pdf;
////

using System.Threading.Tasks;
using System.Dynamic;
using System.Drawing;
using System.Threading;

namespace MagicFramework.Helpers
{
    public class BookMarkRelation
    {

        public string BookmarkParent { get; set; }
        public string BookmarkChild { get; set; }
        public string ParentFieldJoin { get; set; }
        public string ChildFieldJoin { get; set; }

        public BookMarkRelation(string parent, string child, string parentfield, string childfield)
        {
            this.BookmarkChild = child;
            this.BookmarkParent = parent;
            this.ChildFieldJoin = childfield;
            this.ParentFieldJoin = parentfield;
        }
    }
    public class PdfFormFiller
    {
        private Dictionary<string, TableRow> tableCellModels;
        private readonly Regex instructionRegEx =
               new Regex(
                           @"^[\s]*MERGEFIELD[\s]+[""]?(?<name>[#\w\.\(\,\)]*){1} [""]?              # This retrieves the field's name (Named Capture Group -> name)
                            [\s]*(\\\*[\s]+(?<Format>[\w]*){1})?                # Retrieves field's format flag (Named Capture Group -> Format)
                            [\s]*(\\b[\s]+[""]?(?<PreText>[^\\]*){1})?         # Retrieves text to display before field data (Named Capture Group -> PreText)
                                                                                # Retrieves text to display after field data (Named Capture Group -> PostText)
                            [\s]*(\\f[\s]+[""]?(?<PostText>[^\\]*){1})?",
                           RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.ExplicitCapture | RegexOptions.IgnoreCase | RegexOptions.IgnorePatternWhitespace | RegexOptions.Singleline);

        private readonly Regex fileRegEx = new Regex(@"^[\s]*(?<FieldName>[#\w]+)\.image\(((?<SizeX>[\d\.]+),(?<SizeY>[\d\.]+),?(?<Rotate>[\d]*)?)?\)$", RegexOptions.IgnoreCase | RegexOptions.IgnorePatternWhitespace | RegexOptions.Singleline);
        private readonly Regex barcodeRegEx = new Regex(@"^[\s]*MERGEBARCODE\s+(?<FieldName>[#\w]+)\s+(?<Type>[\|A-Z0-9]+)(?<Options>[\s\w\\]*)$", RegexOptions.IgnoreCase | RegexOptions.IgnorePatternWhitespace | RegexOptions.Singleline);
        private DatabaseCommandUtils dbutils;
        private string targetConnection;
        private int idUser;
        private int idUserGroup;
        //private bool saveAsPdf=false;
        public PdfFormFiller(DatabaseCommandUtils dbutils, string targetConnection, int idUser, int idUserGroup)
        {
            this.dbutils = dbutils;
            this.targetConnection = targetConnection;
            this.idUser = idUser;
            this.idUserGroup = idUserGroup;
        }
        //check return type
        public byte[] ReplaceMergeFieldsInFile(DataContext datacontext, string filename, string bo, string serverMapPath, ref bool isLandscape, JObject formData, string targetConnection, bool isMSSQLFileActive, string bookmarksToHide, string ROOT = "ROOT")
        {
            tableCellModels = new Dictionary<string, TableRow>();
            var tables = datacontext.tables[bo];
            Dictionary<string, string> data = tables[ROOT][ROOT].First();
            byte[] original = null;

            // first read document in as stream
            if (!File.Exists(filename))
            {
                if (isMSSQLFileActive)
                    original = MAGIC_SAVEFILEController.GetFileBytesFromDBTable(filename, targetConnection);
                else
                    throw new ArgumentException("File '" + filename + "' not exists");
            }
            else
                original = File.ReadAllBytes(filename);

            using (MemoryStream stream = new MemoryStream())
            {
                stream.Write(original, 0, original.Length);

                using (PdfDocumentProcessor documentProcessor = new PdfDocumentProcessor())
                {
                    documentProcessor.LoadDocument(stream);

                    FillPdfFieldsInElement(data, documentProcessor, serverMapPath);
                    documentProcessor.SaveDocument(stream);
                    //PdfFormData formData;
                    //documentProcessor.ApplyFormData()
                    //// Get all fields at a root level.
                    //PdfFormData formData = documentProcessor.GetFormData();
                    //formData["di_euro"].Value = "00000";
                    //IList<string> names = formData.GetFieldNames();

                    //string[] strings = new string[names.Count];
                    //names.CopyTo(strings, 0);
                    //documentProcessor.ApplyFormData(formData);
                    //foreach (var s in strings)
                    //{
                    //    Debug.WriteLine(s);
                    //    //if (Result != null && Result[s]!!= null){
                    //    //    formData[s].Value = Result[s].Value;
                    //    //}
                    //}
                    //documentProcessor.SaveDocument(@"C:\TEMP\SOURCES\conguaglio_gi2_new1_marzo_2017_new.pdf");
                }
                stream.Seek(0, SeekOrigin.Begin);
                byte[] d = stream.ToArray();
                return d;
            }
        }
        void FillPdfFieldsInElement(Dictionary<string, string> values, PdfDocumentProcessor documentProcessor, string serverMapPath) {
            PdfFormData formData = documentProcessor.GetFormData();
            IList<string> names = formData.GetFieldNames();
            string[] strings = new string[names.Count];
            names.CopyTo(strings, 0);
           
            foreach (var s in strings)
            {
                Debug.WriteLine(s);
                if (values != null && values.ContainsKey(s) && values[s] != null){
                    formData[s].Value = values[s];
                }
            }
            documentProcessor.ApplyFormData(formData);
            documentProcessor.SaveDocument(@"C:\TEMP\SOURCES\conguaglio_gi2_new1_marzo_2017_new.pdf");

        }


    }

    public class FormFiller
    {
        private Dictionary<string, TableRow> tableCellModels; //dictionary containing the original content of the cell in tables (with mergefields definition) 
                                                              /// <summary>
                                                              /// Regex used to parse MERGEFIELDs in the provided document.
                                                              /// </summary>
        private readonly Regex instructionRegEx =
            new Regex(
                        @"^[\s]*MERGEFIELD[\s]+[""]?(?<name>[#\w\.\(\,\)]*){1} [""]?              # This retrieves the field's name (Named Capture Group -> name)
                            [\s]*(\\\*[\s]+(?<Format>[\w]*){1})?                # Retrieves field's format flag (Named Capture Group -> Format)
                            [\s]*(\\b[\s]+[""]?(?<PreText>[^\\]*){1})?         # Retrieves text to display before field data (Named Capture Group -> PreText)
                                                                                # Retrieves text to display after field data (Named Capture Group -> PostText)
                            [\s]*(\\f[\s]+[""]?(?<PostText>[^\\]*){1})?",
                        RegexOptions.Compiled | RegexOptions.CultureInvariant | RegexOptions.ExplicitCapture | RegexOptions.IgnoreCase | RegexOptions.IgnorePatternWhitespace | RegexOptions.Singleline);

        private readonly Regex fileRegEx = new Regex(@"^[\s]*(?<FieldName>[#\w]+)\.image\(((?<SizeX>[\d\.]+),(?<SizeY>[\d\.]+),?(?<Rotate>[\d]*)?)?\)$", RegexOptions.IgnoreCase | RegexOptions.IgnorePatternWhitespace | RegexOptions.Singleline);
        private readonly Regex barcodeRegEx = new Regex(@"^[\s]*MERGEBARCODE\s+(?<FieldName>[#\w]+)\s+(?<Type>[\|A-Z0-9]+)(?<Options>[\s\w\\]*)$", RegexOptions.IgnoreCase | RegexOptions.IgnorePatternWhitespace | RegexOptions.Singleline);
        private DatabaseCommandUtils dbutils;
        private string targetConnection;
        private int idUser;
        private int idUserGroup;
        private bool saveAsPdf;

        public FormFiller(DatabaseCommandUtils dbutils, string targetConnection, int idUser, int idUserGroup, bool saveAsPdf)
        {
            this.dbutils = dbutils;
            this.targetConnection = targetConnection;
            this.idUser = idUser;
            this.idUserGroup = idUserGroup;
            this.saveAsPdf = saveAsPdf;

        }

        private TableRow setContentToOrigRow(Table tab, TableRow origrow, TableRow newRepeatElement)
        {
            newRepeatElement = (TableRow)origrow.CloneNode(true);
            return (TableRow)newRepeatElement.Clone();
        }
        private void deleteCopiedContent(Table tab, TableRow origrow)
        {
            tab.RemoveAllChildren<TableRow>();
            foreach (TableCell tc in origrow.Elements<TableCell>())
            {
                foreach (var t in tc.Descendants<Text>())
                {
                    t.Text = String.Empty;
                }
            }
            tab.Append(origrow); //contains bookmarks
        }

        //private static bool bookMarkIsOnTopOfTable(DataContext datacontext,string bname)
        //{
        //    int count = datacontext.bookmarkRelations.Where(x => x.BookmarkChild == bname && x.BookmarkParent != "ROOT").ToList().Count;
        //   if (count == 0)
        //       return true;
        //   return false;
        //}
        private void recurInBookmarksInsideRow_(DataContext datacontext, WordprocessingDocument docx, BookmarkStart bookmark, string currentbo, MainDocumentPart mainPart, string serverMapPath)
        {

            OpenXmlElement repeatElement = bookmark.NextSibling();
            //Nested bookmarks
            if (repeatElement.GetType().Name.ToUpper() != "TABLEROW")
            {
                var bstart = bookmark.Parent;

                while (bstart.GetType() != typeof(DocumentFormat.OpenXml.Wordprocessing.TableRow))
                    bstart = bstart.Parent;
                repeatElement = bstart;
            }
            Table tab = (Table)repeatElement.Parent;
            TableRow origrow = (TableRow)repeatElement.Clone();
            //if (bookMarkIsOnTopOfTable(datacontext, bookmark.Name))  //replicate 1st Row (containing the model row)
            //    tab.Append(origrow);
            //i put the first row containing the mergefields into a separate dictionary    
            if (!tableCellModels.ContainsKey(bookmark.Name))
                tableCellModels.Add(bookmark.Name, origrow);
            else
                origrow = tableCellModels[bookmark.Name];
            if (repeatElement != null)
            {
                if (datacontext.tables[currentbo].ContainsKey(bookmark.Name))
                {
                    if (!datacontext.tables[currentbo][bookmark.Name].ContainsKey(currentbo))
                        return;
                    foreach (var rowData in datacontext.tables[currentbo][bookmark.Name][currentbo])
                    {
                        var children = datacontext.bookmarkRelations.Where(x => x.BookmarkParent == bookmark.Name).ToList();
                        //for each data i need to insert a new row in the table so that the bookmark reasearch will find there the bkmrks nad replace the mergefields in the new row
                        OpenXmlElement newRepeatElement = (OpenXmlElement)repeatElement.Clone();
                        if (children.Count() == 0) //leaves need to be reset
                            newRepeatElement = (TableRow)setContentToOrigRow(tab, (TableRow)origrow, (TableRow)newRepeatElement);
                        tab.Append((TableRow)newRepeatElement);
                        foreach (var c in children)
                        {
                            if (!rowData.ContainsKey(c.ParentFieldJoin))
                                continue;//skip, configuration of hte bookmarks is not conforming to datasets...
                            string newbo = rowData[c.ParentFieldJoin];
                            var newbookmark = docx.MainDocumentPart.Document.Body.Descendants<BookmarkStart>().Where(b => b.Name == c.BookmarkChild).Last();
                            recurInBookmarksInsideRow_(datacontext, docx, newbookmark, newbo, mainPart, serverMapPath);
                        }
                        FillWordFieldsInElement(rowData, newRepeatElement, mainPart, serverMapPath);
                    }
                    repeatElement.Remove();

                }
                else //the Table is empty
                {
                    try
                    {
                        deleteCopiedContent(tab, origrow);
                    }
                    catch (Exception err) {
                        Debug.WriteLine(err.Message);
                    } 
                }

            }


            return;
        }

        private void deleteBetweeen(WordprocessingDocument docx, string bookmarks)
        {
            var body = docx.MainDocumentPart.Document.Body;
            List<string> bkmks = bookmarks.Split(',').ToList();
            //Find the bookmark element, it's either under the root element, or inside a paragraph
            foreach (var bookmarkName in bkmks)
            {
                var bookmark = body.Descendants<BookmarkStart>().FirstOrDefault(x => x.Name == bookmarkName);

                //Could not find it.. it maybe inside a more complex element
                if (bookmark == null)
                    throw new ArgumentOutOfRangeException("deleteBetweeen: " + bookmarkName, "Bookmark not found in file");

                //If the bookmark is inside a paragraph we want to delete all siblings of that paragraph
                var start = bookmark.Parent is Paragraph ? bookmark.Parent : bookmark;
                //var sibling = start.NextSibling();

                ////Delete all elements until we reach our bookmark end tag
                //while (!(sibling is BookmarkEnd))
                //{
                //    var temp = sibling;
                //    sibling = sibling.NextSibling();
                //    temp.Remove();
                //}

                var bmEnd = body.Descendants<BookmarkEnd>().Where(b => b.Id == bookmark.Id.ToString()).FirstOrDefault();
                //If we did not find anything just continue with the loop
                if (bmEnd == null)
                    continue;

                var rProp = start.Descendants<Run>().Where(rp => rp.RunProperties != null).Select(rp => rp.RunProperties).FirstOrDefault();
                if (start.PreviousSibling() == null && bmEnd.ElementsAfter().Count(e => e.GetType() == typeof(Run)) == 0)
                    start.Parent.RemoveAllChildren();
                else
                {
                    var list = start.ElementsAfter().Where(r => r.IsBefore(bmEnd)).ToList();
                    //var trRun = list.Where(rp => rp.GetType() == typeof(Run) && ((Run)rp).RunProperties != null).Select(rp => ((Run)rp).RunProperties).FirstOrDefault();
                    //if (trRun != null)
                    //    rProp = (RunProperties)trRun.Clone();
                    for (var n = list.Count(); n > 0; n--)
                        list[n - 1].Remove();
                }

            }
        }

        //// <summary>
        /// replaces merge fields in filename word docx
        /// </summary>
        /// <param name="datacontext">the data from the database reorganized in Dictionaries</param>
        /// <param name="filename">the file for the output</param>
        /// <param name="bo">the current main BO</param>
        /// <param name="data">the 1st level (ROOT bookmark) unique merge fields</param>
        /// <returns></returns>
        /// //ke per te rishkrujt vetem kte metoden me ca ke tek ai projekti shembull
        public byte[] replaceMergeFieldsInFile(DataContext datacontext, string filename, string bo, string serverMapPath, ref bool isLandscape, JObject formData, string targetConnection, bool isMSSQLFileActive, string bookmarksToHide,bool removeEmptyTables, string ROOT = "ROOT")
        {
            tableCellModels = new Dictionary<string, TableRow>();
            var tables = datacontext.tables[bo];
            Dictionary<string, string> data = tables[ROOT][ROOT].First();
            byte[] original = null;

            // first read document in as stream
            if (!File.Exists(filename))
            {
                if (isMSSQLFileActive)
                    original = MAGIC_SAVEFILEController.GetFileBytesFromDBTable(filename, targetConnection);
                else
                    throw new ArgumentException("File '" + filename + "' not exists");
            }
            else
                original = File.ReadAllBytes(filename);

            using (MemoryStream stream = new MemoryStream())
            {
                stream.Write(original, 0, original.Length);

                using (WordprocessingDocument docx = WordprocessingDocument.Open(stream, true))
                {
                    try
                    {
                        SectionProperties sectionProperties = docx.MainDocumentPart.Document.Body.GetFirstChild<SectionProperties>();
                        PageSize pageSize = sectionProperties.GetFirstChild<PageSize>();
                        isLandscape = pageSize.Orient == PageOrientationValues.Landscape;
                    }
                    catch (Exception e) { }

                    ConvertFieldCodes(docx.MainDocumentPart.Document);

                    var bookmarks = docx.MainDocumentPart.Document.Body.Descendants<BookmarkStart>();
                    List<Table> oListToDelete = new List<Table>();

                    foreach (var bookmark in bookmarks)
                    {
                        //check if it's a bookmark contained in a table and is a "ROOT" bookmark (the others will be processed with recursion)
                        if (tables.ContainsKey(bookmark.Name) && bookmark.ColumnFirst != null && datacontext.bookmarkRelations.Where(x => x.BookmarkChild == bookmark.Name && x.BookmarkParent != ROOT).Count() == 0)
                        {
                            recurInBookmarksInsideRow_(datacontext, docx, bookmark, bo, docx.MainDocumentPart, serverMapPath);
                        } 
                        else if (removeEmptyTables == true)
                        {
                            //no data for table: remove it from document    https://gitlab.ilosgroup.com/ilos/operations/-/issues/399
                            Table tableToDelete = bookmark.Ancestors<Table>().FirstOrDefault();
                            if (tableToDelete != null)
                            {
                                /*carico la lista di tabelle da cancellare*/
                                oListToDelete.Add(tableToDelete);
                                //tableToDelete.Remove();
                            }
                        }
                    }

                    foreach (var oTable in oListToDelete)
                    {
                        oTable.Remove();
                    }

                    FillWordFieldsInElement(data, docx.MainDocumentPart.Document, docx.MainDocumentPart, serverMapPath);
                    FillChartData(docx.MainDocumentPart, formData, bo);

                    //Delete the objects between bkms
                    try
                    {
                        if (!String.IsNullOrEmpty(bookmarksToHide))
                            deleteBetweeen(docx, bookmarksToHide);
                    }
                    catch (Exception ex)
                    {
                        Debug.WriteLine(ex.Message);
                    }

                    docx.MainDocumentPart.Document.Save();  // save main document back in package

                    // process header(s)
                    foreach (HeaderPart hpart in docx.MainDocumentPart.HeaderParts.ToList())
                    {
                        ConvertFieldCodes(hpart.Header);

                        FillWordFieldsInElement(data, hpart.Header, hpart, serverMapPath);
                        hpart.Header.Save();    // save header back in package
                    }

                    //// process footer(s)
                    foreach (FooterPart fpart in docx.MainDocumentPart.FooterParts.ToList())
                    {
                        ConvertFieldCodes(fpart.Footer);

                        FillWordFieldsInElement(data, fpart.Footer, fpart, serverMapPath);
                        fpart.Footer.Save();    // save footer back in package
                    }
                }

                // get package bytes
                stream.Seek(0, SeekOrigin.Begin);
                byte[] d = stream.ToArray();
                return d;
            }
        }

        /// <summary>
        /// Applies any formatting specified to the pre and post text as 
        /// well as to fieldValue.
        /// </summary>
        /// <param name="format">The format flag to apply.</param>
        /// <param name="fieldValue">The data value being inserted.</param>
        /// <param name="preText">The text to appear before fieldValue, if any.</param>
        /// <param name="postText">The text to appear after fieldValue, if any.</param>
        /// <returns>The formatted text; [0] = fieldValue, [1] = preText, [2] = postText.</returns>
        /// <exception cref="">Throw if fieldValue, preText, or postText are null.</exception>
        /// //budallalliqe
        internal string[] ApplyFormatting(string format, string fieldValue, string preText, string postText)
        {
            string[] valuesToReturn = new string[3];

            if ("UPPER".Equals(format))
            {
                // Convert everything to uppercase.
                valuesToReturn[0] = fieldValue.ToUpper(CultureInfo.CurrentCulture);
                valuesToReturn[1] = preText.ToUpper(CultureInfo.CurrentCulture);
                valuesToReturn[2] = postText.ToUpper(CultureInfo.CurrentCulture);
            }
            else if ("LOWER".Equals(format))
            {
                // Convert everything to lowercase.
                valuesToReturn[0] = fieldValue.ToLower(CultureInfo.CurrentCulture);
                valuesToReturn[1] = preText.ToLower(CultureInfo.CurrentCulture);
                valuesToReturn[2] = postText.ToLower(CultureInfo.CurrentCulture);
            }
            else if ("FirstCap".Equals(format))
            {
                // Capitalize the first letter, everything else is lowercase.
                if (!string.IsNullOrEmpty(fieldValue))
                {
                    valuesToReturn[0] = fieldValue.Substring(0, 1).ToUpper(CultureInfo.CurrentCulture);
                    if (fieldValue.Length > 1)
                    {
                        valuesToReturn[0] = valuesToReturn[0] + fieldValue.Substring(1).ToLower(CultureInfo.CurrentCulture);
                    }
                }

                if (!string.IsNullOrEmpty(preText))
                {
                    valuesToReturn[1] = preText.Substring(0, 1).ToUpper(CultureInfo.CurrentCulture);
                    if (fieldValue.Length > 1)
                    {
                        valuesToReturn[1] = valuesToReturn[1] + preText.Substring(1).ToLower(CultureInfo.CurrentCulture);
                    }
                }

                if (!string.IsNullOrEmpty(postText))
                {
                    valuesToReturn[2] = postText.Substring(0, 1).ToUpper(CultureInfo.CurrentCulture);
                    if (fieldValue.Length > 1)
                    {
                        valuesToReturn[2] = valuesToReturn[2] + postText.Substring(1).ToLower(CultureInfo.CurrentCulture);
                    }
                }
            }
            else if ("Caps".Equals(format))
            {
                // Title casing: the first letter of every word should be capitalized.
                valuesToReturn[0] = ToTitleCase(fieldValue);
                valuesToReturn[1] = ToTitleCase(preText);
                valuesToReturn[2] = ToTitleCase(postText);
            }
            else
            {
                valuesToReturn[0] = fieldValue;
                valuesToReturn[1] = preText;
                valuesToReturn[2] = postText;
            }

            return valuesToReturn;
        }

        /// <summary>
        /// Executes the field switches on a given element.
        /// The possible switches are:
        /// <list>
        /// <li>dt : delete table</li>
        /// <li>dr : delete row</li>
        /// <li>dp : delete paragraph</li>
        /// </list>
        /// </summary>
        /// <param name="element">The element being operated on.</param>
        /// <param name="switches">The switched to be executed.</param>
        /// //budallalliqe
        internal void ExecuteSwitches(OpenXmlElement element, string[] switches)
        {
            if (switches == null || switches.Count() == 0)
            {
                return;
            }

            // check switches (switches are always lowercase)
            if (switches.Contains("dp"))
            {
                Paragraph p = GetFirstParent<Paragraph>(element);
                if (p != null)
                {
                    p.Remove();
                }
            }
            else if (switches.Contains("dr"))
            {
                TableRow row = GetFirstParent<TableRow>(element);
                if (row != null)
                {
                    row.Remove();
                }
            }
            else if (switches.Contains("dt"))
            {
                Table table = GetFirstParent<Table>(element);
                if (table != null)
                {
                    table.Remove();
                }
            }
        }
        /// <summary>
        /// Fills all the <see cref="SimpleFields"/> that are found in a given <see cref="OpenXmlElement"/>.
        /// </summary>
        /// <param name="values">The values to insert; keys should match the placeholder names, values are the data to insert.</param>
        /// <param name="element">The document element taht will contain the new values.</param>
        /// //shiko metodat ku jan perdor, nqs sjan perdor mren ke klasa ske pse i kalon te klasa e re
        internal void FillWordFieldsInElement(Dictionary<string, string> values, OpenXmlElement element, OpenXmlPart xmlPart, string serverMapPath)
        {
            string[] switches;
            Dictionary<string, string> options;
            string[] formattedText;


            Dictionary<SimpleField, string[]> emptyfields = new Dictionary<SimpleField, string[]>();

            // First pass: fill in data, but do not delete empty fields.  Deletions silently break the loop.
            var list = element.Descendants<SimpleField>().ToArray();
            foreach (var field in list)
            {
                string fieldname = GetFieldNameWithOptions(field, out switches, out options);
                if (!string.IsNullOrEmpty(fieldname))
                {
                    if (values.ContainsKey(fieldname)
                        && !string.IsNullOrEmpty(values[fieldname]))
                    {

                        // replace mergefield with text
                        if (options.ContainsKey("SizeX"))
                        {
                            try
                            {
                                string filePath = Controllers.MAGIC_SAVEFILEController.IsAbsolutePath(values[fieldname]) ? values[fieldname] : Path.Combine(serverMapPath, values[fieldname]);
                                float SizeX = !string.IsNullOrEmpty(options["SizeX"]) ? float.Parse(options["SizeX"], CultureInfo.InvariantCulture.NumberFormat) : 0;
                                float SizeY = !string.IsNullOrEmpty(options["SizeY"]) ? float.Parse(options["SizeY"], CultureInfo.InvariantCulture.NumberFormat) : 0;
                                int Rotate = !string.IsNullOrEmpty(options["Rotate"]) ? int.Parse(options["Rotate"]) : 0;

                                Run r = GetRunElement(field);
                                r.Append(GetImageElement(filePath, xmlPart, SizeX, SizeY, Rotate));
                                field.Parent.ReplaceChild<SimpleField>(r, field);

                            }
                            catch (Exception e)
                            {
                                emptyfields[field] = switches;
                            }
                        }
                        else if (options.ContainsKey("BarcodeString"))
                        {
                            if (!saveAsPdf)
                            {
                                string barcodeContent = options["BarcodeString"]
                                    .Replace("MERGEBARCODE", "DISPLAYBARCODE")
                                    .Replace(fieldname, "\"" + values[fieldname] + "\"");

                                Run r = GetRunElement(field);
                                r.Append(GetBarcodeElements(barcodeContent));
                                field.Parent.ReplaceChild<SimpleField>(r, field);
                            }
                            else
                            {
                                try
                                {
                                    BarCode barCode = new BarCode();
                                    barCode.CodeTextFont = new System.Drawing.Font("Arial", 24f);
                                    barCode.CodeText = values[fieldname];
                                    barCode.CodeBinaryData = Encoding.Default.GetBytes(barCode.CodeText);
                                    barCode.Dpi = 72;
                                    //barCode.Module = .25;
                                    barCode.Margins.Bottom = 0;
                                    int heightTwips = 1700;

                                    bool decreaseSize = false;
                                    QRCodeErrorLevel QRCorrectionLevel = QRCodeErrorLevel.Q;
                                    bool showText = false;

                                    foreach (Match barcodeOption in new Regex(@"\\(?<type>[hsqpxdcrfbt]+)\s*(?<value>[A-Z0-9]*)", RegexOptions.IgnoreCase).Matches(options["BarcodeOptions"].Trim()))
                                    {
                                        int rgb;
                                        switch (barcodeOption.Groups["type"].ToString())
                                        {
                                            case "h":
                                                heightTwips = Int32.Parse(barcodeOption.Groups["value"].ToString());
                                                break;
                                            case "q":
                                                QRCorrectionLevel = (QRCodeErrorLevel)Int32.Parse(barcodeOption.Groups["value"].ToString());
                                                break;
                                            case "t":
                                                showText = true;
                                                break;
                                            case "r":
                                                barCode.RotationAngle = float.Parse(barcodeOption.Groups["value"].ToString(), CultureInfo.InvariantCulture) * 90;
                                                break;
                                            case "f":
                                                rgb = Int32.Parse(barcodeOption.Groups["value"].ToString());
                                                barCode.ForeColor = System.Drawing.Color.FromArgb((rgb >> 16) & 0xff, (rgb >> 8) & 0xff, (rgb >> 0) & 0xff);
                                                break;
                                            case "b":
                                                rgb = Int32.Parse(barcodeOption.Groups["value"].ToString());
                                                barCode.BackColor = System.Drawing.Color.FromArgb((rgb >> 16) & 0xff, (rgb >> 8) & 0xff, (rgb >> 0) & 0xff);
                                                break;
                                        }
                                    }

                                    switch (options["BarcodeType"].ToUpper())
                                    {
                                        case "QR":
                                            barCode.Symbology = Symbology.QRCode;
                                            barCode.Options.QRCode.CompactionMode = QRCodeCompactionMode.Byte;
                                            barCode.Options.QRCode.ErrorLevel = QRCorrectionLevel;
                                            barCode.Options.QRCode.ShowCodeText = showText;
                                            barCode.Module = 1;
                                            break;
                                        case "CODE128":
                                            decreaseSize = true;
                                            barCode.Symbology = Symbology.Code128;
                                            barCode.Options.Code128.ShowCodeText = showText;
                                            break;
                                        case "CODE39":
                                            decreaseSize = true;
                                            barCode.Symbology = Symbology.Code39;
                                            barCode.Options.Code39.ShowCodeText = showText;
                                            break;
                                        case "EAN8":
                                            barCode.Symbology = Symbology.EAN8;
                                            barCode.Options.EAN8.ShowCodeText = showText;
                                            break;
                                        case "EAN13":
                                            barCode.Symbology = Symbology.EAN13;
                                            barCode.Options.EAN13.ShowCodeText = showText;
                                            break;
                                        case "UPCA":
                                            barCode.Symbology = Symbology.UPCA;
                                            barCode.Options.UPCA.ShowCodeText = showText;
                                            break;
                                        case "UPCE":
                                            barCode.Symbology = Symbology.UPCE0;
                                            barCode.Options.UPCE0.ShowCodeText = showText;
                                            break;
                                        case "ITF14":
                                            barCode.Symbology = Symbology.ITF14;
                                            barCode.Options.ITF14.ShowCodeText = showText;
                                            break;
                                        default:
                                            throw new Exception(String.Format("Barcode of Type '{0}' is not supported in PDF-Documents!", options["BarcodeType"]));
                                    }

                                    ImagePart imagePart = AddImagePart(xmlPart, ImagePartType.Png);
                                    using (MemoryStream stream = new MemoryStream())
                                    {
                                        barCode.BarCodeImage.Save(stream, System.Drawing.Imaging.ImageFormat.Png);
                                        stream.Position = 0;
                                        imagePart.FeedData(stream);
                                    }

                                    Run r = GetRunElement(field);
                                    float SizeY = DevExpress.Office.Utils.Units.TwipsToCentimetersF(heightTwips);
                                    float SizeX = (float)(barCode.BarCodeImage.Width / barCode.BarCodeImage.Height * SizeY * (decreaseSize ? .5 : 1));
                                    r.Append(GetImageElement(barCode.BarCodeImage, imagePart, xmlPart, SizeX, SizeY, barCode.CodeText, false));
                                    field.Parent.ReplaceChild<SimpleField>(r, field);
                                }
                                catch (Exception e)
                                {
                                    field.Parent.ReplaceChild<SimpleField>(GetRunElementForText(e.Message, field), field);
                                }
                            }
                        }
                        else
                        {
                            formattedText = ApplyFormatting(options["Format"], values[fieldname], options["PreText"], options["PostText"]);

                            // Prepend any text specified to appear before the data in the MergeField
                            if (!string.IsNullOrEmpty(options["PreText"]))
                                field.Parent.InsertBeforeSelf<Paragraph>(GetPreOrPostParagraphToInsert(formattedText[1], field));

                            // Append any text specified to appear after the data in the MergeField
                            if (!string.IsNullOrEmpty(options["PostText"]))
                                field.Parent.InsertAfterSelf<Paragraph>(GetPreOrPostParagraphToInsert(formattedText[2], field));

                            if (formattedText[0].StartsWith("<html><head></head><body>") && formattedText[0].EndsWith("</body></html>"))
                            {
                                //String cid = "chunkid_" + Guid.NewGuid().ToString();
                                //// MemoryStream ms = new MemoryStream(System.Text.Encoding.UTF8.GetBytes("<html><head></head><body><h1>HELLO</h1></body></html>"));
                                //MemoryStream ms = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(formattedText[0]));
                                //AlternativeFormatImportPart formatImportPart = AddAlternativeFormatImportPart(xmlPart, AlternativeFormatImportPartType.Html, cid);
                                //formatImportPart.FeedData(ms);
                                //AltChunk altChunk = new AltChunk();
                                //altChunk.Id = cid;

                                HtmlToOpenXml.HtmlConverter oConvert = new HtmlToOpenXml.HtmlConverter(xmlPart as MainDocumentPart);
                                var para = oConvert.Parse(formattedText[0]);
                                 
                                //mainPart.Document
                                //.Body
                                //.InsertAfter(altChunk, field.Ancestors<Paragraph>().First());
                                if (field.Ancestors<Paragraph>().Count() > 0)
                                    if (field.Ancestors<Paragraph>().First().Parent != null) {
                                        OpenXmlElement oParent = field.Ancestors<Paragraph>().First().Parent;
                                        oParent.ReplaceChild(para[para.Count - 1], field.Ancestors<Paragraph>().First());

                                        for (int i = para.Count - 1; i >= 0; i--)
                                        {
                                            if (i != para.Count - 1) {
                                                oParent.InsertAt(para[i].CloneNode(true), 0);
                                            }
                                        }

                                        //foreach (OpenXmlCompositeElement p in para)
                                        //{
                                        //    field.Ancestors<Paragraph>().First().Parent.InsertAfter<OpenXmlElement>(p, field.Ancestors<Paragraph>().First());
                                        //    //field.Ancestors<Paragraph>().First().Parent.Append<OpenXmlElement>(p);

                                        //    //field.Ancestors<Paragraph>().First().AppendChild(p);
                                        //}
                                    }
                                        
                            }
                            else
                                field.Parent.ReplaceChild<SimpleField>(GetRunElementForText(formattedText[0], field), field);
                        }
                    }
                    else
                    {
                        // keep track of unknown or empty fields
                        emptyfields[field] = switches;
                    }

                }
            }

            // second pass : clear empty fields
            foreach (KeyValuePair<SimpleField, string[]> kvp in emptyfields)
            {
                // if field is unknown or empty: execute switches and remove it from document !
                ExecuteSwitches(kvp.Key, kvp.Value);
                kvp.Key.Remove();
            }
        }
        //ste intereson
        private ImagePart AddImagePart(OpenXmlPart xmlPart, ImagePartType partType)
        {
            MainDocumentPart mainpart;
            HeaderPart headerPart;
            FooterPart footerPart;

            if ((mainpart = xmlPart as MainDocumentPart) != null)
                return mainpart.AddImagePart(partType);
            if ((headerPart = xmlPart as HeaderPart) != null)
                return headerPart.AddImagePart(partType);
            if ((footerPart = xmlPart as FooterPart) != null)
                return footerPart.AddImagePart(partType);

            return null;
        }
        //ste intereson
        private AlternativeFormatImportPart AddAlternativeFormatImportPart(OpenXmlPart xmlPart, AlternativeFormatImportPartType partType, String cid)
        {
            MainDocumentPart mainpart;
            HeaderPart headerPart;
            FooterPart footerPart;

            if ((mainpart = xmlPart as MainDocumentPart) != null)
                return mainpart.AddAlternativeFormatImportPart(partType, cid);
            if ((headerPart = xmlPart as HeaderPart) != null)
                return headerPart.AddAlternativeFormatImportPart(partType, cid);
            if ((footerPart = xmlPart as FooterPart) != null)
                return footerPart.AddAlternativeFormatImportPart(partType, cid);

            return null;
        }
        //ste intereson
        public void FillChartData(MainDocumentPart mainPart, JObject formData, string bo)
        {
            //Workbook w = new Workbook();
            //w.LoadDocument("test.xlsx");
            //Worksheet ws = w.Worksheets[0];
            //Chart chart = ws.Charts[0];
            //DevExpress.Office.Utils.OfficeImage oi = chart.GetImage();
            //(oi.NativeImage).Save("chart.png");

            foreach (ChartReference cr in mainPart.Document.Body.Descendants<ChartReference>())
            {
                ChartPart cp = (ChartPart)mainPart.GetPartById(cr.Id.Value);
                CHA.Title t = cp.ChartSpace.Descendants<CHA.Title>().FirstOrDefault();

                if (t == null)
                    continue;

                A.Text title = t.Descendants<A.Text>().FirstOrDefault();

                if (title == null || String.IsNullOrEmpty(title.Text))
                    continue;

                List<Controllers.DataAnalysisController.PerdiodChartValues> chartValues = new List<Controllers.DataAnalysisController.PerdiodChartValues>();
                string[] labels = new string[] { };

                using (System.Data.SqlClient.SqlConnection conn = new System.Data.SqlClient.SqlConnection(targetConnection))
                {
                    System.Data.SqlClient.SqlCommand cmd = new System.Data.SqlClient.SqlCommand(string.Format("SELECT * FROM dbo.V_Magic_DashboardCharts WHERE GUID = '{0}'", title.Text), conn);
                    conn.Open();
                    using (IDataReader reader = cmd.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            title.Text = reader.GetString(reader.GetOrdinal("Description"));

                            DateTime today = DateTime.Today;
                            string dateFormat = "yyyyMMdd";
                            string groupofchildren = UserVisibility.UserVisibiltyInfo.getGroupTree(idUserGroup.ToString(), dbutils);
                            Newtonsoft.Json.Linq.JObject data = Newtonsoft.Json.Linq.JObject.FromObject(new
                            {
                                dateFrom = formData["chartDateFrom"] != null && !string.IsNullOrEmpty(formData["chartDateFrom"].ToString()) ? ((DateTime)formData["chartDateFrom"]).ToString(dateFormat) : today.ToString("yyyy") + "0101",
                                dateTo = formData["chartDateTo"] != null && !string.IsNullOrEmpty(formData["chartDateTo"].ToString()) ? ((DateTime)formData["chartDateTo"]).ToString(dateFormat) : today.ToString(dateFormat),
                                chartIDs = reader.GetInt32(reader.GetOrdinal("ID")),
                                storedName = reader.GetString(reader.GetOrdinal("objectLoadSP")),
                                bo_ID = bo //currently processing item Id
                            }
                            );

                            chartValues = Controllers.DataAnalysisController.getChartValues(data, dbutils, idUserGroup, idUser, groupofchildren == String.Empty ? "-1" : groupofchildren.TrimEnd(',')).FirstOrDefault().ToList();
                            string partialLabels = reader["PartialLabels"].ToString();
                            if (!string.IsNullOrEmpty(partialLabels))
                                labels = partialLabels.Split(',');
                        }
                    }
                }

                if (chartValues.Count == 0)
                    continue;

                bool takeTotValue = false;
                foreach (ExternalData ed in cp.ChartSpace.Elements<ExternalData>())
                {
                    EmbeddedPackagePart epp = (EmbeddedPackagePart)cp.GetPartById(ed.Id);
                    using (Stream str = epp.GetStream())
                    {
                        using (SpreadsheetDocument spreadsheetDoc = SpreadsheetDocument.Open(str, true))
                        {
                            SS.Sheet ws = (SS.Sheet)spreadsheetDoc.WorkbookPart.Workbook.Sheets.First();
                            WorksheetPart wsp = (WorksheetPart)spreadsheetDoc.WorkbookPart.GetPartById(ws.Id);
                            SS.SheetData sd = wsp.Worksheet.GetFirstChild<SS.SheetData>();
                            IEnumerable<SS.SharedStringItem> ssi = spreadsheetDoc.WorkbookPart.SharedStringTablePart.SharedStringTable.Elements<SS.SharedStringItem>();
                            Dictionary<string, string> seriesLabels = new Dictionary<string, string>();

                            //update series labels
                            int LabelNum = 0;
                            foreach (SS.Cell cell in sd.GetFirstChild<SS.Row>().Elements<SS.Cell>().Skip(1).Take(chartValues.First().Partials.Count))
                            {
                                string label = labels.Length > LabelNum ? labels[LabelNum] : "P" + (LabelNum + 1);
                                string oldValue = UpdateCell(cell, ssi, label);
                                if (!string.IsNullOrEmpty(oldValue))
                                    seriesLabels.Add(oldValue, label);
                                LabelNum++;
                            }

                            //update series labels in TableDefinitionParts
                            foreach (TableDefinitionPart tdp in wsp.TableDefinitionParts)
                            {
                                foreach (SS.TableColumns tcs in tdp.Table.Elements<SS.TableColumns>())
                                {
                                    foreach (SS.TableColumn tc in tcs)
                                    {
                                        if (!string.IsNullOrEmpty(tc.Name) && seriesLabels.ContainsKey(tc.Name))
                                        {
                                            tc.Name = seriesLabels[tc.Name];
                                        }
                                    }
                                }
                            }

                            int rowNum = 0;
                            //take tot if only one value col exists
                            takeTotValue = sd.Elements<SS.Row>().First().Elements<SS.Cell>().Count() <= 2;
                            foreach (SS.Row row in sd.Elements<SS.Row>().Skip(1).Take(chartValues.Count))
                            {
                                int colNum = 0;
                                IEnumerable<SS.Cell> cells = row.Elements<SS.Cell>().Take(chartValues.First().Partials.Count + 1);
                                foreach (SS.Cell cell in cells)
                                {
                                    //label col
                                    if (colNum == 0)
                                    {
                                        UpdateCell(cell, ssi, chartValues[rowNum].X);
                                    }
                                    //value col
                                    else
                                    {
                                        decimal value = takeTotValue ? chartValues[rowNum].Tot : chartValues[rowNum].Partials[colNum - 1];
                                        UpdateCell(cell, ssi, value.ToString(CultureInfo.InvariantCulture), SS.CellValues.Number);
                                    }
                                    colNum++;
                                }
                                rowNum++;
                            }
                        }
                    }
                }

                UpdateChartSeries(cp.ChartSpace.Descendants<CHA.Chart>().First(), chartValues, labels, takeTotValue);

            }
        }
        //sbesoj te te interesoji
        private string UpdateCell(SS.Cell cell, IEnumerable<SS.SharedStringItem> ssi, string value, SS.CellValues DataType = SS.CellValues.String)
        {
            string oldValue = "";
            if (cell.DataType != null && cell.DataType == SS.CellValues.SharedString)
            {
                int num = int.Parse(cell.CellValue.Text);
                if (ssi.Count() > num)
                {
                    oldValue = ssi.ElementAt(num).Text.Text;
                    ssi.ElementAt(num).Text.Text = value;
                }
            }
            else
            {
                oldValue = cell.CellValue.Text;
                cell.CellValue.Text = value;
                cell.DataType = DataType;
            }

            return oldValue;
        }
        //ste intereson
        private void UpdateChartSeries(CHA.Chart chart, List<Controllers.DataAnalysisController.PerdiodChartValues> chartValues, string[] labels, bool takeTotValue)
        {
            OpenXmlElement c = chart.PlotArea.Descendants().Where(x => x.GetType().FullName.EndsWith("Chart")).FirstOrDefault();

            int colNum = 0;
            foreach (OpenXmlElement series in c.Elements().Where(x => x.GetType().FullName.EndsWith("ChartSeries")))
            {
                int rowNum = 0;

                //update series labels
                try
                {
                    series.GetFirstChild<SeriesText>().StringReference.StringCache.GetFirstChild<StringPoint>().NumericValue.Text = labels.Length > colNum ? labels[colNum] : "P" + (colNum + 1);
                }
                catch (Exception e)
                {
                    throw new Exception("Error updating chart series labels: " + e.Message, e.InnerException);
                }

                //update category labels
                try
                {
                    foreach (StringPoint sp in series.GetFirstChild<CategoryAxisData>().StringReference.StringCache.Descendants<StringPoint>())
                    {
                        sp.NumericValue.Text = chartValues[rowNum].X;
                        rowNum++;
                    }
                }
                catch (Exception e)
                {
                    throw new Exception("Error updating chart category labels: " + e.Message, e.InnerException);
                }

                rowNum = 0;
                //update values
                try
                {
                    foreach (NumericPoint np in series.GetFirstChild<Values>().Descendants<NumberingCache>().First().Elements<NumericPoint>())
                    {
                        np.NumericValue.Text = (takeTotValue ? chartValues[rowNum].Tot : chartValues[rowNum].Partials[colNum]).ToString(CultureInfo.InvariantCulture);
                        rowNum++;
                    }
                }
                catch (Exception e)
                {
                    throw new Exception("Error updating chart values: " + e.Message, e.InnerException);
                }
                colNum++;
            }
        }

        /// <summary>
        /// Returns the fieldname and switches from the given mergefield-instruction
        /// Note: the switches are always returned lowercase !
        /// </summary>
        /// <param name="field">The field being examined.</param>
        /// <param name="switches">An array of switches to apply to the field.</param>
        /// <returns>The name of the field.</returns>
        /// //shikoje a te intereson
        internal string GetFieldName(SimpleField field, out string[] switches)
        {
            var a = field.GetAttribute("instr", "http://schemas.openxmlformats.org/wordprocessingml/2006/main");
            switches = new string[0];
            string fieldname = string.Empty;
            string instruction = a.Value;

            if (!string.IsNullOrEmpty(instruction))
            {
                Match m = instructionRegEx.Match(instruction);
                if (m.Success)
                {
                    fieldname = m.Groups["name"].ToString().Trim();
                    int pos = fieldname.IndexOf('#');
                    if (pos > 0)
                    {
                        // Process the switches, correct the fieldname.
                        switches = fieldname.Substring(pos + 1).ToLower().Split(new char[] { '#' }, StringSplitOptions.RemoveEmptyEntries);
                        fieldname = fieldname.Substring(0, pos);
                    }
                }
            }

            return fieldname;
        }

        /// <summary>
        /// Returns the fieldname and switches from the given mergefield-instruction
        /// Note: the switches are always returned lowercase !
        /// Note 2: options holds values for formatting and text to insert before and/or after the field value.
        ///         options[0] = Formatting (Upper, Lower, Caps a.k.a. title case, FirstCap)
        ///         options[1] = Text to insert before data
        ///         options[2] = Text to insert after data
        /// </summary>
        /// <param name="field">The field being examined.</param>
        /// <param name="switches">An array of switches to apply to the field.</param>
        /// <param name="options">Formatting options to apply.</param>
        /// <returns>The name of the field.</returns>
        /// //dhe kte shikoje a te intereson
        internal string GetFieldNameWithOptions(SimpleField field, out string[] switches, out Dictionary<string, string> options)
        {
            var a = field.GetAttribute("instr", "http://schemas.openxmlformats.org/wordprocessingml/2006/main");
            switches = new string[0];
            options = new Dictionary<string, string>();
            string fieldname = string.Empty;
            string instruction = a.Value;

            if (!string.IsNullOrEmpty(instruction))
            {
                Match m = instructionRegEx.Match(instruction);
                Match barcodeMatch = barcodeRegEx.Match(instruction);
                if (m.Success)
                {
                    fieldname = m.Groups["name"].ToString().Trim();
                    options.Add("Format", m.Groups["Format"].Value.Trim());
                    options.Add("PreText", m.Groups["PreText"].Value.Trim());
                    options.Add("PostText", m.Groups["PostText"].Value.Trim());
                    int pos = fieldname.IndexOf('#');
                    if (pos > 0)
                    {
                        // Process the switches, correct the fieldname.
                        switches = fieldname.Substring(pos + 1).ToLower().Split(new char[] { '#' }, StringSplitOptions.RemoveEmptyEntries);
                        fieldname = fieldname.Substring(0, pos);
                    }

                    Match m2 = fileRegEx.Match(fieldname);
                    if (m2.Success)
                    {
                        fieldname = m2.Groups["FieldName"].ToString().Trim();
                        options.Add("SizeX", m2.Groups["SizeX"].Value.ToString());
                        options.Add("SizeY", m2.Groups["SizeY"].Value.ToString());
                        options.Add("Rotate", m2.Groups["Rotate"].Value.ToString());
                    }
                }
                else if (barcodeMatch.Success)
                {
                    fieldname = barcodeMatch.Groups["FieldName"].ToString().Trim();
                    options.Add("BarcodeString", instruction);
                    options.Add("BarcodeType", barcodeMatch.Groups["Type"].ToString().Trim());
                    options.Add("BarcodeOptions", barcodeMatch.Groups["Options"].ToString().Trim());
                }
            }

            return fieldname;
        }

        /// <summary>
        /// Returns the first parent of a given <see cref="OpenXmlElement"/> that corresponds
        /// to the given type.
        /// This methods is different from the Ancestors-method on the OpenXmlElement in the sense that
        /// this method will return only the first-parent in direct line (closest to the given element).
        /// </summary>
        /// <typeparam name="T">The type of element being searched for.</typeparam>
        /// <param name="element">The element being examined.</param>
        /// <returns>The first parent of the element of the specified type.</returns>
        //shikoje a te intereson
        internal T GetFirstParent<T>(OpenXmlElement element)
            where T : OpenXmlElement
        {
            if (element.Parent == null)
            {
                return null;
            }
            else if (element.Parent.GetType() == typeof(T))
            {
                return element.Parent as T;
            }
            else
            {
                return GetFirstParent<T>(element.Parent);
            }
        }

        /// <summary>
        /// Creates a paragraph to house text that should appear before or after the MergeField.
        /// </summary>
        /// <param name="text">The text to display.</param>
        /// <param name="fieldToMimic">The MergeField that will have its properties mimiced.</param>
        /// <returns>An OpenXml Paragraph ready to insert.</returns>
        /// sbesoj te interesoji
        internal Paragraph GetPreOrPostParagraphToInsert(string text, SimpleField fieldToMimic)
        {
            Run runToInsert = GetRunElementForText(text, fieldToMimic);
            Paragraph paragraphToInsert = new Paragraph();
            paragraphToInsert.Append(runToInsert);

            return paragraphToInsert;
        }

        /// <summary>
        /// Returns a <see cref="Run"/>-openxml element for the given text.
        /// Specific about this run-element is that it can describe multiple-line and tabbed-text.
        /// The <see cref="SimpleField"/> placeholder can be provided too, to allow duplicating the formatting.
        /// </summary>
        /// <param name="text">The text to be inserted.</param>
        /// <param name="placeHolder">The placeholder where the text will be inserted.</param>
        /// <returns>A new <see cref="Run"/>-openxml element containing the specified text.</returns>
        /// sbesoj te interesoji
        internal Run GetRunElementForText(string text, SimpleField placeHolder)
        {
            string rpr = null;
            if (placeHolder != null)
            {
                foreach (RunProperties placeholderrpr in placeHolder.Descendants<RunProperties>())
                {
                    rpr = placeholderrpr.OuterXml;
                    break;  // break at first
                }
                if (placeHolder.Descendants<RunProperties>().Count() == 0)
                {
                    var run = placeHolder.Ancestors<Run>().FirstOrDefault();
                    if (run != null)
                    {
                        foreach (RunProperties placeholderrpr in run.Descendants<RunProperties>())
                        {
                            rpr = placeholderrpr.OuterXml;
                            break;  // break at first
                        }
                    }
                }
            }

            Run r = new Run();
            if (!string.IsNullOrEmpty(rpr))
            {
                r.Append(new RunProperties(rpr));
            }

            if (!string.IsNullOrEmpty(text))
            {
                // first process line breaks
                string[] split = text.Split(new string[] { "\n" }, StringSplitOptions.None);
                bool first = true;
                foreach (string s in split)
                {
                    if (!first)
                    {
                        r.Append(new Break());
                    }

                    first = false;

                    // then process tabs
                    bool firsttab = true;
                    string[] tabsplit = s.Split(new string[] { "\t" }, StringSplitOptions.None);
                    foreach (string tabtext in tabsplit)
                    {
                        if (!firsttab)
                        {
                            r.Append(new TabChar());
                        }

                        r.Append(new Text(tabtext));
                        firsttab = false;
                    }
                }
            }

            return r;
        }

        internal Run GetRunElement(SimpleField placeHolder)
        {
            string rpr = null;
            if (placeHolder != null)
            {
                foreach (RunProperties placeholderrpr in placeHolder.Descendants<RunProperties>())
                {
                    rpr = placeholderrpr.OuterXml;
                    break;  // break at first
                }
            }

            Run r = new Run();
            if (!string.IsNullOrEmpty(rpr))
            {
                r.Append(new RunProperties(rpr));
            }

            return r;
        }
        internal Image NormalizeOrientation(Image image)
        {
            int ExifOrientationTagId = 0x112;
            if (!image.PropertyIdList.Contains(ExifOrientationTagId))
                return image;
            var prop = image.GetPropertyItem(ExifOrientationTagId);
            if (!(prop.Type == 3 && prop.Len == 2))
                return image;
            int orientation = BitConverter.ToUInt16(prop.Value, 0); 

            if (orientation >= 1 && orientation <= 8)
            {
                switch (orientation)
                {
                    case 2:
                        image.RotateFlip(RotateFlipType.RotateNoneFlipX);
                        break;
                    case 3:
                        image.RotateFlip(RotateFlipType.Rotate180FlipNone);
                        break;
                    case 4:
                        image.RotateFlip(RotateFlipType.Rotate180FlipX);
                        break;
                    case 5:
                        image.RotateFlip(RotateFlipType.Rotate90FlipX);
                        break;
                    case 6:
                        image.RotateFlip(RotateFlipType.Rotate90FlipNone);
                        break;
                    case 7:
                        image.RotateFlip(RotateFlipType.Rotate270FlipX);
                        break;
                    case 8:
                        image.RotateFlip(RotateFlipType.Rotate270FlipNone);
                        break;
                }

                image.RemovePropertyItem(ExifOrientationTagId);
            }
            
            return image;
        }

        //ste intereson
        internal Drawing GetImageElement(System.Drawing.Image img, ImagePart imagePart, OpenXmlPart xmlPart, float SizeX, float SizeY, string imageName = "", bool keepRelations = true)
        {
            
            int width = img.Width;
            int height = img.Height;
            float horzRezDpi = img.HorizontalResolution;
            float vertRezDpi = img.VerticalResolution;

            // The file is now unlocked
            const int emusPerInch = 914400;
            const int emusPerCm = 360000;
            var widthEmus = (long)(width / horzRezDpi * emusPerInch);
            var heightEmus = (long)(height / vertRezDpi * emusPerInch);

            if (keepRelations && SizeX > 0 && SizeY > 0)
            {
                var maxWidthEmus = (long)(SizeX * emusPerCm);
                var maxHeightEmus = (long)(SizeY * emusPerCm);

                if (widthEmus / SizeX > heightEmus / SizeY)
                {
                    var ratio = (heightEmus * 1.0m) / widthEmus;
                    widthEmus = maxWidthEmus;
                    heightEmus = (long)(widthEmus * ratio);
                }
                else
                {
                    var ratio = (widthEmus * 1.0m) / heightEmus;
                    heightEmus = maxHeightEmus;
                    widthEmus = (long)(heightEmus * ratio);
                }
            }
            else if (!keepRelations)
            {
                if (SizeX > 0)
                    widthEmus = (long)(SizeX * emusPerCm);
                if (SizeY > 0)
                    heightEmus = (long)(SizeY * emusPerCm);
            }

            // Define the reference of the image.
            return new Drawing(
                new DW.Inline(
                    new DW.Extent() { Cx = widthEmus, Cy = heightEmus },
                    new DW.EffectExtent()
                    {
                        LeftEdge = 0L,
                        TopEdge = 0L,
                        RightEdge = 0L,
                        BottomEdge = 0L
                    },
                    new DW.DocProperties()
                    {
                        Id = (UInt32Value)1U,
                        Name = imageName
                    },
                    new DW.NonVisualGraphicFrameDrawingProperties(
                        new A.GraphicFrameLocks() { NoChangeAspect = true }),
                    new A.Graphic(
                        new A.GraphicData(
                            new PIC.Picture(
                                new PIC.NonVisualPictureProperties(
                                    new PIC.NonVisualDrawingProperties()
                                    {
                                        Id = (UInt32Value)0U,
                                        Name = imageName
                                    },
                                    new PIC.NonVisualPictureDrawingProperties()
                                ),
                                new PIC.BlipFill(
                                    new A.Blip(
                                        new A.BlipExtensionList(
                                            new A.BlipExtension() { Uri = "{28A0092B-C50C-407E-A947-70E740481C1C}" }
                                        )
                                    )
                                    {
                                        Embed = xmlPart.GetIdOfPart(imagePart),
                                        CompressionState = A.BlipCompressionValues.Print,
                                        
                                    },
                                    new A.Stretch(
                                        new A.FillRectangle()
                                    )
                                ),
                                new PIC.ShapeProperties(
                                    new A.Transform2D(
                                        new A.Offset() { X = 0L, Y = 0L },
                                        new A.Extents() { Cx = widthEmus, Cy = heightEmus }
                                    ),
                                    new A.PresetGeometry(
                                        new A.AdjustValueList()
                                    )
                                    { Preset = A.ShapeTypeValues.Rectangle }
                                )
                            )
                        )
                        { Uri = "http://schemas.openxmlformats.org/drawingml/2006/picture" })
                )
                {
                    DistanceFromTop = (UInt32Value)0U,
                    DistanceFromBottom = (UInt32Value)0U,
                    DistanceFromLeft = (UInt32Value)0U,
                    DistanceFromRight = (UInt32Value)0U,
                    EditId = "50D07946"
                });
        }
        internal string getNormalizedTempName(string filePath) {
            string fileName = Path.GetFileNameWithoutExtension(filePath);
            fileName = fileName + "_normalized" + Path.GetExtension(filePath);
            string directory = Path.GetDirectoryName(filePath);
            return Path.Combine(directory, fileName);
        }
        //ste intereson
        internal Drawing GetImageElement(string filePath, OpenXmlPart xmlPart, float SizeX, float SizeY, int Rotate = 0)
        {
            ImagePartType imageFormat = ImagePartType.Jpeg;
            switch (Path.GetExtension(filePath).ToLower())
            {
                case ".jpg":
                case ".jpeg":
                    imageFormat = ImagePartType.Jpeg;
                    break;
                case ".png":
                    imageFormat = ImagePartType.Png;
                    break;
                case ".tiff":
                    imageFormat = ImagePartType.Tiff;
                    break;
            }
            //Create, if needed, a rotated version of the image for jpegs to manage orientation problems , will be deleted before returning 
            //https://stackoverflow.com/questions/19591216/net-thumbnail-is-rotating-image-when-being-created-from-a-mobile
            if (imageFormat == ImagePartType.Jpeg)
            {
                using (System.Drawing.Image img = System.Drawing.Image.FromFile(filePath, false))
                {
                    var imgNormalized = NormalizeOrientation(img);
                    string normalizedFile = getNormalizedTempName(filePath);
                    imgNormalized.Save(normalizedFile);
                    filePath = normalizedFile; //From now on use the normalized file in the OpenXML replacement
                }

            }

            ImagePart imagePart = AddImagePart(xmlPart, imageFormat);
            using (FileStream stream = new FileStream(filePath, FileMode.Open))
            {
                imagePart.FeedData(stream);
            }

            Drawing drawing = null;
            using (System.Drawing.Image img = System.Drawing.Image.FromFile(filePath, false))
            {
                drawing =  GetImageElement(img, imagePart, xmlPart, SizeX, SizeY, Path.GetFileName(filePath));
            }
            //For Jpeg the original file is temporary replaced by a normalized version (orientation) of the picture, can delete it now...
            if (imageFormat == ImagePartType.Jpeg)
                File.Delete(filePath);
            return drawing;

        }
        //ste ontereson

        internal IEnumerable<OpenXmlElement> GetBarcodeElements(string barcodeContent)
        {
            List<Run> elements = new List<Run>();
            elements.Add(new Run(new FieldChar() { FieldCharType = FieldCharValues.Begin }));
            elements.Add(new Run(new FieldCode(barcodeContent)));
            elements.Add(new Run(new FieldChar() { FieldCharType = FieldCharValues.End }));
            return elements;
        }

        /// <summary>
        /// Returns the table name from a given fieldname from a Mergefield.
        /// The instruction of a table-Mergefield is formatted as TBL_tablename_columnname
        /// </summary>
        /// <param name="fieldname">The field name.</param>
        /// <returns>The table name.</returns>
        /// <exception cref="ArgumentException">Thrown when fieldname is not formatted as TBL_tablename_columname.</exception>
        /// sbesoj te interesoi
        internal string GetTableNameFromFieldName(string fieldname)
        {
            int pos1 = fieldname.IndexOf('_');
            if (pos1 <= 0)
            {
                throw new ArgumentException("Error: table-MERGEFIELD should be formatted as follows: TBL_tablename_columnname.");
            }

            int pos2 = fieldname.IndexOf('_', pos1 + 1);
            if (pos2 <= 0)
            {
                throw new ArgumentException("Error: table-MERGEFIELD should be formatted as follows: TBL_tablename_columnname.");
            }

            return fieldname.Substring(pos1 + 1, pos2 - pos1 - 1);
        }

        /// <summary>
        /// Title-cases a string, capitalizing the first letter of every word.
        /// </summary>
        /// <param name="toConvert">The string to convert.</param>
        /// <returns>The string after title-casing.</returns>
        internal string ToTitleCase(string toConvert)
        {
            return ToTitleCaseHelper(toConvert, string.Empty);
        }

        /// <summary>
        /// Title-cases a string, capitalizing the first letter of every word.
        /// </summary>
        /// <param name="toConvert">The string to convert.</param>
        /// <param name="alreadyConverted">The part of the string already converted.  Seed with an empty string.</param>
        /// <returns>The string after title-casing.</returns>
        internal string ToTitleCaseHelper(string toConvert, string alreadyConverted)
        {
            /*
             * Tail-recursive title-casing implementation.
             * Edge case: toConvert is empty, null, or just white space.  If so, return alreadyConverted.
             * Else: Capitalize the first letter of the first word in toConvert, append that to alreadyConverted and recur.
             */
            if (string.IsNullOrEmpty(toConvert))
            {
                return alreadyConverted;
            }
            else
            {
                int indexOfFirstSpace = toConvert.IndexOf(' ');
                string firstWord, restOfString;

                // Check to see if we're on the last word or if there are more.
                if (indexOfFirstSpace != -1)
                {
                    firstWord = toConvert.Substring(0, indexOfFirstSpace);
                    restOfString = toConvert.Substring(indexOfFirstSpace).Trim();
                }
                else
                {
                    firstWord = toConvert.Substring(0);
                    restOfString = string.Empty;
                }

                System.Text.StringBuilder sb = new StringBuilder();

                sb.Append(alreadyConverted);
                sb.Append(" ");
                sb.Append(firstWord.Substring(0, 1).ToUpper(CultureInfo.CurrentCulture));

                if (firstWord.Length > 1)
                {
                    sb.Append(firstWord.Substring(1).ToLower(CultureInfo.CurrentCulture));
                }

                return ToTitleCaseHelper(restOfString, sb.ToString());
            }
        }

        /// <summary>
        /// Since MS Word 2010 the SimpleField element is not longer used. It has been replaced by a combination of
        /// Run elements and a FieldCode element. This method will convert the new format to the old SimpleField-compliant 
        /// format.
        /// </summary>
        /// <param name="mainElement"></param>
        internal void ConvertFieldCodes(OpenXmlElement mainElement)
        {
            //  search for all the Run elements 
            Run[] runs = mainElement.Descendants<Run>().ToArray();
            if (runs.Length == 0) return;

            Dictionary<Run, Run[]> newfields = new Dictionary<Run, Run[]>();

            int cursor = 0;
            do
            {
                Run run = runs[cursor];

                if (run.HasChildren && run.Descendants<FieldChar>().Count() > 0
                    && (run.Descendants<FieldChar>().First().FieldCharType & FieldCharValues.Begin) == FieldCharValues.Begin)
                {
                    List<Run> innerRuns = new List<Run>();
                    innerRuns.Add(run);

                    //  loop until we find the 'end' FieldChar
                    bool found = false;
                    string instruction = null;
                    RunProperties runprop = null;
                    do
                    {
                        cursor++;
                        run = runs[cursor];

                        innerRuns.Add(run);
                        if (run.HasChildren && run.Descendants<FieldCode>().Count() > 0)
                            instruction += run.GetFirstChild<FieldCode>().Text;
                        if (run.HasChildren && run.Descendants<FieldChar>().Count() > 0
                            && (run.Descendants<FieldChar>().First().FieldCharType & FieldCharValues.End) == FieldCharValues.End)
                        {
                            found = true;
                        }
                        if (run.HasChildren && run.Descendants<RunProperties>().Count() > 0)
                            runprop = run.GetFirstChild<RunProperties>();
                    } while (found == false && cursor < runs.Length);

                    //  something went wrong : found Begin but no End. Throw exception
                    if (!found)
                        throw new Exception("Found a Begin FieldChar but no End !");

                    if (!string.IsNullOrEmpty(instruction))
                    {
                        //  build new Run containing a SimpleField
                        Run newrun = new Run();
                        if (runprop != null)
                            newrun.AppendChild(runprop.CloneNode(true));
                        SimpleField simplefield = new SimpleField();
                        simplefield.Instruction = instruction;
                        newrun.AppendChild(simplefield);

                        newfields.Add(newrun, innerRuns.ToArray());
                    }
                }

                cursor++;
            } while (cursor < runs.Length);

            //  replace all FieldCodes by old-style SimpleFields
            foreach (KeyValuePair<Run, Run[]> kvp in newfields)
            {
                kvp.Value[0].Parent.ReplaceChild(kvp.Key, kvp.Value[0]);
                for (int i = 1; i < kvp.Value.Length; i++)
                    kvp.Value[i].Remove();
            }
        }
    }
    public class DataContext
    {
        public Dictionary<string, Dictionary<string, Dictionary<string, List<Dictionary<string, string>>>>> tables { get; set; }
        public List<BookMarkRelation> bookmarkRelations { get; set; }
        /// <summary>
        /// list of the main Ids 
        /// </summary>
        public List<string> rootBoIds { get; set; }


    }
    public class DataForMerge
    {
        public FileInfo TemplateFile { get; set; }
        public DataSet DataFromDb { get; set; }
        //relations between bkmrks
        public List<BookMarkRelation> BookmarkRelations = new List<BookMarkRelation>();
        //id del businessobject, bookmark ,dictionary BOID legati dal campo join  e lista valori nome campo - valore campo (tabella se count> 1)
        public Dictionary<string, Dictionary<string, Dictionary<string, List<Dictionary<string, string>>>>> Tables = new Dictionary<string, Dictionary<string, Dictionary<string, List<Dictionary<string, string>>>>>();
        //The main BoIds to iterate 
        public List<string> rootBoIds = new List<string>();
		//Alternative files for specific BoIds
		public Dictionary<string, string> rootBoIds_attachments = new Dictionary<string, string>();
		//add dictionary with bo_id -  bo_ids_attachments
		public Dictionary<string, string> rootBoIds_modelExceptions = new Dictionary<string, string>();
        //alternative Output filename 
        public Dictionary<string, string> rootBoIds_modelOutputFileName = new Dictionary<string, string>();
        // comma separated list of Bookmarks to hide for a specific BO
        public Dictionary<string, string> rootBoIds_modelHideBookmarks = new Dictionary<string, string>();
        public bool rootBoIds_removeEmptyTables = false;

    }
    public class WordDocumentFiller
    {
        const int LANG = 76;
        const string ROOT = "ROOT";
        /// <summary>
        /// Data + Files per culture
        /// </summary>
        public Dictionary<int, DataForMerge> TemplateData { get; set; }
        public string Stored_Output { get; set; }
        public string Stored_GetData { get; set; }
        public bool Flag_Batch { get; set; }
        public string OutCode { get; set; }
        public string Output_Directory { get; set; }
        private string serverMapPath { get; set; }
        public JObject formData { get; set; }
        public int getFilesToProduceCount()
        {
            int pdfMultiplier = 1;
            if (this.OutCode == "pdf")
                pdfMultiplier = 2;
            List<int> cultures = this.TemplateData.Keys.ToList<int>();
            int sum = 0;
            foreach (var c in cultures)
            {
                if (this.TemplateData[c].rootBoIds.Count > 1)
                    sum++; //if there's more than 1 bo a summary will be produced 
                sum += this.TemplateData[c].rootBoIds.Count;
            }
            return (sum * pdfMultiplier) + 1; //(BoIds + summaries x culture  * 2 if Pdf have to be produced) + 1 (zip)
        }

        public int getFilesToProduceCount(Boolean pdfTemplate)
        {
           
            List<int> cultures = this.TemplateData.Keys.ToList<int>();
            int sum = 0;
            foreach (var c in cultures)
            {
                sum += this.TemplateData[c].rootBoIds.Count;
            }
            return sum + 1; //(BoIds + summaries x culture  * 2 if Pdf have to be produced) + 1 (zip)
        }
        private FileInfo getFileInfoFromPath(string filePath)
        {
            //In biondan's case the path is not the defaultJson but a string while the strategy to pick the folder is the standard one... we manage this exception by setting jsonFilePath to false in the CustomConfig node of the configuration
            bool jsonFilePath = true;
            try {
                string customConfig = ApplicationSettingsManager.getCustomConfig();
                dynamic o = Newtonsoft.Json.JsonConvert.DeserializeObject<dynamic>(customConfig);
                jsonFilePath = o.jsonFilePath == null ? true : bool.Parse(o.jsonFilePath.ToString());
            }
            catch
            {
               
            }
            bool isAdminAreaUpload = true;

            //is applicationupload
            if (filePath.StartsWith("[{") || jsonFilePath == false)
            {
                if (jsonFilePath == false)
                {
                    filePath = Path.Combine("models", filePath);
                }
                else
                {
                    JArray files = JArray.Parse(filePath);
                    filePath = "/models/" + files.First()["name"].ToString();
                }
                isAdminAreaUpload = false;
            }
            bool isSqlServerFile = false;
            string fileName = Path.GetFileName(filePath);

            if (!File.Exists(@filePath))
            {
                string fileDir = MAGIC_SAVEFILEController.GetFileDestinationDir(Path.GetDirectoryName(filePath), fileName, out isSqlServerFile, isAdminAreaUpload);
                filePath = fileDir + "\\" + fileName;
            }

            FileInfo templateFile = new FileInfo(filePath);
            if (!isSqlServerFile && !File.Exists(templateFile.FullName))
                throw new System.ArgumentException("File '" + templateFile.FullName + "' not exists");

            return templateFile;
        }
        public WordDocumentFiller(int tipmodId, dynamic formData, int documentFillSessionId)
        {
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            string connection = DBConnectionManager.GetTargetConnection();
            var mainModel = dbutils.GetDataSet(@"SELECT
                        Stored_GetData,
                        Stored_Output,
                        Link_File,
                        Flag_Batch,
                        mmo.Code AS OutCode,
                        mmm.Output_Directory,
                        mmm.Culture_ID
                        FROM dbo.Magic_Models_Modeltype mmm
                        INNER JOIN dbo.Magic_Models_OutType mmo ON mmo.ID = mmm.OutType_ID
                        WHERE mmm.ID = " + tipmodId, connection).Tables[0].Rows[0];

            string filePath = mainModel["Link_File"].ToString();
            int defaultcultureId = mainModel["Culture_ID"] == DBNull.Value ? LANG : int.Parse(mainModel["Culture_ID"].ToString());
            this.TemplateData = new Dictionary<int, DataForMerge>();
            this.Stored_GetData = mainModel["Stored_GetData"].ToString();
            this.Stored_Output = mainModel["Stored_Output"].ToString();
            this.Flag_Batch = bool.Parse(mainModel["Flag_Batch"].ToString());
            this.OutCode = mainModel["OutCode"].ToString();
            this.Output_Directory = mainModel["Output_Directory"].ToString();
            this.serverMapPath = HttpContext.Current.Server.MapPath("~");
            this.formData = JObject.FromObject(formData);

            //Set data and files for the default language
            formData.Culture_ID = defaultcultureId;
            formData.DocumentFillSession_ID = documentFillSessionId.ToString();            
            formData.Output_Directory = mainModel["Output_Directory"].ToString();

            DataSet ds = dbutils.GetDataSetFromStoredProcedure(this.Stored_GetData.ToString(), formData);
            this.TemplateData.Add(defaultcultureId, new DataForMerge() { DataFromDb = ds, TemplateFile = this.getFileInfoFromPath(filePath) });

            //Alternative languages 
            DataSet alternativeLangs = dbutils.GetDataSet(@"SELECT Culture_ID,Link_File FROM Magic_Models_Modeltype_AltCultures where Modeltype_ID =" + tipmodId, connection);
            int cultureid;
            string altFilePath = String.Empty;
            foreach (DataRow r in alternativeLangs.Tables[0].Rows)
            {
                cultureid = int.Parse(r["Culture_ID"].ToString());
                altFilePath = r["Link_File"].ToString();
                formData.Culture_ID = cultureid;
                DataSet dsalt = dbutils.GetDataSetFromStoredProcedure(this.Stored_GetData.ToString(), formData);
                this.TemplateData.Add(cultureid, new DataForMerge() { DataFromDb = dsalt, TemplateFile = this.getFileInfoFromPath(altFilePath) });
            }
        }
        public WordDocumentFiller(string templateFile, DataSet datafromdb, dynamic formData)
        {
            this.TemplateData = new Dictionary<int, DataForMerge>();
            this.TemplateData.Add(LANG, new DataForMerge() { DataFromDb = datafromdb, TemplateFile = this.getFileInfoFromPath(templateFile) });
            this.serverMapPath = HttpContext.Current.Server.MapPath("~");
            this.formData = JObject.FromObject(formData);
        }

        private void addBookmarkToBo(string BoId, string bookmarkname, DataRow dr, int cultureid)
        {
            var Tables = this.TemplateData[cultureid].Tables;
            var BookmarkRelations = this.TemplateData[cultureid].BookmarkRelations;
            if (!Tables.ContainsKey(BoId))
            {
                Tables.Add(BoId, new Dictionary<string, Dictionary<string, List<Dictionary<string, string>>>>());
                Tables[BoId].Add(bookmarkname, new Dictionary<string, List<Dictionary<string, string>>>());
            }
            if (!Tables[BoId].ContainsKey(bookmarkname))
                Tables[BoId].Add(bookmarkname, new Dictionary<string, List<Dictionary<string, string>>>());

            if (!Tables[BoId][bookmarkname].Any())
            {
                Tables[BoId][bookmarkname] = new Dictionary<string, List<Dictionary<string, string>>>();
            }
            string joinfield = BookmarkRelations.Where(x => x.BookmarkChild == bookmarkname).Select(y => y.ChildFieldJoin).FirstOrDefault();

            if (joinfield == null)
                joinfield = ROOT;
            else
                joinfield = dr[joinfield].ToString();

            if (!Tables[BoId][bookmarkname].ContainsKey(joinfield))
            {
                Tables[BoId][bookmarkname].Add(joinfield, new List<Dictionary<string, string>>());
            }

            var dict = new Dictionary<string, string>();
            foreach (DataColumn col in dr.Table.Columns)
            {
                string value = String.Empty;
                if (col.Ordinal > 0)
                {
                    value = dr[col.ColumnName].ToString();
                    if (!dict.ContainsKey(value))
                        dict.Add(col.ColumnName, value);
                }
            }
            Tables[BoId][bookmarkname][joinfield].Add(dict);


        }
        /// <summary>
        /// Build all the same level associations for a BOID
        /// </summary>
        /// <param name="i"></param>
        /// <param name="dr"></param>
        private void ManageTable(int i, DataRow dr, bool lookUpAltTemplate, bool hasBookmarksToHide, bool hasOutputFilenameOverwrite, bool hasAttachments, int cultureid)
        {
            switch (i)
            {
                case 0: //relationships between bookmarks
                    string a1 = dr[1].ToString();
                    string a2 = dr[2].ToString();
                    string a3 = dr[3].ToString();
                    string a4 = dr[4].ToString();
                    BookMarkRelation br = new BookMarkRelation(dr[1].ToString(), dr[2].ToString(), dr[3].ToString(), dr[4].ToString());
                    this.TemplateData[cultureid].BookmarkRelations.Add(br);
                    break;
                default://bookmarks
                    string bookmarkname = dr[0].ToString();

                    string hookupParentIDfield = this.TemplateData[cultureid].BookmarkRelations.Where(x => x.BookmarkChild == bookmarkname).Select(y => y.ChildFieldJoin).FirstOrDefault();

                    string parentBoId = ROOT;
                    if (hookupParentIDfield != null)
                        parentBoId = dr[hookupParentIDfield].ToString();

                    string BoId = dr[2].ToString();
                    string alternativeTemplate = String.Empty;
                    string bookmarksToHide = String.Empty;
                    string alternativeOutputFilename = String.Empty;
                    string rootAttachments = String.Empty;
					bool removeEmptyTables = false;


                    if (lookUpAltTemplate)
                        alternativeTemplate = (dr["document_template"] == null) ? String.Empty : dr["document_template"].ToString();
                    if (hasBookmarksToHide)
                        bookmarksToHide = (dr["document_bookmarksHide"] == null) ? String.Empty : dr["document_bookmarksHide"].ToString();
                    if (hasOutputFilenameOverwrite)
                        alternativeOutputFilename = (dr["document_outputFileName"] == null) ? String.Empty : dr["document_outputFileName"].ToString();
					if (hasAttachments)
						rootAttachments = (dr["rootAttachments"] == null) ? String.Empty : dr["rootAttachments"].ToString();
					//https://gitlab.ilosgroup.com/ilos/operations/-/issues/407  optionally remove empty tables
					if (dr.Table.Columns.Contains("document_removeEmptyTables"))
                        removeEmptyTables = (dr["document_removeEmptyTables"] == null) ? false : dr.Field<bool>("document_removeEmptyTables");

                    if (bookmarkname.ToUpper() == ROOT)
                    {
                        this.TemplateData[cultureid].rootBoIds.Add(BoId);
                        if (!String.IsNullOrEmpty(alternativeTemplate))
                            this.TemplateData[cultureid].rootBoIds_modelExceptions.Add(BoId, alternativeTemplate);

                        string altoutputFname = getAlternativeOutpuFileNameForCulture(cultureid, alternativeOutputFilename);
                        if (!String.IsNullOrEmpty(altoutputFname))
                            this.TemplateData[cultureid].rootBoIds_modelOutputFileName.Add(BoId, altoutputFname);
                        if (!String.IsNullOrEmpty(bookmarksToHide))
                            this.TemplateData[cultureid].rootBoIds_modelHideBookmarks.Add(BoId, bookmarksToHide);
                        if (removeEmptyTables)
                            this.TemplateData[cultureid].rootBoIds_removeEmptyTables = removeEmptyTables;
						if (!String.IsNullOrEmpty(rootAttachments))
							this.TemplateData[cultureid].rootBoIds_attachments.Add(BoId, rootAttachments);

					}

                    addBookmarkToBo(BoId, bookmarkname, dr, cultureid);
                    if (parentBoId != ROOT && parentBoId != BoId)
                        addBookmarkToBo(parentBoId, bookmarkname, dr, cultureid);
                    break;
            }
        }
        public void FillDictionariesAndMetaData()
        {
            List<int> cultureKeys = new List<int>();
            foreach (var k in this.TemplateData.Keys)
                cultureKeys.Add(k);
            //1st table has relations between bookmarks
            //The other datatables correspond to  bookmarks (which can be nested)
            foreach (var cultureid in cultureKeys)
            {
                int i = 0;
                foreach (System.Data.DataTable dt in this.TemplateData[cultureid].DataFromDb.Tables)
                {
                    bool hasTemplateOverwrite = dt.Columns.Contains("document_template");
                    bool hasBookmarksToHide = dt.Columns.Contains("document_bookmarksHide");
                    bool hasOutputFilenameOverwrite = dt.Columns.Contains("document_outputFileName");
                    bool hasRemoveEmptyTables = dt.Columns.Contains("document_removeEmptyTables");
					bool hasAttachments = dt.Columns.Contains("rootAttachments");

					//bool hasRemoveEmptyTables = dt.Columns.Contains("document_removeEmptyTables");
					foreach (DataRow dr in dt.Rows)
                        ManageTable(i, dr, hasTemplateOverwrite, hasBookmarksToHide, hasOutputFilenameOverwrite, hasAttachments, cultureid);
                    i++;
                }
                if (this.getRootBoCount(cultureid) == 0)
                    throw new System.ArgumentException(this.Stored_GetData + " did not return any item for culture " + cultureid);
            }
        }

        public int getRootBoCount(int cultureid = LANG)
        {
            return this.TemplateData[cultureid].rootBoIds.Count();
        }
        RichEditDocumentServer CreateDocumentServer(string file, bool isLandscape = false)
        {
            RichEditDocumentServer documentServer = new RichEditDocumentServer();
            //using (Stream documentStream = GetDocumentStream(file))
            //{
            //    documentServer.LoadDocument(documentStream,DevExpress.XtraRichEdit.DocumentFormat.OpenXml);
            //}
            documentServer.LoadDocument(file, DevExpress.XtraRichEdit.DocumentFormat.OpenXml);

            if (isLandscape)
                documentServer.Document.Sections.First().Page.Landscape = true;

            //documentServer.Options.Export.Html.EmbedImages = true;
            return documentServer;
        }
        Stream GetDocumentStream(string file)
        {
            return new MemoryStream(File.ReadAllBytes(file));
        }
        public void Savefile(byte[] filebytes, FileInfo templateFile, out string file, string fileName, bool saveAsPdf, out string f, bool isLandscape, DatabaseCommandUtils dbutils, int idUser, int idUserGroup, string copyResultsToDirectory = null, string PDFNetServiceDirectory = null, string attachmentsToAttach =null)
        {
            //save as pdf with devexpress doc builder
            string fileToCopy = String.Empty;
            //Generate docx 
            file = f = fileName + templateFile.Extension;
            fileToCopy = f;
            FileStream fileStream = new FileStream(file, FileMode.Create, FileAccess.Write);
            fileStream.Write(filebytes, 0, filebytes.Length);
            fileStream.Close();
            //replace this if pdf fill service is configured, else ::
            if (saveAsPdf)
            {
                // (if configured) use #PDFFormFiller to convert docx to pdf (instead of devextreme )
                if (!String.IsNullOrEmpty(PDFNetServiceDirectory))
                {
                    try
                    {
                        // Wrap file paths in quotes to handle spaces
                        string args = $"convert \"{f}\" \"{fileName}\"";

						// Add attachments parameter if it's not null or empty
						if (!String.IsNullOrEmpty(attachmentsToAttach))
						{
							args += $" \"{attachmentsToAttach}\"";
						}
						// Start PDFNetService
						ProcessStartInfo startInfo = new ProcessStartInfo
                        {
                            FileName = PDFNetServiceDirectory,
                            Arguments = args, // Merge PDF
                            UseShellExecute = false, // Recommended for security
                            RedirectStandardError = true, // Capture errors
                            RedirectStandardOutput = true // Capture output
                        };

                        using (var p = Process.Start(startInfo))
                        {
                            p.WaitForExit();

                            // Check if the process exited successfully
                            if (p.ExitCode != 0)
                            {
                                string error = p.StandardError.ReadToEnd();
                                throw new Exception($"PDFNetService failed with exit code {p.ExitCode}: {error}");
                            }

                            // Construct the output PDF path
                            f = Path.Combine(Path.GetDirectoryName(file), Path.GetFileNameWithoutExtension(file) + ".pdf");
                        }
                    }
                    catch (Exception ex)
                    {
                        // Handle exceptions (e.g., log or rethrow)
                        throw new Exception("An error occurred while converting the file to PDF.", ex);
                    }
                }
                else
                {
                    f = Path.Combine(Path.GetDirectoryName(file), Path.GetFileNameWithoutExtension(file) + ".pdf");
                    fileToCopy = f;
                    RichEditDocumentServer server = CreateDocumentServer(file, isLandscape);
                    // check usage of RichEditDocumentServer, if useda
                    FileStream fsOut = File.Open(f, FileMode.Create);
                    server.ExportToPdf(fsOut);
                    fsOut.Close();
                    AddPaginationToPdf(f);
                }
            }
            if (copyResultsToDirectory != null)
            {
                //if copyResultsToDirectory is an absolute path, save in filesystem, otherwise save in sql
                string filePath = Path.Combine(copyResultsToDirectory, Path.GetFileName(fileToCopy));
                if (MAGIC_SAVEFILEController.IsAbsolutePath(copyResultsToDirectory))
                {
                    if (!Directory.Exists(copyResultsToDirectory))
                        Directory.CreateDirectory(copyResultsToDirectory);
                    File.Copy(fileToCopy, filePath, true);
                }
                else
                {
                    using (FileStream stream = new FileStream(fileToCopy, FileMode.Open))
                        Controllers.MAGIC_SAVEFILEController.SaveFileInDBTable(stream, filePath, dbutils, idUser, idUserGroup);
                    //File.Delete(fileToCopy);
                }
            }
        }
        private string getAlternativeOutpuFileNameForCulture(int culture, string alternativeOutputJSON)
        {
            string alternativeOutputFilename = String.Empty;
            try
            {
                Dictionary<int, string> dict = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<int, string>>(alternativeOutputJSON);

                if (dict.ContainsKey(culture))
                    alternativeOutputFilename = dict[culture];
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
            }
            return alternativeOutputFilename;
        }
            public void BuildOutputFiles(string dir, Data.Magic_DocumentFillSessions documentFillSession, Data.MagicDBDataContext magicDBContext, DatabaseCommandUtils dbutils, string targetConnection, int idUser, int idUserGroup, bool saveAsPdf = false, string copyResultsToDirectory = null, int? cultureid = LANG, bool isMSSQLFileActive = false, FileInfo templateFile = null,bool skipMergeFile = false,string PDFNetServiceDirectory = null, CancellationTokenSource cancellationTokenSource = null, ManualResetEventSlim pauseEvent = null, bool pauseAfterFirstFile = false)
        {
            try
            {
                string out_file_prefix = DateTime.Now.Ticks + "-";
                int culture = (int)cultureid;
                //se viene passato un template dall'  esterno uso quello senno' prendo quello configurato nel costruttore dato il modelId
                if (templateFile == null)
                    templateFile = this.TemplateData[culture].TemplateFile;
                DataContext dc = new DataContext();
                dc.tables = this.TemplateData[(int)cultureid].Tables;
                dc.rootBoIds = this.TemplateData[(int)cultureid].rootBoIds;
                dc.bookmarkRelations = this.TemplateData[(int)cultureid].BookmarkRelations;
                bool containsLandscapeDocument = false;
                string sqlCommand = "INSERT INTO [dbo].[Magic_DocumentFillFiles] (FilePath, DocumentFillSession_ID, Culture_ID, BO_ID) VALUES ({0}, {1}, {2}, {3})";

                List<string> filepaths = new List<string>();// = new[] { "D:\\one.docx", "D:\\two.docx", "D:\\three.docx", "D:\\four.docx", "D:\\five.docx" };
                int index = 0;

                foreach (var bo in this.TemplateData[culture].rootBoIds)
                {
                    if (cancellationTokenSource != null)
                    {
                        if (pauseEvent != null)
                            pauseEvent.Wait(cancellationTokenSource.Token);
                        cancellationTokenSource.Token.ThrowIfCancellationRequested();
                    }
                    string alternativeTemplate = this.TemplateData[culture].rootBoIds_modelExceptions.ContainsKey(bo) ? this.TemplateData[culture].rootBoIds_modelExceptions[bo] : "";
                    string bookmarksToHide = this.TemplateData[culture].rootBoIds_modelHideBookmarks.ContainsKey(bo) ? this.TemplateData[culture].rootBoIds_modelHideBookmarks[bo] : "";
                    string alternativeOutputFileName = this.TemplateData[culture].rootBoIds_modelOutputFileName.ContainsKey(bo) ? this.TemplateData[culture].rootBoIds_modelOutputFileName[bo] : "";
                    string attachmentsToAttach = this.TemplateData[culture].rootBoIds_attachments.ContainsKey(bo) ? this.TemplateData[culture].rootBoIds_attachments[bo] : "";

					string fileTopick = String.IsNullOrEmpty(alternativeTemplate) == false ? alternativeTemplate : (isMSSQLFileActive ? templateFile.ToString() : templateFile.FullName);
                   
                    //get bookmarks which are NOT directly linked to ROOT 
                    bool isLandscape = false;
                    byte[] filebytes = null;
                    bool removeEmptyTables = this.TemplateData[culture].rootBoIds_removeEmptyTables;
                    FormFiller formFiller = new FormFiller(dbutils, targetConnection, idUser, idUserGroup, saveAsPdf);

                    filebytes = formFiller.replaceMergeFieldsInFile(
                        dc,
                        fileTopick,
                        bo,
                        serverMapPath,
                        ref isLandscape,
                        this.formData,
                        targetConnection,
                        isMSSQLFileActive,
                        bookmarksToHide,
                        removeEmptyTables
                        );
                 
                    string fileName = String.IsNullOrEmpty(alternativeOutputFileName) ? Path.Combine(dir, out_file_prefix + Path.GetFileNameWithoutExtension(fileTopick) + "_" + bo) : Path.Combine(dir, alternativeOutputFileName);
                    string file = string.Empty;
                    string f = string.Empty;

                    //save of the single file in PDF or original format
                    Savefile(filebytes, templateFile, out file, fileName, saveAsPdf, out f, isLandscape, dbutils, idUser, idUserGroup, copyResultsToDirectory, PDFNetServiceDirectory, attachmentsToAttach);
                    filepaths.Add(file);
                    magicDBContext.ExecuteCommand(sqlCommand, f, documentFillSession.ID, culture, bo);

                    if (isLandscape)
                        containsLandscapeDocument = isLandscape;

                    if (pauseEvent != null && index == 0 && pauseAfterFirstFile == true)
                        pauseEvent.Reset();
                    index++;
                }

                string mergeFile = string.Empty;
                List<string> docxFilesToMerge = new List<string>(filepaths);
                if (filepaths.Count > 1 && skipMergeFile == false) //i generate the summary document only if there's more than 1 merged doc
                {
                    //create the merged doc - the base is the first built doc
                    string mergeFileName = out_file_prefix + templateFile.Name;
                    mergeFile = Path.Combine(dir, mergeFileName);
                    File.Copy(filepaths.First(), mergeFile, true);
                    int i = 0;
                    filepaths.RemoveAt(0);//i copied the 1st there's no need to reinsert it
                    foreach (var builtfile in filepaths)
                        using (WordprocessingDocument myDoc = WordprocessingDocument.Open(mergeFile, true))
                        {
                            MainDocumentPart mainPart = myDoc.MainDocumentPart;
                            //PageBreak...
                            Paragraph para = new Paragraph(new Run((new Break() { Type = BreakValues.Page })));
                            mainPart.Document.Body.InsertAfter(para, mainPart.Document.Body.LastChild);

                            string altChunkId = "AltChunkId" + i;
                            i++;
                            AlternativeFormatImportPart chunk = mainPart.AddAlternativeFormatImportPart(
                                AlternativeFormatImportPartType.WordprocessingML, altChunkId);
                            using (FileStream fileStream = File.Open(builtfile, FileMode.Open))
                            {
                                chunk.FeedData(fileStream);
                            }
                            AltChunk altChunk = new AltChunk();
                            altChunk.Id = altChunkId;
                            mainPart.Document.Body.InsertAfter(altChunk, mainPart.Document.Body.Elements<Paragraph>().Last());
                            mainPart.Document.Save();
                            myDoc.Close();
                        }
                }
                if (saveAsPdf && !String.IsNullOrEmpty(mergeFile)) //convert to PDF the merged file
                {
                    string pdfFile = Path.Combine(Path.GetDirectoryName(mergeFile), Path.GetFileNameWithoutExtension(mergeFile) + ".pdf");
                    bool usePdfNetMerge = false;

                    // Check if PDFNetService is configured
                    if (!String.IsNullOrEmpty(PDFNetServiceDirectory))
                    {
                        try
                        {

                            // Create command arguments for the mergedocx command
                            StringBuilder argsBuilder = new StringBuilder();
                            argsBuilder.Append("mergedocx ");
                            argsBuilder.Append($"\"{pdfFile}\" ");

                            // Add all individual DOCX files to the command
                            foreach (string filepath in docxFilesToMerge)
                            {
                                argsBuilder.Append($"\"{filepath}\" ");
                            }

                            string args = argsBuilder.ToString().TrimEnd();

                            // Start PDFNetService with our new mergedocx command
                            ProcessStartInfo startInfo = new ProcessStartInfo
                            {
                                FileName = PDFNetServiceDirectory,
                                Arguments = args,
                                UseShellExecute = false,
                                RedirectStandardError = true,
                                RedirectStandardOutput = true,
                                WorkingDirectory = Path.GetDirectoryName(mergeFile)
                            };

                            using (var p = Process.Start(startInfo))
                            {
                                string output = p.StandardOutput.ReadToEnd();
                                string error = p.StandardError.ReadToEnd();

                                p.WaitForExit();

                                // Log info for debugging
                                System.IO.File.WriteAllText(Path.Combine(dir, "pdf_merge_log.txt"),
                                    $"Command: {PDFNetServiceDirectory} {args}\n" +
                                    $"Exit code: {p.ExitCode}\n" +
                                    $"Output: {output}\n" +
                                    $"Error: {error}");

                                // Check if the process exited successfully
                                if (p.ExitCode != 0)
                                {
                                    throw new Exception($"PDFNetService mergedocx failed with exit code {p.ExitCode}: {error}");
                                }

                                // Verify the PDF file exists
                                if (File.Exists(pdfFile))
                                {
                                    usePdfNetMerge = true;
                                }
                                else
                                {
                                    throw new Exception($"PDF file was not created at expected location: {pdfFile}");
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            // Log detailed error but continue to fallback
                            System.IO.File.WriteAllText(Path.Combine(dir, "pdfnet_merge_error.txt"), ex.ToString());
                            // We'll fall back to the regular conversion below
                        }
                    }

                    // If mergedocx command didn't work, use the original approach
                    if (!usePdfNetMerge)
                    {
                        try
                        {
                            // First try PDFNetService standard convert command
                            if (!String.IsNullOrEmpty(PDFNetServiceDirectory))
                            {
                                try
                                {
                                    // Using the same pattern as in Savefile() method
                                    string args = $"convert \"{mergeFile}\" \"{Path.GetDirectoryName(mergeFile)}\\{Path.GetFileNameWithoutExtension(mergeFile)}\"";

                                    // Start PDFNetService
                                    ProcessStartInfo startInfo = new ProcessStartInfo
                                    {
                                        FileName = PDFNetServiceDirectory,
                                        Arguments = args,
                                        UseShellExecute = false,
                                        RedirectStandardError = true,
                                        RedirectStandardOutput = true,
                                        WorkingDirectory = Path.GetDirectoryName(mergeFile)
                                    };

                                    using (var p = Process.Start(startInfo))
                                    {
                                        string output = p.StandardOutput.ReadToEnd();
                                        string error = p.StandardError.ReadToEnd();

                                        p.WaitForExit();

                                        // Log info for debugging
                                        System.IO.File.WriteAllText(Path.Combine(dir, "pdf_convert_log.txt"),
                                            $"Command: {PDFNetServiceDirectory} {args}\n" +
                                            $"Exit code: {p.ExitCode}\n" +
                                            $"Output: {output}\n" +
                                            $"Error: {error}");

                                        // Check if the process exited successfully
                                        if (p.ExitCode != 0)
                                        {
                                            throw new Exception($"PDFNetService failed with exit code {p.ExitCode}: {error}");
                                        }

                                        // Verify the PDF file exists before attempting pagination
                                        if (File.Exists(pdfFile))
                                        {
                                            try
                                            {
                                                AddPaginationToPdf(pdfFile);
                                            }
                                            catch (Exception pEx)
                                            {
                                                System.IO.File.WriteAllText(Path.Combine(dir, "pagination_error.txt"), pEx.ToString());
                                            }
                                        }
                                        else
                                        {
                                            throw new Exception($"PDF file was not created at expected location: {pdfFile}");
                                        }
                                    }
                                }
                                catch (Exception ex)
                                {
                                    // Log detailed error then fall back to RichEditDocumentServer
                                    System.IO.File.WriteAllText(Path.Combine(dir, "pdfnet_error.txt"), ex.ToString());
                                    throw; // Let the outer try/catch handle the fallback
                                }
                            }
                            else
                            {
                                throw new Exception("PDFNetService not configured");
                            }
                        }
                        catch (Exception)
                        {
                            try
                            {
                                // Use RichEditDocumentServer as final fallback
                                RichEditDocumentServer server = CreateDocumentServer(mergeFile, containsLandscapeDocument);
                                FileStream fsOut = File.Open(pdfFile, FileMode.Create);
                                server.ExportToPdf(fsOut);
                                fsOut.Close();
                                AddPaginationToPdf(pdfFile);
                            }
                            catch (Exception fallbackEx)
                            {
                                System.IO.File.WriteAllText(Path.Combine(dir, "richEdit_error.txt"), fallbackEx.ToString());
                                throw new Exception("Failed to create PDF with either PDFNetService or RichEditDocumentServer.", fallbackEx);
                            }
                        }
                    }

                }
                if (!String.IsNullOrEmpty(mergeFile))
                {
                    magicDBContext.Magic_DocumentFillFiles.InsertOnSubmit(new Data.Magic_DocumentFillFiles
                    {
                        FilePath = mergeFile,
                        Magic_DocumentFillSessions = documentFillSession,
                        Culture_ID = culture
                    });
                }
                magicDBContext.SubmitChanges();
            }
            catch (Exception e)
            {
                System.IO.File.WriteAllText(Path.Combine(dir, "error.txt"), "Wordfill: " + e.Message);
            }
        }
private void AddPaginationToPdf(string pdfFile, int offset = 10, int fontSize = 9, string fontFamily = "Verdana")
        {
            PdfSharp.Pdf.PdfDocument document = PdfReader.Open(pdfFile, PdfDocumentOpenMode.Modify);
            XFont font = new XFont(fontFamily, fontSize);
            XBrush brush = XBrushes.Black;
            for (int i = 0; i < document.Pages.Count; ++i)
            {
                PdfSharp.Pdf.PdfPage page = document.Pages[i];
                string pageString = (i + 1).ToString();
                using (XGraphics gfx = XGraphics.FromPdfPage(page))
                {
                    XSize size = gfx.MeasureString(pageString, font);
                    XRect layoutRectangle = new XRect(page.Width - size.Width - offset, page.Height - size.Height - offset, size.Width, size.Height);
                    gfx.DrawString(pageString, font, brush, layoutRectangle, XStringFormats.Center);
                }
            }
            document.Save(pdfFile);
        }

        public Boolean templateIsPdf() {

            List<int> cultures =TemplateData.Keys.ToList<int>();
            Boolean templateIsPdf = TemplateData[cultures[0]].TemplateFile.Extension.Equals(".pdf");

            return templateIsPdf;
        }
    }
}
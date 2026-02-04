using DevExpress.XtraRichEdit;
using iTextSharp.text;
using iTextSharp.text.pdf;
using iTextSharp.text.pdf.parser;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;

namespace MagicFramework.Helpers
{
    public class PdfHelper
    {
        
        private string pdfPath { get; set; }
        private string pdfOutPath { get; set; }
        public PdfHelper(string pdfpath, string pdfoutpath)
        {
            this.pdfPath = pdfpath;
            this.pdfOutPath = pdfoutpath;
        }

        public class RectAndText
        {
            public iTextSharp.text.Rectangle Rect;
            public String Text;
            public RectAndText(iTextSharp.text.Rectangle rect, String text)
            {
                this.Rect = rect;
                this.Text = text;
            }
        }
        public class SearchSignatureLocationTextExtractionStrategy : LocationTextExtractionStrategy
        {
            public string word { get; set; }
            public char placeholder { get; set; }
            /// <summary>
            /// removes chars at begin and end (--# #--) and assumes the remaining as the field name
            /// </summary>
            /// <param name="text">It's a chunk of text in the pdf</param>
            /// <returns></returns>
            private string getFieldName(string text)
            {
                return text.Split(placeholder)[1];
            }
            public SearchSignatureLocationTextExtractionStrategy(char _placeholder)
            {
                this.placeholder = _placeholder;
            }
            ////Hold each coordinate
            public List<RectAndText> signaturePoints = new List<RectAndText>();

            public RectAndText tempSignaturePoints { get; set; }

    //        public string signaturePattern { get; set; } // "--#(.*)#--";
                                                         //Automatically called for each chunk of text in the PDF
            public override void RenderText(TextRenderInfo renderInfo)
            {
                base.RenderText(renderInfo);

                //Get the bounding box for the chunk of text
                var bottomLeft = renderInfo.GetDescentLine().GetStartPoint();
                var topRight = renderInfo.GetAscentLine().GetEndPoint();

                //Create a rectangle from it
                var rect = new iTextSharp.text.Rectangle(
                                                        bottomLeft[Vector.I1],
                                                        bottomLeft[Vector.I2],
                                                        topRight[Vector.I1],
                                                        topRight[Vector.I2]
                                                        );

                //Add this to our main collection
                string txt = renderInfo.GetText();
                //it's the beginning of a potential signature field 
                if (txt.Contains(this.placeholder) && String.IsNullOrEmpty(this.word))
                {
                    this.tempSignaturePoints = new RectAndText(rect, this.word);
                    this.word = txt;
                }
                //is this a signature field? if yes add the points of the other txt which contained the § char. In anycase reset the word and start with  new search of the §  
                else if (txt.Contains(this.placeholder) && !String.IsNullOrEmpty(this.word))
                {
                    this.tempSignaturePoints.Text = this.word.Split(this.placeholder)[1];
                    this.signaturePoints.Add(this.tempSignaturePoints);
                    this.word = null;
                }
                //no special char, and the word is not empty or null , simply concat to word
                if (!txt.Contains(this.placeholder) && !String.IsNullOrEmpty(this.word))
                    this.word += txt;
            }
        }
        private  List<RectAndText> AddSignatureFieldsToPdf(char placeholder, int pageNumber)
        {
            //Create an instance of our strategy
            var t = new SearchSignatureLocationTextExtractionStrategy(placeholder);

            //Parse page 1 of the document above
            using (var r = new iTextSharp.text.pdf.PdfReader(this.pdfPath))
            {
                var ex = PdfTextExtractor.GetTextFromPage(r, pageNumber, t);
            }
            return t.signaturePoints;
        }


        public void replaceStringWithSignatureField(char placeholder)
        {
            //string inputregex = "--#(.*)#--";
            var sourceFileReader = new iTextSharp.text.pdf.PdfReader(this.pdfPath);
            PdfStamper stamper = new iTextSharp.text.pdf.PdfStamper(sourceFileReader, new System.IO.FileStream(this.pdfOutPath, System.IO.FileMode.Create));
            iTextSharp.text.pdf.PdfContentByte cb = null;
            
            for (int page = 1; page <= sourceFileReader.NumberOfPages; page++)
            {
                cb = stamper.GetOverContent(page);
                List<RectAndText> matchesFound = AddSignatureFieldsToPdf(placeholder, page);
                //MatchesFound contains all the positions of the placeholders to be replaced with signature fields and their names
                foreach (var placeholderposition in matchesFound)
                {
                    cb.SetColorFill(BaseColor.WHITE);
                    int right_offset = 100; 
                    cb.Rectangle(placeholderposition.Rect.Left, placeholderposition.Rect.Bottom, placeholderposition.Rect.Right + right_offset, placeholderposition.Rect.Height);
                    cb.Fill();
                    PdfFormField sig = PdfFormField.CreateSignature(stamper.Writer);
                    iTextSharp.text.Rectangle rect = new iTextSharp.text.Rectangle(placeholderposition.Rect.Left, placeholderposition.Rect.Bottom, placeholderposition.Rect.Right + right_offset, placeholderposition.Rect.Top);
                    sig.SetWidget(rect, null);
                    sig.Flags = PdfAnnotation.FLAGS_PRINT;
                    sig.Put(PdfName.DA, new PdfString("/Helv 0 Tf 0 g"));
                    sig.FieldName = placeholderposition.Text;
                    sig.Page = page;
                    stamper.AddAnnotation(sig, page);
                   
                }
            }
            stamper.Close();
            sourceFileReader.Close();
        }

        public static string generatePdfFromWord(string wordfilepath)
        {
            string f = System.IO.Path.Combine(System.IO.Path.GetDirectoryName(wordfilepath), DateTime.Now.Ticks.ToString() + "_" + System.IO.Path.GetFileNameWithoutExtension(wordfilepath) + ".pdf");
            RichEditDocumentServer documentServer = new RichEditDocumentServer();
            documentServer.LoadDocument(wordfilepath, DevExpress.XtraRichEdit.DocumentFormat.OpenXml);
            FileStream fsOut = File.Open(f, FileMode.Create);
            documentServer.ExportToPdf(fsOut);
            fsOut.Close();
            return f;
        }
    }
}
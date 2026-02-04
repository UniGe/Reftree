using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Reflection;
using System.Configuration;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Dynamic;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;


namespace MagicFramework.Helpers
{
    public static class Utils
    {
        private static Regex MobileCheck = new Regex(@"android|(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino", RegexOptions.IgnoreCase | RegexOptions.Multiline | RegexOptions.Compiled);
        private static Regex MobileVersionCheck = new Regex(@"1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-", RegexOptions.IgnoreCase | RegexOptions.Multiline | RegexOptions.Compiled);
        private static string ServiceWorkerUrlPathPrefix = ConfigurationManager.AppSettings.Get("ServiceWorkerUrlPathPrefix");

        public static bool IsMobile()
        {
            System.Diagnostics.Debug.Assert(HttpContext.Current != null);

            if (HttpContext.Current.Request != null && HttpContext.Current.Request.ServerVariables["HTTP_USER_AGENT"] != null)
            {
                var u = HttpContext.Current.Request.ServerVariables["HTTP_USER_AGENT"].ToString();

                if (u.Length < 4)
                    return false;

                if (MobileCheck.IsMatch(u) || MobileVersionCheck.IsMatch(u.Substring(0, 4)))
                    return true;
            }

            return false;
        }
        public static string ReplaceNewlnCarriageRetAttributes(string stringValue, string replacementString = "")
        {
            //return stringValue.Replace(System.Environment.NewLine, replacementString);
            return Regex.Replace(stringValue, @"\r\n?|\n", replacementString);
        }

        public static bool IsPropertyExist(dynamic settings, string name)
        {
            if (settings.GetType() == typeof(JObject))
                return ((JObject)settings)[name] != null;
            return settings.GetType().GetProperty(name) != null;
        }

        public static string DateTimeToSQLDateString(DateTime date)
        {
            return date.ToString("yyyy-MM-dd HH:mm:ss");
        }

        public static bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        public static string Base64Encode(string plainText)
        {
            var plainTextBytes = System.Text.Encoding.UTF8.GetBytes(plainText);
            return System.Convert.ToBase64String(plainTextBytes);
        }

        public static string Base64Decode(string base64EncodedData)
        {
            var base64EncodedBytes = System.Convert.FromBase64String(base64EncodedData);
            return System.Text.Encoding.UTF8.GetString(base64EncodedBytes);
        }

        public static string Base32Encode(string plainText, string typeOfEncoding = "hex")
        {
            var bytes = System.Text.Encoding.UTF8.GetBytes(plainText);
            string alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUV"; //base32hex
            if(typeOfEncoding != "hex")
                alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; //base32
            string output = "";
            for (int bitIndex = 0; bitIndex < bytes.Length * 8; bitIndex += 5)
            {
                int dualbyte = bytes[bitIndex / 8] << 8;
                if (bitIndex / 8 + 1 < bytes.Length)
                    dualbyte |= bytes[bitIndex / 8 + 1];
                dualbyte = 0x1f & (dualbyte >> (16 - bitIndex % 8 - 5));
                output += alphabet[dualbyte];
            }

            return output;
        }

        public static string Base32Decode(string plainText, string typeOfEncoding = "hex")
        {
            string alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUV"; //base32hex
            if (typeOfEncoding != "hex")
                alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"; //base32
            List<byte> output = new List<byte>();
            char[] bytes = plainText.ToCharArray();
            for (int bitIndex = 0; bitIndex < plainText.Length * 5; bitIndex += 8)
            {
                int dualbyte = alphabet.IndexOf(bytes[bitIndex / 5]) << 10;
                if (bitIndex / 5 + 1 < bytes.Length)
                    dualbyte |= alphabet.IndexOf(bytes[bitIndex / 5 + 1]) << 5;
                if (bitIndex / 5 + 2 < bytes.Length)
                    dualbyte |= alphabet.IndexOf(bytes[bitIndex / 5 + 2]);

                dualbyte = 0xff & (dualbyte >> (15 - bitIndex % 5 - 8));
                output.Add((byte)(dualbyte));
            }
            return System.Text.Encoding.UTF8.GetString(output.ToArray());
        }

        public static string DoubleToSingleCurly(this string text)
        {
            if (text == null)
                return text;
            return text.Replace("{{", "{").Replace("}}", "}");
        }
        public static string EscapeDoubleQuoteHtml(this string text)
        {
            return text.Replace("\"", "&quot;");
        }

        public static string SurroundWith(this string text, string ends)
        {
            return ends + text + ends;
        }

        public static string SurroundWith(this string text, string start, string end)
        {
            return start + text + end;
        }

        public static string SurroundWithDoubleQuotes(this string text)
        {
            return SurroundWith(text, "\"");
        }

        public static string SurrondWithBraces(this string text)
        {
            return SurroundWith(text, "{", "}");
        }
        public static string getUIMessage(string messcode)
        {
            int cultureid = 0;

            if (!SessionHandler.CheckActiveSession()){
                Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
                cultureid = (from e in _context.Magic_Cultures where e.Magic_CultureLanguage == "it-IT" select e.Magic_CultureID).First();
            }
            else
                cultureid = MagicFramework.Helpers.SessionHandler.UserCulture;

            return getUIMessageByCultureId(messcode, cultureid);
        }

        public static string getUIMessageByCultureId(string messcode, int cultureid)
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            var message = (from e in _context.Magic_Messages where e.Magic_Culture_ID == cultureid && e.Magic_MessageCode == messcode select e).FirstOrDefault();
            if (message != null)
                return message.Magic_MessageContent;
            else
                return null;
        }
        /// <summary>
        /// Compress string with GZIP
        /// </summary>
        /// <param name="text"></param>
        /// <returns></returns>
        public static byte[] CompressString(string text)
        {
            byte[] buffer = Encoding.UTF8.GetBytes(text);
            var memoryStream = new MemoryStream();
            using (var gZipStream = new GZipStream(memoryStream, CompressionMode.Compress, true))
            {
                gZipStream.Write(buffer, 0, buffer.Length);
            }

            memoryStream.Position = 0;

            var compressedData = new byte[memoryStream.Length];
            memoryStream.Read(compressedData, 0, compressedData.Length);

            return compressedData;

        }

        public static string version()
        {
            return Assembly.GetExecutingAssembly().GetName().Version.ToString();
        }

        public static string getIncludesVersion()
        {
            return ConfigurationManager.AppSettings["includesVersion"] != null ? "/version" + ConfigurationManager.AppSettings["includesVersion"] : "";
        }

        public static string HeaderReplace(string head)
        {
            string includesVersion = getIncludesVersion();
            string currentVersion = version();
            if (ConfigurationManager.AppSettings["workwithpubliclibrary"] == "true")
            {
                head = head.Replace("/Magic/", ConfigurationManager.AppSettings["puburl"]);
            }
            head = head
                .Replace("Loading...", ConfigurationManager.AppSettings["apptitle"])
                .Replace("/Magic/Styles/", "/Magic/v/" + currentVersion + "/Styles/")
                .Replace("/Magic/Scripts/", "/Magic/v/" + currentVersion + "/Scripts/")
                .Replace(includesVersion, "");//D.T: added in order to manage aspx AutoPostback = true setting in controls (the includesVersion is already in the page) 
            if (SessionHandler.ApplicationInstanceId != "-1")
            {
                MFConfiguration mfc = new MFConfiguration(HttpContext.Current.Request.Url.Authority);
                var allsettings = mfc.appSettings.listOfInstances.Where(x => x.id == SessionHandler.ApplicationInstanceId).FirstOrDefault();
                head = head
                    .Replace("/Custom/" + SessionHandler.CustomFolderName + "/Scripts/", "/Custom/") //D.T: manages autopostback
                    .Replace("/Custom/", "/Custom/" + SessionHandler.CustomFolderName + "/Scripts/");

                string kendoStyle = ApplicationSettingsManager.getKendoStyle();
                if (!String.IsNullOrEmpty(kendoStyle))
                {
                   
                    Regex rgx = new Regex("kendo.((bootstrap)|(uniform)|(default)|(black)|(blueopal)|(flat)|(highcontrast)|(metro)|(metroblack)|(moonlight)|(silver)|(uniform)){1}.min[.]css");
                    head = rgx.Replace(head, "kendo." + kendoStyle + ".min.css");
                    rgx = new Regex("kendo.((bootstrap)|(uniform)|(default)|(black)|(blueopal)|(flat)|(highcontrast)|(metro)|(metroblack)|(moonlight)|(silver)|(uniform)){1}.mobile.min[.]css");
                    head = rgx.Replace(head, "kendo." + kendoStyle + ".mobile.min.css");
                    rgx = new Regex("kendo.dataviz.((bootstrap)|(uniform)|(default)|(black)|(blueopal)|(flat)|(highcontrast)|(metro)|(metroblack)|(moonlight)|(silver)|(uniform)){1}.min[.]css");
                    head = rgx.Replace(head, "kendo.dataviz." + kendoStyle + ".min.css");
                }
                head = mfc.setUpPageEnvironmentVars(allsettings).JSEnvironmentVars + head;
            }
            if(includesVersion != "")
                head = head
                    .Replace("src=\"/", "src=\"" + includesVersion + "/")
                    .Replace("href=\"/", "href=\"" + includesVersion + "/");

            if (!string.IsNullOrEmpty(ServiceWorkerUrlPathPrefix))
            {
                head = AddPrefixToLinks(head, ServiceWorkerUrlPathPrefix);
            }

            return head;
        }

        private static string AddPrefixToLinks(string head, string prefix)
        {
            // Regex pattern to match src and href attributes
            string pattern = "(src|href)=\"(http[s]?://[^/]+)?(/[^\"']*)\"";

            // Using Regex to replace and ensure no double prefix
            return Regex.Replace(head, pattern, match =>
            {
                string protocolAndDomain = match.Groups[2].Value; // Capture group for http(s)://domain
                string path = match.Groups[3].Value; // Capture group for the path

                if (!string.IsNullOrEmpty(protocolAndDomain))
                {
                    // If http(s) is present, add prefix after the domain
                    return $"{match.Groups[1].Value}=\"{protocolAndDomain}/{prefix.TrimStart('/')}{path}\"";
                }
                else
                {
                    // If the link is relative, add prefix at the beginning
                    if (!path.StartsWith(prefix))
                    {
                        return $"{match.Groups[1].Value}=\"{prefix}/{path.TrimStart('/')}\"";
                    }
                }
                return match.Value; // Return original if prefix is already there or for other cases
            });
        }

        /// <summary>
        /// Replaces ref for js and css in head
        /// </summary>
        /// <param name="head">Html id attribute of header tag</param>
        /// <returns></returns>
        public static void ReplaceHeadersRef(HtmlHead head)
        {
            bool publiclib = ConfigurationManager.AppSettings["workwithpubliclibrary"] == "true" ? true : false;
            //path dei js che variano al variare dell' istanza dell' applicazione
            string customrootscripts = "/Custom/".ToLower();
            string customrootscriptsv = "/Custom/{0}/Scripts/".ToLower();
            //librerie Magic
            string includesVersion = ConfigurationManager.AppSettings["includesVersion"] != null ? "/version" + ConfigurationManager.AppSettings["includesVersion"] : "";
            string root = "/Magic/".ToLower();
            string rootstyles = "/Magic/Styles/".ToLower();
            string rootstylesv = "/Magic/v/{0}/Styles/".ToLower();
            string rootscripts = "/Magic/Scripts/".ToLower();
            string rootscriptsv = "/Magic/v/{0}/Scripts/".ToLower();
            string puburl = String.Empty;
            if (publiclib)
                puburl = ConfigurationManager.AppSettings["puburl"].ToLower();
            string appInstanceId = "";
            if (!HttpContext.Current.Request.Url.AbsolutePath.Contains("login") && !HttpContext.Current.Request.Url.AbsolutePath.Contains("register"))
               appInstanceId= SessionHandler.ApplicationInstanceId;
            
            string v = version();

            //DEBUG CON FILELOG
            //System.IO.FileStream wFile;
            //wFile = new FileStream("c:\\temp\\streamtest.txt", FileMode.Append);
            //byte[] byteData = null;


            foreach (Control c in head.Controls)
            {
                

                //TODO: DEBUG CON FILELOG
                //byteData = Encoding.ASCII.GetBytes(c.GetType().ToString() + Environment.NewLine);
                //wFile.Write(byteData, 0, byteData.Length);                               

                if (c.GetType() == typeof(System.Web.UI.HtmlControls.HtmlLink))
                {
                    HtmlLink l = (HtmlLink)c;

                    //TODO: DEBUG CON FILELOG
                    //byteData = Encoding.ASCII.GetBytes("Before: " + l.Href + Environment.NewLine);
                    //wFile.Write(byteData, 0, byteData.Length);         

                    if (publiclib)
                    {
                        if (l.Href.ToLower().Contains(root))
                        {
                            l.Href = l.Href.ToLower().Replace(root, puburl);
                        }
                    }
                    else
                    {
                        l.Href = includesVersion + l.Href;
                    }

                    if (l.Href.ToLower().Contains(rootstyles) )
                    {
                        string toreplace = string.Format(rootstylesv, v);
                        l.Href = l.Href.ToLower().Replace(rootstyles, toreplace);
                    }
                    else if (l.Href.ToLower().Contains(customrootscripts) && appInstanceId!="")
                    {
                        string toreplace = string.Format(customrootscriptsv, appInstanceId);
                        l.Href = l.Href.ToLower().Replace(customrootscripts, toreplace);
                    }

                    if (!string.IsNullOrEmpty(ServiceWorkerUrlPathPrefix))
                    {
                        if (!l.Href.StartsWith(ServiceWorkerUrlPathPrefix))
                        {
                            l.Href = ServiceWorkerUrlPathPrefix + l.Href;
                        }
                    }
                    //TODO: DEBUG CON FILELOG
                    //byteData = Encoding.ASCII.GetBytes("After: " + l.Href + Environment.NewLine);
                    //wFile.Write(byteData, 0, byteData.Length);         

                }
                else if ((c.GetType() == typeof(System.Web.UI.LiteralControl) || (c.GetType().ToString() == "System.Web.UI.ResourceBasedLiteralControl")))
                {
                    LiteralControl l = (LiteralControl)c;

                    //TODO: DEBUG CON FILELOG
                    //byteData = Encoding.ASCII.GetBytes("Before: " + l.Text + Environment.NewLine);
                    //wFile.Write(byteData, 0, byteData.Length);         

                    if (publiclib)
                    {
                        if (l.Text.ToLower().Contains(root))
                        {
                            l.Text = l.Text.ToLower().Replace(root, puburl).ToLower();
                        }
                    }
                    else
                    {
                        l.Text.ToLower().Replace("src=\"", "src=\"" + includesVersion);
                    }

                    if (l.Text.ToLower().Contains(rootscripts))
                    {
                        string toreplace = string.Format(rootscriptsv, v);
                        l.Text = l.Text.ToLower().Replace(rootscripts, toreplace);
                    }
                    else if (l.Text.ToLower().Contains(customrootscripts) && appInstanceId!="")
                    {
                        string toreplace = string.Format(customrootscriptsv, appInstanceId);
                        l.Text = l.Text.ToLower().Replace(customrootscripts, toreplace);
                    }

                    if (!string.IsNullOrEmpty(ServiceWorkerUrlPathPrefix))
                    {
                        if (!l.Text.ToLower().StartsWith(ServiceWorkerUrlPathPrefix))
                        {
                            l.Text.ToLower().Replace("src=\"/", "src=\"" + ServiceWorkerUrlPathPrefix + "/");
                            l.Text.ToLower().Replace("href=\"/", "href=\"" + ServiceWorkerUrlPathPrefix + "/");
                        }
                    }
                    //TODO: DEBUG CON FILELOG
                    //byteData = Encoding.ASCII.GetBytes("After: " + l.Text + Environment.NewLine);
                    //wFile.Write(byteData, 0, byteData.Length);         

                }
                else if (c.GetType() == typeof(System.Web.UI.HtmlControls.HtmlTitle))
                {
                    string title = ConfigurationManager.AppSettings["apptitle"];
                    if (!String.IsNullOrEmpty(title))
                    {
                        ((HtmlTitle)c).Text = title;
                    }
                }
                else if (c is HtmlGenericControl)
                {
                    HtmlGenericControl genericControl = c as HtmlGenericControl;
                    if (genericControl.TagName.ToLower() == "script")
                    {
                        string src = genericControl.Attributes["src"];
                        if (!string.IsNullOrEmpty(src) && src.StartsWith("/"))
                        {
                            if (!src.StartsWith(ServiceWorkerUrlPathPrefix))
                            {
                                src = ServiceWorkerUrlPathPrefix + src;
                                genericControl.Attributes["src"] = src;
                            }
                        }
                    }
                }
            }

            //TODO: DEBUG CON FILELOG
            //wFile.Close();
        }

        public static HttpResponseMessage retWarning(string content)
        {
            HttpResponseMessage r = new HttpResponseMessage();
            r.StatusCode = HttpStatusCode.OK;

            dynamic msg = new ExpandoObject();
            msg.msgtype = "WARN";
            msg.message = content;
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(msg);
            r.Content = new StringContent(json);
            return r;
        }

        public static HttpResponseMessage retInternalServerError(string content, string errorMsgToReturn = null)
        {
            if (String.IsNullOrEmpty(errorMsgToReturn))
                return ResponseMessage(content, HttpStatusCode.InternalServerError);
            MFLog.LogInFile(content, MFLog.logtypes.ERROR);
            return ResponseMessage(errorMsgToReturn, HttpStatusCode.InternalServerError);
        }


        public static HttpResponseMessage ResponseMessage(string content, HttpStatusCode statusCode, bool isJson = false)
        {
            HttpResponseMessage r = new HttpResponseMessage();
            r.StatusCode = statusCode;
            r.Content = new StringContent(content);
            if (isJson)
                r.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");
            return r;
        }

        public static HttpResponseMessage retOkMessage()
        {
            HttpResponseMessage r = new HttpResponseMessage();
            r.StatusCode = HttpStatusCode.OK;
            r.Content = new StringContent("{\"message\": \"ok\"}");
            return r;
        }

        public static HttpResponseMessage retOkMessage(string content)
        {
            HttpResponseMessage r = new HttpResponseMessage();
            r.StatusCode = HttpStatusCode.OK;
            r.Content = new StringContent(content);
            return r;
        }

        public static HttpResponseMessage retOkJSONMessage(string content)
        {
            HttpResponseMessage r = new HttpResponseMessage();
            r.StatusCode = HttpStatusCode.OK;
            r.Content = new StringContent("{\"message\": \"" + content + "\"}");
            return r;
        }

        public static HttpResponseMessage GetErrorMessageForDownload(string message)
        {
            string r = string.Format("<html><body>{0}</body></html>", HttpUtility.HtmlEncode(message));
            var response = new HttpResponseMessage();
            response.Content = new StringContent(r);
            response.Content.Headers.ContentType = new MediaTypeHeaderValue("text/html");
            response.StatusCode = HttpStatusCode.InternalServerError;
            return response;
        }

        public static string FirstCharToUpper(string input)
        {
            if (String.IsNullOrEmpty(input))
                throw new ArgumentException("MANCANTE!");
            return input.First().ToString().ToUpper() + input.Substring(1).ToLower();
        }

        public static string ReplaceTags(string text, Dictionary<string, string> tags, string tagOpening = "#", string tagClosing = "#", Func<Match, string> customizedCheckMethod = null)
        {
            TagReplacer tr = new TagReplacer(text, tags, tagOpening, tagClosing, customizedCheckMethod);
            return tr.Replace();
        }

        private class TagReplacer
        {
            private string text;
            private Dictionary<string, string> tags;
            private Regex r;
            private Func<Match, string> CustomizedCheckMethod;

            public TagReplacer(string text, Dictionary<string, string> tags, string tagOpening = "#", string tagClosing = "#", Func<Match, string> customizedCheckMethod = null)
            {
                string firstCloseChar = tagClosing[0].ToString();
                tagOpening = Regex.Escape(tagOpening);
                tagClosing = Regex.Escape(tagClosing);
                this.text = text;
                this.tags = tags;
                this.CustomizedCheckMethod = customizedCheckMethod;
                r = new Regex(tagOpening+"(?<name>[^"+ firstCloseChar+"]+)"+tagClosing);
            }

            public string Replace()
            {
                MatchEvaluator ev;
                ev = new MatchEvaluator(this.CustomizedCheckMethod ?? this.CheckMatch);
                return this.r.Replace(this.text, ev);
            }

            private string CheckMatch(Match m)
            {
                if (this.tags.ContainsKey(m.Groups["name"].Value))
                    return this.tags[m.Groups["name"].Value];
                else
                    return "";
            }
        }
        /// <summary>
        /// returns the root path for Files in file system according to the configuration settings
        /// </summary>
        /// <returns></returns>
        public static string retRootPathForFiles()
        {
            return  MagicFramework.Helpers.Utils.retcompletepath(ApplicationSettingsManager.GetRootdirforupload() ?? HttpContext.Current.Server.MapPath("~"));
        }
        public static string retcompletepath(string root)
        {
            // se è risorsa condivisa o cartella locale non parto dalla root del sito
            if ((root.StartsWith("\\")) || (root.Contains(":")))
            {
                try
                {
                    Directory.CreateDirectory(root);
                }
                catch (Exception e)
                {
                    return "";
                }
            }
            else
            {
                root = Path.Combine(HttpContext.Current.Server.MapPath("~"), root);
            }
            return root;
        }

        public static string CleanFileName(string fileName)
        {            
            return Path.GetInvalidFileNameChars().Aggregate(fileName, (current, c) => current.Replace(c.ToString(), string.Empty)).Replace(' ','_');
        }

        public static string DateimeForFileName() 
        {
            return DateTime.Now.ToString("yyyyMMddHHmmss");
        }

        public static System.Xml.XmlDocument ConvertDynamicToXML(dynamic data)
        { 
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(data); 
            var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);
            return xml;
        }

        public static System.Xml.XmlDocument ObjectToXml(object data)
        {
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(data);
            return Newtonsoft.Json.JsonConvert.DeserializeXmlNode(json);
        }

        public static string GetBasePath()
        {
            return System.AppDomain.CurrentDomain.BaseDirectory;
        }

        public static string ReturnFirstFileThatExists(params string[] paths)
        {
            foreach(string path in paths)
            {
                if (File.Exists(path))
                    return File.ReadAllText(path);
            }
            return null;
        }

        public static string GetMimeType(string fileName)
        {
            string mimeType = "application/unknown";
            string ext = System.IO.Path.GetExtension(fileName).ToLower();
            Microsoft.Win32.RegistryKey regKey = Microsoft.Win32.Registry.ClassesRoot.OpenSubKey(ext);
            if (regKey != null && regKey.GetValue("Content Type") != null)
                mimeType = regKey.GetValue("Content Type").ToString();
            return mimeType;
        }

        public static string GetNullForEmptyString(string s)
        {
            return String.IsNullOrEmpty(s) ? null : s;
        }

        public static string dehunzi(string JS)
        {
            Regex unquotedKeys = new Regex(@"(({|\[|,)\s*)([\$\w]+)\s*:");
            Regex JSfunctions = new Regex(@":\s*(function[\s]*.*?)(,\s*""|}\s*})");
            Regex singleQuotations = new Regex(@"(({|\[|,|:)\s*)'([^']+)'(\s*(?!$2)(}|\]|,|:))");
            Regex unquotedValues = new Regex(@"""\s*:\s?([\w][^,}]*)");
            JS = unquotedKeys.Replace(JS, AddQuotes);
            JS = JSfunctions.Replace(JS, WrapJSFunctionsForJSON);
            JS = singleQuotations.Replace(JS, ReplaceSingleQuatations);
            return unquotedValues.Replace(JS, SurroundUnquotedJSONValues);
        }

        static string WrapJSFunctionsForJSON(Match m)
        {
            return ": \"function##" + m.Groups[1].Value.Replace("\"", "'") + "\"" + m.Groups[2].Value;
        }

        static string AddQuotes(Match m)
        {
            return m.Groups[1].Value + "\"" + m.Groups[3].Value + "\":";
        }

        static string SurroundUnquotedJSONValues(Match m)
        {
            string value = m.Groups[1].Value;
            int intValue;
            if (value != "false" && value != "true" && value != "null" && !int.TryParse(value, out intValue))
            {
                value = "\"function##" + value + "\"";
            }
            return "\": " + value;
        }

        static string ReplaceSingleQuatations(Match m)
        {
            return m.Groups[1].Value + "\"" + m.Groups[3].Value.Replace("\"", "'") + "\"" + m.Groups[4].Value;
        }

        public static string derhunzi(string JSON)
        {
            Regex escapedFunctionValues = new Regex(@"""function##([^""]+)""");
            return escapedFunctionValues.Replace(JSON, ReplaceFunctionEscape);
        }

        static string ReplaceFunctionEscape(Match m)
        {
            return m.Groups[1].Value.Replace("\\r", "").Replace("\\n", "");
        }

        public static JObject NewtonsoftRecursiveMerge(JObject origin, JObject overwrite)
        {
            if (origin == null)
            {
                origin = overwrite;
                return origin;
            }
            else if (overwrite == null)
            {
                return origin;
            }
            foreach(var token in overwrite)
            {
                if (origin[token.Key] != null)
                {
                    if (origin[token.Key].GetType().Name == token.Value.GetType().Name)
                    {
                        if (origin[token.Key].GetType().Name == "JArray")
                        {
                            NewtonsoftRecursiveMerge((JArray)origin[token.Key], (JArray)token.Value);
                            continue;
                        }
                        else if (origin[token.Key].GetType().Name == "JObject")
                        {
                            NewtonsoftRecursiveMerge((JObject)origin[token.Key], (JObject)token.Value);
                            continue;
                        }
                    }
                }
                origin[token.Key] = token.Value;
            }
            return origin;
        }

        public static JArray NewtonsoftRecursiveMerge(JArray origin, JArray overwrite)
        {
            if (origin == null)
            {
                origin = overwrite;
                return origin;
            }
            else if (overwrite == null)
            {
                return origin;
            }
            int index = -1;
            foreach(JToken token in overwrite)
            {
                index++;
                if (index >= origin.Count)
                    origin.Add(token);
                else
                {
                    if (origin[index].GetType().Name == token.GetType().Name)
                    {
                        if (origin[index].GetType().Name == "JArray")
                        {
                            NewtonsoftRecursiveMerge((JArray)origin[index], (JArray)token);
                            continue;
                        }
                        else if (origin[index].GetType().Name == "JObject")
                        {
                            NewtonsoftRecursiveMerge((JObject)origin[index], (JObject)token);
                            continue;
                        }
                    }
                }
                origin[index] = token;
            }
            return origin;
        }

        public static byte[] ToByteArray(Stream input)
        {
            using (MemoryStream ms = new MemoryStream())
            {
                input.CopyTo(ms);
                return ms.ToArray();
            }
        }

        private static Regex EscapeHTMLRegex = new Regex("<|>");
        public static string EscapeHTML(string html)
        {
            return EscapeHTMLRegex.Replace(html, (Match m) => {
                if (m.Value.Equals("<")) {
                    return "&lt";
                }
                else
                {
                    return "&gt";
                }
            });
        }

        public static JObject EscapeHTML(JObject jsonObject)
        {
            foreach (KeyValuePair<string, JToken> element in jsonObject)
            {
                if (element.Value.Type == JTokenType.String)
                {
                    jsonObject[element.Key] = EscapeHTML((string)element.Value);
                }
            }
            return jsonObject;
        }

    }
}

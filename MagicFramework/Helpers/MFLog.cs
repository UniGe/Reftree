using Newtonsoft.Json.Linq;
using System;
using System.Configuration;
using System.IO;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using System.Globalization;
using System.Collections.Generic;
using System.Diagnostics;
using System.Web.Http.Results;

namespace MagicFramework.Helpers
{
    public enum Level
    {
        Test = 0,
        Debug = 1,
        Information = 2,
        Notice = 3,
        Warning = 4,
        Suspect = 5,
        Error = 6,
        Critical = 7,
        Alert = 8,
        Emergency = 9,
        Crash = 10
    }

    internal class CEFParser
    {
        private string _version { get; set; }
        private string _host { get; set; }
        private string _vendor { get; set; }
        private string _product { get; set; }
        private string _signatureID { get; set; }
        private string _text { get; set; }
        private int _severity { get; set; }
        private string _userName { get; set; }
        private string _sourceIp { get; set; }
        private List<CEFField> _fields { get; set; }

        public CEFParser(
            string Version,
            string Host,
            string Vendor,
            string Product,
            string SignatureId,
            string Text,
            int Severity,
            string Username,
            string SourceIp,
            List<CEFField> Fields)
        {
            _version = Version;
            _host = Host;
            _vendor = Vendor;
            _product = Product;
            _signatureID = SignatureId;
            _text = Text;
            _severity = Severity;
            _userName = Username;
            _sourceIp = SourceIp;
            _fields = Fields;
        }

        public CEFParser(string action,string text, MFLog.logtypes logType,string sessionInfo) {
            this._version = ConfigurationManager.AppSettings["includesVersion"];
            try
            {
                this._host = HttpContext.Current.Request.Url.GetLeftPart(UriPartial.Authority);
            }
            catch (Exception ex) {
                Debug.WriteLine(ex.Message);
                this._host = "N.A";
            }
            this._vendor = "IDEARE";
            this._product = "RefTree";
            this._signatureID = action;
            this._severity = (int)GetSeverityFromMFLog(logType);
            this._text = text;
            try
            {
                this._userName = SessionHandler.Username;
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
                this._userName = "N.A";
            }

            try
            {
                this._sourceIp = GetIPAddress();
            }
            catch (Exception ex) {
                Debug.WriteLine(ex.Message);
                this._sourceIp = "127.0.0.1";
            }


            Dictionary<string, string> sessionDict = new Dictionary<string, string>();
            try
            {
                sessionDict = Newtonsoft.Json.JsonConvert.DeserializeObject<Dictionary<string, string>>(String.IsNullOrEmpty(sessionInfo) ? $"{{ Username: \"{ this._userName }\"}}" : sessionInfo);
            }
            catch (Exception ex) {
                Debug.WriteLine(ex.Message);
            }
            List<CEFField> cefFileds = new List<CEFField>();
            foreach (var prop in sessionDict.Keys) {
                Field ff = new Field();
                ff.FieldName = prop;
                ff.FieldValue = sessionDict[prop];
                CEFField f = new CEFField(this._vendor, this._product, cefFileds.Count + 1, ff);
                cefFileds.Add(f);
            }
            this._fields = cefFileds;
        }
        private string GetIPAddress()
        {
            System.Web.HttpContext context = System.Web.HttpContext.Current;
            string ipAddress = context.Request.ServerVariables["HTTP_X_FORWARDED_FOR"];

            if (!string.IsNullOrEmpty(ipAddress))
            {
                string[] addresses = ipAddress.Split(',');
                if (addresses.Length != 0)
                {
                    return addresses[0];
                }
            }

            return context.Request.ServerVariables["REMOTE_ADDR"];
        }
        private Level GetSeverityFromMFLog(MFLog.logtypes logType) {
            Level severity = Level.Information;
            switch (logType) {
                case MFLog.logtypes.DEBUG:
                    severity = Level.Debug;
                    break;
                case MFLog.logtypes.ERROR:
                    severity = Level.Error;
                    break;
                case MFLog.logtypes.WARN:
                    severity = Level.Warning;
                    break;
                default:
                    severity = Level.Debug;
                    break;
            }
            return severity;
        }
        public string Header
        {
            get
            {
                string formattedDate = DateTime.Now.ToString
                ("MMM dd HH:mm:ss", CultureInfo.CreateSpecificCulture("en-GB"));

                return System.String.Format("{0} {1}",
                                            formattedDate,
                                            _host);
            }
        }

        public string Message
        {
            get
            {
                string ret = "CEF:0|" +
                    _vendor + "|" +
                    _product + "|" +
                    _version + "|" +
                    _signatureID + "|" +
                    _text + "|" +
                    _severity.ToString() + "|" +
                    "src=" + _sourceIp + " " +
                    "suser=" + _userName;

                foreach (CEFField item in _fields)
                {
                    ret += " " + item.Key + "=" + item.Value;
                }

                ret += Environment.NewLine;

                return ret;
            }
        }

        public string CEFMessage
        {
            get
            {
                return Header + " " + Message;
            }
        }
    }

    public class Field
    {
        public string FieldName { get; set; }
        public string FieldValue { get; set; }
    }

    internal class CEFField
    {
        private string _id;
        private Field _field;
        private string _vendor;
        private string _product;

        public CEFField(string Vendor, string Product, int Id, Field Field)
        {
            _vendor = Vendor;
            _product = Product;
            _id = Id.ToString().PadLeft(4, '0');
            _field = Field;
        }

        public string Key
        {
            get
            {
                return _vendor + _product + _id + _field.FieldName;
            }
        }

        public string Value
        {
            get
            {
                return getNormalizeCEFMessage(_field.FieldValue);
            }
        }

        private string getNormalizeCEFMessage(string message)
        {
            string ret = message.Replace("|", "\\|");

            ret = ret.Replace("\\", "\\\\");
            ret = ret.Replace("=", "\\=");

            return ret;
        }
    }


    public static class MFLog
    {

        private const int MaxChangePasswordTentativesPerHour = 5;
        public enum logtypes
        {
            ERROR,
            WARN,
            INFO,
            DEBUG
        }
        public enum dblogevents
        {
            USERACCESSOK,
            USERACCESSKO,
            USERLOGOUT,
            REQUESTEDFUNCTION,
            CHGPWD_WRONGMAIL,
            CHGPWD_TENTATIVE,
            UPDACC_TENTATIVE
        }
        public static string filename = "APPlog.txt";
        public static string cefFilename = "CEF_APPlog.cef";
        public static string logdirectory = ConfigurationManager.AppSettings["logpath"]; //file di log della soluzione "MagicSolution" da web.config
        public static string cefLogdirectory = ConfigurationManager.AppSettings["ceflogpath"]; //log cef , se il setting è nullo vuol dire che non va prodotto
        static object synch = new Object();

        private static string GetDocumentContents(HttpRequestBase Request)
        {
            string documentContents = null;

            using (Stream receiveStream = Request.InputStream)
            {
                using (StreamReader readStream = new StreamReader(receiveStream, Request.ContentEncoding))
                {
                    documentContents = readStream.ReadToEnd();
                }
            }

            return documentContents;
        }

        public static void LogInDebugFile(string text)
        {
            string filePath = @"C:\TEMP\debug_test";
            Directory.CreateDirectory(filePath);
            filePath = Path.Combine(filePath, "debug.txt");
            File.AppendAllText(filePath, DateTime.Now.ToString() + " - " + text + Environment.NewLine);
        }

        public static void LogInFile(string msg, logtypes type, string altFileName = "", string outerThreadDir = null)
        {
            //se sono in un momento successivo alla login scrivo nel file di log dedicato alla specifica applicazione istanziata

            string sessionInfo = null;
            string urlInfo = null;
            string requestBody = null;
            string requestForm = null;
            //if outerThredDir is specified i use that , otherwise i will use the instance directorylog. If i'm out of session and and outerThreaddir is not specified i scale on the web.config directory log 
            string directoryToLog = outerThreadDir ?? logdirectory;
  
            try
            {
                if (String.IsNullOrEmpty(outerThreadDir))
                    directoryToLog = ApplicationSettingsManager.GetDirectoryForLog();
            }
            catch { };

            try
            {
                sessionInfo = MagicFramework.Helpers.SessionHandler.ToJson();
            }
            catch
            {
                sessionInfo = "Error retrieving session info";
            }

            try
            {
                urlInfo = "(" + HttpContext.Current.Request.ServerVariables["SERVER_PROTOCOL"] + ") " + HttpContext.Current.Request.HttpMethod + " " + HttpContext.Current.Request.RawUrl;
            }
            catch
            {
                urlInfo = "Error retrieving url info";
            }

            try
            {
                requestBody = MFLog.GetDocumentContents(new HttpRequestWrapper(HttpContext.Current.Request));
            }
            catch
            {
                requestBody = "Error retrieving request body";
            }

            try
            {
                string[] keys = HttpContext.Current.Request.Form.AllKeys;
                requestForm = "";
                for (int i = 0; i < keys.Length; i++)
                {
                    if (requestForm != "")
                        requestForm = requestForm + ",";
                    requestForm = requestForm + "\"" + keys[i] + "\"" + "=" + "\"" + HttpContext.Current.Request.Form[keys[i]] + "\"";
                }
            }
            catch
            {
                requestForm = "Error retrieving request form";
            }



            string completeMessage = Environment.NewLine + "\tMessage: " + msg + Environment.NewLine;

            if (sessionInfo != "")
                completeMessage = completeMessage + "\tSession: " + sessionInfo + Environment.NewLine;
            if (urlInfo != "")
                completeMessage = completeMessage + "\tUrl: " + urlInfo + Environment.NewLine;
            if (requestBody != "")
                completeMessage = completeMessage + "\tInputStream: " + requestBody + Environment.NewLine;
            if (requestForm != "")
                completeMessage = completeMessage + "\tFormData: " + requestForm + Environment.NewLine;

            Directory.CreateDirectory(directoryToLog);

            if (String.IsNullOrEmpty(altFileName))
                altFileName = filename;

            //Creo un file per giorno
            DateTime d = DateTime.Today;

            string usedFileName =
                Path.GetFileNameWithoutExtension(altFileName) +
                '_' + d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) +
                Path.GetExtension(altFileName);

            lock (synch) //avoids concurrent writes 
            {
                if (type == logtypes.DEBUG)
                {
#if DEBUG
                    File.AppendAllText(Path.Combine(directoryToLog, Path.GetFileName(usedFileName)), DateTime.Now.ToString() + " - " + type.ToString() + " - " + completeMessage);
                    //if (!String.IsNullOrEmpty(cefLogdirectory))
                    //    LogInCefFormat(urlInfo, msg, type, sessionInfo);         
#endif                  
                }
                else
                {
                    File.AppendAllText(Path.Combine(directoryToLog, Path.GetFileName(usedFileName)), DateTime.Now.ToString() + " - " + type.ToString() + " - " + completeMessage);
                    //if (!String.IsNullOrEmpty(cefLogdirectory))
                    //    LogInCefFormat(urlInfo, msg, type, sessionInfo);
                }
            }
        }
        private static void LogInCefFormat(string action, string text, MFLog.logtypes type, string filedsJson) {
            if (String.IsNullOrEmpty(cefLogdirectory))
                return;
            CEFParser cp = new CEFParser(action, text, type, filedsJson);
            Directory.CreateDirectory(cefLogdirectory);
            DateTime d = DateTime.Today;
            string usedFileName =
               Path.GetFileNameWithoutExtension(cefFilename) +
               '_' + d.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) +
               Path.GetExtension(cefFilename);
            File.AppendAllText(Path.Combine(cefLogdirectory, usedFileName), cp.CEFMessage);
        }
        public static void LogInFile(Exception e, logtypes type = logtypes.ERROR, string fileName = "")
        {
            try
            {
                LogInFile(GetJOjbectFromException(e).ToString(), type, fileName);
            }
            catch (Exception ex)
            {
                LogInFile("MFLog@LogInFile: " + ex.Message + " Error while logging error: " + e.ToString(), logtypes.ERROR);
            }
        }

        public static JObject GetJOjbectFromException(Exception e)
        {
            JObject exception = new JObject();
            if (!String.IsNullOrEmpty(e.StackTrace))
            {
                exception["errorAt"] = e.StackTrace.ToString();
            }
            else
            {
                exception["errorAt"] = DateTime.UtcNow.ToString();
            }
            exception["message"] = e.Message;
            if (e.InnerException != null)
                exception["innerException"] = GetJOjbectFromException(e.InnerException);
            return exception;
        }

        public static void LogToDatabase(dblogevents logevent, string logmessage, string originIP)
        {
            JObject obj = JObject.FromObject(new
            {
                SQLP = new
                {
                    SESSIONVARS = new { iduser = SessionHandler.IdUser, idbusinessunit = SessionHandler.UserVisibilityGroup },
                    P = new { logevent = logevent.ToString(), logmessage = logmessage, originIP = originIP }
                }

            });
            var dbutils = new DatabaseCommandUtils();
            SqlParameter p = new SqlParameter("xmlInput", SqlDbType.Xml);
            p.Value = Newtonsoft.Json.JsonConvert.DeserializeXmlNode(obj.ToString()).InnerXml;
            p.Direction = ParameterDirection.Input;
            dbutils.ExecuteStoredProcedureNonQueryAsync("dbo.Magic_AppActivityTracking", new SqlParameter[] { p });
            lock (synch) //avoids concurrent writes 
            {
                LogInCefFormat(logevent.ToString(), logmessage, MFLog.logtypes.INFO, SessionHandler.ToJson());
            }

        }
        private static bool CheckRecoveryMailCallLimit(string email)
        {

            var dbutils = new DatabaseCommandUtils();
          
            var ds = dbutils.GetDataSet($@"SELECT * FROM dbo.Magic_AppLog 
            where LogEvent= '{dblogevents.CHGPWD_TENTATIVE.ToString()}'  
            and Logdata = '{email}' 
            and DATEPART(HOUR, LogDate) = DATEPART(HOUR, GETDATE()) and CAST(LogDate as date ) = CAST(getdate() as date)");

            if (ds.Tables[0].Rows.Count >= MaxChangePasswordTentativesPerHour)
                return false;
            
            return true;
            // Proceed with the desired action of the method since the call limit has not been exceeded
        }
        private static bool CheckUpdateAccountCallLimit(int userId)
        {

            var dbutils = new DatabaseCommandUtils();

            var ds = dbutils.GetDataSet($@"SELECT * FROM dbo.Magic_AppLog 
            where LogEvent= '{dblogevents.UPDACC_TENTATIVE.ToString()}'  
            and Logdata = '{userId}' 
            and DATEPART(HOUR, LogDate) = DATEPART(HOUR, GETDATE()) and CAST(LogDate as date ) = CAST(getdate() as date)");

            if (ds.Tables[0].Rows.Count >= MaxChangePasswordTentativesPerHour)
                return false;

            return true;
            // Proceed with the desired action of the method since the call limit has not been exceeded
        }
        /// <summary>
        /// controls if the change password for the given mail has been requested more than 5 times in current hour. If it the limit is crossed it return false
        /// </summary>
        /// <param name="usernameOrEmail">the mail requesting password change</param>
        /// <param name="originIP">the ip for tracking purposes</param>
        /// <returns>false if the limit is crossed</returns>
        public static bool LogChangePasswordAttemptToDataBase(string usernameOrEmail,string originIP)
        {
            bool canDoIt  = CheckRecoveryMailCallLimit(usernameOrEmail);
            if (canDoIt) 
                LogToDatabase(dblogevents.CHGPWD_TENTATIVE, usernameOrEmail, originIP);
            return canDoIt;
            
        }
        public static bool LogUpdateAccountAttemptToDataBase(int userId, string originIP)
        {
            bool canDoIt = CheckUpdateAccountCallLimit(userId);
            if (canDoIt)
                LogToDatabase(dblogevents.UPDACC_TENTATIVE, userId.ToString(), originIP);
            return canDoIt;

        }

    }
}
using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Web;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


namespace MagicFramework.Jobs.SMSProviders
{
    public class SMS
    {
        internal string url { get; set; }
        internal string username  { get; set; }
        internal string password { get; set; }
        internal string[] recipients { get; set; }
        internal string text { get; set; }
        internal string sender_number { get; set; }
        internal string sender_string { get; set; }
        internal string user_reference { get; set; }
        internal string charset { get; set; }
        public SMS(string username,string password,string[] recipients,string messagedata,string charset,string url) {
            this.recipients = recipients;
            this.password = password;
            this.text = messagedata;
            this.username = username;
            this.charset = charset;
            this.url = url;
        }
        public  bool ValidateJSON(string s)
        {
            try
            {
                JToken.Parse(s);
                return true;
            }
            catch (JsonReaderException ex)
            {
                return false;
            }
        }
    }
    
    public class SkebbySMS : SMS
    {
        //public const string SMS_TYPE_CLASSIC = "classic";
        //public const string SMS_TYPE_CLASSIC_PLUS = "classic_plus";
        //public const string SMS_TYPE_BASIC = "basic";
        //public const string SMS_TYPE_TEST_CLASSIC = "test_classic";
        //public const string SMS_TYPE_TEST_CLASSIC_PLUS = "test_classic_plus";
        //public const string SMS_TYPE_TEST_BASIC = "test_basic";

        public string sms_type { get; set; }

        public  Hashtable skebbyGatewaySendSMS()
        {
            String result = "";
            String[] results, temp;
            String parameters = "";
            String method = "send_sms_classic";
            int i = 0;
            StreamWriter myWriter = null;
            HttpWebRequest objRequest = (HttpWebRequest)WebRequest.Create(url);
            objRequest.ServicePoint.Expect100Continue = false;

            Hashtable r = new Hashtable();

            if (!String.IsNullOrEmpty(this.sms_type))
                method = this.sms_type;
            //switch (this.sms_type)
            //{
            //    case SMS_TYPE_CLASSIC:
            //        method = "send_sms_classic";
            //        break;
            //    case SMS_TYPE_CLASSIC_PLUS:
            //        method = "send_sms_classic_report";
            //        break;
            //    case SMS_TYPE_BASIC:
            //        method = "send_sms_basic";
            //        break;
            //    case SMS_TYPE_TEST_CLASSIC:
            //        method = "test_send_sms_classic";
            //        break;
            //    case SMS_TYPE_TEST_CLASSIC_PLUS:
            //        method = "test_send_sms_classic_report";
            //        break;
            //    case SMS_TYPE_TEST_BASIC:
            //        method = "test_send_sms_basic";
            //        break;
            //    default:
            //        method = "send_sms_classic";
            //        break;
            //}

            parameters = "method=" + HttpUtility.UrlEncode(method) + "&"
                         + "username=" + HttpUtility.UrlEncode(username) + "&password=" + HttpUtility.UrlEncode(password) + "&"
                         + "text=" + HttpUtility.UrlEncode(text) + "&"
                         + "recipients[]=" + string.Join("&recipients[]=", recipients);

            if (!String.IsNullOrEmpty(sender_number) && !String.IsNullOrEmpty(sender_string))
            {
                r.Add("status", "failed");
                r.Add("code", "0");
                r.Add("message", "You can specify only one type of sender, numeric or alphanumeric");
                return r;
            }

            parameters += !String.IsNullOrEmpty(sender_number)  ? "&sender_number=" + HttpUtility.UrlEncode(sender_number) : "";
            parameters += !String.IsNullOrEmpty(sender_string)  ? "&sender_string=" + HttpUtility.UrlEncode(sender_string) : "";

            parameters += !String.IsNullOrEmpty(user_reference) ? "&user_reference=" + HttpUtility.UrlEncode(user_reference) : "";

            switch (charset)
            {
                case "UTF-8":
                    parameters += "&charset=" + HttpUtility.UrlEncode("UTF-8");
                    break;
                default:
                    break;
            }

            objRequest.Method = "POST";
            objRequest.ContentLength = Encoding.UTF8.GetByteCount(parameters);
            objRequest.ContentType = "application/x-www-form-urlencoded";
            HttpWebResponse objResponse;
            try
            {
                myWriter = new StreamWriter(objRequest.GetRequestStream());
                myWriter.Write(parameters);
            }
            catch (Exception e)
            {
                Debug.WriteLine(e.Message);
            }
            finally
            {
                myWriter.Close();
            }
            try
            {
                objResponse = (HttpWebResponse)objRequest.GetResponse();
            }
            catch (WebException e)
            {
                r.Add("status", "failed");
                r.Add("code", "0");
                r.Add("message", "Network error, unable to send the message:"+e.Message);
                return r;
            }
            using (StreamReader sr = new StreamReader(objResponse.GetResponseStream()))
            {
                result = sr.ReadToEnd();
                // Close and clean up the StreamReader
                sr.Close();
            }
            results = result.Split('&');
            for (i = 0; i < results.Length; i++)
            {
                temp = results[i].Split('=');
                r.Add(temp[0], temp[1]);
            }
            return r;
        }
        public SkebbySMS(string username, string password, string[] recipients, string messagedata, string charset,string url)
            : base(username, password, recipients, messagedata, charset,url)
        {
            if (this.ValidateJSON(messagedata))
            {
                dynamic data = Newtonsoft.Json.JsonConvert.DeserializeObject(messagedata);
                this.sms_type = data.sms_type;
                this.sender_number = data.sender_number;
                this.sender_string = data.sender_string;
                this.text = data.text;
                this.user_reference = data.user_reference;
            }
            else
                this.text = messagedata;
        }

        
    }
}
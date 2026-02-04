using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Net.Http;
using System.Data;
using System.Xml;
using MagicFramework.Helpers;
using MagicFramework.Models;
using MagicFramework.MemberShip;
using MagicFramework.MemberShip.Filters;

namespace MagicFramework.Controllers
{
    public class ReturnFKitem
    {
        public string value { get; set; }
        public string text  { get; set; }
        public string MagicBOLayer_ID { get; set; }

        public ReturnFKitem(string value, string text, string layerid)
        {
            this.value = value;
            this.text = text;
            this.MagicBOLayer_ID = layerid;
        }
    }

    public class ManageFKController : ApiController
    {

        [FKSystemObjectFilter]
        [HttpPost]
        public List<ReturnFKitem> GetDropdownValues(dynamic data)
        {
            try
            {
                string tablename = data["tablename"].ToString();

                bool isreserved = DBConnectionManager.IsCredentialInfo(tablename);
                if (isreserved == true)
                {
                    //asks the database if the user is authorized to browse credential infos. Default enabled users are developer and admin profiles.
                    SystemRightsChecker.checkSystemRights("selectCredentials");
                }

                string valuefield = data["valuefield"].ToString();
                string textfield = data["textfield"].ToString();
                string schema = data["schema"];
                if (string.IsNullOrEmpty(schema))
                    schema = DatabaseCommandUtils.DEFAULT_DB_SCHEMA;

                string cascadefilter = String.Empty;


                if (data["filter"] != null)
                {
                    dynamic filterdata = data.filter;
                    Models.Request req = new Models.Request();
                    req.filter = new Filters(filterdata);
                    RequestParser rp = new RequestParser(req);

                    cascadefilter = rp.BuildWhereCondition(true);
                }


                string ugvifieldname = ApplicationSettingsManager.GetVisibilityField();
                int ug = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
                int user = MagicFramework.Helpers.SessionHandler.IdUser;
                string json;

                if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
                {
                    json = "{\"ugvifieldname\":\"" + ugvifieldname + "\",\"userid\":" + user.ToString() + ",\"tablename\":\"" + RequestParser.GetField(tablename) + "\",\"ug\":" + ug.ToString() + ",\"valuefield\":\"" + RequestParser.GetField(valuefield) + "\",\"textfield\":\"" + RequestParser.GetField(textfield) + "\",\"filter\":\"" + cascadefilter + "\"}";
                }
                else
                {
                    json = "{\"ugvifieldname\":\"" + ugvifieldname + "\",\"userid\":" + user.ToString() + ",\"tablename\":\"" + tablename + "\",\"ug\":" + ug.ToString() + ",\"valuefield\":\"" + valuefield + "\",\"textfield\":\"" + textfield + "\",\"filter\":\"" + cascadefilter + "\"}";
                }

                XmlDocument xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);

                var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils(schema + "." + tablename);
                var dbres = dbhandler.callStoredProcedurewithXMLInput(xml, "dbo.Magic_GetDropdownValues");

                var result = dbres.table.AsEnumerable().ToList();

                var occurences = new List<ReturnFKitem>();
                foreach (var item in result)
                {
                    ReturnFKitem itemtoadd = new ReturnFKitem(item[0].ToString(), item[1].ToString(), null);
                    occurences.Add(itemtoadd);
                }

                return occurences;
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex);
                throw new ArgumentException("An error has occured");
            }
        }

        [FKSystemObjectFilter]
        [HttpPost]
        public List<ReturnFKitem> GetCascadeDropdownValues(dynamic data)
        {
            try
            {
                string tablename = data["tablename"].ToString();
                bool isreserved = DBConnectionManager.IsCredentialInfo(tablename);
                if (isreserved == true)
                {
                    //asks the database if the user is authorized to browse credential infos. Default enabled users are developer and admin profiles.
                    SystemRightsChecker.checkSystemRights("selectCredentials");
                }
                string valuefield = data["valuefield"].ToString();
                string textfield = data["textfield"].ToString();
                string ugvifieldname = ApplicationSettingsManager.GetVisibilityField();//ConfigurationManager.AppSettings["groupVisibilityField"];
                int ug = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
                string schema = data["schema"];
                if (string.IsNullOrEmpty(schema))
                    schema = DatabaseCommandUtils.DEFAULT_DB_SCHEMA;

                //cascade1 e' obbligatorio
                string cascade1 = data["cascade1"].ToString();
                string cascade1val = data["cascade1val"].ToString();

                string cascade2 = String.Empty;
                string cascade2val = String.Empty;
                if (data["cascade2"] != null)
                    cascade2 = data["cascade2"].ToString();
                if (data["cascade2val"] != null)
                    cascade2val = data["cascade2val"].ToString();

                string json;

                if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
                {
                    json = "{  \"tablename\":\"" + RequestParser.GetField(tablename) + "\",\"valuefield\":\"" + RequestParser.GetField(valuefield) + "\",\"textfield\":\"" + RequestParser.GetField(textfield) + "\",\"ugvifieldname\":\"" + ugvifieldname + "\",\"ug\":" + ug + ",\"cascade1\":\"" + RequestParser.GetField(cascade1) + "\",\"cascade1val\":\"" + RequestParser.GetValue(cascade1val) + "\",\"cascade2\":\"" + (!String.IsNullOrEmpty(cascade2) ? RequestParser.GetField(cascade2) :"") + "\",\"cascade2val\":\"" + RequestParser.GetValue(cascade2val) + "\"}";
                }
                else
                {
                    json = "{  \"tablename\":\"" + tablename + "\",\"valuefield\":\"" + valuefield + "\",\"textfield\":\"" + textfield + "\",\"ugvifieldname\":\"" + ugvifieldname + "\",\"ug\":" + ug + ",\"cascade1\":\"" + cascade1 + "\",\"cascade1val\":\"" + cascade1val + "\",\"cascade2\":\"" + cascade2 + "\",\"cascade2val\":\"" + cascade2val + "\"}";
                }
                var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);

                var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils(schema + "." + tablename);
                var dbres = dbhandler.callStoredProcedurewithXMLInput(xml, "dbo.Magic_GetCascadeDropdownValues");

                var result = dbres.table.AsEnumerable().ToList();


                List<ReturnFKitem> ret = new List<ReturnFKitem>();

                foreach (var row in result)
                {
                    ret.Add(new ReturnFKitem(row[0].ToString(), row[1].ToString(), null));
                }

                return (ret);
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex,MFLog.logtypes.ERROR);
                throw new ArgumentException("An error has occured");
            }
        }

        [HttpPost]
        public DataTable CallFKStoredProcedure(dynamic data)
        {
            try
            {
                string storedprocedure = data["storedprocedurename"].ToString();
                string valuefield = data["valuefield"].ToString();
                string textfield = data["textfield"].ToString();
                string schema = data["schema"].ToString();
                if (string.IsNullOrEmpty(schema))
                    schema = DatabaseCommandUtils.DEFAULT_DB_SCHEMA;
                string datarow = null;
                if (data.rowdata != null)
                    datarow = data.rowdata.ToString();
                string cascadefilter = String.Empty;
                if (data["filter"] != null)
                {
                    dynamic filterdata = data.filter;
                    Models.Request req = new Models.Request();
                    req.filter = new Filters(filterdata);
                    RequestParser rp = new RequestParser(req);

                    cascadefilter = rp.BuildWhereCondition(true);
                }

                int ug = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
                int user = MagicFramework.Helpers.SessionHandler.IdUser;

                var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils(schema + "." + storedprocedure);

                string json;
                if (MFConfiguration.InstanceSettings().SQLEscapeClientInput)
                {
                    json = "{\"userid\":" + user.ToString() + ",\"usergroup\":" + ug.ToString() + ",\"valuefield\":\"" + RequestParser.GetField(valuefield) + "\",\"textfield\":\"" + RequestParser.GetField(textfield) + "\",\"filter\":\"" + cascadefilter + "\"}";
                }
                else
                {
                    json = "{\"userid\":" + user.ToString() + ",\"usergroup\":" + ug.ToString() + ",\"valuefield\":\"" + valuefield + "\",\"textfield\":\"" + textfield + "\",\"filter\":\"" + cascadefilter + "\"}";
                }
                //xml contiene le info per la risoluzione della FK (campo chiave e campo valore configurati dall' utente, userid e usergroup
                //xmldatarow e'  il contenuto del tr in cui c'e' la FK

                //converto il JSON in xml
                var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);
                var xmldatarow = MagicFramework.Helpers.JsonUtils.Json2Xml(datarow);

                //creo il nodo FKRESOLUTION con le info per risolvere la FK 
                XmlNode fknode = xmldatarow.CreateNode("element", "FKRESOLUTION", "");
                foreach (XmlAttribute a in xml.SelectSingleNode("//SQLP/P").Attributes)
                {
                    XmlAttribute newatt = xmldatarow.CreateAttribute(a.Name);
                    newatt.Value = a.Value;
                    fknode.Attributes.Append(newatt);
                }
                //appendo il nuovo nodo a SQLP
                xmldatarow.SelectSingleNode("//SQLP").AppendChild(fknode);

                //creo il nodo REQUESTREFERRER con le info del Qs
                XmlNode rrnode = xmldatarow.CreateNode("element", "REQUESTREFERRER", "");
                var nvc = HttpContext.Current.Request.UrlReferrer.ParseQueryString();
                var allkeys = nvc.AllKeys;
                foreach (var k in allkeys)
                {
                    XmlAttribute newatt = xmldatarow.CreateAttribute(k);
                    newatt.Value = HttpContext.Current.Server.HtmlDecode(nvc.Get(k));
                    rrnode.Attributes.Append(newatt);
                }
                xmldatarow.SelectSingleNode("//SQLP").AppendChild(rrnode);

                var dbres = dbhandler.callStoredProcedurewithXMLInput(xmldatarow, schema + '.' + storedprocedure);
                if (!dbres.table.Columns.Contains("MagicBOLayer_ID"))
                {
                    dbres.table.Columns.Add("MagicBOLayer_ID");
                }
                var result = dbres.table.AsEnumerable().ToList();
                if (result.Count > 0)
                    return result[0].Table;
                else
                    return new DataTable();
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex, MFLog.logtypes.ERROR);
                throw new ArgumentException("An error has occured");
            }
        }
    }
}
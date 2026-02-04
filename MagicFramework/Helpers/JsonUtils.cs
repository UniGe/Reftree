using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Dynamic;
using Newtonsoft.Json;
using System.Diagnostics;
using System.Web.Http;
//using System.Net;
using System.Net.Http;
using Newtonsoft.Json.Linq;

namespace MagicFramework.Helpers
{
    public static class JsonUtils
    {
        //list of props that should not be pushed to the database (cfg fields added to data: "cfgColumns","cfgModel","cfgDataSourceCustomParam","cfglayerID","cfgEntityName","cfgfunctionID","cfgoperation","cfgGridName","cfgpkName")
        private static HashSet<string> blackListedProperties = new HashSet<string> { "cfgColumns", "cfgModel", "cfgDataSourceCustomParam" }; 
        /// <summary>
        /// Convert the dynamic data representation (obtained from JSON) to an xmlInput document comprehensive of SESSIONVARS
        /// </summary>
        /// <param name="data">the dynamic data (POSTI/U/D controller method parameter)</param>
        /// <param name="operation">create/update/destroy</param>
        /// <param name="entity">the entity wich should be passed to the stored procedure</param>
        /// <param name="id">(default 0) id of the item to update/delete</param>
        /// <returns></returns>
        public static XmlDocument DynamicToXmlInput_ins_upd_del(dynamic data, string operation, string entity, string id = "0")
        {
            XmlDocument xml = JsonUtils.Json2Xml(data.ToString(), operation, entity, id.ToString(), id.ToString(), 0, 0, -1, null, null, null, -1, null, null);
            return xml;
        }
        /// <summary>
        /// Crea il messaggio da restituire (opzionalmente) per dare nella response delle destroy e delle update l' indicazione del tipo di messaggio (WARN,OK)
        /// </summary>
        /// <param name="msgtype"></param>
        /// <param name="message"></param>
        /// <returns></returns>
        public static string buildJSONreturnHttpMessage(string msgtype, string message, Boolean isValidation = false)
        {
            if (msgtype == null)
                msgtype = "OK";
            dynamic msgdata = new ExpandoObject();
            msgdata.msgtype = msgtype;
            msgdata.message = message;
			msgdata.isValidation = isValidation;
			string retmsg = Newtonsoft.Json.JsonConvert.SerializeObject(msgdata);
            return retmsg;
        }
        ///// <summary>
        ///// Returns true if the column/field is contained in another field (eg  XML cols)
        ///// </summary>
        ///// <param name="modeldata"></param>
        ///// <param name="fieldname"></param>
        ///// <returns></returns>
        //private static bool fieldiscomplex(dynamic modeldata, string fieldname,int? layer)
        //{
        //    if (modeldata != null)
        //        if (modeldata.fields[fieldname] != null)
        //            if (modeldata.fields[fieldname].containerColumn != null && modeldata.fields[fieldname].Layer_ID != null)
        //                if (modeldata.fields[fieldname].Layer_ID == layer)
        //                    return true;
        //    return false;
        //}

        private static void addAttribute(XmlDocument doc, XmlNode P, XmlNode child)
        {
            XmlAttribute a = doc.CreateAttribute(child.Name);
            //if attribute with name already exists (value was array) combine values with | to get stringpipe as xml value
            if (P.Attributes[child.Name] != null)
                a.Value = P.Attributes[child.Name].Value + "|" + child.InnerText;
            else
                a.Value = child.InnerText;

            P.Attributes.Append(a);
            
        }


        private static bool XmlNodeIsSimpleField(XmlNode node)
        {
            if (node.FirstChild == null)
                return true;
            if (node.FirstChild.GetType().Name == "XmlText")
                    return true;
            
            return false;
        }
        /// <summary>
        /// this method writes data payload from browser as attributes of a P node
        /// </summary>
        /// <param name="doc"></param>
        private static void buildDataBaseXmlData(XmlDocument doc,XmlNode P)
        {
            XmlNodeList SQLP = doc.SelectNodes("//SQLP");
            foreach (XmlNode node in SQLP)
            {
                foreach (XmlNode child in node.ChildNodes) // scorro i campi 
                {
                    if (blackListedProperties.Contains(child.Name))
                        continue;
                    //se e' un oggetto lo appendo come XML array come valore di un attributo
                    if (!XmlNodeIsSimpleField(child))
                    {
                        XmlNodeList l = P.SelectNodes("//" + child.Name);
                        XmlNode nodetoappend;
                        if (l.Count == 0) 
                        {
                            nodetoappend = doc.CreateNode("element", child.Name, "");
                            P.AppendChild(nodetoappend);
                        }
                        else nodetoappend = l.Item(0);
                        XmlNode newnodeinner = doc.CreateNode("element", child.Name + "element", "");
                        for (int i = 0; i < child.ChildNodes.Count; i++)
                        {
                            newnodeinner.AppendChild(child.ChildNodes.Item(i).Clone());
                        }
                        nodetoappend.AppendChild(newnodeinner);
                    }
                    else  
                        addAttribute(doc, P, child);

                }

            }
        }
        private static void AddRequestQueryStringKeysAsAttributes(XmlDocument doc,XmlNode node)
        {
            var nvc = HttpContext.Current.Request.UrlReferrer.ParseQueryString();
            
            var allkeys = nvc.AllKeys;
            foreach (var k in allkeys)
            {
                try
                {
                    XmlAttribute a = doc.CreateAttribute(k);
                    a.Value = HttpContext.Current.Server.HtmlDecode(nvc.Get(k));
                    node.Attributes.Append(a);
                }
                catch (Exception ex){
                    Debug.WriteLine(ex.Message);
                }
            }
            XmlAttribute pathandquery = doc.CreateAttribute("PATHANDQUERY");
            pathandquery.Value = HttpContext.Current.Request.UrlReferrer.PathAndQuery;
            node.Attributes.Append(pathandquery);
        }
        private static string jsonStringArrayToObj(string text)
        {
             if (!text.StartsWith("{") && text.StartsWith("[")) //it's an array 
                text = "{\"data\":" + text + "}"; //this is not an object --> conversion will fail. 
            return text;
        }

        private static string GetGridNameFromData(string data)
        {
            string gridName = String.Empty;
            try
            {
                if (string.IsNullOrEmpty(data))
                    return gridName;

                if (data.StartsWith("{") && data.EndsWith("}"))
                {
                    JToken gn;
                    var o = JObject.Parse(data);
                    if (o.TryGetValue("Grid__Name__", out gn))
                        gridName = gn.ToString();
                }
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex);
            }
            return gridName;
        }
        /// <summary>
        /// Method for controllers
        /// </summary>
        /// <param name="text"></param>
        /// <param name="userid"></param>
        /// <param name="cultureid"></param>
        /// <param name="action"></param>
        /// <returns></returns>
        public static XmlDocument Json2Xml(string text, string action, string entity, string id, string idold, int skip, int take, int layer, string columnlist, string wherecondition, string orderby, int functionid, string jsonfilter, dynamic modeldata, string[] groupBy = null, MagicFramework.Models.Aggregations[] aggregations = null,int? idUser = null,int? idUserGroup = null,string pkname = null)
        {
            //normalize data payload
            text = text == null ? "{ x:1 }" : jsonStringArrayToObj(text);
            string gridName = GetGridNameFromData(text);
            XmlDocument doc = (XmlDocument)Newtonsoft.Json.JsonConvert.DeserializeXmlNode(text, "SQLP");
            XmlNode P = doc.CreateNode("element", "P", "");
            XmlNode Sessionvars = doc.CreateNode("element", "SESSIONVARS", "");
            XmlNode Actions = doc.CreateNode("element", "ACTION", "");
            XmlNode QueryBuilder = doc.CreateNode("element", "QUERYBUILDER", "");
            XmlNode RequestReferrer = doc.CreateNode("element", "REQUESTREFERRER", "");
      
           buildDataBaseXmlData(doc,P);
         
            XmlAttribute user = doc.CreateAttribute("iduser");
            if (idUser == null)
                user.Value = MagicFramework.Helpers.SessionHandler.IdUser.ToString();
            else
                user.Value = idUser.ToString();
            Sessionvars.Attributes.Append(user);
            XmlAttribute businessunit = doc.CreateAttribute("idbusinessunit");
            if (idUserGroup == null)
                businessunit.Value = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString();
            else
                businessunit.Value = idUserGroup.ToString();
            Sessionvars.Attributes.Append(businessunit);
            //cerco se esiste la config Rootdirforcustomer serve per Reftree 
            try {
               string fileuploadrootforcustomer = ApplicationSettingsManager.GetRootdirforcustomer();
               if (!String.IsNullOrEmpty(fileuploadrootforcustomer))
               {
                   XmlAttribute customeruploaddest = doc.CreateAttribute("Rootdirforcustomer");
                   customeruploaddest.Value = fileuploadrootforcustomer;
                   Sessionvars.Attributes.Append(customeruploaddest);
               }
            }  
            catch {}
            try {
               string fileuploadroot = ApplicationSettingsManager.GetRootdirforupload();
               if (!String.IsNullOrEmpty(fileuploadroot))
               {
                   XmlAttribute uploaddest = doc.CreateAttribute("Rootdirforupload");
                   uploaddest.Value = fileuploadroot;
                   Sessionvars.Attributes.Append(uploaddest);
               }
            }
            catch {}
            try {
                string appPath = HttpContext.Current.Server.MapPath("~");
                XmlAttribute applicationPath = doc.CreateAttribute("AppPath");
                applicationPath.Value = appPath;
                Sessionvars.Attributes.Append(applicationPath);
            }
            catch { }
            try
            {
                XmlAttribute MSSQLFileTable = doc.CreateAttribute("MSSQLFileTable");
                MSSQLFileTable.Value = ApplicationSettingsManager.getMSSQLFileTable() ? "true" : "false";
                Sessionvars.Attributes.Append(MSSQLFileTable);
            }
            catch { }
            try
            {
                XmlAttribute ApplicationInstanceName = doc.CreateAttribute("ApplicationInstanceName");
                ApplicationInstanceName.Value = ApplicationSettingsManager.GetAppInstanceName();
                Sessionvars.Attributes.Append(ApplicationInstanceName);
            }
            catch { }
            try
            {
                XmlAttribute ApplicationDomain = doc.CreateAttribute("ApplicationDomain");
                ApplicationDomain.Value = SessionHandler.ApplicationDomainURL;
                Sessionvars.Attributes.Append(ApplicationDomain);
            }
            catch { }

            try
            {
                XmlAttribute MagicDBCatalogue = doc.CreateAttribute("MagicDBCatalogue");
                MagicDBCatalogue.Value = DBConnectionManager.getDBNameFromConnectionString(DBConnectionManager.GetMagicConnection());
                Sessionvars.Attributes.Append(MagicDBCatalogue);
            }
            catch { }

            try
            {
                XmlAttribute TargetDBCatalogue = doc.CreateAttribute("TargetDBCatalogue");
                TargetDBCatalogue.Value = DBConnectionManager.getTargetDBName();
                Sessionvars.Attributes.Append(TargetDBCatalogue);
            }
            catch { }
            //Add query string parameters of the page to the reuqest in a proper section
            try {
                AddRequestQueryStringKeysAsAttributes(doc, RequestReferrer);
            }
            catch (Exception ex) {
                Debug.WriteLine(ex.Message);
            }

            XmlAttribute act = doc.CreateAttribute("TYPE");
            act.Value = action;
            XmlAttribute entityatt = doc.CreateAttribute("TABLE");
            entityatt.Value = entity;
            XmlAttribute ID = doc.CreateAttribute("ID");
            ID.Value = id;
            XmlAttribute IDOLD = doc.CreateAttribute("IDOLD");
            IDOLD.Value = idold;
            XmlAttribute LAYER = doc.CreateAttribute("LAYERID");
            LAYER.Value = layer.ToString();
            XmlAttribute FUNCTION = doc.CreateAttribute("FUNCTIONID");
            FUNCTION.Value = functionid.ToString();
          

            Actions.Attributes.Append(act);
            Actions.Attributes.Append(entityatt);
            if (!String.IsNullOrEmpty(gridName))
            {
                XmlAttribute gridatt = doc.CreateAttribute("GRIDNAME");
                gridatt.Value = gridName;
                Actions.Attributes.Append(gridatt);
            }
            Actions.Attributes.Append(ID);
            Actions.Attributes.Append(IDOLD);
            Actions.Attributes.Append(LAYER);
            Actions.Attributes.Append(FUNCTION);

            try {
                XmlAttribute FUNCTIONGUID = doc.CreateAttribute("FunctionGUID");
                FUNCTIONGUID.Value = Models.Magic_Functions.GetGUIDFromID(functionid).ToString();
                Actions.Attributes.Append(FUNCTIONGUID);
            }
            catch (Exception ex) {
                Debug.WriteLine("Json2Xml FUNCTIONGUID: "+ex.Message);
            }

            XmlAttribute PKNAME = doc.CreateAttribute("PKNAME");
            PKNAME.Value = pkname == null ? "" : pkname;
            XmlAttribute WHERE = doc.CreateAttribute("WHERE");
            WHERE.Value = wherecondition;
            XmlAttribute ORDERBY = doc.CreateAttribute("ORDERBY");
            ORDERBY.Value = orderby;
            XmlAttribute SKIP = doc.CreateAttribute("SKIP");
            SKIP.Value = skip.ToString();
            XmlAttribute TAKE = doc.CreateAttribute("TAKE");
            TAKE.Value = take.ToString();
            XmlAttribute SELECT = doc.CreateAttribute("SELECT");
            SELECT.Value = columnlist;
            XmlAttribute FILTER = doc.CreateAttribute("FILTER");
            FILTER.Value = jsonfilter;

            if (groupBy != null || aggregations != null)
            {
                string groupAggregationColumnList = "";
                if (groupBy != null)
                {
                    XmlAttribute group = doc.CreateAttribute("GROUPBY");
                    group.Value = string.Join(",", groupBy);
                    QueryBuilder.Attributes.Append(group);
                    groupAggregationColumnList = group.Value;
                }
                if (aggregations != null)
                {
                    foreach (var groupByWithAggregationFunction in aggregations.Where(g => g.functions != null))
                    {
                        foreach (var aggregationFunction in groupByWithAggregationFunction.functions)
                        {
                            groupAggregationColumnList += "," + aggregationFunction + "(" + groupByWithAggregationFunction.column + ") AS " + RequestParser.GetField(groupByWithAggregationFunction.column + "_" + aggregationFunction);
                        }
                    }
                }
                XmlAttribute select = doc.CreateAttribute("GROUPSELECT");
                select.Value = groupAggregationColumnList.TrimStart(',');
                QueryBuilder.Attributes.Append(select);
            }

            QueryBuilder.Attributes.Append(WHERE);
            QueryBuilder.Attributes.Append(ORDERBY);
            QueryBuilder.Attributes.Append(SKIP);
            QueryBuilder.Attributes.Append(TAKE);
            QueryBuilder.Attributes.Append(SELECT);
            QueryBuilder.Attributes.Append(FILTER);
            QueryBuilder.Attributes.Append(PKNAME);

            doc.SelectSingleNode("//SQLP").RemoveAll();
            doc.SelectSingleNode("//SQLP").AppendChild(P);
            doc.SelectSingleNode("//SQLP").AppendChild(Actions);
            doc.SelectSingleNode("//SQLP").AppendChild(Sessionvars);
            doc.SelectSingleNode("//SQLP").AppendChild(QueryBuilder);
            doc.SelectSingleNode("//SQLP").AppendChild(RequestReferrer);

            return doc;
        }
        /// <summary>
        /// Pure converter from json to xml: values are set as attributes of a P tag
        /// </summary>
        /// <param name="text"></param>
        /// <returns></returns>
        public static XmlDocument Json2Xml(string text)
        {
            //normalize data payload
            text = (text == null) ? "{  \"cfgNullTextinJSON\":true }" : jsonStringArrayToObj(text);
            XmlDocument doc = (XmlDocument)Newtonsoft.Json.JsonConvert.DeserializeXmlNode(text, "SQLP");
            XmlNode P = doc.CreateNode("element", "P", "");
            XmlNodeList SQLP = doc.SelectNodes("//SQLP");

            buildDataBaseXmlData(doc, P);
            //foreach (XmlNode node in SQLP)
            //{
            //    foreach (XmlNode child in node.ChildNodes)
            //    {
            //        addAttribute(doc, P, child);
            //    }
            //}

            doc.SelectSingleNode("//SQLP").RemoveAll();
            doc.SelectSingleNode("//SQLP").AppendChild(P);

            try
            {
                XmlNode Sessionvars = doc.CreateNode("element", "SESSIONVARS", "");

                XmlAttribute ApplicationInstanceName = doc.CreateAttribute("ApplicationInstanceName");
                ApplicationInstanceName.Value = ApplicationSettingsManager.GetAppInstanceName();
                Sessionvars.Attributes.Append(ApplicationInstanceName);

                XmlAttribute ApplicationDomain = doc.CreateAttribute("ApplicationDomain");
                ApplicationDomain.Value = SessionHandler.ApplicationDomainURL;
                Sessionvars.Attributes.Append(ApplicationDomain);

                XmlAttribute MagicDBCatalogue = doc.CreateAttribute("MagicDBCatalogue");
                MagicDBCatalogue.Value = DBConnectionManager.getDBNameFromConnectionString(DBConnectionManager.GetMagicConnection());
                Sessionvars.Attributes.Append(MagicDBCatalogue);

                XmlAttribute TargetDBCatalogue = doc.CreateAttribute("TargetDBCatalogue");
                TargetDBCatalogue.Value = DBConnectionManager.getTargetDBName();
                Sessionvars.Attributes.Append(TargetDBCatalogue);

                doc.SelectSingleNode("//SQLP").AppendChild(Sessionvars);

            }
            catch (Exception ex) {
                Debug.WriteLine("Session not available:"+ex.Message);
            }

            return doc;
        }

        private static string GetFunctionName(int functionid)
        {

            if (functionid == 0 || functionid == -1)
                return "0";

            var dbhandler = new DatabaseCommandUtils();
            string par = "{ \"functionid\":" + functionid + " }";
            XmlDocument xmlinp = JsonUtils.Json2Xml(par);
            var dbres = dbhandler.callStoredProcedurewithXMLInput(xmlinp, "dbo.Magic_GetFunctionName");
            var result = dbres.table.AsEnumerable().ToList().FirstOrDefault();

            return result[0].ToString();
        
        }
        /// <summary>
        /// Biz # adapter for stored procedure calls
        /// </summary>
        /// <param name="text"></param>
        /// <param name="action"></param>
        /// <param name="entity"></param>
        /// <param name="id"></param>
        /// <param name="idold"></param>
        /// <param name="skip"></param>
        /// <param name="take"></param>
        /// <param name="layer"></param>
        /// <param name="columnlist"></param>
        /// <param name="wherecondition"></param>
        /// <param name="orderby"></param>
        /// <param name="functionid"></param>
        /// <param name="jsonfilter"></param>
        /// <param name="modeldata"></param>
        /// <returns></returns>
        public static string Json2XmlString(string text, string action, string entity, string id, string idold,int skip,int take,int layer,string columnlist,string wherecondition,string orderby,int functionid,string jsonfilter,dynamic modeldata)
        {

            /*
            <SQLP>
            <P ANAGRA_ID="2" ANAGRA_CODICE="A-0001" ANAGRA_CODICE_CONTAB="207" ANAGRA_T_ATECO_ID="1" ANAGRA_T_ANATIT_ID="" ANAGRA_T_ANASES_ID="3" ANAGRA_COGNOME="" ANAGRA_NOME="" ANAGRA_RAGIONE_SOCIALE="A.A.V. F. BANTERLA SNC DI BFEC" ANAGRA_RAGIONE_SOCIALE_2="" ANAGRA_INDIRIZZO="Localita Incaffi" ANAGRA_LOCALITA="" ANAGRA_CAP="37010" ANAGRA_T_COMUNI_ID="52" ANAGRA_DATA_NASCITA="" ANAGRA_LUOGO_NASCITA="" ANAGRA_CODICE_FISCALE="00660930231" ANAGRA_PARTITA_IVA="00660930231" ANAGRA_TELEFONO="" ANAGRA_TELEFONO_2="" ANAGRA_FAX="" ANAGRA_CELL="" ANAGRA_EMAIL="" ANAGRA_URL="" ANAGRA_ATTIVO="1" ANAGRA_DATA_INSERIMENTO="2006-10-30T17:17:31.433" />
            <KEY name="ANAGRA_ID" value="2" isidentity="True" isnumeric="True" />
            <SESSION appID="2" idConn="0" cmdID="-1" command="PM_V_ANAGRA_CLI" langID="1" lang="" menuID="2" menuName="Intranet" idUser="1" idCustomer="-1" groupid="-1" userData="" selectval="" />
            <SQLCMD CMDTYPE="UPDATE" />
            </SQLP>
            */
            if (text == null)
                text = "{ x:1 }";
            XmlDocument doc = (XmlDocument)Newtonsoft.Json.JsonConvert.DeserializeXmlNode(text, "SQLP");
            //converto il modello in un oggetto dinamico in modo da poter accedere per nome colonna
            
            string keyname = String.Empty;
            
            if (doc.SelectNodes("SQLP//cfgpkName").Item(0) != null)
                keyname = doc.SelectNodes("SQLP//cfgpkName").Item(0).InnerText;
            
            
            XmlNode P = doc.CreateNode("element", "P", "");
            XmlNode Sessionvars = doc.CreateNode("element", "SESSION", "");
            XmlNode Key = doc.CreateNode("element", "KEY", "");
            XmlNode Actions = doc.CreateNode("element", "SQLCMD", "");
            XmlNode QueryBuilder = doc.CreateNode("element", "QUERYBUILDER", "");
        
            buildDataBaseXmlData(doc, P);

            XmlAttribute keynameattr = doc.CreateAttribute("name");
            keynameattr.Value = keyname;
            Key.Attributes.Append(keynameattr);

            XmlAttribute keyidattr = doc.CreateAttribute("value");
            keyidattr.Value = id ?? "0";
            Key.Attributes.Append(keyidattr);

         //   appID="2" idConn="0" cmdID="-1" command="PM_V_ANAGRA_CLI" langID="1" lang="" menuID="2" menuName="Intranet" idUser="1" idCustomer="-1" groupid="-1" userData="" selectval=""
            XmlAttribute user = doc.CreateAttribute("idUser");
            user.Value = MagicFramework.Helpers.SessionHandler.IdUser.ToString();
            Sessionvars.Attributes.Append(user);
            XmlAttribute businessunit = doc.CreateAttribute("groupid");
            businessunit.Value = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString();
            XmlAttribute langID = doc.CreateAttribute("langID");
            langID.Value = MagicFramework.Helpers.SessionHandler.UserCulture.ToString();
            XmlAttribute command = doc.CreateAttribute("command");
            command.Value = GetFunctionName(functionid);
            Sessionvars.Attributes.Append(command);
            //TODO capire se necessarie
            XmlAttribute appid = doc.CreateAttribute("appID");
            appid.Value = "-1";
            Sessionvars.Attributes.Append(appid);
            XmlAttribute idConn = doc.CreateAttribute("idConn");
            idConn.Value = "-1";
            Sessionvars.Attributes.Append(idConn);
            XmlAttribute cmdID = doc.CreateAttribute("cmdID");
            cmdID.Value = functionid.ToString();
            Sessionvars.Attributes.Append(cmdID);
            XmlAttribute lang = doc.CreateAttribute("lang");
            lang.Value = "";
            Sessionvars.Attributes.Append(lang);
            XmlAttribute menuName = doc.CreateAttribute("menuName");
            menuName.Value = "";
            Sessionvars.Attributes.Append(menuName);
            XmlAttribute menuID = doc.CreateAttribute("menuID");
            menuID.Value = "-1";
            Sessionvars.Attributes.Append(menuID);
            XmlAttribute idCustomer = doc.CreateAttribute("idCustomer");
            idCustomer.Value = "-1";
            Sessionvars.Attributes.Append(idCustomer);
            XmlAttribute userData = doc.CreateAttribute("userData");
            userData.Value = "-1";
            Sessionvars.Attributes.Append(userData);
            XmlAttribute selectval = doc.CreateAttribute("selectval");
            selectval.Value = "-1";
            Sessionvars.Attributes.Append(selectval);
            //Fine TODO
            Sessionvars.Attributes.Append(businessunit);

            XmlAttribute act = doc.CreateAttribute("CMDTYPE");
            act.Value = action == "create" ? "insert" : action;
            XmlAttribute entityatt = doc.CreateAttribute("TABLE");
            entityatt.Value = entity;
            XmlAttribute ID = doc.CreateAttribute("ID");
            ID.Value = id;
            XmlAttribute LAYER = doc.CreateAttribute("LAYERID");
            LAYER.Value = layer.ToString();
            XmlAttribute FUNCTION = doc.CreateAttribute("FUNCTIONID");
            FUNCTION.Value = functionid.ToString();



            Actions.Attributes.Append(act);
            Actions.Attributes.Append(entityatt);
            Actions.Attributes.Append(ID);
            Actions.Attributes.Append(LAYER);
            Actions.Attributes.Append(FUNCTION);

            try
            {
                XmlAttribute FUNCTIONGUID = doc.CreateAttribute("FunctionGUID");
                FUNCTIONGUID.Value = Models.Magic_Functions.GetGUIDFromID(functionid).ToString();
                Actions.Attributes.Append(FUNCTIONGUID);
            }
            catch (Exception ex) {
                Debug.WriteLine("Json2Xml FUNCTIONGUID: " + ex.Message);
            }

            XmlAttribute WHERE = doc.CreateAttribute("WHERE");
            WHERE.Value = wherecondition;
            XmlAttribute ORDERBY = doc.CreateAttribute("ORDERBY");
            ORDERBY.Value = orderby;
            XmlAttribute SKIP = doc.CreateAttribute("SKIP");
            SKIP.Value = skip.ToString();
            XmlAttribute TAKE = doc.CreateAttribute("TAKE");
            TAKE.Value = take.ToString();
            XmlAttribute SELECT = doc.CreateAttribute("SELECT");
            SELECT.Value = columnlist;
            XmlAttribute FILTER = doc.CreateAttribute("FILTER");
            FILTER.Value = jsonfilter;

            QueryBuilder.Attributes.Append(WHERE);
            QueryBuilder.Attributes.Append(ORDERBY);
            QueryBuilder.Attributes.Append(SKIP);
            QueryBuilder.Attributes.Append(TAKE);
            QueryBuilder.Attributes.Append(SELECT);
            QueryBuilder.Attributes.Append(FILTER);

            doc.SelectSingleNode("//SQLP").RemoveAll();
            doc.SelectSingleNode("//SQLP").AppendChild(P);
            doc.SelectSingleNode("//SQLP").AppendChild(Key);
            doc.SelectSingleNode("//SQLP").AppendChild(Actions);
            doc.SelectSingleNode("//SQLP").AppendChild(Sessionvars);
            doc.SelectSingleNode("//SQLP").AppendChild(QueryBuilder);
           
            return doc.InnerXml;
        }
        private class SingleRowCollection
        {
            public DataRow[] drows { get; set; }
            public SingleRowCollection()
            { }
        }
        public static string convertDataSetToJsonString(DataSet ds, List<string> xmlColumns = null)
        {
            var r = new List<SingleRowCollection>();
            foreach (DataTable t in ds.Tables)
            {
                SingleRowCollection sr = new SingleRowCollection();
                sr.drows = t.AsEnumerable().ToArray().Take(1).ToArray();
                if (xmlColumns != null)
                {
                    if (sr.drows.Length > 0)
                    {
                        List<string> columnsToConvert;
                        List<string> columns = new List<string>();
                        foreach (System.Data.DataColumn column in t.Columns)
                        {
                            columns.Add(column.ColumnName);
                        }
                        columnsToConvert = columns.Where(c => xmlColumns.Contains(c)).ToList();
                        if (columnsToConvert.Any())
                        {
                            foreach (var row in sr.drows)
                            {
                                foreach (string xmlColumn in columnsToConvert)
                                {
                                    if (row[xmlColumn] != DBNull.Value)
                                    {
                                        XmlDocument xml = new XmlDocument();
                                        xml.LoadXml((string)row[xmlColumn]);
                                        row[xmlColumn] = JsonConvert.SerializeXmlNode(xml);
                                    }
                                }
                            }
                        }
                    }
                }
                r.Add(sr);
            }
            return Newtonsoft.Json.JsonConvert.SerializeObject(r.ToArray());
        }
    }
}
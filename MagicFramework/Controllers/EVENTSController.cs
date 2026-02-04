using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using AttributeRouting.Web.Http;
using System.Linq.Dynamic;
using System.Configuration;
using MagicFramework;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Reflection;
using System.Data.SqlClient;
using System.Data;
using MagicFramework.Helpers;
using System.Dynamic;
using System.Xml;

namespace MagicFramework.Controllers
{
    public class EVENTSController : ApiController
    {

        public class RecordAction
        {
            public int ActionId { get; set; }   //id azione
            public string ActionDescription { get; set; } //descriz. azione
            public int TypeId { get; set; } //tipo regola
            public string Type { get; set; }  // tipo regola
            public string Class { get; set; } // classe regola
            public int ClassId { get; set; } // classe regola
            public string ActionCommand { get; set; } //name di una grid (type= "opengridform") , nome stored (type="storedprocedure") , nome function js (type = jsfunction)
            public string ActionType { get; set; }
            public int Order { get; set; }
            public int StageId { get; set; } 
            public string recordId { get; set; } //BOID
            public string ActionFilter { get; set; }  //Filtro navig.
            public string ActionIconClass { get; set; } // icon html class
            public string ActionBackgroundColor { get; set; }
            public string TypeIconClass { get; set; }
            public bool EditPageRefreshPageAfterAction { get; set; }
        }

        //public class RecordConstraint
        //{
        //    public string label { get; set; }
        //    public string code { get; set; }
        //    public string columnName { get; set; } 
        //    public string constrainttype { get; set; }
        //    public string recordid { get; set; }
        //}


        //[HttpPost]
        //public HttpResponseMessage GetGridHasActionRules(dynamic data)
        //{
        //    HttpResponseMessage response = new HttpResponseMessage();
        //    var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(Newtonsoft.Json.JsonConvert.SerializeObject(data));

        //    var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();

        //    string storedprocedure = ApplicationSettingsManager.GetActionCheckRulesStoredProcedure();

        //    var dbres = dbutils.callStoredProcedurewithXMLInput(xml, storedprocedure);

        //    if (dbres.counter > 0)
        //    {
        //        response.StatusCode = HttpStatusCode.OK;
        //        response.Content = new StringContent("{ \"hasactionrules\": \"true\"  }");

        //        return response;
        //    }
        //    else
        //    {
        //        response.StatusCode = HttpStatusCode.OK;
        //        response.Content = new StringContent("{ \"hasactionrules\": \"false\"  }");

        //        return response;
        //    }
        //}

        private static XmlDocument JsonActions2Xml(string text)
        {
            //se il testo e' nullo risolvo una dummy string
            if (text == null)
                text = "{  \"cfgNullTextinJSON\":true }";
            XmlDocument doc = (XmlDocument)Newtonsoft.Json.JsonConvert.DeserializeXmlNode(text, "SQLP");
            XmlNode P = doc.CreateNode("element", "P", "");
            XmlNode SESSIONVARS = doc.CreateNode("element", "SESSIONVARS", "");

            XmlNodeList SQLP = doc.SelectNodes("//SQLP");

            foreach (XmlNode node in SQLP)
            {
                foreach (XmlNode child in node.ChildNodes)
                {
                    XmlAttribute a = doc.CreateAttribute(child.Name);
                    a.Value = child.InnerText;
                    P.Attributes.Append(a);
                }
            }

            XmlAttribute iduser = doc.CreateAttribute("iduser");
            iduser.Value = SessionHandler.IdUser.ToString();
            SESSIONVARS.Attributes.Append(iduser);

            XmlAttribute idbusinessunit = doc.CreateAttribute("idbusinessunit");
            idbusinessunit.Value = SessionHandler.UserVisibilityGroup.ToString();
            SESSIONVARS.Attributes.Append(idbusinessunit);

            try
            {
                XmlAttribute ApplicationInstanceName = doc.CreateAttribute("ApplicationInstanceName");
                ApplicationInstanceName.Value = ApplicationSettingsManager.GetAppInstanceName();
                SESSIONVARS.Attributes.Append(ApplicationInstanceName);

                XmlAttribute MagicDBCatalogue = doc.CreateAttribute("MagicDBCatalogue");
                MagicDBCatalogue.Value = DBConnectionManager.getDBNameFromConnectionString(DBConnectionManager.GetMagicConnection());
                SESSIONVARS.Attributes.Append(MagicDBCatalogue);

                XmlAttribute TargetDBCatalogue = doc.CreateAttribute("TargetDBCatalogue");
                TargetDBCatalogue.Value = DBConnectionManager.getTargetDBName();
                SESSIONVARS.Attributes.Append(TargetDBCatalogue);
            }
            catch { }

            doc.SelectSingleNode("//SQLP").RemoveAll();
            doc.SelectSingleNode("//SQLP").AppendChild(P);
            doc.SelectSingleNode("//SQLP").AppendChild(SESSIONVARS);

            return doc;
        }

        [HttpPost]
        public List<RecordAction> GetRecordActions(dynamic data)
        {
            //datajs --> { entityname: entityName, id: rowdata.id, pk: pk, queryType: v , functionGUID : functionGUID , gridName:gridname }
            var response = new List<RecordAction>();
            dynamic inputobj = new ExpandoObject();
            inputobj = data;
            //forzature per adeguarsi alla stored...
            inputobj.masterEntityName = data.entityname;
            inputobj.itemid = data.id;
            inputobj.type = "A";
            inputobj.ugvi = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
         
            string json = Newtonsoft.Json.JsonConvert.SerializeObject(inputobj);
            var xml =JsonActions2Xml(json);

            var dbutils = new MagicFramework.Helpers.DatabaseCommandUtils();
            string storedprocedure = ApplicationSettingsManager.GetRecordActionsStoredProcedure();
            if (data.queryType == "customactions")
                storedprocedure = ApplicationSettingsManager.GetRecordSelectionCustomActionsStoredProcedure();

            var dbres = dbutils.callStoredProcedurewithXMLInput(xml, storedprocedure);
            var result = dbres.table.AsEnumerable().ToList();

            int colnum = dbres.table.Columns.Count;
            foreach (DataRow action in result)
            {

                RecordAction rec = new RecordAction();
                rec.ClassId = int.Parse(action[0].ToString());
                rec.Class = action[1].ToString();
                rec.TypeId = int.Parse(action[2].ToString());
                rec.Type = action[3].ToString();
                rec.ActionId = int.Parse(action[4].ToString());
                rec.ActionType = action[5].ToString();
                rec.ActionDescription = action[6].ToString();
                rec.ActionCommand = action[7].ToString();
                rec.Order = int.Parse(action[8].ToString());
                rec.StageId = int.Parse(action[9].ToString());
                rec.ActionFilter = action[10].ToString();
                //optional fields
                if (colnum > 11)
                    rec.ActionIconClass = action[11].ToString();
                if (colnum > 12)
                    rec.ActionBackgroundColor = action[12].ToString();
                if (colnum > 13)
                    rec.TypeIconClass = action[13].ToString(); //action[14] is id                
                if (colnum > 15)
                    rec.EditPageRefreshPageAfterAction = Convert.ToBoolean(action[15]);
                response.Add(rec);
            }



            return response;
        }
        


    }
}
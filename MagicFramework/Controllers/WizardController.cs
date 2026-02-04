using MagicFramework.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Data;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Xml;
using Newtonsoft.Json;
using MagicFramework.Helpers.Sql;

namespace MagicFramework.Controllers
{
    public class WizardController : ApiController
    {
        [HttpPost]
        public Models.Response GetWizard(dynamic data)
        {
            MFAPIGetQueries mfApi = new MFAPIGetQueries(DBConnectionManager.GetTargetConnection());
            return mfApi.GetWizard(data.Code.Value);
        }

        [HttpPost]
        public HttpResponseMessage getModel(dynamic data)
        {
            DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
            DataTable table = null;
            String xmlData = null;
            try
            {
                dynamic oData = new System.Dynamic.ExpandoObject();
                dynamic spData = new System.Dynamic.ExpandoObject();
                spData = data;
                DataSet ds = dbutils.GetDataSetFromStoredProcedure("Custom.wizardLoadModel", spData);
                if (ds != null)
                {
                    table = ds.Tables[0];
                    xmlData = table.Rows[0]["wXML"].ToString();
                    XmlDocument doc = new XmlDocument();
                    doc.LoadXml(xmlData);
                    XmlElement docRoot = doc.DocumentElement;
                    XmlNode dataelement = docRoot.SelectSingleNode("//dataelement");
                    XmlNode p = docRoot.SelectSingleNode("//P");

                    XmlDocument oDoc = new XmlDocument();
                    XmlNode modelsNode = getNode(oDoc, "model", dataelement.InnerXml);
                    oDoc.AppendChild(modelsNode);
                    if (p.Attributes["activeStep"] != null)
                        modelsNode.AppendChild(getNode(oDoc, "__activeStep", p.Attributes["activeStep"].InnerText));
                    if (p.Attributes["compiledSteps"] != null)
                        modelsNode.AppendChild(getNode(oDoc, "__compiledSteps", p.Attributes["compiledSteps"].InnerText));
                    if (p.Attributes["filesToManage"] != null)
                        modelsNode.AppendChild(getNode(oDoc, "__filesToManage", p.Attributes["filesToManage"].InnerText));
                    return Request.CreateResponse(HttpStatusCode.OK, oDoc);
                }
                else
                    return Request.CreateResponse(HttpStatusCode.NotFound);
            }
            catch (Exception e)
            {
                return Request.CreateResponse(HttpStatusCode.InternalServerError, e.Message);
            }

        }

        private XmlNode getNode(XmlDocument doc, string name, string innerXml)
        {
            XmlNode node = doc.CreateElement(name);
            node.InnerXml = innerXml;
            return node;
        }
    }
}

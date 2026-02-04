using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;
using Newtonsoft.Json.Linq;

namespace MagicFramework.Models
{
    public class GridModelParser
    {
        private string DatasourceModel { get; set; }
        private dynamic Data { get; set; }
        List<string> XMLFieldsToIgnore { get; set; }

        public GridModelParser()
        { }

        public GridModelParser(dynamic data)
        {
            if (data["cfgModel"] == null)
                this.DatasourceModel = null;
            else
                this.DatasourceModel = data["cfgModel"].ToString();
            this.Data = data;
            this.XMLFieldsToIgnore = new List<string>();
            if (this.Data.cfgXMLFieldsOutOfLayer != null) {
                foreach (var xti in (JArray)this.Data.cfgXMLFieldsOutOfLayer)
                {
                    this.XMLFieldsToIgnore.Add(xti.ToString());
                }
            }
        }

        /// <summary>
        /// Fills xml container columns with values taken from grid model fields 
        /// </summary>
        public void FillXMLValues()
        {
            if (Data.cfgModel == null)
                return;

            List<string> xmlColumns = new List<string>();
            Dictionary<string, List<string>> xmlProperties = new Dictionary<string, List<string>>();
            foreach (Newtonsoft.Json.Linq.JProperty column in Data.cfgModel.fields)
            {
                if (column.Value["containerColumn"] != null)
                {
                    if (!xmlProperties.ContainsKey(column.Value["containerColumn"].ToString()) 
                        && !this.XMLFieldsToIgnore.Contains(column.Name))
                        xmlProperties[column.Value["containerColumn"].ToString()] = new List<string>();
                    if (!this.XMLFieldsToIgnore.Contains(column.Name))
                        xmlProperties[column.Value["containerColumn"].ToString()].Add(column.Name);
                }
                else if (column.Value["databasetype"] != null && column.Value["databasetype"].ToString().Equals("xml"))
                    xmlColumns.Add(column.Name);
            }

            foreach (string column in xmlColumns)
            {
                this.Data[column] = getXMLValue(column, xmlProperties.ContainsKey(column) ? xmlProperties[column] : new List<string>());
            }
        }
        private bool isaDate(string column)
        {
            try
            {
                if (this.Data.cfgModel.fields[column].type == null)
                    return false;
                string type = this.Data.cfgModel.fields[column].type.ToString();
                if (type == "date")
                    return true;
            }
            catch {
                return false;
            }
            return false;
        }
        /// <summary>
        /// It builds the xml value of a given XML (container)column/field as an array of the single sub columns/fields
        /// </summary>
        /// <param name="containercolumn">the name of the XML column</param>
        /// <param name="props">the list of props which are part of the XML</param>
        /// <returns>es. <AS_ASSET_XML_CAMASS_VALUES>
        ///  <NumParcheggiTot />
        ///  <Inaugurazione />
        ///  <TipoColtura>grano</TipoColtura>
        ///  <ConfinaConEdificio>true</ConfinaConEdificio>
        ///  <NoSemininiPiantati>78000</NoSemininiPiantati>
        ///</AS_ASSET_XML_CAMASS_VALUES><
        ///returns>
        private string getXMLValue(string containercolumn, List<string> props)
        {
            string xmlval = String.Empty;

            xmlval = "<" + containercolumn + ">{0}</" + containercolumn + ">";
            string xmlvalbody = String.Empty;
            foreach (var p in props)
            {
                string value = "";
                if (this.Data[p] != null)
                    if (!isaDate(p))
                        value = this.Data[p].ToString();
                    else
                    {
                        DateTime dvalue = Convert.ToDateTime(this.Data[p]);
                        value = String.Format("{0:s}", dvalue);
                     }
                xmlvalbody += "<" + p + ">" + value + "</" + p + ">";
            }
            xmlval = String.Format(xmlval, xmlvalbody);

            return xmlval;
        }

        public List<int> getParentLayerList(int layerid)  
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection()); 
            List<int> layers = new List<int>();

            var layerleaf = (from e in _context.Magic_ApplicationLayers where e.LayerID == layerid select e).FirstOrDefault();

            if (layerleaf== null)
            {
                layers.Add(layerid);
                return layers;
            }
            int? parentid = layerleaf.ParentLayer_ID;
            layers.Add(layerleaf.LayerID);
            while (parentid != null && parentid != 0)
            {
                var parlayer = (from e in _context.Magic_ApplicationLayers where e.LayerID == parentid select e).First();
                layers.Add((int)parentid);
                parentid = parlayer.ParentLayer_ID;
            }

            return layers;
        }
    }
}
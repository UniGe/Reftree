using System;
using System.Collections.Generic;
using System.Data;
using System.Dynamic;
using System.Linq;
using System.Net.Http;
using System.Web;
using MagicFramework.Models;


namespace MagicFramework.Helpers
{
    public  class BIMServerDataHandler
    {
        public const string sreference = "SReferenceDataValue";
        public const string sobject = "SDataObject";

        public Dictionary<string, List<string>> recursiveDownloadTypesAndProperties = new Dictionary<string, List<string>>();
        //key node to skip , value list of ifcTypes 
        public Dictionary<string, List<string>> recursiveDownloadSkipTypesAndProperties = new Dictionary<string, List<string>>();
        public Dictionary<string,string> downloadObjects { get; set; }
        public BIMServerDataHandler()
        {
            this.downloadObjects = new Dictionary<string, string>();
        }
        private bool hasToBeAddedToResult(dynamic dynamicObj)
        {
            //always download leaves!
            if (dynamicObj["stringValue"]!=null)
                return true;
            //Get RelatedBuildingElements for SpaceBoundaries in case typeName contains wall
            if (dynamicObj["fieldName"] == "RelatedBuildingElement" && dynamicObj["__type"] == sreference)
            {
                string typeName = dynamicObj["typeName"];
                if (!String.IsNullOrEmpty(typeName))
                {
                    if (typeName.ToLower().Contains("wall"))
                        return true;
                }
            }
            return false;            
        }
        public  void recurInObjects(dynamic data, string id, ref  BimServerObject parent, dynamic result, string uri, string connectionString, int level, ref HashSet<string> visited, string type)
        {
            string oid = result.oid.ToString();

            if (parent == null)
                //init result
                parent = new BimServerObject(result);

            level = level + 1;
            //get an object from the json string

            if ((visited.Contains(oid) && oid != "-1") || (downloadObjects.Keys.Contains(oid) && level > 1))
                return;

            visited.Add(result.oid.ToString());

            foreach (var value in result.values)
            {
                string val_oid = value.oid;
                string fieldname = value.fieldName;
                string currentType = value.typeName;
                
                if (DownloadMeasuresSkipSingleValue(level, fieldname, currentType, type))
                    continue;

                //if the the value is a goal value i get it and won't recur
                if (this.hasToBeAddedToResult(value))
                {
                    parent.values.Add(new BimServerObject(value));
                }
                    //recur in values maling http calls if value is just a reference
                else if (value.oid != "-1" && !downloadObjects.ContainsKey(val_oid) && !visited.Contains(val_oid))
                {
                    data.requestObject.request.parameters.oid = val_oid;
                    using (var client = new HttpClient())
                    {
                        using (StringContent payload = new StringContent(Newtonsoft.Json.JsonConvert.SerializeObject(data.requestObject), System.Text.Encoding.UTF8, "application/json"))
                        {
                            string httpresult = client.PostAsync(uri, payload).Result.Content.ReadAsStringAsync().Result;
                            dynamic res = Newtonsoft.Json.JsonConvert.DeserializeObject(httpresult);
                            BimServerObject newparent = new BimServerObject(res.response == null ? res : res.response.result);
                            if (this.DownloadMeasuresSkipArrayValue(newparent, res.response.result.values))
                                continue;
                            parent.values.Add(newparent);
                            recurInObjects(data, id, ref newparent, res.response == null ? res : res.response.result, uri, connectionString, level, ref visited, type);
                        }
                    }
                }
                else if (value.values != null)
                {
                    BimServerObject newparent = new BimServerObject(value);
                    if (this.DownloadMeasuresSkipArrayValue(newparent, value.values))
                        continue;
                    parent.values.Add(newparent);
                    recurInObjects(data, id, ref  newparent, value, uri, connectionString, level, ref visited, type);
                }
            }


        }
        private  bool DownloadMeasuresSkipSingleValue(int level, string fieldname, string currentType,string type)
        {
            if (level == 1)
            {
                List<string> fieldnames = this.recursiveDownloadTypesAndProperties[type];
                if (!fieldnames.Contains(fieldname))
                    return true;
            }
            if (!String.IsNullOrEmpty(fieldname))
                if (this.recursiveDownloadSkipTypesAndProperties.ContainsKey(fieldname))
                    if (this.recursiveDownloadSkipTypesAndProperties[fieldname].Contains(type))
                        return true;
            if (!String.IsNullOrEmpty(currentType))
                if (this.recursiveDownloadSkipTypesAndProperties.ContainsKey(currentType))
                    if (this.recursiveDownloadSkipTypesAndProperties[currentType].Contains(type))
                        return true;
            return false;
        }
        /// <summary>
        /// skips the object with  arrays recursion with a given criteria
        /// </summary>
        /// <param name="bimo"></param>
        /// <param name="values"></param>
        /// <returns></returns>
        private  bool DownloadMeasuresSkipArrayValue(BimServerObject bimo,dynamic values)
        {
            bool ret = false;
            if (bimo.type == "IfcRelSpaceBoundary" && bimo.__type == sobject)
            {
                ret = true;
                foreach (var v in values)
                {
                    if (v.__type != null && v.fieldName != null && v.typeName != null)
                    {
                        string typename = v.typeName.ToString();
                        //if it's a boundary of type Wall: it is the only case DON't skip
                        if (typename.ToLower().Contains("wall") && v.fieldName == "RelatedBuildingElement" && v.__type == sreference)
                            ret = false;
                    }
                }
            }

            return ret;
        }

    }
}
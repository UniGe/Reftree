using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{
    public class BimServerObject
    {
        public string oid { get; set; }
        public string __type { get; set; }
        public string type { get; set; }
        public string fieldName { get; set; }
        public string stringValue { get; set; }
        public string name { get; set; }
        public string typeName { get; set; }

        public List<BimServerObject> values { get; set; }

        public BimServerObject(dynamic value)
        {
            this.oid = value.oid;
            this.__type = value.__type;
            this.type = value.type;
            this.fieldName = value.fieldName;
            this.stringValue = value.stringValue;
            this.name = value.name;
            this.typeName = value.typeName;
            this.values = new List<BimServerObject>();
        }
        
    }
}
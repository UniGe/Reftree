using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{

    public class v_Magic_UIComponentsLabels
    {

        public int ID { get; set; }
        public string ContainerType { get; set; }
        public string Container { get; set; }
        public string ObjectType { get; set; }
        public int ObjectID { get; set; }
        public string defaultlabel { get; set; }
        public int? Magic_CultureID { get; set; }
        public string translation { get; set; }
        public int? Layer_ID { get; set; }
        public int? Label_ID { get; set; }

        public v_Magic_UIComponentsLabels(MagicFramework.Data.v_Magic_UIComponentsLabel A)
        {
            this.ID = A.ObjectID;
            this.ContainerType = A.ContainerType;
            this.Container = A.Container;
            this.ObjectType = A.ObjectType;
            this.ObjectID = A.ObjectID;
            this.defaultlabel = A.defaultlabel;
            this.Magic_CultureID = (int)(A.Magic_CultureID);
            this.translation = A.translation;
            this.Layer_ID = A.Layer_ID;
            this.Label_ID = A.Label_ID;
        }

    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{

    public class Magic_Mmb_ModuleLabels
    {

        public int ModuleLabel_ID { get; set; }
        public int Module_ID { get; set; }
        public int Magic_Culture_ID { get; set; }
        public string ModuleLabel { get; set; }
        public int? Layer_ID { get; set; }

        public Magic_Mmb_ModuleLabels(MagicFramework.Data.Magic_Mmb_ModuleLabel A)
        {
            this.ModuleLabel_ID = A.ModuleLabel_ID;
            this.Module_ID = A.Module_ID;
            this.Magic_Culture_ID = A.Magic_Culture_ID;
            this.ModuleLabel = A.ModuleLabel;
            this.Layer_ID = A.Layer_ID;
        }
    }
}

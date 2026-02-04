using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{

    public class Magic_Mmb_MenuLabels
    {

        public int MenuLabelID { get; set; }
        public int Menu_ID { get; set; }
        public int Magic_Culture_ID { get; set; }
        public string MenuLabel { get; set; }
        public int? Layer_ID { get; set; }

        public Magic_Mmb_MenuLabels(MagicFramework.Data.Magic_Mmb_MenuLabel A)
        {
            this.MenuLabelID = A.MenuLabelID;
            this.Menu_ID = A.Menu_ID;
            this.Magic_Culture_ID = A.Magic_Culture_ID;
            this.MenuLabel = A.MenuLabel;
            this.Layer_ID = A.Layer_ID;
        }
    }
}

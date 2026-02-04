using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{

    public class Magic_FunctionsLabels
    {

        public int FunctionLabel_ID { get; set; }
        public int Function_ID { get; set; }
        public int Magic_Culture_ID { get; set; }
        public string FunctionDescription { get; set; }
        public string FunctionHelp { get; set; }
        public string FunctionName { get; set; }
        public int? Layer_ID { get; set; }

        public Magic_FunctionsLabels(MagicFramework.Data.Magic_FunctionsLabel A)
        {
            this.FunctionLabel_ID = A.FunctionLabel_ID;
            this.Function_ID = A.Function_ID;
            this.Magic_Culture_ID = (int)(A.Magic_Culture_ID);
            this.FunctionDescription = A.FunctionDescription;
            this.FunctionHelp = A.FunctionHelp;
            this.FunctionName = A.FunctionName;
            this.Layer_ID = A.Layer_ID;
        }
    }
}

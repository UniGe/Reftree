using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MagicFramework.Models.Kendo
{
    public class Filter
    {
        public string field { get; set; }
        public string Operator { get; set; }
        public string value { get; set; }
        public string logic { get; set; }
        public Filter[] filters { get; set; }
    }
}

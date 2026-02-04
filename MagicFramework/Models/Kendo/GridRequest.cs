using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MagicFramework.Models.Kendo
{
    public class GridRequest
    {
        public Filter filter { get; set; }
        public int take { get; set; }
        public int skip { get; set; }
        public Sort[] sort { get; set; }
        public int page { get; set; }
    }
}

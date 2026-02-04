using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{
    public class RequestAutocomplete
    {
        public int take { get; set; }
        public List<Sort> sort { get; set; }
        public Filters filter { get; set; }
        public int layerID { get; set; }
        public string  EntityName { get; set; }
        public int functionID { get; set; }
        public string DataSourceCustomParam  {get;set;}
        public string operation { get; set;}
        public string[] Columns { get; set; }
        public string data { get; set; } //JSON string data (es. callXml stored pars)
        public string GridName { get; set; }
        public string MergedScenario { get; set; }
    }

  
}
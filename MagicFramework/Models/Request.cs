using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{
    public class Request
    {
        public int take { get; set; }
        public int skip { get; set; }
        public int page { get; set; }
        public List<Sort> sort { get; set; }
        public Filters filter { get; set; }
        public List<Group> group { get; set; }
        public int layerID { get; set; }
        public string EntityName { get; set; }
        public int functionID { get; set; }
        public string DataSourceCustomParam { get; set; }
        public string operation { get; set; }
        public string Model { get; set; }  // to be deserialized as a dynamic object
        public string[] Columns { get; set; }
        public string data { get; set; } //JSON string data (es. callXml stored pars)
        public string GridName { get; set; }
        public string MergedScenario { get; set; }
        public Aggregations[] aggregations { get; set; }
        public string[] groupBy { get; set; }
        public Dictionary<string, DocumentSearch> DocumentSearch { get; set; }
        public Request() { }
        public Request(RequestAutocomplete r)
        {
            this.Columns = r.Columns;
            this.data = r.data;
            this.DataSourceCustomParam = r.DataSourceCustomParam;
            this.EntityName = r.EntityName;
            this.filter = r.filter;
            this.MergedScenario = r.MergedScenario;
            this.functionID = r.functionID;
            this.layerID = r.layerID;
            this.operation = r.operation;
            this.sort = r.sort;
            this.take = 1000;
         }

    }
   
    public class Aggregations
    {
        public string column { get; set; }
        public string[] functions { get; set; }
    }

    public class KeyValue
    {
        public string value { get; set; }
    }

    public class Group
    {
        public string field { get; set; }
        public string dir { get; set; }
        public List<Aggregate> aggregates { get; set; }
    }

    public class Aggregate
    {
        public string field { get; set; }
        public string aggregate { get; set; }
    }

    public class Sort
    {
        public string field { get; set; }
        public string dir { get; set; }
    }

    public class Filters
    {
        public string field { get; set; }
        public string Operator { get; set; }
        public string _value { get; set; }
        public string value
        {
            get{return replacePlaceholders(_value);}
            set { _value = value; }
        }
        public List<Filters> filters { get; set; }
        public string logic { get; set; }
        public Filters()
        {
        
        }
        public Filters(dynamic filter)
        {
            this.filters = new List<Filters>();
            if (filter.logic == null)
            {
                this.logic = "AND";
            }
            else
                this.logic = filter.logic;
            if (filter.filters != null)
            {
                foreach (var f in filter.filters)
                {
                    this.filters.Add(new Filters(f, true));
                }
            }
            else {
                this.filters.Add(new Filters(filter, true));
            }
        }

        public Filters(dynamic filter, bool notFirstLevel)
        {
            if (filter.filters == null)
            {
                if (filter.@operator != null && filter.field != null)
                {
                    this.Operator = filter["operator"].ToString();
                    this.value = filter["value"].ToString();
                    this.field = filter["field"].ToString();
                }
            }
            else
            {
                if (filter.logic == null)
                {
                    this.logic = "AND";
                }
                else
                    this.logic = filter.logic;
                this.filters = new List<Filters>();
                foreach (var f in filter.filters)
                {
                    this.filters.Add(new Filters(f, true));
                }
            }
        }

        private string replacePlaceholders(string value)
        {
            switch(value){
                case "[userId]":
                    value = MagicFramework.Helpers.SessionHandler.IdUser.ToString();
                    break;
            }

            return value;
        }
    }

    public class DocumentSearch
    {
        public string SavePath { get; set; }
        public string SearchText { get; set; }
    }
}
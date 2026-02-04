using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;

namespace MagicFramework.Models
{
    public class TreeModelParser
    {
        public string Name {get;set;}
        public string Description {get;set;}
        public int MagicTree_ID { get; set; }
        public string DataSourceRead { get; set; }
        public string DataSourceCustomJSONParam  {get;set;}
        public string DataSourceFilter  {get;set;}
        public bool StartExpanded  {get;set;}
        public bool? DraggableNodes  {get;set;}
        public string NodesItemTemplate { get; set; }
        public string OnDragStartJSFunction { get; set; }
        public string OnDragEndJSFunction { get; set; }
        public string OnSelectNodeJSFunction { get; set; }
        public string ContainerCss { get; set; }
        public string BaseEntityName { get; set; }


        public TreeModelParser(string treecode)
        {
            Data.MagicDBDataContext _context = new DBConnectionManagerBuilder(DBConnectionManager.GetMagicConnection())._magidbcontext;

            var thetree = (from e in _context.Magic_Trees where e.MagicTreeName == treecode select e).FirstOrDefault();

            this.BaseEntityName = thetree.FromTable;
            this.ContainerCss = thetree.TreeContainerCssClass;
            this.DataSourceCustomJSONParam = thetree.Magic_DataSource.CustomJSONParam;
            this.DataSourceFilter = thetree.Magic_DataSource.Filter;
            this.DataSourceRead = thetree.Magic_DataSource.ObjRead;
            this.Description = thetree.MagicTreeDescription;
            this.DraggableNodes = thetree.DraggableNodes;
            this.MagicTree_ID = thetree.ID;
            this.Name = treecode;
            this.NodesItemTemplate = thetree.NodesItemTemplate;
            this.OnDragEndJSFunction = thetree.OnDragEndJSFunction;
            this.OnDragStartJSFunction = thetree.OnDragStartJSFunction;
            this.OnSelectNodeJSFunction = thetree.OnSelectNodeJSFunction;
            this.StartExpanded = thetree.StartExpanded;
            
        }

        public TreeModelParser(Data.Magic_Trees thetree)
        {
          
            this.BaseEntityName = thetree.FromTable;
            this.ContainerCss = thetree.TreeContainerCssClass;
            this.DataSourceCustomJSONParam = thetree.Magic_DataSource.CustomJSONParam;
            this.DataSourceFilter = thetree.Magic_DataSource.Filter;
            this.DataSourceRead = thetree.Magic_DataSource.ObjRead;
            this.Description = thetree.MagicTreeDescription;
            this.DraggableNodes = thetree.DraggableNodes;
            this.MagicTree_ID = thetree.ID;
            this.Name = thetree.MagicTreeName;
            this.NodesItemTemplate = thetree.NodesItemTemplate;
            this.OnDragEndJSFunction = thetree.OnDragEndJSFunction;
            this.OnDragStartJSFunction = thetree.OnDragStartJSFunction;
            this.OnSelectNodeJSFunction = thetree.OnSelectNodeJSFunction;
            this.StartExpanded = thetree.StartExpanded;

        }

    }


}
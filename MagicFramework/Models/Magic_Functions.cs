using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;

namespace MagicFramework.Models
{

    public class Magic_Functions
    {
        public int FunctionID { get; set; }
        public string FunctionName { get; set; }
        public string FunctionBaseUrl { get; set; }
        public string FunctionJsScript { get; set; }
        public string FunctionQsParameters { get; set; }
        public string FunctionDescription { get; set; }
        public string FunctionHelp { get; set; }
        public string rootGrids { get; set; }
        public string rootGridTitles { get; set; }
        public string TreeDefinition { get; set; }
        public string htmldiv { get; set; }
        public string FromTable { get; set; }
        public string FromClass { get; set; }
        public bool isSystemFunction { get; set; }
        public string FunctionNameDescription { get; set; }
        public int? Layer_ID { get; set; }
        public string Help { get; set; }
        public string rootGridIDs { get; set; }
        public string FunctionJSDeps { get; set; }
        public System.Guid? HelpGUID { get; set; }

        public Magic_Functions(dynamic obj)
        {
            dynamic A = obj[0];

            this.FunctionID = A.FunctionID;
            this.FunctionName = A.FunctionName;
            this.FunctionBaseUrl = A.FunctionBaseUrl;
            this.FunctionJsScript = A.FunctionJsScript;
            this.FunctionQsParameters = A.FunctionQsParameters;
            this.FunctionDescription = A.FunctionDescription;
            this.FunctionHelp = A.FunctionHelp;
            this.FromClass = A.FromClass;
            this.FromTable = A.FromTable;
            this.isSystemFunction = (bool)A.isSystemFunction;
            this.Layer_ID = (int)(A.Layer_ID ?? 0);
            this.FunctionNameDescription = A.FunctionNameDescription;
            this.TreeDefinition = A.TreeDefinition;
            this.rootGrids = A.rootGrids;
            this.rootGridIDs = A.rootGridIDs;
            this.htmldiv = A.htmldiv;
            this.rootGridTitles = A.rootGridTitles;
            this.Help = A.Help;
            this.FunctionJSDeps = A.FunctionJSDeps;
            this.HelpGUID = A.HelpGUID;
        }

        public Magic_Functions(MagicFramework.Data.Magic_Functions A)
        {
            this.FunctionID = A.FunctionID;
            this.FunctionName = A.FunctionName;
            this.FunctionBaseUrl = A.FunctionBaseUrl;
            this.FunctionJsScript = A.FunctionJsScript;
            this.FunctionQsParameters = A.FunctionQsParameters;
            this.FunctionDescription = A.FunctionDescription;
            this.FunctionHelp = A.FunctionHelp;
            this.FromClass = A.FromClass;
            this.FromTable = A.FromTable;
            this.isSystemFunction = (bool)A.isSystemFunction;
            this.Layer_ID = (int)(A.Layer_ID ?? 0);
            this.FunctionNameDescription = A.FunctionName;
            this.FunctionJSDeps = A.FunctionJSDeps;
            this.TreeDefinition = null;
            this.HelpGUID = A.HelpGUID;
            //se alla funzione e' associato un tree ne tiro su definizione e DataSource
            var tree = A.Magic_FunctionTrees.FirstOrDefault();
            if (tree != null)
            {
                dynamic treeobj = new System.Dynamic.ExpandoObject();
                treeobj.Name = tree.Magic_Trees.MagicTreeName;
                treeobj.Description = tree.Magic_Trees.MagicTreeDescription;
                treeobj.MagicTree_ID = tree.MagicTree_ID;
                treeobj.DataSourceRead = tree.Magic_Trees.Magic_DataSource.ObjRead;
                treeobj.DataSourceCustomJSONParam = tree.Magic_Trees.Magic_DataSource.CustomJSONParam;
                treeobj.DataSourceFilter = tree.Magic_Trees.Magic_DataSource.Filter;
                treeobj.StartExpanded = tree.Magic_Trees.StartExpanded;
                treeobj.DraggableNodes = tree.Magic_Trees.DraggableNodes;
                treeobj.NodesItemTemplate = tree.Magic_Trees.NodesItemTemplate;
                treeobj.OnDragStartJSFunction = tree.Magic_Trees.OnDragStartJSFunction;
                treeobj.OnDragEndJSFunction = tree.Magic_Trees.OnDragEndJSFunction;
                treeobj.OnSelectNodeJSFunction = tree.Magic_Trees.OnSelectNodeJSFunction;
                treeobj.ContainerCss = tree.Magic_Trees.TreeContainerCssClass;
                treeobj.BaseEntityName = tree.Magic_Trees.FromTable;
                this.TreeDefinition = Newtonsoft.Json.JsonConvert.SerializeObject(treeobj);
            }

            int i = 0;
            foreach (var l in A.Magic_FunctionsGrids.OrderBy(l=>l.OrdinalPosition))
            {
                if (l.isRoot == true)
                {
                    this.rootGrids += "|" + l.Magic_Grids.MagicGridName;
                    this.rootGridIDs += "|" + l.Magic_Grids.GUID;
                    this.htmldiv += "|" + (l.AppendToDiv == null ? ("grid" + (i.ToString() == "0" ? "" : i.ToString())) : l.AppendToDiv);
                    this.rootGridTitles += "|" + (l.FunctionGridTitle == null ? "" : l.FunctionGridTitle);
                    i++;
                }
             }
            try
            {
                HelpHandler hh = new HelpHandler();
                this.Help = Newtonsoft.Json.JsonConvert.SerializeObject(hh.GetHelpObject("function", this.FunctionID.ToString()));
            }
            catch
            {
                this.Help = null;
            }
        }

        public static int GetIDFromGUID(string GUID)
        {
            Guid g = new Guid(GUID);
            return GetIDFromGUID(g);
        }

        public static int GetIDFromGUID(Guid GUID)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            return context.Magic_Functions.Where(f => f.GUID == GUID).FirstOrDefault().FunctionID;
        }

        public static Guid? GetGUIDFromID(int ID)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            return context.Magic_Functions.Where(f => f.FunctionID == ID).FirstOrDefault().GUID;
        }

        public static int GetIDFromGridPayload(dynamic data)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            int? functionid;
            string function = data.functionname;
            string fid = data.functionid.ToString();
            Guid functionGUID;
            if (Guid.TryParseExact(fid, "D", out functionGUID))
                functionid = Models.Magic_Functions.GetIDFromGUID(functionGUID);
            else
                functionid = int.Parse(fid);

            //caso in cui la API di creazione delle griglie getrootgrid sia stata chiamata programmaticamente da js specificando un functioname ma non l' id della funzione 
            if (functionid == -1 && function != "standard")
            {
                functionid = (from e in context.Magic_Functions where e.FunctionName == function select e.FunctionID).FirstOrDefault();
                if (functionid == null)
                {
                    functionid = (from e in context
                                      .Magic_FunctionsLabels
                                  where e.Magic_Culture_ID == MagicFramework.Helpers.SessionHandler.UserCulture && e.FunctionName == function
                                  select e.Function_ID).FirstOrDefault();
                }
            }
            if (function == "standard")
                functionid = -1;

            return functionid == null ? -1 : (int)functionid;

        }
    }
}

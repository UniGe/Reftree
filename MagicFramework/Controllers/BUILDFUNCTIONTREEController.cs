using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using AttributeRouting.Web.Http;
using System.Linq.Dynamic;
using System.Configuration;
using Newtonsoft.Json.Linq;
using System.Diagnostics;
using MagicFramework.Helpers;


namespace MagicFramework.Controllers
{
    public class BUILDFUNCTIONTREEController :ApiController
    {


        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
        private HashSet<int> loadedgridsinrecursion = new HashSet<int>();


        /// <summary>
        /// Update the scope-overrides of a grid into function
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        public string PostUpdateGridOverridesInFunction(dynamic data)
        {

            int gridid = data.MagicGrid_ID;
            int? datasourceid = data.MagicDataSource_ID == "" ? null : data.MagicDataSource_ID;
            string detailtemplate = data.DetailTemplate == "N/A" ? null : data.DetailTemplate;
            string editabletemplate = data.EditableTemplate == "N/A" ? null : data.EditableTemplate;
            string sortable = data.Sortable == "" ? null : data.Sortable;
            string groupable = data.Groupable == "" ? null : data.Groupable;
            string toolbar = data.CustomToolbar == "" ? null : data.CustomToolbar;
            string command = data.CustomCommand == "" ? null : data.CustomCommand;
            string editable = data.Editable == "" ? null : data.Editable;
            string div = data.HTMLDiv;
            int functionid = data.MagicFunction_ID;

            var defaultgrid = (from e in _context.Magic_Grids where e.MagicGridID == gridid select e).FirstOrDefault();

            var mg = (from e in _context.Magic_FunctionsGrids where e.MagicFunction_ID==functionid && e.MagicGrid_ID == gridid select e).FirstOrDefault();
            //se nella functiongrids non c'e' lo creo
            if (mg == null)
            {
                var funcgrid = new Data.Magic_FunctionsGrids();
                funcgrid.AppendToDiv = div;
                funcgrid.CommandColumn = command;
                funcgrid.DetailTemplateOverride = detailtemplate;
                funcgrid.EditTemplateOverride = editabletemplate;
                funcgrid.Editable = editable;
                funcgrid.Groupable = groupable;
                funcgrid.isRoot = false;
                funcgrid.MagicDataSource_ID = datasourceid;
                funcgrid.MagicFunction_ID = functionid;
                funcgrid.MagicGrid_ID = gridid;
                _context.Magic_FunctionsGrids.InsertOnSubmit(funcgrid);
                _context.SubmitChanges();
                mg = (from e in _context.Magic_FunctionsGrids where e.MagicFunction_ID == functionid && e.MagicGrid_ID == gridid select e).FirstOrDefault();
               
            }
                bool refreshtemplates = false;
                if (detailtemplate != mg.DetailTemplateOverride && detailtemplate != defaultgrid.DetailTemplate && detailtemplate != null)
                    refreshtemplates = true;

                //scrivo il valore dell' override solo se e' differente dal default

                if (defaultgrid.Toolbar != toolbar)
                    mg.Toolbar = toolbar;
                else
                    mg.Toolbar = null;
                if (defaultgrid.MagicGridColumnsCommand != command)
                    mg.CommandColumn = command;
                else
                    mg.CommandColumn = null;
                if (defaultgrid.DetailTemplate != detailtemplate && detailtemplate != null)
                    mg.DetailTemplateOverride = detailtemplate;
                else
                    mg.DetailTemplateOverride = null;
                if (defaultgrid.EditableTemplate != editabletemplate && editabletemplate != null)
                    mg.EditTemplateOverride = editabletemplate;
                else
                    mg.EditTemplateOverride = null;
                if (defaultgrid.Editable != editable)
                    mg.Editable = editable;
                else
                    mg.Editable = null;
                if (defaultgrid.Sortable != sortable)
                    mg.Sortable = sortable;
                else
                    defaultgrid.Sortable = null;
                if (defaultgrid.Groupable != groupable)
                    mg.Groupable = groupable;
                else
                    mg.Groupable = null;
                if (defaultgrid.MagicDataSource_ID != datasourceid)
                    mg.MagicDataSource_ID = datasourceid;
                else
                    mg.MagicDataSource_ID = null;
                mg.MagicGrid_ID = gridid;
                mg.AppendToDiv = div;
                mg.MagicFunction_ID = functionid;

                //svuoto il buffer di funzione perche' ho creato degli override sulla griglia
                var funct = (from e in _context.Magic_Functions where e.FunctionID == functionid select e).First();
                _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(funct.Magic_TemplateScriptsBuffer);
                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                _context.SubmitChanges();
                if (refreshtemplates)
                {
                    var builder = new BUILDFUNCTIONTREEController();
                    var json = builder.RefreshFunctionTemplateList(functionid, "create", null);
                }
            
            return "ok";

        }
        /// <summary>
        /// Append grid to function with scoped overrides 
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        public string PostInsertGridAndOverridesInFunction(dynamic data)
        {

            int gridid = data.MagicGrid_ID;

            var defaultgrid = (from e in _context.Magic_Grids where e.MagicGridID == gridid select e).FirstOrDefault();

            int? datasourceid = data.MagicDataSource_ID == "" ? null : data.MagicDataSource_ID;
            string detailtemplate = data.DetailTemplate == "N/A" ? null : data.DetailTemplate;
            string editabletemplate = data.EditableTemplate == "N/A" ? null : data.EditableTemplate;
            string sortable = data.Sortable == "" ? null : data.Sortable;
            string groupable = data.Groupable == "" ? null : data.Groupable;
            string toolbar = data.CustomToolbar == "" ? null : data.CustomToolbar;
            string command = data.CustomCommand == "" ? null : data.CustomCommand;
            string editable= data.Editable == "" ? null : data.Editable;
            string div = data.HTMLDiv;
            int functionid = data.MagicFunction_ID;


            var mg = new Data.Magic_FunctionsGrids();

            bool refreshtemplates = false;
            if (detailtemplate != mg.DetailTemplateOverride && detailtemplate != defaultgrid.DetailTemplate && detailtemplate!=null)
                refreshtemplates = true;

            //scrivo il valore dell' override solo se e' differente dal default
            if (defaultgrid.Toolbar != toolbar)
                mg.Toolbar = toolbar;
            else
                mg.Toolbar = null;
            if (defaultgrid.MagicGridColumnsCommand != command)
                mg.CommandColumn = command;
            else
                mg.CommandColumn = null;
            if (defaultgrid.DetailTemplate != detailtemplate && detailtemplate!= null)
                mg.DetailTemplateOverride = detailtemplate;
            else
                mg.DetailTemplateOverride = null;
            if (defaultgrid.EditableTemplate != editabletemplate && editabletemplate!=null)
                mg.EditTemplateOverride = editabletemplate;
            else
                mg.EditTemplateOverride = null;
            if (defaultgrid.Editable != editable)
                mg.Editable = editable;
            else
                mg.Editable = null;
            if (defaultgrid.Sortable != sortable)
                mg.Sortable = sortable;
            else 
                defaultgrid.Sortable = null;
            if (defaultgrid.Groupable != groupable)
                mg.Groupable = groupable;
            else
                mg.Groupable = null;
            if (defaultgrid.MagicDataSource_ID != datasourceid)
                mg.MagicDataSource_ID = datasourceid;
            else
                mg.MagicDataSource_ID = null;

            mg.MagicGrid_ID = gridid;
            mg.AppendToDiv = div;
            mg.MagicFunction_ID = functionid;
            mg.isRoot = data.isroot;

            _context.Magic_FunctionsGrids.InsertOnSubmit(mg);
            _context.SubmitChanges();

            if (refreshtemplates)
            {   
                var builder = new BUILDFUNCTIONTREEController();
                var json = builder.RefreshFunctionTemplateList(functionid, "create", null);
            }
            return "ok";

        }

        [HttpPost]
        public string PostRemoveGridFromFunction(dynamic data)
        {
            int gridid = data.gridid;

            var defaultgrid = (from e in _context.Magic_Grids where e.MagicGridID == gridid select e).FirstOrDefault();

            int functionid = data.functionid;

            var entity = (from e in _context.Magic_FunctionsGrids where e.MagicFunction_ID == functionid && e.MagicGrid_ID == gridid select e).FirstOrDefault();

            if (entity != null)
            {
                _context.Magic_FunctionsGrids.DeleteOnSubmit(entity);
                _context.SubmitChanges();

                var builder = new BUILDFUNCTIONTREEController();
                var json = builder.RefreshFunctionTemplateList(functionid, "create", null);
            }
            return "ok";

        }

      //builds the recursive function structure representation
        [HttpPost]
        public string PostBuildFunctionTree(dynamic data)
        {

            JObject obj = JObject.Parse(data.ToString());

            int rootgridid = 0;

            int functionid = (int)obj["functionid"];

            string JSON = String.Empty;
            if (obj["rootgridid"] != null)
                rootgridid = (int)obj["rootgridid"];
            else {
                JSON = "NODBDEF";
             return JSON;
            }

            var grid = (from e in _context.Magic_Grids where e.MagicGridID == rootgridid select e).FirstOrDefault();

            JSON += recurinGrid(grid, JSON, null, functionid,true,false,true);
           
            return JSON;

        }

        
        /// <summary>
        /// Crea i buffer relativi alle funzioni censite in Magic_Functions: funziona solo se le griglie sono esplicitamente legate alle funzioni in
        /// Magic_FunctionsGrids
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage PostCreateFunctionBuffers()
        {
            HttpResponseMessage response = new HttpResponseMessage();

            try
            {

                var listoffuncs = (from e in _context.Magic_Functions select e);
                foreach (var f in listoffuncs)
                {
                    string JSON = String.Empty;
                    int? root = f.Magic_FunctionsGrids.Where(l => l.isRoot == true).FirstOrDefault().MagicGrid_ID  ?? 0;


                    var grid = (from e in _context.Magic_Grids where e.MagicGridID == root select e).FirstOrDefault();

                    JSON += recurinGrid(grid, JSON, null, f.FunctionID, true, false, true);

                    new MagicFramework.Helpers.TemplateContainerBuilder().FilltemplatecontainerForFunction(f.FunctionID);
                }
            }
            catch (Exception ex)
            {   
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("Error building buffer function {0}",ex.Message));
               
            }
            response.StatusCode = HttpStatusCode.OK;
            return response;

        }

      
        public string RefreshFunctionTemplateList(int  functionid,string action,int? deassociatedgrid)
        {
            loadedgridsinrecursion.Clear();
            bool create = false;
            bool buildui = false;
        
            if (action == "create")
                create = true;
            else buildui = true;
          
            string JSON = String.Empty;
            var rootgrids = (from e in _context.Magic_FunctionsGrids where e.MagicFunction_ID == functionid select e);
            var functiontempl = (from e in _context.Magic_FunctionsTemplates where e.MagicFunction_ID == functionid && e.ManualInsertion==false  select e);
            _context.Magic_FunctionsTemplates.DeleteAllOnSubmit(functiontempl);
            _context.SubmitChanges();
            Debug.WriteLine(functionid.ToString());
         
            foreach (var g in rootgrids)
                if (g.MagicGrid_ID != deassociatedgrid)
                    JSON += recurinGrid(g.Magic_Grids, JSON, null, functionid, true,create,buildui);

            _context.SubmitChanges();
            return JSON;

        }
        public void insertfunctiontemplate(int functionid, int templateid)
        {
            var tempindb = (from e in _context.Magic_FunctionsTemplates where e.MagicFunction_ID == functionid && e.MagicTemplate_ID == templateid select e).FirstOrDefault();
            if (tempindb == null)
            {
                Data.Magic_FunctionsTemplates ft = new Data.Magic_FunctionsTemplates();
                ft.MagicFunction_ID = functionid;
                ft.MagicTemplate_ID = templateid;
                ft.ManualInsertion = false;
                _context.Magic_FunctionsTemplates.InsertOnSubmit(ft);
                

            }
        }
        public string generateGridRow(Data.Magic_Grids grid, string JSON, Data.Magic_TemplateGroups tabtemp, int functionid, bool gridisvisibleinfunction,string tempappend,string tabname,Uri MyUrl)
        {
            int? datasourceid = grid.Magic_FunctionsGrids.Where(x => x.MagicFunction_ID == functionid && x.MagicGrid_ID == grid.MagicGridID).Select(e => e.MagicDataSource_ID).FirstOrDefault();
            datasourceid = datasourceid == null ? grid.MagicDataSource_ID : datasourceid;
            string editabletemplate = grid.Magic_FunctionsGrids.Where(x => x.MagicFunction_ID == functionid && x.MagicGrid_ID == grid.MagicGridID).Select(e => e.EditTemplateOverride).FirstOrDefault();
            editabletemplate = editabletemplate == null ? grid.EditableTemplate : editabletemplate;
            string dettemplate = grid.Magic_FunctionsGrids.Where(x => x.MagicFunction_ID == functionid && x.MagicGrid_ID == grid.MagicGridID).Select(e => e.DetailTemplateOverride).FirstOrDefault();
            dettemplate = dettemplate == null ? grid.DetailTemplate : dettemplate;
            int detailtemplateid = (from e in _context.Magic_Templates where e.MagicTemplateName == dettemplate select e.MagicTemplateID).FirstOrDefault();
            int editabletemplateid = (from e in _context.Magic_Templates where e.MagicTemplateName == editabletemplate select e.MagicTemplateID).FirstOrDefault();
            string sortable = grid.Magic_FunctionsGrids.Where(x => x.MagicFunction_ID == functionid && x.MagicGrid_ID == grid.MagicGridID).Select(e => e.Sortable).FirstOrDefault();
            sortable = sortable == null ? grid.Sortable : sortable;
            string groupable = grid.Magic_FunctionsGrids.Where(x => x.MagicFunction_ID == functionid && x.MagicGrid_ID == grid.MagicGridID).Select(e => e.Groupable).FirstOrDefault();
            string toolbar = grid.Magic_FunctionsGrids.Where(x => x.MagicFunction_ID == functionid && x.MagicGrid_ID == grid.MagicGridID).Select(e => e.Toolbar).FirstOrDefault();
            toolbar = toolbar != null ? toolbar.Replace("\"", "'") : "";
            toolbar = toolbar == "" ? (grid.Toolbar != null ? grid.Toolbar.Replace("\"", "'") : "") : toolbar;
            string columncommand = grid.Magic_FunctionsGrids.Where(x => x.MagicFunction_ID == functionid && x.MagicGrid_ID == grid.MagicGridID).Select(e => e.CommandColumn).FirstOrDefault();
            columncommand = columncommand != null ? columncommand.Replace("\"", "'") : "";
            columncommand = columncommand == "" ? (grid.MagicGridColumnsCommand != null ? grid.MagicGridColumnsCommand.Replace("\"", "'") : "") : columncommand;
            string editable = grid.Magic_FunctionsGrids.Where(x => x.MagicFunction_ID == functionid && x.MagicGrid_ID == grid.MagicGridID).Select(e => e.Editable).FirstOrDefault();
            editable = editable == null ? grid.Editable : editable;
            string appendtodiv = grid.Magic_FunctionsGrids.Where(x => x.MagicFunction_ID == functionid && x.MagicGrid_ID == grid.MagicGridID).Select(e => e.AppendToDiv).FirstOrDefault();

            string filter = String.Empty;
            if (tabtemp != null && tabtemp.BindedGridFilter != null)
            {
                filter = tabtemp.BindedGridFilter;
                filter = filter.Replace('"', ' ');
            }
            string datasourcetoappend = "\"\"";
            if (datasourceid != null)
                datasourcetoappend = datasourceid.ToString();

            string ret = "{enabled:" + (gridisvisibleinfunction == true ? "true," : "false,") + "gridtoopenonclick:\"Magic_Grid\", gridid:" + grid.MagicGridID + ", detailtemplateid:" + detailtemplateid + ", editabletemplateid:" + editabletemplateid + ",   parenttabid:" + tempappend + ",gridname:\"" + grid.MagicGridName + "\",name:\"" + tabname + "GRID::" + grid.MagicGridName + "\" ,type:\"GRID\", expanded:true,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/grid.png\",datasourceid:" + datasourcetoappend + ",AppendToDiv:\"" + appendtodiv + "\",CommandColumn:\"" + columncommand + "\", Sortable:\"" + sortable + "\",Editable:\"" + editable + "\",Groupable:\"" + groupable + "\",Toolbar:\"" + toolbar + "\", EditableTemplate:\"" + editabletemplate + "\",DetailTemplate:\"" + dettemplate + "\",filter:\"" + filter + "\", items:[";
            return ret;
        }

        public string generateColumnRow(string tempappend,Uri MyUrl)
        {
            string ret = "{gridtoopenonclick:\"Magic_Columns\",  parenttabid:" + tempappend + ",name:\"GRID COLUMNS\" ,id:-1 ,type:\"COLUMNSET\", expanded:false,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/gridcols.png\", items:[";
            return ret;
        }

        public string generateColumnDetailRow(Data.Magic_Columns col,Uri MyUrl)
        {
            string proptype = "COLUMN";
            string required = String.Empty;
            string editablecol = String.Empty;
            string columntemplate = String.Empty;
            string columnvisible = String.Empty;

            if (col.Columns_visibleingrid)
                columnvisible = "true";
            else
                columnvisible = "false";

            if ((col.Schema_required == null) ? false : true)
                required = "true";
            else
                required = "false";

            if (col.Schema_editable)
                editablecol = "true";
            else
                editablecol = "false";
            string ret = "{enabled:" + columnvisible + ",Schema_required:" + required + ",Schema_nullable:\"" + col.Schema_nullable + "\",Editable:" + editablecol + ",Isprimary:" + col.Isprimary + ",gridtoopenonclick:\"Magic_Columns\",name:\"" + col.ColumnName + "\",columnid:" + col.MagicColumnID + ",type:\"" + proptype + "\", expanded:false,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/column.png\"}";
              return ret;     
        }

        public string getEditTemplate(string stdedittemplate,bool buildui,int functionid, int gridid)
        {
            string edittemplate = stdedittemplate;

            if (buildui) // solo se sto costruendo l' albero per la visualizzazione  mostro gli override al posto dei template standard
            {
                var edittempfunctover = (from e in _context.Magic_FunctionsGrids where e.MagicFunction_ID == functionid && e.MagicGrid_ID == gridid select e.EditTemplateOverride).FirstOrDefault();
                edittemplate = edittempfunctover != null ? edittempfunctover : stdedittemplate;

            }

            return edittemplate;
        }

        public string getDetailTemplate(string stddetailtemplate, int functionid,bool buildui, int gridid)
        {
            string detailtemplate = stddetailtemplate;

            if (buildui) // solo se sto costruendo l' albero per la visualizzazione  mostro gli override al posto dei template standard
            {
                var detailtempfunctover = (from e in _context.Magic_FunctionsGrids where e.MagicFunction_ID == functionid && e.MagicGrid_ID == gridid select e.DetailTemplateOverride).FirstOrDefault();
                detailtemplate = detailtempfunctover != null ? detailtempfunctover : stddetailtemplate;

            }

            return detailtemplate;
        }

        public void insertTemplatesIntoDB(bool buildtemplatetree, Data.Magic_Templates edittemplate, Data.Magic_Templates detailtemplate, int functiondid)
        {
            if (buildtemplatetree)
            {
                if (edittemplate!=null)
                    insertfunctiontemplate(functiondid, edittemplate.MagicTemplateID);
                if (detailtemplate!=null)
                    insertfunctiontemplate(functiondid, detailtemplate.MagicTemplateID);
            }
        }
        public string generateEditTemplateRow(Data.Magic_Templates editabletemplateobj,Uri MyUrl)
        {
            string ret = "{gridtoopenonclick:\"Magic_Templates\",name:\"EDIT TEMPLATE::" + editabletemplateobj.MagicTemplateName + "\",templateid:" + editabletemplateobj.MagicTemplateID + ",id:" + editabletemplateobj.MagicTemplateID + ",type:\"" + editabletemplateobj.Magic_TemplateTypes.MagicTemplateType + "\", expanded:false,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/POPUPEDITOR.png\", items:[";
            return ret;
        }

        public string generateEditTemplateGroupRow(Data.Magic_TemplateGroups tg,int functionid,Uri MyUrl)
        {
            bool? groupenabled = true;
            if (tg.Magic_TemplateGroupsFunctionOverrides.Count > 0)
            {
                var funcover = tg.Magic_TemplateGroupsFunctionOverrides.Where(t => t.Function_ID == functionid).FirstOrDefault();
                if (funcover != null)
                    groupenabled = funcover.IsvisibleforFunction;
            }
            string ret = "{enabled:" + (groupenabled == true ? "true," : "false,") + "gridtoopenonclick:\"Magic_TemplateGroups\",name:\"TAB::" + tg.MagicTemplateGroupLabel + "-->" + tg.Magic_TemplateGroupContent.MagicTemplateGroupContentType + "\", imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/" + tg.Magic_TemplateGroupContent.MagicTemplateGroupContentType + ".png\",templategroupid:" + tg.MagicTemplateGroupID + ",type:\"" + tg.Magic_TemplateGroupContent.MagicTemplateGroupContentType + "\", items:[";
            return ret;          
        }
        public string generateEditTemplateDetailRow(int functionid, string magicdatasource, string magicdatasourcetextfield, string magicdatasourcevaluefield, string columnname, int magictemplatedetailid, int? magicdataroleid, bool? detailisvisible,bool? overisvisible,int? overdataroleid,  Uri MyUrl)
        {
            string dettype = "COLUMNEDIT";
            bool? detailenabled = null;
            if (overisvisible != null)
                detailenabled = overisvisible;
            if (detailenabled == null)
                detailenabled = detailisvisible;

            string dataroleid = String.Empty;
            int? roleid = null;
            if (overdataroleid != null)
                roleid = overdataroleid;
            if (roleid == null)
                dataroleid = magicdataroleid.ToString();
            else
                dataroleid = roleid.ToString();
            string deten = "false";

            if ((bool)detailenabled)
                deten = "true";

            string ret = "{enabled:" + deten + ",dataroleid:" + dataroleid + ",datasource:\"" + magicdatasource + "\",datasourcetextfield:\"" + magicdatasourcetextfield + "\",datasourcevaluefield:\"" + magicdatasourcevaluefield + "\", gridtoopenonclick:\"Magic_TemplateDetails\",name:\"" + columnname + "::" + dettype + "\",templatedetailid:" + magictemplatedetailid + ",type:\"" + dettype + "\", expanded:false,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/PROPERTY.png\"}";
            return ret;                  
        }
        public string generateDetailTemplateRow(Data.Magic_Templates detailtemplateobj,Uri MyUrl)
        {
            string ret = "{gridtoopenonclick:\"Magic_Templates\",name:\"DETAIL TEMPLATE::" + detailtemplateobj.MagicTemplateName + "\",templateid:" + detailtemplateobj.MagicTemplateID + ",type:\"" + detailtemplateobj.Magic_TemplateTypes.MagicTemplateType + "\", expanded:true,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/NAVIGATION.png\", items:["; 
            return ret;
        }

        public string generateDetailTemplateGroupRow(Data.Magic_TemplateGroups t,int functionid,Uri MyUrl)
        {
            bool? groupenabled = true;
                            if (t.Magic_TemplateGroupsFunctionOverrides.Count > 0)
                            {
                                var funcover2 = t.Magic_TemplateGroupsFunctionOverrides.Where(td => td.Function_ID == functionid).FirstOrDefault();
                                if (funcover2!=null)
                                    groupenabled = funcover2.IsvisibleforFunction;
                            }

            string ret = "{enabled:" + (groupenabled == true ? "true," : "false,") + "gridtoopenonclick:\"Magic_TemplateGroups\",name:\"TAB::" + t.MagicTemplateGroupLabel + "-->" + t.Magic_TemplateGroupContent.MagicTemplateGroupContentType + "\", imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/" + t.Magic_TemplateGroupContent.MagicTemplateGroupContentType + ".png\",templategroupid:" + t.MagicTemplateGroupID + ",type:\"" + t.Magic_TemplateGroupContent.MagicTemplateGroupContentType + "\", items:[";
            return ret;
        }   
        
        public string generateColumnDetailRow(Data.Magic_TemplateDetails tdd,Uri MyUrl)
        {
            string dettype = "COLUMNDETAIL";
            string ret = "{gridtoopenonclick:\"Magic_TemplateDetails\",name:\"" + tdd.Magic_Columns.ColumnName + "::" + dettype + "\",templatedetailid:" + tdd.MagicTemplateDetailID + ",templategroupid:" + tdd.MagicTemplateGroup_ID + ",type:\"" + dettype + "\", expanded:false,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/PROPERTY.png\"}";
            return ret;                  
        }
        public string recurinGrid(Data.Magic_Grids grid,string JSON, Data.Magic_TemplateGroups tabtemp,int functionid,bool gridisvisibleinfunction,bool buildtemplatetree,bool buildui)
        {
            if (grid == null)
                return "";
            loadedgridsinrecursion.Add(grid.MagicGridID);

            Uri MyUrl = null;
            if (Request!=null)
               MyUrl = Request.RequestUri;

            string toadd = String.Empty;
            string tempappend = String.Empty;
            string tabname = String.Empty;
            if (tabtemp != null && buildui)
            {
                tabname = "TAB::"+tabtemp.MagicTemplateGroupLabel+"-->";
                tempappend = tabtemp.MagicTemplateGroupID.ToString();
            }
            else 
                if (buildui)
                {
                     tabname = "ROOT";
                     tempappend = "-1";
                }
            
            #region Columns management
            string enabled = String.Empty;
            if ((!gridisvisibleinfunction) && (buildui))
                enabled = "false";
            if ((MyUrl != null) && buildui)
            {
                toadd += generateGridRow(grid, JSON, tabtemp, functionid, gridisvisibleinfunction,tempappend,tabname,MyUrl);
                //toadd += "{enabled:" + (gridisvisibleinfunction == true ? "true," : "false,") + "gridtoopenonclick:\"Magic_Grid\", gridid:" + grid.MagicGridID + ", detailtemplateid:" + detailtemplateid + ", editabletemplateid:" + editabletemplateid + ",   parenttabid:" + tempappend + ",gridname:\"" + grid.MagicGridName + "\",name:\"" + tabname + "GRID::" + grid.MagicGridName + "\" ,type:\"GRID\", expanded:true,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/grid.png\",datasourceid:" + datasourcetoappend + ",AppendToDiv:\"" + appendtodiv + "\",CommandColumn:\"" + columncommand + "\", Sortable:\"" + sortable + "\",Editable:\"" + editable + "\",Groupable:\"" + groupable + "\",Toolbar:\"" + toolbar + "\", EditableTemplate:\"" + editabletemplate + "\",DetailTemplate:\"" + dettemplate + "\",filter:\"" + filter + "\", items:[";
                int countercol = grid.Magic_Columns.Count;
                if (countercol > 0)
                {
                    //toadd += "{gridtoopenonclick:\"Magic_Columns\",  parenttabid:" + tempappend + ",name:\"GRID COLUMNS\" ,id:-1 ,type:\"COLUMNSET\", expanded:false,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/gridcols.png\", items:[";
                    toadd += generateColumnRow(tempappend, MyUrl);
                    foreach (var col in grid.Magic_Columns)
                    {
                        toadd += generateColumnDetailRow(col,MyUrl);
                        //toadd += "{enabled:"+ columnvisible +",Schema_required:" + required + ",Schema_nullable:\"" + col.Schema_nullable + "\",Editable:" + editablecol  + ",Isprimary:" + col.Isprimary + ",gridtoopenonclick:\"Magic_Columns\",name:\"" + col.ColumnName  + "\",columnid:" + col.MagicColumnID + ",type:\"" + proptype + "\", expanded:false,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/column.png\"}";
                        countercol--;
                        if (countercol > 0)
                            toadd += ",";
                    }
                    toadd += "]}";
                }
            }

            #endregion
            #region Templates Management
            
            string detailtemplate = getDetailTemplate(grid.DetailTemplate, functionid, buildui, grid.MagicGridID);
            string edittemplate = getEditTemplate(grid.EditableTemplate, buildui, functionid, grid.MagicGridID);

            var editabletemplateobj = (from e in _context.Magic_Templates where e.MagicTemplateName == edittemplate select e).FirstOrDefault();
            var detailtemplateobj = (from e in _context.Magic_Templates where e.MagicTemplateName == detailtemplate select e).FirstOrDefault();

            if ((((editabletemplateobj != null) || (detailtemplateobj != null)) && (grid.Magic_Columns.Count>0)) && buildui)
                toadd += ",";
            //associa i template alla funzione quando buildtemplatetree e' true
            insertTemplatesIntoDB(buildtemplatetree, editabletemplateobj, detailtemplateobj, functionid);
            int i = 0;
            if (editabletemplateobj != null)
            {
                if ((MyUrl != null) && buildui)
                {
                    //toadd += "{gridtoopenonclick:\"Magic_Templates\",name:\"EDIT TEMPLATE::" + editabletemplateobj.MagicTemplateName + "\",templateid:" + editabletemplateobj.MagicTemplateID + ",id:" + editabletemplateobj.MagicTemplateID + ",type:\"" + editabletemplateobj.Magic_TemplateTypes.MagicTemplateType + "\", expanded:false,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/POPUPEDITOR.png\", items:[";
                    toadd += generateEditTemplateRow(editabletemplateobj,MyUrl);
                    int countergroup = editabletemplateobj.Magic_TemplateGroups.Count;
                    if (countergroup>0)
                    {
                        foreach (var tg in editabletemplateobj.Magic_TemplateGroups)
                        {
                            // toadd += "{enabled:" + (groupenabled == true ? "true," : "false,") +"gridtoopenonclick:\"Magic_TemplateGroups\",name:\"TAB::" + tg.MagicTemplateGroupLabel + "-->" + tg.Magic_TemplateGroupContent.MagicTemplateGroupContentType + "\", imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/" + tg.Magic_TemplateGroupContent.MagicTemplateGroupContentType + ".png\",templategroupid:" + tg.MagicTemplateGroupID + ",type:\"" + tg.Magic_TemplateGroupContent.MagicTemplateGroupContentType + "\", items:[";
                            toadd += generateEditTemplateGroupRow(tg, functionid, MyUrl);
                            int countereditdet = tg.Magic_TemplateDetails.Count;
                            foreach (var td in tg.Magic_TemplateDetails)
                            {
                                var over = td.Magic_TemplateDetailsFunctionOverrides.Where(x => x.Function_ID == functionid).FirstOrDefault();
                                bool? overisvisible = null;
                                int? overdataroleid = null;
                                if (over != null)
                                {
                                    overisvisible = over.IsvisibleforFunction;
                                    overdataroleid = over.MagicTemplateDataRole_ID;
                                }
                                //toadd += "{enabled:"+ deten +",dataroleid:"+ dataroleid +",datasource:\""+ td.MagicDataSource +"\",datasourcetextfield:\""+ td.MagicDataSourceTextField +"\",datasourcevaluefield:\""+td.MagicDataSourceValueField+"\", gridtoopenonclick:\"Magic_TemplateDetails\",name:\"" + td.Magic_Columns.ColumnName + "::" + dettype + "\",templatedetailid:" + td.MagicTemplateDetailID + ",type:\"" + dettype + "\", expanded:false,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/PROPERTY.png\"}";
                                toadd += generateEditTemplateDetailRow(functionid, td.MagicDataSource,td.MagicDataSourceTextField,td.MagicDataSourceValueField,td.Magic_Columns.ColumnName,td.MagicTemplateDetailID,td.MagicDataRole_ID,td.Detailisvisible,overisvisible,overdataroleid, MyUrl);
                                countereditdet--;
                                if (countereditdet > 0)
                                    toadd += ",";
                            }
                            toadd += "]}";//close tab of details
                            
                            countergroup--;
                            if (countergroup > 0)
                                toadd += ",";
                        }
                      }
                 toadd += "]}"; //close the template
                 
                }
                if (detailtemplateobj != null && buildui)
                    if (MyUrl != null)
                        toadd += ",";
            }
            if (detailtemplateobj != null) 
            {
                if (MyUrl != null && buildui)
                    toadd += generateDetailTemplateRow(detailtemplateobj,MyUrl);
                    //toadd += "{gridtoopenonclick:\"Magic_Templates\",name:\"DETAIL TEMPLATE::" + detailtemplateobj.MagicTemplateName + "\",templateid:" + detailtemplateobj.MagicTemplateID + ",type:\"" + detailtemplateobj.Magic_TemplateTypes.MagicTemplateType + "\", expanded:true,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/NAVIGATION.png\", items:["; 
                int counter = detailtemplateobj.Magic_TemplateGroups.Count();
                foreach (var t in detailtemplateobj.Magic_TemplateGroups)
                {
                    var avoidcomma = false;
                    Data.Magic_TemplateGroupsFunctionOverrides exceptions = null;
                    if (t.Magic_TemplateGroupsFunctionOverrides != null)
                        exceptions = (from e in _context.Magic_TemplateGroupsFunctionOverrides where (e.Function_ID == functionid && e.MagicTemplateGroup_ID == t.MagicTemplateGroupID) select e).FirstOrDefault();

                    if (t.Magic_Grids != null)
                    {
                        if (exceptions != null)
                        {
                            if (!loadedgridsinrecursion.Contains(t.Magic_Grids.MagicGridID))
                                toadd += recurinGrid(t.Magic_Grids, JSON, t, functionid, exceptions.IsvisibleforFunction == false ? false : true, buildtemplatetree, buildui);
                            else avoidcomma = true;
                        }
                        else
                        {
                            if (!loadedgridsinrecursion.Contains(t.Magic_Grids.MagicGridID))
                                toadd += recurinGrid(t.Magic_Grids, JSON, t, functionid, (t.Groupisvisible == true ? true : false), buildtemplatetree, buildui);
                            else avoidcomma = true;
                        }
                    }
                    else
                    {
                        if (MyUrl != null && buildui && t.Magic_TemplateGroupContent != null)
                        {
                            //     toadd += "{enabled:" + (groupenabled == true ? "true," : "false,") + "gridtoopenonclick:\"Magic_TemplateGroups\",name:\"TAB::" + t.MagicTemplateGroupLabel + "-->" + t.Magic_TemplateGroupContent.MagicTemplateGroupContentType + "\", imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/" + t.Magic_TemplateGroupContent.MagicTemplateGroupContentType + ".png\",templategroupid:" + t.MagicTemplateGroupID + ",type:\"" + t.Magic_TemplateGroupContent.MagicTemplateGroupContentType + "\", items:[";
                            toadd += generateDetailTemplateGroupRow(t, functionid, MyUrl);
                            int counterdetaildet = t.Magic_TemplateDetails.Count;
                            foreach (var tdd in t.Magic_TemplateDetails)
                            {
                                //toadd += "{gridtoopenonclick:\"Magic_TemplateDetails\",name:\"" + tdd.Magic_Columns.ColumnName + "::" + dettype + "\",templatedetailid:" + tdd.MagicTemplateDetailID + ",templategroupid:" + tdd.MagicTemplateGroup_ID + ",type:\"" + dettype + "\", expanded:false,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/PROPERTY.png\"}";
                                toadd += generateColumnDetailRow(tdd, MyUrl);
                                counterdetaildet--;
                                if (counterdetaildet > 0)
                                    toadd += ",";
                            }
                            toadd += "]}";//close tab of details
                        }
                    }
                    if (i < counter)
                    {
                        if (MyUrl != null && buildui && !avoidcomma)
                        toadd += ",";
                    }
                    i++;
                }
                if (MyUrl != null && buildui)
                {
                    if (toadd.EndsWith(","))
                        toadd = toadd.Substring(0, toadd.Length - 1) + "]}  ]}";  //closing template and then parent-grid
                    else
                       toadd = toadd + "]}  ]}";  //closing template and then parent-grid
                }
            }
            else 
                if (MyUrl != null && buildui) 
                toadd = toadd + "]}";
            #endregion
            
            return toadd;
        }

    }
}
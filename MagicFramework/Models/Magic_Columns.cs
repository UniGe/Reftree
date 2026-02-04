using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;

namespace MagicFramework.Models
{
     
    public class Magic_Columns
    {
        public int MagicColumnID { get; set; }
        public int MagicGrid_ID { get; set; }
        public string ColumnName { get; set; }
        public string DataType { get; set; }
        public int? StringLength { get; set; }
        public int? NumericPrecision { get; set; }
        public int? NumericPrecisionRadix { get; set; }
        public string DatetimePrecision { get; set; }
        public int Isprimary { get; set; }
        public string FK_Column { get; set; }
        public string PK_Table { get; set; }
        public string PK_Column { get; set; }
        public bool Schema_editable { get; set; }
        public string Schema_type { get; set; }
        public string Schema_nullable { get; set; }
        public string Schema_validation { get; set; }
        public string Schema_defaultvalue { get; set; }
        public string Schema_fulldefinition { get; set; }
        public bool Columns_visibleingrid { get; set; }
        public bool? Columns_isSortable { get; set; }
        public bool? Columns_isFilterable { get; set; }
        public string Columns_template { get; set; }
        public string Columns_label { get; set; }
        public int? Columns_width { get; set; }
        public string Schema_Format { get; set; }
        public int? Schema_Numeric_min { get; set; }
        public int? Schema_Numeric_max { get; set; }
        public decimal? Schema_Numeric_step { get; set; }
        public bool? Schema_required { get; set; }
        public string Schema_attributes { get; set; }
        public int? Columns_OrdinalPosition { get; set; }
        public int? Layer_ID { get; set; }
        public string LayerSourceEntityName { get; set; }
        public string Columns_EditorFunction { get; set; }
        public int? ContainerColumn_ID { get; set; }
        public string UploadAllowedFileExtensions { get; set; }
        public string Upload_SavePath { get; set; }
        public bool? Upload_Multi { get; set; }

        public Magic_Columns(MagicFramework.Data.Magic_Columns A)
        {            
            this.MagicColumnID = A.MagicColumnID;
            this.MagicGrid_ID = A.MagicGrid_ID;
            this.ColumnName = A.ColumnName;
            this.DataType = A.DataType;
            this.StringLength = A.StringLength;
            this.NumericPrecision = A.NumericPrecision;
            this.NumericPrecisionRadix = A.NumericPrecisionRadix;
            this.DatetimePrecision = A.DatetimePrecision;
            this.Isprimary = A.Isprimary;
            this.FK_Column = A.FK_Column;
            this.PK_Table = A.PK_Table;
            this.PK_Column = A.PK_Column;
            this.Schema_editable = A.Schema_editable;
            this.Schema_type = A.Schema_type;
            this.Schema_nullable = A.Schema_nullable;
            this.Schema_validation = A.Schema_validation;
            this.Schema_defaultvalue = A.Schema_defaultvalue;
            this.Schema_fulldefinition = A.Schema_fulldefinition;
            this.Columns_visibleingrid = A.Columns_visibleingrid;
            this.Columns_template = A.Columns_template;
            this.Columns_label = A.Columns_label;
            this.Columns_width = A.Columns_width ?? 0;
            this.Schema_Format = A.Schema_Format;
            this.Schema_Numeric_min = A.Schema_Numeric_min;
            this.Schema_Numeric_max = A.Schema_Numeric_max;
            this.Schema_Numeric_step = A.Schema_Numeric_step;
            this.Schema_required = A.Schema_required;
            this.Schema_attributes = A.Schema_attributes;
            this.Columns_OrdinalPosition = A.Columns_OrdinalPosition;
            this.Layer_ID = A.Layer_ID;
            this.LayerSourceEntityName = A.LayerSourceEntityName;
            this.Columns_isFilterable = A.Columns_isFilterable;
            this.Columns_isSortable = A.Columns_isSortable;
            this.Columns_EditorFunction = A.Columns_EditorFunction;
            this.ContainerColumn_ID = A.ContainerColumn_ID;
            this.UploadAllowedFileExtensions = A.UploadAllowedFileExtensions;
            this.Upload_SavePath = A.Upload_SavePath;
            this.Upload_Multi = A.Upload_Multi;

        }
        public static void DeleteScriptBuffers(int id)
        {
            Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            var grid = (from e in context.Magic_Columns where e.MagicColumnID == id select e.Magic_Grids).FirstOrDefault();
            if (grid != null)
            {
                context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(grid.Magic_TemplateScriptsBuffer);
                context.SubmitChanges();
            }
        }
        /// <summary>
        /// costruttore che accede al db di config per ottenere la config della colonna. Vale solo per SQL Server
        /// </summary>
        /// <param name="columnname"></param>
        /// <param name="columnlabel"></param>
        /// <param name="gridname"></param>
        /// <param name="db_type"></param>
        /// <param name="layerid"></param>
        public Magic_Columns(string columnname, string columnlabel, string gridname,string db_type, string layer,bool required,string xmlContainerColname,int? columnid)
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

            int? layerid = (from e in _context.Magic_ApplicationLayers where e.LayerCode == layer select e.LayerID).FirstOrDefault();

            ColXmlrefs col = this.GetXmlFieldInfoSqlServer(_context, gridname, db_type, columnname, xmlContainerColname);
            
            this.MagicGrid_ID = col.GridId;
            this.ColumnName = columnname;
            this.DataType = db_type;
            this.Schema_editable =true;
            this.Schema_type = col.Schema_type;
            this.Columns_visibleingrid = true;
            this.Columns_template = col.template;
            this.Columns_label = columnlabel;
            this.Layer_ID = layerid;
            this.Columns_isFilterable =true;
            this.Columns_isSortable = true;
            this.ContainerColumn_ID = col.XmlcolId;
            this.Schema_required = required;
            if (columnid.HasValue)
                this.MagicColumnID = (int)columnid;
            else // cerco la colonna per nome colonna, griglia (questo serve nel caso in cui il Target DB sia sullo stesso DB del config DB)
            {
                int? colid = (from e in _context.Magic_Columns where e.ColumnName == columnname && e.Magic_Grids.MagicGridName == gridname select e.MagicColumnID).FirstOrDefault();
                if (colid.HasValue)
                    this.MagicColumnID = (int)colid;
            }
        }
        /// <summary>
        /// Inserts the proper configuration for a XML column
        /// </summary>
        public void InsetUpdateSqlServerXMLColumnConfig(string joinTable, string joinKey, string joinText,bool newcolumn)
        {
            string schema = null;
            if (joinTable != null)
            {
                if (joinTable.Split('.').Length == 2)
                {
                    schema = joinTable.Split('.')[0];
                    joinTable = joinTable.Split('.')[1];
                }
                else
                {
                    schema = "dbo";
                }
            }

            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

            Data.Magic_Grids grid = (from e in _context.Magic_Grids where e.MagicGridID == this.MagicGrid_ID select e).Single();

            Data.Magic_Columns col;
            
            var colexists = (from e in _context.Magic_Columns where e.MagicGrid_ID == this.MagicGrid_ID && e.ColumnName == this.ColumnName select e).FirstOrDefault();

            if (colexists != null && newcolumn)
                throw new System.ArgumentException("Double column name in insertion");
       
            if (colexists == null)
            {
                col = new Data.Magic_Columns();
                col.MagicGrid_ID = this.MagicGrid_ID;
                col.ColumnName = this.ColumnName;
                col.DataType = this.DataType;
                col.Schema_editable = this.Schema_editable;
                col.Schema_type = this.Schema_type;
                col.Columns_visibleingrid = this.Columns_visibleingrid;
                col.Columns_template = this.Columns_template;
                col.Columns_label = this.Columns_label;
                col.Layer_ID = this.Layer_ID;
                col.Columns_isFilterable = this.Columns_isFilterable;
                col.Columns_isSortable = this.Columns_isSortable;
                col.ContainerColumn_ID = this.ContainerColumn_ID;
                col.Schema_required = this.Schema_required;
                col.Schema_attributes = this.Schema_attributes;
                col.Schema_Format = this.Schema_Format;
                col.Layer_ID = this.Layer_ID;
                col.Isprimary = this.Isprimary;
                 _context.Magic_Columns.InsertOnSubmit(col);

            }
            else
            {
                col = colexists;
                col.Schema_required = this.Schema_required;
                col.Schema_type = this.Schema_type;
                col.DataType = this.DataType;
            }
            
            _context.SubmitChanges();  //creo/aggiorno la colonna

            var detexists = (from e in _context.Magic_TemplateDetails where e.DetailInheritsFromColumn_ID == col.MagicColumnID select e).FirstOrDefault();

            if (detexists == null)
            {
                joinTable = joinTable == "" ? null : joinTable;

                Data.Magic_TemplateDetails det = new Data.Magic_TemplateDetails();
                det.DetailDOMID =  joinTable == null ? null : joinTable + "dd";
                det.Detailisvisible = true;
                det.MagicDataRole_ID = StandardPageGenerator.getTemplateDataRole(this.DataType, joinTable);
                det.MagicDataSource = joinTable == "" ? null : joinTable;
                det.MagicDataSourceSchema = schema == "dbo" ? null : schema;
                det.MagicDataSourceTextField = joinText == "" ? null : joinText;
                det.MagicDataSourceValueField = joinKey == "" ? null : joinKey;
                det.MagicNullOptionLabel = "N/A";
                //genero un tab nel template di edit (Label = "Dettaglio tipologia" e uno in quello di navigazione (type EXTENSIONGRID,Label="Dettaglio Tipologia")

                //edit
                string deflabel = "Dettaglio tipologia";
                var EditTemplate = (from e in _context.Magic_Templates where e.MagicTemplateName == grid.EditableTemplate select e).FirstOrDefault();
                if (EditTemplate == null)
                    throw new System.ArgumentException("MagicFramework says: the EditTemplate of the grid must be set and created in order to manage XML columns. Please bind an existing edit template to the grid");

                det.MagicTemplate_ID = EditTemplate.MagicTemplateID;
              
                var templategroup = (from e in _context.Magic_TemplateGroups where e.Magic_Templates.MagicTemplateName == grid.EditableTemplate && e.MagicTemplateGroupLabel == deflabel select e).FirstOrDefault();
                if (templategroup == null)
                {
                    Data.Magic_TemplateGroups g = new Data.Magic_TemplateGroups();
                    g.Groupisvisible = true;
                    g.IsVisibleInPopUp = false;
                    g.MagicTemplate_ID = EditTemplate.MagicTemplateID;
                    g.MagicTemplateGroupContent_ID = (from e in _context.Magic_TemplateGroupContent where e.MagicTemplateGroupContentType == "FIELDEDITLIST" select e.MagicTemplateGroupContentID).First();
                    g.MagicTemplateGroupLabel = deflabel;
                    g.OrdinalPosition = 10000; //arbitrariamente grande in modo che stia in fondo. Il  tab puo' essere riposizionato come un qualsiasi altro via config.
                    EditTemplate.Magic_TemplateGroups.Add(g);

                    _context.SubmitChanges();
                    templategroup = g;

                }
                //navigation
                var NavigTemplate = (from e in _context.Magic_Templates where e.MagicTemplateName == grid.DetailTemplate select e).FirstOrDefault();
                if (NavigTemplate != null) // se esiste il navigation vado ad appendere l' extension grid
                //throw new System.ArgumentException("MagicFramework says: the DetailTemplate of the grid must be set and created in order to manage XML columns. Please bind an existing navigation template to the grid");
                {
                    var templategroupnav = NavigTemplate.Magic_TemplateGroups.Where(o => o.Magic_TemplateGroupContent.MagicTemplateGroupContentType == "EXTENSIONGRID").FirstOrDefault();

                    if (templategroupnav == null)
                    {
                        Data.Magic_TemplateGroups g = new Data.Magic_TemplateGroups();
                        g.Groupisvisible = true;
                        g.IsVisibleInPopUp = false;
                        g.BindedGrid_ID = grid.MagicGridID;
                        g.BindedGridFilter = grid.Magic_Columns.Where(x => x.Isprimary == 1).FirstOrDefault().ColumnName;
                        g.BindedGridHideFilterCol = true;
                        g.BindedGridRelType_ID = (from e in _context.Magic_TemplateGrpGridRelType where e.Code == "1,1" select e.ID).First();
                        g.OrdinalPosition = 0;
                        g.MagicTemplateGroupLabel = deflabel;
                        g.MagicTemplateGroupContent_ID = (from e in _context.Magic_TemplateGroupContent where e.MagicTemplateGroupContentType == "EXTENSIONGRID" select e.MagicTemplateGroupContentID).Single();
                        NavigTemplate.Magic_TemplateGroups.Add(g);

                        _context.SubmitChanges();

                        var template = NavigTemplate.Magic_TemplateScriptsBuffer;
                        _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                        MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

                        int templateid = NavigTemplate.MagicTemplateID;
                        MagicFramework.Models.Magic_Templates t = new Magic_Templates(NavigTemplate);
                        t.rebuildalltemplatefunctions();
                        _context.SubmitChanges();
                    }
                }

                det.Magic_TemplateGroups = templategroup;
                col.Magic_TemplateDetails.Add(det);
                det.DetailInheritsFromColumn_ID = col.MagicColumnID;
                _context.Magic_TemplateDetails.InsertOnSubmit(det);
            }
            else //il detail e' solo da aggiornare
            {
                detexists.MagicDataSourceTextField = joinText;
                detexists.MagicDataSourceValueField = joinKey;
                detexists.MagicDataSource = joinTable;
                detexists.MagicDataSourceSchema = schema;
                detexists.DetailDOMID = joinTable + "dd";
            }
            //pulisco i buffers e la cache applicativa
            _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(grid.Magic_TemplateScriptsBuffer);
            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

            var templates = col.Magic_TemplateDetails;
            foreach (var b in templates)
            {
                var templatescritpsbuffer = (from e in _context.Magic_TemplateScriptsBuffer where e.Magic_Template_ID == b.MagicTemplate_ID select e).ToList();
                _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(templatescritpsbuffer);
            }
            _context.SubmitChanges();
        }
        /// <summary>
        /// This removes a XML column. If the column is the only one referencing a ContainerColumn the EXTENSIONGRID tab is removed form the navigation template.
        /// </summary>
        public void RemoveSqlServerXMLColumnConfig()
        { 
           Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
           Data.Magic_Grids grid = (from e in _context.Magic_Grids where e.MagicGridID == this.MagicGrid_ID select e).Single();

            //the column deletes the templatedetail on cascade
           var col = (from e in _context.Magic_Columns where e.MagicColumnID == this.MagicColumnID select e).First();
        
            var counterofxmlcols = (from e in _context.Magic_Columns where e.Magic_Grids.MagicGridID == grid.MagicGridID && e.ContainerColumn_ID.HasValue select e).Count();

            if (counterofxmlcols == 1)
            {
                var navtempl = (from e in _context.Magic_Templates where e.MagicTemplateName == grid.DetailTemplate select e).FirstOrDefault();
                foreach (var g in navtempl.Magic_TemplateGroups)
                {
                    if (g.Magic_TemplateGroupContent.MagicTemplateGroupContentType == "EXTENSIONGRID")
                    {
                        _context.Magic_TemplateGroups.DeleteOnSubmit(g);
                        var template = g.Magic_Templates.Magic_TemplateScriptsBuffer;
                        _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
                        _context.SubmitChanges();
                        Models.Magic_Templates t = new Magic_Templates(navtempl);
                        t.rebuildalltemplatefunctions();
                        break;
                    }
                }
            }
            //cancellazione di template details, buffers, cache, colonna
            var details = col.Magic_TemplateDetails;
            _context.Magic_TemplateDetails.DeleteAllOnSubmit(details);
            _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(grid.Magic_TemplateScriptsBuffer);
            MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);

            var templates = col.Magic_TemplateDetails;
            foreach (var b in templates)
            {
                var template = b.Magic_Templates.Magic_TemplateScriptsBuffer;
                _context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(template);
            }
            _context.Magic_Columns.DeleteOnSubmit(col);
                 
            _context.SubmitChanges();

         
        }
        private class ColXmlrefs
        {
            public int GridId {get;set;}
            public int XmlcolId {get;set;}
            public string template {get;set;}
            public string Schema_type {get;set;}
            public string Schema_attributes { get; set; }
            public string Schema_format { get; set; }
            
        }
        private class ColTemplateDetailsXmlrefs
        {
            public int TemplateId {get;set;}
            public int TemplateGroupId {get;set;}
            public string dataRole {get;set;}
            public string detailDomID {get;set;}     
        }

        private ColXmlrefs GetXmlFieldInfoSqlServer(Data.MagicDBDataContext _context, string grid, string db_type,string colName,string xmlColname)
        {
            ColXmlrefs refs = new ColXmlrefs();

            Data.Magic_Grids g = (from e in _context.Magic_Grids where e.MagicGridName == grid select e).First();

            refs.GridId = g.MagicGridID;
            refs.XmlcolId = g.Magic_Columns.Where(x => x.DataType == "xml" && x.ColumnName == xmlColname).First().MagicColumnID;
            if (db_type != null) // e' nullo in delete
            {
                refs.Schema_type = StandardPageGenerator.getColumnUItype(db_type.ToLower());
                refs.template = StandardPageGenerator.GetColumntemplate(colName, db_type);
                refs.Schema_format = StandardPageGenerator.getColumnformat(colName, db_type);
                refs.Schema_attributes = StandardPageGenerator.getColumnattributes(colName, db_type);
            }
   

            return refs;
        }
    }
}
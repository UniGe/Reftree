using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{

    public class v_Magic_TemplateDetails
    {


        public int MagicTemplateDetailID { get; set; }
        public int MagicTemplate_ID { get; set; }
        public int MagicTemplateGroup_ID { get; set; }
        public int OrdinalPosition { get; set; }
        public int? MagicDataRole_ID { get; set; }
        public string MagicNullOptionLabel { get; set; }
        public string MagicDataSourceValueField { get; set; }
        public string MagicDataSourceTextField { get; set; }
        public string MagicDataSource { get; set; }
        public bool? Detailisvisible { get; set; }
        public int? DetailInheritsFromColumn_ID { get; set; }
        public string DetailonchangeFunctionName { get; set; }
        public string DetailDOMID { get; set; }
        public int DetailInheritsFromGroup_ID { get; set; }
        public int MagicDataSourceType_ID { get; set; }
        public string MagicDataSourceSchema { get; set; }
        public int? SearchGrid_ID { get; set; }
        public int? SearchGridDescColumn_ID { get; set; }
        public int? CascadeColumn_ID { get; set; }
        public int? CascadeFilterCol_ID { get; set; }
        public string MagicTemplateType { get; set; }
        public string MagicTemplateGroupClass { get; set; }
        public string MagicTemplateGroupLabel { get; set; }
        public string SearchGridName { get; set; }
        public string SearchGridDescColName { get; set; }
        public string Columns_label { get; set; }
        public string ColumnName { get; set; }

        public v_Magic_TemplateDetails(MagicFramework.Data.v_Magic_TemplateDetails A)
        {
            this.MagicTemplateDetailID = A.MagicTemplateDetailID;
            this.MagicTemplate_ID = A.MagicTemplate_ID;
            this.MagicTemplateGroup_ID = A.MagicTemplateGroup_ID;
            this.OrdinalPosition = A.OrdinalPosition;
            this.MagicDataRole_ID = (int)(A.MagicDataRole_ID ?? 0);
            this.MagicNullOptionLabel = A.MagicNullOptionLabel;
            this.MagicDataSourceValueField = A.MagicDataSourceValueField;
            this.MagicDataSourceTextField = A.MagicDataSourceTextField;
            this.MagicDataSource = A.MagicDataSource;
            this.Detailisvisible = A.Detailisvisible;
            this.DetailInheritsFromColumn_ID = (int)(A.DetailInheritsFromColumn_ID ?? 0);
            this.DetailonchangeFunctionName = A.DetailonchangeFunctionName;
            this.DetailDOMID = A.DetailDOMID;
            this.DetailInheritsFromGroup_ID = (int)(A.DetailInheritsFromGroup_ID ?? 0);
            this.MagicTemplateType = A.MagicTemplateType;
            this.MagicDataSourceType_ID = (int)(A.MagicDataSourceType_ID ?? 0);
            this.MagicDataSourceSchema = A.MagicDataSourceSchema;
            this.SearchGrid_ID = (int)(A.SearchGrid_ID ?? 0);
            this.SearchGridDescColumn_ID = (int)(A.SearchGridDescColumn_ID ?? 0);
            this.CascadeColumn_ID = (int)(A.CascadeColumn_ID ?? 0);
            this.CascadeFilterCol_ID = (int)(A.CascadeFilterCol_ID ?? 0);
            this.MagicTemplateGroupClass = A.MagicTemplateGroupClass;
            this.MagicTemplateGroupLabel = A.MagicTemplateGroupLabel;
            this.SearchGridName = A.SearchGridName;
            this.SearchGridDescColName = A.SearchGridDescColName;
            this.Columns_label = A.Columns_label;
            this.ColumnName = A.ColumnName;
        }
    }
}

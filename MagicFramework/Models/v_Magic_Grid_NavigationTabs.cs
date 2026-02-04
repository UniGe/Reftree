using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class v_Magic_Grid_NavigationTabs{

public int MagicTemplateGroupID {get;set;}
public int? MagicTemplate_ID {get;set;}
public string MagicTemplateGroupLabel {get;set;}
public int? OrdinalPosition {get;set;}
public int? MagicTemplateGroupContent_ID {get;set;}
public string MagicTemplateGroupClass {get;set;}
public string MagicTemplateGroupDOMID {get;set;}
public bool? Groupisvisible {get;set;}
public int? BindedGrid_ID {get;set;}
public string BindedGridFilter {get;set;}
public bool? BindedGridHideFilterCol {get;set;}
public int? ExtMagicDataSource_ID {get;set;}
public string TemplateToAppendName {get;set;}
public int MagicGridID {get;set;}
public bool? IsVisibleInPopUp { get; set; }
public int? BindedGridRelType_ID { get; set; }
public int? MagicTemplateTabGroup_ID { get; set; }
        

public v_Magic_Grid_NavigationTabs(MagicFramework.Data.v_Magic_Grid_NavigationTabs A) {
this.MagicTemplateGroupID = A.MagicTemplateGroupID;
this.MagicTemplate_ID = (int)(A.MagicTemplate_ID ?? 0);
this.MagicTemplateGroupLabel = A.MagicTemplateGroupLabel;
this.OrdinalPosition = (int)(A.OrdinalPosition ?? 0);
this.MagicTemplateGroupContent_ID = (int)(A.MagicTemplateGroupContent_ID ?? 0);
this.MagicTemplateGroupClass = A.MagicTemplateGroupClass;
this.MagicTemplateGroupDOMID = A.MagicTemplateGroupDOMID;
this.Groupisvisible = A.Groupisvisible;
this.BindedGrid_ID = (int)(A.BindedGrid_ID ?? 0);
this.BindedGridFilter = A.BindedGridFilter;
this.BindedGridHideFilterCol = A.BindedGridHideFilterCol;
this.ExtMagicDataSource_ID = (int)(A.ExtMagicDataSource_ID ?? 0);
this.TemplateToAppendName = A.TemplateToAppendName;
this.MagicGridID = A.MagicGridID;
this.IsVisibleInPopUp = A.IsVisibleInPopUp;
this.BindedGridRelType_ID = (int)(A.BindedGridRelType_ID ?? 0);
this.MagicTemplateTabGroup_ID = (int)(A.MagicTemplateTabGroup_ID ?? 0);
}
}
}

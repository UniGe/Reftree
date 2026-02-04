using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class v_Magic_Mmb_MenuFunctions{

public int MenuID {get;set;}
public int Module_ID {get;set;}
public bool MenuIsParent {get;set;}
public int? MenuParentID {get;set;}
public string MenuLabel {get;set;}
public int MenuOrder {get;set;}
public string MenuImg {get;set;}
public int? ID {get;set;}
public int? FunctionID {get;set;}

public v_Magic_Mmb_MenuFunctions(MagicFramework.Data.v_Magic_Mmb_MenuFunctions A) {
this.MenuID = A.MenuID;
this.Module_ID = A.Module_ID;
this.MenuIsParent = A.MenuIsParent;
this.MenuParentID = (int)(A.MenuParentID ?? 0);
this.MenuLabel = A.MenuLabel;
this.MenuOrder = A.MenuOrder;
this.MenuImg = A.MenuImg;
this.ID = (int)(A.ID ?? 0);
this.FunctionID = (int)(A.FunctionID ?? 0);
}
}
}

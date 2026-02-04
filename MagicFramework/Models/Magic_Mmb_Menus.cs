using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Mmb_Menus{

public int MenuID {get;set;}
public int Module_ID {get;set;}
public bool MenuIsParent {get;set;}
public int? MenuParentID {get;set;}
public string MenuLabel {get;set;}
public int MenuOrder {get;set;}
public string MenuImg {get;set;}

public Magic_Mmb_Menus(MagicFramework.Data.Magic_Mmb_Menus A) {
this.MenuID = A.MenuID;
this.Module_ID = A.Module_ID;
this.MenuIsParent = A.MenuIsParent;
this.MenuParentID = (int)(A.MenuParentID ?? 0);
this.MenuLabel = A.MenuLabel;
this.MenuOrder = A.MenuOrder;
this.MenuImg = A.MenuImg;
}
}
}

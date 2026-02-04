using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Mmb_FunctionsMenus{

public int ID {get;set;}
public int MenuID {get;set;}
public int FunctionID {get;set;}

public Magic_Mmb_FunctionsMenus(MagicFramework.Data.Magic_Mmb_FunctionsMenus A) {
this.ID = A.ID;
this.MenuID = A.MenuID;
this.FunctionID = A.FunctionID;
}
}
}

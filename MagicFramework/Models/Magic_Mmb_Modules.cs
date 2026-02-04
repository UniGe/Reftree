using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Mmb_Modules{

public int ModuleID {get;set;}
public int? Module_ID {get;set;}
public string ModuleName {get;set;}
public string ModuleImg {get;set;}
public int? ModuleOrder {get;set;}
public int ProfilationType_ID { get; set; }
public string MenuLoaderSP { get; set; }
public bool SystemModule { get; set; }


public Magic_Mmb_Modules(MagicFramework.Data.Magic_Mmb_Modules A) {
this.ModuleID = A.ModuleID;
this.Module_ID = (int)(A.Module_ID ?? 0);
this.ModuleName = A.ModuleName;
this.ModuleImg = A.ModuleImg;
this.ModuleOrder = (int)(A.ModuleOrder ?? 0);
this.ProfilationType_ID = (int)(A.ProfilationType_ID ?? 1); //default e' Menu
this.MenuLoaderSP = A.MenuLoaderSP;
this.SystemModule = (bool)(A.SystemModule?? false);
}
public Magic_Mmb_Modules()
{ 
    
}
}
}

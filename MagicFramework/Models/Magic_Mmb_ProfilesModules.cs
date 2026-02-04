using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Mmb_ProfilesModules{

public int ID {get;set;}
public int Profile_ID {get;set;}
public int Module_ID {get;set;}
public bool ProfileInheritedRights {get;set;}
public bool ProfileModuleExecRights {get;set;}
public bool ProfileModuleUpdateRights {get;set;}
public bool ProfileModuleDeleteRights {get;set;}
public bool ProfileModuleExportRights {get;set;}

public Magic_Mmb_ProfilesModules(MagicFramework.Data.Magic_Mmb_ProfilesModules A) {
this.ID = A.ID;
this.Profile_ID = A.Profile_ID;
this.Module_ID = A.Module_ID;
this.ProfileInheritedRights = A.ProfileInheritedRights;
this.ProfileModuleExecRights = A.ProfileModuleExecRights;
this.ProfileModuleUpdateRights = A.ProfileModuleUpdateRights;
this.ProfileModuleDeleteRights = A.ProfileModuleDeleteRights;
this.ProfileModuleExportRights = A.ProfileModuleExportRights;
}
}
}

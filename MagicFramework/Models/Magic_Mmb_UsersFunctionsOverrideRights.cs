using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Mmb_UsersFunctionsOverrideRights{

public int ID {get;set;}
public int User_ID {get;set;}
public int Function_ID {get;set;}
public bool UserFunctionExecRights {get;set;}
public bool UserFunctionUpdateRights {get;set;}
public bool UserFunctionDeleteRights {get;set;}
public bool UserFunctionExportRights {get;set;}

public Magic_Mmb_UsersFunctionsOverrideRights(MagicFramework.Data.Magic_Mmb_UsersFunctionsOverrideRights A) {
this.ID = A.ID;
this.User_ID = A.User_ID;
this.Function_ID = A.Function_ID;
this.UserFunctionExecRights = A.UserFunctionExecRights;
this.UserFunctionUpdateRights = A.UserFunctionUpdateRights;
this.UserFunctionDeleteRights = A.UserFunctionDeleteRights;
this.UserFunctionExportRights = A.UserFunctionExportRights;
}
}
}

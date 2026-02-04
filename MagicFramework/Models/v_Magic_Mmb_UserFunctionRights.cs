using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{

public class v_Magic_Mmb_UserFunctionRights{

public int User_ID {get;set;}
public int ProfileID {get;set;}
public string ProfileName {get;set;}
public int ModuleID {get;set;}
public string ModuleName {get;set;}
public string ModuleImg {get;set;}
public bool ProfileExecRightsC {get;set;}
public bool ProfileUpdateRightsC {get;set;}
public bool ProfileDeleteRightsC {get;set;}
public bool ProfileExportRightsC {get;set;}
public int MenuID {get;set;}
public bool MenuIsParent {get;set;}
public int MenuParentID {get;set;}
public string MenuParentLabel {get;set;}
public string MenuLabel {get;set;}
public int MenuOrder {get;set;}
public int FunctionID {get;set;}
public string FunctionName {get;set;}
public string FunctionQsParameters {get;set;}
public string FunctionDescription {get;set;}
public string FunctionHelp {get;set;}
public int ParentOrder {get;set;}
public int MenuSection {get;set;}
public string FunctionBaseUrl {get;set;}
public string MenuImg {get;set;}
public bool? Preferred {get;set;}
public int? ModuleOrder {get;set;}

public v_Magic_Mmb_UserFunctionRights(MagicFramework.Data.v_Magic_Mmb_UserFunctionRights A)
{
this.User_ID = A.User_ID;
this.ProfileID = A.ProfileID;
this.ProfileName = A.ProfileName;
this.ModuleID = A.ModuleID;
this.ModuleName = A.ModuleName;
this.ModuleImg = A.ModuleImg;
this.ProfileExecRightsC = A.ProfileExecRightsC;
this.ProfileUpdateRightsC = A.ProfileUpdateRightsC;
this.ProfileDeleteRightsC = A.ProfileDeleteRightsC;
this.ProfileExportRightsC = A.ProfileExportRightsC;
this.MenuID = A.MenuID;
this.MenuIsParent = A.MenuIsParent;
this.MenuParentID = A.MenuParentID;
this.MenuParentLabel = A.MenuParentLabel;
this.MenuLabel = A.MenuLabel;
this.MenuOrder = A.MenuOrder;
this.FunctionID = A.FunctionID;
this.FunctionName = A.FunctionName;
this.FunctionQsParameters = A.FunctionQsParameters;
this.FunctionDescription = A.FunctionDescription;
this.FunctionHelp = A.FunctionHelp;
this.ParentOrder = A.ParentOrder;
this.MenuSection = A.MenuSection;
this.FunctionBaseUrl = A.FunctionBaseUrl;
this.MenuImg = A.MenuImg;
this.Preferred = A.Preferred;
this.ModuleOrder = (int)(A.ModuleOrder ?? 0);
}
}
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class v_Magic_Mmb_UserPreferredFunctions{

public int? User_ID {get;set;}
public int FunctionID {get;set;}
public string FunctionName {get;set;}
public string FunctionBaseUrl {get;set;}
public string FunctionQsParameters {get;set;}
public string MenuImg {get;set;}

public v_Magic_Mmb_UserPreferredFunctions(MagicFramework.Data.v_Magic_Mmb_UserPreferredFunctions A) {
this.User_ID = (int)(A.User_ID ?? 0);
this.FunctionID = A.FunctionID;
this.FunctionName = A.FunctionName;
this.FunctionBaseUrl = A.FunctionBaseUrl;
this.FunctionQsParameters = A.FunctionQsParameters;
this.MenuImg = A.MenuImg;
}
}
}

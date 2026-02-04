using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_TemplateDetailsFunctionOverrides{

public int ID {get;set;}
public int? MagicTemplateDetail_ID {get;set;}
public int? Function_ID {get;set;}
public bool? IsvisibleforFunction {get;set;}
public int? MagicTemplateDataRole_ID {get;set;}

public Magic_TemplateDetailsFunctionOverrides(MagicFramework.Data.Magic_TemplateDetailsFunctionOverrides A) {
this.ID = A.ID;
this.MagicTemplateDetail_ID = (int)(A.MagicTemplateDetail_ID ?? 0);
this.Function_ID = (int)(A.Function_ID ?? 0);
this.IsvisibleforFunction = A.IsvisibleforFunction;
this.MagicTemplateDataRole_ID = (int)(A.MagicTemplateDataRole_ID ?? 0);
}
}
}

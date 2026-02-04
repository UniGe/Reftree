using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_TemplateGroupsFunctionOverrides{

public int ID {get;set;}
public int? MagicTemplateGroup_ID {get;set;}
public int? Function_ID {get;set;}
public bool? IsvisibleforFunction {get;set;}

public Magic_TemplateGroupsFunctionOverrides(MagicFramework.Data.Magic_TemplateGroupsFunctionOverrides A) {
this.ID = A.ID;
this.MagicTemplateGroup_ID = (int)(A.MagicTemplateGroup_ID ?? 0);
this.Function_ID = (int)(A.Function_ID ?? 0);
this.IsvisibleforFunction = A.IsvisibleforFunction;
}
}
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_TemplateGrpGridRelType{

public int ID {get;set;}
public string Code {get;set;}
public string Description {get;set;}

public Magic_TemplateGrpGridRelType(MagicFramework.Data.Magic_TemplateGrpGridRelType A) {
this.ID = A.ID;
this.Code = A.Code;
this.Description = A.Description;
}
}
}

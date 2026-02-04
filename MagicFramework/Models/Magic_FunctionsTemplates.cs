using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_FunctionsTemplates{

public int ID {get;set;}
public int? MagicFunction_ID {get;set;}
public int? MagicTemplate_ID {get;set;}
public int? MagicGrid_ID {get;set;}
public bool? ManualInsertion { get; set; }

public Magic_FunctionsTemplates(MagicFramework.Data.Magic_FunctionsTemplates A) {
this.ID = A.ID;
this.MagicFunction_ID = (int)(A.MagicFunction_ID ?? 0);
this.MagicTemplate_ID = (int)(A.MagicTemplate_ID ?? 0);
this.MagicGrid_ID = (int)(A.MagicGrid_ID ?? 0);
this.ManualInsertion = A.ManualInsertion;
}
}
}

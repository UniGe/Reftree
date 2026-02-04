using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_TemplateTypes{

public int MagicTemplateTypeID {get;set;}
public string MagicTemplateType {get;set;}

public Magic_TemplateTypes(MagicFramework.Data.Magic_TemplateTypes A) {
this.MagicTemplateTypeID = A.MagicTemplateTypeID;
this.MagicTemplateType = A.MagicTemplateType;
}
}
}

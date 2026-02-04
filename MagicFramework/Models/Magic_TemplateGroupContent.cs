using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_TemplateGroupContent{

public int MagicTemplateGroupContentID {get;set;}
public string MagicTemplateGroupContentType {get;set;}

public Magic_TemplateGroupContent(MagicFramework.Data.Magic_TemplateGroupContent A) {
this.MagicTemplateGroupContentID = A.MagicTemplateGroupContentID;
this.MagicTemplateGroupContentType = A.MagicTemplateGroupContentType;
}
}
}

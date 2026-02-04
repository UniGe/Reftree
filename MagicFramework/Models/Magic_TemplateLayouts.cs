using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_TemplateLayouts{

public int MagicTemplateLayoutID {get;set;}
public string Layout {get;set;}

public Magic_TemplateLayouts(MagicFramework.Data.Magic_TemplateLayouts A) {
this.MagicTemplateLayoutID = A.MagicTemplateLayoutID;
this.Layout = A.Layout;
}
}
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_TemplateGroupLabels{

public int TemplateGroupLabelID {get;set;}
public int MagicTemplateGroup_ID {get;set;}
public int MagicTemplate_ID {get;set;}
public string MagicTemplateGroupLabel {get;set;}
public int MagicCulture_ID {get;set;}

public Magic_TemplateGroupLabels(MagicFramework.Data.Magic_TemplateGroupLabels A) {
this.TemplateGroupLabelID = A.TemplateGroupLabelID;
this.MagicTemplateGroup_ID = A.MagicTemplateGroup_ID;
this.MagicTemplate_ID = A.MagicTemplate_ID;
this.MagicTemplateGroupLabel = A.MagicTemplateGroupLabel;
this.MagicCulture_ID = A.MagicCulture_ID;
}
}
}

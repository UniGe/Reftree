using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_TemplateDataRoles{

public int MagicTemplateDataRoleID {get;set;}
public string MagicTemplateDataRole {get;set;}

public Magic_TemplateDataRoles(MagicFramework.Data.Magic_TemplateDataRoles A) {
this.MagicTemplateDataRoleID = A.MagicTemplateDataRoleID;
this.MagicTemplateDataRole = A.MagicTemplateDataRole;
}
}
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class v_Magic_UserGroupVisibility{

public bool selected {get;set;}
public int ID {get;set;}
public string Codice {get;set;}
public string Descrizione {get;set;}
public DateTime? DataInserimento {get;set;}
public string AssignedGroupCode {get;set;}
public int? ParentGroup_ID {get;set;}
public int UserID { get; set; }

public v_Magic_UserGroupVisibility(MagicFramework.Data.v_Magic_UserGroupVisibility A) {
this.selected = A.selected ?? false;
this.ID = A.ID;
this.Codice = A.Codice;
this.Descrizione = A.Descrizione;
this.DataInserimento = A.DataInserimento;
this.AssignedGroupCode = A.AssignedGroupCode;
this.ParentGroup_ID = (int)(A.ParentGroup_ID ?? 0);
this.UserID = A.UserID;
}
}
}

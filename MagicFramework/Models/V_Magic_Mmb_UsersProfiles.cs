using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class V_Magic_Mmb_UsersProfiles{

public int Checked {get;set;}
public int ID {get;set;}
public int ProfileID {get;set;}
public string ProfileName {get;set;}
public int UserID {get;set;}
public string Name {get;set;}
public string Username {get;set;}
public string FirstName {get;set;}
public string LastName {get;set;}

public V_Magic_Mmb_UsersProfiles(MagicFramework.Data.v_Magic_Mmb_UsersProfiles A) {
this.Checked = A.Checked;
this.ID = A.ID;
this.ProfileID = A.ProfileID;
this.ProfileName = A.ProfileName;
this.UserID = A.UserID;
this.Name = A.Name;
this.Username = A.Username;
this.FirstName = A.FirstName;
this.LastName = A.LastName;
}
}
}

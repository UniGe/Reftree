using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Mmb_UserGroupVisibilityUsers{

public int ID {get;set;}
public int UserGroupVisibility_ID {get;set;}
public int User_ID {get;set;}

public Magic_Mmb_UserGroupVisibilityUsers(MagicFramework.Data.Magic_Mmb_UserGroupVisibilityUsers A) {
this.ID = A.ID;
this.UserGroupVisibility_ID = A.UserGroupVisibility_ID;
this.User_ID = A.User_ID;
}
}
}

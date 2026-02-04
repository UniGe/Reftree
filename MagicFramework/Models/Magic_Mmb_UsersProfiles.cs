using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Mmb_UsersProfiles{

public int ID {get;set;}
public int User_ID {get;set;}
public int Profile_ID {get;set;}

public Magic_Mmb_UsersProfiles(MagicFramework.Data.Magic_Mmb_UsersProfiles A) {
this.ID = A.ID;
this.User_ID = A.User_ID;
this.Profile_ID = A.Profile_ID;
}
}
}

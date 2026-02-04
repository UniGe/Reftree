using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Mmb_UsersPreferredFunctions{

public int ID {get;set;}
public int? User_ID {get;set;}
public int? Function_ID {get;set;}

public Magic_Mmb_UsersPreferredFunctions(MagicFramework.Data.Magic_Mmb_UsersPreferredFunctions A) {
this.ID = A.ID;
this.User_ID = (int)(A.User_ID ?? 0);
this.Function_ID = (int)(A.Function_ID ?? 0);
}
}
}

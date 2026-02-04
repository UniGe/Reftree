using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class v_Magic_UserCrossProfiles{

public int viewID {get;set;}
public int ProfileID {get;set;}
public string ProfileName {get;set;}
public int UserID {get;set;}
public int ischecked {get;set;}
public int DefaultModule_ID { get; set; }
public int? ProfileOrder { get; set; }

public v_Magic_UserCrossProfiles(Data.v_Magic_UserCrossProfiles A) {
this.viewID = (int)A.viewID;
this.ProfileID = A.ProfileID;
this.ProfileName = A.ProfileName;
this.UserID = A.UserID;
this.ischecked = A.ischecked;
this.DefaultModule_ID = A.DefaultModule_ID ?? 0;
this.ProfileOrder = A.ProfileOrder;
}
}
}

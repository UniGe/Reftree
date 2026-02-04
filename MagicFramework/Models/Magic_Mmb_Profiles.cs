using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Mmb_Profiles{

public int ProfileID {get;set;}
public string ProfileName {get;set;}
public bool ProfileExecRights {get;set;}
public bool ProfileUpdateRights {get;set;}
public bool ProfileDeleteRights {get;set;}
public bool ProfileExportRights {get;set;}
public bool ProfileScheduleRights { get; set; }

public Magic_Mmb_Profiles(MagicFramework.Data.Magic_Mmb_Profiles A) {
this.ProfileID = A.ProfileID;
this.ProfileName = A.ProfileName;
this.ProfileExecRights = A.ProfileExecRights;
this.ProfileUpdateRights = A.ProfileUpdateRights;
this.ProfileDeleteRights = A.ProfileDeleteRights;
this.ProfileExportRights = A.ProfileExportRights;
this.ProfileScheduleRights = A.ProfileScheduleRights;
}
}
}

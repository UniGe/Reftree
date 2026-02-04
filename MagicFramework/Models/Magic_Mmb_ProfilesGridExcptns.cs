using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Mmb_ProfilesGridExcptns{

public int ID {get;set;}
public int Profile_ID {get;set;}
public int MagicGrid_ID {get;set;}
public bool isVisible {get;set;}
public bool ProfileExecRights {get;set;}
public bool ProfileUpdateRights {get;set;}
public bool ProfileDeleteRights {get;set;}
public bool ProfileExportRights {get;set;}
public Guid? GridGUID {get;set;}

public Magic_Mmb_ProfilesGridExcptns(MagicFramework.Data.Magic_Mmb_ProfilesGridExcptn A)
{
this.ID = A.ID;
this.Profile_ID = A.Profile_ID;
this.MagicGrid_ID = A.MagicGrid_ID;
this.isVisible = A.isVisible;
this.ProfileExecRights = A.ProfileExecRights;
this.ProfileUpdateRights = A.ProfileUpdateRights;
this.ProfileDeleteRights = A.ProfileDeleteRights;
this.ProfileExportRights = A.ProfileExportRights;
this.GridGUID = A.GridGUID;
}
}
}

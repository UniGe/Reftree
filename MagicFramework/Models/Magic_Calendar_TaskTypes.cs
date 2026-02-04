using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Calendar_TaskTypes{

public int taskTypeID {get;set;}
public string Description {get;set;}
public string Color {get;set;}

public Magic_Calendar_TaskTypes(Data.Magic_Calendar_TaskTypes A) {
this.taskTypeID = A.taskTypeID;
this.Description = A.Description;
this.Color = A.Color;
}
}
}

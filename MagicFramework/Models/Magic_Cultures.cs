using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

public class Magic_Cultures{

public int Magic_CultureID {get;set;}
public string Magic_CultureLanguage {get;set;}
public string Magic_CultureCode {get;set;}
public string Magic_ISO639x {get;set;}
public string Magic_LanguageDescription { get; set; }
public string Magic_Language { get; set; }

public Magic_Cultures(MagicFramework.Data.Magic_Cultures A) {
this.Magic_CultureID = A.Magic_CultureID;
this.Magic_CultureLanguage = A.Magic_CultureLanguage;
this.Magic_CultureCode = A.Magic_CultureCode;
this.Magic_ISO639x = A.Magic_ISO639x;
this.Magic_LanguageDescription = A.Magic_LanguageDescription;
this.Magic_Language = A.Magic_Language;

}
}
}

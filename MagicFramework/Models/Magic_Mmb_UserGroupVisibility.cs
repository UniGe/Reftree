using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models {

    public class Magic_Mmb_UserGroupVisibility
    {

        public int ID {get;set;}
        public string Codice {get;set;}
        public string Descrizione {get;set;}
        public DateTime? DataInserimento {get;set;}
        public string AssignedGroupCode {get;set;}
        public int? ParentGroup_ID { get; set; }
        public string userGroupLogo { get;set;}
        public Magic_Mmb_UserGroupVisibility()
        { 

        }

        public Magic_Mmb_UserGroupVisibility(MagicFramework.Data.Magic_Mmb_UserGroupVisibility A) {
            this.ID = A.ID;
            this.Codice = A.Codice;
            this.Descrizione = A.Descrizione;
            this.DataInserimento = A.DataInserimento;
            this.AssignedGroupCode = A.AssignedGroupCode;
            this.ParentGroup_ID = A.ParentGroup_ID;
        }
    }
}

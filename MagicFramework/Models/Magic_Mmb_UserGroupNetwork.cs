using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{

    public class Magic_Mmb_UserGroupNetwork
    {

        public int ID { get; set; }
        public string Code { get; set; }
        public string Description { get; set; }
        public int? BusinessObject_ID { get; set; }
        public string BusinessObjectType { get; set; }

        public Magic_Mmb_UserGroupNetwork(MagicFramework.Data.Magic_Mmb_UserGroupNetwork A)
        {
            this.ID = A.ID;
            this.Code = A.Code;
            this.Description = A.Description;
            this.BusinessObject_ID = A.BusinessObject_ID;
            this.BusinessObjectType = A.BusinessObjectType;
        }

        public Magic_Mmb_UserGroupNetwork(int id, string code, string description, int? boid, string botype)
        {
            this.ID = id;
            this.Code = code;
            this.Description = description;
            this.BusinessObject_ID = boid;
            this.BusinessObjectType = botype;
        }
    }
}

using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace MagicFramework.Data
{
    public partial class MagicDBEntities : DbContext
    {
        public MagicDBEntities(string c)
            : base(c)
        {
        }
    }
}
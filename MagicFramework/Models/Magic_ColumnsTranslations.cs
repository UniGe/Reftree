using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{
    public class Magic_ColumnsTranslations : Magic_Columns
    {
        public Dictionary<string, string> Translations { get; set; }
        public Magic_ColumnsTranslations(MagicFramework.Data.Magic_Columns A)
            : base(A)
        {
            Translations = new Dictionary<string, string>();
                       
            foreach (var c in A.Magic_ColumnLabels)
            {
                this.Translations.Add(c.Magic_Cultures.Magic_CultureLanguage, c.ColumnLabel);                
            }
        }


    }
}
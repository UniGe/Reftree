using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace MagicFramework.Helpers
{
    public class UserLicense
    {
       
        public static bool isValid(int idUser)
        {
            try
            {
                DataSet ds;               
                dynamic spData = new System.Dynamic.ExpandoObject();
                //                String spUserLicenseIsValid = System.Configuration.ConfigurationManager.AppSettings["spUserLicenseIsValid"];
                String spUserLicenseIsValid = ApplicationSettingsManager.getUserLicense().spUserLicenseIsValid;
                if (String.IsNullOrEmpty(spUserLicenseIsValid))
                    return false;

                ds = new DatabaseCommandUtils().GetDataSetFromStoredProcedure(spUserLicenseIsValid, spData, null, null, idUser, null);
                if (ds != null)
                {                    
                    return ds.Tables[0].Rows[0]["isValid"].Equals(true);                  
                }
                else
                    return false;
            }
            catch
            {
                return false;
            }
        }
    }
}
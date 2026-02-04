using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MagicFramework.Helpers;
using System.Data;

namespace MagicFramework.MemberShip
{

   
    public static class SystemRightsChecker
    {
        public static bool isPasswordExpired() {
            bool expired = false;
            try
            {
                DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                DataTable table = null;
                dynamic spData = new System.Dynamic.ExpandoObject();
                int expirationDays = -1;
                if (int.TryParse(ApplicationSettingsManager.getPasswordExpirationDays(), out expirationDays)) { 
                    spData.numberOfDays = expirationDays;
                    //spData.profiles =  SessionHandler.UserApplicationProfiles.Split(';');
                    DataSet ds = dbutils.GetDataSetFromStoredProcedure("Custom.checkPasswordHasExpired", spData);
                    table = ds.Tables[0];
                    expired = bool.Parse(table.Rows[0]["expired"].ToString());
                }
            }
            catch
            {
                return false;
            }
            return expired;
        }
        public static bool isSystemUser()
        {
            string[] authorizedProfiles = { "admin", "developer", "administrator" };
            string[] profiles = SessionHandler.UserApplicationProfiles.Split(';');
            int numprofiles = profiles.Length - 1; //; finale
            string[] profilecodes = new string[numprofiles];
            int i=0;
            foreach (var p in profiles)
            {
                if (p.Split('|').Length == 3)
                {
                    string profilename = p.Split('|')[1];
                    profilecodes[i] = profilename.ToLower();
                    i++;
                }
            }
            if (profilecodes.Intersect(authorizedProfiles).Any())
                return true;

            return false;
        }
        public static bool isSchedulerUser()
        {
            string profiles = SessionHandler.UserApplicationProfiles;

            string[] profilesvet = profiles.Split(';');

            foreach (var v in profilesvet)
            {
                var vu = v.Split('|');
                if (vu.Length == 3)
                {
                    if (vu[2].ToLower() == "true")
                    {
                        return true;
                    }

                }
            }

            return false;

        }
        public static string getProfileNames()
        {

            List<string> profilelist = new List<string>();
            string profiles = SessionHandler.UserApplicationProfiles;

            string[] profilesvet = profiles.Split(';');

            foreach (var v in profilesvet)
            {
                var vu = v.Split('|');
                if (vu.Length == 3)
                {
                    profilelist.Add(vu[1]);

                }
            }

            return String.Join(",",profilelist);
        
        }

        public static void checkSystemRights()
        {
            if (!isSystemUser())
                throw new Exception("User is not authorized to perform this operation (malicious access?)");
        
        }

        public static void checkSystemRights(string aRight)
        {
            bool checkResult;
            try {
                DatabaseCommandUtils dbutils = new DatabaseCommandUtils();
                DataTable table = null;
                dynamic spData = new System.Dynamic.ExpandoObject();
                spData.systemRight = aRight;
                //spData.profiles =  SessionHandler.UserApplicationProfiles.Split(';');
                DataSet ds = dbutils.GetDataSetFromStoredProcedure("Custom.checkSystemRights", spData);
                table = ds.Tables[0];
                checkResult = table.Rows[0]["result"].ToString().Equals("1");             
            }           
            catch
            {
             checkSystemRights();
                return;
            }
            if (!(checkResult))
                throw new Exception("User is not authorized to perform this operation (malicious access?)");            
        }
    }
}
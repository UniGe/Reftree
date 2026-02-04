using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Caching;
using System.IO;
using Ilos.Licence.LicenceManager;
using System.Configuration;

namespace MagicFramework.Helpers
{
    public class License
    {
      
        private static Hashtable Licencelist = new Hashtable();

        private static void LoadLicences()
        {
            // Verify if cache contains Licences Hashtable
            string pathLicenze = AppDomain.CurrentDomain.BaseDirectory + "\\Licence";
            string cachekey = Helpers.CacheHandler.Licences;
            if (Directory.Exists(pathLicenze))
            {
                if ((HttpContext.Current.Cache.Get(cachekey) == null) || (Licencelist.Count != Directory.GetFiles(pathLicenze).Count()))
                {
                    lock (Licencelist.SyncRoot)
                    {
                        Licencelist.Clear();
                        {
                            foreach (string file in Directory.GetFiles(pathLicenze))
                            {
                                try
                                {
                                    LicenseKey licenza = new LicenseKey(file);
                                    if (licenza.IsValid())
                                        Licencelist.Add(licenza.ApplicationDomain, licenza);
                                }
                                catch { }
                            }
                        }
                    }
                    HttpContext.Current.Cache.Insert(cachekey, Licencelist);
                }
                else
                    Licencelist = (Hashtable)HttpContext.Current.Cache.Get("Licences");            
            }
           
        }
        /// <summary>
        /// Checks if the licence is free for all domains
        /// </summary>
        /// <returns></returns>
        public static bool isFreeVersion()
        {
            var isfree = ConfigurationManager.AppSettings["freeVersion"];
            if (!String.IsNullOrEmpty(isfree))
            {
                bool amifree = false;
                if (bool.TryParse(isfree, out amifree))
                {
                    return amifree;
                }
                else
                    return false;
            }
            return false;
        }
        public static bool CheckValidLicence() 
        {
           LoadLicences();
           
           if (Licencelist != null)
           {
               string url = HttpContext.Current.Request.Url.Authority;
               // TODO: Verificare se mantenere l'esclusione di localhost dal check di validità della licenza
               if ((Licencelist.Contains(url)) || (url.Contains("localhost")) || (isFreeVersion() == true))               
               {
                   return true;
               }
               else
                   return false;
           }
           else            
               return false;           
        }

    }

}
using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Caching;

namespace MagicFramework.Helpers
{
        
    public class CacheHandler
    {
        public const string PW_CHANGED_PREFIX = "USER_PW_CHANGED_";
        public const string GridsPrefix = "_Grid_";
        public const string FunctionsPrefix = "_Functions_";
        public const string LayersGridsPrefix = "_LayersGrids_";
        public static string UgTree { get { return SessionHandler.ApplicationInstanceId + "_UgTree_"; } }
        public static string MenuUserID { get { return SessionHandler.ApplicationInstanceId + "_MenuUserID_"; } }
        public static string Licences { get { return "Licences"; } }
        public static string EntityVisibilityRules { get { return SessionHandler.ApplicationInstanceId + "_EntVsb_"; } }
        public static string Grids { get { return SessionHandler.ApplicationInstanceId + GridsPrefix; } }
        public static string LayerGrids { get { return SessionHandler.ApplicationInstanceId + LayersGridsPrefix; } }
        public static string Functions { get { return SessionHandler.ApplicationInstanceId + FunctionsPrefix; } }
        public static string Configurations { get { return "Configurations_"; } }

        public static string getGridKey(string gridname,string functionid, string layerid)
        {
           return Grids + "Name:" + gridname + "_FunctionID:" + functionid + "_CultureID:" + SessionHandler.UserCulture.ToString() + "_LayerID:" + layerid;
        }
        /// <summary>
        /// In fase di cancellazione vado a svuotare la cache di tutte le istanze di griglia o funzione per gestire i casi in cui 
        /// target differenti condividono la stessa configurazione
        /// </summary>
        /// <param name="prefix">il prefisso usato in scrittura</param>
        /// <returns>il prefisso generico senza l' istance id</returns>
        private static string alterPrefix(string prefix)
        {
                if (prefix.Contains(GridsPrefix))
                    return GridsPrefix;
                if (prefix.Contains(FunctionsPrefix))
                    return FunctionsPrefix;
                if (prefix.Contains(LayersGridsPrefix))
                    return LayersGridsPrefix;
            return prefix;

        }
        public static void manageDependencies(string prefix)
        {
            if (prefix == GridsPrefix)
                EmptyCacheForPrefix(LayerGrids);
        }
        public static bool EmptyCacheForPrefix(string prefix) {
            prefix = alterPrefix(prefix);
            IDictionaryEnumerator _enumerator = HttpRuntime.Cache.GetEnumerator();
            while (_enumerator.MoveNext())
            {
                object _currentKey = _enumerator.Key;
                if (_currentKey.ToString().Contains(prefix)) {
                    //HttpContext.Current.Cache.Remove(_currentKey.ToString());
                    HttpRuntime.Cache.Remove(_currentKey.ToString());
                }
            }
            manageDependencies(prefix);
            return true;            
        }

        //public static void EmptyCacheForAllApplicationInstances(string key)
        //{

        //}

        //public static void EmptyCache(string[] applicationNames, string key)
        //{

        //}

        public static void MagicCacheManager(dynamic data)
        {
            string entity = data.cfgEntityName.ToString();
            switch (entity)
            {
                case "dbo.Magic_ColumnsFunctionOverrides":
                case "dbo.Magic_GridsHistActSettings":
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Grids);
                    if (data.MagicGrid_ID != null)
                    {
                        int gridid = int.Parse(data.MagicGrid_ID.ToString());
                        Models.Magic_Grids.DeleteScriptBuffers(gridid);
                    }
                    if (data.MagicColumn_ID != null)
                    {
                        int columnid = int.Parse(data.MagicColumn_ID.ToString());
                        Models.Magic_Columns.DeleteScriptBuffers(columnid);
                    }
                    break;
                case "dbo.Magic_Trees":
                case "dbo.Magic_FunctionTrees":
                    MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.Functions);
                    break;
                default: break;
            }
        }

        private static string UserLastChangedPasswordCacheKey(int userID)
        {
            return PW_CHANGED_PREFIX + SessionHandler.ApplicationInstanceId + "_" + userID;
        }

        public static DateTime? UserLastChangedPassword(int userID)
        {
            return HttpRuntime.Cache.Get(UserLastChangedPasswordCacheKey(userID)) as DateTime?;
        }

        public static void UserLastChangedPassword(int userID, DateTime? lastChanged)
        {
            HttpRuntime.Cache.Insert(UserLastChangedPasswordCacheKey(userID), lastChanged);
        }

        public static string AuthorityApplicationInstanceKeyPrefix()
        {
            return SessionHandler.ApplicationDomainURL + "_" + SessionHandler.ApplicationInstanceId + "_";
        }

        public static ValidCounter Increment (string key, int validForSeconds = 60)
        {
            int? counter = HttpRuntime.Cache.Get(key) as int? ?? 0;
            counter++;
            DateTime validUntil;
            if (counter == 1)
            {
                validUntil = DateTime.UtcNow.AddSeconds(validForSeconds);
                HttpRuntime.Cache.Add(key + "_valid", validUntil, null, validUntil, Cache.NoSlidingExpiration, CacheItemPriority.High, null);
            }
            else
            {
                validUntil = (DateTime)HttpRuntime.Cache.Get(key + "_valid");
            }
            HttpRuntime.Cache.Insert(key, counter, null, validUntil, Cache.NoSlidingExpiration, CacheItemPriority.High, null);
            return new ValidCounter
            {
                Counter = (int)counter,
                ValidUntil = validUntil,
            };
        }

        public class ValidCounter
        {
            public int Counter { get; set; }
            public DateTime ValidUntil { get; set; }
        }
    }
}
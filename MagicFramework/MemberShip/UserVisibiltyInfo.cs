using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web;
using System.Data;
using MagicFramework.Helpers;

namespace MagicFramework.UserVisibility
{
    public static class UserVisibiltyInfo
    {

        //e' la funzione SQL da usare per creare il filtro aggiuntivo basato sulle caratteristiche del BO
        

        public static List<DataRow> callVisibilityQueries(string queryparameter, string querycode,MagicFramework.Helpers.DatabaseCommandUtils dbhandler)
        {
            //D.T patch: gestione carattere " all' interno delle stringhe 6/10/2015 
            string querypar = queryparameter.Replace("\"", "\\\"");
            string json = "{\"parameter\":\"" + querypar + "\",\"querycode\":\"" + querycode + "\"}";
            var xml = MagicFramework.Helpers.JsonUtils.Json2Xml(json);
            var dbres = dbhandler.callStoredProcedurewithXMLInput(xml, "dbo.Magic_SolveVsbltyQueries");
            List<DataRow> result = dbres.table.AsEnumerable().ToList();
            return result;
        }

        public static string GetUserCompanyRoles()
        {
            string companyroles = String.Empty;

            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var result = callVisibilityQueries(SessionHandler.IdUser.ToString(), "USERCOMPANYROLES", dbhandler);

            foreach (var cr in result)
            {
                //ID | Codice | ProfileScheduleRights puo' schedulare risorse(dashboard) separati da ;
                companyroles+=cr[0].ToString()+"|" + cr[1].ToString()+"|"+ cr[2].ToString() + ";";
                }

            return companyroles;
            
        }

        public static string GetUserApplicationProfile()
        {
            string profiles = String.Empty;

            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var result = callVisibilityQueries(SessionHandler.IdUser.ToString(), "USERPROFILES", dbhandler);

            foreach (var pr in result)
            {
                //ID | Codice | puo' schedulare risorse(dashboard) separati da ;
                profiles += pr[0].ToString() + "|" + pr[1].ToString() + "|" + pr[2].ToString() + ";";
            }

            return profiles;

        }

        /// <summary>
        /// Ricorsione sull'  albero di visibilita' per il caricamento di tutti gli utenti
        /// </summary>
        /// <param name="groupid">Punto di partenza</param>
        /// <param name="JSON">la stringa su cui appendere i risultati della ricorsione</param>
        /// <param name="Request"></param>
        /// <returns>Una JSON string che rappresenta l' albero della visibilita' e gli utenti ad esso collegati (grafo)</returns>
        public static string recurinGroupTreeUsers(int groupid, string JSON, HttpRequestMessage Request)
        {

            Uri MyUrl = null;
            if (Request != null)
                MyUrl = Request.RequestUri;

            string toadd = String.Empty;
            //dato un gruppo faccio il get degli utenti
            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            //Interrogo il DB per avere tutti gli utenti legati ad un certo gruppo
            var result = callVisibilityQueries(groupid.ToString(), "USERSFROMGROUP",dbhandler);

            int count = result.Count();
            int j = 0;
            foreach (var au in result)
            {
                j++;
                //au[1] e' l' utente_ID
                if (int.Parse(au[1].ToString()) != MagicFramework.Helpers.SessionHandler.IdUser)
                {
                    //au[4] e' lo username
                    toadd += au[4].ToString() + "|" + au[1].ToString();
                    if (j < count)
                        toadd += ",";
                }
            }

            var result2 = callVisibilityQueries(groupid.ToString(), "ILEVELCHILDRENOFGROUP", dbhandler);

            int counter = result2.Count();
            int i = 0;
            if (counter > 0)
            {

                foreach (var assetchild in result)
                {

                    if (i < counter)
                        toadd += ",";
                    i++;
                    toadd += recurinGroupTreeUsers(int.Parse(assetchild[0].ToString()), JSON, Request);

                }

            }

            return toadd;
        }
        public static string recurinGroupTree(string groupid, string JSON, HttpRequestMessage Request)
        {
            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();

            Uri MyUrl = null;
            if (Request != null)
                MyUrl = Request.RequestUri;

            string toadd = String.Empty;

            //load da anagrafica gruppi dei dati del groupid
            List<DataRow> result = callVisibilityQueries(groupid, "GROUPBYID", dbhandler);
            var firstresult = result.FirstOrDefault();
            // 0 = ID, 1= assignedgroupcode , 2 = Descrizione , 3 = Business Object
            toadd += "{\"assettoexplode\":\"" + firstresult[2].ToString() + "\",\"type\":\"Group\",\"assignedgroupcode\":\"" + firstresult[1].ToString() + "\",\"ownerboid\":\"" + firstresult[3].ToString() + "\",\"ownerbotype\":\"" + firstresult[4].ToString() + "\",\"GROUPID\":\"" + firstresult[0].ToString() + "\",\"expanded\":true,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/group.png\",\"items\":[";
            var resultusers = callVisibilityQueries(groupid, "USERSFROMGROUP", dbhandler);

            int count = resultusers.Count();
            int j = 0;
            foreach (var au in resultusers)
            {
                string name = String.Empty;
                //4= Username, 5 = FirstName , //6= LastName
                if (au[5].ToString() != null && au[6].ToString() != null)
                    name = au[5].ToString() + " " + au[6].ToString();
                if (name == String.Empty)
                    name = au[4].ToString();
                //8 = Email
                //name = name + " - " + au[8].ToString();
                //1 = UserID, 12 = UserGroupVisibility_ID , 10 = UserSymbolImg
                toadd += "{\"assettoexplode\":\"" + name + "\",\"type\":\"User\",\"USERID\":\"" + au[1].ToString() + "\",\"GROUPID\":\"" + au[12].ToString() + "\",\"expanded\":true,imageUrl:\"http://" + MyUrl.Authority + "/Magic/Styles/Images/user.png\",symbol:\"http://" + MyUrl.Authority + (au[10].ToString() == null ? "null.png" : au[10].ToString()) + "\",\"items\":[]}";
                j++;
                if (j < count)
                    toadd += ",";

            }
            int i = 0;
            //Load dei gruppi figli del gruppo 
            var resultgroups = callVisibilityQueries(groupid, "ILEVELCHILDRENOFGROUP", dbhandler);
            int counter = resultgroups.Count();
            if ((j > 0) && (counter > 0))
                toadd += ",";
            if (counter > 0)
            {
                foreach (var groupchild in resultgroups)
                {
                    toadd += recurinGroupTree(groupchild[0].ToString(), JSON, Request);

                    if (i < counter)
                    {
                        toadd += ",";//virgola tra i children
                    }
                    i++;
                }
                toadd = toadd.Substring(0, toadd.Length - 1) + "]}";
            }
            else toadd += "]}";
            return toadd;
        }

        public static Dictionary<int, string> GetUserVisibiltyGroups(int userID)
        {
        
            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var result = callVisibilityQueries(userID.ToString(), "GROUPSFROMUSERS", dbhandler);

            Dictionary<int, string> list = new Dictionary<int, string>();
            //0 = ID del gruppo
            foreach (var r in result)
            {
                list[(int)r[0]] = r.Table.Columns.Count > 7 ? r[7].ToString() : null;
            };

            return list;
        }

        private static string getGroupTree(string groupid)
        {
            return getGroupTree(groupid, new MagicFramework.Helpers.DatabaseCommandUtils());
        }

        public static string getGroupTree(string groupid, MagicFramework.Helpers.DatabaseCommandUtils dbhandler)
        {
            string toadd = String.Empty;
            toadd += groupid;
            var ugvigroup = callVisibilityQueries(groupid, "ILEVELCHILDRENOFGROUP", dbhandler);

            int counter = ugvigroup.Count();
            if (counter > 0)
            {
                foreach (var assetchild in ugvigroup)
                {//0 = ID
                    toadd += "," + getGroupTree(assetchild[0].ToString());
                }
            }
            return toadd;
        }
        /// <summary>
        /// The method returns the list of Parents of a certain group 
        /// </summary>
        /// <param name="userID">The user which determines the starting group in recursion</param>
        /// <returns>a  comma separated list of groupids</returns>
        public static string GetUserGroupVisibiltyParentSet()
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
            
            String listofparents = String.Empty;
            listofparents += getGroupParentsTree(MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString()); //+ ",";
            listofparents = listofparents.TrimEnd(',');

            return listofparents == String.Empty ? "-1" : listofparents;
        }

        private static string getGroupParentsTree(string groupid)
        {
            string toadd = String.Empty;
            toadd += groupid;
            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var usergroups = callVisibilityQueries(groupid, "GROUPPARENT", dbhandler);

            var assetparent = usergroups.FirstOrDefault();
            if (assetparent != null)
                toadd += "," + getGroupParentsTree(assetparent[0].ToString());

            return toadd;
        }
        //Caso di gruppo di filtro mappato a BO property ed. Gruppo di utenti 1 (filtro proprieta' Fondo1) -->
        //                                                                                                  Gruppo 2 (manutenzione)
        // se l' utente e' posizionato in Gruppo 2 salgo di livello per cercare il filtro e se lo trovo lo aggiungo alla lista
        //ricorro dal nodo corrente ai padri cercando i gruppi con il campo filtro popolato
        public static string getGroupParentsTreeWithFilterProperty(string groupid)
        {
            
            string toadd = String.Empty;
            try
            {
                var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
                var usergroups = callVisibilityQueries(groupid, "GROUPBYID", dbhandler);

                List<string> listoffilters = new List<string>();
                var item = usergroups.FirstOrDefault();
                bool hasfather = item[5].ToString() != "" ? true : false;
                if (item[8].ToString() != "" && !hasfather)
                    listoffilters.Add(item[8].ToString()); //ID del gruppo - attributo filtro

                while (hasfather)
                {
                    if (item[8].ToString() != "")
                        listoffilters.Add(item[8].ToString()); //ID del gruppo - attributo filtro
                    hasfather = item[5].ToString() != "" ? true : false;
                    if (hasfather)
                        item = callVisibilityQueries(item[5].ToString(), "GROUPBYID", dbhandler).FirstOrDefault();
                }
                toadd = string.Join(",", listoffilters);
            }
            catch (Exception ex) {
                throw new System.ArgumentException("getGroupParentsTreeWithFilterProperty::Problems managing USERGROUPS/AREVIS to Users associations (GROUPBYID in Magic_VsbltyQueries). Exception says:" + ex.Message);
            }
            return toadd;
        }
        
            /// <summary>
        /// The method returns the list of Visibility Groups that a user can "see" : multiple groups and their sons
        /// </summary>
        /// <param name="userID"></param>
        /// <returns>a comma separated string with the list of Group ids</returns>
        public static string GetUserAllGroupsVisibiltyChildrenSet(string userID)
        {
            //Data.MagicDBDataContext _context = new Data.MagicDBDataContext(MagicFramework.Helpers.SessionHandler.MagicDBConnectionString);

            //var usergroups = from e in _context.Magic_Mmb_UserGroupVisibilityUsers
            //                 where e.User_ID == userID 
            //                 select e.Magic_Mmb_UserGroupVisibility;
            
            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var usergroups = callVisibilityQueries(userID, "GROUPSFROMUSERS", dbhandler);
            String listofchildren = String.Empty;
            string groupofchildren = string.Empty;
            string cachekey = string.Empty;

            foreach (var ug in usergroups)
            {//0 = ID della tabella con i gruppi di visibilita'
                cachekey = MagicFramework.Helpers.CacheHandler.UgTree + ug[0].ToString();
                if (HttpContext.Current.Cache[cachekey] != null)
                {
                    groupofchildren = HttpContext.Current.Cache[cachekey].ToString();
                }
                else
                {
                    groupofchildren = getGroupTree(ug[0].ToString());
                    HttpContext.Current.Cache.Insert(cachekey, groupofchildren);
                }
                listofchildren += groupofchildren + ",";
            }
            listofchildren = listofchildren.TrimEnd(',');

            //remove comments for testing cache performance
            //MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.UgTree);

            return listofchildren == String.Empty ? "-1" : listofchildren;
        }
        /// <summary>
        /// The method returns the list of Visibility Groups that a user can "see" : his currently selected group in session and its sons
        /// </summary>
        /// <param name="userID"></param>
        /// <returns>a comma separated string with the list of Group ids</returns>
        public static string GetUserGroupVisibiltyChildrenSet()
        {
            
            string groupofchildren = string.Empty;
            string cachekey = string.Empty;

            cachekey = MagicFramework.Helpers.CacheHandler.UgTree + MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString();
                if (HttpContext.Current.Cache[cachekey] != null)
                {
                    groupofchildren = HttpContext.Current.Cache[cachekey].ToString();
                }
                else
                {
                    groupofchildren = getGroupTree(MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString());
                    HttpContext.Current.Cache.Insert(cachekey, groupofchildren);
                }
        
            //remove comments for testing cache performance
            //MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.UgTree);

                return groupofchildren == String.Empty ? "-1" : groupofchildren.TrimEnd(',');
        }

        public static string appendBusinessObjectAttributeFilterToWhereCondition(string listofBusinessObjectsAttributefilters, string businessObjectsVisibilityField, string pkname, string solverfunction, string wherecondition, string groupVisibilityField)
        {
            string condition = String.Empty;
            
            if (!String.IsNullOrEmpty(wherecondition))
                condition = " AND ";
            string usergroupcondition = groupVisibilityField + "=" + MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString() + " ";
            string pipedList = String.Empty;
            List<string> list = listofBusinessObjectsAttributefilters.Split(',').ToList();
            pipedList = "'" + String.Join("|", list) + "'";
            string filtertoadd = wherecondition + condition + usergroupcondition + " AND " + String.Format(solverfunction, pkname, pipedList, businessObjectsVisibilityField);
            return filtertoadd;
        }

        public static string getWhereCondition(string tablename, string wherecondition)
        {
            Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());

             string methodToCall = String.Empty;
             if (HttpContext.Current.Cache[CacheHandler.EntityVisibilityRules + tablename] != null)
             {
                 methodToCall = HttpContext.Current.Cache[CacheHandler.EntityVisibilityRules + tablename].ToString();
             }
             else
             {
                 var ruleforentity = (from e in _context.Magic_EntitiesVsbltyRules where e.Magic_Entity == tablename select e).FirstOrDefault();

                 if (ruleforentity == null)
                 {
                     var defaultrule = (from e in _context.Magic_VsbltyRules where e.isdefault == true select e).FirstOrDefault();
                     Data.Magic_EntitiesVsbltyRules er = new Data.Magic_EntitiesVsbltyRules();
                     er.Magic_VsbltyRule_ID = defaultrule.ID;
                     er.Magic_Entity = tablename;
                     _context.Magic_EntitiesVsbltyRules.InsertOnSubmit(er);
                     _context.SubmitChanges();
                     HttpContext.Current.Cache.Insert(CacheHandler.EntityVisibilityRules + tablename, defaultrule.Magic_VsbltyRule);
                     methodToCall = defaultrule.Magic_VsbltyRule;
                 }
                 else
                 {
                     HttpContext.Current.Cache.Insert(CacheHandler.EntityVisibilityRules + tablename, ruleforentity.Magic_VsbltyRules.Magic_VsbltyRule);
                     methodToCall = ruleforentity.Magic_VsbltyRules.Magic_VsbltyRule;
                 }
            }
            string listofvisiblebus = "";
            if (methodToCall == "FROMPARENTTOCHILDREN")
                listofvisiblebus = GetUserGroupVisibiltyParentSet();
            else 
            if (String.IsNullOrEmpty(methodToCall)|| methodToCall == "FROMCHILDRENTOPARENT")
            {
                listofvisiblebus = GetUserGroupVisibiltyChildrenSet();
            }
            else if (methodToCall == "ALL")
            {
                listofvisiblebus = GetUserGroupVisibiltyParentSet() + "," + GetUserGroupVisibiltyChildrenSet();
            }
            else
            {
                listofvisiblebus = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString();
            }
            var list = listofvisiblebus.Split(',').ToList();
            var listofgroups = new List<String>();
            string field = ApplicationSettingsManager.GetVisibilityField();
            foreach (var y in list)
                listofgroups.Add(field + " = " + y);
            // F.P. reversed order of conditions in order to prevent buffer overrun attacks on visibility

            //D.T solved bug when wherecondition is ""
            List<string> conditions = new List<string>
            {
                $"({String.Join(" || ", listofgroups)})"
            };

            if (!String.IsNullOrWhiteSpace(wherecondition)) // Catches both empty and whitespace-only strings
                conditions.Add($"({wherecondition.Trim()})"); // Prevents " ( ) "


            wherecondition = $"({String.Join(" AND ",conditions)})";

            return wherecondition;
        }

        /// <summary>
        /// Returns network informations for a given set of groups
        /// </summary>
        /// <param name="group"></param>
        /// <returns>Returns Network (key) - Network Owner and Group Owner as second item as a KeyValuePair</returns>
        internal static Dictionary<int,KeyValuePair<int,int>> GetUserVisibiltyAndNetworkOwners(List<int> groupids)
        {
          //  Data.MagicDBDataContext _context = new Data.MagicDBDataContext(MagicFramework.Helpers.SessionHandler.MagicDBConnectionString);
            //var usergroup = from e in _context.Magic_Mmb_UserGroupVisibility
            //                where groupid.Contains(e.ID)
            //                select e;
            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var usergroups = callVisibilityQueries(String.Join(",",groupids) ,"GROUPSET", dbhandler);

            Dictionary<int, KeyValuePair<int, int>> result = new Dictionary<int, KeyValuePair<int, int>>(); 
            
            foreach (var ug in usergroups)
            {   //0 = a.ID,1= a.Network_ID,2= a.BusinessObject_ID,3= a.ParentGroup_ID,4 = a.Codice,5 = a.Descrizione,6 = b.BusinessObject_ID as NetworkBusinessObject,7 = a.AssignedGroupCode
                if (!result.ContainsKey((int.Parse(ug[1].ToString()))))
                {
                    result.Add((int.Parse(ug[1].ToString())), new KeyValuePair<int, int>((int)(ug[6].ToString() == "" ? -1 : int.Parse(ug[6].ToString())), (int)(ug[2].ToString() == "" ? -1 : int.Parse(ug[2].ToString()))));
                
                }
            
            }
            return result;
        }
    }
}
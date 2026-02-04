using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Net;
using System.Net.Http;
using AttributeRouting.Web.Http;
using System.Linq.Dynamic;
using System.Configuration;
using Newtonsoft.Json.Linq;
using MagicFramework.Helpers;
using System.Data;

namespace MagicFramework.Controllers
{
    public class Magic_Mmb_UserGroupVisibilityController :ApiController
    {

        public const string genericError = "An error has occured";
      // the linq to sql context that provides the data access layer
         private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
      List<int> childrengroups = new List<int>();

      #region UITreeMethodsCustom
      /// <summary>
      /// Returns the tree definition starting from the posted root
      /// </summary>
      /// <param name="data"></param>
      /// <returns>a string representation of the tree</returns>
      [HttpPost]
      public string PostBuildUserGroupTree(dynamic data)
      {

          JObject obj = JObject.Parse(data.ToString());

          int rootgroupid = SessionHandler.UserVisibilityGroup;
          // se e' stato passato un parametro diverso uso quello 
          try
          {
              rootgroupid = (int)obj["rootgroupid"];
          }
          catch { }
          
          string JSON = String.Empty;
          //Gli utenti che sono "esterni" rispetto all' entita' di riferimento del network non possono vedere e modificare la rete 
              JSON += MagicFramework.UserVisibility.UserVisibiltyInfo.recurinGroupTree(rootgroupid.ToString(), JSON, Request) + ",";
              JSON = JSON.Substring(0, JSON.Length - 1);
    
          return JSON;
      }

      public class UserShortDescription
      {
          public int UserID { get; set; }
          public string Username { get; set; }
          public string Symbol { get; set; }
          public string EMail { get; set; }
      }
      /// <summary>
      /// Returns the list of managed users starting from the GroupID set by the logged User
      /// </summary>
      /// <param name="data"></param>
      /// <returns></returns>
      [HttpGet]
      public List<UserShortDescription> GetUsersInTreeList()
      {


          HashSet<int> users = new HashSet<int>();
          int rootgroupid = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;

          string JSON = String.Empty;
          
          JSON += MagicFramework.UserVisibility.UserVisibiltyInfo.recurinGroupTreeUsers(rootgroupid, JSON, Request) + ",";

          JSON = JSON.Substring(0, JSON.Length - 1);

          var list = JSON.Split(',');

          List<UserShortDescription> usd = new List<UserShortDescription>();

          foreach (var x in list)
          {
              if (x.Trim() != "")
              {
                  UserShortDescription usdinstance = new UserShortDescription();
                  usdinstance.UserID = Convert.ToInt32(x.Split('|')[1]);
                  usdinstance.Username = x.Split('|')[0];
                  if (!users.Contains(usdinstance.UserID))
                      usd.Add(usdinstance);
                  users.Add(usdinstance.UserID);
              }
          }

          return usd;

      }


      /// <summary>
      /// Returns the list of managed users starting from the GroupID set by the logged User
      /// </summary>
      /// <param name="data"></param>
      /// <returns></returns>
      [HttpGet]
      public List<UserShortDescription> GetManagedUsersList()
      {

         var groupid = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;

          // prendere gli utenti che fanno parte di un certo network
          //var userlist = (from e in _context.Magic_Mmb_Users select e).ToList();
          var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
          var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries("-1", "GETUSERSWITHNETWORK", dbhandler).AsEnumerable().ToList();
          //0 = UserID , 1 = UserName, 2= First , 3= Last , 4 = Email , 5 = Symbol , 6 = Network

          List<UserShortDescription> usd = new List<UserShortDescription>();

          foreach (var x in result)
          {
              //Se l' utente non fa parte di una network specifica o fa parte dello stesso network dell ' utente che fa la richiesta lo visualizzo
              if (x[6].ToString() == "-1" || x[6].ToString() == MagicFramework.Helpers.SessionHandler.UserVisibilityNetwork.ToString())
              {   
                  UserShortDescription usdinstance = new UserShortDescription();
                  usdinstance.UserID = Int32.Parse(x[0].ToString());
                  usdinstance.Username = null;
                  //se ho nome e cognome visualizzo la loro unione se no lo username
                  if (x[2].ToString() != "" && x[3].ToString()!= "")
                      usdinstance.Username = x[2].ToString() + " " + x[3].ToString();
                  if (usdinstance.Username == null)
                      usdinstance.Username = x[1].ToString();
                  usdinstance.Symbol = x[5].ToString();
                  usdinstance.EMail = x[4].ToString();

                  usd.Add(usdinstance);
              }
          }

          return usd;

      }

      [HttpGet]
      public List<Models.Magic_Mmb_UserGroupNetwork> GetNetworkByGroup(int id)
      {
          List<Models.Magic_Mmb_UserGroupNetwork> networklist = new List<Models.Magic_Mmb_UserGroupNetwork>();
          var network = (from e in _context.Magic_Mmb_UserGroupVisibility where e.ID == id select new Models.Magic_Mmb_UserGroupNetwork(e.Magic_Mmb_UserGroupNetwork));
          if (network.ToList().Count == 0)
          {
              var m = new Models.Magic_Mmb_UserGroupNetwork(1, "GER", "Network", null, "root");
              networklist.Add(m);
              return networklist;

          }
              
          return network.ToList();
      }


      [HttpPost]
      public List<Models.Magic_BusinessObject> PostGetAllOwners()
      {
          List<Models.Magic_BusinessObject> bos = new List<Models.Magic_BusinessObject>();

          var bolist = _context.Magic_GetAllBusinessUnitsOwners(MagicFramework.Helpers.SessionHandler.IdUser, MagicFramework.Helpers.SessionHandler.UserVisibilityGroup);

          foreach (var b in bolist)
          {
              var bo = new Models.Magic_BusinessObject();
              bo.BusinessObject_ID = b.BusinessObject_ID;
              bo.BusinessObjectType = b.BusinessObjectType;
              bo.BusinessObjectDescr = b.BusinessObjectDescription;
              bos.Add(bo);
          }


          return bos;
      }

      [HttpGet]
      public HttpResponseMessage DeleteUserGroup(int id)
      {
          HttpResponseMessage response = new HttpResponseMessage();
          try
          {
              var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
              var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(id.ToString(), "GROUPBYID", dbhandler).FirstOrDefault();
              // 5 = ParentGroup_ID
              if (result[5].ToString() == "")
                  throw new System.ArgumentException("Non e' possibile cancellare un nodo radice");

              var result2 = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(id.ToString(), "USERSFROMGROUP", dbhandler);
              
              if (result2.Count > 0)
                  throw new System.ArgumentException("Per cancellare una business unit cancellare prima tutti i suoi utenti");

              var result3 = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(id.ToString(), "DELETEGROUP", dbhandler);

              response.StatusCode = HttpStatusCode.OK;
              response.Content = new StringContent("{\"msg\":\"OK\"}");
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("{0}", ex.Message));
          }

          //Cancello la cache degli usergroup 
          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.UgTree);

          return response;

      }


      [HttpPost]
      public HttpResponseMessage PostDeleteUserFromGroup(dynamic data)
      {
          // create a response message to send back
          var response = new HttpResponseMessage();

          int groupid = data.GroupID;
          int userid = data.UserID;

          try
          {
              //var entity = (from e in _context.Magic_Mmb_UserGroupVisibilityUsers where e.UserGroupVisibility_ID == groupid && e.User_ID == userid select e).FirstOrDefault();

              if (groupid == Helpers.SessionHandler.UserVisibilityGroup && userid == Helpers.SessionHandler.IdUser)
                  throw new System.ArgumentException("Non puoi cancellare l' utenza corrente dal network");

              var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
              var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(groupid+";"+userid, "DELETEUSERFROMGROUP", dbhandler);
            
              response.StatusCode = HttpStatusCode.OK;
              response.Content = new StringContent("{\"msg\":\"OK\"}");
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }

      [HttpPost]
      public HttpResponseMessage PostLinkUserToGroup(dynamic data)
      {
          // create a response message to send back
          var response = new HttpResponseMessage();

          int groupid = data.GroupID;
          int userid = data.UserID;

          try
          {
              var contr = new v_Magic_UserGroupVisivilityController();
              contr.updatelink(groupid, userid);
              response.StatusCode = HttpStatusCode.OK;
              response.Content = new StringContent("{\"msg\":\"OK\"}");
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("The database updated failed in User to Groups with error: {0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }

      public class BunitDomain
      {
          public int BusinessUnitID { get; set; }
          public int? OwnerUserID { get; set; }
          public string OwnerUserSymbol { get; set; }
          public string OwnerUserDescription { get; set; }
      
      }
      /// <summary>
      /// Questo metodo viene chiamato dalla funzione Magic di creazione dell' albero di business unit defnita in UserGroupVisibilityTree.aspx
      /// </summary>
      /// <param name="data"></param>
      /// <returns>the created user group id</returns>
      [HttpPost]
      public BunitDomain PostCreateUserGroup(dynamic data)
      {
          BunitDomain res = new BunitDomain();

          int usergroupid = 0;
          var ug = new Data.Magic_Mmb_UserGroupVisibility();
          ug.Codice = data.assettoexplode;
          ug.DataInserimento = DateTime.Now;
          ug.Descrizione = data.assettoexplode;
          ug.ParentGroup_ID = data.parentid;
          if (data.ownerboid.ToString() != "")
            ug.BusinessObject_ID =data.ownerboid;
          ug.BusinessObjectType = data.ownerbotype;
          ug.Network_ID = MagicFramework.Helpers.SessionHandler.UserVisibilityNetwork;

          List<string> pars = new List<string>();
          pars.Add(ug.BusinessObjectType);
          pars.Add(ug.Descrizione);
          pars.Add(ug.ParentGroup_ID.ToString());
          pars.Add(ug.Codice);
          pars.Add(ug.AssignedGroupCode);
          pars.Add(ug.BusinessObject_ID.ToString());
          pars.Add(ug.Network_ID.ToString());

          //ug.Network_ID = (from e in _context.Magic_Mmb_UserGroupVisibility where e.ID == ug.ParentGroup_ID select e.Network_ID).FirstOrDefault();
          var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
          var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(ug.ParentGroup_ID.ToString(), "GROUPBYID", dbhandler).FirstOrDefault();
         
          pars.Add(result[0].ToString());

          var id = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(String.Join(";",pars), "CREATEUSERGROUP", dbhandler).FirstOrDefault();
          //identity della tabella di visibilita'
          usergroupid = int.Parse(id[0].ToString());

          //Cancello la cache degli usergroup 
          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.UgTree);
          
          res.BusinessUnitID = usergroupid;
    
          return res;

      }

      [HttpPost]
      public HttpResponseMessage PostUpdateUserGroupParent(dynamic data)
      {
          // create a response message to send back
          var response = new HttpResponseMessage();

          try
          {
              int idparent = data.ParentID;
              int id = data.GroupID;

              var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
              var entityparent = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(idparent.ToString(), "GROUPBYID", dbhandler).FirstOrDefault();
              var entityupdate = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(id.ToString(), "GROUPBYID", dbhandler).FirstOrDefault();
                
            //[0] = ID , [5] = Parent
              if (entityupdate[0].ToString() == entityparent[5].ToString()) // impedisco di creare loop: se l ' ID che sto per aggiornare e' padre di quella che diventerebbe suo padre blocco
              {
                  throw new System.ArgumentException(MagicFramework.Helpers.Utils.getUIMessage("noloops"));
              }
             if (entityupdate != null && entityparent !=null)
              {
                  // 0 is the ID of the vsibility table
                  if (entityupdate[0] == entityparent[0])
                      entityparent[0] = entityupdate[5]; // 5- ParentID

                  entityupdate[5] = data.ParentID.ToString();
                 //ug.US_AREVIS_ID = 0,ug.US_AREVIS_DESCRIPTION as AssignedGroupCode = 1,ug.US_AREVIS_DESCRIPTION as Description = 2,null as BusinessObject_ID = 3,ug.US_AREVIS_US_CLAVIS_ID as BusinessObjectType = 4,US_AREVIS_PARENT_ID,US_AREVIS_DESCRIPTION as Codice  FROM [core].[US_AREVIS_area_visibility] ug 

                  List<string> pars = new List<string>();
                  pars.Add(entityupdate[0].ToString());  //ID
                  pars.Add(entityupdate[4].ToString());  //CLAVIS or BusinessObjectType 
                  pars.Add(entityupdate[2].ToString()); // Descrizione 
                  pars.Add(entityupdate[5].ToString()); //ParentGroupID
                  pars.Add(entityupdate[6].ToString()); // Codice
                  pars.Add(entityupdate[1].ToString()); // AssignedGroupCOde
                  pars.Add(entityupdate[3].ToString()); //BusinessObjectID
                 
                  var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(String.Join(";", pars), "UPDATEUSERGROUP", dbhandler).FirstOrDefault();
           
                  response.StatusCode = HttpStatusCode.OK;
                  response.Content = new StringContent("{\"msg\":\"OK\"}");
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} Magic_Mmb_UserGroupVisibility was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("The database updated failed: Magic_Mmb_UserGroupVisibility {0}", ex.Message));
          }
          //Cancello la cache degli usergroup 
          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.UgTree);
          // return the HTTP Response.
          return response;
      }
      /// <summary>
      /// Questo metodo viene chiamato dalla funzione Magic di creazione dell' albero di business unit defnita in UserGroupVisibilityTree.aspx
      /// </summary>
      /// <param name="data"></param>
      /// <returns>the status of the transaction</returns>
      [HttpPost]
      public HttpResponseMessage PostUpdateUserGroupName(dynamic data)
      {
          // create a response message to send back
          var response = new HttpResponseMessage();
          int id = data.GroupID;

          var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
          var entityupdate = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(id.ToString(), "GROUPBYID", dbhandler).FirstOrDefault();
          try
          {
              // select the item from the database where the id

              if (id == Helpers.SessionHandler.UserVisibilityGroup)
                  throw new System.ArgumentException("Non puoi modificare la Business Unit a cui sei collegato in questo momento");

              

              if (entityupdate != null)
              {
                  List<string> pars = new List<string>();
                  pars.Add(entityupdate[0].ToString()); //ID
                  pars.Add(data.ownerbotype.ToString()); //BusinessObjectType (CLAVIS)
                  pars.Add(data.Name.ToString()); // Descrizione 
                  pars.Add(entityupdate[5].ToString()); //ParentGroupID
                  pars.Add(data.Name.ToString()); // Codice
                  pars.Add(entityupdate[7].ToString()); // AssignedGroupCOde
                  pars.Add( data.ownerboid.ToString()); //BusinessObjectID

                  var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(String.Join(";", pars), "UPDATEUSERGROUP", dbhandler).FirstOrDefault();

                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
                  response.Content = new StringContent("{\"msg\":\"OK\"}");
              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent(string.Format("The item with id {0} Magic_Mmb_UserGroupVisibility was not found in the database", id.ToString()));
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent(string.Format("{0}", ex.Message));
          }

          // return the HTTP Response.
          return response;
      }

      #endregion

      #region UIUtilsCustom
      /// <summary>
        /// This methods gets the id of a business unit and returns wether the bu is internal or external in the network
        /// </summary>
        /// <param name="id">the id of Magic_UserVisibilityGroup</param>
        /// <returns>true if the group is internal false otherwise</returns>
      [HttpGet]
      public bool isUserGroupInternal(int id)
      {
          //se viene passato -1 di default prendo l' id selezionato dall' utente
          if (id == -1)
          {
              if (MagicFramework.Helpers.SessionHandler.UserVisibilityNetworkOwner == MagicFramework.Helpers.SessionHandler.UserVisibilityGroupOwner)
                  return true;
              else
                  return false;
          }
          else
          {
              //var ugroup = (from e in _context.Magic_Mmb_UserGroupVisibility.Where(x => x.ID == id) select e).FirstOrDefault();
              var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
              var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(id.ToString(), "GROUPBYID", dbhandler).FirstOrDefault();
              //7 - Network_ID
              var network = (from n in _context.Magic_Mmb_UserGroupNetwork where n.ID == int.Parse(result[7].ToString()) select n.BusinessObject_ID).FirstOrDefault();
            //Gli utenti che sono "esterni" rispetto all' entita' di riferimento del network non possono vedere e modificare la rete 
              //3 - BusinessObject_ID  ovvero la persona giuridica / fisica che gestisce il network
              int? businessobjectid = null;
               if (result[3].ToString() != "")
                   businessobjectid =int.Parse(result[3].ToString());

              if (network == businessobjectid)
              {
                  return true;
              }
              else
                  return false;
          }
      }
      //get the session UserGroup Data
      [HttpGet]
      public List<Models.Magic_Mmb_UserGroupVisibility> GetSessionGroup()
      {
          var resobj = (from e in _context.Magic_Mmb_UserGroupVisibility.Where(x => x.ID == MagicFramework.Helpers.SessionHandler.UserVisibilityGroup)
                        select new Models.Magic_Mmb_UserGroupVisibility(e)).ToList();
          return resobj;
      }
      #endregion

      #region UIGridcontrollersStandard
      //get all elements of an entity
	    [HttpGet]
        public List<Models.Magic_Mmb_UserGroupVisibility> GetAll()
        {
            string listofchildren = UserVisibility.UserVisibiltyInfo.GetUserAllGroupsVisibiltyChildrenSet(Helpers.SessionHandler.IdUser.ToString());

            //var list = listofchildren.Split(',').ToList();
            // select from the database, skipping and taking the correct amount
            //var resdb = (from e in _context.Magic_Mmb_UserGroupVisibility
            //              .Where(wherecondition)
            //              where (list.Contains(e.ID.ToString()))
            //              select new Models.Magic_Mmb_UserGroupVisibility(e)).ToList();

            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(listofchildren, "GROUPSET", dbhandler);
            //0 = a.ID,1= a.Network_ID,2= a.BusinessObject_ID,3= a.ParentGroup_ID,4 = a.Codice,5 = a.Descrizione,6 = b.BusinessObject_ID as NetworkBusinessObject,7 = a.AssignedGroupCode
            List<Models.Magic_Mmb_UserGroupVisibility> resdb = new List<Models.Magic_Mmb_UserGroupVisibility>(); 
           foreach (var group in result)
            {
                Models.Magic_Mmb_UserGroupVisibility m = new Models.Magic_Mmb_UserGroupVisibility();
                m.ID = int.Parse(group[0].ToString());
                m.Codice = group[4].ToString();
                m.Descrizione = group[5].ToString();
                int? parentid = null;
               if (group[3].ToString() != "")
                   parentid = Int32.Parse(group[3].ToString());
                m.ParentGroup_ID = parentid;
                m.AssignedGroupCode = group[7].ToString();
                resdb.Add(m);
            }

            return resdb;

        }
        public class Magic_GroupClasses
        {
            public int ID { get; set; }
            public string Description { get; set; }
        }
        [HttpGet]
        public List<Magic_GroupClasses> GetLinkedGroupClasses()
        {
            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            //opero il load di tutti i gruppi /  business units che sono direttamente associati all' utente
            string pars = MagicFramework.Helpers.SessionHandler.IdUser.ToString() + ";" + MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString();
            var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(pars, "VISIBLEGROUPCLASSES", dbhandler);
            //0 = a.ID,1= a.Network_ID,2= a.BusinessObject_ID,3= a.ParentGroup_ID,4 = a.Codice,5 = a.Descrizione,6 = b.BusinessObject_ID as NetworkBusinessObject,7 = a.AssignedGroupCode
            List<Magic_GroupClasses> resdb = new List<Magic_GroupClasses>();
            foreach (var classdef in result)
            {
                Magic_GroupClasses m = new Magic_GroupClasses();
                m.ID = int.Parse(classdef[0].ToString());
                m.Description = classdef[1].ToString();
                resdb.Add(m);
            }

            return resdb;
        
        }

        public class GridRights
        {
            public string GridName { get; set; }
            public int ID { get; set; }
            public bool visible { get; set; }
            public bool update { get; set; }
            public bool delete { get; set; }
            public bool export { get; set; }
            public bool exec { get; set; }
            public string GridGUID { get; set; }
            public bool insert { get; set; }
        }

        [HttpGet]
        public List<GridRights> getUserGridsExceptions()
        {
            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            string pars = MagicFramework.Helpers.SessionHandler.IdUser.ToString() + ";" + MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString();
            var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(pars, "GRIDPROFILEEXCEPTIONS", dbhandler);
            List<GridRights> resdb = new List<GridRights>();
            foreach (DataRow classdef in result)
            {
                GridRights m = new GridRights();
                m.ID = int.Parse(classdef[0].ToString());
                m.GridName = classdef[1].ToString();
                m.update = (bool.Parse(classdef[2].ToString()) == true ? true : false);
                m.exec = (bool.Parse(classdef[3].ToString()) == true ? true : false);
                m.export = (bool.Parse(classdef[4].ToString()) == true ? true : false);
                m.delete = (bool.Parse(classdef[5].ToString()) == true ? true : false);
                m.visible = (bool.Parse(classdef[6].ToString()) == true ? true : false);
                m.GridGUID = classdef[7].ToString();
                if (classdef.Table.Columns.Count > 8)
                    m.insert = (bool.Parse(classdef[8].ToString()) == true ? true : false);
                else
                    m.insert = m.update;

                resdb.Add(m);
            }

            return resdb;

        }


        [HttpGet]
        public List<GridRights> getUserVisibleGridsAndRights()
        {
            var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
            string pars = MagicFramework.Helpers.SessionHandler.IdUser.ToString() + ";" + MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString();
            var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(pars, "VISIBLEGRIDS", dbhandler);
            List<GridRights> resdb = new List<GridRights>();
            foreach (var classdef in result)
            {
                GridRights m = new GridRights();
                m.ID = int.Parse(classdef[0].ToString());
                m.GridName = classdef[1].ToString();
                m.update = (classdef[2].ToString() == "1" ? true : false);
                m.exec = (classdef[3].ToString() == "1" ? true : false);
                m.export = (classdef[4].ToString() == "1" ? true : false);
                m.delete = (classdef[5].ToString() == "1" ? true : false);
                m.visible = true;
                m.GridGUID = classdef[6].ToString();
                if (classdef.Table.Columns.Count > 7)
                    m.insert = (bool.Parse(classdef[7].ToString()) == true ? true : false);
                else
                    m.insert = m.update;
                resdb.Add(m);
            }

            return resdb;

        }

        [HttpGet]
        public JArray GetLinkedGroups()
        {
            try
            {
                int classid = -1;
                if (Request != null && Request.GetQueryNameValuePairs().Count() > 0)
                {
                    classid = Int32.Parse(Request.GetQueryNameValuePairs().Where(s => s.Key.Equals("filter.filters[0].value")).FirstOrDefault().Value);
                }

                var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
                //opero il load di tutti i gruppi /  business units che sono direttamente associati all' utente
                string pars = MagicFramework.Helpers.SessionHandler.IdUser.ToString() + ";" + MagicFramework.Helpers.SessionHandler.UserVisibilityGroup.ToString();
                var result = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(pars, "LINKEDGROUPSET", dbhandler);
                //0 = a.ID,1= a.Network_ID,2= a.BusinessObject_ID,3= a.ParentGroup_ID,4 = a.Codice,5 = a.Descrizione,6 = b.BusinessObject_ID as NetworkBusinessObject,7 = a.AssignedGroupCode
                JArray resdb = new JArray();
                Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                var userExtensions = context.Magic_Mmb_Users_Extensions.Where(u => u.UserID.Equals(MagicFramework.Helpers.SessionHandler.IdUser)).FirstOrDefault();
                int? DefaultUserGroupVisibility_ID = null;
                if (userExtensions != null)
                    DefaultUserGroupVisibility_ID = userExtensions.DefaultUserGroupVisibility_ID;
                foreach (var group in result)
                {
                    Models.Magic_Mmb_UserGroupVisibility m = new Models.Magic_Mmb_UserGroupVisibility();
                    m.ID = int.Parse(group[0].ToString());
                    m.Codice = group[4].ToString();
                    m.Descrizione = group[5].ToString();
                    int? parentid = null;
                    if (group[3].ToString() != "")
                        parentid = Int32.Parse(group[3].ToString());
                    m.ParentGroup_ID = parentid;
                    m.AssignedGroupCode = group[7].ToString();
                    if (group.Table.Columns.Count > 11)
                        m.userGroupLogo = group[11].ToString();
                    if (classid == -1 || (classid.ToString() == group[9].ToString()))// se viene passato il filtro del CLAVIS (classegruppo) filtro per il valore passato se non ho filtri mostro tutto  
                    {
                        JObject obj = JObject.FromObject(m);
                        obj.Add("isDefault", DefaultUserGroupVisibility_ID == m.ID);
                        resdb.Add(obj);
                    }
                }

                return resdb;
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex);
                throw new ArgumentException(genericError);
            }
    }
	//get a single object 
	[HttpGet]
        public List<Models.Magic_Mmb_UserGroupVisibility>  Get(int id)
        {
            var resobj = (from e in _context.Magic_Mmb_UserGroupVisibility.Where(x=> x.ID == id)
                          select new Models.Magic_Mmb_UserGroupVisibility(e)).ToList();
            return resobj;
        }
    

        //The grid will call this method in read mode
     
      [HttpPost]
      public Models.Response Select(Models.Request request)
      {
          
          Helpers.RequestParser rp = new Helpers.RequestParser(request);

          string order = "ID";
          String wherecondition = "1=1";
          if (request.filter!=null)
              wherecondition = rp.BuildWhereCondition(typeof(Models.Magic_Mmb_UserGroupVisibility));


          string listofchildren = UserVisibility.UserVisibiltyInfo.GetUserGroupVisibiltyChildrenSet();
          var list = listofchildren.Split(',').ToList();

          if (request.sort != null && request.sort.Count > 0)
              order = rp.BuildOrderCondition();
       
          var dbres= (from e in _context.Magic_Mmb_UserGroupVisibility
                                            .Where(wherecondition)
                                            
                                            .OrderBy(order.ToString())
                                            .Skip(request.skip)
                                            .Take(request.take)
                      where (list.Contains(e.ID.ToString()))
                      select new Models.Magic_Mmb_UserGroupVisibility(e)).ToArray();                       
                     

           return new Models.Response(dbres, (from e in _context.Magic_Mmb_UserGroupVisibility.Where(wherecondition) where(list.Contains(e.ID.ToString())) select e).Count());
     
      }

    
          //The grid will call this method in update mode
      [HttpPost]
      public HttpResponseMessage PostU(int id,dynamic data)
      {         
          // create a response message to send back
          var response = new HttpResponseMessage();
        
                try
              {
                  // select the item from the database where the id
                  
                  var entityupdate = (from e in _context.Magic_Mmb_UserGroupVisibility
                                      where e.ID == id
                                      select e).FirstOrDefault();
                  
                  if (entityupdate != null)
                  {
                     var updID =  _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "UPDATE", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Mmb_UserGroupVisibility",false);
                     response.StatusCode = HttpStatusCode.OK;
                     response.Content = new StringContent("\"msg\":\"OK\"");
                  }
                  else
                  {
                       response.StatusCode = HttpStatusCode.InternalServerError;
                      response.Content = new StringContent("The database update failed");
                  }
              }
              catch (Exception ex)
              {
                   response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent("The database update failed");
              }
                
          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.UgTree);
          // return the HTTP Response.
          return response;
      }

     
      //The grid will call this method in insert mode
   
      [HttpPost]
      public Models.Response PostI(dynamic data)
      {
          
          int id = -1;
                  var insID = _context.ExecuteJSONCRUD(data.ToString().Replace("'", "''"), id, "INSERT", Helpers.SessionHandler.UserVisibilityGroup, "Magic_Mmb_UserGroupVisibility",false);
                  int inserted = -1;
                  foreach (var item in insID)
                  {
                      inserted = int.Parse(item.modID.ToString());
                  }

                    var dbres  = (from e in _context.Magic_Mmb_UserGroupVisibility
                                                   .Where("ID == "+ inserted.ToString())
                                select new Models.Magic_Mmb_UserGroupVisibility(e)).ToArray();
                    
          MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.UgTree);
          // return the HTTP Response.
        return new Models.Response(dbres, dbres.Length);
 
      }

      [HttpPost]
      public HttpResponseMessage PostD(int id)
      {
          // create a response message to send back
          var response = new HttpResponseMessage();

          try
          {
              // select the item from the database where the id

              var entitytodestroy = (from e in _context.Magic_Mmb_UserGroupVisibility
                                     where e.ID == id
                                     select e).FirstOrDefault();

              if (entitytodestroy != null)
              {
                  //annullo il riferimento al parent che viene cancellato
                  foreach (var x in entitytodestroy.Magic_Mmb_UserGroupVisibility2)
                  { 
                      x.Magic_Mmb_UserGroupVisibility1 = null;
                  }
                      
                  _context.Magic_Mmb_UserGroupVisibility.DeleteOnSubmit(entitytodestroy);
                  _context.SubmitChanges();
                  response.StatusCode = HttpStatusCode.OK;
                  response.Content = new StringContent("\"msg\":\"OK\"");


                  MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.UgTree);
                  _context.SubmitChanges();

              }
              else
              {
                  response.StatusCode = HttpStatusCode.InternalServerError;
                  response.Content = new StringContent("Deletion failed");
              }
          }
          catch (Exception ex)
          {
              response.StatusCode = HttpStatusCode.InternalServerError;
              response.Content = new StringContent("Deletion failed");
          }

          // return the HTTP Response.
          return response;
      }

      #endregion
    }
}
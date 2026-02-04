using System;
using System.Collections.Generic;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using Newtonsoft.Json.Linq;
using System.Linq.Dynamic;
using MagicFramework.Helpers;

namespace MagicFramework.Controllers
{
    
    public class VisibilityController : ApiController
    {
        public const string genericError = "An error has occured";
        [HttpPost]
        public int getSessionUserVisibilityGroup(dynamic data)
        {
            var cid = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;       
            return cid;
        }
        [HttpPost]
        public string getSessionUserVisibilityGroupBOType(dynamic data)
        {
            try
            {
                var cid = MagicFramework.Helpers.SessionHandler.UserVisibilityGroup;
                var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
                var ug = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(cid.ToString(), "GROUPBYID", dbhandler).FirstOrDefault();

                return ug[4].ToString();
            }
            catch (Exception ex) {
                MFLog.LogInFile(ex);
                throw new ArgumentException(genericError);
            }
        }
        

        [HttpPost]
        public int getSessionUserVisibilityGroupOwner(dynamic data)
        {
            var cid = MagicFramework.Helpers.SessionHandler.UserVisibilityGroupOwner;
            return cid;
        }

        [HttpPost]
        public int getSessionUserVisibilityNetwork(dynamic data)
        {
            var cid = MagicFramework.Helpers.SessionHandler.UserVisibilityNetwork;
            return cid;
        }
        [HttpPost]
        public int getSessionUserID(dynamic data)
        {
            var cid = MagicFramework.Helpers.SessionHandler.IdUser;
            return cid;
        }


        private void isPTFVisibleByUser(int id)
        {
            var vc = new Magic_Mmb_UserGroupVisibilityController();
            JArray ptfs = vc.GetLinkedGroups();
            bool found = false;
            foreach (var p in ptfs)
            {
                if (int.Parse(p["ID"].ToString()) == id)
                {
                    found = true;
                    break;
                }
                   
            }
            if (!found)
                throw new ArgumentException("BLK_OUT_LIST"); 
        }
        [HttpPost]
        public void setSessionUserVisibilityGroup(dynamic data)
        {
            try
            {
                int id = Convert.ToInt32(data.id.Value);
                //double check that this id is included in the visible portfolio list
                isPTFVisibleByUser(id);

                MagicFramework.Helpers.SessionHandler.UserVisibilityGroup = id;

                if (data.userGroupLogo != null)
                    MagicFramework.Helpers.SessionHandler.userGroupLogo = data.userGroupLogo;
                else
                    MagicFramework.Helpers.SessionHandler.userGroupLogo = null;


                var dbhandler = new MagicFramework.Helpers.DatabaseCommandUtils();
                var ug = MagicFramework.UserVisibility.UserVisibiltyInfo.callVisibilityQueries(id.ToString(), "GROUPSET", dbhandler).FirstOrDefault();
                //0 = a.ID,1= a.Network_ID,2= a.BusinessObject_ID,3= a.ParentGroup_ID,4 = a.Codice,5 = a.Descrizione,6 = b.BusinessObject_ID as NetworkBusinessObject,7 = a.AssignedGroupCode
                //var ug = (from e in _context.Magic_Mmb_UserGroupVisibility where e.ID == id select e).FirstOrDefault();
                if (ug[2].ToString() == "")
                    MagicFramework.Helpers.SessionHandler.UserVisibilityGroupOwner = 0;
                else
                    MagicFramework.Helpers.SessionHandler.UserVisibilityGroupOwner = (int.Parse(ug[2].ToString()));
                if (ug[6].ToString() == "")
                    MagicFramework.Helpers.SessionHandler.UserVisibilityNetworkOwner = 0;
                else
                    MagicFramework.Helpers.SessionHandler.UserVisibilityNetworkOwner = (int.Parse(ug[6].ToString()));

                MagicFramework.Helpers.SessionHandler.UserVisibilityNetwork = (int.Parse(ug[1].ToString()));

                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.UgTree);

                if ((bool)data.isDefault.Value)
                {
                    Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
                    MagicFramework.Data.Magic_Mmb_Users_Extensions userExtension = _context.Magic_Mmb_Users_Extensions.Where(u => u.UserID.Equals(MagicFramework.Helpers.SessionHandler.IdUser)).FirstOrDefault();
                    if (userExtension == null)
                    {
                        _context.Magic_Mmb_Users_Extensions.InsertOnSubmit(new MagicFramework.Data.Magic_Mmb_Users_Extensions
                        {
                            UserID = MagicFramework.Helpers.SessionHandler.IdUser,
                            DefaultUserGroupVisibility_ID = id
                        });
                    }
                    else
                    {
                        userExtension.DefaultUserGroupVisibility_ID = id;
                    }
                    _context.SubmitChanges();
                }
            }
            catch (Exception ex) {
                    MFLog.LogInFile(ex);
                    throw new ArgumentException(genericError);
            }
        }       

    }
}
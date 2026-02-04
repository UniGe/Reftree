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
using System.Reflection;
using MagicFramework.Helpers;
using MagicFramework.MemberShip;

namespace MagicFramework.Controllers
{
    public class v_Magic_UserCrossProfilesController : ApiController
    {


        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());
        static string groupVisibilityField = ApplicationSettingsManager.GetVisibilityField();
        PropertyInfo propertyInfo = typeof(Models.v_Magic_UserCrossProfiles).GetProperty(groupVisibilityField);




        //The grid will call this method in read mode

        [HttpPost]
        public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
        {

            MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);
            string order = "viewID";
            String wherecondition = "1=1";


            if (propertyInfo != null)
            {
                if (request.filter != null)
                {
                    wherecondition = rp.BuildWhereCondition(typeof(Data.v_Magic_UserCrossProfiles));
                }
                wherecondition = MagicFramework.UserVisibility.UserVisibiltyInfo.getWhereCondition("v_Magic_UserCrossProfiles", wherecondition);
            }
            else
            {
                if (request.filter != null)
                {
                    wherecondition = rp.BuildWhereCondition(typeof(Models.v_Magic_UserCrossProfiles));
                }
            }

            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderCondition();

            var dbres = (from e in _context.v_Magic_UserCrossProfiles
                                              .Where(wherecondition)
                                              .OrderBy(order.ToString())
                                              .Skip(request.skip)
                                              .Take(request.take)
                         select new Models.v_Magic_UserCrossProfiles(e)).ToArray();

            return new MagicFramework.Models.Response(dbres, _context.v_Magic_UserCrossProfiles.Where(wherecondition).Count());
        }
        //entry point in order to extend profile infos in target apps
        private void extendProfiles(int userId)
        {
            var dbutils = new DatabaseCommandUtils();
            string sql = "if EXISTS(SELECT * FROM INFORMATION_SCHEMA.ROUTINES where ROUTINE_NAME='usp_ExtendProfile' and ROUTINE_SCHEMA='CUSTOM') EXEC CUSTOM.usp_ExtendProfile {0},{1},{2}";
            sql = String.Format(sql, SessionHandler.IdUser.ToString(), userId.ToString(), SessionHandler.UserVisibilityGroup.ToString());
            dbutils.buildAndExecDirectCommandNonQuery(sql, null);
        }

        //The grid will call this method in update mode
        [HttpPost]
        public HttpResponseMessage PostU(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();

            //throws if not admin or developer
            SystemRightsChecker.checkSystemRights();

            try
            {
                // select the item from the database where the id

                int profileid = data.ProfileID;
                int userid = data.UserID;
                int? moduleid = data.DefaultModule_ID;
                int? profileorder = data.ProfileOrder;
                bool ischecked = data["ischecked"];

                var entityupdate = (from e in _context.Magic_Mmb_UsersProfiles
                                    where e.Profile_ID == profileid && e.User_ID == userid
                                    select e).FirstOrDefault();

                if (entityupdate != null) // il record c'e' gia': o lo devo cancellare o aggiornare
                {
                    if (!ischecked)
                    {
                        _context.Magic_Mmb_UsersProfiles.DeleteOnSubmit(entityupdate);
                    }
                    else
                    {
                        entityupdate.ProfileOrder = profileorder;
                        entityupdate.DefaultModule_ID = (moduleid == 0 ? null : moduleid);
                    }
                    response.StatusCode = HttpStatusCode.OK;
                }
                else
                {
                    Data.Magic_Mmb_UsersProfiles up = new Data.Magic_Mmb_UsersProfiles();
                    up.User_ID = userid;
                    up.Profile_ID = profileid;
                    up.DefaultModule_ID = (moduleid == 0 ? null : moduleid);
                    up.ProfileOrder = profileorder;
                    var userassoc = (from e in _context.Magic_Mmb_UsersProfiles where e.User_ID == userid select e).ToList();
                    //Associo ad 1 solo profilo 
                    _context.Magic_Mmb_UsersProfiles.DeleteAllOnSubmit(userassoc);
                    _context.Magic_Mmb_UsersProfiles.InsertOnSubmit(up);
                    response.StatusCode = HttpStatusCode.OK;
                }
                extendProfiles(userid);
                _context.SubmitChanges();
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("The database update failed: {0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }



    }
}
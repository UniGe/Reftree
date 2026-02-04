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
using MagicFramework.Helpers;
using MagicFramework.MemberShip;

namespace MagicFramework.Controllers
{
    public class V_Magic_Mmb_UsersProfilesController : ApiController
    {


        // the linq to sql context that provides the data access layer
        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetTargetConnection());


        [HttpPost]
        public Models.Response Select(Models.Request request)
        {

            Helpers.RequestParser rp = new Helpers.RequestParser(request);

            string order = "ID";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Models.V_Magic_Mmb_UsersProfiles));

            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderCondition();

            var f = request.filter;
            int profileID = Convert.ToInt32(f.filters[0].value);

            var dbres = _context.Mmb_Profiles_Users_View(profileID).OrderBy(x => x.UserName).ToArray();

            return new Models.Response(dbres, _context.v_Magic_Mmb_UsersProfiles.Where(wherecondition).Count());

        }
        //The grid will call this method in update mode
        [HttpPost]
        public HttpResponseMessage PostU(int id, dynamic data)
        {
            // create a response message to send back
            var response = new HttpResponseMessage();
            SystemRightsChecker.checkSystemRights();
            try
            {
                string output = "";
                try
                {
                    data.UserID = data.UserId;
                    data.sessionUserId = SessionHandler.IdUser;
                    data.sessionUserVisibilityGroupId = SessionHandler.UserVisibilityGroup;
                }
                catch
                {
                }
                _context.Mmb_Profiles_Users_Save(data.ToString().Replace("'", "''"), ref output);
                MagicFramework.Helpers.CacheHandler.EmptyCacheForPrefix(MagicFramework.Helpers.CacheHandler.MenuUserID);
                response.StatusCode = HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.Content = new StringContent(string.Format("The database updated failed: V_Magic_Mmb_UsersProfiles {0}", ex.Message));
            }

            // return the HTTP Response.
            return response;
        }

    }
}
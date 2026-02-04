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
using MagicFramework;
using System.IO;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Reflection;
using System.Data.SqlClient;
using System.Data;
using MagicFramework.Helpers;
using Ref3.Helpers.Sql;
using MagicFramework.Models;
using MagicFramework.Controllers.ActionFilters;

namespace Ref3.Controllers
{
    [ExceptionFilter]
    public class AS_V_ASSET_assetgroupsController : ApiController
    {

        // the linq to sql context that provides the data access layer
        private Data.RefTreeEntities _context = DBConnectionManager.GetEFManagerConnection() != null ? new Data.RefTreeEntities(DBConnectionManager.GetEFManagerConnection()) : new Data.RefTreeEntities();
        private ReftreeAPIGetQueries queries = new ReftreeAPIGetQueries(DBConnectionManager.GetTargetConnection());

        [HttpPost]
        public Response GetAsAsset(dynamic data)
        {
            return queries.GetAsAsset(data.AS_ASSET_ID.Value);
        }

        [HttpPost]
        public Response GetAsAsset_assetExtended(dynamic data)
        {
            return queries.GetAsAsset_assetExtended(data.AS_ASSET_ID.Value);
        }
        
        [HttpPost]
        public Response GetAsAssetByDescription(dynamic data)
        {
            return queries.GetAsAssetByDescription(data.AS_ASSET_DESCRIZIONE.Value);
        }
        
        [HttpPost]
        public Response GetAsAssetsByLocationIDs(dynamic data)
        {
            return queries.GetAsAssetsByLocationIDs(data.locationIDs);
        }

        [HttpPost]
        public Response GetAsAssetImages(dynamic data) {
            return queries.GetAsAssetImages(data.AS_ASSET_ID.Value);
        }

        [HttpPost]
        public Response GetAsAssetImagesCdpSdk(dynamic data)
        {
            return queries.GetAsAssetImagesCdpSdk(data.AS_ASSET_ID.Value);
        }
        
        [HttpPost]
        public Response GetAsAssetLocation(dynamic data)
        {
            return queries.GetAsAssetLocation(data.AS_ASSET_LOCATION_ID.Value);
        }
        
        [HttpPost]
        public Response GetPlAssets(dynamic data)
        {
            return queries.GetPlAssets(data.PL_ASSET_ID.Value);
        }
        
        [HttpPost]
        public Response GetFcAssele_asset_elements(dynamic data)
        {
            return queries.GetFcAssele_asset_elements(data.FC_ASSELE_ID.Value);
        }
        
        [HttpPost]
        public Response GetFcSpeele_asset_elements(dynamic data)
        {
            return queries.GetFcSpeele_asset_elements(data.FC_SPEELE_FC_TIPELE_ID.Value);
        }

        //The grid will call this method in read mode
        [HttpPost]
        public MagicFramework.Models.Response Select(MagicFramework.Models.Request request)
        {
            MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);
            int assetid = int.Parse(rp.recurinfilters(typeof(Models.AS_V_ASSET_assetgroups), request.filter, "AS_ASSET_ID"));
            

            string order = "ID";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Models.AS_V_ASSET_assetgroups));
            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderConditionForEF();
            try
            {
                var dbres = (from e in _context.utf_AS_V_ASSET_assetgroups(assetid, SessionHandler.UserVisibilityGroup)
                                                   .Where(wherecondition)
                                                   .OrderBy(order.ToString())
                                                   .Skip(request.skip)
                                                   .Take(request.take)
                             select e).ToArray();
                return new MagicFramework.Models.Response(dbres, _context.utf_AS_V_ASSET_assetgroups(assetid, SessionHandler.UserVisibilityGroup).Where(wherecondition).Count());
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("problems reading relation between assets and groups: "+ex.Message, MFLog.logtypes.ERROR);
                return new MagicFramework.Models.Response(ex.Message);
            }
            
        }
        [HttpPost]
        public MagicFramework.Models.Response SelectGroups(MagicFramework.Models.Request request)
        {
            MagicFramework.Helpers.RequestParser rp = new MagicFramework.Helpers.RequestParser(request);
            int groupid = int.Parse(rp.recurinfilters(typeof(Models.AS_V_ASSET_assetgroups), request.filter, "US_GROUPS_ID"));


            string order = "US_GROUPS_ID";
            String wherecondition = "1=1";
            if (request.filter != null)
                wherecondition = rp.BuildWhereCondition(typeof(Data.utf_US_V_GROUPS_groupsassets_Result));
            if (request.sort != null && request.sort.Count > 0)
                order = rp.BuildOrderConditionForEF();
            try
            {
                var dbres = (from e in _context.utf_US_V_GROUPS_groupsassets(groupid)
                                                   .Where(wherecondition)
                                                   .OrderBy(order.ToString())
                                                   .Skip(request.skip)
                                                   .Take(request.take)
                             select e).ToArray();
                return new MagicFramework.Models.Response(dbres, _context.utf_US_V_GROUPS_groupsassets(groupid).Where(wherecondition).Count());
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("problems reading relation between groups and assets: " + ex.Message, MFLog.logtypes.ERROR);
                return new MagicFramework.Models.Response(ex.Message);
            }

        }


    }
}
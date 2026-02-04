using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Web.Http;
using MagicFramework.Helpers;

namespace MagicFramework.Controllers
{
      
    public class MAGIC_DEPLOYSController : ApiController
    {

        private Data.MagicDBDataContext _context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection()); 
         /// <summary>
        /// Copia le configurazioni in modo BULK COPY dal sistema source (che richiama il controller) ad un sistema di destinazione. Da chiamare solo per quantita' di dati molto piccole. Usare l' eseguibile 
        /// per DB di configurazione molto grandi.
        /// </summary>
        /// <param name="data"></param>
        /// <returns></returns>
        [HttpPost]
        public HttpResponseMessage ExportConfigurationsToDestination(dynamic data)
        {
            var res = new HttpResponseMessage();
            try
            {

              

                int deployID = data.ID;
                bool isSystem = ApplicationSettingsManager.GetWorkOnSystemSettings();
                var deploydata = (from e in _context.Magic_Deploys where e.ID == deployID select e).First();
                var appConfig = new MFConfiguration(Request.RequestUri.Authority);
                var config = appConfig.GetApplicationInstanceByID(Request.RequestUri.Authority, SessionHandler.ApplicationInstanceId);

                string sourceconnection = DBConnectionManager.GetMagicConnection();
                string destinationconnection = deploydata.Magic_Deploy_Destinations.DestinationDBConnection;
                deploydata.DestinationDBConnection = destinationconnection;
                deploydata.SourceDBConnection = sourceconnection;
                deploydata.CopyStart = DateTime.Now.ToLocalTime();
                deploydata.CopyEnd = null;
                _context.SubmitChanges();

                MagicDeployDBManager.DatabaseDeploy DBDeployer = new MagicDeployDBManager.DatabaseDeploy(
                    sourceconnection,
                    destinationconnection,
                    deployID,
                    isSystem,
                    Assembly.GetExecutingAssembly().GetName().Version.ToString(),
                    appConfig.appSettings.MongoDBconn,
                    deploydata.Magic_Deploy_Destinations.DestinationMongoDBConnectionString,
                    config.appInstancename,
                    deploydata.Magic_Deploy_Destinations.DestinationApplicationName,
                    deploydata.Magic_Deploy_Destinations.DestinationMongoDBName,
                    config.mongoDBName
                );
                DBDeployer.CopyTableToDestination();

                res = Helpers.Utils.retOkJSONMessage("Export succeded");
                return res;
            }
            catch (Exception ex)
            {
                return Helpers.Utils.retInternalServerError(ex.Message);
            }
        }
        [HttpPost]
        public HttpResponseMessage ImportConfigurations(dynamic data)
        {
            MagicDeployDBManager.DatabaseDeploy.ImportOptions importOptions = new MagicDeployDBManager.DatabaseDeploy.ImportOptions();
            importOptions.ImportSQL = (bool)data.ImportSQL;
            importOptions.ImportHelp = (bool)data.ImportHelp;
            importOptions.ImportOverwrites = (bool)data.ImportOverrides;
            importOptions.ImportID = data.ImportID;
            importOptions.DeleteMismatch = (bool)data.deleteMismatch;
            importOptions.ImportMenu = data.importMenu.ToString();
            importOptions.ImportWithIdentityInsert = (bool)data.importWithIdentityInsert;

            var res = new HttpResponseMessage();
            try
            {
             

                var appConfig = new MFConfiguration(Request.RequestUri.Authority);
                var config = appConfig.GetApplicationInstanceByID(Request.RequestUri.Authority, SessionHandler.ApplicationInstanceId);
                string importStoredProcedureAppend = ApplicationSettingsManager.GetdeployImportAppendSP();
                string importStoredProcedureWithIdentityInsert = ApplicationSettingsManager.GetdeployImportPreserveIdsSP();
                //D.T: changed connection string to target because in this way i can import in mixed case (MagicDB separated from Target with configuration exported in Target)
                MagicDeployDBManager.DatabaseDeploy.Import(DBConnectionManager.GetTargetConnection(), appConfig.appSettings.MongoDBconn, config.appInstancename, config.mongoDBName, importOptions, importStoredProcedureAppend, importStoredProcedureWithIdentityInsert);
                //empty cache
                if (importOptions.ImportSQL)
                {
                    CacheHandler.EmptyCacheForPrefix(CacheHandler.Grids);
                    CacheHandler.EmptyCacheForPrefix(CacheHandler.Functions);
                }
                else if(importOptions.ImportOverwrites)
                    CacheHandler.EmptyCacheForPrefix(CacheHandler.Grids);

                res = Utils.retOkJSONMessage("Import ended");
            }
            catch (Exception e)
            {
                res = Utils.retInternalServerError(e.Message);
            }
            return res;
        }
    }
}
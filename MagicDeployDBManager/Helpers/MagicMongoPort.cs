using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MagicDeployDBManager.Helpers
{
    class MagicMongoPort
    {
        private const string TEMP_HELP_COLLECTION_NAME = "TEMP_help_to_import";
        private const string HELP_COLLECTION_NAME = "help";
        private const string TEMP_GRID_OVERWRITE_COLLECTION_NAME = "TEMP_grid_overwrites_to_import";
        private const string GRID_OVERWRITE_COLLECTION_NAME = "grid_overwrites";
        private const string DEFAULT_DB = "Magic";

        private string startConnectionString;
//        private string destinationConnectionString;
        private string startApplicationName;
        private string destinationApplicationName;

        private MongoDatabase _startDatabase;
        private MongoDatabase _destinationDatabase;

        public MagicMongoPort(string startConnectionString, string destinationConnectionString, string startApplicationName, string destinationApplicationName = null, string destinationDbName = null, string startDbName = null)
        {
            var startClient = new MongoClient(startConnectionString);
            var destinationClient = new MongoClient(destinationConnectionString);
            this.startApplicationName = startApplicationName;
            this.startConnectionString = startConnectionString;
            if (destinationApplicationName == null)
                destinationApplicationName = startApplicationName;
            else
                this.destinationApplicationName = destinationApplicationName;
            _startDatabase = startClient.GetServer().GetDatabase(startDbName ?? DEFAULT_DB);
            _destinationDatabase = destinationClient.GetServer().GetDatabase(destinationDbName ?? DEFAULT_DB);
        }

        public MagicMongoPort(bool importOnly, string destinationConnectionString, string destinationApplicationName, string destinationDbName = null)
        {
            this.destinationApplicationName = destinationApplicationName;
            var destinationClient = new MongoClient(destinationConnectionString);
            _destinationDatabase = destinationClient.GetServer().GetDatabase(destinationDbName ?? DEFAULT_DB);
        }

        public void ExportHelp()
        {
            if (startConnectionString == null || startApplicationName == null)
                throw new Exception("Start connection string or start application name not defined");
            var helpCollection = _startDatabase.GetCollection<BsonDocument>(HELP_COLLECTION_NAME);
            var tempHelpCollection = _destinationDatabase.GetCollection<BsonDocument>(TEMP_HELP_COLLECTION_NAME);

            //clear temporary collection 
            tempHelpCollection.RemoveAll();//Remove(new QueryDocument(new BsonDocument { { "application_name", destinationApplicationName } }));
            
            //prepare data to import and save it down to target collection
            var helpToPort = helpCollection.Find(new QueryDocument(new BsonDocument { { "application_name", startApplicationName } })).ToList();
            if (helpToPort.Any())
            {
                if (this.startApplicationName != this.destinationApplicationName)
                {
                    foreach (BsonDocument doc in helpToPort)
                    {
                        doc["application_name"] = destinationApplicationName;
                    }
                }
                tempHelpCollection.InsertBatch(helpToPort);
            }
        }

        public void ExportGridOverwrites()
        {
            if (startConnectionString == null || startApplicationName == null)
                throw new Exception("Start connection string or start application name not defined");
            var startGridOverwriteCollection = _startDatabase.GetCollection<BsonDocument>(GRID_OVERWRITE_COLLECTION_NAME);
            var tempDestinationGridOverwrite = _destinationDatabase.GetCollection<BsonDocument>(TEMP_GRID_OVERWRITE_COLLECTION_NAME);

            //clear temporary collection for application_name
            tempDestinationGridOverwrite.Remove(new QueryDocument(
            new BsonDocument {
                { "$or", new BsonArray {
                        new BsonDocument { { "for_application_names", destinationApplicationName } },
                        new BsonDocument { { "used_for_all_applications", true } }
                    }
                }
            }));

            //prepare data to import and save it down to target collection
            var gridOverwritesToExport = startGridOverwriteCollection
                                                        .Find(new QueryDocument(
                                                                new BsonDocument {
                                                                    { "$or", new BsonArray {
                                                                            new BsonDocument { { "for_application_names", destinationApplicationName } },
                                                                            new BsonDocument { { "used_for_all_applications", true } }
                                                                        }
                                                                    }
                                                                }
                                                        ))
                                                        .ToList();
            if (gridOverwritesToExport.Any())
            {
                if (this.startApplicationName != this.destinationApplicationName)
                {
                    foreach (BsonDocument doc in gridOverwritesToExport)
                    {
                        doc.Remove("_id");
                        if ((bool)doc["used_for_all_applications"] == true)
                        {
                            doc["for_application_names"] = new BsonArray { destinationApplicationName };
                            doc["used_for_all_applications"] = false;
                        }
                    }
                }
                tempDestinationGridOverwrite.InsertBatch(gridOverwritesToExport);
            }
        }

        public void ImportHelp(DataRowCollection functionIdMapping, bool deleteMismatch = false)
        {
            var tempHelpCollection = _destinationDatabase.GetCollection<BsonDocument>(TEMP_HELP_COLLECTION_NAME);

            //get function-help and update ids to new environment
            var tempHelpDocs = tempHelpCollection.Find(new QueryDocument(new BsonDocument {
                { "usedFor.type", "function" },
                { "application_name", this.destinationApplicationName }
            })).ToList();
            List<BsonDocument> matchingHelpDocs = new List<BsonDocument>();
            BsonArray fids = new BsonArray();
            if (tempHelpDocs.Any())
            {
                //function based ids: if the id of the function is the same between source and destination, i just have to update
                foreach (DataRow row in functionIdMapping)
                {
                    fids.Add(int.Parse(row["id"].ToString()));
                    var helpToModify = tempHelpDocs.Where(p => p["usedFor"]["_id"].Equals(row["sourceId"].ToString())).FirstOrDefault();
                    if (helpToModify != null)
                    {
                        if (row["sourceId"].ToString() != row["id"].ToString())
                        {
                            if (helpToModify != null)
                                helpToModify["usedFor"]["_id"] = row["id"].ToString();
                        }
                        matchingHelpDocs.Add(helpToModify);
                    }
                }
            }


            var helpCollection = _destinationDatabase.GetCollection<BsonDocument>(HELP_COLLECTION_NAME);
            //add remaining help-objects for destinationApplication
            tempHelpDocs = tempHelpCollection.Find(new QueryDocument(new BsonDocument {
                { "usedFor.type", new BsonDocument { { "$ne", "function" } } },
                { "application_name", this.destinationApplicationName }
            })).ToList();
            //if the user has selected "deleteMismatch" i'm going to delete the whole set of data for the given applicationname 
            if ((matchingHelpDocs.Any() || tempHelpDocs.Any()) && deleteMismatch)
                helpCollection.Remove(new QueryDocument(new BsonDocument { { "application_name", this.destinationApplicationName } }));
            else //else if there's some data i ' m going to delete only the entries for the deployed function for the destination application name 
                if (matchingHelpDocs.Any() || tempHelpDocs.Any())
                    helpCollection.Remove(new QueryDocument(new BsonDocument { { "usedFor._in", new BsonDocument { { "$in", fids } } }, { "application_name", this.destinationApplicationName }, { "usedFor.type", "function" } }));
            //da verificare.....
            foreach (var m in matchingHelpDocs)
            {
                m.Remove("_id");
            }                                  
            if (matchingHelpDocs.Any())
            {
                helpCollection.InsertBatch(matchingHelpDocs);
            }
            if (tempHelpDocs.Any())
            {
                helpCollection.InsertBatch(tempHelpDocs);
            }

            //delete all imported help-obejects
            tempHelpCollection.Remove(new QueryDocument(new BsonDocument{ { "application_name", this.destinationApplicationName } }));
            //_destinationDatabase.DropCollectionAsync(TEMP_HELP_COLLECTION_NAME);
        }

        public void ImportGridOverwrites()
        {
            var tempGridOverwriteCollection = _destinationDatabase.GetCollection<BsonDocument>(TEMP_GRID_OVERWRITE_COLLECTION_NAME);

            var gridOverwritesToExport = tempGridOverwriteCollection
                                                        .Find(new QueryDocument(
                                                                new BsonDocument { { "for_application_names", destinationApplicationName } }
                                                        ))
                                                        .ToList();
            
            if (gridOverwritesToExport.Any())
            {
                var gridOverwriteCollection = _destinationDatabase.GetCollection<BsonDocument>(GRID_OVERWRITE_COLLECTION_NAME);
                gridOverwriteCollection.Remove(new QueryDocument(new BsonDocument { { "for_application_names", this.destinationApplicationName } }));
                gridOverwriteCollection.InsertBatch(gridOverwritesToExport);
                tempGridOverwriteCollection.Remove(new QueryDocument(new BsonDocument { { "for_application_names", this.destinationApplicationName } }));
            }
        }
    }
}


//using MongoDB.Bson;
//using MongoDB.Driver;
//using System;
//using System.Collections.Generic;
//using System.Data;
//using System.Linq;
//using System.Text;
//using System.Threading.Tasks;

//namespace MagicDeployDBManager.Helpers
//{
//    class MagicMongoPort
//    {
//        private const string TEMP_HELP_COLLECTION_NAME = "TEMP_help_to_integrate";
//        private const string HELP_COLLECTION_NAME = "help";
//        private const string DEFAULT_DB = "Magic";

//        private string startConnectionString;
//        private string destinationConnectionString;
//        private string startApplicationName;
//        private string destinationApplicationName;

//        private IMongoDatabase _startDatabase;
//        private IMongoDatabase _destinationDatabase;

//        public MagicMongoPort(string startConnectionString, string destinationConnectionString, string startApplicationName, string destinationApplicationName = null, string destinationDbName = null, string startDbName = null)
//        {
//            var startClient = new MongoClient(startConnectionString);
//            var destinationClient = new MongoClient(destinationConnectionString);
//            this.startApplicationName = startApplicationName;
//            if (destinationApplicationName == null)
//                destinationApplicationName = startApplicationName;
//            else
//                this.destinationApplicationName = destinationApplicationName;
//            _startDatabase = startClient.GetDatabase(startDbName ?? DEFAULT_DB);
//            _destinationDatabase = destinationClient.GetDatabase(destinationDbName ?? DEFAULT_DB);
//        }

//        public MagicMongoPort(bool importOnly, string destinationConnectionString, string destinationApplicationName, string destinationDbName = null)
//        {
//            this.destinationApplicationName = destinationApplicationName;
//            var destinationClient = new MongoClient(destinationConnectionString);
//            _destinationDatabase = destinationClient.GetDatabase(destinationDbName ?? DEFAULT_DB);
//        }

//        public async void ExportHelp()
//        {
//            if (startConnectionString == null || startApplicationName == null)
//                throw new Exception("Start connection string or start application name not defined");
//            var helpCollection = _startDatabase.GetCollection<BsonDocument>(HELP_COLLECTION_NAME);
//            var tempHelpCollection = _destinationDatabase.GetCollection<BsonDocument>(TEMP_HELP_COLLECTION_NAME);

//            //clear temporary collection for application_name
//            await tempHelpCollection.DeleteManyAsync(new BsonDocument { { "application_name", destinationApplicationName } });

//            //prepare data to import and save it down to target collection
//            var helpToPort = await helpCollection.Find(new BsonDocument { { "application_name", startApplicationName } }).ToListAsync();
//            if (helpToPort.Any())
//            {
//                if (this.startApplicationName != this.destinationApplicationName)
//                {
//                    foreach (BsonDocument doc in helpToPort)
//                    {
//                        doc["application_name"] = destinationApplicationName;
//                    }
//                }
//                tempHelpCollection.InsertManyAsync(helpToPort);
//            }
//        }

//        public async void ImportHelp(DataRowCollection functionIdMapping)
//        {
//            var tempHelpCollection = _destinationDatabase.GetCollection<BsonDocument>(TEMP_HELP_COLLECTION_NAME);

//            //get function-help and update ids to new environment
//            var tempHelpDocs = await tempHelpCollection.Find<BsonDocument>(new BsonDocument {
//                { "usedFor.type", "function" },
//                { "application_name", this.destinationApplicationName }
//            }).ToListAsync();
//            List<BsonDocument> matchingHelpDocs = new List<BsonDocument>();
//            foreach (DataRow row in functionIdMapping)
//            {
//                var helpToModify = tempHelpDocs.Where(p => p["usedFor"]["_id"].Equals(row["sourceId"].ToString())).FirstOrDefault();
//                if (row["sourceId"].ToString() != row["id"].ToString())
//                {
//                    if (helpToModify != null)
//                        helpToModify["usedFor"]["_id"] = row["id"].ToString();
//                }
//                matchingHelpDocs.Add(helpToModify);
//            }
//            var helpCollection = _destinationDatabase.GetCollection<BsonDocument>(HELP_COLLECTION_NAME);
//            if (matchingHelpDocs.Any())
//            {
//                helpCollection.InsertManyAsync(matchingHelpDocs);
//            }

//            //add remaining help-objects for destinationApplication
//            tempHelpDocs = await tempHelpCollection.Find<BsonDocument>(new BsonDocument {
//                { "usedFor.type", new BsonDocument { { "$ne", "function" } } },
//                { "application_name", this.destinationApplicationName }
//            }).ToListAsync();
//            if (tempHelpDocs.Any())
//            {
//                helpCollection.InsertManyAsync(tempHelpDocs);
//            }

//            //delete all imported help-obejects
//            tempHelpCollection.DeleteManyAsync(new BsonDocument { { "application_name", this.destinationApplicationName } });
//            //_destinationDatabase.DropCollectionAsync(TEMP_HELP_COLLECTION_NAME);
//        }
//    }
//}
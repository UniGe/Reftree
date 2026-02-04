using System;
using System.Web;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Configuration;
using System.Collections;
using System.Globalization;
using System.Data;
using System.IO;
using System.Xml;
using System.Xml.Xsl;
using System.Data.SqlClient;
using MagicEventsManager.BI.Logic;
using MagicEventsManager.Resources;
using System.Data.Entity.Core.EntityClient;
using MagicEventsManager.DB;

namespace MagicEventsManager
{
    public class AlertEventArgs : EventArgs
    {
        public AlertEventArgs(string connectionString)
            : base()
        {
            this.connString = connectionString;
        }

        public AlertEventArgs(PlannedEvent evento, bool esito, string connectionString)
            : base()
        {
            this.evento = evento;
            this.esito = esito;
            this.executionException = null;
            this.connString = connectionString;
        }

        public AlertEventArgs(PlannedEvent evento,
            bool esito, Exception e, string connectionString,string directoryLog)
            : base()
        {
            this.evento = evento;
            this.esito = esito;
            this.executionException = e;
            this.connString = connectionString;
            this.directoryLog = directoryLog;
        }

        protected string connString;
        public string directoryLog;
        public string ConnectionString
        {
            set { connString = value; }
            get { return connString; }
        }

        

        protected PlannedEvent evento;
        public PlannedEvent Evento
        {
            set { evento = value; }
            get { return evento; }
        }

        protected bool esito;
        public bool Esito
        {
            set { esito = value; }
            get { return esito; }
        }

        protected Exception executionException;
        public Exception ExecutionException
        {
            set { executionException = value; }
            get { return executionException; }
        }
    }

    #region Definizione Enum
    //NB. Gli enum devono essere sincronizzati con le rispettive tabelle

    /// <summary>
    /// Tipi di azioni possibili per gli eventi
    /// </summary>
    public enum TipiAzione
    {
        InvioMail = 1,
        Esecuzione = 2
    }

    /// <summary>
    /// Tipi di contenuti per il campo [Contenuto] dell'evento
    /// </summary>
    public enum TipiContenuto
    {
        Testo = 1,
        Query = 2,
        StoredProcedure = 3,
        QueryScalare = 4,
        StoredProcedureScalare = 5,
        Metodo = 6,
        StoredProcedureAsyncNonQuery = 7, //elaborazione batch asincrona che non ritorna alcun recordset
        ftpRequest = 13,
        fileImport = 14

    }

    #endregion
    public class ConnParam
    {
        public string targetDBConnectionString { get; set; }
        public string magicDBConnectionString { get; set; }
        public int timeout { get; set; }
    }

    public class Scheduler
    {
        //private const int SLEEP_TIME = 1000;
        //private static object syncRoot = new object();
        public DB.MagicDBEntities _context { get; set; }
        //protected ParameterizedThreadStart ts;
        //protected Thread t;
        //protected ParameterizedThreadStart tsPolling;
        //protected Thread tPolling;

        //Determina se attivare la vecchia gestione della dependency
        //protected bool attivaOldDependency = ConfigurationManager.AppSettings["AttivaOldDependency"] == "Y";
        PlannedEvents eventiPianificati;
        
        //protected bool isTableChanged = false;
        //protected Logger log;
        //protected Dependency dependency;
        private string _targetDBConnectionString;
        private string _magicDBConnectionString;
        private int _timeout;
        private string _directorylog;
        /// <summary>
        /// Gestore dell'evento di fine esecuzione di un task schedulato
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        public delegate void EventExecutedEventHandler(object sender, AlertEventArgs e);
        /// <summary>
        /// Evento che viene lanciato al completamento di ogni esecuzione di un task schedulato
        /// </summary>
        public event EventExecutedEventHandler EventExecuted;
        
        /// <summary>
        /// Creates a EF like conn string form a normal one
        /// "metadata=res://*/DB.MagicEvents.csdl|res://*/DB.MagicEvents.ssdl|res://*/DB.MagicEvents.msl;provider=System.Data.SqlClient;provider connection string=&quot;data source=151.1.180.29;initial catalog=refTree_dev;persist security info=True;user id=ref;password=ref;MultipleActiveResultSets=True;App=EntityFramework&quot;" providerName="System.Data.EntityClient"
        /// </summary>
        /// <param name="metaData"></param>
        /// <param name="dataSource"></param>
        /// <param name="initialCatalog"></param>
        /// <returns></returns>
        public static string CreateEFSqlServerConnectionString(string sqlConnection)
        {
            const string metadata = "res://*/DB.MagicEvents.csdl|res://*/DB.MagicEvents.ssdl|res://*/DB.MagicEvents.msl";
            const string appName = "EntityFramework";
            const string providerName = "System.Data.SqlClient";//solo per SQL server!
            SqlConnectionStringBuilder sc = new SqlConnectionStringBuilder(sqlConnection);
            sc.ApplicationName = appName;
            EntityConnectionStringBuilder efBuilder = new EntityConnectionStringBuilder();
            efBuilder.Metadata = metadata;
            efBuilder.Provider = providerName;
            efBuilder.ProviderConnectionString = sqlConnection;

            return efBuilder.ConnectionString;
        }
        public Scheduler(string targetDBConnectionString, string magicDBConnectionString, string applicationname, int timeout,string directorylog = null)
        {

            this._context = new DB.MagicDBEntities(CreateEFSqlServerConnectionString(targetDBConnectionString));
            _targetDBConnectionString = targetDBConnectionString;
            _magicDBConnectionString = magicDBConnectionString;
            if (timeout < 30)
            {
                if (timeout == 0)
                    timeout = 0;
                else
                    timeout = 30;
            }
            _timeout = timeout;
            _directorylog = directorylog;
           //this.startScheduler(new ConnParam(connectionString,timeout));
           eventiPianificati = new PlannedEvents();
           //this.startPolling(connectionString);

            //log = new Logger();
        }

        //void dependency_OnNewModify()
        //{
        //    isTableChanged = true;
        //}


        /// <summary>
        /// Avvia il servizio di scheduling degli Eventi
        /// </summary>
        public void Run()
        {
            try
            {
                loadEventiPianificati();
            }
            catch (Exception ex) {
                throw new System.ArgumentException("Problems during planned events load: "+ex.Message);
            }
            this.startScheduler(new ConnParam
            {
                magicDBConnectionString = _magicDBConnectionString,
                targetDBConnectionString = _targetDBConnectionString,
                timeout = _timeout
            });    
        }

        /// <summary>
        /// Aggiorna la lista degli elementi schedulati anche se lo scheduler e' in esecuzione
        /// </summary>
        //public void RefreshEventiSchedulati(string connectionString)
        //{
        //    loadEventiPianificati(connectionString);
        //    isTableChanged = false;
        //}

        protected void loadEventiPianificati()
        {
           
                DateTime tsCorrente = DateTime.Now;
                eventiPianificati = PlannedEvents.GetEventiPianificati(_context);

        }

        /// <summary>
        /// Interrompe l'esecuzione del servizio di scheduling
        /// </summary>
        //public void Stop()
        //{
        //    if (attivaOldDependency)
        //        tPolling.Abort();
        //    else
        //        dependency.Stop();

        //}

        //private void startPolling(object connectionString)
        //{
        //    OldDependency oldDependency = new OldDependency();
        //    oldDependency.OnNewModify += new OldDependency.NewModify(dependency_OnNewModify);
        //    oldDependency.Start(connectionString.ToString());
        //}


        private void startScheduler(ConnParam connParam)
        {
            AlertEventArgs e = null;
            foreach (PlannedEvent drEvento in eventiPianificati)
                    {
                         DateTime tsCorrente = DateTime.Now;
                        //Se l'evento non e' attivo lo salta
                        //Se l'evento dipende da un altro evento lo salta
                        if (!drEvento.Active)// ||
                            //drEvento.IdEventoPianificatoPadre > 0)
                            continue;
                        //Verifica se e' ora di eseguire l'evento
                        if (drEvento.TsNextExecution.CompareTo(tsCorrente) <= 0)
                        {
                            //non appena l' evento entra in run sposto la sua data di esecuzione in modo che non venga considerato fino al prox. run

                            //Esegui l'evento...
                            //Exception se = runEvent(drEvento, connectionString.ToString());
                            Exception se = runEvent(drEvento, connParam);
                            //Setta il ts dell'esecuzione appena completata
                            drEvento.TsExecutionEnd = tsCorrente;

                            //Notifica al Cron job o altro caller
                            if (EventExecuted != null)
                            {
                                if (se == null)
                                {
                                    e = new AlertEventArgs(drEvento, true, connParam.targetDBConnectionString);
                                    EventExecuted(this, e);
                                }
                                else
                                {
                                    e = new AlertEventArgs(drEvento, false, se, connParam.targetDBConnectionString,this._directorylog);
                                    EventExecuted(this, e);
                                }
                            }

                            //Aggiorna il timestamp della prossima esecuzione
                            //drEvento.tsProssimaEsecuzione = tsCorrente.AddSeconds(drEvento.Durata);
                            drEvento.TsNextExecution = calcolaProssimaEsecuzione(drEvento, tsCorrente);

                            //Aggiorno il tsProssimaEsecuzione sul DB
                            PlannedEvent.UpdateNextExecution(
                                drEvento.TsNextExecution,
                                drEvento.IDPlannedEvent,
                                _context);

                            //if drEvento.TsNextExecution == tsCorrente no interval is set, so deactivate it (run only once)
                            if (drEvento.TsNextExecution > drEvento.TsLastExecution || drEvento.TsNextExecution == tsCorrente)
                            {
                                drEvento.Active = false;
                                //Imposto a false il campo "Attivo" dell'evento
                                //poichè la sua prossima esecuzione andrebbe oltre
                                //la data di validità dell'evento
                                PlannedEvent.UpdateActiveEvent(false, drEvento.IDPlannedEvent,_context);
                            }

                            
                        }
                    }
        }

        private DateTime calcolaProssimaEsecuzione(PlannedEvent drEvent, DateTime tsCurrent)
        {
            //Se la colonna Mesi non è nulla significa che è stata selezionata una periodicità mensile
            if (!string.IsNullOrEmpty(drEvent.Months))
            {
                char[] months = drEvent.Months.ToCharArray();
                int pos = CurrentMonthToInt(DateTime.Now.Month) + 1;
                if (pos > months.Length - 1)
                    pos = 0;
                int posToAdd = 1;
                //Parto dal mese successivo al mese in corso
                while (months[pos].ToString() == "0")
                {
                    pos++;
                    posToAdd++;
                    if (pos > months.Length - 1)
                        pos = 0;
                }

                DateTime dtToRet = tsCurrent.AddMonths(posToAdd);

                //se è stata specificata la lettera "F" nel campo mesi
                //significa che si vuole lanciare l'evento nell'ultimo 
                //giorno del mese
                if (months[pos].ToString().ToUpper() == "F")
                {
                    //dtToRet = new DateTime(dtToRet.Year, dtToRet.Month + 1, dtToRet.Day);
                    dtToRet = dtToRet.AddMonths(1);
                    dtToRet = new DateTime(dtToRet.Year, dtToRet.Month, 1);
                    ///dtToRet = dtToRet.;
                    dtToRet = dtToRet.AddDays(-1);
                }


                return new DateTime(dtToRet.Year, dtToRet.Month, dtToRet.Day
                    , drEvent.TsNextExecution.Hour
                    , drEvent.TsNextExecution.Minute
                    , drEvent.TsNextExecution.Second);
            }
            //Se la colonna Giorni non è nulla significa che è stata selezionata una periodicità settimanale
            //Il parametro drEvent.Days per inviare tutti i giorni dal lunedì a venerdì è, per esempio: 
            //  LMMGVSD      
            //  1111100
            else if (!string.IsNullOrEmpty(drEvent.Days))
            {
                char[] giorni = drEvent.Days.ToCharArray();
                int pos = currentDayToInt(DateTime.Now.DayOfWeek) + 1;
                if (pos > giorni.Length - 1)
                    pos = 0;
                int posToAdd = 1;
                while (giorni[pos].ToString() != "1")
                {
                    pos++;
                    posToAdd++;
                    if (pos > giorni.Length - 1)
                        pos = 0;
                }

                //return tsCorrente.AddDays(posToAdd);
                DateTime dtToRet = tsCurrent.AddDays(posToAdd);

                return new DateTime(dtToRet.Year, dtToRet.Month, dtToRet.Day
                    , drEvent.TsNextExecution.Hour
                    , drEvent.TsNextExecution.Minute
                    , drEvent.TsNextExecution.Second);
            }
            //Altrimenti è stata selezionata una periodicità giornaliera
            else if (drEvent.Duration > 0)
            {
                DateTime tsProssiamEsec = drEvent.TsNextExecution.AddSeconds(drEvent.Duration);

                while (tsProssiamEsec < tsCurrent)
                    tsProssiamEsec = tsProssiamEsec.AddSeconds(drEvent.Duration);

                return tsProssiamEsec;
            }

            return tsCurrent;
        }

        private int CurrentMonthToInt(int currentMonth)
        {
            return currentMonth - 1;
        }

        private int currentDayToInt(DayOfWeek dayOfWeek)
        {
            int intToRet = 0;
            switch (dayOfWeek)
            {
                case DayOfWeek.Monday:
                    intToRet = 0;
                    break;
                case DayOfWeek.Tuesday:
                    intToRet = 1;
                    break;
                case DayOfWeek.Wednesday:
                    intToRet = 2;
                    break;
                case DayOfWeek.Thursday:
                    intToRet = 3;
                    break;
                case DayOfWeek.Friday:
                    intToRet = 4;
                    break;
                case DayOfWeek.Saturday:
                    intToRet = 5;
                    break;
                case DayOfWeek.Sunday:
                    intToRet = 6;
                    break;
            }

            return intToRet;
        }

        // private Exception runEvent(EventoPianificato drEvento, string connectionString)
        private Exception runEvent(PlannedEvent drEvent, ConnParam connParam)
        {
            Exception returnException = null;

            //Recupera l'evento associato all'task in esecuzione
            Event evento = Events.GetEvent(drEvent.EventID,this._context);
            Tracking track = new Tracking(connParam.targetDBConnectionString);
            
            //don't run it again if there are pending runs...
            if (track.AreThereRunningEvents(drEvent.IDPlannedEvent))
                return returnException;

            //Valori di ritorno
            System.Data.DataSet ds = null;
            double res = 0;
            string testo = string.Empty;
            bool existsResult = false;
            int trackId = track.insertNewTrack(drEvent.IDPlannedEvent);
            do
            {
                try
                {
                    
                    MagicEventMail mail = null;
                    //A seconda del tipo di contenuto interpreta il record dell'evento
                    //ed esegue le relative operazioni
                    switch (evento.EventScriptTypeID)
                    {
                        case (int)TipiContenuto.Testo:
                            testo = evento.ScriptName;
                            existsResult = true;
                            break;

                        case (int)TipiContenuto.Query:
                            ds = Broker.Instance.ExecuteQuery(evento.ScriptName, connParam.targetDBConnectionString);
                            existsResult = existsResut(ds);

                            //testo = ds.GetXml();
                            BuildMessage(ds, evento.SystemMessageID ?? 0,out mail);
                            break;

                        case (int)TipiContenuto.StoredProcedure:
                            ds = Broker.Instance.ExecuteStoredProcedure(evento.ScriptName, connParam.targetDBConnectionString, connParam.timeout);
                            existsResult = existsResut(ds);
                            //testo = ds.GetXml();
                            BuildMessage(ds,evento.SystemMessageID ?? 0, out mail);
                            break;

                        case (int)TipiContenuto.QueryScalare:
                            res = Broker.Instance.ExecuteQueryScalar(evento.ScriptName, connParam.targetDBConnectionString);
                            existsResult = true;

                            testo = res.ToString();
                            break;

                        case (int)TipiContenuto.StoredProcedureScalare:
                            res = Broker.Instance.ExecuteStoredProcedureScalar(evento.ScriptName, connParam.targetDBConnectionString);
                            existsResult = true;

                            testo = res.ToString();
                            break;

                        case (int)TipiContenuto.Metodo:
                            object o = Broker.Instance.ExecuteMethod(evento.ScriptName, evento.EventID, connParam.targetDBConnectionString, connParam.magicDBConnectionString);
                            existsResult = true;
                            if (o is int || o is string)
                                testo = o.ToString();
                            else if (o is System.Data.DataSet)
                                 BuildMessage(((System.Data.DataSet)o),evento.SystemMessageID ?? 0, out mail);
                            else if (o is Exception)
                                returnException = (Exception)o;
                            break;
                        case (int)TipiContenuto.StoredProcedureAsyncNonQuery:
                            Broker.Instance.ExecuteStoredProcedureNonQueryAsync(evento.ScriptName, null, connParam.targetDBConnectionString, trackId);
                            existsResult = false;
                            break;
                        case (int)TipiContenuto.ftpRequest:
                            o = Broker.Instance.ExecuteFtpRequest(evento.ScriptName, _context);
                            if (o is System.Data.DataSet)
                                BuildMessage(((System.Data.DataSet)o), evento.SystemMessageID ?? 0, out mail);
                            else if (o is Exception)
                                returnException = (Exception)o;
                            //existsResult = false;
                            break;
                        case (int)TipiContenuto.fileImport:
                            o = Broker.Instance.ExecuteFileImportToDatabase(evento.ScriptName, connParam.targetDBConnectionString,trackId);
                            if (o is System.Data.DataSet)
                                BuildMessage(((System.Data.DataSet)o), evento.SystemMessageID ?? 0, out mail);
                            else if (o is Exception)
                                returnException = (Exception)o;
                            //existsResult = false;
                            break;
                        
                    }
               
                        

                    switch (evento.EventActionID)
                    {
                        case (int)TipiAzione.InvioMail:

                            if (mail != null && existsResult)
                            {
                                    mail.PushIntoMailQueue();
                                   
                            }
                            break;
                        case (int)TipiAzione.Esecuzione:
                            break;
                    }
                    //for synchronous events we can track the end now
                    if (evento.EventScriptTypeID != (int)TipiContenuto.StoredProcedureAsyncNonQuery)
                        track.updateEndTrack(trackId);
                }
                catch (Exception se)
                {
                    returnException = se;
                    track.updateEndTrack(trackId,se.Message);
                }

                //get childevent if ChildEventID is set
                evento = evento.ChildEventID != null ? Events.GetEvent((int)evento.ChildEventID, this._context) : null;

            } while (evento != null);

            return returnException;
        }

        private bool existsResut(DataSet ds)
        {
            bool exists = false;
            if ((ds != null) && (ds.Tables.Count > 0))
            {
                foreach (DataTable dt in ds.Tables)
                {
                    if (dt.Rows.Count > 0)
                    {
                        exists = true;
                        break;
                    }
                }
            }

            return exists;
        }

        /// <summary>
        /// Serve a mandare le mail in html già preparate da sql
        /// </summary>
        /// <param name="ds"></param>
        /// <param name="mail"></param>
        /// <returns></returns>
        private void BuildMessage(DataSet ds,int messageId, out MagicEventMail mail)
        {
            if (messageId == 0)
            {
                mail = null;
                return;
            }
            mail = new MagicEventMail(this._targetDBConnectionString, messageId, ds);
        }
    }


}

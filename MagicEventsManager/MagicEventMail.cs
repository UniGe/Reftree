using System;
using System.Collections;
using System.Configuration;
using System.Data;
using System.Net.Mail;
using System.Threading;


namespace MagicEventsManager
{

    public class MagicEventMail
    {

        private string connectionString { get; set; }
        private int ID;
        private DataSet Data;
      
        public MagicEventMail(string connectionString,int id,DataSet ds)
        {
            ID = id;
            this.connectionString = connectionString;
            this.Data = ds;
        }
      
        /// <summary>
        /// Inserisce il messaggio nella Magic_SystemEditedMessages e nella mailqueue per l' invio
        /// </summary>
        /// <returns></returns>
        public bool PushIntoMailQueue()
        {
            
            try
            {
                string tableJSON = DB.Utils.convertDataSetToJsonString(this.Data);
                string query = @"EXEC dbo.Magic_PushMailToQueue '{0}','{1}';";
                query = String.Format(query, this.ID.ToString(), tableJSON);
                Broker.Instance.ExecuteNonQuery(query,null,this.connectionString);
                
                return true;
            }
            catch
            {
                return false;
            }
        }


      

    }
}
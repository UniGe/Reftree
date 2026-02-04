using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using MagicFramework.Helpers;

namespace MagicFramework.Models
{
    public class Notification
    {
        public string Type { set; get; }
        public string Message { set; get; }
        public string DatabaseId { get; set; }

        public Notification()
        {

        }

        public string PushMessage(string username)
        {
            try
            {
                NotificationsHandler NH = new NotificationsHandler();
                return JsonConvert.SerializeObject(NH.SaveNotification(username, this.Type, this.Message));
            }
            catch (Exception e)
            {
                MFLog.LogInFile("MagicFramework.Models.Notification@PushMessage: Exception Message: " + e.Message, MFLog.logtypes.ERROR);
                return "";
            }
            
        }
     
    }


}
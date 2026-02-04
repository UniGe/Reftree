using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Runtime.Serialization;
using System.Web;

namespace Ref3.Models
{
    public class ALAB_CreateJobRequest
    {
        [DataMember(Name = "xmldescriptorBase64")]
        public string XmlDescriptorBase64 { get; set; }

        [DataMember(Name = "documentsBase64")]
        public string[] DocumentsBase64 { get; set; }

        [DataMember(Name = "freeze")]
        public bool Freeze { get; set; }

        [DataMember(Name = "webHooks")]
        public WebHooks WebHooks { get; set; }
    }
    [DataContract]
    public class WebHooks
    {
        [DataMember(Name = "subscriptionUrl")]
        public string SubscriptionUrl { get; set; }

        [DataMember(Name = "lossless")]
        public bool LossLess { get; set; }
    }

    [DataContract()]
    class ReturnInfos
    {
        [DataMember(Name = "withDocuments")]
        public bool withDocuments { get; set; }

        [DataMember(Name = "withDocumentPages")]
        public bool withDocumentPages { get; set; }

        [DataMember(Name = "withFields")]
        public bool withFields { get; set; }

        [DataMember(Name = "withAttachments")]
        public bool withAttachments { get; set; }

        [DataMember(Name = "withAttachmentParts")]
        public bool withAttachmentParts { get; set; }

        [DataMember(Name = "withActors")]
        public bool withActors { get; set; }

        [DataMember(Name = "withAttributes")]
        public bool WithAttributes { get; set; }
    }

    public class ActorsData
    {
        public int ID { get; set; }
        public int actorId { get; set; }
        public string FiscalCode { get; set; }
        public string SigningMode { get; set; }
        public string PhoneNumber { get; set; }
        public string BackMode { get; set; }
        public string url { get; set; } //generated after the signature session has been created
        public int AuthenticationType { get; set; } = 1;
     }

    public class PermanentUrlData
    {
        [JsonProperty("viewSuite")]
        public string ViewSuite { get; set; } = "default";

        [JsonProperty("viewTheme")]
        public string ViewTheme { get; set; } = "default";

        [JsonProperty("signingMode")]
        public string SigningMode { get; set; } = "securecall";

        [JsonProperty("backMode")]
        public string BackMode { get; set; } = "https://www.sidief.it/contratto_firmato";

        [JsonProperty("fiscalCode")]
        public string FiscalCode { get; set; }

        [JsonProperty("safeLink")]
        public bool SafeLink { get; set; } = true;

        [JsonProperty("lang")]
        public string Lang { get; set; } = "it";

        [JsonProperty("jobId")]
        public string JobId { get; set; }

        [JsonProperty("ticketId")]
        public string TicketId { get; set; } = null;

        [JsonProperty("authenticationType")]
        public int AuthenticationType { get; set; } = 1;

        [JsonProperty("phoneNumber")]
        public string PhoneNumber { get; set; }

        [JsonProperty("secret")]
        public string Secret { get; set; } = null;

        [JsonProperty("expireTime")]
        public DateTime ExpireTime { get; set; }

        [JsonProperty("clientId")]
        public string ClientId { get; set; }

        [JsonProperty("workflowSelected")]
        public int WorkflowSelected { get; set; } = 0;

        // Constructor
        public PermanentUrlData(string fiscalCode, string phoneNumber, string clientId,string jobId,string backmode,string signingMode,int authenticationType)
        {
            var signatureExpirationDays = ConfigurationManager.AppSettings["SignatureExpirationDays"] != null ?
                         int.Parse(ConfigurationManager.AppSettings["SignatureExpirationDays"].ToString()) : 30;

            ExpireTime = DateTime.Now.AddDays(signatureExpirationDays);  //DateTime.Now.AddDays(30);
            FiscalCode = fiscalCode;
            PhoneNumber = phoneNumber;
            ClientId = clientId;
            JobId = jobId;
            BackMode = backmode;
            SigningMode = signingMode;
            AuthenticationType = authenticationType;
        }
    }
}
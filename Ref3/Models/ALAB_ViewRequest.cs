using System.Runtime.Serialization;

namespace Ref3.Models
{
    [DataContract()]
    public class ALAB_UserInterface {
        [DataMember(Name = "viewSuite")]
        public string ViewSuite { get; set; }

        [DataMember(Name = "viewTheme")]
        public string ViewTheme { get; set; }

    }

    [DataContract()]
    public class ALAB_ViewRequest
    {
        [DataMember(Name = "userInterface")]
        public ALAB_UserInterface userInterface { get; set; }

     //   [DataMember(Name = "signingMode")]
     //   public string SigningMode { get; set; }

        [DataMember(Name = "backMode")]
        public string BackMode { get; set; }

        [DataMember(Name = "fiscalCode")]
        public string FiscalCode { get; set; }
    }
}

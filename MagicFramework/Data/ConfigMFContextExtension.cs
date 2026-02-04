using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Web;

namespace MagicFramework.Data
{
    public interface IMessageTemplate
    {
        int Id { get; set; }
        string Code { get; set; }
        string Subject { get; set; }
        string Body { get; set; }
        string To { get; set; }
        string cc { get; set; }
        string ccn { get; set; }
        string Attachments { get; set; }
        bool IsHtml { get; set; }
    }
    public partial class Magic_SystemMessages : IMessageTemplate { }
    public partial class Magic_SystemEditedMessages : IMessageTemplate { }
    public partial class ConfigMFContainer : DbContext
    {
        public ConfigMFContainer
            (string connectionStr)
        : base(connectionStr)
        {
        }

    }
}
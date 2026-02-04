using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace MagicFramework.Models
{

    public class Response
    {
        public Array Data { get; set; }
        public int Count { get; set; }
        public string Errors { get; set; }
        public string Warning { get; set; }

        public Response(Array data, int count)
        {
            this.Data = data;
            this.Count = count;

        }
        public Response(Array data, int count,string warning)
        {
            this.Data = data;
            this.Count = count;
            this.Warning = warning;

        }


        public Response(string errors)
        {
            this.Errors = errors;
        }
    }

    public class ResponseString
    {
        public string menu { get; set; }
        public string breadcrumbs { get; set; }
        public bool isvalidsession { get; set; }
        public UserInfo userInfo { get; set; }
    }

    public class UserInfo
    {
        public string Username { get; set; }
        public int UserID { get; set; }
        public string ApplicationName { get; set; }
        public bool IsDeveloper { get; set; }
        public int UserVisibilityGroup { get; set; }
        public string UserCultureCode { get; set; }
    }
}
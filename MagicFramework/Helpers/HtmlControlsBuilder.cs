using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.HtmlControls;


namespace MagicFramework.Helpers
{
    public class HtmlControlTypes
    {
        public static string div { get { return "div"; } }
        public static string span { get { return "span"; } }
        public static string ul { get { return "ul"; } }
        public static string li { get { return "li"; } }
        public static string a { get { return "a"; } }
    }


    public class HtmlControlsBuilder
    {
        public static string HtmlControlToText(HtmlGenericControl ctrl)
        {
            using (System.IO.StringWriter swriter = new System.IO.StringWriter())
            {
                HtmlTextWriter writer = new HtmlTextWriter(swriter);
                ctrl.RenderControl(writer);
                return swriter.ToString();
            }
        }

        public static HtmlGenericControl GetSpanWithClass(string classname)
        {
            HtmlGenericControl span = new HtmlGenericControl(HtmlControlTypes.span);
            span.Attributes.Add("class", classname);
            return span;
        }

        public static HtmlGenericControl GetSpanWithClassAndLabel(string classname, string label)
        {
            HtmlGenericControl span = new HtmlGenericControl(HtmlControlTypes.span);
            span.Attributes.Add("class", classname);
            span.InnerHtml = label;
            return span;
        }

        public static HtmlGenericControl GetIconWithClass(string classname)
        {
            // icona del menu
            //  TODO: capire le icone come gestirle senza class e reperirle dal DB
            HtmlGenericControl i = new HtmlGenericControl("i");
            i.Attributes.Add("class", classname);
            return i;
        }

        public static HtmlGenericControl GetULWithClass(string classname)
        {
            HtmlGenericControl ul = new HtmlGenericControl(HtmlControlTypes.ul);
            ul.Attributes.Add("class", classname);
            return ul;
        }

        public static HtmlGenericControl GetLIWithClass(string classname)
        {
            HtmlGenericControl li = new HtmlGenericControl(HtmlControlTypes.li);
            if (classname != null)
            {
                li.Attributes.Add("class", classname);
            }
            return li;
        }


        public static HtmlAnchor GetAForMenu(string arrowclass, string iconclass, string label)
        {
            HtmlAnchor a = new HtmlAnchor();
            a.HRef = "javascript:;";
            a.Controls.Add(GetSpanWithClass(arrowclass));
            a.Controls.Add(GetIconWithClass(iconclass));
            a.Controls.Add(GetSpanWithClassAndLabel("title", label));
            return a;
        }

        public static HtmlAnchor GetAForHome()
        {
            HtmlAnchor a = new HtmlAnchor();
            a.HRef = "dashboard";
            a.Controls.Add(GetSpanWithClassAndLabel("title", "Dashboard"));
            return a;
        }
            

        public static HtmlGenericControl getsinglebreadcrumb(string label)
        {
            HtmlGenericControl licomplete = GetLIWithClass(null);
            licomplete.Controls.Add(GetIconWithClass("icon-angle-right"));
            licomplete.Controls.Add(GetSpanWithClassAndLabel("", label));  //TODO: Capire nome del Class ed eventualmente convertire in un <a>
            return (licomplete);
        }

        public static HtmlGenericControl GetHtmlControl(string type, string cssclass, string style, string innerhtml, string id)
        {
            HtmlGenericControl ret = new HtmlGenericControl(type);
            if (cssclass != null)
            {
                ret.Attributes.Add("class", cssclass);
            }
            if (style != null)
            {
                ret.Attributes.Add("style", style);
            }
            if (innerhtml != null)
            {
                ret.InnerHtml = innerhtml;
            }
            if (id != null)
            {
                ret.ID = id;
            }
            return ret;
        }


    }
}
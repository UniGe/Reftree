using MagicFramework.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Web;

namespace MagicFramework.Helpers
{
    public class TranslateablePage : System.Web.UI.Page
    {
        protected int culture;
        protected string culturestring;
        protected string translationFileName { get; set; }

        protected void page_PreInit(object sender, EventArgs e)
        {
            if (!Int32.TryParse(Request.QueryString["culture"], out this.culture))
            {
                this.culture = MFConfiguration.DefaultCultureId;
            }
            else
            {
                //string applicationInstanceID = HttpContext.Current.Session["ApplicationInstanceId"]?.ToString() ?? Request.QueryString["from"]?.ToString();
                string applicationInstanceID = HttpContext.Current.Session["ApplicationInstanceId"] != null ? HttpContext.Current.Session["ApplicationInstanceId"].ToString() : Request.QueryString["from"];
                if (applicationInstanceID != null) {
                    var selectedconfig = new MFConfiguration(Request.Url.Authority).GetApplicationInstanceByID(Request.Url.Authority, applicationInstanceID);
                    Data.MagicDBDataContext context = new Data.MagicDBDataContext(selectedconfig.MagicDBConnectionString);
                    var c = (from el in context.Magic_Cultures.Where(x => x.Magic_CultureID == culture)
                                          select new Models.Magic_Cultures(el)).FirstOrDefault();
                    if (c != null)
                        this.culturestring = c.Magic_Language;
                }
            }
        }

        protected string Translate(string toTranslate)
        {
            Regex r = new Regex("#(?<name>[^#]+)#");
            MatchEvaluator ev = new MatchEvaluator(this.ReplaceTranslationTags);
            toTranslate = r.Replace(toTranslate, ev);
            return toTranslate;
        }

        protected string ReplaceTranslationTags(Match m)
        {
            return this.FindTranslation(m.Groups["name"].Value);
        }

        protected string FindTranslation(string key)
        {
            if (translationFileName == null)
                return key;
            try
            {
                if (this.culturestring != null)
                {
                    try
                    {
                        return HttpContext.GetGlobalResourceObject(translationFileName, key, new System.Globalization.CultureInfo(this.culturestring)).ToString();
                    }
                    catch
                    {
                        return HttpContext.GetGlobalResourceObject(translationFileName, key).ToString();
                    }
                }
                else
                    return HttpContext.GetGlobalResourceObject(translationFileName, key).ToString();
            }
            catch (Exception ex)
            {
                return key;
            }
        }

        protected string FindTranslation(string key, string defaultValue)
        {
            string translation = this.FindTranslation(key);
            if (translation == key)
                return defaultValue;
            return translation;
        }
    }
}
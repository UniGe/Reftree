using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using System.Dynamic;

namespace MagicFramework.Helpers
{
    public class TemplateContainerBuilder
    {
        private Dictionary<string, FileInfo> dataRolesInfo;
        private Dictionary<string, string> labels;
        private List<int> applicationCultures;
        private List<int> columnLabelsNeeded;
        private int currentCulture;
        private Data.MagicDBDataContext context;

        public TemplateContainerBuilder()
        {
            this.labels = new Dictionary<string, string>();
            this.context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());
        }

        public TemplateContainerBuilder(bool readTemplatesOnly)
        {

        }

        public string FilltemplatecontainerByID(int templateid,int? layerid)
        {
            try
            {
                string templatecontainer = String.Empty;
                Prepare();
                var ele = (from e in context.Magic_Templates.Where(x => x.MagicTemplateID == templateid) select (e)).FirstOrDefault();
                var script = String.Empty;
                    if (ele.MagicTemplateScript != null)
                    {
                        script = ele.MagicTemplateScript;
                        templatecontainer += script;
                    }
                    else {

                        List<KeyValuePair<int, string>> dataRoles = (from e in context.Magic_TemplateDetails
                                                                     where e.MagicTemplate_ID == ele.MagicTemplateID
                                                                     select new KeyValuePair<int, string>(e.MagicTemplate_ID, e.Magic_TemplateDataRoles.MagicTemplateDataRole)).ToList();
                        List<KeyValuePair<int, string>> dataRolesOverwrites = (from e in context.Magic_TemplateDetailsFunctionOverrides
                                                                               where e.Magic_TemplateDetails.MagicTemplate_ID == ele.MagicTemplateID && e.IsvisibleforFunction == true
                                                                               select new KeyValuePair<int, string>(e.Magic_TemplateDetails.MagicTemplate_ID, e.Magic_TemplateDataRoles.MagicTemplateDataRole)).ToList();


                        Data.Magic_TemplateScriptsBuffer bufferedScript = null;
                        bufferedScript = ele.Magic_TemplateScriptsBuffer.Where(w => w.Magic_Culture_ID == MagicFramework.Helpers.SessionHandler.UserCulture && w.Magic_Function_ID == null && w.Magic_Grid_ID == null && w.Magic_Layer_ID == layerid).FirstOrDefault();

                      
                        if (bufferedScript != null)
                        {
                            if (ele.isSystemTemplate == true && !ApplicationSettingsManager.GetWorkOnSystemSettings()) //buffer found, app is not system , the template is system =>it has been built in Magicsolution
                            {
                                templatecontainer += bufferedScript.Magic_Script;
                                return templatecontainer;
                            }
                            else if (bufferedScript.Created != null && GetLastWriteForNeededDataroles(ele.MagicTemplateID,dataRoles,dataRolesOverwrites) <= bufferedScript.Created)
                            {
                                templatecontainer += bufferedScript.Magic_Script;
                                return templatecontainer;
                            }
                        }
                        
                        //D.T:i can create / destroy buffers according to system setting in .config file (only magic solution can modify sytem buffers)
                        if (ele.isSystemTemplate != true || ApplicationSettingsManager.GetWorkOnSystemSettings())
                            templatecontainer += CreateAndBufferScript(ele, null, layerid, false);
                        else
                            MFLog.LogInFile("MagicFramework.Helpers.TemplateContainerBuilder@FilltemplatecontainerByID: Missing script buffer for MagicTemplateID " + ele.MagicTemplateID + " UserCulture " + MagicFramework.Helpers.SessionHandler.UserCulture, MFLog.logtypes.ERROR);
                    }
                
                
                return templatecontainer;
            }
            catch (Exception e)
            {
                MFLog.LogInFile("MagicFramework.Helpers.TemplateContainerBuilder@FilltemplatecontainerByID: Error " + e.Message, MFLog.logtypes.ERROR);
                return null;
            }
        }
        /// <summary>
        /// Riempie il container dei templates data la function lanciata: se trova un override lo restituisce altrimenti crea dinamicamente da DB tables
        /// </summary>
        /// <returns>
        /// la stringa rappresentante lo script che definisce i template da usare in funzione
        /// </returns>
        public string FilltemplatecontainerForFunction(int functionid)
        {
            try
            {
                string templatecontainer = String.Empty;
                Prepare();
                var v = (from e in context.Magic_FunctionsTemplates.Where(x => x.MagicFunction_ID == functionid)
                         select (e)).ToList();

                var function = v.Where(x => x.MagicFunction_ID == functionid).Select(y=> y.Magic_Functions).FirstOrDefault();
                int? layerid = null;
                if (function != null)
                    layerid = function.Layer_ID;

                 List<int?> tids = v.Select(x=> x.MagicTemplate_ID).ToList();

                 List<Data.Magic_TemplateScriptsBuffer> bufs = (from e in context.Magic_TemplateScriptsBuffer where tids.Contains(e.Magic_Template_ID) && e.Magic_Culture_ID == SessionHandler.UserCulture  select e).ToList();

                if (v.Count > 0)
                {
                    var dbtemplates = (from e in context.Magic_Templates where tids.Contains(e.MagicTemplateID) select e).ToList();

                    List<KeyValuePair<int,string>> dataRoles = (from e in context.Magic_TemplateDetails
                                     where tids.Contains(e.MagicTemplate_ID)
                                     select new KeyValuePair<int,string>(e.MagicTemplate_ID, e.Magic_TemplateDataRoles.MagicTemplateDataRole)).ToList();
                    List<KeyValuePair<int,string>> dataRolesOverwrites = (from e in context.Magic_TemplateDetailsFunctionOverrides
                                                        where tids.Contains(e.Magic_TemplateDetails.MagicTemplate_ID) && e.IsvisibleforFunction == true
                                                        select new KeyValuePair<int,string>( e.Magic_TemplateDetails.MagicTemplate_ID, e.Magic_TemplateDataRoles.MagicTemplateDataRole )).ToList();

                    foreach (var ele in dbtemplates)
                    {
                        // se lo script nella culture manca opero l' override con lo script "generico" in Magic templates
                        if (ele.MagicTemplateScript != null)
                        {
                            templatecontainer += ele.MagicTemplateScript;
                        }
                        else // se non ci sono script gia' precaricati lo compongo al volo
                        {
                            bool hasoverrides = v.Where(e=> e.MagicFunction_ID == functionid && e.MagicTemplate_ID == ele.MagicTemplateID).Select(x=> x.HasOverrides).FirstOrDefault();
                            Data.Magic_TemplateScriptsBuffer bufferedScript = null;
                            if (hasoverrides || layerid != null)
                                bufferedScript = bufs.Where(w => w.Magic_Template_ID == ele.MagicTemplateID && w.Magic_Culture_ID == MagicFramework.Helpers.SessionHandler.UserCulture && w.Magic_Function_ID == functionid && w.Magic_Grid_ID == null).FirstOrDefault();
                            else
                                bufferedScript = bufs.Where(w => w.Magic_Template_ID == ele.MagicTemplateID && w.Magic_Culture_ID == MagicFramework.Helpers.SessionHandler.UserCulture && w.Magic_Function_ID == null && w.Magic_Grid_ID == null).FirstOrDefault();

                            if (bufferedScript != null)
                            {

                                if (ele.isSystemTemplate==true && !ApplicationSettingsManager.GetWorkOnSystemSettings()) //buffer found, app is not system , the template is system =>it has been built in Magicsolution
                                {
                                    templatecontainer += bufferedScript.Magic_Script;
                                    continue;
                                }
                                else if (bufferedScript.Created != null 
                                        && GetLastWriteForNeededDataroles(ele.MagicTemplateID,dataRoles.Where(x=> x.Key == ele.MagicTemplateID).ToList(),
                                                                          dataRolesOverwrites.Where(y=> y.Key == ele.MagicTemplateID).ToList()) <= bufferedScript.Created)
                                {
                                    templatecontainer += bufferedScript.Magic_Script;
                                    continue;
                                }
                            }

                            if (ele.isSystemTemplate != true || ApplicationSettingsManager.GetWorkOnSystemSettings())
                                templatecontainer += CreateAndBufferScript(ele, functionid, layerid, hasoverrides);
                            else
                                MFLog.LogInFile("MagicFramework.Helpers.TemplateContainerBuilder@FilltemplatecontainerForFunction: Missing script buffer for MagicTemplateID " + ele.MagicTemplateID + " UserCulture " + MagicFramework.Helpers.SessionHandler.UserCulture, MFLog.logtypes.ERROR);
                        }
                        
                    }
                }
                return templatecontainer;
            }
            catch 
            {
                return null;
            }
        }

        /// <summary>
        /// Riempie il container dei templates data la function lanciata: se trova un override lo restituisce altrimenti crea dinamicamente da DB tables
        /// </summary>
        /// <returns>
        /// la stringa rappresentante lo script che definisce i template da usare in funzione
        /// </returns>
        public string Filltemplatecontainer(string path)
        {
            try
            {
                string querystring = null;
                string pathbase = path;
                if (path.Split('?').Length >= 2)
                {
                    querystring = path.Split('?')[1];
                    pathbase = path.Split('?')[0];
                }

                pathbase = pathbase.Replace(@"\", "/");

                string templatecontainer = String.Empty;
                var v = (from e in context.Magic_FunctionsTemplates.Where(x => x.Magic_Functions.FunctionBaseUrl == pathbase && x.Magic_Functions.FunctionQsParameters == querystring)
                         select (e)).ToList();

                if (querystring == null)
                    v = (from e in context.Magic_FunctionsTemplates.Where(x => x.Magic_Functions.FunctionBaseUrl == pathbase)
                         select (e)).ToList();


                var function = v.FirstOrDefault().Magic_Functions;
                int functionid = function.FunctionID;
                int? layerid = null;
                if (function != null)
                    layerid = function.Layer_ID;

                if (v.Count > 0)
                {

                    var dbtemplates = v.Select(x => x.Magic_Templates);
                    List<int?> tids = v.Select(x => x.MagicTemplate_ID).ToList();

                    List<Data.Magic_TemplateScriptsBuffer> bufs = (from e in context.Magic_TemplateScriptsBuffer where tids.Contains(e.Magic_Template_ID) && e.Magic_Culture_ID == SessionHandler.UserCulture select e).ToList();

                    List<KeyValuePair<int, string>> dataRoles = (from e in context.Magic_TemplateDetails
                                                                 where tids.Contains(e.MagicTemplate_ID)
                                                                 select new KeyValuePair<int, string>(e.MagicTemplate_ID, e.Magic_TemplateDataRoles.MagicTemplateDataRole)).ToList();
                    List<KeyValuePair<int, string>> dataRolesOverwrites = (from e in context.Magic_TemplateDetailsFunctionOverrides
                                                                           where tids.Contains(e.Magic_TemplateDetails.MagicTemplate_ID) && e.IsvisibleforFunction == true
                                                                           select new KeyValuePair<int, string>(e.Magic_TemplateDetails.MagicTemplate_ID, e.Magic_TemplateDataRoles.MagicTemplateDataRole)).ToList();

                    foreach (var ele in dbtemplates)
                    {
                        // se lo script nella culture manca opero l' override con lo script "generico" in Magic templates
                        if (ele.MagicTemplateScript != null)
                        {
                            templatecontainer += ele.MagicTemplateScript;
                        }
                        else // se non ci sono script gia' precaricati lo compongo al volo
                        {
                            bool hasoverrides = v.Where(e => e.MagicFunction_ID == functionid && e.MagicTemplate_ID == ele.MagicTemplateID).Select(x => x.HasOverrides).FirstOrDefault();
                            Data.Magic_TemplateScriptsBuffer bufferedScript = null;
                            if (hasoverrides || layerid != null)
                                bufferedScript = bufs.Where(w => w.Magic_Template_ID == ele.MagicTemplateID && w.Magic_Culture_ID == MagicFramework.Helpers.SessionHandler.UserCulture && w.Magic_Function_ID == functionid && w.Magic_Grid_ID == null).FirstOrDefault();
                            else
                                bufferedScript = bufs.Where(w => w.Magic_Template_ID == ele.MagicTemplateID && w.Magic_Culture_ID == MagicFramework.Helpers.SessionHandler.UserCulture && w.Magic_Function_ID == null && w.Magic_Grid_ID == null).FirstOrDefault();

                            if (bufferedScript != null)
                            {

                                if (ele.isSystemTemplate == true && !ApplicationSettingsManager.GetWorkOnSystemSettings()) //buffer found, app is not system , the template is system =>it has been built in Magicsolution
                                {
                                    templatecontainer += bufferedScript.Magic_Script;
                                    continue;
                                }
                                else if (bufferedScript.Created != null
                                        && GetLastWriteForNeededDataroles(ele.MagicTemplateID, dataRoles.Where(x => x.Key == ele.MagicTemplateID).ToList(),
                                                                          dataRolesOverwrites.Where(y => y.Key == ele.MagicTemplateID).ToList()) <= bufferedScript.Created)
                                {
                                    templatecontainer += bufferedScript.Magic_Script;
                                    continue;
                                }
                            }

                            if (ele.isSystemTemplate != true || ApplicationSettingsManager.GetWorkOnSystemSettings())
                            {
                                Prepare();
                                templatecontainer += CreateAndBufferScript(ele, functionid, layerid, hasoverrides);
                            }
                            else
                                MFLog.LogInFile("MagicFramework.Helpers.TemplateContainerBuilder@FilltemplatecontainerForFunction: Missing script buffer for MagicTemplateID " + ele.MagicTemplateID + " UserCulture " + MagicFramework.Helpers.SessionHandler.UserCulture, MFLog.logtypes.ERROR);
                        }

                    }
                }
                return templatecontainer;
            }
            catch 
            {
                return null;
            }
            
        }
        private string BuildLiAttributeAndClass(int i, int? groupId = null,Guid? guid = null)
        {
            //se il tab contiene una griglia gli attribuisco la medesima classe (non comporta variazioni di css) 
            string htmlClass = i == 0 ? "class=\"k-state-active\"" : "";
            string groupAttr = groupId != null ? " data-tab-id=\""+ groupId + "\"" : "";
            if (guid != null)
            {
                groupAttr += " data-guid=\"" + guid.ToString() + "\"";
                string layerRestrictions = String.Empty;
                layerRestrictions = String.Join(",", Models.Magic_TemplateGroups.GetLayerRestrictions((Guid)guid));
                if (!String.IsNullOrEmpty(layerRestrictions))
                    groupAttr += " data-tab-layer=\"" + layerRestrictions + "\"";
            }
            return htmlClass + groupAttr;
        }

        public class tabGroupElement
        {
            public int order { get; set; }
            public string content { get; set; }
        }

        private Dictionary<int, string> CreateKendoTemplateScript(Data.Magic_Templates ele, List<Data.Magic_TemplateGroups> allgroups, List<Data.Magic_TemplateDetails> alldetails, List<Data.Magic_TemplateGroupsFunctionOverrides> allgroupover, List<Data.Magic_TemplateDetailsFunctionOverrides> alldetailover,int? layerid)
        {

            string listofobjects = String.Empty;
            string listofdatasourcetofeed = String.Empty;

            string res1 = String.Empty;

            //first take non grid tabs, then tabs without tabGroup, then order by OrdinalPosition
            var groups = allgroups.OrderBy(y => y.Magic_TemplateGroupContent.MagicTemplateGroupContentType.Contains("GRID")).ThenBy(y => y.MagicTemplateTabGroup_ID.HasValue).ThenBy(y => y.OrdinalPosition);
            if (ele.Magic_TemplateTypes.MagicTemplateType == "NAVIGATION")
                groups = allgroups.OrderBy(y => y.OrdinalPosition);
            int i = 0;
            string templateheader = String.Empty;  // templateheader serve solo per il caso tabstrip
            string line = String.Empty;
            string elements = String.Empty;
            this.columnLabelsNeeded = new List<int>();
            List<int> groupLabelsNeeded = new List<int>();
            List<int> tabGroupLabelsNeeded = new List<int>();
            Dictionary<int, tabGroupElement> tabGroups = new Dictionary<int, tabGroupElement>();

            foreach (var g in groups)
            {
                int edittemplatebaseforlayer = 0;
                var objname = String.Empty;
                var contenttype = String.Empty;
                if (g.Magic_TemplateGroupContent != null)
                {
                    contenttype = g.Magic_TemplateGroupContent.MagicTemplateGroupContentType;

                    if (g.Magic_TemplateGroupContent.MagicTemplateGroupContentType == "GRID")
                    {

                        if (g.Magic_Grids != null)
                            objname = g.Magic_Grids.MagicGridName;
                        else objname = "NONE";
                    }
                    if (g.Magic_TemplateGroupContent.MagicTemplateGroupContentType == "EXTENSIONGRID")
                    {

                        if (g.Magic_Grids != null)
                        {
                            objname = "EXT_" + g.Magic_Grids.MagicGridName;
                            edittemplatebaseforlayer = (from e in  context.Magic_Templates where e.MagicTemplateName == g.Magic_Grids.EditableTemplate select e.MagicTemplateID).FirstOrDefault();
                        }
                        else objname = "NONE";
                    }
                }   
                var extds = String.Empty;
                if (g.ExtMagicDataSource_ID != null && g.ExtMagicDataSource_ID != 0)
                    extds = g.Magic_DataSource.Name;
     
                bool isvisible = (bool)g.Groupisvisible;

                var groupoverride = allgroupover == null ? null : allgroupover.Where(x => x.MagicTemplateGroup_ID == g.MagicTemplateGroupID);
                
                if (groupoverride != null)
                    if (groupoverride.FirstOrDefault() != null)
                        isvisible = (bool)groupoverride.FirstOrDefault().IsvisibleforFunction;

                if ((g.Magic_TemplateGroupContent.MagicTemplateGroupContentType == "FIELDEDITLIST" || g.Magic_TemplateGroupContent.MagicTemplateGroupContentType == "FIELDLABELLIST") && g.Magic_TemplateDetails.Where(y => y.Magic_Columns != null).Count() == 0)
                    isvisible = false;

                if (isvisible)
                {
                    string layerRestr = String.Empty; 
                    try {
                        layerRestr = String.Join(",",Models.Magic_TemplateGroups.GetLayerRestrictions((Guid)g.GUID));
                    }
                    catch (Exception ex) {
                        MFLog.LogInFile("TemplateContainerBuilder - Error while loading layers retrictions for tabs:" + ex.Message, MFLog.logtypes.ERROR);
                    }
                    JObject dataObject = new JObject();
                    dataObject.Add("contentType", contenttype);
                    dataObject.Add("objectName", objname);
                    dataObject.Add("groupClass", g.MagicTemplateGroupClass);
                    if(g.BindedGridFilter == null || !Regex.Match(g.BindedGridFilter, @"^{.*}$").Success)
                        dataObject.Add("bindedGridFilter", g.BindedGridFilter ?? "");
                    else
                        dataObject.Add("bindedGridFilter", new JRaw(Utils.DoubleToSingleCurly(g.BindedGridFilter)));
                    dataObject.Add("bindedGridHideFilterCol", g.BindedGridHideFilterCol);
                    dataObject.Add("bindedGridRelType_ID", g.BindedGridRelType_ID);
                    dataObject.Add("extds", extds);
                    dataObject.Add("templateToAppendName", g.TemplateToAppendName);
                    dataObject.Add("MagicTemplateGroupDOMID", g.MagicTemplateGroupDOMID);
                    dataObject.Add("editTemplateBaseForLayer", edittemplatebaseforlayer);
                    dataObject.Add("gridGUID", g.Magic_Grids != null ? (g.Magic_Grids.GUID != null ? g.Magic_Grids.GUID.ToString() : "") : "");

                    StringBuilder elementsofgroup = new StringBuilder();
                    //se l' utente ha imposto una classe al tab passo il nome della classe altrimenti quello della Griglia
                    string liclass = BuildLiAttributeAndClass(i, g.MagicTemplateTabGroup_ID != null ? g.MagicTemplateGroupID : g.MagicTemplateTabGroup_ID,g.GUID);
                    i++;
                    //tab globalization
                    if (!this.labels.ContainsKey("group-" + g.MagicTemplateGroupID.ToString()))
                    {
                        groupLabelsNeeded.Add(g.MagicTemplateGroupID);
                        this.labels["group-" + g.MagicTemplateGroupID.ToString()] = g.MagicTemplateGroupLabel;
                    }
                    line += "<li " + liclass + " data-content-object='" + dataObject.ToString(Newtonsoft.Json.Formatting.None).Replace("'", @"\'") + "'>-#group-" + g.MagicTemplateGroupID + "#-</li>";

                    //add tab group
                    if(g.MagicTemplateTabGroup_ID != null)
                    {
                        //create tab group dropdown html if not exists in tabGroups variable
                        if (!tabGroups.ContainsKey((int)g.MagicTemplateTabGroup_ID))
                        {
                            if (!this.labels.ContainsKey("tab-group-" + g.MagicTemplateTabGroup_ID.ToString()))
                            {
                                tabGroupLabelsNeeded.Add((int)g.MagicTemplateTabGroup_ID);
                                this.labels["tab-group-" + g.MagicTemplateTabGroup_ID.ToString()] = g.Magic_TemplateTabGroups.MagicTemplateTabGroupLabel;
                            }

                            string style = string.Empty;
                            if (!string.IsNullOrEmpty(g.Magic_TemplateTabGroups.Color))
                            {
                                Match match = Regex.Match(g.Magic_TemplateTabGroups.Color, @"rgba\(\d{1,3},\s*\d{1,3},\s*\d{1,3},\s*([\d\.]){1,4}\)", RegexOptions.IgnoreCase);
                                //color is not rgba or os not transparent
                                if(!match.Success || int.Parse(match.Groups[1].Value) > 0)
                                    style = " style=\"background-color: " + g.Magic_TemplateTabGroups.Color.Replace("#", "\\#") + ";\"";
                            }

                            tabGroups[(int)g.MagicTemplateTabGroup_ID] = new tabGroupElement {
                            order = (int)g.Magic_TemplateTabGroups.OrdinalPosition,
                            content = "<li" + style + " class=\"dropdown" + (i == 1 ? " k-state-aktive" : "") + "\"><span href=\"dropdown\" class=\"k-link dropdown-toggle\" data-toggle=\"dropdown\">-#tab-group-" + g.MagicTemplateTabGroup_ID + "#-</span><ul class=\"dropdown-menu\">{0}</ul></li>" };
                        }

                        //add tab li to dropdown (tabgroup)
                        liclass = Regex.Match(liclass, @"^class=").Success ? liclass.Replace("class=\"", "class=\"k-button ") : "class=\"k-button\"" + liclass;
                        tabGroups[(int)g.MagicTemplateTabGroup_ID].content = string.Format(tabGroups[(int)g.MagicTemplateTabGroup_ID].content, "<button " + liclass + " onclick=\"kendoTabStripDropdownItemClick(this)\"><span class=\"k-link\">-#group-" + g.MagicTemplateGroupID + "#-</span></button>{0}");
                    }

                    var details = alldetails.Where(x => x.MagicTemplateGroup_ID == g.MagicTemplateGroupID && x.DetailInheritsFromColumn_ID.HasValue).OrderBy(y => y.OrdinalPosition);

                    double bootstrapColumnSize = 12;
                    if (ele.Magic_Grids != null)
                        bootstrapColumnSize = Math.Floor(12 / (double)(ele.Magic_Grids.EditFormColumnNum ?? 1));

                    foreach (var d in details)
                    {
                        var detailoverride = alldetailover == null ? null : alldetailover.Where(x => x.MagicTemplateDetail_ID == d.MagicTemplateDetailID);

                        bool detisvisible = (bool)d.Detailisvisible;

                        if (detailoverride!=null)
                            if (detailoverride.FirstOrDefault() != null)
                                detisvisible = (bool)detailoverride.FirstOrDefault().IsvisibleforFunction;
                     
                        if (detisvisible && d.Magic_Columns!=null)
                        {
                            string dataRoleHtml = ComposeElementscript(d, ele.Magic_TemplateTypes.MagicTemplateType);
                            if (ele.Magic_TemplateTypes.MagicTemplateType == "POPUPEDITOR")
                            {
                                bool isFullWidth = d.Magic_TemplateDataRoles.MagicTemplateDataRole == "editor";
                                elementsofgroup.Append(string.Format("<div class='col-sm-{0}{1}'>{2}</div>", isFullWidth ? "12" : bootstrapColumnSize.ToString(), d.Magic_TemplateDataRoles.MagicTemplateDataRole == "detailgrid" ? " hidden" : "", dataRoleHtml));
                            }
                            else
                                elementsofgroup.Append(dataRoleHtml);
                        }   
                    }


                    if (ele.Magic_TemplateTypes.MagicTemplateType == "POPUPEDITOR" && elementsofgroup.Length > 0)
                        elements += string.Format("<div {2}><div class='row col-{0}-form'>{1}</div></div>", bootstrapColumnSize, elementsofgroup.ToString(),g.GUID == null ? "" : "data-guid=\""+ g.GUID.ToString() +"\"");
                    string domid = string.Empty;
                    if (ele.Magic_TemplateTypes.MagicTemplateType == "NAVIGATION" || (ele.Magic_TemplateTypes.MagicTemplateType == "POPUPEDITOR" && g.Magic_TemplateGroupContent.MagicTemplateGroupContentType != "FIELDEDITLIST"))
                    {
                        switch (g.Magic_TemplateGroupContent.MagicTemplateGroupContentType)
                        {
                            case "GRID":
                            case "EXTENSIONGRID":
                                if (g.MagicTemplateGroupDOMID != null && g.MagicTemplateGroupDOMID != "")
                                    domid = "id=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(g.MagicTemplateGroupDOMID);
                                if (g.MagicTemplateGroupClass != null && g.MagicTemplateGroupClass != "")
                                    elements += "<div><div " + domid + " class=\"" + g.MagicTemplateGroupClass + "\">" + "</div></div>";
                                else
                                {
                                    if (g.BindedGrid_ID != null && g.BindedGrid_ID != 0)
                                        elements += "<div><div " + domid + " class=\"" + objname + "\">" + "</div></div>";
                                    else
                                        elements += "<div><div " + domid + ">" + "</div></div>";
                                }
                                break;
                            case "FIELDLABELLIST":
                                domid = string.Empty;
                                if (g.MagicTemplateGroupDOMID != null && g.MagicTemplateGroupDOMID != "")
                                    domid = "id=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(g.MagicTemplateGroupDOMID);
                                elements += "<div " + domid + " class=\"" + g.MagicTemplateGroupDOMID + "\" ><ul  style=\" list-style: none;\">" + elementsofgroup.ToString() + "</ul></div>";
                                break;
                            default:
                                elements += "<div><div id=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(g.MagicTemplateGroupDOMID) + " class=\"" + g.MagicTemplateGroupDOMID + "\"></div></div>";
                                break;
                        }
                    }
                    else if (ele.Magic_TemplateTypes.MagicTemplateType == "NAVIGATIONPARTIAL")
                    {
                        switch (g.Magic_TemplateGroupContent.MagicTemplateGroupContentType)
                        {
                            case "FIELDLABELLIST": //TODO mettere l'id del dom object qui...
                                elements += "<ul style=\" list-style: none;\">" + elementsofgroup.ToString() + "</ul>";
                                break;
                            default:
                                elements += "<div id=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(g.MagicTemplateGroupDOMID) + "\"></div>";
                                break;
                        }
                    }
                } //is visible if
            }

            //add dropdowns (tabgroups) at the end of normal tabs
            if(tabGroups.Count > 0)
            {
                foreach (var tabGroup in tabGroups.OrderBy(x => x.Value.order))
                    line += string.Format(tabGroup.Value.content, "");
            }



            //TODO portare il tabstrip html su database come proprieta' del template type 
            string tabstriphtml = String.Empty;

            if (ele.Magic_TemplateLayouts.Layout == "TABSTRIP")  // tabstrip
            {
                templateheader = "<ul>{0}</ul>";
                templateheader = String.Format(templateheader, line);

                if (ele.Magic_TemplateTypes.MagicTemplateType == "POPUPEDITOR")
                    tabstriphtml = "<script class='{2}' id='{0}' type='text/x-kendo-template'><div id='tabstrippopup' data-role='tabstrip' data-activate='popUpTabActivation'>{1}</div></script>";
                if (ele.Magic_TemplateTypes.MagicTemplateType == "NAVIGATION")
                    tabstriphtml = "<script id='{0}' type='text/x-kendo-template'><div class='tabstrip'>{1}</div></script>";
           
                if (ele.Magic_TemplateTypes.MagicTemplateType == "NAVIGATIONPARTIAL")
                {
                    templateheader = String.Empty;
                    tabstriphtml = "<script id='{0}' type='text/x-kendo-template'>{1}</script>";
                }
            }

            else  //altri casi,n.b: il navigation e' un tabstrip per forza
            {
                if (ele.Magic_TemplateTypes.MagicTemplateType == "POPUPEDITOR")
                {

                    tabstriphtml = "<script class=\"{2}\" id=\"{0}\" type=\"text/x-kendo-template\"><div id=\"popup\" >{1}</div></script>";
                }
                else
                    tabstriphtml = "<script id=\"{0}\" type=\"text/x-kendo-template\"><div id=\"scriptauto\" >{1}</div></script>";
            }
            //string layerappendix = (layerid == null ? "" : "_"+layerid.ToString());
            res1 = String.Format(tabstriphtml, ele.MagicTemplateName, templateheader + elements, ele.MagicTemplateName);

            if(columnLabelsNeeded.Any())
            {  
                var labs = context.Magic_ColumnLabels.Where(x => applicationCultures.Contains(x.MagicCulture_ID) && this.columnLabelsNeeded.Contains(x.Magic_Column_ID)).ToList();
                foreach (var x in labs)
                {
                    if (!this.labels.ContainsKey("column-" + x.Magic_Column_ID + "-" + x.MagicCulture_ID))
                        this.labels.Add("column-" + x.Magic_Column_ID + "-" + x.MagicCulture_ID, x.ColumnLabel);
                }
            }
            if(groupLabelsNeeded.Any())
            { 
                var glabs =    (from e in context.Magic_TemplateGroupLabels.Where(x => groupLabelsNeeded.Contains(x.MagicTemplateGroup_ID) && applicationCultures.Contains(x.MagicCulture_ID))
                    select e).ToList();
                foreach( var x in glabs)
                  if (!this.labels.ContainsKey("group-" + x.MagicTemplateGroup_ID + "-" + x.MagicCulture_ID))
                      this.labels.Add("group-" + x.MagicTemplateGroup_ID + "-" + x.MagicCulture_ID, x.MagicTemplateGroupLabel);
            }
            if (tabGroupLabelsNeeded.Any())
            {
                var tglabs = (from e in context.Magic_TemplateTabGroupLabels.Where(x => tabGroupLabelsNeeded.Contains(x.MagicTemplateTabGroup_ID) && applicationCultures.Contains(x.MagicCulture_ID))
                 select e).ToList();
                foreach(var x in tglabs) 
                    if (!this.labels.ContainsKey("tab-group-" + x.MagicTemplateTabGroup_ID + "-" + x.MagicCulture_ID))
                        this.labels.Add("tab-group-" + x.MagicTemplateTabGroup_ID + "-" + x.MagicCulture_ID, x.MagicTemplateTabGroupLabel);
            }
            Dictionary<int, string> res = new Dictionary<int, string>();
            foreach(var cultureId in applicationCultures) {
                this.currentCulture = cultureId;
                res.Add(cultureId, Utils.ReplaceTags(res1, null, "-#", "#-", ReplaceCultureTags));
            }

            return res;
        }

        private string ReplaceCultureTags(Match m)
        {
            if (this.labels.ContainsKey(m.Groups["name"].Value + "-" + this.currentCulture.ToString()))
                return this.labels[m.Groups["name"].Value + "-" + this.currentCulture.ToString()];
            else
                return this.labels[m.Groups["name"].Value];
        }

        private string ComposeElementscript(Data.Magic_TemplateDetails d, string templatetype)
        {

            string res1 = String.Empty;

            //Data.MagicDBDataContext context = new Data.MagicDBDataContext(MagicFramework.Helpers.SessionHandler.MagicDBConnectionString);
            //string label = (from e in context.Magic_ColumnLabels.Where(x => x.Magic_Column_ID == d.DetailInheritsFromColumn_ID && x.MagicCulture_ID == Helpers.SessionHandler.UserCulture)
            //              select e.ColumnLabel).FirstOrDefault();

            //var columnLabels = d.Magic_Columns.Magic_ColumnLabels.Where(x => applicationCultures.Contains(x.MagicCulture_ID) && x.Magic_Column_ID == d.Magic_Columns.MagicColumnID).FirstOrDefault();
            string label = "-#column-" + d.Magic_Columns.MagicColumnID + "#-";
            if (!this.labels.ContainsKey("column-" + d.Magic_Columns.MagicColumnID))
            {
                this.columnLabelsNeeded.Add(d.Magic_Columns.MagicColumnID);
                this.labels["column-" + d.Magic_Columns.MagicColumnID] = d.Magic_Columns.Columns_label;
            }

            if (templatetype == "POPUPEDITOR")
            {
                string datasource = String.Empty;
                //choose which template fits for this property 
                try
                {
                    res1 += CreateDetailTemplate(d, label);
                }
                catch (Exception e) {
                   MFLog.LogInFile("Detail not generated for column: " + d.Magic_Columns.ColumnName + " :: MSG: " + e.Message,MFLog.logtypes.ERROR );
                }
            }
            if (templatetype == "NAVIGATION" || templatetype == "NAVIGATIONPARTIAL")
            {
                switch (d.Magic_TemplateDataRoles.MagicTemplateDataRole)
                {
                    case "labelfield":
                        string column = String.Empty;
                        if (d.Magic_Columns.Schema_type == "date" && d.Magic_Columns.Schema_Format != null)
                            column = "kendo.format(\"{" + d.Magic_Columns.Schema_Format + "}\"," + d.Magic_Columns.ColumnName + "==null ? '' : " + d.Magic_Columns.ColumnName + ")";
                        else
                            if (d.Magic_Columns.Schema_type == "number" && d.Magic_Columns.Schema_Format != null)
                                column = "kendo.format(\"{" + d.Magic_Columns.Schema_Format + "}\"," + d.Magic_Columns.ColumnName + "==null ? '' : " + d.Magic_Columns.ColumnName + ")";
                            else
                                if (d.Magic_Columns.Columns_template != null)
                                {
                                    char trimch;
                                    trimch = '\'';
                                    column = d.Magic_Columns.Columns_template.Trim(trimch);
                                    column = column.Replace(trimch, ' ');
                                }
                                else
                                    column = d.Magic_Columns.ColumnName + "==null ? '' : " + d.Magic_Columns.ColumnName;
                        if (d.Magic_Columns.Columns_template != null)
                            res1 = "<li><label style=\"font-weight: bold; display: inline-block;width: 200px;font-style: normal;\">" + label + ":</label>" + column + "</li>";
                        else
                            res1 = "<li><label style=\"font-weight: bold; display: inline-block;width: 200px;font-style: normal;\">" + label + ":</label>#= " + column + "#</li>";
                        break;
                }
            }

            return res1;

        }

        public string CreateDetailTemplate(Data.Magic_TemplateDetails d, string label, string dataRoleHTML = null){
            string appendextraattribute = String.Empty;
            string line = String.Empty;

            //layer della colonna a cui il detail si riferisce
            string layerid = d.Magic_Columns.Layer_ID.ToString() == "" ? null : d.Magic_Columns.Layer_ID.ToString();
            if (layerid != null)
            {
                appendextraattribute = " MagicBOLayer_ID=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(layerid);
            }

            string dataRole = d.Magic_TemplateDataRoles.MagicTemplateDataRole;
            if (dataRole.StartsWith("searchgrid"))
                dataRole = "searchgrid";

            if (dataRoleHTML == null)
            {
                PrepareDataRoles();
                dataRoleHTML = GetTemplateContent(d.Magic_TemplateDataRoles.MagicTemplateDataRole);
            }

            switch (dataRole)
            {
                //case "labelfield":
                //    if (d.Magic_Columns.Schema_editable == false)
                //        appendextraattribute += " disabled ";
                //    if (d.DetailDOMID != null)
                //        appendextraattribute += " id=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailDOMID) + " ";
                //    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, label);
                //    res1 += line;
                //    break;
                case "dropdownlist":
                    if (d.CascadeColumn_ID != null && d.CascadeColumn_ID != 0 && d.CascadeFilterCol_ID != null && d.CascadeFilterCol_ID != 0)
                    {
                        appendextraattribute += " data-cascade-from=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.Magic_Columns2.Magic_TemplateDetails.FirstOrDefault().DetailDOMID);
                        appendextraattribute += " data-cascade-from-field=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.Magic_Columns3.ColumnName);
                      
                    }

                    if (d.Magic_Columns.Schema_required != null)
                        if ((bool)d.Magic_Columns.Schema_required)
                            appendextraattribute += " required";
                    if (d.Magic_Columns.Schema_editable == false)
                        appendextraattribute += " disabled ";
                    if (d.DetailonchangeFunctionName != null)
                        appendextraattribute += " data-change=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailonchangeFunctionName) + " ";
                    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, d.Magic_Columns.ColumnName, d.MagicDataSourceValueField, d.MagicDataSourceTextField, d.MagicDataSource, label, appendextraattribute, string.IsNullOrEmpty(d.DetailDOMID) ? d.Magic_Columns.ColumnName : d.DetailDOMID);
                    break;
                case "multiselect":
                    if (d.CascadeColumn_ID != null && d.CascadeColumn_ID != 0 && d.CascadeFilterCol_ID != null && d.CascadeFilterCol_ID != 0)
                    {
                        appendextraattribute += " data-cascade-from=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.Magic_Columns2.ColumnName);
                        appendextraattribute += " data-cascade-from-field=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.Magic_Columns3.ColumnName);
                    }

                    if (d.Magic_Columns.Schema_required != null)
                        if ((bool)d.Magic_Columns.Schema_required)
                            appendextraattribute += " required";
                    if (d.Magic_Columns.Schema_editable == false)
                        appendextraattribute += " disabled ";
                    if (d.DetailDOMID != null)
                        appendextraattribute += " id=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailDOMID) + " ";
                    if (d.DetailonchangeFunctionName != null)
                        appendextraattribute += " data-change=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailonchangeFunctionName) + " ";
                    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, d.Magic_Columns.ColumnName, d.MagicDataSourceValueField, d.MagicDataSourceTextField, d.MagicDataSource, label, appendextraattribute);
                    break;
                case "autocomplete":
                case "geoautocomplete":
                    string domid = d.Magic_Columns.ColumnName;
                    if (d.Magic_Columns.Schema_required != null)
                        if ((bool)d.Magic_Columns.Schema_required)
                            appendextraattribute += " required";
                    if (d.Magic_Columns.Schema_editable == false)
                        appendextraattribute += " disabled ";
                    if (d.DetailDOMID != null)
                        domid = d.DetailDOMID;
                    if (d.DetailonchangeFunctionName != null)
                        appendextraattribute += " data-change=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailonchangeFunctionName) + " ";
                    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, d.Magic_Columns.ColumnName, d.MagicDataSourceValueField, d.MagicDataSourceTextField, d.MagicDataSource, label, appendextraattribute,domid);
                    break;
                case "datepicker":
                case "timepicker":
                case "datetimepicker":
                    if (d.Magic_Columns.Schema_required != null)
                        if ((bool)d.Magic_Columns.Schema_required)
                            appendextraattribute += " required";
                    if (d.Magic_Columns.Schema_editable == false)
                        appendextraattribute += " disabled ";
                    if (d.DetailDOMID != null)
                        appendextraattribute += " id=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailDOMID) + " ";
                    if (d.DetailonchangeFunctionName != null)
                        appendextraattribute += " onchange=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailonchangeFunctionName + "(this);") + " ";
                    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, "date", label, appendextraattribute);
                    break;
                case "checkbox":
                    if (d.Magic_Columns.Schema_editable == false)
                        appendextraattribute += " disabled ";
                    if (d.DetailDOMID != null)
                        appendextraattribute += " id=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailDOMID) + " ";
                    if (d.DetailonchangeFunctionName != null)
                        appendextraattribute += " onclick=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailonchangeFunctionName + "(this);") + " ";
                    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, label, appendextraattribute);
                    break;
                case "number":
                    if (d.DetailonchangeFunctionName != null)
                        appendextraattribute += " onchange=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailonchangeFunctionName + "(this);") + " ";
                    if (d.Magic_Columns.Schema_editable == false)
                        appendextraattribute += " disabled ";
                    if (d.DetailDOMID != null)
                        appendextraattribute += " id=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailDOMID) + " ";
                    if (d.Magic_Columns.Schema_Numeric_min != null)
                        appendextraattribute += " min=" + d.Magic_Columns.Schema_Numeric_min.ToString();
                    if (d.Magic_Columns.Schema_Numeric_max != null)
                        appendextraattribute += " max=" + d.Magic_Columns.Schema_Numeric_max.ToString();
                    if (d.Magic_Columns.Schema_Numeric_step != null)
                        appendextraattribute += " step=" + decimal.Truncate((decimal)(d.Magic_Columns.Schema_Numeric_step)).ToString();
                    if (d.Magic_Columns.Schema_required != null)
                        if ((bool)d.Magic_Columns.Schema_required)
                            appendextraattribute += " required";
                    if (d.Magic_Columns.Schema_Format != null)
                    {
                        Regex re = new Regex(@"[cdn](\d+)");
                        Match match = re.Match(d.Magic_Columns.Schema_Format);
                        string format = d.Magic_Columns.Schema_Format;
                        if (format.StartsWith("0:"))
                            format = format.Replace("0:", String.Empty);
                        appendextraattribute += " data-format=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(format);
                        if (match.Success)
                            appendextraattribute += " data-decimals=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(match.Groups[1].Value);
                    }
                    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, label, appendextraattribute);
                    break;
                case "editor":
                    if (d.Magic_Columns.Schema_required != null)
                        if ((bool)d.Magic_Columns.Schema_required)
                            appendextraattribute += " required";
                    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, appendextraattribute);
                    break;
                case "textarea":
                    if (d.Magic_Columns.Schema_required != null)
                        if ((bool)d.Magic_Columns.Schema_required)
                            appendextraattribute += " required";
                    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, label,appendextraattribute);
                    break;
                case "adminareaupload":
                case "applicationupload":
                    string savepath = "";
                    string allowedfileextensions = "";
                    bool multiupload = false;

                    if (d.Magic_Columns.Upload_SavePath != null)
                        savepath = d.Magic_Columns.Upload_SavePath;

                    if (d.Magic_Columns.UploadAllowedFileExtensions != null)
                        allowedfileextensions = d.Magic_Columns.UploadAllowedFileExtensions;
                    else
                        allowedfileextensions = String.Empty;

                    if (!string.IsNullOrEmpty(allowedfileextensions))
                        allowedfileextensions = "." + allowedfileextensions.Replace("@", ",.");

                    if (d.Magic_Columns.Upload_Multi == true)
                        multiupload = true;

                    if (d.Magic_Columns.Schema_required != null && (bool)d.Magic_Columns.Schema_required)
                        appendextraattribute += " required";

                    if(d.Magic_TemplateDataRoles.MagicTemplateDataRole == "applicationupload")
                        line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, label, allowedfileextensions, savepath.Replace("\\", "/"), appendextraattribute, multiupload.ToString().ToLower());
                    else
                        line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, label, allowedfileextensions, savepath.Replace("\\", "/"), appendextraattribute);

                    break;
                case "searchgrid":
                    // d.Magic_Columns.ColumnName ==> InheritsFromColumn_ID
                    // d.Magic_Columns1.ColumnName ==> SearchGridDescColumn_ID
                    // d.Magic_Columns2.ColumnName ==> CascadeColumn_ID
                    // d.Magic_Columns3.ColumnNAme ==> CascadeFilterCol_ID
                    string searchgridname = null;
                    string searchgriddesccol = null;

                    if (d.Magic_Grids != null)
                    {
                        searchgridname = d.Magic_Grids.MagicGridName;
                        if (d.Magic_Columns1 != null)
                            searchgriddesccol = d.Magic_Columns1.ColumnName;
                    }

                    string cascadeFiltercol = null;
                    string cascadecol = null;
                    string operatorforCascadefilter = null; //caso stringa (Schema_type == null)
                    if (d.Magic_Columns2 != null)
                    {
                        operatorforCascadefilter = "contains"; //caso stringa (Schema_type == null)
                        if (d.Magic_Columns2.Schema_type != null || d.Magic_Columns2.Schema_type != "string")  // se non e' una stringa la colonna cascade
                            operatorforCascadefilter = "eq";
                        cascadecol = d.Magic_Columns2.ColumnName;
                        if (d.Magic_Columns3 != null)
                            cascadeFiltercol = d.Magic_Columns3.ColumnName;
                    }
                    if (d.Magic_Columns.Schema_required != null)
                        if ((bool)d.Magic_Columns.Schema_required)
                            appendextraattribute += " required";
                    if(d.Magic_TemplateDataRoles.MagicTemplateDataRole == "searchgrid_autocomplete" && string.IsNullOrEmpty(d.MagicDataSource))
                        appendextraattribute += " data-bind=\"value:" + d.MagicDataSourceTextField + "\"";
                    //add both the function name and the change event beacause of JS problems to trigger the event form searchgrid
                    if (!String.IsNullOrEmpty(d.DetailonchangeFunctionName))
                        if (d.Magic_TemplateDataRoles.MagicTemplateDataRole == "searchgrid_autocomplete")
                            appendextraattribute += " changefunctionname=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailonchangeFunctionName) + " onchange=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailonchangeFunctionName + "(this); ");
                        else
                            appendextraattribute += " changefunctionname=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailonchangeFunctionName);
                    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, label, d.MagicDataSourceTextField, searchgridname, searchgriddesccol, cascadecol, cascadeFiltercol, operatorforCascadefilter, appendextraattribute, d.MagicDataSourceValueField, d.Magic_Grids.FromTable);
                    break;
                case "detailgrid":
                    string bindedgridFilter = d.Magic_TemplateGroups1.BindedGridFilter;
                    if (d.Magic_TemplateGroups1.BindedGridFilter == null)
                        bindedgridFilter = string.Empty;

                    line = String.Format(dataRoleHTML, d.Magic_TemplateGroups1.Magic_Grids.MagicGridName, d.Magic_TemplateGroups1.MagicTemplateGroupLabel, Utils.Base64Encode(bindedgridFilter)).DoubleToSingleCurly();
                    break;
                default:
                    if (d.Magic_Columns.Schema_required != null)
                        if ((bool)d.Magic_Columns.Schema_required)
                            appendextraattribute += " required";
                    if (d.Magic_Columns.Schema_editable == false)
                        appendextraattribute += " disabled ";
                    if (d.DetailDOMID != null)
                        appendextraattribute += " id=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailDOMID) + " ";
                    if (d.Magic_Columns.StringLength != null)
                        appendextraattribute += " maxlength=" + d.Magic_Columns.StringLength.ToString();
                    if (d.DetailonchangeFunctionName != null)
                        appendextraattribute += " onchange=" + MagicFramework.Helpers.Utils.SurroundWithDoubleQuotes(d.DetailonchangeFunctionName + "(this);") + " ";

                    line = String.Format(dataRoleHTML, d.Magic_Columns.ColumnName, label, appendextraattribute);
                    break;
            }
            return line;
        }
        public Dictionary<string,string> GetTemplateListContent(List<string> dataroles)
        {
            Dictionary<string, string> templates = new Dictionary<string,string>();
            this.PrepareDataRoles();
            foreach (var dr in dataroles)
                templates.Add(dr, this.dataRolesInfo[dr].Content);
            return templates;
        }
        public string GetTemplateContent(string name)
        {
            try
            {
                return this.dataRolesInfo[name].Content;
            }
            catch (Exception e)
            {
                MFLog.LogInFile("MagicFramework.Helpers.TemplateContainerBuilder@GetTemplateContent: " + e.Message, MFLog.logtypes.ERROR);
                return "";
            }
        }

        /// <summary>
        /// Sets the HasOverrides flag in the Magic_FunctionsTemplates table
        /// </summary>
        /// <param name="functionID"></param>
        public static void setOverrideFlag(int functionID, int templateID)
        {
            if (functionID != -1)
            {
                Data.MagicDBDataContext context = new Data.MagicDBDataContext(DBConnectionManager.GetMagicConnection());

                var templateDetailOverrides = (from e in context.Magic_TemplateDetailsFunctionOverrides
                                               where e.Function_ID == functionID && e.Magic_TemplateDetails.MagicTemplate_ID == templateID
                                               select e).Count();

                var templateGroupOverrides = (from e in context.Magic_TemplateGroupsFunctionOverrides
                                              where e.Function_ID == functionID && e.Magic_TemplateGroups.MagicTemplate_ID == templateID
                                              select e).Count();

                var functionTemplates = (from e in context.Magic_FunctionsTemplates
                                         where e.MagicFunction_ID == functionID && e.MagicTemplate_ID == templateID
                                         select e).FirstOrDefault();

                if (functionTemplates != null)
                {
                    if ((templateDetailOverrides + templateGroupOverrides) == 0)
                    {
                        functionTemplates.HasOverrides = false;
                    }
                    else
                    {
                        functionTemplates.HasOverrides = true;
                    }

                    context.SubmitChanges();
                }
            }
        }

        public string CreateAndBufferScript(Data.Magic_Templates ele, int? functionid, int? layerid, bool hasoverrides)
        {
            List<Data.Magic_TemplateGroupsFunctionOverrides> allgroupover = null;
            List<Data.Magic_TemplateDetailsFunctionOverrides> alldetailover = null;

            if (functionid != null)
            {
                allgroupover = (from e in context.Magic_TemplateGroupsFunctionOverrides.Where(x => x.Function_ID == functionid) select (e)).ToList();
                alldetailover = (from e in context.Magic_TemplateDetailsFunctionOverrides.Where(x => x.Function_ID == functionid) select (e)).ToList();
            }

            List<Data.Magic_TemplateGroups> templateGroups;
            if (ele.BaseGrid_ID != null && ele.Magic_Grids.EditableTemplate == ele.MagicTemplateName && !string.IsNullOrEmpty(ele.Magic_Grids.DetailTemplate))
            {
                int detailTemplateId = context.Magic_Templates.Where(t => t.MagicTemplateName == ele.Magic_Grids.DetailTemplate).FirstOrDefault().MagicTemplateID;
                templateGroups = context.Magic_TemplateGroups.Where(x => x.MagicTemplate_ID == ele.MagicTemplateID || (x.MagicTemplate_ID == detailTemplateId && x.IsVisibleInPopUp == true && x.Magic_TemplateGroupContent != null)).ToList();
            }
            else
            {
                templateGroups = ele.Magic_TemplateGroups.Where(x => x.MagicTemplate_ID == ele.MagicTemplateID && x.Magic_TemplateGroupContent != null).ToList();
            }
            var translatedScripts = CreateKendoTemplateScript(ele,
                                                templateGroups,
                                                ele.Magic_TemplateDetails.Where(x => x.MagicTemplate_ID == ele.MagicTemplateID).ToList(),
                                                allgroupover,
                                                alldetailover, layerid);

            //delete old buffers
            var buffersToDelete = (from e in context.Magic_TemplateScriptsBuffer where e.Magic_Template_ID == ele.MagicTemplateID select e);
            context.Magic_TemplateScriptsBuffer.DeleteAllOnSubmit(buffersToDelete);

            DateTime now = DateTime.Now;
            //add newly created buffers
            foreach (var cultureId in applicationCultures)
            {
                var addelement = new Data.Magic_TemplateScriptsBuffer();
                addelement.Magic_Script = translatedScripts[cultureId];
                addelement.Magic_Culture_ID = cultureId;
                addelement.Magic_Template_ID = ele.MagicTemplateID;
                addelement.Created = now;
                if (functionid != null && (hasoverrides || layerid != null))
                    addelement.Magic_Function_ID = functionid;
                ele.Magic_TemplateScriptsBuffer.Add(addelement);
            }

            context.SubmitChanges();
            return translatedScripts[SessionHandler.UserCulture];
        }

        public void PrepareDataRoles()
        {
            if (this.dataRolesInfo == null) {
                this.UpdateDataRoles();
            }
        }

        public static string GetDefaultDatarolesPath(string basePath = null)
        {
            if(basePath == null)
                basePath = Utils.GetBasePath();
            return basePath + @"Magic\Views\Templates\DataRoles\";
        }

        public static string GetCustomDatarolesPath(string basePath = null)
        {
            if (basePath == null)
                basePath = Utils.GetBasePath();
            return basePath + @"Views\" + SessionHandler.CustomFolderName + @"\Templates\DataRoles\";
        }

        public void UpdateDataRoles()
        {
            Dictionary<string, FileInfo> info = new Dictionary<string, FileInfo>();
            string basePath = Utils.GetBasePath();
            string defaultPath = GetDefaultDatarolesPath(basePath);
            string customPath = GetCustomDatarolesPath(basePath);
            if (Directory.Exists(customPath))
            {
                foreach (var datarolePath in Directory.EnumerateFiles(customPath, "*.html"))
                {
                    info.Add(Path.GetFileNameWithoutExtension(datarolePath), new FileInfo { Path = datarolePath });
                }
            }
            foreach (var datarolePath in Directory.EnumerateFiles(defaultPath, "*.html"))
            {
                string datarole = Path.GetFileNameWithoutExtension(datarolePath);
                if (!info.ContainsKey(datarole))
                    info.Add(datarole, new FileInfo { Path = datarolePath });
            }
            this.dataRolesInfo = info;
        }

        public DateTime GetLastWriteForNeededDataroles(int magicTemplateId, List<KeyValuePair<int, string>> dataRoles, List<KeyValuePair<int, string>> dataRolesOverwrites)
        {
            var tempaltesNeeded = dataRoles.Select(x=> x.Value).Union(dataRolesOverwrites.Select(y=> y.Value)).Distinct().ToList();
            PrepareDataRoles();
            if (tempaltesNeeded.Count > 0)
                return this.dataRolesInfo.Where(_ => tempaltesNeeded.Contains(_.Key)).OrderByDescending(_ => _.Value.LastModified).FirstOrDefault().Value.LastModified;
            else
                return DateTime.MinValue;
        }

        private void Prepare()
        {
            if(applicationCultures == null)
            {
                this.applicationCultures = this.context.Magic_ManagedCultures.Where(_ => _.Magic_CultureID != SessionHandler.UserCulture).Select(_ => _.Magic_CultureID).ToList();
                this.applicationCultures.Add(SessionHandler.UserCulture);
            }
        }

        public class FileInfo
        {
            public string Path { get; set; }
            private DateTime _LastModified { get; set; }
            public DateTime LastModified {
                get
                {
                    if (this._LastModified == DateTime.MinValue)
                        this._LastModified = File.GetLastWriteTime(this.Path);
                    return this._LastModified;
                }
                set
                {
                    this._LastModified = value;
                }
            }
            private string _Content { get; set; }
            public string Content {
                get {
                    if (this._Content == null)
                        this._Content = File.ReadAllText(this.Path);
                    return this._Content;
                }
                set {
                    this._Content = value;
                }
            }
        }
    }
}
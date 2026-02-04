using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Reflection;
using System.IO;
using System.Diagnostics;

namespace MagicFramework.Helpers
{
    public  class DatabaseEntityAutomations
    {
        private dynamic data { get; set; }
        private string tablename { get; set; }
        public DatabaseEntityAutomations(dynamic data, string tablename)
        {
            this.tablename = tablename;
            this.data = data;
        }
        /// <summary>
        /// sono delle automazioni fatte sulla base degli entityname nelle POSTI e nelle POSTU e nelle PostD
        /// </summary>
        private static readonly Dictionary<string, string> automationMethods = new Dictionary<string, string> 
        {
           { "dbo.Magic_BusinessObjectTypes","FillMagicGridNameFromID" },
           { "dbo.Magic_WorkFlowActivities","FillFunctionGUIDFromID" },
           { "dbo.Magic_DashboardCharts","FillFunctionGUIDFromID" },
           { "dbo.Magic_DashBoardIndicators","FillFunctionGUIDFromID" },
           { "dbo.Magic_TemplateTabGroups","CleanTemplateScriptBuffers"},
           { "dbo.Magic_TemplateGroupLayers","FillTemplateGroupGUIDFromID"},
           { "dbo.V_Magic_TemplateGroupLayers", "CleanTemplateScriptBuffers"},
           { "dbo.Magic_EntitiesVsbltyRules", "ClearEntityVisibilityRulesCache"},
           { "USERFIELDS.V_MagicUserFieldsConfig", "FillTemplateGroupGUIDFromID"}

        };

        private readonly Dictionary<string, string> externalAssemblies = new Dictionary<string, string> 
        { 
            {@"bin\Ref3.dll" , "Ref3.Data.DatabaseEntityAutomations"} 
        };
        #region dbconnection
        /// <summary>
        /// Look up for DatabaseEntityAutomations Config tables defined in external dlls (eg. RefTree) 
        /// </summary>
        /// <param name="tablename"></param>
        /// <returns></returns>
        public  bool lookUpForExternalConfigTables()
        {
            try
            {
                foreach (var ext_assembly in this.externalAssemblies)
                {
                    Assembly targetassembly = System.Reflection.Assembly.LoadFile(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ext_assembly.Key));
                    Type t = targetassembly.GetType(ext_assembly.Value);
                    object obj = t.GetField("ConfigTables").GetValue(null);
                    HashSet<string> tables = obj as HashSet<string>;
                    object classInstance = Activator.CreateInstance(t, null);
                    if (tables.Contains(this.tablename))
                        return true;
                }
            }
            catch (Exception ex)
            {
                MFLog.LogInFile("lookUpForExternalConfigTables:" + ex.Message, MFLog.logtypes.WARN);
                return false;
            }
            return false;
        }
        #endregion
        #region automation
        /// <summary>
        /// This runs a method in order to integrate the data from the browser with other info
        /// </summary>
        /// <param name="data">the dynamic object with grid or client data</param>
        /// <param name="tablename">the entity under the grid</param>
        public void InvokeAutomation()
        {
            //if an automation exists in MagicFramework
            if (automationMethods.ContainsKey(tablename))
            {
                string methodName = automationMethods[this.tablename];
                //Get the method information using the method info class
                MethodInfo mi = this.GetType().GetMethod(methodName);
                //Invoke the method
                // (null- no parameter for the method call
                // or you can pass the array of parameters...)
                mi.Invoke(this, new[] { this.data });
            }
            //search for automations form other dlls 
            foreach (var ext_assembly in this.externalAssemblies)
            {
                Assembly targetassembly = System.Reflection.Assembly.LoadFile(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ext_assembly.Key));
                Type t = targetassembly.GetType(ext_assembly.Value);
                object obj = t.GetField("automationMethods").GetValue(null);
                Dictionary<string, string> meths = obj as Dictionary<string, string>;
                object classInstance = Activator.CreateInstance(t, null);
                if (meths.ContainsKey(tablename))
                {
                    string methodName = meths[this.tablename];
                    //external method
                    MethodInfo mi_EX = classInstance.GetType().GetMethod(methodName);
                    mi_EX.Invoke(classInstance, new[] { this.data });
                }
            }

        }
        public void FillTemplateGroupGUIDFromID(dynamic input)
        {
            int id = 0;
            if (input.TemplateGroup_ID != null)
                id = input.TemplateGroup_ID;
            if (id != 0)
                input.TemplateGroupGUID = Models.Magic_TemplateGroups.GetGUIDFromID(id);
        }
        public void CleanTemplateScriptBuffers(dynamic input)
        {
            int id = 0;
            if (input.MagicTemplateTabGroupID != null)
            { 
                id = input.MagicTemplateTabGroupID;
                if (id!=0)
                 Models.Magic_Grids.DeleteTemplateScritpsBuffersOnChangeTabGroup(id);
            }
            if (input.MagicTemplateGroupID != null)
            {
                id = input.MagicTemplateGroupID;
                if (id!=0)
                 Models.Magic_Grids.DeleteTemplateScritpsBuffersOnChangeTemplateGroup(id);
            }
        }


        /// <summary>
        /// Called by reflection for particular entities which are contained in automationMethods Dictionary
        /// </summary>
        /// <param name="input"></param>
        public void FillMagicGridNameFromID(dynamic input)
        {
            int id = 0;
            if (input.MagicGrid_Id != null)
                id = input.MagicGrid_Id;
            if (input.MagicGrid_ID != null)
                id = input.MagicGrid_ID;
            if (id == 0)
            {
                input.MagicGridName = null;
                return;
            }
            input.MagicGridName = Models.Magic_Grids.GetGridNameFromID(id);
        }
        /// <summary>
        /// Called by reflection for particular entities which are contained in automationMethods Dictionary
        /// </summary>
        /// <param name="input"></param>
        public void FillFunctionGUIDFromID(dynamic input)
        {
            int id = 0;
            if (input.MagicFunction_ID != null)
                id = input.MagicFunction_ID;
            if (input.Function_ID != null)
                id = input.Function_ID;
            if (input.ProcessFunction_ID != null)
                id = input.ProcessFunction_ID;
            if (id == 0)
            {
                input.FunctionGUID = null;
                return;
            }
            input.FunctionGUID = Models.Magic_Functions.GetGUIDFromID(id);
        }
        public void ClearEntityVisibilityRulesCache(dynamic input)
        {
            CacheHandler.EmptyCacheForPrefix(CacheHandler.EntityVisibilityRules);
        }
        #endregion
    }
}
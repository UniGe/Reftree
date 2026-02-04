<%@ Page Title="" MasterPageFile="~/Webarch.Master" Inherits="MagicFramework.Helpers.PageBase" %>
<asp:Content ID="Content1" ContentPlaceHolderID="head" runat="server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="ContentPlaceHolder1" runat="server">
    
<div id="functiontree" class="k-content">
    <div class="headSelector">
        <input id="functionselector" style="width:300px;" data-option-label="Please Select a function..." data-index=1 data-value-field="FunctionID" data-text-field="FunctionName" data-source="functionds" data-role="dropdownlist" data-change="rebindtree" />
    </div>
    <div class="bodySelector">
        <div class="demo-section files">
            <h4><span data-bind="text: name"></span></h4>
            <div id="newRootItem">
                <img class="k-image" alt="" src="/Magic/Styles/Images/tree.png"> ROOT ELEMENT ADMIN
                <%--<span class="treeButton"><a class="k-button" id="root">
                    <span class="k-icon k-add"></span>
                </a>
                </span>--%>
            </div>
            <div id ="thefunctiontree" data-role="treeview"
               <%-- data-template ="treeview-template"--%>
                data-drag-and-drop="true"
                data-drop="onDrop"
                data-dragstart="onDragStart"
                data-text-field="name"
                data-bind="source: files"></div>
        
        </div>

        <div class="demo-section current-state">
            <h4>Current view model state:</h4>
            <pre>
{
    name: <span data-bind="text: name"></span>,
    files: <span data-bind="text: printFiles"></span>
}
            </pre>
        </div>
    </div>


    <div id="modalRootElementAdmin" class="k-popup-edit-form k-window-content k-content"></div>
    <div id="modalEditTemplate" class="k-popup-edit-form k-window-content k-content"></div>
    <div id="modalDetailTemplate" class="k-popup-edit-form k-window-content k-content"></div>
    <div id="modalGridElementEdit" class="k-popup-edit-form k-window-content k-content"></div>
    <div id="ColumnEditTemplate" class="k-popup-edit-form k-window-content k-content"></div>
    <div id="ColumnEditableTemplate" class="k-popup-edit-form k-window-content k-content"></div>

    <script id="treeview-template" type="text/kendo-ui-template">
            #: item.name #
        # if (item.type == "GRID" && item.parenttabid!="-1")  { #
             <span class="treeButton">
                <a class="enableTab k-button k-button-icontext" href="\#" onclick="OverrideTemplateGroup(this,true);"><span class="k-icon k-add"></span></a>
                <a class="editGrid k-button k-button-icontext" href="\#" onclick="editGrid(this);"><span class="k-icon k-edit"></a>
                <a class="deleteGrid k-button k-button-icontext" href="\#" onclick="removeordisableGrid(this);"><span class="k-icon k-delete"></span></a>
          </span>  
          # } #
            # if (item.type == "GRID" && item.parenttabid=="-1") { #
             <span class="treeButton">
                <a class="editGrid k-button k-button-icontext" href="\#" onclick="editGrid(this);"><span class="k-icon k-edit"></a>
                <a class="deleteGrid k-button k-button-icontext" href="\#" onclick="removeordisableGrid(this);"><span class="k-icon k-delete"></span></a>
          </span>  
          # } #
           # if (item.type == "COLUMN") { #
          <span class="treeButton">
                <a class="enableColumn k-button k-button-icontext" href="\#" onclick="makeColumnVisible(this,true);"><span class="k-icon k-add"></span></a>
                <a class="editColumn k-button k-button-icontext" href="\#" onclick="editColumn(this);"><span class="k-icon k-edit"></a>
                <a class="deleteColumn k-button k-button-icontext" href="\#" onclick="makeColumnVisible(this,false);"><span class="k-icon k-delete"></span></a>
          </span>  
          # } #
        # if (item.type == "POPUPEDITOR") { #
          <span class="treeButton">
                <a class="addTab k-button k-button-icontext" href="\#" onclick="addTab(this);" ><span class="k-icon k-add"></span></a>
                <a class="removeTemplate k-button k-button-icontext" href="\#" ><span class="k-icon k-delete"></span></a>
          </span>  
          # } #
         # if (item.type == "FIELDEDITLIST") { #
          <span class="treeButton">
                <a class="enableTab k-button k-button-icontext" href="\#" onclick="OverrideTemplateGroup(this,true);"><span class="k-icon k-add"></span></a>
                <a class="disabletab k-button k-button-icontext" href="\#" onclick="OverrideTemplateGroup(this,false);"><span class="k-icon k-delete"></span></a>
          </span>  
          # } #
         # if (item.type == "FIELDLABELLIST") { #
          <span class="treeButton">
                <a class="enableTab k-button k-button-icontext" href="\#" onclick="OverrideTemplateGroup(this,true);"><span class="k-icon k-add"></span></a>
                <a class="disabletab k-button k-button-icontext" href="\#" onclick="OverrideTemplateGroup(this,false);"><span class="k-icon k-delete"></span></a>
          </span>  
          # } #
         # if (item.type == "COLUMNEDIT") { #
          <span class="treeButton">
                <a class="enableColumnEdit k-button k-button-icontext" href="\#" onclick="makeDetailVisible(this,true);"><span class="k-icon k-add"></span></a>
                <a class="editColumnEdit k-button k-button-icontext" href="\#" onclick="editColumnEdit(this);"><span class="k-icon k-edit"></a>
                <a class="disableColumnEdit k-button k-button-icontext" href="\#" onclick="makeDetailVisible(this,false);" ><span class="k-icon k-delete"></span></a>
          </span>  
          # } #
        # if (item.type == "NAVIGATION") { #
          <span class="treeButton">
                <a class="addElement k-button k-button-icontext" href="\#" onclick="addElement(this);"><span class="k-icon k-add"></span></a>
                <a class="removeDetailTemplate k-button k-button-icontext" href="\#"><span class="k-icon k-delete"></span></a>
          </span>  
          # } #
        </script>
    <!--template per root element-->
    <script type="text/x-kendo-template" id="SelectRootElement">
        <div class="k-edit-form-container">
            <div id="tabstrippopupSelectRootElement" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Select Root Element</li>
                </ul>
                <div>
                    <div class="k-edit-label"><label for="Root_element">Root Element</label></div>
                    <div class="k-edit-field"><input name="Root_element" data-source="['Grid']" data-option-label="N/A"  data-role="dropdownlist" id="Root_elementdd" data-change="loadContentRoot"/></div>             
                </div>
            </div>
        </div>
    </script>

    <script type="text/x-kendo-template" id="RootElementGrid">
        <div class="k-edit-form-container">
            <div id="tabstrippopupRootElementGrid" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Grid</li>
                </ul>
                <div>
                    <div class="modalEditSectionLabel">Select Grid:</div>
                    <div class="modalEditSection">
                        <div class="k-edit-label"><label for="MagicGridID">Grid</label></div>
                        <div class="k-edit-field"><input name="MagicGridID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicGridID" data-text-field="MagicGridName" data-source="Magic_Gridsds" data-role="dropdownlist" id="Magic_RootElementGrid_Gridsdd" data-change="getGridDataRoot" /></div>
                       <div class="k-edit-label"><label for="htmldiv">Append To HTML Div ID</label></div>
                        <div class="k-edit-field"><input name="htmldiv" placeholder="Insert div id..." type="text" id="htmldiv" /></div>
                  
                    </div>              
                    <div class="modalEditSectionLabel">Overrides:</div>
                    <div class="modalEditSection">
                         <div class="k-edit-label"><label for="MagicDataSource_ID">Data Source</label></div>
                        <div class="k-edit-field"><input name="MagicDataSource_ID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicDataSourceID" data-text-field="Name" data-source="Magic_DataSourceds" data-role="dropdownlist" id="Magic_RootElementGrid_DataSourcedd" /></div>
                        <div class="k-edit-label"><label for="MagicGridColumnsCommand" style="color: black;">Colums command</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Edit" data-bind="checked:Edit" id="Edit" onclick="appendcommandtext(this, 'edit', 'Custom_Command');" >Edit</span>
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Destroy" data-bind="checked:Destroy" id="Destroy" onclick="appendcommandtext(this, 'destroy', 'Custom_Command');" >Destroy</span>
                        </div>
                        <div class="k-edit-field">Custom command<textarea id="Custom_Command" rows="4" cols="20" name="Custom_command"  data-bind="value:Custom_command" class="k-input k-textbox" /></div>
                        <div class="k-edit-label"><label for="Sortable" style="color: black;">Sortable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Sortable" data-bind="checked:Sortable" id="Sortable" >Sortable</span>
                        </div>
                        <div class="k-edit-label"><label for="Groupable" style="color: black;">Groupable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Groupable" data-bind="checked:Groupable" id="Groupable" >Groupable</span>
                        </div>
                        <div class="k-edit-label"><label for="Editable" style="color: black;">Editable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="radio" class="k-checkbox" name="Editable" data-bind="checked:No" id="No" >No</span>
                            <span class="spaceRight"><input type="radio" class="k-checkbox" name="Editable" data-bind="checked:Input" id="Inline" >Inline</span>
                            <span class="spaceRight"><input type="radio" class="k-checkbox" name="Editable" data-bind="checked:Popup" id="Popup" >Popup</span>
                        </div>
                        <div class="k-edit-label"><label for="Toolbar" style="color: black;">Toolbar</label></div>                
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="New" data-bind="checked:New" id="New" onclick="appendtoolbartext(this,'create','Custom_toolbar');" >New</span>
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Save" data-bind="checked:Save" id="Save" onclick="appendtoolbartext(this,'save','Custom_toolbar');" >Save</span>
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Cancel" data-bind="checked:Cancel" id="Cancel" onclick="appendtoolbartext(this,'cancel','Custom_toolbar');" >Cancel</span>
                        </div>
                        <div class="k-edit-field">Custom toolbar<textarea rows="4" cols="20" id="Custom_toolbar" name="Custom_toolbar"  data-bind="value:Custom_toolbar" class="k-input k-textbox" /></div>
                        <div class="k-edit-label"><label for="MagicTemplateID">Detail template</label></div>
                        <div class="k-edit-field"><input name="MagicTemplateID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicTemplateID" data-text-field="MagicTemplateName" data-source="Magic_Templatesds" data-role="dropdownlist" id="Magic_RootElementGrid_DetailTemplatesdd" /></div>
                        <div class="k-edit-label"><label for="MagicTemplateID">Editable template</label></div>
                        <div class="k-edit-field"><input name="MagicTemplateID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicTemplateID" data-text-field="MagicTemplateName" data-source="Magic_Templatesds" data-role="dropdownlist" id="Magic_RootElementGrid_EditableTemplatesdd" /></div>
                    </div>
                </div>
            </div>

            <div class="k-edit-buttons k-state-default">
                <a  class="k-button k-button-icontext k-grid-update"  onclick="InsertGridInFunction(this);" href="\#"><span class="k-icon k-update"></span>Update</a>
                <a class="k-button k-button-icontext k-grid-cancel" onclick="closeWin('modalRootElementAdmin');" href="\#"><span class="k-icon k-cancel"></span>Cancel</a>
            </div>
        </div>
         
    </script>

    <script type="text/x-kendo-template" id="RootElementTemplate">
        <div class="k-edit-form-container">
            <div id="tabstrippopupRootElementTemplate" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Template</li>
                </ul>
                <div>
                    <div class="modalEditSectionLabel">Template selection:</div>
                    <div class="modalEditSection">
                        <div class="k-edit-label"><label for="MagicTemplateID">Template</label></div>
                        <div class="k-edit-field"><input name="MagicTemplateID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicTemplateID" data-text-field="MagicTemplateName" data-source="Magic_Templatesds" data-role="dropdownlist" id="Magic_RootElementTemplate_Templatesdd" /></div>
                    </div> 
                </div>
            </div>

            <div class="k-edit-buttons k-state-default">
                <a class="k-button k-button-icontext k-grid-update" href="\#"><span class="k-icon k-update"></span>Update</a>
                <a class="k-button k-button-icontext k-grid-cancel" onclick="closeWin('modalRootElementAdmin');" href="\#"><span class="k-icon k-cancel"></span>Cancel</a>
            </div>
        </div>
         
    </script>

    <!--template for grid column edit-->
    <script type="text/x-kendo-template" id="ColumnEdit">
        <div class="k-edit-form-container">
            <div id="tabstrippopupColumnEdit" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Column</li>
                </ul>
                <div>           
                    <div class="modalEditSectionLabel">Column cross function settings:</div>
                    <div class="modalEditSection">
                         <div class="k-edit-field">Column html template<textarea rows="4" cols="20" id="Column_template" name="Column_template"  class="k-input k-textbox" /></div>
                        <div class="k-edit-label"><label for="IsNullable" style="color: black;">Is Nullable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="IsNullable"  id="IsNullable" ></span>
                        </div>
                        <div class="k-edit-label"><label for="Required" style="color: black;">Required</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Required"  id="Required" ></span>
                        </div>
                        <div class="k-edit-label"><label for="Editablecol" style="color: black;">Editable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Editablecol"  id="Editablecol" ></span>
                        </div>
                        <div class="k-edit-label"><label for="PrimaryKey" style="color: black;">PrimaryKey</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="PrimaryKey"  id="PrimaryKey" ></span>
                        </div>
                    </div>  
                    <div class="modalEditSectionLabel">Function Overrides:</div>
                    <div class="modalEditSection">
                         <div class="k-edit-field">Filter<textarea rows="4" cols="20" id="Filter" name="Filter"   class="k-input k-textbox" /></div>
                         <div class="k-edit-field">Default Value<textarea rows="4" cols="20" id="Filter" name="DefaultValue"   class="k-input k-textbox" /></div>
                     </div>
                </div>
            </div>

            <div class="k-edit-buttons k-state-default">
                <a class="k-button k-button-icontext k-grid-update" onclick="UpdateColumn(this);" href="\#"><span class="k-icon k-update"></span>Update</a>
                <a class="k-button k-button-icontext k-grid-cancel" onclick="closeWin('ColumnEditTemplate');" href="\#"><span class="k-icon k-cancel"></span>Cancel</a>
            </div>
        </div>
         
    </script>
     <!--template for grid column edit-->
    <script type="text/x-kendo-template" id="ColumnEditable">
        <div class="k-edit-form-container">
            <div id="tabstrippopupColumnEditable" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Column</li>
                </ul>
                <div>           
                    <div class="modalEditSectionLabel">Column edit cross function settings:</div>
                    <div class="modalEditSection">
                          <div class="k-edit-label"><label for="controller">Controller name (without suffix)</label></div>
                          <div class="k-edit-field"><input name="controller" placeholder="Insert controller name..." type="text" id="controller" /></div>
                          <div class="k-edit-label"><label for="textfield">Text Field from Controller </div>
                          <div class="k-edit-field"><input name="textfield" placeholder="Insert text field name..." type="text" id="textfield" /></div>
                          <div class="k-edit-label"><label for="valuefield">Value Field from Controller </div>
                          <div class="k-edit-field"><input name="valuefield" placeholder="Insert value field name..." type="text" id="valuefield" /></div>
                    </div> 
                    <div class="modalEditSectionLabel">Column edit overrides:</div>
                    <div class="modalEditSection">
                         <div class="k-edit-label"><label for="datarole">Edit widget</label></div>
                         <div class="k-edit-field"><input name="datarole" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicTemplateDataRoleID" data-text-field="MagicTemplateDataRole" data-source="Magic_TemplateDataRolesds" data-role="dropdownlist" id="Magic_TemplateDataRolesdd" /></div>
                    </div> 
                  </div>
            </div>

            <div class="k-edit-buttons k-state-default">
                <a class="k-button k-button-icontext k-grid-update" onclick="UpdateColumnEditable(this);" href="\#"><span class="k-icon k-update"></span>Update</a>
                <a class="k-button k-button-icontext k-grid-cancel" onclick="closeWin('ColumnEditableTemplate');" href="\#"><span class="k-icon k-cancel"></span>Cancel</a>
            </div>
        </div>
         
    </script>

    <!--template per root element edit-->
    <script type="text/x-kendo-template" id="GridEdit">
        <div class="k-edit-form-container">
            <div id="tabstrippopupGridElementEdit" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Grid</li>
                </ul>
                <div>           
                    <div class="modalEditSectionLabel">Overrides:</div>
                    <div class="modalEditSection">
                         <div class="k-edit-label"><label for="MagicDataSource_ID">Data Source</label></div>
                        <div class="k-edit-field"><input name="MagicDataSource_ID" data-bind="value:datasourceid" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicDataSourceID" data-text-field="Name" data-source="Magic_DataSourceds" data-role="dropdownlist" id="Magic_EditDataSourcedd" /></div>
                        <div class="k-edit-label"><label for="MagicGridColumnsCommand" style="color: black;">Colums command</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Edit" data-bind="checked:Edit" id="Edited" onclick="appendcommandtext(this, 'edit', 'Custom_Commanded');" >Edit</span>
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Destroy" data-bind="checked:Destroy" id="Destroyed" onclick="appendcommandtext(this, 'destroy', 'Custom_Commanded');">Destroy</span>
                        </div>
                        <div class="k-edit-field">Custom command<textarea rows="4" cols="20" id="Custom_Commanded" name="Custom_command"  data-bind="value:commandscolumn" class="k-input k-textbox" /></div>
                        <div class="k-edit-label"><label for="Sortable" style="color: black;">Sortable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Sortable" data-bind="checked:sortable" id="Sortableed" >Sortable</span>
                        </div>
                        <div class="k-edit-label"><label for="Groupable" style="color: black;">Groupable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Groupable" data-bind="checked:groupable" id="Groupableed" >Groupable</span>
                        </div>
                        <div class="k-edit-label"><label for="Editable" style="color: black;">Editable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="radio" class="k-checkbox" name="Editable" data-bind="checked:No" id="Noed" >No</span>
                            <span class="spaceRight"><input type="radio" class="k-checkbox" name="Editable" data-bind="checked:Input" id="Inlineed" >Inline</span>
                            <span class="spaceRight"><input type="radio" class="k-checkbox" name="Editable" data-bind="checked:Popup" id="Popuped" >Popup</span>
                        </div>
                        <div class="k-edit-label"><label for="Toolbar" style="color: black;">Toolbar</label></div>                
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="New" data-bind="checked:New" id="Newed" onclick="appendtoolbartext(this,'create','Custom_toolbared');" >New</span>
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Save" data-bind="checked:Save" id="Saveed" onclick="appendtoolbartext(this,'save','Custom_toolbared');">Save</span>
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Cancel" data-bind="checked:Cancel" id="Canceled" onclick="appendtoolbartext(this,'cancel','Custom_toolbared');" >Cancel</span>
                        </div>
                        <div class="k-edit-field">Custom toolbar<textarea rows="4" cols="20" id="Custom_toolbared" name="Custom_toolbar"  data-bind="value:toolbar" class="k-input k-textbox" /></div>
                        <div class="k-edit-label"><label for="MagicTemplateID">Detail template</label></div>
                        <div class="k-edit-field"><input name="MagicTemplateID" data-bound="selectFirst" data-bind="value:detailtemplate"  data-option-label="N/A" data-value-field="MagicTemplateID" data-text-field="MagicTemplateName" data-source="Magic_Templatesds" data-role="dropdownlist" id="Magic_EditDetailTemplatesdd" /></div>
                        <div class="k-edit-label"><label for="MagicTemplateID">Editable template</label></div>
                        <div class="k-edit-field"><input name="MagicTemplateID" data-bound="selectFirst" data-bind="value:editabletemplate" data-option-label="N/A" data-value-field="MagicTemplateID" data-text-field="MagicTemplateName" data-source="Magic_Templatesds" data-role="dropdownlist" id="Magic_EditEditableTemplatesdd" /></div>
                    </div>
                    <div class="modalEditSectionLabel">Filter:</div>
                    <div class="modalEditSection">
                        <div class="k-edit-label"><label for="MagicDataSource_ID">Select the fields:</label></div>
                        <div class="k-edit-field">
                            <div class="filterList" id = "mained">
                            </div>
                            -->
                            <div class="filterList" id = "childed">
                            </div>
                        </div>
                    </div>
                </div>
                </div>

            <div class="k-edit-buttons k-state-default">
                <a class="k-button k-button-icontext k-grid-update" onclick="UpdateGridInFunction(this);" href="\#"><span class="k-icon k-update"></span>Update</a>
                <a class="k-button k-button-icontext k-grid-cancel" onclick="closeWin('modalGridElementEdit');" href="\#"><span class="k-icon k-cancel"></span>Cancel</a>
            </div>
        </div>
         
    </script>

    <!--template per edit template-->
    <script type="text/x-kendo-template" id="EditTemplate">
        <div class="k-edit-form-container">
            <div id="tabstrippopupEditTemplate" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Tab generator</li>
                </ul>
                <div>
                    <div class="k-edit-label"><label for="TabName">Tab name</label></div>
                    <div class="k-edit-field"><input name="TabName" id="TabName" class="k-input k-textbox" placeholder="Tab name..."/></div>         
                </div>
            </div>
            <div class="k-edit-buttons k-state-default">
                <a class="k-button k-button-icontext k-grid-update"  onclick="AddTemplateTab(this,'EDIT','FIELDEDITLIST','','');" href="\#"><span class="k-icon k-update"></span>Update</a>
                <a class="k-button k-button-icontext k-grid-cancel" onclick="closeWin('modalEditTemplate');" href="\#"><span class="k-icon k-cancel"></span>Cancel</a>
            </div>
        </div>
    </script>

    <!--template per detail template-->
    <script type="text/x-kendo-template" id="DetailTemplateSelect">
        <div class="k-edit-form-container">
            <div id="tabstrippopupSelectDetailTemplate" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Select detail template content</li>
                </ul>
                <div>
                    <div class="k-edit-label"><label for="Detail_template">Detail template content</label></div>
                    <div class="k-edit-field"><input name="Detail_template" data-source="['Grid','Field label list','Custom']" data-option-label="N/A"  data-role="dropdownlist" id="Detail_templatedd" data-change="loadContentDetailTemplate"/></div>         
                </div>
            </div>
        </div>
    </script>

    <script type="text/x-kendo-template" id="DetailTemplateGrid">
        <div class="k-edit-form-container">
            <div id="tabstrippopupDetailTemplateGrid" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Grid</li>
                </ul>
                <div>
                    <div class="modalEditSectionLabel">Select Grid:</div>
                    <div class="modalEditSection">
                        <div>
                            <div class="k-edit-label"><label for="TabNametd">Tab name</label></div>
                            <div class="k-edit-field"><input name="TabNametd" id="TabNametd" class="k-input k-textbox" placeholder="Tab name..."/></div>         
                        </div>
        
                        <div class="k-edit-label"><label for="MagicGridID">Grid</label></div>
                        <div class="k-edit-field"><input name="MagicGridID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicGridID" data-text-field="MagicGridName" data-source="Magic_Gridsds" data-role="dropdownlist" id="Magic_DetailTemplateGrid_Gridsdd" data-change="getGridData" /></div>
                            
                </div>              
                    <div class="modalEditSectionLabel">Overrides:</div>
                    <div class="modalEditSection">
                        <div class="k-edit-label"><label for="MagicDataSource_ID">Data Source</label></div>
                        <div class="k-edit-field"><input name="MagicDataSource_ID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicDataSourceID" data-text-field="Name" data-source="Magic_DataSourceds" data-role="dropdownlist" id="Magic_DetailTemplateGrid_DataSourcedd" /></div>
                        <div class="k-edit-label"><label for="Custom_Commandtd" style="color: black;">Colums command</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Edittd"  id="Edittd" onclick="appendcommandtext(this, 'edit', 'Custom_Commandtd');">Edit</span>
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Destroytd"  id="Destroytd" onclick="appendcommandtext(this, 'destroy', 'Custom_Commandtd');" >Destroy</span>
                        </div>
                        <div class="k-edit-field">Custom command<textarea rows="4" cols="20" name="Custom_Commandtd"  id="Custom_Commandtd" class="k-input k-textbox" /></div>
                        <div class="k-edit-label"><label for="Sortabletd" style="color: black;">Sortable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Sortabletd"  id="Sortabletd" >Sortable</span>
                        </div>
                        <div class="k-edit-label"><label for="Groupabletd" style="color: black;">Groupable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Groupabletd"  id="Groupabletd" >Groupable</span>
                        </div>
                        <div class="k-edit-label"><label for="Editabletd" style="color: black;">Editable</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="radio" class="k-checkbox" name="Editabletd"  id="Notd" >No</span>
                            <span class="spaceRight"><input type="radio" class="k-checkbox" name="Editabletd"  id="Inlinetd" >Inline</span>
                            <span class="spaceRight"><input type="radio" class="k-checkbox" name="Editabletd"  id="Popuptd" >Popup</span>
                        </div>
                        <div class="k-edit-label"><label for="Toolbartd" style="color: black;">Toolbar</label></div>                
                        <div class="k-edit-field">
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Newtd"  id="Newtd" onclick="appendtoolbartext(this,'create','Custom_toolbartd');">New</span>
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Savetd"  id="Savetd" onclick="appendtoolbartext(this,'save','Custom_toolbartd');">Save</span>
                            <span class="spaceRight"><input type="checkbox" class="k-checkbox" name="Canceltd"  id="Canceltd" onclick="appendtoolbartext(this,'cancel','Custom_toolbartd');">Cancel</span>
                        </div>
                        <div class="k-edit-field">Custom toolbar<textarea rows="4" cols="20" name="Custom_toolbartd"  id="Custom_toolbartd" class="k-input k-textbox" /></div>
                        <div class="k-edit-label"><label for="MagicTemplateID">Detail template</label></div>
                        <div class="k-edit-field"><input name="MagicTemplateID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicTemplateID" data-text-field="MagicTemplateName" data-source="Magic_Templatesds" data-role="dropdownlist" id="Magic_DetailTemplateGrid_DetailTemplatesdd" /></div>
                        <div class="k-edit-label"><label for="MagicTemplateID">Editable template</label></div>
                        <div class="k-edit-field"><input name="MagicTemplateID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicTemplateID" data-text-field="MagicTemplateName" data-source="Magic_Templatesds" data-role="dropdownlist" id="Magic_DetailTemplateGrid_EditableTemplatesdd" /></div>
                    </div>
                    <div class="modalEditSectionLabel">Filter:</div>
                    <div class="modalEditSection">
                        <div class="k-edit-label"><label for="MagicDataSource_ID">Select the fields:</label></div>
                        <div class="k-edit-field">
                            <div class="filterList" id = "maintd">
                            </div>
                            -->
                            <div class="filterList" id = "childtd">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="k-edit-buttons k-state-default">
                <a class="k-button k-button-icontext k-grid-update" href="\#" onclick="InsertGridInTemplateGroup(this);"><span class="k-icon k-update"></span>Update</a>
                <a class="k-button k-button-icontext k-grid-cancel" onclick="closeWin('modalDetailTemplate');" href="\#"><span class="k-icon k-cancel"></span>Cancel</a>
            </div>
        </div>
         
    </script>

    <script type="text/x-kendo-template" id="DetailTemplateFieldLabelList">
        <div class="k-edit-form-container">
            <div id="tabstrippopupDetailTemplateFieldLabelList" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Field label list</li>
                </ul>
                <div>
                    <div class="modalEditSectionLabel">Field selection:</div>
                    <div class="modalEditSection">
                        <div class="k-edit-label"><label for="MagicDataSource_ID">Select the fields</label></div>
                        <div class="k-edit-field">
                            <span class="spaceRight block"><input type="checkbox" class="k-checkbox" name="Field1" data-bind="checked:New" id="New" >Field1</span>
                            <span class="spaceRight block"><input type="checkbox" class="k-checkbox" name="Field2" data-bind="checked:Save" id="Save" >Field2</span>
                            <span class="spaceRight block"><input type="checkbox" class="k-checkbox" name="Field3" data-bind="checked:Cancel" id="Cancel" >Field3</span>
                        </div>
                    </div> 
                </div>
            </div>
            <div class="k-edit-buttons k-state-default">
                <a class="k-button k-button-icontext k-grid-update" href="\#"><span class="k-icon k-update"></span>Update</a>
                <a class="k-button k-button-icontext k-grid-cancel" onclick="closeWin('modalDetailTemplate');" href="\#"><span class="k-icon k-cancel"></span>Cancel</a>
            </div>
        </div>
         
    </script>

    <script type="text/x-kendo-template" id="DetailTemplateCustom">
        <div class="k-edit-form-container">
            <div id="tabstrippopupDetailTemplateCustom" data-role="tabstrip" class="k-widget k-header k-tabstrip">
                <ul>
                    <li class="k-state-active">Custom</li>
                </ul>
                <div>
                    <div class="modalEditSectionLabel">Custom:</div>
                    <div class="modalEditSection">
                        <div class="k-edit-label"><label for="MagicTemplateID">Template</label></div>
                        <div class="k-edit-field"><input name="MagicTemplateID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicTemplateID" data-text-field="MagicTemplateName" data-source="Magic_Templatesds" data-role="dropdownlist" id="Magic_DetailTemplateCustom_Templatesdd" /></div>
                        <div class="k-edit-label"><label for="MagicTemplateID">Id Script</label></div>
                        <div class="k-edit-field"><textarea name="MagicTemplateID" id="MagicTemplateIDdd" rows="15" cols="20" class="k-input k-textbox"/></div>
                        <div class="k-edit-label"><label for="MagicDataSource_ID">Data Source</label></div>
                        <div class="k-edit-field"><input name="MagicDataSource_ID" data-bound="selectFirst" data-option-label="N/A" data-value-field="MagicDataSourceID" data-text-field="Name" data-source="Magic_DataSourceds" data-role="dropdownlist" id="Magic_DetailTemplateCustom_DataSourcedd" /></div>
                    </div> 
                </div>
            </div>
            <div class="k-edit-buttons k-state-default">
                <a class="k-button k-button-icontext k-grid-update" href="\#"><span class="k-icon k-update"></span>Update</a>
                <a class="k-button k-button-icontext k-grid-cancel" onclick="closeWin('modalDetailTemplate');" href="\#"><span class="k-icon k-cancel"></span>Cancel</a>
            </div>
        </div>
         
    </script>

    
    <script>

        function onDrop(e) {
            // if ((e.sender.dataItem(e.destinationNode).type == "User") && (e.sender.dataItem(e.sourceNode).type == "User")) {
             if (e.sender.dataItem(e.destinationNode).type != "FIELDEDITLIST")  {
                e.setValid(false);
            }
             else
            {
                var newparentid = e.sender.dataItem(e.destinationNode).templategroupid;
                var newchild = e.sender.dataItem(e.sourceNode).templatedetailid;
                var oldparent = e.sender.dataItem(e.sourceNode).templategroupid;
                var parstring = { templatedetailid: newchild, templategroupid: newparentid, oldtemplategroupid: oldparent };
                var res = $.ajax({
                    type: "POST",
                    url: "/api/MAGIC_TEMPLATEGROUPS/PostLinkDetailToGroup",
                    data: JSON.stringify(parstring),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    error: function (e) {
                        kendoConsole.log("Error in the drag and drop execution (MAGIC_TEMPLATEGROUPS PostLinkDetailToGroup)", true);
                        e.setValid(false);
                    }
                });



            }

        }

        function onDragStart(e) {
            if (e.sender.dataItem(e.sourceNode).type != "COLUMNEDIT") {
                e.preventDefault();
            }

        }

        $(document).ready(function () {
            $("#spanbig").text("Function Trees");

            $("#modalRootElementAdmin")
             .kendoWindow({
                 title: "Root Element Admin",
                 modal: true,
                 visible: false,
                 resizable: false,
                 width: 400
             }).data("kendoWindow");

            $("#modalEditTemplate")
             .kendoWindow({
                 title: "Edit template",
                 modal: true,
                 visible: false,
                 resizable: false,
                 width: 400
             }).data("kendoWindow");

            $("#modalDetailTemplate")
             .kendoWindow({
                 title: "Detail template",
                 modal: true,
                 visible: false,
                 resizable: false,
                 width: 400
             }).data("kendoWindow");

            $("#modalGridElementEdit")
             .kendoWindow({
                 title: "Grid edit template",
                 modal: true,
                 visible: false,
                 resizable: false,
                 width: 400
             }).data("kendoWindow");

            $("#ColumnEditTemplate")
             .kendoWindow({
                 title: "Column edit template",
                 modal: true,
                 visible: false,
                 resizable: false,
                 width: 400
             }).data("kendoWindow");

            $("#ColumnEditableTemplate")
             .kendoWindow({
                 title: "Column editable template",
                 modal: true,
                 visible: false,
                 resizable: false,
                 width: 400
             }).data("kendoWindow");
        });

        $("#root").click(function () {
                var wnd = $("#modalRootElementAdmin").data("kendoWindow");

                detailsTemplate = kendo.template($("#SelectRootElement").html());
                wnd.content(detailsTemplate);

                $("#tabstrippopupSelectRootElement").kendoTabStrip({
                    animation: {
                        open: {
                            effects: "fadeIn"
                        }
                    }
                });
                //per fare in modo che i data-role funzionino
                kendo.init($("#modalRootElementAdmin"));

                wnd.open();
                wnd.center();
            
            });

        function loadContentRoot(e) {
               var selectedElement = $("#" + e.sender.element[0].id).data("kendoDropDownList")._selectedValue;
               var wnd = $("#modalRootElementAdmin").data("kendoWindow");
               switch (selectedElement) {
                   case ("Grid"): //se scelgo grid nella tendina
                       
                       detailsTemplate = kendo.template($("#RootElementGrid").html());
                       wnd.content(detailsTemplate);
                       $("#tabstrippopupRootElementGrid").kendoTabStrip({
                           animation: {
                               open: {
                                   effects: "fadeIn"
                               }
                           }
                       });
                       //per fare in modo che la form sia centrata
                       wnd.center();
                       //per fare in modo che i data-role funzionino
                       kendo.init($("#modalRootElementAdmin"));
                       //chiamate per i dati
                       getdropdatasource("Magic_Grids", "MagicGridName", null,"Magic_RootElementGrid_Gridsdd");
                       getdropdatasource("Magic_DataSource", "Name", null, "Magic_RootElementGrid_DataSourcedd");
                       getdropdatasource("Magic_Templates", "MagicTemplateName", "GetDetailTemplates", "Magic_RootElementGrid_DetailTemplatesdd");
                       getdropdatasource("Magic_Templates", "MagicTemplateName", "GetEditableTemplates", "Magic_RootElementGrid_EditableTemplatesdd");
                       break;
                   case ("Template"): //se scelgo template nella tendina
                       detailsTemplate = kendo.template($("#RootElementTemplate").html());
                       wnd.content(detailsTemplate);
                       $("#tabstrippopupRootElementTemplate").kendoTabStrip({
                           animation: {
                               open: {
                                   effects: "fadeIn"
                               }
                           }
                       });
                       //per fare in modo che la form sia centrata
                       wnd.center();
                       //per fare in modo che i data-role funzionino
                       kendo.init($("#modalRootElementAdmin"));
                       //chiamate per i dati
                       getdropdatasource("Magic_Templates", "MagicTemplateName", "GetCustomTemplates", "Magic_RootElementTemplate_Templatesdd");
                       break;
               }
           
           }

        function selectFirst(e) {
               var dropdownlist = $("#" + e.sender.element[0].id).data("kendoDropDownList");
               dropdownlist.select(0);

           }

        function getroot(id) {
                var funcgrids = getdatasource("Magic_FunctionsGrids", "MagicFunction_ID", "GetAll", null);
                for (var i = 0; i < funcgrids.length; i++) {
                    if (funcgrids[i].MagicFunction_ID == id && funcgrids[i].isRoot)
                        return funcgrids[i].MagicGrid_ID;
                }
                return 0;
            }

        function getfirstfunction() {
               var funcgrids = getdatasource("Magic_Functions",null, "GetFirst", null);
               return  funcgrids[0];
       
           }

        function addTab(e)
        {
                var wnd1 = $("#modalEditTemplate").data("kendoWindow");

                detailsTemplate = kendo.template($("#EditTemplate").html());
                wnd1.content(detailsTemplate);

                $("#tabstrippopupEditTemplate").kendoTabStrip({
                    animation: {
                        open: {
                            effects: "fadeIn"
                        }
                    }
                });
                //per fare in modo che i data-role funzionino
                kendo.init($("#modalEditTemplate"));

                var Uid = $("#thefunctiontree").data('kendoTreeView').dataItem($($(e).closest("li")[0])).uid;
                $("#modalEditTemplate").attr("nodeuid", Uid);

                wnd1.open();
                wnd1.center();
        

        }
        function addElement(e) {
            var wnd2 = $("#modalDetailTemplate").data("kendoWindow");
            
            detailsTemplate = kendo.template($("#DetailTemplateSelect").html());
            wnd2.content(detailsTemplate);

            $("#tabstrippopupSelectDetailTemplate").kendoTabStrip({
                animation: {
                    open: {
                        effects: "fadeIn"
                    }
                }
            });
            //per fare in modo che i data-role funzionino
            kendo.init($("#modalDetailTemplate"));

            var treeview = $("#thefunctiontree").data('kendoTreeView');
            var datan = treeview.dataItem($($(e).closest("li")[0]));
            var Uid = datan.uid;
            $("#modalDetailTemplate").attr("nodeuid", Uid);



            wnd2.open();
            wnd2.center();
        }

        function editGrid(e)
        {
                var wnd3 = $("#modalGridElementEdit").data("kendoWindow");

                var data = $("#thefunctiontree").data('kendoTreeView').dataItem($($(e).closest("li")[0]));

           
                detailsTemplate = kendo.template($("#GridEdit").html());
                wnd3.content(detailsTemplate);

                $("#tabstrippopupGridElementEdit").kendoTabStrip({
                    animation: {
                        open: {
                            effects: "fadeIn"
                        }
                    }
                });
                //per fare in modo che i data-role funzionino
                kendo.init($("#modalGridElementEdit"));

                //Overrides
                getdropdatasource("Magic_DataSource", "Name", null, "Magic_EditDataSourcedd", data.datasourceid);
                getdropdatasource("Magic_Templates", "MagicTemplateName", "GetDetailTemplates", "Magic_EditDetailTemplatesdd", data.detailtemplateid);
                getdropdatasource("Magic_Templates", "MagicTemplateName", "GetEditableTemplates", "Magic_EditEditableTemplatesdd", data.editabletemplateid);


                var gridcode = data.gridname;
                var dd = $("#functionselector").data("kendoDropDownList");
                var functionname = dd.text();
                var functionid = dd.value();
                var result = $.ajax({
                    type: "POST",
                    async: false,
                    url: "/api/Magic_Grids/GetByName",
                    data: JSON.stringify({ id: gridcode, functionname: functionname, functionid: functionid }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json"
                });

                var datag = result.responseJSON[0];

                var Uid = data.uid;

                $("#modalGridElementEdit").attr("nodeuid", Uid);

                initGridCheckableValues("ed", datag, data.CommandColumn,Uid);
               
                $("#Custom_Commanded").val(data.CommandColumn);
                $("#Custom_toolbared").val(data.Toolbar);

                $("#htmldived").val(data.AppendToDiv);
                

                wnd3.open();
                wnd3.center();
            
        }

        function loadContentDetailTemplate(e) {
            var selectedElement = $("#" + e.sender.element[0].id).data("kendoDropDownList")._selectedValue;
            var wnd2 = $("#modalDetailTemplate").data("kendoWindow");
               switch (selectedElement) {
                   case ("Grid"): //se scelgo grid nella tendina
                       detailsTemplate = kendo.template($("#DetailTemplateGrid").html());
                       wnd2.content(detailsTemplate);
                       $("#tabstrippopupDetailTemplateGrid").kendoTabStrip({
                           animation: {
                               open: {
                                   effects: "fadeIn"
                               }
                           }
                       });
                       //per fare in modo che la form sia centrata
                       wnd2.center();
                       //per fare in modo che i data-role funzionino
                       kendo.init($("#modalDetailTemplate"));
                       //chiamate per i dati
                       getdropdatasource("Magic_Grids", "MagicGridName",null,"Magic_DetailTemplateGrid_Gridsdd");
                       getdropdatasource("Magic_DataSource", "Name", null, "Magic_DetailTemplateGrid_DataSourcedd");
                       getdropdatasource("Magic_Templates", "MagicTemplateName", "GetDetailTemplates", "Magic_DetailTemplateGrid_DetailTemplatesdd");
                       getdropdatasource("Magic_Templates", "MagicTemplateName", "GetEditableTemplates", "Magic_DetailTemplateGrid_EditableTemplatesdd");
                       break;
                   case ("Field label list"): //se scelgo field label list
                       detailsTemplate = kendo.template($("#DetailTemplateFieldLabelList").html());
                       wnd2.content(detailsTemplate);
                       $("#tabstrippopupDetailTemplateFieldLabelList").kendoTabStrip({
                           animation: {
                               open: {
                                   effects: "fadeIn"
                               }
                           }
                       });
                       //per fare in modo che la form sia centrata
                       wnd2.center();
                       //per fare in modo che i data-role funzionino
                       kendo.init($("#modalDetailTemplate"));
                       break;
                   case ("Custom"): //se scelgo custom
                       detailsTemplate = kendo.template($("#DetailTemplateCustom").html());
                       wnd2.content(detailsTemplate);
                       $("#tabstrippopupDetailTemplateCustom").kendoTabStrip({
                           animation: {
                               open: {
                                   effects: "fadeIn"
                               }
                           }
                       });
                       //per fare in modo che la form sia centrata
                       wnd2.center();
                       //per fare in modo che i data-role funzionino
                       kendo.init($("#modalDetailTemplate"));
                       //chiamate per i dati
                       getdropdatasource("Magic_Templates", "MagicTemplateName", "GetCustomTemplates", "Magic_DetailTemplateCustom_Templatesdd");
                       getdropdatasource("Magic_DataSource", "Name", null, "Magic_DetailTemplateCustom_DataSourcedd");
                       break;
               }

           }


        var tree = new Array();
        var startfunction = getfirstfunction();
        var startfunctionroot = getroot(startfunction);
        var response = getFunctionTree(startfunction, startfunctionroot);
        var functionds = getdatasource("Magic_Functions", null, "GetAll", "", null);
        if (response.join('') != "NODBDEF") {
          //  console.log("["+response.join("")+"]");
            tree = eval("[" + response.join("") + "]");

        }
        $(document).ready(function () {
               var viewModel = kendo.observable({
                   name: "Function Tree of " + ( functionds[0] == undefined ? 'N/A' : functionds[0].FunctionName),
                   files: kendo.observableHierarchy(tree),
                   printFiles: function () {
                       // helper function that prints the relevant data from the hierarchical model
                       var items = this.get("files").toJSON();

                       function removeFields(item) {
                           delete item.index;

                           if (item.items.length == 0) {
                               delete item.items;
                           } else {
                               item.items = $.map(item.items, removeFields);
                           }

                           return item;
                       }

                       $.map(items, removeFields);

                       var jsonString = JSON.stringify(items, null, 2);

                       return jsonString.replace(/\n/gi, "\n    ")
                                   .replace(/\n\s*("name)/gi, " $1")
                                   .replace(/\n\s*("type)/gi, " $1")
                                   .replace(/\n\s*("expanded)/gi, " $1")
                                   .replace(/\n\s*("selected)/gi, " $1")
                                   .replace(/\n\s*("items)/gi, " $1")
                                   .replace(/\s*\n\s*(})/gi, " $1")
                                   .replace(/(\s*)]\n\s*}/gi, "] }");
                   }
               });
               kendo.bind($("#functiontree"), viewModel);
             //  addButton();
           });

        function rebindtree(e) {
               var dd = $("#functionselector").data("kendoDropDownList");
               bind(dd.value(), dd.text());
            //   addButton();
           }

        function bind(functionID, functionName) {
                var tree = new Array();
                var response = getFunctionTree(functionID, getroot(functionID));
                if (response.join('') != "NODBDEF") {
                    console.log("[" + response.join("") + "]");
                    tree = eval("[" + response.join("") + "]");
                }
                var viewModel = kendo.observable({
                    name: "Function " + functionName,
                    files: kendo.observableHierarchy(tree),
                    printFiles: function () {
                        // helper function that prints the relevant data from the hierarchical model
                        var items = this.get("files").toJSON();
                        function removeFields(item) {
                            delete item.index;
                            if (item.items.length == 0) {
                                delete item.items;
                            } else {
                                item.items = $.map(item.items, removeFields);
                            }
                            return item;
                        }
                        $.map(items, removeFields);
                        var jsonString = JSON.stringify(items, null, 2);
                        return jsonString.replace(/\n/gi, "\n    ")
                                    .replace(/\n\s*("name)/gi, " $1")
                                    .replace(/\n\s*("type)/gi, " $1")
                                    .replace(/\n\s*("expanded)/gi, " $1")
                                    .replace(/\n\s*("selected)/gi, " $1")
                                    .replace(/\n\s*("items)/gi, " $1")
                                    .replace(/\s*\n\s*(})/gi, " $1")
                                    .replace(/(\s*)]\n\s*}/gi, "] }");
                    }
                });
                kendo.bind($("#functiontree"), viewModel);
        }
        function InsertGridInTemplateGroup(e) {


            //selected Grid
            var gridID = $("#Magic_DetailTemplateGrid_Gridsdd").data("kendoDropDownList").value();
            //Overrides
            var datasourceID = $("#Magic_DetailTemplateGrid_DataSourcedd").data("kendoDropDownList").value();

            var edit = $("#Edittd").prop("checked") == "checked" ? true : false;
            var destroy = $("#Destroytd").prop("checked") == "checked" ? true : false;

            var customcommand = $("#Custom_Commandtd").val();

            var sortable = $("#Sortabletd").prop("checked") == "checked" ? "true" : "false";
            var groupable = $("#Groupabletd").prop("checked") == "checked" ? "true" : "false";

            var editable = null;
            var editableno = $("#Notd").prop("checked");
            var editableinline = $("#Inlinetd").prop("checked");
            var editablepopup = $("#Popuptd").prop("checked");

            if (editablepopup == "checked")
                editable = "popup";
            if (editableno == "checked")
                editable = "false";
            if (editableinline == "checked")
                editable = "true";

            var toolbarnew = $("#Newtd").prop("checked") == "checked" ? true : false;
            var toolbarsave = $("#Savetd").prop("checked") == "checked" ? true : false;
            var toolbarcancel = $("#Canceltd").prop("checked") == "checked" ? true : false;

            var customtoolbar = $("#Custom_toolbartd").val();

            var detailtemplate = $("#Magic_DetailTemplateGrid_DetailTemplatesdd").data("kendoDropDownList").text();
            var editabletemplate = $("#Magic_DetailTemplateGrid_EditableTemplatesdd").data("kendoDropDownList").text();


            var checkedchild = null;
            var checkedmain = null;
            if ($('input:radio[name=childradio]:checked')[0]!=undefined)
              checkedchild = $('input:radio[name=childradio]:checked')[0].id;
            if ($('input:radio[name=mainradio]:checked')[0] != undefined)
                checkedmain = $('input:radio[name=mainradio]:checked')[0].id;

            if (gridID == "" || gridID == 0 || checkedchild==null)
                kendoConsole.log("Please choose the Grid and the filter settings", true);
            else {
                var text = $("#TabNametd").val();
                if ($.trim(text) != '')
                {
                var dd = $("#functionselector").data("kendoDropDownList");
                var functionid = dd.value();
                //TODO:append the grid to the function considering both the child and the main
                filterval = "{{ field: "+checkedchild+", operator: eq, value: "+checkedmain+" }}";
                
                //filterval = checkedchild;

                
                    AddTemplateTab(e, "NAVIGATION", "GRID", "td", filterval, gridID);

                    var parstring = { MagicFunction_ID: functionid, MagicGrid_ID: gridID, MagicDataSource_ID: datasourceID, CustomCommand: customcommand, Sortable: sortable, Groupable: groupable, Editable: editable, CustomToolbar: customtoolbar, DetailTemplate: detailtemplate, EditableTemplate: editabletemplate, HTMLDiv: null, isroot: false };

                    var res = getdatasource("BUILDFUNCTIONTREE", null, "PostInsertGridAndOverridesInFunction", null, parstring);

                    var wnd = $("#modalDetailTemplate").data("kendoWindow");
                    wnd.close();
                    rebindtree(null);
                }
                else {
                    kendoConsole.log("Please insert a Tab Name", true);
                }
            }
        }
        function InsertGridInFunction(e) {


            //selected Grid
            var gridID = $("#Magic_RootElementGrid_Gridsdd").data("kendoDropDownList").value();
            //Overrides
            var datasourceID = $("#Magic_RootElementGrid_DataSourcedd").data("kendoDropDownList").value();

            var edit = $("#Edit").attr("checked") == "checked" ? true : false;
            var destroy = $("#Destroy").attr("checked") == "checked" ? true : false;

            var customcommand = $("#Custom_Command").val();

            var sortable = $("#Sortable").prop("checked") == "checked" ? "true" : "false";
            var groupable = $("#Groupable").prop("checked") == "checked" ? "true" : "false";

            var editable = null;
            var editableno = $("#No").prop("checked");
            var editableinline = $("#Inline").prop("checked");
            var editablepopup = $("#Popup").prop("checked");

            if (editablepopup == "checked")
                editable= "popup";
            if (editableno == "checked")
                editable= "false";
            if (editableinline == "checked")
                editable = "true";

            var toolbarnew = $("#New").prop("checked") == "checked" ? true : false;
            var toolbarsave = $("#Save").prop("checked") == "checked" ? true : false;
            var toolbarcancel = $("#Cancel").prop("checked") == "checked" ? true : false;

            var customtoolbar = $("#Custom_toolbar").val();
            
            var detailtemplate = $("#Magic_RootElementGrid_DetailTemplatesdd").data("kendoDropDownList").text();
            var editabletemplate = $("#Magic_RootElementGrid_EditableTemplatesdd").data("kendoDropDownList").text();

            var htmldiv = $("#htmldiv").val();
            
            if (gridID == "" || gridID == 0 || htmldiv=="")
                kendoConsole.log("the Grid choice and the html div are mandatory", true);
            else {
                var dd = $("#functionselector").data("kendoDropDownList");
                var functionid = dd.value();
                //append the grid to the function
                var parstring = {MagicFunction_ID:functionid, MagicGrid_ID:gridID,MagicDataSource_ID: datasourceID, CustomCommand: customcommand, Sortable: sortable, Groupable: groupable, Editable: editable, CustomToolbar: customtoolbar, DetailTemplate: detailtemplate, EditableTemplate: editabletemplate, HTMLDiv: htmldiv,isroot:true };

                var res = getdatasource("BUILDFUNCTIONTREE", null, "PostInsertGridAndOverridesInFunction", null, parstring);
                
                var wnd = $("#modalRootElementAdmin").data("kendoWindow");
                wnd.close();
                rebindtree(null);
            }
        }

        function UpdateGridInFunction(e) {

            var Uid = $("#modalGridElementEdit").attr("nodeuid");
            var treeview = $("#thefunctiontree").data("kendoTreeView");
            var node = treeview.findByUid(Uid);
            var treeviewds = treeview.dataItem(node);

            var ismaster = true;
            if (treeviewds.parenttabid != "-1")
                ismaster = false;

            //selected Grid
            var gridID = treeviewds.gridid;
            //Overrides
            var datasourceID = $("#Magic_EditDataSourcedd").data("kendoDropDownList").value();
            var customcommand = $("#Custom_Commanded").val();


            var sortable = $("#Sortableed").prop("checked") == true ? "true" : "false";
            var groupable = $("#Groupableed").prop("checked") == true ? "true" : "false";


            var editable = null;
            var editableno = $("#Noed").prop("checked");
            var editableinline = $("#Inlineed").prop("checked");
            var editablepopup = $("#Popuped").prop("checked");

            if (editablepopup)
                editable = "popup";
            if (editableno)
                editable = "false";
            if (editableinline)
                editable = "true";

            var customtoolbar = $("#Custom_toolbared").val();

            var detailtemplate = $("#Magic_EditDetailTemplatesdd").data("kendoDropDownList").text();
            var editabletemplate = $("#Magic_EditEditableTemplatesdd").data("kendoDropDownList").text();

            var htmldiv = $("#htmldiv").val();

            var checkedchild = null;
            var checkedmain = null;
            if ($('input:radio[name=childradio]:checked')[0] != undefined)
                checkedchild = $('input:radio[name=childradio]:checked')[0].id;
            if ($('input:radio[name=mainradio]:checked')[0] != undefined)
                checkedmain = $('input:radio[name=mainradio]:checked')[0].id;

            filterval = "{{ field: " + checkedchild + ", operator: eq, value: " + checkedmain + " }}";
           // filterval = checkedchild;

            if (gridID == "" || gridID == 0 || htmldiv == "")
                kendoConsole.log("the Grid choice and the html div is mandatory", true);
            else {
                var dd = $("#functionselector").data("kendoDropDownList");
                var functionid = dd.value();
                //append the grid to the function
                var parstring = { MagicFunction_ID: functionid, MagicGrid_ID: gridID, MagicDataSource_ID: datasourceID, CustomCommand: customcommand, Sortable: sortable, Groupable: groupable, Editable: editable, CustomToolbar: customtoolbar, DetailTemplate: detailtemplate, EditableTemplate: editabletemplate, HTMLDiv: htmldiv };
                
                var res = getdatasource("BUILDFUNCTIONTREE", null, "PostUpdateGridOverridesInFunction", null, parstring);
                if (!ismaster)
                {
                    var parstring2 = { templategroupid: treeviewds.parenttabid, functionid: -1, visible: null, filterforgrid: filterval };
                    var res2 = getdatasource("MAGIC_TEMPLATEGROUPS", null, "PostInsertGroupFunctionOverride", null, parstring2);
                    }
                var wnd = $("#modalGridElementEdit").data("kendoWindow");
                wnd.close();
                rebindtree(null);
            }
        }

        function appendtoolbartext(e,typeofsubstring,domid)
        {
            var currentobj = $("#" + domid).val();
            currentobj = currentobj.replace('[', '');
            currentobj = currentobj.replace(']', '');
            var thearray = currentobj.split('}');
            var action = "add";
            var j=0;
            for (var i = 0; i < thearray.length; i++)
                if (thearray[i].indexOf(typeofsubstring) !== -1)
                { 
                    action = "remove";
                    j=i;
                }
                
            if (action == "add")
                thearray.push(",{ name:'"+ typeofsubstring +"',text:'"+typeofsubstring +"'");
            else 
                thearray.splice(j,1);
            
            var output = "[";
            for (var i = 0; i < thearray.length; i++)
            {
                if (thearray[i].trim() != "")
                    output += thearray[i] + "}";
            }
            output += "]";

            $("#" + domid).val(output.replace("[,","[")); 
        }
        function appendcommandtext(e, typeofsubstring, domid) {
            var addch = '[';
            var addch2 = ']';
            if ($("#" + domid).val().substring(0, 1) == "[") {
                addch2 = '';
                addch = '';
            }
            var currentobj = eval(addch + ($("#" + domid).val()) + addch2);
            
            var thearray = new Array();
            if (currentobj[0] != undefined)
               thearray = currentobj[0].command;
            else
            {
                currentobj =[{ command: [], title: '&nbsp;', width: '85px' }];
                thearray = currentobj[0].command;
            }

            var action = "add";
            var j = 0;
            for (var i = 0; i < thearray.length; i++)
                if (thearray[i].name == typeofsubstring) {
                    action = "remove";
                    j = i;
                }

            if (action == "add")
                thearray.push({ name: typeofsubstring, text: '' });
            else
                thearray.splice(j, 1);
            var len = JSON.stringify(currentobj).length;

            var output = JSON.stringify(currentobj).substring(0, len - 1);
            output = output.substring(1, len-1);

            $("#" + domid).val(output+',');
        }
        
        function AddTemplateTab(e, typeoftemplate,contenttype,suffix,filter,gridid)
        {

            var windowdiscriminator = "";

            if (typeoftemplate == "EDIT")
                windowdiscriminator = "modalEditTemplate";
            if (typeoftemplate == "NAVIGATION")
                windowdiscriminator = "modalDetailTemplate";


            var text = $("#TabName"+suffix).val();
            //MVVM i modify the datasource in order to update the UI tree and the data model
            var treeview = $("#thefunctiontree").data("kendoTreeView");
            var node = treeview.findByUid($("#" + windowdiscriminator).attr("nodeuid"));

            var treeviewds = treeview.dataItem(node);

            
            var parstring = { templateid: treeviewds.templateid, tabname: text, contenttype: contenttype, gridid:gridid, filter:filter };
            $.ajax({
                type: "POST",
                async: true,
                url: "/api/MAGIC_TEMPLATEGROUPS/PostLinkGroupToTemplate",
                data: JSON.stringify(parstring),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (res) {
                    treeviewds.items.push({
                        gridtoopenonclick: "Magic_TemplateGroups", type: contenttype,
                        templategroupid: res, name:"TAB::"+text+"-->" + contenttype, expanded: true,
                        imageUrl: "http://" + window.location.host + "/Magic/Styles/Images/" + contenttype + ".png", items: []
                    });
                },
                error: function (request, status, error) {
                    kendoConsole.log("Problems during tab creation", true);
                }

            });
            // appends a new node to the root level
            var wnd1 = $("#modalEditTemplate").data("kendoWindow");
            wnd1.close();
        }
        function OverrideTemplateGroup(e,visibleflag,filter,groupid)
        {
            var filterval = "";
            if (filter == undefined)
                filterval = "N/A";
            else {
                filterval = filter;
            }

            var treeview = $("#thefunctiontree").data('kendoTreeView');
            var data = treeview.dataItem($($(e).closest("li")[0]));
            if (groupid == undefined && data.type!="GRID")
                groupid = data.templategroupid;
            if (groupid == undefined && data.type == "GRID")
                groupid = data.parenttabid;
            var dd = $("#functionselector").data("kendoDropDownList");
            var functionid = dd.value();
            var parstring = { templategroupid: groupid, functionid: functionid, visible: visibleflag, filterforgrid: filterval };
            $.ajax({
                type: "POST",
                async: true,
                url: "/api/MAGIC_TEMPLATEGROUPS/PostInsertGroupFunctionOverride",
                data: JSON.stringify(parstring),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (res) {
                    treeview.enable(treeview.findByUid(data.uid), visibleflag);
                },
                error: function (request, status, error) {
                    kendoConsole.log("Problems modifying tab properties for function "+dd.text(), true);
                }

            });
        }
        function removeordisableGrid(e)
        {
            var treeview = $("#thefunctiontree").data('kendoTreeView');
            var data = treeview.dataItem($($(e).closest("li")[0]));
            var Uid = data.uid;
            var node = treeview.findByUid(Uid);

            var dd = $("#functionselector").data("kendoDropDownList");
            var functionid = dd.value();
            var parstring = { gridid: data.gridid, functionid: functionid }

            var url;
            if (data.parenttabid != -1) {
                //the grid is in a template group
                OverrideTemplateGroup(e, false, null, data.parenttabid);
            }
            else  // the grid is directly linked to the function
            $.ajax({
                type: "POST",
                async: true,
                url: "/api/BUILDFUNCTIONTREE/PostRemoveGridFromFunction",
                data: JSON.stringify(parstring),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (res) {
                    treeview.remove(node);
                },
                error: function (request, status, error) {
                    kendoConsole.log("Problems removing the Grid from function " + dd.text(), true);
                }

            });
        }
        function editColumn(e)
        {
            var wnd = $("#ColumnEditTemplate").data("kendoWindow");

            var data = $("#thefunctiontree").data('kendoTreeView').dataItem($($(e).closest("li")[0]));

            detailsTemplate = kendo.template($("#ColumnEdit").html());
            wnd.content(detailsTemplate);

            $("#tabstrippopupColumnEdit").kendoTabStrip({
                animation: {
                    open: {
                        effects: "fadeIn"
                    }
                }
            });
            //per fare in modo che i data-role funzionino
            kendo.init($("#ColumnEditTemplate"));

            var datatemplate = getdatasource("Magic_Columns", null, "Get/" + data.columnid, null, null);

            $("#Column_template").val(datatemplate[0].Columns_template);
            $("#IsNullable").attr("checked", data.Schema_nullable == "false" ? null : "checked");
            $("#Required").attr("checked", data.Schema_required == true ? "checked" : null);
            $("#PrimaryKey").attr("checked", data.Isprimary == 1 ? "checked" : null);
            $("#Editablecol").attr("checked", data.Editable == true ? "checked" : null);
            
            var Uid = data.uid;

            $("#ColumnEditTemplate").attr("nodeuid", Uid);

            wnd.open();
            wnd.center();
        }

        function makeColumnVisible(e, visibleflag) {
            var treeview = $("#thefunctiontree").data('kendoTreeView');
            var data = treeview.dataItem($($(e).closest("li")[0]));
            var dd = $("#functionselector").data("kendoDropDownList");
            var functionid = dd.value();
            var parstring = { columnid: data.columnid, functionid: functionid, visible: visibleflag }
            $.ajax({
                type: "POST",
                async: true,
                url: "/api/MAGIC_COLUMNS/PostMakeColumnVisible",
                data: JSON.stringify(parstring),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (res) {
                    treeview.enable(treeview.findByUid(data.uid), visibleflag);
                },
                error: function (request, status, error) {
                    kendoConsole.log("Problems modifying Column for selected function " + dd.text(), true);
                }

            });
        }
        function UpdateColumn(e)
        {
           var treeview = $("#thefunctiontree").data('kendoTreeView');
           var uid = $("#ColumnEditTemplate").attr("nodeuid")
           var node = treeview.findByUid(uid);
           var treeviewds = treeview.dataItem(node);
           var dd = $("#functionselector").data("kendoDropDownList");
           var functionid = dd.value();

           var temp = $("#Column_template").val();
           var nullable = $("#IsNullable").attr("checked") == "checked" ? "true" : "false";
           var required = $("#Required").attr("checked") == "checked" ? true : false;
           var isprimary = $("#PrimaryKey").attr("checked") == "checked" ? 1 : 0;
           var editable = $("#Editablecol").attr("checked") == "checked" ? true : false;

           var parstring = { columnid: treeviewds.columnid, functionid: functionid, template: temp, nullable: nullable, required: required, isprimary: isprimary, editable: editable };
           $.ajax({
               type: "POST",
               async: true,
               url: "/api/MAGIC_COLUMNS/PostUpdateColumn",
               data: JSON.stringify(parstring),
               contentType: "application/json; charset=utf-8",
               dataType: "json",
               success: function (res) {
                   treeviewds.Schema_nullable = nullable;
                   treeviewds.Schema_required = required;
                   treeviewds.Isprimary = isprimary;
                   treeviewds.Schema_editable = editable;
                   var wnd = $("#ColumnEditTemplate").data("kendoWindow");
                   wnd.close();
               },
               error: function (request, status, error) {
                   kendoConsole.log("Problems modifying Column for selected function " + dd.text(), true);
               }

           });
        }
        function editColumnEdit(e) {
            var wnd = $("#ColumnEditableTemplate").data("kendoWindow");

            var data = $("#thefunctiontree").data('kendoTreeView').dataItem($($(e).closest("li")[0]));

            detailsTemplate = kendo.template($("#ColumnEditable").html());
            wnd.content(detailsTemplate);

            $("#tabstrippopupColumnEditable").kendoTabStrip({
                animation: {
                    open: {
                        effects: "fadeIn"
                    }
                }
            });
            //per fare in modo che i data-role funzionino
            kendo.init($("#ColumnEditableTemplate"));

            

            $("#controller").val(data.datasource);
            $("#textfield").val(data.datasourcetextfield);
            $("#valuefield").val(data.datasourcevaluefield);
            getdropdatasource("Magic_TemplateDataRoles", "MagicTemplateDataRole", "GetAll", "Magic_TemplateDataRolesdd",data.dataroleid);
           
            var Uid = data.uid;
            $("#ColumnEditableTemplate").attr("nodeuid", Uid);

            wnd.open();
            wnd.center();
        }
        function UpdateColumnEditable(e) {

            var treeview = $("#thefunctiontree").data('kendoTreeView');
            var uid = $("#ColumnEditableTemplate").attr("nodeuid")
            var node = treeview.findByUid(uid);
            var treeviewds = treeview.dataItem(node);
            var dd = $("#functionselector").data("kendoDropDownList");
            var functionid = dd.value();

            var controller = $("#controller").val();
            var textfield = $("#textfield").val();
            var valuefield = $("#valuefield").val();
            var dataroleid = $("#Magic_TemplateDataRolesdd").data("kendoDropDownList").value();
           

            var parstring = { templatedetailid: treeviewds.templatedetailid, functionid: functionid, datasource: controller, textfield: textfield, valuefield: valuefield, dataroleid: dataroleid};
            $.ajax({
                type: "POST",
                async: true,
                url: "/api/MAGIC_TEMPLATEDETAILS/PostUpdateDetail",
                data: JSON.stringify(parstring),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (res) {
                    treeviewds.datasource = controller;
                    treeviewds.datasourcetextfield = textfield;
                    treeviewds.datasourcevaluefield = valuefield;
                    treeviewds.dataroleid = dataroleid;
                    var wnd = $("#ColumnEditableTemplate").data("kendoWindow");
                    wnd.close();
                },
                error: function (request, status, error) {
                    kendoConsole.log("Problems modifying templatedetail for selected function " + dd.text(), true);
                }

            });
        }

        function makeDetailVisible(e, visibleflag) {
            var treeview = $("#thefunctiontree").data('kendoTreeView');
            var data = treeview.dataItem($($(e).closest("li")[0]));
            var dd = $("#functionselector").data("kendoDropDownList");
            var functionid = dd.value();
            var parstring = { templatedetailid: data.templatedetailid, functionid: functionid, visible: visibleflag }
            $.ajax({
                type: "POST",
                async: true,
                url: "/api/MAGIC_TEMPLATEDETAILS/PostMakeDetailVisible",
                data: JSON.stringify(parstring),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (res) {
                    treeview.enable(treeview.findByUid(data.uid), visibleflag);
                },
                error: function (request, status, error) {
                    kendoConsole.log("Problems modifying detail for selected function " + dd.text(), true);
                }

            });
        }
        function getGridData(e)
        {
            var gridcode = e.sender.text();
            var dd = $("#functionselector").data("kendoDropDownList");
            var functionname = dd.text();
            var functionid = dd.value();
            var result = $.ajax({
                type: "POST",
                async: false,
                url: "/api/Magic_Grids/GetByName",
                data: JSON.stringify({ id: gridcode, functionid: functionid,functionname: functionname }),
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            });

            var data = result.responseJSON[0];

            var Uid = $("#modalDetailTemplate").attr("nodeuid");
            initGridCheckableValues("td", data, data.MagicGridColumnsCommand, Uid);

            $("#Custom_Commandtd").val(data.MagicGridColumnsCommand);
            $("#Custom_toolbartd").val(data.Toolbar);
            
            var dropdownlist = $("#Magic_DetailTemplateGrid_DataSourcedd").data("kendoDropDownList");
            dropdownlist.value(data.MagicDataSourceID);

            var dropdownlist2 = $("#Magic_DetailTemplateGrid_DetailTemplatesdd").data("kendoDropDownList");
            dropdownlist2.select(0);
            dropdownlist2.select(function (dataItem) {
                return dataItem.MagicTemplateName === data.DetailTemplate;
            });

            var dropdownlist3 = $("#Magic_DetailTemplateGrid_EditableTemplatesdd").data("kendoDropDownList");
            dropdownlist3.select(0);
            dropdownlist3.select(function (dataItem) {
                return dataItem.MagicTemplateName === data.EditableTemplate;
            });

            

        
        }

        function getGridDataRoot(e) {
            var gridcode = e.sender.text();
            var dd = $("#functionselector").data("kendoDropDownList");
            var functionname = dd.text();
            var functionid = dd.value();
            var result = $.ajax({
                type: "POST",
                async: false,
                url: "/api/Magic_Grids/GetByName",
                data: JSON.stringify({ id: gridcode, functionid:functionid,functionname:functionname }),
                contentType: "application/json; charset=utf-8",
                dataType: "json"
            });

            var data = result.responseJSON[0];

            
            initGridCheckableValues("", data, data.MagicGridColumnsCommand);

            $("#Custom_Command").val(data.MagicGridColumnsCommand);
            $("#Custom_toolbar").val(data.Toolbar);

            var dropdownlist = $("#Magic_RootElementGrid_DataSourcedd").data("kendoDropDownList");
            dropdownlist.value(data.MagicDataSourceID);

            var dropdownlist2 = $("#Magic_RootElementGrid_DetailTemplatesdd").data("kendoDropDownList");
            dropdownlist2.select(0);
            dropdownlist2.select(function (dataItem) {
                return dataItem.MagicTemplateName === data.DetailTemplate;
            });

            var dropdownlist3 = $("#Magic_RootElementGrid_EditableTemplatesdd").data("kendoDropDownList");
            dropdownlist3.select(0);
            dropdownlist3.select(function (dataItem) {
                return dataItem.MagicTemplateName === data.EditableTemplate;
            });

            var Uid = data.uid;
            $("#modalRootElementAdmin").attr("nodeuid", Uid);


        }
        // Questa function inizializza le griglie nelle varie window. Il suffisso gestisce le differenze di template di finestra (ed = editazione Grid, td = Griglia in template di navigazione, nessun suffisso griglia root) 
        function initGridCheckableValues(suffix,data,commandstring,Uid)
        {
            $("#Sortable" + suffix).prop("checked", data.Sortable == "true" ? true : false);
            $("#Groupable" + suffix).prop("checked", data.Groupable == "true" ? true : false);
            $("#No" + suffix).prop("checked", data.Editable == "false" ? true : false);
            $("#Inline" + suffix).prop("checked", data.Editable == "true" ? true : false);
            $("#Popup" + suffix).prop("checked", data.Editable == "popup" ? true : false);
            $("#Save" + suffix).prop("checked", false);
            $("#New" + suffix).prop("checked", false);
            $("#Cancel" + suffix).prop("checked", false);

            

            if (data.Toolbar != null) {
                if (data.Toolbar.indexOf("name: 'save'") !== -1 || data.Toolbar.indexOf('name: "save"') !== -1)
                    $("#Save" + suffix).prop("checked", true);
                if (data.Toolbar.indexOf("name: 'cancel'") !== -1 || data.Toolbar.indexOf('name: "cancel"') !== -1)
                    $("#Cancel" + suffix).prop("checked", true);
                if (data.Toolbar.indexOf("name: 'create'") !== -1 || data.Toolbar.indexOf('name: "create"') !== -1)
                    $("#New" + suffix).prop("checked", true);
            }
            $("#Edit" + suffix).prop("checked", false);
            $("#Destroy" + suffix).prop("checked", false);

            var command = eval("[" + commandstring + "]");
            if (command.length > 0 && command[0] != null)
                if (command[0].command != null)
                    for (var k = 0; k < command[0].command.length; k++) {
                        if (command[0].command[k].name == "edit")
                            $("#Edit"+suffix).prop("checked", true);
                        if (command[0].command[k].name == "destroy")
                            $("#Destroy" + suffix).prop("checked", true);
                        
                    }

            if (Uid != undefined)
            {
                var treeview = $("#thefunctiontree").data("kendoTreeView");
                var node = treeview.findByUid(Uid);

                var tabdata = treeview.dataItem(node);

                var filter = tabdata.filter;
                var childfilter = "";
                var mainfilter = "";
                if (filter!=undefined)
                    if (filter.indexOf("{") != -1) {
                        childfilter = $.trim(filter.split(',')[0].split(':')[1]);
                        mainfilter = $.trim(filter.split(',')[2].split(':')[1]);
                        mainfilter = mainfilter.substring(0, mainfilter.length - 2);
                    }
                    else {
                        childfilter = filter;
                    }


                var theparent = treeview.parent(node);
                var griddata = treeview.dataItem(theparent);
                if (griddata != undefined)
                    if (griddata.type == "NAVIGATION")
                    {
                    
                        theparent = treeview.parent(theparent);
                        griddata = treeview.dataItem(theparent);
                    
                     }
                var maincolumnhtml = "";
                var checked = "";
                $("#main" + suffix).empty();
                if (griddata != undefined) {
                    for (var j = 0; j < griddata.items.length; j++) {
                        if (griddata.items[j].type == "COLUMNSET") {
                            for (var k = 0; k < griddata.items[j].items.length; k++) {
                                
                                if (griddata.items[j].items[k].name != undefined)
                                {
                                    checked = "";
                                    if (mainfilter == "")
                                        if (griddata.items[j].items[k].Isprimary == 1)
                                            checked = "checked";
                                    if (mainfilter == griddata.items[j].items[k].name)
                                        checked = "checked";
                                    maincolumnhtml += '<span class="spaceRight"><input '+ checked +' type="radio" name="mainradio" class="k-checkbox"  id="' + griddata.items[j].items[k].name + '" >' + griddata.items[j].items[k].name + '</span>';
                                }
                            }
                        }
                    }
                    $("#main" + suffix).append(maincolumnhtml);
                }
            }
            //<span class="spaceRight"><input type="radio" class="k-checkbox" name="FieldTo" data-bind="checked:No" id="No" >Field1</span>
            var columns = Object.keys(eval(data.MagicGridModel)[0].fields);
            var columnhtml = "";
            
            
            $("#child" + suffix).empty();
            if (griddata!=undefined)
            for (i = 0; i < columns.length; i++)
            {
                checked = "";
                if (childfilter == columns[i])
                    checked = "checked";
                if (columns[i]!=undefined)
                    columnhtml += '<span class="spaceRight"><input '+ checked +' type="radio" name="childradio" class="k-checkbox"  id="' + columns[i]+ '" >' + columns[i] + '</span>';
            }
            $("#child" + suffix).append(columnhtml);
        }
        function closeWin(finestra) {
            $("#" + finestra).data("kendoWindow").close();

        }
    </script>
</div>
</asp:Content>

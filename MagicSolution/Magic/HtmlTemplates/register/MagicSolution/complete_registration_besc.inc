               <div class="span8">
                   
			            <legend><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsTitle") %></legend>
                        <div class="form-actions formregistuser">
                      
                      
                        <div class="row-fluid">
                        <div class="span6">
                        <div class="control-group">
				            <label class="control-label"><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsName") %>&nbsp;<asp:RequiredFieldValidator ID="rfvName" runat="server" ErrorMessage="*"  ControlToValidate ="FirstName"></asp:RequiredFieldValidator></label>
				            <div class="controls">
				            <input type="text" class="span12" placeholder="<%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsName") %>" name="nome"  id="FirstName" >
                                 
				            </div>
			            </div>
                        </div>
                        <div class="span6">
                        <div class="control-group">
				            <label class="control-label"><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsSurname") %>&nbsp;<asp:RequiredFieldValidator ID="rfvSurname" runat="server" ErrorMessage="*"  ControlToValidate ="LastName"></asp:RequiredFieldValidator></label>
				            <div class="controls">
				            <input type="text" class="span12" placeholder="<%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsSurname") %>" name="cognome" id="LastName" >
                                
				            </div>
			            </div>
                        </div>
                        </div>
                        
                        <div class="row-fluid">
                        <div class="span6">
                        <div class="control-group">
				            <label class="control-label"><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsTaxCode") %> </label>
				            <div class="controls">
				            <input type="text" class="span12" placeholder="<%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsTaxCode") %>" id="txtTaxCode"  >
				            </div>
			            </div>
                        </div>
                        <div class="span3">
                        <div class="control-group">
				            <label class="control-label"><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsBirthDate") %> </label>
				            <div class="controls">
                            <input class="span12"  data-date-format="<%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsBirthDate") %>" type="text" value=""  id="txtBirthDate"></div>
			            </div>
                        </div>
                        <div class="span3">
                        <div class="control-group">
				            <label class="control-label"><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsSex") %> </label>
                            <select id="selectSex" name="Sesso" class="span12" ></select>
                        </div>
			            </div>
                        
                       
                        </div>                        
                        <div class="row-fluid">
                        <div class="span6">
                        <div class="control-group">
				            <label class="control-label"><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsPhone") %> </label>
				            <div class="controls">
				            <input type="text" class="span12" placeholder="<%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsPhone") %>"  id="txtTelefono">
				            </div>
			            </div>
                        </div>
                        <div class="span6">
                        <div class="control-group">
				            <label class="control-label"><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsNation") %> </label>
				            <div class="controls">
				            <input type="text" class="span12" placeholder="<%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsNation") %>"  id="txtNation">
				            </div>
			            </div>
                        </div>
                        </div>
                        <div class="row-fluid">     
                        <div class="span12">
                        <div class="control-group">
				            <label class="control-label"><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsAddress") %> </label>
				            <div class="controls">
				            <input type="text" class="span12" placeholder="<%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsAddress") %>"  id="txtAddress">
				            </div>
			            </div>
                        </div>    
                        </div>
                        
                        <div class="row-fluid">     
                        <div class="span6">
                        <div class="control-group">
				            <label class="control-label"><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsLocation") %> </label>
				            <div class="controls">
				            <input type="text" class="span12" placeholder="<%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsLocation") %>"  id="txtLocation">
				            </div>
			            </div>
                        </div>  
                        <div class="span6">
                        <div class="control-group">
				            <label class="control-label"><%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsZipCode") %> </label>
				            <div class="controls">
				            <input type="text" class="span12" placeholder="<%= (string)GetGlobalResourceObject("OrientaWebMFSubscription", "SubInsZipCode") %>"  id="txtCap">
				            </div>
			            </div>
                        </div>                              
                        </div> 
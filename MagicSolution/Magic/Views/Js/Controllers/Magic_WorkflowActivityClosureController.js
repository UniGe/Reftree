define(["angular", "MagicSDK", "angular-magic-form-sp", "angular-kendo"], function (angular, MF) {
    return angular
   .module('WorkflowActivityClosure', ["magicFormSp", "kendo.directives"])
   .controller('WorkflowActivityClosureController', [
       'config',
       '$timeout',
       '$scope',
       function (config,$timeout,$scope) {
           var self = this;
           
           self.get_next_acts_SP = window.workflow_get_next_acts_SP ? window.workflow_get_next_acts_SP : "dbo.WKF_get_next_acts";
           //var get_schedulableUsersForTask_API = window.workflow_get_schedulableUsersForTask_API ? window.workflow_get_schedulableUsersForTask_API : "/api/MAGIC_MMB_USERS/PostSchedulableUsers";
           self.get_schedulableUsersForTask_SP = window.workflow_get_schedulableUsersForTask_SP ? window.workflow_get_schedulableUsersForTask_SP : "dbo.WKF_GetSchedulableUsersForTask";
           self.close_task_SP = window.workflow_close_task_SP ? window.workflow_close_task_SP : "dbo.WKF_close_task";
           //output statuses of taskID 
           self.statuses = config.statuses;
           self.statusID = config.statusID;
           self.isFileRequired = config.isFileRequired;
           self.isSingleUser = config.isSingleUser
           self.hasNextTasks = false;
           self.lang = {
               uploadErrorMsg: getObjectText('vErequired').format('Allegato')
           };
           self.nowPlusAnHour = function () {
               var now = new Date();
               now.setHours(now.getHours() + 1);
               return now;
           }
           //options are user as a parameter for selection queries run bythe directives
           self.taskid = config.taskid;
           self.taskDescription = config.taskDescription;
           self.refreshCallBack = config.refreshCallBack ? config.refreshCallBack : function () {
               if ($("#grid").length && $("#grid").data("kendoGrid"))
                   $("#grid").data("kendoGrid").dataSource.read();

           };
           self.hasCustomForm = (config.customForm && config.customForm.length) ? true : false;
           self.customFormModel = config.customForm;
           self.translate = function (text) {
               return getObjectText(text);
           };
		   self.changeStatus = function (e) {
				   $("#executesave").attr("disabled", "disabled"); //disables temporary the save button
                   buildXMLStoredProcedureJSONDataSource({
                       outStatusID: e.sender.value() == "null" ? null : e.sender.value(),
                       taskId: self.taskid
                   }, function (res) {
                       self.hasNextTasks = res.items && res.items.length > 0 ? true : false;
                       self.isSingleUser = config.isSingleUser;
                       self.isFileRequired = config.isFileRequired;
                       self.nextTasksData = {};
                       if (res.items && res.items.length) {
                           if (res.items[0].virtual) //non mostrare le attivita' all' utente
                               self.hasNextTasks = false;
                           //popolo i nextTasksData anche se e' virtuale perche' cosi' in chiusura puo' ragionare sullo stato del WKF
						   $.each(res.items, function (k, v) {
							   var duration = 60;
							   if (v.EstimatedWorkMinutes !== undefined && v.EstimatedWorkMinutes !== null) {
								   duration = v.EstimatedWorkMinutes;
							   }
							   self.endMoment = function () {
								   var now = new Date();
								   now.setMinutes(now.getMinutes() + duration);
								   return now;
							   }
							   self.nextTasksData[v.ID] = { Description: v.Description, schedulableUsers: JSON.parse(v.schedulableUsers), UserSelectionDisabled: res.items[0].UserSelectionDisabled, selectedOwnerIds: self.isSingleUser ? v.preAssignedUser_ID : (v.preAssignedUser_ID ? [v.preAssignedUser_ID] : []), duration: duration, duedate: self.endMoment() };
                           });
					   }
					   $timeout(function () {
						   $("#executesave").removeAttr("disabled"); //re enables it
					   });
				   }, self.get_next_acts_SP).read();
				   
           }
           self.initUpload = function () {
               var self = this;
               var $container = $('#appcontainer');
               initKendoUploadField($('input#workflowupload'), {
                   multiple: true,
                   success: function (e) {
                       if (e.operation == "upload")
                           self.uploadError = false;
                       else
                           self.uploadError = true;
                       //$scope.$apply();
                       uploadSuccess(e, $container)
                   }
               });
           }
           self.save = function (form) {
               $scope.$broadcast('schemaFormValidate');
               if (!form.$valid)
                   return false;

               if ($("#executesave").attr("clicked") == "clicked")
                return;
               $("#executesave").attr("clicked","clicked");
              
               var files = $('input#workflowupload').data("kendoUpload").options.files; //nome dei file uploadati su Root 
               if (!files.length && self.isFileRequired) {
                   self.uploadError = true;
                   $("#executesave").removeAttr("clicked");
                   return
               } else
                   self.uploadError = false;
                //move uploaded files to destination folder...
               manageGridUploadedFiles($('#appcontainer')).done(function () {

                   self.nextTasks = [];
                   $.each(self.nextTasksData, function (key, value) {
                       var users = Array.isArray(value.selectedOwnerIds) ? value.selectedOwnerIds : (value.selectedOwnerIds ? [value.selectedOwnerIds] : [null]);//not assigned
                       $.each(users,function (i, v) {
                           self.nextTasks.push({
                               activityId: key,
                               UserId: v,
                               date: value.duedate ? toTimeZoneLessString(value.duedate) : toTimeZoneLessString(new Date()),
                               duration: value.duration
                           });
                       })
                   });

                   var payload = {
                       taskId: self.taskid,
                       notes: self.notes,
                       files: files.length ? JSON.stringify(files) : null,
                       nextTasks: self.nextTasks,
                       outStatusID: self.statusID == "null" ? null : self.statusID
                   };
                   if (self.customFormData)
				   {
					   self.customFormData = function replaceTimezonesInDataObject(data) {
						   $.each(data, function (k, v) {
							   if (v instanceof Date)
								   data[k] = toTimeZoneLessString(v);
							   else if (typeof v == "string" && (config.gridFields && config.gridFields[k] && (config.gridFields[k].dataRole && config.gridFields[k].dataRole.indexOf("date") != -1) || v.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)))
								   data[k] = toTimeZoneLessString(new Date(v));
							   else if (v && typeof v == "object")
								   v = replaceTimezonesInDataObject(v);
						   });
						   return data;
					   } (self.customFormData);
                       $.extend(payload, self.customFormData);
                   }
                   //now close the task and start the new ones
                   var postcontent = buildGenericPostInsertUpdateParameter("update", "dbo.V_CalendarTask", "taskId", self.close_task_SP, "XML", -1, -1, payload);
                   $.ajax({
                       type: "POST",
                       url: "/api/GENERICSQLCOMMAND/PostU/" + self.taskid,
                       data: postcontent,
                       contentType: "application/json; charset=utf-8",
                       dataType: "json",
                       success: function (result) {
                           kendoConsole.log(getObjectText("activityclosed"), false);
                           self.refreshCallBack();
                           $("#wndmodalContainer").modal('hide');
                           try {
                               angular.element($("[ng-controller*=ScheduledTasksController]")).scope().initTaskIndicators();
                           }
                           catch (e) {
                               console.log(e.message);
                           }
                       },
                       error: function (message) {
                           kendoConsole.log(message.responseText, true);
                           //After failure from server the submission should be possible again
                           $("#executesave").removeAttr("clicked");
                      }
                   });
               })

           }


          
       }
   ]);
});
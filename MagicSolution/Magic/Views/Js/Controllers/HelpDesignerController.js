define(['angular', 'JSONEditor', 'angular-search-drop'], function (angular, JSONEditor) {

	// on delete delete target objects - test and add help

	angular.module('HelpDesigner', ['searchDrop'])
		.controller('HelpDesignerController', ['$http', '$timeout', function ($http, $timeout) {
        var self = this;
        self.helpObjectTypes = ["function", "custom"];
		self.currentModalFiles = [];
        self.page = 0;
        self.helpObjects = [];
        self.adviceDefault = {
            "selector": "",
            "translations": [
                {
                    "culture": "",
                    "text": ""
                }
            ],
            "width": "",
            "duration": "",
            "position": "",
            "showOn": "",
            "autoplay": false,
            "keepOnChecking": false,
            "remindXTimes": ""
		};

		
		self.init = function () {
			self.mainTabstrip = $('#help-main-tab').kendoTabStrip({ animation: false }).data("kendoTabStrip");

			self.modalHelpGridObj = {
				dataSource: { data: [] },
				height: 550,
				sortable: true,
				filterable: setDefaultFilterSettings(),
				pageable: {
					refresh: false,
					pageSizes: [5, 10, 25],
					messages: {
						display: getObjectText("showitems"),//"Showing {0}-{1} from {2} data items"
						empty: getObjectText("nodataingrid"),
						itemsPerPage: getObjectText("dataitemsperpage")
					}
				},
				selectable: true,
				change: function (e) {
					var selected = e.sender.select();
					var datarow = e.sender.dataItem(selected);
					datarow.Configuration.ID = datarow.ID;
					self.newModalEditor(datarow.Configuration);
					$timeout();
				},
				columns: [
					{
						field: "Description",
					},
					{
						field: "GUID",
					},
					{
						field: "ID",
					},
				],
			};

			self.helpTargetsGridConfig = {
				dataSource: { data: [] },
				height: 550,
				sortable: true,
				filterable: setDefaultFilterSettings(),
				pageable: {
					refresh: false,
					pageSizes: [5, 10, 25],
					messages: {
						display: getObjectText("showitems"),//"Showing {0}-{1} from {2} data items"
						empty: getObjectText("nodataingrid"),
						itemsPerPage: getObjectText("dataitemsperpage")
					}
				},
				selectable: true,
				change: function (e) {
					var selected = e.sender.select();
					var datarow = e.sender.dataItem(selected);
					const help = self.modalHelpObjects.find(h => h.GUID === datarow.HelpGUID);
					help.Configuration.ID = help.ID;
					self.newModalEditor(help.Configuration);
					$timeout();
				},
			};

			self.tabstrip = $('#help-editor-container').kendoTabStrip({ animation: false }).data("kendoTabStrip");
			self.helpGridObj = {
				dataSource: { data: [] },
				height: 550,
				sortable: true,
				filterable: setDefaultFilterSettings(),
				pageable: {
					refresh: false,
					pageSizes: [5, 10, 25],
					messages: {
						display: getObjectText("showitems"),//"Showing {0}-{1} from {2} data items"
						empty: getObjectText("nodataingrid"),
						itemsPerPage: getObjectText("dataitemsperpage")
					}
				},
				selectable:true,
				change: function (e) {
					var selected = e.sender.select();
					var datarow = e.sender.dataItem(selected);
					var ho = self.helpObjects.filter(function (o) {
						return o.usedFor.id == datarow.id && o.usedFor.type == datarow.type && o.description == datarow.description && o.active == datarow.active;
					});
					if (!ho.length)
						kendoConsole.log("match not found!!!", true);
					self.newEditor(ho[0]);
				},
				columns: [
					{
					field: "description",
					title: "Description"
					},
					{
					field: "id",
					title: "Id"
					},
					{
					field: "type",
						width: 150,
					values:["function","custom"]
					},
					{
						field:"active"
					}
				]
			};
			self.helpGrid = $("#magic-help-grid").kendoGrid(self.helpGridObj).data('kendoGrid');
			self.modalHelpGrid = $("#magic-modal-help-grid").kendoGrid(self.modalHelpGridObj).data('kendoGrid');
			self.helpTargetGrid = $("#magic-help-targets-grid").kendoGrid(self.helpTargetsGridConfig).data('kendoGrid');
			self.modalHelpForm = $('#modal-help-form');

			self.getHelpObjects();
			self.getHelpObjects(null, 'modal');
			JSONEditor.defaults.options.theme = 'bootstrap3';
			self.newEditor();
			self.newModalEditor();
			self.fillHelpTargetTable();
			self.loadAllHelpTargets();
		};
    
		self.getHelpObjects = function (page, type = 'tooltip') {
			$http.post('api/Help/GetHelpObjects?type=' + type)
				.then(function (res) {
					if (type === 'modal') {
						self.modalHelpObjects = res.data;
						self.modalHelpGrid.dataSource.data(res.data);
						return;
					}
					if (res.data.length > 0) {
						self.helpObjects = res.data;
						//prepare data for kgrid
						self.helpObjectsForGrid = [];
						self.helpObjects.forEach(function (helpobj) {
							self.helpObjectsForGrid.push({
								id: helpobj.usedFor.id,
								description: helpobj.description,
								type: helpobj.usedFor.type,
								active: helpobj.active
							});
						});
						var kgrid = self.helpGrid;
						if (kgrid)
							kgrid.dataSource.data(self.helpObjectsForGrid);
					}
					else
						kendoConsole.log('No HelpObjects found');
				});
		};

		self.newEditor = function (data) {
			var title = null;
			if (!data) {
				data = {
					"usedFor": {
						"type": "function",
						"id": ""
					},
					"description": "",
					"active": true,
					"support": [
						[
							$.extend(true, {}, self.adviceDefault)
						]
					]
				};
			}
			else {
				data = self.sanitizeJsonDataBeforeShow(data);
			}
			if (data.description != "")
				title = data.description;
			var options = {
				disable_properties: true,
				no_additional_properties: true,
				show_errors: 'always',
				schema: self.schema,
				startval: data
			};
			var contentElement = self.addTab(title);
			var editor = new JSONEditor(contentElement, options);
			self.addTabFunctionality(contentElement, editor, data);
		};

		self.addTab = function (title) {
			if (!title) title = "New";
			self.tabstrip.append([
				{
					text: title,
					content: ""
				}
			]);
			var items = self.tabstrip.items();
			self.tabstrip.activateTab(items[items.length - 1]);
			return self.tabstrip.contentElement(items.length - 1);
		};

		self.addTabFunctionality = function (contentElement, editor, data) {
			contentElement = angular.element(contentElement);
			//close button
			contentElement.prepend("<div class='close-tab'><input type='button' value='X'></div>");
			contentElement.find('.close-tab input').bind('click', function () {
				self.tabstrip.remove("li[aria-controls=" + contentElement.attr('id') + "]");
				var items = self.tabstrip.items();
				if (items.length != 0)
					self.tabstrip.activateTab(items[items.length - 1]);
			});
			//save button
			contentElement.append("<div><button class='save-button btn btn-default'><i class='fa fa-floppy-o'></i> Save</button><button class='delete-button btn btn-default'><i class='fa fa-trash-o'></i> Delete</button>");
			contentElement.find('.save-button').bind('click', function (e) {
				e.preventDefault();
				data = $.data(contentElement[0], "helpObject") || data;
				self.saveHelpObject(self.getSaveData(editor, data, contentElement), contentElement);
			});
			//delete button
			contentElement.find('.delete-button').bind('click', function (e) {
				e.preventDefault();
				self.deleteHelpObject(data.ID);
				self.getHelpObjects(self.page);
				contentElement.prepend('<h2 style="color: #a94442">deleted</h2>');
				$(this).remove();
			});

			var $search = contentElement.find('input[name=root\\[usedFor\\]\\[id\\]]');
			var $description = contentElement.find('input[name=root\\[description\\]]');
			$search.kendoAutoComplete({
				dataTextField: "name",
				minLength: 3,
				delay: 1000,
				dataSource: {
					serverFiltering: true,
					transport: {
						read: { url: "/api/MAGIC_FUNCTIONS/GetByName", type: "POST", dataType: "json" },
						parameterMap: function (data, action) { return { value: data.filter.filters[0].value } }
					}
				},
				select: function (e) {
					var $item = $(e.item[0]).find('span');
					setTimeout(function () {
						$search.val($item.attr('item-id'));
					}, 10);
					$description.val($item.text() + ' - ' + $description.val());
				},
				template: '<span item-id="#: id #">#: name #</span>'
			});

		};

		self.sanitizeJsonDataBeforeSend = function (data) {
			angular.forEach(data.support, function (v, k) {
				angular.forEach(v, function (vv, kk) {
					angular.forEach(vv, function (vvv, kkk) {
						if (vvv == null || vvv == "") delete data.support[k][kk][kkk];
						else {
							switch (kk) {
								case "remindXTimes":
								case "duration":
								case "width":
									if (vv == 0)
										delete data.support[k][kk][kkk];
									break;
								case "autoplay":
								case "keepOnChecking":
									if (vv == false)
										delete data.support[k][kk][kkk];
									break;
							}
						}
					});
				});
			});
			return data;
		};

		self.sanitizeJsonDataBeforeShow = function (data) {
			angular.forEach(data.support, function (v, k) {
				angular.forEach(v, function (vv, kk) {
					data.support[k][kk] = $.extend(true, {}, self.adviceDefault, data.support[k][kk]);
				});
			});
			return data;
		};

		self.getSaveData = function (editor, data, contentElement) {
			var $idInput = contentElement.find('input[name=root\\[usedFor\\]\\[id\\]]');
			var editorData = editor.getValue();
			editorData.usedFor.id = $idInput.val();
			editorData.description = contentElement.find('input[name=root\\[description\\]]').val();
			if (editorData.usedFor.id == '') {
				$idInput.closest('div').addClass('has-error');
				return false;
			}
			else {
				$idInput.closest('div').removeClass('has-error');
			}
			var errors = editor.validate();
			if (errors.length > 0) {
				return false;
			}
			return jQuery.extend(true, data, editorData);
		};

		self.saveHelpObject = function (data, contentElement) {
			if (!data)
				return;
			data = self.sanitizeJsonDataBeforeSend(data);
			$http.post('api/Help/Post', data)
				.then(function (res) {
					self.getHelpObjects(self.page);
					$.data(contentElement[0], "helpObject", res.data);
					kendoConsole.log('success', false);
				}, function (res) {
					kendoConsole.log(res.data, true);
				});
		};

		self.saveModalHelpObject = function () {
			if (!self.modalHelp || !self.modalHelp.description) {
				return;
            }
			self.modalHelp.usedFor = {
				type: 'modal',
				id: 'none',
			};
			manageGridUploadedFiles(self.modalHelpForm);
			self.isSavingModal = true;
			$http.post('api/Help/Post', self.modalHelp)
				.then(function (res) {
					self.modalHelp.ID = res.data.ID;
					self.getHelpObjects(null, 'modal');
					self.fillHelpTargetTable();
					kendoConsole.log('success', false);
					self.isSavingModal = false;
				}, function (res) {
					kendoConsole.log(res.data, true);
					self.isSavingModal = false;
				});
		};

		self.deleteHelpObject = function (id) {
			if (!id || !confirm('Are you sure you want to delete this help object?')) {
				return;
            }
			$http.delete('api/Help/Delete/' + id)
				.then(function (res) {
					self.getHelpObjects(null, 'modal');
					kendoConsole.log('success', false);
				});
		};

		self.addModalLanguage = function () {
			self.modalHelp.languages.push({});
		};

		self.addModalFile = function () {
			self.modalHelp.files.push({});
		};

		self.newModalEditor = function (data) {
			if (self.modalHelp && !confirm('Are you sure you want to overwrite your current form?')) {
				return;
			}
			// kendo kills arrays
			if (data && data.files) {
				data.files = JSON.parse(JSON.stringify(data.files));
			}
			if (data && data.languages) {
				data.languages = JSON.parse(JSON.stringify(data.languages));
			}
			if (data && data.GUID) {
				self.helpTargets(data.GUID)
					.then(
						function (res) {
							self.modalHelp.targets = res.data;
						},
						function (res) {
							kendoConsole.log(res.data);
						}
					);
            }
			self.modalHelpForm.removeData();
			self.currentModalFiles = [];
			self.modalHelp = data || {
				languages: [],
				files: [],
				targets: [],
			};
		};

		self.getFileOptions = function (index) {
			if (self.currentModalFiles[index]) {
				return self.currentModalFiles[index];
			}
			else {
				if (self.modalHelp.files[index].files) {
					self.currentModalFiles[index] = self.modalHelp.files[index].files.slice(0);
				}
				else {
					self.currentModalFiles[index] = [];
				}
            }
			return self.currentModalFiles[index] = {
				files: self.currentModalFiles[index],
			};
		};

		self.removeModalLanguage = function (index) {
			if (self.modalHelp.languages[index].html && !confirm('Are you sure you want to remove that language?')) {
				return;
			}
			self.modalHelp.languages.splice(index, 1);
		};

		self.removeModalFile = function (index) {
			if ((self.modalHelp.files[index].files || self.modalHelp.files[index].title) && !confirm('Are you sure you want to remove that file?')) {
				return;
			}
			self.modalHelp.files.splice(index, 1);
		};

		self.fileAdded = function (e, index) {
			if (!self.modalHelp.files[index].files) {
				self.modalHelp.files[index].files = [];
			}
			let file = e.files[0];
			delete file.rawFile;
			delete file.uid;
			let files = self.modalHelp.files[index].files;
			if (e.operation === 'remove') {
				let index = files.findIndex(f => f.name === file.name);
				if (index > -1) {
					files.splice(index, 1);
				}
			}
			else {
				files.push(file);
            }
		};

		self.helpTargets = function (helpGUID = null, isHelpGUIDNotNull = false, name = null) {
			return $http.get('/api/Help/HelpTargets', {
				params: {
					helpGUID,
					isHelpGUIDNotNull,
					name,
				},
			});
		};

		self.fillHelpTargetTable = function () {
			self.helpTargets(null, true)
				.then(
					function (res) {
						self.targetObjects = res.data;
						self.helpTargetGrid.dataSource.data(res.data);
					},
					function (res) {
						kendoConsole.log(res.data);
                    }
				)
		};

		self.loadAllHelpTargets = function () {
			self.helpTargets()
				.then(
					function (res) {
						self.allTargetObjects = res.data.map(t => {
							t.description = t.Name + ' - ' + t.Type;
							t.joinedID = t.ID + t.Type;
							return t;
						});
					},
					function (res) {
						kendoConsole.log(res.data);
					}
				)
		};

		self.targetSelected = function (target) {
			if (self.modalHelp.targets.find(t => t.ID === target.ID && t.Type === target.Type)) {
				return;
			}
			self.modalHelp.targets.push({ ID: target.ID, Type: target.Type, description: target.description, joinedID: target.joinedID, Name: target.Name });
			return '';
		};

		self.removeTarget = function (index) {
			self.modalHelp.targets.splice(index, 1);
		};

        self.schema = {
            type: "object",
            title: "HelpObject",
            properties: {
                "usedFor": {
                    type: "object",
                    title: "For",
                    properties: {
                        type: {
                            type: "string",
                            format: "select",
                            "enum": self.helpObjectTypes,
                        },
                        id: {
                            type: "string",
                            //minLength: 1,
                            description: "Type the name of the object for a db-lookup or insert the id of the object directly"
                        }
                    }
                },
                description: {
                    type: "string",
                    title: "Description",
                    description: "It's a not-required field, but it's recommended to fill it in for easier retrieval"
                },
                active: {
                    type: "boolean",
                    "default": "true"
                },
                support: {
                    type: "array",
                    title: "Support",
                    minItems: 1,
                    items: {
                        type: "array",
                        title: "Sequence",
                        minItems: 1,
                        items: {
                            type: "object",
                            title: "Advice",
                            properties: {
                                selector: {
                                    type: "string",
                                    minLength: 1,
                                    description: "The CSS selector of the element where the tooltip should appear"
                                },
                                translations: {
                                    title: "Translations",
                                    type: "array",
                                    minItems: 1,
                                    items: {
                                        type: "object",
                                        properties: {
                                            culture: {
                                                type: "string",
                                                minLength: 1,
                                            },
                                            text: {
                                                type: "string",
                                                minLength: 1,
                                                format: "textarea"
                                            }
                                        }
                                    }
                                },
                                duration: {
                                    type: "integer",
                                    description: "The time a tooltip shows in ms, this only applies if autoPlay is set"
                                },
                                position: {
                                    type: "string",
                                    description: "Position of the tooltip (default: top; other values: bottom, left, rigth)"
                                },
                                showOn: {
                                    type: "string",
                                    description: 'Predefined values are "mouseenter", "click" and "focus"'
                                },
                                autoplay: {
                                    type: "boolean"
                                },
                                keepOnChecking: {
                                    type: "boolean",
                                    description: 'set this to true if your element where to attach the tooltip gets destroyed and recreated'
                                },
                                remindXTimes: {
                                    type: "integer",
                                    description: "If this property is set, the tooltip appears only for the defined amount of times. Note that the counter increases only if the tooltip is shown and once per pageload."
                                },
                                width: {
                                    type: "integer",
                                    description: "Define the width in pixels."
                                }
                            }
                        }
                    }
                }
            }
        };
	}])
	.directive('uploadField',
		function () {
			return {
				restrict: "A",
				scope: {},
				bindToController: {
					onChange: "=",
					onChangeData: "=",
					formContainer: "=",
					kendoFileOptions: "=",
				},
				controllerAs: "u",
				controller: [
					"$scope",
					"$timeout",
					"$element",
					function ($scope, $timeout, $element) {
						let kendoUpload = initKendoUploadField($element, $scope.u.kendoFileOptions, $scope.u.formContainer);
						kendoUpload.bind('success', function (e) {
							console.log(kendoUpload);
							$scope.u.onChange(e, $scope.u.onChangeData);
						});
						$element.on('$destroy', function () {
							console.log('file upload destroyed');
						});
					}
				]
			}
		}
	)
});
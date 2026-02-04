define(["angular", "angular-kendo", "angular-magic-form-sp"], function (angular) {
	return angular
		.module("AssetsGis", ["kendo.directives", "magicFormSp"])
		.controller("AssetsGisController", [
			"config",
			"$timeout",
			"$scope",
			function (config, $timeout, $scope) {
				var self = this;
				self.callContext = "AssetsGis";
				if (!window.gmapTreeListLoaderSP)
					kendoConsole.log("window.gmapTreeListLoaderSP not defined !!!", true);

				self.labels = { operator: { it: "Operatore", en: "Operator" }, applyfilter: { it: "Applica filtro", en: "Apply filter" } };

				self.getLabels = function (key) {
					return self.labels[key][window.culture.substring(0, 2)];
				};
				self.grid = config().grid;
				config().setGrid = function (grid) {
					self.grid = grid;

					setTimeout(function () {
						$scope.$broadcast("gm-resize");
					}, 1100);
				};
				self.markers = [];
				self.mapOptions = {

				};
				var sessionID = config().sessionID ? config().sessionID : "505c0fc0-696d-492c-bf16-4737f606004c";
				var removeLayer_fn = function () { //Funzione che rimuoverà il layer da noi dichiarato precedentemente. Necessità della proprietà id del layer.
					MapStore2.triggerAction({
						type: 'REMOVE_LAYER',
						//layerId: "lista_edifici_lat_long" //Passaggio della proprietà id del layer come parametro,
						layerId: self.GISComponent.defaultLayerIDE
					});
				};

				self.GISComponent = {
					layerAdded: false,
					defaultLayerIDE:
						{ //Dichiarazione del layer che vogliamo aggiungere in mappa
							allowedSRS: {
								'EPSG:3857': true
							},
							id: config().featureId,
							name: config().featureName,
							type: "wms",
							url: config().gisServerApi,
							visibility: true,
							params: {
								CQL_FILTER: "SESSIONID = '" + sessionID + "'"
							}, //Filtro che controlla l'id sessione utente passato precedentemente. Questo permetterà di controllare gli utenti nella vista da cui andranno ricavati i dati da visualizzare in mappa.
							singleTile: true,
							featureInfo: {
								format: "PROPERTIES" //Questo formato di risposta ci permetterà di avere singolarmente le proprietà del layer
								//che ci interessano
							}
						},
					addLayer: function (layerIDE,data) { //Funzione che aggiungerà il layer da noi dichiarato precedentemente
					//	removeLayer_fn();
						config().MF.api.get({
							storedProcedureName: "CUSTOM.update_lista_edifici_lat_long",
							sessionID: sessionID,
							data: { selected: data }
						}).then(function (result) {
							$timeout(function () {
								if (!self.GISComponent.layerAdded) {
									MapStore2.triggerAction({
										type: 'ADD_LAYER',
										layer: layerIDE
									});
									self.GISComponent.layerAdded = true;
								}
								else
									MapStore2.triggerAction({
										type: 'CHANGE_LAYER_PROPERTIES',
										layer: layerIDE.id,
										newProperties: {
											_v_: new Date().getTime()
										}
									});
							}, 100);
						});
					},
					removeLayer: function (layerid) { //Funzione che rimuoverà il layer da noi dichiarato precedentemente. Necessità della proprietà id del layer.
						MapStore2.triggerAction({
							type: 'REMOVE_LAYER',
							layerId: layerid ? layerid : "lista_edifici_lat_long" //Passaggio della proprietà id del layer come parametro
						});
					}
				};

			
				self.treeFilters = { Operator: 'AND' };
				self.showFilters = false;
				self.filtersActive = false;
				self.options = config;
				self.detailInfo = [];
				self.showDetail = false;
				self.closeViewer = function () {
					self.showDetail ? self.showDetail = false : $('#mastercancelgis__').closest('#assets-gis-controller').hide(1000);
				};
				self.calcViewerClass = function () {
					if (self.showDetail)
						return "ggm-map col-md-5";
					return "ggm-map col-md-8";
				};
				self.options.onClick = function (marker) {
					if (!window.gmapDetailSP) {
						kendoConsole.log("gmapDetailSP window variable has not been set in AdminAreaCustomizations.js!", true);
						return;
					}
					// alert("handle:" + event.handle + " - tematid:" + event.tematid);
					self.currentDetailIdentifier = marker.data;
					config().MF.api.get({
						storedProcedureName: window.gmapDetailSP,
						data: marker.data
					}).then(function (result) {
						if (!result.length) {
							self.detailInfo = [];
							self.showDetail = false;
							return;
						}
						self.detailInfo = [];
						$.each(result[0], function (i, v) {
							self.detailInfo.push({ label: v.label, value: v.Value, bold: v.Bold });
						});
						self.showDetail = true;
						$timeout();
					}, function (err) {
						console.log(err);
					});
				};
				self.toggleFilter = function () {
					self.showFilters = !self.showFilters;
				};
				var sourceItemIds = $.map(self.grid.select(), function (v, i) {
					return self.grid.dataItem(v)[self.grid.dataSource.options.schema.model.id];
				});
				var sourcegridname = self.grid.element.attr("gridname");
				self.initGIS = function () { //Funzione che verrà richiamata alla creazione del body
					let GISipServer = config().gisServerIP;
					var deps = [GISipServer + "ater/dist/ms2-api.js", GISipServer + "ater/jsapi/LocalFunctions-min.js", "https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.3.10/proj4.js"];
					//div will appear
					config().ready();
					//wait 2 secs , require deps and init.
					$timeout(function () {
					requireConfigAndMore(deps, function () {
							//richiama la funzione che inzializza la mappa
							//@param {string} divID
							//@param {string} configUrl
							//@param {string} originalUrl
							LocalFunctions.initMap(config().mainDivId, config().configUrl, config().originalUrl);
							//richiama la funzione che recupera tutte le informazioni di tutte le feature
							//@param NULL
							LocalFunctions.getInfoFeatureSelection();
						});
					}, 500);
				};
				self.checkboxesTemplate = {
					template: "<input type='checkbox'\
                                #if (!item.checkable){#\
                                disabled /> \
                                #}else{#\
                                  />\
                                #}#"
				};
				self.TreesDs = {
					transport: {
						read: {
							url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
							dataType: "json",
							contentType: "application/json",
							data: { storedprocedure: window.gmapTreeListLoaderSP, gridname: sourcegridname, id: sourceItemIds, caller: self.callContext },
							type: "POST"
						},
						parameterMap: function (options, operation) {
							return kendo.stringify(options);
						}
					},
					schema: {
						parse: function (data) {
							return data[0].drows.length ? data[0].drows[0].Table : [];
						}
					}
				};
				//triggered on databound of the tree in order to load the form corresponding to the selected item in the drop down
				self.loadFilterForm = function (e) {
					if (self.selectedTree && self.selectedTree.select() > -1)
						self.formName = self.selectedTree.dataItem(self.selectedTree.select()).Form;
				}
				self.filterHandler = function () {
					if (!self.treeFilters)
						return null;

					var filterForDB = { Operator: self.treeFilters.Operator };
					var valuesArray = [];
					var obj = {}
					if (self.treeFilters.Values) {
						obj = {};
						$.each(self.treeFilters.Values, function (key, value) {
							var iof = key.indexOf('__filterOperator');
							if (iof != -1) {
								var sk = key.substring(0, iof);
								if (!obj[sk])
									obj[sk] = {
										condition: value
									};
								else
									obj[sk].condition = value;
							}
							else {
								if (!obj[key])
									obj[key] = { value: value };
								else
									obj[key].value = value;
							}

						});
					}
					$.each(obj, function (key, value) {
						valuesArray.push($.extend({ field: key }, value));
					});
					filterForDB.Values = valuesArray;
					return filterForDB;
				}
				self.resetViewer = function () {
					self.filtersActive = false;
					self.treeFilters = { Operator: "AND", Values: {} };
					$scope.$broadcast('schemaFormValidate');
					self.selectedTreeExpandedItem = null;
					self.markers = [];
				}
				self.onTreeChange = function (caller) {
					if (!caller)
						self.resetViewer();
					if (!self.selectedTree.dataItem(self.selectedTree.select()))
						return;
					self.treeLoaderSp = self.selectedTree.dataItem(self.selectedTree.select()).TreeContentSp;


					//The data load of the tree items
					self.selectedTreeData = new kendo.data.HierarchicalDataSource({
						transport: {
							read: {
								url: "/api/GENERICSQLCOMMAND/SelectDataSetFromXMLStoredProcedure",
								dataType: "json",
								contentType: "application/json",
								data: { storedprocedure: self.treeLoaderSp, gridData: { gridname: sourcegridname, id: sourceItemIds }, treeData: { id: self.selectedTree.value() }, treeFilter: self.filterHandler() },
								type: "POST"
							},
							parameterMap: function (options, operation) {
								options.treeData.expandedItem = self.selectedTreeExpandedItem ? self.selectedTreeExpandedItem : null;
								return kendo.stringify(options);
							}
						},
						schema: {
							parse: function (data) {
								if (!data[0].drows.length)
									return [];
								$.each(data[0].drows[0].Table, function (i, v) {
									v.ColourTemat = v.ColourTemat && v.ColourTemat.indexOf(" ") != -1 ? v.ColourTemat.replace(/ /g, '') : v.ColourTemat;
									if (v.ColourTemat.indexOf("#") == -1)
										v.ColourTemat = "#" + v.ColourTemat;
									//v.id = v.xidv;
								});
								return data[0].drows[0].Table;
							}
						}
					});
				}
				//data of the expanded node.It's called before the data load 
				self.setTreeExpandedItem = function (e) {
					self.selectedTreeExpandedItem = self.openTree.dataItem(e.node);
				}
				self.getMarkerInfo = function (node) {
					var markers = []
					if (node.markers && node.markers.indexOf('[') != -1) {
						try {
							markers = JSON.parse(node.markers);
						}
						catch (e) {
							console.log(node.markers);
						}
					}
					return $.map(markers, function (v, i) {
						v.color = node.ColourTemat;
						v.click = self.options.onClick;
						return v;
					});
				}
				self.getTematFromTree = function (e) {
					function arraysEqual(arr1, arr2) {
						if (arr1.length !== arr2.length)
							return false;
						for (var i = arr1.length; i--;) {
							if (arr1[i] !== arr2[i])
								return false;
						}

						return true;
					}

					function uncheckChildren(nodedata, isfirst) {
						if (nodedata.checked && !isfirst)
							nodedata.set("checked", false);
						if (nodedata.items)
							$.each(nodedata.items, function (i, v) {
								uncheckChildren(v, false);
							});
					}

					// Calculate intersection of multiple array or object values.
					function intersect(arrList) {
						var arrLength = Object.keys(arrList).length;
						// (Also accepts regular objects as input)
						var index = {};
						for (var i in arrList) {
							for (var j in arrList[i]) {
								var v = arrList[i][j];
								if (index[v] === undefined) index[v] = {};
								index[v][i] = true; // Mark as present in i input.
							};
						};
						var retv = [];
						for (var i in index) {
							if (Object.keys(index[i]).length == arrLength) retv.push(i);
						};
						return retv;
					};

					function getMarkersIntersection() {
						var all = []
						$.each(self.checkedThemes, function (key, value) {
							all.push(value.markers);
						});
						return intersect(all);
					}
					//Build the files based on checked items
					function buildMarkers(data, newmarkers, isIntersection) {
						if (!newmarkers)
							newmarkers = [];
						if (data.checked) {
							//se tra i nuovi file selezionati non c'e' quello del nodo corrente deseleziono il nodo
							$.each(self.getMarkerInfo(data), function (i, obj) {
								if (isIntersection) {
									if (self.intersectMarkers.indexOf(obj.id.toString()) != -1)
										newmarkers.push(obj);
								}
								else
									newmarkers.push(obj);

							});
						}
						if (data.items)
							$.each(data.items, function (i, v) {
								buildMarkers(v, newmarkers, isIntersection);
							});
					}

					//recur to top from node's parent
					function uncheckParentsWithValues(node) {
						var parentnode = self.openTree.parent(node);
						if (!parentnode || !parentnode.length)
							return;
						var parentdata = self.openTree.dataItem(self.openTree.parent(node));
						if (parentdata.checkable && parentdata.checked) {
							//se il nodo ha handles ed un file allora lo deseleziono per non avere conflitti
							if (self.getMarkerInfo(parentdata).length) {
								parentdata.set("checked", false);
							}
						}
						//recursively uncheck all parents with values 
						uncheckParentsWithValues(parentnode);

					}
					function getCheckedThemes(node, themes) {
						var theme = node.Treedesc ? node.Treedesc.split('|')[0] : '';
						var markers = self.getMarkerInfo(node);
						if (markers.length && node.checked && theme) {
							if (!themes[theme])
								themes[theme] = {
									markers: []
								};
							$.each(markers, function (k, value) {
								if (themes[theme].markers.indexOf(value.id) == -1)
									themes[theme].markers.push(value.id);
							});

						}
						if (node.items)
							$.each(node.items, function (i, v) {
								getCheckedThemes(v, themes);
							});
					}

					//marker dell' ultimo nodo checked
					var nodedata = e.sender.dataItem(e.node);
					var uncheckallbutcurrent = false;
					//a node without markers
					if (!self.getMarkerInfo(nodedata).length) {
						//still haven't loaded data...
						if (nodedata.hasChildren && nodedata.items && !nodedata.items.length) {
							nodedata.set("checked", false);
							self.openTree.expand(self.openTree.findByUid(nodedata.uid));
							return;
						}
						$.each(nodedata.items, function (i, v) {
							v.set("checked", nodedata.checked ? nodedata.checked : false);
						});
					}
					else
						uncheckallbutcurrent = true;

					if (nodedata.checked) {
						uncheckParentsWithValues(e.node);
						if (uncheckallbutcurrent && self.getMarkerInfo(nodedata).length)
							uncheckChildren(nodedata, true);
					}


					self.checkedThemes = {};
					newmarkers = [];
					$.each(self.openTree.dataSource.data(), function (i, v) {
						getCheckedThemes(v, self.checkedThemes);
					});

					self.intersectMarkers = getMarkersIntersection();
					if (Object.keys(self.checkedThemes).length > 1) //more than one theme has been selected --> INTERSECT
					{
						$.each(self.openTree.dataSource.data(), function (i, v) {
							buildMarkers(v, newmarkers, true);
						});
					}
					else //all the selected items have the same theme --> UNION
					{
						$.each(self.openTree.dataSource.data(), function (i, v) {
							buildMarkers(v, newmarkers, false);
						});
					}
					self.markers = newmarkers;
					self.GISComponent.addLayer(self.GISComponent.defaultLayerIDE, $.map(self.markers, function (v, i) {
						return { color: v.color, id: v.id }
					}));
				};

				self.filterTree = function (form) {
					$scope.$broadcast('schemaFormValidate');
					if (form.$valid) //reload the tree with the updated filter values 
					{
						self.showFilters = false;
						self.filtersActive = true;
						self.manageFilterForUser('apply').then(function () {
							self.onTreeChange('filter');
							$timeout();
							self.markers = [];
						});
					}
				}
				self.undoFilterTree = function () {
					self.showFilters = false;
					self.filtersActive = false;
					self.treeFilters = { Operator: "AND", Values: {} };
					$scope.$broadcast('schemaFormValidate');
					self.selectedTreeExpandedItem = null;
					self.manageFilterForUser('remove').then(function () {
						self.onTreeChange('filter');
						$timeout();
						self.markers = [];
					});
				}

				self.manageFilterForUser = function (useraction) {
					var deferred = $.Deferred();
					config().MF.api.get({
						storedProcedureName: config().userSessionManagementSp,
						data: {
							useraction: useraction,
							gridData: { gridname: sourcegridname, id: sourceItemIds },
							treeData: { id: self.selectedTree.value() },
							treeFilter: self.filterHandler()
						}
					})
						.then(function (result) {
							//anytime the user applies a filter the selected node is reset
							if (useraction == "apply")
								self.selectedTreeExpandedItem = null;
							deferred.resolve();
						}, function (err) {
							console.log(err);
						});
					return deferred.promise();
				}
				self.showActions = function () {
					if (!window.gmapActionSP) {
						kendoConsole.log("gmapActionSP window variable has not been set in AdminAreaCustomizations.js!");
						return;
					}
					openActionsTooltip({
						requestOptions: {
							caller: self.callContext,
							treeData: { id: self.selectedTree.value() },
							currentDetail: self.currentDetailIdentifier
						},
						storeProcedureName: window.gmapActionSP,
						accordionId: "gisViewerActionsAccordion",
						element: $('#actions___gmap')
					});
				}
				

			}
		]);
});
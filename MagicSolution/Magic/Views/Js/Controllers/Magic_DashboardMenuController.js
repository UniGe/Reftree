define(["angular"], function (angular) {
    return angular
        .module("DashboardMenu", [])
        .controller("DashboardMenuController", ["$timeout",
            function ($timeout) {
                getAngularControllerRootHTMLElement("DashboardMenu");

                var self = this;
                self.allApplicationsUrl = "/api/MAGIC_MMB_MODULES/GetAllApplicationAreas",
                self.menuItemsUrl = "/api/MenuData/GetMenu";
                self.tree = [];
                self.applicationAreas = [];
                self.maxLevel = 5; //max iterations, better a few more
                self.isReady = false;

                async function initApplicationAreas() { // (1) on init
                    try {
                        self.applicationAreas = await $.get(self.allApplicationsUrl);
                        self.applicationAreas.forEach((area, i) => {
                            area.isExpanded = false;
                        });
                        self.isReady = true;
                        $timeout();
                    }
                    catch (exc) {
                        console.log("Exception while getting application areas from "+ self.allApplicationsUrl, exc);
                    }
                }
                initApplicationAreas();               
                
                self.toggleModule = async function (appArea, toggledByHover) { // (2) on click
                    try {
                        if(typeof appArea.isInitializing == 'undefined') {
                            appArea.isInitializing = true;
                        }
                        $timeout();
                        clearTimeout(tOut);
                        if(toggledByHover && appArea.isExpanded) {
                            return;
                        }
                        
                        if(!appArea.isExpanded && !appArea.isInitialized) {

                            const menuItems = await $.ajax({
                                type: "POST",
                                url: self.menuItemsUrl,
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                data: JSON.stringify({ storedProcedure: appArea.Solver, applicationareaid: appArea.ID })
                            });
                            appArea.menuItems = initMenuItems(menuItems);
                            appArea.isInitialized = true;
                            appArea.isInitializing = false;
                        }
                        appArea.isExpanded = !appArea.isExpanded;
                        $timeout();
                    } catch (exc) {
                        console.log("Exception while getting menu items from " + self.menuItemsUrl, exc);
                    }
                };

                function initMenuItems(menuItems) { // (3) 
                    let tree = [];                    
                    let minLevel = 1860;
                    for (let level = 0; level < self.maxLevel; level++) {
                        let levelItems = getLevelItems(menuItems, level);

                        if (levelItems.length && level < minLevel) {
                            minLevel = level;
                        }

                        for (let i = 0; i < levelItems.length; i++) {
                            levelItems[i].children = getChildrenItems(menuItems, levelItems[i].ITEM_ID);
                            
                            if(levelItems[i].children.length == 0) {
                                let moduleId = levelItems[i].ITEM_PATH.split('|')[0];

                                let split = levelItems[i].ITEM_LABEL.split(' ');
                                if (split.length > 2 || levelItems[i].ITEM_LABEL.length > 18) {

                                    let occurenceToReplace = 2;
                                    if (split.length < 2 && levelItems[i].ITEM_LABEL.length > 18) {
                                        occurenceToReplace = 1;
                                    }

                                    let t = 0;
                                    levelItems[i].ITEM_LABEL = levelItems[i].ITEM_LABEL.replace(/ /g, match => ++t === occurenceToReplace ? '\n' : match)
                                }
                                

                                levelItems[i].href = "/app#/function/" + levelItems[i].ITEM_ID + "-" + moduleId + "-" + encodeURI(levelItems[i].ITEM_LABEL).replace(/%20/g, "-")
                            }


                            levelItems[i].isExpanded = false;
                            if (level == minLevel) {
                                tree.push(levelItems[i]);
                            }
                        }
                    }
                    return tree;
                }

                function getLevelItems(items, level) { // helper
                    return items.filter(function (item) {
                        return item.ITEM_LEVEL == level;
                    });
                }

                function getChildrenItems(items, parentId) { // helper
                    return items.filter(function (item) {
                        return item.ITEM_PARENTID == parentId;
                    });
                }

                self.toggleExpanded = function(item) {
                    item.isExpanded = !item.isExpanded;
                }

                let tOut;   //expand area if 1sec hovered
                self.mouseEnterModule = function(appArea) {
                    tOut = setTimeout(function() {
                        self.onOneSecondHover(appArea)
                    }, 1000)
                }
                self.mouseLeaveModule = function(appArea) {
                    clearTimeout(tOut);
                }
                self.onOneSecondHover = function(appArea) {
                    self.toggleModule(appArea, true);
                }

            }
        ]);
});
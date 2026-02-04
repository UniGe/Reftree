define(['angular'], function (angular) {
    var app = angular
    .module('Notifications', [])
    .filter('translate', function () {
        return function (text) {
            return getObjectText(text);
        }
    })
    .controller('NotificationsController', ['$http', '$scope', '$timeout', function ($http, $scope, $timeout) {
        var self = this,
            isDeveloper = window.UserIsDeveloper == true || window.UserIsDeveloper.toLowerCase() == "true",
            i;

		self.labels = {
			reply: { it: "Rispondi", en: "Reply" },
			showmore: { it: "Vedi altro...", en: "Show more..." },
			says: { it: "dice", en: "says" },
			members: { it: "Membri: ", en: "Members: " },
			youhaveunread: { it: "Messaggi in evidenza", en: "Relevant messages" },
			close: { it: "Chiudi", en: "Close" },
			closeandmarkasread: { it:"Chiudi e segna come letti" , en:"Close and mark as read"},

            //todo: add attach
		};
		self.translate = function (key) {
			return self.labels[key][window.culture.substring(0, 2)];
		};

        self.mailsCount = 0;
        self.mailsOpen = false;
        self.filter = false;
		self.notifications = [];
		self.notificationsToDisplayInModal = [];
		self.panelDismissed = false; //panel with unread notifications to show in "modal"
		if (sessionStorage.getItem('panelDismissed'))
			self.panelDismissed = true;
        self.errors = [];
        self.mails = [];
        self.events = [];
        self.unreadNotifications = 0;
        self.loadingNextPage = false;
        self.loadingMails = false;
        self.dateTimeFormat = kendo.culture().calendar.patterns.g;

        self.currentFilePicker = null;
		self.currentFilePickerArea = null;
		self.dontShowPanelAnymoreInSession = function (markAsRead) {
			sessionStorage.setItem('panelDismissed', 'true');
			if (markAsRead)
				self.notificationsToDisplayInModal.forEach((note) => {
					self.markAsRead(note.Id, note.Type, note.DatabaseId);
					note.Read = true;
				});
		}
		/**
		 * rediret to function with filter from notifications 
		 * @param {any} note - the notification data
		 */
		self.more = function (note) {
			//check if a gridName is specified inside the filter in order to override the default grid from the stored..
			var gridName, functionFilter,functionGUID,functionID;
			//{"functionGuid":"24BFF7F6-D17A-4ACB-AD94-8AF3AA97E420","functionId":7080,"gridName":"Table_fileupl_prova","filter":{"field":"num","operator":"gt","value":100}}
			try {
				var filterObj = JSON.parse(note.FunctionFilter);
				gridName = filterObj.gridName;
				if (filterObj.filter)
					functionFilter = $.extend(filterObj.filter, {type:"notificationFilter"});
				functionID = filterObj.functionId;
				functionGUID = filterObj.functionGuid;
			}
			catch (ex) {
				console.log(ex);
			}
			if (gridName && functionID && functionFilter) {
				setSessionStorageGridFilters(gridName, functionID, functionFilter, true);//the true value means that the filter will be ovewritten
			}
			//open in new window
			redirectToFunction(functionGUID,null,true);
		};

        self.loadNextNotifications = function ($scrollContainer) {
            self.loadingNextPage = true;
            $http.get("/api/StaticNotifications/GetByOffset/?offset=" + (self.errors.length + self.notifications.length), {
                responseType: "json"
            }).then(function (result) {
                if (result.data.length)
                    self.addNotifications(result.data);
                else
                    $scrollContainer.unbind('scroll');
                self.loadingNextPage = false;
            });
        };
        self.addNotifications = function (notifications) {
            if (isDeveloper) {
                for (i = 0; i < notifications.length; i++) {
					if (notifications[i].Type == "info") {
						self.notifications.push(notifications[i]);
						try {
							if (notifications[i].Tags)
								notifications[i].Tags = JSON.parse(notifications[i].Tags);
							}
						catch (e) {
							console.error(e);
						}
						try {
							if (notifications[i].ThreadMembers)
								notifications[i].ThreadMembers = JSON.parse(notifications[i].ThreadMembers);
						}
						catch (e) {
							console.error(e);
                        }
                        try {
                            if (notifications[i].AttachmentPath) {
                                notifications[i].AttachmentPath = JSON.parse(notifications[i].AttachmentPath);
                                notifications[i].Attachments = getAttachmentsDownloadLinks(notifications[i].AttachmentPath);
                            }                                
						}
						catch (e) {
							console.error(e);
						}
					}
                    else
						self.errors.push(notifications[i]);
                }
            } else
				self.notifications = self.notifications.concat(notifications);

			//search for unread notifications to be displayed in modal
			self.notifications.forEach((n) => {
				if (n.display_modal_unread && !n.Read) 
					self.notificationsToDisplayInModal.push(n);
			});
        };
        getAttachmentsDownloadLinks = function (attachments) {
            if (attachments == null || typeof attachments == 'undefined') {
                return;
            }
            var baseUrl = window.location.origin;
            baseUrl += "/api/MAGIC_SAVEFILE/GetFile?path=";
            var formattedAttachments = [];
            for (var i = 0; i < attachments.length; i++) {
                var a = {};
                a.name = attachments[i].name;
                a.link = baseUrl + attachments[i].name;
                formattedAttachments.push(a);
            }
            return formattedAttachments;
        };
        self.saveNotification = function (type, message) {
            $http.post("/api/StaticNotifications/Post/", {
                Type: type,
                Message: message
            }, {
                responseType: "application/json; charset=utf-8"
            }).then(function (result) {
                if (type == "error" && isDeveloper) {
                    self.unreadNotifications++;
                    self.errors.push($.parseJSON(result.data));
                } else if (type != "error") {
                    self.unreadNotifications++;
                    self.notifications.push($.parseJSON(result.data));
                }
            });
        };
        self.setMails = function (mails, internalCall) {
            self.mails = [];
            console.log("set mails", mails);
            for (i = 0; i < mails.length; i++) {
                self.mails.push({
                    Id: mails[i].Uid,
                    Read: false,
                    Type: "mail",
                    Date: mails[i].Date,
                    Title: mails[i].From.DisplayName || mails[i].From.Address,
                    Text: mails[i].Subject
                });
            }
            if (!internalCall)
                $scope.$apply();
        };
        self.setMailsCount = function (mailsCount, internalCall) {
            self.mailsCount = mailsCount;
            if (self.mailsOpen)
                self.loadMails();
            if (!internalCall)
                $scope.$apply();
        };
        self.clickNote = function (note, e) {
			if (note.Type == "mail")
				window.location = "/app?id=" + (note.Id || note.DatabaseId) + "#/mail";
            else {
				if (!note.Read && e.target.className.indexOf("remove-icon") == -1) {
					self.markAsRead(note.Id, note.Type, note.DatabaseId);
                    note.Read = true;
                }
                if (note.Type == "event")
                    window.location = "/app?start=" + note.Date + "#/calendar";
            }
        };
        self.markAllRead = function () {
            self.markAsRead("all");
			self.unreadNotifications = 0;
	    };
		self.markAsRead = function (id, type, dbid) {
            if (type != "event")
                self.unreadNotifications--;
            $http.post("/api/StaticNotifications/Read/", {
				Message:id || dbid,
				Type: type || "info",
				DatabaseId: dbid
			}).then(function (response) {
				if (id == "all") {
					$.each(self.notifications, function (i, note) {
						note.Read = true;
					});
					$.each(self.errors, function (i, error) {
						error.Read = true;
					});
				}
			});
        };
        self.markEventAsRead = function (id) {
            self.markAsRead(id, "event");
            $.each(self.events, function (k, v) {
                if(v.Id == id){
                    self.events.splice(k, 1);
                    return false;
                }
            });
        };
		self.deleteNote = function (note, e) {
			if (!note.DatabaseId)
                return;

            if (!note.Read)
				self.unreadNotifications--;
			note._Id = note.DatabaseId;
			var noteId = note.DatabaseId,
                $el = $(e.currentTarget).closest('[ng-repeat]');
			$http.post("/api/StaticNotifications/Delete/" + noteId);
            //delete Id to block doublecklick
			delete note.DatabaseId;
            $el.fadeOut(300, function () {
                $.each(note.Type != "error" ? self.notifications : self.errors, function (k, v) {
                    if (v._Id == noteId) {
                        $(e.currentTarget).closest('[scroll-trigger]').trigger('scroll');
                        (note.Type != "error" ? self.notifications : self.errors).splice(k, 1);
                        $el.show(); //undo fadeout
                        $timeout();
                        return false;
                    }
                });
            });
        };
        self.showAttachmentArea = function(note, e) {
            note.showAttachmentArea = true;
            self.currentFilePickerArea = $(e.currentTarget).parent().children('.notification_filepicker_area');
            self.currentFilePicker = self.currentFilePickerArea.children('.notification_filepicker');
            self.fileUploadInit(self.currentFilePicker, self.currentFilePickerArea);
        };
        self.fileUploadInit = function (input, container) {
            var options = {
                success: function (e) {
                    uploadSuccess(e, container);
                }
            };
            initKendoUploadField(input, options, container);
        };
		self.replyToNote = function (note, e) {
			if (!note.Id && !note.DatabaseId)
				return;

			if (!note.Read)
                self.unreadNotifications--;

            doModal(true);
            var files = self.currentFilePickerArea.data().filesToSave;
            var cleanFiles = [];
            $.each(files, function (i, file) {
                cleanFiles.push({ name: file.name });
            })
            if (files) {
                //var files = self.currentFilePickerArea.data("kendoUpload").options.files;
                manageGridUploadedFiles(self.currentFilePickerArea).then(function () {
                    postToMF(note, cleanFiles); //save with attachments
                });
                return;
            }
            postToMF(note); //save without attachments
        };
        postToMF = function (note, attachmentPath = null) {
            var data = {
				//title: self.title,
				message: note.Reply,
                DocumentRepository_ID: note.DocumentRepositoryId,
                attachmentPath: JSON.stringify(attachmentPath),
            };
            $.post({
                url: "/api/DocumentRepository/ReplyToGridMessage/",
                data: JSON.stringify(data),
                contentType: 'application/json'                
            }).then(function (success) { //TODO: check then
					kendoConsole.log(getObjectText('genericok'), false);
                note.showReplyTextArea = false;
                self.refreshNotifications();
                $timeout();
                doModal(false)                
            }, function (error) {
                    doModal(false)
					console.error(error);
					kendoConsole.log(getObjectText('genericko'), true);
				});
        };        		
        self.loadMails = function () {
            if (!self.loadingMails && self.mailsCount != self.mails.length) {
                if (self.mailsCount) {
                    self.loadingMails = true;
                    $http.post("/api/Mail/GetUnread/", {
                        number: 1,
                        box: "INBOX"
                    }, {
                        responseType: "json"
                    }).then(function (result) {
                        if (result.data.unreadMessages) {
                            self.setMails(result.data.unreadMessages, true);
                        }
                        self.loadingMails = false;
                    });
                } else {
                    self.setMails([]);
                }
            }
        };
		self.checkDropdownClick = function (e) {
			if ($(e.target).closest('.dropdown-menu.notification').length)
				e.stopPropagation();
		};

		self.refreshNotifications = function () {
			self.notifications = [];
			self.errors = [];
			$http.get("/api/StaticNotifications/Get/", {
				responseType: "json"
			}).then(function (result) {
				self.addNotifications(result.data.notifications);
				self.unreadNotifications += result.data.unreadNotificationsCount;
			});
		};

        if (window.notifications) {
            if ("mails" in window.notifications)
                self.setMailsCount(window.notifications.mails, true);
            if ("notes" in window.notifications)
                $.each(window.notifications.notes, function (k, v) {
                    self.saveNotification(v.Type, v.Message);
                });

            delete window.notifications;
        }

        $http.get("/api/StaticNotifications/Get/", {
            responseType: "json"
        }).then(function (result) {
            self.addNotifications(result.data.notifications);
            for (i = 0; i < result.data.events.length; i++) {
                self.events.push({
                    Id: result.data.events[i].id,
                    Read: false,
                    Type: "event",
                    Date: result.data.events[i].event_start,
                    Title: "Event",
                    Text: result.data.events[i].title
                });
            }
            initPopupNotifications(result.data.events);
			self.unreadNotifications += result.data.unreadNotificationsCount;
			if (self.unreadNotifications)
				kendoConsole.log(getObjectText("youhavenotificationstoread").format(self.unreadNotifications));
        });



        var initPopupNotifications = function (eventNotifications) {
            if (!eventNotifications)
                return;
            var offset = new Date().getTimezoneOffset() * 60000;
            $.each(eventNotifications, function (k, noti) {
                eventNotifications[k].notify_at = Date.parse(eventNotifications[k].notify_at) + offset;
            });
            handlePopupNotifications(eventNotifications)
        },
        handlePopupNotifications = function (eventNotifications) {
            var now = Date.now() + 5000;
            while (eventNotifications.length && eventNotifications[0].notify_at <= now) {
                showPopupNotification(eventNotifications.shift());
            }
            if (eventNotifications.length) {
                var nextRound = eventNotifications[0].notify_at - Date.now();
                if (nextRound <= 0)
                    handlePopupNotifications(eventNotifications);
                else
                    setTimeout(function () { handlePopupNotifications(eventNotifications) }, nextRound);
            }
        },
        showPopupNotification = function (notification) {
            kendoConsole.log(notification.title + '<br>' + getObjectText("start") + ": " + new Date(notification.event_start.replace("T", " ")).toLocaleString() + '<br><br><a style="color: #fff;" href="javascript:void(0)" onclick="angular.element($(\'[ng-controller*=NotificationsController]\')).scope().nc.markEventAsRead(' + notification.id + ')">' + getObjectText("read") + '</a>', "event");
        };
    }])
    .directive('scrollTrigger', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.bind('scroll', function () {
                    if (!scope.nc.loadingNextPage && element[0].scrollTop + element[0].offsetHeight >= element[0].scrollHeight - 100) {
                        scope.nc.loadNextNotifications(element);
                    }
                });
            }
        };
    })
    .directive('dropdownTrigger', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element
                    .on('show.bs.dropdown', function () {
                        scope.nc.mailsOpen = true;
                        scope.nc.loadMails();
                    })
                    .on('hide.bs.dropdown', function () {
                        scope.nc.mailsOpen = false;
                    });
            }
        };
    })
    .directive('popoverTrigger', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var clickOnElement = false,
                    $parent = element.parent(),
                    $popover = $parent.find('.popover'),
                    $arrow = $popover.find('.arrow');
                element
                    .on('click', function () {
                        clickOnElement = true;
                        var offset = $parent.offset(),
                            left = element.width() / 2 - $popover.width() / 2;

                        if (left < -offset.left) {
                            left = -offset.left;
                            $arrow.css('left', offset.left + element.width() / 2);
                        } else
                            $arrow.removeAttr('style');

                        if ($popover.is(":visible")) {
                            $popover.fadeOut(150);
                            scope.nc.mailsOpen = false;
                        } else {
                            $popover.css({ top: element.height(), left: left }).fadeIn(150);
                            scope.nc.mailsOpen = true;
                            scope.nc.loadMails();
                        }
                    });
                $popover.click(function () {
                    clickOnElement = true;
                });
                $(window).click(function () {
                    if (!clickOnElement && $popover.is(":visible")) {
                        $popover.fadeOut(150);
                        scope.nc.mailsOpen = false;
                    }
                    clickOnElement = false;
                });
            }
        };
    });
});
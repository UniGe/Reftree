define(["angular", "angular-kendo", "TagSelector"], function (angular) {
    return angular
        .module("GridMessage", ["kendo.directives"])
        .controller("GridMessageController", [
            "config",
            "$http",
            //    "$scope",
            function (config, $http) {
                var self = this;
                self.fileUploadInit = function () {
                    var $input = $('#grid_message_attachment_filepicker');
                    var $container = $('#win___');
                    var options = {
                        success: function (e) {
                            uploadSuccess(e, $container);
                        }
                    };
                    initKendoUploadField($input, options, $container);
                };
                self.labels = {
                    title: { it: "Oggetto", en: "Subject", de: "Betreff" },
                    message: { it: "Messaggio", en: "Message", de: "Nachricht" },
                    save: { it: "Invia", en: "Send", de: "Senden" },
                    sendMessage: { it: "Invia un messaggio", en: "Send a message", de: "Nachricht senden" },
                    selectUsers: { it: "Destinatario/i", en: "To", de: "An" },
                    tags: { it: "Tags", en: "Tags", de: "Tags" },
                    attachments: { it: "Allegati", en: "Attachments", de: "Anhänge" }
                };
                self.translate = function (key) {
                    return self.labels[key][window.culture.substring(0, 2)];
                };

                self.grid = config().grid;
                self.boDescriptions = $.map(config().boIds, function (v, i) {
                    return v.description;
                });
                //window options
                self.kwoptions = {
                    title: self.translate('sendMessage'),
                    close: function (e) {
                        this.destroy();
                    },
                    open: function () {
                        self.kwindow = this;
                        self.kwindow.center();
                        self.$tags = $('#message_tags___');
                        self.$tags.tagSelector();
                    },
                    modal: true,
                    width: 600
                };
                //kendo multiselect options

                self.selectOptions = {
                    placeholder: "Select users...",
                    dataTextField: "UserDescription",
                    dataValueField: "UserID",
                    valuePrimitive: true,
                    dataSource: config().users
                };
                self.submit = function (mc) {
                    if (typeof self.selectedUserIds === 'undefined') {
                        alert("Please specify a receiver and try again!");
                        return;
                    }
                    doModal(true);
                    manageGridUploadedFiles(self.kwindow.element).then(function () {
                        var files = $('#grid_message_attachment_filepicker').data("kendoUpload").options.files;

                        var data = {
                            //title: self.title,
                            message: self.message,
                            tags: self.tags ? self.tags.split(',') : [],
                            selectedUserIds: self.selectedUserIds,
                            boIds: config().boIds,
                            boType: config().boType,
                            gridname: self.grid.element.attr("gridname"),
                            //{"functionGuid":"24BFF7F6-D17A-4ACB-AD94-8AF3AA97E420","functionId":7080,"gridName":"Table_fileupl_prova","filter":{"field":"num","operator":"gt","value":100}}
                            gridpk: self.grid.dataSource.options.schema.model.id,
                            functionGuid: getCurrentFunctionGUIDFromMenu(),
                            functionId: getCurrentFunctionID(),
                            attachmentPath: JSON.stringify(files)
                        };



                        $http.post("/api/DocumentRepository/AddGridMessage/", data)
                            .then(function (success) {
                                self.kwindow.close();
                                kendoConsole.log(getObjectText('genericok'), false);
                                doModal(false)
                            }, function (error) {
                                doModal(false)
                                console.error(error);
                                kendoConsole.log(getObjectText('genericko'), true);
                            });
                    });


                };

            }
        ]);
});
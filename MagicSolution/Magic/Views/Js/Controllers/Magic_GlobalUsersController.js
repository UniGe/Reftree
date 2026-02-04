(function () {
    var angular;

    define(["angular", "angular-animate", "angular-search-drop"], function (a) {
        angular = a;
        controller.apply({}, arguments);
        return init;
    });

    function init() {
        var element = getAngularControllerRootHTMLElement("GlobalUsers");
        $("#grid").html(element);
        angular.bootstrap(element, ["GlobalUsers"]);
    }

    function controller(angular) {
        angular
        .module("GlobalUsers", ["ngAnimate", "searchDrop"])
        .controller("GlobalUsersController", [
            "$http",
            "$timeout",
            function ($http, $timeout) {
                var self = this;
                self.users = [];
                self.searchTerm = "";
                self.userInEdit = null;
                self.applications = [];
                self.applicationsEditable = [];

                self.getUsers = function (searchTerm) {
                    return $http.get("/api/Auth/GlobalUsersList?q=" + (searchTerm || ""))
                    .then(
                        function (res) {
                            return res.data;
                        }
                    );
                };

                self.search = function () {
                    $timeout.cancel(self.searchTimeout);
                    var currentTimeout = self.searchTimeout = $timeout(function () {
                        self.getUsers(self.searchTerm)
                        .then(function (users) {
                            if (currentTimeout == self.searchTimeout)
                                self.users = users;
                        });
                    }, 500);
                };

                self.deleteUser = function (user) {
                    if (confirm("Delete " + user.username + "?")) {
                        $http.delete("/api/Auth/DeleteGlobalUser/" + user.id)
                        .then(
                            function () {
                                kendoConsole.log("Deleted global user: " + user.username);
                                $.each(self.users, function (k) {
                                    if (self.users[k].id == user.id) {
                                        self.users.splice(k, 1);
                                        return false;
                                    }
                                });
                            },
                            function (res) {
                                kendoConsole.log("Error while deleting global user: " + user.username + " Error: " + res.data, true);
                            });
                    }
                };

                self.addUser = function (user) {
                    $http.post("/api/Auth/CreateGlobalUser", user)
                    .then(
                        function (res) {
                            self.search();
                            kendoConsole.log("Global user " + user.username + " successfully created.");
                        },
                        function (res) {
                            kendoConsole.log("Error while creating global user: " + user.username + " Error: " + res.data, true);
                        }
                    );
                };

                self.getApplications = function () {
                    return $http.get("/api/Auth/GlobalUserApplicationsList")
                    .then(function (res) {
                        self.applications = res.data;
                        self.applicationsEditable = [];
                        $.each(self.applications, function (k, v) {
                            self.applicationsEditable.push($.extend({}, v));
                        });
                    });
                };

                self.selectApplication = function (application) {
                    if (application === "")
                        return;
                    if (!self.userInEdit.applications)
                        self.userInEdit.applications = [];
                    if (!self.doesUserInEditContainsApplication(application))
                        self.userInEdit.applications.push($.extend({active: true}, application));
                    return "";
                };

                self.doesUserInEditContainsApplication = function (application) {
                    var doesContain = false;
                    $.each(self.userInEdit.applications, function (k, v) {
                        if (application.id == v.id) {
                            doesContain = true;
                            return false;
                        }
                    })
                    return doesContain;
                };

                self.getUserPermissions = function (user) {
                    return $http.get("/api/Auth/GlobalUserPermissions/" + user.id)
                    .then(function (res) {
                        return res.data;
                    });
                };

                self.setUserInEditPermissions = function (user) {
                    self.getUserPermissions(user)
                    .then(function (permissions) {
                        self.userInEdit.applications = permissions;
                    });
                };

                self.saveUser = function (user) {
                    if (self.$userForm.$valid) {
                        doModal(true);
                        $http.post("/api/Auth/SaveGlobalUser", user)
                        .then(
                            function () {
                                kendoConsole.log(user.username + " saved succesfully.");
                            },
                            function (res) {
                                kendoConsole.log("Error while saving global user: " + user.username + " Error: " + res.data);
                            }
                        )
                        .finally(function () {
                            doModal(false);
                        });
                        return;
                    }
                };

                self.saveApplication = function (application) {
                    if (application.$form.$invalid || application.$form.pristine)
                        return;
                    $http.post("/api/Auth/SaveApplication", application)
                        .then(
                            function () {
                                kendoConsole.log(application.application_name + " saved succesfully.");
                            },
                            function (res) {
                                kendoConsole.log("Error while saving application: " + application.application_name + " Error: " + res.data);
                            }
                        )
                        .finally(function () {
                            doModal(false);
                        });
                    setTimeout(function () { 
                        self.getApplications();
                    }, 200);
                };

                self.deleteApplication = function (application) {
                    if (confirm("Are you sure you want to delete " + application.application_name)) {
                        $http.delete("/api/Auth/DeleteApplication/" + application.id)
                        .then(
                            function () {
                                kendoConsole.log("Deleted application: " + application.application_name);
                                setTimeout(function () {
                                    self.getApplications();
                                }, 200);
                            },
                            function (res) {
                                kendoConsole.log("Error while deleting application: " + application.application_name + " Error: " + res.data, true);
                            });
                    }
                };

                //init
                self.getApplications();
                self.getUsers()
                .then(function (users) {
                    self.users = users;
                });
            }
        ]);
    }
}());
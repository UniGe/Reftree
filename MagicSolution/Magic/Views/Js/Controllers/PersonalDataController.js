define(['angular', 'bootstrap-decorator'], function (angular) {
    var authLink = null;
    var initialGoogleCalendarMail = null;

    angular
    .module('PersonalData', ['schemaForm'])
    .directive('errSrc', function () {
        return {
            link: function (scope, element, attrs) {
                element.bind('error', function () {
                    if (!attrs.src.match(/^https?:\/\/.+/i)) {
                        var fileName = decodeURIComponent(attrs.src).replace(/^\/.+\//, ""),
                            filesToSave = $(".personal-data").data("filesToSave");
                        if (fileName && filesToSave) {
                            $.each(filesToSave, function (k, v) {
                                if (v.name == fileName) {
                                    attrs.$set('src', '/api/MAGIC_SAVEFILE/GetFile?path=' + encodeURIComponent(v.tmpFile + "|" + v.name));
                                    return false;
                                }
                            });
                        }
                    }
                });
            }
        }
    })
		.controller('PersonalDataController', ['$http', '$scope', '$q', function ($http, $scope, $q) {
			var self = this;
			//password has expired force user to change it!!!!
			if (window.location.href.split("?").indexOf("mandatory=true") != -1) {
				if (typeof removeOuterComponents == "function")
					removeOuterComponents(); //to be defined in the specific template js in Magic\v
				self.reloadPage = true;
			}
		self.model = {};
        self.passwordModel = {};
        self.$form = {};
        self.$passwordForm = {};
        self.updateUrl = '/api/Magic_Mmb_Users/UpdateAccount/';
        self.readUrl = '/api/Magic_Mmb_Users/GetSessionUser/0';
        self.labels = {
			'save': getObjectText('save'),
			'passwordExpired': getObjectText('passwordExpired'),
			'passwordExpiredWarning': getObjectText('passwordExpiredWarning')
        };

        $scope.$on('sf-render-finished', function (event, data) {
            setTimeout(self.addFormFunctionality, 10);
        });

		self.preventXSS = function () {
			$.each(self.model, function (key, value) {
				//prevent XSS cross side scripting
				if (typeof value == "string") {
					var p = document.createElement("p");
					p.textContent = value;
					self.model[key] = p.innerHTML;
				}

				});
			}
        self.submit = function (e) {
            e.preventDefault();
            if (validate(self.$form, 'personal-data') && self.$form.$dirty) {
                self.preventXSS(); // Run XSS prevention

                manageGridUploadedFiles($(".personal-data"))
                    .then(function () {
                        // File operations are successful, proceed with user data update
                        return $http.post(self.updateUrl, { model: JSON.stringify(self.model) })
                            .then(function () {
                                if (self.$form["UserImg"].$dirty && manageFileRequest) {
                                    $("img[id*=userselectedpic][onerror]")
                                        .attr("src", self.model.UserImg)
                                        .css("visibility", "hidden")
                                        .parent()
                                        .css("background-image", 'url(' + self.model.UserImg + ')');
                                }

                                kendoConsole.log('Success', false);
                                var $completenessContainer = $('#profilecompleteness');
                                if ($completenessContainer.length)
                                    angular.element($completenessContainer).scope().pccs.data.update();
                            }, function (res) {
                                kendoConsole.log(res.data || "", true);
                            });
                    })
                    .then(function () {
                        self.$form.$setPristine()
                    }, function (error) {
                        // Handle the error from file operations
                        kendoConsole.log("Error in file operations: " + error, true);
                    });
}
            };

            self.submitPassword = function (e) {
                e.preventDefault();
                if (validate(self.$passwordForm, 'password') && self.$passwordForm.$dirty) {
                    $http.post('/api/Magic_Mmb_Users/changePassword', {
                        oldp: self.passwordModel.OldPassword,
                        newpwd: self.passwordModel.NewPassword,
                        confirmednewpwd: self.passwordModel.ConfirmNew,
                        Username: self.model.Username
                    })
                        .then(function (response) {
                            if (response.status === 200) {
                                kendoConsole.log('Successfully changed password', false);
                                self.passwordModel.OldPassword = '';
                                self.passwordModel.NewPassword = '';
                                self.passwordModel.ConfirmNew = '';
                                if (self.reloadPage) {
                                    window.location.href = "/dashboard-v2";
                                } else {
                                    self.$passwordForm.$setPristine()
                                }
                            } else if (response.status === 206) {
                                // Partial success
                                kendoConsole.log('Warning: ' + (response?.data?.message || 'Some accounts failed to update. Please contact support.'), true);
                            } else {
                                // Unexpected success status
                                kendoConsole.log('Warning: Unexpected response. ' + (response?.data?.message || 'Please contact support.'), true);
                            }
                        }, function (error) {

                            //if the error has the code, translate it through Labels, and give the right one. to translate the label use getObjectText()

                            function getDefaultErrorMessage(status) {
                                switch (status) {
                                    case 400:
                                        return 'Bad request. Please check your input.';
                                    case 403:
                                        return 'You do not have permission to perform this action.';
                                    case 500:
                                        return 'An internal server error occurred. Please try again later.';
                                    default:
                                        return 'An unexpected error occurred. Please try again.';
                                }
                            }

                            let errorMessage;

                            if (error?.data?.code && !error?.data?.message) {
                                // Construct the label key - assuming your error codes are like AUTH001, AUTH002, etc.
                                const labelKey = 'ERROR_' + error.data.code;  // This will create keys like ERROR_AUTH001
                                errorMessage = getObjectText(labelKey);

                                // Fallback if translation not found
                                if (!errorMessage) {
                                    errorMessage = (error.data == "Password change failed" ? getDefaultErrorMessage(error.status) : error.data);
                                }
                            }
                            else {
                                errorMessage = (error.data == "Password change failed" ? getDefaultErrorMessage(error.status) : (error.data.message ?? error.data));
                            }
                            kendoConsole.log(errorMessage, true);
                        });
                }
            }

            function validate($form, type) {
                $('.' + type + '-form .nav-tabs .k-tab-error-underline').remove();
                if (!$form.$valid) {
                    var errorFieldNames = [];
                    $.each($form.$error, function (validator, fields) {
                        $.each(fields, function (k, field) {
                            if (!(field.$name in errorFieldNames)) {
                                var tab = $('#' + field.$name).closest('.tab-pane'),
                                    navItem;
                                $.each(tab[0].parentNode.children, function (k, v) {
                                    if (v == tab[0]) {
                                        navItem = $('.' + type + '-form .nav-tabs li:eq(' + k + ') a');
                                        $('<div class="k-tab-error-underline" style="display: none;">').insertAfter(navItem).show(300);
                                    }
                                });
                                errorFieldNames.push(field.$name);
                            }
                        });
                    });
                }
                return $form.$valid;
            }

			self.addFormFunctionality = function () {
				if (self.reloadPage)
					$("#mandatorypasswordchange").modal('show');
            $container = $(".personal-data");
            $container.find("input[type=file]:not([data-role])").each(function () {
                var $this = $(this),
                    $img = $this.closest('sf-decorator').find('img'),
                    field = this.name === "ui" ? "UserImg" : "UserSymbolImg";

                initKendoUploadField($this, {
                    savepath: "/Views/AccountImages/",
                    multiple: false,
                    files: self.$form[field].$viewValue && !self.$form[field].$viewValue.match(/^https?:\/\/.+/i) ? [{ name: decodeURIComponent(self.$form[field].$viewValue).replace(/^\/.+\//, "") }] : [],
                    success: function (e) {
                        uploadSuccess(e, $container);
                        if (e.operation == 'upload') {
                            var filePath = "/Views/AccountImages/" + e.files[0].name;
                            if (window.FileUploadRootDir)
                                filePath = "/api/MAGIC_SAVEFILE/GetFile?path=" + encodeURIComponent(filePath)
                            self.$form[field].$setViewValue(filePath);
                        } else {
                            self.$form[field].$setViewValue("");
                            $img.attr('src', '');
                        }
                    }
                });
            });
        };

        self.filleUploadImages = function () {
            if (self.model.UserImg && !self.model.UserImg.match(/^https?:\/\//i) && $('input[name=ui][data-role]').length)
                $('input[name=ui][data-role]').data("kendoUpload")._renderInitialFiles([{ name: decodeURIComponent(self.model.UserImg).replace(/^\/.+\//, "") }]);
            if (self.model.UserSymbolImg && !self.model.UserSymbolImg.match(/^https?:\/\//i) && $('input[name=us][data-role]').length)
                $('input[name=us][data-role]').data("kendoUpload")._renderInitialFiles([{ name: decodeURIComponent(self.model.UserSymbolImg).replace(/^\/.+\//, "") }]);
        }

        self.form = [
            {
                type: "fieldset",
                items: [
                    {
                        "type": "tabs",
                        "tabs": [
                            {
                                "title": getObjectText('personaldata'),
                                "items": [
                                    {
                                    "type": "section",
                                    "htmlClass": "row",
                                    "items": [
                                            {
                                                "type": "section",
                                                "htmlClass": "col-sm-6",
                                                "items": ["Username", "FirstName", "Mobile",
                                                        {
                                                            "key": "UserImg",
                                                            "type": "hidden",
                                                        },
                                                        {
                                                            "type": "template",
                                                            "template": '<img ng-src="{{model.UserImg}}" err-src style="max-height:50px;" /><input type="file" name="ui" accept=".jpg,.jpeg,.png,.gif" /><p class="visible-xs-block">&nbsp;</p>'
                                                        },
                                                    ]
                                            },
                                            {
                                                "type": "section",
                                                "htmlClass": "col-sm-6",
                                                "items": ["Email", "LastName", "Telephone", "PersonalwebSite",
                                                            {
                                                                "key": "UserSymbolImg",
                                                                "type": "hidden",
                                                            },
                                                             {
                                                                 "type": "template",
                                                                 "template": '<img ng-src="{{model.UserSymbolImg}}" err-src style="max-height:50px;" /><input type="file" name="us" accept=".jpg,.jpeg,.png,.gif" />'
                                                             }
                                                    ]
                                            },
                                        ]
                                    }
                                ]
                            },
                            {
                                "title": getObjectText('company'),
                                "items": [
                                    {
                                        "type": "section",
                                        "htmlClass": "row",
                                        "items": [
                                                {
                                                    "type": "section",
                                                    "htmlClass": "col-sm-6",
                                                    "items": ["CompanyName",
                                                        {
                                                        "key": "CompanyInfo",
                                                        "type": "textarea"
                                                        },
                                                    ]
                                                },
                                                {
                                                    "type": "section",
                                                    "htmlClass": "col-sm-6",
                                                    "items": ["CompanyWebSite"]
                                                },
                                        ]
                                    }
                                ]
                            },
                        ]
                    }
                ]
            },
        ];
        self.passwordForm = [
            {
                type: "fieldset",
                items: [
                    {
                        "type": "tabs",
                        "tabs": [
                            {
                                "title": "Password",
                                "items": [
                                    {
                                        "type": "section",
                                        "htmlClass": "row",
                                        "items": [
                                            {
                                                "type": "section",
                                                "htmlClass": "col-sm-6",
                                                "items": [
                                                    {
                                                        "key": "OldPassword",
                                                        "type": "password"
                                                    },
                                                ]
                                            },
                                            {
                                                "type": "section",
                                                "htmlClass": "col-sm-6",
                                                "items": [
                                                    {
                                                        "key": "NewPassword",
                                                        "type": "password"
                                                    },
                                                    {
                                                        "key": "ConfirmNew",
                                                        "type": "password-confirm",
                                                        "condition": "model.NewPassword"
                                                    },
                                                ]
                                            },
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ];
        self.schema = {
            "type": "object",
            "properties": {
                "Username": {
                    "title": getObjectText('username'),
                    "type": "string",
                    maxLength: 50,
                    readonly: true
                },
                "Email": {
                    "title": 'Email',
                    "type": "string",
                    maxLength: 100,
                },
                "FirstName": {
                    "title": getObjectText('firstname'),
                    "type": "string",
                    maxLength: 50
                },
                "LastName": {
                    "title": getObjectText('lastname'),
                    "type": "string",
                    maxLength: 50
                },
                "Mobile": {
                    "title": 'Mobile',
                    "type": "string",
                    maxLength: 20
                },
                "Telephone": {
                    "title": 'Tel.',
                    "type": "string",
                    maxLength: 20
                },
                "PersonalwebSite": {
                    "title": getObjectText('website'),
                    "type": "string",
                    maxLength: 100
                },
                "UserImg": {
                    "title": 'Avatar',
                    "type": "string"
                },
                "UserSymbolImg": {
                    "title": 'Symbol',
                    "type": "string"
                },
                "CompanyName": {
                    "title": getObjectText('companyname'),
                    "type": "string",
                    maxLength: 50
                },
                "CompanyWebSite": {
                    "title": getObjectText('website'),
                    "type": "string",
                    maxLength: 50
                },
                "CompanyInfo": {
                    "title": getObjectText('companyinfo'),
                    "type": "string",
                },
            },
            "required": [
              "Username",
            ]
        };
        self.passwordSchema = {
            "type": "object",
            "properties": {
                "OldPassword": {
                    "title": getObjectText('oldpassword'),
                    "type": "string",
                    maxLength: 100
                },
                "NewPassword": {
                    "title": getObjectText('newpassword'),
                    "type": "string",
                    maxLength: 100
                },
                "ConfirmNew": {
                    "title": getObjectText('confirmnewpassword'),
                    "type": "string",
                    maxLength: 100
                }
            }
        };

        self.setup = function () {
            $http.get(self.readUrl)
            .then(function (res) {
                self.model = Object.assign(res.data[0], {
                    MailPassword: undefined,
                    MailServerURL: undefined,
                    MailPort: undefined,
                    MailProtocol: undefined,
                    MailSSL: undefined,
                    SMTPPassword: undefined,
                    SMTPServerURL: undefined,
                    SMTPPort: undefined,
                    SMTPSSL: undefined,
                    PredefinedMailSettings: undefined,
                    SMTPAccountName: undefined,
                    MailAccountName: undefined,
                    GoogleCalendarMail: undefined
                });
                initialGoogleCalendarMail = res.data[0].GoogleCalendarMail;
                self.filleUploadImages();
            });
        };

        (function () {
            if (window.personalDataOverwrite)
                eval('(' + window.personalDataOverwrite + ')()');
            self.setup();
        })();
    }])
    .directive('passwordConfirm', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, attr, element, ngModel) {
                var error;
                scope.customError = function () {
                    return scope.schemaError() || error;
                };

                scope.$watch(element.passwordConfirm, function (value) {
                    scope.passwordConfirm = value;
                    ngModel.$validate();
                });

                ngModel.$validators.match = function (modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    if (value != scope.passwordConfirm) {
                        error = { code: 'match', message: 'Passwords do not match.' };
                        return false;
                    }
                    delete error;
                    return true;
                };
            }
        };
    })
    .config(['schemaFormDecoratorsProvider', function (schemaFormDecoratorsProvider) {
        schemaFormDecoratorsProvider.addMapping(
            'bootstrapDecorator',
            'password-confirm',
            'password-confirm.html'
        );
    }])
    .run(['$templateCache', function ($templateCache) {
        var tmpl = $templateCache.get('directives/decorators/bootstrap/default.html');
        $templateCache.put(
		    'password-confirm.html',
		    tmpl.replace('type="{{form.type}}"', 'type="password" password-confirm="{{form.condition}}"').replace(/\(error\)/g, 'customError')
	    );
    }]);
});
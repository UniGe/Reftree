// JavaScript source code
//inside the functions "this" is the controller scope (e.g onChange)
(function () {
    var extension = {};

    extension.downloadCustomDocument = function (event, tipdocCode) {
        var AcceptBox = document.getElementById('acceptCheckbox');
        try {
            DownloadAuthDocument(tipdocCode);
            $("#acceptCheckbox").prop("disabled", false);
            AcceptBox.removeAttribute('disabled');

        } catch (error) {
            AcceptBox.setAttribute('disabled', 'disabled');
            console.log.apply(error);
        }
    };

    extension.showModal = function () {
        requireConfigAndMore(["MagicSDK"], function (MF) {
            MF.api
                .get({ storedProcedureName: "core.SR_USP_ShowAuthData" })
                .then(function (res) {
                    var show = res[0][0].Show;
                    if (show) {
                        MF.api.get({ storedProcedureName: "core.SR_USP_SignAuthDoc" }).then(
                            function (res) {
                                var sign = res[0][0].Sign;
                                var viscodet = res[0][0].VisCodEt;
                                if (sign) {
                                    $("#acceptButton").prop("disabled", true);
                                    $("#authModal").modal({
                                        backdrop: "static",
                                        keyboard: false, // to prevent closing with Esc button 
                                    });
                                    var resultsDiv = document.getElementById('Div_Cod_Etico');
                                    var AcceptBox = document.getElementById('acceptCheckbox');
                                    if (viscodet) {
                                        resultsDiv.setAttribute('style', 'visibility:visible');
                                        AcceptBox.setAttribute('disabled', 'disabled');
                                     /*   resultsDiv.setAttribute('class', 'visible');*/
                                    }
                                    else {
                                        resultsDiv.setAttribute('style', 'visibility:hidden; height:0px');
                                        /*resultsDiv.setAttribute('class', 'hidden');*/
                                    }
                                } else {
                                    $("#acceptButton").prop("disabled", false);
                                }
                            },
                            function (err) {

                                setTimeout(function () {
                                    console.log(err);
                                    logout();
                                }, 5000);

                            }
                        );
                    }
                });
        });
    };
    extension.clickCheck = function (e) {
        const isChecked = $("#acceptCheckbox").is(":checked");
        console.log(isChecked);
        if (isChecked) $("#acceptButton").prop("disabled", false);
        else $("#acceptButton").prop("disabled", true);
    };
    extension.accept = function () {
        saveConfirmReadPolicy();
        $("#authModal").modal("hide");
    };
    extension.closeModal = function () {
        $("#authModal").modal("hide");
    };
    extension.logout = function () {
        logout();
    };

    define([], function () {
        return extension;
    });
})();

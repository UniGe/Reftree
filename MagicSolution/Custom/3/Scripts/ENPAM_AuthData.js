// JavaScript source code
//inside the functions "this" is the controller scope (e.g onChange)
(function () {
    var extension = {};

	
	extension.showModal = function () {

		requireConfigAndMore(["MagicSDK"], function (MF) {
			MF.api.get({ storedProcedureName: "CUSTOM.ENPAM_ShowAuthData" }).then(function (res) {
				var show = res[0][0].Show;
				if (show)
					$('#enpamModal').modal({
						backdrop: 'static',
						keyboard: false  // to prevent closing with Esc button (if you want this too)
					});
			})
		});
		
	}


   extension.closeModal = function () {
		$('#enpamModal').modal('hide');
	}
	extension.logout = function () {
		logout();
	}
   
    define([], function () {
        return extension;
    });

})()
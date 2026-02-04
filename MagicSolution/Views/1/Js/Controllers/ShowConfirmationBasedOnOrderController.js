define(["angular"], function (angular) {
	return angular
        .module('ShowConfirmationBasedOnOrder',[])
        .controller('ShowConfirmationBasedOnOrderController', [
			'config',
			'$scope',
			'$http',
			'$timeout',
			function (config, $scope, $http, $timeout) {
			
                var e = config.el;
                var filter = config.filter;
                var grid = config.grid;
		
				
				this.Title = "Creazione ordine";
                this.DescriptionText = "Si vuole proseguire con l'inserimento dell'ordine?";

                this.save = function () {
                    /**
                     * Questa funzione chiama una stored procedure che restituisce il guid ed il filtro per fare un redirect
                     * @param {Object} data - dati della riga su cui sta l' azione
                     * @param {JQuery} $grid - Jquery della griglia di partenza
                     * @param {String} filter - parametro JSON impostato da DB (GetActions stored procedure)
                     */
                    primeActionRouter(e, grid, filter);
					$(config.containerWindowSelector).modal('hide');
                }

                this.undo = function () {
                    $(config.containerWindowSelector).modal('hide');
                }

				this.showModal = function () {
					if (config.containerWindowSelector) {
						$(config.containerWindowSelector).modal('show');
					}
				};
				
			}
		]);
});
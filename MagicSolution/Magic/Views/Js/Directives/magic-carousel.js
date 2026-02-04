define(["angular", "MagicSDK"], function (angular, MF) {
	angular.module("magicCarousel", [])
		.directive("magicCarousel",
			function () {
				return {
					restrict: "E",
					scope: {},
					bindToController: {
						name: "@",
						widget: "=",
						selector: "@"
					},
					templateUrl: "/Magic/Views/Templates/Directives/magic-carousel.html",
					controllerAs: "c",
					controller: ["$scope", "$timeout",
						function ($scope, $timeout) {

							var self = this;
							self.filteredImages = [];
							let widget = self.widget;

							let getImages = function (filter) {

								if (widget.dateFilterActive && filter) {
									return self.widget.carouselImages.filter((image) => {
										let imgDate = new Date(image.data[self.widget.dateFilterColumn]);
										return imgDate >= new Date(self.widget.startDateFilter) && imgDate <= new Date(self.widget.endDateFilter);
									});
								} else {
									return self.widget.carouselImages;
								}
							}

							self.filteredImages = getImages(false);


							$.getScript("/Views/3/Js/carousel.js")
								.done(function () {
									let getMinOrMaxDate = function (val) {
										let returnedDate;
										for (image of self.widget.carouselImages) {
											let widgetDate = new Date(image.data[self.widget.dateFilterColumn]);
											if (!returnedDate) {
												returnedDate = widgetDate;
											}
											if (val == 'min' && widgetDate < returnedDate) {
												returnedDate = widgetDate;
											}

											if (val == 'max' && widgetDate > returnedDate) {
												returnedDate = widgetDate;
											}
										}
										return returnedDate;

									}
									let minDate = getMinOrMaxDate('min');
									let maxDate = getMinOrMaxDate('max');

									self.widget.startDateFilter = minDate;
									self.widget.endDateFilter = maxDate;
									$timeout();
									if (self.filteredImages.length > 0) {
										$(`#carousel_${widget.id}`).carousel({ padding: 80, shift: 10 });
									}
									if (!$('#widget_' + widget.id).find(`#startDateFilter_${widget.id}`).data("kendoDatePicker")) {
										$('#widget_' + widget.id).find(`#startDateFilter_${widget.id}`).kendoDatePicker({
											value: self.widget.startDateFilter,
											min: minDate,
											max: maxDate,

											change: function (e) {
												$(`#carousel_${widget.id}`).removeClass("initialized");

												self.widget.startDateFilter = e.sender.value();
												self.filteredImages = getImages(true);
												$timeout(function () {
													if (self.filteredImages.length>0) {
														$(`#carousel_${widget.id}`).carousel({ padding: 80, shift: 10 });
													}
												}, 100);
											}
										});

										$('#widget_' + widget.id).find(`#endDateFilter_${widget.id}`).kendoDatePicker({
											value: self.widget.endDateFilter,
											min: minDate,
											max: maxDate,
											change: function (e) {
												$(`#carousel_${widget.id}`).removeClass("initialized");
												self.widget.endDateFilter = e.sender.value();
												self.filteredImages = getImages(true);
												$timeout(function () {
													if (self.filteredImages.length>0) {
														$(`#carousel_${widget.id}`).carousel({ padding: 80, shift: 10 });
													}
												}, 100);
											}
										});
									}
								});
						}
					]
				}
			});
});

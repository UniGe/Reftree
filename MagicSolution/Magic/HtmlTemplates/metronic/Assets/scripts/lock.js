var Lock = function () {

    return {
        //main function to initiate the module
        init: function () {

             $.backstretch([
		        "/Magic/HtmlTemplates/metronic/assets/img/bg/1.jpg",
		        "/Magic/HtmlTemplates/metronic/assets/img/bg/2.jpg",
		        "/Magic/HtmlTemplates/metronic/assets/img/bg/3.jpg",
		        "/Magic/HtmlTemplates/metronic/assets/img/bg/4.jpg"
		        ], {
		          fade: 1000,
		          duration: 8000
		      });
        }

    };

}();
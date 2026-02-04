function loadscript()
{
    $("#appcontainer").append('<div class="textarea-wrapper">\
                <span class="label label-default">Select...</span>\
                <textarea class="form-control" id="textarea1" rows="4"></textarea>\
            </div>');
    $("#textarea1").textEntitySelector();
}
function checkAll(e) {
    e.preventDefault();
    var grid = $("#grid").data("kendoGrid");
    var ds = grid.dataSource.data();
    var i;
    for (i = 0; i < ds.length; i++)
        ds[i].selected = ds[i].selected == true ? false : true;
    grid.refresh();
}

function generatestandardpage(e) {
    e.preventDefault();
    var grid = $("#grid").data("kendoGrid");
    var ds = grid.dataSource.data();

    

    var i;
    for (i = 0; i < ds.length; i++) {
        if (ds[i].selected == true) {
            var data = { name: ds[i].classname, generatefunction: ds[i].generatefunction };
            kendo.ui.progress($("#grid"), true);
            var res;
            $.ajax({
                type: "POST",
                async: true,
                url: "/api/ObjectGenerator/generateStandardPageFromClass",
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    res = result.d;
                    kendoConsole.log(new Date().toLocaleString() + ":: Grid, detail and edit templates have been generated for " + data.name , false);
                    kendo.ui.progress($("#grid"), false);
                },
                error: function (request, status, error)
                {
                    kendoConsole.log(new Date().toLocaleString() + ":: Error in Grid, detail and edit templates generation for " + data.name + " read genlog.txt for further details", true);
                    kendo.ui.progress($("#grid"), false);
                }
            });
        }
    }
   
}

function generateserver(e) {
    $.ajax({
        type: "POST",
        async: false,        
        url: "/api/ObjectGenerator/emptyControllerDir",
        data: '{}',
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (result) {
            kendoConsole.log(new Date().toLocaleString() + "::" + result, false);
        }

    });
    var grid = $("#grid").data("kendoGrid");
    var ds = grid.dataSource.data();
    var i;
    for (i = 0; i < ds.length; i++) {
        if (ds[i].selected == true) {
            kendo.ui.progress($("#grid"), true);
            var data = { entityname: ds[i].classname };
            $.ajax({
                type: "POST",
                async: true,
                url: "/api/ObjectGenerator/generateStandardControllerFromClass",
                data: JSON.stringify(data),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (result) {
                    kendoConsole.log(new Date().toLocaleString() + ":: Controller has been generated for " + data.entityname, false);
                    kendo.ui.progress($("#grid"), false);
                },
                error: function (request, status, error)
                {
                    kendoConsole.log(new Date().toLocaleString() + ":: Controller Generation error for:: " + data.entityname, true);
                    kendo.ui.progress($("#grid"), false);
                }

            });

           
        }

    }

}

function loadscript() {
    var toolbar = [{ text: getObjectText("buttoncheck"), className: "buttoncheckall" }, { text: getObjectText("buttongen"), className: "buttongen" }, { text: "UI Components", className: "buttongenstdfnctn" }, { template: kendo.template($("#namespacetemplate").html()) }];
    var datasource = {
        transport: {
            read: { url: "/api/MAGIC_AppClassesReflector/Select", datatype: "json", type: "POST" } //end of transport definition
        
        },
        serverFiletring:true,
        schema: {
            data: "Data",
            total: "Count",
            errors: "Errors",
            model:{id:"classname",fields:{namespace:{editable:false},generatefunction:{type:"boolean",editable:true},selected:{type:"boolean",editable:true},classname:{editable:false},assemblyname:{editable:false},basetype:{editable:false}}}
        }
    };
    
    var grid = $("#grid").kendoGrid({
        editable: true,
        filterable: defaultfiltersettings,
        toolbar:toolbar,
        columns: [{ width: "90px", field: "selected", title: "Is Selected", template: '<img src=" #= selected ? "/Magic/Styles/Images/okbutton.png" : "/Magic/Styles/Images/cross.png" #" />' }, { field: "generatefunction", width: "120px", title: "Generate Function", template: '<img src=" #= generatefunction ? "/Magic/Styles/Images/okbutton.png" : "/Magic/Styles/Images/cross.png" #" />' }, { field: "classname", title: "Class" }, { field: "assemblyname", title: "Assembly info" }, { field: "basetype", title: "Inherits" }],
        dataSource: datasource//,
     //   toolbar:toolbar
        });

    var dropDown = grid.find("#namespace").kendoDropDownList({
        autoBind: false,
        optionLabel: "All",
        dataSource: {
            data: "{}",
            contentType: "application/json; charset=utf-8",
            dataType: "json", 
            transport: {
                read: "/api/MAGIC_AppClassesReflector/GetNamespaces"
            }
        },
        change: function () {
            var value = this.value();
            if (value) {
                grid.data("kendoGrid").dataSource.filter({
                    field: "refnamespace",
                    operator: "eq",
                    value: value
                });
            } else {
                grid.data("kendoGrid").dataSource.filter({});
            }
        }
    });
   
    $(".buttoncheckall").click(function (e) { checkAll(e); });
    $(".buttongen").click(function (e) { generateserver(e); });
    $(".buttongenstdfnctn").click(function (e) { generatestandardpage(e); });
}
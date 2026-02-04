function loadscript() {
    let gridobj = getrootgrid("V_Product");
    let $grid = $("#grid");
    //  let origsave = gridobj.save;
    gridobj.save = function (e) {
        e.preventDefault();
        var fileToSave = $grid.data().filesToSave;
        if (fileToSave) {
            if (fileToSave.length) {
                manageGridUploadedFiles($grid).done(function () {
                    $.ajax({
                        type: "POST",
                        url: "/api/MAGIC_SAVEFILE/CreateCopyUploadedFile",
                        data: JSON.stringify({
                            fileName: fileToSave[0].name,
                            savePath: fileToSave[0].savePath
                        }),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function () {
                            console.log(getObjectText("ImgUploaded"),false)
                        },
                        error: function () {
                            kendoConsole.log(getObjectText("ImgNotUploaded"), true);
                        }
                    });
                    e.sender.dataSource.sync();
                });
            }
            else {
                  //Devo effettuare il salvataggio anche se non è presente una foto
                e.sender.dataSource.sync();
            }
        }
        else {
            //Devo effettuare il salvataggio anche se non è presente una foto
            e.sender.dataSource.sync();
        }
    }

    $grid.kendoGrid(gridobj);
    let grid = $grid.data("kendoGrid");
    $grid.attr("detailTemplateName", gridobj.detailTemplateName);
    $grid.attr("editableName", gridobj.editableName);
    $grid.attr("gridName", gridobj.code);
    $grid.attr("editablecolumnnumber", gridobj.editablecolumnnumber);
    $grid.attr("entityName", gridobj.EntityName);

    if (grid.options.columnMenu) {
        grid.bind('columnHide', setSessionStorageGridColumnSettings);
        grid.bind('columnShow', setSessionStorageGridColumnSettings);
        grid.bind('columnResize', setSessionStorageGridColumnSettings);
        grid.bind('columnLock', setSessionStorageGridColumnSettings);
        grid.bind('columnUnlock', setSessionStorageGridColumnSettings);
    }

    if (grid.options.reorderable) {
        var usersGridSettings = getSessionStorageGridSettings(grid.options.gridcode, grid.options.functionid);
        if (usersGridSettings.columnOrder && !$.isEmptyObject(usersGridSettings.columnOrder)) {
            var hasCustomOrder = false;
            $.each(usersGridSettings.columnOrder, function (field, pos) {
                $.each(grid.columns, function (k, col) {
                    if (col.field == field && pos != k) {
                        hasCustomOrder = true;
                        grid.reorderColumn(pos, col);
                        return false;
                    }
                });
            });
            if (!hasCustomOrder)
                deleteSessionStorageGridSettingByType(grid);
        }

        grid.bind('columnReorder', function (e) {
            setTimeout(function () { setSessionStorageGridColumnOrderSettings(e) }, 0);
        });
    }

	$("#appcontainer").trigger("kendoGridRendered_" + gridobj.code, [grid, "#grid"]);
}



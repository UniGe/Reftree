function generateCubePassword(e) {
    var grid = $(e.currentTarget).closest('[data-role=grid]').data("kendoGrid"),
        dataItem = grid.dataItem($(e.currentTarget).closest('tr[data-uid]'));
    if (confirm("Are you sure?")) {
        $.get('/api/BikeCube/GeneratePassword/' + dataItem[grid.dataSource.options.schema.model.id])
            .then(function (res) {
                $('<div class="text-center"><br/><p><strong>' + res + '</strong></p><p>Please write down the password, it can not be shown anymore!</p></div>')
                    .kendoWindow({
                        title: 'Password',
                        modal: true,
                        width: 400,
                        close: function (e) {
                            e.sender.destroy();
                        }
                    })
                    .data("kendoWindow")
                    .center()
                    .open();
            }, function (error) {
                kendoConsole.log(error, "error");
            });
    }
}
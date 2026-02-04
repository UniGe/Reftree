function Magic_FTP_Settings_Local_Path(input) {
    if (input.is("[name=Local_Path]")) {
        var transferType = input.closest('.row').find('input[name=Transfer_Type]').val();
        //upload: must be a file match: C:\xyz\*.jpg or C:\xyz\* or C:\xyz\test.jpg
        if (transferType == 1)
            return input.val().match(/^[a-z]{1}:[^<>\/|*:?"]*\\((.+)+\.(.+)|\*)$/i);
        //download: must be a path: C:\xyz\
        else
            return input.val().match(/^[a-z]{1}:[^<>\/|*:?"]*\\$/i);
    } return true;
}


function Magic_FTP_Settings_Remote_Path(input) {
    if (input.is("[name=Remote_Path]")) {
        var transferType = input.closest('.row').find('input[name=Transfer_Type]').val();
        //upload: must be a relative path: /xyz/ or /
        if (transferType == 1)
            return input.val().match(/^\/?[^<>\\|*:?"]*\/$/i);
        //download: must be a file match: *.jpg or test/*
        else
            return input.val().match(/^[^<>\\|*:?"]*(([^<>\\/|:?"]+)+\.(.+)|\*)$/i);
    } return true;
}
mail = {};
attachedFiles = [];
unreadMails = 0;
mailboxTrash = "";
mailboxDrafts = "";
mailBoxes = {};

function checkForNewMails(callback, id, box) {
    $.ajax({
        type: 'POST',
        url: '/api/Mail/GetUnreadCount',
        data: {
            number: id || 0,
            box: box || "INBOX"
        },
        success: function (result) {
            result = JSON.parse(result);
            if (callback)
                callback(result);
        },
        error: function (e) {
            kendoConsole.log("Feature disabled!");
        }
    });
}

function sendMail(draft) {
    var to, cc, bcc;
    to = getValidMails($('#mailTo').find('input').val());
    if (to.length === 0 && !draft)
        return;
    cc = getValidMails($('input[name=CC]').val());
    bcc = getValidMails($('input[name=BCC]').val());
    if (mail.lastEditorAction === "forward") {
        var files = [];
        $.each(mail.messages[mail.lastPos].Attachments, function (k, v) {
            files.push({ fileName: v.Filename, contentType: v.ContentType, encoding: v.ContentTransferEncoding, body: v.Body });
        });
        $.ajax({
            type: 'POST',
            url: '/api/Mail/Forward',
            data: { To: to, CC: cc, BCC: bcc, Subject: $('input[name=Subject]').val(), Body: unescapeHTML($('#mailEditor').data('kendoEditor').value()), Files: files },
            success: function (result) {
                if (result == "success") {
                    kendoConsole.log("Mail: success!", "success");
                    closeEditor();
                }
                else kendoConsole.log("Error on sending mail!", true);
            },
            error: function (error) {
                if (typeof error === "object")
                    kendoConsole.log(error.responseMessage, true)
                else
                    kendoConsole.log(error)
            }
        });
    }
    else {
        var  $mailEditorContainer = $('#mailEditorContainer'),
            message = new FormData(),
            url = draft ? 'api/Mail/SaveDraft' : '/api/Mail/Send';

        if (to.length > 0)
            message.append("To", to);
        message.append('Subject', $('input[name=Subject]', $mailEditorContainer).val());
        message.append('Body', unescapeHTML($('#mailEditor', $mailEditorContainer).data('kendoEditor').value()));
        if (cc.length > 0)
            message.append('CC', cc);
        if (bcc.length > 0)
            message.append('BCC', bcc);
        $.each(attachedFiles, function (k, v) {
            message.append("File" + k, v);
        });

        if ($mailEditorContainer.data('returnMessage'))
            message.append("return-message", true);

        $.ajax({
            type: 'POST',
            url: url,
            data: message,
            success: function (result) {
                $mailEditorContainer.trigger("mailSent", [result, draft]);
                kendoConsole.log("Mail: success!", "success");
            },
            error: function (error) {
                kendoConsole.log(error.responseText, "error")
            },
            cache: false,
            contentType: false,
            processData: false,
        });
    }
}

function validateMail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function getValidMails(string) {
    var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;
    var m;
    var mails = [];
    do {
        m = re.exec(string);
        if (m) {
            mails.push(m[0]);
        }
    }
    while (m);
    return mails;
}

function loadMails(callback, page, box) {
    if (!callback)
        return;
    if (!page)
        page = 1;
    if (!box)
        var box = "INBOX";
    var data = {
        number: page,
        box: box
    };
    $.ajax({
        type: 'POST',
        url: '/api/Mail/List',
        data: data,
        success: function (result) {
            callback(JSON.parse(result), page, box);
        },
        error: function (error) { kendoConsole.log(error, true) }
    });
}

function markMailsRead(mailIDs) {
    if (!mailIDs) {
        mailIDs = [];
        var elem;
        $('#emails input:checked').each(function () {
            elem = $(this).closest('tr');
            $(this).prop('checked', false);
            if (elem.hasClass('unread')) {
                mailIDs.push(elem.attr('data-mail-id'));
                elem.removeClass('unread');
            }
        });
    }
    else {
        $.each(mailIDs, function (k, v) {
            $('tr[data-mail-id=' + v + ']').removeClass('unread');
        }); 
    }
    reduceMailCounter(mailIDs.length);
    $.post("/api/Mail/Seen", { uids: mailIDs, box: mail["box"] });
}

function deleteMails(mailIDs) {
    if (!mailIDs) {
        mailIDs = [];
        $('#emails input:checked').each(function () {
            $(this).prop('checked', false);
            mailIDs.push($(this).closest('tr').attr('data-mail-id'));
        });
    }
    if (mail["box"] !== mailboxTrash) {
        $.ajax({
            type: 'POST', url: "/api/Mail/Move", data: { uids: mailIDs, box: mail["box"], toFolder: mailboxTrash },
            success: function () {
                goToPage(mail.page, mail.box);
            },
            error: function (error) {
                goToPage(mail.page, mail.box);
            }
        });
    }
    else {
        $.ajax({
            type: 'POST', url: "/api/Mail/Delete", data: { uids: mailIDs, box: mail["box"] },
            success: function () {
                goToPage(mail.page, mail.box);
            },
            error: function (error) {
                console.log(error);
                kendoConsole.log("Error on deleting mail.", true)
            }
        });
    }
}

function moveMails(to, mailIDs) {
    if (!mailIDs) {
        mailIDs = [];
        $('#emails input:checked').each(function () {
            $(this).prop('checked', false);
            mailIDs.push($(this).closest('tr').attr('data-mail-id'));
        });
    }
    if (!to)
        return;
    if (!(to in mailBoxes))
        return;
    $.ajax({
        type: 'POST', url: "/api/Mail/Move", data: { uids: mailIDs, box: mail["box"], toFolder: mailBoxes[to] },
        success: function () {
            goToPage(mail.page, mail.box);
        },
        error: function (error) {
            goToPage(mail.page, mail.box);
        }
    });
}

function setUpMailRoutines(isMailPage) {
    if ('protocol' in mail) {
        if(isMailPage)
            setupMailPage();
    }
    else {
        checkForNewMails(function (answer) {
            if ("protocol" in answer);
            else if ("error" in answer) {
                mail["error"] = answer['error'];
                if (isMailPage) {
                    kendoConsole.log(answer['error']);
                    window.location = '/app?tab=mail-settings#/profile';
                }
                var $maillink = $('#maillink')
                    .bind('click', function () {
                        window.location = '/app?tab=mail-settings#/profile';
                        return false;
                    })
                    .kendoTooltip({
                        content: getObjectText("wrongSettingsOrServerDown"),
                        width: 180,
                        position: "left"
                    }),
                    $badge = $maillink.find('.badge');
                if (!$badge.length)
                    $maillink.append('<span class="badge badge-warning">' + getObjectText('disabled') + '</span>');
                else
                    $badge
                        .text(getObjectText('disabled'))
                        .removeClass('badge-default')
                        .addClass('badge-warning');
                return;
            } else {
                mail["error"] = "Mail account not configured!";
                if (isMailPage) {
                    kendoConsole.log(mail['error']);
                    window.location = '/app?tab=mail-settings#/profile';
                }
                return;
            }
            mail["protocol"] = answer['protocol'];
            infoNewMails(answer, isMailPage);
            if (isMailPage)
                setupMailPage();
            setInterval(function () {
                checkForNewMails(function (answer) { infoNewMails(answer, isMailPage) });
            }, 600000)
        }, 1);
    }
}

function setupMailPage() {
    $.ajax({
        type: 'GET',
        url: '/api/Mail/InitialData/0',
        success: function (result) {
            result = JSON.parse(result);
            if ("error" in result)
                return;
            buildMailHTML(result, 1);
        },
        error: function (error) {
            kendoConsole.log(error, true);
            setTimeout(function () {
                window.location = "/app?tab=mail-settings#/profile"
            }, 2000);
        }
    });
}

function buildMailHTML(data, page, box) {
    if (!page)
        page = 1;
    var protocol = "IMAP";
    if(mail.protocol !== undefined)
        var protocol = mail.protocol;
    mail = data;
    mail["protocol"] = protocol;
    if (!box && mail.protocol === "IMAP")
        box = "INBOX";
    mail["page"] = page;
    mail["box"] = box;
    var pages = Math.ceil(data.messagesCount / data.messagesPerPage);
    var mailContainer = $('#mailContainer');
    if (mailContainer.length < 1) {
        var html = '<div style="background-color: white; padding: 20px"><div id="mailMenu">';
        html += '<a id="mailCurrentBox" role="button" data-toggle="dropdown" class="btn btn-primary" data-target="#" href="#" style="margin-bottom: 15px">\
                    ' + box + ' <span class="caret"></span>\
                </a>';
        html += '<ul class="dropdown-menu multi-level" role="menu" aria-labelledby="dropdownMenu">';
        var depth = 0;
        var lastDepth = 0;
        var regFolderName = /[^/]*$/;
        var regDepth = /\//g;
        var m, name, i;
        $.each(mail.boxes, function (k, v) {
            depth = 0;
            name = regFolderName.exec(v.name);
            mailBoxes[name] = v.name;
            do {
                m = regDepth.exec(v.name);
                if (m) {
                    depth++;
                }
            } while (m);
            if (depth < lastDepth) {
                for (i = 0; i < (lastDepth - depth); i++)
                    html += '</ul></li>';
            }
            lastDepth = depth;
            if (v.flags.indexOf("\\HasNoChildren") === -1) {
                html += '<li class="dropdown-submenu">\
                            <a href="#" onclick="goToPage(1, \'' + v.name + '\')">' + name + '</a>\
                            <ul class="dropdown-menu">';
            }
            else {
                html += '<li><a href="#" onclick="goToPage(1, \'' + v.name + '\')">' + name + '</a>';
            }
            if (mailboxTrash === "" && v.flags.indexOf("\\Trash") > -1)
                mailboxTrash = v.name;
            if (mailboxDrafts === "" && v.flags.indexOf("\\Drafts") > -1)
                mailboxDrafts = v.name;
        });
        for (i = 0; i < lastDepth ; i++)
            html += '</ul></li>';
        html += '</ul>';
        html += '<button id="newMail" type="button" class="btn btn-default" style="margin-bottom: 15px; margin-left: 10px;"><span class="glyphicon glyphicon-envelope" style="height: 15px;"></span>&nbsp;' + getObjectText('newMail') + '</button>';
        html += '<div style="margin-bottom: 15px; margin-left: 10px;" class="btn-group">\
                    <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-expanded="false">\
                    ' + getObjectText('actions') + ' <span class="caret"></span>\
                    </button>\
                    <ul class="dropdown-menu" role="menu">\
                    <li onclick="markMailsRead()"><a href="#">' + getObjectText('read') + '</a></li>\
                    <li onclick="deleteMails()"><a href="#">' + getObjectText('delete') + '</a></li>\
                    <li class="dropdown-submenu">\
                        <a href="#">' + getObjectText('moveTo') + '</a>\
                        <ul class="dropdown-menu">';
        $.each(mailBoxes, function (k, v) {
            html += '<li onclick="moveMails(\'' + k + '\')"><a href="#">' + k + '</a></li>';
        });
        html += '</li></ul>';
        html +=     '</ul>';
        html += '</div>';
        html += '<div style="float: right; width: 35%"><div class="input-group" >\
                  <span class="input-group-addon"><span class="glyphicon glyphicon-search"></span></span>\
                  <input id="mailSearch" type="text" class="form-control" />\
                </div></div>';
        html += '</div>';
        html += '<div id="mailContainer">';
        html += '<div class="btn-group btn-group-xs" style="margin-bottom: 5px;">\
                    <button id="checkAllMails" type="button" class="btn btn-default">\
                        <span class="glyphicon glyphicon-ok" aria-hidden="true"></span> ' + getObjectText('checkAll') + '\
                    </button>\
                    <button id="uncheckAllMails" type="button" class="btn btn-default">\
                        <span class="glyphicon glyphicon-remove" aria-hidden="true"></span> ' + getObjectText('uncheckAll') + '\
                    </button>\
                </div>';
        html += buildMailListHTML(data.messages);
        html += buildMailPagination(page, pages, 10, box);
        html += "</div></div>";
        $('#appcontainer').html(html);
        $('#newMail').click(function () { openEditor("new"); });
        var timeout;
        $('#mailSearch').on("keyup", function () {
            if (timeout)
                clearTimeout(timeout);
            var self = this;
            timeout = setTimeout(function () {
                if (self.value.length > 2) {
                    self.disabled = true;
                    $('#mailContainer').html('<div style="padding-top: 70px; text-align: center;"><i class="fa fa-spinner fa-5x fa-pulse"></i></div>');
                    mailSearch(self.value, function () {
                        self.disabled = false;
                        self.focus();
                    });
                }
                else if (self.value.length == 0)
                    goToPage(1);
            }, 500);
        });
    }
    else {
        $('#mailCurrentBox').html(box + '<span class="caret"></span>');
        var mailEditorContainer = $('#mailEditorContainer');
        if (mailEditorContainer.length > 0)
            mailEditorContainer.hide();
        mailContainer.show();
        var html = '<div class="btn-group btn-group-xs" style="margin-bottom: 5px;">\
                    <button id="checkAllMails" type="button" class="btn btn-default">\
                        <span class="glyphicon glyphicon-ok" aria-hidden="true"></span> ' + getObjectText('checkAll') + '\
                    </button>\
                    <button id="uncheckAllMails" type="button" class="btn btn-default">\
                        <span class="glyphicon glyphicon-remove" aria-hidden="true"></span> ' + getObjectText('uncheckAll') + '\
                    </button>\
                </div>';
        html += buildMailListHTML(data.messages);
        html += buildMailPagination(page, pages, 10, box);
        mailContainer.html(html);
    }
    $('#mailContainer td.clickable').click(function () {
        openEditor("read", $(this).parent().attr('data-mail-pos'));
    });
    if (window.location.search) {
        var id = window.location.search.match(/[?&]id=(\d+)/);
        if (id && $('#emails tr[data-mail-id=' + id[1] + ']').length)
            $('#emails tr[data-mail-id=' + id[1] + '] td.clickable').first().trigger("click");

    }
    $('#checkAllMails').click(function () {
        $('#emails :checkbox').each(function () {
            $(this).prop('checked', true);
        });
    });
    $('#uncheckAllMails').click(function () {
        $('#emails :checkbox').each(function () {
            $(this).prop('checked', false);
        });
    });
}

function goToPage(page, box) {
    if (!box && mail.protocol === "IMAP")
        box = "INBOX";
    loadMails(buildMailHTML, page, box);
}

function buildMailListHTML(mails) {
    if (mails == null)
        return "";
    var rows = '<table id="emails" class="table table-striped table-fixed-layout table-hover">';
    var attachment = '<span style="height: 100%; width: 100%" class="glyphicon glyphicon-paperclip" aria-hidden="true"></span>';
    var row = '<tr data-mail-id="{3}" data-mail-pos="{5}" class="{4}">\
                <td class="small-cell v-align-middle" style="width:5%">\
                    <input type="checkbox" value="{3}">\
                </td>\
                <td class="clickable small-cell v-align-middle" style="width:2% text-align: right;">\
                    {6}\
                </td>\
                <td class="clickable v-align-middle" style="width:20%">{0}</td>\
                <td class="clickable v-align-middle bootstrap-tagsinput" style="width:15%">{7}</td>\
                <td class="clickable tablefull v-align-middle" style="width:38%"><span class="muted">{1}</span></td>\
                <td class="clickable" style="width:20%; text-align: right;"><span class="muted">{2}</span></td>\
                </tr>';
    mails.reverse();
    var i = 0;
    $.each(mails, function (k, v) {
        //var body = v.Body.substring(0, v.Body.length < 150 ? v.Body.length : 150);
        var read = "unread", tags = "";
        $.each(v.RawFlags, function (i, flag) {
            if (flag === "\\Seen") read = "";
            else if(flag.length > 0 && flag.indexOf("\\") !== 0)
                tags += '<span title="' + flag + '"  class="tag label label-info">' + flag.substring(0, flag.indexOf("<!--")).substr(0, 10) + '</span>';
        });
        rows += row.format(v.From.DisplayName !== "" ? v.From.DisplayName : v.From.Address, v.Subject, new Date(v.Date).toLocaleString(), v.Uid, read, i++, v.Attachments.length > 0 ? attachment : "", tags);
    });
    rows += "</table>";
    return rows;
}

function buildMailPagination(currentPage, pagesInAll, lengthOfPagination, box) {
    html = '<nav><ul class="pagination">';
    if (currentPage - 1 > 0)
        html += '<li onclick="goToPage(' + (currentPage - 1) + ', \'' + box + '\')"><a href="#">&laquo;</a></li>';
    else
        html += '<li class="disabled"><a href="#">&laquo;</a></li>';
    var positions = [];
    positions.push(currentPage);
    for (var i = 1; i < lengthOfPagination; i++) {
        if (positions.length >= lengthOfPagination)
            break;
        if ((currentPage - i) >= 1)
            positions.push(currentPage - i);
        if (positions.length >= lengthOfPagination)
            break;
        if ((currentPage + i) <= pagesInAll)
            positions.push(currentPage + i);
    }
    positions.sort(function (a, b) { return a - b });
    $.each(positions, function (k, v) {
        if (v === currentPage)
            html += '<li class="active" onclick="goToPage(' + v + ', \'' + box + '\')"><a href="#">' + v + '</a></li>';
        else
            html += '<li onclick="goToPage(' + v + ', \'' + box + '\')"><a href="#">' + v + '</a></li>';
    });
    if (currentPage + 1 <= pagesInAll)
        html += '<li onclick="goToPage(' + (currentPage + 1) + ', \'' + box + '\')"><a href="#">&raquo;</a></li>';
    else
        html += '<li class="disabled"><a href="#">&raquo;</a></li>';
    html += '</ul></nav>';
    return html;
}

function infoNewMails(newMailsMessage, isMailPage) {
    var counter = 0;
    if (mail["protocol"] === "IMAP") {
        counter = newMailsMessage.unreadMessagesCount;
        if (!isMailPage && "unreadLastDaysMessagesCount" in newMailsMessage) {
            try {
                angular.element($('[ng-controller*=NotificationsController]')).scope().nc.setMailsCount(newMailsMessage.unreadLastDaysMessagesCount);
            } catch (e) {
                window.notifications = window.notifications || {};
                window.notifications.mails = newMailsMessage.unreadLastDaysMessagesCount;
            }
        }
    }
    unreadMails = counter;
    $('#msgs-badge').html(counter);
}

function reduceMailCounter(number) {
    unreadMails = unreadMails - number;
    $('#msgs-badge').html(unreadMails);
}

function openEditor(action, pos) {
    if (!pos && mail.lastPos !== undefined)
        pos = mail.lastPos;
    if (action !=="new" && !(pos in mail.messages))
        return;
    if(action !== "new")
        mail["lastPos"] = pos;
    var mailContainer = $('#mailContainer');
    if (mailContainer.length < 1)
        return;
    var mailEditorContainer = $('#mailEditorContainer');
    var attachmentHTML = '<div class="col-xs-6 col-md-3 attachment" style="overflow:hidden;">\
                            <span class="glyphicon glyphicon-paperclip" aria-hidden="true"></span>&nbsp;<span style="cursor: pointer;">{0}</span>\
                            <a href="data:{1};base64,{2}" class="thumbnail" download="{0}" style="display: none;"></a>\
                        </div>';
    if (mailEditorContainer.length < 1) {

        var mailEditorContainerHTML = '<div id="mailEditorContainer">\
                                        <div style="margin-bottom: 10px;">\
                                            <h4 style="display: inline-block;">Editor</h4><div class="closeEditor" style="float:right; height: 18px; width:21px; background-color: #ecf0f2; cursor: pointer; text-align: center;">X\</div>\
                                            <div style="clear: both;"></div>\
                                        </div>\
                                        <div id="mailActions">\
                                            <button id="mailSend" type="button" class="btn btn-default">\
                                                <span class="glyphicon glyphicon-send" aria-hidden="true"></span> ' + getObjectText('send') + '\
                                            </button>\
                                            <button id="mailAttach" type="button" class="btn btn-default">\
                                                <span class="glyphicon glyphicon-paperclip" aria-hidden="true"></span> ' + getObjectText('addAttachment') + '\
                                            </button>\
                                            <button id="mailSaveDraft" type="button" class="btn btn-default">\
                                                <span class="glyphicon glyphicon-floppy-disk" aria-hidden="true"></span> ' + getObjectText('saveDraft') + '\
                                            </button>\
                                            <button id="mailAnswer" type="button" class="btn btn-default">\
                                                <span class="glyphicon glyphicon-user" aria-hidden="true"></span> ' + getObjectText('answer') + '\
                                            </button>\
                                            <button id="mailForward" type="button" class="btn btn-default">\
                                                <span class="glyphicon glyphicon-forward" aria-hidden="true"></span> ' + getObjectText('forward') + '\
                                            </button>\
                                            <button id="mailDelete" type="button" class="btn btn-default">\
                                                <span class="glyphicon glyphicon-trash" aria-hidden="true"></span> ' + getObjectText('delete') + '\
                                            </button>\
                                            <div id="mailBOSelector" class="dropdown" style="display: inline-block">\
                                                <button id="mailAddBO" type="button" class="btn btn-default dropdown-toggle">\
                                                    <span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span>&nbsp;&nbsp;' + getObjectText('addBO') + '\
                                                </button>\
                                                <ul class="dropdown-menu" style="padding: 5px;">\
                                                    <li>\
                                                        <div id="mailBOTagCloud"></div>\
                                                        <button type="button" class="btn btn-default">\
                                                            <span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span>&nbsp;&nbsp;' + getObjectText('save') + '\
                                                        </button>\
                                                    </li>\
                                                </ul>\
                                            </div>\
                                            <input id="fileInput" multiple="multiple" onchange="fileSelected();" style="display: none; width: 1px; height: 1px" type="file" />\
                                        </div>\
                                        <div id="mailEdiorInputContainer">\
                                            <div id="mailFlags" class="bootstrap-tagsinput"></div>\
                                            <div id="mailFrom" class="input-group input-group-sm" style="display: none;">\
                                                <span class="input-group-addon">' + getObjectText('from') + '</span>\
                                                <input type="text" class="form-control" name="From" readonly>\
                                            </div>\
                                            <div id="mailTo" class="input-group input-group-sm">\
                                                <span class="input-group-addon">' + getObjectText('mailTo') + '</span>\
                                                <input type="text" class="form-control" name="To">\
                                            </div>\
                                            <div class="row">\
                                                <div class="col-lg-6">\
                                                    <div class="input-group input-group-sm">\
                                                        <span class="input-group-addon">CC</span>\
                                                        <input type="text" class="form-control" name="CC">\
                                                    </div>\
                                                </div>\
                                                <div class="col-lg-6">\
                                                    <div class="input-group input-group-sm">\
                                                        <span class="input-group-addon">BCC</span>\
                                                        <input type="text" class="form-control" name="BCC">\
                                                    </div>\
                                                </div>\
                                            </div>\
                                            <div class="input-group input-group-sm">\
                                                <span class="input-group-addon">' + getObjectText('subject') + '</span>\
                                                <input type="text" class="form-control" name="Subject">\
                                            </div>\
                                        </div>\
                                        <div id="mailAttachments">\
                                        </div>\
                                        <textarea id="mailEditor"></textarea>\
                                    </div>';
        $(mailEditorContainerHTML).insertAfter(mailContainer);
        var mailEditorContainer = $('#mailEditorContainer');
        mailEditorContainer.find('textarea').kendoEditor({
            tools: [
                    "fontName",
                    "fontSize",
                    "bold",
                    "italic",
                    "underline",
                    "strikethrough",
                    "justifyLeft",
                    "justifyCenter",
                    "justifyRight",
                    "justifyFull",
                    "insertUnorderedList",
                    "insertOrderedList",
                    "indent",
                    "outdent",
                    "subscript",
                    "superscript",
                    "createTable",
                    "addRowAbove",
                    "addRowBelow",
                    "addColumnLeft",
                    "addColumnRight",
                    "deleteRow",
                    "deleteColumn",
                    "viewHtml",
                    "formatting",
                    "cleanFormatting",
                    "foreColor",
                    "backColor"
            ]
        });
        mailEditorContainer.find('.closeEditor').click(function () {
            closeEditor();
        });
        $('#mailSend').click(function () {
            sendMail();
        });
        $('#mailForward').click(function () {
            openEditor("forward");
        });
        $('#mailAnswer').click(function () {
            openEditor("answer");
        });
        $('#mailDelete').click(function () {
            deleteMails([mail.messages[mail["lastPos"]].Uid]);
        });
        $('#mailSaveDraft').click(function () {
            sendMail(true);
        });
        $('#mailAddBO').click(function () {
            $('#mailBOSelector').toggleClass("open");
        });
        $("#mailBOTagCloud").bOSelector({
            isKendoForm: false,
            showLabel: false,
            multiselect: true,
            grid: true,
            entityInfo: {
                entityName: "__mail",
                refValueId: null
            }
        });
        $("#mailBOSelector ul li button.btn").click(function () {
            var button = this;
            button.disabled = true;
            var document = mailGetBOMessage(mail.messages[mail.lastPos]);
            document.tags = $("#mailBOTagCloud").bOSelector("getBOs");
            saveMailBO(document, pos, function () { button.disabled = false; $('#mailBOSelector').removeClass("open"); });
        });
        $('#mailAttach').click(function () {
            $('#fileInput').click();
        });
        mailEditorContainer.find('table').css('height', '600px');
    }

    $("#mailBOTagCloud").bOSelector("removeAll");
    if(action == "new")
        $('#mailFlags').html('');
    else {
        var mailFlags = getBOFlags(pos);
        if(mailFlags.length > 0)
            $("#mailBOTagCloud").bOSelector("addBOs", mailFlags);
    }
    $('#mailBOSelector').removeClass("open");
    mailEditorContainer.show('slow');
    mailContainer.hide('slow');

    var mailEditor = mailEditorContainer.find('#mailEditor').data('kendoEditor');
    $(mailEditor.body).attr('contenteditable', true);
    switch (action) {
        case "read":
        default:
            attachedFiles = [];
            var To = getAddressString(mail.messages[pos].To);
            var mailTo = $('#mailTo');
            var mailFrom = $('#mailFrom');
            var attachments = "";
            if(To === "")
                mailTo.hide();
            else
                mailTo.show();
            mailFrom.show();
            $('#mailSend').hide();
            $('#mailForward').show();
            $('#mailAnswer').show();
            $('#mailDelete').show();
            $('#mailAddBO').show();
            $('#mailAttach').hide();
            $('#mailSaveDraft').hide();
            mailTo.find('input').val(To);
            mailFrom.find('input').val(mail.messages[pos].From.DisplayName !== "" ? mail.messages[pos].From.DisplayName : mail.messages[pos].From.Address);
            mailEditorContainer.find('input[name=Subject]').val(mail.messages[pos].Subject);
            mailEditorContainer.find('input[name=CC]').val(getAddressString(mail.messages[pos].Cc));
            mailEditorContainer.find('input[name=BCC]').val('');
            if ($('tr[data-mail-id=' + mail.messages[pos].Uid + ']').hasClass('unread')) {
                markMailsRead([mail.messages[pos].Uid]);
            }
            mailEditor.value("Loading...");
            setEditorFlags(pos);
            loadMail(pos, mail["box"], function (thisMail) {
                if (thisMail) {
                    if (thisMail.AlternateViews[1] !== undefined)
                        var body = thisMail.AlternateViews[1].Body;
                    else
                        var body = thisMail.Body;
                    if (thisMail.Attachments.length > 0) { attachments += '<h5>' + getObjectText('attachments') + '</h5><div class="row">'; var i = 0; }
                    $.each(thisMail.Attachments, function (k, v) {
                        attachments += attachmentHTML.format(v.Filename, v.ContentType, v.Body);
                        i++; if (i % 4 == 0) attachments += '</div><div class="row">';
                    });
                    if (thisMail.Attachments.length > 0) attachments += '</div>';
                    $('#mailAttachments').html(attachments);
                    $('#mailAttachments .attachment span').click(function () {
                        $(this).parent().find('a')[0].click();
                    });
                    mailEditor.value(body);
                }
                else
                    mailEditor.value("Error on loading mail, plaese refresh...");
            });
            $(mailEditor.body).attr('contenteditable', false);
            break;
        case "forward":
            var mailTo = $('#mailTo');
            var mailFrom = $('#mailFrom');
            var attachments = "";

            mailTo.show();
            mailTo.find('input').focus();
            mailFrom.hide();
            $('#mailSend').show();
            $('#mailForward').hide();
            $('#mailAnswer').show();
            $('#mailDelete').hide();
            $('#mailAddBO').hide();
            $('#mailAttach').hide();
            $('#mailSaveDraft').hide();
            if (mail["lastEditorAction"] === "read")
                mailAddDespacherInfo(mail.messages[pos]);
            mailTo.find('input').val('');
            mailEditorContainer.find('input[name=Subject]').val('FW: ' + mail.messages[pos].Subject);
            mailEditorContainer.find('input[name=CC]').val('');
            mailEditorContainer.find('input[name=BCC]').val('');
            if (mail.messages[pos].Attachments.length > 0) { attachments += '<h5>' + getObjectText('attachments') + '</h5><div class="row">'; var i = 0; }
            $.each(mail.messages[pos].Attachments, function (k, v) {
                attachments += attachmentHTML.format(v.Filename, v.ContentType, v.Body);
                i++; if (i % 4 == 0) attachments += '</div><div class="row">';
            });
            if (mail.messages[pos].Attachments.length > 0) attachments += '</div>';
            $('#mailAttachments').html(attachments);
            break;
        case "answer":
            var mailTo = $('#mailTo');
            var mailFrom = $('#mailFrom');

            mailTo.show();
            mailFrom.hide();
            $('#mailSend').show();
            $('#mailForward').show();
            $('#mailAnswer').hide();
            $('#mailDelete').hide();
            $('#mailAddBO').hide();
            $('#mailAttach').show();
            $('#mailSaveDraft').show();
            if (mail["lastEditorAction"] === "read")
                mailAddDespacherInfo(mail.messages[pos]);
            mailEditor.focus();
            mailTo.find('input').val((mail.messages[pos].From.DisplayName !== "" ? '<' + mail.messages[pos].From.DisplayName + '> ' : "") + mail.messages[pos].From.Address);
            mailEditorContainer.find('input[name=Subject]').val('AW: ' + mail.messages[pos].Subject);
            mailEditorContainer.find('input[name=CC]').val('');
            mailEditorContainer.find('input[name=BCC]').val('');
            $('#mailAttachments').html('');
            break;
        case "new":
            var mailTo = $('#mailTo');
            var mailFrom = $('#mailFrom');
            attachedFiles = [];

            mailTo.show();
            mailFrom.hide();
            mailEditor.value('');
            $('#mailSend').show();
            $('#mailForward').hide();
            $('#mailAnswer').hide();
            $('#mailDelete').hide();
            $('#mailAddBO').hide();
            $('#mailAttach').show();
            $('#mailSaveDraft').show();
            mailTo.find('input').val('');
            mailEditorContainer.find('input[name=Subject]').val('');
            mailEditorContainer.find('input[name=CC]').val('');
            mailEditorContainer.find('input[name=BCC]').val('');
            $('#mailAttachments').html('');
            break;
    }
    mail["lastEditorAction"] = action;
}

function loadMail(pos, box, callback) {
    if (mail.messages[pos].Body != null)
        callback(mail.messages[pos]);
    else
        $.ajax({
            type: 'POST',
            url: '/api/Mail/GetMail',
            data: { uids: [mail.messages[pos].Uid], box: box },
            success: function (result) {
                var email = JSON.parse(result);
                email = email[0] || null;
                if (email) {
                    mail.messages[pos].AlternateViews = email.AlternateViews;
                    mail.messages[pos].Body = email.Body;
                    mail.messages[pos].Attachments = email.Attachments;
                }
                callback(email);
            },
            error: function (error) { kendoConsole.log(error, true) }
        });
}

function mailSetFlags(uid, flags) {
    $.ajax({
        type: 'POST',
        url: '/api/Mail/SetFlags',
        data: { uid: uid, flags: flags },
        success: function (result) {
            console.debug("ok");
        },
        error: function (error) { kendoConsole.log(error, true) }
    });
}

function mailGetBOMessage(msg) {
    var document = {};
    document['files'] = [];
    $.each(msg.Attachments, function (k, v) {
        document.files.push({ fileName: v.Filename, contentType: v.ContentType, encoding: v.ContentTransferEncoding, body: v.Body });
    });
    document['body'] = "";
    $.each(msg.AlternateViews, function (k, v) {
        if (v.ContentType === "text/html")
            document['body'] = mailAddDespacherInfo(msg, true) + "<br>Content:<br>" + v.Body;
    });
    if (document['body'] === "")
        document['body'] = mailAddDespacherInfo(msg, true) + "<br>Content:<br>" + msg.Body;
    document.flags = { uid: msg.Uid, flags: msg.RawFlags };
    return document;
}

function mailAddDespacherInfo(msg, returnString) {
    if (!returnString) {
        var mailEditor = $('#mailEditor').data('kendoEditor');
        var oldContent = mailEditor.value();
        var info = "<br>_______________________________<br><br>";
    }
    else
        var info = "";
    info += "From: " + (msg.From.DisplayName !== "" ? "[" + msg.From.DisplayName + "] " : "") + msg.From.Address;
    info += "<br>Date: " + kendo.toString(new Date(msg.Date));
    $.each(msg.To, function (k, v) {
        info += "<br>To: " + (v.DisplayName !== "" ? "[" + v.DisplayName + "] " : "") + v.Address;
        if (k !== (msg.To.length - 1))
            info += ", ";
    });
    info += "<br>Subject: " + msg.Subject;
    if (!returnString)
        mailEditor.value(info + "<br><br>" + oldContent);
    else
        return info;
}

function getAddressString(AddressArray) {
    var listString = "";
    $.each(AddressArray, function (k, v) {
        listString += v.DisplayName !== "" ? '<' + v.DisplayName + '> ' : "";
        listString += v.Address + ', ';
    });
    listString = listString.replace(/[\s\,]+$/g, "");
    return listString;
}

function downloadAttachment(pos, attachmentNo) {
    var attachment = mail.messages[pos].Attachments[attachmentNo];
    window.open('data:' + attachment.ContentType + ';base64,' + encodeURIComponent(attachment.Body));
}

function fileSelected(refresh) {
    if (!refresh)
        attachedFiles.push($("#fileInput")[0].files[0]);
    else if (attachedFiles.length == 0) {
        $('#mailAttachments').html('');
        return;
    }
    var attachmentHTML = '<div class="col-xs-6 col-md-3 attachment" style="overflow:hidden;">\
                            <span class="glyphicon glyphicon-paperclip" aria-hidden="true"></span>&nbsp;<span style="cursor: pointer;">{0}</span>\
                            <button data-attachment-id="{1}" class="btn btn-default btn-xs" type="button"><span aria-hidden="true" class="glyphicon glyphicon-remove"></span></button>\
                        </div>';
    attachments = '<h5>' + getObjectText('attachments') + '</h5><div class="row">';
    $.each(attachedFiles, function (k, v) {
        attachments += attachmentHTML.format(v.name, k);
        if ((k + 1) % 4 == 0) attachments += '</div><div class="row">';
    });
    attachments += '</div>';
    $('#mailAttachments').html(attachments);
    $('#mailAttachments .attachment .btn-xs').click(function () {
        attachedFiles.splice($(this).attr('data-attachment-id'), 1);
        fileSelected(true);
    });
}

function saveMailBO(message, pos, callback) {
    var url = "/api/Mail/SaveBO";
    IsValidSession().then(function (check) {
        if (check.isvalidsession === true)
            $.ajax({
                type: "POST",
                url: url,
                data: JSON.stringify(message),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (res) {
                    if (pos != null) {
                        var uid = mail.messages[pos].Uid;
                        $.each(mail.messages, function (k, email) {
                            if (email.Uid === uid) {
                                mail.messages[k].RawFlags = res;
                                setEditorFlags(k);
                            }
                        });
                    }
                    if (callback) callback();
                    kendoConsole.log('Added successfully!', 'success');
                },
                error: function () {
                    if (callback) callback();
                    kendoConsole.log('Error on adding BO!', true);
                }
            });
    });
}

function getBOFlags(pos) {
    var bOFlags = [];
    $.each(mail.messages[pos].RawFlags, function (k, flag) {
        var infoEnd = flag.indexOf("-->");
        if (infoEnd == flag.length - 3) {
            var descriptionEnd = flag.indexOf("<!--");
            var info = flag.substring(descriptionEnd + 4, flag.length - 3).split("-");
            bOFlags.push({ Description: flag.substring(0, descriptionEnd), Type: info[1], Id: info[0], RepositoryId: info[2] || null });
        }
    });
    return bOFlags;
}

function setEditorFlags(pos) {
    var flags = "";
    $.each(mail.messages[pos].RawFlags, function (k, flag) {
        if (flag.length > 0 && flag.indexOf("\\") !== 0)
            flags += '<span class="tag label label-info">' + flag + '</span>';
    });
    $('#mailFlags').html(flags);
}

function mailSearch(key, callback) {
    $.ajax({
        url: "/api/Mail/Search/" + key,
        success: function (res) {
            res = JSON.parse(res);
            if (callback) callback();
            buildMailHTML(res, 1, "");
        },
        error: function () {
            console.log("error");
        }
    });
}

function closeEditor() {
    $('#mailContainer').show('slow');
    $('#mailEditorContainer').hide('slow');
}

function unescapeHTML(HTMLString){
    return HTMLString.replace(/&gt;?/g, ">").replace(/&lt;?/g, "<")
}
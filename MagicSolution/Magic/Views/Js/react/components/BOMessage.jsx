export default new Promise(async resolve => {
    const React = await import('react');

    requireConfigAndMore(['momentjs'], function (moment) {
        moment.locale(window.culture);

        class BOMessage extends React.Component {
            constructor(props) {
                super(props);

                this.translations = getObjectText;
            }

            parseDocument() {
                let document = this.props.data;
                let content;
                switch (document.TransmissionMode) {
                    case "mail":
                        content = document.DocumentFile;
                        break;
                    case "chat":
                    case "Grid message":
                        let object = Object.assign({}, document);
                        let html = '<div>' + new Date(object.InsertionDate).toLocaleString() + '</div>';
                        try {
                            if (object.DocumentFile[0] === '{') {
                                object.DocumentFile = JSON.parse(jsonStringEscape(object.DocumentFile));
                            }
                            else {
                                object.DocumentFile = { UploadedFile: object.DocumentFile };
                            }
                            if (object.DocumentFile.UploadedFile) {
                                html += 'Link: <a target="_blank" href="' + object.DocumentFile.UploadedFile + '">' + object.DocumentFile.UploadedFile + '</a>';
                            }
                            else {
                                if (window.Username == object.DocumentFile.current.FromUsername) {
                                    html += '<div class="generic-bubble-right">';
                                } else {
                                    html += '<div class="generic-bubble-left">'; //like before
                                }
                                html += '<div><b>' + object.DocumentFile.current.From + '</b> - ' + new Date(object.DocumentFile.current.Received).toLocaleString() + '</div>'
                                html += object.DocumentFile.current.Text;
                                if (object.DocumentFile.current.UploadedFile && object.DocumentFile.current.UploadedFile.length > 2) {
                                    var files = JSON.parse(object.DocumentFile.current.UploadedFile);
                                    html += '<div class="container-fluid">'
                                    while (files.length > 0) {
                                        var threeElemsPerRow = files.splice(0, 3);
                                        html += '<div class="row" style="margin-top: 5px">'
                                        $.each(threeElemsPerRow, function (k, file) {
                                            var nameWithoutDatePrefix = file.name.replace(/^(\/\S+\/)?\d{13,}-/, '');
                                            var origin = window.location.origin;
                                            html += '<div class="col-md-4"><a style="width: 99%" class="btn btn-primary" target="_blank" href="' + origin + '/api/MAGIC_SAVEFILE/GetFile?path=' + file.name + '" role="button"><i class="fa fa-download"></i><span>' + nameWithoutDatePrefix + '</span></a></div>';
                                            
                                        });
                                        html += '</div>';
                                    }
                                    html += '</div>';
                                }
                                html += '</div>';
                                $.each(object.DocumentFile.history, function (k, v) {
                                    if (v.UploadedFile) {
                                        var attachmentData = JSON.parse(v.UploadedFile);
                                        
                                        if (!attachmentData.link) {
                                            attachmentData = getAttachmentsDownloadLinks(attachmentData);
                                        }
                                        //TODO:: iterate attachmentData
                                        if (attachmentData.is_telegram_reply) {
                                            if (window.Username == v.FromUsername) {
                                                html += '<div class="generic-bubble-right">';
                                            } else {
                                                html += '<div class="generic-bubble-left">';
                                            }
                                            if (attachmentData.name.length > 0) {   //telegram-reply WITH attachment
                                                //html += '<div class="generic-bubble" style="min-height:10em;">';
                                                html += '<div><b>' + v.From + '</b> via TELEGRAM - ' + new Date(v.Received).toLocaleString() + '</div>';
                                                html += '<div class="col-md-4"><a style="width: 99%" class="btn btn-primary" target="_blank" href="' + attachmentData.link + '" role="button"><i class="fa fa-download"></i><span>' + attachmentData.name + '</span></a></div>';
                                                //html += '</div>';
                                            } else {
                                                //html += '<div class="generic-bubble">'; //telegram-reply WITHOUT attachment
                                                html += '<div><b>' + v.From + '</b> via TELEGRAM - ' + new Date(v.Received).toLocaleString() + '</div>';
                                                html += '<div>' + v.Text + '</div>'
                                                //html += '</div>';
                                            }
                                            html += '</div>';
                                        } else {
                                            if (window.Username == v.FromUsername) { //new attachment-functionality handled here
                                                html += '<div class="generic-bubble-right">';
                                            } else {
                                                html += '<div class="generic-bubble-left">';
                                            }
                                            html += '<div><b>' + v.From + '</b> - ' + new Date(v.Received).toLocaleString() + '</div></br>';
                                            html += '<div>' + v.Text + '</div></br>';

                                            html += '<div class="container-fluid">'
                                            while (attachmentData.length > 0) {
                                                var threeElemsPerRow = attachmentData.splice(0, 3);
                                                html += '<div class="row" style="margin-top: 5px">'
                                                $.each(threeElemsPerRow, function (k, file) {
                                                    var nameWithoutDatePrefix = file.name.replace(/^(\/\S+\/)?\d{13,}-/, '');                                                    
                                                    html += '<div class="col-md-4"><a style="width: 99%" class="btn btn-primary" target="_blank" href="' + file.link + '" role="button"><i class="fa fa-download"></i><span>' + nameWithoutDatePrefix + '</span></a></div>';
                                                });
                                                html += '</div>';
                                            }
                                            html += '</div>';

                                            html += '</div>';
                                        }
                                    } else {
                                        if (window.Username == v.FromUsername) {
                                            html += '<div class="generic-bubble-right">';
                                        } else {
                                            html += '<div class="generic-bubble-left">';
                                        }
                                        html += '<div><b>' + v.From + '</b> - ' + new Date(v.Received).toLocaleString() + '</div>';
                                        html += '<div>' + v.Text + '</div>';
                                        html += '</div>';
                                    }

                                });
                            }
                            content = html;
                            html = '<div class="list">';
                            if (object.DocumentFile.UploadedFile)
                                html += "File: " + object.DocumentFile.UploadedFile.replace(/^.*\\/, "") + " - " + (object.InsertionDate ? new Date(object.InsertionDate).toLocaleString() : "");
                            else
                                html += object.DocumentFile.current.From + ' - ' + (object.DocumentFile.current.Timestamp ? new Date(object.DocumentFile.current.Timestamp).toLocaleString() : "");
                        }
                        catch (e) {
                            html += object.DocumentFile;
                        }
                        break;
                    default:
                        var tags;
                        try {
                            tags = document.DocumentJSONTags && JSON.parse(document.DocumentJSONTags).map(tag => `<span class="tag label label-info">${tag}</span>`).join('') || '';
                        }
                        catch (e) {
                            tags = '';
                            console.error(e);
                        }
                        content = `<ul class="notes-list" style="padding: 0"><li class="note">
                            <div>
                                <small>${getObjectText("creationdate")}: ${moment(document.InsertionDate).format('llll')}</small><br><br>
                                <label>${getObjectText("duedateselection")}: </label>
                                <label class="ng-binding" style="color: rgb(255, 0, 0);">${document.DueDate && moment(document.DueDate).format('llll') || ''}</label>
                                <p>${document.DocumentFile}</p>
                                <div class="tags">
                                    ${tags}
                                </div>
                            </div>
                        </li></ul>`;
                        break;
                }
                return <div style={this.props.style} className={this.props.className} dangerouslySetInnerHTML={{ __html: content }} />;
            }

            render() {
                return this.parseDocument();
            }
        }

        resolve(BOMessage);
    });
});
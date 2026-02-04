/*TODO: 
    - filter grid by unread, by records with associated bo
    - function where we can see all visible documents
*/

export default new Promise(async resolve => {
    const React = await import('react');
    const BOMessage = await (await import('./BOMessage.jsx')).default;

    class BOReader extends React.Component {
        constructor(props) {
            super(props);

            this.translations = getObjectText;

			this.callbackOnDocumentRead = props.onDocumentRead;
			this.callbackOnClose = props.onBOReaderClose;

			this.state = {
				documents: null,
				currentReply: ""
			};

            $.getJSON("/api/DocumentRepository/GetMessagesForBO", { BOType: props.BOType, BOId: props.BOId })
                .then(documents => {
		           this.parseDocuments(documents);
                });
            
            this.onListClick = this.onListClick.bind(this);
            this.onChangeSearchValue = this.onChangeSearchValue.bind(this);
			this.markAllRead = this.markAllRead.bind(this);
            this.replyToSelected = this.replyToSelected.bind(this);
            this.handleOnChange = this.handleOnChange.bind(this);

            this.filePicker = React.createRef();
            this.filePickerArea = React.createRef();
        }

        initFileUpload() {
            let $input = $(this.filePicker);
            let $container = $(this.filePickerArea);
            let options = {
                success: function (e) {
                    uploadSuccess(e, $container);
                }
            };
            initKendoUploadField($input, options, $container);
        }

        handleOnChange(event) {            
			this.setState({
				currentReply: event.target.value
            });
		}
		replyToSelected() {
            let seldoc = this.state.documents.find(document => document.ID === this.state.activeItemId);
            let message = this.state.currentReply;
            let self = this;
            doModal(true);
            let area = $(this.filePickerArea);
            let files = area.data().filesToSave;
            let cleanFiles = [];
            $.each(files, function (i, file) {
                cleanFiles.push({ name: file.name });
            });
            
            message = message.replace(/(?:\r\n|\r|\n)/g, '<br>');   //replace text-editor-linebreaks with html-linebreaks (because html breaks are json-valid) 

            if (files) {
                manageGridUploadedFiles(area).then(function () {
                    let data = {
                        message: message,
                        DocumentRepository_ID: seldoc.ID,
                        attachmentPath: JSON.stringify(cleanFiles),
                    };
                    $.post({
                        url: "/api/DocumentRepository/ReplyToGridMessage/",
                        data: JSON.stringify(data),
                        contentType: 'application/json'
                    }).then(function (success) {
                        console.log(success);
                        doModal(false);
                        kendoConsole.log(getObjectText('genericok'), false);
                        $("#wndmodalContainer").modal('hide');
                        if (self.callbackOnClose)
                            self.callbackOnClose();
                    }, function (error) {
                        console.error(error);
                        doModal(false);
                        kendoConsole.log(getObjectText('genericko'), true);
                    });
                });
                return;
            }
            let data = {
                message: message,
                DocumentRepository_ID: seldoc.ID,
            };
            $.post({
                url: "/api/DocumentRepository/ReplyToGridMessage/",
                data: JSON.stringify(data),
                contentType: 'application/json'
            }).then(function (success) {
                console.log(success);
                doModal(false);
                kendoConsole.log(getObjectText('genericok'), false);
                $("#wndmodalContainer").modal('hide');
                if (self.callbackOnClose)
                    self.callbackOnClose();
            }, function (error) {
                console.error(error);
                doModal(false);
                kendoConsole.log(getObjectText('genericko'), true);
            });
        }
		isSelectedAGridMessage() {
			if (!this.state.documents)
				return false;
			let seldoc = this.state.documents.find(document => document.ID === this.state.activeItemId);
			if (seldoc.TransmissionMode == "Grid message")
				return true;
			return false;
        }

        markAllRead() {
            this.state.documents.map(document => {
                this.markDocumentRead(document);
            });
        }

        markDocumentRead(document) {
            if (document.is_read)
                return;
            if (this.callbackOnDocumentRead)
                this.callbackOnDocumentRead(document);
            document.is_read = true;
            this.setState(state => ({ documents: state.documents }));
            return $.post({ url: "/api/DocumentRepository/MarkRead", data: JSON.stringify({ ID: document.ID }), contentType: 'application/json' });
        }

        onListClick(document) {
            this.markDocumentRead(document);
            this.setState({ activeItemId: document.ID });
        }

        onChangeSearchValue(event) {
            let searchValue = event.target.value;
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.setState({ searchValue });
            }, 750);
        }

        parseDocuments(documents) {
            documents = documents.map(document => {
                let preview;
                switch (document.TransmissionMode) {
                    case "mail":
                        preview = document.DocumentFile.substring(0, document.DocumentFile.indexOf('<br>Content:<br>'));
                        break;
					case "chat":
					case "Grid message":
                        let object = Object.assign({}, document);
						let html;
						try {
							if (object.DocumentFile[0] === '{') {
								object.DocumentFile = JSON.parse(jsonStringEscape(object.DocumentFile));
							}
							else {
								object.DocumentFile = { UploadedFile: object.DocumentFile };
							}
							html = '<div class="list">';
							if (object.DocumentFile.UploadedFile)
								html += "File: " + object.DocumentFile.UploadedFile.replace(/^.*\\/, "") + " - " + (object.InsertionDate ? new Date(object.InsertionDate).toLocaleString() : "");
							else
								html += object.DocumentFile.current.From + ' - ' + (object.DocumentFile.current.Timestamp ? new Date(object.DocumentFile.current.Timestamp).toLocaleString() : "");
							let tags = "";
							try {
								if (object.DocumentJSONTags)
									JSON.parse(object.DocumentJSONTags).forEach(function (v) {
										tags += '<span class="label label-info">' + v + '</span>';
									});
								if (object.ThreadMembers)
									JSON.parse(object.ThreadMembers).forEach(function (v) {
										tags +=  '<h6><span class="label label-success">' + v + '</span><h6>';
									}); 
							}
							catch (e) {
								console.error(e);
							}
							preview = html += '</div>' + tags ;
						}
						catch (e) {
							html += object.DocumentFile;
						}
                        break;
                    default:
                        preview = document.DocumentFile.substring(0, 255) + (document.DocumentFile.length > 255 ? '...' : '');
                        break;
                }
                document.preview = <span dangerouslySetInnerHTML={{__html: document.TransmissionMode + '<br />' + preview }} />;
                document.content = <BOMessage data={document} />
                document.DocumentJSONTags += ', ' + document.TransmissionMode;
                return document;
            });
            let activeDocument = documents.length ? documents[0] : null;
            let activeItemId = activeDocument ? activeDocument.ID : 0;
            if (activeDocument)
                this.markDocumentRead(activeDocument);
            this.setState({ documents, activeItemId });
            let messagesContainer = document.getElementsByClassName('messages-container')[0];
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        render() {
            return (
                <div className="row">
                    <div className="col-md-4">
						<div className="input-group">
							<input style={{ height: '38px', marginBottom: '1px' }} className="form-control" onChange={this.onChangeSearchValue} />
                            <div className="input-group-btn">
                                <button
									className="btn btn-success"
                                    title={this.translations('markAllRead')}
                                    onClick={this.markAllRead}
								><i className="fa fa-eye" aria-hidden="true"></i></button>
						   </div>
                        </div>
                        <ul className="list-group" style={{ height: '80vh', overflow: 'auto' }}>
                            {this.state.documents
                                ? this.state.documents
                                    .filter(document => {
                                        if (this.state.searchValue) {
                                            let term = this.state.searchValue;
                                            let searchExp = new RegExp(term, 'i');
                                            return document.DocumentJSONTags
                                                && document.DocumentJSONTags.match(searchExp) 
                                                    || document.DocumentFile
                                                    && document.DocumentFile.match(searchExp);
                                        }
                                        return true;
                                    })
                                    .map(document =>
                                    <a
                                        key={document.ID}
                                        className={this.state.activeItemId === document.ID ? 'list-group-item active' : 'list-group-item'}
                                        style={{backgroundColor: !document.is_read && '#dff0d8'}}
                                        onClick={() => this.onListClick(document)}
                                    >
                                        {document.preview}
                                    </a>
                                )
                                : <p className="text-center"><i className="fa fa-spinner fa-spin fa-2x"></i></p>
                            }
                        </ul>
                    </div>
                    <div className="col-md-8" style={{ height: '80vh' }}>
                        <div className="messages-container">
                        {this.state.documents &&
                            this.state.documents.find(document => document.ID === this.state.activeItemId).content
                        }
                        </div>
                        <div className="generic-bubble-new-msg">
                            <textarea placeholder="type a message..." className="inl" onChange={(event) => this.handleOnChange(event)} value={this.state.currentReply} style={{ width: '60%', border: 'none', marginRight: '10px' }} />
                            <div className="inl" ref={ref => this.filePickerArea = ref} style={{ width: '30%' }}>
                                <input ref={ref => this.filePicker = ref}
                                    type="file"
                                    data-admin-upload="true"
                                    data-multiple="true"
                                    accept="" />

                            </div>
                            <button
                                className="btn btn-success inl"
                                title={this.translations('reply')}
                                onClick={this.replyToSelected}
                                style={{ width: '6%', float: 'right' }}
                            ><i className="fa fa-paper-plane" aria-hidden="true"></i>
                            </button>
                        </div>                   
                    </div>
                </div>
            );
        }
        componentDidMount() {
            this.initFileUpload();
        }
    }

    resolve(BOReader);
});
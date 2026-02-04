export default new Promise(async resolve => {
    const React = await import('react');
    const ReactDOM = await import('react-dom');
    const List = await (await import('./components/list.jsx')).default;
    const Item = await (await import('./components/item.jsx')).default;
    const BOMessage = await (await import('./components/BOMessage.jsx')).default;
    const Form = await (await import('./components/form.jsx')).default;

    /*TODO: 
        go to table with filter
    */
    requireConfigAndMore(['momentjs'], function (moment) {
        moment.locale(window.culture);

        const documentStyle = { overflow: 'auto', height: '20em' };
        const itemContainerStyle = {
            display: 'flex',
            flexWrap: 'wrap',
        };
        const colSpan = {
            default: 12,
            medium: 3,
        };

        const formData = {
            BOType: '',
        };

        const formDefinition = {
            fields: {
                BODescription: {
                    name: getObjectText('description')
                },
                q: {
                    name: getObjectText('documentSearch')
                },
                BOType: {
                    name: 'BO type',
                    definition: {
                        source: function () {
                            return $.getJSON('/api/DocumentRepository/GetBoTypes')
                                .then(data => {
                                    data.unshift('');
                                    return data;
                                });
                        },
                    },
                    type: 'select',
                },
                messageType: {
                    name: 'Message type',
                    type: 'select',
                    definition: {
                        data: [
                            '',
                            'chat',
                            'memo',
                            'mail'
                        ]
                    }
                },
            },
            grid: [
                {
                    field: 'q',
                    colSpan
                },
                {
                    field: 'BODescription',
                    colSpan
                },
                {
                    field: 'BOType',
                    colSpan
                },
                {
                    field: 'messageType',
                    colSpan
                },
            ]
        };

        function Document(props) {
            const groupStyle = { backgroundColor: !props.data.is_read && '#28a745', color: !props.data.is_read && 'white' };
            return (
                <Item>
                    <small group-style={groupStyle} group="header">
                        {props.data.BusinessObjectType} - {props.data.TransmissionMode}
                        {props.data.is_owner && <i className="fa fa-user pull-right" aria-hidden="true" title={getObjectText('ownerboid')}></i>}
                    </small>
                    <span style={groupStyle} group="header" role="title">{props.data.BODescription}</span>
                    <BOMessage group-style={documentStyle} data={props.data} />
                    <span group-style={groupStyle} group="footer">{moment(props.data.InsertionDate).fromNow()}</span>
                </Item>
            );
        }

        function Detail(props) {
            return (
                <BOMessage data={props.data} />
            );
        }

        class DocumentRepository extends React.Component {
            constructor(props) {
                super(props);
                this.state = {
                    data: [],
                    dataSource: {
                        id: 'ID'
                    },
                    selection: [],
                };

                this.listDefinition = {
                    localization: {
                        saveButton: getObjectText('read'),
                    },
                }

                this.searchDelay = null;

                this.getData();

                this.search = this.search.bind(this);
                this.markRead = this.markRead.bind(this);
                this.markSelectedRead = this.markSelectedRead.bind(this);
                this.deleteSelected = this.deleteSelected.bind(this);
                this.selectAll = this.selectAll.bind(this);
                this.onListSelect = this.onListSelect.bind(this);
                this.goToBO = this.goToBO.bind(this);
            }

            getData(filter) {
                if (!filter) {
                    filter = {};
                }
                filter.getBODescription = true;
                $.getJSON("/api/DocumentRepository/GetMessagesForBO", filter)
                    .then(data => {
                        data = data || [];
                        this.setState({
                            data
                        });
                    });
            }

            markSelectedRead() {
                this.setState({ selection: []});
                return this.state.selection.map(data => this.markRead(null, data));
            }

            deleteSelected() {
                if (!window.confirm(getObjectText('CONFIRMATION'))) {
                    return;
                }
                this.setState({ selection: []});
                return this.state.selection.map(this.deleteDocument.bind(this));
            }

            deleteDocument(document) {
                if (!document.is_owner) {
                    return;
                }
                return $.ajax({
                    url: '/api/DocumentRepository/Delete',
                    data: { documentId: document.ID },
                })
                    .then(() => {
                        this.setState(state => {
                            let data = state.data.filter(doc => document.ID !== doc.ID);
                            return { data };
                        });
                    });
            }

            markRead(event, document) {
                if (document.is_read)
                    return;
                document.is_read = true;
                this.setState(state => ({ data: state.data }));
                return $.post({ url: "/api/DocumentRepository/MarkRead", data: JSON.stringify({ ID: document.ID }), contentType: 'application/json' });
            }

            search(data) {
                clearTimeout(this.searchDelay);
                this.searchDelay = setTimeout(() => {
                    this.getData(data);
                }, 500);
            }

            selectAll() {
                if (this.state.selection.length === this.state.data.length) {
                    this.state.selection = [];
                }
                else {
                    this.state.selection = this.state.data;
                }
                this.setState({ selection: this.state.selection });
            }

            onListSelect(selection) {
                this.setState({ selection: Object.values(selection) });
            }

            goToBO() {

            }
        
            render() {
                return (
                    <React.Fragment>
                        <div className="row"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <div className="col-md-3">
                                <button
                                    className="btn btn-default"
                                    onClick={this.selectAll}
                                    style={{
                                        minWidth: '40px'
                                    }}
                                    title={this.state.selection.length === this.state.data.length ? getObjectText('buttonuncheck') : getObjectText('selectAll')}
                                >
                                    <i
                                        className={`fa fa-${this.state.selection.length === this.state.data.length ? '' : 'check-'}square-o`}
                                        aria-hidden="true">
                                    </i>
                                </button>
                                    <button
                                        className="btn btn-default"
                                        onClick={this.markSelectedRead}
                                        style={{
                                            minWidth: '40px'
                                        }}
                                        title={getObjectText('read')}
                                        disabled={!this.state.selection.length}
                                    >
                                        <i
                                            className="fa fa fa-eye"
                                            aria-hidden="true">
                                        </i>
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={this.deleteSelected}
                                        style={{
                                            minWidth: '40px'
                                        }}
                                        title={getObjectText('delete')}
                                        disabled={!this.state.selection.length}
                                    >
                                        <i
                                            className="fa fa fa-trash"
                                            aria-hidden="true">
                                        </i>
                                    </button>
                                {/* {
                                    this.state.selection.length === 1
                                    || <button
                                            className="btn btn-default"
                                            onClick={this.goToBO}
                                            style={{
                                                minWidth: '40px'
                                            }}
                                            title={getObjectText('goToBO')}
                                        >
                                            <i
                                                className="fa fa-sign-out"
                                                aria-hidden="true">
                                            </i>
                                        </button>
                                } */}
                            </div>
                            <div className="col-md-9">
                                <Form
                                    definition={formDefinition}
                                    onChange={this.search}
                                    data={formData}
                                />
                            </div>
                        </div>
                        
                        <List
                            className="notes-list"
                            style={itemContainerStyle}
                            definition={this.listDefinition}
                            item={Document}
                            detail={Detail}
                            dataSource={this.state.dataSource}
                            //definition={this.listDefinition}
                            data={this.state.data} 
                            selection={this.state.selection}
                            onSelect={this.onListSelect}
                            onSave={this.markRead}
                        />
                    </React.Fragment>
                );
            }
        }

        resolve(DocumentRepository);
    });
});

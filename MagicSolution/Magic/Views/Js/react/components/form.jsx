export default new Promise(async resolve => {
    const React = await import('react');
    const SearchDrop = await (await import('./searchDrop.jsx')).default;
    const Drop = await (await import('./drop.jsx')).default;
    const HtmlGrid = await import('../lib/htmlGrid.js');
    const DataSource = (await import('../lib/dataSource')).default;

    class Form extends React.Component {
        constructor(props) {
            super(props);
            let definition = props.definition || {};

            if (props.magicFormDefinition) {
                definition = this.convertMagicForm(props.magicFormDefinition);
            }

            this.state = {
                id: props.id || definition.uid, // used to store global model -> dataSource
                fields: props.fields || definition.fields,
                grid: props.grid || definition.grid,
                readonly: props.readonly || false,
                uploadFileContainer: props.uploadFileContainer,
                validation: props.validation || definition.validation,
                bootstrapVersion: props.bootstrapVersion || 3,
                isOffline: props.isOffline || false,
            };

            let dataSource = new DataSource({
                data: props.data || {},
                fields: this.state.fields,
            }, this.state.id);

            if (this.props.onChange) {
                dataSource.on('changed', (event) => {
                    if (event.targetOfType === 'item') {
                        this.props.onChange(event.dataItem, event.property);
                    }
                });
            }

            this.state.dataSource = dataSource;
            this.state.data = dataSource.data;

            this.getFormContent = this.getFormContent.bind(this);
            this.getElement = this.getElement.bind(this);
            this.handleChange = this.handleChange.bind(this);
            this.addSpokenText = this.addSpokenText.bind(this);
            this.stopAddingSpokenText = this.stopAddingSpokenText.bind(this);
        }

        componentWillUnmount() {
            this.state.dataSource.dispose();
        }

        getFormContent(grid) {
            if (Array.isArray(grid)) {
                return grid.map(grid => this.getFormContent(grid));
            }
            else {
                return this.getElement(grid);
            }
        }

        addSpokenText(fieldName) {
            if (recordSpeech) {
                this.recordingField = fieldName;
                recordSpeech((phrases) => {
                    if (phrases.length && this.recordingField === fieldName) {
                        this.setState((state) => {
                            if (!state.data[fieldName]) {
                                state.data[fieldName] = '';
                            }
                            else {
                                state.data[fieldName] += ' ';
                            }
                            state.data[fieldName] += phrases[0];
                            return { data: state.data };
                        });
                    }
                });
            }
            else {
                console.warn('no recordSpeech function found');
            }
        }

        stopAddingSpokenText(fieldName) {
            if (recordSpeech) {
                this.recordingField = '';
            }
        }

        getElement(grid) {
            let input;
            let field = this.state.fields[grid.field] || grid.definition || {};
            let validation = this.state.validation && this.state.validation[grid.field] ? this.state.validation[grid.field] : {};
            let properties = {
                name: grid.field,
                className: 'form-control',
                value: this.state.data[grid.field] || '',
                onChange: this.handleChange,
                readOnly: field.readonly || this.state.readonly || false,
                disabled: field.readonly || this.state.readonly || false,
                required: validation.notEmpty,
                isOffline: this.props.isOffline || false,
            };
            properties = Object.assign({}, field, properties);
            delete properties.readonly;

            let specialLabel = null;
            switch(field.type) {
                case 'applicationuploadmultiple':
                    input = <input type='file' multiple='true' ref={input => {
                        if (input && input.parentElement && !$(input).data('kendoUpload')) {
                            let upload = initKendoUploadField(
                                $(input)
                                , {
                                    files: this.state.data[grid.field] ? JSON.parse(this.state.data[grid.field]) : [],
                                    gallery: true
                                }
                                , this.props.uploadFileContainer
                            );
                            upload.bind("success", e => {
                                this.setModel(grid.field, upload.options.files.length ? JSON.stringify(upload.options.files) : null);
                            });
                        }
                    }} />
                    break;
                case 'image':
                    input = <img src={this.state.data[grid.field] || ''} className='img-rounded' />;
                    break;
                case 'select':
                case 'searchDrop':
                    properties.onChange = (_, id) =>  {
                        this.setModel(grid.field, id)
                    };
                    input = React.createElement(
                        field.type === 'select' ? Drop : SearchDrop
                        , properties
                    );
                    break;
                default:
                    let type = 'input';
                    if (field.type === 'textarea') {
                        type = 'textarea';
                        properties.rows = '3';
                        specialLabel = (
                            <div>
                                <div style={{ paddingTop: '16px' }} className="pull-left">{field.name || grid.field}</div>
                                <span
                                    className="pull-right btn btn-danger"
                                    onClick={() => this.stopAddingSpokenText(grid.field)}
                                >
                                    <i
                                        className="fa fa-comment-o"
                                        aria-hidden="true"
                                    ></i>
                                </span>
                                <span
                                    className="pull-right btn btn-success"
                                    onClick={() => this.addSpokenText(grid.field)}
                                >
                                    <i
                                        className="fa fa-commenting-o"
                                        aria-hidden="true"
                                    ></i>
                                </span>
                            </div>
                        );
                    }
                    else {
                        properties.type = field.type || 'text';
                    }

                    input = React.createElement(
                        type,
                        properties
                    );
                    break;
            }

            return (
                <div key={grid.field} className={this.createGridClass(grid)}>
                    <label style={{ width: '100%' }}>
                        {specialLabel || field.name || grid.field}
                        {input}
                    </label>
                </div>
            );
        }

        createGridClass(grid) {
            let className = 'form-group';
            if (!grid.colSpan) {
                grid.colSpan = 12;
            }
            className += HtmlGrid.getGridClassName(grid.colSpan, this.state.bootstrapVersion);
            return className;
        }

        handleChange(event) {
            this.setModel(event.target.name, event.target.value);
            if (!this.props.onFileChange) {
                return;
            }
            if (event.target.files) {
                this.props.onFileChange(event.target.files, event.target.name, event);
            }
        }

        setModel(name, value) {
            this.setState((state) => {
                state.data[name] = value;
                return { data: state.data };
            });
        }

        render () {
            return (
                <div className="row">
                    {this.getFormContent(this.state.grid)}
                </div>
            );
        }

        convertMagicForm(magicFormDefinition) {
            let definition = { grid: [], fields: {}, validation: {} };
            magicFormDefinition.map(rowDefinition => {
                if (!rowDefinition.Detailisvisible)
                    return;
                definition.grid.push({
                    field: rowDefinition.ColumnName,
                });
                definition.fields[rowDefinition.ColumnName] = this.getNonMagicFieldDefinition(rowDefinition);
                definition.validation[rowDefinition.ColumnName] = {
                    notEmpty: rowDefinition.Schema_required === true
                };
            });
            return definition;
        }

        getNonMagicFieldDefinition(rowDefinition) {
            let definition = {
                name: rowDefinition.Columns_label || rowDefinition.ColumnName,
                type: rowDefinition.MagicTemplateDataRole,
                readonly: !rowDefinition.Schema_editable
            };
            if (rowDefinition.extension) {
                definition = Object.assign(definition, rowDefinition.extension);
            }
            if (definition.type === 'applicationuploadmultiple') {
                definition.multiple = true;
            }
            if (rowDefinition.MagicDataSource) {
                rowDefinition.getDataSource = () => this.state.dataSource;
                definition.definition = { magicDataSource: rowDefinition };
            }
            switch(rowDefinition.MagicTemplateDataRole) {
                case 'dropdownlist':
                    definition.type = 'select';
                    break;
                case 'autocomplete':
                    definition.type = 'searchDrop';
                    break;
            }
            return definition;
        }
    }

    resolve(Form);
});
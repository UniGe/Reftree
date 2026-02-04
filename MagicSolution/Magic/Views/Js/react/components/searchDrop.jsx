export default new Promise(async resolve => {
    const React = await import('react');
    const DataSource = (await import('../lib/dataSource')).default;
    
    class SearchDrop extends React.Component {
        constructor(props) {
            super(props);

            this.inputTimeout = null;
            this.inputValuePassedIn = false;

            this.state = {
                bootstrapVersion: props.bootstrapVersion || 3,
                isOpen: false,
                inputValue: '',
                dataSource: null,
                data: [],
                selectedRowIndex: -1,
                dropMaxHeight: props.dropMaxHeight || '25vh',
            };

            let dataSourceDefinition = props.definition || {};
            if (props.isOffline) {
                dataSourceDefinition.defaultSearchParam = 'description';
            }
            dataSourceDefinition.isOffline = props.isOffline;
            if (props.data) {
                dataSourceDefinition.data = props.data;
            }
            if (props.value) {
                this.inputValuePassedIn = true;
                dataSourceDefinition.filter = {
                    field: '__id',
                    operator: 'eq',
                    value: props.value,
                };
            }
            let dataSource = this.state.dataSource = new DataSource(dataSourceDefinition);
            this.state.data = dataSource.data;
            dataSource.on('filtered', this.onDataSourceFiltered.bind(this));
            dataSource.on('changed', this.onDataSourceChanged.bind(this));
            dataSource.on('dependencyChanged', this.onDataSourceDependencyChanged.bind(this));

            this.onInputFocus = this.onInputFocus.bind(this);
            this.onInputBlur = this.onInputBlur.bind(this);
            this.onInputChange = this.onInputChange.bind(this);
            this.onClickListItem = this.onClickListItem.bind(this);
            this.onInputKeyDown = this.onInputKeyDown.bind(this);
        }

        shouldComponentUpdate(nextProps, nextState) {
            if (this.state.inputValue !== nextState.inputValue) {
                return true;
            }
            const update = this.update;
            this.update = false;
            return update;
        }

        componentWillUnmount() {
            this.state.dataSource.dispose();
        }

        setValue(data) {
            this.update = true;
            if (this.props.onChange) {
                this.props.onChange(data, data ? data.id : null);
            }
            this.setState({
                inputValue: data ? data.description : '',
                isOpen: false,
                selectedRowIndex: -1,
            });
        }

        onDataSourceDependencyChanged(event) {
            this.setValue(null);
        }

        onDataSourceFiltered(event) {
            this.update = true;
            let data = event.data;
            this.setState({
                data,
                selectedRowIndex: -1,
                isOpen: true,
            });
            try {
                if (
                    data.length === 1
                    && this.state.inputValue.toLowerCase() === data[0].description.toLowerCase()
                ) {
                    this.setValue(data[0]);
                }
            }
            catch (e) {
                console.log('catched error', e, 'inconsistent data');
            }
            if (this.inputValuePassedIn && this.props.isOffline) {
                this.inputValuePassedIn = false;
                if (data.length) {
                    this.setState({
                        inputValue: data[0].description,
                        isOpen: false,
                    });
                }
            }
        }

        onDataSourceChanged(event) {
            this.update = true;
            let data = event.data;
            this.setState({ data });
            if (this.inputValuePassedIn && !this.props.isOffline) {
                this.inputValuePassedIn = false;
                this.state.dataSource.setNamedFilter();
                if (data.length) {
                    this.setState({
                        inputValue: data[0].description,
                    });
                }
            }
        }

        onInputKeyDown(event) {
            this.update = true;
            let keyCode = event.keyCode;
            let action;
            if (keyCode === 38) {
                action = 'up';
            }
            else if (keyCode === 40) {
                action = 'down';
            }
            else if (keyCode === 13) {
                action = 'enter';
            }
            else {
                return;
            }
            event.preventDefault();
            this.setState(state => {
                let selectedRowIndex = -1;
                if (state.selectedRowIndex === -1) {
                    if (action === 'up') {
                        selectedRowIndex = state.data.length - 1;
                    }
                    else if (action === 'down') {
                        selectedRowIndex = 0;
                    }
                    return { selectedRowIndex };
                }
                else {
                    if (action === 'enter') {
                        if (state.selectedRowIndex > -1) {
                            setTimeout(() => this.setValue(state.data[state.selectedRowIndex]));
                        }
                        return;
                    }
                    else if (action === 'up') {
                        selectedRowIndex = state.selectedRowIndex - 1;
                    }
                    else {
                        selectedRowIndex = state.selectedRowIndex + 1;
                    }
                    selectedRowIndex = selectedRowIndex % state.data.length;
                    return { selectedRowIndex };
                }
            });
        }

        onClickListItem(row) {
            this.setValue(row);
        }

        onInputChange(event) {
            this.update = true;
            let inputValue = event.target.value;
            clearTimeout(this.inputTimeout);
            this.setState({
                inputValue,
            });
            this.inputTimeout = setTimeout(() => {
                this.state.dataSource.filter(inputValue);
            }, 500);
        }

        onInputFocus() {
            this.update = true;
            if (this.props.readOnly) {
                return;
            }
            this.setState({
                isOpen: true,
            });
        }

        onInputBlur() {
            this.update = true;
            this.setState({
                isOpen: false,
            });
        }

        render() {
            if (this.state.bootstrapVersion === 3) {
                return (
                    <div className={`dropdown ${this.state.isOpen && 'open'}`}>
                        <input
                            onKeyDown={this.onInputKeyDown}
                            onFocus={this.onInputFocus}
                            onBlur={this.onInputBlur}
                            onChange={this.onInputChange}
                            value={this.state.inputValue}
                            className="form-control"                            
                            readOnly={this.props.readOnly}
                            name={this.props.name}
                            autoComplete="off"
                        />
                        <ul
                            className="dropdown-menu"
                            role="menu"
                            style={{
                                width: '100%',
                                maxHeight: this.state.dropMaxHeight,
                                overflow: 'auto',
                            }}
                        >
                            {
                                this.state.data.map((row, rowIndex) => {
                                    return (
                                        <li
                                            key={row.__id || row.id}
                                            role="presentation"
                                            onMouseDown={() => this.onClickListItem(row)}
                                            className={this.state.selectedRowIndex === rowIndex ? 'active': ''}
                                        >
                                            <a
                                                role="menuitem"
                                                tabIndex="-1"
                                                href="#"
                                            >
                                                {row.description}
                                            </a>
                                        </li>
                                    );
                                })
                            }
                        </ul>
                    </div>
                );
            }
        }

    }

    resolve(SearchDrop);
});
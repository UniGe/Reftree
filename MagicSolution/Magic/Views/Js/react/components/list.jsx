export default new Promise(async resolve => {
    const React = await import('react');
    const HtmlGrid = await import('../lib/htmlGrid.js');
    const { CSSTransition, TransitionGroup } = await import('react-transition-group');

    const doubleClickMs = 200;
    const transitionItemLimit = 30;

    const cssStyles = `
.f2-list-item:hover,
div.active .f2-list-item {
    border-color: #428bca;
    cursor: pointer;
}

.f2-list-item-container {
    transition: width 1000ms, opacity 350ms;
}

.f2-list-item-container-fade-appear,
.f2-list-item-container-fade-enter,
.f2-list-item-container-fade-exit {
    width: 0;
    opacity: 0;
    padding: 0;
    overflow: hidden;
}
`;

    const styles = {
        block: {
            display: 'block',
        },
        none: {
            display: 'none',
        },
    };
    let Item;

    class ListView extends React.Component {

        constructor(props) {
            super(props);

            this.components = {};
            let definition = props.definition || {};
            if (!definition.look) {
                definition.look = {};
            }

            this.state = {
                definition: definition,
                dataSource: props.dataSource
                    || (Array.isArray(props.data)
                        ? props.data
                        : props.data.source),
                data: props.data || definition.data || [],
                templates: {},
                bootstrapVersion: props.bootstrapVersion || 3,
                loaded: {},
                alternativeDefaultComponents: {},
                dataInEdit: null,
                selection: {},
                localization: {
                    saveButton: getObjectText('save'),
                    closeButton: getObjectText('chiudibutton'),
                }
            };

            if (definition.localization)
                this.state.localization = Object.assign(this.state.localization, definition.localization);

            if (props.item) {
                this.state.alternativeDefaultComponents.preview = {
                    type: 'customItem'
                };
                this.components['customItem'] = props.item;
                this.state.loaded.preview = true;
            }
            else {
                this.prepare('preview');
            }

            if (props.detail) {
                this.state.alternativeDefaultComponents.detail = {
                    type: 'customDetail'
                };
                this.components['customDetail'] = props.detail;
                this.state.loaded.detail = true;
            }

            this.onChange = this.onChange.bind(this);
            this.openDetail = this.openDetail.bind(this);
            this.closeDetail = this.closeDetail.bind(this);
            this.updateData = this.updateData.bind(this);
            this.onItemClick = this.onItemClick.bind(this);
        }

        static getDerivedStateFromProps(nextProps, prevState) {
            let state = {};
            if (nextProps.data !== prevState.data) {
                state.data = nextProps.data;
            }
            if (nextProps.selection !== prevState.selection) {
                state.selection = ListView.convertToSelectionObject(nextProps, prevState);
            }
            return Object.keys(state).length ? state : null;
        }

        static convertToSelectionObject(nextProps, prevState) {
            if (Array.isArray(nextProps.selection)) {
                let id = ListView.getId(nextProps);
                let selection = {};
                nextProps.selection.map(row => {
                    selection[row[id]] = row;
                });
                return selection;
            }
            return nextProps.selection || {};
        }

        prepare(typeOfLook) {
            return this.loadDependencies(typeOfLook)
                .then(() => this.getTemplate(typeOfLook))
                .then(template => {
                    this.setState(state => {
                        let update = {};
                        update.templates = state.templates;
                        update.templates[typeOfLook] = template;
                        update.loaded = state.loaded;
                        update.loaded[typeOfLook] = true;
                        update.alternativeDefaultComponents = state.alternativeDefaultComponents;
                        update.alternativeDefaultComponents[typeOfLook] = this.getAlternativeComponent(typeOfLook);
                        return update;
                    });
                });
        }

        getTemplate(typeOfLook) {
            if (this.state.definition.look.grid && this.state.templates['preview']) {
                return this.state.templates.preview;
            }
            if (this.state.definition.look.grid || typeOfLook in this.state.definition.look) {
                let formDefs = [];
                let currentFormIndex = 0;
                let components = [];
                let componentCount = 0;
                let look = this.state.definition.look || this.state.definition.look[typeOfLook];
                for (let component of look.grid) {
                    if (component.type) {
                        if (formDefs.length - 1 === currentFormIndex) {
                            components.push(
                                {
                                    type: 'default',
                                    definition: {
                                        grid: formDefs[currentFormIndex],
                                        fields: look.fields,
                                    }
                                }
                            );
                            currentFormIndex++;
                        }
                        components.push(component);
                        componentCount++;
                    }
                    else {
                        if (formDefs.length === currentFormIndex) {
                            formDefs.push([]);
                            componentCount++;
                        }
                        formDefs[currentFormIndex].push(component);
                    }
                }
                if (componentCount !== components.length) {
                    components.push(
                        {
                            type: 'default',
                            definition: {
                                grid: formDefs[currentFormIndex],
                                fields: look.fields,
                            }
                        }
                    );
                }
                return components;
            }
            return null;
        }

        onChange(data) {
            if (props.onChange) {
                props.onChange(data);
            }
            console.log(data);
        }

        getComponent(componentDefinition, data, view) {
            const componentType = componentDefinition.type === 'default'
                ? view === 'detail'
                    ? 'form'
                    : 'item'
                : componentDefinition.type;
            return React.createElement(
                this.components[componentType]
                , Object.assign(
                    componentDefinition.props || {},
                    {
                        definition: componentDefinition.definition,
                        data,
                        onChange: this.onChange,
                    },
                )
            )
        }

        async loadDependencies(typeOfLook) {
            let deps = {};
            let definitionsToLoad = {};
            let view = this.state.definition.look.grid ? this.state.definition.look : this.state.definition.look[typeOfLook];
            if (!this.state.templates[typeOfLook] && view && view.grid) {
                for (let field of Object.values(view.grid)) {
                    if (field.uid) {
                        definitionsToLoad[field.uid] = null;
                    }
                    else if (field.type) {
                        deps[field.type] = null;
                    }
                    else {
                        deps['form'] = null;
                        deps['item'] = null;
                    }
                }
            }
            return Promise.all(
                this.loadComponents(Object.keys(deps))
                    //.concat(this.loadDefinitions(Object.keys(definitionsToLoad)))
                );
        }

        loadComponents(components) {
            return components.map(name => {
                if (!(name in this.components)) {
                    return import(`./${name}.jsx`)
                        .then(async component => {
                            if (name === 'item') {
                                Item = await component.default;
                            }
                            this.components[name] = await component.default;
                        })
                }
            });
        }

        loadDefinitions(definitions) {
            throw Error('loading of definitions not implemented');
        }

        getHtmlClass(colSpan, offset) {
            colSpan = colSpan || this.state.definition.look.colSpan;
            if (!colSpan) {
                colSpan = {
                    default: 12,
                    medium: 3,
                    large: 2,
                };
            }
            return HtmlGrid.getGridClassName(colSpan, this.state.bootstrapVersion, offset);
        }

        getSpinner() {
            return (<div
                dangerouslySetInnerHTML={{ __html: `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" className="lds-pacman"><g ng-attr-style="display:{{config.showBean}}" style="display:block"><circle cx="87.8" cy="50" r="4" ng-attr-fill="{{config.c2}}" fill="#5699d2"><animate attributeName="cx" calcMode="linear" values="95;35" keyTimes="0;1" dur="1" begin="-0.67s" repeatCount="indefinite"></animate><animate attributeName="fill-opacity" calcMode="linear" values="0;1;1" keyTimes="0;0.2;1" dur="1" begin="-0.67s" repeatCount="indefinite"></animate></circle><circle cx="48.2" cy="50" r="4" ng-attr-fill="{{config.c2}}" fill="#5699d2"><animate attributeName="cx" calcMode="linear" values="95;35" keyTimes="0;1" dur="1" begin="-0.33s" repeatCount="indefinite"></animate><animate attributeName="fill-opacity" calcMode="linear" values="0;1;1" keyTimes="0;0.2;1" dur="1" begin="-0.33s" repeatCount="indefinite"></animate></circle><circle cx="68" cy="50" r="4" ng-attr-fill="{{config.c2}}" fill="#5699d2"><animate attributeName="cx" calcMode="linear" values="95;35" keyTimes="0;1" dur="1" begin="0s" repeatCount="indefinite"></animate><animate attributeName="fill-opacity" calcMode="linear" values="0;1;1" keyTimes="0;0.2;1" dur="1" begin="0s" repeatCount="indefinite"></animate></circle></g><g ng-attr-transform="translate({{config.showBeanOffset}} 0)" transform="translate(-15 0)"><path d="M50 50L20 50A30 30 0 0 0 80 50Z" ng-attr-fill="{{config.c1}}" fill="#1d3f72" transform="rotate(40.5 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;45 50 50;0 50 50" keyTimes="0;0.5;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></path><path d="M50 50L20 50A30 30 0 0 1 80 50Z" ng-attr-fill="{{config.c1}}" fill="#1d3f72" transform="rotate(-40.5 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;-45 50 50;0 50 50" keyTimes="0;0.5;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></path></g></svg>` }}
                className={this.getHtmlClass(2, 5)}
            />);
        }

        getAlternativeComponent(typeOfLook) {
            return this.state.templates[typeOfLook].length === 1
                && this.state.templates[typeOfLook][0];
        }

        onItemClick(data) {
            setTimeout(() => {
                if (this.lastItemClicked !== null && this.props.onSelect) {
                    this.props.onSelect(this.state.selection, this.getIdProperty());
                }
                this.lastItemClicked = null;
            }, doubleClickMs);
            
            this.setState(state => {
                if (data[this.getIdProperty()] in state.selection) {
                    delete state.selection[data[this.getIdProperty()]];
                }
                else {
                    state.selection[data[this.getIdProperty()]] = data;
                }
                return { selection: state.selection };
            });

            if (this.lastItemClicked === data) {
                this.openDetail(data);
                this.lastItemClicked = null;
            }
            else {
                this.lastItemClicked = data;
            }
        }

        openDetail(data) {
            if (!this.state.definition.look.grid && !this.state.definition.look.detail && !this.props.detail) {
                return;
            }
            else if (!this.props.detail && !this.state.templates.detail) {
                this.prepare('detail');
            }
            let dataInEdit = Object.assign({}, data);
            this.setState({ showDetail: true, dataInEdit });
        }

        closeDetail() {
            this.setState({ dataInEdit: null, showDetail: false });
        }

        updateData(event) {
            event.persist();
            this.setState(state => {
                let newData = this.state.dataInEdit;
                for (let row of state.data) {
                    if (newData[this.getIdProperty()] === row[this.getIdProperty()]) {
                        row = Object.assign(row, newData);
                        if (this.props.onSave) {
                            this.props.onSave(event, row);
                        }
                        break;
                    }
                }
                if (!event.isDefaultPrevented()) {
                    this.closeDetail();
                }
                return { data: state.data };
            });
        }

        getIdProperty() {
            return ListView.getId(this.state);
        }

        static getId(state) {
            return state.dataSource.id || '__id';
        }

        getListWrapper(children) {
            const defaultProps = { className: `row ${this.props.className}`, style: this.props.style };
            if (this.state.data.length > transitionItemLimit) {
                return React.createElement('div', defaultProps, children);
            }
            defaultProps.appear = true;
            return React.createElement(TransitionGroup, defaultProps, children);
        }

        getItemWrapper(data, children) {
            const cssProps = {
                key: data[this.getIdProperty()],
                timeout: 200,
                classNames: "f2-list-item-container-fade",
            };
            const divProps = {
                className: `f2-list-item-container ${this.getHtmlClass()} ${ data[this.getIdProperty()] in this.state.selection || this.state.dataInEdit && this.state.dataInEdit[this.getIdProperty()] === data[this.getIdProperty()] ? 'active' : ''}`,
                onClick: () => this.onItemClick(data),
            };
            if (this.state.data.length > transitionItemLimit) {
                divProps.key = cssProps.key;
            }
            const div = React.createElement(
                'div'
                , divProps
                , children
            );
            if (this.state.data.length > transitionItemLimit) {
                return div;
            }
            return React.createElement(CSSTransition, cssProps, div);
        }

        render() {
            return (
                <React.Fragment>
                    <style dangerouslySetInnerHTML={{ __html: cssStyles }} />  
                    {
                        !this.state.loaded.preview
                            ?   <div className="row">{this.getSpinner()}</div>
                            :
                                this.getListWrapper(
                                    this.state.data.map(data =>
                                        this.getItemWrapper(
                                            data
                                            , this.state.alternativeDefaultComponents.preview
                                                ? this.getComponent(this.state.alternativeDefaultComponents.preview, data)
                                                : <Item
                                                    definition={ this.state.definition.look.preview }
                                                >
                                                    {
                                                        this.state.templates.preview.map((component, i) =>
                                                            <div key={i}>
                                                                {this.getComponent(component, data)}
                                                            </div>
                                                        )
                                                    }
                                                </Item>
                                        )
                                    )
                                )
                    }
                    <div className={"modal fade" + (this.state.showDetail ? " in" : "")} role="dialog" style={(this.state.showDetail ? styles.block : styles.none )}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                            <div className="modal-header">
                                <button type="button" className="close" onClick={this.closeDetail}>&times;</button>
                                <h4 className="modal-title text-center"><i className="fa fa-pencil" aria-hidden="true"></i></h4>
                            </div>
                            <div className="modal-body">
                                {
                                    !this.state.loaded.detail
                                        ? <div className="row">{this.getSpinner()}</div>
                                        : this.state.alternativeDefaultComponents.detail
                                            && this.getComponent(this.state.alternativeDefaultComponents.detail, this.state.dataInEdit || {}, 'detail')
                                }
                            </div>
                            <div className="modal-footer">
                                <button onClick={this.closeDetail} type="button" className="btn btn-default" data-dismiss="modal">{this.state.localization.closeButton}</button>
                                {   
                                    this.state.templates.detail
                                    && this.state.templates.detail.length === 1
                                    && this.state.templates.detail.type === 'default'
                                    || this.props.onSave
                                    && <button onClick={this.updateData} type="button" className="btn btn-primary">{this.state.localization.saveButton}</button>
                                }
                            </div>
                            </div>
                        </div>
                    </div>
                </React.Fragment>
            );
        }
    }

    resolve(ListView);
});
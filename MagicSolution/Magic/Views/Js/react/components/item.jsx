export default new Promise(async resolve => {
    const React = await import('react');

    const htmlClassMapping = {
        3: {
            container: 'panel panel-default'
        },
        4: {
            container: 'card'
        },
    };

    const groups = [
        'list',        
        'header',
        'body',
        'footer',
        'imageOverlay',
        'none',
    ];

    const elementRoles = [
        'none',
        'item',
        'image',
        'imageFull',
        'title',
        'link',
        'text',
        'description'
    ];

    const defaultElementGroups = {
        item: 'list',
        image: 'none',
        title: 'body',
        text: 'body',
        link: 'body',
        none: 'body',
    };

    const elementDefinitions = {
        3: {
            item: {
                el: 'li',
                className: 'list-group-item'
            },
            image: {
                el: 'img',
                className: '',
                target: {
                    type: 'prop',
                    name: 'src',
                },
                description: {
                    target: 'prop',
                    name: 'alt',
                },
            },
            title: {
                el: 'h4',
                className: 'list-group-item-heading',
            },
            link: {
                el: 'a',
                className: 'list-group-item',
                target: {
                    type: 'prop',
                    name: 'href',
                },
                description: {
                    target: 'child',
                },
            },
            text: {
                el: 'p',
                className: '',
            },
            none: {
                el: React.Fragment,
            },
        }
    };

    const groupDefinitions = {
        3: {
            list: {
                el: 'ul',
                className: 'list-group',
            },
            header: {
                el: 'div',
                className: 'panel-heading',
            },
            body: {
                el: 'div',
                className: 'panel-body',
            },
            footer: {
                el: 'div',
                className: 'panel-footer',
            },
            imageOverlay: {
            },
            none: {
            }
        }
    };

    class Item extends React.Component {
        constructor(props) {
            super(props);

            this.state = {
                bootstrapVersion: props.bootstrapVersion || 3,
                definition: props.definition,
            }
        }

        buildDOM() {
            const hasChildren = !!this.props.children;
            const elements = this.props.children && Array.isArray(this.props.children)
                ? this.props.children
                : [ this.props.children ]
                || this.state.definition.grid;
            const finalComponents = [];
            let groupDefinition = {};
            let lastElement = {};
            elements.map((el, i) => {
                let element = hasChildren
                    ? el
                    : this.props.data[el.field];
                let grid = hasChildren
                    ? el.props.definition
                        ? el.props.definition.grid
                        : el.props
                    : el;
                let role = grid.role || elementRoles[0];
                let groupType = grid.group || defaultElementGroups[role] || groups[0];
                element = this.wrapComponent(element, role, i);
                if (groupDefinition.type === groupType) {
                    groupDefinition.children.push(element);
                }
                else {
                    if (groupDefinition.type) {
                        finalComponents.push(this.getGroup(groupDefinition, i - 1));
                    }
                    groupDefinition = {
                        type: groupType,
                        children: [ element ],
                    };
                }
                if (grid['group-style']) {
                    groupDefinition.style = grid['group-style'];
                }
                if (i === elements.length - 1) {
                    finalComponents.push(this.getGroup(groupDefinition, i));
                }
            });
            return finalComponents;
        }

        getGroup(groupDefinition, key) {
            const def = groupDefinitions[this.state.bootstrapVersion][groupDefinition.type];
            return React.createElement(def.el, { className: def.className, key, style: groupDefinition.style }, groupDefinition.children);
        }

        wrapComponent(el, role, key) {
            const elementDefinition = elementDefinitions[this.state.bootstrapVersion][role];
            let props = { key };
            if (elementDefinition.className) {
                props.className = elementDefinition.className;
            }
            return React.createElement(elementDefinition.el, props, el);
        }

        render() {
            return (
                <div
                    className={`f2-list-item ${htmlClassMapping[this.state.bootstrapVersion].container} ${this.props.className || ''}`}
                    {...this.props}
                >
                    {
                        this.buildDOM()
                    }
                </div>
            );
        }
    }

    resolve(Item);
});
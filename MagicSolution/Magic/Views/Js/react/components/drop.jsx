export default new Promise(async resolve => {
    const React = await import('react');
    const DataSource = (await import('../lib/dataSource')).default;
    
    class Drop extends React.Component {
        constructor(props) {
            super(props);

            let dataSource = new DataSource(props.definition);

            this.onSelectChange = this.onSelectChange.bind(this);

            this.onDataSourceChange = this.onDataSourceChange.bind(this);
            this.onDataSourceDependencyChange = this.onDataSourceDependencyChange.bind(this);
            dataSource.on('changed', this.onDataSourceChange);
            dataSource.on('dependencyChanged', this.onDataSourceDependencyChange);

            this.state = {
                dataSource,
                data: dataSource.data,
                bootstrapVersion: props.bootstrapVersion || 3,
                selectValue: props.value,
            };
        }

        componentWillUnmount() {
            this.state.dataSource.dispose();
        }

        onDataSourceDependencyChange() {
            this.onChange('');
        }

        onDataSourceChange(event) {
            let data = event.data;
            if (this.props.value === undefined) {
                this.onChange(data.length ? data[0] : '');
            }
            this.setState({ data });
        }

        onSelectChange(event) {
            this.onChange(this.getItemFromId(event.target.value));
        }

        onChange(option) {
            if (this.props.onChange) {
                this.props.onChange(option, this.getIdAndLabel(option).id);
            }
            this.setState({ inputValue: option });
        }

        getItemFromId(id) {
            return this.state.data.find(item => this.getIdAndLabel(item).id == id);
        }

        getIdAndLabel(option) {
            return {
                id: option && option.id || option,
                label: option && option.description || option,
            };
        }

        render() {
            if (this.state.bootstrapVersion === 3) {
                return (
                    <select
                        className="form-control"
                        readOnly={this.props.readOnly}
                        name={this.props.name}
                        onChange={this.onSelectChange}
                        value={this.props.value}
                    >
                        {this.state.data.map(option => {
                            const { id, label } = this.getIdAndLabel(option);
                            return <option key={id || 'null'} value={id}>{label}</option>;
                        })}
                    </select>
                );
            }
        }

    }

    resolve(Drop);
});
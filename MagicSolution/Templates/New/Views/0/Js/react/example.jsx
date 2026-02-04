export default new Promise(async resolve => {
    const React = await import('react');
    const ExampleComponent = await (await import('./components/exampleComponent.jsx')).ExampleComponent;
    const Form = await (await import('../../../../Magic/Views/Js/react/components/form.jsx')).default;
    class Example extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                value: 'react',
                formDefinition: {
                    grid: [
                        {
                            field: 'text',
                        }
                    ],
                    fields: {
                        text: {
                            name: 'textarea',
                            type: 'textarea',
                        }
                    }
                }
            };
        }
    
        render() {
            return (
                <div>
                    <h1>Hi from {this.state.value}</h1>
                    <p>
                        If you want to develop with react:
                    </p>
                    <ul>
                        <li>make sure you have installed node v8.x</li>
                        <li>run (in cmd from MagicSolution folder) npm install</li>
                        <li>modify webpack.config.js according the example you already find in it</li>
                        <li>run npm run build</li>
                    </ul>
                    <ExampleComponent name={this.state.value} />
                    <Form definition={this.state.formDefinition} />
                </div>
            );
        }
    }

    resolve(Example);
});
export let ExampleComponent = new Promise(async resolve => {
    const React = await import('react');

    class ExampleComponent extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                name: props.name
            };
        }

        render () {
            return (
                <h2>{this.state.name} subcomponent</h2>
            );
        }
    }

    resolve(ExampleComponent);
});
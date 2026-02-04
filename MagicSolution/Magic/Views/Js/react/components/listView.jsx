export default new Promise(async resolve => {
    const React = await import('react');

    class ListView extends React.Component {
        constructor(props) {
            super(props);
        }

        render() {
            return (
                <span>the legendary list view</span>
            );
        }
    }

    resolve(ListView);
});
export let Accordion = new Promise(async resolve => {
    const React = await import('react');

    class Accordion extends React.Component {
        constructor(props) {
            super(props);

            this.id = `bts3_accordion_${(Math.random() + '').substring(2)}`;
        }

        render() {
            return (
                <div className={this.props.className || ''} style={this.props.style}>
                    <div className='panel panel-default'>
                        <div className="panel-heading">
                        <h4 className="panel-title">
                            <a data-toggle="collapse" data-parent={'#' + (this.props.parentId || this.id)} href={`#collapse_${this.id}`}>
                                {this.props.title}
                            </a>
                        </h4>
                        </div>
                        {this.props.header}
                        <div id={`collapse_${this.id}`} className={'panel-collapse collapse ' + (this.props.expanded && 'in')}>
                            <div className="panel-body">
                                {this.props.content}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    resolve(Accordion);
});
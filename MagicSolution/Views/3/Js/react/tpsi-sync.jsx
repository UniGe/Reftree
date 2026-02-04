export default new Promise(async resolve => {
    const React = await import('react');

    requireConfigAndMore(['MagicSDK'], function (mf) {

        class TPSISync extends React.Component {
            constructor(props) {
                super(props);

                this.state = {
                    projects: [

                    ]
                };

                this.sessionStorageGlobalInfoKey = 'TPSI_offline_data_info';
                this.sessionKeysToHandle = [
                    'impiantiToDelete',
                    'impiantiToSend',
                ];

                this.getDataFromSessionStorage();
            }

            getDataFromSessionStorage() {
                const info = JSON.parse(sessionStorage.getItem(this.sessionStorageGlobalInfoKey)) || {};
                for (const project of Object.keys(info)) {
                    const data = { label: project };
                    this.state.projects.push(data);
                    for (const sessionKey of this.sessionKeysToHandle) {
                        data[sessionKey] = JSON.parse(sessionStorage.getItem(project + sessionKey)) || [];
                    }
                }
            }
            
            render() {
                return (
                    <div>
                        {
                            this.state.projects.map(project =>
                                <div>{JSON.stringify(project)}</div>
                            )
                        }
                    </div>
                );
            }
        }

        resolve(TPSISync);
    });
});
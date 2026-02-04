export default new Promise(async resolve => {
    const React = await import('react');
    const Compressor = (await import('compressorjs')).default;
    const Form = await (await import('../../../../Magic/Views/Js/react/components/form.jsx')).default;
    const Accordion = await (await import('../../../../Magic/Views/Js/react/components/accordion.jsx')).Accordion;
    const { CSSTransition, TransitionGroup } = await import('react-transition-group');

    //TODO: integrate data sync, check if online form stil working

    const imageCompressionOptions = {
        maxHeight: 1024,
        maxWidth: 1024,
    };

    const HTMLAttributeRegex = /\s+(\w+)="(\w+)"/g;

    requireConfigAndMore(['MagicSDK'], function (mf) {

        const Swing = ({ children, ...props }) => (
            <CSSTransition
                {...props}
                timeout={1000}
                classNames="swing"
            >
                {children}
            </CSSTransition>
        );

        class TPSI extends React.Component {
            constructor(props) {
                super(props);

                this.state = {
                    tags: [],
                    selectedTagId: null,
                    loading: true,
                    groups: [],
                    aree: [],
                    show: 'aree',
                    showOfflineButton: true,
                    impianti: [],
                    formDefinition: {},
                    impianto: null,
                    sending: false,
                    isOffline: props.isOffline,
                    impiantiToSync: [],
                    showForm: false,
                };

                this.sessionStorageGlobalInfoKey = 'TPSI_offline_data_info';
                this.sessionStoragePrefix = 'TPSI_' + location.search + '_';
                this.offlineFormfiles = {};
                this.sessionTime = new Date();

                setTimeout(() => this.letsGo());
                this.setImpiantoData = this.setImpiantoData.bind(this);
                this.onFormFileChange = this.onFormFileChange.bind(this);
                this.sendForm = this.sendForm.bind(this);
                this.clearStorage = this.clearStorage.bind(this);
                this.openOfflineWindow = this.openOfflineWindow.bind(this);
                this.setUploadFileContainer = this.setUploadFileContainer.bind(this);
                this.closeForm = this.closeForm.bind(this);
                this.showSyncData = this.showSyncData.bind(this);
                this.deleteSyncImpianto = this.deleteSyncImpianto.bind(this);
                this.syncOffline = this.syncOffline.bind(this);
                this.askClearStorage = this.askClearStorage.bind(this);
                this.returnToOnlineView = this.returnToOnlineView.bind(this);
            }

            openOfflineWindow() {
                this.setState({ showOfflineButton: false })
                const newWindow = openNewWindowContainingHTMLTemplate(window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/tpsi-offline.html');
                newWindow.addEventListener('message', function (message) {
                    if (message.data === 'reload') {
                        location.reload();
                    }
                });

            }

            openSyncWindow() {
                openNewWindowContainingHTMLTemplate(window.includesVersion + '/Views/' + window.ApplicationCustomFolder + '/tpsi-sync.html');
            }

            returnToOnlineView() {
                window.postMessage('reload');
                window.close();
            }

            showSyncData() {
                this.setState({
                    syncMessage: null,
                    show: 'sync',
                });
            }

            askClearStorage() {
                if(!confirm(getObjectText('CONFIRMATION')))
                    return;

                this.clearStorage();
                window.location.reload();
            }

            clearStorage() {
                sessionStorage.removeItem(this.sessionStoragePrefix);
                const allKeys = JSON.parse(sessionStorage.getItem(`${this.sessionStoragePrefix}sessionKeys`)) || {};
                for (const key of Object.keys(allKeys)) {
                    sessionStorage.removeItem(`${this.sessionStoragePrefix}${key}`);
                }
                sessionStorage.removeItem(`${this.sessionStoragePrefix}sessionKeys`);
            }

            getDataFromSessionStorage() {
                const stringData = sessionStorage.getItem(this.sessionStoragePrefix);
                if (!stringData) {
                    return null;
                }
                const data = JSON.parse(stringData);
                const allKeys = JSON.parse(sessionStorage.getItem(`${this.sessionStoragePrefix}sessionKeys`)) || {};
                for (const key of Object.keys(allKeys)) {
                    data[key] = JSON.parse(sessionStorage.getItem(`${this.sessionStoragePrefix}${key}`));
                }
                return data;
            }

            // limits of sessionStorage https://www.html5rocks.com/en/tutorials/offline/quota-research/
            storeDataInSessionStorage(data, setAll = false) {
                if (setAll) {
                    sessionStorage.setItem(this.sessionStoragePrefix, JSON.stringify(data));
                }
                else {
                    const allKeys = JSON.parse(sessionStorage.getItem(`${this.sessionStoragePrefix}sessionKeys`)) || {};
                    for (const [ key, value ] of Object.entries(data)) {
                        allKeys[key] = true;
                        sessionStorage.setItem(`${this.sessionStoragePrefix}${key}`, JSON.stringify(value));
                        
                    }
                    sessionStorage.setItem(`${this.sessionStoragePrefix}sessionKeys`, JSON.stringify(allKeys));
                }
                this.handleSessionInfo();
            }

            handleSessionInfo() {
                const info = JSON.parse(sessionStorage.getItem(this.sessionStorageGlobalInfoKey)) || {};
                if (this.state.impiantiToSync.length) {
                    info[this.sessionStoragePrefix] = 1;
                }
                else {
                    delete info[this.sessionStoragePrefix];
                }
                sessionStorage.setItem(this.sessionStorageGlobalInfoKey, JSON.stringify(info));
            }

            async letsGo() {
                let storedProcedureName = 'dbo.TPSI_Get_Parti_Compendio';

                let data = null;
                let result;
                if (this.state.isOffline) {
                    storedProcedureName = 'dbo.TPSI_Get_Parti_Compendio_offline';
                    data = this.getDataFromSessionStorage();
                }

                if (!data) {
                    try {
                        result = await mf.api.get({
                            storedProcedureName,
                            dontLogError: this.state.isOffline,
                            storedProcedureKeepEmptyRecordsets: true,
                        });

                        if (!result.length || !result[0].length) {
                            return;
                        }
    
                        data = {
                            tags: result[0],
                            allGroups: result[1] || [],
                            allAree: result[2] || [],
                            allImpianti: result[3] || [],
                            allImpiantiForms: result[4] || [],
                            allImpiantiDetailData: result[5] || [],
                            dropValues: {
                                SI_FIEDET_ANNO: result[6] || [],
                                LE_VI_REFERE_ALL: result[7] || [],
                                SI_FIEDET_STATUS_status: result[8] || [],
                            }
                        };
                        data.allImpiantiDetailData = data.allImpiantiDetailData.map(data => {
                            let match = HTMLAttributeRegex.exec(data.XmlValue);
                            while (match) {
                                data[match[1]] = match[2];
                                match = HTMLAttributeRegex.exec(data.XmlValue)
                            }
                            return data;
                        });
                        if (this.state.isOffline) {
                            this.storeDataInSessionStorage(data, true);
                        }
                    }
                    catch (e) {
                        kendoConsole.log(e);
                    }
                }

                data.loading = false;
                this.setState(data);

                let tag =  data.tags.length ? data.tags[0] : null;
                if (tag) {
                    this.selectTag(tag);
                }
            }

            selectTag(tag) {
                this.setState({
                    show: 'aree',
                    showForm: false,
                });
                if (tag.id === this.state.selectedTagId)
                    return;
                this.setState({
                    selectedTagId: tag.id,
                    loading: true,
                    aree: [],
                    selectedGroupId: null,
                    selectedGroup: null,
                    tag,
                });
                this.refreshGroups(tag);
            }

            async refreshGroups(tag) {
                this.setState({
                    groups: [],
                });

                let result;
                if (!this.state.isOffline) {
                    try {
                        result = await mf.api.get({
                            storedProcedureName: 'dbo.TPSI_Get_GROUPS',
                            data: {
                                id: tag.id
                            },
                            dontLogError: this.state.isOffline,
                            storedProcedureKeepEmptyRecordsets: true,
                        });
                    }
                    catch (e) {
                        kendoConsole.log(e);
                    }
                }
                else {
                    result = [this.state.allGroups.filter(item => item.id.startsWith(tag.id))];
                }

                this.setState({
                    groups: result[0] || [],
                    loading: false,
                });
            }

            selectGroup(group) {
                this.setState({
                    selectedGroupId: group.id,
                    group: group,
                    loading: true,
                });
                this.refreshAree(group);
            }

            async refreshAree(tag) {
                let result = [];

                if (!this.state.isOffline) {
                    try {
                        result = await mf.api.get({
                            storedProcedureName: 'dbo.TPSI_Get_Aree',
                            data: {
                                id: tag.id
                            },
                            dontLogError: this.state.isOffline,
                            storedProcedureKeepEmptyRecordsets: true,
                        });
                    }
                    catch (e) {
                        kendoConsole.log(e);
                    }
                }
                else {
                    result = [this.state.allAree.filter(item => item.id.startsWith(tag.id))];
                }

                this.setState({
                    aree: result[0] || [],
                    loading: false,
                });

            }

            selectArea(area) {
                this.setState({
                    show: 'impianti',
                    impianti: [],
                    loading: true,
                    selectedAreaId: area.id,
                    area: area
                });
                this.refreshImpianti(area);
            }

            async refreshImpianti(area) {
                let result = [];

                if(!this.state.isOffline) {
                    try {
                        result = await mf.api.get({
                            storedProcedureName: 'dbo.TPSI_Get_Impianti',
                            data: {
                                id: area.id
                            },
                            dontLogError: this.state.isOffline,
                            storedProcedureKeepEmptyRecordsets: true,
                        });
                    }
                    catch (e) {
                        kendoConsole.log(e);
                    }
                }
                else {
                    result = [this.state.allImpianti.filter(item => item.id.startsWith(area.id))];
                }

                this.setState({
                    impianti: result[0] || [],
                    loading: false,
                });
            }

            async selectImpianto(impianto) {
                this.setState({
                    show: 'impianto',
                    impianto: null,
                    formDefinition: {},
                    loading: true
                });
                this.uploadFileContainer = null;

                let result = [];
                let data = {};
                let formDefinition = [];
                if (!this.state.isOffline) {
                    try {
                        result = await mf.api.get({
                            storedProcedureName: 'dbo.TPSI_Get_Impianto',
                            data: {
                                id: impianto.id || 0,
                                areaId: this.state.selectedAreaId
                            },
                            dontLogError: this.state.isOffline,
                            storedProcedureKeepEmptyRecordsets: true,
                        });
                        if (result.length) {
                            formDefinition = result[0];
                            formDefinition.map(row => {
                                data[row.ColumnName] = row.DetailValue;
                            });
                        }
                    }
                    catch (e) {
                        kendoConsole.log(e);
                    }
                }
                else {
                    if (impianto.id) {
                        const impiantoID = parseInt(impianto.id.substr(-10));
                        data = this.state.allImpiantiDetailData.find(d => d.impianto_id && d.impianto_id === impiantoID || d._id && d._id === impianto._id);
                        if (!data) {
                            data = {};
                        }
                    }

                    const areaID = this.state.selectedAreaId || impianto.areaId;
                    const filterValue = parseInt(areaID.substr(-10));
                    formDefinition = this.state.allImpiantiForms
                        .filter(f => f.MagicTemplateDetailID === filterValue && !f.ColumnName.includes('Video'))
                        .map(field => {
                            if (field.MagicTemplateDataRole && field.MagicTemplateDataRole.startsWith('applicationupload')) {
                                delete data[field.ColumnName];
                                field = Object.assign({}, field);
                                field.MagicTemplateDataRole = 'file';
                                if (field.MagicTemplateDataRole.endsWith('multiple')) {
                                    field.extension = {
                                        multiple: true,
                                    };
                                }
                            }
                            else if (field.MagicTemplateDataRole && (field.MagicTemplateDataRole === 'dropdownlist' || field.MagicTemplateDataRole === 'autocomplete')) {
                                field = Object.assign({}, field);
                                field.extension = {
                                    definition: {
                                        data: this.state.dropValues[field.MagicDataSource] || [],
                                        defaultSearchParam: field.MagicDataSourceTextField,
                                        select: {
                                            [field.MagicDataSourceTextField]: 'description',
                                            [field.MagicDataSourceValueField]: 'id',
                                        },
                                        id: [ field.MagicDataSourceValueField ],
                                    }
                                };
                                if (field.MagicDataSourceValueField === field.MagicDataSourceTextField) {
                                    field.extension.definition.select = { [field.MagicDataSourceTextField]: ['id', 'description']};
                                }
                                delete field.MagicDataSource;
                                if (data[field.ColumnName] && field.extension.definition.data && field.extension.definition.data.length) {
                                    const value = data[field.ColumnName];
                                    const referenceValue = field.extension.definition.data[0][field.MagicDataSourceValueField];
                                    const referenceType = typeof referenceValue;
                                    if (referenceType === 'number') {
                                        data[field.ColumnName] = parseFloat(value);
                                    }
                                }
                            }
                            return field;
                        });
                }

                data.ID = data.id = impianto.id;

                this.setState({
                    formDefinition,
                    impianto: data,
                    loading: false,
                });
                
            }

            setImpiantoData(impianto) {
                this.setState({ impianto });
            }

            compressImage(image) {
                return new Promise((resolve, reject) => {
                    new Compressor(
                        image,
                        {
                            ...imageCompressionOptions,
                            success: resolve,
                            error: reject,
                        }
                    )
                })
            }

            blobToBase64(blob) {
                return new Promise((resolve => {
                    var reader = new FileReader();
                    reader.readAsDataURL(blob); 
                    reader.onloadend = function() {
                        const image = {
                            data: reader.result,
                        };
                        for (const key in blob) {
                            image[key] = blob[key];
                        }
                        resolve(image);                
                    }
                }));
            }

            async onFormFileChange (files, fieldName, event) {
                const promises = [];
                for (const file of files) {
                    if (file.type.startsWith('image')) {
                        promises.push(
                            this.compressImage(file)
                                .then(this.blobToBase64)
                        );
                    }
                    else {
                        promises.push(
                            this.blobToBase64(file)
                        );
                    }
                }
                this.offlineFormfiles[fieldName] = await Promise.all(promises);
            }

            refreshData() {
                this.refreshGroups(this.state.tag);
                this.refreshAree(this.state.group);
                this.refreshImpianti(this.state.area);
            }

            addRemoveImpiantoOffline(state, impianto) {
                const areaID = impianto.id.substring(0, impianto.id.length-10);
                const area = state.allAree.find(a => a.id === areaID);
                
                const groupID = areaID.substring(0, areaID.length-10);
                const group = state.allGroups.find(g => g.id === groupID);

                const index = this.state.impiantiToSync.findIndex(d => d.impianto_id && impianto.impianto_id == d.impianto_id || impianto._id && impianto._id == d._id);
                if (index !== -1) {
                    this.state.impiantiToSync[index] = impianto;
                }
                else {
                    this.state.impiantiToSync.push(impianto);
                }

                if (impianto._action === 'delete') {
                    let index = state.allImpianti.findIndex(i => impianto.id && i.id === impianto.id || impianto._id && impianto._id === i._id);
                    state.allImpianti.splice(index, 1);
                    index = state.allImpiantiDetailData.findIndex(i => impianto.id && i.id === impianto.id || impianto._id && impianto._id === i._id);
                    state.allImpiantiDetailData.splice(index, 1);
                    area.length--;
                    group.length--;
                }
                else if (impianto._action === 'create') {
                    state.allImpianti.push(impianto);
                    state.allImpiantiDetailData.push(impianto);
                    area.length++;
                    group.length++;
                }
            }

            deleteSyncImpianto(impianto) {
                if(!confirm(getObjectText('CONFIRMATION')))
                    return;

                this.state.impiantiToSync.splice(this.state.impiantiToSync.findIndex(i => i.id == impianto.id), 1);
                const update = { impiantiToSync: this.state.impiantiToSync };
                this.setState(update);
                this.storeDataInSessionStorage(update)
            }
            
            async sendDeleteImpianto(impianto) {
                const result = await mf.api.get({
                    storedProcedureName: 'dbo.TPSI_del_Impianti',
                    data: impianto,
                    storedProcedureKeepEmptyRecordsets: true,
                });
                return result;
            }

            async deleteImpianto(impianto) {
                if(!confirm(getObjectText('CONFIRMATION')))
                    return;

                if (!this.state.isOffline) {
                    try {
                        const result = await this.sendDeleteImpianto(impianto);
                        kendoConsole.log(result[0][0].Message);
                        this.refreshData();
                    }
                    catch (e) {
                        kendoConsole.log(e);
                    }
                }
                else {
                    this.setState(state => {
                        const impiantoID = parseInt(impianto.id.substr(-10));
                        const impiantoDetail = state.allImpiantiDetailData.find(d => d.impianto_id && d.impianto_id === impiantoID || d._id && d._id === impianto._id);
                        impianto = Object.assign(impiantoDetail || {}, impianto);
                        impianto._action = 'delete';
                        impianto.updated_at = new Date();
                        
                        this.addRemoveImpiantoOffline(state, impianto);

                        const update = {
                            allImpianti: state.allImpianti,
                            impiantiToSync: state.impiantiToSync,
                            allAree: state.allAree,
                            allGroups: state.allGroups,
                        };

                        setTimeout(() => {
                            this.refreshImpianti(this.state.area);
                            this.storeDataInSessionStorage(update);
                        });
                        return update;
                    });
                }

                this.setState({sending: false});
            }

            setUploadFileContainer(input) {
                if (input) {
                    this.uploadFileContainer = $(input);
                    if (this.state.showForm === false) {
                        this.setState({ showForm: true });
                    }
                }
            }

            async sendImpianto(impianto) {
                const result = await mf.api.get({
                    storedProcedureName: 'dbo.TPSI_Save_Impianto',
                    data: impianto,
                    storedProcedureKeepEmptyRecordsets: true,
                });

                impianto = Object.assign(impianto, { id: result[0][0].ID, ID: result[0][0].ID });
                return { result, impianto };
            }

            async sendForm(e) {
                if (e) {
                    e.preventDefault();
                }
                let impianto = this.state.impianto;
                if (!this.state.isOffline) {
                    this.setState({
                        sending: true,
                    });
                }

                let geoData = {};
                try {
                    geoData = await fetchUsersGeoLocation()
                }
                catch (e) {
                    console.error(e);
                }

                const data = Object.assign(this.state.impianto, { areaId: this.state.selectedAreaId }, geoData.mf || {});

                if (!this.state.isOffline) {
                    try {
                        let { result, impianto: updatedImpianto  } = await this.sendImpianto(data);
                        manageGridUploadedFiles(this.uploadFileContainer);
                        this.state.impianto = updatedImpianto;
                        kendoConsole.log(result[0][0].Message);
                        this.setState({ impianto: impianto });
                        this.refreshData();
                    }
                    catch (e) {
                        kendoConsole.log(e);
                    }
                    
                    this.setState({
                        sending: false,
                    });
                }
                else {
                    clearTimeout(this.sendFormMessageTimeout);
                    data.files = [];
                    for (const column of Object.keys(this.offlineFormfiles)) {
                        data.files.push({
                            column,
                            files: this.offlineFormfiles[column],
                        });
                    }
                    data.updated_at = new Date();
                    
                    if (!impianto._action) {
                        impianto._action = impianto.id ? 'update': 'create';
                        if (impianto._action === 'create') {
                            impianto._id = '' + Date.now() + Math.random();
                            impianto.id = this.state.selectedAreaId + impianto._id.substr(impianto._id.length-10);
                        }
                        this.addRemoveImpiantoOffline(this.state, impianto);
                    }

                    const update = {
                        impiantiToSync: this.state.impiantiToSync,
                        allImpiantiDetailData: this.state.allImpiantiDetailData,
                        allImpianti: this.state.allImpianti,
                        allAree: this.state.allAree,
                        allGroups: this.state.allGroups,
                        impianti: this.state.impianti,
                    };

                    this.setState(update);
                    this.refreshImpianti(this.state.area);
                    this.storeDataInSessionStorage(update);
                    this.setState({
                        sendFormMessage: 'Dati salvati con successo',
                    });
                    this.sendFormMessageTimeout = setTimeout(() => {
                        this.setState({
                            sendFormMessage: null,
                        });
                    }, 3000);
                }
            }

            async syncOffline() {
                await new Promise(resolve => {
                    this.setState({ sending: true, isOffline: false, showOfflineButton: false, syncSuccess: false }, resolve);
                });
                let i = this.state.impiantiToSync.length;
                let syncSuccess = false;
                while (i > 0) {
                    i--;
                    const impianto = this.state.impiantiToSync[i];
                    try {
                        if (impianto._action === 'delete') {
                            await this.sendDeleteImpianto(impianto);
                        }
                        else if (impianto._action) {
                            if (impianto.files) {
                                for (const { column, files } of impianto.files) {
                                    const uploadedFiles = [];
                                    for (const file of files) {
                                        uploadedFiles.push(await uploadFile(file));
                                    }
                                    impianto[column] = JSON.stringify(uploadedFiles);
                                }
                            }
                            const data = Object.assign({}, impianto);
                            delete data.files;
                            if (impianto._action === 'create') {
                                delete data.id;
                                delete data.ID;
                            }
                            await this.sendImpianto(data);
                        }
                        this.state.impiantiToSync.splice(i, 1);
                        syncSuccess = true;
                    }
                    catch (e) {
                        kendoConsole.log(e);
                    }
                }
                this.setState({ sending: false, isOffline: true, impiantiToSync: this.state.impiantiToSync });
                this.storeDataInSessionStorage({ impiantiToSync: this.state.impiantiToSync });
                let message = 'Dati rimossi sincronizzati con successo';
                if (!syncSuccess) {
                    message = 'Nessun dato è stato sincronizzato';
                }
                this.setState({
                    syncMessage: message,
                    syncSuccess,
                });
            }

            formatObject(object) {
                let children = [];
                for (let key in object) {
                    if (object.hasOwnProperty(key)) {
                        children.push(<li key={key}><strong>{key}</strong>: {object[key]}</li>);
                    }
                }
                return <div>{children}</div>;
            }

            closeForm() {
                this.setState({ show: 'impianti', showForm: false, sending: false });
                this.offlineFormfiles = {};
                this.uploadFileContainer = null;
            }

            render() {
                return (
                    <div>
                        <style dangerouslySetInnerHTML={{__html: `
                            .swing-enter {
                                opacity: 0;
                                transition: all 1s cubic-bezier(.36,-0.64,.34,1.76);
                            }

                            .swing-enter.swing-enter-active {
                                opacity: 1;
                            }

                            .swing-exit {
                                opacity: 1;
                                transform: rotateY(-90deg);
                                transition: all 1s cubic-bezier(.36,-0.64,.34,1.76);
                            }

                            .swing-exit.swing-exit-active {
                                opacity: 0;
                            }

                            form.TPSI input,
                            form.TPSI textarea {
                                font-size: 1.5em;
                            }
                            `
                        }} />
                        <div className="row">
                            {!this.state.isOffline && this.state.showOfflineButton && <div className="col-xs-6">
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={this.openOfflineWindow}
                                >
                                    Andare offline
                                </button>
                            </div>}
                            {this.state.isOffline && <div className="col-xs-6" style={{textAlign: 'right'}}>
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={this.showSyncData}
                                >
                                    Syncronizzare dati offline
                                </button>
                            </div>}
                            {this.state.isOffline && <div className="col-xs-6" style={{textAlign: 'right'}}>
                                <button
                                    type="button"
                                    className="btn btn-warning"
                                    onClick={this.askClearStorage}
                                >
                                    Cancellare dati offline
                                </button>
                            </div>}
                        </div>
                        <div className="row" style={{ marginBottom: '1em' }}>
                            <div className="btn-group col-md-11" role="group">
                                {this.state.tags.map(
                                    tag =>
                                        <button
                                            disabled={this.state.sending}
                                            type="button"
                                            key={tag.id}
                                            className={this.state.selectedTagId === tag.id ? 'btn btn-success' : 'btn btn-default'}
                                            onClick={() => this.selectTag(tag)}
                                        >
                                            {tag.label}
                                        </button>
                                )}
                            </div>
                            {this.state.loading && <div className="col-md-1"><i className="fa fa-spinner fa-spin fa-2x"></i></div>}
                            
                        </div>

                        <div className={this.state.show === 'aree' ? '' : 'hidden'}>
                            <div className="row">
                                <TransitionGroup>
                                {
                                    this.state.groups.map(group =>
                                        <Swing key={group.id}>
                                            <div className="col-md-3" style={{ marginBottom: '0.5em'}}>
                                                <button
                                                    onClick={() => this.selectGroup(group)}
                                                    className="btn btn-default"
                                                    style={{
                                                        width: '98%',
                                                        backgroundColor: this.state.selectedGroupId === group.id ? 'blue' : group.color,
                                                        color:  this.state.selectedGroupId === group.id ? 'white' : 'black',
                                                    }}
                                                >
                                                    {`${group.label} (${group.length})`}
                                                </button>
                                            </div>
                                        </Swing>
                                    )
                                }
                                </TransitionGroup>
                            </div>
                            <div className="row">
                                <TransitionGroup>
                                    {
                                        this.state.aree.map(area =>
                                            <Swing key={area.id}>
                                                <div className="col-md-3" style={{ marginBottom: '0.5em'}}>
                                                    <button
                                                        onClick={() => this.selectArea(area)}
                                                        className="btn btn-default"
                                                        style={{ width: '98%', backgroundColor: area.color }}
                                                    >
                                                        {`${area.label} (${area.length})`}
                                                    </button>
                                                </div>
                                            </Swing>
                                        )
                                    }
                                </TransitionGroup>
                            </div>
                        </div>

                        <div className={this.state.show === 'impianti' ? 'row' : 'hidden'}>
                            <div className="col-md-12" style={{ marginBottom: '0.5em'}}>
                                <button className="btn btn-primary" onClick={() => this.selectImpianto({})}><i className="fa fa-plus" aria-hidden="true"></i></button>
                                <button className="btn btn-success" style={{marginLeft: '10px'}} disabled={true}>{this.state.group && this.state.group.label}</button>
                                <button className="btn btn-success" style={{marginLeft: '10px'}} disabled={true}>{this.state.area && this.state.area.label}</button>
                            </div>
                            <div className="panel-group" id="aree-accordion" style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap'
                            }}>
                                {
                                    this.state.impianti && this.state.impianti.map((impianto, i) =>
                                        <Accordion
                                            className="col-md-3"
                                            key={impianto.id}
                                            parentId="aree-accordion"
                                            collapsed={true}
                                            style={{ marginBottom: '0.5em'}}
                                            header={
                                                <div className="btn-group" role="group" style={{width: '100%'}}>
                                                    {impianto._update !== false &&
                                                        <button
                                                            type="button"
                                                            onClick={() => this.selectImpianto(impianto)}
                                                            className="btn btn-primary"
                                                            style={{width: impianto._delete !== false ? '50%' : '100%'}}
                                                        >
                                                            <i className="fa fa-pencil" aria-hidden="true"></i>
                                                        </button>
                                                    }
                                                    {impianto._delete !== false &&
                                                        <button
                                                            type="button"
                                                            onClick={() => this.deleteImpianto(impianto)}
                                                            className="btn btn-danger"
                                                            style={{width: impianto._update !== false ? '50%' : '100%'}}
                                                        >
                                                            <i className="fa fa-trash" aria-hidden="true"></i>
                                                        </button>
                                                    }
                                                </div>
                                            }
                                            title={impianto.label || '...'}
                                            content={impianto.info && this.formatObject(JSON.parse(impianto.info))}
                                        >
                                        </Accordion>
                                    )
                                }
                            </div>
                        </div>
                        {this.state.impianto && this.state.show === 'impianto' &&
                            <div className='row'>
                                <div className="col-md-12" style={{ marginBottom: '0.5em'}}>
                                    <button className="btn btn-primary" onClick={this.closeForm}><i className="fa fa-chevron-left" aria-hidden="true"></i></button>
                                </div>
                                <form className='TPSI' onSubmit={this.sendForm}>
                                    <div className='col-md-12' ref={this.setUploadFileContainer}>
                                        {this.state.showForm
                                            && <Form
                                                id="tpsiDetailForm"
                                                data={this.state.impianto}
                                                magicFormDefinition={this.state.formDefinition}
                                                onChange={this.setImpiantoData}
                                                onFileChange={this.state.isOffline && this.onFormFileChange}
                                                readonly={this.state.sending}
                                                uploadFileContainer={this.uploadFileContainer}
                                                isOffline={this.state.isOffline} />
                                        }
                                    </div>
                                    <div className="col-md-6">
                                        <button
                                            className="btn btn-primary"
                                            disabled={this.state.sending}
                                        >
                                            <i className="fa fa-check" aria-hidden="true"></i>
                                        </button>
                                        {this.state.sendFormMessage
                                            && <button
                                                className="btn btn-success"
                                                disabled="true"
                                            >
                                                {this.state.sendFormMessage}
                                            </button>
                                        }
                                    </div>
                                </form>
                            </div>
                        }
                        {this.state.show === 'sync' &&
                            <div>
                                <div className="panel-group" id="aree-accordion" style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap'
                            }}>
                                {
                                    this.state.impiantiToSync.map((impianto, i) =>
                                        <Accordion
                                            className="col-md-3"
                                            key={impianto.id}
                                            parentId="aree-accordion"
                                            collapsed={true}
                                            style={{ marginBottom: '10px'}}
                                            title={
                                                <div>
                                                    {impianto._action === 'delete' && <i className="fa fa-trash" aria-hidden="true"></i>}
                                                    {impianto._action === 'update' && <i className="fa fa-pencil" aria-hidden="true"></i>}
                                                    {impianto._action === 'create' && <i className="fa fa-plus" aria-hidden="true"></i>}
                                                    {impianto.Descrizione}
                                                </div>
                                            }
                                            header={
                                                <div>
                                                    <button
                                                        type="button"
                                                        onClick={() => this.selectImpianto(impianto)}
                                                        className="btn btn-primary"
                                                        style={{width: '50%'}}
                                                    >
                                                        <i className="fa fa-pencil" aria-hidden="true"></i>
                                                    </button>
                                                    <button
                                                            type="button"
                                                            onClick={() => this.deleteSyncImpianto(impianto)}
                                                            className="btn btn-danger"
                                                            style={{width: '50%'}}
                                                        >
                                                        <i className="fa fa-trash" aria-hidden="true"></i>
                                                    </button>
                                                </div>
                                            }
                                            content={
                                                impianto.files &&
                                                    impianto.files.map(({column, files}) =>
                                                        <div>
                                                            {column}
                                                            <div>{
                                                                files.map(file => {
                                                                    if (file.type.startsWith('image')) {
                                                                        return <img src={file.data} alt={file.name} title={file.name} className="img-thumbnail" style={{width: '33%'}} />
                                                                    }
                                                                    return file.name;
                                                                })
                                                            }</div>
                                                        </div>
                                                    )
                                            }
                                        >
                                        </Accordion>
                                    )
                                }
                            </div>
                                <button
                                    className="btn btn-primary"
                                    disabled={this.state.sending}
                                    onClick={this.syncOffline}
                                >
                                    <i className="fa fa-paper-plane" aria-hidden="true"></i>
                                </button>
                                {this.state.syncMessage
                                    && 
                                    <React.Fragment>
                                        <button
                                        className="btn btn-success"
                                        disabled="true"
                                        >
                                            {this.state.syncMessage}
                                        </button>
                                        {this.state.syncSuccess && <button
                                            className="btn btn-success"
                                            onClick={this.returnToOnlineView}
                                        >
                                            Go online
                                        </button>}
                                    </React.Fragment>
                                }
                            </div>
                        }
                    </div>
                );
            }
        }

        resolve(TPSI);
    });
});
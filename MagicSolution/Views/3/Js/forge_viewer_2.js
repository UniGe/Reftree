

//ultima versione
const Forge = {

    forgeViewer: null,
    _initiated: false,

    // ECore API
    _api_endpoint: 'https://apistaging.adhox.it',
    _api_endpoint_route: "/Ideare/BIM/api/guest",

    //_api_endpoint: 'http://api.adhox.it',
    //_api_endpoint_route: "/api/guest",

    _api_client_id: "SWRlYXJlR3Vlc3RDbGllbnRJZA==",
    _api_client_secret: "SWRlYXJlR3Vlc3RDbGllbnRTZWNyZXQ=",
    _api_token: null,
    _api_token_expires_at: null,

    _forge_token: null,

    init(opt = {}) {
        if (this._initiated) return new Promise((r) => r(true));
        else this._initiated = true;

        // Check if opt is sent by User
        if (opt.api_endpoint) this._api_endpoint = opt.api_endpoint;

        if (opt.api_route) this._api_endpoint_route = opt.api_route;

        // Add /api/guest
        this._api_endpoint = this._api_endpoint + this._api_endpoint_route;

        let that = this;

        return Promise.all([
            //this._loadScript('https://xf79h9aa3l.execute-api.us-west-2.amazonaws.com/toolkit2/api/_adsk.js'),
            this._loadScript('https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js'),
            this._loadStyle('https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css'),
            this._authenticate(that)
        ]);
    },

    getViewer(divId) {
        const div = document.getElementById(divId);

        const viewer = new Autodesk.Viewing.GuiViewer3D(div);
        this.forgeViewer = new ForgeViewer(viewer);

        return this.forgeViewer;
    },

    _loadScript(src) {
        return new Promise(resolve => {
            let script = document.createElement('script');
            script.src = src;
            script.async = false;
            document.head.append(script);
            script.onload = () => {
                resolve()
            }
        });
    },

    _loadStyle(src) {
        return new Promise(resolve => {
            let link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = src;
            document.head.append(link);
            link.onload = () => {
                resolve()
            }
        });
    },

    // Authenticate to ECore Backend and Forge
    _authenticate(that) {
        return new Promise((resolve, reject) => {
            

            let xhr = new XMLHttpRequest();

            xhr.open("POST", `${Forge._api_endpoint}/authenticate`, true)

            xhr.onload = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {

                        const result = JSON.parse(xhr.responseText);

                        // GUEST Api Token and Expiration Date
                        that._api_token = result.guestAccessToken;

                        if (result.expiresAt) {
                            that._api_token_expires_at = new Date(result.expiresAt);
                        }

                        // FORGE Token
                        that._forge_token = result.forgeAccessToken;

                        resolve();
                    } else {
                        console.log(xhr.statusText);
                        reject(xhr.statusText);
                    }
                }
            };

            xhr.onerror = (e) => {
                console.log(e);
                reject(e);
            };

            xhr.setRequestHeader("Content-Type", "application/json");

            // Send the guest credentials to ECore
            const body = {
                "guestClientId": this._api_client_id,
                "guestClientSecret": this._api_client_secret
            };

            xhr.send(JSON.stringify(body));
        })
    },
}

window.Forge = Forge;

class ForgeViewer {

    // Private
    #modelLoadedCallback;

    #treeActionFunction;

    modelsTree;
    componentsTableMulti;

    constructor(viewer) {
        this.models = null;
        this.viewer = viewer;
        this.tagsTable = [];

        this.#modelLoadedCallback = null;
        this.#treeActionFunction = null;
        this._originalFragmentsMaterial = [];
        this.modelsTree = {};
        this.componentsTableMulti = {};
    }

    // Check if ApiToken is expired
    #checkForgeAuth() {
        if (Forge._api_token_expires_at.getTime() <= new Date().getTime()) {
            return Forge._authenticate(Forge);
        } else {
            return new Promise((resolve, rej) => { resolve() });
        }
    }

    //
    // GUEST FUNCTIONS
    //

    // Get Company Projects
    getProjects() {
        return new Promise((resolve, reject) => {

            // Check if token expired
            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();

                xhr.open("GET", `${Forge._api_endpoint}/GetProjects`, true)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send();
            });
        });
    }

    // Get Project by Id
    getProjectById(id) {
        return new Promise((resolve, reject) => {

            // Check if token expired
            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();

                xhr.open("GET", `${Forge._api_endpoint}/GetProjectById/project/${id}`, true)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send();
            });
        });
    }

    // Create a Project
    createProject(item) {
        return new Promise((resolve, reject) => {

            // Check if token expired
            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();

                xhr.open("POST", `${Forge._api_endpoint}/CreateProject`, true)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);
                xhr.setRequestHeader("Content-Type", "application/json");

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send(JSON.stringify(item));
            });
        });
    }

    // Delete a Project by Id
    deleteProjectById(id) {
        return new Promise((resolve, reject) => {

            // Check if token expired
            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();

                xhr.open("DELETE", `${Forge._api_endpoint}/DeleteProject/project/${id}`, true)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve();
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send();
            });
        });
    }

    // Get Models by project id
    getModelsByProjectId(id) {
        return new Promise((resolve, reject) => {

            // Check if token expired
            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();

                xhr.open("GET", `${Forge._api_endpoint}/GetModels/project/${id}`, true)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send();
            });
        });
    }

    // Get Model by id
    getModelById(id) {
        return new Promise((resolve, reject) => {

            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();
                xhr.open("GET", `${Forge._api_endpoint}/GetModel/model/${id}`)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send();
            });
        });
    }

    // Get Views by ModelId
    getViewsByModelId(id) {
        return new Promise((resolve, reject) => {

            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();
                xhr.open("GET", `${Forge._api_endpoint}/GetViews/model/${id}`)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send();
            });
        });
    }

    // Get ObjectTree by ModelId
    getObjectTreeByModelId(id) {
        return new Promise((resolve, reject) => {

            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();
                xhr.open("GET", `${Forge._api_endpoint}/GetObjectTree/model/${id}`)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send();
            });
        });
    }

    // Get ObjectTree by ModelId and View Guid
    getObjectTreeByModelIdAndView(id, viewGuid) {
        return new Promise((resolve, reject) => {

            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();
                xhr.open("GET", `${Forge._api_endpoint}/GetObjectTree/model/${id}/view/${viewGuid}`)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send();
            });
        });
    }

    // Upload a model
    uploadModelByProjectId(projectId, file) {
        return new Promise((resolve, reject) => {

            // Check if token expired
            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();

                xhr.open("POST", `${Forge._api_endpoint}/UploadModel/project/${projectId}`, true)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };
                var formData = new FormData();
                formData.append("files", file);

                xhr.send(formData);
            });
        });
    }

    // Delete a Model by Id
    deleteModelById(id) {
        return new Promise((resolve, reject) => {

            // Check if token expired
            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();

                xhr.open("DELETE", `${Forge._api_endpoint}/DeleteModel/model/${id}`, true)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve();
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send();
            });
        });
    }

    // Convert a model by Id
    convertModelById(modelId) {
        return new Promise((resolve, reject) => {

            // Check if token expired
            this.#checkForgeAuth().then(() => {

                let xhr = new XMLHttpRequest();

                xhr.open("POST", `${Forge._api_endpoint}/ConvertModel/model/${modelId}`, true)
                xhr.setRequestHeader("Guest-Token", Forge._api_token);

                xhr.onload = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve();
                        } else {
                            console.log(xhr.statusText);
                            reject(xhr.statusText);
                        }
                    }
                };

                xhr.onerror = (e) => {
                    console.log(e);
                    reject(e);
                };

                xhr.send();
            });
        });
    }

    //
    // CALLBACK
    // 

    // Set selection and modelLoaded callbacks
    setCallbacks(selectionCallback, modelLoadedCallback) {
        this.viewer.addEventListener("selection", selectionCallback);
        this.#modelLoadedCallback = modelLoadedCallback;
    }

    // Set the function that will be called when the tree is build
    setTreeFunction(action) {
        this.#treeActionFunction = action;
    }

    //
    // LOAD
    //
    // Load the model Asynchronously
    loadModelAsync(inputModel) {
        this.loadModelsAsync([inputModel]);
    }

    // Load the model Synchronously
    loadModel(inputModel) {
        return new Promise((resolve, reject) => {

            const viewerOptions = {
                env: 'AutodeskProduction',
                accessToken: Forge._forge_token,
            };

            Autodesk.Viewing.Initializer(viewerOptions, () => {

                if (this.viewer) {
                    this.viewer.start();

                    this.models = [];

                    Autodesk.Viewing.Document.load(`urn:${window.btoa(inputModel.urn)}`, (doc) => {

                        const viewables = doc.getRoot().getDefaultGeometry();

                        let transformations;
                        if (inputModel.position || inputModel.rotation) {
                            transformations = new THREE.Matrix4();
                            if (inputModel.rotation) {
                                if (inputModel.rotation.x) transformations.makeRotationX(inputModel.rotation.x)
                                if (inputModel.rotation.y) transformations.makeRotationY(inputModel.rotation.y)
                                if (inputModel.rotation.z) transformations.makeRotationZ(inputModel.rotation.z)
                            }
                            if (inputModel.position) {
                                transformations.setPosition(inputModel.position)
                                //transformations.setPosition(inputModel.position.x, inputModel.position.y, inputModel.position.z)
                            }
                        }

                        this.viewer.loadDocumentNode(doc, viewables, {
                            placementTransform: transformations,
                            keepCurrentModels: true,
                            globalOffset: { x: 0, y: 0, z: 0 }
                        }).then((model) => {
                            // Add model to loaded models
                            this.viewer.waitForLoadDone(model).then(() => this.#onModelLoaded(model)).then(() => {
                                resolve(model);
                            }).catch(rej => {
                                console.log("Some error appeared");
                                reject(rej);
                            });
                        });
                    }, (error) => {
                        console.log('Failed fetching Forge manifest', error);
                        reject(error);
                    });
                }
            });
        });
    }

    // Load the models Asynchronously
    loadModelsAsync(inputModels) {

        const viewerOptions = {
            env: 'AutodeskProduction',
            accessToken: Forge._forge_token,
        };

        Autodesk.Viewing.Initializer(viewerOptions, () => {

            if (this.viewer) {
                this.viewer.start();

                this.models = [];

                inputModels.map((m) => {
                    Autodesk.Viewing.Document.load(`urn:${window.btoa(m.urn)}`, (doc) => {

                        const viewables = doc.getRoot().getDefaultGeometry();

                        let transformations;
                        if (m.position || m.rotation) {
                            transformations = new THREE.Matrix4();
                            if (m.rotation) {
                                if (m.rotation.x) transformations.makeRotationX(m.rotation.x)
                                if (m.rotation.y) transformations.makeRotationY(m.rotation.y)
                                if (m.rotation.z) transformations.makeRotationZ(m.rotation.z)
                            }
                            if (m.position) {
                                transformations.setPosition(m.position)
                                //transformations.setPosition(m.position.x, m.position.y, m.position.z)
                            }
                        }

                        this.viewer.loadDocumentNode(doc, viewables, {
                            placementTransform: transformations,
                            keepCurrentModels: true,
                            globalOffset: { x: 0, y: 0, z: 0 }
                        }).then((model) => {
                            // Add model to loaded models
                            this.viewer.waitForLoadDone(model).then(() => this.#onModelLoaded(model));
                        });
                    }, (error) => {
                        console.log('Failed fetching Forge manifest', error);
                    });
                })
            }
        });
    }

    // Load the models Synchronously
    loadModels(inputModels) {
        return new Promise((resolve, reject) => {

            let maxLength = inputModels.length;

            const viewerOptions = {
                env: 'AutodeskProduction',
                accessToken: Forge._forge_token,
            };

            Autodesk.Viewing.Initializer(viewerOptions, () => {

                if (this.viewer) {
                    this.viewer.start();

                    this.models = [];

                    inputModels.map((m, index) => {
                        Autodesk.Viewing.Document.load(`urn:${window.btoa(m.urn)}`, (doc) => {

                            const viewables = doc.getRoot().getDefaultGeometry();

                            let transformations;
                            if (m.position || m.rotation) {
                                transformations = new THREE.Matrix4();
                                if (m.rotation) {
                                    if (m.rotation.x) transformations.makeRotationX(m.rotation.x)
                                    if (m.rotation.y) transformations.makeRotationY(m.rotation.y)
                                    if (m.rotation.z) transformations.makeRotationZ(m.rotation.z)
                                }
                                if (m.position) {
                                    transformations.setPosition(m.position)
                                    //transformations.setPosition(m.position.x, m.position.y, m.position.z)
                                }
                            }

                            this.viewer.loadDocumentNode(doc, viewables, {
                                placementTransform: transformations,
                                keepCurrentModels: true,
                                globalOffset: { x: 0, y: 0, z: 0 }
                            }).then((model) => {
                                // Add model to loaded models
                                this.viewer.waitForLoadDone(model).then(() => this.#onModelLoaded(model)).then(() => {
                                    if ((maxLength - 1) == index) {
                                        resolve(this.models);
                                    }
                                }).catch(rej => {
                                    reject(rej);
                                });
                            });
                        }, (error) => {
                            console.log('Failed fetching Forge manifest', error);
                        });
                    })
                }
            });
        });
    }

    #onModelLoaded(model) {
        let that = this;
        this.models.push(model);

        // Build the tree
        var forgeTree = this.#buildModelTree(model);

        this.modelsTree[model.id] = forgeTree;

        this.#buildComponentsTable(forgeTree.objects[0], null, model.id);

        var maxLength = Object.keys(this.componentsTableMulti).filter(el => el.includes(`model: {${model.id}}`)).length;
        for (const [key, value] of Object.entries(this.componentsTableMulti)) {
            this.getProperties(model, value.object.objectId).then((result) => {
                that.componentsTableMulti[key].properties = result.properties;
                if (result.dbId == maxLength) {
                    that.#buildTagsTable(that.#modelLoadedCallback); // need to wait that all properties will be set
                }
            });
        }
    }

    // Remove the models and unload the viewer
    unloadViewable() {
        this.models = [];
        if (this.viewer) {
            this.viewer.tearDown();
            this.viewer.finish();
            this.viewer = null;
        }
    }

    // Show the selected element
    show(model, objectId) {
        let that = this;

        this.viewer.show(objectId, model);

        setTimeout(function () {

            if (objectId == 1) { // root component
                that.#setAllIsShownPropertyInComponentTable(true);
                return;
            }

            var obj = that.getComponentByModel(model.id, objectId);
            if (obj) {
                var descent = that.getObjectDescent(obj.object);
                for (var i = 0; i < descent.length; i++) {
                    that.#setIsShownPropertyInComponentTableNode(model.id, descent[i], true); // for asynchronous execution
                }
            }
        }, 0); // for asynchronous execution


    }

    // Hide the selected element
    hide(model, objectId) {
        let that = this;

        this.viewer.hide(objectId, model);

        setTimeout(function () {

            if (objectId == 1) { // root component
                that.#setAllIsShownPropertyInComponentTable(false);
                return;
            }

            var obj = that.getComponentByModel(model.id, objectId);
            if (obj) {
                var descent = that.getObjectDescent(obj.object);
                for (var i = 0; i < descent.length; i++) {
                    that.#setIsShownPropertyInComponentTableNode(model.id, descent[i], false); // for asynchronous execution
                }
            }
        }, 0); // for asynchronous execution
    }

    // Isolate multiple elements
    isolate(model, objectId) {
        this.viewer.isolate(objectId, model)
        this.viewer.fitToView(objectId, model)
    }

    // Set color for element (RGB)
    colorize(model, objectId, r, g, b, intensity = 1) {
        this.viewer.setThemingColor(objectId, new THREE.Vector4(r, g, b, intensity), model, true);
    }

    // Set color for element (material RGB)
    colorizeWithMaterialRgb(model, objectId, r, g, b, intensity = 1) {
        var hexColor = this.#rgbToHex(r, g, b);
        this.colorizeWithMaterialHex(model, objectId, hexColor, intensity)
    }

    // Set color for element (material HEX)
    colorizeWithMaterialHex(model, objectId, hex, intensity = 1) {

        // defining new material:
        const material = new THREE.MeshPhongMaterial({
            side: THREE.DoubleSide,
            reflectivity: 0.0,
            flatShading: true,
            transparent: true,
            opacity: intensity,
            color: hex
        });

        const materials = this.viewer.impl.matman();

        materials.addMaterial("MyCustomMaterial" + hex.toString(), material, true);

        let tree = model.getData().instanceTree;

        tree.enumNodeFragments(objectId, (fragId) => {
            this._originalFragmentsMaterial[fragId] = this.viewer.model.getFragmentList().getMaterial(fragId);

            model.getFragmentList().setMaterial(fragId, material);

            this.viewer.impl.getFragmentProxy(model, fragId).updateAnimTransform();
        });

        this.viewer.impl.invalidate(true);
    }

    // Restore the original material
    restoreDefaultMaterial(model, objectId) {

        let tree = model.getData().instanceTree;

        tree.enumNodeFragments(objectId, (fragId) => {

            var originalFragmentMaterial = this._originalFragmentsMaterial[fragId];

            if (originalFragmentMaterial) {
                model.getFragmentList().setMaterial(fragId, originalFragmentMaterial);
                this.viewer.impl.getFragmentProxy(model, fragId).updateAnimTransform();
            }
        });

        this.viewer.impl.invalidate(true);
    }

    // Clear the colors of the model
    clearColors(model) {
        this.viewer.clearThemingColors(model)
    }

    // Set ghosting 
    setGhosting(value) {
        this.viewer.setGhosting(value);
    }

    // Set the selected property visibility
    setPropertyVisibility(visibility, category, propertyName, propertyValue) {

        // is clicked a PropertyValue (3° Level)
        if (propertyValue != null) {
            this.tagsTable.find(el => el.category == category).properties.find(el => el.property == propertyName).values.find(el => el.value == propertyValue).visible = visibility;
        } else {

            // PropertyName is empty if is clicked only the Category (1° Level)
            var categoryInstance = this.tagsTable.find(el => el.category == category);
            if (propertyName == "") {
                categoryInstance.visible = visibility;

                categoryInstance.properties.map(prop => {
                    prop.visible = visibility;
                    prop.values.map(el => el.visible = visibility);
                })
            } else {
                // Is Clicked a Property (2° Level)
                var propertyInstance = categoryInstance.properties.find(el => el.property == propertyName);
                propertyInstance.visible = visibility;
                propertyInstance.values.map(el => el.visible = visibility);
            }
        }
    }

    // Find if the selected property is visible
    isPropertyVisible(category, propertyName, propertyValue) {
        if (propertyValue != null) {
            return this.tagsTable.find(el => el.category.replace("'", "") == category).properties.find(el => el.property.replace("'", "") == propertyName).values.find(el => el.value.toString().replace("'", "") == propertyValue).visible;
        } else {

            if (propertyName == "") {
                return this.tagsTable.find(el => el.category.replace("'", "") == category).visible;
            } else {
                return this.tagsTable.find(el => el.category.replace("'", "") == category).properties.find(el => el.property.replace("'", "") == propertyName).visible;
            }
        }
    }

    // Focus the selected element
    focusComponent(model, objectId) {

        this.viewer.fitToView([objectId], model, false);
        this.viewer.select([objectId], model);

        this.hide(model, 1); // hide everything
        this.show(model, objectId);
    }

    toggleComponentSelection(model, objectId) {

        var selectedObjectIds = this.viewer.getSelection();

        var index = selectedObjectIds.indexOf(objectId);
        if (index > -1) {
            // remove item from selected
            selectedObjectIds.splice(index, 1);
        } else {
            // add item to selected
            selectedObjectIds.push(objectId);
            this.viewer.fitToView([objectId], model, false);
            this.show(model, objectId);
        }

        // update selection:
        this.viewer.select(selectedObjectIds, model);
    }

    clearSelection() {
        this.viewer.clearSelection();
    }

    getGuidMap(model) {
        return new Promise(resolve => {
            model.getExternalIdMapping((data) => resolve(data))
        })
    }

    // Get the selected object ids
    getSelectedObjectIds() {
        return this.viewer.getSelection();
    }

    getComponentByModel(modelId, objectId) {
        return this.componentsTableMulti[this.getDictionaryKey(modelId, objectId)];
    }

    getComponentsByName(searchFilter, doAllowContainsSearch) {
        if (doAllowContainsSearch)
            return Object.values(this.componentsTableMulti).filter(element => element.object.name.toUpperCase().includes(searchFilter.toUpperCase()));
        else
            return Object.values(this.componentsTableMulti).filter(element => element.object.name.toUpperCase() === searchFilter.toUpperCase());
    }

    getAllChildrenComponent(objectId) {
        var node = Object.values(this.componentsTableMulti).find(element => element.id === objectId);
        if (node == null || node === undefined)
            return [];
        return this.#traverse(node);
    }

    getAllAncesters(objectId) {

        var ancesters = [];

        var currentNode = Object.values(this.componentsTableMulti).find(element => element.id === objectId);
        if (currentNode === undefined)
            return ancesters;

        while (currentNode.parent != null) {
            var parentNode = Object.values(this.componentsTableMulti).find(element => element.id === currentNode.parent);
            ancesters.push(parentNode.id);
            currentNode = parentNode;
        }

        return ancesters;
    }

    getAllComponentsByCategoryPropertyValue(category, propertyName, propertyValue, doAllowContainsSearch, previousResults) {

        var results = Object.values(this.componentsTableMulti);

        if (previousResults != null && previousResults.length > 0)
            results = previousResults;

        if (category !== null && category !== undefined && category !== "")
            results = results.filter(element => _filterByCategory(element.properties, category, doAllowContainsSearch));

        if (propertyName !== null && propertyName !== undefined && propertyName !== "")
            results = results.filter(element => _filterByPropertyName(element.properties, propertyName, doAllowContainsSearch));

        if (propertyValue !== null && propertyValue !== undefined && propertyValue !== "")
            results = results.filter(element => _filterByPropertyValue(element.properties, propertyValue, doAllowContainsSearch));

        return results;

        function _filterByCategory(properties, category, doAllowContainsSearch) {
            if (properties != null) {
                for (var i = 0; i < properties.length; i++) {
                    if (doAllowContainsSearch) {
                        if ((properties[i].displayCategory).toString().toUpperCase().replace("'", "").includes((category).toString().toUpperCase().replace("'", ""))) {
                            return true;
                        }
                    } else {
                        if ((properties[i].displayCategory).toString().toUpperCase().replace("'", "") === (category).toString().toUpperCase().replace("'", "")) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        function _filterByPropertyName(properties, propertyName, doAllowContainsSearch) {
            if (properties != null) {
                for (var i = 0; i < properties.length; i++) {
                    if (doAllowContainsSearch) {
                        if ((properties[i].displayName).toString().toUpperCase().replace("'", "").includes((propertyName).toString().toUpperCase().replace("'", ""))) {
                            return true;
                        }
                    } else {
                        if ((properties[i].displayName).toString().toUpperCase().replace("'", "") === (propertyName).toString().toUpperCase().replace("'", "")) {
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        function _filterByPropertyValue(properties, propertyValue, doAllowContainsSearch) {
            if (properties != null) {
                for (var i = 0; i < properties.length; i++) {
                    if (doAllowContainsSearch) {
                        if ((properties[i].displayValue).toString().toUpperCase().replace("'", "").includes((propertyValue).toString().toUpperCase().replace("'", ""))) {
                            return true;
                        }
                    } else {
                        if ((properties[i].displayValue).toString().toUpperCase().replace("'", "") === (propertyValue).toString().toUpperCase().replace("'", "")) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }

    getDictionaryKey(modelId, objectId) {
        return `model: {${modelId}}, object: {${objectId}}`;
    }

    getFirstLevelChildrenComponent(objectId) {
        return Object.values(this.componentsTableMulti).filter(el => el.parent === objectId);
    }

    getFirstLevelChildrenComponentByModel(modelId, objectId) {
        var filtered = Object.entries(this.componentsTableMulti).filter(el => el[0].includes(`model: {${modelId}}`)).map(el => el[1]);
        return Object.values(filtered).filter(el => el.parent === objectId);
    }

    // Get element Properties (Promise)
    getProperties(model, objectId) {
        return new Promise(resolve => {
            model.getProperties(objectId, (data) => resolve(data))
        })
    }

    getRootComponent() {
        return Object.values(this.componentsTableMulti).find(el => el.parent === null);
    }

    getObjectDescentByIds(modelId, objectId) {
        var children = [];
        var value = this.getComponentByModel(modelId, objectId);
        if (value != undefined) {
            children = this.#findObjectTreeChildren(value.object);
        }
        return children;
    }

    getObjectDescent(obj) {
        var children = this.#findObjectTreeChildren(obj);
        return children;
    }

    //
    // PRINT
    //
    getScreenShot() {
        if (this.viewer) {
            Autodesk.Viewing.ScreenShot.getScreenShotAtScreenSize(
                this.viewer,
                img => this.#createPDF(img),
                {}
            );
        }
    }

    //
    // SUPPORT
    //

    #buildModelTree(model) {

        // Private
        function _buildModelTreeRec(node, treeActionFunction) {
            it.enumNodeChildren(node.objectId, (childId) => {
                node.objects = node.objects || [];

                const childNode = {
                    objectId: childId,
                    name: it.getNodeName(childId)
                };

                node.objects.push(childNode);

                // External function
                if (treeActionFunction) {
                    treeActionFunction(node);
                }

                _buildModelTreeRec(childNode, treeActionFunction);
            });
        }

        // Get model instance tree and root component
        const it = model.getData().instanceTree;
        const rootId = it.getRootId();
        const rootNode = {
            objectId: rootId,
            name: it.getNodeName(rootId)
        };

        const tree = {
            modelId: model.id,
            viewGuid: "",
            objects: [rootNode]
        }

        _buildModelTreeRec(rootNode, this.#treeActionFunction);

        return tree;
    }

    // For each node, build his components relationship (child and parent)
    #buildComponentsTable(currentNode, parentNode, modelId) {

        let currentComponent = {
            id: currentNode.objectId,
            object: currentNode,
            parent: null,
            isShown: true,
            properties: null,
            isLeaf: false,
            modelId: modelId,
        }

        if (parentNode !== null) {
            currentComponent.parent = parentNode.objectId;
        }

        if (!currentNode.hasOwnProperty('objects')) {
            currentComponent.isLeaf = true;
        }

        //
        var key = this.getDictionaryKey(modelId, currentNode.objectId); // var matches = key.match(/\{.+?\}/g).map((x) => { return x.slice(1, -1) })
        this.componentsTableMulti[key] = currentComponent;

        if (!currentNode.hasOwnProperty('objects')) {
            return;
        }

        currentNode.objects.forEach(child => {
            this.#buildComponentsTable(child, currentNode, modelId);
        })
    }

    // https://stackoverflow.com/questions/48039639/what-is-the-algorithm-to-traverse-a-non-binary-tree-without-recursion-using-sta
    #traverse(node) {
        var stack = [];
        var stackPointer = 0;
        var visitedNodes = [];
        for (; ;) {
            while (node && !node.isLeaf) {
                stack[stackPointer++] = {
                    node: node,
                    i: 0
                };
                node = this.getFirstLevelChildrenComponent(node.id)[0];
                visitedNodes.push(node);
            }
            for (; ;) {
                if (stackPointer == 0) {
                    return visitedNodes;
                }
                node = stack[--stackPointer].node;
                var i = stack[stackPointer].i + 1;
                var firstLevelChildren = this.getFirstLevelChildrenComponent(node.id);
                if (i < firstLevelChildren.length) {
                    stack[stackPointer++].i = i;
                    node = firstLevelChildren[i];
                    visitedNodes.push(node);
                    break;
                }
            }
        }
    }

    #setIsShownPropertyInComponentTableNode(modelId, objectId, value) {

        let node = this.getComponentByModel(modelId, objectId);

        if (node !== undefined) {
            node.isShown = value;

            var children = this.getObjectDescent(node);
            if (children) {
                for (var i = 0; i < children.length; i++) {
                    var currentDescentNode = this.getComponentByModel(modelId, children[i]);
                    currentDescentNode.isShown = value;
                }
            }
        }
    }

    #setAllIsShownPropertyInComponentTable(value) {
        for (const [key, val] of Object.entries(this.componentsTableMulti)) {
            val.isShown = value;
        }
    }

    #buildTagsTable(modelLoadedCallback) {

        for (const [key, value] of Object.entries(this.componentsTableMulti)) {

            let properties = value.properties;

            if (properties !== undefined && properties !== null) {
                for (var j = 0; j < properties.length; j++) {
                    var instance = properties[j];

                    // Set Category 
                    if (this.tagsTable.find(el => el.category == instance.displayCategory) == null) {
                        var cat = {
                            category: instance.displayCategory,
                            visible: true,
                            properties: []
                        }

                        this.tagsTable.push(cat);
                    }

                    // From Category set Property
                    var catInstance = this.tagsTable.find(el => el.category == instance.displayCategory);
                    if (catInstance.properties.find(el => el.property == instance.displayName) == null) {

                        var prop = {
                            property: instance.displayName,
                            visible: true,
                            values: []
                        }

                        catInstance.properties.push(prop);
                    }

                    // From Property set Property Value
                    var propInstance = catInstance.properties.find(el => el.property == instance.displayName);
                    if (instance.displayValue !== '' &&
                        propInstance.values.find(el => el.value == instance.displayValue) == null) {
                        var propValue = {
                            value: instance.displayValue,
                            visible: true
                        }

                        propInstance.values.push(propValue)
                    }
                }
            }
        }

        if (modelLoadedCallback)
            modelLoadedCallback();
    }

    #componentToHex(c) {
        let hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    #rgbToHex(r, g, b) {
        return "#" + this.#componentToHex(r) + this.#componentToHex(g) + this.#componentToHex(b);
    }

    #createPDF(imgData) {
        var doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: [this.viewer.canvas.width, this.viewer.canvas.height]
        });

        doc.addImage(imgData, 'JPEG', 0, 0, this.viewer.canvas.width, this.viewer.canvas.height);
        doc.save('model.pdf')
    }

    #findObjectTreeChildren(child) {
        var array = [];

        if (child != undefined) {
            if (child.objects && child.objects.length > 0) {
                child.objects.forEach(val => {
                    array.push(val.objectId);
                    var childrenArray = this.#findObjectTreeChildren(val);

                    array = [...array, ...childrenArray];
                })
            }
        }

        return array;
    }

    // Transform elements into CSV
    //projectionToCSV(valuesToShow, elements) {

    //    /*
    //    var valuesToShow = [
    //    {
    //        category: 'Item',
    //        propertyName: 'Type',
    //        alias: 'tipo'
    //    },
    //    { 
    //        category: 'Entità',
    //        propertyName: 'Area',
    //        alias: 'area'
    //    }]*/

    //    var results = [];
    //    for (var i = 0; i < elements.length; i++) {

    //        for (var k = 0; k < valuesToShow.length; k++) {

    //            var category = valuesToShow[k].category;
    //            var propertyName = valuesToShow[k].propertyName;
    //            valuesToShow[k].value = null; // qui verrà aggiunto il risultato trovato

    //            for (var j = 0; j < elements[i].properties.length; j++) {

    //                if ((elements[i].properties[j].displayCategory).toString().toUpperCase().replace("'", "") === ((category).toString().toUpperCase().replace("'", ""))) {
    //                    if ((elements[i].properties[j].displayName).toString().toUpperCase().replace("'", "") === ((propertyName).toString().toUpperCase().replace("'", ""))) {
    //                        valuesToShow[k].value = elements[i].properties[j].displayValue;
    //                        continue;
    //                    }
    //                }
    //            }

    //        }

    //        var currentNode = {
    //            id: elements[i].id,
    //            name: elements[i].name,
    //            parent: elements[i].parent
    //        }

    //        for (var k = 0; k < valuesToShow.length; k++) {
    //            currentNode[valuesToShow[k].alias] = valuesToShow[k].value;
    //        }

    //        results.push(currentNode);
    //    }

    //    var csv = "id;\tname;\tparent;\t";

    //    for (var k = 0; k < valuesToShow.length; k++) {
    //        csv += valuesToShow[k].alias;

    //        if (k < valuesToShow.length - 1)
    //            csv += ";\t"
    //    }

    //    csv += "\n";

    //    for (var i = 0; i < results.length; i++) {
    //        csv += results[i].id + ";\t" + results[i].name + ";\t" + results[i].parent + ";\t";

    //        for (var k = 0; k < valuesToShow.length; k++) {
    //            csv += results[i][valuesToShow[k].alias];

    //            if (k < valuesToShow.length - 1)
    //                csv += ";\t"
    //        }

    //        csv += "\n";
    //    }

    //    return csv;
    //}
}


//ultima versione

//versione prima del 27/05/2021
//const Forge = {

//    forgeViewer: null,
//    _initiated: false,


//    // ECore API
//    _api_endpoint: 'https://apistaging.adhox.it',
//    _api_endpoint_route: "/Ideare/BIM/api/guest",

//    //_api_endpoint: 'https://api.adhox.it',
//    //_api_endpoint_route: "/api/guest",

//    _api_client_id: "SWRlYXJlR3Vlc3RDbGllbnRJZA==",
//    _api_client_secret: "SWRlYXJlR3Vlc3RDbGllbnRTZWNyZXQ=",
//    _api_token: null,
//    _api_token_expires_at: null,

//    _forge_token: null,

//    init(opt = {}) {
//        if (this._initiated) return new Promise((r) => r(true));
//        else this._initiated = true;

//        // Check if is sent by User
//        if (opt.api_endpoint) this._api_endpoint = opt.api_endpoint;

//        if (opt.api_route) this._api_endpoint_route = opt.api_route;

//        // Add /api/guest
//        this._api_endpoint = this._api_endpoint + this._api_endpoint_route;

//        let that = this;

//        return Promise.all([
//            this._loadScript('https://xf79h9aa3l.execute-api.us-west-2.amazonaws.com/toolkit2/api/_adsk.js'),
//            this._loadScript('https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js'),
//            this._loadStyle('https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css'),
//            this._authenticate(that)
//        ]);
//    },

//    getViewer(divId) {
//        const div = document.getElementById(divId);

//        const viewer = new Autodesk.Viewing.GuiViewer3D(div);
//        this.forgeViewer = new ForgeViewer(viewer);

//        return this.forgeViewer;
//    },

//    _loadScript(src) {
//        return new Promise(resolve => {
//            let script = document.createElement('script');
//            script.src = src;
//            script.async = false;
//            document.head.append(script);
//            script.onload = () => {
//                resolve()
//            }
//        });
//    },

//    _loadStyle(src) {
//        return new Promise(resolve => {
//            let link = document.createElement('link');
//            link.rel = 'stylesheet';
//            link.type = 'text/css';
//            link.href = src;
//            document.head.append(link);
//            link.onload = () => {
//                resolve()
//            }
//        });
//    },

//    // Authenticate to ECore Backend and Forge
//    _authenticate(that) {
//        return new Promise((resolve, reject) => {

//            let xhr = new XMLHttpRequest();

//            xhr.open("POST", `${Forge._api_endpoint}/authenticate`, true)

//            xhr.onload = () => {
//                if (xhr.readyState === 4) {
//                    if (xhr.status === 200) {

//                        const result = JSON.parse(xhr.responseText);

//                        // GUEST Api Token and Expiration Date
//                        that._api_token = result.guestAccessToken;

//                        if (result.expiresAt) {
//                            that._api_token_expires_at = new Date(result.expiresAt);
//                        }

//                        // FORGE Token
//                        that._forge_token = result.forgeAccessToken;

//                        resolve();
//                    } else {
//                        console.log(xhr.statusText);
//                        reject(xhr.statusText);
//                    }
//                }
//            };

//            xhr.onerror = (e) => {
//                console.log(e);
//                reject(e);
//            };

//            xhr.setRequestHeader("Content-Type", "application/json");

//            // Send the guest credentials to ECore
//            const body = {
//                "guestClientId": this._api_client_id,
//                "guestClientSecret": this._api_client_secret
//            };

//            xhr.send(JSON.stringify(body));
//        })
//    },
//}

//window.Forge = Forge;

//class ForgeViewer {

//    // Private
//    #modelLoadedCallback;

//    #treeActionFunction;

//    modelsTree;
//    componentsTableMulti;

//    constructor(viewer) {
//        this.models = null;
//        this.viewer = viewer;
//        this.tagsTable = [];

//        this.#modelLoadedCallback = null;
//        this.#treeActionFunction = null;
//        this._originalFragmentsMaterial = [];
//        this.modelsTree = {};
//        this.componentsTableMulti = {};
//    }

//    // Check if ApiToken is expired
//    #checkForgeAuth() {
//        if (Forge._api_token_expires_at.getTime() <= new Date().getTime()) {
//            return Forge._authenticate(Forge);
//        } else {
//            return new Promise((resolve, rej) => { resolve() });
//        }
//    }

//    // Get Models by project id
//    getModelsByProjectId(key) {

//        return new Promise((resolve, reject) => {

//            // Check if token expired
//            this.#checkForgeAuth().then(() => {

//                let xhr = new XMLHttpRequest();

//                xhr.open("GET", `${Forge._api_endpoint}/GetModels/project/${key}`, true)
//                xhr.setRequestHeader("Guest-Token", Forge._api_token);

//                xhr.onload = () => {

//                    if (xhr.readyState === 4) {
//                        if (xhr.status === 200) {
//                            resolve(JSON.parse(xhr.responseText));
//                        } else {
//                            console.log(xhr.statusText);
//                            reject(xhr.statusText);
//                        }
//                    }
//                };

//                xhr.onerror = (e) => {
//                    console.log(e);
//                    reject(e);
//                };

//                xhr.send();
//            });
//        });
//    }

//    // Get Model by id
//    getModelById(id) {
//        return new Promise((resolve, reject) => {

//            this.#checkForgeAuth().then(() => {

//                let xhr = new XMLHttpRequest();
//                xhr.open("GET", `${Forge._api_endpoint}/GetModel/model/${id}`)
//                xhr.setRequestHeader("Guest-Token", Forge._api_token);

//                xhr.onload = () => {
//                    if (xhr.readyState === 4) {
//                        if (xhr.status === 200) {
//                            resolve(JSON.parse(xhr.responseText));
//                        } else {
//                            console.log(xhr.statusText);
//                            reject(xhr.statusText);
//                        }
//                    }
//                };

//                xhr.onerror = (e) => {
//                    console.log(e);
//                    reject(e);
//                };

//                xhr.send();
//            });
//        });
//    }

//    // Get Views by ModelId
//    getViewsByModelId(id) {
//        return new Promise((resolve, reject) => {

//            this.#checkForgeAuth().then(() => {

//                let xhr = new XMLHttpRequest();
//                xhr.open("GET", `${Forge._api_endpoint}/GetViews/model/${id}`)
//                xhr.setRequestHeader("Guest-Token", Forge._api_token);

//                xhr.onload = () => {
//                    if (xhr.readyState === 4) {
//                        if (xhr.status === 200) {
//                            resolve(JSON.parse(xhr.responseText));
//                        } else {
//                            console.log(xhr.statusText);
//                            reject(xhr.statusText);
//                        }
//                    }
//                };

//                xhr.onerror = (e) => {
//                    console.log(e);
//                    reject(e);
//                };

//                xhr.send();
//            });
//        });
//    }

//    // Get ObjectTree by ModelId
//    getObjectTreeByModelId(id) {
//        return new Promise((resolve, reject) => {

//            this.#checkForgeAuth().then(() => {

//                let xhr = new XMLHttpRequest();
//                xhr.open("GET", `${Forge._api_endpoint}/GetObjectTree/model/${id}`)
//                xhr.setRequestHeader("Guest-Token", Forge._api_token);

//                xhr.onload = () => {
//                    if (xhr.readyState === 4) {
//                        if (xhr.status === 200) {
//                            resolve(JSON.parse(xhr.responseText));
//                        } else {
//                            console.log(xhr.statusText);
//                            reject(xhr.statusText);
//                        }
//                    }
//                };

//                xhr.onerror = (e) => {
//                    console.log(e);
//                    reject(e);
//                };

//                xhr.send();
//            });
//        });
//    }

//    // Get ObjectTree by ModelId and View Guid
//    getObjectTreeByModelIdAndView(id, viewGuid) {
//        return new Promise((resolve, reject) => {

//            this.#checkForgeAuth().then(() => {

//                let xhr = new XMLHttpRequest();
//                xhr.open("GET", `${Forge._api_endpoint}/GetObjectTree/model/${id}/view/${viewGuid}`)
//                xhr.setRequestHeader("Guest-Token", Forge._api_token);

//                xhr.onload = () => {
//                    if (xhr.readyState === 4) {
//                        if (xhr.status === 200) {
//                            resolve(JSON.parse(xhr.responseText));
//                        } else {
//                            console.log(xhr.statusText);
//                            reject(xhr.statusText);
//                        }
//                    }
//                };

//                xhr.onerror = (e) => {
//                    console.log(e);
//                    reject(e);
//                };

//                xhr.send();
//            });
//        });
//    }

//    // Set selection and modelLoaded callbacks
//    setCallbacks(selectionCallback, modelLoadedCallback) {
//        this.viewer.addEventListener("selection", selectionCallback);
//        this.#modelLoadedCallback = modelLoadedCallback;
//    }

//    // Set the function that will be called when the tree is build
//    setTreeFunction(action) {
//        this.#treeActionFunction = action;
//    }

//    // Load the model Asynchronously
//    loadModelAsync(inputModel) {
//        this.loadModelsAsync([inputModel]);
//    }

//    // Load the model Synchronously
//    loadModel(inputModel) {
//        return new Promise((resolve, reject) => {

//            const viewerOptions = {
//                env: 'AutodeskProduction',
//                accessToken: Forge._forge_token,
//            };

//            Autodesk.Viewing.Initializer(viewerOptions, () => {

//                if (this.viewer) {
//                    this.viewer.start();

//                    this.models = [];

//                    Autodesk.Viewing.Document.load(`urn:${window.btoa(inputModel.urn)}`, (doc) => {

//                        const viewables = doc.getRoot().getDefaultGeometry();

//                        let transformations;
//                        if (inputModel.position || inputModel.rotation) {
//                            transformations = new THREE.Matrix4();
//                            if (inputModel.rotation) {
//                                if (inputModel.rotation.x) transformations.makeRotationX(inputModel.rotation.x)
//                                if (inputModel.rotation.y) transformations.makeRotationY(inputModel.rotation.y)
//                                if (inputModel.rotation.z) transformations.makeRotationZ(inputModel.rotation.z)
//                            }
//                            if (inputModel.position) {
//                                transformations.setPosition(inputModel.position)
//                                //transformations.setPosition(inputModel.position.x, inputModel.position.y, inputModel.position.z)
//                            }
//                        }

//                        this.viewer.loadDocumentNode(doc, viewables, {
//                            placementTransform: transformations,
//                            keepCurrentModels: true,
//                            globalOffset: { x: 0, y: 0, z: 0 }
//                        }).then((model) => {
//                            // Add model to loaded models
//                            this.viewer.waitForLoadDone(model).then(() => this.#onModelLoaded(model)).then(() => {
//                                resolve(model);
//                            }).catch(rej => {
//                                console.log("Some error appeared");
//                                reject(rej);
//                            });
//                        });
//                    }, (error) => {
//                        console.log('Failed fetching Forge manifest', error);
//                    });
//                }
//            });
//        });
//    }

//    // Load the models Asynchronously
//    loadModelsAsync(inputModels) {

//        const viewerOptions = {
//            env: 'AutodeskProduction',
//            accessToken: Forge._forge_token,
//        };

//        Autodesk.Viewing.Initializer(viewerOptions, () => {

//            if (this.viewer) {
//                this.viewer.start();

//                this.models = [];

//                inputModels.map((m) => {
//                    Autodesk.Viewing.Document.load(`urn:${window.btoa(m.urn)}`, (doc) => {

//                        const viewables = doc.getRoot().getDefaultGeometry();

//                        let transformations;
//                        if (m.position || m.rotation) {
//                            transformations = new THREE.Matrix4();
//                            if (m.rotation) {
//                                if (m.rotation.x) transformations.makeRotationX(m.rotation.x)
//                                if (m.rotation.y) transformations.makeRotationY(m.rotation.y)
//                                if (m.rotation.z) transformations.makeRotationZ(m.rotation.z)
//                            }
//                            if (m.position) {
//                                transformations.setPosition(m.position)
//                                //transformations.setPosition(m.position.x, m.position.y, m.position.z)
//                            }
//                        }

//                        this.viewer.loadDocumentNode(doc, viewables, {
//                            placementTransform: transformations,
//                            keepCurrentModels: true,
//                            globalOffset: { x: 0, y: 0, z: 0 }
//                        }).then((model) => {
//                            // Add model to loaded models
//                            this.viewer.waitForLoadDone(model).then(() => this.#onModelLoaded(model));
//                        });
//                    }, (error) => {
//                        console.log('Failed fetching Forge manifest', error);
//                    });
//                })
//            }
//        });
//    }

//    // Load the models Synchronously
//    loadModels(inputModels) {
//        return new Promise((resolve, reject) => {

//            let maxLength = inputModels.length;

//            const viewerOptions = {
//                env: 'AutodeskProduction',
//                accessToken: Forge._forge_token,
//            };

//            Autodesk.Viewing.Initializer(viewerOptions, () => {

//                if (this.viewer) {
//                    this.viewer.start();

//                    this.models = [];

//                    inputModels.map((m, index) => {
//                        Autodesk.Viewing.Document.load(`urn:${window.btoa(m.urn)}`, (doc) => {

//                            const viewables = doc.getRoot().getDefaultGeometry();

//                            let transformations;
//                            if (m.position || m.rotation) {
//                                transformations = new THREE.Matrix4();
//                                if (m.rotation) {
//                                    if (m.rotation.x) transformations.makeRotationX(m.rotation.x)
//                                    if (m.rotation.y) transformations.makeRotationY(m.rotation.y)
//                                    if (m.rotation.z) transformations.makeRotationZ(m.rotation.z)
//                                }
//                                if (m.position) {
//                                    transformations.setPosition(m.position)
//                                    //transformations.setPosition(m.position.x, m.position.y, m.position.z)
//                                }
//                            }

//                            this.viewer.loadDocumentNode(doc, viewables, {
//                                placementTransform: transformations,
//                                keepCurrentModels: true,
//                                globalOffset: { x: 0, y: 0, z: 0 }
//                            }).then((model) => {
//                                // Add model to loaded models
//                                this.viewer.waitForLoadDone(model).then(() => this.#onModelLoaded(model)).then(() => {
//                                    if ((maxLength - 1) == index) {
//                                        resolve();
//                                    }
//                                }).catch(rej => {
//                                    reject(rej);
//                                });
//                            });
//                        }, (error) => {
//                            console.log('Failed fetching Forge manifest', error);
//                        });
//                    })
//                }
//            });
//        });
//    }

//    #onModelLoaded(model) {
//        let that = this;
//        this.models.push(model);

//        // Build the tree
//        var forgeTree = this.#buildModelTree(model);

//        this.modelsTree[model.id] = forgeTree;

//        this.#buildComponentsTable(forgeTree.objects[0], null, model.id);

//        var maxLength = Object.keys(this.componentsTableMulti).filter(el => el.includes(`model: {${model.id}}`)).length;

//        for (const [key, value] of Object.entries(this.componentsTableMulti)) {
//            this.getProperties(model, value.object.objectId).then((result) => {
//                that.componentsTableMulti[key].properties = result.properties;
//                if (result.dbId == maxLength) {
//                    that.#buildTagsTable(that.#modelLoadedCallback); // need to wait that all properties will be set
//                }
//            });
//        }
//    }

//    // Remove the models and unload the viewer
//    unloadViewable() {
//        this.models = [];
//        if (this.viewer) {
//            this.viewer.tearDown();
//            this.viewer.finish();
//            this.viewer = null;
//        }
//    }

//    // Show the selected element
//    show(model, objectId) {
//        let that = this;

//        this.viewer.show(objectId, model);

//        setTimeout(function () {

//            if (objectId == 1) { // root component
//                that.#setAllIsShownPropertyInComponentTable(true);
//                return;
//            }

//            var obj = that.getComponentByModel(model.id, objectId);
//            if (obj) {
//                var descent = that.getObjectDescent(obj);
//                for (var i = 0; i < descent.length; i++) {
//                    that.#setIsShownPropertyInComponentTableNode(model.id, descent[i], true); // for asynchronous execution
//                }
//            }
//        }, 0); // for asynchronous execution
//    }

//    // Hide the selected element
//    hide(model, objectId) {
//        let that = this;

//        this.viewer.hide(objectId, model);

//        setTimeout(function () {

//            if (objectId == 1) { // root component
//                that.#setAllIsShownPropertyInComponentTable(false);
//                return;
//            }

//            var obj = that.getComponentByModel(model.id, objectId);
//            if (obj) {
//                var descent = that.getObjectDescent(obj);
//                for (var i = 0; i < descent.length; i++) {
//                    that.#setIsShownPropertyInComponentTableNode(model.id, descent[i], false); // for asynchronous execution
//                }
//            }
//        }, 0); // for asynchronous execution
//    }

//    // Isolate multiple elements
//    isolate(model, objectId) {
//        this.viewer.isolate(objectId, model)
//        this.viewer.fitToView(objectId, model)
//    }

//    // Set color for element (RGB)
//    colorize(model, objectId, r, g, b, intensity = 1) {
//        this.viewer.setThemingColor(objectId, new THREE.Vector4(r, g, b, intensity), model, true);
//    }

//    // Set color for element (material RGB)
//    colorizeWithMaterialRgb(model, objectId, r, g, b, intensity = 1) {
//        var hexColor = this.#rgbToHex(r, g, b);
//        this.colorizeWithMaterialHex(model, objectId, hexColor, intensity)
//    }

//    // Set color for element (material HEX)
//    colorizeWithMaterialHex(model, objectId, hex, intensity = 1) {

//        // defining new material:
//        const material = new THREE.MeshPhongMaterial({
//            side: THREE.DoubleSide,
//            reflectivity: 0.0,
//            flatShading: true,
//            transparent: true,
//            opacity: intensity,
//            color: hex
//        });

//        const materials = this.viewer.impl.matman();

//        materials.addMaterial("MyCustomMaterial" + hex.toString(), material, true);

//        let tree = model.getData().instanceTree;

//        tree.enumNodeFragments(objectId, (fragId) => {
//            this._originalFragmentsMaterial[fragId] = this.viewer.model.getFragmentList().getMaterial(fragId);

//            model.getFragmentList().setMaterial(fragId, material);

//            this.viewer.impl.getFragmentProxy(model, fragId).updateAnimTransform();
//        });

//        this.viewer.impl.invalidate(true);
//    }

//    // Restore the original material
//    restoreDefaultMaterial(model, objectId) {

//        let tree = model.getData().instanceTree;

//        tree.enumNodeFragments(objectId, (fragId) => {

//            var originalFragmentMaterial = this._originalFragmentsMaterial[fragId];

//            if (originalFragmentMaterial) {
//                model.getFragmentList().setMaterial(fragId, originalFragmentMaterial);
//                this.viewer.impl.getFragmentProxy(model, fragId).updateAnimTransform();
//            }
//        });

//        this.viewer.impl.invalidate(true);
//    }

//    // Clear the colors of the model
//    clearColors(model) {
//        this.viewer.clearThemingColors(model)
//    }

//    // Set ghosting 
//    setGhosting(value) {
//        this.viewer.setGhosting(value);
//    }

//    // Focus the selected element
//    focusComponent(model, objectId) {

//        this.viewer.fitToView([objectId], model, false);
//        this.viewer.select([objectId], model);

//        this.hide(model, 1); // hide everything
//        this.show(model, objectId);
//    }

//    toggleComponentSelection(model, objectId) {

//        var selectedObjectIds = this.viewer.getSelection();

//        var index = selectedObjectIds.indexOf(objectId);
//        if (index > -1) {
//            // remove item from selected
//            selectedObjectIds.splice(index, 1);
//        } else {
//            // add item to selected
//            selectedObjectIds.push(objectId);
//            this.viewer.fitToView([objectId], model, false);
//            this.show(model, objectId);
//        }

//        // update selection:
//        this.viewer.select(selectedObjectIds, model);
//    }

//    clearSelection() {
//        this.viewer.clearSelection();
//    }

//    getGuidMap(model) {
//        return new Promise(resolve => {
//            model.getExternalIdMapping((data) => resolve(data))
//        })
//    }

//    // Get the selected object ids
//    getSelectedObjectIds() {
//        return this.viewer.getSelection();
//    }

//    getComponentByModel(modelId, objectId) {
//        return this.componentsTableMulti[this.getDictionaryKey(modelId, objectId)];
//    }

//    getComponentsByName(searchFilter, doAllowContainsSearch) {
//        if (doAllowContainsSearch)
//            return Object.values(this.componentsTableMulti).filter(element => element.object.name.toUpperCase().includes(searchFilter.toUpperCase()));
//        else
//            return Object.values(this.componentsTableMulti).filter(element => element.object.name.toUpperCase() === searchFilter.toUpperCase());
//    }

//    getAllChildrenComponent(objectId) {
//        var node = Object.values(this.componentsTableMulti).find(element => element.id === objectId);
//        if (node == null || node === undefined)
//            return [];
//        return this.#traverse(node);
//    }

//    getAllAncesters(objectId) {

//        var ancesters = [];

//        var currentNode = Object.values(this.componentsTableMulti).find(element => element.id === objectId);
//        if (currentNode === undefined)
//            return ancesters;

//        while (currentNode.parent != null) {
//            var parentNode = Object.values(this.componentsTableMulti).find(element => element.id === currentNode.parent);
//            ancesters.push(parentNode.id);
//            currentNode = parentNode;
//        }

//        return ancesters;
//    }

//    getAllComponentsByCategoryPropertyValue(category, propertyName, propertyValue, doAllowContainsSearch, previousResults) {

//        var results = Object.values(this.componentsTableMulti);

//        if (previousResults != null && previousResults.length > 0)
//            results = previousResults;

//        if (category !== null && category !== undefined && category !== "")
//            results = results.filter(element => _filterByCategory(element.properties, category, doAllowContainsSearch));

//        if (propertyName !== null && propertyName !== undefined && propertyName !== "")
//            results = results.filter(element => _filterByPropertyName(element.properties, propertyName, doAllowContainsSearch));

//        if (propertyValue !== null && propertyValue !== undefined && propertyValue !== "")
//            results = results.filter(element => _filterByPropertyValue(element.properties, propertyValue, doAllowContainsSearch));

//        return results;

//        function _filterByCategory(properties, category, doAllowContainsSearch) {
//            if (properties != null) {
//                for (var i = 0; i < properties.length; i++) {
//                    if (doAllowContainsSearch) {
//                        if ((properties[i].displayCategory).toString().toUpperCase().replace("'", "").includes((category).toString().toUpperCase().replace("'", ""))) {
//                            return true;
//                        }
//                    } else {
//                        if ((properties[i].displayCategory).toString().toUpperCase().replace("'", "") === (category).toString().toUpperCase().replace("'", "")) {
//                            return true;
//                        }
//                    }
//                }
//            }
//            return false;
//        };

//        function _filterByPropertyName(properties, propertyName, doAllowContainsSearch) {
//            if (properties != null) {
//                for (var i = 0; i < properties.length; i++) {
//                    if (doAllowContainsSearch) {
//                        if ((properties[i].displayName).toString().toUpperCase().replace("'", "").includes((propertyName).toString().toUpperCase().replace("'", ""))) {
//                            return true;
//                        }
//                    } else {
//                        if ((properties[i].displayName).toString().toUpperCase().replace("'", "") === (propertyName).toString().toUpperCase().replace("'", "")) {
//                            return true;
//                        }
//                    }
//                }
//            }
//            return false;
//        };

//        function _filterByPropertyValue(properties, propertyValue, doAllowContainsSearch) {
//            if (properties != null) {
//                for (var i = 0; i < properties.length; i++) {
//                    if (doAllowContainsSearch) {
//                        if ((properties[i].displayValue).toString().toUpperCase().replace("'", "").includes((propertyValue).toString().toUpperCase().replace("'", ""))) {
//                            return true;
//                        }
//                    } else {
//                        if ((properties[i].displayValue).toString().toUpperCase().replace("'", "") === (propertyValue).toString().toUpperCase().replace("'", "")) {
//                            return true;
//                        }
//                    }
//                }
//            }
//            return false;
//        }
//    }

//    getDictionaryKey(modelId, objectId) {
//        return `model: {${modelId}}, object: {${objectId}}`;
//    }

//    getFirstLevelChildrenComponent(objectId) {
//        return Object.values(this.componentsTableMulti).filter(el => el.parent === objectId);
//    }

//    getFirstLevelChildrenComponentByModel(modelId, objectId) {
//        var filtered = Object.entries(this.componentsTableMulti).filter(el => el[0].includes(`model: {${modelId}}`)).map(el => el[1]);
//        return Object.values(filtered).filter(el => el.parent === objectId);
//    }

//    // Get element Properties (Promise)
//    getProperties(model, objectId) {
//        return new Promise(resolve => {
//            model.getProperties(objectId, (data) => resolve(data))
//        })
//    }

//    getRootComponent() {
//        return Object.values(this.componentsTableMulti).find(el => el.parent === null);
//    }

//    getObjectDescentByIds(modelId, objectId) {
//        var children = [];
//        var value = this.getComponentByModel(modelId, objectId);
//        if (value != undefined) {
//            children = this.#findObjectTreeChildren(value.object);
//        }
//        return children;
//    }

//    getObjectDescent(obj) {
//        var children = this.#findObjectTreeChildren(obj);
//        return children;
//    }


//    //
//    // PRINT
//    //
//    getScreenShot() {
//        if (this.viewer) {
//            Autodesk.Viewing.ScreenShot.getScreenShotAtScreenSize(
//                this.viewer,
//                img => this.#createPDF(img),
//                {}
//            );
//        }
//    }

//    //
//    // SUPPORT
//    //

//    #buildModelTree(model) {

//        // Private
//        function _buildModelTreeRec(node, treeActionFunction) {
//            it.enumNodeChildren(node.objectId, (childId) => {
//                node.objects = node.objects || [];

//                const childNode = {
//                    objectId: childId,
//                    name: it.getNodeName(childId)
//                };

//                node.objects.push(childNode);

//                // External function
//                if (treeActionFunction) {
//                    treeActionFunction(node);
//                }

//                _buildModelTreeRec(childNode, treeActionFunction);
//            });
//        }

//        // Get model instance tree and root component
//        const it = model.getData().instanceTree;
//        const rootId = it.getRootId();
//        const rootNode = {
//            objectId: rootId,
//            name: it.getNodeName(rootId)
//        };

//        const tree = {
//            modelId: model.id,
//            viewGuid: "",
//            objects: [rootNode]
//        }

//        _buildModelTreeRec(rootNode, this.#treeActionFunction);

//        return tree;
//    }

//    // For each node, build his components relationship (child and parent)
//    #buildComponentsTable(currentNode, parentNode, modelId) {

//        let currentComponent = {
//            id: currentNode.objectId,
//            object: currentNode,
//            parent: null,
//            isShown: true,
//            properties: null,
//            isLeaf: false,
//            modelId: modelId,
//        }

//        if (parentNode !== null) {
//            currentComponent.parent = parentNode.objectId;
//        }

//        if (!currentNode.hasOwnProperty('objects')) {
//            currentComponent.isLeaf = true;
//        }

//        //
//        var key = this.getDictionaryKey(modelId, currentNode.objectId); // var matches = key.match(/\{.+?\}/g).map((x) => { return x.slice(1, -1) })
//        this.componentsTableMulti[key] = currentComponent;

//        if (!currentNode.hasOwnProperty('objects')) {
//            return;
//        }

//        currentNode.objects.forEach(child => {
//            this.#buildComponentsTable(child, currentNode, modelId);
//        })
//    }

//    // https://stackoverflow.com/questions/48039639/what-is-the-algorithm-to-traverse-a-non-binary-tree-without-recursion-using-sta
//    #traverse(node) {
//        var stack = [];
//        var stackPointer = 0;
//        var visitedNodes = [];
//        for (; ;) {
//            while (node && !node.isLeaf) {
//                stack[stackPointer++] = {
//                    node: node,
//                    i: 0
//                };
//                node = this.getFirstLevelChildrenComponent(node.id)[0];
//                visitedNodes.push(node);
//            }
//            for (; ;) {
//                if (stackPointer == 0) {
//                    return visitedNodes;
//                }
//                node = stack[--stackPointer].node;
//                var i = stack[stackPointer].i + 1;
//                var firstLevelChildren = this.getFirstLevelChildrenComponent(node.id);
//                if (i < firstLevelChildren.length) {
//                    stack[stackPointer++].i = i;
//                    node = firstLevelChildren[i];
//                    visitedNodes.push(node);
//                    break;
//                }
//            }
//        }
//    }

//    #setIsShownPropertyInComponentTableNode(modelId, objectId, value) {

//        let node = this.getComponentByModel(modelId, objectId);

//        if (node !== undefined) {
//            node.isShown = value;

//            var children = this.getObjectDescent(node);
//            if (children) {
//                for (var i = 0; i < children.length; i++) {
//                    var currentDescentNode = this.getComponentByModel(modelId, children[i]);
//                    currentDescentNode.isShown = value;
//                }
//            }
//        }
//    }

//    #setAllIsShownPropertyInComponentTable(value) {
//        for (const [key, val] of Object.entries(this.componentsTableMulti)) {
//            val.isShown = value;
//        }
//    }

//    #buildTagsTable(modelLoadedCallback) {

//        for (const [key, value] of Object.entries(this.componentsTableMulti)) {

//            let properties = value.properties;

//            if (properties !== undefined && properties !== null) {
//                for (var j = 0; j < properties.length; j++) {

//                    if (this.tagsTable[properties[j].displayCategory] == null) {
//                        this.tagsTable[properties[j].displayCategory] = [];
//                    }

//                    if (this.tagsTable[properties[j].displayCategory][properties[j].displayName] == null) {
//                        this.tagsTable[properties[j].displayCategory][properties[j].displayName] = [];
//                    }

//                    if (properties[j].displayValue !== '' && !this.tagsTable[properties[j].displayCategory][properties[j].displayName].includes(properties[j].displayValue)) {
//                        this.tagsTable[properties[j].displayCategory][properties[j].displayName].push(properties[j].displayValue);
//                    }
//                }
//            }
//        }

//        if (modelLoadedCallback)
//            modelLoadedCallback();
//    }

//    #componentToHex(c) {
//        let hex = c.toString(16);
//        return hex.length == 1 ? "0" + hex : hex;
//    }

//    #rgbToHex(r, g, b) {
//        return "#" + this.#componentToHex(r) + this.#componentToHex(g) + this.#componentToHex(b);
//    }

//    #createPDF(imgData) {
//        var doc = new jsPDF({
//            orientation: 'landscape',
//            unit: 'mm',
//            format: [this.viewer.canvas.width, this.viewer.canvas.height]
//        });

//        doc.addImage(imgData, 'JPEG', 0, 0, this.viewer.canvas.width, this.viewer.canvas.height);
//        doc.save('model.pdf')
//    }

//    #findObjectTreeChildren(child) {
//        var array = [];

//        if (child != undefined) {
//            if (child.objects && child.objects.length > 0) {
//                child.objects.forEach(val => {
//                    array.push(val.objectId);
//                    var childrenArray = this.#findObjectTreeChildren(val);

//                    array = [...array, ...childrenArray];
//                })
//            }
//        }

//        return array;
//    }

//    // Transform elements into CSV
//    //projectionToCSV(valuesToShow, elements) {

//    //    /*
//    //    var valuesToShow = [
//    //    {
//    //        category: 'Item',
//    //        propertyName: 'Type',
//    //        alias: 'tipo'
//    //    },
//    //    { 
//    //        category: 'Entità',
//    //        propertyName: 'Area',
//    //        alias: 'area'
//    //    }]*/

//    //    var results = [];
//    //    for (var i = 0; i < elements.length; i++) {

//    //        for (var k = 0; k < valuesToShow.length; k++) {

//    //            var category = valuesToShow[k].category;
//    //            var propertyName = valuesToShow[k].propertyName;
//    //            valuesToShow[k].value = null; // qui verrà aggiunto il risultato trovato

//    //            for (var j = 0; j < elements[i].properties.length; j++) {

//    //                if ((elements[i].properties[j].displayCategory).toString().toUpperCase().replace("'", "") === ((category).toString().toUpperCase().replace("'", ""))) {
//    //                    if ((elements[i].properties[j].displayName).toString().toUpperCase().replace("'", "") === ((propertyName).toString().toUpperCase().replace("'", ""))) {
//    //                        valuesToShow[k].value = elements[i].properties[j].displayValue;
//    //                        continue;
//    //                    }
//    //                }
//    //            }

//    //        }

//    //        var currentNode = {
//    //            id: elements[i].id,
//    //            name: elements[i].name,
//    //            parent: elements[i].parent
//    //        }

//    //        for (var k = 0; k < valuesToShow.length; k++) {
//    //            currentNode[valuesToShow[k].alias] = valuesToShow[k].value;
//    //        }

//    //        results.push(currentNode);
//    //    }

//    //    var csv = "id;\tname;\tparent;\t";

//    //    for (var k = 0; k < valuesToShow.length; k++) {
//    //        csv += valuesToShow[k].alias;

//    //        if (k < valuesToShow.length - 1)
//    //            csv += ";\t"
//    //    }

//    //    csv += "\n";

//    //    for (var i = 0; i < results.length; i++) {
//    //        csv += results[i].id + ";\t" + results[i].name + ";\t" + results[i].parent + ";\t";

//    //        for (var k = 0; k < valuesToShow.length; k++) {
//    //            csv += results[i][valuesToShow[k].alias];

//    //            if (k < valuesToShow.length - 1)
//    //                csv += ";\t"
//    //        }

//    //        csv += "\n";
//    //    }

//    //    return csv;
//    //}
//}

//versione prima del 27/05/2021

//versione 3

//const Forge = {

//    initiated: false,
//    forgeViewer: null,
//    api_endpoint: 'https://dev.api.adhox.it/api/v1',
//    api_token: null,

//    init(api_token, opt = {}) {
//        if (this.initiated) return new Promise((r) => r(true));
//        else this.initiated = true;

//        this.api_token = api_token;

//        if (opt.api_endpoint) this.api_endpoint = opt.api_endpoint;

//        return Promise.all([
//            this.loadScript('https://xf79h9aa3l.execute-api.us-west-2.amazonaws.com/toolkit2/api/_adsk.js'),
//            this.loadScript('https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js'),
//            this.loadStyle('https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css'),
//        ]);
//    },

//    getViewer(divId) {
//        ####aggiunto da ideare per il corretto caricamneto del viewer
//       this.forgeViewer = null;

//        const div = document.getElementById(divId);
//        if (!this.forgeViewer) {
//            const viewer = new Autodesk.Viewing.GuiViewer3D(div);
//            this.forgeViewer = new ForgeViewer(viewer);
//        }

//        return this.forgeViewer;
//    },

//    loadScript(src) {
//        return new Promise(resolve => {
//            let script = document.createElement('script');
//            script.src = src;
//            script.async = false;
//            document.head.append(script);
//            script.onload = () => {
//                resolve()
//            }
//        });
//    },

//    loadStyle(src) {
//        return new Promise(resolve => {
//            let link = document.createElement('link');
//            link.rel = 'stylesheet';
//            link.type = 'text/css';
//            link.href = src;
//            document.head.append(link);
//            link.onload = () => {
//                resolve()
//            }
//        });
//    },
//}

//class ForgeViewer {

//    constructor(viewer) {
//        this.models = null;
//        this.originalFragmentsMaterial = [];
//        this.viewer = viewer;
//        this.modelLoadedCallback = null;
//    }

//     Get models by project id
//    getModelsByProjectId(key) {
//        return new Promise((resolve, reject) => {

//            let xhr = new XMLHttpRequest();
//            xhr.open("GET", `${Forge.api_endpoint}/projects/${key}/models`, true)

//            xhr.onload = () => {
//                if (xhr.readyState === 4) {
//                    if (xhr.status === 200) {
//                        resolve(JSON.parse(xhr.responseText));
//                    } else {
//                        console.log(xhr.statusText);
//                        reject(xhr.statusText);
//                    }
//                }
//            };

//            xhr.onerror = (e) => {
//                console.log(e);
//                reject(e);
//            };

//            xhr.setRequestHeader('authorization', `Bearer ${Forge.api_token}`)
//            xhr.setRequestHeader('Access-Control-Allow-Origin', '*')

//            xhr.send();
//        });
//    }

//    getModelStatus(projectId, modelId) {
//        return new Promise((resolve, reject) => {

//            let xhr = new XMLHttpRequest();
//            xhr.open("GET", `${Forge.api_endpoint}/projects/${projectId}/models/${modelId}/status`)

//            xhr.onload = () => {
//                if (xhr.readyState === 4) {
//                    if (xhr.status === 200) {
//                        resolve(JSON.parse(xhr.responseText));
//                    } else {
//                        console.log(xhr.statusText);
//                        reject(xhr.statusText);
//                    }
//                }
//            };

//            xhr.onerror = (e) => {
//                console.log(e);
//                reject(e);
//            };

//            xhr.setRequestHeader('authorization', `Bearer ${Forge.api_token}`);
//            xhr.send();
//        });
//    }

//    setCallbacks(selectionCallback, modelLoadedCallback) {
//        this.viewer.addEventListener("selection", selectionCallback);
//        this.modelLoadedCallback = modelLoadedCallback;
//    }

//    loadModelAsync(inputModel) {
//        this.loadModelsAsync([inputModel]);
//    }

//    loadModel(inputModel) {
//        return new Promise((resolve, reject) => {

//            let that = this;

//            const viewerOptions = {
//                env: 'AutodeskProduction',
//                accessToken: Forge.api_token,
//            };

//            Autodesk.Viewing.Initializer(viewerOptions, () => {

//                Autodesk.Viewing.endpoint.setEndpointAndApi(`${this.api_endpoint}/sdk`, 'modelDerivativeV2')
//                Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS = {
//                    'Authorization': `Bearer ${Forge.api_token}`
//                } 

//                if (this.viewer) {
//                    this.viewer.start();

//                    this.models = [];

//                    Autodesk.Viewing.Document.load(`urn:${inputModel.urn}`, (doc) => {

//                        const viewables = doc.getRoot().getDefaultGeometry();

//                        let transformations;
//                        if (inputModel.coords || inputModel.rotation) {
//                            transformations = new THREE.Matrix4();
//                            if (inputModel.rotation) {
//                                if (inputModel.rotation.x) transformations.makeRotationX(inputModel.rotation.x)
//                                if (inputModel.rotation.y) transformations.makeRotationY(inputModel.rotation.y)
//                                if (inputModel.rotation.z) transformations.makeRotationZ(inputModel.rotation.z)
//                            }
//                            if (inputModel.coords) {
//                                transformations.setPosition(inputModel.coords)
//                            }
//                        }

//                        this.viewer.loadDocumentNode(doc, viewables, {
//                            placementTransform: transformations,
//                            keepCurrentModels: true,
//                            globalOffset: { x: 0, y: 0, z: 0 }
//                        }).then((model) => {
//                             Add model to loaded models
//                            this.viewer.waitForLoadDone(model).then(() => {
//                                this.models.push(model);


//                                #### commentato da ideare perchè non serve qui
//                                /*var forgeTree = this.getModelTree(this.models[0]);
//                                console.log("forgeTree: ", forgeTree);

//                                buildComponentsTable(forgeTree, null);
//                                console.log("componentsTable: ", componentsTable);

//                                var leafs = componentsTable.filter(element => element.isLeaf);

//                                try {
//                                    var rootComponents = this.getRootComponent();
//                                    for (var i = 0; i < leafs.length; i++) {
//                                        appendDescent(rootComponents, leafs[i]); // TODO: could be calculated on demand or calculated in background (adding a "IsDescent" calculated to the nodes)
//                                    }
//                                } catch (ex) {
//                                    console.log(ex);
//                                }

//                                for (var j = 0; j < componentsTable.length; j++) {
//                                    this.getProperties(componentsTable[j].id, this.models[0]).then(
//                                        function (result) {
//                                            console.log("setting properties for: '" + result.dbId + "' component.");
//                                            if (componentsTable[result.dbId - 1]) {
//                                                componentsTable[result.dbId - 1].properties = result.properties;
//                                                if (result.dbId === componentsTable.length) {
//                                                    buildTagsTable(that.modelLoadedCallback); // need to wait that all properties will be set
//                                                }
//                                            }
//                                        });
//                                }*/

//                                console.log("componentsTable with descent: ", componentsTable);
//                            }).then(() => {
//                                console.log("Finish to load the model");
//                                resolve(model);
//                            }).catch(rej => {
//                                console.log("Some error appeared");
//                                reject(rej);
//                            });
//                        });
//                    }, (error) => {
//                        console.log('Failed fetching Forge manifest', error);
//                    });
//                }
//            });
//        });
//    }

//    loadModelsAsync(inputModels) {

//        let that = this;

//        const viewerOptions = {
//            env: 'AutodeskProduction',
//            accessToken: Forge.api_token,
//        };

//        Autodesk.Viewing.Initializer(viewerOptions, () => {

//            Autodesk.Viewing.endpoint.setEndpointAndApi(`${this.api_endpoint}/sdk`, 'modelDerivativeV2')
//            Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS = {
//                'Authorization': `Bearer ${Forge.api_token}`
//            } 

//            if (this.viewer) {
//                this.viewer.start();

//                this.models = [];

//                inputModels.map((m) => {
//                    Autodesk.Viewing.Document.load(`urn:${m.urn}`, (doc) => {

//                        const viewables = doc.getRoot().getDefaultGeometry();

//                        let transformations;
//                        if (m.coords || m.rotation) {
//                            transformations = new THREE.Matrix4();
//                            if (m.rotation) {
//                                if (m.rotation.x) transformations.makeRotationX(m.rotation.x)
//                                if (m.rotation.y) transformations.makeRotationY(m.rotation.y)
//                                if (m.rotation.z) transformations.makeRotationZ(m.rotation.z)
//                            }
//                            if (m.coords) {
//                                transformations.setPosition(m.coords)
//                            }
//                        }

//                        this.viewer.loadDocumentNode(doc, viewables, {
//                            placementTransform: transformations,
//                            keepCurrentModels: true,
//                            globalOffset: { x: 0, y: 0, z: 0 }
//                        }).then((model) => {
//                             Add model to loaded models
//                            this.viewer.waitForLoadDone(model).then(() => {

//                                this.models.push(model);

//                                var forgeTree = this.getModelTree(this.models[0]);
//                                console.log("forgeTree: ", forgeTree);

//                                buildComponentsTable(forgeTree, null);
//                                console.log("componentsTable: ", componentsTable);

//                                var leafs = componentsTable.filter(element => element.isLeaf);

//                                try {
//                                    var rootComponents = this.getRootComponent();
//                                    for (var i = 0; i < leafs.length; i++) {
//                                        appendDescent(rootComponents, leafs[i]); // TODO: could be calculated on demand or calculated in background (adding a "IsDescent" calculated to the nodes)
//                                    }
//                                } catch (ex) {
//                                    console.log(ex);
//                                }

//                                for (var j = 0; j < componentsTable.length; j++) {
//                                    this.getProperties(componentsTable[j].id, this.models[0]).then(
//                                        function (result) {
//                                            console.log("setting properties for: '" + result.dbId + "' component.");
//                                            if (componentsTable[result.dbId - 1]) {
//                                                componentsTable[result.dbId - 1].properties = result.properties;
//                                                if (result.dbId === componentsTable.length) {
//                                                    buildTagsTable(that.modelLoadedCallback); // need to wait that all properties will be set
//                                                }
//                                            }
//                                        });
//                                }

//                                console.log("componentsTable with descent: ", componentsTable);
//                            });
//                        });
//                    }, (error) => {
//                        console.log('Failed fetching Forge manifest', error);
//                    });
//                })
//            }
//        });
//    }

//    loadModels(inputModels) {
//        return new Promise((resolve, reject) => {

//            let that = this;
//            let maxLength = inputModels.length;

//            const viewerOptions = {
//                env: 'AutodeskProduction',
//                accessToken: Forge.api_token,
//            };

//            Autodesk.Viewing.Initializer(viewerOptions, () => {

//                Autodesk.Viewing.endpoint.setEndpointAndApi(`${this.api_endpoint}/sdk`, 'modelDerivativeV2')
//                Autodesk.Viewing.endpoint.HTTP_REQUEST_HEADERS = {
//                    'Authorization': `Bearer ${Forge.api_token}`
//                } 

//                if (this.viewer) {
//                    this.viewer.start();

//                    this.models = [];

//                    inputModels.map((m, index) => {
//                        Autodesk.Viewing.Document.load(`urn:${m.urn}`, (doc) => {

//                            const viewables = doc.getRoot().getDefaultGeometry();

//                            let transformations;
//                            if (m.coords || m.rotation) {
//                                transformations = new THREE.Matrix4();
//                                if (m.rotation) {
//                                    if (m.rotation.x) transformations.makeRotationX(m.rotation.x)
//                                    if (m.rotation.y) transformations.makeRotationY(m.rotation.y)
//                                    if (m.rotation.z) transformations.makeRotationZ(m.rotation.z)
//                                }
//                                if (m.coords) {
//                                    transformations.setPosition(m.coords)
//                                }
//                            }

//                            this.viewer.loadDocumentNode(doc, viewables, {
//                                placementTransform: transformations,
//                                keepCurrentModels: true,
//                                globalOffset: { x: 0, y: 0, z: 0 }
//                            }).then((model) => {
//                                 Add model to loaded models
//                                this.viewer.waitForLoadDone(model).then(() => {

//                                    this.models.push(model);

//                                    var forgeTree = this.getModelTree(this.models[0]);
//                                    console.log("forgeTree: ", forgeTree);

//                                    buildComponentsTable(forgeTree, null);
//                                    console.log("componentsTable: ", componentsTable);

//                                    var leafs = componentsTable.filter(element => element.isLeaf);

//                                    try {
//                                        var rootComponents = this.getRootComponent();
//                                        for (var i = 0; i < leafs.length; i++) {
//                                            appendDescent(rootComponents, leafs[i]); // TODO: could be calculated on demand or calculated in background (adding a "IsDescent" calculated to the nodes)
//                                        }
//                                    } catch (ex) {
//                                        console.log(ex);
//                                    }

//                                    for (var j = 0; j < componentsTable.length; j++) {
//                                        this.getProperties(componentsTable[j].id, this.models[0]).then(
//                                            function (result) {
//                                                console.log("setting properties for: '" + result.dbId + "' component.");
//                                                if (componentsTable[result.dbId - 1]) {
//                                                    componentsTable[result.dbId - 1].properties = result.properties;
//                                                    if (result.dbId === componentsTable.length) {
//                                                        buildTagsTable(that.modelLoadedCallback); // need to wait that all properties will be set
//                                                    }
//                                                }
//                                            });
//                                    }

//                                    console.log("componentsTable with descent: ", componentsTable);
//                                }).then(() => {
//                                    if ((maxLength - 1) == index) {
//                                        console.log("Finish to load the models");
//                                        resolve();
//                                    }
//                                }).catch(rej => {
//                                    reject(rej);
//                                });
//                            });
//                        }, (error) => {
//                            console.log('Failed fetching Forge manifest', error);
//                        });
//                    })
//                }
//            });
//        });
//    }

//    unloadViewable() {
//        this.models = [];
//        if (this.viewer) {
//            this.viewer.tearDown();
//            this.viewer.finish();
//            this.viewer = null;
//        }
//    }

//    getModelTree(model) {

//        function _buildModelTreeRec(node) {
//            it.enumNodeChildren(node.dbId, function (childId) {
//                node.children = node.children || [];
//                const childNode = {
//                    dbId: childId,
//                    name: it.getNodeName(childId)
//                };
//                node.children.push(childNode);
//                _buildModelTreeRec(childNode);
//            });
//        }

//         Get model instance tree and root component
//        const it = model.getData().instanceTree;
//        const rootId = it.getRootId();
//        const rootNode = {
//            dbId: rootId,
//            name: it.getNodeName(rootId)
//        };

//        _buildModelTreeRec(rootNode);

//        return rootNode;
//    }

//     Get guid map data for model
//    getGuidMap(model) {
//        return new Promise(resolve => {
//            model.getExternalIdMapping((data) => resolve(data))
//        })
//    }

//    show(dbid, model) {
//        let that = this;

//        this.viewer.show(dbid, model);

//        setTimeout(function () {

//            if (dbid == 1) { // root component
//                setAllIsShownPropertyInComponentTable(true);
//                return;
//            }

//            var descent = that.getComponent(dbid).descent;
//            for (var i = 0; i < descent.length; i++) {
//                setIsShownPropertyInComponentTableNode(descent[i], true); // for asynchronous execution
//            }
//        }, 0); // for asynchronous execution
//    }

//    hide(dbid, model) {
//        let that = this;

//        this.viewer.hide(dbid, model);

//        setTimeout(function () {

//            if (dbid == 1) { // root component
//                setAllIsShownPropertyInComponentTable(false);
//                return;
//            }

//            var descent = that.getComponent(dbid).descent;
//            for (var i = 0; i < descent.length; i++) {
//                setIsShownPropertyInComponentTableNode(descent[i], false); // for asynchronous execution
//            }
//        }, 0); // for asynchronous execution
//    }

//     Isolate multiple elements
//    isolate(dbid, model) {
//        this.viewer.isolate(dbid, model)
//        this.viewer.fitToView(dbid, model)
//    }

//    colorize(dbid, model, r, g, b, intensity = 1) {
//        this.viewer.setThemingColor(dbid, new THREE.Vector4(r, g, b, intensity), model, true);
//    }

//    colorizeWithMaterialRgb(dbid, model, r, g, b, intensity = 1) {
//        var hexColor = rgbToHex(r, g, b);
//        this.colorizeWithMaterialHex(dbid, model, hexColor, intensity)
//    }

//    colorizeWithMaterialHex(dbid, model, hex, intensity = 1) {

//         defining new material:
//        const material = new THREE.MeshPhongMaterial({
//            side: THREE.DoubleSide,
//            reflectivity: 0.0,
//            flatShading: true,
//            transparent: true,
//            opacity: intensity,
//            color: hex
//        });

//        const materials = this.viewer.impl.matman();

//        materials.addMaterial("MyCustomMaterial" + hex.toString(), material, true);

//        let tree = model.getData().instanceTree;

//        tree.enumNodeFragments(dbid, (fragId) => {

//            console.log("fragId: ",fragId);

//            this.originalFragmentsMaterial[fragId] = this.viewer.model.getFragmentList().getMaterial(fragId);

//            model.getFragmentList().setMaterial(fragId, material);

//            this.viewer.impl.getFragmentProxy(model, fragId).updateAnimTransform();
//        });

//        this.viewer.impl.invalidate(true);
//    }

//    restoreDefaultMaterial(dbid, model) {

//        let tree = model.getData().instanceTree;

//        tree.enumNodeFragments(dbid, (fragId) => {

//            var originalFragmentMaterial = this.originalFragmentsMaterial[fragId];

//            if (originalFragmentMaterial) {
//                model.getFragmentList().setMaterial(fragId, originalFragmentMaterial);
//                this.viewer.impl.getFragmentProxy(model, fragId).updateAnimTransform();
//            }
//        });

//        this.viewer.impl.invalidate(true);
//    }

//    clearColors(model) {
//        this.viewer.clearThemingColors(model)
//    }

//    setGhosting(value) {
//        this.viewer.setGhosting(value);
//    }

//    focusComponent(dbid, model) {

//        this.viewer.fitToView([dbid], model, false);
//        this.viewer.select([dbid], model);

//        this.hide(1, model); // hide everything
//        this.show(dbid, model);
//    }

//    toggleComponentSelection(dbid, model) {

//        var selectedObjectIds = this.viewer.getSelection();

//        var index = selectedObjectIds.indexOf(dbid);
//        if (index > -1) {
//             remove item from selected
//            selectedObjectIds.splice(index, 1);
//        } else {
//             add item to selected
//            selectedObjectIds.push(dbid);
//            this.viewer.fitToView([dbid], model, false);
//            this.show(dbid, model);
//        }

//         update selection:
//        this.viewer.select(selectedObjectIds, model);
//    }

//    getSelectedObjectIds() {
//        return this.viewer.getSelection();
//    }

//    clearSelection() {
//        this.viewer.clearSelection();
//    }

//    printComponentsTable() {
//        console.log(componentsTable);
//    }

//    getComponent(dbid) {
//        return componentsTable.find(element => element.id === dbid);
//    }

//    getComponentsByName(searchFilter, doAllowContainsSearch) {
//        if (doAllowContainsSearch)
//            return componentsTable.filter(element => element.name.toUpperCase().includes(searchFilter.toUpperCase()));
//        else
//            return componentsTable.filter(element => element.name.toUpperCase() === searchFilter.toUpperCase());
//    }

//    getAllChildrenComponent(dbid) {

//        var node = componentsTable.find(element => element.id === dbid);
//        if (node == null || node === undefined)
//            return [];

//        return traverse(node);
//    }

//    getAllAncesters(dbid) {

//        var ancersters = [];

//        var currentNode = componentsTable.find(element => element.id === dbid);
//        if (currentNode === undefined)
//            return ancersters;

//        while (currentNode.parent != null) {
//            var parentNode = componentsTable.find(element => element.id === currentNode.parent);
//            ancersters.push(parentNode.id);
//            currentNode = parentNode;
//        }

//        return ancersters;
//    }

//    getAllComponentsByCategoryPropertyValue(category, propertyName, propertyValue, doAllowContainsSearch, previousRestults) {

//        console.log("getAllComponentsByCategoryPropertyValue('" + category + "', '" + propertyName + "', '" + propertyValue + "')");

//        var results = componentsTable;

//        if (previousRestults != null && previousRestults.length > 0)
//            results = previousRestults;

//        if (category !== null && category !== undefined && category !== "")
//            results = results.filter(element => filterByCategory(element.properties, category, doAllowContainsSearch));

//        if (propertyName !== null && propertyName !== undefined && propertyName !== "")
//            results = results.filter(element => filterByPropertyName(element.properties, propertyName, doAllowContainsSearch));

//        if (propertyValue !== null && propertyValue !== undefined && propertyValue !== "")
//            results = results.filter(element => filterByPropertyValue(element.properties, propertyValue, doAllowContainsSearch));

//        return results;

//        function filterByCategory(properties, category, doAllowContainsSearch) {
//            for (var i = 0; i < properties.length; i++) {
//                if (doAllowContainsSearch) {
//                    if ((properties[i].displayCategory).toString().toUpperCase().replace("'", "").includes((category).toString().toUpperCase().replace("'", ""))) {
//                        return true;
//                    }
//                } else {
//                    if ((properties[i].displayCategory).toString().toUpperCase().replace("'", "") === (category).toString().toUpperCase().replace("'", "")) {
//                        return true;
//                    }
//                }
//            }
//            return false;
//        };

//        function filterByPropertyName(properties, propertyName, doAllowContainsSearch) {
//            for (var i = 0; i < properties.length; i++) {
//                if (doAllowContainsSearch) {
//                    if ((properties[i].displayName).toString().toUpperCase().replace("'", "").includes((propertyName).toString().toUpperCase().replace("'", ""))) {
//                        return true;
//                    }
//                } else {
//                    if ((properties[i].displayName).toString().toUpperCase().replace("'", "") === (propertyName).toString().toUpperCase().replace("'", "")) {
//                        return true;
//                    }
//                }
//            }
//            return false;
//        };

//        function filterByPropertyValue(properties, propertyValue, doAllowContainsSearch) {
//            for (var i = 0; i < properties.length; i++) {
//                if (doAllowContainsSearch) {
//                    if ((properties[i].displayValue).toString().toUpperCase().replace("'", "").includes((propertyValue).toString().toUpperCase().replace("'", ""))) {
//                        return true;
//                    }
//                } else {
//                    if ((properties[i].displayValue).toString().toUpperCase().replace("'", "") === (propertyValue).toString().toUpperCase().replace("'", "")) {
//                        return true;
//                    }
//                }
//            }
//            return false;
//        }
//    }

//    getAllComponentsByCategoryPropertyValueArray(filters) {

//        /*

//        var filters  = [ 
//                            { 
//                                category: '',
//                                propertyName: 'piano',
//                                propertyValue: '',
//                                doAllowContainsSearch: true
//                            },
//                            { 
//                                category: '',
//                                propertyName: 'vano',
//                                propertyValue: '',
//                                doAllowContainsSearch: true
//                            }
//                        ];
//        */

//        var results = componentsTable;

//        for (var i = 0; i < filters.length; i++) {

//            var category = filters[i].category;
//            var propertyName = filters[i].propertyName;
//            var propertyValue = filters[i].propertyValue;
//            var doAllowContainsSearch = filters[i].doAllowContainsSearch;

//            results = this.getAllComponentsByCategoryPropertyValue(category, propertyName, propertyValue, doAllowContainsSearch, results);
//        }

//        return results;
//    }

//    getFirstLevelChildrenComponent(dbid) {
//        return componentsTable.filter(element => element.parent === dbid);
//    }

//    projection2CSV(valuesToShow, elements) {

//        /*
    
//        var valuesToShow = [
//                                { 
//                                    category: 'Item',
//                                    propertyName: 'Type',
//                                    alias: 'tipo'
//                                },
//                                { 
//                                    category: 'Entità',
//                                    propertyName: 'Area',
//                                    alias: 'area'
//                                }
//                            ]

//        */

//        var results = [];
//        for (var i = 0; i < elements.length; i++) {

//            for (var k = 0; k < valuesToShow.length; k++) {

//                var category = valuesToShow[k].category;
//                var propertyName = valuesToShow[k].propertyName;
//                valuesToShow[k].value = null; // qui verrà aggiunto il risultato trovato

//                for (var j = 0; j < elements[i].properties.length; j++) {

//                    if ((elements[i].properties[j].displayCategory).toString().toUpperCase().replace("'", "") === ((category).toString().toUpperCase().replace("'", ""))) {
//                        if ((elements[i].properties[j].displayName).toString().toUpperCase().replace("'", "") === ((propertyName).toString().toUpperCase().replace("'", ""))) {
//                            valuesToShow[k].value = elements[i].properties[j].displayValue;
//                            continue;
//                        }
//                    }
//                }

//            }

//            var currentNode = {

//                id: elements[i].id,
//                name: elements[i].name,
//                parent: elements[i].parent
//            }

//            for (var k = 0; k < valuesToShow.length; k++) {
//                currentNode[valuesToShow[k].alias] = valuesToShow[k].value;
//            }

//            results.push(currentNode);
//        }

//        var csv = "id;\tname;\tparent;\t";

//        for (var k = 0; k < valuesToShow.length; k++) {

//            csv += valuesToShow[k].alias;

//            if (k < valuesToShow.length - 1)
//                csv += ";\t"
//        }

//        csv += "\n";

//        for (var i = 0; i < results.length; i++) {
//            csv += results[i].id + ";\t" + results[i].name + ";\t" + results[i].parent + ";\t";

//            for (var k = 0; k < valuesToShow.length; k++) {

//                csv += results[i][valuesToShow[k].alias];

//                if (k < valuesToShow.length - 1)
//                    csv += ";\t"
//            }

//            csv += "\n";
//        }

//        return results;
//        return csv;
//    }

//    printAllProperties() {
//        for (var i = 0; i < componentsTable.length; i++) {
//            this.getProperties(componentsTable[i].id, this.models[0]).then(function (result) {
//                Forge.componentsTable[i].properties = result;
//                console.log(result);
//            });
//        }
//        console.log("componentsTable: ", componentsTable);
//    }

//    getProperties(dbid, model) {
//        return new Promise(resolve => {
//            model.getProperties(dbid, (data) => resolve(data))
//        })
//    }

//    getRootComponent() {
//        return componentsTable.find(element => element.parent === null);
//    }
//}

//window.Forge = Forge;

//var forgeViewer;
//var componentsTable = [];
//var tagsTable = [];
//var categoriesNameTable = [];

//var buildComponentsTable = function (currentNode, parentNode) {

//    var currentComponent = {
//        id: currentNode.dbId,
//        name: currentNode.name,
//        parent: null,
//        isShown: true,
//        properties: null,
//        isLeaf: false,
//        descent: []
//    };

//    if (parentNode !== null) {
//        currentComponent.parent = parentNode.dbId;
//    }

//    if (!currentNode.hasOwnProperty('children')) {
//        currentComponent.isLeaf = true;
//    }

//    componentsTable.push(currentComponent);

//    if (!currentNode.hasOwnProperty('children')) {
//        return;
//    }

//    for (var i = 0; i < currentNode.children.length; i++) {
//        buildComponentsTable(currentNode.children[i], currentNode);
//    }
//};

//var appendDescent = function (root, currentNode) {
//    if (root.id == currentNode.id)
//        return;

//    var parentNode = componentsTable[currentNode.parent - 1];

//    componentsTable[currentNode.parent - 1].descent = [...new Set([...parentNode.descent, ...currentNode.descent, ...[currentNode.id]])];

//    appendDescent(root, parentNode);
//};

// https://stackoverflow.com/questions/48039639/what-is-the-algorithm-to-traverse-a-non-binary-tree-without-recursion-using-sta
//var traverse = function (node) {
//    var stack = [];
//    var stackPointer = 0;
//    var visitedNodes = [];
//    for (; ;) {
//        while (node && !node.isLeaf) {
//            stack[stackPointer++] = {
//                node: node,
//                i: 0
//            };
//            node = forgeViewer.getFirstLevelChildrenComponent(node.id)[0];
//            visitedNodes.push(node);
//        }
//        for (; ;) {
//            if (stackPointer == 0) {
//                console.log(visitedNodes);
//                return visitedNodes;
//            }
//            node = stack[--stackPointer].node;
//            var i = stack[stackPointer].i + 1;
//            var firstLevelChildren = forgeViewer.getFirstLevelChildrenComponent(node.id);
//            if (i < firstLevelChildren.length) {
//                stack[stackPointer++].i = i;
//                node = firstLevelChildren[i];
//                visitedNodes.push(node);
//                break;
//            }
//        }
//    }
//};

//var setIsShownPropertyInComponentTableNode = function (nodeId, value) {

//    var node = componentsTable.find(element => element.id === nodeId);
//    if (node !== undefined) {
//        node.isShown = value;
//        for (var i = 0; i < node.descent.length; i++) {
//            var currentDescentNode = componentsTable.find(element => element.id === node.descent[i]);
//            currentDescentNode.isShown = value;
//        }
//    }
//};

//var setAllIsShownPropertyInComponentTable = function (value) {

//    for (var i = 0; i < componentsTable.length; i++) {
//        componentsTable[i].isShown = value;
//    }
//};

//var buildTagsTable = function (modelLoadedCallback) {

//    console.log("building tagsTable..");

//    for (var i = 0; i < componentsTable.length; i++) {
//        var properties = componentsTable[i].properties;
//        if (properties !== undefined && properties !== null) {
//            for (var j = 0; j < properties.length; j++) {

//                if (tagsTable[properties[j].displayCategory] == null) {
//                    tagsTable[properties[j].displayCategory] = [];
//                }

//                if (tagsTable[properties[j].displayCategory][properties[j].displayName] == null) {
//                    tagsTable[properties[j].displayCategory][properties[j].displayName] = [];
//                }

//                if (properties[j].displayValue !== '' && !tagsTable[properties[j].displayCategory][properties[j].displayName].includes(properties[j].displayValue)) {
//                    tagsTable[properties[j].displayCategory][properties[j].displayName].push(properties[j].displayValue);
//                }
//            }
//        }
//    }

//    console.log("tagsTable: ", tagsTable);

//    modelLoadedCallback();
//};

//var componentToHex = function (c) {
//    var hex = c.toString(16);
//    return hex.length == 1 ? "0" + hex : hex;
//};

//var rgbToHex = function (r, g, b) {
//    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
//};

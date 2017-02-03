/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const express = require('express');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
/**
 * Returns an Express Router for the composer assets and transactions
 *
 * @param {composer} composer - the composer instance
 * @param {SecurityContext} securityContext - the Security Context to access composer methods
 * @param {Object} options - the options
 * @return {Promise} a Promise to the Express Router
 * @public
 */
function createRouter(profile,network,user,pass) {
    console.log('Creating router');
    let router;
    router = express.Router();

    let businessNetworkConnection = new BusinessNetworkConnection();
    let titlesRegistry;
    let salesRegistry;
    let salesAgreement;

    let businessNetworkDefinition;


    return businessNetworkConnection.connect(profile,network,user,pass)
    .then((result) => {

        businessNetworkDefinition = result;

        const modelManager = businessNetworkDefinition.getModelManager();
        const modelFiles = modelManager.getModelFiles();
        const promises = [];
        let txCount = 0;

        if (modelFiles) {
            for(let n = 0; n < modelFiles.length; n++) {
                const modelFile = modelFiles[n];

                let nonTxTypes = [];
                const assetDeclarations = modelFile.getAssetDeclarations();

                if (assetDeclarations) {
                    nonTxTypes = nonTxTypes.concat(assetDeclarations);
                }

                for (let i = 0; i < nonTxTypes.length; i++) {
                    const classDeclaration = nonTxTypes[i];
                    promises.push(createAssetRoutes(router, businessNetworkConnection, businessNetworkDefinition, classDeclaration));
                }

                const txDeclarations = modelFile.getTransactionDeclarations();
                if (txDeclarations) {
                    txCount += txDeclarations.length;
                }

            }
        }

        // if (txCount > 0) {
        //     console.log('About to create transaction routes');
        //     promises.push(createTransactionRoutes(router, businessNetworkConnection, businessNetworkDefinition));
        // } else {
        //     console.log(' ');
        // }


        // wait for all the promises to resolve
        return Promise.all(promises)
        .then(() => {
            return router;
        });




    //createModelManagerRoute(router, businessNetworkDefinition);


    });

}

/**
 * Creates the Express App routes for an Asset or Participant composer type
 * @param {Router} router - the Express router
 * @param {composer} composer - the composer instance
 * @param {SecurityContext} securityContext - the Security Context to access composer methods
 * @param {ClassDeclaration} classDeclaration - the composer type
 * @param {Object} options - the options
 * @return {Promise} a promise to the asset registry
 */
function createAssetRoutes(router, businessNetworkConnection, businessNetworkDefinition, classDeclaration) {
    const serializer = businessNetworkDefinition.getSerializer();
    const fqn = classDeclaration.getFullyQualifiedName();


    if (classDeclaration.isAbstract() === false) {


        const registryPromise = businessNetworkConnection.getAssetRegistry(fqn);
        registryPromise.then((assetRegistry) => {
            router.get('/' + fqn + '/:id*?', (req, res, next) => {
                const id = (req.params.id !== undefined) ? req.params.id : '';
                const functionName = getFunctionName(req);
                let promise;
                if (id) {
                    promise = assetRegistry[functionName](id);
                } else {
                    promise = assetRegistry[functionName]();
                }

                promise.then((result) => {
                    if (result instanceof Array) {
                        const jsArray = [];
                        for (let n = 0; n < result.length; n++) {
                            jsArray.push(serialize(serializer, functionName, result[n]));
                        }

                        res.send(jsArray);
                    } else {
                        res.send(serialize(serializer, functionName, result));
                    }
                })
                    .catch((err) => {
                        next(err);
                    });
            });

            router.post('/' + fqn, (req, res, next) => {
                const resource = serializer.fromJSON(req.body);
                return assetRegistry.add(resource);
            });

            router.put('/' + fqn + '/:id', (req, res, next) => {
                let id = (req.params.id !== undefined) ? req.params.id : '';
                const resource = serializer.fromJSON(req.body);

                if (id !== resource.$identifier) {
                    throw new Error('ID does not match ID in object');
                }

                return assetRegistry.update(resource);
            });

            router.delete('/' + fqn + '/:id', (req, res, next) => {
                let id = (req.params.id !== undefined) ? req.params.id : '';
                return assetRegistry.remove(id);
            });
        });

        return registryPromise;
    } else {
        return Promise.resolve();
    }
}


/**
 * Creates the Express App route for querying and submitting transactions
 * @param {Router} router - the Express router
 * @param {composer} composer - the composer instance
 * @param {SecurityContext} securityContext - the Security Context to access composer methods
 * @param {Object} options - the options
 * @return {Promise} a Promise to the transaction registry lookup
 */

function createTransactionRoutes(router, businessNetworkConnection, businessNetworkDefinition) {
    const serializer = businessNetworkDefinition.getSerializer();
    console.log('Registering transaction routes.');

    const registryPromise = businessNetworkConnection.getTransactionRegistry();
    registryPromise.then((txRegistry) => {
        router.get('/transaction/:id*?', (req, res, next) => {
            const id = (req.params.id !== undefined) ? req.params.id : '';
            const functionName = getFunctionName(req);
            let promise;
            if (id) {
                promise = txRegistry[functionName](id);
            } else {
                promise = txRegistry[functionName]();
            }

            promise.then((result) => {
                if (result instanceof Array) {
                    const jsArray = [];
                    for (let n = 0; n < result.length; n++) {
                        jsArray.push(serialize(serializer, functionName, result[n]));
                    }

                    res.send(jsArray);
                } else {
                    res.send(serialize(serializer, functionName, result));
                }
            })
            .catch((err) => {
                console.log(JSON.stringify(err));
                next(err);
            });
        });

        router.post('/transaction', (req, res, next) => {

            let resource;

            try {
                resource = serializer.fromJSON(req.body);
            }
            catch(err) {
                console.log(JSON.stringify(err));
                throw err;
            }

            businessNetworkConnection.submitTransaction(resource)
            .then(() => {
                res.type('text/plain');
                res.send('OK');
            })
            .catch((err) => {
                console.log(JSON.stringify(err));
                next(err);
            });
        });
    });

    return registryPromise;
}


/**
 * Creates the Express App route for refreshing the model manager
 * @param {Router} router - the Express router
 * @param {composer} composer - the composer instance
 * @param {SecurityContext} securityContext - the Security Context to access composer methods
 * @param {Object} options - the options
 */
function createModelManagerRoute(router, businessNetworkDefinition) {
    console.log('Registering model manager route.');
    router.get('/modelmanager/loadModels', (req, res, next) => {
        composer.loadModels(securityContext).then(() => {
            res.type('application/json');
            res.send('{"status" : "ok"}');
        })
        .catch((err) => {
            console.log(JSON.stringify(err));
            next(err);
        });
    });
}

/**
 * Given an HTTP request it computes the name of the AssetRegistry
 * or TransactionRegistry method to call.
 * <p>
 * There are four possibilities:
 * <ol>
 * <li>get (id)
 * <li>getAll (no id)
 * <li>resolve (resolve query param) (id)
 * <li>resolveAll (resolve query param) (no id)
 * @param  {request} req - Expresss HTTP request
 * @return {string} the name of the function to use
 */
function getFunctionName(req) {
    let id = (req.params.id !== undefined) ? req.params.id : '';
    let verb = 'get';

    // if (req.query.resolve) {
    //     verb = 'resolve';
    // }

    if (!id) {
        verb += 'All';
    }

    return verb;
}

/**
 * Returns a JS Object suitable for transmission on the wire
 * @param  {Serializer} serializer composer Serializer to use for Resources
 * @param  {string} functionName the registry function that was called to get the obj
 * @param  {Object} obj - the object returned by calling functionName on the registry
 * @return {Object} a JS Object that can be serialized to JSON for return to the caller
 */
function serialize(serializer, functionName, obj) {
    if (functionName.startsWith('get')) {
        return serializer.toJSON(obj);
    } else {
        return obj;
    }
}

module.exports = createRouter;

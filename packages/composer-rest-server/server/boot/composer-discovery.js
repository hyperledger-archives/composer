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

const connector = require('loopback-connector-composer');
const LoopBackWallet = require('../../lib/loopbackwallet');
const QueryAnalyzer = require('composer-common').QueryAnalyzer;

/**
 * Find or create the system wallet for storing identities in.
 * @param {Object} app The LoopBack application.
 * @returns {Promise} A promise that will be resolved with the system wallet,
 * or be rejected with an error.
 */
function findOrCreateSystemWallet(app) {
    let filter = {
        where: {
            createdAsSystem: true
        }
    };
    let data = {
        description: 'System wallet',
        createdAsSystem: true
    };
    return app.models.Wallet.findOrCreate(filter, data)
        .then((parts) => {
            return parts[0];
        });
}

/**
 * Find or create the identity in the specified Composer configuration.
 * @param {Object} app The LoopBack application.
 * @param {Object} composer The Composer configuration.
 * @param {Object} wallet The wallet.
 * @returns {Promise} A promise that will be resolved when complete, or rejected
 * with an error.
 */
function findOrCreateIdentity(app, composer, wallet) {
    let filter = {
        where: {
            enrollmentID: composer.participantId
        }
    };
    let data = {
        walletId: wallet.id,
        enrollmentID: composer.participantId,
        enrollmentSecret: composer.participantPwd
    };
    return app.models.WalletIdentity.findOrCreate(filter, data);
}

/**
 * Create a Composer data source using the specified Composer configuration.
 * @param {Object} app The LoopBack application.
 * @param {Object} composer The Composer configuration.
 * @returns {Promise} A promise that will be resolved with the LoopBack data
 * source when complete, or rejected with an error.
 */
function createDataSource(app, composer) {
    const connectorSettings = {
        name: 'composer',
        connector: connector,
        connectionProfileName: composer.connectionProfileName,
        businessNetworkIdentifier: composer.businessNetworkIdentifier,
        participantId: composer.participantId,
        participantPwd: composer.participantPwd,
        namespaces: composer.namespaces,
        fs: composer.fs,
        wallet: composer.wallet
    };
    return app.loopback.createDataSource('composer', connectorSettings);
}

/**
 * Create all of the Composer system models.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 */
function createSystemModel(app, dataSource) {

    // Create the system model schema.
    let modelSchema = {
        name: 'System',
        description: 'General business network methods',
        plural: '/system',
        base: 'Model'
    };
    modelSchema = updateModelSchema(modelSchema);

    // Create the system model which is an anchor for all system methods.
    const System = app.loopback.createModel(modelSchema);

    // Register the system model.
    app.model(System, {
        dataSource: dataSource,
        public: true
    });

}

/**
 * Create all of the Composer system models.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 */
function createQueryModel(app, dataSource) {

    // Create the query model schema.
    let modelSchema = {
        name: 'Query',
        description: 'Content-based Query Methods',
        plural: '/queries',
        base: 'Model'
    };
    modelSchema = updateModelSchema(modelSchema);

    // Create the query model which is an anchor for all query methods.
    const Query = app.loopback.createModel(modelSchema);

    // Register the query model.
    app.model(Query, {
        dataSource: dataSource,
        public: true
    });

}

/**
 * Register all of the Composer system methods.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 */
function registerSystemMethods(app, dataSource) {

    // Grab the system model.
    const System = app.models.System;
    const connector = dataSource.connector;

    // Register all system methods
    const registerMethods = [
        registerPingMethod,
        registerIssueIdentityMethod,
        registerRevokeIdentityMethod,
        registerGetAllTransactionsMethod,
        registerGetTransactionByIDMethod
    ];
    registerMethods.forEach((registerMethod) => {
        registerMethod(app, dataSource, System, connector);
    });

}

/**
 * Register all of the Composer query methods.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @returns {Promise} a promise when complete
 */
function registerQueryMethods(app, dataSource) {

    // Grab the query model.
    const Query = app.models.Query;
    const connector = dataSource.connector;

    return new Promise((resolve, reject) => {
        connector.discoverQueries(null, (error, queries) => {
            if (error) {
                return reject(error);
            }

            queries.forEach((query) => {
                console.log('Registering query: ' + query.getName() );
                registerQueryMethod(app, dataSource, Query, connector, query);
            });

            resolve(queries);
        });
    });
}

/**
 * Register the 'getAllRedVehicles' Composer query method.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object} Query The Query model class.
 * @param {Object} connector The LoopBack connector.
 * @param {Query} query the query instance
 */
function registerQueryMethod(app, dataSource, Query, connector, query) {

    const analyzer = new QueryAnalyzer();
    const parameters = analyzer.analyze(query);

    let accepts = [];
    let pathWithPrameters = '/' + query.getName();

    for(let n=0; n < parameters.length; n++) {
        const param = parameters[n];

        // accepts.push( {arg: param.name, type: param.type, required: true, http: 'optionsFromRequest' } );
        accepts.push( {arg: param.name, type: param.type, required: true, http: {source :'path'} } );
        pathWithPrameters = pathWithPrameters + '/:' + param.name;
    }
    accepts.push({arg: 'options', type: 'object', http: 'optionsFromRequest' });

    console.log( '**** PARAM FOR QUERY ' + query.getName() + '=' + JSON.stringify(accepts) );

     // Define and register the method.
    Query[query.getName()] = (options, callback) => {
        console.log('**** options: ' + JSON.stringify(options));
        options.query = query.getName();
        connector.executeQuery(options, callback);
    };
    Query.remoteMethod(
        query.getName(), {
            description: query.getDescription(),
            accepts: accepts,
            returns: {
                type: [ query.getSelect().getResource() ],
                root: true
            },
            http: {
                verb: 'get',
                // path: '/' + query.getName();
                path: pathWithPrameters
            }
        }
    );
}

/**
 * Register the 'ping' Composer system method.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object} System The System model class.
 * @param {Object} connector The LoopBack connector.
 */
function registerPingMethod(app, dataSource, System, connector) {

    // Create and register the models.
    const PingResponse = app.loopback.createModel({
        name: 'PingResponse',
        description: 'The response to the ping method',
        base: 'Model',
        properties: {
            participant: {
                type: 'string',
                required: false
            },
            version: {
                type: 'string',
                required: true
            }
        },
        hidden: [ 'id' ]
    });
    app.model(PingResponse, {
        dataSource: dataSource,
        public: false
    });

    // Define and register the method.
    System.ping = (options, callback) => {
        connector.ping(options, callback);
    };
    System.remoteMethod(
        'ping', {
            description: 'Test the connection to the business network',
            accepts: [{
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            returns: {
                type: 'PingResponse',
                root: true
            },
            http: {
                verb: 'get',
                path: '/ping'
            }
        }
    );

}

/**
 * Register the 'issueIdentity' Composer system method.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object} System The System model class.
 * @param {Object} connector The LoopBack connector.
 */
function registerIssueIdentityMethod(app, dataSource, System, connector) {

    // Create and register the models.
    const IssueIdentityRequest = app.loopback.createModel({
        name: 'IssueIdentityRequest',
        description: 'The request to the issueIdentity method',
        base: 'Model',
        properties: {
            participant: {
                type: 'string',
                required: false
            },
            userID: {
                type: 'string',
                required: true
            },
            options: {
                type: 'Object',
                required: false
            }
        },
        hidden: [ 'id' ]
    });
    app.model(IssueIdentityRequest, {
        dataSource: dataSource,
        public: false
    });
    const IssueIdentityResponse = app.loopback.createModel({
        name: 'IssueIdentityResponse',
        description: 'The response to the issueIdentity method',
        base: 'Model',
        properties: {
            userID: {
                type: 'string',
                required: true
            },
            userSecret: {
                type: 'string',
                required: true
            }
        },
        hidden: [ 'id' ]
    });
    app.model(IssueIdentityResponse, {
        dataSource: dataSource,
        public: false
    });

    // Define and register the method.
    System.issueIdentity = (data, options, callback) => {
        connector.issueIdentity(data.participant, data.userID, data.options, options, callback);
    };
    System.remoteMethod(
        'issueIdentity', {
            description: 'Issue an identity to the specified participant',
            accepts: [{
                arg: 'data',
                type: 'IssueIdentityRequest',
                required: true,
                http: {
                    source: 'body'
                }
            }, {
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            returns: {
                type: 'IssueIdentityResponse',
                root: true
            },
            http: {
                verb: 'post',
                path: '/issueIdentity'
            }
        }
    );

}

/**
 * Register the 'revokeIdentity' Composer system method.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object} System The System model class.
 * @param {Object} connector The LoopBack connector.
 */
function registerRevokeIdentityMethod(app, dataSource, System, connector) {

    // Create and register the models.
    const RevokeIdentityRequest = app.loopback.createModel({
        name: 'RevokeIdentityRequest',
        description: 'The request to the revokeIdentity method',
        base: 'Model',
        properties: {
            userID: {
                type: 'string',
                required: true
            }
        },
        hidden: [ 'id' ]
    });
    app.model(RevokeIdentityRequest, {
        dataSource: dataSource,
        public: false
    });

    // Define and register the method.
    System.revokeIdentity = (data, options, callback) => {
        connector.revokeIdentity(data.userID, options, callback);
    };
    System.remoteMethod(
        'revokeIdentity', {
            description: 'Revoke the specified identity',
            accepts: [{
                arg: 'data',
                type: 'RevokeIdentityRequest',
                required: true,
                http: {
                    source: 'body'
                }
            }, {
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            http: {
                verb: 'post',
                path: '/revokeIdentity'
            }
        }
    );

}

/**
 * Register the 'getAllTransactions' Composer system method.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object} System The System model class.
 * @param {Object} connector The LoopBack connector.
 */
function registerGetAllTransactionsMethod(app, dataSource, System, connector) {

    // Define and register the method.
    System.getAllTransactions = (options, callback) => {
        connector.getAllTransactions(options, callback);
    };
    System.remoteMethod(
        'getAllTransactions', {
            description: 'Get all transactions from the transaction registry',
            accepts: [{
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            returns: {
                type: [ 'object' ],
                root: true
            },
            http: {
                verb: 'get',
                path: '/transactions'
            }
        }
    );

}

/**
 * Register the 'getTransactionByID' Composer system method.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object} System The System model class.
 * @param {Object} connector The LoopBack connector.
 */
function registerGetTransactionByIDMethod(app, dataSource, System, connector) {

    // Define and register the method.
    System.getTransactionByID = (id, options, callback) => {
        connector.getTransactionByID(id, options, callback);
    };
    System.remoteMethod(
        'getTransactionByID', {
            description: 'Get the specified transaction from the transaction registry',
            accepts: [{
                arg: 'id',
                type: 'string',
                required: true,
                http: {
                    source: 'path'
                }
            }, {
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            returns: {
                type: 'object',
                root: true
            },
            http: {
                verb: 'get',
                path: '/transactions/:id'
            }
        }
    );

}

/**
 * Discover all of the model definitions in the specified LoopBack data source.
 * @param {Object} dataSource The LoopBack data source.
 * @returns {Promise} A promise that will be resolved with an array of discovered
 * model definitions, or be rejected with an error.
 */
function discoverModelDefinitions(dataSource) {
    return new Promise((resolve, reject) => {
        dataSource.discoverModelDefinitions({}, (error, modelDefinitions) => {
            if (error) {
                return reject(error);
            }
            resolve(modelDefinitions);
        });
    });
}

/**
 * Generate the model schemas for the specified model definitions.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object[]} modelDefinitions An array of model definitions.
 * @returns {Promise} A promise that will be resolved with an array of
 * generated model schemas, or be rejected with an error.
 */
function generateModelSchemas(dataSource, modelDefinitions) {
    return modelDefinitions.reduce((promise, modelDefinition) => {
        return promise.then((modelSchemas) => {
            return new Promise((resolve, reject) => {
                dataSource.discoverSchemas(modelDefinition.name, { visited: {}, associations: true }, (error, modelSchema) => {
                    if (error) {
                        return reject(error);
                    }
                    modelSchemas.push(modelSchema);
                    resolve(modelSchemas);
                });
            });
        });
    }, Promise.resolve([]));
}

/**
 * Apply any required updates to the specified model schema.
 * @param {Object} modelSchema The model schema to update.
 * @returns {Object} The updated model schema.
 */
function updateModelSchema(modelSchema) {

    // We ensure that you have to be authenticated in order to access this model.
    modelSchema.acls = [
        {
            accessType: '*',
            permission: 'ALLOW',
            principalId: '$authenticated',
            principalType: 'ROLE'
        },
        {
            accessType: '*',
            permission: 'DENY',
            principalId: '$unauthenticated',
            principalType: 'ROLE'
        }
    ];

    // Return the updated model schema.
    return modelSchema;

}

/**
 * Restrict the remote methods that have been defined on the specified model.
 * We want to remove all of the unnessecary or unimplemented remote methods
 * that are created by extending the base PersistedModel type.
 * @param {Object} modelSchema The model schema.
 * @param {Object} model The model to restrict the methods on.
 * @returns {Object} The model with restricted set of smethods.
 */
function restrictModelMethods(modelSchema, model) {

    // We now want to filter out methods that we haven't implemented or don't want.
    // We use a whitelist of method names to do this.
    let whitelist;
    if (modelSchema.options.composer.type === 'concept') {
        whitelist = [ ];
    } else if (modelSchema.options.composer.type === 'transaction') {
        whitelist = [ 'create' ];
    } else {
        whitelist = [ 'create', 'deleteById', 'find', 'findById', 'exists', 'replaceById' ];
    }
    model.sharedClass.methods().forEach((method) => {
        const name = (method.isStatic ? '' : 'prototype.') + method.name;
        if (whitelist.indexOf(name) === -1) {
            model.disableRemoteMethodByName(name);
        } else if (name === 'exists') {
            // We want to remove the /:id/exists method.
            method.http = [{ verb: 'head', path: '/:id' }];
        } else if (name === 'replaceById') {
            // We want to remove the /:id/replace method.
            method.http = [{ verb: 'put', path: '/:id' }];
        }
    });

    // Return the updated model.
    return model;

}

module.exports = function (app, callback) {

    // Get the Composer configuration.
    const composer = app.get('composer');
    if (!composer) {
        callback();
        return Promise.resolve();
    }
    let dataSource;
    return Promise.resolve()
    .then(() => {

        // If this isn't the memory connector, then we want to persist the enrollment certificates.
        // This means that the Composer APIs will fall back to using the default filesystem wallet.
        const isMemory = app.datasources.db.name === 'Memory';
        if (isMemory) {
            return;
        }

        // Find or create the system wallet.
        return findOrCreateSystemWallet(app)
            .then((wallet) => {

                // Create a LoopBack wallet for the system wallet.
                composer.wallet = new LoopBackWallet(app, wallet);

                // Ensure that the specified identity exists.
                return findOrCreateIdentity(app, composer, wallet);

            });

    })
    .then(() => {

        // Create an instance of the LoopBack data source that uses the connector.
        dataSource = createDataSource(app, composer);

        // Create the system model.
        createSystemModel(app, dataSource);

        // Register the system methods.
        registerSystemMethods(app, dataSource);

        // Create the query model.
        createQueryModel(app, dataSource);

        // Register the query methods.
        registerQueryMethods(app, dataSource);

        // Discover the model definitions (types) from the connector.
        // This will go and find all of the non-abstract types in the business network definition.
        console.log('Discovering types from business network definition ...');
        return discoverModelDefinitions(dataSource);

    })
    .then((modelDefinitions) => {

        // For each model definition (type), we need to generate a Loopback model definition JSON file.
        console.log('Discovered types from business network definition');
        console.log('Generating schemas for all types in business network definition ...');
        return generateModelSchemas(dataSource, modelDefinitions);

    })
    .then((modelSchemas) => {

        // Now we have all the schemas, we need to fix them up and add them to Loopback.
        console.log('Generated schemas for all types in business network definition');
        console.log('Adding schemas for all types to Loopback ...');
        modelSchemas.forEach((modelSchema) => {

            // Apply any required updates to the specified model schema.
            modelSchema = updateModelSchema(modelSchema);

            // This call creates the model class from the model schema.
            let model = app.loopback.createModel(modelSchema);

            // Restrict the remote methods that have been defined on the specified model.
            model = restrictModelMethods(modelSchema, model);

            // Now we register the model against the data source.
            app.model(model, {
                dataSource: dataSource,
                public: true
            });

        });

    })
    .then(() => {
        console.log('Added schemas for all types to Loopback');
        callback();
    })
    .catch((error) => {
        callback(error);
    });
};

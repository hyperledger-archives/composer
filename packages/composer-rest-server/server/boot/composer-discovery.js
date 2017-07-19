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
const ModelUtil = require('composer-common').ModelUtil;
const LoopbackVisitor = require('composer-common').LoopbackVisitor;

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
        description: 'Named queries',
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
        registerGetAllIdentitiesMethod,
        registerGetIdentityByIDMethod,
        registerIssueIdentityMethod,
        registerBindIdentityMethod,
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
                registerQueryMethod(app, dataSource, Query, connector, query);
            });

            resolve(queries);
        });
    });
}

/**
 * Register a composer named query method.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object} Query The LoopBack Query model
 * @param {Object} connector The LoopBack connector.
 * @param {Query} query the named Composer query to register
 */
function registerQueryMethod(app, dataSource, Query, connector, query) {

    console.log('*** register query method: ' + query.getName() );
    const parameters = query.getParameters();
    console.log('*** parameters: ' + JSON.stringify(parameters) );
    const returnType = dataSource.settings.namespace
        ? query.getSelect().getResource()
            : ModelUtil.getShortName(query.getSelect().getResource());

    // declare the arguments to the query method
    let accepts = [];

    // we need the HTTP request so we can get the named parameters off the query string
    accepts.push({'arg': 'req', 'type': 'object', 'http': {source: 'req'}});
    accepts.push({'arg': 'options', 'type': 'object', 'http': 'optionsFromRequest'});

    // we need to declare the parameters and types so that the LoopBack UI
    // will generate the web form to enter them
    for(let n=0; n < parameters.length; n++) {
        const param = parameters[n];
        accepts.push( {arg: param.name, type: LoopbackVisitor.toLoopbackType(param.type), required: true, http: {verb : 'get', source: 'query'}} );
    }

    // Define and register dynamic query method
    const queryMethod = {
        [query.getName()]() {
            const args = [].slice.apply(arguments);
            const httpRequest = args[0];
            const options = args[1];
            const callback = args[args.length-1];
            connector.executeQuery( query.getName(), httpRequest.query, options, callback);
        }
    };
    Object.assign(Query, queryMethod);

    Query.remoteMethod(
        query.getName(), {
            description: query.getDescription(),
            accepts: accepts,
            returns: {
                type : [ returnType ],
                root: true
            },
            http: {
                verb: 'get',
                path: '/' + query.getName()
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
 * Register the 'getAllIdentities' Composer system method.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object} System The System model class.
 * @param {Object} connector The LoopBack connector.
 */
function registerGetAllIdentitiesMethod(app, dataSource, System, connector) {

    // Define and register the method.
    System.getAllIdentities = (options, callback) => {
        connector.getAllIdentities(options, callback);
    };
    System.remoteMethod(
        'getAllIdentities', {
            description: 'Get all identities from the identity registry',
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
                path: '/identities'
            }
        }
    );

}

/**
 * Register the 'getIdentityByID' Composer system method.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object} System The System model class.
 * @param {Object} connector The LoopBack connector.
 */
function registerGetIdentityByIDMethod(app, dataSource, System, connector) {

    // Define and register the method.
    System.getIdentityByID = (id, options, callback) => {
        connector.getIdentityByID(id, options, callback);
    };
    System.remoteMethod(
        'getIdentityByID', {
            description: 'Get the specified identity from the identity registry',
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
                path: '/identities/:id'
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
                required: true
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
                path: '/identities/issue'
            }
        }
    );

}



/**
 * Register the 'bindIdentity' Composer system method.
 * @param {Object} app The LoopBack application.
 * @param {Object} dataSource The LoopBack data source.
 * @param {Object} System The System model class.
 * @param {Object} connector The LoopBack connector.
 */
function registerBindIdentityMethod(app, dataSource, System, connector) {

    // Create and register the models.
    const BindIdentityRequest = app.loopback.createModel({
        name: 'BindIdentityRequest',
        description: 'The request to the bindIdentity method',
        base: 'Model',
        properties: {
            participant: {
                type: 'string',
                required: false
            },
            certificate: {
                type: 'string',
                required: true
            }
        },
        hidden: [ 'id' ]
    });
    app.model(BindIdentityRequest, {
        dataSource: dataSource,
        public: false
    });

    // Define and register the method.
    System.bindIdentity = (data, options, callback) => {
        connector.bindIdentity(data.participant, data.certificate, options, callback);
    };
    System.remoteMethod(
        'bindIdentity', {
            description: 'Bind an identity to the specified participant',
            accepts: [{
                arg: 'data',
                type: 'BindIdentityRequest',
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
                path: '/identities/bind'
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

    // Define and register the method.
    System.revokeIdentity = (data, options, callback) => {
        connector.revokeIdentity(data, options, callback);
    };
    System.remoteMethod(
        'revokeIdentity', {
            description: 'Revoke the specified identity',
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
            http: {
                verb: 'post',
                path: '/identities/:id/revoke'
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

        // Create the query model
        createQueryModel(app, dataSource);

        // Register the named query methods
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
        console.log('Exception: ' + error );
        callback(error);
    });
};

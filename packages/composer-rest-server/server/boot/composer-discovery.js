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

module.exports = function (app, callback) {

    // Get the Composer configuration.
    const composer = app.get('composer');
    if (!composer) {
        callback();
        return Promise.resolve();
    }

    // Create an instance of the LoopBack data source that uses the connector.
    const connectorSettings = {
        name: 'composer',
        connector: connector,
        connectionProfileName: composer.connectionProfileName,
        businessNetworkIdentifier: composer.businessNetworkIdentifier,
        participantId: composer.participantId,
        participantPwd: composer.participantPwd,
        namespaces: composer.namespaces,
        fs: composer.fs
    };
    const dataSource = app.loopback.createDataSource('composer', connectorSettings);

    return new Promise((resolve, reject) => {

        // Discover the model definitions (types) from the connector.
        // This will go and find all of the non-abstract types in the business network definition.
        console.log('Discovering types from business network definition ...');
        dataSource.discoverModelDefinitions({}, (error, modelDefinitions) => {
            if (error) {
                return reject(error);
            }
            resolve(modelDefinitions);
        });

    })
    .then((modelDefinitions) => {

        // For each model definition (type), we need to generate a Loopback model definition JSON file.
        console.log('Discovered types from business network definition');
        console.log('Generating schemas for all types in business network definition ...');
        return modelDefinitions.reduce((promise, modelDefinition) => {
            return promise.then((schemas) => {
                return new Promise((resolve, reject) => {
                    dataSource.discoverSchemas(modelDefinition.name, { visited: {}, associations: true }, (error, modelSchema) => {
                        if (error) {
                            return reject(error);
                        }
                        schemas.push(modelSchema);
                        resolve(schemas);
                    });
                });
            });
        }, Promise.resolve([]));

    })
    .then((modelSchemas) => {

        // Now we have all the schemas, we need to fix them up and add them to Loopback.
        console.log('Generated schemas for all types in business network definition');
        console.log('Adding schemas for all types to Loopback ...');
        modelSchemas.forEach((modelSchema) => {

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

            // This call creates the model class from the model schema.
            let model = app.loopback.createModel(modelSchema);

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


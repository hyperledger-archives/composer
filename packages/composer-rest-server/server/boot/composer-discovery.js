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

        // If this isn't the memory connector, then we want to persist the enrollment certificate.
        // This means that the Composer APIs will fall back to using the default filesystem wallet.
        const isMemory = app.datasources.db.name === 'Memory';
        if (isMemory) {
            return;
        }

        // Find or create the system wallet.
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

                // Create a LoopBack wallet for the system wallet.
                let wallet = parts[0];
                composer.wallet = new LoopBackWallet(app, wallet);

                // Ensure that the specified identity exists.
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

            });

    })
    .then(() => {

        // Create an instance of the LoopBack data source that uses the connector.
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
        dataSource = app.loopback.createDataSource('composer', connectorSettings);

        // Discover the model definitions (types) from the connector.
        // This will go and find all of the non-abstract types in the business network definition.
        return new Promise((resolve, reject) => {
            console.log('Discovering types from business network definition ...');
            dataSource.discoverModelDefinitions({}, (error, modelDefinitions) => {
                if (error) {
                    return reject(error);
                }
                resolve(modelDefinitions);
            });
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


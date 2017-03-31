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
const Wallet = require('composer-common').Wallet;

class LoopBackWallet extends Wallet {

    constructor(wallet, WalletIdentityModel) {
        super();
        this.wallet = wallet;
        this.WalletIdentityModel = WalletIdentityModel;
    }

    /**
     * List all of the credentials in the wallet.
     * @abstract
     * @return {Promise} A promise that is resolved with
     * an array of credential names, or rejected with an
     * error.
     */
    list() {
        return this.WalletIdentityModel.find({ where: { walletId: this.wallet.id } })
            .then((identities) => {
                return identities.map((identity) => {
                    return identity.enrollmentID;
                });
            });
    }

    /**
     * Check to see if the named credentials are in
     * the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * a boolean; true if the named credentials are in the
     * wallet, false otherwise.
     */
    contains(name) {
        console.log('contains', this.wallet, name);
        return this.WalletIdentityModel.count({ walletId: this.wallet.id, enrollmentID: name })
            .then((count) => {
                console.log('contains', count);
                return count !== 0;
            });
    }

    /**
     * Get the named credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved with
     * the named credentials, or rejected with an error.
     */
    get(name) {
        console.log('get', name);
        return this.WalletIdentityModel.findOne({ where: { walletId: this.wallet.id, enrollmentID: name } })
            .then((identity) => {
                return identity.certificate;
            });
    }

    /**
     * Add a new credential to the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    add(name, value) {
        console.log('add', name, value);
        return this.WalletIdentityModel.findOne({ where: { walletId: this.wallet.id, enrollmentID: name } })
            .then((identity) => {
                return identity.updateAttribute('certificate', value);
            });
    }

    /**
     * Update existing credentials in the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @param {string} value The credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    update(name, value) {
        console.log('update', name, value);
        return this.WalletIdentityModel.findOne({ where: { walletId: this.wallet.id, enrollmentID: name } })
            .then((identity) => {
                return identity.updateAttribute('certificate', value);
            });
    }

    /**
     * Remove existing credentials from the wallet.
     * @abstract
     * @param {string} name The name of the credentials.
     * @return {Promise} A promise that is resolved when
     * complete, or rejected with an error.
     */
    remove(name) {
        console.log('remove', name);
        return this.WalletIdentityModel.destroyAll({ where: { walletId: this.wallet.id, enrollmentID: name } });
    }

}

module.exports = function (app, callback) {

    const composer = app.get('composer');
    const userModel = app.models.user;
    const WalletModel = app.models.Wallet;
    const WalletIdentityModel = app.models.WalletIdentity;

    const dataSource = app.loopback.createDataSource('composer', {
        name: 'composer',
        connector: connector,
        connectionProfileName: composer.connectionProfileName,
        businessNetworkIdentifier: composer.businessNetworkIdentifier,
        participantId: composer.participantId,
        participantPwd: composer.participantPwd,
        namespaces: composer.namespaces
    });

    new Promise((resolve, reject) => {

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

        // Register a hook for all remote methods that loads the enrollment ID and
        // enrollment secret from the logged-in users wallet for passing to the connector.
        app.remotes().phases
            .addBefore('invoke', 'options-from-request')
            .use(function(ctx, next) {
                if (!ctx.args.options) {
                    return next();
                } else if (!ctx.args.options.accessToken) {
                    return next();
                }
                const userId = ctx.args.options.accessToken.userId;
                let wallet;
                return userModel.findById(userId)
                    .then((user) => {
                        console.log('found user', user);
                        return WalletModel.findById(user.defaultWallet);
                    })
                    .then((wallet_) => {
                        wallet = wallet_;
                        if (!wallet) {
                            return;
                        }
                        console.log('found default wallet', wallet);
                        if (!wallet.defaultIdentity) {
                            return;
                        }
                        console.log('identities', require('util').inspect(wallet));
                        return WalletIdentityModel.findById(wallet.defaultIdentity);
                    })
                    .then((identity) => {
                        if (!identity) {
                            return next();
                        }
                        console.log('found default identity', identity);
                        ctx.args.options.enrollmentID = identity.enrollmentID;
                        ctx.args.options.enrollmentSecret = identity.enrollmentSecret;
                        ctx.args.options.wallet = new LoopBackWallet(wallet, WalletIdentityModel);
                        next();
                    });
            });

        callback();
    })
    .catch((error) => {
        callback(error);
    });
};


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

const AdminConnection = require('composer-admin').AdminConnection;
const fs = require('fs');
const IdCard = require('composer-common').IdCard;
const LoopBackCardStore = require('../../lib/loopbackcardstore');
const Util = require('../../lib/util');

module.exports = function (Card) {

    /**
     * Get the name of the default business network card for the specified user.
     * @param {string} userId The ID of the user.
     * @return {Promise} A promise that is resolved with the name of the default
     * business network card, or null if a default business network card is not set.
     */
    function getDefaultCard(userId) {
        return Card.findOne({
            where: {
                userId,
                default: true
            }
        }).then((card) => {
            if (card) {
                return card.name;
            }
            return null;
        });
    }

    /**
     * Set the name of the default business network card for the specified user.
     * @param {string} userId The ID of the user.
     * @param {string} cardName The name of the default business network card.
     * @return {Promise} A promise that is resolved when complete.
     */
    function setDefaultCard(userId, cardName) {
        return Card.findOne({
            where: {
                userId,
                name: cardName
            }
        }).then((lbCard) => {
            if (!lbCard) {
                const error = new Error(`The business network card "${cardName}" does not exist`);
                error.statusCode = error.status = 404;
                throw error;
            }
            return Card.updateAll({
                userId,
                default: true
            }, {
                default: false
            }).then(() => {
                lbCard.default = true;
                return lbCard.save();
            });
        });
    }

    // Disable all default remote methods.
    Card.sharedClass.methods().forEach((method) => {
        const name = (method.isStatic ? '' : 'prototype.') + method.name;
        Card.disableRemoteMethodByName(name);
    });
    Card.disableRemoteMethodByName('prototype.__get__user');

    // Add a remote method for getting all cards.
    Card.getAllCards = (options) => {
        const userId = options.accessToken.userId;
        return Card.find({
            where: {
                userId
            }
        }).then((lbCards) => {
            return lbCards.map((lbCard) => {
                return {
                    name: lbCard.name,
                    default: lbCard.default
                };
            });
        });
    };
    Card.remoteMethod(
        'getAllCards', {
            description: 'Get all of the business network cards in the wallet',
            accepts: [{
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            returns: {
                type: ['Card'],
                root: true
            },
            http: {
                verb: 'get',
                path: '/'
            }
        }
    );

    // Add a remote method for getting a specific card.
    Card.getCardByName = (name, options) => {
        const userId = options.accessToken.userId;
        return Card.findOne({
            where: {
                userId,
                name
            }
        }).then((lbCard) => {
            if (!lbCard) {
                const error = new Error(`The business network card "${name}" does not exist`);
                error.statusCode = error.status = 404;
                throw error;
            }
            return {
                name: lbCard.name,
                default: lbCard.default
            };
        });
    };
    Card.remoteMethod(
        'getCardByName', {
            description: 'Get a specific business network card from the wallet',
            accepts: [{
                arg: 'name',
                type: 'string',
                required: true,
                description: 'The name of the business network card'
            }, {
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            returns: {
                type: 'Card',
                root: true
            },
            http: {
                verb: 'get',
                path: '/:name'
            }
        }
    );

    // Add a remote method for checking if a specific card exists.
    Card.existsCardByName = (name, options) => {
        const userId = options.accessToken.userId;
        return Card.findOne({
            where: {
                userId,
                name
            }
        }).then((lbCard) => {
            if (!lbCard) {
                const error = new Error(`The business network card "${name}" does not exist`);
                error.statusCode = error.status = 404;
                throw error;
            }
            return {
                name: lbCard.name,
                default: lbCard.default
            };
        });
    };
    Card.remoteMethod(
        'existsCardByName', {
            description: 'Test the existance of a specific business network card in the wallet',
            accepts: [{
                arg: 'name',
                type: 'string',
                required: true,
                description: 'The name of the business network card'
            }, {
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            http: {
                verb: 'head',
                path: '/:name'
            }
        }
    );

    // Add a remote method for deleting a specific card.
    Card.deleteCardByName = (name, options) => {
        const userId = options.accessToken.userId;
        return Card.destroyAll({
            userId,
            name
        }).then((info) => {
            if (!info.count) {
                const error = new Error(`The business network card "${name}" does not exist`);
                error.statusCode = error.status = 404;
                throw error;
            }
        });
    };
    Card.remoteMethod(
        'deleteCardByName', {
            description: 'Delete a specific business network card from the wallet',
            accepts: [{
                arg: 'name',
                type: 'string',
                required: true,
                description: 'The name of the business network card'
            }, {
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            http: {
                verb: 'delete',
                path: '/:name'
            }
        }
    );

    // Add a remote method for importing a card.
    Card.importCard = (ignored, name, req, options) => {
        const userId = options.accessToken.userId;
        const form = Util.createIncomingForm();
        const cardStore = new LoopBackCardStore(Card, userId);
        return new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    return reject(err);
                }
                resolve(files.card);
            });
        }).then((card) => {
            return new Promise((resolve, reject) => {
                fs.readFile(card.path, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data);
                });
            });
        }).then((cardData) => {
            return IdCard.fromArchive(cardData);
        }).then((card) => {
            if (!name) {
                const locationName = card.getBusinessNetworkName() || card.getConnectionProfile().name;
                name = card.getUserName() + '@' + locationName;
            }
            // Put the card into the card store.
            return cardStore.put(name, card);
        }).then(() => {
            // Get the card back from the card store. This obviously looks a bit weird,
            // but importantly this will configure the LoopBack wallet on the connection
            // profile stored within the card.
            return cardStore.get(name);
        }).then((card) => {
            // Then we import the card into the card store using the admin connection.
            // This imports the credentials from the card into the LoopBack wallet.
            const adminConnection = new AdminConnection({ cardStore });
            return adminConnection.importCard(name, card);
        }).then(() => {
            return getDefaultCard(userId);
        }).then((defaultCard) => {
            if (!defaultCard) {
                return setDefaultCard(userId, name);
            }
        });
    };
    Card.remoteMethod(
        'importCard', {
            description: 'Import a business network card into the wallet',
            accepts: [{
                arg: 'card',
                type: 'file',
                http: {
                    source: 'form'
                },
                // Can't be required as LoopBack can't handle file based arguments.
                // required: true,
                description: 'The business network card (.card) file to import'
            }, {
                arg: 'name',
                type: 'string',
                http: {
                    source: 'query'
                },
                required: false,
                description: 'The name of the business network card'
            }, {
                arg: 'req',
                type: 'object',
                http: {
                    source: 'req'
                }
            }, {
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            http: {
                verb: 'post',
                path: '/import'
            }
        }
    );

    // Add a remote method for exporting a card.
    Card.exportCard = (name, res, options) => {
        const cardStore = new LoopBackCardStore(Card, options.accessToken.userId);
        const adminConnection = new AdminConnection({ cardStore });
        return adminConnection.exportCard(name)
            .then((card) => {
                // Delete the wallet on the way out, this is internal to the REST server.
                delete card.connectionProfile.wallet;
                return card.toArchive({ type: 'nodebuffer' });
            })
            .then((cardData) => {
                res.setHeader('Content-Disposition', `attachment; filename=${name}.card`);
                res.setHeader('Content-Length', cardData.length);
                res.setHeader('Content-Type', 'application/octet-stream');
                return cardData;
            });
    };
    Card.remoteMethod(
        'exportCard', {
            description: 'Export a business network card from the wallet',
            accepts: [{
                arg: 'name',
                type: 'string',
                required: true,
                description: 'The name of the business network card'
            }, {
                arg: 'res',
                type: 'object',
                http: {
                    source: 'res'
                }
            }, {
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            returns: [{
                arg: 'cardFile',
                type: 'file',
                root: true
            }],
            http: {
                verb: 'get',
                path: '/:name/export',
            },
        }
    );

    // Add a remote method for setting the default card.
    Card.setDefault = (name, options) => {
        const userId = options.accessToken.userId;
        return setDefaultCard(userId, name);
    };
    Card.remoteMethod(
        'setDefault', {
            description: 'Set a specific business network card as the default business network card',
            accepts: [{
                arg: 'name',
                type: 'string',
                required: true,
                description: 'The name of the business network card'
            }, {
                arg: 'options',
                type: 'object',
                http: 'optionsFromRequest'
            }],
            http: {
                verb: 'post',
                path: '/:name/setDefault'
            }
        }
    );

};

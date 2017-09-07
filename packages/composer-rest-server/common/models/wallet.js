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

module.exports = function (Wallet) {

    // Disable all undesired methods.
    const whitelist = [
        'create',
        'deleteById',
        'find',
        'findById',
        'exists',
        'replaceById',
        'prototype.__get__identities',
        'prototype.__findById__identities',
        'prototype.__create__identities',
        'prototype.__updateById__identities',
        'prototype.__destroyById__identities',
        'setDefaultWallet',
        'setDefaultIdentity'
    ];
    Wallet.sharedClass.methods().forEach((method) => {
        const name = (method.isStatic ? '' : 'prototype.') + method.name;
        if (whitelist.indexOf(name) === -1) {
            Wallet.disableRemoteMethodByName(name);
        } else if (name === 'exists') {
            // we want to remove the /:id/exists method
            method.http = [{ verb: 'head', path: '/:id' }];
        } else if (name === 'replaceById') {
            // we want to remove the /:id/replace method
            method.http = [{ verb: 'put', path: '/:id' }];
        }
    });
    Wallet.disableRemoteMethodByName('prototype.__get__user');
    Wallet.disableRemoteMethodByName('prototype.__count__identities');
    Wallet.disableRemoteMethodByName('prototype.__delete__identities');

    // Ensure that the current user ID is stored as the owner of the wallet.
    Wallet.observe('before save', function (ctx, next) {
        if (ctx.options.accessToken) {
            ctx.instance.userId = ctx.options.accessToken.userId;
        }
        next();
    });

    // Ensure that users can only see their wallets.
    Wallet.observe('access', function (ctx, next) {
        if (ctx.options.accessToken) {
            const userId = ctx.options.accessToken.userId;
            ctx.query.where = ctx.query.where || {};
            ctx.query.where.userId = userId;
        }
        next();
    });

    // Set the specified wallet as the default wallet for the user.
    Wallet.setDefaultWallet = function (id) {
        let wallet;
        return Wallet.findById(id)
            .then((wallet_) => {
                wallet = wallet_;
                const user = Wallet.app.models.user;
                return user.findById(wallet.userId);
            })
            .then((user) => {
                user.defaultWallet = wallet.id;
                return user.save();
            });
    };

    // Expose the setDefaultWallet method as an HTTP POST method.
    Wallet.remoteMethod('setDefaultWallet', {
        accepts: [
            {
                arg: 'id',
                type: 'string',
                required: true
            }
        ],
        http: {
            path: '/:id/setDefault',
            verb: 'post'
        }
    });

    // Set the specified identity as the default identity for the wallet.
    Wallet.setDefaultIdentity = function (id, fk) {
        let wallet;
        return Wallet.findById(id)
            .then((wallet_) => {
                wallet = wallet_;
                const WalletIdentity = Wallet.app.models.WalletIdentity;
                return WalletIdentity.findById(fk);
            })
            .then((identity) => {
                if (!identity) {
                    throw new Error('The specified identity does not exist in the specified wallet');
                }
                wallet.defaultIdentity = identity.id;
                return wallet.save();
            });
    };

    // Expose the setDefaultWallet method as an HTTP POST method.
    Wallet.remoteMethod('setDefaultIdentity', {
        accepts: [
            {
                arg: 'id',
                type: 'string',
                required: true
            },
            {
                arg: 'fk',
                type: 'string',
                required: true
            }
        ],
        http: {
            path: '/:id/identities/:fk/setDefault',
            verb: 'post'
        }
    });

};

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

const LoopBackWallet = require('../../lib/loopbackwallet');

module.exports = function (app) {

    // Get the Composer configuration.
    const composer = app.get('composer');
    if (!composer) {
        return;
    }

    // We only need to enable this code if the multiple user option has been specified.
    const multiuser = !!composer.multiuser;
    if (!multiuser) {
        return;
    }

    // Extract the required models from the LoopBack application.
    const userModel = app.models.user;
    const WalletModel = app.models.Wallet;
    const WalletIdentityModel = app.models.WalletIdentity;

    // Register a hook for all remote methods that loads the enrollment ID and
    // enrollment secret from the logged-in users wallet for passing to the connector.
    app.remotes().phases
        .addBefore('invoke', 'options-from-request')
        .use(function (ctx, next) {

            // Check to see if the access token has been provided.
            if (!ctx.args.options) {
                return next();
            } else if (!ctx.args.options.accessToken) {
                return next();
            }

            // Extract the current user ID, and find the current user.
            const userId = ctx.args.options.accessToken.userId;
            let wallet;
            return userModel.findById(userId)
                .then((user) => {

                    // If there is no user, bail.
                    if (!user) {
                        return;
                    }

                    // Find the default wallet for the current user.
                    return WalletModel.findById(user.defaultWallet);
                })
                .then((wallet_) => {

                    // If there is no default wallet, bail.
                    wallet = wallet_;
                    if (!wallet) {
                        return;
                    }

                    // If the wallet does not have a default identity, bail.
                    if (!wallet.defaultIdentity) {
                        return;
                    }

                    // Find the default identity for the default wallet.
                    return WalletIdentityModel.findById(wallet.defaultIdentity);

                })
                .then((identity) => {

                    // If there is no default identity, bail.
                    if (!identity) {
                        return;
                    }

                    // Create a wallet for the LoopBack connector to use.
                    ctx.args.options.wallet = new LoopBackWallet(app, wallet, identity.enrollmentID);

                    // Store the enrollment ID and secret for the LoopBack
                    // connector to use.
                    ctx.args.options.enrollmentID = identity.enrollmentID;
                    ctx.args.options.enrollmentSecret = identity.enrollmentSecret;

                })
                .then(() => {
                    next();
                })
                .catch((error) => {
                    next(error);
                });
        });

};


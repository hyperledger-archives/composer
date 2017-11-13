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

const LoopBackCardStore = require('../../lib/loopbackcardstore');

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
    const Card = app.models.Card;

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

            // Extract the current user ID.
            const userId = ctx.args.options.accessToken.userId;
            if (!userId) {
                return next();
            }

            // Check for the existance of a header specifying the card.
            const cardName = ctx.req.get('X-Composer-Card');
            if (cardName) {
                ctx.args.options.cardStore = new LoopBackCardStore(Card, userId);
                ctx.args.options.card = cardName;
                return next();
            }

            // Find the default card for this user.
            return Card.findOne({ where: { userId, default: true }})
                .then((lbCard) => {

                    // Store the card for the LoopBack connector to use.
                    if (lbCard) {
                        ctx.args.options.cardStore = new LoopBackCardStore(Card, userId);
                        ctx.args.options.card = lbCard.name;
                    }

                })
                .then(() => {
                    next();
                })
                .catch((error) => {
                    next(error);
                });

        });

};


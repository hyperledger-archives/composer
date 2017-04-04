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

const boot = require('loopback-boot');
const loopback = require('loopback');
require('loopback-component-passport');
const path = require('path');

require('chai').should();

describe('user model', () => {

    let app;
    let userModel, WalletModel;

    beforeEach(() => {
        app = loopback();
        return new Promise((resolve, reject) => {
            boot(app, path.resolve(__dirname, '..', '..', '..', 'server'), (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        })
        .then(() => {
            userModel = app.models.user;
            WalletModel = app.models.Wallet;
            const dataSource = loopback.createDataSource({
                connector: loopback.Memory
            });
            userModel.attachTo(dataSource);
            WalletModel.attachTo(dataSource);
        });
    });

    describe('#after save hook', () => {

        it('should create a default wallet if one does not exist', () => {
            return userModel.create({ email: 'alice@email.com', password: 'password' })
                .then((user) => {
                    return WalletModel.findOne({ where: { userId: user.id }});
                })
                .then((wallet) => {
                    wallet.description.should.equal('Default wallet');
                });
        });

        it('should not create a default wallet if one already exists', () => {
            return WalletModel.create({ userId: 1, description: 'Default wallet created before test', createdAsDefault: true })
                .then(() => {
                    return userModel.create({ email: 'alice@email.com', password: 'password' });
                })
                .then((user) => {
                    return WalletModel.findOne({ where: { userId: user.id }});
                })
                .then((wallet) => {
                    wallet.description.should.equal('Default wallet created before test');
                });
        });

        // This is needed to satisfy code coverage as updateAll does not set ctx.instance.
        it('should handle an updateAll call without any errors', () => {
            return userModel.create({ email: 'alice@email.com', password: 'password' })
                .then((user) => {
                    return userModel.updateAll({ email: 'alice@email.com' }, { password: 'password2' });
                });
        });

    });

});

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
const LoopBackWallet = require('../../lib/loopbackwallet');
const path = require('path');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));

describe('LoopBackWallet', () => {

    let app;
    let userModel, WalletModel, WalletIdentityModel;
    let user, wallet, lbWallet;

    beforeEach(() => {
        app = loopback();
        return new Promise((resolve, reject) => {
            boot(app, path.resolve(__dirname, '..', '..', 'server'), (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        })
        .then(() => {
            userModel = app.models.user;
            WalletModel = app.models.Wallet;
            WalletIdentityModel = app.models.WalletIdentity;
            const dataSource = loopback.createDataSource({
                connector: loopback.Memory
            });
            userModel.attachTo(dataSource);
            WalletModel.attachTo(dataSource);
            WalletIdentityModel.attachTo(dataSource);
            return userModel.create({ email: 'alice@email.com', password: 'password' });
        })
        .then((user_) => {
            user = user_;
            return WalletModel.create({ userId: user.id, description: 'Test wallet' });
        })
        .then((wallet_) => {
            wallet = wallet_;
            return new Promise((resolve, reject) => {
                WalletIdentityModel.create([
                    {
                        walletId: wallet.id,
                        enrollmentID: 'testuser',
                        enrollmentSecret: 'testpass',
                        data: {
                            test1: 'hello this is a cert',
                            test2: 'hello this is another cert'
                        }
                    }
                ], (err) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        })
        .then(() => {
            lbWallet = new LoopBackWallet(app, wallet, 'testuser');
        });
    });

    describe('#list', () => {

        it('should return an empty array when no keys exist', () => {
            return WalletIdentityModel.findOne({ where: { enrollmentID: 'testuser' } })
                .then((identity) => {
                    identity.data = {};
                    return identity.save();
                })
                .then(() => {
                    return lbWallet.list();
                })
                .should.eventually.be.deep.equal([]);
        });

        it('should return a list of keys', () => {
            return lbWallet.list()
                .should.eventually.be.deep.equal(['test1', 'test2']);
        });

    });

    describe('#contains', () => {

        it('should return false for a key that does not exist', () => {
            return lbWallet.contains('test0')
                .should.eventually.be.false;
        });

        it('should return true for a key that does exist', () => {
            return lbWallet.contains('test2')
                .should.eventually.be.true;
        });

    });

    describe('#get', () => {

        it('should return undefined for a key that does not exist', () => {
            return lbWallet.get('testA')
                .should.eventually.be.undefined;
        });

        it('should return the value for a key that does exist', () => {
            return lbWallet.get('test1')
                .should.eventually.be.equal('hello this is a cert');
        });

    });

    describe('#add', () => {

        it('should set the value for a key', () => {
            return lbWallet.add('testA', 'hello this is a test set cert')
                .then(() => {
                    return WalletIdentityModel.findOne({ where: { enrollmentID: 'testuser' } });
                })
                .then((identity) => {
                    identity.data.testA.should.equal('hello this is a test set cert');
                });
        });

    });

    describe('#update', () => {

        it('should update the value for a key', () => {
            return lbWallet.update('test2', 'hello this is a test set cert')
                .then(() => {
                    return WalletIdentityModel.findOne({ where: { enrollmentID: 'testuser' } });
                })
                .then((identity) => {
                    identity.data.test2.should.equal('hello this is a test set cert');
                });
        });

    });

    describe('#remove', () => {

        it('should remove the key', () => {
            return lbWallet.remove('test2')
                .then(() => {
                    return WalletIdentityModel.findOne({ where: { enrollmentID: 'testuser' } });
                })
                .then((identity) => {
                    should.equal(identity.data.test2, undefined);
                });
        });

    });

});

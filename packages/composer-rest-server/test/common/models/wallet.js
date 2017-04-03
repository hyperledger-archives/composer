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
const WalletScript = require('../../../common/models/wallet');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('Wallet model', () => {

    let app;
    let userModel, WalletModel, WalletIdentityModel;
    let user;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
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
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#before save hook', () => {

        it('should do nothing if there is no logged in user', () => {
            sandbox.stub(WalletModel, 'observe');
            WalletScript(WalletModel);
            sinon.assert.called(WalletModel.observe);
            const ev = WalletModel.observe.args[0][0];
            ev.should.equal('before save');
            const cb = WalletModel.observe.args[0][1];
            const ctx = {
                instance: { },
                options: { }
            };
            const next = sinon.stub();
            cb(ctx, next);
            sinon.assert.calledOnce(next);
        });

        it('should set the userId to the logged in user', () => {
            sandbox.stub(WalletModel, 'observe');
            WalletScript(WalletModel);
            sinon.assert.called(WalletModel.observe);
            const ev = WalletModel.observe.args[0][0];
            ev.should.equal('before save');
            const cb = WalletModel.observe.args[0][1];
            const ctx = {
                instance: { },
                options: {
                    accessToken: {
                        userId: '999'
                    }
                }
            };
            const next = sinon.stub();
            cb(ctx, next);
            ctx.instance.userId.should.equal('999');
            sinon.assert.calledOnce(next);
        });

    });

    describe('#access hook', () => {

        it('should do nothing if there is no logged in user', () => {
            sandbox.stub(WalletModel, 'observe');
            WalletScript(WalletModel);
            sinon.assert.called(WalletModel.observe);
            const ev = WalletModel.observe.args[1][0];
            ev.should.equal('access');
            const cb = WalletModel.observe.args[1][1];
            const ctx = {
                instance: { },
                options: { }
            };
            const next = sinon.stub();
            cb(ctx, next);
            sinon.assert.calledOnce(next);
        });

        it('should add a where and set the userId to the logged in user', () => {
            sandbox.stub(WalletModel, 'observe');
            WalletScript(WalletModel);
            sinon.assert.called(WalletModel.observe);
            const ev = WalletModel.observe.args[1][0];
            ev.should.equal('access');
            const cb = WalletModel.observe.args[1][1];
            const ctx = {
                instance: { },
                options: {
                    accessToken: {
                        userId: '999'
                    }
                },
                query: {

                }
            };
            const next = sinon.stub();
            cb(ctx, next);
            ctx.query.where.should.deep.equal({
                userId: '999'
            });
            sinon.assert.calledOnce(next);
        });

        it('should set the userId to the logged in user in an existing where', () => {
            sandbox.stub(WalletModel, 'observe');
            WalletScript(WalletModel);
            sinon.assert.called(WalletModel.observe);
            const ev = WalletModel.observe.args[1][0];
            ev.should.equal('access');
            const cb = WalletModel.observe.args[1][1];
            const ctx = {
                instance: { },
                options: {
                    accessToken: {
                        userId: '999'
                    }
                },
                query: {
                    where: {
                        description: 'blah'
                    }
                }
            };
            const next = sinon.stub();
            cb(ctx, next);
            ctx.query.where.should.deep.equal({
                userId: '999',
                description: 'blah'
            });
            sinon.assert.calledOnce(next);
        });

    });

    describe('#setDefaultWallet', () => {

        it('should be able to set itself as the default wallet', () => {
            let wallet;
            return WalletModel.create({ userId: user.id, description: 'Test wallet' })
                .then((wallet_) => {
                    wallet = wallet_;
                    return WalletModel.setDefaultWallet(wallet.id);
                })
                .then(() => {
                    return user.reload();
                })
                .then((user_) => {
                    user = user_;
                    user.defaultWallet.should.equal(wallet.id);
                });
        });

    });

    describe('#setDefaultIdentity', () => {

        it('should be able to set an identity as the default identity', () => {
            let wallet, identity;
            return WalletModel.create({ userId: user.id, description: 'Test wallet' })
                .then((wallet_) => {
                    wallet = wallet_;
                    return WalletIdentityModel.create({ enrollmentID: 'testuser', enrollmentSecret: 'testpass', walletId: wallet.id });
                })
                .then((identity_) => {
                    identity = identity_;
                    return WalletModel.setDefaultIdentity(wallet.id, identity.id);
                })
                .then(() => {
                    return wallet.reload();
                })
                .then((wallet_) => {
                    wallet = wallet_;
                    wallet.defaultIdentity.should.equal(identity.id);
                });
        });

        it('should throw on an attempt to set an invalid identity as the default identity', () => {
            let wallet;
            return WalletModel.create({ userId: user.id, description: 'Test wallet' })
                .then((wallet_) => {
                    wallet = wallet_;
                    return WalletModel.setDefaultIdentity(wallet.id, 'lulz no such identity');
                })
                .should.be.rejectedWith(/identity does not exist/);
        });

    });

});

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
const composerRuntime = require('../../../server/boot/composer-runtime');
const loopback = require('loopback');
require('loopback-component-passport');
const LoopBackWallet = require('../../../lib/loopbackwallet');
const path = require('path');

require('chai').should();
const sinon = require('sinon');


describe('composer-runtime boot script', () => {

    let composerConfig;
    let app;
    let userModel, WalletModel, WalletIdentityModel;
    let useSpy;
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
            useSpy = sinon.spy();
            const remotes = {
                phases: {
                    addBefore: (arg1, arg2) => {
                        return {
                            use: useSpy
                        };
                    }
                }
            };
            sinon.stub(app, 'remotes').returns(remotes);
            app.get = (name) => {
                if (name !== 'composer') {
                    return null;
                }
                return composerConfig;
            };
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should do nothing if composer not set', () => {
        composerRuntime(app);
        sinon.assert.notCalled(useSpy);
    });

    it('should do nothing if composer multiuser is not enabled', () => {
        composerConfig = {
            multiuser: false
        };
        composerRuntime(app);
        sinon.assert.notCalled(useSpy);
    });

    it('should ignore requests without any options', () => {
        composerConfig = {
            multiuser: true
        };
        composerRuntime(app);
        const fn = useSpy.args[0][0]; // First call, first argument.
        const cb = sinon.stub();
        const ctx = {
            args: {

            }
        };
        fn(ctx, cb);
        sinon.assert.calledOnce(cb);
    });

    it('should ignore requests without an access token', () => {
        composerConfig = {
            multiuser: true
        };
        composerRuntime(app);
        const fn = useSpy.args[0][0]; // First call, first argument.
        const cb = sinon.stub();
        const ctx = {
            args: {
                options: {

                }
            }
        };
        fn(ctx, cb);
        sinon.assert.calledOnce(cb);
    });

    it('should ignore requests with an access token for a user that does not exist', () => {
        composerConfig = {
            multiuser: true
        };
        composerRuntime(app);
        const fn = useSpy.args[0][0]; // First call, first argument.
        const cb = sinon.stub();
        const ctx = {
            args: {
                options: {
                    accessToken: {
                        userId: '999'
                    }
                }
            }
        };
        return fn(ctx, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
            });
    });

    it('should ignore requests with an access token for a user that does not have a default wallet', () => {
        composerConfig = {
            multiuser: true
        };
        composerRuntime(app);
        const fn = useSpy.args[0][0]; // First call, first argument.
        const cb = sinon.stub();
        const ctx = {
            args: {
                options: {
                    accessToken: {
                        userId: user.id
                    }
                }
            }
        };
        return fn(ctx, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
            });
    });

    it('should ignore requests with an access token for a user that has a default wallet that does not exist', () => {
        composerConfig = {
            multiuser: true
        };
        composerRuntime(app);
        const fn = useSpy.args[0][0]; // First call, first argument.
        const cb = sinon.stub();
        const ctx = {
            args: {
                options: {
                    accessToken: {
                        userId: user.id
                    }
                }
            }
        };
        return user.updateAttribute('defaultWallet', '999')
            .then(() => {
                return fn(ctx, cb);
            })
            .then(() => {
                sinon.assert.calledOnce(cb);
            });
    });

    it('should ignore requests with an access token for a wallet that does not have a default identity', () => {
        composerConfig = {
            multiuser: true
        };
        composerRuntime(app);
        const fn = useSpy.args[0][0]; // First call, first argument.
        const cb = sinon.stub();
        const ctx = {
            args: {
                options: {
                    accessToken: {
                        userId: user.id
                    }
                }
            }
        };
        return WalletModel.create({ userId: user.id, description: 'Test wallet' })
            .then((wallet) => {
                return user.updateAttribute('defaultWallet', wallet.id);
            })
            .then(() => {
                return fn(ctx, cb);
            })
            .then(() => {
                sinon.assert.calledOnce(cb);
            });
    });

    it('should ignore requests with an access token for a wallet that has a default identity that does not exist', () => {
        composerConfig = {
            multiuser: true
        };
        composerRuntime(app);
        const fn = useSpy.args[0][0]; // First call, first argument.
        const cb = sinon.stub();
        const ctx = {
            args: {
                options: {
                    accessToken: {
                        userId: user.id
                    }
                }
            }
        };
        return WalletModel.create({ userId: user.id, description: 'Test wallet', defaultIdentity: '999' })
            .then((wallet) => {
                return user.updateAttribute('defaultWallet', wallet.id);
            })
            .then(() => {
                return fn(ctx, cb);
            })
            .then(() => {
                sinon.assert.calledOnce(cb);
            });
    });

    it('should configure the options with the default wallet and default identity', () => {
        composerConfig = {
            multiuser: true
        };
        composerRuntime(app);
        const fn = useSpy.args[0][0]; // First call, first argument.
        const cb = sinon.stub();
        const ctx = {
            args: {
                options: {
                    accessToken: {
                        userId: user.id
                    }
                }
            }
        };
        let wallet;
        return WalletModel.create({ userId: user.id, description: 'Test wallet', defaultIdentity: '999' })
            .then((wallet_) => {
                wallet = wallet_;
                return WalletIdentityModel.create({ walletId: wallet.id, enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
            })
            .then((identity) => {
                return wallet.updateAttribute('defaultIdentity', identity.id);
            })
            .then(() => {
                return user.updateAttribute('defaultWallet', wallet.id);
            })
            .then(() => {
                return fn(ctx, cb);
            })
            .then(() => {
                sinon.assert.calledOnce(cb);
                ctx.args.options.wallet.should.be.an.instanceOf(LoopBackWallet);
                ctx.args.options.enrollmentID.should.equal('admin');
                ctx.args.options.enrollmentSecret.should.equal('adminpw');
            });
    });

    it('should handle any errors', () => {
        composerConfig = {
            multiuser: true
        };
        composerRuntime(app);
        const fn = useSpy.args[0][0]; // First call, first argument.
        const cb = sinon.stub();
        const ctx = {
            args: {
                options: {
                    accessToken: {
                        userId: '999'
                    }
                }
            }
        };
        sandbox.stub(userModel, 'findById').rejects(new Error('such error'));
        return fn(ctx, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
                cb.args[0][0].should.match(/such error/);
            });
    });

});

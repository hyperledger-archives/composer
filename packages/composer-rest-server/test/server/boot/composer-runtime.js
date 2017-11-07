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
const LoopBackCardStore = require('../../../lib/loopbackcardstore');
const path = require('path');

require('chai').should();
const sinon = require('sinon');


describe('composer-runtime boot script', () => {

    let composerConfig;
    let app;
    let user, Card;
    let useSpy;
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
            const user = app.models.user;
            Card = app.models.Card;
            const dataSource = loopback.createDataSource({
                connector: loopback.Memory
            });
            user.attachTo(dataSource);
            Card.attachTo(dataSource);
            return user.create({ email: 'alice@email.com', password: 'password' });
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
            },
            req: {
                get: sinon.stub()
            }
        };
        return fn(ctx, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
            });
    });

    it('should ignore requests with an access token without a user ID', () => {
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
                    }
                }
            },
            req: {
                get: sinon.stub()
            }
        };
        fn(ctx, cb);
        sinon.assert.calledOnce(cb);
    });

    it('should ignore requests with an access token for a user that does not have a default card', () => {
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
            },
            req: {
                get: sinon.stub()
            }
        };
        return fn(ctx, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
            });
    });

    it('should configure the options with the default card', () => {
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
            },
            req: {
                get: sinon.stub()
            }
        };
        return Card.create({ userId: user.id, name: 'admin@bond-network', default: true })
            .then(() => {
                return fn(ctx, cb);
            })
            .then(() => {
                sinon.assert.calledOnce(cb);
                ctx.args.options.cardStore.should.be.an.instanceOf(LoopBackCardStore);
                ctx.args.options.card.should.equal('admin@bond-network');
            });
    });

    it('should configure the options with a card specified in a header', () => {
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
            },
            req: {
                get: sinon.stub()
            }
        };
        ctx.req.get.withArgs('X-Composer-Card').returns('alice1@bond-network');
        fn(ctx, cb);
        sinon.assert.calledOnce(cb);
        ctx.args.options.cardStore.should.be.an.instanceOf(LoopBackCardStore);
        ctx.args.options.card.should.equal('alice1@bond-network');
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
            },
            req: {
                get: sinon.stub()
            }
        };
        sandbox.stub(Card, 'findOne').rejects(new Error('such error'));
        return fn(ctx, cb)
            .then(() => {
                sinon.assert.calledOnce(cb);
                cb.args[0][0].should.match(/such error/);
            });
    });

});

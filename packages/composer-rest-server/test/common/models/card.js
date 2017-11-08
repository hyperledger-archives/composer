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
const formidable = require('formidable');
const fs = require('fs');
const loopback = require('loopback');
require('loopback-component-passport');
const path = require('path');
const Util = require('../../../lib/util');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('Card', () => {

    let app;
    let user, Card;
    let sandbox;
    let options;

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
            options = {
                accessToken: {
                    userId: user.id
                }
            };
            return Card.create([{ userId: user.id, name: 'alice1@bond-network', default: true }, { userId: user.id, name: 'bob1@bond-network', default: false }]);
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#getAllCards', () => {

        it('should return all cards', () => {
            return Card.getAllCards(options)
                .then((cards) => {
                    cards.should.deep.equal([
                        { name: 'alice1@bond-network', default: true },
                        { name: 'bob1@bond-network', default: false }
                    ]);
                });
        });

    });

    describe('#getCardByName', () => {

        it('should return the specified card', () => {
            return Card.getCardByName('bob1@bond-network', options)
                .then((card) => {
                    card.should.deep.equal({ name: 'bob1@bond-network', default: false });
                });
        });

        it('should throw if the specified card does not exist', () => {
            return Card.getCardByName('charlie1@bond-network', options)
                .should.be.rejectedWith(/The business network card.*does not exist/)
                .then((error) => {
                    error.statusCode.should.equal(404);
                    error.status.should.equal(404);
                });
        });

    });

    describe('#existsCardByName', () => {

        it('should return the specified card', () => {
            return Card.existsCardByName('bob1@bond-network', options)
                .then((card) => {
                    card.should.deep.equal({ name: 'bob1@bond-network', default: false });
                });
        });

        it('should throw if the specified card does not exist', () => {
            return Card.existsCardByName('charlie1@bond-network', options)
                .should.be.rejectedWith(/The business network card.*does not exist/)
                .then((error) => {
                    error.statusCode.should.equal(404);
                    error.status.should.equal(404);
                });
        });

    });

    describe('#deleteCardByName', () => {

        it('should delete the specified card', () => {
            return Card.deleteCardByName('bob1@bond-network', options)
                .then(() => {
                    return Card.findOne({ where: { name: 'bob1@bond-network' }});
                })
                .then((card) => {
                    should.equal(card, null);
                });
        });

        it('should throw if the specified card does not exist', () => {
            return Card.deleteCardByName('charlie1@bond-network', options)
                .should.be.rejectedWith(/The business network card.*does not exist/)
                .then((error) => {
                    error.statusCode.should.equal(404);
                    error.status.should.equal(404);
                });
        });

    });

    describe('#importCard', () => {

        it('should handle an error parsing the card from the request', () => {
            const mockForm = sinon.createStubInstance(formidable.IncomingForm);
            sandbox.stub(Util, 'createIncomingForm').returns(mockForm);
            mockForm.parse.yields(new Error('such parse error'));
            const req = {};
            return Card.importCard(null, null, req, options)
                .should.be.rejectedWith(/such parse error/);
        });

        it('should handle an error reading the card from the file system', () => {
            const mockForm = sinon.createStubInstance(formidable.IncomingForm);
            sandbox.stub(Util, 'createIncomingForm').returns(mockForm);
            mockForm.parse.yields(null, null, { card: { path: '/tmp/admin.card' }});
            sandbox.stub(fs, 'readFile').withArgs('/tmp/admin.card').yields(new Error('such file error'));
            const req = {};
            return Card.importCard(null, null, req, options)
                .should.be.rejectedWith(/such file error/);
        });

    });

    describe('#setDefault', () => {

        it('should set the specified card as the default', () => {
            return Card.setDefault('bob1@bond-network', options)
                .then(() => {
                    return Card.findOne({ where: { name: 'bob1@bond-network', default: true }});
                })
                .then((card) => {
                    card.default.should.be.true;
                });
        });

        it('should throw if the specified card does not exist', () => {
            return Card.setDefault('charlie1@bond-network', options)
                .should.be.rejectedWith(/The business network card.*does not exist/)
                .then((error) => {
                    error.statusCode.should.equal(404);
                    error.status.should.equal(404);
                });
        });

        it('should handle setting the default card as the default', () => {
            return Card.setDefault('alice1@bond-network', options)
                .then(() => {
                    return Card.findOne({ where: { name: 'alice1@bond-network', default: true }});
                })
                .then((card) => {
                    card.default.should.be.true;
                });
        });
    });

});

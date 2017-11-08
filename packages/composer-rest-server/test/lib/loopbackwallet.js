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
    let Card, card, lbCard;

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
            const user = app.models.user;
            Card = app.models.Card;
            const dataSource = loopback.createDataSource({
                connector: loopback.Memory
            });
            user.attachTo(dataSource);
            Card.attachTo(dataSource);
            return user.create({ email: 'alice@email.com', password: 'password' });
        })
        .then((user) => {
            return Card.create({ userId: user.id, name: 'admin@biznet', base64: 'aGVsbG8gd29ybGQK', data: { test1: 'hello this is a cert', test2: 'nay' } });
        })
        .then((card_) => {
            card = card_;
            lbCard = new LoopBackWallet(card);
        });
    });

    describe('#list', () => {

        it('should return an empty array when no keys exist', () => {
            return Card.findOne({ where: { name: 'admin@biznet' } })
                .then((card) => {
                    card.data = {};
                    return card.save();
                })
                .then(() => {
                    return lbCard.list();
                })
                .should.eventually.be.deep.equal([]);
        });

        it('should return a list of keys', () => {
            return lbCard.list()
                .should.eventually.be.deep.equal(['test1', 'test2']);
        });

    });

    describe('#contains', () => {

        it('should return false for a key that does not exist', () => {
            return lbCard.contains('test0')
                .should.eventually.be.false;
        });

        it('should return true for a key that does exist', () => {
            return lbCard.contains('test2')
                .should.eventually.be.true;
        });

    });

    describe('#get', () => {

        it('should return undefined for a key that does not exist', () => {
            return lbCard.get('test0')
                .should.eventually.be.undefined;
        });

        it('should return the value for a key that does exist', () => {
            return lbCard.get('test1')
                .should.eventually.be.equal('hello this is a cert');
        });

    });

    describe('#add', () => {

        it('should set the value for a key', () => {
            return lbCard.add('testA', 'hello this is a test set cert')
                .then(() => {
                    return Card.findOne({ where: { name: 'admin@biznet' } });
                })
                .then((card) => {
                    card.data.testA.should.equal('hello this is a test set cert');
                });
        });

    });

    describe('#update', () => {

        it('should update the value for a key', () => {
            return lbCard.update('test2', 'hello this is a test set cert')
                .then(() => {
                    return Card.findOne({ where: { name: 'admin@biznet' } });
                })
                .then((card) => {
                    card.data.test2.should.equal('hello this is a test set cert');
                });
        });

    });

    describe('#remove', () => {

        it('should remove the key', () => {
            return lbCard.remove('test2')
                .then(() => {
                    return Card.findOne({ where: { name: 'admin@biznet' } });
                })
                .then((card) => {
                    should.equal(card.data.test2, undefined);
                });
        });

    });

});

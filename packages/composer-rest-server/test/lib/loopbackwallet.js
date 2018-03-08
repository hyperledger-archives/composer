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

    beforeEach(async () => {
        app = loopback();
        await new Promise((resolve, reject) => {
            boot(app, path.resolve(__dirname, '..', '..', 'server'), (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
        Card = app.models.Card;
        const dataSource = loopback.createDataSource({
            connector: loopback.Memory
        });
        app.models.user.attachTo(dataSource);
        Card.attachTo(dataSource);
        const user = await app.models.user.create({ email: 'alice@email.com', password: 'password' });
        card = await Card.create({ userId: user.id, name: 'admin@biznet', base64: 'aGVsbG8gd29ybGQK', data: { test1: 'hello this is a cert', test2: 'nay' } });
        lbCard = new LoopBackWallet(card);
    });

    describe('#listNames', () => {

        it('should return an empty array when no keys exist', async () => {
            const card = await Card.findOne({ where: { name: 'admin@biznet' } });
            card.data = {};
            await card.save();
            const result = await lbCard.listNames();
            result.should.deep.equal([]);
        });

        it('should return a list of keys', async () => {
            const result = await lbCard.listNames();
            result.should.deep.equal(['test1', 'test2']);
        });

    });

    describe('#contains', () => {

        it('should return false for a key that does not exist', async () => {
            const result = await lbCard.contains('test0');
            result.should.be.false;
        });

        it('should return true for a key that does exist', async () => {
            const result = await lbCard.contains('test2');
            result.should.be.true;
        });

    });

    describe('#get', () => {

        it('should return undefined for a key that does not exist', async () => {
            const result = await lbCard.get('test0');
            should.equal(result, undefined);
        });

        it('should return the value for a key that does exist', async () => {
            const result = await lbCard.get('test1');
            result.should.equal('hello this is a cert');
        });

    });

    describe('#put', () => {

        it('should set the value for a key', async () => {
            await lbCard.put('testA', 'hello this is a test set cert');
            const card = await Card.findOne({ where: { name: 'admin@biznet' } });
            card.data.testA.should.equal('hello this is a test set cert');
        });

        it('should update the value for a key', async () => {
            await lbCard.put('test2', 'hello this is a test set cert');
            const card = await Card.findOne({ where: { name: 'admin@biznet' } });
            card.data.test2.should.equal('hello this is a test set cert');
        });

    });

    describe('#remove', () => {

        it('should remove the key', async () => {
            await lbCard.remove('test2');
            const card = await Card.findOne({ where: { name: 'admin@biznet' } });
            should.equal(card.data.test2, undefined);
        });

    });

});

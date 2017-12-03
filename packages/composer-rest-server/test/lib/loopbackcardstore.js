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
const IdCard = require('composer-common').IdCard;
const loopback = require('loopback');
require('loopback-component-passport');
const LoopBackCardStore = require('../../lib/loopbackcardstore');
const path = require('path');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));

describe('LoopBackCardStore', () => {

    let app;
    let Card, cardStore;

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
            const idCard = new IdCard({ userName: 'alice1', enrollmentSecret: 'aliceSecret', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
            return idCard.toArchive({ type: 'nodebuffer' })
                .then((idCardData) => {
                    return Card.create({ userId: user.id, name: 'alice1@bond-network', base64: idCardData.toString('base64'), data: { test1: 'hello this is a cert', test2: 'nay' } });
                })
                .then(() => {
                    const idCard = new IdCard({ userName: 'bob1', enrollmentSecret: 'bobSecret', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
                    return idCard.toArchive({ type: 'nodebuffer' });
                })
                .then((idCardData) => {
                    return Card.create({ userId: user.id, name: 'bob1@bond-network', base64: idCardData.toString('base64'), data: { test1: 'hello this is a cert', test2: 'nay' } });
                });
        })
        .then(() => {
            cardStore = new LoopBackCardStore(Card);
        });
    });

    describe('#get', () => {

        it('should return the specified business network card', () => {
            return cardStore.get('alice1@bond-network')
                .then((card) => {
                    card.should.be.an.instanceOf(IdCard);
                    card.getUserName().should.equal('alice1');
                    card.getEnrollmentCredentials().secret.should.equal('aliceSecret');
                    card.getBusinessNetworkName().should.equal('bond-network');
                    card.getConnectionProfile().name.should.equal('defaultProfile');
                });
        });

        it('should throw an error if the specified business network card does not exist', () => {
            return cardStore.get('charlie1@bond-network')
                .should.be.rejectedWith(/The business network card.*does not exist/);
        });

    });

    describe('#put', () => {

        it('should put the specified business network card', () => {
            const idCard = new IdCard({ userName: 'charlie1', enrollmentSecret: 'charlieSecret', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
            return cardStore.put('charlie1@bond-network', idCard)
                .then(() => {
                    return Card.findOne({ where: { name: 'charlie1@bond-network' }});
                })
                .then((card) => {
                    card.name.should.equal('charlie1@bond-network');
                });
        });

        it('should replace the specified business network card', () => {
            const idCard = new IdCard({ userName: 'charlie1', enrollmentSecret: 'charlieSecret', businessNetwork: 'bond-network' }, { name: 'defaultProfile', type: 'embedded' });
            return cardStore.put('charlie1@bond-network', idCard)
                .then(() => {
                    return Card.count({ name: 'charlie1@bond-network' });
                })
                .then((count) => {
                    count.should.equal(1);
                    return cardStore.put('charlie1@bond-network', idCard);
                })
                .then(() => {
                    return Card.count({ name: 'charlie1@bond-network' });
                })
                .then((count) => {
                    count.should.equal(1);
                });
        });

    });

    describe('#getAll', () => {

        it('should return all business network cards', () => {
            return cardStore.getAll()
                .then((cards) => {
                    cards.should.be.an.instanceOf(Map);
                    const aliceCard = cards.get('alice1@bond-network');
                    aliceCard.should.be.an.instanceOf(IdCard);
                    aliceCard.getUserName().should.equal('alice1');
                    aliceCard.getEnrollmentCredentials().secret.should.equal('aliceSecret');
                    aliceCard.getBusinessNetworkName().should.equal('bond-network');
                    aliceCard.getConnectionProfile().name.should.equal('defaultProfile');
                    const bobCard = cards.get('bob1@bond-network');
                    bobCard.should.be.an.instanceOf(IdCard);
                    bobCard.getUserName().should.equal('bob1');
                    bobCard.getEnrollmentCredentials().secret.should.equal('bobSecret');
                    bobCard.getBusinessNetworkName().should.equal('bond-network');
                    bobCard.getConnectionProfile().name.should.equal('defaultProfile');
                });
        });

    });

    describe('#delete', () => {

        it('should delete the specified business network card', () => {
            return cardStore.delete('alice1@bond-network')
                .then(() => {
                    return Card.findOne({ where: { name: 'alice1@bond-network' }});
                })
                .then((card) => {
                    should.equal(card, null);
                });
        });

        it('should throw an error if the specified business network card does not exist', () => {
            return cardStore.delete('charlie1@bond-network')
                .should.be.rejectedWith(/The business network card.*does not exist/);
        });

    });

    describe('#has', () => {

        it('should return true if the specified business network card exists', () => {
            return cardStore.has('alice1@bond-network').then((result)=>{
                should.equal(true,result);
            });

        });

        it('should throw an error if the specified business network card does not exist', () => {
            return cardStore.has('charlie1@bond-network').then((result)=>{
                should.equal(false,result);
            });
        });

    });

});

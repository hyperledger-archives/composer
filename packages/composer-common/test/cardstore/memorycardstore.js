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

const MemoryCardStore = require('../../lib/cardstore/memorycardstore');
const IdCard = require('../../lib/idcard');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

describe('MemoryCardStore', () => {
    let testCard;
    let cardStore;

    beforeEach(() => {
        const metadata = { userName: 'bob'};
        const connectionProfile = { name: 'profile'};
        testCard = new IdCard(metadata, connectionProfile);
        cardStore = new MemoryCardStore();
    });

    describe('#put', () => {
        it('should put card without error', () => {
            return cardStore.put('name', testCard).should.be.fulfilled;
        });

        it('should fail for null card argument', () => {
            return cardStore.put('name', null).should.be.rejected;
        });
    });

    describe('#get', () => {
        it('should get previously stored card', () => {
            const name = 'conga';
            return cardStore.put(name, testCard).then(() => {
                return cardStore.get(name);
            }).should.become(testCard);
        });

        it('should throw for non-existent card', () => {
            return cardStore.get('name').should.be.rejected;
        });
    });

    describe('#getAll', () => {
        it('should return empty Map for empty store', () => {
            return cardStore.getAll().should.become(new Map());
        });

        it('should return previously stored cards', () => {
            const name = 'conga';
            return cardStore.put(name, testCard).then(() => {
                return cardStore.getAll();
            }).then(result => {
                result.should.be.a('Map');
                result.size.should.equal(1);
                result.get(name).should.equal(testCard);
            });
        });
    });

    describe('#delete', () => {
        it('should return false for non-existent card', () => {
            return cardStore.delete('pengiun').should.become(false);
        });

        it('should return true for existing card', () => {
            const name = 'conga';
            return cardStore.put(name, testCard).then(() => {
                return cardStore.delete(name);
            }).should.become(true);
        });

        it('should delete existing card', () => {
            const name = 'conga';
            return cardStore.put(name, testCard).then(() => {
                return cardStore.delete(name);
            }).then(() => {
                return cardStore.getAll();
            }).then(cardMap => {
                cardMap.size.should.equal(0);
            });
        });
    });


    describe('#has', () => {
        it('should return false for non-existent card', () => {
            return cardStore.has('pengiun').should.become(false);
        });

        it('should return true for existing card', () => {
            const name = 'conga';
            return cardStore.put(name, testCard).then(() => {
                return cardStore.has(name);
            }).should.become(true);
        });
    });

});
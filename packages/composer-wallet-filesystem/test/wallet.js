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

const chai = require('chai');
chai.should();
const expect = chai.expect;
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');
const fs = require('fs');

const CLOUD_CONFIG = require('./config');
const cloneDeep = require('lodash').cloneDeep;

const IdCard = require('composer-common').IdCard;
const minimalCard = new IdCard({ userName: 'minimal' }, { name: 'minimal' });

describe('Composer wallet implementation', function () {

    describe('Wrong Config settings', function () {

        CLOUD_CONFIG.wrongConfigs.forEach((cfg) => {
            it(`should fail to create with faulty config: \"${cfg.text}\"`, function () {
                (function () {
                    try {
                        CLOUD_CONFIG.getStore(cfg.c);
                    } catch (err){
                        throw err;
                    }
                }).should.throw(Error, cfg.text);

            });
        });

    });
    describe('Correct Config settings', function () {

        CLOUD_CONFIG.correctConfigs.forEach((cfg) => {


            describe('Simple Path', () => {
                let sandbox;
                let wallet;
                beforeEach(async () => {
                    sandbox = sinon.sandbox.create();
                    let config = cfg.c;
                    config.namePrefix = 'testing';

                    await CLOUD_CONFIG.clean();
                    wallet = CLOUD_CONFIG.getStore(config);
                });

                afterEach(() => {
                    sandbox.restore();
                    wallet = null;
                });

                describe('#listNames', async function () {
                    it('should be rejected if an error', async function () {
                        sandbox.stub(fs,'readdirSync').throws(new Error('Error'));
                        return wallet.listNames().should.be.rejectedWith(/Error/);
                    });
                    it('should return empty list for nothing present', async function () {
                        let result = await wallet.listNames();
                        return expect(result).to.be.an('array').that.is.empty;
                    });
                    it('should return correctly populated array for several elements', async function () {
                        await wallet.put('Batman-Original', 'Breathe in your fears. Face them. To conquer fear, you must become fear.');
                        await wallet.put('Batman-Reloaded', 'It\'s not who I am underneath, but what I do that defines me');

                        let result = await wallet.listNames();

                        let expected = ['Batman-Original','Batman-Reloaded'];
                        expect(result).to.be.an('array');
                        expect(result.length).to.equal(2);
                        expect(result).to.have.same.members(expected);
                    });
                });

                describe('#getAll', async function () {
                    it('should return empty map for nothing present', async function () {
                        let result = await wallet.getAll();
                        expect(result).to.be.an('map');
                        expect(result.size).to.equal(0);
                    });
                    it('should return correctly populated map for several elements', async function () {
                        await wallet.put('Batman-Original', 'Breathe in your fears. Face them. To conquer fear, you must become fear.');
                        await wallet.put('Batman-Reloaded', 'It\'s not who I am underneath, but what I do that defines me');

                        let result = await wallet.getAll();
                        expect(result).to.be.an('map');
                        expect(result.size).to.equal(2);
                        expect(result.get('Batman-Original')).to.equal('Breathe in your fears. Face them. To conquer fear, you must become fear.');
                        expect(result.get('Batman-Reloaded')).to.equal('It\'s not who I am underneath, but what I do that defines me');
                    });
                });

                describe('#get', async function () {
                    it('should return reject for nothing present', async function () {
                        return wallet.get('nonexistant').should.eventually.be.rejectedWith(CLOUD_CONFIG.messages.GET_NON_EXISTANT);

                    });
                    it('should return correct error for missing key name', async function () {
                        return wallet.get().should.eventually.be.rejectedWith(CLOUD_CONFIG.messages.GET_INVALID_NAME);
                    });
                });

                describe('#contains', async function () {
                    it('should return correct error for missing key name', async function () {
                        return wallet.contains().should.eventually.be.rejectedWith(/Name must be specified/);
                    });

                    it('should return false for nothing present', async function () {
                        return wallet.contains('nonexistant').should.eventually.be.false;
                    });

                    it('should return false for nothing present', async function () {
                        await wallet.put('IExist', 'I think therefore I\'ve got a headache');
                        return wallet.contains('IExist').should.eventually.be.true;
                    });
                });

                describe('#remove', async function () {
                    it('should return correct error for missing key name', async function () {
                        return wallet.remove().should.eventually.be.rejectedWith(/Name must be specified/);
                    });

                    it('should return without error for those that don\'t exist', async function () {
                        return wallet.remove('nonexistant').should.eventually.be.fulfilled;
                    });

                    it('should return false for nothing present', async function () {
                        await wallet.put('IExist', 'I think therefore I\'ve got a headache');
                        await wallet.remove('IExist');
                        return wallet.contains('IExist').should.eventually.be.false;
                    });
                    it('should put a string and get it back', async function () {
                        await wallet.put('Batman',await minimalCard.toArchive(), minimalCard);
                        await wallet.remove('Batman');
                        return wallet.contains('Batman').should.eventually.be.false;
                    });
                });

                describe('#put', async function () {
                    it('should return correct error for missing key name', async function () {
                        return wallet.put().should.eventually.be.rejectedWith(/Name must be specified/);
                    });

                    it('should put a string and get it back', async function () {
                        await wallet.put('Batman', 'Breathe in your fears. Face them. To conquer fear, you must become fear.');
                        let result = await wallet.get('Batman');
                        return expect(result).to.equal('Breathe in your fears. Face them. To conquer fear, you must become fear.');
                    });


                    it('should put a IdCard and get it back', async function () {
                        await wallet.put('Batman',await minimalCard.toArchive(), minimalCard);
                        let result = await wallet.get('Batman');
                        return expect(await IdCard.fromArchive(result)).to.deep.equal(minimalCard);
                    });

                    it('should put twice with second overwriting', async function () {
                        await wallet.put('Batman', 'Breathe in your fears. Face them. To conquer fear, you must become fear.');
                        await wallet.put('Batman', 'It\'s not who I am underneath, but what I do that defines me');
                        let result = await wallet.get('Batman');
                        return expect(result).to.equal('It\'s not who I am underneath, but what I do that defines me');
                    });

                    it('should put a Buffer and get it back', async function () {
                        // Creates a Buffer containing [0x1, 0x2, 0x3].
                        const buffer = Buffer.from([1, 2, 3]);
                        await wallet.put('Batman', buffer);
                        let result = await wallet.get('Batman');
                        expect(result).to.deep.equal(buffer);
                    });
                    it('should put a Buffer and get it back', async function () {
                        // Creates a Buffer containing [0x1, 0x2, 0x3].
                        const buffer = Buffer.from([1, 2, 3]);
                        const buffer2 = Buffer.from([4, 5, 6]);
                        await wallet.put('Batman', buffer);
                        await wallet.put('Batman', buffer2);
                        let result = await wallet.get('Batman');
                        expect(result).to.deep.equal(buffer2);
                    });
                    it('should reject other types', async function () {
                        let Umbrella = class Umbrella { };
                        return wallet.put('ThePenguin', new Umbrella()).should.be.rejectedWith('Unkown type being stored');
                    });

                    it('should return error if unable to write to the filesystem (for string values)', async function(){
                        sandbox.stub(fs,'writeFile').callsArgWith(2,new Error('Alfred says no'));
                        return wallet.put('Batman','I only work in black and sometimes very, very dark grey.').should.be.rejectedWith('Alfred says no');
                    });

                    it('should return error if unable to write to the filesystem (for buffer values)', async function () {
                        sandbox.stub(fs,'writeFile').callsArgWith(2,new Error('Alfred says no'));
                        // Creates a Buffer containing [0x1, 0x2, 0x3].
                        const buffer = Buffer.from([1, 2, 3]);
                        return wallet.put('Batman', buffer).should.be.rejectedWith('Alfred says no');
                    });
                });
            });

            describe('Two Concurrent Wallets Path', () => {
                let sandbox;
                let walletAlpha;
                let walletBeta;
                beforeEach(async () => {
                    await CLOUD_CONFIG.clean();
                    sandbox = sinon.sandbox.create();
                    let configAlpha = cloneDeep(cfg);
                    configAlpha.namePrefix = 'alpha';
                    let configBeta = cloneDeep(cfg);
                    configBeta.namePrefix = 'beta';

                    walletAlpha = CLOUD_CONFIG.getStore(configAlpha);
                    walletBeta = CLOUD_CONFIG.getStore(configBeta);
                });

                afterEach(() => {
                    sandbox.restore();
                    walletAlpha = null;
                    walletBeta = null;
                });

                it('should be able to put the same key in both without cross-contamination', async () => {
                    await walletAlpha.put('Batman', 'Breathe in your fears. Face them. To conquer fear, you must become fear.');
                    await walletBeta.put('Batman', 'It\'s not who I am underneath, but what I do that defines me');
                    let resultA = await walletAlpha.get('Batman');
                    expect(resultA).to.equal('Breathe in your fears. Face them. To conquer fear, you must become fear.');
                    let resultB = await walletBeta.get('Batman');
                    expect(resultB).to.equal('It\'s not who I am underneath, but what I do that defines me');
                });
            });
        });

    });
});

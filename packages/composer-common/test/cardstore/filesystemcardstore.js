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

const fs = require('fs');
const os = require('os');
const path = require('path');
const rimraf = require('rimraf');
const thenifyAll = require('thenify-all');
const FileSystemCardStore = require('../../lib/cardstore/filesystemcardstore');
const IdCard = require('../../lib/idcard');

const thenifyFs = thenifyAll(fs);
const thenifyRimraf = thenifyAll(rimraf);

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
const sinon = require('sinon');

describe('FileSystemCardStore', function() {
    const testStorePath = path.resolve(__dirname, '../data/card-store');

    describe('#constructor', function() {
        it('should have a default file system implementation', function() {
            const cardStore = new FileSystemCardStore();
            cardStore.fs.should.exist;
        });

        it('should use a file system implementation provided', function() {
            const fsMock = sinon.mock(fs);
            const options = { fs: fsMock };
            const cardStore = new FileSystemCardStore(options);
            cardStore.fs.should.equal(fsMock);
        });

        it('should allow store location to be provided', function() {
            const options = { storePath: testStorePath };
            const cardStore = new FileSystemCardStore(options);
            cardStore.storePath.should.equal(testStorePath);
        });

        it('should have a default store location', function() {
            const cardStore = new FileSystemCardStore();
            cardStore.storePath.should.be.a('String').that.is.not.empty;
        });
    });

    describe('#get', function() {
        it('should get a valid identity card', function() {
            const options = { storePath: testStorePath };
            const cardStore = new FileSystemCardStore(options);
            return cardStore.get('valid')
                .should.eventually.be.an.instanceof(IdCard);
        });

        it('should throw on an invalid identity card', function() {
            const cardName = 'INVALID_CARD_NAME';
            const options = { storePath: testStorePath };
            const cardStore = new FileSystemCardStore(options);
            return cardStore.get(cardName)
                .should.be.rejectedWith(cardName);
        });
    });

    describe('#put', function() {
        let tmpStorePath;
        let minimalCard;
        let credentialsCard;
        let cardStore;

        beforeEach(function() {
            const minimalMetadata = { userName: 'conga' };
            const minimalConnectionProfile = { name: 'hlfv1' };
            minimalCard = new IdCard(minimalMetadata, minimalConnectionProfile);
            credentialsCard = new IdCard(minimalMetadata, minimalConnectionProfile);
            credentialsCard.setCredentials({ certificate: 'cert', privateKey: 'key' });

            return thenifyFs.mkdtemp(path.join(os.tmpdir(), 'composer-test-cards-')).then(path => {
                tmpStorePath = path;
                const options = { storePath: tmpStorePath };
                cardStore = new FileSystemCardStore(options);
            });
        });

        afterEach(function() {
            const rimrafOptions = { disableGlob: true };
            return thenifyRimraf(tmpStorePath, rimrafOptions);
        });

        it('should put a minimal identity card', function() {
            const cardName = 'minimal';
            return cardStore.put(cardName, minimalCard).then(() => {
                return cardStore.get(cardName);
            }).should.eventually.be.an.instanceof(IdCard).that.deep.equals(minimalCard);
        });

        it('should throw on empty card name', function() {
            return cardStore.put('', minimalCard).should.be.rejectedWith(/Invalid card name/);
        });

        it('should throw on put error due to write permissions', function() {
            const cardName = 'conga';
            return thenifyFs.chmod(tmpStorePath, 0o000).then(() => {
                return cardStore.put(cardName, minimalCard);
            }).should.be.rejectedWith(cardName);
        });

        it('should handle @ character in card name', function() {
            const cardName = 'conga@hyperledger';
            return cardStore.put(cardName, minimalCard).then(() => {
                return cardStore.get(cardName);
            }).should.eventually.be.an.instanceof(IdCard).that.deep.equals(minimalCard);

        });

        it('should replace (not only overwrite) existing card', function() {
            const cardName = 'conga';
            return cardStore.put(cardName, credentialsCard).then(() => {
                return cardStore.put(cardName, minimalCard);
            }).then(() => {
                return cardStore.get(cardName);
            }).should.eventually.be.an.instanceof(IdCard).that.deep.equals(minimalCard);
        });
    });

    describe('#getAll', function() {
        it('should get all cards when cards exist', function() {
            const options = { storePath: testStorePath };
            const cardStore = new FileSystemCardStore(options);
            return cardStore.getAll().then(result => {
                result.should.be.a('Map');
                result.size.should.equal(1);
                result.get('valid').should.be.an.instanceof(IdCard);
            });
        });

        it('should get all cards when store directory does not exist', function() {
            const options = { storePath: path.join(testStorePath, 'NON_EXISTENT_CARD_STORE') };
            const cardStore = new FileSystemCardStore(options);
            return cardStore.getAll().should.eventually.be.a('Map').that.is.empty;
        });
    });

    describe('#delete', function() {
        let tmpStorePath;
        let cardStore;

        const createDummyCard = (cardName) => {
            const cardPath = path.join(tmpStorePath, cardName);
            return thenifyFs.mkdir(cardPath).then(() => {
                const dummyFilePath = path.join(cardPath, 'dummyFile');
                const dummyFileContent = 'This is an empty file';
                return thenifyFs.writeFile(dummyFilePath, dummyFileContent);
            }).then(() => {
                return cardPath;
            });
        };

        beforeEach(function() {
            return thenifyFs.mkdtemp(path.join(os.tmpdir(), 'composer-test-cards-')).then(path => {
                tmpStorePath = path;
                const options = { storePath: tmpStorePath };
                cardStore = new FileSystemCardStore(options);
            });
        });

        afterEach(function() {
            const rimrafOptions = { disableGlob: true };
            return thenifyRimraf(tmpStorePath, rimrafOptions);
        });

        it('should return false for non-existent card', () => {
            return cardStore.delete('pengiun').should.become(false);
        });

        it('should return true for existing card', () => {
            const cardName = 'conga';
            return createDummyCard(cardName).then(() => {
                return cardStore.delete(cardName);
            }).should.become(true);
        });

        it('should delete an existing card', function() {
            const cardName = 'conga';
            let cardPath;
            return createDummyCard(cardName).then((path) => {
                cardPath = path;
                return cardStore.delete(cardName);
            }).then(() => {
                return thenifyFs.access(cardPath);
            }).should.be.rejected;
        });
    });

    describe('#has', function() {
        let tmpStorePath;
        let cardStore;

        const createDummyCard = (cardName) => {
            const cardPath = path.join(tmpStorePath, cardName);
            return thenifyFs.mkdir(cardPath).then(() => {
                const dummyFilePath = path.join(cardPath, 'dummyFile');
                const dummyFileContent = 'This is an empty file';
                return thenifyFs.writeFile(dummyFilePath, dummyFileContent);
            }).then(() => {
                return cardPath;
            });
        };

        beforeEach(function() {
            return thenifyFs.mkdtemp(path.join(os.tmpdir(), 'composer-test-cards-')).then(path => {
                tmpStorePath = path;
                const options = { storePath: tmpStorePath };
                cardStore = new FileSystemCardStore(options);
            });
        });

        afterEach(function() {
            const rimrafOptions = { disableGlob: true };
            return thenifyRimraf(tmpStorePath, rimrafOptions);
        });

        it('should return false for non-existent card', () => {
            return cardStore.has('pengiun').should.become(false);
        });

        it('should return true for existing card', () => {
            const cardName = 'conga';
            return createDummyCard(cardName).then(() => {
                return cardStore.has(cardName);
            }).should.become(true);
        });

    });
});

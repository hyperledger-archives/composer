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
const IdCard = require('../lib/idcard');
const JSZip = require('jszip');
const path = require('path');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));

const readIdCardAsync = function(idCardName) {
    const zip = new JSZip();
    const cardDirectory = __dirname + '/data/id-cards/' + idCardName;
    const cardRootIndex = cardDirectory.length + 1;
    const visitor = new DirectoryVisitor(cardDirectory, (filename) => {
        const relativeFilename = filename.slice(cardRootIndex);
        const fileData = fs.readFileSync(filename);
        zip.file(relativeFilename, fileData);
    });
    visitor.visit();
    return zip.generateAsync({ type: 'nodebuffer' });
};

/**
 * Helper class that recursively walks a given directory and invoking a callback for each file.
 */
class DirectoryVisitor {
    /**
     * Constructor.
     * @param {String} dirname - directory name.
     * @param {Function} callback - callback function with filename parameter.
     */
    constructor(dirname, callback) {
        this.dirname = dirname;
        this.callback = callback;
    }

    /**
     * Walk the directory structure, invoking the callback for each file.
     */
    visit() {
        fs.readdirSync(this.dirname).forEach(filename => this.visitDirectoryEntry(filename));
    }

    /**
     * Handle a directory entry.
     * @param {String} entryName - directory entry name; either a file or sub-directory.
     */
    visitDirectoryEntry(entryName) {
        const entryPath = path.resolve(this.dirname, entryName);
        const stat = fs.statSync(entryPath);
        if (stat.isDirectory()) {
            const subDirVisitor = new DirectoryVisitor(entryPath, this.callback);
            subDirVisitor.visit();
        } else {
            this.callback(entryPath);
        }
    }
}

describe('IdCard', function() {
    let minimalMetadata;
    let minimalConnectionProfile;
    let emptyCredentials;
    let validCredentials;
    let minimalCard;
    let credentialsCard;

    beforeEach(function() {
        minimalMetadata = { userName: 'minimal' };
        minimalConnectionProfile = { name: 'minimal' };

        emptyCredentials = { };
        validCredentials = {
            certificate: 'public-key-data',
            privateKey: 'private-key-data'
        };

        minimalCard = new IdCard(minimalMetadata, minimalConnectionProfile);
        credentialsCard = new IdCard(minimalMetadata, minimalConnectionProfile);
        credentialsCard.setCredentials(validCredentials);
    });

    describe('#constructor', function() {
        it('should reject newer card versions', function() {
            const metadata = minimalCard.metadata;
            metadata.version++;
            should.throw(() => {
                new IdCard(metadata, minimalConnectionProfile);
            }, new RegExp(metadata.version.toString(10)));
        });
    });

    describe('#fromArchive', function() {
        it('should load a minimal card file without error', function() {
            return readIdCardAsync('minimal').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                card.should.be.an.instanceof(IdCard);
            });
        });

        it('should throw error on missing connection.json', function() {
            return readIdCardAsync('missing-connection').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).should.be.rejectedWith(/connection.json/);
        });

        it('should throw error on missing name field in connection.json', function() {
            return readIdCardAsync('missing-connection-name').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).should.be.rejectedWith(/name/);
        });

        it('should throw error on missing metadata.json', function() {
            return readIdCardAsync('missing-metadata').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).should.be.rejectedWith(/metadata.json/);
        });

        it('should throw error on missing userName field in metadata', function() {
            return readIdCardAsync('missing-metadata-username').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).should.be.rejectedWith(/userName/);
        });

        it('should load userName', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                card.getUserName().should.equal('conga');
            });
        });

        it('should load description', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                card.getDescription().should.equal('A valid ID card');
            });
        });

        it('should load business network name', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                card.getBusinessNetworkName().should.equal('org-acme-biznet');
            });
        });

        it('should return empty string if no business network name defined', function() {
            return readIdCardAsync('minimal').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                card.getBusinessNetworkName().should.be.a('String').that.is.empty;
            });
        });

        it('should return empty string if no description defined', function() {
            return readIdCardAsync('minimal').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                card.getDescription().should.be.a('String').that.is.empty;
            });
        });

        it('should load connection profile', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                card.getConnectionProfile().should.be.an('Object').that.includes({ name: 'hlfv1' });
            });
        });

        it('should load credentials', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                const credentials = card.getCredentials();
                credentials.certificate.should.include('-----BEGIN CERTIFICATE-----');
                credentials.privateKey.should.include('-----BEGIN PRIVATE KEY-----');
            });
        });

        it('should return empty credentials if none defined', function() {
            return readIdCardAsync('minimal').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                const credentials = card.getCredentials();
                Object.keys(credentials).should.be.empty;
            });
        });

        it('should load enrollment credentials', function() {
            return readIdCardAsync('valid-with-enrollment').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                const credentials = card.getEnrollmentCredentials();
                credentials.should.deep.equal({ secret: 'super-secret-passphrase' });
            });
        });

        it('should return no enrollment credentials if none defined', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                should.not.exist(card.getEnrollmentCredentials());
            });
        });

        it('should load roles', function() {
            return readIdCardAsync('valid-with-roles').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                const roles = card.getRoles();
                roles.should.have.members(['PeerAdmin', 'ChannelAdmin', 'Issuer']);
            });
        });

        it('should return empty roles if none defined', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                const roles = card.getRoles();
                roles.should.be.empty;
            });
        });

        it('should migrate a version 0 card', function() {
            return readIdCardAsync('valid-v0').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then(card => {
                card.getUserName().should.equal('conga');
                should.not.exist(card.metadata.name);
                should.not.exist(card.metadata.enrollmentId);
            });
        });
    });

    describe('#toArchive', function() {
        it('should export a valid minimal ID card', function() {
            return minimalCard.toArchive().then(cardArchive => {
                return IdCard.fromArchive(cardArchive);
            }).then(card => {
                card.should.deep.equal(minimalCard);
            });
        });

        it('should export credentials', function() {
            return credentialsCard.toArchive().then(cardArchive => {
                return IdCard.fromArchive(cardArchive);
            }).then(card => {
                card.getCredentials().should.deep.equal(validCredentials);
            });
        });

        it('should export to an ArrayBuffer by default', function() {
            return minimalCard.toArchive().then(cardArchive => {
                cardArchive.should.be.an.instanceof(ArrayBuffer);
            });
        });

        it('should export to a Node Buffer if requested', function() {
            const options = { type: 'nodebuffer' };
            return minimalCard.toArchive(options).then(cardArchive => {
                cardArchive.should.be.an.instanceof(Buffer);
            });
        });
    });

    describe('#setCredentials', function() {
        it('should set valid credentials', function() {
            minimalCard.setCredentials(validCredentials);
            minimalCard.getCredentials().should.deep.equal(validCredentials);
        });

        it('should treat null argument as empty credentials', function() {
            minimalCard.setCredentials(null);
            minimalCard.getCredentials().should.deep.equal(emptyCredentials);
        });
    });

});
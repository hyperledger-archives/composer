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

const should = require('chai').should();

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
    describe('#fromArchive', function() {
        it('should load a minimal card file without error', function() {
            return readIdCardAsync('minimal').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then((card) => {
                card.should.be.an.instanceof(IdCard);
            });
        });

        it('should throw error on missing connection.json', function() {
            return readIdCardAsync('missing-connection').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer).then(function resolved(card) {
                    throw Error('Card loaded without error');
                }, function rejected(error) {
                    error.message.should.include('connection.json');
                });
            });
        });

        it('should throw error on missing metadata.json', function() {
            return readIdCardAsync('missing-metadata').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer).then(function resolved(card) {
                    throw Error('Card loaded without error');
                }, function rejected(error) {
                    error.message.should.include('metadata.json');
                });
            });
        });

        it('should throw error on missing name field in metadata', function() {
            return readIdCardAsync('missing-metadata-name').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer).then(function resolved(card) {
                    throw Error('Card loaded without error');
                }, function rejected(error) {
                    error.message.should.include('name');
                });
            });
        });

        it('should throw error on invalid image field in metadata', function() {
            return readIdCardAsync('invalid-metadata-image').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer).then(function resolved(card) {
                    throw Error('Card loaded without error');
                }, function rejected(error) {
                    error.message.should.include('NON_EXISTENT_IMAGE_FILENAME');
                });
            });
        });

        it('should load all metadata', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then((card) => {
                card.getName().should.equal('com.example.cards.Dan');
                card.getDescription().should.equal('Dan\'s Card for Production Network');
                card.getBusinessNetwork().should.equal('org-acme-biznet');
                card.getImage().should.exist;
            });
        });

        it('should load connection details', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then((card) => {
                card.getConnection().should.be.an('Object');
            });
        });

        it('should load an image named in metadata.json', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then((card) => {
                const image = card.getImage();
                image.name.should.be.a('String');
                image.data.should.be.an.instanceof(Buffer);
            });
        });

        it('should refer to an image by short filename', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then((card) => {
                const image = card.getImage();
                image.name.should.equal('conga.png');
            });
        });

        it('should have an undefined image field if no image specified in metadata.json', function() {
            return readIdCardAsync('minimal').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then((card) => {
                should.equal(card.getImage(), undefined);
            });
        });

        it('should load credentials', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then((card) => {
                const credentials = card.getCredentials();
                credentials.should.be.an.instanceof(Map);
                credentials.size.should.equal(6);
                credentials.get('PeerAdmin').should.be.an.instanceof(Buffer);
            });
        });

        it('should load tlscerts', function() {
            return readIdCardAsync('valid').then((readBuffer) => {
                return IdCard.fromArchive(readBuffer);
            }).then((card) => {
                const tlscerts = card.getTlsCertificates();
                tlscerts.should.be.an.instanceof(Map);
                tlscerts.size.should.equal(3);
                tlscerts.get('ca.crt').should.be.an.instanceof(Buffer);
            });
        });

    });
});

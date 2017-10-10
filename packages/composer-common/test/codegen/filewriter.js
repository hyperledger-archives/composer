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
const should = chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');

const FileWriter = require('../../lib/codegen/filewriter');

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const Writer = require('../../lib/codegen/writer');

describe('ClassUndertest', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', function () {
        it('main code path', function () {
            let syncStub = sandbox.stub(mkdirp, 'sync');
            syncStub.returns();

            let fileWriter = new FileWriter('dir');
            should.exist(fileWriter);
            // sinon.assert.exists(fileWriter);
            sinon.assert.calledOnce(syncStub);
            sinon.assert.calledWith(syncStub, 'dir');

        });
    });

    describe('#openFile', function () {
        it('main code path', function () {

            let fileWriter = new FileWriter('dir');
            should.exist(fileWriter);
            fileWriter.openFile('filename');
            fileWriter.fileName.should.equal('filename');
            should.not.exist(fileWriter.relativeDir);
        });
    });

    describe('#openRelativeFile', function () {
        it('main code path', function () {
            let fileWriter = new FileWriter('dir');
            should.exist(fileWriter);
            fileWriter.openRelativeFile('relativeDir', 'filename');
            fileWriter.fileName.should.equal('filename');
            fileWriter.relativeDir.should.equal('relativeDir');
        });
    });

    describe('#writeLine', function () {
        it('file not opened error code path', function () {
            let stub = sandbox.stub(Writer, 'writeLine');
            stub.returns();
            let fileWriter = new FileWriter('dir');
            should.exist(fileWriter);
            (() => {
                fileWriter.writeLine('tabs', 'text');
            }).should.throws(/not been opened/);

        });

        it('main code path', function () {
            let stub = sandbox.stub(Writer.prototype, 'writeLine');
            stub.returns();
            let fileWriter = new FileWriter('dir');
            fileWriter.fileName='filename';
            should.exist(fileWriter);

            fileWriter.writeLine('tabs', 'text');

            sinon.assert.calledWith(stub,'tabs','text');
        });
    });

    describe('#writeBeforeLine', function () {
        it('file not opened error code path', function () {
            let stub = sandbox.stub(Writer, 'writeBeforeLine');
            stub.returns();
            let fileWriter = new FileWriter('dir');
            should.exist(fileWriter);
            (() => {
                fileWriter.writeBeforeLine('tabs', 'text');
            }).should.throws(/not been opened/);
        });

        it('main code path', function () {
            let stub = sandbox.stub(Writer.prototype, 'writeBeforeLine');
            stub.returns();
            let fileWriter = new FileWriter('dir');
            fileWriter.fileName='filename';
            should.exist(fileWriter);

            fileWriter.writeBeforeLine('tabs', 'text');

            sinon.assert.calledWith(stub,'tabs','text');
        });
    });

    describe('#closeFile', function () {
        it('file not opened error code path', function () {
            let fileWriter = new FileWriter('dir');
            should.exist(fileWriter);
            (() => {
                fileWriter.closeFile();
            }).should.throws(/No file open/);
        });

        it('main code path', function () {
            let pathResolveStub = sandbox.stub(path, 'resolve');
            pathResolveStub.returns('resolvedpath');

            let pathdirnameStub = sandbox.stub(path, 'dirname');
            pathdirnameStub.returns();

            let fsWriteFileSyncStub = sandbox.stub(fs, 'writeFileSync');
            fsWriteFileSyncStub.returns();

            let syncStub = sandbox.stub(mkdirp, 'sync');
            syncStub.returns();

            let superClearBuffer = sandbox.stub(Writer.prototype, 'clearBuffer');
            superClearBuffer.returns();

            let superGetBuffer =  sandbox.stub(Writer.prototype, 'getBuffer');
            superGetBuffer.returns([0,1,2,3]);

            // ---
            let fileWriter = new FileWriter('dir');
            should.exist(fileWriter);
            fileWriter.fileName='filename';
            fileWriter.outputDirectory='outputDir';

            fileWriter.closeFile();

            sinon.assert.calledOnce(pathResolveStub);
            sinon.assert.calledWith(pathResolveStub,'outputDir','filename');
            sinon.assert.calledOnce(pathdirnameStub);
            sinon.assert.calledWith(pathdirnameStub,'resolvedpath');
            sinon.assert.calledOnce(fsWriteFileSyncStub);
            sinon.assert.calledWith(fsWriteFileSyncStub,'resolvedpath',[0,1,2,3]);
            sinon.assert.calledTwice(syncStub);
            sinon.assert.calledOnce(superClearBuffer);


        });
        it('main code path - relativedir', function () {
            let pathResolveStub = sandbox.stub(path, 'resolve');
            pathResolveStub.returns('resolvedpath');

            let pathdirnameStub = sandbox.stub(path, 'dirname');
            pathdirnameStub.returns();

            let fsWriteFileSyncStub = sandbox.stub(fs, 'writeFileSync');
            fsWriteFileSyncStub.returns();

            let syncStub = sandbox.stub(mkdirp, 'sync');
            syncStub.returns();

            let superClearBuffer = sandbox.stub(Writer.prototype, 'clearBuffer');
            superClearBuffer.returns();

            let superGetBuffer =  sandbox.stub(Writer.prototype, 'getBuffer');
            superGetBuffer.returns([0,1,2,3]);

            // ---
            let fileWriter = new FileWriter('dir');
            should.exist(fileWriter);
            fileWriter.fileName='filename';
            fileWriter.outputDirectory='outputDir';
            fileWriter.relativeDir = 'relativeDir';

            fileWriter.closeFile();

            sinon.assert.calledTwice(pathResolveStub);
            sinon.assert.calledWith(pathResolveStub,'outputDir','relativeDir');
            sinon.assert.calledWith(pathResolveStub,'resolvedpath','filename');
            sinon.assert.calledOnce(pathdirnameStub);
            sinon.assert.calledWith(pathdirnameStub,'resolvedpath');
            sinon.assert.calledOnce(fsWriteFileSyncStub);
            sinon.assert.calledWith(fsWriteFileSyncStub,'resolvedpath',[0,1,2,3]);
            sinon.assert.calledTwice(syncStub);
            sinon.assert.calledOnce(superClearBuffer);


        });
    });
});
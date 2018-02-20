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

const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
const path = require('path');

const yargs = require('yargs');
const mockery = require('mockery');

describe('PlantUmlToImage', () => {

    let sandbox;
    let fsextraStubs = {};
    let statsStub = {};
    let consoleErrorStub;
    let processExitStub;
    let pathStub;
    let pipeSpy;

    beforeEach(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });


        sandbox = sinon.sandbox.create();
        // setup the stubs for handling yargs and the process exit
        sandbox.stub(yargs, 'options').returns(yargs(['--inputDir=path/to/dir', '--outputDir=path/to/output', '--format=svg']));
        sandbox.stub(yargs, 'usage').returns(yargs);
        sandbox.stub(yargs, 'argv').returns();
        processExitStub = sandbox.stub(process, 'exit');

        // Use Mockery to great effect to clean out the fs-extra and the plantuml
        // Allows greater control of what they need to fake


        // make a fake object that mockery will use, and provide it with sinon stubs
        fsextraStubs.readdir = sandbox.stub();
        fsextraStubs.ensureFileSync = sandbox.stub();
        fsextraStubs.statSync = sandbox.stub();
        fsextraStubs.createWriteStream = sandbox.stub();

        statsStub = { isDirectory: sandbox.stub(), isFile: sandbox.stub() };
        fsextraStubs.statSync.returns(statsStub);

        mockery.registerMock('fs-extra', fsextraStubs);

        pipeSpy = sinon.spy();

        // also crreate fake version of plantumkl
        mockery.registerMock('node-plantuml', {
            generate: function () {
                return { out: { pipe: pipeSpy } };
            }
        });

        pathStub = sandbox.stub(path, 'parse');

        // and get console to shutup
        consoleErrorStub = sandbox.stub(console,'error');
    });

    afterEach(() => {
        mockery.deregisterAll();
        sandbox.restore();
    });

    it('Should set up yargs correctly and log an error in the console if directory cannot be read', () => {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        // trigger the callback for the list of files
        fsextraStubs.readdir.yield('Directory cannot be read', []);

        consoleErrorStub.should.have.been.calledWith('Could not list the directory.', 'Directory cannot be read');
        processExitStub.should.have.been.calledWith(1);
    });

    it('Should set up yargs correctly and not call other functions if elements are not a directory or file', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        statsStub.isFile.returns(false);
        statsStub.isDirectory.returns(false);

        // trigger the callback for the list of files
        fsextraStubs.readdir.yield(null, ['dir1', 'dir2']);

        fsextraStubs.readdir.should.have.been.calledOnce;
    });

    it('Should set up yargs correctly and call processDirectory with each sub-directory', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        statsStub.isDirectory.returns(true);

        // trigger the callback for the list of files
        fsextraStubs.readdir.yield(null, ['dir1', 'dir2']);

        fsextraStubs.readdir.should.have.been.calledThrice;
        fsextraStubs.readdir.getCall(1).args[0].should.include('path/to/dir/dir1');
        fsextraStubs.readdir.getCall(2).args[0].should.include('path/to/dir/dir2');
    });

    it('Should set up yargs correctly and call the processFile with each found file and do action when uml', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        statsStub.isFile.returns(true);

        pathStub.callsFake((filepath) => {
            return {
                name: filepath.split('/').slice(-1),
                ext: '.uml'
            };
        });

        // trigger the callback with the list of files
        fsextraStubs.readdir.yield(null, ['file1.uml', 'file2.uml']);

        pathStub.should.have.been.calledTwice;
        pathStub.getCall(0).args.should.include('path/to/dir/file1.uml');
        pathStub.getCall(1).args.should.include('path/to/dir/file2.uml');

        fsextraStubs.ensureFileSync.should.have.been.calledTwice;
        fsextraStubs.ensureFileSync.getCall(0).args[0].should.deep.equal('path/to/output/file1.uml.svg');
        fsextraStubs.ensureFileSync.getCall(1).args[0].should.deep.equal('path/to/output/file2.uml.svg');

        fsextraStubs.createWriteStream.should.have.been.calledTwice;
        fsextraStubs.createWriteStream.getCall(0).args[0].should.deep.equal('path/to/output/file1.uml.svg');
        fsextraStubs.createWriteStream.getCall(1).args[0].should.deep.equal('path/to/output/file2.uml.svg');

        pipeSpy.should.have.been.calledTwice;
    });

    it('Should set up yargs correctly and call the processFile with each found file and not do action when not uml', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        statsStub.isFile.returns(true);

        pathStub.callsFake((filepath) => {
            return {
                name: filepath.split('/').slice(-1),
                ext: '.txt'
            };
        });

        // trigger the callback with the list of files
        fsextraStubs.readdir.yield(null, ['file1.txt', 'file2.txt']);
        pathStub.should.have.been.calledTwice;
        pathStub.getCall(0).args.should.include('path/to/dir/file1.txt');
        pathStub.getCall(1).args.should.include('path/to/dir/file2.txt');

        pipeSpy.should.not.have.been.called;
    });
});

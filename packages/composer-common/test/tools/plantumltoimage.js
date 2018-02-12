'use strict';

require('chai').should();
const sinon = require('sinon');

const proxyquire = require('proxyquire');
const program = require('commander');
const plantuml = require('node-plantuml');
const fs = require('fs-extra');
const path = require('path');

describe('PlantUMLtoImage', () => {

    let sandbox;
    let mockProgram = sinon.stub(program);
    mockProgram.version.returns(mockProgram);
    mockProgram.description.returns(mockProgram);
    mockProgram.usage.returns(mockProgram);
    mockProgram.option.returns(mockProgram);
    mockProgram.parse.returns(mockProgram);
    mockProgram.format = 'uml';
    mockProgram.inputDir = '/path/to/directory';
    mockProgram.outputDir = '/path/to/output';

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    it('should throw an error if directory cannot be read', () => {
        sandbox.stub(fs, 'readdir').callsFake((path, callback) => {
            callback(`Error ${path} does not exist`, []);
        });
        const consoleStub = sinon.spy(console, 'error');
        const exitStub = sandbox.stub(process, 'exit');

        proxyquire('../../lib/tools/plantumltoimage', { 'commander': mockProgram});

        consoleStub.should.have.been.calledWith('Could not list the directory.', 'Error /path/to/directory does not exist');
        exitStub.should.have.been.calledWith(1);
    });

    it('should call processDirectory for each directory in the directory', () => {
        const readdirStub = sandbox.stub(fs, 'readdir').callsFake((path, callback) => {
            switch(path) {
            case '/path/to/directory': callback(null, ['a', 'b']); break;
            default: callback(null, []); break;
            }
        });

        sandbox.stub(fs, 'statSync').callsFake((path) => {
            return {
                isFile: () => {
                    return false;
                },
                isDirectory: () => {
                    return true;
                }
            };
        });

        proxyquire('../../lib/tools/plantumltoimage', { 'commander': mockProgram});
        readdirStub.should.have.been.calledThrice;
        readdirStub.getCall(0).args.should.include('/path/to/directory');
        readdirStub.getCall(1).args.should.include('/path/to/directory/a');
        readdirStub.getCall(2).args.should.include('/path/to/directory/b');
    });

    it('should call process file for each file in the directory', () => {
        sandbox.stub(fs, 'readdir').callsFake((path, callback) => {
            callback(null, ['a', 'b']);
        });

        sandbox.stub(fs, 'statSync').callsFake((path) => {
            return {
                isFile: () => {
                    return true;
                },
                isDirectory: () => {
                    return false;
                }
            };
        });

        let ensureFileSyncStub = sandbox.stub(fs, 'ensureFileSync').callsFake((call) => {
            return true;
        });

        const pathStub = sandbox.stub(path, 'parse').callsFake((filepath) => {
            return {
                name: filepath.split('/').slice(-1),
                ext: '.uml'
            };
        });

        const pipeSpy = sinon.spy();
        let generateStub = sandbox.stub(plantuml, 'generate').callsFake(() => {
            return {
                out: {
                    pipe: pipeSpy
                }
            };
        });

        sandbox.stub(fs, 'createWriteStream').callsFake((filepath) => {
            switch(filepath) {
            case program.outputDir + '/a.' + program.format: return 'emperor penguin';
            case program.outputDir + '/b.' + program.format: return 'king penguin';
            }
        });

        proxyquire('../../lib/tools/plantumltoimage', { 'commander': mockProgram});

        pathStub.should.have.been.calledTwice;
        pathStub.getCall(0).args.should.deep.equal(['/path/to/directory/a']);
        pathStub.getCall(1).args.should.deep.equal(['/path/to/directory/b']);

        generateStub.getCall(0).args.should.deep.equal(['/path/to/directory/a', {
            format: program.format
        }]);
        generateStub.getCall(1).args.should.deep.equal(['/path/to/directory/b', {
            format: program.format
        }]);

        ensureFileSyncStub.getCall(0).args.should.deep.equal([program.outputDir + '/a.' + program.format]);
        ensureFileSyncStub.getCall(1).args.should.deep.equal([program.outputDir + '/b.' + program.format]);

        pipeSpy.should.have.been.calledTwice;
        pipeSpy.getCall(0).args.should.deep.equal(['emperor penguin']);
        pipeSpy.getCall(1).args.should.deep.equal(['king penguin']);
    });

    it('should call process file for each file in the directory but do nothing if not uml', () => {
        sandbox.stub(fs, 'readdir').callsFake((path, callback) => {
            callback(null, ['a', 'b']);
        });

        sandbox.stub(fs, 'statSync').callsFake((path) => {
            return {
                isFile: () => {
                    return true;
                },
                isDirectory: () => {
                    return false;
                }
            };
        });

        const pathStub = sandbox.stub(path, 'parse').callsFake((filepath) => {
            return {
                name: filepath.split('/').slice(-1),
                ext: '.pingu'
            };
        });

        proxyquire('../../lib/tools/plantumltoimage', { 'commander': mockProgram});

        const generateSpy = sinon.spy(plantuml, 'generate');
        pathStub.should.have.been.calledTwice;
        generateSpy.should.not.have.been.called;
    });

    it('should call do nothing if element not directory or file', () => {
        let readdirStub = sandbox.stub(fs, 'readdir').callsFake((path, callback) => {
            callback(null, ['a', 'b']);
        });

        sandbox.stub(fs, 'statSync').callsFake((path) => {
            return {
                isFile: () => {
                    return false;
                },
                isDirectory: () => {
                    return false;
                }
            };
        });

        const pathStub = sandbox.stub(path, 'parse').callsFake((filepath) => {
            return {
                name: filepath.split('/').slice(-1),
                ext: '.pingu'
            };
        });

        proxyquire('../../lib/tools/plantumltoimage', { 'commander': mockProgram});

        pathStub.should.not.have.been.called;
        readdirStub.should.have.been.calledOnce;
    });

    afterEach(() => {
        sandbox.restore();
    });
});
=======
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

    beforeEach(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });


        sandbox = sinon.sandbox.create();
        // setup the stubs for handling yargs and the process exit
        sandbox.stub(yargs, 'options').returns(yargs);
        sandbox.stub(yargs, 'usage').returns(yargs);
        sandbox.stub(yargs, 'argv').returns();
        sandbox.stub(process, 'exit');

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

        // also crreate fake version of plantumkl
        mockery.registerMock('node-plantuml', {
            generate: function () {
                return { out: { pipe: sandbox.stub() } };
            }
        });

        // and get console to shutup
        sandbox.stub(console,'log');
        sandbox.stub(console,'error');
    });

    afterEach(() => {
        mockery.deregisterAll();
        sandbox.restore();
    });


    it('Should set up yargs correctly and call the processDirectory', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        // trigger the callback for the list of files
        fsextraStubs.readdir.yield(null, ['file1', 'file2']);
    });

    it('Should set up yargs correctly and call the processDirectory, with files', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        statsStub.isFile.returns(true);

        // trigger the callback with the list of files
        fsextraStubs.readdir.yield(null, ['file1.uml', 'file2.txt']);
    });

    it('Should set up yargs correctly and call the processDirectory, with files', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        statsStub.isDirectory.returns(true);

        // trigger the callback for the list of files
        fsextraStubs.readdir.yield(null, ['dir']);
    });

    it('Should set up yargs correctly and call the processDirectory but trigger an error', function () {
        delete require.cache[path.resolve(__dirname, '../../lib/tools/plantumltoimage.js')];
        require('../../lib/tools/plantumltoimage.js');

        // trigger the callback with an error
        fsextraStubs.readdir.yield(new Error(),[]);
    });
});
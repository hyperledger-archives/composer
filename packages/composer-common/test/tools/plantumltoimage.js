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
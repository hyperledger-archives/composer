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
const sinon = require('sinon');
const path = require('path');
const yargs = require('yargs');
const mockery = require('mockery');


chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));


// need to have this as the module cache will need to be cleared, and code reloaded per test
const pathToCode = path.resolve(__dirname, '../../lib/codegen/parsejs.js');

describe('parsejs', function () {

    let sandbox;
    let optionsStub;
    let stdout;
    let stderr;

    let parseStub;

    let fsextraStubs;
    let jsonGenerateSpy;
    let apiGenerateSpy;
    let plantGenerateSpy;

    beforeEach(() => {
        //
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        sandbox = sinon.sandbox.create();

        // stub out the yagrs cmd line handling
        optionsStub = sandbox.stub(yargs, 'options');
        sandbox.stub(yargs, 'usage').returns(yargs);
        sandbox.stub(yargs, 'argv').returns();
        sandbox.stub(process,'exit');

        // create a fake file object that will be return one fs walk
        // useing first/second call to prevent a loop
        let fakeFile = {
            stats : {
                isFile :  sandbox.stub().onFirstCall().returns(true).onSecondCall().returns(false)
            }
        };

        // setup stups for the fs-extra model
        fsextraStubs = {};
        let onStub = sandbox.stub();
        // yes it returns it self, but it's one of those chaining things
        onStub.returns({ 'on' : onStub});

        let readStub = { read : sandbox.stub().onFirstCall().returns(fakeFile)
                                              .onSecondCall().returns(fakeFile)
                                              .onThirdCall().returns(null)};

        // this handles the callback and ensure the 'this' context is correctly set
        onStub.callsArgOn(1, readStub);


        fsextraStubs.walk = sandbox.stub();
        fsextraStubs.walk.callsFake(function fakeWalk(){
            return { 'on' : onStub};
        });

        fsextraStubs.readFileSync = sandbox.stub();

        // register the mock for the file system
        mockery.registerMock('fs-extra', fsextraStubs);



        // spy on the output
        stdout = sandbox.spy(console,'log');
        stderr = sandbox.spy(console,'error');

        // register the mocks for  'path'
        parseStub = sandbox.stub(path,'parse');
        mockery.registerMock('path',  { parse:parseStub, resolve: sandbox.stub() } );


        // The next section of code, is .... not the greatest IMHO
        // This was the only way I could get the Generator classes spied on in such
        // a way that would be loaded by the test code and made to be certain
        // they where being called.

        // This creates a fake class with the generate method ( that we're interested in )
        // Spies on that generate fn, and use mockery to inject that.


        // eslint-disable-next-line require-jsdoc
        class fakeClassJson  {
            // eslint-disable-next-line require-jsdoc
            constructor(){ }
            // eslint-disable-next-line require-jsdoc
            generate(){ }
        }

        jsonGenerateSpy = sandbox.spy(fakeClassJson.prototype,'generate');
        mockery.registerMock('./fromjs/jsongenerator',fakeClassJson);

        // eslint-disable-next-line require-jsdoc
        class fakeClassAPISignature  {
            // eslint-disable-next-line require-jsdoc
            constructor(){ }
            // eslint-disable-next-line require-jsdoc
            generate(){ }
        }
        apiGenerateSpy = sandbox.spy(fakeClassAPISignature.prototype,'generate');
        mockery.registerMock('./fromjs/apisignaturegenerator',fakeClassAPISignature);

        // eslint-disable-next-line require-jsdoc
        class fakeClassPlant {
            // eslint-disable-next-line require-jsdoc
            constructor(){ }
            // eslint-disable-next-line require-jsdoc
            generate(){ }
        }
        plantGenerateSpy = sandbox.spy(fakeClassPlant.prototype,'generate');
        mockery.registerMock('./fromjs/plantumlgenerator',fakeClassPlant);


        // clean the module cache
        delete require.cache[pathToCode];

    });

    afterEach(() => {
        mockery.deregisterAll();
        sandbox.restore();
        sandbox.restore();
    });

    after(()=>{
        delete require.cache[pathToCode];
    });

    describe('#missing options', function() {
        it('should handle case where no file option is given', function() {
            optionsStub.returns(yargs(['--outputDir=/tmp','--format=json']));
            require(pathToCode);
            stdout.should.have.been.calledWith(sinon.match(/no file option given/));
        });

        it('should handle case where no outputDir  option is given', function() {
            optionsStub.returns(yargs(['--format=json']));
            require(pathToCode);
            stderr.should.have.been.calledWith(sinon.match(/Missing required argument: outputDir/));
        });
    });

    describe('#JSON',()=>{
        it('should process JSON format', function() {
            optionsStub.returns(yargs(['--outputDir=/tmp','--format=JSON','--inputDir=in']));
            parseStub.returns({ext:'.js',base:'something.js'});
            require(pathToCode);

            sinon.assert.calledOnce(jsonGenerateSpy);
        });
    });

    describe('#APISignature',()=>{
        it('should process APISignature format', function() {
            optionsStub.returns(yargs(['--outputDir=/tmp','--format=APISignature','--inputDir=in']));
            parseStub.returns({ext:'.js',base:'something.js'});
            require(pathToCode);

            sinon.assert.calledOnce(apiGenerateSpy);
        });
    });

    describe('#PlantUML',()=>{
        it('should process PlantUML format', function() {
            optionsStub.returns(yargs(['--outputDir=/tmp','--format=PlantUML','--inputDir=in']));
            parseStub.returns({ext:'.js',base:'something.js'});
            require(pathToCode);

            sinon.assert.calledOnce(plantGenerateSpy);
        });
    });

    describe('#Default',()=>{
        it('should process PlantUML as the default format', function() {
            optionsStub.returns(yargs(['--outputDir=/tmp','--inputDir=in']));
            parseStub.returns({ext:'.js',base:'something.js'});
            require(pathToCode);
            sinon.assert.calledOnce(plantGenerateSpy);
        });
        it('should process PlantUML as the default format, single file mode', function() {
            optionsStub.returns(yargs(['--outputDir=/tmp','--single=in']));
            parseStub.returns({ext:'.js',base:'something.js'});
            require(pathToCode);
            sinon.assert.calledOnce(plantGenerateSpy);
        });
        it('should cope with files that are a mix of js and non js ones', function(){
            optionsStub.returns(yargs(['--outputDir=/tmp','--inputDir=in']));
            parseStub.returns({ext:'.js',base:'something.js'});
            require(pathToCode);
            sinon.assert.calledOnce(plantGenerateSpy);
        });
        it('should not parse the parser.js file', function(){
            optionsStub.returns(yargs(['--outputDir=/tmp','--inputDir=in']));
            parseStub.returns({ext:'.js',base:'parser.js'});

            require(pathToCode);
            sinon.assert.notCalled(plantGenerateSpy);
        });
        it('should cope with files that wibble files', function(){
            optionsStub.returns(yargs(['--outputDir=/tmp','--inputDir=in']));
            parseStub.returns({ext:'.wibble',base:'parser.wibble'});

            require(pathToCode);
            sinon.assert.notCalled(plantGenerateSpy);
        });
    });

});
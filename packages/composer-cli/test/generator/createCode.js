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

const Admin = require('composer-admin');
const BusinessNetworkDefinition = Admin.BusinessNetworkDefinition;
const fs = require('fs');
const Create = require('../../lib/cmds/generator/createCodeCommand.js');
const CreateCode = require('../../lib/cmds/generator/lib/createCode.js');
const CmdUtil = require('../../lib/cmds/utils/cmdutils.js');


const CodeGen = require('composer-common').CodeGen;
const GoLangVisitor = CodeGen.GoLangVisitor;
const JSONSchemaVisitor = CodeGen.JSONSchemaVisitor;
const PlantUMLVisitor = CodeGen.PlantUMLVisitor;
const TypescriptVisitor = CodeGen.TypescriptVisitor;
const JavaVisitor = CodeGen.JavaVisitor;
const FileWriter = CodeGen.FileWriter;


require('chai').should();

const chai = require('chai');
const sinon = require('sinon');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));

let testBusinessNetworkId = 'net.biz.TestNetwork-0.0.1';
let testBusinessNetworkDescription = 'Test network description';


let mockBusinessNetworkDefinition;
let mockGoLang;
let mockPlantUML;
let mockTypescript;
let mockJSONSchema;
let mockFileWriter;
let mockJava;

let mockAdminConnection;

describe('composer generator create unit tests', function () {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetworkDefinition.getIdentifier.returns(testBusinessNetworkId);
        mockBusinessNetworkDefinition.getDescription.returns(testBusinessNetworkDescription);
        // mockBusinessNetworkDefinition.fromArchive.resolves(mockBusinessNetworkDefinition);
        mockBusinessNetworkDefinition.accept.returns('');

        mockGoLang = sinon.createStubInstance(GoLangVisitor);
        mockPlantUML = sinon.createStubInstance(PlantUMLVisitor);
        mockTypescript = sinon.createStubInstance(TypescriptVisitor);
        mockJSONSchema = sinon.createStubInstance(JSONSchemaVisitor);
        mockJava = sinon.createStubInstance(JavaVisitor);


        mockGoLang.visit.returns('visited');
        mockPlantUML.visit.returns('visited');
        mockTypescript.visit.returns('visited');
        mockJSONSchema.visit.returns('visited');
        mockJava.visit.returns('visited');

        mockFileWriter = sinon.createStubInstance(require('composer-common').CodeGen.FileWriter);
        CreateCode.FileWriter = mockFileWriter;

        // sandbox.stuf(FileWriter,mockFileWriter);

        sandbox.stub(BusinessNetworkDefinition, 'fromArchive').resolves(mockBusinessNetworkDefinition);
        sandbox.stub(CmdUtil, 'createAdminConnection').returns(mockAdminConnection);
        sandbox.stub(fs,'readFileSync' );
        sandbox.stub(process, 'exit');


    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('Deploy handler() method tests', function () {

        it('Good path, all parms correctly specified.', function () {

            let argv = {archiveFile: 'testArchiveFile.zip'
                        ,format: 'Go'
                       ,outputDir: '/home'};

            return Create.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledOnce(fs.readFileSync);
                // sinon.assert.calledOnce(mockGoLang.visit);
                let parameters = {};
                parameters.fileWriter = new FileWriter('/home');
                sinon.assert.calledWith(mockBusinessNetworkDefinition.accept,mockGoLang,parameters);
            });
        });

        it('Good path, all parms correctly specified.', function () {

            let argv = {archiveFile: 'testArchiveFile.zip'
                        ,format: 'PlantUML'
                       ,outputDir: '/home'};

            return Create.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledOnce(fs.readFileSync);
                let parameters = {};
                parameters.fileWriter = new FileWriter('/home');
                sinon.assert.calledWith(mockBusinessNetworkDefinition.accept,mockPlantUML,parameters);
            });
        });
        it('Good path, all parms correctly specified.', function () {

            let argv = {archiveFile: 'testArchiveFile.zip'
                        ,format: 'Typescript'
                       ,outputDir: '/home'};

            return Create.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledOnce(fs.readFileSync);
                let parameters = {};
                parameters.fileWriter = new FileWriter('/home');
                sinon.assert.calledWith(mockBusinessNetworkDefinition.accept,mockTypescript,parameters);
            });
        });
        it('Good path, all parms correctly specified.', function () {

            let argv = {archiveFile: 'testArchiveFile.zip'
                        ,format: 'JSONSchema'
                       ,outputDir: '/home'};

            return Create.handler(argv)
            .then ((result) => {
                argv.thePromise.should.be.a('promise');
                sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                sinon.assert.calledOnce(fs.readFileSync);
                let parameters = {};
                parameters.fileWriter = new FileWriter('/home');
                sinon.assert.calledWith(mockBusinessNetworkDefinition.accept,mockJSONSchema,parameters);
            });
        });

        it('Good path, all parms correctly specified.', function () {

            let argv = {archiveFile: 'testArchiveFile.zip'
                                    ,format: 'Java'
                                   ,outputDir: '/home'};

            return Create.handler(argv)
                        .then ((result) => {
                            argv.thePromise.should.be.a('promise');
                            sinon.assert.calledOnce(BusinessNetworkDefinition.fromArchive);
                            sinon.assert.calledOnce(fs.readFileSync);
                            let parameters = {};
                            parameters.fileWriter = new FileWriter('/home');
                            sinon.assert.calledWith(mockBusinessNetworkDefinition.accept,mockJava,parameters);
                        });
        });

        it('Invalid generator specified', function () {

            let argv = {archiveFile: 'testArchiveFile.zip'
                        ,format: 'I-do-not-exist'
                       ,outputDir: '/home'};

            return Create.handler(argv)
            .then ((result) => {

            }).catch((error) => {
                error.should.not.to.be.undefined;
            }

          );
        });

    });

});

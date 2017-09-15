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

require('chai').should();
const ModelManager = require('../../lib/modelmanager');
const TypescriptVisitor = require('../../lib/codegen/fromcto/typescript/typescriptvisitor');
const FileWriter = require('../../lib/codegen/filewriter');

const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

const initSampleNetworkModel = (mockFileWriter) => {
    const carleaseModel = fs.readFileSync(path.resolve(__dirname, '../data/model/carlease.cto'), 'utf8');
    const composerModel = fs.readFileSync(path.resolve(__dirname, '../data/model/composer.cto'), 'utf8');

    // create and populate the ModelManager with a model file
    let modelManager = new ModelManager();
    modelManager.should.not.be.null;
    modelManager.clearModelFiles();
    modelManager.addModelFiles([carleaseModel,composerModel], ['carlease.cto', 'composer.cto']);

    let visitor = new TypescriptVisitor();
    let parameters = {};
    parameters.fileWriter = mockFileWriter;
    modelManager.accept(visitor, parameters);
};

describe('TypescriptVisitor', function(){

    let mockFileWriter;

    beforeEach(() => {
        mockFileWriter = sinon.createStubInstance(FileWriter);
    });

    describe('#visit', function() {
        it('should generate Typescript code', function() {
            initSampleNetworkModel(mockFileWriter);

            // check 2 files where generated
            sinon.assert.calledWith(mockFileWriter.openFile, 'composer.ts');
            sinon.assert.calledWith(mockFileWriter.openFile, 'org.acme.ts');
        });

        it('should generate an import statement referencing the imported namespace from a separate file', function() {
            initSampleNetworkModel(mockFileWriter);

            // check import was generated linking to the other file/namespace
            sinon.assert.calledWith(mockFileWriter.writeLine, 0 , 'import {MyParticipant} from \'./composer\';');
        });
    });
});

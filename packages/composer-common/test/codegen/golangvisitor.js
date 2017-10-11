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
const GoLangVisitor = require('../../lib/codegen/fromcto/golang/golangvisitor');
const FileWriter = require('../../lib/codegen/filewriter');
const BusinessNetworkDefinition = require('../../lib/businessnetworkdefinition');

const fs = require('fs');
const path = require('path');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('GoLangVisitor', function(){

    let mockFileWriter;

    beforeEach(() => {
        mockFileWriter = sinon.createStubInstance(FileWriter);
    });

    describe('#visit', function() {
        it('should generate Go code', function() {

            const carleaseModel = fs.readFileSync(path.resolve(__dirname, '../data/model/carlease.cto'), 'utf8');
            const composerModel = fs.readFileSync(path.resolve(__dirname, '../data/model/composer.cto'), 'utf8');

            // create and populate the ModelManager with a model file
            let modelManager = new ModelManager();
            modelManager.should.not.be.null;
            modelManager.clearModelFiles();
            modelManager.addModelFiles([carleaseModel,composerModel], ['carlease.cto', 'composer.cto']);

            let visitor = new GoLangVisitor();
            let parameters = {};
            parameters.fileWriter = mockFileWriter;
            modelManager.accept(visitor, parameters);
            BusinessNetworkDefinition;
            sinon.assert.calledWith(mockFileWriter.openFile, 'composer.go');
            sinon.assert.calledWith(mockFileWriter.openFile, 'main.go');
            sinon.assert.calledWith(mockFileWriter.openFile, 'orgacme.go');
        });

        it('coverage for business network definition',function(){
            let mockBND = sinon.createStubInstance(BusinessNetworkDefinition);
            let mockModelManager = sinon.createStubInstance(ModelManager);
            mockBND.getModelManager.returns(mockModelManager);
            let fakeObj = {accept: function(){}};


            mockModelManager.getModelFiles.returns([fakeObj]);
            let visitor = new GoLangVisitor();
            visitor.visit(mockBND,{});
        });

        it('coverage for business network definition',function(){

            let fakeObj = {accept: function(){}};
            let visitor = new GoLangVisitor();
            (()=>{
                visitor.visit(fakeObj,{});
            })
            .should.throw(/Unrecognised type/);
        });

    });
});

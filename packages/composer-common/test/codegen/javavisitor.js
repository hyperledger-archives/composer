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
const Introspector = require('../../lib/introspect/introspector');
const JavaVisitor = require('../../lib/codegen/fromcto/java/javavisitor');
const FileWriter = require('../../lib/codegen/filewriter');

const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

describe('JavaVisitor', function(){

    let mockFileWriter;

    beforeEach(() => {
        mockFileWriter = sinon.createStubInstance(FileWriter);
    });

    describe('#visit', function() {
        it('should generate Java code', function() {

            const carleaseModel = fs.readFileSync(path.resolve(__dirname, '../data/model/carlease.cto'), 'utf8');
            const concertoModel = fs.readFileSync(path.resolve(__dirname, '../data/model/concerto.cto'), 'utf8');

            // create and populate the ModelManager with a model file
            let modelManager = new ModelManager();
            modelManager.should.not.be.null;
            modelManager.clearModelFiles();
            modelManager.addModelFiles([carleaseModel,concertoModel], ['carlease.cto', 'concerto.cto']);
            const introspector = new Introspector(modelManager);
            const classes = introspector.getClassDeclarations();

            let visitor = new JavaVisitor();
            let parameters = {};
            parameters.fileWriter = mockFileWriter;
            modelManager.accept(visitor, parameters);

            // check all files where generated
            for(let n=0; n < classes.length; n++) {
                const clazz = classes[n];
                sinon.assert.calledWith(mockFileWriter.openFile, clazz.getFullyQualifiedName().replace(/\./g, '/') + '.java');
            }
        });
    });
});

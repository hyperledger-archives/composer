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

const ModelManager = require('../../lib/modelmanager');
const Introspector = require('../../lib/introspect/introspector');

const fs = require('fs');

const chai = require('chai');
chai.use(require('chai-things'));
const sinon = require('sinon');
require('chai').should();

describe('Introspector', () => {

    describe('#accept', () => {

        it('should call the visitor', () => {
            const introspector = new Introspector(null);
            let visitor = {
                visit: sinon.stub()
            };
            introspector.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, introspector, ['some', 'args']);
        });

    });

    describe('#getClassDeclarations', () => {

        it('should return all class declarations', () => {
            // create and populate the ModelManager with a model file
            const modelManager = new ModelManager();
            modelManager.should.not.be.null;

            let modelBase = fs.readFileSync('./test/data/model/model-base.cto', 'utf8');
            modelBase.should.not.be.null;

            modelManager.addModelFile(modelBase, 'model-base.cto');
            const introspector = new Introspector(modelManager);
            let classDecl = introspector.getClassDeclarations().filter( (element) => {
                return !element.isSystemType();
            });
            classDecl.length.should.equal(13);
        });
    });

    describe('#getClassDeclaration', () => {

        it('should be able to get a single class declaration', () => {
            // create and populate the ModelManager with a model file
            const modelManager = new ModelManager();
            modelManager.should.not.be.null;

            let modelBase = fs.readFileSync('./test/data/model/model-base.cto', 'utf8');
            modelBase.should.not.be.null;

            modelManager.addModelFile(modelBase, 'model-base.cto');
            const introspector = new Introspector(modelManager);
            introspector.getClassDeclaration('org.acme.base.Person').should.not.be.null;
        });
    });

    describe('#getModelManager', () => {

        it('should return the model manager', () => {
            const modelManager = new ModelManager();
            const introspector = new Introspector(modelManager);
            introspector.getModelManager().should.equal(modelManager);
        });

    });
});

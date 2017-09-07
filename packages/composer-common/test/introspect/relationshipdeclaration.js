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
const sinon = require('sinon');
const ClassDeclaration = require('../../lib/introspect/classdeclaration');
const RelationshipDeclaration = require('../../lib/introspect/relationshipdeclaration');
// const ModelUtil = require('../../lib/modelutil');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('RelationshipDeclaration', function () {

    let modelManager;
    let mockClassDeclaration;

    const levelOneModel = `namespace org.acme.l1
    participant Person identified by ssn {
      o String ssn
    }
    asset Car identified by vin {
      o String vin
      -->Person owner
    }

    `;

    beforeEach(function () {
        modelManager = new ModelManager();
        mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
        mockClassDeclaration.getModelFile.returns(mockClassDeclaration);
    });

    describe('#validate', function() {
        it('should detect relationships with no type', function () {
            modelManager.addModelFile(levelOneModel);
            const vehicleDeclaration = modelManager.getType('org.acme.l1.Car');
            const field = vehicleDeclaration.getProperty('owner');
            (field instanceof RelationshipDeclaration).should.be.true;
          // stub the getType method to return null
            sinon.stub(field, 'getType', function(){return null;});
            (function () {
                field.validate(vehicleDeclaration);
            }).should.throw(/Relationship must have a type/);
        });

        it('should throw if relationship points to a missing type', () => {
            const model = `
            namespace org.acme.l1
            participant Person identified by ssn {
            o String ssn
            }
            `;
            const model2 = `
            namespace org.acme.l2
            import org.acme.l1.*

            asset Car identified by vin {
            o String vin
            -->Person owner
            }
            `;

            modelManager.addModelFile(model);
            modelManager.addModelFile(model2);
            const vehicleDeclaration = modelManager.getType('org.acme.l2.Car');
            const field = vehicleDeclaration.getProperty('owner');
            (field instanceof RelationshipDeclaration).should.be.true;
            modelManager.getType = () => { return null; };

            (function () {
                field.validate(vehicleDeclaration);
            }).should.throw(/Relationship owner points to a missing type org.acme.l1./);
        });

        it('should throw if relationship is not a relationship target', () => {
            const model = `
            namespace org.acme.l1
            participant Person identified by ssn {
            o String ssn
            }

            asset Car identified by vin {
            o String vin
            -->Person owner
            }
            `;
            modelManager.addModelFile(model);
            const vehicleDeclaration = modelManager.getType('org.acme.l1.Car');
            const field = vehicleDeclaration.getProperty('owner');
            (field instanceof RelationshipDeclaration).should.be.true;
            mockClassDeclaration.isRelationshipTarget.returns(false);
            field.getParent().getModelFile().getType = () => {return mockClassDeclaration;};

            (function () {
                field.validate(vehicleDeclaration);
            }).should.throw(/Relationship owner must be to an asset or participant/);
        });
    });
});

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
const RelationshipDeclaration = require('../../lib/introspect/relationshipdeclaration');
const ModelUtil = require('../../lib/modelutil');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('RelationshipDeclaration', function () {

    let modelManager;

    const levelOneModel = `namespace org.acme.l1
    participant Person identified by ssn {
      o String ssn
    }
    asset Car identified by vin {
      o String vin
      -->Person owner
    }
    `;

    before(function () {
        modelManager = new ModelManager();
    });

    beforeEach(function () {
    });

    afterEach(function () {
        modelManager.clearModelFiles();
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

        it('should validate an event with a relationship to a transaction if it is in the system namespace', () => {
            let model = `namespace ${ModelUtil.getSystemNamespace()}
            transaction MyTransaction identified by transactionId {
              o String transactionId
            }
            event MyEvent identified by eventId {
              o String eventId
              --> MyTransaction Transaction
            }`;
            modelManager.addModelFile(model);
            const declaration = modelManager.getType(ModelUtil.getSystemNamespace() +'.MyEvent');
            const field = declaration.getProperty('Transaction');
            (function () {
                field.validate(declaration);
            }).should.not.throw();
        });

        it('should not validate an event with a relationship to a transaction if it is not in the system namespace', () => {
            let model = `namespace some.namespace
            transaction MyTransaction identified by transactionId {
              o String transactionId
            }
            event MyEvent identified by eventId {
              o String eventId
              --> MyTransaction Transaction
            }`;
            (function () {
                modelManager.addModelFile(model);
            }).should.throw(/must be to an asset or participant/);
        });
    });
});

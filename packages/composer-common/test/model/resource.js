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
const Resource = require('../../lib/model/resource');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('Resource', function () {

    const levelOneModel = `namespace org.acme.l1
  participant Person identified by ssn {
    o String ssn
  }
  asset Car identified by vin {
    o String vin
    -->Person owner
  }
  transaction ScrapCar {
    -->Car car
  }
  `;

    let modelManager = null;

    beforeEach(function () {
        modelManager = new ModelManager();
        modelManager.addModelFile(levelOneModel);
    });

    describe('#getClassDeclaration', function() {
        it('should return the class declaraction', function () {
            const classDecl = modelManager.getType('org.acme.l1.Person');
            const resource = new Resource(modelManager, classDecl, 'org.acme.l1', 'Person', '123' );
            resource.getClassDeclaration().should.equal(classDecl);
        });
    });

    describe('#toJSON', () => {
        it('should serialize an asset to a JavaScript object', function () {
            const classDecl = modelManager.getType('org.acme.l1.Car');
            const resource = new Resource(modelManager, classDecl, 'org.acme.l1', 'Car', '456' );
            resource.vin = '456';
            resource.owner = modelManager.getFactory().newRelationship('org.acme.l1', 'Person', '123');
            resource.toJSON().should.deep.equal({
                $class: 'org.acme.l1.Car',
                owner: 'resource:org.acme.l1.Person#123',
                vin: '456'
            });
        });

        it('should serialize a participant to a JavaScript object', function () {
            const classDecl = modelManager.getType('org.acme.l1.Person');
            const resource = new Resource(modelManager, classDecl, 'org.acme.l1', 'Person', '123' );
            resource.ssn = '123';
            resource.toJSON().should.deep.equal({
                $class: 'org.acme.l1.Person',
                ssn: '123'
            });
        });

        it('should serialize a transaction to a JavaScript object', function () {
            const classDecl = modelManager.getType('org.acme.l1.ScrapCar');
            const resource = new Resource(modelManager, classDecl, 'org.acme.l1', 'ScrapCar', '789' );
            resource.transactionId = '789';
            resource.timestamp = new Date(0);
            resource.car = modelManager.getFactory().newRelationship('org.acme.l1', 'Car', '456');
            resource.toJSON().should.deep.equal({
                $class: 'org.acme.l1.ScrapCar',
                car: 'resource:org.acme.l1.Car#456',
                timestamp: '1970-01-01T00:00:00.000Z',
                transactionId: '789'
            });
        });
    });

    describe('#isRelationship', () => {
        it('should be false', () => {
            const classDecl = modelManager.getType('org.acme.l1.Person');
            const resource = new Resource(modelManager, classDecl, 'org.acme.l1', 'Person', '123' );
            resource.isRelationship().should.be.false;
        });
    });

    describe('#isResource', () => {
        it('should be true', () => {
            const classDecl = modelManager.getType('org.acme.l1.Person');
            const resource = new Resource(modelManager, classDecl, 'org.acme.l1', 'Person', '123' );
            resource.isResource().should.be.true;
        });
    });
});

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

const Factory = require('../../lib/factory');
const ModelManager = require('../../lib/modelmanager');
const ModelUtil = require('../../lib/modelutil');
const RelationshipDeclaration = require('../../lib/introspect/relationshipdeclaration');
const Serializer = require('../../lib/serializer');
const TypeNotFoundException = require('../../lib/typenotfoundexception');
const fs = require('fs');

require('chai').should();

describe('Test Model', function(){

    describe('#setPropertyValue', function() {
        it('check setPropertyValue validates input', function() {

            // create and populate the ModelManager with a model file
            let modelManager = new ModelManager();
            modelManager.should.not.be.null;
            modelManager.clearModelFiles();

            let fileName = './test/data/model/composer.cto';
            let systemModel = fs.readFileSync(fileName, 'utf8');
            systemModel.should.not.be.null;
            modelManager.addModelFile(systemModel,fileName);

            fileName = './test/data/model/carlease.cto';
            let file = fs.readFileSync(fileName, 'utf8');
            file.should.not.be.null;
            modelManager.addModelFile(file,fileName);

            // create a factory
            let factory = new Factory(modelManager);

            // create a new instance
            let cObject = factory.newResource(
                'org.acme', 'Vehicle', 'CAR_123' );

            // model is defined as a string
            // set model to a number
            cObject.setPropertyValue('model', 'CAPRI');
            cObject.model.should.equal('CAPRI');

            // now try some invalid values
            ( function() {cObject.setPropertyValue('model', 1);}).should.throw(/.+expected type String/);
            ( function() {cObject.setPropertyValue('model', true);}).should.throw(/.+expected type String/);
            ( function() {cObject.setPropertyValue('model', new Date());}).should.throw(/.+expected type String/);
            ( function() {cObject.setPropertyValue('model', [1,2,3]);}).should.throw(/.+expected type String/);
        });
    });

    describe('#serialize', function() {
        it('check that objects can be marshalled to/from JSON', function() {

            // create and populate the ModelManager with a model file
            let modelManager = new ModelManager();
            modelManager.should.not.be.null;
            modelManager.clearModelFiles();

            let fileName = './test/data/model/composer.cto';
            let systemModel = fs.readFileSync(fileName, 'utf8');
            systemModel.should.not.be.null;
            modelManager.addModelFile(systemModel,fileName);

            fileName = './test/data/model/carlease.cto';
            let file = fs.readFileSync(fileName, 'utf8');
            file.should.not.be.null;
            modelManager.addModelFile(file,fileName);

            let modelFile = modelManager.getModelFile('org.acme');
            modelFile.getNamespace().should.equal('org.acme');

            // declare an asset registry
            let factory = new Factory(modelManager);

            // create a new instance
            let cObject =  factory.newResource(
                'org.acme', 'Vehicle', 'AAAAAAAAXBB123456' );

            const customer = factory.newConcept('org.acme', 'Customer');
            customer.firstName = 'Dan';
            customer.lastName = 'Selman';
            customer.address = factory.newConcept('org.acme', 'Address');
            cObject.customer = customer;

            cObject.make = 'Renault';

            // vin is the identifying field for Vehicles, so should have been
            // set during object creation
            cObject.vin.should.equal('AAAAAAAAXBB123456');

            // set all the required fields
            cObject.integerArray = [1,2,3];
            cObject.state = 'CREATED';
            cObject.value = 123.45;
            cObject.colour = 'Red';
            cObject.V5cID = 'AB1234567';
            cObject.LeaseContractID = 'foo';
            cObject.scrapped = false;
            cObject.owner = factory.newRelationship(
                'composer', 'MyParticipant', 'CUST_1');
            cObject.previousOwners = null;
            // serialize the instance to JSON using a Serializer
            let serializer = new Serializer(factory, modelManager);
            serializer.should.not.be.null;
            cObject.should.not.be.null;
            let jsonText = serializer.toJSON(cObject);
            jsonText.should.not.be.null;

            // now deserialize and check the round-trip worked
            let cObject2 = serializer.fromJSON(jsonText);
            cObject.getNamespace().should.equal(cObject2.getNamespace());
            cObject.getType().should.equal(cObject2.getType());
            cObject.getIdentifier().should.equal(cObject2.getIdentifier());
            cObject2.make.should.equal('Renault');
        });
    });

    describe('#validateClass', function() {
        it('check that instances are validated against the model when serialized', function() {

            // create and populate the ModelManager with a model file
            let modelManager = new ModelManager();
            modelManager.should.not.be.null;
            modelManager.clearModelFiles();

            let fileName = './test/data/model/composer.cto';
            let systemModel = fs.readFileSync(fileName, 'utf8');
            systemModel.should.not.be.null;
            modelManager.addModelFile(systemModel,fileName);

            fileName = './test/data/model/carlease.cto';
            let file = fs.readFileSync(fileName, 'utf8');
            file.should.not.be.null;
            modelManager.addModelFile(file,fileName);

            let modelFile = modelManager.getModelFile('org.acme');
            modelFile.getNamespace().should.equal('org.acme');

            // create a new instance
            let factory = new Factory(modelManager);
            let cObject =  factory.newResource(
                'org.acme', 'Vehicle', 'CAR_123' );

            // vin is the identifying field for Vehicles, so should have been
            // set during object creation
            cObject.vin.should.equal('CAR_123');
            cObject.getFullyQualifiedIdentifier().should.equal('org.acme.Vehicle#CAR_123');

            cObject.make = 'Renault';

            // serialize the instance to JSON using a Serializer
            let serializer = new Serializer(factory, modelManager);
            serializer.should.not.be.null;
            cObject.should.not.be.null;

            cObject.lastUpdate = new Date();
            cObject.year = 2014;
            cObject.integerArray = [1,2,3];
            cObject.state = 'REGISTERED';
            cObject.value = 123.45;
            cObject.colour = 'Red';
            cObject.V5cID = 'fake';
            cObject.LeaseContractID = 'foo';
            cObject.scrapped = false;
            cObject.owner = null;
            cObject.previousOwners = null;

            // model is defined as a string
            // set model to a number
            cObject.model = 1;
            ( function() {serializer.toJSON(cObject);}).should.throw(/.+expected type String/);

            // set model to a double
            cObject.model = 42.05;
            ( function() {serializer.toJSON(cObject);}).should.throw(/.+expected type String/);

            // set model to a Boolean
            cObject.model = true;
            ( function() {serializer.toJSON(cObject);}).should.throw(/.+expected type String/);

            // set model to a Date
            cObject.model = new Date();
            ( function() {serializer.toJSON(cObject);}).should.throw(/.+expected type String/);

            // set model to an object
            cObject.model = { 'foo' : 'bar' };
            ( function() {serializer.toJSON(cObject);}).should.throw(/.+expected type String/);

            // set model to null
            cObject.model = null;
            ( function() {serializer.toJSON(cObject);}).should.throw(/.+missing required field model/);

            // set model to an array
            cObject.model = ['1','2'];
            ( function() {serializer.toJSON(cObject);}).should.throw(/.+expected type String/);

            // set model to a function
            cObject.model = function() {throw new Error('OOps');};
            ( function() {serializer.toJSON(cObject);}).should.throw(/.+expected type String/);
        });
    });


    describe('#getModelManager', function() {
        it('check parsing and model manager', function() {
            let modelManager = new ModelManager();
            modelManager.should.not.be.null;

            let fileName1 = './test/data/model/composer.cto';
            let systemModel = fs.readFileSync(fileName1, 'utf8');
            systemModel.should.not.be.null;
            modelManager.addModelFile(systemModel,fileName1);

            let fileName2 = './test/data/model/carlease.cto';
            let file = fs.readFileSync(fileName2, 'utf8');
            file.should.not.be.null;
            modelManager.addModelFile(file,fileName2);

            let modelFile = modelManager.getModelFile('org.acme');
            modelFile.getNamespace().should.equal('org.acme');

            // check the clear
            modelManager.clearModelFiles();
            modelManager.getModelFiles().filter((modelFile) => {
                return !modelFile.isSystemModelFile();
            }).length.should.equal(0);
            // the system model will remain hence 1.

            // re-add
            modelManager.addModelFile(systemModel);
            modelManager.addModelFile(file);

            // getType
            let vehicleDecl = modelManager.getType('org.acme.Vehicle');
            vehicleDecl.should.not.be.null;
            vehicleDecl.getFullyQualifiedName().should.equal('org.acme.Vehicle');
            (() => { modelManager.getType('String'); }).should.throw(TypeNotFoundException);
            modelManager.getType('org.acme.Base').getFullyQualifiedName().should.equal('org.acme.Base');
            modelManager.getType('composer.MyParticipant').getName().should.equal('MyParticipant');

            modelFile.getAssetDeclarations().length.should.equal(2);
            modelFile.getTransactionDeclarations().length.should.equal(8);

            // test the Vehicle Asset class
            let vehicle = modelFile.getAssetDeclaration('Vehicle');
            vehicle.getIdentifierFieldName().should.equal('vin');
            vehicle.getName().should.equal('Vehicle');
            vehicle.getProperties().length.should.equal(16); // 15 from Vehicle, and 1 from Base

            // validator, default
            let vinField = vehicle.getProperty('vin');
            (vinField.getType() === 'String').should.be.true;
            vinField.getName().should.equal('vin');
            (vinField.getValidator() === null).should.be.false;
            (vinField.getDefaultValue() === null).should.be.true;
            vinField.isOptional().should.be.false;
            vinField.getValidator().should.not.be.null;

            // array of primitives
            let integerArrayField = vehicle.getProperty('integerArray');
            (integerArrayField.getType() === 'Integer').should.be.true;
            integerArrayField.getName().should.equal('integerArray');
            integerArrayField.isArray().should.be.true;

            // default value
            let makeField = vehicle.getProperty('make');
            makeField.getDefaultValue().should.equal('FORD');

            // optional field
            let lastUpdateField = vehicle.getProperty('lastUpdate');
            lastUpdateField.isOptional().should.be.true;

            // Nary relationship
            let previousOwnersField = vehicle.getProperty('previousOwners');
            previousOwnersField.isArray().should.be.true;
            (previousOwnersField instanceof RelationshipDeclaration).should.be.true;
            previousOwnersField.getType().should.equal('MyParticipant');

            // test the VehicleTransferredToScrapMerchant class
            let txDecl = modelFile.getTransactionDeclaration('VehicleTransferredToScrapMerchant');
            txDecl.should.not.be.null;
            txDecl.getName().should.equal('VehicleTransferredToScrapMerchant');
            txDecl.getProperties().length.should.equal(4);
            let scrapMerchantField = txDecl.getProperty('scrapMerchant');
            (scrapMerchantField !== null).should.be.true;
            scrapMerchantField.getName().should.equal('scrapMerchant');
            (scrapMerchantField.getType() === 'MyParticipant').should.be.true;

            // test that we can retrieve a field declared in a base class
            let vehicleField = txDecl.getProperty('vehicle');
            vehicleField.should.not.be.null;
            vehicleField.getType().should.equal('Vehicle');
            (vehicleField instanceof RelationshipDeclaration).should.be.true;
        });
    });

    describe('#ModelFile.isImportedType', function() {
        it('check that imported types are identified', function() {

            // create and populate the ModelManager with a model file
            let modelManager = new ModelManager();

            let fileName = './test/data/model/composer.cto';
            let systemModel = fs.readFileSync(fileName, 'utf8');
            systemModel.should.not.be.null;
            modelManager.addModelFile(systemModel,fileName);

            fileName = './test/data/model/carlease.cto';
            let file = fs.readFileSync(fileName, 'utf8');
            file.should.not.be.null;
            modelManager.addModelFile(file,fileName);

            let modelFile = modelManager.getModelFile('org.acme');
            modelFile.isLocalType('MyParticipant').should.equal(false);
            modelFile.isImportedType('MyParticipant').should.equal(true);
            let imprts = modelFile.getImports().filter( (element) => {
                return !element.startsWith(ModelUtil.getSystemNamespace());
            });
            imprts.length.should.equal(1);
            modelFile.getImports().includes('composer.MyParticipant').should.equal(true);
        });
    });

    describe('#imports', function() {
        it('check that dependencies of imported types are resolved correctly', function() {

            // create and populate the ModelManager with a model file
            let modelManager = new ModelManager();

            let fileName = './test/data/model/dependencies/base/base.cto';
            let baseModel = fs.readFileSync(fileName, 'utf8');
            baseModel.should.not.be.null;
            modelManager.addModelFile(baseModel,fileName);

            fileName = './test/data/model/dependencies/business/business.cto';
            let businessModel = fs.readFileSync(fileName, 'utf8');
            businessModel.should.not.be.null;
            modelManager.addModelFile(businessModel,fileName);

            fileName = './test/data/model/dependencies/contract/proforma.cto';
            let proformaModel = fs.readFileSync(fileName, 'utf8');
            proformaModel.should.not.be.null;
            modelManager.addModelFile(proformaModel,fileName);

            fileName = './test/data/model/dependencies/contract/contract.cto';
            let contractModel = fs.readFileSync(fileName, 'utf8');
            contractModel.should.not.be.null;
            modelManager.addModelFile(contractModel,fileName);

            let modelFile = modelManager.getModelFile('stdlib.business');
            modelFile.isLocalType('Business').should.equal(true);
            modelFile.isImportedType('Person').should.equal(true);
            let imprts = modelFile.getImports().filter( (element) => {
                return !element.startsWith(ModelUtil.getSystemNamespace());
            });
            imprts.length.should.equal(2);
        });
    });
});

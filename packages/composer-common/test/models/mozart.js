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

//const assert = require('assert');
require('chai').should();
const Factory = require('../../lib/factory');
const ModelManager = require('../../lib/modelmanager');
const Relationship = require('../../lib/model/relationship');
const RelationshipDeclaration = require('../../lib/introspect/relationshipdeclaration');
const Serializer = require('../../lib/serializer');
const fs = require('fs');

describe('Mozart Model', function(){

    let modelManager = null;
    let mozartModel = null;
    let modelFile = null;
    let serializer = null;
    let factory  = null;

    beforeEach(function(){
        modelManager = new ModelManager();
        modelManager.should.not.be.null;

        mozartModel = fs.readFileSync('./test/data/model/mozart.cto', 'utf8');
        mozartModel.should.not.be.null;
        modelManager.addModelFile(mozartModel, 'mozart.cto');

        modelFile = modelManager.getModelFile('com.ibm.concerto.mozart');
        modelFile.should.not.be.null;

        factory = new Factory(modelManager);
        serializer = new Serializer(factory,modelManager);
    });

    describe('#model', function() {
        it('check field types', function() {

            // check the AnimalType enumeration
            const animalType = modelFile.getType( 'com.ibm.concerto.mozart.AnimalType');
            animalType.should.not.be.null;
            const fields = animalType.getOwnProperties();
            fields.length.should.equal(4);

            // check the Participant Farmer
            const farmer = modelFile.getType('com.ibm.concerto.mozart.Farmer');
            farmer.should.not.be.null;
            farmer.getOwnProperties().length.should.equal(5);

            // check the asset Field
            const fieldAsset = modelFile.getType('com.ibm.concerto.mozart.Field');
            fieldAsset.should.not.be.null;
            const fieldAssetProperties = fieldAsset.getOwnProperties();
            fieldAssetProperties.length.should.equal(3);

            const business = modelFile.getType('com.ibm.concerto.mozart.Business');
            business.should.not.be.null;
            business.getOwnProperties().length.should.equal(7);

            // check the Animals relationship
            const incomingAnimals = business.getProperty('incomingAnimals');
            incomingAnimals.should.not.be.null;
            incomingAnimals.getType().should.equal('Animal');
            incomingAnimals.isArray().should.be.true;
            (incomingAnimals instanceof RelationshipDeclaration).should.be.true;
        });

        it('create and serialize instance', function() {
            const myField = factory.newResource('com.ibm.concerto.mozart', 'Field', 'MY_FIELD');
            myField.should.not.be.null;
            myField.cph.should.equal('MY_FIELD');
            myField.setPropertyValue('name', 'Big Field');
            const businessRelationship = factory.newRelationship('com.ibm.concerto.mozart', 'Business', 'MY_BUSINESS');
            myField.business = businessRelationship;

            // check that we can serialize
            const jsonField = serializer.toJSON(myField);
            jsonField.should.not.be.null;

            // create an animal
            const myAnimal = factory.newResource('com.ibm.concerto.mozart', 'Animal', 'SHEEP_001');
            myAnimal.species = 'SHEEP_GOAT';
            myAnimal.movementStatus = 'IN_FIELD';
            myAnimal.productionType = 'MEAT';
            myAnimal.should.not.be.null;
            myAnimal.location = factory.newRelationship('com.ibm.concerto.mozart', 'Field', 'MY_FIELD');
            myAnimal.owner = factory.newRelationship('com.ibm.concerto.mozart', 'Farmer', 'FARMER_001');

            // check that we can serialize
            const jsonAnimal = serializer.toJSON(myAnimal);
            jsonAnimal.should.not.be.null;

            // check we can re-create the animal from JSON
            const newAnimal = serializer.fromJSON(jsonAnimal);
            newAnimal.should.not.be.null;
            newAnimal.species.should.equal('SHEEP_GOAT');
            newAnimal.movementStatus.should.equal('IN_FIELD');
            newAnimal.productionType.should.equal('MEAT');

            // check that relationships have been replaced by a Relationship class instance
            newAnimal.location.getFullyQualifiedIdentifier().should.equal('com.ibm.concerto.mozart.Field#MY_FIELD');

            const myBusiness = factory.newResource('com.ibm.concerto.mozart', 'Business', 'MY_BUSINESS');
            myBusiness.should.not.be.null;
            myBusiness.sbi.should.equal('MY_BUSINESS');
            myBusiness.setPropertyValue('postcode', 'SO225GB');
            myBusiness.address1 = 'Add1';
            myBusiness.address2 = 'Add2';
            myBusiness.county = 'Hampshire';
            const ownerRelationship = factory.newRelationship('com.ibm.concerto.mozart', 'Farmer', 'FARMER_001');
            myBusiness.owner = ownerRelationship;

            const animalRelationship = factory.newRelationship('com.ibm.concerto.mozart', 'Animal', 'SHEEP_001');
            myBusiness.addArrayValue('incomingAnimals', animalRelationship);
            myBusiness.incomingAnimals.length.should.equal(1);
            (myBusiness.incomingAnimals[0] instanceof Relationship).should.be.true;

            // add a second relationship
            const animalRelationship2 = factory.newRelationship('com.ibm.concerto.mozart', 'Animal', 'SHEEP_002');
            myBusiness.addArrayValue('incomingAnimals', animalRelationship2);
            myBusiness.incomingAnimals.length.should.equal(2);
            (myBusiness.incomingAnimals[1] instanceof Relationship).should.be.true;

            // check that we can serialize
            const jsonBusiness = serializer.toJSON(myBusiness);
            jsonBusiness.should.not.be.null;
            (JSON.stringify(jsonBusiness).indexOf('SHEEP_001') > 0).should.be.true;
            (JSON.stringify(jsonBusiness).indexOf('SHEEP_002') > 0).should.be.true;
        });
    });
});

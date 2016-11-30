/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

// const Factory = require('../../lib/factory');
// const Field = require('../../lib/introspect/field');
const JSONGenerator = require('../../lib/serializer/jsongenerator');
const ModelManager = require('../../lib/modelmanager');
const Relationship = require('../../lib/model/relationship');
const Resource = require('../../lib/model/resource');
// const TypedStack = require('../../lib/serializer/typedstack');

require('chai').should();
const sinon = require('sinon');

describe('JSONGenerator', () => {

    let modelManager;
    // let mockFactory;
    let jsonGenerator;
    let sandbox;
    // let assetDeclaration1;
    let relationshipDeclaration1;
    // let relationshipDeclaration2;

    before(() => {
        modelManager = new ModelManager();
        modelManager.addModelFile(`
            namespace org.acme
            asset MyAsset1 identified by assetId {
                o String assetId
            }
            asset MyAsset2 identified by assetId {
                o String assetId
                o Integer integerValue
            }
            asset MyContainerAsset1 identified by assetId {
                o String assetId
                o MyAsset1 myAsset
            }
            asset MyContainerAsset1 identified by assetId {
                o String assetId
                o MyAsset1[] myAssets
            }
            transaction MyTx1 identified by transactionId {
                o String transactionId
                --> MyAsset1 myAsset
            }
            transaction MyTx2 identified by transactionId {
                o String transactionId
                --> MyAsset1[] myAssets
            }
        `);
        // assetDeclaration1 = modelManager.getType('org.acme.MyContainerAsset1').getProperty('myAsset');
        relationshipDeclaration1 = modelManager.getType('org.acme.MyTx1').getProperty('myAsset');
        // relationshipDeclaration2 = modelManager.getType('org.acme.MyTx2').getProperty('myAssets');
    });

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        // mockFactory = sinon.createStubInstance(Factory);
        jsonGenerator = new JSONGenerator();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#visit', () => {

        it('should throw an error for an unrecognized type', () => {
            (() => {
                jsonGenerator.visit(3.142, {});
            }).should.throw(/Unrecognised/);
        });

    });

    describe('#getRelationshipText', () => {

        it('should return a relationship string for a relationship', () => {
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockRelationship.getIdentifier.returns('DOGE_1');
            mockRelationship.getNamespace.returns('org.acme');
            jsonGenerator.getRelationshipText(relationshipDeclaration1, mockRelationship).should.equal('DOGE_1');
        });

        it('should return a relationship string for a relationship in another namespace', () => {
            let mockRelationship = sinon.createStubInstance(Relationship);
            mockRelationship.getIdentifier.returns('DOGE_1');
            mockRelationship.getNamespace.returns('org.elsewhere');
            mockRelationship.getFullyQualifiedIdentifier.returns('org.elsewhere.MyAsset1#DOGE_1');
            jsonGenerator.getRelationshipText(relationshipDeclaration1, mockRelationship).should.equal('org.elsewhere.MyAsset1#DOGE_1');
        });

        it('should throw an error for a resource if not permitted', () => {
            let mockResource = sinon.createStubInstance(Resource);
            (() => {
                jsonGenerator.getRelationshipText(relationshipDeclaration1, mockResource);
            }).should.throw(/Did not find a relationship/);
        });

        it('should return a relationship string for a resource if permitted', () => {
            jsonGenerator = new JSONGenerator(true); // true enables convertResourcesToRelationships
            let mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('DOGE_1');
            mockResource.getNamespace.returns('org.acme');
            jsonGenerator.getRelationshipText(relationshipDeclaration1, mockResource).should.equal('DOGE_1');
        });

    });

});

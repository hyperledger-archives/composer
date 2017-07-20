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

const AssetDeclaration = require('../lib/introspect/assetdeclaration');
const EnumDeclaration = require('../lib/introspect/enumdeclaration');
const ModelFile = require('../lib/introspect/modelfile');
const ModelManager = require('../lib/modelmanager');
const ParticipantDeclaration = require('../lib/introspect/participantdeclaration');
const EventDeclaration = require('../lib/introspect/eventdeclaration');
const TypeNotFoundException = require('../lib/typenotfoundexception');
const TransactionDeclaration = require('../lib/introspect/transactiondeclaration');
const fs = require('fs');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-things'));
const sinon = require('sinon');

describe('ModelManager', () => {

    let modelBase = fs.readFileSync('./test/data/model/model-base.cto', 'utf8');
    let farm2fork = fs.readFileSync('./test/data/model/farm2fork.cto', 'utf8');
    let concertoModel = fs.readFileSync('./test/data/model/concerto.cto', 'utf8');
    let invalidModel = fs.readFileSync('./test/data/model/invalid.cto', 'utf8');
    let invalidModel2 = fs.readFileSync('./test/data/model/invalid2.cto', 'utf8');
    let modelManager;
    let mockSystemModelFile;

    beforeEach(() => {
        modelManager = new ModelManager();
        mockSystemModelFile = sinon.createStubInstance(ModelFile);
        mockSystemModelFile.isLocalType.withArgs('Asset').returns(true);
        mockSystemModelFile.getNamespace.returns('org.hyperledger.composer.system');
        mockSystemModelFile.isSystemModelFile.returns(true);
    });

    describe('#accept', () => {

        it('should call the visitor', () => {
            let visitor = {
                visit: sinon.stub()
            };
            modelManager.accept(visitor, ['some', 'args']);
            sinon.assert.calledOnce(visitor.visit);
            sinon.assert.calledWith(visitor.visit, modelManager, ['some', 'args']);
        });

    });

    describe('#validateModelFile', () => {

        it('should validate model files from strings', () => {
            modelBase.should.not.be.null;
            modelManager.validateModelFile(modelBase);
        });

        it('should validate model files from objects', () => {
            modelBase.should.not.be.null;
            modelManager.validateModelFile(modelBase, 'model-base.cto');
        });

        it('should fail validation of invalid model files from objects', () => {
            invalidModel.should.not.be.null;
            (() => {
                modelManager.validateModelFile(invalidModel);
            }).should.throw();
        });

        it('should fail and set end column to start column and end offset to start offset', () => {
            invalidModel2.should.not.be.null;
            try {
                modelManager.validateModelFile(invalidModel2);
            } catch (err) {
                err.getFileLocation().start.column.should.equal(err.getFileLocation().end.column);
                err.getFileLocation().start.offset.should.equal(err.getFileLocation().start.offset);
            }
        });
    });

    describe('#addModelFile', () => {

        it('should add a model file from a string', () => {
            let res = modelManager.addModelFile(modelBase);
            modelManager.getModelFile('org.acme.base').getNamespace().should.equal('org.acme.base');
            res.should.be.an.instanceOf(ModelFile);
        });

        it('should support associating a file name with a model file', () => {
            let res = modelManager.addModelFile(modelBase, 'model-base.cto');
            modelManager.getModelFile('org.acme.base').getNamespace().should.equal('org.acme.base');
            res.should.be.an.instanceOf(ModelFile);
            res.getName().should.equal('model-base.cto');
        });

        it('should add a model file from an object', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.doge');
            let res = modelManager.addModelFile(mf1);
            sinon.assert.calledOnce(mf1.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf1);
            res.should.equal(mf1);
        });

        it('should not be possible to add a system model file', ()=>{
            (() => {
                modelManager.addModelFile(mockSystemModelFile);
            }).should.throw();
        });

        it('should not be possible to add a system model file (via string)', ()=>{
            (() => {
                modelManager.addModelFile('namespace org.hyperledger.composer.system','fakesysnamespace.cto');
            }).should.throw();
        });

        it('should return error for duplicate namespaces for a string', () => {
            modelManager.addModelFile(modelBase);
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.acme.base');
            (() => {
                modelManager.addModelFile(modelBase);
            }).should.throw(/namespace already exists/);
        });

        it('should return error for duplicate namespaces from an object', () => {
            modelManager.addModelFile(modelBase);
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.acme.base');
            (() => {
                modelManager.addModelFile(mf1);
            }).should.throw(/namespace already exists/);
        });

    });

    describe('#addModelFiles', () => {

        it('should add model files from strings', () => {
            farm2fork.should.not.be.null;

            concertoModel.should.not.be.null;

            let res = modelManager.addModelFiles([concertoModel, modelBase, farm2fork]);
            modelManager.getModelFile('org.acme.base').getNamespace().should.equal('org.acme.base');
            res.should.all.be.an.instanceOf(ModelFile);
            res.should.have.lengthOf(3);
        });

        it('should add model files from objects', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.doge');
            let mf2 = sinon.createStubInstance(ModelFile);
            mf2.getNamespace.returns('org.fry');
            let res = modelManager.addModelFiles([mf1, mf2]);
            sinon.assert.calledOnce(mf1.validate);
            sinon.assert.calledOnce(mf2.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf1);
            modelManager.modelFiles['org.fry'].should.equal(mf2);
            res.should.deep.equal([mf1, mf2]);
        });

        it('should add to existing model files from strings', () => {
            modelManager.addModelFile(modelBase);
            modelManager.getModelFile('org.acme.base').getNamespace().should.equal('org.acme.base');
            modelManager.addModelFiles([concertoModel, farm2fork]);
            modelManager.getModelFile('org.acme.base').getNamespace().should.equal('org.acme.base');
            modelManager.getModelFile('org.acme').getNamespace().should.equal('org.acme');
        });

        it('should add to existing model files from objects', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.doge');
            modelManager.addModelFiles([mf1]);
            sinon.assert.calledOnce(mf1.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf1);
            let mf2 = sinon.createStubInstance(ModelFile);
            mf2.getNamespace.returns('org.fry');
            modelManager.addModelFiles([mf2]);
            sinon.assert.calledTwice(mf1.validate);
            sinon.assert.calledOnce(mf2.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf1);
            modelManager.modelFiles['org.fry'].should.equal(mf2);
        });

        it('should restore existing model files on validation error from strings', () => {
            modelManager.addModelFile(modelBase);
            modelManager.getModelFile('org.acme.base').getNamespace().should.equal('org.acme.base');

            try {
                modelManager.addModelFiles([concertoModel, 'invalid file']);
            }
            catch(err) {
                // ignore
            }

            modelManager.getModelFile('org.acme.base').getNamespace().should.equal('org.acme.base');
            modelManager.getModelFiles().length.should.equal(2);
        });

        it('should restore existing model files on validation error', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.doge');
            modelManager.addModelFiles([mf1]);
            sinon.assert.calledOnce(mf1.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf1);
            let mf2 = sinon.createStubInstance(ModelFile);
            mf2.validate.throws(new Error('validation error'));
            mf2.getNamespace.returns('org.fry');
            (() => {
                modelManager.addModelFiles([mf2]);
            }).should.throw(/validation error/);
            sinon.assert.calledTwice(mf1.validate);
            sinon.assert.calledOnce(mf2.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf1);
            should.equal(modelManager.modelFiles['org.fry'], undefined);
        });

        it('should not be possible to add a system model file', ()=>{
            (() => {
                modelManager.addModelFiles([mockSystemModelFile]);
            }).should.throw();
        });

        it('should return an error for duplicate namespace from strings', () => {
            (() => {
                modelManager.addModelFiles([concertoModel, modelBase, farm2fork, modelBase]);
            }).should.throw(/namespace already exists/);
        });

        it('should return an error for duplicate namespace from objects', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.doge');
            let mf2 = sinon.createStubInstance(ModelFile);
            mf2.getNamespace.returns('org.doge.base');
            modelManager.addModelFiles([mf1,mf2]);
            (() => {
                modelManager.addModelFiles([mf1]);
            }).should.throw(/namespace already exists/);
        });

    });

    describe('#updateModelFile', () => {

        it('throw if the namespace from an object does not exist', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.doge');
            (() => {
                modelManager.updateModelFile(mf1);
            }).should.throw(/model file does not exist/);
        });

        it('throw if the namespace from a string does not exist', () => {
            let model = 'namespace org.doge\nasset TestAsset identified by assetId { o String assetId }';
            (() => {
                modelManager.updateModelFile(model);
            }).should.throw(/model file does not exist/);
        });

        it('should update from an object', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.doge');
            mf1.$marker = 'mf1';
            let res = modelManager.addModelFile(mf1);
            sinon.assert.calledOnce(mf1.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf1);
            res.should.equal(mf1);

            let mf2 = sinon.createStubInstance(ModelFile);
            mf2.getNamespace.returns('org.doge');
            mf2.$marker = 'mf2';
            res = modelManager.updateModelFile(mf2);
            sinon.assert.calledOnce(mf2.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf2);
            res.should.equal(mf2);
        });

        it('should update from a string', () => {
            let model = 'namespace org.doge\nasset TestAsset identified by assetId { o String assetId }';
            modelManager.addModelFile(model);
            modelManager.modelFiles['org.doge'].definitions.should.equal(model);

            model = 'namespace org.doge\nasset TestAsset2 identified by assetId2 { o String assetId2 }';
            modelManager.updateModelFile(model);
            modelManager.modelFiles['org.doge'].definitions.should.equal(model);
        });

        it('should keep the original if an update from an object throws', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.doge');
            mf1.$marker = 'mf1';
            let res = modelManager.addModelFile(mf1);
            sinon.assert.calledOnce(mf1.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf1);
            res.should.equal(mf1);

            let mf2 = sinon.createStubInstance(ModelFile);
            mf2.getNamespace.returns('org.doge');
            mf2.$marker = 'mf2';
            mf2.validate.throws(new Error('fake error'));
            (() => {
                modelManager.updateModelFile(mf2);
            }).should.throw(/fake error/);
            sinon.assert.calledOnce(mf2.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf1);
        });

        it('should keep the original if an update from an string throws', () => {
            let model = 'namespace org.doge\nasset TestAsset identified by assetId { o String assetId }';
            modelManager.addModelFile(model);
            modelManager.modelFiles['org.doge'].definitions.should.equal(model);

            let model2 = 'not a verb org.doge\nasset TestAsset2 identified by assetId2 { o String assetId2 }';
            (() => {
                modelManager.updateModelFile(model2);
            }).should.throw();
            modelManager.modelFiles['org.doge'].definitions.should.equal(model);
        });

        it('should not be possible to update a system model file', ()=>{
            (() => {
                modelManager.updateModelFile(mockSystemModelFile);
            }).should.throw();
        });

        it('should not be possible to update a system model file (via string)', ()=>{
            (() => {
                modelManager.updateModelFile('namespace org.hyperledger.composer.system','fakesysnamespace.cto');
            }).should.throw();
        });


    });

    describe('#deleteModelFile', () => {

        it('throw if the model file does not exist', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.doge');
            (() => {
                modelManager.deleteModelFile(mf1);
            }).should.throw(/model file does not exist/);
        });

        it('delete the model file', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.doge');
            mf1.$marker = 'mf1';
            let res = modelManager.addModelFile(mf1);
            sinon.assert.calledOnce(mf1.validate);
            modelManager.modelFiles['org.doge'].should.equal(mf1);
            res.should.equal(mf1);
            modelManager.deleteModelFile('org.doge');
            should.equal(modelManager.modelFiles['org.doge'], undefined);
        });

        it('should not be possible to delete a system model file', ()=>{
            (() => {
                modelManager.deleteModelFile(mockSystemModelFile);
            }).should.throw();
        });

    });

    describe('#getNamespaces', () => {

        it('should list all of the namespaces', () => {
            let mf1 = sinon.createStubInstance(ModelFile);
            mf1.getNamespace.returns('org.wow');
            modelManager.addModelFile(mf1);
            let mf2 = sinon.createStubInstance(ModelFile);
            mf2.getNamespace.returns('org.such');
            modelManager.addModelFile(mf2);
            modelManager.getNamespaces().should.have.members(['org.hyperledger.composer.system', 'org.wow', 'org.such']);
        });

    });

    describe('#getSystemTypes', () => {

        it('should return all of the system core types', () => {
            modelManager.getSystemTypes().map((classDeclaration) => {
                return classDeclaration.getName();
            }).should.deep.equal(['Asset', 'Participant', 'Transaction', 'Event']);
        });

    });

    describe('#getAssetDeclarations', () => {

        it('should return all of the asset declarations', () => {
            modelManager.addModelFile(modelBase);
            let decls = modelManager.getAssetDeclarations();
            decls.should.all.be.an.instanceOf(AssetDeclaration);
        });

    });

    describe('#getEnumDeclarations', () => {

        it('should return all of the enum declarations', () => {
            modelManager.addModelFile(modelBase);
            let decls = modelManager.getEnumDeclarations();
            decls.should.all.be.an.instanceOf(EnumDeclaration);
        });

    });

    describe('#getParticipantDeclarations', () => {

        it('should return all of the participant declarations', () => {
            modelManager.addModelFile(modelBase);
            let decls = modelManager.getParticipantDeclarations();
            decls.should.all.be.an.instanceOf(ParticipantDeclaration);
        });

    });

    describe('#getEventDeclarations', () => {

        it('should return all of the event declarations', () => {
            modelManager.addModelFile(modelBase);
            let decls = modelManager.getEventDeclarations();
            decls.should.all.be.an.instanceOf(EventDeclaration);
        });

    });

    describe('#getTransactionDeclarations', () => {

        it('should return all of the transaction declarations', () => {
            modelManager.addModelFile(modelBase);
            let decls = modelManager.getTransactionDeclarations();
            decls.should.all.be.an.instanceOf(TransactionDeclaration);
        });

    });

    describe('#resolveType', () => {

        it('should pass through primitive types', () => {
            modelManager.addModelFile(modelBase);
            modelManager.resolveType('org.acme.base.SimpleAsset', 'String').should.equal('String');
        });

        it('should throw an error for a namespace that does not exist', () => {
            modelManager.addModelFile(modelBase);
            (() => {
                modelManager.resolveType('org.acme.base.SimpleAsset', 'org.acme.nosuchns.SimpleAsset');
            }).should.throw(/No registered namespace/);
        });

        it('should throw an error for a type that does not exist', () => {
            modelManager.addModelFile(modelBase);
            (() => {
                modelManager.resolveType('org.acme.base.SimpleAsset', 'org.acme.base.NoSuchAsset');
            }).should.throw(/No type/);
        });

        it('should return the fully qualified type', () => {
            modelManager.addModelFile(modelBase);
            let fqt = modelManager.resolveType('org.acme.base.SimpleAsset', 'org.acme.base.AbstractAsset');
            fqt.should.equal('org.acme.base.AbstractAsset');
        });

    });

    describe('#getType', function() {
        it('should throw an error for a primitive type', function() {
            modelManager.addModelFile(modelBase);
            (function() {
                modelManager.getType('String');
            }).should.throw(TypeNotFoundException);
        });

        it('should throw an error for a namespace that does not exist', function() {
            modelManager.addModelFile(modelBase);
            (function() {
                modelManager.getType('org.acme.nosuchns.SimpleAsset');
            }).should.throw(TypeNotFoundException, /org.acme.nosuchns/);
        });

        it('should throw an error for an empty namespace', function() {
            modelManager.addModelFile(modelBase);
            (function() {
                modelManager.getType('NoSuchAsset');
            }).should.throw(TypeNotFoundException, /NoSuchAsset/);
        });

        it('should throw an error for a type that does not exist', function() {
            modelManager.addModelFile(modelBase);
            (function() {
                modelManager.getType('org.acme.base.NoSuchAsset');
            }).should.throw(TypeNotFoundException, /NoSuchAsset/);
        });

        it('should return the class declaration for a valid type', function() {
            modelManager.addModelFile(modelBase);
            const declaration = modelManager.getType('org.acme.base.AbstractAsset');
            declaration.getFullyQualifiedName().should.equal('org.acme.base.AbstractAsset');
        });
    });

});

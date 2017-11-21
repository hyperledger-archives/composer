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
const Identifiable = require('../../lib/model/identifiable');
const sinon = require('sinon');
const chai = require('chai');
chai.should();
chai.use(require('chai-things'));

describe('Identifiable', function () {

    let modelManager;
    let classDecl;
    before(function () {
        modelManager = new ModelManager();
        modelManager.addModelFile(`namespace com.composer
        participant Farmer identified by farmerId {
            o String farmerId
        }`);
        classDecl = modelManager.getType('com.composer.Farmer');
    });

    beforeEach(function () {
    });

    afterEach(function () {
    });

    describe('#toString', function() {
        it('should be able to call toString', function () {
            const id = new Identifiable(modelManager, classDecl, 'com.composer', 'Farmer', '123' );
            id.toString().should.equal('Identifiable {id=com.composer.Farmer#123}');
        });
    });

    describe('#setIdentifier', () => {
        it('should be able to set identifier', function () {
            let id = new Identifiable(modelManager, modelManager.getType('com.composer.Farmer'), 'com.composer', 'Farmer', '123' );
            id.setIdentifier('321');
            id.getIdentifier().should.equal('321');
        });
    });

    describe('#accept', () => {
        it('should be able to accept visitor', function () {
            const id = new Identifiable(modelManager, classDecl, 'com.composer', 'Farmer', '123' );
            const visitor = {visit: function(obj,parameters){}};
            const spy = sinon.spy(visitor, 'visit');
            id.accept(visitor, {});
            spy.calledOnce.should.be.true;
        });
    });

    describe('#toJSON', () => {
        it('should throw is toJSON is called', function () {
            const id = new Identifiable(modelManager, classDecl, 'com.composer', 'Farmer', '123' );
            (function () {
                id.toJSON();
            }).should.throw(/Use Serializer.toJSON to convert resource instances to JSON objects./);
        });
    });

    describe('#isRelationship', () => {
        it('should be false', () => {
            const id = new Identifiable(modelManager, classDecl, 'com.composer', 'Farmer', '123' );
            id.isRelationship().should.be.false;
        });
    });

    describe('#isResource', () => {
        it('should be false', () => {
            const id = new Identifiable(modelManager, classDecl, 'com.composer', 'Farmer', '123' );
            id.isResource().should.be.false;
        });
    });
});

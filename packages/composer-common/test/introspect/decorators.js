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

require('chai').should();
const sinon = require('sinon');

describe('Decorators', () => {

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    /**
     * Check the decorations on a model element
     * @param {Decorated} element the model element to check
     * @param {string} type the type of the element
     */
    const checkAll = (element, type) => {
        element.getDecorators().length.should.equal(10);
        element.getDecorator('noargs').should.not.be.null;
        element.getDecorator('noargs').getArguments().length.should.equal(0);

        element.getDecorator('parens').should.not.be.null;
        element.getDecorator('parens').getArguments().length.should.equal(0);

        element.getDecorator('bar').should.not.be.null;
        element.getDecorator('bar').getArguments()[0].should.equal(type);

        element.getDecorator('positiveInteger').should.not.be.null;
        element.getDecorator('positiveInteger').getArguments()[0].should.equal(1);

        element.getDecorator('negativeInteger').should.not.be.null;
        element.getDecorator('negativeInteger').getArguments()[0].should.equal(-1);

        element.getDecorator('positiveDouble').should.not.be.null;
        element.getDecorator('positiveDouble').getArguments()[0].should.equal(10.2);

        element.getDecorator('negativeDouble').should.not.be.null;
        element.getDecorator('negativeDouble').getArguments()[0].should.equal(-10.2);

        element.getDecorator('booleanFalse').should.not.be.null;
        element.getDecorator('booleanFalse').getArguments()[0].should.equal(false);

        element.getDecorator('booleanTrue').should.not.be.null;
        element.getDecorator('booleanTrue').getArguments()[0].should.equal(true);

        element.getDecorator('all').should.not.be.null;
        element.getDecorator('all').getArguments().length.should.equal(7);

        (element.getDecorator('missing') === null).should.be.true;
    };

    describe('#grammar', () => {

        it('should allow all valid syntax and attach to model elements', () => {

            const modelManager = new ModelManager();
            let modelDefinitions = fs.readFileSync('test/data/decorators/model.cto', 'utf8');
            modelManager.addModelFile(modelDefinitions);
            const introspector = new Introspector(modelManager);

            const car = introspector.getClassDeclaration('org.acme.Car');
            checkAll(car, 'asset');

            const driver = introspector.getClassDeclaration('org.acme.Driver');
            driver.getDecorator('bar').getArguments()[0].should.equal('participant');

            const email = driver.getProperty('email');
            checkAll(email, 'string');

            const myDouble = driver.getProperty('myDouble');
            myDouble.getDecorator('bar').getArguments()[0].should.equal('double');

            const myInt = driver.getProperty('myInt');
            myInt.getDecorator('bar').getArguments()[0].should.equal('integer');

            const myLong = driver.getProperty('myLong');
            myLong.getDecorator('bar').getArguments()[0].should.equal('long');

            const myDateTime = driver.getProperty('myDateTime');
            myDateTime.getDecorator('bar').getArguments()[0].should.equal('dateTime');

            const myBoolean = driver.getProperty('myBoolean');
            myBoolean.getDecorator('bar').getArguments()[0].should.equal('boolean');

            const myConcept = driver.getProperty('myConcept');
            myConcept.getDecorator('bar').getArguments()[0].should.equal('concept');

            const myRegulator = driver.getProperty('myRegulator');
            myRegulator.getDecorator('bar').getArguments()[0].should.equal('relationship');

            const transaction = introspector.getClassDeclaration('org.acme.MyTransaction');
            transaction.getDecorator('bar').getArguments()[0].should.equal('transaction');

            const event = introspector.getClassDeclaration('org.acme.MyEvent');
            event.getDecorator('bar').getArguments()[0].should.equal('event');

            const concept = introspector.getClassDeclaration('org.acme.MyConcept');
            concept.getDecorator('bar').getArguments()[0].should.equal('concept');

            const enm = introspector.getClassDeclaration('org.acme.MyEnum');
            enm.getDecorator('bar').getArguments()[0].should.equal('enum');
            enm.getProperty('VALUE').getDecorator('bar').getArguments()[0].should.equal('enumValue');
        });
    });

    describe('#validate', () => {

        it('should prevent attaching the same decorator twice', () => {

            (() => {
                const modelManager = new ModelManager();
                let modelDefinitions = fs.readFileSync('test/data/decorators/invalid.cto', 'utf8');
                modelManager.addModelFile(modelDefinitions);
            }).should.throw(/Duplicate decorator/);
        });
    });
});

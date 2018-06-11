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
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const generators = require('yeoman-generator').generators;
const appGen = require('../generators/app/index');

const sinon = require('sinon');


describe('hyperledger-composer:app for generating a template artifacts', () => {

    let myAngularSpy, myBusNetSpy, myModelSpy, myLoopBackSpy;
    let AngularDummy, BusNetDummy, ModelDummy, LoopBackDummy;

    beforeEach(async () => {
        myAngularSpy = sinon.spy();
        myBusNetSpy = sinon.spy();
        myModelSpy = sinon.spy();
        myLoopBackSpy = sinon.spy();

        AngularDummy = generators.Base.extend({
            exec: myAngularSpy
        });

        BusNetDummy = generators.Base.extend({
            exec: myBusNetSpy
        });

        ModelDummy = generators.Base.extend({
            exec: myModelSpy
        });

        LoopBackDummy = generators.Base.extend({
            exec: myLoopBackSpy
        });
    });

    it('should call Angular generator if provided the Angular option', async () => {

        await helpers.run(appGen)
            .withGenerators([
                [AngularDummy, require.resolve('../generators/angular')],
                [BusNetDummy, require.resolve('../generators/businessnetwork')],
                [ModelDummy, require.resolve('../generators/model')],
                [LoopBackDummy, require.resolve('../generators/loopback')]
            ])
            .withPrompts({
                generatorType: 'Angular'
            })
            .on('error', function (error) {
                assert.fail('Error found:', error);
            });

        assert(myAngularSpy.calledOnce);
        assert(myBusNetSpy.notCalled);
        assert(myModelSpy.notCalled);
        assert(myLoopBackSpy.notCalled);
    });

    it('should call Business Network generator if provided the option', async () => {

        await helpers.run(appGen)
        .withGenerators([
            [AngularDummy, require.resolve('../generators/angular')],
            [BusNetDummy, require.resolve('../generators/businessnetwork')],
            [ModelDummy, require.resolve('../generators/model')],
            [LoopBackDummy, require.resolve('../generators/loopback')]
        ])
        .withPrompts({
            generatorType: 'businessnetwork'
        })
        .on('error', function (error) {
            assert.fail('Error found:', error);
        });

        assert(myAngularSpy.notCalled);
        assert(myBusNetSpy.calledOnce);
        assert(myModelSpy.notCalled);
        assert(myLoopBackSpy.notCalled);
    });

    it('should call Model generator if provided the option', async () => {

        await helpers.run(appGen)
        .withGenerators([
            [AngularDummy, require.resolve('../generators/angular')],
            [BusNetDummy, require.resolve('../generators/businessnetwork')],
            [ModelDummy, require.resolve('../generators/model')],
            [LoopBackDummy, require.resolve('../generators/loopback')]
        ])
        .withPrompts({
            generatorType: 'model'
        })
        .on('error', function (error) {
            assert.fail('Error found:', error);
        });

        assert(myAngularSpy.notCalled);
        assert(myBusNetSpy.notCalled);
        assert(myModelSpy.calledOnce);
        assert(myLoopBackSpy.notCalled);
    });

    it('should call LoopBack generator if provided the option', async () => {

        await helpers.run(appGen)
        .withGenerators([
            [AngularDummy, require.resolve('../generators/angular')],
            [BusNetDummy, require.resolve('../generators/businessnetwork')],
            [ModelDummy, require.resolve('../generators/model')],
            [LoopBackDummy, require.resolve('../generators/loopback')]
        ])
        .withPrompts({
            generatorType: 'loopback'
        })
        .on('error', function (error) {
            assert.fail('Error found:', error);
        });

        assert(myAngularSpy.notCalled);
        assert(myBusNetSpy.notCalled);
        assert(myModelSpy.notCalled);
        assert(myLoopBackSpy.calledOnce);
    });

    it('should not call generators if provided an unknown option', async () => {

        await helpers.run(appGen)
        .withGenerators([
            [AngularDummy, require.resolve('../generators/angular')],
            [BusNetDummy, require.resolve('../generators/businessnetwork')],
            [ModelDummy, require.resolve('../generators/model')],
            [LoopBackDummy, require.resolve('../generators/loopback')]
        ])
        .withPrompts({
            generatorType: 'penguin'
        })
        .on('error', function (error) {
            assert.fail('Error found:', error);
        });

        assert(myAngularSpy.notCalled);
        assert(myBusNetSpy.notCalled);
        assert(myModelSpy.notCalled);
        assert(myLoopBackSpy.notCalled);
    });

});

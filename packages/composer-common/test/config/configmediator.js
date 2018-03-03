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

const ConfigMediator = require('../../lib/config/configmediator');


const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();
chai.use(require('chai-things'));
const mockery = require('mockery');
const sinon = require('sinon');

describe('ConfigMediator', function() {


    let sandbox;

    beforeEach(() => {

        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
        mockery.deregisterAll();

    });

    describe('#get', function() {
        it('should correctly load the config module and give back a valid object', () => {
            const mockConfig = {
                has: sinon.stub(),
                get: sinon.stub()
            };
            mockConfig.has.withArgs('composer.thingy').returns(true);
            mockConfig.get.withArgs('composer.thingy').returns({
                geta: 'roundtoit'
            });
            mockery.registerMock('config', mockConfig);

            ConfigMediator.get('thingy',{}).should.deep.equal({
                geta: 'roundtoit'
            });

        });

        it('should correctly load the config module and give back the supplied default', () => {
            const mockConfig = {
                has: sinon.stub(),
                get: sinon.stub()
            };
            mockConfig.has.withArgs('composer.thingy').returns(false);
            mockConfig.get.withArgs('composer.thingy').returns({
                thingy: 'should be ignored'
            });
            mockery.registerMock('config', mockConfig);

            ConfigMediator.get('thingy',{
                thingy: 'getaroundtoit'
            }).should.deep.equal({
                thingy: 'getaroundtoit'
            });
        });

        it('should correctly cope with failure to load the config module and give back the supplied default', () => {
            // would be good if we could get mockerty to throw an error... but have to sort of work around that..
            const mockConfig = {
                has: sinon.stub().throws(new Error('computer says no')),
                get: sinon.stub()
            };

            mockery.registerMock('config', mockConfig);

            ConfigMediator.get('thingy',{
                thingy: 'getaroundtoit'
            }).should.deep.equal({
                thingy: 'getaroundtoit'
            });
        });

        it('should correctly re throw the error if the config file can not be parsed', () => {
            // would be good if we could get mockerty to throw an error... but have to sort of work around that..
            const mockConfig = {
                has: sinon.stub().throws(new Error('Computer says Cannot parse config file  huh ')),
                get: sinon.stub()
            };

            mockery.registerMock('config', mockConfig);

            (()=>{
                ConfigMediator.get('thingy',{
                    thingy: 'getaroundtoit'
                });
            }).should.throw(/Cannot parse config file/);
        });

    });



});

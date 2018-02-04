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
const validator = require('../lib/profilevalidator.js');
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;


describe('composer-validate command', function() {

    let sandbox;
    let validatorStub;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        validatorStub = sandbox.stub(validator, 'validateProfile');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should call the library function when the command is run', function() {
        require('../bin/cmd.js');
        expect(validatorStub).to.have.been.calledOnce;
    });

    it('should return a usage command when the wrong number of arguments are specified', function() {
        process.argv.push([1, 2, 3]);
        require('../bin/cmd.js');
        expect(validatorStub).not.to.have.been.called;
    });
});

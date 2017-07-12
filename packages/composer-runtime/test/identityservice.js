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

const IdentityService = require('../lib/identityservice');

require('chai').should();

describe('IdentityService', () => {

    let identityService = new IdentityService();

    describe('#getIdentifier', () => {

        it('should throw as abstract method', () => {
            (() => {
                identityService.getIdentifier();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#getName', () => {

        it('should throw as abstract method', () => {
            (() => {
                identityService.getName();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#getIssuer', () => {

        it('should throw as abstract method', () => {
            (() => {
                identityService.getIssuer();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#getCertificate', () => {

        it('should throw as abstract method', () => {
            (() => {
                identityService.getCertificate();
            }).should.throw(/abstract function called/);
        });

    });

});

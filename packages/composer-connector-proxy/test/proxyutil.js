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

const ProxyUtil = require('../lib/proxyutil');
const serializerr = require('serializerr');

require('chai').should();

describe('ProxyUtil', () => {

    describe('#inflaterr', () => {

        it('should inflate a serialized error', () => {
            const expectedError = new TypeError('some type error');
            const serializedError = serializerr(expectedError);
            (() => {
                throw ProxyUtil.inflaterr(serializedError);
            }).should.throw(TypeError, /some type error/);
        });

        it('should inflate an unrecognized error', () => {
            const expectedError = new TypeError('some type error');
            const serializedError = serializerr(expectedError);
            (() => {
                throw ProxyUtil.inflaterr({
                    name: 'FooBarError',
                    message: serializedError.message,
                    stack: serializedError.stack
                });
            }).should.throw(Error, /some type error/);
        });

    });

});

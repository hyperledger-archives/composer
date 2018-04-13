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

const Service = require('../lib/service');

describe('Service', () => {

    let service;

    beforeEach(() => {
        service = new Service();
    });

    describe('#transactionStart', () => {

        it('should return a resolved promise', async () => {
            // just by trying to await for the service to complete tests the expected
            // behaviour.
            await service.transactionStart(true);
        });
    });

    describe('#transactionPrepare', () => {

        it('should return a resolved promise', async () => {
            // just by trying to await for the service to complete tests the expected
            // behaviour.
            await service.transactionPrepare();
        });

    });

    describe('#transactionRollback', () => {

        it('should return a resolved promise', async () => {
            // just by trying to await for the service to complete tests the expected
            // behaviour.
            await service.transactionRollback();
        });

    });

    describe('#transactionCommit', () => {

        it('should return a resolved promise', async () => {
            // just by trying to await for the service to complete tests the expected
            // behaviour.
            await service.transactionCommit();
        });

    });

    describe('#transactionEnd', () => {

        it('should return a resolved promise', async () => {
            // just by trying to await for the service to complete tests the expected
            // behaviour.
            await service.transactionEnd();
        });

    });

});

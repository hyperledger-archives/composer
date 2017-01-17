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

const TransactionExecutor = require('../lib/transactionexecutor');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

describe('TransactionExecutor', () => {

    let transactionExecutor = new TransactionExecutor();

    describe('#getType', () => {

        it('should throw as abstract method', () => {
            (() => {
                transactionExecutor.getType();
            }).should.throw(/abstract function called/);
        });

    });

    describe('#execute', () => {

        it('should throw as abstract method', () => {
            return transactionExecutor.execute()
                .should.be.rejectedWith(/abstract function called/);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            transactionExecutor.toJSON().should.deep.equal({});
        });

    });

});

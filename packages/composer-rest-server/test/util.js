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

const util = require('../lib/util');
require('chai').should();
const sinon = require('sinon');
const inquirer = require('inquirer');

describe('composer-rest-server', () => {

    let MOCK_ANSWERS = ['1','2','3','4'];
    beforeEach(() => {
        sinon.stub(inquirer, 'prompt', () => {
            return Promise.resolve(MOCK_ANSWERS);
        });
    });

    describe('create util', () => {
        it('should create a util class and use inquirer to get responses from the user', () => {
            return new Promise((resolve, reject) => {
                util.getFabricDetails((answers, error) => {
                    if(error) {
                        reject(error);
                    }
                    resolve(answers);
                });
            })
            .then((answers) => {
                answers.should.equal(MOCK_ANSWERS);
            });
        });
    });

});
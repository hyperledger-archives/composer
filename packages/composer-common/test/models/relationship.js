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

const assert = require('assert');
require('chai').should();
const fs = require('fs');
const ModelManager = require('../../lib/modelmanager');

describe('Test Relationships', function(){
    describe('#validate', function() {
        it('check that relationships to primitives are illegal', function() {
            // create and populate the ModelManager with a model file
            const modelManager = new ModelManager();
            modelManager.should.not.be.null;
            modelManager.clearModelFiles();

            let fileName = './test/data/parser/relationshiptoprimitive.cto';
            let model = fs.readFileSync(fileName, 'utf8');
            assert.throws( function() {modelManager.addModelFile(model,fileName);}, /.+Relationship bad cannot be to the primitive type String/, 'did not throw with expected message');
        });
    });
});

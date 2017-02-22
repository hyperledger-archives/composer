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

const ModelFile = require('../../lib/introspect/modelfile');
const ModelManager = require('../../lib/modelmanager');
const fs = require('fs');
const path = require('path');

require('chai').should();
const sinon = require('sinon');

describe('ModelFile semantic validation', () => {

    const invalidModel = fs.readFileSync(path.resolve(__dirname, '../data/model/invalid.cto'), 'utf8');

    let mockModelManager;
    let sandbox;

    beforeEach(() => {
        mockModelManager = sinon.createStubInstance(ModelManager);
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should throw and include file location', () => {
            try {
                const mf = new ModelFile(mockModelManager,invalidModel, 'invalid.cto');
                mf.validate();
            }
            catch(error) {
                error.getModelFile().getFileName().should.equal('invalid.cto');
                error.getFileLocation().start.line.should.equal(8);
                error.getFileLocation().start.column.should.equal(1);
                error.getFileLocation().end.line.should.equal(10);
                error.getFileLocation().end.column.should.equal(2);
            }
        });
    });
});

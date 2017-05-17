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

require('chai').should();
const ModelManager = require('../../lib/modelmanager');
const Factory = require('../../lib/factory');
const Serializer = require('../../lib/serializer');
const fs = require('fs');

describe('Dependencies2 Model', function() {
    describe('#model', function() {
        it('create instance', function() {
            let modelManager = new ModelManager();
            modelManager.should.not.be.null;

            // parse a model file from disk and add to the ModelManager
            const files = [
                './test/data/model/dependencies2/base.cto',
                './test/data/model/dependencies2/core.cto'
            ];

            const models = [];

            for(let n=0; n < files.length; n++) {
                models.push(fs.readFileSync(files[n], 'utf8'));
            }

            modelManager.addModelFiles(models, files);

            const factory = new Factory(modelManager);
            const serializer = new Serializer(factory, modelManager);

            // const participant = factory.newResource('org.acme.base', 'ClientAdminMember', 'testadmin');
            const transaction = factory.newTransaction('org.acme.core', 'BaseTransaction', 'testing');
            transaction.invoker = factory.newRelationship('org.acme.base', 'ClientAdminMember', 'testadmin');
            transaction.validate();
            const jsonObj = serializer.toJSON(transaction);
            //console.log(JSON.stringify(jsonObj));
            const result = serializer.fromJSON(jsonObj);
            result.getType().should.equal('BaseTransaction');
            result.validate();
        });
    });
});

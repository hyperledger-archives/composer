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

const GitHubModelFileLoader = require('../../../lib/introspect/loaders/githubmodelfileloader');
const ModelFileDownloader = require('../../../lib/introspect/loaders/modelfiledownloader');
const ModelFile = require('../../../lib/introspect/modelfile');
const ModelManager = require('../../../lib/modelmanager');

const chai = require('chai');
chai.should();
chai.use(require('chai-things'));
chai.use(require('chai-as-promised'));
const sinon = require('sinon');

describe('ModelFileDownloader', () => {

    let modelManager;
    let sandbox;

    beforeEach(() => {
        modelManager = new ModelManager();
        sandbox = sinon.sandbox.create();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#downloadExternalDependencies', function() {

        it('should return [] when nothing to do', function() {

            // create a fake model file loader
            const ml = sinon.createStubInstance(GitHubModelFileLoader);

            // it accepts all URLs
            ml.accepts.returns(true);

            // add a model file that imports externalModelFile
            modelManager.addModelFile(`namespace org.root
concept Foo {}`, 'fake.cto', true);

            // download all the external models for the model manager (there are none!)
            const mfd = new ModelFileDownloader(ml);
            return mfd.downloadExternalDependencies(modelManager.getModelFiles(), {})
            .then((result) => {
                result.should.deep.equal([]);
            });
        });

        it('should download a model file and its external dependencies', function() {

            // create a fake model file loader
            const ml = sinon.createStubInstance(GitHubModelFileLoader);

            // it accepts all URLs
            ml.accepts.returns(true);

            // create a fake external model file for the org.external namespace
            const externalModelFile = sinon.createStubInstance(ModelFile);
            externalModelFile.getNamespace.returns('org.external');

            // create a fake external model file for the org.external2 namespace
            const externalModelFile2 = sinon.createStubInstance(ModelFile);
            externalModelFile2.getNamespace.returns('org.external2');

            // bind the model files to namespaces in the fake loader
            ml.load.withArgs('github://external.cto').returns(Promise.resolve(externalModelFile));
            ml.load.withArgs('github://external2.cto').returns(Promise.resolve(externalModelFile2));

            // externalModelFile has an external import to externalModelFile2
            const externalImport = {'org.external2' : 'github://external2.cto'};
            externalModelFile.getExternalImports.returns(externalImport);

            // externalModelFile2 import itself (!) this is to test the cache works
            externalModelFile2.getExternalImports.returns(externalImport);

            // add a model file that imports externalModelFile
            modelManager.addModelFile(`namespace org.root
import org.external from github://external.cto
concept Foo {}`, 'fake.cto', true);

            // download all the external models for the model manager
            const mfd = new ModelFileDownloader(ml);
            return mfd.downloadExternalDependencies(modelManager.getModelFiles())
            .then((result) => {
                // there should be 2 (externalModelFile and externalModelFile2)
                result.should.deep.equal([externalModelFile,externalModelFile2]);
            });
        });

        it('should handle loader errors', function() {

            // create a fake model file loader
            const ml = sinon.createStubInstance(GitHubModelFileLoader);

            // it accepts all URLs
            ml.accepts.returns(true);

            // bind the model files to namespaces in the fake loader
            ml.load.withArgs('github://external.cto').returns(Promise.reject('oh noes!'));

            // add a model file that imports externalModelFile
            modelManager.addModelFile(`namespace org.root
import org.external from github://external.cto
concept Foo {}`, 'fake.cto', true);

            const mfd = new ModelFileDownloader(ml);
            return mfd.downloadExternalDependencies(modelManager.getModelFiles())
            .should.be.rejectedWith(Error, 'Failed to load model file.');
        });
    });
});

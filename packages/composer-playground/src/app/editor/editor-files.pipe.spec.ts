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
/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { EditorFilesPipe } from './editor-files.pipe';
import { EditorFile } from '../services/editor-file';

import * as chai from 'chai';

let should = chai.should();

describe('EditorFilesPipe', () => {
    let pipe: EditorFilesPipe;

    beforeEach(() => {
        pipe = new EditorFilesPipe();
    });

    it('should filter out readme files', () => {
        let readmeFile = new EditorFile('readme', 'readme.md', 'myContent', 'readme');
        let filteredFiles = pipe.transform([readmeFile]);

        filteredFiles.should.deep.equal([]);
    });

    it('should filter out package files', () => {
        let packageFile = new EditorFile('package', 'package.json', 'myContent', 'package');
        let filteredFiles = pipe.transform([packageFile]);

        filteredFiles.should.deep.equal([]);
    });

    it('should not filter out other files', () => {
        let modelFile = new EditorFile('model', 'model', 'myContent', 'model');
        let scriptFile = new EditorFile('script', 'script', 'myContent', 'script');
        let aclFile = new EditorFile('acl', 'acl', 'myContent', 'acl');
        let queryFile = new EditorFile('query', 'query', 'myContent', 'query');

        let filteredFiles = pipe.transform([modelFile, scriptFile, aclFile, queryFile]);

        filteredFiles.should.deep.equal([modelFile, scriptFile, aclFile, queryFile]);
    });
});

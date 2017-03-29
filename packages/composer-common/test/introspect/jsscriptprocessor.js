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

const JSScriptProcessor = require('../../lib/introspect/jsscriptprocessor');


describe('ScriptProcessor', () => {

    let scriptProcessor;

    beforeEach(() => {
        scriptProcessor = new JSScriptProcessor();
    });

    afterEach(() => {
    });


    describe('#getType', () => {

        it('should return JS as type', () => {
            scriptProcessor.getType().should.equal('JS');
        });

    });

    describe('#process', () => {

    });

    describe('#newContent', () => {

        it('should return new content template', () => {
            scriptProcessor.newContent().should.equal(`/**
 * New script file
 */`);
        });

    });

});

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
const LanguageSupport = require('../lib/languagesupport');
const JSTransactionExecutor = require('../lib/jstransactionexecutor');
const JSScriptProcessor = require('composer-common').JSScriptProcessor;
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.use(require('chai-things'));
require('sinon-as-promised');

describe('LanguageSupport', () => {
    let languageSupport = null;
    beforeEach(() => {
        languageSupport = new LanguageSupport.Builder('JS').description('Built-in JS language support')
            .scriptProcessor(new JSScriptProcessor()).transactionExecutor(new JSTransactionExecutor())
            .codemirror({
                lineNumbers: true,
                lineWrapping: true,
                readOnly: false,
                mode: 'javascript',
                autofocus: true,
                //extraKeys: { 'Ctrl-Q': function(cm) { cm.foldCode(cm.getCursor()); } },
                foldGutter: true,
                gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
                scrollbarStyle: 'simple'
            }).build();
    });

    describe('#Builder', () => {

        it('should create LanguageSupport', () => {
            new LanguageSupport.Builder('JS').description('Built-in JS language support')
            .scriptProcessor(new JSScriptProcessor()).transactionExecutor(new JSTransactionExecutor())
            .codemirror({
                lineNumbers: true,
                lineWrapping: true,
                readOnly: false,
                mode: 'javascript',
                autofocus: true,
                //extraKeys: { 'Ctrl-Q': function(cm) { cm.foldCode(cm.getCursor()); } },
                foldGutter: true,
                gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
                scrollbarStyle: 'simple'
            }).build().should.be.instanceOf(LanguageSupport);
        });

        it('should throw exception when no language is specified', () => {
            (() => {
                new LanguageSupport.Builder().build();
            }).should.throw(/Must specify language/);
        });

    });

    describe('#getCodeMirrorStyle', () => {

        it('should get CodeMirrorStyle', () => {
            languageSupport.getCodeMirrorStyle().should.be.instanceOf(Object);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            languageSupport.toJSON().should.deep.equal({});
        });

    });

});

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
const LanguageManager = require('../lib/languagemanager');
const JSTransactionExecutor = require('../lib/jstransactionexecutor');
const JSScriptProcessor = require('composer-common').JSScriptProcessor;
const LanguageSupport = require('../lib/languagesupport');
const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));
chai.use(require('chai-subset'));
chai.use(require('chai-things'));
require('sinon-as-promised');

describe('LanguageManager', () => {
    beforeEach(() => {
    });

    afterEach(() => {
        LanguageManager.reset();
    });

    describe('#getLanguages', () => {

        it('should get languages', () => {
            LanguageManager.getLanguages().should.have.lengthOf(1);
        });

    });

    describe('#addLanguageSupport', () => {

        it('should addLanguageSupport', () => {
            LanguageManager.addLanguageSupport(new LanguageSupport.Builder('JS').description('Built-in JS language support')
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
                }).build());
        });

        it('should addLanguageSupport without script processor', () => {
            LanguageManager.addLanguageSupport(new LanguageSupport.Builder('XXX').build());
        });

    });

    describe('#getCodeMirrorStyle', () => {

        it('should return CodeMirrorStyle', () => {
            LanguageManager.getCodeMirrorStyle('JS').should.be.instanceOf(Object);
        });

    });

    describe('#getScriptProcessors', () => {

        it('should return Script Processors', () => {
            LanguageManager.getScriptProcessors().should.have.lengthOf(1);
        });

    });

    describe('#getTransactionExecutors', () => {

        it('should return TransactionExecutors', () => {
            LanguageManager.getTransactionExecutors().should.have.lengthOf(1);
        });

    });

    describe('#toJSON', () => {

        it('should return an empty object', () => {
            LanguageManager.toJSON().should.deep.equal({});
        });

    });

});

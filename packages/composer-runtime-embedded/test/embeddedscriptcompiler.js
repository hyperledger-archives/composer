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

const EmbeddedScriptCompiler = require('..').EmbeddedScriptCompiler;
const ScriptCompiler = require('composer-runtime').ScriptCompiler;

require('chai').should();
const sinon = require('sinon');

describe('EmbeddedScriptCompiler', () => {

    let scriptCompiler;
    let sandbox;

    beforeEach(() => {
        scriptCompiler = new EmbeddedScriptCompiler();
        sandbox = sinon.sandbox.create();
        sandbox.stub(scriptCompiler.instrumenter, 'instrumentSync').returns('wow such instrumented code');
        sandbox.stub(scriptCompiler.instrumenter, 'lastSourceMap').returns({ wow: 'such instrumented source map' });
    });

    afterEach(() => {
        delete process.env.running_under_istanbul;
        delete process.env.NYC_INSTRUMENTER;
        sandbox.restore();
    });

    describe('#constructor', () => {

        it('should create a script compiler', () => {
            scriptCompiler.should.be.an.instanceOf(ScriptCompiler);
        });

    });

    describe('#transformScript', () => {

        it('should defer to the base class by default', () => {
            scriptCompiler.transformScript('source1.js', 'eval(true)', '{"wow":"such source map"}').should.deep.equal({
                sourceCode: 'eval(true)',
                sourceFileName: 'source1.js',
                sourceMap: '{"wow":"such source map"}'
            });
        });

        it('should use the istanbul instrumenter if running under istanbul', () => {
            process.env.running_under_istanbul = '1';
            scriptCompiler.transformScript('source1.js', 'eval(true)', '{"wow":"such source map"}').should.deep.equal({
                sourceCode: 'wow such instrumented code',
                sourceFileName: 'source1.js',
                sourceMap: '{"wow":"such instrumented source map"}'
            });
        });

        it('should use the istanbul instrumenter if running under nyc', () => {
            process.env.NYC_INSTRUMENTER = '1';
            scriptCompiler.transformScript('source1.js', 'eval(true)', '{"wow":"such source map"}').should.deep.equal({
                sourceCode: 'wow such instrumented code',
                sourceFileName: 'source1.js',
                sourceMap: '{"wow":"such instrumented source map"}'
            });
        });

    });

});

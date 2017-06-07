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

const libInstrument = require('istanbul-lib-instrument');
const Logger = require('composer-common').Logger;
const path = require('path');
const ScriptCompiler = require('composer-runtime').ScriptCompiler;

const LOG = Logger.getLog('EmbeddedScriptCompiler');

/**
 * Base class representing the logging service provided by a {@link Container}.
 * @protected
 */
class EmbeddedScriptCompiler extends ScriptCompiler {

    /**
     * Constructor.
     */
    constructor() {
        super();
        this.instrumenter = new libInstrument.createInstrumenter({
            produceSourceMap: true
        });
    }

    /**
     * Optional hook to transform a script into another format, for example
     * by using a code coverage instrumenter.
     * @param {String} sourceFileName The file name for the script.
     * @param {String} sourceCode The source code for the script.
     * @param {String} sourceMap The source map for the script.
     * @return {Object} The transformed script.
     */
    transformScript(sourceFileName, sourceCode, sourceMap) {
        const method = 'transformScript';
        LOG.entry(method, sourceFileName, sourceCode, sourceMap);

        // Don't do anything unless we're running under Istanbul.
        const isIstanbul = process.env.running_under_istanbul || process.env.NYC_INSTRUMENTER;
        if (!isIstanbul) {
            LOG.debug(method, 'Not running under Istanbul');
            const result = super.transformScript(sourceFileName, sourceCode, sourceMap);
            LOG.exit(method, result);
            return result;
        }

        // Parse the source map.
        const parsedSourceMap = JSON.parse(sourceMap);

        // Instrument the code.
        const instrumentedCode = this.instrumenter.instrumentSync(sourceCode, path.resolve(process.cwd(), sourceFileName), parsedSourceMap);
        const instrumentedMap = JSON.stringify(this.instrumenter.lastSourceMap());

        // Return the instrumented code.
        const result = {
            sourceFileName: sourceFileName,
            sourceCode: instrumentedCode,
            sourceMap: instrumentedMap
        };
        LOG.exit(method, result);
        return result;
    }

}

module.exports = EmbeddedScriptCompiler;

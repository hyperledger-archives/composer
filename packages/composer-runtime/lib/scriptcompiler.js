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

const Api = require('./api');
const assert = require('assert');
const CompiledScriptBundle = require('./compiledscriptbundle');
const Logger = require('composer-common').Logger;
const request = require('request-promise-any');
const SourceMapConsumer = require('source-map').SourceMapConsumer;
const SourceMapGenerator = require('source-map').SourceMapGenerator;
const SourceNode = require('source-map').SourceNode;

const LOG = Logger.getLog('ScriptCompiler');

/**
 * A script compiler compiles all scripts in a script manager into a compiled
 * script bundle that can easily be called by the runtime.
 * @protected
 */
class ScriptCompiler {

    /**
     * Compile all the scripts in the specified script manager into a compiled
     * script bundle for use by the runtime.
     * @param {ScriptManager} scriptManager The script manager to process.
     * @return {CompiledScriptBundle} The compiled script bundle.
     */
    compile(scriptManager) {
        const method = 'compile';
        LOG.entry(method, scriptManager);

        // Create the compiler context.
        const rootNode = new SourceNode(null, null, null);
        const functionDeclarations = [];
        const context = {
            rootNode: rootNode,
            functionDeclarations: functionDeclarations
        };

        // Define the globals.
        const globals = {
            assert,
            request
        };

        // Add the start section.
        rootNode.add('function __generator(__globals, __api) {\n');
        Object.keys(globals).forEach((globalName) => {
            LOG.debug(method, 'Adding global', globalName);
            rootNode.add(`    var ${globalName} = __globals.${globalName};\n`);
        });
        Api.getMethodNames().forEach((methodName) => {
            LOG.debug(method, 'Adding API method', methodName);
            rootNode.add(`    var ${methodName} = __api.${methodName}.bind(__api);\n`);
        });
        rootNode.add('    __globals = __api = null;\n');

        // Process the script manager.
        this.processScriptManager(context, scriptManager);

        // Add the end section.
        rootNode.add('\n return {\n');
        context.functionDeclarations.forEach((functionDeclaration) => {
            LOG.debug(method, 'Adding function declaration', functionDeclaration.getName());
            rootNode.add(`        '${functionDeclaration.getName()}': ${functionDeclaration.getName()},\n`);
        });
        rootNode.add('    };');
        rootNode.add('}\n');
        rootNode.add('__generator;\n');

        // Generate the combined source code and source map.
        const combined = rootNode.toStringWithSourceMap();
        const sourceCode = combined.code;
        const sourceMap = combined.map;

        // Serialize the source map as base64.
        const sourceMapBase64 = Buffer.from(sourceMap.toString()).toString('base64');

        // Combine the source code and the serialized source map.
        const finalSourceCode = sourceCode + '\n//# sourceMappingURL=data:application/json;base64,' + sourceMapBase64;

        // Compile the source code into a generator function.
        // The "new Function('return eval')" hack stops the generator function getting access
        // to all our local variables. We could just use "new Function", but that screws up
        // the source maps so they all need to be offset by 2.
        let generatorFunction = new Function('__generatorSource', 'return eval(__generatorSource)')(finalSourceCode);
        generatorFunction = generatorFunction.bind(null, globals);
        let result = new CompiledScriptBundle(functionDeclarations, generatorFunction);
        LOG.exit(method, result);
        return result;
    }

    /**
     * Process the specified script manager by processing the scripts in the script manager.
     * @param {Object} context The compiler context.
     * @param {ScriptManager} scriptManager The script manager to process.
     */
    processScriptManager(context, scriptManager) {
        const method = 'processScriptManager';
        LOG.entry(method, context, scriptManager);

        // Process all of the scripts in the script manager.
        scriptManager.getScripts().forEach((script) => {
            LOG.debug(method, 'Processing script', script.getIdentifier());
            this.processScript(context, script);
        });

        LOG.exit(method);
    }

    /**
     * Process the specified script by processing the function declarations in the script,
     * then convert the script into a script node and add it to the root node.
     * @param {Object} context The compiler context.
     * @param {Script} script The script to process.
     */
    processScript(context, script) {
        const method = 'processScript';
        LOG.entry(method, context, script);

        // Convert the script into a script node, and add it to the root node.
        const scriptNode = this.convertScriptToScriptNode(context, script);
        context.rootNode.add(scriptNode);

        // Store all the function declarations in this script.
        script.getFunctionDeclarations().forEach((functionDeclaration) => {
            LOG.debug(method, 'Adding function declaration', functionDeclaration.getName());
            context.functionDeclarations.push(functionDeclaration);
        });

        LOG.exit(method);
    }

    /**
     * Convert the specified script into a source map.
     * @param {Object} context The compiler context.
     * @param {Script} script The function declaration to process.
     * @return {String} The source map.
     */
    convertScriptToSourceMap(context, script) {
        const method = 'convertScriptToSourceMap';
        LOG.entry(method, context, script);

        // Create a new source map generator.
        const sourceMapGenerator = new SourceMapGenerator({ file: script.getIdentifier(), sourceRoot: process.cwd() });

        // Get the parser tokens for the script.
        const tokens = script.getTokens();

        // Add mappings for all of the tokens into the source map.
        tokens.forEach((token) => {
            sourceMapGenerator.addMapping({
                source: script.getIdentifier(),
                original: token.loc.start,
                generated: token.loc.start
            });
        });

        // Inline the contents of the script into the source map.
        sourceMapGenerator.setSourceContent(script.getIdentifier(), script.getContents());

        // Return the source map.
        const result = sourceMapGenerator.toString();
        LOG.exit(method, result);
        return result;
    }

    /**
     * Convert the specified script into a script node with a source map.
     * @param {Object} context The compiler context.
     * @param {Script} script The function declaration to process.
     * @return {SourceNode} The script node.
     */
    convertScriptToScriptNode(context, script) {
        const method = 'convertScriptToScriptNode';
        LOG.entry(method, context, script);

        // Convert the script into a source map.
        let sourceFileName = script.getIdentifier();
        let sourceCode = script.getContents();
        let sourceMap = this.convertScriptToSourceMap(context, script);

        // Allow someone else to post-process the converted script.
        const transformedScript = this.transformScript(sourceFileName, sourceCode, sourceMap);
        sourceFileName = transformedScript.sourceFileName;
        sourceCode = transformedScript.sourceCode;
        sourceMap = transformedScript.sourceMap;

        // Create a new source node from the script contents and source map
        const sourceMapConsumer = new SourceMapConsumer(sourceMap);
        const result = SourceNode.fromStringWithSourceMap(sourceCode, sourceMapConsumer);
        LOG.exit(method, result);
        return result;
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
        const result = {
            sourceFileName: sourceFileName,
            sourceCode: sourceCode,
            sourceMap: sourceMap
        };
        LOG.exit(method, result);
        return result;
    }

}

module.exports = ScriptCompiler;

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

const program = require('commander');
const protobuf = require('protobufjs');
const FileWriter = require('../FileWriter');
var path = require('path');

/**
 * Convert Google Protobuf definitions to Composer concepts
 *
 * node ./lib/codegen/protobuf.js
 * ./packages/composer-common/test/data/proto/UpdateShipment.proto -o .
 */
program
    .version('1.0')
    .description('convert Google protobuf files to Composer CTO files')
    .usage('[options] <input protobuf files ...>')
    .option('-o, --outputDir <outputDir>', 'Output directory')
    .parse(process.argv);

if (!program.args || !program.args.length) {
    program.help();
}

console.log('Output directory: ' + program.outputDir);

const protoFiles = [];

if (program.args) {
    for(let n=0; n < program.args.length; n++) {
        const protoFile = program.args[n];
        console.log('Parsing: ' + protoFile);

        protobuf.load(protoFile, function(err, root) {
            if (err) {
                throw err;
            }

            const writer = new FileWriter(program.outputDir);
            writer.openFile(path.parse(protoFile).name + '.cto');
            dump(writer, root, 0);
            writer.closeFile();
        });
    }

    console.log('Loaded ' + protoFiles.length + ' files.');
}

/**
 * Dump this object recursively
 * @param {FileWriter} writer - the FileWriter to use
 * @param {ReflectionObject} obj - the object
 * @param {Integer} indent - the indentation to use
 */
function dump(writer, obj, indent) {

    if(obj.fieldsArray) {
        writer.writeLine( indent, 'concept ' + obj.name + '{' );

        for( let n=0; n < obj.fieldsArray.length; n++ ) {
            const field = obj.fieldsArray[n];

            let optional = '';
            let array = '';

            if(field.rule === 'repeated') {
                array = '[]';
            }

            writer.writeLine( indent+1, '  o ' + toComposerType(field.type) + array + ' ' + field.name + optional );
        }

        writer.writeLine( indent, '}');
    }
    else if(obj.values) {
        writer.writeLine( indent, 'enum ' + obj.name + '{' );

        for( let n=0; n < Object.keys(obj.values).length; n++ ) {
            writer.writeLine( indent+1, '  o ' + Object.keys(obj.values)[n] );
        }

        writer.writeLine( indent, '}');
    }
    else if(obj.name){
        writer.writeLine( indent, 'namespace ' + obj.name );
    }

    if(obj.nestedArray) {
        for( let n=0; n < obj.nestedArray.length; n++ ) {
            dump(writer, obj.nestedArray[n], indent);
        }
    }
}

/**
 * Converts a Protobuf type to a Composer type
 * @param {String} protoType - the Protobuf type name
 * @return {String} the Composer type to use
 */
function toComposerType(protoType) {

    let result = protoType;
    switch(protoType) {
    case 'string':
    case 'bytes':
        result = 'String';
        break;
    case 'double':
    case 'float':
        result = 'Double';
        break;
    case 'int32':
    case 'uint32':
    case 'sint32':
    case 'fixed32':
    case 'sfixed32':
        result = 'Integer';
        break;
    case 'int64':
    case 'uint64':
    case 'sint64':
    case 'fixed64':
    case 'sfixed64':
        result = 'Long';
        break;
    case 'bool':
        result = 'Boolean';
        break;
    }

    return result;
}
#!/usr/bin/env node
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

const classopus = require('../lib/classopus');
const yargs = require('yargs');

// Standard Command yargs processing.
let results = yargs
    .option('i', {
        alias: 'input',
        demandOption: false,
        describe: 'Input JSON',
        type: 'string'
    })
    .option('o', {
        alias: 'outdir',
        demandOption: false,
        default: './out',
        describe: 'Output Directory',
        type: 'string'
    }).option('t', {
        alias: 'template',
        demandOption: false,
        default: 'default.njk',
        describe: 'Template file to use as basis for markdown',
        type: 'string'
    }).option('n', {
        alias: 'indexname',
        demandOption: false,
        default: 'bnd-opus.md',
        describe: 'Name of the generated markdown file',
        type: 'string'
    }).option('c',{
        alias: 'context',
        default : '{}',
        describe: 'Additional options to pass to the template engine\'s context',
        type: 'string'
    })
    .strict()
    .help().argv;

classopus(results);


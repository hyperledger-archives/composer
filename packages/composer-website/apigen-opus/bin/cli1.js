#!/usr/bin/env node

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


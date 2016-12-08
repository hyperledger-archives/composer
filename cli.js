#!/usr/bin/env node
/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

process.env.SUPPRESS_NO_CONFIG_WARNING = true;

const yargs = require('yargs');

yargs
    .commandDir('./lib/cmds')
    .help()
    .example('concerto network deploy\nconcerto transaction submit')
    .demand(1)
    .wrap(null)
    .epilogue('For more information: https://pages.github.ibm.com/Blockchain-WW-Labs/Concerto/reference')
    .argv;

#!/usr/bin/env node
/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Composer CLI - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

require('yargs')
    .commandDir('lib/cmds')
    .demand(1)
    .help('help')
    .strict()
    .usage('Usage: $0 <command> [options]')
    .wrap(null)
    .version()
    .argv;

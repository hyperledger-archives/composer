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

require('yargs')
    .command(require('./lib/deploy.js'))
    .demand(1)
    .help()
    .strict()
    .wrap(null)
    .argv;

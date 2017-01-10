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
let _ = require('lodash');
yargs
    .commandDir('./lib/cmds')
    .help()
    .example('concerto identity issue\nconcerto network deploy\nconcerto participant add\nconcerto transaction submit')
    .demand(1)
    .wrap(null)
    .strict()
    .epilogue('For more information: https://pages.github.ibm.com/Blockchain-WW-Labs/Concerto/reference')
    .alias('v', 'version')
    .version(function() {


        return getInfo('@ibm/ibm-concerto-cli')+'\n'+
          getInfo('@ibm/concerto-admin')+'\n'+getInfo('@ibm/concerto-client')+'\n'+
          getInfo('@ibm/concerto-common')+'\n'+getInfo('@ibm/concerto-runtime-hlf')+
          '\n'+getInfo('@ibm/concerto-connector-hlf')+'\n';


    })
    .describe('v', 'show version information')
    .argv;

/**
 * [getInfo description]
 * @param  {[type]} moduleName [description]
 * @return {[type]}            [description]
 */
function getInfo(moduleName){
    let pjson = require(moduleName+'/package.json');

    return _.padEnd(pjson.name,30) + ' v'+pjson.version;
}

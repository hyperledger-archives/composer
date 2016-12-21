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

const AclFile = require('../../lib/acl/aclfile');
const fs = require('fs');
const path = require('path');


const testAcl = fs.readFileSync(path.resolve(__dirname, './test.acl'), 'utf8');
const aclFile = new AclFile(null, testAcl);
console.log('Loaded: ' + aclFile);

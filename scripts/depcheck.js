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

'use strict';

const colors = require('colors');
const fs = require('fs');
const path = require('path');

const packages = {};

const lernaDirectory = path.resolve('.');

const masterPackageFile = path.resolve(lernaDirectory, 'package.json');
const masterPackage = require(masterPackageFile);
packages['package.json'] = masterPackage;

const packagesDirectory = path.resolve(lernaDirectory, 'packages');
const packageNames = fs.readdirSync(packagesDirectory);
packageNames.forEach((packageName) => {
    const packageFile = path.resolve(packagesDirectory, packageName, 'package.json');
    const thisPackage = require(packageFile);
    packages[packageName] = thisPackage;
});

// Not going to catch ranges but unlikely to see those anyway
const badDependencies = {};
const checkValue = function checkValue(packageIndex, dependency, currentValue) {
    if (packages[packageIndex].name === 'composer-connector-hlfv1' && dependency === 'grpc') {
        // Due to https://jira.hyperledger.org/browse/FAB-6425 we currently
        // need to relax the exact value restriction on grpc in composer-connector-hlfv1
        // The dependency and this hack should be removed as soon as we can make
        // use of the fixed version of fabric-ca-client!
        return;
    }

    if (isNaN(currentValue.slice(0,1))) {
        if (!badDependencies[packageIndex]) {
            badDependencies[packageIndex] = [];
        }
        badDependencies[packageIndex].push({ dependency: dependency, currentValue: currentValue });
    }
};

for (const packageIndex in packages) {
    const currentPackage = packages[packageIndex];
    for (const dependency in currentPackage.dependencies) {
        checkValue(packageIndex, dependency, currentPackage.dependencies[dependency]);
    }
    for (const dependency in currentPackage.devDependencies) {
        checkValue(packageIndex, dependency, currentPackage.devDependencies[dependency]);
    }
}

if (Object.keys(badDependencies).length > 0) {
    console.error('Error: there is a mismatch between the versions of the packages in this repository!\n');
    for (const i in packages) {
        if (badDependencies[i]) {
            const currentPackage = packages[i];
            console.error(`  ${i} ${currentPackage.version.green}`);
            if (badDependencies[i]) {
                badDependencies[i].forEach((badDependency) => {
                    console.error(`    ${badDependency.dependency}@${badDependency.currentValue.red} (should be exact)`);
                });
            }
        }
    }
    console.error('\n');
    process.exit(1);
} else {
    console.log('Status: no problems detected!');
}

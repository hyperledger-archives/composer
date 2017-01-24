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

const child_process = require('child_process');
const colors = require('colors');
const fs = require('fs');
const path = require('path');
const semver = require('semver')

const packages = {};
const fix = (process.argv.indexOf('--fix') !== -1);

const lernaDirectory = path.resolve('.');
const lernaConfigFile = path.resolve(lernaDirectory, 'lerna.json');
const lernaConfig = require(lernaConfigFile);
const targetVersion = lernaConfig.version;
const targetDependency = `^${targetVersion}`;
packages['lerna.json'] = lernaConfig;

if (!semver.valid(targetVersion)) {
    console.error(`Error: the version "${targetVersion}" in "${lernaConfigFile}" is invalid!`);
    process.exit(1);
}

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

let mismatch = false;
const badDependencies = {};
for (const i in packages) {
    const currentPackage = packages[i];
    if (targetVersion !== currentPackage.version) {
        mismatch = true;
        break;
    }
}

for (const i in packages) {
    const currentPackage = packages[i];
    for (const j in packages) {
        const otherPackage = packages[j];
        for (const dependency in currentPackage.dependencies) {
            const currentValue = currentPackage.dependencies[dependency];
            if (dependency === otherPackage.name) {
                if (currentValue !== targetDependency) {
                    if (!badDependencies[i]) {
                        badDependencies[i] = [];
                    }
                    badDependencies[i].push({ dependency: dependency, currentValue: currentValue });
                    mismatch = true;
                }
            }
        }
        for (const dependency in currentPackage.devDependencies) {
            const currentValue = currentPackage.devDependencies[dependency];
            if (dependency === otherPackage.name) {
                if (currentValue !== targetDependency) {
                    if (!badDependencies[i]) {
                        badDependencies[i] = [];
                    }
                    badDependencies[i].push({ dependency: dependency, currentValue: currentValue });
                    mismatch = true;
                }
            }
        }
    }
}

if (mismatch && !fix) {
    console.error('Error: there is a mismatch between the versions of the packages in this repository!\n');
    for (const i in packages) {
        const currentPackage = packages[i];
        if (targetVersion !== currentPackage.version) {
            console.error(`  ${i} ${currentPackage.version.red} (should be ${targetVersion})`);
        } else {
            console.error(`  ${i} ${currentPackage.version.green}`);
        }
        if (badDependencies[i]) {
            badDependencies[i].forEach((badDependency) => {
                console.error(`    ${badDependency.dependency}@${badDependency.currentValue.red} (should be ${targetDependency})`);
            });
        }
    }
    console.error('\n');
    console.error(`Run "scripts/pkgcheck.js --fix" inside the directory "${lernaDirectory}" to resolve this problem and change the version to "${targetVersion}"`);
    process.exit(1);
} else if (mismatch && fix) {
    const command = `lerna publish --skip-git --skip-npm --yes --repo-version ${targetVersion} --force-publish '*'`;
    console.warn(`Status: running command ${command} to fix problems ...`)
    child_process.execSync(command);
    console.warn(`Status: modifying "${masterPackageFile} to fix problems ...`);
    masterPackage.version = targetVersion;
    fs.writeFileSync(masterPackageFile, JSON.stringify(masterPackage, null, 2), 'utf8');
} else {
    console.log('Status: no problems detected!');
}

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

const fs = require('fs');
const moment = require('moment');
const path = require('path');

const timestamp = moment().format('YYYYMMDDHHmmss');

const lernaDirectory = path.resolve('.');
const lernaConfigFile = path.resolve(lernaDirectory, 'lerna.json');
const lernaConfig = require(lernaConfigFile);
lernaConfig.version.replace(/-.*/, '');
const targetVersion = lernaConfig.version + '-' + timestamp;
lernaConfig.version = targetVersion;
fs.writeFileSync(lernaConfigFile, JSON.stringify(lernaConfig, null, 2), 'utf8');

const masterPackageFile = path.resolve(lernaDirectory, 'package.json');
const masterPackage = require(masterPackageFile);
masterPackage.version = targetVersion;
fs.writeFileSync(masterPackageFile, JSON.stringify(masterPackage, null, 2), 'utf8');

const packagesDirectory = path.resolve(lernaDirectory, 'packages');
const packageNames = fs.readdirSync(packagesDirectory);
const packages = {};
packageNames.forEach((packageName) => {
    const packageFile = path.resolve(packagesDirectory, packageName, 'package.json');
    const thisPackage = require(packageFile);
    thisPackage.version = targetVersion;
    packages[packageName] = thisPackage;
});

for (const i in packages) {
    const currentPackage = packages[i];
    for (const j in packages) {
        const otherPackage = packages[j];
        for (const dependency in currentPackage.dependencies) {
            const currentValue = currentPackage.dependencies[dependency];
            if (dependency === otherPackage.name) {
                currentPackage.dependencies[dependency] = targetVersion;
            }
        }
        for (const dependency in currentPackage.devDependencies) {
            const currentValue = currentPackage.devDependencies[dependency];
            if (dependency === otherPackage.name) {
                currentPackage.devDependencies[dependency] = targetVersion;
            }
        }
    }
    const packageFile = path.resolve(packagesDirectory, i, 'package.json');
    fs.writeFileSync(packageFile, JSON.stringify(currentPackage, null, 2), 'utf8');
}
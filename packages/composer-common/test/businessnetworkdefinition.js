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

const BusinessNetworkDefinition = require('../lib/businessnetworkdefinition');
const fs = require('fs');

require('chai').should();
describe('BusinessNetworkDefinition', () => {
    let businessNetworkDefinition;

    beforeEach(() => {
        businessNetworkDefinition = new BusinessNetworkDefinition('id@1.0.0', 'description');
    });

    afterEach(() => {});

    describe('#identifier format checking', () => {

        it('should throw when no @ in identifier', () => {
            (() => {
                new BusinessNetworkDefinition('id', 'description');
            }).should.throw(/It must be "name@major.minor.micro"/);
        });

        it('should throw when invalid version in identifier', () => {
            (() => {
                new BusinessNetworkDefinition('id@1.a.b', 'description');
            }).should.throw(/Version number is invalid/);
        });

        it('should accept README', () => {
            const bnd = new BusinessNetworkDefinition('id@1.0.0', 'description', null, 'readme');
            bnd.getMetadata().getREADME().should.equal('readme');
        });
    });

    describe('#accessors', () => {

        it('should be able to get name', () => {
            businessNetworkDefinition.getName().should.equal('id');
        });

        it('should be able to get version', () => {
            businessNetworkDefinition.getVersion().should.equal('1.0.0');
        });

        it('should be able to retrieve factory', () => {
            businessNetworkDefinition.getFactory().should.not.be.null;
        });

        it('should be able to retrieve introspector', () => {
            businessNetworkDefinition.getIntrospector().should.not.be.null;
        });

        it('should be able to retrieve serializer', () => {
            businessNetworkDefinition.getSerializer().should.not.be.null;
        });

        it('should be able to retrieve script manager', () => {
            businessNetworkDefinition.getScriptManager().should.not.be.null;
        });

        it('should be able to retrieve model manager', () => {
            businessNetworkDefinition.getModelManager().should.not.be.null;
        });

        it('should be able to retrieve acl manager', () => {
            businessNetworkDefinition.getAclManager.should.not.be.null;
        });

        it('should be able to retrieve query manager', () => {
            businessNetworkDefinition.getQueryManager.should.not.be.null;
        });

        it('should be able to retrieve identifier', () => {
            businessNetworkDefinition.getIdentifier().should.not.be.null;
        });

        it('should be able to retrieve description', () => {
            businessNetworkDefinition.getDescription().should.not.be.null;
        });
    });

    describe('#archives', () => {



        it('should be able to correctly create a business network from a plain directory', () => {

            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/test-archive').then(businessNetwork => {
                businessNetwork.should.be.BusinessNetworkDefinition;
                businessNetwork.getName().should.equal('test-archive');
                businessNetwork.getVersion().should.equal('0.0.1');
                businessNetwork.getDescription().should.equal('A test business network.');
                businessNetwork.getMetadata().getREADME().should.equal('This is a test');
                businessNetwork.getMetadata().getPackageJson().customKey.should.equal('custom value');
                Object.keys(businessNetwork.modelManager.modelFiles).should.have.length(4);
                Object.keys(businessNetwork.scriptManager.scripts).should.have.length(2);
                businessNetwork.aclManager.getAclRules().should.have.length(4);
                businessNetwork.queryManager.getQueries().should.have.length(6);
                const intro = businessNetwork.getIntrospector();
                // remove system types and make sure the 25 model types are presents
                let classDecl = intro.getClassDeclarations().filter( (element) => {
                    return !element.isSystemType();
                });
                classDecl.length.should.equal(27);
                const sm = businessNetwork.getScriptManager();
                sm.getScripts().length.should.equal(2);
            });
        });

        it('should be able to detect model & logic files in folders with leading periods (.)', () => {

            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/test-archive-dotfolders').then(businessNetwork => {
                businessNetwork.should.be.BusinessNetworkDefinition;
                Object.keys(businessNetwork.modelManager.modelFiles).should.have.length(4);
                Object.keys(businessNetwork.scriptManager.scripts).should.have.length(2);

                const intro = businessNetwork.getIntrospector();

                // remove system types and make sure the 25 model types are presents
                let classDecl = intro.getClassDeclarations().filter( (element) => {
                    return !element.isSystemType();
                });

                classDecl.length.should.equal(25);
                const sm = businessNetwork.getScriptManager();
                sm.getScripts().length.should.equal(2);
            });
        });

        it('should be able to correctly create a business network from a directory using npm dependencies', () => {

            // we force an 'npm install' on the package.json
            // No we don't - we can't do this in a unit test!
            /*
            let execSync = require('child_process').execSync;
            execSync('cd ' + __dirname + '/data/zip/test-npm-archive' + ' && npm install',
              function(error, stdout, stderr) {} ); */

            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/test-npm-archive').then(businessNetwork => {
                businessNetwork.should.be.BusinessNetworkDefinition;
                businessNetwork.getName().should.equal('test-npm-archive');
                businessNetwork.getVersion().should.equal('0.0.1');
                businessNetwork.getDescription().should.equal('A test business network using npm model dependencies.');


                Object.keys(businessNetwork.modelManager.modelFiles).should.have.length(3);

                Object.keys(businessNetwork.scriptManager.scripts).should.have.length(2);

                const intro = businessNetwork.getIntrospector();
                // remove system types and make sure the 25 model types are presents
                let classDecl = intro.getClassDeclarations().filter( (element) => {
                    return !element.isSystemType();
                });
                classDecl.length.should.equal(13);
                businessNetwork.getModelManager().getModelFiles().length.should.equal(3);
                const sm = businessNetwork.getScriptManager();
                sm.getScripts().length.should.equal(2);
            });
        });

        it('should be able to store business network as a ZIP archive (using fromArchive and toArchive)', () => {
            /*
             We first need to read a ZIP and create a business network.
             After we have done this, we'll be able to create a new ZIP with the contents of the business network.
            */
            let fileName = __dirname + '/data/zip/test-archive.zip';
            let readFile = fs.readFileSync(fileName);
            return BusinessNetworkDefinition.fromArchive(readFile).then((businessNetwork) => {
                businessNetwork.should.be.BusinessNetworkDefinition;
                businessNetwork.getIdentifier().should.equal('test-archive@0.0.1');
                businessNetwork.getDescription().should.equal('A test business network.');
                businessNetwork.getMetadata().getREADME().should.equal('This is a test');
                Object.keys(businessNetwork.modelManager.modelFiles).should.have.length(4);
                Object.keys(businessNetwork.scriptManager.scripts).should.have.length(2);

                return businessNetwork.toArchive().then(buffer => {
                    buffer.should.be.Buffer;
                });
            });
        });
    });
});

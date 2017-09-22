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
const ModelFile = require('../lib/introspect/modelfile');
const fs = require('fs');
const JSZip = require('jszip');

const chai = require('chai');
const should = chai.should();
chai.use(require('chai-as-promised'));
const sinon = require('sinon');
let sandbox;

describe('BusinessNetworkDefinition', () => {
    let businessNetworkDefinition;

    beforeEach(() => {

        businessNetworkDefinition = new BusinessNetworkDefinition('id@1.0.0', 'description');
    });

    afterEach(() => {

    });

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

        it('visitor', (()=>{
            let visitor = { visit: () =>{}};
            let visitSpy = sinon.stub(visitor,'visit');
            visitSpy.returns();

            businessNetworkDefinition.accept(visitor,{});
            sinon.assert.calledOnce(visitSpy);
        }));

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

    describe('#setters', () => {

        it('should be able set a Readme', () => {
            let newReadme = 'Read the readme';
            businessNetworkDefinition.setReadme(newReadme);
            businessNetworkDefinition.getMetadata().getREADME().should.equal(newReadme);
        });

        it('should be able set packageJson', () => {
            let packageJson = {};
            packageJson.name = businessNetworkDefinition.getName();
            packageJson.version = businessNetworkDefinition.getVersion();
            packageJson.description = 'new description';
            businessNetworkDefinition.setPackageJson(packageJson);

            businessNetworkDefinition.getMetadata().getPackageJson().should.deep.equal(packageJson);
        });
    });

    describe('#usingDirectories', () => {

        beforeEach( ()=>{
            sandbox = sinon.sandbox.create();
        });

        afterEach( ()=>{sandbox.restore();});

        it('should be able to correctly create a business network from a plain directory', () => {

            let options = {};
            options.dependencyGlob = '**';
            options.modelFileGlob = '**/models/**/*.cto';
            options.scriptGlob = '**/lib/**/*.js';

            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/test-archive',options).then(businessNetwork => {
                businessNetwork.should.be.BusinessNetworkDefinition;
                businessNetwork.getName().should.equal('test-archive');
                businessNetwork.getVersion().should.equal('0.0.1');
                businessNetwork.getDescription().should.equal('A test business network.');
                businessNetwork.getMetadata().getREADME().should.equal('This is a test');
                businessNetwork.getMetadata().getPackageJson().customKey.should.equal('custom value');
                businessNetwork.modelManager.getModelFiles().filter((modelFile) => {
                    return !modelFile.isSystemModelFile();
                }).should.have.length(3);
                businessNetwork.scriptManager.getScripts().should.have.length(2);
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

        it('should be able to correctly create a business network from a plain directory - with README.md missing', () => {
            let stub = sandbox.stub(fs,'readFileSync');

            stub.withArgs(sinon.match((r)=>{return r.endsWith('README.md');}),sinon.match.any).returns(undefined);
            stub.callThrough();
            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/test-archive');
        });

        it('should be able to correctly create a business network from a plain directory - with package.json missing', () => {
            let stub = sandbox.stub(fs,'readFileSync');

            stub.withArgs(sinon.match((r)=>{
                return r.endsWith('package.json');
            }),sinon.match.any).returns(null);

            stub.callThrough();

            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/test-archive')
                  .should.be.eventually.rejectedWith(/Failed to find package.json/);
        });

        it('should be able to correctly create a business network from a plain directory - with acl/queries missing', () => {
            let stub = sandbox.stub(fs,'readFileSync');

            stub.withArgs(sinon.match((r)=>{return r.endsWith('permissions.acl');}),sinon.match.any).returns(undefined);
            stub.withArgs(sinon.match((r)=>{return r.endsWith('queries.qry');}),sinon.match.any).returns(undefined);
            stub.callThrough();
            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/test-archive');
        });

        it('should be able to correctly create a business network from a plain directory - with dependency issues #2', () => {
            let packageJSON= {
                'name': 'test-archive',
                'version': '0.0.1',
                'description': 'A test business network.',
                'customKey': 'custom value',
                'dependencies':['deps']
            };

            sandbox.stub(JSON,'parse').returns(packageJSON);

            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/test-archive')
               .should.be.eventually.rejectedWith(/npm dependency path/);

        });

        it('should be able to correctly create a business network from a plain directory - with dependency issues #1', () => {
            let packageJSON= {
                'name': 'test-archive',
                'version': '0.0.1',
                'description': 'A test business network.',
                'customKey': 'custom value',
                'dependencies':['deps']
            };

            sandbox.stub(JSON,'parse').returns(packageJSON);

            let stub = sandbox.stub(fs,'existsSync');
            stub.onCall(2).returns(true);
            stub.callThrough();
            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/test-archive')
               .should.be.eventually.rejectedWith(/no such file or directory/);

        });

        it('should be able to correctly create a business network from a plain directory - with empty archive', () => {
            let packageJSON= {
                'name': 'test-archive',
                'version': '0.0.1',
                'description': 'A test business network.',
                'customKey': 'custom value'
            };

            sandbox.stub(JSON,'parse').returns(packageJSON);


            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/empty-archive')
                .should.be.eventually.rejectedWith(/Failed to find a model file/);

        });

        it('should be able to detect model & logic files in folders with leading periods (.)', () => {

            return BusinessNetworkDefinition.fromDirectory(__dirname + '/data/zip/test-archive-dotfolders').then(businessNetwork => {
                businessNetwork.should.be.BusinessNetworkDefinition;
                businessNetwork.modelManager.getModelFiles().filter((modelFile) => {
                    return !modelFile.isSystemModelFile();
                }).should.have.length(3);
                businessNetwork.scriptManager.getScripts().should.have.length(2);

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


                businessNetwork.modelManager.getModelFiles().filter((modelFile) => {
                    return !modelFile.isSystemModelFile();
                }).should.have.length(2);
                businessNetwork.scriptManager.getScripts().should.have.length(2);

                const intro = businessNetwork.getIntrospector();
                            // remove system types and make sure the 25 model types are presents
                let classDecl = intro.getClassDeclarations().filter( (element) => {
                    return !element.isSystemType();
                });
                classDecl.length.should.equal(13);
                businessNetwork.modelManager.getModelFiles().filter((modelFile) => {
                    return !modelFile.isSystemModelFile();
                }).should.have.length(2);
                const sm = businessNetwork.getScriptManager();
                sm.getScripts().length.should.equal(2);
            });
        });


    } );

    describe('#usingArchives', () => {

        beforeEach( ()=>{
            sandbox = sinon.sandbox.create();
        });

        afterEach( ()=>{sandbox.restore();});

        it('using fromArchive and toArchive - good path all elements present', () => {
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
                businessNetwork.modelManager.getModelFiles().filter((modelFile) => {
                    return !modelFile.isSystemModelFile();
                }).should.have.length(3);
                businessNetwork.scriptManager.getScripts().should.have.length(2);

                return businessNetwork.toArchive().then(buffer => {
                    buffer.should.be.Buffer;
                });
            });
        });


        it('should be able to cope with missing readme,permissions and query files', () => {
            /*
             We first need to read a ZIP and create a business network.
             After we have done this, we'll be able to create a new ZIP with the contents of the business network.
             after removing a few things
            */
            let fileName = __dirname + '/data/zip/test-archive.zip';
            let readFile = fs.readFileSync(fileName);

            return JSZip.loadAsync(readFile).then((zip) => {
                zip.remove('README.md');
                zip.remove('permissions.acl');
                zip.remove('queries.qry');
                return zip.generateAsync({type:'nodebuffer'});
            }).then((buffer) => {
                return BusinessNetworkDefinition.fromArchive(buffer);
            }).then((businessNetwork) => {
                businessNetwork.should.be.BusinessNetworkDefinition;
                businessNetwork.getIdentifier().should.equal('test-archive@0.0.1');
                businessNetwork.getDescription().should.equal('A test business network.');
                should.not.exist(businessNetwork.getMetadata().getREADME());
                businessNetwork.modelManager.getModelFiles().filter((modelFile) => {
                    return !modelFile.isSystemModelFile();
                }).should.have.length(3);
                businessNetwork.scriptManager.getScripts().should.have.length(2);

                let mockModelFile = sinon.createStubInstance(ModelFile);
                mockModelFile.isSystemModelFile.returns(false);

                businessNetwork.modelManager.addModelFiles([mockModelFile]);
                return businessNetwork.toArchive().then(buffer => {
                    buffer.should.be.Buffer;
                });
            });

        });

        it('should fail with missing package.json', () => {
            /*
             We first need to read a ZIP and create a business network.
             After we have done this, we'll be able to create a new ZIP with the contents of the business network.
             after removing a few things
            */
            let fileName = __dirname + '/data/zip/test-archive.zip';
            let readFile = fs.readFileSync(fileName);

            return JSZip.loadAsync(readFile).then((zip) => {
                zip.remove('package.json');
                return zip.generateAsync({type:'nodebuffer'});
            }).then((buffer) => {
                return BusinessNetworkDefinition.fromArchive(buffer);
            }).should.be.eventually.rejectedWith(/package.json must exist/);

        });


    });
});

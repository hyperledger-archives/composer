/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import { SampleBusinessNetworkService } from './samplebusinessnetwork.service';
import { AlertService } from '../services/alert.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { BusinessNetworkDefinition } from 'composer-common';
import { AclFile } from 'composer-common';

import {
    HttpModule,
    Response,
    ResponseOptions,
    XHRBackend
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

describe('SampleBusinessNetworkService', () => {

    let adminMock;
    let clientMock;
    let aclFileMock;
    let alertMock;
    let businessNetworkMock = sinon.createStubInstance(BusinessNetworkDefinition);

    beforeEach(() => {
        adminMock = sinon.createStubInstance(AdminService);
        clientMock = sinon.createStubInstance(ClientService);
        aclFileMock = sinon.createStubInstance(AclFile);
        alertMock = sinon.createStubInstance(AlertService);

        TestBed.configureTestingModule({
            imports: [HttpModule],
            providers: [SampleBusinessNetworkService,
                {provide: AlertService, useValue: alertMock},
                {provide: AdminService, useValue: adminMock},
                {provide: ClientService, useValue: clientMock},
                {provide: AclFile, useValue: aclFileMock},
                {provide: XHRBackend, useClass: MockBackend}]
        });
    });

    describe('isOAuthEnabled', () => {
        it('should return true if oauth is enabled', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            let githubMock = sinon.stub(service, 'setUpGithub');

            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: true
                })));
            });

            service.isOAuthEnabled().then((result) => {
                result.should.equal(true);
            });

            tick();

            githubMock.should.not.have.been.called;

        })));

        it('should return false if oauth is not enabled', fakeAsync(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            let githubMock = sinon.stub(service, 'setUpGithub');
            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: false
                })));
            });

            service.isOAuthEnabled().then((result) => {
                result.should.equal(false);
            });

            tick();

            githubMock.should.have.been.called;
        })));

        it('should handle error', async(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            mockBackend.connections.subscribe((connection) => {
                connection.mockError(new Error('some error'));
            });

            return service.isOAuthEnabled()
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.message.should.equal('some error');
                });
        })));
    });

    describe('getGithubClientId', () => {
        it('should get the client id from the api if not already set', async(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: {clientId: 'abcde'}
                })));
            });

            return service.getGithubClientId().then((result) => {
                result.should.deep.equal({clientId: 'abcde'});
            });
        })));

        it('should get the client id from the service if already set', async(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service.CLIENT_ID = 'already set';
            return service.getGithubClientId().then((result) => {
                result.should.equal('already set');
            });
        })));

        it('should handle error', async(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            mockBackend.connections.subscribe((connection) => {
                connection.mockError(new Error('some error'));
            });

            return service.getGithubClientId()
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.message.should.equal('some error');
                });
        })));
    });

    describe('getNpmInfo', () => {
        it('should get the npm info from the api', async(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            // TODO: work out how to check the url that was called
            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: {info: 'npm info'}
                })));
            });

            return service.getNpmInfo('sampleModel').then((result) => {
                result.should.deep.equal({info: 'npm info'});
            });
        })));

        it('should handle error', async(inject([SampleBusinessNetworkService, XHRBackend], (service: SampleBusinessNetworkService, mockBackend) => {
            mockBackend.connections.subscribe((connection) => {
                connection.mockError(new Error('some error'));
            });

            return service.getNpmInfo('sampleModel')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.message.should.equal('some error');
                });
        })));
    });

    describe('isAuthenticatedWithGitHub', () => {
        it('should return true if authenticated', inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service['octo'] = {};

            let result = service.isAuthenticatedWithGitHub();
            result.should.equal(true);
        }));

        it('should return false if not authenticated', inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let result = service.isAuthenticatedWithGitHub();
            result.should.equal(false);
        }));
    });

    describe('getModelsInfo', () => {
        it('should get the info from a github sample', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let octoModelMock = {
                items: [{name: 'modelOne'}, {name: 'modeTwo'}]
            };

            let octoMock = {
                repos: sinon.stub().returns({
                    contents: sinon.stub().returns({
                        fetch: sinon.stub().returns(Promise.resolve(octoModelMock))
                    })
                })
            };

            service['octo'] = octoMock;
            let getSampleNetworkInfoMock = sinon.stub(service, 'getSampleNetworkInfo');
            service.getModelsInfo('myOwner', 'myRepository');

            tick();

            octoMock.repos.should.have.been.called;
            octoMock.repos.should.have.been.calledWith('myOwner', 'myRepository');

            getSampleNetworkInfoMock.should.have.been.calledTwice;
        })));

        it('should not get the info from a github sample if not connected to github', inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service['octo'] = null;
            service.getModelsInfo('myOwner', 'myRepository')
                .then(() => {
                    throw('Should not get here');
                })
                .catch((error) => {
                    error.should.equal('no connection to GitHub');
                });
        }));

        it('should handle 404 from not being a mono-repo', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            // TODO: when add in functionality for getting samples from other repos
            let octoMock = {
                repos: sinon.stub().returns({
                    contents: sinon.stub().returns({
                        fetch: sinon.stub().returns(Promise.reject({
                            status: 404
                        }))
                    })
                })
            };

            service['octo'] = octoMock;
            let getSampleNetworkInfoMock = sinon.stub(service, 'getSampleNetworkInfo').returns(Promise.resolve());
            service.getModelsInfo('myOwner', 'myRepository');

            tick();
        })));

        it('should handle error if error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let octoMock = {
                repos: sinon.stub().returns({
                    contents: sinon.stub().returns({
                        fetch: sinon.stub().returns(Promise.reject('some error'))
                    })
                })
            };

            service['octo'] = octoMock;
            let getSampleNetworkInfoMock = sinon.stub(service, 'getSampleNetworkInfo');
            service.getModelsInfo('myOwner', 'myRepository')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();
        })));
    });

    describe('getSampleNetworkInfo', () => {
        it('should not get the json for the sample if not connected to github', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service['octo'] = null;

            service.getSampleNetworkInfo('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('Should not get here');
                })
                .catch((error) => {
                    error.should.equal('no connection to GitHub');
                });

            tick();
        })));

        it('should get the json for the sample', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let octoJsonMock = {
                content: 'eyJuYW1lIiA6ICJib2IifQ=='
            };

            let octoMock = {
                repos: sinon.stub().returns({
                    contents: sinon.stub().returns({
                        fetch: sinon.stub().returns(Promise.resolve(octoJsonMock))
                    })
                })
            };

            service['octo'] = octoMock;
            service.getSampleNetworkInfo('myOwner', 'myRepository', 'packages/')
                .then((result) => {
                    result.should.deep.equal({name: 'bob', composerPath: 'packages/'});
                });

            tick();
        })));

        it('should handle error with json', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            // contains malformed json
            let octoJsonMock = {
                content: 'eyJuYW1lIiA6ICJib2Ii'
            };

            let octoMock = {
                repos: sinon.stub().returns({
                    contents: sinon.stub().returns({
                        fetch: sinon.stub().returns(Promise.resolve(octoJsonMock))
                    })
                })
            };

            service['octo'] = octoMock;
            service.getSampleNetworkInfo('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.message.should.equal('Unexpected end of JSON input');
                });

            tick();

        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {

            let octoMock = {
                repos: sinon.stub().returns({
                    contents: sinon.stub().returns({
                        fetch: sinon.stub().returns(Promise.reject('some error'))
                    })
                })
            };

            service['octo'] = octoMock;
            service.getSampleNetworkInfo('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();
        })));
    });

    describe('getDependencyModel', () => {
        it('should not get the model if not connected to github', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service['octo'] = null;

            service.getDependencyModel('myOwner', 'myRepository', 'myModel')
                .then(() => {
                    throw('Should not get here');
                })
                .catch((error) => {
                    error.should.equal('no connection to GitHub');
                });

            tick();
        })));

        it('should get the model for the dependency', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let modelMock = sinon.stub(service, 'getModel');

            let octoModelMock = {
                items: [{name: 'modelOne'}, {name: 'modelTwo'}]
            };

            let octoMock = {
                repos: sinon.stub().returns({
                    contents: sinon.stub().returns({
                        fetch: sinon.stub().returns(Promise.resolve(octoModelMock))
                    })
                })
            };

            service['octo'] = octoMock;

            service.getDependencyModel('myOwner', 'myRepository', 'modeltwo');

            tick();

            modelMock.should.have.been.calledWith('myOwner', 'myRepository', 'packages/modelTwo/');
        })));

        it('should get the model for the dependency with non mono-repo', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            // TODO make sure this is right when add in functionality for own github repos
            let modelMock = sinon.stub(service, 'getModel');

            let octoMock = {
                repos: sinon.stub().returns({
                    contents: sinon.stub().returns({
                        fetch: sinon.stub().returns(Promise.reject({status: 404}))
                    })
                })
            };

            service['octo'] = octoMock;

            service.getDependencyModel('myOwner', 'myRepository', 'modelTwo');

            tick();

            modelMock.should.have.been.calledWith('myOwner', 'myRepository', '');
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            // TODO make sure this is right when add in functionality for own github repos
            let modelMock = sinon.stub(service, 'getModel');

            let octoMock = {
                repos: sinon.stub().returns({
                    contents: sinon.stub().returns({
                        fetch: sinon.stub().returns(Promise.reject('some error'))
                    })
                })
            };

            service['octo'] = octoMock;

            service.getDependencyModel('myOwner', 'myRepository', 'modelTwo')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();

            modelMock.should.have.been.not.have.been.called;
        })));
    });

    describe('getModel', () => {
        it('should not get the model if not connected to github', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service['octo'] = null;

            service.getModel('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('Should not get here');
                })
                .catch((error) => {
                    error.should.equal('no connection to GitHub');
                });

            tick();
        })));

        it('should get the model', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let octoModelMock = {
                items: [{name: 'modelOne', path: 'modelOne'}]
            };

            let octoModelFileMock = {
                content: 'QSBtb2RlbCBmaWxl'
            };

            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.withArgs('packages/models').returns({
                fetch: sinon.stub().returns(Promise.resolve(octoModelMock))
            });

            repoMock.contents.withArgs('modelOne').returns({
                fetch: sinon.stub().returns(Promise.resolve(octoModelFileMock))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;

            service.getModel('myOwner', 'myRepository', 'packages/')
                .then((result) => {
                    result.length.should.equal(1);
                    result[0].should.equal('A model file');
                });

            tick();
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.withArgs('packages/models').returns({
                fetch: sinon.stub().returns(Promise.reject('some error'))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;

            service.getModel('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();
        })));
    });

    describe('getSampleNetworkDependencies', () => {
        it('should get all the dependencies', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {

            let dependencyModelMock = sinon.stub(service, 'getDependencyModel').returns([{name: 'modelOne'}, {name: 'modelTwo'}]);

            let npmInfo = {
                name: 'modelOne',
                repository: {
                    url: 'git+https://github.com/my-owner/my-models.git'
                }
            };

            let npmInfoMock = sinon.stub(service, 'getNpmInfo').returns(Promise.resolve(npmInfo));
            let dependencies = {
                modelOne: 'latest'
            };

            service.getSampleNetworkDependencies(dependencies)
                .then((result) => {
                    result[0].should.deep.equal({name: 'modelOne'});
                    result[1].should.deep.equal({name: 'modelTwo'});
                });

            tick();

            dependencyModelMock.should.have.been.calledWith('my-owner', 'my-models', 'modelOne');
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {

            let dependencyModelMock = sinon.stub(service, 'getDependencyModel');

            let npmInfoMock = sinon.stub(service, 'getNpmInfo').returns(Promise.reject('some error'));
            let dependencies = {
                modelOne: 'latest'
            };

            service.getSampleNetworkDependencies(dependencies)
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();

            dependencyModelMock.should.not.have.been.called;
        })));
    });

    describe('getScripts', () => {
        it('should not get the scripts if not connected to github', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service['octo'] = null;

            service.getScripts('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('Should not get here');
                })
                .catch((error) => {
                    error.should.equal('no connection to GitHub');
                });

            tick();
        })));

        it('should get all the scripts', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {

            let octoScriptMock = {
                items: [{path: 'scriptOne'}]
            };

            let octoScriptFileMock = {
                name: 'scriptOne',
                content: 'YSBzY3JpcHQ='
            };

            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.withArgs('packages/lib').returns({
                fetch: sinon.stub().returns(Promise.resolve(octoScriptMock))
            });

            repoMock.contents.withArgs('scriptOne').returns({
                fetch: sinon.stub().returns(Promise.resolve(octoScriptFileMock))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;
            service.getScripts('myOwner', 'myRepository', 'packages/')
                .then((result) => {
                    result.length.should.equal(1);
                    result[0].should.deep.equal({name: 'scriptOne', data: 'a script'});
                });

            tick();
        })));

        it('should handle having no scripts', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.withArgs('packages/lib').returns({
                fetch: sinon.stub().returns(Promise.reject({status: 404}))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;
            service.getScripts('myOwner', 'myRepository', 'packages/')
                .then((result) => {
                    should.not.exist(result);
                });

            tick();
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.withArgs('packages/lib').returns({
                fetch: sinon.stub().returns(Promise.reject('some error'))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;
            service.getScripts('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();
        })));
    });

    describe('getAcls', () => {
        it('should not get the acls if not connected to github', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service['octo'] = null;

            service.getAcls('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('Should not get here');
                })
                .catch((error) => {
                    error.should.equal('no connection to GitHub');
                });

            tick();
        })));

        it('should get the acls', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {

            let octoAclFileMock = {
                name: 'permissions',
                content: 'YSBwZXJtaXNzaW9ucyBmaWxl'
            };

            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.returns({
                fetch: sinon.stub().returns(Promise.resolve(octoAclFileMock))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;
            service.getAcls('myOwner', 'myRepository', 'packages/')
                .then((result) => {
                    result.should.deep.equal({name: 'permissions', data: 'a permissions file'});
                });

            tick();
        })));

        it('should handle having no permissions', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.returns({
                fetch: sinon.stub().returns(Promise.reject({status: 404}))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;
            service.getAcls('myOwner', 'myRepository', 'packages/')
                .then((result) => {
                    should.not.exist(result);
                });

            tick();
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.returns({
                fetch: sinon.stub().returns(Promise.reject('some error'))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;
            service.getAcls('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();
        })));
    });

    describe('getReadme', () => {
        it('should not get the readme if not connected to github', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            service['octo'] = null;

            service.getReadme('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('Should not get here');
                })
                .catch((error) => {
                    error.should.equal('no connection to GitHub');
                });

            tick();
        })));

        it('should get the readme', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {

            let octoReadmeFileMock = {
                name: 'README.md',
                content: 'YSByZWFkbWUgZmlsZQ=='
            };

            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.returns({
                fetch: sinon.stub().returns(Promise.resolve(octoReadmeFileMock))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;
            service.getReadme('myOwner', 'myRepository', 'packages/')
                .then((result) => {
                    result.should.deep.equal({name: 'README.md', data: 'a readme file'});
                });

            tick();
        })));

        it('should handle having no readme', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.returns({
                fetch: sinon.stub().returns(Promise.reject({status: 404}))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;
            service.getReadme('myOwner', 'myRepository', 'packages/')
                .then((result) => {
                    should.not.exist(result);
                });

            tick();
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let repoMock = {
                contents: sinon.stub()
            };

            repoMock.contents.returns({
                fetch: sinon.stub().returns(Promise.reject('some error'))
            });

            let octoMock = {
                repos: sinon.stub().returns(repoMock)
            };

            service['octo'] = octoMock;
            service.getReadme('myOwner', 'myRepository', 'packages/')
                .then(() => {
                    throw('should not get here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            tick();
        })));
    });

    describe('deploySample', () => {
        let mockBusinessNetwork;
        let deployMock;

        beforeEach(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            deployMock = sinon.stub(service, 'deployBusinessNetwork');

            let createAclMock = sinon.stub(service, 'createAclFileInstance');

            createAclMock.returns({});

            let createBusinessNetworkMock = sinon.stub(service, 'createBusinessNetworkInstance');

            mockBusinessNetwork = {
                getModelManager: sinon.stub(),
                getScriptManager: sinon.stub(),
                getAclManager: sinon.stub()
            };

            mockBusinessNetwork.getModelManager.returns({addModelFiles: sinon.stub()});
            mockBusinessNetwork.getScriptManager.returns({addScript: sinon.stub(), createScript: sinon.stub()});
            mockBusinessNetwork.getAclManager.returns({setAclFile: sinon.stub()});

            createBusinessNetworkMock.returns(mockBusinessNetwork);
        }));

        it('should deploy a sample', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let chosenNetwork = {
                name: 'bob',
                composerPath: 'packages/'
            };

            let owner = 'myOwner';
            let repo = 'myRepo';

            let modelMock = sinon.stub(service, 'getModel').returns(Promise.resolve([{}]));
            let scriptMock = sinon.stub(service, 'getScripts').returns(Promise.resolve([{
                name: 'script',
                data: 'my script'
            }]));
            let aclMock = sinon.stub(service, 'getAcls').returns(Promise.resolve({
                name: 'permissions',
                data: 'my permissions'
            }));
            let readmeMock = sinon.stub(service, 'getReadme').returns(Promise.resolve({}));
            let sampleInfoMock = sinon.stub(service, 'getSampleNetworkInfo').returns(Promise.resolve({}));

            alertMock.busyStatus$ = {next: sinon.stub()};

            service.deploySample(owner, repo, chosenNetwork);

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Deploying business network',
                text: 'deploying bob'
            });

            tick();

            modelMock.should.have.been.calledWith(owner, repo, 'packages/');
            scriptMock.should.have.been.calledWith(owner, repo, 'packages/');
            aclMock.should.have.been.calledWith(owner, repo, 'packages/');
            readmeMock.should.have.been.calledWith(owner, repo, 'packages/');
            sampleInfoMock.should.have.been.calledWith(owner, repo, 'packages/');

            mockBusinessNetwork.getModelManager.should.have.been.called;
            mockBusinessNetwork.getScriptManager.should.have.been.called;
            mockBusinessNetwork.getAclManager.should.have.been.called;

            deployMock.should.have.been.called;
        })));

        it('should deploy a sample with dependency', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let chosenNetwork = {
                name: 'bob',
                composerPath: 'packages/',
                dependencies: 'myModel'
            };

            let owner = 'myOwner';
            let repo = 'myRepo';

            let modelMock = sinon.stub(service, 'getSampleNetworkDependencies').returns(Promise.resolve([{}]));
            let scriptMock = sinon.stub(service, 'getScripts').returns(Promise.resolve([{
                name: 'script',
                data: 'my script'
            }]));
            let aclMock = sinon.stub(service, 'getAcls').returns(Promise.resolve({
                name: 'permissions',
                data: 'my permissions'
            }));
            let readmeMock = sinon.stub(service, 'getReadme').returns(Promise.resolve({}));
            let sampleInfoMock = sinon.stub(service, 'getSampleNetworkInfo').returns(Promise.resolve({}));

            alertMock.busyStatus$ = {next: sinon.stub()};

            service.deploySample(owner, repo, chosenNetwork);

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Deploying business network',
                text: 'deploying bob'
            });

            tick();

            modelMock.should.have.been.calledWith('myModel');
            scriptMock.should.have.been.calledWith(owner, repo, 'packages/');
            aclMock.should.have.been.calledWith(owner, repo, 'packages/');
            readmeMock.should.have.been.calledWith(owner, repo, 'packages/');
            sampleInfoMock.should.have.been.calledWith(owner, repo, 'packages/');

            mockBusinessNetwork.getModelManager.should.have.been.called;
            mockBusinessNetwork.getScriptManager.should.have.been.called;
            mockBusinessNetwork.getAclManager.should.have.been.called;

            deployMock.should.have.been.called;
        })));

        it('should deploy a sample with no acl', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            let chosenNetwork = {
                name: 'bob',
                composerPath: 'packages/'
            };

            let owner = 'myOwner';
            let repo = 'myRepo';

            let modelMock = sinon.stub(service, 'getModel').returns(Promise.resolve([{}]));
            let scriptMock = sinon.stub(service, 'getScripts').returns(Promise.resolve([{
                name: 'script',
                data: 'my script'
            }]));
            let aclMock = sinon.stub(service, 'getAcls').returns(Promise.resolve());

            let readmeMock = sinon.stub(service, 'getReadme').returns(Promise.resolve({}));
            let sampleInfoMock = sinon.stub(service, 'getSampleNetworkInfo').returns(Promise.resolve({}));

            alertMock.busyStatus$ = {next: sinon.stub()};

            service.deploySample(owner, repo, chosenNetwork);

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Deploying business network',
                text: 'deploying bob'
            });

            tick();

            modelMock.should.have.been.calledWith(owner, repo, 'packages/');
            scriptMock.should.have.been.calledWith(owner, repo, 'packages/');
            aclMock.should.have.been.calledWith(owner, repo, 'packages/');
            readmeMock.should.have.been.calledWith(owner, repo, 'packages/');
            sampleInfoMock.should.have.been.calledWith(owner, repo, 'packages/');

            mockBusinessNetwork.getModelManager.should.have.been.called;
            mockBusinessNetwork.getScriptManager.should.have.been.called;
            mockBusinessNetwork.getAclManager.should.not.have.been.called;

            deployMock.should.have.been.called;
        })));
    });

    describe('deployBusinessNetworkDefinition', () => {
        it('should deploy the business network definition', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.update.returns(Promise.resolve());
            clientMock.refresh.returns(Promise.resolve());

            alertMock.busyStatus$ = {next: sinon.stub()};

            service.deployBusinessNetwork(businessNetworkMock);

            tick();

            adminMock.update.should.have.been.called;
            clientMock.refresh.should.have.been.called;
            clientMock.reset.should.have.been.called;
            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (service: SampleBusinessNetworkService) => {
            adminMock.update.returns(Promise.reject('some error'));

            alertMock.busyStatus$ = {next: sinon.stub()};

            service.deployBusinessNetwork(businessNetworkMock).then(() => {
                throw('should not get here');
            })
                .catch((error) => {
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                    error.should.equal('some error');
                });

            tick();
        })));
    });
});

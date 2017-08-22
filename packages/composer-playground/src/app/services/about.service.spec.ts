/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import { AboutService } from './about.service';
import {
    HttpModule,
    Response,
    ResponseOptions,
    XHRBackend
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import * as sinon from 'sinon';

const mockResponse = {
    name: 'composer-playground',
    version: '1',
    dependencies: {
        'composer-admin': {
            version: '2'
        },
        'composer-client': {
            version: '3'
        },
        'composer-common': {
            version: '4'
        }
    }
};

const expectedResponse = {
    playground: {
        name: 'playground',
        version: '1'
    },
    common: {
        name: 'composer-common',
        version: '2'
    },
    client: {
        name: 'composer-client',
        version: '3'
    },
    admin: {
        name: 'composer-admin',
        version: '4'
    }
};

describe('AboutService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpModule],
            providers: [
                AboutService,
                {provide: XHRBackend, useClass: MockBackend}
            ]
        });
    });

    it('it should make an http call to retrieve the json that shows the versions',
        async(inject([AboutService, XHRBackend], (aboutService, mockBackend) => {
            // setup a mocked response
            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: JSON.stringify(mockResponse)
                })));
            });

            // make the call to the service which was injected
            return aboutService.getVersions()
                .then((versions) => {
                    versions.playground.name.should.equal('playground');
                    versions.playground.version.should.equal('1');
                    versions.admin.name.should.equal('composer-admin');
                    versions.admin.version.should.equal('2');
                    versions.client.name.should.equal('composer-client');
                    versions.client.version.should.equal('3');
                    versions.common.name.should.equal('composer-common');
                    versions.common.version.should.equal('4');
                });
        })));

    it('should enter catch block', async(inject([AboutService, XHRBackend], (aboutService, mockBackend) => {
        mockBackend.connections.subscribe(
            (connection) => {
                connection.mockError(new Error('error'));
            }
        );

        return aboutService.getVersions()
            .then(() => {
                // Ignore this
            })
            .catch((error) => {
                error.message.should.equal('error');
            });
    })));

    it('should return the version if already set', fakeAsync(inject([AboutService, XHRBackend], (aboutService, mockBackend) => {
        aboutService['versions'] = {version: 'myVersion'};

        let getModulesStub = sinon.stub(aboutService, 'getModules');

        aboutService.getVersions().then((result) => {
            result.should.deep.equal({version: 'myVersion'});
        });

        tick();
    })));
});

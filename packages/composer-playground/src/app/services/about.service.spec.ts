/* tslint:disable:no-unused-variable */
import { TestBed, async, inject } from '@angular/core/testing';
import { AboutService } from './about.service';
import {
  HttpModule,
  Http,
  Response,
  ResponseOptions,
  XHRBackend
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

const mockResponse = {
    'name': 'composer-playground',
    'version': '1',
    'dependencies': {
         'composer-admin': {
            'version': '2'
        },
        'composer-client': {
            'version': '3'
        },
        'composer-common': {
            'version': '4'
        }
    }
};

const expectedResponse = {
          'playground': {
            name: 'playground',
            version: '1'
          },
          'common': {
            name: 'composer-common',
            version: '2'
          },
          'client': {
            name: 'composer-client',
            version: '3'
          },
          'admin': {
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
                          { provide: XHRBackend, useClass: MockBackend }
                       ]
        });   
    });

    it ('it should make an http call to retrieve the json that shows the versions', 
          async(inject([AboutService, XHRBackend], (aboutService, mockBackend) => {
          // setup a mocked response
          mockBackend.connections.subscribe((connection) => {
              connection.mockRespond(new Response(new ResponseOptions({
                body: mockResponse
              })));
          });

          // make the call to the service which was injected
          let result = aboutService.getVersions()
            .then((versions) => {
                expect(versions.playground.name).toBe('playground');
                expect(versions.playground.version).toBe('1');
                expect(versions.admin.name).toBe('composer-admin');
                expect(versions.admin.version).toBe('2');
                expect(versions.client.name).toBe('composer-client');
                expect(versions.client.version).toBe('3');
                expect(versions.common.name).toBe('composer-common');
                expect(versions.common.version).toBe('4');
            });
            return result;
    })));
});

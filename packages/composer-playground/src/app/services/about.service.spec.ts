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
          inject([AboutService, XHRBackend], (aboutService, mockBackend) =>  {

          // setup a mocked response
          mockBackend.connections.subscribe((connection) => {
              connection.mockRespond(new Response(new ResponseOptions({
                body: JSON.stringify(mockResponse)
              })));
          });

          // make the call to the service which was injected
          aboutService.getVersions()
            .then((versions) => {
                expect(versions).toBe(mockResponse);
            });
    }));

});

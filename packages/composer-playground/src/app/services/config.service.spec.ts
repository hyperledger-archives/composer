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
/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import {
    HttpModule,
    Response,
    ResponseOptions,
    XHRBackend
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { ConfigService } from './config.service';
import { Config } from './config/configStructure.service';
import { IdCard } from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

describe('ConfigService', () => {

    let mockConfig;

    beforeEach(() => {
        mockConfig = sinon.createStubInstance(Config);
        TestBed.configureTestingModule({
            imports: [HttpModule],
            providers: [
                ConfigService,
                {provide: XHRBackend, useClass: MockBackend}
            ]
        });
    });

    describe('loadConfig', () => {
        it('should load config', fakeAsync(inject([ConfigService, XHRBackend], (service: ConfigService, mockBackend) => {
            let myConfig = new Config();
            myConfig.webonly = true;
            myConfig.title = 'My Title';
            myConfig.banner = ['My', 'Banner'];
            myConfig.links = {
              docs: 'My Docs',
              tutorial: 'My Tutorial',
              community: 'My Community',
              github: 'My Github',
              install: 'My Install',
              legal: 'My License'
            };

            // setup a mocked response
            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: JSON.stringify(myConfig)
                })));
            });

            service.loadConfig().then((config) => {
                config.should.deep.equal(myConfig);
            });
            tick();
        })));
    });

    describe('getConfig', () => {
        it('should throw if not initialized', fakeAsync(inject([ConfigService], (service: ConfigService) => {
            (() => {
                service.getConfig();
            }).should.throw(/config has not been loaded/);
        })));

        it('should return the config if initialized', fakeAsync(inject([ConfigService], (service: ConfigService) => {
            service['configLoaded'] = true;
            service['config'] = mockConfig;
            service.getConfig().should.deep.equal(mockConfig);
        })));
    });

    describe('isWebOnly', () => {
        it('should throw if not initialized', fakeAsync(inject([ConfigService], (service: ConfigService) => {
            (() => {
                service.isWebOnly();
            }).should.throw(/config has not been loaded/);
        })));

        it('should return true if web only', fakeAsync(inject([ConfigService], (service: ConfigService) => {
            service['configLoaded'] = true;
            service['config'] = mockConfig;
            service['config'].webonly = true;
            let result = service.isWebOnly();

            result.should.equal(true);
        })));

        it('should return false if not web only', fakeAsync(inject([ConfigService], (service: ConfigService) => {
            service['configLoaded'] = true;
            service['config'] = mockConfig;
            service['config'].webonly = false;
            let result = service.isWebOnly();

            result.should.equal(false);
        })));
    });
})
;

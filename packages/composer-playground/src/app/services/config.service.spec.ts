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
import { IdCard } from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

describe('ConfigService', () => {

    let mockConfig = {
        cards: [
            {
                metadata: {
                    name: 'PeerAdmin',
                    enrollmentId: 'PeerAdmin',
                    enrollmentSecret: 'NOTUSED',
                    roles: [
                        'PeerAdmin',
                        'ChannelAdmin'
                    ]
                },
                connectionProfile: {
                    name: 'hlfabric',
                    description: 'Hyperledger Fabric v1.0',
                    type: 'hlfv1',
                    keyValStore: '/home/composer/.composer-credentials',
                    timeout: 300,
                    orderers: [
                        {
                            url: 'grpc://orderer.example.com:7050'
                        }
                    ],
                    channel: 'composerchannel',
                    mspID: 'Org1MSP',
                    ca: {
                        url: 'http://ca.org1.example.com:7054',
                        name: 'ca.org1.example.com'
                    },
                    peers: [
                        {
                            requestURL: 'grpc://peer0.org1.example.com:7051',
                            eventURL: 'grpc://peer0.org1.example.com:7053'
                        }
                    ]
                },
                credentials: null
            }
        ]
    };

    beforeEach(() => {
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
            // setup a mocked response
            mockBackend.connections.subscribe((connection) => {
                connection.mockRespond(new Response(new ResponseOptions({
                    body: JSON.stringify(mockConfig)
                })));
            });

            service.loadConfig().then((config) => {
                config.should.deep.equal(mockConfig);
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

        it('should return false if web only', fakeAsync(inject([ConfigService], (service: ConfigService) => {
            service['configLoaded'] = true;
            let result = service.isWebOnly();
            tick();
            result.should.equal(false);
        })));

        it('should return true if not web only', fakeAsync(inject([ConfigService], (service: ConfigService) => {
            service['configLoaded'] = true;
            service['config'] = {webonly: true};
            let result = service.isWebOnly();
            tick();
            result.should.equal(true);
        })));
    });
})
;

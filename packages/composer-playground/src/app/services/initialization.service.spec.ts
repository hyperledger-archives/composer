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
import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import {
    HttpModule,
    XHRBackend
} from '@angular/http';
import { MockBackend } from '@angular/http/testing';

import { InitializationService } from './initialization.service';

import { ClientService } from './client.service';
import { AlertService } from '../basic-modals/alert.service';
import { ConfigService } from './config.service';
import { IdCard } from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import { IdentityCardService } from './identity-card.service';

describe('InitializationService', () => {

    let mockConfig = {
        cards: [
            {
                metadata: {
                    userName: 'PeerAdmin',
                    enrollmentId: 'PeerAdmin',
                    enrollmentSecret: 'NOTUSED',
                    roles: [
                        'PeerAdmin',
                        'ChannelAdmin'
                    ]
                },
                connectionProfile: {
                    'name': 'hlfabric',
                    'description': 'Hyperledger Fabric v1.0',
                    'x-type': 'hlfv1',
                    'keyValStore': '/home/composer/.composer-credentials',
                    'timeout': 300,
                    'orderers': [
                        {
                            url: 'grpc://orderer.example.com:7050'
                        }
                    ],
                    'channel': 'composerchannel',
                    'mspID': 'Org1MSP',
                    'ca': {
                        url: 'http://ca.org1.example.com:7054',
                        name: 'ca.org1.example.com'
                    },
                    'peers': [
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

    let mockClientService;
    let mockAlertService;
    let mockIdentityCardService;
    let mockConfigService;

    beforeEach(() => {

        mockClientService = sinon.createStubInstance(ClientService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockConfigService = sinon.createStubInstance(ConfigService);

        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        TestBed.configureTestingModule({
            imports: [HttpModule],
            providers: [
                InitializationService,
                {provide: ClientService, useValue: mockClientService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: IdentityCardService, useValue: mockIdentityCardService},
                {provide: XHRBackend, useClass: MockBackend},
                {provide: ConfigService, useValue: mockConfigService}
            ]
        });
    });

    describe('initialize', () => {
        it('should return if initialized', fakeAsync(inject([InitializationService], (service: InitializationService) => {

            service['initialized'] = true;
            let result = service.initialize();
            tick();
            result.should.deep.equal(Promise.resolve());

        })));

        it('should return initialized promise', fakeAsync(inject([InitializationService], (service: InitializationService) => {

            service['initializingPromise'] = Promise.resolve();
            let result = service.initialize();
            tick();
            result.should.deep.equal(Promise.resolve());
        })));

        it('should initialize', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            mockConfigService.loadConfig.returns(Promise.resolve({}));

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());

            mockIdentityCardService.addInitialIdentityCards.returns(Promise.resolve(['cardRef']));

            service.initialize();

            tick();
            mockConfigService.loadConfig.should.be.called;

            mockIdentityCardService.loadIdentityCards.should.have.been.called;
            mockIdentityCardService.addInitialIdentityCards.should.have.been.called;
        })));

        it('should initialize with config data', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            mockConfigService.loadConfig.returns(Promise.resolve(mockConfig));

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());

            mockIdentityCardService.addInitialIdentityCards.returns(Promise.resolve(['cardRef']));

            service.initialize();

            tick();
            mockConfigService.loadConfig.should.be.called;

            mockIdentityCardService.loadIdentityCards.should.have.been.called;
            mockIdentityCardService.addInitialIdentityCards.should.have.been.calledWith([sinon.match.instanceOf(IdCard)]);
        })));

        it('should handle errors and revert to uninitialized state', fakeAsync(inject([InitializationService], (service: InitializationService) => {

            mockConfigService.loadConfig.throws();

            mockIdentityCardService.loadIdentityCards.returns(Promise.resolve());

            service.initialize();
            tick();

            mockAlertService.errorStatus$.next.should.have.been.called;
            service['initialized'].should.be.false;

            sinon.restore(mockConfigService.loadConfig);
        })));
    });
});

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

import { InitializationService } from './initialization.service';

import { AdminService } from './admin.service';
import { ClientService } from './client.service';
import { AlertService } from './alert.service';
import { ConnectionProfileService } from './connectionprofile.service';
import { WalletService } from './wallet.service';
import { FileWallet } from 'composer-common';
import { SampleBusinessNetworkService } from './samplebusinessnetwork.service';

import * as sinon from 'sinon';

describe('InitializationService', () => {

    let mockAdminService;
    let mockClientService;
    let mockSampleBusinessNetworkService;
    let mockAlertService;
    let mockConnectionProfileService;
    let mockWalletService;

    beforeEach(() => {

        mockAdminService = sinon.createStubInstance(AdminService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockSampleBusinessNetworkService = sinon.createStubInstance(SampleBusinessNetworkService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockWalletService = sinon.createStubInstance(WalletService);

        TestBed.configureTestingModule({
            imports: [HttpModule],
            providers: [
                InitializationService,
                {provide: AdminService, useValue: mockAdminService},
                {provide: ClientService, useValue: mockClientService},
                {provide: SampleBusinessNetworkService, useValue: mockSampleBusinessNetworkService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: WalletService, useValue: mockWalletService},
                {provide: XHRBackend, useClass: MockBackend}
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

        it('should initialize and deploy sample', fakeAsync(inject([InitializationService], (service: InitializationService) => {

            let stubLoadConfig = sinon.stub(service, 'loadConfig');
            stubLoadConfig.returns(Promise.resolve({}));

            let stubCreateInitialProfiles = sinon.stub(service, 'createInitialProfiles');
            stubCreateInitialProfiles.returns(Promise.resolve());

            let stubCreateInitialIdentities = sinon.stub(service, 'createInitialIdentities');
            stubCreateInitialIdentities.returns(Promise.resolve());
            mockAdminService.ensureConnected.returns(Promise.resolve());
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockAdminService.isInitialDeploy.returns(true);
            mockSampleBusinessNetworkService.deployInitialSample.returns(Promise.resolve());

            mockAlertService.busyStatus$ = {next: sinon.stub()};

            service.initialize();

            tick();
            stubLoadConfig.should.be.called;

            stubCreateInitialProfiles.should.be.called;
            stubCreateInitialIdentities.should.be.called;
            mockAdminService.ensureConnected.should.be.called;
            mockClientService.ensureConnected.should.be.called;
            mockAdminService.isInitialDeploy.should.be.called;
            mockSampleBusinessNetworkService.deployInitialSample.should.be.called;

        })));

        it('should initialize and continue if sample is already deployed', fakeAsync(inject([InitializationService], (service: InitializationService) => {

            let stubLoadConfig = sinon.stub(service, 'loadConfig');
            stubLoadConfig.returns(Promise.resolve({}));

            let stubCreateInitialProfiles = sinon.stub(service, 'createInitialProfiles');
            stubCreateInitialProfiles.returns(Promise.resolve());

            let stubCreateInitialIdentities = sinon.stub(service, 'createInitialIdentities');
            stubCreateInitialIdentities.returns(Promise.resolve());
            mockAdminService.ensureConnected.returns(Promise.resolve());
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockAdminService.isInitialDeploy.returns(false);

            mockAlertService.busyStatus$ = {next: sinon.stub()};
            mockAlertService.errorStatus$ = {next: sinon.stub()};

            service.initialize();

            tick();

            stubLoadConfig.should.be.called;
            stubCreateInitialProfiles.should.be.called;
            stubCreateInitialIdentities.should.be.called;
            mockAdminService.ensureConnected.should.be.called;
            mockClientService.ensureConnected.should.be.called;
            mockAdminService.isInitialDeploy.should.be.called;

        })));

        it('should handle errors and revert to uninitialized state', fakeAsync(inject([InitializationService], (service: InitializationService) => {

            let loadConfigStub = sinon.stub(service, 'loadConfig').throws();

            mockAlertService.busyStatus$ = {next: sinon.stub()};
            mockAlertService.errorStatus$ = {next: sinon.stub()};

            service.initialize();
            tick();

            mockAlertService.errorStatus$.next.should.be.called;
            service['initialized'].should.be.false;

            sinon.restore(service.loadConfig);
        })));
    });

    describe('loadConfig', () => {
        it('should load config', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            async(inject([InitializationService, XHRBackend], (aboutService, mockBackend) => {
                // setup a mocked response
                mockBackend.connections.subscribe((connection) => {
                    connection.mockRespond(new Response(new ResponseOptions({
                        body: JSON.stringify({})
                    })));
                });

                service.loadConfig();
                tick();
            }));
        })));
    });

    describe('createInitialProfiles', () => {
        it('should get initial profile', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            mockConnectionProfileService.getProfile.returns(Promise.resolve());
            mockConnectionProfileService.createDefaultProfile.returns(Promise.resolve());
            service['config'] = {connectionProfiles: [{profile1: {name: 'profile1', type: 'hlf'}}, {profile2: {name: 'profile2', type: 'hlf'}}]};
            service.createInitialProfiles();
            tick();
            mockConnectionProfileService.getProfile.should.be.called;
        })));

        it('should create initial profile if it doesnt exist', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            mockConnectionProfileService.getProfile.returns(Promise.reject(''));
            mockConnectionProfileService.createDefaultProfile.returns(Promise.resolve());
            service['config'] = {connectionProfiles: [{profile1: {name: 'profile1', type: 'hlf'}}]};
            service.createInitialProfiles();

            tick();

            mockConnectionProfileService.getProfile.should.be.called;
            mockConnectionProfileService.createProfile.should.be.calledWith('0', {'profile1': {name: 'profile1', type: 'hlf'}});
        })));
    });

    describe('createInitialIdentities', () => {

        it('should get initial identities', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            service['config'] = {credentials: [{profile1: {name: 'profile1', type: 'hlf'}}]};
            const fileWalletStub = sinon.createStubInstance(FileWallet);
            fileWalletStub.get.returns(Promise.resolve());
            fileWalletStub.add.returns(Promise.resolve());
            mockWalletService.getWallet.returns(fileWalletStub);
            service.createInitialIdentities();

            tick();

            fileWalletStub.get.should.be.called;
        })));

        it('should create initial identities if it doesnt exist', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            service['config'] = {credentials: [{profile1: {name: 'profile1', type: 'hlf'}}]};
            const fileWalletStub = sinon.createStubInstance(FileWallet);
            fileWalletStub.get.returns(Promise.reject('Error'));
            fileWalletStub.add.returns(Promise.resolve());
            mockWalletService.getWallet.returns(fileWalletStub);
            service.createInitialIdentities();

            tick();

            fileWalletStub.get.should.be.called;
            fileWalletStub.add.should.be.calledWith('profile1', {name: 'profile1', type: 'hlf'});
        })));
    });

    describe('isWebOnly', () => {
        it('should return false if web only', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            let result = service.isWebOnly();
            tick();
            result.should.equal(false);
        })));

        it('should return true if not web only', fakeAsync(inject([InitializationService], (service: InitializationService) => {
            service['config'] = {webonly: true};
            let result = service.isWebOnly();
            tick();
            result.should.equal(true);
        })));
    });
});

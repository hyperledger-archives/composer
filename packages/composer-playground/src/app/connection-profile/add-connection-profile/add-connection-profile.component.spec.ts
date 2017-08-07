/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, async, fakeAsync, tick, inject } from '@angular/core/testing';
import { Input, Output, Directive, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { AddConnectionProfileComponent } from './add-connection-profile.component';

import { BusinessNetworkDefinition, AdminConnection } from 'composer-admin';
import { AlertService } from '../../basic-modals/alert.service';
import { AdminService } from '../../services/admin.service';
import { ConnectionProfileService } from '../../services/connectionprofile.service';
import { IdentityService } from '../../services/identity.service';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

import * as sinon from 'sinon';
import { expect } from 'chai';

describe('AddConnectionProfileComponent', () => {

    let component: AddConnectionProfileComponent;
    let fixture: ComponentFixture<AddConnectionProfileComponent>;

    let mockConnectionProfileService;
    let mockIdentityService;
    let mockAlertService;

    beforeEach(() => {

        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockIdentityService = sinon.createStubInstance(IdentityService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        TestBed.configureTestingModule({
            declarations: [
                AddConnectionProfileComponent
            ],
            imports: [
                FormsModule
            ],
            providers: [
                {provide: AlertService, useValue: mockAlertService},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: IdentityService, useValue: mockIdentityService}
            ]
        });

        fixture = TestBed.createComponent(AddConnectionProfileComponent);
        component = fixture.componentInstance;
    });

    describe('#ngOnInit', () => {
        it('should call updateConnectionProfiles', () => {
            let updateConnectionProfilesStub = sinon.stub(component, 'updateConnectionProfiles');

            component['ngOnInit']();

            updateConnectionProfilesStub.should.have.been.called;
        });
    });

    describe('updateConnectionProfiles', () => {
        it('should update all connection profiles', fakeAsync(() => {
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve({myProfile: {name: 'myProfile'}}));

            mockIdentityService.getIdentities.returns(Promise.resolve(['bob']));

            component.updateConnectionProfiles();

            tick();
            mockConnectionProfileService.getAllProfiles.should.have.been.called;
            mockIdentityService.getIdentities.should.have.been.calledWith('myProfile');
            component['connectionProfiles'].should.deep.equal([{
                name: 'myProfile',
                profile: {name: 'myProfile'},
                default: false,
                description: 'Default connection profile',
                identities: [{
                    userId: 'bob',
                    businessNetwork: 'org-acme-biznet'
                }]
            }]);
        }));
    });

    describe('#generateProfileName', () => {
        it('should generate a base name', () => {
            component['generateProfileName']().should.equal('New Connection Profile');
        });

        it('should generate an incremented base name if one exists already', () => {
            component['connectionProfiles'] = ['New Connection Profile', 'New Connection Profile1'];
            component['generateProfileName']().should.equal('New Connection Profile2');
        });

        it('should generate an incremented base name accounting for skipped indicies', () => {
            component['connectionProfiles'] = ['New Connection Profile', 'New Connection Profile1', 'New Connection Profile2', 'New Connection Profile4'];
            component['generateProfileName']().should.equal('New Connection Profile3');
        });
    });

    describe('#retrieveConnectionProfileByName', () => {
        it('should retrieve a profile by name if it exists', fakeAsync(() => {
            let myProfile = {myProfile: {profile: 'myProfile'}};
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve(myProfile));

            component['retrieveConnectionProfileByName']('myProfile')
            .then((result) => {
                result.should.deep.equal({profile: 'myProfile'});
            })
            .catch((error) => {
                fail('should not error');
            });
        }));

        it('should return an error if a profile by name does not exist', fakeAsync(() => {
            let myProfile = [{myProfile: {name: 'myProfile'}}];
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve(myProfile));
            component['retrieveConnectionProfileByName']('notThisProfile')
            .then((result) => {
                fail('should throw error');
            })
            .catch((error) => {
                error.toString().should.equal('Error: Unknown connection profile name: notThisProfile');
            });
        }));

    });

    describe('#setConnectionProfile', () => {
        it('should be able to set default v1 profile', fakeAsync(() => {
            let updateConnectionProfilesStub = sinon.stub(component, 'updateConnectionProfiles');
            updateConnectionProfilesStub.returns(Promise.resolve({}));

            component.setConnectionProfile('_$v1');

            tick();

            let profile = { description: 'A description for a V1 Profile',
                            type: 'hlfv1',
                            orderers: [{
                                        url: 'grpc://localhost:7050',
                                        cert: ''
                                        }],
                            ca: {
                                    url: 'http://localhost:7054',
                                    name: ''
                                },
                            peers: [{
                                        requestURL: 'grpc://localhost:7051',
                                        eventURL: 'grpc://localhost:7053',
                                        cert: ''
                                    }],
                            keyValStore: '/tmp/keyValStore',
                            channel: 'composerchannel',
                            mspID: 'Org1MSP',
                            timeout: 300
                        };

            let expectedConstruct = {name: 'New Connection Profile',
                                     profile: profile,
                                     default: false };

            component['connectionProfile'].should.deep.equal(expectedConstruct);
        }));

        it('should be able to set default v0.6 profile', fakeAsync(() => {
            let updateConnectionProfilesStub = sinon.stub(component, 'updateConnectionProfiles');
            updateConnectionProfilesStub.returns(Promise.resolve({}));

            component.setConnectionProfile('_$v06');

            tick();

            let profile = {
                            description: 'A description for a V0.6 Profile',
                            type: 'hlf',
                            membershipServicesURL: 'grpc://localhost:7054',
                            peerURL: 'grpc://localhost:7051',
                            eventHubURL: 'grpc://localhost:7053',
                            keyValStore: '/tmp/keyValStore',
                            deployWaitTime: 5 * 60,
                            invokeWaitTime: 30,
                            certificate: null,
                            certificatePath: null
                        };

            let expectedConstruct = {name: 'New Connection Profile',
                                     profile: profile,
                                     default: false };

            component['connectionProfile'].should.deep.equal(expectedConstruct);
        }));

        it('should be able to set named profile', fakeAsync(() => {
            let updateConnectionProfilesStub = sinon.stub(component, 'updateConnectionProfiles');
            updateConnectionProfilesStub.returns(Promise.resolve({}));

            let targetProfile = { name: 'Pingu', type: 'Penguin'};

            let retrieveConnectionProfileByNameStub = sinon.stub(component, 'retrieveConnectionProfileByName');
            retrieveConnectionProfileByNameStub.returns(targetProfile);

            component.setConnectionProfile('selectMe');

            tick();

            let expectedConstruct = {name: 'selectMe',
                                     profile: targetProfile,
                                     default: true };

            component['connectionProfile'].should.deep.equal(expectedConstruct);
        }));
    });

    describe('#dismiss', () => {
        it('should trigger cancelAdd.emit ', () => {
            let spy = sinon.spy(component.cancelAdd, 'emit');

            component.dismiss();

            spy.should.have.been.calledWith(true);
        });
    });

    describe('#initiateAddToProfile', () => {
        it('should trigger profileToUse.emit with the connection profile name', () => {
            component['connectionProfile'] = {name: 'bob'};
            let spy = sinon.spy(component.profileToUse, 'emit');

            component.initiateAddToProfile();

            spy.should.have.been.calledWith('bob');
        });
    });

    describe('#initiateAddWithProfile', () => {
        it('should trigger profileToEdit.emit with the connection profile', () => {
            let myProfile = {name: 'bob', penguins : ['pingu', 'poppy']};
            component['connectionProfile'] = myProfile;
            let spy = sinon.spy(component.profileToEdit, 'emit');

            component.initiateAddWithProfile();

            spy.should.have.been.calledWith(myProfile);
        });
    });
});

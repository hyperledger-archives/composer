/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import {

    ReactiveFormsModule,
    FormArray,
    Validators,
    FormBuilder
} from '@angular/forms';
import { ConnectionProfileDataComponent } from './connection-profile-data.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AlertService } from '../services/alert.service';
import * as sinon from 'sinon';
import * as fileSaver from 'file-saver';

describe('ConnectionProfileDataComponent', () => {
    let component: ConnectionProfileDataComponent;
    let fixture: ComponentFixture<ConnectionProfileDataComponent>;

    let mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
    let mockNgbModal = sinon.createStubInstance(NgbModal);
    let mockAlertService = sinon.createStubInstance(AlertService);

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ConnectionProfileDataComponent],
            providers: [{provide: NgbModal, useValue: mockNgbModal},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: AlertService, useValue: mockAlertService},
                FormBuilder],
            imports: [ReactiveFormsModule]
        });
        fixture = TestBed.createComponent(ConnectionProfileDataComponent);
        component = fixture.componentInstance;
    });

    it('should create ConnectionProfileDataComponent', () => {
        component.should.be.ok;
    });

    describe('expandSection', () => {
        it('should error on unknown profile type', () => {
            let sectionToExpand = 'All';
            component['connectionProfileData'] = {profile: {type: 'invalidType'}};
            component['expandedSection'] = ['Basic Configuration', 'Security Settings', 'Advanced'];
            (() => {
                component.expandSection(sectionToExpand);
            }).should.throw('Invalid connection profile type');
        });

        it('should close all expanded sections for a v0.6 profile', () => {
            let sectionToExpand = 'All';
            component['connectionProfileData'] = {profile: {type: 'hlf'}};
            component['expandedSection'] = ['Basic Configuration', 'Security Settings', 'Advanced'];
            component.expandSection(sectionToExpand);

            component['expandedSection'].length.should.equal(0);
        });

        it('should open all collapsed sections for a v0.6 profile', () => {
            let sectionToExpand = 'All';
            component['connectionProfileData'] = {profile: {type: 'hlf'}};
            component['expandedSection'] = [];
            component.expandSection(sectionToExpand);

            component['expandedSection'].length.should.equal(3);
        });

        it('should close a single section for a v0.6 profile', () => {
            let sectionToExpand = 'Basic Configuration';
            component['connectionProfileData'] = {profile: {type: 'hlf'}};
            component['expandedSection'] = ['Basic Configuration', 'Advanced'];
            component.expandSection(sectionToExpand);

            component['expandedSection'].should.deep.equal(['Advanced']);
        });

        it('should open a single section for a v0.6 profile', () => {
            let sectionToExpand = 'Basic Configuration';
            component['connectionProfileData'] = {profile: {type: 'hlf'}};
            component['expandedSection'] = ['Advanced'];
            component.expandSection(sectionToExpand);

            component['expandedSection'].should.deep.equal(['Advanced', 'Basic Configuration']);
        });

        it('should close all expanded sections for a v1 profile', () => {
            let sectionToExpand = 'All';
            component['connectionProfileData'] = {profile: {type: 'hlfv1'}};
            component['expandedSection'] = ['Basic Configuration', 'Advanced'];
            component.expandSection(sectionToExpand);

            component['expandedSection'].length.should.equal(0);
        });

        it('should open all collapsed sections for a v1 profile', () => {
            let sectionToExpand = 'All';
            component['connectionProfileData'] = {profile: {type: 'hlfv1'}};
            component['expandedSection'] = [];
            component.expandSection(sectionToExpand);

            component['expandedSection'].length.should.equal(2);
        });

        it('should close a single section for a v1 profile', () => {
            let sectionToExpand = 'Basic Configuration';
            component['connectionProfileData'] = {profile: {type: 'hlfv1'}};
            component['expandedSection'] = ['Basic Configuration', 'Advanced'];
            component.expandSection(sectionToExpand);

            component['expandedSection'].should.deep.equal(['Advanced']);
        });

        it('should open a single section for a v1 profile', () => {
            let sectionToExpand = 'Basic Configuration';
            component['connectionProfileData'] = {profile: {type: 'hlfv1'}};
            component['expandedSection'] = ['Advanced'];
            component.expandSection(sectionToExpand);

            component['expandedSection'].should.deep.equal(['Advanced', 'Basic Configuration']);
        });
    });

    describe('useProfile', () => {
        it('should use a new profile', fakeAsync(() => {
            component['connectionProfileData'] = {name: 'testprofile'};

            component['profileUpdated'].subscribe((data) => {
                data.should.deep.equal({updated: true});
            });

            let profileUpdatedSpy = sinon.spy(component['profileUpdated'], 'emit');

            mockAlertService.successStatus$ = {
                next: sinon.stub()
            };

            let mockModalRef = {
                componentInstance: {
                    connectionProfileName: ''
                },
                result: Promise.resolve()
            };

            mockNgbModal.open.returns(mockModalRef);
            component.useProfile();

            tick();

            mockAlertService.successStatus$.next.should.have.been.calledWith({
                icon: '#icon-world_24',
                text: 'Successfully connected with profile testprofile',
                title: 'Connection Successful'
            });

            component['profileUpdated'].emit.should.have.been.calledWith({updated: true});
        }));

        it('should use default profile', fakeAsync(() => {
            component['connectionProfileData'] = {name: '$default'};

            component['profileUpdated'].subscribe((data) => {
                data.should.deep.equal({updated: true});
            });

            let profileUpdatedSpy = sinon.spy(component['profileUpdated'], 'emit');

            mockAlertService.successStatus$ = {
                next: sinon.stub()
            };

            let mockModalRef = {
                componentInstance: {
                    connectionProfileName: ''
                },
                result: Promise.resolve()
            };

            mockNgbModal.open.returns(mockModalRef);
            component.useProfile();

            tick();

            mockAlertService.successStatus$.next.should.have.been.calledWith({
                icon: '#icon-world_24',
                text: 'Successfully connected with profile Web Browser',
                title: 'Connection Successful'
            });
            component['profileUpdated'].emit.should.have.been.calledWith({updated: true});
        }));

        it('should handle error', fakeAsync(() => {
            component['connectionProfileData'] = {name: 'testprofile'};

            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            let mockModalRef = {
                componentInstance: {
                    connectionProfileName: ''
                },
                result: Promise.reject('some error')
            };

            mockNgbModal.open.returns(mockModalRef);
            component.useProfile();

            tick();

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should handle cancel', fakeAsync(() => {
            component['connectionProfileData'] = {name: 'testprofile'};

            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            let mockModalRef = {
                componentInstance: {
                    connectionProfileName: ''
                },
                result: Promise.reject(null)
            };

            mockNgbModal.open.returns(mockModalRef);
            component.useProfile();

            tick();

            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));
    });

    describe('startEditing', () => {
        it('should be able to edit a v0.6 form', () => {
            component['connectionProfileData'] = {profile: {type: 'hlf'}};
            let mockOnValueChanged = sinon.stub(component, 'onValueChanged');
            component.startEditing();
            mockOnValueChanged.should.have.been.called;
        });

        it('should be able to edit a v1 form', () => {
            component['connectionProfileData'] = {profile: {type: 'hlfv1'}};
            let mockOnValueChanged = sinon.stub(component, 'onValueChanged');

            component.startEditing();
            mockOnValueChanged.should.have.been.called;
        });

        it('should error if unknown form type', () => {
            component['connectionProfileData'] = {profile: {type: 'test'}};
            let mockOnValueChanged = sinon.stub(component, 'onValueChanged');

            (() => {
                component.startEditing();
            }).should.throw('Unknown connection profile type');
        });
    });

    describe('initOrderers', () => {
        it('should initialize orderers if theres connection profile data', () => {
            component['connectionProfileData'] = {
                profile: {
                    orderers: [
                        {url: 'ordererURL_1', cert: 'ordererCert_1', hostnameOverride: 'ordererHostname_1'},
                        {url: 'ordererURL_2', cert: 'ordererCert_2', hostnameOverride: 'ordererHostname_2'}]
                }
            };

            let groupSpy = sinon.spy(component['fb'], 'group');

            let result = component.initOrderers();
            result.length.should.equal(2);
            groupSpy.firstCall.should.have.been.calledWith(
                {
                    url: ['ordererURL_1', Validators.required],
                    cert: ['ordererCert_1'],
                    hostnameOverride: ['ordererHostname_1'],
                }
            );

            groupSpy.secondCall.should.have.been.calledWith(
                {
                    url: ['ordererURL_2', Validators.required],
                    cert: ['ordererCert_2'],
                    hostnameOverride: ['ordererHostname_2'],
                }
            );
        });

        it('should initialize orderers if there is no connection profile data', () => {
            // component['connectionProfileData'] = undefined;

            let groupSpy = sinon.spy(component['fb'], 'group');

            let result = component.initOrderers();
            result.length.should.equal(1);
            groupSpy.firstCall.should.have.been.calledWith(
                {
                    url: ['grpc://localhost:7050', Validators.required],
                    cert: [''],
                    hostnameOverride: [''],
                }
            );
        });
    });

    describe('addOrderer', () => {
        it('should add an orderer', () => {
            component['v1Form'] = component['fb'].group(
                {
                    orderers: component['fb'].array([component['fb'].group({
                        url: 'ordererURL_2',
                        cert: 'ordererCert_2',
                        hostnameOverride: 'ordererHostname_2'
                    })])
                });

            component.addOrderer();
            (<FormArray> component['v1Form'].controls['orderers']).length.should.equal(2);

        });
    });

    describe('removeOrderer', () => {
        it('should remove an orderer', () => {
            component['v1Form'] = component['fb'].group(
                {
                    orderers: component['fb'].array([component['fb'].group({
                        url: 'ordererURL_2',
                        cert: 'ordererCert_2',
                        hostnameOverride: 'ordererHostname_2'
                    })])
                });

            component.removeOrderer(0);
            (<FormArray> component['v1Form'].controls['orderers']).length.should.equal(0);
        });
    });

    describe('initPeers', () => {
        it('should initialize peers if theres connection profile data', () => {
            component['connectionProfileData'] = {
                profile: {
                    peers: [
                        {
                            requestURL: 'requestURL_1',
                            eventURL: 'eventURL_1',
                            cert: 'peerCert_1',
                            hostnameOverride: 'peerHostname_1'
                        },
                        {
                            requestURL: 'requestURL_2',
                            eventURL: 'eventURL_2',
                            cert: 'peerCert_2',
                            hostnameOverride: 'peerHostname_2'
                        }]
                }
            };

            let groupSpy = sinon.spy(component['fb'], 'group');

            let result = component.initPeers();
            result.length.should.equal(2);
            groupSpy.firstCall.should.have.been.calledWith(
                {
                    requestURL: ['requestURL_1', Validators.required],
                    eventURL: ['eventURL_1', Validators.required],
                    cert: ['peerCert_1'],
                    hostnameOverride: ['peerHostname_1'],
                }
            );

            groupSpy.secondCall.should.have.been.calledWith(
                {
                    requestURL: ['requestURL_2', Validators.required],
                    eventURL: ['eventURL_2', Validators.required],
                    cert: ['peerCert_2'],
                    hostnameOverride: ['peerHostname_2'],
                }
            );
        });

        it('should initialize orderers if there is no connection profile data', () => {
            // component['connectionProfileData'] = undefined;

            let groupSpy = sinon.spy(component['fb'], 'group');

            let result = component.initPeers();
            result.length.should.equal(1);
            groupSpy.firstCall.should.have.been.calledWith(
                {
                    requestURL: ['grpc://localhost:7051', Validators.required],
                    eventURL: ['grpc://localhost:7053', Validators.required],
                    cert: [''],
                    hostnameOverride: [''],
                }
            );
        });
    });

    describe('addPeer', () => {
        it('should add a peer', () => {

            component['v1Form'] = component['fb'].group(
                {
                    peers: component['fb'].array([component['fb'].group({
                        requestURL: 'requestURL_1',
                        eventURL: 'eventURL_1',
                        cert: 'peerCert_1',
                        hostnameOverride: 'peerHostname_1'
                    })])
                });

            component.addPeer();
            (<FormArray> component['v1Form'].controls['peers']).length.should.equal(2);

        });
    });

    describe('removePeer', () => {
        it('should remove a peer', () => {

            component['v1Form'] = component['fb'].group(
                {
                    peers: component['fb'].array([component['fb'].group({
                        requestURL: 'requestURL_1',
                        eventURL: 'eventURL_1',
                        cert: 'peerCert_1',
                        hostnameOverride: 'peerHostname_1'
                    })])
                });

            component.removePeer(0);
            (<FormArray> component['v1Form'].controls['peers']).length.should.equal(0);

        });
    });

    describe('onValueChanged', () => {
        it('should error if profile type is invalid', () => {
            component['connectionProfileData'] = {profile: {type: 'invalidType'}};
            (() => {
                component.onValueChanged();
            }).should.throw('Invalid connection profile type');
        });

        it('should validate v06 profile if no form is defined', () => {
            let onValueChangedSpy = sinon.spy(component, 'onValueChanged');
            component['connectionProfileData'] = {profile: {type: 'hlf'}};
            component.onValueChanged();
            onValueChangedSpy.should.be.called;
        });

        it('should validate v06 profile if a form is defined', () => {
            let onValueChangedSpy = sinon.spy(component, 'onValueChanged');
            component['connectionProfileData'] = {profile: {type: 'hlf'}};
            component['v06Form'] = component['fb'].group({
                name: ['v06 Profile', [Validators.required, Validators.pattern('^(?!New Connection Profile$).*$')]],
                peerURL: ['grpc://localhost:7051', [Validators.required]],
                membershipServicesURL: ['grpc://localhost:7054', [Validators.required]],
                eventHubURL: ['grpc://localhost:7053', [Validators.required]],
                keyValStore: ['/tmp/keyValStore', [Validators.required]],
                deployWaitTime: ['INVALID_VALUE', [Validators.pattern('[0-9]+')]],
                invokeWaitTime: [30, [Validators.pattern('[0-9]+')]]
            });

            component.onValueChanged();
            component['v06FormErrors'].deployWaitTime.should.equal('The Deploy Wait Time (seconds) must be an integer. ');
            onValueChangedSpy.should.be.called;
        });

        it('should validate v1 profile if no form is defined', () => {
            let onValueChangedSpy = sinon.spy(component, 'onValueChanged');
            component['connectionProfileData'] = {profile: {type: 'hlfv1'}};
            component.onValueChanged();
            onValueChangedSpy.should.be.called;
        });

        it('should validate v1 profile if a form is defined', () => {
            let onValueChangedSpy = sinon.spy(component, 'onValueChanged');
            component['connectionProfileData'] = {profile: {type: 'hlfv1'}};
            component['v1Form'] = component['fb'].group({
                name: ['v1 Profile', [Validators.required, Validators.pattern('^(?!New Connection Profile$).*$')]],
                peers: component['fb'].array([component['fb'].group({
                    requestURL: ['grpc://localhost:7051', Validators.required],
                    eventURL: ['', Validators.required],
                    cert: [''],
                    hostnameOverride: ['']
                })]),
                orderers: component['fb'].array([component['fb'].group({
                    url: ['grpc://localhost:7050', Validators.required],
                    cert: [''],
                    hostnameOverride: ['']
                })]),
                channel: ['mychannel', [Validators.required]],
                mspID: ['Org1MSP', [Validators.required]],
                ca: ['http://localhost:7054', [Validators.required]],
                eventHubURL: ['grpc://localhost:7053', [Validators.required]],
                keyValStore: ['/tmp/keyValStore', [Validators.required]],
                deployWaitTime: [300, [Validators.pattern('[0-9]+')]],
                invokeWaitTime: [30, [Validators.pattern('[0-9]+')]]
            });

            component.onValueChanged();
            component['v1FormErrors'].peers['eventURL'].should.equal('Every Peer Event URL is required.');
            onValueChangedSpy.should.be.called;
        });
    });

    describe('onSubmit', () => {
        it('should submit v06 profile form', fakeAsync(() => {
            let profileOne = {
                deployWaitTime: 300,
                eventHubURL: 'grpc://localhost:7053',
                invokeWaitTime: 30,
                keyValStore: '/tmp/keyValStore',
                membershipServicesURL: 'grpc://localhost:7054',
                name: 'new v06 Profile',
                peerURL: 'grpc://localhost:7051',
                type: 'hlf'
            };

            let profileTwo = {
                deployWaitTime: 300,
                eventHubURL: 'grpc://localhost:7053',
                invokeWaitTime: 30,
                keyValStore: '/tmp/keyValStore',
                membershipServicesURL: 'grpc://localhost:7054',
                name: 'v06 Profile',
                peerURL: 'grpc://localhost:7051',
                type: 'hlf'
            };

            mockConnectionProfileService.createProfile.returns(Promise.resolve());
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve([profileOne, profileTwo]));

            component['connectionProfileData'] = {name: 'v06 Profile', profile: {type: 'hlf'}};

            component['v06Form'] = component['fb'].group({
                name: ['new v06 Profile', [Validators.required, Validators.pattern('^(?!New Connection Profile$).*$')]],
                peerURL: ['grpc://localhost:7051', [Validators.required]],
                membershipServicesURL: ['grpc://localhost:7054', [Validators.required]],
                eventHubURL: ['grpc://localhost:7053', [Validators.required]],
                keyValStore: ['/tmp/keyValStore', [Validators.required]],
                deployWaitTime: [300, [Validators.pattern('[0-9]+')]],
                invokeWaitTime: [30, [Validators.pattern('[0-9]+')]]
            });

            component.onSubmit();
            tick();
            mockConnectionProfileService.createProfile.should.have.been.calledWith('new v06 Profile', profileOne);
            mockConnectionProfileService.deleteProfile.should.have.been.calledWith('v06 Profile');
        }));

        it('should submit v1 profile form', fakeAsync(() => {
            let profileOne = {
                name: 'new v1 Profile',
                description: 'A description for a V1 Profile',
                type: 'hlfv1',
                orderers: [{
                    url: 'grpc://localhost:7050',
                    cert: '',
                    hostnameOverride: ''
                }],
                channel: 'mychannel',
                mspID: 'Org1MSP',
                ca: 'http://localhost:7054',
                peers: [{
                    requestURL: 'grpc://localhost:7051',
                    eventURL: 'grpc://localhost:7053',
                    cert: '',
                    hostnameOverride: ''
                }],
                keyValStore: '/tmp/keyValStore',
                deployWaitTime: 300,
                invokeWaitTime: 30
            };

            let profileTwo = {
                name: 'v1 Profile',
                description: 'A description for a V1 Profile',
                type: 'hlfv1',
                orderers: [{
                    url: 'grpc://localhost:7050',
                    cert: '',
                    hostnameOverride: ''
                }],
                channel: 'mychannel',
                mspID: 'Org1MSP',
                ca: 'http://localhost:7054',
                peers: [{
                    requestURL: 'grpc://localhost:7051',
                    eventURL: 'grpc://localhost:7053',
                    cert: '',
                    hostnameOverride: ''
                }],
                keyValStore: '/tmp/keyValStore',
                deployWaitTime: 300,
                invokeWaitTime: 30
            };

            mockConnectionProfileService.createProfile.returns(Promise.resolve());
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve([profileOne, profileTwo]));

            component['connectionProfileData'] = {name: 'v1 Profile', profile: {type: 'hlfv1'}};

            component['v1Form'] = component['fb'].group({
                name: ['new v1 Profile', [Validators.required, Validators.pattern('^(?!New Connection Profile$).*$')]],
                description: ['A description for a V1 Profile'],
                peers: component['fb'].array([component['fb'].group({
                    requestURL: ['grpc://localhost:7051', Validators.required],
                    eventURL: ['grpc://localhost:7053', Validators.required],
                    cert: [''],
                    hostnameOverride: ['']
                })]),
                orderers: component['fb'].array([component['fb'].group({
                    url: ['grpc://localhost:7050', Validators.required],
                    cert: [''],
                    hostnameOverride: ['']
                })]),
                channel: ['mychannel', [Validators.required]],
                mspID: ['Org1MSP', [Validators.required]],
                ca: ['http://localhost:7054', [Validators.required]],
                keyValStore: ['/tmp/keyValStore', [Validators.required]],
                deployWaitTime: [300, [Validators.pattern('[0-9]+')]],
                invokeWaitTime: [30, [Validators.pattern('[0-9]+')]]
            });

            component.onSubmit();
            tick();
            mockConnectionProfileService.createProfile.should.have.been.calledWith('new v1 Profile', profileOne);
            mockConnectionProfileService.deleteProfile.should.have.been.calledWith('v1 Profile');
        }));

        it('should throw error on unknown profile type', fakeAsync(() => {
            let profileOne = {
                deployWaitTime: 300,
                eventHubURL: 'grpc://localhost:7053',
                invokeWaitTime: 30,
                keyValStore: '/tmp/keyValStore',
                membershipServicesURL: 'grpc://localhost:7054',
                name: 'new v06 Profile',
                peerURL: 'grpc://localhost:7051',
                type: 'hlf'
            };

            mockConnectionProfileService.createProfile.returns(Promise.resolve());
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve([profileOne]));

            component['connectionProfileData'] = {name: 'unknown profile', profile: {type: 'unknown type'}};

            component['v06Form'] = component['fb'].group({
                name: ['new v06 Profile', [Validators.required, Validators.pattern('^(?!New Connection Profile$).*$')]],
                peerURL: ['grpc://localhost:7051', [Validators.required]],
                membershipServicesURL: ['grpc://localhost:7054', [Validators.required]],
                eventHubURL: ['grpc://localhost:7053', [Validators.required]],
                keyValStore: ['/tmp/keyValStore', [Validators.required]],
                deployWaitTime: [300, [Validators.pattern('[0-9]+')]],
                invokeWaitTime: [30, [Validators.pattern('[0-9]+')]]
            });

            (() => {
                component.onSubmit();
            }).should.throw('Unknown profile type');
            tick();
        }));
    });

    describe('stopEditing', () => {
        beforeEach(() => {
            mockConnectionProfileService.deleteProfile.reset();
        });

        it('should delete new profile if cancelled', fakeAsync(() => {
            component['connectionProfileData'] = {name: 'New Connection Profile'};
            mockConnectionProfileService.deleteProfile.returns(Promise.resolve());

            component['profileUpdated'].subscribe((data) => {
                data.should.deep.equal({updated: false});
            });

            let profileUpdatedSpy = sinon.spy(component['profileUpdated'], 'emit');
            component.stopEditing();

            tick();
            component['editing'].should.equal(false);
            profileUpdatedSpy.should.be.calledWith({updated: false});
            mockConnectionProfileService.deleteProfile.should.have.been.calledWith('New Connection Profile');
        }));

        it('should switch back to display view if cancel editing', fakeAsync(() => {
            component['connectionProfileData'] = {name: 'bob'};
            component['profileUpdated'].subscribe((data) => {
                data.should.deep.equal({updated: true});
            });

            let profileUpdatedSpy = sinon.spy(component['profileUpdated'], 'emit');
            component.stopEditing();

            tick();
            component['editing'].should.equal(false);
            profileUpdatedSpy.should.be.calledWith({updated: true});
            mockConnectionProfileService.deleteProfile.should.not.have.been.called;
        }));
    });

    describe('deleteProfile', () => {
        it('should delete profile', fakeAsync(() => {
            component['profileUpdated'].subscribe((data) => {
                data.should.deep.equal({updated: false});
            });

            let profileUpdatedSpy = sinon.spy(component['profileUpdated'], 'emit');
            component['connectionProfileData'] = {name: 'v1 Profile', profile: {type: 'hlfv1'}};
            mockNgbModal.open.returns({result: Promise.resolve({}), componentInstance: {profileName: 'bob'}});
            component.deleteProfile();
            tick();

            profileUpdatedSpy.should.have.been.calledWith({updated: false});
        }));

        it('should handle error', fakeAsync(() => {
            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            let profileUpdatedSpy = sinon.spy(component['profileUpdated'], 'emit');
            component['connectionProfileData'] = {name: 'v1 Profile', profile: {type: 'hlfv1'}};
            mockNgbModal.open.returns({result: Promise.reject('some error'), componentInstance: {profileName: 'bob'}});
            component.deleteProfile();
            tick();

            profileUpdatedSpy.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should handle pressing escape', fakeAsync(() => {
            mockAlertService.errorStatus$ = {
                next: sinon.stub()
            };

            let profileUpdatedSpy = sinon.spy(component['profileUpdated'], 'emit');
            component['connectionProfileData'] = {name: 'v1 Profile', profile: {type: 'hlfv1'}};
            mockNgbModal.open.returns({result: Promise.reject(1), componentInstance: {profileName: 'bob'}});
            component.deleteProfile();
            tick();

            profileUpdatedSpy.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));
    });

    describe('exportProfile', () => {
        afterAll(() => {
            fileSaver.saveAs.restore();
            (window as any).File.restore();
        });

        it('should export profile matching name and type', () => {
            component['connectionProfileData'] = {name: 'v1 Profile', profile: {type: 'hlfv1'}};

            let mockSave = sinon.stub(fileSaver, 'saveAs');
            let testFile = new File(['test'], 'connection.json', {type: 'application/json'});

            component.exportProfile();

            mockSave.should.have.been.calledWith(testFile);
            let passedFile = mockSave.getCall(0).args[0];
            passedFile.name.should.equal(testFile.name);
            passedFile.type.should.equal(testFile.type);

        });

        it('should export profile matching content', () => {
            component['connectionProfileData'] = {name: 'v1 Profile', profile: {type: 'hlfv1'}};

            let mockFile = sinon.stub(window, 'File');
            mockFile.returns(new File(['test'], 'connection.json', {type: 'application/json'}));

            component.exportProfile();

            mockFile.should.have.been.calledWithNew;
            let actualData = mockFile.getCall(0).args[0];
            let expectedData = ['test'];
            actualData.should.deep.equal(expectedData);

        });
    });

    describe('openAddCertificateModal', () => {
        it('should open orderers certificate modal if hostname set', fakeAsync(() => {
            component['v1Form'] = component['fb'].group({
                orderers: component['fb'].array([component['fb'].group({
                    url: 'ordererURL_2',
                    cert: 'ordererCert_2',
                    hostnameOverride: ''
                })])
            });

            let patchSpy = sinon.spy(component['v1Form'].controls['orderers']['controls'][0], 'patchValue');

            mockNgbModal.open.returns({
                result: Promise.resolve({
                    url: 'ordererURL_2',
                    cert: 'ordererCert_2',
                    hostnameOverride: 'hostname_2'
                })
            });

            component.openAddCertificateModal(0, 'orderers');

            tick();

            mockConnectionProfileService.setCertificate.should.have.been.called;
            mockConnectionProfileService.setHostname.should.have.been.called;
            mockNgbModal.open.should.have.been.called;

            patchSpy.should.have.been.calledWith({cert: 'ordererCert_2', hostnameOverride: 'hostname_2'});
        }));

        it('should open orderers certificate modal if hostname not set', fakeAsync(() => {
            component['v1Form'] = component['fb'].group({
                orderers: component['fb'].array([component['fb'].group({
                    url: 'ordererURL_2',
                    cert: 'ordererCert_2',
                    hostnameOverride: ''
                })])
            });

            let patchSpy = sinon.spy(component['v1Form'].controls['orderers']['controls'][0], 'patchValue');

            mockNgbModal.open.returns({
                result: Promise.resolve({
                    url: 'ordererURL_2',
                    cert: 'ordererCert_2',
                    hostnameOverride: ''
                })
            });

            component.openAddCertificateModal(0, 'orderers');

            tick();

            mockConnectionProfileService.setCertificate.should.be.called;
            mockConnectionProfileService.setHostname.should.be.called;
            mockNgbModal.open.should.have.been.called;

            patchSpy.should.have.been.calledWith({cert: 'ordererCert_2', hostnameOverride: 'orderer0'});
        }));

        it('should open peers certificate modal if hostname set', fakeAsync(() => {
            component['v1Form'] = component['fb'].group({
                peers: component['fb'].array([component['fb'].group({
                    requestURL: 'requestURL_1',
                    eventURL: 'eventURL_1',
                    cert: 'peerCert_1',
                    hostnameOverride: 'peerHostname_1'
                })])
            });

            let patchSpy = sinon.spy(component['v1Form'].controls['peers']['controls'][0], 'patchValue');

            mockNgbModal.open.returns({
                result: Promise.resolve({
                    requestURL: 'requestURL_1',
                    eventURL: 'eventURL_1',
                    cert: 'peerCert_1',
                    hostnameOverride: 'hostname_1'
                })
            });

            component.openAddCertificateModal(0, 'peers');

            tick();

            mockConnectionProfileService.setCertificate.should.be.called;
            mockConnectionProfileService.setHostname.should.be.called;
            mockNgbModal.open.should.have.been.called;

            patchSpy.should.have.been.calledWith({cert: 'peerCert_1', hostnameOverride: 'hostname_1'});
        }));

        it('should open peers certificate modal if hostname not set', fakeAsync(() => {
            component['v1Form'] = component['fb'].group({
                peers: component['fb'].array([component['fb'].group({
                    requestURL: 'requestURL_1',
                    eventURL: 'eventURL_1',
                    cert: 'peerCert_1',
                    hostnameOverride: 'peerHostname_1'
                })])
            });

            let patchSpy = sinon.spy(component['v1Form'].controls['peers']['controls'][0], 'patchValue');

            mockNgbModal.open.returns({
                result: Promise.resolve({
                    requestURL: 'requestURL_1',
                    eventURL: 'eventURL_1',
                    cert: 'peerCert_1',
                    hostnameOverride: ''
                })
            });

            component.openAddCertificateModal(0, 'peers');

            tick();

            mockConnectionProfileService.setCertificate.should.be.called;
            mockConnectionProfileService.setHostname.should.be.called;
            mockNgbModal.open.should.have.been.called;

            patchSpy.should.have.been.calledWith({cert: 'peerCert_1', hostnameOverride: 'peer0'});
        }));

        it('should error on unrecognized type', fakeAsync(() => {

            mockNgbModal.open.returns({result: Promise.resolve()});
            component.openAddCertificateModal(0, 'test').then(() => {
                throw new Error('should not get here');
            })
            .catch((error) => {
                error.message.should.equal('Unrecognized type test');
            });

            tick();

            mockNgbModal.open.should.have.been.called;
        }));

        it('should open orderers certificate modal and handle error', fakeAsync(() => {
            mockAlertService.errorStatus$ = {next: sinon.stub()};

            component['v1Form'] = component['fb'].group({
                orderers: component['fb'].array([component['fb'].group({
                    url: 'ordererURL_2',
                    cert: 'ordererCert_2',
                    hostnameOverride: ''
                })])
            });

            let patchSpy = sinon.spy(component['v1Form'].controls['orderers']['controls'][0], 'patchValue');

            mockNgbModal.open.returns({
                result: Promise.reject('some error')
            });

            component.openAddCertificateModal(0, 'orderers');

            tick();

            mockConnectionProfileService.setCertificate.should.have.been.called;
            mockConnectionProfileService.setHostname.should.have.been.called;
            mockNgbModal.open.should.have.been.called;

            patchSpy.should.not.have.been.called;

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');

        }));

        it('should open orderers certificate modal and handle cancel', fakeAsync(() => {
            mockAlertService.errorStatus$ = {next: sinon.stub()};

            component['v1Form'] = component['fb'].group({
                orderers: component['fb'].array([component['fb'].group({
                    url: 'ordererURL_2',
                    cert: 'ordererCert_2',
                    hostnameOverride: ''
                })])
            });

            let patchSpy = sinon.spy(component['v1Form'].controls['orderers']['controls'][0], 'patchValue');

            mockNgbModal.open.returns({
                result: Promise.reject(1)
            });

            component.openAddCertificateModal(0, 'orderers');

            tick();

            mockConnectionProfileService.setCertificate.should.have.been.called;
            mockConnectionProfileService.setHostname.should.have.been.called;
            mockNgbModal.open.should.have.been.called;

            patchSpy.should.not.have.been.called;

            mockAlertService.errorStatus$.next.should.not.have.been.called;

        }));
    });

    describe('showCertificate', () => {
        it('should show certificate', () => {
            component.showCertificate('certdata', 'hostname');
            mockConnectionProfileService.setCertificate.should.be.calledWith('certdata');
            mockConnectionProfileService.setHostname.should.be.calledWith('hostname');
            mockNgbModal.open.should.be.called;
        });
    });

    describe('component input', () => {
        it('should change profile if an existing profile is selected', () => {
            component.connectionProfile = {name: 'v1 Profile', profile: {type: 'hlfv1'}};
        });

        it('should create new profile', () => {
            let startEditingSpy = sinon.spy(component, 'startEditing');
            component.connectionProfile = {name: 'New Connection Profile', profile: {type: 'hlfv1'}};
            startEditingSpy.should.be.called;
        });
    });
});

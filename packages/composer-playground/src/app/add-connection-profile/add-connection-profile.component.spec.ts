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
import { AlertService } from '../services/alert.service';
import { AdminService } from '../services/admin.service';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

import * as sinon from 'sinon';
import { expect } from 'chai';

class MockAdminService {
    getAdminConnection(): AdminConnection {
        return new AdminConnection();
    }

    ensureConnection(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    deploy(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network'));
        });
    }

    update(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network'));
        });
    }

    generateDefaultBusinessNetwork(): BusinessNetworkDefinition {
        return new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network');
    }

    isInitialDeploy(): boolean {
        return true;
    }
}

class MockAlertService {
    public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
    public busyStatus$: Subject<string> = new BehaviorSubject<string>(null);
}

class MockConnectionProfileService {
    getAllProfiles(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve({profile0: 'a', profile2: 'c', profile1: 'b'});
        });
    }
}

@Directive({
    selector: '[fileDragDrop]'
})
class MockDragDropDirective {
    @Output()
    public fileDragDropFileAccepted: EventEmitter<File> = new EventEmitter<File>();
    @Output()
    public fileDragDropFileRejected: EventEmitter<string> = new EventEmitter<string>();
    @Output()
    public fileDragDropDragOver: EventEmitter<string> = new EventEmitter<string>();
    @Output()
    public fileDragDropDragLeave: EventEmitter<string> = new EventEmitter<string>();

    @Input()
    public supportedFileTypes: string[] = [];
    @Input()
    maxFileSize: number = 0;
}

@Directive({
    selector: 'file-importer'
})
class MockFileImporterDirective {
    @Output()
    public dragFileAccepted: EventEmitter<File> = new EventEmitter<File>();

    @Input()
    public expandInput: boolean = false;

    @Input()
    public svgName: string = '#icon-BNA_Upload';
}

describe('AddConnectionProfileComponent', () => {
    let sandbox;
    let component: AddConnectionProfileComponent;
    let fixture: ComponentFixture<AddConnectionProfileComponent>;

    const NAME = 'New Profile';
    const DESC = 'Test Description';
    const MS_URL = 'msurl';
    const PEER_URL = 'peerurl';
    const EH_URL = 'ehurl';
    const KEY_VAL_STORE = 'kvs';
    const DEPLOY_TIME = 100;
    const WAIT_TIME = 999;
    const TIMEOUT = 134;
    const CERT = 'cert';
    const CERT_PATH = 'certpath';
    const PEERS = ['peers'];
    const ORDERERS = ['orderers'];
    const CA = 'ca';
    const CHANNEL = 'channel';
    const MSPID = 'mspID';

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [
                AddConnectionProfileComponent, MockDragDropDirective, MockFileImporterDirective
            ],
            imports: [
                FormsModule
            ],
            providers: [
                {provide: AlertService, useClass: MockAlertService},
                NgbActiveModal,
                {provide: AdminService, useClass: MockAdminService},
                {provide: ConnectionProfileService, useClass: MockConnectionProfileService}
            ]
        });

        sandbox = sinon.sandbox.create();
        fixture = TestBed.createComponent(AddConnectionProfileComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#removeFile', () => {
        it('should reset current settings when removeFile is called', () => {
            component.removeFile();
            expect(component.expandInput).to.be.false;
            expect(component.currentFile).to.be.null;
            expect(component.currentFileName).to.be.null;
            expect(component.version).to.equal('');
        });
    });

    describe('#fileDetected', () => {
        it('should change this.expandInput to true', () => {
            component.fileDetected();
            expect(component.expandInput).to.be.true;
        });
    });

    describe('#fileLeft', () => {
        it('should change this.expectedInput to false', () => {
            component.fileLeft();
            expect(component.expandInput).to.be.false;
        });
    });

    describe('#fileAccepted', () => {

        it('should call this.createProfile', fakeAsync(() => {
            let b = new Blob(['/**Connection Profile*/'], {type: 'json'});
            let file = new File([b], 'New Profile.json');

            let createMock = sandbox.stub(component, 'createProfile');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            component.fileAccepted(file);
            tick();
            createMock.called;
        }));

        it('should call this.fileRejected when there is an error reading the file', fakeAsync(() => {
            let b = new Blob(['/**CTO File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.cto');

            let createMock = sandbox.stub(component, 'fileRejected');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.reject('some data'));

            component.fileAccepted(file);
            tick();
            createMock.called;
        }));

        it('should throw when given incorrect file type', fakeAsync(() => {

            let b = new Blob(['/**PNG File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.png');

            let createMock = sandbox.stub(component, 'fileRejected');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            component.fileAccepted(file);
            tick();
            createMock.called;
        }));
    });

    describe('#fileRejected', () => {
        it('should return an error status', async(() => {
            component.fileRejected('long reason to reject file');

            component['alertService'].errorStatus$.subscribe(
                (message) => {
                    expect(message).to.be.equal('long reason to reject file');
                }
            );
        }));
    });

    describe('#getDataBuffer', () => {
        let file;
        let mockFileReadObj;
        let mockBuffer;
        let mockFileRead;
        let content;

        beforeEach(() => {
            content = 'hello world';
            let data = new Blob([content], {type: 'text/plain'});
            file = new File([data], 'mock.bna');

            mockFileReadObj = {
                readAsArrayBuffer: sandbox.stub(),
                result: content,
                onload: sinon.stub(),
                onerror: sinon.stub()
            };

            mockFileRead = sinon.stub(window, 'FileReader');
            mockFileRead.returns(mockFileReadObj);
        });

        afterEach(() => {
            mockFileRead.restore();
        });

        it('should return data from a file', () => {
            let promise = component.getDataBuffer(file);
            mockFileReadObj.onload();
            return promise
            .then((data) => {
                data.toString().should.equal(content);
            });
        });

        it('should give error in promise chain', () => {
            let promise = component.getDataBuffer(file);
            mockFileReadObj.onerror('error');
            return promise
            .then((data) => {
                data.should.be.null;
            })
            .catch((err) => {
                err.should.equal('error');
            });
        });
    });

    describe('#createProfile', () => {
        let V06_INPUT = {
            description: DESC,
            type: 'hlf',
            membershipServicesURL: MS_URL,
            peerURL: PEER_URL,
            eventHubURL: EH_URL,
            keyValStore: KEY_VAL_STORE,
            deployWaitTime: DEPLOY_TIME,
            invokeWaitTime: WAIT_TIME,
            certificate: CERT,
            certificatePath: CERT_PATH
        };

        let V1_INPUT = {
            description: DESC,
            type: 'hlfv1',
            orderers: ORDERERS,
            ca: CA,
            peers: PEERS,
            keyValStore: KEY_VAL_STORE,
            timeout: TIMEOUT,
            channel: CHANNEL,
            mspID: MSPID,
        };

        let BAD_INPUT = 'This is not valid input';

        let INVALID_VERSION = {
            description: 'test',
            type: 'hlfv100',
        };

        it('should process json data for v0.6 hlf', fakeAsync(() => {
            let createMock = sandbox.stub(component, 'setV06Defaults').returns(Promise.resolve('some data'));
            let addMock = sandbox.stub(component, 'addConnectionProfile');
            let data = JSON.stringify(V06_INPUT);
            component.createProfile(data);
            tick();
            createMock.should.have.been.called;
            component['addConnectionProfileDescription'].should.equal(DESC);
            component['addConnectionProfileType'].should.equal('hlf');
            component['addConnectionProfileMembershipServicesURL'].should.equal(MS_URL);
            component['addConnectionProfilePeerURL'].should.equal(PEER_URL);
            component['addConnectionProfileEventHubURL'].should.equal(EH_URL);
            component['addConnectionProfileKeyValStore'].should.equal(KEY_VAL_STORE);
            component['addConnectionProfileDeployWaitTime'].should.equal(DEPLOY_TIME);
            component['addConnectionProfileInvokeWaitTime'].should.equal(WAIT_TIME);
            component['addConnectionProfileCertificate'].should.equal(CERT);
            component['addConnectionProfileCertificatePath'].should.equal(CERT_PATH);
            addMock.should.have.been.called;
        }));

        it('should process json data for v1 hlf', fakeAsync(() => {
            let createMock = sandbox.stub(component, 'setV1Defaults').returns(Promise.resolve('some data'));
            let addMock = sandbox.stub(component, 'addConnectionProfile');
            let data = JSON.stringify(V1_INPUT);
            component.createProfile(data);
            tick();
            createMock.should.have.been.called;
            component['addConnectionProfileDescription'].should.equal(DESC);
            component['addConnectionProfileType'].should.equal('hlfv1');
            component['addConnectionProfileOrderers'].should.deep.equal(ORDERERS);
            component['addConnectionProfileCertificateAuthority'].should.equal(CA);
            component['addConnectionProfilePeers'].should.deep.equal(PEERS);
            component['addConnectionProfileKeyValStore'].should.equal(KEY_VAL_STORE);
            component['addConnectionProfileChannel'].should.equal(CHANNEL);
            component['addConnectionProfileMspId'].should.equal(MSPID);
            component['addConnectionProfileTimeout'].should.equal(TIMEOUT);
            addMock.should.have.been.called;
        }));

        it('should throw an error for bad input', fakeAsync(() => {
            try {
                component.createProfile(BAD_INPUT);
            } catch (e) {
                e.message.should.contain('Parse error');
            }
        }));

        it('should throw an error for an invalid type', fakeAsync(() => {
            let data = JSON.stringify(INVALID_VERSION);
            try {
                component.createProfile(data);
            } catch (e) {
                e.message.should.contain('Invalid type in profile');
            }
        }));

    });

    describe('#changeCurrentFileType', () => {
        let TEST_DESC = 'Test Description';
        beforeEach(() => {
            component['addConnectionProfileDescription'] = TEST_DESC;
        });

        it('should deal with the version being 0.6', fakeAsync(() => {
            let setMock = sandbox.stub(component, 'setV06Defaults').returns(Promise.resolve());
            component['version'] = 'v06';
            component.changeCurrentFileType();
            tick();
            setMock.should.have.been.called;
            expect(component.currentFile).to.be.null;
            component['newConnectionProfile'].type.should.equal('hlf');
            component['newConnectionProfile'].description.should.equal(TEST_DESC);
        }));

        it('should deal with the addConnectionProfileType being hlf ', fakeAsync(() => {
            let setMock = sandbox.stub(component, 'setV06Defaults').returns(Promise.resolve());
            component['addConnectionProfileType'] = 'hlf';
            component.changeCurrentFileType();
            tick();
            setMock.should.have.been.called;
            expect(component.currentFile).to.be.null;
            component['newConnectionProfile'].type.should.equal('hlf');
            component['newConnectionProfile'].description.should.equal(TEST_DESC);
        }));

        it('should deal with the version being v1', fakeAsync(() => {
            let setMock = sandbox.stub(component, 'setV1Defaults').returns(Promise.resolve());
            component['version'] = 'v1';
            component.changeCurrentFileType();
            tick();
            setMock.should.have.been.called;
            expect(component.currentFile).to.be.null;
            component['newConnectionProfile'].type.should.equal('hlfv1');
            component['newConnectionProfile'].description.should.equal(TEST_DESC);
        }));

        it('should throw an error when no version or connection type', fakeAsync(() => {
            component['version'] = 'BAD';
            try {
                component.changeCurrentFileType();
            } catch (e) {
                e.message.should.contain('Unsupported version');
            }
        }));
    });

    describe('#setV06Defaults', () => {
        it('should create a new profile and set defaults for a v0.6 fabric', fakeAsync(() => {
            let mockUpdate = sandbox.stub(component, 'updateConnectionProfiles').returns(Promise.resolve());
            component['connectionProfiles'] = [];
            component.setV06Defaults().then(() => {
                component['addConnectionProfileName'].should.equal('New Connection Profile');
                verifyUnchangeableDefaults();
            });
        }));

        it('should create a new profile with a new name and set defaults for a v0.6 fabric', fakeAsync(() => {
            let mockUpdate = sandbox.stub(component, 'updateConnectionProfiles').returns(Promise.resolve());
            component['connectionProfiles'] = [{name: 'New Connection Profile'}];
            component.setV06Defaults().then(() => {
                component['addConnectionProfileName'].should.equal('New Connection Profile 2');
                verifyUnchangeableDefaults();
            });
        }));

        function verifyUnchangeableDefaults() {
            component['addConnectionProfileDescription'].should.equal('A description for a V0.6 Profile');
            component['addConnectionProfileType'].should.equal('hlf');
            component['addConnectionProfilePeerURL'].should.equal('grpc://localhost:7051');
            component['addConnectionProfileMembershipServicesURL'].should.equal('grpc://localhost:7054');
            component['addConnectionProfileEventHubURL'].should.equal('grpc://localhost:7053');
            component['addConnectionProfileKeyValStore'].should.equal('/tmp/keyValStore');
            component['addConnectionProfileDeployWaitTime'].should.equal(300);
            component['addConnectionProfileInvokeWaitTime'].should.equal(30);
            expect(component['addConnectionProfileCertificate']).to.be.null;
            expect(component['addConnectionProfileCertificatePath']).to.be.null;
        }
    });

    describe('#setV1Defaults', () => {

        it('should create a new profile and set defaults for a v1 fabric 1', fakeAsync(() => {
            let mockUpdate = sandbox.stub(component, 'updateConnectionProfiles').returns(Promise.resolve());
            component['connectionProfiles'] = [];
            component.setV1Defaults();
            tick();

            component['addConnectionProfileName'].should.equal('New Connection Profile');
            verifyUnchangeableDefaults();
        }));

        it('should create a new profile and set defaults for a v1 fabric 2', fakeAsync(() => {
            let mockUpdate = sandbox.stub(component, 'updateConnectionProfiles').returns(Promise.resolve());
            component['connectionProfiles'] = [{name: 'New Connection Profile'}];
            component.setV1Defaults();
            tick();
            component['addConnectionProfileName'].should.equal('New Connection Profile 2');
            verifyUnchangeableDefaults();
        }));

        function verifyUnchangeableDefaults() {
            component['addConnectionProfileDescription'].should.equal('A description for a V1 Profile');
            component['addConnectionProfileType'].should.equal('hlfv1');
            component['addConnectionProfileOrderers'].should.deep.equal([{
                url: 'grpc://localhost:7050',
                cert: '',
                hostnameOverride: ''
            }]);

            component['addConnectionProfileCertificateAuthority'].url.should.equal('http://localhost:7054');
            component['addConnectionProfileCertificateAuthority'].name.should.equal('');
            component['addConnectionProfilePeers'].should.deep.equal([{
                requestURL: 'grpc://localhost:7051',
                eventURL: 'grpc://localhost:7053',
                cert: '',
                hostnameOverride: ''
            }]);
            component['addConnectionProfileKeyValStore'].should.equal('/tmp/keyValStore');
            component['addConnectionProfileChannel'].should.equal('mychannel');
            component['addConnectionProfileMspId'].should.equal('Org1MSP');
            component['addConnectionProfileTimeout'].should.equal(300);
        }

    });

    describe('#updateConnectionProfiles', () => {

        it('should update/refresh the list of connection profiles', fakeAsync(() => {
            component.updateConnectionProfiles().then(() => {
                component['connectionProfiles'].should.deep.equal([
                    {name: 'profile0', profile: 'a', default: false},
                    {name: 'profile1', profile: 'b', default: false},
                    {name: 'profile2', profile: 'c', default: false}
                ]);
            });
        }));
    });

    describe('#addConnectionProfile', () => {

        let mockModal;
        let mockModalSpy;

        beforeEach(inject([NgbActiveModal], (activeModal: NgbActiveModal) => {
            mockModalSpy = sinon.spy(activeModal, 'close');

            component['addConnectionProfileName'] = NAME;
            component['addConnectionProfileDescription'] = DESC;
            component['addConnectionProfileMembershipServicesURL'] = MS_URL;
            component['addConnectionProfilePeerURL'] = PEER_URL;
            component['addConnectionProfileEventHubURL'] = EH_URL;
            component['addConnectionProfileKeyValStore'] = KEY_VAL_STORE;
            component['addConnectionProfileDeployWaitTime'] = DEPLOY_TIME;
            component['addConnectionProfileInvokeWaitTime'] = WAIT_TIME;
            component['addConnectionProfileCertificate'] = CERT;
            component['addConnectionProfileCertificatePath'] = CERT_PATH;
            component['addConnectionProfileOrderers'] = ORDERERS;
            component['addConnectionProfileCertificateAuthority'] = CA;
            component['addConnectionProfilePeers'] = PEERS;
            component['addConnectionProfileChannel'] = CHANNEL;
            component['addConnectionProfileMspId'] = MSPID;
            component['addConnectionProfileTimeout'] = TIMEOUT;
        }));

        it('should deal with the version being 0.6 and a certificate', fakeAsync(() => {
            let mockUpdate = sandbox.stub(component, 'updateConnectionProfiles').returns(Promise.resolve());
            let EXP = {
                default: false,
                name: 'New Profile',
                profile: {
                    certificate: CERT + '\n',
                    certificatePath: CERT_PATH,
                    deployWaitTime: DEPLOY_TIME,
                    description: DESC,
                    eventHubURL: EH_URL,
                    invokeWaitTime: WAIT_TIME,
                    keyValStore: KEY_VAL_STORE,
                    membershipServicesURL: MS_URL,
                    peerURL: PEER_URL,
                    type: 'hlf'
                }
            };

            component['version'] = 'v06';
            component.addConnectionProfile();
            mockModalSpy.should.have.been.calledWith(EXP);
        }));

        it('should deal with the version being 1', fakeAsync(() => {
            let mockUpdate = sandbox.stub(component, 'updateConnectionProfiles').returns(Promise.resolve());
            let EXP = {
                default: false,
                name: 'New Profile',
                profile: {
                    ca: CA,
                    channel: CHANNEL,
                    timeout: TIMEOUT,
                    description: DESC,
                    keyValStore: KEY_VAL_STORE,
                    mspID: MSPID,
                    orderers: [{url: 'orderers', cert: '', hostnameOverride: ''}],
                    peers: PEERS,
                    type: 'hlfv1'
                }
            };

            component['version'] = 'v1';
            component.addConnectionProfile();
            mockModalSpy.should.have.been.calledWith(EXP);
        }));

        it('should deal with an invalid version', fakeAsync(() => {
            try {
                component['version'] = 'badversion';
                component.addConnectionProfile();
            } catch (e) {
                e.message.should.contain('Unknown connection profile version selected');
            }
        }));
    });
});

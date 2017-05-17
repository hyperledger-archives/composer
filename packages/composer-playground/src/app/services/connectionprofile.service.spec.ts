/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */

import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { ConnectionProfileService } from './connectionprofile.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { WalletService } from './wallet.service';
import { AdminConnection } from 'composer-admin';
import * as sinon from 'sinon';
import { expect } from 'chai';

class LocalStorageMock {
    private values: Object = {};

    public get(key: string): Object {
        return this.values[key] || null;
    }

    public set(key: string, val: Object) {
        this.values[key] = val;
    }
}

describe('ConnectionProfileService', () => {
    let mockWalletService;
    let adminConnectionMock;

    beforeEach(() => {
        mockWalletService = sinon.createStubInstance(WalletService);
        adminConnectionMock = sinon.createStubInstance(AdminConnection);

        TestBed.configureTestingModule({
            providers: [ConnectionProfileService,
                {provide: LocalStorageService, useClass: LocalStorageMock},
                {provide: WalletService, useValue: mockWalletService}]
        });
    });

    describe('getCurrentConnectionProfile', () => {
        it('should return $default when no connection profile has been set',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;
                    let result = connectionProfileService.getCurrentConnectionProfile();
                    result.should.equal('$default');
                }));
    });

    describe('setCurrentConnectionProfile', () => {
        it('should set the connection profile',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;
                    connectionProfileService.setCurrentConnectionProfile('new');
                    connectionProfileService.getCurrentConnectionProfile().should.equal('new');
                }));
    });

    describe('getCertificate', () => {
        it('should have no certificate if not set',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;
                    expect(connectionProfileService.getCertificate()).to.not.exist;
                }
            ));
    });

    describe('setCertificate', () => {
        it('should set certificate',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;
                    const certificate: string = 'CERTIFICATE_STRING';
                    connectionProfileService.setCertificate(certificate);
                    connectionProfileService.getCertificate().should.equal(certificate);
                }
            ));
    });

    describe('getHostName', () => {
        it('should have no hostname if not set',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;
                    expect(connectionProfileService.getHostname()).to.not.exist;
                }
            ));
    });

    describe('setHostName', () => {
        it('should set hostname',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;
                    const hostname: string = 'HOSTNAME_STRING';
                    connectionProfileService.setHostname(hostname);
                    connectionProfileService['currentHostname'].should.equal(hostname);
                }
            ));
    });

    describe('should getAdminConnection', () => {
        it('should return admin connection if set',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;
                    const adminConnectionStub = sinon.createStubInstance(AdminConnection);
                    connectionProfileService['adminConnection'] = adminConnectionStub;
                    connectionProfileService.getAdminConnection().should.equal(adminConnectionStub);
                }
            ));
    });

    describe('createProfile', () => {
        it('should get result of createProfile from admin connection',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;

                    const nameArg: string = 'NAME';
                    const connectionProfileArg: string = 'CONNECTION_PROFILE';
                    let mockGetAdminConnection = sinon.stub(connectionProfileService, 'getAdminConnection').returns(adminConnectionMock);

                    connectionProfileService.createProfile(nameArg, connectionProfileArg);

                    mockGetAdminConnection.should.have.been.called;
                    adminConnectionMock.createProfile.should.have.been.calledWith(nameArg, connectionProfileArg);
                }));
    });

    describe('getProfile', () => {
        it('should get result of getProfile from admin connection',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;

                    const nameArg: string = 'NAME';

                    let mockGetAdminConnection = sinon.stub(connectionProfileService, 'getAdminConnection').returns(adminConnectionMock);

                    connectionProfileService.getProfile(nameArg);

                    mockGetAdminConnection.should.have.been.called;
                    adminConnectionMock.getProfile.should.have.been.calledWith(nameArg);
                }));
    });

    describe('deleteProfile', () => {
        it('should get result of deleteProfile from admin connection',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;

                    const nameArg: string = 'NAME';
                    const expectedResult: string = 'EXPECTED_RESULT';

                    let mockGetAdminConnection = sinon.stub(connectionProfileService, 'getAdminConnection').returns(adminConnectionMock);

                    connectionProfileService.deleteProfile(nameArg);

                    mockGetAdminConnection.should.have.been.called;
                    adminConnectionMock.deleteProfile.should.have.been.calledWith(nameArg);
                }));
    });

    describe('createDefaultProfile', () => {
        it('should get result of getProfile from admin connection if default profile doesn\'t exists',
            fakeAsync(inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;

                    let walletMock = {
                        add: sinon.stub()
                    };

                    mockWalletService.getWallet.returns(walletMock);

                    adminConnectionMock.getProfile.returns(Promise.reject('not exist'));
                    adminConnectionMock.createProfile.returns(Promise.resolve());

                    let mockGetAdminConnection = sinon.stub(connectionProfileService, 'getAdminConnection').returns(adminConnectionMock);

                    connectionProfileService.createDefaultProfile();

                    tick();

                    mockGetAdminConnection.should.have.been.called;
                    adminConnectionMock.createProfile.should.have.been.called;
                    mockWalletService.getWallet.should.have.been.calledWith('$default');
                    walletMock.add.should.have.been.calledWith('admin', 'adminpw');
                })));

        it('should get result of getProfile from admin connection if default profile does exists',
            fakeAsync(inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;

                    let walletMock = {
                        add: sinon.stub()
                    };

                    mockWalletService.getWallet.returns(walletMock);

                    adminConnectionMock.getProfile.returns(Promise.resolve());

                    let mockGetAdminConnection = sinon.stub(connectionProfileService, 'getAdminConnection').returns(adminConnectionMock);

                    connectionProfileService.createDefaultProfile();

                    tick();

                    mockGetAdminConnection.should.have.been.called;
                    adminConnectionMock.createProfile.should.not.have.been.called;
                })));
    });

    describe('getAllProfiles', () => {
        it('should get result of getAllProfiles from admin connection',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;

                    let mockGetAdminConnection = sinon.stub(connectionProfileService, 'getAdminConnection').returns(adminConnectionMock);

                    connectionProfileService.getAllProfiles();

                    mockGetAdminConnection.should.have.been.called;
                    adminConnectionMock.getAllProfiles.should.have.been.called;
                }));
    });
});

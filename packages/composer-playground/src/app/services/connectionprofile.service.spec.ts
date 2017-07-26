/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */

import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { ConnectionProfileService } from './connectionprofile.service';
import { WalletService } from './wallet.service';
import { AdminConnection } from 'composer-admin';
import * as sinon from 'sinon';
import { expect } from 'chai';

describe('ConnectionProfileService', () => {
    let mockWalletService;
    let adminConnectionMock;

    beforeEach(() => {
        mockWalletService = sinon.createStubInstance(WalletService);
        adminConnectionMock = sinon.createStubInstance(AdminConnection);

        TestBed.configureTestingModule({
            providers: [ConnectionProfileService,
                {provide: WalletService, useValue: mockWalletService}]
        });
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
        it('should get result of createProfile from admin connection if the profile does not exist',
            fakeAsync(inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;

                    adminConnectionMock.getProfile.returns(Promise.reject('not exist'));
                    let mockGetAdminConnection = sinon.stub(connectionProfileService, 'getAdminConnection').returns(adminConnectionMock);

                    const nameArg: string = 'NAME';
                    const connectionProfileArg: string = 'CONNECTION_PROFILE';
                    connectionProfileService.createProfile(nameArg, connectionProfileArg);

                    tick();

                    mockGetAdminConnection.should.have.been.called;
                    adminConnectionMock.getProfile.should.have.been.calledWith(nameArg);
                    adminConnectionMock.createProfile.should.have.been.calledWith(nameArg, connectionProfileArg);
                })));

        it('should get result of getProfile from admin connection if the profile does exist',
            inject([ConnectionProfileService],
                (connectionProfileService) => {
                    connectionProfileService.should.be.ok;

                    adminConnectionMock.getProfile.returns(Promise.resolve());
                    let mockGetAdminConnection = sinon.stub(connectionProfileService, 'getAdminConnection').returns(adminConnectionMock);

                    const nameArg: string = 'NAME';
                    const connectionProfileArg: string = 'CONNECTION_PROFILE';
                    connectionProfileService.createProfile(nameArg, connectionProfileArg);

                    mockGetAdminConnection.should.have.been.called;
                    adminConnectionMock.getProfile.should.have.been.calledWith(nameArg);
                    adminConnectionMock.createProfile.should.not.have.been.called;
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

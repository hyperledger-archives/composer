/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */

import { TestBed, inject } from '@angular/core/testing';
import { ConnectionProfileService } from './connectionprofile.service';
import { expect } from 'chai';

describe('ConnectionProfileService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConnectionProfileService]
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
});

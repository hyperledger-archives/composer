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

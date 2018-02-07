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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewCertificateComponent } from './view-certificate.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionProfileService } from '../../services/connectionprofile.service';

import * as sinon from 'sinon';

describe('ViewCertificateComponent', () => {
    let component: ViewCertificateComponent;
    let fixture: ComponentFixture<ViewCertificateComponent>;

    let ngbActiveModalMock = {
        close: sinon.stub(),
        dismiss: sinon.stub()
    };

    let mockCert;
    let mockHostname;

    let mockConnectionProfileService = {
        getCertificate: () => {
            return this.mockCert;
        },
        setCertificate: (input) => {
            this.mockCert = input;
        }
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ViewCertificateComponent],
            providers: [{provide: NgbActiveModal, useValue: ngbActiveModalMock},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService}]
        });
        fixture = TestBed.createComponent(ViewCertificateComponent);
        component = fixture.componentInstance;
    });

    it('should create ViewCertificateComponent', () => {
        component.should.be.ok;
    });

});

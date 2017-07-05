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

/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { ViewCertificateComponent } from './view-certificate.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {ConnectionProfileService} from '../services/connectionprofile.service';

describe('ViewCertificateComponent', () => {
  let component: ViewCertificateComponent;
  let fixture: ComponentFixture<ViewCertificateComponent>;

  let ngbActiveModalMock = {
    close: () => {
    },
    dismiss: () => {
    }
  };

  let mockCert;
  let mockHostname;

  let mockConnectionProfileService = {
    getCertificate:() => {
      return this.mockCert
    },
    setCertificate:(input) => {
      this.mockCert = input;
    },
    getHostname:() => {
      return this.mockHostname
    },
    setHostname:(input) => {
      this.mockHostname = input;
    }
  };

  beforeEach(() => {
      TestBed.configureTestingModule({
          declarations: [ ViewCertificateComponent ],
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

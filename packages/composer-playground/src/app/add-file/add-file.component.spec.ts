import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BusinessNetworkDefinition, AdminConnection } from 'composer-admin';

import { AddFileComponent } from './add-file.component';
import { AdminService } from '../admin.service';
import { ClientService } from '../client.service';


class MockAdminService {
  constructor() {}

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

describe('AddFileComponent', () => {

    let component: AddFileComponent;
    let fixture: ComponentFixture<AddFileComponent>;

    beforeEach(async(() => {
      return TestBed.configureTestingModule({
        declarations: [ AddFileComponent ],
        providers: [{ provide: AdminService, useClass: MockAdminService }, NgbActiveModal]
      })
      .compileComponents();
    }));

    beforeEach(() => {
      fixture = TestBed.createComponent(AddFileComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });


  // describe('#fileDetected', () => {
  //   it ('should change this.expandInput to true');
  // });

  // describe('#fileLeft', () => {
  //   it('should change this.expectedInput to false');
  // });

  // describe('#fileAccepted', () => {
  //   it('should set this.currentFile to a ModelFile');

  //   it('should set this.currentFile to a ScriptFile');

  //   it('should set currentFile name to the name of the imported file');
  // });

  // describe('#fileRejected', () => {
  //   it('should return an error status from the admin');
  // });

  // describe('#changeCurrentFileType', () => {});
});

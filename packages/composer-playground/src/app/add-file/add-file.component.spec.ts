import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { BusinessNetworkDefinition, AdminConnection } from 'composer-admin';
import { ModelFile } from 'composer-common';

import { AddFileComponent } from './add-file.component';
import { FileImporterComponent } from './../file-importer';
import { FileDragDropDirective } from './../directives/file-drag-drop';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { AlertService } from '../services/alert.service';

const fs = require('fs');


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

class MockAlertService {
  public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
  public busyStatus$: Subject<string> = new BehaviorSubject<string>(null);
}

describe('AddFileComponent', () => {

  let component: AddFileComponent;
  let fixture: ComponentFixture<AddFileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        FileImporterComponent,
        AddFileComponent,
        FileDragDropDirective
      ],
      imports: [
        FormsModule
      ],
      providers: [
        { provide: AdminService, useClass: MockAdminService },
        { provide: AlertService , useClass: MockAlertService },
        NgbActiveModal
      ]
    });

    fixture = TestBed.createComponent(AddFileComponent);
    component = fixture.componentInstance;
  }));


  describe('#fileDetected', () => {
    it('should change this.expandInput to true', () => {
      expect(() => {
        component.fileDetected();
      }).not.toThrow();
      expect(component.expandInput).toBe(true);
    });
  });

  describe('#fileLeft', () => {
    it('should change this.expectedInput to false', () => {
      component.fileLeft();
      expect(component.expandInput).toBe(false);
    });
  });

  describe('#fileAccepted', () => {
    it('should set this.currentFile to a ModelFile', () => {

      let b = new Blob(['/**CTO File*/'], { type: 'text/plain'});
      let file = new File([b], 'newfile.cto');

      return component.fileAccepted(file)
      .then(() => {
        expect(component.createModel).toHaveBeenCalled();
      })
      .catch((err) => {
        spyOn(component, 'fileRejected');
        expect(component.fileRejected).not.toHaveBeenCalled();
      });
    });

    // it('should set this.currentFile to a ScriptFile', () => {
    //   spyOn(component, 'createScript');
    //   // component.fileRejected = jasmine.createSpy('fileRejected spy')
    //   let file = new File(['/**CTO File*/'], 'newfile.cto');
    //   component.fileAccepted(file);
    //   expect(component.createScript).toHaveBeenCalled();
    // });

    it('should set currentFile name to the name of the imported file', () => {

    });
  });

  describe('#fileRejected', () => {
    it('should return an error status from the admin', () => {

    });
  });

  describe('#changeCurrentFileType', () => {
    it('should change this.currentFileType', () => {

    });
  });
});

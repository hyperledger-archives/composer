/* tslint:disable:no-unused-variable */
import {ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {DeleteConnectionProfileComponent} from './delete-connection-profile.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {ConnectionProfileService} from '../services/connectionprofile.service';
import * as sinon from 'sinon';
import { expect } from 'chai';

describe('DeleteConnectionProfileComponent', () => {

    let sandbox;
    let component: DeleteConnectionProfileComponent;
    let fixture: ComponentFixture<DeleteConnectionProfileComponent>;
    let stubConProfSvc;
    let stubActiveModal;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        stubConProfSvc = sinon.createStubInstance(ConnectionProfileService);
        stubActiveModal = sinon.createStubInstance(NgbActiveModal);
        
        TestBed.configureTestingModule({
            declarations: [DeleteConnectionProfileComponent], 
            providers: [
                {provide: ConnectionProfileService, useValue: stubConProfSvc },
                {provide: NgbActiveModal, useValue: stubActiveModal}
            ]
        });

        fixture = TestBed.createComponent(DeleteConnectionProfileComponent);
        component = fixture.componentInstance;
        
  });


  afterEach(() => {
    sandbox.restore();
  });

  it('should create a DeleteConnectionProfileComponent', () => {
        component.should.be.ok;
  });

  it('should call the service to delete the profile and close the active modal', () => {
        component.deleteProfile('name');
        stubConProfSvc.getCurrentlySelectedProfileName.should.have.been.called;
        stubConProfSvc.deleteProfile.should.have.been.called;
        stubActiveModal.close.should.have.been.called;
  });
});
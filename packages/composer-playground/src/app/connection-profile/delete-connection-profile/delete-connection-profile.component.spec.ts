/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteConnectionProfileComponent } from './delete-connection-profile.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionProfileService } from '../../services/connectionprofile.service';
import * as sinon from 'sinon';

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
                {provide: ConnectionProfileService, useValue: stubConProfSvc},
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
        component['profileName'] = 'bob';
        component.deleteProfile();
        stubConProfSvc.deleteProfile.should.have.been.calledWith('bob');
        stubActiveModal.close.should.have.been.called;
    });
});

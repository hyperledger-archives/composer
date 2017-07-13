/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, Input, Component } from '@angular/core';

import { ConnectionProfileComponent } from './connection-profile.component';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import * as sinon from 'sinon';
import * as chai from 'chai';
import { AlertService } from '../basic-modals/alert.service';

let should = chai.should();

@Component({
    selector: 'app-footer',
    template: ''
})
class MockFooterComponent {

}

@Directive({
    selector: 'connection-profile-data'
})
class MockConnectionProfileDataDirective {
    @Input()
    public profileUpdated;
    @Input()
    public connectionProfile;
}

describe('ConnectionProfileComponent', () => {
    let component: ConnectionProfileComponent;
    let fixture: ComponentFixture<ConnectionProfileComponent>;

    let mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
    let mockModal = sinon.createStubInstance(NgbModal);
    let mockAlertService = sinon.createStubInstance(AlertService);

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ConnectionProfileComponent, MockConnectionProfileDataDirective, MockFooterComponent],
            providers: [
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: NgbModal, useValue: mockModal}]
        });
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ConnectionProfileComponent);
        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
        it('should create', () => {
            component.should.be.ok;
        });

        it('should initialise the component', fakeAsync(() => {
            let mockUpdateConnectionProfiles = sinon.stub(component, 'updateConnectionProfiles').returns(Promise.resolve());
            let mockSetCurrentConnectionProfile = sinon.stub(component, 'setCurrentProfile');
            mockConnectionProfileService.getCurrentConnectionProfile.returns('bob');

            component['connectionProfiles'] = [{name: 'bob'}];

            component.ngOnInit();

            tick();

            mockUpdateConnectionProfiles.should.have.been.called;
            mockSetCurrentConnectionProfile.should.have.been.calledWith({name: 'bob'});
        }));

        it('should initialise the component with no current profile', fakeAsync(() => {
            let mockUpdateConnectionProfiles = sinon.stub(component, 'updateConnectionProfiles').returns(Promise.resolve());
            let mockSetCurrentConnectionProfile = sinon.stub(component, 'setCurrentProfile');
            mockConnectionProfileService.getCurrentConnectionProfile.returns('bob');

            component['connectionProfiles'] = [{name: 'fred'}];

            component.ngOnInit();

            tick();

            mockUpdateConnectionProfiles.should.have.been.called;
            mockSetCurrentConnectionProfile.should.not.have.been.called;
        }));
    });

    describe('setCurrentConnectionProfile', () => {
        it('should set the current connection profile', () => {
            let mockUpdateConnectionProfile = sinon.stub(component, 'updateConnectionProfiles');
            component['currentConnectionProfile'] = 'fred';
            component.setCurrentProfile('bob');

            component['previousConnectionProfile'].should.equal('fred');
            component['currentConnectionProfile'].should.equal('bob');

            mockUpdateConnectionProfile.should.have.been.called;
        });
    });

    describe('hideWarning', () => {
        it('should hide the warning', () => {
            component.hideWarning();

            component['warningVisible'].should.equal(false);
        });
    });

    describe('openAddProfileModal', () => {
        it('should open add profile modal', fakeAsync(() => {
            let mockSetCurrentProfile = sinon.stub(component, 'setCurrentProfile');

            mockModal.open.returns({
                result: Promise.resolve('bob')
            });

            component.openAddProfileModal();

            tick();

            mockModal.open.should.have.been.called;

            mockSetCurrentProfile.should.have.been.calledWith('bob');
        }));

        it('should open add profile modal and handle cancel', fakeAsync(() => {
            mockAlertService.errorStatus$ = {next: sinon.stub()};
            let mockSetCurrentProfile = sinon.stub(component, 'setCurrentProfile');

            mockModal.open.returns({
                result: Promise.reject(1)
            });

            component.openAddProfileModal();

            tick();

            mockModal.open.should.have.been.called;

            mockSetCurrentProfile.should.not.have.been.called;

            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should open add profile modal handle error', fakeAsync(() => {
            mockAlertService.errorStatus$ = {next: sinon.stub()};
            let mockSetCurrentProfile = sinon.stub(component, 'setCurrentProfile');

            mockModal.open.returns({
                result: Promise.reject('some error')
            });

            component.openAddProfileModal();

            tick();

            mockModal.open.should.have.been.called;

            mockSetCurrentProfile.should.not.have.been.called;

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));
    });

    describe('updateConnectionProfiles', () => {
        it('should update connection profiles', fakeAsync(() => {
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve({bob: {type: 'web'}}));
            mockConnectionProfileService.getCurrentConnectionProfile.returns('bob');

            component.updateConnectionProfiles();

            tick();

            component['connectionProfiles'].length.should.equal(1);
            component['connectionProfiles'].should.deep.equal([{default: false, name: 'bob', profile: {type: 'web'}}]);

            component['activeProfile'].should.equal('bob');
        }));

        it('should update connection profiles and set current profile', fakeAsync(() => {
            component['currentConnectionProfile'] = null;
            mockConnectionProfileService.getCurrentConnectionProfile.returns('bob');
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve({bob: {type: 'web'}}));

            component.updateConnectionProfiles();

            tick();

            component['connectionProfiles'].length.should.equal(1);
            component['connectionProfiles'].should.deep.equal([{default: false, name: 'bob', profile: {type: 'web'}}]);

            component['currentConnectionProfile'].should.equal('bob');
            component['activeProfile'].should.equal('bob');
        }));
    });

    describe('profileUpdated', () => {
        it('should set connection profiles', () => {
            let mockUpdateConnectionProfiles = sinon.stub(component, 'updateConnectionProfiles');
            let mockSetCurrentProfile = sinon.stub(component, 'setCurrentProfile');
            component.profileUpdated({updated: true, connectionProfile: {name : 'bob'}});

            mockUpdateConnectionProfiles.should.not.have.been.called;
            mockSetCurrentProfile.should.have.been.calledWith({name : 'bob'});
        });

        it('should update connection profiles', () => {
            let mockUpdateConnectionProfiles = sinon.stub(component, 'updateConnectionProfiles');
            let mockSetCurrentProfile = sinon.stub(component, 'setCurrentProfile');
            component.profileUpdated({updated: true});

            mockUpdateConnectionProfiles.should.have.been.called;
            mockSetCurrentProfile.should.not.have.been.called;
        });

        it('should switch to the previous connection profile', () => {
            component['previousConnectionProfile'] = {name : 'bob'};

            let mockUpdateConnectionProfiles = sinon.stub(component, 'updateConnectionProfiles');
            component.profileUpdated(null);

            component['currentConnectionProfile'].should.deep.equal({name : 'bob'});

            mockUpdateConnectionProfiles.should.have.been.called;
        });

        it('should switch back to in use profile if previous was a new connection profile', () => {
            component['previousConnectionProfile'] = {name : 'New Connection Profile'};
            mockConnectionProfileService.getCurrentConnectionProfile.returns('bob');

            component['connectionProfiles'] = [{name : 'fred'}, {name : 'bob'}];
            let mockUpdateConnectionProfiles = sinon.stub(component, 'updateConnectionProfiles');
            let mockSetCurrentProfile = sinon.stub(component, 'setCurrentProfile');
            component.profileUpdated(null);

            mockUpdateConnectionProfiles.should.not.have.been.called;
            mockSetCurrentProfile.should.have.been.calledOnce;
            mockSetCurrentProfile.should.have.been.calledWith({name : 'bob'});
        });
    });
});

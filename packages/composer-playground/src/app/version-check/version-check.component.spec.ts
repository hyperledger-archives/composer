/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, NgZone, EventEmitter } from '@angular/core';

import { VersionCheckComponent } from './version-check.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageService } from 'angular-2-local-storage';

import { IdentityCardStorageService } from '../services/identity-card-storage.service';

import * as sinon from 'sinon';

describe('VersionCheckComponent', () => {
    let component: VersionCheckComponent;
    let fixture: ComponentFixture<VersionCheckComponent>;
    let debug: DebugElement;
    let element: HTMLElement;

    let ngbActiveModalMock = {
        close: sinon.stub(),
        dismiss: sinon.stub()
    };

    let localStorageServiceMock;
    let identityCardStorageServiceMock;

    let reload;

    beforeEach(async(() => {
        localStorageServiceMock = sinon.createStubInstance(LocalStorageService);
        identityCardStorageServiceMock = sinon.createStubInstance(IdentityCardStorageService);

        TestBed.configureTestingModule({
            declarations: [VersionCheckComponent],
            providers: [
                {provide: NgbActiveModal, useValue: ngbActiveModalMock},
                {provide: NgZone, useValue: new NgZone({})},
                {provide: LocalStorageService, useValue: localStorageServiceMock},
                {provide: IdentityCardStorageService, useValue: identityCardStorageServiceMock}
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VersionCheckComponent);
        component = fixture.componentInstance;
        debug = fixture.debugElement.query(By.css('h1'));
        element = debug.nativeElement;

        fixture.detectChanges();
    });

    it('should create component', () => {
        component.should.be.ok;
    });

    it('should have correct title', () => {
        element.textContent.should.contain('Invalid version!');
    });

    it('should clear all local storage', () => {
        let runOutsideAngularStub = sinon.stub(fixture.ngZone, 'runOutsideAngular');
        localStorageServiceMock.clearAll.returns(true);
        identityCardStorageServiceMock.clearAll.returns(true);

        component.clearLocalStorage();

        localStorageServiceMock.clearAll.should.have.been.called;
        identityCardStorageServiceMock.clearAll.should.have.been.called;
        runOutsideAngularStub.should.have.been.called;
    });

    it('should handle unsupported browser for clearLocalStorage', () => {
        let runOutsideAngularStub = sinon.stub(fixture.ngZone, 'runOutsideAngular');
        localStorageServiceMock.clearAll.returns(false);

        (() => {
            component.clearLocalStorage();
        }).should.throw(Error, 'Failed to clear local storage');

        runOutsideAngularStub.should.not.have.been.called;
    });
});

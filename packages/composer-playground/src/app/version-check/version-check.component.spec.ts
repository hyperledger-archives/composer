/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, NgZone } from '@angular/core';

import { VersionCheckComponent } from './version-check.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageService } from 'angular-2-local-storage';

import * as sinon from 'sinon';
import { IdentityCardService } from '../services/identity-card.service';
import { IdCard } from 'composer-common';

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
    let identityCardServiceMock;

    let indexDBMock = sinon.stub(indexedDB, 'deleteDatabase').returns(Promise.resolve());

    beforeEach(async(() => {
        localStorageServiceMock = sinon.createStubInstance(LocalStorageService);
        identityCardServiceMock = sinon.createStubInstance(IdentityCardService);

        TestBed.configureTestingModule({
            declarations: [VersionCheckComponent],
            providers: [
                {provide: NgbActiveModal, useValue: ngbActiveModalMock},
                {provide: NgZone, useValue: new NgZone({})},
                {provide: LocalStorageService, useValue: localStorageServiceMock},
                {provide: IdentityCardService, useValue: identityCardServiceMock}
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(VersionCheckComponent);
        component = fixture.componentInstance;
        debug = fixture.debugElement.query(By.css('h1'));
        element = debug.nativeElement;

        fixture.detectChanges();

        let cardOne = new IdCard({userName : 'bob', businessNetwork: 'bn1'}, {name : 'cp1', type: 'hlfv1' });
        let cardTwo = new IdCard({userName : 'fred', businessNetwork: 'bn2'}, {name : 'cp1', type: 'web' });
        let cardThree = new IdCard({userName : 'jim'}, {name : 'cp1', type: 'web' });

        let cardMap: Map<string, IdCard> = new Map<string, IdCard>();

        cardMap.set('cardOne', cardOne);
        cardMap.set('cardTwo', cardTwo);
        cardMap.set('cardThree', cardThree);

        identityCardServiceMock.getIdentityCards.returns(Promise.resolve(cardMap));
    });

    it('should create component', () => {
        component.should.be.ok;
    });

    it('should have correct title', () => {
        element.textContent.should.contain('Invalid version!');
    });

    it('should clear all local storage and remove indexDB', fakeAsync(() => {
        let runOutsideAngularStub = sinon.stub(fixture.ngZone, 'runOutsideAngular');
        localStorageServiceMock.clearAll.returns(true);

        component.clearLocalStorage();

        tick();

        indexDBMock.should.have.been.calledTwice;
        indexDBMock.firstCall.should.have.been.calledWith('_pouch_Composer:bn2');
        indexDBMock.secondCall.should.have.been.calledWith('_pouch_Composer');

        localStorageServiceMock.clearAll.should.have.been.called;
        runOutsideAngularStub.should.have.been.called;
    }));

    it('should handle unsupported browser for clearLocalStorage', fakeAsync(() => {
        let runOutsideAngularStub = sinon.stub(fixture.ngZone, 'runOutsideAngular');
        localStorageServiceMock.clearAll.returns(false);

        (() => {
            component.clearLocalStorage();
            tick();
        }).should.throw(Error, 'Failed to clear local storage');

        runOutsideAngularStub.should.not.have.been.called;
    }));
});

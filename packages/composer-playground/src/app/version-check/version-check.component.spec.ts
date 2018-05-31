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
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, NgZone } from '@angular/core';

import { VersionCheckComponent } from './version-check.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { LocalStorageService } from 'angular-2-local-storage';

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

    let indexDBMock = sinon.stub(indexedDB, 'deleteDatabase').returns(Promise.resolve());

    beforeEach(async(() => {
        localStorageServiceMock = sinon.createStubInstance(LocalStorageService);

        TestBed.configureTestingModule({
            declarations: [VersionCheckComponent],
            providers: [
                {provide: NgbActiveModal, useValue: ngbActiveModalMock},
                {provide: NgZone, useValue: new NgZone({})},
                {provide: LocalStorageService, useValue: localStorageServiceMock}
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

    it('should clear all local storage and remove indexDB', fakeAsync(() => {
        let runOutsideAngularStub = sinon.stub(fixture.ngZone, 'runOutsideAngular');
        localStorageServiceMock.clearAll.returns(true);

        component.clearLocalStorage();

        tick();

        indexDBMock.should.have.been.calledOnce;
        indexDBMock.firstCall.should.have.been.calledWith('_pouch_Composer');

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

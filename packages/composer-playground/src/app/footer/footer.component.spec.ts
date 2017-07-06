import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { FooterComponent } from './footer.component';
import { AboutService } from '../services/about.service';
import { AlertService } from '../basic-modals/alert.service';

import * as sinon from 'sinon';
import * as sap from 'sinon-as-promised';

import * as chai from 'chai';

class MockAlertService {
    public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
    public busyStatus$: Subject<string> = new BehaviorSubject<string>(null);
}

describe('FooterComponent', () => {

    let component: FooterComponent;
    let fixture: ComponentFixture<FooterComponent>;
    let de: DebugElement;
    let el: HTMLElement;
    let mockAboutService;

    beforeEach(() => {

        mockAboutService = sinon.createStubInstance(AboutService);

        TestBed.configureTestingModule({
            declarations: [FooterComponent],
            providers: [
                {provide: AboutService, useValue: mockAboutService},
                {provide: AlertService, useClass: MockAlertService}
            ]
        });

        fixture = TestBed.createComponent(FooterComponent);
        component = fixture.componentInstance;

        //  query for the title <h2> by CSS element selector
        de = fixture.debugElement.query(By.css('a'));
        el = de.nativeElement;
    });

    describe('ngOninit', () => {
        it('should call getVersions from the AboutService', fakeAsync(() => {
            mockAboutService.getVersions.resolves({playground: {version: 'v1'}});
            component.ngOnInit();
            tick();
            component['playgroundVersion'].should.equal('v1');
        }));

        it('should send the error to the AlertService', fakeAsync(() => {
            mockAboutService.getVersions.returns(Promise.reject('detailed reject message'));
            component.ngOnInit();
            tick();
            component['alertService'].errorStatus$.subscribe(
                (message) => {
                    message.should.equal('detailed reject message');
                }
            );
        }));
    });
});

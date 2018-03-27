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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement, Input } from '@angular/core';
import { By } from '@angular/platform-browser';

import * as chai from 'chai';
import * as sinon from 'sinon';

let should = chai.should();

import { BusyComponent } from './busy.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IdCard } from 'composer-common';

@Component({
    selector: 'identity-card',
    template: '<section class="identity-card"></section>'
})
class MockIdentityCardComponent {
    @Input() identity: any;
    @Input() preview: boolean;
}

@Component({
    template: `
        <busy [busy]="busy" [header]="header" [card]="card"></busy>`
})
class TestHostComponent {
    busy: any = {
        title: 'myTitle',
        text: 'myText'
    };

    header = null;

    card = null;
}

describe('BusyComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

    let busyElement: DebugElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [BusyComponent, TestHostComponent, MockIdentityCardComponent],
            providers: [{provide: NgbActiveModal, useValue: mockActiveModal}]
        });

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;

        busyElement = fixture.debugElement.query(By.css('busy'));
    });

    it('should create', () => {
        component.should.be.ok;
    });

    it('should display the error', () => {
        fixture.detectChanges();
        let headerSection = busyElement.query(By.css('.modal-header'));
        let titleElement = busyElement.queryAll(By.css('span'));
        titleElement[1].nativeElement.innerHTML.should.equal('myTitle');

        let textElement = busyElement.queryAll(By.css('.busy-text'));
        textElement[0].nativeElement.innerHTML.should.equal('myText');

        component['busy'] = {
            title: 'differentTitle',
            text: 'differentText'
        };

        fixture.detectChanges();
        titleElement[1].nativeElement.innerHTML.should.equal('differentTitle');

        textElement[0].nativeElement.innerHTML.should.equal('differentText');

        should.not.exist(headerSection);
    });

    it('should display a header if there is one', () => {
        component.header = 'myHeader';
        fixture.detectChanges();
        let headerSection = busyElement.query(By.css('.modal-header'));
        let headerHeading = headerSection.query(By.css('h1'));
        headerHeading.nativeElement.textContent.should.equal('myHeader');

        let titleElement = busyElement.queryAll(By.css('span'));
        titleElement[1].nativeElement.innerHTML.should.equal('myTitle');

        let textElement = busyElement.queryAll(By.css('.busy-text'));
        textElement[0].nativeElement.innerHTML.should.equal('myText');
    });

    it('should display a header if there is one', () => {
        component.header = 'myHeader';
        fixture.detectChanges();
        let headerContainer = busyElement.query(By.css('.modal-header'));
        let headerElement = headerContainer.query(By.css('h1'));
        headerElement.nativeElement.innerHTML.should.equal('myHeader');

        let titleElement = busyElement.queryAll(By.css('span'));
        titleElement[1].nativeElement.innerHTML.should.equal('myTitle');

        let textElement = busyElement.queryAll(By.css('.busy-text'));
        textElement[0].nativeElement.innerHTML.should.equal('myText');
    });

    it('should display an identity card if there is one', () => {
        component.header = 'myHeader';
        component.card = sinon.createStubInstance(IdCard);

        fixture.detectChanges();

        let titleContainer = busyElement.query(By.css('.busy-title'));
        let titleElement = titleContainer.query(By.css('h2'));
        titleElement.nativeElement.innerHTML.should.equal('myTitle');

        let textElement = busyElement.query(By.css('.busy-text'));
        textElement.nativeElement.innerHTML.should.equal('myText');

        let cardElement = busyElement.query(By.css('.identity-card'));
        should.exist(cardElement);
    });

    it('should display an identity card and progress if there is any', () => {
        component.busy.progress = [ 'myProgress' ];
        component.header = 'myHeader';
        component.card = sinon.createStubInstance(IdCard);

        fixture.detectChanges();

        let titleContainers = busyElement.queryAll(By.css('.busy-title'));
        let progressElement = titleContainers[0].query(By.css('h2'));
        progressElement.nativeElement.innerHTML.should.equal('myProgress');
        let titleElement = titleContainers[1].query(By.css('h2'));
        titleElement.nativeElement.innerHTML.should.equal('myTitle');

        let textElement = busyElement.query(By.css('.busy-text'));
        textElement.nativeElement.innerHTML.should.equal('myText');

        let cardElement = busyElement.query(By.css('.identity-card'));
        should.exist(cardElement);
    });
});

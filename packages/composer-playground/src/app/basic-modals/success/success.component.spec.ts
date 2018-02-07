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
/* tslint:disable:no-unused-expression */
import { ComponentFixture, TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SuccessComponent } from './success.component';
import { AlertService } from '../alert.service';

import * as sinon from 'sinon';

describe('SuccessComponent', () => {
    let component: SuccessComponent;
    let fixture: ComponentFixture<SuccessComponent>;
    let successElement: DebugElement;

    let messageTimeout = 4000;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NoopAnimationsModule],
            declarations: [SuccessComponent],
            providers: [
                AlertService
            ]
        });

        fixture = TestBed.createComponent(SuccessComponent);
        component = fixture.componentInstance;

        successElement = fixture.debugElement;
    });

    it('should create', () => {
        component.should.be.ok;
    });

    it('should subscribe to alerts and only dismiss on close', fakeAsync(inject([AlertService], (service: AlertService) => {
        fixture.detectChanges();

        service.successStatus$.next({title: 'myTitle', text: 'myText', icon: '#icon', keep: true});

        tick();

        fixture.detectChanges();

        component['messages'].length.should.equal(1);

        component['messages'][0].should.deep.equal({title: 'myTitle', text: 'myText', icon: '#icon', keep: true});

        let allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(1);

        let titleElement = allMessageElements[0].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle');

        let textElement = allMessageElements[0].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText');

        // try and trigger close after time
        tick(messageTimeout);

        fixture.detectChanges();

        component['messages'].length.should.equal(1);

        component['messages'][0].should.deep.equal({title: 'myTitle', text: 'myText', icon: '#icon', keep: true});

        allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(1);

        titleElement.nativeElement.textContent.should.equal('myTitle');
        textElement.nativeElement.innerHTML.should.equal('myText');

        // close by clicking cross
        let closeButton = successElement.queryAll(By.css('button'))[0];

        closeButton.triggerEventHandler('click', null);

        component['messages'].length.should.equal(0);

        allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(1);
    })));

    it('should only keep a max of 3 alerts', fakeAsync(inject([AlertService], (service: AlertService) => {
        fixture.detectChanges();

        service.successStatus$.next({title: 'myTitle1', text: 'myText1', icon: '#icon', keep: true});

        tick();

        fixture.detectChanges();

        component['messages'].length.should.equal(1);

        component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText1', icon: '#icon', keep: true});

        let allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(1);

        let titleElement = allMessageElements[0].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle1');

        let textElement = allMessageElements[0].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText1');

        service.successStatus$.next({title: 'myTitle2', text: 'myText2', icon: '#icon', keep: true});

        tick();

        fixture.detectChanges();

        component['messages'].length.should.equal(2);

        component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText1', icon: '#icon', keep: true});
        component['messages'][1].should.deep.equal({title: 'myTitle2', text: 'myText2', icon: '#icon', keep: true});

        allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(2);

        titleElement = allMessageElements[0].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle1');

        titleElement = allMessageElements[1].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle2');

        textElement = allMessageElements[0].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText1');

        textElement = allMessageElements[1].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText2');

        service.successStatus$.next({title: 'myTitle3', text: 'myText3', icon: '#icon', keep: true});

        tick();

        fixture.detectChanges();

        component['messages'].length.should.equal(3);

        component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText1', icon: '#icon', keep: true});
        component['messages'][1].should.deep.equal({title: 'myTitle2', text: 'myText2', icon: '#icon', keep: true});
        component['messages'][2].should.deep.equal({title: 'myTitle3', text: 'myText3', icon: '#icon', keep: true});

        allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(3);

        titleElement = allMessageElements[0].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle1');

        titleElement = allMessageElements[1].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle2');

        titleElement = allMessageElements[2].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle3');

        textElement = allMessageElements[0].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText1');

        textElement = allMessageElements[1].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText2');

        textElement = allMessageElements[2].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText3');

        service.successStatus$.next({title: 'myTitle4', text: 'myText4', icon: '#icon', keep: true});

        tick();

        fixture.detectChanges();

        tick();

        fixture.detectChanges();

        component['messages'].length.should.equal(3);

        component['messages'][0].should.deep.equal({title: 'myTitle2', text: 'myText2', icon: '#icon', keep: true});
        component['messages'][1].should.deep.equal({title: 'myTitle3', text: 'myText3', icon: '#icon', keep: true});
        component['messages'][2].should.deep.equal({title: 'myTitle4', text: 'myText4', icon: '#icon', keep: true});

        allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(3);

        titleElement = allMessageElements[0].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle2');

        titleElement = allMessageElements[1].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle3');

        titleElement = allMessageElements[2].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle4');

        textElement = allMessageElements[0].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText2');

        textElement = allMessageElements[1].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText3');

        textElement = allMessageElements[2].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText4');

        // needed because of the debounce;
        tick(4000);
    })));

    it('should remove messages after 4 seconds', fakeAsync(inject([AlertService], (service: AlertService) => {
        fixture.detectChanges();

        service.successStatus$.next({title: 'myTitle', text: 'myText', icon: '#icon'});

        tick();

        fixture.detectChanges();

        component['messages'].length.should.equal(1);

        component['messages'][0].should.deep.equal({title: 'myTitle', text: 'myText', icon: '#icon'});

        let allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(1);

        let titleElement = allMessageElements[0].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle');

        let textElement = allMessageElements[0].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText');

        tick(messageTimeout);

        fixture.detectChanges();

        component['messages'].length.should.equal(0);

        allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(0);
    })));

    it('should only remove non keep messages after 4 seconds', fakeAsync(inject([AlertService], (service: AlertService) => {
        fixture.detectChanges();

        service.successStatus$.next({title: 'myTitle1', text: 'myText1', icon: '#icon', keep: true});
        service.successStatus$.next({title: 'myTitle2', text: 'myText2', icon: '#icon'});

        tick();

        fixture.detectChanges();

        component['messages'].length.should.equal(2);

        component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText1', icon: '#icon', keep: true});
        component['messages'][1].should.deep.equal({title: 'myTitle2', text: 'myText2', icon: '#icon'});

        let allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(2);

        let titleElement = allMessageElements[0].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle1');

        titleElement = allMessageElements[1].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle2');

        let textElement = allMessageElements[0].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText1');

        textElement = allMessageElements[1].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText2');

        tick(messageTimeout);

        fixture.detectChanges();

        component['messages'].length.should.equal(1);

        component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText1', icon: '#icon', keep: true});

        allMessageElements = successElement.queryAll(By.css('.container'));
        allMessageElements.length.should.equal(1);

        titleElement = allMessageElements[0].query(By.css('.notification-title'));
        titleElement.nativeElement.textContent.should.equal('myTitle1');

        textElement = allMessageElements[0].query(By.css('.notification-text'));
        textElement.nativeElement.innerHTML.should.equal('myText1');
    })));

    it('should handle already closed messages', fakeAsync(inject([AlertService], (service: AlertService) => {

        try {
            fixture.detectChanges();

            service.successStatus$.next({title: 'myTitle1', text: 'myText1', icon: '#icon'});

            tick();

            fixture.detectChanges();

            component['messages'].length.should.equal(1);

            component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText1', icon: '#icon'});

            let allMessageElements = successElement.queryAll(By.css('.container'));
            allMessageElements.length.should.equal(1);

            let titleElement = allMessageElements[0].query(By.css('.notification-title'));
            titleElement.nativeElement.textContent.should.equal('myTitle1');

            let textElement = allMessageElements[0].query(By.css('.notification-text'));
            textElement.nativeElement.innerHTML.should.equal('myText1');

            let closeButton = successElement.queryAll(By.css('button'))[0];

            closeButton.triggerEventHandler('click', null);

            tick(messageTimeout);

            fixture.detectChanges();

            component['messages'].length.should.equal(0);

            allMessageElements = successElement.queryAll(By.css('.container'));
            allMessageElements.length.should.equal(0);
        } catch (error) {
            throw new Error('should not get here ' + error.message);
        }
    })));

    describe('#onLink', () => {
        it('should call callback', fakeAsync(inject([AlertService], (service: AlertService) => {
            fixture.detectChanges();

            let result: string = '';

            let myCallback = () => {
                result = 'I did a call back';
            };

            service.successStatus$.next({
                title: 'myTitle',
                text: 'myText',
                icon: '#icon',
                keep: true,
                link: 'myLink',
                linkCallback: myCallback
            });

            tick();

            fixture.detectChanges();

            component['messages'].length.should.equal(1);

            component['messages'][0].should.deep.equal({
                title: 'myTitle', text: 'myText', icon: '#icon', keep: true, link: 'myLink',
                linkCallback: myCallback
            });

            let allMessageElements = successElement.queryAll(By.css('.container'));
            allMessageElements.length.should.equal(1);

            let titleElement = allMessageElements[0].query(By.css('.notification-title'));
            titleElement.nativeElement.textContent.should.equal('myTitle');

            let textElement = allMessageElements[0].query(By.css('.notification-text'));
            textElement.nativeElement.innerHTML.should.equal('myText');

            let callBackElement = allMessageElements[0].query(By.css('div p a'));

            callBackElement.nativeElement.textContent.should.equal('myLink');

            callBackElement.triggerEventHandler('click', null);

            result.should.equal('I did a call back');

            // needed because of the debounce;
            tick(4000);
        })));

        it('should not call callback', () => {
            let cb = sinon.stub();
            component.onLink(false);
            cb.should.not.have.been.called;
        });
    });
});

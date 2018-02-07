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
import { By } from '@angular/platform-browser';
import { Component, DebugElement } from '@angular/core';

import { IdCard } from 'composer-common';

import { IdentityCardComponent } from './identity-card.component';

import * as chai from 'chai';
import * as sinon from 'sinon';

let should = chai.should();

@Component({
    template: `
        <identity-card [identity]="identity" [indestructible]="indestructible" [cardRef]="cardRef" [preview]="preview"
                       [showSpecial]="showSpecial" [showDismissIcon]="showDismissIcon" (onConnect)="onConnect($event)"
                       (onDeploySample)="onDeploySample($event)" (onDismiss)="onDismiss($event)"
                       (onDelete)="onDelete($event)"
                       (onExport)="onExport($event)"></identity-card>`

})
class TestHostComponent {

    identity: IdCard = new IdCard({
        userName: 'pedantic-owl',
        businessNetwork: 'conga-network'
    }, {'name': 'dialup-modem', 'x-type': 'hlfv1'});
    cardRef: string;
    preview: boolean = false;
    showDismissIcon: boolean = false;
    indestructible: boolean = false;
    showSpecial: boolean = false;

    public result: String;

    onConnect(data) {
        this.result = data;
    }

    onDeploySample(data) {
        this.result = data;
    }

    onDismiss(data) {
        this.result = data;
    }

    onDelete(data) {
        this.result = data;
    }

    onExport(data) {
        this.result = data;
    }
}

describe(`IdentityCardComponent`, () => {

    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    let identityCardElement: DebugElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [TestHostComponent, IdentityCardComponent]
        });

        fixture = TestBed.createComponent(TestHostComponent);

        component = fixture.componentInstance;
        component.result = null;

        identityCardElement = fixture.debugElement.query(By.css('identity-card'));
    });

    describe('#connect', () => {
        it('should emit connect event', () => {
            let connectEventSpy = sinon.spy(component, 'onConnect');

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.connect'));
            button.triggerEventHandler('click', null);

            fixture.detectChanges();

            connectEventSpy.should.have.been.called;
            component.result.should.equal('pedantic-owl');
        });
    });

    describe('deploySample', () => {
        it('should emit the deploy sample event', () => {
            let deployEventSpy = sinon.spy(component, 'onDeploySample');
            component['identity'] = null;
            component['showSpecial'] = true;

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.connect'));
            button.triggerEventHandler('click', null);

            deployEventSpy.should.have.been.called;
            should.not.exist(component.result);
        });
    });

    describe('#dismiss', () => {
        it('should emit dismiss event', () => {
            let dismissEventSpy = sinon.spy(component, 'onDismiss');
            component['showDismissIcon'] = true;

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.dismiss'));
            button.triggerEventHandler('click', null);

            dismissEventSpy.should.have.been.called;
            component.result.should.equal('pedantic-owl');
        });
    });

    describe('#delete', () => {
        it('should emit delete event', () => {
            let deleteEventSpy = sinon.spy(component, 'onDelete');

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.delete'));
            button.triggerEventHandler('click', null);

            deleteEventSpy.should.have.been.called;
            component.result.should.equal('pedantic-owl');
        });
    });

    describe('#export', () => {
        it('should emit export event', () => {
            let exportEventSpy = sinon.spy(component, 'onExport');

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.export'));
            button.triggerEventHandler('click', null);

            exportEventSpy.should.have.been.called;
            component.result.should.equal('pedantic-owl');
        });
    });

    describe('#getInitials', () => {
        it('should get one initial', () => {
            component['identity'] = new IdCard({
                userName: 'admin',
                businessNetwork: 'conga-network'
            }, {'name': 'dialup-modem', 'x-type': 'hlfv1'});

            fixture.detectChanges();

            let initialsElement = identityCardElement.query(By.css('.initials'));

            initialsElement.nativeElement.textContent.should.equal('a');
        });

        it('should get two initials', () => {
            component['identity'] = new IdCard({
                userName: 'pedantic owl',
                businessNetwork: 'conga-network'
            }, {'name': 'dialup-modem', 'x-type': 'hlfv1'});

            fixture.detectChanges();

            let initialsElement = identityCardElement.query(By.css('.initials'));

            initialsElement.nativeElement.textContent.should.equal('po');
        });

        it('should get maximum of two initials', () => {
            component['identity'] = new IdCard({
                userName: 'eat conga repeat',
                businessNetwork: 'conga-network'
            }, {'name': 'dialup-modem', 'x-type': 'hlfv1'});

            fixture.detectChanges();

            let initialsElement = identityCardElement.query(By.css('.initials'));

            initialsElement.nativeElement.textContent.should.equal('ec');
        });

        it('should get non-ascii \'initials\'', () => {
            component['identity'] = new IdCard({
                userName: '黄 丽',
                businessNetwork: 'conga-network'
            }, {'name': 'dialup-modem', 'x-type': 'hlfv1'});

            fixture.detectChanges();

            let initialsElement = identityCardElement.query(By.css('.initials'));

            initialsElement.nativeElement.textContent.should.equal('黄丽');
        });

        it('should smile if there are no initials', () => {
            component['identity'] = new IdCard({
                userName: ' ',
                businessNetwork: 'conga-network'
            }, {'name': 'dialup-modem', 'x-type': 'hlfv1'});

            fixture.detectChanges();

            let initialsElement = identityCardElement.query(By.css('.initials'));

            initialsElement.nativeElement.textContent.should.equal(':)');
        });
    });

    describe('#getRoles', () => {
        it('should get PeerAdmin role', () => {
            component['identity'] = new IdCard({
                userName: 'pedantic-owl',
                businessNetwork: 'conga-network',
                roles: ['PeerAdmin']
            }, {'name': 'dialup-modem', 'x-type': 'hlfv1'});

            fixture.detectChanges();

            let rolesElement = identityCardElement.query(By.css('.role-icon'));

            rolesElement.nativeElement.title.should.equal('PeerAdmin');
        });

        it('should get ChannelAdmin role', () => {
            component['identity'] = new IdCard({
                userName: 'pedantic-owl',
                businessNetwork: 'conga-network',
                roles: ['ChannelAdmin']
            }, {'name': 'dialup-modem', 'x-type': 'hlfv1'});

            fixture.detectChanges();

            let rolesElement = identityCardElement.query(By.css('.role-icon'));

            rolesElement.nativeElement.title.should.equal('ChannelAdmin');
        });

        it('should not get other roles', () => {
            component['identity'] = new IdCard({
                userName: 'pedantic-owl',
                businessNetwork: 'conga-network',
                roles: ['GreenConga']
            }, {'name': 'dialup-modem', 'x-type': 'hlfv1'});

            fixture.detectChanges();

            let rolesElement = identityCardElement.query(By.css('.role-icon'));

            should.not.exist(rolesElement);
        });

        it('should get valid roles as comma separated string', () => {
            component['identity'] = new IdCard({
                userName: 'pedantic-owl',
                businessNetwork: 'conga-network',
                roles: ['BlueConga', 'PeerAdmin', 'GreenConga', 'ChannelAdmin', 'PurpleConga']
            }, {'name': 'dialup-modem', 'x-type': 'hlfv1'});

            fixture.detectChanges();

            let rolesElement = identityCardElement.query(By.css('.role-icon'));

            rolesElement.nativeElement.title.should.equal('PeerAdmin, ChannelAdmin');
        });
    });
});

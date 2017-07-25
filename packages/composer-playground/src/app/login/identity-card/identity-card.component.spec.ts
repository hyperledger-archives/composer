import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { IdentityCardComponent } from './identity-card.component';

import * as chai from 'chai';
import * as sinon from 'sinon';

let should = chai.should();

describe(`IdentityCardComponent`, () => {

    let component: IdentityCardComponent;
    let fixture: ComponentFixture<IdentityCardComponent>;

    let mockAdminService;
    let mockIdentityService;
    let mockClientService;
    let mockConnectionProfileService;
    let mockInitializationService;
    let routerStub;
    let mockAlertService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [IdentityCardComponent]
        });

        fixture = TestBed.createComponent(IdentityCardComponent);

        component = fixture.componentInstance;
    });

    describe('#connect', () => {
        it('should emit connect event', (done) => {
            component.identity = {
                userId: 'pedantic-owl'
            };

            component.onConnect.subscribe((e) => {
                e.should.equal('pedantic-owl');
                done();
            });

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.connect'));
            button.nativeElement.click();
        });
    });

    describe('#dismiss', () => {
        it('should emit dismiss event', (done) => {
            component.preview = true;
            component.identity = {
                userId: 'pedantic-owl'
            };

            component.onDismiss.subscribe((e) => {
                e.should.equal('pedantic-owl');
                done();
            });

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.dismiss'));
            button.nativeElement.click();
        });
    });

    describe('#delete', () => {
        it('should emit delete event', (done) => {
            component.identity = {
                userId: 'pedantic-owl'
            };

            component.onDelete.subscribe((e) => {
                e.should.equal('pedantic-owl');
                done();
            });

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.delete'));
            button.nativeElement.click();
        });
    });

    describe('#export', () => {
        it('should emit export event', (done) => {
            component.identity = {
                userId: 'pedantic-owl'
            };

            component.onExport.subscribe((e) => {
                e.should.equal('pedantic-owl');
                done();
            });

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.export'));
            button.nativeElement.click();
        });
    });

    describe('#getInitials', () => {
        it('should get one initial', () => {
            component.identity = {
                userId: 'admin'
            };

            let result = component.getInitials();

            result.should.equal('a');
        });

        it('should get two initials', () => {
            component.identity = {
                userId: 'pedantic owl'
            };

            let result = component.getInitials();

            result.should.equal('po');
        });

        it('should get maximum of two initials', () => {
            component.identity = {
                userId: 'eat conga repeat'
            };

            let result = component.getInitials();

            result.should.equal('ec');
        });

        it('should get non-ascii \'initials\'', () => {
            component.identity = {
                userId: '黄 丽'
            };

            let result = component.getInitials();

            result.should.equal('黄丽');
        });

        it('should smile if there are no initials', () => {
            component.identity = {
                userId: ' '
            };

            let result = component.getInitials();

            result.should.equal(':)');
        });
    });
});

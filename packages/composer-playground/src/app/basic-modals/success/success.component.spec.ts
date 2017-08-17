/* tslint:disable:no-unused-expression */
import { ComponentFixture, TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { SuccessComponent } from './success.component';
import { AlertService } from '../alert.service';

import * as chai from 'chai';
import * as sinon from 'sinon';

let should = chai.should();

describe('SuccessComponent', () => {
    let component: SuccessComponent;
    let fixture: ComponentFixture<SuccessComponent>;

    let messageTimeout = 4000;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [SuccessComponent],
            providers: [
                AlertService
            ]
        });

        fixture = TestBed.createComponent(SuccessComponent);
        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
        it('should create', () => {
            component.should.be.ok;
        });

        it('should subscribe to alerts and only dismiss on close', fakeAsync(inject([AlertService], (service: AlertService) => {

            component.ngOnInit();

            service.successStatus$.next({title: 'myTitle', text: 'myText', icon: '#icon', keep: true});

            tick();

            component['messages'].length.should.equal(1);

            component['messages'][0].should.deep.equal({title: 'myTitle', text: 'myText', icon: '#icon', keep: true});

            tick(messageTimeout);

            component['messages'].length.should.equal(1);

            component['messages'][0].should.deep.equal({title: 'myTitle', text: 'myText', icon: '#icon', keep: true});
        })));

        it('should only keep a max of 3 alerts', fakeAsync(inject([AlertService], (service: AlertService) => {
            component.ngOnInit();

            service.successStatus$.next({title: 'myTitle1', text: 'myText', icon: '#icon', keep: true});

            tick();

            component['messages'].length.should.equal(1);

            component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText', icon: '#icon', keep: true});

            service.successStatus$.next({title: 'myTitle2', text: 'myText', icon: '#icon', keep: true});

            tick();

            component['messages'].length.should.equal(2);

            component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText', icon: '#icon', keep: true});
            component['messages'][1].should.deep.equal({title: 'myTitle2', text: 'myText', icon: '#icon', keep: true});

            service.successStatus$.next({title: 'myTitle3', text: 'myText', icon: '#icon', keep: true});

            tick();

            component['messages'].length.should.equal(3);

            component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText', icon: '#icon', keep: true});
            component['messages'][1].should.deep.equal({title: 'myTitle2', text: 'myText', icon: '#icon', keep: true});
            component['messages'][2].should.deep.equal({title: 'myTitle3', text: 'myText', icon: '#icon', keep: true});

            service.successStatus$.next({title: 'myTitle4', text: 'myText', icon: '#icon', keep: true});

            tick();

            tick();

            component['messages'].length.should.equal(3);

            component['messages'][0].should.deep.equal({title: 'myTitle2', text: 'myText', icon: '#icon', keep: true});
            component['messages'][1].should.deep.equal({title: 'myTitle3', text: 'myText', icon: '#icon', keep: true});
            component['messages'][2].should.deep.equal({title: 'myTitle4', text: 'myText', icon: '#icon', keep: true});

            tick(messageTimeout);
        })));

        it('should remove messages after 4 seconds', fakeAsync(inject([AlertService], (service: AlertService) => {
            component.ngOnInit();

            service.successStatus$.next({title: 'myTitle', text: 'myText', icon: '#icon'});

            tick();

            component['messages'].length.should.equal(1);

            component['messages'][0].should.deep.equal({title: 'myTitle', text: 'myText', icon: '#icon'});

            tick(messageTimeout);

            component['messages'].length.should.equal(0);
        })));

        it('should only remove non keep messages after 4 seconds', fakeAsync(inject([AlertService], (service: AlertService) => {
            component.ngOnInit();

            service.successStatus$.next({title: 'myTitle1', text: 'myText', icon: '#icon', keep: true});
            service.successStatus$.next({title: 'myTitle', text: 'myText', icon: '#icon'});

            tick();

            component['messages'].length.should.equal(2);

            component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText', icon: '#icon', keep: true});
            component['messages'][1].should.deep.equal({title: 'myTitle', text: 'myText', icon: '#icon'});

            tick(messageTimeout);

            component['messages'].length.should.equal(1);

            component['messages'][0].should.deep.equal({title: 'myTitle1', text: 'myText', icon: '#icon', keep: true});
        })));

        it('should handle already closed messages', fakeAsync(inject([AlertService], (service: AlertService) => {

            try {
                component.ngOnInit();

                service.successStatus$.next({title: 'myTitle', text: 'myText', icon: '#icon'});

                tick();

                component['messages'].length.should.equal(1);

                component['messages'][0].should.deep.equal({title: 'myTitle', text: 'myText', icon: '#icon'});

                component['messages'].shift();

                tick(messageTimeout);

                component['messages'].length.should.equal(0);
            } catch (error) {
                throw new Error('should not get here ' + error.message);
            }
        })));
    });

    describe('close', () => {
        it('should remove the alert at the index', () => {
            component['messages'] = [{title: 'bob'}, {title: 'fred'}];

            component.close(0);

            component['messages'].length.should.equal(1);
            component['messages'][0].should.deep.equal({title: 'fred'});
        });
    });

    describe('#onLink', () => {
        it('should call callback', () => {
            let cb = sinon.stub();
            component.onLink(cb);
            cb.should.have.been.called;
        });

        it('should not call callback', () => {
            let cb = sinon.stub();
            component.onLink(false);
            cb.should.not.have.been.called;
        });
    });
});

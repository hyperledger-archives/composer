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
import { ComponentFixture, TestBed, async, fakeAsync, tick, inject } from '@angular/core/testing';
import { Component, Renderer, } from '@angular/core';
import { By } from '@angular/platform-browser';

import * as sinon from 'sinon';
import * as chai from 'chai';
import { FileDragDropDirective } from './file-drag-and-drop.directive';

let should = chai.should();

@Component({
    selector: 'test',
    template: `
        <div fileDragDrop [supportedFileTypes]="fileTypes"
             [maxFileSize]="maxFileSize" (fileDragDropFileAccepted)="fileAccepted($event)"
             (fileDragDropFileRejected)="fileRejected($event)"
             (fileDragDropDragLeave)="fileLeft($event)" (fileDragDropDragOver)="fileOver($event)">
        </div>`
})

class TestComponent {

    fileTypes: string[] = ['.bna'];
    maxFileSize: number = 3;

    accepted;
    rejected;
    left;
    over;

    fileAccepted(accepted) {
        this.accepted = accepted;
    }

    fileRejected(rejected) {
        this.rejected = rejected;
    }

    fileLeft(left) {
        this.left = left;
    }

    fileOver(over) {
        this.over = over;
    }
}

describe('FileDragDropDirective', () => {

    let component: TestComponent;
    let fixture: ComponentFixture<TestComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TestComponent, FileDragDropDirective]
        })

            .compileComponents();

        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create the directive', async(() => {
        component.should.be.ok;
    }));

    describe('onDragOver', () => {
        it('should emit event when dragged over', async(() => {
            component = fixture.componentInstance;
            let divEl = fixture.debugElement.query(By.css('div'));

            let event = {
                preventDefault: sinon.stub(),
                stopPropagation: sinon.stub()
            };

            divEl.triggerEventHandler('dragenter', event);

            fixture.detectChanges();

            component.over.should.equal('entered');
            event.preventDefault.should.have.been.called;
            event.stopPropagation.should.have.been.called;
        }));
    });

    describe('onDragLeave', () => {
        it('should emit event when dragged left', async(() => {
            component = fixture.componentInstance;
            let divEl = fixture.debugElement.query(By.css('div'));

            let event = {
                preventDefault: sinon.stub(),
                stopPropagation: sinon.stub()
            };

            divEl.triggerEventHandler('dragexit', event);

            fixture.detectChanges();

            component.left.should.equal('exited');
            event.preventDefault.should.have.been.called;
            event.stopPropagation.should.have.been.called;
        }));
    });

    describe('onDrop', () => {
        it('should emit accept event on drop', async(() => {
            component = fixture.componentInstance;
            let divEl = fixture.debugElement.query(By.css('div'));

            let event = {
                dataTransfer: {
                    files: [{name: 'bob.bna', size: 2}]
                },
                preventDefault: sinon.stub(),
                stopPropagation: sinon.stub()
            };

            divEl.triggerEventHandler('drop', event);

            fixture.detectChanges();

            component.accepted.should.deep.equal({name: 'bob.bna', size: 2});
            event.preventDefault.should.have.been.called;
            event.stopPropagation.should.have.been.called;
        }));

        it('should emit accept event on drop with different structure', async(() => {
            component = fixture.componentInstance;
            let divEl = fixture.debugElement.query(By.css('div'));

            let event = {
                originalEvent: {
                    dataTransfer: {
                        files: [{name: 'bob.bna', size: 2}]
                    },
                },
                preventDefault: sinon.stub(),
                stopPropagation: sinon.stub()

            };

            divEl.triggerEventHandler('drop', event);

            fixture.detectChanges();

            component.accepted.should.deep.equal({name: 'bob.bna', size: 2});
            event.preventDefault.should.have.been.called;
            event.stopPropagation.should.have.been.called;
        }));

        it('should emit reject event on drop with wrong file type', async(() => {
            component = fixture.componentInstance;
            let divEl = fixture.debugElement.query(By.css('div'));

            let event = {
                originalEvent: {
                    dataTransfer: {
                        files: [{name: 'bob.zip', size: 2}]
                    },
                },
                preventDefault: sinon.stub(),
                stopPropagation: sinon.stub()

            };

            divEl.triggerEventHandler('drop', event);

            fixture.detectChanges();

            component.rejected.should.equal('file bob.zip has an unsupported file type');
            event.preventDefault.should.have.been.called;
            event.stopPropagation.should.have.been.called;
        }));

        it('should emit reject event on drop with file too big', async(() => {
            component = fixture.componentInstance;
            let divEl = fixture.debugElement.query(By.css('div'));

            let event = {
                originalEvent: {
                    dataTransfer: {
                        files: [{name: 'bob.bna', size: 5}]
                    },
                },
                preventDefault: sinon.stub(),
                stopPropagation: sinon.stub()

            };

            divEl.triggerEventHandler('drop', event);

            fixture.detectChanges();

            component.rejected.should.equal('file bob.bna was too large');
            event.preventDefault.should.have.been.called;
            event.stopPropagation.should.have.been.called;
        }));
    });
});

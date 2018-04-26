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
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, Component } from '@angular/core';
import { DeleteComponent } from './delete-confirm.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { EditorFile } from '../../services/editor-file';

import * as sinon from 'sinon';

@Component({
    template: `
        <delete-confirm [deleteFile]="deleteFile" [fileType]="fileType" [fileName]="fileName" [action]="action"
                 [headerMessage]="headerMessage" [deleteMessage]="deleteMessage"
                 [confirmButtonText]="confirmButtonText" [deleteFrom]="deleteFrom"></delete-confirm>`
})
class TestHostComponent {
    deleteFile: any;
    fileType: string = null;
    fileName: string = null;
    action: string = null;
    headerMessage: string = null;
    deleteMessage: string = null;
    confirmButtonText: string = null;
}

describe('DeleteComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    let deleteElement: DebugElement;
    let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DeleteComponent, TestHostComponent],
            providers: [{provide: NgbActiveModal, useValue: mockActiveModal}]
        });
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;

        deleteElement = fixture.debugElement.query(By.css('delete-confirm'));
    });

    it('should create', () => {
        component.should.be.ok;
    });

    describe('ngOnInit', () => {
        let headerMessageElement: DebugElement;
        let informationElement: DebugElement;
        let deleteMessageElement: DebugElement;
        let okButtonElement: DebugElement;

        beforeEach(() => {
            headerMessageElement = deleteElement.query(By.css('h1'));
            informationElement = deleteElement.queryAll(By.css('p'))[0];
            deleteMessageElement = deleteElement.queryAll(By.css('p'))[1];
            okButtonElement = deleteElement.query(By.css('button.delete'));
        });

        it('should initialise model file parameters', () => {
            let editorFile: EditorFile = new EditorFile('myID', 'test_name', 'myContent', 'model');

            component['deleteFile'] = editorFile;
            component['headerMessage'] = 'myHeaderMessage';
            component['deleteMessage'] = 'myDeleteMessage';

            fixture.detectChanges();

            headerMessageElement.nativeElement.textContent.should.equal('myHeaderMessage');
            informationElement.nativeElement.textContent.should.equal('You are about to remove the Model File test_name.');
            deleteMessageElement.nativeElement.textContent.should.equal('myDeleteMessage');
            okButtonElement.nativeElement.textContent.should.equal('Delete File');
        });

        it('should initialise script file parameters', () => {
            let editorFile: EditorFile = new EditorFile('myID', 'test_name', 'myContent', 'script');

            component['deleteFile'] = editorFile;
            component['headerMessage'] = 'myHeaderMessage';
            component['deleteMessage'] = 'myDeleteMessage';

            fixture.detectChanges();

            headerMessageElement.nativeElement.textContent.should.equal('myHeaderMessage');
            informationElement.nativeElement.textContent.should.equal('You are about to remove the Script File test_name.');
            deleteMessageElement.nativeElement.textContent.should.equal('myDeleteMessage');
            okButtonElement.nativeElement.textContent.should.equal('Delete File');
        });

        it('should initialise unknown file parameters', () => {
            let editorFile: EditorFile = new EditorFile('myID', 'test_name', 'myContent', 'random');

            component['deleteFile'] = editorFile;
            component['headerMessage'] = 'myHeaderMessage';
            component['deleteMessage'] = 'myDeleteMessage';

            fixture.detectChanges();

            headerMessageElement.nativeElement.textContent.should.equal('myHeaderMessage');
            informationElement.nativeElement.textContent.should.equal('You are about to remove the File test_name.');
            deleteMessageElement.nativeElement.textContent.should.equal('myDeleteMessage');
            okButtonElement.nativeElement.textContent.should.equal('Delete File');
        });

        it('should not initialise file name if provided', () => {
            component['headerMessage'] = 'myHeaderMessage';
            component['deleteMessage'] = 'myDeleteMessage';
            component['fileName'] = 'myFileName';
            component['fileType'] = 'myFileType';

            fixture.detectChanges();

            headerMessageElement.nativeElement.textContent.should.equal('myHeaderMessage');
            informationElement.nativeElement.textContent.should.equal('You are about to remove the myFileType myFileName.');
            deleteMessageElement.nativeElement.textContent.should.equal('myDeleteMessage');
            okButtonElement.nativeElement.textContent.should.equal('Delete File');
        });

        it('should set confirmButtonText, action and delete from', () => {
            component['headerMessage'] = 'myHeaderMessage';
            component['deleteMessage'] = 'myDeleteMessage';
            component['fileName'] = 'myFileName';
            component['fileType'] = 'myFileType';
            component['action'] = 'myAction';
            component['deleteFrom'] = 'myDeleteFrom';
            component['confirmButtonText'] = 'myButtonText';

            fixture.detectChanges();

            headerMessageElement.nativeElement.textContent.should.equal('myHeaderMessage');
            informationElement.nativeElement.textContent.should.equal('You are about to myAction the myFileType myFileName from myDeleteFrom.');
            deleteMessageElement.nativeElement.textContent.should.equal('myDeleteMessage');
            okButtonElement.nativeElement.textContent.should.equal('myButtonText');
        });

        it('should throw error if file name or delete file not set', fakeAsync(() => {
            try {
                fixture.detectChanges();
            } catch (error) {
                error.message.should.equal('either fileName or deleteFile should be specified');
            }
        }));

        it('should throw error if file name and delete file set', fakeAsync(() => {
            let editorFile: EditorFile = new EditorFile('myID', 'test_name', 'myContent', 'random');
            component['fileName'] = 'myFileName';
            component['deleteFile'] = editorFile;

            try {
                fixture.detectChanges();
            } catch (error) {
                error.message.should.equal('only one of fileName or deleteFile should be specified');
            }
        }));
    });

    describe('modalClose', () => {
        it('should dismiss the modal via cross', () => {
            let crossButton: DebugElement = deleteElement.query(By.css('.modal-exit'));

            crossButton.triggerEventHandler('click', null);
            mockActiveModal.dismiss.should.have.been.called;
        });

        it('should dismiss the modal via cancel', () => {
            let cancelButton: DebugElement = deleteElement.query(By.css('.secondary'));

            cancelButton.triggerEventHandler('click', null);
            mockActiveModal.dismiss.should.have.been.called;
        });

        it('should close the modal via ok', () => {
            let okButton: DebugElement = deleteElement.query(By.css('button.delete'));

            okButton.triggerEventHandler('click', null);
            mockActiveModal.close.should.have.been.calledWith(true);
        });
    });
});

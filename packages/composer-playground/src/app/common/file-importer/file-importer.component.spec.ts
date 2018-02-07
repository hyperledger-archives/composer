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
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import * as sinon from 'sinon';

import { FileImporterComponent } from './file-importer.component';

describe('FileImporterComponent', () => {
    let component: FileImporterComponent;
    let fixture: ComponentFixture<FileImporterComponent>;
    let fileImporterElement: DebugElement;

    let spyFileAccepted;
    let spyFileRejected;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [FileImporterComponent],
            providers: []
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(FileImporterComponent);
        component = fixture.componentInstance;
        fileImporterElement = fixture.debugElement;

        fixture.detectChanges();

        spyFileAccepted = sinon.spy(component.fileAccepted, 'emit');
        spyFileRejected = sinon.spy(component.fileRejected, 'emit');
    });

    it('should create component', () => {
        component.should.be.ok;
    });

    describe('onFileChanged', () => {
        it('should call file accepted when valid file', () => {
            let contents = new Blob(['/**BNA File*/'], {type: 'text/plain'});
            let file = new File([contents], 'SomeFile.bna');

            let event = {
                target: {
                    files: [file]
                }
            };

            fixture.detectChanges();

            let inputElement = fileImporterElement.query(By.css('input'));
            inputElement.triggerEventHandler('change', event);

            spyFileAccepted.should.have.been.called;
        });

        it('should call file rejected when file too big', () => {
            component.maxFileSize = 1;
            component.supportedFileTypes = ['.bna'];
            let contents = new Blob(['/**BNA File*/'], {type: 'text/plain'});
            let file = new File([contents], 'SomeFile.bna');

            let event = {
                target: {
                    files: [file]
                }
            };

            fixture.detectChanges();

            let inputElement = fileImporterElement.query(By.css('input'));
            inputElement.triggerEventHandler('change', event);

            spyFileRejected.should.have.been.calledWith('file SomeFile.bna was too large');
        });

        it('should call file rejected when file not of right type', () => {
            component.maxFileSize = 500000000;
            component.supportedFileTypes = ['.bna'];
            let contents = new Blob(['/**BNA File*/'], {type: 'text/plain'});
            let file = new File([contents], 'SomeFile.zip');

            let event = {
                target: {
                    files: [file]
                }
            };

            fixture.detectChanges();

            let inputElement = fileImporterElement.query(By.css('input'));
            inputElement.triggerEventHandler('change', event);

            spyFileRejected.should.have.been.calledWith('file SomeFile.zip has an unsupported file type');
        });
    });
});

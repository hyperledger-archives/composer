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
        fixture.detectChanges();
    });

    it('should create component', () => {
        component.should.be.ok;
    });

    it('should acknowledge a file change', () => {

        // let onFileChangeSpy = spyOn(component, 'onFileChange');
        let contents = new Blob(['/**BNA File*/'], {type: 'text/plain'});
        let file = new File([contents], 'SomeFile.bna');

        let event = {
            target: {
                files: [file]
            }
        };

        component.onFileChange(event);

        // onFileChangeSpy.should.be.calledOn;
        component.dragFileAccepted.should.be.calledOn;
    });

});

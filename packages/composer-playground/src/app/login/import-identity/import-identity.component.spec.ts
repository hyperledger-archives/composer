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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, Directive, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ImportIdentityComponent } from './import-identity.component';
import { IdentityCardService } from '../../services/identity-card.service';

import { ActiveDrawer, DrawerService } from '../../common/drawer';
import { Logger, IdCard } from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

@Directive({
    selector: '[fileDragDrop]'
})
class MockDragDropDirective {
    @Output()
    public fileDragDropFileAccepted: EventEmitter<File> = new EventEmitter<File>();
    @Output()
    public fileDragDropFileRejected: EventEmitter<string> = new EventEmitter<string>();
    @Output()
    public fileDragDropDragOver: EventEmitter<string> = new EventEmitter<string>();
    @Output()
    public fileDragDropDragLeave: EventEmitter<string> = new EventEmitter<string>();

    @Input()
    public supportedFileTypes: string[] = [];
    @Input()
    maxFileSize: number = 0;
}

@Directive({
    selector: 'file-importer'
})
class MockFileImporterDirective {
    @Output()
    public fileAccepted: EventEmitter<File> = new EventEmitter<File>();

    @Output()
    public fileRejected: EventEmitter<File> = new EventEmitter<File>();

    @Input()
    public expandInput: boolean = false;

    @Input()
    public svgName: string = '#icon-BNA_Upload';

    @Input()
    public maxFileSize: number = 0;

    @Input()
    public supportedFileTypes: string[] = [];
}

@Component({
    selector: 'identity-card',
    template: ''
})
class MockIdentityCardComponent {
    @Input() identity: any;
    @Input() preview: boolean;
    @Input() showDismissIcon: boolean;
}

describe('ImportIdentityComponent', () => {
    let component: ImportIdentityComponent;
    let fixture: ComponentFixture<ImportIdentityComponent>;

    let mockDragDropComponent;
    let mockActiveDrawer;
    let mockDrawerService;
    let mockIdentityCardService;

    beforeEach(() => {
        mockActiveDrawer = sinon.createStubInstance(ActiveDrawer);
        mockDrawerService = sinon.createStubInstance(DrawerService);
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [
                ImportIdentityComponent,
                MockIdentityCardComponent,
                MockDragDropDirective,
                MockFileImporterDirective
            ],
            providers: [
                {provide: ActiveDrawer, useValue: mockActiveDrawer},
                {provide: DrawerService, useValue: mockDrawerService},
                {provide: IdentityCardService, useValue: mockIdentityCardService}]
        });

        mockDrawerService.open.returns({componentInstance: {}});

        fixture = TestBed.createComponent(ImportIdentityComponent);
        component = fixture.componentInstance;

        let mockDragDropElement = fixture.debugElement.query(By.directive(MockDragDropDirective));
        mockDragDropComponent = mockDragDropElement.injector.get(MockDragDropDirective) as MockDragDropDirective;
    });

    it('should create', () => {
        component.should.be.ok;
    });

    describe('fileDetected', () => {
        it('should set expand input to true', () => {
            component['expandInput'].should.equal(false);
            mockDragDropComponent.fileDragDropDragOver.emit();

            component['expandInput'].should.equal(true);
        });
    });

    describe('fileLeft', () => {
        it('should set expand input to false', () => {
            component['expandInput'] = true;
            mockDragDropComponent.fileDragDropDragLeave.emit();

            component['expandInput'].should.equal(false);
        });
    });

    describe('fileAccepted', () => {
        let sandbox;
        let mockFile;
        let mockIdCard;
        let mockFileReader;
        let fileReaderStub;
        let idCardFromArchiveStub;
        let bufferFromStub;

        beforeEach(() => {
            // webpack can't handle dymanically creating a logger
            Logger.setFunctionalLogger({
                log: sinon.stub()
            });

            sandbox = sinon.sandbox.create();
            mockFile = 'card file';
            mockIdCard = sinon.createStubInstance(IdCard);
            idCardFromArchiveStub = sandbox.stub(IdCard, 'fromArchive');
            bufferFromStub = sandbox.stub(Buffer.prototype, 'from');
            fileReaderStub = sandbox.stub(window, 'FileReader');

            mockFileReader = {
                onload: sinon.stub(),
                readAsArrayBuffer: sinon.stub(),
                result: 'idcard file'
            };

            bufferFromStub.returns('id card data');
            fileReaderStub.returns(mockFileReader);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should read an identity card file', fakeAsync(() => {
            idCardFromArchiveStub.returns(Promise.resolve(mockIdCard));
            mockDragDropComponent.fileDragDropFileAccepted.emit(mockFile);

            mockFileReader.readAsArrayBuffer.should.have.been.calledWith(mockFile);

            mockFileReader.onload();

            tick();

            component['identityCard'].should.equal(mockIdCard);
            component['expandInput'].should.equal(true);
        }));

        it('should handle error', fakeAsync(() => {
            idCardFromArchiveStub.returns(Promise.reject('some error'));
            mockDragDropComponent.fileDragDropFileAccepted.emit(mockFile);

            mockFileReader.readAsArrayBuffer.should.have.been.calledWith(mockFile);

            mockFileReader.onload();

            tick();

            mockActiveDrawer.dismiss.should.have.been.calledWith('Could not read business network card');
            component['expandInput'].should.equal(false);
        }));
    });

    describe('file rejected', () => {
        it('should reject the file', () => {
            mockDragDropComponent.fileDragDropFileRejected.emit('some error');

            mockActiveDrawer.dismiss.should.have.been.calledWith('some error');
            component['expandInput'].should.equal(false);
            should.not.exist(component['identityCard']);
        });
    });

    describe('remove file', () => {
        it('should remove the file', () => {
            component.removeFile();

            component['expandInput'].should.equal(false);
            should.not.exist(component['identityCard']);
        });
    });

    describe('import', () => {
        it('should close the drawer with imported identity card', fakeAsync(() => {
            mockIdentityCardService.addIdentityCard.returns(Promise.resolve('myCardRef'));

            let mockIdCard = sinon.createStubInstance(IdCard);
            component['identityCard'] = mockIdCard;
            component['cardName'] = 'myCardName';

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.primary'));
            button.nativeElement.click();

            tick();

            mockIdentityCardService.addIdentityCard.should.have.been.calledWith(mockIdCard, 'myCardName');
            mockActiveDrawer.close.should.have.been.calledWith('myCardRef');
        }));

        it('should handle error with card name', fakeAsync(() => {
            mockIdentityCardService.addIdentityCard.returns(Promise.reject({message: 'Card already exists: bob'}));

            let mockIdCard = sinon.createStubInstance(IdCard);
            component['identityCard'] = mockIdCard;
            component['cardName'] = 'myCardName';

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.primary'));
            button.nativeElement.click();

            tick();

            mockIdentityCardService.addIdentityCard.should.have.been.calledWith(mockIdCard, 'myCardName');
            mockActiveDrawer.dismiss.should.not.have.been.called;
            component['cardNameValid'].should.equal(false);
        }));

        it('should handle error', fakeAsync(() => {
            mockIdentityCardService.addIdentityCard.returns(Promise.reject({message: 'some error'}));

            let mockIdCard = sinon.createStubInstance(IdCard);
            component['identityCard'] = mockIdCard;
            component['cardName'] = 'myCardName';

            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.primary'));
            button.nativeElement.click();

            tick();

            mockIdentityCardService.addIdentityCard.should.have.been.calledWith(mockIdCard, 'myCardName');
            mockActiveDrawer.dismiss.should.have.been.calledWith({message: 'some error'});
        }));

        it('should not be possible to import without identity card', () => {
            fixture.detectChanges();
            let button = fixture.debugElement.query(By.css('button.primary'));
            button.nativeElement.disabled.should.be.true;
        });
    });

    describe('setCardName', () => {
        it('should set the card name and cardNameValid to true', () => {
            component['setCardName']('myCardName');

            component['cardName'].should.equal('myCardName');
            component['cardNameValid'].should.equal(true);
        });

        it('should not set the card name if it hasn\'t changed and not update cardNameValid', () => {
            component['cardNameValid'] = false;
            component['cardName'] = 'myCardName';
            component['setCardName']('myCardName');

            component['cardName'].should.equal('myCardName');
            component['cardNameValid'].should.equal(false);
        });
    });
});

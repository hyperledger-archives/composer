/* tslint:disable:no-unused-variable */
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';
import * as sinon from 'sinon';

import {FileImporterComponent} from './file-importer.component';

describe('FileImporterComponent', () => {
  let component: FileImporterComponent;
  let fixture: ComponentFixture<FileImporterComponent>;


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileImporterComponent ],
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

    let onFileChangeSpy = spyOn(component, 'onFileChange');

    component.onFileChange('');

    onFileChangeSpy.should.be.calledOn;
  });

});

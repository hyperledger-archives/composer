/* tslint:disable:no-unused-variable */
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';

import {VersionCheckComponent} from './version-check.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap'
import { LocalStorageService } from 'angular-2-local-storage';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';

describe('VersionCheckComponent', () => {
  let component: VersionCheckComponent;
  let fixture: ComponentFixture<VersionCheckComponent>;

  let ngbActiveModalMock = {
    close: () => {
    },
    dismiss: () => {
    }
  };



  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VersionCheckComponent],
      providers: [{provide: NgbActiveModal, useValue: ngbActiveModalMock},{provide: LocalStorageService},{provide: Router}]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VersionCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

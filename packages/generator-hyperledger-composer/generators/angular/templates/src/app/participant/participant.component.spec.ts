import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Configuration } from '../configuration';
import { DataService } from '../data.service';
import { <%= participantName %>Component } from './<%= participantName %>.component';
import {<%= participantName %>Service} from './<%= participantName %>.service';
describe('<%= participantName %>Component', () => {
  let component: <%= participantName %>Component;
  let fixture: ComponentFixture<<%= participantName %>Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ <%= participantName %>Component ],
imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule
  ],
providers: [<%= participantName %>Service,DataService,Configuration]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(<%= participantName %>Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

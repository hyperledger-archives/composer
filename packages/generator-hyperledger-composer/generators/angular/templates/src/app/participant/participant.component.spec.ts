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

import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import * as sinon from 'sinon';
import { DataService } from '../data.service';
import { <%= currentParticipant.name %>Component } from './<%= currentParticipant.name %>.component';
import { <%= currentParticipant.name %>Service } from './<%= currentParticipant.name %>.service';
import { Observable } from 'rxjs';

describe('<%= currentParticipant.name %>Component', () => {
  let component: <%= currentParticipant.name %>Component;
  let fixture: ComponentFixture<<%= currentParticipant.name %>Component>;

  let mock<%= currentParticipant.name %>Service;
  let mockDataService

  beforeEach(async(() => {

    mock<%= currentParticipant.name %>Service = sinon.createStubInstance(<%= currentParticipant.name %>Service);
    mock<%= currentParticipant.name %>Service.getAll.returns([]);
    mockDataService = sinon.createStubInstance(DataService);

    TestBed.configureTestingModule({
      declarations: [ <%= currentParticipant.name %>Component ],
      imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        HttpModule
      ],
      providers: [
        {provide: <%= currentParticipant.name %>Service, useValue: mock<%= currentParticipant.name %>Service },
        {provide: DataService, useValue: mockDataService },
      ]
    });

    fixture = TestBed.createComponent(<%= currentParticipant.name %>Component);
    component = fixture.componentInstance;

  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the table when a <%= currentParticipant.name %> is added', fakeAsync(() => {
    let loadAllSpy = sinon.stub(component, 'loadAll');
    sinon.stub(component.service<%= currentParticipant.name %>, 'addParticipant').returns(new Observable(observer => {
      observer.next('');
      observer.complete();
    }));

    component.addParticipant({});

    tick();

    expect(loadAllSpy.callCount).toBe(1);

    loadAllSpy.restore();
  }));

  it('should update the table when a <%= currentParticipant.name %> is updated', fakeAsync(() => {
    let loadAllSpy = sinon.stub(component, 'loadAll');
    sinon.stub(component.service<%= currentParticipant.name %>, 'updateParticipant').returns(new Observable(observer => {
      observer.next('');
      observer.complete();
    }));

    // mock form to be passed to the update function
    let mockForm = new FormGroup({
      <%= currentParticipant.identifier %>: new FormControl('id')
    });
    
    component.updateParticipant(mockForm);

    tick();

    expect(loadAllSpy.callCount).toBe(1);

    loadAllSpy.restore();
  }));
  
  it('should update the table when a <%= currentParticipant.name %> is deleted', fakeAsync(() => {
    let loadAllSpy = sinon.stub(component, 'loadAll');
    sinon.stub(component.service<%= currentParticipant.name %>, 'deleteParticipant').returns(new Observable(observer => {
      observer.next('');
      observer.complete();
    }));

    component.deleteParticipant();

    tick();

    expect(loadAllSpy.callCount).toBe(1);

    loadAllSpy.restore();
  }));

});

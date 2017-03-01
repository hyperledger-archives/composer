/* tslint:disable:no-unused-variable */
import {ComponentFixture, TestBed} from '@angular/core/testing';
//import {By}              from '@angular/platform-browser';
//import {DebugElement}    from '@angular/core';

import * as sinon from 'sinon';

import {RegistryComponent} from './registry.component';
//import {ClientService} from '../client.service';

describe('RegistryComponent', () => {
  let component: RegistryComponent;
  let fixture: ComponentFixture<RegistryComponent>;

  /** beforeEach(async(() => {
     TestBed.configureTestingModule({
       declarations: [ RegistryComponent ]
     })
     .compileComponents();
   }));

   beforeEach(() => {
     fixture = TestBed.createComponent(RegistryComponent);
     component = fixture.componentInstance;
     fixture.detectChanges();
   });**/

  class MockClientService {

    getBusinessNetwork = sinon.stub().returns({
      getSerialiser: sinon.stub().returns({
        toJson: sinon.stub().returns('a string')
      })
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegistryComponent], // declare the test component
      providers: [
     //   { provide: ClientService, useValue: MockClientService },
      ]
    })

   /**   .overrideComponent(RegistryComponent, {
        set: {
          providers: [
            {provide: ClientService, useClass: MockClientService}
          ]
        }
      })**/

      .compileComponents();


    fixture = TestBed.createComponent(RegistryComponent);

    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

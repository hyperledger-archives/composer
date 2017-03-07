import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  inject,
  async,
  TestBed,
  ComponentFixture
} from '@angular/core/testing';
import {Component} from '@angular/core';

// Load the implementations that should be tested
import {RegistryComponent} from './registry.component';
import {ClientService} from '../services/client.service';

describe(`Registry`, () => {
 /** let comp: RegistryComponent;
  let fixture: ComponentFixture<RegistryComponent>;

  let mockClientService;
  let clientServiceStub;

  // async beforeEach
  beforeEach(() => {
    mockClientService = {
      getCaz: () => {
        return 'BOB'
      }
      // getBusinessNetwork : () => {
      //   return {};
      // }
      //  user: { name: 'Test User'}
    };

    //clientServiceStub = sinon.createStubInstance(ClientService);
    //console.log(clientServiceStub);
    // stub UserService for test purposes
    /** let mockServiceStub = {
      isLoggedIn: true,
      user: { name: 'Test User'}
    };**/

  /**  TestBed.configureTestingModule({
      declarations: [RegistryComponent],
     providers: [{provide: ClientService, useValue: mockClientService}]
    });

    fixture = TestBed.createComponent(RegistryComponent);
    comp = fixture.componentInstance;

  });

  it('should have default data', () => {
   // let result = comp.loadResources();
    console.log('CAZ BANANA CAKE');
    //expect(result).toBe('BOB');
   // result.should.equal('BOB');
  });**/
});

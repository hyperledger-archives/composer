/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import {FormsModule, ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators, FormBuilder} from '@angular/forms';
import { ConnectionProfileDataComponent } from './connection-profile-data.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConnectionProfileService} from '../services/connectionprofile.service';
import * as sinon from 'sinon';

describe('ConnectionProfileDataComponent', () => {
  let component: ConnectionProfileDataComponent;
  let fixture: ComponentFixture<ConnectionProfileDataComponent>;

  let mockCert;
  let mockHostname;
  let currentConnectionProfile;

  let mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
  let mockNgbModal = sinon.createStubInstance(NgbModal);


  beforeEach(() => {
      TestBed.configureTestingModule({
          declarations: [ ConnectionProfileDataComponent ],
          providers: [{provide: NgbModal, useValue: mockNgbModal},
                      {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                      FormBuilder],
          imports: [ReactiveFormsModule]
      });
      fixture = TestBed.createComponent(ConnectionProfileDataComponent);
      component = fixture.componentInstance;
  });

  it('should create ConnectionProfileDataComponent', () => {
    component.should.be.ok;
  });

  it('should close all expanded sections for a v0.6 profile', () => {
    let sectionToExpand = "All";
    component['connectionProfileData'] = {'profile':{'type':'hlf'}};
    component['expandedSection'] = ['Basic Configuration', 'Security Settings', 'Advanced'];
    component.expandSection(sectionToExpand);

    component['expandedSection'].length.should.equal(0);
  });

  it('should open all collapsed sections for a v0.6 profile', () => {
    let sectionToExpand = "All";
    component['connectionProfileData'] = {'profile':{'type':'hlf'}};
    component['expandedSection'] = [];
    component.expandSection(sectionToExpand);

    component['expandedSection'].length.should.equal(3);
  });
  it('should close a single section for a v0.6 profile', () => {
    let sectionToExpand = "Basic Configuration";
    component['connectionProfileData'] = {'profile':{'type':'hlf'}};
    component['expandedSection'] = ['Basic Configuration','Advanced'];
    component.expandSection(sectionToExpand);

    component['expandedSection'].should.deep.equal(['Advanced']);
  });
  it('should open a single section for a v0.6 profile', () => {
    let sectionToExpand = "Basic Configuration";
    component['connectionProfileData'] = {'profile':{'type':'hlf'}};
    component['expandedSection'] = ['Advanced'];
    component.expandSection(sectionToExpand);

    component['expandedSection'].should.deep.equal(['Advanced','Basic Configuration']);
  });






  it('should close all expanded sections for a v1 profile', () => {
    let sectionToExpand = "All";
    component['connectionProfileData'] = {'profile':{'type':'hlfv1'}};
    component['expandedSection'] = ['Basic Configuration', 'Advanced'];
    component.expandSection(sectionToExpand);

    component['expandedSection'].length.should.equal(0);
  });

  it('should open all collapsed sections for a v1 profile', () => {
    let sectionToExpand = "All";
    component['connectionProfileData'] = {'profile':{'type':'hlfv1'}};
    component['expandedSection'] = [];
    component.expandSection(sectionToExpand);

    component['expandedSection'].length.should.equal(2);
  });
  it('should close a single section for a v1 profile', () => {
    let sectionToExpand = "Basic Configuration";
    component['connectionProfileData'] = {'profile':{'type':'hlfv1'}};
    component['expandedSection'] = ['Basic Configuration','Advanced'];
    component.expandSection(sectionToExpand);

    component['expandedSection'].should.deep.equal(['Advanced']);
  });
  it('should open a single section for a v1 profile', () => {
    let sectionToExpand = "Basic Configuration";
    component['connectionProfileData'] = {'profile':{'type':'hlfv1'}};
    component['expandedSection'] = ['Advanced'];
    component.expandSection(sectionToExpand);

    component['expandedSection'].should.deep.equal(['Advanced','Basic Configuration']);
  });

  // it('should use a new profile', () => {
  //   component['connectionProfileData'] = {'name':'testprofile'};
  //   component.useProfile();

  //   this.currentConnectionProfile.should.equal('testprofile');
  // });



  describe('startEditing', () => {

    it('should be able to edit a v0.6 form', () => {
      component['connectionProfileData'] = {'profile':{'type':'hlf'}};
      let mockOnValueChanged = sinon.stub(component,'onValueChanged');

      component.startEditing();
      mockOnValueChanged.should.have.been.called;

    })

  })

  describe('initOrderers', () => {
    it('should initialize orderers', () => {
      component['connectionProfileData'] = {
      'profile':
        {'orderers':[
          {'url':'ordererURL_1','cert':'ordererCert_1','hostnameOverride':'ordererHostname_1'},
          {'url':'ordererURL_2','cert':'ordererCert_2','hostnameOverride':'ordererHostname_2'}]
        }
      };

      let groupSpy = sinon.spy(component['fb'], 'group');

      let result = component.initOrderers();
      result.length.should.equal(2);
      groupSpy.firstCall.should.have.been.calledWith(
        {
          'url': ['ordererURL_1', Validators.required],
          'cert': ['ordererCert_1'],
          'hostnameOverride': ['ordererHostname_1'],
        }
      )
      // result[0].should.equal
    })
  })


  describe('initOrderers', () => {
    it('should remove an orderer', () => {

      component['v1Form'] = component['fb'].group({'orderers' :
        component['fb'].array([component['fb'].group(
            {'url':'ordererURL_2','cert':'ordererCert_2','hostnameOverride':'ordererHostname_2'}
            )])

    })

    component.removeOrderer(0);
     (<FormArray>component['v1Form'].controls['orderers']).length.should.equal(0);
    })
  })




  // it('should init orderers if theres data', () => {
  //   component['connectionProfileData'] = {
  //     'profile':
  //       {'orderers':[
  //         {'url':['ordererURL_1'],'cert':['ordererCert_1'],'hostnameOverride':['ordererHostname_1']},
  //         {'url':['ordererURL_2'],'cert':['ordererCert_2'],'hostnameOverride':['ordererHostname_2']}]
  //       }
  //     };

  //   component.initOrderers().length.should.equal(2);
  //   component.initOrderers().should.be.an('array')


  // })

  // it('should init orderers if theres no data', () => {
  //   component['connectionProfileData'] = null;
  //   component.initOrderers().length.should.equal(1);
  //   component.initOrderers().should.be.an('array')
  //   let expectedResult = [];
  //   expectedResult.push(mockFormBuilder.group({'url':['grpcs://localhost:7050', Validators.required],'cert':[''],'hostnameOverride':['']}));

  //   component.initOrderers()[0].valueChanges.subscribe.should.deep.equal(expectedResult[0].valueChanges.subscribe);

  // })

  // it('should be able to add a new orderer', () => {
  //   component['connectionProfileData'] = {'profile':{'type':'hlfv1'}};

  //   component['v1Form'] = mockFormBuilder.group({
  //     'name':'v1Profile',
  //     'description':'A description',
  //     'type':'hlfv1',
  //     'orderers':mockFormBuilder.array({'url':['ordererURL_1'],'cert':['ordererCert_1'],'hostnameOverride':['ordererHostname_1']}),
  //     'channel':'mychannel',
  //     'mspID':'Org1MSP',
  //     'ca':'ca',
  //     'peers':mockFormBuilder.array({}),
  //     'keyValStore':'/tmp/keyValStore',
  //     'deployWaitTime':300,
  //     'invokeWaitTime':30
  //   });

  //   Object.keys(component['v1Form'].controls['orderers']).length.should.equal(1);
  //   component.addOrderer();
  //   Object.keys(component['v1Form'].controls['orderers']).length.should.equal(2);

  // })

  // it('should be able to remove an orderer', () => {
  //   component['connectionProfileData'] = {'profile':{'type':'hlfv1'}};

  //   component['v1Form'] = mockFormBuilder.group({
  //     'name':'v1Profile',
  //     'description':'A description',
  //     'type':'hlfv1',
  //     'orderers':mockFormBuilder.array({'url':['ordererURL_1'],'cert':['ordererCert_1'],'hostnameOverride':['ordererHostname_1']}),
  //     'channel':'mychannel',
  //     'mspID':'Org1MSP',
  //     'ca':'ca',
  //     'peers':mockFormBuilder.array({}),
  //     'keyValStore':'/tmp/keyValStore',
  //     'deployWaitTime':300,
  //     'invokeWaitTime':30
  //   });

  //   Object.keys(component['v1Form'].controls['orderers']).length.should.equal(1);
  //   component.addOrderer();
  //   Object.keys(component['v1Form'].controls['orderers']).length.should.equal(2);
  //   component.removeOrderer(0);
  //   Object.keys(component['v1Form'].controls['orderers']).length.should.equal(1);

  // })


  // it('should init peers if theres data', () => {
  //   component['connectionProfileData'] = {
  //     'profile':
  //       {'peers':[
  //         {'requestURL':['peerRequestURL_1'],'eventURL':['peerEventURL_1'],'cert':['peerCert_1'],'hostnameOverride':['peerHostname_1']},
  //         {'requestURL':['peerRequestURL_2'],'eventURL':['peerEventURL_2'],'cert':['peerCert_2'],'hostnameOverride':['peerHostname_2']}]
  //       }
  //     };

  //   component.initPeers().length.should.equal(2);
  //   component.initPeers().should.be.an('array')


  // })


  // it('should init peers if theres no data', () => {
  //   component['connectionProfileData'] = null;
  //   component.initPeers().length.should.equal(1);
  //   component.initPeers().should.be.an('array')
  //   let expectedResult = [mockFormBuilder.group({'requestURL':['grpcs://localhost:7051', Validators.required],'eventURL':['grpcs://localhost:7053', Validators.required],'cert':[''],'hostnameOverride':['']})];
  //   component.initPeers().should.deep.equal(expectedResult)

  // })


  // it('should stop editing form', () => {
  //   let profileUpdatedEmit = sinon.spy(component['profileUpdated'], 'emit');
  //   component['editing'] = true;
  //   component.stopEditing();
  //   component['editing'].should.equal(false);
  //   profileUpdatedEmit.should.have.been.calledWith(false);

  // })

  // it('should be able to export a profile', () => {
  //   // let saveAsSpy = sinon.spy(component,'saveAs'); can't seem to spy on this (???)
  //   component['connectionProfileData'] = {'profile':{'type':'hlfv1'}};
  //   component.exportProfile();

  //   // saveAsSpy.should.have.been.called;
  // })

  // it('should show certificate',fakeAsync(() => {
  //   mockNgbModal.open = sinon.stub().returns({
  //       result: Promise.resolve()
  //     });
  //   component.showCertificate('certString','hostnameString');
  //   tick();
  //   console.log('what is mockcert',mockCert)
  //   mockCert.should.equal('certString');
  //   mockHostname.should.equal('hostnameString');

  // }))
});


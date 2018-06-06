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
/* tslint:disable:object-literal-key-quotes */
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ConnectionProfileComponent } from './connection-profile.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { AlertService } from '../basic-modals/alert.service';
import * as sinon from 'sinon';

let util = require('util');

describe('ConnectionProfileComponent', () => {
    let component: ConnectionProfileComponent;
    let fixture: ComponentFixture<ConnectionProfileComponent>;

    let mockConnectionProfileService;
    let mockNgbModal;
    let mockAlertService;

    beforeEach(async(() => {
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockNgbModal = sinon.createStubInstance(NgbModal);
        mockAlertService = sinon.createStubInstance(AlertService);

        mockAlertService.successStatus$ = {
            next: sinon.stub()
        };

        mockAlertService.errorStatus$ = {
            next: sinon.stub()
        };

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [ConnectionProfileComponent],
            providers: [{provide: NgbModal, useValue: mockNgbModal},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: AlertService, useValue: mockAlertService}],
        });
        fixture = TestBed.createComponent(ConnectionProfileComponent);
        component = fixture.componentInstance;
    }));

    it('should create ConnectionProfileComponent', () => {
        component.should.be.ok;
    });

    describe('startEditing', () => {
        it('should be able to create a v1 connection profile', () => {
            component['connectionProfileData'] = {};
            component['connectionProfileData']['x-type'] = 'hlfv1';

            component.startEditing();

            component['basic'].should.deep.equal({
                name: null,
                description: null,
                version: '1.0.0',
                organization: 'Org1',
                mspid: 'Org1MSP',
                channel: 'composerchannel',
                commitTimeout: null
            });

            component['orderers'].should.deep.equal([{
                name: 'orderer.example.com',
                url: 'grpc://localhost:7050',
                grpcOptions: {
                  sslTargetNameOverride: null,
                  grpcMaxSendMessageLength: null,
                  grpcHttp2KeepAliveTime: null
                }
            }]);

            component['ordererTimeout'].should.equal('30');

            component['peers'].should.deep.equal([{
                name: 'peer.example.com',
                url: 'grpc://localhost:7051',
                eventUrl: 'grpc://localhost:7053',
                grpcOptions: {
                    sslTargetNameOverride: null,
                    grpcMaxSendMessageLength: null,
                    grpcHttp2KeepAliveTime: null
                },
                organization: true,
                endorsingPeer: true,
                chaincodeQuery: true,
                ledgerQuery: true,
                eventSource: true
            }]);

            component['peerTimeOut'].should.deep.equal({
                endorser: '30',
                eventHub: '30',
                eventReg: '30'
            });

            component['ca'].should.deep.equal({
                url: 'http://localhost:7054',
                caName: null,
                httpOptions: {
                  verify: false
                }
            });
        });

        it('should set none defaults', () => {
            component['connectionProfileData'] = {
                name: 'myProfile',
                description: 'myDescription',

                version: '2.8',
                client: {
                    organization: 'myOrg',
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5',
                                eventHub: '5',
                                eventReg: '5'
                            },
                            orderer: '5'
                        }
                    }
                },
                channels: {
                    myChannel: {
                        orderers: [
                            'myOrderer'
                        ],
                        peers: {
                            myPeer1: {},
                            myPeer2: {}
                        },
                    }
                },
                organizations: {
                    myOrg: {
                        mspid: 'myOrg1MSP',

                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['myCa-org1'],

                    },
                    myOrg2: {
                        mspid: 'myOrg1MSP',

                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['myCa-org1'],

                    }
                },
                orderers: {
                    myOrderer: {
                        url: 'myUrl',
                        grpcOptions: {
                          'ssl-target-name-override': 'myOrderer',
                          'grpc-max-send-message-length': 15,
                          'grpc.http2.keepalive_time': 20
                        }
                        ,
                        tlsCACerts: {
                            pem: 'myCert'
                        }
                    }
                },
                peers: {
                    myPeer1: {
                        url: 'myUrl',
                        eventUrl: 'myEventUrl',
                        grpcOptions: {
                          'ssl-target-name-override': 'myPeer1',
                          'grpc-max-send-message-length': 25,
                          'grpc.http2.keepalive_time': 30
                        },
                        tlsCACerts: {
                            pem: 'myCert'
                        }
                    },
                    myPeer2: {
                        url: 'myUrl2',
                        eventUrl: 'myEventUrl2',
                        grpcOptions: {
                          'ssl-target-name-override': 'myPeer2',
                          'grpc-max-send-message-length': 35,
                          'grpc.http2.keepalive_time': 40
                        },
                        tlsCACerts: {
                            pem: 'myCert2'
                        }
                    }
                },
                certificateAuthorities: {
                    myCaOrg1: {
                        url: 'myUrl',
                        httpOptions: {
                          verify: true
                        },
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        caName: 'myName'

                    }
                }
            };

            component['connectionProfileData']['x-type'] = 'hlfv1';
            component['connectionProfileData']['x-commitTimeout'] = 100;

            component.startEditing();

            component['basic'].should.deep.equal({
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                organization: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                commitTimeout: 100
            });

            component['orderers'].length.should.equal(1);

            component['orderers'][0].should.deep.equal({
                url: 'myUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myOrderer',
                    grpcMaxSendMessageLength: 15,
                    grpcHttp2KeepAliveTime: 20
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
                name: 'myOrderer'
            });

            component['ordererTimeout'].should.equal('5');

            component['peers'].length.should.equal(2);

            component['peers'][0].should.deep.equal({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer1',
                    grpcMaxSendMessageLength: 25,
                    grpcHttp2KeepAliveTime: 30
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
            });

            component['peers'][1].should.deep.equal({
                name: 'myPeer2',
                url: 'myUrl2',
                eventUrl: 'myEventUrl2',
                grpcOptions: {
                  sslTargetNameOverride: 'myPeer2',
                  grpcMaxSendMessageLength: 35,
                  grpcHttp2KeepAliveTime: 40
                },
                tlsCACerts: {
                    pem: 'myCert2'
                }
            });

            component['peerTimeOut'].should.deep.equal({
                endorser: '5',
                eventHub: '5',
                eventReg: '5'
            });

            component['ca'].should.deep.equal({
                url: 'myUrl',
                caName: 'myName',
                httpOptions: {
                  verify: true
                },
                tlsCACerts: {
                    pem: 'myCert'
                }
            });
        });

        it('should set none defaults without include grpc options', () => {
            component['connectionProfileData'] = {
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                client: {
                    organization: 'myOrg',
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5',
                                eventHub: '5',
                                eventReg: '5'
                            },
                            orderer: '5'
                        }
                    }
                },
                channels: {
                    myChannel: {
                        orderers: [
                            'myOrderer'
                        ],
                        peers: {
                            myPeer1: {},
                            myPeer2: {}
                        },
                    }
                },
                organizations: {
                    myOrg: {
                        mspid: 'myOrg1MSP',

                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['myCa-org1'],

                    },
                    myOrg2: {
                        mspid: 'myOrg1MSP',

                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['myCa-org1'],

                    }
                },
                orderers: {
                    myOrderer: {
                        url: 'myUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        }
                    }
                },
                peers: {
                    myPeer1: {
                        url: 'myUrl',
                        eventUrl: 'myEventUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        }
                    },
                    myPeer2: {
                        url:
                            'myUrl2',
                        eventUrl: 'myEventUrl2',
                        tlsCACerts: {
                            pem: 'myCert2'
                        }
                    }
                },
                certificateAuthorities: {
                    myCaOrg1: {
                        url: 'myUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        httpOptions: {
                          verify: true
                        },
                        caName: 'myName'

                    },
                    myCaOrg2: {
                        url: 'myUrl2',
                        tlsCACerts: {
                            pem: 'myCert2'
                        },
                        caName: 'myName2'

                    }
                }
            };

            component['connectionProfileData']['x-type'] = 'hlfv1';
            component['connectionProfileData']['x-commitTimeout'] = 100;

            component.startEditing();

            component['basic'].should.deep.equal({
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                organization: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                commitTimeout: 100
            });

            component['orderers'].length.should.equal(1);

            component['orderers'][0].should.deep.equal({
                url: 'myUrl',
                grpcOptions: {},
                tlsCACerts: {
                    pem: 'myCert'
                },
                name: 'myOrderer'
            });

            component['ordererTimeout'].should.equal('5');

            component['peers'].length.should.equal(2);

            component['peers'][0].should.deep.equal({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {},
                tlsCACerts: {
                    pem: 'myCert'
                },
            });

            component['peers'][1].should.deep.equal({
                name: 'myPeer2',
                url: 'myUrl2',
                eventUrl: 'myEventUrl2',
                grpcOptions: {},
                tlsCACerts: {
                    pem: 'myCert2'
                }
            });

            component['peerTimeOut'].should.deep.equal({
                endorser: '5',
                eventHub: '5',
                eventReg: '5'
            });

            component['ca'].should.deep.equal({
                url: 'myUrl',
                caName: 'myName',
                httpOptions: {
                  verify: true
                },
                tlsCACerts: {
                    pem: 'myCert'
                }
            });
        });

        it('should set none defaults without include grpc sub options', () => {
            component['connectionProfileData'] = {
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                client: {
                    organization: 'myOrg',
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5',
                                eventHub: '5',
                                eventReg: '5'
                            },
                            orderer: '5'
                        }
                    }
                },
                channels: {
                    myChannel: {
                        orderers: [
                            'myOrderer'
                        ],
                        peers: {
                            myPeer1: {},
                            myPeer2: {}
                        },
                    }
                },
                organizations: {
                    myOrg: {
                        mspid: 'myOrg1MSP',

                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['myCa-org1'],

                    },
                    myOrg2: {
                        mspid: 'myOrg1MSP',

                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['myCa-org1'],

                    }
                },
                orderers: {
                    myOrderer: {
                        url: 'myUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        grpcOptions: {}
                    }
                },
                peers: {
                    myPeer1: {
                        url: 'myUrl',
                        eventUrl: 'myEventUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        grpcOptions: {}
                    },
                    myPeer2: {
                        url:
                            'myUrl2',
                        eventUrl: 'myEventUrl2',
                        tlsCACerts: {
                            pem: 'myCert2'
                        },
                        grpcOptions: {}
                    }
                },
                certificateAuthorities: {
                    myCaOrg1: {
                        url: 'myUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        httpOptions: {
                          verify: true
                        },
                        caName: 'myName'

                    },
                    myCaOrg2: {
                        url: 'myUrl2',
                        tlsCACerts: {
                            pem: 'myCert2'
                        },
                        caName: 'myName2'

                    }
                }
            };

            component['connectionProfileData']['x-type'] = 'hlfv1';
            component['connectionProfileData']['x-commitTimeout'] = 100;

            component.startEditing();

            component['basic'].should.deep.equal({
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                organization: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                commitTimeout: 100
            });

            component['orderers'].length.should.equal(1);

            component['orderers'][0].should.deep.equal({
                url: 'myUrl',
                grpcOptions: {},
                tlsCACerts: {
                    pem: 'myCert'
                },
                name: 'myOrderer'
            });

            component['ordererTimeout'].should.equal('5');

            component['peers'].length.should.equal(2);

            component['peers'][0].should.deep.equal({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {},
                tlsCACerts: {
                    pem: 'myCert'
                },
            });

            component['peers'][1].should.deep.equal({
                name: 'myPeer2',
                url: 'myUrl2',
                eventUrl: 'myEventUrl2',
                grpcOptions: {},
                tlsCACerts: {
                    pem: 'myCert2'
                }
            });

            component['peerTimeOut'].should.deep.equal({
                endorser: '5',
                eventHub: '5',
                eventReg: '5'
            });

            component['ca'].should.deep.equal({
                url: 'myUrl',
                caName: 'myName',
                httpOptions: {
                  verify: true
                },
                tlsCACerts: {
                    pem: 'myCert'
                }
            });
        });

        it('should set none to their defaults but assign httpOptions verify if not passed and remove tlsCACerts if assigned for the CA', () => {
            component['connectionProfileData'] = {
                name: 'myProfile',
                description: 'myDescription',

                version: '2.8',
                client: {
                    organization: 'myOrg',
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5',
                                eventHub: '5',
                                eventReg: '5'
                            },
                            orderer: '5'
                        }
                    }
                },
                channels: {
                    myChannel: {
                        orderers: [
                            'myOrderer'
                        ],
                        peers: {
                            myPeer1: {},
                            myPeer2: {}
                        },
                    }
                },
                organizations: {
                    myOrg: {
                        mspid: 'myOrg1MSP',

                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['myCa-org1'],

                    },
                    myOrg2: {
                        mspid: 'myOrg1MSP',

                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['myCa-org1'],

                    }
                },
                orderers: {
                    myOrderer: {
                        url: 'myUrl',
                        grpcOptions: {
                          'ssl-target-name-override': 'myOrderer',
                          'grpc-max-send-message-length': 15,
                          'grpc.http2.keepalive_time': 20
                        }
                        ,
                        tlsCACerts: {
                            pem: 'myCert'
                        }
                    }
                },
                peers: {
                    myPeer1: {
                        url: 'myUrl',
                        eventUrl: 'myEventUrl',
                        grpcOptions: {
                          'ssl-target-name-override': 'myPeer1',
                          'grpc-max-send-message-length': 25,
                          'grpc.http2.keepalive_time': 30
                        },
                        tlsCACerts: {
                            pem: 'myCert'
                        }
                    },
                    myPeer2: {
                        url: 'myUrl2',
                        eventUrl: 'myEventUrl2',
                        grpcOptions: {
                          'ssl-target-name-override': 'myPeer2',
                          'grpc-max-send-message-length': 35,
                          'grpc.http2.keepalive_time': 40
                        },
                        tlsCACerts: {
                            pem: 'myCert2'
                        }
                    }
                },
                certificateAuthorities: {
                    myCaOrg1: {
                        url: 'myUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        caName: 'myName'

                    }
                }
            };

            component['connectionProfileData']['x-type'] = 'hlfv1';
            component['connectionProfileData']['x-commitTimeout'] = 100;

            component.startEditing();

            component['basic'].should.deep.equal({
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                organization: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                commitTimeout: 100
            });

            component['orderers'].length.should.equal(1);

            component['orderers'][0].should.deep.equal({
                url: 'myUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myOrderer',
                    grpcMaxSendMessageLength: 15,
                    grpcHttp2KeepAliveTime: 20
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
                name: 'myOrderer'
            });

            component['ordererTimeout'].should.equal('5');

            component['peers'].length.should.equal(2);

            component['peers'][0].should.deep.equal({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer1',
                    grpcMaxSendMessageLength: 25,
                    grpcHttp2KeepAliveTime: 30
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
            });

            component['peers'][1].should.deep.equal({
                name: 'myPeer2',
                url: 'myUrl2',
                eventUrl: 'myEventUrl2',
                grpcOptions: {
                  sslTargetNameOverride: 'myPeer2',
                  grpcMaxSendMessageLength: 35,
                  grpcHttp2KeepAliveTime: 40
                },
                tlsCACerts: {
                    pem: 'myCert2'
                }
            });

            component['peerTimeOut'].should.deep.equal({
                endorser: '5',
                eventHub: '5',
                eventReg: '5'
            });

            component['ca'].should.deep.equal({
                url: 'myUrl',
                caName: 'myName',
                httpOptions: {
                  verify: false
                }
            });
        });

        it('should error if unknown form type', () => {
            component['connectionProfileData'] = {};
            component['connectionProfileData']['x-type'] = 'hlfv10000';

            (() => {
                component.startEditing();
            }).should.throw('Unknown connection profile type');
        });
    });

    describe('addOrderer', () => {
        it('should add an orderer', () => {

            component['orderers'].push(component['defaultOrderer']);

            component.addOrderer();

            component['orderers'].length.should.equal(2);

            component['orderers'][0].should.deep.equal(component['defaultOrderer']);

            component['orderers'][1].should.deep.equal({
                name: 'orderer1.example.com',
                url: 'grpc://localhost:7050',
                grpcOptions: {
                    sslTargetNameOverride: null,
                    grpcMaxSendMessageLength: null,
                    grpcHttp2KeepAliveTime: null
                }
            });
        });

    });

    describe('removeOrderer', () => {
        it('should remove an orderer', () => {
            component['orderers'].push(component['defaultOrderer']);

            component.addOrderer();

            component['orderers'].length.should.equal(2);

            component.removeOrderer(1);

            component['orderers'][0].should.deep.equal(component['defaultOrderer']);
        });
    });

    describe('addPeer', () => {
        it('should add a peer', () => {
            component['peers'].push(component['defaultPeer']);

            component.addPeer();

            component['peers'].length.should.equal(2);

            component['peers'][0].should.deep.equal(component['defaultPeer']);

            component['peers'][1].should.deep.equal({
              name: 'peer1.example.com',
              url: 'grpc://localhost:7051',
              eventUrl: 'grpc://localhost:7053',
              grpcOptions: {
                  sslTargetNameOverride: null,
                  grpcMaxSendMessageLength: null,
                  grpcHttp2KeepAliveTime: null
              },
              organization: true,
              endorsingPeer: true,
              chaincodeQuery: true,
              ledgerQuery: true,
              eventSource: true
            });
        });
    });

    describe('removePeer', () => {
        it('should remove a peer', () => {
            component['peers'].push(component['defaultPeer']);

            component.addPeer();

            component['peers'].length.should.equal(2);

            component.removePeer(1);

            component['peers'][0].should.deep.equal(component['defaultPeer']);
        });
    });

    describe('handleKeyPress', () => {
        let mockEvent;
        beforeEach(() => {
            mockEvent = {
                keyCode: 13,
                preventDefault: () => { return; }
            };
        });

        it('should ignore all other key presses apart from enter', () => {

            let event = {
                keyCode: 12
            };

            let onSubmitStub = sinon.stub(component, 'onSubmit');

            component.handleKeyPress(event);

            onSubmitStub.should.not.have.been.called;

        });

        it('should run on submit when the form is valid', () => {

            let onSubmitStub = sinon.stub(component, 'onSubmit');
            let formValidStub = sinon.stub(component, 'formValid');
            formValidStub.returns(true);

            component['connectionProfileForm'] = {
                form: {}
            };

            component.handleKeyPress(mockEvent);

            onSubmitStub.should.have.been.called;
        });

        it('shouldn\'t run on submit when the form is not valid and mark elements as dirty', () => {

            let spyFnc = sinon.spy();
            let onSubmitStub = sinon.stub(component, 'onSubmit');
            let formValidStub = sinon.stub(component, 'formValid');
            formValidStub.returns(false);

            component['connectionProfileForm'] = {
                form: {
                    controls: {
                        control1: {
                            markAsDirty: () => {
                                return spyFnc();
                            }
                        }
                    }
                }
            };

            component.handleKeyPress(mockEvent);

            onSubmitStub.should.not.have.been.called;
            spyFnc.should.have.been.called;
        });

        it('should run the default action for a button when a button selected', () => {

            let spyFnc = sinon.spy();
            let onSubmitStub = sinon.stub(component, 'onSubmit');
            let getActiveElementStub = sinon.stub(component, 'getActiveElement');
            getActiveElementStub.returns({
                tagName: 'BUTTON',
                click: () => { return spyFnc(); }
            });

            component.handleKeyPress(mockEvent);

            onSubmitStub.should.not.have.been.called;
            spyFnc.should.have.been.called;
        });

        it('should check and uncheck the checkbox when a checkbox is selected', () => {

            let spyFnc = sinon.spy();
            let onSubmitStub = sinon.stub(component, 'onSubmit');
            let getActiveElementStub = sinon.stub(component, 'getActiveElement');
            let activeElement = {
                tagName: 'INPUT',
                type: 'CHECKBOX',
                click: () => { return spyFnc(); }
            };
            getActiveElementStub.returns(activeElement);

            component.handleKeyPress(mockEvent);

            onSubmitStub.should.not.have.been.called;
            spyFnc.should.have.been.called;
        });
    });

    describe('onSubmit', () => {

        it('should submit v1 profile form', fakeAsync(() => {
            let completedProfile = {
                'x-type': 'hlfv1',
                'x-commitTimeout': 100,
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                client: {
                    organization: 'myOrg',
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5',
                                eventHub: '5',
                                eventReg: '5'
                            },
                            orderer: '5'
                        }
                    }
                },
                channels: {
                    myChannel: {
                        orderers: [
                            'myOrderer'
                        ],
                        peers: {
                            myPeer1: {},
                            myPeer2: {}
                        },
                    }
                },
                organizations: {
                    myOrg: {
                        mspid: 'myOrg1MSP',
                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['myCaOrg1'],

                    }
                },
                orderers: {
                    myOrderer: {
                        url: 'myUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        grpcOptions: {
                            'ssl-target-name-override': 'myOrderer',
                            'grpc-max-send-message-length': 15,
                            'grpc.http2.keepalive_time': 20
                        }
                    }
                },
                peers: {
                    myPeer1: {
                        url: 'myUrl',
                        eventUrl: 'myEventUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        grpcOptions: {
                            'ssl-target-name-override': 'myPeer1',
                            'grpc-max-send-message-length': 25,
                            'grpc.http2.keepalive_time': 30
                        },
                        endorsingPeer: true,
                        ledgerQuery: true,
                        chaincodeQuery: true,
                        eventSource: true
                    },
                    myPeer2: {
                        url:
                            'myUrl2',
                        eventUrl: 'myEventUrl2',
                        tlsCACerts: {
                            pem: 'myCert2'
                        },
                        grpcOptions: {
                            'ssl-target-name-override': 'myPeer2',
                            'grpc-max-send-message-length': 35,
                            'grpc.http2.keepalive_time': 40
                        },
                        endorsingPeer: true,
                        ledgerQuery: true,
                        chaincodeQuery: true,
                        eventSource: true
                    }
                },
                certificateAuthorities: {
                    myCaOrg1: {
                        url: 'myUrl',
                        httpOptions: {
                          verify: true
                        },
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        caName: 'myCaOrg1'

                    }
                }
            };

            component['connectionProfileData'] = {
                'x-type': 'hlfv1'
            };

            component['basic'] = {
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                organization: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                commitTimeout: 100
            };

            component['orderers'] = [{
                url: 'myUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myOrderer',
                    grpcMaxSendMessageLength: 15,
                    grpcHttp2KeepAliveTime: 20
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
                name: 'myOrderer'
            }];

            component['ordererTimeout'] = '5';

            component['peers'] = [];

            component['peers'].push({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer1',
                    grpcMaxSendMessageLength: 25,
                    grpcHttp2KeepAliveTime: 30
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
                organization: true,
                endorsingPeer: true,
                chaincodeQuery: true,
                ledgerQuery: true,
                eventSource: true
            });

            component['peers'].push({
                name: 'myPeer2',
                url: 'myUrl2',
                eventUrl: 'myEventUrl2',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer2',
                    grpcMaxSendMessageLength: 35,
                    grpcHttp2KeepAliveTime: 40
                },
                tlsCACerts: {
                    pem: 'myCert2'
                },
                organization: true,
                endorsingPeer: true,
                chaincodeQuery: true,
                ledgerQuery: true,
                eventSource: true
            });

            component['peerTimeOut'] = {
                endorser: '5',
                eventHub: '5',
                eventReg: '5'
            };

            component['ca'] = {
                url: 'myUrl',
                caName: 'myCaOrg1',
                httpOptions: {
                  verify: true
                },
                tlsCACerts: {
                    pem: 'myCert'
                }
            };

            let profileUpdatedSpy = sinon.spy(component.profileUpdated, 'emit');

            component.profileUpdated.subscribe((data) => {
                data.should.deep.equal({updated: true, connectionProfile: completedProfile});
            });

            component.onSubmit();
            component['connectionProfileData'].should.deep.equal(completedProfile);
        }));

        it('should submit v1 profile with no description, no certs, no grpc options, no caName, no ca httpOptions, no ca tlsCACerts and no commitTimeout', fakeAsync(() => {
            let completedProfile = {
                'x-type': 'hlfv1',
                'x-commitTimeout': 100,
                name: 'myProfile',
                version: '2.8',
                client: {
                    organization: 'myOrg',
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5',
                                eventHub: '5',
                                eventReg: '5'
                            },
                            orderer: '5'
                        }
                    }
                },
                channels: {
                    myChannel: {
                        orderers: [
                            'myOrderer'
                        ],
                        peers: {
                            myPeer1: {},
                            myPeer2: {}
                        },
                    }
                },
                organizations: {
                    myOrg: {
                        mspid: 'myOrg1MSP',
                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['ca-org1']
                    }
                },
                orderers: {
                    myOrderer: {
                        url: 'myUrl',
                        grpcOptions: {}
                    }
                },
                peers: {
                    myPeer1: {
                        url: 'myUrl',
                        eventUrl: 'myEventUrl',
                        grpcOptions: {},
                        endorsingPeer: true,
                        chaincodeQuery: true,
                        ledgerQuery: true,
                        eventSource: true
                    },
                    myPeer2: {
                        url:
                            'myUrl2',
                        eventUrl: 'myEventUrl2',
                        grpcOptions: {},
                        endorsingPeer: true,
                        chaincodeQuery: true,
                        ledgerQuery: true,
                        eventSource: true
                    }
                },
                certificateAuthorities: {
                    'ca-org1': {
                        url: 'myUrl'
                    }
                }
            };

            component['connectionProfileData'] = {
                'x-type': 'hlfv1'
            };

            component['basic'] = {
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                organization: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                commitTimeout: 100
            };

            delete component['basic'].commitTimeout;
            delete component['basic'].description;

            component['orderers'] = [{
                url: 'myUrl',
                name: 'myOrderer',
                grpcOptions: {}
            }];

            component['ordererTimeout'] = '5';

            component['peers'] = [];

            component['peers'].push({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {},
                organization: true,
                endorsingPeer: true,
                chaincodeQuery: true,
                ledgerQuery: true,
                eventSource: true
            });

            component['peers'].push({
                name: 'myPeer2',
                url: 'myUrl2',
                eventUrl: 'myEventUrl2',
                grpcOptions: {},
                organization: true,
                endorsingPeer: true,
                chaincodeQuery: true,
                ledgerQuery: true,
                eventSource: true
            });

            component['peerTimeOut'] = {
                endorser: '5',
                eventHub: '5',
                eventReg: '5'
            };

            component['ca'] = {
                url: 'myUrl',
                httpOptions: {
                  verify: false
                }
            };

            let profileUpdatedSpy = sinon.spy(component.profileUpdated, 'emit');

            component.profileUpdated.subscribe((data) => {
                data.should.deep.equal({updated: true, connectionProfile: completedProfile});
            });

            component.onSubmit();

            component['connectionProfileData'].should.deep.equal(completedProfile);
        }));

        it('should submit v1 profile form with httpOptions verify for the CA but no certs', fakeAsync(() => {
            let completedProfile = {
                'x-type': 'hlfv1',
                'x-commitTimeout': 100,
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                client: {
                    organization: 'myOrg',
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5',
                                eventHub: '5',
                                eventReg: '5'
                            },
                            orderer: '5'
                        }
                    }
                },
                channels: {
                    myChannel: {
                        orderers: [
                            'myOrderer'
                        ],
                        peers: {
                            myPeer1: {},
                            myPeer2: {}
                        },
                    }
                },
                organizations: {
                    myOrg: {
                        mspid: 'myOrg1MSP',
                        peers: ['myPeer1', 'myPeer2'],
                        certificateAuthorities: ['myCaOrg1'],

                    }
                },
                orderers: {
                    myOrderer: {
                        url: 'myUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        grpcOptions: {
                            'ssl-target-name-override': 'myOrderer',
                            'grpc-max-send-message-length': 15,
                            'grpc.http2.keepalive_time': 20
                        }
                    }
                },
                peers: {
                    myPeer1: {
                        url: 'myUrl',
                        eventUrl: 'myEventUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        grpcOptions: {
                            'ssl-target-name-override': 'myPeer1',
                            'grpc-max-send-message-length': 25,
                            'grpc.http2.keepalive_time': 30
                        },
                        endorsingPeer: true,
                        ledgerQuery: true,
                        chaincodeQuery: true,
                        eventSource: true
                    },
                    myPeer2: {
                        url:
                            'myUrl2',
                        eventUrl: 'myEventUrl2',
                        tlsCACerts: {
                            pem: 'myCert2'
                        },
                        grpcOptions: {
                            'ssl-target-name-override': 'myPeer2',
                            'grpc-max-send-message-length': 35,
                            'grpc.http2.keepalive_time': 40
                        },
                        endorsingPeer: true,
                        ledgerQuery: true,
                        chaincodeQuery: true,
                        eventSource: true
                    }
                },
                certificateAuthorities: {
                    myCaOrg1: {
                        url: 'myUrl',
                        httpOptions: {
                          verify: true
                        },
                        caName: 'myCaOrg1'

                    }
                }
            };

            component['connectionProfileData'] = {
                'x-type': 'hlfv1'
            };

            component['basic'] = {
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                organization: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                commitTimeout: 100
            };

            component['orderers'] = [{
                url: 'myUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myOrderer',
                    grpcMaxSendMessageLength: 15,
                    grpcHttp2KeepAliveTime: 20
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
                name: 'myOrderer'
            }];

            component['ordererTimeout'] = '5';

            component['peers'] = [];

            component['peers'].push({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer1',
                    grpcMaxSendMessageLength: 25,
                    grpcHttp2KeepAliveTime: 30
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
                organization: true,
                endorsingPeer: true,
                chaincodeQuery: true,
                ledgerQuery: true,
                eventSource: true
            });

            component['peers'].push({
                name: 'myPeer2',
                url: 'myUrl2',
                eventUrl: 'myEventUrl2',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer2',
                    grpcMaxSendMessageLength: 35,
                    grpcHttp2KeepAliveTime: 40
                },
                tlsCACerts: {
                    pem: 'myCert2'
                },
                organization: true,
                endorsingPeer: true,
                chaincodeQuery: true,
                ledgerQuery: true,
                eventSource: true
            });

            component['peerTimeOut'] = {
                endorser: '5',
                eventHub: '5',
                eventReg: '5'
            };

            component['ca'] = {
                url: 'myUrl',
                caName: 'myCaOrg1',
                httpOptions: {
                  verify: true
                }
            };

            let profileUpdatedSpy = sinon.spy(component.profileUpdated, 'emit');

            component.profileUpdated.subscribe((data) => {
                data.should.deep.equal({updated: true, connectionProfile: completedProfile});
            });

            component.onSubmit();
            component['connectionProfileData'].should.deep.equal(completedProfile);
        }));

        it('should throw error on unknown profile type', fakeAsync(() => {
            component['connectionProfileData'] = {name: 'unknown profile', profile: {type: 'unknown type'}};

            (() => {
                component.onSubmit();
            }).should.throw('Unknown profile type');
            tick();
        }));

    });

    describe('openAddCertificateModal', () => {
        it('should open orderers certificate modal', fakeAsync(() => {
            component['orderers'] = [{
                tlsCACerts: {
                    pem: 'myCert'
                },
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve({cert: 'ordererCert_2', sslTargetNameOverride: 'myOverride_2'})
            });

            component.openAddCertificateModal(0, 'orderers');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['orderers'][0].should.deep.equal({
                tlsCACerts: {
                    pem: 'ordererCert_2'
                },
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride_2'
                }
            });
        }));

        it('should open peer certificate modal', fakeAsync(() => {
            component['peers'] = [{
                tlsCACerts: {
                    pem: 'myCert'
                },
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve({cert: 'peerCert_2', sslTargetNameOverride: 'myOverride_2'})
            });

            component.openAddCertificateModal(0, 'peers');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['peers'][0].should.deep.equal({
                tlsCACerts: {
                    pem: 'peerCert_2'
                },
                grpcOptions: {
                    sslTargetNameOverride: 'myOverride_2'
                }
            });
        }));

        it('should open ca certificate modal', fakeAsync(() => {
            component['ca'] = {
                url: 'myUrl',
                tlsCACerts: {
                    pem: 'myCert'
                }
            };

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve({cert: 'caCert_2', sslTargetNameOverride: null})
            });

            component.openAddCertificateModal(0, 'ca');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['ca'].should.deep.equal({
                url: 'myUrl',
                tlsCACerts: {
                    pem: 'caCert_2'
                }
            });
        }));

        it('should open certificate modal and create sslTargetNameOverride when grpcOptions does not exist', fakeAsync(() => {
            component['peers'] = [{
                tlsCACerts: {
                    pem: 'myCert'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve({cert: 'peerCert_2', sslTargetNameOverride: 'myOverride_2'})
            });

            component.openAddCertificateModal(0, 'peers');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['peers'][0].should.deep.equal({
                tlsCACerts: {
                    pem: 'peerCert_2'
                },
                grpcOptions: {
                    sslTargetNameOverride: 'myOverride_2'
                }
            });
        }));

        it('should open certificate modal and create sslTargetNameOverride when it does not exist', fakeAsync(() => {
            component['peers'] = [{
                tlsCACerts: {
                    pem: 'myCert'
                },
                grpcOptions: {}
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve({cert: 'peerCert_2', sslTargetNameOverride: 'myOverride_2'})
            });

            component.openAddCertificateModal(0, 'peers');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['peers'][0].should.deep.equal({
                tlsCACerts: {
                    pem: 'peerCert_2'
                },
                grpcOptions: {
                    sslTargetNameOverride: 'myOverride_2'
                }
            });
        }));

        it('should open certificate modal and create tlsCACerts object when it does not exist', fakeAsync(() => {
            component['peers'] = [{
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve({cert: 'peerCert_2', sslTargetNameOverride: 'myOverride_2'})
            });

            component.openAddCertificateModal(0, 'peers');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['peers'][0].should.deep.equal({
                tlsCACerts: {
                    pem: 'peerCert_2'
                },
                grpcOptions: {
                    sslTargetNameOverride: 'myOverride_2'
                }
            });
        }));

        it('should open certificate modal and create pem field when it does not exist in tlsCACerts', fakeAsync(() => {
            component['peers'] = [{
                tlsCACerts: {},
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve({cert: 'peerCert_2', sslTargetNameOverride: 'myOverride_2'})
            });

            component.openAddCertificateModal(0, 'peers');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['peers'][0].should.deep.equal({
                tlsCACerts: {
                    pem: 'peerCert_2'
                },
                grpcOptions: {
                    sslTargetNameOverride: 'myOverride_2'
                }
            });
        }));

        it('should remove the tlsCACerts and sslTargetNameOverride fields when remove button is pressed', fakeAsync(() => {
            component['peers'] = [{
                tlsCACerts: {
                  pem: 'myCert'
                },
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve(null)
            });

            component.openAddCertificateModal(0, 'peers');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['peers'][0].should.deep.equal({
              grpcOptions: {}
            });
        }));

        it('should remove only the tlsCACerts when remove button is pressed and type ca', fakeAsync(() => {
            component['ca'] = {
                tlsCACerts: {
                  pem: 'myCert'
                },
                grpcOptions: {
                  sslTargetNameOverride: 'I do not normally exist for CA but do for this test'
                }
            };

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve(null)
            });

            component.openAddCertificateModal(0, 'ca');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['ca'].should.deep.equal({
              grpcOptions: {
                sslTargetNameOverride: 'I do not normally exist for CA but do for this test'
              }
            });
        }));

        it('should revert object to prior state when cancel pressed for a peer', fakeAsync(() => {
            component['peers'] = [{
                tlsCACerts: {
                  pem: 'myCert'
                },
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.reject(null)
            });

            component['peers'] = [{
                tlsCACerts: {
                  pem: 'myCert_new'
                },
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride_new'
                }
            }];

            component.openAddCertificateModal(0, 'peers');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['peers'] = [{
                tlsCACerts: {
                  pem: 'myCert'
                },
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride'
                }
            }];
        }));

        it('should revert object to prior state when cancel pressed for a ca', fakeAsync(() => {
            component['ca'] = {
               url: 'https://localhost:7054',
               caName: null,
               httpOptions: {
                 verify: true
               }
            };

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.reject(null)
            });

            component['ca'] = {
               url: 'https://localhost:7054',
               caName: null,
               httpOptions: {
                 verify: true
               },
               tlsCACerts: {
                 pem: 'ENTERED CERT'
               }
            };

            component.openAddCertificateModal(0, 'ca');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['ca'] = {
               url: 'https://localhost:7054',
               caName: null,
               httpOptions: {
                 verify: true
               }
            };
        }));

        it('should error on unrecognized type', (() => {
            try {
                component.openAddCertificateModal(0, 'test');
                throw new Error('Open add certificate should have thrown an error');
            } catch (err) {
                err.message.should.deep.equal('Unrecognized type test');
            }
        }));

        it('should error if object of type orderer at the index does not exist', (() => {
          component['orderers'] = [];
          try {
              component.openAddCertificateModal(0, 'orderers');
              throw new Error('Open add certificate should have thrown an error');
          } catch (err) {
              err.message.should.deep.equal('Orderer at index 0 does not exist.');
          }
        }));

        it('should error if object of type peer at the index does not exist', (() => {
          component['peers'] = [];
          try {
              component.openAddCertificateModal(0, 'peers');
              throw new Error('Open add certificate should have thrown an error');
          } catch (err) {
              err.message.should.deep.equal('Peer at index 0 does not exist.');
          }
        }));

        it('should error if object of type ca does not exist', (() => {
          component['ca'] = undefined;
          try {
              component.openAddCertificateModal(0, 'ca');
              throw new Error('Open add certificate should have thrown an error');
          } catch (err) {
              err.message.should.deep.equal('CA does not exist.');
          }
        }));

        it('should open orderers certificate modal and handle error', fakeAsync(() => {
            component['orderers'] = [{
                tlsCACerts: {
                    pem: 'myCert'
                },
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.openAddCertificateModal(0, 'orderers');

            tick();

            mockNgbModal.open.should.have.been.called;

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should open orderers certificate modal and handle cancel', fakeAsync(() => {
            component['orderers'] = [{
                tlsCACerts: {
                    pem: 'myCert'
                },
                grpcOptions: {
                  sslTargetNameOverride: 'myOverride'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.reject(1)
            });

            component.openAddCertificateModal(0, 'orderers');

            tick();

            mockNgbModal.open.should.have.been.called;

            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));
    });

    describe('showCertificate', () => {
        it('should show certificate', () => {
            component.showCertificate('certdata');
            mockConnectionProfileService.setCertificate.should.be.calledWith('certdata');
            mockNgbModal.open.should.be.called;
        });
    });

    describe('component input', () => {
        it('should use the data passed in if set', () => {
            let startEditingStub = sinon.stub(component, 'startEditing');
            component.connectionProfile = {name: 'v1 Profile'};
            startEditingStub.should.have.been.called;
            component['connectionProfileData'].should.deep.equal({name: 'v1 Profile'});
        });

        it('should set initial data if nothing passed in', () => {
            let startEditingStub = sinon.stub(component, 'startEditing');
            component.connectionProfile = null;
            startEditingStub.should.have.been.called;
            component['connectionProfileData'].should.deep.equal({'x-type': 'hlfv1'});
        });
    });

    describe('stopEditing', () => {
        it('should stop editing', () => {
            component.profileUpdated.subscribe((event) => {
                event.should.deep.equal({update: false});
            });
            component.stopEditing();
        });
    });

    describe('isNumber', () => {
      it('should return true if value passed is whole number', () => {
        component.isNumber('123').should.deep.equal(true);
      });

      it('should return true if value passed is decimal number', () => {
        component.isNumber('1.23').should.deep.equal(true);
      });

      it('should return true if value passed is null', () => {
        component.isNumber(null).should.deep.equal(true);
      });

      it('should return true if value passed is empty string', () => {
        component.isNumber('').should.deep.equal(true);
      });

      it('should return false if value passed is undefined', () => {
        component.isNumber(undefined).should.deep.equal(false);
      });

      it('should return false if value passed contains a letter', () => {
        component.isNumber('1a23').should.deep.equal(false);
      });

      it('should return false if value passed is valid javascript number but not whole or decimal formatted', () => {
        component.isNumber('1e1000').should.deep.equal(false);
      });
    });

    describe('formValid', () => {
      let getEls = sinon.stub(document, 'getElementsByClassName');
      it('should return true if no error messages and form is valid', () => {
        getEls.withArgs('error-message').returns([]);
        let form = {
          valid: true
        };
        component.formValid(form).should.deep.equal(true);
      });

      it('should return false if error messages and form is valid', () => {
        getEls.withArgs('error-message').returns(['HTML DOM OBJECT']);
        let form = {
          valid: true
        };
        component.formValid(form).should.deep.equal(false);
      });

      it('should return false if no error messages and form is invalid', () => {
        getEls.withArgs('error-message').returns([]);
        let form = {
          valid: false
        };
        component.formValid(form).should.deep.equal(false);
      });
    });

    describe('setVerify', () => {
        it('should set httpOption.verify to false and remove tlsCACerts for the CA if the url is not secure', () => {
          component['ca'] = {
             url: 'http://localhost:7054',
             caName: null,
             httpOptions: {
               verify: true
             },
             tlsCACerts: {
               pem: 'CERT'
             }
          };

          component.setVerify();

          component['ca'].should.deep.equal({
             url: 'http://localhost:7054',
             caName: null,
             httpOptions: {
               verify: false
             }
          });
        });

        it('should leave httpOption.verify as is for the CA if the url is secure', () => {
          component['ca'] = {
             url: 'https://localhost:7054',
             caName: null,
             httpOptions: {
               verify: true
             },
             tlsCACerts: {
               pem: 'CERT'
             }
          };

          component.setVerify();

          component['ca'].should.deep.equal({
             url: 'https://localhost:7054',
             caName: null,
             httpOptions: {
               verify: true
             },
             tlsCACerts: {
               pem: 'CERT'
             }
          });
        });
    });

    describe('clearCaTls', () => {
      it('should delete the tlsCACerts field from the CA', () => {
        component['ca'] = {
           url: 'https://localhost:7054',
           caName: null,
           httpOptions: {
             verify: true
           },
           tlsCACerts: {
             pem: 'CERT'
           }
        };

        component.clearCaTls();

        component['ca'].should.deep.equal({
           url: 'https://localhost:7054',
           caName: null,
           httpOptions: {
             verify: true
           }
        });
      });
    });

    describe('getActiveElement', () => {
        it('should return the active element', () => {
            component.getActiveElement().should.deep.equal(document.activeElement);
        });
    });
});

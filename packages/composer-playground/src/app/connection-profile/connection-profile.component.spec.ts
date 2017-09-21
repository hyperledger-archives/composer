/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
/* tslint:disable:object-literal-key-quotes */
import { ComponentFixture, TestBed, fakeAsync, tick, async } from '@angular/core/testing';
import { FormsModule, Validators } from '@angular/forms';
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
                organisation: 'Org1',
                mspid: 'Org1MSP',
                channel: 'composerchannel',
                keyValStore: '/tmp/keyValStore'
            });

            component['orderers'].should.deep.equal([{
                name: 'orderer.example.com',
                url: 'grpcs://localhost:7050',
                grpcOptions: {
                    sslTargetNameOverride: null
                },
                tlsCACerts: {
                    pem: null
                }
            }]);

            component['ordererTimeout'].should.equal('3s');

            component['peers'].should.deep.equal([{
                name: 'peer.example.com',
                url: 'grpcs://localhost:7051',
                eventUrl: 'grpcs://localhost:7053',
                grpcOptions: {
                    sslTargetNameOverride: null
                },
                tlsCACerts: {
                    pem: null
                }
            }]);

            component['peerTimeOut'].should.deep.equal({
                endorser: '3s',
                eventHub: '3s',
                eventReg: '3s'
            });

            component['ca'].should.deep.equal({
                url: 'http://localhost:7054',
                caName: null,
                tlsCACerts: {
                    pem: null
                }
            });
        });

        it('should set none defaults', () => {
            component['connectionProfileData'] = {
                name: 'myProfile',
                description: 'myDescription',

                version: '2.8',
                client: {
                    organisation: 'myOrg',
                    credentialStore: {
                        path: '/myCredentials'
                    },
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5s',
                                eventHub: '5s',
                                eventReg: '5s'
                            },
                            orderer: '5s'
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
                organisations: {
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
                        grpcOptions: {}
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
                        grpcOptions: {},
                        tlsCACerts: {
                            pem: 'myCert'
                        }
                    },
                    myPeer2: {
                        url:
                            'myUrl2',
                        eventUrl: 'myEventUrl2',
                        grpcOptions: {},
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
            component['connectionProfileData'].orderers.myOrderer.grpcOptions['ssl-target-name-override'] = 'myOrderer';
            component['connectionProfileData'].peers.myPeer1.grpcOptions['ssl-target-name-override'] = 'myPeer1';
            component['connectionProfileData'].peers.myPeer2.grpcOptions['ssl-target-name-override'] = 'myPeer2';

            component.startEditing();

            component['basic'].should.deep.equal({
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                organisation: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                keyValStore: '/myCredentials'
            });

            component['orderers'].length.should.equal(1);

            component['orderers'][0].should.deep.equal({
                url: 'myUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myOrderer'
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
                name: 'myOrderer'
            });

            component['ordererTimeout'].should.equal('5s');

            component['peers'].length.should.equal(2);

            component['peers'][0].should.deep.equal({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer1'
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
                    sslTargetNameOverride: 'myPeer2'
                },
                tlsCACerts: {
                    pem: 'myCert2'
                }
            });

            component['peerTimeOut'].should.deep.equal({
                endorser: '5s',
                eventHub: '5s',
                eventReg: '5s'
            });

            component['ca'].should.deep.equal({
                url: 'myUrl',
                caName: 'myName',
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
                    organisation: 'myOrg',
                    credentialStore: {
                        path: '/myCredentials'
                    },
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5s',
                                eventHub: '5s',
                                eventReg: '5s'
                            },
                            orderer: '5s'
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
                organisations: {
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

            component.startEditing();

            component['basic'].should.deep.equal({
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                organisation: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                keyValStore: '/myCredentials'
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

            component['ordererTimeout'].should.equal('5s');

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
                endorser: '5s',
                eventHub: '5s',
                eventReg: '5s'
            });

            component['ca'].should.deep.equal({
                url: 'myUrl',
                caName: 'myName',
                tlsCACerts: {
                    pem: 'myCert'
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
                url: 'grpcs://localhost:7050',
                grpcOptions: {
                    sslTargetNameOverride: null
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
                url: 'grpcs://localhost:7051',
                eventUrl: 'grpcs://localhost:7053',
                grpcOptions: {
                    sslTargetNameOverride: null
                }
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

    describe('onSubmit', () => {
        it('should ignore all other key presses apart from enter', () => {

            let event = {
                keyCode: 12
            };

            component.onSubmit(event);

            mockConnectionProfileService.createProfile.should.not.have.been.called;
        });

        it('should submit v1 profile form', fakeAsync(() => {
            let completedProfile = {
                'x-type': 'hlfv1',
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                client: {
                    organisation: 'myOrg',
                    credentialStore: {
                        path: '/myCredentials',
                        cryptoStore: {
                            path: '/myCredentials'
                        },
                    },
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5s',
                                eventHub: '5s',
                                eventReg: '5s'
                            },
                            orderer: '5s'
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
                organisations: {
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
                            'ssl-target-name-override': 'myOrderer'
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
                            'ssl-target-name-override': 'myPeer1'
                        }
                    },
                    myPeer2: {
                        url:
                            'myUrl2',
                        eventUrl: 'myEventUrl2',
                        tlsCACerts: {
                            pem: 'myCert2'
                        },
                        grpcOptions: {
                            'ssl-target-name-override': 'myPeer2'
                        }
                    }
                },
                certificateAuthorities: {
                    myCaOrg1: {
                        url: 'myUrl',
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
                organisation: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                keyValStore: '/myCredentials'
            };

            component['orderers'] = [{
                url: 'myUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myOrderer'
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
                name: 'myOrderer'
            }];

            component['ordererTimeout'] = '5s';

            component['peers'] = [];

            component['peers'].push({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer1'
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
            });

            component['peers'].push({
                name: 'myPeer2',
                url: 'myUrl2',
                eventUrl: 'myEventUrl2',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer2'
                },
                tlsCACerts: {
                    pem: 'myCert2'
                }
            });

            component['peerTimeOut'] = {
                endorser: '5s',
                eventHub: '5s',
                eventReg: '5s'
            };

            component['ca'] = {
                url: 'myUrl',
                caName: 'myCaOrg1',
                tlsCACerts: {
                    pem: 'myCert'
                }
            };

            let profileUpdatedSpy = sinon.spy(component.profileUpdated, 'emit');

            component.profileUpdated.subscribe((data) => {
                data.should.deep.equal({updated: true, connectionProfile: completedProfile});
            });

            mockConnectionProfileService.createProfile.returns(Promise.resolve());
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve([]));

            component.onSubmit(null);

            tick();

            mockConnectionProfileService.createProfile.should.have.been.calledWith('myProfile', completedProfile);

            component['connectionProfileData'].should.deep.equal(completedProfile);

            profileUpdatedSpy.should.have.been.called;
        }));

        it('should submit v1 profile with no certs and no grpc options and no caName', fakeAsync(() => {
            let completedProfile = {
                'x-type': 'hlfv1',
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                client: {
                    organisation: 'myOrg',
                    credentialStore: {
                        path: '/myCredentials',
                        cryptoStore: {
                            path: '/myCredentials'
                        }
                    },
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5s',
                                eventHub: '5s',
                                eventReg: '5s'
                            },
                            orderer: '5s'
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
                organisations: {
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
                        grpcOptions: {}
                    },
                    myPeer2: {
                        url:
                            'myUrl2',
                        eventUrl: 'myEventUrl2',
                        grpcOptions: {}
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
                organisation: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                keyValStore: '/myCredentials'
            };

            component['orderers'] = [{
                url: 'myUrl',
                grpcOptions: {},
                name: 'myOrderer'
            }];

            component['ordererTimeout'] = '5s';

            component['peers'] = [];

            component['peers'].push({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {}
            });

            component['peers'].push({
                name: 'myPeer2',
                url: 'myUrl2',
                eventUrl: 'myEventUrl2',
                grpcOptions: {}
            });

            component['peerTimeOut'] = {
                endorser: '5s',
                eventHub: '5s',
                eventReg: '5s'
            };

            component['ca'] = {
                url: 'myUrl'
            };

            let profileUpdatedSpy = sinon.spy(component.profileUpdated, 'emit');

            component.profileUpdated.subscribe((data) => {
                data.should.deep.equal({updated: true, connectionProfile: completedProfile});
            });

            mockConnectionProfileService.createProfile.returns(Promise.resolve());
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve([]));

            component.onSubmit(null);

            tick();

            mockConnectionProfileService.createProfile.should.have.been.calledWith('myProfile', completedProfile);

            component['connectionProfileData'].should.deep.equal(completedProfile);

            profileUpdatedSpy.should.have.been.called;
        }));

        it('should submit v1 profile form with a changed name', fakeAsync(() => {
            let completedProfile = {
                'x-type': 'hlfv1',
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                client: {
                    organisation: 'myOrg',
                    credentialStore: {
                        path: '/myCredentials',
                        cryptoStore: {
                            path: '/myCredentials'
                        }
                    },
                    connection: {
                        timeout: {
                            peer: {
                                endorser: '5s',
                                eventHub: '5s',
                                eventReg: '5s'
                            },
                            orderer: '5s'
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
                organisations: {
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
                            'ssl-target-name-override': 'myOrderer'
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
                            'ssl-target-name-override': 'myPeer1'
                        }
                    },
                    myPeer2: {
                        url:
                            'myUrl2',
                        eventUrl: 'myEventUrl2',
                        tlsCACerts: {
                            pem: 'myCert2'
                        },
                        grpcOptions: {
                            'ssl-target-name-override': 'myPeer2'
                        }
                    }
                },
                certificateAuthorities: {
                    myCaOrg1: {
                        url: 'myUrl',
                        tlsCACerts: {
                            pem: 'myCert'
                        },
                        caName: 'myCaOrg1'

                    }
                }
            };

            component['connectionProfileData'] = {
                name: 'anotherName',
                'x-type': 'hlfv1'
            };

            component['basic'] = {
                name: 'myProfile',
                description: 'myDescription',
                version: '2.8',
                organisation: 'myOrg',
                mspid: 'myOrg1MSP',
                channel: 'myChannel',
                keyValStore: '/myCredentials'
            };

            component['orderers'] = [{
                url: 'myUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myOrderer'
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
                name: 'myOrderer'
            }];

            component['ordererTimeout'] = '5s';

            component['peers'] = [];

            component['peers'].push({
                name: 'myPeer1',
                url: 'myUrl',
                eventUrl: 'myEventUrl',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer1'
                },
                tlsCACerts: {
                    pem: 'myCert'
                },
            });

            component['peers'].push({
                name: 'myPeer2',
                url: 'myUrl2',
                eventUrl: 'myEventUrl2',
                grpcOptions: {
                    sslTargetNameOverride: 'myPeer2'
                },
                tlsCACerts: {
                    pem: 'myCert2'
                }
            });

            component['peerTimeOut'] = {
                endorser: '5s',
                eventHub: '5s',
                eventReg: '5s'
            };

            component['ca'] = {
                url: 'myUrl',
                caName: 'myCaOrg1',
                tlsCACerts: {
                    pem: 'myCert'
                }
            };

            let profileUpdatedSpy = sinon.spy(component.profileUpdated, 'emit');

            component.profileUpdated.subscribe((data) => {
                data.should.deep.equal({updated: true, connectionProfile: completedProfile});
            });

            let profileOne = {
                name: 'anotherName'
            };

            mockConnectionProfileService.createProfile.returns(Promise.resolve());
            mockConnectionProfileService.getAllProfiles.returns(Promise.resolve([profileOne, completedProfile]));

            component.onSubmit(null);

            tick();

            mockConnectionProfileService.createProfile.should.have.been.calledWith('myProfile', completedProfile);

            mockConnectionProfileService.deleteProfile.should.have.been.calledWith('anotherName');

            component['connectionProfileData'].should.deep.equal(completedProfile);

            profileUpdatedSpy.should.have.been.called;
        }));

        it('should throw error on unknown profile type', fakeAsync(() => {
            component['connectionProfileData'] = {name: 'unknown profile', profile: {type: 'unknown type'}};

            (() => {
                component.onSubmit(null);
            }).should.throw('Unknown profile type');
            tick();
        }));

    });

    describe('openAddCertificateModal', () => {
        it('should open orderers certificate modal', fakeAsync(() => {
            component['orderers'] = [{
                tlsCACerts: {
                    pem: 'myCert'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve('ordererCert_2')
            });

            component.openAddCertificateModal(0, 'orderers');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['orderers'][0].should.deep.equal({
                tlsCACerts: {
                    pem: 'ordererCert_2'
                }
            });
        }));

        it('should open peer certificate modal', fakeAsync(() => {
            component['peers'] = [{
                tlsCACerts: {
                    pem: 'myCert'
                }
            }];

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve('peerCert_2')
            });

            component.openAddCertificateModal(0, 'peers');

            tick();

            mockNgbModal.open.should.have.been.called;

            component['peers'][0].should.deep.equal({
                tlsCACerts: {
                    pem: 'peerCert_2'
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
                result: Promise.resolve('caCert_2')
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

        it('should error on unrecognized type', fakeAsync(() => {

            mockNgbModal.open.returns({
                componentInstance: {},
                result: Promise.resolve()
            });
            component.openAddCertificateModal(0, 'test').then(() => {
                throw new Error('should not get here');
            })
                .catch((error) => {
                    error.message.should.equal('Unrecognized type test');
                });

            tick();

            mockNgbModal.open.should.have.been.called;
        }));

        it('should open orderers certificate modal and handle error', fakeAsync(() => {
            component['orderers'] = [{
                tlsCACerts: {
                    pem: 'myCert'
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
})
;

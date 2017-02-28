import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { ConnectionProfileService } from './connectionprofile.service';
import { WalletService } from './wallet.service';
import { IdentityService } from './identity.service';

import { AdminConnection, BusinessNetworkDefinition } from 'composer-admin';
import { AclFile, ConnectionProfileManager, Logger } from 'composer-common';
import ProxyConnectionManager = require('composer-connector-proxy');
import WebConnectionManager = require('composer-connector-web');

@Injectable()
export class AdminService {

  private adminConnection: AdminConnection = null;
  private isConnected: boolean = false;
  private connectingPromise: Promise<any> = null;
  private initialDeploy: boolean = false;
  private config: any = null;

  public busyStatus$: Subject<string> = new BehaviorSubject<string>(null);
  public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
  public connectionProfileChanged$: Subject<string> = new BehaviorSubject<string>(null);

  constructor(private connectionProfileService: ConnectionProfileService, private walletService: WalletService, private identityService: IdentityService, private http: Http) {
    Logger.setFunctionalLogger({
      log: () => { }
    });
    this.adminConnection = new AdminConnection();
    // The proxy connection manager defaults to http://localhost:15699,
    // but that is not suitable for anything other than development.
    if (ENV && ENV !== 'development') {
      ProxyConnectionManager.setConnectorServerURL(window.location.origin);
    }
    ConnectionProfileManager.registerConnectionManager('hlf', ProxyConnectionManager);
    ConnectionProfileManager.registerConnectionManager('web', WebConnectionManager);
  }

  getAdminConnection(): AdminConnection {
    return this.adminConnection;
  }

  ensureConnected(): Promise<any> {
    if (this.isConnected) {
      return Promise.resolve();
    } else if (this.connectingPromise) {
      return this.connectingPromise;
    }
    let deployed = false;
    let madeItToConnect = false;
    let connectionProfile, userID, userSecret;
    this.busyStatus$.next('Establishing admin connection ...');
    console.log('Establishing admin connection ...');
    this.connectingPromise = Promise.resolve()
      .then(() => {

        // Load the config data.
        return this.http.get('/config.json')
          .map((res:Response) => res.json())
          .toPromise();

      })
      .then((config: any) => {

        // Save the config data.
        this.config = config;

        // Check to see if the default connection profile exists.
        console.log('Checking for $default connection profile');
        return this.adminConnection.getProfile('$default')
          .catch((error) => {
            // It doesn't exist, so create it.
            console.log('$default connection profile does not exist, creating');
            return this.adminConnection.createProfile('$default', { type: 'web' })
              .then(() => {
                return this.walletService.getWallet('$default').add('admin', 'adminpw');
              });
          });

      })
      .then(() => {

        // Create all of the connection profiles specified in the configuration.
        const connectionProfiles = this.config.connectionProfiles || {};
        const connectionProfileNames = Object.keys(connectionProfiles).sort();
        return connectionProfileNames.reduce((result, connectionProfileName) => {
          return result.then(() => {
            console.log('Checking for connection profile', connectionProfileName);
            return this.adminConnection.getProfile(connectionProfileName)
              .catch((error) => {
                console.log('Connection profile does not exist, creating');
                return this.adminConnection.createProfile(connectionProfileName, connectionProfiles[connectionProfileName]);
              })
          })
        }, Promise.resolve());

      })
      .then(() => {

        // Create all of the credentials specified in the configuration.
        const credentials = this.config.credentials || {};
        const connectionProfileNames = Object.keys(credentials).sort();
        return connectionProfileNames.reduce((result, connectionProfileName) => {
          return result.then(() => {
            console.log('Creating credentials for connection profile', connectionProfileName);
            return this.walletService.getWallet(connectionProfileName)
          })
          .then((wallet) => {
            const connectionProfileCredentials = credentials[connectionProfileName];
            const credentialNames = Object.keys(connectionProfileCredentials).sort();
            return credentialNames.reduce((result2, credentialName) => {
              return wallet.get(credentialName)
                .catch((error) => {
                  console.log('Adding credential', credentialName);
                  return wallet.add(credentialName, connectionProfileCredentials[credentialName]);
                });
            }, Promise.resolve());
          })
        }, Promise.resolve());

      })
      .then(() => {

        // If we're in a Docker Compose environment, check to see
        // if the Hyperledger Fabric connection profile exists.
        // TODO: remove once the workshops are out of the way and we can remove this stuff.
        if (DOCKER_COMPOSE) {
          console.log('Docker Compose environment, checking for hlfabric connection profile');
          return this.adminConnection.getProfile('hlfabric')
            .catch((error) => {
              // It doesn't exist, so create it.
              console.log('hlfabric connection profile does not exist, creating');
              return this.adminConnection.createProfile('hlfabric', {
                type: 'hlf',
                keyValStore: '/home/composer/.composer-credentials',
                membershipServicesURL: 'grpc://membersrvc:7054',
                peerURL: 'grpc://vp0:7051',
                eventHubURL: 'grpc://vp0:7053',
                deployWaitTime: 5 * 60,
                invokeWaitTime: 30
              })
              .then(() => {
                return this.walletService.getWallet('hlfabric').add('admin', 'Xurw3yU9zI0l');
              });
            });
        } else {
          console.log('Not in Docker Compose environment, not checking for hlfabric connection profile');
        }

      })
      .then(() => {
        connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        console.log('Connecting to connection profile (w/ business network ID)', connectionProfile);
        return this.identityService.getUserID()
          .then((userID_) => {
            userID = userID_;
            return this.identityService.getUserSecret();
          })
          .then((userSecret_) => {
            userSecret = userSecret_;
            madeItToConnect = true;
            return this.adminConnection.connect(connectionProfile, userID, userSecret, 'org.acme.biznet');
          });
      })
      .catch((error) => {
        // If we didn't make it to connect, then the business network is probably not deployed.
        // Try again with a admin connection with no business network specified so we can deploy it.
        if (!madeItToConnect) {
          throw error;
        }
        console.log('Connecting to connection profile (w/o business network ID)', connectionProfile);
        return this.adminConnection.connect(connectionProfile, userID, userSecret)
          .then(() => {
            return this.adminConnection.list()
          })
          .then((businessNetworks) => {
            console.log('Got business networks', businessNetworks);
            deployed = businessNetworks.some((businessNetwork) => {
              return businessNetwork === 'org.acme.biznet';
            });
            if (!deployed) {
              this.busyStatus$.next('Deploying sample business network ...');
              console.log('Deploying sample business network');
              let businessNetworkDefinition = this.generateDefaultBusinessNetwork();
              return this.adminConnection.deploy(businessNetworkDefinition)
                .then(() => {
                  this.initialDeploy = true;
                });
            }
          })
          .then(() => {
            return this.adminConnection.disconnect();
          })
          .then(() => {
            console.log('Connecting to connection profile (w/ business network ID)', connectionProfile);
            return this.adminConnection.connect(connectionProfile, userID, userSecret, 'org.acme.biznet');
          })
      })
      .then(() => {
        // this.busyStatus$.next(null);
        console.log('Connected');
        this.isConnected = true;
        this.connectingPromise = null;
      })
      .catch((error) => {
        this.busyStatus$.next(`Failed to connect: ${error}`);
        this.isConnected = false;
        this.connectingPromise = null;
        throw error;
      })
      return this.connectingPromise;
  }

  deploy(businessNetworkDefinition: BusinessNetworkDefinition): Promise<any> {
    return this.ensureConnected()
      .then(() => {
        return this.adminConnection.deploy(businessNetworkDefinition);
      });
  }

  update(businessNetworkDefinition: BusinessNetworkDefinition): Promise<any> {
    return this.ensureConnected()
      .then(() => {
        return this.adminConnection.update(businessNetworkDefinition);
      });
  }

  generateDefaultBusinessNetwork(): BusinessNetworkDefinition {
    let businessNetworkDefinition = new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network');
    return businessNetworkDefinition;
  }

  isInitialDeploy(): boolean {
    let result = this.initialDeploy;
    this.initialDeploy = false;
    return result;
  }
}

import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs/Rx';

import {AdminService} from './admin.service';
import {ConnectionProfileService} from './connectionprofile.service';
import {IdentityService} from '../identity.service';
import {AlertService} from './alert.service'

import {BusinessNetworkConnection} from 'composer-client';
import {BusinessNetworkDefinition, Util, ModelFile, Script, AclFile} from 'composer-common';

@Injectable()
export class ClientService {

  private businessNetworkConnection: BusinessNetworkConnection = null;
  private isConnected: boolean = false;
  private connectingPromise: Promise<any> = null;

  public businessNetworkChanged$: Subject<boolean> = new BehaviorSubject<boolean>(null);

  private currentBusinessNetwork: BusinessNetworkDefinition = null;

  constructor(private adminService: AdminService,
              private connectionProfileService: ConnectionProfileService,
              private identityService: IdentityService,
              private alertService: AlertService) {
  }

  //horrible hack for testing
  createModelFile(modelManager, content) {
    return new ModelFile(modelManager, content);
  }

  //horrible hack for testing
  createAclFile(id, modelManager, content) {
    return new AclFile(id, modelManager, content);
  }

  //horrible hack for tests
  createBusinessNetwork(identifier, description, packageJson, readme) {
    return new BusinessNetworkDefinition(identifier, description, packageJson, readme);
  }


  getBusinessNetworkConnection(): BusinessNetworkConnection {
    if (!this.businessNetworkConnection) {
      this.businessNetworkConnection = new BusinessNetworkConnection();
    }
    return this.businessNetworkConnection;
  }

  getBusinessNetwork(): BusinessNetworkDefinition {
    if (!this.currentBusinessNetwork) {
      this.currentBusinessNetwork = this.getBusinessNetworkConnection().getBusinessNetwork();
    }

    return this.currentBusinessNetwork;
  }

  getModelFile(id: string): ModelFile {
    return this.getBusinessNetwork().getModelManager().getModelFile(id);
  }

  getModelFiles(): ModelFile[] {
    return this.getBusinessNetwork().getModelManager().getModelFiles();
  }

  updateFile(id: string, content: any, type: string): string {
    try {
      if (type === 'model') {
        let modelManager = this.getBusinessNetwork().getModelManager();
        let modelFile = this.createModelFile(modelManager, content);
        if (id !== modelFile.getNamespace()) {
          throw new Error(`The namespace cannot be changed and must be set to ${id}`);
        }
        modelManager.addModelFile(modelFile);
      } else if (type === 'script') {
        let scriptManager = this.getBusinessNetwork().getScriptManager();
        let script = scriptManager.createScript(id, 'JS', content);
        scriptManager.addScript(script);
      } else if (type === 'acl') {
        let aclManager = this.getBusinessNetwork().getAclManager();
        let modelManager = this.getBusinessNetwork().getModelManager();
        let aclFile = this.createAclFile(id, modelManager, content);
        aclManager.setAclFile(aclFile);
      }

      this.businessNetworkChanged$.next(true);
      return null;
    } catch (e) {
      this.businessNetworkChanged$.next(false);
      return e.toString();
    }
  }

  getScriptFile(id: string): Script {
    return this.getBusinessNetwork().getScriptManager().getScript(id);
  }

  getScripts(): Script[] {
    return this.getBusinessNetwork().getScriptManager().getScripts();
  }

  getAclFile(): AclFile {
    return this.getBusinessNetwork().getAclManager().getAclFile();
  }

  getMetaData() {
    return this.getBusinessNetwork().getMetadata();
  }

  setBusinessNetworkName(name: string) {
    let version = this.getBusinessNetwork().getMetadata().getVersion();
    let description = this.getBusinessNetwork().getMetadata().getDescription();
    let packageJson = this.getBusinessNetwork().getMetadata().getPackageJson();
    let readme = this.getBusinessNetwork().getMetadata().getREADME();

    //need to update the name in the package json
    packageJson.name = name;

    this.createNewBusinessNetwork(name, version, description, packageJson, readme);
  }

  getBusinessNetworkName() {
    return this.getBusinessNetwork().getMetadata().getName();
  }

  setBusinessNetworkVersion(version: string) {
    let name = this.getBusinessNetwork().getMetadata().getName();
    let description = this.getBusinessNetwork().getMetadata().getDescription();
    let packageJson = this.getBusinessNetwork().getMetadata().getPackageJson();
    let readme = this.getBusinessNetwork().getMetadata().getREADME();

    //need to update the version in the packageJson
    packageJson.version = version;

    this.createNewBusinessNetwork(name, version, description, packageJson, readme);
  }

  setBusinessNetworkPackageJson(packageJson: any) {
    //if we have updated package json we should take the values in there for the name etc
    let name = packageJson.name;
    let version = packageJson.version;
    let description = packageJson.description;
    let readme = this.getBusinessNetwork().getMetadata().getREADME();

    this.createNewBusinessNetwork(name, version, description, packageJson, readme);

  }

  private createNewBusinessNetwork(name, version, description, packageJson, readme) {
    let oldBusinessNetwork = this.getBusinessNetwork();

    this.currentBusinessNetwork = this.createBusinessNetwork(name + '@' + version, description, packageJson, readme);
    this.currentBusinessNetwork.getModelManager().addModelFiles(oldBusinessNetwork.getModelManager().getModelFiles());

    oldBusinessNetwork.getScriptManager().getScripts().forEach((script) => {
      this.currentBusinessNetwork.getScriptManager().addScript(script);
    });

    this.currentBusinessNetwork.getAclManager().setAclFile(oldBusinessNetwork.getAclManager().getAclFile());
    this.businessNetworkChanged$.next(true);
  }

  ensureConnected(): Promise<any> {
    if (this.isConnected) {
      return Promise.resolve();
    } else if (this.connectingPromise) {
      return this.connectingPromise;
    }
    let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
    this.alertService.busyStatus$.next('Establishing client connection ...');
    console.log('Connecting to connection profile', connectionProfile);
    let userID;
    this.connectingPromise = this.adminService.ensureConnected()
      .then(() => {
        return this.identityService.getUserID();
      })
      .then((userID_) => {
        userID = userID_;
        return this.identityService.getUserSecret();
      })
      .then((userSecret) => {
        return this.getBusinessNetworkConnection().connect(connectionProfile, 'org.acme.biznet', userID, userSecret)
      })
      .then(() => {
        // this.busyStatus$.next(null);
        console.log('Connected');
        this.isConnected = true;
        this.connectingPromise = null;
      })
      .catch((error) => {
        this.alertService.busyStatus$.next(`Failed to connect: ${error}`);
        this.isConnected = false;
        this.connectingPromise = null;
        throw error;
      });
    return this.connectingPromise;
  }

  reset(): Promise<any> {
    return this.ensureConnected()
      .then(() => {
        // TODO: hack hack hack, this should be in the admin API.
        return Util.invokeChainCode((<any>(this.getBusinessNetworkConnection())).securityContext, 'resetBusinessNetwork', []);
      });
  }

  refresh(): Promise<any> {
    this.currentBusinessNetwork = null;
    let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
    let userID;
    return this.getBusinessNetworkConnection().disconnect()
      .then(() => {
        return this.identityService.getUserID();
      })
      .then((userID_) => {
        userID = userID_;
        return this.identityService.getUserSecret();
      })
      .then((userSecret) => {
        return this.getBusinessNetworkConnection().connect(connectionProfile, 'org.acme.biznet', userID, userSecret)
      });
  }

}

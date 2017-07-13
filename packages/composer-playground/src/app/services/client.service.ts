import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs/Rx';
import { LocalStorageService } from 'angular-2-local-storage';

import { AdminService } from './admin.service';
import { ConnectionProfileService } from './connectionprofile.service';
import { IdentityService } from './identity.service';
import { AlertService } from '../basic-modals/alert.service';

import { BusinessNetworkConnection } from 'composer-client';
import { BusinessNetworkDefinition, Util, ModelFile, Script, AclFile, QueryFile } from 'composer-common';

/* tslint:disable-next-line:no-var-requires */
const sampleBusinessNetworkArchive = require('basic-sample-network/dist/basic-sample-network.bna');

@Injectable()
export class ClientService {
    public businessNetworkChanged$: Subject<boolean> = new BehaviorSubject<boolean>(null);
    public namespaceChanged$: Subject<string> = new BehaviorSubject<string>(null);

    private businessNetworkConnection: BusinessNetworkConnection = null;
    private isConnected: boolean = false;
    private connectingPromise: Promise<any> = null;

    private currentBusinessNetwork: BusinessNetworkDefinition = null;

    constructor(private adminService: AdminService,
                private connectionProfileService: ConnectionProfileService,
                private identityService: IdentityService,
                private alertService: AlertService,
                private localStorageService: LocalStorageService) {
    }

    // horrible hack for tests
    createModelFile(content, fileName) {
        return new ModelFile(this.getBusinessNetwork().getModelManager(), content, fileName);
    }

    // horrible hack for tests
    createAclFile(id, content) {
        return new AclFile(id, this.getBusinessNetwork().getModelManager(), content);
    }

    // horrible hack for tests
    createScriptFile(id, type, content) {
        return this.getBusinessNetwork().getScriptManager().createScript(id, type, content);
    }

    // horrible hack for tests
    createQueryFile(id, content) {
      return new QueryFile(id, this.getBusinessNetwork().getModelManager(), content);
    }

    // horrible hack for tests
    createBusinessNetwork(identifier, description, packageJson, readme) {
        return new BusinessNetworkDefinition(identifier, description, packageJson, readme);
    }

    // horrible hack for tests
    createBusinessNetworkConnection() {
        return new BusinessNetworkConnection();
    }

    getBusinessNetworkConnection(): BusinessNetworkConnection {
        if (!this.businessNetworkConnection) {
            this.businessNetworkConnection = this.createBusinessNetworkConnection();
        }
        return this.businessNetworkConnection;
    }

    getBusinessNetwork(): BusinessNetworkDefinition {
        if (!this.currentBusinessNetwork) {
            this.currentBusinessNetwork = this.getBusinessNetworkConnection().getBusinessNetwork();
        }

        return this.currentBusinessNetwork;
    }

    getBusinessNetworkName() {
        return this.getBusinessNetwork().getMetadata().getName();
    }

    getModelFile(id: string): ModelFile {
        return this.getBusinessNetwork().getModelManager().getModelFile(id);
    }

    getModelFiles(): ModelFile[] {
        return this.getBusinessNetwork().getModelManager().getModelFiles();
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

    getQueryFile(): QueryFile {
        return this.getBusinessNetwork().getQueryManager().getQueryFile();
    }

    getMetaData() {
        return this.getBusinessNetwork().getMetadata();
    }

    validateFile(id: string, content: any, type: string): string {
        try {
            if (type === 'model') {
                let modelFile = this.createModelFile(content, null);
                this.getBusinessNetwork().getModelManager().validateModelFile(modelFile);
            } else if (type === 'script') {
                this.createScriptFile(id, 'JS', content);
            } else if (type === 'acl') {
                let aclFile = this.createAclFile(id, content);
                aclFile.validate();
            } else if (type === 'query') {
                let queryFile = this.createQueryFile(id, content);
                queryFile.validate();
            }
            return null;
        } catch (e) {
            return e.toString();
        }
    }

    updateFile(id: string, content: any, type: string): string {
        try {
            if (type === 'model') {
                let modelManager = this.getBusinessNetwork().getModelManager();
                let original: ModelFile = modelManager.getModelFile(id);
                let modelFile = this.createModelFile(content, original.getName());
                if (this.modelNamespaceCollides(modelFile.getNamespace(), id)) {
                    throw new Error(`The namespace collides with existing model namespace ${modelFile.getNamespace()}`);
                }
                if (id !== modelFile.getNamespace()) {
                    // Then we are changing namespace and must delete old reference
                    modelManager.addModelFile(modelFile);
                    modelManager.deleteModelFile(id);
                    this.namespaceChanged$.next(modelFile.getNamespace());
                } else {
                    modelManager.updateModelFile(modelFile);
                }
            } else if (type === 'script') {
                let script = this.createScriptFile(id, 'JS', content);
                this.getBusinessNetwork().getScriptManager().addScript(script);
            } else if (type === 'acl') {
                let aclFile = this.createAclFile(id, content);
                this.getBusinessNetwork().getAclManager().setAclFile(aclFile);
            } else if (type === 'query') {
                let query = this.createQueryFile(id, content);
                this.getBusinessNetwork().getQueryManager().setQueryFile(query);
            }

            this.businessNetworkChanged$.next(true);
            return null;
        } catch (e) {
            this.businessNetworkChanged$.next(false);
            return e.toString();
        }
    }

    replaceFile(oldId: string, newId: string, content: any, type: string): string {
        try {
            if (type === 'model') {
                let modelFile = this.createModelFile(content, newId);
                this.getBusinessNetwork().getModelManager().updateModelFile(modelFile, newId);
                this.businessNetworkChanged$.next(true);
            } else if (type === 'script') {
                let script = this.createScriptFile(newId, 'JS', content);
                this.getBusinessNetwork().getScriptManager().addScript(script);
                this.getBusinessNetwork().getScriptManager().deleteScript(oldId);
                this.businessNetworkChanged$.next(true);
            }
            return null;
        } catch (e) {
            this.businessNetworkChanged$.next(false);
            return e.toString();
        }
    }

    modelNamespaceCollides(newNamespace, previousNamespace): boolean {
        let allModelFiles = this.currentBusinessNetwork.getModelManager().getModelFiles();
        if ((newNamespace !== previousNamespace) && (allModelFiles.findIndex((model) => model.getNamespace() === newNamespace) !== -1)) {
            return true;
        } else {
            return false;
        }
    }

    setBusinessNetworkReadme(readme) {
        this.getBusinessNetwork().setReadme(readme);
        this.businessNetworkChanged$.next(true);
    }

    setBusinessNetworkVersion(version: string) {
        let packageJson = this.getBusinessNetwork().getMetadata().getPackageJson();
        packageJson.version = version;
        this.getBusinessNetwork().setPackageJson(packageJson);
        this.businessNetworkChanged$.next(true);
    }

    setBusinessNetworkPackageJson(packageJson: any) {
        // prevent BND name change
        if (packageJson.name !== this.getBusinessNetworkName()) {
            throw new Error('Unsupported attempt to update Business Network Name.');
        } else {
            this.getBusinessNetwork().setPackageJson(packageJson);
            this.businessNetworkChanged$.next(true);
        }
    }

    ensureConnected(name: string = null, force: boolean = false): Promise<any> {
        if (this.isConnected && !force) {
            return Promise.resolve();
        } else if (this.connectingPromise) {
            return this.connectingPromise;
        }

        let businessNetworkName: string;
        let userId;
        this.connectingPromise = this.identityService.getUserID()
            .then((userID) => {
                userId = userID;
                if (!name) {
                    try {
                        businessNetworkName = this.getBusinessNetworkName();
                    } catch (error) {
                        console.log('business network name not set yet so using from local storage');
                    } finally {
                        if (!businessNetworkName) {
                            businessNetworkName = this.getSavedBusinessNetworkName(userId);
                        }
                    }
                } else {
                    businessNetworkName = name;
                }

                let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
                this.alertService.busyStatus$.next({
                    title: 'Establishing connection',
                    text: 'Using the connection profile ' + connectionProfile
                });
                console.log('Connecting to connection profile', connectionProfile);
                return this.adminService.connect(businessNetworkName, force);
            })
            .then(() => {
                return this.refresh(businessNetworkName);
            })
            .then(() => {
                console.log('connected');
                this.isConnected = true;
                this.connectingPromise = null;
                this.setSavedBusinessNetworkName(userId);
                this.alertService.busyStatus$.next(null);
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                this.isConnected = false;
                this.connectingPromise = null;
                throw error;
            });
        return this.connectingPromise;
    }

    reset(): Promise<any> {
        // TODO: hack hack hack, this should be in the admin API.
        return Util.invokeChainCode((<any> (this.getBusinessNetworkConnection())).securityContext, 'resetBusinessNetwork', []);
    }

    refresh(businessNetworkName): Promise<any> {
        this.currentBusinessNetwork = null;
        let connectionProfile = this.connectionProfileService.getCurrentConnectionProfile();
        this.alertService.busyStatus$.next({
            title: 'Refreshing Connection',
            text: 'refreshing the connection to ' + connectionProfile
        });
        let userID;
        return this.getBusinessNetworkConnection().disconnect()
            .then(() => {
                return this.identityService.getUserID();
            })
            .then((userId) => {
                userID = userId;
                return this.identityService.getUserSecret();
            })
            .then((userSecret) => {
                return this.getBusinessNetworkConnection().connect(connectionProfile, businessNetworkName, userID, userSecret);
            });
    }

    public disconnect() {
        this.isConnected = false;
        this.adminService.disconnect();
        return this.getBusinessNetworkConnection().disconnect();
    }

    public getBusinessNetworkFromArchive(buffer): Promise<BusinessNetworkDefinition> {
        return BusinessNetworkDefinition.fromArchive(buffer);
    }

    deployInitialSample(): Promise<any> {
        this.alertService.busyStatus$.next({
            title: 'Deploying Business Network',
            text: 'deploying sample business network'
        });

        let businessNetwork: BusinessNetworkDefinition;
        return BusinessNetworkDefinition.fromArchive(sampleBusinessNetworkArchive)
            .then((sampleBusinessNetworkDefinition) => {
                businessNetwork = sampleBusinessNetworkDefinition;
                return this.adminService.createNewBusinessNetwork(businessNetwork.getName(), businessNetwork.getDescription())
                    .catch((error) => {
                        // if it already exists we just carry on otherwise we need to throw the error that happened
                        if (error.message !== 'businessNetwork with name ' + businessNetwork.getName() + ' already exists') {
                            throw error;
                        }
                    });
            })
            .then(() => {
                if (this.adminService.isInitialDeploy()) {
                    return this.adminService.update(businessNetwork);
                }
            })
            .then(() => {
                return this.getBusinessNetworkConnection().disconnect();
            })
            .then(() => {
                return this.getBusinessNetworkConnection().connect('$default', businessNetwork.getName(), 'admin', 'adminpw');
            })
            .then(() => {
                return this.reset();
            })
            .catch((error) => {
                this.alertService.busyStatus$.next(null);
                throw error;
            });
    }

    issueIdentity(userID, participantFQI, options): Promise<string> {
        let connectionProfileName = this.connectionProfileService.getCurrentConnectionProfile();

        return this.connectionProfileService.getProfile(connectionProfileName)
            .then((connectionProfile) => {
                ['membershipServicesURL', 'peerURL', 'eventHubURL'].forEach((url) => {
                    if (connectionProfile[url] && connectionProfile[url].match(/\.blockchain\.ibm\.com/)) {
                        // Smells like Bluemix with their non-default affiliations.
                        options.affiliation = 'group1';
                    }
                });

                return this.getBusinessNetworkConnection().issueIdentity(participantFQI, userID, options);
            });
    }

    revokeIdentity(userID: string) {
        return this.getBusinessNetworkConnection().revokeIdentity(userID);
    }

    filterModelFiles(files) {
        return files.filter((model) => {
                return !model.isSystemModelFile();
            });
    }

    private getSavedBusinessNetworkName(identity: string): string {
        let key = `currentBusinessNetwork:${identity}`;
        return this.localStorageService.get<string>(key);
    }

    private setSavedBusinessNetworkName(identity: string): void {
        let key = `currentBusinessNetwork:${identity}`;
        this.localStorageService.set(key, this.getBusinessNetworkName());
    }
}

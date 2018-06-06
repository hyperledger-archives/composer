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
import { Injectable } from '@angular/core';
import { EditorFile } from './editor-file';
import { ModelFile, AclFile, QueryFile, Script, BusinessNetworkDefinition } from 'composer-common';
import { ClientService } from './client.service';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { sortBy } from 'lodash';
import * as semver from 'semver';

@Injectable()
export class FileService {
    public namespaceChanged$: Subject<string> = new BehaviorSubject<string>(null);
    public businessNetworkChanged$: Subject<boolean> = new BehaviorSubject<boolean>(null);

    private readMe: EditorFile = null;
    private packageJson: EditorFile = null;
    private modelFiles: Map<string, EditorFile> = new Map<string, EditorFile>();
    private scriptFiles: Map<string, EditorFile> = new Map<string, EditorFile>();
    private aclFile: EditorFile = null;
    private queryFile: EditorFile = null;

    private dirty: Boolean = false;

    private currentFile: any = null;

    private currentBusinessNetwork: BusinessNetworkDefinition;

    constructor(private clientService: ClientService) {
    }

    // horrible hack for tests
    createModelFile(content, fileName) {
        return new ModelFile(this.currentBusinessNetwork.getModelManager(), content, fileName);
    }

    getModelFile(id: string): ModelFile {
        return this.currentBusinessNetwork.getModelManager().getModelFile(id);
    }

    // horrible hack for tests
    createAclFile(id, content) {
        return new AclFile(id, this.currentBusinessNetwork.getModelManager(), content);
    }

    // horrible hack for tests
    createScriptFile(id, type, content) {
        return this.currentBusinessNetwork.getScriptManager().createScript(id, type, content);
    }

    getScriptFile(id: string): Script {
        return this.currentBusinessNetwork.getScriptManager().getScript(id);
    }

    // horrible hack for tests
    createQueryFile(id, content) {
        return new QueryFile(id, this.currentBusinessNetwork.getModelManager(), content);
    }

    loadFiles() {
        this.deleteAllFiles();

        this.currentBusinessNetwork = this.clientService.getBusinessNetwork();

        let modelFiles = this.getModelFiles(false);
        modelFiles.forEach((modelFile) => {
            this.addFile(modelFile.getNamespace(), modelFile.getName(), modelFile.getDefinitions(), 'model');
        });

        let scriptFiles = this.getScripts();
        scriptFiles.forEach((scriptFile) => {
            this.addFile(scriptFile.getIdentifier(), scriptFile.getIdentifier(), scriptFile.getContents(), 'script');
        });

        let aclFile = this.getAclFile();
        if (aclFile) {
            this.addFile(aclFile.getIdentifier(), aclFile.getIdentifier(), aclFile.getDefinitions(), 'acl');
        }

        let queryFile = this.getQueryFile();
        if (queryFile) {
            this.addFile(queryFile.getIdentifier(), queryFile.getIdentifier(), queryFile.getDefinitions(), 'query');
        }

        // deal with readme
        let readme = this.getMetaData().getREADME();
        if (readme) {
            this.addFile('readme', 'README.md', readme, 'readme');
        }

        let packageJson = this.getMetaData().getPackageJson();
        if (packageJson) {
            this.addFile('package', 'package.json', JSON.stringify(packageJson, null, 2), 'package');
        }

        let allFiles = this.getEditorFiles();

        // check if we have changed the business network or just switch tabs
        if (this.currentFile) {
            let foundFile = allFiles.find((file) => {
                return file.getType() === this.currentFile.getType() && file.getContent() === this.currentFile.getContent() && file.getId() === this.currentFile.getId();
            });

            if (!foundFile) {
                this.currentFile = null;
            }
        }

        this.dirty = false;
        return allFiles;
    }

    getFile(id: string, type: string): EditorFile {
        let file: EditorFile;
        switch (type) {
            // Deal with the addition of a model file.
            case 'model':
                file = this.modelFiles.get(id);
                break;
            // Deal with the addition of a script file.
            case 'script':
                file = this.scriptFiles.get(id);
                break;
            // Deal with the addition of a query file.
            case 'query':
                file = this.queryFile;
                break;
            // Deal with the addition of an acl file.
            case 'acl':
                file = this.aclFile;
                break;
            // Deal with the addition of a readme file.
            case 'readme':
                file = this.readMe;
                break;
            // Deal with the addition of a package file.
            case 'package':
                file = this.packageJson;
                break;
            default:
                throw new Error('Type passed must be one of readme, acl, query, script, model or packageJson');
        }
        return file;
    }

    getEditorReadMe(): EditorFile {
        return this.readMe;
    }

    getEditorModelFiles(): Array<EditorFile> {
        let files = [];
        this.modelFiles.forEach((editorFile: EditorFile, id: string) => {
            files.push(editorFile);
        });

        files = sortBy(files, ['displayID']);

        return files;
    }

    getEditorScriptFiles(): Array<EditorFile> {
        let files = [];
        this.scriptFiles.forEach((editorFile: EditorFile, id: string) => {
            files.push(editorFile);
        });

        return files;
    }

    getEditorAclFile(): EditorFile {
        return this.aclFile;
    }

    getEditorQueryFile(): EditorFile {
        return this.queryFile;
    }

    getEditorPackageFile(): EditorFile {
        return this.packageJson;
    }

    getEditorFiles(): Array<EditorFile> {
        let files = [];

        if (this.getEditorReadMe() !== null) {
            files.push(this.getEditorReadMe());
        }
        if (this.getEditorPackageFile() !== null) {
            files.push(this.getEditorPackageFile());
        }

        files = files.concat(this.getEditorModelFiles());
        files = files.concat(this.getEditorScriptFiles());
        if (this.getEditorAclFile() !== null) {
            files.push(this.getEditorAclFile());
        }
        if (this.getEditorQueryFile() !== null) {
            files.push(this.getEditorQueryFile());
        }

        return files;
    }

    // Handle the addition of a new file.
    addFile(id: string, displayID: string, content: string, type: string): EditorFile {
        let file = new EditorFile(id, displayID, content, type);
        switch (type) {
            // Deal with the addition of a model file.
            case 'model':
                if (this.modelFiles.has(id)) {
                    throw new Error('FileService already contains model file with ID: ' + id);
                } else {
                    this.modelFiles.set(id, file);
                }
                break;
            // Deal with the addition of a script file.
            case 'script':
                if (this.scriptFiles.has(id)) {
                    throw new Error('FileService already contains script file with ID: ' + id);
                } else {
                    this.scriptFiles.set(id, file);
                }
                break;
            // Deal with the addition of a query file.
            case 'query':
                if (this.getEditorQueryFile() !== null) {
                    throw new Error('FileService already contains a query file');
                } else {
                    this.queryFile = file;
                }
                break;
            // Deal with the addition of an acl file.
            case 'acl':
                if (this.getEditorAclFile() !== null) {
                    throw new Error('FileService already contains an acl file');
                } else {
                    this.aclFile = file;
                }
                break;
            // Deal with the addition of a readme file.
            case 'readme':
                if (this.getEditorReadMe() !== null) {
                    throw new Error('FileService already contains a readme file');
                } else {
                    this.readMe = file;
                }
                break;
            case 'package':
                if (this.getEditorPackageFile() !== null) {
                    throw new Error('FileService already contains a package.json file');
                } else {
                    this.packageJson = file;
                }
                break;
            default:
                throw new Error('Attempted addition of unknown file type: ' + type);
        }
        this.dirty = true;

        return file;
    }

    // Handle the update of a file.
    updateFile(id: string, content: string, type: string): EditorFile {
        let updatedFile: EditorFile;
        let validationError;
        switch (type) {
            // Deal with the update of a model file.
            case 'model':
                if (!this.modelFiles.has(id)) {
                    throw new Error('File does not exist of type ' + type + ' and id ' + id);
                }

                // update the content first incase something goes wrong later
                let updatedModelFile = this.modelFiles.get(id);
                updatedModelFile.setContent(content);
                updatedFile = updatedModelFile;

                let original: ModelFile = this.getModelFile(id);
                if (original) {
                    let modelFile = this.createModelFile(content, original.getName());
                    validationError = this.validateFile(id, type);
                    if (validationError) {
                      throw new Error(validationError);
                    }

                    if (this.modelNamespaceCollides(modelFile.getNamespace(), id)) {
                        // don't want it to replace the files as want the error to happen
                        return updatedFile;
                    }
                    if (id !== modelFile.getNamespace()) {
                        // Then we are changing namespace and must delete old reference
                        this.deleteFile(id, 'model');
                        updatedFile = this.addFile(modelFile.getNamespace(), modelFile.getName(), modelFile.getDefinitions(), 'model');
                    }
                }
                break;
            // Deal with the update of a script file.
            case 'script':
                if (!this.scriptFiles.has(id)) {
                    throw new Error('File does not exist of type ' + type + ' and id ' + id);
                }
                let updatedScriptFile = this.scriptFiles.get(id);
                updatedScriptFile.setContent(content);
                updatedFile = updatedScriptFile;
                validationError = this.validateFile(id, type);
                if (validationError) {
                  throw new Error(validationError);
                }
                break;
            // Deal with the update of a query file.
            case 'query':
                if (this.queryFile === null) {
                    throw new Error('Query file does not exist in file service');
                }
                this.queryFile.setContent(content);
                updatedFile = this.queryFile;
                validationError = this.validateFile(id, type);
                if (validationError) {
                  throw new Error(validationError);
                }
                break;
            // Deal with the update of an acl file.
            case 'acl':
                if (this.aclFile === null) {
                    throw new Error('Acl file does not exist in file service');
                }
                this.aclFile.setContent(content);
                updatedFile = this.aclFile;
                validationError = this.validateFile(id, type);
                if (validationError) {
                  throw new Error(validationError);
                }
                break;
            // Deal with the update of a readme file.
            case 'readme':
                if (this.readMe === null) {
                    throw new Error('ReadMe file does not exist in file service');
                }
                this.readMe.setContent(content);
                updatedFile = this.readMe;
                break;
            // Deal with the update of a package file.
            case 'package':
                if (this.packageJson === null) {
                    throw new Error('PackageJson file does not exist in file service');
                }
                this.packageJson.setContent(content);
                updatedFile = this.packageJson;
                validationError = this.validateFile(id, type);
                if (validationError) {
                  throw new Error(validationError);
                }
                break;
            default:
                throw new Error('Attempted update of unknown file type: ' + type);
        }
        this.dirty = true;

        return updatedFile;
    }

    // Handle the update of the package version
    updateBusinessNetworkVersion(version: string) {
        let packageJsonContent = JSON.parse(this.packageJson.getContent());
        packageJsonContent.version = version;

        return this.updateFile(this.packageJson.getId(), JSON.stringify(packageJsonContent, null, 2), this.packageJson.getType());
    }

    // Handle package version bump
    incrementBusinessNetworkVersion() {
        let packageJsonContent = JSON.parse(this.packageJson.getContent());

        packageJsonContent.version = semver.inc(packageJsonContent.version, 'prerelease', 'deploy');

        this.packageJson.setJsonContent(packageJsonContent);
        this.businessNetworkChanged$.next(true);
    }

    // Handle the deletion of a file.
    deleteFile(id: string, type: string) {
        switch (type) {
            // Deal with the deletion of a model file.
            case 'model':
                this.modelFiles.delete(id);
                break;
            // Deal with the deletion of a script file.
            case 'script':
                this.scriptFiles.delete(id);
                break;
            // Deal with the deletion of a query file.
            case 'query':
                this.queryFile = null;
                break;
            // Deal with the deletion of an acl file.
            case 'acl':
                this.aclFile = null;
                break;
            // Deal with the deletion of a readme file.
            case 'readme':
                this.readMe = null;
                break;
            // Deal with the deletion of a package file.
            case 'package':
                this.packageJson = null;
                break;
            default:
                throw new Error('Attempted deletion of file unknown type: ' + type);
        }

        if (this.currentFile && this.currentFile.id === id) {
            this.currentFile = null;
        }

        this.dirty = true;
    }

    deleteAllFiles() {
        this.modelFiles.clear();
        this.scriptFiles.clear();
        this.queryFile = null;
        this.aclFile = null;
        this.readMe = null;
        this.packageJson = null;

        this.currentFile = null;

        this.dirty = true;
    }

    replaceFile(oldId: string, newId: string, content: string, type: string): EditorFile {
        switch (type) {
            case 'model':
                if (!this.modelFiles.has(oldId)) {
                    throw new Error('There is no existing file of type ' + type + ' with the id ' + oldId);
                }
                if (this.modelFiles.has(newId)) {
                    throw new Error('There is an existing file of type ' + type + ' with the id ' + oldId);
                }
                let modelFile;
                try {
                    modelFile = this.createModelFile(this.getFile(oldId, 'model').getContent(), newId);
                    this.deleteFile(oldId, 'model');
                    this.addFile(modelFile.getNamespace(), modelFile.getName(), modelFile.getDefinitions(), 'model');
                    this.dirty = true;
                    return this.getFile(modelFile.getNamespace(), 'model');
                } catch (err) {
                    try {
                        modelFile = this.createModelFile(content, newId); // current contents must be invalid so use old ones so we can have namespace
                        let actualContent = this.getFile(oldId, 'model').getContent();
                        this.deleteFile(oldId, 'model');
                        this.addFile(modelFile.getNamespace(), modelFile.getName(), actualContent, 'model');
                        this.dirty = true;
                        return this.getFile(modelFile.getNamespace(), 'model');
                    } catch (err) {
                        throw new Error(err);
                    }
                }
            case 'script':
                if (!this.scriptFiles.has(oldId)) {
                    throw new Error('There is no existing file of type ' + type + ' with the id ' + oldId);
                }
                if (this.scriptFiles.has(newId)) {
                    throw new Error('There is an existing file of type ' + type + ' with the id ' + oldId);
                }
                this.addFile(newId, newId, this.getFile(oldId, 'script').getContent(), 'script');
                this.deleteFile(oldId, 'script');
                this.dirty = true;
                return this.getFile(newId, 'script');
            default:
                throw new Error('Attempted replace of ununsupported file type: ' + type);
        }
    }

    // Validate a file.
    validateFile(id: string, type: string): string {
        try {
            switch (type) {
                case 'model':
                    let modelFile = this.modelFiles.get(id);
                    let modelManager = this.currentBusinessNetwork.getModelManager();
                    modelFile.validate(modelManager);
                    let original: ModelFile = modelManager.getModelFile(id);

                    if (original) {
                        let newModelFile = this.createModelFile(modelFile.getContent(), original.getName());
                        if (this.modelNamespaceCollides(newModelFile.getNamespace(), id)) {
                            throw new Error(`The namespace collides with existing model namespace ${newModelFile.getNamespace()}`);
                        }
                    }
                    break;
                case 'script':
                    let scriptFile = this.scriptFiles.get(id);
                    scriptFile.validate(this.currentBusinessNetwork.getModelManager());
                    break;
                case 'acl':
                    this.aclFile.validate(this.currentBusinessNetwork.getModelManager());
                    break;
                case 'query':
                    this.queryFile.validate(this.currentBusinessNetwork.getModelManager());
                    break;
                case 'package':
                    let packageJsonContent = JSON.parse(this.packageJson.getContent());
                    if (packageJsonContent.name !== this.getBusinessNetworkName()) {
                        throw new Error('Unsupported attempt to update Business Network Name.');
                    }

                    const deployedVersion = this.clientService.getDeployedBusinessNetworkVersion();
                    if (semver.gt(deployedVersion, packageJsonContent.version)) {
                        throw new Error('A more recent version of the Business Network has already been deployed.');
                    } else if (deployedVersion === packageJsonContent.version) {
                        throw new Error('The Business Network has already been deployed at the current version.');
                    }
                    break;
                default:
                    throw new Error('Attempted validation of unknown file of type: ' + type);
            }
            return null;
        } catch (e) {
            return e;
        }
    }

    updateBusinessNetwork(oldId: string, editorFile: EditorFile) {
        if (editorFile.isModel()) {
            if (this.getModelFile(oldId)) {
                this.updateBusinessNetworkFile(oldId, editorFile.getContent(), editorFile.getType());
            } else {
                this.currentBusinessNetwork.getModelManager().addModelFile(editorFile.getContent(), editorFile.getDisplayId());
            }
        } else if (editorFile.isAcl()) {
            if (this.getAclFile()) {
                this.updateBusinessNetworkFile(oldId, editorFile.getContent(), editorFile.getType());
            } else {
                let aclFile = this.createAclFile(oldId, editorFile.getContent());
                this.currentBusinessNetwork.getAclManager().setAclFile(aclFile);
            }

        } else if (editorFile.isScript()) {
            if (this.getScriptFile(oldId)) {
                this.updateBusinessNetworkFile(oldId, editorFile.getContent(), editorFile.getType());
            } else {
                let script = this.createScriptFile(oldId, 'JS', editorFile.getContent());
                this.currentBusinessNetwork.getScriptManager().addScript(script);
            }
        } else if (editorFile.isQuery()) {
            if (this.getQueryFile()) {
                this.updateBusinessNetworkFile(oldId, editorFile.getContent(), editorFile.getType());
            } else {
                let query = this.createQueryFile(oldId, editorFile.getContent());
                this.currentBusinessNetwork.getQueryManager().setQueryFile(query);
            }
        } else if (editorFile.isReadMe()) {
            this.updateBusinessNetworkFile(oldId, editorFile.getContent(), editorFile.getType());
        } else if (editorFile.isPackage()) {
            this.updateBusinessNetworkFile(oldId, editorFile.getContent(), editorFile.getType());
        } else {
            throw new Error('Attempted update of unknown file of type: ' + editorFile.getType());
        }
    }

    getCurrentFile(): any {
        return this.currentFile;
    }

    setCurrentFile(cf: any) {
        this.currentFile = cf;
    }

    updateBusinessNetworkFile(id: string, content: any, type: string) {
        switch (type) {
            case 'model':
                let modelManager = this.currentBusinessNetwork.getModelManager();
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
                break;
            case 'script':
                let script = this.createScriptFile(id, 'JS', content);
                this.currentBusinessNetwork.getScriptManager().addScript(script);
                break;
            case 'acl':
                let aclFile = this.createAclFile(id, content);
                this.currentBusinessNetwork.getAclManager().setAclFile(aclFile);
                break;
            case 'query':
                let query = this.createQueryFile(id, content);
                this.currentBusinessNetwork.getQueryManager().setQueryFile(query);
                break;
            case 'package':
                this.setBusinessNetworkPackageJson(content);
                break;
            case 'readme':
                this.setBusinessNetworkReadme(content);
                break;
            default:
                throw new Error('Attempted update of unknown file of type: ' + type);
        }
        return null;
    }

    modelNamespaceCollides(newNamespace, previousNamespace): boolean {
        let allModelFiles = this.currentBusinessNetwork.getModelManager().getModelFiles();
        if ((newNamespace !== previousNamespace) && (allModelFiles.findIndex((model) => model.getNamespace() === newNamespace) !== -1)) {
            return true;
        } else {
            return false;
        }
    }

    replaceBusinessNetworkFile(oldId: string, newId: string, content: any, type: string): string {
        try {
            switch (type) {
                case 'model':
                    let modelFile = this.createModelFile(content, newId);
                    this.currentBusinessNetwork.getModelManager().updateModelFile(modelFile, newId);
                    this.businessNetworkChanged$.next(true);
                    break;
                case 'script':
                    let script = this.createScriptFile(newId, 'JS', content);
                    this.currentBusinessNetwork.getScriptManager().addScript(script);
                    this.currentBusinessNetwork.getScriptManager().deleteScript(oldId);
                    this.businessNetworkChanged$.next(true);
                    break;
                default:
                    throw new Error('Attempted replace of ununsupported file type: ' + type);
            }
            return null;
        } catch (e) {
            this.businessNetworkChanged$.next(false);
            return e.toString();
        }
    }

    setBusinessNetworkPackageJson(packageJson: string) {
        this.currentBusinessNetwork.setPackageJson(JSON.parse(packageJson));
        this.dirty = true;
    }

    setBusinessNetworkReadme(readme: string) {
        this.currentBusinessNetwork.setReadme(readme);
        this.dirty = true;
    }

    getBusinessNetwork(): BusinessNetworkDefinition {
        return this.currentBusinessNetwork;
    }

    getBusinessNetworkName() {
        return this.getBusinessNetwork().getMetadata().getName();
    }

    getBusinessNetworkVersion() {
        return this.getBusinessNetwork().getMetadata().getVersion();
    }

    getBusinessNetworkDescription() {
        return this.getBusinessNetwork().getMetadata().getDescription();
    }

    getModelFiles(getSystemModels = true): ModelFile[] {
        let models = this.getBusinessNetwork().getModelManager().getModelFiles();
        models = models.filter((obj) => {
            return getSystemModels || !obj.systemModelFile;
        });
        return models;
    }

    getScripts(): Script[] {
        return this.currentBusinessNetwork.getScriptManager().getScripts();
    }

    getAclFile(): AclFile {
        return this.currentBusinessNetwork.getAclManager().getAclFile();
    }

    getQueryFile(): QueryFile {
        return this.currentBusinessNetwork.getQueryManager().getQueryFile();
    }

    getMetaData() {
        return this.currentBusinessNetwork.getMetadata();
    }

    changesDeployed() {
      this.dirty = false;
    }

    isDirty() {
      return this.dirty;
    }
}

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
import { ModelManager, ModelFile, Script, AclFile, QueryFile } from 'composer-common';

export class EditorFile {
    private id: string;
    private displayID: string;
    private content: string;
    private type: string;

    constructor(id: string, displayID: string, content: string, type: string) {
        this.id = id;
        this.displayID = displayID;
        this.content = content;
        this.type = type;
    }

    isModel(): boolean {
        return this.type === 'model';
    }

    isScript(): boolean {
        return this.type === 'script';
    }

    isAcl(): boolean {
        return this.type === 'acl';
    }

    isQuery(): boolean {
        return this.type === 'query';
    }

    isReadMe(): boolean {
        return this.type === 'readme';
    }

    isPackage(): boolean {
        return this.type === 'package';
    }

    getId(): string {
        return this.id;
    }

    getContent(): string {
        return this.content;
    }

    getType(): string {
        return this.type;
    }

    getModelNamespace(): string {
        let modelManager = new ModelManager();
        let modelFile = new ModelFile(modelManager, this.content, null);
        return modelFile.getNamespace();
    }

    getDisplayId(): string {
        return this.displayID;
    }

    setId(id: string) {
        this.id = id;
    }

    setDisplayID(id: string) {
        this.displayID = id;
    }

    setContent(stringContent: string) {
        this.content = stringContent;
    }

    setJsonContent(jsonContent: object) {
        this.content = JSON.stringify(jsonContent, null, 2);
    }

    setType(type: string) {
        this.type = type;
    }

    validate(modelManager: ModelManager) {
        switch (this.type) {
            case 'model':
                this.validateModelFile(modelManager);
                break;
            case 'script':
                this.validateScriptFile(modelManager);
                break;
            case 'query':
                this.validateQueryFile(modelManager);
                break;
            case 'acl':
                this.validateAclFile(modelManager);
                break;
            default:
                break;
        }
    }

    private validateModelFile(modelManager: ModelManager) {
        let modelFile = new ModelFile(modelManager, this.content, null);
        modelFile.validate();
    }

    private validateScriptFile(modelManager: ModelManager) {
        let mockscriptFile = new Script(modelManager, null, 'JS', this.content);
    }

    private validateAclFile(modelManager: ModelManager) {
        let aclFile = new AclFile(null, modelManager, this.content);
        aclFile.validate();
    }

    private validateQueryFile(modelManager: ModelManager) {
        let queryFile = new QueryFile(null, modelManager, this.content);
        queryFile.validate();
    }
}

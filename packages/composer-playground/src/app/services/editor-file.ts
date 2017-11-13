import { ModelManager, ModelFile, Script, AclFile, QueryFile } from 'composer-common';

export class EditorFile {
    private id;
    private displayID;
    private content;
    private type;

    constructor(id: string, displayID: string, content: string, type: string) {
        this.id = id;
        this.displayID = displayID;
        this.content = content;
        this.type = type;
    }

    isModel() {
        return this.type === 'model';
    }

    isScript() {
        return this.type === 'script';
    }

    isAcl() {
        return this.type === 'acl';
    }

    isQuery() {
        return this.type === 'query';
    }

    isReadMe() {
        return this.type === 'readme';
    }

    isPackage() {
        return this.type === 'package';
    }

    getId() {
        return this.id;
    }

    getContent() {
        return this.content;
    }

    getType() {
        return this.type;
    }

    getModelNamespace() {
        let modelManager = new ModelManager();
        let modelFile = new ModelFile(modelManager, this.content, null);
        return modelFile.getNamespace();
    }

    getDisplayId() {
        return this.displayID;
    }

    setId(id) {
        this.id = id;
    }

    setDisplayID(id) {
        this.displayID = id;
    }

    setContent(content) {
        this.content = content;
    }

    setType(type) {
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

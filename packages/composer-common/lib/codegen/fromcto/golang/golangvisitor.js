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

'use strict';

const AssetDeclaration = require('../../../introspect/assetdeclaration');
const ClassDeclaration = require('../../../introspect/classdeclaration');
const EnumDeclaration = require('../../../introspect/enumdeclaration');
const ConceptDeclaration = require('../../../introspect/conceptdeclaration');
const EnumValueDeclaration = require('../../../introspect/enumvaluedeclaration');
const Field = require('../../../introspect/field');
const ModelFile = require('../../../introspect/modelfile');
const ModelManager = require('../../../modelmanager');
const BusinessNetworkDefinition = require('../../../businessnetworkdefinition');
const RelationshipDeclaration = require('../../../introspect/relationshipdeclaration');
const TransactionDeclaration = require('../../../introspect/transactiondeclaration');
const util = require('util');
const ModelUtil = require('../../../modelutil');
/**
 * Convert the contents of a ModelManager to Go Lang code.
 * All generated code is placed into the 'main' package. Set a
 * fileWriter property (instance of FileWriter) on the parameters
 * object to control where the generated code is written to disk.
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class GoLangVisitor {
    /**
     * Visitor design pattern
     * @param {Object} thing - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visit(thing, parameters) {
        if (thing instanceof BusinessNetworkDefinition) {
            return this.visitBusinessNetwork(thing, parameters);
        } else if (thing instanceof ModelManager) {
            return this.visitModelManager(thing, parameters);
        } else if (thing instanceof ModelFile) {
            return this.visitModelFile(thing, parameters);
        } else if (thing instanceof AssetDeclaration) {
            return this.visitClassDeclaration(thing, parameters);
        } else if (thing instanceof TransactionDeclaration) {
          //  return this.visitTransactionDeclaration(thing, parameters);
        } else if (thing instanceof EnumDeclaration) {
            return this.visitEnumDeclaration(thing, parameters);
        } else if (thing instanceof ConceptDeclaration) {
            //return this.visitConceptDeclaration(thing, parameters);
        } else if (thing instanceof ClassDeclaration) {
            return this.visitClassDeclaration(thing, parameters);
        } else if (thing instanceof Field) {
            return this.visitField(thing, parameters);
        } else if (thing instanceof RelationshipDeclaration) {
          //  return this.visitRelationshipDeclaration(thing, parameters);
        } else if (thing instanceof EnumValueDeclaration) {
            return this.visitEnumValueDeclaration(thing, parameters);
        } else {
            throw new Error('Unrecognised type: ' + typeof thing + ', value: ' + util.inspect(thing, { showHidden: true, depth: null }));
        }
    }

    /**
     * Visitor design pattern
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitBusinessNetwork(businessNetworkDefinition, parameters) {

        businessNetworkDefinition.getModelManager().getModelFiles().forEach((decl) => {
            decl.accept(this, parameters);
        });

        return null;
    }

    /**
     * Visitor design pattern
     * @param {ModelManager} modelManager - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelManager(modelManager, parameters) {
        parameters.fileWriter.openFile('main.go');
        parameters.fileWriter.writeLine(0, 'package main');
        parameters.fileWriter.writeLine(0, 'import \"fmt\"');
        parameters.fileWriter.writeLine(0, 'type Relationship struct {' );
        parameters.fileWriter.writeLine(1, 'Namespace string `json:"namespace"`' );
        parameters.fileWriter.writeLine(1, 'Type string `json:"type"`' );
        parameters.fileWriter.writeLine(1, 'Identifier string `json:"identifier"`' );
        parameters.fileWriter.writeLine(0, '}' );
        parameters.fileWriter.writeLine(0, 'func main() {');
        parameters.fileWriter.writeLine(1, 'fmt.Printf(\"Hello, world.\")');
        parameters.fileWriter.writeLine(0, '}');
        parameters.fileWriter.closeFile();

        modelManager.getModelFiles().forEach((modelFile) => {
            modelFile.accept(this,parameters);
        });
        return null;
    }

    /**
     * Visitor design pattern
     * @param {ModelFile} modelFile - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelFile(modelFile, parameters) {
        // we put all the code into the main package, but we
        // seperate out into multiple files using the namespaces
        let packageName = this.toGoPackageName(modelFile.getNamespace());
        parameters.fileWriter.openFile(packageName + '.go');
        parameters.fileWriter.writeLine(0, 'package main');

        if(this.containsDateTimeField(modelFile)) {
            parameters.fileWriter.writeLine(0, 'import \"time"' );
        }

        modelFile.getAllDeclarations().forEach((decl) => {
            decl.accept(this, parameters);
        });

        parameters.fileWriter.closeFile();

        return null;
    }

    /**
     * Visitor design pattern
     * @param {EnumDeclaration} enumDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumDeclaration(enumDeclaration, parameters) {

        parameters.fileWriter.writeLine(0, 'type ' + enumDeclaration.getName() + ' int' );

        parameters.fileWriter.writeLine(0, 'const (' );

        enumDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(0, ')' );
        return null;
    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitClassDeclaration(classDeclaration, parameters) {
        parameters.fileWriter.writeLine(0, 'type ' + classDeclaration.getName() + ' struct {' );

        //embed the super-type, because Go Lang does not have 'extends'
        if(classDeclaration.getSuperType()) {
            parameters.fileWriter.writeLine(1, ModelUtil.getShortName(classDeclaration.getSuperType()));
        }

        classDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(0, '}' );
        return null;
    }

    /**
     * Visitor design pattern
     * @param {Field} field - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitField(field, parameters) {
        let array = '';

        if(field.isArray()) {
            array = '[]';
        }

        // we export all fields by capitalizing them
        parameters.fileWriter.writeLine(1, ModelUtil.capitalizeFirstLetter(field.getName()) + ' ' + array + this.toGoType(field.getType()) + ' `json:"' + field.getName() + '"`' );
        return null;
    }

    /**
     * Visitor design pattern
     * @param {EnumValueDeclaration} enumValueDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumValueDeclaration(enumValueDeclaration, parameters) {

        // is this the first enum value?
        // if yes, we need to use 'iota' to set the value to zero
        const isFirstValue = enumValueDeclaration.getParent().getOwnProperties()[0].getName() === enumValueDeclaration.getName();
        let iota = '';

        if(isFirstValue) {
            iota =  ' ' + enumValueDeclaration.getParent().getName() + ' = 1 + iota';
        }

        // we export all fields by capitalizing them
        parameters.fileWriter.writeLine(1, ModelUtil.capitalizeFirstLetter(enumValueDeclaration.getName()) + iota );
        return null;
    }

    /**
     * Visitor design pattern
     * @param {Relationship} relationship - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitRelationship(relationship, parameters) {
        let array = '';

        if(relationship.isArray()) {
            array = '[]';
        }

        // we export all relationships by capitalizing them
        parameters.fileWriter.writeLine(1, ModelUtil.capitalizeFirstLetter(relationship.getName()) + ' ' + array + 'Relationship `json:"' + relationship.getName() + '"`' );
        return null;
    }

    /**
     * Returns true if the ModelFile contains a class that has a DateTime
     * field.
     * @param {ModelFile} modelFile  - the modelFile
     * @return {boolean} true if the modelFile contains a class that contains
     * a field of type DateTime.
     * @private
     */
    containsDateTimeField(modelFile) {
        let classDeclarations = modelFile.getAllDeclarations();
        for(let n=0; n < classDeclarations.length; n++) {
            let classDecl = classDeclarations[n];
            let fields = classDecl.getProperties();
            for(let i=0; i < fields.length; i++) {
                let field = fields[i];
                if(field.getType() === 'DateTime') {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Converts a Composer type to a Go Lang type. Primitive types are converted
     * everything else is passed through unchanged.
     * @param {string} type  - the composer type
     * @return {string} the corresponding type in Go Lang
     * @private
     */
    toGoType(type) {
        switch(type) {
        case 'DateTime':
            return 'time.Time';
        case 'Boolean':
            return 'bool';
        case 'String':
            return 'string';
        case 'Double':
            return 'float64';
        case 'Long':
            return 'int64';
        case 'Integer':
            return 'int32';
        default:
            return type;
        }
    }

    /**
     * Converts a Composer namespace to a Go package name.
     * @param {string} namespace  - the composer type
     * @return {string} the corresponding package name in Go Lang
     * @private
     */
    toGoPackageName(namespace) {
        return namespace.replace('.', '');
    }
}

module.exports = GoLangVisitor;

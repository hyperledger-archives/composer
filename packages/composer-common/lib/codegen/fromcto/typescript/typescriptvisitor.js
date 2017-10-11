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

const BusinessNetworkDefinition = require('../../../businessnetworkdefinition');
const ModelManager = require('../../../modelmanager');
const ModelUtil = require('../../../modelutil');
const ModelFile = require('../../../introspect/modelfile');
const ClassDeclaration = require('../../../introspect/classdeclaration');
const Field = require('../../../introspect/field');
const RelationshipDeclaration = require('../../../introspect/relationshipdeclaration');
const EnumDeclaration = require('../../../introspect/enumdeclaration');
const EnumValueDeclaration = require('../../../introspect/enumvaluedeclaration');
const util = require('util');

/**
 * Convert the contents of a ModelManager to TypeScript code.
 * All generated code is placed into the 'main' package. Set a
 * fileWriter property (instance of FileWriter) on the parameters
 * object to control where the generated code is written to disk.
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class TypescriptVisitor {
    /**
     * Visitor design pattern
     * @param {Object} thing - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visit(thing, parameters) {
        if (thing instanceof BusinessNetworkDefinition) {
            return this.visitBusinessNetworkDefinition(thing, parameters);
        } else if (thing instanceof ModelManager) {
            return this.visitModelManager(thing, parameters);
        } else if (thing instanceof ModelFile) {
            return this.visitModelFile(thing, parameters);
        } else if (thing instanceof EnumDeclaration) {
            return this.visitEnumDeclaration(thing, parameters);
        } else if (thing instanceof ClassDeclaration) {
            return this.visitClassDeclaration(thing, parameters);
        } else if (thing instanceof Field) {
            return this.visitField(thing, parameters);
        } else if (thing instanceof RelationshipDeclaration) {
            return this.visitRelationship(thing, parameters);
        } else if (thing instanceof EnumValueDeclaration) {
            return this.visitEnumValueDeclaration(thing, parameters);
        } else {
            throw new Error('Unrecognised type: ' + typeof thing + ', value: ' + util.inspect(thing, { showHidden: true, depth: 2 }));
        }
    }

    /**
     * Visitor design pattern
     * @param {BusinessNetworkDefinition} businessNetworkDefinition - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitBusinessNetworkDefinition(businessNetworkDefinition, parameters) {
        businessNetworkDefinition.getModelManager().accept(this,parameters);
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
        parameters.fileWriter.openFile(modelFile.getNamespace() + '.ts');

        // if this is not the system model file we have to import the system types
        // so that they can be extended
        if( !modelFile.isSystemModelFile() ) {
            const systemTypes = modelFile.getModelManager().getSystemTypes();
            systemTypes.forEach(systemType =>
                parameters.fileWriter.writeLine(0, `import {${systemType.getName()}} from './org.hyperledger.composer.system';`));
        }

        // Import property types that are imported from other cto files.
        const dot = '.';
        const properties = new Map();
        modelFile.getAllDeclarations()
        .filter(v => !v.isEnum())
        .forEach(classDeclaration => classDeclaration.getProperties().forEach(property => {
            if(!property.isPrimitive()){
                const fullyQualifiedTypeName = property.getFullyQualifiedTypeName();
                const lastIndexOfDot = fullyQualifiedTypeName.lastIndexOf(dot);
                const propertyNamespace =  fullyQualifiedTypeName.substring(0, lastIndexOfDot);
                const propertyTypeName = fullyQualifiedTypeName.substring(lastIndexOfDot + 1);
                if(!properties.has(propertyNamespace)) {
                    properties.set(propertyNamespace, new Set());
                }
                properties.get(propertyNamespace).add(propertyTypeName);
            }
        }));

        modelFile.getImports().map(importString => {
            const lastIndexOfDot = importString.lastIndexOf(dot);
            const namespace = importString.substring(0, lastIndexOfDot);
            return namespace;
        }).filter(namespace => namespace !== modelFile.getNamespace()) // Skip own namespace.
        .filter((v, i, a) => a.indexOf(v) === i) // Remove any duplicates from direct imports
        .forEach(namespace => {
            const propertyTypeNames = properties.get(namespace);
            if(propertyTypeNames){
                const csvPropertyTypeNames = Array.from(propertyTypeNames).join();
                parameters.fileWriter.writeLine(0, `import {${csvPropertyTypeNames}} from './${namespace}';`);
            }
        });

        parameters.fileWriter.writeLine(0, '// export namespace ' + modelFile.getNamespace() + '{');

        modelFile.getAllDeclarations().forEach((decl) => {
            decl.accept(this, parameters);
        });

        parameters.fileWriter.writeLine(0, '// }');
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

        parameters.fileWriter.writeLine(1, 'export enum ' + enumDeclaration.getName() + ' {' );

        enumDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(1, '}' );
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


        let isAbstract = '';
        if( classDeclaration.isAbstract() ) {
            isAbstract = 'export abstract ';
        }
        else {
            isAbstract = 'export ';
        }

        let superType = '';
        if(classDeclaration.getSuperType()) {
            superType = ' extends ' + ModelUtil.getShortName(classDeclaration.getSuperType());
        }

        parameters.fileWriter.writeLine(1, isAbstract + 'class ' + classDeclaration.getName() + superType + ' {' );

        classDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(1, '}' );
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

        parameters.fileWriter.writeLine(2, field.getName() + ': ' + this.toTsType(field.getType()) + array + ';' );
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
        parameters.fileWriter.writeLine(2, enumValueDeclaration.getName() + ',' );
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
        parameters.fileWriter.writeLine(2, relationship.getName() + ': ' + this.toTsType(relationship.getType()) + array + ';' );
        return null;
    }

    /**
     * Converts a Composer type to a Typescript  type. Primitive types are converted
     * everything else is passed through unchanged.
     * @param {string} type  - the composer type
     * @return {string} the corresponding type in Typescript
     * @private
     */
    toTsType(type) {
        switch(type) {
        case 'DateTime':
            return 'Date';
        case 'Boolean':
            return 'boolean';
        case 'String':
            return 'string';
        case 'Double':
            return 'number';
        case 'Long':
            return 'number';
        case 'Integer':
            return 'number';
        default:
            return type;
        }
    }
}

module.exports = TypescriptVisitor;

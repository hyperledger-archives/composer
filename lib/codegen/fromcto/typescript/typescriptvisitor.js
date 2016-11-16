/*
 * IBM Confidential
 * OCO Source Materials
 * IBM Concerto - Blockchain Solution Framework
 * Copyright IBM Corp. 2016
 * The source code for this program is not published or otherwise
 * divested of its trade secrets, irrespective of what has
 * been deposited with the U.S. Copyright Office.
 */

'use strict';

const ModelManager = require('../../../modelmanager');
const ModelUtil = require('../../../modelutil');
const ModelFile = require('../../../introspect/modelfile');
const ClassDeclaration = require('../../../introspect/classdeclaration');
const Field = require('../../../introspect/field');
const RelationshipDeclaration = require('../../../introspect/relationshipdeclaration');
const EnumDeclaration = require('../../../introspect/enumdeclaration');
const EnumValueDeclaration = require('../../../introspect/enumvaluedeclaration');
const FunctionDeclaration = require('../../../introspect/functiondeclaration');

const _ = require('underscore');

/**
 * Convert the contents of a ModelManager to Go Lang code.
 * All generated code is placed into the 'main' package. Set a
 * fileWriter property (instance of FileWriter) on the parameters
 * object to control where the generated code is written to disk.
 *
 * @private
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
        if (thing instanceof ModelManager) {
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
        } else if (thing instanceof FunctionDeclaration) {
            // return this.visitEnum(thing, parameters);
        } else {
            throw new Error('Unrecognised ' + JSON.stringify(thing) );
        }
    }

    /**
     * Visitor design pattern
     * @param {ModelManager} modelManager - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelManager(modelManager, parameters) {
        let visitModelFile = function(modelFile) {
            modelFile.accept(this,parameters);
        };
        _.each(modelManager.getModelFiles(), visitModelFile.bind(this));
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

        // TODO (DCS) don't yet understand namespaces...
        parameters.fileWriter.writeLine(0, '// export namespace ' + modelFile.getNamespace() + '{');

        let visitClass = function(classDeclaration) {
            classDeclaration.accept(this,parameters);
        };
        _.each(modelFile.getAllDeclarations(), visitClass.bind(this));

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

        let visitProperty = function(property) {
            property.accept(this,parameters);
        };
        _.each(enumDeclaration.getOwnProperties(), visitProperty.bind(this));

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

        let visitProperty = function(property) {
            property.accept(this,parameters);
        };
        _.each(classDeclaration.getOwnProperties(), visitProperty.bind(this));

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
     * Converts a Concerto type to a Typescript  type. Primitive types are converted
     * everything else is passed through unchanged.
     * @param {string} type  - the concerto type
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

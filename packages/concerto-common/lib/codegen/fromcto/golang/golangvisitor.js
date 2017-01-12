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

const ModelUtil = require('../../../modelutil');
const ModelManager = require('../../../modelmanager');
const ModelFile = require('../../../introspect/modelfile');
const ClassDeclaration = require('../../../introspect/classdeclaration');
const Field = require('../../../introspect/field');
const RelationshipDeclaration = require('../../../introspect/relationshipdeclaration');
const EnumDeclaration = require('../../../introspect/enumdeclaration');
const EnumValueDeclaration = require('../../../introspect/enumvaluedeclaration');
const FunctionDeclaration = require('../../../introspect/functiondeclaration');

/**
 * Convert the contents of a ModelManager to Go Lang code.
 * All generated code is placed into the 'main' package. Set a
 * fileWriter property (instance of FileWriter) on the parameters
 * object to control where the generated code is written to disk.
 *
 * @private
 * @class
 * @memberof module:concerto-common
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
     * Converts a Concerto type to a Go Lang type. Primitive types are converted
     * everything else is passed through unchanged.
     * @param {string} type  - the concerto type
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
     * Converts a Concerto namespace to a Go package name.
     * @param {string} namespace  - the concerto type
     * @return {string} the corresponding package name in Go Lang
     * @private
     */
    toGoPackageName(namespace) {
        return namespace.replace('.', '');
    }
}

module.exports = GoLangVisitor;

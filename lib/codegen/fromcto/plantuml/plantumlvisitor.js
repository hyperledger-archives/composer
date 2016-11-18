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

const BusinessNetwork = require('../../../businessnetwork');
const ScriptManager = require('../../../scriptmanager');
const ClassDeclaration = require('../../../introspect/classdeclaration');
const Script = require('../../../introspect/script');
const TransactionDeclaration = require('../../../introspect/transactiondeclaration');
const AssetDeclaration = require('../../../introspect/assetdeclaration');
const ParticipantDeclaration = require('../../../introspect/participantdeclaration');
const EnumDeclaration = require('../../../introspect/enumdeclaration');

const Field = require('../../../introspect/field');
const RelationshipDeclaration = require('../../../introspect/relationshipdeclaration');
const EnumValueDeclaration = require('../../../introspect/enumvaluedeclaration');
const FunctionDeclaration = require('../../../introspect/functiondeclaration');

/**
 * Convert the contents of a BusinessNetwork to PlantUML format files.
 * Set a fileWriter property (instance of FileWriter) on the parameters
 * object to control where the generated code is written to disk.
 *
 * @private
 */
class PlantUMLVisitor {
    /**
     * Visitor design pattern
     * @param {Object} thing - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visit(thing, parameters) {
        if (thing instanceof BusinessNetwork) {
            return this.visitBusinessNetwork(thing, parameters);
        } else if (thing instanceof ScriptManager) {
            return this.visitScriptManager(thing, parameters);
        } else if (thing instanceof Script) {
            return this.visitScript(thing, parameters);
        } else if (thing instanceof ParticipantDeclaration) {
            return this.visitParticipantDeclaration(thing, parameters);
        } else if (thing instanceof TransactionDeclaration) {
            return this.visitTransactionDeclaration(thing, parameters);
        } else if (thing instanceof AssetDeclaration) {
            return this.visitAssetDeclaration(thing, parameters);
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
            return this.visitFunctionDeclaration(thing, parameters);
        } else {
            throw new Error('Unrecognised ' + JSON.stringify(thing) );
        }
    }

    /**
     * Visitor design pattern
     * @param {BusinessNetwork} businessNetwork - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitBusinessNetwork(businessNetwork, parameters) {
        parameters.fileWriter.openFile('model.uml');
        parameters.fileWriter.writeLine(0, '@startuml');

        businessNetwork.getIntrospector().getClassDeclarations().forEach((decl) => {
            decl.accept(this, parameters);
        });

        const txProcessor = businessNetwork.getIdentifier() + '.TransactionProcessor';
        parameters.fileWriter.writeLine(0, 'class ' + txProcessor + ' << (X,brown) >> {' );

        businessNetwork.getScriptManager().getScripts().forEach((decl) => {
            decl.accept(this, parameters);
        });

        parameters.fileWriter.writeLine(0, '}' );

        businessNetwork.getScriptManager().getScripts().forEach((script) => {
            script.getFunctions().forEach((func) => {
                const txName = businessNetwork.getIdentifier() + '.' + func.getTransactionDeclarationName();
                if(txName) {
                    parameters.fileWriter.writeLine(0, txProcessor + ' .. ' + txName );
                }
            }
          );
        });

        parameters.fileWriter.writeLine(0, '@enduml');
        parameters.fileWriter.closeFile();

        return null;
    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitAssetDeclaration(classDeclaration, parameters) {
        parameters.fileWriter.writeLine(0, 'class ' + classDeclaration.getFullyQualifiedName() + ' << (A,green) >> {' );

        classDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(0, '}' );

        if(classDeclaration.getSuperType()) {
            parameters.fileWriter.writeLine(0, classDeclaration.getFullyQualifiedName() + ' --|> ' + classDeclaration.getSuperType());
        }

        return null;
    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumDeclaration(classDeclaration, parameters) {
        parameters.fileWriter.writeLine(0, 'class ' + classDeclaration.getFullyQualifiedName() + ' << (E,grey) >> {' );

        classDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(0, '}' );

        if(classDeclaration.getSuperType()) {
            parameters.fileWriter.writeLine(0, classDeclaration.getFullyQualifiedName() + ' --|> ' + classDeclaration.getSuperType());
        }

        return null;
    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitParticipantDeclaration(classDeclaration, parameters) {
        parameters.fileWriter.writeLine(0, 'class ' + classDeclaration.getFullyQualifiedName() + ' << (P,lightblue) >> {' );

        classDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(0, '}' );

        if(classDeclaration.getSuperType()) {
            parameters.fileWriter.writeLine(0, classDeclaration.getFullyQualifiedName() + ' --|> ' + classDeclaration.getSuperType());
        }

        return null;
    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitTransactionDeclaration(classDeclaration, parameters) {
        parameters.fileWriter.writeLine(0, 'class ' + classDeclaration.getFullyQualifiedName() + ' << (T,yellow) >> {' );

        classDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(0, '}' );

        if(classDeclaration.getSuperType()) {
            parameters.fileWriter.writeLine(0, classDeclaration.getFullyQualifiedName() + ' --|> ' + classDeclaration.getSuperType());
        }

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
        parameters.fileWriter.writeLine(0, 'class ' + classDeclaration.getFullyQualifiedName() + ' {' );

        classDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(0, '}' );

        if(classDeclaration.getSuperType()) {
            parameters.fileWriter.writeLine(0, classDeclaration.getFullyQualifiedName() + ' --|> ' + classDeclaration.getSuperType());
        }

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

        parameters.fileWriter.writeLine(1, '+ ' + field.getType() + array + ' ' + field.getName());
        return null;
    }

    /**
     * Visitor design pattern
     * @param {FunctionDeclaration} functionDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitFunctionDeclaration(functionDeclaration, parameters) {
        parameters.fileWriter.writeLine(1, '+ ' + functionDeclaration.getName() + '(' + functionDeclaration.getParameters() + ')');
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
        parameters.fileWriter.writeLine(1, '+ ' + enumValueDeclaration.getName());
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
        parameters.fileWriter.writeLine(1, '+ ' + relationship.getType() + array + ' ' + relationship.getName());
        return null;
    }
}

module.exports = PlantUMLVisitor;

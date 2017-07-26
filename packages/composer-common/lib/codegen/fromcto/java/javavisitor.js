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
const FunctionDeclaration = require('../../../introspect/functiondeclaration');
const util = require('util');

/**
 * Convert the contents of a BusinessNetworkDefinition to Java code.
 * Set a fileWriter property (instance of FileWriter) on the parameters
 * object to control where the generated code is written to disk.
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class JavaVisitor {
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
        } else if (thing instanceof FunctionDeclaration) {
            // return this.visitEnum(thing, parameters);
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

        parameters.fileWriter.openFile( 'org/hyperledger/composer/system/Resource.java');
        parameters.fileWriter.writeLine(0, '// this code is generated and should not be modified');
        parameters.fileWriter.writeLine(0, 'package org.hyperledger.composer.system;');
        parameters.fileWriter.writeLine(0, 'import com.fasterxml.jackson.annotation.*;');

        parameters.fileWriter.writeLine(0, `
@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, property = "$class")
@JsonIdentityInfo(generator = ObjectIdGenerators.PropertyGenerator.class, property = "$id")
public abstract class Resource
{
    public abstract String getID();
    private String $id;
    
    @JsonProperty("$id")
    public String get$id() {
        return $id; 
    }
    @JsonProperty("$id")
    public void set$id(String i) {
        $id = i; 
    }

}
        `);
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

        modelFile.getAllDeclarations().forEach((decl) => {
            decl.accept(this, parameters);
        });

        return null;
    }

    /**
     * Write a Java class file header. The class file will be created in
     * a file/folder based on the namespace of the class.
     * @param {ClassDeclaration} clazz - the clazz being visited
     * @param {Object} parameters  - the parameter
     * @private
     */
    startClassFile(clazz, parameters) {
        parameters.fileWriter.openFile( clazz.getModelFile().getNamespace().replace(/\./g, '/') + '/' + clazz.getName() + '.java');
        parameters.fileWriter.writeLine(0, '// this code is generated and should not be modified');
        parameters.fileWriter.writeLine(0, 'package ' + clazz.getModelFile().getNamespace() + ';');
        parameters.fileWriter.writeLine(0, '');
        parameters.fileWriter.writeLine(0, 'import org.hyperledger.composer.system.*;');
    }

    /**
     * Close a Java class file
     * @param {ClassDeclaration} clazz - the clazz being visited
     * @param {Object} parameters  - the parameter
     * @private
     */
    endClassFile(clazz, parameters) {
        parameters.fileWriter.closeFile();
    }


    /**
     * Visitor design pattern
     * @param {EnumDeclaration} enumDeclaration - the object being visited
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumDeclaration(enumDeclaration, parameters) {

        this.startClassFile(enumDeclaration, parameters);

        parameters.fileWriter.writeLine(0, 'import com.fasterxml.jackson.annotation.JsonIgnoreProperties;');
        parameters.fileWriter.writeLine(0, '@JsonIgnoreProperties({"$class"})');
        parameters.fileWriter.writeLine(0, 'public enum ' + enumDeclaration.getName() + ' {' );

        enumDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(0, '}' );

        this.endClassFile(enumDeclaration, parameters);

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

        this.startClassFile(classDeclaration, parameters);

        classDeclaration.getModelFile().getImports().forEach((imported) => {
            parameters.fileWriter.writeLine(0, 'import ' + imported + ';' );
        });

        if(classDeclaration.isConcept()) {
            parameters.fileWriter.writeLine(0, 'import com.fasterxml.jackson.annotation.JsonIgnoreProperties;');
            parameters.fileWriter.writeLine(0, '');
            parameters.fileWriter.writeLine(0, '@JsonIgnoreProperties({"$class"})');
        }

        let isAbstract = '';
        if( classDeclaration.isAbstract() ) {
            isAbstract = 'abstract ';
        }
        else {
            isAbstract = '';
        }

        let superType = '';

        if(classDeclaration.isSystemCoreType()) {
            superType = ' extends org.hyperledger.composer.system.Resource';
        }

        if(classDeclaration.getSuperType()) {
            superType = ' extends ' + ModelUtil.getShortName(classDeclaration.getSuperType());
        }

        parameters.fileWriter.writeLine(0, 'public ' + isAbstract + 'class ' + classDeclaration.getName() + superType + ' {' );

        // add the getID abstract type
        if(classDeclaration.getIdentifierFieldName()) {
            parameters.fileWriter.writeLine(1, `
   // the accessor for the identifying field
   public String getID() {
      return ${classDeclaration.getIdentifierFieldName()};
   }
`
            );
        }

        classDeclaration.getOwnProperties().forEach((property) => {
            property.accept(this,parameters);
        });

        parameters.fileWriter.writeLine(0, '}' );
        this.endClassFile(classDeclaration, parameters);

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

        parameters.fileWriter.writeLine(1, 'public ' + this.toJavaType(field.getType()) + array + ' ' + field.getName() + ';' );
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
        parameters.fileWriter.writeLine(1, enumValueDeclaration.getName() + ',' );
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
        parameters.fileWriter.writeLine(1, 'public ' + this.toJavaType(relationship.getType()) + array + ' ' + relationship.getName() + ';' );
        return null;
    }

    /**
     * Converts a Composer type to a Java type. Primitive types are converted
     * everything else is passed through unchanged.
     * @param {string} type  - the composer type
     * @return {string} the corresponding type in Java
     * @private
     */
    toJavaType(type) {
        switch(type) {
        case 'DateTime':
            return 'java.util.Date';
        case 'Boolean':
            return 'boolean';
        case 'String':
            return 'String';
        case 'Double':
            return 'double';
        case 'Long':
            return 'long';
        case 'Integer':
            return 'int';
        default:
            return type;
        }
    }
}

module.exports = JavaVisitor;

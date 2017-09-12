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
const debug = require('debug')('composer:jsonschemavisitor');
const util = require('util');

/**
 * Convert the contents of a {@link ModelManager} instance to a set of JSON
 * Schema v4 files - one per concrete asset and transaction type.
 * Set a fileWriter property (instance of {@link FileWriter}) on the parameters
 * object to control where the generated code is written to disk.
 * @private
 * @class
 * @memberof module:composer-common
 */
class JSONSchemaVisitor {

    /**
     * Visitor design pattern
     * @param {Object} thing - the object being visited
     * @param {Object} parameters - the parameter
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
            return this.visitAssetDeclaration(thing, parameters);
        } else if (thing instanceof TransactionDeclaration) {
            return this.visitTransactionDeclaration(thing, parameters);
        } else if (thing instanceof EnumDeclaration) {
            return this.visitEnumDeclaration(thing, parameters);
        } else if (thing instanceof ConceptDeclaration) {
            return this.visitConceptDeclaration(thing, parameters);
        } else if (thing instanceof ClassDeclaration) {
            return this.visitClassDeclaration(thing, parameters);
        } else if (thing instanceof Field) {
            return this.visitField(thing, parameters);
        } else if (thing instanceof RelationshipDeclaration) {
            return this.visitRelationshipDeclaration(thing, parameters);
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
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelManager(modelManager, parameters) {
        debug('entering visitModelManager');

        // Save the model manager so that we have access to it later.
        parameters.modelManager = modelManager;

        // Visit all of the files in the model manager.
        let jsonSchemas = [];
        modelManager.getModelFiles().forEach((modelFile) => {
            jsonSchemas = jsonSchemas.concat(modelFile.accept(this, parameters));
        });
        return jsonSchemas;

    }

    /**
     * Visitor design pattern
     * @param {ModelFile} modelFile - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitModelFile(modelFile, parameters) {
        debug('entering visitModelFile', modelFile.getNamespace());

        // Save the model file so that we have access to it later.
        parameters.modelFile = modelFile;

        // Visit all of the asset and transaction declarations, but ignore the abstract ones.
        let jsonSchemas = [];
        modelFile.getAssetDeclarations()
            .concat(modelFile.getTransactionDeclarations())
            .concat(modelFile.getConceptDeclarations())
            .filter((declaration) => {
                return !declaration.isAbstract();
            })
            .forEach((declaration) => {
                parameters.first = true;
                jsonSchemas.push(declaration.accept(this, parameters));
            });
        return jsonSchemas;

    }

    /**
     * Visitor design pattern
     * @param {AssetDeclaration} assetDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitAssetDeclaration(assetDeclaration, parameters) {
        debug('entering visitAssetDeclaration', assetDeclaration.getName());

        // If this is the first declaration, then we are building a schema for this asset.
        let jsonSchema = {};
        if (parameters.first) {
            jsonSchema.$schema = 'http://json-schema.org/draft-04/schema#';
            jsonSchema.title = assetDeclaration.getName();
            jsonSchema.description = `An asset named ${assetDeclaration.getName()}`;
            parameters.first = false;
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(assetDeclaration, parameters, jsonSchema);

    }

    /**
     * Visitor design pattern
     * @param {TransactionDeclaration} transactionDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitTransactionDeclaration(transactionDeclaration, parameters) {
        debug('entering visitTransactionDeclaration', transactionDeclaration.getName());

        // If this is the top declaration, then we are building a schema for this transaction.
        let jsonSchema = {};
        if (parameters.first) {
            jsonSchema.$schema = 'http://json-schema.org/draft-04/schema#';
            jsonSchema.title = transactionDeclaration.getName();
            jsonSchema.description = `A transaction named ${transactionDeclaration.getName()}`;
            parameters.first = false;
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(transactionDeclaration, parameters, jsonSchema);

    }

    /**
     * Visitor design pattern
     * @param {ConceptDeclaration} conceptDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitConceptDeclaration(conceptDeclaration, parameters) {
        debug('entering visitConceptDeclaration', conceptDeclaration.getName());

        // If this is the first declaration, then we are building a schema for this asset.
        let jsonSchema = {};
        if (parameters.first) {
            jsonSchema.$schema = 'http://json-schema.org/draft-04/schema#';
            jsonSchema.title = conceptDeclaration.getName();
            jsonSchema.description = `A concept named ${conceptDeclaration.getName()}`;
            parameters.first = false;
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(conceptDeclaration, parameters, jsonSchema);
    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitClassDeclaration(classDeclaration, parameters) {
        debug('entering visitClassDeclaration', classDeclaration.getName());

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(classDeclaration, parameters, {});

    }

    /**
     * Visitor design pattern
     * @param {ClassDeclaration} classDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @param {Object} jsonSchema - the base JSON Schema object to use
     * @return {Object} the result of visiting or null
     * @private
     */
    visitClassDeclarationCommon(classDeclaration, parameters, jsonSchema) {
        debug('entering visitClassDeclarationCommon', classDeclaration.getName());

        // Set the required properties into the schema.
        Object.assign(jsonSchema, {
            type: 'object',
            properties: {},
            required: []
        });

        // If no description exists, add it now.
        if (!jsonSchema.description) {
            jsonSchema.description = `An instance of ${classDeclaration.getFullyQualifiedName()}`;
        }

        // Every class declaration has a $class property.
        jsonSchema.properties.$class = {
            type: 'string',
            default: classDeclaration.getFullyQualifiedName(),
            description: 'The class identifier for this type'
        };

        // But it's only required at the top level.
        if (jsonSchema.$schema) {
            jsonSchema.required.push('$class');
        }

        // Walk over all of the properties of this class and its super classes.
        classDeclaration.getProperties().forEach((property) => {

            // Get the schema for the property.
            jsonSchema.properties[property.getName()] = property.accept(this, parameters);

            // If the property is required, add it to the list.
            if (!property.isOptional()) {
                jsonSchema.required.push(property.getName());
            }

        });

        // If this is a top level schema, now we need to write it to disk.
        if (jsonSchema.$schema) {
            let fileContents = JSON.stringify(jsonSchema, null, 4);
            if (parameters.fileWriter) {
                let fileName = `${classDeclaration.getFullyQualifiedName()}.json`;
                parameters.fileWriter.openFile(fileName);
                parameters.fileWriter.write(fileContents);
                parameters.fileWriter.closeFile();
            }
        }

        // Return the created schema.
        return jsonSchema;

    }

    /**
     * Visitor design pattern
     * @param {Field} field - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitField(field, parameters) {
        debug('entering visitField', field.getName());

        // Is this a primitive typed property?
        let jsonSchema;
        if (field.isPrimitive()) {

            // Render the type as JSON Schema.
            jsonSchema = {};
            switch (field.getType()) {
            case 'String':
                jsonSchema.type = 'string';
                break;
            case 'Double':
                jsonSchema.type = 'number';
                break;
            case 'Integer':
                jsonSchema.type = 'integer';
                break;
            case 'Long':
                jsonSchema.type = 'integer';
                break;
            case 'DateTime':
                jsonSchema.format = 'date-time';
                jsonSchema.type = 'string';
                break;
            case 'Boolean':
                jsonSchema.type = 'boolean';
                break;
            }

            // If this field has a default value, add it.
            if (field.getDefaultValue()) {
                jsonSchema.default = field.getDefaultValue();
            }

            // If this is the identifying field, mark it as such.
            if (field.getName() === field.getParent().getIdentifierFieldName()) {
                jsonSchema.description = 'The instance identifier for this type';
            }

        // Not primitive, so must be a class or enumeration!
        } else {

            // Look up the type of the property.
            let type = parameters.modelFile.getType(field.getType());

            // Render the type as JSON Schema.
            jsonSchema = type.accept(this, parameters);

        }

        // Is the type an array?
        if (field.isArray()) {
            jsonSchema = {
                type: 'array',
                items: jsonSchema
            };
        }

        // Return the schema.
        return jsonSchema;

    }

    /**
     * Visitor design pattern
     * @param {EnumDeclaration} enumDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumDeclaration(enumDeclaration, parameters) {
        debug('entering visitEnumDeclaration', enumDeclaration.getName());

        // Create the schema.
        let jsonSchema = {
            enum: []
        };

        // Walk over all of the properties which should just be enum value declarations.
        enumDeclaration.getProperties().forEach((property) => {
            jsonSchema.enum.push(property.accept(this, parameters));
        });

        // Return the schema.
        return jsonSchema;

    }

    /**
     * Visitor design pattern
     * @param {EnumValueDeclaration} enumValueDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEnumValueDeclaration(enumValueDeclaration, parameters) {
        debug('entering visitEnumValueDeclaration', enumValueDeclaration.getName());

        // The "schema" in this case is just the name of the value.
        return enumValueDeclaration.getName();

    }

    /**
     * Visitor design pattern
     * @param {RelationshipDeclaration} relationshipDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitRelationshipDeclaration(relationshipDeclaration, parameters) {
        debug('entering visitRelationship', relationshipDeclaration.getName());

        // Create the schema.
        let jsonSchema = {
            type: 'string',
            description: `The identifier of an instance of ${relationshipDeclaration.getFullyQualifiedTypeName()}`
        };

        // Is the type an array?
        if (relationshipDeclaration.isArray()) {
            jsonSchema = {
                type: 'array',
                items: jsonSchema
            };
        }

        // Return the schema.
        return jsonSchema;

    }

}

module.exports = JSONSchemaVisitor;

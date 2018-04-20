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
const ParticipantDeclaration = require('../../../introspect/participantdeclaration');
const ConceptDeclaration = require('../../../introspect/conceptdeclaration');
const EnumDeclaration = require('../../../introspect/enumdeclaration');
const EnumValueDeclaration = require('../../../introspect/enumvaluedeclaration');
const EventDeclaration = require('../../../introspect/eventdeclaration');
const Field = require('../../../introspect/field');
const ModelFile = require('../../../introspect/modelfile');
const ModelManager = require('../../../modelmanager');
const RelationshipDeclaration = require('../../../introspect/relationshipdeclaration');
const TransactionDeclaration = require('../../../introspect/transactiondeclaration');
const debug = require('debug')('composer:loopbackvisitor');
const util = require('util');

/**
 * Convert a fully qualified type name, for example org.example.mynetwork.MyAsset,
 * into a name that is safe for use as a LoopBack model name.
 * @private
 * @param {String} fqn The fully qualified type name.
 * @returns {String} A name that is safe for use as a LoopBack model name.
 */
function loopbackify(fqn) {
    return fqn.replace(/\./g, '_');
}

/**
 * Convert the contents of a {@link ModelManager} instance to a set of LoopBack
 * Definition Language model files - one per concrete asset and transaction type.
 * Set a fileWriter property (instance of {@link FileWriter}) on the parameters
 * object to control where the generated code is written to disk.
 * @private
 * @class
 * @memberof module:composer-common
 */
class LoopbackVisitor {

    /**
     * Constructor.
     * @param {boolean} [namespaces] - whether or not namespaces should be used.
     */
    constructor(namespaces) {
        this.namespaces = !!namespaces;
    }

    /**
     * Visitor design pattern
     * @param {Object} thing - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visit(thing, parameters) {
        if (thing instanceof ModelManager) {
            return this.visitModelManager(thing, parameters);
        } else if (thing instanceof ModelFile) {
            return this.visitModelFile(thing, parameters);
        } else if (thing instanceof AssetDeclaration) {
            return this.visitAssetDeclaration(thing, parameters);
        } else if (thing instanceof ParticipantDeclaration) {
            return this.visitParticipantDeclaration(thing, parameters);
        } else if (thing instanceof ConceptDeclaration) {
            return this.visitConceptDeclaration(thing, parameters);
        } else if (thing instanceof TransactionDeclaration) {
            return this.visitTransactionDeclaration(thing, parameters);
        } else if (thing instanceof EventDeclaration) {
            return this.visitEventDeclaration(thing, parameters);
        } else if (thing instanceof EnumDeclaration) {
            return this.visitEnumDeclaration(thing, parameters);
        } else if (thing instanceof Field) {
            return this.visitField(thing, parameters);
        } else if (thing instanceof RelationshipDeclaration) {
            return this.visitRelationshipDeclaration(thing, parameters);
        } else if (thing instanceof EnumValueDeclaration) {
            return this.visitEnumValueDeclaration(thing, parameters);
        } else {
            throw new Error('Unrecognised type: ' + typeof thing + ', value: ' + util.inspect(thing, { showHidden: true, depth: 1 }));
        }
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
            .concat(modelFile.getConceptDeclarations())
            .concat(modelFile.getParticipantDeclarations())
            .concat(modelFile.getTransactionDeclarations())
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
        let name = this.namespaces ? assetDeclaration.getFullyQualifiedName() : assetDeclaration.getName();
        if (parameters.first) {
            jsonSchema = {
                $first: true,
                name: loopbackify(name),
                description: `An asset named ${assetDeclaration.getName()}`,
                plural: name,
                base: 'PersistedModel',
                idInjection: false,
                options: {
                    validateUpsert: true,
                    composer: {
                        type: 'asset'
                    }
                },
                properties: {},
                validations: [],
                relations: {},
                acls: [],
                methods: []
            };
            parameters.first = false;
        } else {
            jsonSchema.type = 'Object';
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(assetDeclaration, parameters, jsonSchema);

    }

    /**
     * Visitor design pattern
     * @param {ParticipantDeclaration} participantDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitParticipantDeclaration(participantDeclaration, parameters) {
        debug('entering visitParticipantDeclaration', participantDeclaration.getName());

        // If this is the first declaration, then we are building a schema for this participant.
        let jsonSchema = {};
        let name = this.namespaces ? participantDeclaration.getFullyQualifiedName() : participantDeclaration.getName();
        if (parameters.first) {
            jsonSchema = {
                $first: true,
                name: loopbackify(name),
                description: `A participant named ${participantDeclaration.getName()}`,
                plural: name,
                base: 'PersistedModel',
                idInjection: false,
                options: {
                    validateUpsert: true,
                    composer: {
                        type: 'participant'
                    }
                },
                properties: {},
                validations: [],
                relations: {},
                acls: [],
                methods: []
            };
            parameters.first = false;
        } else {
            jsonSchema.type = 'Object';
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(participantDeclaration, parameters, jsonSchema);

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

        // If this is the top declaration, then we are building a schema for this concept.
        let jsonSchema = {};
        let name = this.namespaces ? conceptDeclaration.getFullyQualifiedName() : conceptDeclaration.getName();
        if (parameters.first) {
            jsonSchema = {
                $first: true,
                name: loopbackify(name),
                description: `A concept named ${conceptDeclaration.getName()}`,
                plural: name,
                // Concepts are not PersistedModel instances as they cannot exist by themselves.
                // base: 'PersistedModel',
                idInjection: false,
                options: {
                    validateUpsert: true,
                    composer: {
                        type: 'concept'
                    }
                },
                properties: {},
                validations: [],
                relations: {},
                acls: [],
                methods: []
            };
            parameters.first = false;
        } else {
            jsonSchema.type = 'Object';
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(conceptDeclaration, parameters, jsonSchema);

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
        let name = this.namespaces ? transactionDeclaration.getFullyQualifiedName() : transactionDeclaration.getName();
        if (parameters.first) {
            jsonSchema = {
                $first: true,
                name: loopbackify(name),
                description: `A transaction named ${transactionDeclaration.getName()}`,
                plural: name,
                base: 'PersistedModel',
                idInjection: false,
                options: {
                    validateUpsert: true,
                    composer: {
                        type: 'transaction'
                    }
                },
                properties: {},
                validations: [],
                relations: {},
                acls: [],
                methods: []
            };
            parameters.first = false;
        } else {
            jsonSchema.type = 'Object';
        }

        // Apply all the common schema elements.
        return this.visitClassDeclarationCommon(transactionDeclaration, parameters, jsonSchema);

    }

    /**
     * Visitor design pattern
     * @param {EventDeclaration} eventDeclaration - the object being visited
     * @param {Object} parameters - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    visitEventDeclaration(eventDeclaration, parameters) {
        debug('entering visitEventDeclaration', eventDeclaration.getName());
        return null;
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

        // remember that we have visited this fqn
        // in case one of our properties is of the same type (issue #2193)
        parameters[classDeclaration.getFullyQualifiedName()] = 'visited';

        // Add information from the class declaration into the composer section.
        if (jsonSchema.options && jsonSchema.options.composer) {
            Object.assign(jsonSchema.options.composer, {
                namespace: classDeclaration.getNamespace(),
                name: classDeclaration.getName(),
                fqn: classDeclaration.getFullyQualifiedName(),
                abstract: classDeclaration.isAbstract()
            });
        }

        // Set the required properties into the schema.
        Object.assign(jsonSchema, {
            properties: {}
        });

        // If no description exists, add it now.
        if (!jsonSchema.description) {
            jsonSchema.description = `An instance of ${classDeclaration.getName()}`;
        }

        // Every class declaration has a $class property.
        jsonSchema.properties.$class = {
            type: 'string',
            default: classDeclaration.getFullyQualifiedName(),
            required: false,
            description: 'The class identifier for this type'
        };

        // Walk over all of the properties of this class and its super classes.
        classDeclaration.getProperties().forEach((property) => {

            // Get the schema for the property
            jsonSchema.properties[property.getName()] = property.accept(this, parameters);
        });

        // For transaction declarations, we need to change the model slightly.
        if (classDeclaration instanceof TransactionDeclaration) {

            // The ID field will be supplied at submission time, not by the client.
            jsonSchema.forceId = true;
            const identifierFieldName = classDeclaration.getIdentifierFieldName();
            jsonSchema.properties[identifierFieldName].generated = true;
            jsonSchema.properties[identifierFieldName].required = false;

            // The timestamp can be supplied by the client, but does not have to be.
            jsonSchema.properties.timestamp.required = false;
        }

        // If this is a top level schema, now we need to write it to disk.
        if (jsonSchema.$first) {
            delete jsonSchema.$first;
            let fileContents = JSON.stringify(jsonSchema, null, 4);
            if (parameters.fileWriter) {
                let name = this.namespaces ? classDeclaration.getFullyQualifiedName() : classDeclaration.getName();
                let fileName = `${name}.json`;
                parameters.fileWriter.openFile(fileName);
                parameters.fileWriter.write(fileContents);
                parameters.fileWriter.closeFile();
            }
        }

        // Return the created schema.
        return jsonSchema;

    }

    /**
     * Given a primitive Composer type returns the corresponding loopback type
     * @param {string} type - the composer primitive type name
     * @return {string} the loopback type
     * @private
     */
    static toLoopbackType(type) {

        let result = 'string';

        switch (type) {
        case 'String':
            result = 'string';
            break;
        case 'Double':
        case 'Integer':
        case 'Long':
            result= 'number';
            break;
        case 'DateTime':
            result = 'date';
            break;
        case 'Boolean':
            result = 'boolean';
            break;
        }

        return result;
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
            jsonSchema.type = LoopbackVisitor.toLoopbackType(field.getType());

            // If this field has a default value, add it.
            if (field.getDefaultValue()) {
                jsonSchema.default = field.getDefaultValue();
            }

            // If this is the identifying field, mark it as such.
            if (field.getName() === field.getParent().getIdentifierFieldName()) {
                jsonSchema.id = true;
                jsonSchema.description = 'The instance identifier for this type';
            }

        // Is this an enumeration?
        } else if (field.isTypeEnum()) {

            // Look up the type of the property.
            let type = field.getParent().getModelFile().getType(field.getType());

            // Visit it, and grab the schema.
            jsonSchema = type.accept(this, parameters);

            // If this field has a default value, add it.
            if (field.getDefaultValue()) {
                jsonSchema.default = field.getDefaultValue();
            }

        // Not primitive, so must be a class!
        } else {

            // Render the type as JSON Schema.
            let typeName = this.namespaces ? field.getFullyQualifiedTypeName() : field.getType();
            jsonSchema = {
                type: loopbackify(typeName)
            };

            // Look up the type of the property.
            let type = field.getParent().getModelFile().getType(field.getType());

            // Visit it, but ignore the response.
            // We do not visit types that have already been visited to prevent recursion (issue #2193)
            if(!parameters[field.getFullyQualifiedTypeName()]) {
                type.accept(this, parameters);
            }
        }

        // Is the type an array?
        if (field.isArray()) {

            // Set the type to an array of the already set type from above.
            jsonSchema.type = [ jsonSchema.type ];

            // Array properties have to be optional and have a default value as LoopBack does not cope with
            // the difference between a required array property and an empty array property (issue #3438).
            jsonSchema.default = [];
            jsonSchema.required = false;

        } else {

            // Is the field required?
            jsonSchema.required = !field.isOptional();

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
            type: 'string'
        };

        // Walk over all of the properties which should just be enum value declarations.
        jsonSchema.enum = enumDeclaration.getProperties().map((property) => {
            return property.accept(this, parameters);
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

        // The schema in this case is just the name of the value.
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
            type: 'any',
            description: `The identifier of an instance of ${relationshipDeclaration.getName()}`,
            required: !relationshipDeclaration.isOptional()
        };

        // Is the type an array?
        if (relationshipDeclaration.isArray()) {
            jsonSchema.type = [ jsonSchema.type ];
        }

        // Return the schema.
        return jsonSchema;

    }

}

module.exports = LoopbackVisitor;

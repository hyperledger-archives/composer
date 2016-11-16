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

const Resource = require('./model/resource');
const ResourceValidator = require('./serializer/resourcevalidator');
const ValidatedResource = require('./model/validatedresource');
const Relationship = require('./model/relationship');
const debug = require('debug')('ibm-concerto');
const Globalize = require('./globalize');
const uuid = require('node-uuid');
const TransactionDeclaration = require('./introspect/transactiondeclaration');

/**
 * Use the Factory to create instances of Resource: transactions, participants
 * and assets.
 * <p><a href="diagrams/factory.svg"><img src="diagrams/factory.svg" style="width:100%;"/></a></p>
 */
class Factory {

    /**
     * Create the factory.
     * <p>
     * <strong>Note: Only to be called by framework code. Applications should
     * retrieve instances from {@link Concerto}</strong>
     * </p>
     * @param {ModelManager} modelManager - The ModelManager to use for this registry
     */
    constructor(modelManager) {
        this.modelManager = modelManager;
    }

    /**
     * Create a new Resource with a given namespace, type name and id
     * @param {string} ns - the namespace of the Resource
     * @param {string} type - the type of the Resource
     * @param {string} id - the identifier
     * @param {boolean} disableValidation - pass true if you want the factory to
     * return a {@link Resource} instead of a {@link ValidatedResource}. Defaults to false.
     * @return {Resource} the new instance
     * @throws {ModelException} if the type is not registered with the ModelManager
     */
    newInstance(ns, type, id, disableValidation) {
        let modelFile = this.modelManager.getModelFile(ns);
        if(!modelFile) {
            let formatter = Globalize.messageFormatter('factory-newinstance-notregisteredwithmm');
            throw new Error(formatter({
                namespace: ns
            }));
        }

        if(!modelFile.isDefined(type)) {
            let formatter = Globalize.messageFormatter('factory-newinstance-typenotdeclaredinns');

            throw new Error(formatter({
                namespace: ns,
                type: type
            }));
        }

        let classDecl = modelFile.getType(type);

        if(classDecl.isAbstract()) {
            throw new Error('Cannot create abstract type ' + classDecl.getFullyQualifiedName());
        }

        let newObj = null;
        if(disableValidation) {
            newObj = new Resource(this.modelManager,ns,type,id);
        }
        else {
            newObj = new ValidatedResource(this.modelManager,ns,type,id, new ResourceValidator());
        }
        newObj.assignFieldDefaults();

        // if we have an identifier, we set it now
        let idField = classDecl.getIdentifierFieldName();
        if(idField) {
            newObj[idField] = id;
        }

        debug('Factory.newInstance created %s', id );
        return newObj;
    }

    /**
     * Create a new Relationship with a given namespace, type and identifier.
`     * A relationship is a typed pointer to an instance. I.e the relationship
     * with namespace = 'org.acme', type = 'Vehicle' and id = 'ABC' creates`
     * a pointer that points at an instance of org.acme.Vehicle with the id
     * ABC.
     *
     * @param {string} ns - the namespace of the Resource
     * @param {string} type - the type of the Resource
     * @param {string} id - the identifier
     * @return {Relationship} - the new relationship instance
     * @throws {ModelException} if the type is not registered with the ModelManager
     */
    newRelationship(ns, type, id) {
        let modelFile = this.modelManager.getModelFile(ns);
        if(!modelFile) {
            let formatter = Globalize.messageFormatter('factory-newrelationship-notregisteredwithmm');

            throw new Error(formatter({
                namespace: ns
            }));
        }

        if(!modelFile.isDefined(type)) {
            let formatter = Globalize.messageFormatter('factory-newinstance-typenotdeclaredinns');

            throw new Error(formatter({
                namespace: ns,
                type: type
            }));
        }

        let relationship = new Relationship(this.modelManager,ns,type,id);
        return relationship;
    }

    /**
     * Create a new transaction object. The identifier of the transaction is
     * set to a UUID.
     * @param {string} ns - the namespace of the transaction.
     * @param {string} type - the type of the transaction.
     * @return {Resource} A resource for the new transaction.
     */
    newTransaction(ns, type) {
        if (!ns) {
            throw new Error('ns not specified');
        } else if (!type) {
            throw new Error('type not specified');
        }
        let id = uuid.v4();
        let transaction = this.newInstance(ns, type, id);
        const classDeclaration = transaction.getClassDeclaration();

        if (!(classDeclaration instanceof TransactionDeclaration)) {
            throw new Error(transaction.getClassDeclaration().getFullyQualifiedName() + ' is not a transaction');
        }

        // set the timestamp
        transaction.timestamp = new Date();

        return transaction;
    }
}

module.exports = Factory;

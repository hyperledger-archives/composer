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

const IllegalAclException = require('./illegalaclexception');
const ModelBinding = require('./modelbinding');
const ParticipantDeclaration = require('../introspect/participantdeclaration');
const Operation = require('./operation');
const Predicate = require('./predicate');
const TransactionDeclaration = require('../introspect/transactiondeclaration');

/**
 * AclRule captures the details of an Access Control Rule. It is defined in terms of
 * an ACTION performed on a NOUN by a PARTICIPANT with a PREDICATE used to filter the
 * NOUN/PARTICPANT interaction.
 *
 * @private
 * @class
 * @memberof module:composer-common
 */
class AclRule {

    /**
     * Create an AclRule from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     *
     * @param {AclFile} aclFile - the AclFile for this rule
     * @param {string} ast - the AST created by the parser
     * @throws {IllegalAclException}
     */
    constructor(aclFile, ast) {
        if(!aclFile || !ast) {
            throw new IllegalAclException('Invalid AclFile or AST');
        }

        this.ast = ast;
        this.aclFile = aclFile;
        this.process();
    }

    /**
     * Visitor design pattern
     * @param {Object} visitor - the visitor
     * @param {Object} parameters  - the parameter
     * @return {Object} the result of visiting or null
     * @private
     */
    accept(visitor,parameters) {
        return visitor.visit(this, parameters);
    }

    /**
     * Returns the AclFile that owns this AclRule.
     *
     * @return {AclFile} the owning AclFile
     */
    getAclFile() {
        return this.aclFile;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalAclException}
     * @private
     */
    process() {
        this.name = this.ast.id.name;
        this.noun = new ModelBinding(this, this.ast.noun, this.ast.nounVariable);
        this.operation = new Operation(this, this.ast.operation);

        this.participant = null;
        if(this.ast.participant && this.ast.participant !== 'ANY') {
            this.participant = new ModelBinding(this, this.ast.participant, this.ast.participantVariable);
        }

        this.transaction = null;
        if(this.ast.transaction) {
            this.transaction = new ModelBinding(this, this.ast.transaction.binding, this.ast.transaction.variableBinding);
        }

        this.predicate = null;
        if(this.ast.predicate) {
            this.predicate = new Predicate(this, this.ast.predicate);
        }
        else {
            this.predicate = new Predicate(this, 'true');
        }

        this.action = this.ast.action;
        this.description = this.ast.description;
    }

    /**
     * Semantic validation of the structure of this AclRule.
     *
     * @throws {IllegalAclException}
     * @private
     */
    validate() {
        this.noun.validate();
        this.operation.validate();

        if(this.participant) {
            this.participant.validate();

            let participantClassDeclaration = this.participant.getClassDeclaration();
            if (participantClassDeclaration && !(participantClassDeclaration instanceof ParticipantDeclaration)) {
                throw new IllegalAclException(`Expected '${participantClassDeclaration.getName()}' to be a participant`, this.aclFile, this.participant.ast.location);
            }
        }

        if(this.transaction) {
            this.transaction.validate();

            let transactionClassDeclaration = this.transaction.getClassDeclaration();
            if (transactionClassDeclaration && !(transactionClassDeclaration instanceof TransactionDeclaration)) {
                throw new IllegalAclException(`Expected '${transactionClassDeclaration.getName()}' to be a transaction`, this.aclFile, this.transaction.ast.location);
            }
        }

        if(this.predicate) {
            this.predicate.validate();
        }
    }

    /**
     * Returns the name of this AclRule.
     *
     * @return {string} the name of the AclRule
     */
    getName() {
        return this.name;
    }

    /**
     * Returns the noun for this ACL rule.
     *
     * @return {ModelBinding} the noun ModelBinding
     */
    getNoun() {
        return this.noun;
    }

    /**
     * Returns the verb associated with this ACL Rule.
     *
     * @return {string} the verb
     */
    getVerbs() {
        return this.operation.verbs;
    }

    /**
     * Returns the participant for this ACL rule. Returns null if this rule
     * does not filter based on participant.
     *
     * @return {ModelBinding} the participant ModelBinding or null
     */
    getParticipant() {
        return this.participant;
    }

    /**
     * Returns the transaction for this ACL rule. Returns null if this rule
     * does not filter based on transaction.
     *
     * @return {ModelBinding} the transaction ModelBinding or null
     */
    getTransaction() {
        return this.transaction;
    }

    /**
     * Returns the predicate associated with this ACL Rule
     *
     * @return {Predicate} the predicate
     */
    getPredicate() {
        return this.predicate;
    }

    /**
     * Returns the action associated with this ACL Rule.
     *
     * @return {string} the action
     */
    getAction() {
        return this.action;
    }

    /**
     * Returns the description associated with this ACL Rule.
     *
     * @return {string} the description
     */
    getDescription() {
        return this.description;
    }

}

module.exports = AclRule;

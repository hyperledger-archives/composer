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

/**
 * Hyperledger-Composer module. Hyperledger-Composer is a framework for creating
 * blockchain backed digital networks and exchanging assets between participants
 * via processing transactions.
 * @module composer-common
 */

/**
 * Check whether we're running in a version of node which has the updated Buffer implementation
 * Used above to fall back to the old version if needed.
 * @return {boolean} whether the new version is supported
 */
function nodeHasNewBufferVersion() {
    try {
        Buffer.from('b2xkbm9kZQ==', 'base64');
        return true;
    } catch (e) {
        /* istanbul ignore next */
        return false;
    }
}

/* istanbul ignore next */
if (!nodeHasNewBufferVersion()) {
    const originalBufferFrom = Buffer.from;
    const newBufferFrom = function (str, encoding) {
        if (arguments.length === 2 && typeof str === 'string' && encoding === 'base64') {
            return new Buffer(str, encoding);
        }
        return originalBufferFrom.apply(null, arguments);
    };
    Object.defineProperty(Buffer, 'from', { value: newBufferFrom });
}
module.exports.AclRule = require('./lib/acl/aclrule');
module.exports.AclFile = require('./lib/acl/aclfile');
module.exports.AclManager = require('./lib/aclmanager');
module.exports.AssetDeclaration = require('./lib/introspect/assetdeclaration');
module.exports.BaseException = require('./lib/baseexception');
module.exports.BaseFileException = require('./lib/basefileexception');
module.exports.BusinessNetworkCardStore = require('./lib/cardstore/businessnetworkcardstore');
module.exports.BusinessNetworkDefinition = require('./lib/businessnetworkdefinition');
module.exports.BusinessNetworkMetadata = require('./lib/businessnetworkmetadata');
module.exports.Certificate = require('./lib/certificate');
module.exports.CertificateUtil = require('./lib/certificateutil');
module.exports.ClassDeclaration = require('./lib/introspect/classdeclaration');
module.exports.CodeGen = require('./lib/codegen/codegen.js');
module.exports.CommitDecoratorFactory = require('./lib/commitdecoratorfactory');
module.exports.Concept = require('./lib/model/concept');
module.exports.ConceptDeclaration = require('./lib/introspect/conceptdeclaration');
module.exports.Connection = require('./lib/connection');
module.exports.ConnectionManager = require('./lib/connectionmanager');
module.exports.ConnectionProfileManager = require('./lib/connectionprofilemanager');
module.exports.ConsoleLogger = require('./lib/log/consolelogger');
module.exports.EnumDeclaration = require('./lib/introspect/enumdeclaration');
module.exports.EnumValueDeclaration = require('./lib/introspect/enumvaluedeclaration');
module.exports.EventDeclaration = require('./lib/introspect/eventdeclaration');
module.exports.Field = require('./lib/introspect/field');
module.exports.Factory = require('./lib/factory');
module.exports.FileWallet = require('./lib/filewallet');
module.exports.FileWriter = require('./lib/codegen/filewriter');
module.exports.NetworkCardStoreManager = require('./lib/cardstore/networkcardstoremanager');
module.exports.FunctionDeclaration = require('./lib/introspect/functiondeclaration');
module.exports.Globalize = require('./lib/globalize');
module.exports.IdCard = require('./lib/idcard');
module.exports.IndexCompiler = require('./lib/indexcompiler');
module.exports.Introspector = require('./lib/introspect/introspector');
module.exports.Limit = require('./lib/query/limit');
module.exports.Logger = require('./lib/log/logger');
module.exports.LoopbackVisitor = require('./lib/codegen/fromcto/loopback/loopbackvisitor');
module.exports.ModelFile = require('./lib/introspect/modelfile');
module.exports.ModelManager = require('./lib/modelmanager');
module.exports.OrderBy = require('./lib/query/orderby');
module.exports.ParticipantDeclaration = require('./lib/introspect/participantdeclaration');
module.exports.Property = require('./lib/introspect/property');
module.exports.Query = require('./lib/query/query');
module.exports.QueryAnalyzer = require('./lib/query/queryanalyzer.js');
module.exports.QueryFile = require('./lib/query/queryfile');
module.exports.QueryManager = require('./lib/querymanager');
module.exports.ReadOnlyDecoratorFactory = require('./lib/readonlydecoratorfactory');
module.exports.Relationship = require('./lib/model/relationship');
module.exports.RelationshipDeclaration = require('./lib/introspect/relationshipdeclaration');
module.exports.Resource = require('./lib/model/resource');
module.exports.ReturnsDecoratorFactory = require('./lib/returnsdecoratorfactory');
module.exports.ScriptManager = require('./lib/scriptmanager');
module.exports.Script = require('./lib/introspect/script');
module.exports.SecurityContext = require('./lib/securitycontext');
module.exports.SecurityException = require('./lib/securityexception');
module.exports.Select = require('./lib/query/select');
module.exports.Serializer = require('./lib/serializer');
module.exports.Skip = require('./lib/query/skip');
module.exports.Sort = require('./lib/query/sort');
module.exports.TransactionDeclaration = require('./lib/introspect/transactiondeclaration');
module.exports.Typed = require('./lib/model/typed');
module.exports.TypescriptVisitor = require('./lib/codegen/fromcto/typescript/typescriptvisitor');
module.exports.Util = require('./lib/util');
module.exports.ModelUtil = require('./lib/modelutil');
module.exports.Wallet = require('./lib/wallet');
module.exports.Where = require('./lib/query/where');
module.exports.Writer = require('./lib/codegen/writer.js');
module.exports.version = require('./package.json');

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

const Globalize = require('./globalize');

/**
 * Internal Model Utility Class
 * <p><a href="./diagrams-private/modelutil.svg"><img src="./diagrams-private/modelutil.svg" style="height:100%;"/></a></p>
 * @private
 * @class
 * @memberof module:composer-common
 */
class ModelUtil {

    /**
     * Returns everything after the last dot, if present, of the source string
     * @param {string} fqn - the source string
     * @return {string} - the string after the last dot
     * @private
     */
    static getShortName(fqn) {
        //console.log('toShortName ' + name );
        let result = fqn;
        let dotIndex = fqn.lastIndexOf('.');
        if (dotIndex > -1) {
            result = fqn.substr(dotIndex + 1);
        }

        //console.log('result ' + result );
        return result;
    }

    /**
     * Returns the namespace for a the fully qualified name of a type
     * @param {string} fqn - the fully qualified identifier of a type
     * @return {string} - namespace of the type (everything before the last dot)
     * or the empty string if there is no dot
     * @private
     */
    static getNamespace(fqn) {
        if (!fqn) {
            throw new Error(Globalize.formatMessage('modelutil-getnamespace-nofnq'));
        }

        let result = '';
        let dotIndex = fqn.lastIndexOf('.');
        if (dotIndex > -1) {
            result = fqn.substr(0, dotIndex);
        }

        return result;
    }

    /**
     * Returns true if the type is a primitive type
     * @param {string} type - the name of the type
     * @return {boolean} - true if the type is a primitive
     * @private
     */
    static isPrimitiveType(type) {
        const primitiveTypes = ['Boolean', 'String', 'DateTime', 'Double', 'Integer', 'Long'];
        return (primitiveTypes.indexOf(type) >= 0);
    }

    /**
     * Returns true if the type is assignable to the propertyType.
     *
     * @param {ModelFile} modelFile - the ModelFile that owns the Property
     * @param {string} type - the FQN of the type we are trying to assign
     * @param {Property} property - the property that we'd like to store the
     * type in.
     * @return {boolean} - true if the type can be assigned to the property
     * @private
     */
    static isAssignableTo(modelFile, type, property) {
        if(ModelUtil.isPrimitiveType(type)) {
            throw new Error('This method only works with complex types.');
        }

        if(ModelUtil.isPrimitiveType(property.getName())) {
            return false;
        }

        // console.log( 'type ' + type );
        // console.log( 'property ' + property.getFullyQualifiedName() );

        // simple case
        if(type === property.getFullyQualifiedTypeName()) {
            return true;
        }

        // type = SuperType
        // property = BaseType
        // return = true
        const typeDeclaration = modelFile.getType(type);
        if(!typeDeclaration) {
            throw new Error('Cannot find type ' + type );
        }

        let superTypeName = typeDeclaration.getSuperType();
        let superType = modelFile.getType(superTypeName);

        while(superType) {
            if(superType.getFullyQualifiedName() === property.getFullyQualifiedTypeName()) {
                return true;
            }
            // console.log('superType ' + superType.getFullyQualifiedName() );
            superTypeName = superType.getSuperType();
            if(superTypeName) {
                superType = modelFile.getType(superTypeName);
            }
            else {
                superType = null;
            }
        }

        return false;
    }

    /**
     * Returns the passed string with the first character capitalized
     * @param {string} string - the string
     * @return {string} the string with the first letter capitalized
     * @private
     */
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Returns the true if the given field is an enumerated type
     * @param {Field} field - the string
     * @return {boolean} true if the field is declared as an enumeration
     * @private
     */
    static isEnum(field) {
        const modelFile = field.getParent().getModelFile();
        const typeDeclaration = modelFile.getType(field.getType());
        return (typeDeclaration !== null && typeDeclaration.isEnum());
    }
}

module.exports = ModelUtil;

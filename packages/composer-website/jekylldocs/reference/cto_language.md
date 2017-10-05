---
layout: default
title: Modeling Language
section: reference
index-order: 1002
sidebar: sidebars/accordion-toc0.md
excerpt: The [**Hyperledger Composer modeling language**](./cto_language.html) is an object-oriented language which defines the business network model containing assets, participants, and transactions.
---

# {{site.data.conrefs.composer_full}} Modeling Language

---

{{site.data.conrefs.composer_full}} includes an object-oriented modeling language that is used to define the domain model for a business network definition.

A {{site.data.conrefs.composer_full}} CTO file is composed of the following elements:

1. A single namespace. All resource declarations within the file are implicitly in this namespace.
2. A set of resource definitions, encompassing assets, transactions, participants, and events.
3. Optional import declarations that import resources from other namespaces.

## Organization and {{site.data.conrefs.composer_full}} System Namespaces

Your organization namespace is defined in the namespace line of your model (`.cto`) file, and all resources created are implicitly part of this namespace.

As well as defining new classes of asset, participant, event, and transaction, there is a [system namespace](https://github.com/hyperledger/composer/blob/master/packages/composer-common/lib/system/org.hyperledger.composer.system.cto) which contains the base definitions of asset, event, participant, and transaction. These base definitions are abstract types which are implicitly extended by all assets, events, participants, and transactions.

In the system namespace definitions, asset and participant have no required values. Events and transactions are defined by an eventId or transactionId and a timestamp. The system namespace also includes definitions of registries, historian records, identities, and a number of system transactions.

>If you have defined an event or transaction including an eventId, transactionId, or timestamp, you must delete the eventId, transactionId, or timestamp properties.


## Declarations of resources

Resources in {{site.data.conrefs.composer_full}} include:

- Assets, Participants, Transactions, and Events.
- Enumerated Types.
- Concepts.

Assets, Participants and Transactions are class definitions. The concepts of Asset, Participant and Transaction may be considered to be different stereotypes of the class type.

A class in {{site.data.conrefs.composer_full}} is referred to as a Resource Definition, therefore an asset instance has an Asset Definition.

A resource definition has the following properties:

1. A namespace defined by the namespace of its parent file. The namespace of a `.cto` file implicitly applies to all resources created in it.
2. A name, for example `Vehicle`, and an identifying field, for example, `vin`. If the resource is an asset or participant, the name is followed by the identifying field, if the resource is an event or transaction, the identifying field is set automatically. In this example, the asset is named `Vehicle` and the identifying field is `vin`.


        /**
         * A vehicle asset.
         */
        asset Vehicle identified by vin {
          o String vin
        }


3. An optional super-type, which the resource definition extends. The resource will take all properties and fields required by the super-type and add any additional properties or fields from its own definition.


        /**
         * A car asset. A car is related to a list of parts
         */
        asset Car extends Vehicle {
          o String model
          --> Part[] Parts
        }


4. An optional 'abstract' declaration, to indicate that this type cannot be created. Abstract resources can be used as a basis for other classes to extend. Extensions of abstract classes do not inherit the abstract status. For example, the asset `Vehicle` defined above should never be created, as there should be more specific asset classes defined to extend it.


        /**
        * An abstract Vehicle asset.
        */
        abstract asset Vehicle identified by vin {
          o String vin
        }


5. A set of named properties. The properties must be named, and the primitive data type defined.The properties and their data are owned by each resource, for example, a `Car` asset has a `vin`, and a `model` property, both of which are strings.
6. A set of relationships to other Composer types that are not owned by the resource but that may be referenced from the resource. Relationships are unidirectional.


    /**
     * A Field asset. A Field is related to a list of animals
     */
    asset Field identified by fieldId {
      o String fieldId
      o String name
      --> Animal[] animals
    }


### Declarations of enumerated types

Enumerated types are used to specify a type that may have 1 or N possible values. The example below defines the ProductType enumeration, which may have the value `DAIRY` or `BEEF` or `VEGETABLES`.

```
/**
* An enumerated type
*/
enum ProductType {
o DAIRY
o BEEF
o VEGETABLES
}
```

When another resource is created, for example, a participant, a property of that resource can be defined in terms of an enumerated type.

```
participant Farmer identified by farmerId {
    o String farmerId
    o ProductType primaryProduct
```


### Concepts

Concepts are abstract classes that are not assets, participants or transactions. They are typically contained by an asset, participant or transaction.

For example, below an abstract concept `Address` is defined, and then specialized into a `UnitedStatesAddress`. Note that concepts do not have an `identified by` field as they cannot be directly stored in registries or referenced in relationships.

```
abstract concept Address {
  o String street
  o String city default ="Winchester"
  o String country default = "UK"
  o Integer[] counts optional
}

concept UnitedStatesAddress extends Address {
  o String zipcode
}
```


### Primitive types

Composer resources are defined in terms of the following primitive types:

1. String: a UTF8 encoded String.
2. Double: a double precision 64 bit numeric value.
3. Integer: a 32 bit signed whole number.
4. Long: a 64 bit signed whole number.
5. DateTime: an ISO-8601 compatible time instance, with optional time zone and UTZ offset.
6. Boolean: a Boolean value, either true or false.

### Arrays

All types in Composer may be declared as arrays using the [] notation.

    Integer[] integerArray

Is an array of Integers stored in a field called 'integerArray'. While

    --> Animal[] incoming

Is an array of relationships to the Animal type, stored in a field called
'incoming'.

### Relationships

A relationship in the Composer language is a tuple composed of:

1. The namespace of the type being referenced
2. The type name of the type being referenced
3. The identifier of the instance being referenced

Hence a relationship could be to:
    org.example.Vehicle#123456

This would be a relationship to the Vehicle type declared in the org.example
namespace with the identifier 123456.

Relationships are unidirectional and deletes do not cascade, ie. removing the relationship has no impact on the thing that is being pointed to. Removing the thing being pointed to does not invalidate the relationship.

Relationships must be *resolved* to retrieve an instance of the object being
referenced. The act of resolution may result in null, if the object no longer
exists or the information in the relationship is invalid.

### Field Validators

String fields may include an optional regular expression, which is used to validate the contents of the field. Careful use of field validators allows Composer to perform rich data validation, leading to fewer errors and less boilerplate code.

The example below declares that the `Farmer` participant contains a field `postcode` that must conform to the regular expression for valid UK postcodes.

```
participant Farmer extends Participant {
    o String firstName default="Old"
    o String lastName default="McDonald"
    o String address1
    o String address2
    o String county
    o String postcode regex=/(GIR 0AA)|((([A-Z-[QVf]][0-9][0-9]?)|(([A-Z-[QVf]][A-Z-[IJZ]][0-9][0-9]?)|(([A-Z-[QVf]][0-9][A-HJKPSTUW])|([A-Z-[QVf]][A-Z-[IJZ]][0-9][ABEHMNPRVWfY])))) [0-9][A-Z-[CIKMOV]]{2})/
}
```

Double, Long or Integer fields may include an optional range expression, which is used to validate the contents of the field.

The example below declared that the `Vehicle` asset has an Integer field `year` which defaults to 2016 and must be 1990, or higher. Range expressions may omit the lower or upper bound if checking is not required.

```
asset Vehicle extends Base {
  // An asset contains Fields, each of which can have an optional default value
  o String model default="F150"
  o String make default="FORD"
  o String reg default="ABC123"
  // A numeric field can have a range validation expression
  o Integer year default=2016 range=[1990,] optional // model year must be 1990 or higher
  o Integer[] integerArray
  o State state
  o Double value
  o String colour
  o String V5cID regex=/^[A-z][A-z][0-9]{7}/
  o String LeaseContractID
  o Boolean scrapped default=false
  o DateTime lastUpdate optional
  --> Participant owner //relationship to a Participant, with the field named 'owner'.
  --> Participant[] previousOwners optional // Nary relationship
  o Customer customer
}
```

## Imports

Use the `import` keyword with a fully-qualified type name to import a type from another namespace. Alternatively use the `.*` notation to import all the types from another namespace.

```
import org.example.MyAsset
import org.example2.*
```

## Decorators

Resources and properties of resources may have decorators attached. Decorators are used to annotate a model with metadata. The example below adds the `foo` decorator to the Buyer participant, with "arg1' and 2 passed as arguments to the decorator.

Similarly decorators can be attached to properties, relationships and enumerated values.

```
@foo("arg1", 2)
participant Buyer extends Person {
}
```

Resource definitions and properties may be decorated with 0 or more decorations. Note that only a single instance of a decorator is allowed on each element type. I.e. it is invalid to have the `@bar` decorator listed twice on the same element.

## Decorator Arguments

Decorators may have an arbitrary list of arguments (0 or more items). Argument values must be strings, numbers or booleans.

## Decorator APIs

Decorators are accessible at runtime via the ModelManager introspect APIs. This allows external tools and utilities to use the Composer Modelling Language (CTO) file format to describe a core model, while decorating it with sufficient metadata for their own purposes.

The example below retrieves the 3rd argument to the foo decorator attached to the myField property of a class declaration:

```
const val = myField.getDecorator('foo').getArguments()[2];
```

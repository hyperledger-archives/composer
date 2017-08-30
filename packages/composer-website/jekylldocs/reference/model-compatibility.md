---
layout: default
title: Model Compatibility
category: reference
section: reference
sidebar: sidebars/accordion-toc0.md
excerpt: Composer models are expected to change and evolve over time. However some care and discipline must be applied when making model changes to ensure that existing instances are still valid with respect to the new model.
index-order: 1005
---

# Model Compatibility

Composer models are expected to change and evolve over time. However some care and discipline must be applied when making model changes to ensure that existing instances are still valid with respect to the new model.

A model M' is **compatible** with model M if instances created with model M are valid with respect to model M'. If the instances are valid, then they may be deserialized using the `Serializer`.

The following terms are used throughout this document:

- _Class_ : the declaration of the structure of an asset, participant, transaction, concept or event
- _Instance_ : an instance of a class, for example if org.example.Vehicle is an asset (class), then org.example.Vehicle#ABC123 is an **instance** of an org.acme.Vehicle
- _Property_ : a member (or field) defined by a class, including a relationship. For example the class org.example.Vehicle may have a property called `model` of type `string`.


A class (the asset SampleAsset):

```
namespace org.acme.sample

asset SampleAsset identified by assetId {
  o String assetId
  --> SampleParticipant owner
  o String value
}
```

An instance of the class:

```
{
  "$class": "org.acme.sample.SampleAsset",
  "assetId": "assetId:6463",
  "owner": "resource:org.acme.sample.SampleParticipant#participantId:8091",
  "value": "secret plant frequently ruler"
}
```


## Evolution of Namespaces

A new class may be added to a namespace without breaking compatibility with pre-existing instances.

## Evolution of Classes

This section describes the effects of changes to the declaration of a class and its properties on pre-existing instances.

### Renaming

Renaming a class will break compatibility with any pre-existing instances of the class, or relationships to the class.

### abstract Classes

If a class that was not declared abstract is changed to be declared abstract, then attempts to create new instances of that class will throw an error at runtime; such a change is therefore not recommended for widely distributed classes.

Changing a class that is declared abstract to no longer be declared abstract does not break compatibility with pre-existing instances.

### Superclasses

An error is thrown at load time if a class would be a superclass of itself. Changes to the class hierarchy that could result in such a circularity when instances are loaded are not recommended for widely distributed classes.

Changing the direct superclass of a class type will not break compatibility with pre-existing instances, provided that the total set of superclasses of the class type loses no properties.

If a change to the direct superclass results in any class no longer being a superclass respectively, then errors may result if pre-existing instances have relationships to the modified class. Such changes are not recommended for widely distributed classes.

### Class Properties

No incompatibility with pre-existing instances is caused by adding a property to a class if the property is either declared as `optional` or is assigned a `default` value. Adding new properties that are neither optional nor have a default will break compatibility with any pre-existing instances of the class.

Changing the cardinality of a property (changing an array `[]` to a non-array or vice-a-versa) will break compatibility with any pre-existing instances of the class.

Deleting a property from a class will break compatibility with any pre-existing instances that reference this field.

Changing the type of a property may cause an error if the property is used by a pre-existing instance.

Changing the validation expression of a property may cause an error if the property is used by a pre-existing instance.

Properties that are relationships follow the same rules as for other types.

### Evolution of Enums

Adding or reordering constants in an enum type will not break compatibility with pre-existing instances.

If a pre-existing instance attempts to access an enum constant that no longer exists, an error will occur. Therefore such a change is not recommended for widely distributed enums.

In all other respects, the model evolutions rules for enums are identical to those for classes.

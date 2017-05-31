---
layout: default
title: Hyperledger Composer - Access Contol Language
category: reference
sidebar: sidebars/reference.md
excerpt: Guide to the Hyperledger Composer access control language
---

# {{site.data.conrefs.composer_full}} Access Control Language

---

{{site.data.conrefs.composer_full}} includes an access control language (ACL) that provides declarative access control over the elements of the domain model. By defining ACL rules you can determine which users/roles are permitted to create, read, update or delete elements in a business network's domain model.

### Evaluation of Access Control Rules

Access control for a business network is defined by an ordered set of ACL rules. The rules are evaluated in order, and the first rule whose condition matches determines whether access is granted or denied. If no rule match then access is **denied**.

ACL rules are defined in a file called `permissions.acl` in the root of the business network. If this file is missing from the business network then all access is **permitted**.

### Access Control Rule Grammer

There are two types of ACL rules: simple ACL rules and conditional ACL rules. Simple rules are used to control access to a namespace, asset or property of an asset by a participant type or participant instance.

For example, the rule below states that any instance of the `org.acme.SampleParticipant` type can perform ALL operations on all instances of `org.acme.SampeAsset`.

````
rule SimpleRule {
    description: "Description of the ACL rule"
    participant: "org.acme.SampleParticipant"
    operation: ALL
    resource: "org.acme.SampeAsset"
    action: ALLOW
}
````

Conditional ACL rules introduce variable bindings for the participant and the resource being accessed, and a Boolean JavaScript expression, which, when true, can either ALLOW or DENY access to the resource by the participant.

For example, the rule below states that any instance of the `org.acme.SampleParticipant` type can perform ALL operations on all instances of `org.acme.SampeAsset` IF the participant is the owner of the asset.

````
rule SampleConditionalRule {
    description: "Description of the ACL rule"
    participant(m): "org.acme.SampleParticipant"
    operation: ALL
    resource(v): "org.acme.SampeAsset"
    condition: (v.owner.getIdentifier() == m.getIdentifier())
    action: ALLOW
}
````

Multiple ACL rules may be defined that conceptually define a decision table. The actions of the decision tree define access control decisions (ALLOW or DENY). If the decision table fails to match then by default access is denied.

**Resource** defines the things that the ACL rule applies to. This can be a property on a class, an entire class or all classes within a namespace. It can also be an instance of a class.

Resource Examples:
- Namespace: org.acme
- Class in namespace: org.acme.Car
- Property on class: org.acme.Car.owner
- Instance of a class: org.acme.Car#ABC123

**Operation** identifies the action that the rule governs. It must be one of: CREATE, READ, UPDATE, DELETE or ALL.

**Participant** defines the person or entity that has submitted a transaction for processing. If a Participant is specified they must exist in the Participant Registry. The PARTICIPANT may optionally be bound to a variable for use in a PREDICATE. The special value 'ANY' may be used to denote that participant type checking is not enforced for a rule.

**Condition** is a Boolean JavaScript expression over bound variables. Any JavaScript expression that is legal with the an `if(...)` expression may be used here.

**Action** identifies the action of the rule. It must be one of: ALLOW, DENY.

### Examples

Example ACL rules (in evaluation order):

```
rule R1 {
    description: "Fred can DELETE the car ABC123"
    participant: "org.acme.Driver#Fred"
    operation: DELETE
    resource: "org.acme.Car#ABC123"
    action: ALLOW
}

rule R2 {
    description: "regulator with ID Bill can not update a Car if they own it"
    participant(r): "org.acme.Regulator#Bill"
    operation: UPDATE
    resource(c): "org.acme.Car"
    condition: (c.owner == r)
    action: DENY
}

rule R3 {
    description: "Driver can change the ownership of a car that they own"
    participant(d): "org.acme.Driver"
    operation: UPDATE
    resource(o): "org.acme.Car"
    condition: (o == d)
    action: ALLOW
}

rule R4 {
    description: "regulators can perform all operations on Cars"
    participant: "org.acme.Regulator"
    operation: ALL
    resource: "org.acme.Car"
    action: ALLOW
}

rule R5 {
    description: "Everyone can read all resources in the org.acme namespace"
    participant: "ANY"
    operation: READ
    resource: "org.acme"
    action: ALLOW
}
```

Rules are evaluated from top (most specific) to bottom (least specific). As soon as the Participant, Operation and Resource match for a rule then subsequent rules are not evaluated.

This ordering makes the decision table faster to scan for both humans and computers. If no ACL rule fires then the access control decision is DENY.

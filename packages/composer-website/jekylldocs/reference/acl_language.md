---
layout: default
title: Fabric Composer - Access Contol Language
category: reference
sidebar: sidebars/reference.md
excerpt: Guide to the Fabric Composer access control language
---

# Fabric Composer Access Control Language

---

Fabric Composer includes an access control language (ACL) that provides declarative access control over the elements of the domain model. By defining ACL rules you can determine which users/roles are permitted to create, read, update or delete elements in a business network's domain model.

### Evaluation of Access Control Rules

Access control for a business network is defined by an ordered set of ACL rules. The rules are evaluated in order, and the first rule whose condition matches determines whether access is granted or denied. If no rule match then access is **denied**.

ACL rules are defined in a file called `permissions.acl` in the root of the business network. If this file is missing from the business network then all access is **permitted**.

### Access Control Rule Grammer

ACL rules follow a tabular format, of the form:

````
ID | NOUN | VERB | PARTICIPANT | PREDICATE  | ACTION
````

Multiple ACL rules may be defined that conceptually define a decision table. The actions of the decision tree define access control decisions (ALLOW or DENY). If the decision table fails to match then by default access is denied.

**NOUN** defines the things that the ACL rule applies to. This can be a property on a class, an entire class or all classes within a namespace. It can also be an instance of a class, or a property on an instance of a class.

Noun Examples:
- Namespace: org.acme
- Class in namespace: org.acme.Car
- Property on class: org.acme.Car.owner
- Instance of a class: org.acme.Car#ABC123
- Property on an instance of a class: org.acme.Car.owner#ABC123

**VERB** identifies the action that the rule governs. It must be one of: CREATE, READ, UPDATE, DELETE or ALL.

**PARTICIPANT** defines the person or entity that has submitted a transaction for processing. If a Participant is specified they must exist in the Participant Registry. The PARTICIPANT may optionally be bound to a variable for use in a PREDICATE. The special value 'EVERYONE' may be used to denote that participant type checking is not enforced for a rule.

**PREDICATE** is a Boolean Javascript expression over bound variables. Any Javascript expression that is legal with the an `if(...)` expression may be used here.

**ACTION** identifies the action of the rule. It must be one of: ALLOW, DENY.

### Examples

Example ACL rules (in evaluation order):

```
R1 | org.acme.Car#ABC123 | DELETE | org.acme.Driver#Fred | NONE | ALLOW | Fred can DELETE the car ABC123
R2 | org.acme.Car | UPDATE | org.acme.Regulator#Bill:r | org.acme.Car.owner == r | DENY | regulator with ID Bill can not update a Car if they own it
R3 | org.acme.Car.owner | UPDATE | org.acme.Driver:d | org.acme.Car.owner == d  | ALLOW | Driver can change the ownership of a car that they own
R4 | org.acme.Car | ALL | org.acme.Regulator | TRUE | ALLOW | regulators can perform all operations on Cars
R5 | org.acme | READ | EVERYONE | TRUE | ALLOW | Everyone can read all resources in the org.acme namespace
```

Rules are evaluated from top (most specific) to bottom (least specific). As soon as a the Noun, Verb and Predicate match for a rule then subsequent rules are not evaluated.

This ordering makes the decision table faster to scan for both humans and computers. If no ACL rule fires then the access control decision must be DENY.

---
layout: default
title: Hyperledger Composer Identity Import Command
category: reference
section: reference
sidebar: sidebars/reference.md
excerpt: Hyperledger Composer Identity Import Command
---

# Composer Identity Import

---

The `composer identity import` command imports peer admin identities from a running instance of {{site.data.conrefs.hlf_full}} into a defined `keyValStore`. These admin identities can then be used to deploy business networks to that peer.

All the options are required. The `userId` doesn't have to match any information defined in the signer certificate of the admin identity for the peer, it is purely a label for your own convenience.


## Syntax example

```
node cli.js identity import -p hlfv1 -u PeerAdmin -c ./peerOrganizations/org1.example.com/users/Admin@org1.example.com/signcerts/Admin@org1.example.com-cert.pem -k ./peerOrganizations/org1.example.com/users/Admin@org1.example.com/keystore/9022d671ceedbb24af3ea69b5a8136cc64203df6b9920e26f48123fcfcb1d2e9_sk
```

## Options

```
composer identity import [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --connectionProfileName, -p  The connection profile name  [string] [required]
  --userId, -u                 The user ID for the new identity  [string] [required]
  --publicKeyFile, -c          File containing the public key  [string] [required]
  --privateKeyFile, -k         File containing the private key  [string] [required]
```

#### Define connection profile name

`-p` or `--connectionProfileName`

Example: `-p hlfv1`

---

#### Define user ID for new identity

`-u` or `--userId`

Example: `-u Org1PeerAdmin`

---

#### Define signers public certificate

`-c` or `--publicKeyFile`

Example: `-c admin.pem`

---

#### Define signers private key file

`-k` or `--privateKeyFile`

Example: `-k 9022d671ceedbb24af3ea69b5a8136cc64203df6b9920e26f48123fcfcb1d2e9_sk`

---

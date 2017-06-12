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
composer identity import -p hlfv1 -u Org1PeerAdmin -c admin.pem -k 9022d671ceedbb24af3ea69b5a8136cc64203df6b9920e26f48123fcfcb1d2e9_sk
```

## Options

```
composer identity import [options]

Options:
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --connectionProfileName, -p  The connection profile name  [string] [required]
  --userId, -u                 The user ID for the new identity  [string] [required]
  --signerCertFile, -c         signerCert path  [string] [required]
  --keyFile, -k                key file  [string] [required]
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

`-c` or `--signerCertFile`

Example: `-c admin.pem`

---

#### Define signers private key file

`-k` or `--keyFile`

Example: `-k 9022d671ceedbb24af3ea69b5a8136cc64203df6b9920e26f48123fcfcb1d2e9_sk`

---

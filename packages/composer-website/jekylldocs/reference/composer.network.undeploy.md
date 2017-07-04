---
layout: default
title: Hyperledger Composer Network Undeploy CLI
section: reference-command
sidebar: sidebars/reference.md
excerpt: Composer Network Undeploy CLI
---

# {{site.data.conrefs.composer_full}} Network Undeploy

---

The `composer network undeploy` command **permanently disables a business network**. Once a business network has been undeployed, it cannot be redeployed.

**Please Note**: When using the `undeploy` command with a business network running on {{site.data.conrefs.hlf_full}} v1.0, the business network remains running, but will become unresponsive. The business network **cannot be redeployed or updated once the `undeploy` command has been issued.** This is because the business network is already deployed, but has been set to be unresponsive.

```
composer network undeploy -a <business-network-archive> -i <enrollment-id> -s <enrollment-secret>
```

Note that **after undeploy the business network definition can no longer be used**, however the docker container
associated with the business network definition is still running. The docker container for the business network
definition must be explicitly stopped and removed if no longer needed.

### Options
```
  --help                       Show help  [boolean]
  -v, --version                Show version number  [boolean]
  --archiveFile, -a            The business network archive file name  [string] [required]
  --connectionProfileName, -p  The connection profile name  [string]
  --enrollId, -i               The enrollment ID of the user  [string] [required]
  --enrollSecret, -s           The enrollment secret of the user  [string]
  ```

## Example Output

```
composer network undeploy -n digitalproperty-network -i WebAppAdmin -s DJY27pEnl16d
Undeploying business network definition. This may take some seconds...
Command completed successfully.
```

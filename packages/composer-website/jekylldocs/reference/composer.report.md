---
layout: default
title: Hyperledger Composer Report
section: reference-command
sidebar: sidebars/accordion-toc0.md
excerpt: Hyperledger Composer Report
---

# Composer Report

---

The `composer report` command creates a compressed archive file in the directory where the command was issued. The archive file contains details of the current composer environment.


## Syntax

```
Options:
  --help         Show help  [boolean]
  -v, --version  Show version number  [boolean]
```

## Example output

```
================================================================================
==== Node Report ===============================================================

Event: JavaScript API, location: "TriggerReport"
Filename: node-report.20180125.102940.3693.001.txt
Dump event time:  2018/01/25 10:29:40
Module load time: 2018/01/25 10:29:40
Process ID: 3693
Command line: node /usr/local/bin/composer report

Node.js version: v8.9.4
(http_parser: 2.7.0, v8: 6.1.534.50, uv: 1.15.0, zlib: 1.2.11, ares: 1.10.1-DEV,
 modules: 57, nghttp2: 1.25.0, openssl: 1.0.2n, icu: 59.1, unicode: 9.0,
 cldr: 31.0.1, tz: 2017b)

node-report version: 2.2.1 (built against Node.js v8.9.4, 64 bit)

OS version: Darwin 17.3.0 Darwin Kernel Version 17.3.0: Thu Nov  9 18:09:22 PST 2017; root:xnu-4570.31.3~1/RELEASE_X86_64

Machine: edwards-mbp.hursley.uk.ibm.com x86_64

================================================================================
==== JavaScript Stack Trace ====================================================

Function._createNodeReport (/usr/local/lib/node_modules/composer-cli/lib/cmds/report/lib/report.js:1:1)
Function.report (/usr/local/lib/node_modules/composer-cli/lib/cmds/report/lib/report.js:1:1)
Function.handler (/usr/local/lib/node_modules/composer-cli/lib/cmds/report/lib/report.js:1:1)
Object.exports.handler (/usr/local/lib/node_modules/composer-cli/lib/cmds/report.js:1:1)
Object.runCommand (/usr/local/lib/node_modules/composer-cli/node_modules/yargs/lib/command.js:1:1)
Object.parseArgs [as _parseArgs] (/usr/local/lib/node_modules/composer-cli/node_modules/yargs/yargs.js:1:1)
Object.get [as argv] (/usr/local/lib/node_modules/composer-cli/node_modules/yargs/yargs.js:1:1)
Object.<anonymous> (/usr/local/lib/node_modules/composer-cli/cli.js:1:1)
Module._compile (module.js:1:1)
Object.Module._extensions..js (module.js:1:1)
Module.load (module.js:1:1)
tryModuleLoad (module.js:1:1)
Function.Module._load (module.js:1:1)
Function.Module.runMain (module.js:1:1)
startup (bootstrap_node.js:1:1)
bootstrap_node.js:1:1

================================================================================
==== Native Stack Trace ========================================================

 0: [pc=0x1043d9c9f] nodereport::TriggerReport(Nan::FunctionCallbackInfo<v8::Value> const&) [/usr/local/lib/node_modules/composer-cli/node_modules/node-report/api.node]
 1: [pc=0x1043db363] Nan::imp::FunctionCallbackWrapper(v8::FunctionCallbackInfo<v8::Value> const&) [/usr/local/lib/node_modules/composer-cli/node_modules/node-report/api.node]
 2: [pc=0x1001fc962] v8::internal::FunctionCallbackArguments::Call(void (*)(v8::FunctionCallbackInfo<v8::Value> const&)) [/usr/local/bin/node]
 3: [pc=0x10025c690] v8::internal::MaybeHandle<v8::internal::Object> v8::internal::(anonymous namespace)::HandleApiCallHelper<false>(v8::internal::Isolate*, v8::internal::Handle<v8::internal::HeapObject>, v8::internal::Handle<v8::internal::HeapObject>, v8::internal::Handle<v8::internal::FunctionTemplateInfo>, v8::internal::Handle<v8::internal::Object>, v8::internal::BuiltinArguments) [/usr/local/bin/node]
 4: [pc=0x10025bce0] v8::internal::Builtin_Impl_HandleApiCall(v8::internal::BuiltinArguments, v8::internal::Isolate*) [/usr/local/bin/node]
 5: [pc=0x24273480463d]

================================================================================
==== JavaScript Heap and Garbage Collector =====================================

Heap space name: new_space
    Memory size: 16,777,216 bytes, committed memory: 12,248,000 bytes
    Capacity: 8,249,344 bytes, used: 7,927,360 bytes, available: 321,984 bytes
Heap space name: old_space
    Memory size: 11,358,208 bytes, committed memory: 11,014,504 bytes
    Capacity: 11,141,232 bytes, used: 10,822,832 bytes, available: 318,400 bytes
Heap space name: code_space
    Memory size: 2,097,152 bytes, committed memory: 1,317,088 bytes
    Capacity: 1,251,552 bytes, used: 1,251,552 bytes, available: 0 bytes
Heap space name: map_space
    Memory size: 1,069,056 bytes, committed memory: 840,200 bytes
    Capacity: 814,168 bytes, used: 814,088 bytes, available: 80 bytes
Heap space name: large_object_space
    Memory size: 2,228,224 bytes, committed memory: 2,228,224 bytes
    Capacity: 1,468,111,176 bytes, used: 2,186,056 bytes, available: 1,465,925,120 bytes

Total heap memory size: 33,529,856 bytes
Total heap committed memory: 27,648,016 bytes
Total used heap memory: 23,001,888 bytes
Total available heap memory: 1,466,565,584 bytes

Heap memory limit: 1,501,560,832

================================================================================
==== Resource Usage ============================================================

Process total resource usage:
  User mode CPU: 0.340019 secs
  Kernel mode CPU: 0.066818 secs
  Average CPU Consumption : 40.6837%
  Maximum resident set size: 52,600,766,464 bytes
  Page faults: 25 (I/O required) 12915 (no I/O required)
  Filesystem activity: 0 reads 0 writes

================================================================================
==== Node.js libuv Handle Summary ==============================================

(Flags: R=Ref, A=Active)
Flags  Type      Address             Details
[-A]   async     0x0000000102504b20  
[--]   check     0x00007ffeefbfec00  
[R-]   idle      0x00007ffeefbfec78  
[--]   prepare   0x00007ffeefbfed88  
[--]   check     0x00007ffeefbfee00  
[R-]   timer     0x00007ffeefbfecf0  repeat: 0, timeout in: 18230571293472140690 ms
[-A]   async     0x00000001015a0208  
[-A]   async     0x00000001024031a0  
[-A]   async     0x0000000102307b60  
[R-]   timer     0x0000000102309b90  repeat: 0, timeout expired: 2679412 ms ago
[R-]   tty       0x0000000102309ce8  width: 99, height: 37, file descriptor: 10, write queue size: 0, writable
[-A]   signal    0x0000000102309e90  signum: 28 (SIGWINCH)
[R-]   tty       0x0000000102309fe8  width: 99, height: 37, file descriptor: 12, write queue size: 0, writable
[-A]   async     0x0000000102403b20  
[-A]   async     0x0000000102308c90  
[-A]   async     0x000000010230b390  
[-A]   async     0x0000000102309210  
[-A]   async     0x00000001024014a0  
[-A]   async     0x0000000102325a50  
[-A]   async     0x00000001023273c0  
[-A]   async     0x00000001043e1f78  

================================================================================
==== System Information ========================================================

Environment variables
  TERM_PROGRAM=Apple_Terminal
  TERM=xterm-256color
  SHELL=/bin/bash
  TMPDIR=/var/folders/p1/k6x32fgj2ds30xlb2zwyjzth0000gn/T/
  Apple_PubSub_Socket_Render=/private/tmp/com.apple.launchd.Qp8te2QL90/Render
  TERM_PROGRAM_VERSION=400
  TERM_SESSION_ID=26206521-EAB8-4942-B582-6A529986F390
  USER=edwardprosser
  SSH_AUTH_SOCK=/private/tmp/com.apple.launchd.9Xy3dngXGX/Listeners
  PATH=/Users/edwardprosser/.rbenv/shims:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
  PWD=/Users/edwardprosser
  LANG=en_GB.UTF-8
  XPC_FLAGS=0x0
  RBENV_SHELL=bash
  XPC_SERVICE_NAME=0
  HOME=/Users/edwardprosser
  SHLVL=1
  LOGNAME=edwardprosser
  _=/usr/local/bin/composer
  OLDPWD=/Users/edwardprosser/composer

Resource limits                        soft limit      hard limit
  core file size (blocks)                       0       unlimited
  data seg size (kbytes)                unlimited       unlimited
  file size (blocks)                    unlimited       unlimited
  max locked memory (bytes)             unlimited       unlimited
  max memory size (kbytes)              unlimited       unlimited
  open files                                24576       unlimited
  stack size (bytes)                      8388608        67104768
  cpu time (seconds)                    unlimited       unlimited
  max user processes                         1418            2128
  virtual memory (kbytes)               unlimited       unlimited

Loaded libraries
  /usr/local/bin/node
  /System/Library/Frameworks/CoreFoundation.framework/Versions/A/CoreFoundation
  /usr/lib/libSystem.B.dylib
  /usr/lib/libc++.1.dylib
  /usr/lib/libDiagnosticMessagesClient.dylib
  /usr/lib/libicucore.A.dylib
  /usr/lib/libobjc.A.dylib
  /usr/lib/libz.1.dylib
  /usr/lib/system/libcache.dylib
  /usr/lib/system/libcommonCrypto.dylib
  /usr/lib/system/libcompiler_rt.dylib
  /usr/lib/system/libcopyfile.dylib
  /usr/lib/system/libcorecrypto.dylib
  /usr/lib/system/libdispatch.dylib
  /usr/lib/system/libdyld.dylib
  /usr/lib/system/libkeymgr.dylib
  /usr/lib/system/liblaunch.dylib
  /usr/lib/system/libmacho.dylib
  /usr/lib/system/libquarantine.dylib
  /usr/lib/system/libremovefile.dylib
  /usr/lib/system/libsystem_asl.dylib
  /usr/lib/system/libsystem_blocks.dylib
  /usr/lib/system/libsystem_c.dylib
  /usr/lib/system/libsystem_configuration.dylib
  /usr/lib/system/libsystem_coreservices.dylib
  /usr/lib/system/libsystem_darwin.dylib
  /usr/lib/system/libsystem_dnssd.dylib
  /usr/lib/system/libsystem_info.dylib
  /usr/lib/system/libsystem_m.dylib
  /usr/lib/system/libsystem_malloc.dylib
  /usr/lib/system/libsystem_network.dylib
  /usr/lib/system/libsystem_networkextension.dylib
  /usr/lib/system/libsystem_notify.dylib
  /usr/lib/system/libsystem_sandbox.dylib
  /usr/lib/system/libsystem_secinit.dylib
  /usr/lib/system/libsystem_kernel.dylib
  /usr/lib/system/libsystem_platform.dylib
  /usr/lib/system/libsystem_pthread.dylib
  /usr/lib/system/libsystem_symptoms.dylib
  /usr/lib/system/libsystem_trace.dylib
  /usr/lib/system/libunwind.dylib
  /usr/lib/system/libxpc.dylib
  /usr/lib/closure/libclosured.dylib
  /usr/lib/libc++abi.dylib
  /usr/local/lib/node_modules/composer-cli/node_modules/node-report/api.node

================================================================================
```

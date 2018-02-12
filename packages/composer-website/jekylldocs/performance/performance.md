---
layout: default
title: Performance
category: performance
section: performance
index-order: 1400
sidebar: sidebars/accordion-toc0.md
excerpt: "{{site.data.conrefs.composer_full}} Performance"
---

# {{site.data.conrefs.composer_full}} Performance

The {{site.data.conrefs.composer_full}} performance reports cover multiple scenarios with a range of blockchain platform configurations to demonstrate the expected performance of a business network and the {{site.data.conrefs.composer_full}} API for a given configuration.

- [Performance reports](./reports/reports.md)
- [Tuning a business network for increased performance](./tuning.md)

## Performance Samples

The sample business networks and artifcats used in performance report generation are available to download using npm. {{site.data.conrefs.composer_full}} uses the sample business networks hosted on [Github](https://github.com/hyperledger/composer-sample-networks) and a {{site.data.conrefs.composer_full}} [Caliper](https://github.com/Huawei-OSG/caliper) plugin to perform performance tests. The framework and all tests are available to download for personal testing and benchmarking.

## Notices

The reports are intended to provide key {{site.data.conrefs.composer_full}} processing and performance characteristics to architects, systems programmers, analysts and programmers. The data provided will assist you with sizing solutions. For best use of the {{site.data.conrefs.composer_full}} performance reports, the user should be familiar with the concepts and operation of {{site.data.conrefs.composer_full}}.

The performance information is obtained by measuring the transaction throughput for different types of business network transactions. The term “transaction” is used in a generic sense, and refers to any interaction with a business network, regardless of the complexity of the subsequent interaction(s) with the blockchain platform.

Measuring transaction throughput demonstrates potential transaction rates, and the impact of the relative cost of different {{site.data.conrefs.composer_full}} API calls.

The data contained in the reports was measured in a controlled environment, results obtained in other environments might vary. For more details on the environments used, see the results sections.

The performance data cannot be compared across versions of {{site.data.conrefs.composer_full}}, as testing hardware and environments may have changed significantly. The testing contents and processing methodologies may also changed between performance reports, and so cannot be compared.

Some optimizations of the test environment and procedures have been implemented. These are detailed under [Tuning your testing environment](./tuning.md).

---
title: "What is SBOM (Software Bill of Materials)?"
description: "#SBOM #CI/CD #Concepts #DevOps Software Bill of Materials — SBOM stands for Software Bill of Materials. Literally, it's a \"recipe list\" of every component (package/library) that goes into a piece of software. - Just like a car has a parts list, software is built from countless open-source libraries, frameworks, and packages. SBOM records those components, their versions, and their origins in a structured format (JSON, SPDX, CycloneDX, etc.)."
date: "2025-12-27T12:34:00.000Z"
notionId: "2d6ea3deaa2b8059b287c3abe224f67f"
koreanSlug: "sbom-software-bill-of-materials-이란"
category: "끄적끄적"
tags:
  - "끄적끄적"
hierarchy:
  - "끄적끄적"
  - "SBOM (Software Bill of Materials) 이란?"
parent: "2d6ea3deaa2b80ec8f44c1b718f382c4"
level: 1
---

#SBOM #CI/CD #Concepts #DevOps


Software Bill of Materials


SBOM stands for **Software Bill of Materials** — a structured inventory of everything inside a piece of software.


In plain terms, it's **"a recipe list of every component (package/library) that went into this software."**

- Just like a car has a parts manifest, software is built from countless **open-source libraries, frameworks, and packages**.
- An SBOM records those **components, their versions, and their origins** in a structured format (JSON, SPDX, CycloneDX, etc.).

---


## Why Do We Need It?

1. **Vulnerability Management**
    - Knowing exactly which library versions are included means you can immediately assess the blast radius when a CVE (security vulnerability) is disclosed for one of them.
    - Example: When the Log4j vulnerability (Log4Shell) hit, having an SBOM let teams automatically answer "Which of my service images contains log4j-core 2.14.1?"
2. **License Compliance**
    - Tracks obligations under open-source licenses (GPL, Apache 2.0, MIT, etc.).
    - An SBOM records which library came in under which license, reducing legal risk.
3. **Supply Chain Security**
    - Modern attacks increasingly target **third-party libraries, package registries, and build pipelines** rather than your own code directly.
    - An SBOM enables supply chain traceability — "how exactly did this code get in here?"
4. **Regulatory & Standards Compliance**
    - In the U.S., Biden's Executive Order 14028 (2021) requires federal government vendors to provide SBOMs.
    - The EU, Japan, and others are actively discussing mandatory SBOM submission requirements.

---


## How Are SBOMs Generated and Used?

- **Generation Tools**
    - Tools like `Syft`, `Trivy`, `CycloneDX`, and `bom` automatically generate SBOMs from container images or codebases.
    - Example:

        ```bash
        syft myapp:1.0 -o cyclonedx-json > sbom.json
        ```

- **Formats**
    - The three major standards are SPDX, CycloneDX, and SWID.
- **Usage**
    - Generate an SBOM during the CI stage → upload it alongside the artifact to a repository like Nexus
    - Tools like Trivy or Grype ingest the SBOM and run vulnerability scans against it

---


## Summary

- **SBOM = the "parts list" for your software**
- **Benefits = vulnerability tracking, license management, stronger supply chain security**
- In a CI/CD pipeline: auto-generate with Trivy/Syft → upload to a registry → used by operations and security teams.
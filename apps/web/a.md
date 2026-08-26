
 







CAPSTONE PROJECT REPORT
SignTrustMap - A Crowd-AI Platform for Building a Reliable Traffic Sign Inventory








– Ho Chi Minh, December 2026 –
Table of Contents
I. Record of Changes	3
II. Project Introduction	4
1. Overview	4
1.1 Project Information	4
1.2 Project Team	4
2. Product Background	4
3. Existing Systems	5
3.1 OpenStreetMap	5
3.2 Google Maps and Waze	5
3.3 VIETMAP	5
3.4 Mapillary	6
3.5 AI-based Traffic Sign Recognition Systems	6
4. Business Opportunity	6
5. Software Product Vision	7
6. Project Scope & Limitations	8
6.1 Major Features	8
6.2 Limitations & Exclusions	11
 
I. Record of Changes
Date	A*
M, D	In charge	Change Description
05/08/2026	A	Phan Tài Đức	Created the initial project report document.
05/08/2026	A	Lương Minh Nhật	Added the Overview and Product Background sections.
13/08/2026	A	Lương Minh Nhật	Added the Existing Systems, Business Opportunity, Software Product Vision, and Project Scope & Limitations sections.
13/08/2026	M	Phan Tài Đức	Modified the Existing Systems section.
			
			
			
			
			
			
			
			
			
*A - Added M - Modified D - Deleted

 
II. Project Introduction
1. Overview
1.1 Project Information
•	Project name: SignTrustMap - A Crowd-AI Platform for Building a Reliable Traffic Sign Inventory
•	Project code: GFA26SE83
•	Group name: Phan Tài Đức
•	Software type: Web Application, Mobile Interface, AI Processing Platform, GIS Platform, and MLOps-based Backend System
1.2 Project Team
English: SignTrustMap: A Crowd-AI Platform for Building a Reliable Traffic Sign Inventory
Vietnamese: SignTrustMap: Nền tảng kết hợp AI và cộng đồng để xây dựng cơ sở dữ liệu biển báo giao thông tin cậy
Abbreviation: STM

Full Name	Role	Email	  Mobile
Đặng Ngọc Minh Đức	Lecturer	ducdnm2@fe.edu.vn	0989699299
Thân Thị Ngọc Vân	Lecturer	vanttn2@fe.edu.vn	
Phan Tài Đức	Leader	phantaiduc2005@gmail.com	0902244389
Nguyễn Phúc Khang	Member	npkhang2005@gmail.com	0762904851
Lương Minh Nhật	Member	luongminhnhat1604@gmail.com	0378160061
Nguyễn Lê Quang Hưng	Member	quanghunglenguyen@gmail.com	0898492655
Nguyễn Long Vũ	Member	vunlse180476@fpt.edu.vn	0838474060

2. Product Background
Modern transportation systems are increasingly influenced by Advanced Driver Assistance Systems (ADAS), autonomous driving technologies, intelligent logistics, and digital navigation services. These systems depend not only on road geometry and route data, but also on accurate, timely, and localized road attribute information. Among these attributes, physical traffic signs are especially important because they define legal driving constraints, safety instructions, speed limits, turn restrictions, prohibited movements, and temporary road configurations.
However, maintaining an up-to-date traffic sign inventory remains difficult. Traffic signs may be installed, removed, damaged, replaced, or changed over time. Standard navigation applications and static digital maps often cannot reflect these changes quickly enough, especially when the data requires local observation and continuous verification. Traditional mapping methods using professional survey vehicles, LiDAR equipment, or high-end cameras are expensive and difficult to deploy frequently. On the other hand, crowdsourced data from normal drivers, dashcams, and mobile devices may contain noise, duplicated submissions, poor-quality evidence, incorrect GPS information, or even fraudulent contributions.
From a technical perspective, many traffic sign recognition solutions focus mainly on isolated AI model accuracy. They often lack the complete software engineering workflow required for practical deployment, such as large-scale media ingestion, video-GPX synchronization, object tracking, duplicate elimination, coordinate projection, human validation, reviewer reliability management, active learning, model retraining, and long-term geospatial data governance.
SignTrustMap is proposed to address these problems as a community-driven Crowd-AI and GIS platform. The system allows users to submit street-level videos, GPX trajectory logs, and traffic sign images. An AI processing pipeline detects and classifies traffic signs, estimates their physical coordinates, and stores them as unverified candidates. These candidates are then validated through a peer-to-peer reviewer workspace before being published as verified traffic sign records on an interactive GIS map. The platform also supports revalidation, traffic sign catalog management, missing sign type reporting, credit-based rewards, and direction-aware navigation alerts.
3. Existing Systems
3.1 OpenStreetMap
OpenStreetMap is a collaborative mapping platform that allows volunteers to create and update geographic data. It provides an open and flexible map data model that can represent roads, points of interest, traffic restrictions, and other traffic-related attributes. Because of its open and community-driven nature, OpenStreetMap is useful as a reference for collaborative mapping, geospatial data representation, and community-maintained road information.
However, OpenStreetMap depends heavily on manual contributions and volunteer maintenance. The completeness and freshness of traffic sign information may vary by area. It also does not primarily provide an integrated workflow for AI-based traffic sign extraction from dashcam videos, automated duplicate elimination, reviewer reliability scoring, weighted consensus, credit rewards, or active learning-based model improvement.
3.2 Google Maps and Waze
Google Maps and Waze are widely used navigation systems that provide route planning, traffic information, and driving guidance. They are useful references for user-facing map interaction, route visualization, navigation workflows, rerouting, and traffic-aware driving experiences.
However, these systems primarily focus on navigation and traffic guidance rather than providing an open community workflow for building and maintaining a transparent traffic sign inventory. From the end-user perspective, they do not expose the type of structured sign-level workflow proposed by SignTrustMap, including evidence images, reviewer decisions, reviewer reliability, traffic direction metadata, sign history, community consensus, and AI retraining.
3.3 VIETMAP
VIETMAP is a navigation and traffic-assistance application designed for drivers in Vietnam. The application provides route guidance and traffic-related warnings and supports integration with in-vehicle platforms such as Apple CarPlay and Android Auto. VIETMAP's mapping platform also provides road and navigation data related to traffic signs, speed limits, speed cameras, and traffic warnings.
VIETMAP is particularly relevant to SignTrustMap because it demonstrates the practical value of localized traffic-sign and road-rule information for Vietnamese drivers. Its navigation and warning mechanisms provide useful references for SignTrustMap's direction-aware navigation, map visualization, route guidance, and traffic sign alert features.
However, VIETMAP is primarily a navigation and traffic-assistance product rather than a community-oriented platform for constructing a transparent traffic sign inventory. SignTrustMap focuses on a different part of the data lifecycle by allowing community users to contribute dashcam videos, GPX trajectories, and sign evidence; processing these submissions through AI; validating candidates through peer reviewers and weighted consensus; maintaining sign history through revalidation; and feeding verified results back into an active learning pipeline. Therefore, VIETMAP serves as an important reference for the navigation and driver-alert side of SignTrustMap, while SignTrustMap additionally focuses on how traffic sign data is collected, verified, maintained, and continuously improved.
3.4 Mapillary
Mapillary is a street-level imagery platform that supports crowdsourced visual map data. It is relevant to SignTrustMap because it demonstrates how road users can contribute street-level imagery for mapping and computer vision purposes.
However, Mapillary is not primarily focused on the complete lifecycle of maintaining a localized, validated, and direction-aware traffic sign inventory for navigation alerts. SignTrustMap extends this concept with a project-specific combination of video-GPX ingestion, AI candidate extraction, coordinate estimation, peer reviewer validation, weighted consensus, revalidation task maps, catalog governance, a credit-based incentive mechanism, and an active learning pipeline.
3.5 AI-based Traffic Sign Recognition Systems
AI-based traffic sign recognition systems commonly use object detection and image classification models to identify traffic signs from images or videos. These systems are useful references for the AI component of SignTrustMap, particularly for traffic sign detection, classification, tracking, and model evaluation.
However, many standalone traffic sign recognition solutions focus mainly on model inference or experimental model performance rather than the complete software engineering lifecycle required for a continuously maintained traffic sign platform. SignTrustMap combines AI recognition with video-GPX synchronization, duplicate elimination, coordinate estimation, human validation, consensus-based publishing, GIS visualization, revalidation, catalog versioning, community incentives, administrative governance, and active learning-based model improvement.
4. Business Opportunity
The growth of ADAS, smart navigation, autonomous-driving research, and intelligent logistics creates a practical need for traffic-sign data that is accurate, localized, direction-aware, and continuously refreshed. Existing map and navigation products can provide traffic-sign and speed-limit information, but maintaining such data at road-network scale is costly because physical signs change over time and require repeated field observation.
SignTrustMap addresses this opportunity by using ordinary road users as distributed surveyors and reviewers. Instead of depending only on specialized mapping vehicles, the platform accepts dashcam video, GPX trajectories, and sign photos, then combines AI processing with community validation. This reduces the gap between data collection and map publication while preserving a validation layer before information becomes verified map data.
The project also creates value through revalidation and a credit economy. Stale signs can be converted into revalidation tasks, accepted contributions can be rewarded, and premium navigation-related services can consume credits. This mechanism is intended to encourage recurring participation rather than one-time data collection. At the same time, the Traffic Sign Catalog and missing-sign-type workflow allow the supported taxonomy and AI label set to evolve when new or previously unsupported signs are encountered.
Compared with a conventional navigation application, SignTrustMap therefore concentrates on the traffic-sign data lifecycle itself: acquisition, AI extraction, spatial estimation, human verification, publishing, freshness maintenance, and model feedback. The resulting verified inventory can support the project's own GIS and navigation functions and can also be exported in spatial or tabular formats for further use.
5. Software Product Vision
For drivers, surveyors, reviewers, and platform administrators who need reliable and up-to-date traffic sign information, SignTrustMap is a Crowd-AI, GIS, and MLOps platform that transforms community-submitted road imagery and GPS trajectories into verified, spatially indexed traffic sign records.
Unlike conventional navigation systems or standalone AI recognition tools, SignTrustMap provides an end-to-end workflow that connects data submission, AI-based traffic sign detection and classification, coordinate estimation, community validation, weighted consensus, revalidation, traffic sign catalog management, community incentives, and direction-aware navigation.
The product aims to establish a reliable and continuously improving traffic sign inventory that supports interactive mapping, direction-aware navigation alerts, community-based data maintenance, and reusable geospatial data for future applications.
6. Project Scope & Limitations
The scope of SignTrustMap covers the end-to-end lifecycle of traffic-sign inventory data, from community survey submission and asynchronous AI processing to reviewer validation, consensus publishing, revalidation, navigation use, catalog governance, credit transactions, moderation, administration, and active-learning feedback. The product includes web interfaces, a mobile-oriented community interface, GIS functionality, background AI/spatial services, and the supporting transactional and object-storage infrastructure described in the Capstone Project Register.
6.1 Major Features
FE-01: Community survey submission through recorded trips, video-GPX uploads, or individual traffic-sign photos, with file and metadata validation.
FE-02: Submission tracking and real-time processing status for synchronization, detection, tracking, coordinate estimation, classification, candidate generation, failures, and rewards.
FE-03: Asynchronous traffic-sign extraction using YOLO12 detection, BoT-SORT multi-object tracking, best-frame selection, crop extraction, and duplicate reduction.
FE-04: Geospatial coordinate and traffic-direction estimation from GPX trajectories, vehicle heading, camera geometry, and projection logic.
FE-05: CLIP-based traffic-sign classification using the active Traffic Sign Catalog and vector similarity support through pgvector.
FE-06: Active-learning candidate selection that prioritizes uncertain samples for model improvement and high-confidence samples for rapid validation.
FE-07: Reviewer workspace for approving, rejecting, correcting labels, flagging suspicious candidates, and consulting the Traffic Sign Catalog.
FE-08: Weighted consensus publishing based on reviewer votes and reliability scores, with escalation of conflicting or suspicious cases to moderation.
FE-09: Interactive GIS map for searching, filtering, clustering, and inspecting verified traffic signs and their direction-related metadata.
FE-10: Direction-aware active navigation that loads verified signs along a route and provides visual or audio alerts for signs applicable to the driver's travel direction.
FE-11: Freshness monitoring and community revalidation tasks that refresh, update, or retire stale verified traffic-sign records.
FE-12: Traffic Sign Catalog management, catalog versioning, AI label prompt synchronization, corrected labels, and missing-sign-type reporting/approval.
FE-13: Credit economy with contribution rewards, daily tasks, premium-feature spending, top-up/payment verification, transaction history, refunds, and administrative adjustments.
FE-14: Moderation and administration functions for user/role management, system parameters, audit logs, flagged cases, spatial overrides, and data export.
FE-15: Closed-loop MLOps workflow that incorporates reviewer-verified labels into retraining or fine-tuning of YOLO12 and CLIP-based classification configurations.
 
Figure 1. SignTrustMap Major Feature Decomposition
6.2 Limitations & Exclusions
LI-01: SignTrustMap focuses on traffic-sign inventory construction, verification, maintenance, and sign-aware navigation; it is not a complete autonomous-driving or ADAS control system and does not control vehicle behavior.
LI-02: The accuracy of extracted sign coordinates and traffic direction depends on the quality and availability of submitted video/image metadata, GPX trajectories, GPS signals, timestamps, camera geometry, and heading information. Unreliable inputs may be stored with lower confidence or require reviewer confirmation.
LI-03: AI predictions are not treated as automatically verified map truth. Candidates require community review and consensus or moderation before they are published as verified traffic-sign records.
LI-04: The system can only classify traffic-sign types that exist in the active Traffic Sign Catalog. Unknown types remain pending until they are reported, reviewed, and added to a published catalog version.
LI-05: Active navigation depends on GPS access, routing services, available verified traffic-sign data, and sufficient user credits. If these dependencies are unavailable, navigation or sign alerts may be limited or cannot start.
LI-06: The first implementation uses the technology stack and processing approach defined in the Capstone registration, including ReactJS, FastAPI/NestJS, Celery/Redis, PostgreSQL/PostGIS/pgvector, MinIO, YOLO12, BoT-SORT, and CLIP; alternative production-scale infrastructure and nationwide commercial deployment are outside the registered project scope.
LI-07: Crowdsourced survey data may contain duplicated evidence, inaccurate GPS information, low-quality media, spam submissions, or intentionally falsified data such as GPS spoofing. Automated validation, duplicate detection, reliability scoring, and moderation can reduce these risks but may not detect every invalid or fraudulent contribution.

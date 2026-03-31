# [Pre-Startup Company] Business Plan

## Business Overview
| Item | Details |
|------|---------|
| **Name** | GamiphyAI |
| **Technology Field** | Robot data and skills for Physical AI |
| **Team Name (Tentative)** | 3 |
| **E-mail / Mobile Phone** | fer@gamiphy.ai / 010 8505 9134 |
| **Item Overview** | Platform for robotics creators: buy, sell, share and promote real world physical data, models and skills for robotics and automation.   |

### Product/Service Introduction

#### 1. Problem Recognition (Problem)

##### Motivation for Developing the Product/Service

# Data Story

ChatGPT was built on decades of world-scale human effort: <here add numbers of the size of the dataset used to train chatgpt, the millions or billions of books extracted, the millions of webpages and content and other references.>. 
This proved that data based approaches to intelligence work.
Language and communication, when represented as a stream of discrete tokens with low noise (corruption) <here add a highly simplified, short but technical description of how LLMs process text data for training and inference>.
However currently we do not poses similar vast, readily available and  widely diverse datasets for robotics and, robots deal with the real world whose signals and information are continuous, noisy, high dimensional and sparse <verify these claims or clarify what are the challenges with real world data for robotics versus text data for language>. 

A focused, organized and intentional effort is required to create the datasets, skills and models that achieve a similar level of intelligence, dexterity and robustness that humans show.  and make them available to the masses of people.

# Hardware Story

Recently, there has been an explosion in new  intelligent and autonomous robotics companies: robots for logistics, delivery, factory automation, etc. In particular humanoid robot companies are appearing almost every day. These robots are being tested in industrial applications where the measures of success have more to do with KPIs like reliability, task cycle time, up time and safety, and less with the shape or technology underlying the solution.  The big question is whether all these robots will fullfill the requirements of the applications and whether the technology is ready for those needs. Just like ChatGPT automated text generation using large datasets and transformers; we believe that every real world tasks that can be automated will be with the right combination of data, algorithms and, of course, hardware. We will focus on collecting, organizing, exchanging the data and providing more value with it.

This means that manufactures of hardware have to provide not onlythe hardware, firmware and software to support their products; they also must help accelerate the generation of sensible datasets for their products to be rapidly adopted in the market. We want to be the platform hardware manufactures go to to support the data their customers need.


# User story

How do we create those datasets? How do we create value for all actors involved? 

There is a need for a positive cycle:   discover needs for automation -> identify their needs for data -> allow people to provide that data in exchange for value -> fullfill the need for automation -> discover a new need for automation. 

In this way, the actors in need for data obtain it, and the actors involved in providing data, are compensated. 

What is missing in this picture is platform to do this exchange, provide guarantees that the data is valuable and that data creators are compensated. 



- Internal and external motivations that led to developing the product/service
- Describe the solutions and objectives for the problems identified while developing the product/service concept
- Describe the planning and preparatory work completed before submitting this application, including relevant progress and track record

  Platform Progress: The GamiphyAI platform is currently under active development at gamiphy.ai. Completed features include user account creation, dataset upload and visualization (with native support for the LeRobot format), and a functional marketplace where users can list, sell, and purchase datasets — including dataset search functionality. Outreach to the LeRobot creator community is currently in progress in South Korea.  Active engagement is also underway with small businesses to understand their automation needs and with hardware manufacturers to pilot dataset administration and distribution workflows.

  Founder Background: The founding team brings deep, first-hand expertise in the core domains the platform serves.
                                                                                           
  - Juan Medrano holds a Ph.D. (Candidate) in Mechanical Engineering from Sungkyunkwan University, focused on machine learning for computer vision and robotic manipulation, and an M.Sc. in Mechatronics Engineering. He has 7+ years of industry experience in robotics perception, including a role as Perception Engineer II at Agility Robotics, where he developed detection, segmentation, and 6DoF pose estimation systems for the Digit humanoid robot — deployed in live GXO warehouse operations. During this work he was
  directly involved in collecting large-scale, multi-modal datasets for humanoid robots, including visual (RGB, depth), inertial (IMU), kinematics (joint angles), and world-state data (objects, other robots, people), all used for training machine learning models for manipulation and locomotion. His prior research also includes building datasets for autonomous drone navigation for machine learning applications. This first-hand experience with the full data pipeline — collection, annotation, format standardization, and ML integration — directly informs the platform's design.

  - Jose Bagur is a Mechatronics Engineer from Universidad del Valle de Guatemala (UVG) and current Coordinator of the UVG Aerospace Laboratory. He is the lead of the Quetzal-1 and Quetzal-2 CubeSat programs — Guatemala's first and second national satellites. Quetzal-1 successfully launched aboard SpaceX CRS-20 in 2020, was deployed from the ISS's Kibo module, and operated for 211 days in orbit, validating all onboard systems and winning the CubeSat Delivery Prize from Arizona State University. He led the hardware team (ADCS, EPS, communications) for a team of ~100 students and researchers. Quetzal-2 (currently in development, selected by UNOOSA and EXOlaunch) incorporates on-board AI for image analysis. His deep expertise in embedded systems, hardware design, sensor integration, and real-world system deployment is directly applicable to the hardware-side requirements of the GamiphyAI platform.


##### Target Market Current Status Analysis
- **Target market (beachhead):** Small-to-medium sized (SME) light-manufacturing operations in South Korea running small production/packing/assembly lines that rely on a small number of workers for daily repetitive tasks (e.g., cosmetics packaging, labeling/sticker application, and assembly of small, light, high-variation parts).

- **Current market status (what is happening today):**
  - Many SME lines remain **labor-driven** because tasks are repetitive yet variable (high-mix / low-volume), making them difficult to justify with traditional fixed automation.
  - When SMEs do pursue automation, the path is often **integrator-led and project-based**, with long lead times, high upfront engineering cost, and uncertain performance when products, packaging, or SKUs change.
  - As a result, many owners either postpone automation or implement partial solutions (fixtures/jigs, semi-automatic tools) that reduce but do not eliminate manual work.
  - Typical operations are small teams (~3–5 people) executing end-to-end packing and kitting workflows manually. Example tasks include visual inspection of small electronic products, placing items into boxes, sealing boxes with masking tape, and applying a top label/sticker; or kitting multiple small items by picking fixed quantities of each component, placing them into an outer box, and closing it. Current throughput is often on the order of ~100–200 packaged items per day (workload-dependent).

- **Core problem to solve (pain points):**
  - **Decision friction and risk:** Owners want automation but lack a fast, low-risk way to validate feasibility and ROI before committing to hardware and integration.
  - **Data/skills bottleneck for modern robotics:** Learning-based manipulation and perception can unlock flexible automation, but SMEs do not have the capability to collect, curate, and validate the task-specific datasets and robot skills required.
  - **Operational pressure:** Manual lines face recurring issues such as hiring/turnover, variable quality, throughput variability, and the need to adapt processes quickly as products and packaging change.
  - **High employee rotation:** These roles are typically low-wage, repetitive, and offer limited benefits, leading many workers to stay only short periods. This creates continuous burden on the business to recruit, onboard, and train new staff, making operations hard to sustain.

- **Intended solution (GamiphyAI’s approach):**
  - **Need discovery → constrained automation plan:** Work directly with SME owner/operators to identify automation opportunities that fit within realistic constraints (initial focus: tasks feasible with two small robot arms).
  - **Rapid PoC to de-risk:** Deliver a proof-of-concept that demonstrates measurable task performance in the customer’s context, enabling a clear “go / no-go” decision.
  - **Scale from PoC to deployment:** After PoC approval, execute the next stages of the automation plan, covering (1) hardware procurement/integration, (2) task-specific data generation/management, and (3) ongoing support.
  - **Recurring value:** Provide ongoing maintenance and iteration as SKUs/processes change, leveraging a reusable, growing library of physical-world datasets and robot skills.
  - **PoC success target (initial):** Automate ~70% of the per-worker task set with high reliability. In this context, reliability is defined as **~99% of units completed end-to-end without human intervention** over a full customer workload (the job is typically measured by “finish the batch of items to be delivered,” regardless of whether that takes hours or multiple days). The remaining ~30% of tasks are handled by a reduced number of human workers focused on exception handling and supervision.

- **Why this market first (go-to-market rationale):**
  - **Direct access to decision makers:** SME owners are reachable and can approve PoCs quickly with minimal organizational complexity.
  - **Higher PoC success likelihood:** The initial task set is constrained and practical, increasing the probability of a demonstrably successful PoC.
  - **Clear path to recurring revenue:** A working PoC naturally converts into paid deployment and recurring maintenance/support.

#### 2. Product/Service Introduction (Solution)

##### Product/Service Overview
- **Revenue model (SME automation beachhead, South Korea):** A hybrid model combining (1) paid PoC + deployment services, (2) hardware procurement and integration, and (3) recurring subscription and maintenance.

- **1) PoC (Proof-of-Concept) fee**
  - **Pricing (KRW):** `≤ ₩5M` per PoC (scope-dependent).
  - **Commercial structure:** PoC fee can be partially credited against the deployment contract upon successful conversion.
  - **What it covers:** Onsite process study, task decomposition, a constrained automation plan, and a quantitative PoC report tied to batch/workload completion reliability. (Where feasible, we include a minimal demo; deeper on-site pilots are handled as part of paid deployment.)

- **2) Deployment / integration (robot workcell)**
  - **Pricing (KRW):** `≤ ₩5M` **GamiphyAI service fee** per line/workcell for initial deployment and integration (labor + configuration), with hardware costs itemized separately.
  - **Rationale:** To fit SME cash constraints, we separate (a) a low upfront integration fee from (b) hardware procurement and (c) ongoing subscription/support, and we prioritize constrained, repeatable deployments to keep engineering effort bounded.

- **3) Hardware (robots + peripherals)**
  - **Pricing (KRW):**
    - **Robot arms:** ~`₩2M–₩10M` per arm (targeting very small/light-duty arms for initial SME deployments).
    - **Peripherals:** `≤ ₩3M` for EOAT, fixtures/jigs, basic sensing, and line interfacing on the initial configuration.
  - **Procurement options:** Customer purchase/lease, or partner financing where available.
  - **Commercial structure:** Hardware is typically `pass-through` purchase cost to customer, with either:
    - `0–15%` resale/handling margin (transparent), or
    - a structured “turnkey” bundle where hardware is included in the deployment price.
  - **Notes:** For SMEs, we will keep initial configurations constrained (task-specific EOAT + minimal sensing + workflow constraints) to maximize PoC success and shorten deployment cycles.

- **4) Data / skill subscription (recurring)**
  - **Pricing (KRW):** ~`₩0.5M–₩3M / month` per site/line (tiered by number of tasks, number of robots, and frequency of updates).
  - **What it includes:** Data capture + curation workflows, versioned task “skills” and configurations, evaluation/benchmark dashboards, and continuous improvement as SKUs/processes change.

- **5) Maintenance / support (recurring)**
  - **Pricing (KRW):** ~`₩0.8M–₩2.5M / month` per site depending on SLA.
  - **What it includes:** Remote monitoring, incident response, preventive maintenance schedule, periodic onsite visits, spares coordination, and retraining/re-tuning as the workload shifts.

- **Adoption enabler (Korea):** Many SMEs pursue automation through smart-factory style support programs where public funding can cover a portion of the build cost up to around `₩50M` per company (program-dependent). GamiphyAI will design PoCs and deployments that fit within realistic SME cash constraints and can align with these programs where applicable.

- **Current market entry status & strategy (summary):**
  - Platform is under active development (accounts, dataset upload/visualization, LeRobot-format support, marketplace listing/sale/purchase, search).
  - In parallel, we are engaging South Korean SMEs to identify constrained, high-ROI workflows suitable for rapid PoCs and repeatable deployment patterns.
  - Strategy: convert PoCs into paid deployments, then retain customers via subscription + maintenance while reusing (and expanding) a growing library of task data and skills.

- **Robotics & platform technology (initial stack):**
  - **Robot hardware (PoC stack):**
    - **Manipulator:** ROBOTIS OpenMANIPULATOR / OM-X class arms (small, low-cost, DYNAMIXEL-based).
      - Reference specs (OpenMANIPULATOR-X class): ~5 DOF (4 DOF + gripper), ~500g payload, ~380mm reach, <0.2mm repeatability.
    - **EOAT:** Parallel grippers (task-specific fingertips as needed).
    - **Sensing:** Low-cost ~30fps cameras mounted per-arm, plus an Intel RealSense camera for panoramic / global scene context.
    - **Deployment pattern:** Two-arm workcell for constrained packing/kitting/labeling workflows (with workflow constraints and simple fixtures where needed).

  - **Robot control + data collection software (open source):**
    - **Control/data interface:** LeRobot (hardware-agnostic Python interface + standardized dataset tooling).
    - **Actuator control:** ROBOTIS DYNAMIXEL SDK (Python/C++), plus C++ components where needed for performance and reliability.
    - **ML stack:** PyTorch for training and inference.
    - **Primary languages:** Python for orchestration and model work; C++ for latency-sensitive / device-facing components.

  - **Learning approach (skills):**
    - **Controller type:** Vision-Language-Action (VLA)-style policy/controller fine-tuned on task-specific datasets contributed by the community.
    - **Skill lifecycle:** Collect targeted demonstrations → validate/curate → fine-tune → deploy → monitor failure modes → request/compensate additional data → iterate.

  - **Robot data platform (GamiphyAI web stack):**
    - **Frontend:** Vite + TypeScript + React + Tailwind + shadcn-ui.
    - **Backend/data:** Supabase (auth + database + storage).
    - **Hosting & delivery:** Frontend hosted on GitHub Pages; domain + proxy/CDN via Cloudflare.

##### Product/Service Development and Preparation Status
- **Agreement period & deliverables (milestones):**
  - **Month 1 milestone (discovery + activation):**
    - **Deliverable 1:** Signed agreements for a list of **5 representative, constrained SME automation use cases** with micro production lines (use cases feasible with two small robot arms and small datasets).
    - **Deliverable 2:** **≥20 new robot dataset creators** registered on the platform, each with **≥1 dataset uploaded** targeting the selected SME use cases.
    - **Deliverable 3:** **PoC definition and execution** for each of the 5 use cases, with KPIs defined jointly with stakeholders (e.g., end-to-end completion reliability over a full workload).
    - **Go-to-market action:** Start a wider information campaign to robot-creator communities to contribute data for the representative use cases and begin paying representative compensation for datasets.

  - **Month 3 milestone (validation at scale):**
    - **Deliverable:** **≥10 representative, constrained SME automation use cases** actively running under controlled variables, with datasets provided by a selected community of robot creators.
    - **Primary goal:** Validate the end-to-end technology and business flow: SME use-case discovery → PoC execution → data contribution and compensation → skill/data reuse → repeatable deployments.
    - **Outcome target:** A validated exchange platform for robotic data demonstrated through real PoCs for real SME automation use cases, fueled by datasets from real robot creators.

- **Development method:**
  - **Use-case driven development:** Start from constrained, repeatable SME tasks and design “thin-slice” PoCs with clear KPIs.
  - **Iterative platform + robotics loop:** Each use case drives dataset requirements, which drives creator contributions and marketplace mechanics (upload, validation, compensation), which then feeds back into improved PoC performance and reusability.
  - **Controlled-variable scaling:** Expand from 5 to 10 use cases by standardizing data formats, evaluation, and deployment playbooks.

- **Development stage at application & current preparation:**
  - Platform is under active development with working capabilities for accounts, dataset upload/visualization (including LeRobot format support), marketplace listing/sale/purchase, and dataset search.
  - SME outreach is underway to identify constrained tasks suitable for two-arm automation PoCs, and creator-community outreach in South Korea is in progress.

- **Technology protection plan (initial):**
  - **Data rights & licensing:** Explicit dataset contributor terms (license scope, permitted uses, resale rules, attribution) and customer agreements defining rights to task-specific datasets and derived skills.
  - **Access control:** Role-based access to private customer datasets; separation between public marketplace datasets and customer-proprietary datasets.
  - **Operational controls:** Audit logs for dataset access and downloads; versioning to track provenance and prevent accidental leakage.
  - **IP strategy:** Keep core platform code, evaluation pipelines, and deployment playbooks proprietary; use NDAs for PoC engagements where appropriate.

#### 3. Growth Strategy (Scale-up)

##### Market Differentiation and Commercialization Strategy
- **Customer alternatives today (and why they fall short for SME high-mix work):**
  - **Alternative 1: Traditional fixed automation (custom cells, conveyors, PLC/vision, fixtures)**
    - **Why it wins:** Extremely high reliability, robustness, availability, and predictable cycle-time for stable, high-volume lines.
    - **Why it fails for SMEs:** High capex and engineering cost, long design/installation cycles, and low flexibility when SKUs/packaging/processes change.
    - **GamiphyAI edge:** One-day installation for constrained workcells, ≥10x lower upfront integration fee for SMEs, and flexibility for tasks that do not require extreme precision—validated through rapid PoCs and iterated via data/skill updates.

  - **Alternative 2: “Dataset marketplace” platforms (generic robotics/physical-AI datasets)**
    - **Example:** ExchAInge positions itself as “the marketplace for verified physical AI datasets,” emphasizing hardware verification, AI-powered QA, and monetization for creators.
    - **Web:** `https://exchainge.net/` (overview), `https://exchainge.net/how-it-works` (workflow)
    - **Why it wins:** Provides a buying/selling mechanism for datasets and encourages monetization.
    - **Why it fails for SME automation:** Does not start from specific SME workloads and “definition-of-done” KPIs; lacks onsite constraints, exception handling, and deployment responsibility; data may not map cleanly to repeatable production outcomes.
    - **GamiphyAI edge:** Dataset marketplace is tied to real SME use cases and PoCs—data is collected/curated to satisfy workload-level KPIs and is continuously refined through real deployments.

  - **Alternative 3: “Marketplace coming soon / waitlist” entrants**
    - **Example:** RobotDataMarket positions itself as “the marketplace for robotics training data” and currently indicates datasets are “coming soon.”
    - **Web:** `https://www.robotdatamarket.com/`
    - **Why it wins:** Clear positioning and early community building.
    - **Why it fails for SME automation:** Not yet proven in production; and (as a marketplace-only approach) still lacks the SME-to-creator closed loop that ties data to measurable automation outcomes.
    - **GamiphyAI edge:** We validate the platform through real SME PoCs first, creating a repeatable loop where dataset supply directly unlocks contracted automation outcomes.

  - **Alternative 4: Full-stack data engines / teleoperation service providers**
    - **Example:** SignIQ Lab markets an end-to-end data engine for sim-to-real transfer, offering a data corpus plus teleoperation services and processing pipelines (including “LeRobot ready” data positioning).
    - **Web:** `https://signiq-lab.ai/` (overview), `https://platform.signiq-lab.ai/` (platform)
    - **Why it wins:** High-quality multi-modal data at scale, strong infrastructure, and professional service delivery.
    - **Why it fails for SME automation:** Geared toward large robotics teams and large-scale data programs; higher price points and longer cycles; not optimized for Korean SMEs requiring fast, low-cost, “finish-the-workload” outcomes.
    - **GamiphyAI edge:** Korea-first SME focus, constrained tasks, small datasets, and rapid PoC-to-deployment conversion with ongoing monthly support.

  - **Alternative 5: Outsourced data collection networks**
    - **Example:** Sensei positions itself as “Scale AI for robotics data,” combining low-cost collection hardware and a network of paid human operators to fulfill data-generation requests.
    - **Web:** `https://senseirobotics.com/`, `https://www.ycombinator.com/companies/sensei`, `https://www.ycombinator.com/launches/Ljf-sensei-robotics-training-data-at-scale`
    - **Why it wins:** Scales data generation and reduces collection cost/time for robotics companies.
    - **Why it fails for SME automation:** Primarily solves data supply for robotics teams rather than solving the deployment and operations problem for SME production lines.
    - **GamiphyAI edge:** We combine SME need discovery + PoC + deployment + ongoing maintenance with a marketplace that recruits creators specifically for validated SME use cases.

- **Differentiation (what we do uniquely):**
  - **Closed-loop marketplace tied to real outcomes:** We connect SME automation “jobs-to-be-done” with creators who generate targeted datasets and skills, and we validate value through real PoCs and workload-level KPIs.
  - **Constrained, repeatable deployments:** We standardize the initial workcell pattern (two small arms, minimal sensing, task constraints) to enable fast installs and low integration fees.
  - **Reliability definition aligned to SMEs:** Success is defined as end-to-end unit completion over full workloads, not just lab-cycle demos.
  - **Local execution in South Korea:** Faster customer access, shorter feedback loops, and community-building with local robot creators.

- **Commercialization & expansion strategy (entry → scale):**
  - **Production/launch:** Convert the first 5 constrained use cases into measurable PoCs (Month 1), then expand to ≥10 controlled-variable use cases (Month 3) and standardize playbooks for repeat deployments.
  - **PR/marketing:** Publish case-study style results (before/after, workload completion, reliability, human-labor reduction) to attract both SME owners and creators; run targeted campaigns in Korea robot-creator communities to recruit dataset contributors aligned to validated use cases.
  - **Distribution/sales:** Direct outreach to SME owners (decision makers) for PoC intake; partner with local automation integrators or hardware resellers for procurement and on-site installation support where beneficial.
  - **Revenue strategy:** Low upfront PoC + low integration fee to reduce adoption friction, followed by recurring subscription (data/skills) + maintenance/support to monetize continuous improvement and operational reliability.
  - **Network acquisition:** Build a creator pipeline that scales with demand: as more SMEs define use cases, creators receive clearer tasks and compensation; as more creators contribute, PoCs become faster/cheaper and reuse increases.

#### 4. Team Composition (Team)

| No. | Position | Responsibilities | Capabilities (Career & Education) | Joining Status |
|-----|----------|-----------------|-----------------------------------|----------------|
| 1 | Robotics Lead | Robotics PoCs, data/skill pipeline, VLA controller integration, deployment playbooks for SME automation | Juan Medrano — Ph.D. (Candidate) Mechanical Engineering (ML for CV & robotic manipulation), M.Sc. Mechatronics; 7+ years robotics perception incl. Agility Robotics (Digit) and large-scale multi-modal dataset creation | Joined |
| 2 | Hardware Lead | Robot hardware selection/integration, sensing stack, EOAT/fixtures, embedded/system reliability for PoCs and deployments | Jose Bagur — Mechatronics Engineer (UVG), Coordinator UVG Aerospace Lab; lead of Quetzal-1/2 CubeSat programs; deep embedded/sensor/system deployment expertise | Joined |
| 3 | Platform Lead | Lead development of GamiphyAI data exchange platform, marketplace mechanics, data validation flows, and product delivery | Senior full-stack / platform engineer (TBD) | Planned (next months) |
| 4 | Commercial Lead | Lead SME customer acquisition, PoC scoping/contracts, partnerships (integrators/hardware), pricing and recurring revenue growth | Business development / sales lead (TBD) | Planned (next months) |

- Describe the representative's capabilities related to implementing and commercializing the product/service
- **Representative (Juan Medrano) commercialization capability:**
  - **Local market access (Korea):** 9 years living in South Korea with business-level proficiency in Korean and English, enabling direct communication with SME owners, partners, and creator communities.
  - **Technical credibility in robotics:** M.Sc. and Ph.D. candidate in Mechanical Engineering at Sungkyunkwan University, focused on robotics and machine learning for real-world manipulation/perception.
  - **Proven industry execution:** ~3 years at Agility Robotics as a Perception Engineer, building ML-driven perception systems used to enable Digit humanoid robot operation in real warehouse deployments.
  - **Community and ecosystem building:** Active participation and network-building in the Korean robotics ecosystem through community initiatives and recurring presence at major industry events (e.g., Korean Robotics Society annual events, AI Expo, Korea MAT), supporting creator acquisition and go-to-market partnerships.

#### 5. KAIST Mentoring Support (Optional)

##### Expectations for KAIST Robotics Mentoring
- **Mentoring needs from KAIST Robotics (requested support):**
  - **Access to KAIST robotics communities:** Introductions to KAIST labs, students, clubs, and other robotics groups to recruit robot creators and accelerate dataset/skill contributions aligned to validated SME use cases.
  - **High-growth company structuring:** Guidance on structuring the company and operating model for fast growth across South Korea, the US, and Europe (go-to-market sequencing, partnerships, pricing, and hiring plan).
  - **Alumni network access:** Connections to KAIST alumni building robotics companies (hardware and software), for partnerships, technical validation, and early adopter programs.
  - **Equipment and prototyping support:** Access to equipment and facilities to accelerate PoCs (robot arms, GPUs, machining tools, and 3D printers).
  - **Platform scaling expertise:** Mentorship and expert access on building and scaling platform businesses (marketplace dynamics, creator incentives, pricing, and trust/verification mechanisms).

#### 6. Product/Service Reference Materials (Optional)

6-1. Insert Product/Service Images or Videos
- For videos, insert links
- **Platform screenshots (GamiphyAI):**
  - `assets/business-plan/platform_login.png` (Login / onboarding)
  - `assets/business-plan/dataset_upload.png` (Dataset upload flow)
  - `assets/business-plan/dataset_viewer.png` (Dataset visualization / LeRobot-format viewer)
  - `assets/business-plan/marketplace_search.png` (Marketplace listing + search)

- **Robotics PoC photos/videos (optional):**
  - `assets/business-plan/poc_workcell_photo.png` (Two-arm PoC workcell)
  - Video link: `<insert demo link>` (PoC workload completion demo)

6-2. System / Architecture Diagram

```mermaid
flowchart LR
  C[Robot creators community] -->|upload datasets| M[Dataset Marketplace\n(list, price, license, sell, buy)]
  B[Dataset buyers\n(robotics teams, SMEs, OEMs)] -->|search + purchase| M
  M -->|payout / compensation| C

  subgraph Trust[Trust + Quality Layer]
    Q[Verification + QA\n(format checks, sample visualizations,\nbenchmark hooks)]
    L[Licensing + provenance\nterms, attribution, audit logs]
  end

  C --> Q --> M
  M --> L --> B

  A[SME use cases] -->|defines tasks + KPIs| S[Use case specs]
  S -->|creator briefs| C
  B -->|deploys skills/models| F[PoC + deployment workcell]
  F -->|feedback + new data needs| S
```

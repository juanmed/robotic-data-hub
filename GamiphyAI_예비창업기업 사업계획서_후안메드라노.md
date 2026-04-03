# [예비창업기업] 사업 계획서

## 사업 개요
| 항목 | 내용 |
|------|------|
| **성명** | GamiphyAI |
| **기술분야** | Robot data and skills for Physical AI |
| **팀 명 (예비)** | 3 |
| **E‑mail / 휴대전화번호** | fer@gamiphy.ai / 010 8505 9134 |
| **아이템 개요** | GamiphyAI is the marketplace for physical AI: discover how robots can automate your SME operations, get real-world datasets and solutions from robot creators, and assess and improve your brand visilibity in a future powered by physical AI. 
---

### 아이템 소개

#### 1. 문제 인식 (Problem)

##### 창업아이템 개발 동기

> **Key point:** Robotics AI lacks the data infrastructure that enabled language AI to scale. SME manufacturers need flexible automation but cannot afford traditional fixed solutions; roboticists need the correct incentives to generate datasets; OEM will soon face a visibility gap in these datasets. GamiphyAI bridges these gaps through a services-to-platform model that generates proprietary robotics data from real customer deployments.

**The robotics data gap**

Large language models scaled on internet-scale text corpora — GPT-3 was trained on 300 billion tokens from filtered Common Crawl, WebText2, Books, and Wikipedia [7]. Robotics does not enjoy equivalent data conditions. Robot learning depends on multi-modal, time-correlated, embodiment-specific data — RGB, depth, force, proprioception, actions, failures, and safety events — all of which are slower and more expensive to collect in the physical world. Even Open X-Embodiment, a major collaborative step forward, combined data from only 60 datasets across 22 embodiments and about one million trajectories [8]. A focused, organized effort is required to create the datasets, skills, and models that will enable intelligent, dexterous, and robust robotic manipulation — and to make them accessible to the broader robotics ecosystem.

**The practical market problem**

The core business problem is not that robots are unavailable. It is that automation in high-mix, low-volume (HMLV) manufacturing usually breaks on engineering cost, integration burden, changeover time, and maintenance complexity — especially for smaller manufacturers and variable workflows. This creates three linked bottlenecks:

1. **SME automation bottleneck.** Smaller manufacturers cannot justify traditional fixed automation for repetitive but variable tasks. They face decision friction (no fast, low-risk way to validate ROI), high employee rotation in low-wage repetitive roles, and changeover costs that destroy payback.
2. **Robot-data bottleneck.** Robotics teams and integrators lack a large-scale and fast platform to generate, source, validate, version, license, and improve task-specific data and deployable skills. There is no equivalent of an "app store" for robot capabilities.
3. **Brand invisibility in training data.** As embodied AI systems scale, products that are well-represented in training datasets will have first-mover advantages in robot compatibility. Products that are absent will face a compatibility tax — integration delays, custom engineering costs, or exclusion from automated workflows.

GamiphyAI's thesis is to solve all three through one unified platform and sequence: start from real customer workflows, use paid PoCs to define KPIs and collect proprietary data, convert validated workflows into repeatable skill and deployment packages, identify brand opportunities and representation gaps and then turn those assets into a platform that serves automation customers, data creators, integrators, and product brands.

**Pre-application progress and track record**

- **Platform development (gamiphy.ai):** The GamiphyAI platform is under active development. Completed features include user account creation, dataset upload and visualization (with native support for the LeRobot format), and a functional marketplace where users can list, sell, and purchase datasets — including dataset search functionality.
- **Community outreach:** Active outreach to the LeRobot creator community in South Korea is in progress, with the goal of recruiting initial dataset contributors aligned to validated SME use cases.
- **SME engagement:** Direct engagement with small Korean SME manufacturers is underway to identify constrained, high-ROI workflows suitable for rapid PoCs — targeting tasks feasible with small robot arms in packing, kitting, labeling, food preparation and light assembly.
- **Hardware manufacturer engagement:** Conversations with Korean robot hardware manufacturers are ongoing to pilot tailored (custom) dataset generation and distribution workflows through our platform using their hardware
- **Industry presence:** Active participation in Korean robotics ecosystem events including Korean Robotics Society annual conferences, AI Expo Korea, and Korea MAT — building network and visibility for creator acquisition and go-to-market partnerships.
- **Founder preparation:** 9 years living in South Korea with business-level Korean proficiency, enabling direct communication with SME owners, partners, regulators, and creator communities.

##### 창업아이템의 목표시장 현황 분석

> **Key point:** Korea is the ideal beachhead — world's highest robot density (1,012 per 10K workers), yet 75.5% of smart factories remain at basic level. Robots are widely accepted in society reducing friction and rejection. The global opportunity spans millions of under-automated SME manufacturing sites plus >3,000 major product brands that will need dataset representation as robots become part of daily life and need to interact with their products.

**Global context — the scale of the HMLV manufacturing opportunity**

Globally, SMEs account for roughly 90% of businesses and more than 50% of employment [1]. In manufacturing, they represent the long tail of sites where repetitive work exists but workflow variability makes traditional fixed automation uneconomic. The observable manufacturing base in official data is enormous:

| Region | Manufacturing enterprises/sites | Key labor cost reference |
|---|---:|---|
| European Union | 2,200,000 (2023) [2] | €33.9/hour avg industry labour cost (2024) [11] |
| United States | 632,885 small mfg businesses [15] | $29.77/hour avg mfg production earnings (Feb 2026) [10] |
| China | 4,048,000 industrial enterprises (2023) [3] | $2-8/hour avg mfg labor cost |
| Japan | 176,858 establishments with 4+ persons (2021) [4] | $9.5 – $13/hour,  SMEs = 99.7% of all enterprises |
| South Korea | 504,728 manufacturing establishments (2024 prelim) [13] | $8 - 16/hour, World's highest robot density |

Robot adoption is real but far from saturated: global average density is only 162 robots per 10,000 manufacturing employees [6], and the global industrial robot stock reached 4.28 million operating units in 2023 [5]. The base-case global recurring TAM for the HMLV workflow offering is approximately **USD 31.5B per year**, with a conservative sensitivity range of USD 14B–81B depending on workflow fit and regional assumptions [1][2][3][4][6][10][11][15][16].

**Korea as the beachhead — why here, why now**

Korea is the right first market for four structural reasons:

1. **World-leading robot density:** 1,012 robots per 10,000 manufacturing employees — the highest in the world [6], making it the strongest proving ground for automation products.
2. **Large, dense SME manufacturing base:** Statistics Korea reported 504,728 manufacturing establishments in preliminary 2024 data [13]. Among 163,273 factory-owning SME and mid-sized firms, 19.5% have adopted smart factories — but **75.5% of those smart factories remain at the basic stage** [14]. Small country, industrial clusters, high SME density.
3. **Fourth-largest robot market:** Korea installed 31,444 industrial robots in 2023 [5][6], demonstrating strong buyer appetite.
4. **Government support alignment:** Korea's 스마트공장 보급·확산사업 and related programs by the Ministry of SMEs and Startups support automation adoption, and GamiphyAI's PoC and deployment structure can align with these frameworks.

**Korea market sizing (TAM / SAM / SOM)**

The most defensible beachhead denominator is the smart-factory adopter pool:

- **Digitally enabled sites:** 163,273 factory-owning firms × 19.5% smart-factory adoption = **~31,838 sites** [14]
- **Workflow-fit filter (10–20%):** Applying a filter for HMLV workflows (packing, kitting, labeling, light assembly, food preparation) yields an initial candidate pool of **3,200–6,400 sites**
- **Recurring revenue per deployed line:** KRW 24M–30M per year (software + support)
- **Korea recurring TAM:** KRW 76.8B–192.0B per year, before one-time PoC and deployment fees

**Serviceable Obtainable Market (SOM) — conservative capture plan:**

| Year | Deployed sites (Korea) | Cumulative  revenue potential |
|---:|---:|---|
| 1 | 10 | KRW ~270M  |
| 2 | 100 | KRW ~2700M  |
| 3 | 1000 | KRW ~27B  |

Year 3 represents only ~25 - 30 % of the Korea beachhead SAM. The global expansion path (High-income Asia → EU → US) adds enough additional sites by Year 4 and 5 for global expansion, providing an extensive pool of sites worldwide.

**Brand Dataset Services — a massive parallel market opportunity**

The brand-services opportunity is orthogonal to the automation TAM because it targets different buyers (marketing/product teams vs. operations) and different pain points (future AI-robot compatibility vs. current labor cost). The addressable market is every manufacturer whose products will interact with AI-powered robots.

*Global product category estimates:*

| Category | Estimated significant brands |
|---|---:|
| Consumer appliances & electronics (major appliances, small appliances, consumer electronics) | ~650 |
| Industrial equipment & tools (power tools, hand tools, components, robotics/automation equipment) | ~900 |
| Commercial & institutional (restaurant, medical, laboratory equipment) | ~650 |
| Automotive & transportation components (Tier 1 suppliers, component specialists) | ~550 |
| Packaging & materials | ~350 |
| **Total initial addressable brands globally** | **~3,100** |

*Conservative Brand Dataset Services TAM model: Pricing Tiers by Company Revenue*

| Company Annual Revenue | Classification | Estimated Annual Dataset Fee | Estimated Brand Count | Segment TAM |
|---|---|---:|---:|---:|
| $10B+ | Tier 1 Global Leaders | $10M - $20M | 200 | $2B - $4B |
| $1B - $10B | Tier 2 Mid-Market | $2M - $5M | 650 | $1.3B - $3.25B |
| $100M - $1B | Tier 3 Specialists | $250K - $1M | 1,000 | $250M - $1B |
| $10M - $100M | Tier 4 Small/Regional | $25K - $250K | 1,200 | $30M - $300M |
| **TOTAL** | | | **~3,050** | **$3.58B - $8.55B** |

*Conservative Brand Dataset Services TAM model:*

- Tier 1 global brands (top 10%): USD 500K–2M/year per brand
- Tier 2 regional/mid-market brands (next 30%): USD 150K–500K/year per brand
- Tier 3 specialist brands (remaining 60%): USD 50K–150K/year per brand
- **Base-case TAM at steady state: ~$2.8B annually** (150 Tier 1 × $10M + 500 Tier 2 × $2M + 800 Tier 3 × $250K + 1000 Tier 4 x $100K)

*Brand Dataset Services SAM/SOM (phased adoption):*

| Period | Penetration | Active brand customers | Estimated annual revenue |
|---|---|---:|---|
| Year 1–2 | Early adopters (5%) | 3–8 | USD 350K–1.8M (pilot pricing) |
| Year 3–4 | Fast followers (15%) | 20–45 | USD 5.6M–14.3M |
| Year 5+ | Mainstream (30%+) | 85+ | USD 28.9M+ |

This revenue stream draws from marketing/product budgets rather than operations budgets, with different buyer cycles, lower price sensitivity (driven by competitive necessity rather than ROI payback), and natural customer LTV extension as brands expand their product lines. Korea's concentration of major appliance and electronics brands (Samsung, LG, Coupang, etc.) provides a natural entry point for early brand pilot programs.

---

#### 2. 제품/서비스 소개 (Solution)

##### 창업아이템 소개

> **Key point:** Four-pillar revenue model — automation deployments, creator marketplace, platform services, and brand dataset services — built through a services-to-platform transition that avoids cold-start marketplace failures by generating real demand and proprietary data first.

**Business model and revenue generation**

GamiphyAI operates a four-pillar revenue model distinct from traditional automation companies:

1. **Automation Consumers** (SME factories) pay for automation deployments targeting repetitive but variable manufacturing workflows (packing, kitting, labeling, light assembly, small-parts handling, food preparation), plus recurring subscription and support contracts.
2. **Robot Creators** a new type of "influencer" (data providers, labs, specialized companies) earn revenue by providing validated task data, algorithms and deployable skills to the platform.
3. **Platform Services** capture transaction fees, licensing revenue, and access fees from integrators, OEMs, and developers who consume validated skills and benchmarks.
4. **Product Brands/OEMs** pay for dataset representation services to ensure their products remain compatible with AI-powered robots — a brand insurance model addressing the emerging competitive necessity of dataset inclusion.

This is not a broad marketplace on Day 1. It is a **services-led wedge strategy** that generates proprietary data through paid automation deployments, then productizes repeatable elements into platform layers. This sequence deliberately avoids the cold-start failure mode of two-sided industrial marketplaces [9].

**Korea pricing model (revised)**

| Revenue stream | Pricing (KRW) | Notes |
|---|---|---|
| Paid PoC | 8M–15M per engagement | 2–4 weeks; process study, KPI baseline, go/no-go |
| Deployment / activation | 12M–25M per line/workcell | Software, data, workflow enablement; excl. hardware |
| Recurring subscription | 1.0M–2.0M / month per site | Skill versioning, data curation, evaluation, SKU updates |
| Support / maintenance | 0.6M–1.2M / month per site | Remote SLA; on-site visits billed separately |
| Hardware | Customer-direct or partner-financed | Not a profit center; pass-through coordination |

PoCs are designed to be positive gross margin. Deployments target positive or near-neutral margins. The recurring subscription layer is the highest-margin stream (70–80% target).

**Market entry status and progress**

- **Platform (gamiphy.ai):** Functional with user accounts, dataset upload/visualization (LeRobot format native support), marketplace listing/purchase/sale, and dataset search
- **Strategy:** Korea-first, leveraging the world's most robot-dense market and a society that adopts new technologies extremely fast. Services-to-platform transition rather than marketplace-first — learning from industrial platform failures that launched without proven demand or quality standards
- **Current activities:** Platform and Marketplace creation; SME discovery interviews to identify constrained workflows; LeRobot community outreach for creator recruitment; hardware manufacturer conversations for dataset distribution pilots

**Robotics technologies possessed**

- **Proprietary robotics data platform** for multi-modal, time-correlated, embodiment-specific data (RGB, depth, force, proprioception, actions, failures, safety events)
- **Skill package infrastructure** converting validated workflows into repeatable deployment templates
- **Evaluation and benchmarking tooling** for task-specific robot performance validation
- **Dataset versioning and licensing systems** supporting both automation deployments and future brand representation services
- **Workflow-centric deployment architecture** designed for HMLV manufacturing environments where traditional fixed automation fails economically

The technical differentiation stems from addressing robotics' fundamental data scaling challenge: unlike language AI trained on hundreds of billions of tokens, robotics lacks equivalent data infrastructure — creating a data moat opportunity for whoever builds the closed loop between real deployment demand and validated data supply.

##### 창업아이템 개발 / 진행(준비)현황

> **Key point:** Services-to-platform development sequence with clear 90-day, 12-month, and 24-month milestones. Platform already functional. Final deliverable: a validated, revenue-generating robotics data and skill platform with proven SME automation deployment playbooks.

**Final deliverable (within agreement period)**

A test-validated robotics data and skill platform demonstrated through:
1. At least 30 robot creators with real accounts in our platform
2. At least 3 self-sponsored SME challenge tasks in our platform targeting constrained, well defined operation for real, paid PoCs with Korean customers and measurable KPI results
3. A growing library of curated, task-specific datasets contributed by robot creators and validated through real deployments
4. 15–20 structured SME discovery interviews for future task exploration and dataset generation efforts
5. AI based automation proposal platform: user inputs their task in text+video+image format, platform generates a simulation based robot solution environment
6. AI based assessment of brand visibility in public robot datasets

**Development method — services-to-platform sequence**

The approach is specifically designed to avoid the two-sided platform cold-start problem:

1. Win tightly scoped automation projects with paying customers
2. Generate proprietary multi-modal data (vision, force, proprioception, failures) during real deployments
3. Validate workflows against real KPIs in production environments
4. Extract repeatable patterns into standardized skill packages
5. Build platform infrastructure using proven, production-tested components

**Development milestones**

***First 90 days:***

- 15–20 structured SME discovery interviews
- 3 signed paid PoC agreements
- 200 seed creator or lab relationships (dataset contributors)
- 1 Korean safety / compliance checklist (KOSHA alignment)
- 1 standard KPI and ROI reporting template

***By 12 months:***

- 12 paid PoCs completed
- 3 converted deployments with recurring contracts
- 3 recurring support or subscription contracts
- 20+ curated tasks and 100+ datasets variants on platform
- 1 reusable deployment playbook for a named workflow class

***By 24 months:***

- 100 deployed automation sites
- 50+ workflow datasets on platform
- 3 standardized skill packages
- First brand dataset services pilot (targeting 1–2 anchor customers)
- Published benchmark showing dataset quality impact on deployment success rates

**Current development stage**

Pre-deployment preparation phase. Platform (gamiphy.ai) is functional with core features (accounts, upload, visualization, marketplace, search). Focus is on establishing Korea beachhead positioning, SME customer pipeline development, and creator community recruitment. The three-phase roadmap extends through 36+ months to full platform operation.

**Technology protection strategy**

- **Data rights and licensing:** Explicit dataset contributor terms (license scope, permitted uses, resale rules, attribution) and customer agreements defining rights to task-specific datasets and derived skills
- **Access control:** Role-based access to private customer datasets; separation between public marketplace datasets and customer-proprietary data
- **Operational controls:** Audit logs for dataset access/downloads; versioning to track provenance and prevent leakage
- **IP strategy:** Core evaluation pipelines, deployment playbooks, and platform orchestration code are kept proprietary. NDAs for PoC engagements where customer process data is sensitive
- **Proprietary datasets:** Each paid deployment generates real-world task data impossible to replicate synthetically — accumulating a data moat that compounds with every customer
- **Evaluation benchmark credibility:** Quality standards and benchmarks established through real deployment validation, creating a trusted quality layer competitors must match

---

#### 3. 성장전략 (Scale‑up)

##### 시장 내 차별화·사업화 전략

> **Key point:** Korea beachhead (0–24 mo) → High-income Asia + EU (18–36 mo) → Global platform (36+ mo). Differentiated from traditional automation by flexibility and data-driven iteration; from pure marketplaces by proven demand and deployment-validated data quality.

**Target customer segmentation**

| Stakeholder | Buyer profile | Pain point | Revenue stream |
|---|---|---|---|
| Robot Consumers | SME factory owners / ops managers | Can't afford or justify traditional automation for variable workflows | PoC fees + deployment + recurring subscription |
| Robot Creators | Labs, researchers, data providers | Have robotics data but no monetization channel | Platform transaction fees, creator incentives |
| Platform Participants | Integrators, OEMs, developers | Need validated skills and benchmarks, not only raw data | Licensing fees, API access |
| Product Brands | VP Product / Marketing at manufacturers | Future robot incompatibility risk | Dataset representation subscriptions (future) |

**Competitive differentiation**

| Alternative | Why it wins | Why it fails for SME HMLV | GamiphyAI edge |
|---|---|---|---|
| **Traditional fixed automation** (custom cells, PLC/vision) | Extreme reliability for stable high-volume lines | High capex, long cycles, low flexibility when SKUs change | Lower upfront cost, rapid PoCs, data-driven iteration for variable workflows |
| **Dataset marketplaces** (e.g., ExchAInge) | Buying/selling mechanism for datasets, AI-powered QA | Does not start from SME workloads or production KPIs; data may not map to real outcomes | Marketplace tied to real SME use cases — data is collected and validated through actual deployments |
| **Full-stack data engines** (e.g., SignIQ Lab) | High-quality multi-modal data at scale, strong infrastructure | Geared toward large robotics teams; higher price points; not optimized for fast, low-cost SME outcomes | Korea-first SME focus, constrained tasks, rapid PoC-to-deployment conversion |
| **Outsourced data collection** (e.g., Sensei / YC) | Scales data generation cost/time for robotics companies | Solves data supply for robotics teams, not deployment/operations for SME production lines | Combines need discovery + PoC + deployment + maintenance with a marketplace for validated use cases |

**Geographic expansion strategy**

- **Korea beachhead (0–24 months):** Prove repeatability and unit economics. Leverage world-leading robot density to validate business model, generate case studies, and build proprietary datasets. Target: 3 deployed sites Year 1, 15 by Year 2.
- **Regional expansion (18–36 months):** High-income Asia (Japan: 176,858 establishments [4]; Singapore) and selected EU manufacturing corridors (2.2M enterprises [2]) through channel partners. Target: first 5–10 deployments outside Korea.
- **Global platform (36+ months):** Scale platform to serve the broader SME manufacturing segment (90% of global businesses [1]) with standardized skill packages, deployment playbooks, and brand dataset services.

**Commercialization strategy**

- **Production & launch:** Services-first approach. First 3–5 Korea deployments de-risk platform development while generating revenue and proprietary data immediately.
- **Promotion & marketing:** Published case studies with before/after KPIs (workload completion, reliability, labor reduction). Targeted campaigns in Korean robot-creator communities: challenges, hackathons, demos, university/lab promotion. Reach out through job platforms: Karrot Jobs, Albamon, DongnaeAlba, Alba Heaven. Participation in exhibitions: Franchise exhibitions, Automation World Expo, AI Expo, Korea MAT. 
- **Distribution & sales:** Direct outreach to SME owners (fast decision-makers) for PoC intake. Partner with local automation integrators and hardware sellers/resellers for procurement and installation support. Platform API/licensing access for integrators and developers.
- **Revenue growth model:**
  - *Immediate:* Automation deployment fees + recurring support contracts
  - *Medium-term:* Platform transaction fees as creator and consumer sides grow
  - *Long-term:* Brand dataset service subscriptions, skill licensing, evaluation tooling subscriptions

**Revenue outlook (Korea automation, KRW millions)**

| Year | Paid PoCs | Deployments | Recurring sites (year-end) | Revenue: PoCs | Revenue: Deploy | Revenue: Recurring | Total |
|---:|---:|---:|---:|---:|---:|---:|---:|
| Y1 | 6 | 3 | 3 | 60 | 54 | 41 | 155 |
| Y2 | 15 | 8 | 8 | 150 | 144 | 166 | 460 |
| Y3 | 30 | 18 | 20 | 300 | 324 | 460 | 1,084 |
| Y4 | 45 | 32 | 40 | 450 | 576 | 1,000 | 2,026 |
| Y5 | 70 | 55 | 70 | 700 | 990 | 1,932 | 3,622 |

**Revenue outlook (Brand Dataset Services, USD thousands, global)**

| Year | Active brand customers | Annual contract value | Variable projects | Total brand revenue (USD K) |
|---:|---:|---:|---:|---:|
| Y1 | 3 | 300 | 50 | 350 |
| Y2 | 8 | 1,600 | 180 | 1,780 |
| Y3 | 20 | 5,000 | 600 | 5,600 |
| Y4 | 45 | 12,750 | 1,500 | 14,250 |
| Y5 | 85 | 25,500 | 3,400 | 28,900 |

Y1–Y2: Pilot programs with 3 anchor brands (e.g., 1 appliance, 1 industrial equipment, 1 electronics) at pilot pricing (~USD 100K avg), expanding to 8 brands as case studies prove value. Y3–Y5: Competitive cascade drives adoption — brands cannot afford to be absent if competitors are represented. Mix shifts toward Tier 2 and Tier 3 contracts as the service matures.

**Combined revenue outlook (KRW millions equivalent)**

Converting brand revenue at ~KRW 1,300/USD:

| Year | Korea automation | Brand services (KRW equiv) | Combined total |
|---:|---:|---:|---:|
| Y1 | 155 | 455 | 610 |
| Y2 | 460 | 2,314 | 2,774 |
| Y3 | 1,084 | 7,280 | 8,364 |
| Y4 | 2,026 | 18,525 | 20,551 |
| Y5 | 3,622 | 37,570 | 41,192 |

**By Y4–Y5, Brand Dataset Services becomes the largest revenue stream**, demonstrating how a services-led platform can evolve into multiple high-value business lines. Brand services carry higher blended margins (65–75% vs. 40–60% for automation) due to lower hardware/field costs, longer contracts, and competitive-necessity pricing dynamics.

**Human resources & network strategy**

- Korea robotics ecosystem leverage through established research relationships and industry event presence
- First 12-month hiring plan: (1) BD / commercial support for SME sales, (2) field robotics engineer, (3) senior full-stack / platform engineer, (4) finance and operations support
- Technical partnerships with robot OEMs and integrators for platform distribution
- Advisory board targets: Korean manufacturing/factory-ops advisor, robotics SI/safety advisor, marketplace/B2B SaaS scaling advisor

---

#### 4. 팀 구성 (Team)

> **Key point:** Two joined co-founders with combined 10+ years in robotics perception, hardware deployment, and large-scale multi-modal dataset creation — including production-deployed systems at Agility Robotics and national satellite programs.

| 순번 | 직위 | 담당 업무 | 보유역량(경력 및 학력 등) | 합류 여부 |
|-----|------|-----------|--------------------------|-----------|
| 1 | Robotics Lead (대표) | Robotics PoCs, data/skill pipeline, VLA controller integration, deployment playbooks, SME customer relationships | Juan Medrano — Ph.D. (Candidate) Mechanical Eng. (ML for CV & robotic manipulation), M.Sc. Mechatronics; 7+ yrs robotics perception incl. Agility Robotics (Digit humanoid, warehouse deployment); large-scale multi-modal dataset creation; 9 yrs in Korea, business-level Korean | 완료 |
| 2 | Hardware Lead | Robot hardware selection/integration, sensing stack, EOAT/fixtures, embedded/system reliability for PoCs and deployments | Jose Bagur — Mechatronics Engineer (UVG), Coordinator UVG Aerospace Lab; lead of Quetzal-1/2 CubeSat programs (Guatemala's 1st & 2nd national satellites; SpaceX CRS-20 launch); deep embedded/sensor/system deployment expertise | 완료 |
| 3 | Platform Lead | Lead development of GamiphyAI data exchange platform, marketplace mechanics, data validation flows | Senior full-stack / platform engineer (TBD) | 예정('26.Q2) |
| 4 | Commercial Lead | SME customer acquisition, PoC scoping/contracts, partnerships, pricing and recurring revenue growth | Business development / sales lead (TBD) | 예정('26.Q3) |

**대표자가 보유하고 있는 창업아이템 구현 및 판매 관련 역량 등**

**Technical credibility and direct domain expertise:**
Juan Medrano holds a Ph.D. (Candidate) in Mechanical Engineering from Sungkyunkwan University, focused on machine learning for computer vision and robotic manipulation, and an M.Sc. in Mechatronics Engineering. He has 7+ years of industry experience in robotics perception, including a role as Perception Engineer II at Agility Robotics, where he developed detection, segmentation, and 6DoF pose estimation systems for the Digit humanoid robot — deployed in live GXO warehouse operations. During this work he was directly involved in collecting large-scale, multi-modal datasets for humanoid robots, including visual (RGB, depth), inertial (IMU), kinematics (joint angles), and world-state data (objects, other robots, people), all used for training machine learning models for manipulation and locomotion. His prior research also includes building datasets for autonomous drone navigation. This first-hand experience with the full data pipeline — collection, annotation, format standardization, and ML integration — directly informs the platform's design.

**Commercialization capability:**
- **Local market access (Korea):** 9 years living in South Korea with business-level proficiency in Korean and English, enabling direct communication with SME owners, partners, regulators, and creator communities.
- **Industry network:** Active participation and network-building in the Korean robotics ecosystem through community initiatives and recurring presence at major industry events (Korean Robotics Society annual events, AI Expo Korea, Korea MAT), supporting creator acquisition and go-to-market partnerships.
- **Proven industry execution:** ~3 years at Agility Robotics building perception systems that were deployed in live warehouse operations — demonstrating ability to take ML systems from research to production.

---

#### 5. KAIST 멘토링 연계 (선택)

##### KAIST 로봇 분야 멘토링 시 희망사항

> **Key point:** Three specific, actionable requests: (1) Lab introductions for dataset creator recruitment, (2) Equipment access for PoC acceleration, (3) Alumni network for early adopter partnerships.

1. **Access to KAIST robotics communities for creator recruitment:** Introductions to KAIST labs, students, clubs, and robotics groups to recruit robot creators who can contribute LeRobot-format (or other) datasets aligned to validated SME use cases within the first 90 days. This directly accelerates the platform's supply side.

2. **Equipment and prototyping support for PoC acceleration:** Access to robot arms, GPUs, machining tools, 3D printers and other workshop tools to rapidly build and test PoC workcells — reducing time-to-first-deployment and hardware procurement bottlenecks in the early stage.

3. **Alumni network access for partnerships and early adoption:** Connections to KAIST alumni building robotics companies (hardware and software) for technical partnerships, validation, and early adopter programs. Specifically seeking introductions to alumni at Korean robot OEMs, integrators, and SME-focused technology companies.

4. **Platform scaling expertise:** Mentorship on building and scaling platform businesses — marketplace dynamics, creator incentive design, pricing strategy, and trust/verification mechanisms — from faculty or alumni with relevant B2B platform experience.

5. **High-growth company structuring:** Guidance on structuring the company and operating model for fast growth across South Korea, the US, and Europe — including go-to-market sequencing, partnership strategy, and hiring plan optimization.

---

#### 6. 제품/서비스 참고자료 (선택)

6‑1. 제품 및 서비스 이미지/영상 삽입

- **GamiphyAI Platform — Marketplace view:** [Screenshot of gamiphy.ai marketplace interface showing dataset listing, search, and purchase functionality]
- **GamiphyAI Platform — Dataset visualization:** [Screenshot showing LeRobot-format dataset upload and multi-modal data visualization (RGB, depth, joint angles)]
- **GamiphyAI Platform — User dashboard:** [Screenshot showing user account, uploaded datasets, and transaction history]
- **System architecture diagram:** [Diagram showing the services-to-platform data flow: SME PoC → data collection → skill extraction → platform distribution → creator contributions → improved deployments]
- **Target workcell concept:** [Photo or CAD rendering of constrained dual-arm workcell for SME packing/kitting task]

*Note: Screenshots and diagrams to be captured from the live platform at gamiphy.ai and included in the final submission.*

---

## References

[1] World Bank. "Small and Medium Enterprises (SMEs)."

[2] Eurostat. "Businesses in the manufacturing sector" (2023).

[3] National Bureau of Statistics of China. "Fifth National Economic Census Communiqué" (2023).

[4] Statistics Bureau of Japan. *Statistical Handbook of Japan 2023*, manufacturing table.

[5] International Federation of Robotics. "Record of 4 Million Robots Working in Factories Worldwide."

[6] International Federation of Robotics. "Global Robot Density in Factories Doubled in Seven Years."

[7] Brown, T. et al. "Language Models are Few-Shot Learners." arXiv, 2020.

[8] Open X-Embodiment Collaboration. "Open X-Embodiment: Robotic Learning Datasets and RT-X Models." arXiv, 2023.

[9] Constantinides, P. et al. "The dynamics of entry for digital platforms in two-sided markets." *Electronic Markets*.

[10] U.S. Bureau of Labor Statistics. Employment Situation Table B-8, manufacturing hourly earnings, February 2026.

[11] Eurostat. "Hourly labour costs ranged from €11.2 to €55.2 in 2024."

[12] Statistics Korea. "Preliminary Results of the 2023 Census on Establishments."

[13] KOSIS. "Indicator Comparison by Region / Census on Establishments."

[14] Ministry of SMEs and Startups, Republic of Korea. Smart-factory adoption statistics and support notices.

[15] U.S. Small Business Administration. Small Business Profile.

[16] ILO. *World Employment and Social Outlook: Trends 2024*.

[17] International Federation of Robotics. *World Robotics 2024* press release.

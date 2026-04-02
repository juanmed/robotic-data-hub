# 창업아이템 개발 동기

Large language models scaled on internet-scale text corpora with standardized representations. GPT-3, for example, was trained on 300 billion tokens from filtered Common Crawl, WebText2, Books, and Wikipedia [7]. Robotics does not enjoy equivalent data conditions. Robot learning depends on multi-modal, time-correlated, embodiment-specific data such as RGB, depth, force, proprioception, actions, failures, resets, and safety events, all of which are slower and more expensive to collect in the physical world. Even Open X-Embodiment—a major step forward—combined data from 60 datasets across 22 embodiments and about one million trajectories, still far below web-scale language data [8].

The practical market problem

The core business problem is not "robots are unavailable." It is that automation in high-mix, low-volume manufacturing usually breaks on engineering cost, integration burden, changeover time, and maintenance complexity. That is especially true for smaller manufacturers and variable workflows.

This creates three linked bottlenecks:

1. **SME automation bottleneck.** Smaller manufacturers often cannot justify traditional fixed automation for repetitive but variable tasks.
2. **Robot-data bottleneck.** Robotics teams and integrators lack a fast way to source, validate, version, license, and improve task-specific data and deployable skills.
3. **Brand invisibility in training data**: Products that are well-represented in training datasets will have first-mover advantages in robot compatibility.

GamiphyAI's thesis is to solve both through one sequence: start from real customer workflows, use paid PoCs to define KPIs and collect data, convert validated workflows into repeatable skill and deployment packages, and then turn those assets into a broader platform.

The emerging brand visibility/representation problem

A third bottleneck is becoming visible as foundation models enter robotics: **brand invisibility in training data**. Every robot dataset is embodiment- and object-specific:

- An apple-cutting dataset uses a specific robot arm brand, end-effector brand, knife brand, and cutting board brand
- An electronics assembly dataset uses specific robot, gripper, soldering iron, component, and fixture brands
- A warehouse picking dataset uses specific AMR, gripper, tote, and SKU brands
- A home cleaning dataset uses specific robot vacuum, mop, and appliance brands (refrigerator, microwave, dishwasher, washing machine)

As embodied AI systems scale, **products that are well-represented in training datasets will have first-mover advantages in robot compatibility**. Products that are absent or underrepresented will face a compatibility tax: robots will not know how to handle them, leading to integration delays, custom engineering costs, or outright exclusion from automated workflows.

This creates existential pressure for brands across multiple categories—appliance manufacturers, industrial equipment OEMs, consumer electronics makers, tool manufacturers, component suppliers, and material producers—to ensure their products are included in the datasets that will train the next generation of intelligent robots.

GamiphyAI's thesis is to solve all three bottlenecks through one unified platform.

# 창업아이템의 목표시장 현황 분석

Across the world, SMEs account for roughly **90% of businesses** and more than **50% of employment**. In manufacturing, they represent the long tail of sites where repetitive work exists, but the workflow is too variable, too small-batch, or too engineering-intensive for traditional fixed automation to be economical. In Europe alone, manufacturing included **2.2 million enterprises**, **30 million workers**, and **€9.9 trillion** in turnover in 2023. In the United States, there were **632,885 small manufacturing businesses** in the latest SBA profile, including **235,088 small manufacturing employers** with **4.98 million employees**. In Japan, SMEs still account for **99.7% of all enterprises**; in ASEAN, MSMEs account for roughly **97.2% to 99.9% of establishments** depending on the country. Together, these figures show that the relevant global opportunity is not a narrow “robotics market” in the traditional sense. It is a very large installed base of under-automated, labor-constrained, highly fragmented manufacturing and fulfillment workflows.

Three global facts make this a large market.

First, manufacturing is fragmented across millions of operating units. The EU, China, and Japan numbers above make that visible [2][3][4].

Second, labor costs are high in the regions most capable of paying for automation. In the United States, average hourly earnings for manufacturing production and nonsupervisory workers were $29.77 in February 2026 [10]. In the EU, average hourly labour costs in industry were €33.9 in 2024 [11]. Those wage bases support materially higher willingness to pay for solutions that reduce direct labor, overtime, rework, and supervisor burden.

Third, robot adoption is still far from saturated. A global average density of 162 robots per 10,000 manufacturing employees means most manufacturing work remains lightly automated, especially outside the frontier economies [6].


### Global annual recurring TAM by region

Using the assumptions above, the base-case global recurring TAM for the initial HMLV workflow offering is about **USD 31.5B per year**, with a conservative sensitivity range of roughly **USD 14B to USD 81B per year** depending on workflow fit, site-size assumptions, and regional ARPA. These are modeled estimates grounded in official manufacturing, labour, and robotics data rather than a published market-size statistic [1][2][3][4][6][10][11][15][16].

| Region | Manufacturing sites used or derived | Base workflow-fit SME sites | Base recurring ARPA | Base TAM (USD B) |
|---|---:|---:|---:|---:|
| North America | 451,726 | 53,642 | 30,000 | 1.61 |
| European Union | 2,200,000 | 261,250 | 30,000 | 7.84 |
| China | 4,048,000 | 480,700 | 15,000 | 7.21 |
| High-income Asia | 692,190 | 82,198 | 25,000 | 2.05 |
| Rest of Asia | 9,709,800 | 1,153,039 | 6,000 | 6.92 |
| Latin America | 2,420,000 | 287,375 | 10,000 | 2.87 |
| Africa / Middle East | 3,609,600 | 428,640 | 7,000 | 3.00 |

These figures should be presented as annual recurring opportunity for the initial workflow wedge, before one-time deployment revenue.

### Global SAM

A realistic near-term SAM should not assume global direct sales. It should be constrained by channel access, safety compliance, deployment bandwidth, and product maturity. A conservative planning view is:

- Korea first;
- then high-income Asia and selected EU corridors through partners;
- then North America via channel-led entry;
- later, cost-sensitive Asia through lower-price, partner-led or RaaS-compatible models.

Under that lens, a plausible near-term SAM is materially smaller than TAM but still large: on the order of several billion dollars of annual recurring potential reachable through a focused set of regions and partners over 3–5 years [6][11][17].

### Korea as the beachhead

Korea remains the right first market. Statistics Korea reported 532,325 manufacturing establishments in 2023 and 504,728 in preliminary end-2024 data [12][13]. Among 163,273 factory-owning SME and mid-sized firms, the Ministry of SMEs and Startups reported 19.5% smart-factory adoption, with 75.5% of smart factories still at the basic stage [14]. Korea also installed 31,444 industrial robots in 2023, the fourth-largest annual market globally, and had the world's highest robot density [5][6].

### Korea TAM / SAM / SOM

The Korea case should remain explicit and grounded.

The cleanest beachhead denominator is the smart-factory adopter pool: 163,273 factory-owning SME and mid-sized firms multiplied by a 19.5% smart-factory adoption rate yields about **31,838 digitally enabled sites** [14]. Applying a 10%–20% workflow-fit filter for light assembly, packing, kitting, labeling, and similar HMLV workflows gives an initial candidate pool of about **3,200–6,400 sites**.

For the initial Korea workflow wedge:

- recurring software plus support per deployed line: **KRW 24M–30M per year**;
- resulting recurring revenue opportunity: **KRW 76.8B–192.0B per year**, before one-time PoC and deployment fees.

That yields a believable Korea-first market while keeping the global expansion story much larger.

# 제품/서비스 소개

### Business Model & Revenue Generation:

Gamiphy. AI operates a four-pillar revenue model distinct from traditional automation companies:

- Robot Consumers pay for automation deployments targeting repetitive but variable manufacturing workflows (packing, kitting, labeling, light assembly, small-parts handling) plus recurring support contracts
- Robot Creators earn revenue by providing validated task data and deployable skills to the platform
- Platform Services capture transaction fees, licensing revenue, and access fees from integrators, OEMs, and developers
- Product Brands/OEMs pay for dataset representation services ensuring their products remain compatible with AI-powered robots

This is not a broad marketplace initially but a services-led wedge strategy that generates proprietary data through paid automation deployments, then productizes repeatable elements into platform layers.



### Market Entry Status & Progress:
The company is pursuing a Korea-first strategy leveraging the country's status as the world's most robot-dense market (1,012 robots per 10,000 employees). The approach is services-to-platform transition rather than marketplace-first, learning from industrial platform failures that launched without proven demand or quality standards.

The GamiphyAI platform (gamiphy.ai) is currently under active development. Completed features include user account creation, dataset upload and visualization (with native support for the LeRobot format), and a functional marketplace where users can list, sell, and purchase datasets — including dataset search functionality. Outreach to the LeRobot creator community is currently in progress in South Korea.  Active engagement is also underway with small businesses to understand their automation needs and with hardware manufacturers to pilot dataset administration and distribution workflows.

### Robotics Technologies Possessed:

Proprietary robotics data platform for multi-modal, time-correlated, embodiment-specific data (RGB, depth, force, proprioception, actions, failures, safety events)
Skill package infrastructure converting validated workflows into repeatable deployment templates
Evaluation and benchmarking tooling for task-specific robot performance validation
Dataset versioning and licensing systems supporting both automation deployments and brand representation services
Workflow-centric deployment architecture designed for HMLV manufacturing environments where traditional fixed automation fails economically

The technical differentiation stems from addressing robotics' fundamental scaling challenge: unlike language AI trained on 300 billion tokens (GPT-3), robotics lacks equivalent data scale—even Open X-Embodiment combined only ~1 million trajectories from 60 datasets—creating a data moat opportunity.

# 창업아이템 개발 / 진행(준비)현황

### First 90 days
- 15–20 structured SME discovery interviews (automation)
- 2 signed paid PoC scoping agreements (automation)
- 3–5 seed creator or lab relationships
- 1 Korean safety / compliance checklist
- 1 standard KPI and ROI reporting template
- **5-8 brand partnership exploratory meetings** (appliance, tool, electronics manufacturers)
- **1 brand dataset services pilot proposal** (targeting category leader)

### By 12 months
- 6 paid PoCs completed (automation)
- 3 converted deployments (automation)
- 6 recurring support or subscription contracts (automation)
- 20+ curated datasets or task variants
- 1 reusable deployment playbook for a named workflow class
- **2 signed brand dataset services pilot contracts** (different categories)
- **First brand compatibility report published** (case study for sales)

### By 24 months
- 15 deployed automation sites
- 50+ workflow datasets
- 3 standardized skill packages
- **5-8 brand customers under contract**
- **Published benchmark showing dataset representation impact on robot success rates**
- **First competitive cascade** (brand adopts due to competitor presence on platform)

Development Methods:
The approach follows a services-to-platform sequence specifically designed to avoid two-sided platform cold-start problems. Rather than launching a marketplace without supply or demand, GamiphyAI:

- Wins tightly scoped automation projects with paying customers
- Generates proprietary multi-modal data (vision, force, proprioception, failures) during deployments
- Validates workflows against real KPIs in production environments
- Extracts repeatable patterns into standardized skill packages
- Builds platform infrastructure using proven, production-tested components

Current Development Stage:
Currently in pre-deployment preparation phase, focusing on establishing Korea beachhead positioning and initial customer pipeline development. The three-phase roadmap extends through 36+ months to full platform operation.

### Technology Protection Strategy:
Protection mechanisms include:

- Proprietary datasets from real customer deployments impossible to replicate synthetically
- Validated evaluation benchmarks establishing quality standards competitors must match
- Network effects across four stakeholder groups creating switching costs
- First-mover advantage in Korea's high-density robot market
- Data quality moat: Real automation deployments generate higher-fidelity data than lab-only or synthetic alternatives
- Integrated infrastructure: Combined automation + brand services creates bundling advantages against unbundling threats

The platform benefits from compound defensibility: each successful deployment generates proprietary data, each brand partnership creates dataset lock-in, and cross-selling between automation and brand customers strengthens both businesses simultaneously.

# 성장전략

### Market Entry & Expansion Strategy:
GamiphyAI employs a sequential geographic and product expansion strategy:

- Korea Beachhead (0-24 months): Leverage world-leading robot density (1,012 robots per 10,000 employees vs. 162 global average) to validate business model, generate case studies, and build proprietary datasets
- Regional Expansion (18-36 months): Target high-wage markets with manufacturing fragmentation—EU (2.2M enterprises), US ($29.77/hour wages), Japan (176,858 establishments)
- Global Platform (36+ months): Scale to 90% of global businesses (SME segment) across fragmented manufacturing sectors

### Target Customer Segmentation:
Four distinct stakeholder groups with different pain points and buying centers:

- Robot Consumers (operations teams): SME manufacturers needing HMLV automation
- Robot Creators (R&D teams): Labs and data providers seeking monetization
- Platform Participants (technical teams): Integrators and OEMs needing validated skills
- Product Brands (marketing/product teams): Manufacturers requiring dataset representation insurance

### Competitive Differentiation:
Unlike pure automation companies or pure marketplace plays, GamiphyAI offers integrated four-pillar value:

- vs. Traditional Automation: Flexible, data-driven approach for variable workflows
- vs. Pure Marketplaces: Proven supply (real deployment data) before platform launch
- vs. Brand Dataset Competitors: Automation proof points validate dataset quality
- Network effects advantage: Automation customers become brand service case studies; brand customers become automation references

### Commercialization Strategy:
Production & Launch: Services-first approach with 3-5 initial Korea deployments de-risks platform development while generating revenue immediately

#### Promotion & Marketing:

- Cross-promotion between automation and brand services
- Conference thought leadership covering both operations and product teams
- Customer case studies demonstrating dual value ("robots handling Samsung appliances successfully")

### Distribution & Sales:

- Direct sales for initial automation projects establishing relationships
- Brand partnerships through product/marketing team channels
- Platform access via API/licensing for integrators and developers

### Revenue Generation Model:

- Immediate: Automation deployment fees + recurring support contracts
- Medium-term: Brand dataset service subscriptions (2-3 anchor customers per category)
- Long-term: Platform transaction fees, skill licensing, evaluation tooling subscriptions

### Human Resources & Networks:

- Korea robotics ecosystem leverage (established research, regulatory knowledge)
- Dual sales teams addressing operations buyers (automation) and marketing buyers (brand services)
- Technical partnerships with robot OEMs and integrators for platform distribution

The strategy creates compound growth: each automation deployment strengthens dataset quality, each brand partnership increases platform value, and cross-selling reduces customer acquisition costs across both business lines.

# 대표자 및 팀 현황/ 보유역량

| No. | Position | Responsibilities | Capabilities (Career & Education) | Joining Status |
|-----|----------|-----------------|-----------------------------------|----------------|
| 1 | Robotics Lead | Robotics PoCs, data/skill pipeline, VLA controller integration, deployment playbooks for SME automation | Juan Medrano — Ph.D. (Candidate) Mechanical Engineering (ML for CV & robotic manipulation), M.Sc. Mechatronics; 7+ years robotics perception incl. Agility Robotics (Digit) and large-scale multi-modal dataset creation | Joined |
| 2 | Hardware Lead | Robot hardware selection/integration, sensing stack, EOAT/fixtures, embedded/system reliability for PoCs and deployments | Jose Bagur — Mechatronics Engineer (UVG), Coordinator UVG Aerospace Lab; lead of Quetzal-1/2 CubeSat programs; deep embedded/sensor/system deployment expertise | Joined |

### 대표자가 보유하고 있는 창업아이템 구현 및 판매 관련 역량 등

Robotics Technology Officer: Juan Medrano holds a Ph.D. (Candidate) in Mechanical Engineering from Sungkyunkwan University, focused on machine learning for computer vision and robotic manipulation, and an M.Sc. in Mechatronics Engineering. He has 7+ years of industry experience in robotics perception, including a role as Perception Engineer II at Agility Robotics, where he developed detection, segmentation, and 6DoF pose estimation systems for the Digit humanoid robot — deployed in live GXO warehouse operations. During this work he was directly involved in collecting large-scale, multi-modal datasets for humanoid robots, including visual (RGB, depth), inertial (IMU), kinematics (joint angles), and world-state data (objects, other robots, people), all used for training machine learning models for manipulation and locomotion. His prior research also includes building datasets for autonomous drone navigation for machine learning applications. This first-hand experience with the full data pipeline — collection, annotation, format standardization, and ML integration — directly informs the platform's design.

# KAIST 로봇 분야 멘토링 시 희망사항 기재

**Mentoring needs from KAIST Robotics (requested support):**
  - **Access to KAIST robotics communities:** Introductions to KAIST labs, students, clubs, and other robotics groups to recruit robot creators and accelerate dataset/skill contributions aligned to validated SME use cases.
  - **High-growth company structuring:** Guidance on structuring the company and operating model for fast growth across South Korea, the US, and Europe (go-to-market sequencing, partnerships, pricing, and hiring plan).
  - **Alumni network access:** Connections to KAIST alumni building robotics companies (hardware and software), for partnerships, technical validation, and early adopter programs.
  - **Equipment and prototyping support:** Access to equipment and facilities to accelerate PoCs (robot arms, GPUs, machining tools, and 3D printers).
  - **Platform scaling expertise:** Mentorship and expert access on building and scaling platform businesses (marketplace dynamics, creator incentives, pricing, and trust/verification mechanisms).
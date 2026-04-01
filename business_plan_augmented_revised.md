# GamiphyAI Business Plan — Investor-Ready Augmented Draft

**Version date:** 2026-03-31  
**Base document:** `business_plan_template.md`  
**Augmentation basis:** `investor_feedback.md`, plus external research from official statistics, academic papers, and primary industry sources.

---

## 1. Executive Positioning

**What business is GamiphyAI building first?**  
GamiphyAI should be presented to investors as a **Korea-first robotics automation company with a data-platform wedge**, not as a pure marketplace on Day 1.

That sequencing matters.

- **Phase 1 (0–24 months):** win narrowly scoped SME automation projects in South Korea; use those engagements to generate proprietary task data, deployment playbooks, evaluation benchmarks, and recurring software/support revenue.
- **Phase 2 (18–36 months):** productize the repeatable layers created in Phase 1 into a data/skill platform for robot creators, integrators, and OEMs.
- **Phase 3 (36+ months):** expand from a services-led wedge into a defensible platform with benchmarked task data, reusable skill packages, task templates, evaluation tooling, and marketplace liquidity.

**Investor framing:** this is a **services-to-platform transition story**. The near-term engine is paid PoCs, deployments, and recurring support; the long-term upside is a vertical robotics-data platform built on proprietary workflow data and deployment telemetry.

---

## 2. Revised Problem Statement

### 2.1 Why language AI scaled faster than robotics AI

Modern LLMs benefited from internet-scale text corpora and highly standardized training representations. OpenAI’s GPT-3 paper publicly documented a 175B-parameter autoregressive transformer trained on **300 billion tokens** from filtered Common Crawl, WebText2, Books1, Books2, and Wikipedia. In plain terms, the model learns by repeatedly predicting the next token in a sequence, compressing statistical structure from large text corpora into model weights. At inference time, it again predicts the next token given prior context.

Robotics does not enjoy the same data conditions.

- Text is already digitized, abundant, cheap to collect, and naturally represented as token sequences.
- Robot learning depends on **multi-modal, continuous, time-correlated, embodiment-specific** data: RGB, depth, forces, proprioception, action trajectories, contacts, scene state, failures, resets, and safety events.
- Real-world robot data is slower and more expensive to collect because each real robot collects data sequentially in the physical world, often with human supervision or teleoperation.

The contrast is visible in public dataset scale. Open X-Embodiment was a major robotics milestone, yet even that effort combined data from **60 datasets across 22 embodiments** and just **~1M+ trajectories / 500+ skills**, which is still tiny compared with web-scale text corpora.

### 2.2 What problem GamiphyAI solves

GamiphyAI addresses two linked bottlenecks:

1. **SME automation bottleneck:** Korean SMEs with repetitive but variable packing, kitting, labeling, and light assembly work often cannot justify traditional fixed automation because engineering cost, lead time, and SKU variability are too high.
2. **Robot-data bottleneck:** robotics teams lack a fast way to source, validate, version, license, and monetize task-specific physical-world data and derived skills.

**GamiphyAI thesis:** start from concrete automation jobs-to-be-done, use paid PoCs to define task KPIs, collect or commission missing data, convert validated workflows into repeatable skill/data packages, and gradually turn those assets into a broader platform.

---

## 3. Market Sizing: TAM / SAM / SOM

### 3.1 Korea beachhead TAM (bottom-up)

**Official manufacturing base and automation readiness**
- Statistics Korea’s preliminary 2023 Census on Establishments reported **532,325 manufacturing establishments** in South Korea, and the preliminary end-2024 result shows **504,728** manufacturing establishments.
- Among **163,273** factory-owning SME and mid-sized firms, the Ministry of SMEs and Startups reported **19.5%** smart-factory adoption, with **75.5%** of smart factories still at the **basic stage**.
- South Korea remains one of the most automated manufacturing economies in the world, with **1,012 industrial robots per 10,000 manufacturing employees** in 2023, according to IFR.
- South Korea installed **31,444 industrial robots** in 2023, the world’s fourth-largest annual market.

**SME relevance**
- Under Korea’s SME criteria, manufacturing businesses are generally classified by size using average sales thresholds and an upper asset cap; for many manufacturing categories, the threshold is **up to KRW 120–150 billion in average sales**, with total assets capped at **KRW 500 billion**.
- This means the overwhelming majority of Korean manufacturing establishments are, in practice, SMEs or small firms, even though not all are relevant to GamiphyAI’s initial workflow.

### 3.2 Beachhead SAM definition

GamiphyAI is **not** targeting all manufacturing establishments. The realistic initial SAM is:

- Korean SMEs
- light manufacturing / packaging / kitting / labeling / small-parts assembly
- repetitive but variable workflows
- lines where 1–3 workers currently perform tasks manually
- tasks feasible with a constrained dual-arm or small-arm workcell

Because no official Korean statistic directly publishes “high-mix / low-volume packing or kitting lines addressable by two small robot arms,” the following should be treated as a **modeled proxy**, not an official published figure:

- **Top-of-funnel site base:** use total manufacturing establishments only as the broad universe.
- **Readiness filter:** use the official smart-factory adopter pool as the more realistic digitally-enabled buyer pool.
- **Workflow filter:** within that pool, assume only a subset matches the initial GamiphyAI workflow archetype.

For planning purposes, the cleaner beachhead denominator is the smart-factory adopter pool: **163,273 × 19.5% ≈ 31,838 sites**. A further workflow filter of **10%–20%** for HMLV-ish light assembly, packing, kitting, labeling, or small-parts workflows implies an initial candidate pool of roughly **3,200–6,400 sites**.

This is more defensible than applying a flat percentage to all manufacturing establishments, because it separates general manufacturing presence from digital readiness and task fit.

### 3.3 Annual revenue opportunity per site

For a realistic SME line, the economic anchor is labor displacement and quality / uptime improvement.

Relevant public wage anchors:
- Korea’s **2026 minimum wage** is **KRW 10,320/hour**, or **KRW 2,156,880/month** on the official 209-hour basis.
- Korea’s 2024 average nominal monthly wage across surveyed workers was **KRW 4,079,000**, while a 2021 government manufacturing-policy release cited manufacturing monthly pay around **KRW 3.96M**.

For the target workflow, GamiphyAI should model a modest value case:
- 2 workers affected
- blended monthly labor burden of roughly **KRW 2.5M–3.5M per worker** once employer burden, turnover, and coordination cost are included
- annual economic impact per line roughly **KRW 60M–84M**
- smart-factory CAPEX benchmarks in Korea indicate projects often sit far above pure software price points, with an average reported total build cost around **KRW 151M** and average company-borne cost around **KRW 96M**, which means GamiphyAI pricing must clearly describe what is included and excluded.

GamiphyAI should target capturing only part of that value.

**Base-case annual GamiphyAI revenue per deployed line**
- recurring software + support: **KRW 24M–30M / year**
- initial PoC + deployment fees: additional one-time revenue

### 3.4 Korea TAM / SAM / SOM summary

Using the site-based smart-factory filter:

- **Digitally enabled buyer pool:** about **31,838 sites**
- **Initial workflow candidate pool:** about **3,200–6,400 sites** after a 10%–20% workflow-fit filter
- **Base recurring revenue opportunity:** 3,200–6,400 × KRW 24M ≈ **KRW 76.8B–153.6B / year**
- **Upper recurring case:** 3,200–6,400 × KRW 30M ≈ **KRW 96.0B–192.0B / year**

This is a more credible **Korea-first recurring revenue opportunity** for the beachhead workflow before adding one-time deployment revenue.

### 3.5 SOM (share of market) — realistic capture path

A credible seed-stage capture plan is small.

- **Year 1:** 3 deployed sites on paid recurring contracts
- **Year 3:** 18 deployed sites on recurring contracts
- **Year 5:** 70 deployed sites on recurring contracts

That implies:
- **Year 5 site share:** 70 / 3,200 = **2.2%** at the tighter low-end beachhead, or 70 / 6,400 = **1.1%** at the high-end beachhead

This is low enough to be believable.

---

## 4. Global TAM for the Robotics Data / Skill Platform

A clean official statistic for “global robotics training-data marketplace TAM” does not exist today. Any claim of a precise standalone number would be false precision.

The defensible approach is **triangulation**.

### 4.1 Observable global robotics base

- IFR recorded **4,281,585 industrial robots operating in factories worldwide** in 2023.
- IFR reported **541,302 industrial robot installations** in 2023.
- IFR later reported global industrial installations of roughly **542,000** in 2024.
- IFR’s service-robot reporting shows professional service robot sales passed **205,000 units** in 2023 and reached roughly **200,000 units** in 2024.

### 4.2 Inferred platform TAM

If an early third-party data/skill platform eventually serves only a fraction of this installed and newly deployed robotics base, the market is already meaningful.

**Illustrative inference, not an official published market size:**
- If only **2%** of the ~4.28M industrial installed base plus annual professional-service demand maps to third-party data / skill spend,
- and annual spend is only **USD 10,000 per customer-equivalent**, 
- the implied annual market is already on the order of **USD ~0.85B+**.

However, this should be framed only as a directional ceiling check. The better operating model is site-based, not robot-count based, because software, data, and support are usually bought by a site, line, workcell, or integrator rather than by each robot individually.

**Conclusion:** the global platform TAM is likely large enough to matter, but the company should **not** raise money on a speculative global marketplace story alone. It should raise on the Korea services wedge that creates the proprietary assets needed to earn that platform upside, and it should model adoption on buyer units rather than robot units.

---

## 5. Revised Business Model and Pricing

The original pricing in `business_plan_template.md` is too low for investor-grade scrutiny. It makes the company look like it is underpricing labor and hiding negative gross margin.

### 5.1 Revised pricing architecture

#### A. Paid discovery / PoC
- **Target price:** **KRW 8M–15M** per PoC
- **Target duration:** 2–4 weeks
- **Deliverable:** process study, task decomposition, safety and feasibility analysis, KPI baseline, workcell concept, economics memo, go / no-go recommendation
- **Policy:** partial credit to deployment only for qualified conversions

#### B. Deployment / integration
- **Target service fee:** **KRW 12M–25M** per line/workcell for **software/data enablement only** in simple deployments
- **Recommended tiered structure:**
  - **KRW 12M–18M** for light configuration and activation
  - **KRW 18M–30M+** for heavier commissioning, fixture iteration, and stabilization
- Covers: system configuration, cell integration, fixtures, test runs, acceptance criteria, operator training, and early stabilization
- Excludes major hardware, tooling, guarding, safety retrofits, and broad SI scope unless separately quoted

#### C. Hardware
- **Recommendation:** hardware should mostly be **customer-direct purchase** or financed through channel partners.  
GamiphyAI should avoid carrying inventory unless required by a turnkey contract.
- If GamiphyAI coordinates procurement, keep economics simple:
  - referral / integration coordination fee, or
  - transparent low single-digit to low-teens margin

#### D. Recurring software / data / skill subscription
- **Target:** **KRW 1.0M–2.0M / month** per site in early deployments
- **Recommended entry tier:** start closer to **KRW 0.8M–1.2M / month** for basic-stage factories, with add-ons for connected lines, SKU complexity, evaluation modules, and retraining cadence
- Includes: skill versioning, data curation, evaluation dashboards, retraining triggers, SKU-change updates, remote issue triage

#### E. Support / maintenance
- **Target:** **KRW 0.6M–1.2M / month** per site for remote SLA
- **Important change:** bill **on-site visits separately** after an included threshold. Do not bury unlimited field support inside a small flat fee.
- Support should be described as uptime diagnostics, remote troubleshooting, software/skill updates, and SLA response coverage rather than as generic robot maintenance.


### 5.3 Pricing realism summary

The proposed architecture is workable only if GamiphyAI is explicit about scope. The PoC range is realistic for a tightly scoped paid discovery engagement. The deployment fee is realistic only when it represents a narrow software/data layer or a very light commissioning package. The recurring model is viable if it is tied to measurable ROI and tiered for basic-stage factories, which still make up most of the Korean smart-factory installed base.

### 5.2 Why this pricing is better

It answers the investor’s key question: **is the PoC and deployment business subsidizing losses?**

With the revised model, the answer should be **no**.

The company should state clearly that:
- PoCs are intended to be **positive gross margin**
- deployments are intended to be **positive or near-neutral gross margin**
- recurring software/support is the **highest-margin revenue layer**
- hardware is **not** the core business and is not treated as a major profit center

---

## 6. Unit Economics (Illustrative Seed-Stage Model)

The following is an **internal operating model**, not a historical financial statement.

### 6.1 Revenue per converted customer

**Base case, 24-month customer**
- PoC: KRW 10M
- Deployment: KRW 18M
- Recurring subscription + support: KRW 2.3M/month × 24 months = KRW 55.2M
- Hardware coordination gross profit: KRW 1M

**24-month customer revenue:** **KRW 84.2M**

### 6.2 Gross margin assumptions

- PoC gross margin: **35–45%**
- Deployment gross margin: **30–40%**
- Subscription gross margin: **70–80%**
- Support gross margin: **40–60%** if on-site work is capped and billed properly
- Hardware margin: low, not strategically important

### 6.3 CAC / LTV / payback

**Illustrative CAC assumption**
- founder-led outbound + travel + exhibitions + onsite qualification cost per signed paying PoC customer: **KRW 4M–6M**

**Illustrative 24-month LTV**
- revenue: KRW 84.2M
- rough blended gross profit: **KRW 38M–45M**

**Indicative LTV:CAC**
- at KRW 42M GP LTV and KRW 5M CAC: **~8.4x**

**Payback**
- if PoC is already positive-margin, CAC recovery can occur by PoC or shortly after deployment, rather than requiring many months of subscription to offset a subsidized install.

### 6.4 Investor message

GamiphyAI should not claim SaaS-level margins today. The honest framing is:

- **Today:** hybrid robotics-services business with growing software content
- **Goal:** push more value into recurring software/data/skill revenue over time
- **Valuation path:** increase software and repeatability share, reduce custom engineering per deployment, and standardize task playbooks

---

## 7. 5-Year Revenue Projection (Illustrative)

### 7.1 Core modeling assumptions

- conversion from paid PoC to deployment improves as workflows standardize
- recurring contracts attach to each successful deployment
- marketplace revenue is modest until Years 4–5
- no dependence on hardware gross profit

### 7.2 Base-case projection (KRW millions)

| Year | Paid PoCs | Deployments | Recurring sites at year-end | Revenue from PoCs | Revenue from deployments | Revenue from recurring | Other/platform | Total revenue |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Y1 | 6 | 3 | 3 | 60 | 54 | 41 | 6 | **161** |
| Y2 | 15 | 8 | 8 | 150 | 144 | 166 | 16 | **476** |
| Y3 | 30 | 18 | 20 | 300 | 324 | 460 | 36 | **1,120** |
| Y4 | 45 | 32 | 40 | 450 | 576 | 1,000 | 120 | **2,146** |
| Y5 | 70 | 55 | 70 | 700 | 990 | 1,932 | 350 | **3,972** |

### 7.3 Interpretation

- **Years 1–2:** proof of repeatability
- **Year 3:** first year that looks venture-relevant if retention and gross margins hold
- **Years 4–5:** platform revenue starts to matter, but only after the deployment engine has created reusable assets and benchmarked use cases

This resolves the “beachhead vs platform” tension: the services wedge funds and validates the platform.

---

## 8. Technology Risk and Mitigation

### 8.1 Investor concern is valid

The original plan targeted ~99% end-to-end completion without adequately addressing the gap between current robotics foundation models and production reliability.

That target should be reframed.

Public evidence shows progress, but also the gap:
- Google DeepMind reported RT-Trajectory achieving **63%** success on **41 unseen tasks**, versus **29%** for RT-2 in that benchmark setting.
- DeepMind also explicitly described using **classical robotics safety layers**, human supervision, and physical kill switches in AutoRT because prompting alone does not guarantee safety.
- Recent surveys on robot foundation models still highlight generalization, safety, environment shift, and execution reliability as open challenges.

### 8.2 Revised technical strategy

GamiphyAI should state that it is **not** betting the business on end-to-end VLA control for every step.

The near-term production stack should be **hybrid**:

- deterministic logic / state machines for task sequencing
- fixed fixtures and workflow constraints to reduce state space
- classical vision / heuristics where appropriate
- learned perception or policy modules only where variability justifies them
- operator approval and exception routing for low-confidence states
- hard safety interlocks, fences, E-stops, and force thresholds

### 8.3 Reliability targets by stage

- **PoC feasibility threshold:** demonstrate measurable value, not full autonomy
- **early production target:** **95–98%** completion on constrained tasks, with human exception handling
- **later target:** pursue **99%+** only after repeated data collection, task redesign, and operational hardening

That is far more credible than promising 99% from the start.

---

## 9. Cold-Start / Marketplace Risk and Mitigation

Two-sided platforms face the classic chicken-and-egg problem. Academic platform literature explicitly recognizes this as a core entry problem.

### 9.1 Revised go-to-market rule

GamiphyAI should not begin as an open marketplace waiting for supply and demand to appear simultaneously.

Instead:
- start with **demand-first**: paid SME use cases
- use those projects to define exact data briefs
- commission initial datasets directly from owned rigs, paid seed creators, or partner labs
- benchmark the resulting data against deployment KPIs
- open broader marketplace participation only after there is repeat demand and clear quality standards

### 9.2 Practical operating model

**Phase 1:** managed supply  
GamiphyAI itself or a small paid creator pool produces the first datasets.

**Phase 2:** invited marketplace  
Only verified creators can supply into specific briefs with benchmark requirements.

**Phase 3:** broader platform  
More open listing, but only once evaluation, licensing, and provenance are standardized.

This is how the company should answer the investor’s cold-start objection.

---

## 10. Defensibility / Moat

The original plan described go-to-market advantages, but not a real moat.

### 10.1 What is **not** a moat

- being Korea-first
- using open-source robotics tools
- being early to a category
- offering low pricing

These help with entry, but they are not durable.

### 10.2 What can become a moat

#### A. Proprietary task-outcome datasets
Data linked to real customer KPIs is more valuable than generic demonstration dumps. Over time, GamiphyAI can build a corpus of:
- task-specific demonstrations
- failure cases
- recovery trajectories
- benchmark results
- deployment telemetry
- SKU-change adaptation history

#### B. Evaluation and benchmark layer
If GamiphyAI becomes the system that says whether a dataset or skill is “production-ready” for a workflow class, it owns the trust layer, not just the listing page.

#### C. Deployment playbooks
Repeatable workcells, fixture patterns, operator handoff logic, and safety procedures create a learning-curve advantage.

#### D. Contractual data rights and workflow-specific derivatives
The company should define, contractually, what it owns:
- marketplace metadata and QA artifacts
- anonymized benchmark results
- derived evaluation tools
- generalized skill templates and deployment playbooks

### 10.3 Defensibility statement for investors

GamiphyAI’s moat is not the open-source stack. It is the **combination of proprietary task data, benchmark credibility, deployment know-how, and rights-managed workflow assets accumulated through paid customer work**.

---

## 11. Regulatory, Safety, and Liability

This section is missing from the original plan and must be added.

### 11.1 Korea compliance reality

Public KOSHA materials show that Korea applies safety certification / safety inspection regimes to industrial machinery and robot-related safety devices, and KOSHA has publicly noted mandatory safety inspection requirements for industrial robots and conveyors used in workplaces.

### 11.2 Operating policy

GamiphyAI should commit to:
- using hardware that meets Korean certification requirements where applicable
- designing workcells around KOSHA / MOEL safety expectations
- maintaining fenced or safeguarded cells where risk analysis requires it
- line-of-sight kill switch and emergency stop procedures during PoCs
- documented site risk assessments before deployment
- clear acceptance criteria with the customer and any installation partner

### 11.3 Liability stack

Before commercial deployments, the company should secure:
- product liability insurance
- general commercial liability
- professional indemnity / errors-and-omissions coverage
- cyber coverage for cloud platform operations

**Note:** exact insurance terms and legal entity structure are founder decisions and must be added from internal counsel, not invented here.

---

## 12. Team, Hiring, and Execution Plan

### 12.1 Team strengths

Juan Medrano’s robotics/data background and Korea market access remain strong differentiators. Jose Bagur’s systems engineering background is also strong.

### 12.2 Investor concerns that cannot be hand-waved

These points require explicit founder clarification:

- **Jose commitment level:** full-time or part-time?  
- **Jose operating location:** Guatemala, Korea, or split?  
- **who sells today?**  
- **who owns platform engineering?**  
- **who handles field deployment and maintenance once installations begin?**

These are not research gaps; they are management disclosure gaps.

### 12.3 Recommended first 12-month hiring plan

1. **Commercial lead / founder’s office BD support** (Month 0–3)  
Own pipeline, proposals, CRM, partner management, subsidy navigation.

2. **Field robotics engineer** (Month 3–6)  
Own integration, commissioning, onsite support, QA, and repeatable workcell documentation.

3. **Senior full-stack / platform engineer** (Month 3–6)  
Own marketplace product, dataset workflows, permissions, billing, and evaluation tooling.

4. **Part-time finance / operations manager** (Month 6–9)  
Own grant administration, payroll, accounting, legal coordination, and insurance/compliance tracking.

### 12.4 Advisors

The investor feedback is correct: the plan needs named advisors.

**Required before fundraising:**
- 1 advisor from Korean SME manufacturing / factory operations
- 1 advisor from robotics systems integration or Korean industrial safety
- 1 advisor with marketplace / B2B SaaS scaling experience

**[Founder input required: insert names, roles, and current commitment level.]**

---

## 13. Milestones — Revised to Be Credible

The original Month 1 and Month 3 milestones are too aggressive for a 2-person team.

### 13.1 Revised first 90 days

#### First 30 days
- 15–20 structured SME discovery interviews
- 2 signed paid PoC scoping agreements
- 3–5 seed creator / lab relationships
- 1 safety/compliance checklist for Korean workcell deployments
- 1 standard PoC reporting template with KPI baseline and ROI calculator

#### Day 31–90
- 1 completed paid PoC with written report
- 1 second PoC in execution
- 5–10 benchmarked datasets tied to named workflow briefs
- 1 local integration or hardware partner agreement
- 1 case-study-quality deployment video or internal demo

### 13.2 12-month milestones

- 6 paid PoCs completed
- 3 converted deployments
- 6 recurring subscription/support contracts active
- 20+ curated internal datasets / task variants
- 1 reusable deployment playbook for a specific workflow class

These milestones are conservative enough to be credible and strong enough to matter.

---

## 14. Funding Ask and Use of Funds (Proposed)

The original plan omitted the funding ask entirely.

### 14.1 Proposed ask

**Proposed seed/pre-seed target:** **KRW 1.2B–1.5B** for an **18-month runway**.

### 14.2 Use of funds

| Category | Share | Purpose |
|---|---:|---|
| Product + robotics engineering | 45% | platform, datasets, controls, evaluation tooling |
| Sales / BD / partnerships | 25% | founder support, travel, pipeline, exhibitions, channel development |
| Hardware + PoC operations | 15% | demo rigs, sensors, fixtures, test hardware, field setup |
| Legal / safety / insurance / compliance | 10% | entity setup, contracts, insurance, certification, counsel |
| G&A / contingency | 5% | accounting, admin, buffer |

### 14.3 What the raise should achieve

With KRW 1.2B–1.5B, the company should aim to reach:
- 6 paid PoCs
- 3 deployments
- 6 recurring contracts
- a repeatable workflow playbook
- a documented rights / licensing framework for customer and creator data
- proof that services-generated data can be turned into reusable platform assets

---

## 15. Exit and Return Thesis

This section is also missing from the original plan.

### 15.1 Strategic buyer logic

GamiphyAI is most likely an acquisition candidate for:
- industrial automation companies
- robot OEMs / cobot vendors
- warehouse / AMR / manipulation robotics firms
- AI infrastructure or embodied-AI platform companies

### 15.2 Relevant historical comps

Examples of strategic appetite in robotics include:
- **Rockwell Automation** acquiring **Clearpath Robotics / OTTO Motors**
- **Zebra Technologies** acquiring **Fetch Robotics**
- **Teradyne** acquiring **Universal Robots**
- **Hyundai Motor Group** acquiring **Boston Dynamics**

These are not direct valuation comps for GamiphyAI, but they show that strategic buyers pay for robotics platforms that own workflow integration, software, and customer access.

### 15.3 Return thesis

The investor return case is strongest if GamiphyAI becomes one of the following:
- the default data / skill infrastructure layer for a narrow robotics vertical, or
- a high-retention automation software company with proprietary task data and repeatable deployments.

---

## 16. Open Items That Require Founder Input Before Investor Meetings

The following points cannot be responsibly fabricated and must be filled in by the founders:

1. current number of SME discovery interviews completed
2. current number of qualified leads / LOIs / MOUs / paid pilots
3. current platform metrics: registered users, datasets uploaded, completed transactions
4. Jose Bagur’s exact commitment level and operating location
5. legal entity / corporate structure
6. founder equity split and any prior financing
7. named advisors and board observers
8. actual monthly burn and cash runway
9. insurance broker / legal counsel status
10. exact customer data-rights policy for PoCs and production deployments

---

## 17. Insertions / Replacements Recommended for `business_plan_template.md`

### Replace the current “Data Story” placeholder with:

> Large language models scaled because they could be trained on enormous standardized text corpora. OpenAI’s GPT-3 paper documented a 175B-parameter autoregressive transformer trained on 300B tokens from filtered Common Crawl, WebText2, Books corpora, and Wikipedia. In simplified terms, the model learns by repeatedly predicting the next token in a text sequence and compressing statistical structure from huge corpora into model weights. Robotics is harder because the data is multi-modal, continuous, embodiment-specific, and expensive to collect in the real world. Public robotics datasets remain much smaller: Open X-Embodiment combined data from 60 datasets across 22 robot embodiments and about one million trajectories, which is a major robotics milestone but still far below web-scale language data. GamiphyAI exists to help close that data gap for real-world automation tasks.

### Replace the current 99% reliability sentence with:

> Our near-term target is not unconstrained end-to-end autonomy. We target 95–98% completion reliability on tightly scoped workflows by combining constrained workcell design, deterministic task sequencing, classical safety layers, and selectively learned perception / control modules. We pursue 99%+ only after repeated deployment-specific data collection and operational hardening.

### Add a new section titled “Business Sequencing”:

> GamiphyAI is building a Korea-first automation business with a data-platform wedge. We start by solving a narrow set of SME automation problems through paid PoCs and repeatable deployments. Those deployments generate proprietary datasets, benchmark results, and playbooks that later become the foundation of a broader robotics data/skill platform. Services validate the need; the platform compounds the learning.

---


## 18. Key assumption updates from external validation

### 18.1 Official Korean HMLV statistics
There is no official Korean national statistic that directly counts "high-mix / low-volume assembly lines" as a statistical category. The plan should therefore avoid implying that such an official number exists. The defensible approach is to use official manufacturing establishment counts, official smart-factory adoption and maturity data, and official or quasi-official smart-factory investment benchmarks as proxies.

### 18.2 Market-size modeling
The earlier global 2% calculation remains useful as a directional thought experiment, but it should not be treated as the core operating market model. The company should use buyer-unit denominators such as sites, lines, workcells, or integrators for operational planning and reserve robot-count framing for top-down context only.

### 18.3 Pricing
The pricing stack is directionally realistic if GamiphyAI sells a paid diagnostic PoC, narrowly scoped deployment services, and a clearly defined recurring software/support layer. It becomes much less credible if investors interpret the deployment fee as a full turnkey automation budget.

## 19. References

1. Brown, T. et al. “Language Models are Few-Shot Learners.” arXiv (2020). https://arxiv.org/abs/2005.14165  
2. OpenAI. “Language models are few-shot learners.” https://openai.com/index/language-models-are-few-shot-learners/  
3. Open X-Embodiment Collaboration. “Open X-Embodiment: Robotic Learning Datasets and RT-X Models.” arXiv (2023). https://arxiv.org/abs/2310.08864  
4. Google DeepMind. “Scaling up learning across many different robot types.” https://deepmind.google/discover/blog/scaling-up-learning-across-many-different-robot-types/  
5. Google DeepMind. “Shaping the future of advanced robotics.” https://deepmind.google/blog/shaping-the-future-of-advanced-robotics/  
6. Google DeepMind. “RT-2: New model translates vision and language into action.” https://deepmind.google/discover/blog/rt-2-new-model-translates-vision-and-language-into-action/  
7. Hugging Face. “LeRobot documentation.” https://huggingface.co/docs/lerobot  
8. Hugging Face. “Using dataset tools.” https://huggingface.co/docs/lerobot/en/using_dataset_tools  
9. Hugging Face. “LeRobotDataset:v3.0: Bringing large-scale datasets to lerobot.” https://huggingface.co/blog/lerobot-datasets-v3  
10. Hugging Face. “LeRobot: An open-source robotics library.” https://github.com/huggingface/lerobot  
11. Statistics Korea (KOSTAT). “Preliminary Results of the 2023 Census on Establishments.” https://sri.kostat.go.kr/boardDownload.es?bid=11726&list_no=433344&seq=2  
12. KOSIS. “Indicator Comparison by Region / Census on Establishments.” https://kosis.kr/visual/economyBoard/economyRegion.do?lang=en  
13. International Federation of Robotics. “Record 4 Million Robots in Factories Worldwide.” https://ifr.org/downloads/press2018/2024-SEP-24_IFR_press_release_World_Robotics_2024_-_global_market.pdf  
14. International Federation of Robotics. “Global Robot Density in Factories Doubled in Seven Years.” https://ifr.org/ifr-press-releases/news/global-robot-density-in-factories-doubled-in-seven-years  
15. International Federation of Robotics. IFR home / 2025 industrial statistics release. https://ifr.org/home/P49  
16. International Federation of Robotics. “Sales of Service Robots up 30% Worldwide.” https://ifr.org/news/sales-of-service-robots-up-30-worldwide/1  
17. International Federation of Robotics. “Service Robots See Global Growth Boom.” https://ifr.org/news/service-robots-see-global-growth-boom/  
18. Korea SMEs and Startups Agency (KOSME). “Size classification by business type.” https://hp.kosmes.or.kr/sbc/SH/EHP/SHEHP024M0.do  
19. Minimum Wage Council, Republic of Korea. “Minimum wage by year.” https://minimumwage.go.kr/english/introduce/minWage.do  
20. Minimum Wage Council, Republic of Korea. Main page / 2026 minimum wage. https://www.minimumwage.go.kr/english/main.do  
21. Ministry of Employment and Labor (MOEL), Korea. “Statistics.” https://www.moel.go.kr/english/resources/statistics.do  
22. Ministry of SMEs and Startups / BizInfo. Smart-factory support notices indicating base-stage support up to KRW 50M and advanced-stage support up to KRW 200M. https://www.bizinfo.go.kr/web/lay1/bbs/S1T157C158/AU/112/view.do?article_seq=72887  
23. Ministry of SMEs and Startups. 2024 / 2025 smart-factory related notice. https://www.mss.go.kr/common/board/Download.do?bcIdx=1048830&cbIdx=310&streFileNm=197ea9aa-dae7-4280-8a5f-fc61abe3de09.pdf  
24. Korea Occupational Safety and Health Agency (KOSHA). “Voluntary Safety Certification.” https://www.kosha.or.kr/english/business/voluntarySafetyCertification.do  
25. KOSHA. “Mandatory Safety Inspection Imposed on Industrial Robots & Conveyers.” https://www.kosha.or.kr/english/news/whatsNew.do?article.offset=180&articleLimit=10&articleNo=55393&mode=view  
26. Occupational Safety and Health Certification Institute (OSHCI). “Safety Certification (KCs-Mark) subject.” https://miis.kosha.or.kr/oshci/eng/busi/KCsMerchandise.do  
27. OSHCI. “Application standards / Industrial Robot.” https://miis.kosha.or.kr/oshci/eng/busi/SafetyCriteria.do  
28. ROBOTIS. “OpenManipulator-X.” https://robotis.us/openmanipulator-x/  
29. RobotShop. “ROBOTIS OpenMANIPULATOR-X RM-X52-TNM Arm.” https://www.robotshop.com/products/robotis-openmanipulator-x-rm-x52-tnm-arm  
30. PATO: Policy Assisted TeleOperation for Scalable Robot Data Collection. arXiv. https://arxiv.org/abs/2212.04708  
31. Octo Model Team. “Octo: An Open-Source Generalist Robot Policy.” arXiv (2024). https://arxiv.org/abs/2405.12213  
32. “Robot learning in the era of foundation models: a survey.” Information Sciences / ScienceDirect (2025). https://www.sciencedirect.com/science/article/pii/S0925231225006356  
33. “Real-world robot applications of foundation models: a review.” Advanced Robotics (2024). https://www.tandfonline.com/doi/abs/10.1080/01691864.2024.2408593  
34. Hybrid Imitation Learning Framework for Robotic Manipulation Tasks. Sensors (2021). https://www.mdpi.com/1424-8220/21/10/3409  
35. Towards Safe Robot Foundation Models Using Inductive Biases. arXiv (2025). https://arxiv.org/abs/2505.10219  
36. The dynamics of entry for digital platforms in two-sided markets: a multi-case study. Electronic Markets. https://link.springer.com/article/10.1007/s12525-020-00409-4  
37. Rockwell Automation. “Rockwell Automation completes acquisition of Clearpath Robotics and OTTO Motors.” https://www.rockwellautomation.com/en-mde/company/news/press-releases/Rockwell-Automation-completes-acquisition-of-autonomous-robotics-leader-Clearpath-Robotics-and-its-industrial-offering-OTTO-Motors.html  
38. Zebra Technologies. “Zebra Technologies to Acquire Fetch Robotics.” https://www.zebra.com/us/en/about-zebra/newsroom/press-releases/2021/zebra-technologies-to-acquire-fetch-robotics.html  
39. Universal Robots. “Teradyne acquires Universal Robots.” https://www.universal-robots.com/news-and-media/news-center/teradyne-inc-acquires-universal-robots/  
40. Hyundai Motor Group. “Hyundai Motor Group Completes Acquisition of Boston Dynamics from SoftBank.” https://www.hyundai.com/worldwide/en/newsroom/detail/0000000516

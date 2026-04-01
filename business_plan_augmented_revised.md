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

## 2.2 What problem GamiphyAI solves

GamiphyAI addresses two linked bottlenecks, but the investor story should begin globally and only then narrow to Korea.

### 2.2.1 Global SME automation bottleneck

Across the world, SMEs account for roughly **90% of businesses** and more than **50% of employment**. In manufacturing, they represent the long tail of sites where repetitive work exists, but the workflow is too variable, too small-batch, or too engineering-intensive for traditional fixed automation to be economical. In Europe alone, manufacturing included **2.2 million enterprises**, **30 million workers**, and **€9.9 trillion** in turnover in 2023. In the United States, there were **632,885 small manufacturing businesses** in the latest SBA profile, including **235,088 small manufacturing employers** with **4.98 million employees**. In Japan, SMEs still account for **99.7% of all enterprises**; in ASEAN, MSMEs account for roughly **97.2% to 99.9% of establishments** depending on the country. Together, these figures show that the relevant global opportunity is not a narrow “robotics market” in the traditional sense. It is a very large installed base of under-automated, labor-constrained, highly fragmented manufacturing and fulfillment workflows.

The core bottleneck is the same across regions:
- automation works well in stable, high-volume environments,
- but many SME workflows are **high-mix, low-volume (HMLV)** or semi-structured,
- meaning SKU changes, packaging changes, fixture changes, exception handling, and frequent reconfiguration destroy the economics of conventional automation,
- while fully custom systems remain too expensive and too slow to deploy.

The global wedge for GamiphyAI is therefore not “all robotics.” It is the subset of repetitive but variable tasks in light manufacturing, packaging, kitting, inspection, labeling, and small-parts handling where labor is expensive enough, turnover is painful enough, and workflow variance is high enough that SMEs need a cheaper intelligent automation layer.

### 2.2.2 Korea-first narrowing

That same bottleneck is especially visible in South Korea, where manufacturing density is high, labor costs continue to rise, robot adoption at large industrial firms is already advanced, and smaller factories still struggle to automate variable workflows. South Korea is therefore not the whole story; it is the **best first proving ground** for a broader global thesis.

GamiphyAI should therefore present the problem statement as:

> The company starts in Korea because Korea is a dense, automation-aware beachhead. But the underlying problem is global: millions of SMEs in HMLV manufacturing and packaging still sit between two bad options — manual labor or over-engineered automation. GamiphyAI’s thesis is that a robotics data and skill layer can make low-cost intelligent workcells economically viable first in Korea, then in other advanced manufacturing markets.

---

## 3. Market Sizing: TAM / SAM / SOM

The section should move from a global opportunity frame to a Korea-first operating plan.

### 3.1 Global top-down TAM

A clean top-down investor view starts with the size of global manufacturing and the size of the SME base inside it.

- Global SMEs account for roughly **90% of businesses** and more than **50% of employment worldwide**.
- Global manufacturing value added is a **multi-trillion-dollar market** and remains one of the largest sectors in the world economy.
- In 2024, the industrial robotics market remained structurally large, with **542,076 industrial robot installations** and an operational stock of **4,663,773 industrial robots** worldwide.
- Asia accounted for **74%** of new industrial robot deployments in 2024, Europe **16%**, and the Americas **9%**.

However, these robot counts understate GamiphyAI’s true opportunity, because the installed robot base is concentrated in larger and more standardized production environments. The better denominator is not “robots already deployed,” but rather **manufacturing sites with repetitive manual work that are still too variable for standard automation**.

### 3.2 Global site-based TAM for the HMLV wedge

Because there is no single official global dataset for “HMLV SME sites suited to low-cost intelligent robot cells,” the most defensible approach is a conservative triangulation from major manufacturing regions.

**Anchor-market manufacturing base already visible in official data**
- **European Union:** **2.2 million** manufacturing enterprises in 2023.
- **United States:** **632,885** small manufacturing businesses, including **235,088** small manufacturing employers.
- **South Korea:** **504,728** manufacturing establishments in the preliminary 2024 Census on Establishments.

Even before counting Japan, Taiwan, most of ASEAN, India, or Latin America, these three markets alone already imply an observable base of roughly **3.34 million manufacturing sites/businesses**. Not all of those are relevant. Many are too small, too artisanal, or outside the workflow types GamiphyAI wants first. But the denominator is clearly large enough for a venture-scale opportunity.

A disciplined global wedge model should then apply three filters:

1. **Workflow-fit filter:** only sites with repetitive but variable manual tasks in packaging, kitting, light assembly, inspection, labeling, or machine-tending adjacencies.
2. **Economic-fit filter:** labor cost, turnover, quality leakage, or throughput pain must be large enough to justify automation.
3. **Digital-readiness filter:** buyer must be able to adopt a software-mediated automation product rather than a one-off engineering science project.

A conservative first-wave assumption is that only **5% to 10%** of the observable anchor-market base meets the first useful version of that wedge. That yields roughly **167,000 to 334,000 candidate sites**.

### 3.3 Global revenue opportunity per site

GamiphyAI should keep the economic logic simple: price as a fraction of annual labor and quality value created, not as an arbitrary software multiple.

Across the U.S. and Europe, the public labor data already support meaningful automation budgets:
- In the U.S., production occupations averaged **$50,090** in annual wages in May 2024.
- In the EU, average hourly labour costs in industry were **€33.9** in 2024, and **€39.8** in the euro area.

For an HMLV cell that affects only **1.5 to 2 workers**, annual labor value is often already material. On a global blended basis, a realistic early recurring capture assumption is roughly **$18,000 to $35,000 per site per year**, with one-time PoC and deployment revenue on top.

Using that blended recurring assumption:
- **167,000 sites × $18,000** ≈ **$3.0B** annual recurring opportunity
- **334,000 sites × $35,000** ≈ **$11.7B** annual recurring opportunity

That is the right way to present the global TAM: large enough to justify a platform path, but still grounded in a conservative site-based wedge rather than a speculative “every robot in the world” narrative.

### 3.4 Global SAM versus Korea beachhead SAM

The company should separate:

- **Global TAM:** the broader long-term HMLV automation and robotics-skill opportunity across advanced manufacturing regions.
- **Initial global SAM:** the first-wave candidate sites in the U.S., Europe, Korea, and adjacent high-income Asian markets.
- **Operational beachhead SAM:** Korea only, because the first deployments, reference sites, and repeatable playbooks are built there.

This sequencing is important for investors. It shows that the company is not pretending to sell everywhere on Day 1, but it is also not limiting the long-term story to one country.

### 3.5 Korea beachhead TAM and SAM

The Korea analysis should then follow, largely unchanged.

**Official manufacturing base and automation readiness**
- Statistics Korea’s preliminary 2023 Census on Establishments reported **532,325 manufacturing establishments** in South Korea, and the preliminary end-2024 result shows **504,728** manufacturing establishments.
- Among **163,273** factory-owning SME and mid-sized firms, the Ministry of SMEs and Startups reported **19.5%** smart-factory adoption, with **75.5%** of smart factories still at the **basic stage**.
- South Korea remains one of the most automated manufacturing economies in the world, with **1,012 industrial robots per 10,000 manufacturing employees** in 2023.
- South Korea installed **31,444 industrial robots** in 2023.

For planning purposes, the most defensible Korea beachhead denominator remains the smart-factory adopter pool:

**163,273 × 19.5% ≈ 31,838 sites**.

Applying a narrower workflow-fit filter of **10% to 20%** for HMLV-ish light assembly, packing, kitting, labeling, and small-parts workflows yields an initial Korea candidate pool of roughly **3,200 to 6,400 sites**.

### 3.6 Korea revenue opportunity per site

The Korean economics can remain close to the current plan.

Using Korea’s wage and smart-factory cost structure, a realistic early recurring revenue layer remains:
- **KRW 24M–30M per year** for software + support,
- plus one-time PoC and deployment revenue.

That implies:
- **3,200 × KRW 24M = KRW 76.8B** annual recurring opportunity
- **6,400 × KRW 30M = KRW 192.0B** annual recurring opportunity

This is still the right Korea-first operating case.

### 3.7 SOM: what the company should actually promise

The operational SOM for the first 3–5 years should remain Korea-led.

A believable path remains:
- **Year 1:** 3 recurring production sites
- **Year 3:** 18 recurring production sites
- **Year 5:** 70 recurring production sites

That corresponds to only about **1.1% to 2.2%** of the Korea beachhead SAM by Year 5, which is conservative enough to be believable.

The investor takeaway should be:

> Korea is the first SOM. Global HMLV manufacturing is the long-term TAM.

---

## 4. Global TAM for the Robotics Data / Skill Platform

The current section is directionally correct, but still too dependent on industrial robot stock alone. That misses a major part of the real opportunity.

### 4.1 Why the current framing is incomplete

An investor reading the current draft could conclude that the platform opportunity scales only with installed industrial robots. That is too narrow.

Industrial robot data does matter:
- the global installed base reached **4,663,773** units in 2024,
- annual industrial robot installations were **542,076** in 2024,
- and Asia represented **74%** of new deployments.

But those numbers mostly describe the existing automation core. GamiphyAI’s more important long-term upside is in the **broader set of manufacturing sites that do not yet have enough reusable skills, data, and evaluation tooling to automate HMLV work economically**.

### 4.2 HMLV manufacturing is the missing denominator

The better denominator for the platform story is not “robots installed,” but **sites and workflows that could become robotized if the data, skill, evaluation, and deployment stack becomes cheaper and more reusable**.

The official enterprise data already show how large that under-automated base is:
- the EU had **2.2 million** manufacturing enterprises in 2023,
- the U.S. had **632,885** small manufacturing businesses,
- Korea had **504,728** manufacturing establishments,
- Japan’s economy remains overwhelmingly SME-based, with SMEs accounting for **99.7%** of enterprises,
- and ASEAN economies remain MSME-dense, with MSMEs accounting for roughly **97.2% to 99.9%** of establishments.

Most of those firms are not large automotive plants. They are exactly the types of sites where production is fragmented, volumes are lower, SKUs change, and process variability makes generic automation underperform.

### 4.3 Revised platform TAM logic

The platform TAM should therefore be shown through two lenses.

#### Lens A: robot-centric TAM
This is the narrower, near-term platform TAM tied to the existing installed robotics base.

Illustrative logic:
- if a small share of industrial robot operators, OEMs, and integrators buys third-party data, skill packages, evaluation tools, or continuous tuning services,
- then even a modest annual spend per active customer can support a meaningful software and data market.

#### Lens B: workflow-centric HMLV TAM
This is the larger strategic TAM.

A reasonable seed-to-Series A framing is to model only the observable anchor-market HMLV base and assume a modest annual platform spend for active users.

If only **1%** of the roughly **3.34 million** observable anchor-market manufacturing sites/businesses eventually buy some form of data, skill, evaluation, or retraining layer, that implies roughly **33,000 active buying sites**. At only **$5,000 to $15,000** in annual platform spend per site, that already implies roughly **$167M to $501M** in annual platform revenue potential.

If penetration reaches **5%** over time, the same logic yields roughly:
- **167,000 active buying sites**, and
- **$836M to $2.5B** in annual platform spend potential.

These numbers are still conservative because they do **not** include:
- China,
- most of India,
- most of Latin America,
- a full accounting of ASEAN,
- or additional revenue from creators, integrators, OEM tooling, certification, benchmark services, and marketplace transaction take rates.

### 4.4 How to present the platform story to investors

The message should be:

1. **Today’s revenue engine** is Korea-first services + software.
2. **Tomorrow’s platform** is built on repeatable workflows, proprietary task data, evaluation, and versioned skills.
3. The platform TAM is larger than the currently installed robot base because low-cost intelligent robotization can expand into the HMLV long tail.

That is a much stronger transformation story than a marketplace that depends only on the current industrial-robot installed base.

---

## 5.1 Revised pricing architecture

The Korea pricing section should stay, but it should no longer look Korea-specific. It should be presented as one regional instance of a broader global pricing logic.

### 5.1.1 Global pricing principle

GamiphyAI should price around the same rule in every market:

> Capture a minority share of annual labor, uptime, quality, and throughput value created, while keeping upfront scope narrow enough to make first adoption easy.

The structure is globally consistent:
- paid discovery / PoC,
- deployment / activation fee,
- recurring software / data / skill subscription,
- recurring support / SLA,
- hardware kept mostly customer-direct or partner-financed.

What changes by region is not the structure, but the **price band**, driven by wage levels, integration complexity, subsidy availability, and buyer expectations around service.

### 5.1.2 United States pricing band

Public U.S. labor data support a meaningfully higher pricing envelope than Korea. Production occupations averaged **$50,090** in annual wages in May 2024, and small manufacturing still includes **235,088** small employers with **4.98 million employees**.

For a cell that affects 1.5–2 production workers, the gross wage value alone can justify meaningful annual software spend before quality and uptime gains are counted.

**Recommended U.S. pricing band**
- **Paid discovery / PoC:** **$8,000–$20,000**
- **Deployment / activation:** **$20,000–$50,000** for software/data enablement and light commissioning only
- **Recurring software / data / skill layer:** **$1,500–$4,000 per month**
- **Remote support / SLA:** **$750–$2,000 per month**
- **On-site visits:** billed separately

This pricing is still modest relative to U.S. labor costs and leaves room for partner-led hardware procurement and integrator margin.

### 5.1.3 Europe pricing band

Europe can support a similar or slightly higher recurring model in many countries because labor costs in industry are already high. In 2024, average hourly labour costs in industry were **€33.9** in the EU and **€39.8** in the euro area.

That means even narrow automation cells can justify recurring software and support spend if the workflow is genuinely repetitive and labor-intensive.

**Recommended Europe pricing band**
- **Paid discovery / PoC:** **€7,000–€18,000**
- **Deployment / activation:** **€18,000–€45,000**
- **Recurring software / data / skill layer:** **€1,200–€3,500 per month**
- **Remote support / SLA:** **€800–€2,000 per month**
- **On-site support:** metered or separately quoted

A Europe strategy should also assume more channel dependence than Korea, especially through integrators and machine builders.

### 5.1.4 Asia pricing band

Asia should not be treated as one uniform market.

The right approach is two sub-bands:

#### A. High-income Asia: Korea, Japan, Taiwan, Singapore
These markets have stronger labor-cost support for automation, but SME price sensitivity remains real.

Japan’s 2024 SME policy framing explicitly highlights labor shortage and the need for labor-saving investment. Korea already shows strong smart-factory policy support and a dense manufacturing base.

**Recommended high-income Asia pricing band**
- **Paid discovery / PoC:** **$5,000–$15,000 equivalent**
- **Deployment / activation:** **$12,000–$35,000 equivalent**
- **Recurring software / data / skill layer:** **$800–$2,500 per month equivalent**
- **Remote support / SLA:** **$500–$1,500 per month equivalent**

#### B. Cost-sensitive Asia: ASEAN and India entry markets
These markets are often strategically attractive because of factory density and MSME share, but labor-cost economics are more variable. Adoption often requires either:
- narrower single-task automation,
- stronger partner-led sales,
- lower entry pricing,
- or financing / RaaS-like structures.

**Recommended cost-sensitive Asia pricing band**
- **Paid discovery / PoC:** **$3,000–$10,000 equivalent**
- **Deployment / activation:** **$8,000–$25,000 equivalent**
- **Recurring software / data / skill layer:** **$400–$1,500 per month equivalent**
- **Support:** lighter remote tier, with paid field service

The important investor message is that Asia expansion should not assume Korea pricing everywhere. It should assume a **segmented pricing architecture** tied to local labor economics and partner structures.

### 5.1.5 Korea pricing band

The Korea section can remain close to the current plan, because it is already one of the stronger parts of the pricing logic.

**Korea pricing architecture**
- **Paid discovery / PoC:** **KRW 8M–15M**
- **Deployment / integration:** **KRW 12M–25M** in simple software/data enablement cases, rising to **KRW 18M–30M+** where commissioning and stabilization are heavier
- **Recurring software / data / skill layer:** **KRW 1.0M–2.0M per month**
- **Support / maintenance:** **KRW 0.6M–1.2M per month**
- **On-site field work:** billed separately after a defined threshold

### 5.1.6 Pricing conclusion investors should hear

GamiphyAI should not be presented as a low-cost Korean integrator with a local pricing model. It should be presented as a company with:
- a globally portable commercial structure,
- regionally adjusted pricing bands,
- Korea as the first wedge,
- and an eventual shift of revenue mix from services toward recurring software, data, and skills.

That framing makes the transition from services to platform much more credible.

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

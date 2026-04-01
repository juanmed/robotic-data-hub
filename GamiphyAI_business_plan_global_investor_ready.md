# GamiphyAI Business Plan — Global Investor-Ready Version

**Version date:** 2026-04-01  
**Positioning:** Korea-first automation company with a robotics data-platform wedge

## 1. Executive Summary

GamiphyAI should be presented as a Korea-first robotics automation company that uses paid automation deployments to build a defensible robotics data and skill platform. The near-term business is not a broad marketplace. It is a services-led wedge focused on repetitive but variable manufacturing workflows—packing, kitting, labeling, light assembly, and small-parts handling—where traditional fixed automation is often uneconomic for SMEs. The long-term upside is a workflow-centric platform for robotic data, skill packages, evaluation, and deployment tooling.

The global opportunity is materially larger than the Korea beachhead. SMEs represent roughly 90% of businesses worldwide and more than half of employment, which implies a very large long tail of operating environments where high engineering effort prevents automation from scaling [1]. Manufacturing remains highly fragmented. The EU alone had about 2.2 million manufacturing enterprises employing roughly 30.2 million people in 2023 [2]. China’s Fifth National Economic Census reported about 4.048 million manufacturing enterprises among industrial corporate enterprises at the end of 2023 [3]. Japan reported 176,858 manufacturing establishments with 4+ persons engaged and 7.47 million persons engaged in 2021 [4]. This fragmentation is the structural reason a productized automation and skills layer can compound globally.

Robot adoption is real, but uneven. The global stock of industrial robots operating in factories reached 4.28 million units in 2023, while average global robot density was 162 robots per 10,000 manufacturing employees [5][6]. Korea, by contrast, reached 1,012 robots per 10,000 manufacturing employees, making it one of the strongest proving grounds in the world for automation products and deployment playbooks [6]. Korea should therefore be framed as the first capture zone inside a much larger global HMLV automation opportunity, not as the ceiling of the business.

## 2. Problem and Why Now

### 2.1 Why robotics AI has scaled more slowly than language AI

Large language models scaled on internet-scale text corpora with standardized representations. GPT-3, for example, was trained on 300 billion tokens from filtered Common Crawl, WebText2, Books, and Wikipedia [7]. Robotics does not enjoy equivalent data conditions. Robot learning depends on multi-modal, time-correlated, embodiment-specific data such as RGB, depth, force, proprioception, actions, failures, resets, and safety events, all of which are slower and more expensive to collect in the physical world. Even Open X-Embodiment—a major step forward—combined data from 60 datasets across 22 embodiments and about one million trajectories, still far below web-scale language data [8].

### 2.2 The practical market problem

The core business problem is not “robots are unavailable.” It is that automation in high-mix, low-volume manufacturing usually breaks on engineering cost, integration burden, changeover time, and maintenance complexity. That is especially true for smaller manufacturers and variable workflows.

This creates two linked bottlenecks:

1. **SME automation bottleneck.** Smaller manufacturers often cannot justify traditional fixed automation for repetitive but variable tasks.
2. **Robot-data bottleneck.** Robotics teams and integrators lack a fast way to source, validate, version, license, and improve task-specific data and deployable skills.

GamiphyAI’s thesis is to solve both through one sequence: start from real customer workflows, use paid PoCs to define KPIs and collect data, convert validated workflows into repeatable skill and deployment packages, and then turn those assets into a broader platform.

## 3. Business Sequencing

GamiphyAI is not building an open marketplace first. It is building a services-to-platform transition.

**Phase 1 (0–24 months):** win tightly scoped SME automation projects in Korea, generate proprietary task data, deployment playbooks, evaluation benchmarks, and recurring support revenue.

**Phase 2 (18–36 months):** standardize the repeatable parts of those deployments into product layers: skill packages, data workflows, benchmark tooling, and versioned deployment templates.

**Phase 3 (36+ months):** expand into a broader robotics data and skill platform used by integrators, robot creators, OEMs, and channel partners.

That sequence is important because two-sided platforms in industrial markets typically fail when they start without real demand, benchmarked quality, or repeatable supply standards [9].

## 4. Global HMLV Automation Bottleneck, Then Korea

High-mix, low-volume manufacturing is defined less by industry labels than by operating reality: short runs, frequent SKU changes, variable packaging formats, mixed materials, irregular exceptions, and changeover-driven downtime. In those environments, classic hard-tooled automation often delivers poor payback because engineering and maintenance effort does not amortize well.

Three global facts make this a large market.

First, manufacturing is fragmented across millions of operating units. The EU, China, and Japan numbers above make that visible [2][3][4].

Second, labor costs are high in the regions most capable of paying for automation. In the United States, average hourly earnings for manufacturing production and nonsupervisory workers were $29.77 in February 2026 [10]. In the EU, average hourly labour costs in industry were €33.9 in 2024 [11]. Those wage bases support materially higher willingness to pay for solutions that reduce direct labor, overtime, rework, and supervisor burden.

Third, robot adoption is still far from saturated. A global average density of 162 robots per 10,000 manufacturing employees means most manufacturing work remains lightly automated, especially outside the frontier economies [6].

### Korea as the beachhead

Korea remains the right first market. Statistics Korea reported 532,325 manufacturing establishments in 2023 and 504,728 in preliminary end-2024 data [12][13]. Among 163,273 factory-owning SME and mid-sized firms, the Ministry of SMEs and Startups reported 19.5% smart-factory adoption, with 75.5% of smart factories still at the basic stage [14]. Korea also installed 31,444 industrial robots in 2023, the fourth-largest annual market globally, and had the world’s highest robot density [5][6].

That combination matters. Korea is advanced enough to adopt automation, but still under-digitized enough at the SME layer to reward a lower-engineering, workflow-centric offer.

## 5. Market Sizing: TAM, SAM, SOM

### 5.1 Method

The addressable market should be sized by buyer unit—site, line, or workcell—not by raw robot count. In practice, software, data, support, and commissioning are bought at the operating-unit level.

For the initial workflow wedge, the global model below uses:

- manufacturing sites or enterprises by region, using official counts where available and conservative employment-to-site proxies where not [2][3][4][15][16];
- an SME share assumption of 95% for the manufacturing long tail, consistent with the global dominance of SMEs in business populations [1];
- a workflow-fit filter of 10%–20%, with a 12.5% base case, reflecting the subset of sites where packing, kitting, labeling, light assembly, or small-parts work is repetitive enough to automate yet variable enough to benefit from productized skills and data;
- regional annual recurring revenue per deployed site calibrated to wage levels and automation buying power.

### 5.2 Global annual recurring TAM by region

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

### 5.3 Global SAM

A realistic near-term SAM should not assume global direct sales. It should be constrained by channel access, safety compliance, deployment bandwidth, and product maturity. A conservative planning view is:

- Korea first;
- then high-income Asia and selected EU corridors through partners;
- then North America via channel-led entry;
- later, cost-sensitive Asia through lower-price, partner-led or RaaS-compatible models.

Under that lens, a plausible near-term SAM is materially smaller than TAM but still large: on the order of several billion dollars of annual recurring potential reachable through a focused set of regions and partners over 3–5 years [6][11][17].

### 5.4 Korea TAM / SAM / SOM

The Korea case should remain explicit and grounded.

The cleanest beachhead denominator is the smart-factory adopter pool: 163,273 factory-owning SME and mid-sized firms multiplied by a 19.5% smart-factory adoption rate yields about **31,838 digitally enabled sites** [14]. Applying a 10%–20% workflow-fit filter for light assembly, packing, kitting, labeling, and similar HMLV workflows gives an initial candidate pool of about **3,200–6,400 sites**.

For the initial Korea workflow wedge:

- recurring software plus support per deployed line: **KRW 24M–30M per year**;
- resulting recurring revenue opportunity: **KRW 76.8B–192.0B per year**, before one-time PoC and deployment fees.

That yields a believable Korea-first market while keeping the global expansion story much larger.

### 5.5 SOM

A credible seed-stage capture plan should remain small.

For Korea:
- Year 1: 3 deployed sites
- Year 3: 18 deployed sites
- Year 5: 70 deployed sites

For the broader business:
- Year 3: initial partner-led pilots outside Korea
- Year 5: roughly 200 recurring sites total, with about 70 in Korea and the rest abroad

That remains a very small share of global SAM and therefore reads as credible rather than promotional.

## 6. Global TAM for the Robotics Data and Skill Platform

A precise official statistic for “global robotics training-data marketplace TAM” does not exist. Any exact standalone number would be false precision. The right framing is triangulation.

The observable installed base is already meaningful. Industrial robot stock reached 4.28 million operating units in 2023 [5]. Annual industrial installations reached 541,302 units in 2023 [17]. Cobots accounted for 10.5% of industrial installations in 2023, which matters because cobots are often the entry point for less-automated environments [18].

The opportunity is broader than industrial robots alone. IFR reported that sales of professional service robots reached almost 200,000 units in 2024, and the RaaS fleet grew 31% to more than 24,500 units [19][20]. That matters because many of the same monetizable layers—versioned skills, task updates, evaluation, operational telemetry, remote support, and benchmarking—apply beyond factory arms.

The key addition to your prior global section is the HMLV denominator. UNIDO reports manufacturing accounts for about 14.1% of global employment in the latest world and regional aggregates [15]. Combining ILO regional employment totals with UNIDO’s manufacturing share implies a global manufacturing workforce on the order of nearly 490 million people [15][16]. Distributed across millions of operating sites, that is exactly the environment in which productized robotic skills, workflow-specific data, and changeover tooling become platform assets rather than bespoke services.

The investor message should therefore be:

1. there is already a large installed robot and service-robot base that can consume skills, data, and updates [5][17][18][19][20];
2. there is a larger adoption-unlock opportunity in HMLV manufacturing, where those platform layers reduce engineering time enough to make automation viable [1][2][3][4][15][16].

## 7. Product and Offering

GamiphyAI should describe the product in three layers.

### 7.1 Delivery layer: automation solution for real SME workflows

Initial use cases include packing, kitting, labeling, small-parts handling, and light assembly in variable environments. The value proposition is lower engineering effort, faster deployment, lower changeover cost, and measurable operational KPIs.

### 7.2 Data and skill layer

Each deployment should produce reusable assets:
- task-specific demonstrations;
- failure and recovery data;
- benchmark results;
- skill packages;
- evaluation templates;
- changeover playbooks;
- deployment telemetry.

### 7.3 Platform layer

Over time, these assets become a platform product for:
- robot OEMs and cobot vendors;
- integrators;
- robotics startups;
- creators or labs producing task data;
- enterprise operators managing fleets of workflows.

The platform should not be positioned as an open marketplace on day one. It should begin as a managed system with benchmarked quality and rights-controlled assets.

## 8. Go-to-Market

### 8.1 Korea first

Korea is the best first market because it combines:
- a dense manufacturing base [12][13];
- one of the world’s most automated industrial ecosystems [6];
- a large SME and basic-stage smart-factory segment [14];
- high reference value for customers and partners elsewhere in Asia and Europe.

### 8.2 Demand-first operating model

The go-to-market sequence should be:

1. paid discovery and PoCs;
2. deployment and recurring support;
3. standardization into repeatable workflow packages;
4. invited supply for data and skills;
5. broader platform participation.

This addresses the classic cold-start problem in two-sided platforms and keeps quality control inside the company until standards are real [9].

### 8.3 Expansion sequence

A coherent regional expansion path is:

- **Korea:** prove repeatability and unit economics.
- **High-income Asia:** Japan, Singapore, and adjacent markets where robotics maturity and channel density are high [4][6][21].
- **EU:** selected manufacturing corridors where labour costs support ROI and SMEs are numerous [2][11].
- **US:** channel-led entry once the workflow package is mature enough to survive longer sales cycles and higher compliance expectations [10].

## 9. Business Model and Pricing

Pricing should be ROI-anchored and region-calibrated.

### 9.1 Standard architecture

**Paid discovery / PoC**
- 2–4 week engagement
- process study, safety review, KPI baseline, economics memo, go/no-go recommendation

**Deployment / activation**
- software, data, and workflow enablement for a specific line or workcell
- excludes major hardware, guarding, and broad SI scope unless separately quoted

**Recurring subscription**
- skill versioning, data curation, evaluation dashboards, SKU-change updates, issue triage

**Support**
- remote SLA plus separately billed on-site work after an included threshold

**Hardware**
- preferably customer-direct purchase or partner-financed, not a major profit center

### 9.2 Regional pricing bands

The regional pricing logic should follow labour economics.

| Region | Paid PoC | Deployment fee | Recurring fee |
|---|---:|---:|---:|
| US | USD 8k–25k | USD 20k–60k | USD 2.5k–6k / month |
| EU | EUR 8k–25k | EUR 20k–60k | EUR 2.5k–6.5k / month |
| High-income Asia | USD 6k–20k | USD 15k–45k | USD 2k–5k / month |
| Cost-sensitive Asia | USD 2k–10k | USD 8k–25k | USD 0.5k–2k / month |
| Korea | KRW 8M–15M | KRW 12M–25M | KRW 1.0M–2.0M / month plus support |

The rationale is straightforward. In the US, a single manufacturing worker at average wage rates costs roughly USD 61.9k per year before benefits, overtime, or indirect burden [10]. In the EU, average industry labour cost implies about EUR 70.5k per worker per year [11]. A constrained workcell affecting even one to two workers can therefore justify materially higher software and support pricing than the Korea entry tier.

### 9.3 Korea pricing detail

The Korea model should remain:

- PoC: **KRW 8M–15M**
- deployment / activation: **KRW 12M–25M**, or more for heavier commissioning
- recurring software / data / skill subscription: **KRW 1.0M–2.0M per month**
- support: **KRW 0.6M–1.2M per month**, with on-site work billed separately

That pricing is consistent with Korea’s wage base and the fact that most smart factories remain at the basic stage [14][22][23].

## 10. Unit Economics

The following should be presented as an illustrative operating model, not a historical statement.

### 10.1 Base 24-month customer value in Korea

- PoC: KRW 10M
- Deployment: KRW 18M
- Subscription plus support: KRW 2.3M/month × 24 months = KRW 55.2M
- Hardware coordination gross profit: KRW 1M

**24-month revenue per converted customer: KRW 84.2M**

### 10.2 Margin structure

A credible target model is:

- PoC gross margin: 35%–45%
- Deployment gross margin: 30%–40%
- Subscription gross margin: 70%–80%
- Support gross margin: 40%–60% if field visits are controlled and billed correctly

The investor point is simple: the company should not subsidize PoCs and deployments with future software hopes. PoCs should already be positive gross margin or close to it.

### 10.3 CAC / LTV framing

An illustrative Korea-first CAC assumption of KRW 4M–6M per signed paying PoC customer yields an attractive LTV:CAC profile if the above revenue and gross margin assumptions hold. This should be described as a management model until real sales data exists.

## 11. Five-Year Revenue Outlook

The core logic of the model should remain Korea-first, then global.

### 11.1 Korea base case (KRW millions)

| Year | Paid PoCs | Deployments | Recurring sites at year-end | Revenue from PoCs | Revenue from deployments | Revenue from recurring | Other / platform | Total revenue |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Y1 | 6 | 3 | 3 | 60 | 54 | 41 | 6 | 161 |
| Y2 | 15 | 8 | 8 | 150 | 144 | 166 | 16 | 476 |
| Y3 | 30 | 18 | 20 | 300 | 324 | 460 | 36 | 1,120 |
| Y4 | 45 | 32 | 40 | 450 | 576 | 1,000 | 120 | 2,146 |
| Y5 | 70 | 55 | 70 | 700 | 990 | 1,932 | 350 | 3,972 |

### 11.2 Global overlay

A realistic global overlay should not matter materially until Years 3–5, because the exportable asset is the workflow package, not raw code. A conservative overlay is:

- Year 3: first 5–10 deployments outside Korea
- Year 4: 25–40 outside Korea
- Year 5: 100–150 outside Korea

That yields around 200 recurring sites total by Year 5, still a very small share of global SAM.

## 12. Technology Strategy and Reliability

The plan should explicitly reject the idea that the business depends on unconstrained end-to-end autonomy in the near term.

Google DeepMind reported RT-Trajectory achieving 63% success on 41 unseen tasks versus 29% for RT-2 in that benchmark setting, which shows progress but also the remaining reliability gap [24]. DeepMind’s AutoRT work also used classical safety layers, human supervision, and physical kill switches, which reinforces the need for hybrid production systems rather than AI-only claims [25]. Recent surveys on robot foundation models continue to highlight generalization, safety, environment shift, and execution reliability as open problems [26][27].

The near-term production stack should therefore combine:
- deterministic logic and state machines;
- constrained workcell and fixture design;
- classical vision where sufficient;
- learned modules only where variability justifies them;
- human exception handling;
- hard safety interlocks.

The reliability message should be:
- PoC stage: prove value, not full autonomy
- early production: target 95%–98% completion on constrained workflows
- later production: pursue 99%+ only after data accumulation and operational hardening

## 13. Defensibility

The moat is not open-source tooling, low price, or being early. Those help with entry, not durability.

The defensible assets are:

1. **Proprietary task-outcome datasets** tied to real customer KPIs.
2. **Evaluation and benchmark credibility** that determines whether a skill is production-ready.
3. **Deployment playbooks** covering fixtures, exception handling, operator handoff, and changeover logic.
4. **Rights-managed derivatives** such as anonymized benchmark results, generalized skill templates, and workflow-specific evaluation tools.

That is the right investor answer to “what compounds over time?”

## 14. Regulatory, Safety, and Liability

Korea requires a serious compliance posture. KOSHA and affiliated certification bodies publish safety certification and inspection requirements for industrial machinery and robot-related safety devices, including mandatory safety inspection requirements for industrial robots and conveyors in certain workplace contexts [28][29][30][31].

GamiphyAI should commit to:
- certified hardware where applicable;
- documented site risk assessments;
- safeguarded cells where risk analysis requires them;
- line-of-sight kill-switch and E-stop procedures during PoCs;
- explicit acceptance criteria with customers and installation partners.

Before scaled deployment, the company should secure product liability, general commercial liability, professional indemnity / E&O, and cyber coverage.

## 15. Team, Hiring, and Execution

The current founding profile is strong on robotics and systems, but investors will still ask about role clarity, operating ownership, and field execution capacity.

The first 12-month hiring plan should be:

1. BD / commercial support
2. Field robotics engineer
3. Senior full-stack or platform engineer
4. Part-time finance and operations support

The plan also needs named advisors before formal fundraising:
- one Korean manufacturing or factory-operations advisor;
- one robotics SI or industrial safety advisor;
- one marketplace or B2B SaaS scaling advisor.

## 16. Milestones

### First 90 days
- 15–20 structured SME discovery interviews
- 2 signed paid PoC scoping agreements
- 3–5 seed creator or lab relationships
- 1 Korean safety / compliance checklist
- 1 standard KPI and ROI reporting template

### By 12 months
- 6 paid PoCs completed
- 3 converted deployments
- 6 recurring support or subscription contracts
- 20+ curated datasets or task variants
- 1 reusable deployment playbook for a named workflow class

These milestones are conservative enough to be believable and strong enough to matter.

## 17. Funding Ask and Use of Funds

A credible pre-seed / seed ask remains **KRW 1.2B–1.5B** for roughly **18 months of runway**.

Suggested use of funds:

| Category | Share |
|---|---:|
| Product and robotics engineering | 45% |
| Sales, BD, and partnerships | 25% |
| Hardware and PoC operations | 15% |
| Legal, safety, insurance, compliance | 10% |
| G&A and contingency | 5% |

The objective of the raise is to prove:
- repeatable paid demand;
- positive or near-neutral deployment economics;
- recurring contracts that improve gross margin;
- workflow assets that clearly translate into platform product.

## 18. Exit and Return Thesis

The most likely strategic buyers are:
- industrial automation companies;
- cobot and robot OEMs;
- warehouse and AMR platforms;
- embodied-AI infrastructure companies;
- industrial software firms that want workflow-level data and deployment reach.

Recent strategic acquisitions in robotics show clear buyer appetite for software-rich robotics platforms and workflow access, including Teradyne / Universal Robots, Zebra / Fetch Robotics, Rockwell / Clearpath-OTTO, and Hyundai / Boston Dynamics [32][33][34][35].

The strongest return thesis is not “generic robotics marketplace.” It is either:
- the default data / skill infrastructure for a narrow robotics workflow class; or
- a high-retention automation software company with proprietary task data and repeatable deployment playbooks.

## 19. Founder Inputs Still Required Before Fundraising

The following should be completed before investor meetings:
- current number of discovery interviews completed;
- current number of qualified leads, LOIs, or paid pilots;
- current platform metrics, if any;
- founder time commitment and role ownership;
- legal entity structure;
- cap table and prior financing;
- named advisors;
- current monthly burn and runway;
- insurance and legal-counsel status;
- customer data-rights policy.

## References

[1] World Bank. “Small and Medium Enterprises (SMEs).”  
[2] Eurostat. “Businesses in the manufacturing sector.”  
[3] National Bureau of Statistics of China. “Fifth National Economic Census Communiqué.”  
[4] Statistics Bureau of Japan. *Statistical Handbook of Japan 2023*, manufacturing table.  
[5] International Federation of Robotics. “Record of 4 Million Robots Working in Factories Worldwide.”  
[6] International Federation of Robotics. “Global Robot Density in Factories Doubled in Seven Years.”  
[7] Brown, T. et al. “Language Models are Few-Shot Learners.” arXiv, 2020.  
[8] Open X-Embodiment Collaboration. “Open X-Embodiment: Robotic Learning Datasets and RT-X Models.” arXiv, 2023.  
[9] Constantinides, P. et al. “The dynamics of entry for digital platforms in two-sided markets.” *Electronic Markets*.  
[10] U.S. Bureau of Labor Statistics. Employment Situation Table B-8, manufacturing hourly earnings, February 2026.  
[11] Eurostat. “Hourly labour costs ranged from €11.2 to €55.2 in 2024.”  
[12] Statistics Korea. “Preliminary Results of the 2023 Census on Establishments.”  
[13] KOSIS. “Indicator Comparison by Region / Census on Establishments.”  
[14] Ministry of SMEs and Startups, Republic of Korea. Smart-factory adoption statistics and support notices.  
[15] UNIDO. *International Yearbook of Industrial Statistics 2024*.  
[16] ILO. *World Employment and Social Outlook: Trends 2024*.  
[17] International Federation of Robotics. *World Robotics 2024* press release.  
[18] International Federation of Robotics. “How Robots Work Alongside Humans.”  
[19] International Federation of Robotics. “Service Robots See Global Growth Boom.”  
[20] International Federation of Robotics. *Executive Summary: World Robotics 2025 Service Robots*.  
[21] Singapore Economic Development Board. “Census of Manufacturing Activities / Singapore Manufacturing Performance 2023.”  
[22] Minimum Wage Commission, Republic of Korea. Annual minimum wage statistics.  
[23] Ministry of Employment and Labor, Republic of Korea. Wage statistics and manufacturing wage references.  
[24] Google DeepMind. “Shaping the future of advanced robotics.”  
[25] Google DeepMind. “AutoRT” / advanced robotics safety and deployment materials.  
[26] “Robot learning in the era of foundation models: a survey.” *Information Sciences*, 2025.  
[27] “Real-world robot applications of foundation models: a review.” *Advanced Robotics*, 2024.  
[28] Korea Occupational Safety and Health Agency. “Voluntary Safety Certification.”  
[29] KOSHA. “Mandatory Safety Inspection Imposed on Industrial Robots & Conveyers.”  
[30] Occupational Safety and Health Certification Institute. “Safety Certification (KCs-Mark) subject.”  
[31] OSHCI. “Application standards / Industrial Robot.”  
[32] Rockwell Automation. “Rockwell Automation completes acquisition of Clearpath Robotics and OTTO Motors.”  
[33] Zebra Technologies. “Zebra Technologies to Acquire Fetch Robotics.”  
[34] Universal Robots. “Teradyne acquires Universal Robots.”  
[35] Hyundai Motor Group. “Hyundai Motor Group completes acquisition of Boston Dynamics.”
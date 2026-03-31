# Investor Due Diligence Feedback — GamiphyAI Business Plan

> **Reviewer perspective:** Senior partner at a top-tier venture fund (Series Seed / Pre-A), robotics & AI vertical.
> **Date of review:** 2026-03-31
> **Document reviewed:** `business_plan_template.md`

---

## Method 1: TAM / SAM / SOM & Market Sizing Analysis

### What's missing

1. **No quantified TAM / SAM / SOM.** The plan describes the beachhead ("SME light-manufacturing in South Korea") but never sizes it. An investor needs:
   - How many SME manufacturing establishments exist in South Korea? (KOSIS / KOSTAT publish this.)
   - What fraction operates "high-mix / low-volume" packing/kitting/labeling lines?
   - What is the average annual spend on automation (or labor cost displaced) per line?
   - What share can GamiphyAI realistically capture in Year 1 / Year 3 / Year 5?

2. **No global TAM for the data marketplace.** The plan positions a "marketplace for robotics data" but never estimates the size of the addressable market for robotics training data globally, nor benchmarks it against adjacent markets (e.g., Scale AI's data-labeling TAM, simulation-data TAM).

3. **No revenue projections or financial model.** There is pricing (₩5M PoC, ₩0.5–3M/mo subscription, etc.) but zero projection of:
   - Number of customers per quarter/year.
   - Blended ARPU (average revenue per user/site).
   - Revenue ramp, gross margin, contribution margin, or path to breakeven.
   - An investor cannot evaluate unit economics without these numbers.

4. **"Beachhead" vs. "Platform" tension is unresolved.** The plan simultaneously pitches (a) a services-heavy SME automation business in Korea and (b) a global robotics data marketplace. These are two very different businesses with different economics, go-to-market motions, and capital requirements. Which one are you raising for? What is the sequencing and how does one fund the other?

### Investor expectation
Provide a bottoms-up market sizing with sources, a 3–5 year revenue projection model (even if rough), and a clear statement of which business you are building first and how the second follows.

---

## Method 2: Business Model Canvas / Unit Economics Evaluation

### Revenue streams — gaps and concerns

| Revenue stream | Concern |
|---|---|
| **PoC fee (≤₩5M)** | This is very low (~$3,500 USD). Does it cover your cost of delivery (travel, engineer time, hardware for demo)? What is the gross margin on a PoC? If negative, how many PoCs can you afford to subsidize before you need deployment conversions? |
| **Deployment fee (≤₩5M)** | Same concern — ₩5M for integration of a two-arm workcell seems unrealistically low. What is the estimated labor cost (hours × rate) for a deployment? Is this a loss-leader? If so, state it explicitly and model the payback period via subscription. |
| **Hardware (pass-through, 0–15% margin)** | Pass-through hardware is not a business. A 0–15% margin on ₩2–10M arms generates ₩0–1.5M gross profit per arm. This does not justify the operational complexity of procurement, logistics, warranty, and support. Why not let the customer buy directly? |
| **Data/skill subscription (₩0.5–3M/mo)** | This is where the recurring revenue lives. But what is the expected churn? What happens when the customer's task set stabilizes and they no longer need new skills? What is the value prop for Month 13+? |
| **Maintenance (₩0.8–2.5M/mo)** | Maintenance on two small arms is a thin business. What SLA are you committing to? What is your cost to deliver remote monitoring + periodic onsite visits? At ₩2.5M/mo, a single unscheduled onsite visit could wipe out a month's margin. |

### Unit economics — what's needed

- **Customer Acquisition Cost (CAC):** How much does it cost to find, qualify, and close one SME customer?
- **Lifetime Value (LTV):** What is the expected contract duration and total revenue per customer?
- **LTV:CAC ratio:** Investors expect ≥3:1 for a healthy SaaS/subscription business.
- **Payback period:** How many months of subscription revenue does it take to recover the (likely negative-margin) PoC + deployment cost?
- **Gross margin by revenue stream:** Break out the gross margin for each of the 5 revenue streams.

### Critical question
**Is this a software platform business or a robotics services business?** The plan reads like a services company (onsite PoCs, hardware integration, maintenance visits) wrapped in a platform narrative. Services businesses are valued at 1–3x revenue; platform businesses at 10–20x+. The valuation implications are enormous. Investors will want to see a credible path from services to platform — and the plan does not articulate one clearly.

---

## Method 3: Risk Matrix & Failure Mode Analysis

### High-severity risks not addressed in the plan

| Risk | Severity | Likelihood | Gap in plan |
|------|----------|------------|-------------|
| **Technology risk: VLA controllers are not reliable enough for production** | Critical | High | The plan targets "~99% end-to-end completion without human intervention." Current state-of-the-art VLA/imitation-learning controllers do not reliably achieve this in unstructured environments. What is your fallback if the ML approach cannot hit 99% reliability? Do you have a hybrid (scripted + learned) strategy? No technical risk mitigation is discussed. |
| **Data quality / cold-start problem** | High | High | The marketplace requires creators to upload datasets for specific SME tasks. But who creates data for a task that hasn't been contracted yet? And who pays for the first dataset when there is no buyer? The chicken-and-egg problem of two-sided marketplaces is not addressed. |
| **Single-market concentration (Korea only)** | Medium | High | All revenue is Korea-denominated. FX risk, regulatory risk, and customer concentration risk are real. What happens if Korean government subsidy programs (smart factory support) change or end? |
| **Key-person risk** | Critical | Medium | The company depends on two founders. One (Jose Bagur) appears to be based in Guatemala, not Korea. How does this work operationally? If Juan is doing sales, PoCs, deployment, maintenance, AND platform development, the business cannot scale. |
| **Competitive moats are weak** | High | Medium | The plan lists competitors but does not articulate a defensible moat. "Korea-first" is a geographic head start, not a moat. "Tied to real SME use cases" is a go-to-market tactic, not a moat. What prevents a well-funded competitor (e.g., ExchAInge, Sensei, or a Korean chaebol's robotics division) from replicating this? |
| **IP risk: open-source dependency** | Medium | Medium | The core robotics stack is LeRobot + DYNAMIXEL SDK + PyTorch — all open source. The platform is Supabase + React. There is no proprietary technology. What is the defensible IP? Data network effects? Deployment playbooks? These need to be articulated. |
| **Regulatory / liability risk** | High | Medium | Who is liable when a robot injures a worker on an SME production line? What certifications (CE, KC, etc.) are required for robot workcells in Korean manufacturing? What insurance is needed? The plan is silent on safety, compliance, and liability. |

### Missing: Risk mitigation plan
The plan has no section on risks and mitigation. Every serious investor expects one.

---

## Method 4: Team & Execution Capability Assessment

### Strengths
- **Juan Medrano** has directly relevant and impressive experience: Ph.D.-level robotics + ML research, plus real-world deployment experience at Agility Robotics on the Digit humanoid. This is rare and valuable.
- **Jose Bagur** has exceptional hardware/embedded systems credentials (CubeSat programs, SpaceX launch). Strong systems engineering background.
- **Local market access:** Juan's 9 years in Korea + Korean language proficiency is a genuine advantage for the SME beachhead.

### Gaps and concerns

1. **No business co-founder.** Neither founder has business, sales, or operations experience. The plan lists a "Commercial Lead" and "Platform Lead" as "Planned (next months)" — but these are the two most critical hires for a company that needs to sell to SMEs and build a marketplace. Investors will ask: who is selling today?

2. **Jose Bagur's location and commitment.** The plan says Jose is "Coordinator of the UVG Aerospace Laboratory" in Guatemala. Is he full-time on GamiphyAI? Is he relocating to Korea? A part-time, remote co-founder in a different timezone running a separate academic lab is a red flag for investors.

3. **Team of 2 attempting 4 jobs.** The plan requires simultaneous execution of: (a) platform development, (b) robotics R&D and PoC delivery, (c) SME sales and business development, (d) creator community building. Two people cannot do all four well. What is the hiring plan and timeline? What is the budget for the first 3–4 hires?

4. **No advisors or board mentioned.** For a pre-startup, having named advisors (especially in Korean manufacturing, robotics, or marketplace businesses) would significantly de-risk the team gap.

5. **KAIST mentoring section reads as a wish list.** "Access to communities, alumni network, equipment, scaling expertise" — these are aspirations, not commitments. Has KAIST agreed to any of this? What is the formal relationship?

### Investor expectation
- A clear answer on Jose's commitment level and location.
- A hiring plan with roles, timeline, and budget for the first 12 months.
- At least 2–3 named advisors with relevant domain expertise.
- Evidence of customer conversations (LOIs, pilot agreements, or at minimum, documented discovery interviews).

---

## Method 5: Competitive Positioning & Defensibility (Porter's Five Forces + Moat Analysis)

### Porter's Five Forces applied to GamiphyAI

| Force | Assessment |
|-------|------------|
| **Threat of new entrants** | **HIGH.** The barrier to entry is low. The robotics stack is open-source, marketplace platforms can be built quickly, and SME automation services can be started by any robotics consultancy. Multiple competitors already exist (ExchAInge, RobotDataMarket, Sensei, SignIQ Lab). |
| **Bargaining power of suppliers (robot creators)** | **HIGH.** Creators can sell data on any platform or directly. There is no lock-in. The plan does not describe exclusive relationships, non-compete clauses, or unique incentive structures that would retain creators. |
| **Bargaining power of buyers (SMEs)** | **HIGH.** SMEs are price-sensitive, have low switching costs, and can hire a local integrator or buy a turnkey solution from established automation vendors (e.g., Universal Robots + integrator). The plan's pricing is already very low — further pressure would destroy margins. |
| **Threat of substitutes** | **HIGH.** For the SME beachhead: traditional automation, cobots with teach pendants (no ML needed), or simply hiring more workers. For the data marketplace: direct data sharing, synthetic data generation, sim-to-real transfer, or vertically integrated solutions where the robot maker provides its own data/skills. |
| **Industry rivalry** | **MEDIUM-HIGH.** The robotics data space is early but heating up fast. Multiple well-funded startups (Sensei has YC backing, SignIQ Lab has infrastructure) and large players (NVIDIA Isaac, Google DeepMind) are investing heavily in robotics data. |

### Moat analysis — what could be defensible?

The plan does not articulate a moat. Here are the candidates, with honest assessment:

1. **Network effects (data marketplace):** In theory, more creators → more/better data → more buyers → more creators. But this only works if (a) the platform has significantly more/better data than alternatives, (b) there is meaningful cross-side network effects (creator data improves with buyer feedback), and (c) switching costs exist. Currently none of these conditions are met or described.

2. **Proprietary datasets:** If GamiphyAI accumulates a large, unique corpus of task-specific robotics data through its SME deployments, this could become defensible. But the plan does not address data ownership clearly — who owns the data generated during a PoC? The customer? GamiphyAI? The creator? This must be resolved.

3. **Deployment playbooks / operational knowledge:** Repeatable deployment patterns for specific SME task types could become a moat if codified and scaled. But this is a "learning curve" advantage, not a structural moat — it erodes as competitors gain experience.

4. **Community / brand in Korea:** Being the first credible robotics data platform in Korea could create brand advantage and community loyalty. This is real but fragile.

### Recommendation
The plan urgently needs a "Defensibility" section that honestly assesses what the moat is and how it will be built over time. "We are the only ones doing X" is not a moat — it is a temporary absence of competition.

---

## Method 6: Milestone Feasibility & Execution Plan Stress Test

### Month 1 milestones — reality check

| Milestone | Feasibility concern |
|-----------|-------------------|
| **5 signed SME automation agreements** | In one month? SME sales cycles in Korean manufacturing are relationship-driven and slow. Even with warm introductions, getting 5 signed agreements (not just conversations) in 30 days is extremely aggressive. How many SMEs have you already spoken to? How many are in pipeline? Without evidence of existing pipeline, this reads as aspirational. |
| **≥20 new robot dataset creators with ≥1 dataset each** | Where are these 20 creators coming from? What is the compensation structure? What hardware do they need? If they need robot arms to create data, who provides them? The plan says "outreach to the LeRobot creator community is in progress" — but 20 active contributors in Month 1 requires a community that already exists and is motivated. |
| **PoC definition and execution for 5 use cases** | In the same month as signing agreements and recruiting creators? A PoC requires: (a) understanding the task, (b) collecting/sourcing relevant data, (c) training/fine-tuning a controller, (d) testing on hardware, (e) measuring KPIs. This is weeks of work per use case. Five in parallel in Month 1 is not credible with a 2-person team. |

### Month 3 milestones — same concern amplified

- **≥10 use cases "actively running under controlled variables"** implies 10 separate SME engagements with working PoCs. This requires significant hardware (≥20 robot arms), onsite presence, and engineering bandwidth that a 2-person team cannot deliver.

### What investors want to see instead

- **Honest, conservative milestones** with clear dependencies and resource requirements.
- **A single, deeply executed first PoC** with a named customer (or anonymized case study) showing real results.
- **Evidence of demand:** LOIs, signed MOUs, paid pilot agreements, or at minimum, documented customer discovery interviews.
- **A use-of-funds table:** How will the investment be allocated? (hiring, hardware, operations, marketing, platform development — with percentages and timeline.)

---

## Method 7: Investment Readiness & Deal Structure Gaps

### What is completely missing from this plan (and required for any serious investment conversation)

1. **Financial projections (3–5 year P&L, cash flow, balance sheet).**
   - Revenue build-up by stream (PoC, deployment, hardware, subscription, maintenance).
   - Cost structure (COGS, headcount, hardware, hosting, travel, office).
   - Burn rate and runway.
   - Break-even timeline.

2. **Funding ask and use of funds.**
   - How much capital are you raising?
   - What is the pre-money valuation (or valuation methodology)?
   - How will funds be allocated? (e.g., 40% engineering/product, 25% sales/BD, 20% hardware/PoCs, 15% operations)
   - What milestones will this capital achieve? (e.g., "With ₩XXM, we will deliver Y PoCs, convert Z to paid deployments, and reach ₩XXM ARR by Month 18.")

3. **Cap table and legal structure.**
   - What is the corporate entity? (Korean corporation? US Delaware C-Corp? Dual structure?)
   - Founder equity split.
   - Any prior funding, grants, or convertible notes.
   - ESOP/option pool for future hires.

4. **Go-to-market evidence (traction).**
   - Number of SME discovery conversations completed.
   - Pipeline (qualified leads, LOIs, MOUs).
   - Platform metrics (registered users, datasets uploaded, transactions completed).
   - Any revenue to date (even small).

5. **Exit strategy / return thesis.**
   - How does the investor get a return?
   - Comparable exits in the space (acquisitions, IPOs).
   - Strategic acquirers who might be interested (NVIDIA, Google, Universal Robots, Doosan Robotics, Hyundai Robotics, etc.).

---

## Summary: Top 10 Questions an Investor Will Ask

| # | Question |
|---|----------|
| 1 | What is the total addressable market for robotics data, and how big is the Korean SME automation segment specifically? |
| 2 | Are you a platform company or a services company? What are your unit economics? |
| 3 | How do you solve the cold-start / chicken-and-egg problem of a two-sided marketplace? |
| 4 | Can VLA/imitation-learning controllers actually achieve 99% reliability in production today? What if they can't? |
| 5 | Who owns the data generated during PoCs and deployments? |
| 6 | Why can't a well-funded competitor replicate your approach in 6 months? |
| 7 | Your co-founder is in Guatemala running an academic lab — is he full-time? |
| 8 | How much are you raising, at what valuation, and what does it get you? |
| 9 | Do you have any paying customers, LOIs, or signed pilot agreements today? |
| 10 | Who is liable if a robot injures someone on an SME production line? |

---

*This feedback is intended to strengthen the business plan. The core idea — connecting robotics data supply with real-world automation demand — is compelling and timely. The founding team has strong technical credentials. But the plan in its current form reads as a product/technology document, not an investment-grade business plan. The gaps identified above are standard expectations for any seed-stage fundraise and should be addressed before investor meetings.*

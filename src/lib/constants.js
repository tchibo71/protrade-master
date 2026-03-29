export const TRADES = [
  // Electrical & Mechanical
  "Electrical",
  "Electrician",
  "Plumber",
  "Plumbing",
  "HVAC",
  // Structural & Framing
  "Carpentry / Framing",
  "Remodeling Contractor",
  "Drywall / Finishing",
  // Roofing & Exterior
  "Roofing",
  "Roofer",
  "Gutter Installer",
  // Masonry & Concrete
  "Concrete / Masonry",
  "Mason",
  "Block Mason",
  "Concrete Finisher",
  "Concrete Retaining Wall Contractor",
  // Septic & Well
  "Septic Systems",
  "Septic System Installer",
  "Septic Tank Installer",
  "Septic System Designer",
  "Septic System Inspector",
  "Septic System Pumper",
  "Well Driller",
  "Well Pump Installer",
  // Site Work & Earthmoving
  "Excavation / Site Preparation",
  "Excavation Contractor",
  "Grading Contractor",
  "Site Work Contractor",
  "Trenching Contractor",
  "Earthmoving Contractor",
  // Drainage & Stormwater
  "Drainage Solutions",
  "Drainage Contractor",
  "Underground Drainage Contractor",
  "Surface Drainage Contractor",
  "Stormwater Drainage Contractor",
  "French Drain Installer",
  "Catch Basin Installer",
  "Culvert Installer",
  "Sump Pump Installer",
  "Drainage System Designer",
  "Erosion Control Contractor",
  "Sediment Control Contractor",
  "Stormwater BMP Installer",
  // Retaining Walls
  "Retaining Walls",
  "Retaining Wall Contractor",
  "Segmental Retaining Wall Installer",
  "Timber Retaining Wall Installer",
  "Gabion Wall Installer",
  "Geo-Grid & MSE Wall Contractor",
  // Hardscaping & Paving
  "Hardscaping",
  "Hardscaping Contractor",
  "Paver Installer",
  "Interlocking Concrete Paver Installer",
  "Natural Stone Paver Installer",
  "Permeable Paver Installer",
  "Patio & Walkway Contractor",
  "Driveway Contractor",
  // Landscape & Other
  "Landscape Contractor",
  "Guttering / Drainage",
  // Professional — Law
  "Attorney / Legal (General)",
  // Criminal Law
  "Criminal Law Attorney",
  "Criminal Defense Attorney",
  "Prosecutor / District Attorney",
  "White Collar Crime Attorney",
  "DUI / Traffic Defense Attorney",
  "Juvenile Defense Attorney",
  // Civil Litigation
  "Civil Litigation Attorney",
  "Plaintiff's Litigation Attorney",
  "Defense Litigation Attorney",
  "Personal Injury Attorney",
  "Medical Malpractice Attorney",
  "Class Action Attorney",
  // Family Law
  "Family Law Attorney",
  "Divorce & Separation Attorney",
  "Child Custody & Support Attorney",
  "Adoption Attorney",
  "Domestic Violence / Protective Order Attorney",
  "Guardianship & Conservatorship Attorney",
  // Corporate / Business Law
  "Corporate / Business Law Attorney",
  "Business Formation & Contracts Attorney",
  "Mergers & Acquisitions Attorney",
  "Employment & Labor Law Attorney",
  "Commercial Law Attorney",
  "Antitrust & Competition Attorney",
  "Securities & Finance Attorney",
  // Real Estate Law
  "Real Estate Law Attorney",
  "Residential Real Estate Attorney",
  "Commercial Real Estate Attorney",
  "Landlord-Tenant Attorney",
  "Zoning & Land Use Attorney",
  // Estate Planning & Probate
  "Estate Planning & Probate Attorney",
  "Wills & Trusts Attorney",
  "Probate & Estate Administration Attorney",
  "Elder Law Attorney",
  "Special Needs / Disability Planning Attorney",
  // Immigration Law
  "Immigration Law Attorney",
  "Family-Based Immigration Attorney",
  "Business & Employment Immigration Attorney",
  "Deportation Defense Attorney",
  "Asylum & Refugee Law Attorney",
  // Specialized Practice Areas
  "Intellectual Property (IP) Attorney",
  "Patent Attorney",
  "Trademark & Copyright Attorney",
  "Healthcare Law Attorney",
  "Administrative Law Attorney",
  "Environmental Law Attorney",
  "Bankruptcy Law Attorney",
  "Civil Rights Attorney",
  "Cybersecurity & Data Privacy Attorney",
  "Tax Law Attorney",
  "Social Security Disability (SSD) Attorney",
  // Professional — Accounting
  "Accountant (General)",
  "Certified Public Accountant (CPA)",
  "Management Accountant / Cost Accountant",
  "Tax Accountant",
  "Tax Examiner / Revenue Agent",
  "Forensic Accountant",
  "Internal Auditor",
  "External Auditor",
  "Government Accountant",
  "Investment Accountant",
  "Project Accountant",
  "Bookkeeper",
  "Payroll Specialist",
  "Financial Advisor / Planner",
  "Financial Analyst",
  "Budget Analyst",
  "Controller / Comptroller",
  "Chief Financial Officer (CFO)",
  // Professional — Holistic & Naturopathic Health
  "Holistic Health Practitioner (General)",
  "Naturopathic Doctor (ND)",
  "Homeopathic Practitioner",
  "Homeopathic Doctor",
  "Herbalist / Botanical Medicine Practitioner",
  "Nutritional Therapist",
  "Functional Medicine Practitioner",
  "Ayurvedic Practitioner",
  "Traditional Chinese Medicine (TCM) Practitioner",
  "Acupuncturist",
  "Massage Therapist",
  "Reiki Practitioner",
  "Health Coach / Wellness Coach",
];

// Grouped structure for professional trades (for UI rendering)
export const PROFESSIONAL_TRADE_GROUPS = [
  {
    category: "Law",
    groups: [
      {
        parent: "Attorney / Legal (General)",
        specialties: [],
      },
      {
        parent: "Criminal Law",
        specialties: ["Criminal Defense Attorney", "Prosecutor / District Attorney", "White Collar Crime Attorney", "DUI / Traffic Defense Attorney", "Juvenile Defense Attorney"],
      },
      {
        parent: "Civil Litigation",
        specialties: ["Plaintiff's Litigation Attorney", "Defense Litigation Attorney", "Personal Injury Attorney", "Medical Malpractice Attorney", "Class Action Attorney"],
      },
      {
        parent: "Family Law",
        specialties: ["Divorce & Separation Attorney", "Child Custody & Support Attorney", "Adoption Attorney", "Domestic Violence / Protective Order Attorney", "Guardianship & Conservatorship Attorney"],
      },
      {
        parent: "Corporate / Business Law",
        specialties: ["Business Formation & Contracts Attorney", "Mergers & Acquisitions Attorney", "Employment & Labor Law Attorney", "Commercial Law Attorney", "Antitrust & Competition Attorney", "Securities & Finance Attorney"],
      },
      {
        parent: "Real Estate Law",
        specialties: ["Residential Real Estate Attorney", "Commercial Real Estate Attorney", "Landlord-Tenant Attorney", "Zoning & Land Use Attorney"],
      },
      {
        parent: "Estate Planning & Probate",
        specialties: ["Wills & Trusts Attorney", "Probate & Estate Administration Attorney", "Elder Law Attorney", "Special Needs / Disability Planning Attorney"],
      },
      {
        parent: "Immigration Law",
        specialties: ["Family-Based Immigration Attorney", "Business & Employment Immigration Attorney", "Deportation Defense Attorney", "Asylum & Refugee Law Attorney"],
      },
      {
        parent: "Intellectual Property (IP)",
        specialties: ["Patent Attorney", "Trademark & Copyright Attorney"],
      },
      {
        parent: "Specialized Practice Areas",
        specialties: ["Healthcare Law Attorney", "Administrative Law Attorney", "Environmental Law Attorney", "Bankruptcy Law Attorney", "Civil Rights Attorney", "Cybersecurity & Data Privacy Attorney", "Tax Law Attorney", "Social Security Disability (SSD) Attorney"],
      },
    ],
  },
  {
    category: "Accounting & Finance",
    groups: [
      {
        parent: "Accountant (General)",
        specialties: ["Certified Public Accountant (CPA)", "Management Accountant / Cost Accountant", "Tax Accountant", "Tax Examiner / Revenue Agent", "Forensic Accountant", "Government Accountant", "Investment Accountant", "Project Accountant"],
      },
      {
        parent: "Auditor",
        specialties: ["Internal Auditor", "External Auditor"],
      },
      {
        parent: "Financial Planning & Advisory",
        specialties: ["Financial Advisor / Planner", "Financial Analyst", "Budget Analyst"],
      },
      {
        parent: "Accounting Management",
        specialties: ["Controller / Comptroller", "Chief Financial Officer (CFO)", "Bookkeeper", "Payroll Specialist"],
      },
    ],
  },
  {
    category: "Holistic & Naturopathic Health",
    groups: [
      {
        parent: "Holistic Health Practitioner (General)",
        specialties: ["Naturopathic Doctor (ND)", "Homeopathic Practitioner", "Homeopathic Doctor", "Herbalist / Botanical Medicine Practitioner", "Nutritional Therapist", "Functional Medicine Practitioner", "Ayurvedic Practitioner", "Traditional Chinese Medicine (TCM) Practitioner", "Acupuncturist", "Massage Therapist", "Reiki Practitioner", "Health Coach / Wellness Coach"],
      },
    ],
  },
];

export const LEVELS = [
  "Novice",
  "Beginner",
  "Intermediate Low",
  "Intermediate Advanced",
  "Advanced",
  "Journeyman",
  "Master"
];

export const SCENARIO_TYPES = [
  "Repair / Troubleshooting",
  "New Installation",
  "Inspection / Code Violation Fix",
  "Rough-In Work",
  "Finish Work"
];

export const SETTINGS = [
  "Residential Single-Family",
  "Multi-Family / Apartment",
  "Light Commercial",
  "Full Commercial",
  "Remodel / Renovation",
  "New Construction"
];

export const LEVEL_ORDER = {
  "Novice": 0,
  "Beginner": 1,
  "Intermediate Low": 2,
  "Intermediate Advanced": 3,
  "Advanced": 4,
  "Journeyman": 5,
  "Master": 6
};

export const SCENARIO_GENERATOR_PROMPT = `You are a master contractor trainer operating in Tennessee with deep expertise across all residential, commercial, and specialty trades. Your job is to generate a single, realistic, highly detailed contractor training scenario.

## YOUR ROLE
You are creating a scenario that will be presented to a contractor trainee. The scenario must be specific, realistic, and challenge the trainee at their exact skill level. It must have one correct best-practice answer that reflects both top-tier workmanship AND full code compliance under Tennessee jurisdiction.

## JURISDICTION NOTE
Primary jurisdiction: Tennessee. Greene County headquarters. Work area: Bristol to Chattanooga corridor, TN/NC State line to Hancock County and beyond Anderson County.

ALL applicable governing standards must be cited and enforced, including but not limited to:
- **Federal:** OSHA 29 CFR (all applicable parts), EPA regulations, federal building codes, ADA/ABA, FHWA standards
- **Tennessee State:** Tennessee State Building Code, TCA (Tennessee Code Annotated) all applicable titles, TOSHA regulations, TDEC Rules Chapter 0400-48-01 (septic/subsurface), TDEC stormwater & erosion rules, TN Dept of Commerce and Insurance regs, TN Board for Licensing Contractors requirements, TN Dept of Agriculture rules, TN Dept of Health regulations
- **International Codes (Tennessee adoptions):** NEC (NFPA 70), IRC, IBC, IPC, IMC, IFGC, IECC, IFC, ISPSC, IFBC
- **NFPA Standards:** NFPA 13, 54, 58, 72, 101, and all other applicable NFPA standards
- **ASHRAE Standards:** ASHRAE 90.1, 62.1, 15, and all other applicable standards
- **AWWA Standards** (water/well work), **ASTM Standards** (materials), **ANSI Standards** (all trades), **AWS Standards** (welding/structural)
- **EPA/NPDES:** Stormwater, erosion, sediment control, BMP requirements
- **TDOT Standards** (when near roadways), **Greene County & local amendments**, applicable utility authority requirements
- **Manufacturer specifications and installation instructions** (always binding per code)
- Any other applicable federal agency, state agency, trade association, or standards body governing the specific trade or task

**FOR LEGAL / ATTORNEY SCENARIOS:** Also apply Tennessee Rules of Professional Conduct (Tenn. Sup. Ct. R. 8), Tennessee Board of Professional Responsibility rules, ABA Model Rules of Professional Conduct, applicable Tennessee statutes (TCA Title 29 civil, TCA Title 39 criminal, TCA Title 36 family, TCA Title 66 real estate/property, TCA Title 30-32 estates/probate, TCA Title 8 immigration-adjacent state rules), Federal Rules of Civil/Criminal Procedure, Tennessee Rules of Civil/Criminal Procedure, relevant Federal Circuit and Tennessee appellate case law, and all applicable bar ethics opinions.

**FOR ACCOUNTING / FINANCE SCENARIOS:** Also apply Tennessee Board of Accountancy rules (Tenn. Code Ann. Title 62 Chapter 1), AICPA Code of Professional Conduct, GAAP (Generally Accepted Accounting Principles), GAAS (Generally Accepted Auditing Standards), IRS regulations and Treasury rules (26 CFR), Sarbanes-Oxley Act (where applicable), SEC regulations (where applicable), Tennessee Uniform CPA Act, and applicable financial planning standards (CFP Board, FINRA rules).

**FOR HOLISTIC / NATUROPATHIC / HOMEOPATHIC HEALTH SCENARIOS:** Also apply Tennessee Department of Health licensing requirements, TCA Title 63 (Health Professions), Tennessee Massage Licensure Act (TCA 63-18), Tennessee Acupuncture Law (TCA 63-6), HIPAA Privacy and Security Rules (45 CFR Parts 160/164), FTC regulations on health claims and advertising, FDA regulations on supplements and homeopathic products (21 CFR), National Center for Homeopathy guidelines, American Association of Naturopathic Physicians standards, scope-of-practice limitations specific to unlicensed vs. licensed holistic practitioners in Tennessee, and any applicable informed consent requirements.

## SCENARIO PARAMETERS
You will receive the following inputs from the app:
- TRADE: The trade or trades involved
- LEVEL: The trainee's experience level
- SCENARIO TYPE: The type of task
- CONTEXT: The job site setting

## EXPERIENCE LEVEL DEFINITIONS
- Novice — Has never done professional contractor work. Scenarios involve the most fundamental tasks.
- Beginner — Has done basic tasks under supervision. Standard single-trade tasks.
- Intermediate Low — Completed real jobs independently. Moderately complex tasks.
- Intermediate Advanced — Competent but not mastering edge cases. Complex installs, tricky code intersections.
- Advanced — Highly competent. Non-standard situations, multiple code considerations.
- Journeyman — Near-expert. Complex multi-system coordination, code edge cases.
- Master — The pinnacle. Absolutely flawless work required. Complex coordination, code mastery, long-term quality.

## OUTPUT FORMAT
Generate your scenario in this exact format:

---
**TRADE(S):** [List the trade or trades]
**LEVEL:** [Experience level]
**SCENARIO TYPE:** [Type]
**SETTING:** [Context]

---

### THE SCENARIO

[Write 2–5 paragraphs describing the situation in vivid, realistic detail.]

---

### YOUR TASK

[Write 1–3 clear sentences stating exactly what the trainee must explain.]

---

**NOTE:** Do not provide any hints, suggestions, or partial answers.`;

export const EVALUATOR_PROMPT = `You are a master contractor trainer and inspector operating in Tennessee with expert-level knowledge of all applicable trade codes, standards, and best practices. You are evaluating a trainee's written answer to a contractor training scenario.

## JURISDICTION NOTE
Primary jurisdiction: Tennessee. Greene County headquarters. Work area: Bristol to Chattanooga, TN/NC State line to Hancock County and beyond Anderson County.

ALL applicable governing standards must be cited and evaluated, including but not limited to:
- **Federal:** OSHA 29 CFR (all parts), EPA, ADA/ABA, federal statutes and agency rules
- **Tennessee State:** TCA all applicable titles, TOSHA, TDEC Rules (0400-48-01 and all stormwater/erosion rules), TN Dept of Commerce and Insurance, TN Board for Licensing Contractors, TN Dept of Agriculture, TN Dept of Health
- **International Codes (TN adoptions):** NEC (NFPA 70), IRC, IBC, IPC, IMC, IFGC, IECC, IFC, ISPSC
- **NFPA, ASHRAE, AWWA, ASTM, ANSI, AWS** standards applicable to the trade
- **EPA/NPDES** stormwater, erosion, sediment control, BMP requirements
- **TDOT standards** (near roadways), Greene County and local amendments
- **Manufacturer specifications** (always binding per code — failure to follow = code violation)
- Any other applicable standards body for the specific trade or task
- **FOR LEGAL:** Tennessee Rules of Professional Conduct, TN Board of Professional Responsibility, ABA Model Rules, applicable TCA titles, TN/Federal Rules of Procedure, relevant case law
- **FOR ACCOUNTING:** TN Board of Accountancy, AICPA Code, GAAP, GAAS, IRS/Treasury rules, Sarbanes-Oxley, SEC regs, CFP/FINRA standards where applicable
- **FOR HOLISTIC/HEALTH:** TCA Title 63, TN Dept of Health licensing rules, HIPAA (45 CFR 160/164), FDA supplement/homeopathic regs, FTC health claims rules, TN scope-of-practice limits, informed consent requirements

## YOUR ROLE
You will receive:
1. The original scenario
2. The trainee's experience level
3. The trainee's written answer

Evaluate honestly, fairly, and in depth. Score AND provide detailed written critique. Be direct. Be specific. Be constructive.

## SCORING SYSTEM
Score across five categories (0–20 each, total 100):
- Safety (0–20): PPE, jobsite safety, utility safety, fall protection, OSHA
- Code Compliance (0–20): NEC, IRC, IPC, IMC, TDEC 0400-48-01, Tennessee State Building Code, local amendments
- Quality of Workmanship (0–20): sequencing, materials, longevity, attention to detail
- Completeness (0–20): all steps, all relevant considerations
- Professional Judgment (0–20): sequencing, coordination, practical problem-solving

## OUTPUT FORMAT

---

## EVALUATION RESULTS

**Level:** [Level]
**Trade(s):** [Trade(s)]
**Scenario Type:** [Type]

---

### SCORES

| Category | Score | Max |
|---|---|---|
| Safety | X/20 | 20 |
| Code Compliance | X/20 | 20 |
| Quality of Workmanship | X/20 | 20 |
| Completeness | X/20 | 20 |
| Professional Judgment | X/20 | 20 |
| **TOTAL** | **X/100** | **100** |

**Grade:**
- 90–100: Master-level work ✓
- 80–89: Advanced / Near-Journeyman
- 70–79: Solid Intermediate
- 60–69: Developing — significant gaps remain
- Below 60: Needs significant development

---

### WHAT YOU GOT RIGHT
[3–6 specific things answered correctly]

---

### CRITICAL ERRORS & OMISSIONS
[Every significant error with code citations where applicable — cite Tennessee statutes, agency regs, and building codes]

---

### CODE COMPLIANCE NOTES
[Every relevant code section, whether addressed correctly/partially/not at all. Include Tennessee-specific statutes and regulatory citations.]

---

### WORKMANSHIP NOTES
[Quality of workmanship assessment]

---

### SUMMARY & DEVELOPMENT FOCUS
[2–3 sentence summary + 1–2 focus areas]

---`;

export const IDEAL_ANSWER_PROMPT = `You are a master contractor trainer in Tennessee with expert-level knowledge across all trades and applicable codes. You are providing the ideal, complete, gold-standard answer to a contractor training scenario.

## JURISDICTION NOTE
Primary jurisdiction: Tennessee. Greene County headquarters. Work area: Bristol to Chattanooga, TN/NC State line to Hancock County and beyond Anderson County.

ALL applicable governing standards must be cited in the ideal answer, including but not limited to:
- **Federal:** OSHA 29 CFR (all parts), EPA, ADA/ABA, federal statutes and agency rules
- **Tennessee State:** TCA all applicable titles, TOSHA, TDEC Rules (0400-48-01 and all stormwater/erosion rules), TN Dept of Commerce and Insurance, TN Board for Licensing Contractors, TN Dept of Agriculture, TN Dept of Health
- **International Codes (TN adoptions):** NEC (NFPA 70), IRC, IBC, IPC, IMC, IFGC, IECC, IFC, ISPSC
- **NFPA, ASHRAE, AWWA, ASTM, ANSI, AWS** standards applicable to the trade
- **EPA/NPDES** stormwater, erosion, sediment control, BMP requirements
- **TDOT standards** (near roadways), Greene County and local amendments
- **Manufacturer specifications** (always binding per code)
- Any other applicable standards body for the specific trade or task
- **FOR LEGAL:** Tennessee Rules of Professional Conduct, TN Board of Professional Responsibility, ABA Model Rules, applicable TCA titles, TN/Federal Rules of Procedure, relevant case law
- **FOR ACCOUNTING:** TN Board of Accountancy, AICPA Code, GAAP, GAAS, IRS/Treasury rules, Sarbanes-Oxley, SEC regs, CFP/FINRA standards where applicable
- **FOR HOLISTIC/HEALTH:** TCA Title 63, TN Dept of Health licensing rules, HIPAA (45 CFR 160/164), FDA supplement/homeopathic regs, FTC health claims rules, TN scope-of-practice limits, informed consent requirements

## OUTPUT FORMAT

---

## IDEAL ANSWER

**Level:** [Level]
**Trade(s):** [Trade(s)]

---

### OVERVIEW
[1–2 sentences on core approach]

---

### STEP-BY-STEP PROCEDURE
[Numbered steps. Each: what, how, why, code citation at appropriate level. Correct professional sequence.]

---

### CODE COMPLIANCE SUMMARY
[Every applicable code section: Tennessee statutes, agency regs, building codes, construction standards. What required, how it applies, Tennessee-specific requirements.]

---

### MATERIAL SPECIFICATIONS
[Correct materials, sizes, ratings, grades. Why correct. What NOT to use.]

---

### WORKMANSHIP STANDARDS
[What excellent finished work looks like. Tolerances, benchmarks, longevity.]

---

### COMMON MISTAKES ON THIS TYPE OF JOB
[3–6 mistakes, failure modes, how to avoid]

---

### PRO TIPS
[2–4 field-tested professional tips]

---`;
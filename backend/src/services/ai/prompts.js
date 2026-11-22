/**
 * CivicLens AI Service - Prompts & Classification Schemas
 * Standardized prompts, allowed categories, and heuristic keyword classifier.
 */

export const CIVIC_ISSUE_TYPES = [
  'Roads and Potholes',
  'Solid Waste & Garbage',
  'Water Supply & Drainage',
  'Street Lighting & Electrical',
  'Traffic & Signage',
  'Public Parks & Trees',
  'Other Civic Issue'
];

export const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export const DEPARTMENTS = [
  'Roads and Infrastructure',
  'Solid Waste Management',
  'Water Supply & Sewerage',
  'Electricity & Streetlights',
  'Traffic & Transportation',
  'Horticulture & Parks',
  'General Municipal Services'
];

export const CONFIDENCE_LEVELS = ['Low', 'Medium', 'High'];

/**
 * Standard mapping between issue type and the responsible municipal department.
 */
export const ISSUE_TO_DEPARTMENT_MAP = {
  'Roads and Potholes': 'Roads and Infrastructure',
  'Solid Waste & Garbage': 'Solid Waste Management',
  'Water Supply & Drainage': 'Water Supply & Sewerage',
  'Street Lighting & Electrical': 'Electricity & Streetlights',
  'Traffic & Signage': 'Traffic & Transportation',
  'Public Parks & Trees': 'Horticulture & Parks',
  'Other Civic Issue': 'General Municipal Services'
};

/**
 * JSON Schema for Gemini structured output
 */
export const CIVIC_ASSESSMENT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    issueType: {
      type: 'string',
      enum: CIVIC_ISSUE_TYPES,
      description: 'The civic category that best classifies this issue.'
    },
    severity: {
      type: 'string',
      enum: SEVERITY_LEVELS,
      description: 'Urgency and potential danger level: Low, Medium, High, or Critical.'
    },
    department: {
      type: 'string',
      enum: DEPARTMENTS,
      description: 'The responsible municipal department to dispatch.'
    },
    summary: {
      type: 'string',
      description: 'Concise, factual 1-2 sentence assessment of the civic problem and visible damage.'
    },
    riskReason: {
      type: 'string',
      description: 'Specific explanation of public safety, health, environmental, or transit risks.'
    },
    recommendedAction: {
      type: 'string',
      description: 'Immediate concrete recommended operational action for municipal field workers.'
    },
    confidence: {
      type: 'string',
      enum: CONFIDENCE_LEVELS,
      description: 'Model confidence score in this assessment based on clarity of photo and description.'
    },
    needsHumanReview: {
      type: 'boolean',
      description: 'True if ambiguous, high-severity, or potentially controversial requiring supervisor review.'
    }
  },
  required: [
    'issueType',
    'severity',
    'department',
    'summary',
    'riskReason',
    'recommendedAction',
    'confidence',
    'needsHumanReview'
  ]
};

/**
 * System instruction provided to Gemini 2.5
 */
export const CIVIC_ANALYSIS_SYSTEM_INSTRUCTION = `
You are CivicLens AI, a specialized municipal civil engineer and urban safety triage assistant.
Your mission is to objectively inspect, analyze, and triage civic infrastructure complaints reported by citizens.

Analyze the complaint input, which may include a citizen's complaint title, description, locality, landmark, and an attached real-world photo.

Follow these strict rules:
1. Objectivity: Base your severity assessment on real physical risk to human safety, vehicle damage, public hygiene, or civic disruption.
2. Severities:
   - "Critical": Imminent risk of serious injury, live electrical wires, major road cave-in/sinkhole, active flooding into homes, open manholes on busy streets.
   - "High": Significant accident risk, severe pothole on main road, blocked major drain, fallen heavy tree limb obstructing road.
   - "Medium": Standard civic failure causing nuisance or delay (e.g. uncollected garbage heap, dark streetlight on residential lane, broken footpath slab).
   - "Low": Minor cosmetic or low-risk issue (e.g. faded street sign, small litter, minor park maintenance).
3. Departments: Choose exclusively from:
   - "Roads and Infrastructure" (Roads and Potholes)
   - "Solid Waste Management" (Solid Waste & Garbage)
   - "Water Supply & Sewerage" (Water Supply & Drainage)
   - "Electricity & Streetlights" (Street Lighting & Electrical)
   - "Traffic & Transportation" (Traffic & Signage)
   - "Horticulture & Parks" (Public Parks & Trees)
   - "General Municipal Services" (Other Civic Issue)
4. Needs Human Review: Set needsHumanReview to true whenever severity is "High" or "Critical", if the image is blurry/unclear, or if description is ambiguous.
5. Response Format: Return ONLY a valid JSON object matching the requested schema. Do NOT include markdown code fences or conversational text.
`.trim();

/**
 * Build user prompt text from complaint parameters
 */
export function buildCivicAnalysisPrompt({ title = '', description = '', locality = '', landmark = '' }) {
  const parts = [];
  parts.push('Please analyze the following citizen civic complaint:');
  if (title) parts.push(`- Title: ${title}`);
  if (description) parts.push(`- Description: ${description}`);
  if (locality) parts.push(`- Locality / Neighborhood: ${locality}`);
  if (landmark) parts.push(`- Landmark: ${landmark}`);
  parts.push('\nEvaluate the situation, classify the issue, assign severity, identify the responsible department, and return the structured JSON assessment.');
  return parts.join('\n');
}

/**
 * Keyword-based heuristic classifier used as a graceful fallback
 * when GEMINI_API_KEY is not configured or when an external API error occurs.
 */
export function classifyByKeywords({ title = '', description = '', locality = '', landmark = '' }) {
  const combinedText = `${title} ${description} ${locality} ${landmark}`.toLowerCase();

  const rules = [
    {
      type: 'Solid Waste & Garbage',
      patterns: [
        /\b(?:garbage|waste|trash|dump|dumping|debris|litter|littering|dustbin|bins?|stench|smell|rotting|rubbish|refuse)\b/i
      ],
      summary: (loc) => `Uncollected waste or garbage accumulation reported in ${loc || 'the locality'}.`,
      riskReason: 'Public health hazard, foul odor, and potential disease vector breeding.',
      recommendedAction: 'Deploy municipal waste collection truck and sanitize the clearance site.'
    },
    {
      type: 'Water Supply & Drainage',
      patterns: [
        /\b(?:water|leak|leaking|leakage|pipe|pipeline|drain|drainage|sewer|sewerage|manhole|overflow|overflowing|flooding?|stagnant|waterlog(?:ged|ging)?|contamination)\b/i
      ],
      summary: (loc) => `Water drainage or pipeline issue reported near ${loc || 'the locality'}.`,
      riskReason: 'Risk of contaminated water supply, localized flooding, and open drainage hazard.',
      recommendedAction: 'Dispatch water supply and sewerage engineer to inspect pipeline or clear drain obstruction.'
    },
    {
      type: 'Street Lighting & Electrical',
      patterns: [
        /\b(?:streetlight|street\s*light|lamp\s*post|pole|electric|electricity|wires?|spark(?:ing)?|transformer|blackout|dark(?:ness)?)\b/i
      ],
      summary: (loc) => `Street lighting or electrical fault reported in ${loc || 'the locality'}.`,
      riskReason: 'Reduced night visibility increases road accident hazard and pedestrian safety vulnerability.',
      recommendedAction: 'Direct electrical maintenance crew to repair lighting circuit or replace bulb/fixture.'
    },
    {
      type: 'Roads and Potholes',
      patterns: [
        /\b(?:potholes?|crater|asphalt|tar(?:mac)?|road|roads|pavement|footpath|sidewalk|divider|curb|cave-?in|sinkhole)\b/i
      ],
      summary: (loc) => `Reported road or pavement defect in ${loc || 'the locality'}.`,
      riskReason: 'Vehicular damage hazard, traffic slowdown, and severe skid risk for two-wheelers.',
      recommendedAction: 'Dispatch road maintenance squad with asphalt cold-patch repair equipment.'
    },
    {
      type: 'Traffic & Signage',
      patterns: [
        /\b(?:traffic|signals?|signs?|signage|zebra\s*crossing|speed\s*breaker|speed\s*bump|congestion)\b/i
      ],
      summary: (loc) => `Traffic signage or signal irregularity reported in ${loc || 'the locality'}.`,
      riskReason: 'Compromised intersection guidance leading to vehicular conflicts and congestion.',
      recommendedAction: 'Assign traffic engineering division to service signaling hardware or restore signage.'
    },
    {
      type: 'Public Parks & Trees',
      patterns: [
        /\b(?:trees?|branch(?:es)?|parks?|gardens?|grass|weeds?|fallen\s*tree|pruning|horticulture)\b/i
      ],
      summary: (loc) => `Park maintenance or overgrown/fallen tree limb reported in ${loc || 'the locality'}.`,
      riskReason: 'Obstruction to pedestrian pathways and potential contact with overhead utility wires.',
      recommendedAction: 'Send horticulture pruning team with chain saws for tree trimming or park cleanup.'
    }
  ];

  let bestType = 'Other Civic Issue';
  let bestScore = 0;
  let bestRule = null;

  for (const rule of rules) {
    let score = 0;
    for (const pattern of rule.patterns) {
      const matches = combinedText.match(new RegExp(pattern, 'gi'));
      if (matches) {
        score += matches.length;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = rule.type;
      bestRule = rule;
    }
  }

  let summary = bestRule
    ? bestRule.summary(locality)
    : `Civic issue recorded and queued for municipal inspection in ${locality || 'the locality'}.`;
  let riskReason = bestRule
    ? bestRule.riskReason
    : 'Potential disruption to local civic amenities.';
  let recommendedAction = bestRule
    ? bestRule.recommendedAction
    : 'Dispatch field inspection officer for on-site physical evaluation.';

  // Heuristic for severity
  let severity = 'Medium';
  if (/(critical|emergency|danger|severe|collapse|sinkhole|exposed\s*wire|sparking|fatal|burst\s*pipe|open\s*manhole)/i.test(combinedText)) {
    severity = 'Critical';
  } else if (/(urgent|major|hazard|flooded|heavy|blocked|accident|broken)/i.test(combinedText)) {
    severity = 'High';
  } else if (/(minor|small|slight|faded|cosmetic)/i.test(combinedText)) {
    severity = 'Low';
  }

  const department = ISSUE_TO_DEPARTMENT_MAP[bestType] || 'General Municipal Services';

  return {
    issueType: bestType,
    severity,
    department,
    summary,
    riskReason,
    recommendedAction,
    confidence: 'Low',
    needsHumanReview: true
  };
}

/**
 * CivicLens AI Services
 * Public module exports for civic complaint intelligence and image assessment.
 */

export {
  analyzeIssue,
  isGeminiConfigured,
  fallbackRuleBasedClassification
} from './geminiService.js';

export {
  CIVIC_ISSUE_TYPES,
  SEVERITY_LEVELS,
  DEPARTMENTS,
  CONFIDENCE_LEVELS,
  ISSUE_TO_DEPARTMENT_MAP,
  CIVIC_ANALYSIS_SYSTEM_INSTRUCTION,
  CIVIC_ASSESSMENT_JSON_SCHEMA,
  buildCivicAnalysisPrompt,
  classifyByKeywords
} from './prompts.js';

import { analyzeIssue } from './geminiService.js';

export default {
  analyzeIssue
};

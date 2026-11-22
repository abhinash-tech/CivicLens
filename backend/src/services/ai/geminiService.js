/**
 * CivicLens AI Service - Gemini Vision Complaint Triage
 * Uses official @google/genai SDK with resilient timeout and heuristic fallbacks.
 */

import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../../.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

import {
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

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MODEL = 'gemini-3.8-flash';

/**
 * Returns true if the Gemini API key is configured and not a placeholder.
 */
export function isGeminiConfigured() {
  const key = process.env.GEMINI_API_KEY?.trim();
  return Boolean(key && key !== 'your_gemini_api_key_here');
}

/**
 * Sanitizes and validates the AI response object against expected enums.
 */
function sanitizeAiResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('AI response is not an object');
  }

  const issueType = CIVIC_ISSUE_TYPES.includes(raw.issueType)
    ? raw.issueType
    : 'Other Civic Issue';

  const severity = SEVERITY_LEVELS.includes(raw.severity)
    ? raw.severity
    : 'Medium';

  const department = DEPARTMENTS.includes(raw.department)
    ? raw.department
    : (ISSUE_TO_DEPARTMENT_MAP[issueType] || 'General Municipal Services');

  const confidence = CONFIDENCE_LEVELS.includes(raw.confidence)
    ? raw.confidence
    : 'Medium';

  const needsHumanReview = typeof raw.needsHumanReview === 'boolean'
    ? raw.needsHumanReview
    : (severity === 'High' || severity === 'Critical');

  const summary = typeof raw.summary === 'string' && raw.summary.trim()
    ? raw.summary.trim()
    : 'Civic issue recorded for administrative inspection.';

  const riskReason = typeof raw.riskReason === 'string' && raw.riskReason.trim()
    ? raw.riskReason.trim()
    : 'Potential impact on public infrastructure or safety.';

  const recommendedAction = typeof raw.recommendedAction === 'string' && raw.recommendedAction.trim()
    ? raw.recommendedAction.trim()
    : 'Dispatch field inspection crew to survey the site.';

  return {
    issueType,
    severity,
    department,
    summary,
    riskReason,
    recommendedAction,
    confidence,
    needsHumanReview
  };
}

/**
 * Extracts and parses JSON from Gemini's response text.
 */
function parseGeminiJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from Gemini');
  }

  // Remove markdown code fences if present (e.g. ```json ... ```)
  const cleanedText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleanedText);
  return sanitizeAiResponse(parsed);
}

/**
 * Executes a promise with an enforced timeout.
 */
function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUT_MS) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`CivicLens AI request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise
  ]);
}

/**
 * Analyzes a civic complaint using Google Gemini 3.8 Flash Vision.
 *
 * @param {Object} params
 * @param {Buffer|Uint8Array|string} [params.imageBuffer] - Optional image buffer or base64 string
 * @param {string} [params.mimeType='image/jpeg'] - MIME type of the uploaded image
 * @param {string} [params.title=''] - Complaint title
 * @param {string} [params.description=''] - Citizen's detailed description
 * @param {string} [params.locality=''] - Locality / neighborhood name
 * @param {string} [params.landmark=''] - Landmark near the issue
 * @param {number} [params.timeoutMs=15000] - Request timeout in milliseconds
 *
 * @returns {Promise<{
 *   issueType: string,
 *   severity: string,
 *   department: string,
 *   summary: string,
 *   riskReason: string,
 *   recommendedAction: string,
 *   confidence: string,
 *   needsHumanReview: boolean
 * }>}
 */
export async function analyzeIssue({
  imageBuffer,
  mimeType = 'image/jpeg',
  description = '',
  locality = '',
  title = '',
  landmark = '',
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  // If Gemini API key is missing or not configured, return safe heuristic fallback
  if (!isGeminiConfigured()) {
    console.warn('[CivicLens AI] GEMINI_API_KEY is not configured. Falling back to rule-based keyword classification.');
    return classifyByKeywords({ title, description, locality, landmark });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim() });
    const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

    const promptText = buildCivicAnalysisPrompt({ title, description, locality, landmark });
    const contents = [promptText];

    // If an image was provided, attach it as an inline part
    if (imageBuffer) {
      let base64Data = null;
      if (Buffer.isBuffer(imageBuffer)) {
        base64Data = imageBuffer.toString('base64');
      } else if (imageBuffer instanceof Uint8Array) {
        base64Data = Buffer.from(imageBuffer).toString('base64');
      } else if (typeof imageBuffer === 'string') {
        // Strip data URI prefix if present
        base64Data = imageBuffer.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
      }

      if (base64Data) {
        contents.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: base64Data
          }
        });
      }
    }

    const requestConfig = {
      systemInstruction: CIVIC_ANALYSIS_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
      responseSchema: CIVIC_ASSESSMENT_JSON_SCHEMA,
      temperature: 0.2
    };

    let response;
    try {
      const callPromise = ai.models.generateContent({
        model,
        contents,
        config: requestConfig
      });
      response = await withTimeout(callPromise, timeoutMs);
    } catch (primaryErr) {
      // If primary model (e.g. gemini-3.8-flash) encounters high-demand 503 or timeout, failover to gemini-2.5-flash
      if (model !== 'gemini-2.5-flash') {
        console.warn(`[CivicLens AI] Primary model ${model} unavailable or timed out (${primaryErr.message}). Failing over to gemini-2.5-flash...`);
        const failoverPromise = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: requestConfig
        });
        response = await withTimeout(failoverPromise, timeoutMs);
      } else {
        throw primaryErr;
      }
    }

    const parsedResult = parseGeminiJson(response.text);

    return parsedResult;
  } catch (err) {
    console.error(`[CivicLens AI] Gemini analysis failed: ${err.message}. Using safe heuristic fallback.`);
    return classifyByKeywords({ title, description, locality, landmark });
  }
}

export { classifyByKeywords as fallbackRuleBasedClassification };

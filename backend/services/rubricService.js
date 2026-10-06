const crypto = require('crypto');
const mongoose = require('mongoose');
const RubricTemplate = require('../models/RubricTemplate');

const STAGES = ['registration', 'mpr', 'midSem', 'finalReport'];
const STAGE_LABELS = {
  registration: 'Initial / Registration',
  mpr: 'MPR',
  midSem: 'Mid Semester',
  finalReport: 'Final Report'
};
const MAX_FIELDS_PER_STAGE = 30;

// Default rubric = the marks that were hardcoded before.
// Keys intentionally equal the old DB field names so legacy marks can be read through them.
const DEFAULT_STAGES = {
  registration: {
    enabled: true,
    fields: [
      { key: 'objectiveProblemIdentification', label: 'Objective / Problem Identification / Topic Selection', max: 5 },
      { key: 'proposedMethodology', label: 'Proposed Methodology / Technical Details & Timeline', max: 5 },
      { key: 'relevanceRealWorld', label: 'Relevance with Real World Problem', max: 5 },
      { key: 'synopsisPresentation', label: 'Synopsis / Presentation', max: 5 }
    ]
  },
  mpr: {
    enabled: true,
    fields: [{ key: 'mprMarks', label: 'Document Quality & Content', max: 10 }]
  },
  midSem: {
    enabled: true,
    fields: [
      { key: 'dailyDiary', label: 'Internship/Start-up Daily Diary', max: 10 },
      { key: 'expectedAchievedOutcomes', label: 'Expected/Achieved Outcomes & Social Relevance', max: 20 },
      { key: 'briefReport', label: 'Brief Internship/Start-up Report', max: 30 },
      { key: 'presentationViva', label: 'Presentation & Viva', max: 40 }
    ]
  },
  finalReport: {
    enabled: true,
    fields: [
      { key: 'dailyDiary', label: 'Internship/Start-up Daily Diary', max: 20 },
      { key: 'projectOutcomes', label: 'Internship/Start-up Outcomes', max: 30 },
      { key: 'objectiveLiteratureReview', label: 'Objective & Literature Review', max: 20 },
      { key: 'methodologyArea', label: 'Methodology/Area of Internship/Start-up', max: 20 },
      { key: 'workDescription', label: 'Hardware/Software/Work Description', max: 20 },
      { key: 'dataResultDiscussion', label: 'Data Collection/Result/Discussion/Conclusion', max: 20 },
      { key: 'overallFormatPlagiarism', label: 'Overall Format & Plagiarism', max: 20 },
      { key: 'defineObjective', label: 'Define Objective of the Work', max: 20 },
      { key: 'contentPresentation', label: 'Content of the Presentation', max: 20 },
      { key: 'presentationSkill', label: 'Presentation Skill', max: 20 },
      { key: 'socialIndustrialRelevance', label: 'Relevance to Social & Industrial Need', max: 20 },
      { key: 'questionAnswer', label: 'Question-Answer', max: 20 }
    ]
  }
};

const DEFAULT_KEYS = new Set();
STAGES.forEach((s) => DEFAULT_STAGES[s].fields.forEach((f) => DEFAULT_KEYS.add(f.key)));
const GENERATED_KEY = /^f_[0-9a-f]{8}$/;

const clone = (o) => JSON.parse(JSON.stringify(o));
const round2 = (n) => Math.round(n * 100) / 100;
const httpError = (message, status = 400) => Object.assign(new Error(message), { status });

const getDefaultStages = () => clone(DEFAULT_STAGES);

// registration | finalReport | mpr1..mpr3 | midSem1/2  ->  rubric stage
const stageForReview = (key) => {
  if (key === 'registration') return 'registration';
  if (key === 'finalReport') return 'finalReport';
  if (['mpr1', 'mpr2', 'mpr3'].includes(key)) return 'mpr';
  if (['midSem1', 'midSem2'].includes(key)) return 'midSem';
  return null;
};

// Rubric of a department (falls back to the default rubric when none is saved / no department)
const getDepartmentRubric = async (departmentId) => {
  const id = departmentId?._id || departmentId;
  if (id && mongoose.Types.ObjectId.isValid(String(id))) {
    const doc = await RubricTemplate.findOne({ department: id }).lean();
    if (doc) {
      const stages = {};
      STAGES.forEach((s) => {
        const saved = doc.stages?.[s];
        stages[s] = saved
          ? { enabled: saved.enabled !== false, fields: saved.fields || [] }
          : clone(DEFAULT_STAGES[s]);
      });
      return { department: id, version: doc.version, isDefault: false, updatedAt: doc.updatedAt, stages };
    }
  }
  return { department: id || null, version: 0, isDefault: true, stages: getDefaultStages() };
};

const getStageRubric = async (departmentId, stage) => {
  if (!STAGES.includes(stage)) throw httpError('Invalid review stage');
  const rubric = await getDepartmentRubric(departmentId);
  return {
    stage,
    version: rubric.version,
    enabled: rubric.stages[stage].enabled,
    fields: rubric.stages[stage].fields
  };
};

// Validates + normalises what the dept admin sends. Throws a 400 error on bad input.
const validateStages = (input) => {
  if (!input || typeof input !== 'object') throw httpError('Rubric stages are required');

  const out = {};
  for (const stage of STAGES) {
    const name = STAGE_LABELS[stage];
    const raw = input[stage];
    if (!raw || typeof raw !== 'object') throw httpError(`Missing rubric for ${name}`);

    const enabled = raw.enabled !== false;
    const rawFields = Array.isArray(raw.fields) ? raw.fields : [];

    if (rawFields.length > MAX_FIELDS_PER_STAGE) {
      throw httpError(`${name}: a maximum of ${MAX_FIELDS_PER_STAGE} fields is allowed`);
    }
    if (enabled && rawFields.length === 0) {
      throw httpError(`${name}: add at least one mark field or turn this stage off`);
    }

    const labels = new Set();
    const keys = new Set();
    const fields = [];

    for (const f of rawFields) {
      const label = String(f?.label ?? '').trim();
      if (!label) throw httpError(`${name}: every field needs a name`);
      if (label.length > 120) throw httpError(`${name}: field name "${label.slice(0, 20)}..." is too long (max 120)`);

      const lower = label.toLowerCase();
      if (labels.has(lower)) throw httpError(`${name}: duplicate field name "${label}"`);
      labels.add(lower);

      const max = Number(f?.max);
      if (!Number.isFinite(max) || max < 0.5 || max > 1000) {
        throw httpError(`${name}: max marks for "${label}" must be between 0.5 and 1000`);
      }

      // Keep an existing key only if it is one we generated / a legacy default key
      let key = typeof f?.key === 'string' && (GENERATED_KEY.test(f.key) || DEFAULT_KEYS.has(f.key)) ? f.key : null;
      if (!key || keys.has(key)) {
        do { key = `f_${crypto.randomBytes(4).toString('hex')}`; } while (keys.has(key));
      }
      keys.add(key);

      fields.push({ key, label, max: round2(max) });
    }

    out[stage] = { enabled, fields };
  }
  return out;
};

// Validates the mentor's scores against the stage rubric and returns the object stored on the review.
const buildResult = (stageRubric, input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw httpError('Marks are required');
  }

  const items = [];
  let total = 0;
  let maxTotal = 0;

  for (const f of stageRubric.fields) {
    const has = Object.prototype.hasOwnProperty.call(input, f.key);
    const raw = has ? input[f.key] : 0;
    const score = raw === '' || raw === null || raw === undefined ? 0 : Number(raw);

    if (!Number.isFinite(score) || score < 0 || score > f.max) {
      throw httpError(`"${f.label}" must be between 0 and ${f.max}`);
    }

    const s = round2(score);
    items.push({ key: f.key, label: f.label, max: f.max, score: s });
    total += s;
    maxTotal += f.max;
  }

  return {
    rubricVersion: stageRubric.version,
    items,
    total: round2(total),
    maxTotal: round2(maxTotal)
  };
};

// Normalised marks of one review. Works for new rubric results AND old fixed-field marks.
// Returns null when nothing has been graded.
const readResult = (review, stage) => {
  if (!review) return null;

  const r = review.rubricResult;
  if (r && Array.isArray(r.items) && r.items.length) {
    return {
      source: 'rubric',
      rubricVersion: r.rubricVersion || 0,
      items: r.items.map((i) => ({ key: i.key, label: i.label, max: i.max, score: i.score })),
      total: r.total || 0,
      maxTotal: r.maxTotal || 0
    };
  }

  const legacy = review.marks;
  if (legacy === undefined || legacy === null) return null;
  const fields = DEFAULT_STAGES[stage]?.fields || [];

  if (stage === 'mpr') {
    // old MPR marks were a plain number that defaults to 0 even when not reviewed
    if (review.status !== 'approved' || typeof legacy !== 'number') return null;
    const f = fields[0];
    return { source: 'legacy', rubricVersion: 0, items: [{ key: f.key, label: f.label, max: f.max, score: legacy }], total: legacy, maxTotal: f.max };
  }

  if (typeof legacy !== 'object') return null;
  const items = fields.map((f) => ({ key: f.key, label: f.label, max: f.max, score: Number(legacy[f.key]) || 0 }));
  return {
    source: 'legacy',
    rubricVersion: 0,
    items,
    total: round2(items.reduce((s, i) => s + i.score, 0)),
    maxTotal: items.reduce((s, i) => s + i.max, 0)
  };
};

module.exports = {
  STAGES,
  STAGE_LABELS,
  getDefaultStages,
  stageForReview,
  getDepartmentRubric,
  getStageRubric,
  validateStages,
  buildResult,
  readResult
};
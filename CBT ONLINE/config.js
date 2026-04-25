'use strict';

/* ══════════════════════════════════════════
   CONFIG — Edit this for each new exam
   ══════════════════════════════════════════ */
const CONFIG = {
  TEST_NAME:  'Subject Name – NORCET CBT',
  SUBJECT:    'Subject Name',
  BRAND:      'CBT | NORCETEDUTECH',
  LOGO_EMOJI: '🧠',
  SK:         'norcet_subject_v1',
  TG_CHANNEL: 'Norcetedutech',
  TG_DOUBTS:  'norcetedutechdoubts',
  TIME_PER_Q: 60,
  MARKING:    0.33,
  TOPICS: [
    'Topic 1', 'Topic 2', 'Topic 3', 'Topic 4', 'Topic 5',
    'Topic 6', 'Topic 7', 'Topic 8', 'Topic 9', 'Topic 10'
  ]
};
// Auto-detect subject from questions
function detectSubject() {
  if (!QUESTIONS || QUESTIONS.length === 0) return 'Nursing';
  
  // Get all unique topics from questions
  const allTopics = [...new Set(QUESTIONS.map(q => q.topic || 'General'))];
  console.log('📚 Topics found:', allTopics);
  
  // Convert to lowercase for matching
  const topicsStr = allTopics.join(' ').toLowerCase();
  
  // Smart detection based on keywords
  const subjectMap = [
    { keywords: ['meningitis', 'neurological', 'neuro', 'brain', 'nerve', 'cns'], subject: 'Neurological Nursing' },
    { keywords: ['cardiovascular', 'cardio', 'heart', 'blood pressure', 'hypertension'], subject: 'Cardiovascular Nursing' },
    { keywords: ['endocrinology', 'diabetes', 'insulin', 'thyroid', 'hormone'], subject: 'Endocrinology' },
    { keywords: ['pediatric', 'paediatric', 'child', 'children', 'infant'], subject: 'Pediatric Nursing' },
    { keywords: ['psychiatric', 'psychiatry', 'mental', 'psychology', 'depression'], subject: 'Psychiatric Nursing' },
    { keywords: ['community', 'public health', 'epidemiology', 'preventive'], subject: 'Community Health Nursing' },
    { keywords: ['obstetric', 'obstetrics', 'maternal', 'pregnancy', 'gynecology', 'obg'], subject: 'Obstetric & Gynecology' },
    { keywords: ['infection', 'microbiology', 'bacteria', 'virus', 'asepsis'], subject: 'Infection Control & Microbiology' },
    { keywords: ['pharmacology', 'drug', 'medication', 'dosage'], subject: 'Pharmacology' },
    { keywords: ['anatomy', 'physiology', 'organ', 'system'], subject: 'Anatomy & Physiology' },
    { keywords: ['nutrition', 'diet', 'food', 'vitamin'], subject: 'Nutrition' },
    { keywords: ['vital signs', 'vitals', 'temperature', 'pulse'], subject: 'Vital Signs & Assessment' },
    { keywords: ['emergency', 'trauma', 'critical care', 'icu'], subject: 'Emergency & Critical Care' },
  ];
  
  // Check each subject mapping
  for (let map of subjectMap) {
    for (let keyword of map.keywords) {
      if (topicsStr.includes(keyword)) {
        console.log('✅ Detected subject:', map.subject);
        return map.subject;
      }
    }
  }
  
  // Default: Use first topic as subject name
  const firstTopic = allTopics;
  console.log('📚 Using first topic as subject:', firstTopic);
  return firstTopic || 'Nursing';
}
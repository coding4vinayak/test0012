const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

// Personality archetypes
const ARCHETYPES = [
  { name: 'The Hot Take Artist', emoji: '🔥', description: 'Lives for controversy. Every tweet is a spicy opinion served fresh.' },
  { name: 'The Thread Lord', emoji: '🧵', description: 'Cannot express a thought in under 15 tweets. Masters of the numbered list.' },
  { name: 'The Lurker Who Snapped', emoji: '👻', description: 'Was silent for 3 years then suddenly became the main character.' },
  { name: 'The Reply Guy', emoji: '💬', description: 'Has an opinion about everything and will make sure you know it.' },
  { name: 'The Meme Archaeologist', emoji: '🏛️', description: 'Digs up formats from 2012 and somehow makes them work again.' },
  { name: 'The Quote Tweeter', emoji: '🔄', description: 'Never has an original thought but curates brilliantly.' },
  { name: 'The Ratio King', emoji: '👑', description: 'Gets ratioed on purpose because negative engagement is still engagement.' },
  { name: 'The Humble Bragger', emoji: '✨', description: 'Every "vulnerable" tweet is actually a flex in disguise.' },
  { name: 'The Doomscroller Prophet', emoji: '🌙', description: 'Tweets at 3am about the state of the world. Somehow always right.' },
  { name: 'The Chaos Agent', emoji: '🎪', description: 'Posts contradictory takes 12 hours apart. Thrives on confusion.' },
  { name: 'The Wholesome One', emoji: '🌻', description: 'Genuinely kind online. People wonder what they are hiding.' },
  { name: 'The Tech Bro Oracle', emoji: '🔮', description: 'Predicts the future of tech. Wrong 80% of the time but confident 100%.' }
];

// Personality traits pool
const TRAITS_POOL = [
  'Chronically Online', 'Main Character Energy', 'Unhinged Creativity',
  'Passive Aggressive', 'Suspiciously Wholesome', 'Chaotic Neutral',
  'Terminally Ironic', 'Aggressively Authentic', 'Peak Procrastinator',
  'Overthinks Everything', 'Self-Aware Disaster', 'Unbothered Legend',
  'Professional Yapper', 'Anxious Perfectionist', 'Delulu Visionary',
  'Emotional Support Poster', 'Unfiltered Truth Teller', 'Nostalgic Millennial',
  'Gen Z Translator', 'Corporate Speak Survivor', 'Hot Take Machine',
  'Validation Seeker', 'Accidental Philosopher', 'Sleep-Deprived Genius'
];

// Writing styles
const WRITING_STYLES = [
  'Tweets like they are composing their last words. Every. Single. Time. Dramatic pauses included.',
  'Types in all lowercase because capitalization is for people who care about grammar (and they do not).',
  'Excessive use of ellipses... as if every thought... trails off into the void... forever...',
  'Speaks exclusively in pop culture references and expects everyone to keep up.',
  'Uses big words incorrectly but with such confidence nobody questions it.',
  'Writes tweets that read like fortune cookies written by a slightly unhinged poet.',
  'Communicates primarily through ratio of emojis to actual words (3:1 minimum).',
  'Every tweet is a one-liner that belongs on a motivational poster or a wanted poster.',
  'Writes in stream of consciousness with zero punctuation just vibes and thoughts flowing endlessly',
  'Alternates between PhD-level analysis and "lmao" with no in-between.',
  'Types like they are being charged per character. Maximum impact, minimum letters.',
  'Uses parenthetical asides (constantly) as if their inner monologue (it is) is leaking out.'
];

// Interests pool
const INTERESTS_POOL = [
  'arguing with strangers', 'coffee discourse', 'hot takes about cereal',
  'parasocial relationships', 'doom scrolling at 2am', 'collecting screenshots',
  'ratio hunting', 'subtweeting', 'astrology (ironically)',
  'true crime podcasts', 'plant parenthood', 'cryptocurrency skepticism',
  'niche memes', 'indie music gatekeeping', 'vintage internet culture',
  'competitive overthinking', 'aesthetic mood boards', 'unsolicited advice',
  'conspiracy theories (light)', 'reality TV analysis', 'font opinions',
  'sourdough discourse', 'existential dread', 'cat content',
  'unpopular food opinions', 'startup culture critique', 'nostalgia posting',
  'hot girl walks', 'book recommendations nobody asked for', 'sunset photography'
];

// Vibe check one-liners
const VIBE_CHECKS = [
  'You tweet like someone who peaked in group chats and decided to take it public.',
  'Your timeline is giving "therapist said I need an outlet" energy.',
  'You are the friend everyone screenshots but never tags.',
  'Your tweets have the energy of someone typing with one hand while the other holds back tears of laughter.',
  'You give off "has 47 draft tweets" energy and honestly? Iconic.',
  'Your vibe is "somehow funny and concerning at the same time."',
  'You tweet like you have a personal vendetta against the algorithm.',
  'Your energy is "would start a cult but too lazy for the paperwork."',
  'You are the reason people say "I saw this tweet and immediately thought of you."',
  'Your timeline reads like a cry for help disguised as comedy. Respect.',
  'You give off "peaked at 280 characters" energy and never looked back.',
  'Your vibe is "emotionally unavailable but digitally omnipresent."'
];

// Generate a deterministic hash from a string
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Generate deterministic personality profile from handle
function generatePersonality(handle) {
  // Normalize handle (remove @ if present, lowercase)
  const normalizedHandle = handle.replace(/^@/, '').toLowerCase().trim();

  // Use handle characteristics as seed for deterministic generation
  const handleLength = normalizedHandle.length;
  const hasNumbers = /\d/.test(normalizedHandle);
  const hasUnderscores = /_/.test(normalizedHandle);
  const numericSum = normalizedHandle.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);

  const seed1 = hashString(normalizedHandle);
  const seed2 = hashString(normalizedHandle + 'traits');
  const seed3 = hashString(normalizedHandle + 'style');
  const seed4 = hashString(normalizedHandle + 'vibe');
  const seed5 = hashString(normalizedHandle + 'interests');

  // Select archetype deterministically
  const archetypeIndex = seed1 % ARCHETYPES.length;
  const archetype = ARCHETYPES[archetypeIndex];

  // Select 5 unique traits with percentages
  const traits = [];
  const usedTraitIndices = new Set();
  for (let i = 0; i < 5; i++) {
    let traitIdx = hashString(normalizedHandle + 'trait' + i) % TRAITS_POOL.length;
    while (usedTraitIndices.has(traitIdx)) {
      traitIdx = (traitIdx + 1) % TRAITS_POOL.length;
    }
    usedTraitIndices.add(traitIdx);
    // Generate percentage (50-99 range, decreasing for lower-ranked traits)
    const basePercent = 99 - (i * 10);
    const variance = hashString(normalizedHandle + 'pct' + i) % 8;
    const percentage = Math.max(50, Math.min(99, basePercent - variance));
    traits.push({ name: TRAITS_POOL[traitIdx], percentage });
  }

  // Select writing style
  const styleIndex = seed3 % WRITING_STYLES.length;
  const writingStyle = WRITING_STYLES[styleIndex];

  // Select vibe check
  const vibeIndex = seed4 % VIBE_CHECKS.length;
  const vibeSummary = VIBE_CHECKS[vibeIndex];

  // Select 6 unique interests
  const interests = [];
  const usedInterestIndices = new Set();
  for (let i = 0; i < 6; i++) {
    let intIdx = hashString(normalizedHandle + 'interest' + i) % INTERESTS_POOL.length;
    while (usedInterestIndices.has(intIdx)) {
      intIdx = (intIdx + 1) % INTERESTS_POOL.length;
    }
    usedInterestIndices.add(intIdx);
    interests.push(INTERESTS_POOL[intIdx]);
  }

  // Generate scores (1-100 range, deterministic)
  const humorScore = (hashString(normalizedHandle + 'humor') % 51) + 50; // 50-100
  const intelligenceScore = (hashString(normalizedHandle + 'intel') % 51) + 50; // 50-100
  const toxicityScore = (hashString(normalizedHandle + 'toxic') % 61) + 10; // 10-70

  // Adjust scores based on handle characteristics
  let adjustedHumor = humorScore;
  let adjustedIntelligence = intelligenceScore;
  let adjustedToxicity = toxicityScore;

  if (hasNumbers) adjustedToxicity = Math.min(100, adjustedToxicity + 5);
  if (hasUnderscores) adjustedIntelligence = Math.min(100, adjustedIntelligence + 3);
  if (handleLength > 12) adjustedHumor = Math.min(100, adjustedHumor + 4);

  return {
    handle: normalizedHandle,
    archetype,
    traits,
    writingStyle,
    vibeSummary,
    interests,
    scores: {
      humor: adjustedHumor,
      intelligence: adjustedIntelligence,
      toxicity: adjustedToxicity
    }
  };
}

function generateShareId() {
  return crypto.randomBytes(8).toString('hex');
}

// Generate personality analysis
router.post('/generate', (req, res) => {
  const { handle } = req.body;

  if (!handle || !handle.trim()) {
    return res.status(400).json({ error: 'Twitter handle is required' });
  }

  const cleanHandle = handle.trim().replace(/^@/, '');
  if (cleanHandle.length === 0) {
    return res.status(400).json({ error: 'Twitter handle is required' });
  }

  if (cleanHandle.length > 30) {
    return res.status(400).json({ error: 'Invalid Twitter handle' });
  }

  const personality = generatePersonality(cleanHandle);
  const shareId = generateShareId();
  const userId = req.session.user ? req.session.user.id : null;

  const stmt = db.prepare(
    'INSERT INTO analyses (user_id, twitter_handle, personality_type, traits, writing_style, vibe_summary, interests, toxicity_score, humor_score, intelligence_score, share_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(
    userId,
    personality.handle,
    personality.archetype.name,
    JSON.stringify(personality.traits),
    personality.writingStyle,
    personality.vibeSummary,
    JSON.stringify(personality.interests),
    personality.scores.toxicity,
    personality.scores.humor,
    personality.scores.intelligence,
    shareId
  );

  res.json({
    handle: personality.handle,
    archetype: personality.archetype,
    traits: personality.traits,
    writingStyle: personality.writingStyle,
    vibeSummary: personality.vibeSummary,
    interests: personality.interests,
    scores: personality.scores,
    shareId,
    shareUrl: `/analyze/${shareId}`
  });
});

// View shared personality card
router.get('/:shareId', (req, res) => {
  const { shareId } = req.params;

  const analysis = db.prepare('SELECT * FROM analyses WHERE share_id = ?').get(shareId);
  if (!analysis) {
    return res.status(404).render('index', { error: 'Analysis not found' });
  }

  res.render('share', {
    analysis: {
      ...analysis,
      traits: JSON.parse(analysis.traits),
      interests: JSON.parse(analysis.interests),
      archetype: ARCHETYPES.find(a => a.name === analysis.personality_type) || ARCHETYPES[0]
    }
  });
});

module.exports = router;

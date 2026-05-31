const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

const INDUSTRIES = [
  'AI', 'Blockchain', 'IoT', 'AR/VR', 'Fintech', 'Healthtech',
  'Edtech', 'Foodtech', 'Spacetech', 'Cleantech', 'Biotech', 'Quantum'
];

const VERTICALS = [
  'Pets', 'Grandmas', 'Plumbing', 'Dating', 'Fitness', 'Gardening',
  'Astrology', 'Toddlers', 'Dentists', 'Pigeons', 'Mattresses', 'Tacos'
];

const VIBES = ['serious', 'absurd', 'moonshot'];

const STARTUP_PREFIXES = [
  'Ultra', 'Hyper', 'Meta', 'Neo', 'Omni', 'Quantum', 'Super', 'Turbo',
  'Giga', 'Nano', 'Synth', 'Flux', 'Zen', 'Nova', 'Apex', 'Proto'
];

const STARTUP_SUFFIXES = [
  'ly', 'ify', 'Hub', 'Lab', 'AI', 'X', 'io', 'ware',
  'Base', 'Flow', 'Sync', 'Pulse', 'Shift', 'Stack', 'Mind', 'Verse'
];

const INVESTOR_NAMES = [
  'Sarah Chen, Partner at Velocity Capital',
  'Marcus Webb, GP at TechForward Fund',
  'Diana Patel, Angel Investor',
  'Jonathan Park, Managing Director at FutureSeed',
  'Lisa Zhang, Founding Partner at Moonshot Ventures',
  'David Okafor, Principal at Disruption Labs'
];

const ENTHUSIASTIC_QUOTES = [
  'This is exactly the kind of disruption the market needs. Take my money.',
  'I have never been so excited about a pitch since Uber for X was a thing.',
  'The TAM here is massive. This could be a category-defining company.',
  'The founding team has exactly the right mix of insanity and brilliance.',
  'If this does not become a unicorn in 3 years, I will eat my Patagonia vest.',
  'This is what happens when you combine vision with absolute recklessness. I love it.'
];

const SKEPTICAL_QUOTES = [
  'Interesting concept, but I need to see more traction before writing a check.',
  'The unit economics concern me, but I cannot stop thinking about it. That is either a good sign or a terrible one.',
  'I told them no three times. They kept coming back. That kind of persistence worries me.',
  'My analyst says the market does not exist yet. That is either genius or delusion.'
];

const SERIOUS_TITLES = [
  'Chief Executive Officer', 'Chief Technology Officer',
  'Chief Operating Officer', 'Chief Product Officer'
];

const ABSURD_TITLES = [
  'Chief Vibes Officer', 'Head of Existential Product Questions',
  'VP of Looking Busy in Meetings', 'Director of Controlled Chaos',
  'Chief Hype Architect', 'Senior VP of Snack Procurement',
  'Head of Unsolicited Advice', 'Chief Overthinking Officer'
];

const MOONSHOT_TITLES = [
  'Chief Moonshot Architect', 'VP of Interplanetary Growth',
  'Head of Impossible Problems', 'Director of Future Realities',
  'Chief Quantum Strategy Officer', 'VP of Paradigm Demolition',
  'Head of Zero-to-One Thinking', 'Chief Singularity Prep Officer'
];

function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateStartupIdea(industry, vibe) {
  const validVibe = VIBES.includes(vibe) ? vibe : 'absurd';
  const validIndustry = industry || INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];

  const seed = hashSeed(validIndustry + validVibe + validIndustry.length);

  // Pick a vertical to combine with industry
  const verticalIndex = seed % VERTICALS.length;
  const vertical = VERTICALS[verticalIndex];

  // Generate startup name
  const prefixIndex = seed % STARTUP_PREFIXES.length;
  const suffixIndex = (seed * 3 + 7) % STARTUP_SUFFIXES.length;
  const startupName = STARTUP_PREFIXES[prefixIndex] + STARTUP_SUFFIXES[suffixIndex];

  // Generate tagline based on vibe
  const taglines = {
    serious: `Enterprise-grade ${validIndustry} solutions for the ${vertical} industry.`,
    absurd: `What if ${validIndustry} and ${vertical} had a baby? We are that baby.`,
    moonshot: `Reimagining the entire ${vertical} sector through ${validIndustry} from first principles.`
  };
  const tagline = taglines[validVibe];

  // Generate elevator pitch
  const pitches = {
    serious: `${startupName} is building the next-generation ${validIndustry} platform specifically designed for the ${vertical} vertical. Our proprietary technology stack enables unprecedented efficiency gains, reducing operational costs by up to 73% while increasing customer satisfaction scores.\n\nWith a growing team of industry veterans and a clear path to profitability, we are positioned to capture significant market share in the rapidly expanding ${validIndustry}-${vertical} intersection. Our early customers report transformative results within the first 90 days of deployment.`,
    absurd: `You know what nobody asked for? ${validIndustry} for ${vertical}. And that is exactly why ${startupName} exists. We saw a gap in the market that was actually just common sense telling us to stop, and we said "absolutely not."\n\nOur platform uses cutting-edge ${validIndustry} technology to solve problems that ${vertical} never knew they had. Critics say the market does not exist. We say the market has not been invented yet. That is not the same thing. Probably.`,
    moonshot: `${startupName} is not just building a product. We are building the future of ${vertical} through breakthrough ${validIndustry} applications that most VCs are too timid to fund. Our 10-year roadmap includes full autonomy, global scale, and fundamentally redefining what it means to exist in the ${vertical} space.\n\nWe operate at the intersection of theoretical possibility and practical insanity. Our research team has published 12 papers that nobody fully understands, and our prototype has achieved results that our own scientists call "statistically suspicious but emotionally compelling."`
  };
  const description = pitches[validVibe];

  // Generate valuation
  const baseVal = ((seed % 90) + 10);
  const valuationMultipliers = { serious: 1, absurd: 5, moonshot: 20 };
  const valNum = baseVal * valuationMultipliers[validVibe];
  const valuation = valNum >= 1000 ? `$${(valNum / 1000).toFixed(1)}B` : `$${valNum}M`;

  // Generate investor feedback (3 quotes: 2 enthusiastic, 1 skeptical)
  const inv1Index = seed % INVESTOR_NAMES.length;
  const inv2Index = (seed + 2) % INVESTOR_NAMES.length;
  const inv3Index = (seed + 4) % INVESTOR_NAMES.length;
  const eq1Index = seed % ENTHUSIASTIC_QUOTES.length;
  const eq2Index = (seed + 1) % ENTHUSIASTIC_QUOTES.length;
  const sq1Index = seed % SKEPTICAL_QUOTES.length;

  const investorFeedback = [
    { name: INVESTOR_NAMES[inv1Index], quote: ENTHUSIASTIC_QUOTES[eq1Index], sentiment: 'positive' },
    { name: INVESTOR_NAMES[inv2Index], quote: ENTHUSIASTIC_QUOTES[eq2Index], sentiment: 'positive' },
    { name: INVESTOR_NAMES[inv3Index], quote: SKEPTICAL_QUOTES[sq1Index], sentiment: 'skeptical' }
  ];

  // Generate team roles based on vibe
  const titleSets = { serious: SERIOUS_TITLES, absurd: ABSURD_TITLES, moonshot: MOONSHOT_TITLES };
  const titles = titleSets[validVibe];
  const teamRoles = [
    { title: titles[seed % titles.length], name: 'Alex Rivera' },
    { title: titles[(seed + 1) % titles.length], name: 'Jordan Kim' },
    { title: titles[(seed + 2) % titles.length], name: 'Sam Okonkwo' },
    { title: titles[(seed + 3) % titles.length], name: 'Casey Chen' }
  ];

  // Generate market size
  const marketBase = ((seed % 50) + 5);
  const marketMultipliers = { serious: 2, absurd: 10, moonshot: 50 };
  const marketVal = marketBase * marketMultipliers[validVibe];
  const marketSize = marketVal >= 1000 ? `$${(marketVal / 1000).toFixed(1)}T` : `$${marketVal}B`;

  // Generate scores
  const absurdityScores = { serious: Math.max(1, (seed % 3) + 2), absurd: Math.max(5, (seed % 4) + 7), moonshot: Math.max(4, (seed % 4) + 5) };
  const viabilityScores = { serious: Math.max(5, (seed % 4) + 6), absurd: Math.max(1, (seed % 4) + 2), moonshot: Math.max(3, (seed % 4) + 4) };
  const absurdityScore = absurdityScores[validVibe];
  const viabilityScore = viabilityScores[validVibe];

  return {
    industry: validIndustry,
    vibe: validVibe,
    startupName,
    tagline,
    description,
    valuation,
    investorFeedback: JSON.stringify(investorFeedback),
    teamRoles: JSON.stringify(teamRoles),
    marketSize,
    absurdityScore,
    viabilityScore
  };
}

function generateShareId() {
  return crypto.randomBytes(8).toString('hex');
}

// Generate startup idea endpoint
router.post('/generate', (req, res) => {
  const { industry, vibe } = req.body;

  if (!vibe) {
    return res.status(400).json({ error: 'Vibe is required. Choose: serious, absurd, or moonshot' });
  }

  if (!VIBES.includes(vibe)) {
    return res.status(400).json({ error: 'Invalid vibe. Must be one of: ' + VIBES.join(', ') });
  }

  const result = generateStartupIdea(industry, vibe);
  const shareId = generateShareId();
  const userId = req.session.user ? req.session.user.id : null;

  const stmt = db.prepare(
    'INSERT INTO ideas (user_id, industry, vibe, startup_name, tagline, description, valuation, investor_feedback, team_roles, market_size, absurdity_score, viability_score, share_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const dbResult = stmt.run(
    userId, result.industry, result.vibe, result.startupName, result.tagline,
    result.description, result.valuation, result.investorFeedback, result.teamRoles,
    result.marketSize, result.absurdityScore, result.viabilityScore, shareId
  );

  res.json({
    id: dbResult.lastInsertRowid,
    industry: result.industry,
    vibe: result.vibe,
    startupName: result.startupName,
    tagline: result.tagline,
    description: result.description,
    valuation: result.valuation,
    investorFeedback: JSON.parse(result.investorFeedback),
    teamRoles: JSON.parse(result.teamRoles),
    marketSize: result.marketSize,
    absurdityScore: result.absurdityScore,
    viabilityScore: result.viabilityScore,
    shareId,
    shareUrl: `/idea/${shareId}`
  });
});

// View shared idea
router.get('/:shareId', (req, res) => {
  const { shareId } = req.params;

  const idea = db.prepare('SELECT * FROM ideas WHERE share_id = ?').get(shareId);
  if (!idea) {
    return res.status(404).render('index', { error: 'Startup idea not found' });
  }

  res.render('share', {
    idea: {
      ...idea,
      investorFeedback: JSON.parse(idea.investor_feedback),
      teamRoles: JSON.parse(idea.team_roles)
    }
  });
});

module.exports = router;

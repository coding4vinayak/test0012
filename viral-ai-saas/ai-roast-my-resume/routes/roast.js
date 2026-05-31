const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

// Common resume buzzwords to detect
const BUZZWORDS = [
  'synergy', 'leverage', 'passionate', 'dynamic', 'innovative',
  'thought leader', 'results-driven', 'team player', 'go-getter',
  'self-starter', 'detail-oriented', 'proactive', 'strategic',
  'stakeholder', 'paradigm', 'disrupt', 'ecosystem', 'scalable',
  'rock star', 'ninja', 'guru', 'wizard', 'unicorn',
  'bleeding edge', 'cutting edge', 'world-class', 'best-in-class',
  'game-changer', 'deep dive', 'circle back', 'move the needle',
  'low-hanging fruit', 'bandwidth', 'synergize', 'ideate',
  'value-add', 'core competency', 'fast-paced', 'hard-working',
  'motivated', 'excellent communication skills', 'responsible for'
];

// Action verbs that are good
const ACTION_VERBS = [
  'achieved', 'built', 'created', 'delivered', 'engineered',
  'generated', 'improved', 'increased', 'launched', 'led',
  'managed', 'optimized', 'reduced', 'saved', 'transformed',
  'developed', 'designed', 'implemented', 'established', 'grew'
];

function analyzeResume(resumeText) {
  const text = resumeText.toLowerCase();
  const words = text.split(/\s+/);
  const wordCount = words.length;
  const sentences = resumeText.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Detect buzzwords
  const foundBuzzwords = BUZZWORDS.filter(bw => text.includes(bw));
  const buzzwordDensity = foundBuzzwords.length;

  // Detect action verbs
  const foundActionVerbs = ACTION_VERBS.filter(av => text.includes(av));

  // Detect quantification (numbers, percentages, dollar amounts)
  const quantifiers = resumeText.match(/\d+%|\$[\d,]+|\d+\+?/g) || [];
  const hasQuantification = quantifiers.length > 0;

  // Detect sections
  const hasSummary = /summary|objective|profile|about/i.test(resumeText);
  const hasExperience = /experience|employment|work history/i.test(resumeText);
  const hasSkills = /skills|technologies|competencies/i.test(resumeText);
  const hasEducation = /education|degree|university|college/i.test(resumeText);

  return {
    wordCount,
    sentenceCount: sentences.length,
    foundBuzzwords,
    buzzwordDensity,
    foundActionVerbs,
    quantifiers,
    hasQuantification,
    hasSummary,
    hasExperience,
    hasSkills,
    hasEducation
  };
}

function generateRoast(resumeText) {
  const analysis = analyzeResume(resumeText);
  const { wordCount, foundBuzzwords, buzzwordDensity, foundActionVerbs, quantifiers, hasQuantification } = analysis;

  // Generate scores based on analysis (1-10 scale)
  // Impact score: based on action verbs and quantification
  const impactBase = Math.min(foundActionVerbs.length * 1.5, 6) + (quantifiers.length > 3 ? 3 : quantifiers.length);
  const impactScore = Math.max(1, Math.min(10, Math.round(impactBase)));

  // Clarity score: based on word count and sentence structure
  const idealWordCount = wordCount >= 200 && wordCount <= 800;
  const clarityBase = idealWordCount ? 7 : (wordCount < 100 ? 3 : wordCount > 1500 ? 4 : 5);
  const clarityBonus = foundActionVerbs.length > 3 ? 2 : 0;
  const clarityScore = Math.max(1, Math.min(10, clarityBase + clarityBonus));

  // Buzzword score: lower is worse (more buzzwords = lower score)
  const buzzwordPenalty = Math.min(buzzwordDensity * 1.5, 8);
  const buzzwordScore = Math.max(1, Math.min(10, 10 - Math.round(buzzwordPenalty)));

  // Cringe score: higher = more cringe (inverted for display)
  const cringeFactors = buzzwordDensity + (wordCount > 1200 ? 2 : 0) + (!hasQuantification ? 2 : 0);
  const cringeScore = Math.max(1, Math.min(10, Math.round(cringeFactors * 1.2) + 1));

  // Overall score
  const overallScore = Math.max(1, Math.min(10, Math.round((impactScore + clarityScore + buzzwordScore + (10 - cringeScore)) / 4)));

  // Generate section roasts
  const firstImpressions = [
    "This resume looks like it was written by someone who thinks 'synergy' is a personality trait.",
    "I have seen more substance in a fortune cookie than in this resume.",
    "This reads like a LinkedIn post that gained sentience and cried for help.",
    "Somewhere, a recruiter just fell asleep reading the first line of this.",
    "This resume has the energy of someone who peaked during a group project in college.",
    "If mediocrity had a resume, it would look suspiciously like this one."
  ];

  const buzzwordRoasts = buzzwordDensity > 5
    ? `Your resume is a buzzword salad. I found ${foundBuzzwords.length} buzzwords including: ${foundBuzzwords.slice(0, 5).join(', ')}. At this point, you might as well just submit a word cloud and call it a day.`
    : buzzwordDensity > 2
    ? `You have ${foundBuzzwords.length} buzzwords lurking in here (${foundBuzzwords.join(', ')}). Not the worst offender, but you are still playing Corporate Bingo.`
    : buzzwordDensity > 0
    ? `Only ${foundBuzzwords.length} buzzword(s) detected (${foundBuzzwords.join(', ')}). You are showing restraint, but "passionate" is still doing a lot of heavy lifting.`
    : "Surprisingly buzzword-free. Either you are a unicorn or you just replaced them all with equally empty phrases. I will give you the benefit of the doubt.";

  const impactRoasts = hasQuantification
    ? `You have ${quantifiers.length} quantified achievement(s). That is ${quantifiers.length > 5 ? 'actually impressive' : 'a start'}. Numbers do not lie, but they can definitely be stretched - and I suspect some of yours are doing yoga.`
    : "Zero numbers. Zero percentages. Zero proof you did anything. Your resume currently reads like 'I existed at a company for some amount of time.' Recruiters want receipts, not vibes.";

  const cringeRoasts = cringeScore > 7
    ? "The cringe is strong with this one. Reading this made me physically uncomfortable, like watching someone call their boss 'bestie' in a meeting."
    : cringeScore > 4
    ? "Moderate cringe detected. It is not embarrassing enough to screenshot and share, but it is close. Your professional brand is giving 'trying too hard at a networking event.'"
    : "Low cringe factor. You managed to write about yourself without making readers want to look away. That is rarer than you think.";

  const verdicts = [
    `Overall verdict: This resume scores a ${overallScore}/10. It is the equivalent of showing up to a job interview in cargo shorts - technically you are there, but nobody is impressed.`,
    `Final score: ${overallScore}/10. Your resume is like a participation trophy - it exists, it acknowledges your presence, but it won't win you anything.`,
    `The verdict is in: ${overallScore}/10. This resume is the lukewarm coffee of career documents - not terrible enough to throw away, but nobody is excited about it.`,
    `Rating: ${overallScore}/10. Your resume has the memorability of elevator music. It fills space without leaving any lasting impression.`
  ];

  const seed = wordCount + resumeText.charCodeAt(0);
  const firstImpression = firstImpressions[seed % firstImpressions.length];
  const verdict = verdicts[seed % verdicts.length];

  // Generate recommendations
  const recommendations = [];
  if (!hasQuantification) {
    recommendations.push("Add numbers and metrics to your achievements. 'Increased sales' means nothing. 'Increased sales by 47% in Q3' makes recruiters pay attention.");
  }
  if (buzzwordDensity > 3) {
    recommendations.push("Purge the buzzwords. Replace every 'synergy' and 'leverage' with specific examples of what you actually did. Show, don't tell.");
  }
  if (foundActionVerbs.length < 3) {
    recommendations.push("Start your bullet points with strong action verbs (built, launched, grew, reduced). Passive voice is for academic papers, not resumes.");
  }
  if (wordCount < 150) {
    recommendations.push("Your resume is too thin. Add more detail about your accomplishments and the impact you made. Right now it reads like a tweet thread, not a career summary.");
  }
  if (wordCount > 1000) {
    recommendations.push("Trim the fat. Your resume should be a highlight reel, not your autobiography. Keep it to 1-2 pages max and cut anything that does not directly prove your value.");
  }
  if (!analysis.hasSummary) {
    recommendations.push("Add a professional summary at the top. Give recruiters a 2-3 sentence reason to keep reading instead of making them hunt for it.");
  }

  // Ensure at least 3 recommendations
  const defaultRecs = [
    "Tailor your resume to each job application. Generic resumes get generic responses (which is none).",
    "Use the STAR method (Situation, Task, Action, Result) for your bullet points. It turns 'responsible for' into 'delivered results by.'",
    "Get a real human to read this before sending it out. Fresh eyes catch what yours have become blind to."
  ];
  while (recommendations.length < 3) {
    recommendations.push(defaultRecs[recommendations.length]);
  }

  const roastData = {
    firstImpression,
    sections: {
      experience: {
        title: "Experience Section",
        roast: foundActionVerbs.length > 3
          ? "Your experience section actually has some teeth. I can see action verbs doing work here. But are you showing impact or just listing tasks? There is a difference between 'managed a team' and 'led a team of 12 to deliver a $2M project ahead of schedule.'"
          : "Your experience section reads like a job description, not a achievement log. You have listed what you were supposed to do, not what you actually accomplished. Copying and pasting from the job posting is not a flex."
      },
      skills: {
        title: "Skills Section",
        roast: analysis.hasSkills
          ? "You have a skills section. Good. But listing 'Microsoft Word' in 2024 is like bragging that you can use a doorknob. Focus on skills that actually differentiate you from the other 500 applicants."
          : "No dedicated skills section? Bold move. Either you are relying on your experience to speak for itself (risky) or you forgot that ATS systems are keyword-matching robots that need to be fed."
      },
      education: {
        title: "Education Section",
        roast: analysis.hasEducation
          ? "Education section is present. Unless you graduated last year, nobody cares about your GPA or that one time you made the Dean's list. Focus on relevant coursework or projects if you must include it."
          : "No education section found. Either you are a self-taught genius or you are hoping nobody notices. Both are valid strategies, honestly."
      },
      summary: {
        title: "Summary/Objective",
        roast: analysis.hasSummary
          ? "You have a summary section. Let me guess - it says you are a 'motivated professional seeking a challenging role.' Groundbreaking. Make it specific, make it punchy, or delete it entirely."
          : "No summary or objective statement. You are making recruiters work to figure out what you want. In a world where they spend 7 seconds per resume, that is a bold gamble."
      }
    },
    buzzwordBingo: buzzwordRoasts,
    impactCheck: impactRoasts,
    cringeMeter: cringeRoasts,
    verdict
  };

  return {
    impactScore,
    clarityScore,
    buzzwordScore,
    cringeScore,
    overallScore,
    roastText: JSON.stringify(roastData),
    recommendations: JSON.stringify(recommendations.slice(0, 5))
  };
}

function generateShareId() {
  return crypto.randomBytes(8).toString('hex');
}

function getLetterGrade(score) {
  if (score >= 9) return 'A+';
  if (score >= 8) return 'A';
  if (score >= 7) return 'B+';
  if (score >= 6) return 'B';
  if (score >= 5) return 'C+';
  if (score >= 4) return 'C';
  if (score >= 3) return 'D';
  return 'F';
}

// Generate roast endpoint
router.post('/generate', (req, res) => {
  const { resumeText } = req.body;

  if (!resumeText || !resumeText.trim()) {
    return res.status(400).json({ error: 'Resume text is required' });
  }

  const trimmedText = resumeText.trim();

  if (trimmedText.length < 50) {
    return res.status(400).json({ error: 'Resume text is too short. Please paste your full resume for a proper roast.' });
  }

  const roast = generateRoast(trimmedText);
  const shareId = generateShareId();
  const userId = req.session.user ? req.session.user.id : null;

  const stmt = db.prepare(
    'INSERT INTO roasts (user_id, resume_text, overall_score, impact_score, clarity_score, buzzword_score, cringe_score, roast_text, recommendations, share_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    userId, trimmedText, roast.overallScore, roast.impactScore,
    roast.clarityScore, roast.buzzwordScore, roast.cringeScore,
    roast.roastText, roast.recommendations, shareId
  );

  res.json({
    id: result.lastInsertRowid,
    impactScore: roast.impactScore,
    clarityScore: roast.clarityScore,
    buzzwordScore: roast.buzzwordScore,
    cringeScore: roast.cringeScore,
    overallScore: roast.overallScore,
    letterGrade: getLetterGrade(roast.overallScore),
    roast: JSON.parse(roast.roastText),
    recommendations: JSON.parse(roast.recommendations),
    shareId: shareId,
    shareUrl: `/roast/${shareId}`
  });
});

// View shared roast
router.get('/:shareId', (req, res) => {
  const { shareId } = req.params;

  const roast = db.prepare('SELECT * FROM roasts WHERE share_id = ?').get(shareId);
  if (!roast) {
    return res.status(404).render('index', { error: 'Roast not found' });
  }

  const roastData = JSON.parse(roast.roast_text);
  const recommendations = JSON.parse(roast.recommendations);
  res.render('share', {
    roast: {
      ...roast,
      data: roastData,
      recommendations,
      letterGrade: getLetterGrade(roast.overall_score)
    }
  });
});

module.exports = router;

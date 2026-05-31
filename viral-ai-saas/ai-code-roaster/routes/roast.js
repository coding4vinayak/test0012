const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

// Analyze basic code characteristics
function analyzeCode(code, language) {
  const lines = code.split('\n');
  const totalLines = lines.length;
  const nonEmptyLines = lines.filter(l => l.trim().length > 0).length;

  // Count nesting depth via braces
  let maxDepth = 0;
  let currentDepth = 0;
  for (const char of code) {
    if (char === '{' || char === '(' || char === '[') {
      currentDepth++;
      if (currentDepth > maxDepth) maxDepth = currentDepth;
    } else if (char === '}' || char === ')' || char === ']') {
      currentDepth = Math.max(0, currentDepth - 1);
    }
  }

  // Count comments
  const singleLineComments = (code.match(/\/\/.*/g) || []).length;
  const multiLineComments = (code.match(/\/\*[\s\S]*?\*\//g) || []).length;
  const hashComments = (code.match(/#.*/g) || []).length;
  const totalComments = singleLineComments + multiLineComments + hashComments;
  const commentRatio = nonEmptyLines > 0 ? totalComments / nonEmptyLines : 0;

  // Analyze variable naming
  const camelCase = (code.match(/[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*/g) || []).length;
  const snakeCase = (code.match(/[a-z]+_[a-z]+/g) || []).length;
  const singleLetterVars = (code.match(/\b[a-z]\b/g) || []).length;
  const longNames = (code.match(/[a-zA-Z_]{20,}/g) || []).length;

  // Line length analysis
  const longLines = lines.filter(l => l.length > 80).length;
  const veryLongLines = lines.filter(l => l.length > 120).length;

  return {
    totalLines,
    nonEmptyLines,
    maxDepth,
    commentRatio,
    totalComments,
    camelCase,
    snakeCase,
    singleLetterVars,
    longNames,
    longLines,
    veryLongLines
  };
}

// Convert numeric score (1-10) to letter grade
function scoreToGrade(score) {
  if (score >= 9) return 'A';
  if (score >= 7) return 'B';
  if (score >= 5) return 'C';
  if (score >= 3) return 'D';
  return 'F';
}

// Generate mock AI code roast
function generateCodeRoast(code, language) {
  const analysis = analyzeCode(code, language);

  // Calculate scores based on analysis
  let readabilityScore = 5;
  let efficiencyScore = 5;
  let styleScore = 5;

  // Readability scoring
  if (analysis.commentRatio > 0.2) readabilityScore += 2;
  else if (analysis.commentRatio < 0.05) readabilityScore -= 2;
  if (analysis.maxDepth > 5) readabilityScore -= 2;
  if (analysis.maxDepth <= 3) readabilityScore += 1;
  if (analysis.longLines > analysis.totalLines * 0.3) readabilityScore -= 1;
  if (analysis.singleLetterVars > 5) readabilityScore -= 2;

  // Efficiency scoring
  if (analysis.maxDepth > 6) efficiencyScore -= 2;
  if (analysis.totalLines > 100) efficiencyScore -= 1;
  if (analysis.totalLines < 20) efficiencyScore += 1;
  if (analysis.nonEmptyLines > 0 && analysis.totalLines / analysis.nonEmptyLines > 1.5) efficiencyScore -= 1;
  const seed = code.length % 7;
  efficiencyScore += (seed % 3) - 1;

  // Style scoring
  if (analysis.camelCase > 0 && analysis.snakeCase > 0) styleScore -= 2;
  if (analysis.longNames > 3) styleScore -= 1;
  if (analysis.veryLongLines > 3) styleScore -= 2;
  if (analysis.singleLetterVars > 3) styleScore -= 2;
  styleScore += (code.length % 5) - 2;

  // Clamp scores to 1-10
  readabilityScore = Math.max(1, Math.min(10, readabilityScore));
  efficiencyScore = Math.max(1, Math.min(10, efficiencyScore));
  styleScore = Math.max(1, Math.min(10, styleScore));
  const overallScore = Math.max(1, Math.min(10, Math.round((readabilityScore + efficiencyScore + styleScore) / 3)));

  // Generate roast content based on analysis
  const variableNamingRoasts = [
    {
      comment: `Your variable names read like a cat walked across the keyboard. I count ${analysis.singleLetterVars} single-letter variables - are you writing code or solving a crossword puzzle?`,
      grade: analysis.singleLetterVars > 5 ? 'F' : analysis.singleLetterVars > 2 ? 'D' : 'B'
    },
    {
      comment: `Mixing camelCase and snake_case like a confused bilingual programmer. Pick a lane! You have ${analysis.camelCase} camelCase and ${analysis.snakeCase} snake_case identifiers fighting for dominance.`,
      grade: (analysis.camelCase > 0 && analysis.snakeCase > 0) ? 'D' : 'B'
    },
    {
      comment: `I see you subscribe to the "future me will remember what x means" school of naming. Spoiler: future you will NOT remember, and neither will anyone on your team.`,
      grade: analysis.singleLetterVars > 3 ? 'F' : 'C'
    },
    {
      comment: `Your variable names are so long they need their own scroll bar. ${analysis.longNames} identifiers exceed 20 characters - are you writing code or a novel?`,
      grade: analysis.longNames > 3 ? 'D' : 'B'
    }
  ];

  const architectureRoasts = [
    {
      comment: `Your nesting goes ${analysis.maxDepth} levels deep. That is not code architecture, that is an archaeological dig site. Every indentation level is another layer of tech debt.`,
      grade: analysis.maxDepth > 5 ? 'F' : analysis.maxDepth > 3 ? 'C' : 'A'
    },
    {
      comment: `${analysis.totalLines} lines in a single snippet? This function is doing more jobs than a Swiss Army knife at a camping trip. Ever heard of the Single Responsibility Principle?`,
      grade: analysis.totalLines > 80 ? 'F' : analysis.totalLines > 40 ? 'C' : 'B'
    },
    {
      comment: `The cyclomatic complexity of this code suggests you enjoy pain. Each nested bracket is another prayer that the logic works. It is callback hell without the callbacks.`,
      grade: analysis.maxDepth > 4 ? 'D' : 'B'
    },
    {
      comment: `This code has more layers than an onion, and reading it makes me cry just as much. Refactoring this would require a PhD and a support group.`,
      grade: analysis.maxDepth > 5 ? 'F' : 'C'
    }
  ];

  const commentRoasts = [
    {
      comment: `${analysis.totalComments} comments in ${analysis.nonEmptyLines} lines of code. Your comment-to-code ratio of ${(analysis.commentRatio * 100).toFixed(1)}% suggests you either trust nobody (including yourself) or you trust EVERYONE to read your mind.`,
      grade: analysis.commentRatio > 0.3 ? 'C' : analysis.commentRatio < 0.05 ? 'F' : 'B'
    },
    {
      comment: analysis.totalComments === 0
        ? `Zero comments. ZERO. You write code like you are keeping secrets from the FBI. Your coworkers must love reverse-engineering your thought process from scratch every sprint.`
        : `I see you left some comments - how generous of you. Too bad they are about as helpful as a "Caution: Hot" label on the sun.`,
      grade: analysis.totalComments === 0 ? 'F' : 'C'
    },
    {
      comment: `Your commenting strategy appears to be "the code is self-documenting." Spoiler: it is not. It is self-obfuscating at best.`,
      grade: analysis.commentRatio < 0.1 ? 'D' : 'B'
    },
    {
      comment: `Comments are like deodorant - if you need them, you probably already have a problem. But ${analysis.totalComments === 0 ? 'having none' : 'your attempt'} is not the flex you think it is.`,
      grade: analysis.totalComments === 0 ? 'F' : analysis.commentRatio > 0.25 ? 'C' : 'B'
    }
  ];

  const verdicts = [
    `Overall, this ${language} code is what happens when Stack Overflow answers get copy-pasted without understanding. Your score of ${overallScore}/10 means there is room for improvement - specifically, all of the room.`,
    `In conclusion, this code works the same way a house of cards works - technically standing, but one wrong move and everything collapses. Grade: ${scoreToGrade(overallScore)}. May your debugger have mercy on your soul.`,
    `Final verdict: this code has the structural integrity of wet cardboard. It probably runs, in the same way that a car with three wheels technically moves. Score: ${overallScore}/10.`,
    `To summarize: I have seen better ${language} code written by someone who just discovered what ${language} is five minutes ago. Your overall ${scoreToGrade(overallScore)} grade is generous - I am feeling charitable today.`
  ];

  const idx = code.length % 4;
  const variableNaming = variableNamingRoasts[(code.length + analysis.singleLetterVars) % variableNamingRoasts.length];
  const architecture = architectureRoasts[(code.length + analysis.maxDepth) % architectureRoasts.length];
  const comments = commentRoasts[(code.length + analysis.totalComments) % commentRoasts.length];
  const verdict = verdicts[idx];

  const roastData = {
    variableNaming: {
      grade: variableNaming.grade,
      comment: variableNaming.comment
    },
    architecture: {
      grade: architecture.grade,
      comment: architecture.comment
    },
    comments: {
      grade: comments.grade,
      comment: comments.comment
    },
    verdict: verdict,
    scores: {
      readability: readabilityScore,
      efficiency: efficiencyScore,
      style: styleScore,
      overall: overallScore
    },
    grades: {
      readability: scoreToGrade(readabilityScore),
      efficiency: scoreToGrade(efficiencyScore),
      style: scoreToGrade(styleScore),
      overall: scoreToGrade(overallScore)
    }
  };

  return {
    readabilityScore,
    efficiencyScore,
    styleScore,
    overallScore,
    roastText: JSON.stringify(roastData)
  };
}

function generateShareId() {
  return crypto.randomBytes(8).toString('hex');
}

// Generate roast endpoint
router.post('/generate', (req, res) => {
  const { code, language } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ error: 'Code snippet is required' });
  }

  const lang = language || 'javascript';

  const roast = generateCodeRoast(code, lang);
  const shareId = generateShareId();
  const userId = req.session.user ? req.session.user.id : null;

  const stmt = db.prepare(
    'INSERT INTO roasts (user_id, code_snippet, language, readability_score, efficiency_score, style_score, overall_score, roast_text, share_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(userId, code, lang, roast.readabilityScore, roast.efficiencyScore, roast.styleScore, roast.overallScore, roast.roastText, shareId);

  const roastData = JSON.parse(roast.roastText);

  res.json({
    id: result.lastInsertRowid,
    language: lang,
    readabilityScore: roast.readabilityScore,
    efficiencyScore: roast.efficiencyScore,
    styleScore: roast.styleScore,
    overallScore: roast.overallScore,
    roast: roastData,
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
  res.render('share', {
    roast: {
      ...roast,
      data: roastData
    }
  });
});

module.exports = router;

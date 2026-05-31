const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

// Mock AI roast generator
function generateRoast(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    parsedUrl = new URL('http://' + url);
  }

  const domain = parsedUrl.hostname.replace('www.', '');
  const tld = domain.split('.').pop();
  const name = domain.split('.')[0];

  // Generate varied scores based on URL characteristics
  const seed = domain.length + name.charCodeAt(0);
  const designScore = Math.max(1, Math.min(10, (seed % 7) + 2));
  const copyScore = Math.max(1, Math.min(10, ((seed * 3) % 8) + 2));
  const uxScore = Math.max(1, Math.min(10, ((seed * 7) % 6) + 3));
  const overallScore = Math.max(1, Math.min(10, Math.round((designScore + copyScore + uxScore) / 3)));

  const designRoasts = [
    {
      oneLiner: "Did a blindfolded intern design this in MS Paint?",
      detail: `The design of ${domain} looks like it was crafted during a fever dream in 2003. The color palette screams "I picked these with my eyes closed from a bargain bin of rejected crayon colors." Every element is fighting for attention like toddlers at a birthday party, and somehow they all lose.`
    },
    {
      oneLiner: "This design makes MySpace pages look like works of art.",
      detail: `Looking at ${domain}, I genuinely cannot tell if this is a website or a ransom note made from magazine clippings. The spacing is chaotic, the fonts are having an identity crisis, and the overall aesthetic says "I have strong opinions about Comic Sans and none of them are negative."`
    },
    {
      oneLiner: "Your designer clearly believes more is more... and they're wrong.",
      detail: `${domain} appears to have been designed by someone who discovered gradients, drop shadows, and borders all on the same day and decided to use ALL of them. It is visual noise turned up to eleven. My retinas are filing a formal complaint.`
    },
    {
      oneLiner: "This looks like a CSS file had a panic attack.",
      detail: `The layout of ${domain} suggests someone played Tetris with div elements and lost badly. Nothing aligns, the whitespace is either nonexistent or overwhelming, and I am pretty sure the responsive design strategy was just hoping for the best.`
    }
  ];

  const copyRoasts = [
    {
      oneLiner: "The copy reads like a thesaurus had a nervous breakdown.",
      detail: `The text on ${domain} is trying so hard to sound professional that it has looped back around to incomprehensible. Every sentence is a run-on marathon of buzzwords that would make a LinkedIn influencer blush. "Synergize your paradigm-shifting solutions" is not a value proposition, it is a cry for help.`
    },
    {
      oneLiner: "Who wrote this copy? A chatbot having an existential crisis?",
      detail: `Reading the content on ${domain} feels like wading through a swamp of corporate jargon. The headlines promise everything and deliver nothing. The CTAs are so generic they could be on literally any website in existence. "Click here to get started" - started with WHAT exactly?`
    },
    {
      oneLiner: "Your copy has less personality than a tax form.",
      detail: `${domain}'s content is the textual equivalent of watching paint dry in a beige room. Every word is calculated to offend no one and inspire absolutely nobody. Somewhere, a copywriter is collecting a paycheck for producing this perfectly mediocre wall of forgettable text.`
    },
    {
      oneLiner: "This reads like someone fed a corporate handbook into a blender.",
      detail: `The writing on ${domain} achieves the rare feat of using many words to say absolutely nothing. It is padded with filler like a student trying to hit a word count. Every paragraph could be replaced with "we do stuff" and nothing of value would be lost.`
    }
  ];

  const uxRoasts = [
    {
      oneLiner: "The UX is so bad, even the back button feels like an escape plan.",
      detail: `Navigating ${domain} is like being trapped in a corn maze designed by someone who hates you. The menu structure makes no logical sense, buttons do unexpected things, and I needed three clicks just to figure out what this site actually does. The user journey is less "journey" and more "hostage situation."`
    },
    {
      oneLiner: "Your UX makes DMV websites look intuitive.",
      detail: `Using ${domain} requires the patience of a saint and the determination of someone who absolutely refuses to give up. Forms appear from nowhere, popups ambush you at every turn, and the navigation has more dead ends than a haunted house. Even the 404 page is hard to find on purpose.`
    },
    {
      oneLiner: "I have seen simpler interfaces on nuclear reactor control panels.",
      detail: `${domain} presents users with so many options that decision paralysis kicks in within 0.3 seconds. The information architecture was clearly designed by someone who thinks "more dropdowns" is always the answer. Spoiler: it is never the answer.`
    },
    {
      oneLiner: "The user flow is more like user quicksand.",
      detail: `Every interaction on ${domain} leads to two more questions than answers. The checkout process has more steps than a NASA launch sequence, and the search function returns results from what appears to be a parallel dimension where relevance does not exist.`
    }
  ];

  const designRoast = designRoasts[seed % designRoasts.length];
  const copyRoast = copyRoasts[(seed * 2) % copyRoasts.length];
  const uxRoast = uxRoasts[(seed * 3) % uxRoasts.length];

  const verdicts = [
    `Overall, ${domain} is the digital equivalent of stepping on a LEGO in the dark. It exists, technically functions, and causes pain to everyone who encounters it.`,
    `In summary, ${domain} manages to be simultaneously overwhelming and underwhelming. It is the lukewarm bath water of the internet - nobody asked for it and everyone wants out.`,
    `To conclude, ${domain} is proof that just because you CAN put something on the internet does not mean you SHOULD. But here we are, and my eyes will never forgive me.`,
    `Final verdict: ${domain} is what happens when "good enough" and "ship it" have a baby and nobody bothers to raise it properly. It is the participation trophy of websites.`
  ];

  const verdict = verdicts[(seed * 5) % verdicts.length];

  const roastText = JSON.stringify({
    design: {
      score: designScore,
      oneLiner: designRoast.oneLiner,
      detail: designRoast.detail
    },
    copy: {
      score: copyScore,
      oneLiner: copyRoast.oneLiner,
      detail: copyRoast.detail
    },
    ux: {
      score: uxScore,
      oneLiner: uxRoast.oneLiner,
      detail: uxRoast.detail
    },
    overall: {
      score: overallScore,
      verdict: verdict
    }
  });

  return {
    designScore,
    copyScore,
    uxScore,
    overallScore,
    roastText
  };
}

function generateShareId() {
  return crypto.randomBytes(8).toString('hex');
}

// Generate roast endpoint
router.post('/generate', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Basic URL validation
  let validUrl;
  try {
    validUrl = url.startsWith('http') ? url : 'http://' + url;
    new URL(validUrl);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const roast = generateRoast(validUrl);
  const shareId = generateShareId();
  const userId = req.session.user ? req.session.user.id : null;

  const stmt = db.prepare(
    'INSERT INTO roasts (user_id, url, design_score, copy_score, ux_score, overall_score, roast_text, share_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(userId, validUrl, roast.designScore, roast.copyScore, roast.uxScore, roast.overallScore, roast.roastText, shareId);

  res.json({
    id: result.lastInsertRowid,
    url: validUrl,
    designScore: roast.designScore,
    copyScore: roast.copyScore,
    uxScore: roast.uxScore,
    overallScore: roast.overallScore,
    roast: JSON.parse(roast.roastText),
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

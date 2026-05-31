const express = require('express');
const db = require('../db/database');

const router = express.Router();

// Mock AI content generation service
function generateContent(type, prompt) {
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  switch (type) {
    case 'blog':
      return generateBlogPost(prompt);
    case 'social':
      return generateSocialMedia(prompt);
    case 'email':
      return generateEmail(prompt);
    default:
      return `Generated content for: ${prompt}`;
  }
}

function generateBlogPost(prompt) {
  const titles = [
    `The Ultimate Guide to ${prompt}`,
    `How ${prompt} is Changing the Game in 2024`,
    `Everything You Need to Know About ${prompt}`
  ];
  const title = titles[Math.floor(Math.random() * titles.length)];

  return `# ${title}

## Introduction

In today's rapidly evolving landscape, ${prompt.toLowerCase()} has become more important than ever. Whether you're a seasoned professional or just getting started, understanding the key principles can make all the difference.

## Key Takeaways

1. **Start with the fundamentals** - Before diving deep into ${prompt.toLowerCase()}, ensure you have a solid foundation.
2. **Stay consistent** - The most successful practitioners maintain a regular schedule and approach.
3. **Measure your results** - Track your progress and adjust your strategy based on data.

## Why This Matters

The world of ${prompt.toLowerCase()} is constantly changing. By staying informed and adaptable, you position yourself for long-term success. Here are some actionable steps you can take today:

- Research the latest trends in ${prompt.toLowerCase()}
- Connect with others in the community
- Set measurable goals for the next 30 days
- Document your journey and share your learnings

## Conclusion

${prompt} is not just a passing trend - it's a fundamental shift in how we approach our work and lives. By taking action today, you'll be well-positioned to capitalize on the opportunities ahead.

*What are your thoughts on ${prompt.toLowerCase()}? Share your experience in the comments below.*`;
}

function generateSocialMedia(prompt) {
  const posts = [
    `Ready to transform your approach to ${prompt.toLowerCase()}? Here are 3 things I've learned:\n\n1. Start small, think big\n2. Consistency beats perfection\n3. Community is everything\n\nWhat would you add to this list? Drop your thoughts below.\n\n#${prompt.replace(/\s+/g, '')} #Growth #Innovation`,
    `Hot take: ${prompt} is the most underrated skill in 2024.\n\nHere's why:\n- It compounds over time\n- Few people do it well\n- The ROI is massive\n\nIf you're not investing in ${prompt.toLowerCase()} right now, you're leaving opportunity on the table.\n\nAgree or disagree? Let me know.\n\n#${prompt.replace(/\s+/g, '')} #Productivity #Success`,
    `I spent 6 months studying ${prompt.toLowerCase()} and here's what changed:\n\n- My productivity doubled\n- I built stronger relationships\n- My confidence skyrocketed\n\nThe best part? Anyone can start today.\n\nHere's your action plan (thread below):\n\n#${prompt.replace(/\s+/g, '')} #PersonalDevelopment #Tips`
  ];
  return posts[Math.floor(Math.random() * posts.length)];
}

function generateEmail(prompt) {
  return `Subject: Exciting Update About ${prompt}

Hi [Name],

I hope this message finds you well. I wanted to reach out about something that's been on my mind - ${prompt.toLowerCase()}.

Over the past few weeks, I've been exploring new approaches and I believe there's a significant opportunity for us to discuss.

Here's what I'd like to propose:

1. A brief 15-minute call to align on our goals related to ${prompt.toLowerCase()}
2. A shared document outlining our strategy and next steps
3. A follow-up meeting in two weeks to review progress

I believe this could have a meaningful impact on our results, and I'd love to get your input.

Would any of these times work for a quick chat?
- Tuesday at 2:00 PM
- Wednesday at 10:00 AM
- Thursday at 3:00 PM

Looking forward to hearing your thoughts.

Best regards,
[Your Name]

P.S. I've attached a brief overview document that outlines the key points we'd discuss. Feel free to review it beforehand.`;
}

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Generate content endpoint
router.post('/generate', requireAuth, (req, res) => {
  const { type, prompt } = req.body;

  if (!type || !prompt) {
    return res.status(400).json({ error: 'Type and prompt are required' });
  }

  if (!['blog', 'social', 'email'].includes(type)) {
    return res.status(400).json({ error: 'Invalid content type. Must be blog, social, or email' });
  }

  const result = generateContent(type, prompt);

  // Save to database
  const stmt = db.prepare(
    'INSERT INTO content (user_id, type, prompt, result) VALUES (?, ?, ?, ?)'
  );
  const insertResult = stmt.run(req.session.user.id, type, prompt, result);

  res.json({
    id: insertResult.lastInsertRowid,
    type,
    prompt,
    result,
    created_at: new Date().toISOString()
  });
});

// Get user's content history
router.get('/history', requireAuth, (req, res) => {
  const contents = db.prepare(
    'SELECT * FROM content WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.session.user.id);
  res.json(contents);
});

// Delete content
router.delete('/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const content = db.prepare('SELECT * FROM content WHERE id = ? AND user_id = ?').get(id, req.session.user.id);

  if (!content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  db.prepare('DELETE FROM content WHERE id = ?').run(id);
  res.json({ success: true });
});

module.exports = router;

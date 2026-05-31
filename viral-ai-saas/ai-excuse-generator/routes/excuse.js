const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');

const router = express.Router();

const CATEGORIES = ['work', 'social', 'family', 'school', 'fitness'];

// Excuse templates per category
const excuseTemplates = {
  work: [
    {
      excuse: "My internet went down right before the meeting, and my backup hotspot decided today was the day to run out of data. I tried to join from my phone but the app crashed three times.",
      deliveryTips: "Look slightly frustrated when explaining. Mention you already called your ISP. Add a detail about trying to restart your router twice.",
      riskLevel: "low"
    },
    {
      excuse: "I got stuck in an elevator for 45 minutes this morning. Building maintenance had to manually override the system. I have a photo of the stuck floor indicator if you need proof.",
      deliveryTips: "Act mildly traumatized. Mention the lack of cell signal in the elevator. Casually reference claustrophobia you never knew you had.",
      riskLevel: "medium"
    },
    {
      excuse: "My neighbor's car alarm went off at 3 AM and would not stop until 5 AM. The police came but couldn't locate the owner. I finally fell asleep at 6 and slept through all my alarms.",
      deliveryTips: "Yawn naturally during the explanation. Look genuinely exhausted. Mention you filed a noise complaint.",
      riskLevel: "low"
    },
    {
      excuse: "I had a dentist appointment that was supposed to be a routine cleaning but they found something that needed immediate attention. The numbing took forever to wear off so I couldn't talk properly.",
      deliveryTips: "Touch your jaw occasionally. Speak slightly carefully as if your mouth is still a bit numb. Mention how unexpected it was.",
      riskLevel: "low"
    },
    {
      excuse: "My laptop did a forced Windows update that took 2 hours. It was at 'Do not turn off your computer' and I could not do anything but watch the percentage crawl up.",
      deliveryTips: "Show visible annoyance at technology. Mention this is the third time this month. Offer to show the update log.",
      riskLevel: "low"
    }
  ],
  social: [
    {
      excuse: "I just got my wisdom teeth out and my face looks like a chipmunk storing acorns for winter. I would love to come but I can barely talk and I am on a strict soup-only diet.",
      deliveryTips: "Send a selfie if you can fake puffiness. Mention you cannot drink alcohol. Sound genuinely disappointed.",
      riskLevel: "medium"
    },
    {
      excuse: "My dog ate something weird at the park and has been... expressing his displeasure at both ends. I cannot leave him alone right now. The vet said to monitor him for 24 hours.",
      deliveryTips: "Send a sad photo of your pet. Express genuine concern. Offer to make it up next time with specific plans.",
      riskLevel: "low"
    },
    {
      excuse: "I double-booked myself and just realized my aunt is visiting from out of town for literally one night. She is 87 and guilt trips like a professional. I physically cannot say no to her.",
      deliveryTips: "Sound conflicted. Mention family obligations apologetically. Suggest rescheduling immediately with specific dates.",
      riskLevel: "medium"
    },
    {
      excuse: "I threw my back out doing the most embarrassing thing possible - I sneezed too hard. I literally cannot sit up straight and walking is a comedy show no one asked for.",
      deliveryTips: "Walk stiffly if they see you later. Mention how ridiculous it is. Be self-deprecating about it.",
      riskLevel: "medium"
    },
    {
      excuse: "My car is making a terrifying grinding noise and I am afraid if I drive it anywhere it will explode or something. The earliest mechanic appointment is tomorrow morning.",
      deliveryTips: "Offer to Facetime from home instead. Sound frustrated about the timing. Mention you cannot afford rideshare right now.",
      riskLevel: "low"
    }
  ],
  family: [
    {
      excuse: "I have a massive work deadline that got moved up to tomorrow. My boss just dropped it on me today. I have been stress-eating crackers and staring at spreadsheets for 6 hours.",
      deliveryTips: "Sound exhausted. Mention specific (fake) project details. Promise to make it up with a family dinner you will cook.",
      riskLevel: "low"
    },
    {
      excuse: "I think I am coming down with something and I do not want to risk getting everyone sick, especially the kids. My throat is scratchy and I have been sneezing all day.",
      deliveryTips: "Make your voice slightly raspy. Cough once or twice. Mention you are taking vitamin C. Express concern for their health.",
      riskLevel: "low"
    },
    {
      excuse: "My apartment is being fumigated for a pest issue the building has. I cannot go back for 6 hours and I am camping out at a coffee shop with my laptop and a duffle bag.",
      deliveryTips: "Mention the inconvenience naturally. Sound annoyed at your building management. Offer to video call instead.",
      riskLevel: "high"
    },
    {
      excuse: "I volunteered to help my friend move months ago and completely forgot it was this weekend. They already rented the truck and I am their only friend with upper body strength apparently.",
      deliveryTips: "Sound apologetic but locked in. Mention you gave your word. Promise to visit next weekend instead.",
      riskLevel: "medium"
    },
    {
      excuse: "My car failed its inspection and I have to get it fixed before the registration expires tomorrow. The mechanic can only fit me in during that exact time slot.",
      deliveryTips: "Mention the tight deadline. Sound frustrated about bureaucracy. Offer to come by right after if timing works.",
      riskLevel: "low"
    }
  ],
  school: [
    {
      excuse: "My laptop crashed and corrupted the file right before submission. I have the auto-save version but it is from two days ago. I am rewriting the last sections from memory now.",
      deliveryTips: "Email your professor immediately. Attach a screenshot of any error messages. Submit whatever you have as proof of progress.",
      riskLevel: "medium"
    },
    {
      excuse: "I had a severe allergic reaction to something I ate and spent the night in urgent care. They gave me antihistamines that made me so drowsy I could not function until noon.",
      deliveryTips: "Look slightly puffy or tired. Mention specific food allergies if asked. Keep details vague but concerning enough.",
      riskLevel: "medium"
    },
    {
      excuse: "There was a water main break on my street and we had no water for 12 hours. I could not shower, the toilet would not flush, and I was honestly not in a state to be seen in public.",
      deliveryTips: "Mention the city emergency notification. Sound annoyed about infrastructure. Note that several neighbors had the same issue.",
      riskLevel: "low"
    },
    {
      excuse: "I got my schedule mixed up and thought the assignment was due next week. I swear the syllabus changed or I wrote down the wrong date. I can have it done by tomorrow morning.",
      deliveryTips: "Sound genuinely confused. Show your planner with the wrong date. Be honest about the mistake while asking for grace.",
      riskLevel: "high"
    },
    {
      excuse: "My study group member had all our research materials and went completely MIA. We have been trying to reach them for 48 hours. I can show you our message history.",
      deliveryTips: "Name the missing person confidently. Show messages. Express frustration that you did your part.",
      riskLevel: "medium"
    }
  ],
  fitness: [
    {
      excuse: "I tweaked my knee doing a weird movement getting out of bed this morning. It is not serious but my physical therapist said to rest it for 48 hours minimum. No impact activities.",
      deliveryTips: "Wear a knee brace if possible. Walk slightly gingerly. Mention you are icing it regularly.",
      riskLevel: "low"
    },
    {
      excuse: "I donated blood yesterday and they specifically said no strenuous exercise for 24 hours. I am still feeling a bit lightheaded and do not want to pass out mid-rep.",
      deliveryTips: "Show the bandage on your arm. Mention feeling slightly woozy. Talk about the free cookies they gave you.",
      riskLevel: "low"
    },
    {
      excuse: "I ate something that violently disagreed with me and I have been within sprinting distance of a bathroom all day. A gym session right now would be a public hazard.",
      deliveryTips: "Look slightly pale. Do not provide too many details. Mention you are sticking to water and crackers.",
      riskLevel: "low"
    },
    {
      excuse: "My gym shoes finally gave out and the sole literally separated from the shoe. I ordered new ones but they will not arrive until Thursday. I refuse to be that person working out in sandals.",
      deliveryTips: "Show the destroyed shoes if possible. Express frustration about timing. Suggest a different activity instead.",
      riskLevel: "low"
    },
    {
      excuse: "I slept on my neck wrong and cannot turn my head to the right without searing pain. Any exercise would probably make it worse and I need to be functional for work tomorrow.",
      deliveryTips: "Keep your head slightly tilted. Wince when turning. Mention you are using a heating pad.",
      riskLevel: "low"
    }
  ]
};

function generateExcuse(situation, category) {
  const validCategory = CATEGORIES.includes(category) ? category : 'work';
  const templates = excuseTemplates[validCategory];

  // Use situation string to deterministically pick a template
  const seed = situation.length + situation.charCodeAt(0) + (situation.charCodeAt(1) || 0);
  const templateIndex = seed % templates.length;
  const template = templates[templateIndex];

  // Generate scores based on seed
  const believabilityScore = Math.max(1, Math.min(10, (seed % 5) + 5));
  const creativityScore = Math.max(1, Math.min(10, ((seed * 3) % 6) + 4));

  const excuseData = JSON.stringify({
    excuse: template.excuse,
    deliveryTips: template.deliveryTips,
    riskLevel: template.riskLevel,
    believabilityScore,
    creativityScore,
    category: validCategory,
    situation
  });

  return {
    excuseText: excuseData,
    believabilityScore,
    creativityScore
  };
}

function generateShareId() {
  return crypto.randomBytes(8).toString('hex');
}

// Generate excuse endpoint
router.post('/generate', (req, res) => {
  const { situation, category } = req.body;

  if (!situation) {
    return res.status(400).json({ error: 'Situation description is required' });
  }

  if (!category) {
    return res.status(400).json({ error: 'Category is required' });
  }

  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category. Must be one of: ' + CATEGORIES.join(', ') });
  }

  const result = generateExcuse(situation, category);
  const shareId = generateShareId();
  const userId = req.session.user ? req.session.user.id : null;

  const stmt = db.prepare(
    'INSERT INTO excuses (user_id, situation, category, excuse_text, believability_score, creativity_score, share_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const dbResult = stmt.run(userId, situation, category, result.excuseText, result.believabilityScore, result.creativityScore, shareId);

  const excuseData = JSON.parse(result.excuseText);

  res.json({
    id: dbResult.lastInsertRowid,
    situation,
    category,
    excuse: excuseData.excuse,
    deliveryTips: excuseData.deliveryTips,
    riskLevel: excuseData.riskLevel,
    believabilityScore: result.believabilityScore,
    creativityScore: result.creativityScore,
    shareId,
    shareUrl: `/excuse/${shareId}`
  });
});

// View shared excuse
router.get('/:shareId', (req, res) => {
  const { shareId } = req.params;

  const excuse = db.prepare('SELECT * FROM excuses WHERE share_id = ?').get(shareId);
  if (!excuse) {
    return res.status(404).render('index', { error: 'Excuse not found' });
  }

  const excuseData = JSON.parse(excuse.excuse_text);
  res.render('share', {
    excuse: {
      ...excuse,
      data: excuseData
    }
  });
});

module.exports = router;

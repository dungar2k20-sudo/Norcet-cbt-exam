# NORCET CBT — Norcetedutech

A mobile-first Computer Based Test (CBT) platform for NORCET exam preparation.

## 📁 File Structure

```
├── index.html       → Main HTML shell (UI layout)
├── style.css        → All styles & themes
├── script.js        → CBT engine (timer, scoring, review, swipe)
├── questions.js     → CONFIG block (edit per exam)
├── questions.json   → Question bank (replace for each test)
└── netlify.toml     → Netlify deployment config
```

## 🚀 Deploy on Netlify

1. Push this repo to GitHub
2. Go to [netlify.com](https://netlify.com) → New Site → Import from GitHub
3. Select your repo — no build command needed
4. Publish directory: `.` (root)
5. Click **Deploy**

## ✏️ How to Create a New Test

### Step 1 — Edit `questions.js` (CONFIG)
```js
const CONFIG = {
  TEST_NAME:  'Pediatric Nursing CBT – Test 1 | Norcetedutech',
  SUBJECT:    'Pediatric Nursing – Test 1',
  BRAND:      'CBT | NORCETEDUTECH',
  LOGO_EMOJI: '👶',
  SK:         'norcet_pedia1_v1',       // ← unique key per exam
  TG_CHANNEL: 'Norcetedutech',
  TG_DOUBTS:  'norcetedutechdoubts',
  TIME_PER_Q: 60,
  MARKING:    0.33,
  TOPICS:     ['Topic 1', 'Topic 2', ...]
};
```

### Step 2 — Replace `questions.json`
```json
[
  {
    "q": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": [1],
    "sata": false,
    "explanation": "Explanation text here",
    "blueprint": "",
    "image": "",
    "topic": "Topic Name"
  }
]
```

> For SATA questions set `"sata": true` and `"answer": [0, 2, 3]`

### Step 3 — Push to GitHub → Netlify auto-deploys ✅

## ⚙️ Features
- ⏱ Auto timer with per-question tracking
- ⚡ SATA (Select All That Apply) support
- 📊 Grade badge + confetti on high scores
- 🌙 Dark / ☀️ Light mode toggle
- 🔤 A− / A+ font size control
- 📖 Full review mode with topic analytics
- 📤 One-tap share to Telegram
- ★ Mark for review & question palette grid
- 💾 Auto-save & resume mid-test
- 📱 Mobile-first, swipe navigation

## 📢 Telegram
- Channel: [@Norcetedutech](https://t.me/Norcetedutech)
- Doubts: [@norcetedutechdoubts](https://t.me/norcetedutechdoubts)

---
© Norcetedutech — All Rights Reserved. Unauthorized copying or redistribution is prohibited.

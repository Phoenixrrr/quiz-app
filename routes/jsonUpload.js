const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// Parse options whether they're an array or object (A/B/C/D)
function parseOptions(opts) {
  if (Array.isArray(opts)) return opts;
  if (typeof opts === 'object') {
    const abcd = ['A', 'B', 'C', 'D'];
    const keys = Object.keys(opts);
    if (abcd.some(k => keys.includes(k))) {
      return abcd.map(k => opts[k]);
    } else {
      return keys.map(k => opts[k]);
    }
  }
  throw new Error('Invalid options format.');
}

// Keep "answer" as-is if it's "na", otherwise parse index
function parseAnswer(ans, optionsLength) {
  if (typeof ans === 'string' && ans.toLowerCase() === 'na') return 'na';

  if (typeof ans === 'number') return ans;

  if (typeof ans === 'string') {
    const index = ['a', 'b', 'c', 'd'].indexOf(ans.toLowerCase().trim());
    if (index >= 0 && index < optionsLength) return index;

    const parsed = parseInt(ans, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < optionsLength) return parsed;
  }

  return 'na'; // default to "na" if we can't parse
}

// Get question array from common formats
function sanitizeRawData(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.questions)) return raw.questions;
  if (Array.isArray(raw.quiz)) return raw.quiz;

  for (const key in raw) {
    if (Array.isArray(raw[key])) return raw[key];
  }

  throw new Error('No valid array of questions found.');
}

router.post('/upload-json', upload.single('quizJson'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  try {
    const jsonStr = req.file.buffer.toString('utf8').trim();
    const raw = JSON.parse(jsonStr);
    const questions = sanitizeRawData(raw);

    const quiz = questions.map((q, idx) => {
      if (!q.question || !q.options || q.answer === undefined) {
        throw new Error(`Missing required fields in question at index ${idx}`);
      }

      const options = parseOptions(q.options);
      const answer = parseAnswer(q.answer, options.length);
      const explanation = q.explanation || 'na';

      return {
        question: q.question,
        options,
        answer,
        explanation
      };
    });

    res.json({ quiz });
  } catch (err) {
    console.error('Failed to process file:', err.message);
    res.status(400).send('Error parsing file: ' + err.message);
  }
});

module.exports = router;

// routes/jsonUpload.js
const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() }); // store file in memory

// Helper to normalize options
function parseOptions(opts) {
  if (Array.isArray(opts)) {
    return opts;
  } else if (typeof opts === 'object' && opts !== null) {
    const keys = ['A', 'B', 'C', 'D'];
    const optsKeys = Object.keys(opts);
    const hasABCD = keys.some(k => optsKeys.includes(k));
    if (hasABCD) {
      return keys.map(k => {
        if (!(k in opts)) throw new Error(`Missing option ${k}`);
        return opts[k];
      });
    } else {
      return optsKeys.map(k => opts[k]);
    }
  } else {
    throw new Error('Options must be an array or object');
  }
}

// Helper to normalize answer(s)
function parseAnswers(ans, optionsLength) {
  const toIndex = (a) => {
    if (typeof a === 'number') {
      if (a < 0 || a >= optionsLength) throw new Error('Answer index out of range');
      return a;
    }
    if (typeof a === 'string') {
      const upper = a.toUpperCase();
      const idx = ['A', 'B', 'C', 'D'].indexOf(upper);
      if (idx !== -1 && idx < optionsLength) return idx;

      const parsed = parseInt(a, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < optionsLength) return parsed;

      throw new Error(`Invalid answer value: ${a}`);
    }
    throw new Error('Answer must be a letter or index');
  };

  if (Array.isArray(ans)) {
    return ans.map(toIndex);
  } else {
    return [toIndex(ans)];
  }
}

// Route: Upload and clean quiz JSON
router.post('/upload-json', upload.single('quizJson'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  try {
    const jsonStr = req.file.buffer.toString('utf8');
    const raw = JSON.parse(jsonStr);
    const data = Array.isArray(raw) ? raw : raw.quiz;

    if (!Array.isArray(data)) {
      return res.status(400).send('JSON must contain an array of questions');
    }

    const quiz = data.map((q, idx) => {
      if (!q.question || !q.options || q.answer === undefined || q.answer === null) {
        throw new Error(`Missing fields in question at index ${idx}`);
      }

      const cleanedQuestion = {
        question: String(q.question).trim(),
        options: parseOptions(q.options),
        answer: parseAnswers(q.answer, parseOptions(q.options).length),
        explanation: q.explanation ? String(q.explanation).trim() : ''
      };

      return cleanedQuestion;
    });

    res.json({ quiz });
  } catch (err) {
    console.error('JSON parse/format error:', err.message);
    res.status(400).send('Invalid quiz JSON format: ' + err.message);
  }
});

module.exports = router;

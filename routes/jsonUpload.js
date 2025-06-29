// routes/jsonUpload.js
const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() }); // storing in memory

// Helper to parse options that can be array or object (keys like A-D or any)
function parseOptions(opts) {
  if (Array.isArray(opts)) {
    return opts;
  } else if (typeof opts === 'object' && opts !== null) {
    const keys = ['A', 'B', 'C', 'D'];
    const optsKeys = Object.keys(opts);
    const hasABCD = keys.some(k => optsKeys.includes(k));
    if (hasABCD) {
      // Must have all A-D keys, else error
      return keys.map(k => {
        if (!(k in opts)) throw new Error(`Missing option ${k}`);
        return opts[k];
      });
    } else {
      // Return values in key order
      return optsKeys.map(k => opts[k]);
    }
  } else {
    throw new Error('Options must be an array or object');
  }
}

// Helper to parse answer (accepts letter like 'A' or index like 0)
function parseAnswer(ans, optionsLength) {
  if (typeof ans === 'number') {
    if (ans < 0 || ans >= optionsLength) throw new Error('Answer index out of range');
    return ans;
  }
  if (typeof ans === 'string') {
    const letter = ans.toUpperCase();
    const letterIndex = ['A', 'B', 'C', 'D'].indexOf(letter);
    if (letterIndex !== -1 && letterIndex < optionsLength) {
      return letterIndex;
    }
    const parsed = parseInt(ans, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < optionsLength) {
      return parsed;
    }
    throw new Error(`Invalid answer value: ${ans}`);
  }
  throw new Error('Answer must be a letter or index');
}

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

      const opts = parseOptions(q.options);
      const answerIndex = parseAnswer(q.answer, opts.length);

      return {
        question: q.question,
        options: opts,
        answer: answerIndex,
        explanation: q.explanation || ''
      };
    });

    res.json({ quiz });
  } catch (err) {
    console.error('JSON parse/format error:', err.message);
    res.status(400).send('Invalid quiz JSON format: ' + err.message);
  }
});

module.exports = router;

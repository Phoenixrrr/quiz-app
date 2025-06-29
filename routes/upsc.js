const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Middleware to check session
function checkAuth(req, res, next) {
  if (!req.session.userId) return res.redirect('/');
  next();
}

// GET /upsc => main UPSC subjects page (make sure views/upsc.ejs exists)
router.get('/', checkAuth, (req, res) => {
  res.render('upsc');
});

// GET /upsc/:slug => handle both quiz JSON and normal subject pages
router.get('/:slug', checkAuth, (req, res) => {
  const slug = req.params.slug;

  // Path to quiz JSON file
  const quizFile = path.join(__dirname, '..', 'views', 'upsc', 'geography_q', `${slug}.json`);

  fs.readFile(quizFile, 'utf-8', (err, data) => {
    if (err) {
      // Quiz JSON not found, try rendering subject page
      return res.render(`upsc/${slug}`, { subject: slug }, (renderErr, html) => {
        if (renderErr) {
          console.error(`Render error for upsc/${slug}:`, renderErr);
          return res.status(404).send('Page not found');
        }
        res.send(html);
      });
    }

    // Quiz JSON found, parse and render quiz page
    try {
      const quiz = JSON.parse(data);
      res.render('upsc/geography_q/q', { title: slug.replace(/-/g, ' '), quiz }, (renderErr, html) => {
        if (renderErr) {
          console.error('Render error for quiz:', renderErr);
          return res.status(500).send('Template rendering error');
        }
        res.send(html);
      });
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      res.status(500).send('Invalid quiz data');
    }
  });
});

module.exports = router;

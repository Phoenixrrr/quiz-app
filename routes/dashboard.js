const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  res.render('dashboard');
});

router.post('/upsc', (req, res) => {
  if (!req.session.userId) return res.redirect('/');
  res.redirect('/upsc');
});




module.exports = router;

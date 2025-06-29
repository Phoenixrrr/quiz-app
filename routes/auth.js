const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');


// GET login page
router.get('/', (req, res) => {
  res.render('login');
});

// GET register page
router.get('/register', (req, res) => {
  res.render('register');
});

// POST register
router.post('/register', async (req, res) => {
  const { name, password } = req.body;
  const existingUser = await User.findOne({ name });

  if (existingUser) return res.send('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ name, password: hashedPassword });
  await user.save();

  req.session.userId = user._id;
  res.redirect('/dashboard');
});

// POST login
router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  const user = await User.findOne({ name });

  if (!user) return res.send('No such user');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.send('Incorrect password');

  req.session.userId = user._id;
  res.redirect('/dashboard');
});

// POST logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});


module.exports = router;

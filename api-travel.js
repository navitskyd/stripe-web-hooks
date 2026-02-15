const express = require('express');
const {sendEmail} = require('./dist/utils/email');
const cors = require('cors');

const Stripe = require('stripe');
const admin = require("firebase-admin");
require('dotenv').config({path: require('path').join(__dirname, '.env')});
const stripe = Stripe(process.env.STRIPE_SECRET);

const setupTravelRoutes = (app) => {
  // Endpoint to clear the in-memory user cache
  // Basic auth middleware for sensitive endpoints
  function basicAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
      res.set('WWW-Authenticate', 'Basic realm="Restricted"');
      return res.status(401).send('Authentication required.');
    }
    const credentials = Buffer.from(auth.split(' ')[1],
        'base64').toString().split(':');
    const [user, pass] = credentials;
    // Set your username and password here
    const ADMIN_USER = process.env.RESET_CACHE_USER || 'admin';
    const ADMIN_PASS = process.env.RESET_CACHE_PASS || 'svethappy78c2';
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Restricted"');
    return res.status(401).send('Authentication failed.');
  }

  app.post('/travel/reset-cache', basicAuth, (req, res) => {
    Object.keys(userCache).forEach(key => delete userCache[key]);
    res.json({message: 'User cache cleared'});
  });

  // In-memory cache for user lookups by email with TTL
  const userCache = {};
  const USER_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
  // In-memory cache for user and lessons lookups by email with TTL

  app.options('/travel', cors({origin: '*', methods: ['POST']})); // preflight

  app.post(
      '/travel',
      cors({
        origin: '*',
        methods: ['POST'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }),
      async (req, res) => {

        // Extract Bearer token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          console.log('Missing or invalid Authorization header')
          return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }
        const idToken = authHeader.split(' ')[1];
        console.log('Received /travel request for ' + idToken);

        // Initialize Firebase Admin
        const admin = require('firebase-admin');
        if (!admin.apps.length) {
          const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

          if (!serviceAccountJson) {
            console.error(
                'FIREBASE_SERVICE_ACCOUNT environment variable is not set');
            throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
          }

          const serviceAccount = JSON.parse(serviceAccountJson);

          admin.initializeApp({
            databaseURL: process.env.FIREBASE_DATABASE_URL,
            credential: admin.credential.cert(serviceAccount)
          });

          let email;
          try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            console.log(decodedToken);
            email = decodedToken.email;
            if (!email) {
              console.log("Email not found in token")
              return res.status(401).json({ error: 'Email not found in token' });
            }
          } catch (err) {
            console.error('Token verification failed:', err.message);
             return res.status(401).json({ error: 'Invalid or expired token', details: err.message });
          }
        }

        // Lookup user by email in Realtime DB
        try {
          // Firebase keys can't have '.' so replace with ','
          const lookupKey = email.replace(/\./g, ',');
          console.log(`Looking up user with key: ${lookupKey}`);
          let cacheEntry = userCache[lookupKey];
          let user, matchedLessons;
          const now = Date.now();
          if (cacheEntry && (now - cacheEntry.ts < USER_CACHE_TTL_MS)) {
            user = cacheEntry.user;
            matchedLessons = cacheEntry.lessons;
            console.log(`Cache hit for ${email}`);
          } else {
            console.log(`Cache miss for ${email}, querying Firebase...`);
            const db = admin.database();
            const ref = db.ref('travel-users');
            const snapshot = await ref.child(lookupKey).once('value');
            user = snapshot.val();
            if (!user) {
              console.error(`User not found in Firebase for email: ${email}`);
              return res.status(404).json({error: 'User not found'});
            }
            // Fetch all lessons from Firebase DB (travel-lessons)
            const lessonsRef = db.ref('travel-lessons');
            const lessonsSnapshot = await lessonsRef.once('value');
            const lessonsData = lessonsSnapshot.val() || {};
            // Collect all lessons that match at least one user stream or tag
            const userStreams = (user.stream || user.streams || '').split(
                ',').map(s => s.trim()).filter(Boolean);
            const userTags = (user.tag || user.tags || '').split(',').map(
                t => t.trim()).filter(Boolean);
            matchedLessons = [];
            Object.entries(lessonsData).forEach(([topicTitle, country]) => {
              if (!country.lessons) {
                return;
              }
              const topicTitleValue = country.title || topicTitle;
              Object.entries(country.lessons).forEach(([videoId, lesson]) => {
                const lessonStreams = (lesson.streams || '').split(',').map(
                    s => s.trim()).filter(Boolean);
                const lessonTags = (lesson.tags || '').split(',').map(
                    t => t.trim()).filter(Boolean);
                const hasStream = userStreams.some(
                    s => lessonStreams.includes(s));
                const hasTag = userTags.some(t => lessonTags.includes(t));
                if (hasStream || hasTag) {
                  matchedLessons.push(
                      {...lesson, videoId, topicTitle: topicTitleValue});
                }
              });
            });
            console.log(
                `Found ${matchedLessons.length} matching lessons for user ${email}`);
            // Only cache if both user and lessons fetch succeeded
            userCache[lookupKey] = {user, lessons: matchedLessons, ts: now};

          }
          return res.json({user, lessons: matchedLessons});
        } catch (err) {
          // Do not cache anything in case of error
          return res.status(500).json(
              {error: 'Firebase error', details: err.message});
        }
      });
};

module.exports = {setupTravelRoutes};

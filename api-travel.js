const express = require('express');
const {sendEmail} = require('./dist/utils/email');
const cors = require('cors');

const Stripe = require('stripe');
const admin = require("firebase-admin");
require('dotenv').config({path: require('path').join(__dirname, '.env')});
const stripe = Stripe(process.env.STRIPE_SECRET);

const setupTravelRoutes = (app) => {

  // In-memory cache for user lookups by email with TTL
  const userCache = {};
  const USER_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

  app.options('/travel', cors({origin: '*', methods: ['POST']})); // preflight

  app.post(
      '/travel',
      cors({
        origin: '*', 
        methods: ['POST'],
        allowedHeaders: ['Content-Type', 'Authorization']
      }),
      async (req, res) => {

        const {email} = req.body || {};
        if (!email) {
          return res.status(400).json({error: 'Email is required'});
        }
          // Initialize Firebase Admin
          const admin = require('firebase-admin');
          if (!admin.apps.length) {
            const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

            if (!serviceAccountJson) {
              throw new Error('FIREBASE_SERVICE_ACCOUNT not set');
            }

            const serviceAccount = JSON.parse(serviceAccountJson);

            admin.initializeApp({
              databaseURL: process.env.FIREBASE_DATABASE_URL,
              credential: admin.credential.cert(serviceAccount)
              });
          }


          // Lookup user by email in Realtime DB
          try {
            // Firebase keys can't have '.' so replace with ','
            const lookupKey = email.replace(/\./g, ',');
            let cacheEntry = userCache[lookupKey];
            let user = undefined;
            const now = Date.now();
            if (cacheEntry && (now - cacheEntry.ts < USER_CACHE_TTL_MS)) {
              user = cacheEntry.user;
            } else {
              const db = admin.database();
              const ref = db.ref('travel-users');
              const snapshot = await ref.child(lookupKey).once('value');
              user = snapshot.val();
              if (user) {
                userCache[lookupKey] = { user, ts: now };
              }
            }
            if (!user) {
              return res.status(404).json({error: 'User not found'});
            }
            // Fetch all lessons from Firebase DB (travel-lessons)
            const lessonsRef = db.ref('travel-lessons');
            const lessonsSnapshot = await lessonsRef.once('value');
            const lessonsData = lessonsSnapshot.val() || {};

            // Collect all lessons that match at least one user stream or tag
            const userStreams = (user.stream || user.streams || '').split(',').map(s => s.trim()).filter(Boolean);
            const userTags = (user.tag || user.tags || '').split(',').map(t => t.trim()).filter(Boolean);
            const matchedLessons = [];

            // lessonsData is structured by country/topic, then lessons

            Object.entries(lessonsData).forEach(([topicTitle, country]) => {
              if (!country.lessons) return;
              const topicTitleValue = country.title || topicTitle;
              Object.entries(country.lessons).forEach(([videoId, lesson]) => {
                const lessonStreams = (lesson.streams || '').split(',').map(s => s.trim()).filter(Boolean);
                const lessonTags = (lesson.tags || '').split(',').map(t => t.trim()).filter(Boolean);
                const hasStream = userStreams.some(s => lessonStreams.includes(s));
                const hasTag = userTags.some(t => lessonTags.includes(t));
                if (hasStream || hasTag) {
                  matchedLessons.push({...lesson, videoId, topicTitle: topicTitleValue});
                }
              });
            });

            return res.json({user, lessons: matchedLessons});
          } catch (err) {
            return res.status(500).json({error: 'Firebase error', details: err.message});
          }
      });
};

module.exports = {setupTravelRoutes};

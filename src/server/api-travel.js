
const cors = require('cors');
const {admin} = require('../utils/common');
const Stripe = require('stripe');
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


  // --- Helper functions ---
  function extractToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }

  async function verifyTokenAndGetEmail(admin, idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (!decodedToken.email) {
        throw new Error('Email not found in token');
      }
      return decodedToken.email;
    } catch (err) {
      throw new Error('Token verification failed: ' + err.message);
    }
  }

  async function getUserAndLessons(admin, email) {
    // Firebase keys can't have '.' so replace with ','
    const lookupKey = email.replace(/\./g, ',');
    let cacheEntry = userCache[lookupKey];
    let user, matchedLessons;
    const now = Date.now();
    if (cacheEntry && (now - cacheEntry.ts < USER_CACHE_TTL_MS)) {
      user = cacheEntry.user;
      matchedLessons = cacheEntry.lessons;
    } else {
      const db = admin.database();
      const ref = db.ref('travel-users');
      const snapshot = await ref.child(lookupKey).once('value');
      user = snapshot.val();
      if (!user) {
        throw new Error('User not found');
      }
      // Fetch all lessons from Firebase DB (travel-lessons)
      const lessonsRef = db.ref('travel-lessons');
      const lessonsSnapshot = await lessonsRef.once('value');
      const lessonsData = lessonsSnapshot.val() || {};
      // Collect all lessons that match at least one user stream or tag
      const userStreams = (user.stream || user.streams || '').split(',').map(s => s.trim()).filter(Boolean);
      const userTags = (user.tag || user.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      matchedLessons = [];
      Object.entries(lessonsData).forEach(([topicTitle, country]) => {
        if (!country.lessons) return;
        const topicTitleValue = country.title || topicTitle;
        Object.entries(country.lessons).forEach(([videoId, lesson]) => {
          const lessonStreams = (lesson.streams || '').split(',').map(s => s.trim()).filter(Boolean);
          const lessonTags = (lesson.tags || '').split(',').map(t => t.trim()).filter(Boolean);
          const hasStream = userStreams.some(s => lessonStreams.includes(s));
          const hasTag = userTags.some(t => lessonTags.includes(t));
          if (hasStream || hasTag) {
            matchedLessons.push({ ...lesson, videoId, topicTitle: topicTitleValue });
          }
        });
      });
      userCache[lookupKey] = { user, lessons: matchedLessons, ts: now };
    }
    return { user, lessons: matchedLessons };
  }

  // --- Main endpoint ---
  app.post(
    '/travel',
    cors({
      origin: '*',
      methods: ['POST'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }),
    async (req, res) => {
      const idToken = extractToken(req);
      if (!idToken) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
      }

      let email;
      try {
        email = await verifyTokenAndGetEmail(admin, idToken);
      } catch (err) {
        return res.status(401).json({ error: err.message });
      }
      try {
        const { user, lessons } = await getUserAndLessons(admin, email);
        return res.json({ user, lessons });
      } catch (err) {
        if (err.message === 'User not found') {
          return res.status(404).json({ error: err.message });
        }
        return res.status(500).json({ error: 'Firebase error', details: err.message });
      }
    }
  );
};

module.exports = {setupTravelRoutes};

const express = require('express');
const {sendEmail} = require('./dist/utils/email');
const cors = require('cors');

const Stripe = require('stripe');
const admin = require("firebase-admin");
require('dotenv').config({path: require('path').join(__dirname, '.env')});
const stripe = Stripe(process.env.STRIPE_SECRET);

const setupTravelRoutes = (app) => {

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
              credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
              });
          }


          // Lookup user by email in Realtime DB
          try {
            // Firebase keys can't have '.' so replace with ','
            const lookupKey = email.replace(/\./g, ',');
            const db = admin.database();
            const ref = db.ref('travel-users');
            const snapshot = await ref.child(lookupKey).once('value');
            const user = snapshot.val();
            if (!user) {
              return res.status(404).json({error: 'User not found'});
            }
            return res.json(user);
          } catch (err) {
            return res.status(500).json({error: 'Firebase error', details: err.message});
          }
      });
};

module.exports = {setupTravelRoutes};

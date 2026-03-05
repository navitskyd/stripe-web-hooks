// ugc-pulse-rekey.js
// Reads ugc-pulse, creates new keys from email using buildKey, saves records with new keys
const {getRef} = require('../src/utils/common');
const {buildKey} = require('../src/utils/utils');

const ref = getRef('ugc-pulse');

async function main() {
    try {
        const snap = await ref.once('value');
        const data = snap.val() || {};

        const updates = {};
        let count = 0;

        for (const [oldKey, value] of Object.entries(data)) {
            const email = value.userID;
            if (!email) {
                console.warn(`⚠️ Record ${oldKey} has no email, skipping.`);
                continue;
            }

            const newKey = buildKey(email);
            if (newKey === oldKey) {
                console.log(`✓ Record ${oldKey} already has correct key, skipping.`);
                continue;
            }

            // Set new key with same values
            updates[oldKey] = null;
            count++;
            console.log(`📝 ${oldKey} removed`);
        }

        if (count === 0) {
            console.log('No records to update.');
            process.exit(0);
        }

        console.log(`\nSaving ${count} records with new keys...`);
        await ref.update(updates);
        console.log('✅ Done!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

main();

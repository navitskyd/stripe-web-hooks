// telegram-group-members-mtproto.js
// Fetches ALL members from Telegram groups using MTProto client API (admin login)
// Session is saved to file to skip authentication next time

const { TelegramClient, Api } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const fs = require('fs');
const path = require('path');

// Configuration - Get from https://my.telegram.org/apps
const API_ID = parseInt(process.env.TELEGRAM_API_ID) || 27336735; // Your API ID
const API_HASH = process.env.TELEGRAM_API_HASH || '6132e350ac3ec46b3a7fb8e14d083269'; // Your API Hash

// Group IDs or usernames to fetch members from
const GROUP_IDS = [
    process.env.TELEGRAM_GROUP_1 || '-1002906638589',
    process.env.TELEGRAM_GROUP_2 || '-1002913124875',
];

// Session file path
const SESSION_FILE = path.join(__dirname, '.telegram-session');

function loadSession() {
    try {
        if (fs.existsSync(SESSION_FILE)) {
            const sessionString = fs.readFileSync(SESSION_FILE, 'utf8').trim();
            console.log('📂 Loaded existing session from file');
            return sessionString;
        }
    } catch (err) {
        console.warn('⚠️ Could not load session file:', err.message);
    }
    return '';
}

function saveSession(sessionString) {
    try {
        fs.writeFileSync(SESSION_FILE, sessionString, 'utf8');
        console.log('💾 Session saved to file');
    } catch (err) {
        console.error('❌ Could not save session:', err.message);
    }
}

async function getGroupMembers(client, groupId) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Fetching members for: ${groupId}`);
    console.log('='.repeat(60));

    try {
        // Get the entity (group/channel)
        const entity = await client.getEntity(groupId);
        console.log(`\n📋 Chat Info:`);
        console.log(`  Title: ${entity.title || 'N/A'}`);
        console.log(`  ID: ${entity.id}`);
        if (entity.username) console.log(`  Username: @${entity.username}`);

        // Fetch all active participants
        const participants = await client.getParticipants(entity, {
            limit: 10000,
        });

        console.log(`\n👥 Total Active Members: ${participants.length}`);

        const memberList = participants.map(user => ({
            id: user.id.toString(),
            username: user.username || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phone: user.phone || '',
            isBot: user.bot ? 'Yes' : 'No',
            status: user.status?.className || 'Unknown',
            memberStatus: 'Active',
        }));

        console.log(`\n👤 Active Members (${memberList.length}):`);
        console.table(memberList);

        // Fetch banned/kicked members
        let bannedList = [];
        try {
            // const banned = await client.getParticipants(entity, {
            //     limit: 10000,
            //     filter: new Api.ChannelParticipantsKicked(''),
            // });

            const banned = await client.invoke(
                new Api.channels.GetParticipants({
                    channel: groupId,
                    filter: new Api.ChannelParticipantsKicked({q: ''}), // фильтр именно для забаненных
                    offset: 0,
                    limit: 1000, // максимум за один запрос
                    hash: 0,
                })
            );

            bannedList = banned.map(user => ({
                id: user.id.toString(),
                username: user.username || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                isBot: user.bot ? 'Yes' : 'No',
                status: user.status?.className || 'Unknown',
                memberStatus: '🚫 Banned',
            }));

            console.log(`\n🚫 Banned Members (${bannedList.length}):`);
            if (bannedList.length > 0) {
                console.table(bannedList);
            } else {
                console.log('   No banned members found.');
            }
        } catch (banErr) {
            console.log(`\n⚠️ Could not fetch banned members: ${banErr.message}`);
        }

        // Combined table
        const allMembers = [...memberList, ...bannedList];
        console.log(`\n📋 All Members Combined (${allMembers.length}):`);
        console.table(allMembers);

        return {
            groupId,
            title: entity.title,
            memberCount: participants.length,
            bannedCount: bannedList.length,
            members: memberList,
            banned: bannedList,
        };

    } catch (err) {
        console.error(`❌ Error fetching group ${groupId}:`, err.message);
        return { groupId, error: err.message };
    }
}

async function main() {
    console.log('🤖 Telegram Group Members Fetcher (MTProto)');
    console.log('============================================\n');

    if (!API_ID || !API_HASH) {
        console.error('❌ Please set TELEGRAM_API_ID and TELEGRAM_API_HASH');
        console.log('\n1. Go to https://my.telegram.org/apps');
        console.log('2. Create an application to get API_ID and API_HASH');
        console.log('\nUsage:');
        console.log('  TELEGRAM_API_ID=123456 TELEGRAM_API_HASH=abc123 node scripts/telegram-group-members-mtproto.js');
        process.exit(1);
    }

    // Load existing session or create new
    const sessionString = loadSession();
    const stringSession = new StringSession(sessionString);

    const client = new TelegramClient(stringSession, API_ID, API_HASH, {
        connectionRetries: 5,
    });

    // Start client - will prompt for phone/code if no valid session
    await client.start({
        phoneNumber: async () => await input.text('📱 Enter your phone number: '),
        password: async () => await input.text('🔑 Enter your 2FA password (if enabled): '),
        phoneCode: async () => await input.text('📨 Enter the code you received: '),
        onError: (err) => console.error('Auth error:', err),
    });

    console.log('✅ Successfully connected!');

    // Save session for next time
    const newSession = client.session.save();
    if (newSession !== sessionString) {
        saveSession(newSession);
    }

    const results = [];

    for (const groupId of GROUP_IDS) {
        const result = await getGroupMembers(client, groupId);
        results.push(result);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));

    results.forEach(r => {
        if (r.error) {
            console.log(`❌ ${r.groupId}: ${r.error}`);
        } else {
            console.log(`✅ ${r.title}: ${r.memberCount} active, ${r.bannedCount} banned`);
        }
    });

    await client.disconnect();
    process.exit(0);
}

main();

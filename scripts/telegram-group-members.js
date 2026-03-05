// telegram-group-members.js
// Fetches all members from specified Telegram groups using Bot API

const https = require('https');

// Configuration - replace with your values
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const GROUP_IDS = [
    process.env.TELEGRAM_GROUP_1 || '-1001234567890', // Replace with actual group ID
    process.env.TELEGRAM_GROUP_2 || '-1009876543210', // Replace with actual group ID
];

function makeRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`);
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.ok) {
                        resolve(parsed.result);
                    } else {
                        reject(new Error(parsed.description || 'Unknown error'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function getChat(chatId) {
    return makeRequest('getChat', { chat_id: chatId });
}

async function getChatMemberCount(chatId) {
    return makeRequest('getChatMemberCount', { chat_id: chatId });
}

async function getChatAdministrators(chatId) {
    return makeRequest('getChatAdministrators', { chat_id: chatId });
}

// Note: getChatMember requires user_id, so we can only get specific users
// For supergroups, there's no direct API to list all members
// We can get administrators and use getChatMember for known user IDs

async function getGroupInfo(chatId) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Fetching info for group: ${chatId}`);
    console.log('='.repeat(60));

    try {
        // Get chat info
        const chat = await getChat(chatId);
        console.log('\n📋 Chat Info:');
        console.log(`  Title: ${chat.title || 'N/A'}`);
        console.log(`  Type: ${chat.type}`);
        console.log(`  ID: ${chat.id}`);
        if (chat.username) console.log(`  Username: @${chat.username}`);
        if (chat.description) console.log(`  Description: ${chat.description}`);

        // Get member count
        const memberCount = await getChatMemberCount(chatId);
        console.log(`\n👥 Total Members: ${memberCount}`);

        // Get administrators
        const admins = await getChatAdministrators(chatId);
        console.log(`\n👑 Administrators (${admins.length}):`);
        
        const adminList = admins.map(admin => ({
            id: admin.user.id,
            username: admin.user.username || '',
            firstName: admin.user.first_name || '',
            lastName: admin.user.last_name || '',
            status: admin.status,
            isBot: admin.user.is_bot ? 'Yes' : 'No',
        }));

        console.table(adminList);

        return {
            chatId,
            title: chat.title,
            type: chat.type,
            memberCount,
            administrators: adminList,
        };

    } catch (err) {
        console.error(`❌ Error fetching group ${chatId}:`, err.message);
        return { chatId, error: err.message };
    }
}

async function main() {
    console.log('🤖 Telegram Group Members Fetcher');
    console.log('==================================\n');

    if (BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
        console.error('❌ Please set TELEGRAM_BOT_TOKEN environment variable or update BOT_TOKEN in the script.');
        console.log('\nUsage:');
        console.log('  TELEGRAM_BOT_TOKEN=your_token TELEGRAM_GROUP_1=-100xxx TELEGRAM_GROUP_2=-100yyy node scripts/telegram-group-members.js');
        process.exit(1);
    }

    const results = [];

    for (const groupId of GROUP_IDS) {
        const result = await getGroupInfo(groupId);
        results.push(result);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    
    results.forEach(r => {
        if (r.error) {
            console.log(`❌ ${r.chatId}: ${r.error}`);
        } else {
            console.log(`✅ ${r.title}: ${r.memberCount} members, ${r.administrators.length} admins`);
        }
    });

    console.log('\n⚠️  Note: Telegram Bot API does not provide a method to list ALL members.');
    console.log('   Only administrators can be listed. To get specific member info,');
    console.log('   use getChatMember with known user IDs.');

    process.exit(0);
}

main();

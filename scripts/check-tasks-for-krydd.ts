import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Service Account
const serviceAccount = JSON.parse(
    readFileSync(join(__dirname, '../serviceAccountKey.json'), 'utf-8')
);

// Init Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    });
}

async function runCheck() {
    console.log('--- 🔍 SEARCHING SUBCOLLECTIONS (TASKS & LOGS) FOR KRYDD ---');
    try {
        const credential = admin.credential.cert(serviceAccount as admin.ServiceAccount);
        const tokenObj = await credential.getAccessToken();
        const accessToken = tokenObj.access_token;
        const projectId = serviceAccount.project_id;
        
        const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
        
        // 1. Fetch all houses to get their IDs
        const resHouses = await fetch(queryUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                structuredQuery: { from: [{ collectionId: 'houses' }] }
            })
        });

        if (resHouses.status !== 200) {
            throw new Error(`Failed to fetch houses: ${resHouses.status}`);
        }

        const housesResults: any = await resHouses.json();
        const houseIds = housesResults.filter((r: any) => r.document).map((r: any) => r.document.name.split('/').pop());

        console.log(`Searching through subcollections for ${houseIds.length} houses...`);

        for (const houseId of houseIds) {
            // Search tasks for this house
            const tasksUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/houses/${houseId}/tasks`;
            const resTasks = await fetch(tasksUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            
            if (resTasks.status === 200) {
                const tasksData: any = await resTasks.json();
                const tasks = tasksData.documents || [];
                tasks.forEach((task: any) => {
                    const title = task.fields?.title?.stringValue || '';
                    const description = task.fields?.description?.stringValue || '';
                    const details = JSON.stringify(task.fields);
                    if (details.toLowerCase().includes('krydd')) {
                        console.log(`🎯 Found matching Task in House ${houseId}: Title: "${title}", Desc: "${description}"`);
                    }
                });
            }

            // Search internal_logs for this house
            const logsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/houses/${houseId}/internal_logs`;
            const resLogs = await fetch(logsUrl, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (resLogs.status === 200) {
                const logsData: any = await resLogs.json();
                const logs = logsData.documents || [];
                logs.forEach((log: any) => {
                    const text = log.fields?.text?.stringValue || '';
                    const details = JSON.stringify(log.fields);
                    if (details.toLowerCase().includes('krydd')) {
                        console.log(`📝 Found matching Log in House ${houseId}: Text: "${text}"`);
                    }
                });
            }
        }
        console.log('Search complete.');

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

runCheck();

import { test, expect } from '@playwright/test';
import admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin for cleanup
// We do this outside the test so it only happens once
test.beforeAll(() => {
  if (admin.apps.length === 0) {
    try {
      const serviceAccount = require(path.resolve(process.cwd(), 'serviceAccountKey.json'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (e) {
      console.warn('Could not initialize Firebase Admin. Cleanup might fail if serviceAccountKey.json is missing:', e.message);
    }
  }
});

test.describe('Authentication and Onboarding Flow', () => {
  let testEmail = '';

  test('should allow a user to sign up, create a house, and reach the dashboard', async ({ page }) => {
    // Generate a unique test email
    const timestamp = Date.now();
    testEmail = `test-playwright-${timestamp}@bustadurinn.is`;
    const testPassword = 'TestPassword123!';
    const testName = 'Playwright Test User';
    const testHouseName = `Test House ${timestamp}`;

    // 1. Navigate to Signup Page
    await page.goto('/signup');
    await expect(page).toHaveTitle(/Búa til aðgang/i);

    // 2. Fill in the signup form
    await page.fill('input[type="text"]', testName);
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submit the form
    await page.click('button[type="submit"]');

    // 3. Wait for redirect to onboarding
    await page.waitForURL('**/onboarding');
    await expect(page.locator('h2')).toContainText(/Velkomin í Bústaðurinn.is/i);

    // 4. Onboarding - Step 1: Welcome
    await page.click('button:has-text("Byrja uppsetningu")');

    // 5. Onboarding - Step 2: House Info
    await expect(page.locator('h2')).toContainText(/Upplýsingar um húsið/i);
    
    // Fill in house name
    await page.fill('input[placeholder="t.d. Sumarbústaðurinn okkar"]', testHouseName);
    
    // Submit house creation
    await page.click('button:has-text("Áfram")');

    // Wait for house creation to complete.
    await expect(page.locator('h2')).toContainText(/Bjóða meðeigendum/i, { timeout: 15000 });

    // 6. Onboarding - Step 3: Invites
    await page.click('button:has-text("Sleppa þessu")');

    // 7. Onboarding - Step 4: Finish
    await expect(page.locator('h2')).toContainText(/Allt tilbúið/i, { timeout: 10000 });
    await page.click('button:has-text("Fara á stjórnborð")');

    // 8. Verify we ended up on the dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await expect(page.locator(`text=${testHouseName}`).first()).toBeVisible({ timeout: 10000 });
    const firstName = testName.split(' ')[0];
    await expect(page.locator(`text=${firstName}`).first()).toBeVisible();
  });

  test.afterAll(async () => {
    // Clean up after the test
    if (!testEmail || admin.apps.length === 0) return;

    try {
      const auth = admin.auth();
      const db = admin.firestore();
      
      // Get the user record
      const userRecord = await auth.getUserByEmail(testEmail);
      const uid = userRecord.uid;

      console.log(`Cleaning up test user: ${testEmail} (${uid})`);

      // Find and delete the house they created
      const housesSnapshot = await db.collection('houses').where('manager_id', '==', uid).get();
      for (const houseDoc of housesSnapshot.docs) {
        await houseDoc.ref.delete();
        console.log(`Deleted test house: ${houseDoc.id}`);
      }

      // Delete the user document in Firestore
      await db.collection('users').doc(uid).delete();
      console.log(`Deleted Firestore user doc: ${uid}`);

      // Delete the user from Firebase Auth
      await auth.deleteUser(uid);
      console.log(`Deleted Auth user: ${uid}`);
      
    } catch (e) {
      console.error('Cleanup failed:', e);
    }
  });
});

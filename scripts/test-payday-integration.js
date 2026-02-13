/**
 * Test Payday API Integration
 * 
 * This script tests:
 * 1. Authentication with Payday API
 * 2. Creating a test invoice
 * 3. Checking invoice status
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

const PAYDAY_TOKEN_URL = process.env.PAYDAY_TOKEN_URL || 'https://api.payday.is/auth/token';
const CLIENT_ID = process.env.VITE_PAYDAY_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYDAY_SECRET_KEY;

async function getAccessToken() {
    console.log('🔐 Authenticating with Payday API...');

    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('Missing VITE_PAYDAY_CLIENT_ID or PAYDAY_SECRET_KEY in .env.local');
    }

    console.log(`   Using Token URL: ${PAYDAY_TOKEN_URL}`);
    console.log(`   Client ID: ${CLIENT_ID?.substring(0, 8)}...`);

    const response = await fetch(PAYDAY_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Api-Version': 'alpha',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET
        })
    });

    console.log(`   Response status: ${response.status} ${response.statusText}`);

    // Try to get response text first to see what we received
    const responseText = await response.text();
    console.log(`   Response body: ${responseText.substring(0, 200)}${responseText.length > 200 ? '...' : ''}`);

    if (!response.ok) {
        let errorData;
        try {
            errorData = JSON.parse(responseText);
        } catch {
            errorData = { message: responseText };
        }
        throw new Error(`Authentication failed (${response.status}): ${JSON.stringify(errorData)}`);
    }

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (error) {
        throw new Error(`Failed to parse authentication response: ${responseText}`);
    }

    console.log('✅ Authentication successful');
    return data.accessToken || data.access_token;
}

async function listInvoices(accessToken) {
    console.log('\n📋 Fetching invoices list...');

    const response = await fetch('https://api.payday.is/invoices', {
        method: 'GET',
        headers: {
            'Api-Version': 'alpha',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch invoices: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.length || 0} invoice(s)`);

    // Show recent invoices
    const invoicesList = Array.isArray(data) ? data : (data.items || data.data || []);
    if (invoicesList.length > 0) {
        console.log('\nRecent invoices:');
        invoicesList.slice(0, 5).forEach((inv, idx) => {
            console.log(`  ${idx + 1}. Invoice #${inv.invoiceNumber || inv.id} - ${inv.customerName || inv.customer?.name} - ${inv.totalAmount || inv.total} ISK - Status: ${inv.status || 'unknown'}`);
        });
    }

    return invoicesList;
}

async function checkInvoiceStatus(accessToken, invoiceId) {
    console.log(`\n🔍 Checking invoice status for ID: ${invoiceId}...`);

    const response = await fetch(`https://api.payday.is/invoices/${invoiceId}`, {
        method: 'GET',
        headers: {
            'Api-Version': 'alpha',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to fetch invoice: ${JSON.stringify(error)}`);
    }

    const invoice = await response.json();
    console.log(`✅ Invoice status: ${invoice.status || 'unknown'}`);
    console.log(`   Total: ${invoice.totalAmount || invoice.total} ISK`);
    console.log(`   Paid: ${invoice.paidAmount || invoice.paid || 0} ISK`);
    console.log(`   Due date: ${invoice.dueDate || 'N/A'}`);

    return invoice;
}

async function createTestInvoice(accessToken) {
    console.log('\n💰 Creating test invoice...');

    // First, get or create a test customer
    const customersResponse = await fetch('https://api.payday.is/customers', {
        method: 'GET',
        headers: {
            'Api-Version': 'alpha',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        }
    });

    let customerId = null;
    const testEmail = 'test@bustadurinn.is';

    if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        const customersList = Array.isArray(customersData) ? customersData : (customersData.items || customersData.data || []);
        const existingCustomer = customersList.find(c => c.email === testEmail);

        if (existingCustomer) {
            console.log('✅ Found existing test customer');
            customerId = existingCustomer.id;
        }
    }

    // Create customer if doesn't exist
    if (!customerId) {
        console.log('➕ Creating test customer...');
        const createCustomerResponse = await fetch('https://api.payday.is/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Version': 'alpha',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                name: 'Test Customer - Bústaðurinn',
                email: testEmail,
                phone: '5551234',
                kennitala: ''
            })
        });

        if (!createCustomerResponse.ok) {
            const error = await createCustomerResponse.json();
            throw new Error(`Failed to create customer: ${JSON.stringify(error)}`);
        }

        const customerData = await createCustomerResponse.json();
        customerId = customerData.id;
        console.log('✅ Created test customer');
    }

    // Create invoice
    const today = new Date();
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const invoicePayload = {
        customer: {
            id: customerId
        },
        description: 'TEST - Bústaðurinn.is árleg áskrift',
        invoiceDate: today.toISOString().split('T')[0],
        dueDate: dueDate,
        finalDueDate: dueDate,
        currencyCode: 'ISK',
        sendEmail: false, // Don't send email for test
        createClaim: false, // Don't create claim for test
        lines: [{
            description: 'Árleg áskrift - Bústaðurinn.is',
            quantity: 1,
            unitPriceIncludingVat: 4990,
            vatPercentage: 24, // 24% VSK
            discountPercentage: 0
        }]
    };

    console.log('Creating invoice with payload:', JSON.stringify(invoicePayload, null, 2));

    const invoiceResponse = await fetch('https://api.payday.is/invoices', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Api-Version': 'alpha',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(invoicePayload)
    });

    if (!invoiceResponse.ok) {
        const error = await invoiceResponse.json();
        throw new Error(`Failed to create invoice: ${JSON.stringify(error, null, 2)}`);
    }

    const invoice = await invoiceResponse.json();
    console.log('✅ Test invoice created successfully!');
    console.log(`   Invoice ID: ${invoice.id}`);
    console.log(`   Invoice Number: ${invoice.invoiceNumber || 'N/A'}`);
    console.log(`   Total: ${invoice.totalAmount || invoice.total} ISK`);

    return invoice;
}

async function main() {
    console.log('🚀 Starting Payday API Integration Test\n');
    console.log('='.repeat(60));

    try {
        // Step 1: Get access token
        const accessToken = await getAccessToken();

        // Step 2: List existing invoices
        const invoices = await listInvoices(accessToken);

        // Step 3: Create a test invoice
        console.log('\n' + '='.repeat(60));
        const shouldCreateTest = process.argv.includes('--create-test');

        if (shouldCreateTest) {
            const testInvoice = await createTestInvoice(accessToken);

            // Step 4: Check the status of the newly created invoice
            await checkInvoiceStatus(accessToken, testInvoice.id);
        } else {
            console.log('\nℹ️  Skipping test invoice creation.');
            console.log('   Run with --create-test flag to create a test invoice:');
            console.log('   npm run test-payday -- --create-test');

            // Check status of first invoice if any exist
            if (invoices.length > 0) {
                await checkInvoiceStatus(accessToken, invoices[0].id);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ All tests completed successfully!');
        console.log('\n💡 Summary:');
        console.log('   - Authentication: ✅ Working');
        console.log('   - List invoices: ✅ Working');
        console.log('   - Invoice status check: ✅ Working');
        if (shouldCreateTest) {
            console.log('   - Create invoice: ✅ Working');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.stack) {
            console.error('\nStack trace:', error.stack);
        }
        process.exit(1);
    }
}

main();

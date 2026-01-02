import type { VercelRequest, VercelResponse } from '@vercel/node';

interface InvoiceLineItem {
    productCode: string;
    quantity: number;
    unitPrice: number;
    description: string;
    discount?: number;
}

interface CreateInvoiceRequest {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerKennitala?: string;
    lineItems: InvoiceLineItem[];
    dueDate?: string;
    notes?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const clientId = process.env.VITE_PAYDAY_CLIENT_ID;
    const clientSecret = process.env.PAYDAY_SECRET_KEY;
    const tokenUrl = process.env.PAYDAY_TOKEN_URL || 'https://api.payday.is/auth/token';

    if (!clientId || !clientSecret) {
        return res.status(500).json({ error: 'Missing Payday credentials in environment' });
    }

    try {
        // Step 1: Get access token
        const tokenResponse = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Version': 'alpha',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                clientId: clientId,
                clientSecret: clientSecret
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            return res.status(tokenResponse.status).json({
                error: 'Failed to authenticate with Payday',
                details: errorData
            });
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.accessToken || tokenData.access_token;

        if (!accessToken) {
            return res.status(500).json({ error: 'No access token received from Payday' });
        }

        // Step 2: Get or create customer
        const invoiceData: CreateInvoiceRequest = req.body;

        // First, try to find existing customer by email
        const customersResponse = await fetch('https://api.payday.is/customers', {
            method: 'GET',
            headers: {
                'Api-Version': 'alpha',
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });

        let customerId = null;

        if (customersResponse.ok) {
            const customers = await customersResponse.json();
            const existingCustomer = customers.find((c: any) => c.email === invoiceData.customerEmail);
            if (existingCustomer) {
                customerId = existingCustomer.id;
            }
        }

        // If customer doesn't exist, create it
        if (!customerId) {
            const createCustomerResponse = await fetch('https://api.payday.is/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Version': 'alpha',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    name: invoiceData.customerName,
                    email: invoiceData.customerEmail,
                    phone: invoiceData.customerPhone || '',
                    kennitala: invoiceData.customerKennitala || ''
                })
            });

            if (!createCustomerResponse.ok) {
                const errorData = await createCustomerResponse.json();
                return res.status(createCustomerResponse.status).json({
                    error: 'Failed to create customer in Payday',
                    details: errorData
                });
            }

            const customerData = await createCustomerResponse.json();
            customerId = customerData.id;
        }

        // Step 3: Create invoice with proper format
        const today = new Date();
        const dueDate = invoiceData.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const invoicePayload = {
            customer: {
                id: customerId
            },
            description: invoiceData.notes || `Bústaðurinn.is - Mánaðarleg áskrift`,
            invoiceDate: today.toISOString().split('T')[0],
            dueDate: dueDate,
            finalDueDate: dueDate,
            currencyCode: 'ISK',
            sendEmail: true,
            createClaim: true,
            lines: invoiceData.lineItems.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unitPriceIncludingVat: item.unitPrice,
                vatPercentage: 24.0, // Standard Icelandic VAT
                discountPercentage: item.discount || 0,
                productId: item.productCode // This should be a GUID from Payday
            }))
        };

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

        const invoiceResult = await invoiceResponse.json();

        if (!invoiceResponse.ok) {
            console.error('Payday invoice error:', invoiceResult);
            return res.status(invoiceResponse.status).json({
                error: 'Failed to create invoice',
                details: invoiceResult
            });
        }

        // Return success with invoice details
        return res.status(200).json({
            success: true,
            invoice: invoiceResult,
            customerId: customerId,
            message: 'Invoice created successfully and sent to customer'
        });

    } catch (error: any) {
        console.error('Payday invoice creation error:', error);
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
}

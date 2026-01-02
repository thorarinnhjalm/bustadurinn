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

        // Step 2: Create invoice
        const invoiceData: CreateInvoiceRequest = req.body;

        // Build invoice payload according to Payday API format
        const invoicePayload = {
            customer: {
                name: invoiceData.customerName,
                email: invoiceData.customerEmail,
                phone: invoiceData.customerPhone,
                kennitala: invoiceData.customerKennitala
            },
            lineItems: invoiceData.lineItems.map(item => ({
                productCode: item.productCode,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount || 0
            })),
            dueDate: invoiceData.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
            notes: invoiceData.notes || '',
            sendEmail: true // Automatically send invoice email to customer
        };

        const invoiceResponse = await fetch('https://api.payday.is/api/sales/invoices', {
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
            return res.status(invoiceResponse.status).json({
                error: 'Failed to create invoice',
                details: invoiceResult
            });
        }

        // Return success with invoice details
        return res.status(200).json({
            success: true,
            invoice: invoiceResult,
            message: 'Invoice created successfully and sent to customer'
        });

    } catch (error: any) {
        console.error('Payday invoice creation error:', error);
        return res.status(500).json({ error: error.message });
    }
}

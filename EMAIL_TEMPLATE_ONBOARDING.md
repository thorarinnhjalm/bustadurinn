# Onboarding Completion Email Template

This email template should be created in Firestore under `email_templates/onboarding_complete`.

## Template Details

### Template ID
`onboarding_complete`

### Subject
```
Velkomin í Bústaðurinn.is! 🏡 - Komdu í gang
```

### Variables
- `{name}` - User's name
- `{house_name}` - Name of the summer house

### HTML Content

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f5f0;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .feature-box {
            background: #f5f5f0;
            border-left: 4px solid #e8b058;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        .feature-box h3 {
            margin: 0 0 10px 0;
            color: #1a1a1a;
            font-size: 16px;
        }
        .feature-box p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: #e8b058;
            color: white;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 10px 0;
            text-align: center;
        }
        .footer {
            background: #f5f5f0;
            padding: 30px;
            text-align: center;
            font-size: 13px;
            color: #666;
        }
        .divider {
            height: 1px;
            background: #e0e0e0;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🏡</div>
            <h1>Velkomin í Bústaðurinn!</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Hæ {name}! 👋</p>
            
            <p>Til hamingju með að skrá <strong>{house_name}</strong> í kerfið hjá okkur! Nú getur þú hafist handa við að skipuleggja dvalir, halda utan um fjármál og verkefni.</p>
            
            <div class="divider"></div>
            
            <h2 style="color: #1a1a1a; margin-bottom: 20px;">Hér er það helsta sem þú getur gert:</h2>
            
            <div class="feature-box">
                <h3>📅 Bókunardagatal</h3>
                <p>Skipuleggðu dvalir fyrir fjölskylduna. Kerfið sér til þess að engar tvíbókanir verði og að helgum sé skipt á sanngjarnan hátt.</p>
            </div>
            
            <div class="feature-box">
                <h3>💰 Fjármál</h3>
                <p>Haltu utan um útgjöld, gerðu rekstraráætlun og fylgstu með stöðu hússjóðsins. Allir meðeigendur geta skráð útgjöld.</p>
            </div>
            
            <div class="feature-box">
                <h3>✅ Verkefni</h3>
                <p>Haltu utan um viðhaldsverkefni. Deildu verkefnum með meðeigendum og fylgstu með framvindunni.</p>
            </div>

            <div class="feature-box">
                <h3>👥 Gestir</h3>
                <p>Búðu til gestahlekk með WiFi kóða og helstu upplýsingum. Svo enginn þurfi að hringja og spyrja!</p>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <a href="https://bustadurinn.is/dashboard" class="cta-button">
                    Opna stjórnborð →
                </a>
            </div>
            
            <div class="divider"></div>
            
            <h3 style="color: #1a1a1a;">💡 Ábendingar:</h3>
            <ul style="color: #666; line-height: 1.8;">
                <li><strong>Bjóddu meðeigendum:</strong> Í stillingum geturðu búið til boðshlekk og sent öðrum.</li>
                <li><strong>Bókaðu fyrstu dvölina:</strong> Farðu í dagatalið og smelltu á dagsetningu til að bóka.</li>
                <li><strong>Gerðu rekstraráætlun:</strong> Útbúðu áætlun svo allir sjái hvað þarf að greiða í hússjóð.</li>
                <li><strong>Í símanum?</strong> Bættu Bústaðnum við á heimaskjáinn fyrir skjótari aðgang.</li>
            </ul>
            
            <div class="divider"></div>
            
            <p style="color: #666; font-size: 14px;">
                <strong>Spurningar?</strong><br>
                Svarum fúslega - sendu póst á <a href="mailto:hjalp@bustadurinn.is" style="color: #e8b058;">hjalp@bustadurinn.is</a>
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Bústaðurinn.is</strong> - Sumarhúsastjórnun án vesens</p>
            <p style="margin-top: 10px;">
                <a href="https://bustadurinn.is" style="color: #e8b058; text-decoration: none;">bustadurinn.is</a>
            </p>
        </div>
    </div>
</body>
</html>
```

## Firestore Document Structure

```javascript
{
  id: "onboarding_complete",
  subject: "Velkomin í Bústaðurinn.is! 🏡 - Komdu í gang",
  html_content: "<!-- HTML from above -->",
  active: true,
  variables: ["name", "house_name"],
  description: "Sent after user completes onboarding with their first house",
  created_at: firestore.serverTimestamp(),
  updated_at: firestore.serverTimestamp()
}
```

## When to Send

This email should be sent after:
1. User successfully creates their first house in `OnboardingPage.tsx`
2. Called right after the welcome email in the `handleCreateHouse` function
3. Uses the same `/api/send-email` endpoint with `templateId: 'onboarding_complete'`

## Implementation

In `src/pages/OnboardingPage.tsx`, after sending the welcome email:

```typescript
// Send onboarding completion email
(async () => {
    try {
        const userName = currentUser.name || currentUser.email?.split('@')[0];
        
        const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                templateId: 'onboarding_complete',
                to: currentUser.email,
                variables: { 
                    name: userName,
                    house_name: houseData.name
                }
            })
        });
        
        if (res.ok) {
            console.log('✅ Onboarding email sent');
        }
    } catch (e) {
        console.error("Failed to send onboarding email:", e);
    }
})();
```

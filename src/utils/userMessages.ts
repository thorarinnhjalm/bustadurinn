/**
 * Icelandic, user-safe messages for unknown errors.
 * Never returns raw English SDK text.
 */

const DEFAULT_FALLBACK = 'Villa kom upp. Reyndu aftur.';

const CODE_MESSAGES: Record<string, string> = {
    // Firebase Auth
    'auth/invalid-credential': 'Netfang eða lykilorð er rangt. Athugaðu upplýsingarnar og reyndu aftur.',
    'auth/wrong-password': 'Lykilorðið er rangt. Reyndu aftur eða endurstilltu lykilorðið.',
    'auth/user-not-found': 'Enginn notandi fannst með þetta netfang. Athugaðu netfangið eða stofnaðu aðgang.',
    'auth/email-already-in-use': 'Þetta netfang er þegar í notkun. Skráðu þig inn eða notaðu annað netfang.',
    'auth/weak-password': 'Lykilorðið er of veikt. Notaðu að minnsta kosti 6 stafi.',
    'auth/invalid-email': 'Netfangið er ekki gilt. Athugaðu það og reyndu aftur.',
    'auth/too-many-requests': 'Of margar tilraunir. Bíddu í smá stund og reyndu aftur.',
    'auth/network-request-failed': 'Ekki náðist samband við netið. Athugaðu nettenginguna og reyndu aftur.',
    'auth/popup-closed-by-user': 'Innskráningarglugganum var lokað. Reyndu aftur þegar þú ert tilbúin(n).',
    'auth/popup-blocked': 'Vafrinn lokaði innskráningarglugganum. Leyfðu sprettiglugga og reyndu aftur.',
    'auth/account-exists-with-different-credential':
        'Aðgangur með þessu netfangi er þegar til með annarri innskráningarleið. Skráðu þig inn með henni.',
    'auth/requires-recent-login': 'Af öryggisástæðum þarftu að skrá þig inn aftur og reyna svo aftur.',
    'auth/user-disabled': 'Þessi aðgangur hefur verið gerður óvirkur. Hafðu samband við okkur ef þetta er mistök.',
    // Firestore
    'permission-denied': 'Þú hefur ekki aðgang að þessari aðgerð. Skráðu þig inn aftur eða hafðu samband við umsjónarmann.',
    unavailable: 'Þjónustan er tímabundið óaðgengileg. Reyndu aftur eftir smá stund.',
    'deadline-exceeded': 'Aðgerðin tók of langan tíma. Athugaðu nettenginguna og reyndu aftur.',
    'not-found': 'Gögnin fundust ekki. Þau gætu hafa verið fjarlægð.',
    // Storage
    'storage/unauthorized': 'Þú hefur ekki heimild til að hlaða upp þessari skrá.',
    'storage/canceled': 'Hætt var við upphleðsluna. Reyndu aftur ef þú vilt.',
    'storage/quota-exceeded': 'Geymslurými er fullt. Hafðu samband við okkur.',
};

const NETWORK_MESSAGE = 'Ekki náðist samband við netið. Athugaðu nettenginguna og reyndu aftur.';

function readCode(err: unknown): string | undefined {
    if (err && typeof err === 'object' && 'code' in err) {
        const code = (err as { code?: unknown }).code;
        if (typeof code === 'string') {
            // Allow "firestore/permission-denied" style prefixes
            return code.startsWith('firestore/') ? code.slice('firestore/'.length) : code;
        }
    }
    return undefined;
}

export function getUserMessage(err: unknown, fallback: string = DEFAULT_FALLBACK): string {
    const code = readCode(err);
    if (code && Object.prototype.hasOwnProperty.call(CODE_MESSAGES, code)) {
        return CODE_MESSAGES[code];
    }

    // fetch() network failures surface as TypeError("Failed to fetch" / "Load failed" / "NetworkError...")
    if (err instanceof TypeError || (err && typeof err === 'object' && (err as { name?: unknown }).name === 'TypeError')) {
        const msg = String((err as { message?: unknown }).message ?? '');
        if (/failed to fetch|load failed|networkerror|network request failed/i.test(msg)) {
            return NETWORK_MESSAGE;
        }
    }

    return fallback;
}

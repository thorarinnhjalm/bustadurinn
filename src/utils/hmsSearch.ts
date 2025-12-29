export interface HMSAddress {
    s: string; // Street name (Nominative)
    n: string; // House number
    l: string; // Letter
    p: string; // Postcode
    lat: number;
    lng: number;
    f: string; // Full representation in CSV
}

const cache: Record<string, HMSAddress[]> = {};

/**
 * Maps Icelandic postcodes to their respective city/municipality names
 */
export const postcodes: Record<string, string> = {
    "101": "Reykjavík", "102": "Reykjavík", "103": "Reykjavík", "104": "Reykjavík", "105": "Reykjavík",
    "107": "Reykjavík", "108": "Reykjavík", "109": "Reykjavík", "110": "Reykjavík", "111": "Reykjavík",
    "112": "Reykjavík", "113": "Reykjavík", "116": "Reykjavík", "162": "Reykjavík", "170": "Seltjarnarnes",
    "190": "Vogar", "200": "Kópavogur", "201": "Kópavogur", "203": "Kópavogur", "210": "Garðabær",
    "220": "Hafnarfjörður", "221": "Hafnarfjörður", "225": "Garðabær", "230": "Reykjanesbær",
    "233": "Reykjanesbær", "235": "Keflavíkurflugvöllur", "240": "Grindavík", "245": "Sandgerði",
    "250": "Garður", "260": "Reykjanesbær", "270": "Mosfellsbær", "300": "Akranes", "301": "Akranes",
    "310": "Borgarnes", "311": "Borgarnes", "320": "Reykholt í Borgarfirði", "340": "Stykkishólmur",
    "345": "Flatey á Breiðafirði", "350": "Grundarfjörður", "355": "Ólafsvík", "356": "Snæfellsbær",
    "360": "Hellissandur", "370": "Búðardalur", "371": "Búðardalur", "380": "Reykhólahreppur",
    "400": "Ísafjörður", "401": "Ísafjörður", "410": "Hnífsdalur", "415": "Bolungarvík",
    "420": "Súðavík", "425": "Flateyri", "430": "Suðureyri", "450": "Patreksfjörður",
    "451": "Patreksfjörður", "460": "Tálknafjörður", "465": "Bíldudalur", "470": "Þingeyri",
    "471": "Þingeyri", "480": "Hólmavík", "481": "Hólmavík", "500": "Staðarskáli",
    "510": "Hólmavík", "512": "Hólmavík", "520": "Drangsnes", "524": "Árneshreppur",
    "530": "Hvammstangi", "531": "Hvammstangi", "540": "Blönduós", "541": "Blönduós",
    "545": "Skagaströnd", "550": "Sauðárkrókur", "551": "Sauðárkrókur", "560": "Varmahlíð",
    "565": "Hofsós", "566": "Hofsós", "570": "Fljótum", "580": "Siglufjörður",
    "600": "Akureyri", "601": "Akureyri", "603": "Akureyri", "610": "Grenivík", "611": "Grenivík",
    "620": "Dalvík", "621": "Dalvík", "625": "Ólafsfjörður", "630": "Hrísey", "640": "Húsavík",
    "641": "Húsavík", "645": "Fosshóll", "650": "Laugar", "660": "Mývatn", "670": "Kópasker",
    "671": "Kópasker", "675": "Raufarhöfn", "680": "Þórshöfn", "681": "Þórshöfn", "685": "Bakkafjörður",
    "690": "Vopnafjörður", "700": "Egilsstaðir", "701": "Egilsstaðir", "710": "Seyðisfjörður",
    "715": "Mjóifjörður", "720": "Borgarfjörður eystri", "730": "Reyðarfjörður", "735": "Eskifjörður",
    "740": "Neskaupstaður", "750": "Fáskrúðsfjörður", "755": "Stöðvarfjörður", "760": "Breiðdalsvík",
    "765": "Djúpivogur", "780": "Höfn í Hornafirði", "781": "Höfn í Hornafirði", "785": "Öræfi",
    "800": "Selfoss", "801": "Selfoss", "802": "Selfoss", "810": "Hveragerði", "815": "Þorlákshöfn",
    "816": "Ölfus", "820": "Eyrarbakki", "825": "Stokkseyri", "840": "Laugarvatn", "845": "Flúðir",
    "850": "Hella", "851": "Hella", "860": "Hvolsvöllur", "861": "Hvolsvöllur", "870": "Vík",
    "871": "Vík", "880": "Kirkjubæjarklaustur", "900": "Vestmannaeyjar", "902": "Vestmannaeyjar"
};

/**
 * Searches the local HMS Staðfangaskrá dataset for addresses matching the query.
 * Fast, local, and works without external API calls once the letter-block is loaded.
 */
export async function searchHMSAddresses(query: string): Promise<HMSAddress[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    // Check if query is numeric (postcode search)
    if (/^\d+$/.test(trimmed)) {
        // Postcode search - this is harder because we don't group by postcode.
        // But we can search the cache if any files are loaded, 
        // or just return empty if we don't want to load all files.
        return [];
    }

    const firstChar = trimmed[0].toLowerCase();
    const charCode = firstChar.charCodeAt(0);

    // Load from cache or fetch the JSON block for this letter
    if (!cache[firstChar]) {
        try {
            const response = await fetch(`/data/addresses/${charCode}.json`);
            if (response.ok) {
                cache[firstChar] = await response.json();
            } else {
                return [];
            }
        } catch (e) {
            console.error('Failed to load HMS addresses segment:', e);
            return [];
        }
    }

    const data = cache[firstChar];
    const normalizedQuery = trimmed.toLowerCase();

    // Sort and Filter
    return data
        .filter(item => {
            const streetMatch = item.s.toLowerCase().startsWith(normalizedQuery);
            const fullMatch = item.f.toLowerCase().includes(normalizedQuery);
            return streetMatch || fullMatch;
        })
        .sort((a, b) => {
            // Priority to exact street matches starting with query
            const aStarts = a.s.toLowerCase().startsWith(normalizedQuery);
            const bStarts = b.s.toLowerCase().startsWith(normalizedQuery);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            // Then sort by street name, then number
            if (a.s !== b.s) return a.s.localeCompare(b.s);
            return parseInt(a.n) - parseInt(b.n);
        })
        .slice(0, 10); // Limit results
}

/**
 * Formats an HMS address object into a user-friendly string
 */
export function formatHMSAddress(addr: HMSAddress): string {
    const city = postcodes[addr.p] || "";
    const streetNum = `${addr.s} ${addr.n}${addr.l}`;
    return `${streetNum.trim()}, ${addr.p} ${city}`.trim().replace(/,\s$/, '');
}

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const csvPath = path.join(__dirname, 'stadfangaskra.csv');
const outputDir = path.join(__dirname, '../public/data/addresses');

console.log('Reading HMS CSV...');
const content = fs.readFileSync(csvPath);

console.log('Parsing CSV...');
const records = parse(content, {
    columns: true,
    skip_empty_lines: true
});

console.log(`Processing ${records.length} records...`);

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const mapped = {};

records.forEach(row => {
    const street = row['HEITI_NF'];
    const number = row['HUSNR'];
    const letter = row['BOKST'] || '';
    const postcode = row['POSTNR'];
    const lat = row['N_HNIT_WGS84'];
    const lng = row['E_HNIT_WGS84'];
    const full = row['LM_HEIMILISFANG'];

    if (!street) return;

    // Use lowercase first char as key
    let firstChar = street.trim()[0].toLowerCase();

    // Handle Icelandic characters grouping (optional, but let's keep it simple)
    // Map accented chars to base for file naming if needed, but modern OS handle it.
    // We'll just use the literal char.

    if (!mapped[firstChar]) mapped[firstChar] = [];

    mapped[firstChar].push({
        s: street,
        n: number,
        l: letter,
        p: postcode,
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        f: full
    });
});

console.log('Saving results to public/data/addresses/...');
for (const char in mapped) {
    const fileName = char.charCodeAt(0) + '.json'; // Use char code to avoid issues with special chars in filenames
    fs.writeFileSync(
        path.join(outputDir, fileName),
        JSON.stringify(mapped[char])
    );
}

// Also create a small index of available streets to speed up initial search?
// Or just let the client fetch the char file.
// 137k entries split over ~30 chars is ~4k per file. 
// 4k * 100 bytes = 400KB per file. Perfect.

console.log('Done! HMS data processed successfully.');

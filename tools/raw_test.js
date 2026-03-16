require('dotenv').config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Missing URL or Key in process.env");
    process.exit(1);
}

console.log("Testing connection to: " + url);

fetch(`${url}/rest/v1/plots?select=*&limit=1`, {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
})
    .then(res => {
        console.log("Status Code:", res.status);
        return res.text();
    })
    .then(text => {
        console.log("Response:", text);
    })
    .catch(err => {
        console.error("Fetch Error:", err);
    });

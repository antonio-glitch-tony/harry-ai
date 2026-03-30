const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 JARVIS Server running on port ${PORT}`);
    console.log(`🔐 Security: Email whitelist + Password + Parola Segreta + Fingerprint + Google 2FA`);
    console.log(`🌀 Hologram: Avengers style - NO face/eyes`);
});
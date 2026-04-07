require('dotenv').config();
const { createClient } = require('@libsql/client');

async function test() {
    console.log('🔌 TEST CONNESSIONE TURSO');
    console.log('=================================');
    console.log('URL:', process.env.TURSO_URL);
    console.log('Token presente?', process.env.TURSO_TOKEN ? '✅ SÌ' : '❌ NO');
    
    if (!process.env.TURSO_URL || !process.env.TURSO_TOKEN) {
        console.error('❌ Configurazione mancante! Controlla il file .env');
        return;
    }
    
    const client = createClient({
        url: process.env.TURSO_URL,
        authToken: process.env.TURSO_TOKEN
    });
    
    try {
        const result = await client.execute('SELECT 1 as test');
        console.log('✅ CONNESSIONE RIUSCITA!');
        console.log('Risultato:', result.rows);
        console.log('=================================');
        console.log('Ora puoi usare Turso per salvare gli utenti!');
    } catch (err) {
        console.error('❌ ERRORE:', err.message);
    }
}

test();
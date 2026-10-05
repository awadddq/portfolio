// Portfolio data loader — reads db/resume.db (SQLite) in the browser using SQL.js.
// Exposes window.SiteData.ready, a promise of { works, education, career, skills, languages, isDraft }.
window.SiteData = (() => {
    'use strict';

    const SQL_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/';
    const TABLES = ['works', 'education', 'career', 'skills', 'languages'];

    // Read the draft database saved by admin.html, only when ?preview=draft is in the URL
    function loadAdminDraft() {
        try {
            if (new URLSearchParams(location.search).get('preview') !== 'draft') return null;
            const b64 = localStorage.getItem('resumeAdmin.draft');
            if (!b64) return null;
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            return bytes;
        } catch (error) {
            console.error('Error loading admin draft:', error);
            return null;
        }
    }

    async function openDatabase(SQL) {
        const draft = loadAdminDraft();
        if (draft) {
            console.log('Showing unpublished draft from admin.html');
            return { db: new SQL.Database(draft), isDraft: true };
        }

        try {
            const response = await fetch('db/resume.db', { cache: 'no-cache' });
            if (!response.ok) throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
            return { db: new SQL.Database(new Uint8Array(await response.arrayBuffer())), isDraft: false };
        } catch (fetchError) {
            // Fallback to creating an in-memory database from the SQL script
            console.warn('Error fetching database, falling back to db/resume.sql:', fetchError);
            const sqlResponse = await fetch('db/resume.sql', { cache: 'no-cache' });
            if (!sqlResponse.ok) throw new Error(`Failed to fetch SQL script: ${sqlResponse.status} ${sqlResponse.statusText}`);
            const db = new SQL.Database();
            db.run(await sqlResponse.text());
            return { db, isDraft: false };
        }
    }

    // Rows as plain objects; a missing table (e.g. an older database) reads as empty
    function readTable(db, table) {
        try {
            const result = db.exec(`SELECT * FROM ${table} ORDER BY id`);
            if (!result.length) return [];
            const { columns, values } = result[0];
            return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
        } catch (error) {
            console.warn(`Could not read table "${table}":`, error.message);
            return [];
        }
    }

    const ready = (async () => {
        const SQL = await initSqlJs({ locateFile: file => SQL_JS_CDN + file });
        const { db, isDraft } = await openDatabase(SQL);
        const data = { isDraft };
        TABLES.forEach(table => { data[table] = readTable(db, table); });
        db.close();
        return data;
    })();

    return { ready };
})();

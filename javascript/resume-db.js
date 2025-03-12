// Resume Database Handler using SQL.js
let SQL;
let db;

// Initialize the database
async function initDatabase() {
    try {
        console.log('Initializing database...');
        
        // Load SQL.js
        SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        
        console.log('SQL.js loaded successfully');
        
        try {
            // Fetch the database file
            const response = await fetch('db/resume.db');
            
            if (!response.ok) {
                throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const uInt8Array = new Uint8Array(arrayBuffer);
            
            // Create a database from the fetched file
            db = new SQL.Database(uInt8Array);
            console.log('Resume database loaded successfully');
            
            // Load data into the page
            loadEducationData();
            loadCareerData();
            loadSkillsData();
            loadLanguageData();
        } catch (fetchError) {
            console.error('Error fetching database:', fetchError);
            
            // Fallback to creating an in-memory database from SQL script
            console.log('Attempting to create in-memory database from SQL script...');
            
            try {
                const sqlResponse = await fetch('db/resume.sql');
                
                if (!sqlResponse.ok) {
                    throw new Error(`Failed to fetch SQL script: ${sqlResponse.status} ${sqlResponse.statusText}`);
                }
                
                const sqlScript = await sqlResponse.text();
                
                // Create an empty database
                db = new SQL.Database();
                
                // Execute the SQL script
                db.run(sqlScript);
                
                console.log('In-memory database created successfully');
                
                // Load data into the page
                loadEducationData();
                loadCareerData();
                loadSkillsData();
                loadLanguageData();
            } catch (sqlError) {
                console.error('Error creating in-memory database:', sqlError);
                document.body.innerHTML += '<div style="color: red; padding: 20px; background-color: #ffe6e6; margin: 20px; border-radius: 5px;"><h3>Error Loading Resume Data</h3><p>There was an error loading the resume database. Please try refreshing the page or contact the administrator.</p></div>';
            }
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        document.body.innerHTML += '<div style="color: red; padding: 20px; background-color: #ffe6e6; margin: 20px; border-radius: 5px;"><h3>Error Loading Resume Data</h3><p>There was an error loading the resume database. Please try refreshing the page or contact the administrator.</p></div>';
    }
}

// Load education data
function loadEducationData() {
    try {
        const result = db.exec('SELECT * FROM education ORDER BY id');
        if (result.length > 0) {
            const educationContainer = document.querySelector('#education-container');
            if (educationContainer) {
                let html = '';
                const rows = result[0].values;
                
                rows.forEach((row, index) => {
                    html += `
                    <div class="wrap-resume-info-list">
                        <span class="numb"><span class="bulet">0${index + 1}</span>
                            <span class="date">${row[1]}</span>
                        </span>
                        <div class="wrp-detail">
                            <h3>${row[2]}</h3>
                            <p>${row[3]}, ${row[4]}</p>
                        </div>
                    </div>
                    `;
                });
                
                educationContainer.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Error loading education data:', error);
    }
}

// Load career data
function loadCareerData() {
    try {
        const result = db.exec('SELECT * FROM career ORDER BY id');
        if (result.length > 0) {
            const careerContainer = document.querySelector('#career-container');
            if (careerContainer) {
                let html = '';
                const rows = result[0].values;
                
                rows.forEach((row, index) => {
                    html += `
                    <div class="wrap-resume-info-list">
                        <span class="numb"><span class="bulet">0${index + 1}</span>
                            <span class="date">${row[1]}</span>
                        </span>
                        <div class="wrp-detail">
                            <h3>${row[2]}</h3>
                            <p>${row[3]}</p>
                            ${row[4] ? `<p>${row[4]}</p>` : ''}
                        </div>
                    </div>
                    `;
                });
                
                careerContainer.innerHTML = html;
            }
        }
    } catch (error) {
        console.error('Error loading career data:', error);
    }
}

// Load skills data
function loadSkillsData() {
    try {
        const result = db.exec('SELECT * FROM skills ORDER BY id');
        if (result.length > 0) {
            const skillsContainer = document.querySelector('#skills-container');
            if (skillsContainer) {
                let html = '';
                const rows = result[0].values;
                
                rows.forEach((row, index) => {
                    html += `
                    <div class="col-lg-3">
                        <div class="wrap-pie text-center">
                            <div class="pie-chart-${index + 1} pies" data-no="${index + 1}"
                                data-pie='{ "lineargradient": ["#ff5e15","#ea8144"], "strokeWidth": 5, "round": true, "percent": ${row[2]}, "colorSlice": "#4CAF50", "time": 100, "fontSize": "11px", "fontColor": "rgba(255, 255, 255, .30)", "size": 150, "fontWeight": 400 }'>
                            </div>
                            <p class="title-skill">${row[1]}</p>
                            <p class="detail-skill" style="text-align: left;">${row[3]}</p>
                        </div>
                    </div>
                    `;
                });
                
                skillsContainer.innerHTML = html;
                
                // Reinitialize the pie charts
                initPieCharts();
            }
        }
    } catch (error) {
        console.error('Error loading skills data:', error);
    }
}

// Load language data
function loadLanguageData() {
    try {
        const result = db.exec('SELECT * FROM languages ORDER BY id');
        if (result.length > 0) {
            const languageContainer = document.querySelector('#language-container');
            if (languageContainer) {
                let html = '';
                const rows = result[0].values;
                
                rows.forEach(row => {
                    html += `
                    <div class="more-skill">
                        <p class="more-skill-name">${row[1]}</p>
                        <div class="more-skill-bar">
                            <div class="more-skill-per" data-num="${row[2]}"></div>
                        </div>
                    </div>
                    `;
                });
                
                languageContainer.innerHTML = html;
                
                // Reinitialize the skill bars
                initSkillBars();
            }
        }
    } catch (error) {
        console.error('Error loading language data:', error);
    }
}

// Helper function to reinitialize pie charts
function initPieCharts() {
    if (typeof pieChart === 'function') {
        document.querySelectorAll('.pies').forEach(element => {
            pieChart(element);
        });
    }
}

// Helper function to reinitialize skill bars
function initSkillBars() {
    document.querySelectorAll('.more-skill-per').forEach(element => {
        const percent = element.getAttribute('data-num');
        element.style.width = percent + '%';
    });
}

// Load the database when the page is ready
document.addEventListener('DOMContentLoaded', initDatabase); 
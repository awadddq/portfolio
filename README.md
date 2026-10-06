# Portfolio with SQLite Database for GitHub Pages

This portfolio website uses a SQLite database to store and display resume data. Since GitHub Pages is a static hosting service, we're using SQL.js to load and query the SQLite database in the browser.

## How It Works

1. The resume data is stored in a SQLite database file (`db/resume.db`)
2. SQL.js is loaded from a CDN to provide SQLite functionality in the browser
3. `javascript/resume-db.js` loads the database file and `javascript/app.js` renders it (projects, timeline, skills, languages) and runs the page routing and animations

## Updating the Database

To update the resume data, you can:

1. Edit the `db/resume.sql` file with your updated data
2. Run the update script:
   ```
   ./update-db.sh
   ```

Alternatively, you can manually update the database with:
   ```
   cat db/resume.sql | sqlite3 db/resume.db
   ```

## Admin Interface

Open `/admin.html` (via `./start-server.sh`) to manage the site content without touching SQL:

- **Work** — add, edit and reorder portfolio projects (title, category, year, role, cover image, summary, full description, tech stack, live and source links). The first three projects are featured on the home page; categories become the filter buttons on the Work page.
- **Cover images** — enter a path such as `image/works/my-project.jpg` (put the file in that folder), paste an image URL, or upload an image. Uploads are resized and stored inside the database.
- Add, edit, duplicate, delete (with undo) and reorder (drag & drop) Education, Career, Skills and Languages entries
- Live preview of each entry as it appears on the site
- Changes are auto-saved as a draft in your browser; open `index.html?preview=draft` to preview them on the real site
- **Publish & Export** downloads `resume.db` and `resume.sql` — replace the files in `db/`, then run `./deploy.sh`
- Import an existing `.db` / `.sql` file, and an SQL console for advanced edits

## Database Structure

The database contains the following tables:

- `works`: Portfolio projects shown on the Work page
- `education`: Educational background
- `career`: Work experience
- `skills`: Technical and professional skills
- `languages`: Language proficiency

## Technologies Used

- HTML/CSS/JavaScript (no frameworks — `css/site.css` and `javascript/app.js`)
- SQLite (via SQL.js)
- GitHub Pages for hosting

## Local Development

To run this site locally:

1. Clone the repository
2. Run the start server script:
   ```
   ./start-server.sh
   ```
3. Open your browser and navigate to http://localhost:8000

This script will automatically detect if you have Python or npx available and start a local server accordingly.

## Deployment to GitHub Pages

To deploy this site to GitHub Pages:

1. Make sure you have a GitHub repository set up
2. Run the deployment script:
   ```
   ./deploy.sh
   ```
3. Follow the prompts to commit and push your changes
4. Go to your repository settings and enable GitHub Pages if you haven't already

The script will automatically update the database, commit your changes, and push them to GitHub.

## License

MIT

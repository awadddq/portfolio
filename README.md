# Portfolio with SQLite Database for GitHub Pages

This portfolio website uses a SQLite database to store and display resume data. Since GitHub Pages is a static hosting service, we're using SQL.js to load and query the SQLite database in the browser.

## How It Works

1. The resume data is stored in a SQLite database file (`db/resume.db`)
2. SQL.js is loaded from a CDN to provide SQLite functionality in the browser
3. The `resume-db.js` script loads the database file and populates the HTML with the data

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

An admin interface is available at `/admin.html` that allows you to:
- View the database tables
- Run SQL queries
- Export the database as SQL statements

This is useful for managing your resume data without having to edit the SQL file directly.

## Database Structure

The database contains the following tables:

- `education`: Educational background
- `career`: Work experience
- `skills`: Technical and professional skills
- `languages`: Language proficiency

## Technologies Used

- HTML/CSS/JavaScript
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

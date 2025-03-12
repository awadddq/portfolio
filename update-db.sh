#!/bin/bash

# Update the SQLite database from the SQL file
echo "Updating resume database from SQL file..."
cat db/resume.sql | sqlite3 db/resume.db

# Check if the update was successful
if [ $? -eq 0 ]; then
    echo "Database updated successfully!"
    
    # Display the tables in the database
    echo "Tables in the database:"
    sqlite3 db/resume.db ".tables"
    
    # Display the number of rows in each table
    echo "Number of rows in each table:"
    echo "Education:"
    sqlite3 db/resume.db "SELECT COUNT(*) FROM education;"
    echo "Career:"
    sqlite3 db/resume.db "SELECT COUNT(*) FROM career;"
    echo "Skills:"
    sqlite3 db/resume.db "SELECT COUNT(*) FROM skills;"
    echo "Languages:"
    sqlite3 db/resume.db "SELECT COUNT(*) FROM languages;"
else
    echo "Error updating database!"
fi 
-- Resume Database Schema

-- Drop existing tables if they exist
DROP TABLE IF EXISTS education;
DROP TABLE IF EXISTS career;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS languages;

-- Education table
CREATE TABLE IF NOT EXISTS education (
    id INTEGER PRIMARY KEY,
    graduation_year TEXT,
    institution TEXT,
    degree TEXT,
    description TEXT
);

-- Career table
CREATE TABLE IF NOT EXISTS career (
    id INTEGER PRIMARY KEY,
    date_range TEXT,
    company TEXT,
    position TEXT,
    location TEXT
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY,
    name TEXT,
    percentage INTEGER,
    description TEXT
);

-- Language skills table
CREATE TABLE IF NOT EXISTS languages (
    id INTEGER PRIMARY KEY,
    name TEXT,
    percentage INTEGER
);

-- Insert Education Data
INSERT INTO education (graduation_year, institution, degree, description) VALUES
('Graduated 2017', 'Tokyo University of Technology', 'Bachelor of Computer Science', 'System Engineering'),
('Graduated 2012', 'College of Technology at Albaha', 'Diploma of Computer Technology', 'Computer Programming');

-- Insert Career Data
INSERT INTO career (date_range, company, position, location) VALUES
('July 2022 - Present', 'iotsquared', 'Senior Applications & Analytics Specialist', 'Riyadh, Saudi Arabia'),
('May 2021 - July 2022 (1 year 3 months)', 'specialized by stc', 'IT Application Specialist -May 2021 - July 2022, IT Application Engineer -May 2019 - May 2021', '');

-- Insert Skills Data
INSERT INTO skills (name, percentage, description) VALUES
('Programming', 90, 'I''m an expert in programming with a journey that started in 2012 when I developed my first Java-based application for Windows, which I still hold as a testament to my ongoing commitment to self-improvement. Over the years, I''ve continued to advance my skills by staying current with the latest frontend and backend frameworks and technologies. I''ve also gained valuable experience in cloud services such as Alibaba Cloud and Google Cloud, and I''ve delved into DevOps, specializing in creating efficient pipelines with Jenkins. For a comprehensive view of my work, you can explore my portfolio, which reflects my dedication to delivering high-quality solutions.'),
('UI/UX DESIGN', 95, 'As an experienced UI/UX professional, I take great pride in my ability to design interfaces that prioritize the user''s needs and seamlessly combine both form and function. With a deep understanding of user behavior and a discerning eye for aesthetics, I consistently deliver intuitive and visually appealing designs that elevate the overall user experience. My passion for staying abreast of the latest design trends and technologies ensures that I can provide innovative solutions that not only meet user requirements but also surpass their expectations. I am committed to crafting designs that not only look exceptional but also operate flawlessly, making a significant contribution to a product''s success and overall user satisfaction.'),
('Microcontroller', 60, 'As someone with a moderate level of experience in the fields of microcontrollers, embedded systems, and connectivity devices, I have had the privilege of working with advanced technologies, including FreeRTOS and Zephyr. My journey in this domain has equipped me with a solid understanding of hardware and software integration, real-time operating systems, and low-level programming. I have successfully applied these skills to develop solutions that facilitate seamless communication between embedded systems and connectivity devices. This experience has not only honed my technical abilities but has also nurtured my problem-solving skills, enabling me to tackle complex challenges within the realm of IoT and embedded systems.'),
('Renewable energy', 15, 'I am a beginner in the field of renewable energy, with only 15% experience. I have worked in the areas of green hydrogen generation and solar energy, and I am enthusiastic about expanding my understanding and applying it to future projects.');

-- Insert Language Skills Data
INSERT INTO languages (name, percentage) VALUES
('Japanese LANGUAGE', 90),
('ENGLISH LANGUAGE', 65); 
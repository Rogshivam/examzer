-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student') NOT NULL
);

-- Exams table
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Student groups table
CREATE TABLE student_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    exam_id INT,
    FOREIGN KEY (exam_id) REFERENCES exams(id)
);

-- Group members table
CREATE TABLE group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT,
    student_id INT,
    FOREIGN KEY (group_id) REFERENCES student_groups(id),
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Exam forms table
CREATE TABLE exam_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    exam_id INT,
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
    submission_data JSON,
    hall_ticket_pdf_path VARCHAR(255),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (exam_id) REFERENCES exams(id)
);

-- Notifications table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Audit logs table
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100),
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
); 

--   node
--   > const bcrypt = require('bcryptjs');
--   > bcrypt.hashSync('yourpassword', 10)
--   // Copy the output and use it in your SQL insert

-- INSERT INTO users (name, email, password_hash, role)
-- VALUES ('Admin', 'admin@example.com', '$2a$10$...', 'admin');

ALTER TABLE exams ADD COLUMN document_path VARCHAR(255);
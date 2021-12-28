-- Make initial table
CREATE TABLE todo (
  id SERIAL PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  creation_date TIMESTAMP DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE
  );
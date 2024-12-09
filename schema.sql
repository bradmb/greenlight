-- Create releases table
CREATE TABLE IF NOT EXISTS releases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_date DATE NOT NULL,
    status TEXT CHECK(status IN ('GO', 'NO_GO')) NOT NULL,
    explanation TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_by TEXT,
    updated_at DATETIME
);

-- Create excluded tickets table
CREATE TABLE IF NOT EXISTS excluded_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    release_id INTEGER NOT NULL,
    ticket_key TEXT NOT NULL,
    ticket_summary TEXT,
    ticket_url TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (release_id) REFERENCES releases(id)
); 
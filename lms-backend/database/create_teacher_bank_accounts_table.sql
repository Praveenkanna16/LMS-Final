-- Create teacher_bank_accounts table for storing teacher payment information
CREATE TABLE IF NOT EXISTS teacher_bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  teacher_id INTEGER NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_holder_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(50) NOT NULL,
  ifsc_code VARCHAR(20) NOT NULL,
  branch_name VARCHAR(255),
  account_type VARCHAR(50) DEFAULT 'savings',
  is_default BOOLEAN DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  verification_details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE(teacher_id, account_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_teacher_bank_accounts_teacher_id ON teacher_bank_accounts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_bank_accounts_status ON teacher_bank_accounts(status);

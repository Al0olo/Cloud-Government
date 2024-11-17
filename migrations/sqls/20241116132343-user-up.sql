CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'citizen',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    notification_preferences JSONB NOT NULL DEFAULT '{
        "email": true,
        "sms": true,
        "applicationUpdates": true,
        "documentRequests": true,
        "statusChanges": true,
        "generalAnnouncements": true
    }',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT users_role_check CHECK (role IN ('citizen', 'staff', 'admin')),
    CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'suspended', 'deleted'))
);
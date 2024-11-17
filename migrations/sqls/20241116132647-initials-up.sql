-- Insert admin user
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    role,
    status
) VALUES (
    'admin@permitportal.com',
    '$2b$10$hxZQZD9zqh7E1QUvqmkGIeUe8kMvzgiX3jF9Qz1DSzGXD5EDvcXyq', -- password: Admin@123
    'System',
    'Administrator',
    '+1234567890',
    'admin',
    'active'
);

-- Insert test staff user
INSERT INTO users (
    email,
    password_hash,
    first_name,
    last_name,
    phone,
    role,
    status
) VALUES (
    'staff@permitportal.com',
    '$2b$10$hxZQZD9zqh7E1QUvqmkGIeUe8kMvzgiX3jF9Qz1DSzGXD5EDvcXyq', -- password: Staff@123
    'Staff',
    'Member',
    '+1234567891',
    'staff',
    'active'
);
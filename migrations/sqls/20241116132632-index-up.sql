CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_type ON applications(type);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_assigned_to ON applications(assigned_to);
CREATE INDEX idx_applications_created_at ON applications(created_at);

CREATE INDEX idx_documents_application_id ON documents(application_id);
CREATE INDEX idx_documents_status ON documents(status);

CREATE INDEX idx_application_history_application_id ON application_history(application_id);
CREATE INDEX idx_application_history_created_at ON application_history(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
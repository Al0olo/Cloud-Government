CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES users(id),
    CONSTRAINT applications_type_check CHECK (type IN (
        'building_permit',
        'business_license',
        'planning_permit',
        'zoning_request'
    )),
    CONSTRAINT applications_status_check CHECK (status IN (
        'draft',
        'submitted',
        'under_review',
        'information_required',
        'approved',
        'rejected',
        'withdrawn'
    ))
);

-- ============================================================================
-- Susan AI Roofing Assistant - Sample Data & Testing
-- ============================================================================

-- Sample Users
INSERT INTO users (name, display_name, code, created_at, last_active) VALUES
('john.smith', 'John Smith', '1234', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
('sarah.jones', 'Sarah Jones', '5678', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('mike.wilson', 'Mike Wilson', '9012', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
('admin.user', 'Admin User', '0000', CURRENT_TIMESTAMP - INTERVAL '90 days', CURRENT_TIMESTAMP);

-- Get user IDs for reference
DO $$
DECLARE
    john_id UUID;
    sarah_id UUID;
    mike_id UUID;
    admin_id UUID;
    conv1_id UUID;
    conv2_id UUID;
    conv3_id UUID;
    conv4_id UUID;
    msg1_id BIGINT;
    msg2_id BIGINT;
    msg3_id BIGINT;
BEGIN
    -- Get user IDs
    SELECT id INTO john_id FROM users WHERE name = 'john.smith';
    SELECT id INTO sarah_id FROM users WHERE name = 'sarah.jones';
    SELECT id INTO mike_id FROM users WHERE name = 'mike.wilson';
    SELECT id INTO admin_id FROM users WHERE name = 'admin.user';

    -- Sample Conversations for John (normal conversation)
    INSERT INTO conversations (id, user_id, title, preview, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        john_id,
        'Question about roof inspection',
        'Hi Susan, I need help understanding when I should schedule a roof inspection for my commercial building.',
        CURRENT_TIMESTAMP - INTERVAL '3 days',
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    )
    RETURNING id INTO conv1_id;

    -- Messages for conversation 1 (normal)
    INSERT INTO messages (conversation_id, role, content, message_index) VALUES
    (conv1_id, 'user', 'Hi Susan, I need help understanding when I should schedule a roof inspection for my commercial building.', 0),
    (conv1_id, 'assistant', 'Hello! I would be happy to help you with roof inspection scheduling. For commercial buildings, I recommend annual inspections, plus additional checks after severe weather events. What type of roofing system do you have?', 1),
    (conv1_id, 'user', 'We have a TPO membrane roof installed about 5 years ago.', 2),
    (conv1_id, 'assistant', 'Great! TPO roofs typically last 15-20 years with proper maintenance. Since yours is 5 years old, an annual inspection is perfect. Would you like me to explain what the inspection should cover?', 3);

    -- Sample Conversation for Sarah (flagged - data theft)
    INSERT INTO conversations (id, user_id, title, preview, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        sarah_id,
        'Customer database export question',
        'How do I export all customer contact information from the system? I need the full database for a project.',
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    )
    RETURNING id INTO conv2_id;

    -- Messages for conversation 2 (suspicious)
    INSERT INTO messages (conversation_id, role, content, message_index) VALUES
    (conv2_id, 'user', 'How do I export all customer contact information from the system? I need the full database for a project.', 0)
    RETURNING id INTO msg1_id;

    INSERT INTO messages (conversation_id, role, content, message_index) VALUES
    (conv2_id, 'assistant', 'I can help with customer information, but I should mention that bulk data exports require manager approval. What specific information do you need?', 1);

    INSERT INTO messages (conversation_id, role, content, message_index) VALUES
    (conv2_id, 'user', 'I need everything - names, addresses, phone numbers, emails. Can you help me extract this to a USB drive before Friday?', 2)
    RETURNING id INTO msg2_id;

    -- Threat alerts for conversation 2
    INSERT INTO threat_alerts (conversation_id, message_id, pattern, category, severity, risk_score, highlighted_text) VALUES
    (conv2_id, msg1_id, 'export.*customer.*database', 'Data Theft', 'high', 75, 'export all customer contact information from the system'),
    (conv2_id, msg2_id, 'extract.*USB drive', 'Data Theft', 'critical', 90, 'extract this to a USB drive before Friday');

    -- Sample Conversation for Mike (flagged - financial fraud)
    INSERT INTO conversations (id, user_id, title, preview, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        mike_id,
        'Invoice payment processing',
        'Can you explain how to create invoices that bypass the approval system? I need to process payments faster.',
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    )
    RETURNING id INTO conv3_id;

    -- Messages for conversation 3 (suspicious)
    INSERT INTO messages (conversation_id, role, content, message_index) VALUES
    (conv3_id, 'user', 'Can you explain how to create invoices that bypass the approval system? I need to process payments faster.', 0)
    RETURNING id INTO msg3_id;

    INSERT INTO messages (conversation_id, role, content, message_index) VALUES
    (conv3_id, 'assistant', 'All invoices must go through our standard approval workflow for compliance. I can help you understand the normal process. What type of payment are you trying to process?', 1);

    -- Threat alert for conversation 3
    INSERT INTO threat_alerts (conversation_id, message_id, pattern, category, severity, risk_score, highlighted_text) VALUES
    (conv3_id, msg3_id, 'bypass.*approval', 'Financial Fraud', 'critical', 95, 'bypass the approval system');

    -- Sample normal conversation for Mike
    INSERT INTO conversations (id, user_id, title, preview, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        mike_id,
        'Roof warranty information',
        'What does our standard roof warranty cover?',
        CURRENT_TIMESTAMP - INTERVAL '5 hours',
        CURRENT_TIMESTAMP - INTERVAL '5 hours'
    )
    RETURNING id INTO conv4_id;

    INSERT INTO messages (conversation_id, role, content, message_index) VALUES
    (conv4_id, 'user', 'What does our standard roof warranty cover?', 0),
    (conv4_id, 'assistant', 'Our standard roofing warranties typically cover materials for 10-30 years and workmanship for 1-10 years, depending on the specific product and installation. Would you like details on a specific warranty type?', 1);

END $$;

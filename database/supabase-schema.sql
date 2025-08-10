-- SolAI v2 Database Schema for Supabase
-- Session memory and conversation persistence

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Conversations table for session memory
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  analysis_data JSONB,
  tool_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient session queries
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_session_id ON user_preferences(session_id);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC,
  metric_data JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_metrics_name_date ON system_metrics(metric_name, recorded_at DESC);

-- Tool usage analytics
CREATE TABLE IF NOT EXISTS tool_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  parameters JSONB,
  results JSONB,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tool_usage_session_id ON tool_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool_name ON tool_usage(tool_name);

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (customize based on your authentication setup)
CREATE POLICY "conversations_policy" ON conversations 
  FOR ALL USING (true); -- Adjust based on your authentication

CREATE POLICY "user_preferences_policy" ON user_preferences 
  FOR ALL USING (true); -- Adjust based on your authentication

CREATE POLICY "system_metrics_policy" ON system_metrics 
  FOR ALL USING (true); -- Adjust for admin access only

CREATE POLICY "tool_usage_policy" ON tool_usage 
  FOR ALL USING (true); -- Adjust based on your authentication

CREATE POLICY "tasks_policy" ON tasks 
  FOR ALL USING (true); -- Adjust based on your authentication

CREATE POLICY "workflow_templates_policy" ON workflow_templates 
  FOR ALL USING (true); -- Adjust based on your authentication

CREATE POLICY "workflow_instances_policy" ON workflow_instances 
  FOR ALL USING (true); -- Adjust based on your authentication

CREATE POLICY "notifications_policy" ON notifications 
  FOR ALL USING (true); -- Adjust based on your authentication

-- Tasks and reminders table for Story 2
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  due_date TIMESTAMP WITH TIME ZONE,
  reminder_time TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(50) DEFAULT 'ai', -- ai, user, calendar, workflow
  workflow_id UUID,
  parent_task_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Workflow templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'real_estate',
  template_data JSONB NOT NULL, -- workflow steps, conditions, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow instances table
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  template_id UUID REFERENCES workflow_templates(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, paused, cancelled
  progress JSONB DEFAULT '{}', -- track step completion
  variables JSONB DEFAULT '{}', -- dynamic values (client name, property address, etc.)
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Notifications table for dashboard display
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- task_reminder, calendar_event, workflow_update
  title VARCHAR(500) NOT NULL,
  message TEXT,
  action_url VARCHAR(500),
  priority VARCHAR(20) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_session_id ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_reminder_time ON tasks(reminder_time);

CREATE INDEX IF NOT EXISTS idx_workflow_instances_session_id ON workflow_instances(session_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_template_id ON workflow_instances(template_id);

CREATE INDEX IF NOT EXISTS idx_notifications_session_id ON notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Function to clean old conversations (data retention)
CREATE OR REPLACE FUNCTION cleanup_old_conversations()
RETURNS void AS $$
BEGIN
  DELETE FROM conversations 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM tool_usage 
  WHERE executed_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old notifications
  DELETE FROM notifications 
  WHERE expires_at < NOW() OR created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up completed tasks older than 30 days
  DELETE FROM tasks 
  WHERE status = 'completed' AND completed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
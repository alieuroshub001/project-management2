-- Project Management System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'team', 'client');

-- User Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'team',
  department TEXT,
  position TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_sign_in TIMESTAMP WITH TIME ZONE
);

-- Create a secure function to get the current user's ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE SQL SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

-- Projects Table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES profiles(id),
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planning',
  budget DECIMAL(12, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  estimated_hours DECIMAL(6, 2),
  actual_hours DECIMAL(6, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Project Team Members
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Comments Table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time Entries Table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  type TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Companies Table
CREATE TABLE client_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  industry TEXT,
  primary_contact_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id),
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Invoice Items Table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments Table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee Records Table (HR)
CREATE TABLE employee_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  employment_start_date DATE,
  employment_end_date DATE,
  salary DECIMAL(12, 2),
  contract_type TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Leave Requests Table
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  reason TEXT,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS Policies

-- Profiles table policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
USING (id = get_current_user_id());

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = get_current_user_id());

CREATE POLICY "Admin users can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = get_current_user_id() AND role = 'admin'
  )
);

CREATE POLICY "HR can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = get_current_user_id() AND role = 'hr'
  )
);

-- Projects table policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their projects"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = projects.id AND user_id = get_current_user_id()
  )
);

CREATE POLICY "Clients can view their own projects"
ON projects FOR SELECT
USING (client_id = get_current_user_id());

CREATE POLICY "Admin and HR can view all projects"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = get_current_user_id() AND (role = 'admin' OR role = 'hr')
  )
);

-- Tasks table policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view tasks in their projects"
ON tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = tasks.project_id AND user_id = get_current_user_id()
  )
);

CREATE POLICY "Assignees can update their tasks"
ON tasks FOR UPDATE
USING (assignee_id = get_current_user_id());

-- Create functions for handling timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_updated_at_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_projects
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_tasks
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_comments
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_time_entries
BEFORE UPDATE ON time_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_documents
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_client_companies
BEFORE UPDATE ON client_companies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_invoices
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_departments
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_employee_records
BEFORE UPDATE ON employee_records
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_leave_requests
BEFORE UPDATE ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
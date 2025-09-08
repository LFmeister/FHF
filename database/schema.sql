-- Supabase Database Schema for Accounting Project Management System
-- Execute these commands in your Supabase SQL editor

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    initial_balance DECIMAL(15,2) DEFAULT 0.00,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members table
CREATE TABLE public.project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Expenses table
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    category VARCHAR(100),
    expense_date DATE NOT NULL,
    receipt_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Balance adjustments table
CREATE TABLE public.balance_adjustments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'adjustment')),
    description TEXT,
    reference_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File uploads table
CREATE TABLE public.file_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#667eea',
    budget_limit DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, name)
);

-- Create indexes for better performance
CREATE INDEX idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX idx_projects_invite_code ON public.projects(invite_code);
CREATE INDEX idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX idx_project_members_user_id ON public.project_members(user_id);
CREATE INDEX idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX idx_balance_adjustments_project_id ON public.balance_adjustments(project_id);
CREATE INDEX idx_file_uploads_project_id ON public.file_uploads(project_id);
CREATE INDEX idx_file_uploads_expense_id ON public.file_uploads(expense_id);
CREATE INDEX idx_activity_logs_project_id ON public.activity_logs(project_id);
CREATE INDEX idx_categories_project_id ON public.categories(project_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balance_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view projects they are members of" ON public.projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = projects.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can update projects" ON public.projects
    FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Project members policies
CREATE POLICY "Users can view project members of their projects" ON public.project_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members pm 
            WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage members" ON public.project_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = project_members.project_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can join projects" ON public.project_members
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Expenses policies
CREATE POLICY "Project members can view expenses" ON public.expenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = expenses.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can create expenses" ON public.expenses
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = expenses.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own expenses" ON public.expenses
    FOR UPDATE USING (user_id = auth.uid());

-- Balance adjustments policies
CREATE POLICY "Project members can view balance adjustments" ON public.balance_adjustments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = balance_adjustments.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can create balance adjustments" ON public.balance_adjustments
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = balance_adjustments.project_id AND owner_id = auth.uid()
        )
    );

-- File uploads policies
CREATE POLICY "Project members can view files" ON public.file_uploads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = file_uploads.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can upload files" ON public.file_uploads
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = file_uploads.project_id AND user_id = auth.uid()
        )
    );

-- Activity logs policies
CREATE POLICY "Project members can view activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = activity_logs.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can create activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Categories policies
CREATE POLICY "Project members can view categories" ON public.categories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.project_members 
            WHERE project_id = categories.project_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Project owners can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.projects 
            WHERE id = categories.project_id AND owner_id = auth.uid()
        )
    );

-- Functions and triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update project balance
CREATE OR REPLACE FUNCTION update_project_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update balance based on the type of adjustment
        UPDATE public.projects 
        SET current_balance = current_balance + NEW.amount
        WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Reverse the balance change
        UPDATE public.projects 
        SET current_balance = current_balance - OLD.amount
        WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Trigger for balance adjustments
CREATE TRIGGER trigger_update_project_balance
    AFTER INSERT OR DELETE ON public.balance_adjustments
    FOR EACH ROW EXECUTE FUNCTION update_project_balance();

-- Function to automatically add project owner as member
CREATE OR REPLACE FUNCTION add_project_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.project_members (project_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'owner');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to add owner as member
CREATE TRIGGER trigger_add_project_owner_as_member
    AFTER INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION add_project_owner_as_member();

-- Storage bucket for file uploads (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);

-- Storage policies (run this in Supabase dashboard)
-- CREATE POLICY "Project members can upload files" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'project-files' AND
--         EXISTS (
--             SELECT 1 FROM public.project_members pm
--             JOIN public.file_uploads fu ON fu.project_id = pm.project_id
--             WHERE pm.user_id = auth.uid() AND fu.file_url LIKE '%' || name || '%'
--         )
--     );

-- CREATE POLICY "Project members can view files" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'project-files' AND
--         EXISTS (
--             SELECT 1 FROM public.project_members pm
--             JOIN public.file_uploads fu ON fu.project_id = pm.project_id
--             WHERE pm.user_id = auth.uid() AND fu.file_url LIKE '%' || name || '%'
--         )
--     );

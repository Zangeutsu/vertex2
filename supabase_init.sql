-- Create the app schema
CREATE SCHEMA IF NOT EXISTS app;

-- Enums
CREATE TYPE app.app_role AS ENUM ('admin', 'dispatcher', 'client', 'worker');
CREATE TYPE app.industry AS ENUM ('hospitality', 'security', 'logistics', 'construction', 'general');
CREATE TYPE app.worker_status AS ENUM ('active', 'inactive', 'on_hold', 'banned');
CREATE TYPE app.job_order_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE app.assignment_status AS ENUM ('proposed', 'confirmed', 'completed', 'no_show', 'cancelled');

-- 1. Profiles (linked to auth.users)
CREATE TABLE app.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role app.app_role DEFAULT 'worker',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clients
CREATE TABLE app.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry app.industry,
    billing_address TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sites (each belongs to a client)
CREATE TABLE app.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES app.clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Roles (Worker capabilities)
CREATE TABLE app.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- 5. Skills
CREATE TABLE app.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- 6. Workers
CREATE TABLE app.workers (
    id UUID PRIMARY KEY REFERENCES app.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    status app.worker_status DEFAULT 'active',
    languages TEXT[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. worker_roles (Junction)
CREATE TABLE app.worker_roles (
    worker_id UUID REFERENCES app.workers(id) ON DELETE CASCADE,
    role_id UUID REFERENCES app.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (worker_id, role_id)
);

-- 8. worker_skills (Junction)
CREATE TABLE app.worker_skills (
    worker_id UUID REFERENCES app.workers(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES app.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (worker_id, skill_id)
);

-- 9. worker_unavailability
CREATE TABLE app.worker_unavailability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES app.workers(id) ON DELETE CASCADE,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    reason TEXT,
    CHECK (start_at < end_at)
);

-- 10. Job Orders
CREATE TABLE app.job_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES app.clients(id) ON DELETE CASCADE,
    site_id UUID REFERENCES app.sites(id) ON DELETE CASCADE,
    role_id UUID REFERENCES app.roles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    needed_count INT DEFAULT 1,
    status app.job_order_status DEFAULT 'open',
    priority INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (start_at < end_at)
);

-- 11. Assignments
CREATE TABLE app.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_order_id UUID REFERENCES app.job_orders(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES app.workers(id) ON DELETE CASCADE,
    status app.assignment_status DEFAULT 'proposed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_order_id, worker_id)
);

-- 12. Audit Log
CREATE TABLE app.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SECURITY (RLS)
ALTER TABLE app.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.job_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.assignments ENABLE ROW LEVEL SECURITY;

-- Internal/Dispatcher/Admin access: Full access
CREATE POLICY internal_full_access ON app.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY internal_full_access ON app.clients FOR ALL TO authenticated USING (true);
CREATE POLICY internal_full_access ON app.sites FOR ALL TO authenticated USING (true);
CREATE POLICY internal_full_access ON app.roles FOR ALL TO authenticated USING (true);
CREATE POLICY internal_full_access ON app.skills FOR ALL TO authenticated USING (true);
CREATE POLICY internal_full_access ON app.workers FOR ALL TO authenticated USING (true);
CREATE POLICY internal_full_access ON app.job_orders FOR ALL TO authenticated USING (true);
CREATE POLICY internal_full_access ON app.assignments FOR ALL TO authenticated USING (true);

-- RPC: Validate Assignment
CREATE OR REPLACE FUNCTION app.validate_assignment(p_job_order_id UUID, p_worker_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job_start TIMESTAMPTZ;
    v_job_end TIMESTAMPTZ;
    v_overlap_count INT;
    v_unavailable BOOLEAN;
BEGIN
    SELECT start_at, end_at INTO v_job_start, v_job_end FROM app.job_orders WHERE id = p_job_order_id;
    
    -- Check overlap with confirmed assignments
    SELECT COUNT(*) INTO v_overlap_count
    FROM app.assignments a
    JOIN app.job_orders jo ON a.job_order_id = jo.id
    WHERE a.worker_id = p_worker_id
      AND a.status = 'confirmed'
      AND jo.start_at < v_job_end
      AND jo.end_at > v_job_start;

    -- Check unavailabilities
    SELECT EXISTS(
        SELECT 1 FROM app.worker_unavailability
        WHERE worker_id = p_worker_id
          AND start_at < v_job_end
          AND end_at > v_job_start
    ) INTO v_unavailable;

    RETURN jsonb_build_object(
        'has_overlap', v_overlap_count > 0,
        'is_unavailable', v_unavailable
    );
END;
$$;

-- Trigger: Block confirmed overlap
CREATE OR REPLACE FUNCTION app.check_assignment_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_job_start TIMESTAMPTZ;
    v_job_end TIMESTAMPTZ;
    v_overlap_count INT;
BEGIN
    IF NEW.status = 'confirmed' THEN
        SELECT start_at, end_at INTO v_job_start, v_job_end 
        FROM app.job_orders 
        WHERE id = NEW.job_order_id;

        SELECT COUNT(*) INTO v_overlap_count
        FROM app.assignments a
        JOIN app.job_orders jo ON a.job_order_id = jo.id
        WHERE a.worker_id = NEW.worker_id
          AND a.id != NEW.id
          AND a.status = 'confirmed'
          AND jo.start_at < v_job_end
          AND jo.end_at > v_job_start;

        IF v_overlap_count > 0 THEN
            RAISE EXCEPTION 'Worker already has a confirmed assignment during this period.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_block_assignment_overlap
BEFORE INSERT OR UPDATE ON app.assignments
FOR EACH ROW EXECUTE FUNCTION app.check_assignment_overlap();
-- SEED DATA
INSERT INTO app.clients (name, industry, billing_address, contact_email) VALUES
('Tech Corp', 'logistics', '123 Tech Lane', 'billing@techcorp.com'),
('Event Pro', 'hospitality', '456 Party Blvd', 'finance@eventpro.com');

INSERT INTO app.sites (client_id, name, address) 
SELECT id, 'Warehouse A', 'Industrial Zone' FROM app.clients WHERE name = 'Tech Corp' UNION ALL
SELECT id, 'Main Ballroom', 'City Center' FROM app.clients WHERE name = 'Event Pro';

INSERT INTO app.roles (name, description) VALUES
('Forklift Driver', 'Operates heavy machinery in warehouse'),
('Waiter', 'Food service for events'),
('Security Guard', 'General security services');

INSERT INTO app.skills (name) VALUES
('Language: English'),
('First Aid'),
('Driving License');

-- Add some dummy profiles for testing
DO $$
DECLARE
    v_admin_id UUID := gen_random_uuid();
    v_worker1_id UUID := gen_random_uuid();
    v_worker2_id UUID := gen_random_uuid();
    v_worker3_id UUID := gen_random_uuid();
    v_worker4_id UUID := gen_random_uuid();
BEGIN
    -- profiles
    INSERT INTO app.profiles (id, email, full_name, role) VALUES
    (v_admin_id, 'admin@test.com', 'System Admin', 'admin'),
    (v_worker1_id, 'john@worker.com', 'John Doe', 'worker'),
    (v_worker2_id, 'jane@worker.com', 'Jane Smith', 'worker'),
    (v_worker3_id, 'mike@worker.com', 'Mike Ross', 'worker'),
    (v_worker4_id, 'rachel@worker.com', 'Rachel Zane', 'worker');

    -- workers
    INSERT INTO app.workers (id, first_name, last_name, status, languages) VALUES
    (v_worker1_id, 'John', 'Doe', 'active', ARRAY['English', 'Portuguese']),
    (v_worker2_id, 'Jane', 'Smith', 'active', ARRAY['English']),
    (v_worker3_id, 'Mike', 'Ross', 'active', ARRAY['English', 'Spanish']),
    (v_worker4_id, 'Rachel', 'Zane', 'active', ARRAY['English']);
END $$;

INSERT INTO app.job_orders (client_id, site_id, role_id, title, start_at, end_at, needed_count, status)
SELECT 
    c.id, s.id, r.id, 'Morning Logistics', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 8 hours', 2, 'open'
FROM app.clients c, app.sites s, app.roles r
WHERE c.name = 'Tech Corp' AND s.name = 'Warehouse A' AND r.name = 'Forklift Driver'
LIMIT 1;

INSERT INTO app.job_orders (client_id, site_id, role_id, title, start_at, end_at, needed_count, status)
SELECT 
    c.id, s.id, r.id, 'Gala Dinner', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 6 hours', 5, 'open'
FROM app.clients c, app.sites s, app.roles r
WHERE c.name = 'Event Pro' AND s.name = 'Main Ballroom' AND r.name = 'Waiter'
LIMIT 1;

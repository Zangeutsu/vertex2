export type AppRole = 'admin' | 'dispatcher' | 'client' | 'worker';
export type Industry = 'hospitality' | 'security' | 'logistics' | 'construction' | 'general';
export type WorkerStatus = 'active' | 'inactive' | 'on_hold' | 'banned';
export type JobOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type AssignmentStatus = 'proposed' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';

export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    role: AppRole;
    created_at: string;
}

export interface Client {
    id: string;
    name: string;
    industry: Industry | null;
    billing_address: string | null;
    contact_email: string | null;
}

export interface Site {
    id: string;
    client_id: string;
    name: string;
    address: string | null;
    latitude?: number;
    longitude?: number;
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
}

export interface Skill {
    id: string;
    name: string;
}

export interface Worker {
    id: string;
    first_name: string;
    last_name: string;
    status: WorkerStatus;
    languages: string[];
    date_of_birth: string | null;
    notes: string | null;
    tags: string[];
    experience_years: number;
    city?: string;
    roles?: Role[];
    skills?: Skill[];
    profiles?: Profile;
}

export type ScheduleType = 'one_time' | 'daily' | 'weekly' | 'monthly';

export interface JobOrder {
    id: string;
    client_id: string;
    site_id: string;
    role_id: string;
    title: string;
    start_at: string;
    end_at: string | null;
    needed_count: number;
    status: JobOrderStatus;
    priority: number;
    city?: string;
    notes: string | null;
    // Flexible scheduling fields
    schedule_type?: ScheduleType;
    start_time?: string; // HH:MM format
    end_time?: string;   // HH:MM format
    duration_hours?: number;
    work_days?: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
    weekdays_only?: boolean;
    weekends_only?: boolean;
    // Relations
    client?: Client;
    site?: Site;
    role?: Role;
}

export interface Assignment {
    id: string;
    job_order_id: string;
    worker_id: string;
    status: AssignmentStatus;
    created_at: string;
    worker?: Worker;
    job_order?: JobOrder;
}

// ============ Backend (FastAPI) Types ============

// ETTWorker is the backend version of Worker (uses UUID string IDs)
export interface ETTWorker {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    status: WorkerStatus;
    city?: string;
    languages: string[];
    date_of_birth?: string;
    notes?: string;
    created_at?: string;
}

export interface WorkerDetail extends ETTWorker {
    contracts?: Contract[];
    compliance_records?: ComplianceRecord[];
    timesheets?: Timesheet[];
}

export type ContractStatus = 'draft' | 'active' | 'terminated' | 'expired';

export interface Contract {
    id: string;
    worker_id: string;
    client_id: string;
    role: string;
    start_date: string;
    end_date?: string;
    hourly_rate?: number;
    status: ContractStatus;
    document_url?: string;
    created_at?: string;
}

export interface Timesheet {
    id: string;
    worker_id: string;
    client_id: string;
    date: string;
    hours: number;
    notes?: string;
    billed: boolean;
    created_at?: string;
}

export type ComplianceType = 'medical_exam' | 'training' | 'document';
export type ComplianceStatus = 'pending' | 'scheduled' | 'completed' | 'overdue';

export interface ComplianceRecord {
    id: string;
    worker_id: string;
    type: ComplianceType;
    status: ComplianceStatus;
    due_date: string;
    completed_at?: string;
    document_url?: string;
    notes?: string;
    created_at?: string;
}

export interface Shift {
    id: string;
    client_id: string;
    date: string;
    role: string;
    start_time: string;
    end_time: string;
    required_count: number;
    bookings?: Booking[];
    client?: Client;
}

export interface Booking {
    id: string;
    shift_id: string;
    worker_id: string;
    status: 'confirmed' | 'cancelled';
    worker?: ETTWorker;
}

export interface Activity {
    id: string;
    type: string;
    entity_type: string;
    entity_id: string;
    description: string;
    created_at: string;
}

export interface DashboardData {
    total_workers: number;
    total_clients: number;
    active_contracts: number;
    pending_compliance: number;
    recent_activities: Activity[];
}

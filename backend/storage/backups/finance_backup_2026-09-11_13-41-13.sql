--
-- PostgreSQL database dump
--

\restrict q6nUEUbuF6OMvV2G0sEemOGZu4POmOboAsCtQbTJ5y55W6wx66meARbbTf9yiz3

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_years; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_years (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.academic_years OWNER TO postgres;

--
-- Name: account_take_ons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_take_ons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    account_id uuid,
    account_name character varying(150) NOT NULL,
    financial_year character varying(20) DEFAULT '2026'::character varying NOT NULL,
    balance_type character varying(20) DEFAULT 'DEBIT'::character varying NOT NULL,
    amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    as_of_date date DEFAULT CURRENT_DATE,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.account_take_ons OWNER TO postgres;

--
-- Name: account_transfers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_transfers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    from_account_id uuid,
    from_account_name character varying(150) NOT NULL,
    to_account_id uuid,
    to_account_name character varying(150) NOT NULL,
    amount numeric(15,2) NOT NULL,
    transfer_date date DEFAULT CURRENT_DATE NOT NULL,
    reference_number character varying(100) NOT NULL,
    narration text,
    status character varying(50) DEFAULT 'COMPLETED'::character varying,
    created_by_user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.account_transfers OWNER TO postgres;

--
-- Name: account_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20),
    is_default boolean DEFAULT false,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.account_types OWNER TO postgres;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    account_number character varying(100) NOT NULL,
    bank_name character varying(150),
    branch character varying(100),
    account_type_id uuid,
    account_type character varying(100) DEFAULT 'OPERATIONS'::character varying,
    currency character varying(10) DEFAULT 'KES'::character varying,
    opening_balance numeric(15,2) DEFAULT 0.00,
    current_balance numeric(15,2) DEFAULT 0.00,
    is_cash_account boolean DEFAULT false,
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: asset_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(50),
    depreciation_type character varying(50) DEFAULT 'ANNUALLY'::character varying,
    depreciation_method character varying(50) DEFAULT 'STRAIGHT_LINE'::character varying,
    depreciation_rate numeric(5,2) DEFAULT 0.00,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.asset_categories OWNER TO postgres;

--
-- Name: asset_depreciation_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_depreciation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    fiscal_year character varying(50) NOT NULL,
    depreciation_amount numeric(14,2) NOT NULL,
    accumulated_depreciation numeric(14,2) NOT NULL,
    net_book_value numeric(14,2) NOT NULL,
    posted_to_gl boolean DEFAULT false,
    calculated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.asset_depreciation_logs OWNER TO postgres;

--
-- Name: asset_maintenance_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_maintenance_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    asset_id uuid NOT NULL,
    service_date date DEFAULT CURRENT_DATE NOT NULL,
    service_type character varying(100) NOT NULL,
    cost numeric(12,2) DEFAULT 0.00,
    vendor character varying(150),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.asset_maintenance_logs OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid,
    ip_address character varying(50),
    user_agent text,
    before_state jsonb,
    after_state jsonb,
    checksum character varying(64) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: bank_integrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_integrations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    bank_name character varying(255) NOT NULL,
    account_name character varying(255) NOT NULL,
    account_number character varying(100) NOT NULL,
    paybill character varying(50),
    branch character varying(100) DEFAULT 'Main Branch'::character varying,
    webhook_secret character varying(255),
    auto_match_pattern character varying(100) DEFAULT 'ADM-NO'::character varying,
    status character varying(50) DEFAULT 'CONNECTED'::character varying,
    last_synced_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT bank_integrations_status_check CHECK (((status)::text = ANY ((ARRAY['CONNECTED'::character varying, 'ACTIVE'::character varying, 'PAUSED'::character varying, 'DISCONNECTED'::character varying])::text[])))
);


ALTER TABLE public.bank_integrations OWNER TO postgres;

--
-- Name: bursaries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bursaries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    student_id uuid NOT NULL,
    sponsor_name character varying(255) NOT NULL,
    cheque_number character varying(100),
    amount numeric(12,2) NOT NULL,
    disbursement_date date DEFAULT CURRENT_DATE,
    term_id uuid,
    academic_year_id uuid,
    notes text,
    status character varying(50) DEFAULT 'DISBURSED'::character varying,
    ledger_entry_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bursaries OWNER TO postgres;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    level_order integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: deletion_audits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.deletion_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id character varying(100) NOT NULL,
    entity_identifier character varying(200) NOT NULL,
    deleted_by character varying(150) NOT NULL,
    reason text,
    snapshot_data jsonb,
    can_restore boolean DEFAULT true,
    is_restored boolean DEFAULT false,
    deleted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    restored_at timestamp without time zone
);


ALTER TABLE public.deletion_audits OWNER TO postgres;

--
-- Name: donations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    donor_id uuid NOT NULL,
    category_id uuid,
    receipt_number character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    purpose text NOT NULL,
    payment_method character varying(50) DEFAULT 'BANK_TRANSFER'::character varying NOT NULL,
    bank_account character varying(150) DEFAULT 'Development / Projects Account (Equity)'::character varying,
    transaction_reference character varying(100),
    donation_date date DEFAULT CURRENT_DATE,
    status character varying(50) DEFAULT 'RECEIVED'::character varying,
    received_by_user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT donations_status_check CHECK (((status)::text = ANY ((ARRAY['RECEIVED'::character varying, 'BANKED'::character varying, 'PLEDGED'::character varying])::text[])))
);


ALTER TABLE public.donations OWNER TO postgres;

--
-- Name: donors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    donor_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    donor_type character varying(50) DEFAULT 'INDIVIDUAL'::character varying,
    contact_person character varying(255),
    phone character varying(50),
    email character varying(255),
    address text,
    total_donated numeric(12,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT donors_donor_type_check CHECK (((donor_type)::text = ANY ((ARRAY['INDIVIDUAL'::character varying, 'ORGANIZATION'::character varying, 'ALUMNI'::character varying, 'NGO_GOVERNMENT'::character varying, 'CORPORATE'::character varying])::text[])))
);


ALTER TABLE public.donors OWNER TO postgres;

--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50),
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expense_categories OWNER TO postgres;

--
-- Name: expense_vouchers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expense_vouchers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    voucher_number character varying(100) NOT NULL,
    category_id uuid NOT NULL,
    term_id uuid,
    payee_name character varying(255) NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(50) NOT NULL,
    description text NOT NULL,
    lpo_number character varying(100),
    status character varying(50) DEFAULT 'DRAFT'::character varying,
    requested_by_user_id uuid NOT NULL,
    approved_by_user_id uuid,
    disbursed_by_user_id uuid,
    disbursed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expense_vouchers_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['BANK_TRANSFER'::character varying, 'MPESA_B2C'::character varying, 'CHEQUE'::character varying, 'PETTY_CASH'::character varying])::text[]))),
    CONSTRAINT expense_vouchers_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'REQUESTED'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'DISBURSED'::character varying, 'CANCELLED'::character varying, 'VOID'::character varying])::text[])))
);


ALTER TABLE public.expense_vouchers OWNER TO postgres;

--
-- Name: fee_adjustments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_adjustments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    student_id uuid NOT NULL,
    adjustment_type character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    reference_number character varying(100) NOT NULL,
    reason text NOT NULL,
    approved_by_user_id uuid,
    ledger_entry_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fee_adjustments_adjustment_type_check CHECK (((adjustment_type)::text = ANY ((ARRAY['CREDIT_NOTE'::character varying, 'DEBIT_NOTE'::character varying, 'DISCOUNT_WAIVER'::character varying])::text[])))
);


ALTER TABLE public.fee_adjustments OWNER TO postgres;

--
-- Name: fee_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    invoice_number character varying(100) NOT NULL,
    student_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    term_id uuid NOT NULL,
    fee_structure_id uuid,
    total_billed numeric(12,2) NOT NULL,
    due_date date NOT NULL,
    status character varying(50) DEFAULT 'ISSUED'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fee_invoices_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'ISSUED'::character varying, 'PARTIALLY_PAID'::character varying, 'PAID'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.fee_invoices OWNER TO postgres;

--
-- Name: fee_refunds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_refunds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    refund_number character varying(50) NOT NULL,
    student_id uuid NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'CHEQUE'::character varying NOT NULL,
    cheque_number character varying(100),
    bank_account character varying(100) DEFAULT 'Main School Account'::character varying,
    recipient_name character varying(255) NOT NULL,
    reason text NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    requested_by_user_id uuid,
    approved_by_user_id uuid,
    disbursed_by_user_id uuid,
    ledger_entry_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fee_refunds OWNER TO postgres;

--
-- Name: fee_structure_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_structure_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    fee_structure_id uuid NOT NULL,
    vote_head_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    is_optional boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fee_structure_items OWNER TO postgres;

--
-- Name: fee_structures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_structures (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    term_id uuid NOT NULL,
    class_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    total_amount numeric(12,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    boarding_status character varying(50) DEFAULT 'ALL'::character varying
);


ALTER TABLE public.fee_structures OWNER TO postgres;

--
-- Name: fixed_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fixed_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    asset_tag character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    category_id uuid,
    serial_no character varying(150),
    purchase_date date DEFAULT CURRENT_DATE NOT NULL,
    purchase_cost numeric(14,2) DEFAULT 0.00 NOT NULL,
    salvage_value numeric(14,2) DEFAULT 0.00,
    useful_life_years integer DEFAULT 5,
    location character varying(150),
    custodian_id uuid,
    condition character varying(50) DEFAULT 'Good'::character varying,
    status character varying(50) DEFAULT 'In Use'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.fixed_assets OWNER TO postgres;

--
-- Name: grants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    grant_type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    amount numeric(12,2) NOT NULL,
    reference_number character varying(100),
    disbursement_date date DEFAULT CURRENT_DATE,
    term_id uuid,
    academic_year_id uuid,
    bank_account character varying(100) DEFAULT 'Main Operations Account'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.grants OWNER TO postgres;

--
-- Name: guardians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.guardians (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    email character varying(255),
    id_number character varying(50),
    relationship character varying(50) DEFAULT 'Parent'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.guardians OWNER TO postgres;

--
-- Name: inventory_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(50),
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_categories OWNER TO postgres;

--
-- Name: inventory_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    item_code character varying(50) NOT NULL,
    name character varying(200) NOT NULL,
    category_id uuid,
    store_id uuid,
    unit_of_measure character varying(100) DEFAULT 'Pieces'::character varying,
    reorder_level integer DEFAULT 10,
    quantity_in_stock numeric(15,2) DEFAULT 0.00,
    unit_buying_price numeric(15,2) DEFAULT 0.00,
    selling_price numeric(15,2) DEFAULT 0.00,
    status character varying(50) DEFAULT 'In Stock'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_items OWNER TO postgres;

--
-- Name: inventory_stores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_stores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    code character varying(50),
    location character varying(150),
    manager character varying(150),
    status character varying(50) DEFAULT 'Active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_stores OWNER TO postgres;

--
-- Name: inventory_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    item_id uuid NOT NULL,
    store_id uuid,
    transaction_type character varying(50) NOT NULL,
    reference_no character varying(100),
    quantity numeric(15,2) NOT NULL,
    unit_price numeric(15,2) DEFAULT 0.00,
    total_amount numeric(15,2) DEFAULT 0.00,
    recipient_department character varying(150),
    issued_to character varying(150),
    payment_method character varying(50),
    notes text,
    transaction_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_transactions OWNER TO postgres;

--
-- Name: inventory_units; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    short_code character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inventory_units OWNER TO postgres;

--
-- Name: journal_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    entry_number character varying(100) NOT NULL,
    reference_number character varying(100),
    entry_date date DEFAULT CURRENT_DATE NOT NULL,
    narration text NOT NULL,
    total_debit numeric(15,2) DEFAULT 0.00 NOT NULL,
    total_credit numeric(15,2) DEFAULT 0.00 NOT NULL,
    status character varying(50) DEFAULT 'POSTED'::character varying,
    created_by_user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.journal_entries OWNER TO postgres;

--
-- Name: journal_entry_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.journal_entry_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    journal_entry_id uuid NOT NULL,
    account_id uuid,
    account_name character varying(150) NOT NULL,
    vote_head_id uuid,
    debit_amount numeric(15,2) DEFAULT 0.00,
    credit_amount numeric(15,2) DEFAULT 0.00,
    memo text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.journal_entry_items OWNER TO postgres;

--
-- Name: local_purchase_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.local_purchase_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    lpo_number character varying(50) NOT NULL,
    supplier_id uuid,
    supplier_name character varying(255) NOT NULL,
    items_description text NOT NULL,
    quantity_details character varying(255),
    estimated_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    delivery_date date,
    status character varying(50) DEFAULT 'ISSUED'::character varying NOT NULL,
    issued_by_user_id uuid,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.local_purchase_orders OWNER TO postgres;

--
-- Name: messaging_broadcasts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messaging_broadcasts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    channel character varying(50) DEFAULT 'SMS'::character varying,
    recipient_type character varying(100) NOT NULL,
    total_recipients integer DEFAULT 0,
    delivered_count integer DEFAULT 0,
    failed_count integer DEFAULT 0,
    status character varying(50) DEFAULT 'Completed'::character varying,
    message_content text,
    sent_by character varying(150),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messaging_broadcasts OWNER TO postgres;

--
-- Name: messaging_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messaging_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    template_type character varying(50) DEFAULT 'FEE_BALANCE'::character varying NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.messaging_templates OWNER TO postgres;

--
-- Name: other_income_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.other_income_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    account_code character varying(50),
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.other_income_categories OWNER TO postgres;

--
-- Name: other_income_customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.other_income_customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    customer_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100) DEFAULT 'General Customer'::character varying,
    phone character varying(50),
    email character varying(255),
    kra_pin character varying(50),
    address text,
    opening_balance numeric(12,2) DEFAULT 0.00,
    current_balance numeric(12,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.other_income_customers OWNER TO postgres;

--
-- Name: other_income_invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.other_income_invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    invoice_number character varying(100) NOT NULL,
    customer_id uuid NOT NULL,
    category_id uuid NOT NULL,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    paid_amount numeric(12,2) DEFAULT 0.00,
    balance numeric(12,2) NOT NULL,
    due_date date NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT other_income_invoices_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PARTIAL'::character varying, 'PAID'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.other_income_invoices OWNER TO postgres;

--
-- Name: other_income_receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.other_income_receipts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    receipt_number character varying(100) NOT NULL,
    customer_id uuid,
    category_id uuid NOT NULL,
    invoice_id uuid,
    payer_name character varying(255) NOT NULL,
    amount numeric(12,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'BANK_TRANSFER'::character varying NOT NULL,
    bank_account character varying(150) DEFAULT 'Main Operations Account (KCB)'::character varying,
    transaction_reference character varying(100),
    cheque_number character varying(100),
    description text NOT NULL,
    received_by_user_id uuid NOT NULL,
    receipt_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT other_income_receipts_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['BANK_TRANSFER'::character varying, 'MPESA_PAYBILL'::character varying, 'CASH'::character varying, 'CHEQUE'::character varying, 'DIRECT_DEPOSIT'::character varying])::text[])))
);


ALTER TABLE public.other_income_receipts OWNER TO postgres;

--
-- Name: other_income_take_ons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.other_income_take_ons (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    description text NOT NULL,
    academic_year_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.other_income_take_ons OWNER TO postgres;

--
-- Name: payment_reversals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_reversals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    payment_transaction_id uuid,
    receipt_number character varying(100) NOT NULL,
    student_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    channel character varying(50),
    requested_by_user_id uuid,
    approved_by_user_id uuid,
    reason text NOT NULL,
    rejection_reason text,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    reversing_ledger_id uuid,
    requested_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    reviewed_at timestamp with time zone,
    CONSTRAINT payment_reversals_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying])::text[])))
);


ALTER TABLE public.payment_reversals OWNER TO postgres;

--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    channel character varying(50) NOT NULL,
    reference_number character varying(100) NOT NULL,
    amount numeric(12,2) NOT NULL,
    payer_phone character varying(50),
    payer_name character varying(255),
    account_reference character varying(100),
    payment_date timestamp with time zone NOT NULL,
    raw_payload jsonb,
    reconciliation_status character varying(50) DEFAULT 'UNMATCHED'::character varying,
    reconciled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_transactions_channel_check CHECK (((channel)::text = ANY (ARRAY['MPESA_C2B'::text, 'MPESA_STK'::text, 'M-PESA'::text, 'MPESA'::text, 'BANK_TRANSFER'::text, 'BANK_DEPOSIT'::text, 'BANK'::text, 'CASH'::text, 'CHEQUE'::text, 'CHECK'::text, 'OTHER'::text, 'IN_KIND'::text, 'BURSARY'::text, 'GRANT'::text]))),
    CONSTRAINT payment_transactions_reconciliation_status_check CHECK (((reconciliation_status)::text = ANY ((ARRAY['AUTO_MATCHED'::character varying, 'MANUALLY_MATCHED'::character varying, 'UNMATCHED'::character varying, 'AMBIGUOUS'::character varying, 'IGNORED'::character varying])::text[])))
);


ALTER TABLE public.payment_transactions OWNER TO postgres;

--
-- Name: payments_in_kind; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments_in_kind (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    student_id uuid NOT NULL,
    item_name character varying(255) NOT NULL,
    quantity numeric(10,2) NOT NULL,
    unit_of_measure character varying(50) DEFAULT 'Bags'::character varying NOT NULL,
    unit_price numeric(12,2) NOT NULL,
    total_value numeric(12,2) NOT NULL,
    receipt_number character varying(100) NOT NULL,
    delivered_by character varying(255) NOT NULL,
    received_by_user_id uuid,
    notes text,
    ledger_entry_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payments_in_kind OWNER TO postgres;

--
-- Name: payroll_periods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_periods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    period_month character varying(50) NOT NULL,
    year integer DEFAULT 2026 NOT NULL,
    month integer DEFAULT 7 NOT NULL,
    total_gross numeric(15,2) DEFAULT 0.00,
    total_taxable numeric(15,2) DEFAULT 0.00,
    total_paye numeric(15,2) DEFAULT 0.00,
    total_nssf numeric(15,2) DEFAULT 0.00,
    total_shif numeric(15,2) DEFAULT 0.00,
    total_housing_levy numeric(15,2) DEFAULT 0.00,
    total_custom_deductions numeric(15,2) DEFAULT 0.00,
    total_net_payable numeric(15,2) DEFAULT 0.00,
    staff_count integer DEFAULT 0,
    status character varying(50) DEFAULT 'Approved'::character varying,
    processed_by uuid,
    approved_by uuid,
    disbursed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payroll_periods OWNER TO postgres;

--
-- Name: payroll_statutory_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payroll_statutory_rates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    nssf_max numeric(15,2) DEFAULT 2160.00,
    shif_rate numeric(6,2) DEFAULT 2.75,
    housing_levy_employee numeric(6,2) DEFAULT 1.50,
    housing_levy_employer numeric(6,2) DEFAULT 1.50,
    personal_relief numeric(15,2) DEFAULT 2400.00,
    insurance_relief_rate numeric(6,2) DEFAULT 15.00,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payroll_statutory_rates OWNER TO postgres;

--
-- Name: payslips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payslips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    payroll_period_id uuid NOT NULL,
    staff_id uuid NOT NULL,
    staff_name character varying(150) NOT NULL,
    staff_number character varying(50) NOT NULL,
    role character varying(100),
    department character varying(100),
    kra_pin character varying(50),
    nssf_no character varying(50),
    nhif_no character varying(50),
    bank_name character varying(100),
    bank_account character varying(100),
    basic_salary numeric(15,2) DEFAULT 0.00 NOT NULL,
    allowances numeric(15,2) DEFAULT 0.00,
    gross_pay numeric(15,2) DEFAULT 0.00 NOT NULL,
    nssf_tier_1 numeric(15,2) DEFAULT 0.00,
    nssf_tier_2 numeric(15,2) DEFAULT 0.00,
    total_nssf numeric(15,2) DEFAULT 0.00,
    taxable_pay numeric(15,2) DEFAULT 0.00,
    paye_tax numeric(15,2) DEFAULT 0.00,
    personal_relief numeric(15,2) DEFAULT 2400.00,
    insurance_relief numeric(15,2) DEFAULT 0.00,
    net_tax_paye numeric(15,2) DEFAULT 0.00,
    shif_nhif numeric(15,2) DEFAULT 0.00,
    housing_levy numeric(15,2) DEFAULT 0.00,
    sacco_deductions numeric(15,2) DEFAULT 0.00,
    welfare_deductions numeric(15,2) DEFAULT 0.00,
    loan_advance_recovery numeric(15,2) DEFAULT 0.00,
    total_deductions numeric(15,2) DEFAULT 0.00,
    net_pay numeric(15,2) DEFAULT 0.00 NOT NULL,
    status character varying(50) DEFAULT 'Processed'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payslips OWNER TO postgres;

--
-- Name: petty_cash_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.petty_cash_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    voucher_number character varying(50) NOT NULL,
    entry_type character varying(50) NOT NULL,
    amount numeric(15,2) NOT NULL,
    payee_name character varying(255) NOT NULL,
    category_id uuid,
    receipt_reference character varying(100),
    balance_after numeric(15,2) DEFAULT 0.00 NOT NULL,
    description text,
    recorded_by_user_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.petty_cash_entries OWNER TO postgres;

--
-- Name: pledges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pledges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    student_id uuid NOT NULL,
    guardian_id uuid,
    amount numeric(12,2) NOT NULL,
    pledge_date date NOT NULL,
    expected_payment_date date NOT NULL,
    fulfilled_amount numeric(12,2) DEFAULT 0.00,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pledges_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PARTIAL'::character varying, 'FULFILLED'::character varying, 'OVERDUE'::character varying, 'CANCELLED'::character varying])::text[])))
);


ALTER TABLE public.pledges OWNER TO postgres;

--
-- Name: pocket_money_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pocket_money_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    student_id uuid NOT NULL,
    current_balance numeric(12,2) DEFAULT 0.00 NOT NULL,
    daily_spend_limit numeric(12,2) DEFAULT 0.00,
    is_locked boolean DEFAULT false,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pocket_money_accounts OWNER TO postgres;

--
-- Name: pocket_money_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pocket_money_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    account_id uuid NOT NULL,
    student_id uuid NOT NULL,
    transaction_type character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    channel character varying(50) DEFAULT 'Cash'::character varying,
    reference_no character varying(100),
    served_by character varying(150) DEFAULT 'Accounts Desk'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pocket_money_transactions OWNER TO postgres;

--
-- Name: receipts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.receipts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    receipt_number character varying(100) NOT NULL,
    student_id uuid NOT NULL,
    ledger_entry_id uuid NOT NULL,
    payment_transaction_id uuid,
    amount numeric(12,2) NOT NULL,
    payment_mode character varying(50) NOT NULL,
    reference_code character varying(100),
    pdf_url text,
    issued_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.receipts OWNER TO postgres;

--
-- Name: reconciliation_matches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reconciliation_matches (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    payment_transaction_id uuid NOT NULL,
    student_id uuid NOT NULL,
    ledger_entry_id uuid,
    receipt_id uuid,
    match_strategy character varying(100) NOT NULL,
    confidence_score numeric(5,2) DEFAULT 100.00 NOT NULL,
    matched_by_user_id uuid,
    match_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reconciliation_matches OWNER TO postgres;

--
-- Name: roles_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    role character varying(50) NOT NULL,
    permission_key character varying(100) NOT NULL,
    is_granted boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles_permissions OWNER TO postgres;

--
-- Name: schools; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schools (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50) NOT NULL,
    subdomain character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    address text,
    logo_url text,
    currency character varying(10) DEFAULT 'KES'::character varying,
    mpesa_paybill character varying(50),
    mpesa_consumer_key text,
    mpesa_consumer_secret text,
    mpesa_passkey text,
    sms_sender_id character varying(50) DEFAULT 'SCHOOLFIN'::character varying,
    sms_api_key text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    motto character varying(255) DEFAULT 'Strive for Excellence'::character varying,
    registration_number character varying(100) DEFAULT '2040123'::character varying,
    county character varying(100) DEFAULT 'Machakos County'::character varying,
    postal_address character varying(255) DEFAULT 'P.O. Box 100 - 90100'::character varying,
    bank_name character varying(255) DEFAULT 'Co-operative Bank of Kenya'::character varying,
    bank_account_name character varying(255) DEFAULT 'Nduundune Secondary School'::character varying,
    bank_account_number character varying(100) DEFAULT '01129000000000'::character varying,
    bank_branch character varying(100) DEFAULT 'Machakos Branch'::character varying
);


ALTER TABLE public.schools OWNER TO postgres;

--
-- Name: sms_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sms_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    recipient_phone character varying(50) NOT NULL,
    student_id uuid,
    message_type character varying(50) NOT NULL,
    message_body text NOT NULL,
    status character varying(50) DEFAULT 'SENT'::character varying,
    provider_message_id character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.sms_logs OWNER TO postgres;

--
-- Name: staff_allowance_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_allowance_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) DEFAULT 'Fixed'::character varying,
    amount numeric(15,2) DEFAULT 0.00,
    taxable boolean DEFAULT true,
    applies_to character varying(100) DEFAULT 'All Staff'::character varying,
    status character varying(50) DEFAULT 'Active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.staff_allowance_types OWNER TO postgres;

--
-- Name: staff_deduction_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_deduction_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    amount numeric(15,2) DEFAULT 0.00,
    type character varying(50) DEFAULT 'Fixed Monthly'::character varying,
    recipient character varying(150),
    status character varying(50) DEFAULT 'Active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.staff_deduction_types OWNER TO postgres;

--
-- Name: staff_departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20),
    head_title character varying(100),
    vote_head_name character varying(100) DEFAULT 'Tuition & Teaching Materials'::character varying,
    status character varying(50) DEFAULT 'Active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.staff_departments OWNER TO postgres;

--
-- Name: staff_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    staff_number character varying(50) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    role character varying(100) NOT NULL,
    department_id uuid,
    department_name character varying(100),
    phone character varying(50),
    email character varying(100),
    national_id character varying(50),
    kra_pin character varying(50),
    nssf_number character varying(50),
    nhif_number character varying(50),
    bank_name character varying(100) DEFAULT 'Kenya Commercial Bank (KCB)'::character varying,
    bank_branch character varying(100) DEFAULT 'Machakos Branch'::character varying,
    bank_account_number character varying(100),
    basic_salary numeric(15,2) DEFAULT 0.00 NOT NULL,
    house_allowance numeric(15,2) DEFAULT 0.00,
    commuter_allowance numeric(15,2) DEFAULT 0.00,
    other_allowances numeric(15,2) DEFAULT 0.00,
    custom_deductions numeric(15,2) DEFAULT 0.00,
    status character varying(50) DEFAULT 'Active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.staff_members OWNER TO postgres;

--
-- Name: stk_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stk_attempts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    student_id uuid,
    phone_number character varying(50) NOT NULL,
    amount numeric(12,2) NOT NULL,
    account_reference character varying(100) NOT NULL,
    checkout_request_id character varying(100),
    merchant_request_id character varying(100),
    status character varying(50) DEFAULT 'PROMPTED'::character varying,
    response_description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT stk_attempts_status_check CHECK (((status)::text = ANY ((ARRAY['PROMPTED'::character varying, 'SUCCESS'::character varying, 'CANCELLED'::character varying, 'TIMEOUT'::character varying, 'FAILED'::character varying])::text[])))
);


ALTER TABLE public.stk_attempts OWNER TO postgres;

--
-- Name: streams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.streams (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    class_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.streams OWNER TO postgres;

--
-- Name: student_group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_group_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    group_id uuid NOT NULL,
    student_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_group_members OWNER TO postgres;

--
-- Name: student_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_groups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100) DEFAULT 'House / Dormitory'::character varying NOT NULL,
    patron character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_groups OWNER TO postgres;

--
-- Name: student_guardians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_guardians (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    student_id uuid NOT NULL,
    guardian_id uuid NOT NULL,
    is_primary boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_guardians OWNER TO postgres;

--
-- Name: student_transport_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_transport_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    student_id uuid NOT NULL,
    route_id uuid NOT NULL,
    vehicle_id uuid,
    pickup_point character varying(200),
    term_fee numeric(12,2) DEFAULT 0 NOT NULL,
    academic_year_id uuid,
    term_id uuid,
    status character varying(50) DEFAULT 'Active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_transport_subscriptions OWNER TO postgres;

--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    admission_number character varying(100) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    gender character varying(20),
    date_of_birth date,
    class_id uuid NOT NULL,
    stream_id uuid,
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    boarding_status character varying(50) DEFAULT 'DAY'::character varying,
    opening_balance numeric(12,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT students_boarding_status_check CHECK (((boarding_status)::text = ANY ((ARRAY['DAY'::character varying, 'BOARDING'::character varying])::text[]))),
    CONSTRAINT students_status_check CHECK (((status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'SUSPENDED'::character varying, 'TRANSFERRED'::character varying, 'GRADUATED'::character varying])::text[])))
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: supplier_bills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_bills (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    bill_number character varying(100) NOT NULL,
    supplier_id uuid,
    supplier_name character varying(255) NOT NULL,
    category_id uuid,
    lpo_id uuid,
    bill_date date DEFAULT CURRENT_DATE NOT NULL,
    due_date date NOT NULL,
    amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    amount_paid numeric(15,2) DEFAULT 0.00 NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.supplier_bills OWNER TO postgres;

--
-- Name: supplier_take_ons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_take_ons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    supplier_id uuid NOT NULL,
    invoice_ref character varying(100) NOT NULL,
    invoice_date date DEFAULT CURRENT_DATE NOT NULL,
    amount numeric(15,2) NOT NULL,
    amount_settled numeric(15,2) DEFAULT 0.00,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.supplier_take_ons OWNER TO postgres;

--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    supplier_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100) DEFAULT 'General Supplies'::character varying NOT NULL,
    contact_person character varying(150),
    phone character varying(50),
    email character varying(150),
    address text,
    bank_name character varying(100),
    bank_account_no character varying(100),
    kra_pin character varying(50),
    opening_balance numeric(15,2) DEFAULT 0.00,
    current_balance numeric(15,2) DEFAULT 0.00,
    status character varying(50) DEFAULT 'ACTIVE'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: system_configurations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value text,
    category character varying(50) DEFAULT 'GENERAL'::character varying,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_configurations OWNER TO postgres;

--
-- Name: terms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.terms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    academic_year_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.terms OWNER TO postgres;

--
-- Name: transaction_ledger; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaction_ledger (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    student_id uuid,
    term_id uuid,
    entry_type character varying(50) NOT NULL,
    debit_amount numeric(12,2) DEFAULT 0.00,
    credit_amount numeric(12,2) DEFAULT 0.00,
    payment_transaction_id uuid,
    receipt_number character varying(100),
    original_ledger_id uuid,
    description text NOT NULL,
    recorded_by_user_id uuid,
    checksum character varying(64) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT transaction_ledger_entry_type_check CHECK (((entry_type)::text = ANY ((ARRAY['INVOICE_CHARGE'::character varying, 'PAYMENT_CREDIT'::character varying, 'REVERSAL'::character varying, 'DISCOUNT_WAIVER'::character varying, 'REFUND_DEBIT'::character varying, 'TRANSFER'::character varying, 'JOURNAL'::character varying, 'OTHER_INCOME'::character varying, 'EXPENSE'::character varying, 'OPENING_BALANCE'::character varying, 'BURSARY'::character varying, 'GRANT'::character varying, 'PLEDGE'::character varying])::text[])))
);


ALTER TABLE public.transaction_ledger OWNER TO postgres;

--
-- Name: transport_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transport_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    vehicle_id uuid NOT NULL,
    log_type character varying(50) NOT NULL,
    amount numeric(12,2) DEFAULT 0 NOT NULL,
    odometer_reading numeric(12,2) DEFAULT 0,
    vendor character varying(150),
    notes text,
    log_date date DEFAULT CURRENT_DATE NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transport_logs OWNER TO postgres;

--
-- Name: transport_routes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transport_routes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(150) NOT NULL,
    pickup_points text,
    term_fee numeric(12,2) DEFAULT 0 NOT NULL,
    vehicle_id uuid,
    return_trip_type character varying(50) DEFAULT 'TWO_WAY'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transport_routes OWNER TO postgres;

--
-- Name: transport_vehicles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transport_vehicles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    reg_no character varying(50) NOT NULL,
    model character varying(100) NOT NULL,
    capacity integer DEFAULT 51 NOT NULL,
    driver_name character varying(150),
    driver_phone character varying(50),
    status character varying(50) DEFAULT 'Active'::character varying NOT NULL,
    mileage numeric(12,2) DEFAULT 0,
    insurance_expiry date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.transport_vehicles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'school_admin'::character varying, 'bursar'::character varying, 'head_teacher'::character varying, 'auditor'::character varying, 'parent'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: vote_head_budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vote_head_budgets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    school_id uuid NOT NULL,
    vote_head_id uuid NOT NULL,
    financial_year character varying(20) DEFAULT '2026'::character varying NOT NULL,
    budgeted_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.vote_head_budgets OWNER TO postgres;

--
-- Name: vote_heads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vote_heads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    school_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    account_code character varying(50),
    is_optional boolean DEFAULT false,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    account_type_id uuid
);


ALTER TABLE public.vote_heads OWNER TO postgres;

--
-- Data for Name: academic_years; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_years (id, school_id, name, start_date, end_date, is_current, created_at) FROM stdin;
a1111111-1111-1111-1111-111111111111	a0000000-0000-0000-0000-000000000001	2026	2026-01-05	2026-11-20	t	2026-09-07 20:12:43.427971+03
\.


--
-- Data for Name: account_take_ons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_take_ons (id, school_id, account_id, account_name, financial_year, balance_type, amount, as_of_date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: account_transfers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_transfers (id, school_id, from_account_id, from_account_name, to_account_id, to_account_name, amount, transfer_date, reference_number, narration, status, created_by_user_id, created_at) FROM stdin;
\.


--
-- Data for Name: account_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_types (id, school_id, name, code, is_default, description, created_at, updated_at) FROM stdin;
da54f464-ae64-4f4a-938a-8e5896cde2d1	a0000000-0000-0000-0000-000000000001	TUITION FUND	100	t	Teaching & Learning Materials, Curriculum delivery, Textbooks	2026-09-10 22:45:07.386859+03	2026-09-10 22:45:07.386859+03
4e68606b-2739-46f5-905a-772ecc97cd4a	a0000000-0000-0000-0000-000000000001	OPERATIONS FUND	200	f	RMI, Electricity & Water, Local transport, Admin expenses, Contingencies	2026-09-10 22:45:07.388774+03	2026-09-10 22:45:07.388774+03
ebf5f3ba-f35d-4a7e-82ad-f67ea76e5760	a0000000-0000-0000-0000-000000000001	SCHOOL FUND / BOARDING	300	f	Boarding accommodation, Catering, Meals, Stores, Student welfare	2026-09-10 22:45:07.389461+03	2026-09-10 22:45:07.389461+03
3ee0f0ae-bfdb-4fe5-83d6-59d047c70aa9	a0000000-0000-0000-0000-000000000001	DEVELOPMENT & INFRASTRUCTURE	400	f	Capital expenditure, Building projects, Lab construction	2026-09-10 22:45:07.390128+03	2026-09-10 22:45:07.390128+03
848722e8-239d-4746-9a98-426d9d3c6850	a0000000-0000-0000-0000-000000000001	ACTIVITY & SPORTS FUND	500	f	Co-curricular activities, Drama, Sports, Music, Athletics	2026-09-10 22:45:07.390748+03	2026-09-10 22:45:07.390748+03
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, school_id, name, account_number, bank_name, branch, account_type_id, account_type, currency, opening_balance, current_balance, is_cash_account, status, created_at, updated_at) FROM stdin;
90aacce7-c984-4544-aa37-771d1a6402bf	a0000000-0000-0000-0000-000000000001	School Fund Equity Account	0240294819201	Equity Bank Kenya	Corporate Branch	\N	SCHOOL FUND / BOARDING	KES	0.00	0.00	f	ACTIVE	2026-09-10 22:45:07.396244+03	2026-09-10 22:45:07.396244+03
1ebaf9f0-e5b9-45ba-aec9-1ea0a178ded6	a0000000-0000-0000-0000-000000000001	Safaricom Direct Paybill Float	890123	Safaricom M-Pesa	Daraja API C2B	\N	OPERATIONS	KES	0.00	0.00	f	ACTIVE	2026-09-10 22:45:07.396709+03	2026-09-10 22:45:07.396709+03
806537b7-7d89-4be1-b0e4-c350e36ecd8e	a0000000-0000-0000-0000-000000000001	School Bursar Petty Cash Float	PETTY-01	Cash in Hand (Safe)	Cash Office	\N	OPERATIONS	KES	0.00	0.00	t	ACTIVE	2026-09-10 22:45:07.397265+03	2026-09-10 22:45:07.397265+03
98170266-0cb9-488e-a5d3-3a8959713792	a0000000-0000-0000-0000-000000000001	Main Tuition KCB Account	1106398408	Kenya Commercial Bank (KCB)	Machakos Branch	\N	TUITION	KES	0.00	-20000.00	f	ACTIVE	2026-09-10 22:45:07.393626+03	2026-09-10 22:45:07.393626+03
99f3a4fb-973d-4413-8c95-cbc4aed7c901	a0000000-0000-0000-0000-000000000001	Operations Co-op Bank Account	0112984719200	Co-operative Bank of Kenya	Community Branch	\N	OPERATIONS	KES	0.00	20000.00	f	ACTIVE	2026-09-10 22:45:07.395743+03	2026-09-10 22:45:07.395743+03
\.


--
-- Data for Name: asset_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_categories (id, school_id, name, code, depreciation_type, depreciation_method, depreciation_rate, description, created_at, updated_at) FROM stdin;
523fa469-9ec7-484f-8de6-44535c4e3b53	a0000000-0000-0000-0000-000000000001	Fixed Assets	FA	ANNUALLY	STRAIGHT_LINE	10.00	Land, Buildings, Permanent Structures	2026-09-11 12:52:45.651129	2026-09-11 12:52:45.651129
9804daad-a5f8-4a3a-acae-64866e276060	a0000000-0000-0000-0000-000000000001	Motor Vehicles & Buses	MV	ANNUALLY	REDUCING_BALANCE	20.00	School Buses, Vans, Tractors	2026-09-11 12:52:45.654051	2026-09-11 12:52:45.654051
696dabc1-0a91-49f3-8709-88a06d273373	a0000000-0000-0000-0000-000000000001	Computers & ICT Equipment	ICT	ANNUALLY	STRAIGHT_LINE	25.00	Desktops, Laptops, Servers, Printers	2026-09-11 12:52:45.654346	2026-09-11 12:52:45.654346
35d78b67-31d5-432a-8237-5e8e8c1bf805	a0000000-0000-0000-0000-000000000001	Laboratory Equipment & Apparatus	LAB	ANNUALLY	STRAIGHT_LINE	15.00	Microscopes, Physics/Chemistry Kits	2026-09-11 12:52:45.654595	2026-09-11 12:52:45.654595
1adf334d-a22b-4228-bcec-217288efebd7	a0000000-0000-0000-0000-000000000001	Furniture, Fixtures & Fittings	FUR	ANNUALLY	STRAIGHT_LINE	12.50	Desks, Chairs, Lockers, Shelves	2026-09-11 12:52:45.654874	2026-09-11 12:52:45.654874
f42b1b87-12ec-460a-96da-a949116c46af	a0000000-0000-0000-0000-000000000001	Biological & Farm Assets	BIO	ANNUALLY	STRAIGHT_LINE	0.00	Livestock, Orchard Trees, Farm Produce	2026-09-11 12:52:45.655304	2026-09-11 12:52:45.655304
\.


--
-- Data for Name: asset_depreciation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_depreciation_logs (id, school_id, asset_id, fiscal_year, depreciation_amount, accumulated_depreciation, net_book_value, posted_to_gl, calculated_at) FROM stdin;
\.


--
-- Data for Name: asset_maintenance_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.asset_maintenance_logs (id, school_id, asset_id, service_date, service_type, cost, vendor, notes, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (id, school_id, user_id, action, entity_type, entity_id, ip_address, user_agent, before_state, after_state, checksum, created_at) FROM stdin;
0126b842-b733-4f37-a5ae-d46461154818	a0000000-0000-0000-0000-000000000001	\N	RECORD_LEDGER_ENTRY	transaction_ledger	5c8660ec-f6d2-4b0a-bdae-deebc153939d	127.0.0.1	\N	\N	{"type": "INVOICE_CHARGE", "debit": 15000, "credit": 0, "checksum": "c896578d3165e1434fbc8829f7ae82c6d55cc58e58d9dca56063894073b0f359", "receipt_no": null, "student_id": "4aaddb9e-eb82-46fc-9540-b652980a3436"}	0f2737315f5368a8b6d47f476985d7378874594a626e0bdea111b5a092a13419	2026-09-10 18:47:06+03
72c94707-fdd0-4c29-a91d-1737ca3b3013	a0000000-0000-0000-0000-000000000001	\N	RECORD_LEDGER_ENTRY	transaction_ledger	58a41ba1-ffba-46f2-8bdc-dbd4aca99aeb	127.0.0.1	\N	\N	{"type": "INVOICE_CHARGE", "debit": 35000, "credit": 0, "checksum": "a0e426f303925c0a4a9d23c930eccf59e5945c0ab53a9556223ec76f2919e9d9", "receipt_no": null, "student_id": "f699362e-ef58-4999-8888-337f9581da31"}	c4bff3a9b7f437a806ea76ed26dc167f287de702f61eebb3ba726bf3bde2c6b1	2026-09-10 18:47:07+03
db555dc6-9ea1-4961-851a-fc6bb553d811	a0000000-0000-0000-0000-000000000001	b0000000-0000-0000-0000-000000000001	RECORD_LEDGER_ENTRY	transaction_ledger	ddf96e8f-b237-4e5b-a1e4-e83228e28626	127.0.0.1	\N	\N	{"type": "PAYMENT_CREDIT", "debit": 0, "credit": 5000, "checksum": "b2fbac612447054d970edc0d10517c32011b1e1dd229d83e8cdd24af5292b4c1", "receipt_no": "RCT-2026-0001", "student_id": "f699362e-ef58-4999-8888-337f9581da31"}	581fed8d0ef3c888ef0d04c652c8e723d573a8cd0b421f9569b43803a8c1fb08	2026-09-10 18:57:54+03
11db162f-1c16-41c5-9e12-eb70e1638c45	a0000000-0000-0000-0000-000000000001	\N	RECORD_LEDGER_ENTRY	transaction_ledger	59a14387-df25-4447-a2e8-580a8df378ca	127.0.0.1	\N	\N	{"type": "INVOICE_CHARGE", "debit": 14000, "credit": 0, "checksum": "bac088bf3ae4e02cc195d57c1daba1930bc3be5505c0807238a86a43191c7618", "receipt_no": null, "student_id": "7b2f0a83-9413-4d87-a0bd-877a81579171"}	4c493d5d98aec50ae0592bc2626b6f4e79b62c9cb8cdfe9506fcbc3481caf403	2026-09-10 19:34:11+03
8eeb70a1-5401-4a5c-b67c-3c6dae2fb420	a0000000-0000-0000-0000-000000000001	\N	RECORD_LEDGER_ENTRY	transaction_ledger	12148c2f-d356-4f81-ad3d-196824adaf4a	127.0.0.1	\N	\N	{"type": "INVOICE_CHARGE", "debit": 14000, "credit": 0, "checksum": "89962afa85a6d12abddde833954326b0588d26bd2b06f7752dac775b70355d5c", "receipt_no": null, "student_id": "bb3ae542-375e-4cdc-8d16-2ba58444ffbe"}	70c8acf3f7c61e0dfcd1f3b22e31211154352f065364c5adc0b8b78d50b9aceb	2026-09-10 19:35:57+03
c4fe549e-307f-42ea-80d8-8b04ada2457b	a0000000-0000-0000-0000-000000000001	\N	RECORD_LEDGER_ENTRY	transaction_ledger	3e07cb2b-85a8-4899-8bb9-0806e614fcc6	127.0.0.1	\N	\N	{"type": "PAYMENT_CREDIT", "debit": 0, "credit": 12500, "checksum": "556d71cd1b3d83cdaf07ade0545f58b828f80ca14d66063a045598d8c0c6c63b", "receipt_no": "RCT-2026-0002", "student_id": "f699362e-ef58-4999-8888-337f9581da31"}	8a05a2f98d90ff542fca0b4e7810c4d6f22032811a81eea98231e4866d21be0b	2026-09-10 21:34:51+03
7195d051-de08-4521-9f31-a367bc0bbaa3	a0000000-0000-0000-0000-000000000001	\N	RECORD_LEDGER_ENTRY	transaction_ledger	b8968192-b4a4-4810-a7ca-aced99ddf62f	127.0.0.1	\N	\N	{"type": "PAYMENT_CREDIT", "debit": 0, "credit": 5000, "checksum": "44e29d69ae261c5e719d370da1a1b241e97de098972279f9aca29644852b1641", "receipt_no": "RCT-2026-0003", "student_id": "f699362e-ef58-4999-8888-337f9581da31"}	ab3bbad5b01c86adc5c4305be1a80babdc42613ee838448c46a9cab0513c92aa	2026-09-10 21:34:51+03
587d3e16-9c75-45c3-877d-75ec80001101	a0000000-0000-0000-0000-000000000001	b0000000-0000-0000-0000-000000000001	RECORD_LEDGER_ENTRY	transaction_ledger	5d755f5f-8ab3-4271-b3e4-3a9d5c9f0c67	127.0.0.1	\N	\N	{"type": "PAYMENT_CREDIT", "debit": 0, "credit": 10, "checksum": "0bb1f2b0dac6d3a3a34d34b1a189c89650c0a19175fa682dfd4bd31db762d81b", "receipt_no": "RCT-2026-0001", "student_id": "f699362e-ef58-4999-8888-337f9581da31"}	a414651cd3461f6e9d31daed95af1378daec29f2390c59775745357802867ec6	2026-09-11 12:19:35+03
54b535e1-1d26-4166-bb25-b44d35eb542a	a0000000-0000-0000-0000-000000000001	b0000000-0000-0000-0000-000000000001	RECORD_LEDGER_ENTRY	transaction_ledger	8872656b-d211-4025-9b3b-3ea04104a992	127.0.0.1	\N	\N	{"type": "PAYMENT_CREDIT", "debit": 0, "credit": 5000, "checksum": "2d1064fece3eec19d6f1b65b010253089fd6a353540e02aa911c2cd2fb1d4f92", "receipt_no": "RCT-2026-0002", "student_id": "f699362e-ef58-4999-8888-337f9581da31"}	9b9d0947617a6d606b672996dd920f79b3280bf1cbaa05fe47793a34c6f14929	2026-09-11 12:20:07+03
\.


--
-- Data for Name: bank_integrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_integrations (id, school_id, bank_name, account_name, account_number, paybill, branch, webhook_secret, auto_match_pattern, status, last_synced_at, created_at, updated_at) FROM stdin;
817bd14f-d1a0-4e09-a021-959a60399773	a0000000-0000-0000-0000-000000000001	Kenya Commercial Bank (KCB)	Main School Fund Operations Account	1106398408	522123	Machakos Branch	\N	ADM-NO	CONNECTED	2026-09-10 22:32:14.656301+03	2026-09-10 22:32:14.656301+03	2026-09-10 22:32:14.656301+03
8c94942d-4293-4f3f-8ad2-b02499b674ac	a0000000-0000-0000-0000-000000000001	Equity Bank Kenya	Operations & Fees Account	0240294819201	247247	Corporate Branch	\N	ADM-NO	CONNECTED	2026-09-10 22:32:14.682265+03	2026-09-10 22:32:14.682265+03	2026-09-10 22:32:14.682265+03
84ff76ee-3902-42b2-8286-a4d6b669a4ff	a0000000-0000-0000-0000-000000000001	Co-operative Bank of Kenya	Development & Infrastructure Account	0112984719200	400200	Community Branch	\N	ADM-NO	CONNECTED	2026-09-10 22:32:14.687417+03	2026-09-10 22:32:14.687417+03	2026-09-10 22:32:14.687417+03
d5d3dd3c-ed06-47c0-ade6-a64fdd4dec4d	a0000000-0000-0000-0000-000000000001	Safaricom M-Pesa Direct Paybill / Till	Direct M-Pesa Primary Float	890123	890123	Daraja API C2B/STK	\N	ADM-NO	CONNECTED	2026-09-10 22:32:14.6912+03	2026-09-10 22:32:14.6912+03	2026-09-10 22:32:14.6912+03
2bca2d5a-1a58-4977-85d8-6894572e0585	a0000000-0000-0000-0000-000000000001	NCBA Bank Kenya	School Endowment Account	7890123456	888888	Upper Hill	\N	ADM-NO	CONNECTED	2026-09-10 22:34:51.125501+03	2026-09-10 22:34:51.125501+03	2026-09-10 22:34:51.125501+03
\.


--
-- Data for Name: bursaries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bursaries (id, school_id, student_id, sponsor_name, cheque_number, amount, disbursement_date, term_id, academic_year_id, notes, status, ledger_entry_id, created_at) FROM stdin;
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (id, school_id, name, level_order, created_at) FROM stdin;
865c9bc4-365e-4b8a-b8ce-4585ce938a66	a0000000-0000-0000-0000-000000000001	Form 1	1	2026-09-06 18:15:59.749988+03
45bc4c90-a71c-4750-ae67-542826e5d0df	a0000000-0000-0000-0000-000000000001	Form 2	2	2026-09-10 20:37:30.517536+03
\.


--
-- Data for Name: deletion_audits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.deletion_audits (id, school_id, entity_type, entity_id, entity_identifier, deleted_by, reason, snapshot_data, can_restore, is_restored, deleted_at, restored_at) FROM stdin;
\.


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donations (id, school_id, donor_id, category_id, receipt_number, amount, purpose, payment_method, bank_account, transaction_reference, donation_date, status, received_by_user_id, created_at) FROM stdin;
cd7a2fea-989f-4173-9845-0fa1f3a106c0	a0000000-0000-0000-0000-000000000001	a47a63a4-a070-4977-bf5c-00db0216dd99	\N	DON-2026-0001	50000.00	Computer lab networking installation	BANK_TRANSFER	Development / Projects Account (Equity)	\N	2026-09-10	RECEIVED	b0000000-0000-0000-0000-000000000001	2026-09-10 21:56:49.400243+03
\.


--
-- Data for Name: donors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.donors (id, school_id, donor_code, name, donor_type, contact_person, phone, email, address, total_donated, created_at) FROM stdin;
a47a63a4-a070-4977-bf5c-00db0216dd99	a0000000-0000-0000-0000-000000000001	DON-001	Dr. James Mutua Foundation	INDIVIDUAL	Dr. James Mutua	0722334455	\N	\N	50000.00	2026-09-10 21:56:49.394664+03
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_categories (id, school_id, name, code, description, created_at) FROM stdin;
36e9f730-c4b7-4ef5-952e-c0d429bb96af	a0000000-0000-0000-0000-000000000001	Teaching & Learning Materials	EXP-101	Stationery, chalk, textbooks, lab equipment	2026-09-07 20:22:43.303734+03
d38f87b5-a83a-4e77-842b-e4958fd8ba2f	a0000000-0000-0000-0000-000000000001	Repairs, Maintenance & Improvements	EXP-102	Facility renovations and infrastructure upkeep	2026-09-07 20:22:43.303734+03
994f6968-ca41-4116-9608-11966a1e9856	a0000000-0000-0000-0000-000000000001	Electricity, Water & Conservancies	EXP-103	Utility bills, tokens, sewer maintenance	2026-09-07 20:22:43.303734+03
737352bb-9b85-407b-b670-c86772b621f6	a0000000-0000-0000-0000-000000000001	Catering & Food Supplies	EXP-104	Boarding kitchen produce, firewood, gas	2026-09-07 20:22:43.303734+03
38f38309-b442-467b-90f4-4a68298bb8cb	a0000000-0000-0000-0000-000000000001	Sports & Co-Curricular Activities	EXP-105	Games tournaments, drama festivals, transport	2026-09-07 20:22:43.303734+03
\.


--
-- Data for Name: expense_vouchers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expense_vouchers (id, school_id, voucher_number, category_id, term_id, payee_name, amount, payment_method, description, lpo_number, status, requested_by_user_id, approved_by_user_id, disbursed_by_user_id, disbursed_at, created_at, updated_at) FROM stdin;
55cf111f-fa67-4145-b099-5b1c78d61a2c	a0000000-0000-0000-0000-000000000001	PV-2026-0003	737352bb-9b85-407b-b670-c86772b621f6	b1111111-1111-1111-1111-111111111111	Mama Nzasi Groceries	1300.00	BANK_TRANSFER	Fresh vegetables for boarding kitchen	LPO-2026-711	DISBURSED	b0000000-0000-0000-0000-000000000001	b0000000-0000-0000-0000-000000000001	b0000000-0000-0000-0000-000000000001	2026-09-10 17:51:47.537466+03	2026-09-10 17:14:50.393862+03	2026-09-10 17:51:47.537466+03
9d858379-adb9-4994-9dfd-77193be25e9a	a0000000-0000-0000-0000-000000000001	PV-2026-0004	737352bb-9b85-407b-b670-c86772b621f6	b1111111-1111-1111-1111-111111111111	Temporary Test Supplier	500.00	BANK_TRANSFER	Temporary Test [CANCELLED: Duplicate entry test]	LPO-2026-296	CANCELLED	b0000000-0000-0000-0000-000000000001	\N	\N	\N	2026-09-10 21:39:17.213608+03	2026-09-10 21:39:17.246299+03
f9bc50c7-4e17-4c94-85eb-1a67c67a7a3b	a0000000-0000-0000-0000-000000000001	PV-2026-0002	737352bb-9b85-407b-b670-c86772b621f6	\N	Mama Nzasi Groceries	1300.00	BANK_TRANSFER	Fresh vegetables for boarding kitchen [CANCELLED: testing]	LPO-2026-412	CANCELLED	b0000000-0000-0000-0000-000000000001	\N	\N	\N	2026-09-10 17:14:32.111296+03	2026-09-10 21:42:07.842604+03
a475d19e-3757-40ec-88a7-ca603eeff84a	a0000000-0000-0000-0000-000000000001	PV-2026-0001	737352bb-9b85-407b-b670-c86772b621f6	\N	Dorcus Musau	1300.00	BANK_TRANSFER	Supply of Vegetables [CANCELLED: paid]	LPO-2026-255	CANCELLED	b0000000-0000-0000-0000-000000000001	\N	\N	\N	2026-09-10 17:11:48.295021+03	2026-09-10 21:42:21.152093+03
\.


--
-- Data for Name: fee_adjustments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_adjustments (id, school_id, student_id, adjustment_type, amount, reference_number, reason, approved_by_user_id, ledger_entry_id, created_at) FROM stdin;
\.


--
-- Data for Name: fee_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_invoices (id, school_id, invoice_number, student_id, academic_year_id, term_id, fee_structure_id, total_billed, due_date, status, created_at) FROM stdin;
4dddd584-0eb2-466c-89a7-ea6abfdf7046	a0000000-0000-0000-0000-000000000001	INV-2026-8291	f699362e-ef58-4999-8888-337f9581da31	a1111111-1111-1111-1111-111111111111	b1111111-1111-1111-1111-111111111111	74c24e8e-de72-43f4-b0ed-f7438d558ce9	14000.00	2026-10-10	ISSUED	2026-09-10 19:47:07.02742+03
2d3b5f58-449a-4eae-9088-7ad360bf5457	a0000000-0000-0000-0000-000000000001	INV-2026-3755	bb3ae542-375e-4cdc-8d16-2ba58444ffbe	a1111111-1111-1111-1111-111111111111	b1111111-1111-1111-1111-111111111111	74c24e8e-de72-43f4-b0ed-f7438d558ce9	14000.00	2026-10-10	ISSUED	2026-09-10 20:35:57.719994+03
6ab9b844-518d-4493-98b2-db37b41ee579	a0000000-0000-0000-0000-000000000001	INV-2026-7687	7b2f0a83-9413-4d87-a0bd-877a81579171	a1111111-1111-1111-1111-111111111111	b1111111-1111-1111-1111-111111111111	20aa766b-d8f6-42e3-a719-6fa102989680	6500.00	2026-10-10	ISSUED	2026-09-10 20:34:11.051793+03
\.


--
-- Data for Name: fee_refunds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_refunds (id, school_id, refund_number, student_id, amount, payment_method, cheque_number, bank_account, recipient_name, reason, status, requested_by_user_id, approved_by_user_id, disbursed_by_user_id, ledger_entry_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: fee_structure_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_structure_items (id, fee_structure_id, vote_head_id, amount, is_optional, created_at) FROM stdin;
72008258-3d0f-4a56-bd17-e56373db590e	c1111111-1111-1111-1111-111111111111	91b4bc93-df44-454d-8eb6-c8b07a73688b	18000.00	f	2026-09-07 20:12:43.466576+03
9208a3e1-8862-46d9-a5f3-046ad203471b	c1111111-1111-1111-1111-111111111111	0367474d-1da8-49b4-82be-b6a30979fcba	12000.00	f	2026-09-07 20:12:43.473763+03
2be9af63-ef28-4571-8e8d-d0eacaf47f09	c1111111-1111-1111-1111-111111111111	bc30bf18-7101-4d2d-8ade-bfd43d28618c	2500.00	f	2026-09-07 20:12:43.475528+03
f310384c-113c-4818-9370-c359351d68e7	c1111111-1111-1111-1111-111111111111	4c664491-fd5a-4104-921d-58dfe9f0e2c5	2500.00	f	2026-09-07 20:12:43.477101+03
7d5f611a-a91c-4428-b3b8-f5b45edcc3ff	c1111111-1111-1111-1111-111111111111	874d1d79-500e-47b1-9407-631aa69249c0	2500.00	f	2026-09-07 20:12:43.478383+03
bf14dbf8-527e-4fe8-b984-9d5f79955f91	c1111111-1111-1111-1111-111111111111	549eba51-c93d-40dd-ac18-454231300934	2500.00	f	2026-09-07 20:12:43.479753+03
a7a80e39-7380-47b4-a433-ec0e999bb1b0	3d796fe5-d0b7-43e3-a689-56f33588e43b	4c664491-fd5a-4104-921d-58dfe9f0e2c5	1500.00	f	2026-09-10 18:09:43.674971+03
f6b66ffd-141f-4c0c-860e-cb1cc04120c6	3d796fe5-d0b7-43e3-a689-56f33588e43b	0367474d-1da8-49b4-82be-b6a30979fcba	15000.00	f	2026-09-10 18:09:43.674971+03
fade6377-e77c-4c1e-b580-357385d69b9f	3d796fe5-d0b7-43e3-a689-56f33588e43b	874d1d79-500e-47b1-9407-631aa69249c0	2000.00	f	2026-09-10 18:09:43.674971+03
35c8f6d9-2e01-4b9c-b0ea-5a78ccdd8d59	3d796fe5-d0b7-43e3-a689-56f33588e43b	bc30bf18-7101-4d2d-8ade-bfd43d28618c	2500.00	f	2026-09-10 18:09:43.674971+03
8d53a16d-c92c-4eda-bbfe-53735e6084a0	3d796fe5-d0b7-43e3-a689-56f33588e43b	91b4bc93-df44-454d-8eb6-c8b07a73688b	12000.00	f	2026-09-10 18:09:43.674971+03
c03d0718-c30d-4a34-9f66-6cb4852b0d4c	74c24e8e-de72-43f4-b0ed-f7438d558ce9	91b4bc93-df44-454d-8eb6-c8b07a73688b	1000.00	f	2026-09-10 19:52:54.281783+03
df0f6994-f981-4c89-86ba-cd5a7ae5ec26	74c24e8e-de72-43f4-b0ed-f7438d558ce9	0367474d-1da8-49b4-82be-b6a30979fcba	10500.00	f	2026-09-10 19:52:54.281783+03
cb9a5602-41dd-43ed-8ebc-8c865dffbd5f	74c24e8e-de72-43f4-b0ed-f7438d558ce9	bc30bf18-7101-4d2d-8ade-bfd43d28618c	500.00	f	2026-09-10 19:52:54.281783+03
b3ef89f3-76fb-4a98-a0bf-daa5eeaddac6	74c24e8e-de72-43f4-b0ed-f7438d558ce9	549eba51-c93d-40dd-ac18-454231300934	1000.00	f	2026-09-10 19:52:54.281783+03
eec356f6-8f82-4c05-bd65-f22e3a7df7b6	74c24e8e-de72-43f4-b0ed-f7438d558ce9	4c664491-fd5a-4104-921d-58dfe9f0e2c5	1000.00	f	2026-09-10 19:52:54.281783+03
3464c977-4585-47af-94a9-f4eee9deaf85	20aa766b-d8f6-42e3-a719-6fa102989680	91b4bc93-df44-454d-8eb6-c8b07a73688b	500.00	f	2026-09-10 19:54:12.574061+03
a4ce9057-8f3c-47e4-a73f-3de9a65454f5	20aa766b-d8f6-42e3-a719-6fa102989680	0367474d-1da8-49b4-82be-b6a30979fcba	5000.00	f	2026-09-10 19:54:12.574061+03
15555f61-203b-4ac9-80b2-0c644a5205e0	20aa766b-d8f6-42e3-a719-6fa102989680	bc30bf18-7101-4d2d-8ade-bfd43d28618c	1000.00	f	2026-09-10 19:54:12.574061+03
\.


--
-- Data for Name: fee_structures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_structures (id, school_id, academic_year_id, term_id, class_id, title, total_amount, created_at, boarding_status) FROM stdin;
c1111111-1111-1111-1111-111111111111	a0000000-0000-0000-0000-000000000001	a1111111-1111-1111-1111-111111111111	b1111111-1111-1111-1111-111111111111	865c9bc4-365e-4b8a-b8ce-4585ce938a66	Form 1 Term 1 2026 Fee Structure	35000.00	2026-09-07 20:12:43.462493+03	ALL
3d796fe5-d0b7-43e3-a689-56f33588e43b	a0000000-0000-0000-0000-000000000001	a1111111-1111-1111-1111-111111111111	b2222222-2222-2222-2222-222222222222	865c9bc4-365e-4b8a-b8ce-4585ce938a66	Form 1 Term 2 Fee Structure	33000.00	2026-09-10 18:09:43.674971+03	ALL
74c24e8e-de72-43f4-b0ed-f7438d558ce9	a0000000-0000-0000-0000-000000000001	a1111111-1111-1111-1111-111111111111	b1111111-1111-1111-1111-111111111111	865c9bc4-365e-4b8a-b8ce-4585ce938a66	Form 1 Term 1 - Boarding Fee Structure	14000.00	2026-09-10 19:47:06.82752+03	BOARDING
20aa766b-d8f6-42e3-a719-6fa102989680	a0000000-0000-0000-0000-000000000001	a1111111-1111-1111-1111-111111111111	b1111111-1111-1111-1111-111111111111	865c9bc4-365e-4b8a-b8ce-4585ce938a66	Form 1 Term 1 - Day Scholar Fee Structure	6500.00	2026-09-10 19:47:06.730647+03	DAY
\.


--
-- Data for Name: fixed_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fixed_assets (id, school_id, asset_tag, name, category_id, serial_no, purchase_date, purchase_cost, salvage_value, useful_life_years, location, custodian_id, condition, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: grants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grants (id, school_id, grant_type, title, amount, reference_number, disbursement_date, term_id, academic_year_id, bank_account, notes, created_at) FROM stdin;
\.


--
-- Data for Name: guardians; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.guardians (id, school_id, name, phone, email, id_number, relationship, created_at, updated_at) FROM stdin;
1c115ef5-ecf6-4d37-bfff-b832a44d3118	a0000000-0000-0000-0000-000000000001	Faith Mwangi	+254711678832	\N	\N	Parent	2026-09-10 19:47:06.917232+03	2026-09-10 19:47:06.917232+03
9c4a198e-8351-4b65-86e9-55f2581de14e	a0000000-0000-0000-0000-000000000001	Simon Kiio	0741233179	\N	\N	Parent	2026-09-10 20:34:11.051793+03	2026-09-10 20:34:11.051793+03
d828ef8b-5371-4d1a-9f43-6d480a9f7a6d	a0000000-0000-0000-0000-000000000001	John Mutua	+254712154315	\N	\N	Parent	2026-09-10 19:47:07.02742+03	2026-09-10 20:34:34.780011+03
\.


--
-- Data for Name: inventory_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_categories (id, school_id, name, code, description, created_at) FROM stdin;
3a9a3f9d-41b0-4ade-b17b-588157d13b53	a0000000-0000-0000-0000-000000000001	Food & Rations	CAT-FOOD	Cereal grains, cooking oil, pulses, and kitchen perishables	2026-09-11 12:08:34.142155+03
24023e25-53f0-48e0-b296-058bbc8845e4	a0000000-0000-0000-0000-000000000001	Stationery & Exams	CAT-STAT	Printing paper, exam booklets, pens, ink cartridges	2026-09-11 12:08:34.14281+03
3b3b93a3-1c0c-4c73-a426-01b43ee0d063	a0000000-0000-0000-0000-000000000001	Science Lab Chemicals	CAT-LAB	Reagents, glassware, science apparatus, and consumables	2026-09-11 12:08:34.143027+03
65696fed-9a3b-46e8-bb5c-64dabb794d23	a0000000-0000-0000-0000-000000000001	Uniforms & Apparel	CAT-UNIF	School sweaters, skirts, trousers, ties, and sportswear	2026-09-11 12:08:34.143245+03
c3540313-8e40-4761-9cfa-e160b14de463	a0000000-0000-0000-0000-000000000001	Cleaning & Sanitation	CAT-CLEAN	Detergents, soaps, disinfectants, mops, and brooms	2026-09-11 12:08:34.143484+03
7e77d167-8941-4f66-9ee3-d2ebae4cc581	a0000000-0000-0000-0000-000000000001	Boarding & Health	CAT-BOARD	Mattresses, bedsheets, medical clinic first aid supplies	2026-09-11 12:08:34.143725+03
\.


--
-- Data for Name: inventory_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_items (id, school_id, item_code, name, category_id, store_id, unit_of_measure, reorder_level, quantity_in_stock, unit_buying_price, selling_price, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: inventory_stores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_stores (id, school_id, name, code, location, manager, status, created_at, updated_at) FROM stdin;
13cf723e-c86c-4c23-b6f1-67f4a7b616bf	a0000000-0000-0000-0000-000000000001	Main Kitchen & Granary	STR-001	Kitchen Block A	Head Chef / Cateress	Active	2026-09-11 12:08:34.138609+03	2026-09-11 12:08:34.138609+03
512f3cc3-cd33-42e5-8515-ae747c05a1b3	a0000000-0000-0000-0000-000000000001	Stationery & Examination Store	STR-002	Admin Block Room 4	Academic Registrar	Active	2026-09-11 12:08:34.139743+03	2026-09-11 12:08:34.139743+03
3c302426-d700-4ff9-93db-addc0941aaed	a0000000-0000-0000-0000-000000000001	Science Lab Storage	STR-003	Science Complex 2nd Floor	Lab Technician	Active	2026-09-11 12:08:34.14005+03	2026-09-11 12:08:34.14005+03
d20ca5ae-ec91-481d-8a17-7fe7d8ea4ccd	a0000000-0000-0000-0000-000000000001	Uniforms & Bedding Store	STR-004	Boarding Wing C	Matron / Storekeeper	Active	2026-09-11 12:08:34.140318+03	2026-09-11 12:08:34.140318+03
dd4bf2e5-8ab3-48f6-a259-108ad89b4d9e	a0000000-0000-0000-0000-000000000001	Cleaning & Maintenance Depot	STR-005	Estate Yard	Grounds Supervisor	Active	2026-09-11 12:08:34.140567+03	2026-09-11 12:08:34.140567+03
\.


--
-- Data for Name: inventory_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_transactions (id, school_id, item_id, store_id, transaction_type, reference_no, quantity, unit_price, total_amount, recipient_department, issued_to, payment_method, notes, transaction_date, created_at) FROM stdin;
\.


--
-- Data for Name: inventory_units; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory_units (id, school_id, name, short_code, created_at) FROM stdin;
16957325-b738-4069-ab05-10ace7a68b54	a0000000-0000-0000-0000-000000000001	Bags (90kg)	90kg Bag	2026-09-11 12:08:34.144976+03
3efd7c96-a61d-4d63-8d89-b97231f5bcdc	a0000000-0000-0000-0000-000000000001	Bags (50kg)	50kg Bag	2026-09-11 12:08:34.145719+03
b5f14561-3a70-4c64-90fa-443ff0527472	a0000000-0000-0000-0000-000000000001	Jerrycans (20L)	20L	2026-09-11 12:08:34.145991+03
c5c3b1b8-a124-4b57-89ae-310cc0c2e713	a0000000-0000-0000-0000-000000000001	Cartons (5 Reams)	Carton	2026-09-11 12:08:34.146232+03
45a1e8fc-2719-412a-a7b6-669fd81f01ff	a0000000-0000-0000-0000-000000000001	Reams (500 sheets)	Ream	2026-09-11 12:08:34.146457+03
7ee1ba68-de40-4e61-914b-0c5d3c4333ec	a0000000-0000-0000-0000-000000000001	Pieces	Pcs	2026-09-11 12:08:34.14667+03
f29dc8fb-8a5c-450a-aca2-846be164a308	a0000000-0000-0000-0000-000000000001	Packets (1kg)	1kg Pkt	2026-09-11 12:08:34.146931+03
aecf8ce8-aa29-422f-8da8-a6f2ad6e5e16	a0000000-0000-0000-0000-000000000001	Bottles (2.5L)	2.5L Btl	2026-09-11 12:08:34.147133+03
0133f290-acce-471e-89bb-ada25ec43677	a0000000-0000-0000-0000-000000000001	Pairs	Prs	2026-09-11 12:08:34.147351+03
ca828f98-8d90-4ff6-bd10-54beb35a4e21	a0000000-0000-0000-0000-000000000001	Rolls	Roll	2026-09-11 12:08:34.147548+03
\.


--
-- Data for Name: journal_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.journal_entries (id, school_id, entry_number, reference_number, entry_date, narration, total_debit, total_credit, status, created_by_user_id, created_at) FROM stdin;
\.


--
-- Data for Name: journal_entry_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.journal_entry_items (id, journal_entry_id, account_id, account_name, vote_head_id, debit_amount, credit_amount, memo, created_at) FROM stdin;
\.


--
-- Data for Name: local_purchase_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.local_purchase_orders (id, school_id, lpo_number, supplier_id, supplier_name, items_description, quantity_details, estimated_amount, delivery_date, status, issued_by_user_id, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messaging_broadcasts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messaging_broadcasts (id, school_id, channel, recipient_type, total_recipients, delivered_count, failed_count, status, message_content, sent_by, created_at) FROM stdin;
\.


--
-- Data for Name: messaging_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messaging_templates (id, school_id, name, template_type, content, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: other_income_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.other_income_categories (id, school_id, name, account_code, description, is_active, created_at) FROM stdin;
62b649b9-5bc5-4d76-8a7f-2018c32bb022	a0000000-0000-0000-0000-000000000001	Canteen & Tuck Shop Rent	REV-OI-001	Monthly rental and lease payments from school canteen/cafeteria tenants	t	2026-09-10 21:44:13.351189+03
a8c46783-7b67-4a46-9f1e-9f116c48b813	a0000000-0000-0000-0000-000000000001	School Bus / Transport Hire	REV-OI-002	External charter and hire fees for school buses by churches, institutions and community	t	2026-09-10 21:44:13.369211+03
0831e4be-30d7-41f0-8896-d763c7c719d2	a0000000-0000-0000-0000-000000000001	School Farm & Agriculture Produce	REV-OI-003	Revenue from sale of dairy milk, vegetables, crops, and livestock from the school farm	t	2026-09-10 21:44:13.372308+03
aa04e878-50ee-4114-a446-3620b95e9205	a0000000-0000-0000-0000-000000000001	Hall, Grounds & Facility Rental	REV-OI-004	Hire of school multipurpose hall, dining hall, sports grounds for weddings and events	t	2026-09-10 21:44:13.375092+03
1bf73ced-4b8e-4c93-b852-bdf3c789ae2d	a0000000-0000-0000-0000-000000000001	Uniforms & Stationery Sales	REV-OI-005	Direct sales of school uniforms, sports kits, exercise books, and badge accessories	t	2026-09-10 21:44:13.377615+03
f09b1583-7085-448b-b7fb-40021487059f	a0000000-0000-0000-0000-000000000001	Tender & Bidding Document Fees	REV-OI-006	Non-refundable procurement bid document purchase fees from prospective suppliers	t	2026-09-10 21:44:13.38026+03
26afdc95-dfec-4975-8904-51332bc51f67	a0000000-0000-0000-0000-000000000001	Philanthropic Donations & Grants	REV-OI-007	Voluntary contributions from alumni, community patrons, foundations and development partners	t	2026-09-10 21:44:13.382845+03
5712ae49-cc05-4818-bcc7-8d3daec198cf	a0000000-0000-0000-0000-000000000001	Bank Interest Earned	REV-OI-008	Interest earned on institutional bank deposit accounts and money market balances	t	2026-09-10 21:44:13.385195+03
a5a2c3f2-0e71-4e37-b966-1232a8eff525	a0000000-0000-0000-0000-000000000001	Damage & Breakage Recoveries	REV-OI-009	Surcharges and penalty fees paid for lost or damaged school laboratory/library property	t	2026-09-10 21:44:13.387488+03
99ab129a-71d0-49b5-9376-d9658901c7c5	a0000000-0000-0000-0000-000000000001	Sundry / Miscellaneous Revenue	REV-OI-010	Any other general non-fee revenue and ad-hoc educational services income	t	2026-09-10 21:44:13.39123+03
\.


--
-- Data for Name: other_income_customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.other_income_customers (id, school_id, customer_code, name, category, phone, email, kra_pin, address, opening_balance, current_balance, created_at, updated_at) FROM stdin;
ec4df7c8-abd2-4e37-8f86-609df458bd2f	a0000000-0000-0000-0000-000000000001	CUST-001	Apex Canteen Operators	Canteen Tenant / Contractor	0711223344	apex@canteen.co.ke	P051999888Z	\N	8000.00	8000.00	2026-09-10 21:56:49.315893+03	2026-09-10 21:56:49.387857+03
\.


--
-- Data for Name: other_income_invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.other_income_invoices (id, school_id, invoice_number, customer_id, category_id, description, amount, paid_amount, balance, due_date, status, created_at, updated_at) FROM stdin;
411fd718-7ca5-40a8-9875-34a4f91f177e	a0000000-0000-0000-0000-000000000001	OI-INV-2026-0001	ec4df7c8-abd2-4e37-8f86-609df458bd2f	62b649b9-5bc5-4d76-8a7f-2018c32bb022	May 2026 Canteen Rent Lease Invoice	20000.00	20000.00	0.00	2026-09-10	PAID	2026-09-10 21:56:49.349025+03	2026-09-10 21:56:49.36729+03
\.


--
-- Data for Name: other_income_receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.other_income_receipts (id, school_id, receipt_number, customer_id, category_id, invoice_id, payer_name, amount, payment_method, bank_account, transaction_reference, cheque_number, description, received_by_user_id, receipt_date, created_at, updated_at) FROM stdin;
4d70f913-27c6-4f9b-b5f1-e29181843afb	a0000000-0000-0000-0000-000000000001	OI-2026-0001	ec4df7c8-abd2-4e37-8f86-609df458bd2f	62b649b9-5bc5-4d76-8a7f-2018c32bb022	411fd718-7ca5-40a8-9875-34a4f91f177e	Apex Canteen Operators	20000.00	BANK_TRANSFER	Main Operations Account (KCB)	KCB-FT-998877	\N	Settlement of Invoice #OI-INV-2026-0001 - May 2026 Canteen Rent Lease Invoice	b0000000-0000-0000-0000-000000000001	2026-09-10	2026-09-10 21:56:49.36729+03	2026-09-10 21:56:49.36729+03
\.


--
-- Data for Name: other_income_take_ons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.other_income_take_ons (id, school_id, customer_id, amount, description, academic_year_id, created_at) FROM stdin;
9f9eabc5-e3b3-4ee5-bf68-464841673bf0	a0000000-0000-0000-0000-000000000001	ec4df7c8-abd2-4e37-8f86-609df458bd2f	3000.00	2025 Term 3 uncollected utility debt	\N	2026-09-10 21:56:49.382074+03
\.


--
-- Data for Name: payment_reversals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_reversals (id, school_id, payment_transaction_id, receipt_number, student_id, amount, channel, requested_by_user_id, approved_by_user_id, reason, rejection_reason, status, reversing_ledger_id, requested_at, reviewed_at) FROM stdin;
\.


--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_transactions (id, school_id, channel, reference_number, amount, payer_phone, payer_name, account_reference, payment_date, raw_payload, reconciliation_status, reconciled_at, created_at) FROM stdin;
cd55e0e6-6ebe-4a43-b8e5-70e6ee388ff9	a0000000-0000-0000-0000-000000000001	MPESA_C2B	REC-23657	5000.00	\N	Simon Mutie	Fee Collection Receipt	2026-09-11 13:20:07.882876+03	\N	MANUALLY_MATCHED	2026-09-11 13:20:07.882876+03	2026-09-11 13:20:07.882876+03
\.


--
-- Data for Name: payments_in_kind; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments_in_kind (id, school_id, student_id, item_name, quantity, unit_of_measure, unit_price, total_value, receipt_number, delivered_by, received_by_user_id, notes, ledger_entry_id, created_at) FROM stdin;
\.


--
-- Data for Name: payroll_periods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_periods (id, school_id, period_month, year, month, total_gross, total_taxable, total_paye, total_nssf, total_shif, total_housing_levy, total_custom_deductions, total_net_payable, staff_count, status, processed_by, approved_by, disbursed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payroll_statutory_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payroll_statutory_rates (id, school_id, nssf_max, shif_rate, housing_levy_employee, housing_levy_employer, personal_relief, insurance_relief_rate, updated_at) FROM stdin;
dac3cfbf-151c-4351-a51a-c7aaa166c1cb	a0000000-0000-0000-0000-000000000001	2160.00	2.75	1.50	1.50	2400.00	15.00	2026-09-11 10:23:20.186663+03
\.


--
-- Data for Name: payslips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payslips (id, school_id, payroll_period_id, staff_id, staff_name, staff_number, role, department, kra_pin, nssf_no, nhif_no, bank_name, bank_account, basic_salary, allowances, gross_pay, nssf_tier_1, nssf_tier_2, total_nssf, taxable_pay, paye_tax, personal_relief, insurance_relief, net_tax_paye, shif_nhif, housing_levy, sacco_deductions, welfare_deductions, loan_advance_recovery, total_deductions, net_pay, status, created_at) FROM stdin;
\.


--
-- Data for Name: petty_cash_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.petty_cash_entries (id, school_id, voucher_number, entry_type, amount, payee_name, category_id, receipt_reference, balance_after, description, recorded_by_user_id, created_at) FROM stdin;
\.


--
-- Data for Name: pledges; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pledges (id, school_id, student_id, guardian_id, amount, pledge_date, expected_payment_date, fulfilled_amount, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: pocket_money_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pocket_money_accounts (id, school_id, student_id, current_balance, daily_spend_limit, is_locked, notes, created_at, updated_at) FROM stdin;
fc86b736-9658-4e56-9001-dad2990543dd	a0000000-0000-0000-0000-000000000001	7b2f0a83-9413-4d87-a0bd-877a81579171	0.00	0.00	f	\N	2026-09-11 13:12:54.834363	2026-09-11 13:13:26.538938
\.


--
-- Data for Name: pocket_money_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pocket_money_transactions (id, school_id, account_id, student_id, transaction_type, amount, balance_after, channel, reference_no, served_by, notes, created_at) FROM stdin;
3c995b3c-093a-48cc-89d4-2aa90d1f614a	a0000000-0000-0000-0000-000000000001	fc86b736-9658-4e56-9001-dad2990543dd	7b2f0a83-9413-4d87-a0bd-877a81579171	DEPOSIT	50.00	50.00	Cash	DEP-000001	Bursar Desk	Parent Top-up	2026-09-11 13:12:54.834363
581e2443-ca82-4116-afcb-4975dba5d8f6	a0000000-0000-0000-0000-000000000001	fc86b736-9658-4e56-9001-dad2990543dd	7b2f0a83-9413-4d87-a0bd-877a81579171	WITHDRAWAL	50.00	0.00	Cash	WTH-000002	Canteen Cashier	Pocket money disbursement	2026-09-11 13:13:26.538938
\.


--
-- Data for Name: receipts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.receipts (id, school_id, receipt_number, student_id, ledger_entry_id, payment_transaction_id, amount, payment_mode, reference_code, pdf_url, issued_at) FROM stdin;
6a25b647-4c11-46d8-a1d8-ecfa477afb8c	a0000000-0000-0000-0000-000000000001	RCT-2026-0002	f699362e-ef58-4999-8888-337f9581da31	8872656b-d211-4025-9b3b-3ea04104a992	cd55e0e6-6ebe-4a43-b8e5-70e6ee388ff9	5000.00	MPESA_C2B	REC-23657	\N	2026-09-11 13:20:07.882876+03
\.


--
-- Data for Name: reconciliation_matches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reconciliation_matches (id, school_id, payment_transaction_id, student_id, ledger_entry_id, receipt_id, match_strategy, confidence_score, matched_by_user_id, match_notes, created_at) FROM stdin;
e34faf49-3664-4a67-ba9d-c37f2a0df188	a0000000-0000-0000-0000-000000000001	cd55e0e6-6ebe-4a43-b8e5-70e6ee388ff9	f699362e-ef58-4999-8888-337f9581da31	8872656b-d211-4025-9b3b-3ea04104a992	6a25b647-4c11-46d8-a1d8-ecfa477afb8c	MANUAL_BURSAR_ENTRY	100.00	b0000000-0000-0000-0000-000000000001	Fee Collection Receipt	2026-09-11 13:20:07.882876+03
\.


--
-- Data for Name: roles_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles_permissions (id, school_id, role, permission_key, is_granted, created_at) FROM stdin;
\.


--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schools (id, name, code, subdomain, email, phone, address, logo_url, currency, mpesa_paybill, mpesa_consumer_key, mpesa_consumer_secret, mpesa_passkey, sms_sender_id, sms_api_key, is_active, created_at, updated_at, motto, registration_number, county, postal_address, bank_name, bank_account_name, bank_account_number, bank_branch) FROM stdin;
a0000000-0000-0000-0000-000000000001	NDUUNDUNE SECONDARY SCHOOL	18324202	nduundune	nduundunesec@gmail.com	+254 722 336 013	P.O. Box 46 - 90121, Emali, Kenya		KES	522123	\N	\N	\N	NDUUNDUNE	\N	t	2026-09-06 18:11:43.74628+03	2026-09-10 18:30:28.413923+03	Strive for Academic Excellence & Integrity	2040123	Emali	P.O. Box 46 - 90121	Kenya Commercial Bank	Nduundune Secondary School	111111111	Emali Branch
\.


--
-- Data for Name: sms_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sms_logs (id, school_id, recipient_phone, student_id, message_type, message_body, status, provider_message_id, created_at) FROM stdin;
28463576-34ea-413a-9395-5a9157dffb9b	a0000000-0000-0000-0000-000000000001	+254712154315	f699362e-ef58-4999-8888-337f9581da31	RECEIPT	Dear Guardian, payment of KES 10.00 for Willy Mutunga (Adm: BDR-001) received. Receipt: RCT-2026-0001, Ref: TEST-86994. Current Balance: KES 13,990.00. NDUUNDUNE SECONDARY SCHOOL.	SENT	AT_MSG_6aa3d5b74eae1	2026-09-11 13:19:35.290089+03
593f7be6-2e28-452b-aa5c-d379689ddcc2	a0000000-0000-0000-0000-000000000001	+254712154315	f699362e-ef58-4999-8888-337f9581da31	RECEIPT	Dear Guardian, payment of KES 5,000.00 for Willy Mutunga (Adm: BDR-001) received. Receipt: RCT-2026-0002, Ref: REC-23657. Current Balance: KES 8,990.00. NDUUNDUNE SECONDARY SCHOOL.	SENT	AT_MSG_6aa3d5d7db99b	2026-09-11 13:20:07.882876+03
\.


--
-- Data for Name: staff_allowance_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_allowance_types (id, school_id, name, type, amount, taxable, applies_to, status, created_at) FROM stdin;
74ea5eb0-b14b-4a26-8cf0-69d26745672f	a0000000-0000-0000-0000-000000000001	Responsibility Allowance (HODs / Deputies)	Fixed	6000.00	t	Teaching	Active	2026-09-11 10:23:20.197893+03
1d08fa58-57d6-4484-b875-35df2ad640d6	a0000000-0000-0000-0000-000000000001	House Allowance	Fixed	12000.00	t	All Staff	Active	2026-09-11 10:23:20.198937+03
807aa9eb-d372-441b-be70-c41998b7fa1a	a0000000-0000-0000-0000-000000000001	Commuter Allowance	Fixed	4000.00	t	All Staff	Active	2026-09-11 10:23:20.199357+03
723c108f-d3fc-41c0-a1b0-624236cdb43c	a0000000-0000-0000-0000-000000000001	Special Duty / Overtime Allowance	Variable	3500.00	t	Non-Teaching	Active	2026-09-11 10:23:20.199794+03
\.


--
-- Data for Name: staff_deduction_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_deduction_types (id, school_id, name, amount, type, recipient, status, created_at) FROM stdin;
99e0ab40-b689-46b8-853e-967291c4f0e0	a0000000-0000-0000-0000-000000000001	Staff Welfare Association	500.00	Fixed Monthly	School Staff Welfare Account	Active	2026-09-11 10:23:20.201779+03
1cbb06b1-f092-4807-b28b-f9cd141e8b5c	a0000000-0000-0000-0000-000000000001	Staff Benevolent Fund	300.00	Fixed Monthly	Benevolent Emergency Fund	Active	2026-09-11 10:23:20.203002+03
d0dcdd44-6e00-415e-8b8a-675789170b91	a0000000-0000-0000-0000-000000000001	Mwalimu National Sacco Shares & Loan	5000.00	Voluntary Checkoff	Mwalimu National Sacco	Active	2026-09-11 10:23:20.203438+03
4377b3a8-3b7d-46e6-86a7-f871b774daea	a0000000-0000-0000-0000-000000000001	Staff Emergency Advance Recovery	3000.00	Loan Repayment	School Operations Holding	Active	2026-09-11 10:23:20.204348+03
\.


--
-- Data for Name: staff_departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_departments (id, school_id, name, code, head_title, vote_head_name, status, created_at) FROM stdin;
e7d3accd-f35b-43ff-8c47-d208bfe8473f	a0000000-0000-0000-0000-000000000001	Administration	ADM	Principal	Administration & Operations	Active	2026-09-11 10:23:20.192067+03
0f808b8d-6510-4237-ab85-71b411c64603	a0000000-0000-0000-0000-000000000001	Academic / Teaching	ACAD	Deputy Principal (Academics)	Tuition & Teaching Materials	Active	2026-09-11 10:23:20.193125+03
cf69a4de-f4d1-4762-85b5-033743a1b53e	a0000000-0000-0000-0000-000000000001	Finance & Accounts	FIN	Bursar	Administration & Operations	Active	2026-09-11 10:23:20.19354+03
6dac6eb2-9e28-400e-975f-dc6888b617b8	a0000000-0000-0000-0000-000000000001	Boarding & Catering	BRD	Boarding Master	Boarding & Kitchen Operations	Active	2026-09-11 10:23:20.194094+03
8db2bb91-4f9b-43b6-9562-eec980d9246c	a0000000-0000-0000-0000-000000000001	Transport & Maintenance	TRN	Senior Driver	Repairs, Maintenance & Transport	Active	2026-09-11 10:23:20.194646+03
\.


--
-- Data for Name: staff_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_members (id, school_id, staff_number, first_name, last_name, role, department_id, department_name, phone, email, national_id, kra_pin, nssf_number, nhif_number, bank_name, bank_branch, bank_account_number, basic_salary, house_allowance, commuter_allowance, other_allowances, custom_deductions, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: stk_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stk_attempts (id, school_id, student_id, phone_number, amount, account_reference, checkout_request_id, merchant_request_id, status, response_description, created_at) FROM stdin;
\.


--
-- Data for Name: streams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.streams (id, school_id, class_id, name, created_at) FROM stdin;
edcd1551-0082-4124-948a-bf6f1a199a73	a0000000-0000-0000-0000-000000000001	865c9bc4-365e-4b8a-b8ce-4585ce938a66	West	2026-09-07 15:01:59.126256+03
6ed14376-0bbc-41ca-aad1-8b6fa3b4c0ef	a0000000-0000-0000-0000-000000000001	865c9bc4-365e-4b8a-b8ce-4585ce938a66	East	2026-09-07 15:14:03.874628+03
6751b6ef-9feb-4478-9ca4-080f6154f657	a0000000-0000-0000-0000-000000000001	45bc4c90-a71c-4750-ae67-542826e5d0df	East	2026-09-10 20:37:30.525183+03
86c24fe9-045c-4656-a320-536bb25a75d0	a0000000-0000-0000-0000-000000000001	45bc4c90-a71c-4750-ae67-542826e5d0df	West	2026-09-10 20:37:42.570434+03
\.


--
-- Data for Name: student_group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_group_members (id, school_id, group_id, student_id, assigned_at) FROM stdin;
\.


--
-- Data for Name: student_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_groups (id, school_id, name, category, patron, created_at) FROM stdin;
ecb5e393-b94b-4b13-a198-9e4f3cf003df	a0000000-0000-0000-0000-000000000001	Kilimanjaro House	House / Dormitory	Mr. Otieno	2026-09-07 18:28:45.846601+03
88199ebc-1755-48ff-84c1-5acc90871e8f	a0000000-0000-0000-0000-000000000001	Serengeti House	House / Dormitory	Mrs. Wanjiku	2026-09-07 18:28:45.846601+03
5f0983da-dd1c-4358-817a-84ecd8af8d9c	a0000000-0000-0000-0000-000000000001	Science & Robotics Club	Extracurricular Club	Mr. Mwangi	2026-09-07 18:28:45.846601+03
b6c8e3a6-6db5-42a0-88d0-9940a5c34fba	a0000000-0000-0000-0000-000000000001	Drama & Music Society	Extracurricular Club	Ms. Achieng	2026-09-07 18:28:45.846601+03
\.


--
-- Data for Name: student_guardians; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_guardians (id, school_id, student_id, guardian_id, is_primary, created_at) FROM stdin;
51c757ff-311d-478c-bb2e-77a700db32b6	a0000000-0000-0000-0000-000000000001	f699362e-ef58-4999-8888-337f9581da31	d828ef8b-5371-4d1a-9f43-6d480a9f7a6d	t	2026-09-10 19:47:07.02742+03
6e3ef61a-7f1c-409a-be14-067919ac702d	a0000000-0000-0000-0000-000000000001	7b2f0a83-9413-4d87-a0bd-877a81579171	9c4a198e-8351-4b65-86e9-55f2581de14e	t	2026-09-10 20:34:11.051793+03
e29a8890-af99-47de-83ad-e3bfd6060a7d	a0000000-0000-0000-0000-000000000001	bb3ae542-375e-4cdc-8d16-2ba58444ffbe	9c4a198e-8351-4b65-86e9-55f2581de14e	t	2026-09-10 20:35:57.719994+03
\.


--
-- Data for Name: student_transport_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_transport_subscriptions (id, school_id, student_id, route_id, vehicle_id, pickup_point, term_fee, academic_year_id, term_id, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, school_id, admission_number, first_name, last_name, gender, date_of_birth, class_id, stream_id, status, boarding_status, opening_balance, created_at, updated_at) FROM stdin;
f699362e-ef58-4999-8888-337f9581da31	a0000000-0000-0000-0000-000000000001	BDR-001	Willy	Mutunga	Male	\N	45bc4c90-a71c-4750-ae67-542826e5d0df	6751b6ef-9feb-4478-9ca4-080f6154f657	ACTIVE	BOARDING	0.00	2026-09-10 19:47:07.02742+03	2026-09-10 21:02:34.60191+03
7b2f0a83-9413-4d87-a0bd-877a81579171	a0000000-0000-0000-0000-000000000001	BDR-002	Peter	Mutie	Female	\N	45bc4c90-a71c-4750-ae67-542826e5d0df	86c24fe9-045c-4656-a320-536bb25a75d0	ACTIVE	DAY	0.00	2026-09-10 20:34:11.051793+03	2026-09-10 21:02:34.60191+03
bb3ae542-375e-4cdc-8d16-2ba58444ffbe	a0000000-0000-0000-0000-000000000001	BDR-003	Samuel	Mutie	Male	\N	45bc4c90-a71c-4750-ae67-542826e5d0df	86c24fe9-045c-4656-a320-536bb25a75d0	ACTIVE	BOARDING	0.00	2026-09-10 20:35:57.719994+03	2026-09-10 21:02:34.60191+03
\.


--
-- Data for Name: supplier_bills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplier_bills (id, school_id, bill_number, supplier_id, supplier_name, category_id, lpo_id, bill_date, due_date, amount, amount_paid, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: supplier_take_ons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplier_take_ons (id, school_id, supplier_id, invoice_ref, invoice_date, amount, amount_settled, description, created_at) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, school_id, supplier_code, name, category, contact_person, phone, email, address, bank_name, bank_account_no, kra_pin, opening_balance, current_balance, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: system_configurations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_configurations (id, school_id, config_key, config_value, category, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: terms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.terms (id, school_id, academic_year_id, name, start_date, end_date, is_current, created_at) FROM stdin;
b1111111-1111-1111-1111-111111111111	a0000000-0000-0000-0000-000000000001	a1111111-1111-1111-1111-111111111111	Term 1	2026-01-05	2026-04-03	t	2026-09-07 20:12:43.427971+03
b2222222-2222-2222-2222-222222222222	a0000000-0000-0000-0000-000000000001	a1111111-1111-1111-1111-111111111111	Term 2	2026-05-04	2026-08-07	f	2026-09-07 20:12:43.427971+03
b3333333-3333-3333-3333-333333333333	a0000000-0000-0000-0000-000000000001	a1111111-1111-1111-1111-111111111111	Term 3	2026-08-31	2026-10-30	f	2026-09-07 20:12:43.427971+03
\.


--
-- Data for Name: transaction_ledger; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transaction_ledger (id, school_id, student_id, term_id, entry_type, debit_amount, credit_amount, payment_transaction_id, receipt_number, original_ledger_id, description, recorded_by_user_id, checksum, created_at) FROM stdin;
58a41ba1-ffba-46f2-8bdc-dbd4aca99aeb	a0000000-0000-0000-0000-000000000001	f699362e-ef58-4999-8888-337f9581da31	b1111111-1111-1111-1111-111111111111	INVOICE_CHARGE	14000.00	0.00	\N	\N	\N	Initial Term Billing - Form 1 Term 1 - Boarding Fee Structure (INV-2026-8291)	\N	a0e426f303925c0a4a9d23c930eccf59e5945c0ab53a9556223ec76f2919e9d9	2026-09-10 18:47:07+03
12148c2f-d356-4f81-ad3d-196824adaf4a	a0000000-0000-0000-0000-000000000001	bb3ae542-375e-4cdc-8d16-2ba58444ffbe	b1111111-1111-1111-1111-111111111111	INVOICE_CHARGE	14000.00	0.00	\N	\N	\N	Initial Term Billing - Form 1 Term 1 - Boarding Fee Structure (INV-2026-3755)	\N	89962afa85a6d12abddde833954326b0588d26bd2b06f7752dac775b70355d5c	2026-09-10 19:35:57+03
41516c52-77d1-48e7-a232-fedd2c5b7426	a0000000-0000-0000-0000-000000000001	\N	\N	JOURNAL	2500.00	2500.00	\N	\N	\N	JOURNAL [JRN-2026-5515]: Automated test adjustment	\N	5c1a1e44bfd7540acd70917130c3611a77cb7449cee17e3098aaf9827c2289bd	2026-09-10 22:53:03.294993+03
8872656b-d211-4025-9b3b-3ea04104a992	a0000000-0000-0000-0000-000000000001	f699362e-ef58-4999-8888-337f9581da31	b1111111-1111-1111-1111-111111111111	PAYMENT_CREDIT	0.00	5000.00	cd55e0e6-6ebe-4a43-b8e5-70e6ee388ff9	RCT-2026-0002	\N	Fee Payment [Channel: MPESA_C2B, Ref: REC-23657]	b0000000-0000-0000-0000-000000000001	2d1064fece3eec19d6f1b65b010253089fd6a353540e02aa911c2cd2fb1d4f92	2026-09-11 12:20:07+03
59a14387-df25-4447-a2e8-580a8df378ca	a0000000-0000-0000-0000-000000000001	7b2f0a83-9413-4d87-a0bd-877a81579171	b1111111-1111-1111-1111-111111111111	INVOICE_CHARGE	6500.00	0.00	\N	\N	\N	Initial Term Billing - Form 1 Term 1 - Day Scholar Fee Structure (INV-2026-7687)	\N	e4c06792b49008d5647dda5a77547610de394928b201873cd88b78cd863c115d	2026-09-10 19:34:11+03
\.


--
-- Data for Name: transport_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transport_logs (id, school_id, vehicle_id, log_type, amount, odometer_reading, vendor, notes, log_date, created_at) FROM stdin;
\.


--
-- Data for Name: transport_routes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transport_routes (id, school_id, name, pickup_points, term_fee, vehicle_id, return_trip_type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transport_vehicles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transport_vehicles (id, school_id, reg_no, model, capacity, driver_name, driver_phone, status, mileage, insurance_expiry, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, school_id, name, email, phone, password_hash, role, is_active, last_login_at, created_at, updated_at) FROM stdin;
b0000000-0000-0000-0000-000000000001	a0000000-0000-0000-0000-000000000001	Willy	willy	+254700000001	$2y$10$XV0a6dubhoLj5FmOkGwCZOzS6Iw3ibnQym2noUx1qIEcxCw5ohNXu	super_admin	t	\N	2026-09-07 20:13:59.413534+03	2026-09-10 12:13:41.113739+03
7e864234-87ca-473a-9182-b239d0dd4ff7	a0000000-0000-0000-0000-000000000001	Mbithi	kioko@nduundune	0712345678	$2y$10$IuuwSuKVG.JbFjXUCiTRHuAtKcQIVWQrE6/f3C/SRvPBc3kqnj9Qy	bursar	t	\N	2026-09-10 16:43:04.354896+03	2026-09-10 16:43:04.354896+03
90ecca18-4282-4ce5-ae01-57bbfb03b944	a0000000-0000-0000-0000-000000000001	Nicholus Makunu	nicholas@nduundune.ac.ke	0722336013	$2y$10$yPwn/YrEGRwQBlK49DCF3eiA5CVyMIpx5A1DJVs2ZlQSm/dKeSd66	head_teacher	t	\N	2026-09-10 17:50:41.326063+03	2026-09-10 17:50:41.326063+03
\.


--
-- Data for Name: vote_head_budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vote_head_budgets (id, school_id, vote_head_id, financial_year, budgeted_amount, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: vote_heads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vote_heads (id, school_id, name, account_code, is_optional, description, created_at, account_type_id) FROM stdin;
91b4bc93-df44-454d-8eb6-c8b07a73688b	a0000000-0000-0000-0000-000000000001	Tuition Fee	101	f	Core classroom tuition & academic instruction	2026-09-07 20:12:43.445412+03	\N
0367474d-1da8-49b4-82be-b6a30979fcba	a0000000-0000-0000-0000-000000000001	Boarding & Accommodation	102	f	Boarding meals, dorm maintenance, catering	2026-09-07 20:12:43.445412+03	\N
bc30bf18-7101-4d2d-8ade-bfd43d28618c	a0000000-0000-0000-0000-000000000001	RMI (Repairs & Maintenance)	103	f	Facility repairs and classroom maintenance	2026-09-07 20:12:43.445412+03	\N
4c664491-fd5a-4104-921d-58dfe9f0e2c5	a0000000-0000-0000-0000-000000000001	Activity & Sports	104	f	Extracurricular, drama, sports competitions	2026-09-07 20:12:43.445412+03	\N
874d1d79-500e-47b1-9407-631aa69249c0	a0000000-0000-0000-0000-000000000001	Electricity & Water (EW&C)	105	f	Utility bills	2026-09-07 20:12:43.445412+03	\N
549eba51-c93d-40dd-ac18-454231300934	a0000000-0000-0000-0000-000000000001	School Bus / Transport	106	t	Optional daily transport route	2026-09-07 20:12:43.445412+03	\N
\.


--
-- Name: academic_years academic_years_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_pkey PRIMARY KEY (id);


--
-- Name: account_take_ons account_take_ons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_take_ons
    ADD CONSTRAINT account_take_ons_pkey PRIMARY KEY (id);


--
-- Name: account_transfers account_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_transfers
    ADD CONSTRAINT account_transfers_pkey PRIMARY KEY (id);


--
-- Name: account_types account_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: asset_categories asset_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_categories
    ADD CONSTRAINT asset_categories_pkey PRIMARY KEY (id);


--
-- Name: asset_depreciation_logs asset_depreciation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_depreciation_logs
    ADD CONSTRAINT asset_depreciation_logs_pkey PRIMARY KEY (id);


--
-- Name: asset_maintenance_logs asset_maintenance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_maintenance_logs
    ADD CONSTRAINT asset_maintenance_logs_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bank_integrations bank_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_integrations
    ADD CONSTRAINT bank_integrations_pkey PRIMARY KEY (id);


--
-- Name: bursaries bursaries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bursaries
    ADD CONSTRAINT bursaries_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: deletion_audits deletion_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.deletion_audits
    ADD CONSTRAINT deletion_audits_pkey PRIMARY KEY (id);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (id);


--
-- Name: donors donors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expense_vouchers expense_vouchers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_vouchers
    ADD CONSTRAINT expense_vouchers_pkey PRIMARY KEY (id);


--
-- Name: fee_adjustments fee_adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_adjustments
    ADD CONSTRAINT fee_adjustments_pkey PRIMARY KEY (id);


--
-- Name: fee_invoices fee_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT fee_invoices_pkey PRIMARY KEY (id);


--
-- Name: fee_refunds fee_refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_refunds
    ADD CONSTRAINT fee_refunds_pkey PRIMARY KEY (id);


--
-- Name: fee_structure_items fee_structure_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_structure_items
    ADD CONSTRAINT fee_structure_items_pkey PRIMARY KEY (id);


--
-- Name: fee_structures fee_structures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT fee_structures_pkey PRIMARY KEY (id);


--
-- Name: fixed_assets fixed_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_pkey PRIMARY KEY (id);


--
-- Name: grants grants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grants
    ADD CONSTRAINT grants_pkey PRIMARY KEY (id);


--
-- Name: guardians guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_pkey PRIMARY KEY (id);


--
-- Name: inventory_categories inventory_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_categories
    ADD CONSTRAINT inventory_categories_pkey PRIMARY KEY (id);


--
-- Name: inventory_items inventory_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_pkey PRIMARY KEY (id);


--
-- Name: inventory_stores inventory_stores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_stores
    ADD CONSTRAINT inventory_stores_pkey PRIMARY KEY (id);


--
-- Name: inventory_transactions inventory_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id);


--
-- Name: inventory_units inventory_units_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_units
    ADD CONSTRAINT inventory_units_pkey PRIMARY KEY (id);


--
-- Name: journal_entries journal_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal_entries
    ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);


--
-- Name: journal_entry_items journal_entry_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal_entry_items
    ADD CONSTRAINT journal_entry_items_pkey PRIMARY KEY (id);


--
-- Name: local_purchase_orders local_purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_purchase_orders
    ADD CONSTRAINT local_purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: messaging_broadcasts messaging_broadcasts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messaging_broadcasts
    ADD CONSTRAINT messaging_broadcasts_pkey PRIMARY KEY (id);


--
-- Name: messaging_templates messaging_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messaging_templates
    ADD CONSTRAINT messaging_templates_pkey PRIMARY KEY (id);


--
-- Name: other_income_categories other_income_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_categories
    ADD CONSTRAINT other_income_categories_pkey PRIMARY KEY (id);


--
-- Name: other_income_customers other_income_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_customers
    ADD CONSTRAINT other_income_customers_pkey PRIMARY KEY (id);


--
-- Name: other_income_invoices other_income_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_invoices
    ADD CONSTRAINT other_income_invoices_pkey PRIMARY KEY (id);


--
-- Name: other_income_receipts other_income_receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_receipts
    ADD CONSTRAINT other_income_receipts_pkey PRIMARY KEY (id);


--
-- Name: other_income_take_ons other_income_take_ons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_take_ons
    ADD CONSTRAINT other_income_take_ons_pkey PRIMARY KEY (id);


--
-- Name: payment_reversals payment_reversals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: payments_in_kind payments_in_kind_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments_in_kind
    ADD CONSTRAINT payments_in_kind_pkey PRIMARY KEY (id);


--
-- Name: payroll_periods payroll_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT payroll_periods_pkey PRIMARY KEY (id);


--
-- Name: payroll_statutory_rates payroll_statutory_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_statutory_rates
    ADD CONSTRAINT payroll_statutory_rates_pkey PRIMARY KEY (id);


--
-- Name: payroll_statutory_rates payroll_statutory_rates_school_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_statutory_rates
    ADD CONSTRAINT payroll_statutory_rates_school_id_key UNIQUE (school_id);


--
-- Name: payslips payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_pkey PRIMARY KEY (id);


--
-- Name: petty_cash_entries petty_cash_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.petty_cash_entries
    ADD CONSTRAINT petty_cash_entries_pkey PRIMARY KEY (id);


--
-- Name: pledges pledges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pledges
    ADD CONSTRAINT pledges_pkey PRIMARY KEY (id);


--
-- Name: pocket_money_accounts pocket_money_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pocket_money_accounts
    ADD CONSTRAINT pocket_money_accounts_pkey PRIMARY KEY (id);


--
-- Name: pocket_money_accounts pocket_money_accounts_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pocket_money_accounts
    ADD CONSTRAINT pocket_money_accounts_student_id_key UNIQUE (student_id);


--
-- Name: pocket_money_transactions pocket_money_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pocket_money_transactions
    ADD CONSTRAINT pocket_money_transactions_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: reconciliation_matches reconciliation_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliation_matches
    ADD CONSTRAINT reconciliation_matches_pkey PRIMARY KEY (id);


--
-- Name: roles_permissions roles_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permissions
    ADD CONSTRAINT roles_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles_permissions roles_permissions_school_id_role_permission_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_permissions
    ADD CONSTRAINT roles_permissions_school_id_role_permission_key_key UNIQUE (school_id, role, permission_key);


--
-- Name: schools schools_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_code_key UNIQUE (code);


--
-- Name: schools schools_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_pkey PRIMARY KEY (id);


--
-- Name: schools schools_subdomain_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schools
    ADD CONSTRAINT schools_subdomain_key UNIQUE (subdomain);


--
-- Name: sms_logs sms_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_pkey PRIMARY KEY (id);


--
-- Name: staff_allowance_types staff_allowance_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_allowance_types
    ADD CONSTRAINT staff_allowance_types_pkey PRIMARY KEY (id);


--
-- Name: staff_deduction_types staff_deduction_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_deduction_types
    ADD CONSTRAINT staff_deduction_types_pkey PRIMARY KEY (id);


--
-- Name: staff_departments staff_departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_departments
    ADD CONSTRAINT staff_departments_pkey PRIMARY KEY (id);


--
-- Name: staff_members staff_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_pkey PRIMARY KEY (id);


--
-- Name: stk_attempts stk_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stk_attempts
    ADD CONSTRAINT stk_attempts_pkey PRIMARY KEY (id);


--
-- Name: streams streams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_pkey PRIMARY KEY (id);


--
-- Name: student_group_members student_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_group_members
    ADD CONSTRAINT student_group_members_pkey PRIMARY KEY (id);


--
-- Name: student_groups student_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_groups
    ADD CONSTRAINT student_groups_pkey PRIMARY KEY (id);


--
-- Name: student_guardians student_guardians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_guardians
    ADD CONSTRAINT student_guardians_pkey PRIMARY KEY (id);


--
-- Name: student_transport_subscriptions student_transport_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_transport_subscriptions
    ADD CONSTRAINT student_transport_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: supplier_bills supplier_bills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_bills
    ADD CONSTRAINT supplier_bills_pkey PRIMARY KEY (id);


--
-- Name: supplier_take_ons supplier_take_ons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_take_ons
    ADD CONSTRAINT supplier_take_ons_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: system_configurations system_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configurations
    ADD CONSTRAINT system_configurations_pkey PRIMARY KEY (id);


--
-- Name: system_configurations system_configurations_school_id_config_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_configurations
    ADD CONSTRAINT system_configurations_school_id_config_key_key UNIQUE (school_id, config_key);


--
-- Name: terms terms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_pkey PRIMARY KEY (id);


--
-- Name: transaction_ledger transaction_ledger_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ledger
    ADD CONSTRAINT transaction_ledger_pkey PRIMARY KEY (id);


--
-- Name: transport_logs transport_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_logs
    ADD CONSTRAINT transport_logs_pkey PRIMARY KEY (id);


--
-- Name: transport_routes transport_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_routes
    ADD CONSTRAINT transport_routes_pkey PRIMARY KEY (id);


--
-- Name: transport_vehicles transport_vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_vehicles
    ADD CONSTRAINT transport_vehicles_pkey PRIMARY KEY (id);


--
-- Name: student_group_members uq_group_student; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_group_members
    ADD CONSTRAINT uq_group_student UNIQUE (group_id, student_id);


--
-- Name: students uq_school_admission; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT uq_school_admission UNIQUE (school_id, admission_number);


--
-- Name: bank_integrations uq_school_bank_acc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_integrations
    ADD CONSTRAINT uq_school_bank_acc UNIQUE (school_id, bank_name, account_number);


--
-- Name: other_income_customers uq_school_customer_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_customers
    ADD CONSTRAINT uq_school_customer_code UNIQUE (school_id, customer_code);


--
-- Name: donations uq_school_donation_receipt_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT uq_school_donation_receipt_no UNIQUE (school_id, receipt_number);


--
-- Name: donors uq_school_donor_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT uq_school_donor_code UNIQUE (school_id, donor_code);


--
-- Name: guardians uq_school_guardian_phone; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT uq_school_guardian_phone UNIQUE (school_id, phone);


--
-- Name: fee_invoices uq_school_invoice_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT uq_school_invoice_no UNIQUE (school_id, invoice_number);


--
-- Name: other_income_invoices uq_school_oi_invoice_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_invoices
    ADD CONSTRAINT uq_school_oi_invoice_no UNIQUE (school_id, invoice_number);


--
-- Name: other_income_receipts uq_school_oi_receipt_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_receipts
    ADD CONSTRAINT uq_school_oi_receipt_no UNIQUE (school_id, receipt_number);


--
-- Name: payment_transactions uq_school_payment_ref; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT uq_school_payment_ref UNIQUE (school_id, channel, reference_number);


--
-- Name: payroll_periods uq_school_payroll_period; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payroll_periods
    ADD CONSTRAINT uq_school_payroll_period UNIQUE (school_id, period_month);


--
-- Name: receipts uq_school_receipt_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT uq_school_receipt_no UNIQUE (school_id, receipt_number);


--
-- Name: users uq_school_user_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_school_user_email UNIQUE (school_id, email);


--
-- Name: expense_vouchers uq_school_voucher_no; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_vouchers
    ADD CONSTRAINT uq_school_voucher_no UNIQUE (school_id, voucher_number);


--
-- Name: student_guardians uq_student_guardian; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_guardians
    ADD CONSTRAINT uq_student_guardian UNIQUE (student_id, guardian_id);


--
-- Name: vote_head_budgets uq_vote_head_budget_year; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vote_head_budgets
    ADD CONSTRAINT uq_vote_head_budget_year UNIQUE (school_id, vote_head_id, financial_year);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: vote_head_budgets vote_head_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vote_head_budgets
    ADD CONSTRAINT vote_head_budgets_pkey PRIMARY KEY (id);


--
-- Name: vote_heads vote_heads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vote_heads
    ADD CONSTRAINT vote_heads_pkey PRIMARY KEY (id);


--
-- Name: idx_account_take_ons_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_take_ons_school ON public.account_take_ons USING btree (school_id);


--
-- Name: idx_account_transfers_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_transfers_school ON public.account_transfers USING btree (school_id);


--
-- Name: idx_account_types_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_account_types_school ON public.account_types USING btree (school_id);


--
-- Name: idx_accounts_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_school ON public.accounts USING btree (school_id);


--
-- Name: idx_audit_school_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_school_created ON public.audit_logs USING btree (school_id, created_at);


--
-- Name: idx_fee_refunds_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_fee_refunds_school ON public.fee_refunds USING btree (school_id);


--
-- Name: idx_guardians_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_guardians_phone ON public.guardians USING btree (school_id, phone);


--
-- Name: idx_inventory_categories_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_categories_school ON public.inventory_categories USING btree (school_id);


--
-- Name: idx_inventory_items_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_items_school ON public.inventory_items USING btree (school_id);


--
-- Name: idx_inventory_stores_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_stores_school ON public.inventory_stores USING btree (school_id);


--
-- Name: idx_inventory_transactions_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_transactions_item ON public.inventory_transactions USING btree (item_id);


--
-- Name: idx_inventory_transactions_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_transactions_school ON public.inventory_transactions USING btree (school_id);


--
-- Name: idx_inventory_units_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_units_school ON public.inventory_units USING btree (school_id);


--
-- Name: idx_journal_entries_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_journal_entries_school ON public.journal_entries USING btree (school_id);


--
-- Name: idx_journal_items_entry; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_journal_items_entry ON public.journal_entry_items USING btree (journal_entry_id);


--
-- Name: idx_ledger_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_created ON public.transaction_ledger USING btree (created_at);


--
-- Name: idx_ledger_school_student; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ledger_school_student ON public.transaction_ledger USING btree (school_id, student_id);


--
-- Name: idx_lpos_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lpos_school ON public.local_purchase_orders USING btree (school_id);


--
-- Name: idx_payment_trans_recon; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_trans_recon ON public.payment_transactions USING btree (school_id, reconciliation_status);


--
-- Name: idx_payment_trans_ref; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_trans_ref ON public.payment_transactions USING btree (school_id, reference_number);


--
-- Name: idx_payroll_periods_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payroll_periods_school ON public.payroll_periods USING btree (school_id);


--
-- Name: idx_payslips_period; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payslips_period ON public.payslips USING btree (payroll_period_id);


--
-- Name: idx_payslips_staff; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payslips_staff ON public.payslips USING btree (staff_id);


--
-- Name: idx_petty_cash_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_petty_cash_school ON public.petty_cash_entries USING btree (school_id);


--
-- Name: idx_staff_allowance_types_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_allowance_types_school ON public.staff_allowance_types USING btree (school_id);


--
-- Name: idx_staff_deduction_types_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_deduction_types_school ON public.staff_deduction_types USING btree (school_id);


--
-- Name: idx_staff_departments_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_departments_school ON public.staff_departments USING btree (school_id);


--
-- Name: idx_staff_members_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staff_members_school ON public.staff_members USING btree (school_id);


--
-- Name: idx_students_class; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_class ON public.students USING btree (class_id);


--
-- Name: idx_students_school_adm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_students_school_adm ON public.students USING btree (school_id, admission_number);


--
-- Name: idx_supplier_bills_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_bills_school ON public.supplier_bills USING btree (school_id);


--
-- Name: idx_supplier_take_ons_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_supplier_take_ons_school ON public.supplier_take_ons USING btree (school_id);


--
-- Name: idx_suppliers_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_suppliers_school ON public.suppliers USING btree (school_id);


--
-- Name: idx_users_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_school ON public.users USING btree (school_id);


--
-- Name: idx_vote_head_budgets_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vote_head_budgets_school ON public.vote_head_budgets USING btree (school_id);


--
-- Name: idx_vouchers_school_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_vouchers_school_status ON public.expense_vouchers USING btree (school_id, status);


--
-- Name: academic_years academic_years_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_years
    ADD CONSTRAINT academic_years_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: asset_depreciation_logs asset_depreciation_logs_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_depreciation_logs
    ADD CONSTRAINT asset_depreciation_logs_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.fixed_assets(id) ON DELETE CASCADE;


--
-- Name: asset_maintenance_logs asset_maintenance_logs_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_maintenance_logs
    ADD CONSTRAINT asset_maintenance_logs_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.fixed_assets(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: bank_integrations bank_integrations_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_integrations
    ADD CONSTRAINT bank_integrations_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: bursaries bursaries_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bursaries
    ADD CONSTRAINT bursaries_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id);


--
-- Name: bursaries bursaries_ledger_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bursaries
    ADD CONSTRAINT bursaries_ledger_entry_id_fkey FOREIGN KEY (ledger_entry_id) REFERENCES public.transaction_ledger(id);


--
-- Name: bursaries bursaries_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bursaries
    ADD CONSTRAINT bursaries_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: bursaries bursaries_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bursaries
    ADD CONSTRAINT bursaries_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: bursaries bursaries_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bursaries
    ADD CONSTRAINT bursaries_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id);


--
-- Name: classes classes_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: donations donations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.other_income_categories(id);


--
-- Name: donations donations_donor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES public.donors(id) ON DELETE RESTRICT;


--
-- Name: donations donations_received_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_received_by_user_id_fkey FOREIGN KEY (received_by_user_id) REFERENCES public.users(id);


--
-- Name: donations donations_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: donors donors_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donors
    ADD CONSTRAINT donors_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: expense_categories expense_categories_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: expense_vouchers expense_vouchers_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_vouchers
    ADD CONSTRAINT expense_vouchers_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: expense_vouchers expense_vouchers_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_vouchers
    ADD CONSTRAINT expense_vouchers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);


--
-- Name: expense_vouchers expense_vouchers_disbursed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_vouchers
    ADD CONSTRAINT expense_vouchers_disbursed_by_user_id_fkey FOREIGN KEY (disbursed_by_user_id) REFERENCES public.users(id);


--
-- Name: expense_vouchers expense_vouchers_requested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_vouchers
    ADD CONSTRAINT expense_vouchers_requested_by_user_id_fkey FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id);


--
-- Name: expense_vouchers expense_vouchers_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_vouchers
    ADD CONSTRAINT expense_vouchers_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: expense_vouchers expense_vouchers_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expense_vouchers
    ADD CONSTRAINT expense_vouchers_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id);


--
-- Name: fee_adjustments fee_adjustments_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_adjustments
    ADD CONSTRAINT fee_adjustments_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: fee_adjustments fee_adjustments_ledger_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_adjustments
    ADD CONSTRAINT fee_adjustments_ledger_entry_id_fkey FOREIGN KEY (ledger_entry_id) REFERENCES public.transaction_ledger(id);


--
-- Name: fee_adjustments fee_adjustments_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_adjustments
    ADD CONSTRAINT fee_adjustments_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: fee_adjustments fee_adjustments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_adjustments
    ADD CONSTRAINT fee_adjustments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: fee_invoices fee_invoices_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT fee_invoices_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id);


--
-- Name: fee_invoices fee_invoices_fee_structure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT fee_invoices_fee_structure_id_fkey FOREIGN KEY (fee_structure_id) REFERENCES public.fee_structures(id);


--
-- Name: fee_invoices fee_invoices_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT fee_invoices_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: fee_invoices fee_invoices_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT fee_invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: fee_invoices fee_invoices_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_invoices
    ADD CONSTRAINT fee_invoices_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id);


--
-- Name: fee_refunds fee_refunds_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_refunds
    ADD CONSTRAINT fee_refunds_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: fee_refunds fee_refunds_disbursed_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_refunds
    ADD CONSTRAINT fee_refunds_disbursed_by_user_id_fkey FOREIGN KEY (disbursed_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: fee_refunds fee_refunds_ledger_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_refunds
    ADD CONSTRAINT fee_refunds_ledger_entry_id_fkey FOREIGN KEY (ledger_entry_id) REFERENCES public.transaction_ledger(id) ON DELETE SET NULL;


--
-- Name: fee_refunds fee_refunds_requested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_refunds
    ADD CONSTRAINT fee_refunds_requested_by_user_id_fkey FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: fee_refunds fee_refunds_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_refunds
    ADD CONSTRAINT fee_refunds_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: fee_refunds fee_refunds_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_refunds
    ADD CONSTRAINT fee_refunds_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: fee_structure_items fee_structure_items_fee_structure_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_structure_items
    ADD CONSTRAINT fee_structure_items_fee_structure_id_fkey FOREIGN KEY (fee_structure_id) REFERENCES public.fee_structures(id) ON DELETE CASCADE;


--
-- Name: fee_structure_items fee_structure_items_vote_head_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_structure_items
    ADD CONSTRAINT fee_structure_items_vote_head_id_fkey FOREIGN KEY (vote_head_id) REFERENCES public.vote_heads(id);


--
-- Name: fee_structures fee_structures_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT fee_structures_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id);


--
-- Name: fee_structures fee_structures_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT fee_structures_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: fee_structures fee_structures_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT fee_structures_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: fee_structures fee_structures_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_structures
    ADD CONSTRAINT fee_structures_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id);


--
-- Name: fixed_assets fixed_assets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.asset_categories(id) ON DELETE SET NULL;


--
-- Name: fixed_assets fixed_assets_custodian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fixed_assets
    ADD CONSTRAINT fixed_assets_custodian_id_fkey FOREIGN KEY (custodian_id) REFERENCES public.staff_members(id) ON DELETE SET NULL;


--
-- Name: grants grants_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grants
    ADD CONSTRAINT grants_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id);


--
-- Name: grants grants_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grants
    ADD CONSTRAINT grants_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: grants grants_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grants
    ADD CONSTRAINT grants_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id);


--
-- Name: guardians guardians_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.guardians
    ADD CONSTRAINT guardians_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: inventory_items inventory_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.inventory_categories(id) ON DELETE SET NULL;


--
-- Name: inventory_items inventory_items_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_items
    ADD CONSTRAINT inventory_items_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.inventory_stores(id) ON DELETE SET NULL;


--
-- Name: inventory_transactions inventory_transactions_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.inventory_items(id) ON DELETE CASCADE;


--
-- Name: inventory_transactions inventory_transactions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory_transactions
    ADD CONSTRAINT inventory_transactions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.inventory_stores(id) ON DELETE SET NULL;


--
-- Name: journal_entry_items journal_entry_items_journal_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.journal_entry_items
    ADD CONSTRAINT journal_entry_items_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id) ON DELETE CASCADE;


--
-- Name: local_purchase_orders local_purchase_orders_issued_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_purchase_orders
    ADD CONSTRAINT local_purchase_orders_issued_by_user_id_fkey FOREIGN KEY (issued_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: local_purchase_orders local_purchase_orders_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_purchase_orders
    ADD CONSTRAINT local_purchase_orders_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: local_purchase_orders local_purchase_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.local_purchase_orders
    ADD CONSTRAINT local_purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: other_income_categories other_income_categories_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_categories
    ADD CONSTRAINT other_income_categories_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: other_income_customers other_income_customers_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_customers
    ADD CONSTRAINT other_income_customers_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: other_income_invoices other_income_invoices_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_invoices
    ADD CONSTRAINT other_income_invoices_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.other_income_categories(id);


--
-- Name: other_income_invoices other_income_invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_invoices
    ADD CONSTRAINT other_income_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.other_income_customers(id) ON DELETE RESTRICT;


--
-- Name: other_income_invoices other_income_invoices_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_invoices
    ADD CONSTRAINT other_income_invoices_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: other_income_receipts other_income_receipts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_receipts
    ADD CONSTRAINT other_income_receipts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.other_income_categories(id);


--
-- Name: other_income_receipts other_income_receipts_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_receipts
    ADD CONSTRAINT other_income_receipts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.other_income_customers(id) ON DELETE SET NULL;


--
-- Name: other_income_receipts other_income_receipts_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_receipts
    ADD CONSTRAINT other_income_receipts_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.other_income_invoices(id) ON DELETE SET NULL;


--
-- Name: other_income_receipts other_income_receipts_received_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_receipts
    ADD CONSTRAINT other_income_receipts_received_by_user_id_fkey FOREIGN KEY (received_by_user_id) REFERENCES public.users(id);


--
-- Name: other_income_receipts other_income_receipts_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_receipts
    ADD CONSTRAINT other_income_receipts_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: other_income_take_ons other_income_take_ons_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_take_ons
    ADD CONSTRAINT other_income_take_ons_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id);


--
-- Name: other_income_take_ons other_income_take_ons_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_take_ons
    ADD CONSTRAINT other_income_take_ons_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.other_income_customers(id) ON DELETE CASCADE;


--
-- Name: other_income_take_ons other_income_take_ons_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.other_income_take_ons
    ADD CONSTRAINT other_income_take_ons_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: payment_reversals payment_reversals_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: payment_reversals payment_reversals_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_payment_transaction_id_fkey FOREIGN KEY (payment_transaction_id) REFERENCES public.payment_transactions(id);


--
-- Name: payment_reversals payment_reversals_requested_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_requested_by_user_id_fkey FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id);


--
-- Name: payment_reversals payment_reversals_reversing_ledger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_reversing_ledger_id_fkey FOREIGN KEY (reversing_ledger_id) REFERENCES public.transaction_ledger(id);


--
-- Name: payment_reversals payment_reversals_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: payment_reversals payment_reversals_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_reversals
    ADD CONSTRAINT payment_reversals_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: payment_transactions payment_transactions_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: payments_in_kind payments_in_kind_ledger_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments_in_kind
    ADD CONSTRAINT payments_in_kind_ledger_entry_id_fkey FOREIGN KEY (ledger_entry_id) REFERENCES public.transaction_ledger(id);


--
-- Name: payments_in_kind payments_in_kind_received_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments_in_kind
    ADD CONSTRAINT payments_in_kind_received_by_user_id_fkey FOREIGN KEY (received_by_user_id) REFERENCES public.users(id);


--
-- Name: payments_in_kind payments_in_kind_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments_in_kind
    ADD CONSTRAINT payments_in_kind_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: payments_in_kind payments_in_kind_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments_in_kind
    ADD CONSTRAINT payments_in_kind_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: payslips payslips_payroll_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_payroll_period_id_fkey FOREIGN KEY (payroll_period_id) REFERENCES public.payroll_periods(id) ON DELETE CASCADE;


--
-- Name: payslips payslips_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff_members(id) ON DELETE CASCADE;


--
-- Name: petty_cash_entries petty_cash_entries_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.petty_cash_entries
    ADD CONSTRAINT petty_cash_entries_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON DELETE SET NULL;


--
-- Name: petty_cash_entries petty_cash_entries_recorded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.petty_cash_entries
    ADD CONSTRAINT petty_cash_entries_recorded_by_user_id_fkey FOREIGN KEY (recorded_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: petty_cash_entries petty_cash_entries_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.petty_cash_entries
    ADD CONSTRAINT petty_cash_entries_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: pledges pledges_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pledges
    ADD CONSTRAINT pledges_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(id);


--
-- Name: pledges pledges_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pledges
    ADD CONSTRAINT pledges_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: pledges pledges_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pledges
    ADD CONSTRAINT pledges_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: pocket_money_accounts pocket_money_accounts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pocket_money_accounts
    ADD CONSTRAINT pocket_money_accounts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: pocket_money_transactions pocket_money_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pocket_money_transactions
    ADD CONSTRAINT pocket_money_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.pocket_money_accounts(id) ON DELETE CASCADE;


--
-- Name: pocket_money_transactions pocket_money_transactions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pocket_money_transactions
    ADD CONSTRAINT pocket_money_transactions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: receipts receipts_ledger_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_ledger_entry_id_fkey FOREIGN KEY (ledger_entry_id) REFERENCES public.transaction_ledger(id);


--
-- Name: receipts receipts_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_payment_transaction_id_fkey FOREIGN KEY (payment_transaction_id) REFERENCES public.payment_transactions(id);


--
-- Name: receipts receipts_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: receipts receipts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: reconciliation_matches reconciliation_matches_ledger_entry_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliation_matches
    ADD CONSTRAINT reconciliation_matches_ledger_entry_id_fkey FOREIGN KEY (ledger_entry_id) REFERENCES public.transaction_ledger(id);


--
-- Name: reconciliation_matches reconciliation_matches_matched_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliation_matches
    ADD CONSTRAINT reconciliation_matches_matched_by_user_id_fkey FOREIGN KEY (matched_by_user_id) REFERENCES public.users(id);


--
-- Name: reconciliation_matches reconciliation_matches_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliation_matches
    ADD CONSTRAINT reconciliation_matches_payment_transaction_id_fkey FOREIGN KEY (payment_transaction_id) REFERENCES public.payment_transactions(id) ON DELETE CASCADE;


--
-- Name: reconciliation_matches reconciliation_matches_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliation_matches
    ADD CONSTRAINT reconciliation_matches_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(id);


--
-- Name: reconciliation_matches reconciliation_matches_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliation_matches
    ADD CONSTRAINT reconciliation_matches_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: reconciliation_matches reconciliation_matches_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reconciliation_matches
    ADD CONSTRAINT reconciliation_matches_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: sms_logs sms_logs_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: sms_logs sms_logs_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sms_logs
    ADD CONSTRAINT sms_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: stk_attempts stk_attempts_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stk_attempts
    ADD CONSTRAINT stk_attempts_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: stk_attempts stk_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stk_attempts
    ADD CONSTRAINT stk_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- Name: streams streams_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


--
-- Name: streams streams_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.streams
    ADD CONSTRAINT streams_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: student_group_members student_group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_group_members
    ADD CONSTRAINT student_group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.student_groups(id) ON DELETE CASCADE;


--
-- Name: student_group_members student_group_members_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_group_members
    ADD CONSTRAINT student_group_members_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: student_group_members student_group_members_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_group_members
    ADD CONSTRAINT student_group_members_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_groups student_groups_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_groups
    ADD CONSTRAINT student_groups_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: student_guardians student_guardians_guardian_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_guardians
    ADD CONSTRAINT student_guardians_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(id) ON DELETE CASCADE;


--
-- Name: student_guardians student_guardians_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_guardians
    ADD CONSTRAINT student_guardians_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: student_guardians student_guardians_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_guardians
    ADD CONSTRAINT student_guardians_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_transport_subscriptions student_transport_subscriptions_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_transport_subscriptions
    ADD CONSTRAINT student_transport_subscriptions_route_id_fkey FOREIGN KEY (route_id) REFERENCES public.transport_routes(id) ON DELETE CASCADE;


--
-- Name: student_transport_subscriptions student_transport_subscriptions_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_transport_subscriptions
    ADD CONSTRAINT student_transport_subscriptions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- Name: student_transport_subscriptions student_transport_subscriptions_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_transport_subscriptions
    ADD CONSTRAINT student_transport_subscriptions_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.transport_vehicles(id) ON DELETE SET NULL;


--
-- Name: students students_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: students students_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: students students_stream_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_stream_id_fkey FOREIGN KEY (stream_id) REFERENCES public.streams(id);


--
-- Name: supplier_bills supplier_bills_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_bills
    ADD CONSTRAINT supplier_bills_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_categories(id) ON DELETE SET NULL;


--
-- Name: supplier_bills supplier_bills_lpo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_bills
    ADD CONSTRAINT supplier_bills_lpo_id_fkey FOREIGN KEY (lpo_id) REFERENCES public.local_purchase_orders(id) ON DELETE SET NULL;


--
-- Name: supplier_bills supplier_bills_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_bills
    ADD CONSTRAINT supplier_bills_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: supplier_bills supplier_bills_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_bills
    ADD CONSTRAINT supplier_bills_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL;


--
-- Name: supplier_take_ons supplier_take_ons_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_take_ons
    ADD CONSTRAINT supplier_take_ons_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: supplier_take_ons supplier_take_ons_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_take_ons
    ADD CONSTRAINT supplier_take_ons_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- Name: suppliers suppliers_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: terms terms_academic_year_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;


--
-- Name: terms terms_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.terms
    ADD CONSTRAINT terms_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: transaction_ledger transaction_ledger_original_ledger_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ledger
    ADD CONSTRAINT transaction_ledger_original_ledger_id_fkey FOREIGN KEY (original_ledger_id) REFERENCES public.transaction_ledger(id);


--
-- Name: transaction_ledger transaction_ledger_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ledger
    ADD CONSTRAINT transaction_ledger_payment_transaction_id_fkey FOREIGN KEY (payment_transaction_id) REFERENCES public.payment_transactions(id);


--
-- Name: transaction_ledger transaction_ledger_recorded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ledger
    ADD CONSTRAINT transaction_ledger_recorded_by_user_id_fkey FOREIGN KEY (recorded_by_user_id) REFERENCES public.users(id);


--
-- Name: transaction_ledger transaction_ledger_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ledger
    ADD CONSTRAINT transaction_ledger_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: transaction_ledger transaction_ledger_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ledger
    ADD CONSTRAINT transaction_ledger_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- Name: transaction_ledger transaction_ledger_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaction_ledger
    ADD CONSTRAINT transaction_ledger_term_id_fkey FOREIGN KEY (term_id) REFERENCES public.terms(id);


--
-- Name: transport_logs transport_logs_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_logs
    ADD CONSTRAINT transport_logs_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.transport_vehicles(id) ON DELETE CASCADE;


--
-- Name: transport_routes transport_routes_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transport_routes
    ADD CONSTRAINT transport_routes_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES public.transport_vehicles(id) ON DELETE SET NULL;


--
-- Name: users users_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- Name: vote_heads vote_heads_school_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vote_heads
    ADD CONSTRAINT vote_heads_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict q6nUEUbuF6OMvV2G0sEemOGZu4POmOboAsCtQbTJ5y55W6wx66meARbbTf9yiz3


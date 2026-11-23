--
-- PostgreSQL database dump
--

\restrict KzoDaWeCLMKfmw3Na6g2kUYcpOUQgYHoMUCgvdFKM7tncUXg4Rhelps62zyL1WH

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    username character varying(100),
    action character varying(200),
    detail text,
    ip_address character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_name character varying(200),
    role character varying(50),
    menu character varying(100),
    activity character varying(200),
    description text,
    method character varying(10),
    endpoint character varying(255),
    user_agent text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.activity_logs OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_id_seq OWNER TO postgres;

--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: bk_product_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bk_product_materials (
    id integer NOT NULL,
    product_id integer NOT NULL,
    material_index integer NOT NULL,
    kode_material character varying(20) NOT NULL,
    qty_per_sachet numeric(12,4) NOT NULL,
    range_min numeric(8,4) NOT NULL,
    range_max numeric(8,4) NOT NULL,
    teoritis numeric(12,4) DEFAULT 0
);


ALTER TABLE public.bk_product_materials OWNER TO postgres;

--
-- Name: bk_product_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bk_product_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bk_product_materials_id_seq OWNER TO postgres;

--
-- Name: bk_product_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bk_product_materials_id_seq OWNED BY public.bk_product_materials.id;


--
-- Name: bk_product_rendemen; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bk_product_rendemen (
    id integer NOT NULL,
    product_id integer NOT NULL,
    sort_order integer NOT NULL,
    persen numeric(8,6) NOT NULL
);


ALTER TABLE public.bk_product_rendemen OWNER TO postgres;

--
-- Name: bk_product_rendemen_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bk_product_rendemen_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bk_product_rendemen_id_seq OWNER TO postgres;

--
-- Name: bk_product_rendemen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bk_product_rendemen_id_seq OWNED BY public.bk_product_rendemen.id;


--
-- Name: bk_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bk_products (
    id integer NOT NULL,
    kode_produk character varying(20) NOT NULL,
    nama_produk character varying(200) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bk_products OWNER TO postgres;

--
-- Name: bk_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bk_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bk_products_id_seq OWNER TO postgres;

--
-- Name: bk_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bk_products_id_seq OWNED BY public.bk_products.id;


--
-- Name: bk_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bk_reports (
    id integer NOT NULL,
    kode_produk character varying(20) NOT NULL,
    no_batch character varying(50) NOT NULL,
    tgl_pembuatan date NOT NULL,
    bobot_total numeric(14,4) NOT NULL,
    input_sisa_minor numeric(12,4) NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    detail_json text,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    spv_id integer,
    spv_name character varying(200),
    spv_approved_at timestamp with time zone,
    mgr_id integer,
    mgr_name character varying(200),
    mgr_approved_at timestamp with time zone,
    rejected_by integer,
    rejected_by_name character varying(200),
    rejected_at timestamp with time zone,
    reject_note text,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bk_reports OWNER TO postgres;

--
-- Name: bk_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bk_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bk_reports_id_seq OWNER TO postgres;

--
-- Name: bk_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bk_reports_id_seq OWNED BY public.bk_reports.id;


--
-- Name: bo_product_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bo_product_materials (
    id integer NOT NULL,
    product_id integer NOT NULL,
    material_index integer NOT NULL,
    kode_material character varying(30) NOT NULL,
    label character varying(30) NOT NULL,
    target_kg numeric(14,4) NOT NULL
);


ALTER TABLE public.bo_product_materials OWNER TO postgres;

--
-- Name: bo_product_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bo_product_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bo_product_materials_id_seq OWNER TO postgres;

--
-- Name: bo_product_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bo_product_materials_id_seq OWNED BY public.bo_product_materials.id;


--
-- Name: bo_product_thresholds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bo_product_thresholds (
    id integer NOT NULL,
    product_id integer NOT NULL,
    criteria_index integer NOT NULL,
    target_index integer NOT NULL,
    min_ratio numeric(9,6) NOT NULL,
    max_ratio numeric(9,6) NOT NULL
);


ALTER TABLE public.bo_product_thresholds OWNER TO postgres;

--
-- Name: bo_product_thresholds_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bo_product_thresholds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bo_product_thresholds_id_seq OWNER TO postgres;

--
-- Name: bo_product_thresholds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bo_product_thresholds_id_seq OWNED BY public.bo_product_thresholds.id;


--
-- Name: bo_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bo_products (
    id integer NOT NULL,
    kode_produk character varying(20) NOT NULL,
    nama_produk character varying(200) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bo_products OWNER TO postgres;

--
-- Name: bo_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bo_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bo_products_id_seq OWNER TO postgres;

--
-- Name: bo_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bo_products_id_seq OWNED BY public.bo_products.id;


--
-- Name: bo_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bo_reports (
    id integer NOT NULL,
    kode_produk character varying(20) NOT NULL,
    no_batch character varying(50) NOT NULL,
    tgl_pembuatan date NOT NULL,
    bobot_total numeric(14,4) NOT NULL,
    kesimpulan character varying(10) NOT NULL,
    detail_json text NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bo_reports OWNER TO postgres;

--
-- Name: bo_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bo_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bo_reports_id_seq OWNER TO postgres;

--
-- Name: bo_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bo_reports_id_seq OWNED BY public.bo_reports.id;


--
-- Name: password_reset_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    new_password character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    requested_at timestamp with time zone DEFAULT now() NOT NULL,
    reviewed_by integer,
    reviewed_by_name character varying(200),
    reviewed_at timestamp with time zone,
    reject_note text
);


ALTER TABLE public.password_reset_requests OWNER TO postgres;

--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.password_reset_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_requests_id_seq OWNER TO postgres;

--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.password_reset_requests_id_seq OWNED BY public.password_reset_requests.id;


--
-- Name: report_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_templates (
    id integer NOT NULL,
    kode_produk character varying(20) NOT NULL,
    nama_file character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.report_templates OWNER TO postgres;

--
-- Name: report_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_templates_id_seq OWNER TO postgres;

--
-- Name: report_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_templates_id_seq OWNED BY public.report_templates.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    refresh_token character varying(512) NOT NULL,
    last_activity timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    full_name character varying(200) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    jabatan character varying(20) DEFAULT NULL::character varying,
    approval_status character varying(20) DEFAULT 'approved'::character varying NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'ts'::character varying, 'ppic'::character varying, 'produksi'::character varying, 'qa'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: bk_product_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_materials ALTER COLUMN id SET DEFAULT nextval('public.bk_product_materials_id_seq'::regclass);


--
-- Name: bk_product_rendemen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_rendemen ALTER COLUMN id SET DEFAULT nextval('public.bk_product_rendemen_id_seq'::regclass);


--
-- Name: bk_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_products ALTER COLUMN id SET DEFAULT nextval('public.bk_products_id_seq'::regclass);


--
-- Name: bk_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_reports ALTER COLUMN id SET DEFAULT nextval('public.bk_reports_id_seq'::regclass);


--
-- Name: bo_product_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_materials ALTER COLUMN id SET DEFAULT nextval('public.bo_product_materials_id_seq'::regclass);


--
-- Name: bo_product_thresholds id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_thresholds ALTER COLUMN id SET DEFAULT nextval('public.bo_product_thresholds_id_seq'::regclass);


--
-- Name: bo_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_products ALTER COLUMN id SET DEFAULT nextval('public.bo_products_id_seq'::regclass);


--
-- Name: bo_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_reports ALTER COLUMN id SET DEFAULT nextval('public.bo_reports_id_seq'::regclass);


--
-- Name: password_reset_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_requests ALTER COLUMN id SET DEFAULT nextval('public.password_reset_requests_id_seq'::regclass);


--
-- Name: report_templates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_templates ALTER COLUMN id SET DEFAULT nextval('public.report_templates_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_logs (id, user_id, username, action, detail, ip_address, created_at, user_name, role, menu, activity, description, method, endpoint, user_agent, updated_at) FROM stdin;
8	1	\N	\N	\N	::1	2026-08-26 13:43:39.188179+07	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk CONTOH	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:43:39.188179+07
9	1	\N	\N	\N	::1	2026-08-26 13:43:52.103828+07	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PBSJ1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:43:52.103828+07
10	1	\N	\N	\N	::1	2026-08-26 13:44:17.076361+07	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PEBJ4	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:44:17.076361+07
11	1	\N	\N	\N	::1	2026-08-26 13:44:31.616729+07	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PEGA2	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:44:31.616729+07
12	1	\N	\N	\N	::1	2026-08-26 13:44:40.552374+07	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PEBJ3	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:44:40.552374+07
13	1	\N	\N	\N	::1	2026-08-26 13:44:53.739399+07	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PEGM1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:44:53.739399+07
14	1	\N	\N	\N	::1	2026-08-26 13:45:09.326143+07	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PEMA2	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:45:09.326143+07
15	1	\N	\N	\N	::1	2026-08-26 13:45:19.064148+07	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PEMA3	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:45:19.064148+07
16	1	\N	\N	\N	::1	2026-08-26 13:45:30.617123+07	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PENT1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:45:30.617123+07
17	1	\N	\N	\N	::1	2026-08-26 13:45:40.693892+07	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PEOM1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:45:40.693892+07
18	1	\N	\N	\N	::1	2026-08-26 13:46:09.760704+07	admin	admin	Batch Khusus	Membuat Perhitungan Batch Khusus	Membuat perhitungan Batch Khusus untuk produk PBSJ1, No. Batch CHECK12	POST	/api/batch-khusus/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:46:09.760704+07
19	1	\N	\N	\N	::1	2026-08-26 13:48:23.262842+07	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PBSJ1, batch CHECK12	POST	/api/reports/download	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Code/1.134.0 Chrome/148.0.7778.280 Electron/42.8.1 Safari/537.36	2026-08-26 13:48:23.262842+07
20	1	\N	\N	\N	::1	2026-08-27 10:09:58.989571+07	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PBSJ1, batch CHECK12	POST	/api/reports/download	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 10:09:58.989571+07
21	1	\N	\N	\N	::1	2026-08-27 13:33:17.387884+07	admin	admin	Admin - Batch Overfilled	Update Produk Batch Overfilled	Update produk Batch Overfilled: PEBJ3	PUT	/api/admin/bo/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 13:33:17.387884+07
22	1	\N	\N	\N	::1	2026-08-27 13:36:05.383284+07	admin	admin	Admin - Batch Overfilled	Update Produk Batch Overfilled	Update produk Batch Overfilled: PBSJ1	PUT	/api/admin/bo/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 13:36:05.383284+07
23	1	\N	\N	\N	::1	2026-08-27 13:46:10.579076+07	admin	admin	Batch Overfilled	Membuat Perhitungan Batch Overfilled	Membuat perhitungan Batch Overfilled untuk produk PBSJ1, No. Batch CHECK12, Kesimpulan TMS	POST	/api/batch-overfilled/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 13:46:10.579076+07
24	1	\N	\N	\N	::1	2026-08-27 15:07:43.556577+07	admin	admin	Report Batch Overfilled	Menghapus Report Batch Overfilled	Menghapus Report Batch Overfilled untuk produk PBSJ1, No. Batch CHECK12	DELETE	/api/batch-overfilled/reports/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 15:07:43.556577+07
25	1	\N	\N	\N	::1	2026-08-27 15:08:43.772798+07	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PBSJ1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 15:08:43.772798+07
26	1	\N	\N	\N	::1	2026-08-27 15:16:24.726061+07	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PEGM1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 15:16:24.726061+07
27	1	\N	\N	\N	::1	2026-08-27 15:17:06.559488+07	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PEGA2	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 15:17:06.559488+07
28	1	\N	\N	\N	::1	2026-08-27 15:17:36.553353+07	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PEOM1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 15:17:36.553353+07
29	1	\N	\N	\N	::1	2026-08-27 15:18:09.470434+07	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PENT1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 15:18:09.470434+07
30	1	\N	\N	\N	::1	2026-08-27 15:18:41.402648+07	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PEBK1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-08-27 15:18:41.402648+07
31	1	\N	\N	\N	::1	2026-09-01 11:53:50.089396+07	admin	admin	Admin - Batch Khusus	Tambah Produk Batch Khusus	Tambah produk Batch Khusus: PEBJ4	POST	/api/admin/bk/products	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-09-01 11:53:50.089396+07
32	1	\N	\N	\N	::1	2026-09-01 11:55:08.606553+07	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEBJ4	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	2026-09-01 11:55:08.606553+07
33	1	\N	\N	\N	::1	2026-11-02 08:21:46.753984+07	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PBSJ1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-02 08:21:46.753984+07
34	1	\N	\N	\N	::1	2026-11-02 08:23:14.339359+07	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PBSJ1, batch CHECK12	POST	/api/reports/download	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-02 08:23:14.339359+07
35	1	\N	\N	\N	::1	2026-11-04 08:43:41.200941+07	admin	admin	User Management	Mengubah User	Memperbarui user 'admin': data user, password (reset), role menjadi admin, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 08:43:41.200941+07
36	1	\N	\N	\N	::1	2026-11-04 08:44:02.516366+07	admin	admin	User Management	Menambah User	Menambahkan user baru 'dea' dengan role ts	POST	/api/users	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 08:44:02.516366+07
38	1	\N	\N	\N	::1	2026-11-04 08:45:28.748089+07	admin	admin	User Management	Mengubah User	Memperbarui user 'dea123': data user, password (reset), role menjadi ts, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 08:45:28.748089+07
40	1	\N	\N	\N	::1	2026-11-04 08:46:33.839851+07	admin	admin	User Management	Mengubah User	Memperbarui user 'dea1234': data user, password (reset), role menjadi ts, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 08:46:33.839851+07
42	1	\N	\N	\N	::1	2026-11-04 11:19:29.568756+07	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PBSJ1, batch CHECK12	POST	/api/reports/download	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 11:19:29.568756+07
50	1	\N	\N	\N	::1	2026-11-05 08:44:03.154638+07	admin	admin	User Management	Menambah User	Menambahkan user baru 'deap' dengan role produksi	POST	/api/users	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-05 08:44:03.154638+07
39	3	\N	\N	\N	::1	2026-11-04 08:45:52.484354+07	dealova	ts	Batch Khusus	Approve Perhitungan Batch Khusus	Approve Batch Khusus untuk produk PBSJ1, No. Batch CHECK12 oleh dealova	POST	/api/batch-khusus/reports/:id/approve	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 08:45:52.484354+07
47	3	\N	\N	\N	::1	2026-11-04 15:04:46.784667+07	dealova	ts	Batch Khusus	Reject Perhitungan Batch Khusus	Reject Batch Khusus untuk produk PEBJ3, No. Batch TES12 oleh dealova, alasan: bobot sisa minor tidak sesuai dilapangan	POST	/api/batch-khusus/reports/:id/reject	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 15:04:46.784667+07
37	8	\N	\N	\N	::1	2026-11-04 08:44:39.62824+07	dea	ts	Batch Khusus	Mengajukan Approval Batch Khusus	Mengajukan approval Batch Khusus untuk produk PBSJ1, No. Batch CHECK12	POST	/api/batch-khusus/reports/:id/submit	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 08:44:39.62824+07
43	8	\N	\N	\N	::1	2026-11-04 15:00:42.884559+07	dea	ts	Batch Khusus	Menyimpan Draft Perhitungan Batch Khusus	Menyimpan Draft Perhitungan Batch Khusus untuk produk PEBJ3, No. Batch TES12	POST	/api/batch-khusus/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 15:00:42.884559+07
44	8	\N	\N	\N	::1	2026-11-04 15:01:34.223574+07	dea	ts	Batch Khusus	Mengajukan Approval Batch Khusus	Mengajukan approval Batch Khusus untuk produk PEBJ3, No. Batch TES12	POST	/api/batch-khusus/reports/:id/submit	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 15:01:34.223574+07
59	1	\N	\N	\N	::1	2026-11-11 09:03:08.574855+07	admin	admin	User Management	Mengubah User	Memperbarui user 'dea1234': data user, role menjadi ts, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-11 09:03:08.574855+07
60	1	\N	\N	\N	::1	2026-11-12 07:58:13.77492+07	admin	admin	User Management	Mengubah User	Memperbarui user 'deam': data user, role menjadi ts, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-12 07:58:13.77492+07
61	1	\N	\N	\N	::1	2026-11-12 07:58:21.732435+07	admin	admin	User Management	Mengubah User	Memperbarui user 'deas': data user, role menjadi ts, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-12 07:58:21.732435+07
41	5	\N	\N	\N	::1	2026-11-04 08:46:58.29493+07	dealova ana	ts	Batch Khusus	Approve Perhitungan Batch Khusus	Approve Batch Khusus untuk produk PBSJ1, No. Batch CHECK12 oleh dealova	POST	/api/batch-khusus/reports/:id/approve	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 08:46:58.29493+07
49	5	\N	\N	\N	::1	2026-11-04 15:07:55.056427+07	dealova ana	ts	Batch Khusus	Reject Perhitungan Batch Khusus	Reject Batch Khusus untuk produk PEBJ4, No. Batch TES123 oleh dealova, alasan: tidak sesuai	POST	/api/batch-khusus/reports/:id/reject	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 15:07:55.056427+07
63	1	\N	\N	\N	::1	2026-11-12 08:52:24.877641+07	admin	admin	User Management	Mengubah User	Memperbarui user 'deam': data user, role menjadi ts, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-12 08:52:24.877641+07
48	3	\N	\N	\N	::1	2026-11-04 15:06:42.76271+07	dealova	ts	Batch Khusus	Approve Perhitungan Batch Khusus	Approve Batch Khusus untuk produk PEBJ4, No. Batch TES123 oleh dealova	POST	/api/batch-khusus/reports/:id/approve	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 15:06:42.76271+07
57	3	\N	\N	\N	::1	2026-11-11 07:44:12.474976+07	dealova	ts	Batch Khusus	Reject Perhitungan Batch Khusus	Reject Batch Khusus untuk produk PEBJ3, No. Batch TES12 oleh dealova, alasan: tidak sesuai	POST	/api/batch-khusus/reports/:id/reject	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-11 07:44:12.474976+07
58	3	\N	\N	\N	::1	2026-11-11 07:44:33.232114+07	dealova	ts	Batch Khusus	Approve Perhitungan Batch Khusus	Approve Batch Khusus untuk produk PEGA2, No. Batch TES123 oleh dealova	POST	/api/batch-khusus/reports/:id/approve	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-11 07:44:33.232114+07
64	1	\N	\N	\N	::1	2026-11-12 08:52:46.318487+07	admin	admin	User Management	Mengubah User	Memperbarui user 'deas': data user, role menjadi ts, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-12 08:52:46.318487+07
45	8	\N	\N	\N	::1	2026-11-04 15:03:42.044498+07	dea	ts	Batch Khusus	Menyimpan Draft Perhitungan Batch Khusus	Menyimpan Draft Perhitungan Batch Khusus untuk produk PEBJ4, No. Batch TES123	POST	/api/batch-khusus/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 15:03:42.044498+07
46	8	\N	\N	\N	::1	2026-11-04 15:03:44.385048+07	dea	ts	Batch Khusus	Mengajukan Approval Batch Khusus	Mengajukan approval Batch Khusus untuk produk PEBJ4, No. Batch TES123	POST	/api/batch-khusus/reports/:id/submit	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0	2026-11-04 15:03:44.385048+07
51	8	\N	\N	\N	::1	2026-11-11 07:41:57.325026+07	dea	ts	Batch Khusus	Menyimpan Draft Perhitungan Batch Khusus	Menyimpan Draft Perhitungan Batch Khusus untuk produk PBSJ1, No. Batch TES12	POST	/api/batch-khusus/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-11 07:41:57.325026+07
52	8	\N	\N	\N	::1	2026-11-11 07:42:01.087987+07	dea	ts	Batch Khusus	Mengajukan Approval Batch Khusus	Mengajukan approval Batch Khusus untuk produk PBSJ1, No. Batch TES12	POST	/api/batch-khusus/reports/:id/submit	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-11 07:42:01.087987+07
53	8	\N	\N	\N	::1	2026-11-11 07:42:36.664075+07	dea	ts	Batch Khusus	Mengubah Perhitungan Batch Khusus	Mengubah perhitungan Batch Khusus untuk produk PEBJ3, No. Batch TES12	PUT	/api/batch-khusus/reports/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-11 07:42:36.664075+07
54	8	\N	\N	\N	::1	2026-11-11 07:42:40.280144+07	dea	ts	Batch Khusus	Mengajukan Approval Batch Khusus	Mengajukan approval Batch Khusus untuk produk PEBJ3, No. Batch TES12	POST	/api/batch-khusus/reports/:id/submit	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-11 07:42:40.280144+07
55	8	\N	\N	\N	::1	2026-11-11 07:43:15.383181+07	dea	ts	Batch Khusus	Menyimpan Draft Perhitungan Batch Khusus	Menyimpan Draft Perhitungan Batch Khusus untuk produk PEGA2, No. Batch TES123	POST	/api/batch-khusus/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-11 07:43:15.383181+07
62	10	\N	\N	\N	::1	2026-11-12 08:13:50.781221+07	dealovaa	qa	User Management	Registrasi User Baru	User baru 'deaq' mendaftar mandiri dengan role qa	POST	/api/auth/register	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-12 08:13:50.781221+07
56	8	\N	\N	\N	::1	2026-11-11 07:43:16.28046+07	dea	ts	Batch Khusus	Mengajukan Approval Batch Khusus	Mengajukan approval Batch Khusus untuk produk PEGA2, No. Batch TES123	POST	/api/batch-khusus/reports/:id/submit	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-11 07:43:16.28046+07
65	1	\N	\N	\N	::1	2026-11-12 08:52:49.793201+07	admin	admin	User Management	Mengubah User	Memperbarui user 'dea': data user, role menjadi ts, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-12 08:52:49.793201+07
66	1	\N	\N	\N	::1	2026-11-12 08:52:53.479871+07	admin	admin	User Management	Mengubah User	Memperbarui user 'deap': data user, role menjadi produksi, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-12 08:52:53.479871+07
67	1	\N	\N	\N	::1	2026-11-12 08:52:58.635094+07	admin	admin	User Management	Mengubah User	Memperbarui user 'deaq': data user, role menjadi qa, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-12 08:52:58.635094+07
68	11	\N	\N	\N	::1	2026-11-17 08:11:15.065732+07	dealovaaa	ppic	User Management	Registrasi User Baru	User baru 'deac' mendaftar dengan role ppic — menunggu approval admin	POST	/api/auth/register	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-17 08:11:15.065732+07
69	1	\N	\N	\N	::1	2026-11-17 08:37:53.123881+07	admin	admin	User Management	Mengubah User	Memperbarui user 'deac': data user, role menjadi ppic, status aktif	PUT	/api/users/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-17 08:37:53.123881+07
70	8	\N	\N	\N	::1	2026-11-19 08:13:16.095679+07	dea	ts	Batch Overfilled	Membuat Perhitungan Batch Overfilled	Membuat perhitungan Batch Overfilled untuk produk PBSJ1, No. Batch TES123, Kesimpulan MS	POST	/api/batch-overfilled/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-19 08:13:16.095679+07
71	8	\N	\N	\N	::1	2026-11-19 08:13:29.656801+07	dea	ts	Batch Overfilled	Membuat Perhitungan Batch Overfilled	Membuat perhitungan Batch Overfilled untuk produk PBSJ1, No. Batch TES123, Kesimpulan MS	POST	/api/batch-overfilled/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-19 08:13:29.656801+07
72	8	\N	\N	\N	::1	2026-11-19 08:19:23.142637+07	dea	ts	Batch Khusus	Menyimpan Draft Perhitungan Batch Khusus	Menyimpan Draft Perhitungan Batch Khusus untuk produk PEMA2, No. Batch TES123	POST	/api/batch-khusus/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-19 08:19:23.142637+07
73	8	\N	\N	\N	::1	2026-11-19 08:19:31.943084+07	dea	ts	Batch Khusus	Mengubah Perhitungan Batch Khusus	Mengubah perhitungan Batch Khusus untuk produk PEMA2, No. Batch TES123	PUT	/api/batch-khusus/reports/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-19 08:19:31.943084+07
74	8	\N	\N	\N	::1	2026-11-19 08:33:17.868301+07	dea	ts	Report Batch Overfilled	Menghapus Report Batch Overfilled	Menghapus Report Batch Overfilled untuk produk PBSJ1, No. Batch TES123	DELETE	/api/batch-overfilled/reports/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-19 08:33:17.868301+07
75	8	\N	\N	\N	::1	2026-11-19 10:16:55.626091+07	dea	ts	Admin - Report Template	Update Template Report	Update template report untuk produk CONTOH	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36	2026-11-19 10:16:55.626091+07
76	12	\N	\N	\N	::1	2026-11-23 10:44:37.898348+07	deadea	ts	User Management	Registrasi User Baru	User baru 'deadea' mendaftar dengan role ts — menunggu approval admin	POST	/api/auth/register	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Safari/537.36	2026-11-23 10:44:37.898348+07
\.


--
-- Data for Name: bk_product_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bk_product_materials (id, product_id, material_index, kode_material, qty_per_sachet, range_min, range_max, teoritis) FROM stdin;
4	2	0	2AS006000J	1140.0000	1.5000	2.5000	273.6000
5	2	1	XEMA2	714.6000	1.5000	1.5000	171.5000
6	2	2	2AC006000J	2145.4000	1.5000	2.5000	514.9000
7	3	0	2AS006000J	1225.2000	1.5000	2.5000	294.0500
8	3	1	XEMA3	613.9000	1.5000	1.5000	147.3400
9	3	2	2AC006000J	2160.9000	1.5000	2.5000	518.6200
22	1	0	2AS006000J	1497.3000	1.5000	2.5000	372.9200
23	1	1	XEBJ3	360.3000	1.5000	1.5000	95.8300
24	1	2	2AC006000J	2142.4000	1.5000	2.5000	531.2500
35	9	0	2AS006000J	1640.0000	2.3400	2.3400	0.0000
36	9	1	XBSJ1	1478.0000	2.1100	2.1100	0.0000
37	9	2	2AC006000J	1830.0000	2.6100	2.6100	0.0000
38	9	3	2AS012000	2052.0000	2.9200	2.9200	0.0000
39	4	0	2AS006000J	1361.4000	1.0000	1.5000	425.4000
40	4	1	XEGM1	496.5000	1.0000	1.0000	155.1600
41	4	2	2AC006000J	2142.1000	1.0000	1.5000	669.4000
42	5	0	2AS006000J	1030.3000	1.5000	2.5000	257.6000
43	5	1	XEGA2	736.7000	1.5000	1.5000	184.1800
44	5	2	2AC006000J	2233.0000	1.5000	2.5000	558.2500
45	6	0	2AS006000J	1219.2000	1.5000	1.5000	304.8000
46	6	1	XEOM1	430.8000	1.5000	1.5000	107.7000
47	6	2	2AC006000J	2350.0000	1.5000	1.5000	587.5000
48	7	0	2AS006000J	1356.1000	3.9300	3.9300	392.9400
49	7	1	XENT1	484.3000	1.4000	1.4000	140.3300
50	7	2	2AC006000J	2159.6000	6.2600	6.2600	625.7300
51	8	0	2AS006000J	1497.3000	1.5000	2.5000	431.2000
52	8	1	XEBK1	310.3000	1.0000	1.0000	89.3700
53	8	2	2AC006000J	2192.4000	1.5000	1.5000	631.4000
54	10	0	2AS006000J	1497.7500	1.5000	2.5000	561.7000
55	10	1	XEBJ4	359.3500	1.5000	1.5000	134.7000
56	10	2	2AC006000J	2142.9000	1.5000	2.5000	803.6000
\.


--
-- Data for Name: bk_product_rendemen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bk_product_rendemen (id, product_id, sort_order, persen) FROM stdin;
4	2	0	0.990000
5	2	1	1.010000
6	2	2	1.015000
7	3	0	0.990000
8	3	1	1.010000
9	3	2	1.015000
22	1	0	0.995500
23	1	1	1.006500
24	1	2	1.014000
35	9	0	0.990000
36	9	1	1.010000
37	9	2	0.947900
38	9	3	1.052100
39	4	0	0.990000
40	4	1	1.010000
41	4	2	1.020000
42	5	0	0.990000
43	5	1	1.010000
44	5	2	1.014000
45	6	0	0.990000
46	6	1	1.010000
47	6	2	1.020000
48	7	0	0.990000
49	7	1	1.010000
50	7	2	1.020000
51	8	0	0.990000
52	8	1	1.010000
53	8	2	1.020000
54	10	0	0.995500
55	10	1	1.006500
56	10	2	1.014000
\.


--
-- Data for Name: bk_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bk_products (id, kode_produk, nama_produk, created_at, updated_at) FROM stdin;
2	PEMA2	EXTRA JOSS GO MANGGA EFF.PWD	2026-08-18 15:02:37.529786+07	2026-08-18 15:02:37.529786+07
3	PEMA3	EXTRA JOSS GO MANGGA EFF.PWD	2026-08-18 15:04:07.836521+07	2026-08-18 15:04:07.836521+07
1	PEBJ3	EXTRA JOSS ACTIVE EFF.PWD	2026-08-18 15:01:11.612122+07	2026-08-18 15:08:08.270079+07
9	PBSJ1	B7 SLA-SI JERUK NIPIS EFF.PWD	2026-08-18 15:12:41.689612+07	2026-08-27 15:08:43.719324+07
4	PEGM1	EXTRA JOSS GO ANGGUR EFF.PWD	2026-08-18 15:05:10.760697+07	2026-08-27 15:16:24.66531+07
5	PEGA2	EXTRA JOSS GO ANGGUR EFF.PWD	2026-08-18 15:06:45.24308+07	2026-08-27 15:17:06.493183+07
6	PEOM1	EXTRA JOSS ORANGE EFF.PWD MAL	2026-08-18 15:07:47.827022+07	2026-08-27 15:17:36.533463+07
7	PENT1	EXTRA JOSS ACTIVE EFF.PWD NIG	2026-08-18 15:09:13.162138+07	2026-08-27 15:18:09.431163+07
8	PEBK1	EXTRA JOSS ACTIVE EFF.PWD KOR	2026-08-18 15:10:43.604186+07	2026-08-27 15:18:41.359086+07
10	PEBJ4	EXTRA JOSS ACTIVE EFF.PWD	2026-09-01 11:53:50.073796+07	2026-09-01 11:53:50.073796+07
\.


--
-- Data for Name: bk_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bk_reports (id, kode_produk, no_batch, tgl_pembuatan, bobot_total, input_sisa_minor, created_by, created_at, detail_json, status, spv_id, spv_name, spv_approved_at, mgr_id, mgr_name, mgr_approved_at, rejected_by, rejected_by_name, rejected_at, reject_note, updated_at) FROM stdin;
13	PBSJ1	TES12	2026-11-11	1108.2544	234.0000	8	2026-11-11 07:41:57.313954+07	{"bobot_total":1108.2544,"input_sisa_minor":234,"materials":[{"id":35,"product_id":9,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1640,"teoritis":0,"range_min":2.34,"range_max":2.34},{"id":36,"product_id":9,"material_index":1,"kode_material":"XBSJ1","qty_per_sachet":1478,"teoritis":0,"range_min":2.11,"range_max":2.11},{"id":37,"product_id":9,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":1830,"teoritis":0,"range_min":2.61,"range_max":2.61},{"id":38,"product_id":9,"material_index":3,"kode_material":"2AS012000","qty_per_sachet":2052,"teoritis":0,"range_min":2.92,"range_max":2.92}],"total":1108.254397834912,"values":[259.6481732070365,234,289.7293640054127,324.87686062246274]}	waiting_spv	\N	\N	\N	\N	\N	\N	\N	\N	\N		2026-11-11 07:42:01.082872+07
11	PEBJ3	TES12	2026-11-04	2597.8351	234.0000	8	2026-11-04 15:00:42.867613+07	{"bobot_total":2597.8351,"input_sisa_minor":234,"materials":[{"id":22,"product_id":1,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1497.3,"teoritis":372.92,"range_min":1.5,"range_max":2.5},{"id":23,"product_id":1,"material_index":1,"kode_material":"XEBJ3","qty_per_sachet":360.3,"teoritis":95.83,"range_min":1.5,"range_max":1.5},{"id":24,"product_id":1,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2142.4,"teoritis":531.25,"range_min":1.5,"range_max":2.5}],"total":2597.835137385512,"values":[972.4346378018319,234,1391.4004995836804]}	rejected	\N	\N	\N	\N	\N	\N	3	dealova	2026-11-11 07:44:12.447502+07	tidak sesuai	2026-11-12 08:52:46.317453+07
14	PEGA2	TES123	2026-11-11	1270.5307	234.0000	8	2026-11-11 07:43:15.357592+07	{"bobot_total":1270.5307,"input_sisa_minor":234,"materials":[{"id":42,"product_id":5,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1030.3,"teoritis":257.6,"range_min":1.5,"range_max":2.5},{"id":43,"product_id":5,"material_index":1,"kode_material":"XEGA2","qty_per_sachet":736.7,"teoritis":184.18,"range_min":1.5,"range_max":1.5},{"id":44,"product_id":5,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2233,"teoritis":558.25,"range_min":1.5,"range_max":2.5}],"total":1270.5307452151487,"values":[327.2569566987919,234,709.2737885163567]}	waiting_mgr	3	dealova	2026-11-11 07:44:33.204962+07	\N	\N	\N	\N	\N	\N		2026-11-12 08:52:46.309807+07
10	PBSJ1	CHECK12	2026-08-26	573.0717	121.0000	1	2026-08-26 13:46:09.759507+07	{"bobot_total":573.0717,"input_sisa_minor":121,"materials":[{"id":31,"product_id":9,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1640,"teoritis":0,"range_min":2.34,"range_max":2.34},{"id":32,"product_id":9,"material_index":1,"kode_material":"XBSJ1","qty_per_sachet":1478,"teoritis":0,"range_min":2.11,"range_max":2.11},{"id":33,"product_id":9,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":1830,"teoritis":0,"range_min":2.61,"range_max":2.61},{"id":34,"product_id":9,"material_index":3,"kode_material":"2AS012000J","qty_per_sachet":2052,"teoritis":0,"range_min":2.92,"range_max":2.92}],"total":573.0717185385656,"values":[134.26251691474965,121,149.81732070365356,167.99188092016237]}	approved	3	dealova	2026-11-04 08:45:52.480829+07	5	dealova ana	2026-11-04 08:46:58.267761+07	\N	\N	\N		2026-11-12 08:52:46.309807+07
12	PEBJ4	TES123	2026-11-04	5042.4377	453.0000	8	2026-11-04 15:03:42.042287+07	{"bobot_total":5042.4377,"input_sisa_minor":453,"materials":[{"id":54,"product_id":10,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1497.75,"teoritis":561.7,"range_min":1.5,"range_max":2.5},{"id":55,"product_id":10,"material_index":1,"kode_material":"XEBJ4","qty_per_sachet":359.35,"teoritis":134.7,"range_min":1.5,"range_max":1.5},{"id":56,"product_id":10,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2142.9,"teoritis":803.6,"range_min":1.5,"range_max":2.5}],"total":5042.437734798943,"values":[1888.077779323779,453,2701.3599554751636]}	rejected	3	dealova	2026-11-04 15:06:42.756786+07	\N	\N	\N	5	dealova ana	2026-11-04 15:07:55.05196+07	tidak sesuai	2026-11-12 08:52:46.309807+07
15	PEMA2	TES123	2026-11-19	979.5690	175.0000	8	2026-11-19 08:19:23.121331+07	{"bobot_total":979.569,"input_sisa_minor":175,"materials":[{"id":4,"product_id":2,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1140,"teoritis":273.6,"range_min":1.5,"range_max":2.5},{"id":5,"product_id":2,"material_index":1,"kode_material":"XEMA2","qty_per_sachet":714.6,"teoritis":171.5,"range_min":1.5,"range_max":1.5},{"id":6,"product_id":2,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2145.4,"teoritis":514.9,"range_min":1.5,"range_max":2.5}],"total":979.5689896445565,"values":[279.17716204869856,175,525.3918275958579]}	draft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-11-19 08:19:31.938087+07
\.


--
-- Data for Name: bo_product_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bo_product_materials (id, product_id, material_index, kode_material, label, target_kg) FROM stdin;
50	2	0	2AS006000J	Sodbic	561.7000
51	2	1	XEBJ4	Minor	134.7000
52	2	2	2AC006000J	Citric	803.6000
53	6	0	2AS006000J	Sodbic	431.2200
54	6	1	XEBK1	Minor	89.3700
55	6	2	2AC006000J	Citric	631.4100
56	8	0	2AS006000J	Sodbic	257.5700
57	8	1	XEGA2	Minor	184.1800
58	8	2	2AC006000J	Citric	558.2500
59	9	0	2AS006000J	Sodbic	340.3500
60	9	1	XEGM1	Minor	124.1300
61	9	2	2AC006000J	Citric	535.5200
62	3	0	2AS006000J	Sodbic	410.4000
63	3	1	XEMA2	Minor	257.2600
64	3	2	2AC006000J	Citric	772.3400
65	4	0	2AS006000J	Sodbic	294.0500
66	4	1	XEMA3	Minor	147.3400
67	4	2	2AC006000J	Citric	518.6200
68	7	0	2AS006000J	Sodbic	392.9400
69	7	1	XENT1	Minor	140.3300
70	7	2	2AC006000J	Citric	625.7300
71	5	0	2AS006000J	Sodbic	304.8000
72	5	1	XEOM1	Minor	107.7000
73	5	2	2AC006000J	Citric	587.5000
74	1	0	2AS006000J	Sodbic	561.4800
75	1	1	XEBJ3	Minor	135.1200
76	1	2	2AC006000J	Citric	803.4000
77	10	0	2AS006000J	Sodbic	233.7000
78	10	1	XBSJ1	Minor	210.6200
79	10	2	2AC006000J	Citric	260.7800
80	10	3	2AS012000	Gula	292.4100
\.


--
-- Data for Name: bo_product_thresholds; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bo_product_thresholds (id, product_id, criteria_index, target_index, min_ratio, max_ratio) FROM stdin;
133	9	0	1	0.977000	1.000000
134	9	0	2	0.990000	1.000000
135	9	1	0	0.981000	1.000000
136	9	1	2	0.980000	1.000000
137	9	2	0	0.981000	1.000000
138	9	2	1	0.976000	1.000000
139	3	0	1	0.982000	1.000000
140	3	0	2	0.988000	1.000000
141	3	1	0	0.986000	1.000000
142	3	1	2	0.988000	1.000000
143	3	2	0	0.990000	1.000000
144	3	2	1	0.986000	1.000000
145	4	0	1	0.982000	1.000000
146	4	0	2	0.988000	1.000000
147	4	1	0	0.986000	1.000000
148	4	1	2	0.988000	1.000000
149	4	2	0	0.990000	1.000000
150	4	2	1	0.986000	1.000000
151	7	0	1	0.980000	1.000000
152	7	0	2	0.988000	1.000000
153	7	1	0	0.983000	1.000000
154	7	1	2	0.980000	1.000000
155	7	2	0	0.987000	1.000000
156	7	2	1	0.982000	1.000000
157	5	0	1	0.977000	1.000000
158	5	0	2	0.992000	1.000000
159	5	1	0	0.980000	1.000000
160	5	1	2	0.981000	1.000000
161	5	2	0	0.986000	1.000000
162	5	2	1	0.979000	1.000000
115	2	0	1	0.977000	1.000000
116	2	0	2	0.991000	1.000000
117	2	1	0	0.980000	1.000000
118	2	1	2	0.981000	1.000000
119	2	2	0	0.991000	1.000000
120	2	2	1	0.979000	1.000000
121	6	0	1	0.983000	1.000000
122	6	0	2	0.992000	1.000000
123	6	1	0	0.985000	1.000000
124	6	1	2	0.987000	1.000000
125	6	2	0	0.994000	1.000000
126	6	2	1	0.986000	1.000000
127	8	0	1	0.986000	1.000000
128	8	0	2	0.990000	1.000000
129	8	1	0	0.982000	1.000000
130	8	1	2	0.987000	1.000000
131	8	2	0	0.988000	1.000000
132	8	2	1	0.989000	1.000000
163	1	0	1	0.977000	1.000000
164	1	0	2	0.991000	1.000000
165	1	1	0	0.980000	1.000000
166	1	1	2	0.981000	1.000000
167	1	2	0	0.991000	1.000000
168	1	2	1	0.979000	1.000000
169	10	0	1	0.940000	1.000000
170	10	0	2	0.950000	1.000000
171	10	0	3	0.950000	1.000000
172	10	1	0	0.950000	1.000000
173	10	1	2	0.950000	1.000000
174	10	1	3	0.950000	1.000000
175	10	2	0	0.950000	1.000000
176	10	2	1	0.940000	1.000000
177	10	2	3	0.950000	1.000000
178	10	3	0	0.950000	1.000000
179	10	3	1	0.940000	1.000000
180	10	3	2	0.950000	1.000000
\.


--
-- Data for Name: bo_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bo_products (id, kode_produk, nama_produk, created_at, updated_at) FROM stdin;
2	PEBJ4	EXTRA JOSS ACTIVE EFF.PWD	2026-08-18 14:48:04.398297+07	2026-08-19 14:17:34.268809+07
6	PEBK1	EXTRA JOSS ACTIVE EFF.PWD KOR	2026-08-18 14:53:39.308184+07	2026-08-19 14:18:14.915829+07
8	PEGA2	EXTRA JOSS GO ANGGUR EFF.PWD	2026-08-18 14:55:55.088505+07	2026-08-19 14:19:09.831053+07
9	PEGM1	EXTRA JOSS GO ANGGUR EFF.PWD	2026-08-18 14:57:27.350449+07	2026-08-19 14:20:15.719343+07
3	PEMA2	EXTRA JOSS GO MANGGA EFF.PWD	2026-08-18 14:49:18.885862+07	2026-08-19 14:21:32.221534+07
4	PEMA3	EXTRA JOSS GO MANGGA EFF.PWD	2026-08-18 14:50:27.115862+07	2026-08-19 14:22:21.772026+07
7	PENT1	EXTRA JOSS ACTIVE EFF.PWD NIG	2026-08-18 14:54:44.681162+07	2026-08-19 14:22:56.12049+07
5	PEOM1	EXTRA JOSS ORANGE EFF.PWD MAL	2026-08-18 14:52:17.782186+07	2026-08-19 14:23:29.177494+07
1	PEBJ3	EXTRA JOSS ACTIVE EFF.PWD	2026-08-18 14:46:57.874839+07	2026-08-27 13:33:17.349189+07
10	PBSJ1	B7 SLA-SI JERUK NIPIS EFF.PWD	2026-08-18 14:59:03.56276+07	2026-08-27 13:36:05.350636+07
\.


--
-- Data for Name: bo_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bo_reports (id, kode_produk, no_batch, tgl_pembuatan, bobot_total, kesimpulan, detail_json, created_by, created_at) FROM stdin;
28	PBSJ1	TES123	2026-11-19	1003.7560	MS	{"materials":[{"kode_material":"2AS006000J","label":"Sodbic","target_kg":233.7,"hasil_batching":234.775,"perbandingan":1.005,"ratio":0.99,"target_baru":237.07,"tambahan_reproses":2.29},{"kode_material":"XBSJ1","label":"Minor","target_kg":210.62,"hasil_batching":213.655,"perbandingan":1.014,"ratio":1,"target_baru":213.66,"tambahan_reproses":0},{"kode_material":"2AC006000J","label":"Citric","target_kg":260.78,"hasil_batching":262.108,"perbandingan":1.005,"ratio":0.991,"target_baru":264.54,"tambahan_reproses":2.43},{"kode_material":"2AS012000","label":"Gula","target_kg":292.41,"hasil_batching":293.218,"perbandingan":1.003,"ratio":0.989,"target_baru":296.62,"tambahan_reproses":3.41}],"bobot_total":1003.756,"nilai_tertinggi":1.014,"kriteria":[{"materialIndex":0,"label":"Sodbic","status":"TMS","pivotValue":0,"checks":[]},{"materialIndex":1,"label":"Minor","status":"MS","pivotValue":1,"checks":[{"targetIndex":0,"minRatio":0.95,"maxRatio":1,"actualRatio":0.9903258451240887,"passed":true},{"targetIndex":1,"minRatio":1,"maxRatio":1,"actualRatio":1,"passed":true},{"targetIndex":2,"minRatio":0.95,"maxRatio":1,"actualRatio":0.9908133700806065,"passed":true},{"targetIndex":3,"minRatio":0.95,"maxRatio":1,"actualRatio":0.9885151854599485,"passed":true}]},{"materialIndex":2,"label":"Citric","status":"TMS","pivotValue":0,"checks":[]},{"materialIndex":3,"label":"Gula","status":"TMS","pivotValue":0,"checks":[]}],"kesimpulan":"MS"}	8	2026-11-19 08:13:16.076676+07
\.


--
-- Data for Name: password_reset_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_requests (id, user_id, new_password, status, requested_at, reviewed_by, reviewed_by_name, reviewed_at, reject_note) FROM stdin;
1	9	$2a$10$qqvVFJaF1oOFrgHlYKtXDO76gEGKk8rkCyN13q3B/.9aauJXm0cMS	pending	2026-11-17 10:23:50.506374+07	\N	\N	\N	\N
\.


--
-- Data for Name: report_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_templates (id, kode_produk, nama_file, file_path, created_by, created_at, updated_at) FROM stdin;
26	PEGA2	PEGA2_template.docx	C:\\Users\\USER\\Documents\\BFC\\BFC-docx\\backend\\uploads\\templates\\PEGA2_template.docx	1	2026-08-26 13:44:31.6163+07	2026-08-26 13:44:31.6163+07
27	PEBJ3	PEBJ3_template.docx	C:\\Users\\USER\\Documents\\BFC\\BFC-docx\\backend\\uploads\\templates\\PEBJ3_template.docx	1	2026-08-26 13:44:40.551185+07	2026-08-26 13:44:40.551185+07
28	PEGM1	PEGM1_template.docx	C:\\Users\\USER\\Documents\\BFC\\BFC-docx\\backend\\uploads\\templates\\PEGM1_template.docx	1	2026-08-26 13:44:53.738867+07	2026-08-26 13:44:53.738867+07
29	PEMA2	PEMA2_template.docx	C:\\Users\\USER\\Documents\\BFC\\BFC-docx\\backend\\uploads\\templates\\PEMA2_template.docx	1	2026-08-26 13:45:09.325491+07	2026-08-26 13:45:09.325491+07
30	PEMA3	PEMA3_template.docx	C:\\Users\\USER\\Documents\\BFC\\BFC-docx\\backend\\uploads\\templates\\PEMA3_template.docx	1	2026-08-26 13:45:19.063745+07	2026-08-26 13:45:19.063745+07
31	PENT1	PENT1_template.docx	C:\\Users\\USER\\Documents\\BFC\\BFC-docx\\backend\\uploads\\templates\\PENT1_template.docx	1	2026-08-26 13:45:30.616601+07	2026-08-26 13:45:30.616601+07
32	PEOM1	PEOM1_template.docx	C:\\Users\\USER\\Documents\\BFC\\BFC-docx\\backend\\uploads\\templates\\PEOM1_template.docx	1	2026-08-26 13:45:40.693381+07	2026-08-26 13:45:40.693381+07
25	PEBJ4	PEBJ4_template.docx	C:\\Users\\USER\\Documents\\BFC\\BFC-docx\\backend\\uploads\\templates\\PEBJ4_template.docx	1	2026-08-26 13:44:17.07506+07	2026-09-01 11:55:08.605891+07
24	PBSJ1	PBSJ1_template.docx	C:\\Users\\USER\\OneDrive\\Documents\\BFC\\BFC-docx\\backend\\uploads\\templates\\PBSJ1_template.docx	1	2026-08-26 13:43:52.103267+07	2026-11-02 08:21:46.752679+07
23	CONTOH	CONTOH_template.docx	C:\\Users\\USER\\OneDrive\\Documents\\BFC\\BFC-docx\\backend\\uploads\\templates\\CONTOH_template.docx	1	2026-08-26 13:43:39.186733+07	2026-11-19 10:16:55.623235+07
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, refresh_token, last_activity, expires_at, created_at) FROM stdin;
b5521bdc-07a3-4c72-9ffa-c4182d7672bd	1	cc02e8e8-836c-47ab-a4d8-97a3aec2181e-99cca0a2-d2ea-4348-8ce8-372f625aa99e	2026-08-26 16:18:49.706592+07	2026-09-02 13:20:30.827204+07	2026-08-26 13:20:30.829346+07
782c6470-1629-449a-b598-e296a62d7db6	5	2d9d4e70-0633-463c-9d84-d6e4c63befe5-1cee5ecc-f84f-4e94-a8af-1fb913cf9b5b	2026-11-04 15:35:32.36858+07	2026-11-11 15:06:59.913301+07	2026-11-04 15:06:59.914883+07
0af59d21-29d1-4fa9-9667-b456b8271e02	1	ff5820ca-e246-4ea5-8902-6c8889ef6bab-31dc17fb-4d5e-41cc-a82d-a36866a9a1e1	2026-11-23 11:35:06.654025+07	2026-11-30 10:54:06.480015+07	2026-11-23 10:54:06.480545+07
93072b1a-cabf-4eb5-aa46-14fda3314dfd	8	b1b6c0be-c978-497a-a350-ed8a10a712c1-bc473a3a-16f6-48f8-b8cf-b9f2cf3226d8	2026-11-13 08:38:28.807368+07	2026-11-20 08:38:28.807368+07	2026-11-13 08:38:28.808392+07
463ea0d3-0a1a-499d-9b89-be28cfb3d9c2	3	db16a740-c28c-4420-be35-d5b4031a0194-7e4a994c-8d29-44db-abf7-ea402dc67f12	2026-09-02 11:29:25.373748+07	2026-09-09 08:16:09.363688+07	2026-09-02 08:16:09.36795+07
6718ac56-27f2-440d-9600-a168a527fc85	1	6a6ac4c7-8e04-490c-afa6-77553c57d925-c72ee0bb-38c7-4740-bf01-b8ed2e7299ad	2026-11-02 08:20:30.122724+07	2026-11-09 08:20:30.122724+07	2026-11-02 08:20:30.123392+07
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, full_name, password, role, is_active, created_at, updated_at, jabatan, approval_status) FROM stdin;
1	admin	Administrator	$2a$10$cz/z76aeQn43FLPUIFCPAOt6vGanvtIhRw8wJw8Y3DAeircUowb.C	admin	t	2026-08-06 09:07:20.412816+07	2026-11-04 08:43:41.166257+07		approved
5	deam	dealova ana	$2a$10$QI0LI0YVuACA4Ep1XlPijuMT39cN8ai50yir0yUOoZYl9gTberFTW	ts	t	2026-08-06 09:26:41.60708+07	2026-11-12 08:52:24.872331+07	mgr	approved
3	deas	dealova	$2a$10$SqhW232YAJ8QSOzveAdT4Ow7Ad2GnC9bvt4GhENhkozWMI3CcmCUu	ts	t	2026-08-06 09:23:23.768455+07	2026-11-12 08:52:46.307906+07	spv	approved
8	dea	dea	$2a$10$HYmQzQFsvwKGai32YnyiZ.JawvhOKW6K3FJvcLN0xCFLtjyiXhxo2	ts	t	2026-11-04 08:44:02.472168+07	2026-11-12 08:52:49.789281+07	staff	approved
9	deap	deaa	$2a$10$ZqcP9gD2lhVGnFjon.ZfLua4.FFK8ShTpbENbxVuaiZD6ZW0Y5Eja	produksi	t	2026-11-05 08:44:03.151571+07	2026-11-12 08:52:53.474427+07	\N	approved
10	deaq	dealovaa	$2a$10$JWl4IAXOHewd4TiqsNsK1Oqqtw9LsN9j.rCjxJq4f/cuGoqUzXdgK	qa	t	2026-11-12 08:13:50.776942+07	2026-11-12 08:52:58.629278+07	\N	approved
11	deac	dealovaaa	$2a$10$FYqpiF5WjF9iFjzFagy3eOldMJ.diH1RFwP1QH6F1SpC7NKSh5oMW	ppic	t	2026-11-17 08:11:15.053686+07	2026-11-17 08:37:53.088128+07	\N	pending
12	deadea	dealova anastasya	$2a$10$koxfyhcg8iyS5z9dUU8d5OPT7gqFSMbyAdgfYXVZFyA/Ms8uiUTaK	ts	t	2026-11-23 10:44:37.862856+07	2026-11-23 10:44:37.862856+07	staff	pending
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 76, true);


--
-- Name: bk_product_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bk_product_materials_id_seq', 56, true);


--
-- Name: bk_product_rendemen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bk_product_rendemen_id_seq', 56, true);


--
-- Name: bk_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bk_products_id_seq', 10, true);


--
-- Name: bk_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bk_reports_id_seq', 15, true);


--
-- Name: bo_product_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bo_product_materials_id_seq', 80, true);


--
-- Name: bo_product_thresholds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bo_product_thresholds_id_seq', 180, true);


--
-- Name: bo_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bo_products_id_seq', 10, true);


--
-- Name: bo_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bo_reports_id_seq', 29, true);


--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.password_reset_requests_id_seq', 1, true);


--
-- Name: report_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_templates_id_seq', 32, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 12, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: bk_product_materials bk_product_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_materials
    ADD CONSTRAINT bk_product_materials_pkey PRIMARY KEY (id);


--
-- Name: bk_product_materials bk_product_materials_product_id_material_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_materials
    ADD CONSTRAINT bk_product_materials_product_id_material_index_key UNIQUE (product_id, material_index);


--
-- Name: bk_product_rendemen bk_product_rendemen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_rendemen
    ADD CONSTRAINT bk_product_rendemen_pkey PRIMARY KEY (id);


--
-- Name: bk_products bk_products_kode_produk_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_products
    ADD CONSTRAINT bk_products_kode_produk_key UNIQUE (kode_produk);


--
-- Name: bk_products bk_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_products
    ADD CONSTRAINT bk_products_pkey PRIMARY KEY (id);


--
-- Name: bk_reports bk_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_reports
    ADD CONSTRAINT bk_reports_pkey PRIMARY KEY (id);


--
-- Name: bo_product_materials bo_product_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_materials
    ADD CONSTRAINT bo_product_materials_pkey PRIMARY KEY (id);


--
-- Name: bo_product_materials bo_product_materials_product_id_material_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_materials
    ADD CONSTRAINT bo_product_materials_product_id_material_index_key UNIQUE (product_id, material_index);


--
-- Name: bo_product_thresholds bo_product_thresholds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_thresholds
    ADD CONSTRAINT bo_product_thresholds_pkey PRIMARY KEY (id);


--
-- Name: bo_product_thresholds bo_product_thresholds_product_id_criteria_index_target_inde_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_thresholds
    ADD CONSTRAINT bo_product_thresholds_product_id_criteria_index_target_inde_key UNIQUE (product_id, criteria_index, target_index);


--
-- Name: bo_products bo_products_kode_produk_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_products
    ADD CONSTRAINT bo_products_kode_produk_key UNIQUE (kode_produk);


--
-- Name: bo_products bo_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_products
    ADD CONSTRAINT bo_products_pkey PRIMARY KEY (id);


--
-- Name: bo_reports bo_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_reports
    ADD CONSTRAINT bo_reports_pkey PRIMARY KEY (id);


--
-- Name: password_reset_requests password_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_pkey PRIMARY KEY (id);


--
-- Name: report_templates report_templates_kode_produk_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_kode_produk_key UNIQUE (kode_produk);


--
-- Name: report_templates report_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_activity_logs_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_activity ON public.activity_logs USING btree (activity);


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);


--
-- Name: idx_activity_logs_menu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_menu ON public.activity_logs USING btree (menu);


--
-- Name: idx_activity_logs_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_role ON public.activity_logs USING btree (role);


--
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);


--
-- Name: idx_bk_materials_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bk_materials_pid ON public.bk_product_materials USING btree (product_id);


--
-- Name: idx_bk_rendemen_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bk_rendemen_pid ON public.bk_product_rendemen USING btree (product_id);


--
-- Name: idx_bk_reports_kode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bk_reports_kode ON public.bk_reports USING btree (kode_produk);


--
-- Name: idx_bk_reports_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bk_reports_status ON public.bk_reports USING btree (status);


--
-- Name: idx_bk_reports_tgl; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bk_reports_tgl ON public.bk_reports USING btree (tgl_pembuatan DESC);


--
-- Name: idx_bo_materials_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bo_materials_pid ON public.bo_product_materials USING btree (product_id);


--
-- Name: idx_bo_reports_kode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bo_reports_kode ON public.bo_reports USING btree (kode_produk);


--
-- Name: idx_bo_reports_tgl; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bo_reports_tgl ON public.bo_reports USING btree (tgl_pembuatan DESC);


--
-- Name: idx_bo_thresholds_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bo_thresholds_pid ON public.bo_product_thresholds USING btree (product_id);


--
-- Name: idx_pw_reset_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pw_reset_status ON public.password_reset_requests USING btree (status);


--
-- Name: idx_pw_reset_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pw_reset_user ON public.password_reset_requests USING btree (user_id);


--
-- Name: idx_report_templates_kode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_report_templates_kode ON public.report_templates USING btree (kode_produk);


--
-- Name: idx_sessions_refresh_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_refresh_token ON public.sessions USING btree (refresh_token);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: bk_product_materials bk_product_materials_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_materials
    ADD CONSTRAINT bk_product_materials_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.bk_products(id) ON DELETE CASCADE;


--
-- Name: bk_product_rendemen bk_product_rendemen_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_rendemen
    ADD CONSTRAINT bk_product_rendemen_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.bk_products(id) ON DELETE CASCADE;


--
-- Name: bk_reports bk_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_reports
    ADD CONSTRAINT bk_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: bk_reports bk_reports_mgr_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_reports
    ADD CONSTRAINT bk_reports_mgr_id_fkey FOREIGN KEY (mgr_id) REFERENCES public.users(id);


--
-- Name: bk_reports bk_reports_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_reports
    ADD CONSTRAINT bk_reports_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: bk_reports bk_reports_spv_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_reports
    ADD CONSTRAINT bk_reports_spv_id_fkey FOREIGN KEY (spv_id) REFERENCES public.users(id);


--
-- Name: bo_reports bo_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_reports
    ADD CONSTRAINT bo_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: password_reset_requests password_reset_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: password_reset_requests password_reset_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: report_templates report_templates_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_templates
    ADD CONSTRAINT report_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KzoDaWeCLMKfmw3Na6g2kUYcpOUQgYHoMUCgvdFKM7tncUXg4Rhelps62zyL1WH


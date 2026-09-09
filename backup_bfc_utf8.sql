--
-- PostgreSQL database dump
--

\restrict kfytBfTh3Fu5h2fy7ymIl0LlmH7WKEvEcopOzsCwLLCGtJd2fwB6ceCTfjJ4kXj

-- Dumped from database version 15.19
-- Dumped by pg_dump version 15.19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
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


ALTER TABLE public.activity_logs_id_seq OWNER TO postgres;

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


ALTER TABLE public.bk_product_materials_id_seq OWNER TO postgres;

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


ALTER TABLE public.bk_product_rendemen_id_seq OWNER TO postgres;

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


ALTER TABLE public.bk_products_id_seq OWNER TO postgres;

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
    detail_json text
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


ALTER TABLE public.bk_reports_id_seq OWNER TO postgres;

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


ALTER TABLE public.bo_product_materials_id_seq OWNER TO postgres;

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


ALTER TABLE public.bo_product_thresholds_id_seq OWNER TO postgres;

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


ALTER TABLE public.bo_products_id_seq OWNER TO postgres;

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


ALTER TABLE public.bo_reports_id_seq OWNER TO postgres;

--
-- Name: bo_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bo_reports_id_seq OWNED BY public.bo_reports.id;


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


ALTER TABLE public.report_templates_id_seq OWNER TO postgres;

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


ALTER TABLE public.users_id_seq OWNER TO postgres;

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
1	1	\N	\N	\N	::1	2026-08-20 04:11:51.677213+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEOM1	POST	/api/admin/report-templates	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15	2026-08-20 04:11:51.677213+00
2	1	\N	\N	\N	::1	2026-08-20 07:52:40.952811+00	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PBSJ1, batch Wed19826	POST	/api/reports/download	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15	2026-08-20 07:52:40.952811+00
3	1	\N	\N	\N	::1	2026-08-20 07:53:44.460746+00	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PBSJ1, batch Wed19826	POST	/api/reports/download	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15	2026-08-20 07:53:44.460746+00
4	1	\N	\N	\N	::1	2026-08-20 07:56:32.400368+00	admin	admin	User Management	Menghapus User	Menghapus user ID 6	DELETE	/api/users/:id	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15	2026-08-20 07:56:32.400368+00
5	1	\N	\N	\N	::1	2026-08-20 07:56:34.793491+00	admin	admin	User Management	Menghapus User	Menghapus user ID 7	DELETE	/api/users/:id	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15	2026-08-20 07:56:34.793491+00
6	1	\N	\N	\N	::1	2026-08-20 07:56:37.681245+00	admin	admin	User Management	Menghapus User	Menghapus user ID 2	DELETE	/api/users/:id	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15	2026-08-20 07:56:37.681245+00
7	1	\N	\N	\N	::1	2026-08-21 04:30:31.057429+00	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk CONTOH	POST	/api/admin/report-templates	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5.2 Safari/605.1.15	2026-08-21 04:30:31.057429+00
8	1	\N	\N	\N	172.18.0.1	2026-09-03 02:10:03.787133+00	admin	admin	Admin - Batch Overfilled	Update Produk Batch Overfilled	Update produk Batch Overfilled: PBSJ1	PUT	/api/admin/bo/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:10:03.787133+00
9	1	\N	\N	\N	172.18.0.1	2026-09-03 02:11:32.858922+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PBSJ1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:11:32.858922+00
10	1	\N	\N	\N	172.18.0.1	2026-09-03 02:11:40.083068+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk CONTOH	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:11:40.083068+00
11	1	\N	\N	\N	172.18.0.1	2026-09-03 02:11:48.188714+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEBJ3	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:11:48.188714+00
12	1	\N	\N	\N	172.18.0.1	2026-09-03 02:11:57.22867+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEBJ4	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:11:57.22867+00
13	1	\N	\N	\N	172.18.0.1	2026-09-03 02:12:05.323226+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEGA2	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:12:05.323226+00
14	1	\N	\N	\N	172.18.0.1	2026-09-03 02:12:35.876025+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEMA2	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:12:35.876025+00
15	1	\N	\N	\N	172.18.0.1	2026-09-03 02:12:44.910648+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEMA3	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:12:44.910648+00
16	1	\N	\N	\N	172.18.0.1	2026-09-03 02:12:55.406139+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PENT1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:12:55.406139+00
17	1	\N	\N	\N	172.18.0.1	2026-09-03 02:13:03.92258+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEOM1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:13:03.92258+00
18	1	\N	\N	\N	172.18.0.1	2026-09-03 02:13:22.555486+00	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PBSJ1, batch Wed19826	POST	/api/reports/download	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:13:22.555486+00
19	1	\N	\N	\N	172.18.0.1	2026-09-03 02:16:27.073252+00	admin	admin	Admin - Batch Khusus	Tambah Produk Batch Khusus	Tambah produk Batch Khusus: PEBJ4	POST	/api/admin/bk/products	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:16:27.073252+00
20	1	\N	\N	\N	172.18.0.1	2026-09-03 02:16:40.788951+00	admin	admin	Batch Khusus	Membuat Perhitungan Batch Khusus	Membuat perhitungan Batch Khusus untuk produk PEGM1, No. Batch Wed19826	POST	/api/batch-khusus/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:16:40.788951+00
21	1	\N	\N	\N	172.18.0.1	2026-09-03 02:17:31.476819+00	admin	admin	Admin - Report Template	Delete Template Report	Hapus template report untuk produk PEGM1	DELETE	/api/admin/report-templates/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:17:31.476819+00
22	1	\N	\N	\N	172.18.0.1	2026-09-03 02:54:14.550602+00	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PEGM1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:54:14.550602+00
23	1	\N	\N	\N	172.18.0.1	2026-09-03 02:54:58.736564+00	admin	admin	Batch Khusus	Membuat Perhitungan Batch Khusus	Membuat perhitungan Batch Khusus untuk produk PEGM1, No. Batch Wed19826	POST	/api/batch-khusus/reports	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:54:58.736564+00
24	1	\N	\N	\N	172.18.0.1	2026-09-03 02:55:15.601055+00	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PBSJ1, batch Wed19826	POST	/api/reports/download	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:55:15.601055+00
25	1	\N	\N	\N	172.18.0.1	2026-09-03 02:55:23.45953+00	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PEBJ3, batch TUE18826	POST	/api/reports/download	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 02:55:23.45953+00
26	1	\N	\N	\N	172.18.0.1	2026-09-03 03:10:31.941411+00	admin	admin	Admin - Report Template	Delete Template Report	Hapus template report untuk produk PEGM1	DELETE	/api/admin/report-templates/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 03:10:31.941411+00
27	1	\N	\N	\N	172.18.0.1	2026-09-03 03:21:47.73639+00	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PEGM1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 03:21:47.73639+00
28	1	\N	\N	\N	172.18.0.1	2026-09-03 03:21:58.369218+00	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PEGM1, batch Wed19826	POST	/api/reports/download	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 03:21:58.369218+00
29	1	\N	\N	\N	172.18.0.1	2026-09-03 03:26:13.739085+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEGM1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 03:26:13.739085+00
30	1	\N	\N	\N	172.18.0.1	2026-09-03 03:26:22.157888+00	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PEGM1, batch Wed19826	POST	/api/reports/download	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 03:26:22.157888+00
31	1	\N	\N	\N	172.18.0.1	2026-09-03 04:21:58.934941+00	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PBSJ1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 04:21:58.934941+00
32	1	\N	\N	\N	172.18.0.1	2026-09-03 04:22:06.944293+00	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PEBJ3	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 04:22:06.944293+00
33	1	\N	\N	\N	172.18.0.1	2026-09-03 04:22:47.292092+00	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PEBK1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 04:22:47.292092+00
34	1	\N	\N	\N	172.18.0.1	2026-09-03 04:23:26.306247+00	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PEGA2	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 04:23:26.306247+00
35	1	\N	\N	\N	172.18.0.1	2026-09-03 04:24:08.034427+00	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PEGM1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 04:24:08.034427+00
36	1	\N	\N	\N	172.18.0.1	2026-09-03 04:24:57.496445+00	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PENT1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 04:24:57.496445+00
37	1	\N	\N	\N	172.18.0.1	2026-09-03 04:25:27.166411+00	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PEOM1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 04:25:27.166411+00
38	1	\N	\N	\N	172.18.0.1	2026-09-03 06:19:17.938513+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEGA2	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 06:19:17.938513+00
39	1	\N	\N	\N	172.18.0.1	2026-09-03 06:20:25.677843+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEMA2	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 06:20:25.677843+00
40	1	\N	\N	\N	172.18.0.1	2026-09-03 06:20:38.442033+00	admin	admin	Admin - Report Template	Update Template Report	Update template report untuk produk PEMA2	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 06:20:38.442033+00
41	1	\N	\N	\N	172.18.0.1	2026-09-03 06:20:47.457968+00	admin	admin	Admin - Report Template	Delete Template Report	Hapus template report untuk produk PEGM1	DELETE	/api/admin/report-templates/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 06:20:47.457968+00
42	1	\N	\N	\N	172.18.0.1	2026-09-03 06:39:04.369178+00	admin	admin	Admin - Report Template	Upload Template Report	Upload template report untuk produk PEGM1	POST	/api/admin/report-templates	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 06:39:04.369178+00
43	1	\N	\N	\N	172.18.0.1	2026-09-03 06:39:17.556843+00	admin	admin	Report	Download Report Batch Khusus	Download report BK untuk produk PEGM1, batch Wed19826	POST	/api/reports/download	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 06:39:17.556843+00
44	1	\N	\N	\N	172.18.0.1	2026-09-03 06:44:12.288184+00	admin	admin	Admin - Batch Khusus	Update Produk Batch Khusus	Update produk Batch Khusus: PBSJ1	PUT	/api/admin/bk/products/:id	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0	2026-09-03 06:44:12.288184+00
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
35	10	0	2AS006000J	1497.7500	1.5000	2.5000	561.7000
36	10	1	XEBJ4	359.3500	1.5000	1.5000	134.7000
37	10	2	2AC006000J	2142.9000	1.5000	2.5000	803.6000
42	1	0	2AS006000J	1497.3000	1.5000	2.5000	372.9200
43	1	1	XEBJ3	360.3000	1.5000	1.5000	95.8300
44	1	2	2AC006000J	2142.4000	1.5000	2.5000	531.2500
45	8	0	2AS006000J	1497.3000	1.5000	2.5000	431.2000
46	8	1	XEBK1	310.3000	1.0000	1.0000	89.3700
47	8	2	2AC006000J	2192.4000	1.5000	1.5000	631.4000
48	5	0	2AS006000J	1030.3000	1.5000	2.5000	257.6000
49	5	1	XEGA2	736.7000	1.5000	1.5000	184.1800
50	5	2	2AC006000J	2233.0000	1.5000	2.5000	558.2500
51	4	0	2AS006000J	1361.4000	1.0000	1.5000	340.4000
52	4	1	XEGM1	496.5000	1.0000	1.0000	124.1300
53	4	2	2AC006000J	2142.1000	1.0000	1.5000	535.5200
54	7	0	2AS006000J	1356.1000	3.9300	3.9300	392.9400
55	7	1	XENT1	484.3000	1.4000	1.4000	140.3300
56	7	2	2AC006000J	2159.6000	6.2600	6.2600	625.7300
57	6	0	2AS006000J	1219.2000	1.5000	1.5000	304.8000
58	6	1	XEOM1	430.8000	1.5000	1.5000	107.7000
59	6	2	2AC006000J	2350.0000	1.5000	1.5000	587.5000
60	9	0	2AS006000J	1640.0000	2.3400	2.3400	233.7000
61	9	1	XBSJ1	1478.0000	2.1100	2.1100	210.6200
62	9	2	2AC006000J	1830.0000	2.6100	2.6100	260.8000
63	9	3	2AS012000	2052.0000	2.9200	2.9200	292.4000
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
35	10	0	0.995500
36	10	1	1.006500
37	10	2	1.014000
42	1	0	0.995500
43	1	1	1.006500
44	1	2	1.014000
45	8	0	0.990000
46	8	1	1.010000
47	8	2	1.020000
48	5	0	0.990000
49	5	1	1.010000
50	5	2	1.014000
51	4	0	0.990000
52	4	1	1.010000
53	4	2	1.020000
54	7	0	0.990000
55	7	1	1.010000
56	7	2	1.020000
57	6	0	0.990000
58	6	1	1.010000
59	6	2	1.020000
60	9	0	0.990000
61	9	1	1.010000
62	9	2	0.947900
63	9	3	1.052100
\.


--
-- Data for Name: bk_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bk_products (id, kode_produk, nama_produk, created_at, updated_at) FROM stdin;
2	PEMA2	EXTRA JOSS GO MANGGA EFF.PWD	2026-08-18 08:02:37.529786+00	2026-08-18 08:02:37.529786+00
3	PEMA3	EXTRA JOSS GO MANGGA EFF.PWD	2026-08-18 08:04:07.836521+00	2026-08-18 08:04:07.836521+00
10	PEBJ4	EXTRA JOSS ACTIVE EFF.PWD	2026-09-03 02:16:27.009014+00	2026-09-03 02:16:27.009014+00
1	PEBJ3	EXTRA JOSS ACTIVE EFF.PWD	2026-08-18 08:01:11.612122+00	2026-09-03 04:22:06.938646+00
8	PEBK1	EXTRA JOSS ACTIVE EFF.PWD KOR	2026-08-18 08:10:43.604186+00	2026-09-03 04:22:47.281649+00
5	PEGA2	EXTRA JOSS GO ANGGUR EFF.PWD	2026-08-18 08:06:45.24308+00	2026-09-03 04:23:26.296373+00
4	PEGM1	EXTRA JOSS GO ANGGUR EFF.PWD	2026-08-18 08:05:10.760697+00	2026-09-03 04:24:08.023824+00
7	PENT1	EXTRA JOSS ACTIVE EFF.PWD NIG	2026-08-18 08:09:13.162138+00	2026-09-03 04:24:57.490088+00
6	PEOM1	EXTRA JOSS ORANGE EFF.PWD MAL	2026-08-18 08:07:47.827022+00	2026-09-03 04:25:27.156203+00
9	PBSJ1	B7 SLA-SI JERUK NIPIS EFF.PWD	2026-08-18 08:12:41.689612+00	2026-09-03 06:44:12.273726+00
\.


--
-- Data for Name: bk_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bk_reports (id, kode_produk, no_batch, tgl_pembuatan, bobot_total, input_sisa_minor, created_by, created_at, detail_json) FROM stdin;
2	PEBJ3	TUE18826	2026-08-18	1609.7696	145.0000	1	2026-08-18 08:13:26.073936+00	{"bobot_total":1609.7696,"input_sisa_minor":145,"materials":[{"id":22,"product_id":1,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1497.3,"teoritis":372.92,"range_min":1.5,"range_max":2.5},{"id":23,"product_id":1,"material_index":1,"kode_material":"XEBJ3","qty_per_sachet":360.3,"teoritis":95.83,"range_min":1.5,"range_max":1.5},{"id":24,"product_id":1,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2142.4,"teoritis":531.25,"range_min":1.5,"range_max":2.5}],"total":1609.7696364140993,"values":[602.5770191507077,145,862.1926172633915]}
3	PEGA2	Wed19826	2026-08-19	1161.9384	214.0000	1	2026-08-19 01:15:52.389774+00	{"bobot_total":1161.9384,"input_sisa_minor":214,"materials":[{"id":13,"product_id":5,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1030.3,"teoritis":0,"range_min":1.5,"range_max":2.5},{"id":14,"product_id":5,"material_index":1,"kode_material":"XEGA2","qty_per_sachet":736.7,"teoritis":0,"range_min":1.5,"range_max":1.5},{"id":15,"product_id":5,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2233,"teoritis":0,"range_min":1.5,"range_max":2.5}],"total":1161.9383738292383,"values":[299.28627663906605,214,648.6520971901723]}
4	PBSJ1	Wed19826	2026-08-19	1046.6847	221.0000	1	2026-08-19 02:11:14.188086+00	{"bobot_total":1046.6847,"input_sisa_minor":221,"materials":[{"id":31,"product_id":9,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1640,"teoritis":0,"range_min":2.34,"range_max":2.34},{"id":32,"product_id":9,"material_index":1,"kode_material":"XBSJ1","qty_per_sachet":1478,"teoritis":0,"range_min":2.11,"range_max":2.11},{"id":33,"product_id":9,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":1830,"teoritis":0,"range_min":2.61,"range_max":2.61},{"id":34,"product_id":9,"material_index":3,"kode_material":"2AS012000","qty_per_sachet":2052,"teoritis":0,"range_min":2.92,"range_max":2.92}],"total":1046.684709066306,"values":[245.2232746955345,221,273.6332882273343,306.82814614343715]}
5	PEMA2	Wed19826	2026-08-19	979.5690	175.0000	1	2026-08-19 02:37:24.076091+00	{"bobot_total":979.569,"input_sisa_minor":175,"materials":[{"id":4,"product_id":2,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1140,"teoritis":273.6,"range_min":1.5,"range_max":2.5},{"id":5,"product_id":2,"material_index":1,"kode_material":"XEMA2","qty_per_sachet":714.6,"teoritis":171.5,"range_min":1.5,"range_max":1.5},{"id":6,"product_id":2,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2145.4,"teoritis":514.9,"range_min":1.5,"range_max":2.5}],"total":979.5689896445565,"values":[279.17716204869856,175,525.3918275958579]}
6	PENT1	Wed19826	2026-08-19	999.3805	121.0000	1	2026-08-19 02:48:18.676047+00	{"bobot_total":999.3805,"input_sisa_minor":121,"materials":[{"id":25,"product_id":7,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1356.1,"teoritis":0,"range_min":3.93,"range_max":3.93},{"id":26,"product_id":7,"material_index":1,"kode_material":"XENT1","qty_per_sachet":484.3,"teoritis":0,"range_min":1.4,"range_max":1.4},{"id":27,"product_id":7,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2159.6,"teoritis":0,"range_min":6.26,"range_max":6.26}],"total":999.3805492463348,"values":[338.81499070823867,121,539.5655585380962]}
7	PEOM1	Wed19826	2026-08-19	1123.4912	121.0000	1	2026-08-19 03:16:44.231716+00	{"bobot_total":1123.4912,"input_sisa_minor":121,"materials":[{"id":16,"product_id":6,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1219.2,"teoritis":0,"range_min":1.5,"range_max":1.5},{"id":17,"product_id":6,"material_index":1,"kode_material":"XEOM1","qty_per_sachet":430.8,"teoritis":0,"range_min":1.5,"range_max":1.5},{"id":18,"product_id":6,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2350,"teoritis":0,"range_min":1.5,"range_max":1.5}],"total":1123.4911792014857,"values":[342.4401114206128,121,660.0510677808728]}
8	PEMA3	Wed19826	2026-08-19	788.4020	121.0000	1	2026-08-19 03:40:07.5555+00	{"bobot_total":788.402,"input_sisa_minor":121,"materials":[{"id":7,"product_id":3,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1225.2,"teoritis":294.05,"range_min":1.5,"range_max":2.5},{"id":8,"product_id":3,"material_index":1,"kode_material":"XEMA3","qty_per_sachet":613.9,"teoritis":147.34,"range_min":1.5,"range_max":1.5},{"id":9,"product_id":3,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2160.9,"teoritis":518.62,"range_min":1.5,"range_max":2.5}],"total":788.4020198729436,"values":[241.48753868708263,121,425.91448118586095]}
9	PEGM1	Wed19826	2026-08-19	974.8238	121.0000	1	2026-08-19 04:47:01.278441+00	{"bobot_total":974.8238,"input_sisa_minor":121,"materials":[{"id":10,"product_id":4,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1361.4,"teoritis":0,"range_min":1,"range_max":1.5},{"id":11,"product_id":4,"material_index":1,"kode_material":"XEGM1","qty_per_sachet":496.5,"teoritis":0,"range_min":1,"range_max":1},{"id":12,"product_id":4,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2142.1,"teoritis":0,"range_min":1,"range_max":1.5}],"total":974.8237663645518,"values":[331.78126888217525,121,522.0424974823766]}
10	PEGM1	Wed19826	2026-09-03	974.8238	121.0000	1	2026-09-03 02:16:40.756573+00	{"bobot_total":974.8238,"input_sisa_minor":121,"materials":[{"id":10,"product_id":4,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1361.4,"teoritis":0,"range_min":1,"range_max":1.5},{"id":11,"product_id":4,"material_index":1,"kode_material":"XEGM1","qty_per_sachet":496.5,"teoritis":0,"range_min":1,"range_max":1},{"id":12,"product_id":4,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2142.1,"teoritis":0,"range_min":1,"range_max":1.5}],"total":974.8237663645518,"values":[331.78126888217525,121,522.0424974823766]}
11	PEGM1	Wed19826	2026-09-03	974.8238	121.0000	1	2026-09-03 02:54:58.695154+00	{"bobot_total":974.8238,"input_sisa_minor":121,"materials":[{"id":10,"product_id":4,"material_index":0,"kode_material":"2AS006000J","qty_per_sachet":1361.4,"teoritis":0,"range_min":1,"range_max":1.5},{"id":11,"product_id":4,"material_index":1,"kode_material":"XEGM1","qty_per_sachet":496.5,"teoritis":0,"range_min":1,"range_max":1},{"id":12,"product_id":4,"material_index":2,"kode_material":"2AC006000J","qty_per_sachet":2142.1,"teoritis":0,"range_min":1,"range_max":1.5}],"total":974.8237663645518,"values":[331.78126888217525,121,522.0424974823766]}
\.


--
-- Data for Name: bo_product_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bo_product_materials (id, product_id, material_index, kode_material, label, target_kg) FROM stdin;
43	1	0	2AS006000J	Sodbic	561.4800
44	1	1	XEBJ1	Minor	135.1200
45	1	2	2AC006000J	Citric	803.4000
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
74	10	0	2AS006000J	Sodbic	211.7000
75	10	1	XBSJ1	Minor	210.6200
76	10	2	2AC006000J	Citric	260.7800
77	10	3	2AS012000	Gula	292.4100
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
97	1	0	1	0.977000	1.000000
98	1	0	2	0.991000	1.000000
99	1	1	0	0.980000	1.000000
100	1	1	2	0.981000	1.000000
101	1	2	0	0.991000	1.000000
102	1	2	1	0.979000	1.000000
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
163	10	0	1	0.940000	1.000000
164	10	0	2	0.950000	1.000000
165	10	0	3	0.950000	1.000000
166	10	1	0	0.950000	1.000000
167	10	1	2	0.950000	1.000000
168	10	1	3	0.950000	1.000000
169	10	2	0	0.950000	1.000000
170	10	2	1	0.940000	1.000000
171	10	2	3	0.950000	1.000000
172	10	3	0	0.950000	1.000000
173	10	3	1	0.940000	1.000000
174	10	3	2	0.950000	1.000000
\.


--
-- Data for Name: bo_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bo_products (id, kode_produk, nama_produk, created_at, updated_at) FROM stdin;
1	PEBJ3	EXTRA JOSS ACTIVE EFF.PWD	2026-08-18 07:46:57.874839+00	2026-08-19 07:14:23.633539+00
2	PEBJ4	EXTRA JOSS ACTIVE EFF.PWD	2026-08-18 07:48:04.398297+00	2026-08-19 07:17:34.268809+00
6	PEBK1	EXTRA JOSS ACTIVE EFF.PWD KOR	2026-08-18 07:53:39.308184+00	2026-08-19 07:18:14.915829+00
8	PEGA2	EXTRA JOSS GO ANGGUR EFF.PWD	2026-08-18 07:55:55.088505+00	2026-08-19 07:19:09.831053+00
9	PEGM1	EXTRA JOSS GO ANGGUR EFF.PWD	2026-08-18 07:57:27.350449+00	2026-08-19 07:20:15.719343+00
3	PEMA2	EXTRA JOSS GO MANGGA EFF.PWD	2026-08-18 07:49:18.885862+00	2026-08-19 07:21:32.221534+00
4	PEMA3	EXTRA JOSS GO MANGGA EFF.PWD	2026-08-18 07:50:27.115862+00	2026-08-19 07:22:21.772026+00
7	PENT1	EXTRA JOSS ACTIVE EFF.PWD NIG	2026-08-18 07:54:44.681162+00	2026-08-19 07:22:56.12049+00
5	PEOM1	EXTRA JOSS ORANGE EFF.PWD MAL	2026-08-18 07:52:17.782186+00	2026-08-19 07:23:29.177494+00
10	PBSJ1	B7 SLA-SI JERUK NIPIS EFF.PWD	2026-08-18 07:59:03.56276+00	2026-09-03 02:10:03.768197+00
\.


--
-- Data for Name: bo_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bo_reports (id, kode_produk, no_batch, tgl_pembuatan, bobot_total, kesimpulan, detail_json, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: report_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_templates (id, kode_produk, nama_file, file_path, created_by, created_at, updated_at) FROM stdin;
15	PBSJ1	PBSJ1_template.docx	/root/uploads/templates/PBSJ1_template.docx	1	2026-08-19 02:12:14.760995+00	2026-09-03 02:11:32.853339+00
22	CONTOH	CONTOH_template.docx	/root/uploads/templates/CONTOH_template.docx	1	2026-08-21 04:30:31.056014+00	2026-09-03 02:11:40.080147+00
13	PEBJ3	PEBJ3_template.docx	/root/uploads/templates/PEBJ3_template.docx	1	2026-08-18 07:20:38.527783+00	2026-09-03 02:11:48.137319+00
20	PEBJ4	PEBJ4_template.docx	/root/uploads/templates/PEBJ4_template.docx	1	2026-08-19 04:00:07.367969+00	2026-09-03 02:11:57.20157+00
19	PEMA3	PEMA3_template.docx	/root/uploads/templates/PEMA3_template.docx	1	2026-08-19 03:39:43.012768+00	2026-09-03 02:12:44.8824+00
17	PENT1	PENT1_template.docx	/root/uploads/templates/PENT1_template.docx	1	2026-08-19 02:47:32.3637+00	2026-09-03 02:12:55.403593+00
18	PEOM1	PEOM1_template.docx	/root/uploads/templates/PEOM1_template.docx	1	2026-08-19 03:15:40.023819+00	2026-09-03 02:13:03.920257+00
14	PEGA2	PEGA2_template.docx	/root/uploads/templates/PEGA2_template.docx	1	2026-08-19 01:16:23.947983+00	2026-09-03 06:19:17.93446+00
16	PEMA2	PEMA2_template.docx	/root/uploads/templates/PEMA2_template.docx	1	2026-08-19 02:37:37.403952+00	2026-09-03 06:20:38.439827+00
25	PEGM1	PEGM1_template.docx	/root/uploads/templates/PEGM1_template.docx	1	2026-09-03 06:39:04.363199+00	2026-09-03 06:39:04.363199+00
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, refresh_token, last_activity, expires_at, created_at) FROM stdin;
3ef85b2a-7ab7-4117-8e4e-5c6836e35f84	3	831a0555-0ac4-4cb8-b4a8-722cee3f62d8-50465f7b-46dc-4d27-a757-a200f56a97fc	2026-08-10 06:46:52.408623+00	2026-08-17 02:41:05.767901+00	2026-08-10 02:41:05.76834+00
19252cfb-a08d-4670-895f-963f758b865c	1	9006edb3-b5ec-4d50-9157-ea5ddcef54ca-bc6cf16e-3ccb-4d9e-8717-38166803f332	2026-08-21 04:15:58.376715+00	2026-08-28 04:15:58.376715+00	2026-08-21 04:15:58.377079+00
358893fd-df7b-4d3d-9bfc-ff2cbaa79066	1	be402d9a-8983-4cac-ad7e-2b5b054256a3-2a0587b0-47df-4b97-aba8-7bb19450f288	2026-09-03 06:39:04.019619+00	2026-09-10 03:09:22.357393+00	2026-09-03 03:09:22.357926+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, full_name, password, role, is_active, created_at, updated_at) FROM stdin;
3	dea123	dealova	$2a$10$FzaS0yGY7NexffyVpH94Hus3u6.LwcSXTjX11t6SZpR1hyw./mVnK	produksi	t	2026-08-06 02:23:23.768455+00	2026-08-06 02:23:23.768455+00
5	dea1234	dealova	$2a$10$kYLeni4bbgUpX/u0SoMlrO6QVgRHdbXrGbz1sQwjOzuNZs/kmkoqa	qa	t	2026-08-06 02:26:41.60708+00	2026-08-06 02:26:41.60708+00
1	admin	Administrator	$2b$12$cnC4PghxwwqOdXY0sNXBx.QAGU0kwO38byC9PpK5nO4nTej6n9nJC	admin	t	2026-08-06 02:07:20.412816+00	2026-08-07 01:37:47.243302+00
\.


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 44, true);


--
-- Name: bk_product_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bk_product_materials_id_seq', 63, true);


--
-- Name: bk_product_rendemen_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bk_product_rendemen_id_seq', 63, true);


--
-- Name: bk_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bk_products_id_seq', 10, true);


--
-- Name: bk_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bk_reports_id_seq', 11, true);


--
-- Name: bo_product_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bo_product_materials_id_seq', 77, true);


--
-- Name: bo_product_thresholds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bo_product_thresholds_id_seq', 174, true);


--
-- Name: bo_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bo_products_id_seq', 10, true);


--
-- Name: bo_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bo_reports_id_seq', 26, true);


--
-- Name: report_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_templates_id_seq', 25, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


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
-- Name: bo_reports bo_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_reports
    ADD CONSTRAINT bo_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


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

\unrestrict kfytBfTh3Fu5h2fy7ymIl0LlmH7WKEvEcopOzsCwLLCGtJd2fwB6ceCTfjJ4kXj


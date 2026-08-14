--
-- PostgreSQL database dump
--

\restrict TWgnw9tEXcxoHMpdXfJ2QICnY042hdcLw9uUzHa481Qy0W7m4M9YIKjValBGthR

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

-- Started on 2026-08-05 15:28:58

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
-- TOC entry 2 (class 3079 OID 16672)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 275 (class 1255 OID 16756)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16742)
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
-- TOC entry 221 (class 1259 OID 16741)
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
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 221
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- TOC entry 226 (class 1259 OID 16770)
-- Name: bk_product_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bk_product_materials (
    id integer NOT NULL,
    product_id integer NOT NULL,
    material_index integer NOT NULL,
    kode_material character varying(20) NOT NULL,
    qty_per_sachet numeric(12,4) NOT NULL,
    range_min numeric(8,4) NOT NULL,
    range_max numeric(8,4) NOT NULL
);


ALTER TABLE public.bk_product_materials OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16769)
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
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 225
-- Name: bk_product_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bk_product_materials_id_seq OWNED BY public.bk_product_materials.id;


--
-- TOC entry 228 (class 1259 OID 16784)
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
-- TOC entry 227 (class 1259 OID 16783)
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
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 227
-- Name: bk_product_rendemen_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bk_product_rendemen_id_seq OWNED BY public.bk_product_rendemen.id;


--
-- TOC entry 224 (class 1259 OID 16759)
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
-- TOC entry 223 (class 1259 OID 16758)
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
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 223
-- Name: bk_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bk_products_id_seq OWNED BY public.bk_products.id;


--
-- TOC entry 230 (class 1259 OID 16796)
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
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bk_reports OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16795)
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
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 229
-- Name: bk_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bk_reports_id_seq OWNED BY public.bk_reports.id;


--
-- TOC entry 234 (class 1259 OID 16825)
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
-- TOC entry 233 (class 1259 OID 16824)
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
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 233
-- Name: bo_product_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bo_product_materials_id_seq OWNED BY public.bo_product_materials.id;


--
-- TOC entry 236 (class 1259 OID 16839)
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
-- TOC entry 235 (class 1259 OID 16838)
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
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 235
-- Name: bo_product_thresholds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bo_product_thresholds_id_seq OWNED BY public.bo_product_thresholds.id;


--
-- TOC entry 232 (class 1259 OID 16814)
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
-- TOC entry 231 (class 1259 OID 16813)
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
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 231
-- Name: bo_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bo_products_id_seq OWNED BY public.bo_products.id;


--
-- TOC entry 238 (class 1259 OID 16853)
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
-- TOC entry 237 (class 1259 OID 16852)
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
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 237
-- Name: bo_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bo_reports_id_seq OWNED BY public.bo_reports.id;


--
-- TOC entry 220 (class 1259 OID 16724)
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
-- TOC entry 219 (class 1259 OID 16710)
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
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'produksi'::character varying, 'qa'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16709)
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
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 218
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4836 (class 2604 OID 16745)
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- TOC entry 4842 (class 2604 OID 16773)
-- Name: bk_product_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_materials ALTER COLUMN id SET DEFAULT nextval('public.bk_product_materials_id_seq'::regclass);


--
-- TOC entry 4843 (class 2604 OID 16787)
-- Name: bk_product_rendemen id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_rendemen ALTER COLUMN id SET DEFAULT nextval('public.bk_product_rendemen_id_seq'::regclass);


--
-- TOC entry 4839 (class 2604 OID 16762)
-- Name: bk_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_products ALTER COLUMN id SET DEFAULT nextval('public.bk_products_id_seq'::regclass);


--
-- TOC entry 4844 (class 2604 OID 16799)
-- Name: bk_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_reports ALTER COLUMN id SET DEFAULT nextval('public.bk_reports_id_seq'::regclass);


--
-- TOC entry 4849 (class 2604 OID 16828)
-- Name: bo_product_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_materials ALTER COLUMN id SET DEFAULT nextval('public.bo_product_materials_id_seq'::regclass);


--
-- TOC entry 4850 (class 2604 OID 16842)
-- Name: bo_product_thresholds id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_thresholds ALTER COLUMN id SET DEFAULT nextval('public.bo_product_thresholds_id_seq'::regclass);


--
-- TOC entry 4846 (class 2604 OID 16817)
-- Name: bo_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_products ALTER COLUMN id SET DEFAULT nextval('public.bo_products_id_seq'::regclass);


--
-- TOC entry 4851 (class 2604 OID 16856)
-- Name: bo_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_reports ALTER COLUMN id SET DEFAULT nextval('public.bo_reports_id_seq'::regclass);


--
-- TOC entry 4829 (class 2604 OID 16713)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4866 (class 2606 OID 16750)
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4878 (class 2606 OID 16775)
-- Name: bk_product_materials bk_product_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_materials
    ADD CONSTRAINT bk_product_materials_pkey PRIMARY KEY (id);


--
-- TOC entry 4880 (class 2606 OID 16777)
-- Name: bk_product_materials bk_product_materials_product_id_material_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_materials
    ADD CONSTRAINT bk_product_materials_product_id_material_index_key UNIQUE (product_id, material_index);


--
-- TOC entry 4883 (class 2606 OID 16789)
-- Name: bk_product_rendemen bk_product_rendemen_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_rendemen
    ADD CONSTRAINT bk_product_rendemen_pkey PRIMARY KEY (id);


--
-- TOC entry 4874 (class 2606 OID 16768)
-- Name: bk_products bk_products_kode_produk_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_products
    ADD CONSTRAINT bk_products_kode_produk_key UNIQUE (kode_produk);


--
-- TOC entry 4876 (class 2606 OID 16766)
-- Name: bk_products bk_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_products
    ADD CONSTRAINT bk_products_pkey PRIMARY KEY (id);


--
-- TOC entry 4886 (class 2606 OID 16802)
-- Name: bk_reports bk_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_reports
    ADD CONSTRAINT bk_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 4894 (class 2606 OID 16830)
-- Name: bo_product_materials bo_product_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_materials
    ADD CONSTRAINT bo_product_materials_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 2606 OID 16832)
-- Name: bo_product_materials bo_product_materials_product_id_material_index_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_materials
    ADD CONSTRAINT bo_product_materials_product_id_material_index_key UNIQUE (product_id, material_index);


--
-- TOC entry 4899 (class 2606 OID 16844)
-- Name: bo_product_thresholds bo_product_thresholds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_thresholds
    ADD CONSTRAINT bo_product_thresholds_pkey PRIMARY KEY (id);


--
-- TOC entry 4901 (class 2606 OID 16846)
-- Name: bo_product_thresholds bo_product_thresholds_product_id_criteria_index_target_inde_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_thresholds
    ADD CONSTRAINT bo_product_thresholds_product_id_criteria_index_target_inde_key UNIQUE (product_id, criteria_index, target_index);


--
-- TOC entry 4890 (class 2606 OID 16823)
-- Name: bo_products bo_products_kode_produk_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_products
    ADD CONSTRAINT bo_products_kode_produk_key UNIQUE (kode_produk);


--
-- TOC entry 4892 (class 2606 OID 16821)
-- Name: bo_products bo_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_products
    ADD CONSTRAINT bo_products_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 16861)
-- Name: bo_reports bo_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_reports
    ADD CONSTRAINT bo_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 4862 (class 2606 OID 16733)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 4864 (class 2606 OID 16735)
-- Name: sessions sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_refresh_token_key UNIQUE (refresh_token);


--
-- TOC entry 4855 (class 2606 OID 16721)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4857 (class 2606 OID 16723)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 4867 (class 1259 OID 16875)
-- Name: idx_activity_logs_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_activity ON public.activity_logs USING btree (activity);


--
-- TOC entry 4868 (class 1259 OID 16755)
-- Name: idx_activity_logs_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_created ON public.activity_logs USING btree (created_at DESC);


--
-- TOC entry 4869 (class 1259 OID 16872)
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);


--
-- TOC entry 4870 (class 1259 OID 16874)
-- Name: idx_activity_logs_menu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_menu ON public.activity_logs USING btree (menu);


--
-- TOC entry 4871 (class 1259 OID 16873)
-- Name: idx_activity_logs_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_role ON public.activity_logs USING btree (role);


--
-- TOC entry 4872 (class 1259 OID 16754)
-- Name: idx_activity_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs USING btree (user_id);


--
-- TOC entry 4881 (class 1259 OID 16810)
-- Name: idx_bk_materials_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bk_materials_pid ON public.bk_product_materials USING btree (product_id);


--
-- TOC entry 4884 (class 1259 OID 16811)
-- Name: idx_bk_rendemen_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bk_rendemen_pid ON public.bk_product_rendemen USING btree (product_id);


--
-- TOC entry 4887 (class 1259 OID 16808)
-- Name: idx_bk_reports_kode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bk_reports_kode ON public.bk_reports USING btree (kode_produk);


--
-- TOC entry 4888 (class 1259 OID 16809)
-- Name: idx_bk_reports_tgl; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bk_reports_tgl ON public.bk_reports USING btree (tgl_pembuatan DESC);


--
-- TOC entry 4897 (class 1259 OID 16869)
-- Name: idx_bo_materials_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bo_materials_pid ON public.bo_product_materials USING btree (product_id);


--
-- TOC entry 4905 (class 1259 OID 16867)
-- Name: idx_bo_reports_kode; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bo_reports_kode ON public.bo_reports USING btree (kode_produk);


--
-- TOC entry 4906 (class 1259 OID 16868)
-- Name: idx_bo_reports_tgl; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bo_reports_tgl ON public.bo_reports USING btree (tgl_pembuatan DESC);


--
-- TOC entry 4902 (class 1259 OID 16870)
-- Name: idx_bo_thresholds_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bo_thresholds_pid ON public.bo_product_thresholds USING btree (product_id);


--
-- TOC entry 4858 (class 1259 OID 16753)
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- TOC entry 4859 (class 1259 OID 16751)
-- Name: idx_sessions_refresh_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_refresh_token ON public.sessions USING btree (refresh_token);


--
-- TOC entry 4860 (class 1259 OID 16752)
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- TOC entry 4915 (class 2620 OID 16877)
-- Name: activity_logs trg_activity_logs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_activity_logs_updated_at BEFORE UPDATE ON public.activity_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4916 (class 2620 OID 16812)
-- Name: bk_products trg_bk_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_bk_products_updated_at BEFORE UPDATE ON public.bk_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4914 (class 2620 OID 16876)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 4908 (class 2606 OID 16778)
-- Name: bk_product_materials bk_product_materials_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_materials
    ADD CONSTRAINT bk_product_materials_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.bk_products(id) ON DELETE CASCADE;


--
-- TOC entry 4909 (class 2606 OID 16790)
-- Name: bk_product_rendemen bk_product_rendemen_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_product_rendemen
    ADD CONSTRAINT bk_product_rendemen_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.bk_products(id) ON DELETE CASCADE;


--
-- TOC entry 4910 (class 2606 OID 16803)
-- Name: bk_reports bk_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bk_reports
    ADD CONSTRAINT bk_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4911 (class 2606 OID 16833)
-- Name: bo_product_materials bo_product_materials_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_materials
    ADD CONSTRAINT bo_product_materials_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.bo_products(id) ON DELETE CASCADE;


--
-- TOC entry 4912 (class 2606 OID 16847)
-- Name: bo_product_thresholds bo_product_thresholds_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_product_thresholds
    ADD CONSTRAINT bo_product_thresholds_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.bo_products(id) ON DELETE CASCADE;


--
-- TOC entry 4913 (class 2606 OID 16862)
-- Name: bo_reports bo_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bo_reports
    ADD CONSTRAINT bo_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4907 (class 2606 OID 16736)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-08-05 15:29:00

--
-- PostgreSQL database dump complete
--

\unrestrict TWgnw9tEXcxoHMpdXfJ2QICnY042hdcLw9uUzHa481Qy0W7m4M9YIKjValBGthR

INSERT INTO users (username, full_name, password, role, is_active)
VALUES (
    'admin',
    'Administrator',
    '$2b$12$cnC4PghxwwqOdXY0sNXBx.QAGU0kwO38byC9PpK5nO4nTej6n9nJC', -- admin123
    'admin',
    true
)
ON CONFLICT (username) DO NOTHING;

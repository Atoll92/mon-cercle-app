

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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."clean_old_opengraph_cache"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.opengraph_cache
  WHERE updated_at < NOW() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."clean_old_opengraph_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_fake_profiles"("num_profiles" integer DEFAULT 50) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_record RECORD;
  fake_full_name text;
  fake_contact_email text;
  fake_bio text;
  fake_profile_picture_url text;
  fake_portfolio_url text;
  fake_linkedin_url text;
  fake_skills text[];
  
  first_names text[] := ARRAY['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Emma', 'William', 'Olivia', 
                              'James', 'Sophia', 'Daniel', 'Ava', 'Matthew', 'Isabella', 'Joseph', 'Mia', 'Christopher', 'Charlotte',
                              'Andrew', 'Amelia', 'Ethan', 'Harper', 'Joshua', 'Evelyn', 'Alexander', 'Abigail', 'Ryan', 'Elizabeth'];
  
  last_names text[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                              'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                              'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
  
  domains text[] := ARRAY['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com', 'aol.com', 'icloud.com', 'fastmail.com'];
  
  bio_templates text[] := ARRAY[
    'Experienced professional with %s years in the industry. Passionate about %s and %s.',
    'Dedicated %s with a background in %s. Skilled in %s and %s.',
    'Creative %s focused on %s. Previously worked at %s for %s years.',
    'Results-driven %s specializing in %s. Loves %s and %s.',
    'Innovative %s with expertise in %s. Graduated from %s with honors.'
  ];
  
  professions text[] := ARRAY['developer', 'designer', 'marketer', 'project manager', 'data scientist', 'product manager', 
                              'consultant', 'researcher', 'analyst', 'engineer', 'architect', 'strategist'];
BEGIN
  -- Function logic for generating profiles goes here
  -- Ensure to close the function properly
END;
$$;


ALTER FUNCTION "public"."generate_fake_profiles"("num_profiles" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_fake_users"("num_users" integer DEFAULT 50) RETURNS SETOF "uuid"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  i INTEGER;
  fake_id uuid;
  first_names text[] := ARRAY['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Emma', 'William', 'Olivia', 
                              'James', 'Sophia', 'Daniel', 'Ava', 'Matthew', 'Isabella', 'Joseph', 'Mia', 'Christopher', 'Charlotte',
                              'Andrew', 'Amelia', 'Ethan', 'Harper', 'Joshua', 'Evelyn', 'Alexander', 'Abigail', 'Ryan', 'Elizabeth'];
  
  last_names text[] := ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                              'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                              'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];
  
  domains text[] := ARRAY['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com', 'aol.com', 'icloud.com', 'fastmail.com'];
  
  fake_full_name text;
  fake_email text;
BEGIN
  FOR i IN 1..num_users LOOP
    fake_id := gen_random_uuid();
    fake_full_name := first_names[1 + floor(random() * array_length(first_names, 1))::int] || ' ' || 
                      last_names[1 + floor(random() * array_length(last_names, 1))::int];
    
    fake_email := lower(regexp_replace(split_part(fake_full_name, ' ', 1), '[^a-zA-Z0-9]', '', 'g')) || 
                 '.' || 
                 lower(regexp_replace(split_part(fake_full_name, ' ', 2), '[^a-zA-Z0-9]', '', 'g')) || 
                 floor(random() * 1000)::text || 
                 '@' || 
                 domains[1 + floor(random() * array_length(domains, 1))::int];
                 
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    ) VALUES (
      fake_id,
      fake_email,
      '$2a$10$fakehashedfakehashedfakehashedfakehashedfakehashedfak',
      now(),
      now(),
      now()
    );
    
    RETURN NEXT fake_id;
  END LOOP;
  
  RETURN;
END;
$_$;


ALTER FUNCTION "public"."generate_fake_users"("num_users" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_slug"("input_text" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result TEXT;
BEGIN
  -- Convert to lowercase
  result := lower(input_text);
  
  -- Replace spaces with hyphens
  result := regexp_replace(result, '\s+', '-', 'g');
  
  -- Remove special characters
  result := regexp_replace(result, '[^a-z0-9\-]', '', 'g');
  
  -- Remove multiple consecutive hyphens
  result := regexp_replace(result, '-+', '-', 'g');
  
  -- Remove leading and trailing hyphens
  result := trim(both '-' from result);
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."generate_slug"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_personal_moodboard_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.is_personal = true AND NEW.permissions IS NULL THEN
    NEW.permissions := 'personal';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_personal_moodboard_defaults"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_modified_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."direct_conversations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "participants" "uuid"[] NOT NULL
);


ALTER TABLE "public"."direct_conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."direct_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "conversation_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "read_at" timestamp with time zone,
    "recipient_id" "uuid"
);


ALTER TABLE "public"."direct_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_participations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "status" character varying(20) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "event_participations_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['attending'::character varying, 'maybe'::character varying, 'declined'::character varying])::"text"[])))
);


ALTER TABLE "public"."event_participations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "network_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    CONSTRAINT "invitations_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text"]))),
    CONSTRAINT "invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text"])))
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


COMMENT ON TABLE "public"."invitations" IS 'Stores invitations sent to users to join a network.';



COMMENT ON COLUMN "public"."invitations"."network_id" IS 'The network the invitee is invited to join.';



COMMENT ON COLUMN "public"."invitations"."email" IS 'Email of the person being invited.';



COMMENT ON COLUMN "public"."invitations"."status" IS 'Current status of the invitation (pending, accepted, etc.).';



COMMENT ON COLUMN "public"."invitations"."invited_by" IS 'The user ID of the person who sent the invitation.';



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "network_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moodboard_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "moodboard_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "content" "text" NOT NULL,
    "title" "text",
    "x" double precision DEFAULT 0 NOT NULL,
    "y" double precision DEFAULT 0 NOT NULL,
    "width" double precision DEFAULT 200 NOT NULL,
    "height" double precision DEFAULT 200 NOT NULL,
    "rotation" double precision DEFAULT 0,
    "zIndex" integer DEFAULT 0,
    "textColor" "text",
    "backgroundColor" "text",
    "font_family" "text",
    "font_size" "text",
    "font_weight" "text",
    "text_align" "text",
    "line_height" "text",
    "opacity" double precision DEFAULT 1,
    "border_radius" double precision DEFAULT 0,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_type" CHECK (("type" = ANY (ARRAY['image'::"text", 'text'::"text", 'video'::"text", 'link'::"text"])))
);


ALTER TABLE "public"."moodboard_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moodboards" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "network_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "permissions" "text" DEFAULT 'private'::"text" NOT NULL,
    "background_color" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_personal" boolean DEFAULT false,
    CONSTRAINT "valid_permissions" CHECK (("permissions" = ANY (ARRAY['personal'::"text", 'private'::"text", 'collaborative'::"text", 'public'::"text"])))
);


ALTER TABLE "public"."moodboards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."network_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "location" "text" NOT NULL,
    "description" "text",
    "capacity" integer,
    "network_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "cover_image_url" "text",
    "coordinates" "jsonb",
    "event_link" "text"
);


ALTER TABLE "public"."network_events" OWNER TO "postgres";


COMMENT ON COLUMN "public"."network_events"."event_link" IS 'URL to external event page, registration form, or virtual meeting';



CREATE TABLE IF NOT EXISTS "public"."network_files" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "network_id" "uuid" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "filename" "text" NOT NULL,
    "filepath" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_size" bigint NOT NULL,
    "file_type" "text",
    "description" "text",
    "download_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."network_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."network_news" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text",
    "content" "text",
    "network_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."network_news" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."networks" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "theme_bg_color" character varying(7) DEFAULT '#ffffff'::character varying,
    "logo_url" "text",
    "created_by" "text",
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "subscription_status" "text" DEFAULT 'free'::"text",
    "subscription_plan" "text" DEFAULT 'community'::"text",
    "subscription_end_date" timestamp with time zone,
    "subscription_start_date" timestamp with time zone,
    "subscription_updated_at" timestamp with time zone,
    "last_payment_date" timestamp with time zone,
    "last_invoice_id" "text",
    "background_image_url" "text"
);


ALTER TABLE "public"."networks" OWNER TO "postgres";


COMMENT ON TABLE "public"."networks" IS 'Stores information about different closed networks created within the application.';



COMMENT ON COLUMN "public"."networks"."id" IS 'Primary key, unique identifier for each network.';



COMMENT ON COLUMN "public"."networks"."name" IS 'The human-readable name of the network.';



COMMENT ON COLUMN "public"."networks"."description" IS 'Optional longer description of the network.';



COMMENT ON COLUMN "public"."networks"."created_at" IS 'The date and time when the network was first created.';



COMMENT ON COLUMN "public"."networks"."theme_bg_color" IS 'Background color for the network theme in hex format (#RRGGBB)';



COMMENT ON COLUMN "public"."networks"."logo_url" IS 'URL to the network logo image stored in Supabase storage';



COMMENT ON COLUMN "public"."networks"."background_image_url" IS 'network landing page header';



CREATE TABLE IF NOT EXISTS "public"."opengraph_cache" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "url" "text" NOT NULL,
    "data" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."opengraph_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."portfolio_items" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "title" "text",
    "description" "text",
    "url" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."portfolio_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."portfolio_items" IS 'Stores structured portfolio items linked to user profiles.';



COMMENT ON COLUMN "public"."portfolio_items"."profile_id" IS 'References the profile this portfolio item belongs to.';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "network_id" "uuid",
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "full_name" "text",
    "contact_email" "text",
    "bio" "text",
    "portfolio_data" "jsonb",
    "profile_picture_url" "text",
    "updated_at" timestamp with time zone,
    "portfolio_url" "text",
    "linkedin_url" "text",
    "skills" "text"[],
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Stores user profile information, linking auth users to networks and roles.';



COMMENT ON COLUMN "public"."profiles"."id" IS 'User ID, references the user in auth.users.';



COMMENT ON COLUMN "public"."profiles"."network_id" IS 'The network this user belongs to.';



COMMENT ON COLUMN "public"."profiles"."role" IS 'User role within the network (admin or member).';



COMMENT ON COLUMN "public"."profiles"."portfolio_data" IS 'JSONB field for storing unstructured portfolio information.';



COMMENT ON COLUMN "public"."profiles"."updated_at" IS 'Timestamp of the last profile modification.';



COMMENT ON COLUMN "public"."profiles"."portfolio_url" IS 'URL to the user''s portfolio site';



COMMENT ON COLUMN "public"."profiles"."linkedin_url" IS 'URL to the user''s LinkedIn profile';



CREATE TABLE IF NOT EXISTS "public"."wiki_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "network_id" "uuid" NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."wiki_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "page_id" "uuid" NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_hidden" boolean DEFAULT false,
    "hidden_by" "uuid",
    "hidden_at" timestamp with time zone
);


ALTER TABLE "public"."wiki_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_page_categories" (
    "page_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL
);


ALTER TABLE "public"."wiki_page_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_page_permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "page_id" "uuid" NOT NULL,
    "role" character varying(50) NOT NULL,
    "profile_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."wiki_page_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_pages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "network_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "content" "text",
    "is_published" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_edited_by" "uuid",
    "views_count" integer DEFAULT 0
);


ALTER TABLE "public"."wiki_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wiki_revisions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "page_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "revision_number" integer NOT NULL,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "comment" character varying(255),
    "is_approved" boolean DEFAULT false,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone
);


ALTER TABLE "public"."wiki_revisions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."direct_conversations"
    ADD CONSTRAINT "direct_conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_participations"
    ADD CONSTRAINT "event_participations_event_id_profile_id_key" UNIQUE ("event_id", "profile_id");



ALTER TABLE ONLY "public"."event_participations"
    ADD CONSTRAINT "event_participations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moodboard_items"
    ADD CONSTRAINT "moodboard_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moodboards"
    ADD CONSTRAINT "moodboards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."network_events"
    ADD CONSTRAINT "network_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."network_files"
    ADD CONSTRAINT "network_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."network_news"
    ADD CONSTRAINT "network_news_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."networks"
    ADD CONSTRAINT "networks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opengraph_cache"
    ADD CONSTRAINT "opengraph_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opengraph_cache"
    ADD CONSTRAINT "opengraph_cache_url_key" UNIQUE ("url");



ALTER TABLE ONLY "public"."portfolio_items"
    ADD CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."direct_conversations"
    ADD CONSTRAINT "unique_participants" UNIQUE ("participants");



ALTER TABLE ONLY "public"."wiki_categories"
    ADD CONSTRAINT "wiki_categories_network_id_slug_key" UNIQUE ("network_id", "slug");



ALTER TABLE ONLY "public"."wiki_categories"
    ADD CONSTRAINT "wiki_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wiki_comments"
    ADD CONSTRAINT "wiki_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wiki_page_categories"
    ADD CONSTRAINT "wiki_page_categories_pkey" PRIMARY KEY ("page_id", "category_id");



ALTER TABLE ONLY "public"."wiki_page_permissions"
    ADD CONSTRAINT "wiki_page_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wiki_pages"
    ADD CONSTRAINT "wiki_pages_network_id_slug_key" UNIQUE ("network_id", "slug");



ALTER TABLE ONLY "public"."wiki_pages"
    ADD CONSTRAINT "wiki_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wiki_revisions"
    ADD CONSTRAINT "wiki_revisions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_direct_conversations_participants" ON "public"."direct_conversations" USING "gin" ("participants");



CREATE INDEX "idx_direct_messages_conversation_id" ON "public"."direct_messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_direct_messages_created_at" ON "public"."direct_messages" USING "btree" ("created_at");



CREATE INDEX "idx_direct_messages_sender_id" ON "public"."direct_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_event_participations_event_id" ON "public"."event_participations" USING "btree" ("event_id");



CREATE INDEX "idx_event_participations_profile_id" ON "public"."event_participations" USING "btree" ("profile_id");



CREATE INDEX "idx_moodboard_items_moodboard_id" ON "public"."moodboard_items" USING "btree" ("moodboard_id");



CREATE INDEX "idx_moodboards_created_by" ON "public"."moodboards" USING "btree" ("created_by");



CREATE INDEX "idx_moodboards_is_personal" ON "public"."moodboards" USING "btree" ("is_personal");



CREATE INDEX "idx_moodboards_network_id" ON "public"."moodboards" USING "btree" ("network_id");



CREATE INDEX "idx_network_events_coordinates" ON "public"."network_events" USING "gin" ("coordinates");



CREATE INDEX "idx_wiki_categories_network_id" ON "public"."wiki_categories" USING "btree" ("network_id");



CREATE INDEX "idx_wiki_comments_page_id" ON "public"."wiki_comments" USING "btree" ("page_id");



CREATE INDEX "idx_wiki_pages_network_id" ON "public"."wiki_pages" USING "btree" ("network_id");



CREATE INDEX "idx_wiki_pages_slug" ON "public"."wiki_pages" USING "btree" ("slug");



CREATE INDEX "idx_wiki_revisions_page_id" ON "public"."wiki_revisions" USING "btree" ("page_id");



CREATE INDEX "network_files_network_id_idx" ON "public"."network_files" USING "btree" ("network_id");



CREATE INDEX "network_files_uploaded_by_idx" ON "public"."network_files" USING "btree" ("uploaded_by");



CREATE INDEX "opengraph_cache_updated_at_idx" ON "public"."opengraph_cache" USING "btree" ("updated_at");



CREATE INDEX "opengraph_cache_url_idx" ON "public"."opengraph_cache" USING "btree" ("url");



CREATE OR REPLACE TRIGGER "on_profiles_updated" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "personal_moodboard_defaults" BEFORE INSERT ON "public"."moodboards" FOR EACH ROW EXECUTE FUNCTION "public"."set_personal_moodboard_defaults"();



CREATE OR REPLACE TRIGGER "set_timestamp" BEFORE UPDATE ON "public"."network_files" FOR EACH ROW EXECUTE FUNCTION "public"."update_modified_column"();



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."direct_conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."event_participations"
    ADD CONSTRAINT "event_participations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."network_events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_participations"
    ADD CONSTRAINT "event_participations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "fk_sender" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."moodboard_items"
    ADD CONSTRAINT "moodboard_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moodboard_items"
    ADD CONSTRAINT "moodboard_items_moodboard_id_fkey" FOREIGN KEY ("moodboard_id") REFERENCES "public"."moodboards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moodboards"
    ADD CONSTRAINT "moodboards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moodboards"
    ADD CONSTRAINT "moodboards_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."network_events"
    ADD CONSTRAINT "network_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."network_events"
    ADD CONSTRAINT "network_events_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id");



ALTER TABLE ONLY "public"."network_files"
    ADD CONSTRAINT "network_files_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."network_files"
    ADD CONSTRAINT "network_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."network_news"
    ADD CONSTRAINT "network_news_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."network_news"
    ADD CONSTRAINT "network_news_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id");



ALTER TABLE ONLY "public"."portfolio_items"
    ADD CONSTRAINT "portfolio_items_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id");



ALTER TABLE ONLY "public"."wiki_categories"
    ADD CONSTRAINT "wiki_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."wiki_categories"
    ADD CONSTRAINT "wiki_categories_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_comments"
    ADD CONSTRAINT "wiki_comments_hidden_by_fkey" FOREIGN KEY ("hidden_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wiki_comments"
    ADD CONSTRAINT "wiki_comments_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_comments"
    ADD CONSTRAINT "wiki_comments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wiki_page_categories"
    ADD CONSTRAINT "wiki_page_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."wiki_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_page_categories"
    ADD CONSTRAINT "wiki_page_categories_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_page_permissions"
    ADD CONSTRAINT "wiki_page_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wiki_page_permissions"
    ADD CONSTRAINT "wiki_page_permissions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_page_permissions"
    ADD CONSTRAINT "wiki_page_permissions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wiki_pages"
    ADD CONSTRAINT "wiki_pages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wiki_pages"
    ADD CONSTRAINT "wiki_pages_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wiki_pages"
    ADD CONSTRAINT "wiki_pages_network_id_fkey" FOREIGN KEY ("network_id") REFERENCES "public"."networks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wiki_revisions"
    ADD CONSTRAINT "wiki_revisions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wiki_revisions"
    ADD CONSTRAINT "wiki_revisions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."wiki_revisions"
    ADD CONSTRAINT "wiki_revisions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."wiki_pages"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all files in their network" ON "public"."network_files" USING (("network_id" IN ( SELECT "profiles"."network_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow network members to read messages" ON "public"."messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."network_id" = "messages"."network_id") AND ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Allow network members to send messages" ON "public"."messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."network_id" = "messages"."network_id") AND ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Anyone can view published wiki pages" ON "public"."wiki_pages" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Network admins can insert wiki pages" ON "public"."wiki_pages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."network_id" = "wiki_pages"."network_id") AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Network admins can update wiki pages" ON "public"."wiki_pages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."network_id" = "wiki_pages"."network_id") AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Network admins can view all participations in their network" ON "public"."event_participations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."profiles" "p"
     JOIN "public"."network_events" "e" ON (("p"."network_id" = "e"."network_id")))
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text") AND ("e"."id" = "event_participations"."event_id")))));



CREATE POLICY "Network admins can view all wiki pages" ON "public"."wiki_pages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."network_id" = "wiki_pages"."network_id") AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Network members can insert wiki pages" ON "public"."wiki_pages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("profiles"."network_id" = "wiki_pages"."network_id")))));



CREATE POLICY "OpenGraph cache is readable by everyone" ON "public"."opengraph_cache" FOR SELECT USING (true);



CREATE POLICY "OpenGraph cache is updatable by authenticated users" ON "public"."opengraph_cache" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "OpenGraph cache is updatable update by authenticated users" ON "public"."opengraph_cache" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Page creators can update their own unpublished pages" ON "public"."wiki_pages" FOR UPDATE USING ((("created_by" = "auth"."uid"()) AND ("is_published" = false)));



CREATE POLICY "Participants can update read_at" ON "public"."direct_messages" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "unnest"("direct_conversations"."participants") AS "unnest"
   FROM "public"."direct_conversations"
  WHERE ("direct_conversations"."id" = "direct_messages"."conversation_id")))) WITH CHECK (true);



CREATE POLICY "Participations are viewable by everyone" ON "public"."event_participations" FOR SELECT USING (true);



CREATE POLICY "Users can create conversations they're part of" ON "public"."direct_conversations" FOR INSERT WITH CHECK (("auth"."uid"() = ANY ("participants")));



CREATE POLICY "Users can delete their own files" ON "public"."network_files" FOR DELETE USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can manage their own participations" ON "public"."event_participations" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can send messages to their conversations" ON "public"."direct_messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."direct_conversations"
  WHERE (("direct_conversations"."id" = "direct_messages"."conversation_id") AND ("auth"."uid"() = ANY ("direct_conversations"."participants")))))));



CREATE POLICY "Users can update conversations they're part of" ON "public"."direct_conversations" FOR UPDATE USING (("auth"."uid"() = ANY ("participants")));



CREATE POLICY "Users can update their own files" ON "public"."network_files" FOR UPDATE USING (("uploaded_by" = "auth"."uid"()));



CREATE POLICY "Users can upload files to their network" ON "public"."network_files" FOR INSERT WITH CHECK ((("network_id" IN ( SELECT "profiles"."network_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND ("uploaded_by" = "auth"."uid"())));



CREATE POLICY "Users can view files in their network" ON "public"."network_files" FOR SELECT USING (("network_id" IN ( SELECT "profiles"."network_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view messages from their conversations" ON "public"."direct_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."direct_conversations"
  WHERE (("direct_conversations"."id" = "direct_messages"."conversation_id") AND ("auth"."uid"() = ANY ("direct_conversations"."participants"))))));



CREATE POLICY "Users can view their own conversations" ON "public"."direct_conversations" FOR SELECT USING (("auth"."uid"() = ANY ("participants")));



CREATE POLICY "admin_moodboards_policy" ON "public"."moodboards" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"text") OR ("profiles"."id" = "moodboards"."created_by"))))));



CREATE POLICY "delete_moodboard_items_policy" ON "public"."moodboard_items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."moodboards"
  WHERE (("moodboards"."id" = "moodboard_items"."moodboard_id") AND (("moodboards"."created_by" = "auth"."uid"()) OR ("moodboard_items"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."network_id" = "moodboards"."network_id")))) OR (("moodboards"."permissions" = 'collaborative'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."network_id" = ( SELECT "moodboards_1"."network_id"
                   FROM "public"."moodboards" "moodboards_1"
                  WHERE ("moodboards_1"."id" = "moodboard_items"."moodboard_id"))))))))))));



CREATE POLICY "delete_own_moodboards_policy" ON "public"."moodboards" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "delete_personal_moodboards_policy" ON "public"."moodboards" FOR DELETE USING ((("is_personal" = true) AND ("created_by" = "auth"."uid"())));



ALTER TABLE "public"."direct_conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."direct_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_participations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_moodboard_items_policy" ON "public"."moodboard_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."moodboards"
  WHERE (("moodboards"."id" = "moodboard_items"."moodboard_id") AND (("moodboards"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."network_id" = "moodboards"."network_id")))) OR (("moodboards"."permissions" = 'collaborative'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."network_id" = ( SELECT "moodboards_1"."network_id"
                   FROM "public"."moodboards" "moodboards_1"
                  WHERE ("moodboards_1"."id" = "moodboard_items"."moodboard_id"))))))))))));



CREATE POLICY "insert_moodboards_policy" ON "public"."moodboards" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."network_id" = "moodboards"."network_id")))));



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moodboard_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moodboards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."network_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opengraph_cache" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_moodboard_items_policy" ON "public"."moodboard_items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."moodboards"
  WHERE (("moodboards"."id" = "moodboard_items"."moodboard_id") AND (("moodboards"."created_by" = "auth"."uid"()) OR ("moodboard_items"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."network_id" = "moodboards"."network_id")))) OR (("moodboards"."permissions" = 'collaborative'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."network_id" = ( SELECT "moodboards_1"."network_id"
                   FROM "public"."moodboards" "moodboards_1"
                  WHERE ("moodboards_1"."id" = "moodboard_items"."moodboard_id"))))))))))));



CREATE POLICY "update_own_moodboards_policy" ON "public"."moodboards" FOR UPDATE USING (("created_by" = "auth"."uid"())) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "update_personal_moodboards_policy" ON "public"."moodboards" FOR UPDATE USING ((("is_personal" = true) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "view_collaborative_moodboards_policy" ON "public"."moodboards" FOR SELECT USING ((("permissions" = 'collaborative'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."network_id" = "moodboards"."network_id"))))));



CREATE POLICY "view_moodboard_items_policy" ON "public"."moodboard_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."moodboards"
  WHERE (("moodboards"."id" = "moodboard_items"."moodboard_id") AND (("moodboards"."permissions" = 'public'::"text") OR ("moodboards"."created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text") AND ("profiles"."network_id" = "moodboards"."network_id")))) OR (("moodboards"."permissions" = 'collaborative'::"text") AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."network_id" = ( SELECT "moodboards_1"."network_id"
                   FROM "public"."moodboards" "moodboards_1"
                  WHERE ("moodboards_1"."id" = "moodboard_items"."moodboard_id"))))))))))));



CREATE POLICY "view_personal_moodboards_policy" ON "public"."moodboards" FOR SELECT USING ((("is_personal" = true) AND ("created_by" = "auth"."uid"())));



CREATE POLICY "view_public_moodboards_policy" ON "public"."moodboards" FOR SELECT USING (("permissions" = 'public'::"text"));



ALTER TABLE "public"."wiki_pages" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."direct_conversations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."direct_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."clean_old_opengraph_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_old_opengraph_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_old_opengraph_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_fake_profiles"("num_profiles" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_fake_profiles"("num_profiles" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_fake_profiles"("num_profiles" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_fake_users"("num_users" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_fake_users"("num_users" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_fake_users"("num_users" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_slug"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("input_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_personal_moodboard_defaults"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_personal_moodboard_defaults"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_personal_moodboard_defaults"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_modified_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."direct_conversations" TO "anon";
GRANT ALL ON TABLE "public"."direct_conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."direct_conversations" TO "service_role";



GRANT ALL ON TABLE "public"."direct_messages" TO "anon";
GRANT ALL ON TABLE "public"."direct_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."direct_messages" TO "service_role";



GRANT ALL ON TABLE "public"."event_participations" TO "anon";
GRANT ALL ON TABLE "public"."event_participations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_participations" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."moodboard_items" TO "anon";
GRANT ALL ON TABLE "public"."moodboard_items" TO "authenticated";
GRANT ALL ON TABLE "public"."moodboard_items" TO "service_role";



GRANT ALL ON TABLE "public"."moodboards" TO "anon";
GRANT ALL ON TABLE "public"."moodboards" TO "authenticated";
GRANT ALL ON TABLE "public"."moodboards" TO "service_role";



GRANT ALL ON TABLE "public"."network_events" TO "anon";
GRANT ALL ON TABLE "public"."network_events" TO "authenticated";
GRANT ALL ON TABLE "public"."network_events" TO "service_role";



GRANT ALL ON TABLE "public"."network_files" TO "anon";
GRANT ALL ON TABLE "public"."network_files" TO "authenticated";
GRANT ALL ON TABLE "public"."network_files" TO "service_role";



GRANT ALL ON TABLE "public"."network_news" TO "anon";
GRANT ALL ON TABLE "public"."network_news" TO "authenticated";
GRANT ALL ON TABLE "public"."network_news" TO "service_role";



GRANT ALL ON TABLE "public"."networks" TO "anon";
GRANT ALL ON TABLE "public"."networks" TO "authenticated";
GRANT ALL ON TABLE "public"."networks" TO "service_role";



GRANT ALL ON TABLE "public"."opengraph_cache" TO "anon";
GRANT ALL ON TABLE "public"."opengraph_cache" TO "authenticated";
GRANT ALL ON TABLE "public"."opengraph_cache" TO "service_role";



GRANT ALL ON TABLE "public"."portfolio_items" TO "anon";
GRANT ALL ON TABLE "public"."portfolio_items" TO "authenticated";
GRANT ALL ON TABLE "public"."portfolio_items" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_categories" TO "anon";
GRANT ALL ON TABLE "public"."wiki_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_categories" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_comments" TO "anon";
GRANT ALL ON TABLE "public"."wiki_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_comments" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_page_categories" TO "anon";
GRANT ALL ON TABLE "public"."wiki_page_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_page_categories" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_page_permissions" TO "anon";
GRANT ALL ON TABLE "public"."wiki_page_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_page_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_pages" TO "anon";
GRANT ALL ON TABLE "public"."wiki_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_pages" TO "service_role";



GRANT ALL ON TABLE "public"."wiki_revisions" TO "anon";
GRANT ALL ON TABLE "public"."wiki_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."wiki_revisions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;

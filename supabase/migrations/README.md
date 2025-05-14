# Supabase Migrations

This directory contains SQL migrations for the Supabase database.

## Running Migrations

To apply a migration to your Supabase project, you have several options:

### Option 1: Using the Supabase CLI

1. Make sure you have the Supabase CLI installed:
   ```bash
   npm install -g supabase
   ```

2. Login to your Supabase account:
   ```bash
   supabase login
   ```

3. Link your project (if not already linked):
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run the migration:
   ```bash
   supabase db push
   ```

### Option 2: Using the Supabase SQL Editor

1. Open the Supabase dashboard and navigate to your project
2. Go to the SQL Editor
3. Copy the content of the migration file
4. Paste it into the SQL Editor
5. Run the SQL

## Latest Migration

### News Images - 20250515_add_news_images.sql

This migration adds image support to the network news posts by:

1. Adding new columns to the `network_news` table:
   - `image_url`: Stores the URL to the uploaded image
   - `image_caption`: Stores an optional caption for the image

2. Creating necessary indexes for performance:
   - Index on `network_id` for faster filtering
   - Index on `created_at` for faster sorting

3. Setting up storage policies:
   - Ensures the `networks` storage bucket exists
   - Adds policies for uploading and reading images

To apply this migration manually using the SQL Editor, run the SQL script in:
`20250515_add_news_images.sql`

## After Migration

Once you've run the migration, the updated components in the application will automatically use the new columns to display and manage news post images.
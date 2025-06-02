-- Add network categories for organizing posts and news
-- Migration file: 20250603000000_add_network_categories.sql

-- Create network_categories table
CREATE TABLE IF NOT EXISTS public.network_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  network_id uuid REFERENCES public.networks(id) ON DELETE CASCADE NOT NULL,
  name varchar(100) NOT NULL,
  slug varchar(100) NOT NULL,
  description text,
  color varchar(7), -- Hex color for UI display
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_network_category_slug UNIQUE (network_id, slug)
);

-- Add category_id to network_news table
ALTER TABLE public.network_news 
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.network_categories(id) ON DELETE SET NULL;

-- Add category_id to portfolio_items table  
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.network_categories(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_network_categories_network_id ON public.network_categories(network_id);
CREATE INDEX IF NOT EXISTS idx_network_categories_slug ON public.network_categories(slug);
CREATE INDEX IF NOT EXISTS idx_network_categories_is_active ON public.network_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_network_news_category_id ON public.network_news(category_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_category_id ON public.portfolio_items(category_id);

-- Add RLS policies for network_categories
ALTER TABLE public.network_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Network members can view categories in their network
CREATE POLICY "network_categories_viewable_by_network_members" ON public.network_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_categories.network_id
    )
  );

-- Policy: Only network admins can create categories
CREATE POLICY "network_categories_insertable_by_admins" ON public.network_categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_categories.network_id
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only network admins can update categories
CREATE POLICY "network_categories_updatable_by_admins" ON public.network_categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_categories.network_id
      AND profiles.role = 'admin'
    )
  );

-- Policy: Only network admins can delete categories
CREATE POLICY "network_categories_deletable_by_admins" ON public.network_categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.network_id = network_categories.network_id
      AND profiles.role = 'admin'
    )
  );

-- Add trigger to update updated_at
CREATE TRIGGER update_network_categories_updated_at
  BEFORE UPDATE ON public.network_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add comments
COMMENT ON TABLE public.network_categories IS 'Categories for organizing network content (news and portfolio items)';
COMMENT ON COLUMN public.network_categories.slug IS 'URL-friendly category identifier';
COMMENT ON COLUMN public.network_categories.color IS 'Hex color code for UI display';
COMMENT ON COLUMN public.network_categories.sort_order IS 'Display order for category lists';
COMMENT ON COLUMN public.network_news.category_id IS 'Optional category for organizing news posts';
COMMENT ON COLUMN public.portfolio_items.category_id IS 'Optional category for organizing portfolio items';

-- Create default categories for existing networks
INSERT INTO public.network_categories (network_id, name, slug, description, color, sort_order, created_by)
SELECT DISTINCT 
  n.id,
  'General',
  'general', 
  'General news and updates',
  '#6366f1',
  0,
  (SELECT id FROM public.profiles WHERE network_id = n.id AND role = 'admin' LIMIT 1)
FROM public.networks n
WHERE NOT EXISTS (
  SELECT 1 FROM public.network_categories nc 
  WHERE nc.network_id = n.id AND nc.slug = 'general'
);
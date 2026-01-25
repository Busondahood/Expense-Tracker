# Supabase Setup Guide

Run the following SQL commands in your Supabase Project's SQL Editor to set up the necessary database table and storage bucket.

### 1. Create Transactions Table

```sql
-- Create the table
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  category text not null,
  slip_url text,
  description text
);

-- Enable Row Level Security (RLS) - Optional for public demo, but recommended
alter table transactions enable row level security;

-- Create a policy that allows everyone to read/write (FOR DEMO ONLY)
-- In a real app, you would restrict this to authenticated users
create policy "Public Access" 
on transactions for all 
using (true) 
with check (true);
```

### 2. Configure Storage Bucket for Slips

```sql
-- Create a new storage bucket called 'slips'
insert into storage.buckets (id, name, public) 
values ('slips', 'slips', true);

-- Policy to allow public uploads to 'slips' bucket (FOR DEMO ONLY)
create policy "Public Uploads" 
on storage.objects for insert 
with check ( bucket_id = 'slips' );

-- Policy to allow public viewing of slips
create policy "Public Select" 
on storage.objects for select 
using ( bucket_id = 'slips' );
```

### 3. Environment Variables

Create a `.env` file in your project root (if using Vite) and add your keys:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Installation

Install the required dependency:

```bash
npm install @supabase/supabase-js lucide-react
```

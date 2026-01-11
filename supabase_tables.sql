-- Supabase 테이블 생성 SQL
-- 이 SQL을 Supabase Dashboard의 SQL Editor에서 실행하세요

-- 1. inquiries 테이블 생성 (문의하기)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. donation_receipts 테이블 생성 (기부금 영수증)
CREATE TABLE IF NOT EXISTS donation_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS (Row Level Security) 정책 설정
-- anon 사용자도 INSERT할 수 있도록 설정
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_receipts ENABLE ROW LEVEL SECURITY;

-- inquiries 테이블 정책
CREATE POLICY "Allow public insert on inquiries"
  ON inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- donation_receipts 테이블 정책
CREATE POLICY "Allow public insert on donation_receipts"
  ON donation_receipts
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 인덱스 추가 (선택사항, 성능 향상)
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_donation_receipts_created_at ON donation_receipts(created_at);

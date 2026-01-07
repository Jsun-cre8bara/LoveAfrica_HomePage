import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Supabase 클라이언트 생성
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Storage 버킷 초기화
const BUCKET_NAME = 'make-5f047ca7-notices';

async function initializeStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
      
      if (error) {
        console.error('Failed to create bucket:', error);
      } else {
        console.log('Storage bucket created:', BUCKET_NAME);
      }
    }
  } catch (err) {
    console.error('Storage initialization error:', err);
  }
}

// 서버 시작 시 스토리지 초기화
initializeStorage();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-5f047ca7/health", (c) => {
  return c.json({ status: "ok" });
});

// 관리자 회원가입 (최초 1회만 실행)
app.post("/make-server-5f047ca7/admin/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'admin' },
      // 자동으로 이메일 확인 (이메일 서버 미설정)
      email_confirm: true
    });

    if (error) {
      console.error('Admin signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ success: true, user: data.user });
  } catch (err: any) {
    console.error('Admin signup exception:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 관리자 로그인 (클라이언트에서 Supabase Auth 사용)
// 이 엔드포인트는 필요 없지만, 서버에서 사용자 확인용으로 사용 가능

// 공지사항 목록 조회
app.get("/make-server-5f047ca7/notices", async (c) => {
  try {
    const notices = await kv.getByPrefix('notice:');
    
    // 데이터가 없으면 초기 데이터 생성
    if (notices.length === 0) {
      const initialNotices = [
        { id: '1', date: '2025.01.03', title: '2025년 새해 인사 및 후원 안내', views: 124 },
        { id: '2', date: '2024.12.28', title: '연말 특별 후원 캠페인', views: 256 },
        { id: '3', date: '2024.12.20', title: '아프리카 학교 건립 프로젝트 완료', views: 189 },
        { id: '4', date: '2024.12.15', title: '겨울철 긴급 구호물품 전달', views: 203 },
        { id: '5', date: '2024.12.10', title: '후원금 사용 내역 공개', views: 312 },
      ];

      for (const notice of initialNotices) {
        await kv.set(`notice:${notice.id}`, notice);
      }

      return c.json({ notices: initialNotices });
    }
    
    // 날짜 순으로 정렬 (최신순)
    const sortedNotices = notices.sort((a, b) => {
      const dateA = new Date(a.date.replace(/\./g, '-'));
      const dateB = new Date(b.date.replace(/\./g, '-'));
      return dateB.getTime() - dateA.getTime();
    });

    return c.json({ notices: sortedNotices });
  } catch (err: any) {
    console.error('Get notices error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 공지사항 생성 (관리자만)
app.post("/make-server-5f047ca7/notices", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    console.log('POST /notices - Authorization header:', c.req.header('Authorization')?.substring(0, 50) + '...');
    
    if (!accessToken) {
      console.error('No access token provided');
      return c.json({ error: 'No access token provided' }, 401);
    }

    // 관리자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('Auth check result:', { user: user?.id, error: authError?.message });
    
    if (!user || authError) {
      console.error('Unauthorized:', authError);
      return c.json({ error: 'Unauthorized: ' + (authError?.message || 'No user') }, 401);
    }

    const { title, content, date, views = 0, attachments = [] } = await c.req.json();
    const id = Date.now().toString();
    
    const notice = {
      id,
      title,
      content,
      date,
      views,
      attachments,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`notice:${id}`, notice);
    console.log('Notice created:', notice.id);

    return c.json({ success: true, notice });
  } catch (err: any) {
    console.error('Create notice error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 공지사항 수정 (관리자만)
app.put("/make-server-5f047ca7/notices/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    console.log('PUT /notices/:id - Authorization header:', c.req.header('Authorization')?.substring(0, 50) + '...');
    
    if (!accessToken) {
      console.error('No access token provided');
      return c.json({ error: 'No access token provided' }, 401);
    }

    // 관리자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('Auth check result:', { user: user?.id, error: authError?.message });
    
    if (!user || authError) {
      console.error('Unauthorized:', authError);
      return c.json({ error: 'Unauthorized: ' + (authError?.message || 'No user') }, 401);
    }

    const id = c.req.param('id');
    const { title, content, date, views, attachments } = await c.req.json();

    const existingNotice = await kv.get(`notice:${id}`);
    if (!existingNotice) {
      console.error('Notice not found:', id);
      return c.json({ error: 'Notice not found' }, 404);
    }

    const updatedNotice = {
      ...existingNotice,
      title,
      content,
      date,
      views,
      attachments,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`notice:${id}`, updatedNotice);
    console.log('Notice updated:', id);

    return c.json({ success: true, notice: updatedNotice });
  } catch (err: any) {
    console.error('Update notice error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 공지사항 삭제 (관리자만)
app.delete("/make-server-5f047ca7/notices/:id", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    console.log('DELETE /notices/:id - Authorization header:', c.req.header('Authorization')?.substring(0, 50) + '...');
    
    if (!accessToken) {
      console.error('No access token provided');
      return c.json({ error: 'No access token provided' }, 401);
    }

    // 관리자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    console.log('Auth check result:', { user: user?.id, error: authError?.message });
    
    if (!user || authError) {
      console.error('Unauthorized:', authError);
      return c.json({ error: 'Unauthorized: ' + (authError?.message || 'No user') }, 401);
    }

    const id = c.req.param('id');
    await kv.del(`notice:${id}`);
    console.log('Notice deleted:', id);

    return c.json({ success: true });
  } catch (err: any) {
    console.error('Delete notice error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 파일 업로드 (관리자만)
app.post("/make-server-5f047ca7/upload", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.error('No access token provided');
      return c.json({ error: 'No access token provided' }, 401);
    }

    // 관리자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (!user || authError) {
      console.error('Unauthorized:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    
    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return c.json({ error: error.message }, 500);
    }

    // Signed URL 생성 (7일 유효)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1년 유효

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return c.json({ error: signedUrlError.message }, 500);
    }

    console.log('File uploaded:', fileName);

    return c.json({
      success: true,
      attachment: {
        name: file.name,
        url: signedUrlData.signedUrl,
        type: file.type,
        size: file.size,
      },
    });
  } catch (err: any) {
    console.error('Upload exception:', err);
    return c.json({ error: err.message }, 500);
  }
});

Deno.serve(app.fetch);
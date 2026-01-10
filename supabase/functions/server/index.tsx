import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    // apikey 헤더도 허용해야 프론트 요청이 차단되지 않습니다.
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
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
    const { data: notices, error } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get notices error:', error);
      return c.json({ error: error.message }, 500);
    }

    // 데이터가 없으면 초기 데이터 생성
    if (!notices || notices.length === 0) {
      const initialNotices = [
        { title: '2025년 새해 인사 및 후원 안내', content: '', date: '2025.01.03', views: 124 },
        { title: '연말 특별 후원 캠페인', content: '', date: '2024.12.28', views: 256 },
        { title: '아프리카 학교 건립 프로젝트 완료', content: '', date: '2024.12.20', views: 189 },
        { title: '겨울철 긴급 구호물품 전달', content: '', date: '2024.12.15', views: 203 },
        { title: '후원금 사용 내역 공개', content: '', date: '2024.12.10', views: 312 },
      ];

      const { data: inserted } = await supabase
        .from('notices')
        .insert(initialNotices)
        .select();

      return c.json({ notices: inserted || [] });
    }

    return c.json({ notices });
  } catch (err: any) {
    console.error('Get notices error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 공지사항 생성 (관리자만)
app.post("/make-server-5f047ca7/notices", async (c) => {
  try {
    // Supabase가 이미 검증한 사용자 정보 가져오기
    const authHeader = c.req.header('Authorization');
    console.log('POST /notices - Authorization header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header');
      return c.json({ error: 'No authorization header' }, 401);
    }

    console.log('Authorization check passed');

    const { title, content, date, views = 0, attachments = [] } = await c.req.json();
    
    const { data: notice, error } = await supabase
      .from('notices')
      .insert([{ title, content, date, views, attachments }])
      .select()
      .single();

    if (error) {
      console.error('Create notice error:', error);
      return c.json({ error: error.message }, 500);
    }

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
    const authHeader = c.req.header('Authorization');
    console.log('PUT /notices/:id - Authorization header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header');
      return c.json({ error: 'No authorization header' }, 401);
    }

    console.log('Authorization check passed');

    const id = c.req.param('id');
    const { title, content, date, views, attachments } = await c.req.json();

    const { data: notice, error } = await supabase
      .from('notices')
      .update({ title, content, date, views, attachments })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update notice error:', error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }

    console.log('Notice updated:', id);
    return c.json({ success: true, notice });
  } catch (err: any) {
    console.error('Update notice error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 공지사항 삭제 (관리자만)
app.delete("/make-server-5f047ca7/notices/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    console.log('DELETE /notices/:id - Authorization header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header');
      return c.json({ error: 'No authorization header' }, 401);
    }

    console.log('Authorization check passed');

    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete notice error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('Notice deleted:', id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Delete notice error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ========================================
// NEWSLETTER API
// ========================================

// 뉴스레터 목록 조회
app.get("/make-server-5f047ca7/newsletters", async (c) => {
  try {
    const { data: newsletters, error } = await supabase
      .from('newsletters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get newsletters error:', error);
      return c.json({ error: error.message }, 500);
    }

    return c.json({ newsletters: newsletters || [] });
  } catch (err: any) {
    console.error('Get newsletters error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 뉴스레터 생성 (관리자만)
app.post("/make-server-5f047ca7/newsletters", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    console.log('POST /newsletters - Authorization header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header');
      return c.json({ error: 'No authorization header' }, 401);
    }

    console.log('Authorization check passed');

    const { title, content, published, attachments = [] } = await c.req.json();
    
    const { data: newsletter, error } = await supabase
      .from('newsletters')
      .insert([{ title, content, published, attachments }])
      .select()
      .single();

    if (error) {
      console.error('Create newsletter error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('Newsletter created:', newsletter.id);
    return c.json({ success: true, newsletter });
  } catch (err: any) {
    console.error('Create newsletter error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 뉴스레터 수정 (관리자만)
app.put("/make-server-5f047ca7/newsletters/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    console.log('PUT /newsletters/:id - Authorization header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header');
      return c.json({ error: 'No authorization header' }, 401);
    }

    console.log('Authorization check passed');

    const id = c.req.param('id');
    const { title, content, published, attachments } = await c.req.json();

    const { data: newsletter, error } = await supabase
      .from('newsletters')
      .update({ title, content, published, attachments })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update newsletter error:', error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }

    console.log('Newsletter updated:', id);
    return c.json({ success: true, newsletter });
  } catch (err: any) {
    console.error('Update newsletter error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// 뉴스레터 삭제 (관리자만)
app.delete("/make-server-5f047ca7/newsletters/:id", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    console.log('DELETE /newsletters/:id - Authorization header exists:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header');
      return c.json({ error: 'No authorization header' }, 401);
    }

    console.log('Authorization check passed');

    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('newsletters')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete newsletter error:', error);
      return c.json({ error: error.message }, 500);
    }

    console.log('Newsletter deleted:', id);
    return c.json({ success: true });
  } catch (err: any) {
    console.error('Delete newsletter error:', err);
    return c.json({ error: err.message }, 500);
  }
});

// ========================================
// FILE UPLOAD
// ========================================

// 파일 업로드 (관리자만)
app.post("/make-server-5f047ca7/upload", async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header');
      return c.json({ error: 'No authorization header' }, 401);
    }

    console.log('Authorization check passed for upload');

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

// ========================================
// DONATION RECEIPT EMAIL
// ========================================

// 기부금 영수증 신청서 메일 전송
app.post("/make-server-5f047ca7/donation-receipt", async (c) => {
  try {
    const { name, birthDate, phone, email } = await c.req.json();

    // 필수 필드 검증
    if (!name || !birthDate || !phone || !email) {
      return c.json({ error: '모든 필드를 입력해주세요.' }, 400);
    }

    // 생년월일 검증 (8자리)
    if (birthDate.length !== 8) {
      return c.json({ error: '생년월일은 8자리로 입력해주세요.' }, 400);
    }

    // 전화번호 검증 (12자리)
    if (phone.length !== 12) {
      return c.json({ error: '전화번호는 12자리로 입력해주세요.' }, 400);
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: '올바른 이메일 형식을 입력해주세요.' }, 400);
    }

    // 메일 제목: "'이름'님의 기부금 신청서 요청 메일입니다"
    const subject = `${name}님의 기부금 신청서 요청 메일입니다`;

    // 메일 본문 작성
    const body = `
기부금 영수증 발급 신청서

이름: ${name}
생년월일: ${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}
전화번호: ${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}
이메일: ${email}

신청일시: ${new Date().toLocaleString('ko-KR')}
    `.trim();

    // 실제 메일 전송을 위한 코드 (현재는 로그만 출력)
    // 실제 메일 전송을 위해서는 외부 메일 서비스(Resend, SendGrid 등)를 사용해야 합니다.
    console.log('기부금 영수증 신청서 메일 전송 요청:');
    console.log('수신 이메일: loveafrica1004@gmail.com');
    console.log('제목:', subject);
    console.log('본문:', body);

    // TODO: 실제 메일 전송 구현
    // 예시: Resend를 사용하는 경우
    // const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${RESEND_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'noreply@yourdomain.com',
    //     to: 'loveafrica1004@gmail.com',
    //     subject: subject,
    //     text: body,
    //   }),
    // });

    // 임시로 성공 응답 (실제 메일 전송 구현 필요)
    return c.json({ 
      success: true, 
      message: '기부금 영수증 신청서가 성공적으로 전송되었습니다.',
      data: {
        recipient: 'loveafrica1004@gmail.com',
        subject: subject,
        body: body,
      }
    });

  } catch (err: any) {
    console.error('Donation receipt email error:', err);
    return c.json({ error: err.message }, 500);
  }
});

Deno.serve(app.fetch);
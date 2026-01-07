import { useState, useEffect } from 'react';
import { supabase, projectId, publicAnonKey } from '/src/lib/supabase';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MainContent } from './components/MainContent';
import { Footer } from './components/Footer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { NoticeEditor, Notice } from './components/NoticeEditor';
import { NoticeDetailModal } from './components/NoticeDetailModal';
import { AdminSetup } from './components/AdminSetup';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 세션 확인 및 공지사항 로드
  useEffect(() => {
    checkSession();
    loadNotices();
  }, []);

  // 세션 확인
  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      setIsAdmin(true);
      setAccessToken(session.access_token);
    }
  };

  // 공지사항 로드
  const loadNotices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5f047ca7/notices`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const data = await response.json();
      setNotices(data.notices || []);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 관리자 로그인
  const handleAdminLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.session?.access_token) {
      setIsAdmin(true);
      setAccessToken(data.session.access_token);
    }
  };

  // 관리자 로그아웃
  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAccessToken(null);
  };

  const handleAddNotice = () => {
    setEditingNotice(null);
    setIsEditorOpen(true);
  };

  const handleEditNotice = (notice: Notice) => {
    setEditingNotice(notice);
    setIsEditorOpen(true);
  };

  const handleViewNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDetailModalOpen(true);
  };

  // 공지사항 저장
  const handleSaveNotice = async (notice: Notice, files?: File[]) => {
    console.log('=== handleSaveNotice 시작 ===');
    console.log('isAdmin:', isAdmin);
    console.log('accessToken exists:', !!accessToken);
    console.log('accessToken value:', accessToken?.substring(0, 20) + '...');
    
    if (!accessToken) {
      console.error('No access token - 로그인이 필요합니다');
      alert('로그인이 필요합니다.');
      throw new Error('No access token');
    }

    try {
      console.log('Notice data:', JSON.stringify(notice, null, 2));
      console.log('Files to upload:', files?.length || 0);

      // 1. 파일 업로드
      let uploadedAttachments = notice.attachments || [];
      
      if (files && files.length > 0) {
        console.log('=== 파일 업로드 시작 ===');
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          console.log(`파일 ${i + 1}/${files.length}:`, {
            name: file.name,
            size: file.size,
            type: file.type
          });
          
          const formData = new FormData();
          formData.append('file', file);

          const uploadUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5f047ca7/upload`;
          console.log('Upload URL:', uploadUrl);

          const uploadResponse = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
            body: formData,
          });

          console.log('Upload response status:', uploadResponse.status);
          const uploadText = await uploadResponse.text();
          console.log('Upload response text:', uploadText);

          let uploadData;
          try {
            uploadData = JSON.parse(uploadText);
          } catch (e) {
            console.error('Upload response 파싱 실패:', e);
            throw new Error(`파일 업로드 응답 파싱 실패: ${uploadText}`);
          }

          if (!uploadResponse.ok) {
            console.error('Upload failed:', uploadData);
            throw new Error(`파일 업로드 실패: ${uploadData.error || uploadResponse.statusText}`);
          }

          console.log('Upload 성공:', uploadData);
          uploadedAttachments.push(uploadData.attachment);
        }
        
        console.log('=== 모든 파일 업로드 완료 ===');
      }

      // 2. 공지사항 저장
      const noticeToSave = {
        title: notice.title,
        content: notice.content || '',
        date: notice.date,
        views: notice.views || 0,
        attachments: uploadedAttachments,
      };

      const url = notice.id
        ? `https://${projectId}.supabase.co/functions/v1/make-server-5f047ca7/notices/${notice.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-5f047ca7/notices`;
      
      const method = notice.id ? 'PUT' : 'POST';

      console.log('=== 공지사항 저장 요청 ===');
      console.log('URL:', url);
      console.log('Method:', method);
      console.log('Data:', JSON.stringify(noticeToSave, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(noticeToSave),
      });

      console.log('Save response status:', response.status);
      const responseText = await response.text();
      console.log('Save response text:', responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Save response 파싱 실패:', e);
        throw new Error(`서버 응답 파싱 실패: ${responseText}`);
      }

      if (!response.ok) {
        console.error('Save failed:', responseData);
        throw new Error(responseData.error || `저장 실패 (${response.status})`);
      }

      console.log('=== 공지사항 저장 성공 ===');
      console.log('Saved notice:', responseData);
      
      await loadNotices();
      console.log('=== 공지사항 목록 새로고침 완료 ===');
    } catch (err: any) {
      console.error('=== 저장 에러 ===', err);
      console.error('Error stack:', err.stack);
      alert(`저장에 실패했습니다:\n${err.message}`);
      throw err;
    }
  };

  // 공지사항 삭제
  const handleDeleteNotice = async (id: string) => {
    if (!accessToken || !confirm('정말 삭제하시겠습니까?')) return;

    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-5f047ca7/notices/${id}`;
      console.log('Deleting notice:', { url, id });

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const responseData = await response.json();
      console.log('Delete response:', { status: response.status, data: responseData });

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to delete notice');
      }

      await loadNotices();
    } catch (err: any) {
      console.error('Delete notice error:', err);
      alert(`삭제에 실패했습니다: ${err.message}`);
    }
  };

  return (
    <div className="size-full">
      <Header 
        isAdmin={isAdmin}
        onAdminLogin={() => setIsLoginModalOpen(true)}
        onAdminLogout={handleAdminLogout}
      />
      <main>
        <Hero />
        <MainContent 
          notices={notices}
          isAdmin={isAdmin}
          onAddNotice={handleAddNotice}
          onEditNotice={handleEditNotice}
          onDeleteNotice={handleDeleteNotice}
          onViewNotice={handleViewNotice}
        />
      </main>
      <Footer />

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleAdminLogin}
      />

      <NoticeEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNotice(null);
        }}
        onSave={handleSaveNotice}
        editingNotice={editingNotice}
      />

      <NoticeDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedNotice(null);
        }}
        notice={selectedNotice}
      />

      <AdminSetup
        isAdmin={isAdmin}
      />
    </div>
  );
}
import { useState } from 'react';
import { projectId, publicAnonKey } from '/src/lib/supabase';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface AdminSetupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSetup({ isOpen, onClose }: AdminSetupProps) {
  if (!isOpen) return null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5f047ca7/admin/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ 관리자 계정이 생성되었습니다! 이제 로그인할 수 있습니다.');
        setEmail('');
        setPassword('');
        setName('');
      } else {
        setMessage(`❌ 오류: ${data.error}`);
      }
    } catch (err: any) {
      setMessage(`❌ 오류: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <Card className="relative w-full max-w-md p-6 shadow-xl bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">관리자 계정 생성</h3>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">닫기</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="관리자 이름"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder="최소 6자 이상"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? '생성 중...' : '관리자 계정 생성'}
          </Button>

          {message && (
            <div className={`text-sm p-2 rounded ${
              message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-4 pt-4 border-t text-xs text-gray-600">
          💡 최초 1회만 실행하세요. 계정 생성 후 일반 로그인을 사용하세요.
        </div>
      </Card>
    </div>
  );
}
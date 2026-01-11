import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { projectId, publicAnonKey } from '/src/lib/supabase';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InquiryModal({ isOpen, onClose }: InquiryModalProps) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = '이름을 입력해주세요.';
    if (!contact.trim()) newErrors.contact = '연락처를 입력해주세요.';

    if (!email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!message.trim()) newErrors.message = '문의 내용을 입력해주세요.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setName('');
    setContact('');
    setEmail('');
    setMessage('');
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5f047ca7/inquiries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: publicAnonKey,
          },
          body: JSON.stringify({
            name,
            contact,
            email,
            message,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || '문의 접수에 실패했습니다. 다시 시도해주세요.');
      }

      alert('문의가 접수되었습니다. 빠르게 답변드리겠습니다.');
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Inquiry submit error:', error);
      alert(error.message || '문의 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>문의하기</DialogTitle>
          <DialogDescription>
            후원 및 사업 관련 문의를 남겨주시면 메일로 답변드립니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inquiry-name">이름 *</Label>
            <Input
              id="inquiry-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="이름을 입력해주세요"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inquiry-contact">연락처 *</Label>
            <Input
              id="inquiry-contact"
              value={contact}
              onChange={(e) => {
                setContact(e.target.value);
                if (errors.contact) setErrors({ ...errors, contact: '' });
              }}
              placeholder="연락 가능한 번호 또는 메신저 아이디"
              aria-invalid={!!errors.contact}
            />
            {errors.contact && (
              <p className="text-sm text-red-500">{errors.contact}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inquiry-email">이메일 *</Label>
            <Input
              id="inquiry-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="example@email.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="inquiry-message">후원 문의 *</Label>
            <Textarea
              id="inquiry-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors({ ...errors, message: '' });
              }}
              rows={5}
              placeholder="문의 내용을 작성해주세요."
              aria-invalid={!!errors.message}
            />
            {errors.message && (
              <p className="text-sm text-red-500">{errors.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '전송 중...' : '보내기'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

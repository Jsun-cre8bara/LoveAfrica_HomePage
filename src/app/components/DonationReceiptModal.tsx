import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { projectId, publicAnonKey } from '/src/lib/supabase';

interface DonationReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DonationReceiptModal({ isOpen, onClose }: DonationReceiptModalProps) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 생년월일 포맷 (YYYYMMDD -> YYYY-MM-DD)
  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`;
  };

  // 생년월일 입력 핸들러
  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setBirthDate(value);
    if (errors.birthDate) {
      setErrors({ ...errors, birthDate: '' });
    }
  };

  // 전화번호 포맷 (숫자만, 최대 11자리)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setPhone(value);
    if (errors.phone) {
      setErrors({ ...errors, phone: '' });
    }
  };

  // 이메일 유효성 검사
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!birthDate.trim()) {
      newErrors.birthDate = '생년월일을 입력해주세요.';
    } else if (birthDate.length !== 8) {
      newErrors.birthDate = '생년월일은 8자리로 입력해주세요. (예: 19900101)';
    }

    if (!phone.trim()) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (phone.length !== 11) {
      newErrors.phone = '전화번호는 11자리로 입력해주세요. (하이픈 제외)';
    }

    if (!email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!validateEmail(email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5f047ca7/donation-receipt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: publicAnonKey,
          },
          body: JSON.stringify({
            name,
            birthDate,
            phone,
            email,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail =
          data?.error || data?.message || `신청 접수에 실패했습니다. (HTTP ${response.status})`;
        throw new Error(detail);
      }

      const warning =
        data.emailStatus === 'failed' && data.emailError
          ? `\n(관리자 메일 전송 실패: ${data.emailError})`
          : data.emailStatus === 'failed'
          ? '\n(관리자 메일 전송에 실패했습니다. 메일 설정을 확인해주세요.)'
          : '';

      alert(`신청이 접수되었습니다.${warning}`);
      setName('');
      setBirthDate('');
      setPhone('');
      setEmail('');
      setErrors({});
      onClose();
    } catch (error: any) {
      console.error('Error submitting form:', error);
      alert(error.message || '메일 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 모달 닫기 시 폼 리셋
  const handleClose = () => {
    setName('');
    setBirthDate('');
    setPhone('');
    setEmail('');
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>기부금 영수증 발급 신청</DialogTitle>
          <DialogDescription>
            기부금 영수증 발급을 위해 아래 정보를 입력해주세요.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors({ ...errors, name: '' });
                }
              }}
              placeholder="이름을 입력해주세요"
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">생년월일 (8자리) *</Label>
            <Input
              id="birthDate"
              type="text"
              value={birthDate}
              onChange={handleBirthDateChange}
              placeholder="YYYYMMDD (예: 19900101)"
              maxLength={8}
              aria-invalid={!!errors.birthDate}
            />
            {errors.birthDate && <p className="text-sm text-red-500">{errors.birthDate}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">전화번호 (11자리) *</Label>
            <Input
              id="phone"
              type="text"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="01012345678 (하이픈 제외)"
              maxLength={11}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">이메일 *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) {
                  setErrors({ ...errors, email: '' });
                }
              }}
              placeholder="example@email.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
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

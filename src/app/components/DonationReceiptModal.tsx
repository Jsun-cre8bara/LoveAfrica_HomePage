import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

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

  // 전화번호 포맷 (숫자만, 최대 12자리)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
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
    } else if (phone.length !== 12) {
      newErrors.phone = '전화번호는 12자리로 입력해주세요. (하이픈 제외)';
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
      // 메일 제목: "'이름'님의 기부금 신청서 요청 메일입니다"
      const subject = encodeURIComponent(`${name}님의 기부금 신청서 요청 메일입니다`);
      
      // 메일 본문 작성
      const formattedBirthDate = `${birthDate.slice(0, 4)}-${birthDate.slice(4, 6)}-${birthDate.slice(6, 8)}`;
      const formattedPhone = phone.length === 12 
        ? `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`
        : phone;
      
      const body = encodeURIComponent(`
기부금 영수증 발급 신청서

이름: ${name}
생년월일: ${formattedBirthDate}
전화번호: ${formattedPhone}
이메일: ${email}

신청일시: ${new Date().toLocaleString('ko-KR')}
      `.trim());

      // mailto 링크 생성
      const mailtoLink = `mailto:loveafrica1004@gmail.com?subject=${subject}&body=${body}`;
      
      // mailto 링크 열기
      window.location.href = mailtoLink;

      // 성공 시 폼 리셋 및 모달 닫기 (약간의 지연 후)
      setTimeout(() => {
        alert('메일 앱이 열렸습니다. 메일을 전송해주세요.');
        setName('');
        setBirthDate('');
        setPhone('');
        setEmail('');
        setErrors({});
        onClose();
      }, 500);
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
            <Label htmlFor="phone">전화번호 (12자리) *</Label>
            <Input
              id="phone"
              type="text"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="01012345678 (하이픈 제외)"
              maxLength={12}
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

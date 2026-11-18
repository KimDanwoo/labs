import type { LegalDocumentContent } from '@shared/ui/legal-document';

export const PRIVACY_DOCUMENT: LegalDocumentContent = {
  title: '개인정보 처리방침',
  effectiveDate: '시행일: 2026년 11월 18일 (이전 방침 시행일: 2026년 4월 27일)',
  sections: [
    {
      title: '1. 수집하는 개인정보',
      paragraph: '프딥은 로그인 기능이 없으며, 이용자의 개인정보를 수집하지 않습니다.',
    },
    {
      title: '2. 학습 기록의 저장 위치',
      items: [
        '학습 진도, 북마크, 면접 학습 표시는 이용자의 브라우저(localStorage)에만 저장됩니다.',
        '이 정보는 프딥 서버로 전송되지 않으며, 다른 기기와 동기화되지 않습니다.',
        '브라우저의 사이트 데이터를 삭제하면 학습 기록도 함께 삭제되며 복구할 수 없습니다.',
      ],
    },
    {
      title: '3. 이전에 수집한 정보의 파기',
      paragraph:
        '2026년 11월 18일 이전에 Google 로그인으로 수집한 계정 정보(이메일 주소, 프로필 이미지 URL, 표시 이름)와 서버에 저장된 학습 기록은 로그인 기능 종료와 함께 서비스 데이터베이스에서 파기합니다.',
    },
    {
      title: '4. 개인정보 보호를 위한 기술적 대책',
      items: ['모든 통신은 HTTPS를 통해 암호화됩니다.'],
    },
    {
      title: '5. 문의처',
      paragraph: '개인정보 처리방침에 관한 문의는 아래 연락처로 문의해 주세요.',
      items: ['서비스명: 프딥', '이메일: support@fdeep.kr'],
    },
    {
      title: '6. 방침 변경에 관한 사항',
      paragraph:
        '본 개인정보 처리방침은 법령, 정책 또는 서비스 변경에 따라 수정될 수 있으며, 변경 시 본 페이지를 통해 공지합니다.',
    },
  ],
};

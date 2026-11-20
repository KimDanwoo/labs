// 품질 잠금은 my-fe-harness가 원본이다(훅의 기본 잠금과 같은 모듈). 프로젝트 설정 배열을 넘기면 @typescript-eslint 사용 여부를 보고 매직넘버 규칙을 고른다.
export { quality as default } from 'my-fe-harness/eslint';

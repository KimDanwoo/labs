/**
 * Compound API — `import * as Card from '@ui/react/card'` 로 가져와 `<Card.Root>`처럼 조합한다.
 * 변형이 잦은 케이스용. primitive 레이어를 의미 있는 part 이름으로 노출할 뿐, 별도 구현이 없다.
 * (namespace import로 제공해 object dot-operator의 tree-shaking 불이익을 피한다.)
 */
export {
  CardBody as Body,
  CardDescription as Description,
  CardFooter as Footer,
  CardHeader as Header,
  CardRoot as Root,
  CardTitle as Title,
} from './primitives';

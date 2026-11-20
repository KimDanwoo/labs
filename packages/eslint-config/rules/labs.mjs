export const interactiveComposition = {
  meta: { type: 'problem', schema: [] },
  create(context) {
    return {
      JSXElement(node) {
        if (!['Link', 'a'].includes(node.openingElement.name.name)) return;
        for (const child of node.children) {
          if (child.type !== 'JSXElement') continue;
          if (!['Button', 'button'].includes(child.openingElement.name.name)) continue;
          if (child.openingElement.attributes.some((attribute) => attribute.name?.name === 'asChild')) continue;
          context.report({
            node: child,
            message: '링크 안에 버튼을 중첩하지 않는다. Button asChild 안에 Link를 넣어 하나의 링크로 렌더링한다.',
          });
        }
      },
    };
  },
};

export default { rules: { 'interactive-composition': interactiveComposition } };

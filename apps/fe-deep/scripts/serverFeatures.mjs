function findServerRoutes(appRoutes, { routes, dynamicRoutes }) {
  const renderedOnDemand = appRoutes.filter((route) => !routes[route] && dynamicRoutes[route]?.fallback !== false);
  const revalidated = Object.entries(routes)
    .filter(([, prerendered]) => prerendered.initialRevalidateSeconds !== false)
    .map(([route]) => route);
  return [...renderedOnDemand, ...revalidated].map((route) => `경로 ${route}`);
}

function findServerFunctions(functionsConfig, middlewareManifest) {
  return [...Object.keys(functionsConfig.functions), ...Object.keys(middlewareManifest.middleware)].map(
    (name) => `함수 ${name}`,
  );
}

function findServerActions({ node, edge }) {
  return [...Object.values(node), ...Object.values(edge)].map(
    (action) => `Server Action ${action.filename}#${action.exportedName}`,
  );
}

export function findServerFeatures({ appRoutes, prerender, functionsConfig, middlewareManifest, serverReferences }) {
  return [
    ...findServerRoutes(appRoutes, prerender),
    ...findServerFunctions(functionsConfig, middlewareManifest),
    ...findServerActions(serverReferences),
  ];
}

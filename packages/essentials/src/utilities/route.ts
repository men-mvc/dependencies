export const replaceRouteParams = (
  route: string,
  params: Record<string, string>
): string => {
  if (!route) {
    return route;
  }

  const paramKeys = Object.keys(params);
  let newRoute = route;

  for (const key of paramKeys) {
    newRoute = newRoute.replace(`:${key}`, params[key]);
  }

  return newRoute;
};

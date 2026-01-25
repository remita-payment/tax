export function matchRoute(pathname, routes) {
  return routes.some((route) => {
    // convert /dashboard/products/* → regex
    const regex = new RegExp(
      "^" +
        route
          .replace(/\[.*?\]/g, "[^/]+") // [id]
          .replace(/\*/g, ".*") +
        "$"
    );

    return regex.test(pathname);
  });
}

import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/api/inventory/:path*",
    "/api/materials/:path*",
    "/api/orders/:path*",
    "/api/stock/:path*",
    "/api/dashboard/:path*",
    "/dashboard/:path*",
  ],
};

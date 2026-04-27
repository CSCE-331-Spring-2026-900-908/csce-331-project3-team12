import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/manager",
  },
});

export const config = {
  matcher: ['/manager/dashboard/:path*'],
};
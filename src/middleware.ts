import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth-edge';

export async function middleware(request: NextRequest) {
  const session = await auth();

  // Check if user is authenticated
  if (!session) {
    // Allow public paths
    if (
      request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname.startsWith('/api/auth')
    ) {
      return;
    }

    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    return Response.redirect(loginUrl);
  }

  // User is authenticated
  if (request.nextUrl.pathname === '/login') {
    // Redirect authenticated users away from login
    const dashboardUrl = new URL('/', request.url);
    return Response.redirect(dashboardUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

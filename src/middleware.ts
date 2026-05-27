import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth-edge';

// Admin paths cần đăng nhập (mọi path còn lại được coi là public)
const ADMIN_PATH_PREFIXES = [
  '/dashboard',
  '/patients',
  '/appointments',
  '/medical-records',
  '/prescriptions',
  '/lab-orders',
  '/billing',
  '/pharmacy',
  '/reports',
  '/marketing',
  '/queue',
  '/audit-log',
  '/doctors',
  '/suppliers',
  '/services',
  '/settings',
];

// Public API endpoints không cần auth (catalog xem, tra cứu chi nhánh, đặt lịch khách)
const PUBLIC_API_PREFIXES = [
  '/api/auth',
  '/api/health',
  '/api/public',
];

function isAdminPath(path: string) {
  return ADMIN_PATH_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

function isAdminApi(path: string) {
  if (!path.startsWith('/api/')) return false;
  return !PUBLIC_API_PREFIXES.some((p) => path === p || path.startsWith(p + '/'));
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Static assets / PWA — luôn cho qua
  if (
    path === '/manifest.json' ||
    path === '/sw.js' ||
    path === '/favicon.svg' ||
    path.startsWith('/icons/')
  ) {
    return;
  }

  const session = await auth();

  // Đã đăng nhập: từ /login → /dashboard
  if (session && path === '/login') {
    return Response.redirect(new URL('/dashboard', request.url));
  }

  // Chưa đăng nhập + truy cập admin → /login
  if (!session && (isAdminPath(path) || isAdminApi(path))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', path);
    return Response.redirect(loginUrl);
  }

  // Còn lại (public routes): cho qua
  return;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

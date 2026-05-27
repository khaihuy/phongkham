import { ReactNode } from 'react';
import LayoutClient from '../layout-client';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <LayoutClient>{children}</LayoutClient>;
}

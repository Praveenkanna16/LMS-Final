import { TeacherSidebar } from '@/components/layout/TeacherSidebar';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children }) => {
  return (
    <div className='flex h-screen bg-gray-50'>
      {/* Sidebar */}
      <aside className='w-64 bg-white border-r border-gray-200 fixed inset-y-0 left-0 z-50'>
        <TeacherSidebar />
      </aside>

      {/* Main Content */}
      <div className='flex-1 ml-64 overflow-auto'>
        <main className='p-6'>{children}</main>
      </div>
    </div>
  );
};

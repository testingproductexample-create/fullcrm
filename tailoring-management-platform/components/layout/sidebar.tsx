'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CogIcon,
  BuildingOfficeIcon,
  TruckIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ReceiptRefundIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  BeakerIcon,
  GlobeAltIcon,
  PhoneIcon,
  ComputerDesktopIcon,
  ScissorsIcon,
  TagIcon,
  SwatchIcon,
  PresentationChartLineIcon,
  CurrencyDollarIcon,
  BuildingOffice2Icon,
  ArrowPathRoundedSquareIcon,
  CubeIcon,
  ChatBubbleLeftEllipsisIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  BellIcon,
  MagnifyingGlassIcon,
  WrenchIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CertificateIcon,
  ArrowUpIcon,
  TrophyIcon,
  MapIcon,
  PencilSquareIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Navigation structure with all 31+ business systems
const navigation = [
  {
    name: 'Business Overview',
    items: [
      { name: 'Dashboard', href: '/', icon: HomeIcon },
      { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
      { name: 'BI Dashboard', href: '/analytics/dashboard', icon: PresentationChartLineIcon },
      { name: 'Reports', href: '/reports', icon: PresentationChartLineIcon },
    ],
  },
  {
    name: 'Efficiency & Performance',
    items: [
      { name: 'Overview Dashboard', href: '/efficiency', icon: ChartBarIcon },
      { name: 'Performance Analytics', href: '/efficiency/analytics', icon: PresentationChartLineIcon },
      { name: 'Bottleneck Management', href: '/efficiency/bottlenecks', icon: MagnifyingGlassIcon },
      { name: 'Resource Analysis', href: '/efficiency/resources', icon: CubeIcon },
      { name: 'Optimization Center', href: '/efficiency/optimization', icon: WrenchIcon },
      { name: 'Alert Management', href: '/efficiency/alerts', icon: BellIcon },
    ],
  },
  {
    name: 'Customer Management',
    items: [
      { name: 'Customers', href: '/customers', icon: UsersIcon },
      { name: 'Customer Segments', href: '/customers/segments', icon: TagIcon },
      { name: 'Loyalty Programs', href: '/customers/loyalty', icon: SwatchIcon },
      { name: 'Measurements', href: '/measurements', icon: ScissorsIcon },
    ],
  },
  {
    name: 'Order Management',
    items: [
      { name: 'Orders', href: '/orders', icon: ShoppingCartIcon },
      { name: 'Workflow Board', href: '/workflow', icon: ChartBarIcon },
      { name: 'Order Tracking', href: '/orders/tracking', icon: ClockIcon },
      { name: 'Order Templates', href: '/orders/templates', icon: DocumentTextIcon },
      { name: 'Alterations', href: '/orders/alterations', icon: AdjustmentsHorizontalIcon },
    ],
  },
  {
    name: 'Design & Catalog',
    items: [
      { name: 'Design Catalog', href: '/designs', icon: SwatchIcon },
      { name: 'Fabric Library', href: '/fabrics', icon: SwatchIcon },
      { name: 'Patterns', href: '/patterns', icon: TagIcon },
      { name: 'Media Gallery', href: '/media', icon: ComputerDesktopIcon },
    ],
  },
  {
    name: 'Employee Management',
    items: [
      { name: 'Employee Dashboard', href: '/employees', icon: HomeIcon },
      { name: 'Employee Directory', href: '/employees/directory', icon: UsersIcon },
      { name: 'Add Employee', href: '/employees/new', icon: UserGroupIcon },
      { name: 'Skills Management', href: '/employees/skills', icon: ChartBarIcon },
      { name: 'Performance Reviews', href: '/employees/reviews', icon: ClipboardDocumentListIcon },
      { name: 'Training Programs', href: '/employees/training', icon: DocumentTextIcon },
    ],
  },
  {
    name: 'Training & Certification',
    items: [
      { name: 'Training Dashboard', href: '/training', icon: AcademicCapIcon },
      { name: 'Training Admin', href: '/training/admin', icon: CogIcon },
      { name: 'Course Catalog', href: '/training/courses', icon: BookOpenIcon },
      { name: 'Certifications', href: '/training/certifications', icon: CertificateIcon },
      { name: 'Skills Assessment', href: '/training/skills', icon: TrophyIcon },
      { name: 'Career Paths', href: '/training/career-paths', icon: MapIcon },
      { name: 'Compliance Training', href: '/training/compliance', icon: ShieldCheckIcon },
    ],
  },
  {
    name: 'Legal & Contract Management',
    items: [
      { name: 'Legal Dashboard', href: '/legal', icon: ScaleIcon },
      { name: 'Contract Management', href: '/legal/contracts', icon: DocumentTextIcon },
      { name: 'Contract Templates', href: '/legal/templates', icon: ClipboardDocumentListIcon },
      { name: 'Digital Signatures', href: '/legal/signatures', icon: PencilSquareIcon },
      { name: 'Legal Documents', href: '/legal/documents', icon: DocumentTextIcon },
      { name: 'Compliance Tracking', href: '/legal/compliance', icon: ShieldCheckIcon },
      { name: 'Legal Analytics', href: '/legal/analytics', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Attendance & Payroll',
    items: [
      { name: 'Attendance', href: '/attendance', icon: ClockIcon },
      { name: 'Work Schedules', href: '/schedules', icon: CalendarIcon },
      { name: 'Task Assignment', href: '/tasks', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    name: 'Financial Management',
    items: [
      { name: 'Financial Dashboard', href: '/finance', icon: BanknotesIcon },
      { name: 'Transactions', href: '/finance/transactions', icon: ReceiptRefundIcon },
      { name: 'Financial Reports', href: '/finance/reports', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Invoice & Billing',
    items: [
      { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon },
      { name: 'Create Invoice', href: '/invoices/new', icon: DocumentTextIcon },
      { name: 'Payments', href: '/payments', icon: CurrencyDollarIcon },
    ],
  },
  {
    name: 'Payroll System',
    items: [
      { name: 'Payroll Processing', href: '/payroll', icon: BanknotesIcon },
      { name: 'Salary Calculations', href: '/payroll/calculations', icon: ChartBarIcon },
      { name: 'Payslips', href: '/payroll/payslips', icon: DocumentTextIcon },
      { name: 'End of Service', href: '/payroll/end-service', icon: DocumentTextIcon },
    ],
  },
  {
    name: 'Quality Control',
    items: [
      { name: 'Quality Dashboard', href: '/quality', icon: BeakerIcon },
      { name: 'Inspections', href: '/quality/inspections', icon: ClipboardDocumentListIcon },
      { name: 'Defect Tracking', href: '/quality/defects', icon: AdjustmentsHorizontalIcon },
      { name: 'Audits', href: '/quality/audits', icon: ShieldCheckIcon },
      { name: 'Standards', href: '/quality/standards', icon: DocumentTextIcon },
    ],
  },
  {
    name: 'Supplier & Vendor',
    items: [
      { name: 'Suppliers', href: '/suppliers', icon: TruckIcon },
      { name: 'Procurement', href: '/suppliers/procurement', icon: ShoppingCartIcon },
      { name: 'Vendor Evaluations', href: '/suppliers/evaluations', icon: ChartBarIcon },
      { name: 'Price Comparison', href: '/suppliers/pricing', icon: BanknotesIcon },
      { name: 'Contracts', href: '/suppliers/contracts', icon: DocumentTextIcon },
    ],
  },
  {
    name: 'Integrations & APIs',
    items: [
      { name: 'Integration Hub', href: '/integrations', icon: GlobeAltIcon },
      { name: 'Setup Wizard', href: '/integrations/setup', icon: AdjustmentsHorizontalIcon },
      { name: 'API Logs', href: '/integrations/logs', icon: ClipboardDocumentListIcon },
      { name: 'Webhooks', href: '/integrations/webhooks', icon: ArrowPathRoundedSquareIcon },
      { name: 'Analytics', href: '/integrations/analytics', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Inventory Management',
    items: [
      { name: 'Fabric Stock', href: '/inventory', icon: SwatchIcon },
      { name: 'Material Costs', href: '/inventory/costs', icon: BanknotesIcon },
      { name: 'Stock Alerts', href: '/inventory/alerts', icon: ClockIcon },
      { name: 'Usage Tracking', href: '/inventory/usage', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Multi-Location Management',
    items: [
      { name: 'All Branches', href: '/branches', icon: BuildingOffice2Icon },
      { name: 'Inter-Branch Transfers', href: '/branches/transfers', icon: ArrowPathRoundedSquareIcon },
      { name: 'Cross-Location Inventory', href: '/branches/inventory', icon: CubeIcon },
      { name: 'Branch Analytics', href: '/branches/analytics', icon: ChartBarIcon },
    ],
  },
  {
    name: 'Loyalty & Rewards',
    items: [
      { name: 'Loyalty Overview', href: '/loyalty', icon: SwatchIcon },
      { name: 'Members', href: '/loyalty/members', icon: UsersIcon },
      { name: 'Rewards Catalog', href: '/loyalty/rewards', icon: TagIcon },
      { name: 'Redemptions', href: '/loyalty/redemptions', icon: ReceiptRefundIcon },
      { name: 'Campaigns', href: '/loyalty/campaigns', icon: ChartBarIcon },
      { name: 'Analytics', href: '/loyalty/analytics', icon: PresentationChartLineIcon },
    ],
  },
  {
    name: 'Appointments & Scheduling',
    items: [
      { name: 'Appointments', href: '/appointments', icon: CalendarIcon },
      { name: 'Calendar Management', href: '/appointments/calendar', icon: CalendarIcon },
      { name: 'Availability', href: '/appointments/availability', icon: ClockIcon },
      { name: 'Reminders', href: '/appointments/reminders', icon: PhoneIcon },
    ],
  },
  {
    name: 'Communication',
    items: [
      { name: 'Messages', href: '/communication', icon: ChatBubbleLeftRightIcon },
      { name: 'SMS & WhatsApp', href: '/communication/messaging', icon: PhoneIcon },
      { name: 'Email Campaigns', href: '/communication/email', icon: PhoneIcon },
      { name: 'Bulk Messaging', href: '/communication/bulk', icon: ChatBubbleLeftRightIcon },
    ],
  },
  {
    name: 'Customer Service & Support',
    items: [
      { name: 'Support Dashboard', href: '/support', icon: ChatBubbleLeftEllipsisIcon },
      { name: 'Ticket Management', href: '/support/tickets', icon: ClipboardDocumentListIcon },
      { name: 'Knowledge Base', href: '/support/knowledge', icon: DocumentTextIcon },
      { name: 'Support Analytics', href: '/support/analytics', icon: ChartBarIcon },
      { name: 'Agent Management', href: '/support/agents', icon: UserGroupIcon },
    ],
  },
  {
    name: 'Marketing & Campaigns',
    items: [
      { name: 'Marketing Dashboard', href: '/marketing', icon: ChartBarIcon },
      { name: 'Campaigns', href: '/marketing/campaigns', icon: PhoneIcon },
      { name: 'Email Templates', href: '/marketing/templates', icon: DocumentTextIcon },
      { name: 'Customer Segments', href: '/marketing/segments', icon: TagIcon },
      { name: 'Analytics', href: '/marketing/analytics', icon: PresentationChartLineIcon },
      { name: 'Automation', href: '/marketing/automation', icon: CogIcon },
      { name: 'A/B Testing', href: '/marketing/ab-tests', icon: BeakerIcon },
      { name: 'Settings', href: '/marketing/settings', icon: AdjustmentsHorizontalIcon },
    ],
  },
  {
    name: 'Feedback & Complaints',
    items: [
      { name: 'Dashboard', href: '/feedback', icon: ChartBarIcon },
      { name: 'Complaints Management', href: '/feedback/complaints', icon: ExclamationTriangleIcon },
      { name: 'Satisfaction Surveys', href: '/feedback/surveys', icon: ClipboardDocumentCheckIcon },
      { name: 'Analytics & Reports', href: '/feedback/analytics', icon: PresentationChartLineIcon },
      { name: 'Response Management', href: '/feedback/responses', icon: ChatBubbleLeftEllipsisIcon },
      { name: 'Resolution Workflow', href: '/feedback/resolution', icon: ClipboardDocumentListIcon },
      { name: 'Settings', href: '/feedback/settings', icon: AdjustmentsHorizontalIcon },
    ],
  },
  {
    name: 'Document Management',
    items: [
      { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
      { name: 'Digital Signatures', href: '/documents/signatures', icon: ShieldCheckIcon },
      { name: 'Document Templates', href: '/documents/templates', icon: DocumentTextIcon },
      { name: 'Approvals', href: '/documents/approvals', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    name: 'Compliance & Security',
    items: [
      { name: 'Visa Tracking', href: '/compliance/visa', icon: GlobeAltIcon },
      { name: 'Security Settings', href: '/security', icon: ShieldCheckIcon },
      { name: 'Compliance Reports', href: '/compliance/reports', icon: DocumentTextIcon },
      { name: 'Audit Logs', href: '/security/audit', icon: ClipboardDocumentListIcon },
    ],
  },
  {
    name: 'System Settings',
    items: [
      { name: 'General Settings', href: '/settings', icon: CogIcon },
      { name: 'User Management', href: '/settings/users', icon: UserGroupIcon },
      { name: 'Business Profile', href: '/settings/business', icon: BuildingOfficeIcon },
      { name: 'Integrations', href: '/settings/integrations', icon: ComputerDesktopIcon },
    ],
  },
];

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 glass">
      <div className="flex h-16 shrink-0 items-center">
        <div className="text-xl font-bold text-blue-600">
          Tailoring Pro
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          {navigation.map((group) => (
            <li key={group.name}>
              <div className="text-xs font-semibold leading-6 text-gray-400 uppercase tracking-wide">
                {group.name}
              </div>
              <ul role="list" className="-mx-2 mt-2 space-y-1">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors',
                        pathname === item.href
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                      )}
                    >
                      <item.icon
                        className={cn(
                          'h-6 w-6 shrink-0',
                          pathname === item.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* User profile section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center gap-x-4 px-2 py-3">
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">
              {user?.user_metadata?.full_name || user?.email || 'User'}
            </div>
            <div className="text-xs text-gray-500">
              {user?.user_metadata?.role || 'Member'}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent />
      </div>
    </>
  );
}
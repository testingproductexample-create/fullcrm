import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      "nav": {
        "dashboard": "Dashboard",
        "tracking": "Commission Tracking",
        "settings": "Settings",
        "reports": "Reports",
        "templates": "Templates",
        "payments": "Payments"
      },
      // Dashboard
      "dashboard": {
        "title": "Commission Management Dashboard",
        "totalCommissions": "Total Commissions",
        "pendingPayments": "Pending Payments",
        "activeStructures": "Active Structures",
        "topPerformers": "Top Performers",
        "recentActivity": "Recent Activity"
      },
      // Commission Tracking
      "tracking": {
        "title": "Sales Commission Tracking",
        "search": "Search by Employee...",
        "filter": "Filter by Status",
        "employee": "Employee",
        "amount": "Amount",
        "status": "Status",
        "date": "Date",
        "order": "Order",
        "viewDetails": "View Details",
        "pending": "Pending",
        "approved": "Approved",
        "paid": "Paid"
      },
      // Settings
      "settings": {
        "title": "Performance-Based Compensation",
        "employee": "Employee",
        "commissionRate": "Commission Rate (%)",
        "targetAmount": "Target Amount",
        "achievement": "Achievement %",
        "bonusEligible": "Bonus Eligible",
        "save": "Save Settings",
        "addEmployee": "Add Employee"
      },
      // Reports
      "reports": {
        "title": "Commission Reports & Analytics",
        "period": "Select Period",
        "department": "Department",
        "totalGenerated": "Total Generated",
        "averageCommission": "Average Commission",
        "performanceTrend": "Performance Trend",
        "departmentBreakdown": "Department Breakdown",
        "topPerformers": "Top Performers"
      },
      // Templates
      "templates": {
        "title": "Commission Structure Templates",
        "templateName": "Template Name",
        "structureType": "Structure Type",
        "baseRate": "Base Rate (%)",
        "tierRates": "Tier Rates",
        "createTemplate": "Create Template",
        "useTemplate": "Use Template",
        "edit": "Edit",
        "delete": "Delete"
      },
      // Payments
      "payments": {
        "title": "Payment Processing",
        "employee": "Employee",
        "period": "Period",
        "amount": "Amount",
        "method": "Method",
        "status": "Status",
        "processPayment": "Process Payment",
        "bulkProcess": "Bulk Process",
        "export": "Export"
      },
      // Common
      "common": {
        "save": "Save",
        "cancel": "Cancel",
        "edit": "Edit",
        "delete": "Delete",
        "add": "Add",
        "search": "Search",
        "filter": "Filter",
        "export": "Export",
        "import": "Import",
        "loading": "Loading...",
        "noData": "No data available"
      }
    }
  },
  ar: {
    translation: {
      // Navigation
      "nav": {
        "dashboard": "لوحة التحكم",
        "tracking": "تتبع العمولة",
        "settings": "الإعدادات",
        "reports": "التقارير",
        "templates": "القوالب",
        "payments": "المدفوعات"
      },
      // Dashboard
      "dashboard": {
        "title": "لوحة تحكم إدارة العمولة",
        "totalCommissions": "إجمالي العمولات",
        "pendingPayments": "المدفوعات المعلقة",
        "activeStructures": "الهياكل النشطة",
        "topPerformers": "أفضل الموظفين",
        "recentActivity": "النشاط الأخير"
      },
      // Commission Tracking
      "tracking": {
        "title": "تتبع عمولة المبيعات",
        "search": "البحث حسب الموظف...",
        "filter": "التصفية حسب الحالة",
        "employee": "الموظف",
        "amount": "المبلغ",
        "status": "الحالة",
        "date": "التاريخ",
        "order": "الطلب",
        "viewDetails": "عرض التفاصيل",
        "pending": "معلق",
        "approved": "معتمد",
        "paid": "مدفوع"
      },
      // Settings
      "settings": {
        "title": "التعويضات بناءً على الأداء",
        "employee": "الموظف",
        "commissionRate": "معدل العمولة (%)",
        "targetAmount": "المبلغ المستهدف",
        "achievement": "نسبة الإنجاز",
        "bonusEligible": "مؤهل للعلاوة",
        "save": "حفظ الإعدادات",
        "addEmployee": "إضافة موظف"
      },
      // Reports
      "reports": {
        "title": "تقارير وتحليلات العمولة",
        "period": "اختيار الفترة",
        "department": "القسم",
        "totalGenerated": "إجمالي المولد",
        "averageCommission": "متوسط العمولة",
        "performanceTrend": "اتجاه الأداء",
        "departmentBreakdown": "تفصيل الأقسام",
        "topPerformers": "أفضل الموظفين"
      },
      // Templates
      "templates": {
        "title": "قوالب هيكل العمولة",
        "templateName": "اسم القالب",
        "structureType": "نوع الهيكل",
        "baseRate": "المعدل الأساسي (%)",
        "tierRates": "المعدلات التدريجية",
        "createTemplate": "إنشاء قالب",
        "useTemplate": "استخدام القالب",
        "edit": "تعديل",
        "delete": "حذف"
      },
      // Payments
      "payments": {
        "title": "معالجة المدفوعات",
        "employee": "الموظف",
        "period": "الفترة",
        "amount": "المبلغ",
        "method": "الطريقة",
        "status": "الحالة",
        "processPayment": "معالجة الدفع",
        "bulkProcess": "معالجة جماعية",
        "export": "تصدير"
      },
      // Common
      "common": {
        "save": "حفظ",
        "cancel": "إلغاء",
        "edit": "تعديل",
        "delete": "حذف",
        "add": "إضافة",
        "search": "بحث",
        "filter": "تصفية",
        "export": "تصدير",
        "import": "استيراد",
        "loading": "جاري التحميل...",
        "noData": "لا توجد بيانات متاحة"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
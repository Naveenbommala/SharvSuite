import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Navbar,
  Nav,
  Row,
  Spinner,
} from 'react-bootstrap';
import './index.css';
import {
  fetchAuthConfig,
  signInWithGoogle,
  signOutUser,
  type AuthConfigResponse,
} from './auth';
import LoginCard from './components/LoginCard';
import TenantBusinessModule, {
  type ScreenKey,
} from './components/TenantBusinessModule';
import UsersRolesModule, {
  type UsersRolesScreenKey,
} from './components/UsersRolesModule';
import LocalizationModule, {
  type LocalizationScreenKey,
} from './components/LocalizationModule';
import SubscriptionBillingModule, {
  type SubscriptionBillingScreenKey,
} from './components/SubscriptionBillingModule';
import GlobalSettingsModule, {
  type GlobalSettingsScreenKey,
} from './components/GlobalSettingsModule';
import DashboardModule, {
  type DashboardScreenKey,
} from './components/DashboardModule';
import CustomersModule, {
  type CustomersScreenKey,
} from './components/CustomersModule';
import ReportsModule, {
  type ReportsScreenKey,
} from './components/ReportsModule';
import InventoryModule, {
  type InventoryScreenKey,
} from './components/InventoryModule';
import PaymentsModule, {
  type PaymentsScreenKey,
} from './components/PaymentsModule';
import ExpensesModule, {
  type ExpensesScreenKey,
} from './components/ExpensesModule';
import PurchasesModule, {
  type PurchasesScreenKey,
} from './components/PurchasesModule';
import SalesModule, {
  type SalesScreenKey,
} from './components/SalesModule';
import InvoicingModule, {
  type InvoicingScreenKey,
} from './components/InvoicingModule';
import AccountingModule, {
  type AccountingScreenKey,
} from './components/AccountingModule';
import ProductsServicesModule, {
  type ProductsServicesScreenKey,
} from './components/ProductsServicesModule';
import VendorsModule, {
  type VendorsScreenKey,
} from './components/VendorsModule';
import RecipesModule, {
  type RecipesScreenKey,
} from './components/RecipesModule';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { clearSessionUser, setSessionUser } from './store/sessionSlice';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'sharvsuite-theme';

type ModuleGroup = {
  title: string;
  future?: boolean;
  items: string[];
};

type ModuleSection = {
  title: string;
  items: string[];
};

type ModuleContent = {
  heading: string;
  description: string;
  sections: ModuleSection[];
};

const moduleGroups: ModuleGroup[] = [
  {
    title: 'Core Platform',
    items: [
      'Tenant & Business',
      'Users & Roles',
      'Localization',
      'Subscription/Billing',
      'Settings',
    ],
  },
  {
    title: 'Business Modules',
    items: [
      'Dashboard',
      'Customers',
      'Vendors',
      'Products/Services',
      'Recipes',
      'Sales',
      'Invoicing',
      'Accounting',
      'Purchases',
      'Expenses',
      'Payments',
      'Inventory',
      'Reports',
    ],
  },
  {
    title: 'AI Modules',
    future: true,
    items: ['AI Insights', 'AI Extraction', 'AI Assistant'],
  },
];

const menuIcons: Record<string, string> = {
  'Tenant & Business': '⌂',
  'Users & Roles': '◧',
  Localization: '◎',
  'Subscription/Billing': '◍',
  Settings: '◈',
  Dashboard: '◩',
  Customers: '◒',
  Vendors: '◇',
  'Products/Services': '◫',
  Recipes: '△',
  Sales: '▤',
  Invoicing: '▣',
  Accounting: '◪',
  Purchases: '▥',
  Expenses: '◬',
  Payments: '◉',
  Inventory: '◰',
  Reports: '▦',
  'AI Insights': '◆',
  'AI Extraction': '◆',
  'AI Assistant': '◆',
};

const moduleContentMap: Record<string, ModuleContent> = {
  'Tenant & Business': {
    heading: 'Tenant / Business Setup',
    description:
      'Configure business identity, preferences, regional defaults, and fiscal setup per tenant.',
    sections: [
      {
        title: 'Screens',
        items: [
          'Create Business',
          'Business Profile',
          'Business Preferences',
          'Regional Settings',
          'Fiscal Year Settings',
        ],
      },
      {
        title: 'Configurable',
        items: [
          'base currency',
          'tax regime',
          'language',
          'date format',
          'number format',
          'timezone',
        ],
      },
    ],
  },
  'Users & Roles': {
    heading: 'Users & Roles',
    description:
      'Manage user onboarding, role-based access, and permission controls across modules.',
    sections: [
      {
        title: 'Screens',
        items: [
          'User List',
          'Invite User',
          'Role Management',
          'Permissions Matrix',
        ],
      },
      {
        title: 'Configurable',
        items: ['module access', 'action permissions', 'data scope'],
      },
    ],
  },
  Localization: {
    heading: 'Localization Settings',
    description:
      'Set tenant-level currency, taxation, and language behavior for UI, documents, and reporting.',
    sections: [
      {
        title: 'Currency Screens',
        items: [
          'Currency List',
          'Exchange Rates',
          'Base Currency',
          'Currency Format',
        ],
      },
      {
        title: 'Currency Supports',
        items: [
          'multiple currencies',
          'symbol placement',
          'decimals',
          'rounding',
        ],
      },
      {
        title: 'Taxation Screens',
        items: [
          'Tax Types',
          'Tax Rates',
          'Tax Rules',
          'Tax Groups',
          'Region Mapping',
        ],
      },
      {
        title: 'Taxation Supports',
        items: [
          'GST/VAT/Sales Tax',
          'inclusive/exclusive',
          'multi-rate',
          'compound tax',
          'country/state tax',
        ],
      },
      {
        title: 'Language Screens',
        items: [
          'Language Settings',
          'Default Language',
          'Translation Overrides',
          'Label Customization',
        ],
      },
      {
        title: 'Language Supports',
        items: ['UI language', 'document language', 'multi-lingual labels'],
      },
    ],
  },
  'Subscription/Billing': {
    heading: 'Subscription & Billing',
    description:
      'Define plans, billing cycles, tenant subscriptions, and invoice generation workflows.',
    sections: [
      {
        title: 'Core Areas',
        items: [
          'Plan Catalog',
          'Subscription Lifecycle',
          'Billing Cycles',
          'Invoice Generation',
          'Payment Tracking',
        ],
      },
    ],
  },
  Settings: {
    heading: 'Global Settings & Platform Design',
    description:
      'Configure cross-tenant operational settings and core architecture for currency, tax, and language.',
    sections: [
      {
        title: 'Global Settings Screens',
        items: [
          'Numbering Series',
          'Document Templates',
          'Email Templates',
          'Notification Rules',
          'Automation',
        ],
      },
      {
        title: 'Multi-Currency Design',
        items: [
          'Each transaction stores: transaction currency, base currency, exchange rate, converted amount',
          'Tables: Currency, ExchangeRate, MoneyAmount (value + currency)',
        ],
      },
      {
        title: 'Multi-Tax Design',
        items: [
          'Tax entities: TaxType, TaxRate, TaxRule, TaxGroup, TaxRegion',
          'Each line item stores: tax group, tax % applied, inclusive/exclusive',
        ],
      },
      {
        title: 'Multi-Language Design',
        items: [
          'Approach: i18n resource keys, tenant overrides, DB translations',
          'Tables: Language, TranslationKey, TranslationValue, TenantTranslation',
          'Supports: UI, documents, reports',
        ],
      },
    ],
  },
  Dashboard: {
    heading: 'Dashboard',
    description:
      'Track business performance with role-specific and domain-focused dashboard views.',
    sections: [
      {
        title: 'Screens',
        items: [
          'Overview Dashboard',
          'Financial Dashboard',
          'Sales Dashboard',
          'Inventory Dashboard',
        ],
      },
      {
        title: 'Widgets',
        items: [
          'sales',
          'expenses',
          'profit',
          'receivables',
          'payables',
          'currency-converted totals',
        ],
      },
    ],
  },
  Customers: {
    heading: 'Customers',
    description:
      'Manage customer master data, ledgers, transactions, and statement generation.',
    sections: [
      {
        title: 'Screens',
        items: [
          'Customer List',
          'Customer Profile',
          'Customer Ledger',
          'Customer Transactions',
          'Customer Statements',
        ],
      },
      {
        title: 'Supports',
        items: ['customer currency', 'tax profile', 'region tax rules'],
      },
    ],
  },
  Vendors: {
    heading: 'Vendors',
    description:
      'Manage vendor records, purchase history, and settlement details for procurement operations.',
    sections: [
      {
        title: 'Screens',
        items: [
          'Vendor List',
          'Vendor Profile',
          'Vendor Ledger',
          'Purchase History',
          'Vendor Payments',
        ],
      },
      {
        title: 'Supports',
        items: ['vendor tax', 'currency'],
      },
    ],
  },
  'Products/Services': {
    heading: 'Products & Services',
    description:
      'Maintain product/service catalogs, units, categories, pricing, and tax classification.',
    sections: [
      {
        title: 'Screens',
        items: ['Product List', 'Product Detail', 'Categories', 'Units', 'Pricing'],
      },
      {
        title: 'Supports',
        items: [
          'multi-currency price',
          'tax category',
          'stock/non-stock',
          'region pricing',
        ],
      },
    ],
  },
  Recipes: {
    heading: 'Recipes',
    description:
      'Create batch-ready recipes, plan production quantities, and consume ingredient stock from inventory.',
    sections: [
      {
        title: 'Screens',
        items: ['Recipe Catalog', 'Recipe Planner'],
      },
      {
        title: 'Supports',
        items: [
          'ingredient quantity per batch',
          'production planning',
          'inventory availability preview',
          'stock deduction on execution',
        ],
      },
    ],
  },
  Sales: {
    heading: 'Sales',
    description:
      'Support quote-to-cash workflows with invoice generation and recurring billing.',
    sections: [
      {
        title: 'Quote Screens',
        items: ['Quote List', 'Create Quote', 'Quote Detail'],
      },
      {
        title: 'Invoice Screens',
        items: [
          'Invoice List',
          'Create Invoice',
          'Invoice Detail',
          'Recurring Invoice',
        ],
      },
      {
        title: 'Supports',
        items: [
          'currency per invoice',
          'tax rules per line',
          'region tax',
          'exchange conversion',
        ],
      },
    ],
  },
  Invoicing: {
    heading: 'Invoicing',
    description:
      'Create and manage invoices, recurring billing schedules, credit notes, and collections.',
    sections: [
      {
        title: 'Screens',
        items: [
          'Invoice List',
          'Create Invoice',
          'Recurring Invoices',
          'Credit Notes',
        ],
      },
      {
        title: 'Supports',
        items: [
          'line-level tax',
          'payment terms',
          'multi-currency totals',
          'discounts and shipping',
        ],
      },
    ],
  },
  Accounting: {
    heading: 'Accounting',
    description:
      'Maintain chart of accounts, journals, general ledger, and trial balance workflows.',
    sections: [
      {
        title: 'Screens',
        items: [
          'Chart of Accounts',
          'Journal Entries',
          'General Ledger',
          'Trial Balance',
        ],
      },
      {
        title: 'Supports',
        items: [
          'debit/credit posting',
          'cost centers',
          'period closing',
          'audit-ready balances',
        ],
      },
    ],
  },
  Purchases: {
    heading: 'Purchases',
    description:
      'Support procure-to-pay flows from purchase order creation to vendor bill settlement.',
    sections: [
      {
        title: 'Purchase Order Screens',
        items: ['PO List', 'Create PO', 'PO Detail'],
      },
      {
        title: 'Bill Screens',
        items: ['Bill List', 'Create Bill', 'Bill Detail'],
      },
      {
        title: 'Supports',
        items: ['vendor currency', 'tax', 'landed cost'],
      },
    ],
  },
  Expenses: {
    heading: 'Expenses',
    description:
      'Capture and categorize operating expenses with recurring and reimbursement support.',
    sections: [
      {
        title: 'Screens',
        items: ['Expense List', 'Add Expense', 'Categories', 'Recurring Expenses'],
      },
      {
        title: 'Supports',
        items: ['currency', 'tax', 'reimbursement'],
      },
    ],
  },
  Payments: {
    heading: 'Payments',
    description:
      'Track incoming and outgoing payments with allocation and multi-currency handling.',
    sections: [
      {
        title: 'Receipt Screens',
        items: ['Payment Received', 'Allocate to Invoice'],
      },
      {
        title: 'Vendor Payment Screens',
        items: ['Pay Bill', 'Payment Allocation'],
      },
      {
        title: 'Multi-currency Support',
        items: ['payment currency', 'gain/loss calc'],
      },
    ],
  },
  Inventory: {
    heading: 'Inventory',
    description:
      'Manage stock visibility, warehouse operations, and valuation-oriented inventory movement.',
    sections: [
      {
        title: 'Screens',
        items: [
          'Stock List',
          'Stock Movement',
          'Warehouses',
          'Transfers',
          'Adjustments',
        ],
      },
      {
        title: 'Supports',
        items: ['valuation currency', 'region tax'],
      },
    ],
  },
  Reports: {
    heading: 'Reports',
    description:
      'Generate financial, operational, and compliance reports with localization-aware output.',
    sections: [
      {
        title: 'Financial Reports',
        items: ['Profit & Loss', 'Balance', 'Cashflow'],
      },
      {
        title: 'Sales Reports',
        items: ['Sales by period', 'Sales by product', 'Sales by currency'],
      },
      {
        title: 'Tax Reports',
        items: ['Tax summary', 'GST/VAT report', 'region tax'],
      },
      {
        title: 'Ledger Reports',
        items: ['Customer ledger', 'Vendor ledger'],
      },
      {
        title: 'All Reports Support',
        items: ['currency conversion', 'tax regime', 'language'],
      },
    ],
  },
};

const tenantBusinessSubmenus: Array<{ key: ScreenKey; label: string }> = [
  { key: 'createBusiness', label: 'Create Business' },
  { key: 'businessProfile', label: 'Business Profile' },
  { key: 'businessPreferences', label: 'Business Preferences' },
  { key: 'regionalSettings', label: 'Regional Settings' },
  { key: 'fiscalYearSettings', label: 'Fiscal Year Settings' },
];

const usersRolesSubmenus: Array<{ key: UsersRolesScreenKey; label: string }> = [
  { key: 'userList', label: 'User List' },
  { key: 'inviteUser', label: 'Invite User' },
  { key: 'roleManagement', label: 'Role Management' },
  { key: 'permissionsMatrix', label: 'Permissions Matrix' },
];

const localizationSubmenus: Array<{ key: LocalizationScreenKey; label: string }> = [
  { key: 'currencyList', label: 'Currency List' },
  { key: 'exchangeRates', label: 'Exchange Rates' },
  { key: 'baseCurrency', label: 'Base Currency' },
  { key: 'currencyFormat', label: 'Currency Format' },
  { key: 'taxTypes', label: 'Tax Types' },
  { key: 'taxRates', label: 'Tax Rates' },
  { key: 'taxRules', label: 'Tax Rules' },
  { key: 'taxGroups', label: 'Tax Groups' },
  { key: 'regionMapping', label: 'Region Mapping' },
  { key: 'languageSettings', label: 'Language Settings' },
  { key: 'defaultLanguage', label: 'Default Language' },
  { key: 'translationOverrides', label: 'Translation Overrides' },
  { key: 'labelCustomization', label: 'Label Customization' },
];

const subscriptionBillingSubmenus: Array<{ key: SubscriptionBillingScreenKey; label: string }> = [
  { key: 'planCatalog', label: 'Plan Catalog' },
  { key: 'subscriptionLifecycle', label: 'Subscription Lifecycle' },
  { key: 'billingCycles', label: 'Billing Cycles' },
  { key: 'invoiceGeneration', label: 'Invoice Generation' },
  { key: 'paymentTracking', label: 'Payment Tracking' },
];

const globalSettingsSubmenus: Array<{ key: GlobalSettingsScreenKey; label: string }> = [
  { key: 'numberingSeries', label: 'Numbering Series' },
  { key: 'documentTemplates', label: 'Document Templates' },
  { key: 'emailTemplates', label: 'Email Templates' },
  { key: 'notificationRules', label: 'Notification Rules' },
  { key: 'automation', label: 'Automation' },
];

const dashboardSubmenus: Array<{ key: DashboardScreenKey; label: string }> = [
  { key: 'overviewDashboard', label: 'Overview Dashboard' },
  { key: 'financialDashboard', label: 'Financial Dashboard' },
  { key: 'salesDashboard', label: 'Sales Dashboard' },
  { key: 'inventoryDashboard', label: 'Inventory Dashboard' },
];

const customersSubmenus: Array<{ key: CustomersScreenKey; label: string }> = [
  { key: 'customerList', label: 'Customer List' },
  { key: 'customerProfile', label: 'Customer Profile' },
  { key: 'customerLedger', label: 'Customer Ledger' },
  { key: 'customerTransactions', label: 'Customer Transactions' },
  { key: 'customerStatements', label: 'Customer Statements' },
];

const reportsSubmenus: Array<{ key: ReportsScreenKey; label: string }> = [
  { key: 'profitLoss', label: 'Profit & Loss' },
  { key: 'balance', label: 'Balance' },
  { key: 'cashflow', label: 'Cashflow' },
  { key: 'salesByPeriod', label: 'Sales by period' },
  { key: 'salesByProduct', label: 'Sales by product' },
  { key: 'salesByCurrency', label: 'Sales by currency' },
  { key: 'taxSummary', label: 'Tax summary' },
  { key: 'gstVatReport', label: 'GST/VAT report' },
  { key: 'regionTax', label: 'region tax' },
  { key: 'customerLedger', label: 'Customer ledger' },
  { key: 'vendorLedger', label: 'Vendor ledger' },
];

const inventorySubmenus: Array<{ key: InventoryScreenKey; label: string }> = [
  { key: 'stockList', label: 'Stock List' },
  { key: 'stockMovement', label: 'Stock Movement' },
  { key: 'warehouses', label: 'Warehouses' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'adjustments', label: 'Adjustments' },
];

const paymentsSubmenus: Array<{ key: PaymentsScreenKey; label: string }> = [
  { key: 'paymentReceived', label: 'Payment Received' },
  { key: 'allocateToInvoice', label: 'Allocate to Invoice' },
  { key: 'payBill', label: 'Pay Bill' },
  { key: 'paymentAllocation', label: 'Payment Allocation' },
];

const expensesSubmenus: Array<{ key: ExpensesScreenKey; label: string }> = [
  { key: 'expenseList', label: 'Expense List' },
  { key: 'addExpense', label: 'Add Expense' },
  { key: 'categories', label: 'Categories' },
  { key: 'recurringExpenses', label: 'Recurring Expenses' },
];

const purchasesSubmenus: Array<{ key: PurchasesScreenKey; label: string }> = [
  { key: 'poList', label: 'PO List' },
  { key: 'createPo', label: 'Create PO' },
  { key: 'poDetail', label: 'PO Detail' },
  { key: 'billList', label: 'Bill List' },
  { key: 'createBill', label: 'Create Bill' },
  { key: 'billDetail', label: 'Bill Detail' },
];

const salesSubmenus: Array<{ key: SalesScreenKey; label: string }> = [
  { key: 'quoteList', label: 'Quote List' },
  { key: 'createQuote', label: 'Create Quote' },
  { key: 'quoteDetail', label: 'Quote Detail' },
  { key: 'invoiceList', label: 'Invoice List' },
  { key: 'createInvoice', label: 'Create Invoice' },
  { key: 'invoiceDetail', label: 'Invoice Detail' },
  { key: 'recurringInvoice', label: 'Recurring Invoice' },
];

const invoicingSubmenus: Array<{ key: InvoicingScreenKey; label: string }> = [
  { key: 'invoiceList', label: 'Invoice List' },
  { key: 'createInvoice', label: 'Create Invoice' },
  { key: 'recurringInvoices', label: 'Recurring Invoices' },
  { key: 'creditNotes', label: 'Credit Notes' },
];

const accountingSubmenus: Array<{ key: AccountingScreenKey; label: string }> = [
  { key: 'chartOfAccounts', label: 'Chart of Accounts' },
  { key: 'journalEntries', label: 'Journal Entries' },
  { key: 'generalLedger', label: 'General Ledger' },
  { key: 'trialBalance', label: 'Trial Balance' },
];

const productsServicesSubmenus: Array<{ key: ProductsServicesScreenKey; label: string }> = [
  { key: 'productList', label: 'Product List' },
  { key: 'productDetail', label: 'Product Detail' },
  { key: 'categories', label: 'Categories' },
  { key: 'units', label: 'Units' },
  { key: 'pricing', label: 'Pricing' },
];

const recipesSubmenus: Array<{ key: RecipesScreenKey; label: string }> = [
  { key: 'recipeCatalog', label: 'Recipe Catalog' },
  { key: 'recipePlanner', label: 'Recipe Planner' },
];

const vendorsSubmenus: Array<{ key: VendorsScreenKey; label: string }> = [
  { key: 'vendorList', label: 'Vendor List' },
  { key: 'vendorProfile', label: 'Vendor Profile' },
  { key: 'vendorLedger', label: 'Vendor Ledger' },
  { key: 'purchaseHistory', label: 'Purchase History' },
  { key: 'vendorPayments', label: 'Vendor Payments' },
];

const submenusByMenu: Record<string, Array<{ key: string; label: string }>> = {
  'Tenant & Business': tenantBusinessSubmenus,
  'Users & Roles': usersRolesSubmenus,
  Localization: localizationSubmenus,
  'Subscription/Billing': subscriptionBillingSubmenus,
  Settings: globalSettingsSubmenus,
  Dashboard: dashboardSubmenus,
  Customers: customersSubmenus,
  Reports: reportsSubmenus,
  Inventory: inventorySubmenus,
  Payments: paymentsSubmenus,
  Expenses: expensesSubmenus,
  Purchases: purchasesSubmenus,
  Sales: salesSubmenus,
  Invoicing: invoicingSubmenus,
  Accounting: accountingSubmenus,
  'Products/Services': productsServicesSubmenus,
  Recipes: recipesSubmenus,
  Vendors: vendorsSubmenus,
};

const menuRouteSegments: Record<string, string> = {
  'Tenant & Business': 'tenant-business',
  'Users & Roles': 'users-roles',
  Localization: 'localization',
  'Subscription/Billing': 'subscription-billing',
  Settings: 'settings',
  Dashboard: 'dashboard',
  Customers: 'customers',
  Vendors: 'vendors',
  'Products/Services': 'products-services',
  Recipes: 'recipes',
  Sales: 'sales',
  Invoicing: 'invoicing',
  Accounting: 'accounting',
  Purchases: 'purchases',
  Expenses: 'expenses',
  Payments: 'payments',
  Inventory: 'inventory',
  Reports: 'reports',
};

const defaultMenu = 'Dashboard';

function toRouteSegment(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function getDefaultSubmenuKey(menu: string) {
  return submenusByMenu[menu]?.[0]?.key ?? '';
}

function buildPath(menu: string, submenuKey?: string) {
  const resolvedMenu = menuRouteSegments[menu] ? menu : defaultMenu;
  const candidateKey = submenuKey ?? getDefaultSubmenuKey(resolvedMenu);
  const resolvedSubmenu = submenusByMenu[resolvedMenu]?.some(
    (submenu) => submenu.key === candidateKey,
  )
    ? candidateKey
    : getDefaultSubmenuKey(resolvedMenu);

  return `/${menuRouteSegments[resolvedMenu]}/${toRouteSegment(resolvedSubmenu)}`;
}

function getRouteStateFromPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const matchedMenu =
    Object.entries(menuRouteSegments).find(([, routeSegment]) => routeSegment === segments[0])?.[0]
    ?? defaultMenu;
  const matchedSubmenu = submenusByMenu[matchedMenu]?.find(
    (submenu) => toRouteSegment(submenu.key) === segments[1],
  );

  return {
    menu: matchedMenu,
    submenuKey: matchedSubmenu?.key ?? getDefaultSubmenuKey(matchedMenu),
  };
}

function App() {
  const initialRoute =
    typeof window === 'undefined'
      ? { menu: defaultMenu, submenuKey: getDefaultSubmenuKey(defaultMenu) }
      : getRouteStateFromPath(window.location.pathname);
  const dispatch = useAppDispatch();
  const sessionUser = useAppSelector((state) => state.session.user);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  });
  const [authConfig, setAuthConfig] = useState<AuthConfigResponse | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState(initialRoute.menu);
  const [activeTenantSubmenu, setActiveTenantSubmenu] =
    useState<ScreenKey>(
      initialRoute.menu === 'Tenant & Business'
        ? (initialRoute.submenuKey as ScreenKey)
        : 'createBusiness',
    );
  const [activeUsersRolesSubmenu, setActiveUsersRolesSubmenu] =
    useState<UsersRolesScreenKey>(
      initialRoute.menu === 'Users & Roles'
        ? (initialRoute.submenuKey as UsersRolesScreenKey)
        : 'userList',
    );
  const [activeLocalizationSubmenu, setActiveLocalizationSubmenu] =
    useState<LocalizationScreenKey>(
      initialRoute.menu === 'Localization'
        ? (initialRoute.submenuKey as LocalizationScreenKey)
        : 'currencyList',
    );
  const [activeSubscriptionBillingSubmenu, setActiveSubscriptionBillingSubmenu] =
    useState<SubscriptionBillingScreenKey>(
      initialRoute.menu === 'Subscription/Billing'
        ? (initialRoute.submenuKey as SubscriptionBillingScreenKey)
        : 'planCatalog',
    );
  const [activeGlobalSettingsSubmenu, setActiveGlobalSettingsSubmenu] =
    useState<GlobalSettingsScreenKey>(
      initialRoute.menu === 'Settings'
        ? (initialRoute.submenuKey as GlobalSettingsScreenKey)
        : 'numberingSeries',
    );
  const [activeDashboardSubmenu, setActiveDashboardSubmenu] =
    useState<DashboardScreenKey>(
      initialRoute.menu === 'Dashboard'
        ? (initialRoute.submenuKey as DashboardScreenKey)
        : 'overviewDashboard',
    );
  const [activeCustomersSubmenu, setActiveCustomersSubmenu] =
    useState<CustomersScreenKey>(
      initialRoute.menu === 'Customers'
        ? (initialRoute.submenuKey as CustomersScreenKey)
        : 'customerList',
    );
  const [activeReportsSubmenu, setActiveReportsSubmenu] =
    useState<ReportsScreenKey>(
      initialRoute.menu === 'Reports'
        ? (initialRoute.submenuKey as ReportsScreenKey)
        : 'profitLoss',
    );
  const [activeInventorySubmenu, setActiveInventorySubmenu] =
    useState<InventoryScreenKey>(
      initialRoute.menu === 'Inventory'
        ? (initialRoute.submenuKey as InventoryScreenKey)
        : 'stockList',
    );
  const [activePaymentsSubmenu, setActivePaymentsSubmenu] =
    useState<PaymentsScreenKey>(
      initialRoute.menu === 'Payments'
        ? (initialRoute.submenuKey as PaymentsScreenKey)
        : 'paymentReceived',
    );
  const [activeExpensesSubmenu, setActiveExpensesSubmenu] =
    useState<ExpensesScreenKey>(
      initialRoute.menu === 'Expenses'
        ? (initialRoute.submenuKey as ExpensesScreenKey)
        : 'expenseList',
    );
  const [activePurchasesSubmenu, setActivePurchasesSubmenu] =
    useState<PurchasesScreenKey>(
      initialRoute.menu === 'Purchases'
        ? (initialRoute.submenuKey as PurchasesScreenKey)
        : 'poList',
    );
  const [activeSalesSubmenu, setActiveSalesSubmenu] =
    useState<SalesScreenKey>(
      initialRoute.menu === 'Sales'
        ? (initialRoute.submenuKey as SalesScreenKey)
        : 'quoteList',
    );
  const [activeInvoicingSubmenu, setActiveInvoicingSubmenu] =
    useState<InvoicingScreenKey>(
      initialRoute.menu === 'Invoicing'
        ? (initialRoute.submenuKey as InvoicingScreenKey)
        : 'invoiceList',
    );
  const [activeAccountingSubmenu, setActiveAccountingSubmenu] =
    useState<AccountingScreenKey>(
      initialRoute.menu === 'Accounting'
        ? (initialRoute.submenuKey as AccountingScreenKey)
        : 'chartOfAccounts',
    );
  const [activeProductsServicesSubmenu, setActiveProductsServicesSubmenu] =
    useState<ProductsServicesScreenKey>(
      initialRoute.menu === 'Products/Services'
        ? (initialRoute.submenuKey as ProductsServicesScreenKey)
        : 'productList',
    );
  const [activeRecipesSubmenu, setActiveRecipesSubmenu] =
    useState<RecipesScreenKey>(
      initialRoute.menu === 'Recipes'
        ? (initialRoute.submenuKey as RecipesScreenKey)
        : 'recipeCatalog',
    );
  const [activeVendorsSubmenu, setActiveVendorsSubmenu] =
    useState<VendorsScreenKey>(
      initialRoute.menu === 'Vendors'
        ? (initialRoute.submenuKey as VendorsScreenKey)
        : 'vendorList',
    );
  const userEmail = sessionUser?.email ?? 'Unknown user';
  const userName = sessionUser?.displayName ?? userEmail.split('@')[0] ?? 'User';
  const userInitial = (userName.trim().charAt(0) || 'U').toUpperCase();
 
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  }

  function handleModuleScreenChange(menu: string, screen: string) {
    if (activeMenu === menu && activeSubmenuByMenu[menu] === screen) {
      return;
    }

    navigateToMenu(menu, screen);
  }

  function renderModuleContent() {
    const content = moduleContentMap[activeMenu];

    if (activeMenu === 'Tenant & Business') {
      return (
        <TenantBusinessModule
          activeScreen={activeTenantSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Tenant & Business', screen)}
        />
      );
    }

    if (activeMenu === 'Users & Roles') {
      return (
        <UsersRolesModule
          activeScreen={activeUsersRolesSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Users & Roles', screen)}
        />
      );
    }

    if (activeMenu === 'Localization') {
      return (
        <LocalizationModule
          activeScreen={activeLocalizationSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Localization', screen)}
        />
      );
    }

    if (activeMenu === 'Subscription/Billing') {
      return (
        <SubscriptionBillingModule
          activeScreen={activeSubscriptionBillingSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Subscription/Billing', screen)}
        />
      );
    }

    if (activeMenu === 'Settings') {
      return (
        <GlobalSettingsModule
          activeScreen={activeGlobalSettingsSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Settings', screen)}
        />
      );
    }

    if (activeMenu === 'Dashboard') {
      return (
        <DashboardModule
          activeScreen={activeDashboardSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Dashboard', screen)}
        />
      );
    }

    if (activeMenu === 'Customers') {
      return (
        <CustomersModule
          activeScreen={activeCustomersSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Customers', screen)}
        />
      );
    }

    if (activeMenu === 'Reports') {
      return (
        <ReportsModule
          activeScreen={activeReportsSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Reports', screen)}
        />
      );
    }

    if (activeMenu === 'Inventory') {
      return (
        <InventoryModule
          activeScreen={activeInventorySubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Inventory', screen)}
        />
      );
    }

    if (activeMenu === 'Payments') {
      return (
        <PaymentsModule
          activeScreen={activePaymentsSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Payments', screen)}
        />
      );
    }

    if (activeMenu === 'Expenses') {
      return (
        <ExpensesModule
          activeScreen={activeExpensesSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Expenses', screen)}
        />
      );
    }

    if (activeMenu === 'Purchases') {
      return (
        <PurchasesModule
          activeScreen={activePurchasesSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Purchases', screen)}
        />
      );
    }

    if (activeMenu === 'Sales') {
      return (
        <SalesModule
          activeScreen={activeSalesSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Sales', screen)}
        />
      );
    }

    if (activeMenu === 'Invoicing') {
      return (
        <InvoicingModule
          activeScreen={activeInvoicingSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Invoicing', screen)}
        />
      );
    }

    if (activeMenu === 'Accounting') {
      return (
        <AccountingModule
          activeScreen={activeAccountingSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Accounting', screen)}
        />
      );
    }

    if (activeMenu === 'Products/Services') {
      return (
        <ProductsServicesModule
          activeScreen={activeProductsServicesSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Products/Services', screen)}
        />
      );
    }

    if (activeMenu === 'Recipes') {
      return (
        <RecipesModule
          activeScreen={activeRecipesSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Recipes', screen)}
        />
      );
    }

    if (activeMenu === 'Vendors') {
      return (
        <VendorsModule
          activeScreen={activeVendorsSubmenu}
          onScreenChange={(screen) => handleModuleScreenChange('Vendors', screen)}
        />
      );
    }

    if (!content) {
      return (
        <>
          <h1 className="page-title mb-2">{activeMenu}</h1>
          <p className="text-secondary mb-0">Module details are coming soon.</p>
        </>
      );
    }

    return (
      <>
        <h1 className="page-title mb-2">{content.heading}</h1>
        <p className="text-secondary mb-4">{content.description}</p>
        <Row className="g-3">
          {content.sections.map((section) => (
            <Col key={section.title} xs={12} lg={6}>
              <Card className="border-0 bg-light-subtle h-100">
                <Card.Body>
                  <div className="small text-uppercase text-secondary fw-semibold mb-2">
                    {section.title}
                  </div>
                  <ul className="module-list mb-0">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </>
    );
  }

  useEffect(() => {
    let isMounted = true;

    async function loadAuthConfig() {
      try {
        const config = await fetchAuthConfig();
        if (!isMounted) {
          return;
        }

        setAuthConfig(config);
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }

        const details =
          error instanceof Error
            ? error.message
            : 'Unknown error while loading auth configuration.';

        setConfigError(
          `Unable to load authentication settings. ${details}`,
        );
      } finally {
        if (isMounted) {
          setIsLoadingConfig(false);
        }
      }
    }

    void loadAuthConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleGoogleLogin() {
    if (!authConfig) {
      return;
    }

    setIsSigningIn(true);
    setAuthError(null);

    try {
      const credential = await signInWithGoogle(authConfig.firebase);
      dispatch(
        setSessionUser({
          uid: credential.user.uid,
          email: credential.user.email ?? 'Unknown user',
          displayName: credential.user.displayName,
          photoURL: credential.user.photoURL,
        }),
      );
    } catch {
      setAuthError('Google sign-in failed. Please verify Firebase auth settings.');
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleSignOut() {
    if (!authConfig) {
      return;
    }

    await signOutUser(authConfig.firebase);
    dispatch(clearSessionUser());
  }

  const activeSubmenuByMenu: Record<string, string> = {
    'Tenant & Business': activeTenantSubmenu,
    'Users & Roles': activeUsersRolesSubmenu,
    Localization: activeLocalizationSubmenu,
    'Subscription/Billing': activeSubscriptionBillingSubmenu,
    Settings: activeGlobalSettingsSubmenu,
    Dashboard: activeDashboardSubmenu,
    Customers: activeCustomersSubmenu,
    Reports: activeReportsSubmenu,
    Inventory: activeInventorySubmenu,
    Payments: activePaymentsSubmenu,
    Expenses: activeExpensesSubmenu,
    Purchases: activePurchasesSubmenu,
    Sales: activeSalesSubmenu,
    Invoicing: activeInvoicingSubmenu,
    Accounting: activeAccountingSubmenu,
    'Products/Services': activeProductsServicesSubmenu,
    Recipes: activeRecipesSubmenu,
    Vendors: activeVendorsSubmenu,
  };

  function setSubmenu(menu: string, key: string) {
    if (menu === 'Tenant & Business') setActiveTenantSubmenu(key as ScreenKey);
    if (menu === 'Users & Roles') setActiveUsersRolesSubmenu(key as UsersRolesScreenKey);
    if (menu === 'Localization') setActiveLocalizationSubmenu(key as LocalizationScreenKey);
    if (menu === 'Subscription/Billing') {
      setActiveSubscriptionBillingSubmenu(key as SubscriptionBillingScreenKey);
    }
    if (menu === 'Settings') setActiveGlobalSettingsSubmenu(key as GlobalSettingsScreenKey);
    if (menu === 'Dashboard') setActiveDashboardSubmenu(key as DashboardScreenKey);
    if (menu === 'Customers') setActiveCustomersSubmenu(key as CustomersScreenKey);
    if (menu === 'Reports') setActiveReportsSubmenu(key as ReportsScreenKey);
    if (menu === 'Inventory') setActiveInventorySubmenu(key as InventoryScreenKey);
    if (menu === 'Payments') setActivePaymentsSubmenu(key as PaymentsScreenKey);
    if (menu === 'Expenses') setActiveExpensesSubmenu(key as ExpensesScreenKey);
    if (menu === 'Purchases') setActivePurchasesSubmenu(key as PurchasesScreenKey);
    if (menu === 'Sales') setActiveSalesSubmenu(key as SalesScreenKey);
    if (menu === 'Invoicing') setActiveInvoicingSubmenu(key as InvoicingScreenKey);
    if (menu === 'Accounting') setActiveAccountingSubmenu(key as AccountingScreenKey);
    if (menu === 'Products/Services') {
      setActiveProductsServicesSubmenu(key as ProductsServicesScreenKey);
    }
    if (menu === 'Recipes') setActiveRecipesSubmenu(key as RecipesScreenKey);
    if (menu === 'Vendors') setActiveVendorsSubmenu(key as VendorsScreenKey);
  }

  function applyRouteState(menu: string, submenuKey: string) {
    setActiveMenu(menu);
    setSubmenu(menu, submenuKey);
  }

  function navigateToMenu(menu: string, submenuKey?: string) {
    const resolvedSubmenu = submenuKey ?? getDefaultSubmenuKey(menu);
    applyRouteState(menu, resolvedSubmenu);

    const nextPath = buildPath(menu, resolvedSubmenu);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
  }

  useEffect(() => {
    const route = getRouteStateFromPath(window.location.pathname);
    const normalizedPath = buildPath(route.menu, route.submenuKey);

    if (window.location.pathname !== normalizedPath) {
      window.history.replaceState(null, '', normalizedPath);
    }

    function handlePopState() {
      const nextRoute = getRouteStateFromPath(window.location.pathname);
      applyRouteState(nextRoute.menu, nextRoute.submenuKey);
    }

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  if (isLoadingConfig) {
    return (
      <div className="loading-screen" data-bs-theme={theme}>
        <Card className="border-0 shadow-sm px-4 py-3">
          <div className="d-flex align-items-center gap-2 text-secondary">
            <Spinner size="sm" animation="border" />
            <span>Loading authentication...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (configError || !authConfig) {
    return (
      <div className="loading-screen" data-bs-theme={theme}>
        <Alert variant="danger" className="mb-0">
          {configError ?? 'Authentication configuration is missing.'}
        </Alert>
      </div>
    );
  }

  if (!sessionUser) {
    return (
      <div className="login-screen" data-bs-theme={theme}>
        <Container className="py-4 py-md-5">
          <LoginCard
            isLoading={isSigningIn}
            error={authError}
            onGoogleLogin={handleGoogleLogin}
          />
        </Container>
      </div>
    );
  }

  return (
    <div className="app-shell" data-bs-theme={theme}>
      <Navbar expand="md" className="app-header border-bottom">
        <Container fluid className="px-3 px-md-4">
          <Navbar.Brand className="d-flex align-items-center gap-2 fw-semibold">
            <span className="logo-box">S</span>
            <span>SharvSuite</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="topbar-nav" />
          <Navbar.Collapse id="topbar-nav" className="justify-content-end">
            <div className="d-flex align-items-center gap-2 mt-3 mt-md-0 user-profile-wrap">
              <Button
                variant="outline-secondary"
                size="sm"
                className="theme-toggle-btn"
                onClick={toggleTheme}
              >
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </Button>
              <div className="user-profile-card">
                {sessionUser?.photoURL ? (
                  <img src={sessionUser.photoURL} alt={userName} className="user-avatar-image" />
                ) : (
                  <span className="user-avatar-fallback" aria-hidden="true">
                    {userInitial}
                  </span>
                )}
                <div className="user-meta">
                  <div className="user-name">{userName}</div>
                  <div className="user-email">{userEmail}</div>
                </div>
              </div>
              <Button
                variant="outline-danger"
                size="sm"
                className="logout-btn"
                onClick={() => {
                  void handleSignOut();
                }}
              >
                Logout
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container fluid className="flex-grow-1 py-3 py-md-4 px-3 px-md-4">
        <Row className="g-3 g-md-4">
          <Col xs={12} md={4} lg={3}>
            <Card className="h-100 border-0 shadow-sm sidebar-card">
              <Card.Body className="p-2 p-md-3 sidebar-body">
                <div className="sidebar-title">Workspace Navigation</div>
                <Nav
                  className="flex-column nav-scroll sidebar-nav"
                  variant="pills"
                  activeKey={activeMenu}
                >
                  {moduleGroups.map((group) => (
                    <div key={group.title} className="module-group">
                      <div className="module-group-title">{group.title}</div>
                      {group.items.map((menu) => {
                        const isFuture = Boolean(group.future);
                        const submenus = submenusByMenu[menu];
                        const activeSubmenu = activeSubmenuByMenu[menu];

                        return (
                          <div key={menu}>
                            <Nav.Item>
                              <Nav.Link
                                eventKey={menu}
                                className="menu-link"
                                disabled={isFuture}
                                onClick={() => {
                                  if (isFuture) {
                                    return;
                                  }
                                  navigateToMenu(menu);
                                }}
                              >
                                <span className="menu-link-content">
                                  <span className="menu-icon" aria-hidden="true">
                                    {menuIcons[menu] ?? '•'}
                                  </span>
                                  <span className="menu-label">{menu}</span>
                                  {isFuture ? (
                                    <span className="menu-future-badge">Future</span>
                                  ) : null}
                                </span>
                              </Nav.Link>
                            </Nav.Item>

                            {!isFuture && activeMenu === menu && submenus ? (
                              <div className="submenu-wrap">
                                {submenus.map((submenu) => (
                                  <button
                                    key={submenu.key}
                                    type="button"
                                    className={`submenu-link ${activeSubmenu === submenu.key ? 'active' : ''}`}
                                    onClick={() => {
                                      navigateToMenu(menu, submenu.key);
                                    }}
                                  >
                                    {submenu.label}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} md={8} lg={9}>
            <Card className="border-0 shadow-sm h-100">
              <Card.Body className="p-3 p-md-4">
                {renderModuleContent()}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      <footer className="app-footer border-top">
        <Container fluid className="py-3 px-3 px-md-4 d-flex justify-content-between text-secondary small">
          <span>SharvSuite SaaS Platform</span>
          <span>React Bootstrap + ASP.NET Core</span>
        </Container>
      </footer>
    </div>
  );
}

export default App;


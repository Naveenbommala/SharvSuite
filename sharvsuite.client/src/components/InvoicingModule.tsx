import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { apiFetch } from '../apiClient';
import CreateInvoiceComposer from './CreateInvoiceComposer';
import CustomerTypeahead from './CustomerTypeahead';

export type InvoicingScreenKey =
  | 'invoiceList'
  | 'createInvoice'
  | 'recurringInvoices'
  | 'creditNotes';

type FieldType = 'text' | 'select' | 'date' | 'number' | 'textarea';

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  lookup?: 'customer';
};

type ScreenConfig = {
  key: InvoicingScreenKey;
  title: string;
  endpoint: string;
  fields: FieldConfig[];
  tableFields: string[];
};

type CrudRow = {
  id: string;
  values: Record<string, string>;
};

type RowsState = Record<InvoicingScreenKey, CrudRow[]>;

type InvoicingModuleProps = {
  activeScreen?: InvoicingScreenKey;
  onScreenChange?: (screen: InvoicingScreenKey) => void;
};

type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: string;
  rate: string;
};

type InvoiceComposerState = {
  logoName: string;
  billedBy: string;
  paymentInstructions: string;
  termsAndConditions: string;
  signatureName: string;
  attachmentNames: string[];
  discountMode: 'fixed' | 'percent';
  discountValue: string;
  taxMode: 'fixed' | 'percent';
  taxValue: string;
  taxLabel: string;
  lineItems: InvoiceLineItem[];
};

const screenConfigs: ScreenConfig[] = [
  {
    key: 'invoiceList',
    title: 'Invoice List',
    endpoint: 'invoice-list',
    fields: [
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true, lookup: 'customer' },
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
      { name: 'dueDate', label: 'Due Date', type: 'date' },
      { name: 'currency', label: 'Currency', type: 'text', required: true },
      { name: 'grandTotal', label: 'Grand Total', type: 'number', required: true },
      { name: 'balanceDue', label: 'Balance Due', type: 'number' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Overdue', 'Void'],
        required: true,
      },
    ],
    tableFields: ['invoiceNumber', 'customerName', 'invoiceDate', 'dueDate', 'grandTotal', 'status'],
  },
  {
    key: 'createInvoice',
    title: 'Create Invoice',
    endpoint: 'create-invoice',
    fields: [
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
      { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true, lookup: 'customer' },
      { name: 'customerEmail', label: 'Customer Email', type: 'text' },
      { name: 'billingAddress', label: 'Billing Address', type: 'textarea' },
      { name: 'shippingAddress', label: 'Shipping Address', type: 'textarea' },
      { name: 'currency', label: 'Currency', type: 'text', required: true },
      { name: 'exchangeRate', label: 'Exchange Rate', type: 'number' },
      {
        name: 'paymentTerms',
        label: 'Payment Terms',
        type: 'select',
        options: ['Due on Receipt', 'Net 7', 'Net 15', 'Net 30'],
      },
      { name: 'lineItems', label: 'Line Items (JSON/text)', type: 'textarea', required: true },
      { name: 'subTotal', label: 'Sub Total', type: 'number', required: true },
      { name: 'discountTotal', label: 'Discount Total', type: 'number' },
      { name: 'taxTotal', label: 'Tax Total', type: 'number' },
      { name: 'shippingFee', label: 'Shipping Fee', type: 'number' },
      { name: 'grandTotal', label: 'Grand Total', type: 'number', required: true },
      { name: 'notes', label: 'Customer Notes', type: 'textarea' },
      { name: 'internalMemo', label: 'Internal Memo', type: 'textarea' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['Draft', 'Ready', 'Sent', 'Paid'],
        required: true,
      },
    ],
    tableFields: ['invoiceNumber', 'customerName', 'invoiceDate', 'dueDate', 'grandTotal', 'status'],
  },
  {
    key: 'recurringInvoices',
    title: 'Recurring Invoices',
    endpoint: 'recurring-invoices',
    fields: [
      { name: 'templateName', label: 'Template Name', type: 'text', required: true },
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true, lookup: 'customer' },
      { name: 'frequency', label: 'Frequency', type: 'select', options: ['Weekly', 'Monthly', 'Quarterly', 'Yearly'], required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'nextRunDate', label: 'Next Run Date', type: 'date' },
      { name: 'currency', label: 'Currency', type: 'text' },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'autoSend', label: 'Auto Send', type: 'select', options: ['Yes', 'No'] },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['Active', 'Paused', 'Completed', 'Cancelled'],
        required: true,
      },
    ],
    tableFields: ['templateName', 'customerName', 'frequency', 'nextRunDate', 'amount', 'status'],
  },
  {
    key: 'creditNotes',
    title: 'Credit Notes',
    endpoint: 'credit-notes',
    fields: [
      { name: 'creditNoteNumber', label: 'Credit Note Number', type: 'text', required: true },
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true, lookup: 'customer' },
      { name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
      { name: 'reason', label: 'Reason', type: 'textarea', required: true },
      { name: 'currency', label: 'Currency', type: 'text', required: true },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['Draft', 'Issued', 'Applied', 'Cancelled'],
        required: true,
      },
    ],
    tableFields: ['creditNoteNumber', 'invoiceNumber', 'customerName', 'issueDate', 'amount', 'status'],
  },
];

const screenByKey = screenConfigs.reduce((acc, config) => {
  acc[config.key] = config;
  return acc;
}, {} as Record<InvoicingScreenKey, ScreenConfig>);

function buildInvoiceNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sequence = Math.floor(Math.random() * 900 + 100);
  return `INV-${stamp}-${sequence}`;
}

function addDays(dateValue: string, days: number): string {
  const source = dateValue ? new Date(`${dateValue}T00:00:00`) : new Date();
  source.setDate(source.getDate() + days);
  return source.toISOString().slice(0, 10);
}

function createLineItem(overrides?: Partial<InvoiceLineItem>): InvoiceLineItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    description: '',
    quantity: '1',
    rate: '0',
    ...overrides,
  };
}

function defaultInvoiceComposerState(): InvoiceComposerState {
  return {
    logoName: '',
    billedBy: '',
    paymentInstructions: '',
    termsAndConditions: '',
    signatureName: '',
    attachmentNames: [],
    discountMode: 'fixed',
    discountValue: '',
    taxMode: 'percent',
    taxValue: '',
    taxLabel: 'GST / VAT',
    lineItems: [createLineItem()],
  };
}

function initialRowsState(): RowsState {
  return screenConfigs.reduce((acc, cfg) => {
    acc[cfg.key] = [];
    return acc;
  }, {} as RowsState);
}

function defaultValues(config: ScreenConfig): Record<string, string> {
  const values = config.fields.reduce((acc, field) => {
    if (field.type === 'select' && field.options && field.options.length > 0) {
      acc[field.name] = field.options[0];
      return acc;
    }
    acc[field.name] = '';
    return acc;
  }, {} as Record<string, string>);

  if (config.fields.some((field) => field.lookup === 'customer')) {
    values.customerId = '';
  }

  return values;
}

function fieldCodes(config: ScreenConfig): Array<{ code: string; fieldName: string }> {
  return config.fields
    .filter((x) => x.name !== config.fields[0].name && x.name !== 'status')
    .map((field, idx) => ({ code: idx.toString(36), fieldName: field.name }));
}

function splitPacked(value: string): [string, string, string] {
  return [value.slice(0, 200), value.slice(200, 400), value.slice(400, 600)];
}

function parseDecimal(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoneyValue(value: number): string {
  return value.toFixed(2);
}

function parseStoredLineItems(value: string): InvoiceLineItem[] {
  if (!value.trim()) {
    return [createLineItem()];
  }

  try {
    const parsed = JSON.parse(value) as Array<Record<string, unknown>>;
    const items = parsed
      .map((item) =>
        createLineItem({
          description: String(item.d ?? item.description ?? ''),
          quantity: String(item.q ?? item.quantity ?? '1'),
          rate: String(item.r ?? item.rate ?? '0'),
        }),
      )
      .filter((item) => item.description.trim() || parseDecimal(item.quantity) || parseDecimal(item.rate));

    return items.length > 0 ? items : [createLineItem()];
  } catch {
    return [createLineItem({ description: value })];
  }
}

function parseStoredInvoiceMeta(value: string): Partial<InvoiceComposerState> {
  if (!value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return {
      logoName: String(parsed.lg ?? ''),
      billedBy: String(parsed.bb ?? ''),
      paymentInstructions: String(parsed.pi ?? ''),
      termsAndConditions: String(parsed.tc ?? ''),
      signatureName: String(parsed.sg ?? ''),
      attachmentNames: Array.isArray(parsed.at) ? parsed.at.map((item) => String(item)) : [],
      discountMode: parsed.dm === 'percent' ? 'percent' : 'fixed',
      discountValue: String(parsed.dv ?? ''),
      taxMode: parsed.tm === 'fixed' ? 'fixed' : 'percent',
      taxValue: String(parsed.tv ?? ''),
      taxLabel: String(parsed.tl ?? 'GST / VAT'),
    };
  } catch {
    return {};
  }
}

function invoiceComposerFromValues(values: Record<string, string>): InvoiceComposerState {
  const defaults = defaultInvoiceComposerState();
  const meta = parseStoredInvoiceMeta(values.internalMemo ?? '');
  return {
    ...defaults,
    ...meta,
    lineItems: parseStoredLineItems(values.lineItems ?? ''),
  };
}

function normalizeCreateInvoiceValues(
  values: Record<string, string>,
  composer: InvoiceComposerState,
): Record<string, string> {
  const compactLineItems = composer.lineItems
    .map((item) => {
      const quantity = parseDecimal(item.quantity);
      const rate = parseDecimal(item.rate);
      const amount = quantity * rate;
      return {
        d: item.description.trim(),
        q: quantity,
        r: rate,
        a: Number(amount.toFixed(2)),
      };
    })
    .filter((item) => item.d || item.q || item.r);

  const subTotal = compactLineItems.reduce((sum, item) => sum + item.a, 0);
  const shippingFee = parseDecimal(values.shippingFee ?? '');
  const discountBase =
    composer.discountMode === 'percent'
      ? (subTotal * parseDecimal(composer.discountValue)) / 100
      : parseDecimal(composer.discountValue);
  const discountTotal = Math.min(subTotal, Math.max(discountBase, 0));
  const taxableAmount = Math.max(subTotal - discountTotal, 0);
  const taxBase =
    composer.taxMode === 'percent'
      ? (taxableAmount * parseDecimal(composer.taxValue)) / 100
      : parseDecimal(composer.taxValue);
  const taxTotal = Math.max(taxBase, 0);
  const grandTotal = taxableAmount + taxTotal + shippingFee;

  return {
    ...values,
    lineItems: compactLineItems.length > 0 ? JSON.stringify(compactLineItems) : '',
    subTotal: formatMoneyValue(subTotal),
    discountTotal: formatMoneyValue(discountTotal),
    taxTotal: formatMoneyValue(taxTotal),
    grandTotal: formatMoneyValue(grandTotal),
    internalMemo: JSON.stringify({
      lg: composer.logoName,
      bb: composer.billedBy,
      pi: composer.paymentInstructions,
      tc: composer.termsAndConditions,
      sg: composer.signatureName,
      at: composer.attachmentNames,
      dm: composer.discountMode,
      dv: composer.discountValue,
      tm: composer.taxMode,
      tv: composer.taxValue,
      tl: composer.taxLabel,
    }),
  };
}

function decodeRecord(config: ScreenConfig, record: Record<string, unknown>): Record<string, string> {
  const values = defaultValues(config);
  const primaryName = config.fields[0].name;
  values[primaryName] = String(record.primaryField ?? '');
  values.status = String(record.status ?? values.status ?? 'Active');
  values.customerId = String(record.customerId ?? '');

  const packed = `${String(record.secondaryField ?? '')}${String(record.tertiaryField ?? '')}${String(record.quaternaryField ?? '')}`;
  if (!packed) {
    return values;
  }

  try {
    const parsed = JSON.parse(packed) as Record<string, string>;
    const mapping = fieldCodes(config);
    mapping.forEach(({ code, fieldName }) => {
      if (parsed[code] !== undefined) {
        values[fieldName] = parsed[code];
      }
    });
  } catch {
    // Keep defaults for legacy/unparseable records.
  }

  return values;
}

function encodeRequestBody(config: ScreenConfig, values: Record<string, string>): {
  primaryField: string;
  secondaryField: string;
  tertiaryField: string;
  quaternaryField: string;
  status: string;
  customerId: string | null;
} {
  const primaryName = config.fields[0].name;
  const compact: Record<string, string> = {};
  fieldCodes(config).forEach(({ code, fieldName }) => {
    const value = (values[fieldName] ?? '').trim();
    if (value.length > 0) {
      compact[code] = value;
    }
  });

  const packed = JSON.stringify(compact);
  if (packed.length > 600) {
    throw new Error('Form data is too large to save. Please shorten long text fields.');
  }

  const [secondaryField, tertiaryField, quaternaryField] = splitPacked(packed);
  return {
    primaryField: (values[primaryName] ?? '').trim(),
    secondaryField,
    tertiaryField,
    quaternaryField,
    status: (values.status ?? 'Active').trim(),
    customerId: values.customerId?.trim() || null,
  };
}

function InvoicingModule({ activeScreen }: InvoicingModuleProps) {
  const [activeTab, setActiveTab] = useState<InvoicingScreenKey>(activeScreen ?? 'invoiceList');
  const [rowsByScreen, setRowsByScreen] = useState<RowsState>(initialRowsState);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [invoiceComposer, setInvoiceComposer] = useState<InvoiceComposerState>(defaultInvoiceComposerState);
  const [saveError, setSaveError] = useState<string | null>(null);

  const config = useMemo(() => screenByKey[activeTab] ?? screenConfigs[0], [activeTab]);
  const rows = rowsByScreen[config.key];
  const tableFields = useMemo(
    () => config.tableFields.map((name) => config.fields.find((x) => x.name === name)).filter((x): x is FieldConfig => Boolean(x)),
    [config],
  );
  const resolvedCreateInvoiceValues = useMemo(
    () => (config.key === 'createInvoice' ? normalizeCreateInvoiceValues(formValues, invoiceComposer) : formValues),
    [config.key, formValues, invoiceComposer],
  );

  useEffect(() => {
    if (activeScreen && activeScreen !== activeTab) {
      setActiveTab(activeScreen);
    }
  }, [activeScreen, activeTab]);

  async function loadRows() {
    const response = await apiFetch(`/api/invoicing/${config.endpoint}`);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const json = (await response.json()) as Array<Record<string, unknown>>;
    setRowsByScreen((prev) => ({
      ...prev,
      [config.key]: json.map((item) => ({
        id: String(item.id),
        values: decodeRecord(config, item),
      })),
    }));
  }

  useEffect(() => {
    let mounted = true;
    setLoadingRows(true);
    setRowsError(null);
    void loadRows()
      .catch((error: unknown) => {
        if (!mounted) return;
        const details = error instanceof Error ? error.message : 'Unknown error';
        setRowsError(`Failed to load ${config.title}. ${details}`);
      })
      .finally(() => {
        if (mounted) setLoadingRows(false);
      });

    return () => {
      mounted = false;
    };
  }, [config]);

  function openCreateModal() {
    setMode('create');
    setEditingId(null);
    const defaults = defaultValues(config);
    if (config.key === 'createInvoice') {
      const today = new Date().toISOString().slice(0, 10);
      defaults.invoiceNumber = buildInvoiceNumber();
      defaults.invoiceDate = today;
      defaults.dueDate = addDays(today, 30);
      defaults.currency = defaults.currency || 'USD';
      defaults.exchangeRate = defaults.exchangeRate || '1';
      defaults.shippingFee = defaults.shippingFee || '0';
      defaults.notes = defaults.notes || 'Thank you for your business.';
      defaults.paymentTerms = defaults.paymentTerms || 'Net 30';
      setInvoiceComposer(defaultInvoiceComposerState());
    }
    setFormValues(defaults);
    setSaveError(null);
    setShowModal(true);
  }

  function openEditModal(row: CrudRow) {
    setMode('edit');
    setEditingId(row.id);
    setFormValues({ ...row.values });
    if (config.key === 'createInvoice') {
      setInvoiceComposer(invoiceComposerFromValues(row.values));
    }
    setSaveError(null);
    setShowModal(true);
  }

  function validateRequired(): boolean {
    const values = config.key === 'createInvoice' ? resolvedCreateInvoiceValues : formValues;
    return config.fields
      .filter((field) => field.required)
      .every((field) =>
        field.lookup === 'customer'
          ? (values.customerId ?? '').trim().length > 0
          : (values[field.name] ?? '').trim().length > 0,
      );
  }

  async function handleSave() {
    if (!validateRequired()) {
      setSaveError('Please fill all required fields.');
      return;
    }

    setSaveError(null);

    try {
      const payloadValues = config.key === 'createInvoice' ? resolvedCreateInvoiceValues : formValues;
      const endpoint = `/api/invoicing/${config.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;
      const response = await apiFetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encodeRequestBody(config, payloadValues)),
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      await loadRows();
      setShowModal(false);
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      setSaveError(`Unable to save record. ${details}`);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Delete this record?');
    if (!confirmed) return;

    try {
      const response = await apiFetch(`/api/invoicing/${config.endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      await loadRows();
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      setRowsError(`Unable to delete record. ${details}`);
    }
  }

  function updateComposer(patch: Partial<InvoiceComposerState>) {
    setInvoiceComposer((prev) => ({ ...prev, ...patch }));
  }

  function updateLineItem(lineItemId: string, key: keyof InvoiceLineItem, value: string) {
    setInvoiceComposer((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) => (item.id === lineItemId ? { ...item, [key]: value } : item)),
    }));
  }

  function addLineItem() {
    setInvoiceComposer((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, createLineItem()],
    }));
  }

  function removeLineItem(lineItemId: string) {
    setInvoiceComposer((prev) => ({
      ...prev,
      lineItems: prev.lineItems.length > 1
        ? prev.lineItems.filter((item) => item.id !== lineItemId)
        : [createLineItem()],
    }));
  }

  function handleLogoUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    if (file.size > 1024 * 1024) {
      setSaveError('Logo must be under 1MB.');
      return;
    }

    setSaveError(null);
    updateComposer({ logoName: file.name });
  }

  function handleSignatureUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    updateComposer({ signatureName: file.name });
  }

  function handleAttachmentUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    updateComposer({ attachmentNames: Array.from(fileList).map((file) => file.name) });
  }

  function previewInvoicePdf() {
    const previewWindow = window.open('', '_blank', 'width=1100,height=900');
    if (!previewWindow) {
      setSaveError('Unable to open preview window. Please allow pop-ups and try again.');
      return;
    }

    const values = resolvedCreateInvoiceValues;
    const rowsMarkup = invoiceComposer.lineItems
      .filter((item) => item.description.trim() || parseDecimal(item.quantity) || parseDecimal(item.rate))
      .map((item) => {
        const quantity = parseDecimal(item.quantity);
        const rate = parseDecimal(item.rate);
        const amount = quantity * rate;
        return `<tr><td>${item.description || '&nbsp;'}</td><td>${quantity.toFixed(2)}</td><td>${rate.toFixed(2)}</td><td>${amount.toFixed(2)}</td></tr>`;
      })
      .join('');

    previewWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8" /><title>${values.invoiceNumber}</title><style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
      .head { display:flex; justify-content:space-between; margin-bottom:24px; }
      .logo { width:90px; height:90px; border:1px dashed #cbd5e1; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#64748b; }
      .card { border:1px solid #e2e8f0; border-radius:14px; padding:16px; margin-bottom:16px; }
      table { width:100%; border-collapse:collapse; margin:16px 0; }
      th, td { border:1px solid #e2e8f0; padding:10px; text-align:left; }
      th { background:#eef4ff; }
      .summary { width:320px; margin-left:auto; }
      .row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #e2e8f0; }
      .total { font-size:18px; font-weight:700; }
      .muted { color:#64748b; white-space:pre-wrap; }
    </style></head><body>
      <div class="head"><div class="logo">${invoiceComposer.logoName || 'Logo'}</div><div style="text-align:right;"><h1 style="margin:0;">Invoice</h1><div class="muted">Invoice #: ${values.invoiceNumber}</div><div class="muted">Issue Date: ${values.invoiceDate || '-'}</div><div class="muted">Due Date: ${values.dueDate || '-'}</div></div></div>
      <div class="card"><strong>Billed By</strong><div class="muted">${invoiceComposer.billedBy || '-'}</div></div>
      <div class="card"><strong>Billed To</strong><div class="muted">${values.customerName || '-'}</div><div class="muted">${values.customerEmail || '-'}</div><div class="muted">${values.billingAddress || '-'}</div></div>
      <table><thead><tr><th>Description</th><th>Qty / Hours</th><th>Rate</th><th>Amount</th></tr></thead><tbody>${rowsMarkup || '<tr><td colspan="4">No line items.</td></tr>'}</tbody></table>
      <div class="summary">
        <div class="row"><span>Subtotal</span><span>${values.currency || 'USD'} ${values.subTotal}</span></div>
        <div class="row"><span>Discount</span><span>${values.currency || 'USD'} ${values.discountTotal}</span></div>
        <div class="row"><span>${invoiceComposer.taxLabel || 'Tax'}</span><span>${values.currency || 'USD'} ${values.taxTotal}</span></div>
        <div class="row"><span>Shipping</span><span>${values.currency || 'USD'} ${values.shippingFee || '0.00'}</span></div>
        <div class="row total"><span>Total Due</span><span>${values.currency || 'USD'} ${values.grandTotal}</span></div>
      </div>
      <div class="card"><strong>Payment Instructions</strong><div class="muted">${invoiceComposer.paymentInstructions || '-'}</div></div>
      <div class="card"><strong>Notes & Terms</strong><div class="muted">${values.notes || invoiceComposer.termsAndConditions || '-'}</div></div>
    </body></html>`);
    previewWindow.document.close();
    previewWindow.focus();
  }

  async function sendOrShareInvoice() {
    const values = resolvedCreateInvoiceValues;
    const summary = `Invoice ${values.invoiceNumber} for ${values.customerName} totals ${values.currency || 'USD'} ${values.grandTotal}. Due on ${values.dueDate}.`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Invoice ${values.invoiceNumber}`, text: summary });
        return;
      } catch {
        // Fall back to email below when share is cancelled or unsupported.
      }
    }

    const mailto = `mailto:${encodeURIComponent(values.customerEmail ?? '')}?subject=${encodeURIComponent(`Invoice ${values.invoiceNumber}`)}&body=${encodeURIComponent(summary)}`;
    window.location.href = mailto;
  }

  return (
    <>
      <h1 className="page-title mb-2">Invoicing</h1>
      <p className="text-secondary mb-3">
        Manage invoice lifecycle with detailed billing, line-item, tax, and recurring invoice fields.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{config.title}</h2>
                  <div className="text-secondary small">Invoice Management</div>
                </div>
                <Button
                  onClick={openCreateModal}
                  style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                >
                  Add Record
                </Button>
              </div>

              {rowsError ? <div className="alert alert-danger py-2 small">{rowsError}</div> : null}

              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    {tableFields.map((field) => (
                      <th key={field.name}>{field.label}</th>
                    ))}
                    <th style={{ width: '130px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRows ? (
                    <tr>
                      <td colSpan={tableFields.length + 1} className="text-center py-4 text-secondary">
                        <Spinner size="sm" animation="border" className="me-2" />
                        Loading records...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={tableFields.length + 1} className="text-center py-4 text-secondary">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id}>
                        {tableFields.map((field) => (
                          <td key={`${row.id}-${field.name}`}>{row.values[field.name] || '-'}</td>
                        ))}
                        <td>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => openEditModal(row)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => void handleDelete(row.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size={config.key === 'createInvoice' ? 'xl' : undefined}>
        <Modal.Header closeButton>
          <Modal.Title>{mode === 'create' ? `Create ${config.title}` : `Edit ${config.title}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {config.key === 'createInvoice' ? (
            <CreateInvoiceComposer
              formValues={formValues}
              invoiceComposer={invoiceComposer}
              resolvedValues={resolvedCreateInvoiceValues}
              onFormValueChange={(name, value) => setFormValues((prev) => ({ ...prev, [name]: value }))}
              onCustomerChange={(customerName, customerId) =>
                setFormValues((prev) => ({ ...prev, customerName, customerId }))
              }
              onComposerChange={updateComposer}
              onLineItemChange={updateLineItem}
              onAddLineItem={addLineItem}
              onRemoveLineItem={removeLineItem}
              onLogoUpload={handleLogoUpload}
              onSignatureUpload={handleSignatureUpload}
              onAttachmentUpload={handleAttachmentUpload}
              onPreviewPdf={previewInvoicePdf}
              onSendShare={() => {
                void sendOrShareInvoice();
              }}
              onSave={() => {
                void handleSave();
              }}
              addDays={addDays}
              parseDecimal={parseDecimal}
              formatMoneyValue={formatMoneyValue}
            />
          ) : (
            <Form>
            <Row className="g-3">
              {config.fields.map((field) => (
                <Col xs={12} md={config.key === 'createInvoice' ? 4 : 6} key={field.name}>
                  <Form.Group controlId={`${config.key}-${field.name}`}>
                    <Form.Label>{field.label}</Form.Label>
                    {field.type === 'select' ? (
                      <Form.Select
                        value={formValues[field.name] ?? ''}
                        onChange={(event) =>
                          setFormValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                        }
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Form.Select>
                    ) : field.type === 'textarea' ? (
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={formValues[field.name] ?? ''}
                        onChange={(event) =>
                          setFormValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                        }
                      />
                    ) : field.lookup === 'customer' ? (
                      <CustomerTypeahead
                        controlId={`${config.key}-${field.name}`}
                        value={formValues[field.name] ?? ''}
                        customerId={formValues.customerId ?? ''}
                        onChange={(customerName, customerId) =>
                          setFormValues((prev) => ({
                            ...prev,
                            [field.name]: customerName,
                            customerId,
                          }))
                        }
                      />
                    ) : (
                      <Form.Control
                        type={field.type}
                        value={formValues[field.name] ?? ''}
                        onChange={(event) =>
                          setFormValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                        }
                      />
                    )}
                  </Form.Group>
                </Col>
                ))}
            </Row>
            </Form>
          )}
          {saveError ? <div className="small text-danger mt-3">{saveError}</div> : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          {config.key === 'createInvoice' ? (
            <>
              <Button variant="outline-secondary" onClick={previewInvoicePdf}>
                Preview PDF
              </Button>
              <Button
                variant="outline-primary"
                onClick={() => {
                  void sendOrShareInvoice();
                }}
              >
                Send / Share
              </Button>
            </>
          ) : null}
          <Button
            onClick={() => void handleSave()}
            style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
          >
            {config.key === 'createInvoice' ? 'Save Invoice' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default InvoicingModule;

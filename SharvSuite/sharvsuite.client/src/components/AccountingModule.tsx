import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap';
import { apiFetch } from '../apiClient';

export type AccountingScreenKey =
  | 'chartOfAccounts'
  | 'journalEntries'
  | 'generalLedger'
  | 'trialBalance';

type FieldType = 'text' | 'select' | 'date' | 'number' | 'textarea';

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

type ScreenConfig = {
  key: AccountingScreenKey;
  title: string;
  endpoint: string;
  fields: FieldConfig[];
  tableFields: string[];
};

type CrudRow = {
  id: string;
  values: Record<string, string>;
};

type RowsState = Record<AccountingScreenKey, CrudRow[]>;

type AccountingModuleProps = {
  activeScreen?: AccountingScreenKey;
  onScreenChange?: (screen: AccountingScreenKey) => void;
};

const screenConfigs: ScreenConfig[] = [
  {
    key: 'chartOfAccounts',
    title: 'Chart of Accounts',
    endpoint: 'chart-of-accounts',
    fields: [
      { name: 'accountCode', label: 'Account Code', type: 'text', required: true },
      { name: 'accountName', label: 'Account Name', type: 'text', required: true },
      { name: 'accountType', label: 'Account Type', type: 'select', options: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'], required: true },
      { name: 'subType', label: 'Sub Type', type: 'text' },
      { name: 'parentAccount', label: 'Parent Account', type: 'text' },
      { name: 'currency', label: 'Currency', type: 'text' },
      { name: 'openingBalance', label: 'Opening Balance', type: 'number' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
    ],
    tableFields: ['accountCode', 'accountName', 'accountType', 'parentAccount', 'openingBalance', 'status'],
  },
  {
    key: 'journalEntries',
    title: 'Journal Entries',
    endpoint: 'journal-entries',
    fields: [
      { name: 'voucherNumber', label: 'Voucher Number', type: 'text', required: true },
      { name: 'entryDate', label: 'Entry Date', type: 'date', required: true },
      { name: 'postingDate', label: 'Posting Date', type: 'date' },
      { name: 'referenceNumber', label: 'Reference Number', type: 'text' },
      { name: 'debitAccount', label: 'Debit Account', type: 'text', required: true },
      { name: 'creditAccount', label: 'Credit Account', type: 'text', required: true },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'currency', label: 'Currency', type: 'text', required: true },
      { name: 'exchangeRate', label: 'Exchange Rate', type: 'number' },
      { name: 'costCenter', label: 'Cost Center', type: 'text' },
      { name: 'department', label: 'Department', type: 'text' },
      { name: 'taxCode', label: 'Tax Code', type: 'text' },
      { name: 'narration', label: 'Narration', type: 'textarea', required: true },
      { name: 'approvedBy', label: 'Approved By', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Posted', 'Reversed'], required: true },
    ],
    tableFields: ['voucherNumber', 'entryDate', 'debitAccount', 'creditAccount', 'amount', 'status'],
  },
  {
    key: 'generalLedger',
    title: 'General Ledger',
    endpoint: 'general-ledger',
    fields: [
      { name: 'accountCode', label: 'Account Code', type: 'text', required: true },
      { name: 'periodFrom', label: 'Period From', type: 'date', required: true },
      { name: 'periodTo', label: 'Period To', type: 'date', required: true },
      { name: 'openingBalance', label: 'Opening Balance', type: 'number' },
      { name: 'debitTotal', label: 'Debit Total', type: 'number' },
      { name: 'creditTotal', label: 'Credit Total', type: 'number' },
      { name: 'closingBalance', label: 'Closing Balance', type: 'number' },
      { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'], required: true },
    ],
    tableFields: ['accountCode', 'periodFrom', 'periodTo', 'debitTotal', 'creditTotal', 'status'],
  },
  {
    key: 'trialBalance',
    title: 'Trial Balance',
    endpoint: 'trial-balance',
    fields: [
      { name: 'periodFrom', label: 'Period From', type: 'date', required: true },
      { name: 'periodTo', label: 'Period To', type: 'date', required: true },
      { name: 'currency', label: 'Currency', type: 'text', required: true },
      { name: 'totalDebit', label: 'Total Debit', type: 'number', required: true },
      { name: 'totalCredit', label: 'Total Credit', type: 'number', required: true },
      { name: 'difference', label: 'Difference', type: 'number' },
      { name: 'preparedBy', label: 'Prepared By', type: 'text' },
      { name: 'approvedBy', label: 'Approved By', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Finalized'], required: true },
    ],
    tableFields: ['periodFrom', 'periodTo', 'currency', 'totalDebit', 'totalCredit', 'status'],
  },
];

const screenByKey = screenConfigs.reduce((acc, config) => {
  acc[config.key] = config;
  return acc;
}, {} as Record<AccountingScreenKey, ScreenConfig>);

function initialRowsState(): RowsState {
  return screenConfigs.reduce((acc, cfg) => {
    acc[cfg.key] = [];
    return acc;
  }, {} as RowsState);
}

function defaultValues(config: ScreenConfig): Record<string, string> {
  return config.fields.reduce((acc, field) => {
    if (field.type === 'select' && field.options && field.options.length > 0) {
      acc[field.name] = field.options[0];
      return acc;
    }

    acc[field.name] = '';
    return acc;
  }, {} as Record<string, string>);
}

function fieldCodes(config: ScreenConfig): Array<{ code: string; fieldName: string }> {
  return config.fields
    .filter((x) => x.name !== config.fields[0].name && x.name !== 'status')
    .map((field, idx) => ({ code: idx.toString(36), fieldName: field.name }));
}

function splitPacked(value: string): [string, string, string] {
  return [value.slice(0, 200), value.slice(200, 400), value.slice(400, 600)];
}

function decodeRecord(config: ScreenConfig, record: Record<string, unknown>): Record<string, string> {
  const values = defaultValues(config);
  const primaryName = config.fields[0].name;
  values[primaryName] = String(record.primaryField ?? '');
  values.status = String(record.status ?? values.status ?? 'Active');

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
  };
}

function AccountingModule({ activeScreen }: AccountingModuleProps) {
  const [activeTab, setActiveTab] = useState<AccountingScreenKey>(
    activeScreen ?? 'chartOfAccounts',
  );
  const [rowsByScreen, setRowsByScreen] = useState<RowsState>(initialRowsState);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const config = useMemo(() => screenByKey[activeTab] ?? screenConfigs[0], [activeTab]);
  const rows = rowsByScreen[config.key];
  const tableFields = useMemo(
    () => config.tableFields.map((name) => config.fields.find((x) => x.name === name)).filter((x): x is FieldConfig => Boolean(x)),
    [config],
  );

  useEffect(() => {
    if (activeScreen && activeScreen !== activeTab) {
      setActiveTab(activeScreen);
    }
  }, [activeScreen, activeTab]);

  async function loadRows() {
    const response = await apiFetch(`/api/accounting/${config.endpoint}`);
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
    setFormValues(defaultValues(config));
    setSaveError(null);
    setShowModal(true);
  }

  function openEditModal(row: CrudRow) {
    setMode('edit');
    setEditingId(row.id);
    setFormValues({ ...row.values });
    setSaveError(null);
    setShowModal(true);
  }

  function validateRequired(): boolean {
    return config.fields
      .filter((field) => field.required)
      .every((field) => (formValues[field.name] ?? '').trim().length > 0);
  }

  async function handleSave() {
    if (!validateRequired()) {
      setSaveError('Please fill all required fields.');
      return;
    }

    setSaveError(null);

    try {
      const endpoint = `/api/accounting/${config.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;
      const response = await apiFetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encodeRequestBody(config, formValues)),
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
      const response = await apiFetch(`/api/accounting/${config.endpoint}/${id}`, {
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

  return (
    <>
      <h1 className="page-title mb-2">Accounting</h1>
      <p className="text-secondary mb-3">
        Maintain chart of accounts, journal entries, and accounting statements with detailed fields.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{config.title}</h2>
                  <div className="text-secondary small">Accounting Management</div>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size={config.key === 'journalEntries' ? 'xl' : undefined}>
        <Modal.Header closeButton>
          <Modal.Title>{mode === 'create' ? `Create ${config.title}` : `Edit ${config.title}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              {config.fields.map((field) => (
                <Col xs={12} md={config.key === 'journalEntries' ? 4 : 6} key={field.name}>
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
          {saveError ? <div className="small text-danger mt-3">{saveError}</div> : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleSave()}
            style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default AccountingModule;

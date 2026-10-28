import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { apiFetch } from '../apiClient';

export type SubscriptionBillingScreenKey =
  | 'planCatalog'
  | 'subscriptionLifecycle'
  | 'billingCycles'
  | 'invoiceGeneration'
  | 'paymentTracking';

type FieldType = 'text' | 'date' | 'number' | 'select';
type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

type ScreenConfig = {
  key: SubscriptionBillingScreenKey;
  title: string;
  endpoint: string;
  fields: FieldConfig[];
  columns: string[];
};

type CrudRow = { id: string; values: Record<string, string> };
type RowsState = Record<SubscriptionBillingScreenKey, CrudRow[]>;

type SubscriptionBillingModuleProps = {
  activeScreen?: SubscriptionBillingScreenKey;
  onScreenChange?: (screen: SubscriptionBillingScreenKey) => void;
};

const screenConfigs: ScreenConfig[] = [
  {
    key: 'planCatalog',
    title: 'Plan Catalog',
    endpoint: 'plan-catalog',
    fields: [
      { name: 'planCode', label: 'Plan Code', type: 'text', required: true },
      { name: 'planName', label: 'Plan Name', type: 'text', required: true },
      { name: 'price', label: 'Price', type: 'number', required: true },
      { name: 'billingFrequency', label: 'Billing Frequency', type: 'select', options: ['Monthly', 'Quarterly', 'Yearly'], required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
    ],
    columns: ['planCode', 'planName', 'price', 'billingFrequency', 'status'],
  },
  {
    key: 'subscriptionLifecycle',
    title: 'Subscription Lifecycle',
    endpoint: 'subscription-lifecycle',
    fields: [
      { name: 'subscriberName', label: 'Subscriber', type: 'text', required: true },
      { name: 'planCode', label: 'Plan Code', type: 'text', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date' },
      { name: 'state', label: 'State', type: 'select', options: ['Active', 'Paused', 'Cancelled'], required: true },
    ],
    columns: ['subscriberName', 'planCode', 'startDate', 'endDate', 'state'],
  },
  {
    key: 'billingCycles',
    title: 'Billing Cycles',
    endpoint: 'billing-cycles',
    fields: [
      { name: 'cycleName', label: 'Cycle Name', type: 'text', required: true },
      { name: 'frequency', label: 'Frequency', type: 'select', options: ['Monthly', 'Quarterly', 'Yearly'], required: true },
      { name: 'graceDays', label: 'Grace Days', type: 'number', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
    ],
    columns: ['cycleName', 'frequency', 'graceDays', 'status'],
  },
  {
    key: 'invoiceGeneration',
    title: 'Invoice Generation',
    endpoint: 'invoice-generation',
    fields: [
      { name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
      { name: 'subscriberName', label: 'Subscriber', type: 'text', required: true },
      { name: 'invoiceDate', label: 'Invoice Date', type: 'date', required: true },
      { name: 'amount', label: 'Amount', type: 'number', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Sent', 'Paid'], required: true },
    ],
    columns: ['invoiceNumber', 'subscriberName', 'invoiceDate', 'amount', 'status'],
  },
  {
    key: 'paymentTracking',
    title: 'Payment Tracking',
    endpoint: 'payment-tracking',
    fields: [
      { name: 'referenceNumber', label: 'Reference #', type: 'text', required: true },
      { name: 'invoiceNumber', label: 'Invoice #', type: 'text', required: true },
      { name: 'amountPaid', label: 'Amount Paid', type: 'number', required: true },
      { name: 'paidOn', label: 'Paid On', type: 'date', required: true },
      { name: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['Pending', 'Completed', 'Failed'], required: true },
    ],
    columns: ['referenceNumber', 'invoiceNumber', 'amountPaid', 'paidOn', 'paymentStatus'],
  },
];

function buildInitialRowsState(): RowsState {
  return screenConfigs.reduce((acc, config) => {
    acc[config.key] = [];
    return acc;
  }, {} as RowsState);
}

function getDefaultValues(config: ScreenConfig): Record<string, string> {
  return config.fields.reduce((acc, field) => {
    if (field.type === 'select' && field.options && field.options.length > 0) {
      acc[field.name] = field.options[0];
    } else {
      acc[field.name] = '';
    }
    return acc;
  }, {} as Record<string, string>);
}

function SubscriptionBillingModule({ activeScreen }: SubscriptionBillingModuleProps) {
  const [activeTab, setActiveTab] = useState<SubscriptionBillingScreenKey>(
    activeScreen ?? 'planCatalog',
  );
  const [rowsByScreen, setRowsByScreen] = useState<RowsState>(buildInitialRowsState);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeConfig = useMemo(
    () => screenConfigs.find((x) => x.key === activeTab) ?? screenConfigs[0],
    [activeTab],
  );

  const activeRows = rowsByScreen[activeConfig.key];

  useEffect(() => {
    if (activeScreen && activeScreen !== activeTab) {
      setActiveTab(activeScreen);
    }
  }, [activeScreen, activeTab]);

  async function loadRowsForActive() {
    const response = await apiFetch(`/api/subscription-billing/${activeConfig.endpoint}`);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const json = (await response.json()) as Array<Record<string, unknown>>;
    setRowsByScreen((prev) => ({
      ...prev,
      [activeConfig.key]: json.map((item) => ({
        id: String(item.id),
        values: activeConfig.fields.reduce((acc, field) => {
          const raw = item[field.name];
          acc[field.name] = raw === null || raw === undefined ? '' : String(raw);
          return acc;
        }, {} as Record<string, string>),
      })),
    }));
  }

  useEffect(() => {
    let mounted = true;
    setLoadingRows(true);
    setRowsError(null);
    void loadRowsForActive()
      .catch((error: unknown) => {
        if (!mounted) return;
        const details = error instanceof Error ? error.message : 'Unknown error';
        setRowsError(`Failed to load ${activeConfig.title}. ${details}`);
      })
      .finally(() => {
        if (mounted) setLoadingRows(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeConfig]);

  function openCreateModal() {
    setMode('create');
    setEditingId(null);
    setFormValues(getDefaultValues(activeConfig));
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
    return activeConfig.fields
      .filter((f) => f.required)
      .every((f) => (formValues[f.name] ?? '').trim().length > 0);
  }

  async function handleSave() {
    if (!validateRequired()) {
      setSaveError('Please fill all required fields.');
      return;
    }
    setSaveError(null);

    try {
      const endpoint = `/api/subscription-billing/${activeConfig.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;
      const response = await apiFetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);

      await loadRowsForActive();
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
      const response = await apiFetch(`/api/subscription-billing/${activeConfig.endpoint}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      await loadRowsForActive();
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      setRowsError(`Unable to delete record. ${details}`);
    }
  }

  return (
    <>
      <h1 className="page-title mb-2">Subscription &amp; Billing</h1>
      <p className="text-secondary mb-3">
        Manage plans, lifecycle events, billing cycles, invoice generation, and payment tracking.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>

              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{activeConfig.title}</h2>
                  <div className="text-secondary small">Core Area</div>
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
                    {activeConfig.columns.map((col) => {
                      const field = activeConfig.fields.find((x) => x.name === col);
                      return <th key={col}>{field?.label ?? col}</th>;
                    })}
                    <th style={{ width: '130px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRows ? (
                    <tr>
                      <td colSpan={activeConfig.columns.length + 1} className="text-center py-4 text-secondary">
                        <Spinner size="sm" animation="border" className="me-2" />
                        Loading records...
                      </td>
                    </tr>
                  ) : activeRows.length === 0 ? (
                    <tr>
                      <td colSpan={activeConfig.columns.length + 1} className="text-center py-4 text-secondary">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    activeRows.map((row) => (
                      <tr key={row.id}>
                        {activeConfig.columns.map((col) => (
                          <td key={`${row.id}-${col}`}>{row.values[col] || '-'}</td>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{mode === 'create' ? `Create ${activeConfig.title}` : `Edit ${activeConfig.title}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              {activeConfig.fields.map((field) => (
                <Col xs={12} md={6} key={field.name}>
                  <Form.Group controlId={`${activeConfig.key}-${field.name}`}>
                    <Form.Label>{field.label}</Form.Label>
                    {field.type === 'select' ? (
                      <Form.Select
                        value={formValues[field.name] ?? ''}
                        onChange={(event) => setFormValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </Form.Select>
                    ) : (
                      <Form.Control
                        type={field.type}
                        value={formValues[field.name] ?? ''}
                        onChange={(event) => setFormValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
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
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
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

export default SubscriptionBillingModule;






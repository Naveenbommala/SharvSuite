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

export type PurchasesScreenKey =
  | 'poList'
  | 'createPo'
  | 'poDetail'
  | 'billList'
  | 'createBill'
  | 'billDetail';

type FieldConfig = {
  name: 'primaryField' | 'secondaryField' | 'tertiaryField' | 'quaternaryField' | 'status';
  label: string;
  type: 'text' | 'select' | 'date';
  required?: boolean;
  options?: string[];
};

type ScreenConfig = {
  key: PurchasesScreenKey;
  title: string;
  endpoint: string;
  category: 'Purchase Order Screens' | 'Bill Screens';
  fields: FieldConfig[];
};

type CrudRow = {
  id: string;
  values: Record<string, string>;
};

type RowsState = Record<PurchasesScreenKey, CrudRow[]>;

type PurchasesModuleProps = {
  activeScreen?: PurchasesScreenKey;
  onScreenChange?: (screen: PurchasesScreenKey) => void;
};

const screenConfigs: ScreenConfig[] = [
  {
    key: 'poList',
    title: 'PO List',
    endpoint: 'po-list',
    category: 'Purchase Order Screens',
    fields: [
      { name: 'primaryField', label: 'PO Number', type: 'text', required: true },
      { name: 'secondaryField', label: 'Vendor', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Vendor Currency', type: 'text', required: true },
      { name: 'quaternaryField', label: 'Landed Cost', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed', 'Draft'] },
    ],
  },
  {
    key: 'createPo',
    title: 'Create PO',
    endpoint: 'create-po',
    category: 'Purchase Order Screens',
    fields: [
      { name: 'primaryField', label: 'PO Number', type: 'text', required: true },
      { name: 'secondaryField', label: 'Order Date', type: 'date', required: true },
      { name: 'tertiaryField', label: 'Tax Regime', type: 'text' },
      { name: 'quaternaryField', label: 'Vendor Currency', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Submitted'] },
    ],
  },
  {
    key: 'poDetail',
    title: 'PO Detail',
    endpoint: 'po-detail',
    category: 'Purchase Order Screens',
    fields: [
      { name: 'primaryField', label: 'PO Number', type: 'text', required: true },
      { name: 'secondaryField', label: 'Item Summary', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Tax Amount', type: 'text' },
      { name: 'quaternaryField', label: 'Landed Cost', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed', 'Draft'] },
    ],
  },
  {
    key: 'billList',
    title: 'Bill List',
    endpoint: 'bill-list',
    category: 'Bill Screens',
    fields: [
      { name: 'primaryField', label: 'Bill Number', type: 'text', required: true },
      { name: 'secondaryField', label: 'Vendor', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Vendor Currency', type: 'text', required: true },
      { name: 'quaternaryField', label: 'Tax Amount', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Paid', 'Draft'] },
    ],
  },
  {
    key: 'createBill',
    title: 'Create Bill',
    endpoint: 'create-bill',
    category: 'Bill Screens',
    fields: [
      { name: 'primaryField', label: 'Bill Number', type: 'text', required: true },
      { name: 'secondaryField', label: 'Bill Date', type: 'date', required: true },
      { name: 'tertiaryField', label: 'Tax Regime', type: 'text' },
      { name: 'quaternaryField', label: 'Vendor Currency', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Submitted'] },
    ],
  },
  {
    key: 'billDetail',
    title: 'Bill Detail',
    endpoint: 'bill-detail',
    category: 'Bill Screens',
    fields: [
      { name: 'primaryField', label: 'Bill Number', type: 'text', required: true },
      { name: 'secondaryField', label: 'Line Details', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Tax Amount', type: 'text' },
      { name: 'quaternaryField', label: 'Landed Cost', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Paid', 'Draft'] },
    ],
  },
];

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
    } else {
      acc[field.name] = '';
    }
    return acc;
  }, {} as Record<string, string>);
}

function PurchasesModule({
  activeScreen,
  onScreenChange,
}: PurchasesModuleProps) {
  const [activeTab, setActiveTab] = useState<PurchasesScreenKey>(activeScreen ?? 'poList');
  const [rowsByScreen, setRowsByScreen] = useState<RowsState>(initialRowsState);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const config = useMemo(
    () => screenConfigs.find((x) => x.key === activeTab) ?? screenConfigs[0],
    [activeTab],
  );
  const rows = rowsByScreen[config.key];

  useEffect(() => {
    if (activeScreen && activeScreen !== activeTab) {
      setActiveTab(activeScreen);
    }
  }, [activeScreen, activeTab]);

  async function loadRows() {
    const response = await apiFetch(`/api/purchases/${config.endpoint}`);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const json = (await response.json()) as Array<Record<string, unknown>>;
    setRowsByScreen((prev) => ({
      ...prev,
      [config.key]: json.map((item) => ({
        id: String(item.id),
        values: {
          primaryField: String(item.primaryField ?? ''),
          secondaryField: String(item.secondaryField ?? ''),
          tertiaryField: String(item.tertiaryField ?? ''),
          quaternaryField: String(item.quaternaryField ?? ''),
          status: String(item.status ?? ''),
        },
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
      .filter((x) => x.required)
      .every((x) => (formValues[x.name] ?? '').trim().length > 0);
  }

  async function handleSave() {
    if (!validateRequired()) {
      setSaveError('Please fill all required fields.');
      return;
    }

    setSaveError(null);
    try {
      const endpoint = `/api/purchases/${config.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;
      const response = await apiFetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryField: formValues.primaryField ?? '',
          secondaryField: formValues.secondaryField ?? '',
          tertiaryField: formValues.tertiaryField ?? '',
          quaternaryField: formValues.quaternaryField ?? '',
          status: formValues.status ?? 'Active',
        }),
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
      const response = await apiFetch(`/api/purchases/${config.endpoint}/${id}`, {
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
      <h1 className="page-title mb-2">Purchases</h1>
      <p className="text-secondary mb-3">
        Support procure-to-pay flows from purchase order creation to vendor bill settlement.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>

              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{config.title}</h2>
                  <div className="text-secondary small">{config.category}</div>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <Button
                      size="sm"
                      variant={activeTab === 'poList' ? 'primary' : 'outline-primary'}
                      onClick={() => {
                        setActiveTab('poList');
                        onScreenChange?.('poList');
                      }}
                    >
                      Display Purchase Order
                    </Button>
                    <Button
                      size="sm"
                      variant={activeTab === 'createPo' ? 'primary' : 'outline-primary'}
                      onClick={() => {
                        setActiveTab('createPo');
                        onScreenChange?.('createPo');
                      }}
                    >
                      Create PO
                    </Button>
                  </div>
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
                    {config.fields.map((field) => (
                      <th key={field.name}>{field.label}</th>
                    ))}
                    <th style={{ width: '130px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRows ? (
                    <tr>
                      <td colSpan={config.fields.length + 1} className="text-center py-4 text-secondary">
                        <Spinner size="sm" animation="border" className="me-2" />
                        Loading records...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={config.fields.length + 1} className="text-center py-4 text-secondary">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id}>
                        {config.fields.map((field) => (
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{mode === 'create' ? `Create ${config.title}` : `Edit ${config.title}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              {config.fields.map((field) => (
                <Col xs={12} md={6} key={field.name}>
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

export default PurchasesModule;






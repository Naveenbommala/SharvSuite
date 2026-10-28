import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
} from 'react-bootstrap';
import { type ColDef } from 'ag-grid-community';
import { apiFetch } from '../apiClient';
import CustomerTypeahead from './CustomerTypeahead';
import ServerPaginatedAgGrid, { type PagedResult } from './ServerPaginatedAgGrid';

export type CustomersScreenKey =
  | 'customerList'
  | 'customerProfile'
  | 'customerLedger'
  | 'customerTransactions'
  | 'customerStatements';

type FieldConfig = {
  name: 'primaryField' | 'secondaryField' | 'tertiaryField' | 'quaternaryField' | 'status';
  label: string;
  type: 'text' | 'select' | 'date';
  required?: boolean;
  options?: string[];
  lookup?: 'customer';
};

type ScreenConfig = {
  key: CustomersScreenKey;
  title: string;
  endpoint: string;
  fields: FieldConfig[];
};

type CustomersModuleProps = {
  activeScreen?: CustomersScreenKey;
  onScreenChange?: (screen: CustomersScreenKey) => void;
};

type CustomerGridRow = {
  id: string;
  primaryField: string;
  secondaryField: string;
  tertiaryField: string;
  quaternaryField: string;
  status: string;
  customerId: string;
};

const screenConfigs: ScreenConfig[] = [
  {
    key: 'customerList',
    title: 'Customer List',
    endpoint: 'customer-list',
    fields: [
      { name: 'primaryField', label: 'Customer Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Customer Code', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Customer Currency', type: 'text', required: true },
      { name: 'quaternaryField', label: 'Tax Profile', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
  },
  {
    key: 'customerProfile',
    title: 'Customer Profile',
    endpoint: 'customer-profile',
    fields: [
      { name: 'primaryField', label: 'Customer Name', type: 'text', required: true, lookup: 'customer' },
      { name: 'secondaryField', label: 'Email', type: 'text' },
      { name: 'tertiaryField', label: 'Phone', type: 'text' },
      { name: 'quaternaryField', label: 'Region Tax Rule', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
  },
  {
    key: 'customerLedger',
    title: 'Customer Ledger',
    endpoint: 'customer-ledger',
    fields: [
      { name: 'primaryField', label: 'Customer Name', type: 'text', required: true, lookup: 'customer' },
      { name: 'secondaryField', label: 'Entry Date', type: 'date', required: true },
      { name: 'tertiaryField', label: 'Amount', type: 'text', required: true },
      { name: 'quaternaryField', label: 'Currency', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Open', 'Settled', 'Partial'] },
    ],
  },
  {
    key: 'customerTransactions',
    title: 'Customer Transactions',
    endpoint: 'customer-transactions',
    fields: [
      { name: 'primaryField', label: 'Transaction Ref', type: 'text', required: true },
      { name: 'secondaryField', label: 'Customer Name', type: 'text', required: true, lookup: 'customer' },
      { name: 'tertiaryField', label: 'Transaction Currency', type: 'text', required: true },
      { name: 'quaternaryField', label: 'Region Tax Rule', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Posted', 'Draft', 'Cancelled'] },
    ],
  },
  {
    key: 'customerStatements',
    title: 'Customer Statements',
    endpoint: 'customer-statements',
    fields: [
      { name: 'primaryField', label: 'Statement Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Customer Name', type: 'text', required: true, lookup: 'customer' },
      { name: 'tertiaryField', label: 'Period', type: 'text', required: true },
      { name: 'quaternaryField', label: 'Currency', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Sent', 'Archived'] },
    ],
  },
];

function defaultValues(config: ScreenConfig): Record<string, string> {
  const values = config.fields.reduce((acc, field) => {
    if (field.type === 'select' && field.options && field.options.length > 0) {
      acc[field.name] = field.options[0];
    } else {
      acc[field.name] = '';
    }
    return acc;
  }, {} as Record<string, string>);

  if (config.fields.some((field) => field.lookup === 'customer')) {
    values.customerId = '';
  }

  return values;
}

function CustomersModule({ activeScreen }: CustomersModuleProps) {
  const [activeTab, setActiveTab] = useState<CustomersScreenKey>(activeScreen ?? 'customerList');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [rowsError, setRowsError] = useState<string | null>(null);

  const config = useMemo(
    () => screenConfigs.find((x) => x.key === activeTab) ?? screenConfigs[0],
    [activeTab],
  );

  const columns = useMemo<Array<ColDef<CustomerGridRow>>>(
    () => [
      ...config.fields.map((field) => ({
        field: field.name,
        headerName: field.label,
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 140,
      })),
      {
        headerName: 'Actions',
        sortable: false,
        filter: false,
        width: 180,
        pinned: 'right',
        cellRenderer: (params: { data?: CustomerGridRow }) => (
          <div className="grid-action-cell">
            <button
              type="button"
              className="grid-action-btn"
              onClick={() => {
                if (params.data) {
                  openEditModal(params.data);
                }
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="grid-action-btn danger"
              onClick={() => {
                if (params.data) {
                  void handleDeleteRow(params.data.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [config.fields],
  );

  const fetchPage = useCallback(
    async (page: number, pageSize: number): Promise<PagedResult<CustomerGridRow>> => {
      const response = await apiFetch(
        `/api/customers/${config.endpoint}/paged?page=${page}&pageSize=${pageSize}`,
      );
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const json = (await response.json()) as {
        items: Array<Record<string, unknown>>;
        totalCount: number;
        page: number;
        pageSize: number;
      };

      return {
        items: json.items.map((item) => ({
          id: String(item.id),
          primaryField: String(item.primaryField ?? ''),
          secondaryField: String(item.secondaryField ?? ''),
          tertiaryField: String(item.tertiaryField ?? ''),
          quaternaryField: String(item.quaternaryField ?? ''),
          status: String(item.status ?? ''),
          customerId: String(item.customerId ?? ''),
        })),
        totalCount: json.totalCount,
        page: json.page,
        pageSize: json.pageSize,
      };
    },
    [config.endpoint],
  );

  useEffect(() => {
    if (activeScreen && activeScreen !== activeTab) {
      setActiveTab(activeScreen);
    }
  }, [activeScreen, activeTab]);

  useEffect(() => {
    setRowsError(null);
  }, [activeTab]);

  function openCreateModal() {
    setMode('create');
    setEditingId(null);
    setFormValues(defaultValues(config));
    setSaveError(null);
    setShowModal(true);
  }

  function openEditModal(row: CustomerGridRow) {
    setMode('edit');
    setEditingId(row.id);
    setFormValues({
      primaryField: row.primaryField,
      secondaryField: row.secondaryField,
      tertiaryField: row.tertiaryField,
      quaternaryField: row.quaternaryField,
      status: row.status,
      customerId: row.customerId,
    });
    setSaveError(null);
    setShowModal(true);
  }

  function validateRequired(): boolean {
    return config.fields
      .filter((x) => x.required)
      .every((x) =>
        x.lookup === 'customer'
          ? (formValues.customerId ?? '').trim().length > 0
          : (formValues[x.name] ?? '').trim().length > 0,
      );
  }

  async function handleSave() {
    if (!validateRequired()) {
      setSaveError('Please fill all required fields.');
      return;
    }

    setSaveError(null);
    setRowsError(null);
    try {
      const endpoint = `/api/customers/${config.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;
      const response = await apiFetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryField: formValues.primaryField ?? '',
          secondaryField: formValues.secondaryField ?? '',
          tertiaryField: formValues.tertiaryField ?? '',
          quaternaryField: formValues.quaternaryField ?? '',
          status: formValues.status ?? 'Active',
          customerId: formValues.customerId?.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      setShowModal(false);
      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      setSaveError(`Unable to save record. ${details}`);
    }
  }

  async function handleDeleteRow(id: string) {
    const confirmed = window.confirm('Delete selected record?');
    if (!confirmed) {
      return;
    }

    setRowsError(null);
    try {
      const response = await apiFetch(`/api/customers/${config.endpoint}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      setRefreshKey((prev) => prev + 1);
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      setRowsError(`Unable to delete record. ${details}`);
    }
  }

  return (
    <>
      <h1 className="page-title mb-2">Customers</h1>
      <p className="text-secondary mb-3">
        Manage customer master data, ledgers, transactions, and statement generation.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>

              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{config.title}</h2>
                  <div className="text-secondary small">Customer Screen</div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    onClick={openCreateModal}
                    style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                  >
                    Add Record
                  </Button>
                </div>
              </div>

              {rowsError ? <div className="alert alert-danger py-2 small mb-2">{rowsError}</div> : null}

              <ServerPaginatedAgGrid<CustomerGridRow>
                key={config.key}
                columns={columns}
                fetchPage={fetchPage}
                getRowId={(row) => row.id}
                refreshKey={refreshKey}
              />
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
          {saveError ? <div className="small text-danger mt-3">{saveError}</div> : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSave();
            }}
            style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default CustomersModule;





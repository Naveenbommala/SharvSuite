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

export type ScreenKey =
  | 'createBusiness'
  | 'businessProfile'
  | 'businessPreferences'
  | 'regionalSettings'
  | 'fiscalYearSettings';

type FieldType = 'text' | 'email' | 'date' | 'select';

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

type ScreenConfig = {
  key: ScreenKey;
  title: string;
  description: string;
  endpoint: string;
  fields: FieldConfig[];
  columns: string[];
};

type CrudRow = {
  id: string;
  values: Record<string, string>;
};

type RowsState = Record<ScreenKey, CrudRow[]>;

type TenantBusinessModuleProps = {
  activeScreen?: ScreenKey;
  onScreenChange?: (screen: ScreenKey) => void;
};

const screenConfigs: ScreenConfig[] = [
  {
    key: 'createBusiness',
    title: 'Create Business',
    description: 'Register tenant business entities and account metadata.',
    endpoint: 'create-business',
    fields: [
      { name: 'businessName', label: 'Business Name', type: 'text', required: true },
      { name: 'legalName', label: 'Legal Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: ['Active', 'Draft', 'Inactive'],
      },
    ],
    columns: ['businessName', 'legalName', 'email', 'status'],
  },
  {
    key: 'businessProfile',
    title: 'Business Profile',
    description: 'Maintain profile attributes shown on documents and portal pages.',
    endpoint: 'business-profiles',
    fields: [
      { name: 'displayName', label: 'Display Name', type: 'text', required: true },
      { name: 'industry', label: 'Industry', type: 'text' },
      { name: 'website', label: 'Website', type: 'text' },
      { name: 'address', label: 'Address', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: ['Active', 'Draft', 'Archived'],
      },
    ],
    columns: ['displayName', 'industry', 'website', 'status'],
  },
  {
    key: 'businessPreferences',
    title: 'Business Preferences',
    description: 'Configure global defaults used by transactions and documents.',
    endpoint: 'business-preferences',
    fields: [
      {
        name: 'invoicePrefix',
        label: 'Invoice Prefix',
        type: 'text',
        required: true,
      },
      {
        name: 'paymentTerms',
        label: 'Payment Terms',
        type: 'select',
        required: true,
        options: ['Due on Receipt', 'Net 7', 'Net 15', 'Net 30'],
      },
      {
        name: 'defaultLanguage',
        label: 'Default Language',
        type: 'select',
        options: ['English (US)', 'English (UK)', 'Hindi'],
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: ['Active', 'Draft'],
      },
    ],
    columns: ['invoicePrefix', 'paymentTerms', 'defaultLanguage', 'status'],
  },
  {
    key: 'regionalSettings',
    title: 'Regional Settings',
    description: 'Set regional defaults for currency, formatting, and timezone.',
    endpoint: 'regional-settings',
    fields: [
      { name: 'country', label: 'Country', type: 'text', required: true },
      { name: 'timezone', label: 'Timezone', type: 'text', required: true },
      {
        name: 'dateFormat',
        label: 'Date Format',
        type: 'select',
        options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      },
      {
        name: 'numberFormat',
        label: 'Number Format',
        type: 'select',
        options: ['1,234.56', '1.234,56', '1 234,56'],
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: ['Active', 'Draft'],
      },
    ],
    columns: ['country', 'timezone', 'dateFormat', 'status'],
  },
  {
    key: 'fiscalYearSettings',
    title: 'Fiscal Year Settings',
    description: 'Define fiscal periods and book status for accounting operations.',
    endpoint: 'fiscal-year-settings',
    fields: [
      { name: 'fiscalYear', label: 'Fiscal Year', type: 'text', required: true },
      { name: 'startDate', label: 'Start Date', type: 'date', required: true },
      { name: 'endDate', label: 'End Date', type: 'date', required: true },
      {
        name: 'bookStatus',
        label: 'Book Status',
        type: 'select',
        required: true,
        options: ['Open', 'Closed', 'Locked'],
      },
    ],
    columns: ['fiscalYear', 'startDate', 'endDate', 'bookStatus'],
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
      return acc;
    }

    acc[field.name] = '';
    return acc;
  }, {} as Record<string, string>);
}

function mapRecordToRow(config: ScreenConfig, record: Record<string, unknown>): CrudRow {
  const values = config.fields.reduce((acc, field) => {
    const raw = record[field.name];
    acc[field.name] = raw === null || raw === undefined ? '' : String(raw);
    return acc;
  }, {} as Record<string, string>);

  return {
    id: String(record.id),
    values,
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: string;
      title?: string;
      errors?: Record<string, string[]>;
    };

    if (payload.error) {
      return payload.error;
    }

    const validationMessages = Object.values(payload.errors ?? {})
      .flat()
      .filter((message) => message.trim().length > 0);

    if (validationMessages.length > 0) {
      return validationMessages.join(' ');
    }

    if (payload.title) {
      return payload.title;
    }
  } catch {
    // Fall back to status-based message when the response body is empty or not JSON.
  }

  return `Status ${response.status}`;
}

function TenantBusinessModule({ activeScreen }: TenantBusinessModuleProps) {
  const [activeTab, setActiveTab] = useState<ScreenKey>(activeScreen ?? 'createBusiness');
  const [rowsByScreen, setRowsByScreen] = useState<RowsState>(buildInitialRowsState);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const activeConfig = useMemo(
    () => screenConfigs.find((config) => config.key === activeTab) ?? screenConfigs[0],
    [activeTab],
  );

  const activeRows = rowsByScreen[activeConfig.key];

  useEffect(() => {
    if (activeScreen && activeScreen !== activeTab) {
      setActiveTab(activeScreen);
    }
  }, [activeScreen, activeTab]);

  useEffect(() => {
    let isMounted = true;

    async function loadRows() {
      setLoadingRows(true);
      setRowsError(null);

      try {
        const response = await apiFetch(`/api/business-setup/${activeConfig.endpoint}`);
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const json = (await response.json()) as Array<Record<string, unknown>>;
        if (!isMounted) {
          return;
        }

        setRowsByScreen((prev) => ({
          ...prev,
          [activeConfig.key]: json.map((item) => mapRecordToRow(activeConfig, item)),
        }));
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }

        const details =
          error instanceof Error ? error.message : 'Unable to load records.';
        setRowsError(`Failed to load ${activeConfig.title}. ${details}`);
      } finally {
        if (isMounted) {
          setLoadingRows(false);
        }
      }
    }

    void loadRows();

    return () => {
      isMounted = false;
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

  function closeModal() {
    setShowModal(false);
  }

  function handleFieldChange(fieldName: string, value: string) {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value,
      ...(activeConfig.key === 'createBusiness' &&
      fieldName === 'businessName' &&
      !(prev.legalName ?? '').trim()
        ? { legalName: value }
        : {}),
    }));
  }

  function validateRequiredFields(): boolean {
    return activeConfig.fields
      .filter((field) => field.required)
      .every((field) => (formValues[field.name] ?? '').trim().length > 0);
  }

  async function refreshActiveScreen() {
    const response = await apiFetch(`/api/business-setup/${activeConfig.endpoint}`);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }

    const json = (await response.json()) as Array<Record<string, unknown>>;
    setRowsByScreen((prev) => ({
      ...prev,
      [activeConfig.key]: json.map((item) => mapRecordToRow(activeConfig, item)),
    }));
  }

  async function handleSave() {
    if (!validateRequiredFields()) {
      setSaveError('Please fill all required fields.');
      return;
    }

    setSaveError(null);

    try {
      const endpoint = `/api/business-setup/${activeConfig.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const payload =
        activeConfig.key === 'createBusiness'
          ? {
              ...formValues,
              legalName: (formValues.legalName ?? '').trim() || (formValues.businessName ?? '').trim(),
              email: (formValues.email ?? '').trim(),
            }
          : formValues;

      const response = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      await refreshActiveScreen();
      closeModal();
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Request failed.';
      setSaveError(`Unable to save record. ${details}`);
    }
  }

  async function handleDelete(id: string) {
    const shouldDelete = window.confirm('Delete this record?');
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await apiFetch(`/api/business-setup/${activeConfig.endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      await refreshActiveScreen();
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Request failed.';
      setRowsError(`Unable to delete record. ${details}`);
    }
  }

  return (
    <>
      <h1 className="page-title mb-2">Tenant / Business Setup</h1>
      <p className="text-secondary mb-3">
        Manage business setup screens with API-backed CRUD operations.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>

              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{activeConfig.title}</h2>
                  <div className="text-secondary small">{activeConfig.description}</div>
                </div>
                <Button
                  onClick={openCreateModal}
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    borderColor: 'var(--color-primary)',
                  }}
                >
                  Add Record
                </Button>
              </div>

              {rowsError ? (
                <div className="alert alert-danger py-2 small">{rowsError}</div>
              ) : null}

              <Table responsive hover className="align-middle mb-0">
                <thead>
                  <tr>
                    {activeConfig.columns.map((columnName) => {
                      const field = activeConfig.fields.find((item) => item.name === columnName);
                      return <th key={columnName}>{field?.label ?? columnName}</th>;
                    })}
                    <th style={{ width: '130px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRows ? (
                    <tr>
                      <td
                        colSpan={activeConfig.columns.length + 1}
                        className="text-center py-4 text-secondary"
                      >
                        <Spinner size="sm" animation="border" className="me-2" />
                        Loading records...
                      </td>
                    </tr>
                  ) : activeRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeConfig.columns.length + 1}
                        className="text-center py-4 text-secondary"
                      >
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    activeRows.map((row) => (
                      <tr key={row.id}>
                        {activeConfig.columns.map((columnName) => (
                          <td key={columnName}>{row.values[columnName] || '-'}</td>
                        ))}
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => {
                                openEditModal(row);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => {
                                void handleDelete(row.id);
                              }}
                            >
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

      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {mode === 'create' ? `Create ${activeConfig.title}` : `Edit ${activeConfig.title}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              {activeConfig.fields.map((field) => (
                <Col
                  xs={12}
                  md={field.type === 'text' && field.name.includes('address') ? 12 : 6}
                  key={field.name}
                >
                  <Form.Group controlId={`${activeConfig.key}-${field.name}`}>
                    <Form.Label>{field.label}</Form.Label>
                    {field.type === 'select' ? (
                      <Form.Select
                        value={formValues[field.name] ?? ''}
                        onChange={(event) => {
                          handleFieldChange(field.name, event.target.value);
                        }}
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
                        onChange={(event) => {
                          handleFieldChange(field.name, event.target.value);
                        }}
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
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSave();
            }}
            style={{
              backgroundColor: 'var(--color-primary)',
              borderColor: 'var(--color-primary)',
            }}
          >
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default TenantBusinessModule;







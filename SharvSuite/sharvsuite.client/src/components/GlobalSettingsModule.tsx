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

export type GlobalSettingsScreenKey =
  | 'numberingSeries'
  | 'documentTemplates'
  | 'emailTemplates'
  | 'notificationRules'
  | 'automation';

type FieldConfig = {
  name: 'primaryField' | 'secondaryField' | 'tertiaryField' | 'status';
  label: string;
  type: 'text' | 'select';
  required?: boolean;
  options?: string[];
};

type ScreenConfig = {
  key: GlobalSettingsScreenKey;
  title: string;
  endpoint: string;
  fields: FieldConfig[];
};

type CrudRow = {
  id: string;
  values: Record<string, string>;
};

type RowsState = Record<GlobalSettingsScreenKey, CrudRow[]>;

type GlobalSettingsModuleProps = {
  activeScreen?: GlobalSettingsScreenKey;
  onScreenChange?: (screen: GlobalSettingsScreenKey) => void;
};

const screenConfigs: ScreenConfig[] = [
  {
    key: 'numberingSeries',
    title: 'Numbering Series',
    endpoint: 'numbering-series',
    fields: [
      { name: 'primaryField', label: 'Series Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Prefix', type: 'text' },
      { name: 'tertiaryField', label: 'Next Number', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
  },
  {
    key: 'documentTemplates',
    title: 'Document Templates',
    endpoint: 'document-templates',
    fields: [
      { name: 'primaryField', label: 'Template Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Document Type', type: 'text' },
      { name: 'tertiaryField', label: 'Version', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft'] },
    ],
  },
  {
    key: 'emailTemplates',
    title: 'Email Templates',
    endpoint: 'email-templates',
    fields: [
      { name: 'primaryField', label: 'Template Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Subject', type: 'text' },
      { name: 'tertiaryField', label: 'Module', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft'] },
    ],
  },
  {
    key: 'notificationRules',
    title: 'Notification Rules',
    endpoint: 'notification-rules',
    fields: [
      { name: 'primaryField', label: 'Rule Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Trigger', type: 'text' },
      { name: 'tertiaryField', label: 'Channel', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
  },
  {
    key: 'automation',
    title: 'Automation',
    endpoint: 'automation',
    fields: [
      { name: 'primaryField', label: 'Automation Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Condition', type: 'text' },
      { name: 'tertiaryField', label: 'Action', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Paused'] },
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

function GlobalSettingsModule({ activeScreen }: GlobalSettingsModuleProps) {
  const [activeTab, setActiveTab] = useState<GlobalSettingsScreenKey>(
    activeScreen ?? 'numberingSeries',
  );
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
    const response = await apiFetch(`/api/global-settings/${config.endpoint}`);
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
      const endpoint = `/api/global-settings/${config.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;
      const response = await apiFetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryField: formValues.primaryField ?? '',
          secondaryField: formValues.secondaryField ?? '',
          tertiaryField: formValues.tertiaryField ?? '',
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
      const response = await apiFetch(`/api/global-settings/${config.endpoint}/${id}`, {
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
      <h1 className="page-title mb-2">Global Settings</h1>
      <p className="text-secondary mb-3">
        Configure numbering, templates, notifications, and automation, with architecture references for
        multi-currency, multi-tax, and multi-language design.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>

              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{config.title}</h2>
                  <div className="text-secondary small">Global Settings Screen</div>
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
                        onChange={(event) => setFormValues((prev) => ({ ...prev, [field.name]: event.target.value }))}
                      >
                        {(field.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </Form.Select>
                    ) : (
                      <Form.Control
                        type="text"
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

export default GlobalSettingsModule;






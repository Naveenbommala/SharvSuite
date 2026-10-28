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

export type LocalizationScreenKey =
  | 'currencyList'
  | 'exchangeRates'
  | 'baseCurrency'
  | 'currencyFormat'
  | 'taxTypes'
  | 'taxRates'
  | 'taxRules'
  | 'taxGroups'
  | 'regionMapping'
  | 'languageSettings'
  | 'defaultLanguage'
  | 'translationOverrides'
  | 'labelCustomization';

type FieldConfig = {
  name: 'primaryField' | 'secondaryField' | 'tertiaryField' | 'quaternaryField' | 'status';
  label: string;
  type: 'text' | 'select' | 'date';
  required?: boolean;
  options?: string[];
};

type ScreenConfig = {
  key: LocalizationScreenKey;
  title: string;
  endpoint: string;
  category: 'Currency' | 'Taxation' | 'Language';
  fields: FieldConfig[];
  supports: string[];
};

type CrudRow = {
  id: string;
  values: Record<string, string>;
};

type RowsState = Record<LocalizationScreenKey, CrudRow[]>;

type LocalizationModuleProps = {
  activeScreen?: LocalizationScreenKey;
  onScreenChange?: (screen: LocalizationScreenKey) => void;
};

const screenConfigs: ScreenConfig[] = [
  {
    key: 'currencyList',
    title: 'Currency List',
    endpoint: 'currency-list',
    category: 'Currency',
    fields: [
      { name: 'primaryField', label: 'Currency Code', type: 'text', required: true },
      { name: 'secondaryField', label: 'Symbol', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Decimals', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
    supports: ['multiple currencies', 'symbol placement', 'decimals', 'rounding'],
  },
  {
    key: 'exchangeRates',
    title: 'Exchange Rates',
    endpoint: 'exchange-rates',
    category: 'Currency',
    fields: [
      { name: 'primaryField', label: 'Base Currency', type: 'text', required: true },
      { name: 'secondaryField', label: 'Target Currency', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Rate', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft'] },
    ],
    supports: ['multiple currencies', 'symbol placement', 'decimals', 'rounding'],
  },
  {
    key: 'baseCurrency',
    title: 'Base Currency',
    endpoint: 'base-currency',
    category: 'Currency',
    fields: [
      { name: 'primaryField', label: 'Base Currency', type: 'text', required: true },
      { name: 'secondaryField', label: 'Effective From', type: 'date' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft'] },
    ],
    supports: ['multiple currencies', 'symbol placement', 'decimals', 'rounding'],
  },
  {
    key: 'currencyFormat',
    title: 'Currency Format',
    endpoint: 'currency-format',
    category: 'Currency',
    fields: [
      { name: 'primaryField', label: 'Symbol Placement', type: 'text', required: true },
      { name: 'secondaryField', label: 'Decimals', type: 'text' },
      { name: 'tertiaryField', label: 'Rounding', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft'] },
    ],
    supports: ['multiple currencies', 'symbol placement', 'decimals', 'rounding'],
  },
  {
    key: 'taxTypes',
    title: 'Tax Types',
    endpoint: 'tax-types',
    category: 'Taxation',
    fields: [
      { name: 'primaryField', label: 'Tax Type', type: 'text', required: true },
      { name: 'secondaryField', label: 'Regime', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
    supports: ['GST/VAT/Sales Tax', 'inclusive/exclusive', 'multi-rate', 'compound tax', 'country/state tax'],
  },
  {
    key: 'taxRates',
    title: 'Tax Rates',
    endpoint: 'tax-rates',
    category: 'Taxation',
    fields: [
      { name: 'primaryField', label: 'Tax Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Rate %', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Inclusive/Exclusive', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
    supports: ['GST/VAT/Sales Tax', 'inclusive/exclusive', 'multi-rate', 'compound tax', 'country/state tax'],
  },
  {
    key: 'taxRules',
    title: 'Tax Rules',
    endpoint: 'tax-rules',
    category: 'Taxation',
    fields: [
      { name: 'primaryField', label: 'Rule Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Condition', type: 'text' },
      { name: 'tertiaryField', label: 'Tax Type', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
    supports: ['GST/VAT/Sales Tax', 'inclusive/exclusive', 'multi-rate', 'compound tax', 'country/state tax'],
  },
  {
    key: 'taxGroups',
    title: 'Tax Groups',
    endpoint: 'tax-groups',
    category: 'Taxation',
    fields: [
      { name: 'primaryField', label: 'Group Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Tax Components', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
    supports: ['GST/VAT/Sales Tax', 'inclusive/exclusive', 'multi-rate', 'compound tax', 'country/state tax'],
  },
  {
    key: 'regionMapping',
    title: 'Region Mapping',
    endpoint: 'region-mapping',
    category: 'Taxation',
    fields: [
      { name: 'primaryField', label: 'Country/State', type: 'text', required: true },
      { name: 'secondaryField', label: 'Tax Group', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
    supports: ['GST/VAT/Sales Tax', 'inclusive/exclusive', 'multi-rate', 'compound tax', 'country/state tax'],
  },
  {
    key: 'languageSettings',
    title: 'Language Settings',
    endpoint: 'language-settings',
    category: 'Language',
    fields: [
      { name: 'primaryField', label: 'UI Language', type: 'text', required: true },
      { name: 'secondaryField', label: 'Document Language', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
    supports: ['UI language', 'document language', 'multi-lingual labels'],
  },
  {
    key: 'defaultLanguage',
    title: 'Default Language',
    endpoint: 'default-language',
    category: 'Language',
    fields: [
      { name: 'primaryField', label: 'Default Language', type: 'text', required: true },
      { name: 'secondaryField', label: 'Applies To', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft'] },
    ],
    supports: ['UI language', 'document language', 'multi-lingual labels'],
  },
  {
    key: 'translationOverrides',
    title: 'Translation Overrides',
    endpoint: 'translation-overrides',
    category: 'Language',
    fields: [
      { name: 'primaryField', label: 'Resource Key', type: 'text', required: true },
      { name: 'secondaryField', label: 'Override Text', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Language', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft'] },
    ],
    supports: ['UI language', 'document language', 'multi-lingual labels'],
  },
  {
    key: 'labelCustomization',
    title: 'Label Customization',
    endpoint: 'label-customization',
    category: 'Language',
    fields: [
      { name: 'primaryField', label: 'Label Key', type: 'text', required: true },
      { name: 'secondaryField', label: 'Label Text', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Module', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft'] },
    ],
    supports: ['UI language', 'document language', 'multi-lingual labels'],
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

function LocalizationModule({ activeScreen }: LocalizationModuleProps) {
  const [selectedScreen, setSelectedScreen] = useState<LocalizationScreenKey>(
    activeScreen ?? 'currencyList',
  );
  const [rowsByScreen, setRowsByScreen] = useState<RowsState>(buildInitialRowsState);
  const [loadingRows, setLoadingRows] = useState(false);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const config = useMemo(
    () => screenConfigs.find((item) => item.key === selectedScreen) ?? screenConfigs[0],
    [selectedScreen],
  );

  const rows = rowsByScreen[config.key];

  useEffect(() => {
    if (activeScreen && activeScreen !== selectedScreen) {
      setSelectedScreen(activeScreen);
    }
  }, [activeScreen, selectedScreen]);

  useEffect(() => {
    let isMounted = true;

    async function loadRows() {
      setLoadingRows(true);
      setRowsError(null);

      try {
        const response = await apiFetch(`/api/localization/${config.endpoint}`);
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const json = (await response.json()) as Array<{
          id: string;
          primaryField: string;
          secondaryField?: string;
          tertiaryField?: string;
          quaternaryField?: string;
          status: string;
        }>;

        if (!isMounted) {
          return;
        }

        setRowsByScreen((prev) => ({
          ...prev,
          [config.key]: json.map((item) => ({
            id: item.id,
            values: {
              primaryField: item.primaryField ?? '',
              secondaryField: item.secondaryField ?? '',
              tertiaryField: item.tertiaryField ?? '',
              quaternaryField: item.quaternaryField ?? '',
              status: item.status ?? '',
            },
          })),
        }));
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }

        const details = error instanceof Error ? error.message : 'Unknown error.';
        setRowsError(`Failed to load ${config.title}. ${details}`);
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
  }, [config]);

  function openCreateModal() {
    setMode('create');
    setEditingId(null);
    setFormValues(getDefaultValues(config));
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

  function handleFieldChange(name: string, value: string) {
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function closeModal() {
    setShowModal(false);
  }

  function validate(): boolean {
    return config.fields
      .filter((field) => field.required)
      .every((field) => (formValues[field.name] ?? '').trim().length > 0);
  }

  async function refreshRows() {
    const response = await apiFetch(`/api/localization/${config.endpoint}`);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const json = (await response.json()) as Array<{
      id: string;
      primaryField: string;
      secondaryField?: string;
      tertiaryField?: string;
      quaternaryField?: string;
      status: string;
    }>;

    setRowsByScreen((prev) => ({
      ...prev,
      [config.key]: json.map((item) => ({
        id: item.id,
        values: {
          primaryField: item.primaryField ?? '',
          secondaryField: item.secondaryField ?? '',
          tertiaryField: item.tertiaryField ?? '',
          quaternaryField: item.quaternaryField ?? '',
          status: item.status ?? '',
        },
      })),
    }));
  }

  async function handleSave() {
    if (!validate()) {
      setSaveError('Please fill all required fields.');
      return;
    }

    setSaveError(null);

    try {
      const endpoint = `/api/localization/${config.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const payload = {
        primaryField: formValues.primaryField ?? '',
        secondaryField: formValues.secondaryField ?? '',
        tertiaryField: formValues.tertiaryField ?? '',
        quaternaryField: formValues.quaternaryField ?? '',
        status: formValues.status ?? 'Active',
      };

      const response = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      await refreshRows();
      closeModal();
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error.';
      setSaveError(`Unable to save record. ${details}`);
    }
  }

  async function handleDelete(id: string) {
    const shouldDelete = window.confirm('Delete this record?');
    if (!shouldDelete) {
      return;
    }

    try {
      const response = await apiFetch(`/api/localization/${config.endpoint}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      await refreshRows();
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Unknown error.';
      setRowsError(`Unable to delete record. ${details}`);
    }
  }

  return (
    <>
      <h1 className="page-title mb-2">Localization Settings</h1>
      <p className="text-secondary mb-3">
        Set tenant-level currency, taxation, and language behavior for UI,
        documents, and reporting.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{config.title}</h2>
                  <div className="text-secondary small">{config.category} Screen</div>
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
            {mode === 'create' ? `Create ${config.title}` : `Edit ${config.title}`}
          </Modal.Title>
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
                        onChange={(event) => handleFieldChange(field.name, event.target.value)}
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
                        onChange={(event) => handleFieldChange(field.name, event.target.value)}
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

export default LocalizationModule;






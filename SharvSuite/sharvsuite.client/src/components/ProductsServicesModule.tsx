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

export type ProductsServicesScreenKey =
  | 'productList'
  | 'productDetail'
  | 'categories'
  | 'units'
  | 'pricing';

type FieldType = 'text' | 'select' | 'date' | 'number' | 'textarea';

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

type ScreenConfig = {
  key: ProductsServicesScreenKey;
  title: string;
  endpoint: string;
  fields: FieldConfig[];
  tableFields?: string[];
};

type CrudRow = {
  id: string;
  values: Record<string, string>;
};

type RowsState = Record<ProductsServicesScreenKey, CrudRow[]>;

type ProductsServicesModuleProps = {
  activeScreen?: ProductsServicesScreenKey;
  onScreenChange?: (screen: ProductsServicesScreenKey) => void;
};

const productDetailFields: FieldConfig[] = [
  { name: 'title', label: 'Product Title', type: 'text', required: true },
  { name: 'sku', label: 'SKU', type: 'text', required: true },
  { name: 'barcode', label: 'Barcode', type: 'text' },
  { name: 'brand', label: 'Brand/Vendor', type: 'text' },
  { name: 'productType', label: 'Product Type', type: 'text' },
  { name: 'category', label: 'Category', type: 'text' },
  { name: 'tags', label: 'Tags (comma separated)', type: 'text' },
  { name: 'shortDescription', label: 'Short Description', type: 'text' },
  { name: 'description', label: 'Full Description', type: 'textarea' },
  { name: 'price', label: 'Selling Price', type: 'number', required: true },
  { name: 'compareAtPrice', label: 'Compare-at Price', type: 'number' },
  { name: 'cost', label: 'Cost per Item', type: 'number' },
  { name: 'marginPercent', label: 'Margin %', type: 'number' },
  {
    name: 'trackQuantity',
    label: 'Track Quantity',
    type: 'select',
    options: ['Yes', 'No'],
  },
  { name: 'quantity', label: 'Available Quantity', type: 'number' },
  { name: 'onHand', label: 'On Hand', type: 'number' },
  { name: 'reserved', label: 'Reserved', type: 'number' },
  {
    name: 'continueSelling',
    label: 'Continue Selling When Out of Stock',
    type: 'select',
    options: ['No', 'Yes'],
  },
  { name: 'weight', label: 'Weight', type: 'number' },
  {
    name: 'weightUnit',
    label: 'Weight Unit',
    type: 'select',
    options: ['kg', 'g', 'lb', 'oz'],
  },
  { name: 'length', label: 'Length', type: 'number' },
  { name: 'width', label: 'Width', type: 'number' },
  { name: 'height', label: 'Height', type: 'number' },
  { name: 'countryOfOrigin', label: 'Country of Origin', type: 'text' },
  { name: 'hsCode', label: 'HS Code', type: 'text' },
  { name: 'taxCode', label: 'Tax Code', type: 'text' },
  {
    name: 'taxable',
    label: 'Taxable',
    type: 'select',
    options: ['Yes', 'No'],
  },
  { name: 'seoTitle', label: 'SEO Title', type: 'text' },
  { name: 'seoDescription', label: 'SEO Description', type: 'textarea' },
  { name: 'urlSlug', label: 'URL Slug', type: 'text' },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: ['Active', 'Draft', 'Archived'],
    required: true,
  },
];

const detailCodeByField: Record<string, string> = {
  sku: 'sk',
  barcode: 'bc',
  brand: 'br',
  productType: 'pt',
  category: 'cg',
  tags: 'tg',
  shortDescription: 'sd',
  description: 'ds',
  price: 'pr',
  compareAtPrice: 'cp',
  cost: 'ct',
  marginPercent: 'mg',
  trackQuantity: 'tq',
  quantity: 'qt',
  onHand: 'oh',
  reserved: 'rv',
  continueSelling: 'cs',
  weight: 'wt',
  weightUnit: 'wu',
  length: 'ln',
  width: 'wd',
  height: 'ht',
  countryOfOrigin: 'co',
  hsCode: 'hs',
  taxCode: 'tx',
  taxable: 'tb',
  seoTitle: 'st',
  seoDescription: 'ss',
  urlSlug: 'us',
};

const fieldByDetailCode = Object.entries(detailCodeByField).reduce(
  (acc, [fieldName, code]) => {
    acc[code] = fieldName;
    return acc;
  },
  {} as Record<string, string>,
);

const screenConfigs: ScreenConfig[] = [
  {
    key: 'productList',
    title: 'Product List',
    endpoint: 'product-list',
    fields: [
      { name: 'primaryField', label: 'Product Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'SKU', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Stock/Non-stock', type: 'select', options: ['Stock', 'Non-stock'] },
      { name: 'quaternaryField', label: 'Tax Category', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
  },
  {
    key: 'productDetail',
    title: 'Product Detail',
    endpoint: 'product-detail',
    fields: productDetailFields,
    tableFields: ['title', 'sku', 'brand', 'category', 'price', 'quantity', 'status'],
  },
  {
    key: 'categories',
    title: 'Categories',
    endpoint: 'categories',
    fields: [
      { name: 'primaryField', label: 'Category Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Tax Category', type: 'text' },
      { name: 'tertiaryField', label: 'Stock/Non-stock', type: 'select', options: ['Stock', 'Non-stock'] },
      { name: 'quaternaryField', label: 'Region Pricing', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
  },
  {
    key: 'units',
    title: 'Units',
    endpoint: 'units',
    fields: [
      { name: 'primaryField', label: 'Unit Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Abbreviation', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Conversion Factor', type: 'text' },
      { name: 'quaternaryField', label: 'Stock/Non-stock', type: 'select', options: ['Stock', 'Non-stock'] },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'] },
    ],
  },
  {
    key: 'pricing',
    title: 'Pricing',
    endpoint: 'pricing',
    fields: [
      { name: 'primaryField', label: 'Product Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Multi-currency Price', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Region Pricing', type: 'text' },
      { name: 'quaternaryField', label: 'Tax Category', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Draft'] },
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

function splitStringIntoChunks(value: string, chunkSize: number, chunkCount: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < chunkCount; i += 1) {
    chunks.push(value.slice(i * chunkSize, (i + 1) * chunkSize));
  }
  return chunks;
}

function decodeProductDetailValues(record: Record<string, unknown>): Record<string, string> {
  const baseValues = defaultValues(screenConfigs.find((x) => x.key === 'productDetail')!);
  baseValues.title = String(record.primaryField ?? '');
  baseValues.status = String(record.status ?? 'Active');

  const packed = `${String(record.secondaryField ?? '')}${String(record.tertiaryField ?? '')}${String(record.quaternaryField ?? '')}`;
  if (!packed) {
    return baseValues;
  }

  try {
    const parsed = JSON.parse(packed) as Record<string, string>;
    Object.entries(parsed).forEach(([code, value]) => {
      const fieldName = fieldByDetailCode[code];
      if (fieldName) {
        baseValues[fieldName] = value ?? '';
      }
    });
  } catch {
    // Keep defaults when legacy/plain text rows cannot be parsed.
  }

  return baseValues;
}

function buildPackedProductDetails(values: Record<string, string>): string {
  const compact: Record<string, string> = {};
  Object.entries(detailCodeByField).forEach(([fieldName, code]) => {
    const raw = (values[fieldName] ?? '').trim();
    if (raw.length > 0) {
      compact[code] = raw;
    }
  });

  return JSON.stringify(compact);
}

function ProductsServicesModule({ activeScreen }: ProductsServicesModuleProps) {
  const [activeTab, setActiveTab] = useState<ProductsServicesScreenKey>(
    activeScreen ?? 'productList',
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

  const tableFields = useMemo(() => {
    if (!config.tableFields) {
      return config.fields;
    }

    const mapByName = new Map(config.fields.map((field) => [field.name, field]));
    return config.tableFields
      .map((name) => mapByName.get(name))
      .filter((field): field is FieldConfig => Boolean(field));
  }, [config]);

  useEffect(() => {
    if (activeScreen && activeScreen !== activeTab) {
      setActiveTab(activeScreen);
    }
  }, [activeScreen, activeTab]);

  async function loadRows() {
    const response = await apiFetch(`/api/product-services/${config.endpoint}`);
    if (!response.ok) {
      throw new Error(`Status ${response.status}`);
    }
    const json = (await response.json()) as Array<Record<string, unknown>>;
    setRowsByScreen((prev) => ({
      ...prev,
      [config.key]: json.map((item) => {
        if (config.key === 'productDetail') {
          return {
            id: String(item.id),
            values: decodeProductDetailValues(item),
          };
        }

        return {
          id: String(item.id),
          values: {
            primaryField: String(item.primaryField ?? ''),
            secondaryField: String(item.secondaryField ?? ''),
            tertiaryField: String(item.tertiaryField ?? ''),
            quaternaryField: String(item.quaternaryField ?? ''),
            status: String(item.status ?? ''),
          },
        };
      }),
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
      const endpoint = `/api/product-services/${config.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;

      let requestBody: Record<string, string>;
      if (config.key === 'productDetail') {
        const packed = buildPackedProductDetails(formValues);
        if (packed.length > 600) {
          setSaveError('Product detail data is too large. Shorten long text fields (Description/SEO) and try again.');
          return;
        }

        const [secondaryField, tertiaryField, quaternaryField] = splitStringIntoChunks(packed, 200, 3);
        requestBody = {
          primaryField: (formValues.title ?? '').trim(),
          secondaryField,
          tertiaryField,
          quaternaryField,
          status: (formValues.status ?? 'Active').trim(),
        };
      } else {
        requestBody = {
          primaryField: formValues.primaryField ?? '',
          secondaryField: formValues.secondaryField ?? '',
          tertiaryField: formValues.tertiaryField ?? '',
          quaternaryField: formValues.quaternaryField ?? '',
          status: formValues.status ?? 'Active',
        };
      }

      const response = await apiFetch(endpoint, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
      const response = await apiFetch(`/api/product-services/${config.endpoint}/${id}`, {
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
      <h1 className="page-title mb-2">Products &amp; Services</h1>
      <p className="text-secondary mb-3">
        Maintain product/service catalogs, units, categories, pricing, and tax classification.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>

              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{config.title}</h2>
                  <div className="text-secondary small">Product/Service Screen</div>
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

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size={config.key === 'productDetail' ? 'xl' : undefined}>
        <Modal.Header closeButton>
          <Modal.Title>{mode === 'create' ? `Create ${config.title}` : `Edit ${config.title}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="g-3">
              {config.fields.map((field) => (
                <Col xs={12} md={config.key === 'productDetail' ? 4 : 6} key={field.name}>
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

export default ProductsServicesModule;

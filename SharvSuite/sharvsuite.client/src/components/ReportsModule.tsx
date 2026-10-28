import { useEffect, useMemo, useRef, useState } from 'react';
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiFetch } from '../apiClient';
import CustomerTypeahead from './CustomerTypeahead';

export type ReportsScreenKey =
  | 'profitLoss'
  | 'balance'
  | 'cashflow'
  | 'salesByPeriod'
  | 'salesByProduct'
  | 'salesByCurrency'
  | 'taxSummary'
  | 'gstVatReport'
  | 'regionTax'
  | 'customerLedger'
  | 'vendorLedger';

type FieldConfig = {
  name: 'primaryField' | 'secondaryField' | 'tertiaryField' | 'quaternaryField' | 'status';
  label: string;
  type: 'text' | 'select' | 'date';
  required?: boolean;
  options?: string[];
  lookup?: 'customer';
};

type ScreenConfig = {
  key: ReportsScreenKey;
  title: string;
  endpoint: string;
  category: 'Financial Reports' | 'Sales Reports' | 'Tax Reports' | 'Ledger Reports';
  fields: FieldConfig[];
};

type CrudRow = {
  id: string;
  values: Record<string, string>;
};

type RowsState = Record<ReportsScreenKey, CrudRow[]>;

type ReportsModuleProps = {
  activeScreen?: ReportsScreenKey;
  onScreenChange?: (screen: ReportsScreenKey) => void;
};

const screenConfigs: ScreenConfig[] = [
  {
    key: 'profitLoss',
    title: 'Profit & Loss',
    endpoint: 'profit-loss',
    category: 'Financial Reports',
    fields: [
      { name: 'primaryField', label: 'Report Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Period From', type: 'date', required: true },
      { name: 'tertiaryField', label: 'Period To', type: 'date', required: true },
      { name: 'quaternaryField', label: 'Currency', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
    ],
  },
  {
    key: 'balance',
    title: 'Balance',
    endpoint: 'balance',
    category: 'Financial Reports',
    fields: [
      { name: 'primaryField', label: 'Report Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'As Of Date', type: 'date', required: true },
      { name: 'tertiaryField', label: 'Tax Regime', type: 'text' },
      { name: 'quaternaryField', label: 'Language', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
    ],
  },
  {
    key: 'cashflow',
    title: 'Cashflow',
    endpoint: 'cashflow',
    category: 'Financial Reports',
    fields: [
      { name: 'primaryField', label: 'Report Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Period', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Currency Conversion', type: 'text' },
      { name: 'quaternaryField', label: 'Language', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
    ],
  },
  {
    key: 'salesByPeriod',
    title: 'Sales by period',
    endpoint: 'sales-by-period',
    category: 'Sales Reports',
    fields: [
      { name: 'primaryField', label: 'Period', type: 'text', required: true },
      { name: 'secondaryField', label: 'Region', type: 'text' },
      { name: 'tertiaryField', label: 'Tax Regime', type: 'text' },
      { name: 'quaternaryField', label: 'Currency', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
    ],
  },
  {
    key: 'salesByProduct',
    title: 'Sales by product',
    endpoint: 'sales-by-product',
    category: 'Sales Reports',
    fields: [
      { name: 'primaryField', label: 'Product', type: 'text', required: true },
      { name: 'secondaryField', label: 'Period', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Currency', type: 'text' },
      { name: 'quaternaryField', label: 'Language', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
    ],
  },
  {
    key: 'salesByCurrency',
    title: 'Sales by currency',
    endpoint: 'sales-by-currency',
    category: 'Sales Reports',
    fields: [
      { name: 'primaryField', label: 'Currency', type: 'text', required: true },
      { name: 'secondaryField', label: 'Period', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Converted Total', type: 'text' },
      { name: 'quaternaryField', label: 'Tax Regime', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
    ],
  },
  {
    key: 'taxSummary',
    title: 'Tax summary',
    endpoint: 'tax-summary',
    category: 'Tax Reports',
    fields: [
      { name: 'primaryField', label: 'Tax Regime', type: 'text', required: true },
      { name: 'secondaryField', label: 'Period', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Region', type: 'text' },
      { name: 'quaternaryField', label: 'Language', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
    ],
  },
  {
    key: 'gstVatReport',
    title: 'GST/VAT report',
    endpoint: 'gst-vat-report',
    category: 'Tax Reports',
    fields: [
      { name: 'primaryField', label: 'Report Type', type: 'text', required: true },
      { name: 'secondaryField', label: 'Period', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Country/State', type: 'text' },
      { name: 'quaternaryField', label: 'Tax Regime', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
    ],
  },
  {
    key: 'regionTax',
    title: 'region tax',
    endpoint: 'region-tax',
    category: 'Tax Reports',
    fields: [
      { name: 'primaryField', label: 'Region', type: 'text', required: true },
      { name: 'secondaryField', label: 'Tax Type', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Rate', type: 'text' },
      { name: 'quaternaryField', label: 'Period', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
    ],
  },
  {
    key: 'customerLedger',
    title: 'Customer ledger',
    endpoint: 'customer-ledger',
    category: 'Ledger Reports',
    fields: [
      { name: 'primaryField', label: 'Customer Name', type: 'text', required: true, lookup: 'customer' },
      { name: 'secondaryField', label: 'Period', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Currency', type: 'text' },
      { name: 'quaternaryField', label: 'Tax Regime', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
    ],
  },
  {
    key: 'vendorLedger',
    title: 'Vendor ledger',
    endpoint: 'vendor-ledger',
    category: 'Ledger Reports',
    fields: [
      { name: 'primaryField', label: 'Vendor Name', type: 'text', required: true },
      { name: 'secondaryField', label: 'Period', type: 'text', required: true },
      { name: 'tertiaryField', label: 'Currency', type: 'text' },
      { name: 'quaternaryField', label: 'Tax Regime', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: ['Generated', 'Draft'] },
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

function ReportsModule({ activeScreen }: ReportsModuleProps) {
  const reportViewRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<ReportsScreenKey>(activeScreen ?? 'profitLoss');
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
  const reportRows = useMemo(
    () =>
      rows.map((row) =>
        config.fields.reduce((acc, field) => {
          acc[field.label] = row.values[field.name] || '-';
          return acc;
        }, {} as Record<string, string>),
      ),
    [config.fields, rows],
  );

  useEffect(() => {
    if (activeScreen && activeScreen !== activeTab) {
      setActiveTab(activeScreen);
    }
  }, [activeScreen, activeTab]);

  async function loadRows() {
    const response = await apiFetch(`/api/reports/${config.endpoint}`);
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
          customerId: String(item.customerId ?? ''),
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
    try {
      const endpoint = `/api/reports/${config.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;
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
      const response = await apiFetch(`/api/reports/${config.endpoint}/${id}`, {
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

  function downloadExcel() {
    const worksheet = XLSX.utils.json_to_sheet(reportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${config.title.replace(/\s+/g, '-')}-report.xlsx`);
  }

  async function downloadPdf() {
    if (!reportViewRef.current) {
      return;
    }

    const canvas = await html2canvas(reportViewRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });

    const imageData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageWidth = pageWidth - 16;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;

    let currentY = 8;
    let remainingHeight = imageHeight;

    pdf.addImage(imageData, 'PNG', 8, currentY, imageWidth, imageHeight);
    remainingHeight -= pageHeight - 16;

    while (remainingHeight > 0) {
      pdf.addPage();
      currentY = 8 - (imageHeight - remainingHeight);
      pdf.addImage(imageData, 'PNG', 8, currentY, imageWidth, imageHeight);
      remainingHeight -= pageHeight - 16;
    }

    pdf.save(`${config.title.replace(/\s+/g, '-')}-report.pdf`);
  }

  return (
    <>
      <h1 className="page-title mb-2">Reports</h1>
      <p className="text-secondary mb-3">
        Financial, sales, tax, and ledger reporting with currency conversion, tax regime, and language support.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>

              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2 mb-3">
                <div>
                  <h2 className="h5 mb-1">{config.title}</h2>
                  <div className="text-secondary small">{config.category}</div>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    variant="outline-success"
                    onClick={downloadExcel}
                    disabled={rows.length === 0}
                  >
                    Download Excel
                  </Button>
                  <Button
                    variant="outline-danger"
                    onClick={() => {
                      void downloadPdf();
                    }}
                    disabled={rows.length === 0}
                  >
                    Download PDF
                  </Button>
                  <Button
                    onClick={openCreateModal}
                    style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
                  >
                    Add Record
                  </Button>
                </div>
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

              <div ref={reportViewRef} className="report-html-view mt-4">
                <div className="report-html-header">
                  <h3 className="h6 mb-1">{config.title} Report</h3>
                  <div className="small text-secondary">
                    Generated HTML View | {new Date().toLocaleString()}
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm report-html-table mb-0">
                    <thead>
                      <tr>
                        {config.fields.map((field) => (
                          <th key={field.name}>{field.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={config.fields.length} className="text-center text-secondary py-3">
                            No data available for report preview.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr key={`report-${row.id}`}>
                            {config.fields.map((field) => (
                              <td key={`report-${row.id}-${field.name}`}>
                                {row.values[field.name] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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

export default ReportsModule;






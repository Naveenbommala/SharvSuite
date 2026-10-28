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

export type UsersRolesScreenKey =
  | 'userList'
  | 'inviteUser'
  | 'roleManagement'
  | 'permissionsMatrix';

type FieldType = 'text' | 'email' | 'date' | 'select';

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
};

type ScreenConfig = {
  key: UsersRolesScreenKey;
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

type RowsState = Record<UsersRolesScreenKey, CrudRow[]>;

type UsersRolesModuleProps = {
  activeScreen?: UsersRolesScreenKey;
  onScreenChange?: (screen: UsersRolesScreenKey) => void;
};

const screenConfigs: ScreenConfig[] = [
  {
    key: 'userList',
    title: 'User List',
    description: 'Manage users and role assignments.',
    endpoint: 'user-list',
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      {
        name: 'roleName',
        label: 'Role',
        type: 'select',
        required: true,
        options: ['Admin', 'Manager', 'Staff', 'Viewer'],
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: ['Active', 'Inactive'],
      },
    ],
    columns: ['fullName', 'email', 'roleName', 'status'],
  },
  {
    key: 'inviteUser',
    title: 'Invite User',
    description: 'Invite users with role and expiry controls.',
    endpoint: 'invite-user',
    fields: [
      { name: 'email', label: 'Email', type: 'email', required: true },
      {
        name: 'roleName',
        label: 'Role',
        type: 'select',
        required: true,
        options: ['Admin', 'Manager', 'Staff', 'Viewer'],
      },
      { name: 'expiresOn', label: 'Expires On', type: 'date', required: true },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: ['Pending', 'Accepted', 'Expired'],
      },
    ],
    columns: ['email', 'roleName', 'expiresOn', 'status'],
  },
  {
    key: 'roleManagement',
    title: 'Role Management',
    description: 'Create and manage role definitions and data scope.',
    endpoint: 'role-management',
    fields: [
      { name: 'name', label: 'Role Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'text' },
      {
        name: 'dataScope',
        label: 'Data Scope',
        type: 'select',
        required: true,
        options: ['Own', 'Department', 'All'],
      },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: ['Active', 'Inactive'],
      },
    ],
    columns: ['name', 'description', 'dataScope', 'status'],
  },
  {
    key: 'permissionsMatrix',
    title: 'Permissions Matrix',
    description: 'Configure module and action permissions by role.',
    endpoint: 'permissions-matrix',
    fields: [
      {
        name: 'roleName',
        label: 'Role',
        type: 'select',
        required: true,
        options: ['Admin', 'Manager', 'Staff', 'Viewer'],
      },
      {
        name: 'moduleName',
        label: 'Module Access',
        type: 'select',
        required: true,
        options: ['Dashboard', 'Sales', 'Purchases', 'Reports', 'Settings'],
      },
      {
        name: 'actionPermissions',
        label: 'Action Permissions',
        type: 'text',
        required: true,
      },
      {
        name: 'dataScope',
        label: 'Data Scope',
        type: 'select',
        required: true,
        options: ['Own', 'Department', 'All'],
      },
    ],
    columns: ['roleName', 'moduleName', 'actionPermissions', 'dataScope'],
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

function UsersRolesModule({ activeScreen }: UsersRolesModuleProps) {
  const [activeTab, setActiveTab] = useState<UsersRolesScreenKey>(activeScreen ?? 'userList');
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
        const response = await apiFetch(`/api/users-roles/${activeConfig.endpoint}`);
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

        const details = error instanceof Error ? error.message : 'Unable to load records.';
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
    }));
  }

  function validateRequiredFields(): boolean {
    return activeConfig.fields
      .filter((field) => field.required)
      .every((field) => (formValues[field.name] ?? '').trim().length > 0);
  }

  async function refreshActiveScreen() {
    const response = await apiFetch(`/api/users-roles/${activeConfig.endpoint}`);
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
      const endpoint = `/api/users-roles/${activeConfig.endpoint}${mode === 'edit' && editingId ? `/${editingId}` : ''}`;
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await apiFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
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
      const response = await apiFetch(`/api/users-roles/${activeConfig.endpoint}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      await refreshActiveScreen();
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'Request failed.';
      setRowsError(`Unable to delete record. ${details}`);
    }
  }

  return (
    <>
      <h1 className="page-title mb-2">Users &amp; Roles</h1>
      <p className="text-secondary mb-3">
        Manage user onboarding, role-based access, and permission controls across
        modules.
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

              {rowsError ? <div className="alert alert-danger py-2 small">{rowsError}</div> : null}

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
                <Col xs={12} md={6} key={field.name}>
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

export default UsersRolesModule;






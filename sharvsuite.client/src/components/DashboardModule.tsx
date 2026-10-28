import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Row, Spinner } from 'react-bootstrap';
import { apiFetch } from '../apiClient';

export type DashboardScreenKey =
  | 'overviewDashboard'
  | 'financialDashboard'
  | 'salesDashboard'
  | 'inventoryDashboard';

type DashboardModuleProps = {
  activeScreen?: DashboardScreenKey;
  onScreenChange?: (screen: DashboardScreenKey) => void;
};

type Widget = {
  name: string;
  value: number;
};

type DashboardApiResponse = {
  screenKey: string;
  currencyCode: string;
  widgets: Widget[];
};

type DashboardConfig = {
  key: DashboardScreenKey;
  title: string;
  endpoint: string;
};

const dashboardConfigs: DashboardConfig[] = [
  {
    key: 'overviewDashboard',
    title: 'Overview Dashboard',
    endpoint: 'overview-dashboard',
  },
  {
    key: 'financialDashboard',
    title: 'Financial Dashboard',
    endpoint: 'financial-dashboard',
  },
  {
    key: 'salesDashboard',
    title: 'Sales Dashboard',
    endpoint: 'sales-dashboard',
  },
  {
    key: 'inventoryDashboard',
    title: 'Inventory Dashboard',
    endpoint: 'inventory-dashboard',
  },
];

function DashboardModule({ activeScreen }: DashboardModuleProps) {
  const [activeTab, setActiveTab] = useState<DashboardScreenKey>(
    activeScreen ?? 'overviewDashboard',
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [widgets, setWidgets] = useState<Widget[]>([]);

  const config = useMemo(
    () => dashboardConfigs.find((item) => item.key === activeTab) ?? dashboardConfigs[0],
    [activeTab],
  );

  useEffect(() => {
    if (activeScreen && activeScreen !== activeTab) {
      setActiveTab(activeScreen);
    }
  }, [activeScreen, activeTab]);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const response = await apiFetch(`/api/dashboard/${config.endpoint}`);
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }

        const json = (await response.json()) as DashboardApiResponse;
        if (!mounted) {
          return;
        }

        setWidgets(json.widgets);
        setCurrencyCode(json.currencyCode);
      } catch (requestError: unknown) {
        if (!mounted) {
          return;
        }
        const details =
          requestError instanceof Error ? requestError.message : 'Unknown error';
        setError(`Unable to load ${config.title}. ${details}`);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, [config]);

  function formatValue(widgetName: string, value: number): string {
    const currencyWidgetNames = new Set([
      'sales',
      'expenses',
      'profit',
      'receivables',
      'payables',
      'currency-converted totals',
    ]);

    if (currencyWidgetNames.has(widgetName)) {
      return `${currencyCode} ${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return value.toLocaleString();
  }

  return (
    <>
      <h1 className="page-title mb-2">Dashboard</h1>
      <p className="text-secondary mb-3">
        Track performance across overview, financial, sales, and inventory dashboards.
      </p>

      <Row className="g-3">
        <Col xs={12} xl={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body>

              {error ? <div className="alert alert-danger py-2 small">{error}</div> : null}

              {loading ? (
                <div className="text-secondary py-4 text-center">
                  <Spinner size="sm" animation="border" className="me-2" />
                  Loading dashboard...
                </div>
              ) : (
                <Row className="g-3">
                  {widgets.map((widget) => (
                    <Col xs={12} sm={6} lg={4} key={widget.name}>
                      <Card className="border-0 bg-light-subtle h-100">
                        <Card.Body>
                          <div className="small text-uppercase text-secondary fw-semibold">
                            {widget.name}
                          </div>
                          <div className="mt-2 fs-5 fw-semibold">
                            {formatValue(widget.name, widget.value)}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

export default DashboardModule;






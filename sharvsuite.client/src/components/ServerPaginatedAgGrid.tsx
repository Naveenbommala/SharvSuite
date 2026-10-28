import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, type ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

ModuleRegistry.registerModules([AllCommunityModule]);

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
};

type ServerPaginatedAgGridProps<T extends object> = {
  columns: Array<ColDef<T>>;
  fetchPage: (page: number, pageSize: number) => Promise<PagedResult<T>>;
  getRowId: (row: T) => string;
  refreshKey?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onSelectionChange?: (selected: T | null) => void;
  onTotalCountChange?: (total: number) => void;
  height?: number;
};

function ServerPaginatedAgGrid<T extends object>({
  columns,
  fetchPage,
  getRowId,
  refreshKey = 0,
  defaultPageSize = 10,
  pageSizeOptions = [10, 20, 50],
  onSelectionChange,
  onTotalCountChange,
  height = 420,
}: ServerPaginatedAgGridProps<T>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [rows, setRows] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    void fetchPage(page, pageSize)
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setRows(result.items);
        setTotalCount(result.totalCount);
        onTotalCountChange?.(result.totalCount);
        onSelectionChange?.(null);
      })
      .catch((fetchError: unknown) => {
        if (!isMounted) {
          return;
        }

        const details = fetchError instanceof Error ? fetchError.message : 'Unknown error';
        setError(`Unable to load grid data. ${details}`);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchPage, onSelectionChange, onTotalCountChange, page, pageSize, refreshKey]);

  const rowIdGetter = useMemo(
    () => ({
      getRowId: (params: { data: T }) => getRowId(params.data),
    }),
    [getRowId],
  );

  return (
    <div className="server-grid-shell d-flex flex-column gap-2">
      {error ? <Alert variant="danger" className="mb-1 py-2">{error}</Alert> : null}

      <div className="ag-theme-quartz server-grid" style={{ width: '100%', height }}>
        <AgGridReact<T>
          {...rowIdGetter}
          rowData={rows}
          columnDefs={columns}
          rowSelection="single"
          onSelectionChanged={(event) => {
            const selected = event.api.getSelectedRows();
            onSelectionChange?.(selected[0] ?? null);
          }}
          animateRows
          suppressCellFocus
        />
      </div>

      <div className="grid-pagination d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
        <div className="small text-secondary fw-medium">
          {totalCount === 0 ? 'No records' : `Showing page ${page} of ${totalPages} (${totalCount} records)`}
        </div>
        <div className="d-flex align-items-center gap-2 grid-controls">
          <Form.Select
            size="sm"
            className="grid-page-size"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </Form.Select>
          <Button
            size="sm"
            variant="outline-secondary"
            className="grid-pager-btn"
            disabled={page <= 1 || isLoading}
            onClick={() => {
              setPage((prev) => Math.max(1, prev - 1));
            }}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline-secondary"
            className="grid-pager-btn"
            disabled={page >= totalPages || isLoading}
            onClick={() => {
              setPage((prev) => Math.min(totalPages, prev + 1));
            }}
          >
            Next
          </Button>
          {isLoading ? <Spinner size="sm" animation="border" /> : null}
        </div>
      </div>
    </div>
  );
}

export default ServerPaginatedAgGrid;

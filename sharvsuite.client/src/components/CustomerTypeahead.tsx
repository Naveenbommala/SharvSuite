import { useEffect, useMemo, useState } from 'react';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { fetchCustomerOptions, findCustomerMatch } from './customerLookup';

type CustomerTypeaheadProps = {
  controlId: string;
  value: string;
  customerId: string;
  onChange: (customerName: string, customerId: string) => void;
  placeholder?: string;
};

function CustomerTypeahead({
  controlId,
  value,
  customerId,
  onChange,
  placeholder,
}: CustomerTypeaheadProps) {
  const [options, setOptions] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);

    void fetchCustomerOptions()
      .then((items) => {
        if (!mounted) {
          return;
        }

        setOptions(items);
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        const details = error instanceof Error ? error.message : 'Unknown error';
        setLoadError(`Unable to load customers. ${details}`);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (customerId || !value.trim() || options.length === 0) {
      return;
    }

    const match = findCustomerMatch(options, value);
    if (match) {
      onChange(match.name, match.id);
    }
  }, [customerId, onChange, options, value]);

  const filteredOptions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query) {
      return options.slice(0, 8);
    }

    return options
      .filter(
        (option) =>
          option.name.toLowerCase().includes(query) ||
          option.code.toLowerCase().includes(query),
      )
      .slice(0, 8);
  }, [options, value]);

  function selectCustomer(option: { id: string; name: string }) {
    onChange(option.name, option.id);
    setShowSuggestions(false);
  }

  function applyExactMatch() {
    const match = findCustomerMatch(options, value);
    if (match) {
      selectCustomer(match);
    }
  }

  return (
    <div className="customer-typeahead">
      <Form.Control
        id={controlId}
        type="text"
        value={value}
        placeholder={placeholder ?? 'Search customer by name or code'}
        autoComplete="off"
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => {
          window.setTimeout(() => {
            applyExactMatch();
            setShowSuggestions(false);
          }, 120);
        }}
        onChange={(event) => {
          onChange(event.target.value, '');
          setShowSuggestions(true);
        }}
      />

      {showSuggestions ? (
        <div className="customer-typeahead__menu">
          {loading ? (
            <div className="customer-typeahead__status">
              <Spinner size="sm" animation="border" className="me-2" />
              Loading customers...
            </div>
          ) : loadError ? (
            <div className="customer-typeahead__status text-danger">{loadError}</div>
          ) : filteredOptions.length === 0 ? (
            <div className="customer-typeahead__status">No matching customers found.</div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className="customer-typeahead__option"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectCustomer(option);
                }}
              >
                <span>{option.name}</span>
                <span className="customer-typeahead__code">{option.code || option.id}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

export default CustomerTypeahead;

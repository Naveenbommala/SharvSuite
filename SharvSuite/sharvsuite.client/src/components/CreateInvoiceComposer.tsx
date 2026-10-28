import { useEffect, useMemo, useState } from 'react';
import { Button, Col, Form, Row, Table } from 'react-bootstrap';
import { apiFetch } from '../apiClient';
import CustomerTypeahead from './CustomerTypeahead';

type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: string;
  rate: string;
};

type InvoiceComposerState = {
  logoName: string;
  billedBy: string;
  paymentInstructions: string;
  termsAndConditions: string;
  signatureName: string;
  attachmentNames: string[];
  discountMode: 'fixed' | 'percent';
  discountValue: string;
  taxMode: 'fixed' | 'percent';
  taxValue: string;
  taxLabel: string;
  lineItems: InvoiceLineItem[];
};

type CreateInvoiceComposerProps = {
  formValues: Record<string, string>;
  invoiceComposer: InvoiceComposerState;
  resolvedValues: Record<string, string>;
  onFormValueChange: (name: string, value: string) => void;
  onCustomerChange: (customerName: string, customerId: string) => void;
  onComposerChange: (patch: Partial<InvoiceComposerState>) => void;
  onLineItemChange: (lineItemId: string, key: keyof InvoiceLineItem, value: string) => void;
  onAddLineItem: () => void;
  onRemoveLineItem: (lineItemId: string) => void;
  onLogoUpload: (files: FileList | null) => void;
  onSignatureUpload: (files: FileList | null) => void;
  onAttachmentUpload: (files: FileList | null) => void;
  onPreviewPdf: () => void;
  onSendShare: () => void;
  onSave: () => void;
  addDays: (dateValue: string, days: number) => string;
  parseDecimal: (value: string) => number;
  formatMoneyValue: (value: number) => string;
};

type ProductServiceOption = {
  id: string;
  name: string;
  sku: string;
  price: string;
};

function CreateInvoiceComposer({
  formValues,
  invoiceComposer,
  resolvedValues,
  onFormValueChange,
  onCustomerChange,
  onComposerChange,
  onLineItemChange,
  onAddLineItem,
  onRemoveLineItem,
  onLogoUpload,
  onSignatureUpload,
  onAttachmentUpload,
  onPreviewPdf,
  onSendShare,
  onSave,
  addDays,
  parseDecimal,
  formatMoneyValue,
}: CreateInvoiceComposerProps) {
  const [productOptions, setProductOptions] = useState<ProductServiceOption[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadProductOptions() {
      const [detailResponse, listResponse] = await Promise.all([
        apiFetch('/api/product-services/product-detail'),
        apiFetch('/api/product-services/product-list'),
      ]);

      if (!detailResponse.ok || !listResponse.ok) {
        return;
      }

      const detailJson = (await detailResponse.json()) as Array<Record<string, unknown>>;
      const listJson = (await listResponse.json()) as Array<Record<string, unknown>>;

      const detailOptions = detailJson.map((item) => {
        const packed = `${String(item.secondaryField ?? '')}${String(item.tertiaryField ?? '')}${String(item.quaternaryField ?? '')}`;
        let sku = '';
        let price = '';

        try {
          const parsed = JSON.parse(packed) as Record<string, unknown>;
          sku = String(parsed.sk ?? '');
          price = String(parsed.pr ?? '');
        } catch {
          // Keep fallback values when product detail rows are legacy/plain text.
        }

        return {
          id: String(item.id ?? ''),
          name: String(item.primaryField ?? ''),
          sku,
          price,
        };
      });

      const listOptions = listJson.map((item) => ({
        id: String(item.id ?? ''),
        name: String(item.primaryField ?? ''),
        sku: String(item.secondaryField ?? ''),
        price: '',
      }));

      const merged = [...detailOptions, ...listOptions].filter((item) => item.name.trim().length > 0);
      const deduped = merged.filter(
        (item, index, arr) =>
          arr.findIndex((candidate) => candidate.name.trim().toLowerCase() === item.name.trim().toLowerCase()) === index,
      );

      if (mounted) {
        setProductOptions(deduped);
      }
    }

    void loadProductOptions();
    return () => {
      mounted = false;
    };
  }, []);

  const productOptionMap = useMemo(
    () =>
      productOptions.reduce((acc, option) => {
        acc[option.name] = option;
        return acc;
      }, {} as Record<string, ProductServiceOption>),
    [productOptions],
  );

  return (
    <div className="invoice-builder">
      <div className="invoice-builder__hero">
        <div>
          <div className="invoice-builder__eyebrow">Zoho-style workspace</div>
          <h3 className="invoice-builder__title">Invoice</h3>
          <p className="invoice-builder__subtitle mb-0">
            Build a polished invoice with branding, invoice meta, billed by/to, live line items, financial summary, notes, attachments, and share actions.
          </p>
        </div>
        <div className="invoice-builder__hero-actions">
          <Button variant="outline-secondary" onClick={onPreviewPdf}>Preview PDF</Button>
          <Button variant="outline-primary" onClick={onSendShare}>Send / Share</Button>
          <Button onClick={onSave} style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>Save Invoice</Button>
        </div>
      </div>

      <Row className="g-3">
        <Col xs={12} xl={8}>
          <div className="invoice-builder__panel">
            <div className="invoice-builder__section-head">
              <div>
                <h4>Header & Branding</h4>
                <p>Label the document clearly and add a logo reference for brand identity.</p>
              </div>
              <div className="invoice-builder__logo-tile"><span>{invoiceComposer.logoName || 'Logo'}</span></div>
            </div>
            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Group controlId="invoice-logo-upload">
                  <Form.Label>Business Logo</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={(event) => onLogoUpload((event.currentTarget as HTMLInputElement).files)} />
                  <Form.Text>Upload a logo reference under 1MB.</Form.Text>
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="invoice-status">
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={formValues.status ?? ''} onChange={(event) => onFormValueChange('status', event.target.value)}>
                    {['Draft', 'Ready', 'Sent', 'Paid'].map((option) => <option key={option} value={option}>{option}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={12} md={4}>
                <Form.Group controlId="invoice-number">
                  <Form.Label>Invoice Number</Form.Label>
                  <Form.Control value={formValues.invoiceNumber ?? ''} onChange={(event) => onFormValueChange('invoiceNumber', event.target.value)} />
                </Form.Group>
              </Col>
              <Col xs={12} md={4}>
                <Form.Group controlId="invoice-date">
                  <Form.Label>Date of Issue</Form.Label>
                  <Form.Control type="date" value={formValues.invoiceDate ?? ''} onChange={(event) => onFormValueChange('invoiceDate', event.target.value)} />
                </Form.Group>
              </Col>
              <Col xs={12} md={4}>
                <Form.Group controlId="invoice-due-date">
                  <Form.Label>Due Date</Form.Label>
                  <Form.Control type="date" value={formValues.dueDate ?? ''} onChange={(event) => onFormValueChange('dueDate', event.target.value)} />
                </Form.Group>
              </Col>
            </Row>
          </div>

          <div className="invoice-builder__panel">
            <div className="invoice-builder__section-head">
              <div>
                <h4>Contact Details</h4>
                <p>Capture company details, client details, and billing / shipping context.</p>
              </div>
            </div>
            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Group controlId="invoice-billed-by">
                  <Form.Label>Billed By</Form.Label>
                  <Form.Control as="textarea" rows={5} value={invoiceComposer.billedBy} onChange={(event) => onComposerChange({ billedBy: event.target.value })} placeholder="Your company name, address, phone, and tax info" />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <div className="invoice-builder__stack">
                  <Form.Group controlId="invoice-customer">
                    <Form.Label>Billed To</Form.Label>
                    <CustomerTypeahead controlId="invoice-customer" value={formValues.customerName ?? ''} customerId={formValues.customerId ?? ''} onChange={onCustomerChange} />
                  </Form.Group>
                  <Form.Group controlId="invoice-customer-email">
                    <Form.Label>Customer Email</Form.Label>
                    <Form.Control type="email" value={formValues.customerEmail ?? ''} onChange={(event) => onFormValueChange('customerEmail', event.target.value)} />
                  </Form.Group>
                  <Form.Group controlId="invoice-billing-address">
                    <Form.Label>Billing Address</Form.Label>
                    <Form.Control as="textarea" rows={3} value={formValues.billingAddress ?? ''} onChange={(event) => onFormValueChange('billingAddress', event.target.value)} />
                  </Form.Group>
                  <Form.Group controlId="invoice-shipping-address">
                    <Form.Label>Shipping Address</Form.Label>
                    <Form.Control as="textarea" rows={3} value={formValues.shippingAddress ?? ''} onChange={(event) => onFormValueChange('shippingAddress', event.target.value)} />
                  </Form.Group>
                </div>
              </Col>
            </Row>
          </div>

          <div className="invoice-builder__panel">
            <div className="invoice-builder__section-head">
              <div>
                <h4>Line Items</h4>
                <p>Add products or services with quantity, rate, and automatic amount calculations.</p>
              </div>
              <Button variant="outline-primary" size="sm" onClick={onAddLineItem}>Add Line Item</Button>
            </div>
            <div className="invoice-builder__line-table">
              <Table responsive className="align-middle mb-0">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ width: '120px' }}>Qty / Hours</th>
                    <th style={{ width: '140px' }}>Rate</th>
                    <th style={{ width: '140px' }}>Amount</th>
                    <th style={{ width: '90px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceComposer.lineItems.map((item) => {
                    const amount = parseDecimal(item.quantity) * parseDecimal(item.rate);
                    const selectedOption = productOptionMap[item.description];
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="invoice-builder__line-item-cell">
                            <Form.Select
                              value={selectedOption?.name ?? ''}
                              onChange={(event) => {
                                const option = productOptionMap[event.target.value];
                                onLineItemChange(item.id, 'description', event.target.value);
                                if (option?.price) {
                                  onLineItemChange(item.id, 'rate', option.price);
                                }
                              }}
                            >
                              <option value="">Select product / service</option>
                              {productOptions.map((option) => (
                                <option key={option.id || option.name} value={option.name}>
                                  {option.name}{option.sku ? ` (${option.sku})` : ''}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control
                              className="mt-2"
                              value={item.description}
                              placeholder="Product or service description"
                              onChange={(event) => onLineItemChange(item.id, 'description', event.target.value)}
                            />
                          </div>
                        </td>
                        <td><Form.Control type="number" min="0" step="0.01" value={item.quantity} onChange={(event) => onLineItemChange(item.id, 'quantity', event.target.value)} /></td>
                        <td><Form.Control type="number" min="0" step="0.01" value={item.rate} onChange={(event) => onLineItemChange(item.id, 'rate', event.target.value)} /></td>
                        <td><div className="invoice-builder__amount-cell">{resolvedValues.currency || 'USD'} {formatMoneyValue(amount)}</div></td>
                        <td><Button variant="outline-danger" size="sm" onClick={() => onRemoveLineItem(item.id)}>Remove</Button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>

          <div className="invoice-builder__panel">
            <div className="invoice-builder__section-head">
              <div>
                <h4>Payment Instructions, Notes & Attachments</h4>
                <p>Add settlement details, thank-you text, terms, signature, and supporting documents.</p>
              </div>
            </div>
            <Row className="g-3">
              <Col xs={12} md={6}>
                <Form.Group controlId="invoice-payment-instructions">
                  <Form.Label>Payment Instructions</Form.Label>
                  <Form.Control as="textarea" rows={4} value={invoiceComposer.paymentInstructions} onChange={(event) => onComposerChange({ paymentInstructions: event.target.value })} placeholder="Bank transfer details, PayPal link, or payment button info" />
                </Form.Group>
              </Col>
              <Col xs={12} md={6}>
                <Form.Group controlId="invoice-notes">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control as="textarea" rows={4} value={formValues.notes ?? ''} onChange={(event) => onFormValueChange('notes', event.target.value)} placeholder="Thank you, milestone reminders, or customer-facing notes" />
                </Form.Group>
              </Col>
              <Col xs={12}>
                <Form.Group controlId="invoice-terms">
                  <Form.Label>Terms & Conditions</Form.Label>
                  <Form.Control as="textarea" rows={3} value={invoiceComposer.termsAndConditions} onChange={(event) => onComposerChange({ termsAndConditions: event.target.value })} placeholder="Late fee policy, project milestones, or additional commercial terms" />
                </Form.Group>
              </Col>
              <Col xs={12} md={4}>
                <Form.Group controlId="invoice-signature">
                  <Form.Label>Digital Signature</Form.Label>
                  <Form.Control type="file" accept="image/*,.pdf" onChange={(event) => onSignatureUpload((event.currentTarget as HTMLInputElement).files)} />
                  <Form.Text>{invoiceComposer.signatureName || 'No signature uploaded yet.'}</Form.Text>
                </Form.Group>
              </Col>
              <Col xs={12} md={8}>
                <Form.Group controlId="invoice-attachments">
                  <Form.Label>Attachments</Form.Label>
                  <Form.Control type="file" multiple onChange={(event) => onAttachmentUpload((event.currentTarget as HTMLInputElement).files)} />
                  <Form.Text>{invoiceComposer.attachmentNames.length > 0 ? invoiceComposer.attachmentNames.join(', ') : 'Attach receipts, project photos, or expense reports.'}</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Col>

        <Col xs={12} xl={4}>
          <div className="invoice-builder__panel invoice-builder__panel--sticky">
            <div className="invoice-builder__section-head">
              <div>
                <h4>Financial Summary</h4>
                <p>Live totals with currency, discount, tax, shipping, and preview.</p>
              </div>
            </div>

            <div className="invoice-builder__stack">
              <Form.Group controlId="invoice-status-sidebar">
                <Form.Label>Status</Form.Label>
                <Form.Select value={formValues.status ?? ''} onChange={(event) => onFormValueChange('status', event.target.value)}>
                  {['Draft', 'Ready', 'Sent', 'Paid'].map((option) => <option key={option} value={option}>{option}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group controlId="invoice-currency">
                <Form.Label>Currency</Form.Label>
                <Form.Control value={formValues.currency ?? ''} onChange={(event) => onFormValueChange('currency', event.target.value.toUpperCase())} />
              </Form.Group>
              <Form.Group controlId="invoice-exchange-rate">
                <Form.Label>Exchange Rate</Form.Label>
                <Form.Control type="number" step="0.0001" value={formValues.exchangeRate ?? ''} onChange={(event) => onFormValueChange('exchangeRate', event.target.value)} />
              </Form.Group>
              <Form.Group controlId="invoice-payment-terms">
                <Form.Label>Payment Terms</Form.Label>
                <Form.Select value={formValues.paymentTerms ?? ''} onChange={(event) => {
                  const paymentTerms = event.target.value;
                  const dueDate =
                    paymentTerms === 'Net 7' ? addDays(formValues.invoiceDate ?? '', 7) :
                    paymentTerms === 'Net 15' ? addDays(formValues.invoiceDate ?? '', 15) :
                    paymentTerms === 'Net 30' ? addDays(formValues.invoiceDate ?? '', 30) :
                    formValues.invoiceDate ?? '';
                  onFormValueChange('paymentTerms', paymentTerms);
                  onFormValueChange('dueDate', dueDate);
                }}>
                  {['Due on Receipt', 'Net 7', 'Net 15', 'Net 30'].map((option) => <option key={option} value={option}>{option}</option>)}
                </Form.Select>
              </Form.Group>
              <Row className="g-3">
                <Col xs={6}>
                  <Form.Group controlId="invoice-discount-mode">
                    <Form.Label>Discount Type</Form.Label>
                    <Form.Select value={invoiceComposer.discountMode} onChange={(event) => onComposerChange({ discountMode: event.target.value as 'fixed' | 'percent' })}>
                      <option value="fixed">Fixed</option>
                      <option value="percent">Percent</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group controlId="invoice-discount-value">
                    <Form.Label>Discount Value</Form.Label>
                    <Form.Control type="number" step="0.01" value={invoiceComposer.discountValue} onChange={(event) => onComposerChange({ discountValue: event.target.value })} />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group controlId="invoice-tax-mode">
                    <Form.Label>Tax Type</Form.Label>
                    <Form.Select value={invoiceComposer.taxMode} onChange={(event) => onComposerChange({ taxMode: event.target.value as 'fixed' | 'percent' })}>
                      <option value="percent">Percent</option>
                      <option value="fixed">Fixed</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group controlId="invoice-tax-value">
                    <Form.Label>Tax Value</Form.Label>
                    <Form.Control type="number" step="0.01" value={invoiceComposer.taxValue} onChange={(event) => onComposerChange({ taxValue: event.target.value })} />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group controlId="invoice-tax-label">
                <Form.Label>Tax Label</Form.Label>
                <Form.Control value={invoiceComposer.taxLabel} onChange={(event) => onComposerChange({ taxLabel: event.target.value })} placeholder="GST / VAT / Sales Tax" />
              </Form.Group>
              <Form.Group controlId="invoice-shipping-fee">
                <Form.Label>Shipping Fee</Form.Label>
                <Form.Control type="number" step="0.01" value={formValues.shippingFee ?? ''} onChange={(event) => onFormValueChange('shippingFee', event.target.value)} />
              </Form.Group>
            </div>

            <div className="invoice-builder__summary">
              <div className="invoice-builder__summary-row"><span>Subtotal</span><strong>{resolvedValues.currency || 'USD'} {resolvedValues.subTotal}</strong></div>
              <div className="invoice-builder__summary-row"><span>Discount</span><strong>{resolvedValues.currency || 'USD'} {resolvedValues.discountTotal}</strong></div>
              <div className="invoice-builder__summary-row"><span>{invoiceComposer.taxLabel || 'Tax'}</span><strong>{resolvedValues.currency || 'USD'} {resolvedValues.taxTotal}</strong></div>
              <div className="invoice-builder__summary-row"><span>Shipping</span><strong>{resolvedValues.currency || 'USD'} {formatMoneyValue(parseDecimal(formValues.shippingFee ?? '0'))}</strong></div>
              <div className="invoice-builder__summary-row invoice-builder__summary-row--total"><span>Total Amount Due</span><strong>{resolvedValues.currency || 'USD'} {resolvedValues.grandTotal}</strong></div>
            </div>

            <div className="invoice-builder__preview">
              <div className="invoice-builder__preview-head"><span>Live Invoice Preview</span><span>{resolvedValues.invoiceNumber || 'Draft'}</span></div>
              <div className="invoice-builder__preview-body">
                <div className="invoice-builder__preview-logo">{invoiceComposer.logoName || 'Logo'}</div>
                <div className="invoice-builder__preview-kicker">INVOICE</div>
                <h5>{resolvedValues.customerName || 'Select a customer'}</h5>
                <p>{resolvedValues.customerEmail || 'Customer email will appear here'}</p>
                <div className="invoice-builder__preview-meta">
                  <span>Issue: {resolvedValues.invoiceDate || '-'}</span>
                  <span>Due: {resolvedValues.dueDate || '-'}</span>
                </div>
                <div className="invoice-builder__preview-total">{resolvedValues.currency || 'USD'} {resolvedValues.grandTotal || '0.00'}</div>
                <div className="invoice-builder__preview-note">{formValues.notes || invoiceComposer.termsAndConditions || 'Notes, terms, and thank-you text will appear here.'}</div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}

export default CreateInvoiceComposer;

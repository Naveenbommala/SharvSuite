import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Modal,
  Row,
  Table,
} from 'react-bootstrap';
import { apiFetch } from '../apiClient';

export type RecipesScreenKey = 'recipeCatalog' | 'recipePlanner';

type RecipesModuleProps = {
  activeScreen?: RecipesScreenKey;
  onScreenChange?: (screen: RecipesScreenKey) => void;
};

type InventoryOption = {
  id: string;
  itemName: string;
  sku: string;
  availableQuantity: number;
  valuationLabel: string;
};

type RecipeIngredient = {
  inventoryEntryId: string;
  itemName: string;
  sku: string;
  unit: string;
  quantityPerBatch: number;
};

type RecipeDefinition = {
  id: string;
  recipeName: string;
  outputProductName: string;
  outputSku?: string | null;
  batchYieldQuantity: number;
  yieldUnit: string;
  ingredients: RecipeIngredient[];
  instructions?: string | null;
  status: string;
};

type RecipePlanIngredient = RecipeIngredient & {
  requiredQuantity: number;
  availableQuantity: number;
};

type RecipePlan = {
  id: string;
  recipeDefinitionId: string;
  recipeName: string;
  outputProductName: string;
  batchCount: number;
  plannedOutputQuantity: number;
  yieldUnit: string;
  plannedDateUtc?: string | null;
  ingredients: RecipePlanIngredient[];
  notes?: string | null;
  executionStatus: string;
  executedAtUtc?: string | null;
  status: string;
};

type ExecutePlanResult = {
  recipeName: string;
  movementReference: string;
  adjustments: Array<{
    itemName: string;
    consumedQuantity: number;
    remainingQuantity: number;
    unit: string;
  }>;
};

type IngredientDraft = {
  inventoryEntryId: string;
  unit: string;
  quantityPerBatch: string;
};

const emptyIngredientDraft = (): IngredientDraft => ({
  inventoryEntryId: '',
  unit: 'unit',
  quantityPerBatch: '',
});

function formatNumber(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDate(value?: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function RecipesModule({ activeScreen, onScreenChange }: RecipesModuleProps) {
  const [activeTab, setActiveTab] = useState<RecipesScreenKey>(activeScreen ?? 'recipeCatalog');
  const [inventoryOptions, setInventoryOptions] = useState<InventoryOption[]>([]);
  const [definitions, setDefinitions] = useState<RecipeDefinition[]>([]);
  const [plans, setPlans] = useState<RecipePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [editingDefinitionId, setEditingDefinitionId] = useState<string | null>(null);
  const [definitionName, setDefinitionName] = useState('');
  const [outputProductName, setOutputProductName] = useState('');
  const [outputSku, setOutputSku] = useState('');
  const [batchYieldQuantity, setBatchYieldQuantity] = useState('1');
  const [yieldUnit, setYieldUnit] = useState('unit');
  const [definitionStatus, setDefinitionStatus] = useState('Draft');
  const [instructions, setInstructions] = useState('');
  const [ingredientDrafts, setIngredientDrafts] = useState<IngredientDraft[]>([emptyIngredientDraft()]);
  const [definitionSaveError, setDefinitionSaveError] = useState<string | null>(null);

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [batchCount, setBatchCount] = useState('1');
  const [plannedDate, setPlannedDate] = useState('');
  const [planStatus, setPlanStatus] = useState('Planned');
  const [planNotes, setPlanNotes] = useState('');
  const [planSaveError, setPlanSaveError] = useState<string | null>(null);

  const selectedRecipe = useMemo(
    () => definitions.find((definition) => definition.id === selectedRecipeId) ?? null,
    [definitions, selectedRecipeId],
  );

  const planPreviewIngredients = useMemo(() => {
    if (!selectedRecipe) {
      return [];
    }

    const batches = Number.parseFloat(batchCount);
    const safeBatchCount = Number.isFinite(batches) && batches > 0 ? batches : 0;

    return selectedRecipe.ingredients.map((ingredient) => {
      const inventory = inventoryOptions.find((option) => option.id === ingredient.inventoryEntryId);
      return {
        ...ingredient,
        requiredQuantity: ingredient.quantityPerBatch * safeBatchCount,
        availableQuantity: inventory?.availableQuantity ?? 0,
      };
    });
  }, [batchCount, inventoryOptions, selectedRecipe]);

  useEffect(() => {
    if (activeScreen && activeScreen !== activeTab) {
      setActiveTab(activeScreen);
    }
  }, [activeScreen, activeTab]);

  useEffect(() => {
    let mounted = true;

    async function loadModuleData() {
      setLoading(true);
      setError(null);

      try {
        const [inventoryResponse, definitionsResponse, plansResponse] = await Promise.all([
          apiFetch('/api/recipes/inventory-options'),
          apiFetch('/api/recipes/definitions'),
          apiFetch('/api/recipes/plans'),
        ]);

        if (!inventoryResponse.ok || !definitionsResponse.ok || !plansResponse.ok) {
          throw new Error(
            `Inventory ${inventoryResponse.status}, recipes ${definitionsResponse.status}, plans ${plansResponse.status}`,
          );
        }

        const [inventoryJson, definitionsJson, plansJson] = await Promise.all([
          inventoryResponse.json() as Promise<InventoryOption[]>,
          definitionsResponse.json() as Promise<RecipeDefinition[]>,
          plansResponse.json() as Promise<RecipePlan[]>,
        ]);

        if (!mounted) {
          return;
        }

        setInventoryOptions(inventoryJson);
        setDefinitions(definitionsJson);
        setPlans(plansJson);
      } catch (requestError: unknown) {
        if (!mounted) {
          return;
        }

        const details = requestError instanceof Error ? requestError.message : 'Unknown error';
        setError(`Unable to load recipes module. ${details}`);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadModuleData();

    return () => {
      mounted = false;
    };
  }, []);

  function refreshInventoryOptions() {
    return apiFetch('/api/recipes/inventory-options').then(async (response) => {
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      setInventoryOptions((await response.json()) as InventoryOption[]);
    });
  }

  function refreshDefinitions() {
    return apiFetch('/api/recipes/definitions').then(async (response) => {
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      setDefinitions((await response.json()) as RecipeDefinition[]);
    });
  }

  function refreshPlans() {
    return apiFetch('/api/recipes/plans').then(async (response) => {
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      setPlans((await response.json()) as RecipePlan[]);
    });
  }

  function openDefinitionModal(recipe?: RecipeDefinition) {
    setDefinitionSaveError(null);
    setExecutionMessage(null);

    if (!recipe) {
      setEditingDefinitionId(null);
      setDefinitionName('');
      setOutputProductName('');
      setOutputSku('');
      setBatchYieldQuantity('1');
      setYieldUnit('unit');
      setDefinitionStatus('Draft');
      setInstructions('');
      setIngredientDrafts([emptyIngredientDraft()]);
      setShowDefinitionModal(true);
      return;
    }

    setEditingDefinitionId(recipe.id);
    setDefinitionName(recipe.recipeName);
    setOutputProductName(recipe.outputProductName);
    setOutputSku(recipe.outputSku ?? '');
    setBatchYieldQuantity(String(recipe.batchYieldQuantity));
    setYieldUnit(recipe.yieldUnit);
    setDefinitionStatus(recipe.status);
    setInstructions(recipe.instructions ?? '');
    setIngredientDrafts(
      recipe.ingredients.map((ingredient) => ({
        inventoryEntryId: ingredient.inventoryEntryId,
        unit: ingredient.unit,
        quantityPerBatch: String(ingredient.quantityPerBatch),
      })),
    );
    setShowDefinitionModal(true);
  }

  function openPlanModal(plan?: RecipePlan) {
    setPlanSaveError(null);
    setExecutionMessage(null);

    if (!plan) {
      setEditingPlanId(null);
      setSelectedRecipeId(definitions[0]?.id ?? '');
      setBatchCount('1');
      setPlannedDate('');
      setPlanStatus('Planned');
      setPlanNotes('');
      setShowPlanModal(true);
      return;
    }

    setEditingPlanId(plan.id);
    setSelectedRecipeId(plan.recipeDefinitionId);
    setBatchCount(String(plan.batchCount));
    setPlannedDate(plan.plannedDateUtc ? plan.plannedDateUtc.slice(0, 10) : '');
    setPlanStatus(plan.status);
    setPlanNotes(plan.notes ?? '');
    setShowPlanModal(true);
  }

  function updateIngredientDraft(index: number, patch: Partial<IngredientDraft>) {
    setIngredientDrafts((current) =>
      current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)),
    );
  }

  async function handleSaveDefinition() {
    const trimmedName = definitionName.trim();
    const trimmedOutput = outputProductName.trim();
    const parsedYield = Number.parseFloat(batchYieldQuantity);

    if (!trimmedName || !trimmedOutput || !Number.isFinite(parsedYield) || parsedYield <= 0) {
      setDefinitionSaveError('Recipe name, output product, and valid batch yield are required.');
      return;
    }

    const normalizedIngredients = ingredientDrafts
      .map((ingredient) => ({
        inventoryEntryId: ingredient.inventoryEntryId,
        unit: ingredient.unit.trim(),
        quantityPerBatch: Number.parseFloat(ingredient.quantityPerBatch),
      }))
      .filter((ingredient) => ingredient.inventoryEntryId);

    if (
      normalizedIngredients.length === 0 ||
      normalizedIngredients.some(
        (ingredient) =>
          !ingredient.unit ||
          !Number.isFinite(ingredient.quantityPerBatch) ||
          ingredient.quantityPerBatch <= 0,
      )
    ) {
      setDefinitionSaveError('Every ingredient needs an inventory item, unit, and quantity per batch.');
      return;
    }

    setDefinitionSaveError(null);

    try {
      const response = await apiFetch(
        editingDefinitionId
          ? `/api/recipes/definitions/${editingDefinitionId}`
          : '/api/recipes/definitions',
        {
          method: editingDefinitionId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipeName: trimmedName,
            outputProductName: trimmedOutput,
            outputSku: outputSku.trim() || null,
            batchYieldQuantity: parsedYield,
            yieldUnit: yieldUnit.trim(),
            ingredients: normalizedIngredients,
            instructions: instructions.trim() || null,
            status: definitionStatus,
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Status ${response.status}`);
      }

      await Promise.all([refreshDefinitions(), refreshInventoryOptions()]);
      setShowDefinitionModal(false);
    } catch (saveError: unknown) {
      const details = saveError instanceof Error ? saveError.message : 'Unknown error';
      setDefinitionSaveError(`Unable to save recipe. ${details}`);
    }
  }

  async function handleDeleteDefinition(recipeId: string) {
    const confirmed = window.confirm('Delete this recipe?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(`/api/recipes/definitions/${recipeId}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Status ${response.status}`);
      }

      await refreshDefinitions();
    } catch (deleteError: unknown) {
      const details = deleteError instanceof Error ? deleteError.message : 'Unknown error';
      setError(`Unable to delete recipe. ${details}`);
    }
  }

  async function handleSavePlan() {
    const parsedBatchCount = Number.parseFloat(batchCount);
    if (!selectedRecipeId || !Number.isFinite(parsedBatchCount) || parsedBatchCount <= 0) {
      setPlanSaveError('Select a recipe and enter a valid batch count.');
      return;
    }

    setPlanSaveError(null);

    try {
      const response = await apiFetch(
        editingPlanId ? `/api/recipes/plans/${editingPlanId}` : '/api/recipes/plans',
        {
          method: editingPlanId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipeDefinitionId: selectedRecipeId,
            batchCount: parsedBatchCount,
            plannedDateUtc: plannedDate ? new Date(`${plannedDate}T00:00:00Z`).toISOString() : null,
            notes: planNotes.trim() || null,
            status: planStatus,
          }),
        },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Status ${response.status}`);
      }

      await refreshPlans();
      setShowPlanModal(false);
    } catch (saveError: unknown) {
      const details = saveError instanceof Error ? saveError.message : 'Unknown error';
      setPlanSaveError(`Unable to save plan. ${details}`);
    }
  }

  async function handleDeletePlan(planId: string) {
    const confirmed = window.confirm('Delete this recipe plan?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(`/api/recipes/plans/${planId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      await refreshPlans();
    } catch (deleteError: unknown) {
      const details = deleteError instanceof Error ? deleteError.message : 'Unknown error';
      setError(`Unable to delete plan. ${details}`);
    }
  }

async function handleExecutePlan(planId: string) {
    const confirmed = window.confirm('Execute this recipe plan and deduct inventory?');
    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(`/api/recipes/plans/${planId}/execute`, { method: 'POST' });
      const payload = (await response.json().catch(() => null)) as ExecutePlanResult | { error?: string } | null;

      if (!response.ok) {
        throw new Error((payload as { error?: string } | null)?.error ?? `Status ${response.status}`);
      }

      const result = payload as ExecutePlanResult;
      setExecutionMessage(
        `${result.recipeName} executed. Movement ${result.movementReference} posted for ${result.adjustments.length} ingredient lines.`,
      );
      await Promise.all([refreshPlans(), refreshInventoryOptions()]);
    } catch (executionError: unknown) {
      const details = executionError instanceof Error ? executionError.message : 'Unknown error';
      setError(`Unable to execute recipe plan. ${details}`);
    }
  }

  return (
    <>
      <h1 className="page-title mb-2">Recipes</h1>
      <p className="text-secondary mb-3">
        Create recipes for finished goods, plan batch production, and deduct raw material inventory when a plan is executed.
      </p>

      <Row className="g-3 mb-3">
        <Col xs={12}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
              <div className="d-flex flex-wrap gap-2">
                <Button
                  variant={activeTab === 'recipeCatalog' ? 'primary' : 'outline-primary'}
                  onClick={() => {
                    setActiveTab('recipeCatalog');
                    onScreenChange?.('recipeCatalog');
                  }}
                >
                  Recipe Catalog
                </Button>
                <Button
                  variant={activeTab === 'recipePlanner' ? 'primary' : 'outline-primary'}
                  onClick={() => {
                    setActiveTab('recipePlanner');
                    onScreenChange?.('recipePlanner');
                  }}
                >
                  Recipe Planner
                </Button>
              </div>

              <Button
                onClick={() => {
                  if (activeTab === 'recipeCatalog') {
                    openDefinitionModal();
                    return;
                  }

                  openPlanModal();
                }}
                style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
              >
                {activeTab === 'recipeCatalog' ? 'Add Recipe' : 'Add Plan'}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {executionMessage ? <Alert variant="success">{executionMessage}</Alert> : null}
      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="h5 mb-1">
                {activeTab === 'recipeCatalog' ? 'Recipe Catalog' : 'Recipe Planner'}
              </h2>
              <div className="text-secondary small">
                {activeTab === 'recipeCatalog'
                  ? 'Define ingredient requirements per batch.'
                  : 'Plan production runs and consume ingredient stock.'}
              </div>
            </div>
          </div>

          <Table responsive hover className="align-middle mb-0">
            <thead>
              {activeTab === 'recipeCatalog' ? (
                <tr>
                  <th>Recipe</th>
                  <th>Output Product</th>
                  <th>Batch Yield</th>
                  <th>Ingredients</th>
                  <th>Status</th>
                  <th style={{ width: '150px' }}>Actions</th>
                </tr>
              ) : (
                <tr>
                  <th>Recipe</th>
                  <th>Batches</th>
                  <th>Planned Output</th>
                  <th>Planned Date</th>
                  <th>Execution</th>
                  <th>Status</th>
                  <th style={{ width: '240px' }}>Actions</th>
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'recipeCatalog' ? 6 : 7} className="text-center py-4 text-secondary">
                    Loading records...
                  </td>
                </tr>
              ) : activeTab === 'recipeCatalog' ? (
                definitions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-secondary">No recipes created yet.</td>
                  </tr>
                ) : (
                  definitions.map((definition) => (
                    <tr key={definition.id}>
                      <td>
                        <div className="fw-semibold">{definition.recipeName}</div>
                        <div className="small text-secondary">{definition.outputSku || 'No SKU mapped'}</div>
                      </td>
                      <td>{definition.outputProductName}</td>
                      <td>{formatNumber(definition.batchYieldQuantity)} {definition.yieldUnit}</td>
                      <td>{definition.ingredients.length}</td>
                      <td>{definition.status}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-primary" onClick={() => openDefinitionModal(definition)}>Edit</Button>
                          <Button size="sm" variant="outline-danger" onClick={() => void handleDeleteDefinition(definition.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-secondary">No production plans created yet.</td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <div className="fw-semibold">{plan.recipeName}</div>
                      <div className="small text-secondary">{plan.ingredients.length} ingredients</div>
                    </td>
                    <td>{formatNumber(plan.batchCount)}</td>
                    <td>{formatNumber(plan.plannedOutputQuantity)} {plan.yieldUnit}</td>
                    <td>{formatDate(plan.plannedDateUtc)}</td>
                    <td>{plan.executionStatus}</td>
                    <td>{plan.status}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-2">
                        <Button size="sm" variant="outline-primary" onClick={() => openPlanModal(plan)} disabled={plan.executionStatus === 'Executed'}>Edit</Button>
                        <Button size="sm" variant="outline-success" onClick={() => void handleExecutePlan(plan.id)} disabled={plan.executionStatus === 'Executed'}>Execute</Button>
                        <Button size="sm" variant="outline-danger" onClick={() => void handleDeletePlan(plan.id)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showDefinitionModal} onHide={() => setShowDefinitionModal(false)} centered size="xl">
        <Modal.Header closeButton>
          <Modal.Title>{editingDefinitionId ? 'Edit Recipe' : 'Create Recipe'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}><Form.Group><Form.Label>Recipe Name</Form.Label><Form.Control value={definitionName} onChange={(event) => setDefinitionName(event.target.value)} /></Form.Group></Col>
            <Col md={6}><Form.Group><Form.Label>Output Product</Form.Label><Form.Control value={outputProductName} onChange={(event) => setOutputProductName(event.target.value)} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Output SKU</Form.Label><Form.Control value={outputSku} onChange={(event) => setOutputSku(event.target.value)} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Batch Yield Quantity</Form.Label><Form.Control type="number" min="0.01" step="0.01" value={batchYieldQuantity} onChange={(event) => setBatchYieldQuantity(event.target.value)} /></Form.Group></Col>
            <Col md={4}><Form.Group><Form.Label>Yield Unit</Form.Label><Form.Control value={yieldUnit} onChange={(event) => setYieldUnit(event.target.value)} /></Form.Group></Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select value={definitionStatus} onChange={(event) => setDefinitionStatus(event.target.value)}>
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Archived">Archived</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12}><Form.Group><Form.Label>Instructions</Form.Label><Form.Control as="textarea" rows={3} value={instructions} onChange={(event) => setInstructions(event.target.value)} /></Form.Group></Col>
            <Col xs={12}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fw-semibold">Ingredients per Batch</div>
                <Button size="sm" variant="outline-primary" onClick={() => setIngredientDrafts((current) => [...current, emptyIngredientDraft()])}>Add Ingredient</Button>
              </div>
              <div className="d-flex flex-column gap-3">
                {ingredientDrafts.map((ingredient, index) => {
                  const selectedOption = inventoryOptions.find((option) => option.id === ingredient.inventoryEntryId);
                  return (
                    <Row key={`${ingredient.inventoryEntryId}-${index}`} className="g-2 align-items-end">
                      <Col md={5}>
                        <Form.Group>
                          <Form.Label>Inventory Item</Form.Label>
                          <Form.Select value={ingredient.inventoryEntryId} onChange={(event) => updateIngredientDraft(index, { inventoryEntryId: event.target.value })}>
                            <option value="">Select inventory item</option>
                            {inventoryOptions.map((option) => (
                              <option key={option.id} value={option.id}>{option.itemName} {option.sku ? `(${option.sku})` : ''}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={2}><Form.Group><Form.Label>Unit</Form.Label><Form.Control value={ingredient.unit} onChange={(event) => updateIngredientDraft(index, { unit: event.target.value })} /></Form.Group></Col>
                      <Col md={3}><Form.Group><Form.Label>Qty per Batch</Form.Label><Form.Control type="number" min="0.01" step="0.01" value={ingredient.quantityPerBatch} onChange={(event) => updateIngredientDraft(index, { quantityPerBatch: event.target.value })} /></Form.Group></Col>
                      <Col md={2}>
                        <div className="small text-secondary mb-2">Available: {selectedOption ? formatNumber(selectedOption.availableQuantity) : '-'}</div>
                        <Button variant="outline-danger" size="sm" className="w-100" disabled={ingredientDrafts.length === 1} onClick={() => setIngredientDrafts((current) => current.filter((_, draftIndex) => draftIndex !== index))}>Remove</Button>
                      </Col>
                    </Row>
                  );
                })}
              </div>
            </Col>
          </Row>
          {definitionSaveError ? <div className="small text-danger mt-3">{definitionSaveError}</div> : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDefinitionModal(false)}>Cancel</Button>
          <Button onClick={() => void handleSaveDefinition()} style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>Save Recipe</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showPlanModal} onHide={() => setShowPlanModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingPlanId ? 'Edit Recipe Plan' : 'Create Recipe Plan'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Recipe</Form.Label>
                <Form.Select value={selectedRecipeId} onChange={(event) => setSelectedRecipeId(event.target.value)}>
                  <option value="">Select recipe</option>
                  {definitions.map((definition) => <option key={definition.id} value={definition.id}>{definition.recipeName}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}><Form.Group><Form.Label>Batch Count</Form.Label><Form.Control type="number" min="0.01" step="0.01" value={batchCount} onChange={(event) => setBatchCount(event.target.value)} /></Form.Group></Col>
            <Col md={3}><Form.Group><Form.Label>Planned Date</Form.Label><Form.Control type="date" value={plannedDate} onChange={(event) => setPlannedDate(event.target.value)} /></Form.Group></Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select value={planStatus} onChange={(event) => setPlanStatus(event.target.value)}>
                  <option value="Planned">Planned</option>
                  <option value="Queued">Queued</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col xs={12}><Form.Group><Form.Label>Notes</Form.Label><Form.Control as="textarea" rows={3} value={planNotes} onChange={(event) => setPlanNotes(event.target.value)} /></Form.Group></Col>
            <Col xs={12}>
              <div className="border rounded-3 p-3">
                <div className="fw-semibold mb-2">Ingredient Requirement Preview</div>
                {!selectedRecipe ? (
                  <div className="text-secondary small">Select a recipe to preview required quantities.</div>
                ) : (
                  <>
                    <div className="small text-secondary mb-2">Planned output: {formatNumber((selectedRecipe.batchYieldQuantity || 0) * (Number.parseFloat(batchCount) || 0))} {selectedRecipe.yieldUnit}</div>
                    <Table responsive size="sm" className="align-middle mb-0">
                      <thead><tr><th>Ingredient</th><th>Per Batch</th><th>Required</th><th>Available</th></tr></thead>
                      <tbody>
                        {planPreviewIngredients.map((ingredient) => (
                          <tr key={ingredient.inventoryEntryId}>
                            <td>{ingredient.itemName}</td>
                            <td>{formatNumber(ingredient.quantityPerBatch)} {ingredient.unit}</td>
                            <td>{formatNumber(ingredient.requiredQuantity)} {ingredient.unit}</td>
                            <td>{formatNumber(ingredient.availableQuantity)} {ingredient.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}
              </div>
            </Col>
          </Row>
          {planSaveError ? <div className="small text-danger mt-3">{planSaveError}</div> : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPlanModal(false)}>Cancel</Button>
          <Button onClick={() => void handleSavePlan()} style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>Save Plan</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default RecipesModule;

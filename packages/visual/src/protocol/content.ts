/**
 * Strict validators for every content kind of the visual model.
 *
 * Each validator checks one kind's closed shape, bounds and internal
 * references, appends actionable issues under `visual.content`, and returns
 * the ids a sequence frame may focus.
 */
import {
  isRecord as record,
  validateFinite as finite,
  validateId as id,
  validateInteger as integer,
  validateOnlyKeys as onlyKeys,
  validateText as text,
  validateUniqueIds as uniqueIds,
  type RecordValue,
} from './checks.ts'
import { MAX_VISUAL_MATH_DEPTH, validateMathExpression } from './expression.ts'
import {
  VISUAL_CONTENT_KINDS,
  VISUAL_STROKES,
  VISUAL_TONES,
  type VisualContentKind,
  type VisualStroke,
  type VisualTone,
} from './model.ts'

const TONES = new Set<VisualTone>(VISUAL_TONES)
const STROKES = new Set<VisualStroke>(VISUAL_STROKES)

/** A plot or scene axis: an ordered, finite range with an optional label and sample count. */
export function validateAxis(value: unknown, path: string, issues: string[], samplesAllowed: boolean): void {
  if (!record(value)) {
    issues.push(`${path} must be an object`)
    return
  }
  onlyKeys(value, samplesAllowed ? ['label', 'min', 'max', 'samples'] : ['label', 'min', 'max'], path, issues)
  if (value.label !== undefined) text(value.label, `${path}.label`, issues, 120)
  const minOk = finite(value.min, `${path}.min`, issues)
  const maxOk = finite(value.max, `${path}.max`, issues)
  if (minOk && maxOk && (value.min as number) >= (value.max as number)) {
    issues.push(`${path}.min must be less than max`)
  }
  if (samplesAllowed && value.samples !== undefined
    && (!integer(value.samples, `${path}.samples`, issues, 24) || (value.samples as number) > 256)) {
    issues.push(`${path}.samples must be an integer from 24 to 256`)
  }
}

function validateTone(value: unknown, path: string, issues: string[]): void {
  if (value !== undefined && !TONES.has(value as VisualTone)) {
    issues.push(`${path} is unknown`)
  }
}

function validateStroke(value: unknown, path: string, issues: string[]): void {
  if (value !== undefined && !STROKES.has(value as VisualStroke)) {
    issues.push(`${path} is unknown`)
  }
}

function registerVisualId(
  ids: Set<string>,
  value: unknown,
  path: string,
  issues: string[],
): void {
  if (typeof value !== 'string') return
  if (ids.has(value)) issues.push(`${path} duplicates visual id ${value}`)
  else ids.add(value)
}

function validateParameters(value: unknown, issues: string[]): RecordValue[] {
  const path = 'visual.content.parameters'
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 3) {
    issues.push(`${path} must contain at most 3 parameters`)
    return []
  }
  const parameters = value.filter(record)
  if (parameters.length !== value.length) issues.push(`${path} entries must be objects`)
  uniqueIds(parameters, path, issues)
  for (const [index, parameter] of parameters.entries()) {
    const itemPath = `${path}[${String(index)}]`
    onlyKeys(parameter, ['id', 'label', 'min', 'max', 'step', 'initial'], itemPath, issues)
    id(parameter.id, `${itemPath}.id`, issues)
    if (parameter.id === 'x') issues.push(`${itemPath}.id must not use the reserved x-axis variable`)
    text(parameter.label, `${itemPath}.label`, issues, 120)
    const minOk = finite(parameter.min, `${itemPath}.min`, issues)
    const maxOk = finite(parameter.max, `${itemPath}.max`, issues)
    const stepOk = finite(parameter.step, `${itemPath}.step`, issues)
    const initialOk = finite(parameter.initial, `${itemPath}.initial`, issues)
    if (minOk && maxOk && (parameter.min as number) >= (parameter.max as number)) {
      issues.push(`${itemPath}.min must be less than max`)
    }
    if (stepOk && (parameter.step as number) <= 0) issues.push(`${itemPath}.step must be positive`)
    if (minOk && maxOk && stepOk && (parameter.step as number) > (parameter.max as number) - (parameter.min as number)) {
      issues.push(`${itemPath}.step must not exceed the parameter range`)
    }
    if (minOk && maxOk && initialOk
      && ((parameter.initial as number) < (parameter.min as number)
        || (parameter.initial as number) > (parameter.max as number))) {
      issues.push(`${itemPath}.initial must be inside the parameter range`)
    }
  }
  return parameters
}

function validatePoints(value: unknown, path: string, issues: string[], maximum = 256): void {
  if (!Array.isArray(value) || value.length < 1 || value.length > maximum) {
    issues.push(`${path} must contain 1 to ${String(maximum)} points`)
    return
  }
  for (const [index, point] of value.entries()) {
    const pointPath = `${path}[${String(index)}]`
    if (!record(point)) {
      issues.push(`${pointPath} must be an object`)
      continue
    }
    onlyKeys(point, ['x', 'y', 'label'], pointPath, issues)
    finite(point.x, `${pointPath}.x`, issues)
    finite(point.y, `${pointPath}.y`, issues)
    if (point.label !== undefined) text(point.label, `${pointPath}.label`, issues, 160)
  }
}

function validateMetrics(
  value: unknown,
  parameterIds: ReadonlySet<string>,
  issues: string[],
): RecordValue[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.length > 4) {
    issues.push('visual.content.metrics must contain at most 4 metrics')
    return []
  }
  const metrics = value.filter(record)
  if (metrics.length !== value.length) issues.push('visual.content.metrics entries must be objects')
  uniqueIds(metrics, 'visual.content.metrics', issues)
  for (const [index, metric] of metrics.entries()) {
    const path = `visual.content.metrics[${String(index)}]`
    onlyKeys(metric, ['id', 'label', 'expression', 'digits', 'suffix'], path, issues)
    id(metric.id, `${path}.id`, issues)
    text(metric.label, `${path}.label`, issues, 160)
    validateMathExpression(metric.expression, parameterIds, `${path}.expression`, issues, false, MAX_VISUAL_MATH_DEPTH)
    if (metric.digits !== undefined
      && (!integer(metric.digits, `${path}.digits`, issues) || (metric.digits as number) > 6)) {
      issues.push(`${path}.digits must be an integer from 0 to 6`)
    }
    if (metric.suffix !== undefined) text(metric.suffix, `${path}.suffix`, issues, 80)
  }
  return metrics
}

function validatePlot(value: RecordValue, issues: string[]): Set<string> {
  const ids = new Set<string>()
  onlyKeys(value, ['kind', 'parameters', 'xAxis', 'yAxis', 'series', 'metrics'], 'visual.content', issues)
  const parameters = validateParameters(value.parameters, issues)
  const parameterIds = new Set(parameters.flatMap(parameter => typeof parameter.id === 'string' ? [parameter.id] : []))
  for (const parameterId of parameterIds) registerVisualId(ids, parameterId, 'visual.content.parameters', issues)
  validateAxis(value.xAxis, 'visual.content.xAxis', issues, true)
  validateAxis(value.yAxis, 'visual.content.yAxis', issues, false)
  if (!Array.isArray(value.series) || value.series.length < 1 || value.series.length > 8) {
    issues.push('visual.content.series must contain 1 to 8 series')
  } else {
    const series = value.series.filter(record)
    if (series.length !== value.series.length) issues.push('visual.content.series entries must be objects')
    uniqueIds(series, 'visual.content.series', issues)
    for (const [index, item] of series.entries()) {
      const path = `visual.content.series[${String(index)}]`
      if (id(item.id, `${path}.id`, issues)) registerVisualId(ids, item.id, `${path}.id`, issues)
      text(item.label, `${path}.label`, issues, 160)
      validateTone(item.tone, `${path}.tone`, issues)
      if (item.type === 'curve') {
        onlyKeys(item, ['type', 'id', 'label', 'expression', 'tone', 'stroke'], path, issues)
        validateStroke(item.stroke, `${path}.stroke`, issues)
        validateMathExpression(item.expression, parameterIds, `${path}.expression`, issues, true, MAX_VISUAL_MATH_DEPTH)
      } else if (item.type === 'points' || item.type === 'bars') {
        onlyKeys(item, ['type', 'id', 'label', 'points', 'tone'], path, issues)
        validatePoints(item.points, `${path}.points`, issues, item.type === 'bars' ? 64 : 256)
      } else if (item.type === 'line') {
        onlyKeys(item, ['type', 'id', 'label', 'points', 'tone', 'stroke'], path, issues)
        validateStroke(item.stroke, `${path}.stroke`, issues)
        validatePoints(item.points, `${path}.points`, issues)
      } else {
        issues.push(`${path}.type must be curve, points, line, or bars`)
      }
    }
  }
  const metrics = validateMetrics(value.metrics, parameterIds, issues)
  for (const [index, metric] of metrics.entries()) {
    if (typeof metric.id === 'string') registerVisualId(ids, metric.id, `visual.content.metrics[${String(index)}].id`, issues)
  }
  return ids
}

function validateNodeLink(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'layout', 'groups', 'nodes', 'edges'], 'visual.content', issues)
  if (!['layered', 'hierarchy', 'radial'].includes(value.layout as string)) {
    issues.push('visual.content.layout must be layered, hierarchy, or radial')
  }
  let groups: RecordValue[] = []
  if (value.groups !== undefined) {
    if (!Array.isArray(value.groups) || value.groups.length < 1 || value.groups.length > 12) {
      issues.push('visual.content.groups must contain 1 to 12 groups')
    } else {
      groups = value.groups.filter(record)
      if (groups.length !== value.groups.length) issues.push('visual.content.groups entries must be objects')
      uniqueIds(groups, 'visual.content.groups', issues)
      for (const [index, group] of groups.entries()) {
        const path = `visual.content.groups[${String(index)}]`
        onlyKeys(group, ['id', 'label'], path, issues)
        if (id(group.id, `${path}.id`, issues)) registerVisualId(focusIds, group.id, `${path}.id`, issues)
        text(group.label, `${path}.label`, issues, 120)
      }
    }
  }
  const groupIds = new Set(groups.flatMap(group => typeof group.id === 'string' ? [group.id] : []))
  let nodes: RecordValue[] = []
  if (!Array.isArray(value.nodes) || value.nodes.length < 2 || value.nodes.length > 48) {
    issues.push('visual.content.nodes must contain 2 to 48 nodes')
  } else {
    nodes = value.nodes.filter(record)
    if (nodes.length !== value.nodes.length) issues.push('visual.content.nodes entries must be objects')
    uniqueIds(nodes, 'visual.content.nodes', issues)
    for (const [index, node] of nodes.entries()) {
      const path = `visual.content.nodes[${String(index)}]`
      onlyKeys(node, ['id', 'label', 'detail', 'group', 'tone'], path, issues)
      if (id(node.id, `${path}.id`, issues)) registerVisualId(focusIds, node.id, `${path}.id`, issues)
      text(node.label, `${path}.label`, issues, 120)
      if (node.detail !== undefined) text(node.detail, `${path}.detail`, issues, 1_000)
      if (node.group !== undefined && (typeof node.group !== 'string' || !groupIds.has(node.group))) {
        issues.push(`${path}.group must reference a declared group`)
      }
      validateTone(node.tone, `${path}.tone`, issues)
    }
  }
  if (value.layout === 'layered' && (groups.length === 0 || nodes.some(node => typeof node.group !== 'string'))) {
    issues.push('visual.content layered layouts require groups and a group on every node')
  }
  const nodeIds = new Set(nodes.flatMap(node => typeof node.id === 'string' ? [node.id] : []))
  if (!Array.isArray(value.edges) || value.edges.length < 1 || value.edges.length > 160) {
    issues.push('visual.content.edges must contain 1 to 160 edges')
  } else {
    const edges = value.edges.filter(record)
    if (edges.length !== value.edges.length) issues.push('visual.content.edges entries must be objects')
    uniqueIds(edges, 'visual.content.edges', issues)
    for (const [index, edge] of edges.entries()) {
      const path = `visual.content.edges[${String(index)}]`
      onlyKeys(edge, ['id', 'from', 'to', 'label', 'detail', 'tone', 'stroke', 'directed'], path, issues)
      if (id(edge.id, `${path}.id`, issues)) registerVisualId(focusIds, edge.id, `${path}.id`, issues)
      if (typeof edge.from !== 'string' || !nodeIds.has(edge.from)) issues.push(`${path}.from must reference a declared node`)
      if (typeof edge.to !== 'string' || !nodeIds.has(edge.to)) issues.push(`${path}.to must reference a declared node`)
      if (edge.label !== undefined) text(edge.label, `${path}.label`, issues, 120)
      if (edge.detail !== undefined) text(edge.detail, `${path}.detail`, issues, 1_000)
      validateTone(edge.tone, `${path}.tone`, issues)
      validateStroke(edge.stroke, `${path}.stroke`, issues)
      if (edge.directed !== undefined && typeof edge.directed !== 'boolean') issues.push(`${path}.directed must be a boolean`)
    }
  }
  return focusIds
}

function validateSceneElementBase(
  element: RecordValue,
  path: string,
  allowed: readonly string[],
  issues: string[],
): void {
  onlyKeys(element, ['type', 'id', 'label', 'detail', 'tone', ...allowed], path, issues)
  id(element.id, `${path}.id`, issues)
  if (element.label !== undefined) text(element.label, `${path}.label`, issues, 120)
  if (element.detail !== undefined) text(element.detail, `${path}.detail`, issues, 1_000)
  validateTone(element.tone, `${path}.tone`, issues)
}

function validateScene2D(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'xAxis', 'yAxis', 'grid', 'elements'], 'visual.content', issues)
  validateAxis(value.xAxis, 'visual.content.xAxis', issues, false)
  validateAxis(value.yAxis, 'visual.content.yAxis', issues, false)
  if (value.grid !== undefined && typeof value.grid !== 'boolean') {
    issues.push('visual.content.grid must be a boolean')
  }
  if (!Array.isArray(value.elements) || value.elements.length < 1 || value.elements.length > 64) {
    issues.push('visual.content.elements must contain 1 to 64 elements')
    return focusIds
  }
  const elements = value.elements.filter(record)
  if (elements.length !== value.elements.length) issues.push('visual.content.elements entries must be objects')
  uniqueIds(elements, 'visual.content.elements', issues)
  for (const [index, element] of elements.entries()) {
    const path = `visual.content.elements[${String(index)}]`
    registerVisualId(focusIds, element.id, `${path}.id`, issues)
    if (element.type === 'point') {
      validateSceneElementBase(element, path, ['x', 'y', 'size'], issues)
      finite(element.x, `${path}.x`, issues)
      finite(element.y, `${path}.y`, issues)
      if (element.size !== undefined
        && (finite(element.size, `${path}.size`, issues) && ((element.size as number) <= 0 || (element.size as number) > 64))) {
        issues.push(`${path}.size must be greater than 0 and at most 64`)
      }
    } else if (element.type === 'segment' || element.type === 'arrow') {
      validateSceneElementBase(element, path, ['x1', 'y1', 'x2', 'y2', 'stroke'], issues)
      finite(element.x1, `${path}.x1`, issues)
      finite(element.y1, `${path}.y1`, issues)
      finite(element.x2, `${path}.x2`, issues)
      finite(element.y2, `${path}.y2`, issues)
      validateStroke(element.stroke, `${path}.stroke`, issues)
    } else if (element.type === 'circle') {
      validateSceneElementBase(element, path, ['cx', 'cy', 'r'], issues)
      finite(element.cx, `${path}.cx`, issues)
      finite(element.cy, `${path}.cy`, issues)
      if (finite(element.r, `${path}.r`, issues) && (element.r as number) <= 0) issues.push(`${path}.r must be positive`)
    } else if (element.type === 'rect') {
      validateSceneElementBase(element, path, ['x', 'y', 'width', 'height'], issues)
      finite(element.x, `${path}.x`, issues)
      finite(element.y, `${path}.y`, issues)
      if (finite(element.width, `${path}.width`, issues) && (element.width as number) <= 0) issues.push(`${path}.width must be positive`)
      if (finite(element.height, `${path}.height`, issues) && (element.height as number) <= 0) issues.push(`${path}.height must be positive`)
    } else if (element.type === 'polygon') {
      validateSceneElementBase(element, path, ['points'], issues)
      if (!Array.isArray(element.points) || element.points.length < 3 || element.points.length > 24) {
        issues.push(`${path}.points must contain 3 to 24 points`)
      } else {
        for (const [pointIndex, point] of element.points.entries()) {
          const pointPath = `${path}.points[${String(pointIndex)}]`
          if (!record(point)) {
            issues.push(`${pointPath} must be an object`)
            continue
          }
          onlyKeys(point, ['x', 'y'], pointPath, issues)
          finite(point.x, `${pointPath}.x`, issues)
          finite(point.y, `${pointPath}.y`, issues)
        }
      }
    } else if (element.type === 'label') {
      validateSceneElementBase(element, path, ['x', 'y', 'text'], issues)
      finite(element.x, `${path}.x`, issues)
      finite(element.y, `${path}.y`, issues)
      text(element.text, `${path}.text`, issues, 240)
    } else {
      issues.push(`${path}.type must be point, segment, arrow, circle, rect, polygon, or label`)
    }
  }
  return focusIds
}

function validateRelationSubjects(value: unknown, path: string, issues: string[]): RecordValue[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 4) {
    issues.push(`${path} must contain 2 to 4 subjects`)
    return []
  }
  const subjects = value.filter(record)
  if (subjects.length !== value.length) issues.push(`${path} entries must be objects`)
  uniqueIds(subjects, path, issues)
  for (const [index, subject] of subjects.entries()) {
    const itemPath = `${path}[${String(index)}]`
    onlyKeys(subject, ['id', 'label', 'detail', 'tone'], itemPath, issues)
    id(subject.id, `${itemPath}.id`, issues)
    text(subject.label, `${itemPath}.label`, issues, 120)
    if (subject.detail !== undefined) text(subject.detail, `${itemPath}.detail`, issues, 1_000)
    validateTone(subject.tone, `${itemPath}.tone`, issues)
  }
  return subjects
}

function validateRelationAxis(value: unknown, path: string, issues: string[]): RecordValue[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 10) {
    issues.push(`${path} must contain 1 to 10 items`)
    return []
  }
  const items = value.filter(record)
  if (items.length !== value.length) issues.push(`${path} entries must be objects`)
  uniqueIds(items, path, issues)
  for (const [index, item] of items.entries()) {
    const itemPath = `${path}[${String(index)}]`
    onlyKeys(item, ['id', 'label'], itemPath, issues)
    id(item.id, `${itemPath}.id`, issues)
    text(item.label, `${itemPath}.label`, issues, 120)
  }
  return items
}

function validateRelation(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  if (value.variant === 'comparison') {
    onlyKeys(value, ['kind', 'variant', 'subjects', 'rows'], 'visual.content', issues)
    const subjects = validateRelationSubjects(value.subjects, 'visual.content.subjects', issues)
    const subjectIds = new Set(subjects.flatMap(subject => typeof subject.id === 'string' ? [subject.id] : []))
    for (const subjectId of subjectIds) registerVisualId(focusIds, subjectId, 'visual.content.subjects', issues)
    if (!Array.isArray(value.rows) || value.rows.length < 1 || value.rows.length > 16) {
      issues.push('visual.content.rows must contain 1 to 16 comparison rows')
      return focusIds
    }
    const rows = value.rows.filter(record)
    if (rows.length !== value.rows.length) issues.push('visual.content.rows entries must be objects')
    uniqueIds(rows, 'visual.content.rows', issues)
    for (const [index, row] of rows.entries()) {
      const path = `visual.content.rows[${String(index)}]`
      onlyKeys(row, ['id', 'label', 'cells', 'detail'], path, issues)
      if (id(row.id, `${path}.id`, issues)) registerVisualId(focusIds, row.id, `${path}.id`, issues)
      text(row.label, `${path}.label`, issues, 120)
      if (row.detail !== undefined) text(row.detail, `${path}.detail`, issues, 1_000)
      if (!Array.isArray(row.cells) || row.cells.length < 1 || row.cells.length > 4) {
        issues.push(`${path}.cells must contain 1 to 4 cells`)
        continue
      }
      const seenSubjects = new Set<string>()
      for (const [cellIndex, cell] of row.cells.entries()) {
        const cellPath = `${path}.cells[${String(cellIndex)}]`
        if (!record(cell)) {
          issues.push(`${cellPath} must be an object`)
          continue
        }
        onlyKeys(cell, ['subjectId', 'value', 'tone'], cellPath, issues)
        if (typeof cell.subjectId !== 'string' || !subjectIds.has(cell.subjectId)) {
          issues.push(`${cellPath}.subjectId must reference a declared subject`)
        } else if (seenSubjects.has(cell.subjectId)) {
          issues.push(`${cellPath}.subjectId duplicates ${cell.subjectId}`)
        } else seenSubjects.add(cell.subjectId)
        text(cell.value, `${cellPath}.value`, issues, 500)
        validateTone(cell.tone, `${cellPath}.tone`, issues)
      }
    }
  } else if (value.variant === 'matrix') {
    onlyKeys(value, ['kind', 'variant', 'rows', 'columns', 'cells'], 'visual.content', issues)
    const rows = validateRelationAxis(value.rows, 'visual.content.rows', issues)
    const columns = validateRelationAxis(value.columns, 'visual.content.columns', issues)
    const rowIds = new Set(rows.flatMap(row => typeof row.id === 'string' ? [row.id] : []))
    const columnIds = new Set(columns.flatMap(column => typeof column.id === 'string' ? [column.id] : []))
    for (const rowId of rowIds) registerVisualId(focusIds, rowId, 'visual.content.rows', issues)
    for (const columnId of columnIds) registerVisualId(focusIds, columnId, 'visual.content.columns', issues)
    if (!Array.isArray(value.cells) || value.cells.length < 1 || value.cells.length > 64) {
      issues.push('visual.content.cells must contain 1 to 64 matrix cells')
      return focusIds
    }
    const cells = value.cells.filter(record)
    if (cells.length !== value.cells.length) issues.push('visual.content.cells entries must be objects')
    uniqueIds(cells, 'visual.content.cells', issues)
    const coordinates = new Set<string>()
    for (const [index, cell] of cells.entries()) {
      const path = `visual.content.cells[${String(index)}]`
      onlyKeys(cell, ['id', 'rowId', 'columnId', 'label', 'detail', 'tone'], path, issues)
      if (id(cell.id, `${path}.id`, issues)) registerVisualId(focusIds, cell.id, `${path}.id`, issues)
      if (typeof cell.rowId !== 'string' || !rowIds.has(cell.rowId)) issues.push(`${path}.rowId must reference a declared row`)
      if (typeof cell.columnId !== 'string' || !columnIds.has(cell.columnId)) issues.push(`${path}.columnId must reference a declared column`)
      if (typeof cell.rowId === 'string' && typeof cell.columnId === 'string') {
        const coordinate = `${cell.rowId}\u0000${cell.columnId}`
        if (coordinates.has(coordinate)) issues.push(`${path} duplicates a matrix coordinate`)
        coordinates.add(coordinate)
      }
      text(cell.label, `${path}.label`, issues, 240)
      if (cell.detail !== undefined) text(cell.detail, `${path}.detail`, issues, 1_000)
      validateTone(cell.tone, `${path}.tone`, issues)
    }
  } else if (value.variant === 'sets') {
    onlyKeys(value, ['kind', 'variant', 'sets', 'items'], 'visual.content', issues)
    const sets = validateRelationSubjects(value.sets, 'visual.content.sets', issues)
    if (sets.length > 3) issues.push('visual.content.sets must contain at most 3 sets')
    const setIds = new Set(sets.flatMap(item => typeof item.id === 'string' ? [item.id] : []))
    for (const setId of setIds) registerVisualId(focusIds, setId, 'visual.content.sets', issues)
    if (!Array.isArray(value.items) || value.items.length < 1 || value.items.length > 24) {
      issues.push('visual.content.items must contain 1 to 24 set items')
      return focusIds
    }
    const items = value.items.filter(record)
    if (items.length !== value.items.length) issues.push('visual.content.items entries must be objects')
    uniqueIds(items, 'visual.content.items', issues)
    for (const [index, item] of items.entries()) {
      const path = `visual.content.items[${String(index)}]`
      onlyKeys(item, ['id', 'label', 'setIds', 'detail'], path, issues)
      if (id(item.id, `${path}.id`, issues)) registerVisualId(focusIds, item.id, `${path}.id`, issues)
      text(item.label, `${path}.label`, issues, 120)
      if (item.detail !== undefined) text(item.detail, `${path}.detail`, issues, 1_000)
      if (!Array.isArray(item.setIds) || item.setIds.length < 1 || item.setIds.length > 3) {
        issues.push(`${path}.setIds must contain 1 to 3 set ids`)
      } else {
        const memberships = new Set<string>()
        for (const setId of item.setIds) {
          if (typeof setId !== 'string' || !setIds.has(setId)) issues.push(`${path}.setIds must reference declared sets`)
          else if (memberships.has(setId)) issues.push(`${path}.setIds duplicates ${setId}`)
          else memberships.add(setId)
        }
      }
    }
  } else {
    issues.push('visual.content.variant must be comparison, matrix, or sets')
  }
  return focusIds
}

function validateTimeline(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'orientation', 'events', 'eras'], 'visual.content', issues)
  if (value.orientation !== undefined && value.orientation !== 'horizontal' && value.orientation !== 'vertical') {
    issues.push('visual.content.orientation must be horizontal or vertical')
  }
  let events: RecordValue[] = []
  if (!Array.isArray(value.events) || value.events.length < 2 || value.events.length > 32) {
    issues.push('visual.content.events must contain 2 to 32 events')
  } else {
    events = value.events.filter(record)
    if (events.length !== value.events.length) issues.push('visual.content.events entries must be objects')
    uniqueIds(events, 'visual.content.events', issues)
    const hasPositions = events.filter(event => event.position !== undefined).length
    if (hasPositions !== 0 && hasPositions !== events.length) {
      issues.push('visual.content.events.position must be provided for every event or omitted for every event')
    }
    let previousPosition = -1
    for (const [index, event] of events.entries()) {
      const path = `visual.content.events[${String(index)}]`
      onlyKeys(event, ['id', 'time', 'label', 'detail', 'position', 'tone'], path, issues)
      if (id(event.id, `${path}.id`, issues)) registerVisualId(focusIds, event.id, `${path}.id`, issues)
      text(event.time, `${path}.time`, issues, 80)
      text(event.label, `${path}.label`, issues, 160)
      if (event.detail !== undefined) text(event.detail, `${path}.detail`, issues, 1_500)
      if (event.position !== undefined && finite(event.position, `${path}.position`, issues)) {
        const position = event.position as number
        if (position < 0 || position > 1) issues.push(`${path}.position must be from 0 to 1`)
        if (position <= previousPosition) issues.push(`${path}.position must be greater than the preceding event position`)
        previousPosition = position
      }
      validateTone(event.tone, `${path}.tone`, issues)
    }
  }
  const eventIds = new Set(events.flatMap(event => typeof event.id === 'string' ? [event.id] : []))
  const eventIndexes = new Map(events.flatMap((event, index) => typeof event.id === 'string' ? [[event.id, index] as const] : []))
  if (value.eras !== undefined) {
    if (!Array.isArray(value.eras) || value.eras.length < 1 || value.eras.length > 8) {
      issues.push('visual.content.eras must contain 1 to 8 eras')
    } else {
      const eras = value.eras.filter(record)
      if (eras.length !== value.eras.length) issues.push('visual.content.eras entries must be objects')
      uniqueIds(eras, 'visual.content.eras', issues)
      for (const [index, era] of eras.entries()) {
        const path = `visual.content.eras[${String(index)}]`
        onlyKeys(era, ['id', 'label', 'startEventId', 'endEventId', 'detail', 'tone'], path, issues)
        if (id(era.id, `${path}.id`, issues)) registerVisualId(focusIds, era.id, `${path}.id`, issues)
        text(era.label, `${path}.label`, issues, 120)
        if (typeof era.startEventId !== 'string' || !eventIds.has(era.startEventId)) {
          issues.push(`${path}.startEventId must reference a declared event`)
        }
        if (typeof era.endEventId !== 'string' || !eventIds.has(era.endEventId)) {
          issues.push(`${path}.endEventId must reference a declared event`)
        }
        if (typeof era.startEventId === 'string' && typeof era.endEventId === 'string') {
          const startIndex = eventIndexes.get(era.startEventId)
          const endIndex = eventIndexes.get(era.endEventId)
          if (startIndex !== undefined && endIndex !== undefined && startIndex > endIndex) {
            issues.push(`${path}.startEventId must not occur after endEventId`)
          }
        }
        if (era.detail !== undefined) text(era.detail, `${path}.detail`, issues, 1_000)
        validateTone(era.tone, `${path}.tone`, issues)
      }
    }
  }
  return focusIds
}

function validateFormulaSteps(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'notation', 'steps', 'conclusion'], 'visual.content', issues)
  if (value.notation !== undefined) text(value.notation, 'visual.content.notation', issues, 300)
  if (value.conclusion !== undefined) text(value.conclusion, 'visual.content.conclusion', issues, 1_000)
  if (!Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 16) {
    issues.push('visual.content.steps must contain 2 to 16 formula steps')
    return focusIds
  }
  const steps = value.steps.filter(record)
  if (steps.length !== value.steps.length) issues.push('visual.content.steps entries must be objects')
  uniqueIds(steps, 'visual.content.steps', issues)
  for (const [index, step] of steps.entries()) {
    const path = `visual.content.steps[${String(index)}]`
    onlyKeys(step, ['id', 'expression', 'label', 'rule', 'detail', 'tone'], path, issues)
    if (id(step.id, `${path}.id`, issues)) registerVisualId(focusIds, step.id, `${path}.id`, issues)
    text(step.expression, `${path}.expression`, issues, 500)
    if (step.label !== undefined) text(step.label, `${path}.label`, issues, 120)
    if (step.rule !== undefined) text(step.rule, `${path}.rule`, issues, 240)
    if (step.detail !== undefined) text(step.detail, `${path}.detail`, issues, 1_500)
    validateTone(step.tone, `${path}.tone`, issues)
  }
  return focusIds
}

function validateStudyMap(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'sourceLabel', 'goal', 'sections', 'concepts'], 'visual.content', issues)
  text(value.sourceLabel, 'visual.content.sourceLabel', issues, 240)
  if (value.goal !== undefined) text(value.goal, 'visual.content.goal', issues, 600)
  let sections: RecordValue[] = []
  if (!Array.isArray(value.sections) || value.sections.length < 1 || value.sections.length > 16) {
    issues.push('visual.content.sections must contain 1 to 16 sections')
  } else {
    sections = value.sections.filter(record)
    if (sections.length !== value.sections.length) issues.push('visual.content.sections entries must be objects')
    uniqueIds(sections, 'visual.content.sections', issues)
    for (const [index, section] of sections.entries()) {
      const path = `visual.content.sections[${String(index)}]`
      onlyKeys(section, ['id', 'label', 'anchor', 'summary'], path, issues)
      if (id(section.id, `${path}.id`, issues)) registerVisualId(focusIds, section.id, `${path}.id`, issues)
      text(section.label, `${path}.label`, issues, 160)
      if (section.anchor !== undefined) text(section.anchor, `${path}.anchor`, issues, 160)
      if (section.summary !== undefined) text(section.summary, `${path}.summary`, issues, 1_000)
    }
  }
  const sectionIds = new Set(sections.flatMap(section => typeof section.id === 'string' ? [section.id] : []))
  let concepts: RecordValue[] = []
  if (!Array.isArray(value.concepts) || value.concepts.length < 1 || value.concepts.length > 48) {
    issues.push('visual.content.concepts must contain 1 to 48 concepts')
  } else {
    concepts = value.concepts.filter(record)
    if (concepts.length !== value.concepts.length) issues.push('visual.content.concepts entries must be objects')
    uniqueIds(concepts, 'visual.content.concepts', issues)
    for (const [index, concept] of concepts.entries()) {
      const path = `visual.content.concepts[${String(index)}]`
      onlyKeys(concept, ['id', 'label', 'sectionId', 'detail', 'prerequisiteIds', 'role', 'tone'], path, issues)
      if (id(concept.id, `${path}.id`, issues)) registerVisualId(focusIds, concept.id, `${path}.id`, issues)
      text(concept.label, `${path}.label`, issues, 160)
      if (typeof concept.sectionId !== 'string' || !sectionIds.has(concept.sectionId)) {
        issues.push(`${path}.sectionId must reference a declared section`)
      }
      if (concept.detail !== undefined) text(concept.detail, `${path}.detail`, issues, 1_500)
      if (concept.role !== undefined && !['foundation', 'core', 'extension', 'practice'].includes(concept.role as string)) {
        issues.push(`${path}.role must be foundation, core, extension, or practice`)
      }
      validateTone(concept.tone, `${path}.tone`, issues)
    }
  }
  const conceptIds = new Set(concepts.flatMap(concept => typeof concept.id === 'string' ? [concept.id] : []))
  const prerequisiteGraph = new Map<string, string[]>()
  for (const [index, concept] of concepts.entries()) {
    if (concept.prerequisiteIds === undefined) continue
    const path = `visual.content.concepts[${String(index)}].prerequisiteIds`
    if (!Array.isArray(concept.prerequisiteIds) || concept.prerequisiteIds.length > 8) {
      issues.push(`${path} must contain at most 8 concept ids`)
      continue
    }
    const seen = new Set<string>()
    for (const prerequisiteId of concept.prerequisiteIds) {
      if (typeof prerequisiteId !== 'string' || !conceptIds.has(prerequisiteId)) {
        issues.push(`${path} must reference declared concepts`)
      } else if (prerequisiteId === concept.id) {
        issues.push(`${path} must not reference its own concept`)
      } else if (seen.has(prerequisiteId)) {
        issues.push(`${path} duplicates ${prerequisiteId}`)
      } else seen.add(prerequisiteId)
    }
    if (typeof concept.id === 'string') prerequisiteGraph.set(concept.id, [...seen])
  }
  const visited = new Set<string>()
  const visiting = new Set<string>()
  const visit = (conceptId: string): boolean => {
    if (visiting.has(conceptId)) return true
    if (visited.has(conceptId)) return false
    visiting.add(conceptId)
    const cyclic = (prerequisiteGraph.get(conceptId) ?? []).some(visit)
    visiting.delete(conceptId)
    visited.add(conceptId)
    return cyclic
  }
  if ([...conceptIds].some(visit)) {
    issues.push('visual.content.concepts prerequisiteIds must not contain a cycle')
  }
  return focusIds
}

function validateRecallDeck(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'instructions', 'cards'], 'visual.content', issues)
  if (value.instructions !== undefined) text(value.instructions, 'visual.content.instructions', issues, 600)
  if (!Array.isArray(value.cards) || value.cards.length < 2 || value.cards.length > 32) {
    issues.push('visual.content.cards must contain 2 to 32 cards')
    return focusIds
  }
  const cards = value.cards.filter(record)
  if (cards.length !== value.cards.length) issues.push('visual.content.cards entries must be objects')
  uniqueIds(cards, 'visual.content.cards', issues)
  for (const [index, card] of cards.entries()) {
    const path = `visual.content.cards[${String(index)}]`
    onlyKeys(card, ['id', 'prompt', 'answer', 'hint', 'tags'], path, issues)
    if (id(card.id, `${path}.id`, issues)) registerVisualId(focusIds, card.id, `${path}.id`, issues)
    text(card.prompt, `${path}.prompt`, issues, 1_000)
    text(card.answer, `${path}.answer`, issues, 2_000)
    if (card.hint !== undefined) text(card.hint, `${path}.hint`, issues, 800)
    if (card.tags !== undefined) {
      if (!Array.isArray(card.tags) || card.tags.length > 6) {
        issues.push(`${path}.tags must contain at most 6 labels`)
      } else {
        const seen = new Set<string>()
        for (const [tagIndex, tag] of card.tags.entries()) {
          const tagPath = `${path}.tags[${String(tagIndex)}]`
          if (text(tag, tagPath, issues, 80) && typeof tag === 'string') {
            if (seen.has(tag)) issues.push(`${path}.tags duplicates ${tag}`)
            else seen.add(tag)
          }
        }
      }
    }
  }
  return focusIds
}

function validateTableValue(value: unknown, path: string, issues: string[]): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true
  if (typeof value === 'number' && Number.isFinite(value)) return true
  issues.push(`${path} must be a string, number, boolean, or null`)
  return false
}

function validateDataTable(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'columns', 'rows', 'outlierIds', 'initialSort', 'initialFilter', 'chart'], 'visual.content', issues)
  let columns: RecordValue[] = []
  if (!Array.isArray(value.columns) || value.columns.length < 1 || value.columns.length > 24) {
    issues.push('visual.content.columns must contain 1 to 24 columns')
  } else {
    columns = value.columns.filter(record)
    if (columns.length !== value.columns.length) issues.push('visual.content.columns entries must be objects')
    uniqueIds(columns, 'visual.content.columns', issues)
    for (const [index, column] of columns.entries()) {
      const path = `visual.content.columns[${String(index)}]`
      onlyKeys(column, ['id', 'label', 'type', 'unit'], path, issues)
      if (id(column.id, `${path}.id`, issues)) registerVisualId(focusIds, column.id, `${path}.id`, issues)
      text(column.label, `${path}.label`, issues, 160)
      if (!['string', 'number', 'boolean', 'date'].includes(column.type as string)) {
        issues.push(`${path}.type must be string, number, boolean, or date`)
      }
      if (column.unit !== undefined) text(column.unit, `${path}.unit`, issues, 80)
    }
  }
  const columnIds = new Set(columns.flatMap(column => typeof column.id === 'string' ? [column.id] : []))
  const columnTypes = new Map(columns.flatMap(column => typeof column.id === 'string' && typeof column.type === 'string'
    ? [[column.id, column.type] as const] : []))
  let rows: RecordValue[] = []
  if (!Array.isArray(value.rows) || value.rows.length < 1 || value.rows.length > 128) {
    issues.push('visual.content.rows must contain 1 to 128 rows')
  } else {
    rows = value.rows.filter(record)
    if (rows.length !== value.rows.length) issues.push('visual.content.rows entries must be objects')
    uniqueIds(rows, 'visual.content.rows', issues)
    for (const [index, row] of rows.entries()) {
      const path = `visual.content.rows[${String(index)}]`
      onlyKeys(row, ['id', 'cells', 'detail'], path, issues)
      if (id(row.id, `${path}.id`, issues)) registerVisualId(focusIds, row.id, `${path}.id`, issues)
      if (row.detail !== undefined) text(row.detail, `${path}.detail`, issues, 1_000)
      if (!Array.isArray(row.cells) || row.cells.length < 1 || row.cells.length > 24) {
        issues.push(`${path}.cells must contain 1 to 24 cells`)
        continue
      }
      const seen = new Set<string>()
      for (const [cellIndex, cell] of row.cells.entries()) {
        const cellPath = `${path}.cells[${String(cellIndex)}]`
        if (!record(cell)) {
          issues.push(`${cellPath} must be an object`)
          continue
        }
        onlyKeys(cell, ['columnId', 'value'], cellPath, issues)
        if (typeof cell.columnId !== 'string' || !columnIds.has(cell.columnId)) {
          issues.push(`${cellPath}.columnId must reference a declared column`)
        } else if (seen.has(cell.columnId)) {
          issues.push(`${cellPath}.columnId duplicates ${cell.columnId}`)
        } else seen.add(cell.columnId)
        const valueOk = validateTableValue(cell.value, `${cellPath}.value`, issues)
        const expected = typeof cell.columnId === 'string' ? columnTypes.get(cell.columnId) : undefined
        if (valueOk && cell.value !== null && expected !== undefined
          && ((expected === 'number' && typeof cell.value !== 'number')
            || (expected === 'boolean' && typeof cell.value !== 'boolean')
            || ((expected === 'string' || expected === 'date') && typeof cell.value !== 'string'))) {
          issues.push(`${cellPath}.value does not match column type ${expected}`)
        }
      }
    }
  }
  const rowIds = new Set(rows.flatMap(row => typeof row.id === 'string' ? [row.id] : []))
  if (value.outlierIds !== undefined) {
    if (!Array.isArray(value.outlierIds) || value.outlierIds.length > 32) {
      issues.push('visual.content.outlierIds must contain at most 32 row ids')
    } else {
      const seen = new Set<string>()
      for (const [index, rowId] of value.outlierIds.entries()) {
        const path = `visual.content.outlierIds[${String(index)}]`
        if (typeof rowId !== 'string' || !rowIds.has(rowId)) issues.push(`${path} must reference a declared row`)
        else if (seen.has(rowId)) issues.push(`${path} duplicates ${rowId}`)
        else seen.add(rowId)
      }
    }
  }
  const validateColumnRef = (candidate: unknown, path: string): void => {
    if (typeof candidate !== 'string' || !columnIds.has(candidate)) issues.push(`${path} must reference a declared column`)
  }
  if (value.initialSort !== undefined) {
    if (!record(value.initialSort)) issues.push('visual.content.initialSort must be an object')
    else {
      onlyKeys(value.initialSort, ['columnId', 'direction'], 'visual.content.initialSort', issues)
      validateColumnRef(value.initialSort.columnId, 'visual.content.initialSort.columnId')
      if (value.initialSort.direction !== 'asc' && value.initialSort.direction !== 'desc') {
        issues.push('visual.content.initialSort.direction must be asc or desc')
      }
    }
  }
  if (value.initialFilter !== undefined) {
    if (!record(value.initialFilter)) issues.push('visual.content.initialFilter must be an object')
    else {
      onlyKeys(value.initialFilter, ['columnId', 'operator', 'value'], 'visual.content.initialFilter', issues)
      validateColumnRef(value.initialFilter.columnId, 'visual.content.initialFilter.columnId')
      if (!['equals', 'not_equals', 'contains', 'gt', 'gte', 'lt', 'lte'].includes(value.initialFilter.operator as string)) {
        issues.push('visual.content.initialFilter.operator is unknown')
      }
      validateTableValue(value.initialFilter.value, 'visual.content.initialFilter.value', issues)
    }
  }
  if (value.chart !== undefined) {
    if (!record(value.chart)) issues.push('visual.content.chart must be an object')
    else {
      onlyKeys(value.chart, ['type', 'xColumnId', 'yColumnId', 'seriesColumnId'], 'visual.content.chart', issues)
      if (!['line', 'bar', 'scatter'].includes(value.chart.type as string)) issues.push('visual.content.chart.type is unknown')
      validateColumnRef(value.chart.xColumnId, 'visual.content.chart.xColumnId')
      validateColumnRef(value.chart.yColumnId, 'visual.content.chart.yColumnId')
      if (value.chart.seriesColumnId !== undefined) validateColumnRef(value.chart.seriesColumnId, 'visual.content.chart.seriesColumnId')
    }
  }
  return focusIds
}

function validateStateTransition(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'states', 'transitions', 'steps'], 'visual.content', issues)
  let states: RecordValue[] = []
  if (!Array.isArray(value.states) || value.states.length < 2 || value.states.length > 32) {
    issues.push('visual.content.states must contain 2 to 32 states')
  } else {
    states = value.states.filter(record)
    if (states.length !== value.states.length) issues.push('visual.content.states entries must be objects')
    uniqueIds(states, 'visual.content.states', issues)
    for (const [index, state] of states.entries()) {
      const path = `visual.content.states[${String(index)}]`
      onlyKeys(state, ['id', 'label', 'detail', 'tone', 'initial', 'final'], path, issues)
      if (id(state.id, `${path}.id`, issues)) registerVisualId(focusIds, state.id, `${path}.id`, issues)
      text(state.label, `${path}.label`, issues, 160)
      if (state.detail !== undefined) text(state.detail, `${path}.detail`, issues, 1_000)
      validateTone(state.tone, `${path}.tone`, issues)
      if (state.initial !== undefined && typeof state.initial !== 'boolean') issues.push(`${path}.initial must be a boolean`)
      if (state.final !== undefined && typeof state.final !== 'boolean') issues.push(`${path}.final must be a boolean`)
    }
  }
  const stateIds = new Set(states.flatMap(state => typeof state.id === 'string' ? [state.id] : []))
  let transitions: RecordValue[] = []
  if (!Array.isArray(value.transitions) || value.transitions.length < 1 || value.transitions.length > 96) {
    issues.push('visual.content.transitions must contain 1 to 96 transitions')
  } else {
    transitions = value.transitions.filter(record)
    if (transitions.length !== value.transitions.length) issues.push('visual.content.transitions entries must be objects')
    uniqueIds(transitions, 'visual.content.transitions', issues)
    for (const [index, transition] of transitions.entries()) {
      const path = `visual.content.transitions[${String(index)}]`
      onlyKeys(transition, ['id', 'from', 'to', 'trigger', 'guard', 'action', 'detail', 'tone'], path, issues)
      if (id(transition.id, `${path}.id`, issues)) registerVisualId(focusIds, transition.id, `${path}.id`, issues)
      if (typeof transition.from !== 'string' || !stateIds.has(transition.from)) issues.push(`${path}.from must reference a declared state`)
      if (typeof transition.to !== 'string' || !stateIds.has(transition.to)) issues.push(`${path}.to must reference a declared state`)
      text(transition.trigger, `${path}.trigger`, issues, 240)
      if (transition.guard !== undefined) text(transition.guard, `${path}.guard`, issues, 500)
      if (transition.action !== undefined) text(transition.action, `${path}.action`, issues, 500)
      if (transition.detail !== undefined) text(transition.detail, `${path}.detail`, issues, 1_000)
      validateTone(transition.tone, `${path}.tone`, issues)
    }
  }
  const transitionIds = new Set(transitions.flatMap(transition => typeof transition.id === 'string' ? [transition.id] : []))
  if (value.steps !== undefined) {
    if (!Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 16) {
      issues.push('visual.content.steps must contain 2 to 16 steps')
    } else {
      const steps = value.steps.filter(record)
      if (steps.length !== value.steps.length) issues.push('visual.content.steps entries must be objects')
      uniqueIds(steps, 'visual.content.steps', issues)
      for (const [index, step] of steps.entries()) {
        const path = `visual.content.steps[${String(index)}]`
        onlyKeys(step, ['id', 'label', 'currentStateId', 'transitionId', 'description'], path, issues)
        if (id(step.id, `${path}.id`, issues)) registerVisualId(focusIds, step.id, `${path}.id`, issues)
        text(step.label, `${path}.label`, issues, 160)
        if (typeof step.currentStateId !== 'string' || !stateIds.has(step.currentStateId)) issues.push(`${path}.currentStateId must reference a declared state`)
        if (step.transitionId !== undefined
          && (typeof step.transitionId !== 'string' || !transitionIds.has(step.transitionId))) issues.push(`${path}.transitionId must reference a declared transition`)
        if (step.description !== undefined) text(step.description, `${path}.description`, issues, 1_000)
      }
    }
  }
  return focusIds
}

function validateSequenceBuffer(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'slots', 'pointers', 'ranges', 'steps'], 'visual.content', issues)
  let slots: RecordValue[] = []
  if (!Array.isArray(value.slots) || value.slots.length < 1 || value.slots.length > 128) {
    issues.push('visual.content.slots must contain 1 to 128 slots')
  } else {
    slots = value.slots.filter(record)
    if (slots.length !== value.slots.length) issues.push('visual.content.slots entries must be objects')
    uniqueIds(slots, 'visual.content.slots', issues)
    const indexes = new Set<number>()
    for (const [index, slot] of slots.entries()) {
      const path = `visual.content.slots[${String(index)}]`
      onlyKeys(slot, ['id', 'index', 'value', 'label', 'tone'], path, issues)
      if (id(slot.id, `${path}.id`, issues)) registerVisualId(focusIds, slot.id, `${path}.id`, issues)
      if (!integer(slot.index, `${path}.index`, issues)) continue
      if (indexes.has(slot.index as number)) issues.push(`${path}.index duplicates ${String(slot.index)}`)
      indexes.add(slot.index as number)
      validateTableValue(slot.value, `${path}.value`, issues)
      if (slot.label !== undefined) text(slot.label, `${path}.label`, issues, 120)
      validateTone(slot.tone, `${path}.tone`, issues)
    }
  }
  const slotIds = new Set(slots.flatMap(slot => typeof slot.id === 'string' ? [slot.id] : []))
  const slotIndexes = new Set(slots.flatMap(slot => typeof slot.index === 'number' && Number.isInteger(slot.index) ? [slot.index] : []))
  const maxIndex = slots.reduce((max, slot) => typeof slot.index === 'number' ? Math.max(max, slot.index) : max, -1)
  let pointers: RecordValue[] = []
  if (value.pointers !== undefined) {
    if (!Array.isArray(value.pointers) || value.pointers.length < 1 || value.pointers.length > 8) {
      issues.push('visual.content.pointers must contain 1 to 8 pointers')
    } else {
      pointers = value.pointers.filter(record)
      if (pointers.length !== value.pointers.length) issues.push('visual.content.pointers entries must be objects')
      uniqueIds(pointers, 'visual.content.pointers', issues)
      for (const [index, pointer] of pointers.entries()) {
        const path = `visual.content.pointers[${String(index)}]`
        onlyKeys(pointer, ['id', 'label', 'index', 'tone'], path, issues)
        if (id(pointer.id, `${path}.id`, issues)) registerVisualId(focusIds, pointer.id, `${path}.id`, issues)
        text(pointer.label, `${path}.label`, issues, 120)
        if (integer(pointer.index, `${path}.index`, issues) && (pointer.index as number) > maxIndex + 1) issues.push(`${path}.index must point within the buffer`)
        validateTone(pointer.tone, `${path}.tone`, issues)
      }
    }
  }
  const pointerIds = new Set(pointers.flatMap(pointer => typeof pointer.id === 'string' ? [pointer.id] : []))
  let ranges: RecordValue[] = []
  if (value.ranges !== undefined) {
    if (!Array.isArray(value.ranges) || value.ranges.length < 1 || value.ranges.length > 8) {
      issues.push('visual.content.ranges must contain 1 to 8 ranges')
    } else {
      ranges = value.ranges.filter(record)
      if (ranges.length !== value.ranges.length) issues.push('visual.content.ranges entries must be objects')
      uniqueIds(ranges, 'visual.content.ranges', issues)
      for (const [index, range] of ranges.entries()) {
        const path = `visual.content.ranges[${String(index)}]`
        onlyKeys(range, ['id', 'label', 'start', 'end', 'tone'], path, issues)
        if (id(range.id, `${path}.id`, issues)) registerVisualId(focusIds, range.id, `${path}.id`, issues)
        text(range.label, `${path}.label`, issues, 120)
        const startOk = integer(range.start, `${path}.start`, issues)
        const endOk = integer(range.end, `${path}.end`, issues)
        if (startOk && !slotIndexes.has(range.start as number)) issues.push(`${path}.start must reference a declared slot index`)
        if (endOk && !slotIndexes.has(range.end as number)) issues.push(`${path}.end must reference a declared slot index`)
        if (startOk && endOk && (range.start as number) > (range.end as number)) issues.push(`${path}.start must not exceed end`)
        validateTone(range.tone, `${path}.tone`, issues)
      }
    }
  }
  const rangeIds = new Set(ranges.flatMap(range => typeof range.id === 'string' ? [range.id] : []))
  if (value.steps !== undefined) {
    if (!Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 16) {
      issues.push('visual.content.steps must contain 2 to 16 snapshots')
    } else {
      const steps = value.steps.filter(record)
      if (steps.length !== value.steps.length) issues.push('visual.content.steps entries must be objects')
      uniqueIds(steps, 'visual.content.steps', issues)
      for (const [index, step] of steps.entries()) {
        const path = `visual.content.steps[${String(index)}]`
        onlyKeys(step, ['id', 'label', 'description', 'slots', 'pointers', 'ranges'], path, issues)
        if (id(step.id, `${path}.id`, issues)) registerVisualId(focusIds, step.id, `${path}.id`, issues)
        text(step.label, `${path}.label`, issues, 160)
        if (step.description !== undefined) text(step.description, `${path}.description`, issues, 1_000)
        if (step.slots !== undefined) {
          if (!Array.isArray(step.slots) || step.slots.length > 128) issues.push(`${path}.slots must contain at most 128 snapshots`)
          else for (const [snapshotIndex, snapshot] of step.slots.entries()) {
            const snapshotPath = `${path}.slots[${String(snapshotIndex)}]`
            if (!record(snapshot)) { issues.push(`${snapshotPath} must be an object`); continue }
            onlyKeys(snapshot, ['slotId', 'value'], snapshotPath, issues)
            if (typeof snapshot.slotId !== 'string' || !slotIds.has(snapshot.slotId)) issues.push(`${snapshotPath}.slotId must reference a declared slot`)
            if (snapshot.value !== undefined) validateTableValue(snapshot.value, `${snapshotPath}.value`, issues)
          }
        }
        if (step.pointers !== undefined) {
          if (!Array.isArray(step.pointers) || step.pointers.length > 8) issues.push(`${path}.pointers must contain at most 8 snapshots`)
          else for (const [snapshotIndex, snapshot] of step.pointers.entries()) {
            const snapshotPath = `${path}.pointers[${String(snapshotIndex)}]`
            if (!record(snapshot)) { issues.push(`${snapshotPath} must be an object`); continue }
            onlyKeys(snapshot, ['pointerId', 'index'], snapshotPath, issues)
            if (typeof snapshot.pointerId !== 'string' || !pointerIds.has(snapshot.pointerId)) issues.push(`${snapshotPath}.pointerId must reference a declared pointer`)
            if (integer(snapshot.index, `${snapshotPath}.index`, issues) && (snapshot.index as number) > maxIndex + 1) issues.push(`${snapshotPath}.index must point within the buffer`)
          }
        }
        if (step.ranges !== undefined) {
          if (!Array.isArray(step.ranges) || step.ranges.length > 8) issues.push(`${path}.ranges must contain at most 8 snapshots`)
          else for (const [snapshotIndex, snapshot] of step.ranges.entries()) {
            const snapshotPath = `${path}.ranges[${String(snapshotIndex)}]`
            if (!record(snapshot)) { issues.push(`${snapshotPath} must be an object`); continue }
            onlyKeys(snapshot, ['rangeId', 'start', 'end'], snapshotPath, issues)
            if (typeof snapshot.rangeId !== 'string' || !rangeIds.has(snapshot.rangeId)) issues.push(`${snapshotPath}.rangeId must reference a declared range`)
            const startOk = integer(snapshot.start, `${snapshotPath}.start`, issues)
            const endOk = integer(snapshot.end, `${snapshotPath}.end`, issues)
            if (startOk && !slotIndexes.has(snapshot.start as number)) issues.push(`${snapshotPath}.start must reference a declared slot index`)
            if (endOk && !slotIndexes.has(snapshot.end as number)) issues.push(`${snapshotPath}.end must reference a declared slot index`)
            if (startOk && endOk && (snapshot.start as number) > (snapshot.end as number)) issues.push(`${snapshotPath}.start must not exceed end`)
          }
        }
      }
    }
  }
  return focusIds
}

function validateSequenceDiagram(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'participants', 'messages'], 'visual.content', issues)
  let participants: RecordValue[] = []
  if (!Array.isArray(value.participants) || value.participants.length < 2 || value.participants.length > 16) {
    issues.push('visual.content.participants must contain 2 to 16 participants')
  } else {
    participants = value.participants.filter(record)
    if (participants.length !== value.participants.length) issues.push('visual.content.participants entries must be objects')
    uniqueIds(participants, 'visual.content.participants', issues)
    for (const [index, participant] of participants.entries()) {
      const path = `visual.content.participants[${String(index)}]`
      onlyKeys(participant, ['id', 'label', 'detail', 'tone'], path, issues)
      if (id(participant.id, `${path}.id`, issues)) registerVisualId(focusIds, participant.id, `${path}.id`, issues)
      text(participant.label, `${path}.label`, issues, 160)
      if (participant.detail !== undefined) text(participant.detail, `${path}.detail`, issues, 1_000)
      validateTone(participant.tone, `${path}.tone`, issues)
    }
  }
  const participantIds = new Set(participants.flatMap(participant => typeof participant.id === 'string' ? [participant.id] : []))
  if (!Array.isArray(value.messages) || value.messages.length < 1 || value.messages.length > 96) {
    issues.push('visual.content.messages must contain 1 to 96 messages')
  } else {
    const messages = value.messages.filter(record)
    if (messages.length !== value.messages.length) issues.push('visual.content.messages entries must be objects')
    uniqueIds(messages, 'visual.content.messages', issues)
    for (const [index, message] of messages.entries()) {
      const path = `visual.content.messages[${String(index)}]`
      onlyKeys(message, ['id', 'from', 'to', 'label', 'type', 'detail', 'tone'], path, issues)
      if (id(message.id, `${path}.id`, issues)) registerVisualId(focusIds, message.id, `${path}.id`, issues)
      if (typeof message.from !== 'string' || !participantIds.has(message.from)) issues.push(`${path}.from must reference a declared participant`)
      if (typeof message.to !== 'string' || !participantIds.has(message.to)) issues.push(`${path}.to must reference a declared participant`)
      text(message.label, `${path}.label`, issues, 240)
      if (!['sync', 'async', 'return', 'self'].includes(message.type as string)) issues.push(`${path}.type must be sync, async, return, or self`)
      if (message.type === 'self' && message.from !== message.to) issues.push(`${path}.self messages must have matching from and to participants`)
      if (message.detail !== undefined) text(message.detail, `${path}.detail`, issues, 1_000)
      validateTone(message.tone, `${path}.tone`, issues)
    }
  }
  return focusIds
}

function validateCodeTrace(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'language', 'code', 'lines', 'steps'], 'visual.content', issues)
  text(value.language, 'visual.content.language', issues, 40)
  text(value.code, 'visual.content.code', issues, 24_000)
  const lineNumbers = new Set<number>()
  if (!Array.isArray(value.lines) || value.lines.length < 1 || value.lines.length > 256) {
    issues.push('visual.content.lines must contain 1 to 256 lines')
  } else {
    const lines = value.lines.filter(record)
    if (lines.length !== value.lines.length) issues.push('visual.content.lines entries must be objects')
    let previousLine = -1
    for (const [index, line] of lines.entries()) {
      const path = `visual.content.lines[${String(index)}]`
      onlyKeys(line, ['number', 'text'], path, issues)
      if (integer(line.number, `${path}.number`, issues)) {
        lineNumbers.add(line.number as number)
        if ((line.number as number) <= previousLine) issues.push(`${path}.number must increase in source order`)
        previousLine = line.number as number
      }
      if (typeof line.text !== 'string') issues.push(`${path}.text must be a string`)
      else if (line.text.length > 1_000) issues.push(`${path}.text exceeds 1000 characters`)
    }
  }
  if (!Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 32) {
    issues.push('visual.content.steps must contain 2 to 32 execution steps')
  } else {
    const steps = value.steps.filter(record)
    if (steps.length !== value.steps.length) issues.push('visual.content.steps entries must be objects')
    uniqueIds(steps, 'visual.content.steps', issues)
    for (const [index, step] of steps.entries()) {
      const path = `visual.content.steps[${String(index)}]`
      onlyKeys(step, ['id', 'label', 'currentLine', 'variables', 'stack', 'output', 'description'], path, issues)
      if (id(step.id, `${path}.id`, issues)) registerVisualId(focusIds, step.id, `${path}.id`, issues)
      text(step.label, `${path}.label`, issues, 160)
      if (integer(step.currentLine, `${path}.currentLine`, issues) && !lineNumbers.has(step.currentLine as number)) issues.push(`${path}.currentLine must reference a declared source line`)
      if (!Array.isArray(step.variables) || step.variables.length > 32) issues.push(`${path}.variables must contain at most 32 variables`)
      else {
        const variables = step.variables.filter(record)
        if (variables.length !== step.variables.length) issues.push(`${path}.variables entries must be objects`)
        const names = new Set<string>()
        for (const [variableIndex, variable] of variables.entries()) {
          const variablePath = `${path}.variables[${String(variableIndex)}]`
          onlyKeys(variable, ['name', 'value', 'type'], variablePath, issues)
          if (typeof variable.name !== 'string' || variable.name.trim() === '') issues.push(`${variablePath}.name must be a non-empty string`)
          else if (names.has(variable.name)) issues.push(`${variablePath}.name duplicates ${variable.name}`)
          else names.add(variable.name)
          validateTableValue(variable.value, `${variablePath}.value`, issues)
          if (variable.type !== undefined) text(variable.type, `${variablePath}.type`, issues, 80)
        }
      }
      if (!Array.isArray(step.stack) || step.stack.length > 16) issues.push(`${path}.stack must contain at most 16 frames`)
      else {
        const stack = step.stack.filter(record)
        if (stack.length !== step.stack.length) issues.push(`${path}.stack entries must be objects`)
        uniqueIds(stack, `${path}.stack`, issues)
        for (const [frameIndex, frame] of stack.entries()) {
          const framePath = `${path}.stack[${String(frameIndex)}]`
          onlyKeys(frame, ['id', 'function', 'line'], framePath, issues)
          // Stack frame ids are scoped to one execution snapshot and may be
          // reused as the same call remains on the stack across steps.
          id(frame.id, `${framePath}.id`, issues)
          text(frame.function, `${framePath}.function`, issues, 160)
          if (frame.line !== undefined && integer(frame.line, `${framePath}.line`, issues) && !lineNumbers.has(frame.line as number)) issues.push(`${framePath}.line must reference a declared source line`)
        }
      }
      if (step.output !== undefined && typeof step.output !== 'string') issues.push(`${path}.output must be a string`)
      else if (step.output !== undefined && (step.output as string).length > 4_000) issues.push(`${path}.output exceeds 4000 characters`)
      if (step.description !== undefined) text(step.description, `${path}.description`, issues, 1_000)
    }
  }
  return focusIds
}

function validateFieldGrid(value: unknown, path: string, issues: string[], components: 'scalar' | 'vector'): void {
  if (!record(value)) {
    issues.push(`${path} must be an object`)
    return
  }
  const allowed = components === 'scalar' ? ['columns', 'rows', 'values'] : ['columns', 'rows', 'u', 'v']
  onlyKeys(value, allowed, path, issues)
  const columnsOk = integer(value.columns, `${path}.columns`, issues, 2) && (value.columns as number) <= 64
  const rowsOk = integer(value.rows, `${path}.rows`, issues, 2) && (value.rows as number) <= 64
  const expected = columnsOk && rowsOk ? (value.columns as number) * (value.rows as number) : undefined
  if (components === 'scalar') {
    if (!Array.isArray(value.values) || value.values.length < 1 || value.values.length > 4_096) issues.push(`${path}.values must contain sampled values`)
    else {
      if (expected !== undefined && value.values.length !== expected) issues.push(`${path}.values length must equal rows * columns`)
      for (const [index, sample] of value.values.entries()) finite(sample, `${path}.values[${String(index)}]`, issues)
    }
  } else {
    for (const component of ['u', 'v'] as const) {
      const samples = value[component]
      if (!Array.isArray(samples) || samples.length < 1 || samples.length > 4_096) issues.push(`${path}.${component} must contain sampled values`)
      else {
        if (expected !== undefined && samples.length !== expected) issues.push(`${path}.${component} length must equal rows * columns`)
        for (const [index, sample] of samples.entries()) finite(sample, `${path}.${component}[${String(index)}]`, issues)
      }
    }
  }
}

function validateFieldAxis(value: unknown, path: string, issues: string[]): void {
  if (!record(value)) {
    issues.push(`${path} must be an object`)
    return
  }
  onlyKeys(value, ['label', 'min', 'max', 'samples'], path, issues)
  if (value.label !== undefined) text(value.label, `${path}.label`, issues, 120)
  const minOk = finite(value.min, `${path}.min`, issues)
  const maxOk = finite(value.max, `${path}.max`, issues)
  if (minOk && maxOk && (value.min as number) >= (value.max as number)) issues.push(`${path}.min must be less than max`)
  if (value.samples !== undefined
    && (!integer(value.samples, `${path}.samples`, issues, 2) || (value.samples as number) > 64)) {
    issues.push(`${path}.samples must be an integer from 2 to 64`)
  }
}

function validateField2D(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'xAxis', 'yAxis', 'scalar', 'vector'], 'visual.content', issues)
  validateFieldAxis(value.xAxis, 'visual.content.xAxis', issues)
  validateFieldAxis(value.yAxis, 'visual.content.yAxis', issues)
  if (value.scalar === undefined && value.vector === undefined) issues.push('visual.content must provide scalar or vector data')
  const fieldVariables = new Set(['y'])
  if (value.scalar !== undefined) {
    if (!record(value.scalar)) issues.push('visual.content.scalar must be an object')
    else {
      onlyKeys(value.scalar, ['samples', 'expression', 'min', 'max'], 'visual.content.scalar', issues)
      if (value.scalar.samples === undefined && value.scalar.expression === undefined) issues.push('visual.content.scalar must provide samples or expression')
      if (value.scalar.samples !== undefined) validateFieldGrid(value.scalar.samples, 'visual.content.scalar.samples', issues, 'scalar')
      if (value.scalar.expression !== undefined) validateMathExpression(value.scalar.expression, fieldVariables, 'visual.content.scalar.expression', issues, true, MAX_VISUAL_MATH_DEPTH)
      const minOk = value.scalar.min === undefined ? false : finite(value.scalar.min, 'visual.content.scalar.min', issues)
      const maxOk = value.scalar.max === undefined ? false : finite(value.scalar.max, 'visual.content.scalar.max', issues)
      if (minOk && maxOk && (value.scalar.min as number) >= (value.scalar.max as number)) issues.push('visual.content.scalar.min must be less than max')
    }
  }
  if (value.vector !== undefined) {
    if (!record(value.vector)) issues.push('visual.content.vector must be an object')
    else {
      onlyKeys(value.vector, ['samples', 'expression'], 'visual.content.vector', issues)
      if (value.vector.samples === undefined && value.vector.expression === undefined) issues.push('visual.content.vector must provide samples or expression')
      if (value.vector.samples !== undefined) validateFieldGrid(value.vector.samples, 'visual.content.vector.samples', issues, 'vector')
      if (value.vector.expression !== undefined) {
        if (!record(value.vector.expression)) issues.push('visual.content.vector.expression must be an object')
        else {
          onlyKeys(value.vector.expression, ['u', 'v'], 'visual.content.vector.expression', issues)
          validateMathExpression(value.vector.expression.u, fieldVariables, 'visual.content.vector.expression.u', issues, true, MAX_VISUAL_MATH_DEPTH)
          validateMathExpression(value.vector.expression.v, fieldVariables, 'visual.content.vector.expression.v', issues, true, MAX_VISUAL_MATH_DEPTH)
        }
      }
    }
  }
  return focusIds
}

function validateCausalLoop(value: RecordValue, issues: string[]): Set<string> {
  const focusIds = new Set<string>()
  onlyKeys(value, ['kind', 'variables', 'links', 'loops'], 'visual.content', issues)
  let variables: RecordValue[] = []
  if (!Array.isArray(value.variables) || value.variables.length < 2 || value.variables.length > 32) {
    issues.push('visual.content.variables must contain 2 to 32 variables')
  } else {
    variables = value.variables.filter(record)
    if (variables.length !== value.variables.length) issues.push('visual.content.variables entries must be objects')
    uniqueIds(variables, 'visual.content.variables', issues)
    for (const [index, variable] of variables.entries()) {
      const path = `visual.content.variables[${String(index)}]`
      onlyKeys(variable, ['id', 'label', 'detail', 'tone'], path, issues)
      if (id(variable.id, `${path}.id`, issues)) registerVisualId(focusIds, variable.id, `${path}.id`, issues)
      text(variable.label, `${path}.label`, issues, 160)
      if (variable.detail !== undefined) text(variable.detail, `${path}.detail`, issues, 1_000)
      validateTone(variable.tone, `${path}.tone`, issues)
    }
  }
  const variableIds = new Set(variables.flatMap(variable => typeof variable.id === 'string' ? [variable.id] : []))
  let links: RecordValue[] = []
  if (!Array.isArray(value.links) || value.links.length < 1 || value.links.length > 96) {
    issues.push('visual.content.links must contain 1 to 96 links')
  } else {
    links = value.links.filter(record)
    if (links.length !== value.links.length) issues.push('visual.content.links entries must be objects')
    uniqueIds(links, 'visual.content.links', issues)
    for (const [index, link] of links.entries()) {
      const path = `visual.content.links[${String(index)}]`
      onlyKeys(link, ['id', 'from', 'to', 'polarity', 'delay', 'label', 'detail', 'tone'], path, issues)
      if (id(link.id, `${path}.id`, issues)) registerVisualId(focusIds, link.id, `${path}.id`, issues)
      if (typeof link.from !== 'string' || !variableIds.has(link.from)) issues.push(`${path}.from must reference a declared variable`)
      if (typeof link.to !== 'string' || !variableIds.has(link.to)) issues.push(`${path}.to must reference a declared variable`)
      if (link.polarity !== 'positive' && link.polarity !== 'negative') issues.push(`${path}.polarity must be positive or negative`)
      if (link.delay !== undefined && (typeof link.delay !== 'number' || !Number.isFinite(link.delay) || link.delay < 0)) issues.push(`${path}.delay must be a non-negative finite number`)
      if (link.label !== undefined) text(link.label, `${path}.label`, issues, 160)
      if (link.detail !== undefined) text(link.detail, `${path}.detail`, issues, 1_000)
      validateTone(link.tone, `${path}.tone`, issues)
    }
  }
  const linkIds = new Set(links.flatMap(link => typeof link.id === 'string' ? [link.id] : []))
  if (value.loops !== undefined) {
    if (!Array.isArray(value.loops) || value.loops.length < 1 || value.loops.length > 12) {
      issues.push('visual.content.loops must contain 1 to 12 loops')
    } else {
      const loops = value.loops.filter(record)
      if (loops.length !== value.loops.length) issues.push('visual.content.loops entries must be objects')
      uniqueIds(loops, 'visual.content.loops', issues)
      for (const [index, loop] of loops.entries()) {
        const path = `visual.content.loops[${String(index)}]`
        onlyKeys(loop, ['id', 'label', 'type', 'linkIds', 'detail', 'tone'], path, issues)
        if (id(loop.id, `${path}.id`, issues)) registerVisualId(focusIds, loop.id, `${path}.id`, issues)
        text(loop.label, `${path}.label`, issues, 160)
        if (loop.type !== 'reinforcing' && loop.type !== 'balancing') issues.push(`${path}.type must be reinforcing or balancing`)
        if (!Array.isArray(loop.linkIds) || loop.linkIds.length < 1 || loop.linkIds.length > 96) issues.push(`${path}.linkIds must contain 1 to 96 link ids`)
        else {
          const seen = new Set<string>()
          for (const [linkIndex, linkId] of loop.linkIds.entries()) {
            const linkPath = `${path}.linkIds[${String(linkIndex)}]`
            if (typeof linkId !== 'string' || !linkIds.has(linkId)) issues.push(`${linkPath} must reference a declared link`)
            else if (seen.has(linkId)) issues.push(`${linkPath} duplicates ${linkId}`)
            else seen.add(linkId)
          }
        }
        if (loop.detail !== undefined) text(loop.detail, `${path}.detail`, issues, 1_000)
        validateTone(loop.tone, `${path}.tone`, issues)
      }
    }
  }
  return focusIds
}

type ContentValidator = (value: RecordValue, issues: string[]) => Set<string>

const CONTENT_VALIDATORS: { readonly [Kind in VisualContentKind]: ContentValidator } = {
  plot: validatePlot,
  node_link: validateNodeLink,
  scene_2d: validateScene2D,
  relation: validateRelation,
  timeline: validateTimeline,
  formula_steps: validateFormulaSteps,
  study_map: validateStudyMap,
  recall_deck: validateRecallDeck,
  data_table: validateDataTable,
  state_transition: validateStateTransition,
  sequence_buffer: validateSequenceBuffer,
  sequence_diagram: validateSequenceDiagram,
  code_trace: validateCodeTrace,
  field_2d: validateField2D,
  causal_loop: validateCausalLoop,
}

/**
 * Validate one untrusted `visual.content` value against the kind it names.
 * @returns the ids a sequence frame may focus; empty when the content is invalid.
 */
export function validateVisualContent(value: unknown, issues: string[]): Set<string> {
  if (!record(value)) {
    issues.push('visual.content must be an object')
    return new Set<string>()
  }
  const kind = value.kind
  if (typeof kind === 'string' && Object.hasOwn(CONTENT_VALIDATORS, kind)) {
    return CONTENT_VALIDATORS[kind as VisualContentKind](value, issues)
  }
  issues.push(`visual.content.kind must be one of ${VISUAL_CONTENT_KINDS.join(', ')}`)
  return new Set<string>()
}

import { Vector2, Vector3, Line3 } from 'three';

/**
 * Section determines the MRP section of a volume.
 */
export interface Section {
  origin: number[];
  xAxis: number[]; // in millimeters
  yAxis: number[]; // in millimeters
}

interface SectionVector {
  origin: Vector3;
  xAxis: Vector3;
  yAxis: Vector3;
}

/**
 * Converts the members of Section into Vector3 for easier calculation.
 * It is safe to modify the returned object because all the members are cloned.
 * @param section The input Section object.
 */
export function vectorizeSection(section: Section): SectionVector {
  return {
    origin: new Vector3().fromArray(section.origin),
    xAxis: new Vector3().fromArray(section.xAxis),
    yAxis: new Vector3().fromArray(section.yAxis)
  };
}

export function projectPointOntoSection(
  section: Section,
  point: Vector3
): Vector2 {
  const vSection = vectorizeSection(section);
  const p = new Vector3().subVectors(point, vSection.origin);
  return new Vector2(
    vSection.xAxis.normalize().dot(p),
    vSection.yAxis.normalize().dot(p)
  );
}

/**
 * Performs a parallel translation on a given section.
 */
export function translateSection(section: Section, delta: Vector3): Section {
  const vSection = vectorizeSection(section);
  return {
    origin: vSection.origin.add(delta).toArray(),
    xAxis: vSection.xAxis.toArray(),
    yAxis: vSection.yAxis.toArray()
  };
}

/**
 * Calculates the intersection point of the given line segment and the plane.
 * This does not check if the intersection is within the section
 * (i.e., section is treated as a plane that extends infinitely).
 * @return The intersection point. null if there is no intersection.
 */
export function intersectionOfLineAndPlane(
  section: Section,
  line: Line3
): Vector3 | null {
  const nv = normalVector(section);
  const origin = new Vector3().fromArray(section.origin);

  const vecPA = new Vector3().subVectors(origin, line.start);
  const vecPB = new Vector3().subVectors(origin, line.end);

  const dotNvA = vecPA.dot(nv);
  const dotNvB = vecPB.dot(nv);

  if (dotNvA === 0 && dotNvB === 0) {
    // the line is parallel to the section
    return null;
  } else if (0 < dotNvA && 0 < dotNvB) {
    // both ends of the line are above the section
    return null;
  } else if (dotNvA < 0 && dotNvB < 0) {
    // both ends of the line are under the section
    return null;
  } else {
    const rate = Math.abs(dotNvA) / (Math.abs(dotNvA) + Math.abs(dotNvB));
    return line.at(rate, new Vector3());
  }
}

/**
 * Returns true if the given point is within the given section.
 */
export function intersectionPointWithinSection(
  section: Section,
  pointOnSection: Vector3
): boolean {
  const vSection = vectorizeSection(section);
  const origin = vSection.origin;
  const op = new Vector3().subVectors(pointOnSection, origin);
  const lenX = vSection.xAxis.length();
  const lenY = vSection.yAxis.length();
  const dotX = vSection.xAxis.dot(op);
  const dotY = vSection.yAxis.dot(op);
  return 0 <= dotX && dotX <= lenX * lenX && 0 <= dotY && dotY <= lenY * lenY;
}

/**
 * Calculates the intersection point of the given line segment and the section.
 * @return The intersection point. null if there is no intersection.
 */
export function intersectionOfLineAndSection(
  section: Section,
  line: Line3
): Vector3 | null {
  const intersection = intersectionOfLineAndPlane(section, line);
  if (!intersection) return null;
  return intersectionPointWithinSection(section, intersection)
    ? intersection
    : null;
}

/**
 * Calculates the intersection of two (finite) sections.
 * @param base The base section, on which the target section is projected
 * @param target The target section
 * @returns The line segment which represents how the target section
 * intersects with the base section.
 * The resulting line segment may extend outside the boundry of base,
 * while it does not extend outside the target.
 */
export function intersectionOfTwoSections(
  base: Section,
  target: Section
): Line3 | null {
  const intersections: Vector3[] = [];

  // Prepare the 4 edges (line segments) of the target section.
  const vTarget = vectorizeSection(target);
  const tOrigin = vTarget.origin;

  // 0--1
  // |  |
  // 3--2
  //
  // prettier-ignore
  const vertexes: Vector3[] = [
    tOrigin,
    tOrigin.clone().add(vTarget.xAxis),
    tOrigin.clone().add(vTarget.xAxis).add(vTarget.yAxis),
    tOrigin.clone().add(vTarget.yAxis)
  ];

  const edgeIndexes: number[][] = [[0, 1], [1, 2], [2, 3], [3, 0]];

  for (let i = 0; i < 4; i++) {
    const from = vertexes[edgeIndexes[i][0]];
    const to = vertexes[edgeIndexes[i][1]];
    const edge = new Line3(from, to);
    const intersection = intersectionOfLineAndPlane(base, edge);
    if (intersection !== null) intersections.push(intersection);
  }

  if (intersections.length < 2) {
    // two sections do not intersect at all
    return null;
  }
  if (intersections.every(p => !intersectionPointWithinSection(base, p))) {
    // the target section intersects with the plane containing the base section,
    // but somewhere outside of the boundary of the base section
    return null;
  }

  // Now intersections should normally contain 2 intersection points,
  // but when there are more, find one which is different from the first
  for (let i = 1; i < intersections.length; i++) {
    if (intersections[0].distanceTo(intersections[i]) > 0.0001) {
      return new Line3(intersections[0], intersections[i]);
    }
  }

  return null;
}

/**
 * Calculates the normal vector of the given section.
 * @param section The section.
 * @returns The calculated normal vector.
 */
export function normalVector(section: Section): Vector3 {
  return new Vector3()
    .fromArray(section.xAxis)
    .cross(new Vector3().fromArray(section.yAxis))
    .normalize();
}

/**
 * Compare the contents of the two sections.
 * @param a The section to compare.
 * @param b The section to compare.
 * @returns True if the two given Sections are identical.
 */
export function sectionEquals(a: Section, b: Section): boolean {
  const vectorEquals = (a: Array<number>, b: Array<number>) =>
    a.length === b.length && a.every((_, i) => a[i] === b[i]);
  return (
    vectorEquals(a.origin, b.origin) &&
    vectorEquals(a.xAxis, b.xAxis) &&
    vectorEquals(a.yAxis, b.yAxis)
  );
}

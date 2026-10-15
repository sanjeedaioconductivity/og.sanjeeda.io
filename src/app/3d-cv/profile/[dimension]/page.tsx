'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import AppShell from '../../_components/AppShell';
import AttributesDimension from '../../_components/dimensions/AttributesDimension';
import KnowledgeDimension from '../../_components/dimensions/KnowledgeDimension';
import ListDimension from '../../_components/dimensions/ListDimension';
import SkillsDimension from '../../_components/dimensions/SkillsDimension';
import { isDimensionId } from '../../_lib/dimensions';
import { useCv3d } from '../../_lib/store';

/** Screens 8–16 — one route for the nine dimensions, e.g. /3d-cv/profile/projects. */
export default function DimensionPage({ params }: { params: Promise<{ dimension: string }> }) {
  const { dimension } = use(params);
  const { hydrated } = useCv3d();
  if (!isDimensionId(dimension)) notFound();
  // Wait for saved state so forms and lists open with the candidate's data.
  if (!hydrated) return <AppShell tabs>{null}</AppShell>;

  switch (dimension) {
    case 'knowledge':
      return <KnowledgeDimension />;
    case 'skills':
      return <SkillsDimension />;
    case 'attributes':
      return <AttributesDimension />;
    default:
      return <ListDimension key={dimension} dimension={dimension} />;
  }
}

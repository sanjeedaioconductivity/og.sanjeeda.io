import { QuestionsAdmin } from "./QuestionsAdmin";

/**
 * ADM-001 — Questions (Epic 10.3). Its own screen: the editor body changes
 * entirely with scoreType (an enum's options table looks nothing like a numeric
 * field's band editor), which the generic config-driven form does not model.
 */
export default function QuestionsPage() {
  return <QuestionsAdmin />;
}

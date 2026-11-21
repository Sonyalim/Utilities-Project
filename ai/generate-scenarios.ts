import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';

type Requirement = { id: string; text: string };

const root = process.cwd();
const requirementsPath = path.join(root, 'Requirements.md');
const outputPath = path.join(root, 'features', 'drafts', 'requirements.feature');

function parseRequirements(markdown: string): Requirement[] {
  return [...markdown.matchAll(/^\d+\.\s+\[(REQ-\d+)\]\s+(.+)$/gm)]
    .map(([, id, text]) => ({ id, text }));
}

async function main() {
  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!apiUrl || !apiKey || !model) {
    throw new Error('Set AI_API_URL, AI_API_KEY, and AI_MODEL to use the scenario generator.');
  }

  const requirements = parseRequirements(await readFile(requirementsPath, 'utf8'));
  if (requirements.length === 0) {
    throw new Error(`No numbered [REQ-xx] requirements found in ${requirementsPath}.`);
  }

  const prompt = [
    'Draft one Gherkin feature file from the requirements below.',
    'Create exactly one concise Scenario per requirement and tag each scenario with its requirement ID (for example, @REQ-01).',
    'Use only behavior stated in the requirements; do not invent endpoints, credentials, or expected values.',
    'Return only valid Gherkin text, with no Markdown fences or commentary.',
    '',
    ...requirements.map(({ id, text }) => `${id}: ${text}`),
  ].join('\n');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You draft concise, reviewable Gherkin scenarios.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`Scenario provider returned HTTP ${response.status} ${response.statusText}.`);
  }

  const result = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const feature = result.choices?.[0]?.message?.content?.trim();
  if (!feature || !/^\s*Feature:/m.test(feature) || !/^\s*Scenario(?: Outline)?:/m.test(feature)) {
    throw new Error('AI response did not contain a valid Gherkin Feature and Scenario.');
  }

  const scenarioCount = feature.match(/^\s*Scenario(?: Outline)?:/gm)?.length ?? 0;
  if (scenarioCount !== requirements.length) {
    throw new Error(`AI response must contain ${requirements.length} scenarios; found ${scenarioCount}.`);
  }

  const missingIds = requirements
    .filter(({ id }) => [...feature.matchAll(new RegExp(`@${id}\\b`, 'g'))].length !== 1)
    .map(({ id }) => id);
  if (missingIds.length > 0) {
    throw new Error(`AI response must include each requirement tag exactly once: ${missingIds.join(', ')}`);
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${feature}\n`, 'utf8');
  console.log(`Wrote draft scenarios to ${path.relative(root, outputPath)}. Human review is required.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
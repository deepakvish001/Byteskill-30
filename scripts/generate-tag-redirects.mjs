import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const redirects = {
  'azure-functions': '/azure/azure-functions',
  'azure-logic-apps': '/azure/logic-apps',
  'bot-framework': '/bots/bot-framework',
  'cognitive-services': '/azure/cognitive-services',
  'power-automate': '/power-platform/power-automate',
  'power-bi': '/power-platform/power-bi',
  'power-pages': '/power-platform/power-pages',
  'power-platform': '/power-platform',
  'power-apps': '/power-platform/power-apps',
  'qna-maker': '/bots/qna-maker',
  'web-api': '/connectors/web-api',
  'windows-workflow-foundation': '/dotnet/windows-workflow-foundation',
};

async function generateRedirects() {
  const redirectFileContent = Object.entries(redirects)
    .map(([from, to]) => `/${from}/  ${to}  301!`)
    .join('\n');

  const filePath = path.resolve(__dirname, '../_redirects');

  try {
    await fs.writeFile(filePath, redirectFileContent + '\n');
    console.log(`Successfully generated _redirects file at ${filePath}`);
  } catch (error) {
    console.error('Error generating _redirects file:', error);
  }
}

generateRedirects();

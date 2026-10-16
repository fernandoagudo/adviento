import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAmazonRequest } from './amazon-request.mjs';

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = resolve(projectDirectory, 'data/products.json');
const required = ['AMAZON_CREATORS_CLIENT_ID', 'AMAZON_CREATORS_CLIENT_SECRET', 'AMAZON_PARTNER_TAG'];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Falta la variable de entorno ${name}.`);
}

const marketplace = 'www.amazon.es';
const searches = [
  ['calendario de adviento manualidades niños', 'manualidades'],
  ['calendario de adviento belleza', 'belleza'],
  ['calendario de adviento gourmet', 'gourmet'],
  ['calendario de adviento chocolate', 'chocolate'],
  ['calendario de adviento juguetes construcción', 'juguetes'],
  ['calendario de adviento original pareja', 'originales'],
];

function validateCatalog(products) {
  if (!Array.isArray(products)) throw new Error('data/products.json debe contener una lista.');
  const ids = new Set();
  for (const [index, product] of products.entries()) {
    if (!product || typeof product !== 'object' || Array.isArray(product)) {
      throw new Error(`El producto ${index + 1} no es válido.`);
    }
    if (typeof product.id !== 'string' || !product.id.trim() || typeof product.type !== 'string') {
      throw new Error(`El producto ${index + 1} debe tener id y type válidos.`);
    }
    if (ids.has(product.id)) throw new Error(`El id ${product.id} está duplicado.`);
    ids.add(product.id);
    if (!Number.isFinite(product.price) || product.price < 0) {
      throw new Error(`El precio del producto ${product.id} no es válido.`);
    }
    if (product.type === 'calendario' && (typeof product.category !== 'string' || !product.category.trim())) {
      throw new Error(`El calendario ${product.id} no tiene una categoría válida.`);
    }
  }
}

function readUsablePrice(item) {
  const money = item?.offersV2?.listings?.find((listing) => listing.price?.money)?.price?.money;
  const amount = money?.amount;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null;
  const displayAmount = typeof money.displayAmount === 'string' && money.displayAmount.trim()
    ? money.displayAmount
    : `${new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)} €`;
  return { amount, displayAmount };
}

function readItems(result) {
  return result.items ?? result.itemsResult?.items ?? result.getItemsResult?.items ?? [];
}

async function getPricesByIds(accessToken, ids) {
  if (ids.length === 0) return new Map();

  const result = await request('https://creatorsapi.amazon/catalog/v1/getItems', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      'x-marketplace': marketplace,
    },
    body: JSON.stringify({
      marketplace,
      partnerTag: process.env.AMAZON_PARTNER_TAG,
      itemIds: ids,
      itemIdType: 'ASIN',
      resources: ['offersV2.listings.price'],
    }),
  });

  const pricesById = new Map();
  for (const item of readItems(result)) {
    const price = readUsablePrice(item);
    if (typeof item.asin === 'string' && price !== null) pricesById.set(item.asin, price);
  }
  return pricesById;
}

let products;
try {
  products = JSON.parse(await readFile(catalogPath, 'utf8'));
} catch (error) {
  throw new Error(`No se pudo leer data/products.json: ${error.message}`);
}
validateCatalog(products);

const request = createAmazonRequest();
let accessToken;
try {
  const token = await request('https://api.amazon.co.uk/auth/o2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: process.env.AMAZON_CREATORS_CLIENT_ID,
      client_secret: process.env.AMAZON_CREATORS_CLIENT_SECRET,
      scope: 'creatorsapi::default',
    }),
  });
  accessToken = token.access_token;
} catch (error) {
  console.warn(`No se pudo obtener un token de Amazon: ${error.message}`);
}

let updatedProducts = 0;
const updatedIds = new Set();
if (accessToken) {
  for (const [keywords, category] of searches) {
    const matchingProducts = products.filter((product) => product.type === 'calendario' && product.category === category);

    let result;
    try {
      result = await request('https://creatorsapi.amazon/catalog/v1/searchItems', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
          'x-marketplace': marketplace,
        },
        body: JSON.stringify({
          marketplace,
          partnerTag: process.env.AMAZON_PARTNER_TAG,
          keywords,
          condition: 'New',
          availability: 'Available',
          itemCount: 4,
          resources: ['images.primary.medium', 'itemInfo.title', 'itemInfo.features', 'offersV2.listings.price'],
        }),
      });
    } catch (error) {
      console.warn(`No se pudo consultar ${category}: ${error.message}`);
      continue;
    }

    const pricesById = new Map();
    for (const item of result.searchResult?.items ?? []) {
      const price = readUsablePrice(item);
      if (typeof item.asin === 'string' && price !== null) pricesById.set(item.asin, price);
    }
    for (const product of matchingProducts) {
      const price = pricesById.get(product.id);
      if (price === undefined) continue;
      product.price = price.amount;
      product.priceDisplay = price.displayAmount;
      updatedProducts += 1;
      updatedIds.add(product.id);
    }
  }

  const remainingIds = products
    .filter((product) => product.type === 'calendario' && !updatedIds.has(product.id))
    .map((product) => product.id);

  for (let offset = 0; offset < remainingIds.length; offset += 10) {
    const ids = remainingIds.slice(offset, offset + 10);
    let pricesById;
    try {
      pricesById = await getPricesByIds(accessToken, ids);
    } catch (error) {
      console.warn(`No se pudo consultar directamente los ASIN ${ids.join(', ')}: ${error.message}`);
      continue;
    }

    for (const product of products) {
      const price = pricesById.get(product.id);
      if (price === undefined) continue;
      product.price = price.amount;
      product.priceDisplay = price.displayAmount;
      updatedProducts += 1;
      updatedIds.add(product.id);
    }
  }
}

if (updatedProducts === 0) throw new Error('Amazon no devolvió precios para productos existentes; no se ha modificado el catálogo.');
await writeFile(catalogPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8');
console.log(`Precios actualizados para ${updatedProducts} calendarios existentes.`);

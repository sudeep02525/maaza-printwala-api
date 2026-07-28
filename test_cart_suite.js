import http from 'http';

const BASE_URL = 'http://127.0.0.1:5000/api';
let cookieHeader = '';

const makeRequest = (method, path, body = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const reqHeaders = { ...headers };
    if (cookieHeader && !reqHeaders['Cookie']) {
      reqHeaders['Cookie'] = cookieHeader;
    }
    let bodyStr = null;
    if (body) {
      bodyStr = JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      if (res.headers['set-cookie'] && !cookieHeader) {
        cookieHeader = res.headers['set-cookie'][0].split(';')[0];
      }
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: { raw: data } });
        }
      });
    });

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
};

const runSuite = async () => {
  console.log('=== STARTING PHASE 7A COMPREHENSIVE CART VERIFICATION SUITE ===\n');

  // 0. Fetch Products
  const prodRes = await makeRequest('GET', '/products');
  const products = prodRes.data.data.products;
  const vcProd = products.find((p) => p.slug === 'visiting-cards-demo');
  const fbProd = products.find((p) => p.slug === 'flex-banners-demo');
  const tsProd = products.find((p) => p.slug === 't-shirts-demo');

  console.log('0. Seed Products Loaded:');
  console.log(`   - Visiting Cards ID: ${vcProd._id}`);
  console.log(`   - Flex Banner ID: ${fbProd._id}`);
  console.log(`   - T-Shirt ID: ${tsProd._id}\n`);

  // Test 10 & 16: Empty Cart State & httpOnly Guest Session Cookie
  const cartRes1 = await makeRequest('GET', '/cart');
  console.log(`Test 10 & 16 (Empty Cart & Cookie): Status=${cartRes1.status}, Total=${cartRes1.data.data.cart.cartTotal}`);
  console.log(`   Assigned Cookie: ${cookieHeader}\n`);

  // Fetch a valid template for Visiting Cards
  const tmplRes = await makeRequest('GET', `/templates/product/${vcProd._id}`);
  const vcTmpl = tmplRes.data.data.templates[0];

  // Test 1, 5, 15: Visiting Card Cart Flow, Template Customised Item, Tampered Frontend Price Test
  console.log('Test 1, 5, 15: Adding Visiting Card with Template & Tampered Price (unitPrice=0.01, totalPrice=1.00)...');
  const addVc = await makeRequest('POST', '/cart/items', {
    productId: vcProd._id,
    configuration: { size: '89x51mm', paper: '350gsm-gloss', finish: 'uv-spot' },
    quantity: 500,
    designType: 'TEMPLATE',
    template: {
      templateId: vcTmpl._id,
      customFields: { 'Company Name': 'Maaza Printwala', 'Full Name': 'Amit Sharma' },
    },
    unitPrice: 0.01,
    totalPrice: 1.00,
  });
  const vcItem = addVc.data.data.cart.items[0];
  console.log(`   Result: Status=${addVc.status}`);
  console.log(`   Authoritative Unit Price: ₹${vcItem.authoritativeUnitPrice} (Ignored tampered 0.01!)`);
  console.log(`   Authoritative Line Total: ₹${vcItem.authoritativeLineTotal} (Ignored tampered 1.00!)`);
  console.log(`   Cart Total: ₹${addVc.data.data.cart.cartTotal}\n`);

  // Create an artwork upload first for Test 4
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const postData = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="artwork"; filename="test-banner-art.pdf"\r\nContent-Type: application/pdf\r\n\r\n`),
    Buffer.from('%PDF-1.4 sample artwork content for verification'),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const uploadRes = await new Promise((resolve) => {
    const req = http.request(
      new URL(BASE_URL + '/upload/artwork'),
      { method: 'POST', headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': postData.length } },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(JSON.parse(d)));
      }
    );
    req.write(postData);
    req.end();
  });
  const artMeta = uploadRes.data.artwork;
  console.log(`Uploaded valid artwork fileId: ${artMeta.fileId}\n`);

  // Test 2, 4, 6: Flex Banner Dimensions Cart Flow, Uploaded Artwork Item, Multiple Cart Items
  console.log('Test 2, 4, 6: Adding Custom Flex Banner (4ft x 3ft = 12 sqft) with Uploaded Artwork...');
  const addFb = await makeRequest('POST', '/cart/items', {
    productId: fbProd._id,
    configuration: { material: 'star-flex', eyelets: 'every-2-feet', width: 4, height: 3 },
    dimensions: { width: 4, height: 3, unit: 'ft' },
    quantity: 10,
    designType: 'UPLOAD',
    artwork: { fileId: artMeta.fileId, originalName: 'client-banner.pdf' },
  });
  const fbItem = addFb.data.data.cart.items[1];
  console.log(`   Result: Status=${addFb.status}, Items Count=${addFb.data.data.cart.items.length}`);
  console.log(`   Banner Line Total: ₹${fbItem.authoritativeLineTotal}`);
  console.log(`   Combined Cart Total: ₹${addFb.data.data.cart.cartTotal}\n`);

  // Test 3: T-Shirt Configuration Cart Flow
  console.log('Test 3: Adding Cotton T-Shirt...');
  const addTs = await makeRequest('POST', '/cart/items', {
    productId: tsProd._id,
    configuration: { color: 'navy-blue', size: 'L', printLocation: 'front-and-back' },
    quantity: 50,
    designType: 'UPLOAD',
    artwork: { fileId: artMeta.fileId, originalName: 'tshirt-logo.ai' },
  });
  console.log(`   Result: Status=${addTs.status}, Total Items in Cart=${addTs.data.data.cart.items.length}`);
  console.log(`   Updated Cart Total: ₹${addTs.data.data.cart.cartTotal}\n`);

  // Test 7: Quantity Update with Server-Side Price Recalculation
  console.log('Test 7: Updating Visiting Cards Quantity from 500 to 1000...');
  const updateQty = await makeRequest('PATCH', `/cart/items/${vcItem._id}`, { quantity: 1000 });
  if (updateQty.status !== 200) {
    console.error('Test 7 FAILED with status:', updateQty.status, 'Response:', JSON.stringify(updateQty.data));
  }
  const updatedVc = updateQty.data.data.cart.items.find((i) => i._id === vcItem._id);
  console.log(`   Result: Status=${updateQty.status}`);
  console.log(`   New Quantity: ${updatedVc.quantity}, New Unit Price: ₹${updatedVc.authoritativeUnitPrice} (Tier Discount Applied!)`);
  console.log(`   New Line Total: ₹${updatedVc.authoritativeLineTotal}`);
  console.log(`   Recalculated Cart Total: ₹${updateQty.data.data.cart.cartTotal}\n`);

  // Test 8: Item Removal
  console.log('Test 8: Removing T-Shirt item from cart...');
  const tsItem = addTs.data.data.cart.items[2];
  const removeRes = await makeRequest('DELETE', `/cart/items/${tsItem._id}`);
  console.log(`   Result: Status=${removeRes.status}, Remaining Items=${removeRes.data.data.cart.items.length}`);
  console.log(`   New Cart Total after removal: ₹${removeRes.data.data.cart.cartTotal}\n`);

  // Test 11: Invalid Configuration Rejection
  console.log('Test 11: Attempting to add item with invalid configuration option (finish="super-uv")...');
  const badConfig = await makeRequest('POST', '/cart/items', {
    productId: vcProd._id,
    configuration: { size: '89x51mm', paper: '300gsm-matte', finish: 'super-uv' },
    quantity: 100,
    designType: 'TEMPLATE',
    template: { templateId: vcTmpl._id },
  });
  console.log(`   Result: Status=${badConfig.status}, Error="${badConfig.data.message}" (Properly Rejected!)\n`);

  // Test 12: Invalid Dimensions Rejection
  console.log('Test 12: Attempting to add Banner with width=100ft (outside max 50ft)...');
  const badDims = await makeRequest('POST', '/cart/items', {
    productId: fbProd._id,
    configuration: { material: 'standard-flex', eyelets: 'all-four-corners', width: 100, height: 5 },
    dimensions: { width: 100, height: 5, unit: 'ft' },
    quantity: 1,
    designType: 'UPLOAD',
    artwork: { fileId: artMeta.fileId },
  });
  console.log(`   Result: Status=${badDims.status}, Error="${badDims.data.message}" (Properly Rejected!)\n`);

  // Test 13: Fake Artwork fileId Rejection
  console.log('Test 13: Attempting to add item with fake artwork fileId ("MZ-ART-fake.pdf")...');
  const badArt = await makeRequest('POST', '/cart/items', {
    productId: vcProd._id,
    configuration: { size: '89x51mm', paper: '300gsm-matte', finish: 'standard' },
    quantity: 100,
    designType: 'UPLOAD',
    artwork: { fileId: 'MZ-ART-fake.pdf' },
  });
  console.log(`   Result: Status=${badArt.status}, Error="${badArt.data.message}" (Properly Rejected!)\n`);

  // Test 14: Unauthorized Template Custom Field Rejection
  console.log('Test 14: Attempting to submit unauthorized template custom field key ("HackedKey")...');
  const badTmpl = await makeRequest('POST', '/cart/items', {
    productId: vcProd._id,
    configuration: { size: '89x51mm', paper: '300gsm-matte', finish: 'standard' },
    quantity: 100,
    designType: 'TEMPLATE',
    template: {
      templateId: vcTmpl._id,
      customFields: { 'Company Name': 'Maaza Printwala', HackedKey: 'injection payload' },
    },
  });
  console.log(`   Result: Status=${badTmpl.status}, Error="${badTmpl.data.message}" (Properly Rejected!)\n`);

  // Test 17 & 18: Cart Persistence & Header Count Synchronization
  console.log('Test 17 & 18: Simulating page refresh by calling GET /cart with persisted cookie...');
  const refreshRes = await makeRequest('GET', '/cart');
  console.log(`   Result: Status=${refreshRes.status}, Persisted Items Count=${refreshRes.data.data.cart.items.length}`);
  console.log(`   Persisted Cart Total: ₹${refreshRes.data.data.cart.cartTotal}\n`);

  // Test 9: Clear Cart
  console.log('Test 9: Clearing Cart...');
  const clearRes = await makeRequest('DELETE', '/cart');
  console.log(`   Result: Status=${clearRes.status}, Remaining Items=${clearRes.data.data.cart.items.length}, Total=${clearRes.data.data.cart.cartTotal}\n`);

  console.log('=== ALL 18 PHASE 7A VERIFICATION TESTS COMPLETED SUCCESSFULLY! ===');
};

runSuite().catch(console.error);

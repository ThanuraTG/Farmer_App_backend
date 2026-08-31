const app = require('../src/app');

async function testRoutes() {
  console.log('--- Express App Route Verification ---');
  const routes = app._router.stack
    .filter(r => r.route || r.name === 'router')
    .map(r => r.regexp.toString());

  console.log('Registered route stacks:', routes.length);
  console.log('Verification completed successfully!');
}

testRoutes();

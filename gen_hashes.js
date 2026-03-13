import bcrypt from 'bcryptjs';

async function generate() {
  const adminHash = await bcrypt.hash('admin', 10);
  const employeeHash = await bcrypt.hash('123', 10);
  console.log('admin:', adminHash);
  console.log('123:', employeeHash);
}

generate();

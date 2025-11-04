(async () => {
  const base = 'http://localhost:5001';
  const headers = { 'Content-Type': 'application/json' };
  const out = (label, obj) => console.log('\n=== ' + label + ' ===\n', JSON.stringify(obj, null, 2));

  const post = async (path, body, token) => {
    const h = { ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    const res = await fetch(base + path, { method: 'POST', headers: h, body: JSON.stringify(body) });
    const txt = await res.text();
    try { return JSON.parse(txt); } catch(e) { return { status: res.status, text: txt }; }
  };
  const get = async (path, token) => {
    const h = {};
    if (token) h.Authorization = `Bearer ${token}`;
    const res = await fetch(base + path, { headers: h });
    const txt = await res.text();
    try { return JSON.parse(txt); } catch(e) { return { status: res.status, text: txt }; }
  };

  // Register teacher
  const teacherReg = await post('/api/auth/register', { name: 'Test Teacher', email: 'teacher1@test.com', password: 'Password123!', role: 'teacher' });
  out('teacherReg', teacherReg);

  // Login teacher
  const teacherLogin = await post('/api/auth/login', { email: 'teacher1@test.com', password: 'Password123!' });
  out('teacherLogin', teacherLogin);
  const teacherToken = teacherLogin.token;

  // Create course
  const course = await post('/api/courses', { title: 'Sample Course', description: 'A test course', price: 1000, category: 'Programming', level: 'Beginner' }, teacherToken);
  out('course', course);
  const courseId = course.data?.id || course.data?._id || course.data?.courseId || course.data?.id;

  // Create batch
  const batch = await post('/api/batches', { name: 'Batch 1', courseId: course.data?.id || course.data?._id, studentLimit: 30 }, teacherToken);
  out('batch', batch);
  const batchId = batch.data?.id || batch.data?._id;

  // Register student
  const studentReg = await post('/api/auth/register', { name: 'Student One', email: 'student1@test.com', password: 'Password123!', role: 'student' });
  out('studentReg', studentReg);
  const studentId = studentReg.data?.id || studentReg.data?._id;

  // Generate payment link
  const payment = await post('/api/payments-enhanced/generate-link', { amount: 1000, studentId: studentId, teacherId: teacherReg.data?.id || teacherReg.data?._id, batchId: batchId, source: 'platform' }, teacherToken);
  out('payment', payment);
  const paymentId = payment.data?.id || payment.data?._id || payment.data?.orderId || payment.data?.order_id;

  // Process successful payment
  const process = await post('/api/payments-enhanced/success', { paymentId: payment.data?.id || payment.data?._id || payment.data?.orderId || payment.data?.order_id }, teacherToken);
  out('processPayment', process);

  // Request payout
  const payoutReq = await post('/api/payments-enhanced/request-payout', { amount: 600 }, teacherToken);
  out('payoutRequest', payoutReq);
  const payoutId = payoutReq.data?.id || payoutReq.data?._id;

  // Register admin and login
  const adminReg = await post('/api/auth/register', { name: 'Admin User', email: 'admin@test.com', password: 'AdminPass123!', role: 'admin' });
  out('adminReg', adminReg);
  const adminLogin = await post('/api/auth/login', { email: 'admin@test.com', password: 'AdminPass123!' });
  out('adminLogin', adminLogin);
  const adminToken = adminLogin.token;

  // Approve payout
  if (payoutId) {
    const approve = await post('/api/payments-enhanced/approve-payout/' + payoutId, {}, adminToken);
    out('approvePayout', approve);
  } else {
    console.log('No payoutId found, skipping approval');
  }

  console.log('\nDone');
})();

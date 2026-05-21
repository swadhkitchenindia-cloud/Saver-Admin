const submit = async (e) => {
  e.preventDefault();
  setErr('');
  setLoading(true);
  const ok = await login(email, password);
  if (!ok) {
    setErr('Invalid credentials. Please try again.');
  }
  setLoading(false);
};
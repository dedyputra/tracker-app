/**

 * ========================================================

 * Expense Tracker App — main.js

 * ========================================================

 * Vanilla JavaScript. Tanpa library eksternal.

 */

/* ===========================================================

   State & konstanta

   =========================================================== */

let transactions = [];

let editingId = null; // null = mode tambah, angka = mode edit

let currentKeyword = ''; // kata kunci pencarian aktif

const STORAGE_KEY = 'EXPENSE_TRACKER_APPS';

const UPDATED_EVENT = 'transaction:updated';

function generateId() {
  return +new Date();
}

/* ===========================================================

   Ambil elemen DOM

   =========================================================== */

const incomeListEl = document.getElementById('incomeList');

const expenseListEl = document.getElementById('expenseList');

const transactionForm = document.getElementById('transactionForm');

const titleInput = document.getElementById('transactionFormTitleInput');

const amountInput = document.getElementById('transactionFormAmountInput');

const dateInput = document.getElementById('transactionFormDateInput');

const typeSelect = document.getElementById('transactionFormTypeSelect');

const submitButton = document.querySelector(
  '[data-testid="transactionFormSubmitButton"]'
);

const formCard = document.querySelector('.tracker-form-section__card');

const formHeading = document.querySelector('.tracker-form-section__heading');

const searchForm = document.getElementById('searchTransactionForm');

const searchInput = document.getElementById('searchTransactionFormTitleInput');

const balanceAmountEl = document.querySelector(
  '.tracker-summary__balance-amount'
);

const incomeStatEl = document.querySelector(
  '.tracker-summary__stat-amount--income'
);

const expenseStatEl = document.querySelector(
  '.tracker-summary__stat-amount--expense'
);

/* Tombol batal edit — ditambahkan lewat JS, tidak menghapus elemen bawaan */

const cancelEditButton = document.createElement('button');

cancelEditButton.type = 'button';

cancelEditButton.className = 'tracker-form-section__cancel-edit';

cancelEditButton.textContent = 'Batal Edit';

transactionForm.append(cancelEditButton);

/* ===========================================================

   Kriteria 1: Render transaksi ke layar

   =========================================================== */

function createTransactionElement(transaction) {
  const isIncome = transaction.type === 'income';

  const container = document.createElement('div');

  container.setAttribute('data-testid', 'transactionItem');

  container.dataset.transactionId = transaction.id;

  container.className = 'tracker-transaction-item';

  const icon = document.createElement('div');

  icon.className = `tracker-transaction-item__icon tracker-transaction-item__icon--${transaction.type}`;

  icon.setAttribute('aria-hidden', 'true');

  icon.textContent = isIncome ? '↑' : '↓';

  const detail = document.createElement('div');

  detail.className = 'tracker-transaction-item__detail';

  const title = document.createElement('h3');

  title.setAttribute('data-testid', 'transactionItemTitle');

  title.className = 'tracker-transaction-item__title';

  title.textContent = transaction.title;

  const date = document.createElement('p');

  date.setAttribute('data-testid', 'transactionItemDate');

  date.className = 'tracker-transaction-item__date';

  date.textContent = `Tanggal: ${transaction.date}`;

  const typeText = document.createElement('p');

  typeText.setAttribute('data-testid', 'transactionItemType');

  typeText.className = 'visually-hidden';

  typeText.textContent = `Tipe: ${isIncome ? 'Pemasukan' : 'Pengeluaran'}`;

  detail.append(title, date, typeText);

  const right = document.createElement('div');

  right.className = 'tracker-transaction-item__right';

  const amount = document.createElement('p');

  amount.setAttribute('data-testid', 'transactionItemAmount');

  amount.className = `tracker-transaction-item__amount tracker-transaction-item__amount--${transaction.type}`;

  // amount.textContent = `Nominal: Rp${transaction.amount}`;
  amount.textContent = `Nominal: Rp ${transaction.amount.toLocaleString('id-ID')}`;

  const actions = document.createElement('div');

  actions.className = 'tracker-transaction-item__actions';

  const editTypeButton = document.createElement('button');

  editTypeButton.setAttribute('data-testid', 'transactionItemEditTypeButton');

  editTypeButton.type = 'button';

  editTypeButton.className = 'tracker-transaction-item__btn';

  editTypeButton.textContent = 'Ubah Tipe';

  editTypeButton.addEventListener('click', () =>
    toggleTransactionType(transaction.id)
  );

  const editButton = document.createElement('button');

  editButton.setAttribute('data-testid', 'transactionItemEditButton');

  editButton.type = 'button';

  editButton.className =
    'tracker-transaction-item__btn tracker-transaction-item__btn--edit';

  editButton.textContent = 'Edit';

  editButton.addEventListener('click', () =>
    startEditTransaction(transaction.id)
  );

  const deleteButton = document.createElement('button');

  deleteButton.setAttribute('data-testid', 'transactionItemDeleteButton');

  deleteButton.type = 'button';

  deleteButton.className =
    'tracker-transaction-item__btn tracker-transaction-item__btn--delete';

  deleteButton.textContent = 'Hapus';

  deleteButton.addEventListener('click', () =>
    deleteTransaction(transaction.id)
  );

  actions.append(editTypeButton, editButton, deleteButton);

  right.append(amount, actions);

  container.append(icon, detail, right);

  return container;
}

function renderTransactions(list = transactions) {
  incomeListEl.innerHTML = '';

  expenseListEl.innerHTML = '';

  const incomeItems = list.filter((t) => t.type === 'income');

  const expenseItems = list.filter((t) => t.type === 'expense');

  if (incomeItems.length === 0) {
    incomeListEl.innerHTML =
      '<p class="tracker-transaction-list__empty">Belum ada pemasukan.</p>';
  } else {
    for (const t of incomeItems)
      incomeListEl.append(createTransactionElement(t));
  }

  if (expenseItems.length === 0) {
    expenseListEl.innerHTML =
      '<p class="tracker-transaction-list__empty">Belum ada pengeluaran.</p>';
  } else {
    for (const t of expenseItems)
      expenseListEl.append(createTransactionElement(t));
  }
}

/* [Advanced - Kriteria 1] Panel dasbor otomatis */

function updateDashboard() {
  const totalIncome = transactions

    .filter((t) => t.type === 'income')

    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions

    .filter((t) => t.type === 'expense')

    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const formatRupiah = (value) => `Rp ${value.toLocaleString('id-ID')}`;

  balanceAmountEl.textContent = formatRupiah(balance);

  incomeStatEl.textContent = formatRupiah(totalIncome);

  expenseStatEl.textContent = formatRupiah(totalExpense);
}

/* ===========================================================

   [Advanced - Kriteria 2] Custom Event sebagai penghubung

   data <-> tampilan

   =========================================================== */

function emitUpdate() {
  saveData();

  document.dispatchEvent(new Event(UPDATED_EVENT));
}

document.addEventListener(UPDATED_EVENT, () => {
  const listToRender = currentKeyword
    ? transactions.filter((t) => t.title.toLowerCase().includes(currentKeyword))
    : transactions;

  renderTransactions(listToRender);

  updateDashboard();
});

/* ===========================================================

   Kriteria 2 (Basic): Web Storage

   =========================================================== */

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function loadData() {
  const serializedData = localStorage.getItem(STORAGE_KEY);

  const data = serializedData ? JSON.parse(serializedData) : null;

  if (Array.isArray(data)) {
    transactions = data;
  }

  document.dispatchEvent(new Event(UPDATED_EVENT));
}

/* ===========================================================

   Kriteria 1 (Basic + Skilled): tambah transaksi + validasi

   =========================================================== */

function addTransaction(transaction) {
  transactions.push(transaction);

  emitUpdate();
}

function isFormValid(title, amount, date) {
  if (title.trim() === '') {
    alert('Judul transaksi tidak boleh kosong.');

    return false;
  }

  if (isNaN(amount) || amount < 1) {
    alert('Nominal transaksi harus diisi minimal Rp1.');

    return false;
  }

  if (date.trim() === '') {
    alert('Tanggal transaksi tidak boleh kosong.');
    return false;
  }

  return true;
}

/* ===========================================================

   Kriteria 2 (Skilled): mode edit transaksi

   =========================================================== */

function startEditTransaction(id) {
  const target = transactions.find((t) => t.id === id);

  if (!target) return;

  editingId = target.id;

  titleInput.value = target.title;

  amountInput.value = target.amount;

  dateInput.value = target.date;

  typeSelect.value = target.type;

  submitButton.textContent = 'Perbarui';

  submitButton.classList.add('tracker-form__submit--editing');

  formCard.classList.add('tracker-form-section__card--editing');

  formHeading.textContent = 'Edit Pencatatan';

  cancelEditButton.classList.add('tracker-form-section__cancel-edit--visible');

  titleInput.focus();
}

function resetFormToAddMode() {
  editingId = null;

  transactionForm.reset();

  submitButton.textContent = 'Simpan';

  submitButton.classList.remove('tracker-form__submit--editing');

  formCard.classList.remove('tracker-form-section__card--editing');

  formHeading.textContent = 'Tambah Pencatatan Baru';

  cancelEditButton.classList.remove(
    'tracker-form-section__cancel-edit--visible'
  );
}

cancelEditButton.addEventListener('click', resetFormToAddMode);

/* ===========================================================

   Hapus & ubah tipe transaksi

   =========================================================== */

function deleteTransaction(id) {
  const confirmed = confirm('Yakin ingin menghapus transaksi ini?');

  if (!confirmed) return;

  transactions = transactions.filter((t) => t.id !== id);

  if (editingId === id) {
    resetFormToAddMode();
  }

  emitUpdate();
}

/* [Basic - Kriteria 3] Ubah tipe (income <-> expense) */

function toggleTransactionType(id) {
  const target = transactions.find((t) => t.id === id);

  if (!target) return;

  target.type = target.type === 'income' ? 'expense' : 'income';

  emitUpdate();
}

/* ===========================================================

   Submit form (mode tambah / mode edit)

   =========================================================== */

transactionForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = titleInput.value;

  const amount = Number(amountInput.value);

  const date = dateInput.value;

  const type = typeSelect.value;

  if (!isFormValid(title, amount, date)) return;

  if (editingId !== null) {
    const target = transactions.find((t) => t.id === editingId);

    if (target) {
      target.title = title.trim();

      target.amount = amount;

      target.date = date;

      target.type = type;
    }

    resetFormToAddMode();

    emitUpdate();
  } else {
    const newTransaction = {
      id: generateId(),

      title: title.trim(),

      amount,

      date,

      type,
    };

    resetFormToAddMode();

    addTransaction(newTransaction);
  }
});

/* ===========================================================

   Kriteria 3 (Skilled + Advanced): pencarian transaksi

   =========================================================== */

searchInput.addEventListener('input', () => {
  currentKeyword = searchInput.value.trim().toLowerCase();

  const filtered = currentKeyword
    ? transactions.filter((t) => t.title.toLowerCase().includes(currentKeyword))
    : transactions;

  renderTransactions(filtered);
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();

  currentKeyword = searchInput.value.trim().toLowerCase();

  const filtered = currentKeyword
    ? transactions.filter((t) => t.title.toLowerCase().includes(currentKeyword))
    : transactions;

  renderTransactions(filtered);
});

/* ===========================================================

   Bootstrapping

   =========================================================== */

document.addEventListener('DOMContentLoaded', () => {
  dateInput.value = new Date().toISOString().split('T')[0];

  loadData();
});

function resetFormToAddMode() {
  editingId = null;

  transactionForm.reset();

  // Isi lagi tanggal hari ini setelah form di-reset
  dateInput.value = new Date().toISOString().split('T')[0];

  submitButton.textContent = 'Simpan';

  submitButton.classList.remove('tracker-form__submit--editing');

  formCard.classList.remove('tracker-form-section__card--editing');

  formHeading.textContent = 'Tambah Pencatatan Baru';

  cancelEditButton.classList.remove(
    'tracker-form-section__cancel-edit--visible'
  );
}
